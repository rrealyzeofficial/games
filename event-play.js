
/* =========================================================
   EVENT MOBILE / CAPACITOR UI MARKER
========================================================= */
(function markEventMobileUI(){
 const apply=()=>{
   let nativeCapacitor=false;
   try{
     nativeCapacitor=!!(
       window.Capacitor &&
       (
         window.Capacitor.isNativePlatform?.() ||
         window.Capacitor.getPlatform?.()==='android' ||
         window.Capacitor.getPlatform?.()==='ios'
       )
     );
   }catch(_){}
   const touchDevice=Number(navigator.maxTouchPoints||0)>0 ||
     window.matchMedia?.('(pointer: coarse)')?.matches;
   if(nativeCapacitor||touchDevice){
     document.documentElement.classList.add('realyze-event-mobile');
   }
 };
 apply();
 document.addEventListener('DOMContentLoaded',apply,{once:true});
})();


const $=id=>document.getElementById(id);

function syncEventViewport(){
 const candidates=[
   Number(window.innerHeight||0),
   Number(document.documentElement.clientHeight||0),
   Number(window.visualViewport?.height||0)
 ].filter(Number.isFinite);

 // On Capacitor landscape, visualViewport can report only the visible
 // content slice. Use the largest real viewport value so setup panels
 // reach the physical bottom of the game screen.
 const h=Math.max(...candidates,1);
 document.documentElement.style.setProperty('--ep-vh',`${Math.round(h)}px`);
}
syncEventViewport();
window.addEventListener('resize',syncEventViewport,{passive:true});
window.visualViewport?.addEventListener('resize',syncEventViewport,{passive:true});

const db=()=>window.REALYZE_DB||null;
const params=new URLSearchParams(location.search);
const MAX_TURNS=20;
const SONGS=[{id:'heart-bouquet',name:'Heart Bouquet',src:'assets/hb.mp3'},{id:'flos',name:'Flos',src:'assets/fl.mp3'}];
const CHARS={
 lumina:{id:'lumina',name:'LUMINA',image:'assets/lumina.png',type:'VOCAL',base:25600,per:660,rarity:6,skills:[['RADIANT NOVA','+3,800 VOCAL',3800,'point','vocal'],['BRIGHT SUPERNOVA','+4,600 VOCAL · 40% chance ×1.50',4600,'point','vocal'],['VOCAL COLLAPSE','+2,400 VOCAL · enemy VOCAL -1,800 · next ally +25%',2400,'debuff','vocal']]},
 miku:{id:'miku',name:'HATSUNE MIKU',image:'assets/miku.png',type:'VOCAL',base:9879,per:654,rarity:5,skills:[['MIKU VOICE','+1,730 VOCAL',1730,'point','vocal'],['NEXT STAGE','2 allied actions +30%',0,'teambuff','all'],['COLORFUL VOICE','+2,000 VOCAL · Miku next action +15%',2000,'selfbuff','vocal']]},
 miku6:{id:'miku6',name:'HATSUNE MIKU · RADIANT BRIDE',image:'assets/miku1.png',type:'RAP',base:21250,per:620,rarity:6,rewardMultiplier:1.35,skills:[['RADIANT RAP','+2,780 RAP',2780,'point','rap'],['BRIDAL ENCORE','Choose 1 allied character to act immediately after Miku',0,'chooseNext','all'],['BRIGHT PROCESSION','Advance the other 2 allied characters before the rival',0,'teamAdvance','all']]} ,
 akito:{id:'akito',name:'AKITO',image:'assets/akito.png',type:'ACT',base:27200,per:700,rarity:6,skills:[['BURN ACT EX','+4,100 ACT',4100,'point','act'],['TURN THE TABLE EX','Take next 2 allied turns · Akito next score +300%',0,'steal','all'],['CROSS OVERDRIVE','Other-type allies next 2 actions +30% · Akito next +50%',0,'otherbuff','all']]},
 kohane:{id:'kohane',name:'KOHANE',image:'assets/kohane.png',type:'RAP',base:25800,per:650,rarity:6,skills:[['RAP SHINE EX','+3,200 RAP',3200,'point','rap'],['BLESSING OF DAWN','Next 2 allied scoring actions +60%',0,'kohaneBlessing','all'],['DIVINE TURN','+1,800 RAP · priority · next allied scoring action +35%',1800,'kohaneDivine','rap']]},
 ichika:{id:'ichika',name:'ICHIKA',image:'assets/ichika.png',type:'RAP',base:22180,per:575,rarity:6,skills:[['FIRST NOTE','+2,850 RAP',2850,'point','rap'],['CHAIN RHYTHM','2 allied scoring actions +25% · different type +35%',0,'ichikaChain','all'],['ONE MORE MEASURE','+1,600 RAP · team priority next turn',1600,'ichikaMeasure','rap']]},
 touya:{id:'touya',name:'TOUYA',image:'assets/beginning_touya.png',type:'VOCAL',base:23450,per:610,rarity:6,skills:[['CYBER PULSE','+3,050 VOCAL',3050,'point','vocal'],['LINK DRIVE','Next 2 allied scoring actions +35%',0,'touyaLink','all'],['SYSTEM OVERRIDE','+1,850 VOCAL · enemy highest type -900',1850,'touyaOverride','vocal']]},
 airi:{id:'airi',name:'AIRI',image:'assets/beginning_airi.png',type:'ACT',base:15950,per:505,rarity:5,skills:[['HAPPY STEP','+2,200 ACT',2200,'point','act'],['SMILE SUPPORT','Next 2 allied scoring actions +25%',0,'airiCheer','all'],['CHEERFUL GUARD','+1,300 ACT · block 1 enemy score reduction',1300,'airiSmile','act']]},
 akito4:{id:'akito4',name:'AKITO',image:'assets/beginning_akito.png',type:'ACT',base:11840,per:360,rarity:4,skills:[['WARM-UP ACT','+1,650 ACT',1650,'point','act'],['WINTER WARMTH','Next allied scoring action +15%',0,'akitoWarm','all'],['FIRST SPARK','+950 ACT · other-type ally next action +10%',950,'akitoSpark','act']]},
 shota:{id:'shota',name:'SHOTA',image:'assets/shota.png',type:'VOCAL',base:26000,per:670,rarity:6,skills:[['PERFECT HARMONY EX','+3,650 VOCAL',3650,'point','vocal'],['NO WRONG NOTE EX','Block next 3 reductions · next 2 allied actions +25%',0,'shield','all'],['ENCORE PROTECTION EX','Choose 1 ally immediately · +45% · cleanse control',0,'shotaEncore','all']]},
 rui:{id:'rui',name:'RUI KAMISHIRO',image:'assets/rui.png',type:'ACT',base:13479,per:490,rarity:5,skills:[['CURTAIN CALL','+1,950 ACT · MARK enemy for 2 turns · next debuff +25%',1950,'ruiMark','act'],["DIRECTOR'S TRICK",'Choose VOCAL / RAP / ACT JAM · enemy gains -20% in that type for 2 actions',0,'ruiJam','all'],['GRAND FINALE','DELAYED BOMB · after 2 enemy actions: -1,500 from their highest type · Rui +1,500 ACT',0,'ruiBomb','all']]},
 shiho:{id:'shiho',name:'HINOMORI SHIHO',image:'assets/shiho1.png',type:'DANCE',base:24840,per:645,rarity:6,skills:[['ALL OUT STEP','Next 2 allied scoring actions +35%',35,'dancePulse','all'],['DANCE SYNC','Next 3 allied scoring actions +45% · priority',45,'danceSync','all'],['LIME OVERDRIVE','Next 3 allied scoring actions +60% · cleanse · shield',60,'danceOverdrive','all']]},
 nene:{id:'nene',name:'KUSANAGI NENE',image:'assets/nene1.png',type:'DANCE',base:25260,per:635,rarity:6,skills:[['PIXEL DRAIN','Enemy highest attribute -1,800 · CD 2',1800,'neneDrain','all'],['ERROR FIELD','All enemy attributes -1,200 · next actions -25% · CD 4',1200,'neneErrorField','all'],['TOTAL SHUTDOWN','Highest -4,000 · others -2,000 · suppression -40% · CD 6',4000,'neneShutdown','all']]},
 ns_akito:{id:'ns_akito',name:'SHINONOME AKITO',image:'assets/akito2.png',type:'VOCAL',base:24680,per:625,rarity:6,skills:[['FULL THROTTLE','+4,400 VOCAL · +30% if AN is on team',4400,'nsAkitoBurst','vocal'],['BURN EVERYTHING','+3,200 VOCAL · consume team buffs to amplify attack',3200,'nsAkitoAllIn','vocal'],['REDLINE FINALE','+5,800 VOCAL · next Akito +100% · AN grants priority',5800,'nsAkitoFinale','vocal']]},
 ns_an:{id:'ns_an',name:'SHIRAISHI AN',image:'assets/an2.png',type:'RAP',base:25120,per:635,rarity:6,skills:[['BLUE ASSIST','Pure support · next 2 allies +45% · Akito next +70%',0,'nsAnSupport','all'],['PARTNER LINK','Akito acts immediately with +80%; otherwise team +40%',0,'nsAnPartner','all'],['NEVER LET GO','Cleanse · shield 2 · next 3 allies +55% · priority',0,'nsAnUltimate','all']]},
 ns_saki:{id:'ns_saki',name:'TENMA SAKI · NIGHT STAGE',image:'assets/saki2.png',type:'ACT',base:24950,per:620,rarity:6,skills:[['EFFECT TUNING','Strengthen/extend current team effects · shield +1',0,'nsSakiTune','all'],['CHAIN REACTION','Next 3 allies +40% · priority · shield +1',0,'nsSakiChain','all'],['STAGE ALCHEMY','Cleanse · extend effects · next 3 +55% · shield 2 · priority',0,'nsSakiAlchemy','all']]},
 saki:{id:'saki',name:'TENMA SAKI',image:'assets/saki1.png',type:'ACT',base:21750,per:585,rarity:6,skills:[['SUNNY ACT','+2,800 ACT',2800,'point','act'],['STAGE CHEER','Next 2 allied scoring actions +30%',0,'teambuff','all'],['BRIGHT ENCORE','+1,550 ACT · team priority next turn',1550,'sakiEncore','act']]},
 luka:{id:'luka',name:'MEGURINE LUKA',image:'assets/luka1.png',type:'VOCAL',base:22680,per:600,rarity:6,skills:[['LUKA VOICE','+2,900 VOCAL',2900,'point','vocal'],['HARMONY WAVE','Next 2 allied scoring actions +35%',0,'touyaLink','all'],['RESONANT GUARD','+1,500 VOCAL · block 1 enemy score reduction',1500,'lukaGuard','vocal']]}
};
const SPECIALS=['akito','kohane'];
const SPECIAL_INFO={
 akito:'SPECIAL: giảm 30% toàn bộ VOCAL / RAP / ACT của đối thủ ngay khi kích hoạt.',
 kohane:'SPECIAL: bắt đầu trận với 100% năng lượng. Kích hoạt: 5 hành động ghi điểm tiếp theo +60%, được ưu tiên lượt và chặn 1 debuff giảm điểm.'
};
let user=null,selectedSong='heart-bouquet',selectedMain=[],selectedSpecial='kohane',mode='practice',energy=1,queue=null,game=null,preview=null,battleAudio=null,matchChannel=null;
let pollTimer=null,matchPollTimer=null,matchSyncBusy=false,remoteWriteBusy=false;
function readUser(){try{return JSON.parse(localStorage.getItem('realyze_user_cache')||'null')}catch{return null}}
async function hydrateUser(){const d=db();try{const s=await d?.auth?.getSession();if(s?.data?.session?.user?.id){const r=await d.from('profiles').select('id,username,game_data').eq('id',s.data.session.user.id).single();if(!r.error&&r.data){user={...(r.data.game_data||{}),username:r.data.username,_supabaseId:r.data.id};localStorage.setItem('realyze_user_cache',JSON.stringify(user));return user}}}catch(e){console.warn(e)}user=readUser();return user}
function owned(id){return Array.isArray(user?.myCharacters)&&user.myCharacters.includes(id)}
function level(id){return Math.max(1,Number(user?.characterProgress?.[id]?.level)||1)}
function bp(c){return c.base+(level(c.id)-1)*c.per}
async function saveLocal(){if(!user)return false;ensureEventData(user);user.eventTeam={main:[...selectedMain],special:selectedSpecial};user.eventMusic=selectedSong;localStorage.setItem('realyze_user_cache',JSON.stringify(user));return await syncUser()}
async function syncUser(){try{const d=db(),s=await d?.auth?.getSession();if(!d||!s?.data?.session?.user?.id||!user)return false;const id=s.data.session.user.id;const {data:row,error:readError}=await d.from('profiles').select('game_data').eq('id',id).single();if(readError)throw readError;const merged={...(row?.game_data||{}),...user};const {error}=await d.from('profiles').update({game_data:merged}).eq('id',id);if(error)throw error;user={...merged,_supabaseId:id};localStorage.setItem('realyze_user_cache',JSON.stringify(user));return true}catch(err){console.warn('event user sync',err);return false}}
function renderSongs(){const g=$('songGrid');g.innerHTML=SONGS.map(s=>`<button class="ep-song ${selectedSong===s.id?'active':''}" data-song="${s.id}"><strong>${s.name}</strong><span>${selectedSong===s.id?'NOW SELECTED · PREVIEW PLAYING':'CLICK TO SELECT & PLAY PREVIEW'}</span></button>`).join('');g.querySelectorAll('[data-song]').forEach(b=>b.onclick=()=>selectSong(b.dataset.song))}
function selectSong(id){selectedSong=id;const s=SONGS.find(x=>x.id===id);if(!s)return;stopPreview();preview=new Audio(s.src);preview.loop=true;preview.volume=.65;preview.play().catch(()=>{});renderSongs()}
function stopPreview(){if(preview){preview.pause();preview.currentTime=0;preview.src='';preview=null}}
function startBattleAudio(){stopPreview();const s=SONGS.find(x=>x.id===selectedSong);if(!s)return;battleAudio=new Audio(s.src);battleAudio.loop=true;battleAudio.volume=.65;battleAudio.play().catch(()=>{})}
function stopBattleAudio(){if(battleAudio){battleAudio.pause();battleAudio.currentTime=0;battleAudio.src='';battleAudio=null}}
function renderChars(){const g=$('mainCharacterGrid');const ids=Object.keys(CHARS).filter(owned);g.innerHTML=ids.length?ids.map(id=>{const c=CHARS[id];return `<button class="ep-char-card ${selectedMain.includes(id)?'selected':''}" data-id="${id}"><img src="${c.image}"><strong>${c.name}</strong><small>${c.type} · ${bp(c).toLocaleString()} BP</small></button>`}).join(''):`<div style="grid-column:1/-1;padding:20px;text-align:center;color:#9a8791">No owned event characters yet.</div>`;g.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id;if(selectedMain.includes(id))selectedMain=selectedMain.filter(x=>x!==id);else if(selectedMain.length<3)selectedMain.push(id);renderChars()});$('teamCount').textContent=`${selectedMain.length} / 3`;$('specialCharacterGrid').innerHTML=SPECIALS.map(id=>{const c=CHARS[id];return `<button class="ep-special-card ${selectedSpecial===id?'selected':''}" data-special="${id}"><img src="${c.image}"><strong>${c.name}</strong><small>★${c.rarity} · EVENT SPECIAL</small><em>${SPECIAL_INFO[id]}</em></button>`}).join('');document.querySelectorAll('[data-special]').forEach(b=>b.onclick=()=>{selectedSpecial=b.dataset.special;renderChars();showSpecialInfo(selectedSpecial)})}
function showSpecialInfo(id){const c=CHARS[id];if(!c)return;const modal=$('specialInfoModal'),name=$('specialInfoName'),text=$('specialInfoText');if(name)name.textContent=c.name;if(text)text.textContent=SPECIAL_INFO[id]||'SPECIAL SKILL';modal?.classList.remove('hidden')}
function closeSpecialInfo(){$('specialInfoModal')?.classList.add('hidden')}
function pointsForEnergy(e){return 3210+(e-1)*1426}
function pointsForMode(e){const base=pointsForEnergy(e);return mode==='practice'?Math.floor(base/2):base}
function refreshModeUI(){const gain=pointsForMode(energy);$('energyGain').textContent=gain.toLocaleString();const training=document.querySelector('[data-mode=practice] span');const player=document.querySelector('[data-mode=player] span');if(training)training.textContent='AI · WIN = 1/2 EVENT POINT · 0 ENERGY';if(player)player.textContent='REGISTERED ID · WIN = FULL EVENT POINT · ENERGY'}

