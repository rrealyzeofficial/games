
/* =========================================================
   REALYZE!! · NIGHT STAGE V60
   Initial lobby + Vietnamese guide + training prototype.
========================================================= */

const NIGHT_STAGE_CHOICE_REWARDS = Array.from({length:15},(_,index)=>({
    points:(index+1)*200000,
    title:`NIGHT STAGE CHOICE BOX ${String(index+1).padStart(2,"0")}`,
    amount:1,
    kind:"choiceBox",
    image:"assets/night-stage-choice-box.png",
    desc:"TÚI ĐỒ · Chọn 1: Akito 6★ / An 6★ / Saki 6★ / 1 Nhân Tố Tinh Tú"
}));

const NIGHT_STAGE_EXTRA_REWARDS = [
    {points:100000, kind:"coins", amount:50000, title:"50.000 GOLD", desc:"Nhận trực tiếp vào tài khoản."},
    {points:300000, kind:"gems", amount:100, title:"100 GEMS", desc:"Nhận trực tiếp vào tài khoản."},
    {points:500000, kind:"energyPotion", amount:1, title:"BÌNH ENERGY +60", desc:"TÚI ĐỒ · Dùng để hồi ngay 60 Energy."},
    {points:700000, kind:"coins", amount:100000, title:"100.000 GOLD", desc:"Nhận trực tiếp vào tài khoản."},
    {points:900000, kind:"gems", amount:150, title:"150 GEMS", desc:"Nhận trực tiếp vào tài khoản."},
    {points:1100000, kind:"energyPotion", amount:1, title:"BÌNH ENERGY +60", desc:"TÚI ĐỒ · Dùng để hồi ngay 60 Energy."},
    {points:1300000, kind:"coins", amount:150000, title:"150.000 GOLD", desc:"Nhận trực tiếp vào tài khoản."},
    {points:1500000, kind:"gems", amount:250, title:"250 GEMS", desc:"Nhận trực tiếp vào tài khoản."},
    {points:1700000, kind:"energyPotion", amount:1, title:"BÌNH ENERGY +60", desc:"TÚI ĐỒ · Dùng để hồi ngay 60 Energy."},
    {points:1900000, kind:"coins", amount:200000, title:"200.000 GOLD", desc:"Nhận trực tiếp vào tài khoản."},
    {points:2100000, kind:"gems", amount:350, title:"350 GEMS", desc:"Nhận trực tiếp vào tài khoản."},
    {points:2300000, kind:"energyPotion", amount:1, title:"BÌNH ENERGY +60", desc:"TÚI ĐỒ · Dùng để hồi ngay 60 Energy."},
    {points:2500000, kind:"coins", amount:250000, title:"250.000 GOLD", desc:"Nhận trực tiếp vào tài khoản."},
    {points:2700000, kind:"gems", amount:500, title:"500 GEMS", desc:"Nhận trực tiếp vào tài khoản."},
    {points:2900000, kind:"energyPotion", amount:1, title:"BÌNH ENERGY +60", desc:"TÚI ĐỒ · Dùng để hồi ngay 60 Energy."}
];

const NIGHT_STAGE_REWARDS = [...NIGHT_STAGE_CHOICE_REWARDS,...NIGHT_STAGE_EXTRA_REWARDS].sort((a,b)=>a.points-b.points);

const NIGHT_STAGE_FACTIONS = {
    an: {
        id: "an",
        name: "AN",
        fullName: "SHIRAISHI AN",
        image: "assets/an2.png",
        type: "RAP"
    },
    akito: {
        id: "akito",
        name: "AKITO",
        fullName: "SHINONOME AKITO",
        image: "assets/akito2.png",
        type: "VOCAL"
    },
    saki: {
        id: "saki",
        name: "SAKI",
        fullName: "TENMA SAKI",
        image: "assets/saki2.png",
        type: "ACT"
    }
};

function getNightStageFaction(user){
    return NIGHT_STAGE_FACTIONS[user?.nightStageFaction] || null;
}

function renderNightStageFactionSelection(user){
    const selected = user?.nightStageFaction || "";

    document.querySelectorAll("[data-night-faction]").forEach(button=>{
        button.classList.toggle(
            "selected",
            button.dataset.nightFaction === selected
        );
    });
}


const NIGHT_STAGE_TRAINING_STEPS = [
    {
        title: "BƯỚC 1 · NHẬN THÂN PHẬN",
        phase: "ROLE REVEAL",
        summary: "Character không quyết định phe. Thân phận được chia bí mật khi trận bắt đầu.",
        text: "Trong một trận 8 người, bạn có thể là PERFORMER, role hỗ trợ đặc biệt hoặc BACKSTAGE WOLF. Không ai được biết role của người khác ngay từ đầu.",
        bullets: [
            "PERFORMER: tìm và loại hết Wolf.",
            "WOLF: sống sót, săn người và phá sân khấu.",
            "Role đặc biệt có kỹ năng điều tra / bảo vệ / kiểm tra sabotage."
        ],
        demo: "MÔ PHỎNG: Bạn nhận role SOUND ENGINEER · phe PERFORMER."
    },
    {
        title: "BƯỚC 2 · BACKSTAGE BAN ĐÊM",
        phase: "NIGHT / BACKSTAGE",
        summary: "Mọi role hành động bí mật. Wolf có thể chọn săn người hoặc sabotage.",
        text: "Ban đêm không chỉ có giết người. Sói có thể phá một hệ VOCAL / RAP / ACT, khóa hệ thống hoặc tạo evidence giả để gây nghi ngờ.",
        bullets: [
            "SECURITY có thể bảo vệ một người.",
            "PRODUCER kiểm tra mức độ nguy hiểm của một người.",
            "SOUND ENGINEER có thể kiểm tra một hệ sân khấu."
        ],
        demo: "MÔ PHỎNG: Bạn chọn CHECK ACT. Hệ thống báo có dấu hiệu sabotage ở ACT."
    },
    {
        title: "BƯỚC 3 · LIVE PERFORMANCE",
        phase: "LIVE",
        summary: "Mọi người cùng biểu diễn. Sói có thể lợi dụng LIVE để phá điểm mà không lộ mặt.",
        text: "Mỗi người chọn một hướng biểu diễn: VOCAL, RAP, ACT hoặc SUPPORT. Tổng kết LIVE công bố điểm từng hệ nhưng không nói ai đã phá.",
        bullets: [
            "Điểm bất thường là một manh mối, không phải bằng chứng tuyệt đối.",
            "DANCE character hỗ trợ các hệ khác thay vì tạo thanh DANCE riêng.",
            "LIVE bị phá liên tục sẽ làm giảm LIVE INTEGRITY."
        ],
        demo: "MÔ PHỎNG: ACT dự kiến ~18.000 nhưng chỉ đạt 11.300 → SABOTAGE SUSPECTED."
    },
    {
        title: "BƯỚC 4 · ĐIỀU TRA",
        phase: "INVESTIGATION",
        summary: "Một số người nhận evidence riêng sau LIVE.",
        text: "Evidence có thể cho biết khu vực, hệ bị tác động hoặc nhóm nghi phạm. Nhưng Wolf đặc biệt có thể làm giả evidence, nên không được tin mù quáng.",
        bullets: [
            "Đối chiếu evidence với lựa chọn LIVE của từng người.",
            "Tìm lời khai mâu thuẫn.",
            "Không phải clue nào cũng xác suất 100%."
        ],
        demo: "MÔ PHỎNG: Clue của bạn: 'Người phá ACT nằm trong Player 2 / Player 5 / Player 8'."
    },
    {
        title: "BƯỚC 5 · THẢO LUẬN & BỎ PHIẾU",
        phase: "DISCUSSION / VOTE",
        summary: "Đây là lúc mọi người tranh luận, tố cáo và bỏ phiếu.",
        text: "Bạn có thể công khai clue, giấu clue hoặc nói dối nếu role cho phép. Sau thời gian thảo luận, tất cả bỏ phiếu chọn một người bị loại.",
        bullets: [
            "Người nhiều phiếu nhất bị loại khỏi nhóm sống.",
            "Một số role có thể có vote ×2 hoặc quyền phá hòa.",
            "Người bị loại chuyển sang AUDIENCE thay vì ngồi không."
        ],
        demo: "MÔ PHỎNG: Player 5 bị vote cao nhất và bị loại. Role chỉ được công bố tùy luật cuối cùng chúng ta chốt."
    },
    {
        title: "BƯỚC 6 · THẮNG / THUA",
        phase: "WIN CONDITION",
        summary: "Có hai áp lực: số người sống và LIVE INTEGRITY.",
        text: "PERFORMER thắng khi loại hết Wolf. Wolf thắng khi số Wolf đủ để áp đảo phe còn lại hoặc LIVE INTEGRITY bị phá về 0%.",
        bullets: [
            "Đừng chỉ chăm chăm nhìn người bị loại.",
            "Nếu sân khấu bị phá quá nhanh, Performer vẫn có thể thua.",
            "AUDIENCE vẫn có thể CHEER trong LIVE để hỗ trợ nhẹ."
        ],
        demo: "TRAINING COMPLETE · Lần đầu hoàn thành nhận +500 PT NIGHT STAGE."
    }
];

let nightStageTrainingStep = 0;
let nightStageToastTimer = null;

function ensureNightStageData(user){
    if(!user)return null;

    if(!Number.isFinite(Number(user.nightStagePoints)) || Number(user.nightStagePoints) < 0){
        user.nightStagePoints = 0;
    }

    user.nightStageRewardsClaimed =
        user.nightStageRewardsClaimed &&
        typeof user.nightStageRewardsClaimed === "object"
            ? user.nightStageRewardsClaimed
            : {};

    user.inventoryItems =
        user.inventoryItems && typeof user.inventoryItems === "object"
            ? user.inventoryItems
            : {};

    user.inventoryItems.nightStageChoiceBox = Math.max(
        0,
        Math.floor(Number(user.inventoryItems.nightStageChoiceBox)||0)
    );

    user.inventoryItems.energyPotion60 = Math.max(
        0,
        Math.floor(Number(user.inventoryItems.energyPotion60)||0)
    );

    if(typeof user.nightStageTrainingDone !== "boolean"){
        user.nightStageTrainingDone = false;
    }

    if(!Number.isFinite(Number(user.nightStageTrainingRuns)) || Number(user.nightStageTrainingRuns) < 0){
        user.nightStageTrainingRuns = 0;
    }

    if(
        user.nightStageFaction &&
        !NIGHT_STAGE_FACTIONS[user.nightStageFaction]
    ){
        user.nightStageFaction = "";
    }

    return user;
}

function showNightStageToast(title,text){
    const toast = $("nightStageToast");
    if(!toast)return;

    $("nightStageToastTitle").textContent = title || "NIGHT STAGE";
    $("nightStageToastText").textContent = text || "";

    toast.classList.add("show");

    clearTimeout(nightStageToastTimer);
    nightStageToastTimer = setTimeout(()=>{
        toast.classList.remove("show");
    },2800);
}

function openNightStageModal(id){
    const el=$(id);
    if(!el)return;

    el.classList.remove("hidden");
    el.setAttribute("aria-hidden","false");
}

function closeNightStageModal(id){
    const el=$(id);
    if(!el)return;

    el.classList.add("hidden");
    el.setAttribute("aria-hidden","true");
}

let nightStageRankingRows = [];
let nightStageRankingLoaded = false;
let nightStageRankingError = false;
let nightStageMyRankRemote = 0;
let nightStageRankingLoadSerial = 0;

function getNightStageRanking(){
    return Array.isArray(nightStageRankingRows) ? nightStageRankingRows : [];
}

function normalizeNightStageRankingEntry(row){
    const factionId = String(row?.faction || "").toLowerCase();
    const faction = NIGHT_STAGE_FACTIONS[factionId] || null;

    return {
        playerId: row?.username || "PLAYER",
        faction: faction?.name || "CHƯA CHỌN PHE",
        factionId,
        points: Math.max(0,Number(row?.points||0)),
        image: faction?.image || "",
        isMe: Boolean(row?.is_me),
        rank: Math.max(0,Number(row?.rank||0))
    };
}

async function loadNightStageRanking(user,{limit=3,full=false}={}){
    const d = window.REALYZE_DB;
    const serial = ++nightStageRankingLoadSerial;

    if(!d?.rpc){
        nightStageRankingLoaded = true;
        nightStageRankingError = true;
        renderNightStageTop3(user);
        renderNightStageMyScore(user);
        if(full)renderNightStageRanking(user);
        return [];
    }

    const safeLimit = Math.max(3,Math.min(100,Math.floor(Number(limit)||3)));

    try{
        const [leaderboardResult,myRankResult] = await Promise.all([
            d.rpc("get_night_stage_leaderboard",{p_limit:safeLimit}),
            d.rpc("get_night_stage_my_rank")
        ]);

        if(serial!==nightStageRankingLoadSerial)return nightStageRankingRows;
        if(leaderboardResult.error)throw leaderboardResult.error;

        nightStageRankingRows = Array.isArray(leaderboardResult.data)
            ? leaderboardResult.data.map(normalizeNightStageRankingEntry)
            : [];

        nightStageMyRankRemote = 0;
        if(!myRankResult?.error){
            const myRankRow = Array.isArray(myRankResult?.data)
                ? myRankResult.data[0]
                : myRankResult?.data;
            nightStageMyRankRemote = Math.max(0,Number(myRankRow?.rank||0));
        }else{
            console.warn("NIGHT STAGE MY RANK:",myRankResult.error);
        }

        nightStageRankingLoaded = true;
        nightStageRankingError = false;

        renderNightStageTop3(user);
        renderNightStageMyScore(user);
        if(full)renderNightStageRanking(user);

        return nightStageRankingRows;
    }catch(error){
        console.warn("NIGHT STAGE RANKING:",error);
        if(serial!==nightStageRankingLoadSerial)return nightStageRankingRows;

        nightStageRankingLoaded = true;
        nightStageRankingError = true;

        renderNightStageTop3(user);
        renderNightStageMyScore(user);
        if(full)renderNightStageRanking(user);
        return [];
    }
}

function renderNightStageTop3(user){
    const list = $("nightStageTop3");
    if(!list)return;

    const ranking = getNightStageRanking();

    if(!nightStageRankingLoaded && !ranking.length){
        list.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;font-size:11px;font-weight:900;letter-spacing:1.2px;color:#91899a">ĐANG TẢI XẾP HẠNG...</div>`;
        return;
    }

    if(!ranking.length){
        list.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;font-size:11px;font-weight:900;letter-spacing:1.2px;color:#91899a">${nightStageRankingError?'CHƯA KẾT NỐI ĐƯỢC BẢNG XẾP HẠNG':'CHƯA CÓ DỮ LIỆU XẾP HẠNG'}</div>`;
        return;
    }

    const top = ranking.slice(0,3);

    list.innerHTML = top.map((entry,index)=>{
        const playerId = entry.playerId || "PLAYER";
        const faction = entry.faction || "CHƯA CHỌN PHE";

        const img = entry.image
            ? `<img src="${entry.image}" alt="${playerId}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="fallback" style="display:none">${playerId.slice(0,1)}</div>`
            : `<div class="fallback">${playerId.slice(0,1)}</div>`;

        return `
          <article class="ns-rank-card rank-${index+1}">
            <span class="ns-rank-number">${entry.rank || index+1}</span>
            ${img}
            <footer>
              <strong>${playerId}${entry.isMe?' · BẠN':''}</strong>
              <small class="ns-rank-faction">PHE IDOL · ${faction}</small>
              <b>${Number(entry.points).toLocaleString("vi-VN")} PT</b>
            </footer>
          </article>
        `;
    }).join("");
}
function renderNightStageMyScore(user){
    if(!user)return;

    ensureNightStageData(user);

    const faction = getNightStageFaction(user);

    $("nightStagePlayerName").textContent =
        faction?.name || "CHƯA CHỌN PHE";

    $("nightStageMyPoints").textContent =
        `${Number(user.nightStagePoints||0).toLocaleString("vi-VN")} PT`;

    const ranking = getNightStageRanking();
    const cachedMe = ranking.find(x=>x.isMe);
    const rank = nightStageMyRankRemote || Number(cachedMe?.rank||0);
    $("nightStageMyRank").textContent = rank>0 ? `# ${rank}` : "# --";

    const avatar = $("nightStageMyAvatar");

    if(avatar){
        if(faction?.image){
            avatar.innerHTML =
                `<img src="${faction.image}" alt="${faction.name}" onerror="this.remove();this.parentElement.innerHTML='<span>?</span>'">`;
        }else{
            avatar.innerHTML = "<span>?</span>";
        }
    }
}

function renderNightStageRanking(user){
    const list = $("nightStageRankingList");
    if(!list)return;

    const ranking = getNightStageRanking();

    if(!nightStageRankingLoaded && !ranking.length){
        list.innerHTML = `<div style="padding:24px;text-align:center;font-weight:900;color:#91899a">ĐANG TẢI XẾP HẠNG...</div>`;
        return;
    }

    if(!ranking.length){
        list.innerHTML = `<div style="padding:24px;text-align:center;font-weight:900;color:#91899a">${nightStageRankingError?'CHƯA KẾT NỐI ĐƯỢC SUPABASE':'CHƯA CÓ DỮ LIỆU XẾP HẠNG'}</div>`;
        return;
    }

    list.innerHTML = ranking.map((entry,index)=>{
        const playerId = entry.playerId || "PLAYER";
        const faction = entry.faction || "CHƯA CHỌN PHE";

        const img = entry.image
            ? `<img src="${entry.image}" alt="" onerror="this.style.visibility='hidden'">`
            : `<img alt="">`;

        return `
          <article class="ns-ranking-line ${entry.isMe?'me':''}">
            <strong>#${entry.rank || index+1}</strong>
            ${img}
            <div class="ns-ranking-player-copy">
              <strong>${playerId}${entry.isMe?' · BẠN':''}</strong>
              <small>PHE IDOL · ${faction}</small>
              <b>${Number(entry.points).toLocaleString("vi-VN")} PT</b>
            </div>
          </article>
        `;
    }).join("");
}
function getNightStageRewardKey(reward){
    return `ns-${reward.points}-${reward.characterId||reward.kind}`;
}

function grantNightStageCharacter(user,id){
    if(!user||!id)return;

    user.myCharacters = Array.isArray(user.myCharacters) ? user.myCharacters : [];
    user.characterProgress =
        user.characterProgress && typeof user.characterProgress==="object"
            ? user.characterProgress
            : {};

    if(!user.myCharacters.includes(id)){
        user.myCharacters.push(id);
        user.characterProgress[id] = {rank:1,level:1};
        user.selectedCharacterId = id;
        return;
    }

    const p = user.characterProgress[id] || {rank:1,level:1};
    p.rank = Math.min(5,Math.max(1,Number(p.rank)||1)+1);
    user.characterProgress[id] = p;
}

function renderNightStageRewards(user){
    const list = $("nightStageRewardList");
    if(!list||!user)return;

    ensureNightStageData(user);
    const points = Number(user.nightStagePoints||0);
    let boxNo=0;

    list.innerHTML = NIGHT_STAGE_REWARDS.map(reward=>{
        const key = getNightStageRewardKey(reward);
        const claimed = Boolean(user.nightStageRewardsClaimed[key]);
        const unlocked = points >= reward.points;
        if(reward.kind==='choiceBox')boxNo++;

        let icon='✦', kicker='MILESTONE REWARD', rowClass=reward.kind;
        if(reward.kind==='choiceBox'){
            icon=`<img src="assets/night-stage-choice-box.png" alt="NIGHT STAGE CHOICE BOX">`;
            kicker=`NIGHT STAGE · CHOICE BOX ${String(boxNo).padStart(2,'0')}`;
        }else if(reward.kind==='coins'){icon='●';kicker='GOLD REWARD';}
        else if(reward.kind==='gems'){icon='◆';kicker='GEMS REWARD';}
        else if(reward.kind==='energyPotion'){icon='⚡';kicker='CONSUMABLE · ENERGY';}

        const actionLabel=claimed?'ĐÃ NHẬN':!unlocked?'CHƯA ĐỦ':reward.kind==='choiceBox'?'NHẬN HỘP':reward.kind==='energyPotion'?'NHẬN BÌNH':'NHẬN';
        return `
          <article class="ns-reward-row ${rowClass} ${claimed?'claimed':''} ${!unlocked?'locked':''}">
            <div class="ns-reward-points">${reward.points.toLocaleString("vi-VN")} PT</div>
            <div class="ns-reward-image ${reward.kind==='choiceBox'?'ns-choice-box-icon':''}">${icon}</div>
            <div class="ns-reward-copy">
              <small>${kicker}</small>
              <strong>${reward.title}</strong>
              <span>${reward.desc}</span>
            </div>
            <button type="button" data-night-reward="${key}" ${claimed||!unlocked?'disabled':''}>${actionLabel}</button>
          </article>`;
    }).join("");

    list.querySelectorAll("[data-night-reward]").forEach(button=>{
        button.addEventListener("click",()=>claimNightStageReward(button.dataset.nightReward));
    });
}

function claimNightStageReward(key){
    const user = getCurrentUser();
    if(!user)return;
    ensureNightStageData(user);

    const reward = NIGHT_STAGE_REWARDS.find(x=>getNightStageRewardKey(x)===key);
    if(!reward||user.nightStageRewardsClaimed[key])return;
    if(Number(user.nightStagePoints||0)<reward.points){
        showNightStageToast("CHƯA ĐỦ ĐIỂM",`Cần ${reward.points.toLocaleString("vi-VN")} PT.`);
        return;
    }

    let toastTitle='ĐÃ NHẬN PHẦN THƯỞNG',toastText=reward.title;
    if(reward.kind==="choiceBox"){
        user.inventoryItems.nightStageChoiceBox += Number(reward.amount||1);
        toastTitle='HỘP ĐÃ VÀO TÚI ĐỒ'; toastText=`${reward.title} · Mở ở TÚI ĐỒ trong sảnh chính.`;
    }else if(reward.kind==="energyPotion"){
        user.inventoryItems.energyPotion60 += Number(reward.amount||1);
        toastTitle='BÌNH ĐÃ VÀO TÚI ĐỒ'; toastText='BÌNH ENERGY +60 · Sử dụng ở TÚI ĐỒ.';
    }else if(reward.kind==="coins"){
        user.coins=Math.max(0,Number(user.coins)||0)+Number(reward.amount||0);
        toastText=`+${Number(reward.amount||0).toLocaleString('vi-VN')} GOLD`;
    }else if(reward.kind==="gems"){
        user.gems=Math.max(0,Number(user.gems)||0)+Number(reward.amount||0);
        toastText=`+${Number(reward.amount||0).toLocaleString('vi-VN')} GEMS`;
    }

    user.nightStageRewardsClaimed[key] = true;
    updateUser(user); cacheUser(user);
    try{renderLobbyInventoryBadge(user)}catch(_){}
    try{renderLobbyInventory(user)}catch(_){}
    try{setupLobby(user)}catch(_){}
    renderNightStageRewards(user); renderNightStageMyScore(user);
    showNightStageToast(toastTitle,toastText);
}

function renderNightStageLobby(){
    const user = getCurrentUser();
    if(!user)return;

    ensureNightStageData(user);

    renderNightStageTop3(user);
    renderNightStageMyScore(user);
    renderNightStageRewards(user);
    renderNightStageRanking(user);
    renderNightStageFactionSelection(user);
}

function openNightStageLobby(){
    const user = getCurrentUser();

    if(!user){
        return;
    }

    ensureNightStageData(user);
    renderNightStageLobby();
    showScreen("nightStageScreen");
    void loadNightStageRanking(user,{limit:3,full:false});
}

const NS_AI_ROLE_INFO={
    'STAGE MEMBER':{team:'PERFORMER',desc:'Không có skill Backstage. Performance Power ổn định.'},
    'PRODUCER':{team:'PERFORMER',desc:'Mỗi Backstage scan 1 người và nhận THREAT LEVEL.'},
    'SECURITY':{team:'PERFORMER',desc:'Bảo vệ 1 người; không được lặp cùng mục tiêu 2 đêm liên tiếp.'},
    'CENTER':{team:'PERFORMER',desc:'Một lần mỗi trận có thể bật FINAL DECISION để vote ×2.'},
    'SOUND ENGINEER':{team:'PERFORMER',desc:'Kiểm tra VOCAL / RAP / ACT để phát hiện sabotage.'},
    'BACKSTAGE WOLF':{team:'WOLF',desc:'Chọn ATTACK một player hoặc SABOTAGE VOCAL / RAP / ACT.'}
};
const NS_AI_PHASES=['ROLE','BACKSTAGE','LIVE','INVESTIGATION','DISCUSSION','VOTE','RESULT'];
const NS_AI_NAMES=['YOU','MIZUKI','REO','KAEDE','HIKARI','REN','AOI','NOVA'];
let nightStageAITraining=null;

function nsTrainShuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function nsTrainPick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function nsTrainAlive(g){return g.players.filter(p=>p.alive)}
function nsTrainPlayer(g,id){return g.players.find(p=>p.id===Number(id))||null}
function nsTrainWolves(g){return g.players.filter(p=>p.team==='WOLF')}
function nsTrainWolf(g){return nsTrainWolves(g).find(p=>p.alive)||nsTrainWolves(g)[0]||null}
function nsTrainUser(g){return g.players[0]}
function nsTrainPerformerAlive(g){return nsTrainAlive(g).filter(p=>p.team==='PERFORMER')}
function nsTrainRoleLabel(role){return role||'???'}
function nsTrainEscape(s){return String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]))}

function createNightStageAITraining(){
    const roles=nsTrainShuffle(['BACKSTAGE WOLF','BACKSTAGE WOLF','STAGE MEMBER','STAGE MEMBER','PRODUCER','SECURITY','CENTER','SOUND ENGINEER']);
    const players=NS_AI_NAMES.map((name,i)=>({
        id:i+1,name,role:roles[i],team:NS_AI_ROLE_INFO[roles[i]].team,alive:true,audience:false,isUser:i===0,
        suspicion:0,lastVote:null,eliminatedRound:0
    }));
    return {
        round:1,phase:'ROLE',integrity:100,players,winner:null,winReason:'',
        wolfAction:null,securityTarget:null,lastSecurityTarget:null,producerTarget:null,soundSystem:null,
        userActionDone:false,liveResolved:false,userLiveChoice:null,liveChoices:{},expected:{vocal:0,rap:0,act:0},result:{vocal:0,rap:0,act:0},
        userEvidence:[],discussion:[],publicLog:['8 players entered NIGHT STAGE. 2 Backstage Wolves are hiding among 6 Performers.'],
        centerDecisionUsed:false,centerBoostArmed:false,userVoteTarget:null,voteResult:null,phasePrepared:'',
        pendingAttackResult:null,audienceAction:null,maxRounds:6
    };
}

function updateNightStageTrainingHud(){
    const g=nightStageAITraining;if(!g)return;
    const user=nsTrainUser(g),alive=nsTrainAlive(g).length;
    if($("nightStageTrainingProgress"))$("nightStageTrainingProgress").textContent=`ROUND ${g.round}`;
    if($("nightStageTrainingPhase"))$("nightStageTrainingPhase").textContent=g.phase;
    if($("nightStageTrainingRole"))$("nightStageTrainingRole").textContent=user.audience?'AUDIENCE':user.role;
    if($("nightStageTrainingIntegrity"))$("nightStageTrainingIntegrity").textContent=`${Math.max(0,Math.round(g.integrity))}%`;
    if($("nightStageTrainingAlive"))$("nightStageTrainingAlive").textContent=`${alive} / 8`;
    if($("nightStageTrainingIntegrityBar"))$("nightStageTrainingIntegrityBar").style.width=`${Math.max(0,Math.min(100,g.integrity))}%`;
}

function nsTrainPlayersHtml(g){
    return `<div class="ns-ai-player-grid">${g.players.map(p=>{
        const revealed=p.isUser||!p.alive||g.phase==='RESULT';
        return `<article class="ns-ai-player ${p.isUser?'you':''} ${!p.alive?'out':''} ${p.audience?'audience':''}">
          <span class="ns-ai-seat">P${p.id}</span>
          <div class="ns-ai-avatar">${p.alive?'●':'○'}</div>
          <strong>${nsTrainEscape(p.name)}</strong>
          <small>${p.alive?'ALIVE':'AUDIENCE'}</small>
          <b>${revealed?nsTrainEscape(p.role):'ROLE ???'}</b>
        </article>`;
    }).join('')}</div>`;
}
function nsTrainLogHtml(g){return `<div class="ns-ai-log">${g.publicLog.slice(-7).map(x=>`<div>${nsTrainEscape(x)}</div>`).join('')}</div>`}
function nsTrainPhaseCard(title,copy,extra=''){return `<section class="ns-ai-phase-card"><small>NIGHT STAGE TRAINING</small><h3>${title}</h3><p>${copy}</p>${extra}</section>`}

function prepareNightStageBackstage(g){
    const token=`BACKSTAGE:${g.round}`;if(g.phasePrepared===token)return;g.phasePrepared=token;
    g.wolfAction=null;g.securityTarget=null;g.producerTarget=null;g.soundSystem=null;g.userActionDone=false;g.pendingAttackResult=null;
    const alive=nsTrainAlive(g),user=nsTrainUser(g),wolf=nsTrainWolf(g);
    for(const p of alive){
        if(p.isUser)continue;
        if(p.role==='SECURITY'){
            let choices=alive.filter(x=>x.id!==p.id&&x.id!==g.lastSecurityTarget);if(!choices.length)choices=alive.filter(x=>x.id!==p.id);
            g.securityTarget=nsTrainPick(choices)?.id||null;
        }else if(p.role==='PRODUCER'){
            const c=alive.filter(x=>x.id!==p.id);g.producerTarget=nsTrainPick(c)?.id||null;
        }else if(p.role==='SOUND ENGINEER'){
            g.soundSystem=nsTrainPick(['VOCAL','RAP','ACT']);
        }else if(p.role==='BACKSTAGE WOLF'){
            const targets=alive.filter(x=>x.team==='PERFORMER');
            const attackChance=g.round<=1?0:(g.round<=3?.24:.34);
            if(Math.random()<attackChance&&targets.length){g.wolfAction={type:'attack',target:nsTrainPick(targets).id,actorId:p.id};}
            else{g.wolfAction={type:'sabotage',system:nsTrainPick(['VOCAL','RAP','ACT']),actorId:p.id};}
        }
    }
    if(!user.alive||user.audience){g.userActionDone=true;return;}
    if(['STAGE MEMBER','CENTER'].includes(user.role))g.userActionDone=false;
}

function nsTrainBackstageActionHtml(g){
    const user=nsTrainUser(g),alive=nsTrainAlive(g);
    if(!user.alive||user.audience)return `<div class="ns-ai-action-copy"><b>AUDIENCE</b><span>Bạn không thể dùng skill Backstage.</span></div>`;
    if(g.userActionDone)return `<div class="ns-ai-action-copy done"><b>✓ ACTION LOCKED</b><span>Nhấn TIẾP TỤC để xử lý Backstage.</span></div>`;
    if(user.role==='PRODUCER')return `<div class="ns-ai-action-copy"><b>SCAN PLAYER</b><span>Chọn một player để xem THREAT LEVEL.</span></div><div class="ns-ai-choice-row">${alive.filter(p=>!p.isUser).map(p=>`<button data-ns-train-action="producer" data-target="${p.id}">P${p.id} · ${p.name}</button>`).join('')}</div>`;
    if(user.role==='SECURITY')return `<div class="ns-ai-action-copy"><b>PROTECT PLAYER</b><span>Không thể bảo vệ cùng một người hai đêm liên tiếp.</span></div><div class="ns-ai-choice-row">${alive.filter(p=>p.id!==g.lastSecurityTarget).map(p=>`<button data-ns-train-action="security" data-target="${p.id}">P${p.id} · ${p.name}</button>`).join('')}</div>`;
    if(user.role==='SOUND ENGINEER')return `<div class="ns-ai-action-copy"><b>CHECK SYSTEM</b><span>Chọn hệ muốn kiểm tra.</span></div><div class="ns-ai-choice-row systems">${['VOCAL','RAP','ACT'].map(x=>`<button data-ns-train-action="sound" data-system="${x}">${x}</button>`).join('')}</div>`;
    if(user.role==='BACKSTAGE WOLF')return `<div class="ns-ai-action-copy wolf"><b>WOLF ACTION</b><span>ATTACK một player hoặc SABOTAGE một hệ.</span></div><div class="ns-ai-choice-row">${alive.filter(p=>p.team==='PERFORMER').map(p=>`<button class="danger" data-ns-train-action="wolf-attack" data-target="${p.id}">ATTACK P${p.id}</button>`).join('')}</div><div class="ns-ai-choice-row systems">${['VOCAL','RAP','ACT'].map(x=>`<button class="danger soft" data-ns-train-action="wolf-sabotage" data-system="${x}">SABOTAGE ${x}</button>`).join('')}</div>`;
    return `<div class="ns-ai-action-copy"><b>NO NIGHT SKILL</b><span>${user.role} không có action Backstage bắt buộc.</span></div><div class="ns-ai-choice-row"><button data-ns-train-action="skip">PASS BACKSTAGE</button></div>`;
}

function applyNightStageTrainingAction(btn){
    const g=nightStageAITraining;if(!g)return;
    const action=btn.dataset.nsTrainAction;
    if(g.phase==='BACKSTAGE'){
        if(action==='producer'){g.producerTarget=Number(btn.dataset.target);g.userActionDone=true;}
        else if(action==='security'){g.securityTarget=Number(btn.dataset.target);g.lastSecurityTarget=g.securityTarget;g.userActionDone=true;}
        else if(action==='sound'){g.soundSystem=btn.dataset.system;g.userActionDone=true;}
        else if(action==='wolf-attack'){g.wolfAction={type:'attack',target:Number(btn.dataset.target),actorId:nsTrainUser(g).id};g.userActionDone=true;}
        else if(action==='wolf-sabotage'){g.wolfAction={type:'sabotage',system:btn.dataset.system,actorId:nsTrainUser(g).id};g.userActionDone=true;}
        else if(action==='skip'){g.userActionDone=true;}
    }else if(g.phase==='LIVE'){
        if(action==='live'){g.userLiveChoice=btn.dataset.choice;resolveNightStageTrainingLive(g);}
        else if(action==='audience'){g.audienceAction=btn.dataset.choice;resolveNightStageTrainingLive(g);}
    }else if(g.phase==='VOTE'){
        if(action==='vote'){g.userVoteTarget=Number(btn.dataset.target);}
        else if(action==='center-power'&&!g.centerDecisionUsed){g.centerBoostArmed=!g.centerBoostArmed;}
    }
    renderNightStageTraining();
}

function resolveNightStageBackstage(g){
    if(g.securityTarget)g.lastSecurityTarget=g.securityTarget;
    if(g.wolfAction?.type==='attack'){
        const target=nsTrainPlayer(g,g.wolfAction.target);
        if(target?.alive){
            if(g.securityTarget===target.id){g.pendingAttackResult='protected';g.publicLog.push(`P${target.id} was attacked, but SECURITY stopped it.`);}
            else{target.alive=false;target.audience=true;target.eliminatedRound=g.round;g.pendingAttackResult='hit';g.publicLog.push(`P${target.id} was removed backstage and became AUDIENCE.`);}
        }
    }else if(g.wolfAction?.type==='sabotage'){
        g.publicLog.push(`⚠ Stage system anomaly detected before LIVE.`);
    }else{
        g.publicLog.push(`Backstage ended without a visible incident.`);
    }
    const win=checkNightStageTrainingWin(g);if(win){g.phase='RESULT';return;}
    g.phase='LIVE';g.phasePrepared='';g.liveResolved=false;g.userLiveChoice=null;g.audienceAction=null;
}

function nsTrainLiveActionHtml(g){
    const user=nsTrainUser(g);
    if(g.liveResolved)return `<div class="ns-ai-action-copy done"><b>LIVE COMPLETE</b><span>Nhấn TIẾP TỤC để nhận Evidence.</span></div>`;
    if(user.alive)return `<div class="ns-ai-action-copy"><b>YOUR PERFORMANCE</b><span>Chọn một hướng biểu diễn bí mật.</span></div><div class="ns-ai-choice-row systems">${['VOCAL','RAP','ACT','SUPPORT'].map(x=>`<button data-ns-train-action="live" data-choice="${x}">${x}</button>`).join('')}</div>`;
    return `<div class="ns-ai-action-copy"><b>AUDIENCE MINI-ACTION</b><span>Bạn không vote/chat nữa nhưng vẫn có thể hỗ trợ LIVE.</span></div><div class="ns-ai-choice-row systems">${['CHEER','CLAP','LIGHTSTICK'].map(x=>`<button data-ns-train-action="audience" data-choice="${x}">${x}</button>`).join('')}</div>`;
}

function resolveNightStageTrainingLive(g){
    if(g.liveResolved)return;g.liveResolved=true;
    const totals={vocal:0,rap:0,act:0},support=[];g.liveChoices={};
    for(const p of nsTrainAlive(g)){
        let choice=p.isUser?g.userLiveChoice:nsTrainPick(['VOCAL','RAP','ACT','SUPPORT']);
        g.liveChoices[p.id]=choice;
        if(choice==='SUPPORT'){support.push(p);continue;}
        const key=choice.toLowerCase();totals[key]+=Math.round(2600+Math.random()*1800);
    }
    const supportBonus=support.length*.07;
    for(const k of ['vocal','rap','act'])totals[k]=Math.round(totals[k]*(1+supportBonus));
    if(!nsTrainUser(g).alive){
        if(g.audienceAction==='CHEER'){const k=nsTrainPick(['vocal','rap','act']);totals[k]+=850;}
        else if(g.audienceAction==='CLAP'){for(const k of ['vocal','rap','act'])totals[k]+=300;}
        else if(g.audienceAction==='LIGHTSTICK'){const k=nsTrainPick(['vocal','rap','act']);totals[k]+=1100;}
    }
    g.expected={...totals};g.result={...totals};
    const sabotageActor=nsTrainPlayer(g,g.wolfAction?.actorId);
    if(g.wolfAction?.type==='sabotage'&&sabotageActor?.alive&&sabotageActor.team==='WOLF'){
        const key=g.wolfAction.system.toLowerCase();g.result[key]=Math.round(g.result[key]*.60);g.integrity=Math.max(0,g.integrity-20);
        g.publicLog.push(`⚠ ${g.wolfAction.system} PERFORMANCE WAS SABOTAGED · Expected ~${g.expected[key].toLocaleString('vi-VN')} → Result ${g.result[key].toLocaleString('vi-VN')}.`);
    }else g.publicLog.push(`LIVE completed without confirmed sabotage.`);
}

function generateNightStageTrainingEvidence(g){
    const token=`INVESTIGATION:${g.round}`;if(g.phasePrepared===token)return;g.phasePrepared=token;g.userEvidence=[];
    const user=nsTrainUser(g),wolf=nsTrainWolf(g),alive=nsTrainAlive(g);
    if(user.audience){g.userEvidence.push('AUDIENCE không nhận Evidence bí mật. Bạn chỉ được theo dõi cuộc điều tra.');}
    else if(user.role==='PRODUCER'&&g.producerTarget){
        const t=nsTrainPlayer(g,g.producerTarget);let threat=t?.team==='WOLF'?(Math.random()<.8?'HIGH':'MEDIUM'):(Math.random()<.18?'MEDIUM':'LOW');
        g.userEvidence.push(`SCAN P${t.id} · ${t.name} → THREAT LEVEL: ${threat}.`);
    }else if(user.role==='SOUND ENGINEER'&&g.soundSystem){
        if(g.wolfAction?.type==='sabotage'&&g.wolfAction.system===g.soundSystem){
            const candidates=nsTrainShuffle(alive.filter(p=>p.id!==user.id));const actor=nsTrainPlayer(g,g.wolfAction?.actorId)||nsTrainPick(nsTrainWolves(g).filter(p=>p.alive))||wolf;const suspects=[actor,...candidates.filter(p=>p.id!==actor?.id)].slice(0,3).filter(Boolean);g.userEvidence.push(`SABOTAGE DETECTED ở ${g.soundSystem}. Saboteur nằm trong: ${suspects.map(p=>`P${p.id}`).join(' / ')}.`);
            if(actor)actor.suspicion+=3;
        }else g.userEvidence.push(`CHECK ${g.soundSystem}: không phát hiện dấu vết sabotage trong hệ đã kiểm tra.`);
    }else if(user.role==='SECURITY'&&g.securityTarget){
        const t=nsTrainPlayer(g,g.securityTarget);g.userEvidence.push(g.pendingAttackResult==='protected'?`PROTECT P${t.id} thành công: có người đã cố tấn công mục tiêu.`:`P${t.id} được bảo vệ nhưng không ghi nhận va chạm trực tiếp.`);
    }else if(user.role==='BACKSTAGE WOLF'){
        g.userEvidence.push(g.wolfAction?.type==='sabotage'?`WOLF PRIVATE LOG: ${g.wolfAction.system} sabotage đã ${g.integrity<100?'tác động LIVE':'được gửi'}.`:`WOLF PRIVATE LOG: attack action đã được xử lý.`);
    }else{
        const pool=nsTrainShuffle(alive.filter(p=>!p.isUser));let suspects=[];
        const liveWolf=nsTrainPick(nsTrainWolves(g).filter(p=>p.alive));if(liveWolf&&Math.random()<.72)suspects=[liveWolf,...pool.filter(p=>p.id!==liveWolf.id).slice(0,1)];else suspects=pool.slice(0,2);
        g.userEvidence.push(`Bạn nghe thấy tiếng động gần khu kỹ thuật. Một trong ${suspects.map(p=>`P${p.id}`).join(' / ')} có thể liên quan.`);
    }
    // Hidden AI evidence influences suspicion, but is intentionally imperfect.
    const hiddenWolves=nsTrainWolves(g).filter(p=>p.alive);
    if(hiddenWolves.length){
        for(const p of alive.filter(x=>!x.isUser&&x.team==='PERFORMER')){
            const hiddenWolf=nsTrainPick(hiddenWolves);
            if(Math.random()<.58&&hiddenWolf)hiddenWolf.suspicion+=.42+Math.random()*.55;
            else{const innocent=nsTrainPick(alive.filter(x=>x.id!==p.id&&x.team==='PERFORMER'));if(innocent)innocent.suspicion+=Math.random()*.45;}
        }
    }
    if(g.wolfAction?.type==='sabotage'){
        for(const p of alive){if(g.liveChoices[p.id]===g.wolfAction.system)p.suspicion+=.28;}
    }
}

function generateNightStageDiscussion(g){
    const token=`DISCUSSION:${g.round}`;if(g.phasePrepared===token)return;g.phasePrepared=token;g.discussion=[];
    const alive=nsTrainAlive(g),wolf=nsTrainWolf(g);
    for(const p of alive.filter(x=>!x.isUser).slice(0,6)){
        const candidates=alive.filter(x=>x.id!==p.id).sort((a,b)=>b.suspicion-a.suspicion);
        const target=candidates[0]||nsTrainPick(candidates);if(!target)continue;
        if(p.team==='WOLF'){
            const frame=alive.filter(x=>x.team==='PERFORMER'&&x.id!==p.id).sort((a,b)=>b.suspicion-a.suspicion)[0]||nsTrainPick(alive.filter(x=>x.id!==p.id));
            g.discussion.push(`P${p.id}: “Tôi nghi P${frame.id}. LIVE vừa rồi có quá nhiều điểm bất thường.”`);
            if(frame)frame.suspicion+=.4;
        }else if(Math.random()<.72){
            g.discussion.push(`P${p.id}: “Evidence của tôi khiến P${target.id} đáng nghi hơn.”`);
        }else{
            const d=nsTrainPick(alive.filter(x=>x.id!==p.id));g.discussion.push(`P${p.id}: “Chưa chắc P${d.id} là Wolf. Evidence có thể bị nhiễu.”`);
        }
    }
    if(g.wolfAction?.type==='sabotage')g.discussion.unshift(`SYSTEM: ${g.wolfAction.system} bị sabotage nhưng thủ phạm chưa được công bố.`);
}

function nsTrainVoteActionHtml(g){
    const user=nsTrainUser(g),alive=nsTrainAlive(g);
    if(!user.alive)return `<div class="ns-ai-action-copy"><b>AUDIENCE</b><span>Bạn không được bỏ phiếu. Nhấn TIẾP TỤC để xem AI vote.</span></div>`;
    const center=user.role==='CENTER'&&!g.centerDecisionUsed?`<button class="${g.centerBoostArmed?'armed':''}" data-ns-train-action="center-power">FINAL DECISION ×2 ${g.centerBoostArmed?'· ON':''}</button>`:'';
    return `<div class="ns-ai-action-copy"><b>VOTE</b><span>Chọn một player còn sống. ${user.role==='CENTER'?'FINAL DECISION chỉ dùng 1 lần.':''}</span></div><div class="ns-ai-choice-row">${alive.filter(p=>!p.isUser).map(p=>`<button class="${g.userVoteTarget===p.id?'selected':''}" data-ns-train-action="vote" data-target="${p.id}">P${p.id} · ${p.name}</button>`).join('')}${center}</div>`;
}

function resolveNightStageTrainingVote(g){
    const alive=nsTrainAlive(g),user=nsTrainUser(g),tally={};
    const add=(id,n=1)=>{if(id)tally[id]=(tally[id]||0)+n};
    if(user.alive&&g.userVoteTarget){const power=user.role==='CENTER'&&g.centerBoostArmed&&!g.centerDecisionUsed?2:1;add(g.userVoteTarget,power);if(power===2){g.centerDecisionUsed=true;g.centerBoostArmed=false;}}
    for(const p of alive.filter(x=>!x.isUser)){
        let candidates=alive.filter(x=>x.id!==p.id);if(!candidates.length)continue;
        let target;
        if(p.team==='WOLF'){
            target=[...candidates].filter(x=>x.team==='PERFORMER').sort((a,b)=>b.suspicion-a.suspicion)[0]||nsTrainPick(candidates);
        }else{
            target=[...candidates].sort((a,b)=>(b.suspicion+Math.random()*.8)-(a.suspicion+Math.random()*.8))[0];
        }
        let power=1;if(p.role==='CENTER'&&!g.centerDecisionUsed&&Math.random()<.35){power=2;g.centerDecisionUsed=true;}
        add(target?.id,power);p.lastVote=target?.id||null;
    }
    const max=Math.max(0,...Object.values(tally));const tied=Object.keys(tally).filter(k=>tally[k]===max).map(Number);const outId=nsTrainPick(tied);const out=nsTrainPlayer(g,outId);
    if(out){out.alive=false;out.audience=true;out.eliminatedRound=g.round;g.publicLog.push(`VOTE RESULT: P${out.id} · ${out.name} was eliminated → ${out.role}.`);}
    g.voteResult={tally,outId};g.userVoteTarget=null;
    if(checkNightStageTrainingWin(g)){g.phase='RESULT';return;}
    g.round++;g.phase='BACKSTAGE';g.phasePrepared='';
}

function checkNightStageTrainingWin(g){
    const wolfAlive=nsTrainAlive(g).filter(p=>p.team==='WOLF').length,performerAlive=nsTrainPerformerAlive(g).length;
    if(wolfAlive===0){g.winner='PERFORMER';g.winReason='Cả 2 BACKSTAGE WOLF đã bị loại.';return true;}
    if(g.integrity<=0){g.winner='WOLF';g.winReason='LIVE INTEGRITY đã về 0%.';return true;}
    if(wolfAlive>=performerAlive){g.winner='WOLF';g.winReason='Số Wolf đã bằng hoặc vượt số Performer còn sống.';return true;}
    if(Number(g.round||1)>=Number(g.maxRounds||6) && g.phase==='VOTE'){
        if(wolfAlive>=2 || g.integrity<50){g.winner='WOLF';g.winReason='Hết 6 vòng: Wolf vẫn giữ lợi thế hoặc LIVE INTEGRITY xuống dưới 50%.';return true;}
        g.winner='PERFORMER';g.winReason='Hết 6 vòng: Performer giữ LIVE INTEGRITY và chỉ còn tối đa 1 Wolf.';return true;
    }
    return false;
}

