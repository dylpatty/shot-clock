/* Courtside, the Social tab: the NBA conversation from Reddit's r/nba and X in one view-only feed, colour-coded by source
   and ranked by the site's own "heat" score. Posts come from .github/workflows/highlights.yml (social.json for the last
   day, social-archive.json for the week and season); nothing here can post, like or reply. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui, st = UI.st;
const { esc } = NBA;
const V = NBA.views;
const RAW = 'https://raw.githubusercontent.com/dylpatty/shot-clock/highlights/';
st.soc = st.soc || { sort: 'foryou', range: 'day', type: 'all', src: 'all', focus: '', limit: 30, shown: [], key: '', pending: [], open: {} };
const S = st.soc;

/* ---------- sources ---------- */
const ICON = {
  reddit: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="11.6" r="6.4" fill="currentColor"/><circle cx="15.4" cy="3.9" r="1.5" fill="currentColor"/><path d="M10 5.3 11.3 2l4.1 1.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7.6" cy="11.2" r="1.15" fill="var(--sp-cut)"/><circle cx="12.4" cy="11.2" r="1.15" fill="var(--sp-cut)"/><path d="M7.5 14c1.6 1.1 3.4 1.1 5 0" fill="none" stroke="var(--sp-cut)" stroke-width="1.1" stroke-linecap="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.2 2.3h3.3l-7.2 8.3 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.7l7.7-8.8L1.3 2.3h6.8l4.7 6.2zm-1.2 17.5h1.8L7.1 4.1h-2z" fill="currentColor"/></svg>',
};
const SRC = {
  reddit: { name: 'Reddit', tag: 'r/nba', open: 'Open on Reddit' },
  x: { name: 'X', tag: '', open: 'Open on X' },
};
const STAT = {
  up: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5 3 8.2h3.1V13h3.8V8.2H13z" fill="currentColor"/></svg>',
  heart: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.6S2.2 10 2.2 6.1A2.9 2.9 0 0 1 8 4.6a2.9 2.9 0 0 1 5.8 1.5C13.8 10 8 13.6 8 13.6z" fill="currentColor"/></svg>',
  reply: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3.5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7.5L4.6 14v-2.5H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  repost: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 5.5h7v3M11.5 10.5h-7v-3M9.6 3.6l1.9 1.9-1.9 1.9M6.4 12.4l-1.9-1.9 1.9-1.9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  views: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.6 8S4 3.6 8 3.6 14.4 8 14.4 8 12 12.4 8 12.4 1.6 8 1.6 8z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.8 8z" fill="currentColor"/></svg>',
  refresh: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.7h-3.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/* ---------- data ---------- */
// The last day's posts, refreshed by the job every 10 minutes (raw.githubusercontent.com caches 5)
NBA.def('social', 3 * 60000, () => NBA.getJSON(RAW + 'social.json').catch(e => { if (e.message === 'HTTP 404') return { items: [] }; throw e; }));
// The week's and season's biggest posts, kept by the same job
NBA.def('socarch', 30 * 60000, () => NBA.getJSON(RAW + 'social-archive.json').catch(e => { if (e.message === 'HTTP 404') return { week: [], season: [] }; throw e; }));
const DAY = 864e5;

// Engagement on one scale per source, from each site's real counts: upvotes and comments on Reddit; likes, reposts,
// replies and quotes on X. Comments count extra, since a post people argue about is a conversation, not just a
// scroll-by. A Reddit post's score is only real 4 hours in (sf), so until then its live comment count stands in; game
// threads' play-by-play comments count for little. Same yardstick as scripts/socialcore.js
function engagement(it) {
  const s = it.stats || {};
  if (it.src === 'reddit') { const c = (s.replies || 0) * (/game thread/i.test(it.flair || '') ? 0.15 : 1); return (it.sf ? (s.up || 0) : 4 * c) + 3 * c; }
  return (s.likes || 0) + 2 * (s.reposts || 0) + 3 * (s.replies || 0) + 2 * (s.quotes || 0);
}
const isClip = it => (it.media || []).some(m => m.kind === 'video' || m.kind === 'embed');
// News: a reporter's scoop ("[Charania] ..." on r/nba, insiders on X; the job marks these) or a News flair
const NEWS_RE = /^\[(?:charania|shams|haynes|stein|wojnarowski|woj|fischer|scotto|amick|siegel|windhorst|spears|marks|vardon|slater|mcmenamin|youngmisuk|begley|bontemps|lowe|givony|townsend|lewenberg|medina|pincus|buha|vorkunov)\b/i;
const isNews = it => !!it.news || /^news$/i.test(it.flair || '') || NEWS_RE.test(it.title || '');
const isTake = it => !isClip(it) && !isNews(it) && (/discussion|opinion|serious|take/i.test(it.flair || '') || it.self || (it.src === 'x' && !(it.media || []).length));
const textOf = it => `${it.title || ''} ${it.text || ''}`;

/* ---------- who and what a post is about ---------- */
// Players by full name, and by last name when only one player has it ("Wembanyama", not "Williams"); a few first names
// people use alone. Built once per load of the players feed
let pIndex = null, pIndexFor = null;
const FIRST_ALONE = { giannis: 'Antetokounmpo', luka: 'Doncic', jokic: 'Jokic', wemby: 'Wembanyama', lebron: 'James', steph: 'Curry', sga: 'Gilgeous-Alexander', ant: 'Edwards', kd: 'Durant', ad: 'Davis', jimmy: 'Butler', cooper: 'Flagg', flagg: 'Flagg' };
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Last names that are everyday words ("Post Game Thread", "a green light") only count as the full name
// (and common first names: "James" is LeBron, but also James Harden)
const WORDS = new Set(['post', 'green', 'brown', 'white', 'black', 'young', 'holiday', 'love', 'hunter', 'bridges', 'king', 'price', 'wells', 'strong', 'house', 'bell', 'hill', 'hall', 'grant', 'hart', 'banks', 'fox', 'ball', 'wall', 'rose', 'cash', 'field', 'case', 'porter', 'mann', 'sharp', 'early', 'little', 'reed', 'christian', 'marshall', 'james', 'jordan', 'washington', 'hood', 'cook', 'ware', 'chef', 'walker', 'miller', 'martin', 'allen', 'scott', 'lee', 'payne', 'gordon', 'russell', 'turner', 'collins', 'carter', 'mitchell']);
function playerIndex() {
  const list = NBA.players() || [];
  if (pIndexFor === list && pIndex) return pIndex;
  const full = new Map(), last = new Map();
  list.forEach(p => {
    const f = fold(p.name), ln = f.split(' ').slice(-1)[0];
    full.set(f, p);
    if (ln.length > 3 && !WORDS.has(ln)) last.set(ln, last.has(ln) ? null : p);
  });
  Object.entries(FIRST_ALONE).forEach(([k, l]) => { const p = list.find(x => fold(x.name).endsWith(fold(l))); if (p) last.set(k, p); });
  pIndex = { full, last }; pIndexFor = list;
  return pIndex;
}
const tagMemo = new Map();
function tags(it) {
  const players = NBA.players();
  const m = tagMemo.get(it.id);
  if (m && m.for === players) return m;
  const text = ' ' + fold(textOf(it)).replace(/[^a-z0-9' -]/g, ' ') + ' ';
  const idx = playerIndex(), found = new Set();
  idx.full.forEach((p, name) => { if (text.includes(' ' + name + ' ') || text.includes(' ' + name + "'")) found.add(p); });
  text.split(/\s+/).forEach(w => { const p = idx.last.get(w.replace(/'s$/, '')); if (p) found.add(p); });
  const out = { for: players, players: [...found].slice(0, 4), teams: NBA.findTeams(textOf(it)).slice(0, 3) };
  tagMemo.set(it.id, out);
  return out;
}

/* ---------- the algorithm ---------- */
// A value's place among a list, 0 (lowest) to 1 (highest)
function percentiles(list, f) {
  const vals = list.map(f).sort((a, b) => a - b), n = vals.length;
  return x => { if (n < 2) return 0.5; let lo = 0, hi = n; const v = f(x); while (lo < hi) { const mid = (lo + hi) >> 1; if (vals[mid] < v) lo = mid + 1; else hi = mid; } return lo / (n - 1); };
}
/* Heat, the For You order. Each source's engagement is ranked against its own posts (an upvote isn't a like), half on
   how big it got and half on how fast; it cools with age; and it's nudged by what this site knows: your team, tonight's
   games, who's playing well, and that clips are the point of a feed like this */
function scorer(list) {
  const now = Date.now(), groups = {};
  list.forEach(it => { (groups[it.src] = groups[it.src] || []).push(it); });
  const big = {}, fast = {};
  const ageH = it => Math.max(0.25, (now - it.time) / 3600000);
  Object.entries(groups).forEach(([k, g]) => { big[k] = percentiles(g, engagement); fast[k] = percentiles(g, it => engagement(it) / Math.pow(ageH(it) + 1, 1.2)); });
  const day = NBA.data('day:'), mine = NBA.S.myTeam;
  const tonight = new Map();
  ((day && day.games) || []).forEach(g => [g.away.id, g.home.id].forEach(id => tonight.set(id, g)));
  const hot = new Set((NBA.topPlayers ? NBA.topPlayers(15) : []).map(x => x.p.id));
  return it => {
    const t = tags(it), h = ageH(it);
    const b = big[it.src](it), f = fast[it.src](it);
    let heat = (0.5 * b + 0.5 * f + 0.05) * (0.4 + 0.6 * Math.exp(-h / 14));
    if (isClip(it)) heat *= 1.25;
    if (isNews(it)) heat *= 1.15;
    if (t.teams.some(x => x.id === mine) || t.players.some(p => p.teamId === mine)) heat *= 1.35;
    const games = t.teams.map(x => tonight.get(x.id)).filter(Boolean);
    if (games.some(g => g.state === 'in')) heat *= 1.25; else if (games.length) heat *= 1.1;
    if (t.players.some(p => hot.has(p.id))) heat *= 1.1;
    if (/game thread/i.test(it.flair || '') && !/post/i.test(it.flair || '')) heat *= 0.55;
    return { heat, big: b, fast: f };
  };
}
// Mixes the order so the feed isn't one site or one account in a row: each pick is discounted by how many of the last
// three came from the same source and how often its author already appeared
function diversify(scored) {
  const left = scored.slice().sort((a, b) => b.s.heat - a.s.heat), out = [], authors = {};
  while (left.length) {
    let best = 0, bestV = -1;
    for (let i = 0; i < Math.min(left.length, 12); i++) {
      const it = left[i].it, recent = out.slice(-3).filter(x => x.it.src === it.src).length;
      const v = left[i].s.heat * Math.pow(0.82, recent) * Math.pow(0.7, authors[it.author && it.author.handle] || 0);
      if (v > bestV) { bestV = v; best = i; }
    }
    const pick = left.splice(best, 1)[0];
    const a = pick.it.author && pick.it.author.handle;
    if (a) authors[a] = (authors[a] || 0) + 1;
    out.push(pick);
  }
  return out;
}

// One copy of a post seen in two places (a tweet also on Reddit): the bigger one, noting the other
function dedupe(list) {
  const by = new Map();
  list.forEach(it => {
    // The same scoop posted twice on r/nba has the same title
    const k = it.dup || (it.src === 'reddit' && it.title ? 'rt:' + it.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : it.id), have = by.get(k);
    if (!have || engagement(it) > engagement(have)) by.set(k, Object.assign({}, it, { also: have ? [...(have.also || []), have.src] : it.also }));
    else if (have.src !== it.src) have.also = [...(have.also || []), it.src];
  });
  return [...by.values()];
}

function pool() {
  const day = NBA.use('social'), arch = S.sort === 'top' && S.range !== 'day' ? NBA.use('socarch') : null;
  const since = S.sort === 'top' ? { day: DAY, week: 7 * DAY, season: 400 * DAY }[S.range] : DAY;
  let list = (day && day.items) || [];
  if (arch) list = list.concat(arch[S.range] || []);
  const now = Date.now();
  list = dedupe(list.filter(it => it && it.id && SRC[it.src] && now - it.time < since));
  if (S.src !== 'all') list = list.filter(it => it.src === S.src);
  if (S.type === 'clips') list = list.filter(isClip);
  else if (S.type === 'takes') list = list.filter(isTake);
  else if (S.type === 'news') list = list.filter(isNews);
  if (S.focus) list = list.filter(it => { const t = tags(it); return S.focus[0] === 'p' ? t.players.some(p => 'p' + p.id === S.focus) : t.teams.some(x => 't' + x.id === S.focus); });
  return list;
}
function ranked() {
  const list = pool();
  const score = scorer(list);
  const scored = list.map(it => ({ it, s: score(it) }));
  if (S.sort === 'hot') return scored.sort((a, b) => b.s.fast - a.s.fast || b.it.time - a.it.time);
  if (S.sort === 'top') return scored.sort((a, b) => b.s.big - a.s.big || engagement(b.it) - engagement(a.it));
  return diversify(scored);
}

// Who's being talked about: players and teams by how many posts mention them, weighted by how big those posts are
function trending(list) {
  const p = new Map(), t = new Map();
  list.forEach(it => {
    const w = 1 + Math.log10(1 + engagement(it)), g = tags(it);
    g.players.forEach(x => p.set(x.id, { x, n: ((p.get(x.id) || {}).n || 0) + w, c: ((p.get(x.id) || {}).c || 0) + 1 }));
    g.teams.forEach(x => t.set(x.id, { x, n: ((t.get(x.id) || {}).n || 0) + w, c: ((t.get(x.id) || {}).c || 0) + 1 }));
  });
  return { players: [...p.values()].filter(v => v.c > 1).sort((a, b) => b.n - a.n).slice(0, 14), teams: [...t.values()].sort((a, b) => b.n - a.n).slice(0, 8) };
}

/* ---------- rendering ---------- */
const num = n => !n ? '0' : n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);
const ago = ms => { const m = Math.max(0, Math.round((Date.now() - ms) / 60000)); return m < 1 ? 'now' : m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : Math.round(m / 1440) + 'd'; };
// X's logo is its name, so its badge is the logo alone
const badge = src => `<span class="sp-badge sb-${src}${SRC[src].tag ? '' : ' solo'}" title="From ${esc(SRC[src].name)}">${ICON[src]}${SRC[src].tag ? `<span>${esc(SRC[src].tag)}</span>` : ''}</span>`;
const flames = s => { const n = Math.max(1, Math.min(5, Math.ceil(s.heatPct * 5))); return `<span class="sp-heat" title="Heat ${n} of 5" aria-label="Heat ${n} of 5">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`; };
const linkify = s => esc(s).replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (m, a, u) => `${a}<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 32)}${u.length > 40 ? '…' : ''}</a>`).replace(/\n/g, '<br>');

function avatar(it) {
  const a = it.author || {};
  const letter = (a.name || a.handle || '?').replace(/^(u\/|@)/, '').charAt(0).toUpperCase();
  if (a.avatar) return `<img class="sp-av" src="${esc(a.avatar)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-l="${esc(letter)}" data-src="sb-${it.src}">`;
  return `<span class="sp-av sp-av-l sb-${it.src}">${esc(letter)}</span>`;
}
function mediaHtml(it, hide) {
  const m = it.media || [];
  if (!m.length) {
    if (it.link && it.link.url) return `<a class="sp-link" href="${esc(it.link.url)}" target="_blank" rel="noopener">${it.link.thumb ? `<img src="${esc(it.link.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}<span><small>${esc(it.link.domain || '')}</small><b>${esc(it.link.title || it.link.url)}</b></span></a>`;
    return '';
  }
  const one = (x, i) => {
    const ar = x.w && x.h ? Math.max(0.56, Math.min(1.78, x.w / x.h)) : (x.kind === 'image' ? 1.25 : 16 / 9);
    const img = x.thumb ? `<img src="${esc(x.thumb)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="sp-noimg">${badge(it.src)}</span>`;
    const play = x.kind !== 'image' ? `<span class="sp-play" aria-hidden="true">${STAT.play}</span>${x.dur ? `<span class="sp-dur">${NBA.fmtDur(x.dur)}</span>` : ''}` : '';
    return `<button class="sp-m${hide ? ' blur' : ''}" style="--ar:${ar.toFixed(3)}" data-act="socplay" data-id="${esc(it.id)}" data-i="${i}" aria-label="${x.kind === 'image' ? 'View the picture' : 'Play the clip'}">${img}${play}</button>`;
  };
  const shown = m.slice(0, 4);
  return `<div class="sp-media n${shown.length}">${shown.map(one).join('')}${m.length > 4 ? `<span class="sp-more">+${m.length - 4}</span>` : ''}</div>`;
}
function gameChips(it) {
  const t = tags(it), day = NBA.data('day:');
  if (!day || !t.teams.length) return '';
  const games = day.games.filter(g => t.teams.some(x => x.id === g.away.id || x.id === g.home.id)).slice(0, 2);
  return games.map(g => {
    const hide = NBA.S.spoilers && !st.revealed.has(g.id);
    const s = g.state === 'pre' ? NBA.fmtTime(g.date) : g.state === 'in' ? (hide ? 'Live' : `${g.away.score}-${g.home.score} · ${NBA.detail(g)}`) : (hide ? 'Final' : `${g.away.score}-${g.home.score} · Final`);
    return `<button class="sp-game${g.state === 'in' ? ' live' : ''}" data-act="game" data-id="${g.id}">${g.state === 'in' ? '<i class="dot blink"></i>' : ''}${UI.logo(g.away, 16)}${esc(g.away.abbr)} @ ${UI.logo(g.home, 16)}${esc(g.home.abbr)}<span>${esc(s)}</span></button>`;
  }).join('');
}
function card(it, s) {
  const src = SRC[it.src], a = it.author || {}, st2 = it.stats || {};
  const hide = NBA.S.spoilers && !S.open[it.id] && (NBA.spoils(textOf(it)) || /post game/i.test(it.flair || ''));
  // Reddit's upvotes show once they're real (about 4 hours in); before that the live comment count is the number
  const stats = it.src === 'reddit'
    ? [[STAT.up, it.sf ? st2.up : null, 'upvotes'], [STAT.reply, st2.replies, 'comments']]
    : [[STAT.heart, st2.likes, 'likes'], [STAT.repost, st2.reposts, 'reposts'], [STAT.reply, st2.replies, 'replies'], [STAT.views, st2.views, 'views']];
  const body = `${it.title ? `<h4 class="sp-title">${esc(it.title)}</h4>` : ''}${it.text ? `<p class="sp-text${it.title ? ' sub' : ''}">${linkify(it.text.length > 420 ? it.text.slice(0, 400).replace(/\s+\S*$/, '') + '…' : it.text)}</p>` : ''}`;
  const reply = it.top && it.top.text && !hide ? `<div class="sp-reply"><b>${esc(it.top.author || 'Top reply')}</b> ${esc(it.top.text.length > 220 ? it.top.text.slice(0, 210).replace(/\s+\S*$/, '') + '…' : it.top.text)}${it.top.up ? `<span>${STAT.up}${num(it.top.up)}</span>` : ''}</div>` : '';
  return `<article class="sp sp-${it.src}" data-id="${esc(it.id)}">
    <div class="sp-top">${avatar(it)}<div class="sp-who"><b>${esc(a.name || a.handle || src.name)}${a.verified ? '<i class="sp-ver" title="Verified"></i>' : ''}</b>
      <small>${a.handle && a.handle !== a.name ? esc(a.handle) + ' · ' : ''}${ago(it.time)}${it.flair ? ` · <span class="sp-flair">${esc(it.flair)}</span>` : ''}</small></div>${badge(it.src)}</div>
    ${hide ? `<button class="sp-spoil" data-act="socspoil" data-id="${esc(it.id)}">This post might give away a result. <b>Show it</b></button>` : `<div class="sp-body">${body}</div>`}
    ${mediaHtml(it, hide)}${reply}
    ${gameChips(it) ? `<div class="sp-games">${gameChips(it)}</div>` : ''}
    <div class="sp-bar">${stats.filter(x => x[1] != null).map(([ic, v, l]) => `<span class="sp-st" title="${esc(num(v) + ' ' + l)}">${ic}${num(v)}</span>`).join('')}
      ${flames(s)}${it.also && it.also.length ? `<span class="sp-also">also on ${it.also.map(x => SRC[x] ? SRC[x].name : x).join(', ')}</span>` : ''}
      <a class="sp-open" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(src.open)} ↗</a></div></article>`;
}

const SORTS = [['foryou', 'For You'], ['hot', 'Hottest'], ['top', 'Top']];
const RANGES = [['day', 'Today'], ['week', 'This week'], ['season', 'This season']];
const TYPES = [['all', 'Everything'], ['clips', 'Clips'], ['takes', 'Takes'], ['news', 'News']];
V.social = () => {
  ['players', 'standings', 'day:'].forEach(k => NBA.use(k));
  const data = NBA.use('social'), err = NBA.status('social').err;
  if (S.sort === 'top' && S.range !== 'day') NBA.use('socarch');
  const all = ranked();
  // Percentile of heat among what's shown, for the flame meter
  const heats = all.map(x => x.s.heat).sort((a, b) => a - b);
  all.forEach(x => { const i = heats.indexOf(x.s.heat); x.s.heatPct = heats.length > 1 ? (i + 1) / heats.length : 0.6; });
  const byId = new Map(all.map(x => [x.it.id, x]));
  // The order on screen holds still while new posts arrive; they wait behind the "new posts" button
  const key = [S.sort, S.range, S.type, S.src, S.focus].join('|');
  if (key !== S.key || !S.shown.length) { S.key = key; S.shown = all.map(x => x.it.id); S.pending = []; }
  else {
    const have = new Set(S.shown);
    S.shown = S.shown.filter(id => byId.has(id));
    const fresh = all.filter(x => !have.has(x.it.id) && !S.pending.includes(x.it.id)).map(x => x.it.id);
    S.pending = S.pending.filter(id => byId.has(id)).concat(fresh);
  }
  const shown = S.shown.map(id => byId.get(id)).filter(Boolean);
  const today = ((data && data.items) || []).filter(it => SRC[it.src] && Date.now() - it.time < DAY);
  const counts = {}; today.forEach(it => { counts[it.src] = (counts[it.src] || 0) + 1; });
  const tr = trending(today);
  const live = ((NBA.data('day:') || {}).games || []).some(g => g.state === 'in');
  const upd = data && data.updated ? Date.parse(data.updated) : 0;
  const status = (data && data.status) || {};

  const head = `<div class="soc-head"><div><h2 class="soc-brand">Courtside</h2><p class="soc-tag">Today's NBA conversation from ${Object.keys(SRC).map(k => `<span class="soc-dot sd-${k}"></span>${SRC[k].name}`).join(' and ')}, ranked by heat</p></div>
    <div class="soc-live">${live ? '<span class="soc-pill live"><i class="dot blink"></i>Games live</span>' : ''}<span class="soc-pill">${today.length} posts today${upd ? ` · updated ${esc(ago(upd))} ago` : ''}</span>
      <button class="ib soc-refresh" data-act="socrefresh" aria-label="Refresh the feed" title="Refresh">${STAT.refresh}</button></div></div>`;
  const stories = tr.players.length ? `<div class="soc-stories" role="list" aria-label="Trending players">${tr.players.map(({ x, c }) => `<button role="listitem" class="soc-story${S.focus === 'p' + x.id ? ' on' : ''}" data-act="socfocus" data-v="p${esc(x.id)}" aria-pressed="${S.focus === 'p' + x.id}"><span class="ring">${UI.hs(x.headshot, 'hs', 160)}</span><b>${esc((x.name || '').split(' ').slice(-1)[0])}</b><small>${c} posts</small></button>`).join('')}</div>` : '';
  const seg = (list, cur, act, label) => `<div class="seg soc-seg" role="group" aria-label="${label}">${list.map(([k, l]) => `<button data-act="${act}" data-v="${k}" aria-pressed="${cur === k}">${l}</button>`).join('')}</div>`;
  const srcChips = `<div class="soc-srcs" role="group" aria-label="Sources"><button class="chip${S.src === 'all' ? ' on' : ''}" data-act="socsrc" data-v="all" aria-pressed="${S.src === 'all'}">All sources</button>${Object.keys(SRC).map(k => `<button class="chip soc-src sc-${k}${S.src === k ? ' on' : ''}" data-act="socsrc" data-v="${k}" aria-pressed="${S.src === k}" aria-label="${SRC[k].name}, ${counts[k] || 0} posts">${ICON[k]}${SRC[k].tag ? SRC[k].name : ''}<small>${counts[k] || 0}</small></button>`).join('')}</div>`;
  const focusName = S.focus ? (S.focus[0] === 'p' ? ((NBA.playerById(S.focus.slice(1)) || {}).name || 'this player') : (NBA.T(S.focus.slice(1)).full || 'this team')) : '';
  const filters = `<div class="soc-filters">${seg(SORTS, S.sort, 'socsort', 'Order')}${S.sort === 'top' ? seg(RANGES, S.range, 'socrange', 'Time range') : ''}
    <div class="soc-types">${TYPES.map(([k, l]) => `<button class="chip${S.type === k ? ' on' : ''}" data-act="soctype" data-v="${k}" aria-pressed="${S.type === k}">${l}</button>`).join('')}</div>${srcChips}
    ${S.focus ? `<div class="soc-focus">Only posts about <b>${esc(focusName)}</b><button class="chip" data-act="socfocus" data-v="">Clear</button></div>` : ''}</div>`;
  const about = { foryou: 'Ranked by heat: how big and how fast each post is growing against others from its site, cooling with age, with a lift for clips, news, your team and tonight\'s games. Sources are mixed so no one site or account takes over.', hot: 'Fastest-rising first: reactions per hour since posting.', top: `The most reacted-to posts ${S.range === 'day' ? 'of the last 24 hours' : S.range === 'week' ? 'of the last 7 days' : 'of the season'}, each against others from its own site.` }[S.sort];
  let feed;
  if (data === undefined && !err) feed = '<p class="loading">Loading the feed…</p>';
  else if (!shown.length) feed = `<p class="empty">${err ? "Couldn't load the feed. It will try again shortly." : S.focus || S.type !== 'all' || S.src !== 'all' ? 'Nothing matches these filters yet.' : S.sort === 'top' && S.range !== 'day' && !NBA.data('socarch') ? 'Loading…' : 'No posts yet. The feed fills in as the NBA world wakes up.'}</p>`;
  else feed = shown.slice(0, S.limit).map(x => card(x.it, x.s)).join('') + (shown.length > S.limit ? `<div class="soc-sentinel" aria-hidden="true"></div><button class="btn soc-moreb" data-act="socmore">Show more</button>` : `<p class="soc-end">You're all caught up.</p>`);
  const newPill = S.pending.length ? `<button class="soc-new" data-act="socnew">↑ ${S.pending.length} new post${S.pending.length > 1 ? 's' : ''}</button>` : '';
  const srcState = Object.keys(SRC).map(k => { const s = status[k] || {}; return `<li><span class="sp-badge sb-${k}">${ICON[k]}</span><b>${SRC[k].name}</b><small>${s.ok === false ? esc(s.note || 'Not reachable right now') : `${counts[k] || 0} posts today${s.at ? ' · checked ' + esc(ago(Date.parse(s.at))) + ' ago' : ''}`}</small></li>`; }).join('');
  const rail = `<aside class="soc-rail">
    ${tr.teams.length ? `<div class="card"><div class="card-h"><h3>Trending teams</h3></div><ol class="soc-trend">${tr.teams.map(({ x, c }, i) => `<li><button data-act="socfocus" data-v="t${esc(x.id)}" aria-pressed="${S.focus === 't' + x.id}"><span class="rk">${i + 1}</span>${UI.logo(x, 22)}<b>${esc(x.name || x.abbr)}</b><small>${c} post${c > 1 ? 's' : ''}</small></button></li>`).join('')}</ol></div>` : ''}
    <div class="card"><div class="card-h"><h3>Sources</h3></div><ul class="soc-state">${srcState}</ul><p class="note soc-about">${esc(about)}</p></div></aside>`;
  return `<section class="sec soc">${head}${stories}
    <div class="soc-grid"><div class="soc-main">${filters}<div class="soc-ptr" aria-hidden="true"><span class="soc-ptr-ic">${STAT.refresh}</span><span class="soc-ptr-t">Pull to refresh</span></div>${newPill}<div class="soc-feed">${feed}</div></div>${rail}</div></section>`;
};

/* ---------- actions (filters and viewing only: nothing here posts or reacts) ---------- */
const reset = () => { S.key = ''; S.limit = 30; window.scrollTo({ top: 0 }); NBA.render(); };
Object.assign(NBA.actions, {
  socsort: a => { S.sort = a.dataset.v; reset(); },
  socrange: a => { S.range = a.dataset.v; reset(); },
  soctype: a => { S.type = a.dataset.v; reset(); },
  socsrc: a => { S.src = a.dataset.v; reset(); },
  socfocus: a => { S.focus = S.focus === a.dataset.v ? '' : a.dataset.v; reset(); },
  socmore: () => { S.limit += 25; NBA.render(); },
  socnew: () => { S.key = ''; S.limit = Math.max(30, S.limit); const top = document.querySelector('.soc-main'); if (top) window.scrollTo({ top: Math.max(0, top.getBoundingClientRect().top + scrollY - 120), behavior: 'smooth' }); NBA.render(); },
  socspoil: a => { S.open[a.dataset.id] = true; NBA.render(); },
  socrefresh: () => refresh(),
  socplay: a => {
    const it = findItem(a.dataset.id), x = it && (it.media || [])[+a.dataset.i || 0];
    if (!it || !x) return;
    S.open[it.id] = true;
    const title = `${SRC[it.src].name} · ${(it.author && (it.author.name || it.author.handle)) || ''}`;
    if (x.kind === 'image') { UI.openVid({ title, link: it.url, linkLabel: SRC[it.src].open, tall: x.h > x.w, body: `<img src="${esc(x.full || x.thumb)}" alt="${esc(it.title || it.text || '')}" referrerpolicy="no-referrer">` }); return; }
    if (x.kind === 'embed') { UI.openVid({ title, link: it.url, linkLabel: SRC[it.src].open, tall: !!x.tall, body: `<iframe src="${esc(x.embed)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" scrolling="no"></iframe>` }); return; }
    // X's video server turns away requests that say which site they came from, so its clips play in a small frame that
    // sends no referrer
    if (x.nr && x.mp4) {
      const doc = `<!doctype html><meta name="referrer" content="no-referrer"><style>html,body{margin:0;height:100%;background:#000}video{display:block;width:100%;height:100%;object-fit:contain;background:#000}</style><video src="${esc(x.mp4)}"${x.thumb ? ` poster="${esc(x.thumb)}"` : ''} controls autoplay playsinline${x.gif ? ' loop muted' : ''}></video>`;
      UI.openVid({ title, link: it.url, linkLabel: SRC[it.src].open, hint: 'Not playing?', tall: x.h > x.w, body: `<iframe srcdoc="${esc(doc)}" title="${esc(title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>` });
      return;
    }
    const d = UI.openVid({ title, link: it.url, linkLabel: SRC[it.src].open, hint: 'Not playing?', tall: x.h > x.w, body: `<video controls playsinline autoplay preload="metadata"${x.thumb ? ` poster="${esc(x.thumb)}"` : ''}></video>` });
    if (d) playInto(d.querySelector('video'), x);
  },
});
function findItem(id) {
  const lists = [(NBA.data('social') || {}).items || [], ...['week', 'season'].map(k => (NBA.data('socarch') || {})[k] || [])];
  for (const l of lists) { const it = l.find(x => x.id === id); if (it) return it; }
  return null;
}
/* Gets a clip playing in the floating player's <video>:
   - Streamable (most r/nba highlights): its signed mp4 links expire, so they're looked up on tap; the embed if that fails
   - Reddit's own video: HLS (it carries the sound), natively in Safari and through hls.js elsewhere (Chrome says it can
     play HLS but can't), loaded the first time it's needed
   - X: the mp4 (played in a frame that sends no referrer, set up in socplay) */
const SAFARI = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent) || /iP(hone|ad|od)/.test(navigator.userAgent);
let hlsLib = null;
const iframeOf = src => { const f = document.createElement('iframe'); f.src = src; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.setAttribute('scrolling', 'no'); return f; };
const fallback = (v, x) => { if (!v.isConnected) return; if (x.embed) v.replaceWith(iframeOf(x.embed)); else if (x.streamable) v.replaceWith(iframeOf(`https://streamable.com/e/${x.streamable}?autoplay=1`)); };
async function playInto(v, x) {
  if (!v) return;
  v.addEventListener('error', () => fallback(v, x), { once: true });
  if (x.streamable) {
    try {
      const j = await NBA.getJSON(`https://api.streamable.com/videos/${encodeURIComponent(x.streamable)}`);
      const f = (j && j.files) || {}, pick = (innerWidth < 760 && f['mp4-mobile']) || f.mp4 || f['mp4-mobile'];
      if (pick && pick.url) { v.src = pick.url.replace(/^\/\//, 'https://'); return; }
    } catch (e) { /* removed or unreachable */ }
    if (x.mp4) { v.src = x.mp4; return; }
    fallback(v, x); return;
  }
  if (x.hls && SAFARI) { v.src = x.hls; return; }
  if (x.hls) {
    hlsLib = hlsLib || new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.20/hls.min.js'; s.onload = () => ok(window.Hls); s.onerror = () => { hlsLib = null; no(); }; document.head.appendChild(s); });
    try {
      const Hls = await hlsLib;
      if (!v.isConnected) return;
      if (Hls && Hls.isSupported()) {
        const h = new Hls();
        h.on(Hls.Events.ERROR, (e, d) => { if (d && d.fatal) { h.destroy(); if (x.mp4) v.src = x.mp4; else fallback(v, x); } });
        h.loadSource(x.hls); h.attachMedia(v);
        new MutationObserver((m, o) => { if (!v.isConnected) { h.destroy(); o.disconnect(); } }).observe(document.getElementById('vid'), { childList: true, subtree: true });
        return;
      }
    } catch (e) { /* hls.js didn't load */ }
  }
  if (x.mp4) v.src = x.mp4; else fallback(v, x);
}
// A picture that's gone (a removed post, an expired link) shows a plain tile instead of a broken image
addEventListener('error', e => {
  const t = e.target;
  if (!(t instanceof HTMLImageElement)) return;
  if (t.matches('.sp-m img')) t.closest('.sp-m').classList.add('broken');
  else if (t.matches('img.sp-av')) { const s = document.createElement('span'); s.className = 'sp-av sp-av-l ' + (t.dataset.src || ''); s.textContent = t.dataset.l || '?'; t.replaceWith(s); }
  else if (t.matches('.sp-link img')) t.remove();
}, true);

/* ---------- refresh: the poll while the tab is open, the button, and pull-to-refresh ---------- */
let refreshing = false;
async function refresh() {
  if (refreshing) return;
  refreshing = true;
  document.documentElement.classList.add('soc-refreshing');
  try { await Promise.allSettled([NBA.need('social', true), S.sort === 'top' && S.range !== 'day' ? NBA.need('socarch', true) : null]); }
  finally {
    refreshing = false;
    document.documentElement.classList.remove('soc-refreshing');
    S.key = ''; NBA.render();
  }
}
NBA.pollHooks.push({ run: () => UI.route().tab === 'social' ? NBA.need('social') : null });

/* Pull down at the top of the feed to refresh: a finger on phones, a click-and-drag with the mouse on a computer.
   Past 70 px it lets go into a refresh; a drag never turns into a click on whatever it started on */
(() => {
  const MAX = 110, GO = 70;
  let y0 = null, dy = 0, mouse = false, dragged = false;
  const ptr = () => document.querySelector('.soc-ptr');
  const onTab = () => document.documentElement.dataset.tab === 'social';
  const startOk = t => onTab() && scrollY <= 0 && !refreshing && !(document.querySelector('#vid') || {}).open && t.closest && t.closest('.soc') && !t.closest('input, select, textarea, .soc-stories, .soc-srcs, .soc-types, .seg');
  const show = d => {
    const p = ptr(); if (!p) return;
    const k = Math.min(MAX, d * 0.55);
    p.classList.toggle('pulling', k > 0);
    p.style.height = k + 'px';
    p.classList.toggle('ready', k >= GO * 0.55 + 10);
    p.querySelector('.soc-ptr-t').textContent = k >= GO * 0.55 + 10 ? 'Release to refresh' : 'Pull to refresh';
    p.querySelector('.soc-ptr-ic').style.transform = `rotate(${Math.round(k * 4)}deg)`;
  };
  const end = () => {
    if (y0 == null) return;
    const go = dy * 0.55 >= GO * 0.55 + 10;
    y0 = null;
    const p = ptr();
    if (p) { p.classList.remove('pulling'); p.style.height = go ? '46px' : ''; p.classList.toggle('busy', go); if (go) p.querySelector('.soc-ptr-t').textContent = 'Refreshing…'; }
    if (go) refresh().finally(() => { const q = ptr(); if (q) { q.style.height = ''; q.classList.remove('busy', 'ready'); } });
    else if (p) p.classList.remove('ready');
    dy = 0;
  };
  addEventListener('touchstart', e => { if (e.touches.length === 1 && startOk(e.target)) { y0 = e.touches[0].clientY; dy = 0; mouse = false; } }, { passive: true });
  addEventListener('touchmove', e => {
    if (y0 == null || mouse) return;
    dy = e.touches[0].clientY - y0;
    if (dy <= 0 || scrollY > 0) { dy = 0; show(0); return; }
    if (e.cancelable) e.preventDefault(); // hold the page still (no rubber band) while pulling
    show(dy);
  }, { passive: false });
  addEventListener('touchend', end, { passive: true });
  addEventListener('touchcancel', () => { dy = 0; end(); }, { passive: true });
  addEventListener('mousedown', e => { if (e.button === 0 && startOk(e.target)) { y0 = e.clientY; dy = 0; mouse = true; dragged = false; } });
  addEventListener('mousemove', e => {
    if (y0 == null || !mouse) return;
    dy = e.clientY - y0;
    if (dy > 6) { dragged = true; e.preventDefault(); document.documentElement.classList.add('soc-dragging'); }
    show(Math.max(0, dy));
  });
  addEventListener('mouseup', () => { if (mouse) { document.documentElement.classList.remove('soc-dragging'); end(); } });
  // The click that ends a drag doesn't open the post under the pointer
  addEventListener('click', e => { if (dragged) { dragged = false; e.preventDefault(); e.stopPropagation(); } }, true);
})();

/* Show more as the end of the list comes into view */
let io = null;
NBA.after.social = view => {
  const s = view.querySelector('.soc-sentinel');
  if (!('IntersectionObserver' in window)) return;
  if (io) io.disconnect();
  if (!s) return;
  io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); S.limit += 25; NBA.render(); } }, { rootMargin: '800px 0px' });
  io.observe(s);
};
})();
