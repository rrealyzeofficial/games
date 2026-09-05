// GHI ĐÈ BẢO VỆ: Chặn không cho ứng dụng tự động Logout khi gặp lỗi
window.clearAuth = function(reason) {
    console.error("=== PHÁT HIỆN TÁC NHÂN ĐẨY RA LOGIN ===");
    console.error("Lý do:", reason);
    console.trace(); // In ra toàn bộ dấu vết lịch sử gọi hàm
    alert("Đã chặn văng out Login! Hãy mở F12 Console xem log màu đỏ.");
};

/* =========================================================
   REALYZE!!
   Main JavaScript
========================================================= */


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function finiteNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeLobbyResources(user) {
    if (!user) return;
    // Preserve a real zero. Only repair missing/invalid values.
    if (!Number.isFinite(Number(user.gems))) user.gems = 0;
    if (!Number.isFinite(Number(user.coins))) user.coins = 0;
    if (!Number.isFinite(Number(user.tickets))) user.tickets = 0;
}


/* =========================================================
   MOBILE ORIENTATION
   REALYZE!! is landscape-only on mobile. Browsers may refuse
   orientation.lock() unless running fullscreen/PWA, so a portrait
   guard is also used in CSS.
========================================================= */
(function initMobileLandscape() {
    const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

    async function lockLandscape() {
        if (!isMobile()) return;
        try {
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock("landscape");
            }
        } catch (_) {
            // Normal mobile browsers can reject orientation.lock().
        }
    }

    window.addEventListener("orientationchange", lockLandscape, { passive: true });
    document.addEventListener("DOMContentLoaded", lockLandscape, { once: true });
    document.addEventListener("click", lockLandscape, { passive: true });
    document.addEventListener("touchstart", lockLandscape, { passive: true });
})();

function getUsers() {
    try { const cached = JSON.parse(localStorage.getItem("realyze_user_cache") || "null"); return cached?.username ? {[cached.username]: cached} : {}; } catch { return {}; }
}
function saveUsers(users) { const current = localStorage.getItem("realyze_current_user"); if (current && users?.[current]) localStorage.setItem("realyze_user_cache", JSON.stringify(users[current])); }
const API_BASE = "";

async function getDbSession() {
    if (!window.REALYZE_DB) throw new Error("Supabase chưa được cấu hình. Hãy sửa supabase-config.js.");
    const { data, error } = await window.REALYZE_DB.auth.getSession();
    if (error) throw error;
    return data.session;
}

async function loadRemoteUser() {
    const session = await getDbSession();
    if (!session?.user) throw new Error("Unauthorized");
    const db = window.REALYZE_DB;
    const { data: profile, error: profileError } = await db.from("profiles").select("id, username, game_data, created_at").eq("id", session.user.id).single();
    if (profileError) throw profileError;
    const { data: fd, error: fdError } = await db.rpc("get_friend_data");
    if (fdError) throw fdError;
    return {
        ...(profile.game_data || {}),
        username: profile.username,
        friends: fd?.friends || [],
        friendRequests: fd?.friendRequests || [],
        sentFriendRequests: fd?.sentFriendRequests || [],
        _supabaseId: profile.id
    };
}

async function apiRequest(path, options = {}) {
    const db = window.REALYZE_DB;
    if (!db) throw new Error("Supabase chưa được cấu hình. Hãy sửa supabase-config.js.");
    const method = (options.method || "GET").toUpperCase();
    let body = {};
    try { body = options.body ? JSON.parse(options.body) : {}; } catch (_) {}

    if (path === "/api/register" && method === "POST") {
        const username = String(body.username || "").trim();
        const password = String(body.password || "");
        const email = `${username.toLowerCase()}@accounts.realyze.local`;
        const { data, error } = await db.auth.signUp({ email, password, options: { data: { username } } });
        if (error) throw new Error(error.message);
        if (!data.session) throw new Error("Đăng ký thành công. Hãy tắt Email Confirmations trong Supabase Auth để đăng nhập ngay bằng ID Name.");
        const user = await loadRemoteUser();
        return { user };
    }

    if (path === "/api/login" && method === "POST") {
        const username = String(body.username || "").trim();
        const email = `${username.toLowerCase()}@accounts.realyze.local`;
        const { data, error } = await db.auth.signInWithPassword({ email, password: String(body.password || "") });
        if (error) throw new Error("ID Name hoặc Password không đúng.");
        const user = await loadRemoteUser();
        return { user };
    }

    if (path === "/api/me" && method === "GET") return { user: await loadRemoteUser() };

    if (path === "/api/user" && method === "PUT") {
        await getDbSession();
        const incoming = body.user || {};
        const allowed = ['gems','coins','tickets','rank','rankXp','gachaPity','characterPity','akitoPity','shotaPity','gachaHistory','myCards','myCharacters','characterProgress','selectedCharacterId','lobbyCharacterId','eventPoints','eventEnergy','eventEnergyUpdatedAt','eventClaimedRewards','eventShopPurchases','eventMailbox','eventTeam','eventCardMemory','eventMusic','rhythmProgress'];
        const session = await getDbSession();
        if (!session?.user?.id) throw new Error("Unauthorized");

        // IMPORTANT: do not read the remote profile before every write.
        // Rapid upgrades can otherwise read an older server snapshot and write it back,
        // causing LV.6 -> 7 -> 8 -> 9 -> 6 style rollbacks.
        const gameData = Object.fromEntries(
            allowed
                .filter(k => Object.prototype.hasOwnProperty.call(incoming, k))
                .map(k => [k, incoming[k]])
        );
        const { error } = await db.from("profiles")
            .update({ game_data: gameData })
            .eq("id", session.user.id);
        if (error) throw error;

        // Return the exact state we just wrote. Do not replace the local cache with
        // another remote read while newer client changes may already be pending.
        return { user: { ...incoming, _supabaseId: session.user.id } };
    }

    if (path.startsWith("/api/friends/search") && method === "GET") {
        const q = new URLSearchParams(path.split("?")[1] || "").get("q")?.trim() || "";
        const { data, error } = await db.rpc("search_profile", { search_username: q });
        if (error) throw error;
        const target = data?.[0];
        if (!target) throw new Error("Không tìm thấy ID Name này.");
        return { user: { username: target.username, _supabaseId: target.id } };
    }

    const rpcMap = {
        "/api/friends/request": "send_friend_request",
        "/api/friends/accept": "accept_friend_request",
        "/api/friends/decline": "decline_friend_request",
        "/api/friends/cancel": "cancel_friend_request"
    };
    if (method === "POST" && rpcMap[path]) {
        const arg = Object.values(body)[0];
        const { error } = await db.rpc(rpcMap[path], { [rpcMap[path] === "send_friend_request" || rpcMap[path] === "cancel_friend_request" ? "target_username" : "requester_username"]: String(arg || "") });
        if (error) throw error;
        return { user: await loadRemoteUser() };
    }

    if (path.startsWith("/api/friends/chat") && method === "GET") {
        const q = new URLSearchParams(path.split("?")[1] || "").get("username")?.trim() || "";
        const { data: targetRows, error: targetError } = await db.rpc("search_profile", { search_username: q });
        if (targetError || !targetRows?.[0]) throw new Error("User not found.");
        const session = await getDbSession();
        const targetId = targetRows[0].id;
        const { data, error } = await db.from("messages").select("id, sender_id, receiver_id, body, created_at").or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${session.user.id})`).order("created_at", { ascending: true });
        if (error) throw error;
        const me = await loadRemoteUser();
        return { messages: (data || []).map(m => ({ from: m.sender_id === session.user.id ? me.username : q, text: m.body, time: new Date(m.created_at).getTime() })) };
    }

if (path === "/api/friends/chat" && method === "POST") {
    const username = String(body.username || "").trim();
    const text = String(body.text || "").trim();

    if (!username || !text) {
        throw new Error("Tin nhắn không được để trống.");
    }

    // Gọi trực tiếp hàm RPC gửi tin nhắn trên Supabase
    const { data, error } = await db.rpc("send_friend_message", {
        target_username: username,
        message_body: text
    });

    if (error) {
        console.error("SUPABASE RPC ERROR:", error);
        throw new Error(error.message || "Lỗi từ cơ sở dữ liệu Supabase.");
    }

    return { ok: true };
}

    if (path.startsWith("/api/daily-attendance") && method === "GET") {
        await getDbSession();
        const query = path.includes("?") ? path.split("?")[1] : "";
        const month = new URLSearchParams(query).get("month");
        const parts = getVietnamDateParts();
        const monthKey = month || `${parts.year}-${String(parts.month).padStart(2, "0")}`;
        const { data, error } = await db.rpc("get_daily_attendance", { month_key_input: monthKey });
        if (error) throw new Error(error.message || "Không thể tải lịch điểm danh.");
        return { attendance: data || [] };
    }

    if (path === "/api/daily-attendance/claim" && method === "POST") {
        await getDbSession();
        const { data, error } = await db.rpc("claim_daily_attendance");
        if (error) throw new Error(error.message || "Không thể nhận thưởng điểm danh.");
        const user = await loadRemoteUser();
        cacheUser(user);
        return { result: data || {}, user };
    }

    throw new Error("API route not found.");
}

function cacheUser(user) {
    if (user?.username) {
        localStorage.setItem("realyze_current_user", user.username);
        localStorage.setItem("realyze_user_cache", JSON.stringify(user));
    }
}

async function clearAuth() {
    try { if (window.REALYZE_DB) await window.REALYZE_DB.auth.signOut(); } catch (_) {}
    localStorage.removeItem("realyze_current_user");
    localStorage.removeItem("realyze_auth_token");
    localStorage.removeItem("realyze_user_cache");
}

function showToast(
    element,
    duration = 2600
) {
    if (!element) return;

    element.classList.add("show");

    clearTimeout(
        element._toastTimer
    );

    element._toastTimer =
        setTimeout(() => {
            element.classList.remove("show");
        }, duration);
}


/* =========================================================
   SCREEN SWITCHING
========================================================= */

const COLLECTION_MUSIC_SCREENS = new Set([
    "gachaScreen",
    "cardScreen",
    "characterScreen"
]);

let collectionBackgroundMusic = null;

function stopCollectionBackgroundMusic() {
    if (!collectionBackgroundMusic) return;

    collectionBackgroundMusic.pause();
    collectionBackgroundMusic.currentTime = 0;
    collectionBackgroundMusic.src = "";
    collectionBackgroundMusic.load();
    collectionBackgroundMusic = null;
}

function startCollectionBackgroundMusic() {
    if (collectionBackgroundMusic) {
        if (collectionBackgroundMusic.paused) {
            collectionBackgroundMusic.play().catch(() => {});
        }
        return;
    }

    collectionBackgroundMusic = new Audio("assets/bg.mp3");
    collectionBackgroundMusic.loop = true;
    collectionBackgroundMusic.preload = "auto";
    collectionBackgroundMusic.volume = 0.12;

    collectionBackgroundMusic.play().catch(error => {
        // Trình duyệt có thể chặn autoplay; lần click chuyển màn hình tiếp theo sẽ thử lại.
        console.log("Collection background music waiting for user interaction:", error);
    });
}

// Mobile/Safari đôi khi cần một thao tác chạm thật để cho phép audio phát.
// Nếu người dùng đã ở một trong 3 màn, lần chạm đầu tiên sẽ resume track.
document.addEventListener("pointerdown", () => {
    const activeCollectionScreen = document.querySelector(
        ".game-screen:not(.hidden)#gachaScreen, .game-screen:not(.hidden)#cardScreen, .game-screen:not(.hidden)#characterScreen"
    );

    if (activeCollectionScreen && collectionBackgroundMusic?.paused) {
        collectionBackgroundMusic.play().catch(() => {});
    }
}, { passive: true });

function showScreen(screenId) {

    if (
        typeof gameplayAudio !== "undefined" &&
        gameplayAudio &&
        screenId !== "gameplayScreen"
    ) {
        stopGameplayAudio();
    }

    if (
        typeof stopLobbyMusic === "function" &&
        screenId !== "lobbyScreen"
    ) {
        stopLobbyMusic();
    }

    // Gacha / My Card / My Character dùng chung một track.
    // Chuyển giữa 3 màn không restart nhạc; ra khỏi cả 3 thì dừng hẳn.
    if (COLLECTION_MUSIC_SCREENS.has(screenId)) {
        startCollectionBackgroundMusic();
    } else {
        stopCollectionBackgroundMusic();
    }

    document
        .querySelectorAll(
            ".screen, .game-screen"
        )
        .forEach(screen => {
            screen.classList.add("hidden");
        });

    const target = $(screenId);

    if (target) {
        target.classList.remove("hidden");
    }

    if (
        screenId === "lobbyScreen" &&
        typeof startLobbyMusic === "function"
    ) {
        startLobbyMusic();
    }
}


/* =========================================================
   AUTH
========================================================= */

let authMode = "login";


const loginTab =
    $("loginTab");

const registerTab =
    $("registerTab");

const switchButton =
    $("switchButton");

const registerFields =
    $("registerFields");

const usernameInput =
    $("username");

const passwordInput =
    $("password");

const confirmPasswordInput =
    $("confirmPassword");

const authForm =
    $("authForm");

const message =
    $("message");

const submitButton =
    $("submitButton");

const togglePassword =
    $("togglePassword");


/* =========================================================
   AUTH MODE
========================================================= */

function setAuthMode(mode) {

    authMode = mode;

    if (message) {
        message.textContent = "";
    }

    if (mode === "login") {

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

        registerFields.classList.add("hidden");

        confirmPasswordInput.required =
            false;

        submitButton.textContent =
            "LOGIN";

        switchButton.innerHTML =
            `Don't have an account? <b>REGISTER</b>`;

        passwordInput.autocomplete =
            "current-password";

    } else {

        registerTab.classList.add("active");
        loginTab.classList.remove("active");

        registerFields.classList.remove("hidden");

        confirmPasswordInput.required =
            true;

        submitButton.textContent =
            "CREATE ACCOUNT";

        switchButton.innerHTML =
            `Already have an account? <b>LOGIN</b>`;

        passwordInput.autocomplete =
            "new-password";
    }
}


loginTab.addEventListener(
    "click",
    () => {
        setAuthMode("login");
    }
);


registerTab.addEventListener(
    "click",
    () => {
        setAuthMode("register");
    }
);


switchButton.addEventListener(
    "click",
    () => {

        if (authMode === "login") {
            setAuthMode("register");
        } else {
            setAuthMode("login");
        }

    }
);


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

togglePassword.addEventListener(
    "click",
    () => {

        if (
            passwordInput.type ===
            "password"
        ) {

            passwordInput.type =
                "text";

            togglePassword.textContent =
                "◎";

        } else {

            passwordInput.type =
                "password";

            togglePassword.textContent =
                "◉";
        }

    }
);


/* =========================================================
   AUTH VALIDATION
========================================================= */

function validUsername(username) {

    return /^[A-Za-z0-9_]{3,20}$/.test(
        username
    );
}


async function registerUser(username,password,confirmPassword){
    if(!validUsername(username))return{success:false,text:"ID Name phải từ 3–20 ký tự và chỉ dùng A-Z, 0-9 hoặc _."};
    if(password.length<6)return{success:false,text:"Password phải có ít nhất 6 ký tự."};
    if(password!==confirmPassword)return{success:false,text:"Mật khẩu xác nhận không khớp."};
    try{const d=await apiRequest("/api/register",{method:"POST",body:JSON.stringify({username,password})});cacheUser(d.user);return{success:true,user:d.user};}catch(e){return{success:false,text:e.message};}
}
async function loginUser(username,password){try{const d=await apiRequest("/api/login",{method:"POST",body:JSON.stringify({username,password})});cacheUser(d.user);return{success:true,user:d.user};}catch(e){return{success:false,text:e.message};}}


/* =========================================================
   AUTH SUBMIT
========================================================= */

authForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        message.textContent =
            "";


        /* =================================
           REGISTER
        ================================= */

        if (authMode === "register") {

            const confirmPassword =
                confirmPasswordInput.value;


            const result =
                await registerUser(
                    username,
                    password,
                    confirmPassword
                );


            if (!result.success) {

                message.style.color =
                    "#ef557f";

                message.textContent =
                    result.text;

                return;
            }


            message.style.color =
                "#37a97f";

            message.textContent =
                "Đăng ký thành công! Hãy đăng nhập bằng tài khoản mới.";


            usernameInput.value =
                username;

            passwordInput.value =
                "";

            confirmPasswordInput.value =
                "";


            setAuthMode(
                "login"
            );


            return;
        }


        /* =================================
           LOGIN
        ================================= */

        const result =
            await loginUser(
                username,
                password
            );


        if (!result.success) {

            message.style.color =
                "#ef557f";

            message.textContent =
                result.text;

            return;
        }


        localStorage.setItem(
            "realyze_current_user",
            username
        );


        startLoading(
            result.user
        );

    }
);


/* =========================================================
   LOADING
========================================================= */

function startLoading(user) {

    showScreen(
        "loadingScreen"
    );


    const progress =
        $("loadingProgress");

    const loadingText =
        $("loadingText");


    progress.style.width =
        "0%";


    const texts = [

        "TUNING YOUR WORLD...",

        "CALLING THE RHYTHM...",

        "PREPARING YOUR STAGE...",

        "WELCOME TO REALYZE!!"

    ];


    let value = 0;


    const interval =
        setInterval(
            () => {

                value += 4;


                progress.style.width =
                    `${value}%`;


                if (value >= 25) {
                    loadingText.textContent =
                        texts[1];
                }


                if (value >= 50) {
                    loadingText.textContent =
                        texts[2];
                }


                if (value >= 75) {
                    loadingText.textContent =
                        texts[3];
                }


                if (value >= 100) {

                    clearInterval(
                        interval
                    );


                    setTimeout(
                        () => {

                            setupLobby(
                                user
                            );

                            showScreen(
                                "lobbyScreen"
                            );

                            scheduleDailyAttendanceOnLogin();

                        },
                        300
                    );
                }

            },
            45
        );
}


/* =========================================================
   USER DATA
========================================================= */

function getCurrentUser(){try{return JSON.parse(localStorage.getItem("realyze_user_cache")||"null");}catch{return null;}}
let userSyncChain = Promise.resolve();
let userSyncVersion = 0;
function updateUser(user){
    if (!user?.username) return userSyncChain;

    // Local state is the source of truth for the UI. Every call captures the exact
    // state at the moment the button was pressed, then writes snapshots in order.
    cacheUser(user);
    const version = ++userSyncVersion;
    const snapshot = JSON.parse(JSON.stringify(user));

    userSyncChain = userSyncChain
        .catch(() => {})
        .then(() => apiRequest("/api/user", {
            method: "PUT",
            body: JSON.stringify({ user: snapshot })
        }))
        .then(() => {
            // Never replace the current cache with a stale server read.
            // The newest local snapshot already contains every previous upgrade.
            if (version === userSyncVersion) {
                cacheUser(snapshot);
            }
        })
        .catch(e => console.error("Failed to sync user:", e));

    return userSyncChain;
}
async function refreshCurrentUser(){try{const d=await apiRequest("/api/me");cacheUser(d.user);return d.user;}catch{return null;}}


/* =========================================================
   DAILY LOGIN / CHECK-IN
   Server-side only. Attendance state is stored in Supabase.
========================================================= */
let dailyAttendanceOpen = false;

function getVietnamDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const out = {};
    parts.forEach(p => { if (p.type !== "literal") out[p.type] = p.value; });
    return { year: Number(out.year), month: Number(out.month), day: Number(out.day) };
}

function getDailyReward(day) {
    const d = Number(day);
    if (d % 8 === 0) return { type: "gems", amount: 320, label: "320 💎" };
    const cycleDay = ((d - 1) % 8) + 1;
    const amount = 50 + cycleDay * 50;
    return { type: "coins", amount, label: `${amount.toLocaleString("en-US")} ●` };
}

function getDailyRewardText(day) {
    const reward = getDailyReward(day);
    return Number(day) === 15 || Number(day) === 30
        ? `${reward.label} + 1 × 6★ CHARACTER`
        : reward.label;
}

function getDailyAttendanceMiniElements() {
    return {
        card: $("dailyAttendanceMini"),
        title: $("dailyAttendanceMiniTitle"),
        reward: $("dailyAttendanceMiniReward")
    };
}

async function updateDailyAttendanceMini() {
    const { card, title, reward } = getDailyAttendanceMiniElements();
    if (!card || !title || !reward) return;

    const date = getVietnamDateParts();
    title.textContent = `NGÀY ${date.day} · ĐIỂM DANH`;

    try {
        const monthKey = `${date.year}-${String(date.month).padStart(2, "0")}`;
        const response = await apiRequest(`/api/daily-attendance?month=${encodeURIComponent(monthKey)}`);
        const todayRow = (response.attendance || []).find(row => Number(row.day) === date.day);

        if (todayRow) {
            card.classList.add("claimed");
            reward.textContent = `ĐÃ NHẬN · ${getDailyRewardText(date.day)}`;
        } else {
            card.classList.remove("claimed");
            reward.textContent = `NHẬN ${getDailyRewardText(date.day)}`;
        }
    } catch (error) {
        console.error("Daily attendance mini card load failed:", error);
        card.classList.remove("claimed");
        reward.textContent = "XEM LỊCH ĐIỂM DANH";
    }
}

function getMonthLabel(year, month) {
    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh", month: "long", year: "numeric"
    }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

function getDaysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

async function openDailyAttendancePopup() {
    const overlay = $("dailyAttendanceOverlay");
    if (!overlay || dailyAttendanceOpen) return;
    dailyAttendanceOpen = true;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");

    const date = getVietnamDateParts();
    const monthKey = `${date.year}-${String(date.month).padStart(2, "0")}`;
    const monthTitle = $("dailyAttendanceMonth");
    const grid = $("dailyAttendanceGrid");
    const claimButton = $("dailyAttendanceClaim");
    const status = $("dailyAttendanceStatus");

    if (monthTitle) monthTitle.textContent = getMonthLabel(date.year, date.month);
    if (status) status.textContent = "ĐANG TẢI LỊCH ĐIỂM DANH...";
    if (grid) grid.innerHTML = "";
    if (claimButton) { claimButton.disabled = true; claimButton.textContent = "LOADING..."; }

    try {
        const response = await apiRequest(`/api/daily-attendance?month=${encodeURIComponent(monthKey)}`);
        const claimed = new Map((response.attendance || []).map(row => [Number(row.day), row]));
        renderDailyAttendanceCalendar(date, claimed);
        const todayRow = claimed.get(date.day);
        if (todayRow) {
            if (claimButton) { claimButton.disabled = true; claimButton.textContent = "ĐÃ NHẬN HÔM NAY ✓"; }
            if (status) status.textContent = `Bạn đã nhận: ${getDailyRewardText(date.day)}.`;
        } else {
            if (claimButton) { claimButton.disabled = false; claimButton.textContent = `NHẬN THƯỞNG NGÀY ${date.day}`; }
            if (status) status.textContent = `Hôm nay là ngày ${date.day}. Hãy nhận phần thưởng của hôm nay!`;
        }
    } catch (error) {
        console.error("Daily attendance load failed:", error);
        if (status) status.textContent = `Không thể tải lịch điểm danh (${error?.message || "Supabase error"})`;
        if (claimButton) { claimButton.disabled = true; claimButton.textContent = "TẠM THỜI KHÔNG KHẢ DỤNG"; }
    }
}