function renderNightStageTraining(){
    const g=nightStageAITraining,content=$("nightStageTrainingContent"),actions=$("nightStageTrainingActionPanel"),next=$("nightStageTrainingNext"),reset=$("nightStageTrainingPrev");
    if(!g||!content||!actions||!next||!reset)return;updateNightStageTrainingHud();
    reset.textContent='↻ TRẬN MỚI';reset.disabled=false;actions.innerHTML='';
    let phaseHtml='';
    if(g.phase==='ROLE'){
        const u=nsTrainUser(g),info=NS_AI_ROLE_INFO[u.role];
        phaseHtml=nsTrainPhaseCard('ROLE REVEAL',`Bạn là ${u.role} · phe ${u.team}. Character không quyết định role.`, `<div class="ns-ai-role-reveal ${u.team==='WOLF'?'wolf':''}"><small>YOUR SECRET ROLE</small><strong>${u.role}</strong><span>${info.desc}</span></div>`);
        next.textContent='BẮT ĐẦU BACKSTAGE ›';next.disabled=false;
    }else if(g.phase==='BACKSTAGE'){
        prepareNightStageBackstage(g);phaseHtml=nsTrainPhaseCard(`ROUND ${g.round} · BACKSTAGE`,'Mọi action diễn ra bí mật. Wolf có thể ATTACK hoặc SABOTAGE thay vì bắt buộc loại người.');
        actions.innerHTML=nsTrainBackstageActionHtml(g);next.textContent='XỬ LÝ BACKSTAGE ›';next.disabled=!g.userActionDone;
    }else if(g.phase==='LIVE'){
        const score=g.liveResolved?`<div class="ns-ai-score-grid">${['vocal','rap','act'].map(k=>`<div class="${g.wolfAction?.type==='sabotage'&&g.wolfAction.system.toLowerCase()===k?'sabotaged':''}"><small>${k.toUpperCase()}</small><b>${g.result[k].toLocaleString('vi-VN')}</b><span>EXPECTED ~${g.expected[k].toLocaleString('vi-VN')}</span></div>`).join('')}</div>`:'';
        phaseHtml=nsTrainPhaseCard(`ROUND ${g.round} · LIVE PERFORMANCE`,'Mỗi người chọn VOCAL / RAP / ACT / SUPPORT. Hệ thống chỉ công bố kết quả tổng.',score);actions.innerHTML=nsTrainLiveActionHtml(g);next.textContent='INVESTIGATION ›';next.disabled=!g.liveResolved;
    }else if(g.phase==='INVESTIGATION'){
        generateNightStageTrainingEvidence(g);phaseHtml=nsTrainPhaseCard(`ROUND ${g.round} · INVESTIGATION`,'Evidence của bạn là bí mật và không đảm bảo 100% chính xác.',`<div class="ns-ai-evidence-list">${g.userEvidence.map(x=>`<div>${nsTrainEscape(x)}</div>`).join('')}</div>`);next.textContent='DISCUSSION ›';next.disabled=false;
    }else if(g.phase==='DISCUSSION'){
        generateNightStageDiscussion(g);phaseHtml=nsTrainPhaseCard(`ROUND ${g.round} · DISCUSSION`,'AI đang suy luận từ Evidence và kết quả LIVE. Wolf cũng có thể nói dối.',`<div class="ns-ai-discussion">${g.discussion.map(x=>`<div>${nsTrainEscape(x)}</div>`).join('')}</div>`);next.textContent='VOTE ›';next.disabled=false;
    }else if(g.phase==='VOTE'){
        phaseHtml=nsTrainPhaseCard(`ROUND ${g.round} · VOTE`,'Player có nhiều phiếu nhất bị loại và chuyển thành AUDIENCE.');actions.innerHTML=nsTrainVoteActionHtml(g);next.textContent='CHỐT PHIẾU ›';next.disabled=nsTrainUser(g).alive&&!g.userVoteTarget;
    }else if(g.phase==='RESULT'){
        const roles=`<div class="ns-ai-result-roles">${g.players.map(p=>`<div><span>P${p.id} · ${nsTrainEscape(p.name)}</span><b>${p.role}</b></div>`).join('')}</div>`;
        phaseHtml=nsTrainPhaseCard(`${g.winner} WIN`,`Kết thúc sau ${g.round} round · ${g.winReason}`,roles);next.textContent='HOÀN TẤT TRAINING';next.disabled=false;actions.innerHTML=`<div class="ns-ai-action-copy done"><b>TRAINING COMPLETE</b><span>Lần đầu hoàn tất nhận +500 NIGHT STAGE PT.</span></div>`;
    }
    content.innerHTML=`<div class="ns-ai-training-layout"><section>${nsTrainPlayersHtml(g)}${nsTrainLogHtml(g)}</section>${phaseHtml}</div>`;
    actions.querySelectorAll('[data-ns-train-action]').forEach(btn=>btn.addEventListener('click',()=>applyNightStageTrainingAction(btn)));
}

function openNightStageTraining(){
    closeNightStageModal("nightStageModeOverlay");closeNightStageModal("nightStageGuideOverlay");closeNightStageModal("nightStagePlayerPreview");
    nightStageAITraining=createNightStageAITraining();renderNightStageTraining();openNightStageModal("nightStageTrainingOverlay");
}

function advanceNightStageTraining(){
    const g=nightStageAITraining;if(!g)return;
    if(g.phase==='ROLE'){g.phase='BACKSTAGE';g.phasePrepared='';}
    else if(g.phase==='BACKSTAGE'){if(!g.userActionDone)return;resolveNightStageBackstage(g);}
    else if(g.phase==='LIVE'){if(!g.liveResolved)return;g.phase='INVESTIGATION';g.phasePrepared='';}
    else if(g.phase==='INVESTIGATION'){g.phase='DISCUSSION';g.phasePrepared='';}
    else if(g.phase==='DISCUSSION'){g.phase='VOTE';g.phasePrepared='';}
    else if(g.phase==='VOTE'){if(nsTrainUser(g).alive&&!g.userVoteTarget)return;resolveNightStageTrainingVote(g);}
    else if(g.phase==='RESULT'){finishNightStageTraining();return;}
    renderNightStageTraining();
}

function finishNightStageTraining(){
    const user = getCurrentUser();if(!user)return;ensureNightStageData(user);
    user.nightStageTrainingRuns = Number(user.nightStageTrainingRuns||0)+1;let reward=0;
    if(!user.nightStageTrainingDone){user.nightStageTrainingDone=true;user.nightStagePoints=Number(user.nightStagePoints||0)+500;reward=500;}
    const savePromise=updateUser(user);cacheUser(user);closeNightStageModal("nightStageTrainingOverlay");renderNightStageLobby();
    Promise.resolve(savePromise).then(()=>loadNightStageRanking(user,{limit:3,full:false})).catch(()=>{});
    showNightStageToast("TRAINING COMPLETE",reward?"+500 PT NIGHT STAGE · PHẦN THƯỞNG LẦN ĐẦU":"Training hoàn tất. Chơi lại không cộng thêm PT.");
}

function bindNightStage(){
    $("nightStageEntry")?.addEventListener("click",openNightStageLobby);

    $("nightStageBack")?.addEventListener("click",()=>{
        showScreen("lobbyScreen");
    });

    $("nightStageGuideButton")?.addEventListener("click",()=>{
        openNightStageModal("nightStageGuideOverlay");
    });

    $("nightStageRewardButton")?.addEventListener("click",()=>{
        renderNightStageRewards(getCurrentUser());
        openNightStageModal("nightStageRewardOverlay");
    });

    $("nightStageRankRewardStamp")?.addEventListener("click",()=>{
        renderNightStageRewards(getCurrentUser());
        openNightStageModal("nightStageRewardOverlay");
    });

    $("nightStageRankingButton")?.addEventListener("click",()=>{
        const user = getCurrentUser();
        renderNightStageRanking(user);
        openNightStageModal("nightStageRankingOverlay");
        void loadNightStageRanking(user,{limit:100,full:true});
    });

    $("nightStageStartButton")?.addEventListener("click",()=>{
        const user=getCurrentUser();
        if(!user)return;
        ensureNightStageData(user);
        renderNightStageFactionSelection(user);
        openNightStageModal("nightStageFactionOverlay");
    });

    document.querySelectorAll("[data-night-faction]").forEach(button=>{
        button.addEventListener("click",()=>{
            const user = getCurrentUser();
            if(!user)return;

            ensureNightStageData(user);

            const factionId = button.dataset.nightFaction;

            if(!NIGHT_STAGE_FACTIONS[factionId]){
                return;
            }

            user.nightStageFaction = factionId;

            const savePromise = updateUser(user);
            cacheUser(user);
            Promise.resolve(savePromise).then(()=>loadNightStageRanking(user,{limit:3,full:false})).catch(()=>{});

            renderNightStageMyScore(user);
            renderNightStageRanking(user);
            renderNightStageFactionSelection(user);

            closeNightStageModal("nightStageFactionOverlay");
            openNightStageModal("nightStageModeOverlay");

            showNightStageToast(
                "ĐÃ CHỌN PHE",
                `${NIGHT_STAGE_FACTIONS[factionId].name} · ${NIGHT_STAGE_FACTIONS[factionId].type}`
            );
        });
    });

    $("nightStageTrainingMode")?.addEventListener("click",openNightStageTraining);

    $("nightStageGuideToTraining")?.addEventListener("click",openNightStageTraining);

    $("nightStagePlayerPreviewTraining")?.addEventListener("click",openNightStageTraining);

    $("nightStagePlayerMode")?.addEventListener("click",()=>{
        closeNightStageModal("nightStageModeOverlay");
        openNightStageModal("nightStagePlayerPreview");
    });

    $("nightStageOtherEvents")?.addEventListener("click",()=>{
        showNightStageToast("CÁC SỰ KIỆN KHÁC","Hiện tại bản test mới có NIGHT STAGE.");
    });

    document.querySelectorAll("[data-ns-close]").forEach(button=>{
        button.addEventListener("click",()=>{
            closeNightStageModal(button.dataset.nsClose);
        });
    });

    document.querySelectorAll(".ns-modal-layer").forEach(layer=>{
        layer.addEventListener("click",event=>{
            if(event.target===layer){
                closeNightStageModal(layer.id);
            }
        });
    });

    $("nightStageTrainingPrev")?.addEventListener("click",()=>{
        nightStageAITraining=createNightStageAITraining();
        renderNightStageTraining();
    });

    $("nightStageTrainingNext")?.addEventListener("click",advanceNightStageTraining);
}

if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",bindNightStage,{once:true});
}else{
    bindNightStage();
}
/* =========================================================
   END NIGHT STAGE V60
========================================================= */

/* =========================================================
   NIGHT STAGE V61 · FULL-SCREEN TRAINING UI
   UI-only rebuild over the existing local AI game logic.
========================================================= */

const NS_V61_AI_AVATARS = [
    "assets/miku1.png",
    "assets/an2.png",
    "assets/akito2.png",
    "assets/saki2.png",
    "assets/shiho1.png",
    "assets/nene1.png",
    "assets/kohane.png",
    "assets/lumina.png"
];

function nsV61CurrentCharacterImage(){
    const user = getCurrentUser?.();
    const id = user?.selectedCharacterId || user?.lobbyCharacterId || "";
    try{
        if(typeof CHARACTER_DATA!=="undefined" && CHARACTER_DATA?.[id]?.image){
            return CHARACTER_DATA[id].image;
        }
    }catch(_){}
    return NS_V61_AI_AVATARS[0];
}

function nsV61AvatarFor(p){
    if(p?.isUser)return nsV61CurrentCharacterImage();
    return NS_V61_AI_AVATARS[(Math.max(1,Number(p?.id)||1)-1)%NS_V61_AI_AVATARS.length];
}

function nsV61PhaseLabel(phase){
    return ({
        ROLE:"ROLE REVEAL",
        BACKSTAGE:"BACKSTAGE",
        LIVE:"LIVE PERFORMANCE",
        INVESTIGATION:"INVESTIGATION",
        DISCUSSION:"DISCUSSION",
        VOTE:"VOTE",
        RESULT:"RESULT"
    })[phase] || phase;
}

function nsV61PhaseClass(phase){
    return String(phase||"role").toLowerCase();
}

function nsV61PlayerCard(g,p,position){
    const user = nsTrainUser(g);
    const showRole = g.phase==="RESULT";
    const speaking = g.phase==="DISCUSSION" && g._v61SpeakerId===p.id;
    const voteSelectable = g.phase==="VOTE" && user.alive && p.alive && !p.isUser;
    const selectedVote = Number(g.userVoteTarget)===p.id;
    const avatar = nsV61AvatarFor(p);
    return `
      <button
        class="ns-v61-player pos-${position} ${p.isUser?"you":""} ${!p.alive?"out":""} ${p.audience?"audience":""} ${speaking?"speaking":""} ${voteSelectable?"vote-ready":""} ${selectedVote?"vote-selected":""}"
        type="button"
        ${voteSelectable?`data-ns-train-action="vote" data-target="${p.id}"`:"disabled"}
      >
        <span class="ns-v61-player-id">P${p.id}${p.isUser?' <i>YOU</i>':''}</span>
        <div class="ns-v61-player-photo">
          <img src="${avatar}" alt="${nsTrainEscape(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
          <span class="fallback" style="display:none">${nsTrainEscape((p.name||"P").slice(0,1))}</span>
          ${speaking?'<b class="ns-v61-speaking-wave">▂▄▆▄▂</b>':''}
        </div>
        <strong>${nsTrainEscape(p.isUser?(getCurrentUser()?.username||"YOU"):p.name)}</strong>
        <small>${p.alive?"ON STAGE":"AUDIENCE"}</small>
        ${showRole?`<em>${nsTrainEscape(p.role)}</em>`:""}
      </button>
    `;
}

function nsV61PlayerRing(g){
    return g.players.map((p,i)=>nsV61PlayerCard(g,p,i+1)).join("");
}

function nsV61ScoreHtml(g){
    const sabotage = g.wolfAction?.type==="sabotage" ? String(g.wolfAction.system||"") : "";
    return `
      <div class="ns-v61-live-score">
        ${["vocal","rap","act"].map(key=>{
            const isSab = sabotage.toLowerCase()===key;
            return `
              <div class="${isSab?"sabotaged":""}">
                <small>${key.toUpperCase()}</small>
                <b>${Number(g.result?.[key]||0).toLocaleString("vi-VN")}</b>
                <span>EXPECTED ~${Number(g.expected?.[key]||0).toLocaleString("vi-VN")}</span>
              </div>
            `;
        }).join("")}
      </div>
      ${sabotage?`
        <div class="ns-v61-sabotage-alert">
          <span>⚠</span>
          <div>
            <small>STAGE SYSTEM WARNING</small>
            <strong>${sabotage} PERFORMANCE WAS SABOTAGED</strong>
            <p>Buổi diễn bị can thiệp. Danh tính thủ phạm chưa được công bố.</p>
          </div>
        </div>
      `:""}
    `;
}

function nsV61StageHtml(g){
    const u = nsTrainUser(g);
    const info = NS_AI_ROLE_INFO[u.role] || {team:u.team,desc:""};
    if(g.phase==="ROLE"){
        return `
          <div class="ns-v61-stage-title">
            <small>YOUR SECRET IDENTITY</small>
            <h2>${nsTrainEscape(u.role)}</h2>
            <p>PHE ${nsTrainEscape(u.team)} · ${nsTrainEscape(info.desc)}</p>
            <span>Character của bạn không tiết lộ role.</span>
          </div>
        `;
    }
    if(g.phase==="BACKSTAGE"){
        return `
          <div class="ns-v61-stage-title backstage">
            <small>ROUND ${g.round}</small>
            <h2>BACKSTAGE</h2>
            <p>Mọi action ở đây đều bí mật.</p>
            <span>${g.userActionDone?"ACTION LOCKED · chờ xử lý":"Chọn đúng 1 hành động trước khi tiếp tục."}</span>
          </div>
        `;
    }
    if(g.phase==="LIVE"){
        return g.liveResolved
            ? `<div class="ns-v61-stage-title compact"><small>ROUND ${g.round} · LIVE RESULT</small><h2>THE SHOW MUST GO ON.</h2></div>${nsV61ScoreHtml(g)}`
            : `<div class="ns-v61-stage-title live"><small>ROUND ${g.round}</small><h2>LIVE PERFORMANCE</h2><p>Chọn cách bạn đóng góp cho buổi diễn.</p><span>Lựa chọn của từng người được giữ bí mật.</span></div>`;
    }
    if(g.phase==="INVESTIGATION"){
        return `
          <div class="ns-v61-stage-title investigation">
            <small>ROUND ${g.round}</small>
            <h2>INVESTIGATION</h2>
            <p>Evidence đã được gửi riêng cho bạn.</p>
            <span>Không phải clue nào cũng chắc chắn 100%.</span>
          </div>
        `;
    }
    if(g.phase==="DISCUSSION"){
        return `
          <div class="ns-v61-stage-title discussion">
            <small>ROUND ${g.round}</small>
            <h2>DISCUSSION</h2>
            <p>Đối chiếu LIVE, evidence và lời khai.</p>
            <span>Wolf cũng có thể nói dối.</span>
          </div>
          ${g.liveResolved?nsV61ScoreHtml(g):""}
        `;
    }
    if(g.phase==="VOTE"){
        return `
          <div class="ns-v61-stage-title vote">
            <small>ROUND ${g.round}</small>
            <h2>FINAL DECISION</h2>
            <p>Chọn một người còn sống để bỏ phiếu.</p>
            <span>Phiếu của bạn chưa được công khai.</span>
          </div>
        `;
    }
    const winClass = g.winner==="WOLF"?"wolf-win":"performer-win";
    return `
      <div class="ns-v61-result ${winClass}">
        <small>TRAINING RESULT</small>
        <h2>${nsTrainEscape(g.winner||"")} WIN</h2>
        <p>${nsTrainEscape(g.winReason||"")}</p>
        <div class="ns-v61-result-roles">
          ${g.players.map(p=>`<span>P${p.id} <b>${nsTrainEscape(p.role)}</b></span>`).join("")}
        </div>
      </div>
    `;
}

function nsV61TargetPills(g,kind){
    const user = nsTrainUser(g);
    let players = nsTrainAlive(g);
    if(kind==="producer")players=players.filter(p=>!p.isUser);
    if(kind==="security")players=players.filter(p=>p.id!==g.lastSecurityTarget);
    if(kind==="wolf-attack")players=players.filter(p=>p.team==="PERFORMER");
    return players.map(p=>`
      <button type="button" class="ns-v61-target-pill" data-ns-train-action="${kind}" data-target="${p.id}">
        <span>P${p.id}</span><b>${nsTrainEscape(p.isUser?"YOU":p.name)}</b>
      </button>
    `).join("");
}

function nsV61ActionTray(g){
    const user = nsTrainUser(g);

    if(g.phase==="ROLE"){
        return `
          <div class="ns-v61-single-cta">
            <button type="button" data-v61-nav="next">ENTER BACKSTAGE <span>›</span></button>
          </div>
        `;
    }

    if(g.phase==="BACKSTAGE"){
        if(!user.alive||user.audience){
            return `<div class="ns-v61-single-cta"><button type="button" data-v61-nav="next">CONTINUE <span>›</span></button></div>`;
        }
        if(g.userActionDone){
            return `
              <div class="ns-v61-locked-action"><span>✓</span><div><b>ACTION LOCKED</b><small>Hành động của bạn đã được ghi nhận bí mật.</small></div></div>
              <div class="ns-v61-single-cta"><button type="button" data-v61-nav="next">RESOLVE BACKSTAGE <span>›</span></button></div>
            `;
        }
        if(user.role==="PRODUCER"){
            return `<div class="ns-v61-action-title"><small>PRODUCER</small><b>SCAN PLAYER</b><span>Chọn 1 mục tiêu để nhận THREAT LEVEL.</span></div><div class="ns-v61-target-grid">${nsV61TargetPills(g,"producer")}</div>`;
        }
        if(user.role==="SECURITY"){
            return `<div class="ns-v61-action-title"><small>SECURITY</small><b>PROTECT PLAYER</b><span>Không thể bảo vệ cùng mục tiêu hai đêm liên tiếp.</span></div><div class="ns-v61-target-grid">${nsV61TargetPills(g,"security")}</div>`;
        }
        if(user.role==="SOUND ENGINEER"){
            return `
              <div class="ns-v61-action-title"><small>SOUND ENGINEER</small><b>CHECK SYSTEM</b><span>Chọn một hệ để theo dõi.</span></div>
              <div class="ns-v61-action-cards three">
                ${["VOCAL","RAP","ACT"].map(x=>`<button type="button" data-ns-train-action="sound" data-system="${x}"><i>${x==="VOCAL"?"🎙":x==="RAP"?"〽":"◈"}</i><b>${x}</b><small>CHECK ${x}</small></button>`).join("")}
              </div>
            `;
        }
        if(user.role==="BACKSTAGE WOLF"){
            return `
              <div class="ns-v61-action-title wolf"><small>BACKSTAGE WOLF</small><b>SELECT YOUR ACTION</b><span>Giết người hoặc phá buổi diễn. Chỉ được chọn 1.</span></div>
              <div class="ns-v61-wolf-actions">
                <div>
                  <button type="button" class="danger primary" data-v61-wolf-targets="1"><i>⚔</i><b>ATTACK PLAYER</b><small>Loại một Performer khỏi sân khấu.</small></button>
                  <div class="ns-v61-target-grid wolf-targets">${nsV61TargetPills(g,"wolf-attack")}</div>
                </div>
                ${["VOCAL","RAP","ACT"].map(x=>`<button type="button" class="danger" data-ns-train-action="wolf-sabotage" data-system="${x}"><i>${x==="VOCAL"?"🎙":x==="RAP"?"〽":"◈"}</i><b>SABOTAGE ${x}</b><small>Giảm mạnh kết quả LIVE của hệ này.</small></button>`).join("")}
              </div>
            `;
        }
        return `
          <div class="ns-v61-action-title"><small>${nsTrainEscape(user.role)}</small><b>NO BACKSTAGE SKILL</b><span>Role này không có skill bắt buộc ở Backstage.</span></div>
          <div class="ns-v61-single-cta"><button type="button" data-ns-train-action="skip">PASS BACKSTAGE <span>›</span></button></div>
        `;
    }

    if(g.phase==="LIVE"){
        if(g.liveResolved){
            return `<div class="ns-v61-single-cta"><button type="button" data-v61-nav="next">OPEN INVESTIGATION <span>›</span></button></div>`;
        }
        const choices = user.alive
            ? [["VOCAL","🎙","VOICE"],["RAP","〽","FLOW"],["ACT","◈","PERFORM"],["SUPPORT","✦","TEAM"]]
            : [["CHEER","✦","AUDIENCE"],["CLAP","👏","AUDIENCE"],["LIGHTSTICK","⌁","AUDIENCE"]];
        return `
          <div class="ns-v61-action-title"><small>${user.alive?"LIVE PERFORMANCE":"AUDIENCE"}</small><b>${user.alive?"CHOOSE YOUR PERFORMANCE":"SUPPORT THE LIVE"}</b><span>${user.alive?"Lựa chọn được giữ kín cho tới khi hệ thống tổng kết.":"Bạn đã bị loại nhưng vẫn có thể giúp sân khấu."}</span></div>
          <div class="ns-v61-action-cards ${choices.length===3?"three":""}">
            ${choices.map(([name,icon,sub])=>`<button type="button" data-ns-train-action="${user.alive?"live":"audience"}" data-choice="${name}"><i>${icon}</i><b>${name}</b><small>${sub}</small></button>`).join("")}
          </div>
        `;
    }

    if(g.phase==="INVESTIGATION"){
        return `
          <div class="ns-v61-investigation-hint"><span>▣</span><div><b>EVIDENCE RECEIVED</b><small>Mở Evidence để xem clue riêng của bạn.</small></div></div>
          <div class="ns-v61-single-cta"><button type="button" data-v61-nav="next">START DISCUSSION <span>›</span></button></div>
        `;
    }

    if(g.phase==="DISCUSSION"){
        return `<div class="ns-v61-single-cta"><button type="button" data-v61-nav="next">GO TO VOTE <span>›</span></button></div>`;
    }

    if(g.phase==="VOTE"){
        if(!user.alive){
            return `<div class="ns-v61-single-cta"><button type="button" data-v61-nav="next">WATCH VOTE RESULT <span>›</span></button></div>`;
        }
        const center = user.role==="CENTER"&&!g.centerDecisionUsed
            ? `<button type="button" class="ns-v61-center-power ${g.centerBoostArmed?"armed":""}" data-ns-train-action="center-power">✦ FINAL DECISION ×2 ${g.centerBoostArmed?"· ON":""}</button>`
            : "";
        return `
          <div class="ns-v61-vote-hint"><span>◉</span><div><b>${g.userVoteTarget?`P${g.userVoteTarget} SELECTED`:"SELECT A PLAYER"}</b><small>Bấm trực tiếp portrait của player còn sống.</small></div>${center}</div>
          <div class="ns-v61-single-cta"><button type="button" data-v61-nav="next" ${g.userVoteTarget?"":"disabled"}>CONFIRM VOTE <span>✓</span></button></div>
        `;
    }

    return `<div class="ns-v61-single-cta"><button type="button" data-v61-nav="next">COMPLETE TRAINING <span>›</span></button></div>`;
}

