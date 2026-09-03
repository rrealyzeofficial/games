/* =========================================================
   REALYZE!!
   Main JavaScript
========================================================= */


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   MOBILE PC-CANVAS SCALER
   The mobile version keeps the same 1440px desktop composition.
   In landscape it scales the whole screen instead of reflowing cards/art.
========================================================= */
(function initMobileDesktopCanvas() {
    const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

    function applyMobileDesktopScale() {
        if (!isMobile()) {
            document.body?.classList.remove("realyze-mobile-pc");
            document.body?.style.removeProperty("--realyze-mobile-scale");
            return;
        }

        const sw = Math.max(1, Number(window.screen?.width || window.innerWidth));
        const sh = Math.max(1, Number(window.screen?.height || window.innerHeight));
        const landscapeWidth = Math.max(sw, sh);
        const scale = Math.min(landscapeWidth / 1440, 1);

        document.body.classList.add("realyze-mobile-pc");
        document.body.style.setProperty("--realyze-mobile-scale", String(scale));
    }

    window.addEventListener("resize", applyMobileDesktopScale, { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(applyMobileDesktopScale, 80), { passive: true });
    document.addEventListener("DOMContentLoaded", applyMobileDesktopScale, { once: true });
    applyMobileDesktopScale();
})();


function getUsers() {
    try {
        return JSON.parse(
            localStorage.getItem("realyze_users") || "{}"
        );
    } catch (error) {
        console.error("Cannot read users:", error);
        return {};
    }
}


function saveUsers(users) {
    localStorage.setItem(
        "realyze_users",
        JSON.stringify(users)
    );
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


function registerUser(
    username,
    password,
    confirmPassword
) {

    const users = getUsers();


    if (!validUsername(username)) {

        return {
            success: false,
            text:
                "ID Name phải từ 3–20 ký tự và chỉ dùng A-Z, 0-9 hoặc _."
        };
    }


    if (users[username]) {

        return {
            success: false,
            text:
                "ID Name này đã tồn tại. Hãy chọn ID Name khác."
        };
    }


    if (password.length < 6) {

        return {
            success: false,
            text:
                "Password phải có ít nhất 6 ký tự."
        };
    }


    if (
        password !==
        confirmPassword
    ) {

        return {
            success: false,
            text:
                "Mật khẩu xác nhận không khớp."
        };
    }


    users[username] = {
    username,
    password,
    createdAt: Date.now(),

    gems: 5000,
    coins: 10000,
    tickets: 10,

    rank: 1,

    /* =========================
       GACHA DATA
    ========================= */

    gachaPity: 0,

    gachaHistory: [],

    /* collections */
    myCards: [],
    myCharacters: [],
    selectedCharacterId: "mystery",
    characterPity: 0
};



    saveUsers(users);


    return {
        success: true
    };
}


function loginUser(
    username,
    password
) {

    const users = getUsers();


    if (!users[username]) {

        return {
            success: false,
            text:
                "ID Name hoặc Password không đúng."
        };
    }


    if (
        users[username].password !==
        password
    ) {

        return {
            success: false,
            text:
                "ID Name hoặc Password không đúng."
        };
    }


    return {
        success: true,
        user:
            users[username]
    };
}


/* =========================================================
   AUTH SUBMIT
========================================================= */

authForm.addEventListener(
    "submit",
    (event) => {

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
                registerUser(
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
            loginUser(
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

function getCurrentUser() {

    const username =
        localStorage.getItem(
            "realyze_current_user"
        );


    if (!username) {
        return null;
    }


    const users =
        getUsers();


    return users[username] || null;
}


function updateUser(user) {

    if (!user) return;


    const users =
        getUsers();


    users[user.username] =
        user;


    saveUsers(users);
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

function setupLobby(user) {

    if (!user) return;


    $("lobbyUsername")
        .textContent =
        user.username;


    $("welcomeName")
        .textContent =
        user.username;


    $("playerRank")
        .textContent =
        user.rank || 1;


    $("gemCount")
        .textContent =
        user.gems ?? 5000;


    $("coinCount")
        .textContent =
        user.coins ?? 10000;


    $("ticketCount")
        .textContent =
        user.tickets ?? 10;


    $("gachaGemCount")
        .textContent =
        user.gems ?? 5000;


    loadAvatar(
        user.username
    );
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
        highlight: "assets/song-02.mp3",
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
    0: "assets/song-01_[cut_98sec].mp3"
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

    const username =
        user.username || "PLAYER";

    const rank =
        Number(user.rank || 1);

    $("nowPlayUsername").textContent =
        username;

    $("nowPlayRank").textContent =
        rank;

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
                    <div class="song-select-stars">
                        ${stars}
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

            list.appendChild(button);

        }
    );

    $("songCountLabel").textContent =
        String(NOW_PLAY_SONGS.length).padStart(2, "0");
}


function renderNowPlayDetail() {

    const song =
        NOW_PLAY_SONGS[selectedNowPlaySong];

    if (!song) return;

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
    }
];


let selectedCharacterId = "mystery";

let selectedTeamCards = [
    null,
    null,
    null,
    null
];

let selectedTeamCardSlot = 0;


/* =========================================================
   OPEN TEAM SELECT
========================================================= */

function openTeamSelect() {

    renderTeamSelect();

    showScreen(
        "teamSelectScreen"
    );

}


/* =========================================================
   CHARACTER
========================================================= */

function getSelectedCharacter() {

    const user = getCurrentUser();
    if (user) {
        initGachaData(user);
        selectedCharacterId = user.selectedCharacterId || "mystery";
    }

    const character =
        CHARACTERS.find(
            character => character.id === selectedCharacterId
        );

    if (character && isCharacterOwned(character.id)) {
        return character;
    }

    selectedCharacterId = "mystery";
    return CHARACTERS.find(character => character.id === "mystery") || CHARACTERS[0];

}


function renderSelectedCharacter() {

    const character = getSelectedCharacter();

    const name = $("selectedCharacterName");
    const visual = $("selectedCharacterVisual");
    const rarity = $("selectedCharacterRarity");
    const rank = $("selectedCharacterRank");
    const level = $("selectedCharacterLevel");

    const isRealCharacter = character && character.id !== "mystery";
    const progress = isRealCharacter
        ? getCharacterProgress(character)
        : { rank: 1, level: 1 };

    const maxLevel = isRealCharacter
        ? getCharacterMaxLevel(progress.rank)
        : 60;

    const stat = isRealCharacter
        ? getCharacterStat(character)
        : 0;

    const data = isRealCharacter
        ? (CHARACTER_INFO[character.id] || {})
        : {};

    if (name) name.textContent = character.name;
    if (rarity) rarity.textContent = isRealCharacter ? getCardStars(Number(character.rarity || 6)) : "★";
    if (rank) rank.textContent = isRealCharacter ? `RANK ${progress.rank}` : "DEFAULT";
    if (level) {
        level.textContent = isRealCharacter ? `LV. ${progress.level} / ${maxLevel}` : "DEFAULT";
    }

    if (!visual) return;

    if (character.image) {
        visual.className =
            "character-preview-visual character-owned-visual";
        visual.innerHTML = `
            <img src="${character.image}" alt="${character.name}">
        `;
    } else {
        visual.className =
            "character-preview-visual mystery-character";
        visual.innerHTML = `<span>?</span>`;
    }
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
        container.innerHTML = `
            <div class="available-character-empty">
                NO CHARACTERS OWNED YET
            </div>`;
        return;
    }

    owned.forEach(character => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "available-character my-card";
        button.dataset.rarity = Number(character.rarity ?? 6);
        if (character.id === user.selectedCharacterId) button.classList.add("active", "character-selected");

        button.innerHTML = `
            <div class="my-card-top">
                <span class="my-card-rarity">${getCardStars(Number(character.rarity ?? 6))}</span>
                <span class="my-card-rank">CHARACTER</span>
                <span class="my-card-type">LIMITED</span>
            </div>
            <div class="my-card-image my-character-image">
                ${character.image
                    ? `<img src="${character.image}" alt="${character.name}">`
                    : `<div class="my-card-fallback">✦</div>`}
            </div>
            <div class="my-card-info">
                <div class="my-card-name">${character.name}</div>
                <div class="my-card-obtained">${character.id === user.selectedCharacterId ? "CURRENT CHARACTER" : "OWNED"}</div>
            </div>`;

        button.addEventListener("click", () => {
            selectedCharacterId = character.id;
            user.selectedCharacterId = character.id;
            updateUser(user);
            renderSelectedCharacter();
            renderAvailableCharacters();
            renderMyCharacters();
            $("characterSelectOverlay")?.classList.add("hidden");
        });

        container.appendChild(button);
    });
}

/* =========================================================
   TEAM RENDER
========================================================= */

function renderTeamSelect() {

    const user = getCurrentUser();
    if (user) {
        initGachaData(user);
        const saved = user.selectedCharacterId;
        if (saved && isCharacterOwned(saved)) {
            selectedCharacterId = saved;
        } else {
            selectedCharacterId = "mystery";
        }
    }

    const song =
        NOW_PLAY_SONGS[
            selectedNowPlaySong
        ];


    if (song) {

        const songName =
            $("teamSongName");

        const difficulty =
            $("teamSongDifficulty");


        if (songName) {

            songName.textContent =
                song.name;

        }


        if (difficulty) {

            difficulty.textContent =
                selectedNowPlayDifficulty;

        }

    }


    renderSelectedCharacter();

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
    return Array.isArray(user.myCards) ? user.myCards.filter(card => Number(card.rarity || 0) >= 4) : [];
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
        const slot = document.createElement("button");
        slot.type = "button";
        slot.className = `team-card-slot ${card ? "selected" : "empty"}`;
        slot.innerHTML = card ? `
            <span class="team-card-slot-number">SLOT ${String(i + 1).padStart(2,"0")}</span>
            <div class="team-card-slot-art">${card.image ? `<img src="${card.image}" alt="${card.name}">` : `<span>✦</span>`}</div>
            <div class="team-card-slot-name">${card.name}</div>
            <div class="team-card-slot-rank">RANK ${Number(card.rank || 1)} · LV.${Number(card.level || 1)}</div>
        ` : `
            <span class="team-card-slot-number">SLOT ${String(i + 1).padStart(2,"0")}</span>
            <div class="team-card-slot-art"><span>+</span></div>
            <div class="team-card-slot-name">CHOOSE CARD</div>
            <div class="team-card-slot-rank">EMPTY</div>
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
        const usedElsewhere = selectedTeamCards.some((selected, idx) => selected && selected.id === card.id && idx !== selectedTeamCardSlot);
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
    const count = getSelectedTeamCardCount();
    const countEl = $("teamCardCount");
    const progress = $("teamSelectionProgress");
    const message = $("teamSelectionMessage");
    const ready = $("teamReadyText");
    const start = $("startTeamPlayButton");

    if (countEl) countEl.textContent = `${count} / ${TEAM_CARD_LIMIT}`;
    if (progress) progress.style.width = `${count / TEAM_CARD_LIMIT * 100}%`;
    if (ready) ready.textContent = count === TEAM_CARD_LIMIT ? "READY" : "NOT READY";
    if (message) message.textContent = count === TEAM_CARD_LIMIT ? "TEAM READY — START YOUR PERFORMANCE" : `SELECT ${TEAM_CARD_LIMIT - count} MORE CARD${TEAM_CARD_LIMIT - count === 1 ? "" : "S"}`;
    if (start) start.disabled = count !== TEAM_CARD_LIMIT;
}

/* =========================================================
   CHARACTER BUTTON
========================================================= */

$("changeCharacterButton")
    .addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            renderAvailableCharacters();

            $("characterSelectOverlay")
                .classList
                .remove("hidden");
        }
    );


$("closeCharacterSelect")
    .addEventListener(
        "click",
        () => {

            $("characterSelectOverlay")
                .classList
                .add("hidden");

        }
    );


/* =========================================================
   CARD POPUP CLOSE
========================================================= */

$("closeCardSelect")
    .addEventListener(
        "click",
        () => {

            $("cardSelectOverlay")
                .classList
                .add("hidden");

        }
    );


/* =========================================================
   TEAM BACK
========================================================= */

$("teamSelectBack")
    .addEventListener(
        "click",
        () => {

            $("cardSelectOverlay")
                .classList
                .add("hidden");

            $("characterSelectOverlay")
                .classList
                .add("hidden");

            showScreen(
                "nowPlayScreen"
            );

        }
    );


/* =========================================================
   NOW PLAY → TEAM SELECT
========================================================= */

$("nowPlayButton")
    .addEventListener(
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


/* =========================================================
   START GAME
========================================================= */

$("startTeamPlayButton")
    .addEventListener(
        "click",
        () => {

            const count =
                getSelectedTeamCardCount();


            if (
                count !==
                TEAM_CARD_LIMIT
            ) {

                return;

            }


            /*
                Đến đây chắc chắn:

                - Có character
                - Có đúng 4 card
                - Không có card trùng
            */


            const selectedCharacter =
                getSelectedCharacter();

            const cardIds = selectedTeamCards.filter(Boolean).map(card => card.id);
            const gameplayUrl =
                `gameplay.html?song=${encodeURIComponent(selectedNowPlaySong)}&difficulty=${encodeURIComponent(selectedNowPlayDifficulty)}&character=${encodeURIComponent(selectedCharacter.id)}&cards=${encodeURIComponent(JSON.stringify(cardIds))}`;

            window.location.href = gameplayUrl;
        }
    );

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


$("friendsButton").addEventListener(
    "click",
    () => {

        showLobbyToast(
            "FRIENDS",
            "Friend system is coming soon."
        );

    }
);


$("rankButton").addEventListener(
    "click",
    () => {

        showLobbyToast(
            "WORLD RANK",
            "Global ranking is coming soon."
        );

    }
);


$("eventButton").addEventListener(
    "click",
    () => {

        showLobbyToast(
            "EVENT",
            "Event details are coming soon."
        );

    }
);


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

    return CHARACTERS.filter(
        character =>
            ownedIds.includes(
                character.id
            )
    );
}

/* =========================================================
   CHARACTER PROGRESSION
========================================================= */
const CHARACTER_MAX_RANK = 5;
const CHARACTER_MAX_LEVEL_R1 = 60;
const CHARACTER_LEVEL_STEP_PER_RANK = 5;
const CHARACTER_INFO = {
    lumina: { base: 13400, perLevel: 245, main: "VOCAL", skillName: "RADIANT VOICE", skill: "Boosts performance score during Skills." }
};

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
    $("characterInfoVocal").textContent = getCharacterStat(character).toLocaleString();
    $("characterInfoMainType").textContent = d.main || "VOCAL";
    $("characterInfoSkillName").textContent = d.skillName || "SKILL";
    $("characterInfoSkillDescription").textContent = d.skill || "—";
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
    const owned = getOwnedCharacters();
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
                <div class="my-character-level-line"><span>LV. ${progress.level} / ${maxLevel}</span><strong>${currentStat.toLocaleString()} VOCAL</strong></div>
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
        rate: 76.7,
        rarity: 1,
        type: "junk"
    }


];
/* =========================================================
   CHARACTER GACHA POOL
========================================================= */

const GACHA_CHARACTERS = [

    {
        id: "lumina",

        name: "LUMINA",

        image:
            "assets/lumina.png",

        type:
            "character",

        rarity:
            6,

        /*
            Tỉ lệ thấp hơn
            item featured.
        */
        rate:
            0.33333
    }

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

    const user = getCurrentUser();
    if (!user) {
        showGachaToast("LOGIN REQUIRED", "Vui lòng đăng nhập trước khi roll.");
        return;
    }

    initGachaData(user);
    const cost = amount === 1 ? GACHA_COST_SINGLE : GACHA_COST_TEN;
    const gems = Number(user.gems || 0);
    if (gems < cost) {
        showGachaToast("NOT ENOUGH GEMS", `Bạn cần ${cost} gems để roll.`);
        return;
    }

    const character = GACHA_CHARACTERS[0];
    if (!character) return;

    user.gems = gems - cost;
    gachaBusy = true;
    if (singleRoll) singleRoll.disabled = true;
    if (tenRoll) tenRoll.disabled = true;
    if (characterSingleRoll) characterSingleRoll.disabled = true;
    if (characterTenRoll) characterTenRoll.disabled = true;

    const results = [];

    for (let i = 0; i < amount; i++) {
        user.characterPity = Number(user.characterPity || 0) + 1;
        const guaranteed = user.characterPity >= 100;
        const won = guaranteed || (Math.random() * 100 < Number(character.rate || 0));

        if (won) {
            results.push({ ...character });
            user.characterPity = 0;
        } else {
            results.push({
                id: `character-miss-${Date.now()}-${i}`,
                name: "NO CHARACTER",
                image: null,
                rarity: 1,
                type: "character-miss"
            });
        }
    }

    const wonCharacter = results.find(item => item.type === "character");
    if (wonCharacter) {
        if (!Array.isArray(user.myCharacters)) user.myCharacters = [];
        if (!user.myCharacters.includes(wonCharacter.id)) {
            user.myCharacters.push(wonCharacter.id);
            if (!user.characterProgress) user.characterProgress = {};
            user.characterProgress[wonCharacter.id] = { rank: 1, level: 1 };
        } else {
            const progress = user.characterProgress?.[wonCharacter.id] || { rank: 1, level: 1 };
            progress.rank = Math.min(CHARACTER_MAX_RANK, Number(progress.rank || 1) + 1);
            user.characterProgress[wonCharacter.id] = progress;
        }
        user.selectedCharacterId = wonCharacter.id;
        selectedCharacterId = wonCharacter.id;
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


    const user =
        getCurrentUser();


    if (!user) {

        showGachaToast(
            "LOGIN REQUIRED",
            "Vui lòng đăng nhập trước khi roll."
        );

        return;
    }


    /* =========================
       INIT PITY
    ========================= */

    if (
        typeof user.gachaPity !== "number"
    ) {

        user.gachaPity = 0;
    }


    /* =========================
       COST
    ========================= */

    const cost =
        amount === 1
            ? GACHA_COST_SINGLE
            : GACHA_COST_TEN;


    const currentGems =
        Number(
            user.gems ?? 0
        );


    /* =========================
       NOT ENOUGH GEMS
    ========================= */

    if (
        currentGems < cost
    ) {

        showGachaToast(
            "NOT ENOUGH GEMS",
            `Bạn cần ${cost} gems để roll.`
        );

        return;
    }


    /* =========================
       DEDUCT GEMS
    ========================= */

    user.gems =
        currentGems - cost;


    /* =========================
       LOCK BUTTONS
    ========================= */

    gachaBusy =
        true;

    singleRoll.disabled =
        true;

    tenRoll.disabled =
        true;


    /* =========================
       RESULTS
    ========================= */

    const results =
        [];

    let sixStarCount =
        0;


    /* =========================
       ROLL EACH PULL
    ========================= */

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        /* Roll character first. If no character drops, roll a normal gacha item. */
        const item =
            tryRollCharacter() ||
            getRandomGachaItem();


        results.push(
            item
        );


        /*
            Mỗi pull tăng Pity 1.
        */
        user.gachaPity =
            Number(
                user.gachaPity ?? 0
            ) + 1;


        /*
            Ra 6★ thì reset Pity.
        */
        if (
            Number(
                item.rarity ?? 0
            ) >= 6
        ) {

            user.gachaPity =
                0;

            sixStarCount++;
        }


        /*
            Cập nhật Pity trên màn hình.
        */
        updateGachaPityDisplay(
            user
        );
    }


    /* =========================
       SAVE USER
    ========================= */

    updateUser(
        user
    );


    /* =========================
       UPDATE GEMS
    ========================= */

    updateGachaGemCount(
        user
    );


/* =========================
   MY CARD
   RANK + DUPLICATE SYSTEM
========================= */

const cardResult =
    saveGachaCards(
        user,
        results
    );

/* Save rolled characters into My Character. */
results
    .filter(item => item.type === "character")
    .forEach(item => {
        saveCharacter(item.id);
    });


/*
    Save user after
    card processing.
*/
updateUser(
    user
);


/*
    Update gem display again
    because duplicate Rank 5
    can give 320 Gems.
*/
updateGachaGemCount(
    user
);


/*
    Optional duplicate message.
*/
if (
    cardResult &&
    cardResult.duplicateGems > 0
) {

    setTimeout(
        () => {

            showGachaToast(
                "DUPLICATE CARD",
                `MAX RANK DUPLICATE → +${cardResult.duplicateGems} GEMS`
            );

        },
        800
    );

}


    /* =========================
       SHOW RESULT
    ========================= */

    showGachaResult(
        results
    );
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
    $("currentBannerButton")?.classList.toggle("active", name === "items");
    $("characterBannerButton")?.classList.toggle("active", name === "character");
    $("itemGachaContent")?.classList.toggle("hidden", name !== "items");
    $("characterGachaContent")?.classList.toggle("hidden", name !== "character");
    updateGachaPityDisplay(getCurrentUser());
    updateCharacterPityDisplay(getCurrentUser());
}

function openCharacterBanner() {
    showScreen("gachaScreen");
    setGachaBanner("character");
}

$("characterBannerButton")?.addEventListener("click", openCharacterBanner);

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
        ".gem-pack"
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

        usernameInput.value =
            currentUser.username;

        const returnPage =
            new URLSearchParams(window.location.search)
                .get("return");

        if (returnPage === "nowplay") {

            setupLobby(currentUser);
            renderNowPlay();
            showScreen("nowPlayScreen");

            return;
        }
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