function renderDailyAttendanceCalendar(date, claimed) {
    const grid = $("dailyAttendanceGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const firstDay = new Date(Date.UTC(date.year, date.month - 1, 1)).getUTCDay();
    const mondayOffset = (firstDay + 6) % 7;
    for (let i = 0; i < mondayOffset; i++) {
        const blank = document.createElement("div");
        blank.className = "daily-attendance-day empty";
        grid.appendChild(blank);
    }
    for (let day = 1; day <= getDaysInMonth(date.year, date.month); day++) {
        const cell = document.createElement("div");
        const isToday = day === date.day;
        const isPast = day < date.day;
        const row = claimed.get(day);
        const isClaimed = !!row;
        let state = isClaimed ? "claimed" : isToday ? "today" : isPast ? "pass" : "future";
        cell.className = `daily-attendance-day ${state}${isToday ? " is-today" : ""}`;
        const badge = isClaimed ? "✓" : isPast ? "PASS" : isToday ? "TODAY" : "LOCK";
        cell.innerHTML = `
            <div class="daily-attendance-day-number">${day}</div>
            <div class="daily-attendance-reward">${getDailyRewardText(day)}</div>
            <div class="daily-attendance-state">${badge}</div>`;
        grid.appendChild(cell);
    }
}

async function claimDailyAttendance() {
    const button = $("dailyAttendanceClaim");
    const status = $("dailyAttendanceStatus");
    if (!button || button.disabled) return;
    button.disabled = true;
    button.textContent = "NHẬN THƯỞNG...";
    try {
        const response = await apiRequest("/api/daily-attendance/claim", { method: "POST", body: "{}" });
        const result = response.result || {};
        const reward = result.reward_type === "gems"
            ? `${Number(result.reward_amount || 0).toLocaleString("en-US")} 💎`
            : `${Number(result.reward_amount || 0).toLocaleString("en-US")} ●`;
        const characterText = result.reward_character_id ? " + 1 × 6★ CHARACTER" : "";
        if (result.already_claimed) {
            if (status) status.textContent = "Hôm nay đã được nhận trước đó.";
            button.textContent = "ĐÃ NHẬN HÔM NAY ✓";
        } else {
            if (status) status.textContent = `Đã nhận thành công: ${reward}${characterText}.`;
            button.textContent = "ĐÃ NHẬN ✓";
            if (response.user) {
                cacheUser(response.user);
                setupLobby(response.user);
                renderSelectedCharacter();
                renderMyCharacters();
            }
        }
        const date = getVietnamDateParts();
        const monthKey = `${date.year}-${String(date.month).padStart(2, "0")}`;
        const refreshed = await apiRequest(`/api/daily-attendance?month=${encodeURIComponent(monthKey)}`);
        renderDailyAttendanceCalendar(date, new Map((refreshed.attendance || []).map(row => [Number(row.day), row])));
    } catch (error) {
        console.error("Daily attendance claim failed:", error);
        if (status) status.textContent = error?.message || "Không thể nhận thưởng hôm nay.";
        button.disabled = false;
        button.textContent = "THỬ LẠI";
    }
}

function closeDailyAttendance() {
    const overlay = $("dailyAttendanceOverlay");
    if (!overlay) return;
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    dailyAttendanceOpen = false;
}

function scheduleDailyAttendanceOnLogin() {
    setTimeout(() => openDailyAttendancePopup(), 450);
}


/* =========================================================
   LOBBY MUSIC
========================================================= */

const LOBBY_MUSIC_SONGS = [
    { name: "VIRTUAL TO LIVE", artist: "REALYZE", src: "assets/song-012.mp3" },
    { name: "BOUNCE", artist: "VANI", src: "assets/song-022.mp3" },
    { name: "CRASH THE PARTY", artist: "REALYZE", src: "assets/song-032.mp3" }
];

let selectedLobbyMusic = Number(
    localStorage.getItem("realyze_lobby_music") || 0
);

if (
    !Number.isInteger(selectedLobbyMusic) ||
    selectedLobbyMusic < 0 ||
    selectedLobbyMusic >= LOBBY_MUSIC_SONGS.length
) {
    selectedLobbyMusic = 0;
}

let lobbyAudio = null;

function stopLobbyMusic() {
    if (lobbyAudio) {
        lobbyAudio.pause();
        lobbyAudio.currentTime = 0;
        lobbyAudio = null;
    }
}

function startLobbyMusic() {
    const song = LOBBY_MUSIC_SONGS[selectedLobbyMusic];
    if (!song) return;

    if (
        lobbyAudio &&
        lobbyAudio.dataset.src === song.src &&
        !lobbyAudio.paused
    ) {
        return;
    }

    stopLobbyMusic();

    lobbyAudio = new Audio(song.src);
    lobbyAudio.loop = true;
    lobbyAudio.volume = 0.45;
    lobbyAudio.dataset.src = song.src;

    lobbyAudio.play().catch(error => {
        console.log("Lobby music cannot play:", error);
    });
}

function renderLobbyMusicList() {
    const list = $("lobbyMusicList");
    if (!list) return;

    list.innerHTML = "";

    LOBBY_MUSIC_SONGS.forEach((song, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "lobby-music-option";

        if (index === selectedLobbyMusic) {
            button.classList.add("active");
        }

        button.innerHTML = `
            <span class="lobby-music-number">${String(index + 1).padStart(2, "0")}</span>
            <span class="lobby-music-option-info">
                <small>LOBBY TRACK</small>
                <strong>${song.name}</strong>
                <small>${song.artist}</small>
            </span>
            <span class="lobby-music-check">✓</span>
        `;

        button.addEventListener("click", () => {
            selectedLobbyMusic = index;
            localStorage.setItem("realyze_lobby_music", String(index));
            updateLobbyMusicButton();
            renderLobbyMusicList();
            startLobbyMusic();
        });

        list.appendChild(button);
    });
}

function updateLobbyMusicButton() {
    const element = $("lobbyMusicButtonName");
    const song = LOBBY_MUSIC_SONGS[selectedLobbyMusic];

    if (element && song) {
        element.textContent = song.name;
    }
}

$("lobbyMusicButton")?.addEventListener("click", () => {
    renderLobbyMusicList();
    $("lobbyMusicOverlay")?.classList.remove("hidden");
});

$("closeLobbyMusic")?.addEventListener("click", () => {
    $("lobbyMusicOverlay")?.classList.add("hidden");
});

$("lobbyMusicOverlay")?.addEventListener("click", event => {
    if (event.target === $("lobbyMusicOverlay")) {
        $("lobbyMusicOverlay").classList.add("hidden");
    }
});

updateLobbyMusicButton();

/* =========================================================
   LOBBY BACKGROUND CHARACTER SELECTOR
========================================================= */
function getLobbyCharacterId(user) {
    const id = user?.lobbyCharacterId;
    if (id && isCharacterOwned(id)) return id;
    // Keep the lobby background independent from the gameplay character.
    return null;
}

function applyLobbyCharacterBackground() {
    const user = getCurrentUser();
    const lobby = $("lobbyScreen");
    const name = $("lobbyCharacterButtonName");
    if (!lobby) return;
    const id = getLobbyCharacterId(user);
    const character = id ? CHARACTERS.find(c => c.id === id) : null;
    if (character?.image) {
        lobby.style.setProperty("--lobby-character-bg", `url("${character.image}")`);
        lobby.classList.add("has-lobby-character-bg");
        if (name) name.textContent = character.name;
    } else {
        lobby.style.removeProperty("--lobby-character-bg");
        lobby.classList.remove("has-lobby-character-bg");
        if (name) name.textContent = "CHARACTER";
    }
}

function renderLobbyCharacterSelector() {
    const list = $("lobbyCharacterList");
    if (!list) return;
    const user = getCurrentUser();
    if (!user) { list.innerHTML = ""; return; }
    initGachaData(user);
    const selectedId = getLobbyCharacterId(user);
    const owned = getOwnedCharacters().slice().sort((a,b) => Number(b.rarity||0)-Number(a.rarity||0));
    list.innerHTML = owned.length ? owned.map(character => {
        const p = getCharacterProgress(character);
        const selected = character.id === selectedId;
        return `<button type="button" class="lobby-character-option ${selected ? "active" : ""}" data-lobby-character="${character.id}">
            <span class="lobby-character-option-art">${character.image ? `<img src="${character.image}" alt="${character.name}">` : "✦"}</span>
            <span class="lobby-character-option-copy"><small>${getCardStars(Number(character.rarity || 1))} · LV.${p.level}</small><strong>${character.name}</strong><em>${character.main || "VOCAL"} · ${getCharacterStat(character).toLocaleString()} BP</em></span>
            <span class="lobby-character-option-check">${selected ? "✓" : ""}</span>
        </button>`;
    }).join("") : `<div class="lobby-character-empty">NO OWNED CHARACTERS YET</div>`;

    list.querySelectorAll("[data-lobby-character]").forEach(button => {
        button.addEventListener("click", async () => {
            const id = button.dataset.lobbyCharacter;
            if (!isCharacterOwned(id)) return;
            user.lobbyCharacterId = id;
            applyLobbyCharacterBackground();
            renderLobbyCharacterSelector();
            await updateUser(user);
            showLobbyToast("LOBBY BACKGROUND", "Đã thay background sảnh.");
        });
    });
}

$("lobbyCharacterButton")?.addEventListener("click", () => {
    renderLobbyCharacterSelector();
    $("lobbyCharacterOverlay")?.classList.remove("hidden");
});
$("closeLobbyCharacter")?.addEventListener("click", () => $("lobbyCharacterOverlay")?.classList.add("hidden"));
$("lobbyCharacterOverlay")?.addEventListener("click", event => {
    if (event.target === $("lobbyCharacterOverlay")) $("lobbyCharacterOverlay").classList.add("hidden");
});

/* =========================================================
   GAMEPLAY AUDIO STOP
========================================================= */

function stopGameplayAudio() {
    // Vô hiệu hóa mọi gameplay loop cũ trước khi rời màn chơi.
    gameplayLoopToken++;

    if (gameplayAudio) {
        gameplayAudio.pause();
        gameplayAudio.currentTime = 0;
        gameplayAudio.src = "";
        gameplayAudio.load();
        gameplayAudio = null;
    }

    if (typeof gameplayFrame !== "undefined" && gameplayFrame !== null) {
        cancelAnimationFrame(gameplayFrame);
        gameplayFrame = null;
    }

    // Xóa các note đang còn trên sân.
    const laneArea = $("gameplayLaneArea");
    if (laneArea) {
        laneArea.querySelectorAll(".gameplay-note").forEach(note => note.remove());
    }

    gameplayNotes = [];
    document.body.classList.remove("gameplay-active");
}

/* =========================================================
   LOBBY SETUP
========================================================= */


const PLAYER_MAX_RANK = 60;

function getPlayerRankXpNeed(rank){
    const r = Math.max(1, Math.min(PLAYER_MAX_RANK, Number(rank) || 1));
    if (r >= PLAYER_MAX_RANK) return 0;
    // Long-term progression: early ranks move reasonably, later ranks require
    // noticeably more play. Total Rank 1 -> 60 is about 572k EXP.
    return Math.round(750 + 100 * r + 5 * r * r);
}

function updatePlayerRankXpUI(user){
    if (!user) return;
    const rank = Math.max(1, Math.min(PLAYER_MAX_RANK, Number(user.rank) || 1));
    const xp = Math.max(0, Number(user.rankXp) || 0);
    const need = getPlayerRankXpNeed(rank);
    const percent = rank >= PLAYER_MAX_RANK ? 100 : Math.max(0, Math.min(100, xp / Math.max(1, need) * 100));
    const text = rank >= PLAYER_MAX_RANK ? "MAX RANK" : `${Math.floor(xp).toLocaleString()} / ${need.toLocaleString()} XP`;

    $("playerRankXpFill")?.style.setProperty("width", `${percent}%`);
    if ($("playerRankXpText")) $("playerRankXpText").textContent = text;
    $("nowPlayRankXpFill")?.style.setProperty("width", `${percent}%`);
    if ($("nowPlayRankXpText")) $("nowPlayRankXpText").textContent = text;
}

function syncMobileAppViewport(){
    if (window.innerWidth > 900) return;
    const h = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
    document.documentElement.style.setProperty("--mobile-app-height", `${Math.round(h)}px`);
}
syncMobileAppViewport();
window.addEventListener("resize", syncMobileAppViewport, {passive:true});
window.visualViewport?.addEventListener("resize", syncMobileAppViewport, {passive:true});
window.visualViewport?.addEventListener("scroll", syncMobileAppViewport, {passive:true});

function setupLobby(user) {

    if (!user) return;
    normalizeLobbyResources(user);

    $("lobbyUsername")
        .textContent =
        user.username;


    $("welcomeName")
        .textContent =
        user.username;


    $("playerRank")
        .textContent =
        Math.min(PLAYER_MAX_RANK, Number(user.rank) || 1);

    updatePlayerRankXpUI(user);


    $("gemCount")
        .textContent =
        finiteNumber(user.gems, 0).toLocaleString();


    $("coinCount")
        .textContent =
        finiteNumber(user.coins, 0).toLocaleString();


    $("ticketCount")
        .textContent =
        finiteNumber(user.tickets, 0).toLocaleString();

    ensureEventData(user);
    updateEnergyUI(user);


    $("gachaGemCount")
        .textContent =
        finiteNumber(user.gems, 0).toLocaleString();


    loadAvatar(
        user.username
    );
    updateDailyAttendanceMini();
    applyLobbyCharacterBackground();
}


/* =========================================================
   AVATAR
========================================================= */

const avatarUpload =
    $("avatarUpload");

const avatarImage =
    $("avatarImage");

const avatarPlaceholder =
    $("avatarPlaceholder");


function loadAvatar(username) {

    const avatar =
        localStorage.getItem(
            `realyze_avatar_${username}`
        );


    if (avatar) {

        avatarImage.src =
            avatar;

        avatarImage.style.display =
            "block";

        avatarPlaceholder.style.display =
            "none";

    } else {

        avatarImage.style.display =
            "none";

        avatarPlaceholder.style.display =
            "flex";
    }
}


avatarUpload.addEventListener(
    "change",
    (event) => {

        const file =
            event.target.files[0];


        if (!file) return;


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            return;
        }


        const username =
            localStorage.getItem(
                "realyze_current_user"
            );


        if (!username) return;


        const reader =
            new FileReader();


        reader.onload = () => {

            const imageData =
                reader.result;


            localStorage.setItem(
                `realyze_avatar_${username}`,
                imageData
            );


            avatarImage.src =
                imageData;


            avatarImage.style.display =
                "block";


            avatarPlaceholder.style.display =
                "none";


            showLobbyToast(
                "AVATAR UPDATED",
                "Your avatar has been saved."
            );
/* =========================================================
   GACHA TOAST
========================================================= */

function showGachaToast(
    title,
    text
) {

    const toast =
        $("gachaToast");

    if (!toast) return;

    const titleElement =
        toast.querySelector("strong");

    const textElement =
        toast.querySelector("span");

    if (titleElement) {
        titleElement.textContent =
            title;
    }

    if (textElement) {
        textElement.textContent =
            text;
    }

    showToast(
        toast
    );
}


        };


        reader.readAsDataURL(
            file
        );

    }
);


/* =========================================================
   GACHA TOAST
========================================================= */

function showGachaToast(
    title,
    text
) {

    const titleElement =
        document.querySelector(
            "#gachaToast strong"
        );

    const textElement =
        document.querySelector(
            "#gachaToast span"
        );

    if (titleElement) {
        titleElement.textContent =
            title;
    }

    if (textElement) {
        textElement.textContent =
            text;
    }

    showToast(
        document.getElementById(
            "gachaToast"
        )
    );
}


/* =========================================================
   LOBBY BUTTONS
========================================================= */

$("gachaButton").addEventListener(
    "click",
    () => {

        const user =
            getCurrentUser();


if (user) {

    const gems =
        Number(
            user.gems ?? 0
        );

    const gachaGemCount =
        document.getElementById(
            "gachaGemCount"
        );

    if (gachaGemCount) {

        gachaGemCount.textContent =
            gems.toLocaleString();
    }
}
        updateGachaPityDisplay(
    user
);  

        showScreen(
            "gachaScreen"
        );

    }
);


$("storyButton").addEventListener(
    "click",
    () => {

        renderNowPlay();

        showScreen(
            "nowPlayScreen"
        );

    }
);



/* =========================================================
   NOW PLAY
========================================================= */


const RHYTHM_REWARD_CONFIG = {
    rank: [
        { id:"D", label:"RANK D", coins:500, gems:0 },
        { id:"C", label:"RANK C", coins:800, gems:10 },
        { id:"B", label:"RANK B", coins:1200, gems:20 },
        { id:"A", label:"RANK A", coins:1800, gems:30 },
        { id:"S", label:"RANK S", coins:2500, gems:50 }
    ],
    combo: [
        { id:"20", label:"20% MAX COMBO", ratio:.20, coins:400, gems:0 },
        { id:"40", label:"40% MAX COMBO", ratio:.40, coins:600, gems:5 },
        { id:"60", label:"60% MAX COMBO", ratio:.60, coins:900, gems:10 },
        { id:"80", label:"80% MAX COMBO", ratio:.80, coins:1300, gems:15 },
        { id:"100", label:"FULL COMBO", ratio:1, coins:2000, gems:25 }
    ],
    clear: [
        { id:"1", label:"CLEAR 1 LẦN", count:1, coins:500, gems:10 },
        { id:"5", label:"CLEAR 5 LẦN", count:5, coins:1500, gems:20 },
        { id:"10", label:"CLEAR 10 LẦN", count:10, coins:3000, gems:35 },
        { id:"15", label:"CLEAR 15 LẦN", count:15, coins:4500, gems:50 },
        { id:"20", label:"CLEAR 20 LẦN", count:20, coins:7000, gems:80 }
    ]
};
function ensureRhythmProgress(user){
    if (!user) return {};
    if (!user.rhythmProgress || typeof user.rhythmProgress !== "object") user.rhythmProgress = {};
    return user.rhythmProgress;
}
function getSongRhythmProgress(user, songId){
    const all = ensureRhythmProgress(user);
    if (!all[songId] || typeof all[songId] !== "object") {
        all[songId] = { bestScore:0, bestRank:"", bestCombo:0, clearCount:0, totalNotes:0, claimed:{rank:[],combo:[],clear:[]} };
    }
    const p = all[songId];
    if (!p.claimed || typeof p.claimed !== "object") p.claimed={rank:[],combo:[],clear:[]};
    ["rank","combo","clear"].forEach(k=>{ if(!Array.isArray(p.claimed[k])) p.claimed[k]=[]; });
    return p;
}
function mergePendingRhythmProgress(user){
    if (!user) return false;
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem("realyze_rhythm_pending") || "null"); } catch(_){}
    if (!pending || !pending.songId) return false;
    const p = getSongRhythmProgress(user, pending.songId);
    const oldBestScore = Number(p.bestScore || 0);
    const incomingBestScore = Number(pending.bestScore || 0);
    p.bestScore = Math.max(oldBestScore, incomingBestScore);
    p.bestCombo = Math.max(Number(p.bestCombo||0), Number(pending.bestCombo||0));
    p.clearCount = Math.max(Number(p.clearCount||0), Number(pending.clearCount||0));
    p.totalNotes = Math.max(Number(p.totalNotes||0), Number(pending.totalNotes||0));
    if (pending.bestRank && incomingBestScore >= oldBestScore) p.bestRank = pending.bestRank;
    ["rank","combo","clear"].forEach(k=>{
        const incoming = pending.claimed?.[k] || [];
        p.claimed[k] = Array.from(new Set([...(p.claimed[k]||[]), ...incoming]));
    });
    user.coins = Math.max(Number(user.coins||0), Number(pending.coinsAfter||0));
    user.gems = Math.max(Number(user.gems||0), Number(pending.gemsAfter||0));
    if (Number.isFinite(Number(pending.playerRank))) user.rank = Math.max(Number(user.rank||1), Math.min(PLAYER_MAX_RANK, Number(pending.playerRank)));
    if (Number(user.rank||1) >= Number(pending.playerRank||1) && Number.isFinite(Number(pending.playerRankXp))) {
        user.rankXp = Math.max(0, Number(pending.playerRankXp));
    }
    localStorage.removeItem("realyze_rhythm_pending");
    return true;
}
function rewardText(item){
    const parts=[];
    if(item.coins) parts.push(`● ${Number(item.coins).toLocaleString()} GOLD`);
    if(item.gems) parts.push(`◆ ${Number(item.gems).toLocaleString()} GEMS`);
    return parts.join(" · ");
}
function openRhythmRewardPanel(songIndex){
    const user=getCurrentUser();
    const song=NOW_PLAY_SONGS[songIndex];
    if(!user||!song)return;
    const p=getSongRhythmProgress(user,song.id);
    $("rhythmRewardSongName").textContent=song.name;
    $("rhythmRewardBestScore").textContent=Number(p.bestScore||0).toLocaleString();
    const rankOrder=["D","C","B","A","S"];
    const bestRankIndex=rankOrder.indexOf(p.bestRank||"");
    const groups=[
      ["SCORE RANK", RHYTHM_REWARD_CONFIG.rank, item => bestRankIndex>=rankOrder.indexOf(item.id), "rank"],
      ["MAX COMBO", RHYTHM_REWARD_CONFIG.combo, item => Number(p.totalNotes||0)>0 && Number(p.bestCombo||0)>=Math.ceil(Number(p.totalNotes)*item.ratio), "combo"],
      ["CLEAR COUNT", RHYTHM_REWARD_CONFIG.clear, item => Number(p.clearCount||0)>=item.count, "clear"]
    ];
    $("rhythmRewardList").innerHTML=groups.map(([title,items,isUnlocked,key])=>`
      <section class="rhythm-reward-group">
        <strong>${title}</strong>
        ${items.map(item=>{
          const claimed=(p.claimed[key]||[]).includes(item.id);
          const unlocked=isUnlocked(item);
          return `<div class="rhythm-reward-row ${claimed?"claimed":unlocked?"unlocked":"unclaimed"}">
            <span>${item.label}</span><small>${rewardText(item)}</small>
            <b>${claimed?"ĐÃ NHẬN":unlocked?"SẴN SÀNG":"CHƯA ĐẠT"}</b>
          </div>`;
        }).join("")}
      </section>`).join("");
    $("rhythmRewardOverlay")?.classList.remove("hidden");
    $("rhythmRewardOverlay")?.setAttribute("aria-hidden","false");
}
function closeRhythmRewardPanel(){
    $("rhythmRewardOverlay")?.classList.add("hidden");
    $("rhythmRewardOverlay")?.setAttribute("aria-hidden","true");
}
$("rhythmRewardClose")?.addEventListener("click",closeRhythmRewardPanel);
$("rhythmRewardOverlay")?.addEventListener("click",e=>{if(e.target===$("rhythmRewardOverlay"))closeRhythmRewardPanel();});

