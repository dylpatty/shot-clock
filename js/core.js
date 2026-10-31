/* Data layer, settings and shared helpers.
   Everything is read from ESPN's public JSON feeds straight from the browser. */
(() => {
'use strict';

const NBA = window.NBA = {};
const API = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const WEB = 'https://site.web.api.espn.com/apis';
const CORE = 'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba';
const started = new Date();
NBA.SEASON = started.getMonth() >= 8 ? started.getFullYear() + 1 : started.getFullYear();
NBA.SEASON_LABEL = `${NBA.SEASON - 1}-${String(NBA.SEASON).slice(2)}`;
NBA.seasonType = 2;

/* ---------- settings ---------- */
const KEY = 'nba.settings.v2', OLD_KEY = 'shotclock.settings.v1', AI_KEY = 'nba.anthropicKey';
const DEFAULTS = {
  favorites: ['9'],
  myTeam: '9',
  card: { quarters: true, leaders: true, winprob: true, lastplay: true },
  spoilers: false,
  refresh: 10,
  density: 'comfortable',
  theme: 'system',
  teamTheme: '',
  boxCols: 'compact',
  statsMode: 'game',
  aiModel: 'claude-opus-5-5',
  tz: 'et',
};
const clone = o => JSON.parse(JSON.stringify(o));
function readJSON(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
function loadSettings() {
  const d = clone(DEFAULTS);
  let s = readJSON(KEY);
  if (!s) {
    const old = readJSON(OLD_KEY);
    if (old && typeof old === 'object') s = { favorites: old.favorites, card: old.card, spoilers: old.spoilers, refresh: old.refresh, density: old.density, theme: old.theme, boxCols: old.boxCols };
  }
  if (!s || typeof s !== 'object') return d;
  const out = Object.assign(d, s, { card: Object.assign(d.card, s.card || {}) });
  out.myTeam = String(out.myTeam || '9');
  return lockSettings(out);
}
// Only light/dark, team colors and spoiler mode are choices; everything else is fixed, and the
// highlighted team is always the favorite team picked in the header
function lockSettings(s) {
  Object.assign(s, { refresh: 10, density: 'comfortable', boxCols: 'compact', tz: 'et', card: clone(DEFAULTS.card), favorites: [String(s.myTeam || '9')] });
  if (s.theme !== 'light' && s.theme !== 'dark') s.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return s;
}
NBA.S = loadSettings();
NBA.save = () => { try { localStorage.setItem(KEY, JSON.stringify(NBA.S)); } catch (e) { /* storage blocked: settings last for this visit */ } };
NBA.resetSettings = () => { NBA.S = lockSettings(clone(DEFAULTS)); NBA.save(); };
NBA.aiKey = {
  get() { try { return localStorage.getItem(AI_KEY) || ''; } catch (e) { return ''; } },
  set(v) { try { if (v) localStorage.setItem(AI_KEY, v); else localStorage.removeItem(AI_KEY); } catch (e) { /* ignore */ } },
};

/* ---------- small helpers ---------- */
const esc = NBA.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
NBA.ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const num = NBA.num = v => { if (v == null || v === '' || v === '--') return -Infinity; const m = String(v).match(/^(-?\d+)-(\d+)$/); return m ? +m[1] : parseFloat(v); };
const f = v => { const x = parseFloat(v); return Number.isFinite(x) ? x : 0; };
NBA.perLabel = n => n <= 4 ? 'Q' + n : (n === 5 ? 'OT' : 'OT' + (n - 4));
NBA.isDark = () => NBA.S.theme === 'dark' || (NBA.S.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
NBA.fix = (v, d = 1) => Number.isFinite(v) ? v.toFixed(d) : '–';
NBA.pctFmt = v => Number.isFinite(v) ? v.toFixed(1) + '%' : '–';

const pad = n => String(n).padStart(2, '0');
NBA.isoOf = dt => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
NBA.paramOf = iso => iso.replace(/-/g, '');
NBA.isoFromParam = p => p ? `${p.slice(0, 4)}-${p.slice(4, 6)}-${p.slice(6, 8)}` : null;
NBA.dateOfIso = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
NBA.shiftIso = (iso, n) => { const dt = NBA.dateOfIso(iso); dt.setDate(dt.getDate() + n); return NBA.isoOf(dt); };
NBA.etDay = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
NBA.today = NBA.etDay(started.getTime() - 3 * 3600000); // ESPN's day runs until 3 AM Eastern
// Date formatters are cached: building one is slow, and schedule lists format hundreds of dates per render
const DTF = new Map();
const dtf = o => { const k = JSON.stringify(o); let f = DTF.get(k); if (!f) DTF.set(k, f = new Intl.DateTimeFormat([], o)); return f; };
NBA.fmtDay = (iso, opts) => dtf(opts || { weekday: 'short', month: 'short', day: 'numeric' }).format(NBA.dateOfIso(iso));
/* Game times show in Eastern Time (labelled ET) unless the viewer picks their device's time zone */
const tz = () => NBA.S.tz === 'local' ? undefined : 'America/New_York';
NBA.tzLabel = () => NBA.S.tz === 'local' ? 'your time zone' : 'Eastern Time (ET)';
NBA.fmtTime = iso => dtf({ hour: 'numeric', minute: '2-digit', timeZone: tz() }).format(new Date(iso)) + (NBA.S.tz === 'local' ? '' : ' ET');
NBA.fmtDate = (iso, opts) => dtf(Object.assign({}, opts || { weekday: 'short', month: 'short', day: 'numeric' }, { timeZone: tz() })).format(new Date(iso));
NBA.relTime = iso => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  if (m < 60 * 24) return Math.round(m / 60) + 'h ago';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
};
NBA.implied = odds => {
  const n = parseFloat(String(odds).replace('+', ''));
  if (!Number.isFinite(n) || n === 0) return 0;
  return n > 0 ? 100 / (n + 100) : -n / (-n + 100);
};

function hexRgb(h) {
  h = String(h || '888888').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16) || 0;
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function lum(rgb) {
  const g = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
  return .2126 * g(rgb[0]) + .7152 * g(rgb[1]) + .0722 * g(rgb[2]);
}
/* Team colors that stay visible on the current surface and stay apart from each other */
NBA.tone = t => {
  const dark = NBA.isDark();
  const ok = c => { if (!c) return false; const L = lum(hexRgb(c)); return dark ? L > .05 : L < .72; };
  return ok(t.color) ? t.color : ok(t.alt) ? t.alt : (dark ? '#9AA3AE' : '#59626E');
};
/* Accent colors for the team-colors theme: of the team's two colors, the one that reads best on this theme */
NBA.accentFor = t => {
  const dark = NBA.isDark();
  const cands = [t.color, t.alt].filter(c => /^#[0-9a-f]{6}$/i.test(c || '')).map(c => [c, lum(hexRgb(c))]);
  // On dark, the accent is also text on the dark card, which needs L >= .22 for 4.5:1
  const usable = cands.filter(([, L]) => dark ? L >= .22 : L < .4);
  const pick = (usable.length ? usable : cands).sort((a, b) => dark ? b[1] - a[1] : a[1] - b[1])[0];
  if (!pick) return null;
  // The header tint uses the team's deeper color, which reads as the team's own on either theme
  const deep = cands.slice().sort((a, b) => a[1] - b[1])[0][0];
  let [acc, L] = pick;
  while (dark && L < .22) { // lift too-dark team colors toward white so they read on the dark card
    acc = '#' + hexRgb(acc).map(v => Math.round(v + (255 - v) * .25).toString(16).padStart(2, '0')).join('');
    L = lum(hexRgb(acc));
  }
  // Ink is whichever of dark or white text has more contrast on the accent
  return { accent: acc, ink: (L + .05) / .0566 >= 1.05 / (L + .05) ? '#111418' : '#FFFFFF', base: deep };
};
NBA.tones = (a, h) => {
  const dark = NBA.isDark(), fallback = dark ? '#9AA3AE' : '#59626E';
  const ok = c => { if (!c) return false; const L = lum(hexRgb(c)); return dark ? L > .05 : L < .72; };
  const dist = (x, y) => { const p = hexRgb(x), q = hexRgb(y); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  let ca = NBA.tone(a); const ch = NBA.tone(h);
  if (dist(ca, ch) < 90) ca = (ok(a.alt) && dist(a.alt, ch) >= 90) ? a.alt : fallback;
  return [ca, ch];
};

/* ---------- team registry ---------- */
NBA.teams = new Map();
const EXTRA_ALIASES = {
  GS: ['dubs', 'golden state', 'gsw', 'warriors'], PHI: ['sixers', '76ers', 'philly'], CLE: ['cavs'], MIN: ['wolves', 'twolves', 't-wolves'],
  POR: ['blazers', 'trail blazers'], DAL: ['mavs'], NY: ['knicks', 'nyk'], BKN: ['nets', 'brooklyn'], LAL: ['lakers'], LAC: ['clippers', 'clips'],
  OKC: ['thunder'], SA: ['spurs', 'sas'], NO: ['pelicans', 'pels', 'nola', 'nop'], WSH: ['wizards', 'wiz'], UTAH: ['jazz', 'uta'],
  PHX: ['suns'], CHA: ['hornets'], SAC: ['kings'], MEM: ['grizzlies', 'grizz'], ORL: ['magic'], DET: ['pistons'], TOR: ['raptors', 'raps'],
  MIA: ['heat'], MIL: ['bucks'], IND: ['pacers'], HOU: ['rockets'], DEN: ['nuggets', 'nugs'], CHI: ['bulls'], BOS: ['celtics'], ATL: ['hawks'],
};
NBA.T = id => NBA.teams.get(String(id)) || { id: String(id), abbr: '', name: '', full: '', logo: '', color: '#888888', alt: '#BBBBBB' };
NBA.lg = t => (NBA.isDark() && t.logoDark) ? t.logoDark : (t.logo || '');
/* ESPN's image resizer. Width only: it keeps the aspect ratio. Callers ask for about 3x the CSS size, in a few
   buckets so the cache is shared */
// ESPN's own paths go in as a path; highlight posters live on ESPN's media CDN and go in as the full URL
const CDN_IMG = /^https:\/\/a\.espncdn\.com(\/(?:i|photo)\/[^?#]+)$|^https:\/\/espnmedia-cdn\.akamaized\.net\/[^?#]+$/;
NBA.img = (url, w) => { const m = CDN_IMG.exec(url || ''); return m && w ? `https://a.espncdn.com/combiner/i?img=${encodeURIComponent(m[1] || m[0])}&w=${w}` : (url || ''); };
// If the resizer ever fails, fall back to the original file once
document.addEventListener('error', e => {
  const n = e.target, attr = n && n.tagName === 'IMG' ? 'src' : n && n.tagName === 'image' ? 'href' : '';
  const v = attr ? n.getAttribute(attr) || '' : '', m = /\/combiner\/i\?img=([^&]+)/.exec(v);
  if (m) { const src = decodeURIComponent(m[1]); n.setAttribute(attr, /^https?:/.test(src) ? src : 'https://a.espncdn.com' + src); }
}, true);
// "WAS" is the NBA's own code for the Wizards (ESPN uses WSH). It counts only as an exact code, since in free text it is the word "was"
NBA.teamByAbbr = abbr => { const a = String(abbr).toLowerCase() === 'was' ? 'wsh' : String(abbr).toLowerCase(); return [...NBA.teams.values()].find(t => t.abbr && t.abbr.toLowerCase() === a); };
/* Team colors are remembered between visits, so the team-colors theme has them even on days a team
   isn't on any loaded scoreboard (ESPN's all-teams feed can't be read from a browser) */
const COLORS_KEY = 'nba.colors.v1';
const savedColors = readJSON(COLORS_KEY) || {};
Object.entries(savedColors).forEach(([id, c]) => { if (Array.isArray(c)) NBA.teams.set(id, Object.assign(NBA.teams.get(id) || { id }, { color: c[0], alt: c[1] })); });
function mergeTeam(t) {
  // NBA Cup 'TBD' placeholders come with ids -1 and -2 and aren't teams
  if (!t || !t.id || t.id === 'undefined' || !(+t.id > 0)) return;
  const cur = NBA.teams.get(t.id) || {};
  NBA.teams.set(t.id, Object.assign(cur, {
    id: t.id, abbr: t.abbr || cur.abbr, name: t.name || cur.name, full: t.full || cur.full, location: t.location || cur.location,
    logo: cur.logo || t.logo, logoDark: t.logoDark || cur.logoDark,
    color: t.color || cur.color, alt: t.alt || cur.alt, conf: t.conf || cur.conf,
  }));
  // Scoreboards fill in gray and silver when a color is missing, so only real pairs are saved
  const s = savedColors[t.id];
  if (t.color && t.alt && t.color !== '#888888' && t.alt !== '#BBBBBB' && (!s || s[0] !== t.color || s[1] !== t.alt)) {
    savedColors[t.id] = [t.color, t.alt];
    try { localStorage.setItem(COLORS_KEY, JSON.stringify(savedColors)); } catch (e) { /* storage blocked: colors last for this visit */ }
  }
}
/* All teams mentioned in free text, longest alias first so "Golden State" beats "State" */
NBA.findTeams = text => {
  const s = ' ' + String(text).toLowerCase().replace(/[^a-z0-9' -]/g, ' ') + ' ';
  const counts = {};
  [...NBA.teams.values()].forEach(t => { if (t.location) counts[t.location.toLowerCase()] = (counts[t.location.toLowerCase()] || 0) + 1; });
  const pairs = [];
  NBA.teams.forEach(t => {
    if (!t.abbr) return;
    // The Pelicans' code "NO" is the word "no" in free text, so they match by "nop", "pels" or name instead
    const al = new Set([t.full, t.name, t.abbr !== 'NO' && t.abbr, ...(EXTRA_ALIASES[t.abbr] || [])].filter(Boolean).map(x => x.toLowerCase()));
    if (t.location && counts[t.location.toLowerCase()] === 1) al.add(t.location.toLowerCase());
    al.forEach(a => pairs.push([a, t]));
  });
  pairs.sort((a, b) => b[0].length - a[0].length);
  const found = [];
  let rest = s;
  pairs.forEach(([a, t]) => {
    const re = new RegExp(`[^a-z0-9]${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?[^a-z0-9]`);
    if (re.test(rest)) {
      if (!found.includes(t)) found.push(t);
      rest = rest.replace(re, ' ');
    }
  });
  return found;
};

/* ---------- spoilers, game status text and highlights ---------- */
// Scores in the 60s-190s, or result verbs, mark a story as giving away a result. Previews always stay
const SPOIL_RE = /\b(?:[6-9]\d|1\d\d)-(?:[6-9]\d|1\d\d)\b|\b(?:beat|beats|beaten|win|wins|won|victory|defeats?|defeated|routs?|routed|edges?|edged|tops|topped|snaps?|snapped|loses|lost|rall(?:y|ies|ied)|holds? (?:on|off)|triple-double)\b/i;
NBA.newsSafe = a => !NBA.S.spoilers || a.type === 'Preview' || (a.type !== 'Recap' && a.type !== 'Media' && !SPOIL_RE.test(`${a.headline} ${a.description || ''}`));
// A result stays hidden in spoiler mode for 2 days unless that game was opened. UI.st.revealed empties on every
// reload, so without the window old results would stay hidden forever
NBA.masked = (id, date) => !!NBA.S.spoilers && !(NBA.ui && NBA.ui.st.revealed.has(String(id))) && Date.now() - new Date(date).getTime() < 2 * 864e5;
// ESPN sends '0.0 - 2nd' at the end of a period
NBA.detail = g => String((g && g.detail) || '').replace(/^0\.0 - (\S+)/i, 'End of $1');
NBA.fmtDur = s => { const t = Math.round(s) || 0; return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/* ---------- full game highlights ---------- */
// The NBA's full game highlights on YouTube, by ESPN game id: { id, dur, hd } once posted, else null.
// The list comes from the 'ythl' resource (see .github/workflows/highlights.yml)
NBA.fullHl = id => { const d = NBA.use('ythl'), v = d && d.games && d.games[id]; return v ? { id: v[0], dur: v[1] || 0, hd: !!v[2] } : null; };
// YouTube's stills: mqdefault is 320 wide, hqdefault 480 and sddefault 640 (both letterboxed 4:3, which
// object-fit:cover crops back to 16:9) and maxresdefault 1280, which only HD uploads have
NBA.ytSrcset = v => { const u = n => `https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/${n}.jpg`; return `src="${u('hqdefault')}" srcset="${u('mqdefault')} 320w, ${u('hqdefault')} 480w${v.hd ? `, ${u('sddefault')} 640w, ${u('maxresdefault')} 1280w` : ''}"`; };
// The data-act="yt" attributes that play a game's full highlights in the floating player
NBA.ytAttrs = (v, g) => `data-act="yt" data-v="${NBA.esc(v.id)}" data-id="${NBA.esc(g.id)}" data-title="${NBA.esc(`${g.away.abbr} @ ${g.home.abbr} · Full game highlights`)}"`;

/* ---------- fetching with a small resource cache ---------- */
// Every request gives up after 15 s, so one that never settles (a network handoff, the phone locking) can't stall polling.
// The two big feeds (players, month) get 60 s so they can still finish on a slow link.
// AbortController rather than AbortSignal.timeout, which older iOS lacks
async function getJSON(url, ms = 15000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { cache: 'no-store', signal: ac.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json(); // awaited inside try, so a body that stalls mid-download is covered too
  } finally { clearTimeout(t); }
}
NBA.getJSON = getJSON;
const RES = new Map();
const LOADERS = {};
function def(prefix, ttl, load) { LOADERS[prefix] = { ttl, load }; }
function need(key, force) {
  const i = key.indexOf(':');
  const prefix = i < 0 ? key : key.slice(0, i), arg = i < 0 ? '' : key.slice(i + 1);
  const L = LOADERS[prefix];
  if (!L) return Promise.reject(new Error('Unknown data ' + key));
  let r = RES.get(key);
  if (!r) { r = { t: 0, data: undefined, err: null, p: null, retry: 0 }; RES.set(key, r); }
  if (r.p) return r.p;
  const ttl = typeof L.ttl === 'function' ? L.ttl(arg, r.data) : L.ttl;
  if (!force && r.t && Date.now() - r.t < ttl) return Promise.resolve(r.data);
  // After a failure, wait 30 s before trying again. Keep serving older data, or pass on the error if nothing has loaded yet
  if (!force && Date.now() < r.retry) return r.data === undefined ? Promise.reject(r.err) : Promise.resolve(r.data);
  r.p = L.load(arg, r.data)
    // r.t is only set by a successful load, so a failed refresh never makes old data look fresh
    .then(data => { r.data = data; r.t = Date.now(); r.err = null; r.retry = 0; return data; })
    .catch(e => { r.err = e; r.retry = Date.now() + 30000; throw e; })
    .finally(() => { r.p = null; NBA.changed(); });
  r.p.catch(() => {});
  return r.p;
}
NBA.need = need;
NBA.use = key => { need(key).catch(() => {}); const r = RES.get(key); return r ? r.data : undefined; };
NBA.data = key => { const r = RES.get(key); return r ? r.data : undefined; };
NBA.status = key => { const r = RES.get(key) || {}; return { loading: !!r.p, err: r.err, t: r.t || 0 }; };

let pending = false;
NBA.changed = () => {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; if (NBA.render) NBA.render(); });
};

/* ---------- parsing ---------- */
const headshotOf = h => typeof h === 'string' ? h : (h && h.href) || '';
// ESPN sometimes leaves a live score blank (score: []); the quarter scores still add up to it
const lineSum = ls => { const v = (ls || []).map(l => parseFloat(l.value ?? l.displayValue)); return v.length && v.every(Number.isFinite) ? String(v.reduce((a, b) => a + b, 0)) : ''; };
const scoreOf = c => { const s = c.score; if (typeof s === 'number' || (typeof s === 'string' && s !== '')) return String(s); if (s && typeof s === 'object' && !Array.isArray(s) && s.displayValue != null) return String(s.displayValue); return lineSum(c.linescores); };
function parseTeam(c) {
  const t = c.team || {};
  return {
    id: String(t.id), abbr: t.abbreviation || '', name: t.shortDisplayName || t.name || '', full: t.displayName || '', location: t.location || '',
    color: '#' + (t.color || '888888'), alt: '#' + (t.alternateColor || 'BBBBBB'),
    logo: t.logo || (t.logos && t.logos[0] && t.logos[0].href) || '', logoDark: t.logoDark || '',
    score: scoreOf(c), home: c.homeAway === 'home', winner: c.winner,
    record: ((c.records || []).find(r => r.type === 'total') || {}).summary || '',
    lines: (c.linescores || []).map(l => l.displayValue ?? l.value),
    leaders: (c.leaders || []).filter(l => ['points', 'rebounds', 'assists'].includes(l.name)).map(l => {
      const top = (l.leaders || [])[0] || {}; const a = top.athlete || {};
      return { cat: l.name, value: top.displayValue, short: a.shortName || a.displayName || '', full: a.displayName || a.fullName || '', headshot: headshotOf(a.headshot), pid: String(a.id || '') };
    }),
  };
}
function parseOdds(c) {
  const o = (c.odds || [])[0];
  if (!o) return null;
  const ml = side => {
    const t = side === 'home' ? o.homeTeamOdds : o.awayTeamOdds;
    if (t && t.moneyLine != null) return (t.moneyLine > 0 ? '+' : '') + t.moneyLine;
    const m = o.moneyline && o.moneyline[side];
    return m && m.close && m.close.odds ? m.close.odds : (m && m.open && m.open.odds) || '';
  };
  const ps = o.pointSpread || {}, tot = o.total || {}, mo = o.moneyline || {};
  const side = (m, k) => ({ open: m && m[k] && m[k].open ? (m[k].open.line ?? m[k].open.odds) : '', now: m && m[k] && m[k].close ? (m[k].close.line ?? m[k].close.odds) : '' });
  return {
    provider: o.provider && o.provider.name, details: o.details || '', ou: o.overUnder ?? '', awayML: ml('away'), homeML: ml('home'),
    // Opening vs current DraftKings lines, for line movement
    spreadHome: side(ps, 'home'), spreadAway: side(ps, 'away'),
    total: { open: String(side(tot, 'over').open || '').replace(/^o/, ''), now: String(side(tot, 'over').now || '').replace(/^o/, '') },
    mlHome: side(mo, 'home'), mlAway: side(mo, 'away'),
  };
}
function parseGame(ev) {
  const c = (ev.competitions || [])[0] || {};
  const st = ev.status || c.status || { type: {} };
  const teams = (c.competitors || []).map(parseTeam);
  const away = teams.find(t => !t.home) || teams[0], home = teams.find(t => t.home) || teams[1];
  const prob = c.situation && c.situation.lastPlay && c.situation.lastPlay.probability;
  const nat = (c.geoBroadcasts || []).filter(g => g.market && g.market.type === 'National').map(g => g.media && g.media.shortName).filter(Boolean);
  const summaryLink = (ev.links || []).find(l => (l.rel || []).includes('summary'));
  return {
    id: String(ev.id), date: ev.date, state: st.type.state, completed: st.type.completed,
    detail: st.type.shortDetail || st.type.detail || '', away, home,
    tv: [...new Set(nat)].join(', '),
    note: (c.notes && c.notes[0] && c.notes[0].headline) || '',
    venue: c.venue ? [c.venue.fullName, c.venue.address && c.venue.address.city].filter(Boolean).join(', ') : '',
    lastPlay: c.situation && c.situation.lastPlay ? c.situation.lastPlay.text : '',
    recap: (c.headlines && c.headlines[0] && c.headlines[0].shortLinkText) || '',
    homeWin: prob && typeof prob.homeWinPercentage === 'number' ? prob.homeWinPercentage : null,
    odds: parseOdds(c),
    link: summaryLink ? summaryLink.href : `https://www.espn.com/nba/game/_/gameId/${ev.id}`,
  };
}
NBA.parseGame = parseGame;
NBA.sortGames = list => list.slice().sort((a, b) => ((b.state === 'in') - (a.state === 'in')) || (new Date(a.date) - new Date(b.date)));

function parseStandings(j) {
  return (j.children || []).map(ch => ({
    name: ch.name, abbr: ch.abbreviation,
    rows: ((ch.standings && ch.standings.entries) || []).map(e => {
      const st = {}; (e.stats || []).forEach(x => { st[x.name] = x; });
      const logos = e.team.logos || [];
      const dv = k => st[k] ? st[k].displayValue : '';
      return {
        id: String(e.team.id), abbr: e.team.abbreviation, name: e.team.shortDisplayName, full: e.team.displayName, location: e.team.location,
        logo: (logos.find(l => (l.rel || []).includes('default')) || logos[0] || {}).href,
        logoDark: (logos.find(l => (l.rel || []).includes('dark')) || {}).href,
        seed: st.playoffSeed ? st.playoffSeed.value : null,
        w: st.wins ? st.wins.value : 0, l: st.losses ? st.losses.value : 0,
        pct: dv('winPercent'), pctV: st.winPercent ? st.winPercent.value : 0, gb: dv('gamesBehind'), strk: dv('streak'),
        strkV: st.streak ? st.streak.value : 0, l10: dv('Last Ten Games'),
        home: dv('Home'), road: dv('Road'), div: dv('vs. Div.'), confRec: dv('vs. Conf.'),
        ppg: f(st.avgPointsFor && st.avgPointsFor.value), opp: f(st.avgPointsAgainst && st.avgPointsAgainst.value),
        diff: f(st.differential && st.differential.value),
        conf: ch.abbreviation,
      };
    }).sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99)),
  }));
}
function parseSchedule(j, id) {
  return (j.events || []).map(ev => {
    const c = (ev.competitions || [])[0] || {};
    const me = (c.competitors || []).find(x => String(x.team && x.team.id) === id) || {};
    const op = (c.competitors || []).find(x => String(x.team && x.team.id) !== id) || {};
    const sc = s => s && typeof s === 'object' ? s.displayValue : s;
    const nat = (c.broadcasts || []).filter(b => b.market && (b.market.type === 'National' || b.market === 'national')).map(b => b.media && b.media.shortName).filter(Boolean);
    return {
      id: String(ev.id), date: ev.date, state: c.status && c.status.type ? c.status.type.state : 'pre',
      // A postponed game is 'post' but not completed
      completed: !!(c.status && c.status.type && c.status.type.completed),
      detail: c.status && c.status.type ? c.status.type.shortDetail : '',
      home: me.homeAway === 'home', oppId: String(op.team && op.team.id), oppAbbr: op.team && op.team.abbreviation,
      oppName: op.team && (op.team.shortDisplayName || op.team.displayName),
      my: sc(me.score), their: sc(op.score), won: me.winner, tv: nat.join(', '),
    };
  });
}
// A game that was played to the end: postponed and canceled games are 'post' too. Works on scoreboard games and schedule events
NBA.isFinal = g => g.state === 'post' && g.completed !== false;
function parseSummary(j, id) {
  const comp = (j.header && j.header.competitions && j.header.competitions[0]) || {};
  const teams = (comp.competitors || []).map(c => {
    const reg = NBA.T(c.team && c.team.id);
    const t = c.team || {};
    return {
      id: String(t.id), abbr: t.abbreviation || reg.abbr, name: t.name || reg.name, full: t.displayName || reg.full,
      logo: reg.logo || (t.logos && t.logos[0] && t.logos[0].href) || '', logoDark: reg.logoDark,
      color: reg.color || ('#' + (t.color || '888888')), alt: reg.alt || ('#' + (t.alternateColor || 'BBBBBB')),
      score: scoreOf(c), home: c.homeAway === 'home', winner: c.winner,
      record: ((c.record || []).find(r => r.type === 'total') || (c.record || [])[0] || {}).summary || '',
      lines: (c.linescores || []).map(l => l.displayValue ?? l.value),
    };
  });
  const away = teams.find(t => !t.home) || teams[0], home = teams.find(t => t.home) || teams[1];
  const box = ((j.boxscore && j.boxscore.players) || []).map(p => {
    const s = (p.statistics || [])[0] || {};
    return {
      teamId: String(p.team.id), keys: s.keys || [], labels: s.labels || s.names || [], totals: s.totals || [],
      players: (s.athletes || []).map(a => ({
        id: String(a.athlete.id), name: a.athlete.shortName || a.athlete.displayName, full: a.athlete.displayName,
        pos: a.athlete.position && a.athlete.position.abbreviation, starter: a.starter,
        dnp: a.didNotPlay || !(a.stats && a.stats.length), reason: a.reason || '', stats: a.stats || [],
      })),
    };
  });
  const tstats = ((j.boxscore && j.boxscore.teams) || []).map(t => {
    const m = {}; (t.statistics || []).forEach(x => { m[x.name] = x.displayValue; });
    return { teamId: String(t.team.id), m };
  });
  const st = comp.status || { type: {} };
  const plays = (j.plays || []).map(p => ({
    id: String(p.id), text: p.text || '', clock: p.clock ? p.clock.displayValue : '', period: p.period ? p.period.number : 0,
    away: p.awayScore, home: p.homeScore, scoring: !!p.scoringPlay, teamId: p.team ? String(p.team.id) : '', wall: p.wallclock || '',
  }));
  // A score still blank after the quarter scores is read from the latest play
  const lp = plays[plays.length - 1];
  if (lp && st.type.state !== 'pre') {
    if (away && away.score === '' && lp.away != null) away.score = String(lp.away);
    if (home && home.score === '' && lp.home != null) home.score = String(lp.home);
  }
  const lastWall = plays.map(p => p.wall).filter(Boolean).pop();
  const injuries = (j.injuries || []).map(t => ({
    teamId: String(t.team && t.team.id),
    list: (t.injuries || []).map(i => ({ name: i.athlete ? i.athlete.displayName : '', status: i.status || '', type: i.details ? i.details.type : '' })),
  })).filter(t => t.list.length);
  const link = ((j.header && j.header.links) || []).find(l => (l.rel || []).includes('summary'));
  const art = j.article;
  return {
    id, date: comp.date, away, home, state: st.type.state, completed: st.type.completed, detail: st.type.shortDetail || st.type.detail || '',
    ended: st.type.state === 'post' ? lastWall || '' : '',
    box, tstats, plays, wp: j.winprobability || [], injuries,
    link: link ? link.href : `https://www.espn.com/nba/game/_/gameId/${id}`,
    recap: art && art.type === 'Recap' ? { headline: art.headline || '', description: art.description || '' } : null,
    preview: parsePreview(j),
  };
}
/* The pre-game matchup from the same summary: ESPN's predictor, each team's last five games, the season series,
   team leaders, the line and the preview article. Any part ESPN hasn't posted is null or empty */
function parsePreview(j) {
  const art = j.article, pr = j.predictor;
  const ss = j.seasonseries || [], s = ss.find(x => x.type === 'season') || ss[0];
  const p = (j.pickcenter || [])[0];
  return {
    pred: pr && pr.homeTeam ? { home: parseFloat(pr.homeTeam.gameProjection), away: parseFloat((pr.awayTeam || {}).gameProjection) } : null,
    // The feed's 'score' string puts the winner first, so each side's points come from the home and away scores
    last5: (j.lastFiveGames || []).map(t => {
      const tid = String(t.team && t.team.id);
      return { teamId: tid, games: (t.events || []).map(e => {
        const home = String(e.homeTeamId) === tid;
        return { id: String(e.id), date: e.gameDate, res: e.gameResult || '', at: e.atVs || '', opp: (e.opponent && e.opponent.abbreviation) || '', my: home ? e.homeTeamScore : e.awayTeamScore, their: home ? e.awayTeamScore : e.homeTeamScore };
      }) };
    }),
    series: s ? { summary: s.summary || '', total: s.totalCompetitions || 0, done: (s.events || []).filter(e => e.statusType && e.statusType.completed).length } : null,
    leaders: (j.leaders || []).map(t => ({
      teamId: String(t.team && t.team.id),
      list: (t.leaders || []).filter(c => /^(points|rebounds|assists)PerGame$/.test(c.name)).map(c => {
        const l = (c.leaders || [])[0] || {}, a = l.athlete || {};
        return { cat: c.name.replace('PerGame', ''), value: l.displayValue || '', id: String(a.id || ''), name: a.displayName || '', headshot: headshotOf(a.headshot) };
      }),
    })),
    // pickcenter stays empty until a line is posted
    pick: p ? { details: p.details || '', ou: p.overUnder ?? '', awayML: (p.awayTeamOdds || {}).moneyLine ?? '', homeML: (p.homeTeamOdds || {}).moneyLine ?? '' } : null,
    article: art && art.type !== 'Recap' && art.links && art.links.web ? { headline: art.headline || '', href: art.links.web.href } : null,
  };
}
function parseGameLog(j) {
  const names = j.names || [];
  // Regular season, play-in and playoff games all count (ESPN lists each as its own season type); preseason does not
  const seen = new Set();
  const rows = (j.seasonTypes || []).filter(s => !/Preseason/i.test(s.displayName || ''))
    .flatMap(s => s.categories || []).flatMap(c => c.events || [])
    .filter(r => r && !seen.has(r.eventId) && seen.add(r.eventId));
  return rows.map(r => {
    const e = (j.events || {})[r.eventId] || {};
    const s = {}; names.forEach((n, i) => { s[n] = (r.stats || [])[i]; });
    return {
      id: String(r.eventId), date: e.gameDate, home: e.atVs !== '@', oppId: String(e.opponent && e.opponent.id || ''), oppAbbr: e.opponent && e.opponent.abbreviation,
      result: e.gameResult || '', score: e.score || '',
      min: s.minutes, pts: s.points, reb: s.totalRebounds, ast: s.assists, stl: s.steals, blk: s.blocks, tov: s.turnovers,
      fg: s['fieldGoalsMade-fieldGoalsAttempted'], tp: s['threePointFieldGoalsMade-threePointFieldGoalsAttempted'], ft: s['freeThrowsMade-freeThrowsAttempted'],
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}
/* Season-by-season per-game lines, laid out like Basketball-Reference. A season split across teams comes back as one
   row per team plus a season total; the total goes first (as "2TM") with the team rows under it. */
function parseCareer(j) {
  const cat = n => (j.categories || []).find(c => c.name === n) || {};
  const av = cat('averages'), tot = cat('totals');
  const teams = j.teams || {};
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : NaN; };
  const line = (avg, totals) => {
    const a = {}; (av.labels || []).forEach((l, i) => { a[l] = (avg || [])[i]; });
    const t = {}; (tot.labels || []).forEach((l, i) => { t[l] = (totals || [])[i]; });
    const pair = s => String(s || '').split('-').map(num);
    const [fg, fga] = pair(a.FG), [tp, tpa] = pair(a['3PT']), [ft, fta] = pair(a.FT);
    // Percentages come from season totals, which are exact; the per-game averages are rounded to one decimal
    const [fgM, fgA] = pair(t.FG), [tpM, tpA] = pair(t['3PT']), [ftM, ftA] = pair(t.FT);
    const pct = (m, n, fallback) => n > 0 ? m / n : fallback > 0 ? num(fallback) / 100 : NaN;
    const g = num(a.GP), exact = g > 0 && Number.isFinite(fgA) && Number.isFinite(tpA);
    return {
      g, gs: num(a.GS), mp: num(a.MIN), fg, fga, fgp: pct(fgM, fgA, fga && a['FG%']), tp, tpa, tpp: pct(tpM, tpA, tpa && a['3P%']),
      two: exact ? (fgM - tpM) / g : fg - tp, twoa: exact ? (fgA - tpA) / g : fga - tpa, twop: pct(fgM - tpM, fgA - tpA), efg: fgA > 0 ? (fgM + .5 * tpM) / fgA : NaN,
      ft, fta, ftp: pct(ftM, ftA, fta && a['FT%']), orb: num(a.OR), drb: num(a.DR), trb: num(a.REB), ast: num(a.AST), stl: num(a.STL), blk: num(a.BLK),
      tov: num(a.TO), pf: num(a.PF), pts: num(a.PTS),
    };
  };
  const raw = (av.statistics || []).map((s, i) => {
    const tm = s.teamSlug && teams[s.teamSlug];
    return { yr: s.season ? s.season.year : 0, season: s.season ? s.season.displayName : '', teamId: s.teamId ? String(s.teamId) : '', team: tm ? tm.abbreviation : '',
      pos: s.position || '', total: !s.teamId, ...line(s.stats, ((tot.statistics || [])[i] || {}).stats) };
  });
  const rows = [];
  [...new Set(raw.map(r => r.yr))].forEach(yr => {
    const of = raw.filter(r => r.yr === yr), parts = of.filter(r => !r.total), sum = of.find(r => r.total);
    if (sum && parts.length > 1) rows.push({ ...sum, team: `${parts.length}TM`, pos: parts[parts.length - 1].pos }, ...parts.map(p => ({ ...p, part: true })));
    else rows.push(...(parts.length ? parts : of));
  });
  return { rows, career: av.totals ? line(av.totals, tot.totals) : null, seasons: new Set(rows.map(r => r.yr)).size };
}
function catValues(defs, cats) {
  const v = {};
  (cats || []).forEach((c, i) => {
    const names = (defs.find(x => x.name === c.name) || defs[i] || {}).names || [];
    // values are full precision; totals are ESPN's rounded display strings
    const vals = c.values || c.totals || [];
    names.forEach((n, k) => { v[n] = f(vals[k]); });
  });
  return v;
}
function parsePlayers(j) {
  const defs = j.categories || [];
  return (j.athletes || []).map(a => {
    const p = a.athlete || {}, v = catValues(defs, a.categories);
    const o = {
      id: String(p.id), name: p.displayName || '', short: p.shortName || p.displayName || '', teamId: String(p.teamId || ''),
      team: p.teamShortName || '', pos: (p.position && p.position.abbreviation) || '', age: p.age, headshot: headshotOf(p.headshot),
      gp: v.gamesPlayed, min: v.avgMinutes, pts: v.avgPoints, reb: v.avgRebounds, ast: v.avgAssists, stl: v.avgSteals, blk: v.avgBlocks,
      tov: v.avgTurnovers, pf: v.avgFouls, fgm: v.avgFieldGoalsMade, fga: v.avgFieldGoalsAttempted, fgp: v.fieldGoalPct,
      tpm: v.avgThreePointFieldGoalsMade, tpa: v.avgThreePointFieldGoalsAttempted, tpp: v.threePointFieldGoalPct,
      ftm: v.avgFreeThrowsMade, fta: v.avgFreeThrowsAttempted, ftp: v.freeThrowPct, dd: v.doubleDouble, td: v.tripleDouble,
      tot: { pts: v.points, reb: v.rebounds, ast: v.assists, stl: v.steals, blk: v.blocks, tov: v.turnovers, min: v.minutes, fgm: v.fieldGoalsMade, fga: v.fieldGoalsAttempted, tpm: v.threePointFieldGoalsMade, tpa: v.threePointFieldGoalsAttempted, ftm: v.freeThrowsMade, fta: v.freeThrowsAttempted, pf: v.fouls },
    };
    o.ts = o.fga + o.fta > 0 ? o.pts / (2 * (o.fga + .44 * o.fta)) * 100 : NaN;
    o.efg = o.fga > 0 ? (o.fgm + .5 * o.tpm) / o.fga * 100 : NaN;
    o.pra = o.pts + o.reb + o.ast;
    o.stocks = o.stl + o.blk;
    o.astTo = o.tov > 0 ? o.ast / o.tov : (o.ast > 0 ? o.ast : NaN);
    o.tot.pra = o.tot.pts + o.tot.reb + o.tot.ast;
    o.tot.stocks = o.tot.stl + o.tot.blk;
    return o;
  });
}
function parseTeamStats(j) {
  const defs = j.categories || [];
  const LOWER = new Set(['oppg', 'tov', 'oppFgp', 'opp3p', 'drtg']);
  const list = (j.teams || []).map(t => {
    const own = {}, opp = {};
    (t.categories || []).forEach((c, i) => {
      const d = defs[i] || {};
      const isOpp = !(d.names && d.names.length);
      const names = isOpp ? ((defs[i - 1] || {}).names || []) : d.names;
      const vals = c.values || c.totals || [];
      names.forEach((n, k) => { (isOpp ? opp : own)[n] = f(vals[k]); });
    });
    return {
      id: String(t.team.id), abbr: t.team.abbreviation, name: t.team.shortDisplayName || t.team.displayName,
      gp: own.gamesPlayed, ppg: own.avgPoints, oppg: opp.avgPoints, diff: own.avgPoints - opp.avgPoints,
      fgp: own.fieldGoalPct, tpp: own.threePointFieldGoalPct, ftp: own.freeThrowPct,
      rpg: own.avgRebounds, apg: own.avgAssists, tov: own.avgTurnovers, spg: own.avgSteals, bpg: own.avgBlocks,
      orpg: own.avgOffensiveRebounds, tpm: own.avgThreePointFieldGoalsMade, tpa: own.avgThreePointFieldGoalsAttempted,
      fta: own.avgFreeThrowsAttempted, oppFgp: opp.fieldGoalPct, opp3p: opp.threePointFieldGoalPct,
      // Possessions per game, the standard estimate (FGA - OREB + TOV + 0.44 x FTA), averaged with the opponents' count
      pace: ((own.avgFieldGoalsAttempted - own.avgOffensiveRebounds + own.avgTurnovers + .44 * own.avgFreeThrowsAttempted)
        + (opp.avgFieldGoalsAttempted - opp.avgOffensiveRebounds + opp.avgTurnovers + .44 * opp.avgFreeThrowsAttempted)) / 2,
    };
  }).map(t => Object.assign(t, { ortg: t.ppg / t.pace * 100, drtg: t.oppg / t.pace * 100, net: (t.ppg - t.oppg) / t.pace * 100 }));
  const keys = ['ppg', 'oppg', 'diff', 'fgp', 'tpp', 'ftp', 'rpg', 'apg', 'tov', 'spg', 'bpg', 'orpg', 'tpm', 'tpa', 'oppFgp', 'opp3p', 'ortg', 'drtg', 'net', 'pace'];
  keys.forEach(k => {
    const sorted = list.slice().sort((a, b) => LOWER.has(k) ? a[k] - b[k] : b[k] - a[k]);
    sorted.forEach((t, i) => { t.rank = t.rank || {}; t.rank[k] = i + 1; });
  });
  return list;
}
const cleanMarket = s => String(s || '').replace(/[‎‏]/g, '').replace(/^NBA\s*-\s*/, '').replace(/^NBA\s+/, '')
  .replace('In-Season Tournament', 'NBA Cup').replace('In-Season', 'NBA Cup').trim();
function parseFutures(j) {
  return (j.items || []).map(it => {
    const fu = (it.futures || [])[0] || {};
    const entries = (fu.books || []).map(b => {
      const ref = (b.team && b.team.$ref) || (b.athlete && b.athlete.$ref) || '';
      const m = ref.match(/\/(teams|athletes)\/(\d+)/);
      return { kind: m ? (m[1] === 'teams' ? 'team' : 'athlete') : '', id: m ? m[2] : '', odds: b.value, implied: NBA.implied(b.value) };
    }).filter(e => e.id).sort((a, b) => b.implied - a.implied);
    return { id: String(it.id), name: cleanMarket(it.name || it.displayName), provider: (fu.provider && fu.provider.name) || 'Sportsbook', entries };
  }).filter(m => m.entries.length);
}
function parseInjuries(j) {
  return (j.injuries || []).map(t => ({
    teamId: String(t.id), teamName: t.displayName,
    list: (t.injuries || []).map(i => {
      const a = i.athlete || {}, d = i.details || {};
      // The injury feed leaves out the athlete id, so read it from the player card link or the headshot URL
      const aid = a.id || [...(a.links || []).map(l => l.href), (a.headshot || {}).href].map(h => (/\/id\/(\d+)|\/(\d+)\.png/.exec(h || '') || []).slice(1).find(Boolean)).find(Boolean);
      return {
        id: String(aid || i.id), name: a.displayName || '', pos: a.position && a.position.abbreviation, headshot: headshotOf(a.headshot),
        status: i.status || (i.type && i.type.description) || '', date: i.date,
        type: d.type || '', detail: d.detail || '', side: d.side && d.side !== 'Not Specified' ? d.side : '', ret: d.returnDate || '',
        short: i.shortComment || '', long: i.longComment || '',
      };
    }),
  })).filter(t => t.list.length);
}
/* ESPN's roster plus data/extras.json, which a daily GitHub Action builds from other sites: this and future seasons'
   salaries (with option years) where ESPN hasn't posted them, and wingspans */
function parseRoster(j, extras) {
  const more = (extras && extras.players) || {};
  return {
    coach: j.coach ? `${j.coach.firstName || ''} ${j.coach.lastName || ''}`.trim() : '',
    standing: j.team && j.team.standingSummary, record: j.team && j.team.recordSummary,
    players: (j.athletes || []).map(a => {
      const x = more[String(a.id)] || {};
      // This season's salary from ESPN's contract list, or the current deal when the list hasn't caught up
      const espn = ((a.contracts || []).find(c => c.season && c.season.year === NBA.SEASON) || {}).salary
        || (a.contract && a.contract.season && a.contract.season.year === NBA.SEASON && a.contract.salary) || 0;
      // Seasons still to be paid, counting this one: [season year, salary, option] with option P (player) or T (team).
      // These win over ESPN's figure, which is out of date for some players who signed new deals. In late summer
      // Basketball-Reference moves to the next season before the site does; until then its years are left out.
      const future = extras && extras.season > NBA.SEASON ? [] : (x.pay || []).filter(p => p[0] >= NBA.SEASON).sort((p, q) => p[0] - q[0]);
      const now = future.find(p => p[0] === NBA.SEASON);
      const pay = (a.contracts || []).filter(c => c.season && c.salary && !(now && c.season.year === NBA.SEASON)).map(c => ({ yr: c.season.year, salary: c.salary }));
      if (now) pay.push({ yr: NBA.SEASON, salary: now[1] });
      return {
        id: String(a.id), name: a.displayName, jersey: a.jersey, pos: a.position && a.position.abbreviation, age: a.age,
        ht: a.displayHeight, wt: a.displayWeight, exp: a.experience && a.experience.years, college: a.college && (a.college.shortName || a.college.name),
        injury: a.injuries && a.injuries[0] ? a.injuries[0].status : '', headshot: headshotOf(a.headshot),
        salary: (now && now[1]) || espn || 0,
        salaryFrom: now ? (extras.sources && extras.sources.salary) || 'extras' : espn ? 'ESPN' : '',
        gtd: now && x.gtd != null ? x.gtd : null,
        // An active deal with no salary is a two-way contract, which doesn't count against the cap
        deal: !!(a.contract && a.contract.active) || !!now,
        // Wingspan with the barefoot height from the same measurement (ESPN's listed height is in shoes)
        htIn: a.height || 0, wingIn: x.wing || 0, wingHt: x.wht || 0,
        first: a.firstName || '', last: a.lastName || '', dob: a.dateOfBirth || '',
        born: a.birthPlace ? [a.birthPlace.city, a.birthPlace.state || a.birthPlace.country].filter(Boolean).join(', ') : '',
        // Seasons left on the deal, counting this one, and every season's salary on record
        years: future.length || (a.contract && a.contract.active ? a.contract.yearsRemaining || 0 : 0),
        future, pay: pay.sort((p, q) => p.yr - q.yr),
      };
    }),
  };
}

/* ---------- resources ---------- */
NBA.bumps = new Set();
const prevScores = new Map();
// A past day whose games are all over can't change, so it keeps for 12 hours
def('day', (p, d) => !p ? 60000 : d && NBA.isoFromParam(p) < NBA.today && d.games.every(g => g.state === 'post') ? 12 * 3600000 : 30 * 60000, async p => {
  let j = await getJSON(API + '/scoreboard' + (p ? '?dates=' + p : ''));
  if (!p) {
    // ESPN keeps showing last night's games until mid-morning. From 3 AM Eastern, "today" is the new day's slate.
    const now = new Date(), etDate = NBA.etDay(now);
    const etHour = +now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' });
    if (j.day && j.day.date && j.day.date < etDate && etHour >= 3) {
      const next = await getJSON(API + '/scoreboard?dates=' + etDate.replace(/-/g, ''));
      next.day = { date: etDate };
      if (!next.leagues && j.leagues) next.leagues = j.leagues;
      j = next;
    }
  }
  const games = (j.events || []).map(parseGame);
  games.forEach(g => [g.away, g.home].forEach(mergeTeam));
  const season = j.leagues && j.leagues[0] && j.leagues[0].season;
  if (season && season.type && (season.type.type === 2 || season.type.type === 3)) NBA.seasonType = season.type.type;
  if (!p) {
    if (j.day && j.day.date) {
      NBA.today = j.day.date;
      // A later day picked on the Schedule that has since become today goes back to the live board, which polls every 10 s
      if (NBA.dayParam === NBA.paramOf(NBA.today)) NBA.dayParam = '';
    }
    // Every date with games this season (ET), used to lay out the rest-of-season list
    const cal = j.leagues && j.leagues[0] && j.leagues[0].calendar;
    if (Array.isArray(cal) && cal.length) NBA.calendar = cal.map(c => String((c && c.date) || c).slice(0, 10));
    const bumps = new Set();
    games.forEach(g => [g.away, g.home].forEach(t => {
      const k = g.id + ':' + t.id, prev = prevScores.get(k);
      if (prev != null && prev !== t.score && g.state === 'in') bumps.add(k);
      prevScores.set(k, t.score);
    }));
    NBA.bumps = bumps;
  }
  return { day: (j.day && j.day.date) || NBA.isoFromParam(p), games };
});
/* A whole month of games in one request (about 230 KB compressed), grouped by ESPN's ET game day */
def('month', 2 * 3600000, async ym => {
  const j = await getJSON(`${API}/scoreboard?dates=${ym}&limit=500`, 60000);
  const days = {};
  (j.events || []).map(parseGame).forEach(g => { const d = NBA.etDay(g.date); (days[d] = days[d] || []).push(g); });
  return { ym, days };
});
def('standings', 10 * 60000, async () => {
  const conf = parseStandings(await getJSON(`https://site.api.espn.com/apis/v2/sports/basketball/nba/standings`));
  conf.forEach(c => c.rows.forEach(r => mergeTeam({ id: r.id, abbr: r.abbr, name: r.name, full: r.full, location: r.location, logo: r.logo, logoDark: r.logoDark, conf: r.conf })));
  return conf;
});
def('news', 5 * 60000, async team => (await getJSON(`${API}/news?limit=${team ? 12 : 40}${team ? '&team=' + team : ''}`)).articles || []);
def('injuries', 10 * 60000, async () => parseInjuries(await getJSON(`${API}/injuries`)));
def('players', 30 * 60000, async () => parsePlayers(await getJSON(`${WEB}/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=false&page=1&limit=1000&sort=offensive.avgPoints%3Adesc&season=${NBA.SEASON}&seasontype=${NBA.seasonType}`, 60000)));
/* The core leaders feed: 100 PER rows, deep enough for the view to keep only rotation players.
   Rows carry the player id only; names and headshots come from NBA.playerById */
def('per', 30 * 60000, async () => {
  const j = await getJSON(`${CORE}/seasons/${NBA.SEASON}/types/${NBA.seasonType}/leaders?limit=100`);
  const cat = (j.categories || []).find(c => c.name === 'PER');
  return cat ? (cat.leaders || []).map(l => ({ id: (/athletes\/(\d+)/.exec((l.athlete && l.athlete.$ref) || '') || [])[1] || '', value: l.value, display: l.displayValue })).filter(r => r.id) : [];
});
def('teamstats', 30 * 60000, async () => parseTeamStats(await getJSON(`${WEB}/common/v3/sports/basketball/nba/statistics/byteam?region=us&lang=en&season=${NBA.SEASON}&seasontype=${NBA.seasonType}`)));
def('futures', 15 * 60000, async () => parseFutures(await getJSON(`${CORE}/seasons/${NBA.SEASON}/futures?limit=100`)));
def('athlete', 24 * 3600000, async id => {
  let a;
  try { a = await getJSON(`${CORE}/seasons/${NBA.SEASON}/athletes/${id}?lang=en&region=us`); }
  catch (e) { a = await getJSON(`${CORE}/seasons/${NBA.SEASON}/coaches/${id}?lang=en&region=us`); a.coach = true; }
  const tm = a.team && a.team.$ref && a.team.$ref.match(/teams\/(\d+)/);
  const name = a.displayName || a.fullName || [a.firstName, a.lastName].filter(Boolean).join(' ');
  return { id, name, short: a.shortName || name, headshot: headshotOf(a.headshot), teamId: tm ? tm[1] : '', coach: !!a.coach };
});
// The feed is about 820 KB, so it isn't sped up during games: Home, Schedule and team pages lay the live state
// from the 10 s scoreboard over it
def('tsched', 15 * 60000, async id => {
  const j = await getJSON(`${API}/teams/${id}/schedule?season=${NBA.SEASON}`);
  // Names and logo too, so a team page renders even when no scoreboard or standings have it
  if (j.team) mergeTeam({ id: String(id), abbr: j.team.abbreviation, name: j.team.shortDisplayName || j.team.name, full: j.team.displayName, location: j.team.location, logo: j.team.logo });
  // The schedule feed carries the team's main color, a fallback for the team-colors theme
  const reg = NBA.teams.get(String(id));
  if (j.team && j.team.color && !(reg && reg.color && reg.color !== '#888888')) mergeTeam({ id: String(id), color: '#' + j.team.color });
  return { standing: j.team && j.team.standingSummary, record: j.team && j.team.recordSummary, events: parseSchedule(j, id) };
});
// A roster built without data/extras.json is rebuilt after 5 minutes instead of an hour, in case it has turned up
def('roster', (id, d) => d && d.noExtras ? 5 * 60000 : 60 * 60000, async id => {
  const [j, extras] = await Promise.all([getJSON(`${API}/teams/${id}/roster`), need('extras').catch(() => NBA.data('extras') || null)]);
  if (j.team) mergeTeam({ id: String(id), abbr: j.team.abbreviation, name: j.team.shortDisplayName || j.team.name, full: j.team.displayName, location: j.team.location, logo: j.team.logo });
  return Object.assign(parseRoster(j, extras), { noExtras: !(extras && extras.updated) });
});
/* Built once a day by .github/workflows/extras.yml. Before its first run the file doesn't exist (404), which means
   ESPN alone, checked again in 5 minutes; any other failure retries in 30 seconds and keeps the last good copy. */
def('extras', (a, d) => d && d.updated ? 3 * 3600000 : 5 * 60000,
  () => getJSON('data/extras.json').catch(e => { if (e.message === 'HTTP 404') return { players: {} }; throw e; }));
/* Full game highlights, matched to ESPN game ids every 10 minutes on game nights by .github/workflows/highlights.yml.
   The list lives on the repo's highlights branch, which raw.githubusercontent.com serves with CORS and a 5-minute cache.
   Before the job's first run it doesn't exist (404): no highlights yet */
def('ythl', 5 * 60000, () => getJSON('https://raw.githubusercontent.com/dylpatty/shot-clock/highlights/highlights.json')
  .catch(e => { if (e.message === 'HTTP 404') return { games: {} }; throw e; }));
def('summary', (id, d) => (d && d.state === 'post' ? 6 * 3600000 : 15000), async id => parseSummary(await getJSON(`${API}/summary?event=${id}`), id));
// The matchup preview and injuries, on a 10-minute cache so Home never pulls the 15-second live summary
def('preview', 10 * 60000, async id => { const s = parseSummary(await getJSON(`${API}/summary?event=${id}`), id); return Object.assign({}, s.preview, { injuries: s.injuries }); });
/* ESPN BPI projections for all 30 teams, by team id. Each stat comes as value and, with a D suffix, display text:
   projectedw 42.706, probmakeplayoffsD '68.3%', probwintitleD '1.1%', sosremainingrankD '7th' */
def('bpi', 3600000, async () => {
  const j = await getJSON(`${CORE}/seasons/${NBA.SEASON}/powerindex?limit=30`);
  const m = new Map();
  (j.items || []).forEach(it => {
    const id = /teams\/(\d+)/.exec((it.team && it.team.$ref) || '');
    if (!id) return;
    const s = {}; (it.stats || []).forEach(x => { s[x.name] = x.value; s[x.name + 'D'] = x.displayValue; });
    m.set(id[1], s);
  });
  return m;
});
def('gamelog', 15 * 60000, async id => parseGameLog(await getJSON(`${WEB}/common/v3/sports/basketball/nba/athletes/${id}/gamelog?season=${NBA.SEASON}`)));
// 'career:<id>.2' is the regular season, 'career:<id>.3' the playoffs
def('career', 30 * 60000, async arg => {
  const [id, type] = arg.split('.');
  // ESPN answers 404 for a player with no stats at all, and for one with no playoff games it sends regular-season stats
  const j = await getJSON(`${WEB}/common/v3/sports/basketball/nba/athletes/${id}/stats?region=us&lang=en&contentorigin=espn&seasontype=${type === '3' ? 3 : 2}`)
    .catch(e => { if (e.message === 'HTTP 404') return {}; throw e; });
  const got = ((j.filters || []).find(f => f.name === 'seasontype') || {}).value;
  return type === '3' && got != null && String(got) !== '3' ? parseCareer({}) : parseCareer(j);
});
// Awards a player has won, by season: ESPN lists links, one request per award. The list changes a few times a year,
// so it's kept in this browser for a week (the 40 most recent players)
def('awards', 24 * 3600000, async id => {
  const KEY = 'nba.awards.v1', all = readJSON(KEY) || {}, hit = all[id];
  if (hit && Array.isArray(hit.list) && Date.now() - hit.t < 7 * 864e5) return hit.list;
  const j = await getJSON(`${CORE}/athletes/${id}/awards?lang=en&limit=200`);
  const items = await Promise.all((j.items || []).map(i => getJSON(String(i.$ref).replace(/^http:/, 'https:')).catch(() => null)));
  const list = items.filter(Boolean).map(a => ({ yr: +((/seasons\/(\d{4})/.exec((a.season && a.season.$ref) || '') || [])[1] || 0), name: a.name || '' })).filter(a => a.yr && a.name);
  // A partial list (some award lookups failed) isn't saved, so the next visit tries again
  if (items.every(Boolean)) {
    all[id] = { t: Date.now(), list };
    const keep = Object.entries(all).sort((a, b) => b[1].t - a[1].t).slice(0, 40);
    try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(keep))); } catch (e) { /* storage full or blocked */ }
  }
  return list;
});
/* Season plus-minus per player (ESPN keeps it only in per-player season stats) */
def('pm', 6 * 3600000, async id => {
  const j = await getJSON(`${CORE}/seasons/${NBA.SEASON}/types/${NBA.seasonType}/athletes/${id}/statistics/0?lang=en&region=us`);
  const gen = ((j.splits && j.splits.categories) || []).find(c => c.name === 'general') || {};
  const s = (gen.stats || []).find(x => x.name === 'plusMinus');
  return s ? s.value : null;
});
/* Plus-minus leaders: rotation players only (20+ minutes, enough games), cached in this browser for 6 hours.
   An empty list (before opening night) is checked again in 5 minutes and never saved. */
def('pmlead', (a, d) => (d && d.length ? 6 * 3600000 : 5 * 60000), async () => {
  const CACHE = 'nba.pm.v1';
  const cached = readJSON(CACHE);
  if (cached && cached.season === NBA.SEASON && cached.rows && cached.rows.length && Date.now() - cached.t < 6 * 3600000) return cached.rows;
  await Promise.all([need('players'), need('standings')]);
  const sm = NBA.standingsMap();
  const cands = (NBA.players() || []).filter(p => p.min >= 20 && NBA.qualifies(p, null, sm));
  const rows = [];
  let failed = 0;
  for (let i = 0; i < cands.length; i += 8) {
    const chunk = await Promise.allSettled(cands.slice(i, i + 8).map(p => need('pm:' + p.id).then(v => ({ p, v }))));
    chunk.forEach(c => { if (c.status !== 'fulfilled') failed++; else if (c.value.v != null) rows.push({ id: c.value.p.id, total: c.value.v, gp: c.value.p.gp }); });
  }
  // Too many lookups failed (network drop, rate limit): show the error and retry in 30 s rather than keep a list missing leaders.
  // The lookups that worked stay cached, so the retry only fetches the rest.
  if (failed > cands.length * .1) throw new Error("Couldn't get plus-minus for every player from ESPN. Try again shortly.");
  if (rows.length) { try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), season: NBA.SEASON, rows })); } catch (e) { /* storage full or blocked */ } }
  return rows;
});