function nsV61EvidenceDrawer(g){
    if(g.drawer!=="evidence")return "";
    const evidenceReady=["INVESTIGATION","DISCUSSION","VOTE","RESULT"].includes(g.phase);
    if(evidenceReady)generateNightStageTrainingEvidence(g);
    const clue = evidenceReady ? (g.userEvidence?.[0] || "Không có evidence.") : "Evidence sẽ được gửi sau LIVE PERFORMANCE.";
    let confidence = 2;
    const role=nsTrainUser(g).role;
    if(role==="PRODUCER"||role==="SOUND ENGINEER")confidence=3;
    if(role==="SECURITY")confidence=4;
    if(role==="BACKSTAGE WOLF")confidence=5;
    const suspectMatch = clue.match(/P\d+/g)||[];
    return `
      <aside class="ns-v61-drawer evidence">
        <button type="button" class="ns-v61-drawer-close" data-v61-drawer="">×</button>
        <header><span>▣</span><div><small>PRIVATE INFORMATION</small><h3>EVIDENCE</h3></div></header>
        <div class="ns-v61-evidence-card">
          <small>ROUND ${g.round} · STAGE LOG</small>
          <strong>${g.wolfAction?.type==="sabotage"?`${nsTrainEscape(g.wolfAction.system)} SABOTAGED`:"INVESTIGATION CLUE"}</strong>
          <p>${nsTrainEscape(clue)}</p>
          ${suspectMatch.length?`<div class="ns-v61-suspects">${suspectMatch.slice(0,3).map(x=>`<b>${x}</b>`).join("")}</div>`:""}
          <span>CONFIDENCE</span>
          <div class="ns-v61-confidence">${Array.from({length:5},(_,i)=>`<i class="${i<confidence?"on":""}"></i>`).join("")}</div>
        </div>
        ${evidenceReady?`<button type="button" class="ns-v61-add-note" data-v61-copy-evidence="1">ADD TO NOTES</button>`:""}
      </aside>
    `;
}

function nsV61RoleDrawer(g){
    if(g.drawer!=="role")return "";
    const u=nsTrainUser(g),info=NS_AI_ROLE_INFO[u.role]||{};
    return `
      <aside class="ns-v61-drawer role ${u.team==="WOLF"?"wolf":""}">
        <button type="button" class="ns-v61-drawer-close" data-v61-drawer="">×</button>
        <header><span>${u.team==="WOLF"?"☾":"✦"}</span><div><small>SECRET IDENTITY</small><h3>MY ROLE</h3></div></header>
        <div class="ns-v61-role-card">
          <small>${nsTrainEscape(u.team)}</small>
          <strong>${nsTrainEscape(u.audience?"AUDIENCE":u.role)}</strong>
          <p>${nsTrainEscape(u.audience?"Bạn đã bị loại. Không còn chat/vote, nhưng vẫn tham gia LIVE bằng Audience Action.":info.desc||"")}</p>
        </div>
      </aside>
    `;
}

function nsV61NotesDrawer(g){
    if(g.drawer!=="notes")return "";
    return `
      <aside class="ns-v61-drawer notes">
        <button type="button" class="ns-v61-drawer-close" data-v61-drawer="">×</button>
        <header><span>▤</span><div><small>PRIVATE</small><h3>NOTES</h3></div></header>
        <textarea id="nightStageTrainingNotes" placeholder="Ghi nhanh: ai chọn hệ gì, ai đang đáng nghi...">${nsTrainEscape(g.notes||"")}</textarea>
        <small class="ns-v61-note-help">Notes chỉ tồn tại trong trận Training hiện tại.</small>
      </aside>
    `;
}

function nsV61DiscussionHtml(g){
    if(g.phase!=="DISCUSSION")return "";
    generateNightStageDiscussion(g);
    const first = g.discussion.find(x=>/^P\d+/.test(x)) || "";
    const m = first.match(/^P(\d+)/);
    g._v61SpeakerId = m ? Number(m[1]) : null;
    const speaker = g._v61SpeakerId ? nsTrainPlayer(g,g._v61SpeakerId) : null;
    return `
      <div class="ns-v61-comms">
        <section class="ns-v61-voice">
          <small>VOICE · TRAINING SIMULATION</small>
          <div>
            <span class="pulse">◉</span>
            <strong>${speaker?`P${speaker.id} is speaking...`:"No one is speaking"}</strong>
          </div>
          <p>Online sau này sẽ dùng speaking indicator ở đúng vị trí này.</p>
        </section>
        <section class="ns-v61-chat">
          <header><b>DISCUSSION</b><small>AI CHAT</small></header>
          <div>${g.discussion.slice(0,5).map(x=>`<p>${nsTrainEscape(x)}</p>`).join("")}</div>
        </section>
      </div>
    `;
}

function nsV61PublicTicker(g){
    const last = g.publicLog?.slice(-1)[0] || "NIGHT STAGE READY.";
    return `<div class="ns-v61-ticker"><span>LIVE LOG</span><p>${nsTrainEscape(last)}</p></div>`;
}

function renderNightStageTraining(){
    const g=nightStageAITraining;
    const root=$("nightStageTrainingContent");
    if(!g||!root)return;

    if(typeof g.drawer==="undefined")g.drawer=null;
    if(typeof g.notes!=="string")g.notes="";
    if(g.phase==="INVESTIGATION" && !g._v61InvestigationOpened){
        g._v61InvestigationOpened=true;
        g.drawer="evidence";
    }
    if(g.phase!=="DISCUSSION")g._v61SpeakerId=null;
    if(g.phase==="DISCUSSION")generateNightStageDiscussion(g);

    const alive=nsTrainAlive(g).length;
    const user=nsTrainUser(g);
    const phase=nsV61PhaseLabel(g.phase);
    const phaseClass=nsV61PhaseClass(g.phase);
    const discussion=nsV61DiscussionHtml(g);

    root.innerHTML=`
      <div class="ns-v61-match phase-${phaseClass} ${g.drawer?"drawer-open":""}">
        <header class="ns-v61-hud">
          <div class="ns-v61-brand">
            <small>REALYZE!!</small>
            <strong>NIGHT STAGE</strong>
            <span>WHO KILLED THE LIVE?</span>
          </div>

          <div class="ns-v61-round">
            <small>ROUND ${g.round}</small>
            <strong id="nightStageTrainingPhase">${phase}</strong>
            <span>${g.phase==="BACKSTAGE"?"00:28":g.phase==="VOTE"?"00:36":g.phase==="DISCUSSION"?"01:24":"TRAINING"}</span>
          </div>

          <div class="ns-v61-integrity">
            <div><small>LIVE INTEGRITY</small><strong id="nightStageTrainingIntegrity">${Math.max(0,Math.round(g.integrity))}%</strong></div>
            <span><i id="nightStageTrainingIntegrityBar" style="width:${Math.max(0,Math.min(100,g.integrity))}%"></i></span>
            <em>${alive} / 8 ON STAGE</em>
          </div>
        </header>

        <main class="ns-v61-arena">
          ${nsV61PlayerRing(g)}
          <section class="ns-v61-main-stage">
            <div class="ns-v61-stage-grid"></div>
            ${nsV61StageHtml(g)}
          </section>
        </main>

        ${discussion}
        ${nsV61PublicTicker(g)}

        <section class="ns-v61-action-dock">
          ${nsV61ActionTray(g)}
        </section>

        <nav class="ns-v61-bottom-nav">
          <button type="button" data-v61-drawer="evidence" class="${g.drawer==="evidence"?"active":""}" ${["INVESTIGATION","DISCUSSION","VOTE","RESULT"].includes(g.phase)?"":"disabled"}><span>▣</span><b>EVIDENCE</b></button>
          <button type="button" data-v61-drawer="role" class="${g.drawer==="role"?"active":""}"><span>◈</span><b>MY ROLE</b></button>
          <button type="button" data-v61-drawer="notes" class="${g.drawer==="notes"?"active":""}"><span>▤</span><b>NOTES</b></button>
          <button type="button" data-v61-new-game="1"><span>↻</span><b>NEW GAME</b></button>
          <div class="ns-v61-role-mini"><small>YOU ARE</small><b>${nsTrainEscape(user.audience?"AUDIENCE":user.role)}</b></div>
        </nav>

        ${nsV61EvidenceDrawer(g)}
        ${nsV61RoleDrawer(g)}
        ${nsV61NotesDrawer(g)}
      </div>
    `;

    root.querySelectorAll("[data-ns-train-action]").forEach(btn=>{
        btn.addEventListener("click",()=>applyNightStageTrainingAction(btn));
    });
    root.querySelectorAll("[data-v61-nav='next']").forEach(btn=>{
        btn.addEventListener("click",advanceNightStageTraining);
    });
    root.querySelectorAll("[data-v61-drawer]").forEach(btn=>{
        btn.addEventListener("click",()=>{
            const wanted=btn.dataset.v61Drawer||null;
            g.drawer = g.drawer===wanted ? null : wanted;
            renderNightStageTraining();
        });
    });
    root.querySelectorAll("[data-v61-new-game]").forEach(btn=>{
        btn.addEventListener("click",()=>{
            nightStageAITraining=createNightStageAITraining();
            nightStageAITraining.drawer=null;
            nightStageAITraining.notes="";
            renderNightStageTraining();
        });
    });
    root.querySelectorAll("[data-v61-copy-evidence]").forEach(btn=>{
        btn.addEventListener("click",()=>{
            generateNightStageTrainingEvidence(g);
            const clue=g.userEvidence?.[0]||"";
            if(clue && !g.notes.includes(clue))g.notes=(g.notes?g.notes+"\n":"")+clue;
            g.drawer="notes";
            renderNightStageTraining();
        });
    });
    const notes=root.querySelector("#nightStageTrainingNotes");
    if(notes){
        notes.addEventListener("input",()=>{g.notes=notes.value;});
    }
}

function openNightStageTraining(){
    closeNightStageModal("nightStageModeOverlay");
    closeNightStageModal("nightStageGuideOverlay");
    closeNightStageModal("nightStagePlayerPreview");
    nightStageAITraining=createNightStageAITraining();
    nightStageAITraining.drawer=null;
    nightStageAITraining.notes="";
    renderNightStageTraining();
    openNightStageModal("nightStageTrainingOverlay");
}

function advanceNightStageTraining(){
    const g=nightStageAITraining;if(!g)return;
    g.drawer=null;

    if(g.phase==="ROLE"){
        g.phase="BACKSTAGE";g.phasePrepared="";
    }else if(g.phase==="BACKSTAGE"){
        if(!g.userActionDone && nsTrainUser(g).alive && !nsTrainUser(g).audience)return;
        resolveNightStageBackstage(g);
    }else if(g.phase==="LIVE"){
        if(!g.liveResolved)return;
        g.phase="INVESTIGATION";g.phasePrepared="";g._v61InvestigationOpened=false;
    }else if(g.phase==="INVESTIGATION"){
        g.phase="DISCUSSION";g.phasePrepared="";
    }else if(g.phase==="DISCUSSION"){
        g.phase="VOTE";g.phasePrepared="";
    }else if(g.phase==="VOTE"){
        if(nsTrainUser(g).alive&&!g.userVoteTarget)return;
        resolveNightStageTrainingVote(g);
    }else if(g.phase==="RESULT"){
        finishNightStageTraining();
        return;
    }
    renderNightStageTraining();
}

/* Ranking presentation no longer depends on choosing an idol faction.
   Existing Supabase faction data is kept for compatibility, but hidden in UI. */
function renderNightStageMyScore(user){
    if(!user)return;
    ensureNightStageData(user);

    const name = user?.username || "PLAYER";
    const el=$("nightStagePlayerName");
    if(el)el.textContent=name;

    const pts=$("nightStageMyPoints");
    if(pts)pts.textContent=`${Number(user.nightStagePoints||0).toLocaleString("vi-VN")} PT`;

    const ranking=getNightStageRanking();
    const cachedMe=ranking.find(x=>x.isMe);
    const rank=nightStageMyRankRemote||Number(cachedMe?.rank||0);
    const rankEl=$("nightStageMyRank");
    if(rankEl)rankEl.textContent=rank>0?`# ${rank}`:"# --";

    const avatar=$("nightStageMyAvatar");
    if(avatar){
        const img=nsV61CurrentCharacterImage();
        avatar.innerHTML=`<img src="${img}" alt="${nsTrainEscape(name)}" onerror="this.remove();this.parentElement.innerHTML='<span>?</span>'">`;
    }
}

function renderNightStageTop3(user){
    const list=$("nightStageTop3");if(!list)return;
    const ranking=getNightStageRanking();
    if(!nightStageRankingLoaded&&!ranking.length){
        list.innerHTML=`<div style="grid-column:1/-1;padding:24px;text-align:center;font-size:11px;font-weight:900;letter-spacing:1.2px;color:#91899a">ĐANG TẢI XẾP HẠNG...</div>`;return;
    }
    if(!ranking.length){
        list.innerHTML=`<div style="grid-column:1/-1;padding:24px;text-align:center;font-size:11px;font-weight:900;letter-spacing:1.2px;color:#91899a">${nightStageRankingError?'CHƯA KẾT NỐI ĐƯỢC BẢNG XẾP HẠNG':'CHƯA CÓ DỮ LIỆU XẾP HẠNG'}</div>`;return;
    }
    list.innerHTML=ranking.slice(0,3).map((entry,index)=>{
        const playerId=entry.playerId||"PLAYER";
        const fallback=playerId.slice(0,1);
        const img=entry.image
          ? `<img src="${entry.image}" alt="${playerId}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="fallback" style="display:none">${fallback}</div>`
          : `<div class="fallback">${fallback}</div>`;
        return `<article class="ns-rank-card rank-${index+1}">
          <span class="ns-rank-number">${entry.rank||index+1}</span>${img}
          <footer><strong>${playerId}${entry.isMe?' · BẠN':''}</strong><small class="ns-rank-faction">NIGHT STAGE PLAYER</small><b>${Number(entry.points).toLocaleString("vi-VN")} PT</b></footer>
        </article>`;
    }).join("");
}

function renderNightStageRanking(user){
    const list=$("nightStageRankingList");if(!list)return;
    const ranking=getNightStageRanking();
    if(!nightStageRankingLoaded&&!ranking.length){
        list.innerHTML=`<div style="padding:24px;text-align:center;font-weight:900;color:#91899a">ĐANG TẢI XẾP HẠNG...</div>`;return;
    }
    if(!ranking.length){
        list.innerHTML=`<div style="padding:24px;text-align:center;font-weight:900;color:#91899a">${nightStageRankingError?'CHƯA KẾT NỐI ĐƯỢC SUPABASE':'CHƯA CÓ DỮ LIỆU XẾP HẠNG'}</div>`;return;
    }
    list.innerHTML=ranking.map((entry,index)=>`
      <article class="ns-ranking-line ${entry.isMe?'me':''}">
        <strong>#${entry.rank||index+1}</strong>
        <div class="ns-v61-ranking-fallback">${nsTrainEscape((entry.playerId||"P").slice(0,1))}</div>
        <div class="ns-ranking-player-copy">
          <strong>${nsTrainEscape(entry.playerId||"PLAYER")}${entry.isMe?' · BẠN':''}</strong>
          <small>NIGHT STAGE PLAYER</small>
          <b>${Number(entry.points).toLocaleString("vi-VN")} PT</b>
        </div>
      </article>
    `).join("");
}
/* =========================================================
   END NIGHT STAGE V61
========================================================= */

/* =========================================================
   REALYZE!! · NIGHT STAGE V62
   Stable full-screen Training layout + 2 Wolves + faction restore.
   V62 intentionally overrides the V61 presentation functions below
   without changing Campaign / Inventory / Supabase ranking storage.
========================================================= */

function nsV62PhaseLabel(phase){
    return ({ROLE:'ROLE REVEAL',BACKSTAGE:'BACKSTAGE',LIVE:'LIVE PERFORMANCE',INVESTIGATION:'INVESTIGATION',DISCUSSION:'DISCUSSION',VOTE:'VOTE',RESULT:'RESULT'})[phase]||phase;
}

function nsV62FactionLabel(){
    const faction=getNightStageFaction(getCurrentUser?.());
    return faction ? `${faction.name} · ${faction.type}` : 'CHƯA CHỌN PHE';
}

function nsV62PlayerCard(g,p,seat){
    const user=nsTrainUser(g);
    const speaking=g.phase==='DISCUSSION'&&g._v62SpeakerId===p.id;
    const voteReady=g.phase==='VOTE'&&user.alive&&p.alive&&!p.isUser;
    const selected=Number(g.userVoteTarget)===p.id;
    const avatar=nsV61AvatarFor(p);
    return `
      <button class="ns-v62-player seat-${seat} ${p.isUser?'you':''} ${!p.alive?'out':''} ${speaking?'speaking':''} ${voteReady?'vote-ready':''} ${selected?'vote-selected':''}"
              type="button" ${voteReady?`data-ns-train-action="vote" data-target="${p.id}"`:'disabled'}>
        <span class="ns-v62-player-id">P${p.id}${p.isUser?'<i>YOU</i>':''}</span>
        <div class="ns-v62-player-photo">
          <img src="${avatar}" alt="${nsTrainEscape(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
          <span class="fallback" style="display:none">${nsTrainEscape((p.name||'P').slice(0,1))}</span>
          ${speaking?'<b class="ns-v62-speaking">▂▄▆▄▂</b>':''}
          ${!p.alive?'<b class="ns-v62-audience-tag">AUDIENCE</b>':''}
        </div>
        <strong>${nsTrainEscape(p.isUser?(getCurrentUser()?.username||'YOU'):p.name)}</strong>
        <small>${p.alive?'ON STAGE':'AUDIENCE'}</small>
      </button>`;
}

function nsV62PlayerGrid(g){
    const seats=[1,8,7,6,2,3,5,4];
    const byId=Object.fromEntries(g.players.map(p=>[p.id,p]));
    return seats.map(id=>nsV62PlayerCard(g,byId[id],id)).join('');
}

function nsV62RoleReveal(g){
    const u=nsTrainUser(g),info=NS_AI_ROLE_INFO[u.role]||{};
    const mates=u.team==='WOLF'?nsTrainWolves(g).filter(p=>p.id!==u.id):[];
    const count=nsTrainWolves(g).length;
    return `
      <div class="ns-v62-stage-title role">
        <small>YOUR SECRET IDENTITY</small>
        <h2>${nsTrainEscape(u.role)}</h2>
        <b class="${u.team==='WOLF'?'wolf':'performer'}">${nsTrainEscape(u.team)}</b>
        <p>${nsTrainEscape(info.desc||'')}</p>
        <span>${u.team==='WOLF'&&mates.length?`WOLF TEAM · ${mates.map(p=>`P${p.id} ${nsTrainEscape(p.name)}`).join(' · ')}`:`${count} BACKSTAGE WOLVES đang ẩn trong ${g.players.length} người chơi.`}</span>
      </div>`;
}

function nsV62ScoreBoard(g){
    const sab=g.wolfAction?.type==='sabotage'?String(g.wolfAction.system||''):'';
    return `
      <div class="ns-v62-score-grid">
        ${['vocal','rap','act'].map(k=>{
            const bad=sab.toLowerCase()===k;
            return `<div class="${bad?'sabotaged':''}"><small>${k.toUpperCase()}</small><strong>${Number(g.result?.[k]||0).toLocaleString('vi-VN')}</strong><span>EXPECTED ~${Number(g.expected?.[k]||0).toLocaleString('vi-VN')}</span></div>`;
        }).join('')}
      </div>
      ${sab?`<div class="ns-v62-alert"><span>⚠</span><div><small>STAGE SYSTEM WARNING</small><strong>${nsTrainEscape(sab)} PERFORMANCE WAS SABOTAGED</strong><p>Hệ thống chỉ công bố kết quả. Thủ phạm vẫn chưa được biết.</p></div></div>`:''}`;
}

function nsV62Stage(g){
    const u=nsTrainUser(g);
    if(g.phase==='ROLE')return nsV62RoleReveal(g);
    if(g.phase==='BACKSTAGE')return `<div class="ns-v62-stage-title"><small>ROUND ${g.round}</small><h2>BACKSTAGE</h2><p>Role dùng skill bí mật. Wolf team chỉ thực hiện 1 action chung mỗi vòng.</p><span>${g.round===1?'ROUND 1 ưu tiên SABOTAGE để trận không kết thúc quá sớm.':'ATTACK hoặc SABOTAGE đều có thể xảy ra.'}</span></div>`;
    if(g.phase==='LIVE')return g.liveResolved?`<div class="ns-v62-stage-title compact"><small>ROUND ${g.round} · LIVE RESULT</small><h2>THE SHOW MUST GO ON.</h2></div>${nsV62ScoreBoard(g)}`:`<div class="ns-v62-stage-title"><small>ROUND ${g.round}</small><h2>LIVE PERFORMANCE</h2><p>VOCAL · RAP · ACT · SUPPORT</p><span>Lựa chọn cá nhân được giữ kín cho tới khi hệ thống tổng kết.</span></div>`;
    if(g.phase==='INVESTIGATION')return `<div class="ns-v62-stage-title"><small>ROUND ${g.round}</small><h2>INVESTIGATION</h2><p>Evidence đã được gửi riêng.</p><span>Clue có thể chính xác, nhiễu hoặc bị diễn giải sai.</span></div>`;
    if(g.phase==='DISCUSSION')return `<div class="ns-v62-stage-title compact"><small>ROUND ${g.round}</small><h2>DISCUSSION</h2><p>So lời khai với LIVE và Evidence.</p></div>${g.liveResolved?nsV62ScoreBoard(g):''}`;
    if(g.phase==='VOTE')return `<div class="ns-v62-stage-title"><small>ROUND ${g.round}</small><h2>FINAL DECISION</h2><p>Bấm trực tiếp portrait của một player còn sống.</p><span>Phiếu được giữ kín cho tới lúc chốt.</span></div>`;

    const performerWin=g.winner==='PERFORMER';
    return `
      <div class="ns-v62-result ${performerWin?'performer':'wolf'}">
        <small>TRAINING RESULT · ${g.round} ROUND${g.round>1?'S':''}</small>
        <h2>${nsTrainEscape(g.winner||'')} WIN</h2>
        <p>${nsTrainEscape(g.winReason||'')}</p>
        <div class="ns-v62-result-grid">
          ${g.players.map(p=>`<div class="${p.team==='WOLF'?'wolf':''}"><span>P${p.id} · ${nsTrainEscape(p.isUser?(getCurrentUser()?.username||'YOU'):p.name)}</span><b>${nsTrainEscape(p.role)}</b></div>`).join('')}
        </div>
      </div>`;
}

function nsV62TargetButtons(g,kind){
    let arr=nsTrainAlive(g);
    if(kind==='producer')arr=arr.filter(p=>!p.isUser);
    if(kind==='security')arr=arr.filter(p=>p.id!==g.lastSecurityTarget);
    if(kind==='wolf-attack')arr=arr.filter(p=>p.team==='PERFORMER');
    return arr.map(p=>`<button class="ns-v62-target" type="button" data-ns-train-action="${kind}" data-target="${p.id}"><span>P${p.id}</span><b>${nsTrainEscape(p.isUser?'YOU':p.name)}</b></button>`).join('');
}