const NOW_PLAY_SONGS = [
    {
        id: "track-01",
        name: "VIRTUAL TO LIVE",
        artist: "REALYZE (but Ebi & Mikon)",
        stars: 3,
        art: null,
        highlight: "assets/song-01.mp3",
        difficulty: {
            EASY: { locked: false },
            NORMAL: { locked: true },
            HARD: { locked: true }
        }
    },
    {
        id: "track-02",
        name: "BOUNCE",
        artist: "VANI",
        stars: 4,
        art: null,
        highlight: "assets/song-022_[cut_133sec].mp3",
        difficulty: {
            EASY: { locked: false },
            NORMAL: { locked: true },
            HARD: { locked: true }
        }
    },
    {
        id: "track-03",
        name: "CRASH THE PARTY",
        artist: "REALYZE (but Shoto & Hikari & Eke)",
        stars: 5,
        highlight: "assets/song-03.mp3",
        art: null,
        difficulty: {
            EASY: { locked: false },
            NORMAL: { locked: true },
            HARD: { locked: true }
        }
    }
];
/* =========================================================
   GAMEPLAY MUSIC
   NOTE:
   - Không dùng NOW_PLAY_SONGS[].highlight
   - Gameplay dùng nhạc riêng
========================================================= */

const GAMEPLAY_SONGS = {
    0: "assets/song-01_[cut_98sec].mp3",
    1: "assets/song-022_[cut_133sec].mp3"
};

let selectedNowPlaySong = 0;
let selectedNowPlayDifficulty = "EASY";

let nowPlayAudio = null;

function playNowPlayHighlight(song) {
    // Dừng bài đang phát
    if (nowPlayAudio) {
        nowPlayAudio.pause();
        nowPlayAudio.currentTime = 0;
        nowPlayAudio = null;
    }

    // Không có highlight thì thôi
    if (!song || !song.highlight) {
        return;
    }

    nowPlayAudio = new Audio(song.highlight);

    // Highlight chạy lặp
    nowPlayAudio.loop = true;

    // Âm lượng mặc định
    nowPlayAudio.volume = 0.6;

    nowPlayAudio.play().catch(error => {
        console.log("Cannot play highlight:", error);
    });
}

function stopNowPlayHighlight() {
    if (nowPlayAudio) {
        nowPlayAudio.pause();
        nowPlayAudio.currentTime = 0;
        nowPlayAudio = null;
    }
}

function updateNowPlayPlayer() {

    const user = getCurrentUser();

    if (!user) return;

    initGachaData(user);
    if (mergePendingRhythmProgress(user)) updateUser(user);

    const username =
        user.username || "PLAYER";

    const rank =
        Number(user.rank || 1);

    $("nowPlayUsername").textContent =
        username;

    $("nowPlayRank").textContent =
        Math.min(PLAYER_MAX_RANK, rank);
    updatePlayerRankXpUI(user);

    $("nowPlayGemCount").textContent =
        Number(user.gems || 0).toLocaleString();

    $("nowPlayCoinCount").textContent =
        Number(user.coins || 0).toLocaleString();

    $("nowPlayTicketCount").textContent =
        Number(user.tickets || 0).toLocaleString();


    const avatar =
        $("nowPlayAvatarImage");

    const placeholder =
        $("nowPlayAvatarPlaceholder");

    if (user.avatar) {

        avatar.src = user.avatar;
        avatar.style.display = "block";
        placeholder.style.display = "none";

    } else {

        avatar.style.display = "none";
        placeholder.style.display = "flex";

    }
}


function renderNowPlaySongList() {

    const list =
        $("songList");

    if (!list) return;

    list.innerHTML = "";

    NOW_PLAY_SONGS.forEach(
        (song, index) => {

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "song-select";

            if (index === selectedNowPlaySong) {
                button.classList.add("active");
            }

            const stars =
                "★".repeat(song.stars);

            button.innerHTML = `
                <div class="song-select-art">
                    ${song.art
                        ? `<img src="${song.art}" alt="">`
                        : `<span>R!</span>`
                    }
                </div>

                <div class="song-select-info">
                    <span class="song-select-number">
                        TRACK ${String(index + 1).padStart(2, "0")}
                    </span>

                    <strong class="song-select-name">
                        ${song.name}
                    </strong>

                    <span class="song-select-artist">
                        ${song.artist}
                    </span>
                </div>

                <div class="song-select-right">
                    <div class="song-record-mini">
                      <div class="song-select-stars">${stars}</div>
                      <span class="song-best-mini">BEST <b>${Number(getSongRhythmProgress(getCurrentUser(), song.id).bestScore || 0).toLocaleString()}</b></span>
                      <button type="button" class="song-reward-button" data-song-reward="${index}">REWARDS</button>
                    </div>
                    <span class="song-select-arrow">›</span>
                </div>
            `;

button.addEventListener(
    "click",
    () => {
        selectedNowPlaySong = index;
        selectedNowPlayDifficulty = "EASY";

        const song = NOW_PLAY_SONGS[selectedNowPlaySong];

        playNowPlayHighlight(song);

        renderNowPlay();
    }
);

            button.querySelector(".song-reward-button")?.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                openRhythmRewardPanel(index);
            });

            list.appendChild(button);

        }
    );

    $("songCountLabel").textContent =
        String(NOW_PLAY_SONGS.length).padStart(2, "0");
}



function updateNowPlayBestScoreDisplay(song){
    const user = getCurrentUser();
    if (!song || !user) return;
    const progress = getSongRhythmProgress(user, song.id);
    const value = Number(progress.bestScore || 0).toLocaleString();

    let badge = document.getElementById("nowPlayBestScoreBadge");
    const detail = document.querySelector(".song-detail-info") || document.querySelector(".song-detail") || document.querySelector(".now-play-detail");
    if (!badge && detail) {
        badge = document.createElement("div");
        badge.id = "nowPlayBestScoreBadge";
        badge.className = "now-play-best-score-badge";
        detail.appendChild(badge);
    }
    if (badge) badge.innerHTML = `<small>BEST SCORE</small><strong>${value}</strong>`;
}

function renderNowPlayDetail() {

    const song =
        NOW_PLAY_SONGS[selectedNowPlaySong];

    if (!song) return;

    updateNowPlayBestScoreDisplay(song);

    $("selectedSongNumber").textContent =
        String(selectedNowPlaySong + 1).padStart(2, "0");

    $("selectedSongName").textContent =
        song.name;

    $("selectedSongArtist").textContent =
        song.artist;

    $("selectedSongStars").textContent =
        "★".repeat(song.stars);


    const artwork =
        $("songArtwork");

    if (song.art) {

        artwork.innerHTML =
            `<img src="${song.art}" alt="${song.name}">`;

    } else {

        artwork.innerHTML =
            `<span id="songArtworkFallback">R!</span>`;

    }


    document
        .querySelectorAll(".difficulty-button")
        .forEach(button => {

            const difficulty =
                button.dataset.difficulty;

            const config =
                song.difficulty[difficulty];

            button.classList.toggle(
                "locked",
                Boolean(config?.locked)
            );

            button.classList.toggle(
                "active",
                difficulty === selectedNowPlayDifficulty &&
                !config?.locked
            );

        });
}


function renderNowPlay() {

    const currentUser = getCurrentUser();
    if (currentUser) {
        updateGachaGemCount(currentUser);
    }
    updateNowPlayPlayer();

    renderNowPlaySongList();

    renderNowPlayDetail();

}


function showNowPlayToast(
    title,
    text
) {

    const toast =
        $("nowPlayToast");

    if (!toast) return;

    $("nowPlayToastTitle").textContent =
        title;

    $("nowPlayToastText").textContent =
        text;

    toast.classList.add("show");

    clearTimeout(
        toast._timer
    );

    toast._timer =
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2600);
}


$("nowPlayBack").addEventListener(
    "click",
    () => {
        // Tắt preview Now Play trước khi phát nhạc sảnh.
        stopNowPlayHighlight();
        showScreen("lobbyScreen");
    }
);


document
    .querySelectorAll(".difficulty-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const difficulty =
                    button.dataset.difficulty;

                const song =
                    NOW_PLAY_SONGS[selectedNowPlaySong];

                if (
                    !song ||
                    song.difficulty[difficulty]?.locked
                ) {

                    showNowPlayToast(
                        "DIFFICULTY LOCKED",
                        "Clear the previous difficulty to unlock this mode."
                    );

                    return;
                }

                selectedNowPlayDifficulty =
                    difficulty;

                renderNowPlayDetail();

            }
        );

    });


$("nowPlayButton").addEventListener(
    "click",
    () => {

        const song =
            NOW_PLAY_SONGS[
                selectedNowPlaySong
            ];

        if (!song) {
            return;
        }

        openTeamSelect();

    }
);


$("playEventButton").addEventListener(
    "click",
    () => {

        showNowPlayToast(
            "EVENT",
            "The event page will be connected here."
        );

    }
);

/* =========================================================
   TEAM / CHARACTER SELECT
========================================================= */

const TEAM_CARD_LIMIT = 4;
const TEAM_CHARACTER_LIMIT = 4;


/* =========================================================
   CHARACTER DATA
========================================================= */

const CHARACTERS = [
    {
        id: "mystery",
        name: "NGƯỜI BÍ ẨN",
        description: "A mysterious presence accompanying you on the stage.",
        image: null,
        default: true,
        rarity: 6,
        rate: 0
    },
    {
        id: "lumina",
        name: "LUMINA",
        description: "A radiant performer whose rhythm shines across the stage.",
        image: "assets/lumina.png",
        default: false,
        rarity: 6,
        rate: 0.33333,
        main: "VOCAL",
        stat: { base: 13400, perLevel: 245 },
        skillName: "RADIANT VOICE",
        skill: "Boosts performance score during Skills.",
        number: "001"
    },
    {
        id: "akito",
        name: "AKITO",
        description: "A limited event performer who amplifies stage rewards.",
        image: "assets/akito.png",
        default: false,
        rarity: 6,
        rate: 0.33333,
        main: "ACT",
        stat: { base: 19450, perLevel: 510 },
        skillName: "REWARD AMPLIFIER",
        skill: "After completing a stage, increases the amount of stage rewards by 35%.",
        rewardMultiplier: 1.35,
        number: "002"
    },
    {
        id: "kohane",
        name: "KOHANE",
        description: "The featured performer of SHINE WITHOUT END, raising rewards through her event skill.",
        image: "assets/kohane.png",
        default: false,
        rarity: 6,
        rate: 0,
        main: "RAP",
        stat: { base: 21034, perLevel: 410 },
        skillName: "SHINING REWARD",
        skill: "After completing a stage, increases the amount of stage rewards by 45%.",
        rewardMultiplier: 1.45,
        number: "003",
        eventOnly: true
    },
    {
        id: "miku",
        name: "HATSUNE MIKU",
        description: "A special 5★ performer available from character banners.",
        image: "assets/miku.png",
        default: false,
        rarity: 5,
        rate: 5,
        main: "VOCAL",
        stat: { base: 9879, perLevel: 654 },
        skillName: "COLORFUL VOICE",
        skill: "Event: special performance effects.",
        number: "004"
    },
    {
        id: "miku6",
        name: "HATSUNE MIKU",
        description: "Radiant Bride — a dazzling limited 6★ RAP performer.",
        image: "assets/miku1.png",
        default: false,
        rarity: 6,
        rate: 0.33333,
        main: "RAP",
        stat: { base: 21250, perLevel: 620 },
        skillName: "RADIANT REWARD",
        skill: "After completing a stage, increases the amount of rewards received by 35%.",
        rewardMultiplier: 1.35,
        number: "005"
    },
    {
        id: "shota",
        name: "SHOTA",
        description: "Beginning — a limited 6★ VOCAL performer who protects the whole team from misses.",
        image: "assets/shota.png",
        default: false,
        rarity: 6,
        rate: 0.33333,
        main: "VOCAL",
        stat: { base: 19780, perLevel: 550 },
        skillName: "PERFECT GUARD",
        skill: "Entire team cannot MISS for 7 seconds.",
        skillType: "teamNoMiss",
        skillDuration: 7,
        number: "006"
    },
    {
        id: "rui",
        name: "RUI KAMISHIRO",
        description: "A 5★ ACT performer who turns every stage into a chain of theatrical effects.",
        image: "assets/rui.png",
        default: false,
        rarity: 5,
        rate: 5,
        main: "ACT",
        stat: { base: 13479, perLevel: 490 },
        skillName: "SHOWTIME TRICK",
        skill: "For 8 seconds, each PERFECT / GREAT has a 20% chance to add 1 TRICK stack. The next note gains +5% score per stack, up to 3 stacks (+15%), then the stacks reset.",
        skillType: "trickStack",
        skillDuration: 8,
        number: "007"
    }
];


/*
  selectedCharacterId vẫn giữ để dùng cho My Character / lobby.
  Gameplay mới dùng riêng selectedTeamCharacters gồm 4 slot.
*/
let selectedCharacterId = "mystery";
let selectedTeamCharacters = [null, null, null, null];
let selectedTeamCharacterSlot = 0;

let selectedTeamCards = [null, null, null, null];
let selectedTeamCardSlot = 0;


/* =========================================================
   OPEN TEAM SELECT
========================================================= */

function openTeamSelect() {
    renderTeamSelect();
    showScreen("teamSelectScreen");
}


/* =========================================================
   4 CHARACTER TEAM
========================================================= */

function getSelectedCharacter() {
    const first = selectedTeamCharacters.find(Boolean);
    if (first) return first;

    const user = getCurrentUser();
    if (user) {
        initGachaData(user);
        const saved = CHARACTERS.find(c => c.id === user.selectedCharacterId);
        if (saved && isCharacterOwned(saved.id)) return saved;
    }
    return CHARACTERS.find(c => c.id === "mystery") || CHARACTERS[0];
}

function getSelectedTeamCharacterCount() {
    return selectedTeamCharacters.filter(Boolean).length;
}

function renderSelectedCharacter() {
    // Compatibility hook used elsewhere in the lobby.
    // The team screen itself renders all four character slots.
    renderTeamCharacterSlots();
}

function renderTeamCharacterSlots() {
    const container = $("teamCharacterSlots");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < TEAM_CHARACTER_LIMIT; i++) {
        const character = selectedTeamCharacters[i];
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = `team-character-slot ${character ? "selected" : "empty"}`;

        if (character) {
            const progress = getCharacterProgress(character);
            const data = CHARACTER_INFO[character.id] || {};
            const stat = getCharacterStat(character);
            slot.innerHTML = `
                <span class="team-character-slot-number">SLOT ${String(i + 1).padStart(2, "0")}</span>
                <div class="team-character-slot-art">
                    ${character.image ? `<img src="${character.image}" alt="${character.name}">` : `<span>?</span>`}
                </div>
                <strong>${character.name}</strong>
                <small>${getCardStars(Number(character.rarity || 1))}</small>
                <em>${data.main || character.main || "—"} · ${Number(stat || 0).toLocaleString()} BP</em>
                <b>LV.${progress.level} · RANK ${progress.rank}</b>
            `;
        } else {
            slot.innerHTML = `
                <span class="team-character-slot-number">SLOT ${String(i + 1).padStart(2, "0")}</span>
                <div class="team-character-slot-art"><span>+</span></div>
                <strong>CHOOSE CHARACTER</strong>
                <small>EMPTY</small>
                <em>LANE ${i + 1}</em>
            `;
        }

        slot.addEventListener("click", () => {
            selectedTeamCharacterSlot = i;
            renderAvailableCharacters();
            $("characterSelectOverlay")?.classList.remove("hidden");
        });

        container.appendChild(slot);
    }

    const count = getSelectedTeamCharacterCount();
    if ($("teamCharacterCount")) $("teamCharacterCount").textContent = `${count} / ${TEAM_CHARACTER_LIMIT}`;
}

function renderAvailableCharacters() {
    const container = $("availableCharacters");
    if (!container) return;

    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = "";
        return;
    }

    initGachaData(user);
    const owned = getOwnedCharacters();
    container.innerHTML = "";

    if (!owned.length) {
        container.innerHTML = `<div class="available-character-empty">NO CHARACTERS OWNED YET</div>`;
        return;
    }

    owned.forEach(character => {
        const usedElsewhere = selectedTeamCharacters.some(
            (selected, idx) => selected && selected.id === character.id && idx !== selectedTeamCharacterSlot
        );

        const button = document.createElement("button");
        button.type = "button";
        button.className = `available-character my-card ${usedElsewhere ? "disabled" : ""}`;
        button.disabled = usedElsewhere;
        button.dataset.rarity = Number(character.rarity ?? 1);

        const progress = getCharacterProgress(character);
        const info = CHARACTER_INFO[character.id] || {};
        button.innerHTML = `
            ${usedElsewhere ? `<span class="card-used-badge">USED</span>` : ""}
            <div class="my-card-top">
                <span class="my-card-rarity">${getCardStars(Number(character.rarity ?? 1))}</span>
                <span class="my-card-rank">RANK ${progress.rank}</span>
                <span class="my-card-type">${info.main || character.main || "CHARACTER"}</span>
            </div>
            <div class="my-card-image my-character-image">
                ${character.image
                    ? `<img src="${character.image}" alt="${character.name}">`
                    : `<div class="my-card-fallback">✦</div>`}
            </div>
            <div class="my-card-info">
                <div class="my-card-name">${character.name}</div>
                <div class="my-card-obtained">LV.${progress.level} · ${Number(getCharacterStat(character) || 0).toLocaleString()} BP</div>
            </div>
        `;

        button.addEventListener("click", () => {
            selectedTeamCharacters[selectedTeamCharacterSlot] = character;
            $("characterSelectOverlay")?.classList.add("hidden");
            renderTeamSelect();
        });

        container.appendChild(button);
    });
}


/* =========================================================
   TEAM RENDER
========================================================= */

function renderTeamSelect() {
    const song = NOW_PLAY_SONGS[selectedNowPlaySong];

    if (song) {
        if ($("teamSongName")) $("teamSongName").textContent = song.name;
        if ($("teamSongDifficulty")) $("teamSongDifficulty").textContent = selectedNowPlayDifficulty;
    }

    renderTeamCharacterSlots();
    renderTeamCardSlots();
    updateTeamReadyState();
}


/* =========================================================
   TEAM CARD SELECT
========================================================= */

function getOwnedTeamCards() {
    const user = getCurrentUser();
    if (!user) return [];
    initGachaData(user);
    return Array.isArray(user.myCards)
        ? user.myCards.filter(card => Number(card.rarity || 0) >= 4)
        : [];
}

function getSelectedTeamCardCount() {
    return selectedTeamCards.filter(Boolean).length;
}

function renderTeamCardSlots() {
    const container = $("teamCardSlots");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < TEAM_CARD_LIMIT; i++) {
        const card = selectedTeamCards[i];
        const pairedCharacter = selectedTeamCharacters[i];
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = `team-card-slot ${card ? "selected" : "empty"}`;
        slot.innerHTML = card ? `
            <span class="team-card-slot-number">SLOT ${String(i + 1).padStart(2,"0")}</span>
            <div class="team-card-slot-art">${card.image ? `<img src="${card.image}" alt="${card.name}">` : `<span>✦</span>`}</div>
            <div class="team-card-slot-name">${card.name}</div>
            <div class="team-card-slot-rank">RANK ${Number(card.rank || 1)} · LV.${Number(card.level || 1)}</div>
            <div class="team-card-pair">${pairedCharacter ? `PAIR · ${pairedCharacter.name}` : "PAIR · NO CHARACTER"}</div>
        ` : `
            <span class="team-card-slot-number">SLOT ${String(i + 1).padStart(2,"0")}</span>
            <div class="team-card-slot-art"><span>+</span></div>
            <div class="team-card-slot-name">CHOOSE CARD</div>
            <div class="team-card-slot-rank">EMPTY</div>
            <div class="team-card-pair">${pairedCharacter ? `PAIR · ${pairedCharacter.name}` : "PAIR · NO CHARACTER"}</div>
        `;
        slot.addEventListener("click", () => {
            selectedTeamCardSlot = i;
            renderAvailableTeamCards();
            $("cardSelectOverlay")?.classList.remove("hidden");
        });
        container.appendChild(slot);
    }
}

function renderAvailableTeamCards() {
    const container = $("availableTeamCards");
    if (!container) return;
    const cards = getOwnedTeamCards();
    container.innerHTML = "";

    if (!cards.length) {
        container.innerHTML = `<div class="available-character-empty">NO CARDS OWNED YET</div>`;
        return;
    }

    cards.forEach(card => {
        const usedElsewhere = selectedTeamCards.some(
            (selected, idx) => selected && selected.id === card.id && idx !== selectedTeamCardSlot
        );
        const button = document.createElement("button");
        button.type = "button";
        button.className = `available-team-card ${usedElsewhere ? "disabled" : ""}`;
        button.disabled = usedElsewhere;
        button.innerHTML = `
            ${usedElsewhere ? `<span class="card-used-badge">USED</span>` : ""}
            ${card.image ? `<img src="${card.image}" alt="${card.name}">` : `<div class="available-team-card-placeholder">✦</div>`}
            <strong>${card.name}</strong>
            <small>RANK ${Number(card.rank || 1)} · LV.${Number(card.level || 1)}</small>
        `;
        button.addEventListener("click", () => {
            selectedTeamCards[selectedTeamCardSlot] = card;
            $("cardSelectOverlay")?.classList.add("hidden");
            renderTeamSelect();
        });
        container.appendChild(button);
    });
}