/* ---------- derived data ---------- */
NBA.standingsMap = () => {
  const m = new Map();
  (NBA.data('standings') || []).forEach(c => c.rows.forEach(r => m.set(r.id, r)));
  return m;
};
NBA.players = () => NBA.data('players');
NBA.playerById = id => (NBA.players() || []).find(p => p.id === String(id));
NBA.findPlayers = text => {
  const s = ' ' + String(text).toLowerCase().replace(/[^a-z0-9' .-]/g, ' ') + ' ';
  const list = NBA.players() || [];
  const hits = list.filter(p => {
    const full = p.name.toLowerCase();
    if (full.length > 3 && s.includes(full)) return true;
    const last = full.split(' ').slice(-1)[0];
    return last.length > 3 && new RegExp(`[^a-z]${last.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}('s)?[^a-z]`).test(s);
  });
  return hits.sort((a, b) => (s.includes(b.name.toLowerCase()) - s.includes(a.name.toLowerCase())) || b.pts - a.pts);
};
NBA.athleteInfo = id => {
  const p = NBA.playerById(id);
  if (p) return { id: p.id, name: p.name, short: p.short, headshot: p.headshot, teamId: p.teamId };
  return NBA.use('athlete:' + id);
};

/* Stat definitions shared by the Stats tab, team pages and the search bar */
NBA.STATS = {
  pts: { label: 'Points', short: 'PTS', game: p => p.pts, total: p => p.tot.pts },
  reb: { label: 'Rebounds', short: 'REB', game: p => p.reb, total: p => p.tot.reb },
  ast: { label: 'Assists', short: 'AST', game: p => p.ast, total: p => p.tot.ast },
  stl: { label: 'Steals', short: 'STL', game: p => p.stl, total: p => p.tot.stl },
  blk: { label: 'Blocks', short: 'BLK', game: p => p.blk, total: p => p.tot.blk },
  tpm: { label: '3-pointers made', short: '3PM', game: p => p.tpm, total: p => p.tot.tpm },
  fgp: { label: 'Field goal %', short: 'FG%', pct: true, qual: 'fg', game: p => p.fgp, total: p => p.fgp },
  tpp: { label: '3-point %', short: '3P%', pct: true, qual: '3p', game: p => p.tpp, total: p => p.tpp },
  ftp: { label: 'Free throw %', short: 'FT%', pct: true, qual: 'ft', game: p => p.ftp, total: p => p.ftp },
  ts: { label: 'True shooting %', short: 'TS%', pct: true, qual: 'fg', game: p => p.ts, total: p => p.ts },
  efg: { label: 'Effective FG %', short: 'eFG%', pct: true, qual: 'fg', game: p => p.efg, total: p => p.efg },
  pra: { label: 'Points + rebounds + assists', short: 'PRA', game: p => p.pra, total: p => p.tot.pra },
  stocks: { label: 'Steals + blocks', short: 'STK', game: p => p.stocks, total: p => p.tot.stocks },
  astTo: { label: 'Assist-to-turnover ratio', short: 'AST/TO', dec: 2, qual: 'ast', game: p => p.astTo, total: p => p.astTo },
  min: { label: 'Minutes', short: 'MIN', game: p => p.min, total: p => p.tot.min, dec: 1 },
  tov: { label: 'Turnovers', short: 'TOV', game: p => p.tov, total: p => p.tot.tov },
  pf: { label: 'Personal fouls', short: 'PF', game: p => p.pf, total: p => p.tot.pf },
  fgm: { label: 'Field goals made', short: 'FGM', game: p => p.fgm, total: p => p.tot.fgm },
  ftm: { label: 'Free throws made', short: 'FTM', game: p => p.ftm, total: p => p.tot.ftm },
  dd: { label: 'Double-doubles', short: 'DD', count: true, game: p => p.dd, total: p => p.dd },
  td: { label: 'Triple-doubles', short: 'TD', count: true, game: p => p.td, total: p => p.td },
  gp: { label: 'Games played', short: 'GP', count: true, game: p => p.gp, total: p => p.gp },
};
NBA.statValue = (key, p, mode) => { const d = NBA.STATS[key]; return d ? d[mode === 'total' ? 'total' : 'game'](p) : NaN; };
NBA.statFmt = (key, v, mode) => {
  const d = NBA.STATS[key] || {};
  if (!Number.isFinite(v)) return '–';
  if (d.pct) return v.toFixed(1) + '%';
  if (d.count || mode === 'total') return String(Math.round(v));
  return v.toFixed(d.dec ?? 1);
};
function teamGames(id, sm) { const r = sm.get(id); return r ? r.w + r.l : 0; }
/* NBA qualification rules, pro-rated to games played so far */
NBA.qualifies = (p, qual, sm) => {
  sm = sm || NBA.standingsMap();
  const all = NBA.players() || [];
  const tg = teamGames(p.teamId, sm) || Math.max(1, ...all.map(x => x.gp || 0));
  if (p.gp < Math.max(1, Math.ceil(tg * .7))) return false;
  if (qual === 'fg') return p.tot.fgm >= tg * 3.66;
  if (qual === '3p') return p.tot.tpm >= tg * 1.0;
  if (qual === 'ft') return p.tot.ftm >= tg * 1.52;
  if (qual === 'ast') return p.ast >= 3;
  return true;
};
NBA.leaders = ({ stat = 'pts', mode = 'game', limit = 10, teamId, conf, pos, lowest } = {}) => {
  const all = NBA.players() || [];
  const d = NBA.STATS[stat];
  if (!d) return [];
  const sm = NBA.standingsMap();
  let list = all.filter(p => Number.isFinite(NBA.statValue(stat, p, mode)));
  if (teamId) list = list.filter(p => p.teamId === String(teamId));
  if (conf) list = list.filter(p => (sm.get(p.teamId) || NBA.T(p.teamId)).conf === conf);
  if (pos) list = list.filter(p => p.pos && p.pos.toUpperCase().includes(pos.toUpperCase()));
  if (!teamId && (mode === 'game' || d.pct || d.qual)) list = list.filter(p => NBA.qualifies(p, d.qual, sm));
  if (teamId && (d.pct || d.qual)) {
    const tg = teamGames(String(teamId), sm) || Math.max(1, ...list.map(p => p.gp || 0));
    list = list.filter(p => p.gp >= Math.max(1, Math.ceil(tg / 2)) && (d.qual === 'fg' ? p.fga >= 5 : d.qual === '3p' ? p.tpa >= 2.5 : d.qual === 'ft' ? p.fta >= 2 : true));
  }
  list.sort((a, b) => lowest ? NBA.statValue(stat, a, mode) - NBA.statValue(stat, b, mode) : NBA.statValue(stat, b, mode) - NBA.statValue(stat, a, mode));
  return list.slice(0, limit);
};

/* Team results over the last N days from the daily scoreboards; pass NBA.use as `get` to also start missing loads */
NBA.recentForm = (days = 7, get = NBA.data) => {
  const keys = Array.from({ length: days }, (_, i) => i === 0 ? 'day:' : 'day:' + NBA.paramOf(NBA.shiftIso(NBA.today, -i)));
  const seen = new Set(), map = new Map();
  keys.map(k => get(k)).filter(Boolean).flatMap(d => d.games).filter(g => NBA.isFinal(g) && !seen.has(g.id) && seen.add(g.id))
    .forEach(g => [[g.away, g.home], [g.home, g.away]].forEach(([t, o]) => {
      const a = map.get(t.id) || { w: 0, l: 0, pf: 0, pa: 0, gp: 0 };
      a.gp++; a.pf += +t.score; a.pa += +o.score;
      if (+t.score > +o.score) a.w++; else a.l++;
      map.set(t.id, a);
    }));
  return map;
};
/* Every team with ratings per 100 possessions, last-7-days form and trend vs. season margin; null until team stats load */
NBA.powerRows = (get = NBA.data) => {
  const ts = get('teamstats');
  if (!ts) return null;
  const sm = NBA.standingsMap(), form = NBA.recentForm(7, get);
  return ts.map(t => {
    const r = sm.get(t.id) || {}, fm0 = form.get(t.id);
    const fm = fm0 && fm0.gp ? (fm0.pf - fm0.pa) / fm0.gp : null, season = r.diff ?? t.diff;
    return Object.assign({}, t, { w: r.w, l: r.l, strk: r.strk, f: fm0, fm, trend: fm == null ? null : fm - season, season });
  });
};

/* Box-score totals over recent days, for "best player last week" questions */
const GAME_SCORE = s => s.pts + .4 * s.fgm - .7 * s.fga - .4 * (s.fta - s.ftm) + .7 * s.oreb + .3 * s.dreb + s.stl + .7 * s.ast + .7 * s.blk - .4 * s.pf - s.tov;
NBA.recentPerformances = async ({ days = 7, conf, teamId, limit = 15, sort = 'gameScore' } = {}) => {
  await need('standings').catch(() => {});
  const end = NBA.today;
  const dates = Array.from({ length: days }, (_, i) => NBA.shiftIso(end, -i));
  const boards = await Promise.allSettled(dates.map(iso => need('day:' + (iso === NBA.today ? '' : NBA.paramOf(iso)))));
  const games = boards.flatMap(b => b.status === 'fulfilled' && b.value ? b.value.games : []).filter(g => g.state !== 'pre');
  const ids = [...new Set(games.map(g => g.id))];
  const sums = [];
  for (let i = 0; i < ids.length; i += 6) {
    const chunk = await Promise.allSettled(ids.slice(i, i + 6).map(id => need('summary:' + id)));
    chunk.forEach(c => { if (c.status === 'fulfilled' && c.value) sums.push(c.value); });
  }
  const agg = new Map();
  sums.forEach(s => s.box.forEach(b => {
    const k = key => b.keys.indexOf(key);
    b.players.filter(p => !p.dnp).forEach(p => {
      const g = i => (i < 0 ? 0 : f(p.stats[i]));
      const pair = i => { const m = String(p.stats[i] || '').match(/(\d+)-(\d+)/); return m ? [+m[1], +m[2]] : [0, 0]; };
      const fg = pair(k('fieldGoalsMade-fieldGoalsAttempted')), tp = pair(k('threePointFieldGoalsMade-threePointFieldGoalsAttempted')), ft = pair(k('freeThrowsMade-freeThrowsAttempted'));
      const line = {
        min: g(k('minutes')), pts: g(k('points')), reb: g(k('rebounds')), ast: g(k('assists')), stl: g(k('steals')), blk: g(k('blocks')),
        tov: g(k('turnovers')), pf: g(k('fouls')), oreb: g(k('offensiveRebounds')), dreb: g(k('defensiveRebounds')), pm: g(k('plusMinus')),
        fgm: fg[0], fga: fg[1], tpm: tp[0], tpa: tp[1], ftm: ft[0], fta: ft[1],
      };
      if (!line.min && !line.pts) return;
      let a = agg.get(p.id);
      if (!a) { a = { id: p.id, name: p.full, teamId: b.teamId, gp: 0, best: 0, t: {} }; agg.set(p.id, a); }
      a.gp++;
      Object.keys(line).forEach(x => { a.t[x] = (a.t[x] || 0) + line[x]; });
      const gs = GAME_SCORE(line);
      a.gs = (a.gs || 0) + gs;
      if (line.pts > a.best) a.best = line.pts;
    });
  }));
  const sm = NBA.standingsMap();
  let list = [...agg.values()].map(a => {
    const per = x => a.t[x] / a.gp;
    return {
      id: a.id, name: a.name, team: NBA.T(a.teamId).abbr, teamId: a.teamId, conf: (sm.get(a.teamId) || NBA.T(a.teamId)).conf, gp: a.gp,
      pts: per('pts'), reb: per('reb'), ast: per('ast'), stl: per('stl'), blk: per('blk'), tov: per('tov'), min: per('min'), pm: per('pm'),
      fgPct: a.t.fga ? a.t.fgm / a.t.fga * 100 : NaN, tpm: per('tpm'), gameScore: a.gs / a.gp, bestPts: a.best,
    };
  });
  if (teamId) list = list.filter(x => x.teamId === String(teamId));
  if (conf) list = list.filter(x => x.conf === conf);
  const maxGp = Math.max(1, ...list.map(x => x.gp));
  list = list.filter(x => x.gp >= Math.min(2, maxGp));
  list.sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0));
  return { from: dates[dates.length - 1], to: end, games: ids.length, players: list.slice(0, limit) };
};