function nsV62Actions(g){
    const u=nsTrainUser(g);
    if(g.phase==='ROLE')return `<div class="ns-v62-one"><button data-v62-next="1" type="button">ENTER BACKSTAGE <span>›</span></button></div>`;

    if(g.phase==='BACKSTAGE'){
        prepareNightStageBackstage(g);
        if(!u.alive||u.audience)return `<div class="ns-v62-one"><button data-v62-next="1" type="button">CONTINUE <span>›</span></button></div>`;
        if(g.userActionDone)return `<div class="ns-v62-locked"><span>✓</span><div><b>ACTION LOCKED</b><small>Hành động đã được ghi nhận bí mật.</small></div></div><div class="ns-v62-one"><button data-v62-next="1" type="button">RESOLVE BACKSTAGE <span>›</span></button></div>`;
        if(u.role==='PRODUCER')return `<header class="ns-v62-action-head"><small>PRODUCER</small><b>SCAN PLAYER</b><span>Chọn một mục tiêu.</span></header><div class="ns-v62-targets">${nsV62TargetButtons(g,'producer')}</div>`;
        if(u.role==='SECURITY')return `<header class="ns-v62-action-head"><small>SECURITY</small><b>PROTECT PLAYER</b><span>Không thể bảo vệ cùng mục tiêu hai vòng liên tiếp.</span></header><div class="ns-v62-targets">${nsV62TargetButtons(g,'security')}</div>`;
        if(u.role==='SOUND ENGINEER')return `<header class="ns-v62-action-head"><small>SOUND ENGINEER</small><b>CHECK SYSTEM</b><span>Chọn một hệ.</span></header><div class="ns-v62-cards three">${['VOCAL','RAP','ACT'].map(x=>`<button type="button" data-ns-train-action="sound" data-system="${x}"><i>${x==='VOCAL'?'🎙':x==='RAP'?'〽':'◈'}</i><b>${x}</b><small>CHECK SYSTEM</small></button>`).join('')}</div>`;
        if(u.role==='BACKSTAGE WOLF')return `<header class="ns-v62-action-head wolf"><small>BACKSTAGE WOLF</small><b>SELECT ONE TEAM ACTION</b><span>${g.round===1?'Round 1: ATTACK bị khóa để kéo dài Training.':'Bạn và Wolf teammate dùng chung 1 action.'}</span></header><div class="ns-v62-wolf-grid"><section><button class="attack" type="button" ${g.round===1?'disabled':''}><i>⚔</i><b>ATTACK PLAYER</b><small>${g.round===1?'UNLOCKS ROUND 2':'Choose a Performer below'}</small></button><div class="ns-v62-targets mini ${g.round===1?'disabled':''}">${g.round===1?'':nsV62TargetButtons(g,'wolf-attack')}</div></section>${['VOCAL','RAP','ACT'].map(x=>`<button type="button" data-ns-train-action="wolf-sabotage" data-system="${x}"><i>${x==='VOCAL'?'🎙':x==='RAP'?'〽':'◈'}</i><b>SABOTAGE ${x}</b><small>Damage LIVE Integrity</small></button>`).join('')}</div>`;
        return `<header class="ns-v62-action-head"><small>${nsTrainEscape(u.role)}</small><b>NO BACKSTAGE SKILL</b><span>Role này không có skill bắt buộc.</span></header><div class="ns-v62-one"><button type="button" data-ns-train-action="skip">PASS BACKSTAGE <span>›</span></button></div>`;
    }

    if(g.phase==='LIVE'){
        if(g.liveResolved)return `<div class="ns-v62-one"><button data-v62-next="1" type="button">OPEN INVESTIGATION <span>›</span></button></div>`;
        const options=u.alive?[['VOCAL','🎙'],['RAP','〽'],['ACT','◈'],['SUPPORT','✦']]:[['CHEER','✦'],['CLAP','👏'],['LIGHTSTICK','⌁']];
        return `<header class="ns-v62-action-head"><small>${u.alive?'LIVE PERFORMANCE':'AUDIENCE'}</small><b>${u.alive?'CHOOSE YOUR PERFORMANCE':'SUPPORT THE LIVE'}</b><span>${u.alive?'Chọn đúng 1 hướng biểu diễn.':'Bạn vẫn còn mini-action dù đã bị loại.'}</span></header><div class="ns-v62-cards ${options.length===3?'three':''}">${options.map(([x,i])=>`<button type="button" data-ns-train-action="${u.alive?'live':'audience'}" data-choice="${x}"><i>${i}</i><b>${x}</b><small>${u.alive?'LOCK IN':'AUDIENCE ACTION'}</small></button>`).join('')}</div>`;
    }

    if(g.phase==='INVESTIGATION')return `<div class="ns-v62-locked"><span>▣</span><div><b>EVIDENCE RECEIVED</b><small>Mở EVIDENCE ở thanh dưới để xem clue riêng.</small></div></div><div class="ns-v62-one"><button data-v62-next="1" type="button">START DISCUSSION <span>›</span></button></div>`;
    if(g.phase==='DISCUSSION')return `<div class="ns-v62-one"><button data-v62-next="1" type="button">GO TO VOTE <span>›</span></button></div>`;
    if(g.phase==='VOTE'){
        if(!u.alive)return `<div class="ns-v62-one"><button data-v62-next="1" type="button">WATCH VOTE RESULT <span>›</span></button></div>`;
        const center=u.role==='CENTER'&&!g.centerDecisionUsed?`<button class="ns-v62-center ${g.centerBoostArmed?'armed':''}" type="button" data-ns-train-action="center-power">✦ FINAL DECISION ×2 ${g.centerBoostArmed?'· ON':''}</button>`:'';
        return `<div class="ns-v62-vote-line"><div><b>${g.userVoteTarget?`P${g.userVoteTarget} SELECTED`:'SELECT A PLAYER ABOVE'}</b><small>Portrait phát sáng màu hồng khi được chọn.</small></div>${center}</div><div class="ns-v62-one"><button data-v62-next="1" type="button" ${g.userVoteTarget?'':'disabled'}>CONFIRM VOTE <span>✓</span></button></div>`;
    }
    return `<div class="ns-v62-one"><button data-v62-next="1" type="button">COMPLETE TRAINING <span>›</span></button></div>`;
}

function nsV62EvidenceDrawer(g){
    if(g.drawer!=='evidence')return '';
    const ready=['INVESTIGATION','DISCUSSION','VOTE','DEFENSE','VERDICT','RESULT'].includes(g.phase);
    if(ready)generateNightStageTrainingEvidence(g);
    const clue=ready?(g.userEvidence?.[0]||'Không có Evidence.'):'Evidence sẽ được gửi sau LIVE.';
    const suspects=clue.match(/P\d+/g)||[];
    let confidence=2; const role=nsTrainUser(g).role;
    if(role==='PRODUCER'||role==='SOUND ENGINEER')confidence=3;
    if(role==='SECURITY')confidence=4;
    return `<aside class="ns-v62-drawer"><button class="ns-v62-drawer-x" type="button" data-v62-drawer="">×</button><header><span>▣</span><div><small>PRIVATE INFORMATION</small><h3>EVIDENCE</h3></div></header><article><small>ROUND ${g.round} · STAGE LOG</small><strong>${g.wolfAction?.type==='sabotage'?`${nsTrainEscape(g.wolfAction.system)} SABOTAGED`:'INVESTIGATION CLUE'}</strong><p>${nsTrainEscape(clue)}</p>${suspects.length?`<div class="ns-v62-suspects">${suspects.slice(0,3).map(x=>`<b>${x}</b>`).join('')}</div>`:''}<span>CONFIDENCE</span><div class="ns-v62-confidence">${Array.from({length:5},(_,i)=>`<i class="${i<confidence?'on':''}"></i>`).join('')}</div></article>${ready?'<button class="ns-v62-note-add" type="button" data-v62-copy-evidence="1">ADD TO NOTES</button>':''}</aside>`;
}

function nsV62RoleDrawer(g){
    if(g.drawer!=='role')return '';
    const u=nsTrainUser(g),info=NS_AI_ROLE_INFO[u.role]||{};
    const mates=u.team==='WOLF'?nsTrainWolves(g).filter(p=>p.id!==u.id):[];
    return `<aside class="ns-v62-drawer role ${u.team==='WOLF'?'wolf':''}"><button class="ns-v62-drawer-x" type="button" data-v62-drawer="">×</button><header><span>${u.team==='WOLF'?'☾':'✦'}</span><div><small>SECRET IDENTITY</small><h3>MY ROLE</h3></div></header><article><small>${nsTrainEscape(u.team)}</small><strong>${nsTrainEscape(u.audience?'AUDIENCE':u.role)}</strong><p>${nsTrainEscape(u.audience?'Bạn đã bị loại. Bạn không vote nữa nhưng vẫn tham gia LIVE bằng Audience Action.':info.desc||'')}</p>${mates.length?`<div class="ns-v62-wolf-mate">WOLF TEAM · ${mates.map(p=>`P${p.id} ${nsTrainEscape(p.name)}`).join(' · ')}</div>`:''}</article></aside>`;
}

function nsV62NotesDrawer(g){
    if(g.drawer!=='notes')return '';
    return `<aside class="ns-v62-drawer notes"><button class="ns-v62-drawer-x" type="button" data-v62-drawer="">×</button><header><span>▤</span><div><small>PRIVATE</small><h3>NOTES</h3></div></header><textarea id="nightStageTrainingNotes" placeholder="P2 claim RAP...\nP5 nằm trong Evidence...">${nsTrainEscape(g.notes||'')}</textarea><small class="help">Notes chỉ tồn tại trong Training hiện tại.</small></aside>`;
}

function nsV62Discussion(g){
    if(g.phase!=='DISCUSSION')return '';
    generateNightStageDiscussion(g);
    const lines=g.discussion.slice(0,5);
    const first=lines.find(x=>/^P\d+/.test(x))||'';
    const m=first.match(/^P(\d+)/);g._v62SpeakerId=m?Number(m[1]):null;
    return `<div class="ns-v62-comms"><section><header><b>VOICE</b><small>TRAINING SIMULATION</small></header><div class="speaker"><span>◉</span><strong>${g._v62SpeakerId?`P${g._v62SpeakerId} is speaking...`:'No one is speaking'}</strong></div></section><section><header><b>DISCUSSION</b><small>AI CHAT</small></header><div class="chat">${lines.map(x=>`<p>${nsTrainEscape(x)}</p>`).join('')}</div></section></div>`;
}

function renderNightStageTraining(){
    const g=nightStageAITraining,root=$('nightStageTrainingContent');
    if(!g||!root)return;
    if(typeof g.drawer==='undefined')g.drawer=null;
    if(typeof g.notes!=='string')g.notes='';
    if(g.phase==='INVESTIGATION'&&!g._v62EvidenceOpened){g._v62EvidenceOpened=true;g.drawer='evidence';}
    if(g.phase!=='DISCUSSION')g._v62SpeakerId=null;
    if(g.phase==='DISCUSSION')generateNightStageDiscussion(g);

    const alive=nsTrainAlive(g).length;
    const wolfAlive=nsTrainAlive(g).filter(p=>p.team==='WOLF').length;
    const faction=getNightStageFaction(getCurrentUser?.());
    const ticker=g.publicLog?.slice(-1)[0]||'NIGHT STAGE READY.';

    root.innerHTML=`
      <div class="ns-v62-match phase-${String(g.phase||'').toLowerCase()} ${g.drawer?'drawer-open':''}">
        <header class="ns-v62-hud">
          <div class="ns-v62-brand"><small>REALYZE!!</small><strong>NIGHT STAGE</strong><span>WHO KILLED THE LIVE?</span></div>
          <div class="ns-v62-round"><small>ROUND ${g.round} / ${g.maxRounds||6}</small><strong>${nsV62PhaseLabel(g.phase)}</strong><span>${g.phase==='BACKSTAGE'?'00:28':g.phase==='VOTE'?'00:36':g.phase==='DISCUSSION'?'01:24':'TRAINING'}</span></div>
          <div class="ns-v62-right"><div class="ns-v62-integrity"><div><small>LIVE INTEGRITY</small><strong>${Math.max(0,Math.round(g.integrity))}%</strong></div><span><i style="width:${Math.max(0,Math.min(100,g.integrity))}%"></i></span><em>${alive} / 8 ON STAGE</em></div><div class="ns-v62-faction"><small>IDOL FACTION</small><b>${faction?nsTrainEscape(faction.name):'NONE'}</b></div></div>
        </header>

        <main class="ns-v62-stage-zone">
          ${nsV62PlayerGrid(g)}
          <section class="ns-v62-main-stage"><div class="ns-v62-gridlines"></div>${nsV62Stage(g)}</section>
          ${nsV62EvidenceDrawer(g)}${nsV62RoleDrawer(g)}${nsV62NotesDrawer(g)}
        </main>

        <section class="ns-v62-controls">
          <div class="ns-v62-ticker"><span>LIVE LOG</span><p>${nsTrainEscape(ticker)}</p><b>${wolfAlive} WOLF${wolfAlive===1?'':'S'} REMAIN</b></div>
          ${nsV62Discussion(g)}
          <div class="ns-v62-action-box">${nsV62Actions(g)}</div>
        </section>

        <nav class="ns-v62-nav">
          <button type="button" data-v62-drawer="evidence" class="${g.drawer==='evidence'?'active':''}" ${['INVESTIGATION','DISCUSSION','VOTE','RESULT'].includes(g.phase)?'':'disabled'}><span>▣</span><b>EVIDENCE</b></button>
          <button type="button" data-v62-drawer="role" class="${g.drawer==='role'?'active':''}"><span>◈</span><b>MY ROLE</b></button>
          <button type="button" data-v62-drawer="notes" class="${g.drawer==='notes'?'active':''}"><span>▤</span><b>NOTES</b></button>
          <div class="ns-v62-nav-center"><span>2 WOLVES · 6 PERFORMERS</span><b>${nsTrainEscape(nsV62FactionLabel())}</b></div>
          <button type="button" data-v62-new="1"><span>↻</span><b>NEW GAME</b></button>
        </nav>
      </div>`;

    root.querySelectorAll('[data-ns-train-action]').forEach(btn=>btn.addEventListener('click',()=>applyNightStageTrainingAction(btn)));
    root.querySelectorAll('[data-v62-next]').forEach(btn=>btn.addEventListener('click',advanceNightStageTraining));
    root.querySelectorAll('[data-v62-drawer]').forEach(btn=>btn.addEventListener('click',()=>{const w=btn.dataset.v62Drawer||null;g.drawer=g.drawer===w?null:w;renderNightStageTraining();}));
    root.querySelectorAll('[data-v62-new]').forEach(btn=>btn.addEventListener('click',()=>{nightStageAITraining=createNightStageAITraining();nightStageAITraining.drawer=null;nightStageAITraining.notes='';renderNightStageTraining();}));
    root.querySelectorAll('[data-v62-copy-evidence]').forEach(btn=>btn.addEventListener('click',()=>{generateNightStageTrainingEvidence(g);const clue=g.userEvidence?.[0]||'';if(clue&&!g.notes.includes(clue))g.notes=(g.notes?g.notes+'\n':'')+clue;g.drawer='notes';renderNightStageTraining();}));
    const note=root.querySelector('#nightStageTrainingNotes');if(note)note.addEventListener('input',()=>{g.notes=note.value;});
}

function openNightStageTraining(){
    closeNightStageModal('nightStageModeOverlay');
    closeNightStageModal('nightStageGuideOverlay');
    closeNightStageModal('nightStagePlayerPreview');
    nightStageAITraining=createNightStageAITraining();
    nightStageAITraining.drawer=null;nightStageAITraining.notes='';nightStageAITraining._v62EvidenceOpened=false;
    renderNightStageTraining();
    openNightStageModal('nightStageTrainingOverlay');
}

function advanceNightStageTraining(){
    const g=nightStageAITraining;if(!g)return;g.drawer=null;
    if(g.phase==='ROLE'){g.phase='BACKSTAGE';g.phasePrepared='';}
    else if(g.phase==='BACKSTAGE'){if(!g.userActionDone&&nsTrainUser(g).alive&&!nsTrainUser(g).audience)return;resolveNightStageBackstage(g);}
    else if(g.phase==='LIVE'){if(!g.liveResolved)return;g.phase='INVESTIGATION';g.phasePrepared='';g._v62EvidenceOpened=false;}
    else if(g.phase==='INVESTIGATION'){g.phase='DISCUSSION';g.phasePrepared='';}
    else if(g.phase==='DISCUSSION'){g.phase='VOTE';g.phasePrepared='';}
    else if(g.phase==='VOTE'){if(nsTrainUser(g).alive&&!g.userVoteTarget)return;resolveNightStageTrainingVote(g);g._v62EvidenceOpened=false;}
    else if(g.phase==='RESULT'){finishNightStageTraining();return;}
    renderNightStageTraining();
}

/* Restore faction-driven lobby presentation. Secret role is still independent. */
function renderNightStageMyScore(user){
    if(!user)return;ensureNightStageData(user);const faction=getNightStageFaction(user);
    const name=$('nightStagePlayerName');if(name)name.textContent=faction?.name||'CHƯA CHỌN PHE';
    const pts=$('nightStageMyPoints');if(pts)pts.textContent=`${Number(user.nightStagePoints||0).toLocaleString('vi-VN')} PT`;
    const ranking=getNightStageRanking(),cached=ranking.find(x=>x.isMe),rank=nightStageMyRankRemote||Number(cached?.rank||0);
    const rankEl=$('nightStageMyRank');if(rankEl)rankEl.textContent=rank>0?`# ${rank}`:'# --';
    const avatar=$('nightStageMyAvatar');if(avatar){avatar.innerHTML=faction?.image?`<img src="${faction.image}" alt="${nsTrainEscape(faction.name)}" onerror="this.remove();this.parentElement.innerHTML='<span>?</span>'">`:'<span>?</span>';}
}

function renderNightStageTop3(user){
    const list=$('nightStageTop3');if(!list)return;const ranking=getNightStageRanking();
    if(!nightStageRankingLoaded&&!ranking.length){list.innerHTML='<div style="grid-column:1/-1;padding:24px;text-align:center;font-weight:900;color:#91899a">ĐANG TẢI XẾP HẠNG...</div>';return;}
    if(!ranking.length){list.innerHTML=`<div style="grid-column:1/-1;padding:24px;text-align:center;font-weight:900;color:#91899a">${nightStageRankingError?'CHƯA KẾT NỐI ĐƯỢC BẢNG XẾP HẠNG':'CHƯA CÓ DỮ LIỆU XẾP HẠNG'}</div>`;return;}
    list.innerHTML=ranking.slice(0,3).map((e,i)=>{const player=e.playerId||'PLAYER',f=e.faction||'CHƯA CHỌN PHE',fallback=player.slice(0,1),img=e.image?`<img src="${e.image}" alt="${nsTrainEscape(player)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="fallback" style="display:none">${nsTrainEscape(fallback)}</div>`:`<div class="fallback">${nsTrainEscape(fallback)}</div>`;return `<article class="ns-rank-card rank-${i+1}"><span class="ns-rank-number">${e.rank||i+1}</span>${img}<footer><strong>${nsTrainEscape(player)}${e.isMe?' · BẠN':''}</strong><small class="ns-rank-faction">PHE IDOL · ${nsTrainEscape(f)}</small><b>${Number(e.points).toLocaleString('vi-VN')} PT</b></footer></article>`;}).join('');
}

function renderNightStageRanking(user){
    const list=$('nightStageRankingList');if(!list)return;const ranking=getNightStageRanking();
    if(!nightStageRankingLoaded&&!ranking.length){list.innerHTML='<div style="padding:24px;text-align:center;font-weight:900;color:#91899a">ĐANG TẢI XẾP HẠNG...</div>';return;}
    if(!ranking.length){list.innerHTML=`<div style="padding:24px;text-align:center;font-weight:900;color:#91899a">${nightStageRankingError?'CHƯA KẾT NỐI ĐƯỢC SUPABASE':'CHƯA CÓ DỮ LIỆU XẾP HẠNG'}</div>`;return;}
    list.innerHTML=ranking.map((e,i)=>{const player=e.playerId||'PLAYER',f=e.faction||'CHƯA CHỌN PHE',img=e.image?`<img src="${e.image}" alt="" onerror="this.style.visibility='hidden'">`:'<img alt="">';return `<article class="ns-ranking-line ${e.isMe?'me':''}"><strong>#${e.rank||i+1}</strong>${img}<div class="ns-ranking-player-copy"><strong>${nsTrainEscape(player)}${e.isMe?' · BẠN':''}</strong><small>PHE IDOL · ${nsTrainEscape(f)}</small><b>${Number(e.points).toLocaleString('vi-VN')} PT</b></div></article>`;}).join('');
}

/* =========================================================
   END NIGHT STAGE V62
========================================================= */

/* =========================================================
   REALYZE!! · NIGHT STAGE V63
   - 10-player Training (3 Wolves)
   - Nomination -> 30s Defense -> PARDON / SHOOT verdict
   - No fixed round cap
   - Faction locks after first selection
   - Online 8–10 public matchmaking + friend rooms
   - Supabase Realtime text chat / Presence + WebRTC voice beta
========================================================= */

const NS_V63_NAMES=['YOU','MIZUKI','REO','KAEDE','HIKARI','REN','AOI','NOVA','YUNA','SEI'];
let nsV63DefenseTimer=null;
let nsV63ExitMode=null;

function createNightStageAITraining(){
    const roles=nsTrainShuffle([
        'BACKSTAGE WOLF','BACKSTAGE WOLF','BACKSTAGE WOLF',
        'STAGE MEMBER','STAGE MEMBER','STAGE MEMBER',
        'PRODUCER','SECURITY','CENTER','SOUND ENGINEER'
    ]);
    const players=NS_V63_NAMES.map((name,i)=>({
        id:i+1,name,role:roles[i],team:NS_AI_ROLE_INFO[roles[i]].team,
        alive:true,audience:false,isUser:i===0,suspicion:0,lastVote:null,eliminatedRound:0
    }));
    return {
        round:1,phase:'ROLE',integrity:100,players,winner:null,winReason:'',
        wolfAction:null,securityTarget:null,lastSecurityTarget:null,producerTarget:null,soundSystem:null,
        userActionDone:false,liveResolved:false,userLiveChoice:null,liveChoices:{},
        expected:{vocal:0,rap:0,act:0},result:{vocal:0,rap:0,act:0},
        userEvidence:[],discussion:[],
        publicLog:['10 players entered NIGHT STAGE. 3 Backstage Wolves are hiding among 7 Performers.'],
        centerDecisionUsed:false,centerBoostArmed:false,userVoteTarget:null,voteResult:null,phasePrepared:'',
        pendingAttackResult:null,audienceAction:null,drawer:null,notes:'',
        accusedId:null,defenseEndsAt:0,userDefense:'',userVerdict:null,verdictResult:null
    };
}


function nsV62RoleReveal(g){
    const u=nsTrainUser(g),info=NS_AI_ROLE_INFO[u.role]||{};
    const wolves=nsTrainWolves(g),performers=g.players.filter(p=>p.team==='PERFORMER');
    const mates=u.team==='WOLF'?wolves.filter(p=>p.id!==u.id):[];
    return `
      <div class="ns-v62-stage-title role">
        <small>YOUR SECRET IDENTITY</small>
        <h2>${nsTrainEscape(u.role)}</h2>
        <b class="${u.team==='WOLF'?'wolf':'performer'}">${nsTrainEscape(u.team)}</b>
        <p>${nsTrainEscape(info.desc||'')}</p>
        <span>${u.team==='WOLF'&&mates.length
            ? `WOLF TEAM · ${mates.map(p=>`P${p.id} ${nsTrainEscape(p.name)}`).join(' · ')}`
            : `${wolves.length} BACKSTAGE WOLF · ${performers.length} PERFORMER · role được chia ngẫu nhiên.`}</span>
      </div>`;
}