function updateTeamReadyState() {
    const cardCount = getSelectedTeamCardCount();
    const charCount = getSelectedTeamCharacterCount();
    const totalReady = cardCount + charCount;
    const totalRequired = TEAM_CARD_LIMIT + TEAM_CHARACTER_LIMIT;
    const readyNow = cardCount === TEAM_CARD_LIMIT && charCount === TEAM_CHARACTER_LIMIT;

    if ($("teamCardCount")) $("teamCardCount").textContent = `${cardCount} / ${TEAM_CARD_LIMIT}`;
    if ($("teamCharacterCount")) $("teamCharacterCount").textContent = `${charCount} / ${TEAM_CHARACTER_LIMIT}`;
    if ($("teamSelectionProgress")) $("teamSelectionProgress").style.width = `${totalReady / totalRequired * 100}%`;
    if ($("teamReadyText")) $("teamReadyText").textContent = readyNow ? "READY" : "NOT READY";

    if ($("teamSelectionMessage")) {
        if (readyNow) {
            $("teamSelectionMessage").textContent = "TEAM READY — 4 CHARACTERS + 4 CARDS";
        } else {
            $("teamSelectionMessage").textContent =
                `SELECT ${TEAM_CHARACTER_LIMIT - charCount} CHARACTER(S) + ${TEAM_CARD_LIMIT - cardCount} CARD(S)`;
        }
    }

    if ($("startTeamPlayButton")) $("startTeamPlayButton").disabled = !readyNow;
}


/* =========================================================
   POPUP CLOSE
========================================================= */

$("closeCharacterSelect")?.addEventListener("click", () => {
    $("characterSelectOverlay")?.classList.add("hidden");
});

$("closeCardSelect")?.addEventListener("click", () => {
    $("cardSelectOverlay")?.classList.add("hidden");
});


/* =========================================================
   TEAM BACK
========================================================= */

$("teamSelectBack")?.addEventListener("click", () => {
    $("cardSelectOverlay")?.classList.add("hidden");
    $("characterSelectOverlay")?.classList.add("hidden");
    showScreen("nowPlayScreen");
});


/* =========================================================
   NOW PLAY → TEAM SELECT
========================================================= */

$("nowPlayButton")?.addEventListener("click", () => {
    const song = NOW_PLAY_SONGS[selectedNowPlaySong];
    if (!song) return;
    openTeamSelect();
});


/* =========================================================
   START GAME
========================================================= */

$("startTeamPlayButton")?.addEventListener("click", () => {
    const cardCount = getSelectedTeamCardCount();
    const charCount = getSelectedTeamCharacterCount();

    if (cardCount !== TEAM_CARD_LIMIT || charCount !== TEAM_CHARACTER_LIMIT) return;

    const characterIds = selectedTeamCharacters.map(character => character.id);
    const cardIds = selectedTeamCards.map(card => card.id);

    // Save a snapshot too, so gameplay still knows the chosen team if query strings are edited/trimmed.
    try {
        localStorage.setItem("realyze_gameplay_team", JSON.stringify({
            characters: characterIds,
            cards: cardIds,
            song: selectedNowPlaySong,
            difficulty: selectedNowPlayDifficulty
        }));
    } catch (_) {}

    const gameplayUrl =
        `gameplay.html?song=${encodeURIComponent(selectedNowPlaySong)}` +
        `&difficulty=${encodeURIComponent(selectedNowPlayDifficulty)}` +
        `&characters=${encodeURIComponent(JSON.stringify(characterIds))}` +
        `&cards=${encodeURIComponent(JSON.stringify(cardIds))}`;

    window.location.href = gameplayUrl;
});


 /* =========================================================
   RHYTHM GAMEPLAY
========================================================= */

let gameplayAudio = null;
let gameplayLoopToken = 0;

function startRhythmGameplay() {

    const gameplayScreen =
        $("gameplayScreen");

    if (!gameplayScreen) {
        console.error(
            "gameplayScreen not found"
        );
        return;
    }

    // Dừng nhạc preview
    stopNowPlayHighlight();

    // Hiện màn gameplay
    showScreen("gameplayScreen");

// Đóng toàn bộ popup / overlay còn sót lại
[
    "gachaResultOverlay",
    "gemPopup",
    "exchangeCardOverlay",
    "cardSelectOverlay",
    "characterSelectOverlay"
].forEach(id => {
    const overlay = $(id);

    if (overlay) {
        overlay.classList.add("hidden");
        overlay.classList.remove("show");
    }
});

    // Reset HUD
    $("gameplaySongName").textContent =
        NOW_PLAY_SONGS[selectedNowPlaySong]?.name
        || "VIRTUAL TO LIVE";

    $("gameplayDifficulty").textContent =
        selectedNowPlayDifficulty;

    $("gameplayScore").textContent = "0";

    $("gameplayScoreFill").style.width =
        "0%";

    $("gameplayComboNumber").textContent =
        "0";

    $("gameplayJudgement").textContent =
        "";

    // Dừng gameplay audio/loop cũ trước khi tạo phiên mới.
    stopGameplayAudio();
    const myGameplayToken = ++gameplayLoopToken;
    document.body.classList.add("gameplay-active");

    // Gameplay dùng nhạc RIÊNG
    const music =
        GAMEPLAY_SONGS[selectedNowPlaySong];

    if (music) {

        gameplayAudio =
            new Audio(music);

        gameplayAudio.volume = 0.8;

        gameplayAudio.play()
            .catch(error => {

                console.warn(
                    "Gameplay music could not start:",
                    error
                );

            });

    } else {

        console.warn(
            "No gameplay music for song:",
            selectedNowPlaySong
        );

        gameplayAudio = null;
    }

    // LUÔN khởi động gameplay
    startGameplayNoteEngine(myGameplayToken);
}



/* =========================================================
   GAMEPLAY EXIT
========================================================= */

$("gameplayBackButton")?.addEventListener(
    "click",
    () => {
        // Tắt gameplay hoàn toàn trước khi chuyển màn hình.
        stopGameplayAudio();
        stopNowPlayHighlight();

        showScreen("nowPlayScreen");

        // Chỉ phát preview sau khi gameplay audio đã được giải phóng.
        setTimeout(() => {
            if (document.getElementById("nowPlayScreen")?.classList.contains("hidden")) {
                return;
            }
            playNowPlayHighlight(
                NOW_PLAY_SONGS[selectedNowPlaySong]
            );
        }, 0);
    }
);

/* =========================================================
   RHYTHM NOTE SYSTEM
========================================================= */

let gameplayNotes = [];
let gameplayFrame = null;

let gameplayScoreValue = 0;
let gameplayComboValue = 0;

let gameplayPerfectCount = 0;
let gameplayGreatCount = 0;
let gameplayOkayCount = 0;
let gameplayMissCount = 0;

const GAMEPLAY_HIT_WINDOW = 0.22;


/* =========================================================
   NOTE CHART
========================================================= */

function createGameplayNotes() {

    const notes = [];

    /*
        time = thời điểm note chạm hit line
        lane = 0 / 1 / 2 / 3
        type = tap / hold
        duration = thời gian giữ
    */

    const chart = [
        [2.00, 0, "tap", 0],
        [2.55, 1, "tap", 0],
        [3.10, 2, "tap", 0],
        [3.65, 3, "tap", 0],

        [4.20, 0, "tap", 0],
        [4.65, 2, "tap", 0],
        [5.10, 1, "tap", 0],
        [5.55, 3, "tap", 0],

        [6.10, 0, "hold", 0.9],
        [7.20, 2, "tap", 0],
        [7.65, 3, "tap", 0],
        [8.10, 1, "hold", 0.8],

        [9.15, 0, "tap", 0],
        [9.60, 1, "tap", 0],
        [10.05, 2, "tap", 0],
        [10.50, 3, "tap", 0],

        [11.10, 3, "hold", 1.0],
        [12.25, 1, "tap", 0],
        [12.70, 0, "tap", 0],
        [13.15, 2, "tap", 0],

        [13.70, 0, "tap", 0],
        [13.95, 1, "tap", 0],
        [14.20, 2, "tap", 0],
        [14.45, 3, "tap", 0],

        [15.20, 2, "hold", 1.0],
        [16.35, 0, "tap", 0],
        [16.80, 3, "tap", 0],
        [17.25, 1, "tap", 0],

        [18.00, 0, "tap", 0],
        [18.45, 2, "tap", 0],
        [18.90, 1, "hold", 0.9],
        [20.00, 3, "tap", 0],

        [20.55, 0, "tap", 0],
        [21.00, 1, "tap", 0],
        [21.45, 2, "tap", 0],
        [21.90, 3, "tap", 0]
    ];

    chart.forEach(
        (item, index) => {

            notes.push({
                id: index,
                time: item[0],
                lane: item[1],
                type: item[2],
                duration: item[3],

                hit: false,
                missed: false,
                element: null,
            });

        }
    );

    return notes;
}


/* =========================================================
   START NOTE ENGINE
========================================================= */

function startGameplayNoteEngine(myGameplayToken = gameplayLoopToken) {

    gameplayNotes =
        createGameplayNotes();

    gameplayScoreValue = 0;
    gameplayComboValue = 0;

    gameplayPerfectCount = 0;
    gameplayGreatCount = 0;
    gameplayOkayCount = 0;
    gameplayMissCount = 0;

    const laneArea =
        $("gameplayLaneArea");

    if (!laneArea) {
        return;
    }

    laneArea
        .querySelectorAll(".gameplay-note")
        .forEach(
            note => note.remove()
        );

    cancelAnimationFrame(
        gameplayFrame
    );

    if (myGameplayToken === gameplayLoopToken &&
        document.body.classList.contains("gameplay-active")) {
        gameplayFrame = requestAnimationFrame(
            () => gameplayNoteLoop(myGameplayToken)
        );
    }
}


/* =========================================================
   NOTE LOOP
========================================================= */

function gameplayNoteLoop(myGameplayToken = gameplayLoopToken) {

    // Nếu phiên gameplay cũ đã bị thoát/restart thì dừng ngay.
    if (
        myGameplayToken !== gameplayLoopToken ||
        !document.body.classList.contains("gameplay-active")
    ) {
        return;
    }

    const laneArea = $("gameplayLaneArea");
    if (!laneArea) return;

    const currentTime = gameplayAudio
        ? gameplayAudio.currentTime
        : performance.now() / 1000;

    const areaHeight = laneArea.clientHeight;
    const hitLine = areaHeight - 110;

    gameplayNotes.forEach(note => {
        if (!note.element && currentTime >= note.time - 2) {
            createGameplayNote(note, laneArea);
        }

        if (!note.element || note.hit || note.missed) return;

        const difference = note.time - currentTime;
        const progress = 1 - (difference / 2);
        const y = -60 + (hitLine + 60) * progress;

        note.element.style.transform =
            `translate(-50%, ${y}px)`;

        if (difference < -GAMEPLAY_HIT_WINDOW) {
            missGameplayNote(note);
        }
    });

    if (
        myGameplayToken === gameplayLoopToken &&
        document.body.classList.contains("gameplay-active")
    ) {
        gameplayFrame = requestAnimationFrame(
            () => gameplayNoteLoop(myGameplayToken)
        );
    }
}


/* =========================================================
   CREATE NOTE
========================================================= */

function createGameplayNote(
    note,
    laneArea
) {
    const element = document.createElement("div");

    element.className = "gameplay-note";

    element.dataset.lane = note.lane;
    element.dataset.noteId = note.id;

    /*
        4 lanes
        Lane 0 = 12.5%
        Lane 1 = 37.5%
        Lane 2 = 62.5%
        Lane 3 = 87.5%
    */
    element.style.left =
        `${note.lane * 25 + 12.5}%`;

    /*
        Hold note
    */
    if (note.type === "hold") {
        element.classList.add("hold");

        element.style.height =
            `${Math.max(note.duration, 0.1) * 160 + 36}px`;
    }

    /*
        Make sure the note is actually visible
        above the lane background.
    */
    element.style.display = "block";
    element.style.visibility = "visible";
    element.style.opacity = "1";

    laneArea.appendChild(element);

    note.element = element;
}


/* =========================================================
   MISS
========================================================= */

function missGameplayNote(
    note
) {

    if (
        note.hit ||
        note.missed
    ) {
        return;
    }


    note.missed =
        true;

    gameplayMissCount++;

    gameplayComboValue = 0;


    if (note.element) {

        note.element.remove();

        note.element =
            null;
    }


    showGameplayJudgement(
        "MISS"
    );

    updateGameplayHUD();
}


/* =========================================================
   HUD
========================================================= */

function updateGameplayHUD() {

    $("gameplayScore")
        .textContent =
        gameplayScoreValue
            .toLocaleString();


    $("gameplayScoreFill")
        .style.width =
        `${gameplayScoreValue / 1000}%`;


    $("gameplayComboNumber")
        .textContent =
        gameplayComboValue;
}


/* =========================================================
   JUDGEMENT
========================================================= */

function showGameplayJudgement(
    text
) {

    const element =
        $("gameplayJudgement");

    if (!element) {
        return;
    }


    element.textContent =
        text;


    element.classList.remove(
        "show"
    );


    void element.offsetWidth;


    element.classList.add(
        "show"
    );
}



/* =========================================================
   CARD INFORMATION / LEVEL SYSTEM
========================================================= */

const CARD_INFO_DATA = {
    "Bơ": {
        number: "001",
        main: "VOCAL",
        vocal: { base: 1350, perLevel: 1070 },
        rap:   { base: 720,  perLevel: 450 },
        act:   { base: 1200, perLevel: 890 },
        skillName: "POWER UP",
        skill: "Tăng 20% điểm cộng sau mỗi lần bấm Skills, duy trì 10s."
    },
    "Chuối": {
        number: "002",
        main: "RAP",
        vocal: { base: 750, perLevel: 600 },
        rap:   { base: 1450, perLevel: 1150 },
        act:   { base: 900, perLevel: 750 },
        skillName: "NO MISS",
        skill: "Sau khi bật Skills, sẽ không thể miss trong 5s."
    },
    "Xoài Non": {
        number: "003",
        main: "VOCAL",
        vocal: { base: 3800, perLevel: 2100 },
        rap:   { base: 2500, perLevel: 1890 },
        act:   { base: 2000, perLevel: 1500 },
        skillName: "POWER UP",
        skill: "Tăng 50% điểm cộng sau mỗi lần bấm Skills. Duy trì theo Rank: R1 5s • R2 8s • R3 12s • R4 15s • R5 20s."
    },
    "Violin": {
        number: "004",
        main: "ACT",
        vocal: { base: 2100, perLevel: 1450 },
        rap:   { base: 1700, perLevel: 1670 },
        act:   { base: 4100, perLevel: 2167 },
        skillName: "NO MISS",
        skill: "Sau khi bật Skills, sẽ không thể miss trong: R1 8s • R2 9s • R3 10s • R4 11s • R5 12s."
    },
        "Piano": {
        number: "005",
        main: "RAP",
        vocal: { base: 900, perLevel: 700 },
        rap:   { base: 2600,  perLevel: 1700 },
        act:   { base: 1700, perLevel: 1200 },
        skillName: "POWER UP",
        skill: "Tăng 35% điểm cộng sau mỗi lần bấm Skills, duy trì 10s."
    }
};

const CARD_MAIN_COLORS = {
    VOCAL: "#ef557f",
    RAP: "#4d8df7",
    ACT: "#e6b83f"
};

const CARD_MAX_RANK = 5;
const CARD_MAX_LEVEL_R1 = 60;
const CARD_LEVEL_STEP_PER_RANK = 5;

/*
    Yêu cầu chưa nêu giá nâng level cụ thể.
    Tạm dùng: Lv.1 -> 100 GOLD, mỗi level sau tăng thêm 100 GOLD.
    Có thể đổi 2 hằng số này sau.
*/
const CARD_UPGRADE_BASE_COST = 100;
const CARD_UPGRADE_COST_STEP = 100;

let cardInfoTarget = null;

function getCardInfoData(card) {
    return CARD_INFO_DATA[card?.name] || null;
}

function getCardMaxLevel(rank) {
    const safeRank = Math.max(1, Math.min(CARD_MAX_RANK, Number(rank) || 1));
    return CARD_MAX_LEVEL_R1 + (safeRank - 1) * CARD_LEVEL_STEP_PER_RANK;
}

function getCardUpgradeCost(level) {
    return CARD_UPGRADE_BASE_COST +
        (Math.max(1, Number(level) || 1) - 1) * CARD_UPGRADE_COST_STEP;
}

function ensureCardProgress(card) {
    if (!card) return card;

    card.rank = Math.max(1, Math.min(CARD_MAX_RANK, Number(card.rank) || 1));

    const maxLevel = getCardMaxLevel(card.rank);
    const parsedLevel = Number(card.level);

    card.level = Number.isFinite(parsedLevel)
        ? Math.max(1, Math.min(maxLevel, parsedLevel))
        : 1;

    return card;
}

function getCardStat(card, statName) {
    const data = getCardInfoData(card);
    if (!data || !data[statName]) return 0;

    const level = Number(card.level) || 1;
    return data[statName].base + (level - 1) * data[statName].perLevel;
}

function saveCardProgress(card) {
    const user = getCurrentUser();
    if (!user || !card) return;

    initGachaData(user);

    const storedCard = user.myCards.find(item => item.id === card.id);
    if (storedCard) {
        storedCard.level = card.level;
        storedCard.rank = card.rank;
    }

    updateUser(user);
}

function openCardInfo(card) {
    if (!card) return;

    ensureCardProgress(card);
    cardInfoTarget = card;
    renderCardInfo(card);

    $("cardInfoOverlay")?.classList.remove("hidden");
}

function closeCardInfo() {
    $("cardInfoOverlay")?.classList.add("hidden");
    $("cardInfoOverlay")?.classList.remove("character-info-mode");
    cardInfoTarget = null;
    cardInfoTargetType = "card";
}

function renderCardInfo(card) {
    cardInfoTargetType = "card";
    $("cardInfoOverlay")?.classList.remove("character-info-mode");
    const data = getCardInfoData(card);
    if (!data) return;

    ensureCardProgress(card);

    const rank = Number(card.rank) || 1;
    const level = Number(card.level) || 1;
    const maxLevel = getCardMaxLevel(rank);

    $("cardInfoNumber").textContent = `CARD #${data.number}`;
    $("cardInfoName").textContent = card.name || "UNKNOWN CARD";
    $("cardInfoRarity").textContent = getCardStars(Number(card.rarity || 4));
    $("cardInfoRank").textContent = `RANK ${rank}`;
    $("cardInfoLevel").textContent = `LV. ${level} / ${maxLevel}`;

    $("cardInfoLevelFill").style.width =
        `${Math.min(100, level / maxLevel * 100)}%`;

    const upgradeButton = $("cardInfoUpgrade");
    if (level >= maxLevel) {
        $("cardInfoUpgradeCost").textContent =
            rank < CARD_MAX_RANK ? "RANK UP REQUIRED" : "MAX LEVEL";
        upgradeButton.disabled = true;
    } else {
        $("cardInfoUpgradeCost").textContent =
            `● ${getCardUpgradeCost(level).toLocaleString()} GOLD`;
        upgradeButton.disabled = false;
    }

    const image =
        card.image ||
        GACHA_ITEMS.find(item => item.name === card.name)?.image;

    $("cardInfoArt").innerHTML = image
        ? `<img src="${image}" alt="${card.name || "Card"}">`
        : `<span>✦</span>`;

    const vocal = getCardStat(card, "vocal");
    const rap = getCardStat(card, "rap");
    const act = getCardStat(card, "act");

    $("cardInfoVocal").textContent = vocal.toLocaleString();
    $("cardInfoRap").textContent = rap.toLocaleString();
    $("cardInfoAct").textContent = act.toLocaleString();
    $("cardInfoTotal").textContent = (vocal + rap + act).toLocaleString();

    $("cardInfoMainType").textContent = data.main;
    $("cardInfoMainType").style.color =
        CARD_MAIN_COLORS[data.main] || "#ff5f9e";

    $("cardInfoSkillName").textContent = data.skillName;
    $("cardInfoSkillDescription").textContent = data.skill;
}

function upgradeCardLevel() {
    const target = cardInfoTarget;
    if (!target) return;
    const user = getCurrentUser();
    if (!user) return;
    initGachaData(user);

    if (cardInfoTargetType === "character") {
        const p=getCharacterProgress(target), max=getCharacterMaxLevel(p.rank);
        if (p.level >= max) { showLobbyToast("MAX LEVEL", p.rank < CHARACTER_MAX_RANK ? "Increase Character Rank to unlock more levels." : "This character has reached the maximum level."); return; }
        const cost=getCardUpgradeCost(p.level); const coins=Number(user.coins||0);
        if (coins<cost) { showLobbyToast("NOT ENOUGH GOLD", `You need ${cost.toLocaleString()} GOLD to upgrade this level.`); return; }
        user.coins=coins-cost; p.level++; user.characterProgress[target.id]=p; updateUser(user); setupLobby(user); renderCharacterInfo(target); renderMyCharacters(); renderTeamSelect(); return;
    }

    ensureCardProgress(target);
    const maxLevel=getCardMaxLevel(target.rank), level=Number(target.level);
    if (level>=maxLevel) { showLobbyToast("MAX LEVEL", target.rank>=CARD_MAX_RANK ? "This card has reached the maximum level." : "Increase the card Rank to unlock more levels."); return; }
    const cost=getCardUpgradeCost(level), coins=Number(user.coins||0);
    if (coins<cost) { showLobbyToast("NOT ENOUGH GOLD", `You need ${cost.toLocaleString()} GOLD to upgrade this level.`); return; }
    user.coins=coins-cost; target.level=level+1; saveCardProgress(target); setupLobby(user); renderCardInfo(target); renderMyCards(); selectedTeamCards=selectedTeamCards.map(selected=>selected&&selected.id===target.id?target:selected); renderTeamSelect();
}

$("cardInfoBack")?.addEventListener("click", closeCardInfo);
$("cardInfoUpgrade")?.addEventListener("click", upgradeCardLevel);

$("cardInfoOverlay")?.addEventListener("click", event => {
    if (event.target === $("cardInfoOverlay")) {
        closeCardInfo();
    }
});

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (characterInfoTarget) {
        closeCharacterInfo();
        return;
    }
    if (cardInfoTarget) {
        closeCardInfo();
    }
});


/* =========================================================
   MY CARD
========================================================= */

let currentCardFilter = "all";