/* ---------- polling ---------- */
NBA.dayParam = '';
NBA.pollHooks = [];
let pollTimer = null;
function nextDelay() {
  const today = NBA.data('day:');
  const games = today ? today.games : [];
  const live = games.some(g => g.state === 'in');
  const soon = games.some(g => g.state === 'pre' && new Date(g.date) - Date.now() < 15 * 60000);
  const hookLive = NBA.pollHooks.some(h => h.live && h.live());
  return (live || soon || hookLive) ? NBA.S.refresh * 1000 : 120000;
}
NBA.nextDelay = nextDelay;
NBA.lastUpdate = 0;
NBA.failing = false;
// After a failed poll, try again in 3, 6, 12, 24 then 48 s (never later than the normal delay)
let fails = 0;
const BACKOFF = [3000, 6000, 12000, 24000, 48000];
// Lift every resource's 30 s retry lock, after a reconnect or resume
NBA.retryNow = () => RES.forEach(r => { r.retry = 0; });
NBA.poll = async () => {
  clearTimeout(pollTimer);
  if (!document.hidden) {
    const jobs = [need('day:', true).then(() => { NBA.lastUpdate = Date.now(); NBA.failing = false; fails = 0; }, () => { NBA.failing = true; fails++; })];
    if (NBA.dayParam) jobs.push(need('day:' + NBA.dayParam).catch(() => {}));
    NBA.pollHooks.forEach(h => { const p = h.run && h.run(); if (p) jobs.push(p.catch(() => {})); });
    await Promise.allSettled(jobs);
    NBA.changed();
  }
  // A poll started while this one waited (online, resume) also schedules one; keep only the last
  clearTimeout(pollTimer);
  const d = nextDelay();
  // The delay actually set, so the stale indicator in ui.js measures against the poll that's really coming
  NBA.pollDelay = fails ? Math.min(d, BACKOFF[Math.min(fails, BACKOFF.length) - 1]) : d;
  pollTimer = setTimeout(NBA.poll, NBA.pollDelay);
};
NBA.reschedule = () => { clearTimeout(pollTimer); NBA.pollDelay = nextDelay(); pollTimer = setTimeout(NBA.poll, NBA.pollDelay); };
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (NBA.failing) NBA.retryNow();
  // Repaint first, so the open tab's stale feeds load alongside the scoreboard
  NBA.changed();
  if (Date.now() - NBA.lastUpdate > NBA.S.refresh * 1000) NBA.poll();
});
window.addEventListener('online', () => { NBA.retryNow(); NBA.poll(); });
// Coming back from the back-forward cache (iOS Home Screen apps resume this way)
window.addEventListener('pageshow', e => { if (e.persisted) { NBA.retryNow(); NBA.poll(); } });
})();
