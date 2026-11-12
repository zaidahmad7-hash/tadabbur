'use strict';
/* Tadabbur — a daily journey through the Quran and its meaning.
   Content (Arabic text, word-by-word, translations, tafsir, audio) is loaded live from the Quran.com API.
   Progress and reflections are stored on this device only. */

const API = 'https://api.quran.com/api/v4';
const TOTAL_AYAHS = 6236;

const TRANSLATIONS = [[20,'Saheeh International'],[85,'M.A.S. Abdel Haleem'],[22,'A. Yusuf Ali'],[19,'M. Pickthall'],[84,'Mufti Taqi Usmani']];
const TAFSIRS = [[817,'Tazkirul Quran','Short and reflective, by Maulana Wahiduddin Khan'],[169,'Ibn Kathir (abridged)','Detailed classical explanation'],[168,"Ma'arif al-Qur'an",'Detailed, by Mufti Muhammad Shafi']];
const RECITERS = [[7,'Mishari al-Afasy'],[2,'Abdul Basit (Murattal)'],[6,'Mahmoud al-Husary'],[9,'al-Minshawi (Murattal)'],[3,'Abdur-Rahman as-Sudais'],[4,'Abu Bakr al-Shatri'],[10,"Sa'ud ash-Shuraym"]];
const STEPS = ['Intro','Listen','Words','Meaning','Reflect'];
const NEXT_LABEL = ['Listen','Word by word','Meaning','Reflect','Complete passage'];

/* ---------- passages ---------- */
const RUKUS = (() => {
  const a = RUKU_STARTS.split(',').map(x => x.split(':').map(Number));
  return a.map(([s, v], i) => {
    const n = a[i + 1];
    return { i: i + 1, s, from: v, to: n && n[0] === s ? n[1] - 1 : SURAHS[s - 1][4] };
  });
})();
const BY_SURAH = {};
RUKUS.forEach(r => (BY_SURAH[r.s] = BY_SURAH[r.s] || []).push(r.i));
RUKUS.forEach(r => { r.k = BY_SURAH[r.s].indexOf(r.i) + 1; r.K = BY_SURAH[r.s].length; r.ayahs = r.to - r.from + 1; });

const TRACKS = {
  prayer: {
    name: 'Prayer Surahs',
    blurb: "Al-Fatihah and Juz 'Amma, shortest first. The surahs you recite in salah.",
    list: [...BY_SURAH[1], ...Array.from({ length: 37 }, (_, k) => 114 - k).flatMap(s => BY_SURAH[s])]
  },
  journey: {
    name: 'Full Journey',
    blurb: 'The whole Quran in order, one passage a day. About 18 months.',
    list: RUKUS.map(r => r.i)
  }
};

/* ---------- state ---------- */
const KEY = 'tadabbur.v1';
const DEF = { done: {}, track: 'prayer', refl: [], days: {}, drafts: {}, onboard: false,
  set: { tr: 20, taf: 817, rec: 7, scale: 1, theme: 'night', translit: true, speed: 1 } };
let S = load();
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY));
    if (j) return { ...JSON.parse(JSON.stringify(DEF)), ...j, set: { ...DEF.set, ...(j.set || {}) } };
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEF));
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sur = s => ({ n: s, name: SURAHS[s - 1][0], ar: SURAHS[s - 1][1], en: SURAHS[s - 1][2], place: SURAHS[s - 1][3], ayahs: SURAHS[s - 1][4], order: SURAHS[s - 1][5] });
const ref = r => `${sur(r.s).name} · ${r.from === r.to ? 'Ayah ' + r.from : 'Ayahs ' + r.from + '–' + r.to}`;
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nameOf = (list, id) => (list.find(x => x[0] === id) || list[0])[1];