$("cardButton").addEventListener(
    "click",
    () => {

        const user =
            getCurrentUser();

        if (!user) {
            return;
        }

        /*
            Tài khoản cũ có thể chưa có myCards.
            Tự động tạo nếu thiếu.
        */
        initGachaData(user);

        updateUser(user);

        renderMyCards();

        showScreen(
            "cardScreen"
        );

    }
);


/* =========================================================
   CARD BACK
========================================================= */

$("cardBack").addEventListener(
    "click",
    () => {

        showScreen(
            "lobbyScreen"
        );

    }
);


/* =========================================================
   CARD FILTER
========================================================= */

document
    .querySelectorAll(".card-filter")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    currentCardFilter =
                        button.dataset.rarity;

                    document
                        .querySelectorAll(
                            ".card-filter"
                        )
                        .forEach(
                            item => {
                                item.classList.remove(
                                    "active"
                                );
                            }
                        );

                    button.classList.add(
                        "active"
                    );

                    renderMyCards();

                }
            );

        }
    );


/* =========================================================
   RENDER MY CARDS
========================================================= */

function renderMyCards() {

    const user =
        getCurrentUser();

    if (!user) {
        return;
    }

    initGachaData(user);

    const grid =
        document.getElementById(
            "myCardGrid"
        );

    const emptyState =
        document.getElementById(
            "emptyCardState"
        );

    const cardCount =
        document.getElementById(
            "cardCount"
        );

    const cardTotal =
        document.getElementById(
            "cardTotal"
        );


    if (!grid) {
        return;
    }


    const cards =
        Array.isArray(user.myCards)
            ? user.myCards
            : [];


    /*
        Tổng số card sở hữu.
    */
    if (cardCount) {
        cardCount.textContent =
            cards.length;
    }

    if (cardTotal) {
        cardTotal.textContent =
            cards.length;
    }


    /*
        Filter.
    */
    let filteredCards =
        cards.filter(
            card => {

                const rarity =
                    Number(
                        card.rarity ?? 0
                    );

                /*
                    Chỉ hiển thị
                    4★ / 5★ / 6★.
                */
                if (rarity < 4) {
                    return false;
                }

                if (
                    currentCardFilter ===
                    "all"
                ) {
                    return true;
                }

                return (
                    rarity ===
                    Number(
                        currentCardFilter
                    )
                );

            }
        );


    /*
        Card mới nhất nằm trước.
    */
    filteredCards.sort(
        (a, b) =>
            Number(
                b.obtainedAt ?? 0
            ) -
            Number(
                a.obtainedAt ?? 0
            )
    );


    grid.innerHTML = "";


    /*
        Không có card.
    */
    if (
        filteredCards.length === 0
    ) {

        grid.classList.add(
            "hidden"
        );

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    grid.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );


    /*
        Render từng card.
    */
    filteredCards.forEach(
        (card, index) => {

            const element =
                createMyCardElement(
                    card,
                    index
                );

            grid.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   CREATE CARD
========================================================= */

function createMyCardElement(
    card,
    index
) {

    const rarity =
        Number(
            card.rarity ?? 4
        );


    const article =
        document.createElement(
            "article"
        );

    article.className =
        "my-card";

    article.dataset.rarity =
        rarity;


    article.style.animationDelay =
        `${index * 55}ms`;


    /* =========================
       TOP
    ========================= */

    const top =
        document.createElement(
            "div"
        );

    top.className =
        "my-card-top";


    const rarityElement =
        document.createElement(
            "span"
        );

    rarityElement.className =
        "my-card-rarity";


    rarityElement.textContent =
        getCardStars(rarity);
const rankElement =
    document.createElement(
        "span"
    );

rankElement.className =
    "my-card-rank";

rankElement.textContent =
    `RANK ${Number(card.rank ?? 1)}`;

    const type =
        document.createElement(
            "span"
        );

    type.className =
        "my-card-type";


    type.textContent =
        String(
            card.type ||
            "NORMAL"
        ).toUpperCase();


  top.append(
    rarityElement,
    rankElement,
    type
);


    /* =========================
       IMAGE
    ========================= */

    const imageArea =
        document.createElement(
            "div"
        );

    imageArea.className =
        "my-card-image";


    if (card.image) {

        const img =
            document.createElement(
                "img"
            );

        img.src =
            card.image;

        img.alt =
            card.name ||
            "Card";

        img.onerror =
            () => {

                img.style.display =
                    "none";

                fallback.style.display =
                    "flex";

            };


        imageArea.appendChild(
            img
        );

    }


    const fallback =
        document.createElement(
            "div"
        );

    fallback.className =
        "my-card-fallback";

    fallback.textContent =
        "✦";

    fallback.style.display =
        card.image
            ? "none"
            : "flex";


    imageArea.appendChild(
        fallback
    );


    /* =========================
       INFO
    ========================= */

    const info =
        document.createElement(
            "div"
        );

    info.className =
        "my-card-info";


    const name =
        document.createElement(
            "div"
        );

    name.className =
        "my-card-name";

    name.textContent =
        card.name ||
        "UNKNOWN CARD";


    const obtained =
        document.createElement(
            "div"
        );

    obtained.className =
        "my-card-obtained";


    if (card.obtainedAt) {

        obtained.textContent =
            "OBTAINED • " +
            formatCardDate(
                card.obtainedAt
            );

    } else {

        obtained.textContent =
            "OBTAINED";

    }


    info.append(
        name,
        obtained
    );


    article.append(
        top,
        imageArea,
        info
    );

    article.setAttribute("tabindex", "0");
    article.setAttribute("role", "button");

    article.addEventListener(
        "click",
        () => openCardInfo(card)
    );

    article.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCardInfo(card);
            }
        }
    );


    return article;

}


/* =========================================================
   STAR DISPLAY
========================================================= */

function getCardStars(
    rarity
) {

    const safeRarity =
        Math.max(
            4,
            Math.min(
                6,
                Number(rarity)
            )
        );


    return (
        "★".repeat(
            safeRarity
        )
    );

}


/* =========================================================
   CARD DATE
========================================================= */