const EVENT_SKILLS_VI={
 lumina:[['RADIANT NOVA','Cộng 3.800 VOCAL.'],['BRIGHT SUPERNOVA','Cộng 4.600 VOCAL; 40% xác suất nhân 1,50 lần hành động này.'],['VOCAL COLLAPSE','Cộng 2.400 VOCAL, trừ 1.800 VOCAL đối thủ và hành động đồng đội kế tiếp +25%.']],
 miku:[['MIKU VOICE','Cộng 1.730 VOCAL.'],['NEXT STAGE','Hai hành động ghi điểm tiếp theo của đồng đội được tăng 30%.'],['COLORFUL VOICE','Cộng 2.000 VOCAL; hành động ghi điểm tiếp theo của Miku tăng 15%.']],
 miku6:[['RADIANT RAP','Cộng 2.780 RAP.'],['BRIDAL ENCORE','Chọn 1 đồng đội hành động ngay sau Miku.'],['BRIGHT PROCESSION','Đẩy 2 đồng đội còn lại lên hành động trước khi đối thủ nhận lượt.']],
 akito:[['BURN ACT EX','Cộng 4.100 ACT.'],['TURN THE TABLE EX','Akito lấy 2 lượt đồng minh tiếp theo; hành động ghi điểm kế tiếp của Akito tăng 300%.'],['CROSS OVERDRIVE','2 hành động của đồng đội khác hệ +30%; hành động kế tiếp của Akito +50%.']],
 kohane:[['RAP SHINE','Cộng 1.800 RAP.'],['BLESSING','Hành động ghi điểm tiếp theo của đội tăng 55%.'],['DIVINE TURN','Đội của bạn giành ưu tiên ở lượt kế tiếp.']],
 ichika:[['FIRST NOTE','Cộng 2.850 RAP.'],['CHAIN RHYTHM','2 hành động ghi điểm tiếp theo của đồng đội +25%; khác hệ Ichika +35%. · CD 2'],['ONE MORE MEASURE','Cộng 1.600 RAP và đội được ưu tiên lượt kế tiếp. · CD 3']],
 touya:[['CYBER PULSE','Cộng 3.050 VOCAL.'],['LINK DRIVE','2 hành động ghi điểm tiếp theo của đồng đội +35%. · CD 2'],['SYSTEM OVERRIDE','Cộng 1.850 VOCAL và trừ 900 điểm ở hệ đang cao nhất của đối thủ. · CD 3']],
 airi:[['HAPPY STEP','Cộng 2.200 ACT.'],['SMILE SUPPORT','2 hành động ghi điểm tiếp theo của đồng đội +25%. · CD 2'],['CHEERFUL GUARD','Cộng 1.300 ACT và chặn 1 hiệu ứng trừ điểm tiếp theo từ đối thủ. · CD 3']],
 akito4:[['WARM-UP ACT','Cộng 1.650 ACT.'],['WINTER WARMTH','Hành động ghi điểm tiếp theo của đội +15%. · CD 2'],['FIRST SPARK','Cộng 950 ACT; đồng đội khác hệ với Akito được +10% ở hành động kế tiếp. · CD 3']],
 shota:[['PERFECT HARMONY EX','Cộng 3.650 VOCAL.'],['NO WRONG NOTE EX','Chặn 3 hiệu ứng trừ điểm; 2 hành động ghi điểm kế tiếp của đội +25%.'],['ENCORE PROTECTION EX','Chọn 1 đồng đội hành động ngay với +45% và xóa hiệu ứng khống chế bất lợi.']],
 rui:[['CURTAIN CALL','Cộng 1.950 ACT và MARK đối thủ 2 lượt; debuff trừ điểm tiếp theo mạnh hơn 25%.'],["DIRECTOR'S TRICK",'Chọn VOCAL / RAP / ACT để JAM; đối thủ bị giảm 20% khả năng ghi điểm hệ đó trong 2 hành động.'],['GRAND FINALE','Đặt DELAYED BOMB; sau 2 hành động của đối thủ, trừ 1.500 ở hệ cao nhất của họ và cộng 1.500 ACT cho Rui.']],
 shiho:[
   ['ALL OUT STEP','2 hành động ghi điểm tiếp theo của toàn đội +35%. Không có thanh DANCE.'],
   ['DANCE SYNC','3 hành động ghi điểm tiếp theo +45% và đội giành PRIORITY. · CD 2'],
   ['LIME OVERDRIVE','3 hành động ghi điểm tiếp theo +60%, xóa JAM/MARK bất lợi và tạo 1 lớp chắn debuff. · CD 3']
 ],
 nene:[
   ['PIXEL DRAIN','Xóa 1.800 điểm ở hệ cao nhất của đối thủ. · CD 2'],
   ['ERROR FIELD','Xóa 1.200 ở cả 3 hệ và 3 hành động ghi điểm tiếp theo của đối thủ -25%. · CD 4'],
   ['TOTAL SHUTDOWN','Hệ cao nhất -4.000, hai hệ còn lại -2.000; 2 hành động kế tiếp -40%, hủy PRIORITY. · CD 6']
 ],
 saki:[
   ['SUNNY ACT','Cộng 2.800 ACT.'],
   ['STAGE CHEER','2 hành động ghi điểm tiếp theo của đồng đội +30%. · CD 2'],
   ['BRIGHT ENCORE','Cộng 1.550 ACT và ưu tiên lượt kế tiếp. · CD 3']
 ],
 luka:[
   ['LUKA VOICE','Cộng 2.900 VOCAL.'],
   ['HARMONY WAVE','2 hành động ghi điểm tiếp theo của đồng đội +35%. · CD 2'],
   ['RESONANT GUARD','Cộng 1.500 VOCAL và chặn 1 hiệu ứng giảm điểm. · CD 3']
 ],
 ns_akito:[
   ['FULL THROTTLE','Cộng 4.400 VOCAL; nếu AN cùng đội, hành động này +30%.'],
   ['BURN EVERYTHING','Cộng 3.200 VOCAL và tiêu thụ buff đang có để khuếch đại đòn đánh. · CD 3'],
   ['REDLINE FINALE','Cộng 5.800 VOCAL; hành động Akito kế tiếp +100%. Có AN sẽ nhận PRIORITY. · CD 4']
 ],
 ns_an:[
   ['BLUE ASSIST','Thuần support: 2 hành động đồng đội +45%; riêng Akito kế tiếp +70%.'],
   ['PARTNER LINK','Nếu có Akito: Akito hành động ngay với +80%; nếu không, 3 hành động đội +40%. · CD 3'],
   ['NEVER LET GO','Xóa debuff, chắn 2 lần, 3 hành động đội +55% và PRIORITY. Akito nhận thêm +100% ở hành động kế tiếp. · CD 4']
 ],
 ns_saki:[
   ['EFFECT TUNING','Cường hóa và kéo dài các hiệu ứng đang tồn tại của đội; thêm 1 lớp chắn.'],
   ['CHAIN REACTION','3 hành động ghi điểm tiếp theo +40%, nhận PRIORITY và thêm 1 lớp chắn. · CD 2'],
   ['STAGE ALCHEMY','Xóa debuff, kéo dài hiệu ứng, 3 hành động +55%, chắn 2 lần và PRIORITY. · CD 4']
 ]
};
function eventStatText(c){
 const st=eventCombatStats(c.id),base=Number(c.bp||bp(c)),eff=(base+Number(st.flatScore||0))*(1+Number(st.bpPercent||0)/100);
 return {st,eff}
}
function openTeamCheck(){
 const root=$('teamCheckContent');if(!root)return;
 let team=[];
 if(game?.you?.length)team=game.you;
 else{
   if(!selectedMain.length){alert('Hãy chọn đội hình trước.');return}
   const entries=selectedMain.map(id=>({id,level:level(id),rank:Number(user?.characterProgress?.[id]?.rank)||1,bp:bp(CHARS[id])}));
   team=buildTeam(entries)
 }
 const cards=team.map(c=>{
   const st=c.combatStats||eventCombatStats(c.id),eff=eventEffectiveBP(c),skills=EVENT_SKILLS_VI[c.id]||[];
   return `<article class="ep-team-stat-card">
     <div class="ep-team-stat-head"><img src="${c.image}"><div><small>${c.type} · TEMPO ${st.tempo.toFixed(0)}</small><strong>${c.name}</strong><b>${Math.round(eff).toLocaleString()} BP</b></div></div>
     <div class="ep-team-stat-grid">
       <span>CRIT RATE <b>${st.critRate.toFixed(1)}%</b></span>
       <span>CRIT DMG <b>+${st.critDmg.toFixed(0)}%</b></span>
       <span>DMG V/R/A <b>${st.vocalBonus.toFixed(0)}/${st.rapBonus.toFixed(0)}/${st.actBonus.toFixed(0)}%</b></span>
       <span>BP FLAT <b>+${Math.round(st.flatScore||0).toLocaleString()}</b></span>
       <span>BP BONUS <b>+${Number(st.bpPercent||0).toFixed(1)}%</b></span>
       <span>TURN ORDER <b>${team.indexOf(c)+1}</b></span>
     </div>
     <div class="ep-team-skill-list">${skills.map((sk,i)=>`<div><em>${i+1}</em><p><strong>${sk[0]}</strong><span>${sk[1]}</span></p></div>`).join('')}</div>
   </article>`
 }).join('');
 const special=(game?.special?.id&&CHARS[game.special.id])?CHARS[game.special.id]:(selectedSpecial&&CHARS[selectedSpecial]?CHARS[selectedSpecial]:null);
 root.innerHTML=cards+(special?`<div class="ep-team-special"><small>SPECIAL PICK</small><strong>${special.name}</strong><span>${(EVENT_SKILLS_VI[special.id]||[]).map(s=>`${s[0]} — ${s[1]}`).join(' · ')}</span></div>`:'');
 $('teamCheckModal').classList.remove('hidden')
}
function closeTeamCheck(){$('teamCheckModal').classList.add('hidden')}


/* =========================================================
   HARD MOBILE SETUP LAYOUT V27
   Build two real DOM columns on mobile so old nth-of-type
   CSS can no longer rearrange/hide the four setup panels.
========================================================= */
function isEventMobileLayout(){
  let nativeCapacitor=false;
  try{
    nativeCapacitor=!!(
      window.Capacitor &&
      (
        window.Capacitor.isNativePlatform?.() ||
        window.Capacitor.getPlatform?.()==='android' ||
        window.Capacitor.getPlatform?.()==='ios'
      )
    );
  }catch(_){}

  return nativeCapacitor ||
    Number(navigator.maxTouchPoints||0)>0 ||
    window.matchMedia?.('(pointer: coarse)')?.matches;
}

function buildEventMobileSetupLayout(){
  if(!isEventMobileLayout()) return;

  const setup=$('setupView');
  const song=$('eventSongPanel');
  const match=$('eventMatchPanel');
  const special=$('eventSpecialPanel');
  const main=$('eventMainTeamPanel');

  if(!setup || !song || !match || !special || !main) return;
  if(setup.querySelector('.ep-mobile-setup-columns')) return;

  const columns=document.createElement('div');
  columns.className='ep-mobile-setup-columns';

  const left=document.createElement('div');
  left.className='ep-mobile-setup-column ep-mobile-setup-left';

  const right=document.createElement('div');
  right.className='ep-mobile-setup-column ep-mobile-setup-right';

  // EXACT requested order:
  // LEFT  : SONG -> MATCHMAKING
  // RIGHT : EVENT SPECIAL -> MAIN TEAM
  left.append(song,match);
  right.append(special,main);
  columns.append(left,right);

  setup.append(columns);
  setup.classList.add('ep-mobile-layout-built');
}

