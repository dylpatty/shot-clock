/* Full game highlights: the NBA's own YouTube uploads, matched to ESPN game ids.
   Run by scripts/highlights.js; everything that touches the network comes in through get/post/exists,
   so the same code runs against saved pages in a browser. */

const YT = 'https://www.youtube.com';
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
// "Nightly Full Game Highlights | 2026-27 Season". Each season gets a new playlist, found by name on the channel
export const DEFAULT_PLAYLIST = { id: 'PLftRqjkDhxkg', season: '2026-27' };
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const pad = n => String(n).padStart(2, '0');
const DAY = 864e5;

export const etDay = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
export const shiftIso = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * DAY).toISOString().slice(0, 10);
// The season a date belongs to, as the NBA writes it: '2026-27' from September on
export const seasonLabel = d => { const dt = new Date(d), y = dt.getUTCFullYear(), m = dt.getUTCMonth(); const s = m >= 8 ? y : y - 1; return `${s}-${pad((s + 1) % 100)}`; };
// 'TRAIL BLAZERS', 'Trail Blazers' and 'Portland Trail Blazers' all compare by letters and digits only
export const norm = s => String(s || '').toUpperCase().replace(/^THE\s+/, '').replace(/[^A-Z0-9]/g, '');

/* ---------- reading YouTube pages ---------- */
// The JSON a YouTube page carries in `var ytInitialData = {...};`, read brace by brace (strings can hold braces)
export function initialData(html) {
  const m = /ytInitialData"?\]?\s*=\s*\{/.exec(html || '');
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0, inStr = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { try { return JSON.parse(html.slice(start, i + 1)); } catch (e) { return null; } }
  }
  return null;
}
export const clientVersion = html => (/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/.exec(html || '') || [])[1] || '2.20261029.11.00';

