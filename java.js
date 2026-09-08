
/* =========================================================
   MOBILE / CAPACITOR UI MARKER
   Do not depend only on CSS pointer:coarse because some
   Android WebViews report the pointer/viewport differently.
========================================================= */
(function markRealyzeMobileUI(){
    const apply = () => {
        let nativeCapacitor = false;
        try {
            nativeCapacitor = !!(
                window.Capacitor &&
                (
                    window.Capacitor.isNativePlatform?.() ||
                    window.Capacitor.getPlatform?.() === "android" ||
                    window.Capacitor.getPlatform?.() === "ios"
                )
            );
        } catch (_) {}

        const touchDevice =
            Number(navigator.maxTouchPoints || 0) > 0 ||
            window.matchMedia?.("(pointer: coarse)")?.matches;

        if (nativeCapacitor || touchDevice) {
            document.documentElement.classList.add("realyze-mobile-ui");
        }
    };

    apply();
    document.addEventListener("DOMContentLoaded", apply, { once:true });
})();

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
        const allowed = ['gems','coins','tickets','rank','rankXp','gachaPity','characterPity','akitoPity','shotaPity','gachaHistory','myCards','myCharacters','characterProgress','selectedCharacterId','lobbyCharacterId','eventPoints','eventEnergy','eventEnergyUpdatedAt','eventClaimedRewards','eventShopPurchases','eventMailbox','eventTeam','eventCardMemory','eventMusic','rhythmProgress','trialPass','trialPassUpdatedAt','trialClears','stageGear','equipment','dailyLive','resourceResetVersion','stellarFactor','stellarBooks','dancePity','newPlayerBannerPulls','newPlayerBannerClosed','nightStagePoints','nightStageRewardsClaimed','nightStageTrainingDone','nightStageTrainingRuns','nightStageFaction','inventoryItems','recoveryCodeHash','recoveryCodeCreatedAt','recoveryCodeVersion'];
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


/* =========================================================
   REALYZE!! TITLE SCREEN V34
========================================================= */

/* =========================================================
   TITLE MUSIC V35
========================================================= */
let titleScreenMusic = null;

function ensureTitleScreenMusic(){
    if(titleScreenMusic) return titleScreenMusic;

    titleScreenMusic = new Audio("assets/sanh.mp3");
    titleScreenMusic.loop = true;
    titleScreenMusic.volume = .42;
    titleScreenMusic.preload = "auto";
    return titleScreenMusic;
}

function playTitleScreenMusic(){
    const audio = ensureTitleScreenMusic();
    if(!audio) return;

    audio.play().catch(()=>{
        // Browsers may block autoplay. Capacitor normally allows it;
        // otherwise the next user interaction can retry it.
    });
}

function stopTitleScreenMusic(reset = true){
    if(!titleScreenMusic) return;
    try{
        titleScreenMusic.pause();
        if(reset) titleScreenMusic.currentTime = 0;
    }catch(_){}
}


/* =========================================================
   STARTUP SPLASH V37
========================================================= */
let startupSplashTimer = null;
let startupSplashShown = false;

function showStartupSplashThenTitle(user = getCurrentUser()){
    if(startupSplashShown){
        showTitleScreen(user);
        return;
    }

    startupSplashShown = true;
    stopTitleScreenMusic();

    const splash = $("startupSplash");
    const title = $("titleScreen");

    // Hide everything except the splash during startup.
    document.querySelectorAll(".screen, .game-screen").forEach(screen=>{
        screen.classList.add("hidden");
    });

    splash?.classList.remove("hidden");
    title?.classList.add("hidden");

    clearTimeout(startupSplashTimer);
    startupSplashTimer = setTimeout(()=>{
        splash?.classList.add("hidden");

        // Music starts only now, because showTitleScreen owns title BGM.
        showTitleScreen(user);
    }, 2000);
}

function updateTitleScreenAccountState(user = getCurrentUser()){
    const hasAccount = !!user?.username;
    const authButton = $("titleAuthButton");
    const logoutButton = $("titleLogoutButton");

    if(authButton){
        authButton.classList.toggle("is-disabled", hasAccount);
        authButton.setAttribute("aria-disabled", hasAccount ? "true" : "false");
        authButton.dataset.enabled = hasAccount ? "0" : "1";
    }

    if(logoutButton){
        logoutButton.classList.toggle("is-disabled", !hasAccount);
        logoutButton.setAttribute("aria-disabled", hasAccount ? "false" : "true");
        logoutButton.dataset.enabled = hasAccount ? "1" : "0";
    }
}

function openAuthFromTitle(mode = "login"){
    setAuthMode(mode);
    updateTitleScreenAccountState();

    // Keep the title screen visible and open auth as a small overlay.
    const popup = $("authScreen");
    popup?.classList.remove("hidden");
    popup?.setAttribute("aria-hidden","false");

    setTimeout(()=>{
        if(usernameInput && !usernameInput.value) usernameInput.focus();
    }, 40);
}

function closeTitleAuthPopup(){
    const popup = $("authScreen");
    popup?.classList.add("hidden");
    popup?.setAttribute("aria-hidden","true");

    if(message) message.textContent="";
}

function enterGameFromTitle(){
    const user = getCurrentUser();
    if(!user?.username){
        openAuthFromTitle("login");
        return;
    }

    stopTitleScreenMusic();
    startLoading(user);
}

async function signOutToTitleScreen(){
    stopTitleScreenMusic();

    try{
        if(window.REALYZE_DB?.auth){
            const {error} = await window.REALYZE_DB.auth.signOut();
            if(error) console.warn("Supabase signOut:", error);
        }
    }catch(error){
        console.warn("Logout signOut failed:", error);
    }

    localStorage.removeItem("realyze_current_user");
    localStorage.removeItem("realyze_auth_token");
    localStorage.removeItem("realyze_user_cache");
    localStorage.removeItem("realyze_rhythm_pending");

    try{ history.replaceState(null, "", location.pathname); }catch(_){}

    setAuthMode("login");
    if(usernameInput) usernameInput.value = "";
    if(passwordInput) passwordInput.value = "";
    if(confirmPasswordInput) confirmPasswordInput.value = "";

    closeTitleAuthPopup();
    showTitleScreen(null);
}

function showTitleScreen(user = getCurrentUser()){
    updateTitleScreenAccountState(user);
    showScreen("titleScreen");

    // Give the title screen its own BGM.
    setTimeout(playTitleScreenMusic, 40);
}


$("titleScreen")?.addEventListener("pointerdown", ()=>{
    if(titleScreenMusic?.paused) playTitleScreenMusic();
}, {passive:true});


$("authPopupClose")?.addEventListener("click", closeTitleAuthPopup);

document.querySelectorAll("[data-close-auth]").forEach(el=>{
    el.addEventListener("click", closeTitleAuthPopup);
});

$("authScreen")?.addEventListener("click", event=>{
    event.stopPropagation();
});

$("titlePlayButton")?.addEventListener("click", event=>{
    event.stopPropagation();
    enterGameFromTitle();
});

$("titleAuthButton")?.addEventListener("click", event=>{
    event.stopPropagation();
    if(event.currentTarget.dataset.enabled !== "1") return;
    openAuthFromTitle("login");
});

$("titleLogoutButton")?.addEventListener("click", async event=>{
    event.stopPropagation();
    if(event.currentTarget.dataset.enabled !== "1") return;
    await signOutToTitleScreen();
});

/* Anywhere on the title screen (except the corner buttons) acts like CLICK FOR PLAY. */
$("titleScreen")?.addEventListener("click", event=>{
    if(event.target.closest(".title-corner-button")) return;
    if(event.target.closest("#titlePlayButton")) return;
    enterGameFromTitle();
});




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

        cacheUser(result.user);
        closeTitleAuthPopup();
        showTitleScreen(result.user);

    }
);


/* =========================================================
   LOADING
========================================================= */

function startLoading(user) {

    stopTitleScreenMusic();

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
   SETTINGS / RECOVERY CODE V42
   Plain Recovery Code is shown only when generated.
   Supabase game_data stores SHA-256 hash only.
========================================================= */
let lastGeneratedRecoveryCode = "";

function recoveryRandomChunk(length=4){
    const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes=new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes,b=>alphabet[b%alphabet.length]).join("");
}

function createRecoveryCode(){
    return `RZ-${recoveryRandomChunk(4)}-${recoveryRandomChunk(4)}-${recoveryRandomChunk(4)}`;
}

async function sha256Hex(value){
    const data=new TextEncoder().encode(String(value||""));
    const hash=await crypto.subtle.digest("SHA-256",data);
    return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
}

function formatRecoveryDate(ts){
    const n=Number(ts||0);
    if(!n)return "";
    try{
        return new Intl.DateTimeFormat("vi-VN",{
            timeZone:"Asia/Ho_Chi_Minh",
            day:"2-digit",month:"2-digit",year:"numeric",
            hour:"2-digit",minute:"2-digit"
        }).format(new Date(n));
    }catch(_){return new Date(n).toLocaleString()}
}

function renderRecoverySettings(){
    const user=getCurrentUser();
    if(!user)return;

    const username=$("settingsUsername");
    const badge=$("recoveryStatusBadge");
    const box=$("recoveryCodeBox");
    const value=$("recoveryCodeValue");
    const meta=$("recoveryCodeMeta");
    const generate=$("generateRecoveryCode");
    const copy=$("copyRecoveryCode");
    const regenerate=$("regenerateRecoveryCode");

    if(username)username.textContent=user.username||"PLAYER";

    const hasCode=!!user.recoveryCodeHash;
    if(badge){
        badge.textContent=hasCode?"ACTIVE":"NOT SET";
        badge.classList.toggle("ready",hasCode);
    }

    if(lastGeneratedRecoveryCode){
        box?.classList.remove("is-empty");
        if(value)value.textContent=lastGeneratedRecoveryCode;
        if(meta)meta.textContent="Copy and save this code now. It will not be shown again after this session.";
        if(copy)copy.disabled=false;
        if(generate)generate.classList.add("hidden");
        regenerate?.classList.remove("hidden");
        return;
    }

    if(hasCode){
        box?.classList.add("is-empty");
        if(value)value.textContent="•••• •••• ••••";
        if(meta)meta.textContent=`Recovery Code is active${user.recoveryCodeCreatedAt?` · ${formatRecoveryDate(user.recoveryCodeCreatedAt)}`:""}. Generate a new one if you lost it.`;
        if(copy)copy.disabled=true;
        if(generate)generate.classList.add("hidden");
        regenerate?.classList.remove("hidden");
    }else{
        box?.classList.add("is-empty");
        if(value)value.textContent="NOT GENERATED";
        if(meta)meta.textContent="Generate a code to protect this account.";
        if(copy)copy.disabled=true;
        if(generate)generate.classList.remove("hidden");
        regenerate?.classList.add("hidden");
    }
}

function openSettings(){
    const user=getCurrentUser();
    if(!user)return;
    lastGeneratedRecoveryCode="";
    renderRecoverySettings();
    const overlay=$("settingsOverlay");
    overlay?.classList.remove("hidden");
    overlay?.setAttribute("aria-hidden","false");
}

function closeSettings(){
    // Do not keep a plaintext recovery code around after closing.
    lastGeneratedRecoveryCode="";
    const overlay=$("settingsOverlay");
    overlay?.classList.add("hidden");
    overlay?.setAttribute("aria-hidden","true");
}

async function generateAccountRecoveryCode(){
    const user=getCurrentUser();
    if(!user)return;

    const code=createRecoveryCode();
    const hash=await sha256Hex(code);

    user.recoveryCodeHash=hash;
    user.recoveryCodeCreatedAt=Date.now();
    user.recoveryCodeVersion=1;

    lastGeneratedRecoveryCode=code;
    await updateUser(user);
    renderRecoverySettings();

    showLobbyToast("RECOVERY CODE","Đã tạo mã mới. Hãy COPY và lưu lại ngay.");
}

async function copyAccountRecoveryCode(){
    if(!lastGeneratedRecoveryCode)return;
    try{
        await navigator.clipboard.writeText(lastGeneratedRecoveryCode);
        showLobbyToast("RECOVERY CODE","Đã copy mã Recovery.");
    }catch(_){
        const ta=document.createElement("textarea");
        ta.value=lastGeneratedRecoveryCode;
        ta.style.position="fixed";
        ta.style.opacity="0";
        document.body.appendChild(ta);
        ta.select();
        try{document.execCommand("copy")}catch(__){}
        ta.remove();
        showLobbyToast("RECOVERY CODE","Đã copy mã Recovery.");
    }
}

/* =========================================================
   SETTINGS BUTTON BIND FIX V43
   java.js is loaded before the Settings overlay markup in index.html,
   so direct selectors for settingsClose / generate / copy were null.
   Bind them after DOMContentLoaded instead.
========================================================= */
let settingsControlsBound = false;

async function regenerateAccountRecoveryCode(){
    const ok = confirm("Tạo Recovery Code mới? Mã cũ sẽ không còn dùng được.");
    if(!ok) return;
    await generateAccountRecoveryCode();
}

function bindSettingsControls(){
    if(settingsControlsBound) return;

    const openBtn = $("lobbySettingsButton");
    const closeBtn = $("settingsClose");
    const overlay = $("settingsOverlay");
    const generateBtn = $("generateRecoveryCode");
    const regenerateBtn = $("regenerateRecoveryCode");
    const copyBtn = $("copyRecoveryCode");

    // Do not mark as bound until the late Settings markup really exists.
    if(!openBtn || !closeBtn || !overlay || !generateBtn || !regenerateBtn || !copyBtn) return;

    settingsControlsBound = true;

    openBtn.addEventListener("click", openSettings);

    closeBtn.addEventListener("click", event=>{
        event.preventDefault();
        event.stopPropagation();
        closeSettings();
    });

    overlay.addEventListener("click", event=>{
        if(event.target === overlay) closeSettings();
    });

    generateBtn.addEventListener("click", async event=>{
        event.preventDefault();
        event.stopPropagation();

        if(generateBtn.disabled) return;
        generateBtn.disabled = true;

        try{
            await generateAccountRecoveryCode();
        }catch(error){
            console.error("Generate Recovery Code failed:", error);
            showLobbyToast("RECOVERY CODE","Không tạo được mã. Thử lại.");
        }finally{
            generateBtn.disabled = false;
        }
    });

    regenerateBtn.addEventListener("click", async event=>{
        event.preventDefault();
        event.stopPropagation();
        try{
            await regenerateAccountRecoveryCode();
        }catch(error){
            console.error("Regenerate Recovery Code failed:", error);
            showLobbyToast("RECOVERY CODE","Không tạo được mã mới. Thử lại.");
        }
    });

    copyBtn.addEventListener("click", async event=>{
        event.preventDefault();
        event.stopPropagation();
        try{
            await copyAccountRecoveryCode();
        }catch(error){
            console.error("Copy Recovery Code failed:", error);
            showLobbyToast("RECOVERY CODE","Không copy được mã.");
        }
    });
}

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bindSettingsControls, {once:true});
}else{
    bindSettingsControls();
}


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
        ? `${reward.label} + ICHIKA ★★★★★★`
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


function grantAttendanceIchika(user){
    if (!user) return user;
    user.myCharacters = Array.isArray(user.myCharacters) ? user.myCharacters : [];
    user.characterProgress = user.characterProgress && typeof user.characterProgress === "object"
        ? user.characterProgress
        : {};

    if (!user.myCharacters.includes("ichika")) {
        user.myCharacters.push("ichika");
        user.characterProgress.ichika = { rank:1, level:1 };
    } else {
        const p = user.characterProgress.ichika || { rank:1, level:1 };
        p.rank = Math.min(5, Math.max(1, Number(p.rank) || 1) + 1);
        p.level = Math.min(getCharacterMaxLevel(p.rank), Math.max(1, Number(p.level) || 1));
        user.characterProgress.ichika = p;
    }
    return user;
}

function replaceAttendanceGenericCharacterWithIchika(user, rewardCharacterId, beforeOwned, beforeProgress){
    if (!user) return user;
    user.myCharacters = Array.isArray(user.myCharacters) ? user.myCharacters : [];
    user.characterProgress = user.characterProgress && typeof user.characterProgress === "object"
        ? user.characterProgress
        : {};

    const genericId = String(rewardCharacterId || "");
    if (genericId && genericId !== "ichika") {
        if (beforeOwned.includes(genericId)) {
            if (beforeProgress[genericId]) {
                user.characterProgress[genericId] = JSON.parse(JSON.stringify(beforeProgress[genericId]));
            }
        } else {
            user.myCharacters = user.myCharacters.filter(id => id !== genericId);
            delete user.characterProgress[genericId];
        }
    }

    return grantAttendanceIchika(user);
}