function prepareNightStageBackstage(g){
    const token=`BACKSTAGE:${g.round}`;if(g.phasePrepared===token)return;g.phasePrepared=token;
    g.wolfAction=null;g.securityTarget=null;g.producerTarget=null;g.soundSystem=null;
    g.userActionDone=false;g.pendingAttackResult=null;g.userVerdict=null;g.verdictResult=null;
    const alive=nsTrainAlive(g),user=nsTrainUser(g);

    for(const p of alive){
        if(p.isUser)continue;
        if(p.role==='SECURITY'){
            let choices=alive.filter(x=>x.id!==p.id&&x.id!==g.lastSecurityTarget);
            if(!choices.length)choices=alive.filter(x=>x.id!==p.id);
            g.securityTarget=nsTrainPick(choices)?.id||null;
        }else if(p.role==='PRODUCER'){
            const choices=alive.filter(x=>x.id!==p.id);
            g.producerTarget=nsTrainPick(choices)?.id||null;
        }else if(p.role==='SOUND ENGINEER'){
            g.soundSystem=nsTrainPick(['VOCAL','RAP','ACT']);
        }
    }

    // One shared action for the whole Wolf team. Wolves never target Wolves.
    if(user.alive&&user.team==='WOLF'){
        g.wolfAction=null; // user's choice represents the Wolf team action
    }else{
        const actor=nsTrainPick(nsTrainWolves(g).filter(p=>p.alive));
        const performerTargets=alive.filter(p=>p.team==='PERFORMER');
        if(actor){
            const attackChance=g.round===1?0:(g.round<=3?.22:.30);
            if(performerTargets.length&&Math.random()<attackChance){
                const target=nsTrainPick(performerTargets);
                g.wolfAction={type:'attack',target:target.id,actorId:actor.id};
            }else{
                g.wolfAction={type:'sabotage',system:nsTrainPick(['VOCAL','RAP','ACT']),actorId:actor.id};
            }
        }
    }

    if(!user.alive||user.audience){g.userActionDone=true;return;}
    if(['STAGE MEMBER','CENTER'].includes(user.role))g.userActionDone=false;
}

function resolveNightStageBackstage(g){
    if(g.securityTarget)g.lastSecurityTarget=g.securityTarget;
    if(g.wolfAction?.type==='attack'){
        const target=nsTrainPlayer(g,g.wolfAction.target);
        // Hard guard: Wolf-on-Wolf attacks are invalid and become no visible incident.
        if(!target?.alive||target.team!=='PERFORMER'){
            g.wolfAction=null;
            g.publicLog.push('Backstage ended without a valid attack target.');
        }else if(g.securityTarget===target.id){
            g.pendingAttackResult='protected';
            g.publicLog.push(`P${target.id} was attacked, but SECURITY stopped it.`);
        }else{
            target.alive=false;target.audience=true;target.eliminatedRound=g.round;g.pendingAttackResult='hit';
            g.publicLog.push(`P${target.id} was removed backstage and became AUDIENCE.`);
        }
    }else if(g.wolfAction?.type==='sabotage'){
        g.publicLog.push('⚠ Stage system anomaly detected before LIVE.');
    }else{
        g.publicLog.push('Backstage ended without a visible incident.');
    }
    if(checkNightStageTrainingWin(g)){g.phase='RESULT';return;}
    g.phase='LIVE';g.phasePrepared='';g.liveResolved=false;g.userLiveChoice=null;g.audienceAction=null;
}

function checkNightStageTrainingWin(g){
    const wolfAlive=nsTrainAlive(g).filter(p=>p.team==='WOLF').length;
    const performerAlive=nsTrainPerformerAlive(g).length;
    if(wolfAlive===0){g.winner='PERFORMER';g.winReason='Tất cả BACKSTAGE WOLF đã bị loại.';return true;}
    if(g.integrity<=0){g.winner='WOLF';g.winReason='LIVE INTEGRITY đã về 0%.';return true;}
    if(wolfAlive>=performerAlive){g.winner='WOLF';g.winReason='Số Wolf đã bằng hoặc vượt số Performer còn sống.';return true;}
    return false;
}

function resolveNightStageTrainingVote(g){
    const alive=nsTrainAlive(g),user=nsTrainUser(g),tally={};
    const add=(id,n=1)=>{if(id)tally[id]=(tally[id]||0)+n;};
    if(user.alive&&g.userVoteTarget){
        const power=user.role==='CENTER'&&g.centerBoostArmed&&!g.centerDecisionUsed?2:1;
        add(g.userVoteTarget,power);
        if(power===2){g.centerDecisionUsed=true;g.centerBoostArmed=false;}
    }
    for(const p of alive.filter(x=>!x.isUser)){
        let candidates=alive.filter(x=>x.id!==p.id);if(!candidates.length)continue;
        let target;
        if(p.team==='WOLF'){
            target=candidates.filter(x=>x.team==='PERFORMER').sort((a,b)=>b.suspicion-a.suspicion)[0]||nsTrainPick(candidates.filter(x=>x.team==='PERFORMER'));
        }else{
            target=[...candidates].sort((a,b)=>(b.suspicion+Math.random()*.85)-(a.suspicion+Math.random()*.85))[0];
        }
        let power=1;
        if(p.role==='CENTER'&&!g.centerDecisionUsed&&Math.random()<.28){power=2;g.centerDecisionUsed=true;}
        add(target?.id,power);p.lastVote=target?.id||null;
    }
    const max=Math.max(0,...Object.values(tally));
    const tied=Object.keys(tally).filter(k=>tally[k]===max).map(Number);
    const accusedId=nsTrainPick(tied);
    const accused=nsTrainPlayer(g,accusedId);
    g.voteResult={tally,accusedId};g.userVoteTarget=null;g.accusedId=accusedId;g.userDefense='';
    if(!accused){g.round++;g.phase='BACKSTAGE';g.phasePrepared='';return;}
    g.publicLog.push(`NOMINATION: P${accused.id} · ${accused.name} was sent to the stage for a 30-second defense.`);
    g.phase='DEFENSE';g.phasePrepared='';g.defenseEndsAt=Date.now()+30000;
}

function nsV63AIShouldShoot(g,p,accused){
    if(!p||!accused)return false;
    if(p.team==='WOLF'){
        if(accused.team==='WOLF')return false;
        return Math.random()<.78;
    }
    const score=Number(accused.suspicion||0)+(accused.team==='WOLF'?.42:0)+(Math.random()*.9-.3);
    return score>.85;
}

function resolveNightStageTrainingVerdict(g){
    const accused=nsTrainPlayer(g,g.accusedId);
    if(!accused?.alive){g.round++;g.phase='BACKSTAGE';g.phasePrepared='';return;}
    const voters=nsTrainAlive(g).filter(p=>p.id!==accused.id);
    let shoot=0,pardon=0;
    const user=nsTrainUser(g);
    if(user.alive&&user.id!==accused.id&&g.userVerdict){
        if(g.userVerdict==='SHOOT')shoot++;else pardon++;
    }
    for(const p of voters.filter(x=>!x.isUser)){
        if(nsV63AIShouldShoot(g,p,accused))shoot++;else pardon++;
    }
    const eliminated=shoot>pardon; // ties spare the accused
    if(eliminated){
        accused.alive=false;accused.audience=true;accused.eliminatedRound=g.round;
        g.publicLog.push(`VERDICT: SHOOT ${shoot} · PARDON ${pardon} → P${accused.id} was eliminated and became AUDIENCE.`);
    }else{
        accused.suspicion=Math.max(0,Number(accused.suspicion||0)-.25);
        g.publicLog.push(`VERDICT: PARDON ${pardon} · SHOOT ${shoot} → P${accused.id} returned to the stage.`);
    }
    g.verdictResult={shoot,pardon,eliminated,accusedId:accused.id};g.userVerdict=null;g.accusedId=null;g.defenseEndsAt=0;
    if(checkNightStageTrainingWin(g)){g.phase='RESULT';return;}
    g.round++;g.phase='BACKSTAGE';g.phasePrepared='';
}

function applyNightStageTrainingAction(btn){
    const g=nightStageAITraining;if(!g)return;
    const action=btn.dataset.nsTrainAction;
    if(g.phase==='BACKSTAGE'){
        if(action==='producer'){g.producerTarget=Number(btn.dataset.target);g.userActionDone=true;}
        else if(action==='security'){g.securityTarget=Number(btn.dataset.target);g.lastSecurityTarget=g.securityTarget;g.userActionDone=true;}
        else if(action==='sound'){g.soundSystem=btn.dataset.system;g.userActionDone=true;}
        else if(action==='wolf-attack'){
            const t=nsTrainPlayer(g,Number(btn.dataset.target));
            if(t?.team==='PERFORMER'){g.wolfAction={type:'attack',target:t.id,actorId:nsTrainUser(g).id};g.userActionDone=true;}
        }
        else if(action==='wolf-sabotage'){g.wolfAction={type:'sabotage',system:btn.dataset.system,actorId:nsTrainUser(g).id};g.userActionDone=true;}
        else if(action==='skip'){g.userActionDone=true;}
    }else if(g.phase==='LIVE'){
        if(action==='live'){g.userLiveChoice=btn.dataset.choice;resolveNightStageTrainingLive(g);}
        else if(action==='audience'){g.audienceAction=btn.dataset.choice;resolveNightStageTrainingLive(g);}
    }else if(g.phase==='VOTE'){
        if(action==='vote')g.userVoteTarget=Number(btn.dataset.target);
        else if(action==='center-power'&&!g.centerDecisionUsed)g.centerBoostArmed=!g.centerBoostArmed;
    }else if(g.phase==='VERDICT'){
        if(action==='verdict')g.userVerdict=btn.dataset.choice;
    }
    renderNightStageTraining();
}

function nsV62PhaseLabel(phase){
    return ({ROLE:'ROLE REVEAL',BACKSTAGE:'BACKSTAGE',LIVE:'LIVE PERFORMANCE',INVESTIGATION:'INVESTIGATION',DISCUSSION:'DISCUSSION',VOTE:'NOMINATION',DEFENSE:'30s DEFENSE',VERDICT:'PARDON / SHOOT',RESULT:'RESULT'})[phase]||phase;
}

function nsV62PlayerGrid(g){
    const byId=Object.fromEntries(g.players.map(p=>[p.id,p]));
    return Array.from({length:10},(_,i)=>{
        const id=i+1,p=byId[id];
        return p?nsV62PlayerCard(g,p,id):`<div class="ns-v63-empty-seat seat-${id}"><span>P${id}</span><b>EMPTY</b></div>`;
    }).join('');
}

function nsV63AccusedCard(g){
    const p=nsTrainPlayer(g,g.accusedId);if(!p)return '';
    const avatar=nsV61AvatarFor(p);
    return `<div class="ns-v63-accused"><div><img src="${avatar}" alt=""><span>P${p.id}</span></div><strong>${nsTrainEscape(p.isUser?(getCurrentUser()?.username||'YOU'):p.name)}</strong><small>NOMINATED PLAYER</small></div>`;
}

function nsV63DefenseRemaining(g){return Math.max(0,Math.ceil((Number(g.defenseEndsAt||0)-Date.now())/1000));}

function nsV62Stage(g){
    const u=nsTrainUser(g);
    if(g.phase==='ROLE')return nsV62RoleReveal(g);
    if(g.phase==='BACKSTAGE')return `<div class="ns-v62-stage-title"><small>ROUND ${g.round}</small><h2>BACKSTAGE</h2><p>Role dùng skill bí mật. Wolf team chỉ thực hiện 1 action chung mỗi vòng.</p><span>${g.round===1?'ROUND 1: Wolf chỉ SABOTAGE để trận mở đầu có thông tin.':'Wolf có thể ATTACK Performer hoặc SABOTAGE sân khấu.'}</span></div>`;
    if(g.phase==='LIVE')return g.liveResolved?`<div class="ns-v62-stage-title compact"><small>ROUND ${g.round} · LIVE RESULT</small><h2>THE SHOW MUST GO ON.</h2></div>${nsV62ScoreBoard(g)}`:`<div class="ns-v62-stage-title"><small>ROUND ${g.round}</small><h2>LIVE PERFORMANCE</h2><p>VOCAL · RAP · ACT · SUPPORT</p><span>Lựa chọn cá nhân được giữ kín cho tới khi hệ thống tổng kết.</span></div>`;
    if(g.phase==='INVESTIGATION')return `<div class="ns-v62-stage-title"><small>ROUND ${g.round}</small><h2>INVESTIGATION</h2><p>Evidence đã được gửi riêng.</p><span>Clue có thể chính xác, nhiễu hoặc bị diễn giải sai.</span></div>`;
    if(g.phase==='DISCUSSION')return `<div class="ns-v62-stage-title compact"><small>ROUND ${g.round}</small><h2>DISCUSSION</h2><p>So lời khai với LIVE và Evidence.</p></div>${g.liveResolved?nsV62ScoreBoard(g):''}`;
    if(g.phase==='VOTE')return `<div class="ns-v62-stage-title"><small>ROUND ${g.round}</small><h2>NOMINATION</h2><p>Vote chọn một người lên dàn bào chữa.</p><span>Chưa ai bị loại ở bước này.</span></div>`;
    if(g.phase==='DEFENSE'){
        const p=nsTrainPlayer(g,g.accusedId);
        const line=p?.isUser?(g.userDefense||'Bạn đang ở trên dàn. Hãy dùng 30 giây để bào chữa.'):`“${p?.team==='WOLF'?'Tôi thấy mọi người đang dựa quá nhiều vào một clue.':'Tôi có thể giải thích lựa chọn LIVE của mình. Đừng kết luận vội.'}”`;
        return `<div class="ns-v63-defense-stage"><small>ROUND ${g.round} · DEFENSE</small><h2><span id="nsV63DefenseSeconds">${nsV63DefenseRemaining(g)}</span>s</h2>${nsV63AccusedCard(g)}<p>${nsTrainEscape(line)}</p><span>Sau khi hết giờ, những người còn lại sẽ chọn THA hoặc BẮN.</span></div>`;
    }
    if(g.phase==='VERDICT')return `<div class="ns-v63-defense-stage verdict"><small>ROUND ${g.round} · FINAL VERDICT</small><h2>THA OR BẮN?</h2>${nsV63AccusedCard(g)}<p>Phiếu cuối quyết định người bị đề cử có bị loại hay quay lại sân khấu.</p><span>Hòa phiếu = THA.</span></div>`;

    const performerWin=g.winner==='PERFORMER';
    return `<div class="ns-v62-result ${performerWin?'performer':'wolf'}"><small>TRAINING RESULT · ROUND ${g.round}</small><h2>${nsTrainEscape(g.winner||'')} WIN</h2><p>${nsTrainEscape(g.winReason||'')}</p><div class="ns-v62-result-grid">${g.players.map(p=>`<div class="${p.team==='WOLF'?'wolf':''}"><span>P${p.id} · ${nsTrainEscape(p.isUser?(getCurrentUser()?.username||'YOU'):p.name)}</span><b>${nsTrainEscape(p.role)}</b></div>`).join('')}</div></div>`;
}

function nsV62Actions(g){
    const u=nsTrainUser(g);
    if(g.phase==='ROLE')return `<div class="ns-v62-one"><button data-v62-next="1" type="button">ENTER BACKSTAGE <span>›</span></button></div>`;
    if(g.phase==='BACKSTAGE'){
        prepareNightStageBackstage(g);
        if(!u.alive||u.audience)return `<div class="ns-v62-one"><button data-v62-next="1" type="button">CONTINUE <span>›</span></button></div>`;
        if(g.userActionDone)return `<div class="ns-v62-locked"><span>✓</span><div><b>ACTION LOCKED</b><small>Hành động đã được ghi nhận bí mật.</small></div></div><div class="ns-v62-one"><button data-v62-next="1" type="button">RESOLVE BACKSTAGE <span>›</span></button></div>`;
        if(u.role==='PRODUCER')return `<header class="ns-v62-action-head"><small>PRODUCER</small><b>SCAN PLAYER</b><span>Chọn một mục tiêu.</span></header><div class="ns-v62-targets">${nsV62TargetButtons(g,'producer')}</div>`;
        if(u.role==='SECURITY')return `<header class="ns-v62-action-head"><small>SECURITY</small><b>PROTECT PLAYER</b><span>Không thể bảo vệ cùng mục tiêu hai vòng liên tiếp.</span></header><div class="ns-v62-targets">${nsV62TargetButtons(g,'security')}</div>`;
        if(u.role==='SOUND ENGINEER')return `<header class="ns-v62-action-head"><small>SOUND ENGINEER</small><b>CHECK SYSTEM</b><span>Chọn một hệ.</span></header><div class="ns-v62-cards three">${['VOCAL','RAP','ACT'].map(x=>`<button type="button" data-ns-train-action="sound" data-system="${x}"><i>${x==='VOCAL'?'🎙':x==='RAP'?'〽':'◈'}</i><b>${x}</b><small>CHECK SYSTEM</small></button>`).join('')}</div>`;
        if(u.role==='BACKSTAGE WOLF')return `<header class="ns-v62-action-head wolf"><small>BACKSTAGE WOLF</small><b>SELECT ONE TEAM ACTION</b><span>${g.round===1?'Round 1: ATTACK bị khóa.':'Wolf chỉ được ATTACK người thuộc phe PERFORMER.'}</span></header><div class="ns-v62-wolf-grid"><section><button class="attack" type="button" ${g.round===1?'disabled':''}><i>⚔</i><b>ATTACK PLAYER</b><small>${g.round===1?'UNLOCKS ROUND 2':'PERFORMER ONLY'}</small></button><div class="ns-v62-targets mini ${g.round===1?'disabled':''}">${g.round===1?'':nsV62TargetButtons(g,'wolf-attack')}</div></section>${['VOCAL','RAP','ACT'].map(x=>`<button type="button" data-ns-train-action="wolf-sabotage" data-system="${x}"><i>${x==='VOCAL'?'🎙':x==='RAP'?'〽':'◈'}</i><b>SABOTAGE ${x}</b><small>Damage LIVE Integrity</small></button>`).join('')}</div>`;
        return `<header class="ns-v62-action-head"><small>${nsTrainEscape(u.role)}</small><b>NO BACKSTAGE SKILL</b><span>Role này không có skill bắt buộc.</span></header><div class="ns-v62-one"><button type="button" data-ns-train-action="skip">PASS BACKSTAGE <span>›</span></button></div>`;
    }
    if(g.phase==='LIVE'){
        if(g.liveResolved)return `<div class="ns-v62-one"><button data-v62-next="1" type="button">OPEN INVESTIGATION <span>›</span></button></div>`;
        const options=u.alive?[['VOCAL','🎙'],['RAP','〽'],['ACT','◈'],['SUPPORT','✦']]:[['CHEER','✦'],['CLAP','👏'],['LIGHTSTICK','⌁']];
        return `<header class="ns-v62-action-head"><small>${u.alive?'LIVE PERFORMANCE':'AUDIENCE'}</small><b>${u.alive?'CHOOSE YOUR PERFORMANCE':'SUPPORT THE LIVE'}</b><span>${u.alive?'Chọn đúng 1 hướng biểu diễn.':'Bạn vẫn còn mini-action dù đã bị loại.'}</span></header><div class="ns-v62-cards ${options.length===3?'three':''}">${options.map(([x,i])=>`<button type="button" data-ns-train-action="${u.alive?'live':'audience'}" data-choice="${x}"><i>${i}</i><b>${x}</b><small>${u.alive?'LOCK IN':'AUDIENCE ACTION'}</small></button>`).join('')}</div>`;
    }
    if(g.phase==='INVESTIGATION')return `<div class="ns-v62-locked"><span>▣</span><div><b>EVIDENCE RECEIVED</b><small>Mở EVIDENCE ở thanh dưới để xem clue riêng.</small></div></div><div class="ns-v62-one"><button data-v62-next="1" type="button">START DISCUSSION <span>›</span></button></div>`;
    if(g.phase==='DISCUSSION')return `<div class="ns-v62-one"><button data-v62-next="1" type="button">GO TO NOMINATION <span>›</span></button></div>`;
    if(g.phase==='VOTE'){
        if(!u.alive)return `<div class="ns-v62-one"><button data-v62-next="1" type="button">WATCH NOMINATION <span>›</span></button></div>`;
        const center=u.role==='CENTER'&&!g.centerDecisionUsed?`<button class="ns-v62-center ${g.centerBoostArmed?'armed':''}" type="button" data-ns-train-action="center-power">✦ FINAL DECISION ×2 ${g.centerBoostArmed?'· ON':''}</button>`:'';
        return `<div class="ns-v62-vote-line"><div><b>${g.userVoteTarget?`P${g.userVoteTarget} SELECTED`:'SELECT A PLAYER ABOVE'}</b><small>Người nhiều phiếu nhất chỉ được đưa lên dàn.</small></div>${center}</div><div class="ns-v62-one"><button data-v62-next="1" type="button" ${g.userVoteTarget?'':'disabled'}>CONFIRM NOMINATION <span>✓</span></button></div>`;
    }
    if(g.phase==='DEFENSE'){
        const accused=nsTrainPlayer(g,g.accusedId);
        if(accused?.isUser)return `<header class="ns-v62-action-head"><small>30-SECOND DEFENSE</small><b>BÀO CHỮA</b><span>Training lưu lời bào chữa để mô phỏng chat/voice.</span></header><textarea id="nsV63DefenseInput" class="ns-v63-defense-input" maxlength="180" placeholder="Nhập lời bào chữa ngắn...">${nsTrainEscape(g.userDefense||'')}</textarea><div class="ns-v62-locked"><span>◷</span><div><b>WAITING FOR TIMER</b><small>Hết 30 giây game tự chuyển sang phán quyết.</small></div></div>`;
        return `<div class="ns-v62-locked"><span>🎙</span><div><b>P${accused?.id||'?'} IS DEFENDING</b><small>Hết 30 giây game tự chuyển sang phán quyết.</small></div></div>`;
    }
    if(g.phase==='VERDICT'){
        const accused=nsTrainPlayer(g,g.accusedId);
        if(!u.alive||u.id===accused?.id)return `<div class="ns-v62-one"><button data-v62-next="1" type="button">REVEAL VERDICT <span>›</span></button></div>`;
        return `<header class="ns-v62-action-head"><small>FINAL VERDICT</small><b>THA OR BẮN?</b><span>Hòa phiếu = THA.</span></header><div class="ns-v63-verdict-buttons"><button class="pardon ${g.userVerdict==='PARDON'?'selected':''}" type="button" data-ns-train-action="verdict" data-choice="PARDON"><span>◇</span><b>THA</b><small>RETURN TO STAGE</small></button><button class="shoot ${g.userVerdict==='SHOOT'?'selected':''}" type="button" data-ns-train-action="verdict" data-choice="SHOOT"><span>×</span><b>BẮN</b><small>ELIMINATE</small></button></div><div class="ns-v62-one"><button data-v62-next="1" type="button" ${g.userVerdict?'':'disabled'}>LOCK VERDICT <span>✓</span></button></div>`;
    }
    return `<div class="ns-v62-one"><button data-v62-next="1" type="button">COMPLETE TRAINING <span>›</span></button></div>`;
}

function nsV63StopDefenseTimer(){if(nsV63DefenseTimer){clearInterval(nsV63DefenseTimer);nsV63DefenseTimer=null;}}
function nsV63StartDefenseTimer(g){
    nsV63StopDefenseTimer();
    const tick=()=>{
        if(!nightStageAITraining||nightStageAITraining!==g||g.phase!=='DEFENSE'){nsV63StopDefenseTimer();return;}
        const remain=nsV63DefenseRemaining(g);
        const el=document.getElementById('nsV63DefenseSeconds');if(el)el.textContent=String(remain);
        if(remain<=0){nsV63StopDefenseTimer();g.phase='VERDICT';g.phasePrepared='';renderNightStageTraining();}
    };
    tick();nsV63DefenseTimer=setInterval(tick,250);
}