const STAR = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="21" y="21" width="58" height="58" rx="2"/><rect x="21" y="21" width="58" height="58" rx="2" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="13"/></svg>`;
const I = {
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13"/></svg>'
};

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

function applySettings() {
  document.documentElement.dataset.theme = S.set.theme;
  document.documentElement.style.setProperty('--ar-scale', S.set.scale);
  $('meta[name=theme-color]').setAttribute('content', S.set.theme === 'night' ? '#0D0C0A' : '#F5EFE2');
}

/* ---------- progress ---------- */
const isDone = i => !!S.done[i];
const doneCount = () => Object.keys(S.done).length;
const ayahsDone = () => Object.keys(S.done).reduce((n, i) => n + RUKUS[i - 1].ayahs, 0);
const pctQuran = () => { const p = ayahsDone() / TOTAL_AYAHS * 100; return p === 0 ? '0' : p < 1 ? p.toFixed(1) : Math.round(p).toString(); };
const trackDone = t => TRACKS[t].list.filter(isDone).length;
const nextIn = t => TRACKS[t].list.find(i => !isDone(i));
const surahDone = s => BY_SURAH[s].filter(isDone).length;
const todayCount = () => S.days[dayKey()] || 0;

/* ---------- API ---------- */
const mem = new Map();
function api(path) {
  if (mem.has(path)) return mem.get(path);
  const p = fetch(API + path).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  mem.set(path, p); p.catch(() => mem.delete(path));
  return p;
}
function cleanText(html) {
  const d = new DOMParser().parseFromString(String(html).replace(/<sup[^>]*>.*?<\/sup>/gi, ''), 'text/html');
  return (d.body.textContent || '').replace(/\s+/g, ' ').trim();
}
const ALLOW = new Set(['P', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I', 'BR', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'SPAN', 'DIV']);
function sanitize(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const out = document.createElement('div');
  (function walk(src, dst) {
    for (const n of [...src.childNodes]) {
      if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.textContent)); continue; }
      if (n.nodeType !== 1) continue;
      const t = n.tagName;
      if (['SUP', 'SCRIPT', 'STYLE', 'IMG', 'IFRAME', 'svg', 'SVG'].includes(t)) continue;
      if (ALLOW.has(t)) {
        const e = document.createElement(t.toLowerCase());
        const lang = n.getAttribute('lang') || (n.className && /arabic/i.test(n.className) ? 'ar' : '');
        if (lang) e.setAttribute('lang', lang);
        if (lang === 'ar') e.setAttribute('dir', 'rtl');
        walk(n, e); dst.appendChild(e);
      } else walk(n, dst);
    }
  })(doc.body, out);
  return out;
}
const audioUrl = u => !u ? null : /^https?:/.test(u) ? u : u.startsWith('//') ? 'https:' + u : 'https://verses.quran.com/' + u;

async function getPassage(i) {
  const r = RUKUS[i - 1], per = 50;
  const q = `words=true&word_fields=text_uthmani&translations=${S.set.tr}&audio=${S.set.rec}&fields=text_uthmani&per_page=${per}`;
  const pages = [];
  for (let p = Math.floor((r.from - 1) / per) + 1; p <= Math.floor((r.to - 1) / per) + 1; p++) pages.push(api(`/verses/by_chapter/${r.s}?${q}&page=${p}`));
  const res = await Promise.all(pages);
  return res.flatMap(x => x.verses).filter(v => v.verse_number >= r.from && v.verse_number <= r.to).map(v => ({
    key: v.verse_key, n: v.verse_number, ar: v.text_uthmani,
    tr: cleanText(v.translations?.[0]?.text || ''),
    audio: audioUrl(v.audio?.url),
    words: (v.words || []).filter(w => w.char_type_name === 'word').map(w => ({
      ar: w.text_uthmani || w.text, tl: w.transliteration?.text || '', m: w.translation?.text || '',
      au: w.audio_url ? 'https://audio.qurancdn.com/' + w.audio_url : null
    }))
  }));
}
const getInfo = s => api(`/chapters/${s}/info?language=en`).then(j => j.chapter_info);
const getTafsir = key => api(`/tafsirs/${S.set.taf}/by_ayah/${key}`).then(j => j.tafsir);

/* ---------- audio ---------- */
const player = $('#player');
const wordAudio = new Audio();
const A = { queue: [], idx: -1, onChange: null };
function playQueue(list, start = 0) {
  wordAudio.pause();
  A.queue = list; A.idx = start; playCurrent();
}
function playCurrent() {
  const it = A.queue[A.idx];
  if (!it || !it.src) { stopAudio(); return; }
  player.src = it.src; player.playbackRate = S.set.speed;
  const p = player.play();
  if (p) p.then(() => { player.playbackRate = S.set.speed; }).catch(() => { toast('Audio could not start. Tap play again.'); stopAudio(); });
  A.onChange && A.onChange();
}
function stopAudio() { player.pause(); A.queue = []; A.idx = -1; A.onChange && A.onChange(); }
player.addEventListener('ended', () => { A.idx++; if (A.idx < A.queue.length) playCurrent(); else stopAudio(); });
player.addEventListener('error', () => { if (A.idx >= 0) { toast('Audio unavailable right now.'); stopAudio(); } });
function playWord(src) {
  if (!src) return;
  if (A.idx >= 0) stopAudio();
  wordAudio.src = src; wordAudio.play().catch(() => {});
}
const isPlaying = () => A.idx >= 0 && !player.paused;

/* ---------- overlays ---------- */
const layer = $('#layer');
function openSheet(html, onMount) {
  closeSheet();
  layer.innerHTML = `<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  $('.scrim', layer).onclick = closeSheet;
  const sh = $('.sheet', layer);
  onMount && onMount(sh);
  return sh;
}
function closeSheet() { layer.innerHTML = ''; }
function confirmDialog(title, body, ok = 'Confirm', danger = false) {
  return new Promise(res => {
    layer.innerHTML = `<div class="scrim"></div><div class="dialog" role="alertdialog"><h3>${esc(title)}</h3><p class="muted">${esc(body)}</p>
      <div class="btns"><button class="btn ghost" data-r="0">Cancel</button><button class="btn primary ${danger ? 'danger-btn' : ''}" data-r="1">${esc(ok)}</button></div></div>`;
    $$('[data-r]', layer).forEach(b => b.onclick = () => { closeSheet(); res(b.dataset.r === '1'); });
    $('.scrim', layer).onclick = () => { closeSheet(); res(false); };
  });
}

/* ---------- tabs ---------- */
const app = $('#app');
let currentTab = 'today';
$$('#tabs button').forEach(b => b.onclick = () => go(b.dataset.tab));
function go(tab) {
  stopAudio(); $('#toast').classList.remove('show');
  currentTab = tab;
  document.body.classList.remove('in-session');
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  ({ today: renderToday, map: renderMap, journal: renderJournal, settings: renderSettings })[tab]();
  window.scrollTo(0, 0);
}