async function claimDailyAttendance() {
    const button = $("dailyAttendanceClaim");
    const status = $("dailyAttendanceStatus");
    if (!button || button.disabled) return;

    const beforeUser = getCurrentUser() || {};
    const beforeOwned = Array.isArray(beforeUser.myCharacters) ? [...beforeUser.myCharacters] : [];
    const beforeProgress = JSON.parse(JSON.stringify(beforeUser.characterProgress || {}));

    button.disabled = true;
    button.textContent = "NHẬN THƯỞNG...";
    try {
        const response = await apiRequest("/api/daily-attendance/claim", { method: "POST", body: "{}" });
        const result = response.result || {};
        const reward = result.reward_type === "gems"
            ? `${Number(result.reward_amount || 0).toLocaleString("en-US")} 💎`
            : `${Number(result.reward_amount || 0).toLocaleString("en-US")} ●`;
        const date = getVietnamDateParts();

        // Day 15 and 30 are fixed ICHIKA 6★ rewards.
        // The old RPC only exposed a generic 6★ reward id, so normalize the
        // returned profile here and sync the exact intended reward back.
        if (!result.already_claimed && (date.day === 15 || date.day === 30) && response.user) {
            replaceAttendanceGenericCharacterWithIchika(
                response.user,
                result.reward_character_id,
                beforeOwned,
                beforeProgress
            );
            result.reward_character_id = "ichika";
            await updateUser(response.user);
        }

        const characterText = result.reward_character_id === "ichika"
            ? " + ICHIKA ★★★★★★"
            : result.reward_character_id
                ? " + 1 × 6★ CHARACTER"
                : "";

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
    { name: "CRASH THE PARTY", artist: "REALYZE", src: "assets/song-032.mp3" },
    { name: "TEIKOKU SHOUJO", artist: "VANI & EBI", src: "assets/ts.mp3" }
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


/* =========================================================
   ONE-TIME RESOURCE RESET · PRE-RELEASE V30
   - Vani1809 = TEST ACCOUNT: keep account/progress and set
     Gems + Gold to 100,000,000 for testing.
   - Every other account: Gems = 0, Gold = 0.
   - Runs once per account through resourceResetVersion.
========================================================= */
const RESOURCE_RESET_VERSION = 2;
const TEST_ACCOUNT_USERNAME = "vani1809";
const TEST_ACCOUNT_CURRENCY = 100000000;

function applyPreReleaseResourceReset(user){
    if (!user?.username) return false;
    if (Number(user.resourceResetVersion || 0) >= RESOURCE_RESET_VERSION) return false;

    const username = String(user.username).trim().toLowerCase();

    if (username === TEST_ACCOUNT_USERNAME) {
        user.gems = TEST_ACCOUNT_CURRENCY;
        user.coins = TEST_ACCOUNT_CURRENCY;
        console.log("Test account Vani1809: Gems=100,000,000 · Gold=100,000,000");
    } else {
        user.gems = 0;
        user.coins = 0;
        console.log(`Pre-release reset ${user.username}: Gems=0 · Gold=0`);
    }

    user.resourceResetVersion = RESOURCE_RESET_VERSION;

    // Save both locally and to Supabase so the migration cannot repeat.
    cacheUser(user);
    updateUser(user);
    return true;
}

function setupLobby(user) {

    if (!user) return;
    applyPreReleaseResourceReset(user);
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

    updateStellarFactorUI(user);
    updateStellarBookUI(user);


    loadAvatar(
        user.username
    );
    updateDailyAttendanceMini();
    ensureDailyLive(user);
    applyLobbyCharacterBackground();
    try{renderLobbyInventoryBadge(user)}catch(_){}
}


/* =========================================================
   LOBBY INVENTORY · NIGHT STAGE V60
   Browser-style tabs + item grid + detail pane.
========================================================= */
let lobbyInventoryTab='consumable';
let lobbyInventorySelected='nightStageChoiceBox';

function ensureLobbyInventory(user){
    if(!user)return null;
    user.inventoryItems = user.inventoryItems && typeof user.inventoryItems==='object' ? user.inventoryItems : {};
    user.inventoryItems.nightStageChoiceBox = Math.max(0,Math.floor(Number(user.inventoryItems.nightStageChoiceBox)||0));
    user.inventoryItems.energyPotion60 = Math.max(0,Math.floor(Number(user.inventoryItems.energyPotion60)||0));
    if(!Number.isFinite(Number(user.stellarFactor)) || Number(user.stellarFactor)<0) user.stellarFactor=0;
    if(!Number.isFinite(Number(user.eventEnergy)) || Number(user.eventEnergy)<0) user.eventEnergy=0;
    return user.inventoryItems;
}

function getNightStageChoiceBoxCount(user){
    ensureLobbyInventory(user);
    return Math.max(0,Math.floor(Number(user?.inventoryItems?.nightStageChoiceBox)||0));
}
function getEnergyPotion60Count(user){
    ensureLobbyInventory(user);
    return Math.max(0,Math.floor(Number(user?.inventoryItems?.energyPotion60)||0));
}

function renderLobbyInventoryBadge(user=getCurrentUser()){
    const badge=$("lobbyInventoryBadge");
    if(!badge||!user)return;
    const count=getNightStageChoiceBoxCount(user)+getEnergyPotion60Count(user);
    badge.textContent=count>0?String(count):"";
    badge.classList.toggle("hidden",count<=0);
}

function lobbyInventoryCharacterState(user,id){
    const owned=Array.isArray(user?.myCharacters)&&user.myCharacters.includes(id);
    const rank=owned?Math.max(1,Math.min(5,Number(user?.characterProgress?.[id]?.rank)||1)):0;
    return {owned,rank,maxed:rank>=5};
}

function getLobbyInventoryDefinitions(user){
    ensureLobbyInventory(user);
    return [
      {
        id:'nightStageChoiceBox',tab:'consumable',category:'NIGHT STAGE · CHOICE BOX',
        name:'HỘP LỰA CHỌN NIGHT STAGE',count:getNightStageChoiceBoxCount(user),
        image:'assets/night-stage-choice-box.png',
        description:'Mở hộp để chọn 1 trong 4: Shinonome Akito 6★, Shiraishi An 6★, Tenma Saki 6★ hoặc 1 Nhân Tố Tinh Tú.',
        action:'MỞ HỘP',usable:true
      },
      {
        id:'energyPotion60',tab:'consumable',category:'CONSUMABLE · ENERGY',
        name:'BÌNH ENERGY +60',count:getEnergyPotion60Count(user),emoji:'⚡',
        description:'Dùng 1 bình để hồi ngay 60 Energy. Energy nhận từ bình có thể vượt mốc hồi tự nhiên 100.',
        action:'SỬ DỤNG',usable:true
      },
      {
        id:'stellarFactor',tab:'material',category:'STELLAR MATERIAL',
        name:'NHÂN TỐ TINH TÚ',count:Math.max(0,Math.floor(Number(user.stellarFactor)||0)),emoji:'✦',
        description:'Vật phẩm nâng cấp hiếm dùng trong hệ thống tăng tiến Character.',
        action:'KHÔNG THỂ DÙNG TẠI ĐÂY',usable:false
      }
    ];
}

function renderLobbyInventoryDetail(user=getCurrentUser()){
    if(!user)return;
    const defs=getLobbyInventoryDefinitions(user);
    const visible=defs.filter(x=>x.tab===lobbyInventoryTab);
    let item=defs.find(x=>x.id===lobbyInventorySelected&&x.tab===lobbyInventoryTab);
    if(!item){ item=visible[0]||null; lobbyInventorySelected=item?.id||''; }
    const visual=$("lobbyInventoryDetailVisual"),cat=$("lobbyInventoryDetailCategory"),name=$("lobbyInventoryDetailName"),count=$("lobbyInventoryDetailCount"),desc=$("lobbyInventoryDetailDescription"),use=$("lobbyInventoryUseButton");
    if(!visual||!cat||!name||!count||!desc||!use)return;
    if(!item){
        visual.innerHTML='<span class="inventory-empty-mark">—</span>';
        cat.textContent='EMPTY'; name.textContent='CHƯA CÓ VẬT PHẨM'; count.textContent='0'; desc.textContent='Nhóm vật phẩm này hiện chưa có item.'; use.textContent='KHÔNG CÓ'; use.disabled=true; use.dataset.inventoryUse='';
        return;
    }
    visual.innerHTML=item.image?`<img src="${item.image}" alt="${item.name}">`:`<span class="inventory-detail-emoji">${item.emoji||'◆'}</span>`;
    cat.textContent=item.category; name.textContent=item.name; count.textContent=String(item.count); desc.textContent=item.description;
    use.textContent=item.action; use.disabled=!item.usable||item.count<=0; use.dataset.inventoryUse=item.id;
}

function renderLobbyInventory(user=getCurrentUser()){
    const list=$("lobbyInventoryList");
    if(!list||!user)return;
    ensureLobbyInventory(user);
    const defs=getLobbyInventoryDefinitions(user).filter(x=>x.tab===lobbyInventoryTab);
    list.innerHTML=defs.length?defs.map(item=>`
      <button type="button" class="lobby-inventory-grid-item ${item.id===lobbyInventorySelected?'selected':''}" data-inventory-item="${item.id}">
        <span class="lobby-inventory-grid-icon ${item.image?'with-image':''}">${item.image?`<img src="${item.image}" alt="${item.name}">`:(item.emoji||'◆')}</span>
        <b>×${item.count}</b>
        <small>${item.name}</small>
      </button>`).join(''):`<div class="lobby-inventory-grid-empty"><span>EMPTY</span><small>Chưa có vật phẩm trong nhóm này.</small></div>`;

    document.querySelectorAll('[data-inventory-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.inventoryTab===lobbyInventoryTab));
    list.querySelectorAll('[data-inventory-item]').forEach(btn=>btn.addEventListener('click',()=>{
        lobbyInventorySelected=btn.dataset.inventoryItem;
        renderLobbyInventory(user);
    }));
    renderLobbyInventoryDetail(user);
    renderLobbyInventoryBadge(user);
}

function setLobbyInventoryTab(tab){
    if(!['consumable','upgrade','material'].includes(tab))return;
    lobbyInventoryTab=tab;
    const user=getCurrentUser(); if(!user)return;
    const first=getLobbyInventoryDefinitions(user).find(x=>x.tab===tab);
    lobbyInventorySelected=first?.id||'';
    renderLobbyInventory(user);
}

function renderNightStageChoiceBoxPicker(user=getCurrentUser()){
    const grid=$("nightStageChoiceGrid");
    if(!grid||!user)return;
    ensureLobbyInventory(user);
    const chars=[
      {id:'ns_akito',name:'SHINONOME AKITO',type:'VOCAL',image:'assets/akito2.png'},
      {id:'ns_an',name:'SHIRAISHI AN',type:'RAP',image:'assets/an2.png'},
      {id:'ns_saki',name:'TENMA SAKI',type:'ACT',image:'assets/saki2.png'}
    ];
    const charHtml=chars.map(c=>{
        const state=lobbyInventoryCharacterState(user,c.id);
        const status=state.owned?`RANK ${state.rank} / 5`:'NEW · RANK 1';
        return `<button class="night-stage-choice-option character ${state.maxed?'maxed':''}" data-ns-box-choice="${c.id}" ${state.maxed?'disabled':''}>
          <img src="${c.image}" alt="${c.name}" onerror="this.style.display='none'">
          <small>${c.type} · 6★</small>
          <strong>${c.name}</strong>
          <span>${state.maxed?'RANK 5 · MAX':status}</span>
          <b>${state.maxed?'ĐÃ MAX':'CHỌN'}</b>
        </button>`;
    }).join('');
    grid.innerHTML=charHtml+`<button class="night-stage-choice-option factor" data-ns-box-choice="stellarFactor">
      <div class="night-stage-factor-mark">✦</div>
      <small>STELLAR MATERIAL</small>
      <strong>NHÂN TỐ TINH TÚ</strong>
      <span>Nhận +1 Nhân Tố Tinh Tú.</span>
      <b>CHỌN</b>
    </button>`;
    grid.querySelectorAll('[data-ns-box-choice]').forEach(btn=>btn.addEventListener('click',()=>claimNightStageChoiceFromBox(btn.dataset.nsBoxChoice)));
}

function openLobbyInventory(){
    const user=getCurrentUser();if(!user)return;
    lobbyInventoryTab='consumable';
    lobbyInventorySelected='nightStageChoiceBox';
    renderLobbyInventory(user);
    const overlay=$("lobbyInventoryOverlay");
    if(overlay){overlay.classList.remove('hidden');overlay.setAttribute('aria-hidden','false')}
}
function closeLobbyInventory(){
    const overlay=$("lobbyInventoryOverlay");
    if(overlay){overlay.classList.add('hidden');overlay.setAttribute('aria-hidden','true')}
}
function openNightStageChoiceBoxPicker(){
    const user=getCurrentUser();if(!user)return;
    if(getNightStageChoiceBoxCount(user)<=0){showLobbyToast('TÚI ĐỒ','Bạn chưa có Hộp Lựa Chọn NIGHT STAGE.');return;}
    renderNightStageChoiceBoxPicker(user);
    const overlay=$("nightStageChoiceBoxOverlay");
    if(overlay){overlay.classList.remove('hidden');overlay.setAttribute('aria-hidden','false')}
}
function closeNightStageChoiceBoxPicker(){
    const overlay=$("nightStageChoiceBoxOverlay");
    if(overlay){overlay.classList.add('hidden');overlay.setAttribute('aria-hidden','true')}
}

function grantNightStageCharacterFromInventory(user,id){
    if(typeof window.grantNightStageCharacter==='function'){
        window.grantNightStageCharacter(user,id);
        return;
    }
    user.myCharacters=Array.isArray(user.myCharacters)?user.myCharacters:[];
    user.characterProgress=user.characterProgress&&typeof user.characterProgress==='object'?user.characterProgress:{};
    if(!user.myCharacters.includes(id)){
        user.myCharacters.push(id);
        user.characterProgress[id]={rank:1,level:1};
    }else{
        const p=user.characterProgress[id]||{rank:1,level:1};
        p.rank=Math.min(5,Math.max(1,Number(p.rank)||1)+1);
        user.characterProgress[id]=p;
    }
}

function claimNightStageChoiceFromBox(choice){
    const user=getCurrentUser();if(!user)return;
    ensureLobbyInventory(user);
    const boxes=getNightStageChoiceBoxCount(user);
    if(boxes<=0){closeNightStageChoiceBoxPicker();renderLobbyInventory(user);return;}

    const validChars=['ns_akito','ns_an','ns_saki'];
    if(validChars.includes(choice)){
        const state=lobbyInventoryCharacterState(user,choice);
        if(state.maxed){showLobbyToast('NIGHT STAGE','Character này đã Rank 5.');renderNightStageChoiceBoxPicker(user);return;}
        grantNightStageCharacterFromInventory(user,choice);
    }else if(choice==='stellarFactor'){
        user.stellarFactor=Math.max(0,Math.floor(Number(user.stellarFactor)||0))+1;
    }else{return;}

    user.inventoryItems.nightStageChoiceBox=boxes-1;
    updateUser(user);
    cacheUser(user);
    setupLobby(user);
    try{renderMyCharacters()}catch(_){}
    try{renderTeamSelect()}catch(_){}
    renderLobbyInventory(user);

    const pickedName=choice==='stellarFactor'?'NHÂN TỐ TINH TÚ':({ns_akito:'SHINONOME AKITO',ns_an:'SHIRAISHI AN',ns_saki:'TENMA SAKI'}[choice]||choice);
    showLobbyToast('NIGHT STAGE CHOICE BOX',`Đã nhận ${pickedName}.`);

    if(getNightStageChoiceBoxCount(user)>0){
        renderNightStageChoiceBoxPicker(user);
    }else{
        closeNightStageChoiceBoxPicker();
    }
}

function useEnergyPotion60(){
    const user=getCurrentUser(); if(!user)return;
    ensureLobbyInventory(user);
    const count=getEnergyPotion60Count(user);
    if(count<=0){showLobbyToast('TÚI ĐỒ','Bạn không có Bình Energy +60.');return;}
    user.inventoryItems.energyPotion60=count-1;
    user.eventEnergy=Math.max(0,Number(user.eventEnergy)||0)+60;
    updateUser(user); cacheUser(user); setupLobby(user); renderLobbyInventory(user);
    showLobbyToast('BÌNH ENERGY +60','Đã hồi +60 Energy.');
}

function useSelectedLobbyInventoryItem(){
    const use=$("lobbyInventoryUseButton");
    const id=use?.dataset?.inventoryUse||lobbyInventorySelected;
    if(id==='nightStageChoiceBox') openNightStageChoiceBoxPicker();
    else if(id==='energyPotion60') useEnergyPotion60();
}

function bindLobbyInventoryV60(){
    $("lobbyInventoryButton")?.addEventListener('click',openLobbyInventory);
    $("closeLobbyInventory")?.addEventListener('click',closeLobbyInventory);
    $("closeNightStageChoiceBox")?.addEventListener('click',closeNightStageChoiceBoxPicker);
    $("lobbyInventoryUseButton")?.addEventListener('click',useSelectedLobbyInventoryItem);
    document.querySelectorAll('[data-inventory-tab]').forEach(btn=>btn.addEventListener('click',()=>setLobbyInventoryTab(btn.dataset.inventoryTab)));
    $("lobbyInventoryOverlay")?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeLobbyInventory()});
    $("nightStageChoiceBoxOverlay")?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeNightStageChoiceBoxPicker()});
    renderLobbyInventoryBadge(getCurrentUser());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindLobbyInventoryV60,{once:true});else bindLobbyInventoryV60();