function renderNightStageTraining(){
    const g=nightStageAITraining,root=$('nightStageTrainingContent');if(!g||!root)return;
    if(typeof g.drawer==='undefined')g.drawer=null;if(typeof g.notes!=='string')g.notes='';
    if(g.phase==='INVESTIGATION'&&!g._v62EvidenceOpened){g._v62EvidenceOpened=true;g.drawer='evidence';}
    if(g.phase!=='DISCUSSION')g._v62SpeakerId=null;if(g.phase==='DISCUSSION')generateNightStageDiscussion(g);
    const alive=nsTrainAlive(g).length,wolfAlive=nsTrainAlive(g).filter(p=>p.team==='WOLF').length;
    const performerAlive=nsTrainAlive(g).filter(p=>p.team==='PERFORMER').length;
    const faction=getNightStageFaction(getCurrentUser?.());const ticker=g.publicLog?.slice(-1)[0]||'NIGHT STAGE READY.';
    root.innerHTML=`<div class="ns-v62-match ns-v63-ten phase-${String(g.phase||'').toLowerCase()} ${g.drawer?'drawer-open':''}">
      <header class="ns-v62-hud"><div class="ns-v62-brand"><small>REALYZE!!</small><strong>NIGHT STAGE</strong><span>WHO KILLED THE LIVE?</span></div><div class="ns-v62-round"><small>ROUND ${g.round}</small><strong>${nsV62PhaseLabel(g.phase)}</strong><span>${g.phase==='DEFENSE'?`${nsV63DefenseRemaining(g)}s`:g.phase==='BACKSTAGE'?'00:28':g.phase==='DISCUSSION'?'01:24':g.phase==='VERDICT'?'FINAL':'TRAINING'}</span></div><div class="ns-v62-right"><div class="ns-v62-integrity"><div><small>LIVE INTEGRITY</small><strong>${Math.max(0,Math.round(g.integrity))}%</strong></div><span><i style="width:${Math.max(0,Math.min(100,g.integrity))}%"></i></span><em>${alive} / ${g.players.length} ON STAGE</em></div><div class="ns-v62-faction"><small>IDOL FACTION</small><b>${faction?nsTrainEscape(faction.name):'NONE'}</b></div></div></header>
      <main class="ns-v62-stage-zone ns-v63-stage-zone">${nsV62PlayerGrid(g)}<section class="ns-v62-main-stage"><div class="ns-v62-gridlines"></div>${nsV62Stage(g)}</section>${nsV62EvidenceDrawer(g)}${nsV62RoleDrawer(g)}${nsV62NotesDrawer(g)}</main>
      <section class="ns-v62-controls"><div class="ns-v62-ticker"><span>LIVE LOG</span><p>${nsTrainEscape(ticker)}</p><b>${wolfAlive} WOLF · ${performerAlive} PERFORMER</b></div>${nsV62Discussion(g)}<div class="ns-v62-action-box">${nsV62Actions(g)}</div></section>
      <nav class="ns-v62-nav"><button type="button" data-v62-drawer="evidence" class="${g.drawer==='evidence'?'active':''}" ${['INVESTIGATION','DISCUSSION','VOTE','DEFENSE','VERDICT','RESULT'].includes(g.phase)?'':'disabled'}><span>▣</span><b>EVIDENCE</b></button><button type="button" data-v62-drawer="role" class="${g.drawer==='role'?'active':''}"><span>◈</span><b>MY ROLE</b></button><button type="button" data-v62-drawer="notes" class="${g.drawer==='notes'?'active':''}"><span>▤</span><b>NOTES</b></button><div class="ns-v62-nav-center"><span>NO ROUND LIMIT</span><b>${nsTrainEscape(nsV62FactionLabel())}</b></div><button type="button" data-v62-new="1"><span>↻</span><b>NEW GAME</b></button></nav>
    </div>`;
    root.querySelectorAll('[data-ns-train-action]').forEach(btn=>btn.addEventListener('click',()=>applyNightStageTrainingAction(btn)));
    root.querySelectorAll('[data-v62-next]').forEach(btn=>btn.addEventListener('click',advanceNightStageTraining));
    root.querySelectorAll('[data-v62-drawer]').forEach(btn=>btn.addEventListener('click',()=>{const w=btn.dataset.v62Drawer||null;g.drawer=g.drawer===w?null:w;renderNightStageTraining();}));
    root.querySelectorAll('[data-v62-new]').forEach(btn=>btn.addEventListener('click',()=>{nsV63StopDefenseTimer();nightStageAITraining=createNightStageAITraining();renderNightStageTraining();}));
    root.querySelectorAll('[data-v62-copy-evidence]').forEach(btn=>btn.addEventListener('click',()=>{generateNightStageTrainingEvidence(g);const clue=g.userEvidence?.[0]||'';if(clue&&!g.notes.includes(clue))g.notes=(g.notes?g.notes+'\n':'')+clue;g.drawer='notes';renderNightStageTraining();}));
    const note=root.querySelector('#nightStageTrainingNotes');if(note)note.addEventListener('input',()=>{g.notes=note.value;});
    const defense=root.querySelector('#nsV63DefenseInput');if(defense)defense.addEventListener('input',()=>{g.userDefense=defense.value;});
    if(g.phase==='DEFENSE')nsV63StartDefenseTimer(g);else nsV63StopDefenseTimer();
}

function advanceNightStageTraining(){
    const g=nightStageAITraining;if(!g)return;g.drawer=null;
    if(g.phase==='ROLE'){g.phase='BACKSTAGE';g.phasePrepared='';}
    else if(g.phase==='BACKSTAGE'){if(!g.userActionDone&&nsTrainUser(g).alive&&!nsTrainUser(g).audience)return;resolveNightStageBackstage(g);}
    else if(g.phase==='LIVE'){if(!g.liveResolved)return;g.phase='INVESTIGATION';g.phasePrepared='';g._v62EvidenceOpened=false;}
    else if(g.phase==='INVESTIGATION'){g.phase='DISCUSSION';g.phasePrepared='';}
    else if(g.phase==='DISCUSSION'){g.phase='VOTE';g.phasePrepared='';}
    else if(g.phase==='VOTE'){if(nsTrainUser(g).alive&&!g.userVoteTarget)return;resolveNightStageTrainingVote(g);g._v62EvidenceOpened=false;}
    else if(g.phase==='DEFENSE'){return;}
    else if(g.phase==='VERDICT'){
        const accused=nsTrainPlayer(g,g.accusedId),u=nsTrainUser(g);
        if(u.alive&&u.id!==accused?.id&&!g.userVerdict)return;
        resolveNightStageTrainingVerdict(g);
    }
    else if(g.phase==='RESULT'){finishNightStageTraining();return;}
    renderNightStageTraining();
}

function renderNightStageFactionSelection(user){
    const selected=user?.nightStageFaction||'';
    document.querySelectorAll('[data-night-faction]').forEach(button=>{
        const mine=button.dataset.nightFaction===selected;
        button.classList.toggle('selected',mine);
        button.classList.toggle('locked',Boolean(selected));
        button.disabled=Boolean(selected);
        const label=button.querySelector('b');if(label)label.textContent=selected?(mine?'LOCKED · YOUR FACTION':'LOCKED'):`CHỌN ${String(button.dataset.nightFaction||'').toUpperCase()}`;
    });
}

function nsV63RenderModeFactionLock(){
    const el=$('nightStageModeFactionLock');if(!el)return;
    const f=getNightStageFaction(getCurrentUser?.());
    el.innerHTML=f?`<span>🔒 IDOL FACTION LOCKED</span><b>${nsTrainEscape(f.fullName||f.name)} · ${nsTrainEscape(f.type)}</b>`:`<span>CHƯA CHỌN PHE</span><b>Chọn phe trước khi vào mode.</b>`;
}

/* ---------------- ONLINE CORE ---------------- */
const NS_V63_CHARACTERS={
    mystery:{name:'NGƯỜI BÍ ẨN',image:''},lumina:{name:'LUMINA',image:'assets/lumina.png'},akito:{name:'AKITO',image:'assets/akito.png'},kohane:{name:'KOHANE',image:'assets/kohane.png'},
    miku:{name:'HATSUNE MIKU',image:'assets/miku.png'},miku6:{name:'HATSUNE MIKU',image:'assets/miku1.png'},shota:{name:'SHOTA',image:'assets/shota.png'},rui:{name:'RUI KAMISHIRO',image:'assets/rui.png'},ichika:{name:'ICHIKA',image:'assets/ichika.png'},
    touya:{name:'TOUYA',image:'assets/beginning_touya.png'},airi:{name:'AIRI',image:'assets/beginning_airi.png'},akito4:{name:'AKITO',image:'assets/beginning_akito.png'},shiho:{name:'HINOMORI SHIHO',image:'assets/shiho1.png'},nene:{name:'KUSANAGI NENE',image:'assets/nene1.png'},
    ns_akito:{name:'SHINONOME AKITO',image:'assets/akito2.png'},ns_an:{name:'SHIRAISHI AN',image:'assets/an2.png'},ns_saki:{name:'TENMA SAKI',image:'assets/saki2.png'},saki:{name:'TENMA SAKI',image:'assets/saki1.png'},luka:{name:'MEGURINE LUKA',image:'assets/luka1.png'}
};

const nsV63Online={
    selectedCharacter:'mystery',snapshot:null,invites:[],pollTimer:null,matchPollTimer:null,
    channel:null,meId:null,presenceIds:new Set(),peers:new Map(),remoteAudios:new Map(),remoteStreams:new Map(),
    localStream:null,audioContext:null,analysers:new Map(),speakerTimer:null,speakingIds:new Set(),
    chat:[],lastChatAt:0,music:null,musicOn:true,musicPrimed:false,musicSourceIndex:0,musicError:'',
    inviteFeedback:null,setupBusy:false,voiceEnabled:false,renderSignature:''
};

function nsV63Db(){return window.REALYZE_DB||null;}
async function nsV63Rpc(name,args={}){const d=nsV63Db();if(!d)throw new Error('Supabase chưa sẵn sàng.');const {data,error}=await d.rpc(name,args);if(error)throw error;return data;}
function nsV63CharInfo(id){return NS_V63_CHARACTERS[id]||{name:String(id||'CHARACTER').toUpperCase(),image:''};}
function nsV63OwnedCharacters(){
    const u=getCurrentUser?.()||{};let ids=Array.isArray(u.myCharacters)?u.myCharacters.filter(Boolean):[];
    const selected=u.selectedCharacterId||u.lobbyCharacterId;if(selected&&!ids.includes(selected))ids.unshift(selected);
    if(!ids.length)ids=['mystery'];return [...new Set(ids)];
}
function nsV63LoadRepresentative(){
    const saved=localStorage.getItem('realyze_ns_representative');const owned=nsV63OwnedCharacters();
    nsV63Online.selectedCharacter=owned.includes(saved)?saved:(owned.includes(getCurrentUser?.()?.selectedCharacterId)?getCurrentUser().selectedCharacterId:owned[0]);
}
function nsV63SaveRepresentative(id){if(!nsV63OwnedCharacters().includes(id))return;nsV63Online.selectedCharacter=id;localStorage.setItem('realyze_ns_representative',id);}
function nsV63PlayerImage(characterId){return nsV63CharInfo(characterId).image||'assets/miku1.png';}

async function nsV63LoadInvites(){
    try{const data=await nsV63Rpc('night_stage_get_invites');nsV63Online.invites=Array.isArray(data)?data:[];}catch(e){console.warn('NS invites',e);nsV63Online.invites=[];}
}

function nsV63CharacterPickerHtml(){
    return `<div class="ns-v63-char-grid">${nsV63OwnedCharacters().map(id=>{const c=nsV63CharInfo(id),sel=id===nsV63Online.selectedCharacter;return `<button type="button" class="${sel?'selected':''}" data-v63-char="${nsTrainEscape(id)}"><div>${c.image?`<img src="${c.image}" alt="">`:'<span>?</span>'}</div><b>${nsTrainEscape(c.name)}</b><small>${sel?'REPRESENTATIVE':'SELECT'}</small></button>`;}).join('')}</div>`;
}

function nsV63RoomRoster(snapshot){
    const players=Array.isArray(snapshot?.players)?snapshot.players:[];
    const bySeat={};
    players.forEach((p,index)=>{
        let seat=Number(p?.seat);
        // Legacy-safe fallback: if a stale snapshot ever omitted seat, still show the player.
        if(!Number.isInteger(seat)||seat<1||seat>10){
            const firstFree=Array.from({length:10},(_,i)=>i+1).find(n=>!bySeat[n]);
            seat=firstFree||Math.min(10,index+1);
        }
        bySeat[seat]=p;
    });
    return `<div class="ns-v63-room-roster">${Array.from({length:10},(_,i)=>{const seat=i+1,p=bySeat[seat];if(!p)return `<div class="empty"><span>P${seat}</span><b>WAITING</b></div>`;const c=nsV63CharInfo(p.character_id);return `<div class="${p.active?'occupied':'left'}"><span>P${seat}</span><div>${c.image?`<img src="${c.image}" alt="">`:'?'}</div><b>${nsTrainEscape(p.username)}</b><small>${p.active?'READY':'LEFT'}</small></div>`;}).join('')}</div>`;
}

function nsV63PublicCountdown(room){
    if(!room?.fill_deadline)return 'WAITING FOR 8 PLAYERS';
    const t=Math.max(0,Math.ceil((new Date(room.fill_deadline).getTime()-Date.now())/1000));return t>0?`8+ FOUND · FILLING TO 10 · ${t}s`:'STARTING...';
}

function renderNightStageOnlineSetup(){
    const root=$('nightStageOnlineContent');if(!root)return;const snap=nsV63Online.snapshot,room=snap?.room,players=snap?.players||[],u=getCurrentUser?.()||{};
    const friends=Array.isArray(u.friends)?u.friends:[];
    if(room&&room.status==='waiting'){
        const isHost=room.host_id&&String(room.host_id)===String(u._supabaseId||nsV63Online.meId||'');
        const inviteFeedback=(nsV63Online.inviteFeedback&&Number(nsV63Online.inviteFeedback.until)>Date.now())
            ? `<div class="ns-v65-invite-feedback"><span>✓</span><b>${nsTrainEscape(nsV63Online.inviteFeedback.text||'Đã gửi lời mời.')}</b></div>`
            : '';
        const bgmStatus=nsV63Online.musicError
            ? `<div class="ns-v65-bgm-status error">⚠ ${nsTrainEscape(nsV63Online.musicError)}</div>`
            : `<div class="ns-v65-bgm-status">♫ WOLF BGM READY · PHÁT KHI TRẬN BẮT ĐẦU</div>`;
        root.innerHTML=`<header class="ns-v63-online-head"><small>REALYZE!! · NIGHT STAGE ONLINE</small><h2>${room.kind==='friend'?'FRIEND ROOM':'PUBLIC MATCHMAKING'}</h2><p>${room.kind==='friend'?`ROOM CODE · ${nsTrainEscape(room.code)}`:nsV63PublicCountdown(room)}</p></header>${nsV63RoomRoster(snap)}<div class="ns-v63-room-footer"><div><small>PLAYERS</small><strong>${players.filter(p=>p.active).length} / 10</strong><span>MINIMUM 8 TO START</span></div>${room.kind==='friend'&&isHost?`<button id="nsV63StartFriend" type="button" ${players.filter(p=>p.active).length>=8?'':'disabled'}>START ROOM</button>`:''}<button id="nsV63LeaveLobby" class="ghost" type="button">LEAVE ROOM</button></div>${bgmStatus}${room.kind==='friend'?`<section class="ns-v63-friend-invite"><header><b>INVITE FRIENDS</b><small>Chỉ hiển thị danh sách bạn bè hiện tại.</small></header>${inviteFeedback}<div>${friends.length?friends.map(n=>`<button type="button" data-v63-invite="${nsTrainEscape(n)}"><span>${nsTrainEscape(String(n).slice(0,1).toUpperCase())}</span><b>${nsTrainEscape(n)}</b><small>INVITE</small></button>`).join(''):'<p>Chưa có bạn bè để mời.</p>'}</div></section>`:''}`;
    }else{
        const invites=nsV63Online.invites;
        root.innerHTML=`<header class="ns-v63-online-head"><small>REALYZE!! · NIGHT STAGE ONLINE</small><h2>CHOOSE YOUR REPRESENTATIVE</h2><p>Character chỉ dùng để hiển thị trong trận. Role vẫn được chia bí mật.</p></header>${nsV63CharacterPickerHtml()}${invites.length?`<section class="ns-v63-invites"><header><b>FRIEND INVITES</b><span>${invites.length}</span></header>${invites.map(x=>`<article><div><small>FROM</small><b>${nsTrainEscape(x.inviter)}</b><span>ROOM ${nsTrainEscape(x.room_code)}</span></div><button data-v63-accept="${x.id}">JOIN</button><button class="ghost" data-v63-decline="${x.id}">DECLINE</button></article>`).join('')}</section>`:''}<div class="ns-v63-online-modes"><button id="nsV63PublicQueue" class="public" type="button"><span>◉</span><div><small>8–10 PLAYERS</small><b>PUBLIC MATCHMAKING</b><p>Tự ghép. Khi đủ 8 người, chờ thêm 10 giây để fill tối đa 10.</p></div></button><button id="nsV63CreateFriend" class="friend" type="button"><span>♧</span><div><small>PRIVATE</small><b>CREATE FRIEND ROOM</b><p>Tạo mã phòng và mời bạn bè. Host có thể start khi đủ 8.</p></div></button></div><div class="ns-v63-join-code"><input id="nsV63RoomCode" maxlength="6" placeholder="ROOM CODE"><button id="nsV63JoinFriend" type="button">JOIN FRIEND ROOM</button></div><p class="ns-v63-online-note">VOICE CHAT beta dùng WebRTC. Trình duyệt sẽ hỏi quyền Microphone khi bạn bật Mic.</p>`;
    }
    nsV63BindOnlineSetupControls();
}

function nsV63BindOnlineSetupControls(){
    const root=$('nightStageOnlineContent');if(!root)return;
    root.querySelectorAll('[data-v63-char]').forEach(b=>b.onclick=()=>{nsV63SaveRepresentative(b.dataset.v63Char);renderNightStageOnlineSetup();});
    const busy=async(fn)=>{if(nsV63Online.setupBusy)return;nsV63Online.setupBusy=true;try{await fn();}catch(e){console.error(e);showNightStageToast('NIGHT STAGE ONLINE',e.message||String(e));}finally{nsV63Online.setupBusy=false;}};
    root.querySelector('#nsV63PublicQueue')?.addEventListener('click',()=>{nsV65PrimeMusic();busy(async()=>{nsV63Online.snapshot=await nsV63Rpc('night_stage_join_public_queue',{p_character_id:nsV63Online.selectedCharacter});renderNightStageOnlineSetup();nsV63StartRoomPoll();});});
    root.querySelector('#nsV63CreateFriend')?.addEventListener('click',()=>{nsV65PrimeMusic();busy(async()=>{nsV63Online.snapshot=await nsV63Rpc('night_stage_create_friend_room',{p_character_id:nsV63Online.selectedCharacter});renderNightStageOnlineSetup();nsV63StartRoomPoll();});});
    root.querySelector('#nsV63JoinFriend')?.addEventListener('click',()=>{nsV65PrimeMusic();busy(async()=>{const code=String(root.querySelector('#nsV63RoomCode')?.value||'').trim();if(code.length<4)throw new Error('Nhập ROOM CODE.');nsV63Online.snapshot=await nsV63Rpc('night_stage_join_friend_room',{p_code:code,p_character_id:nsV63Online.selectedCharacter});renderNightStageOnlineSetup();nsV63StartRoomPoll();});});
    root.querySelector('#nsV63StartFriend')?.addEventListener('click',()=>busy(async()=>{nsV63Online.snapshot=await nsV63Rpc('night_stage_start_friend_room',{p_room_id:nsV63Online.snapshot.room.id});await nsV63MaybeEnterMatch();}));
    root.querySelector('#nsV63LeaveLobby')?.addEventListener('click',()=>busy(async()=>{await nsV63LeaveWaitingRoom();}));
    root.querySelectorAll('[data-v63-invite]').forEach(b=>b.onclick=()=>busy(async()=>{
        const friend=b.dataset.v63Invite;
        await nsV63Rpc('night_stage_invite_friend',{p_room_id:nsV63Online.snapshot.room.id,p_target_username:friend});
        nsV63Online.inviteFeedback={text:`Đã mời ${friend}.`,until:Date.now()+4500};
        showNightStageToast('FRIEND INVITE',`Đã mời ${friend}.`);
        renderNightStageOnlineSetup();
        setTimeout(()=>{
            if(nsV63Online.inviteFeedback&&Date.now()>=Number(nsV63Online.inviteFeedback.until||0)){
                nsV63Online.inviteFeedback=null;
                if(nsV63Online.snapshot?.room?.status==='waiting')renderNightStageOnlineSetup();
            }
        },4700);
    }));
    root.querySelectorAll('[data-v63-accept]').forEach(b=>b.onclick=()=>busy(async()=>{nsV63Online.snapshot=await nsV63Rpc('night_stage_accept_invite',{p_invite_id:b.dataset.v63Accept,p_character_id:nsV63Online.selectedCharacter});renderNightStageOnlineSetup();nsV63StartRoomPoll();}));
    root.querySelectorAll('[data-v63-decline]').forEach(b=>b.onclick=()=>busy(async()=>{await nsV63Rpc('night_stage_decline_invite',{p_invite_id:b.dataset.v63Decline});await nsV63LoadInvites();renderNightStageOnlineSetup();}));
}

async function nsV63OpenOnlineSetup(){
    closeNightStageModal('nightStageModeOverlay');
    nsV63LoadRepresentative();
    try{const {data}=await nsV63Db()?.auth?.getSession?.();nsV63Online.meId=data?.session?.user?.id||getCurrentUser?.()?._supabaseId||null;}catch(_){nsV63Online.meId=getCurrentUser?.()?._supabaseId||null;}
    await nsV63LoadInvites();
    nsV63Online.snapshot=null;renderNightStageOnlineSetup();openNightStageModal('nightStagePlayerPreview');
}

async function nsV63LeaveWaitingRoom(){
    clearTimeout(nsV63Online.pollTimer);nsV63Online.pollTimer=null;
    const id=nsV63Online.snapshot?.room?.id;if(id)try{await nsV63Rpc('night_stage_leave_lobby',{p_room_id:id});}catch(e){console.warn(e);}
    nsV63StopMusic();nsV63Online.inviteFeedback=null;
    nsV63Online.snapshot=null;closeNightStageModal('nightStagePlayerPreview');openNightStageModal('nightStageModeOverlay');nsV63RenderModeFactionLock();
}

function nsV63StartRoomPoll(){
    clearTimeout(nsV63Online.pollTimer);
    const tick=async()=>{
        const id=nsV63Online.snapshot?.room?.id;if(!id)return;
        try{nsV63Online.snapshot=await nsV63Rpc('night_stage_touch_room',{p_room_id:id});if(await nsV63MaybeEnterMatch())return;renderNightStageOnlineSetup();}
        catch(e){console.warn('NS room poll',e);}
        nsV63Online.pollTimer=setTimeout(tick,1100);
    };
    nsV63Online.pollTimer=setTimeout(tick,700);
}

async function nsV63MaybeEnterMatch(){
    const s=nsV63Online.snapshot;if(!s?.room)return false;
    if(s.room.status==='playing'||s.room.status==='pause_vote'||s.room.status==='ended'){
        clearTimeout(nsV63Online.pollTimer);closeNightStageModal('nightStagePlayerPreview');openNightStageModal('nightStageOnlineMatchOverlay');
        await nsV63EnterOnlineMatch(s);return true;
    }
    return false;
}

function nsV63OnlinePlayerCards(s){
    const bySeat=Object.fromEntries((s.players||[]).map(p=>[Number(p.seat),p]));
    return `<div class="ns-v63-match-roster">${Array.from({length:10},(_,i)=>{const seat=i+1,p=bySeat[seat];if(!p)return `<div class="seat empty"><span>P${seat}</span><b>EMPTY</b></div>`;const c=nsV63CharInfo(p.character_id),me=p.user_id===nsV63Online.meId,online=nsV63Online.presenceIds.has(String(p.user_id)),speaking=nsV63Online.speakingIds.has(String(p.user_id));return `<div class="seat ${me?'me':''} ${!p.active?'left':''} ${online?'online':''} ${speaking?'speaking':''}" data-user-id="${p.user_id}"><span>P${seat}${me?' · YOU':''}</span><div>${c.image?`<img src="${c.image}" alt="">`:'?'}</div><b>${nsTrainEscape(p.username)}</b><small>${!p.active?'LEFT':speaking?'SPEAKING':online?'VOICE ONLINE':'CONNECTED'}</small></div>`;}).join('')}</div>`;
}

function nsV63OnlineChatHtml(){return nsV63Online.chat.slice(-8).map(m=>`<p><b>${nsTrainEscape(m.username||'PLAYER')}</b><span>${nsTrainEscape(m.text||'')}</span></p>`).join('')||'<p class="empty">Chat room ready.</p>';}

function nsV63ContinuationHtml(s){
    if(s.room.status!=='pause_vote')return '';
    const start=new Date(s.room.pause_started_at||Date.now()).getTime();const left=Math.max(0,20-Math.floor((Date.now()-start)/1000));
    return `<div class="ns-v63-continue-vote"><small>MỘT PLAYER ĐÃ RỜI TRẬN</small><h3>CHƠI TIẾP HAY DỪNG?</h3><p>Những người còn lại bỏ phiếu. Sau <span id="nsV63ContinueSeconds">${left}</span>s, lựa chọn nhiều hơn sẽ quyết định; hòa = dừng.</p><div><button data-v63-continue="1">TIẾP TỤC</button><button class="stop" data-v63-continue="0">DỪNG TRẬN</button></div></div>`;
}