function formatCardDate(
    timestamp
) {

    const date =
        new Date(
            timestamp
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    return date.toLocaleDateString(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


/* =========================================================
   EMPTY CARD -> GACHA
========================================================= */

$("emptyCardGacha").addEventListener(
    "click",
    () => {

        showScreen(
            "gachaScreen"
        );

    }
);


$("characterButton").addEventListener(
    "click",
    () => {
        const user = getCurrentUser();
        if (!user) return;
        initGachaData(user);
        renderMyCharacters();
        showScreen("characterScreen");
    }
);

$("characterBack")?.addEventListener("click", () => {
    showScreen("lobbyScreen");
});


async function loadWorldRank(){
    const list=$("worldRankList");
    if(!list)return;
    list.innerHTML='<div class="world-rank-empty">LOADING WORLD RANK...</div>';
    try{
        if(!window.REALYZE_DB)throw new Error("Supabase chưa sẵn sàng.");
        const {data,error}=await window.REALYZE_DB.rpc("event_world_rank",{p_limit:100});
        if(error)throw error;
        const rows=Array.isArray(data)?data:[];
        if(!rows.length){list.innerHTML='<div class="world-rank-empty">NO EVENT RANK DATA YET.</div>';return}
        list.innerHTML=rows.map(r=>`<div class="world-rank-row"><span class="world-rank-pos">#${Number(r.rank)||0}</span><span class="world-rank-id">${String(r.id||"PLAYER")}</span><span class="world-rank-level">LV.${Number(r.level)||1}</span><span class="world-rank-points">${Number(r.event_points||0).toLocaleString("en-US")} PT</span></div>`).join("");
    }catch(e){console.warn("WORLD RANK",e);list.innerHTML=`<div class="world-rank-error">WORLD RANK chưa tải được.<br><small>${String(e.message||e)}</small></div>`}
}
function openWorldRank(){const o=$("worldRankOverlay");if(!o)return;o.classList.remove("hidden");o.setAttribute("aria-hidden","false");loadWorldRank()}
function closeWorldRank(){const o=$("worldRankOverlay");if(o){o.classList.add("hidden");o.setAttribute("aria-hidden","true")}}
$("rankButton").addEventListener("click",openWorldRank);
$("closeWorldRank")?.addEventListener("click",closeWorldRank);
$("refreshWorldRank")?.addEventListener("click",loadWorldRank);
$("worldRankOverlay")?.addEventListener("click",e=>{if(e.target===$("worldRankOverlay"))closeWorldRank()});


/* =========================================================
   SHINE WITHOUT END EVENT
========================================================= */
const EVENT_MAX_POINTS = 1000000;
const EVENT_REWARDS = [
 {points:25000,title:"GOLD",amount:5000},{points:50000,title:"GEMS",amount:100},{points:75000,title:"EVENT TICKET",amount:10},
 {points:100000,title:"EVENT LIMITED CARD",amount:1,card:true,cardId:"event-card-100k"},{points:125000,title:"GOLD",amount:12000},
 {points:150000,title:"KOHANE ★★★★★★",amount:1,character:true,characterId:"kohane"},{points:175000,title:"EVENT TICKET",amount:20},
 {points:200000,title:"GEMS",amount:250},{points:225000,title:"GOLD",amount:18000},{points:250000,title:"KOHANE ★★★★★★",amount:1,character:true,characterId:"kohane"},
 {points:275000,title:"EVENT TICKET",amount:30},{points:300000,title:"EVENT LIMITED CARD",amount:1,card:true,cardId:"event-card-300k"},
 {points:350000,title:"GEMS",amount:400},{points:400000,title:"KOHANE ★★★★★★",amount:1,character:true,characterId:"kohane"},
 {points:450000,title:"GOLD",amount:30000},{points:500000,title:"EVENT LIMITED CARD",amount:1,card:true,cardId:"event-card-500k"},
 {points:550000,title:"EVENT TICKET",amount:40},{points:600000,title:"GEMS",amount:650},{points:650000,title:"KOHANE ★★★★★★",amount:1,character:true,characterId:"kohane"},
 {points:700000,title:"EVENT LIMITED CARD",amount:1,card:true,cardId:"event-card-700k"},{points:750000,title:"GOLD",amount:45000},{points:800000,title:"EVENT TICKET",amount:60},
 {points:850000,title:"KOHANE ★★★★★★",amount:1,character:true,characterId:"kohane"},{points:900000,title:"EVENT LIMITED CARD",amount:1,card:true,cardId:"event-card-900k"},
 {points:925000,title:"GEMS",amount:1000},{points:950000,title:"GOLD",amount:60000},{points:975000,title:"EVENT TICKET",amount:100},
 {points:1000000,title:"EVENT GRAND REWARD",amount:1,gems:2500,gold:100000,tickets:200}
];
const EVENT_SHOP = [
 {id:"event-gold",title:"GOLD ×5,000",cost:5,currency:"coins",amount:5000,limit:20},
 {id:"event-gems",title:"GEMS ×100",cost:10,currency:"gems",amount:100,limit:10},
 {id:"event-card-piece",title:"CARD MEMORY ×1",cost:20,currency:"eventCardMemory",amount:1,limit:10}
];
function ensureEventData(user){if(!user)return;if(!Number.isFinite(Number(user.eventPoints)))user.eventPoints=0;user.eventPoints=Math.max(0,Math.min(EVENT_MAX_POINTS,Number(user.eventPoints)));if(!Number.isFinite(Number(user.eventEnergy)))user.eventEnergy=100;user.eventEnergy=Math.max(0,Number(user.eventEnergy));if(!Number.isFinite(Number(user.eventEnergyUpdatedAt)))user.eventEnergyUpdatedAt=Date.now();recoverEventEnergy(user);if(!Array.isArray(user.eventClaimedRewards))user.eventClaimedRewards=[];if(!user.eventShopPurchases||typeof user.eventShopPurchases!=="object")user.eventShopPurchases={};if(!Array.isArray(user.eventMailbox))user.eventMailbox=[];}
function getEventLevel(points){return Math.min(100,Math.floor(Number(points||0)/1000)+1)}
let energyTimerHandle=null;
function recoverEventEnergy(user){
    if(!user)return 0;
    let energy=Number(user.eventEnergy);
    if(!Number.isFinite(energy))energy=100;
    let stamp=Number(user.eventEnergyUpdatedAt);
    if(!Number.isFinite(stamp)||stamp<=0)stamp=Date.now();
    const now=Date.now(), maxNatural=100, interval=90000;
    if(energy<maxNatural){
        const gained=Math.floor((now-stamp)/interval);
        if(gained>0){energy=Math.min(maxNatural,energy+gained);stamp+=gained*interval;}
    }else stamp=now;
    user.eventEnergy=energy; user.eventEnergyUpdatedAt=stamp;
    return energy;
}
function updateEnergyUI(user=getCurrentUser()){
    if(!user)return;
    const energy=recoverEventEnergy(user), now=Date.now(), stamp=Number(user.eventEnergyUpdatedAt)||now;
    const count=$("lobbyEnergyCount"); if(count)count.textContent=energy.toLocaleString("en-US");
    const popup=$("energyPopupCurrent"); if(popup)popup.textContent=energy.toLocaleString("en-US");
    const timer=$("lobbyEnergyTimer");
    if(timer)timer.textContent=energy>=100?'FULL':`${Math.max(0,90000-(now-stamp))/1000|0}s`;
    if(energyTimerHandle)clearTimeout(energyTimerHandle);
    energyTimerHandle=setTimeout(()=>updateEnergyUI(getCurrentUser()),1000);
}
function openEnergyPopup(){const u=getCurrentUser();if(!u)return;ensureEventData(u);updateEnergyUI(u);$("energyPopup")?.classList.remove("hidden");}
function closeEnergyPopup(){$("energyPopup")?.classList.add("hidden");}
async function buyEnergyPack(amount){
    const u=getCurrentUser(); const costs={50:100,100:220,200:360}; const cost=costs[amount]; if(!u||!cost)return;
    ensureEventData(u); recoverEventEnergy(u);
    if(Number(u.gems||0)<cost){ (typeof showLobbyToast==="function"?showLobbyToast:()=>{})("ENERGY SHOP","Không đủ kim cương."); return; }
    const currentGems = finiteNumber(u.gems, 0);
    if (currentGems < cost) {
        (typeof showLobbyToast === "function" ? showLobbyToast : () => {})("ENERGY SHOP", "Không đủ kim cương.");
        return;
    }
    u.gems = currentGems - cost;
    u.eventEnergy = finiteNumber(u.eventEnergy, 0) + amount;
    u.eventEnergyUpdatedAt = Date.now();
    normalizeLobbyResources(u);
    await updateUser(u);
    setupLobby(u);
    updateEnergyUI(u);
    const text=$("energyPopupSuccessText"); if(text)text.textContent=`+${amount} ENERGY`; const ok=$("energyPopupSuccess"); if(ok){ok.classList.remove('show');void ok.offsetWidth;ok.classList.add('show');clearTimeout(ok._hideTimer);ok._hideTimer=setTimeout(()=>ok.classList.remove('show'),1800);}
}

// ENERGY SHOP UI
$("energyPlus")?.addEventListener("click", openEnergyPopup);
$("closeEnergyPopup")?.addEventListener("click", closeEnergyPopup);
$("energyPopup")?.addEventListener("click", event => {
    if (event.target === $("energyPopup")) closeEnergyPopup();
});
document.querySelectorAll("[data-energy-pack]").forEach(button => {
    button.addEventListener("click", () => buyEnergyPack(Number(button.dataset.energyPack)));
});

function renderEventPage(){
    const user=getCurrentUser();
    if(!user)return;
    ensureEventData(user);
    syncEventMilestoneMail(user);
    const points=Number(user.eventPoints||0);
    const energy=Number(user.eventEnergy||0);
    const level=getEventLevel(points);
    const set=(id,value)=>{const el=$(id);if(el)el.textContent=value};
    set("eventPlayerId",user.username||"PLAYER");
    set("eventLevel",level);
    set("eventLevelHero",level);
    set("eventGems",Number(user.gems||0).toLocaleString("en-US"));
    set("eventCoins",Number(user.coins||0).toLocaleString("en-US"));
    set("eventTickets",Number(user.tickets||0).toLocaleString("en-US"));
    set("eventEnergy",energy.toLocaleString("en-US"));
    set("eventPointsLabel",`${points.toLocaleString("en-US")} / ${EVENT_MAX_POINTS.toLocaleString("en-US")}`);
    const bar=$("eventProgressBar");
    if(bar)bar.style.width=`${Math.min(100,(points/EVENT_MAX_POINTS)*100)}%`;
    renderEventRewards();
    renderEventShop();
    renderEventMailbox();
}
function rewardMailboxKey(reward,index){return `event-${reward.points}-${index}`}
function syncEventMilestoneMail(user){ensureEventData(user);const points=Number(user.eventPoints||0);let changed=false;EVENT_REWARDS.forEach((reward,index)=>{if(points<reward.points)return;const id=rewardMailboxKey(reward,index);if(!user.eventMailbox.some(m=>m.id===id)){user.eventMailbox.push({id,points:reward.points,title:reward.title,reward:{...reward},claimed:false,createdAt:Date.now()});changed=true}});return changed}
function applyEventReward(user,reward){if(reward.card){user.myCards=Array.isArray(user.myCards)?user.myCards:[];const id=reward.cardId||`event-card-${reward.points}`;if(!user.myCards.some(c=>c&&c.id===id))user.myCards.push({id,name:"SHINING MOMENT",image:"assets/event1.png",rarity:6,type:"event",event:"SHINE WITHOUT END"})}else if(reward.character){user.myCharacters=Array.isArray(user.myCharacters)?user.myCharacters:[];user.characterProgress=user.characterProgress||{};if(!user.myCharacters.includes(reward.characterId)){user.myCharacters.push(reward.characterId);user.characterProgress[reward.characterId]={rank:1,level:1}}else{const p=user.characterProgress[reward.characterId]||{rank:1,level:1};p.rank=Math.min(5,Math.max(1,Number(p.rank)||1)+1);p.level=Math.min(getCharacterMaxLevel(p.rank),Number(p.level)||1);user.characterProgress[reward.characterId]=p}}else if(reward.title==="GEMS")user.gems=Number(user.gems||0)+Number(reward.amount||0);else if(reward.title==="GOLD")user.coins=Number(user.coins||0)+Number(reward.amount||0);else if(reward.title==="EVENT TICKET")user.tickets=Number(user.tickets||0)+Number(reward.amount||0);else if(reward.title==="EVENT GRAND REWARD"){user.gems=Number(user.gems||0)+Number(reward.gems||0);user.coins=Number(user.coins||0)+Number(reward.gold||0);user.tickets=Number(user.tickets||0)+Number(reward.tickets||0)}}
function renderEventMailbox(){const user=getCurrentUser();if(!user)return;ensureEventData(user);const mailChanged=syncEventMilestoneMail(user);if(mailChanged)updateUser(user);const list=$("eventMailboxList"),badge=$("eventMailboxBadge");if(!list)return;const unread=user.eventMailbox.filter(m=>!m.claimed).length;if(badge)badge.textContent=unread?unread:"";list.innerHTML=user.eventMailbox.length?user.eventMailbox.slice().sort((a,b)=>b.points-a.points).map(m=>`<article class="event-mail-row ${m.claimed?"claimed":""}"><div class="event-mail-points">${Number(m.points).toLocaleString()} PT</div><div class="event-mail-copy"><small>SHINE WITHOUT END</small><strong>${m.title}</strong></div><button class="event-mail-claim" data-mail-id="${m.id}" ${m.claimed?"disabled":""}>${m.claimed?"CLAIMED":"CLAIM"}</button></article>`).join(""):`<div class="event-mail-row"><div class="event-mail-copy"><strong>NO EVENT MAIL</strong><span>Milestone rewards will arrive here automatically.</span></div></div>`;list.querySelectorAll('[data-mail-id]').forEach(b=>b.onclick=()=>claimEventMail(b.dataset.mailId));}
async function claimEventMail(id){const user=getCurrentUser();if(!user)return;ensureEventData(user);const mail=user.eventMailbox.find(m=>m.id===id);if(!mail||mail.claimed)return;applyEventReward(user,mail.reward||{});mail.claimed=true;mail.claimedAt=Date.now();normalizeLobbyResources(user);await updateUser(user);setupLobby(user);renderEventPage();renderEventMailbox();showLobbyToast("MAILBOX", "Đã nhận phần thưởng.")}
function renderEventRewards(){const user=getCurrentUser();if(!user)return;ensureEventData(user);syncEventMilestoneMail(user);const points=Number(user.eventPoints||0),list=$("eventRewardsList");if(!list)return;list.innerHTML=EVENT_REWARDS.map((r,i)=>{const unlocked=points>=r.points,claimed=user.eventMailbox.some(m=>m.id===rewardMailboxKey(r,i)&&m.claimed);return `<article class="event-reward-row ${unlocked?"unlocked":"locked"} ${claimed?"claimed":""}"><div class="event-reward-point"><small>POINTS</small><strong>${r.points.toLocaleString()}</strong></div><div class="event-reward-icon ${r.card?"card-reward":r.character?"character-reward":""}">${r.card?'<img src="assets/event1.png" alt="">':r.character?'<img src="assets/kohane.png" alt="">':'✦'}</div><div class="event-reward-copy"><small>${r.card?"EVENT CARD · ★★★★★★":r.character?"EVENT CHARACTER · ★★★★★★":"MILESTONE REWARD"}</small><strong>${r.title}</strong><span>${r.card?"SHINING MOMENT · EVENT LIMITED CARD":r.character?"KOHANE · EVENT CHARACTER":r.title==="EVENT GRAND REWARD"?"GEMS ×2,500 · GOLD ×100,000 · TICKET ×100":`×${r.amount}`}</span></div><button class="event-claim-button" data-event-reward="${i}" ${!unlocked||claimed?"disabled":""}>${claimed?"CLAIMED":unlocked?"IN MAILBOX":"LOCKED"}</button></article>`}).join("")}
function renderEventShop(){const user=getCurrentUser(),list=$("eventShopList");if(!user||!list)return;ensureEventData(user);list.innerHTML=EVENT_SHOP.map(item=>{const bought=Number(user.eventShopPurchases[item.id]||0),left=Math.max(0,item.limit-bought);return `<article class="event-shop-item"><div><small>EVENT SHOP</small><strong>${item.title}</strong><span>${item.cost.toLocaleString()} EVENT TICKET · ${left} LEFT</span></div><button data-event-shop="${item.id}" ${left<=0?"disabled":""}>EXCHANGE</button></article>`}).join("");list.querySelectorAll('[data-event-shop]').forEach(b=>b.onclick=()=>buyEventShop(b.dataset.eventShop))}
function buyEventShop(id){const user=getCurrentUser(),item=EVENT_SHOP.find(x=>x.id===id);if(!user||!item)return;ensureEventData(user);const bought=Number(user.eventShopPurchases[id]||0);if(bought>=item.limit){showLobbyToast("EVENT SHOP","Purchase limit reached.");return}if(Number(user.tickets||0)<item.cost){showLobbyToast("EVENT SHOP","Not enough Event Tickets.");return}user.tickets-=item.cost;user.eventShopPurchases[id]=bought+1;if(item.currency==="gems")user.gems=Number(user.gems||0)+item.amount;else if(item.currency==="coins")user.coins=Number(user.coins||0)+item.amount;else user.eventCardMemory=Number(user.eventCardMemory||0)+item.amount;updateUser(user);renderEventPage()}
function openEventScreen(){const user=getCurrentUser();if(!user)return;ensureEventData(user);try{stopLobbyMusic();}catch(_){}updateUser(user);renderEventPage();showScreen("eventScreen");const a=$("eventLobbyAudio");if(a){a.currentTime=0;a.volume=.32;a.play().catch(()=>{})}}
function closeEventModal(id){const e=$(id);if(e){e.classList.add("hidden");e.setAttribute("aria-hidden","true")}}
function openEventModal(id){const e=$(id);if(e){e.classList.remove("hidden");e.setAttribute("aria-hidden","false")}}
function openEventPlay(){const a=$("eventLobbyAudio");if(a){a.pause();a.currentTime=0}window.location.href="event-play.html"}
function initEventSystem(){
    const bind=(id,event,handler)=>{const el=$(id);if(el){el.addEventListener(event,handler);return true}return false};
    bind("eventButton","click",openEventScreen);
    bind("eventBack","click",()=>{const a=$("eventLobbyAudio");if(a){a.pause();a.currentTime=0}showScreen("lobbyScreen")});
    bind("eventRewardsButton","click",()=>{renderEventRewards();openEventModal("eventRewardsPanel")});
    bind("eventShopButton","click",()=>{renderEventShop();openEventModal("eventShopPanel")});
    bind("closeEventRewards","click",()=>closeEventModal("eventRewardsPanel"));
    bind("closeEventShop","click",()=>closeEventModal("eventShopPanel"));
    bind("eventRewardsPanel","click",e=>{if(e.target.id==="eventRewardsPanel")closeEventModal("eventRewardsPanel")});
    bind("eventShopPanel","click",e=>{if(e.target.id==="eventShopPanel")closeEventModal("eventShopPanel")});
    bind("eventGachaButton","click",openAkitoBanner);
    bind("eventPlayButton","click",openEventPlay);
    bind("eventMailboxButton","click",()=>{$("eventMailboxOverlay")?.classList.remove("hidden");renderEventMailbox()});
    bind("closeEventMailbox","click",()=>$("eventMailboxOverlay")?.classList.add("hidden"));
    bind("eventMailboxOverlay","click",e=>{if(e.target===$("eventMailboxOverlay"))$("eventMailboxOverlay").classList.add("hidden")});
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",initEventSystem,{once:true});
else initEventSystem();


/* =========================================================
   GACHA BACK
========================================================= */

$("gachaBack").addEventListener(
    "click",
    () => {

        showScreen(
            "lobbyScreen"
        );

    }
);

/* =========================================================
   CHARACTER INVENTORY
========================================================= */

function getOwnedCharacterIds() {
    const user = getCurrentUser();

    if (!user) return [];

    initGachaData(user);

    // Only characters actually obtained from Character Gacha belong here.
    return [...new Set((user.myCharacters || []).filter(Boolean))];
}


/* =========================================================
   CHECK CHARACTER OWNERSHIP
========================================================= */

function isCharacterOwned(
    characterId
) {

    const ownedIds =
        getOwnedCharacterIds();

    return ownedIds.includes(
        characterId
    );
}


/* =========================================================
   SAVE CHARACTER
========================================================= */

function saveCharacter(
    characterId
) {

    const user =
        getCurrentUser();

    if (!user) {
        return false;
    }

    initGachaData(user);


    /*
        Không lưu default character.
    */
    if (
        characterId ===
        "mystery"
    ) {
        return false;
    }


    /*
        Đã sở hữu rồi.
    */
    if (
        user.myCharacters.includes(
            characterId
        )
    ) {
        return false;
    }


    /*
        Add character vào inventory.
    */
    user.myCharacters.push(characterId);
    if (!user.characterProgress || typeof user.characterProgress !== "object") user.characterProgress = {};
    if (!user.characterProgress[characterId]) user.characterProgress[characterId] = { rank: 1, level: 1 };

    updateUser(user);


    return true;
}


/* =========================================================
   GET OWNED CHARACTERS
========================================================= */

function getOwnedCharacters() {

    const ownedIds =
        getOwnedCharacterIds();

    return CHARACTERS
        .filter(character => ownedIds.includes(character.id))
        .sort((a, b) => {
            const rarityDiff = Number(b.rarity || 0) - Number(a.rarity || 0);
            if (rarityDiff !== 0) return rarityDiff;
            return String(a.name || a.id).localeCompare(String(b.name || b.id));
        });
}

/* =========================================================
   CHARACTER PROGRESSION
========================================================= */
const CHARACTER_MAX_RANK = 5;
const CHARACTER_MAX_LEVEL_R1 = 60;
const CHARACTER_LEVEL_STEP_PER_RANK = 5;
const CHARACTER_INFO = {
    lumina: { base: 13400, perLevel: 245, main: "VOCAL", skillName: "RADIANT VOICE", skill: "Boosts performance score during Skills." },
    akito: { base: 19450, perLevel: 510, main: "ACT", skillName: "REWARD AMPLIFIER", skill: "After completing a stage, increases the amount of stage rewards by 35%.", rewardMultiplier: 1.35 },
    kohane: { base: 21034, perLevel: 410, main: "RAP", skillName: "SHINING REWARD", skill: "After completing a stage, increases the amount of stage rewards by 45%.", rewardMultiplier: 1.45 },
    miku: { base: 9879, perLevel: 654, main: "VOCAL", skillName: "COLORFUL VOICE", skill: "Event: +15% score multiplier." },
    miku6: { base: 21250, perLevel: 620, main: "RAP", skillName: "RADIANT REWARD", skill: "After completing a stage, increases the amount of rewards received by 35%.", rewardMultiplier: 1.35 },
    shota: { base: 19780, perLevel: 550, main: "VOCAL", skillName: "PERFECT GUARD", skill: "Entire team cannot MISS for 7 seconds.", skillType: "teamNoMiss", skillDuration: 7 },
    rui: { base: 13479, perLevel: 490, main: "ACT", skillName: "SHOWTIME TRICK", skill: "For 8 seconds, each PERFECT / GREAT has a 20% chance to add 1 TRICK stack. The next note gains +5% score per stack, up to 3 stacks (+15%), then the stacks reset.", skillType: "trickStack", skillDuration: 8 }
};


const CHARACTER_EVENT_SKILLS_VI = {
    lumina: [
        ["RADIANT VOICE", "+2.250 điểm VOCAL."],
        ["BRIGHT CHANCE", "+3.200 VOCAL; có 25% cơ hội tăng thêm 30% điểm của lượt này."],
        ["VOCAL BREAK", "+1.250 VOCAL và giảm 1.100 VOCAL của đối thủ."]
    ],
    akito: [
        ["BURN ACT", "+2.780 điểm ACT."],
        ["TURN THE TABLE", "Akito lấy 2 lượt đồng minh kế tiếp; ở lượt hành động kế tiếp của Akito, sức mạnh được tăng 200%."],
        ["CROSS BOOST", "Đồng minh khác hệ với Akito được +15% ở lần hành động kế tiếp."]
    ],
    kohane: [
        ["RAP SHINE", "+1.800 điểm RAP."],
        ["BLESSING", "Toàn đội được +55% ở lượt kế tiếp."],
        ["DIVINE TURN", "Đội của bạn được quyền ưu tiên hành động ở lượt kế tiếp."]
    ],
    miku: [
        ["MIKU VOICE", "+1.730 điểm VOCAL."],
        ["NEXT STAGE", "2 lượt hành động đồng minh kế tiếp được +30%."],
        ["COLORFUL VOICE", "+2.000 VOCAL; lần hành động kế tiếp của Miku được +15%."]
    ],
    miku6: [
        ["RADIANT RAP", "+2.780 điểm RAP."],
        ["SPOTLIGHT CALL", "Chọn 1 đồng minh để hành động ngay sau Miku."],
        ["RADIANT PARADE", "Đưa 2 đồng minh còn lại lên hành động trước lượt của đối thủ."]
    ],
    shota: [
        ["PERFECT HARMONY", "+2.650 điểm VOCAL."],
        ["NO WRONG NOTE", "Chặn 2 hiệu ứng giảm điểm tiếp theo do đối thủ gây ra."],
        ["ENCORE PROTECTION", "Chọn 1 đồng minh hành động ngay; hành động đó được +25%."]
    ],
    rui: [
        ["CURTAIN CALL", "+1.950 ACT và MARK đối thủ 2 lượt; debuff giảm điểm kế tiếp mạnh thêm 25%."],
        ["DIRECTOR'S TRICK", "Chọn VOCAL / RAP / ACT để JAM; đối thủ nhận -20% điểm hệ đó trong 2 hành động tính điểm."],
        ["GRAND FINALE", "Đặt bom trễ; sau 2 hành động của đối thủ: giảm 1.500 điểm ở hệ cao nhất của họ và Rui nhận +1.500 ACT."]
    ]
};

function renderCharacterEventSkills(character){
    const panel = $("characterEventSkillPanel");
    if (!panel) return;
    const skills = CHARACTER_EVENT_SKILLS_VI[character?.id] || [];
    panel.innerHTML = skills.length
        ? skills.map((skill, i) => `
            <div class="event-skill-mini">
              <span>${i + 1}</span>
              <div><strong>${skill[0]}</strong><p>${skill[1]}</p></div>
            </div>`).join("")
        : `<div class="event-skill-mini"><span>—</span><div><strong>CHƯA CÓ KỸ NĂNG EVENT</strong><p>Nhân vật này hiện chưa có bộ kỹ năng cho Event Gameplay.</p></div></div>`;
}


function getCharacterProgress(character) {
    const user = getCurrentUser();
    initGachaData(user);
    if (!user.characterProgress || typeof user.characterProgress !== "object") user.characterProgress = {};
    const saved = user.characterProgress[character.id] || {};
    const rank = Math.max(1, Math.min(CHARACTER_MAX_RANK, Number(saved.rank) || 1));
    const maxLevel = CHARACTER_MAX_LEVEL_R1 + (rank - 1) * CHARACTER_LEVEL_STEP_PER_RANK;
    const level = Math.max(1, Math.min(maxLevel, Number(saved.level) || 1));
    user.characterProgress[character.id] = { rank, level };
    return user.characterProgress[character.id];
}
function getCharacterMaxLevel(rank) { return CHARACTER_MAX_LEVEL_R1 + (Math.max(1, Math.min(CHARACTER_MAX_RANK, Number(rank) || 1)) - 1) * CHARACTER_LEVEL_STEP_PER_RANK; }
function getCharacterStat(character) { const p = getCharacterProgress(character); const d = CHARACTER_INFO[character.id] || {base:0,perLevel:0}; return d.base + (p.level - 1) * d.perLevel; }
function saveCharacterProgress(character) { const user=getCurrentUser(); if (!user) return; initGachaData(user); user.characterProgress[character.id]=getCharacterProgress(character); updateUser(user); }
let characterInfoTarget = null;

function openCharacterInfo(character) {
    if (!character || !isCharacterOwned(character.id)) return;

    // Character Information belongs ONLY to MY CHARACTERS.
    // Never reuse or open the MY CARD information overlay here.
    $("cardInfoOverlay")?.classList.add("hidden");
    $("cardInfoOverlay")?.classList.remove("character-info-mode");

    characterInfoTarget = character;
    renderCharacterInfo(character);

    const overlay = $("characterInfoOverlay");
    if (!overlay) return;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
}

function closeCharacterInfo() {
    $("characterInfoOverlay")?.classList.add("hidden");
    $("characterInfoOverlay")?.setAttribute("aria-hidden", "true");
    characterInfoTarget = null;
}

function renderCharacterInfo(character) {
    if (character?.id === "akito" && !character.image) character.image = "assets/akito.png";
    if (character?.id === "kohane" && !character.image) character.image = "assets/kohane.png";
    const p = getCharacterProgress(character);
    const d = CHARACTER_INFO[character.id] || {};
    const max = getCharacterMaxLevel(p.rank);
    $("characterInfoNumber").textContent = `CHARACTER #${character.number || "001"}`;
    $("characterInfoName").textContent = character.name;
    $("characterInfoRarity").textContent = getCardStars(character.rarity || 6);
    $("characterInfoRank").textContent = `RANK ${p.rank}`;
    $("characterInfoLevel").textContent = `LV. ${p.level} / ${max}`;
    $("characterInfoLevelFill").style.width = `${Math.min(100, p.level / max * 100)}%`;
    const cost = getCardUpgradeCost(p.level);
    const up = $("characterInfoUpgrade");
    up.disabled = p.level >= max;
    $("characterInfoUpgradeCost").textContent = p.level >= max
        ? (p.rank < CHARACTER_MAX_RANK ? "RANK UP REQUIRED" : "MAX LEVEL")
        : `● ${cost.toLocaleString()} GOLD`;
    $("characterInfoArt").innerHTML = character.image ? `<img src="${character.image}" alt="${character.name}">` : `<span>✦</span>`;
    const mainType = d.main || "VOCAL";
    $("characterInfoVocal").textContent = getCharacterStat(character).toLocaleString();
    $("characterInfoStatLabel").textContent = mainType;
    $("characterInfoMainType").textContent = mainType;
    const infoStat = $("characterInfoStatLabel")?.closest(".character-info-stat-single");
    const infoMainType = $("characterInfoMainType");
    infoStat?.classList.toggle("vocal-stat", mainType === "VOCAL");
    infoStat?.classList.toggle("rap-stat", mainType === "RAP");
    infoStat?.classList.toggle("act-stat", mainType === "ACT");
    infoMainType?.classList.toggle("vocal-type", mainType === "VOCAL");
    infoMainType?.classList.toggle("rap-type", mainType === "RAP");
    infoMainType?.classList.toggle("act-type", mainType === "ACT");
    $("characterInfoSkillName").textContent = d.skillName || "SKILL";
    $("characterInfoSkillDescription").textContent = d.skill || "—";
    renderCharacterEventSkills(character);
    $("characterEventSkillPanel")?.classList.add("hidden");
    $("characterEventSkillToggle")?.classList.remove("open");
    $("characterEventSkillToggle")?.setAttribute("aria-expanded", "false");
}

function upgradeCharacterLevel() {
    const character = characterInfoTarget;
    if (!character) return;
    const user = getCurrentUser();
    if (!user) return;
    initGachaData(user);
    const p = getCharacterProgress(character);
    const max = getCharacterMaxLevel(p.rank);
    if (p.level >= max) {
        showLobbyToast("MAX LEVEL", p.rank < CHARACTER_MAX_RANK ? "Increase Character Rank to unlock more levels." : "This character has reached the maximum level.");
        return;
    }
    const cost = getCardUpgradeCost(p.level);
    const coins = Number(user.coins || 0);
    if (coins < cost) {
        showLobbyToast("NOT ENOUGH GOLD", `You need ${cost.toLocaleString()} GOLD to upgrade this level.`);
        return;
    }
    user.coins = coins - cost;
    p.level += 1;
    user.characterProgress[character.id] = p;
    updateUser(user);
    setupLobby(user);
    renderCharacterInfo(character);
    renderMyCharacters();
    renderTeamSelect();
}

$("characterInfoBack")?.addEventListener("click", closeCharacterInfo);
$("characterInfoUpgrade")?.addEventListener("click", upgradeCharacterLevel);
$("characterEventSkillToggle")?.addEventListener("click", () => {
    const panel = $("characterEventSkillPanel");
    const toggle = $("characterEventSkillToggle");
    if (!panel || !toggle) return;
    const opening = panel.classList.contains("hidden");
    panel.classList.toggle("hidden", !opening);
    toggle.classList.toggle("open", opening);
    toggle.setAttribute("aria-expanded", opening ? "true" : "false");
});
$("characterInfoOverlay")?.addEventListener("click", event => {
    if (event.target === $("characterInfoOverlay")) closeCharacterInfo();
});

let cardInfoTargetType = "card";
/* =========================================================
   MY CHARACTERS SCREEN
========================================================= */

function selectCharacter(characterId) {
    const user = getCurrentUser();
    if (!user) return;
    initGachaData(user);

    if (!isCharacterOwned(characterId)) return;

    user.selectedCharacterId = characterId;
    selectedCharacterId = characterId;
    updateUser(user);
    renderMyCharacters();

    showLobbyToast("CHARACTER SELECTED", `${characterId.toUpperCase()} is ready for gameplay.`);
}

function renderMyCharacters() {
    const user = getCurrentUser();
    const grid = $("myCharacterGrid");
    const count = $("characterCount");
    const total = $("characterTotal");
    if (!user || !grid) return;

    initGachaData(user);
    const owned = getOwnedCharacters().slice().sort((a, b) => {
        const rarityDiff = Number(b.rarity || 0) - Number(a.rarity || 0);
        if (rarityDiff) return rarityDiff;
        return String(a.name || "").localeCompare(String(b.name || ""));
    });
    if (count) count.textContent = owned.length;
    if (total) total.textContent = owned.length;
    grid.innerHTML = "";

    if (!owned.length) {
        grid.innerHTML = `
            <div class="empty-card-state my-character-empty-state">
                <div class="empty-card-icon">✦</div>
                <strong>NO CHARACTERS YET</strong>
                <span>Your limited characters will appear here after you obtain one.</span>
                <button type="button" id="emptyCharacterGacha">GO TO CHARACTER GACHA</button>
            </div>`;
        $("emptyCharacterGacha")?.addEventListener("click", openCharacterBanner);
        return;
    }

    owned.forEach((character, index) => {
        if (character.id === "akito" && !character.image) character.image = "assets/akito.png";
        const progress = getCharacterProgress(character);
        const rarity = Number(character.rarity || 6);
        const maxLevel = getCharacterMaxLevel(progress.rank);
        const currentStat = getCharacterStat(character);
        const article = document.createElement("article");
        article.className = "my-card my-character-card";
        article.dataset.rarity = rarity;
        article.style.animationDelay = `${index * 55}ms`;
        if (character.id === user.selectedCharacterId) article.classList.add("character-selected");
        article.innerHTML = `
            <div class="my-card-top">
                <span class="my-card-rarity">${getCardStars(rarity)}</span>
                <span class="my-card-rank">RANK ${progress.rank}</span>
                <span class="my-card-type">LIMIT</span>
            </div>
            <div class="my-card-image my-character-image">
                ${character.image ? `<img src="${character.image}" alt="${character.name}">` : `<div class="my-card-fallback">✦</div>`}
            </div>
            <div class="my-card-info my-character-info-card">
                <div class="my-character-level-line"><span>LV. ${progress.level} / ${maxLevel}</span><strong class="character-main-stat ${character.main === "ACT" ? "act-stat-text" : character.main === "RAP" ? "rap-stat-text" : "vocal-stat-text"}">${currentStat.toLocaleString()} ${character.main || "VOCAL"}</strong></div>
                <div class="my-card-name">${character.name}</div>
                <div class="my-character-skill-line">${character.skillName || "SKILL"}</div>
                <div class="my-character-action-row">
                    <button type="button" class="my-character-use-card">${character.id === user.selectedCharacterId ? "SELECTED" : "USE CHARACTER"}</button>
                    <button type="button" class="my-character-info-button">INFO</button>
                </div>
            </div>`;

        article.querySelector(".my-character-use-card")?.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            selectCharacter(character.id);
        });
        article.querySelector(".my-character-info-button")?.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            openCharacterInfo(character);
        });
        grid.appendChild(article);
    });
}

/* =========================================================
   GACHA - SIMPLE WORKING VERSION
========================================================= */

const GACHA_COST_SINGLE = 160;
const GACHA_COST_TEN = 1600;
const CARD_EXCHANGE_GEMS = 35;

const GACHA_ITEMS = [
    {
        name: "Xoài Non",
        image: "assets/xoai-non.png",
        rate: 1.3,
        rarity: 6,
        type: "featured"
    },

    {
        name: "Violin",
        image: "assets/violin.png",
        rate: 1.3,
        rarity: 6,
        type: "featured"
    },

    {
        name: "Bơ",
        image: "assets/bo.png",
        rate: 15,
        rarity: 4,
        type: "featured"
    },

    {
        name: "Chuối",
        image: "assets/banana.png",
        rate: 15,
        rarity: 4,
        type: "featured"
    },

    {
        name: "Piano",
        image: "assets/piano.png",
        rate: 7,
        rarity: 5,
        type: "featured"
    },

    {
        name: "JUNK",
        image: null,
        rate: 60.4,
        rarity: 1,
        type: "junk"
    }


];
/* =========================================================
   CHARACTER GACHA POOL
========================================================= */

const GACHA_CHARACTERS = [
    // 6★ LIMITED BEGINNING SHOTA.
    { id:"shota", name:"SHOTA", image:"assets/shota.png", type:"character", rarity:6, rate:0.33333, banner:"shota", main:"VOCAL", base:19780, perLevel:550, skillType:"teamNoMiss", skillDuration:7 },
    // 6★ LIMITED RADIANT BRIDE MIKU — separate ID from the original 5★ Miku.
    { id:"miku6", name:"HATSUNE MIKU", image:"assets/miku1.png", type:"character", rarity:6, rate:0.33333, banner:"character", main:"RAP", base:21250, perLevel:620, rewardMultiplier:1.35 },
    // Original 5★ Miku. Appears as an off-feature character and never resets 6★ pity.
    { id:"miku", name:"HATSUNE MIKU", image:"assets/miku.png", type:"character", rarity:5, rate:5, banner:"both", main:"VOCAL", base:9879, perLevel:654 },
    // Permanent 5★ Rui — available in every CHARACTER banner, never in Card Gacha, and never resets 6★ pity.
    { id:"rui", name:"RUI KAMISHIRO", image:"assets/rui.png", type:"character", rarity:5, rate:5, banner:"all-character", main:"ACT", base:13479, perLevel:490, skillType:"trickStack", skillDuration:8 },
    { id:"akito", name:"AKITO", image:"assets/akito.png", type:"character", rarity:6, rate:0.33333, banner:"akito", main:"ACT", base:19450, perLevel:510, rewardMultiplier:1.35 }
];
/* =========================================================
   GACHA PITY / HISTORY / MY CARD DATA
========================================================= */

