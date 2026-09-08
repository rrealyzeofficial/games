
const $=id=>document.getElementById(id), db=()=>window.REALYZE_DB||null;
let user=null,selectedTrial='melody',selectedFloor=1,selectedTeam=[],battle=null,gearChar=null;
const TRIAL_ENERGY_COST=20;
const CHARS={
 lumina:{name:'LUMINA',image:'assets/lumina.png',type:'VOCAL',base:25600,per:660},
 miku:{name:'HATSUNE MIKU',image:'assets/miku.png',type:'VOCAL',base:9879,per:654},
 miku6:{name:'HATSUNE MIKU · RADIANT BRIDE',image:'assets/miku1.png',type:'RAP',base:21250,per:620},
 akito:{name:'AKITO',image:'assets/akito.png',type:'ACT',base:27200,per:700},
 kohane:{name:'KOHANE',image:'assets/kohane.png',type:'RAP',base:21034,per:410},
 shota:{name:'SHOTA',image:'assets/shota.png',type:'VOCAL',base:26000,per:670},
 rui:{name:'RUI KAMISHIRO',image:'assets/rui.png',type:'ACT',base:13479,per:490},
 ichika:{name:'ICHIKA',image:'assets/ichika.png',type:'RAP',base:22180,per:575},
 touya:{name:'TOUYA',image:'assets/beginning_touya.png',type:'VOCAL',base:23450,per:610},
 airi:{name:'AIRI',image:'assets/beginning_airi.png',type:'ACT',base:15950,per:505},
 akito4:{name:'AKITO',image:'assets/beginning_akito.png',type:'ACT',base:11840,per:360},
 shiho:{name:'HINOMORI SHIHO',image:'assets/shiho1.png',type:'DANCE',base:24840,per:645},
 nene:{name:'KUSANAGI NENE',image:'assets/nene1.png',type:'DANCE',base:25260,per:635},
 ns_akito:{name:'SHINONOME AKITO',image:'assets/akito2.png',type:'VOCAL',base:24680,per:625},
 ns_an:{name:'SHIRAISHI AN',image:'assets/an2.png',type:'RAP',base:25120,per:635},
 ns_saki:{name:'TENMA SAKI · NIGHT STAGE',image:'assets/saki2.png',type:'ACT',base:24950,per:620},
 saki:{name:'TENMA SAKI',image:'assets/saki1.png',type:'ACT',base:21750,per:585},
 luka:{name:'MEGURINE LUKA',image:'assets/luka1.png',type:'VOCAL',base:22680,per:600}
};
const BASE_STATS={
 lumina:{critRate:8,critDmg:60,tempo:120},miku:{critRate:5,critDmg:50,tempo:105},
 miku6:{critRate:5,critDmg:50,tempo:120},akito:{critRate:9,critDmg:65,tempo:124},
 kohane:{critRate:5,critDmg:50,tempo:108},shota:{critRate:7,critDmg:60,tempo:110},
 rui:{critRate:5,critDmg:50,tempo:115},ichika:{critRate:5,critDmg:50,tempo:118},
 touya:{critRate:5,critDmg:50,tempo:112},airi:{critRate:5,critDmg:50,tempo:106},
 akito4:{critRate:5,critDmg:50,tempo:102},shiho:{critRate:6,critDmg:55,tempo:125},nene:{critRate:7,critDmg:55,tempo:120},ns_akito:{critRate:7,critDmg:60,tempo:116},ns_an:{critRate:8,critDmg:58,tempo:121},ns_saki:{critRate:6,critDmg:55,tempo:113},saki:{critRate:5,critDmg:50,tempo:110},luka:{critRate:5,critDmg:50,tempo:108}
};
const SETS={
 radiant:{name:'RADIANT STAGE',two:'VOCAL +15%',four:'VOCAL CRIT → next allied VOCAL +20%',stat:'vocal'},
 encore:{name:'ENCORE',two:'SKILL EFFECT +15%',four:'Buff target → +10% CRIT Rate & +15% CRIT DMG next action',stat:'skillEffect'},
 blue:{name:'BLUE FLOW',two:'RAP +15%',four:'RAP CRIT can gain FLOW; 3 FLOW → +40% CRIT DMG',stat:'rap'},
 spotlight:{name:'SPOTLIGHT',two:'TEMPO +15%',four:'Priority action → +15% Score & +10 Special Energy',stat:'tempo'},
 grand:{name:'GRAND SHOW',two:'ACT +15%',four:'Non-score skill builds SHOW; next scoring skill consumes it',stat:'act'},
 breaker:{name:'STAR BREAKER',two:'CRIT Rate +12%',four:'CRIT DMG +30%; misses build next CRIT chance',stat:'critRate'},
 guard:{name:'PERFECT GUARD',two:'Debuff resistance +20%',four:'First score reduction is blocked',stat:'guard'},
 crimsonfang:{name:'CRIMSON FANG',two:'CRIT DMG +22%',four:'BP +18% & CRIT Rate +12%',stat:'critDmg'},
 moonhowl:{name:'MOON HOWL',two:'TEMPO +18%',four:'SKILL EFFECT +25% & ACT +20%',stat:'tempo'}
};
const TRIALS={
 melody:{name:'TRIAL OF MELODY',icon:'🎤',sets:['radiant','encore'],desc:'VOCAL & SUPPORT',base:24000},
 flow:{name:'TRIAL OF FLOW',icon:'🌊',sets:['blue','spotlight'],desc:'RAP & TEMPO',base:25500},
 drama:{name:'TRIAL OF DRAMA',icon:'🎭',sets:['grand','breaker'],desc:'ACT & CRITICAL',base:27000},
 perfection:{name:'TRIAL OF PERFECTION',icon:'✦',sets:['guard','breaker'],desc:'DEFENSE & CRITICAL',base:30000},
 hunt:{name:'TRIAL OF THE HUNT',icon:'☾',sets:['crimsonfang','moonhowl'],desc:'BURST DAMAGE · EFFECT EXTENSION',base:33000}
};
const SLOTS=['MIC','OUTFIT','ACCESSORY','CHARM'];
function readUser(){try{return JSON.parse(localStorage.getItem('realyze_user_cache')||'null')}catch{return null}}
function ensure(u){if(!u)return;u.eventEnergy=Math.max(0,Number(u.eventEnergy??100));u.trialClears=u.trialClears||{};u.stageGear=Array.isArray(u.stageGear)?u.stageGear:[];u.equipment=u.equipment||{}}
async function sync(){if(!user)return;localStorage.setItem('realyze_user_cache',JSON.stringify(user));try{const d=db(),s=await d?.auth?.getSession();const id=s?.data?.session?.user?.id;if(!d||!id)return;const r=await d.from('profiles').select('game_data').eq('id',id).single();if(r.error)return;const merged={...(r.data?.game_data||{}),...user};await d.from('profiles').update({game_data:merged}).eq('id',id);user=merged;localStorage.setItem('realyze_user_cache',JSON.stringify(user))}catch(e){console.warn(e)}}
async function hydrate(){user=readUser()||{};ensure(user);try{const d=db(),s=await d?.auth?.getSession();const id=s?.data?.session?.user?.id;if(d&&id){const r=await d.from('profiles').select('username,game_data').eq('id',id).single();if(!r.error){user={...(r.data.game_data||{}),username:r.data.username,_supabaseId:id};ensure(user);localStorage.setItem('realyze_user_cache',JSON.stringify(user))}}}catch(e){}renderAll()}
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function show(id){['trialSelect','teamView','battleView','resultView'].forEach(x=>$(x).classList.toggle('hidden',x!==id))}
function level(id){return Math.max(1,Number(user?.characterProgress?.[id]?.level)||1)}
function owned(id){return Array.isArray(user?.myCharacters)&&user.myCharacters.includes(id)}
function charPower(id){const c=CHARS[id];return c?c.base+(level(id)-1)*c.per:0}
function gearMaxLevel(rarity){return rarity===5?20:rarity===4?15:10}
function gearStats(id){
 const out={flatScore:0,bpPercent:0,critRate:0,critDmg:0,tempo:0,skillEffect:0,vocalBonus:15,rapBonus:15,actBonus:15,sets:{}};
 const eq=user.equipment?.[id]||{};
 Object.values(eq).forEach(gid=>{const g=user.stageGear.find(x=>x.id===gid);if(!g)return;out.sets[g.set]=(out.sets[g.set]||0)+1;
   const all=[{stat:g.main,value:gearLineValue(g,true)},...(g.subs||[]).map((x,i)=>({stat:x.stat,value:gearLineValue(g,false,i)}))];
   all.forEach(x=>{if(x.stat==='flatScore')out.flatScore+=x.value;else if(x.stat==='damageVocal')out.vocalBonus+=x.value;else if(x.stat==='damageRap')out.rapBonus+=x.value;else if(x.stat==='damageAct')out.actBonus+=x.value;else out[x.stat]=(out[x.stat]||0)+x.value});
 });
 // Set bonuses remain meaningful in Event, but no longer replace the five-line relic system.
 Object.entries(out.sets).forEach(([set,n])=>{
   if(n>=2){
     if(set==='radiant')out.vocalBonus+=15;
     if(set==='blue')out.rapBonus+=15;
     if(set==='grand')out.actBonus+=15;
     if(set==='breaker')out.critRate+=12;
     if(set==='spotlight')out.tempo+=15;
     if(set==='crimsonfang')out.critDmg+=22;
     if(set==='moonhowl')out.tempo+=18;
   }
   if(n>=4&&set==='breaker')out.critDmg+=30;
   if(n>=4&&set==='crimsonfang'){out.bpPercent+=18;out.critRate+=12;}
   if(n>=4&&set==='moonhowl'){out.skillEffect+=25;out.actBonus+=20;}
 });
 return out
}
function gearLineValue(g,isMain,subIndex=0){const lv=Math.max(0,Math.min(Number(g.level)||0,gearMaxLevel(Number(g.rarity)||3)));if(isMain)return +(Number(g.mainValue||0)+Number(g.mainGrowth||0)*lv).toFixed(2);return subCurrentValue(g,subIndex)}
function stats(id){const b=BASE_STATS[id]||{critRate:5,critDmg:50,tempo:100},g=gearStats(id);return {critRate:b.critRate+g.critRate,critDmg:b.critDmg+g.critDmg,tempo:b.tempo+g.tempo,skillEffect:g.skillEffect||0,flatScore:g.flatScore,bpPercent:g.bpPercent,vocalBonus:g.vocalBonus,rapBonus:g.rapBonus,actBonus:g.actBonus,sets:g.sets}}
function updateEnergy(){ensure(user);if($('trialEnergyText'))$('trialEnergyText').textContent=Math.floor(Number(user.eventEnergy||0)).toLocaleString()}
function renderTrials(){
 $('trialGrid').innerHTML=Object.entries(TRIALS).map(([id,t],index)=>`
   <button class="trial trial-${id}" data-trial="${id}">
     <span class="trial-index">${String(index+1).padStart(2,'0')}</span>
     <span class="icon">${t.icon}</span>
     <small>STAGE TRIAL</small>
     <h3>${t.name}</h3>
     <p>${t.desc}</p>
     <div class="sets">${t.sets.map(s=>`<span>${SETS[s].name}</span>`).join('')}</div>
     <b class="trial-enter">ENTER ›</b>
   </button>
 `).join('');
 document.querySelectorAll('[data-trial]').forEach(b=>b.onclick=()=>openTrial(b.dataset.trial))
}
function openTrial(id){selectedTrial=id;const t=TRIALS[id];$('floorKicker').textContent=t.desc;$('floorTitle').textContent=t.name;$('setPreview').innerHTML=t.sets.map(s=>`<span class="set-chip"><b>${SETS[s].name}</b><small>2PC · ${SETS[s].two}</small><small>4PC · ${SETS[s].four}</small></span>`).join('');$('floorGrid').innerHTML=Array.from({length:10},(_,i)=>{const f=i+1,c=Number(user.trialClears[`${id}:${f}`]||0);return `<button class="floor ${c?'cleared':''}" data-floor="${f}"><b>FLOOR ${f}</b><span>${c?`CLEARED ×${c}`:f===1?'OPEN':Number(user.trialClears[`${id}:${f-1}`]||0)?'OPEN':'LOCKED'}</span></button>`}).join('');$('floorPanel').classList.remove('hidden');document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>chooseFloor(Number(b.dataset.floor)))}
function chooseFloor(f){if(f>1&&!user.trialClears[`${selectedTrial}:${f-1}`]&&!user.trialClears[`${selectedTrial}:${f}`]){toast('CLEAR THE PREVIOUS FLOOR FIRST');return}selectedFloor=f;selectedTeam=[];renderTeam();show('teamView')}
function target(){return Math.round(TRIALS[selectedTrial].base*(1+(selectedFloor-1)*.24))}
function renderTeam(){$('teamTrial').textContent=TRIALS[selectedTrial].name;$('teamFloor').textContent=`FLOOR ${selectedFloor}`;$('enemyTarget').textContent=target().toLocaleString();const ids=Object.keys(CHARS).filter(owned);$('charGrid').innerHTML=ids.map(id=>{const c=CHARS[id],s=stats(id);return `<button class="char ${selectedTeam.includes(id)?'selected':''}" data-char="${id}"><img src="${c.image}"><strong>${c.name}</strong><small>${c.type} · ${charPower(id).toLocaleString()} BP</small><small>CRIT ${s.critRate.toFixed(1)}% · CD ${s.critDmg.toFixed(0)}%</small></button>`}).join('');document.querySelectorAll('[data-char]').forEach(b=>b.onclick=()=>{const id=b.dataset.char;if(selectedTeam.includes(id))selectedTeam=selectedTeam.filter(x=>x!==id);else if(selectedTeam.length<3)selectedTeam.push(id);renderTeam()});$('teamSlots').innerHTML=[0,1,2].map(i=>`<div class="team-slot">${i+1}. ${selectedTeam[i]?CHARS[selectedTeam[i]].name:'EMPTY'}</div>`).join('');$('startTrial').disabled=selectedTeam.length!==3;const cleared=Number(user.trialClears[`${selectedTrial}:${selectedFloor}`]||0)>0;$('quickClear').classList.toggle('hidden',!cleared)}
function consumeTrialEnergy(amount=TRIAL_ENERGY_COST){ensure(user);amount=Math.max(TRIAL_ENERGY_COST,Math.floor(Number(amount)||TRIAL_ENERGY_COST));if(Number(user.eventEnergy||0)<amount){toast(`NOT ENOUGH ENERGY · NEED ${amount}`);return false}user.eventEnergy=Math.max(0,Number(user.eventEnergy||0)-amount);updateEnergy();return true}
function startBattle(){if(selectedTeam.length!==3)return;const first=!user.trialClears[`${selectedTrial}:${selectedFloor}`];if(!consumeTrialEnergy(20))return;battle={turn:1,maxTurns:12,actor:0,score:0,target:target(),pressure:0,log:[],first};show('battleView');renderBattle();sync()}
function renderBattle(){const id=selectedTeam[battle.actor],s=stats(id);$('battleTrial').textContent=TRIALS[selectedTrial].name;$('battleFloor').textContent=`FLOOR ${selectedFloor}`;$('turnText').textContent=`${battle.turn} / ${battle.maxTurns}`;$('trialScore').textContent=Math.round(battle.score).toLocaleString();$('targetLabel').textContent=`TARGET ${battle.target.toLocaleString()}`;$('targetBar').style.width=`${Math.min(100,battle.score/battle.target*100)}%`;$('pressure').textContent=`${Math.round(battle.pressure)}%`;$('battleChars').innerHTML=selectedTeam.map((x,i)=>`<div class="battle-char ${i===battle.actor?'active':''}"><img src="${CHARS[x].image}"><b>${CHARS[x].name}</b><small>${CHARS[x].type}</small></div>`).join('');$('actorName').textContent=CHARS[id].name;$('actionStats').innerHTML=`<span>CRIT ${s.critRate.toFixed(1)}%</span><span>CRIT DMG +${s.critDmg.toFixed(0)}%</span><span>DMG V/R/A ${s.vocalBonus.toFixed(0)}/${s.rapBonus.toFixed(0)}/${s.actBonus.toFixed(0)}%</span><span>TEMPO ${s.tempo.toFixed(0)}</span><span>SKILL EFFECT +${Number(s.skillEffect||0).toFixed(0)}%</span>`;$('battleLog').innerHTML=battle.log.slice(-8).map(x=>`<div>${x}</div>`).join('')}
function act(type){if(!battle)return;const id=selectedTeam[battle.actor],c=CHARS[id],s=stats(id);const affinity=c.type.toLowerCase()===type?1.18:1;const bonus=1+(s[type+'Bonus']||15)/100;const pressure=Math.max(.55,1-battle.pressure/180);const effectiveBP=(charPower(id)+s.flatScore)*(1+s.bpPercent/100);let gain=(effectiveBP*.105+900)*affinity*bonus*pressure;const crit=Math.random()*100<s.critRate;if(crit)gain*=1+s.critDmg/100;gain=Math.round(gain);battle.score+=gain;battle.log.push(`<b>${c.name}</b> · ${type.toUpperCase()} +${gain.toLocaleString()}${crit?' · CRITICAL!':''}`);if(battle.score>=battle.target){finish(true);return}battle.pressure=Math.min(65,battle.pressure+Math.max(2.5,6-s.tempo/35));battle.turn++;battle.actor=(battle.actor+1)%3;if(battle.turn>battle.maxTurns){finish(false);return}renderBattle()}
function rarityForFloor(){
 const f=selectedFloor,r=Math.random();
 if(f>=9)return r<.48?5:4;
 if(f>=7)return r<.28?5:r<.88?4:3;
 if(f>=4)return r<.10?5:r<.62?4:3;
 return r<.22?4:3
}
const RELIC_LABELS={flatScore:'BP +',bpPercent:'BP %',critRate:'CRIT RATE',critDmg:'CRIT DMG',damageVocal:'VOCAL DMG BONUS',damageRap:'RAP DMG BONUS',damageAct:'ACT DMG BONUS',tempo:'TEMPO'};
function lineRange(stat,rarity,isMain){
 const mult=rarity===5?1:rarity===4?.76:.56;
 const ranges={
  flatScore:isMain?[rarity===5?520:rarity===4?390:285,rarity===5?760:rarity===4?570:420]:[245,rarity===5?410:rarity===4?340:290],
  bpPercent:[2.0,rarity===5?4.8:rarity===4?3.9:3.1],
  critRate:[2.4,4.5],critDmg:[5,9],damageVocal:[4,7.5],damageRap:[4,7.5],damageAct:[4,7.5],tempo:[3,7]
 };
 const a=ranges[stat]||[2,5];if(stat==='flatScore'||stat==='bpPercent')return a;return [a[0]*mult,a[1]*mult]
}
function rollBase(stat,rarity,isMain){const [a,b]=lineRange(stat,rarity,isMain);return +(a+Math.random()*(b-a)).toFixed(stat==='flatScore'?0:1)}
function mainGrowthFor(stat,rarity,base){const max=gearMaxLevel(rarity),target=rarity===5?2.35:rarity===4?2.0:1.7;return +(base*(target-1)/max).toFixed(stat==='flatScore'?2:3)}
function mainPoolForSlot(slot){
 if(slot==='OUTFIT'||slot==='ACCESSORY')return ['flatScore'];
 if(slot==='MIC')return ['flatScore','damageVocal','damageRap','damageAct','tempo'];
 return ['flatScore','critRate','critDmg'];
}
function subPoolExcluding(main){
 return ['flatScore','bpPercent','critRate','critDmg','damageVocal','damageRap','damageAct','tempo'].filter(x=>x!==main)
}
function makeGear(){
 const t=TRIALS[selectedTrial],set=t.sets[Math.floor(Math.random()*t.sets.length)],slot=SLOTS[Math.floor(Math.random()*4)],rarity=rarityForFloor();
 const mp=mainPoolForSlot(slot),main=mp[Math.floor(Math.random()*mp.length)],mainValue=rollBase(main,rarity,true),pool=subPoolExcluding(main),subs=[];
 for(let i=0;i<4;i++){const idx=Math.floor(Math.random()*pool.length),st=pool.splice(idx,1)[0];subs.push({stat:st,value:rollBase(st,rarity,false),rollBonus:0,rollHistory:[]})}
 return {id:'gear_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),set,slot,rarity,main,mainValue,mainGrowth:mainGrowthFor(main,rarity,mainValue),subs,level:0,maxLevel:gearMaxLevel(rarity),upgradeHistory:[]}
}
function subCurrentValue(g,i){const s=g.subs?.[i];return +(Number(s?.value||0)+Number(s?.rollBonus||0)).toFixed(s?.stat==='flatScore'?0:2)}
function awardDrops(){const count=selectedFloor>=8?3:selectedFloor>=4?2:1,drops=Array.from({length:count},makeGear);user.stageGear.push(...drops);return drops}
async function finish(win,quick=false){if(!battle&&!quick)return;if(win){const key=`${selectedTrial}:${selectedFloor}`;user.trialClears[key]=Number(user.trialClears[key]||0)+1;const drops=awardDrops();$('resultTitle').textContent='CLEAR!';$('resultSub').textContent=`${TRIALS[selectedTrial].name} · FLOOR ${selectedFloor}${battle?.first?' · FIRST CLEAR':''}`;$('dropBox').innerHTML=drops.map(g=>`<div class="drop"><small>${'★'.repeat(g.rarity)} · ${g.slot} · LV 0/${g.maxLevel}</small><strong>${SETS[g.set].name}</strong><span>${RELIC_LABELS[g.main]} +${g.mainValue}${g.main==='flatScore'?'':'%'}</span><span>${g.subs.map((s,i)=>`${RELIC_LABELS[s.stat]} +${subCurrentValue(g,i)}${s.stat==='flatScore'?'':'%'}`).join(' · ')}</span></div>`).join('');await sync()}else{$('resultTitle').textContent='FAILED';$('resultSub').textContent='Build your team and equipment, then try again.';$('dropBox').innerHTML=''}battle=null;show('resultView');renderAll()}
let quickEnergy=20;
function openQuickClear(){
 quickEnergy=20;const max=Math.floor(Number(user?.eventEnergy||0)/20)*20;
 if(max<20){toast('NOT ENOUGH ENERGY · NEED 20');return}
 $('quickClearModal').classList.remove('hidden');renderQuickClear();
}
function renderQuickClear(){const max=Math.max(20,Math.floor(Number(user?.eventEnergy||0)/20)*20);quickEnergy=Math.min(max,Math.max(20,Math.floor(quickEnergy/20)*20));$('quickEnergyValue').textContent=quickEnergy;$('quickRuns').textContent=quickEnergy/20;$('quickMinus').disabled=quickEnergy<=20;$('quickPlus').disabled=quickEnergy>=max}
function closeQuickClear(){$('quickClearModal').classList.add('hidden')}
async function confirmQuickClear(){
 const runs=Math.max(1,quickEnergy/20);if(!consumeTrialEnergy(quickEnergy))return;closeQuickClear();
 const allDrops=[];for(let r=0;r<runs;r++){const count=selectedFloor>=8?3:selectedFloor>=4?2:1;for(let i=0;i<count;i++)allDrops.push(makeGear())}
 user.stageGear.push(...allDrops);const key=`${selectedTrial}:${selectedFloor}`;user.trialClears[key]=Number(user.trialClears[key]||0)+runs;
 $('resultTitle').textContent='QUICK CLEAR!';$('resultSub').textContent=`${TRIALS[selectedTrial].name} · FLOOR ${selectedFloor} · ${runs} RUN${runs>1?'S':''}`;
 $('dropBox').innerHTML=allDrops.map(g=>`<div class="drop"><small>${'★'.repeat(g.rarity)} · ${g.slot} · LV 0/${g.maxLevel}</small><strong>${SETS[g.set].name}</strong><span>${RELIC_LABELS[g.main]} +${g.mainValue}${g.main==='flatScore'?'':'%'}</span><span>${g.subs.map((s,i)=>`${RELIC_LABELS[s.stat]} +${subCurrentValue(g,i)}${s.stat==='flatScore'?'':'%'}`).join(' · ')}</span></div>`).join('');
 await sync();show('resultView');renderAll()
}
function renderGear(){const ids=Object.keys(CHARS).filter(owned);if(!gearChar||!owned(gearChar))gearChar=ids[0];$('gearChars').innerHTML=ids.map(id=>`<button class="gear-char ${id===gearChar?'active':''}" data-gchar="${id}"><img src="${CHARS[id].image}"><b>${CHARS[id].name}</b></button>`).join('');document.querySelectorAll('[data-gchar]').forEach(b=>b.onclick=()=>{gearChar=b.dataset.gchar;renderGear()});const eq=user.equipment[gearChar]||{};$('equippedSlots').innerHTML=SLOTS.map(slot=>{const g=user.stageGear.find(x=>x.id===eq[slot]);return `<div class="equip-slot"><small>${slot}</small>${g?`<strong>${SETS[g.set].name}</strong><span>${g.main.toUpperCase()} +${g.mainValue}%</span><button data-unequip="${slot}">REMOVE</button>`:'<strong>EMPTY</strong>'}</div>`}).join('');document.querySelectorAll('[data-unequip]').forEach(b=>b.onclick=()=>{delete user.equipment[gearChar][b.dataset.unequip];sync();renderGear()});const st=stats(gearChar);$('setEffects').innerHTML=Object.entries(st.sets).length?Object.entries(st.sets).map(([set,n])=>`<div><b>${SETS[set].name} ${n}/4</b> · ${n>=2?'✓':'○'} 2PC ${SETS[set].two} · ${n>=4?'✓':'○'} 4PC ${SETS[set].four}</div>`).join(''):'NO SET EFFECT ACTIVE';const used=new Set(Object.values(user.equipment).flatMap(x=>Object.values(x||{})));$('gearInventory').innerHTML=user.stageGear.slice().reverse().map(g=>`<div class="gear ${used.has(g.id)?'equipped':''}"><small>${'★'.repeat(g.rarity)} · ${g.slot}</small><strong>${SETS[g.set].name}</strong><span>${g.main.toUpperCase()} +${g.mainValue}%</span><span>${g.subs.map(s=>`${s.stat} +${s.value}%`).join(' · ')}</span><button data-equip="${g.id}" ${used.has(g.id)?'disabled':''}>EQUIP</button></div>`).join('')||'<p>No gear yet. Clear Stage Trials to obtain gear.</p>';document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equip(b.dataset.equip))}
function equip(gid){const g=user.stageGear.find(x=>x.id===gid);if(!g||!gearChar)return;user.equipment[gearChar]=user.equipment[gearChar]||{};user.equipment[gearChar][g.slot]=gid;sync();renderGear()}
function renderAll(){ensure(user);updateEnergy();renderTrials();if(!$('teamView').classList.contains('hidden'))renderTeam()}
$('backBtn').onclick=()=>location.href='index.html?return=lobby';$('closeFloor').onclick=()=>$('floorPanel').classList.add('hidden');$('teamBack').onclick=()=>{show('trialSelect');openTrial(selectedTrial)};$('startTrial').onclick=startBattle;$('quickClear').onclick=openQuickClear;$('quickClose').onclick=closeQuickClear;$('quickMinus').onclick=()=>{quickEnergy-=20;renderQuickClear()};$('quickPlus').onclick=()=>{quickEnergy+=20;renderQuickClear()};$('quickConfirm').onclick=confirmQuickClear;document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));$('resultBack').onclick=()=>{show('trialSelect');openTrial(selectedTrial)};hydrate();