function nsV63OnlineSignature(s){
    if(!s?.room)return '';
    return JSON.stringify({
        status:s.room.status,phase:s.room.phase,round:s.room.round_no,integrity:s.room.live_integrity,
        winner:s.room.winner||'',reason:s.room.win_reason||'',pause:s.room.pause_started_at||'',
        role:s.my_role||'',team:s.my_team||'',
        players:(s.players||[]).map(p=>[p.user_id,p.seat,p.active,p.character_id,p.username])
    });
}

function renderNightStageOnlineMatch(){
    const root=$('nightStageOnlineMatchContent'),s=nsV63Online.snapshot;if(!root||!s?.room)return;
    nsV63Online.renderSignature=nsV63OnlineSignature(s);
    const room=s.room,role=s.my_role||'ASSIGNING...',team=s.my_team||'...';
    const ended=room.status==='ended';
    root.innerHTML=`<div class="ns-v63-online-match"><header><div><small>REALYZE!!</small><b>NIGHT STAGE</b><span>ROOM ${nsTrainEscape(room.code)} · ${String(room.kind||'').toUpperCase()}</span></div><section><small>ROUND ${room.round_no||1}</small><strong>${ended?'RESULT':room.status==='pause_vote'?'PAUSED · CONTINUE VOTE':room.phase||'ROLE REVEAL'}</strong><span>ONLINE BETA</span></section><div class="integrity"><small>LIVE INTEGRITY</small><b>${Number(room.live_integrity||100)}%</b><i><em style="width:${Math.max(0,Math.min(100,Number(room.live_integrity||100)))}%"></em></i></div></header>${ended?`<main class="ns-v63-online-result"><small>MATCH ENDED</small><h2>${room.winner?`${nsTrainEscape(room.winner)} WIN`:'MATCH STOPPED'}</h2><p>${nsTrainEscape(room.win_reason||'')}</p><button id="nsV63OnlineResultBack">BACK TO NIGHT STAGE</button></main>`:`<main><section class="ns-v63-online-stage"><div class="role"><small>YOUR SECRET IDENTITY</small><h2>${nsTrainEscape(role)}</h2><b class="${team==='WOLF'?'wolf':'performer'}">${nsTrainEscape(team)}</b><p>Representative Character chỉ để hiển thị. Role được server chia bí mật.</p></div>${nsV63OnlinePlayerCards(s)}</section><section class="ns-v63-online-comms"><div class="voice"><header><b>VOICE CHAT</b><small>WEBRTC BETA</small></header><p id="nsV63VoiceStatus">${nsV63Online.voiceEnabled?'MIC ON · PEER-TO-PEER VOICE ACTIVE':nsV63Online.localStream?'MIC MUTED · CLICK TO SPEAK':'CLICK ENABLE MIC TO SPEAK'}</p><div><button id="nsV63MicButton" class="${nsV63Online.voiceEnabled?'on':''}">${nsV63Online.voiceEnabled?'MIC ON':nsV63Online.localStream?'MIC MUTED':'ENABLE MIC'}</button><button id="nsV63MusicButton">${nsV63Online.musicOn?'MUSIC AUTO-DUCK':'MUSIC OFF'}</button></div></div><div class="chat"><header><b>TEXT CHAT</b><small>REALTIME</small></header><div id="nsV63ChatLog">${nsV63OnlineChatHtml()}</div><form id="nsV63ChatForm"><input id="nsV63ChatInput" maxlength="240" autocomplete="off" placeholder="Nhắn cho phòng..."><button>SEND</button></form></div></section></main>${nsV63ContinuationHtml(s)}<footer><span>8–10 PLAYERS · VOICE + CHAT FOUNDATION</span><b>Gameplay Online sẽ dùng cùng luật Training mới.</b></footer>`}</div>`;
    nsV63BindOnlineMatchControls();
}

function nsV63BindOnlineMatchControls(){
    const root=$('nightStageOnlineMatchContent');if(!root)return;
    root.querySelector('#nsV63MicButton')?.addEventListener('click',()=>nsV63ToggleMic());
    root.querySelector('#nsV63MusicButton')?.addEventListener('click',()=>{
        nsV63Online.musicOn=!nsV63Online.musicOn;
        if(nsV63Online.musicOn)nsV63StartMusic();else if(nsV63Online.music)nsV63Online.music.pause();
        renderNightStageOnlineMatch();
    });
    root.querySelector('#nsV63ChatForm')?.addEventListener('submit',e=>{e.preventDefault();const input=root.querySelector('#nsV63ChatInput');nsV63SendChat(input?.value||'');if(input)input.value='';});
    root.querySelectorAll('[data-v63-continue]').forEach(b=>b.onclick=async()=>{try{await nsV63Rpc('night_stage_vote_continue',{p_room_id:nsV63Online.snapshot.room.id,p_continue:b.dataset.v63Continue==='1'});await nsV63PollOnlineMatchOnce();}catch(e){showNightStageToast('CONTINUE VOTE',e.message);}});
    root.querySelector('#nsV63OnlineResultBack')?.addEventListener('click',()=>{nsV63CleanupOnlineRealtime();closeNightStageModal('nightStageOnlineMatchOverlay');showScreen('nightStageScreen');});
}

async function nsV63EnterOnlineMatch(snapshot){
    nsV63Online.snapshot=snapshot;const d=nsV63Db();
    try{const {data}=await d.auth.getSession();nsV63Online.meId=data?.session?.user?.id||getCurrentUser()?._supabaseId||null;}catch(_){nsV63Online.meId=getCurrentUser()?._supabaseId||null;}
    renderNightStageOnlineMatch();nsV63StartMusic();await nsV63SetupRealtime();nsV63StartOnlineMatchPoll();
}

const NS_V65_MUSIC_SOURCES=['wolf.mp3','assets/wolf.mp3'];
function nsV65EnsureMusic(){
    if(nsV63Online.music)return nsV63Online.music;
    const audio=new Audio();
    audio.loop=true;audio.preload='auto';audio.volume=.001;
    nsV63Online.music=audio;nsV63Online.musicSourceIndex=0;nsV63Online.musicError='';
    const loadSource=index=>{
        nsV63Online.musicSourceIndex=index;
        audio.src=NS_V65_MUSIC_SOURCES[index];
        try{audio.load();}catch(_){ }
    };
    audio.addEventListener('error',()=>{
        const next=Number(nsV63Online.musicSourceIndex||0)+1;
        if(next<NS_V65_MUSIC_SOURCES.length){
            loadSource(next);
            if(nsV63Online.musicPrimed||nsV63Online.snapshot?.room?.status==='playing')audio.play().catch(()=>{});
        }else{
            nsV63Online.musicError='Không tìm thấy wolf.mp3. Đặt file ở /wolf.mp3 hoặc /assets/wolf.mp3.';
            console.warn('NIGHT STAGE MUSIC:',nsV63Online.musicError);
        }
    });
    loadSource(0);
    return audio;
}
function nsV65PrimeMusic(){
    // Called from the user's JOIN / CREATE click. It plays virtually silent while
    // matchmaking, preserving browser audio permission for the later room transition.
    const audio=nsV65EnsureMusic();
    if(!nsV63Online.musicOn)return;
    nsV63Online.musicPrimed=true;audio.volume=.001;
    audio.play().catch(err=>console.warn('NIGHT STAGE MUSIC PRIME:',err?.message||err));
}
function nsV63StartMusic(){
    const audio=nsV65EnsureMusic();
    if(!nsV63Online.musicOn)return;
    nsV63Online.musicPrimed=true;audio.volume=.18;
    audio.play().catch(err=>{
        nsV63Online.musicError='Trình duyệt đang chặn autoplay. Bấm MUSIC trong trận để bật.';
        console.warn('NIGHT STAGE MUSIC PLAY:',err?.message||err);
    });
}
function nsV63StopMusic(){
    if(nsV63Online.music){try{nsV63Online.music.pause();nsV63Online.music.currentTime=0;}catch(_){ }}
    nsV63Online.musicPrimed=false;
}

async function nsV63SetupRealtime(){
    const d=nsV63Db(),roomId=nsV63Online.snapshot?.room?.id,me=String(nsV63Online.meId||'');if(!d||!roomId||!me)return;
    if(nsV63Online.channel){try{await nsV63Online.channel.unsubscribe();}catch(_){}}
    nsV63Online.presenceIds=new Set([me]);
    const ch=d.channel(`night-stage-room:${roomId}`,{config:{broadcast:{self:false},presence:{key:me}}});nsV63Online.channel=ch;
    ch.on('presence',{event:'sync'},()=>{const state=ch.presenceState();const ids=new Set(Object.keys(state||{}).map(String));ids.add(me);nsV63Online.presenceIds=ids;nsV63SyncPeersFromPresence();nsV63RefreshOnlineRoster();});
    ch.on('broadcast',{event:'ns-chat'},msg=>{const m=msg?.payload||msg;if(!m||String(m.from)===me)return;nsV63Online.chat.push(m);nsV63RefreshChat();});
    ch.on('broadcast',{event:'ns-signal'},msg=>nsV63HandleSignal(msg?.payload||msg));
    await new Promise(resolve=>{
        let finished=false;
        const done=()=>{if(finished)return;finished=true;clearTimeout(timer);resolve();};
        const timer=setTimeout(()=>{console.warn('NIGHT STAGE Realtime timeout — room polling remains active.');done();},5000);
        ch.subscribe(async status=>{
            if(status==='SUBSCRIBED'){
                try{await ch.track({user_id:me,username:getCurrentUser()?.username||'PLAYER',character_id:nsV63Online.selectedCharacter,online_at:new Date().toISOString()});}catch(_){}
                done();
            }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
                console.warn('NIGHT STAGE Realtime:',status);done();
            }
        });
    });
}

function nsV63Signal(to,payload){const ch=nsV63Online.channel;if(!ch)return Promise.resolve();return ch.send({type:'broadcast',event:'ns-signal',payload:{from:String(nsV63Online.meId),to:String(to),...payload}});}
function nsV63PeerConfig(){
    const extra=Array.isArray(window.NIGHT_STAGE_ICE_SERVERS)?window.NIGHT_STAGE_ICE_SERVERS:[];
    return {iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},...extra]};
}

function nsV63GetPeer(peerId){
    peerId=String(peerId);if(nsV63Online.peers.has(peerId))return nsV63Online.peers.get(peerId);
    const pc=new RTCPeerConnection(nsV63PeerConfig());
    const trans=pc.addTransceiver('audio',{direction:'sendrecv'});
    if(nsV63Online.localStream?.getAudioTracks?.()[0])trans.sender.replaceTrack(nsV63Online.localStream.getAudioTracks()[0]).catch(()=>{});
    pc.onicecandidate=e=>{if(e.candidate)nsV63Signal(peerId,{kind:'ice',candidate:e.candidate.toJSON()});};
    pc.ontrack=e=>{const stream=e.streams?.[0]||new MediaStream([e.track]);nsV63AttachRemoteAudio(peerId,stream);};
    pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState))nsV63DropPeer(peerId);};
    nsV63Online.peers.set(peerId,pc);return pc;
}

async function nsV63CreateOffer(peerId){
    const pc=nsV63GetPeer(peerId);if(pc.signalingState!=='stable')return;
    const offer=await pc.createOffer();await pc.setLocalDescription(offer);await nsV63Signal(peerId,{kind:'offer',sdp:pc.localDescription});
}

async function nsV63HandleSignal(data){
    const me=String(nsV63Online.meId||'');if(!data||String(data.to)!==me||String(data.from)===me)return;
    const peerId=String(data.from);try{
        const pc=nsV63GetPeer(peerId);
        if(data.kind==='offer'){
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await nsV63Signal(peerId,{kind:'answer',sdp:pc.localDescription});
        }else if(data.kind==='answer'){
            if(pc.signalingState==='have-local-offer')await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }else if(data.kind==='ice'&&data.candidate){
            try{await pc.addIceCandidate(new RTCIceCandidate(data.candidate));}catch(_){ }
        }
    }catch(e){console.warn('NS WebRTC signal',e);}
}

function nsV63SyncPeersFromPresence(){
    const me=String(nsV63Online.meId||'');
    for(const id of nsV63Online.presenceIds){if(id===me)continue;if(!nsV63Online.peers.has(id)&&me.localeCompare(id)<0)nsV63CreateOffer(id).catch(e=>console.warn(e));}
    for(const id of [...nsV63Online.peers.keys()])if(!nsV63Online.presenceIds.has(id))nsV63DropPeer(id);
}

function nsV63DropPeer(peerId){
    const pc=nsV63Online.peers.get(peerId);try{pc?.close();}catch(_){ }
    nsV63Online.peers.delete(peerId);const a=nsV63Online.remoteAudios.get(peerId);if(a){a.remove();nsV63Online.remoteAudios.delete(peerId);}nsV63Online.remoteStreams.delete(peerId);nsV63Online.analysers.delete(peerId);nsV63Online.speakingIds.delete(peerId);
}

function nsV63AttachRemoteAudio(peerId,stream){
    peerId=String(peerId);nsV63Online.remoteStreams.set(peerId,stream);
    let audio=nsV63Online.remoteAudios.get(peerId);if(!audio){audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.dataset.nsVoicePeer=peerId;audio.style.display='none';document.body.appendChild(audio);nsV63Online.remoteAudios.set(peerId,audio);}audio.srcObject=stream;audio.volume=1;audio.play().catch(()=>{});
    nsV63AttachAnalyser(peerId,stream);
}

function nsV63AttachAnalyser(peerId,stream){
    if(!nsV63Online.audioContext||nsV63Online.analysers.has(peerId))return;
    try{const src=nsV63Online.audioContext.createMediaStreamSource(stream),an=nsV63Online.audioContext.createAnalyser();an.fftSize=256;src.connect(an);nsV63Online.analysers.set(String(peerId),an);nsV63StartSpeakerMeter();}catch(_){ }
}

function nsV63StartSpeakerMeter(){
    if(nsV63Online.speakerTimer)return;
    nsV63Online.speakerTimer=setInterval(()=>{
        const speaking=new Set();
        for(const [id,an] of nsV63Online.analysers){
            const a=new Uint8Array(an.fftSize);an.getByteTimeDomainData(a);let sum=0;
            for(const v of a){const x=(v-128)/128;sum+=x*x;}
            const rms=Math.sqrt(sum/a.length);
            if(rms>.035)speaking.add(String(id));
        }
        nsV63Online.speakingIds=speaking;
        // wolf.mp3 stays audible, but ducks under speech so future mic audio wins.
        if(nsV63Online.music&&nsV63Online.musicOn)nsV63Online.music.volume=speaking.size?.07:.18;
        nsV63RefreshOnlineRoster();
    },180);
}

async function nsV63EnableMic(){
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Trình duyệt không hỗ trợ Microphone API.');
    if(!nsV63Online.audioContext){nsV63Online.audioContext=new (window.AudioContext||window.webkitAudioContext)();}
    await nsV63Online.audioContext.resume().catch(()=>{});
    if(!nsV63Online.localStream){
        nsV63Online.localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1},video:false});
    }
    const track=nsV63Online.localStream.getAudioTracks()[0];
    if(!track)throw new Error('Không tìm thấy microphone track.');
    track.enabled=true;
    for(const pc of nsV63Online.peers.values()){
        const sender=pc.getSenders().find(s=>s.track?.kind==='audio')||pc.getTransceivers().find(t=>t.receiver?.track?.kind==='audio')?.sender;
        if(sender){
            await sender.replaceTrack(track);
            try{const params=sender.getParameters();params.encodings=params.encodings?.length?params.encodings:[{}];params.encodings[0].maxBitrate=32000;await sender.setParameters(params);}catch(_){ }
        }
    }
    nsV63AttachAnalyser(String(nsV63Online.meId||'me'),nsV63Online.localStream);
    for(const [id,stream] of nsV63Online.remoteStreams)nsV63AttachAnalyser(id,stream);
    nsV63Online.voiceEnabled=true;
}

async function nsV63ToggleMic(){
    try{
        if(!nsV63Online.localStream){await nsV63EnableMic();renderNightStageOnlineMatch();return;}
        const track=nsV63Online.localStream.getAudioTracks()[0];
        if(!track){await nsV63EnableMic();renderNightStageOnlineMatch();return;}
        track.enabled=!track.enabled;
        nsV63Online.voiceEnabled=track.enabled;
        if(!track.enabled){nsV63Online.speakingIds.delete(String(nsV63Online.meId||''));if(nsV63Online.music&&nsV63Online.musicOn)nsV63Online.music.volume=.18;}
        renderNightStageOnlineMatch();
    }catch(e){showNightStageToast('VOICE CHAT',e.message||'Không thể bật Microphone.');}
}

function nsV63SendChat(text){
    text=String(text||'').trim().slice(0,240);if(!text||!nsV63Online.channel)return;
    const now=Date.now();if(now-nsV63Online.lastChatAt<800)return;nsV63Online.lastChatAt=now;
    const msg={from:String(nsV63Online.meId),username:getCurrentUser()?.username||'PLAYER',text,ts:new Date().toISOString()};nsV63Online.chat.push(msg);nsV63RefreshChat();nsV63Online.channel.send({type:'broadcast',event:'ns-chat',payload:msg});
}

function nsV63RefreshChat(){const el=$('nsV63ChatLog');if(el)el.innerHTML=nsV63OnlineChatHtml();}
function nsV63RefreshOnlineRoster(){
    const root=$('nightStageOnlineMatchContent'),s=nsV63Online.snapshot;if(!root||!s)return;
    const cards=[...root.querySelectorAll('[data-user-id]')];
    for(const p of s.players||[]){
        const pid=String(p.user_id);
        const card=cards.find(x=>String(x.dataset.userId)===pid);
        if(!card)continue;
        card.classList.toggle('online',nsV63Online.presenceIds.has(pid));
        card.classList.toggle('speaking',nsV63Online.speakingIds.has(pid));
        const small=card.querySelector('small');
        if(small&&p.active)small.textContent=nsV63Online.speakingIds.has(pid)?'SPEAKING':nsV63Online.presenceIds.has(pid)?'VOICE ONLINE':'CONNECTED';
    }
}

async function nsV63PollOnlineMatchOnce(){
    const id=nsV63Online.snapshot?.room?.id;if(!id)return;
    try{
        let next=await nsV63Rpc('night_stage_touch_room',{p_room_id:id});
        if(next.room.status==='pause_vote'){
            const start=new Date(next.room.pause_started_at||Date.now()).getTime();
            const elapsed=Date.now()-start;
            if(elapsed>=20000){try{next=await nsV63Rpc('night_stage_finalize_continue_vote',{p_room_id:id});}catch(_){ }}
            else{const seconds=document.getElementById('nsV63ContinueSeconds');if(seconds)seconds.textContent=String(Math.max(0,20-Math.floor(elapsed/1000)));}
        }
        nsV63Online.snapshot=next;
        const sig=nsV63OnlineSignature(next);
        if(sig!==nsV63Online.renderSignature)renderNightStageOnlineMatch();
        else nsV63RefreshOnlineRoster();
    }catch(e){console.warn('NS match poll',e);}
}
function nsV63StartOnlineMatchPoll(){clearTimeout(nsV63Online.matchPollTimer);const tick=async()=>{await nsV63PollOnlineMatchOnce();if(nsV63Online.snapshot?.room?.status!=='ended')nsV63Online.matchPollTimer=setTimeout(tick,1300);};nsV63Online.matchPollTimer=setTimeout(tick,900);}

async function nsV63CleanupOnlineRealtime(){
    clearTimeout(nsV63Online.matchPollTimer);clearTimeout(nsV63Online.pollTimer);nsV63Online.matchPollTimer=nsV63Online.pollTimer=null;
    if(nsV63Online.channel){try{await nsV63Online.channel.untrack();await nsV63Online.channel.unsubscribe();}catch(_){ }nsV63Online.channel=null;}
    for(const id of [...nsV63Online.peers.keys()])nsV63DropPeer(id);
    if(nsV63Online.localStream){for(const t of nsV63Online.localStream.getTracks())t.stop();nsV63Online.localStream=null;}
    if(nsV63Online.speakerTimer){clearInterval(nsV63Online.speakerTimer);nsV63Online.speakerTimer=null;}
    if(nsV63Online.audioContext){try{await nsV63Online.audioContext.close();}catch(_){ }nsV63Online.audioContext=null;}
    nsV63Online.voiceEnabled=false;nsV63Online.chat=[];nsV63Online.speakingIds.clear();nsV63Online.renderSignature='';nsV63StopMusic();
}

function nsV63OpenExitConfirm(mode){nsV63ExitMode=mode;const text=$('nightStageExitConfirmText');if(text)text.textContent=mode==='online'?'Nếu bạn dừng, bạn sẽ rời trận. Người còn lại sẽ vote TIẾP TỤC / DỪNG nếu việc rời trận chưa tạo điều kiện thắng.':'Bạn muốn tiếp tục Training hay dừng trận hiện tại?';openNightStageModal('nightStageExitConfirmOverlay');}

async function nsV63ConfirmExitStop(){
    closeNightStageModal('nightStageExitConfirmOverlay');
    if(nsV63ExitMode==='training'){nsV63StopDefenseTimer();closeNightStageModal('nightStageTrainingOverlay');nightStageAITraining=null;showScreen('nightStageScreen');return;}
    if(nsV63ExitMode==='online'){
        const id=nsV63Online.snapshot?.room?.id;
        try{if(id){const r=await nsV63Rpc('night_stage_request_exit',{p_room_id:id});if(r?.status==='ended')showNightStageToast('MATCH RESULT','Việc rời trận đã tạo điều kiện thắng/thua.');}}
        catch(e){showNightStageToast('LEAVE MATCH',e.message||String(e));}
        await nsV63CleanupOnlineRealtime();closeNightStageModal('nightStageOnlineMatchOverlay');nsV63Online.snapshot=null;showScreen('nightStageScreen');
    }
}

function nsV63Bind(){
    // Capture Start so a locked faction skips the faction screen completely.
    document.addEventListener('click',e=>{
        // Full-screen match layers must never close by clicking the dark backdrop.
        // Route those clicks through the explicit leave confirmation instead.
        if(e.target?.id==='nightStageTrainingOverlay'){
            e.preventDefault();e.stopImmediatePropagation();nsV63OpenExitConfirm('training');return;
        }
        if(e.target?.id==='nightStageOnlineMatchOverlay'){
            e.preventDefault();e.stopImmediatePropagation();nsV63OpenExitConfirm('online');return;
        }
        if(e.target?.id==='nightStageExitConfirmOverlay'){
            e.preventDefault();e.stopImmediatePropagation();return;
        }
        const start=e.target.closest?.('#nightStageStartButton');
        if(start&&getCurrentUser?.()?.nightStageFaction){e.preventDefault();e.stopImmediatePropagation();nsV63RenderModeFactionLock();openNightStageModal('nightStageModeOverlay');return;}
        const factionBtn=e.target.closest?.('[data-night-faction]');
        if(factionBtn&&getCurrentUser?.()?.nightStageFaction){e.preventDefault();e.stopImmediatePropagation();showNightStageToast('IDOL FACTION LOCKED','Phe NIGHT STAGE chỉ được chọn một lần.');return;}
    },true);

    $('nightStagePlayerMode')?.addEventListener('click',()=>{nsV63OpenOnlineSetup();});
    $('nightStageOnlineSetupClose')?.addEventListener('click',()=>{if(nsV63Online.snapshot?.room?.status==='waiting')nsV63LeaveWaitingRoom();else closeNightStageModal('nightStagePlayerPreview');});
    $('nightStageTrainingExit')?.addEventListener('click',()=>nsV63OpenExitConfirm('training'));
    $('nightStageOnlineExit')?.addEventListener('click',()=>nsV63OpenExitConfirm('online'));
    $('nightStageExitContinue')?.addEventListener('click',()=>closeNightStageModal('nightStageExitConfirmOverlay'));
    $('nightStageExitStop')?.addEventListener('click',()=>nsV63ConfirmExitStop());

    document.querySelectorAll('[data-night-faction]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{renderNightStageFactionSelection(getCurrentUser?.());nsV63RenderModeFactionLock();},0)));
    nsV63RenderModeFactionLock();renderNightStageFactionSelection(getCurrentUser?.());
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',nsV63Bind,{once:true});else nsV63Bind();

/* =========================================================
   END NIGHT STAGE V63
========================================================= */