const GACHA_HISTORY_LIMIT = 30;

/*
    Khởi tạo dữ liệu gacha cho tài khoản cũ.
    Tài khoản mới cũng sẽ dùng chung cấu trúc này.
*/
function initGachaData(user) {

    if (!user) return null;

    if (
        typeof user.gachaPity !== "number" ||
        user.gachaPity < 0
    ) {
        user.gachaPity = 0;
    }

    if (!Array.isArray(user.gachaHistory)) {
        user.gachaHistory = [];
    }

    if (!Array.isArray(user.myCards)) {
        user.myCards = [];
    }
if (!Array.isArray(user.myCharacters)) {
    user.myCharacters = [];
}

    if (typeof user.selectedCharacterId !== "string") {
        user.selectedCharacterId = "mystery";
    }

    if (typeof user.characterPity !== "number" || user.characterPity < 0) {
        user.characterPity = 0;
    }
    if (typeof user.akitoPity !== "number" || user.akitoPity < 0) {
        user.akitoPity = 0;
    }
    if (typeof user.shotaPity !== "number" || user.shotaPity < 0) {
        user.shotaPity = 0;
    }
    if (!user.characterProgress || typeof user.characterProgress !== "object") user.characterProgress = {};

    return user;
}


/*
    Lưu lịch sử pity.
    Chỉ lưu thông tin liên quan tới pity,
    không lưu toàn bộ kết quả roll.
*/
function saveGachaHistory(
    user,
    pityBefore,
    pityAfter,
    pullCount,
    sixStarCount
) {

    initGachaData(user);

    user.gachaHistory.unshift({
        id: Date.now(),
        time: Date.now(),

        pulls: pullCount,

        pityBefore: pityBefore,
        pityAfter: pityAfter,

        sixStarCount: sixStarCount
    });

    /*
        Chỉ giữ 30 lịch sử gần nhất.
    */
    if (
        user.gachaHistory.length >
        GACHA_HISTORY_LIMIT
    ) {

        user.gachaHistory =
            user.gachaHistory.slice(
                0,
                GACHA_HISTORY_LIMIT
            );
    }
}


/*
    Lưu item 4★ / 5★ / 6★ vào My Card.
    Chưa làm UI My Card ở bước này.
*/
/* =========================================================
   SAVE GACHA CARDS
   RANK SYSTEM

   Rank 1 = card mới
   Rank 2-5 = card trùng
   Rank 5 + duplicate = 320 GEMS
========================================================= */

const DUPLICATE_CARD_GEMS = 320;
const MAX_CARD_RANK = 5;


function saveGachaCards(
    user,
    results
) {

    initGachaData(user);


    if (!Array.isArray(user.myCards)) {
        user.myCards = [];
    }


    let duplicateGems = 0;


    results.forEach(
        item => {

            /* Characters belong to My Character, not My Cards. */
            if (item.type === "character") {
                return;
            }

            const rarity =
                Number(
                    item.rarity ?? 0
                );


            /*
                Chỉ card 4★ / 5★ / 6★
            */
            if (rarity < 4) {
                return;
            }


            /*
                Tìm card đã có.
                Card được xác định bằng
                name + rarity.
            */
            const existingCard =
                user.myCards.find(
                    card =>
                        card.name === item.name &&
                        Number(card.rarity) === rarity
                );


            /* =========================================
               CARD MỚI
            ========================================= */

            if (!existingCard) {

                user.myCards.push({

                    id:
                        Date.now() +
                        Math.random(),

                    name:
                        item.name,

                    image:
                        item.image || null,

                    rarity:
                        rarity,

                    type:
                        item.type || "normal",

                    rank:
                        1,

                    level:
                        1,

                    obtainedAt:
                        Date.now()

                });

                return;
            }


            /* =========================================
               DUPLICATE
            ========================================= */

            const currentRank =
                Number(
                    existingCard.rank ?? 1
                );


            /*
                Chưa Rank 5
                → tăng Rank
            */
            if (
                currentRank <
                MAX_CARD_RANK
            ) {

                existingCard.rank =
                    currentRank + 1;

                /*
                    Cập nhật thời gian
                    nhận duplicate gần nhất.
                */
                existingCard.obtainedAt =
                    Date.now();

                return;
            }


            /*
                Đã Rank 5
                → duplicate = 320 Gems
            */
            duplicateGems +=
                DUPLICATE_CARD_GEMS;

        }
    );


    /*
        Cộng Gems từ duplicate
        Rank 5.
    */
    if (duplicateGems > 0) {

        user.gems =
            Number(
                user.gems ?? 0
            ) + duplicateGems;

    }


    updateUser(user);


    return {
        duplicateGems:
            duplicateGems
    };

}


/*
    Format thời gian lịch sử.
*/
function formatGachaHistoryTime(
    timestamp
) {

    const date =
        new Date(timestamp);

    return date.toLocaleString(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

/* =========================================================
   GACHA ELEMENTS
========================================================= */

const gachaButton =
    document.getElementById("gachaButton");

const gachaBack =
    document.getElementById("gachaBack");

const singleRoll =
    document.getElementById("singleRoll");

const tenRoll =
    document.getElementById("tenRoll");

const gachaOverlay =
    document.getElementById("gachaResultOverlay");

const resultsPanel =
    document.getElementById("gachaResultsPanel");

const resultGrid =
    document.getElementById("gachaResultGrid");

const resultsCount =
    document.getElementById("resultsCount");

const closeGachaResult =
    document.getElementById("closeGachaResult");

const characterSingleRoll = document.getElementById("characterSingleRoll");
const characterTenRoll = document.getElementById("characterTenRoll");
const akitoSingleRoll = document.getElementById("akitoSingleRoll");
const akitoTenRoll = document.getElementById("akitoTenRoll");
const shotaSingleRoll = document.getElementById("shotaSingleRoll");
const shotaTenRoll = document.getElementById("shotaTenRoll");


let gachaBusy = false;


/* =========================================================
   OPEN GACHA
========================================================= */

gachaButton.addEventListener(
    "click",
    function () {

        const user =
            getCurrentUser();

        if (user) {

            const gems =
                Number(
                    user.gems ?? 0
                );

            const gachaGemCount =
                document.getElementById(
                    "gachaGemCount"
                );

            if (gachaGemCount) {

                gachaGemCount.textContent =
                    gems.toLocaleString();

            }
        }

        showScreen(
            "gachaScreen"
        );
    }
);


/* =========================================================
   BACK TO LOBBY
========================================================= */

gachaBack.addEventListener(
    "click",
    function () {

        /* đóng popup nếu đang mở */

        if (gachaOverlay) {

            gachaOverlay.classList.add(
                "hidden"
            );
        }

        gachaBusy =
            false;

        singleRoll.disabled =
            false;

        tenRoll.disabled =
            false;

        showScreen(
            "lobbyScreen"
        );
    }
);


/* =========================================================
   RANDOM
========================================================= */

function getRandomGachaItem() {

    const number =
        Math.random() * 100;

    let total = 0;

    for (
        const item of GACHA_ITEMS
    ) {

        total += item.rate;

        if (
            number < total
        ) {

            return item;
        }
    }

    return GACHA_ITEMS[
        GACHA_ITEMS.length - 1
    ];
}


/* =========================================================
   RANDOM CHARACTER REWARD
========================================================= */

function tryRollCharacter() {

    const character =
        GACHA_CHARACTERS[0];

    if (!character) {
        return null;
    }

    /* rate is treated as percent, e.g. 0.5 = 0.5% */
    if (Math.random() * 100 < Number(character.rate ?? 0)) {
        return { ...character };
    }

    return null;
}


/* =========================================================
   UPDATE GEM
========================================================= */

function updateGachaGemCount(
    user
) {

    const gems =
        Number(
            user.gems ?? 0
        );


    const lobbyGem =
        document.getElementById(
            "gemCount"
        );

    const gachaGem =
        document.getElementById(
            "gachaGemCount"
        );


    if (lobbyGem) {

        lobbyGem.textContent =
            gems.toLocaleString();

    }


    if (gachaGem) {

        gachaGem.textContent =
            gems.toLocaleString();

    }
}

/* =========================================================
   UPDATE PITY DISPLAY
========================================================= */

function updateGachaPityDisplay(
    user
) {

    if (!user) {
        return;
    }


    /*
        Nếu tài khoản chưa có pity,
        mặc định là 0.
    */
    if (
        typeof user.gachaPity !== "number"
    ) {

        user.gachaPity = 0;
    }


    const pityElement =
        document.getElementById(
            "gachaPityCount"
        );


    if (!pityElement) {
        return;
    }


    pityElement.textContent =
        user.gachaPity;
}


function updateCharacterPityDisplay(user) {
    if (!user) return;
    initGachaData(user);
    const el = document.getElementById("characterPityCount");
    if (el) el.textContent = String(user.characterPity || 0);
    const akitoEl = document.getElementById("akitoPityCount");
    if (akitoEl) akitoEl.textContent = String(user.akitoPity || 0);
    const shotaEl = document.getElementById("shotaPityCount");
    if (shotaEl) shotaEl.textContent = String(user.shotaPity || 0);
}

/* =========================================================
   CREATE RESULT TILE
========================================================= */

function createResultTile(
    item,
    number
) {

    const tile =
        document.createElement(
            "div"
        );


    tile.className =
        "gacha-result-tile";


    tile.dataset.rarity =
        item.rarity;


    /* =========================
       NUMBER
    ========================= */

    const numberElement =
        document.createElement(
            "span"
        );

    numberElement.textContent =
        number;


    numberElement.className =
        "result-number";


    /* =========================
       STARS
    ========================= */

    const stars =
        document.createElement(
            "div"
        );

    stars.className =
        "tile-stars";


    stars.textContent =
        "★".repeat(
            item.rarity
        );


    /* =========================
       IMAGE
    ========================= */

    const imageArea =
        document.createElement(
            "div"
        );

    imageArea.className =
        "tile-image";


    if (item.image) {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            item.image;


        img.alt =
            item.name;


        img.onerror =
            function () {

                imageArea.innerHTML =
                    `
                    <div class="image-fallback">
                        ${item.name}
                    </div>
                    `;

            };


        imageArea.appendChild(
            img
        );

    } else {

        imageArea.innerHTML =
            `
            <div class="junk-mark">
                ?
            </div>
            `;
    }


    /* =========================
       NAME
    ========================= */

    const name =
        document.createElement(
            "div"
        );


    name.className =
        "tile-name";


    name.textContent =
        item.name;


    /* =========================
       APPEND
    ========================= */

    tile.append(
        numberElement,
        stars,
        imageArea,
        name
    );


    return tile;
}


/* =========================================================
   SHOW RESULT POPUP
========================================================= */

function showGachaResult(
    results
) {

    if (!gachaOverlay) {

        console.error(
            "Gacha overlay not found."
        );

        return;
    }


    if (!resultsPanel) {

        console.error(
            "Gacha results panel not found."
        );

        return;
    }


    if (!resultGrid) {

        console.error(
            "Gacha result grid not found."
        );

        return;
    }


    /* =========================
       CLEAR OLD
    ========================= */

    resultGrid.innerHTML =
        "";


    /* =========================
       COUNT
    ========================= */

    resultsCount.textContent =
        results.length === 1
            ? "1 ATTEMPT"
            : "10x ATTEMPTS";


    /* =========================
       1 ROLL
    ========================= */

    if (
        results.length === 1
    ) {

        resultGrid.style.gridTemplateColumns =
            "minmax(180px, 260px)";

        resultGrid.style.justifyContent =
            "center";

    } else {

        resultGrid.style.gridTemplateColumns =
            "repeat(5, minmax(0, 1fr))";

        resultGrid.style.justifyContent =
            "stretch";
    }


    /* =========================
       CREATE
    ========================= */

    const tiles = [];


    results.forEach(
        function (
            item,
            index
        ) {

            const tile =
                createResultTile(
                    item,
                    index + 1
                );


            resultGrid.appendChild(
                tile
            );


            tiles.push(
                tile
            );
        }
    );


    /* =========================
       SHOW POPUP
    ========================= */

    gachaOverlay.classList.remove(
        "hidden"
    );


    resultsPanel.classList.add(
        "show"
    );


    /* =========================
       SHOW 1 -> 2 -> 3...
    ========================= */

    tiles.forEach(
        function (
            tile,
            index
        ) {

            setTimeout(
                function () {

                    tile.style.setProperty(
                        "opacity",
                        "1",
                        "important"
                    );


                    tile.style.setProperty(
                        "transform",
                        "translateY(0)",
                        "important"
                    );

                },
                100 + index * 120
            );

        }
    );
}


/* =========================================================
   ROLL
========================================================= */

function doCharacterGacha(amount) {
    if (gachaBusy) return;
    const user=getCurrentUser();
    if(!user){showGachaToast("LOGIN REQUIRED","Vui lòng đăng nhập trước khi roll.");return;}
    initGachaData(user);
    const cost=amount===1?GACHA_COST_SINGLE:GACHA_COST_TEN;
    if(Number(user.gems||0)<cost){showGachaToast("NOT ENOUGH GEMS",`Bạn cần ${cost} gems để roll.`);return;}

    const banner = activeGachaBanner==="akito" ? "akito"
        : activeGachaBanner==="shota" ? "shota"
        : "character";
    const featured=GACHA_CHARACTERS.find(x=>x.banner===banner);
    if(!featured)return;

    user.gems=Number(user.gems||0)-cost;gachaBusy=true;
    [singleRoll,tenRoll,characterSingleRoll,characterTenRoll,akitoSingleRoll,akitoTenRoll,shotaSingleRoll,shotaTenRoll]
        .forEach(b=>{if(b)b.disabled=true});

    const pityKey = banner==="akito" ? "akitoPity" : banner==="shota" ? "shotaPity" : "characterPity";
    const pityLimit = banner==="akito" ? 120 : 100;
    const results=[];

    for(let i=0;i<amount;i++){
        user[pityKey]=Number(user[pityKey]||0)+1;
        let item=null;
        if(user[pityKey]>=pityLimit){
            item={...featured};
            user[pityKey]=0;
        } else {
            const offFiveRoll = Math.random()*100;
            if(offFiveRoll < 5){
                item={...GACHA_CHARACTERS.find(x=>x.id==="miku")};
            } else if(offFiveRoll < 10){
                item={...GACHA_CHARACTERS.find(x=>x.id==="rui")};
            }
        }
        if(!item && Math.random()*100<Number(featured.rate||0)){
            item={...featured};
            user[pityKey]=0;
        }
        if(!item){
            item={id:`character-miss-${Date.now()}-${i}`,name:"NO CHARACTER",image:null,rarity:1,type:"character-miss"};
        }
        results.push(item);
        if(item.type==="character"){
            if(!Array.isArray(user.myCharacters))user.myCharacters=[];
            if(!user.myCharacters.includes(item.id))user.myCharacters.push(item.id);
            user.characterProgress=user.characterProgress||{};
            if(!user.characterProgress[item.id])user.characterProgress[item.id]={rank:1,level:1};
            else user.characterProgress[item.id].rank=Math.min(5,Number(user.characterProgress[item.id].rank||1)+1);
            user.selectedCharacterId=item.id;
        }
    }
    updateUser(user);
    renderMyCharacters();
    updateGachaGemCount(user);
    updateCharacterPityDisplay(user);
    showGachaResult(results);
}

function doGacha(
    amount
) {

    if (gachaBusy) {
        return;
    }

    const user = getCurrentUser();
    if (!user) {
        showGachaToast("LOGIN REQUIRED", "Vui lòng đăng nhập trước khi roll.");
        return;
    }

    initGachaData(user);

    const cost = amount === 1 ? GACHA_COST_SINGLE : GACHA_COST_TEN;
    const currentGems = Number(user.gems ?? 0);

    if (currentGems < cost) {
        showGachaToast("NOT ENOUGH GEMS", `Bạn cần ${cost} gems để roll.`);
        return;
    }

    const pityBefore = Number(user.gachaPity || 0);
    user.gems = currentGems - cost;
    gachaBusy = true;

    if (singleRoll) singleRoll.disabled = true;
    if (tenRoll) tenRoll.disabled = true;
    if (characterSingleRoll) characterSingleRoll.disabled = true;
    if (characterTenRoll) characterTenRoll.disabled = true;
    if (akitoSingleRoll) akitoSingleRoll.disabled = true;
    if (akitoTenRoll) akitoTenRoll.disabled = true;
    if (shotaSingleRoll) shotaSingleRoll.disabled = true;
    if (shotaTenRoll) shotaTenRoll.disabled = true;

    const results = [];
    let sixStarCount = 0;

    /*
       CARD GACHA ONLY:
       tuyệt đối không gọi tryRollCharacter() ở đây.
       Character có banner/pity riêng.
    */
    for (let i = 0; i < amount; i++) {
        const item = getRandomGachaItem();
        results.push({ ...item });

        // Mỗi pull, kể cả 10-roll, tăng đúng 1 pity.
        user.gachaPity = Number(user.gachaPity || 0) + 1;

        // Card 6★ reset pity ngay tại pull vừa ra 6★.
        if (Number(item.rarity || 0) >= 6) {
            user.gachaPity = 0;
            sixStarCount++;
        }

        updateGachaPityDisplay(user);
    }

    const pityAfter = Number(user.gachaPity || 0);

    // Lưu lịch sử sau toàn bộ 1-roll/10-roll, tránh mất pity sau reload.
    saveGachaHistory(user, pityBefore, pityAfter, amount, sixStarCount);

    // Lưu card; character không thể lọt vào đây nữa.
    const cardResult = saveGachaCards(user, results);

    // Một lần sync cuối cùng có cả pity + history + cards.
    updateUser(user);
    updateGachaGemCount(user);
    updateGachaPityDisplay(user);

    if (cardResult && cardResult.duplicateGems > 0) {
        setTimeout(() => {
            showGachaToast(
                "DUPLICATE CARD",
                `MAX RANK DUPLICATE → +${cardResult.duplicateGems} GEMS`
            );
        }, 800);
    }

    showGachaResult(results);
}


/* =========================================================
   1 ROLL
========================================================= */

singleRoll?.addEventListener("click", () => {
    doGacha(1);
});

characterSingleRoll?.addEventListener("click", () => {
    doCharacterGacha(1);
});

/* =========================================================
   10 ROLL
========================================================= */

tenRoll?.addEventListener("click", () => {
    doGacha(10);
});

characterTenRoll?.addEventListener("click", () => {
    doCharacterGacha(10);
});

$("dailyAttendanceMini")?.addEventListener("click", () => openDailyAttendancePopup());
$("dailyAttendanceClaim")?.addEventListener("click", claimDailyAttendance);
$("dailyAttendanceClose")?.addEventListener("click", closeDailyAttendance);
$("dailyAttendanceOverlay")?.addEventListener("click", (event) => {
    if (event.target === $("dailyAttendanceOverlay")) closeDailyAttendance();
});


/* =========================================================
   CLOSE RESULT
========================================================= */

closeGachaResult.addEventListener(
    "click",
    function () {

        gachaOverlay.classList.add(
            "hidden"
        );


        resultsPanel.classList.remove(
            "show"
        );


        resultGrid.innerHTML =
            "";


        gachaBusy =
            false;


        singleRoll.disabled =
            false;


        tenRoll.disabled =
            false;

        if (characterSingleRoll) characterSingleRoll.disabled = false;
        if (characterTenRoll) characterTenRoll.disabled = false;
        if (akitoSingleRoll) akitoSingleRoll.disabled = false;
        if (akitoTenRoll) akitoTenRoll.disabled = false;
        if (shotaSingleRoll) shotaSingleRoll.disabled = false;
        if (shotaTenRoll) shotaTenRoll.disabled = false;

    }
);


/* =========================================================
   CLOSE POPUP BY CLICK BACKDROP
========================================================= */

gachaOverlay.addEventListener(
    "click",
    (event) => {

        /*
            Chỉ đóng khi click đúng
            nền overlay, không phải
            card kết quả.
        */

        if (
            event.target ===
            gachaOverlay
        ) {

            closeGachaResult.click();
        }

    }
);


/* =========================================================
   GACHA BANNERS
========================================================= */

let activeGachaBanner = "items";

function setGachaBanner(name) {
    activeGachaBanner = name;
    $("shotaBannerButton")?.classList.toggle("active", name === "shota");
    $("currentBannerButton")?.classList.toggle("active", name === "items");
    $("characterBannerButton")?.classList.toggle("active", name === "character");
    $("akitoBannerButton")?.classList.toggle("active", name === "akito");
    $("shotaGachaContent")?.classList.toggle("hidden", name !== "shota");
    $("itemGachaContent")?.classList.toggle("hidden", name !== "items");
    $("characterGachaContent")?.classList.toggle("hidden", name !== "character");
    $("akitoGachaContent")?.classList.toggle("hidden", name !== "akito");
    updateGachaPityDisplay(getCurrentUser());
    updateCharacterPityDisplay(getCurrentUser());
}

function openShotaBanner() {
    showScreen("gachaScreen");
    setGachaBanner("shota");
}

function openCharacterBanner() {
    showScreen("gachaScreen");
    setGachaBanner("character");
}

function openAkitoBanner() {
    showScreen("gachaScreen");
    setGachaBanner("akito");
}

$("shotaBannerButton")?.addEventListener("click", openShotaBanner);
$("characterBannerButton")?.addEventListener("click", openCharacterBanner);
$("akitoBannerButton")?.addEventListener("click", openAkitoBanner);

$("shotaSingleRoll")?.addEventListener("click", () => doCharacterGacha(1));
$("shotaTenRoll")?.addEventListener("click", () => doCharacterGacha(10));
$("akitoSingleRoll")?.addEventListener("click", () => doCharacterGacha(1));
$("akitoTenRoll")?.addEventListener("click", () => doCharacterGacha(10));

/* =========================================================
   GACHA BANNER
========================================================= */

function showGachaComingSoon() {

    showGachaToast(
        "CURRENT BANNER",
        "Bạn đang ở banner hiện tại."
    );

}


$("currentBannerButton")
    .addEventListener(
        "click",
        () => {
            setGachaBanner("items");
        }
    );


/* =========================================================
   GEM SHOP
========================================================= */

const gemPlus =
    $("gemPlus");

const gemPopup =
    $("gemPopup");

const closeGemPopup =
    $("closeGemPopup");

const gemPopupCurrent =
    $("gemPopupCurrent");

const gemPopupSuccess =
    $("gemPopupSuccess");

const gemPopupSuccessText =
    $("gemPopupSuccessText");

const gemPacks =
    document.querySelectorAll(
        '#gemPopup .gem-pack[data-gems]'
    );


/* =========================================================
   OPEN GEM SHOP
========================================================= */

function openGemPopup() {

    const user =
        getCurrentUser();


    if (!user) {

        showLobbyToast(
            "LOGIN REQUIRED",
            "Vui lòng đăng nhập trước."
        );

        return;
    }


    const gems =
        Number(
            user.gems ?? 0
        );


    if (gemPopupCurrent) {

        gemPopupCurrent.textContent =
            gems.toLocaleString();
    }


    if (gemPopup) {

        gemPopup.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   CLOSE GEM SHOP
========================================================= */

function closeGemShop() {

    if (!gemPopup) return;


    gemPopup.classList.add(
        "hidden"
    );
}


/* =========================================================
   GEM PLUS
========================================================= */

if (gemPlus) {

    gemPlus.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            openGemPopup();

        }
    );
}


/* =========================================================
   GEM POPUP CLOSE
========================================================= */

if (closeGemPopup) {

    closeGemPopup.addEventListener(
        "click",
        () => {

            closeGemShop();

        }
    );
}


/* =========================================================
   CLICK OUTSIDE GEM POPUP
========================================================= */

if (gemPopup) {

    gemPopup.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                gemPopup
            ) {

                closeGemShop();
            }

        }
    );
}