/* =========================================================
   DAILY LIVE · renewable Gems / Gold
   480 Gems + 200,000 Gold per Vietnam day.
========================================================= */
const DAILY_LIVE_MISSIONS = [
    {id:"login", title:"ĐĂNG NHẬP HÔM NAY", desc:"Mở REALYZE!! trong ngày.", target:1, gems:50, coins:20000},
    {id:"clear1", title:"CLEAR 1 LIVE", desc:"Hoàn thành 1 bài nhạc hôm nay.", target:1, source:"clears", gems:60, coins:25000},
    {id:"clear3", title:"CLEAR 3 LIVE", desc:"Hoàn thành 3 bài nhạc hôm nay.", target:3, source:"clears", gems:70, coins:30000},
    {id:"clear5", title:"CLEAR 5 LIVE", desc:"Hoàn thành 5 bài nhạc hôm nay.", target:5, source:"clears", gems:80, coins:35000},
    {id:"event1", title:"EVENT PERFORMANCE", desc:"Hoàn thành 1 trận Event (Training hoặc Player).", target:1, source:"events", gems:70, coins:30000},
    {id:"event3", title:"EVENT ENCORE", desc:"Hoàn thành 3 trận Event trong ngày.", target:3, source:"events", gems:50, coins:20000},
    {id:"all", title:"ALL DAILY COMPLETE", desc:"Hoàn thành toàn bộ 6 nhiệm vụ phía trên.", target:1, source:"all", gems:100, coins:40000}
];
function dailyLiveKey(){const d=getVietnamDateParts();return `${d.year}-${String(d.month).padStart(2,"0")}-${String(d.day).padStart(2,"0")}`}
function totalRhythmClears(u){return Object.values(u?.rhythmProgress||{}).reduce((n,p)=>n+Math.max(0,Number(p?.clearCount)||0),0)}
function ensureDailyLive(u){
    if(!u)return null; const key=dailyLiveKey();
    if(!u.dailyLive||u.dailyLive.date!==key){u.dailyLive={date:key,baseClears:totalRhythmClears(u),events:0,claimed:[]};}
    u.dailyLive.claimed=Array.isArray(u.dailyLive.claimed)?u.dailyLive.claimed:[];
    u.dailyLive.events=Math.max(0,Number(u.dailyLive.events)||0);
    return u.dailyLive;
}
function dailyLiveProgress(u,m){const d=ensureDailyLive(u);if(m.id==='login')return 1;if(m.source==='clears')return Math.max(0,totalRhythmClears(u)-Number(d.baseClears||0));if(m.source==='events')return d.events;if(m.source==='all'){return DAILY_LIVE_MISSIONS.slice(0,6).every(x=>dailyLiveProgress(u,x)>=x.target)?1:0}return 0}
function renderDailyLive(){
    const u=getCurrentUser(), list=$("dailyLiveMissionList"), allBtn=$("dailyLiveClaimAll"); if(!u||!list)return; const d=ensureDailyLive(u);
    list.innerHTML=DAILY_LIVE_MISSIONS.map(m=>{const prog=Math.min(m.target,dailyLiveProgress(u,m)),done=prog>=m.target,claimed=d.claimed.includes(m.id);return `<article class="daily-live-mission ${done?'done':''} ${claimed?'claimed':''}"><div class="daily-live-copy"><small>${m.id==='all'?'DAILY BONUS':'DAILY MISSION'}</small><strong>${m.title}</strong><span>${m.desc}</span><i><em style="width:${Math.min(100,prog/m.target*100)}%"></em></i><b>${prog} / ${m.target}</b></div><div class="daily-live-reward"><span>◆ ${m.gems}</span><span>● ${m.coins.toLocaleString()}</span><button data-daily-claim="${m.id}" ${!done||claimed?'disabled':''}>${claimed?'CLAIMED':done?'CLAIM':'LOCKED'}</button></div></article>`}).join('');
    list.querySelectorAll('[data-daily-claim]').forEach(b=>b.onclick=()=>claimDailyLiveMission(b.dataset.dailyClaim));
    if(allBtn){
        const any=DAILY_LIVE_MISSIONS.some(m=>dailyLiveProgress(u,m)>=m.target&&!d.claimed.includes(m.id));
        allBtn.disabled=false;
        allBtn.textContent='CLAIM ALL';
        allBtn.classList.toggle('nothing-to-claim',!any);
    }
}
function claimDailyLiveMission(id){const u=getCurrentUser();if(!u)return;const d=ensureDailyLive(u),m=DAILY_LIVE_MISSIONS.find(x=>x.id===id);if(!m||d.claimed.includes(id)||dailyLiveProgress(u,m)<m.target)return;u.gems=finiteNumber(u.gems,0)+m.gems;u.coins=finiteNumber(u.coins,0)+m.coins;d.claimed.push(id);updateUser(u);setupLobby(u);renderDailyLive();showLobbyToast('DAILY LIVE',`+${m.gems} Gems · +${m.coins.toLocaleString()} Gold`)}
function claimAllDailyLive(){
    const u=getCurrentUser();if(!u)return;
    let gems=0,coins=0;
    for(const m of DAILY_LIVE_MISSIONS){
        const d=ensureDailyLive(u);
        if(!d.claimed.includes(m.id)&&dailyLiveProgress(u,m)>=m.target){d.claimed.push(m.id);gems+=m.gems;coins+=m.coins}
    }
    if(!gems&&!coins){showLobbyToast('DAILY LIVE','Hiện chưa có nhiệm vụ nào có thể nhận.');renderDailyLive();return;}
    u.gems=finiteNumber(u.gems,0)+gems;u.coins=finiteNumber(u.coins,0)+coins;
    updateUser(u);setupLobby(u);renderDailyLive();showLobbyToast('DAILY LIVE',`+${gems} Gems · +${coins.toLocaleString()} Gold`)
}
function openDailyLive(){const o=$("dailyLiveOverlay");if(!o)return;const u=getCurrentUser();if(u){ensureDailyLive(u);updateUser(u)}renderDailyLive();o.classList.remove('hidden');o.setAttribute('aria-hidden','false')}
function closeDailyLive(){const o=$("dailyLiveOverlay");if(o){o.classList.add('hidden');o.setAttribute('aria-hidden','true')}}


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
        updateStellarFactorUI(user);
        updateStellarBookUI(user);
        updateNewPlayerBannerUI(user);
        updateDanceBannerUI(user);

        showScreen(
            "gachaScreen"
        );
        try { setGachaBanner(activeGachaBanner || "items"); } catch (_) {}

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


const RHYTHM_REWARD_CONFIG_BY_DIFFICULTY = {
    EASY:{
      rank:[
        {id:"D",label:"RANK D",coins:500,gems:0},{id:"C",label:"RANK C",coins:800,gems:10},
        {id:"B",label:"RANK B",coins:1200,gems:20},{id:"A",label:"RANK A",coins:1800,gems:30},
        {id:"S",label:"RANK S",coins:2500,gems:50}
      ],
      combo:[
        {id:"20",label:"20% MAX COMBO",ratio:.20,coins:400,gems:0},{id:"40",label:"40% MAX COMBO",ratio:.40,coins:600,gems:5},
        {id:"60",label:"60% MAX COMBO",ratio:.60,coins:900,gems:10},{id:"80",label:"80% MAX COMBO",ratio:.80,coins:1300,gems:15},
        {id:"100",label:"FULL COMBO",ratio:1,coins:2000,gems:25}
      ],
      clear:[
        {id:"1",label:"CLEAR 1 LẦN",count:1,coins:500,gems:10},{id:"5",label:"CLEAR 5 LẦN",count:5,coins:1500,gems:20},
        {id:"10",label:"CLEAR 10 LẦN",count:10,coins:3000,gems:35},{id:"15",label:"CLEAR 15 LẦN",count:15,coins:4500,gems:50},
        {id:"20",label:"CLEAR 20 LẦN",count:20,coins:7000,gems:80}
      ]
    },
    NORMAL:{
      rank:[
        {id:"D",label:"RANK D",coins:700,gems:0},{id:"C",label:"RANK C",coins:1100,gems:12},
        {id:"B",label:"RANK B",coins:1700,gems:28},{id:"A",label:"RANK A",coins:2500,gems:45},
        {id:"S",label:"RANK S",coins:3500,gems:75}
      ],
      combo:[
        {id:"20",label:"20% MAX COMBO",ratio:.20,coins:600,gems:0},{id:"40",label:"40% MAX COMBO",ratio:.40,coins:900,gems:7},
        {id:"60",label:"60% MAX COMBO",ratio:.60,coins:1350,gems:14},{id:"80",label:"80% MAX COMBO",ratio:.80,coins:1950,gems:22},
        {id:"100",label:"FULL COMBO",ratio:1,coins:3000,gems:38}
      ],
      clear:[
        {id:"1",label:"CLEAR 1 LẦN",count:1,coins:800,gems:14},{id:"5",label:"CLEAR 5 LẦN",count:5,coins:2200,gems:30},
        {id:"10",label:"CLEAR 10 LẦN",count:10,coins:4300,gems:50},{id:"15",label:"CLEAR 15 LẦN",count:15,coins:6500,gems:75},
        {id:"20",label:"CLEAR 20 LẦN",count:20,coins:10000,gems:120}
      ]
    },
    HARD:{
      rank:[
        {id:"D",label:"RANK D",coins:1000,gems:0},{id:"C",label:"RANK C",coins:1500,gems:18},
        {id:"B",label:"RANK B",coins:2400,gems:40},{id:"A",label:"RANK A",coins:3600,gems:65},
        {id:"S",label:"RANK S",coins:5000,gems:110}
      ],
      combo:[
        {id:"20",label:"20% MAX COMBO",ratio:.20,coins:850,gems:0},{id:"40",label:"40% MAX COMBO",ratio:.40,coins:1300,gems:10},
        {id:"60",label:"60% MAX COMBO",ratio:.60,coins:2000,gems:20},{id:"80",label:"80% MAX COMBO",ratio:.80,coins:2900,gems:34},
        {id:"100",label:"FULL COMBO",ratio:1,coins:4500,gems:55}
      ],
      clear:[
        {id:"1",label:"CLEAR 1 LẦN",count:1,coins:1200,gems:20},{id:"5",label:"CLEAR 5 LẦN",count:5,coins:3300,gems:45},
        {id:"10",label:"CLEAR 10 LẦN",count:10,coins:6500,gems:75},{id:"15",label:"CLEAR 15 LẦN",count:15,coins:9800,gems:110},
        {id:"20",label:"CLEAR 20 LẦN",count:20,coins:15000,gems:180}
      ]
    }
};
function getRhythmRewardConfig(difficulty){
    return RHYTHM_REWARD_CONFIG_BY_DIFFICULTY[difficulty] || RHYTHM_REWARD_CONFIG_BY_DIFFICULTY.EASY;
}
function ensureRhythmProgress(user){
    if (!user) return {};
    if (!user.rhythmProgress || typeof user.rhythmProgress !== "object") user.rhythmProgress = {};
    return user.rhythmProgress;
}
function getSongRhythmProgress(user, songId){
    const all = ensureRhythmProgress(user);
    if (!all[songId] || typeof all[songId] !== "object") {
        all[songId] = { bestScore:0, bestRank:"", bestCombo:0, clearCount:0, totalNotes:0, claimed:{rank:[],combo:[],clear:[]}, modes:{} };
    }
    const p = all[songId];
    if (!p.claimed || typeof p.claimed !== "object") p.claimed={rank:[],combo:[],clear:[]};
    if (!p.modes || typeof p.modes !== "object") p.modes={};
    ["rank","combo","clear"].forEach(k=>{ if(!Array.isArray(p.claimed[k])) p.claimed[k]=[]; });
    return p;
}