const text = t => !t ? '' : typeof t === 'string' ? t : t.content || t.simpleText || (t.runs || []).map(r => r.text).join('');
const durOf = s => { const p = String(s || '').trim().split(':').map(Number); return p.length > 1 && p.every(Number.isFinite) ? p.reduce((a, b) => a * 60 + b, 0) : 0; };
// The first value anywhere under o that passes test
function find(o, test) {
  if (!o || typeof o !== 'object') return undefined;
  if (test(o)) return o;
  for (const k in o) { const r = find(o[k], test); if (r !== undefined) return r; }
  return undefined;
}
const tokenIn = o => { const c = find(o, x => x.continuationCommand && typeof x.continuationCommand.token === 'string'); return c ? c.continuationCommand.token : null; };
const VIDEO_KEYS = ['videoRenderer', 'playlistVideoRenderer', 'gridVideoRenderer', 'compactVideoRenderer'];
const isVideo = x => !!x && typeof x === 'object' && ((x.lockupViewModel && x.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') || VIDEO_KEYS.some(k => x[k]) || (x.richItemRenderer && isVideo(x.richItemRenderer.content)));

/* Every video in a page or a continuation, in page order, and the token for the list's next page.
   Reads both the newer lockup layout and the older renderer layout, whichever YouTube sends */
export function listVideos(root) {
  const videos = [], seen = new Set();
  let token = null;
  const add = (id, title, dur) => { if (id && title && !seen.has(id)) { seen.add(id); videos.push({ id, title, dur }); } };
  (function visit(o) {
    if (Array.isArray(o)) {
      o.forEach(visit);
      // A list of videos ends with the request for its next page
      const last = o[o.length - 1];
      if (o.some(isVideo) && last && (last.continuationItemRenderer || last.continuationItemViewModel)) token = tokenIn(last) || token;
      return;
    }
    if (!o || typeof o !== 'object') return;
    const lk = o.lockupViewModel;
    if (lk && lk.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
      const badge = find(lk, x => x.thumbnailBadgeViewModel && /^\d+(:\d\d)+$/.test(x.thumbnailBadgeViewModel.text || ''));
      add(lk.contentId, text(lk.metadata && lk.metadata.lockupMetadataViewModel && lk.metadata.lockupMetadataViewModel.title), badge ? durOf(badge.thumbnailBadgeViewModel.text) : 0);
      return;
    }
    for (const k of VIDEO_KEYS) {
      const v = o[k];
      if (v && v.videoId) { add(v.videoId, text(v.title), +v.lengthSeconds || durOf(text(v.lengthText))); return; }
    }
    for (const k in o) visit(o[k]);
  })(root);
  return { videos, token };
}
// The channel's playlists, for finding next season's full game highlights
export function listPlaylists(root) {
  const out = [];
  (function visit(o) {
    if (!o || typeof o !== 'object') return;
    const lk = o.lockupViewModel;
    if (lk && lk.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST') { out.push({ id: lk.contentId, title: text(lk.metadata && lk.metadata.lockupMetadataViewModel && lk.metadata.lockupMetadataViewModel.title) }); return; }
    if (o.gridPlaylistRenderer) { out.push({ id: o.gridPlaylistRenderer.playlistId, title: text(o.gridPlaylistRenderer.title) }); return; }
    for (const k in o) visit(o[k]);
  })(root);
  return out;
}

/* 'LAKERS at WARRIORS | EMIRATES NBA CUP 🏆 | FULL GAME HIGHLIGHTS | October 30, 2026' gives both teams and the
   game's date. Neutral-site games use 'vs', playoff titles put seeds in front ('#1 THUNDER at #5 MAVERICKS') */
const DATE_RE = new RegExp(`\\b(${MONTHS.join('|')})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i');
const PAIR_RE = /^(?:#\d+\s+)?(.+?)\s+(?:at|vs\.?|v\.?|@)\s+(?:#\d+\s+)?(.+?)$/i;
export function parseTitle(title) {
  const t = String(title || '');
  let teams = null;
  for (const part of t.split(/\s*[|｜]\s*/)) {
    const m = PAIR_RE.exec(part.trim());
    if (m) { teams = [m[1], m[2]]; break; }
  }
  const d = DATE_RE.exec(t);
  return {
    teams, date: d ? `${d[3]}-${pad(MONTHS.indexOf(d[1].toLowerCase()) + 1)}-${pad(d[2])}` : null,
    full: /full game(?: \d+)? highlights/i.test(t),
  };
}

/* ---------- ESPN games ---------- */
export function espnGames(j) {
  return (j.events || []).map(ev => {
    const c = (ev.competitions || [])[0] || {}, st = (ev.status || c.status || {}).type || {};
    const side = h => {
      const x = (c.competitors || []).find(q => q.homeAway === h) || {}, t = x.team || {};
      return { name: t.name || t.shortDisplayName || '', names: [t.name, t.shortDisplayName, t.displayName, t.location, t.nickname, t.abbreviation].filter(Boolean).map(norm) };
    };
    return { id: String(ev.id), date: ev.date, state: st.state, done: !!st.completed, type: (ev.season && ev.season.type) || 2, away: side('away'), home: side('home') };
  });
}
const plays = (g, a, b) => (g.away.names.includes(a) && g.home.names.includes(b)) || (g.away.names.includes(b) && g.home.names.includes(a));
// The game a video title is about: same two teams, on the title's date or a day either side
export function gameFor(p, byDate) {
  if (!p.teams || !p.date) return null;
  const [a, b] = p.teams.map(norm);
  for (const d of [p.date, shiftIso(p.date, -1), shiftIso(p.date, 1)]) {
    const g = (byDate[d] || []).find(x => plays(x, a, b));
    if (g) return g;
  }
  return null;
}

/* ---------- one run ---------- */
// Waits between channel searches for a game that's still missing: 20 minutes, then doubling up to a day
const searchWait = n => Math.min(DAY, 20 * 60000 * 2 ** Math.max(0, n - 1));
// Finals are searched for once the NBA has had time to post: tip-off plus 3.5 hours
const POST_AFTER = 3.5 * 3600000;
const GIVE_UP = 14; // days

export async function buildHighlights({ get, post, exists, prev, now = new Date(), log = () => {}, warn = () => {}, maxSearches = 8 }) {
  const nowMs = +now, today = etDay(nowMs), season = seasonLabel(nowMs);
  const out = {
    updated: (prev && prev.updated) || null,
    playlist: (prev && prev.playlist && prev.playlist.id) ? prev.playlist : DEFAULT_PLAYLIST,
    from: (prev && prev.from) || null,
    games: Object.assign({}, prev && prev.games),
    done: Object.assign({}, prev && prev.done),
    tries: Object.assign({}, prev && prev.tries),
  };
  const report = { playlist: '', pages: 0, listed: 0, fresh: 0, matched: 0, unmatched: [], dates: 0, searched: 0, found: [], missing: [], youtube: true };
  const known = new Set(Object.values(out.games).map(g => g[0]));
  const before = JSON.stringify({ g: out.games, d: out.done });

  // 1. Each season has its own playlist: find this season's by name, once
  if (out.playlist.season !== season) {
    try {
      const lists = listPlaylists(initialData(await get(`${YT}/@NBA/playlists`)));
      const pl = lists.find(l => /full game highlights/i.test(l.title) && l.title.includes(season));
      if (pl) { out.playlist = { id: pl.id, season }; log(`This season's playlist: ${pl.title} (${pl.id})`); }
      else warn(`No "Full Game Highlights | ${season}" playlist on the NBA channel yet; still reading ${out.playlist.id}.`);
    } catch (e) { warn(`Couldn't read the NBA's playlists: ${e.message}`); }
  }
  report.playlist = out.playlist.id;

  // 2. The playlist, newest first. Further pages only while a whole page is new: the first run, or after a long outage
  const listed = [];
  try {
    const html = await get(`${YT}/playlist?list=${out.playlist.id}`);
    const cv = clientVersion(html);
    let page = listVideos(initialData(html));
    for (;;) {
      report.pages++;
      listed.push(...page.videos);
      const allNew = page.videos.length > 0 && page.videos.every(v => !known.has(v.id));
      if (!page.token || !allNew || report.pages >= 30) break;
      page = listVideos(await post(`${YT}/youtubei/v1/browse?prettyPrint=false`, { context: { client: { clientName: 'WEB', clientVersion: cv, hl: 'en', gl: 'US' } }, continuation: page.token }));
    }
    if (!listed.length) throw new Error('the playlist page had no videos in it');
  } catch (e) {
    report.youtube = false;
    warn(`Couldn't read the full game highlights playlist: ${e.message}`);
  }
  report.listed = listed.length;
  const fresh = listed.filter(v => !known.has(v.id)).map(v => Object.assign(v, parseTitle(v.title)));
  report.fresh = fresh.length;

  // 3. ESPN's games for every day that isn't settled yet, and for every day a new video is from
  const dates = new Set(fresh.map(v => v.date).filter(Boolean));
  if (!out.from) out.from = [...dates].sort()[0] || today;
  for (let d = out.from; d <= today; d = shiftIso(d, 1)) if (!out.done[d]) dates.add(d);
  // A video's day can be off by one from ESPN's, so its neighbors come along
  [...dates].forEach(d => { if (fresh.some(v => v.date === d)) [shiftIso(d, -1), shiftIso(d, 1)].forEach(x => { if (x <= today) dates.add(x); }); });
  const byDate = {};
  const list = [...dates].sort();
  for (let i = 0; i < list.length; i += 4) {
    await Promise.all(list.slice(i, i + 4).map(async d => {
      try { byDate[d] = espnGames(await get(`${ESPN}?dates=${d.replace(/-/g, '')}`, { json: true })); }
      catch (e) { warn(`ESPN's scoreboard for ${d} didn't load: ${e.message}`); }
    }));
  }
  report.dates = Object.keys(byDate).length;

  // 4. Match new videos to games, oldest first, so a re-upload (newer) replaces the first one
  const added = new Set();
  fresh.slice().reverse().forEach(v => {
    const g = gameFor(v, byDate);
    if (!g) { report.unmatched.push(v.title); return; }
    out.games[g.id] = [v.id, v.dur || 0];
    added.add(g.id);
    delete out.tries[g.id];
    report.matched++;
  });

  // 5. A final the playlist skipped: search the NBA channel for it, newest first, backing off between tries
  const games = Object.values(byDate).flat();
  const missing = games.filter(g => g.done && !out.games[g.id] && Date.parse(g.date) + POST_AFTER < nowMs).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  for (const g of missing) {
    if (report.searched >= maxSearches || !report.youtube) break;
    const [n = 0, last = 0] = out.tries[g.id] || [];
    if (n && nowMs - last < searchWait(n)) continue;
    report.searched++;
    out.tries[g.id] = [n + 1, nowMs];
    try {
      const q = `${g.away.name} at ${g.home.name} full game highlights`;
      const { videos } = listVideos(initialData(await get(`${YT}/@NBA/search?query=${encodeURIComponent(q)}`)));
      const day = etDay(g.date);
      const hit = videos.map(v => Object.assign(v, parseTitle(v.title)))
        .find(v => v.full && v.teams && v.date && Math.abs(Date.parse(v.date) - Date.parse(day)) <= DAY && plays(g, norm(v.teams[0]), norm(v.teams[1])));
      if (hit) { out.games[g.id] = [hit.id, hit.dur || 0]; added.add(g.id); delete out.tries[g.id]; report.found.push(hit.title); }
    } catch (e) { warn(`Channel search for ${g.away.name} at ${g.home.name} failed: ${e.message}`); }
  }

  // 6. Sharper thumbnails where YouTube has made one
  for (const id of added) {
    try { if (await exists(`https://i.ytimg.com/vi/${out.games[id][0]}/maxresdefault.jpg`)) out.games[id][2] = 1; } catch (e) { /* keep the standard one */ }
  }

  // 7. A day is settled once every final on it has its video. A missing one is given up on after two weeks, once
  // it has been searched for at least once. An empty day only counts once it's over, in case ESPN sent an empty board by mistake
  for (const d of Object.keys(byDate)) {
    const day = byDate[d];
    const open = day.filter(g => g.state !== 'post' || (g.done && !out.games[g.id]));
    const stale = d < shiftIso(today, -GIVE_UP) && open.every(g => !g.done || out.tries[g.id]);
    if ((!open.length && (day.length || d < today)) || stale) {
      if (open.length) warn(`Gave up on ${open.length} game(s) from ${d} with no full game highlights.`);
      out.done[d] = 1;
      day.forEach(g => delete out.tries[g.id]);
    }
  }
  report.missing = missing.filter(g => !out.games[g.id]).map(g => `${etDay(g.date)} ${g.away.name} at ${g.home.name}`);
  // Searches that stopped being needed (a game found some other way) are forgotten
  Object.keys(out.tries).forEach(id => { if (out.games[id]) delete out.tries[id]; });

  const changed = JSON.stringify({ g: out.games, d: out.done }) !== before || JSON.stringify(out.tries) !== JSON.stringify((prev && prev.tries) || {}) || JSON.stringify(out.playlist) !== JSON.stringify(prev && prev.playlist);
  if (JSON.stringify(out.games) !== JSON.stringify((prev && prev.games) || {})) out.updated = new Date(nowMs).toISOString();
  return { data: out, changed, report, ok: report.youtube };
}