/* =========================================================
   GEM PACKS
========================================================= */

gemPacks.forEach(
    pack => {

        pack.addEventListener(
            "click",
            () => {

                const amount =
                    Number(
                        pack.dataset.gems
                    );


                const user =
                    getCurrentUser();


                if (!user) {

                    closeGemShop();


                    showLobbyToast(
                        "LOGIN REQUIRED",
                        "Vui lòng đăng nhập trước."
                    );


                    return;
                }


                /*
                    Add Gems.
                */

                user.gems =
                    Number(
                        user.gems ?? 0
                    ) + amount;


                /*
                    Save.
                */

                updateUser(
                    user
                );


                /*
                    Update lobby + gacha.
                */

                /* =========================
   UPDATE GEM DISPLAY
========================= */

const newGemValue =
    Number(
        user.gems ?? 0
    );


const lobbyGem =
    document.getElementById(
        "gemCount"
    );


const gachaGem =
    document.getElementById(
        "gachaGemCount"
    );


if (lobbyGem) {

    lobbyGem.textContent =
        newGemValue.toLocaleString();
}


if (gachaGem) {

    gachaGem.textContent =
        newGemValue.toLocaleString();
}


if (gemPopupCurrent) {

    gemPopupCurrent.textContent =
        newGemValue.toLocaleString();
}


                if (
                    gemPopupCurrent
                ) {

                    gemPopupCurrent.textContent =
                        user.gems.toLocaleString();
                }


                /*
                    Success.
                */

                if (
                    gemPopupSuccessText
                ) {

                    gemPopupSuccessText.textContent =
                        `+${amount.toLocaleString()} GEMS`;
                }


                if (
                    gemPopupSuccess
                ) {

                    gemPopupSuccess.classList.remove(
                        "show"
                    );


                    void gemPopupSuccess.offsetWidth;


                    gemPopupSuccess.classList.add(
                        "show"
                    );


                    clearTimeout(
                        gemPopupSuccess._hideTimer
                    );


                    gemPopupSuccess._hideTimer =
                        setTimeout(
                            () => {

                                gemPopupSuccess.classList.remove(
                                    "show"
                                );

                            },
                            1800
                        );
                }

            }
        );

    }
);

/* =========================================================
   GOLD SHOP
========================================================= */

const coinPlus =
    $("coinPlus");

const coinPopup =
    $("coinPopup");

const closeCoinPopup =
    $("closeCoinPopup");

const coinPopupCurrent =
    $("coinPopupCurrent");

const coinPopupSuccess =
    $("coinPopupSuccess");

const coinPopupSuccessText =
    $("coinPopupSuccessText");

const coinPacks =
    document.querySelectorAll(
        "#coinPopup .gem-pack"
    );


/* =========================================================
   OPEN GOLD SHOP
========================================================= */

function openCoinPopup() {

    const user =
        getCurrentUser();

    if (!user) {

        showLobbyToast(
            "LOGIN REQUIRED",
            "Vui lòng đăng nhập trước."
        );

        return;
    }

    const coins =
        Number(user.coins ?? 0);

    if (coinPopupCurrent) {

        coinPopupCurrent.textContent =
            coins.toLocaleString();

    }

    if (coinPopup) {

        coinPopup.classList.remove(
            "hidden"
        );

    }
}


/* =========================================================
   CLOSE GOLD SHOP
========================================================= */

function closeCoinShop() {

    if (!coinPopup) return;

    coinPopup.classList.add(
        "hidden"
    );
}


/* =========================================================
   GOLD PLUS
========================================================= */

if (coinPlus) {

    coinPlus.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            openCoinPopup();

        }
    );

}


/* =========================================================
   CLOSE GOLD SHOP
========================================================= */

if (closeCoinPopup) {

    closeCoinPopup.addEventListener(
        "click",
        closeCoinShop
    );

}


if (coinPopup) {

    coinPopup.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                coinPopup
            ) {

                closeCoinShop();

            }

        }
    );

}


/* =========================================================
   GOLD PACKS
========================================================= */

coinPacks.forEach(
    pack => {

        pack.addEventListener(
            "click",
            () => {

                const amount =
                    Number(
                        pack.dataset.coins
                    );

                const user =
                    getCurrentUser();

                if (!user) {

                    closeCoinShop();

                    showLobbyToast(
                        "LOGIN REQUIRED",
                        "Vui lòng đăng nhập trước."
                    );

                    return;
                }


                /* ADD GOLD */

                user.coins =
                    Number(
                        user.coins ?? 0
                    ) + amount;


                /* SAVE */

                updateUser(user);


                /* UPDATE LOBBY */

                const newCoinValue =
                    Number(
                        user.coins ?? 0
                    );

                const lobbyCoin =
                    document.getElementById(
                        "coinCount"
                    );

                if (lobbyCoin) {

                    lobbyCoin.textContent =
                        newCoinValue.toLocaleString();

                }


                /* UPDATE POPUP */

                if (coinPopupCurrent) {

                    coinPopupCurrent.textContent =
                        newCoinValue.toLocaleString();

                }


                /* SUCCESS */

                if (coinPopupSuccessText) {

                    coinPopupSuccessText.textContent =
                        `+${amount.toLocaleString()} GOLD`;

                }


                if (coinPopupSuccess) {

                    coinPopupSuccess.classList.remove(
                        "show"
                    );

                    void coinPopupSuccess.offsetWidth;

                    coinPopupSuccess.classList.add(
                        "show"
                    );

                    clearTimeout(
                        coinPopupSuccess._hideTimer
                    );

                    coinPopupSuccess._hideTimer =
                        setTimeout(
                            () => {

                                coinPopupSuccess.classList.remove(
                                    "show"
                                );

                            },
                            1800
                        );

                }

            }
        );

    }
);

/* =========================================================
   AUTO INITIALIZE
========================================================= */

(function initialize() {

    setAuthMode(
        "login"
    );


    const currentUser =
        getCurrentUser();


    if (currentUser) {
        usernameInput.value=currentUser.username;
        const returnPage=new URLSearchParams(window.location.search).get("return");
        setupLobby(currentUser);
        if(returnPage==="event"){openEventScreen();loadRemoteUser().then(remote=>{cacheUser(remote);setupLobby(remote);renderEventPage();}).catch(()=>{});return;}
        if(returnPage==="nowplay"){renderNowPlay();showScreen("nowPlayScreen");loadRemoteUser().then(remote=>{cacheUser(remote);setupLobby(remote);}).catch(()=>{});return;}
        // Plain reload: stay in the MAIN lobby instead of showing Login/Event/PLAY.
        showScreen("lobbyScreen");
        loadRemoteUser().then(remote=>{cacheUser(remote);setupLobby(remote);}).catch(()=>{});
        return;
    }

    let selectedExchangeCards = new Set();

function openExchangeCardModal() {
    const user = getCurrentUser();

    if (!user) return;

    if (!Array.isArray(user.myCards)) {
        user.myCards = [];
    }

    selectedExchangeCards = new Set();

    renderExchangeCardList();

    $("exchangeCardOverlay").classList.add("show");
}

function closeExchangeCardModal() {
    selectedExchangeCards.clear();

    $("exchangeCardOverlay").classList.remove("show");
}

function renderExchangeCardList() {
    const user = getCurrentUser();
    const list = $("exchangeCardList");

    if (!user || !Array.isArray(user.myCards)) {
        list.innerHTML = `
            <div class="exchange-empty">
                No cards available.
            </div>
        `;

        updateExchangeSummary();
        return;
    }

    if (user.myCards.length === 0) {
        list.innerHTML = `
            <div class="exchange-empty">
                No cards available.
            </div>
        `;

        updateExchangeSummary();
        return;
    }

    list.innerHTML = "";

    user.myCards.forEach((card, index) => {
        const item = document.createElement("div");

        item.className = "exchange-card-item";

        if (selectedExchangeCards.has(index)) {
            item.classList.add("selected");
        }

        const rarity = Number(card.rarity ?? 0);
        const rank = Number(card.rank ?? 1);

        item.innerHTML = `
            <input
                type="checkbox"
                class="exchange-card-check"
                ${selectedExchangeCards.has(index) ? "checked" : ""}
            >

            <div class="exchange-card-thumb">
                ${
                    card.image
                        ? `<img src="${card.image}" alt="">`
                        : ""
                }
            </div>

            <div class="exchange-card-info">
                <div class="exchange-card-name">
                    ${card.name || "Unknown Card"}
                </div>

                <div class="exchange-card-rarity">
                    ${"★".repeat(rarity)}
                </div>

                <div class="exchange-card-rank">
                    RANK ${rank}
                </div>
            </div>

            <div class="exchange-card-reward">
                +35 💎
            </div>
        `;

        item.addEventListener("click", (event) => {

            if (event.target.tagName !== "INPUT") {
                const checkbox =
                    item.querySelector(".exchange-card-check");

                checkbox.checked = !checkbox.checked;
            }

            if (selectedExchangeCards.has(index)) {
                selectedExchangeCards.delete(index);
            } else {
                selectedExchangeCards.add(index);
            }

            renderExchangeCardList();
        });

        list.appendChild(item);
    });

    updateExchangeSummary();
}

function updateExchangeSummary() {
    const count = selectedExchangeCards.size;
    const gems = count * CARD_EXCHANGE_GEMS;

    $("exchangeCardSummary").textContent =
        `Selected: ${count} · +${gems} Gems`;

    $("confirmExchangeCard").disabled = count === 0;
}

function confirmExchangeCards() {
    const user = getCurrentUser();

    if (!user) return;

    if (!Array.isArray(user.myCards)) {
        user.myCards = [];
    }

    const indexes = [...selectedExchangeCards]
        .sort((a, b) => b - a);

    if (indexes.length === 0) return;

    let removedCount = 0;

    indexes.forEach(index => {

        if (
            index >= 0 &&
            index < user.myCards.length
        ) {
            user.myCards.splice(index, 1);
            removedCount++;
        }

    });

    const reward =
        removedCount * CARD_EXCHANGE_GEMS;

    user.gems =
        Number(user.gems || 0) + reward;

    updateUser(user);

    updateGachaGemCount(user);

    closeExchangeCardModal();

    renderMyCards();

    showLobbyToast(
        "CARD EXCHANGE",
        `+${reward} GEMS`
    );
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const exchangeButton =
            $("exchangeCardButton");

        const closeButton =
            $("closeExchangeCard");

        const cancelButton =
            $("cancelExchangeCard");

        const confirmButton =
            $("confirmExchangeCard");


        if (exchangeButton) {
            exchangeButton.addEventListener(
                "click",
                openExchangeCardModal
            );
        }

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                closeExchangeCardModal
            );
        }

        if (cancelButton) {
            cancelButton.addEventListener(
                "click",
                closeExchangeCardModal
            );
        }

        if (confirmButton) {
            confirmButton.addEventListener(
                "click",
                confirmExchangeCards
            );
        }

    }
);


})();
/* =========================================================
   FRIEND SYSTEM — ONLINE BACKEND
========================================================= */
function normalizeFriendData(u){if(!u)return;if(!Array.isArray(u.friends))u.friends=[];if(!Array.isArray(u.friendRequests))u.friendRequests=[];if(!Array.isArray(u.sentFriendRequests))u.sentFriendRequests=[];}
let activeFriendChatUser=null,activeFriendChatMessages=[];
function escapeFriendHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function escapeFriendAttr(v){return escapeFriendHtml(v);}
async function syncMe(){return await refreshCurrentUser();}
async function renderFriends(){const u=await syncMe();const list=$("friendsList");if(!u||!list)return;normalizeFriendData(u);const friends=u.friends||[],req=u.friendRequests||[];if($("friendCount"))$("friendCount").textContent=friends.length;if($("friendListCount"))$("friendListCount").textContent=friends.length;const rh=req.length?`<section class="friend-requests-block"><div class="friend-requests-title"><span>FRIEND REQUESTS</span><strong>${req.length}</strong></div><div class="friend-request-list">${req.map(n=>`<article class="friend-item friend-request-item"><div class="friend-avatar">${String(n).charAt(0).toUpperCase()}</div><div class="friend-player-info"><strong>${escapeFriendHtml(n)}</strong><span>WANTS TO BE YOUR FRIEND</span></div><div class="friend-request-actions"><button class="friend-accept-button" data-accept-user="${escapeFriendAttr(n)}">ACCEPT</button><button class="friend-decline-button" data-decline-user="${escapeFriendAttr(n)}">DECLINE</button></div></article>`).join('')}</div></section>`:'';const fh=friends.length?friends.map(n=>`<article class="friend-item"><div class="friend-avatar">${String(n).charAt(0).toUpperCase()}</div><div class="friend-player-info"><strong>${escapeFriendHtml(n)}</strong><span>REALYZE!! PLAYER</span></div><button class="friend-chat-button" data-chat-user="${escapeFriendAttr(n)}">CHAT</button></article>`).join(''):'<div class="friends-empty">Bạn chưa có bạn bè.<br>Hãy tìm ID Name để kết bạn.</div>';list.innerHTML=rh+fh;list.querySelectorAll('[data-chat-user]').forEach(b=>b.onclick=()=>openFriendChat(b.dataset.chatUser));list.querySelectorAll('[data-accept-user]').forEach(b=>b.onclick=async()=>{try{const d=await apiRequest('/api/friends/accept',{method:'POST',body:JSON.stringify({username:b.dataset.acceptUser})});cacheUser(d.user);renderFriends();}catch(e){showLobbyToast('FRIENDS',e.message);}});list.querySelectorAll('[data-decline-user]').forEach(b=>b.onclick=async()=>{try{const d=await apiRequest('/api/friends/decline',{method:'POST',body:JSON.stringify({username:b.dataset.declineUser})});cacheUser(d.user);renderFriends();}catch(e){showLobbyToast('FRIENDS',e.message);}});}
async function searchFriends(){const u=await syncMe(),input=$("friendSearchInput"),results=$("friendSearchResults");if(!u||!input||!results)return;const q=input.value.trim();if(!q){results.innerHTML='<div class="friends-empty">Nhập ID Name để tìm người chơi.</div>';return;}let t;try{t=(await apiRequest('/api/friends/search?q='+encodeURIComponent(q))).user;}catch(e){results.innerHTML=`<div class="friends-empty">${escapeFriendHtml(e.message)}</div>`;return;}normalizeFriendData(u);if(t.username===u.username){results.innerHTML='<div class="friends-empty">Đây là ID Name của bạn.</div>';return;}const f=u.friends.includes(t.username),inc=u.friendRequests.includes(t.username),out=u.sentFriendRequests.includes(t.username);const a=f?'<button class="friend-chat-button" id="searchResultChat">CHAT</button>':inc?'<button class="friend-accept-button" id="searchResultAccept">ACCEPT</button>':out?'<button class="friend-cancel-button" id="searchResultCancel">CANCEL REQUEST</button>':'<button class="friend-add-button" id="searchResultAdd">ADD FRIEND</button>';results.innerHTML=`<article class="friend-search-result"><div class="friend-avatar">${t.username.charAt(0).toUpperCase()}</div><div class="friend-player-info"><strong>${escapeFriendHtml(t.username)}</strong><span>${f?'FRIEND':inc?'WANTS TO BE YOUR FRIEND':out?'REQUEST SENT':'REALYZE!! PLAYER'}</span></div><div class="friend-search-action">${a}</div></article>`;$("searchResultChat")?.addEventListener('click',()=>openFriendChat(t.username));$("searchResultAccept")?.addEventListener('click',async()=>{try{const d=await apiRequest('/api/friends/accept',{method:'POST',body:JSON.stringify({username:t.username})});cacheUser(d.user);await renderFriends();await searchFriends();}catch(e){showLobbyToast('FRIENDS',e.message);}});$("searchResultCancel")?.addEventListener('click',async()=>{try{const d=await apiRequest('/api/friends/cancel',{method:'POST',body:JSON.stringify({username:t.username})});cacheUser(d.user);await searchFriends();}catch(e){showLobbyToast('FRIENDS',e.message);}});$("searchResultAdd")?.addEventListener('click',async()=>{try{const d=await apiRequest('/api/friends/request',{method:'POST',body:JSON.stringify({username:t.username})});cacheUser(d.user);await searchFriends();showLobbyToast('FRIENDS',`Đã gửi lời mời tới ${t.username}.`);}catch(e){showLobbyToast('FRIENDS',e.message);}});}
async function openFriendChat(n){const u=await syncMe();if(!u||(u.friends||[]).indexOf(n)<0){showLobbyToast('FRIENDS','Bạn chỉ có thể chat với bạn bè.');return;}activeFriendChatUser=n;$("friendChatName").textContent=n;try{const d=await apiRequest('/api/friends/chat?username='+encodeURIComponent(n));activeFriendChatMessages=d.messages||[];renderFriendChatMessages();$("friendChatOverlay").classList.remove('hidden');$("friendChatOverlay").setAttribute('aria-hidden','false');}catch(e){showLobbyToast('CHAT',e.message);}}
function closeFriendChat(){activeFriendChatUser=null;activeFriendChatMessages=[];$("friendChatOverlay")?.classList.add('hidden');$("friendChatOverlay")?.setAttribute('aria-hidden','true');}
function renderFriendChatMessages(){const u=getCurrentUser(),box=$("friendChatMessages");if(!u||!box)return;box.innerHTML=activeFriendChatMessages.length?activeFriendChatMessages.map(m=>`<div class="friend-chat-message ${m.from===u.username?'mine':'theirs'}"><span>${escapeFriendHtml(m.text)}</span></div>`).join(''):'<div class="friend-chat-empty">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</div>';box.scrollTop=box.scrollHeight;}
async function sendFriendMessage(text) {
    const messageText = String(text || "").trim();
    const targetUsername = String(activeFriendChatUser || "").trim();

    if (!messageText) return false;

    if (!targetUsername) {
        throw new Error("Không xác định được người đang chat. Hãy đóng chat và mở lại.");
    }

    const data = await apiRequest("/api/friends/chat", {
        method: "POST",
        body: JSON.stringify({
            username: targetUsername,
            text: messageText
        })
    });

    const me = getCurrentUser();
    activeFriendChatMessages.push({
        from: me?.username || "",
        text: messageText,
        time: Date.now()
    });
    renderFriendChatMessages();

    try {
        const fresh = await apiRequest('/api/friends/chat?username=' + encodeURIComponent(targetUsername));
        if (activeFriendChatUser === targetUsername) {
            activeFriendChatMessages = fresh.messages || [];
            renderFriendChatMessages();
        }
    } catch (refreshError) {
        console.warn("CHAT REFRESH FAILED:", refreshError);
    }

    return data?.ok !== false;
}
function initFriendSystem() {
    if (window.__realyzeFriendSystemReady) return;
    window.__realyzeFriendSystemReady = true;

    $("friendsButton")?.addEventListener('click', async (event) => {
        event.preventDefault();
        showScreen('friendsScreen');
        if ($("friendSearchInput")) $("friendSearchInput").value = '';
        if ($("friendSearchResults")) $("friendSearchResults").innerHTML = '<div class="friends-empty">Đang tải dữ liệu bạn bè...</div>';
        try {
            if (getCurrentUser()) await renderFriends();
            else if ($("friendsList")) $("friendsList").innerHTML = '<div class="friends-empty">Chưa có phiên đăng nhập. Hãy đăng nhập lại.</div>';
        } catch (error) {
            console.error("Friends screen load failed:", error);
            if ($("friendsList")) $("friendsList").innerHTML = `<div class="friends-empty">Không thể tải danh sách bạn bè.<br>${escapeFriendHtml(error?.message || "Supabase error")}</div>`;
        }
    });

    $("friendsBack")?.addEventListener('click', () => showScreen('lobbyScreen'));
    $("friendSearchButton")?.addEventListener('click', searchFriends);

    $("friendSearchInput")?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchFriends();
        }
    });

    $("friendChatClose")?.addEventListener('click', closeFriendChat);

    const form = $("friendChatForm");
    const input = $("friendChatInput");
    const sendButton = form?.querySelector('button[type="submit"]');

    const handleSend = async (event) => {
        event?.preventDefault();
        event?.stopPropagation();

        if (!input || !input.value.trim()) return false;

        if (!activeFriendChatUser) {
            showLobbyToast('CHAT', 'Không xác định được người đang chat.');
            return false;
        }

        const messageText = input.value.trim();
        const oldValue = input.value;

        input.value = '';
        input.disabled = true;
        if (sendButton) sendButton.disabled = true;

        try {
            await sendFriendMessage(messageText);
        } catch (err) {
            console.error("CHAT SEND FAILED:", err);
            input.value = oldValue;
            showLobbyToast('CHAT', err?.message || 'Không thể gửi tin nhắn.');
        } finally {
            input.disabled = false;
            if (sendButton) sendButton.disabled = false;
            input.focus();
        }

        return false;
    };

    // IMPORTANT: the actual SEND button is inside <form id="friendChatForm">.
    // Handling submit prevents the browser from reloading index.html.
    form?.addEventListener('submit', handleSend);

    // Compatibility for any older HTML version with this optional id.
    $("friendChatSend")?.addEventListener('click', handleSend);
}

document.addEventListener('DOMContentLoaded', initFriendSystem, { once: true });
if (document.readyState !== 'loading') initFriendSystem();