function getSongModeRhythmProgress(user,songId,difficulty="EASY"){
    const songProgress=getSongRhythmProgress(user,songId);

    if(
        !songProgress.modes.EASY &&
        Object.keys(songProgress.modes).length===0 &&
        (songProgress.bestScore||songProgress.clearCount||songProgress.bestCombo)
    ){
        songProgress.modes.EASY={
            bestScore:Number(songProgress.bestScore||0),
            bestRank:songProgress.bestRank||"",
            bestCombo:Number(songProgress.bestCombo||0),
            clearCount:Number(songProgress.clearCount||0),
            totalNotes:Number(songProgress.totalNotes||0),
            claimed:JSON.parse(JSON.stringify(songProgress.claimed||{rank:[],combo:[],clear:[]}))
        };
    }

    if(!songProgress.modes[difficulty]){
        songProgress.modes[difficulty]={bestScore:0,bestRank:"",bestCombo:0,clearCount:0,totalNotes:0,claimed:{rank:[],combo:[],clear:[]}};
    }
    const p=songProgress.modes[difficulty];
    if(!p.claimed)p.claimed={rank:[],combo:[],clear:[]};
    ["rank","combo","clear"].forEach(k=>{if(!Array.isArray(p.claimed[k]))p.claimed[k]=[]});
    return p;
}
function mergePendingRhythmProgress(user){
    if (!user) return false;
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem("realyze_rhythm_pending") || "null"); } catch(_){}
    if (!pending || !pending.songId) return false;
    const p = getSongRhythmProgress(user, pending.songId);
    if(pending.difficulty && pending.modeProgress){
        const mp=getSongModeRhythmProgress(user,pending.songId,pending.difficulty);
        const incoming=pending.modeProgress;
        const rankOrder=["D","C","B","A","S"];
        const oldModeScore=Number(mp.bestScore||0);
        mp.bestScore=Math.max(oldModeScore,Number(incoming.bestScore||0));
        mp.bestCombo=Math.max(Number(mp.bestCombo||0),Number(incoming.bestCombo||0));
        mp.clearCount=Math.max(Number(mp.clearCount||0),Number(incoming.clearCount||0));
        mp.totalNotes=Math.max(Number(mp.totalNotes||0),Number(incoming.totalNotes||0));
        if(incoming.bestRank && rankOrder.indexOf(incoming.bestRank)>rankOrder.indexOf(mp.bestRank||""))mp.bestRank=incoming.bestRank;
        ["rank","combo","clear"].forEach(k=>{
            mp.claimed[k]=Array.from(new Set([...(mp.claimed[k]||[]),...(incoming.claimed?.[k]||[])]));
        });
    }

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
    const incomingRank = Math.max(1, Math.min(PLAYER_MAX_RANK, Number(pending.playerRank) || 1));
    const incomingXp = Math.max(0, Number(pending.playerRankXp) || 0);
    const currentRank = Math.max(1, Math.min(PLAYER_MAX_RANK, Number(user.rank) || 1));
    const currentXp = Math.max(0, Number(user.rankXp) || 0);

    // Never let a stale Supabase snapshot roll the player back after gameplay.
    if (incomingRank > currentRank) {
        user.rank = incomingRank;
        user.rankXp = incomingXp;
    } else if (incomingRank === currentRank) {
        user.rank = currentRank;
        user.rankXp = Math.max(currentXp, incomingXp);
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
    const rewardDifficulty = songIndex===selectedNowPlaySong ? selectedNowPlayDifficulty : "EASY";
    const p=getSongModeRhythmProgress(user,song.id,rewardDifficulty);
    const rewardConfig=getRhythmRewardConfig(rewardDifficulty);
    $("rhythmRewardSongName").textContent=`${song.name} · ${rewardDifficulty}`;
    $("rhythmRewardBestScore").textContent=Number(p.bestScore||0).toLocaleString();
    const rankOrder=["D","C","B","A","S"];
    const bestRankIndex=rankOrder.indexOf(p.bestRank||"");
    const groups=[
      ["SCORE RANK", rewardConfig.rank, item => bestRankIndex>=rankOrder.indexOf(item.id), "rank"],
      ["MAX COMBO", rewardConfig.combo, item => Number(p.totalNotes||0)>0 && Number(p.bestCombo||0)>=Math.ceil(Number(p.totalNotes)*item.ratio), "combo"],
      ["CLEAR COUNT", rewardConfig.clear, item => Number(p.clearCount||0)>=item.count, "clear"]
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
        difficultyStars:{EASY:3,NORMAL:5,HARD:7},
        difficulty: {
            EASY: { locked: false },
            NORMAL: { locked: false },
            HARD: { locked: false }
        }
    },
    {
        id: "track-02",
        name: "BOUNCE",
        artist: "VANI",
        stars: 4,
        art: null,
        highlight: "assets/song-022_[cut_133sec].mp3",
        difficultyStars:{EASY:4,NORMAL:6,HARD:8},
        difficulty: {
            EASY: { locked: false },
            NORMAL: { locked: false },
            HARD: { locked: false }
        }
    },
    {
        id: "track-03",
        name: "CRASH THE PARTY",
        artist: "REALYZE (but Shoto & Hikari & Eke)",
        stars: 5,
        highlight: "assets/song-03.mp3",
        art: null,
        difficultyStars:{EASY:5,NORMAL:7,HARD:9},
        difficulty: {
            EASY: { locked: false },
            NORMAL: { locked: false },
            HARD: { locked: false }
        }
    },
    {
        id: "track-04",
        name: "TEIKOKU SHOUJO",
        artist: "VANI & EBI",
        stars: 3,
        art: "assets/ts.jpg",
        highlight: "assets/ts.mp3",
        difficultyStars: {
            EASY: 3,
            NORMAL: 4,
            HARD: 6
        },
        difficulty: {
            EASY: { locked: false },
            NORMAL: { locked: false },
            HARD: { locked: false }
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
    1: "assets/song-022_[cut_133sec].mp3",
    2: "assets/ctp.mp3",
    3: "assets/ts.mp3"
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

    // NOW PLAY V49: avatar / username / rank block was intentionally removed.
    $("nowPlayGemCount") && ($("nowPlayGemCount").textContent =
        Number(user.gems || 0).toLocaleString());

    $("nowPlayCoinCount") && ($("nowPlayCoinCount").textContent =
        Number(user.coins || 0).toLocaleString());

    $("nowPlayTicketCount") && ($("nowPlayTicketCount").textContent =
        Number(user.tickets || 0).toLocaleString());
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
                song.difficultyStars
                    ? `${formatDifficultyStars(song.difficultyStars.EASY)}–${formatDifficultyStars(song.difficultyStars.HARD)}`
                    : "★".repeat(song.stars);

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
    const progress = getSongModeRhythmProgress(user, song.id, selectedNowPlayDifficulty);
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


function formatDifficultyStars(value){
    const n = Number(value) || 0;
    const whole = Math.floor(n);
    return "★".repeat(whole) + (n % 1 >= .5 ? "½" : "");
}
function getSongDifficultyStars(song,difficulty){
    return Number(song?.difficultyStars?.[difficulty] ?? song?.stars ?? 0);
}


const IMPLEMENTED_RHYTHM_DIFFICULTIES = {
    "track-01": ["EASY","NORMAL","HARD"],
    "track-02": ["EASY","NORMAL","HARD"],
    "track-03": ["EASY","NORMAL","HARD"],
    "track-04": ["EASY","NORMAL","HARD"]
};
function isRhythmDifficultyImplemented(song,difficulty){
    const list = IMPLEMENTED_RHYTHM_DIFFICULTIES[song?.id];
    return Array.isArray(list) && list.includes(difficulty);
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
        formatDifficultyStars(getSongDifficultyStars(song, selectedNowPlayDifficulty));


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

            const config = song.difficulty[difficulty] || {};
            const implemented = isRhythmDifficultyImplemented(song, difficulty);
            const isLocked = implemented ? false : Boolean(config.locked);

            button.classList.toggle("locked", isLocked);

            button.classList.toggle(
                "active",
                difficulty === selectedNowPlayDifficulty &&
                !isLocked
            );

            // The button HTML already contains the text NORMAL/HARD.
            // This <span> is ONLY the extra LOCKED badge.
            // Writing "NORMAL" into it caused "NORMAL NORMAL".
            const lockBadge = button.querySelector("span");
            if (lockBadge) {
                lockBadge.textContent = isLocked ? "LOCKED" : "";
                lockBadge.style.display = isLocked ? "" : "none";
            }

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

                if (!song) return;

                const implemented = isRhythmDifficultyImplemented(song, difficulty);
                if (!implemented && song.difficulty[difficulty]?.locked) {
                    showNowPlayToast(
                        "DIFFICULTY LOCKED",
                        "This difficulty does not have a beatmap yet."
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


$("playEventButton")?.addEventListener(
    "click",
    () => {
        // NOW PLAY -> Event setup. Keep team picking inside event-play.html.
        window.location.href = "event-play.html";
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
        stat: { base: 25600, perLevel: 660 },
        skillName: "RADIANT ASCENSION",
        skill: "12s: Score +65%, MISS protection 4s, HP +250, Stage Reward +10%.",
        skillType: "luminaAscension",
        skillMultiplier: 1.65,
        skillDuration: 12,
        rewardMultiplier: 1.10,
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
        stat: { base: 27200, perLevel: 700 },
        skillName: "BURN EVERYTHING",
        skill: "11s: Score +75%, Reward +20%, consumes 180 HP.",
        skillType: "akitoBurnEverything",
        skillMultiplier: 1.75,
        skillDuration: 11,
        rewardMultiplier: 1.20,
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
        stat: { base: 25800, perLevel: 650 },
        skillName: "SHINE BURST",
        skill: "When activated: +50% note score for 10 seconds and +25% stage rewards.",
        skillType: "scoreReward",
        skillDuration: 10,
        skillMultiplier: 1.50,
        rewardMultiplier: 1.25,
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
        stat: { base: 26000, perLevel: 670 },
        skillName: "ABSOLUTE GUARD",
        skill: "9s: NO MISS + Score +35% + HP +350.",
        skillType: "shotaAbsolute",
        skillMultiplier: 1.35,
        skillDuration: 9,
        number: "006"
    },
    {
        id: "ichika",
        name: "ICHIKA",
        description: "Beginning — a limited 6★ RAP performer built around fast chain support.",
        image: "assets/ichika.png",
        default: false,
        rarity: 6,
        rate: 0.33333,
        main: "RAP",
        stat: { base: 22180, perLevel: 575 },
        skillName: "STARLIGHT BEAT",
        skill: "For 8 seconds, consecutive PERFECT / GREAT notes build score bonus up to +25%; MISS resets the chain.",
        skillType: "starlightChain",
        skillDuration: 8,
        number: "008"
    },
    {
        id: "touya",
        name: "TOUYA",
        description: "Beginning — a limited 6★ VOCAL performer built for explosive score windows.",
        image: "assets/beginning_touya.png",
        default: false,
        rarity: 6,
        rate: 0.22222,
        main: "VOCAL",
        stat: { base: 23450, perLevel: 610 },
        skillName: "CYBER OVERDRIVE",
        skill: "For 10 seconds, all note score is increased by 45%.",
        skillType: "scoreBurst",
        skillMultiplier: 1.45,
        skillDuration: 10,
        number: "009"
    },
    {
        id: "airi",
        name: "AIRI",
        description: "Beginning — a limited 5★ ACT performer with a bright, stable scoring burst.",
        image: "assets/beginning_airi.png",
        default: false,
        rarity: 5,
        rate: 5,
        main: "ACT",
        stat: { base: 15950, perLevel: 505 },
        skillName: "HAPPY PARADE",
        skill: "For 9 seconds, all note score is increased by 30%.",
        skillType: "scoreBurst",
        skillMultiplier: 1.30,
        skillDuration: 9,
        number: "010"
    },
    {
        id: "akito4",
        name: "AKITO",
        description: "Beginning — a limited 4★ ACT version focused on a short warm-up score boost.",
        image: "assets/beginning_akito.png",
        default: false,
        rarity: 4,
        rate: 15,
        main: "ACT",
        stat: { base: 11840, perLevel: 360 },
        skillName: "WINTER WARM-UP",
        skill: "For 8 seconds, all note score is increased by 18%.",
        skillType: "scoreBurst",
        skillMultiplier: 1.18,
        skillDuration: 8,
        number: "011"
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
    },
    {
        id: "shiho",
        name: "HINOMORI SHIHO",
        description: "A rare 6★ DANCE support performer. DANCE supports VOCAL / RAP / ACT in Event instead of creating a fourth score bar.",
        image: "assets/shiho1.png",
        default: false,
        rarity: 6,
        rate: 0.111,
        main: "DANCE",
        stat: { base: 24840, perLevel: 645 },
        skillName: "LIME OVERDRIVE",
        skill: "10s: Score +55%. First 5s: MISS protection. Restores 250 HP and raises stage rewards by 15%.",
        skillType: "danceOverdrive",
        skillMultiplier: 1.55,
        skillDuration: 10,
        number: "012"
    },
    {
        id: "nene",
        name: "KUSANAGI NENE",
        description: "A rare 6★ DANCE breaker. In Event she specializes in deleting the rival's VOCAL / RAP / ACT points with long cooldown control skills.",
        image: "assets/nene1.png",
        default: false,
        rarity: 6,
        rate: 0.111,
        main: "DANCE",
        stat: { base: 25260, perLevel: 635 },
        skillName: "SYSTEM BREAKER",
        skill: "11s: Score +48%. First 3s: MISS protection. Restores 200 HP and raises stage rewards by 10%.",
        skillType: "neneSystemBreak",
        skillMultiplier: 1.48,
        skillDuration: 11,
        number: "015"
    },
    {
        id: "ns_akito",
        name: "SHINONOME AKITO",
        description: "NIGHT STAGE limited 6★ VOCAL character. Only obtainable from NIGHT STAGE milestone rewards.",
        image: "assets/akito2.png",
        default: false,
        rarity: 6,
        rate: 0,
        main: "VOCAL",
        stat: { base: 24680, perLevel: 625 },
        skillName: "MIDNIGHT HOWL",
        skill: "For 10 seconds, all note score is increased by 50%.",
        skillType: "scoreBurst",
        skillMultiplier: 1.50,
        skillDuration: 10,
        number: "016",
        nightStageOnly: true
    },
    {
        id: "ns_an",
        name: "SHIRAISHI AN",
        description: "NIGHT STAGE limited 6★ RAP character. Only obtainable from NIGHT STAGE milestone rewards.",
        image: "assets/an2.png",
        default: false,
        rarity: 6,
        rate: 0,
        main: "RAP",
        stat: { base: 25120, perLevel: 635 },
        skillName: "PURSUIT RHYTHM",
        skill: "For 11 seconds, all note score is increased by 47%.",
        skillType: "scoreBurst",
        skillMultiplier: 1.47,
        skillDuration: 11,
        number: "017",
        nightStageOnly: true
    },
    {
        id: "ns_saki",
        name: "TENMA SAKI",
        description: "NIGHT STAGE limited 6★ ACT character. Only obtainable from NIGHT STAGE milestone rewards.",
        image: "assets/saki2.png",
        default: false,
        rarity: 6,
        rate: 0,
        main: "ACT",
        stat: { base: 24950, perLevel: 620 },
        skillName: "MOONLIT ENCORE",
        skill: "For 10 seconds, all note score is increased by 42% and the team cannot MISS for the first 4 seconds.",
        skillType: "scoreBurst",
        skillMultiplier: 1.42,
        skillDuration: 10,
        number: "018",
        nightStageOnly: true
    },
    {
        id: "saki",
        name: "TENMA SAKI",
        description: "A 6★ ACT performer from the New Player Start Dash pool.",
        image: "assets/saki1.png",
        default: false,
        rarity: 6,
        rate: 0.33333,
        main: "ACT",
        stat: { base: 21750, perLevel: 585 },
        skillName: "SUNNY STAGE",
        skill: "For 9 seconds, all note score is increased by 38%.",
        skillType: "scoreBurst",
        skillMultiplier: 1.38,
        skillDuration: 9,
        number: "013"
    },
    {
        id: "luka",
        name: "MEGURINE LUKA",
        description: "A 6★ VOCAL performer from the New Player Start Dash pool.",
        image: "assets/luka1.png",
        default: false,
        rarity: 6,
        rate: 0.33333,
        main: "VOCAL",
        stat: { base: 22680, perLevel: 600 },
        skillName: "MEGURINE HARMONY",
        skill: "For 10 seconds, all note score is increased by 40%.",
        skillType: "scoreBurst",
        skillMultiplier: 1.40,
        skillDuration: 10,
        number: "014"
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
    },
    "SHINING MOMENT": {
        number: "E01",
        main: "RAP",
        vocal: { base: 5600, perLevel: 1650 },
        rap:   { base: 8200, perLevel: 2350 },
        act:   { base: 5100, perLevel: 1500 },
        skillName: "DROP THE BEAT",
        skill: "6★ EVENT SKILL: +60% điểm trong R1 10s • R2 11s • R3 12s • R4 13s • R5 15s. Trong 4 giây đầu không thể MISS."
    }
};

const CARD_MAIN_COLORS = {
    VOCAL: "#ef557f",
    RAP: "#4d8df7",
    ACT: "#e6b83f",
    DANCE: "#9bd84f"
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

function getUpgradeToMaxCost(currentLevel,maxLevel){
    let total=0;
    const from=Math.max(1,Number(currentLevel)||1);
    const to=Math.max(from,Number(maxLevel)||from);
    for(let lv=from;lv<to;lv++) total+=getCardUpgradeCost(lv);
    return total;
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
    const maxUpgradeButton = $("cardInfoMaxUpgrade");
    if (level >= maxLevel) {
        $("cardInfoUpgradeCost").textContent =
            rank < CARD_MAX_RANK ? "RANK UP REQUIRED" : "MAX LEVEL";
        upgradeButton.disabled = true;
        if(maxUpgradeButton) maxUpgradeButton.disabled = true;
        if($("cardInfoMaxUpgradeCost")) $("cardInfoMaxUpgradeCost").textContent =
            rank < CARD_MAX_RANK ? "CURRENT RANK MAX" : "MAX LEVEL";
    } else {
        $("cardInfoUpgradeCost").textContent =
            `● ${getCardUpgradeCost(level).toLocaleString()} GOLD`;
        upgradeButton.disabled = false;
        const totalMaxCost=getUpgradeToMaxCost(level,maxLevel);
        if(maxUpgradeButton) maxUpgradeButton.disabled = false;
        if($("cardInfoMaxUpgradeCost")) $("cardInfoMaxUpgradeCost").textContent =
            `● ${totalMaxCost.toLocaleString()} GOLD`;
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


function upgradeCardToMax(){
    const target=cardInfoTarget;
    if(!target||cardInfoTargetType!=="card")return;
    const user=getCurrentUser();
    if(!user)return;
    initGachaData(user);
    ensureCardProgress(target);
    const max=getCardMaxLevel(target.rank);
    const level=Number(target.level)||1;
    if(level>=max){
        showLobbyToast("MAX LEVEL",target.rank>=CARD_MAX_RANK?"This card has reached maximum level.":"This card is already at the maximum level for its current Rank.");
        return;
    }
    const cost=getUpgradeToMaxCost(level,max);
    const coins=Number(user.coins||0);
    if(coins<cost){
        showLobbyToast("NOT ENOUGH GOLD",`Need ${cost.toLocaleString()} GOLD to reach LV.${max}.`);
        return;
    }
    user.coins=coins-cost;
    target.level=max;
    saveCardProgress(target);
    setupLobby(user);
    renderCardInfo(target);
    renderMyCards();
    selectedTeamCards=selectedTeamCards.map(selected=>selected&&selected.id===target.id?target:selected);
    renderTeamSelect();
    showLobbyToast("LEVEL MAX",`${target.name} reached LV.${max}.`);
}

$("cardInfoBack")?.addEventListener("click", closeCardInfo);
$("cardInfoUpgrade")?.addEventListener("click", upgradeCardLevel);
$("cardInfoMaxUpgrade")?.addEventListener("click", upgradeCardToMax);

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
$("trialsButton")?.addEventListener("click",()=>{ location.href="trials.html"; });
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
function renderEventRewards(){
    const user=getCurrentUser();if(!user)return;ensureEventData(user);
    const mailChanged=syncEventMilestoneMail(user);if(mailChanged)updateUser(user);
    const points=Number(user.eventPoints||0),list=$("eventRewardsList");if(!list)return;
    list.innerHTML=EVENT_REWARDS.map((r,i)=>{const unlocked=points>=r.points,claimed=user.eventMailbox.some(m=>m.id===rewardMailboxKey(r,i)&&m.claimed);return `<article class="event-reward-row ${unlocked?"unlocked":"locked"} ${claimed?"claimed":""}"><div class="event-reward-point"><small>POINTS</small><strong>${r.points.toLocaleString()}</strong></div><div class="event-reward-icon ${r.card?"card-reward":r.character?"character-reward":""}">${r.card?'<img src="assets/event1.png" alt="">':r.character?'<img src="assets/kohane.png" alt="">':'✦'}</div><div class="event-reward-copy"><small>${r.card?"EVENT CARD · ★★★★★★":r.character?"EVENT CHARACTER · ★★★★★★":"MILESTONE REWARD"}</small><strong>${r.title}</strong><span>${r.card?"SHINING MOMENT · EVENT LIMITED CARD":r.character?"KOHANE · EVENT CHARACTER":r.title==="EVENT GRAND REWARD"?"GEMS ×2,500 · GOLD ×100,000 · TICKET ×200":`×${r.amount}`}</span></div><button class="event-claim-button" data-event-reward="${i}" ${!unlocked||claimed?"disabled":""}>${claimed?"CLAIMED":unlocked?"CLAIM":"LOCKED"}</button></article>`}).join("");
    list.querySelectorAll('[data-event-reward]').forEach(btn=>btn.onclick=()=>claimEventRewardDirect(Number(btn.dataset.eventReward)));
}
async function claimEventRewardDirect(index){
    const user=getCurrentUser(),reward=EVENT_REWARDS[index];if(!user||!reward)return;
    ensureEventData(user);if(Number(user.eventPoints||0)<Number(reward.points||0))return;
    syncEventMilestoneMail(user);
    const id=rewardMailboxKey(reward,index),mail=user.eventMailbox.find(m=>m.id===id);
    if(!mail||mail.claimed)return;
    applyEventReward(user,mail.reward||reward);mail.claimed=true;mail.claimedAt=Date.now();
    normalizeLobbyResources(user);await updateUser(user);setupLobby(user);renderEventPage();renderEventMailbox();
    showLobbyToast('EVENT REWARD',reward.card?'Đã nhận Event Card.':reward.character?'Đã nhận KOHANE / nâng Rank KOHANE.':'Đã nhận phần thưởng Event.');
}
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
    lumina: { base:25600, perLevel:660, main:"VOCAL", skillName:"RADIANT ASCENSION", skill:"12s: Score +65%, MISS protection 4s, HP +250, Reward +10%.", skillType:"luminaAscension", skillMultiplier:1.65, skillDuration:12, rewardMultiplier:1.10 },
    akito: { base:27200, perLevel:700, main:"ACT", skillName:"BURN EVERYTHING", skill:"11s: Score +75%, Reward +20%, consumes 180 HP.", skillType:"akitoBurnEverything", skillMultiplier:1.75, skillDuration:11, rewardMultiplier:1.20 },
    kohane: { base: 25800, perLevel: 650, main: "RAP", skillName: "SHINE BURST", skill: "When activated: +50% note score for 10 seconds and +25% stage rewards.", skillType: "scoreReward", skillDuration: 10, skillMultiplier: 1.50, rewardMultiplier: 1.25 },
    miku: { base: 9879, perLevel: 654, main: "VOCAL", skillName: "COLORFUL VOICE", skill: "Event: +15% score multiplier." },
    miku6: { base: 21250, perLevel: 620, main: "RAP", skillName: "RADIANT REWARD", skill: "After completing a stage, increases the amount of rewards received by 35%.", rewardMultiplier: 1.35 },
    shota: { base:26000, perLevel:670, main:"VOCAL", skillName:"ABSOLUTE GUARD", skill:"9s: NO MISS + Score +35% + HP +350.", skillType:"shotaAbsolute", skillMultiplier:1.35, skillDuration:9 },
    ichika: { base: 22180, perLevel: 575, main: "RAP", skillName: "STARLIGHT BEAT", skill: "For 8 seconds, consecutive PERFECT / GREAT notes build score bonus up to +25%; MISS resets the chain.", skillType: "starlightChain", skillDuration: 8 },
    touya: { base: 23450, perLevel: 610, main: "VOCAL", skillName: "CYBER OVERDRIVE", skill: "For 10 seconds, all note score is increased by 45%.", skillType: "scoreBurst", skillMultiplier: 1.45, skillDuration: 10 },
    airi: { base: 15950, perLevel: 505, main: "ACT", skillName: "HAPPY PARADE", skill: "For 9 seconds, all note score is increased by 30%.", skillType: "scoreBurst", skillMultiplier: 1.30, skillDuration: 9 },
    akito4: { base: 11840, perLevel: 360, main: "ACT", skillName: "WINTER WARM-UP", skill: "For 8 seconds, all note score is increased by 18%.", skillType: "scoreBurst", skillMultiplier: 1.18, skillDuration: 8 },
    rui: { base: 13479, perLevel: 490, main: "ACT", skillName: "SHOWTIME TRICK", skill: "For 8 seconds, each PERFECT / GREAT has a 20% chance to add 1 TRICK stack. The next note gains +5% score per stack, up to 3 stacks (+15%), then the stacks reset.", skillType: "trickStack", skillDuration: 8 },
    shiho: { base:24840, perLevel:645, main:"DANCE", skillName:"LIME OVERDRIVE", skill:"10s: Score +55%. First 5s: MISS protection. Restores 250 HP and raises stage rewards by 15%.", skillType:"danceOverdrive", skillMultiplier:1.55, skillDuration:10 },
    nene: { base:25260, perLevel:635, main:"DANCE", skillName:"SYSTEM BREAKER", skill:"11s: Score +48%. First 3s: MISS protection. Restores 200 HP and raises stage rewards by 10%.", skillType:"neneSystemBreak", skillMultiplier:1.48, skillDuration:11 },
    ns_akito: { base:24680, perLevel:625, main:"VOCAL", skillName:"ALL-IN REDLINE", skill:"10s all-out offense: Score +90%, HP -250. If AN is in team: +105% for 12s and half HP cost.", skillType:"nightAkitoAllIn", skillMultiplier:1.90, skillDuration:10 },
    ns_an: { base:25120, perLevel:635, main:"RAP", skillName:"BLUE RELAY", skill:"Pure support: HP +300, NO MISS 5s, extend active effects +4s and strengthen following team skills.", skillType:"nightAnRelay", skillDuration:12 },
    ns_saki: { base:24950, perLevel:620, main:"ACT", skillName:"EFFECT PARADE", skill:"Effect-team specialist: extends active effects +5s and creates a 14s field extending new Character/Card effects.", skillType:"nightSakiEffect", skillDuration:14 },
    saki: { base:21750, perLevel:585, main:"ACT", skillName:"SUNNY STAGE", skill:"For 9 seconds, all note score is increased by 38%.", skillType:"scoreBurst", skillMultiplier:1.38, skillDuration:9 },
    luka: { base:22680, perLevel:600, main:"VOCAL", skillName:"MEGURINE HARMONY", skill:"For 10 seconds, all note score is increased by 40%.", skillType:"scoreBurst", skillMultiplier:1.40, skillDuration:10 }
};


const CHARACTER_EVENT_SKILLS_VI = {
    lumina: [
        ["RADIANT NOVA", "+3.800 điểm VOCAL."],
        ["BRIGHT SUPERNOVA", "+4.600 VOCAL; 40% cơ hội ×1,50 hành động này."],
        ["VOCAL COLLAPSE", "+2.400 VOCAL, giảm 1.800 VOCAL đối thủ và hành động đồng đội kế tiếp +25%."]
    ],
    akito: [
        ["BURN ACT EX", "+4.100 điểm ACT."],
        ["TURN THE TABLE EX", "Akito lấy 2 lượt đồng minh kế tiếp; hành động ghi điểm kế tiếp của Akito +300%."],
        ["CROSS OVERDRIVE", "2 hành động của đồng minh khác hệ +30%; hành động kế tiếp của Akito +50%."]
    ],
    kohane: [
        ["RAP SHINE EX", "+3.200 điểm RAP."],
        ["BLESSING OF DAWN", "2 hành động ghi điểm tiếp theo của đồng đội được +60%. · CD 2"],
        ["DIVINE TURN", "+1.800 RAP, đội được ưu tiên lượt kế tiếp và hành động ghi điểm kế tiếp +35%. · CD 3"]
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
    ichika: [
        ["FIRST NOTE", "+2.850 điểm RAP."],
        ["CHAIN RHYTHM", "2 hành động ghi điểm tiếp theo của đồng đội +25%; đồng đội khác hệ với Ichika nhận +35%. · CD 2"],
        ["ONE MORE MEASURE", "+1.600 RAP và đội được ưu tiên lượt kế tiếp. · CD 3"]
    ],
    rui: [
        ["CURTAIN CALL", "+1.950 ACT và MARK đối thủ 2 lượt; debuff giảm điểm kế tiếp mạnh thêm 25%."],
        ["DIRECTOR'S TRICK", "Chọn VOCAL / RAP / ACT để JAM; đối thủ nhận -20% điểm hệ đó trong 2 hành động tính điểm."],
        ["GRAND FINALE", "Đặt bom trễ; sau 2 hành động của đối thủ: giảm 1.500 điểm ở hệ cao nhất của họ và Rui nhận +1.500 ACT."]
    ],
    shiho: [
        ["ALL OUT STEP", "2 hành động ghi điểm tiếp theo của toàn đội +35%. Không tạo thanh DANCE."],
        ["DANCE SYNC", "3 hành động ghi điểm tiếp theo +45% và đội giành PRIORITY. · CD 2"],
        ["LIME OVERDRIVE", "3 hành động ghi điểm tiếp theo +60%, xóa JAM/MARK bất lợi và tạo 1 lớp chắn debuff. · CD 3"]
    ],
    nene: [
        ["PIXEL DRAIN", "Xóa 1.800 điểm khỏi hệ đang cao nhất của đối thủ. · CD 2"],
        ["ERROR FIELD", "Xóa 1.200 điểm ở cả VOCAL / RAP / ACT; 3 hành động ghi điểm tiếp theo của đối thủ -25%. · CD 4"],
        ["TOTAL SHUTDOWN", "Hệ cao nhất -4.000, hai hệ còn lại -2.000; 2 hành động kế tiếp -40%, hủy PRIORITY của đối thủ. · CD 6"]
    ],
    saki: [
        ["SUNNY ACT", "+2.800 ACT."],
        ["STAGE CHEER", "2 hành động ghi điểm tiếp theo của đồng đội +30%. · CD 2"],
        ["BRIGHT ENCORE", "+1.550 ACT và đội được ưu tiên lượt kế tiếp. · CD 3"]
    ],
    luka: [
        ["LUKA VOICE", "+2.900 VOCAL."],
        ["HARMONY WAVE", "2 hành động ghi điểm tiếp theo của đồng đội +35%. · CD 2"],
        ["RESONANT GUARD", "+1.500 VOCAL và chặn 1 hiệu ứng giảm điểm tiếp theo. · CD 3"]
    ],
    ns_akito: [
        ["FULL THROTTLE", "+4.400 VOCAL; nếu AN cùng đội thì hành động này +30%."],
        ["BURN EVERYTHING", "+3.200 VOCAL; tiêu thụ buff hiện có để tăng sát thương. · CD 3"],
        ["REDLINE FINALE", "+5.800 VOCAL; Akito kế tiếp +100%, có AN sẽ nhận PRIORITY. · CD 4"]
    ],
    ns_an: [
        ["BLUE ASSIST", "Thuần support: 2 hành động đội +45%; Akito kế tiếp +70%."],
        ["PARTNER LINK", "Nếu có Akito, Akito hành động ngay +80%; nếu không, 3 hành động đội +40%. · CD 3"],
        ["NEVER LET GO", "Cleanse, shield 2, 3 hành động +55%, PRIORITY; Akito kế tiếp +100%. · CD 4"]
    ],
    ns_saki: [
        ["EFFECT TUNING", "Cường hóa/kéo dài hiệu ứng đội và thêm 1 shield."],
        ["CHAIN REACTION", "3 hành động +40%, PRIORITY, shield +1. · CD 2"],
        ["STAGE ALCHEMY", "Cleanse, kéo dài hiệu ứng, 3 hành động +55%, shield 2, PRIORITY. · CD 4"]
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



const CHARACTER_RELIC_SETS = {
    radiant:{name:'RADIANT STAGE',two:'VOCAL +15%',four:'VOCAL CRIT → next allied VOCAL +20%',stat:'vocal'},
    encore:{name:'ENCORE',two:'SKILL EFFECT +15%',four:'Buff target → +10% CRIT Rate & +15% CRIT DMG next action',stat:'skillEffect'},
    blue:{name:'BLUE FLOW',two:'RAP +15%',four:'RAP CRIT can gain FLOW; 3 FLOW → +40% CRIT DMG',stat:'rap'},
    spotlight:{name:'SPOTLIGHT',two:'TEMPO +15%',four:'Priority action → +15% Score & +10 Special Energy',stat:'tempo'},
    grand:{name:'GRAND SHOW',two:'ACT +15%',four:'Non-score skill builds SHOW; next scoring skill consumes it',stat:'act'},
    breaker:{name:'STAR BREAKER',two:'CRIT Rate +12%',four:'CRIT DMG +30%; failed CRIT builds next CRIT chance',stat:'critRate'},
    guard:{name:'PERFECT GUARD',two:'Debuff resistance +20%',four:'First score reduction is blocked',stat:'guard'}
};
const CHARACTER_RELIC_SLOTS = ['MIC','OUTFIT','ACCESSORY','CHARM'];
const CHARACTER_EVENT_BASE_STATS = {
    lumina:{critRate:8,critDmg:60,tempo:120},miku:{critRate:5,critDmg:50,tempo:105},miku6:{critRate:5,critDmg:50,tempo:120},
    akito:{critRate:9,critDmg:65,tempo:124},kohane:{critRate:7,critDmg:60,tempo:114},shota:{critRate:7,critDmg:60,tempo:110},ichika:{critRate:5,critDmg:50,tempo:118},rui:{critRate:5,critDmg:50,tempo:115},
    shiho:{critRate:6,critDmg:55,tempo:125},nene:{critRate:7,critDmg:55,tempo:120},saki:{critRate:5,critDmg:50,tempo:110},luka:{critRate:5,critDmg:50,tempo:108}
};
function ensureCharacterRelicData(user){if(!user)return;user.stageGear=Array.isArray(user.stageGear)?user.stageGear:[];user.equipment=user.equipment&&typeof user.equipment==='object'?user.equipment:{}}
function characterRelicMaxLevel(r){return r===5?20:r===4?15:10}
function characterRelicLineValue(g,isMain,i=0){const lv=Math.max(0,Math.min(Number(g.level)||0,characterRelicMaxLevel(Number(g.rarity)||3)));if(isMain)return +(Number(g.mainValue||0)+Number(g.mainGrowth||0)*lv).toFixed(2);const s=g.subs?.[i];return +(Number(s?.value||0)+Number(s?.rollBonus||0)).toFixed(s?.stat==='flatScore'?0:2)}
function getCharacterRelicStats(characterId){
 const user=getCurrentUser();ensureCharacterRelicData(user);const out={flatScore:0,bpPercent:0,critRate:0,critDmg:0,tempo:0,vocalBonus:15,rapBonus:15,actBonus:15,guard:0,sets:{}},eq=user?.equipment?.[characterId]||{};
 Object.values(eq).forEach(gid=>{const g=user.stageGear.find(x=>x&&x.id===gid);if(!g)return;out.sets[g.set]=(out.sets[g.set]||0)+1;
  [{stat:g.main,value:characterRelicLineValue(g,true)},...(g.subs||[]).map((x,i)=>({stat:x.stat,value:characterRelicLineValue(g,false,i)}))].forEach(x=>{if(x.stat==='flatScore')out.flatScore+=x.value;else if(x.stat==='damageVocal')out.vocalBonus+=x.value;else if(x.stat==='damageRap')out.rapBonus+=x.value;else if(x.stat==='damageAct')out.actBonus+=x.value;else out[x.stat]=(out[x.stat]||0)+x.value});
 });
 Object.entries(out.sets).forEach(([set,n])=>{if(n>=2){if(set==='radiant')out.vocalBonus+=15;if(set==='blue')out.rapBonus+=15;if(set==='grand')out.actBonus+=15;if(set==='breaker')out.critRate+=12;if(set==='spotlight')out.tempo+=15}if(n>=4&&set==='breaker')out.critDmg+=30});return out
}
function getCharacterCombatStats(characterId){const b=CHARACTER_EVENT_BASE_STATS[characterId]||{critRate:5,critDmg:50,tempo:100},g=getCharacterRelicStats(characterId);return {...g,critRate:b.critRate+g.critRate,critDmg:b.critDmg+g.critDmg,tempo:b.tempo+g.tempo}}
function relicStatLabel(stat){return ({flatScore:'BP +',bpPercent:'BP %',critRate:'CRIT RATE',critDmg:'CRIT DMG',damageVocal:'VOCAL DMG BONUS',damageRap:'RAP DMG BONUS',damageAct:'ACT DMG BONUS',tempo:'TEMPO',guard:'GUARD'}[stat]||String(stat||'').toUpperCase())}
function relicValueText(g,isMain,i=0){const stat=isMain?g.main:g.subs?.[i]?.stat,v=characterRelicLineValue(g,isMain,i);return `${relicStatLabel(stat)} +${stat==='flatScore'?Math.round(v):v.toFixed(1)+'%'}`}
function renderCharacterRelics(character){
 const user=getCurrentUser();if(!user||!character)return;ensureCharacterRelicData(user);const eq=user.equipment[character.id]||{},inv=user.stageGear,used=new Set(Object.values(user.equipment).flatMap(x=>Object.values(x||{}))),root=$('characterRelicSlots');
 if(root){root.innerHTML=CHARACTER_RELIC_SLOTS.map(slot=>{const g=inv.find(x=>x&&x.id===eq[slot]);return `<div class="character-relic-slot ${g?'filled':''}"><div class="relic-slot-icon">${slot==='MIC'?'🎤':slot==='OUTFIT'?'◇':slot==='ACCESSORY'?'✦':'♢'}</div><div class="relic-slot-copy"><small>${slot}</small>${g?`<strong>${CHARACTER_RELIC_SETS[g.set]?.name||g.set}</strong><span>LV ${g.level||0}/${characterRelicMaxLevel(g.rarity)} · ${relicValueText(g,true)}</span>`:'<strong>EMPTY</strong><span>Equip a relic</span>'}</div>${g?`<button type="button" data-relic-remove="${slot}">×</button>`:''}</div>`}).join('');root.querySelectorAll('[data-relic-remove]').forEach(btn=>btn.onclick=()=>removeCharacterRelic(character.id,btn.dataset.relicRemove))}
 if($('characterRelicCount'))$('characterRelicCount').textContent=`${Object.values(eq).filter(Boolean).length} / 4`;const st=getCharacterCombatStats(character.id);
 if($('characterCombatStats')){const baseBp=getCharacterStat(character),effectiveBp=(Number(baseBp||0)+Number(st.flatScore||0))*(1+Number(st.bpPercent||0)/100);$('characterCombatStats').innerHTML=`<span><em>BASE BP</em><b>${Math.round(baseBp).toLocaleString()}</b></span><span><em>FINAL BP</em><b>${Math.round(effectiveBp).toLocaleString()}</b></span><span><em>CRIT RATE</em><b>${st.critRate.toFixed(1)}%</b></span><span><em>CRIT DMG</em><b>+${st.critDmg.toFixed(0)}%</b></span><span><em>DMG BONUS</em><b>V ${st.vocalBonus.toFixed(0)}% · R ${st.rapBonus.toFixed(0)}% · A ${st.actBonus.toFixed(0)}%</b></span><span><em>TEMPO</em><b>${st.tempo.toFixed(0)}</b></span><span><em>BP FLAT</em><b>+${Math.round(st.flatScore).toLocaleString()}</b></span><span><em>BP BONUS</em><b>+${st.bpPercent.toFixed(1)}%</b></span>`;}
 const setRoot=$('characterSetSummary');if(setRoot){const sets=Object.entries(st.sets||{});setRoot.innerHTML=sets.length?`<small>SET EFFECT</small>${sets.map(([id,n])=>{const q=CHARACTER_RELIC_SETS[id];return `<div class="character-set-line"><strong>${q?.name||id} ${n}/4</strong><span class="${n>=2?'active':''}">${n>=2?'✓':'○'} 2PC · ${q?.two||'—'}</span><span class="${n>=4?'active':''}">${n>=4?'✓':'○'} 4PC · ${q?.four||'—'}</span></div>`}).join('')}`:`<small>SET EFFECT</small><p>Equip 2 or 4 pieces of the same set.</p>`}renderCharacterRelicInventory(character,used)
}
function relicSellValue(g){
 const rarity=Number(g?.rarity)||3,lv=Number(g?.level)||0;
 const base=rarity===5?4500:rarity===4?2200:900;
 return Math.round(base+lv*(rarity===5?650:rarity===4?350:160))
}
function renderCharacterRelicInventory(character,usedSet){
 const user=getCurrentUser();if(!user||!character)return;ensureCharacterRelicData(user);
 const slotFilter=$('characterRelicFilter')?.value||'ALL';
 const rarityFilter=$('characterRelicRarityFilter')?.value||'ALL';
 const search=String($('characterRelicSearch')?.value||'').trim().toLowerCase();
 const sort=$('characterRelicSort')?.value||'NEWEST';
 const used=usedSet||new Set(Object.values(user.equipment).flatMap(x=>Object.values(x||{})));
 let list=user.stageGear.filter(g=>{
   if(!g)return false;
   if(slotFilter!=='ALL'&&g.slot!==slotFilter)return false;
   if(rarityFilter!=='ALL'&&String(g.rarity)!==rarityFilter)return false;
   const setName=String(CHARACTER_RELIC_SETS[g.set]?.name||g.set||'').toLowerCase();
   if(search&&!setName.includes(search))return false;
   return true;
 });
 if(sort==='RARITY')list.sort((a,b)=>(Number(b.rarity)||0)-(Number(a.rarity)||0)||(Number(b.level)||0)-(Number(a.level)||0));
 else if(sort==='LEVEL')list.sort((a,b)=>(Number(b.level)||0)-(Number(a.level)||0)||(Number(b.rarity)||0)-(Number(a.rarity)||0));
 else if(sort==='SET')list.sort((a,b)=>String(CHARACTER_RELIC_SETS[a.set]?.name||a.set).localeCompare(String(CHARACTER_RELIC_SETS[b.set]?.name||b.set)));
 else list=list.slice().reverse();

 const root=$('characterRelicInventory');if(!root)return;
 root.innerHTML=list.length?list.map(g=>{
   const set=CHARACTER_RELIC_SETS[g.set],equipped=used.has(g.id),onThis=(user.equipment[character.id]||{})[g.slot]===g.id;
   const sell=relicSellValue(g);
   return `<article class="character-relic-item ${equipped?'is-equipped':''}">
     <div class="relic-rarity">${'★'.repeat(Number(g.rarity)||1)} <span>${g.slot} · LV ${g.level||0}/${characterRelicMaxLevel(g.rarity)}</span></div>
     <strong>${set?.name||g.set}</strong>
     <b>${relicValueText(g,true)}</b>
     <p>${(g.subs||[]).map((x,i)=>relicValueText(g,false,i)).join('<br>')}</p>
     <div class="relic-item-actions relic-item-actions-v19">
       <button type="button" data-relic-equip="${g.id}" ${equipped&&!onThis?'disabled':''}>${onThis?'EQUIPPED':equipped?'IN USE':'EQUIP'}</button>
       <button type="button" data-relic-level="${g.id}" ${Number(g.level||0)>=characterRelicMaxLevel(g.rarity)?'disabled':''}>+ LEVEL</button>
       <button type="button" class="relic-sell-btn" data-relic-sell="${g.id}" ${equipped?'disabled':''}>SELL · ${sell.toLocaleString()}G</button>
     </div>
   </article>`
 }).join(''):`<div class="character-relic-empty"><b>NO MATCHING RELICS</b><span>Try another slot, rarity, or set name.</span></div>`;
 root.querySelectorAll('[data-relic-equip]').forEach(btn=>btn.onclick=()=>equipCharacterRelic(character.id,btn.dataset.relicEquip));
 root.querySelectorAll('[data-relic-level]').forEach(btn=>btn.onclick=()=>levelCharacterRelic(character,btn.dataset.relicLevel));
 root.querySelectorAll('[data-relic-sell]').forEach(btn=>btn.onclick=()=>sellCharacterRelic(character,btn.dataset.relicSell))
}
function sellCharacterRelic(character,gearId){
 const user=getCurrentUser();if(!user)return;ensureCharacterRelicData(user);
 const gear=user.stageGear.find(g=>g&&g.id===gearId);if(!gear)return;
 const inUse=Object.values(user.equipment).some(slots=>Object.values(slots||{}).includes(gearId));
 if(inUse){showLobbyToast('CAN’T SELL','Remove this relic first.');return}
 const value=relicSellValue(gear);
 if(!confirm(`Sell ${CHARACTER_RELIC_SETS[gear.set]?.name||gear.set} for ${value.toLocaleString()} Gold?`))return;
 user.stageGear=user.stageGear.filter(g=>g.id!==gearId);user.coins=Number(user.coins||0)+value;
 updateUser(user);renderCharacterRelics(character);renderLobby();showLobbyToast('RELIC SOLD',`+${value.toLocaleString()} Gold`)
}
function relicUpgradeCost(g,nextLevel){const r=Number(g.rarity)||3;return Math.round((r===5?1250:r===4?1000:750)*nextLevel)}
function relicRollMilestone(level){return [3,6,9,12,15,20].includes(Number(level))}
function relicRollMultiplier(level){
 const r=Math.random();
 if([3,6,9].includes(level))return r<.30?2:1;
 if([12,15].includes(level))return r<.10?3:1;
 if(level===20)return r<.023?4:1;
 return 1
}
function relicRollRange(stat,rarity){
 const ranges={flatScore:[245,rarity===5?410:rarity===4?340:290],bpPercent:[1.6,rarity===5?3.6:rarity===4?3.0:2.4],critRate:[1.7,rarity===5?3.7:rarity===4?3.1:2.5],critDmg:[3.8,rarity===5?7.8:rarity===4?6.5:5.2],damageVocal:[3.2,rarity===5?6.5:rarity===4?5.4:4.3],damageRap:[3.2,rarity===5?6.5:rarity===4?5.4:4.3],damageAct:[3.2,rarity===5?6.5:rarity===4?5.4:4.3],tempo:[2.2,rarity===5?5.2:rarity===4?4.3:3.4]};
 return ranges[stat]||[1,2]
}
function rollRelicSubIncrease(g,index,multiplier){
 const sub=g.subs[index],range=relicRollRange(sub.stat,Number(g.rarity)||3),raw=range[0]+Math.random()*(range[1]-range[0]),inc=(sub.stat==='flatScore'?Math.round(raw):+raw.toFixed(1))*multiplier;
 sub.rollBonus=Number(sub.rollBonus||0)+inc;sub.rollHistory=Array.isArray(sub.rollHistory)?sub.rollHistory:[];sub.rollHistory.push({level:Number(g.level),amount:inc,multiplier});
 return inc
}
function levelCharacterRelic(character,gearId){
 const user=getCurrentUser();if(!user)return;const g=user.stageGear.find(x=>x.id===gearId);if(!g)return;const max=characterRelicMaxLevel(g.rarity),current=Number(g.level||0);if(current>=max)return;
 const next=current+1,cost=relicUpgradeCost(g,next);if(Number(user.coins||0)<cost){showLobbyToast('NOT ENOUGH GOLD',`Need ${cost.toLocaleString()} Gold`);return}
 user.coins-=cost;g.level=next;g.upgradeHistory=Array.isArray(g.upgradeHistory)?g.upgradeHistory:[];
 let rollText='';
 if(relicRollMilestone(next)){
   const idx=Math.floor(Math.random()*Math.min(4,g.subs?.length||0)),multi=relicRollMultiplier(next),inc=rollRelicSubIncrease(g,idx,multi),sub=g.subs[idx];
   g.upgradeHistory.push({level:next,subIndex:idx,stat:sub.stat,amount:inc,multiplier:multi});
   rollText=`${relicStatLabel(sub.stat)} +${sub.stat==='flatScore'?Math.round(inc):inc.toFixed(1)+'%'}${multi>1?` · ×${multi} BONUS!`:''}`;
 }
 updateUser(user);renderCharacterRelics(character);renderLobby();showLobbyToast(`RELIC +${next}`,rollText||`${cost.toLocaleString()} Gold`)
}
function equipCharacterRelic(characterId,gearId){const user=getCurrentUser();if(!user)return;ensureCharacterRelicData(user);const gear=user.stageGear.find(g=>g&&g.id===gearId);if(!gear)return;Object.entries(user.equipment).forEach(([cid,slots])=>Object.keys(slots||{}).forEach(slot=>{if(slots[slot]===gearId)delete slots[slot]}));user.equipment[characterId]=user.equipment[characterId]||{};user.equipment[characterId][gear.slot]=gearId;updateUser(user);renderCharacterRelics(characterInfoTarget);showLobbyToast('EQUIPPED',`${CHARACTER_RELIC_SETS[gear.set]?.name||gear.set} → ${gear.slot}`)}
function removeCharacterRelic(characterId,slot){const user=getCurrentUser();if(!user)return;ensureCharacterRelicData(user);if(user.equipment?.[characterId])delete user.equipment[characterId][slot];updateUser(user);renderCharacterRelics(characterInfoTarget)}

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
const DANCE_INTRINSIC_REQUIREMENTS = [1,2,3,4,5,5];

const DANCE_INTRINSIC_TREES = {
    shiho: [
        {
            name:"I · SAFE STEP",
            main:"Mỗi 12 giây, 1 MISS được đổi thành SAFE/OKAY và giữ combo.",
            event:"Toàn đội +8% Final Score."
        },
        {
            name:"II · PERFECT FORM",
            main:"Mọi hit trong hit-window đều được tính PERFECT. Vẫn phải bấm đúng lane.",
            event:"Toàn đội +8% CRIT Rate."
        },
        {
            name:"III · SCORE PULSE",
            main:"Toàn bộ note score +15% vĩnh viễn khi Shiho có trong team.",
            event:"Toàn đội +20% CRIT DMG."
        },
        {
            name:"IV · COMBO DRIVE",
            main:"Mỗi 25 combo +10% score, cộng dồn tối đa +30%.",
            event:"Toàn đội +12% TEMPO."
        },
        {
            name:"V · HOLD MASTER",
            main:"HOLD score +35% và phần đuôi HOLD được nới thời gian thả.",
            event:"Toàn đội +15% SKILL EFFECT."
        },
        {
            name:"VI · LIME APOCALYPSE",
            main:"Mỗi 50 combo: 10s score ×1.75, PERFECT FORCE + NO MISS, hồi 400 HP và reward ×1.25.",
            event:"Mỗi hành động ghi điểm thứ 3 ×1.50, giành PRIORITY và xóa 900 điểm ở hệ cao nhất của đối thủ."
        }
    ],

    nene: [
        {
            name:"I · BUFFER SHIELD",
            main:"Mỗi 15 giây, 1 MISS được chuyển thành OKAY, không mất HP và không đứt combo.",
            event:"Hiệu ứng trực tiếp trừ điểm của Nene mạnh hơn 15%."
        },
        {
            name:"II · JUDGEMENT PATCH",
            main:"GREAT → PERFECT; OKAY → GREAT khi bấm đúng hit-window.",
            event:"Toàn bộ điểm ghi được của đối thủ bị giảm 8%."
        },
        {
            name:"III · SCORE EXPLOIT",
            main:"GREAT +20% score; OKAY +40% score.",
            event:"Mỗi hành động ghi điểm thứ 3 của đối thủ bị xóa thêm 500 điểm ở chính hệ vừa ghi."
        },
        {
            name:"IV · CRITICAL ERROR",
            main:"Từ 30 combo: +20% score; từ 60 combo: +30% score.",
            event:"CRIT Rate của toàn đội đối thủ -10%."
        },
        {
            name:"V · RECOVERY LOOP",
            main:"Mỗi 30 combo hồi 180 HP. Các hiệu ứng SYSTEM BREAKER cũng kéo dài hơn.",
            event:"Hiệu ứng trừ điểm trực tiếp mạnh thêm 20%; suppression của Nene kéo dài +1 hành động."
        },
        {
            name:"VI · TOTAL OVERRIDE",
            main:"Mỗi 100 combo: 10s score ×1.85, PERFECT FORCE + NO MISS, hồi 500 HP và reward ×1.30.",
            event:"Mỗi hành động ghi điểm thứ 4 của đối thủ: -900 cả 3 hệ, hủy PRIORITY và hành động kế tiếp -50%."
        }
    ]
};

function getDanceIntrinsicBranchCount(rank){
    const r=Math.max(1,Math.min(5,Number(rank)||1));
    return r>=5 ? 6 : r;
}

function renderDanceIntrinsicBranches(character,p){
    const box=$("danceIntrinsicBox");
    const grid=$("danceIntrinsicGrid");
    const counter=$("danceIntrinsicCount");

    if(!box||!grid||!counter)return;

    const main=(CHARACTER_INFO[character?.id]?.main||character?.main||"").toUpperCase();
    const tree=DANCE_INTRINSIC_TREES[character?.id]||null;
    const isDance=main==="DANCE"&&Array.isArray(tree);

    box.classList.toggle("hidden",!isDance);

    if(!isDance){
        grid.innerHTML="";
        counter.textContent="0 / 6";
        return;
    }

    const rank=Math.max(1,Math.min(5,Number(p?.rank)||1));
    const count=getDanceIntrinsicBranchCount(rank);
    counter.textContent=`${count} / 6 · RANK ${rank}`;

    grid.innerHTML=tree.map((branch,index)=>{
        const req=DANCE_INTRINSIC_REQUIREMENTS[index];
        const unlocked=index<count;
        const finalBranch=index===5;

        const lockText=unlocked
          ? (finalBranch?"FINAL AWAKENED":"UNLOCKED")
          : (finalBranch?"RANK 5 · FINAL":`RANK ${req}`);

        return `
          <article class="dance-intrinsic-node ${unlocked?'unlocked':'locked'} ${finalBranch?'final-branch':''}">
            <div class="dance-intrinsic-node-top">
              <strong>${branch.name}</strong>
              <span>${lockText}</span>
            </div>
            <p><b>MAIN</b> ${branch.main}</p>
            <p><b>EVENT</b> ${branch.event}</p>
          </article>
        `;
    }).join("");
}
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
    const maxUp = $("characterInfoMaxUpgrade");
    up.disabled = p.level >= max;
    if(maxUp) maxUp.disabled = p.level >= max;
    $("characterInfoUpgradeCost").textContent = p.level >= max
        ? (p.rank < CHARACTER_MAX_RANK ? "RANK UP REQUIRED" : "MAX LEVEL")
        : `● ${cost.toLocaleString()} GOLD`;
    if($("characterInfoMaxUpgradeCost")) $("characterInfoMaxUpgradeCost").textContent = p.level >= max
        ? (p.rank < CHARACTER_MAX_RANK ? "CURRENT RANK MAX" : "MAX LEVEL")
        : `● ${getUpgradeToMaxCost(p.level,max).toLocaleString()} GOLD`;
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
    infoStat?.classList.toggle("dance-stat", mainType === "DANCE");
    infoMainType?.classList.toggle("vocal-type", mainType === "VOCAL");
    infoMainType?.classList.toggle("rap-type", mainType === "RAP");
    infoMainType?.classList.toggle("act-type", mainType === "ACT");
    infoMainType?.classList.toggle("dance-type", mainType === "DANCE");
    $("characterInfoSkillName").textContent = d.skillName || "SKILL";
    $("characterInfoSkillDescription").textContent = d.skill || "—";
    renderDanceIntrinsicBranches(character,p);
    renderCharacterEventSkills(character);
    try { renderCharacterRelics(character); } catch (error) { console.warn("character relic render", error); }
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


function upgradeCharacterToMax(){
    const character=characterInfoTarget;
    if(!character)return;
    const user=getCurrentUser();
    if(!user)return;
    initGachaData(user);
    const p=getCharacterProgress(character);
    const max=getCharacterMaxLevel(p.rank);
    if(p.level>=max){
        showLobbyToast("MAX LEVEL",p.rank>=CHARACTER_MAX_RANK?"This character has reached maximum level.":"This character is already at the maximum level for its current Rank.");
        return;
    }
    const cost=getUpgradeToMaxCost(p.level,max);
    const coins=Number(user.coins||0);
    if(coins<cost){
        showLobbyToast("NOT ENOUGH GOLD",`Need ${cost.toLocaleString()} GOLD to reach LV.${max}.`);
        return;
    }
    user.coins=coins-cost;
    p.level=max;
    user.characterProgress[character.id]=p;
    updateUser(user);
    setupLobby(user);
    renderCharacterInfo(character);
    renderMyCharacters();
    renderTeamSelect();
    showLobbyToast("LEVEL MAX",`${character.name} reached LV.${max}.`);
}

$("characterInfoBack")?.addEventListener("click", closeCharacterInfo);
$("characterInfoUpgrade")?.addEventListener("click", upgradeCharacterLevel);
$("characterInfoMaxUpgrade")?.addEventListener("click", upgradeCharacterToMax);
["characterRelicFilter","characterRelicRarityFilter","characterRelicSort"].forEach(id=>$(id)?.addEventListener("change",()=>{if(characterInfoTarget)renderCharacterRelicInventory(characterInfoTarget)}));
$("characterRelicSearch")?.addEventListener("input",()=>{if(characterInfoTarget)renderCharacterRelicInventory(characterInfoTarget)});

$("characterRelicFilter")?.addEventListener("change",()=>{ if(characterInfoTarget)renderCharacterRelicInventory(characterInfoTarget); });
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
    { id:"shota", name:"SHOTA", image:"assets/shota.png", type:"character", rarity:6, rate:0.22222, banner:"shota", main:"VOCAL", base:19780, perLevel:550, skillType:"teamNoMiss", skillDuration:7 },
    // 6★ LIMITED BEGINNING ICHIKA — shares BEGINNING pity with Shota.
    { id:"ichika", name:"ICHIKA", image:"assets/ichika.png", type:"character", rarity:6, rate:0.22222, banner:"shota", main:"RAP", base:22180, perLevel:575, skillType:"starlightChain", skillDuration:8 },
    { id:"touya", name:"TOUYA", image:"assets/beginning_touya.png", type:"character", rarity:6, rate:0.22222, banner:"shota", main:"VOCAL", base:23450, perLevel:610, skillType:"scoreBurst", skillMultiplier:1.45, skillDuration:10 },
    { id:"airi", name:"AIRI", image:"assets/beginning_airi.png", type:"character", rarity:5, rate:5, banner:"shota", main:"ACT", base:15950, perLevel:505, skillType:"scoreBurst", skillMultiplier:1.30, skillDuration:9 },
    { id:"akito4", name:"AKITO", image:"assets/beginning_akito.png", type:"character", rarity:4, rate:15, banner:"shota", main:"ACT", base:11840, perLevel:360, skillType:"scoreBurst", skillMultiplier:1.18, skillDuration:8 },
    // 6★ LIMITED RADIANT BRIDE MIKU — separate ID from the original 5★ Miku.
    { id:"miku6", name:"HATSUNE MIKU", image:"assets/miku1.png", type:"character", rarity:6, rate:0.33333, banner:"character", main:"RAP", base:21250, perLevel:620, rewardMultiplier:1.35 },
    // Original 5★ Miku. Appears as an off-feature character and never resets 6★ pity.
    { id:"miku", name:"HATSUNE MIKU", image:"assets/miku.png", type:"character", rarity:5, rate:5, banner:"both", main:"VOCAL", base:9879, perLevel:654 },
    // Permanent 5★ Rui — available in every CHARACTER banner, never in Card Gacha, and never resets 6★ pity.
    { id:"rui", name:"RUI KAMISHIRO", image:"assets/rui.png", type:"character", rarity:5, rate:5, banner:"all-character", main:"ACT", base:13479, perLevel:490, skillType:"trickStack", skillDuration:8 },
    { id:"akito", name:"AKITO", image:"assets/akito.png", type:"character", rarity:6, rate:0.33333, banner:"akito", main:"ACT", base:19450, perLevel:510, rewardMultiplier:1.35 },

    // START DASH / SPECIAL pools
    { id:"lumina", name:"LUMINA", image:"assets/lumina.png", type:"character", rarity:6, rate:0.33333, banner:"new-player", main:"VOCAL", base:13400, perLevel:245 },
    { id:"shiho", name:"HINOMORI SHIHO", image:"assets/shiho1.png", type:"character", rarity:6, rate:0.111, banner:"dance", main:"DANCE", base:24840, perLevel:645, skillType:"danceOverdrive", skillMultiplier:1.55, skillDuration:10 },
    { id:"nene", name:"KUSANAGI NENE", image:"assets/nene1.png", type:"character", rarity:6, rate:0.111, banner:"dance", main:"DANCE", base:25260, perLevel:635, skillType:"neneSystemBreak", skillMultiplier:1.48, skillDuration:11 },
    { id:"saki", name:"TENMA SAKI", image:"assets/saki1.png", type:"character", rarity:6, rate:0.22222, banner:"shota", main:"ACT", base:21750, perLevel:585, skillType:"scoreBurst", skillMultiplier:1.38, skillDuration:9 },
    { id:"luka", name:"MEGURINE LUKA", image:"assets/luka1.png", type:"character", rarity:6, rate:0.22222, banner:"shota", main:"VOCAL", base:22680, perLevel:600, skillType:"scoreBurst", skillMultiplier:1.40, skillDuration:10 }
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
    if (!Number.isFinite(Number(user.stellarFactor)) || Number(user.stellarFactor) < 0) user.stellarFactor = 0;

    if (!Number.isFinite(Number(user.stellarBooks)) || Number(user.stellarBooks) < 0) {
        user.stellarBooks = 0;
    }

    if (!Number.isFinite(Number(user.dancePity)) || Number(user.dancePity) < 0) {
        user.dancePity = 0;
    }

    if (!Number.isFinite(Number(user.newPlayerBannerPulls)) || Number(user.newPlayerBannerPulls) < 0) {
        user.newPlayerBannerPulls = 0;
    }

    user.newPlayerBannerPulls =
        Math.min(40, Math.floor(Number(user.newPlayerBannerPulls) || 0));

    if (typeof user.newPlayerBannerClosed !== "boolean") {
        user.newPlayerBannerClosed = user.newPlayerBannerPulls >= 40;
    }

    if (user.newPlayerBannerPulls >= 40) {
        user.newPlayerBannerClosed = true;
    }

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
   START DASH / DANCE GACHA · V49
========================================================= */

const NEW_PLAYER_MAX_PULLS = 40;
const NEW_PLAYER_BOOST_START = 20;
const NEW_PLAYER_SIX_STAR_BONUS = 15; // +15 percentage points
const STELLAR_BOOK_TENROLL_CHANCE = .45;

const DANCE_GACHA_COST_BOOKS = 10;
const DANCE_GACHA_PITY = 80;
const SHIHO_BASE_RATE = .111;

const NEW_PLAYER_CHARACTER_IDS = new Set([
    "shota",
    "ichika",
    "touya",
    "lumina",
    "shiho",
    "saki",
    "luka"
]);


function weightedPick(items, weightFn = item => Number(item?.rate) || 0){
    const safe = (items || []).filter(Boolean);

    if (!safe.length) {
        return null;
    }

    const weights =
        safe.map(item => Math.max(0, Number(weightFn(item)) || 0));

    const total =
        weights.reduce((sum, value) => sum + value, 0);

    if (total <= 0) {
        return safe[Math.floor(Math.random() * safe.length)];
    }

    let roll = Math.random() * total;

    for (let i = 0; i < safe.length; i++) {
        roll -= weights[i];

        if (roll <= 0) {
            return safe[i];
        }
    }

    return safe[safe.length - 1];
}


function grantCharacterResult(user, item){
    if (!user || !item || item.type !== "character") {
        return;
    }

    user.myCharacters =
        Array.isArray(user.myCharacters) ? user.myCharacters : [];

    user.characterProgress =
        user.characterProgress &&
        typeof user.characterProgress === "object"
            ? user.characterProgress
            : {};

    const alreadyOwned =
        user.myCharacters.includes(item.id);

    const currentRank =
        alreadyOwned
            ? Math.max(
                1,
                Math.min(
                    5,
                    Number(user.characterProgress?.[item.id]?.rank) || 1
                )
              )
            : 0;

    /*
        6★ duplicate AFTER Rank 5:
        +1 Nhân Tố Tinh Tú.
    */
    if (
        Number(item.rarity || 0) === 6 &&
        alreadyOwned &&
        currentRank >= 5
    ) {
        user.stellarFactor =
            getStellarFactor(user) + 1;

        item.stellarBonus = 1;
        return;
    }

    if (!alreadyOwned) {
        user.myCharacters.push(item.id);

        user.characterProgress[item.id] = {
            rank: 1,
            level: 1
        };
    } else {
        const progress =
            user.characterProgress[item.id] ||
            { rank: 1, level: 1 };

        progress.rank =
            Math.min(
                5,
                Math.max(1, Number(progress.rank) || 1) + 1
            );

        progress.level =
            Math.min(
                getCharacterMaxLevel(progress.rank),
                Math.max(1, Number(progress.level) || 1)
            );

        user.characterProgress[item.id] =
            progress;
    }

    user.selectedCharacterId =
        item.id;
}


function getStellarBooks(user){
    return Math.max(
        0,
        Math.floor(Number(user?.stellarBooks) || 0)
    );
}


function updateStellarBookUI(user = getCurrentUser()){
    if (!user) {
        return;
    }

    const value =
        getStellarBooks(user);

    [
        "stellarBookCount",
        "danceBookCount"
    ].forEach(id => {
        const el = $(id);

        if (el) {
            el.textContent =
                value.toLocaleString("en-US");
        }
    });
}


/*
    Only GEM-BASED 10-rolls can drop books.
    Dance banner itself does NOT call this function.
*/
function grantStellarBooksFromTenRoll(user, amount){
    if (
        !user ||
        Number(amount) !== 10 ||
        Math.random() >= STELLAR_BOOK_TENROLL_CHANCE
    ) {
        return 0;
    }

    const amountWon =
        1 + Math.floor(Math.random() * 3);

    user.stellarBooks =
        getStellarBooks(user) + amountWon;

    return amountWon;
}


function announceStellarBookDrop(amountWon){
    if (!amountWon) {
        return;
    }

    setTimeout(() => {
        showGachaToast(
            "SÁCH TINH TÚ",
            `10-ROLL BONUS → +${amountWon} SÁCH TINH TÚ`
        );
    }, 700);
}


function getNewPlayerSixStarPool(){
    /*
        All normal 6★ cards.
        Event cards are excluded by type === "event".
    */
    const cards =
        GACHA_ITEMS.filter(item =>
            item &&
            item.type !== "event" &&
            Number(item.rarity || 0) === 6
        );

    const characters =
        GACHA_CHARACTERS.filter(item =>
            item &&
            item.type === "character" &&
            Number(item.rarity || 0) === 6 &&
            NEW_PLAYER_CHARACTER_IDS.has(item.id)
        );

    return [
        ...cards,
        ...characters
    ];
}


function getNewPlayerFillerPool(){
    /*
        All existing non-event normal cards below 6★.
        This retains the game's current lower-rarity / JUNK behavior.
    */
    return GACHA_ITEMS.filter(item =>
        item &&
        item.type !== "event" &&
        Number(item.rarity || 0) < 6
    );
}


function rollNewPlayerItem(pullNumber){
    const sixStarPool =
        getNewPlayerSixStarPool();

    const shiho =
        sixStarPool.find(item =>
            item.type === "character" &&
            item.id === "shiho"
        );

    const otherSixStars =
        sixStarPool.filter(item =>
            !(
                item.type === "character" &&
                item.id === "shiho"
            )
        );

    const baseSixStarRate =
        sixStarPool.reduce(
            (sum, item) =>
                sum + Math.max(0, Number(item.rate) || 0),
            0
        );

    const sixStarRate =
        Math.min(
            100,
            baseSixStarRate +
            (
                Number(pullNumber) >= NEW_PLAYER_BOOST_START
                    ? NEW_PLAYER_SIX_STAR_BONUS
                    : 0
            )
        );

    const roll =
        Math.random() * 100;

    /*
        SHIHO must remain a true 0.111% even after the
        general Start Dash 6★ rate-up becomes active.
    */
    if (
        shiho &&
        roll < SHIHO_BASE_RATE
    ) {
        return { ...shiho };
    }

    if (roll < sixStarRate) {
        const selectedSixStar =
            weightedPick(otherSixStars);

        if (selectedSixStar) {
            return {
                ...selectedSixStar
            };
        }
    }

    const filler =
        weightedPick(
            getNewPlayerFillerPool()
        );

    return filler
        ? { ...filler }
        : {
            name: "JUNK",
            image: null,
            rarity: 1,
            type: "junk"
          };
}


function updateNewPlayerBannerUI(user = getCurrentUser()){
    if (!user) {
        return;
    }

    initGachaData(user);

    const pulls =
        Math.min(
            NEW_PLAYER_MAX_PULLS,
            Math.max(
                0,
                Number(user.newPlayerBannerPulls) || 0
            )
        );

    const remaining =
        Math.max(
            0,
            NEW_PLAYER_MAX_PULLS - pulls
        );

    const closed =
        Boolean(
            user.newPlayerBannerClosed ||
            pulls >= NEW_PLAYER_MAX_PULLS
        );

    if ($("newPlayerPullCount")) {
        $("newPlayerPullCount").textContent =
            String(pulls);
    }

    if ($("newPlayerRemainingText")) {
        $("newPlayerRemainingText").textContent =
            closed
                ? "COMPLETE"
                : `${remaining} REMAINING`;
    }

    if ($("newPlayerBannerBadge")) {
        $("newPlayerBannerBadge").textContent =
            closed
                ? "CLOSED"
                : `${remaining} LEFT`;
    }

    if ($("newPlayerProgressFill")) {
        $("newPlayerProgressFill").style.width =
            `${
                Math.min(
                    100,
                    pulls /
                    NEW_PLAYER_MAX_PULLS *
                    100
                )
            }%`;
    }

    if ($("newPlayerBoostText")) {
        $("newPlayerBoostText").textContent =
            pulls >= NEW_PLAYER_BOOST_START
                ? "6★ BOOST ACTIVE"
                : "+15% FROM PULL 20";
    }

    $("newPlayerClosedNotice")
        ?.classList
        .toggle(
            "hidden",
            !closed
        );

    const single =
        $("newPlayerSingleRoll");

    const ten =
        $("newPlayerTenRoll");

    if (single) {
        single.disabled =
            closed ||
            remaining < 1 ||
            gachaBusy;
    }

    if (ten) {
        ten.disabled =
            closed ||
            remaining < 10 ||
            gachaBusy;
    }

    const selector =
        $("newPlayerBannerButton");

    if (selector) {
        selector
            .classList
            .toggle(
                "banner-closed",
                closed
            );

        /*
            Once the result popup is closed after pull 40,
            the Start Dash entry disappears permanently.
        */
        selector.hidden =
            closed &&
            activeGachaBanner !== "new-player";
    }
}


function doNewPlayerGacha(amount){
    if (gachaBusy) {
        return;
    }

    const user =
        getCurrentUser();

    if (!user) {
        showGachaToast(
            "LOGIN REQUIRED",
            "Vui lòng đăng nhập trước khi roll."
        );
        return;
    }

    initGachaData(user);

    const pulls =
        Math.max(
            0,
            Number(user.newPlayerBannerPulls) || 0
        );

    const remaining =
        Math.max(
            0,
            NEW_PLAYER_MAX_PULLS - pulls
        );

    if (
        user.newPlayerBannerClosed ||
        remaining <= 0
    ) {
        showGachaToast(
            "START DASH CLOSED",
            "Banner 40 pull đã hoàn thành."
        );

        updateNewPlayerBannerUI(user);
        return;
    }

    if (
        Number(amount) === 10 &&
        remaining < 10
    ) {
        showGachaToast(
            "ONLY A FEW PULLS LEFT",
            `Chỉ còn ${remaining} pull. Hãy dùng 1 ROLL.`
        );
        return;
    }

    const actualAmount =
        Math.min(
            Number(amount) || 1,
            remaining
        );

    const cost =
        actualAmount *
        GACHA_COST_SINGLE;

    if (
        Number(user.gems || 0) <
        cost
    ) {
        showGachaToast(
            "NOT ENOUGH GEMS",
            `Bạn cần ${cost.toLocaleString()} gems.`
        );
        return;
    }

    user.gems =
        Number(user.gems || 0) -
        cost;

    gachaBusy =
        true;

    [
        singleRoll,
        tenRoll,
        characterSingleRoll,
        characterTenRoll,
        akitoSingleRoll,
        akitoTenRoll,
        shotaSingleRoll,
        shotaTenRoll,
        $("newPlayerSingleRoll"),
        $("newPlayerTenRoll"),
        $("danceTenRoll")
    ].forEach(button => {
        if (button) {
            button.disabled = true;
        }
    });

    const results =
        [];

    for (
        let i = 0;
        i < actualAmount;
        i++
    ) {
        const pullNumber =
            Number(user.newPlayerBannerPulls || 0) +
            1;

        const item =
            rollNewPlayerItem(
                pullNumber
            );

        results.push(item);

        if (
            item.type === "character"
        ) {
            grantCharacterResult(
                user,
                item
            );
        }

        user.newPlayerBannerPulls =
            pullNumber;
    }

    saveGachaCards(
        user,
        results
    );

    if (
        Number(user.newPlayerBannerPulls) >=
        NEW_PLAYER_MAX_PULLS
    ) {
        user.newPlayerBannerPulls =
            NEW_PLAYER_MAX_PULLS;

        user.newPlayerBannerClosed =
            true;
    }

    const booksWon =
        grantStellarBooksFromTenRoll(
            user,
            actualAmount
        );

    updateUser(user);
    cacheUser(user);

    updateGachaGemCount(user);
    updateStellarFactorUI(user);
    updateStellarBookUI(user);
    updateNewPlayerBannerUI(user);

    renderMyCharacters();
    renderMyCards();
    renderTeamSelect();

    showGachaResult(results);
    announceStellarBookDrop(booksWon);
}


function getDanceFillerPool(){
    /*
        The only 6★ available in the Dance banner is Shiho.
        Non-event lower-rarity cards fill the remaining pulls.
    */
    return GACHA_ITEMS.filter(item =>
        item &&
        item.type !== "event" &&
        Number(item.rarity || 0) < 6
    );
}


function updateDanceBannerUI(user = getCurrentUser()){
    if (!user) {
        return;
    }

    initGachaData(user);

    if ($("dancePityCount")) {
        $("dancePityCount").textContent =
            String(
                Math.max(
                    0,
                    Math.min(
                        DANCE_GACHA_PITY,
                        Number(user.dancePity) || 0
                    )
                )
            );
    }

    updateStellarBookUI(user);

    const singleButton = $("danceSingleRoll");
    const tenButton = $("danceTenRoll");

    if (singleButton) {
        singleButton.disabled = gachaBusy || getStellarBooks(user) < 1;
    }

    if (tenButton) {
        tenButton.disabled =
            gachaBusy ||
            getStellarBooks(user) < DANCE_GACHA_COST_BOOKS;
    }
}


function doDanceGacha(amount=10){
    if(gachaBusy)return;
    const user=getCurrentUser();
    if(!user){
        showGachaToast("LOGIN REQUIRED","Vui lòng đăng nhập trước khi roll.");
        return;
    }

    initGachaData(user);
    const attempts=Number(amount)===1?1:10;
    const cost=attempts;

    if(getStellarBooks(user)<cost){
        showGachaToast("NOT ENOUGH SÁCH TINH TÚ",`Bạn cần ${cost} SÁCH TINH TÚ.`);
        return;
    }

    const dancePool=GACHA_CHARACTERS.filter(item=>
        item&&item.type==="character"&&item.main==="DANCE"&&Number(item.rarity||0)===6
    );
    if(!dancePool.length)return;

    const totalRate=dancePool.reduce((sum,item)=>sum+Math.max(0,Number(item.rate)||0),0);

    user.stellarBooks=getStellarBooks(user)-cost;
    gachaBusy=true;

    [singleRoll,tenRoll,characterSingleRoll,characterTenRoll,akitoSingleRoll,akitoTenRoll,shotaSingleRoll,shotaTenRoll,
     $("newPlayerSingleRoll"),$("newPlayerTenRoll"),$("danceSingleRoll"),$("danceTenRoll")]
      .forEach(b=>{if(b)b.disabled=true});

    const displayResults=[];

    for(let i=0;i<attempts;i++){
        user.dancePity=Math.max(0,Number(user.dancePity)||0)+1;
        let item=null;

        if(user.dancePity>=DANCE_GACHA_PITY){
            const pick=weightedPick(dancePool,x=>Math.max(.000001,Number(x.rate)||0))||dancePool[Math.floor(Math.random()*dancePool.length)];
            item={...pick};
        }else if(Math.random()*100<totalRate){
            const pick=weightedPick(dancePool,x=>Math.max(.000001,Number(x.rate)||0));
            if(pick)item={...pick};
        }

        if(item){
            user.dancePity=0;
            displayResults.push(item);
            grantCharacterResult(user,item);
        }else{
            displayResults.push({type:"dance-miss",name:"NO DANCE SIGNAL",rarity:0,image:null});
        }
    }

    updateUser(user);
    cacheUser(user);
    updateStellarFactorUI(user);
    updateStellarBookUI(user);
    updateDanceBannerUI(user);
    renderMyCharacters();
    renderMyCards();
    renderTeamSelect();

    // Luôn hiện popup, kể cả roll hụt.
    showGachaResult(displayResults);
}

/* =========================================================
   END START DASH / DANCE GACHA · V49
========================================================= */

/* =========================================================
   NHÂN TỐ TINH TÚ · STELLAR FACTOR
========================================================= */
const STELLAR_FACTOR_COST = 1;

function getStellarExchangeCost(item, isCharacter){
    return (
        isCharacter &&
        String(item?.main||"").toUpperCase()==="DANCE"
    )
        ? 3
        : STELLAR_FACTOR_COST;
}
const STELLAR_EXCLUDED_CHARACTER_IDS = new Set(["akito", "kohane", "ns_akito", "ns_an", "ns_saki"]); // Event / NIGHT STAGE exclusive characters
let stellarShopTab = "character";

function getStellarFactor(user){
    return Math.max(0, Math.floor(Number(user?.stellarFactor) || 0));
}

function updateStellarFactorUI(user = getCurrentUser()){
    const value = getStellarFactor(user);
    ["stellarFactorCount", "stellarShopFactorCount"].forEach(id => {
        const el = $(id);
        if (el) el.textContent = value.toLocaleString("en-US");
    });
}

function getStellarCharacterCatalog(){
    return CHARACTERS.filter(character =>
        character &&
        character.id !== "mystery" &&
        !character.default &&
        Number(character.rarity || 0) === 6 &&
        !character.eventOnly &&
        !STELLAR_EXCLUDED_CHARACTER_IDS.has(character.id)
    );
}

function getStellarCardCatalog(){
    const seen = new Set();
    return GACHA_ITEMS.filter(item => {
        if (!item || Number(item.rarity || 0) !== 6 || item.type === "event") return false;
        const key = `${item.name}::${item.rarity}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getStellarCharacterRank(user, characterId){
    if (!Array.isArray(user?.myCharacters) || !user.myCharacters.includes(characterId)) return 0;
    return Math.max(1, Math.min(CHARACTER_MAX_RANK, Number(user?.characterProgress?.[characterId]?.rank) || 1));
}

function getStellarCardOwned(user, item){
    return Array.isArray(user?.myCards)
        ? user.myCards.find(card => card?.name === item?.name && Number(card?.rarity || 0) === 6)
        : null;
}

function stellarShopStatus(rank){
    if (!rank) return "NOT OWNED";
    if (rank >= 5) return "MAX RANK";
    return `RANK ${rank} / 5`;
}

function renderStellarShop(){
    const user = getCurrentUser();
    const grid = $("stellarShopGrid");
    if (!user || !grid) return;
    initGachaData(user);
    updateStellarFactorUI(user);

    $("stellarCharacterTab")?.classList.toggle("active", stellarShopTab === "character");
    $("stellarCardTab")?.classList.toggle("active", stellarShopTab === "card");

    const factor = getStellarFactor(user);
    const items = stellarShopTab === "character" ? getStellarCharacterCatalog() : getStellarCardCatalog();

    grid.innerHTML = items.map(item => {
        const isCharacter = stellarShopTab === "character";
        const ownedCard = isCharacter ? null : getStellarCardOwned(user, item);
        const rank = isCharacter
            ? getStellarCharacterRank(user, item.id)
            : ownedCard ? Math.max(1, Math.min(5, Number(ownedCard.rank) || 1)) : 0;
        const maxed = rank >= 5;
        const exchangeCost = getStellarExchangeCost(item, isCharacter);
        const disabled = maxed || factor < exchangeCost;
        const main = isCharacter ? (item.main || "-") : (CARD_INFO_DATA[item.name]?.main || "CARD");
        const image = item.image || "";
        const key = isCharacter ? item.id : item.name;
        return `
            <article class="stellar-shop-item ${maxed ? "maxed" : ""}">
                <div class="stellar-shop-item-top">
                    <span>★★★★★★</span>
                    <b>${isCharacter ? "CHARACTER" : "CARD"}</b>
                </div>
                <div class="stellar-shop-art">
                    ${image ? `<img src="${image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">` : ""}
                    <div class="stellar-shop-art-fallback" ${image ? 'style="display:none"' : ''}>✦</div>
                </div>
                <div class="stellar-shop-copy">
                    <small>${main}</small>
                    <strong>${item.name}</strong>
                    <span>${stellarShopStatus(rank)}</span>
                </div>
                <button
                    type="button"
                    class="stellar-shop-exchange"
                    data-stellar-kind="${isCharacter ? "character" : "card"}"
                    data-stellar-key="${String(key).replace(/&/g,"&amp;").replace(/\"/g,"&quot;")}"
                    ${disabled ? "disabled" : ""}
                >
                    ${maxed ? "MAX RANK" : `<span><img src="assets/nttt.png" alt="" onerror="this.style.display='none'">✦</span> EXCHANGE · ${exchangeCost}`}
                </button>
            </article>`;
    }).join("") || `<div class="stellar-shop-empty">NO EXCHANGE ITEMS</div>`;

    grid.querySelectorAll("[data-stellar-kind][data-stellar-key]").forEach(button => {
        button.addEventListener("click", () => exchangeStellarItem(button.dataset.stellarKind, button.dataset.stellarKey));
    });
}

function exchangeStellarItem(kind, key){
    const user = getCurrentUser();
    if (!user) return;
    initGachaData(user);

    let exchangeCost =
        STELLAR_FACTOR_COST;

    let characterForCost =
        null;

    if (kind === "character") {
        characterForCost =
            getStellarCharacterCatalog()
                .find(item => item.id === key) ||
            null;

        if (!characterForCost) {
            return;
        }

        exchangeCost =
            getStellarExchangeCost(
                characterForCost,
                true
            );
    }

    if (
        getStellarFactor(user) <
        exchangeCost
    ) {
        showGachaToast(
            "NOT ENOUGH NHÂN TỐ TINH TÚ",
            `Bạn cần ${exchangeCost} NHÂN TỐ TINH TÚ để đổi.`
        );
        return;
    }

    if (kind === "character"){
        const character = characterForCost;
        const rank = getStellarCharacterRank(user, character.id);
        if (rank >= 5) return;

        user.myCharacters = Array.isArray(user.myCharacters) ? user.myCharacters : [];
        user.characterProgress = user.characterProgress && typeof user.characterProgress === "object" ? user.characterProgress : {};

        if (!user.myCharacters.includes(character.id)){
            user.myCharacters.push(character.id);
            user.characterProgress[character.id] = { rank:1, level:1 };
        } else {
            const p = user.characterProgress[character.id] || { rank:1, level:1 };
            p.rank = Math.min(5, Math.max(1, Number(p.rank) || 1) + 1);
            p.level = Math.min(getCharacterMaxLevel(p.rank), Math.max(1, Number(p.level) || 1));
            user.characterProgress[character.id] = p;
        }
    } else if (kind === "card"){
        const item = getStellarCardCatalog().find(card => card.name === key);
        if (!item) return;
        user.myCards = Array.isArray(user.myCards) ? user.myCards : [];
        const existing = getStellarCardOwned(user, item);
        if (existing && Number(existing.rank || 1) >= 5) return;

        if (!existing){
            user.myCards.push({
                id:`stellar-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                name:item.name,
                image:item.image || null,
                rarity:6,
                type:"normal",
                rank:1,
                level:1,
                obtainedAt:Date.now()
            });
        } else {
            existing.rank = Math.min(5, Math.max(1, Number(existing.rank) || 1) + 1);
            existing.obtainedAt = Date.now();
        }
    } else {
        return;
    }

    user.stellarFactor = Math.max(0, getStellarFactor(user) - exchangeCost);
    updateUser(user);
    cacheUser(user);
    updateStellarFactorUI(user);
    renderStellarShop();
    renderMyCharacters();
    renderMyCards();
    renderTeamSelect();

    showGachaToast("STELLAR EXCHANGE COMPLETE", `Đã đổi ${kind === "character" ? "CHARACTER" : "CARD"} 6★ bằng ${exchangeCost} NHÂN TỐ TINH TÚ.`);
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

            updateStellarFactorUI(user);
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

    if(item.type==="dance-miss")tile.classList.add("dance-miss-result");

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
        item.type==="dance-miss"
            ? "DANCE SIGNAL LOST"
            : "★".repeat(item.rarity);


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

    } else if(item.type==="dance-miss") {

        imageArea.innerHTML =
            `<div class="dance-miss-mark"><span>◇</span><small>NO REWARD</small></div>`;

    } else {

        imageArea.innerHTML =
            `<div class="junk-mark">?</div>`;
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

    if(Number(item.stellarBonus||0)>0){
        const bonus=document.createElement("div");
        bonus.className="stellar-result-bonus";
        bonus.innerHTML=`<img src="assets/nttt.png" alt="" onerror="this.style.display='none'"> <span>+${Number(item.stellarBonus)} NHÂN TỐ TINH TÚ</span>`;
        tile.appendChild(bonus);
    }

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

    const stellarGain=results.reduce((sum,item)=>sum+Math.max(0,Number(item.stellarBonus)||0),0);
    resultsCount.textContent =
        (results.length === 1 ? "1 ATTEMPT" : "10x ATTEMPTS")
        + (stellarGain>0 ? ` · +${stellarGain} NTTT` : "");


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
    const featuredPool=GACHA_CHARACTERS.filter(x=>x.banner===banner && x.rarity===6);
    const featured=featuredPool[0];
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
            const pityPick=featuredPool[Math.floor(Math.random()*featuredPool.length)] || featured;
            item={...pityPick};
            user[pityKey]=0;
        } else {
            if(banner==="shota") {
                const beginRoll=Math.random()*100;
                if(beginRoll < 5) item={...GACHA_CHARACTERS.find(x=>x.id==="airi")};
                else if(beginRoll < 20) item={...GACHA_CHARACTERS.find(x=>x.id==="akito4")};
            }
            if(!item){
                const offFiveRoll = Math.random()*100;
                if(offFiveRoll < 5) item={...GACHA_CHARACTERS.find(x=>x.id==="miku")};
                else if(offFiveRoll < 10) item={...GACHA_CHARACTERS.find(x=>x.id==="rui")};
            }
        }
        if(!item){
            const totalFeaturedRate=featuredPool.reduce((sum,x)=>sum+Number(x.rate||0),0);
            if(Math.random()*100<totalFeaturedRate){
                item={...(featuredPool[Math.floor(Math.random()*featuredPool.length)] || featured)};
                user[pityKey]=0;
            }
        }
        if(!item){
            item={id:`character-miss-${Date.now()}-${i}`,name:"NO CHARACTER",image:null,rarity:1,type:"character-miss"};
        }
        results.push(item);
        if(item.type==="character"){
            grantCharacterResult(
                user,
                item
            );
        }
    }
    const booksWon =
        grantStellarBooksFromTenRoll(
            user,
            amount
        );

    updateUser(user);
    renderMyCharacters();
    updateGachaGemCount(user);
    updateCharacterPityDisplay(user);
    updateStellarFactorUI(user);
    updateStellarBookUI(user);

    showGachaResult(results);
    announceStellarBookDrop(booksWon);
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

    const booksWon =
        grantStellarBooksFromTenRoll(
            user,
            amount
        );

    // Một lần sync cuối cùng có cả pity + history + cards.
    updateUser(user);
    updateGachaGemCount(user);
    updateGachaPityDisplay(user);
    updateStellarBookUI(user);

    if (cardResult && cardResult.duplicateGems > 0) {
        setTimeout(() => {
            showGachaToast(
                "DUPLICATE CARD",
                `MAX RANK DUPLICATE → +${cardResult.duplicateGems} GEMS`
            );
        }, 800);
    }

    showGachaResult(results);
    announceStellarBookDrop(booksWon);
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
$("dailyLiveButton")?.addEventListener("click", openDailyLive);
$("dailyLiveClose")?.addEventListener("click", closeDailyLive);
$("dailyLiveClaimAll")?.addEventListener("click", claimAllDailyLive);
$("dailyLiveOverlay")?.addEventListener("click", event => { if(event.target === $("dailyLiveOverlay")) closeDailyLive(); });
// Gems / Gold are reward currencies now; the old debug/shop + buttons stay locked.
if($("gemPlus")){ $("gemPlus").disabled=true; $("gemPlus").onclick=null; }
if($("coinPlus")){ $("coinPlus").disabled=true; $("coinPlus").onclick=null; }



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

        updateNewPlayerBannerUI(
            getCurrentUser()
        );

        updateDanceBannerUI(
            getCurrentUser()
        );

        if (
            activeGachaBanner === "new-player" &&
            getCurrentUser()?.newPlayerBannerClosed
        ) {
            setGachaBanner("items");
        }

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
    const user =
        getCurrentUser();

    if (
        name === "new-player" &&
        user
    ) {
        initGachaData(user);

        if (user.newPlayerBannerClosed) {
            name = "items";
        }
    }

    activeGachaBanner =
        name;

    $("newPlayerBannerButton")?.classList.toggle("active", name === "new-player");
    $("shotaBannerButton")?.classList.toggle("active", name === "shota");
    $("currentBannerButton")?.classList.toggle("active", name === "items");
    $("characterBannerButton")?.classList.toggle("active", name === "character");
    $("akitoBannerButton")?.classList.toggle("active", name === "akito");
    $("danceBannerButton")?.classList.toggle("active", name === "dance");
    $("stellarShopBannerButton")?.classList.toggle("active", name === "stellar-shop");

    $("newPlayerGachaContent")?.classList.toggle("hidden", name !== "new-player");
    $("shotaGachaContent")?.classList.toggle("hidden", name !== "shota");
    $("itemGachaContent")?.classList.toggle("hidden", name !== "items");
    $("characterGachaContent")?.classList.toggle("hidden", name !== "character");
    $("akitoGachaContent")?.classList.toggle("hidden", name !== "akito");
    $("danceGachaContent")?.classList.toggle("hidden", name !== "dance");
    $("stellarShopContent")?.classList.toggle("hidden", name !== "stellar-shop");

    updateGachaPityDisplay(user);
    updateCharacterPityDisplay(user);
    updateStellarFactorUI(user);
    updateStellarBookUI(user);
    updateNewPlayerBannerUI(user);
    updateDanceBannerUI(user);

    if (name === "stellar-shop") {
        renderStellarShop();
    }

    if (name === "shota") {
        startBeginningSlideshow();
    } else {
        stopBeginningSlideshow();
    }

    if (name === "items") {
        startCardGachaSlideshow();
    } else {
        stopCardGachaSlideshow();
    }
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

$("newPlayerBannerButton")?.addEventListener(
    "click",
    () => {
        showScreen("gachaScreen");
        setGachaBanner("new-player");
    }
);

$("danceBannerButton")?.addEventListener(
    "click",
    () => {
        showScreen("gachaScreen");
        setGachaBanner("dance");
    }
);

$("newPlayerSingleRoll")?.addEventListener(
    "click",
    () => doNewPlayerGacha(1)
);

$("newPlayerTenRoll")?.addEventListener(
    "click",
    () => doNewPlayerGacha(10)
);

$("danceSingleRoll")?.addEventListener("click",()=>doDanceGacha(1));
$("danceTenRoll")?.addEventListener("click",()=>doDanceGacha(10));

$("shotaBannerButton")?.addEventListener("click", openShotaBanner);
$("characterBannerButton")?.addEventListener("click", openCharacterBanner);
$("akitoBannerButton")?.addEventListener("click", openAkitoBanner);
$("stellarShopBannerButton")?.addEventListener("click",()=>{ showScreen("gachaScreen"); setGachaBanner("stellar-shop"); });
$("stellarCharacterTab")?.addEventListener("click",()=>{ stellarShopTab="character"; renderStellarShop(); });
$("stellarCardTab")?.addEventListener("click",()=>{ stellarShopTab="card"; renderStellarShop(); });

$("shotaSingleRoll")?.addEventListener("click", () => doCharacterGacha(1));
$("shotaTenRoll")?.addEventListener("click", () => doCharacterGacha(10));
$("akitoSingleRoll")?.addEventListener("click", () => doCharacterGacha(1));
$("akitoTenRoll")?.addEventListener("click", () => doCharacterGacha(10));


/* =========================================================
   CARD GACHA FEATURED SLIDESHOW
========================================================= */
let cardGachaSlideIndex = 0;
let cardGachaSlideTimer = null;

function showCardGachaSlide(index) {
    const slides = [...document.querySelectorAll("[data-card-gacha-slide]")];
    const dots = [...document.querySelectorAll("[data-card-gacha-dot]")];
    if (!slides.length) return;

    cardGachaSlideIndex = (Number(index) + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === cardGachaSlideIndex));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === cardGachaSlideIndex));
}

function startCardGachaSlideshow() {
    clearInterval(cardGachaSlideTimer);
    showCardGachaSlide(cardGachaSlideIndex);
    cardGachaSlideTimer = setInterval(() => showCardGachaSlide(cardGachaSlideIndex + 1), 3400);
}

function stopCardGachaSlideshow() {
    clearInterval(cardGachaSlideTimer);
    cardGachaSlideTimer = null;
}

$("cardGachaPrev")?.addEventListener("click", () => {
    showCardGachaSlide(cardGachaSlideIndex - 1);
    startCardGachaSlideshow();
});
$("cardGachaNext")?.addEventListener("click", () => {
    showCardGachaSlide(cardGachaSlideIndex + 1);
    startCardGachaSlideshow();
});
document.querySelectorAll("[data-card-gacha-dot]").forEach(dot => {
    dot.addEventListener("click", () => {
        showCardGachaSlide(Number(dot.dataset.cardGachaDot || 0));
        startCardGachaSlideshow();
    });
});

/* =========================================================
   BEGINNING FEATURED SLIDESHOW
========================================================= */
let beginningSlideIndex = 0;
let beginningSlideTimer = null;
function showBeginningSlide(index){
    const slides=[...document.querySelectorAll("[data-beginning-slide]")];
    const dots=[...document.querySelectorAll("[data-beginning-dot]")];
    if(!slides.length)return;
    beginningSlideIndex=(Number(index)+slides.length)%slides.length;
    slides.forEach((slide,i)=>slide.classList.toggle("active",i===beginningSlideIndex));
    dots.forEach((dot,i)=>dot.classList.toggle("active",i===beginningSlideIndex));
}
function startBeginningSlideshow(){
    clearInterval(beginningSlideTimer);
    showBeginningSlide(beginningSlideIndex);
    beginningSlideTimer=setInterval(()=>showBeginningSlide(beginningSlideIndex+1),3600);
}
function stopBeginningSlideshow(){clearInterval(beginningSlideTimer);beginningSlideTimer=null}
$("beginningPrev")?.addEventListener("click",()=>{showBeginningSlide(beginningSlideIndex-1);startBeginningSlideshow()});
$("beginningNext")?.addEventListener("click",()=>{showBeginningSlide(beginningSlideIndex+1);startBeginningSlideshow()});
document.querySelectorAll("[data-beginning-dot]").forEach(dot=>dot.addEventListener("click",()=>{showBeginningSlide(Number(dot.dataset.beginningDot||0));startBeginningSlideshow()}));

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
   EXPLICIT LOG OUT
   Separate from clearAuth(): clearAuth is intentionally blocked elsewhere
   to prevent random errors from throwing the player back to Login.
========================================================= */
function openLogoutConfirm(){
    const overlay=$("logoutOverlay");
    if(!overlay)return;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden","false");
}

function closeLogoutConfirm(){
    const overlay=$("logoutOverlay");
    if(!overlay)return;
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden","true");
}

async function performExplicitLogout(){
    const confirmBtn=$("logoutConfirm");
    if(confirmBtn){
        confirmBtn.disabled=true;
        confirmBtn.textContent="LOGGING OUT...";
    }

    try{
        await signOutToTitleScreen();
        closeLogoutConfirm();
    }catch(error){
        console.warn("Explicit logout failed:", error);
        showTitleScreen(null);
    }finally{
        if(confirmBtn){
            confirmBtn.disabled=false;
            confirmBtn.textContent="LOG OUT";
        }
    }
}

$("logoutButton")?.addEventListener("click",openLogoutConfirm);
$("logoutCancel")?.addEventListener("click",closeLogoutConfirm);
$("logoutConfirm")?.addEventListener("click",performExplicitLogout);
$("logoutOverlay")?.addEventListener("click",event=>{
    if(event.target===$("logoutOverlay"))closeLogoutConfirm();
});
document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!$("logoutOverlay")?.classList.contains("hidden"))closeLogoutConfirm();
});


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

        // Consume gameplay rewards/rank FIRST. Previously a concurrent remote read
        // could repaint Rank 1 over the freshly earned local Rank/XP.
        const mergedGameplayResult = mergePendingRhythmProgress(currentUser);
        if (mergedGameplayResult) updateUser(currentUser);

        setupLobby(currentUser);

        if(returnPage==="lobby"){
            // Internal page return (Trials -> Lobby).
            // Do NOT replay startup splash or CLICK FOR PLAY.
            showScreen("lobbyScreen");
            setupLobby(currentUser);

            try{
                history.replaceState(null,"",location.pathname);
            }catch(_){}

            if(mergedGameplayResult){
                userSyncChain.finally(()=>{
                    refreshCurrentUser().then(remote=>{
                        if(remote){
                            cacheUser(remote);
                            setupLobby(remote);
                        }
                    }).catch(()=>{});
                });
            }else{
                loadRemoteUser().then(remote=>{
                    cacheUser(remote);
                    setupLobby(remote);
                }).catch(()=>{});
            }

            return;
        }

        if(returnPage==="event"){
            openEventScreen();
            if(mergedGameplayResult){
                userSyncChain.finally(()=>refreshCurrentUser().then(remote=>{if(remote){setupLobby(remote);renderEventPage();}}));
            }else{
                loadRemoteUser().then(remote=>{cacheUser(remote);setupLobby(remote);renderEventPage();}).catch(()=>{});
            }
            return;
        }

        if(returnPage==="nowplay"){
            renderNowPlay();
            showScreen("nowPlayScreen");
            // Do not immediately overwrite the earned rank with an older server snapshot.
            if(mergedGameplayResult){
                userSyncChain.finally(()=>refreshCurrentUser().then(remote=>{if(remote){setupLobby(remote);updateNowPlayPlayer();}}));
            }else{
                loadRemoteUser().then(remote=>{cacheUser(remote);setupLobby(remote);updateNowPlayPlayer();}).catch(()=>{});
            }
            return;
        }

        // Plain app launch: black logo splash first, then TITLE.
        // return=event / return=nowplay above still bypasses the splash.
        showStartupSplashThenTitle(currentUser);

        if(mergedGameplayResult){
            userSyncChain.finally(()=>refreshCurrentUser().then(remote=>{
                if(remote){
                    cacheUser(remote);
                    updateTitleScreenAccountState(remote);
                }
            }));
        }else{
            loadRemoteUser().then(remote=>{
                cacheUser(remote);
                updateTitleScreenAccountState(remote);
            }).catch(()=>{});
        }
        return;
    }

    showStartupSplashThenTitle(null);

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