function init(){buildEventMobileSetupLayout();user=readUser();$('epUserId').textContent=user?.username||'PLAYER';$('epEventPoints').textContent=`${Number(user?.eventPoints||0).toLocaleString()} PT`;for(let i=1;i<=10;i++)$('energySelect').insertAdjacentHTML('beforeend',`<option value="${i}">${i} ENERGY</option>`);$('energySelect').onchange=e=>{energy=Number(e.target.value);refreshModeUI()};document.querySelectorAll('.ep-mode').forEach(b=>b.onclick=()=>{document.querySelectorAll('.ep-mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;refreshModeUI()});if($('teamCheckClose'))$('teamCheckClose').onclick=closeTeamCheck;if($('specialInfoClose'))$('specialInfoClose').onclick=closeSpecialInfo;if($('specialInfoModal'))$('specialInfoModal').onclick=e=>{if(e.target===$('specialInfoModal'))closeSpecialInfo()};if($('battleCheckTeam'))$('battleCheckTeam').onclick=openTeamCheck;if($('saveTeam'))$('saveTeam').onclick=startQueue;if($('cancelQueue'))$('cancelQueue').onclick=cancelQueue;if($('epBack'))$('epBack').onclick=handleBattleBack;if($('resultBack'))$('resultBack').onclick=backEvent;if($('leaveResume'))$('leaveResume').onclick=closeLeaveModal;if($('leaveConfirm'))$('leaveConfirm').onclick=async()=>{closeLeaveModal();if(game?.remote)await leaveRemoteMatch();else backEvent()};const saved=user?.eventTeam;if(saved?.main?.length===3)selectedMain=saved.main.filter(owned);if(saved?.special&&SPECIALS.includes(saved.special))selectedSpecial=saved.special;if(user?.eventMusic&&SONGS.some(s=>s.id===user.eventMusic))selectedSong=user.eventMusic;renderSongs();renderChars();refreshModeUI();hydrateUser().then(()=>{renderChars();$('epUserId').textContent=user?.username||'PLAYER';$('epEventPoints').textContent=`${Number(user?.eventPoints||0).toLocaleString()} PT`;refreshModeUI()})}
function show(id){
 ['setupView','queueView','battleView'].forEach(x=>$(x).classList.toggle('hidden',x!==id));
 $('resultView').classList.add('hidden');
 document.body.classList.toggle('ep-battle-mobile',id==='battleView');
 syncEventViewport();
 if(id==='battleView') requestEventFullscreen();
}

async function requestEventFullscreen(){
 if(!matchMedia('(orientation: landscape)').matches)return;
 try{
   if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
     await document.documentElement.requestFullscreen({navigationUI:'hide'});
   }
 }catch(_){}
 syncEventViewport();
}

function openLeaveModal(){const m=$('leaveMatchModal');if(m)m.classList.remove('hidden')}
function closeLeaveModal(){const m=$('leaveMatchModal');if(m)m.classList.add('hidden')}
async function leaveRemoteMatch(){
 clearRpsWaitUI();
 if(!game?.remote||!game.matchId){backEvent();return}const d=db();try{await d?.rpc('event_leave_match',{p_match_id:game.matchId})}catch(e){console.warn('leave match',e)}backEvent()}
function handleBattleBack(){if(game&&!game.finished){openLeaveModal();return}backEvent()}
function backEvent(){document.body.classList.remove('ep-battle-mobile');stopPreview();stopBattleAudio();clearTimeout(pollTimer);clearTimeout(matchPollTimer);if(matchChannel)matchChannel.unsubscribe();location.href='index.html?return=event'}
function ensureEventData(u){if(!u)return;u.eventPoints=Math.max(0,Math.min(1000000,Number(u.eventPoints)||0));u.eventEnergy=Math.max(0,Number(u.eventEnergy??100));u.eventEnergyUpdatedAt=Number(u.eventEnergyUpdatedAt)||Date.now();u.eventClaimedRewards=Array.isArray(u.eventClaimedRewards)?u.eventClaimedRewards:[];u.eventShopPurchases=(u.eventShopPurchases&&typeof u.eventShopPurchases==='object')?u.eventShopPurchases:{};u.eventMailbox=Array.isArray(u.eventMailbox)?u.eventMailbox:[]}
function eventDailyKey(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const x={};p.forEach(v=>{if(v.type!=='literal')x[v.type]=v.value});return `${x.year}-${x.month}-${x.day}`}
function recordDailyEventBattle(){if(!user)return;const key=eventDailyKey();if(!user.dailyLive||user.dailyLive.date!==key)user.dailyLive={date:key,baseClears:Object.values(user.rhythmProgress||{}).reduce((n,p)=>n+Math.max(0,Number(p?.clearCount)||0),0),events:0,claimed:[]};user.dailyLive.events=Math.max(0,Number(user.dailyLive.events)||0)+1;}

function recoverEventEnergy(u){if(!u)return 0;const maxNatural=100,interval=90000,now=Date.now();let en=Math.max(0,Number(u.eventEnergy)||0),stamp=Number(u.eventEnergyUpdatedAt)||now;if(en<maxNatural){const gained=Math.floor(Math.max(0,now-stamp)/interval);if(gained>0){en=Math.min(maxNatural,en+gained);stamp+=gained*interval}}else stamp=now;u.eventEnergy=en;u.eventEnergyUpdatedAt=stamp;return en}
async function startQueue(){
  // Always refresh the account once before saving/matchmaking so an old lobby cache
  // cannot overwrite the current server-side team or character ownership.
  await hydrateUser();
  if(!user){alert('Vui lòng đăng nhập lại trước khi vào Event.');return}
  ensureEventData(user);
  if(!SONGS.some(s=>s.id===selectedSong)){alert('Hãy chọn bài nhạc.');return}
  selectedMain=selectedMain.filter(owned);
  if(selectedMain.length!==3){alert('Hãy chọn đủ 3 nhân vật đã sở hữu.');renderChars();return}
  if(mode==='player')recoverEventEnergy(user);
  if(mode==='player'&&Number(user?.eventEnergy??0)<energy){alert(`Không đủ Event Energy. Cần ${energy}, hiện có ${Number(user?.eventEnergy??0)}.`);return}
  const savedOk=await saveLocal();
  if(!savedOk){alert('Không thể SAVE TEAM lên máy chủ. Hãy kiểm tra kết nối Supabase rồi thử lại.');show('setupView');return}
  stopPreview();
  $('queueMode').textContent=mode==='practice'?'TRAINING · AI':'PLAYER MATCHMAKING';
  $('queueTitle').textContent=mode==='practice'?'BUILDING AI RIVAL...':'SEARCHING FOR A PLAYER...';
  $('queueText').textContent=mode==='practice'?'Training awards 1/2 Event Points on victory and uses no Energy.':`Searching for another registered ID on ${SONGS.find(s=>s.id===selectedSong).name}.`;
  show('queueView');
  if(mode==='practice'){setTimeout(()=>startBattle(makeAI()),500);return}
  await joinMatchmaking()
}
function teamSnapshot(){return selectedMain.map(id=>({id,level:level(id),rank:Number(user?.characterProgress?.[id]?.rank)||1,bp:bp(CHARS[id])}))}
async function joinMatchmaking(){const d=db();if(!d){alert('Supabase chưa sẵn sàng. Hãy kiểm tra supabase-config.js + supabase-client.js trong cùng thư mục với event-play.html.');show('setupView');return}try{const {data,error}=await d.rpc('event_join_matchmaking',{p_song:selectedSong,p_team:teamSnapshot(),p_special:selectedSpecial,p_energy:energy});if(error)throw error;queue=data;if(queue?.match_id){await loadRemoteMatch(queue.match_id)}else{pollQueue()}}catch(e){console.error(e);alert('Không thể vào hàng chờ: '+(e.message||e));show('setupView')}}
async function pollQueue(){
 clearTimeout(pollTimer);
 const d=db();if(!d)return;
 try{
  const {data,error}=await d.from('event_matchmaking_queue').select('match_id,status').eq('user_id',user?._supabaseId).maybeSingle();
  if(!error&&data?.match_id){await loadRemoteMatch(data.match_id);return}
 }catch(e){}
 pollTimer=setTimeout(pollQueue,1500)
}
async function cancelQueue(){clearTimeout(pollTimer);clearTimeout(matchPollTimer);const d=db();try{if(d)await d.rpc('event_leave_matchmaking')}catch(e){}show('setupView')}

// Realtime is used when available, but the battle must not depend on it.
// Some Supabase projects have Realtime disabled/not configured for event_matches.
// Polling the authoritative row is the fallback that guarantees both browsers
// eventually see the same turn even when postgres_changes does not fire.
async function pollRemoteMatch(id){
 clearTimeout(matchPollTimer);
 const d=db();
 if(!d||!game?.remote||game.matchId!==id||game.finished)return;
 try{
  if(!matchSyncBusy){
   matchSyncBusy=true;
   const {data,error}=await d.from('event_matches').select('*').eq('id',id).single();
   if(!error&&data){
    applyRemoteState(data);
    const rs=data.state?.rps;
    const mineChoice=game?.rpsChoice;
    const mineKey=game?.isP1?'p1':'p2';
    if(game&&!game.rps&&mineChoice&&rs&&rs[mineKey]!==mineChoice&&!remoteWriteBusy){
      syncRemoteState({rpsChoice:mineChoice});
    }
   }
  }
 }catch(e){console.warn('remote match poll',e)}
 finally{
  matchSyncBusy=false;
  if(game?.remote&&game.matchId===id&&!game.finished)matchPollTimer=setTimeout(()=>pollRemoteMatch(id),700);
 }
}

async function loadRemoteMatch(id){
 clearTimeout(pollTimer);clearTimeout(matchPollTimer);
 const d=db();
 const {data,error}=await d.from('event_matches').select('*').eq('id',id).single();
 if(error||!data){alert('Match không tồn tại.');show('setupView');return}
 const me=user?._supabaseId;
 const mine=data.player1_id===me?data.player1:data.player2;
 const opp=data.player1_id===me?data.player2:data.player1;
 startBattle({remote:true,match:data,mine,opp});
 // IMPORTANT: hydrate the battle from the server row immediately. The local
 // browser must never assume it owns the first turn just because it loaded first.
 if(data.state) applyRemoteState(data);
 if(matchChannel)try{await matchChannel.unsubscribe()}catch(e){}
 matchChannel=d.channel(`event-match-${id}`)
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'event_matches',filter:`id=eq.${id}`},payload=>applyRemoteState(payload.new))
  .subscribe();
 // Realtime is an optimization; polling is the reliable fallback.
 matchPollTimer=setTimeout(()=>pollRemoteMatch(id),700);
}
function makeAI(){const ids=['lumina','akito','kohane'].filter(x=>CHARS[x]);return {username:'EVENT AI',main:ids, special:'kohane',song:selectedSong}}
function snapshotTeam(arr){return Array.isArray(arr)?arr.map(x=>({...x})):[]}
function normalizePlayerPayload(value){if(typeof value==='string'){try{return JSON.parse(value)}catch(_){return {}}}return value&&typeof value==='object'?value:{}}
function normalizeTeamPayload(value){
 const p=normalizePlayerPayload(value);
 let team=p?.team ?? p?.main ?? p;
 if(typeof team==='string'){try{team=JSON.parse(team)}catch(_){team=[]}}
 if(!Array.isArray(team)&&team&&typeof team==='object')team=Object.values(team);
 return Array.isArray(team)?team:[];
}
function teamEntries(value){return normalizeTeamPayload(value).map(x=>typeof x==='string'?{id:x}:x).filter(x=>x&&x.id)}
function startBattle(remoteInfo){
 const mineEntries=remoteInfo.remote?teamEntries(remoteInfo.mine):teamEntries(teamSnapshot());
 const rivalEntries=remoteInfo.remote?teamEntries(remoteInfo.opp):teamEntries(teamSnapshotFromAI().main);
 const mineIds=mineEntries.map(x=>x.id).filter(Boolean);
 const rivalIds=rivalEntries.map(x=>x.id).filter(Boolean);
 const myTeam=buildTeam(mineEntries),enemyTeam=buildTeam(rivalEntries);
 if(myTeam.length!==3||enemyTeam.length!==3){alert('Không đọc được đội hình trận đấu. Hãy tải lại trang và thử ghép trận lại.');backEvent();return}
 const mineMeta=remoteInfo.remote?normalizePlayerPayload(remoteInfo.mine):{};
 const mySpecial=mineMeta?.special||selectedSpecial;
 const enemyMeta=remoteInfo.remote?normalizePlayerPayload(remoteInfo.opp):{};
 game={remote:!!remoteInfo.remote,matchId:remoteInfo.match?.id||null,isP1:remoteInfo.remote?remoteInfo.match.player1_id===user?._supabaseId:true,turn:1,activeSide:remoteInfo.remote?null:'you',you:myTeam,rival:enemyTeam,actorIndex:{you:0,rival:0},points:{vocal:0,rap:0,act:0},enemy:{vocal:0,rap:0,act:0},special:CHARS[mySpecial],specialEnergy:(mySpecial==='kohane'?100:0),enemySpecialEnergy:0,buffs:{you:{all:0,allTurns:0,vocal:0,rap:0,act:0,self:0,selfActor:null,other:0,otherSource:null,otherTurns:0,priority:0,extraTurns:0,skip:0,skipAlliedTurns:0,blessingTurns:0,shield:0,ruiMarkTurns:0,ruiJamType:null,ruiJamActions:0,ruiBombActions:0,ruiBombOwner:null,danceLinkType:null,danceLinkBoost:0,danceLinkTurns:0,danceBeatCount:0,neneSuppression:0,neneSuppressionActions:0,neneDoomCount:0,encoreBoost:0,encoreActor:null},rival:{all:0,allTurns:0,vocal:0,rap:0,act:0,self:0,selfActor:null,other:0,otherSource:null,otherTurns:0,priority:0,extraTurns:0,skip:0,skipAlliedTurns:0,blessingTurns:0,shield:0,ruiMarkTurns:0,ruiJamType:null,ruiJamActions:0,ruiBombActions:0,ruiBombOwner:null,danceLinkType:null,danceLinkBoost:0,danceLinkTurns:0,danceBeatCount:0,neneSuppression:0,neneSuppressionActions:0,neneDoomCount:0,encoreBoost:0,encoreActor:null}},coolYou:{},coolRival:{},opponentName:remoteInfo.remote?(enemyMeta?.username||'PLAYER'):'EVENT AI',song:selectedSong,log:[],rps:null,rpsChoice:null,energy:Number(remoteInfo.remote?mineMeta?.energy:energy)||energy,waitingRemote:!!remoteInfo.remote,forfeit:null};
 startBattleAudio();$('battleModeLabel').textContent=game.remote?'PLAYER MATCH':'TRAINING · AI';$('rivalName').textContent=game.opponentName;$('youName').textContent=user?.username||'YOU';$('battleSongName').textContent=SONGS.find(s=>s.id===selectedSong)?.name||'';show('battleView');renderBattle();prepareOpening();
}

function teamSnapshotFromAI(){return {main:[{id:'lumina',level:1,rank:1},{id:'akito',level:1,rank:1},{id:'kohane',level:1,rank:1}],special:'kohane'}}

const EVENT_BASE_STATS={
 lumina:{critRate:8,critDmg:60,tempo:120},miku:{critRate:5,critDmg:50,tempo:105},
 miku6:{critRate:5,critDmg:50,tempo:120},akito:{critRate:9,critDmg:65,tempo:124},
 kohane:{critRate:7,critDmg:60,tempo:114},shota:{critRate:7,critDmg:60,tempo:110},ichika:{critRate:5,critDmg:50,tempo:118},
 touya:{critRate:5,critDmg:50,tempo:112},airi:{critRate:5,critDmg:50,tempo:106},akito4:{critRate:5,critDmg:50,tempo:102},
 rui:{critRate:5,critDmg:50,tempo:115},shiho:{critRate:6,critDmg:55,tempo:125},nene:{critRate:7,critDmg:55,tempo:120},ns_akito:{critRate:7,critDmg:60,tempo:116},ns_an:{critRate:8,critDmg:58,tempo:121},ns_saki:{critRate:6,critDmg:55,tempo:113},saki:{critRate:5,critDmg:50,tempo:110},luka:{critRate:5,critDmg:50,tempo:108}
};
const EVENT_GEAR_SETS={radiant:'vocalBonus',blue:'rapBonus',grand:'actBonus',spotlight:'tempo',breaker:'critRate',guard:'guard',crimsonfang:'critDmg',moonhowl:'tempo'};
function eventGearMaxLevel(r){return r===5?20:r===4?15:10}
function eventLineValue(g,isMain,i=0){const lv=Math.max(0,Math.min(Number(g.level)||0,eventGearMaxLevel(Number(g.rarity)||3)));if(isMain)return Number(g.mainValue||0)+Number(g.mainGrowth||0)*lv;const s=g.subs?.[i];return Number(s?.value||0)+Number(s?.rollBonus||0)}
function eventGearStats(id){
 const out={flatScore:0,bpPercent:0,critRate:0,critDmg:0,tempo:0,skillEffect:0,vocalBonus:15,rapBonus:15,actBonus:15,guard:0,sets:{}};
 const eq=user?.equipment?.[id]||{},inv=Array.isArray(user?.stageGear)?user.stageGear:[];
 Object.values(eq).forEach(gid=>{const g=inv.find(x=>x.id===gid);if(!g)return;out.sets[g.set]=(out.sets[g.set]||0)+1;
  [{stat:g.main,value:eventLineValue(g,true)},...(g.subs||[]).map((x,i)=>({stat:x.stat,value:eventLineValue(g,false,i)}))].forEach(x=>{
   if(x.stat==='flatScore')out.flatScore+=x.value;else if(x.stat==='damageVocal')out.vocalBonus+=x.value;else if(x.stat==='damageRap')out.rapBonus+=x.value;else if(x.stat==='damageAct')out.actBonus+=x.value;else out[x.stat]=(out[x.stat]||0)+x.value;
  });
 });
 Object.entries(out.sets).forEach(([set,n])=>{
  if(n>=2){
   const stat=EVENT_GEAR_SETS[set];
   if(stat==='vocalBonus'||stat==='rapBonus'||stat==='actBonus')out[stat]+=15;
   else if(stat==='critRate')out.critRate+=12;
   else if(stat==='critDmg')out.critDmg+=22;
   else if(stat==='tempo')out.tempo+=set==='moonhowl'?18:15;
   else if(stat==='guard')out.guard+=20;
  }
  if(n>=4&&set==='breaker')out.critDmg+=30;
  if(n>=4&&set==='crimsonfang'){out.bpPercent+=18;out.critRate+=12;}
  if(n>=4&&set==='moonhowl'){out.skillEffect+=25;out.actBonus+=20;}
 });
 return out;
}

const DANCE_INTRINSIC_REQUIREMENTS=[1,2,3,4,5,5];

function danceIntrinsicCountFromRank(rank){
 const r=Math.max(1,Math.min(5,Number(rank)||1));
 return r>=5?6:r;
}

function danceBranchCountForTeam(team,characterId){
 let count=0;

 (team||[]).forEach(c=>{
   if(c?.id!==characterId)return;

   count=Math.max(
     count,
     danceIntrinsicCountFromRank(c.rank)
   );
 });

 return count;
}

function danceBranchCountForSide(side,characterId){
 const team=side==='you'?game?.you:game?.rival;
 return danceBranchCountForTeam(team||[],characterId);
}
function eventCombatStats(id){const b=EVENT_BASE_STATS[id]||{critRate:5,critDmg:50,tempo:100},g=eventGearStats(id);return {...g,critRate:b.critRate+g.critRate,critDmg:b.critDmg+g.critDmg,tempo:b.tempo+g.tempo}}
function eventScoreRoll(side,actor,target,value){
 const st=actor.combatStats||eventCombatStats(actor.id);
 const shihoBranches=danceBranchCountForSide(side,'shiho');
 const enemySide=side==='you'?'rival':'you';
 const enemyNeneBranches=danceBranchCountForSide(enemySide,'nene');
 const bonus=Number(st[target+'Bonus']??15);
 const baseBP=Math.max(1,Number(actor.bp||1)),bpScale=Math.max(.75,eventEffectiveBP(actor)/baseBP);
 let amount=value*(1+bonus/100)*bpScale;

 const critRate=Math.max(
   0,
   Number(st.critRate||0)
   +(shihoBranches>=2?8:0)
   -(enemyNeneBranches>=4?10:0)
 );
 const critDmg=Number(st.critDmg||50)+(shihoBranches>=3?20:0);

 const crit=Math.random()*100<critRate;
 if(crit){
   amount*=1+critDmg/100;
   game?.log?.push(`<b>CRITICAL!</b> ${actor.name} · ${target.toUpperCase()} · +${critDmg.toFixed(0)}% CRIT DMG`);
 }
 return {amount,crit};
}
function eventEffectiveBP(actor){const st=actor.combatStats||eventCombatStats(actor.id);return (Number(actor.bp||0)+Number(st.flatScore||0))*(1+Number(st.bpPercent||0)/100)}
function eventTeamTempo(team){return team.reduce((n,c)=>n+Number(c.combatStats?.tempo||100),0)}

function buildTeam(entries){
 const team=teamEntries(entries).map(e=>{
   const c=CHARS[e.id];if(!c)return null;
   return {...c,level:Number(e.level)||1,rank:Number(e.rank)||1,bp:Number(e.bp)||bp(c),combatStats:eventCombatStats(e.id),cd:[0,0,0]}
 }).filter(Boolean);

 const shihoBranches=danceBranchCountForTeam(team,'shiho');

 team.forEach(actor=>{
   actor.combatStats={...(actor.combatStats||{})};
   if(shihoBranches>=4)actor.combatStats.tempo=Number(actor.combatStats.tempo||100)*1.12;
   if(shihoBranches>=5)actor.combatStats.skillEffect=Number(actor.combatStats.skillEffect||0)+15;
 });

 return team.sort((a,b)=>(b.combatStats?.tempo||0)-(a.combatStats?.tempo||0));
}
function totalScore(s){return s.vocal+s.rap+s.act}
function renderBattle(){$('turnNumber').textContent=`${Math.min(game.turn,MAX_TURNS)} / ${MAX_TURNS}`;$('youPower').textContent=`${game.you.reduce((a,c)=>a+eventEffectiveBP(c),0).toLocaleString()} BP`;$('rivalPower').textContent=`${game.rival.reduce((a,c)=>a+eventEffectiveBP(c),0).toLocaleString()} BP`;['vocal','rap','act'].forEach(t=>{const a=game.points[t],b=game.enemy[t];$(`you${cap(t)}`).textContent=a.toLocaleString();$(`rival${cap(t)}`).textContent=b.toLocaleString();$(`you${cap(t)}Bar`).style.width=`${Math.min(100,a/100)}%`;$(`rival${cap(t)}Bar`).style.width=`${Math.min(100,b/100)}%`});$('specialEnergyText').textContent=`${Math.min(100,game.specialEnergy)}%`;$('specialSkill').disabled=game.specialEnergy<100||game.activeSide!=='you'||game.waitingRemote;$('battleLog').innerHTML=game.log.slice(-14).map(x=>`<div class="ep-log-line">${x}</div>`).join('')}
const cap=x=>x[0].toUpperCase()+x.slice(1);

/* =========================================================
   RPS WAIT / LEAVE V46
   After choosing RPS in Player Match, allow the player to
   leave if the rival never submits a choice.
========================================================= */
let rpsWaitTimer=null;
let rpsWaitStartedAt=0;
const RPS_LEAVE_UNLOCK_MS=10000;

function clearRpsWaitUI(){
  clearInterval(rpsWaitTimer);
  rpsWaitTimer=null;
  rpsWaitStartedAt=0;

  const btn=$('rpsLeaveWait');
  const timer=$('rpsWaitTimer');
  btn?.classList.add('hidden');
  if(timer)timer.textContent='';
}

function ensureRpsLeaveUI(){
  const modal=$('rpsView')?.querySelector('.ep-rps-modal');
  if(!modal)return;

  if(!$('rpsWaitTimer')){
    const timer=document.createElement('small');
    timer.id='rpsWaitTimer';
    timer.className='ep-rps-wait-timer';
    modal.appendChild(timer);
  }

  if(!$('rpsLeaveWait')){
    const btn=document.createElement('button');
    btn.id='rpsLeaveWait';
    btn.type='button';
    btn.className='ep-rps-leave-wait hidden';
    btn.textContent='LEAVE MATCH';
    btn.onclick=()=>{
      if(!game?.remote||game?.rps)return;
      openLeaveModal();
    };
    modal.appendChild(btn);
  }
}

function startRpsWaitTimer(){
  if(!game?.remote||game?.rps)return;

  ensureRpsLeaveUI();
  clearInterval(rpsWaitTimer);

  rpsWaitStartedAt=Date.now();

  const tick=()=>{
    if(!game?.remote||game?.rps){
      clearRpsWaitUI();
      return;
    }

    const elapsed=Date.now()-rpsWaitStartedAt;
    const seconds=Math.floor(elapsed/1000);
    const remaining=Math.max(0,Math.ceil((RPS_LEAVE_UNLOCK_MS-elapsed)/1000));

    const timer=$('rpsWaitTimer');
    const btn=$('rpsLeaveWait');

    if(elapsed<RPS_LEAVE_UNLOCK_MS){
      if(timer)timer.textContent=`WAITING FOR RIVAL · LEAVE AVAILABLE IN ${remaining}s`;
      btn?.classList.add('hidden');
    }else{
      if(timer)timer.textContent=`WAITING FOR RIVAL · ${seconds}s`;
      btn?.classList.remove('hidden');
    }
  };

  tick();
  rpsWaitTimer=setInterval(tick,250);
}

function prepareOpening(){
 if(!game.rps){
   $('rpsView').classList.remove('hidden');
   $('rpsResult').textContent='';
   $('skillGrid').innerHTML='';
   ensureRpsLeaveUI();
   return;
 }
 clearRpsWaitUI();
 $('rpsView').classList.add('hidden');
 prepareTurn();
}
document.querySelectorAll('[data-rps]').forEach(b=>b.onclick=()=>chooseRPS(b.dataset.rps));
async function chooseRPS(choice){
 if(game.rps)return;game.rpsChoice=choice;$('rpsResult').textContent=`YOU: ${choice.toUpperCase()} · WAITING FOR RIVAL...`;
 if(game.remote){
   startRpsWaitTimer();
   await syncRemoteState({rpsChoice:choice});
   return;
 }
 const ai=['rock','paper','scissors'][Math.floor(Math.random()*3)];const win=(choice==='rock'&&ai==='scissors')||(choice==='paper'&&ai==='rock')||(choice==='scissors'&&ai==='paper');const highestMine=Math.max(...game.you.map(c=>c.bp)),highestRival=Math.max(...game.rival.map(c=>c.bp));game.rps=win?'you':choice===ai?(highestMine>=highestRival?'you':'rival'):'rival';$('rpsResult').textContent=`YOU: ${choice.toUpperCase()} · RIVAL: ${ai.toUpperCase()} → ${game.rps==='you'?'YOU GO FIRST':'RIVAL GOES FIRST'}`;game.log.push(`<b>Opening toss:</b> ${game.rps==='you'?'YOU':'RIVAL'} goes first.`);setTimeout(prepareOpening,800)
}
function resolveRemoteRPS(st){
 if(game.rps)return;if(!st?.rps?.p1||!st?.rps?.p2)return;
 clearRpsWaitUI();
 const p1=st.rps.p1,p2=st.rps.p2;const beats=(a,b)=>(a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper');let p1First;
 if(p1===p2){const p1bp=Math.max(...(game.isP1?game.you:game.rival).map(c=>c.bp));const p2bp=Math.max(...(game.isP1?game.rival:game.you).map(c=>c.bp));p1First=p1bp>=p2bp}else p1First=beats(p1,p2);
 game.rps=p1First===(game.isP1?'you': 'rival')?'you':'rival';game.activeSide=game.rps;$('rpsResult').textContent=`RPS: ${game.isP1?p1:p2} · ${game.isP1?p2:p1} → ${game.rps==='you'?'YOU GO FIRST':'RIVAL GOES FIRST'}`;game.log.push(`<b>Opening toss:</b> ${game.rps==='you'?'YOU':'RIVAL'} goes first.`);game.waitingRemote=false;prepareOpening()
}

function actorFor(side){const team=side==='you'?game.you:game.rival;let idx=Number(game.actorIndex?.[side]??0)%team.length;return team[idx]}
function currentSideState(side){return side==='you'?game.buffs.you:game.buffs.rival}
function currentPoints(side){return side==='you'?game.points:game.enemy}
function currentCooldowns(side){return side==='you'?game.coolYou:game.coolRival}
const EVENT_SKILL_CD={1:2,2:3};

function eventSkillBaseCooldown(actor,i){
 if(actor?.id==='nene'){
   return [2,4,6][i]||0;
 }
 return i===0?0:(EVENT_SKILL_CD[i]||0);
}
function tickActorCooldowns(side,actor){
 const stamp=`${game?.turn||0}:${side}:${actor.id}`;
 if(game?._lastCdTick===stamp)return;
 if(game)game._lastCdTick=stamp;
 const c=currentCooldowns(side);
 [1,2].forEach(i=>{const k=actor.id+':'+i;if(Number(c[k]||0)>0)c[k]=Math.max(0,Number(c[k])-1)});
}
function renderActiveCharacter(){
 const you=actorFor('you'), rival=actorFor('rival'), myTurn=game.activeSide==='you'&&!game.waitingRemote, rivalTurn=game.activeSide==='rival';
 const setSide=(side,actor,active)=>{
  const img=$(side==='you'?'turnCharacterImageYou':'turnCharacterImageRival');
  const person=$(side==='you'?'turnCharacterPersonYou':'turnCharacterPersonRival');
  const name=$(side==='you'?'turnCharacterNameYou':'turnCharacterNameRival'),stars=$(side==='you'?'turnCharacterStarsYou':'turnCharacterStarsRival'),bpEl=$(side==='you'?'turnCharacterBPYou':'turnCharacterBPRival'),lvl=$(side==='you'?'turnCharacterLevelYou':'turnCharacterLevelRival'),wait=$(side==='you'?'turnCharacterWaitYou':'turnCharacterWaitRival');
  // Always keep both actor portraits visible. Turn state is shown by the status label instead of hiding the art.
  if(img){img.classList.remove('hidden');img.src=actor.image;img.alt=actor.name}if(person)person.classList.add('hidden');if(name)name.textContent=actor.name;if(stars)stars.textContent='★'.repeat(actor.rarity||1);if(bpEl)bpEl.textContent=`${Number(eventEffectiveBP(actor)||actor.bp||0).toLocaleString()} BP`;if(lvl)lvl.textContent=`LV.${actor.level||1} · RANK ${actor.rank||1}`;if(wait) wait.textContent = side==='you' ? (active ? 'YOUR TURN' : 'WAIT FOR YOUR TURN') : (active ? 'RIVAL IS ACTING' : 'NEXT TURN');
 };
 setSide('you',you,myTurn); setSide('rival',rival,rivalTurn);
}
function prepareTurn(){
 if(game.turn>MAX_TURNS){finishBattle();return}
 const actor=actorFor(game.activeSide);
 if(!game.waitingRemote)tickActorCooldowns(game.activeSide,actor);
 renderActiveCharacter();
 $('activeOwner').textContent=game.activeSide==='you'?'YOUR TURN':'RIVAL TURN';
 $('activeCharName').textContent=actor.name;
 $('activeCharType').textContent=`${actor.type} · BP ${actor.bp.toLocaleString()}`;
 if(game.activeSide==='you'&&!game.waitingRemote)renderSkills(actor);
 else{$('skillGrid').innerHTML='<div class="ep-skill-wait">WAITING FOR RIVAL...</div>';if(!game.remote)setTimeout(()=>aiAct(actor),650)}
 renderBattle()
}
function renderSkills(actor){
 const cds=currentCooldowns('you');
 $('skillGrid').innerHTML=actor.skills.map((s,i)=>{
  const left=Number(cds[actor.id+':'+i]||0),base=eventSkillBaseCooldown(actor,i);
  const cdLabel=base===0?'NO CD':(left>0?`COOLDOWN ${left}T`:`CD ${base}T`);
  return `<button class="ep-skill ${left>0?'on-cooldown':''}" data-skill="${i}" ${left>0?'disabled':''}><b>SKILL ${i+1} · ${cdLabel}</b><span>${s[0]}</span><small>${s[1]}</small></button>`;
 }).join('');
 document.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>useSkill(actor,Number(b.dataset.skill)))
}
function addScore(side,type,n){const p=currentPoints(side);p[type]=Math.max(0,p[type]+Math.round(n))}
function multiplier(side,type,actor){
 const b=currentSideState(side);let m=1;

 const shihoBranches=danceBranchCountForSide(side,'shiho');
 const enemySide=side==='you'?'rival':'you';
 const enemyNeneBranches=danceBranchCountForSide(enemySide,'nene');

 m*=1+(b.all||0)/100;
 m*=1+(b[type]||0)/100;

 if(b.self&&b.selfActor===actor.id)m*=1+b.self/100;
 if(b.other&&b.otherTurns>0&&actor.type!==b.otherSource)m*=1+b.other/100;
 if(b.encoreBoost&&b.encoreActor===actor.id)m*=1+b.encoreBoost/100;
 if(b.ichikaChainTurns>0)m*=1+((actor.type!=='RAP'?35:25)/100);
 if(b.ruiJamActions>0&&b.ruiJamType===type)m*=.8;

 // NENE active suppression.
 if(b.neneSuppressionActions>0){
   m*=Math.max(.1,1-Number(b.neneSuppression||0)/100);
 }

 // SHIHO Branch I.
 if(shihoBranches>=1)m*=1.08;

 // NENE Branch II — permanent pressure on the rival.
 if(enemyNeneBranches>=2)m*=.92;

 // SHIHO Branch VI — every third allied scoring action is amplified.
 if(
   shihoBranches>=6 &&
   ((Number(b.danceBeatCount||0)+1)%3===0)
 ){
   m*=1.50;
 }

 return m;
}
function setCd(side,actor,i,n){const c=currentCooldowns(side),k=actor.id+':'+i;c[k]=Math.max(Number(c[k]||0),Number(n)||0)}
function useSkill(actor,i){if(game.activeSide!=='you'||game.waitingRemote)return;const acted=applySkill('you',actor,i);if(acted===false)return;endTurn();if(game.remote)syncRemoteState()}

function consumeScoreActionBuffs(side,type,actor){
 const b=currentSideState(side);

 if(b.encoreActor===actor.id){
   b.encoreBoost=0;
   b.encoreActor=null;
 }

 if(b.ichikaChainTurns>0){
   b.ichikaChainTurns--;
 }

 if(b.ruiJamActions>0&&b.ruiJamType===type){
   b.ruiJamActions--;

   if(b.ruiJamActions<=0){
     b.ruiJamActions=0;
     b.ruiJamType=null;
   }
 }

 if(b.neneSuppressionActions>0){
   b.neneSuppressionActions--;

   if(b.neneSuppressionActions<=0){
     b.neneSuppressionActions=0;
     b.neneSuppression=0;
   }
 }

 const otherSide=side==='you'?'rival':'you';

 // SHIHO Branch VI:
 // every 3rd allied scoring action gains priority and erases the
 // enemy's current highest attribute.
 if(danceBranchCountForSide(side,'shiho')>=6){
   b.danceBeatCount=(Number(b.danceBeatCount||0)+1)%3;

   if(b.danceBeatCount===0){
     b.priority=1;

     const enemyPoints=currentPoints(otherSide);
     const highest=['vocal','rap','act']
       .sort((a,c)=>enemyPoints[c]-enemyPoints[a])[0];

     const reduced=reduceEnemyScore(side,highest,900);

     game?.log?.push(
       `<b>LIME APOCALYPSE</b> — ${highest.toUpperCase()} -${reduced.toLocaleString()} · PRIORITY.`
     );
   }
 }

 const enemyNeneBranches=danceBranchCountForSide(otherSide,'nene');

 // NENE Branch III:
 // each 3rd enemy scoring action loses extra points from the same attribute.
 if(enemyNeneBranches>=3){
   b.neneDoomCount=Number(b.neneDoomCount||0)+1;

   if(b.neneDoomCount%3===0){
     const reduced=reduceEnemyScore(otherSide,type,500);

     game?.log?.push(
       `<b>NENE · ERROR STACK</b> — ${type.toUpperCase()} -${reduced.toLocaleString()}.`
     );
   }
 }

 // NENE Branch VI:
 // each 4th enemy scoring action is a full shutdown.
 if(enemyNeneBranches>=6&&b.neneDoomCount>0&&b.neneDoomCount%4===0){
   ['vocal','rap','act'].forEach(t=>{
     reduceEnemyScore(otherSide,t,900);
   });

   b.neneSuppression=Math.max(Number(b.neneSuppression||0),50);
   b.neneSuppressionActions=Math.max(Number(b.neneSuppressionActions||0),1);
   b.priority=0;

   game?.log?.push(
     '<b>NENE · TOTAL OVERRIDE</b> — VOCAL / RAP / ACT -900 · PRIORITY CANCEL · next scoring action -50%.'
   );
 }
}
function reduceEnemyScore(attackerSide,targetType,amount){
 const defenderSide=attackerSide==='you'?'rival':'you';
 const defenderBuff=currentSideState(defenderSide);
 const enemy=attackerSide==='you'?game.enemy:game.points;
 if(defenderBuff.shield>0){
   defenderBuff.shield--;
   game.log.push(`<b>SHOTA</b> — NO WRONG NOTE blocked a score-reduction effect. (${defenderBuff.shield} shield left)`);
   return 0;
 }
 let finalAmount=Number(amount)||0;

 const neneBranches=danceBranchCountForSide(attackerSide,'nene');
 if(neneBranches>=1)finalAmount*=1.15;
 if(neneBranches>=5)finalAmount*=1.20;

 if(defenderBuff.ruiMarkTurns>0){
   finalAmount=Math.round(finalAmount*1.25);
   defenderBuff.ruiMarkTurns=0;
   game.log.push(`<b>RUI MARK</b> — the debuff was amplified by 25%.`);
 }
 enemy[targetType]=Math.max(0,Number(enemy[targetType]||0)-finalAmount);
 return finalAmount;
}
function openRuiJamPicker(side,actor,i){
 if(side!=='you'){
   const target=['vocal','rap','act'].sort((a,b)=>game.points[b]-game.points[a])[0];
   game.buffs.you.ruiJamType=target;
   game.buffs.you.ruiJamActions=2;
   setCd(side,actor,i,3);
   game.log.push(`<b>${actor.name}</b> used DIRECTOR'S TRICK — ${target.toUpperCase()} JAM for 2 scoring actions.`);
   return true;
 }
 let overlay=$('ruiJamPicker');
 if(!overlay){
   overlay=document.createElement('div');
   overlay.id='ruiJamPicker';
   overlay.className='ep-rps hidden';
   overlay.innerHTML=`<div class="ep-rps-modal"><small>RUI KAMISHIRO · SKILL 2</small><h2>DIRECTOR'S TRICK</h2><p>Chọn hệ muốn JAM. Đối thủ bị -20% điểm hệ đó trong 2 hành động tính điểm.</p><div class="rps-buttons" id="ruiJamChoices"><button data-rui-jam="vocal">VOCAL</button><button data-rui-jam="rap">RAP</button><button data-rui-jam="act">ACT</button></div></div>`;
   document.body.appendChild(overlay);
 }
 overlay.classList.remove('hidden');
 overlay.querySelectorAll('[data-rui-jam]').forEach(btn=>btn.onclick=()=>{
   const target=btn.dataset.ruiJam;
   overlay.classList.add('hidden');
   game.buffs.rival.ruiJamType=target;
   game.buffs.rival.ruiJamActions=2;
   setCd('you',actor,i,3);
   game.specialEnergy=Math.min(100,game.specialEnergy+10);
   game.log.push(`<b>RUI KAMISHIRO</b> used DIRECTOR'S TRICK — ${target.toUpperCase()} JAM for 2 rival scoring actions.`);
   endTurn();
   if(game.remote)syncRemoteState();
 });
 return false;
}
function openShotaEncorePicker(side,actor,i){
 if(side!=='you'){
   const team=game.rival;
   const current=game.actorIndex.rival;
   const pick=team.map((c,idx)=>({c,idx})).filter(x=>x.idx!==current).sort((a,b)=>b.c.bp-a.c.bp)[0];
   if(pick){
     game.actorIndex.rival=pick.idx;
     game.buffs.rival.encoreBoost=45;game.buffs.rival.ruiJamActions=0;game.buffs.rival.ruiJamType=null;game.buffs.rival.ruiMarkTurns=0;game.buffs.rival.neneSuppression=0;game.buffs.rival.neneSuppressionActions=0;
     game.buffs.rival.encoreActor=pick.c.id;
     game._shotaEncoreQueuedRival=true;
   }
   setCd(side,actor,i,3);
   return true;
 }
 let overlay=$('shotaEncorePicker');
 if(!overlay){
   overlay=document.createElement('div');
   overlay.id='shotaEncorePicker';
   overlay.className='ep-rps hidden';
   overlay.innerHTML=`<div class="ep-rps-modal"><small>SHOTA · SKILL 3</small><h2>ENCORE PROTECTION</h2><p>Chọn 1 đồng minh hành động ngay. Hành động đó được +25%.</p><div class="rps-buttons" id="shotaEncoreChoices"></div></div>`;
   document.body.appendChild(overlay);
 }
 const list=$('shotaEncoreChoices');
 const current=game.actorIndex.you;
 list.innerHTML=game.you.map((c,idx)=>({c,idx})).filter(x=>x.idx!==current).map(x=>`<button data-shota-encore="${x.idx}">${x.c.name}<small> · ${x.c.type}</small></button>`).join('');
 overlay.classList.remove('hidden');
 list.querySelectorAll('[data-shota-encore]').forEach(btn=>btn.onclick=()=>{
   const idx=Number(btn.dataset.shotaEncore);
   const c=game.you[idx];
   overlay.classList.add('hidden');
   game.actorIndex.you=idx;
   game.buffs.you.encoreBoost=45;game.buffs.you.ruiJamActions=0;game.buffs.you.ruiJamType=null;game.buffs.you.ruiMarkTurns=0;game.buffs.you.neneSuppression=0;game.buffs.you.neneSuppressionActions=0;
   game.buffs.you.encoreActor=c.id;
   game._shotaEncoreQueued=true;
   setCd('you',actor,i,3);
   game.specialEnergy=Math.min(100,game.specialEnergy+10);
   game.log.push(`<b>SHOTA</b> — ${c.name} acts immediately with +45% · control effects cleansed.`);
   endTurn();
   if(game.remote)syncRemoteState();
 });
 return false;
}
function processRuiBombAfterAction(actedSide){
 const b=currentSideState(actedSide);
 if(!b.ruiBombActions||b.ruiBombActions<=0)return;
 b.ruiBombActions--;
 if(b.ruiBombActions>0)return;
 const targetPoints=currentPoints(actedSide);
 const highest=['vocal','rap','act'].sort((a,c)=>targetPoints[c]-targetPoints[a])[0];
 const attackerSide=actedSide==='you'?'rival':'you';
 const attackerPoints=currentPoints(attackerSide);
 const reduced=reduceEnemyScore(attackerSide,highest,1500);
 attackerPoints.act=Math.max(0,Number(attackerPoints.act||0)+1500);
 b.ruiBombActions=0;
 b.ruiBombOwner=null;
 game.log.push(`<b>GRAND FINALE</b> detonated — ${highest.toUpperCase()} -${reduced.toLocaleString()} · Rui side ACT +1,500.`);
}

function sideHasCharacter(side,id){
 const team=side==='you'?game?.you:game?.rival;
 return Array.isArray(team)&&team.some(c=>c?.id===id);
}
function findSideCharacterIndex(side,id){
 const team=side==='you'?game?.you:game?.rival;
 return Array.isArray(team)?team.findIndex(c=>c?.id===id):-1;
}
function applySkill(side,actor,i){
 const s=actor.skills[i],type=s[3],target=s[4],b=currentSideState(side); let value=s[2]||0,msg=`<b>${actor.name}</b> used ${s[0]}.`;
 if(type==='point'){let m=multiplier(side,target,actor);if(actor.id==='lumina'&&i===1&&Math.random()<.40)m*=1.50;const aiScale=(side==='rival'&&!game.remote)?.5:1;const roll=eventScoreRoll(side,actor,target,value);addScore(side,target,roll.amount*m*aiScale);consumeScoreActionBuffs(side,target,actor);if(b.selfActor===actor.id)b.self=0,b.selfActor=null;if(b.otherTurns>0&&actor.type!==b.otherSource)b.otherTurns--;if(b.allTurns>0)b.allTurns--;if(b.allTurns===0)b.all=0;}
 else if(type==='debuff'){const aiScale=(side==='rival'&&!game.remote)?.5:1;const roll=eventScoreRoll(side,actor,target,value);addScore(side,target,roll.amount*multiplier(side,target,actor)*aiScale);consumeScoreActionBuffs(side,target,actor);const reduced=reduceEnemyScore(side,target,actor.id==='lumina'?1800:1100);if(actor.id==='lumina'){b.all=Math.max(Number(b.all||0),25*(1+(actor.combatStats?.skillEffect||0)/100));b.allTurns=Math.max(Number(b.allTurns||0),1);}msg+=` Enemy ${target.toUpperCase()} -${reduced.toLocaleString()}.${actor.id==='lumina'?' Next allied scoring action +25%.':''}`;setCd(side,actor,i,3);}
 else if(type==='kohaneBlessing'){
   b.all=Math.max(Number(b.all||0),60*(1+(actor.combatStats?.skillEffect||0)/100));
   b.allTurns=Math.max(Number(b.allTurns||0),2);
   setCd(side,actor,i,2);
   msg+=' The next 2 allied scoring actions get +60%.';
 }
 else if(type==='kohaneDivine'){
   const aiScale=(side==='rival'&&!game.remote)?.5:1;
   const roll=eventScoreRoll(side,actor,'rap',value);
   addScore(side,'rap',roll.amount*multiplier(side,'rap',actor)*aiScale);
   consumeScoreActionBuffs(side,'rap',actor);
   b.priority=1;
   b.all=Math.max(Number(b.all||0),35*(1+(actor.combatStats?.skillEffect||0)/100));
   b.allTurns=Math.max(Number(b.allTurns||0),1);
   setCd(side,actor,i,3);
   msg+=' +1,800 RAP · priority · next allied scoring action +35%.';
 }
 else if(type==='teambuff'){b.all=30*(1+(actor.combatStats?.skillEffect||0)/100);b.allTurns=2;setCd(side,actor,i,2);msg+=' The next 2 allied scoring actions get +30%.';}
 else if(type==='teamBuff'){b.all=55*(1+(actor.combatStats?.skillEffect||0)/100);b.allTurns=1;setCd(side,actor,i,2);msg+=' The next allied scoring action gets +55%.';}
 else if(type==='selfbuff'){const aiScale=(side==='rival'&&!game.remote)?.5:1;addScore(side,target,value*multiplier(side,target,actor)*aiScale);b.self=15*(1+(actor.combatStats?.skillEffect||0)/100);b.selfActor=actor.id;msg+=' Next Miku scoring action +15%.';}
 else if(type==='steal'){b.skipAlliedTurns=2;setCd(side,actor,i,3);b.self=300;b.selfActor=actor.id;msg+=' Akito takes the next 2 allied turns; his next scoring action is +300%.';}
 else if(type==='otherbuff'){b.other=30*(1+(actor.combatStats?.skillEffect||0)/100);b.otherSource=actor.type;b.otherTurns=2;b.self=Math.max(Number(b.self||0),50);b.selfActor=actor.id;setCd(side,actor,i,3);msg+=' Other-attribute allies next 2 scoring actions +30%; Akito next +50%.';}
 else if(type==='priority'){b.priority=1;msg+=' Team gets priority on the next turn.';}
 else if(type==='chooseNext'){ if(side==='you'){openMikuTurnPicker();return false;} }
 else if(type==='shield'){const count=actor.id==='shota'?3:2;b.shield=Math.max(Number(b.shield||0),count);if(actor.id==='shota'){b.all=Math.max(Number(b.all||0),25*(1+(actor.combatStats?.skillEffect||0)/100));b.allTurns=Math.max(Number(b.allTurns||0),2);}setCd(side,actor,i,3);msg+=actor.id==='shota'?' Block 3 reductions · next 2 allies +25%.':' The next 2 enemy score-reduction effects are blocked.';}
 else if(type==='shotaEncore'){return openShotaEncorePicker(side,actor,i);}
 else if(type==='ruiMark'){
   const aiScale=(side==='rival'&&!game.remote)?.5:1;
   const roll=eventScoreRoll(side,actor,'act',value);addScore(side,'act',roll.amount*multiplier(side,'act',actor)*aiScale);
   consumeScoreActionBuffs(side,'act',actor);
   const enemyBuff=currentSideState(side==='you'?'rival':'you');
   enemyBuff.ruiMarkTurns=2;
   setCd(side,actor,i,2);
   msg+=' Enemy is MARKED; the next score-reduction debuff against them is +25%.';
 }
 else if(type==='ruiJam'){return openRuiJamPicker(side,actor,i);}
 else if(type==='ruiBomb'){
   const enemyBuff=currentSideState(side==='you'?'rival':'you');
   enemyBuff.ruiBombActions=2;
   enemyBuff.ruiBombOwner=side;
   setCd(side,actor,i,4);
   msg+=' DELAYED BOMB armed for 2 enemy actions.';
 }
 else if(type==='teamAdvance'){b.extraTurns=2;setCd(side,actor,i,3);msg+=' Miku advances the other two allied characters before the rival gets a turn.';}
 else if(type==='ichikaChain'){b.ichikaChainTurns=2;setCd(side,actor,i,2);msg+=' The next 2 allied scoring actions gain +25%, or +35% for non-RAP allies.';}
 else if(type==='ichikaMeasure'){const aiScale=(side==='rival'&&!game.remote)?.5:1;const roll=eventScoreRoll(side,actor,'rap',value);addScore(side,'rap',roll.amount*multiplier(side,'rap',actor)*aiScale);consumeScoreActionBuffs(side,'rap',actor);b.priority=1;setCd(side,actor,i,3);msg+=' Team gets priority next turn.';}
 else if(type==='touyaLink'){b.all=35*(1+(actor.combatStats?.skillEffect||0)/100);b.allTurns=2;setCd(side,actor,i,2);msg+=' Next 2 allied scoring actions +35%.';}
 else if(type==='touyaOverride'){const aiScale=(side==='rival'&&!game.remote)?.5:1;const roll=eventScoreRoll(side,actor,'vocal',value);addScore(side,'vocal',roll.amount*multiplier(side,'vocal',actor)*aiScale);consumeScoreActionBuffs(side,'vocal',actor);const enemy=currentPoints(side==='you'?'rival':'you');const highest=['vocal','rap','act'].sort((a,c)=>enemy[c]-enemy[a])[0];const reduced=reduceEnemyScore(side,highest,900);setCd(side,actor,i,3);msg+=` Enemy ${highest.toUpperCase()} -${reduced.toLocaleString()}.`;}
 else if(type==='airiCheer'){b.all=25*(1+(actor.combatStats?.skillEffect||0)/100);b.allTurns=2;setCd(side,actor,i,2);msg+=' Next 2 allied scoring actions +25%.';}
 else if(type==='airiSmile'){const aiScale=(side==='rival'&&!game.remote)?.5:1;const roll=eventScoreRoll(side,actor,'act',value);addScore(side,'act',roll.amount*multiplier(side,'act',actor)*aiScale);consumeScoreActionBuffs(side,'act',actor);b.shield=Math.max(Number(b.shield||0),1);setCd(side,actor,i,3);msg+=' One enemy score-reduction effect will be blocked.';}
 else if(type==='akitoWarm'){b.all=15*(1+(actor.combatStats?.skillEffect||0)/100);b.allTurns=1;setCd(side,actor,i,2);msg+=' Next allied scoring action +15%.';}
 else if(type==='akitoSpark'){const aiScale=(side==='rival'&&!game.remote)?.5:1;const roll=eventScoreRoll(side,actor,'act',value);addScore(side,'act',roll.amount*multiplier(side,'act',actor)*aiScale);consumeScoreActionBuffs(side,'act',actor);b.other=10*(1+(actor.combatStats?.skillEffect||0)/100);b.otherSource=actor.type;b.otherTurns=1;setCd(side,actor,i,3);msg+=' Other-type ally next scoring action +10%.';}
 else if(type==='dancePulse'){
   b.all=Math.max(
     Number(b.all||0),
     Number(value||35)*(1+(actor.combatStats?.skillEffect||0)/100)
   );
   b.allTurns=Math.max(Number(b.allTurns||0),2);
   msg+=' Next 2 allied scoring actions +35%.';
 }
 else if(type==='danceSync'){
   b.all=Math.max(
     Number(b.all||0),
     Number(value||45)*(1+(actor.combatStats?.skillEffect||0)/100)
   );
   b.allTurns=Math.max(Number(b.allTurns||0),3);
   b.priority=1;
   setCd(side,actor,i,2);
   msg+=' Next 3 allied scoring actions +45% · PRIORITY.';
 }
 else if(type==='danceOverdrive'){
   b.all=Math.max(
     Number(b.all||0),
     Number(value||60)*(1+(actor.combatStats?.skillEffect||0)/100)
   );
   b.allTurns=Math.max(Number(b.allTurns||0),3);
   b.priority=1;
   b.shield=Math.max(Number(b.shield||0),1);

   // Cleanse hostile score-control effects on Shiho's team.
   b.ruiJamActions=0;
   b.ruiJamType=null;
   b.ruiMarkTurns=0;

   setCd(side,actor,i,3);
   msg+=' Next 3 allied scoring actions +60% · cleanse · shield · PRIORITY.';
 }
 else if(type==='neneDrain'){
   const enemy=currentPoints(side==='you'?'rival':'you');
   const highest=['vocal','rap','act'].sort((a,c)=>enemy[c]-enemy[a])[0];
   const reduced=reduceEnemyScore(side,highest,1800);
   setCd(side,actor,i,2);
   msg+=` Enemy ${highest.toUpperCase()} -${reduced.toLocaleString()}.`;
 }
 else if(type==='neneErrorField'){
   let totalReduced=0;
   ['vocal','rap','act'].forEach(t=>{
     totalReduced+=reduceEnemyScore(side,t,1200);
   });

   const enemyBuff=currentSideState(side==='you'?'rival':'you');
   const bonusTurns=danceBranchCountForSide(side,'nene')>=5?1:0;

   enemyBuff.neneSuppression=Math.max(
     Number(enemyBuff.neneSuppression||0),
     25
   );
   enemyBuff.neneSuppressionActions=Math.max(
     Number(enemyBuff.neneSuppressionActions||0),
     3+bonusTurns
   );

   setCd(side,actor,i,4);
   msg+=` VOCAL / RAP / ACT total -${totalReduced.toLocaleString()} · suppression -25% for ${3+bonusTurns} scoring actions.`;
 }
 else if(type==='neneShutdown'){
   const enemy=currentPoints(side==='you'?'rival':'you');
   const ordered=['vocal','rap','act'].sort((a,c)=>enemy[c]-enemy[a]);

   const highestReduced=reduceEnemyScore(side,ordered[0],4000);
   const secondReduced=reduceEnemyScore(side,ordered[1],2000);
   const thirdReduced=reduceEnemyScore(side,ordered[2],2000);

   const enemyBuff=currentSideState(side==='you'?'rival':'you');
   const bonusTurns=danceBranchCountForSide(side,'nene')>=5?1:0;

   enemyBuff.neneSuppression=Math.max(
     Number(enemyBuff.neneSuppression||0),
     40
   );
   enemyBuff.neneSuppressionActions=Math.max(
     Number(enemyBuff.neneSuppressionActions||0),
     2+bonusTurns
   );
   enemyBuff.priority=0;

   b.priority=1;

   setCd(side,actor,i,6);
   msg+=` ${ordered[0].toUpperCase()} -${highestReduced.toLocaleString()} · ${ordered[1].toUpperCase()} -${secondReduced.toLocaleString()} · ${ordered[2].toUpperCase()} -${thirdReduced.toLocaleString()} · suppression -40% · rival PRIORITY removed.`;
 }
 else if(type==='nsAkitoBurst'){
   const aiScale=(side==='rival'&&!game.remote)?.5:1;
   let m=multiplier(side,'vocal',actor);
   if(sideHasCharacter(side,'ns_an'))m*=1.30;
   const roll=eventScoreRoll(side,actor,'vocal',value);
   addScore(side,'vocal',roll.amount*m*aiScale);
   consumeScoreActionBuffs(side,'vocal',actor);
   msg+=sideHasCharacter(side,'ns_an')?' AN PARTNER BONUS +30%.':'';
 }
 else if(type==='nsAkitoAllIn'){
   const aiScale=(side==='rival'&&!game.remote)?.5:1;
   let consumed=0;
   if(Number(b.allTurns||0)>0){consumed++;b.all=0;b.allTurns=0;}
   if(Number(b.otherTurns||0)>0){consumed++;b.other=0;b.otherTurns=0;}
   if(Number(b.self||0)>0&&b.selfActor===actor.id){consumed++;b.self=0;b.selfActor=null;}
   if(Number(b.priority||0)>0){consumed++;b.priority=0;}
   let amp=1+Math.min(1.40,consumed*.35);
   if(sideHasCharacter(side,'ns_an'))amp*=1.20;
   const roll=eventScoreRoll(side,actor,'vocal',value);
   addScore(side,'vocal',roll.amount*multiplier(side,'vocal',actor)*amp*aiScale);
   consumeScoreActionBuffs(side,'vocal',actor);
   b.self=Math.max(Number(b.self||0),75);b.selfActor=actor.id;
   setCd(side,actor,i,3);
   msg+=` ALL-IN consumed ${consumed} effect(s) · attack ×${amp.toFixed(2)} · next Akito +75%.`;
 }
 else if(type==='nsAkitoFinale'){
   const aiScale=(side==='rival'&&!game.remote)?.5:1;
   let m=multiplier(side,'vocal',actor);
   if(sideHasCharacter(side,'ns_an'))m*=1.30;
   const roll=eventScoreRoll(side,actor,'vocal',value);
   addScore(side,'vocal',roll.amount*m*aiScale);
   consumeScoreActionBuffs(side,'vocal',actor);
   b.self=Math.max(Number(b.self||0),100);b.selfActor=actor.id;
   if(sideHasCharacter(side,'ns_an'))b.priority=1;
   setCd(side,actor,i,4);
   msg+=` Next Akito +100%.${sideHasCharacter(side,'ns_an')?' AN PARTNER → PRIORITY.':''}`;
 }
 else if(type==='nsAnSupport'){
   b.all=Math.max(Number(b.all||0),45*(1+(actor.combatStats?.skillEffect||0)/100));
   b.allTurns=Math.max(Number(b.allTurns||0),2);
   if(sideHasCharacter(side,'ns_akito')){b.self=Math.max(Number(b.self||0),70);b.selfActor='ns_akito';}
   msg+=` Pure support · next 2 allies +45%.${sideHasCharacter(side,'ns_akito')?' Akito next +70%.':''}`;
 }
 else if(type==='nsAnPartner'){
   const idx=findSideCharacterIndex(side,'ns_akito');
   if(idx>=0){
     game.actorIndex[side]=idx;
     b.encoreBoost=80;b.encoreActor='ns_akito';
     if(side==='you')game._shotaEncoreQueued=true;else game._shotaEncoreQueuedRival=true;
     msg+=' PARTNER LINK → Akito acts immediately with +80%.';
   }else{
     b.all=Math.max(Number(b.all||0),40*(1+(actor.combatStats?.skillEffect||0)/100));
     b.allTurns=Math.max(Number(b.allTurns||0),3);
     msg+=' No Akito · next 3 allies +40%.';
   }
   setCd(side,actor,i,3);
 }
 else if(type==='nsAnUltimate'){
   b.ruiJamActions=0;b.ruiJamType=null;b.ruiMarkTurns=0;b.neneSuppression=0;b.neneSuppressionActions=0;
   b.shield=Math.max(Number(b.shield||0),2);
   b.all=Math.max(Number(b.all||0),55*(1+(actor.combatStats?.skillEffect||0)/100));
   b.allTurns=Math.max(Number(b.allTurns||0),3);
   b.priority=1;
   if(sideHasCharacter(side,'ns_akito')){b.self=Math.max(Number(b.self||0),100);b.selfActor='ns_akito';}
   setCd(side,actor,i,4);
   msg+=` Cleanse · shield 2 · next 3 allies +55% · PRIORITY.${sideHasCharacter(side,'ns_akito')?' Akito next +100%.':''}`;
 }
 else if(type==='nsSakiTune'){
   if(Number(b.allTurns||0)>0){b.all=Number(b.all||0)*1.25;b.allTurns+=1;}
   else{b.all=Math.max(Number(b.all||0),20);b.allTurns=Math.max(Number(b.allTurns||0),2);}
   if(Number(b.otherTurns||0)>0)b.otherTurns+=1;
   if(Number(b.ichikaChainTurns||0)>0)b.ichikaChainTurns+=1;
   b.shield=Math.max(Number(b.shield||0),1);
   msg+=' Existing effects strengthened/extended · shield +1.';
 }
 else if(type==='nsSakiChain'){
   b.all=Math.max(Number(b.all||0),40*(1+(actor.combatStats?.skillEffect||0)/100));
   b.allTurns=Math.max(Number(b.allTurns||0),3);
   b.priority=1;b.shield=Math.max(Number(b.shield||0),1);
   setCd(side,actor,i,2);
   msg+=' Next 3 allies +40% · PRIORITY · shield +1.';
 }
 else if(type==='nsSakiAlchemy'){
   b.ruiJamActions=0;b.ruiJamType=null;b.ruiMarkTurns=0;b.neneSuppression=0;b.neneSuppressionActions=0;
   b.all=Math.max(Number(b.all||0),55*(1+(actor.combatStats?.skillEffect||0)/100));
   b.allTurns=Math.max(Number(b.allTurns||0),3)+2;
   if(Number(b.otherTurns||0)>0)b.otherTurns+=2;
   if(Number(b.ichikaChainTurns||0)>0)b.ichikaChainTurns+=2;
   b.shield=Math.max(Number(b.shield||0),2);b.priority=1;
   setCd(side,actor,i,4);
   msg+=' Cleanse · effects extended · team +55% · shield 2 · PRIORITY.';
 }
 else if(type==='sakiEncore'){
   const aiScale=(side==='rival'&&!game.remote)?.5:1;
   const roll=eventScoreRoll(side,actor,'act',value);
   addScore(side,'act',roll.amount*multiplier(side,'act',actor)*aiScale);
   consumeScoreActionBuffs(side,'act',actor);
   b.priority=1;
   setCd(side,actor,i,3);
   msg+=' Team gets priority next turn.';
 }
 else if(type==='lukaGuard'){
   const aiScale=(side==='rival'&&!game.remote)?.5:1;
   const roll=eventScoreRoll(side,actor,'vocal',value);
   addScore(side,'vocal',roll.amount*multiplier(side,'vocal',actor)*aiScale);
   consumeScoreActionBuffs(side,'vocal',actor);
   b.shield=Math.max(Number(b.shield||0),1);
   setCd(side,actor,i,3);
   msg+=' One enemy score-reduction effect will be blocked.';
 }
 // Default cooldown fallback. Nene is a special long-CD DANCE breaker,
 // including a cooldown on Skill 1.
 const baseCd=eventSkillBaseCooldown(actor,i);
 if(baseCd>0 && Number(currentCooldowns(side)[actor.id+':'+i]||0)<=0){
   setCd(side,actor,i,baseCd);
 }
 game[side==='you'?'specialEnergy':'enemySpecialEnergy']=Math.min(100,game[side==='you'?'specialEnergy':'enemySpecialEnergy']+10);game.log.push(msg);renderBattle();return true;
}
function openMikuTurnPicker(){
 let overlay=$('mikuTurnPicker'); if(!overlay){overlay=document.createElement('div');overlay.id='mikuTurnPicker';overlay.className='ep-rps';overlay.innerHTML='<div class="ep-rps-modal"><small>HATSUNE MIKU · SKILL 2</small><h2>CHOOSE WHO ACTS NEXT</h2><p>Select 1 of your 3 characters.</p><div class="rps-buttons" id="mikuTurnChoices"></div></div>';document.body.appendChild(overlay);}
 const list=$('mikuTurnChoices');const mikuActorIndex=game.actorIndex.you;list.innerHTML=game.you.map((c,i)=>({c,i})).filter(x=>x.i!==mikuActorIndex).map(x=>`<button data-miku-actor="${x.i}">${x.c.name}<small> · ${x.c.type}</small></button>`).join('');overlay.classList.remove('hidden');list.querySelectorAll('[data-miku-actor]').forEach(btn=>btn.onclick=()=>{const idx=Number(btn.dataset.mikuActor);overlay.classList.add('hidden');game.actorIndex.you=idx;game.log.push(`<b>HATSUNE MIKU</b> — ${game.you[idx].name} is pushed to act immediately after Miku.`);game.mikuQueued=true;game.mikuQueuedIndex=idx;setCd('you',CHARS.miku6,1,EVENT_SKILL_CD[1]);game[game.activeSide==='you'?'specialEnergy':'enemySpecialEnergy']=Math.min(100,game[game.activeSide==='you'?'specialEnergy':'enemySpecialEnergy']+10);endTurn();if(game.remote)syncRemoteState();});
}
function specialUse(){if(game.specialEnergy<100||game.activeSide!=='you'||game.waitingRemote)return;const c=game.special;if(c.id==='akito'){['vocal','rap','act'].forEach(t=>game.enemy[t]=Math.floor(game.enemy[t]*.7));game.log.push('<b>AKITO SPECIAL</b> — Enemy VOCAL / RAP / ACT reduced by 30%.')}else if(c.id==='kohane'){
 game.buffs.you.all=Math.max(Number(game.buffs.you.all||0),60);
 game.buffs.you.allTurns=Math.max(Number(game.buffs.you.allTurns||0),5);
 game.buffs.you.blessingTurns=5;
 game.buffs.you.priority=1;
 game.buffs.you.shield=Math.max(Number(game.buffs.you.shield||0),1);
 game.log.push('<b>KOHANE SPECIAL</b> — Next 5 allied scoring actions +60% · priority · block 1 score-reduction debuff.');
}game.specialEnergy=0;endTurn();if(game.remote)syncRemoteState()}

$('specialSkill').onclick=specialUse;
function aiAct(actor){if(game.activeSide!=='rival'||game.remote)return;const choices=actor.skills.map((s,i)=>({i,s})).filter(x=>!currentCooldowns('rival')[actor.id+':'+x.i]);choices.sort((a,b)=>(b.s[2]||0)-(a.s[2]||0));applySkill('rival',actor,(choices[0]||{i:0}).i);endTurn()}
function endTurn(){
 const actedSide=game.activeSide;
 const actedBuff=game.buffs[actedSide];
 const team=game[actedSide==='you'?'you':'rival'];
 const actedActor=actorFor(actedSide);
 processRuiBombAfterAction(actedSide);
 const actedSideBuff=currentSideState(actedSide);
 if(actedSideBuff.ruiMarkTurns>0){
   actedSideBuff.ruiMarkTurns--;
   if(actedSideBuff.ruiMarkTurns<0)actedSideBuff.ruiMarkTurns=0;
 }

 if(actedSide==='you'&&game._shotaEncoreQueued){
   game._shotaEncoreQueued=false;
   game.activeSide='you';
   game.turn++;
   if(game.turn>MAX_TURNS){finishBattle();return}
   prepareTurn();
   return;
 }
 if(actedSide==='rival'&&game._shotaEncoreQueuedRival){
   game._shotaEncoreQueuedRival=false;
   game.activeSide='rival';
   game.turn++;
   if(game.turn>MAX_TURNS){finishBattle();return}
   prepareTurn();
   return;
 }
 if(actedSide==='you'&&game.mikuQueued){ game.mikuQueued=false; game.activeSide='you'; game.turn++; if(game.turn>MAX_TURNS){finishBattle();return} prepareTurn(); return; }

 // Akito Skill 2: the next TWO allied characters lose their turns.
 // They are skipped from the actor rotation; the opponent then acts,
 // and the actor rotation resumes from Akito on the next allied turn.
 const stealCount=Number(actedBuff.skipAlliedTurns||0);
 if(stealCount>0){
   game.actorIndex[actedSide]=(game.actorIndex[actedSide]+1+stealCount)%team.length;
   actedBuff.skipAlliedTurns=0;
   actedBuff.self=300;
   actedBuff.selfActor=actedActor.id;
   game.activeSide=actedSide==='you'?'rival':'you';
 } else {
   game.actorIndex[actedSide]=(game.actorIndex[actedSide]+1)%team.length;
   const other=actedSide==='you'?'rival':'you';
   if(actedBuff.extraTurns>0){
     actedBuff.extraTurns--;
     game.activeSide=actedSide;
   } else if(game.buffs[other].priority){
     game.activeSide=other;
     game.buffs[other].priority=0;
   } else {
     game.activeSide=other;
   }
 }

 game.turn++;
 if(game.turn>MAX_TURNS){finishBattle();return}
 prepareTurn();
}

async function syncRemoteState(extra={}){
 if(!game?.remote)return;
 const d=db();
 if(!d)return;
 if(remoteWriteBusy)return;
 remoteWriteBusy=true;
 game.waitingRemote=true;
 renderBattle();
 try{
  // IMPORTANT: never build a remote update from an old local copy alone.
  // Read the newest match first so the second RPS player cannot accidentally
  // overwrite the first player's RPS choice with a state containing only theirs.
  const latest=await d.from('event_matches').select('*').eq('id',game.matchId).single();
  if(latest.error||!latest.data)throw latest.error||new Error('MATCH STATE NOT FOUND');
  const serverRow=latest.data;
  const serverState=serverRow.state&&typeof serverRow.state==='object'?serverRow.state:{};

  if(extra.rpsChoice){
   const mergedRps={...(serverState.rps||{}),...(game._remoteRps||{}),[game.isP1?'p1':'p2']:extra.rpsChoice};
   const serverTurn=Number(serverState.turn)||game.turn||1;
   const canonical={
    ...serverState,
    turn:serverTurn,
    activeSide:serverState.activeSide??null,
    p1Points:serverState.p1Points||(game.isP1?game.points:game.enemy),
    p2Points:serverState.p2Points||(game.isP1?game.enemy:game.points),
    p1Special:serverState.p1Special??(game.isP1?game.specialEnergy:game.enemySpecialEnergy),
    p2Special:serverState.p2Special??(game.isP1?game.enemySpecialEnergy:game.specialEnergy),
    p1Buffs:serverState.p1Buffs|| (game.isP1?game.buffs.you:game.buffs.rival),
    p2Buffs:serverState.p2Buffs|| (game.isP1?game.buffs.rival:game.buffs.you),
    p1Cool:serverState.p1Cool|| (game.isP1?game.coolYou:game.coolRival),
    p2Cool:serverState.p2Cool|| (game.isP1?game.coolRival:game.coolYou),
    p1ActorIndex:serverState.p1ActorIndex??(game.isP1?game.actorIndex.you:game.actorIndex.rival),
    p2ActorIndex:serverState.p2ActorIndex??(game.isP1?game.actorIndex.rival:game.actorIndex.you),
    log:serverState.log||game.log,
    rps:mergedRps,
    status:'active'
   };
   game._remoteRps=mergedRps;
   // Resolve locally as soon as both choices are present. If only one
   // choice exists, submit that partial RPS state. If both exist, submit the
   // final state ONCE with the winner's activeSide already filled in.
   if(mergedRps.p1&&mergedRps.p2){
    // The opening toss is the authority for the FIRST turn.  Persist the
    // winner as activeSide; otherwise both browsers receive an RPS-complete
    // state with activeSide=null and both render WAITING FOR RIVAL forever.
    const beats=(a,b)=>(a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper');
    let p1First;
    if(mergedRps.p1===mergedRps.p2){
      const p1bp=Math.max(...(game.isP1?game.you:game.rival).map(c=>c.bp));
      const p2bp=Math.max(...(game.isP1?game.rival:game.you).map(c=>c.bp));
      p1First=p1bp>=p2bp;
    }else p1First=beats(mergedRps.p1,mergedRps.p2);
    canonical.activeSide=p1First?'p1':'p2';
    canonical.turn=serverTurn||1;
    const {data:resolved,error:resolveError}=await d.rpc('event_submit_action',{p_match_id:game.matchId,p_state:canonical,p_expected_turn:serverTurn});
    if(resolveError)throw resolveError;
    applyRemoteState({...serverRow,state:canonical,status:resolved?.status||'active'});
   }else{
    const {data,error}=await d.rpc('event_submit_action',{p_match_id:game.matchId,p_state:canonical,p_expected_turn:serverTurn});
    if(error)throw error;
    game.waitingRemote=true;
    $('rpsResult').textContent=`YOU: ${extra.rpsChoice.toUpperCase()} · WAITING FOR RIVAL...`;
    renderBattle();
   }
   return;
  }

  // Normal skill/turn update. Only submit while this browser actually owns
  // the turn. This prevents a stale browser tab from sending a second action.
  const serverActive=serverState.activeSide;
  const myServerSide=game.isP1?'p1':'p2';
  if(serverActive&&serverActive!==myServerSide){
   applyRemoteState(serverRow);
   return;
  }
  const serverTurn=Number(serverState.turn)||1;
  const expectedTurn=Math.max(1,game.turn-1);
  if(serverTurn!==expectedTurn && serverTurn!==game.turn){
   applyRemoteState(serverRow);
   return;
  }
  const canonical={
   ...serverState,
   turn:game.turn,
   activeSide:game.activeSide==='you'?myServerSide:(myServerSide==='p1'?'p2':'p1'),
   p1Points:game.isP1?game.points:structuredClone(serverState.p1Points||game.enemy),
   p2Points:game.isP1?structuredClone(serverState.p2Points||game.enemy):game.points,
   p1Special:game.isP1?game.specialEnergy:Number(serverState.p1Special??game.enemySpecialEnergy),
   p2Special:game.isP1?Number(serverState.p2Special??game.enemySpecialEnergy):game.specialEnergy,
   p1Buffs:game.isP1?game.buffs.you:structuredClone(serverState.p1Buffs||game.buffs.rival),
   p2Buffs:game.isP1?structuredClone(serverState.p2Buffs||game.buffs.rival):game.buffs.you,
   p1Cool:game.isP1?game.coolYou:structuredClone(serverState.p1Cool||game.coolRival),
   p2Cool:game.isP1?structuredClone(serverState.p2Cool||game.coolRival):game.coolYou,
   p1ActorIndex:game.isP1?game.actorIndex.you:Number(serverState.p1ActorIndex??game.actorIndex.rival),
   p2ActorIndex:game.isP1?Number(serverState.p2ActorIndex??game.actorIndex.rival):game.actorIndex.you,
   log:game.log,
   rps:game._remoteRps||serverState.rps||null,
   status:(game.turn>MAX_TURNS?'finished':'active')
  };
  const {data,error}=await d.rpc('event_submit_action',{p_match_id:game.matchId,p_state:canonical,p_expected_turn:expectedTurn});
  if(error)throw error;
  game.waitingRemote=game.activeSide!=='you';
  renderBattle();
 }catch(error){
  console.warn('remote state sync',error);
  // Do not leave the UI permanently locked on a failed write. The polling
  // loop will fetch the authoritative state again.
  game.waitingRemote=true;
  renderBattle();
 }finally{
  remoteWriteBusy=false;
 }
}
function applyRemoteState(row){
 if(!game||!game.remote||!row)return;
 const st=row.state&&typeof row.state==='object'?row.state:{};
 if(row.status==='forfeit'){
  const winner=st.forfeit_winner, leaver=st.forfeit_by, half=Number(st.forfeit_points)||0;
  const iWon=winner===user?._supabaseId;
  game.forfeit={winner,leaver,points:half,iWon}; game.finished=true;
  $('resultTitle').textContent=iWon?'VICTORY':'DEFEAT';
  $('resultSub').textContent=iWon?'The rival forfeited. You receive 1/2 Event Points.':'You left the match.';
  $('resultYou').textContent=totalScore(game.points).toLocaleString();
  $('resultRival').textContent=totalScore(game.enemy).toLocaleString();
  $('resultPoints').textContent=iWon?`+${half.toLocaleString()}`:'+0';
  $('resultEnergy').textContent=iWon?'RIVAL FORFEITED · 1/2 EVENT POINT':'MATCH LEFT';
  stopBattleAudio();$('resultView').classList.remove('hidden');setTimeout(backEvent,1800);return;
 }
 const incomingTurn=Number(st.turn)||1;
 // A delayed Realtime/poll response must never roll a browser back to an older
 // turn after it has just submitted a valid action.
 if(game._lastRemoteTurn!=null && incomingTurn<game._lastRemoteTurn)return;
 game._lastRemoteTurn=incomingTurn;
 game.turn=incomingTurn;
 if(st.activeSide)game.activeSide=(st.activeSide===(game.isP1?'p1':'p2'))?'you':'rival';
 else if(st.rps?.p1&&st.rps?.p2){
  // Backward-compatible recovery for an already-created match whose DB
  // state has both RPS choices but still has activeSide=null.
  const beats=(a,b)=>(a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper');
  let p1First;
  if(st.rps.p1===st.rps.p2){
   const p1bp=Math.max(...(game.isP1?game.you:game.rival).map(c=>c.bp));
   const p2bp=Math.max(...(game.isP1?game.rival:game.you).map(c=>c.bp));
   p1First=p1bp>=p2bp;
  }else p1First=beats(st.rps.p1,st.rps.p2);
  game.activeSide=p1First===(game.isP1?'p1':'p2')?'you':'rival';
 }
 game.points=game.isP1?structuredClone(st.p1Points||game.points):structuredClone(st.p2Points||game.points);
 game.enemy=game.isP1?structuredClone(st.p2Points||game.enemy):structuredClone(st.p1Points||game.enemy);
 game.specialEnergy=game.isP1?Number(st.p1Special??game.specialEnergy):Number(st.p2Special??game.specialEnergy);
 game.enemySpecialEnergy=game.isP1?Number(st.p2Special??game.enemySpecialEnergy):Number(st.p1Special??game.enemySpecialEnergy);
 game.buffs={you:structuredClone(game.isP1?(st.p1Buffs||game.buffs.you):(st.p2Buffs||game.buffs.you)),rival:structuredClone(game.isP1?(st.p2Buffs||game.buffs.rival):(st.p1Buffs||game.buffs.rival))};
 game.coolYou=structuredClone(game.isP1?(st.p1Cool||{}):(st.p2Cool||{}));
 game.coolRival=structuredClone(game.isP1?(st.p2Cool||{}):(st.p1Cool||{}));
 game.actorIndex={you:Number(game.isP1?st.p1ActorIndex:st.p2ActorIndex)||0,rival:Number(game.isP1?st.p2ActorIndex:st.p1ActorIndex)||0};
 game.log=Array.isArray(st.log)?st.log:game.log;
 game._remoteRps=st.rps||null;
 if(st.rps){
  if(st.rps.p1&&st.rps.p2)resolveRemoteRPS(st);
  else{
   game.waitingRemote=true;
   if(game.rpsChoice)startRpsWaitTimer();
  }
 }else game.waitingRemote=true;
 if(row.status==='finished'){finishBattle(true);return}
 if(game.rps){game.waitingRemote=game.activeSide!=='you';prepareTurn();}
 else prepareOpening();
}


const EVENT_PLAYER_MAX_RANK=60;
function eventPlayerXpNeed(rank){
 const r=Math.max(1,Math.min(EVENT_PLAYER_MAX_RANK,Number(rank)||1));
 if(r>=EVENT_PLAYER_MAX_RANK)return 0;
 return Math.round(750+100*r+5*r*r);
}
function grantEventPlayerXp(amount){
 if(!user)return {gain:0,rank:1,xp:0,ups:0};
 let rank=Math.max(1,Math.min(EVENT_PLAYER_MAX_RANK,Number(user.rank)||1));
 let xp=Math.max(0,Number(user.rankXp)||0);
 const old=rank;
 xp+=Math.max(0,Number(amount)||0);
 while(rank<EVENT_PLAYER_MAX_RANK){
   const need=eventPlayerXpNeed(rank);
   if(xp<need)break;
   xp-=need;
   rank++;
 }
 if(rank>=EVENT_PLAYER_MAX_RANK){rank=EVENT_PLAYER_MAX_RANK;xp=0}
 user.rank=rank;
 user.rankXp=xp;
 return {gain:Number(amount)||0,rank,xp,ups:rank-old};
}
function eventBattlePlayerXp(win){
 if(mode==='player')return win?260:90;
 return win?130:45;
}

function finishBattle(remoteFinish=false){
 if(game.finished)return;
 game.finished=true;
 const a=totalScore(game.points),b=totalScore(game.enemy),win=a>b;
 const baseEarned=win?pointsForMode(game.energy):0;
 const rewardBoost=win&&selectedMain.includes('miku6')?1.35:1;
 const earned=Math.floor(baseEarned*rewardBoost);
 if(!game.dailyRecorded){game.dailyRecorded=true;recordDailyEventBattle();localStorage.setItem('realyze_user_cache',JSON.stringify(user));syncUser();}
 // The player who wins must receive Event Points even if the opponent's final turn
 // is the action that closes the remote match.
 if(win&&!game.rewardApplied){
   game.rewardApplied=true;
   user.eventPoints=Math.min(1000000,Number(user.eventPoints||0)+earned);
   if(mode==='player')user.eventEnergy=Math.max(0,Number(user.eventEnergy||0)-game.energy);
 }

 if(!game.rankXpApplied){
   game.rankXpApplied=true;
   game._rankReward=grantEventPlayerXp(eventBattlePlayerXp(win));
 }

 localStorage.setItem('realyze_user_cache',JSON.stringify(user));
 syncUser();

 $('resultTitle').textContent=win?'VICTORY':'DEFEAT';
 $('resultSub').textContent=win?'Your team has the higher total performance.':'The rival has the higher total performance.';
 $('resultYou').textContent=a.toLocaleString();
 $('resultRival').textContent=b.toLocaleString();
 stopBattleAudio();
 $('resultPoints').textContent=`+${earned.toLocaleString()}`;
 const rankReward=game._rankReward||{gain:0,rank:Number(user?.rank)||1,ups:0};
 $('resultEnergy').textContent=(mode==='practice'
   ? `TRAINING · 1/2 EVENT POINT · NO ENERGY USED`
   : `ENERGY USED · ${game.energy}`)
   + ` · +${rankReward.gain} PLAYER XP`
   + (rankReward.ups>0?` · RANK UP → ${rankReward.rank}`:'');
 $('resultView').classList.remove('hidden');
 stopPreview();
}
init();


document.addEventListener('touchmove',e=>{
 if(document.body.classList.contains('ep-battle-mobile') && !e.target.closest('.ep-result,.ep-rps,.ep-leave-overlay')){
   if(e.cancelable)e.preventDefault();
 }
},{passive:false});
