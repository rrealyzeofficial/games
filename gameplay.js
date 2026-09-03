(() => {
  'use strict';

  const $ = id => document.getElementById(id);


  // Keep gameplay on the same 1440px PC canvas on mobile.
  function applyMobileDesktopScale() {
    if (!window.matchMedia('(max-width: 900px)').matches) {
      document.body.classList.remove('realyze-mobile-pc');
      return;
    }
    const sw = Math.max(1, Number(window.screen?.width || window.innerWidth));
    const sh = Math.max(1, Number(window.screen?.height || window.innerHeight));
    const landscapeWidth = Math.max(sw, sh);
    const scale = Math.min((landscapeWidth / 1440) * 0.88, 1);
    document.body.classList.add('realyze-mobile-pc');
    document.body.style.setProperty('--realyze-mobile-scale', String(scale));
  }
  window.addEventListener('resize', applyMobileDesktopScale, {passive:true});
  window.addEventListener('orientationchange', () => setTimeout(applyMobileDesktopScale, 80), {passive:true});
  applyMobileDesktopScale();
  const params = new URLSearchParams(location.search);
  const songIndex = Number(params.get('song') || 0);
  const difficulty = params.get('difficulty') || 'EASY';
  const character = params.get('character') || 'mystery';

  const songs = [
    { id:'track-01', name:'VIRTUAL TO LIVE', artist:'REALYZE (but Ebi & Mikon)', audio:'assets/song-01_[cut_98sec].mp3' },
    { id:'track-02', name:'NEON HEART', artist:'REALYZE!!', audio:'' },
    { id:'track-03', name:'AFTER THE RAIN', artist:'REALYZE!!', audio:'' }
  ];

  const song = songs[songIndex] || songs[0];
  const laneArea = $('laneArea');
  const audio = song.audio ? new Audio(song.audio) : null;

  const keys = { d:0, f:1, j:2, k:3 };
  const travel = 1.8;
  const hitWindow = .28;
  const perfectWindow = .10;
  const greatWindow = .18;

  const chart = [
    [2.00, 0, 'tap', 0],
    [2.65, 1, 'tap', 0],
    [3.30, 2, 'tap', 0],
    [3.85, 3, 'tap', 0],
    [4.50, 2, 'tap', 0],
    [5.15, 1, 'tap', 0],
    [5.70, 3, 'tap', 0],
    [6.35, 0, 'tap', 0],
    [7.00, 1, 'hold', 0.55],
    [7.65, 3, 'tap', 0],
    [8.20, 2, 'tap', 0],
    [8.85, 0, 'tap', 0],
    [9.50, 0, 'tap', 0],
    [10.05, 1, 'tap', 0],
    [10.70, 2, 'tap', 0],
    [11.35, 3, 'tap', 0],
    [12.00, 2, 'tap', 0],
    [12.55, 1, 'tap', 0],
    [13.20, 3, 'tap', 0],
    [13.85, 0, 'tap', 0],
    [14.40, 1, 'tap', 0],
    [15.05, 3, 'tap', 0],
    [15.70, 2, 'tap', 0],
    [16.35, 0, 'tap', 0],
    [16.90, 0, 'hold', 0.55],
    [17.55, 1, 'tap', 0],
    [18.20, 2, 'tap', 0],
    [18.75, 3, 'tap', 0],
    [19.40, 2, 'tap', 0],
    [20.05, 1, 'tap', 0],
    [20.70, 3, 'tap', 0],
    [21.25, 0, 'tap', 0],
    [21.90, 1, 'tap', 0],
    [22.55, 3, 'tap', 0],
    [23.10, 2, 'tap', 0],
    [23.75, 0, 'tap', 0],
    [24.40, 0, 'tap', 0],
    [25.05, 1, 'tap', 0],
    [25.60, 2, 'tap', 0],
    [26.25, 3, 'tap', 0],
    [26.90, 2, 'hold', 0.55],
    [27.45, 1, 'tap', 0],
    [28.10, 3, 'tap', 0],
    [28.75, 0, 'tap', 0],
    [29.40, 1, 'tap', 0],
    [29.95, 3, 'tap', 0],
    [30.60, 2, 'tap', 0],
    [31.25, 0, 'tap', 0],
    [31.80, 0, 'tap', 0],
    [32.45, 1, 'tap', 0],
    [33.10, 2, 'tap', 0],
    [33.75, 3, 'tap', 0],
    [34.30, 2, 'tap', 0],
    [34.95, 1, 'tap', 0],
    [35.60, 3, 'tap', 0],
    [36.15, 0, 'tap', 0],
    [36.80, 1, 'hold', 0.55],
    [37.45, 3, 'tap', 0],
    [38.10, 2, 'tap', 0],
    [38.65, 0, 'tap', 0],
    [39.30, 0, 'tap', 0],
    [39.95, 1, 'tap', 0],
    [40.50, 2, 'tap', 0],
    [41.15, 3, 'tap', 0],
    [41.80, 2, 'tap', 0],
    [42.45, 1, 'tap', 0],
    [43.00, 3, 'tap', 0],
    [43.65, 0, 'tap', 0],
    [44.30, 1, 'tap', 0],
    [44.85, 3, 'tap', 0],
    [45.50, 2, 'tap', 0],
    [46.15, 0, 'tap', 0],
    [46.80, 0, 'hold', 0.55],
    [47.35, 1, 'tap', 0],
    [48.00, 2, 'tap', 0],
    [48.65, 3, 'tap', 0],
    [49.20, 2, 'tap', 0],
    [49.85, 1, 'tap', 0],
    [50.50, 3, 'tap', 0],
    [51.15, 0, 'tap', 0],
    [51.70, 1, 'tap', 0],
    [52.35, 3, 'tap', 0],
    [53.00, 2, 'tap', 0],
    [53.55, 0, 'tap', 0],
    [54.20, 0, 'tap', 0],
    [54.85, 1, 'tap', 0],
    [55.50, 2, 'tap', 0],
    [56.05, 3, 'tap', 0],
    [56.70, 2, 'hold', 0.55],
    [57.35, 1, 'tap', 0],
    [57.90, 3, 'tap', 0],
    [58.55, 0, 'tap', 0],
    [59.20, 1, 'tap', 0],
    [59.85, 3, 'tap', 0],
    [60.40, 2, 'tap', 0],
    [61.05, 0, 'tap', 0],
    [61.70, 0, 'tap', 0],
    [62.25, 1, 'tap', 0],
    [62.90, 2, 'tap', 0],
    [63.55, 3, 'tap', 0],
    [64.20, 2, 'tap', 0],
    [64.75, 1, 'tap', 0],
    [65.40, 3, 'tap', 0],
    [66.05, 0, 'tap', 0],
    [66.60, 1, 'hold', 0.55],
    [67.25, 3, 'tap', 0],
    [67.90, 2, 'tap', 0],
    [68.55, 0, 'tap', 0],
    [69.10, 0, 'tap', 0],
    [69.75, 1, 'tap', 0],
    [70.40, 2, 'tap', 0],
    [70.95, 3, 'tap', 0],
    [71.60, 2, 'tap', 0],
    [72.25, 1, 'tap', 0],
    [72.90, 3, 'tap', 0],
    [73.45, 0, 'tap', 0],
    [74.10, 1, 'tap', 0],
    [74.75, 3, 'tap', 0],
    [75.30, 2, 'tap', 0],
    [75.95, 0, 'tap', 0],
    [76.60, 0, 'hold', 0.55],
    [77.25, 1, 'tap', 0],
    [77.80, 2, 'tap', 0],
    [78.45, 3, 'tap', 0],
    [79.10, 2, 'tap', 0],
    [79.65, 1, 'tap', 0],
    [80.30, 3, 'tap', 0],
    [80.95, 0, 'tap', 0],
    [81.60, 1, 'tap', 0],
    [82.15, 3, 'tap', 0],
    [82.80, 2, 'tap', 0],
    [83.45, 0, 'tap', 0],
    [84.00, 0, 'tap', 0],
    [84.65, 1, 'tap', 0],
    [85.30, 2, 'tap', 0],
    [85.95, 3, 'tap', 0],
    [86.50, 2, 'hold', 0.55],
    [87.15, 1, 'tap', 0],
    [87.80, 3, 'tap', 0],
    [88.35, 0, 'tap', 0],
    [89.00, 1, 'tap', 0],
    [89.65, 3, 'tap', 0],
    [90.30, 2, 'tap', 0],
    [90.85, 0, 'tap', 0],
    [91.50, 0, 'tap', 0],
    [92.15, 1, 'tap', 0],
    [92.70, 2, 'tap', 0],
    [93.35, 3, 'tap', 0],
    [94.00, 2, 'tap', 0],
    [94.65, 1, 'tap', 0],
    [95.20, 3, 'tap', 0],
    [95.85, 0, 'tap', 0],
    [96.50, 1, 'hold', 0.55]
  ];

  const notes = chart.map((n,i) => ({id:i,time:n[0],lane:n[1],type:n[2],duration:n[3],el:null,hit:false,missed:false}));
  let frame = 0, running = false, score = 0, combo = 0, maxCombo = 0;
  let perfect = 0, great = 0, okay = 0, miss = 0;
  let skillReady = true, skillActive = false, skillNextAt = 0;

  $('songName').textContent = song.name;
  $('difficulty').textContent = difficulty;
  document.title = `REALYZE!! — ${song.name}`;

  function hud() {
    $('score').textContent = score.toLocaleString();
    $('comboNumber').textContent = combo;
    $('scoreFill').style.width = `${Math.min(100, score / (notes.length * 10))}%`;
  }

  function updateSkill(t) {
    const btn = $('skillBtn');
    const timer = $('skillTimer');
    if (!btn || !timer) return;

    if (skillActive) {
      btn.classList.add('active');
      btn.classList.remove('ready');
      timer.textContent = 'ACTIVE';
      return;
    }

    btn.classList.remove('active');
    if (skillReady) {
      btn.classList.add('ready');
      timer.textContent = 'READY';
    } else {
      btn.classList.remove('ready');
      timer.textContent = `${Math.max(0, Math.ceil(skillNextAt - t))}s`;
      if (t >= skillNextAt) {
        skillReady = true;
        btn.classList.add('ready');
        timer.textContent = 'READY';
      }
    }
  }

  function judge(text) {
    const el = $('judgement');
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth;
    if (text) el.classList.add('pop');
  }

  function createNote(note) {
    const el = document.createElement('div');
    el.className = `note ${note.type === 'hold' ? 'hold' : ''}`;
    el.style.left = `${note.lane * 25 + 12.5}%`;
    if (note.type === 'hold') el.style.setProperty('--hold-height', `${30 + note.duration * 150}px`);
    laneArea.appendChild(el);
    note.el = el;
  }

  function removeNote(note, animate=false) {
    if (!note.el) return;
    const el = note.el;
    note.el = null;
    if (animate) {
      el.classList.add('hit');
      setTimeout(() => el.remove(), 180);
    } else el.remove();
  }

  function loop() {
    if (!running || !audio) return;
    const t = audio.currentTime;
    updateSkill(t);
    const hitY = laneArea.clientHeight - 82;

    for (const note of notes) {
      if (!note.el && !note.hit && !note.missed && t >= note.time - travel) createNote(note);
      if (!note.el || note.hit || note.missed) continue;
      const diff = note.time - t;
      const progress = 1 - diff / travel;
      const y = -40 + (hitY + 40) * progress;
      note.el.style.transform = `translate(-50%, ${y}px)`;
      if (diff < -hitWindow) {
        note.missed = true;
        combo = 0;
        miss++;
        removeNote(note);
        judge('MISS');
        hud();
      }
    }

    frame = requestAnimationFrame(loop);
  }

  function hit(lane) {
    if (!running || !audio) return;
    const t = audio.currentTime;
    let target = null, closest = Infinity;

    for (const note of notes) {
      if (note.hit || note.missed || note.lane !== lane) continue;
      const diff = Math.abs(note.time - t);
      if (diff <= hitWindow && diff < closest) { closest = diff; target = note; }
    }
    if (!target) return;

    target.hit = true;
    combo++;
    maxCombo = Math.max(maxCombo, combo);

    if (closest <= perfectWindow) { score += skillActive ? 1500 : 1000; perfect++; judge('PERFECT'); }
    else if (closest <= greatWindow) { score += skillActive ? 1050 : 700; great++; judge('GREAT'); }
    else { score += skillActive ? 600 : 400; okay++; judge('OKAY'); }

    removeNote(target, true);
    hud();
  }

  function stop(goBack=true) {
    running = false;
    cancelAnimationFrame(frame);
    if (audio) { audio.pause(); audio.currentTime = 0; }
    document.querySelectorAll('.note').forEach(n => n.remove());
    if (goBack) location.href = 'index.html?return=nowplay';
  }

  function showResult() {
    running = false;
    cancelAnimationFrame(frame);
    if (audio) { audio.pause(); audio.currentTime = 0; }
    document.querySelectorAll('.note').forEach(n => n.remove());

    $('resultTitle').textContent = song.name;
    $('resultScore').textContent = score.toLocaleString();
    $('resultPerfect').textContent = perfect;
    $('resultGreat').textContent = great;
    $('resultOkay').textContent = okay;
    $('resultMiss').textContent = miss;
    $('resultMaxCombo').textContent = maxCombo;

    const ratio = notes.length ? (perfect + great * .7 + okay * .4) / notes.length : 0;
    $('resultRank').textContent = ratio >= .90 ? 'S' : ratio >= .80 ? 'A' : ratio >= .65 ? 'B' : ratio >= .50 ? 'C' : 'D';
    $('result').classList.remove('hidden');
  }

  function activateSkill() {
    if (!running || !skillReady || skillActive || !audio) return;
    skillReady = false;
    skillActive = true;
    skillNextAt = audio.currentTime + 20;
    updateSkill(audio.currentTime);

    setTimeout(() => {
      skillActive = false;
      if (running && audio) updateSkill(audio.currentTime);
    }, 5000);
  }

  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (!(key in keys) || e.repeat) return;
    e.preventDefault();
    const button = document.querySelector(`[data-key="${key}"]`);
    if (button) button.classList.add('active');
    hit(keys[key]);
  });

  document.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    const button = document.querySelector(`[data-key="${key}"]`);
    if (button) button.classList.remove('active');
  });

  // Touch anywhere inside the lane area: map the touch X position to one of 4 lanes.
  // This keeps the PC layout while making the actual playfield tappable on phones.
  laneArea.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    const rect = laneArea.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
    const lane = Math.floor(x / (rect.width / 4));
    hit(lane);
    const button = document.querySelector(`.keys button[data-lane="${lane}"]`);
    if (button) {
      button.classList.add('active');
      setTimeout(() => button.classList.remove('active'), 90);
    }
  }, { passive: false });

  document.querySelectorAll('.keys button').forEach(button => {
    const press = (e) => {
      e.preventDefault();
      button.classList.add('active');
      hit(Number(button.dataset.lane));
    };
    const release = () => button.classList.remove('active');
    button.addEventListener('pointerdown', press, { passive:false });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });

  $('backBtn').addEventListener('click', () => stop(true));
  $('skillBtn').addEventListener('click', activateSkill);
  $('resultBackBtn').addEventListener('click', () => { location.href = 'index.html?return=nowplay'; });

  function start() {
    if (!audio) {
      judge('NO AUDIO');
      return;
    }
    running = true;
    score = 0; combo = 0; maxCombo = 0; perfect = 0; great = 0; okay = 0; miss = 0;
    skillReady = true; skillActive = false; skillNextAt = 0;
    $('result').classList.add('hidden');
    hud();
    updateSkill(0);
    $('ready').classList.add('show');
    audio.currentTime = 0;
    audio.play().catch(() => judge('PRESS PLAY / ALLOW AUDIO'));
    frame = requestAnimationFrame(loop);
  }

  if (audio) audio.addEventListener('ended', showResult);
  start();
})();
