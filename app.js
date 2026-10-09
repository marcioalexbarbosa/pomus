(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const KEY = 'pomus.v1';
  const DEF = { settings: { focus: 25, short: 5, long: 15, rounds: 4, auto: false, sound: true, tick: true, notify: false }, history: [], timer: null };

  let st;
  try { st = JSON.parse(localStorage.getItem(KEY)); } catch { st = null; }
  st = { ...DEF, ...(st || {}) };
  st.settings = { ...DEF.settings, ...st.settings };
  if (!st.migN) { st.settings.notify = false; st.migN = true; }
  if (st.settings.long === 10 && !st.mig15) { st.settings.long = 15; st.mig15 = true; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };

  const fmt = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const todayCount = () => st.history.filter((h) => dayKey(h.ts) === dayKey(Date.now())).length;

  let suggested = null;
  function show(id) {
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === id));
    if (id !== 'rest') suggested = null;
    if (id === 'home') renderHome();
    if (id === 'rest') { $$('[data-rest]').forEach((b) => b.classList.toggle('suggest', b.dataset.rest === suggested)); $('#rest-short').textContent = fmt(st.settings.short * 60000); $('#rest-long').textContent = fmt(st.settings.long * 60000); }
    if (id === 'timeline') renderTimeline();
    if (id === 'stats') renderStats();
    if (id === 'settings') loadSettings();
  }
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));

  function renderHome() {
    $('#home-time').textContent = fmt(st.settings.focus * 60000);
    $('#tomato-n').textContent = todayCount();
    document.title = 'Pomus';
  }
  const stepDur = (d) => {
    const v = Math.min(180, Math.max(5, Math.round(st.settings.focus / 5) * 5 + d));
    st.settings.focus = v; save(); renderHome();
  };
  $('#dur-up').onclick = () => stepDur(5);
  $('#dur-dn').onclick = () => stepDur(-5);

  // ---- timer (timestamp based) ----
  let tick = null;
  function begin(mode, minutes) {
    const total = minutes * 60000;
    st.timer = { mode, total, endsAt: Date.now() + total, left: null };
    save(); runView();
  }
  function runView() {
    const t = st.timer; if (!t) return show('home');
    $('#focus').classList.toggle('resting', t.mode !== 'focus');
    $('#focus-label').textContent = t.mode === 'focus' ? `Tomato ${todayCount()}` : (t.mode === 'long' ? 'Long rest' : 'Rest');
    $('#pause').textContent = t.left == null ? 'PAUSE' : 'RESUME';
    lastSec = null; show('focus'); clearInterval(tick); tick = setInterval(update, 250); update();
  }
  let lastSec = null, flip = false;
  function update() {
    const t = st.timer; if (!t) return;
    const left = t.left != null ? t.left : t.endsAt - Date.now();
    $('#focus-time').textContent = fmt(left);
    paintMini(left);
    document.title = `${fmt(left)} · Pomus`;
    if (t.left == null && left <= 0) return finish();
    const sec = Math.ceil(left / 1000);
    if (t.left == null && sec !== lastSec) { if (lastSec != null && st.settings.tick && st.settings.sound) tock(); lastSec = sec; }
  }
  function finish() {
    const t = st.timer; clearInterval(tick); st.timer = null;
    if (t.mode === 'focus') st.history.push({ ts: Date.now(), min: +(t.total / 60000).toFixed(2) });
    save(); alarm(t.mode);
    if (t.mode === 'focus' && st.settings.auto) {
      const long = todayCount() % st.settings.rounds === 0;
      return begin(long ? 'long' : 'short', long ? st.settings.long : st.settings.short);
    }
    if (t.mode === 'focus') { suggested = todayCount() % st.settings.rounds === 0 ? 'long' : 'short'; show('rest'); }
    else show('home');
    paintMini();
  }
  $('#start').onclick = () => {
    begin('focus', st.settings.focus);
  };
  $('#pause').onclick = () => {
    const t = st.timer; if (!t) return;
    if (t.left == null) t.left = Math.max(0, t.endsAt - Date.now());
    else { t.endsAt = Date.now() + t.left; t.left = null; }
    save(); $('#pause').textContent = t.left == null ? 'PAUSE' : 'RESUME'; update();
  };
  $('#cancel').onclick = () => { clearInterval(tick); st.timer = null; save(); show('home'); paintMini(); };
  $$('[data-rest]').forEach((b) => b.addEventListener('click', () => {
    suggested = null;
    const long = b.dataset.rest === 'long';
    begin(long ? 'long' : 'short', long ? st.settings.long : st.settings.short);
  }));

  // ---- alarm ----
  let ac = null;
  function audio() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch {}
    return ac;
  }
  ['pointerdown', 'keydown'].forEach((e) => addEventListener(e, audio, { passive: true }));
  let noise = null;
  function tock() {
    const a = audio(); if (!a || a.state !== 'running') return;
    flip = !flip;
    if (!noise) {
      noise = a.createBuffer(1, Math.floor(a.sampleRate * 0.08), a.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = a.currentTime, lo = flip ? 1 : 0.8; // tic slightly higher than tac
    // wooden click: short low-passed noise burst
    const n = a.createBufferSource(), nf = a.createBiquadFilter(), ng = a.createGain();
    n.buffer = noise; nf.type = 'lowpass'; nf.frequency.value = 1100 * lo; nf.Q.value = 0.7;
    n.connect(nf); nf.connect(ng); ng.connect(a.destination);
    ng.gain.setValueAtTime(0.9, t0); ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
    n.start(t0); n.stop(t0 + 0.08);
    // soft body thump
    const o = a.createOscillator(), og = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(190 * lo, t0); o.frequency.exponentialRampToValueAtTime(110 * lo, t0 + 0.05);
    o.connect(og); og.connect(a.destination);
    og.gain.setValueAtTime(0.5, t0); og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);
    o.start(t0); o.stop(t0 + 0.08);
  }
  function beep() {
    const a = audio(); if (!a) return;
    [660, 880, 1320, 880, 1320].forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + 0.05 + i * 0.3;
      o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(a.destination);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.6, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      o.start(t0); o.stop(t0 + 1);
    });
  }
  function alarm(mode) {
    if (st.settings.sound) beep();
    if (st.settings.notify && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(mode === 'focus' ? 'Tomato done 🍅' : 'Rest over', { body: mode === 'focus' ? 'Time for a break.' : 'Back to focus?', icon: 'art/icon.svg' });
    }
  }

  // ---- timeline ----
  function renderTimeline() {
    const el = $('#timeline-list'); el.textContent = '';
    if (!st.history.length) { el.innerHTML = '<div class="empty">No tomatoes yet.</div>'; return; }
    const days = {};
    [...st.history].reverse().forEach((h) => (days[dayKey(h.ts)] ||= []).push(h));
    for (const [d, items] of Object.entries(days)) {
      const h3 = document.createElement('h3'); h3.textContent = `${d} · ${items.length} 🍅`; el.append(h3);
      items.forEach((h) => {
        const r = document.createElement('div'); r.className = 'row';
        const time = new Date(h.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        r.innerHTML = `<span>${time}</span><span>${h.min} min</span>`; el.append(r);
      });
    }
  }

  // ---- stats ----
  function renderStats() {
    const now = Date.now(), days = [];
    for (let i = 6; i >= 0; i--) { const t = now - i * 86400000; days.push({ k: dayKey(t), d: new Date(t), n: 0 }); }
    st.history.forEach((h) => { const x = days.find((d) => d.k === dayKey(h.ts)); if (x) x.n++; });
    $('#st-today').textContent = days[6].n;
    $('#st-week').textContent = days.reduce((a, d) => a + d.n, 0);
    $('#st-total').textContent = st.history.length;
    $('#st-min').textContent = Math.round(st.history.reduce((a, h) => a + h.min, 0));
    const max = Math.max(4, ...days.map((d) => d.n)), bw = 32, gap = 8;
    $('#chart').innerHTML = days.map((d, i) => {
      const h = (d.n / max) * 130, x = i * (bw + gap) + 8;
      const lbl = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.d.getDay()];
      return `<rect x="${x}" y="${150 - h}" width="${bw}" height="${h}" fill="#3a3835"/>` +
        (d.n ? `<text x="${x + bw / 2}" y="${144 - h}" text-anchor="middle">${d.n}</text>` : '') +
        `<text x="${x + bw / 2}" y="170" text-anchor="middle">${lbl}</text>`;
    }).join('') + '<line x1="0" y1="150" x2="320" y2="150" stroke="#3a3835" stroke-width="2"/>';
  }

  // ---- settings ----
  const fields = { focus: '#set-focus', short: '#set-short', long: '#set-long', rounds: '#set-rounds' };
  function loadSettings() {
    for (const [k, s] of Object.entries(fields)) $(s).value = st.settings[k];
    $('#set-auto').checked = st.settings.auto; $('#set-tick').checked = st.settings.tick; $('#set-notify').checked = st.settings.notify;
  }
  for (const [k, s] of Object.entries(fields)) $(s).addEventListener('change', (e) => {
    let v = parseFloat(e.target.value); if (k === 'rounds') v = Math.round(v); if (v > 0) { st.settings[k] = v; save(); } else e.target.value = st.settings[k];
  });
  $('#set-auto').onchange = (e) => { st.settings.auto = e.target.checked; save(); };
  $('#set-tick').onchange = (e) => { st.settings.tick = e.target.checked; save(); };
  $('#set-notify').onchange = (e) => {
    st.settings.notify = e.target.checked; save();
    if (e.target.checked && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  };
  $('#clear').onclick = () => { if (confirm('Clear all history?')) { st.history = []; save(); } };

  // ---- mute toggle ----
  const paintMute = () => $('#mute').classList.toggle('off', !st.settings.sound);
  $('#mute').onclick = () => {
    st.settings.sound = !st.settings.sound; save(); paintMute();
    if (st.settings.sound) audio();
  };
  paintMute();

  // ---- mini mode ----
  const FULL = [350, 550], MINI = [260, 84];
  function sizeWindow([w, h]) {
    if (window.pomus) return window.pomus.resize(w, h);
    try { window.resizeTo(w + (outerWidth - innerWidth), h + (outerHeight - innerHeight)); } catch {}
  }
  function paintMini(left) {
    const t = st.timer;
    if (left == null) left = t ? (t.left != null ? t.left : t.endsAt - Date.now()) : st.settings.focus * 60000;
    $('#mini-time').textContent = fmt(left);
    $('#mini-play').textContent = !t || t.left != null ? '▶' : '❚❚';
    document.body.classList.toggle('mini-dark', !!t);
    document.body.classList.toggle('mini-rest', !!t && t.mode !== 'focus');
  }
  function setMini(on) {
    st.mini = on; save();
    document.body.classList.toggle('mini', on);
    sizeWindow(on ? MINI : FULL); paintMini();
  }
  $('#mini-btn').onclick = () => setMini(true);
  $('#mini-exp').onclick = () => setMini(false);
  $('#mini-play').onclick = () => {
    if (!st.timer) $('#start').click(); else $('#pause').click();
    paintMini();
  };
  $('#mini-time').onclick = () => $('#mini-play').click();
  setInterval(() => { if (st.mini && !st.timer) paintMini(); }, 1000);
  if (st.mini) { document.body.classList.add('mini'); sizeWindow(MINI); paintMini(); }

  // resume a running timer after reopen
  if (st.timer) { if (st.timer.left == null && st.timer.endsAt <= Date.now()) finish(); else runView(); } else renderHome();
})();
