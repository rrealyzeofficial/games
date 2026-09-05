
const $=id=>document.getElementById(id);
const db=()=>window.REALYZE_DB||null;
const params=new URLSearchParams(location.search);
const MAX_TURNS=20;
const SONGS=[{id:'heart-bouquet',name:'Heart Bouquet',src:'assets/hb.mp3'},{id:'flos',name:'Flos',src:'assets/fl.mp3'}];
const CHARS={
 lumina:{id:'lumina',name:'LUMINA',image:'assets/lumina.png',type:'VOCAL',base:13400,per:245,rarity:6,skills:[['RADIANT VOICE','+2,250 VOCAL',2250,'point','vocal'],['BRIGHT CHANCE','+3,200 VOCAL · 25% chance +30%',3200,'point','vocal'],['VOCAL BREAK','+1,250 VOCAL · enemy VOCAL -1,100',1250,'debuff','vocal']]},
 miku:{id:'miku',name:'HATSUNE MIKU',image:'assets/miku.png',type:'VOCAL',base:9879,per:654,rarity:5,skills:[['MIKU VOICE','+1,730 VOCAL',1730,'point','vocal'],['NEXT STAGE','2 allied actions +30%',0,'teambuff','all'],['COLORFUL VOICE','+2,000 VOCAL · Miku next action +15%',2000,'selfbuff','vocal']]},
 miku6:{id:'miku6',name:'HATSUNE MIKU · RADIANT BRIDE',image:'assets/miku1.png',type:'RAP',base:21250,per:620,rarity:6,rewardMultiplier:1.35,skills:[['RADIANT RAP','+2,780 RAP',2780,'point','rap'],['BRIDAL ENCORE','Choose 1 allied character to act immediately after Miku',0,'chooseNext','all'],['BRIGHT PROCESSION','Advance the other 2 allied characters before the rival',0,'teamAdvance','all']]} ,
 akito:{id:'akito',name:'AKITO',image:'assets/akito.png',type:'ACT',base:19450,per:510,rarity:6,skills:[['BURN ACT','+2,780 ACT',2780,'point','act'],['TURN THE TABLE','Take the next 2 allied turns · Akito next score +200%',0,'steal','all'],['CROSS BOOST','Other-type allies +15% next action',0,'otherbuff','all']]},
 kohane:{id:'kohane',name:'KOHANE',image:'assets/kohane.png',type:'RAP',base:21034,per:410,rarity:6,skills:[['RAP SHINE','+1,800 RAP',1800,'point','rap'],['BLESSING','TEAM next turn +55%',0,'teambuff','all'],['DIVINE TURN','Team gets priority next turn',0,'priority','all']]}
};
const SPECIALS=['akito','kohane'];
const SPECIAL_INFO={
 akito:'SPECIAL: giảm 30% toàn bộ VOCAL / RAP / ACT của đối thủ ngay khi kích hoạt.',
 kohane:'SPECIAL: bắt đầu trận với 100% năng lượng. Kích hoạt: cả đội +45% điểm trong 5 turn đầu và được ưu tiên lượt.'
};
let user=null,selectedSong='heart-bouquet',selectedMain=[],selectedSpecial='kohane',mode='practice',energy=1,queue=null,game=null,preview=null,battleAudio=null,matchChannel=null;
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
function renderChars(){const g=$('mainCharacterGrid');const ids=Object.keys(CHARS).filter(owned);g.innerHTML=ids.length?ids.map(id=>{const c=CHARS[id];return `<button class="ep-char-card ${selectedMain.includes(id)?'selected':''}" data-id="${id}"><img src="${c.image}"><strong>${c.name}</strong><small>${c.type} · ${bp(c).toLocaleString()} BP</small></button>`}).join(''):`<div style="grid-column:1/-1;padding:20px;text-align:center;color:#9a8791">No owned event characters yet.</div>`;g.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id;if(selectedMain.includes(id))selectedMain=selectedMain.filter(x=>x!==id);else if(selectedMain.length<3)selectedMain.push(id);renderChars()});$('teamCount').textContent=`${selectedMain.length} / 3`;$('specialCharacterGrid').innerHTML=SPECIALS.map(id=>{const c=CHARS[id];return `<button class="ep-special-card ${selectedSpecial===id?'selected':''}" data-special="${id}"><img src="${c.image}"><strong>${c.name}</strong><small>★${c.rarity} · EVENT SPECIAL</small><em>${SPECIAL_INFO[id]}</em></button>`}).join('');document.querySelectorAll('[data-special]').forEach(b=>b.onclick=()=>{selectedSpecial=b.dataset.special;renderChars()})}
function pointsForEnergy(e){return 3210+(e-1)*1426}
function pointsForMode(e){const base=pointsForEnergy(e);return mode==='practice'?Math.floor(base/2):base}
function refreshModeUI(){const gain=pointsForMode(energy);$('energyGain').textContent=gain.toLocaleString();const training=document.querySelector('[data-mode=practice] span');const player=document.querySelector('[data-mode=player] span');if(training)training.textContent='AI · WIN = 1/2 EVENT POINT · 0 ENERGY';if(player)player.textContent='REGISTERED ID · WIN = FULL EVENT POINT · ENERGY'}
function init(){user=readUser();$('epUserId').textContent=user?.username||'PLAYER';$('epEventPoints').textContent=`${Number(user?.eventPoints||0).toLocaleString()} PT`;for(let i=1;i<=10;i++)$('energySelect').insertAdjacentHTML('beforeend',`<option value="${i}">${i} ENERGY</option>`);$('energySelect').onchange=e=>{energy=Number(e.target.value);refreshModeUI()};document.querySelectorAll('.ep-mode').forEach(b=>b.onclick=()=>{document.querySelectorAll('.ep-mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;refreshModeUI()});$('saveTeam').onclick=startQueue;$('cancelQueue').onclick=cancelQueue;$('epBack').onclick=handleBattleBack;$('resultBack').onclick=backEvent;$('leaveResume').onclick=closeLeaveModal;$('leaveConfirm').onclick=async()=>{closeLeaveModal();if(game?.remote)await leaveRemoteMatch();else backEvent()};const saved=user?.eventTeam;if(saved?.main?.length===3)selectedMain=saved.main.filter(owned);if(saved?.special&&SPECIALS.includes(saved.special))selectedSpecial=saved.special;if(user?.eventMusic&&SONGS.some(s=>s.id===user.eventMusic))selectedSong=user.eventMusic;renderSongs();renderChars();refreshModeUI();hydrateUser().then(()=>{renderChars();$('epUserId').textContent=user?.username||'PLAYER';$('epEventPoints').textContent=`${Number(user?.eventPoints||0).toLocaleString()} PT`;refreshModeUI()})}
function show(id){['setupView','queueView','battleView'].forEach(x=>$(x).classList.toggle('hidden',x!==id));$('resultView').classList.add('hidden')}
function openLeaveModal(){const m=$('leaveMatchModal');if(m)m.classList.remove('hidden')}
function closeLeaveModal(){const m=$('leaveMatchModal');if(m)m.classList.add('hidden')}
async function leaveRemoteMatch(){if(!game?.remote||!game.matchId){backEvent();return}const d=db();try{await d?.rpc('event_leave_match',{p_match_id:game.matchId})}catch(e){console.warn('leave match',e)}backEvent()}
function handleBattleBack(){if(game&&!game.finished){openLeaveModal();return}backEvent()}
function backEvent(){stopPreview();stopBattleAudio();if(matchChannel)matchChannel.unsubscribe();location.href='index.html?return=event'}
function ensureEventData(u){if(!u)return;u.eventPoints=Math.max(0,Math.min(1000000,Number(u.eventPoints)||0));u.eventEnergy=Math.max(0,Number(u.eventEnergy??100));u.eventEnergyUpdatedAt=Number(u.eventEnergyUpdatedAt)||Date.now();u.eventClaimedRewards=Array.isArray(u.eventClaimedRewards)?u.eventClaimedRewards:[];u.eventShopPurchases=(u.eventShopPurchases&&typeof u.eventShopPurchases==='object')?u.eventShopPurchases:{};u.eventMailbox=Array.isArray(u.eventMailbox)?u.eventMailbox:[]}
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
let pollTimer=null;async function pollQueue(){clearTimeout(pollTimer);const d=db();if(!d)return;try{const {data,error}=await d.from('event_matchmaking_queue').select('match_id,status').eq('user_id',user?._supabaseId).maybeSingle();if(!error&&data?.match_id){await loadRemoteMatch(data.match_id);return}}catch(e){}pollTimer=setTimeout(pollQueue,1500)}
async function cancelQueue(){clearTimeout(pollTimer);const d=db();try{if(d)await d.rpc('event_leave_matchmaking')}catch(e){}show('setupView')}
async function loadRemoteMatch(id){const d=db();const {data,error}=await d.from('event_matches').select('*').eq('id',id).single();if(error||!data){alert('Match không tồn tại.');show('setupView');return}const me=user?._supabaseId;const mine=data.player1_id===me?data.player1:data.player2;const opp=data.player1_id===me?data.player2:data.player1;startBattle({remote:true,match:data,mine,opp});matchChannel=d.channel(`event-match-${id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'event_matches',filter:`id=eq.${id}`},payload=>applyRemoteState(payload.new)).subscribe()}
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
 game={remote:!!remoteInfo.remote,matchId:remoteInfo.match?.id||null,isP1:remoteInfo.remote?remoteInfo.match.player1_id===user?._supabaseId:true,turn:1,activeSide:'you',you:myTeam,rival:enemyTeam,actorIndex:{you:0,rival:0},points:{vocal:0,rap:0,act:0},enemy:{vocal:0,rap:0,act:0},special:CHARS[mySpecial],specialEnergy:(mySpecial==='kohane'?100:0),enemySpecialEnergy:0,buffs:{you:{all:0,allTurns:0,vocal:0,rap:0,act:0,self:0,selfActor:null,other:0,otherSource:null,otherTurns:0,priority:0,extraTurns:0,skip:0,skipAlliedTurns:0,blessingTurns:0},rival:{all:0,allTurns:0,vocal:0,rap:0,act:0,self:0,selfActor:null,other:0,otherSource:null,otherTurns:0,priority:0,extraTurns:0,skip:0,skipAlliedTurns:0,blessingTurns:0}},coolYou:{},coolRival:{},opponentName:remoteInfo.remote?(enemyMeta?.username||'PLAYER'):'EVENT AI',song:selectedSong,log:[],rps:null,rpsChoice:null,energy:Number(remoteInfo.remote?mineMeta?.energy:energy)||energy,waitingRemote:false,forfeit:null};
 startBattleAudio();$('battleModeLabel').textContent=game.remote?'PLAYER MATCH':'TRAINING · AI';$('rivalName').textContent=game.opponentName;$('youName').textContent=user?.username||'YOU';$('battleSongName').textContent=SONGS.find(s=>s.id===selectedSong)?.name||'';show('battleView');renderBattle();prepareOpening();
}

function teamSnapshotFromAI(){return {main:[{id:'lumina',level:1,rank:1},{id:'akito',level:1,rank:1},{id:'kohane',level:1,rank:1}],special:'kohane'}}
function buildTeam(entries){return teamEntries(entries).map(e=>{const c=CHARS[e.id];if(!c)return null;return {...c,level:Number(e.level)||1,rank:Number(e.rank)||1,bp:Number(e.bp)||bp(c),cd:[0,0,0]}}).filter(Boolean)}
function totalScore(s){return s.vocal+s.rap+s.act}
function renderBattle(){$('turnNumber').textContent=`${Math.min(game.turn,MAX_TURNS)} / ${MAX_TURNS}`;$('youPower').textContent=`${game.you.reduce((a,c)=>a+c.bp,0).toLocaleString()} BP`;$('rivalPower').textContent=`${game.rival.reduce((a,c)=>a+c.bp,0).toLocaleString()} BP`;['vocal','rap','act'].forEach(t=>{const a=game.points[t],b=game.enemy[t];$(`you${cap(t)}`).textContent=a.toLocaleString();$(`rival${cap(t)}`).textContent=b.toLocaleString();$(`you${cap(t)}Bar`).style.width=`${Math.min(100,a/100)}%`;$(`rival${cap(t)}Bar`).style.width=`${Math.min(100,b/100)}%`});$('specialEnergyText').textContent=`${Math.min(100,game.specialEnergy)}%`;$('specialSkill').disabled=game.specialEnergy<100||game.activeSide!=='you'||game.waitingRemote;$('battleLog').innerHTML=game.log.slice(-14).map(x=>`<div class="ep-log-line">${x}</div>`).join('')}
const cap=x=>x[0].toUpperCase()+x.slice(1);
function prepareOpening(){if(!game.rps){$('rpsView').classList.remove('hidden');$('rpsResult').textContent='';$('skillGrid').innerHTML='';return}$('rpsView').classList.add('hidden');prepareTurn()}
document.querySelectorAll('[data-rps]').forEach(b=>b.onclick=()=>chooseRPS(b.dataset.rps));
async function chooseRPS(choice){
 if(game.rps)return;game.rpsChoice=choice;$('rpsResult').textContent=`YOU: ${choice.toUpperCase()} · WAITING FOR RIVAL...`;
 if(game.remote){await syncRemoteState({rpsChoice:choice});return}
 const ai=['rock','paper','scissors'][Math.floor(Math.random()*3)];const win=(choice==='rock'&&ai==='scissors')||(choice==='paper'&&ai==='rock')||(choice==='scissors'&&ai==='paper');const highestMine=Math.max(...game.you.map(c=>c.bp)),highestRival=Math.max(...game.rival.map(c=>c.bp));game.rps=win?'you':choice===ai?(highestMine>=highestRival?'you':'rival'):'rival';$('rpsResult').textContent=`YOU: ${choice.toUpperCase()} · RIVAL: ${ai.toUpperCase()} → ${game.rps==='you'?'YOU GO FIRST':'RIVAL GOES FIRST'}`;game.log.push(`<b>Opening toss:</b> ${game.rps==='you'?'YOU':'RIVAL'} goes first.`);setTimeout(prepareOpening,800)
}
function resolveRemoteRPS(st){
 if(game.rps)return;if(!st?.rps?.p1||!st?.rps?.p2)return;
 const p1=st.rps.p1,p2=st.rps.p2;const beats=(a,b)=>(a==='rock'&&b==='scissors')||(a==='paper'&&b==='rock')||(a==='scissors'&&b==='paper');let p1First;
 if(p1===p2){const p1bp=Math.max(...(game.isP1?game.you:game.rival).map(c=>c.bp));const p2bp=Math.max(...(game.isP1?game.rival:game.you).map(c=>c.bp));p1First=p1bp>=p2bp}else p1First=beats(p1,p2);
 game.rps=p1First===(game.isP1?'you': 'rival')?'you':'rival';game.activeSide=game.rps;$('rpsResult').textContent=`RPS: ${game.isP1?p1:p2} · ${game.isP1?p2:p1} → ${game.rps==='you'?'YOU GO FIRST':'RIVAL GOES FIRST'}`;game.log.push(`<b>Opening toss:</b> ${game.rps==='you'?'YOU':'RIVAL'} goes first.`);game.waitingRemote=false;prepareOpening()
}

function actorFor(side){const team=side==='you'?game.you:game.rival;let idx=Number(game.actorIndex?.[side]??0)%team.length;return team[idx]}
function currentSideState(side){return side==='you'?game.buffs.you:game.buffs.rival}
function currentPoints(side){return side==='you'?game.points:game.enemy}
function currentCooldowns(side){return side==='you'?game.coolYou:game.coolRival}
function renderActiveCharacter(){
 const you=actorFor('you'), rival=actorFor('rival'), myTurn=game.activeSide==='you'&&!game.waitingRemote, rivalTurn=game.activeSide==='rival';
 const setSide=(side,actor,active)=>{
  const img=$(side==='you'?'turnCharacterImageYou':'turnCharacterImageRival');
  const person=$(side==='you'?'turnCharacterPersonYou':'turnCharacterPersonRival');
  const name=$(side==='you'?'turnCharacterNameYou':'turnCharacterNameRival'),stars=$(side==='you'?'turnCharacterStarsYou':'turnCharacterStarsRival'),bpEl=$(side==='you'?'turnCharacterBPYou':'turnCharacterBPRival'),lvl=$(side==='you'?'turnCharacterLevelYou':'turnCharacterLevelRival'),wait=$(side==='you'?'turnCharacterWaitYou':'turnCharacterWaitRival');
  if(active){if(img){img.classList.remove('hidden');img.src=actor.image;img.alt=actor.name}if(person)person.classList.add('hidden');if(name)name.textContent=actor.name;if(stars)stars.textContent='★'.repeat(actor.rarity||1);if(bpEl)bpEl.textContent=`${Number(actor.bp||0).toLocaleString()} BP`;if(lvl)lvl.textContent=`LV.${actor.level||1} · RANK ${actor.rank||1}`;}else{if(img)img.classList.add('hidden');if(person)person.classList.remove('hidden');if(name)name.textContent=side==='you'?'YOU':'RIVAL';if(stars)stars.textContent='—';if(bpEl)bpEl.textContent='— BP';if(lvl)lvl.textContent='WAITING';}if(wait)wait.textContent=active?'YOUR TURN':'WAIT FOR YOUR TURN';
 };
 setSide('you',you,myTurn); setSide('rival',rival,rivalTurn);
}
function prepareTurn(){if(game.turn>MAX_TURNS){finishBattle();return}const actor=actorFor(game.activeSide);renderActiveCharacter();$('activeOwner').textContent=game.activeSide==='you'?'YOUR TURN':'RIVAL TURN';$('activeCharName').textContent=actor.name;$('activeCharType').textContent=`${actor.type} · BP ${actor.bp.toLocaleString()}`;if(game.activeSide==='you'&&!game.waitingRemote)renderSkills(actor);else{$('skillGrid').innerHTML='<div class="ep-skill-wait">WAITING FOR RIVAL...</div>';if(!game.remote)setTimeout(()=>aiAct(actor),650)}renderBattle()}
function renderSkills(actor){const cds=currentCooldowns('you');$('skillGrid').innerHTML=actor.skills.map((s,i)=>`<button class="ep-skill" data-skill="${i}" ${cds[actor.id+':'+i]>0?'disabled':''}><b>SKILL ${i+1}</b><span>${s[0]}</span><small>${s[1]} ${cds[actor.id+':'+i]>0?`· CD ${cds[actor.id+':'+i]}`:''}</small></button>`).join('');document.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>useSkill(actor,Number(b.dataset.skill)))}
function addScore(side,type,n){const p=currentPoints(side);p[type]=Math.max(0,p[type]+Math.round(n))}
function multiplier(side,type,actor){const b=currentSideState(side);let m=1;m*=1+(b.all||0)/100;m*=1+(b[type]||0)/100;if(b.self&&b.selfActor===actor.id)m*=1+b.self/100;if(b.other&&b.otherTurns>0&&actor.type!==b.otherSource)m*=1+b.other/100;return m}
function setCd(side,actor,i,n){currentCooldowns(side)[actor.id+':'+i]=n}
function tickCds(){[game.coolYou,game.coolRival].forEach(c=>Object.keys(c).forEach(k=>{if(c[k]>0)c[k]--}))}
function useSkill(actor,i){if(game.activeSide!=='you'||game.waitingRemote)return;const acted=applySkill('you',actor,i);if(acted===false)return;endTurn();if(game.remote)syncRemoteState()}
function applySkill(side,actor,i){
 const s=actor.skills[i],type=s[3],target=s[4],b=currentSideState(side); let value=s[2]||0,msg=`<b>${actor.name}</b> used ${s[0]}.`;
 if(type==='point'){let m=multiplier(side,target,actor);if(actor.id==='lumina'&&i===1&&Math.random()<.25)m*=1.3;const aiScale=(side==='rival'&&!game.remote)?.5:1;addScore(side,target,value*m*aiScale);if(b.selfActor===actor.id)b.self=0,b.selfActor=null;if(b.otherTurns>0&&actor.type!==b.otherSource)b.otherTurns--;if(b.allTurns>0)b.allTurns--;if(b.allTurns===0)b.all=0;}
 else if(type==='debuff'){const aiScale=(side==='rival'&&!game.remote)?.5:1;addScore(side,target,value*multiplier(side,target,actor)*aiScale);const enemy=side==='you'?game.enemy:game.points;enemy[target]=Math.max(0,enemy[target]-1100);msg+=' Enemy VOCAL -1,100.';setCd(side,actor,i,3);}
 else if(type==='teambuff'){b.all=30;b.allTurns=2;setCd(side,actor,i,2);msg+=' The next 2 allied scoring actions get +30%.';}
 else if(type==='teamBuff'){b.all=55;b.allTurns=1;setCd(side,actor,i,2);msg+=' The next allied scoring action gets +55%.';}
 else if(type==='selfbuff'){const aiScale=(side==='rival'&&!game.remote)?.5:1;addScore(side,target,value*multiplier(side,target,actor)*aiScale);b.self=15;b.selfActor=actor.id;msg+=' Next Miku scoring action +15%.';}
 else if(type==='steal'){b.skipAlliedTurns=2;setCd(side,actor,i,3);b.self=200;b.selfActor=actor.id;msg+=' Akito takes the next 2 allied turns; his next scoring action is +200%.';}
 else if(type==='otherbuff'){b.other=15;b.otherSource=actor.type;b.otherTurns=2;msg+=' Other-attribute allies next scoring action +15%.';}
 else if(type==='priority'){b.priority=1;msg+=' Team gets priority on the next turn.';}
 else if(type==='chooseNext'){ if(side==='you'){openMikuTurnPicker();return false;} }
 else if(type==='teamAdvance'){b.extraTurns=2;setCd(side,actor,i,3);msg+=' Miku advances the other two allied characters before the rival gets a turn.';}
 game[side==='you'?'specialEnergy':'enemySpecialEnergy']=Math.min(100,game[side==='you'?'specialEnergy':'enemySpecialEnergy']+10);game.log.push(msg);renderBattle();return true;
}
function openMikuTurnPicker(){
 let overlay=$('mikuTurnPicker'); if(!overlay){overlay=document.createElement('div');overlay.id='mikuTurnPicker';overlay.className='ep-rps';overlay.innerHTML='<div class="ep-rps-modal"><small>HATSUNE MIKU · SKILL 2</small><h2>CHOOSE WHO ACTS NEXT</h2><p>Select 1 of your 3 characters.</p><div class="rps-buttons" id="mikuTurnChoices"></div></div>';document.body.appendChild(overlay);}
 const list=$('mikuTurnChoices');const mikuActorIndex=game.actorIndex.you;list.innerHTML=game.you.map((c,i)=>({c,i})).filter(x=>x.i!==mikuActorIndex).map(x=>`<button data-miku-actor="${x.i}">${x.c.name}<small> · ${x.c.type}</small></button>`).join('');overlay.classList.remove('hidden');list.querySelectorAll('[data-miku-actor]').forEach(btn=>btn.onclick=()=>{const idx=Number(btn.dataset.mikuActor);overlay.classList.add('hidden');game.actorIndex.you=idx;game.log.push(`<b>HATSUNE MIKU</b> — ${game.you[idx].name} is pushed to act immediately after Miku.`);game.mikuQueued=true;game.mikuQueuedIndex=idx;game[game.activeSide==='you'?'specialEnergy':'enemySpecialEnergy']=Math.min(100,game[game.activeSide==='you'?'specialEnergy':'enemySpecialEnergy']+10);endTurn();if(game.remote)syncRemoteState();});
}
function specialUse(){if(game.specialEnergy<100||game.activeSide!=='you'||game.waitingRemote)return;const c=game.special;if(c.id==='akito'){['vocal','rap','act'].forEach(t=>game.enemy[t]=Math.floor(game.enemy[t]*.7));game.log.push('<b>AKITO SPECIAL</b> — Enemy VOCAL / RAP / ACT reduced by 30%.')}else if(c.id==='kohane'){game.buffs.you.all=45;game.buffs.you.allTurns=5;game.buffs.you.blessingTurns=5;game.buffs.you.priority=1;game.log.push('<b>KOHANE SPECIAL</b> — Team +45% score for the next 5 allied scoring actions and priority.')}game.specialEnergy=0;endTurn();if(game.remote)syncRemoteState()}

$('specialSkill').onclick=specialUse;
function aiAct(actor){if(game.activeSide!=='rival'||game.remote)return;const choices=actor.skills.map((s,i)=>({i,s})).filter(x=>!currentCooldowns('rival')[actor.id+':'+x.i]);choices.sort((a,b)=>(b.s[2]||0)-(a.s[2]||0));applySkill('rival',actor,(choices[0]||{i:0}).i);endTurn()}
function endTurn(){
 tickCds();
 const actedSide=game.activeSide;
 const actedBuff=game.buffs[actedSide];
 const team=game[actedSide==='you'?'you':'rival'];
 const actedActor=actorFor(actedSide);
 if(actedSide==='you'&&game.mikuQueued){ game.mikuQueued=false; game.activeSide='you'; game.turn++; if(game.turn>MAX_TURNS){finishBattle();return} prepareTurn(); return; }

 // Akito Skill 2: the next TWO allied characters lose their turns.
 // They are skipped from the actor rotation; the opponent then acts,
 // and the actor rotation resumes from Akito on the next allied turn.
 const stealCount=Number(actedBuff.skipAlliedTurns||0);
 if(stealCount>0){
   game.actorIndex[actedSide]=(game.actorIndex[actedSide]+1+stealCount)%team.length;
   actedBuff.skipAlliedTurns=0;
   actedBuff.self=200;
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
 if(!game.remote)return;const d=db();if(!d)return;game.waitingRemote=true;
 const canonical={turn:game.turn,activeSide:game.rps?(game.activeSide==='you'?(game.isP1?'p1':'p2'):(game.isP1?'p2':'p1')):null,p1Points:game.isP1?game.points:game.enemy,p2Points:game.isP1?game.enemy:game.points,p1Special:game.isP1?game.specialEnergy:game.enemySpecialEnergy,p2Special:game.isP1?game.enemySpecialEnergy:game.specialEnergy,p1Buffs:game.isP1?game.buffs.you:game.buffs.rival,p2Buffs:game.isP1?game.buffs.rival:game.buffs.you,p1Cool:game.isP1?game.coolYou:game.coolRival,p2Cool:game.isP1?game.coolRival:game.coolYou,p1ActorIndex:game.isP1?game.actorIndex.you:game.actorIndex.rival,p2ActorIndex:game.isP1?game.actorIndex.rival:game.actorIndex.you,log:game.log,rps:extra.rpsChoice?{...(game._remoteRps||{}),[game.isP1?'p1':'p2']:extra.rpsChoice}:(game._remoteRps||null),status:(game.turn>MAX_TURNS?'finished':'active')};
 game._remoteRps=canonical.rps;
 const {data,error}=await d.rpc('event_submit_action',{p_match_id:game.matchId,p_state:canonical,p_expected_turn:game.turn});
 if(error){console.warn(error);game.waitingRemote=true;renderBattle();return}
 game.waitingRemote=extra.rpsChoice?true:game.activeSide!=='you';
 renderBattle();
}
function applyRemoteState(row){
 if(!game||!game.remote)return;
 const st=row.state||{};
 if(row.status==='forfeit'){
   const winner=st.forfeit_winner, leaver=st.forfeit_by, half=Number(st.forfeit_points)||0;
   const iWon=winner===user?._supabaseId;
   game.forfeit={winner,leaver,points:half,iWon};
   game.finished=true;
   $('resultTitle').textContent=iWon?'VICTORY':'DEFEAT';
   $('resultSub').textContent=iWon?'The rival forfeited. You receive 1/2 Event Points.':'You left the match.';
   $('resultYou').textContent=totalScore(game.points).toLocaleString();
   $('resultRival').textContent=totalScore(game.enemy).toLocaleString();
   $('resultPoints').textContent=iWon?`+${half.toLocaleString()}`:'+0';
   $('resultEnergy').textContent=iWon?'RIVAL FORFEITED · 1/2 EVENT POINT':'MATCH LEFT';
   stopBattleAudio();$('resultView').classList.remove('hidden');
   setTimeout(backEvent,1800);
   return;
 }
 game.turn=Number(st.turn)||game.turn;
 if(st.activeSide)game.activeSide=(st.activeSide===(game.isP1?'p1':'p2'))?'you':'rival';
 game.points=game.isP1?structuredClone(st.p1Points||game.points):structuredClone(st.p2Points||game.points);
 game.enemy=game.isP1?structuredClone(st.p2Points||game.enemy):structuredClone(st.p1Points||game.enemy);
 game.specialEnergy=game.isP1?Number(st.p1Special??game.specialEnergy):Number(st.p2Special??game.specialEnergy);
 game.enemySpecialEnergy=game.isP1?Number(st.p2Special??game.enemySpecialEnergy):Number(st.p1Special??game.enemySpecialEnergy);
 game.buffs={you:structuredClone(game.isP1?(st.p1Buffs||game.buffs.you):(st.p2Buffs||game.buffs.you)),rival:structuredClone(game.isP1?(st.p2Buffs||game.buffs.rival):(st.p1Buffs||game.buffs.rival))};
 game.coolYou=structuredClone(game.isP1?(st.p1Cool||{}):(st.p2Cool||{}));game.coolRival=structuredClone(game.isP1?(st.p2Cool||{}):(st.p1Cool||{}));
 game.actorIndex={you:Number(game.isP1?st.p1ActorIndex:st.p2ActorIndex)||0,rival:Number(game.isP1?st.p2ActorIndex:st.p1ActorIndex)||0};
 game.log=st.log||game.log;game._remoteRps=st.rps||null;game.waitingRemote=game.rps?game.activeSide!=='you':true;
 if(st.rps)resolveRemoteRPS(st);
 if(row.status==='finished'){finishBattle(true);return}
 if(game.rps)prepareTurn();else prepareOpening();
}

function finishBattle(remoteFinish=false){
 if(game.finished)return;
 game.finished=true;
 const a=totalScore(game.points),b=totalScore(game.enemy),win=a>b;
 const baseEarned=win?pointsForMode(game.energy):0;
 const rewardBoost=win&&selectedMain.includes('miku6')?1.35:1;
 const earned=Math.floor(baseEarned*rewardBoost);
 // The player who wins must receive Event Points even if the opponent's final turn
 // is the action that closes the remote match.
 if(win&&!game.rewardApplied){
   game.rewardApplied=true;
   user.eventPoints=Math.min(1000000,Number(user.eventPoints||0)+earned);
   if(mode==='player')user.eventEnergy=Math.max(0,Number(user.eventEnergy||0)-game.energy);
   localStorage.setItem('realyze_user_cache',JSON.stringify(user));
   syncUser();
 }
 $('resultTitle').textContent=win?'VICTORY':'DEFEAT';
 $('resultSub').textContent=win?'Your team has the higher total performance.':'The rival has the higher total performance.';
 $('resultYou').textContent=a.toLocaleString();
 $('resultRival').textContent=b.toLocaleString();
 stopBattleAudio();
 $('resultPoints').textContent=`+${earned.toLocaleString()}`;
 $('resultEnergy').textContent=mode==='practice'?`TRAINING · 1/2 EVENT POINT · NO ENERGY USED`:`ENERGY USED · ${game.energy}`;
 $('resultView').classList.remove('hidden');
 stopPreview();
}
init();
