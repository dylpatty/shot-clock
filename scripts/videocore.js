/* The Videos feature: recent uploads from the NBA's team channels, the league, analysis and podcast channels on
   YouTube, sorted into interviews, breakdowns, podcasts, highlights and features and tagged with the teams they're
   about. Run by scripts/videos.js; everything that touches the network comes in through get, so the same code runs
   against saved pages. The site matches videos to games and team pages itself (js/videos.js) */
import { initialData } from './hlcore.js';

const YT = 'https://www.youtube.com';
const HOUR = 3600000, DAY = 24 * HOUR;
const pad = n => String(n).padStart(2, '0');

/* ---------- teams (ESPN ids, which the site uses) ---------- */
// Names a title calls a team by. Matched in Title Case or ALL CAPS only, so "heat check" or "magic" in a sentence
// doesn't tag Miami or Orlando
export const TEAMS = [
  ['1', 'Hawks', 'Atlanta'], ['2', 'Celtics', 'Boston', 'Celts'], ['17', 'Nets', 'Brooklyn'], ['30', 'Hornets', 'Charlotte'],
  ['4', 'Bulls', 'Chicago'], ['5', 'Cavaliers', 'Cavs', 'Cleveland'], ['6', 'Mavericks', 'Mavs', 'Dallas'], ['7', 'Nuggets', 'Denver'],
  ['8', 'Pistons', 'Detroit'], ['9', 'Warriors', 'Golden State', 'Dubs'], ['10', 'Rockets', 'Houston'], ['11', 'Pacers', 'Indiana'],
  ['12', 'Clippers', 'Clips'], ['13', 'Lakers'], ['29', 'Grizzlies', 'Grizz', 'Memphis'], ['14', 'Heat', 'Miami'],
  ['15', 'Bucks', 'Milwaukee'], ['16', 'Timberwolves', 'Wolves', 'Minnesota'], ['3', 'Pelicans', 'Pels', 'New Orleans'],
  ['18', 'Knicks'], ['25', 'Thunder', 'Oklahoma City', 'OKC'], ['19', 'Magic', 'Orlando'], ['20', '76ers', 'Sixers', 'Philadelphia'],
  ['21', 'Suns', 'Phoenix'], ['22', 'Trail Blazers', 'Blazers', 'Portland'], ['23', 'Kings', 'Sacramento'], ['24', 'Spurs', 'San Antonio'],
  ['28', 'Raptors', 'Raps', 'Toronto'], ['26', 'Jazz', 'Utah'], ['27', 'Wizards', 'Washington'],
];
const TEAM_RES = TEAMS.map(([id, ...names]) => [id, new RegExp(`(?:^|[^A-Za-z0-9])(?:${names.flatMap(n => [n, n.toUpperCase()]).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![A-Za-z0-9])`)]);
export const teamsIn = title => TEAM_RES.filter(([, re]) => re.test(title)).map(([id]) => id);