/* ---------- TODAY ---------- */
function renderToday() {
  const now = new Date();
  const greg = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  let hijri = '';
  try { hijri = new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(now); } catch (e) {}
  const hour = now.getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const t = S.track, nx = nextIn(t);
  let hero;
  if (nx) {
    const r = RUKUS[nx - 1], s = sur(r.s), did = todayCount() > 0;
    hero = `<section class="hero fade">
      <div class="star">${STAR}</div>
      <div class="top"><span class="pill">${esc(TRACKS[t].name)}</span><span class="pill plain">${did ? 'Bonus passage' : "Today's passage"}</span></div>
      <div class="sname"><div class="ar">${esc(s.ar)}</div><h2>${esc(s.name)} <span class="muted" style="font-size:1rem">· ${esc(s.en)}</span></h2></div>
      <div class="meta">${r.from === r.to ? 'Ayah ' + r.from : 'Ayahs ' + r.from + '–' + r.to} · Passage ${r.k} of ${r.K} · ${s.place === 'M' ? 'Makki' : 'Madani'}</div>
      <div class="actions">
        ${did ? `<div class="done-note">${I.check} Today's passage is done. Keep going if your heart is in it.</div>` : ''}
        <button class="btn primary full" id="begin">${did ? 'Read one more' : "Begin today's passage"}</button>
      </div></section>`;
  } else {
    const other = t === 'prayer' ? 'journey' : 'prayer';
    hero = `<section class="hero fade"><div class="star">${STAR}</div>
      <div class="top"><span class="pill">${esc(TRACKS[t].name)}</span></div>
      <div class="sname"><h2>Path complete. Alhamdulillah.</h2></div>
      <div class="meta">You have studied every passage in ${esc(TRACKS[t].name)}.</div>
      <div class="actions">${nextIn(other) ? `<button class="btn primary full" id="switch">Continue with ${esc(TRACKS[other].name)}</button>` : ''}</div></section>`;
  }

  // week (Mon-Sun)
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  let days = 0;
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(monday); d.setDate(monday.getDate() + k);
    const key = dayKey(d), on = !!S.days[key]; if (on) days++;
    return `<div class="d ${on ? 'on' : ''} ${key === dayKey() ? 'today' : ''}"><i></i><span>${'MTWTFSS'[k]}</span></div>`;
  }).join('');
  const hint = days === 0 ? 'A new week. One passage is enough to begin.' : days === 1 ? '1 day with the Quran this week. Small and steady.' : `${days} days with the Quran this week. Small and steady.`;

  const lastR = S.refl[S.refl.length - 1];
  const isFriday = now.getDay() === 5;

  app.innerHTML = `<main class="page stack">
    <header class="brand fade"><div class="name">${STAR}<span>Tadabbur</span></div><div class="ar">تدبّر</div></header>
    <div class="greet fade"><span class="eyebrow">${esc(part)}</span><h1>Assalamu alaikum</h1><span class="date">${esc(greg)}${hijri ? ' · ' + esc(hijri) : ''}</span></div>
    ${hero}
    ${isFriday ? `<button class="card fade" id="kahf" style="text-align:left;display:flex;gap:14px;align-items:center"><span class="ar gold" style="font-size:1.8rem">الكهف</span><span style="flex:1"><b>It's Jumu'ah</b><br><span class="muted" style="font-size:.86rem">A good day to read Surah Al-Kahf. Open its passages.</span></span></button>` : ''}
    <section class="card fade"><div class="section-h"><span class="eyebrow">This week</span></div><div class="week">${week}</div><p class="hint">${hint}</p></section>
    <section class="stats fade">
      <div class="stat g"><b>${doneCount()}</b><span>of 556 passages</span></div>
      <div class="stat"><b>${pctQuran()}%</b><span>of the Quran</span></div>
      <div class="stat"><b>${S.refl.length}</b><span>reflections</span></div>
    </section>
    <section class="stack fade" style="gap:12px"><span class="eyebrow">Your path</span><div class="tracks">
      ${['prayer', 'journey'].map(k => { const tr = TRACKS[k], d = trackDone(k), n = tr.list.length; return `
        <button class="track ${S.track === k ? 'on' : ''}" data-track="${k}">
          <span class="t">${esc(tr.name)}</span><span class="c">${d} / ${n}</span>
          <span class="s">${esc(tr.blurb)}</span>
          <span class="bar"><i style="width:${(d / n * 100).toFixed(1)}%"></i></span></button>`; }).join('')}
    </div></section>
    ${lastR ? `<section class="stack fade" style="gap:12px"><div class="section-h"><span class="eyebrow">Your last reflection</span><button class="link" id="tojournal">Journal</button></div>
      <div class="quote"><span class="q">${esc(ref(RUKUS[lastR.i - 1]))}</span><span class="a">${esc(lastR.t.length > 220 ? lastR.t.slice(0, 220) + '…' : lastR.t)}</span></div></section>` : ''}
  </main>`;

  $('#begin') && ($('#begin').onclick = () => startSession(nx));
  $('#switch') && ($('#switch').onclick = () => { S.track = S.track === 'prayer' ? 'journey' : 'prayer'; save(); renderToday(); });
  $('#kahf') && ($('#kahf').onclick = () => openSurah(18));
  $('#tojournal') && ($('#tojournal').onclick = () => go('journal'));
  $$('[data-track]').forEach(b => b.onclick = () => { S.track = b.dataset.track; save(); renderToday(); toast(`Path set to ${TRACKS[S.track].name}`); });

  if (!S.onboard) welcome();
  if (nx) setTimeout(() => getPassage(nx).catch(() => {}), 600); // warm the cache
}

function welcome() {
  openSheet(`<div class="stack" style="gap:18px;padding-bottom:6px">
    <div style="color:var(--gold);width:54px;height:54px">${STAR}</div>
    <h2>Welcome to Tadabbur</h2>
    <p class="prose" style="margin:0">Tadabbur means reflecting deeply on the Quran. Each day you study one short passage in five calm steps:</p>
    <div class="plist">
      ${[['Intro', 'Where the passage sits and what the surah is about'], ['Listen', 'Hear it recited while you follow the Arabic'], ['Words', 'Learn the meaning of every word, then test yourself'], ['Meaning', 'Read the translation, and an explanation when you want depth'], ['Reflect', 'Write one line about what it means to you']]
        .map(([a, b], k) => `<div class="pitem" style="grid-template-columns:28px 1fr"><span class="ck">${k + 1}</span><span><b>${a}</b><br><span class="muted" style="font-size:.84rem">${b}</span></span></div>`).join('')}
    </div>
    <p class="muted" style="font-size:.9rem">About ten minutes a day. Consistency matters more than speed.</p>
    <span class="eyebrow">Choose where to start</span>
    <button class="btn primary full" data-start="prayer">Prayer Surahs first</button>
    <button class="btn ghost full" data-start="journey">The full Quran in order</button>
  </div>`, sh => {
    $$('[data-start]', sh).forEach(b => b.onclick = () => { S.track = b.dataset.start; S.onboard = true; save(); closeSheet(); renderToday(); });
  });
}

/* ---------- MAP ---------- */
let mapFilter = 'all';
function renderMap() {
  const fs = [['all', 'All 114'], ['progress', 'In progress'], ['done', 'Completed'], ['M', 'Makki'], ['D', 'Madani']];
  const items = SURAHS.map((_, k) => k + 1).filter(s => {
    const d = surahDone(s), K = BY_SURAH[s].length;
    return mapFilter === 'all' || (mapFilter === 'progress' && d > 0 && d < K) || (mapFilter === 'done' && d === K) || sur(s).place === mapFilter;
  });
  const surahsDone = SURAHS.filter((_, k) => surahDone(k + 1) === BY_SURAH[k + 1].length).length;
  app.innerHTML = `<main class="page stack">
    <header class="stack fade" style="gap:8px"><span class="eyebrow">The Quran map</span><h1>Your journey so far</h1>
      <p class="muted">${doneCount()} of 556 passages · ${pctQuran()}% of ayahs · ${surahsDone} surah${surahsDone === 1 ? '' : 's'} complete</p>
      <div class="bar" style="margin-top:6px"><i style="width:${(ayahsDone() / TOTAL_AYAHS * 100).toFixed(2)}%"></i></div></header>
    <div class="filters fade">${fs.map(([k, l]) => `<button class="chip ${mapFilter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="legend fade"><span><i style="background:var(--makki)"></i>Makki</span><span><i style="background:var(--madani)"></i>Madani</span><span><i style="background:var(--gold)"></i>Studied</span></div>
    ${items.length ? `<div class="grid fade">${items.map(s => {
      const x = sur(s), d = surahDone(s), K = BY_SURAH[s].length, p = d / K;
      return `<button class="tile ${p === 1 ? 'full' : p > 0 ? 'part' : ''}" data-s="${s}" style="--c:var(${x.place === 'M' ? '--makki' : '--madani'})" aria-label="${esc(x.name)}">
        <span class="n">${s}<i></i></span><span class="ar">${esc(x.ar)}</span><span class="en">${esc(x.name)}</span>
        <span class="fill"><i style="width:${(p * 100).toFixed(0)}%"></i></span></button>`;
    }).join('')}</div>` : `<div class="empty"><p>Nothing here yet.</p></div>`}
  </main>`;
  $$('[data-f]').forEach(b => b.onclick = () => { mapFilter = b.dataset.f; renderMap(); });
  $$('[data-s]').forEach(b => b.onclick = () => openSurah(+b.dataset.s));
}

function openSurah(s) {
  const x = sur(s), list = BY_SURAH[s];
  const sh = openSheet(`<div class="stack" style="gap:18px">
    <div class="head"><div><span class="eyebrow">Surah ${s}</span><h2>${esc(x.name)}</h2><span class="muted">${esc(x.en)}</span></div><div class="ar">${esc(x.ar)}</div></div>
    <div class="facts"><span class="pill">${x.place === 'M' ? 'Makki' : 'Madani'}</span><span class="pill plain">${x.ayahs} ayahs</span><span class="pill plain">${list.length} passage${list.length > 1 ? 's' : ''}</span><span class="pill plain">Revealed #${x.order}</span></div>
    <div class="stack" style="gap:10px"><span class="eyebrow">About this surah</span><div id="about"><div class="skel" style="height:90px"></div></div></div>
    <div class="stack" style="gap:10px"><span class="eyebrow">Passages · ${surahDone(s)} of ${list.length} studied</span><div class="plist">
      ${list.map(i => { const r = RUKUS[i - 1], d = isDone(i); return `<button class="pitem ${d ? 'done' : ''}" data-i="${i}">
        <span class="ck">${d ? I.check : r.k}</span><span><b>${r.from === r.to ? 'Ayah ' + r.from : 'Ayahs ' + r.from + '–' + r.to}</b><br><span class="muted" style="font-size:.8rem">${r.ayahs} ayah${r.ayahs > 1 ? 's' : ''}${d ? ' · studied' : ''}</span></span>
        <span class="go">${d ? 'Review' : 'Study'}</span></button>`; }).join('')}</div></div>
  </div>`);
  $$('[data-i]', sh).forEach(b => b.onclick = () => { closeSheet(); startSession(+b.dataset.i); });
  getInfo(s).then(info => {
    const el = $('#about', sh); if (!el) return;
    el.innerHTML = `<p class="prose" style="margin:0">${esc(cleanText(info.short_text))}</p>
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="credit">${esc(info.source || '')}</span><button class="link" id="more">Full introduction</button></div>`;
    $('#more', el).onclick = () => { el.innerHTML = ''; const p = sanitize(info.text); p.className = 'prose'; el.appendChild(p); const c = document.createElement('p'); c.className = 'credit'; c.textContent = info.source || ''; el.appendChild(c); };
  }).catch(() => { const el = $('#about', sh); if (el) el.innerHTML = '<p class="muted">Introduction unavailable offline.</p>'; });
}

/* ---------- SESSION ---------- */
let sess = null;
function startSession(i) {
  stopAudio(); closeSheet();
  sess = { i, r: RUKUS[i - 1], step: 0, seen: 0, verses: null, err: null, quiz: null, tafOpen: {} };
  document.body.classList.add('in-session');
  renderSession();
  getPassage(i).then(v => { if (sess && sess.i === i) { sess.verses = v; renderSession(true); } })
    .catch(e => { if (sess && sess.i === i) { sess.err = e; renderSession(true); } });
}
function leaveSession() { stopAudio(); sess = null; go('today'); }

function renderSession(keepScroll) {
  const { r, step } = sess, s = sur(r.s);
  app.innerHTML = `<div class="session">
    <header class="s-top"><div class="in">
      <div class="row1"><button class="iconbtn" id="x" aria-label="Close">${I.close}</button>
        <div class="s-title"><b>${esc(s.name)}</b><span>${r.from === r.to ? 'Ayah ' + r.from : 'Ayahs ' + r.from + '–' + r.to}</span></div>
        <span style="width:40px"></span></div>
      <nav class="steps">${STEPS.map((l, k) => `<button data-step="${k}" class="${k === step ? 'on' : k <= sess.seen ? 'seen' : ''}"><i></i>${l}</button>`).join('')}</nav>
    </div></header>
    <section class="s-body fade" id="sbody"></section>
    <footer class="s-foot"><div class="in">
      <button class="btn ghost" id="prev" ${step === 0 ? 'disabled' : ''} aria-label="Back">${I.back}</button>
      <button class="btn primary" id="next">${NEXT_LABEL[step]}</button>
    </div></footer></div>`;
  $('#x').onclick = leaveSession;
  $('#prev').onclick = () => setStep(step - 1);
  $('#next').onclick = () => step < 4 ? setStep(step + 1) : complete();
  $$('[data-step]').forEach(b => b.onclick = () => { const k = +b.dataset.step; if (k <= sess.seen + 1) setStep(k); });
  const body = $('#sbody');
  if (step > 0 && !sess.verses) {
    body.innerHTML = sess.err ? errBox() : `<div class="loading">${'<div class="skel" style="height:64px"></div>'.repeat(4)}</div>`;
    if (sess.err) $('#retry').onclick = () => startSession(sess.i);
    return;
  }
  [stepIntro, stepListen, stepWords, stepMeaning, stepReflect][step](body);
  if (!keepScroll) window.scrollTo(0, 0);
}
function errBox() { return `<div class="err">${STAR.replace('<svg', '<svg style="width:46px;height:46px;color:var(--gold);opacity:.6"')}<p>Couldn't load this passage. Check your connection and try again.</p><button class="btn ghost" id="retry">Try again</button></div>`; }
function setStep(k) {
  if (k < 0 || k > 4) return;
  if (sess.step === 4) saveDraft();
  stopAudio(); $('#toast').classList.remove('show'); sess.step = k; sess.seen = Math.max(sess.seen, k); renderSession();
}

function stepIntro(body) {
  const { r } = sess, s = sur(r.s);
  const prevDone = BY_SURAH[r.s].filter(i => i < r.i && isDone(i));
  const lastRefl = [...S.refl].reverse().find(x => RUKUS[x.i - 1].s === r.s && x.i !== r.i);
  const continuing = r.k > 1;
  body.innerHTML = `<div class="stack">
    <div class="intro-name"><span class="eyebrow">Surah ${s.n} · ${s.place === 'M' ? 'Revealed in Makkah' : 'Revealed in Madinah'}</span>
      <div class="ar">${esc(s.ar)}</div><h2>${esc(s.name)}</h2><span class="muted">${esc(s.en)}</span></div>
    <div class="facts" style="justify-content:center"><span class="pill">${r.from === r.to ? 'Ayah ' + r.from : 'Ayahs ' + r.from + '–' + r.to}</span><span class="pill plain">Passage ${r.k} of ${r.K}</span><span class="pill plain">${s.ayahs} ayahs in the surah</span></div>
    <div class="ornament">${STAR}</div>
    ${continuing ? `<div class="recap"><span class="eyebrow">Continuing the surah</span><p class="muted" style="font-size:.92rem">You have studied ${prevDone.length} of the ${r.k - 1} passage${r.k - 1 > 1 ? 's' : ''} before this one.</p>
      ${lastRefl ? `<div class="quote" style="margin-top:6px"><span class="q">Your reflection on ${esc(ref(RUKUS[lastRefl.i - 1]))}</span><span class="a">${esc(lastRefl.t.length > 200 ? lastRefl.t.slice(0, 200) + '…' : lastRefl.t)}</span></div>` : ''}</div>` : ''}
    <div class="stack" style="gap:10px"><span class="eyebrow">About this surah</span><div id="about"><div class="skel" style="height:110px"></div></div></div>
    <p class="intent">Read slowly. The aim is to understand,<br>not to finish.</p>
  </div>`;
  getInfo(r.s).then(info => {
    const el = $('#about'); if (!el) return;
    el.innerHTML = `<p class="prose ${continuing ? 'clamp' : ''}" id="short" style="margin:0">${esc(cleanText(info.short_text))}</p>
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="credit">${esc(info.source || '')}</span><button class="link" id="more">Full introduction</button></div>`;
    $('#more').onclick = () => openSheet(`<div class="stack" style="gap:14px"><span class="eyebrow">Introduction</span><h2>${esc(s.name)}</h2><div id="full"></div><p class="credit">${esc(info.source || '')}</p></div>`,
      sh => { const p = sanitize(info.text); p.className = 'prose'; $('#full', sh).appendChild(p); });
  }).catch(() => { const el = $('#about'); if (el) el.innerHTML = '<p class="muted">The introduction will appear when you are online.</p>'; });
}

function bismillahFor(r) { return r.from === 1 && r.s !== 1 && r.s !== 9; }

function stepListen(body) {
  const v = sess.verses, rname = nameOf(RECITERS, S.set.rec);
  body.innerHTML = `<div class="stack">
    <div class="player"><button class="playbtn" id="pp" aria-label="Play">${I.play}</button>
      <div class="info"><b id="pstat">Listen to the passage</b><span>${esc(rname)}</span></div>
      <button class="speed" id="spd">${S.set.speed}×</button></div>
    <div class="mushaf">
      ${bismillahFor(sess.r) ? '<div class="bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>' : ''}
      <div class="ayat">${v.map((a, k) => `<span class="ayah" data-k="${k}">${esc(a.ar)}</span><span class="num">${arNum(a.n)}</span> `).join('')}</div>
    </div>
    <p class="tip">Tap any ayah to play from there. Follow the words with your eyes as you listen.</p>
  </div>`;
  const list = v.map(a => ({ src: a.audio }));
  const sync = () => {
    const playing = A.idx >= 0;
    $('#pp').innerHTML = playing && !player.paused ? I.pause : I.play;
    $$('.ayah').forEach(e => e.classList.toggle('playing', +e.dataset.k === A.idx));
    $('#pstat').textContent = playing ? `Ayah ${v[A.idx].n} of ${v[v.length - 1].n}` : 'Listen to the passage';
    const cur = $(`.ayah[data-k="${A.idx}"]`); if (cur) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  A.onChange = sync;
  player.onpause = player.onplay = () => sess && sess.step === 1 && sync();
  $('#pp').onclick = () => {
    if (A.idx >= 0) { if (player.paused) player.play().catch(() => {}); else player.pause(); sync(); }
    else playQueue(list, 0);
  };
  $$('.ayah').forEach(e => e.onclick = () => playQueue(list, +e.dataset.k));
  $('#spd').onclick = () => {
    const sp = [0.75, 1, 1.25]; S.set.speed = sp[(sp.indexOf(S.set.speed) + 1) % sp.length]; save();
    player.playbackRate = S.set.speed; $('#spd').textContent = S.set.speed + '×';
  };
}

function stepWords(body) {
  const v = sess.verses;
  const total = v.reduce((n, a) => n + a.words.length, 0);
  body.innerHTML = `<div class="stack">
    <div class="stack" style="gap:6px"><span class="eyebrow">Word by word</span><h2>${total} words in this passage</h2>
      <p class="muted" style="font-size:.92rem">Tap a word to hear it. Many Quranic words repeat often, so each one you learn here returns again and again.</p></div>
    ${v.map((a, k) => `<div class="wayah"><div class="lab"><span class="eyebrow">Ayah ${a.n}</span><span class="ln"></span><button class="mini" data-pa="${k}">${I.play}Play</button></div>
      <div class="words">${a.words.map((w, j) => `<button class="word" data-w="${k}:${j}"><span class="wa">${esc(w.ar)}</span>${S.set.translit && w.tl ? `<span class="wt">${esc(w.tl)}</span>` : ''}<span class="wm">${esc(w.m)}</span></button>`).join('')}</div></div>`).join('')}
    <div id="quizbox"></div>
  </div>`;
  $$('[data-w]').forEach(b => b.onclick = () => {
    const [k, j] = b.dataset.w.split(':').map(Number);
    $$('.word.on').forEach(e => e.classList.remove('on')); b.classList.add('on');
    playWord(v[k].words[j].au);
  });
  $$('[data-pa]').forEach(b => b.onclick = () => playQueue([{ src: v[+b.dataset.pa].audio }]));
  A.onChange = null;
  renderQuiz();
}

function buildQuiz() {
  const seen = new Set(), pool = [];
  sess.verses.forEach(a => a.words.forEach(w => { const m = w.m.trim().toLowerCase(); if (m && !seen.has(m)) { seen.add(m); pool.push(w); } }));
  if (pool.length < 4) return null;
  return { qs: shuffle(pool).slice(0, Math.min(5, pool.length)).map(w => ({ w, opts: shuffle([w, ...shuffle(pool.filter(x => x !== w)).slice(0, 3)]) })), at: 0, res: [], lock: false, started: false };
}
function renderQuiz() {
  const box = $('#quizbox'); if (!box) return;
  if (!sess.quiz) sess.quiz = buildQuiz();
  const Q = sess.quiz;
  if (!Q) { box.innerHTML = ''; return; }
  const dots = `<div class="dots">${Q.qs.map((_, k) => `<i class="${Q.res[k] === true ? 'ok' : Q.res[k] === false ? 'no' : k === Q.at && Q.started ? 'cur' : ''}"></i>`).join('')}</div>`;
  if (!Q.started) {
    box.innerHTML = `<div class="quiz"><span class="eyebrow gold">Test yourself</span><h3>${Q.qs.length} quick questions on today's words</h3><button class="btn primary" id="qs">Start</button></div>`;
    $('#qs').onclick = () => { Q.started = true; renderQuiz(); }; return;
  }
  if (Q.at >= Q.qs.length) {
    const sc = Q.res.filter(Boolean).length;
    box.innerHTML = `<div class="quiz">${dots}<h3 style="text-align:center">${sc} of ${Q.qs.length}${sc === Q.qs.length ? ' — excellent, mashaAllah' : sc >= Q.qs.length - 1 ? ' — very good' : ' — they will stick with time'}</h3><button class="btn ghost" id="qr">Try new questions</button></div>`;
    $('#qr').onclick = () => { sess.quiz = buildQuiz(); sess.quiz.started = true; renderQuiz(); }; return;
  }
  const q = Q.qs[Q.at];
  box.innerHTML = `<div class="quiz">${dots}<span class="eyebrow" style="text-align:center">What does this word mean?</span>
    <div class="qw">${esc(q.w.ar)}</div><div class="opts">${q.opts.map((o, k) => `<button class="opt" data-o="${k}">${esc(o.m)}</button>`).join('')}</div></div>`;
  playWord(q.w.au);
  $$('[data-o]', box).forEach(b => b.onclick = () => {
    if (Q.lock) return; Q.lock = true;
    const pick = q.opts[+b.dataset.o], ok = pick === q.w;
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok) $$('[data-o]', box)[q.opts.indexOf(q.w)].classList.add('right');
    Q.res[Q.at] = ok;
    setTimeout(() => { Q.at++; Q.lock = false; renderQuiz(); }, ok ? 800 : 1500);
  });
}

function stepMeaning(body) {
  const v = sess.verses, trName = nameOf(TRANSLATIONS, S.set.tr), tf = TAFSIRS.find(t => t[0] === S.set.taf) || TAFSIRS[0];
  body.innerHTML = `<div class="stack" style="gap:8px">
    <div class="stack" style="gap:6px"><span class="eyebrow">Meaning</span><h2>What the passage says</h2>
      <p class="muted" style="font-size:.9rem">${esc(trName)}. Tap <b>Explain</b> under any ayah for ${esc(tf[1])}.</p></div>
    <div>${v.map((a, k) => `<article class="mv" data-mv="${k}">
      <div class="mar">${esc(a.ar)} <span class="num">${arNum(a.n)}</span></div>
      <p class="mtr"><span class="k">${a.n}</span>${esc(a.tr)}</p>
      <div class="tools"><button class="mini" data-pa="${k}">${I.play}Listen</button><button class="mini" data-ex="${k}">${I.book.replace('<svg', '<svg width="13" height="13"')}Explain</button></div>
      <div class="exbox"></div></article>`).join('')}</div>
    <p class="credit" style="text-align:center;margin-top:10px">Translation: ${esc(trName)} · Explanation: ${esc(tf[1])} · via Quran.com</p>
  </div>`;
  A.onChange = null;
  $$('[data-pa]').forEach(b => b.onclick = () => playQueue([{ src: v[+b.dataset.pa].audio }]));
  $$('[data-ex]').forEach(b => b.onclick = () => toggleTafsir(+b.dataset.ex, b));
  // reopen any explanations opened earlier in this session
  Object.keys(sess.tafOpen).forEach(k => toggleTafsir(+k, $(`[data-ex="${k}"]`), true));
}

async function toggleTafsir(k, btn, reopen) {
  const v = sess.verses[k], box = $(`[data-mv="${k}"] .exbox`);
  if (!box) return;
  if (box.firstChild && !reopen) { box.innerHTML = ''; btn.classList.remove('on'); delete sess.tafOpen[k]; return; }
  // already covered by an open explanation of a neighbouring ayah?
  for (const j of Object.keys(sess.tafOpen)) {
    if (+j !== k && sess.tafOpen[j].includes(v.key)) {
      const target = $(`[data-mv="${j}"] .tafsir`); if (target && !reopen) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); toast(`Explained together with ayah ${sess.verses[j].n}`); } return;
    }
  }
  btn.classList.add('on');
  box.innerHTML = '<div class="skel" style="height:120px"></div>';
  try {
    const t = await getTafsir(v.key);
    const keys = Object.keys(t.verses || { [v.key]: 1 });
    sess.tafOpen[k] = keys;
    const nums = keys.map(x => +x.split(':')[1]);
    const range = nums.length > 1 ? `Ayahs ${Math.min(...nums)}–${Math.max(...nums)}` : `Ayah ${v.n}`;
    const tf = TAFSIRS.find(x => x[0] === S.set.taf) || TAFSIRS[0];
    const text = (t.text || '').trim();
    box.innerHTML = `<div class="tafsir ${text.length > 2400 ? 'long' : ''}"><div class="th"><span class="eyebrow gold">${esc(tf[1])}</span><span class="eyebrow">${range}</span></div><div class="pbox"></div>
      ${text.length > 2400 ? '<button class="link rm" style="margin:8px 0 12px">Read more</button>' : ''}</div>`;
    const p = text ? sanitize(text) : Object.assign(document.createElement('p'), { textContent: 'This ayah is explained together with the ayahs around it.' });
    p.classList.add('prose'); $('.pbox', box).appendChild(p);
    const rm = $('.rm', box); if (rm) rm.onclick = () => { const tb = $('.tafsir', box); tb.classList.toggle('open'); rm.textContent = tb.classList.contains('open') ? 'Show less' : 'Read more'; };
  } catch (e) {
    box.innerHTML = '<p class="muted" style="font-size:.9rem;padding:4px 0">Explanation unavailable right now. Check your connection.</p>';
    btn.classList.remove('on');
  }
}

function stepReflect(body) {
  const { i } = sess, prompt = PROMPTS[(i - 1) % PROMPTS.length];
  const existing = S.refl.find(x => x.i === i);
  const draft = S.drafts[i] ?? existing?.t ?? '';
  body.innerHTML = `<div class="stack">
    <div class="ornament">${STAR}</div>
    <span class="eyebrow" style="text-align:center">Reflect</span>
    <p class="prompt">${esc(prompt)}</p>
    <textarea class="journal" id="jt" placeholder="Write freely. Even one line helps it stay with you.">${esc(draft)}</textarea>
    <p class="tip">Your reflection is saved on this phone, in your Journal.${existing ? ' You wrote about this passage before. Editing updates it.' : ''}</p>
  </div>`;
  A.onChange = null;
  const ta = $('#jt');
  ta.oninput = () => { S.drafts[i] = ta.value; save(); };
}
function saveDraft() { const ta = $('#jt'); if (ta && sess) { S.drafts[sess.i] = ta.value; save(); } }

function complete() {
  const { i, r } = sess, ta = $('#jt'), text = (ta ? ta.value : '').trim();
  const firstTime = !isDone(i);
  const today = dayKey();
  if (firstTime) S.done[i] = today;
  S.days[today] = (S.days[today] || 0) + 1;
  if (text) {
    const ex = S.refl.find(x => x.i === i);
    if (ex) { ex.t = text; ex.edited = new Date().toISOString(); }
    else S.refl.push({ i, d: new Date().toISOString(), q: PROMPTS[(i - 1) % PROMPTS.length], t: text });
  }
  delete S.drafts[i];
  save(); stopAudio(); $('#toast').classList.remove('show');
  const s = sur(r.s), sd = surahDone(r.s), K = BY_SURAH[r.s].length, nx = nextIn(S.track);
  const surahComplete = sd === K;
  layer.innerHTML = `<div class="celebrate"><div class="in">
    <svg class="burst" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.6"><g class="core"><rect x="21" y="21" width="58" height="58" rx="2"/><rect x="21" y="21" width="58" height="58" rx="2" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="13" fill="currentColor" opacity=".25"/></g></svg>
    <span class="eyebrow gold">${surahComplete ? 'Surah complete' : 'Passage complete'}</span>
    <h1>${surahComplete ? `You have studied all of ${esc(s.name)}` : 'Alhamdulillah'}</h1>
    <p class="muted">${esc(ref(r))}${text ? ' · reflection saved' : ''}</p>
    <div class="stats"><div class="stat g"><b>${doneCount()}</b><span>passages</span></div><div class="stat"><b>${pctQuran()}%</b><span>of the Quran</span></div><div class="stat"><b>${sd}/${K}</b><span>of this surah</span></div></div>
    <div class="stack" style="gap:10px;width:100%">
      <button class="btn primary full" id="home">Back to Today</button>
      ${nx ? `<button class="btn ghost full" id="more">Next passage: ${esc(sur(RUKUS[nx - 1].s).name)}</button>` : ''}
    </div></div></div>`;
  $('#home').onclick = () => { closeSheet(); sess = null; go('today'); };
  $('#more') && ($('#more').onclick = () => { closeSheet(); startSession(nx); });
}

/* ---------- JOURNAL ---------- */
function renderJournal() {
  const list = [...S.refl].sort((a, b) => b.d.localeCompare(a.d));
  let lastMonth = '';
  app.innerHTML = `<main class="page stack">
    <header class="stack fade" style="gap:8px"><span class="eyebrow">Journal</span><h1>Your reflections</h1>
      <p class="muted">${list.length ? `${list.length} reflection${list.length > 1 ? 's' : ''} across ${new Set(list.map(x => RUKUS[x.i - 1].s)).size} surah${new Set(list.map(x => RUKUS[x.i - 1].s)).size > 1 ? 's' : ''}` : 'What the Quran has meant to you, in your own words.'}</p></header>
    ${list.length ? list.map(x => {
      const d = new Date(x.d), m = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const head = m !== lastMonth ? `<div class="month">${esc(m)}</div>` : ''; lastMonth = m;
      return `${head}<article class="entry fade"><div class="eh"><span class="ref">${esc(ref(RUKUS[x.i - 1]))}</span><span>${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>
        <span class="eq">${esc(x.q)}</span><p class="et">${esc(x.t)}</p><div><button class="link" data-open="${x.i}">Open passage</button></div></article>`;
    }).join('') : `<div class="empty fade">${STAR}<p>Your first reflection will appear here after today's passage.</p></div>`}
    <section class="card stack fade" style="gap:12px"><span class="eyebrow">Keep your journal safe</span>
      <p class="muted" style="font-size:.9rem">Your progress and reflections live on this phone only. Save a backup now and then.</p>
      <div class="row"><button class="btn ghost" style="flex:1" id="bk">Save backup</button><button class="btn ghost" style="flex:1" id="rs">Restore</button></div>
      <input type="file" id="rf" accept="application/json,.json" hidden></section>
  </main>`;
  $$('[data-open]').forEach(b => b.onclick = () => startSession(+b.dataset.open));
  $('#bk').onclick = backup;
  $('#rs').onclick = () => $('#rf').click();
  $('#rf').onchange = e => restore(e.target.files[0]);
}
function backup() {
  const data = JSON.stringify({ app: 'tadabbur', v: 1, at: new Date().toISOString(), state: S }, null, 1);
  try {
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `tadabbur-backup-${dayKey()}.json` });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Backup saved');
  } catch (e) {
    navigator.clipboard?.writeText(data).then(() => toast('Backup copied to clipboard'), () => toast('Backup failed'));
  }
}
function restore(file) {
  if (!file) return;
  file.text().then(async txt => {
    const j = JSON.parse(txt);
    if (j.app !== 'tadabbur' || !j.state) throw new Error('bad');
    if (!(await confirmDialog('Restore this backup?', `It replaces what is on this phone with the backup from ${new Date(j.at).toLocaleDateString('en-GB')}.`, 'Restore'))) return;
    S = { ...JSON.parse(JSON.stringify(DEF)), ...j.state, set: { ...DEF.set, ...(j.state.set || {}) } };
    save(); applySettings(); renderJournal(); toast('Backup restored');
  }).catch(() => toast('That file is not a Tadabbur backup'));
}

/* ---------- SETTINGS ---------- */
function renderSettings() {
  const sel = (id, list, val) => `<select id="${id}">${list.map(([k, l]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  app.innerHTML = `<main class="page stack">
    <header class="stack fade" style="gap:8px"><span class="eyebrow">Settings</span><h1>Make it yours</h1></header>
    <section class="stack fade" style="gap:10px"><span class="eyebrow">Reading</span><div class="set">
      <div class="it"><span class="l">Theme<small>Night, or warm paper</small></span><div class="seg" id="theme">${[['night', 'Night'], ['parchment', 'Parchment']].map(([k, l]) => `<button data-v="${k}" class="${S.set.theme === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="it" style="flex-direction:column;align-items:stretch;gap:6px"><span class="l">Arabic text size</span><input type="range" id="scale" min="0.8" max="1.5" step="0.05" value="${S.set.scale}">
        <div class="preview">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</div></div>
      <div class="it"><span class="l">Transliteration<small>Show pronunciation under each word</small></span><button class="switch ${S.set.translit ? 'on' : ''}" id="tl" aria-label="Transliteration"></button></div>
    </div></section>
    <section class="stack fade" style="gap:10px"><span class="eyebrow">Meaning</span><div class="set">
      <div class="it"><span class="l">Translation</span>${sel('tr', TRANSLATIONS, S.set.tr)}</div>
      <div class="it"><span class="l">Explanation<small id="tfd">${esc((TAFSIRS.find(t => t[0] === S.set.taf) || TAFSIRS[0])[2])}</small></span>${sel('taf', TAFSIRS, S.set.taf)}</div>
    </div></section>
    <section class="stack fade" style="gap:10px"><span class="eyebrow">Recitation</span><div class="set">
      <div class="it"><span class="l">Reciter</span>${sel('rec', RECITERS, S.set.rec)}</div>
      <div class="it"><span class="l">Speed</span><div class="seg" id="speed">${[0.75, 1, 1.25].map(v => `<button data-v="${v}" class="${S.set.speed === v ? 'on' : ''}">${v}×</button>`).join('')}</div></div>
    </div></section>
    <section class="stack fade" style="gap:10px"><span class="eyebrow">Progress</span><div class="set">
      <div class="it"><span class="l">Passages studied<small>${doneCount()} of 556 · ${S.refl.length} reflections</small></span></div>
      <div class="it"><button class="danger" id="reset" style="font-weight:600">Reset all progress</button></div>
    </div></section>
    <section class="card stack fade" style="gap:10px"><span class="eyebrow">About</span>
      <p class="prose" style="margin:0;font-size:.95rem">Tadabbur means reflecting deeply on the Quran. One passage a day, understood well, builds into the whole Quran over time.</p>
      <p class="credit" style="font-style:normal">Arabic text, word-by-word meanings, translations, explanations and recitations are provided live by the Quran.com API (Quran Foundation). Surah introductions are from Tafhim al-Qur'an by Sayyid Abul A'la Maududi, via Quran.com. Passage divisions follow Tanzil.</p></section>
  </main>`;
  $$('#theme button').forEach(b => b.onclick = () => { S.set.theme = b.dataset.v; save(); applySettings(); renderSettings(); });
  $('#scale').oninput = e => { S.set.scale = +e.target.value; applySettings(); };
  $('#scale').onchange = save;
  $('#tl').onclick = () => { S.set.translit = !S.set.translit; save(); $('#tl').classList.toggle('on', S.set.translit); };
  $('#tr').onchange = e => { S.set.tr = +e.target.value; save(); toast('Translation updated'); };
  $('#taf').onchange = e => { S.set.taf = +e.target.value; save(); $('#tfd').textContent = (TAFSIRS.find(t => t[0] === S.set.taf) || TAFSIRS[0])[2]; };
  $('#rec').onchange = e => { S.set.rec = +e.target.value; save(); toast('Reciter updated'); };
  $$('#speed button').forEach(b => b.onclick = () => { S.set.speed = +b.dataset.v; save(); $$('#speed button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#reset').onclick = async () => {
    if (await confirmDialog('Reset all progress?', 'This removes every studied passage and every reflection on this phone. It cannot be undone. Save a backup first if you want to keep them.', 'Reset', true)) {
      const set = S.set; S = JSON.parse(JSON.stringify(DEF)); S.set = set; S.onboard = true; save(); renderSettings(); toast('Progress reset');
    }
  };
}

/* ---------- boot ---------- */
applySettings();
go('today');
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