/* ---------- reading a channel's videos page ---------- */
const text = t => !t ? '' : typeof t === 'string' ? t : t.content || t.simpleText || (t.runs || []).map(r => r.text).join('');
function find(o, test) {
  if (!o || typeof o !== 'object') return undefined;
  if (test(o)) return o;
  for (const k in o) { const r = find(o[k], test); if (r !== undefined) return r; }
  return undefined;
}
const durOf = s => { const p = String(s || '').trim().split(':').map(Number); return p.length > 1 && p.every(Number.isFinite) ? p.reduce((a, b) => a * 60 + b, 0) : 0; };
// "96K", "1.2M views", "1,234 views"
export function viewsOf(s) {
  const m = /^([\d.,]+)\s*([KMB])?(?:\s*views?)?$/i.exec(String(s || '').trim());
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Math.round(n * ({ K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1));
}
// "3h ago", "1d ago", "2 weeks ago", "1mo ago", "Streamed 5 hours ago": how long ago, in ms. YouTube rounds down
// ("1d ago" is anywhere from 24 to 47 hours), so an hour or more is taken from the middle of its range. Only a
// channel's first read leans on this: after that a video keeps the time the job first saw it
export function agoOf(s) {
  const m = /(\d+)\s*([a-z]+)\s+ago/i.exec(String(s || ''));
  if (!m) return null;
  const n = +m[1], u = m[2].toLowerCase();
  const unit = u.startsWith('mo') ? 30 * DAY : u.startsWith('mi') || u === 'm' ? 60000 : u.startsWith('s') ? 1000
    : u.startsWith('h') ? HOUR : u.startsWith('d') ? DAY : u.startsWith('w') ? 7 * DAY : u.startsWith('y') ? 365 * DAY : null;
  return unit ? n * unit + (unit >= HOUR ? unit / 2 : 0) : null;
}
/* Every finished video on a channel's videos page (not live or upcoming), in page order */
export function channelVideos(root) {
  const out = [];
  (function visit(o) {
    if (Array.isArray(o)) { o.forEach(visit); return; }
    if (!o || typeof o !== 'object') return;
    const lk = o.lockupViewModel;
    if (lk && lk.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
      const md = lk.metadata && lk.metadata.lockupMetadataViewModel;
      const parts = (find(md, x => Array.isArray(x.metadataRows)) || { metadataRows: [] }).metadataRows
        .flatMap(r => (r.metadataParts || []).map(p => text(p.text)));
      const badge = find(lk, x => x.thumbnailBadgeViewModel && /^\d+(:\d\d)+$/.test(x.thumbnailBadgeViewModel.text || ''));
      const ago = parts.map(agoOf).find(x => x != null);
      // No age means it's live, a premiere or scheduled: those come back once they're finished
      if (lk.contentId && md && ago != null) out.push({ id: lk.contentId, title: text(md.title), len: badge ? durOf(badge.thumbnailBadgeViewModel.text) : 0, views: parts.map(viewsOf).find(x => x != null) ?? null, ago });
      return;
    }
    if (o.videoRenderer && o.videoRenderer.videoId) {
      const v = o.videoRenderer, ago = agoOf(text(v.publishedTimeText));
      if (ago != null) out.push({ id: v.videoId, title: text(v.title), len: durOf(text(v.lengthText)), views: viewsOf(text(v.viewCountText).replace(/\s*views?$/i, '')), ago });
      return;
    }
    for (const k in o) visit(o[k]);
  })(root);
  return out;
}
export const channelName = root => (root && root.metadata && root.metadata.channelMetadataRenderer && root.metadata.channelMetadataRenderer.title) || '';

/* ---------- what a video is ---------- */
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "Oct. 30, 2026", "October 30, 2026", "Sept 2 2026", "10.30.26", "10/30/2026": the game's date, as YYYY-MM-DD
export function dateIn(title) {
  const t = String(title || '');
  let m = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d\d)\b/i.exec(t);
  if (m) return ok(+m[3], MON.indexOf(m[1].toLowerCase()) + 1, +m[2]);
  m = /(?:^|[^\d])(\d{1,2})[./-](\d{1,2})[./-](\d{2}|20\d\d)(?![\d])/.exec(t);
  if (m) return ok(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[1], +m[2]);
  return null;
}
const ok = (y, mo, d) => mo >= 1 && mo <= 12 && d >= 1 && d <= 31 ? `${y}-${pad(mo)}-${pad(d)}` : null;

// Game action: highlight reels, and the all-caps "WENT OFF vs Hornets" kind of title
const HIGHLIGHT = /highlights|full game|top \d+|best plays|every (?:bucket|three|3|dunk|block)|mix(?:tape)?\b|\bdunks?\b|buzzer|game[- ]winner|clutch|plays? of the|top plays|nightly recap|insane|went off|goes off|shot[- ]?making|ankle ?breakers?|t(?:ook|akes) over|could(?:n't| not) be stopped|\d+\s*(?:pts|points)\b|\bending\b/i;
// Someone talking: on a team's own channel that's nearly always about a game (Curry "Breaks Down" or "Recaps" a night)
const INTERVIEW = /post[- ]?game|press conference|presser|media availability|pregame|pre[- ]game|shootaround|practice|interview|walk-?off|locker room|reacts?\b|recaps?\b|breaks? down|talks?\b|discuss|speaks?\b|says\b|reflects|reveals|meets the media|\bmedia\b|on (?:the |his |their )?(?:win|loss|performance|night)|after (?:the |a )?(?:win|loss|game)|availability|exit interview|introductory|one on one/i;
// Elsewhere only these words mean an interview ("talks" or "recap" on the NBA's channel are usually something else)
const INTERVIEW_STRICT = /post[- ]?game|press conference|presser|media availability|interview|locker room|reacts to\b.*\bwith (?:the )?(?:NBA on|crew)/i;
// On a team's channel these always mean someone talking, whatever else the title says
const TEAM_TALK = /press conference|presser|media availability|interview|locker room|walk-?off|post[- ]?game (?:sound|media|interview|press)|shootaround|practice|breaks? down|recaps?\b|reacts?\b|talks?\b|speaks?\b/i;
const PODCAST = /podcast|\bpod\b|episode|\bep\.?\s*\d+|full show|reaction show/i;
const BREAKDOWN = /breakdown|film (?:study|session|room)|explained|explain|analy[sz]|stats? (?:say|show|don't lie)|tactic|scheme|why (?:the|is|are|did)|how (?:the|did|does)|\bvs\.? (?:data|numbers)|deep dive|ranking|ranked|tier list/i;

/* A video's kind, from its channel's kind and its title */
export function kindOf(ch, title) {
  // A team's "Ep. 2" is a docuseries; only the word itself makes one of theirs a podcast
  if (ch.kind === 'podcast' || (ch.kind === 'team' ? /podcast|\bpod\b/i : PODCAST).test(title)) return 'podcast';
  if (ch.kind === 'feature') return 'feature';
  if (ch.kind === 'analysis') return HIGHLIGHT.test(title) && !BREAKDOWN.test(title) ? 'highlights' : 'breakdown';
  // On a team's channel, sure interview words win (someone talking: Curry "Breaks Down Insane Shot..."); then a
  // highlights title ("POSTGAME HIGHLIGHTS: MAGIC VS. CELTICS"), before the looser words like a bare "postgame" get a say
  if (ch.kind === 'team') return TEAM_TALK.test(title) ? 'interview' : HIGHLIGHT.test(title) ? 'highlights' : INTERVIEW.test(title) || dateIn(title) ? 'interview' : 'feature';
  // The league's own channel and other outlets: a dated title or one "vs" a team is a game's highlights
  if (INTERVIEW_STRICT.test(title)) return 'interview';
  if (BREAKDOWN.test(title)) return 'breakdown';
  return HIGHLIGHT.test(title) || dateIn(title) || /\bvs\.?\s/i.test(title) ? 'highlights' : 'feature';
}

/* ---------- which of a channel's videos to keep ---------- */
// Big names, for channels that also cover other sports (a title naming none of these, a team or the NBA is dropped)
const STARS = /\b(?:LeBron|Curry|Steph|Durant|Giannis|Joki[cć]|Luka|Don[cč]i[cć]|Wemby|Wembanyama|SGA|Shai|Gilgeous-Alexander|Tatum|Anthony Edwards|Embiid|Maxey|Brunson|Haliburton|Booker|Morant|Zion|Kyrie|Harden|Jimmy Butler|Donovan Mitchell|Cade|Banchero|Lillard|Kawhi|Anthony Davis|Towns|Cooper Flagg|Flagg|Jaylen Brown|Jalen Williams|Chet|Ja Morant)\b/;
export function keeps(c, title) {
  if (c.only && !new RegExp(c.only, 'i').test(title)) return false;
  if (c.skip && new RegExp(c.skip, 'i').test(title)) return false;
  if (c.nba && !(/\bNBA\b/.test(title) || teamsIn(title).length || STARS.test(title))) return false;
  return true;
}

/* ---------- one run ---------- */
// How often each kind of channel is read again: team channels often (interviews go up about an hour after a game)
const EVERY = { team: 30 * 60000, league: 30 * 60000, analysis: 2 * HOUR, podcast: 2 * HOUR, feature: 2 * HOUR };
const KEEP = 14 * DAY;       // a video stays this long after it was posted
const PER_CHANNEL = 30;      // the newest this many per channel
const MAX_ITEMS = 1400;

export async function buildVideos({ get, channels, prev, now = Date.now(), log = () => {}, warn = () => {}, maxFetch = 24, pause = 400 }) {
  const state = Object.assign({}, prev && prev.state);
  const old = new Map(((prev && prev.items) || []).map(v => [v.id, v]));
  const status = { read: 0, failed: [], due: 0 };
  const chans = Object.assign({}, prev && prev.channels);

  // The channels due a read, most overdue first, at most maxFetch a run
  const due = channels.filter(c => !state[c.handle] || now - state[c.handle] >= (EVERY[c.kind] || 2 * HOUR))
    .sort((a, b) => (state[a.handle] || 0) - (state[b.handle] || 0));
  status.due = due.length;
  const fresh = new Map();
  for (const c of due.slice(0, maxFetch)) {
    try {
      const root = initialData(await get(`${YT}/@${c.handle}/videos`));
      if (!root) throw new Error('no page data');
      const all = channelVideos(root);
      if (!all.length) throw new Error('no videos on the page');
      // A channel that's mostly other sports can legitimately have nothing NBA on its first page
      const vids = all.filter(v => keeps(c, v.title)).slice(0, PER_CHANNEL);
      chans[c.handle] = { name: c.name || channelName(root) || c.handle, kind: c.kind, team: c.team || null };
      vids.forEach(v => fresh.set(v.id, Object.assign(v, { ch: c.handle })));
      state[c.handle] = now;
      status.read++;
    } catch (e) {
      status.failed.push(`${c.handle}: ${e.message}`);
      // Tried again on the next run, not straight away
      state[c.handle] = now - (EVERY[c.kind] || 2 * HOUR) + 10 * 60000;
    }
    if (pause) await new Promise(r => setTimeout(r, pause));
  }
  if (status.failed.length) warn(`Couldn't read ${status.failed.length} channel(s): ${status.failed.join('; ')}`);

  // Merge: a video keeps the time it was first seen (more exact than "1d ago"); views are the latest read
  const byHandle = new Map(channels.map(c => [c.handle, c]));
  const items = new Map(old);
  for (const [id, v] of fresh) {
    const c = byHandle.get(v.ch);
    const was = old.get(id);
    const t = was ? Math.min(was.t, now - v.ago + 60000) : now - v.ago;
    const teams = [...new Set([c.team, ...teamsIn(v.title)].filter(Boolean))];
    items.set(id, { id, title: v.title, ch: v.ch, kind: kindOf(c, v.title), teams, date: dateIn(v.title), t, len: v.len || (was && was.len) || 0, views: v.views ?? (was && was.views) ?? null });
  }
  // Channels taken off the list leave with their videos; old videos fall off after two weeks
  const list = [...items.values()].filter(v => byHandle.has(v.ch) && now - v.t < KEEP).sort((a, b) => b.t - a.t).slice(0, MAX_ITEMS);
  Object.keys(chans).forEach(h => { if (!byHandle.has(h)) delete chans[h]; });
  Object.keys(state).forEach(h => { if (!byHandle.has(h)) delete state[h]; });
  log(`Read ${status.read} of ${status.due} channels due; ${list.length} videos kept.`);
  return { data: { updated: new Date(now).toISOString(), channels: chans, state, items: list }, status, ok: status.read > 0 || status.due === 0 };
}
