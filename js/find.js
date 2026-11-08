/* Search bar wayfinder: results as you type, from the data the site already has (no API key). A team comes up with
   its game today (live score, tip time or final) one tap from the game; a player with his line tonight or in his last
   game and whether he's injured; two teams with their matchup; then pages, and the question itself, which the built-in
   answers (or Claude, with a key) take on Enter. ask.js owns the panel and the search field; this fills the panel. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui;
const { esc } = NBA;
const F = NBA.find = { sel: 0, raw: '', items: [] };
const RECENT_KEY = 'nba.recent.v1';

/* ---------- matching ---------- */
// Accents off, apostrophes and periods dropped, anything else a space: "Dončić" finds Doncic, "D'Angelo" dangelo
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
F.norm = norm;
// Edit distance, a swap of two letters counting once; gives up as soon as it passes max
function dist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let pp = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (pp && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, pp[j - 2] + 1);
      cur.push(v);
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
    pp = prev; prev = cur;
  }
  return prev[b.length];
}
// One typed word against one word of a name: all of it (3), the start of it (2), or the start of it with a slip (1)
function wordFit(q, w) {
  if (w === q) return 3;
  if (w.startsWith(q)) return 2;
  const max = q.length >= 7 ? 2 : 1;
  return q.length >= 4 && dist(q, w.slice(0, q.length), max) <= max ? 1 : 0;
}
// Every typed word has to fit a different word of the name, in any order ("george paul" works too)
function nameFit(qw, words) {
  const used = new Set();
  let s = 0;
  for (const q of qw) {
    let best = 0, at = -1;
    words.forEach((w, i) => { if (!used.has(i)) { const f = wordFit(q, w); if (f > best) { best = f; at = i; } } });
    if (!best) return 0;
    used.add(at); s += best;
  }
  return s;
}
// What people call them
const NICK = {
  sga: 'shai gilgeous alexander', shai: 'shai gilgeous alexander', kd: 'kevin durant', ad: 'anthony davis', brow: 'anthony davis',
  pg: 'paul george', pg13: 'paul george', cp3: 'chris paul', steph: 'stephen curry', chef: 'stephen curry', bron: 'lebron james',
  'king james': 'lebron james', wemby: 'victor wembanyama', ant: 'anthony edwards', 'ant man': 'anthony edwards', jjj: 'jaren jackson jr',
  dame: 'damian lillard', jt: 'jayson tatum', jb: 'jaylen brown', kat: 'karl anthony towns', joker: 'nikola jokic',
  'greek freak': 'giannis antetokounmpo', book: 'devin booker', spida: 'donovan mitchell', 'jimmy buckets': 'jimmy butler',
  'the beard': 'james harden', 'the process': 'joel embiid', zion: 'zion williamson', ja: 'ja morant', trae: 'trae young',
};
// Words that say what you want rather than who: they steer the card, and don't have to match a name
const FILLER = new Set(('vs v versus at game games tonight today todays score scores live stats stat line last night yesterday next '
  + 'schedule injury injured injuries status how many points pts did does do is are the a an of for what whats who when was where '
  + 'watch channel play playing plays tv stream record he his and in on get scored much team tomorrow').split(' '));

/* ---------- who and what can be found ---------- */
// ESPN's NBA team ids are 1-30; the All-Star teams and NBA Cup placeholders aren't teams
const teamList = () => [...NBA.teams.values()].filter(t => t.abbr && t.full && +t.id >= 1 && +t.id <= 30);
function teamAliases(t) {
  if (t._al && t._alKey === t.full + t.abbr) return t._al;
  t._alKey = t.full + t.abbr;
  t._al = [...new Set([t.full, t.name, t.location, t.abbr, ...((NBA.TEAM_ALIASES || {})[t.abbr] || [])].filter(Boolean).map(norm))];
  return t._al;
}
function teamFit(q, t) {
  let best = 0;
  for (const a of teamAliases(t)) {
    let s = 0;
    if (a === q || a + 's' === q) s = 100;
    else if (q.length >= 2 && a.startsWith(q)) s = 80 + 10 * q.length / a.length;
    else if (q.length >= 2 && a.split(' ').some(w => w.startsWith(q))) s = 70;
    else if (q.length >= 4 && a.length >= 4 && dist(q, a.slice(0, q.length), 1) <= 1) s = 50;
    if (s > best) best = s;
  }
  return best;
}
// Players ESPN's search found that the site didn't have yet (a new signing, a two-way call-up)
const remote = new Map();
NBA.def('psearch', 6 * 3600000, async q => {
  const j = await NBA.getJSON(`https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(q)}&limit=6&mode=prefix&type=player&sport=basketball&league=nba`);
  const list = (j.items || []).filter(i => i.league === 'nba' && i.isActive !== false && i.displayName).map(i => {
    const tm = (i.teamRelationships || []).find(r => r.core && r.core.id);
    return { id: String(i.id), name: i.displayName, teamId: tm ? String(tm.core.id) : '', jersey: i.jersey || '', pos: typeof i.position === 'string' ? i.position : (i.position && i.position.abbreviation) || '', headshot: i.headshot && i.headshot.href };
  });
  list.forEach(p => remote.set(p.id, p));
  return list;
});
/* Everyone on a roster: the daily player list in data/extras.json (built by .github/workflows/extras.yml), then what's
   fresher - ESPN's search, the injury report, this season's stats (current team, headshot, averages) and any team
   rosters already loaded */
let idx = null, idxKey = '';
function people() {
  const rosters = teamList().filter(t => NBA.data('roster:' + t.id));
  const key = [NBA.status('extras').t, NBA.status('players').t, NBA.status('injuries').t, rosters.map(t => t.id + ':' + NBA.status('roster:' + t.id).t).join(), remote.size].join('|');
  if (idx && key === idxKey) return idx;
  const m = new Map();
  const add = (id, o) => {
    id = String(id || '');
    if (!id || id === 'undefined') return;
    const cur = m.get(id) || { id };
    for (const k in o) if (o[k] != null && o[k] !== '') cur[k] = o[k];
    m.set(id, cur);
  };
  const ex = NBA.data('extras');
  if (ex && ex.players) for (const id in ex.players) { const x = ex.players[id]; if (x.nm) add(id, { name: x.nm, teamId: x.tid, jersey: x.no, pos: x.pos }); }
  remote.forEach(p => add(p.id, p));
  (NBA.data('injuries') || []).forEach(g => g.list.forEach(i => add(i.id, { name: i.name, teamId: g.teamId, pos: i.pos, headshot: i.headshot })));
  (NBA.players() || []).forEach(p => add(p.id, { name: p.name, teamId: p.teamId, pos: p.pos, headshot: p.headshot, stats: p }));
  rosters.forEach(t => (NBA.data('roster:' + t.id).players || []).forEach(p => add(p.id, { name: p.name, teamId: t.id, jersey: p.jersey, pos: p.pos, headshot: p.headshot })));
  idx = [...m.values()].filter(p => p.name).map(p => Object.assign(p, {
    n: norm(p.name), words: norm(p.name).split(' '),
    headshot: p.headshot || `https://a.espncdn.com/i/headshots/nba/players/full/${p.id}.png`,
  }));
  idxKey = key;
  return idx;
}
const personById = id => people().find(p => p.id === String(id));
// Shared with the player card and the players followed on Home (core.js, players.js)
const injuryOf = NBA.injuryOf, todayGame = NBA.todayGame;
const isPP = g => g.state === 'post' && g.completed === false;
// Feeds a result card needs, asked for when the panel opens so the first keystroke already has them
F.warm = () => ['extras', 'players', 'injuries', 'standings', 'day:'].forEach(k => NBA.use(k));

/* ---------- pages ---------- */
// Each page's own words, | between them. "mvp" is left to the built-in answer (odds and the stat leaders together)
const PAGES = [
  ['schedule', 'Schedule', 'schedule|scores|scoreboard|calendar|games today|tonight'],
  ['standings', 'Standings', 'standings|table|seeds|playoff picture|conference|east|west'],
  ['stats', 'Stats', 'stats|leaders|league leaders|statistics|scoring leaders'],
  ['odds', 'Odds', 'odds|betting|lines|spreads|futures|championship odds'],
  ['news', 'Injuries & News', 'injuries|injury report|news|headlines'],
  ['teams', 'Teams', 'teams|power rankings|net rating|all teams'],
  ['players', 'Players', 'players|all players|payroll|salaries'],
  ['facts', 'Fun Facts', 'fun facts|facts|trivia|records'],
  ['games', 'Games', 'mini games|quiz|guess the player|trivia game'],
  ['videos', 'Videos', 'videos|podcasts|interviews|youtube|highlights|breakdowns'],
  ['social', 'Social', 'social|reddit|twitter|x posts|courtside'],
  ['home', 'Home', 'home|front page'],
  ['myteam', '', 'my team|favorite team'],
].map(([tab, label, kw]) => ({ tab, label, kw: kw.split('|') }));
const PHRASES = PAGES.map(p => ({ p, phrases: [norm(p.label), ...p.kw] }));
function pageFit(text) {
  const out = [];
  PHRASES.forEach(({ p, phrases }) => {
    let s = 0;
    phrases.forEach(k => {
      if (!k) return;
      if (k === text) s = Math.max(s, 90);
      else if (text.length >= 3 && k.startsWith(text)) s = Math.max(s, 60);
      else if (k.length >= 4 && (' ' + text + ' ').includes(' ' + k + ' ')) s = Math.max(s, 55);
    });
    if (s) out.push({ k: 'page', tab: p.tab, label: p.tab === 'myteam' ? `${NBA.T(NBA.S.myTeam).name || 'My team'} (my team)` : p.label, score: s });
  });
  return out;
}
const DAYS = [[/\b(yesterday|last night)\b/, -1, "Yesterday's games"], [/\btomorrow\b/, 1, "Tomorrow's games"], [/\b(today|tonight)\b/, 0, "Today's games"]];

/* ---------- search ---------- */
function teamPair(text) {
  // In the order they were typed
  const at = t => { const s = ' ' + text + ' '; return Math.min(...teamAliases(t).map(a => { const i = s.indexOf(' ' + a); return i < 0 ? 1e9 : i; })); };
  const found = NBA.findTeams(text).sort((a, b) => at(a) - at(b));
  if (found.length >= 2) return [found[0], found[1]];
  if (found.length !== 1) return null;
  // What's left once the first team is taken out, as the start of a second team ("76ers cel")
  let rest = ' ' + text + ' ';
  teamAliases(found[0]).slice().sort((a, b) => b.length - a.length).forEach(a => { rest = rest.replace(new RegExp(` ${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s? `), ' '); });
  rest = rest.trim();
  if (rest.length < 2) return null;
  const best = teamList().filter(t => t !== found[0]).map(t => [t, teamFit(rest, t)]).sort((x, y) => y[1] - x[1])[0];
  return best && best[1] >= 70 ? [found[0], best[0]] : null;
}
const QUESTION = /^(who|what|whats|when|where|which|how|is|are|does|did|can|will|should|why|show|list|compare)\b|\b(leaders?|leading|mvp|best|most|top|worst|average|averages|vs|better|odds|record|standings|rank|ranking|series|streak|plus minus)\b/;
F.search = raw => {
  const q = norm(raw), words = q.split(' ').filter(Boolean);
  if (!q) return [];
  const core = words.filter(w => !FILLER.has(w));
  const text = (core.length ? core : words).join(' ');
  const items = [];
  const pair = teamPair(text);
  if (pair) items.push({ k: 'm', a: pair[0], b: pair[1], score: 130 });
  // Teams, by the whole text or by one of its words naming a team outright ("celtics tatum")
  const teams = teamList();
  let teamHit = null;
  teams.forEach(t => {
    const s = Math.max(teamFit(text, t), ...(core.length > 1 ? core.map(w => (teamFit(w, t) >= 100 ? 95 : 0)) : [0]));
    if (s) { items.push({ k: 't', t, score: s }); if (s >= 95 && !teamHit) teamHit = t; }
  });
  // Players, by the words that aren't a team's name
  const teamWord = w => teams.some(t => teamAliases(t).some(a => a === w || a + 's' === w));
  const pw = core.length > 1 ? core.filter(w => !teamWord(w)) : core;
  const pq = pw.join(' ');
  if (pq.replace(/ /g, '').length >= 2) {
    const qw = (NICK[pq] || pq).split(' ');
    people().forEach(p => {
      const fit = nameFit(qw, p.words);
      if (!fit) return;
      let s = 46 + fit * 8 + Math.min(10, ((p.stats && p.stats.pts) || 0) / 3);
      if (p.n === qw.join(' ')) s += 22;
      if (teamHit && p.teamId === teamHit.id) s += 20;
      if (p.teamId && todayGame(p.teamId)) s += 2;
      items.push({ k: 'p', p, score: s });
    });
    // Nobody here by that name: ask ESPN's own search once typing pauses (it fills in ESPN-only players)
    if (!items.some(i => i.k === 'p') && !items.some(i => i.score >= 70) && pq.length >= 3) {
      clearTimeout(F._rt);
      F._rt = setTimeout(() => NBA.need('psearch:' + pq).catch(() => {}), 350);
    }
  }
  pageFit(text).forEach(x => items.push(x));
  DAYS.forEach(([re, off, label]) => { if (re.test(q) && !items.some(i => i.k === 't' || i.k === 'p' || i.k === 'm')) items.push({ k: 'day', off, label, score: 75 }); });
  // The question itself: first when it reads like one and nothing named fits well, left off when a name fits exactly
  const best = items.reduce((m, i) => Math.max(m, i.score), 0), question = QUESTION.test(q);
  if (question || best < 95) items.push({ k: 'ask', q: String(raw).trim(), score: question && best < 90 ? 92 : best < 50 ? 40 : 1 });
  // Best first; a team before a player on a tie, and at most 8 teams and players
  const rank = { m: 0, t: 1, p: 2, day: 3, page: 4, ask: 5 };
  items.sort((a, b) => b.score - a.score || rank[a.k] - rank[b.k]);
  let ent = 0;
  return items.filter(i => (i.k === 't' || i.k === 'p') ? ++ent <= 8 : true).slice(0, 12);
};

/* ---------- pieces of a card ---------- */
const when = iso => NBA.fmtDate(iso, { weekday: 'short', month: 'short', day: 'numeric' });
const hidden = (id, date) => NBA.masked(id, date);
const showBtn = id => `<button class="link" data-act="reveal" data-id="${esc(id)}">Show</button>`;
// The box-score line, its stat boxes, the game's state line and the injury pill are shared with the player card (players.js)
const boxLine = NBA.boxLine, statsRow = UI.statsRow, gameState = UI.gameState, injuryPill = UI.injuryPill;
const oppOf = (g, teamId) => g.away.id === teamId ? g.home : g.away;
const atOrVs = (g, teamId) => g.home.id === teamId ? 'vs' : '@';
const gameBtn = g => g.state === 'in' ? 'Open the live game' : g.state === 'pre' ? 'Game preview' : isPP(g) ? 'Open the game' : 'Box score';
const openGame = (g, label = 'Open game') => `<button class="btn primary sm" data-act="fd-open" data-k="g" data-id="${esc(g.id)}">${label}</button>`;
// One line about a schedule event: "Thu, Nov 6 · vs NYK · W 118-110" (the result hidden in spoiler mode)
function eventText(e) {
  const opp = NBA.T(e.oppId).abbr || e.oppAbbr || '';
  const res = NBA.isFinal(e) ? (hidden(e.id, e.date) ? `result hidden ${showBtn(e.id)}` : `<b class="${e.won ? 'w' : 'l'}">${e.won ? 'W' : 'L'} ${esc(e.my)}-${esc(e.their)}</b>`)
    : e.state === 'post' ? esc(e.detail || 'Postponed') : `${esc(NBA.fmtTime(e.date))}${NBA.caTv(e) ? ' · ' + esc(NBA.caTv(e).short) : ''}`;
  return `${esc(when(e.date))} · ${e.home ? 'vs' : '@'} ${esc(opp)} · ${res}`;
}
const sec = (head, body) => `<div class="fd-sec">${head}${body}</div>`;

/* ---------- cards ---------- */
function teamCard(t) {
  NBA.use('standings'); NBA.use('injuries');
  const r = NBA.standingsMap().get(t.id) || {};
  const g = todayGame(t.id);
  const evs = NBA.teamEvents(t.id);
  const sub = [r.w != null ? `${r.w}-${r.l}` : '', r.seed ? `${NBA.ord(r.seed)} in the ${r.conf}` : '', !NBA.S.spoilers && r.strk ? r.strk : ''].filter(Boolean).join(' · ');
  let body = '';
  if (g) {
    const l = g.state !== 'pre' && !isPP(g) && !hidden(g.id, g.date) ? [g.away, g.home].map(x => { const p = x.leaders.find(y => y.cat === 'points'); return p ? `${esc(x.abbr)}: ${esc(p.full || p.short)} ${esc(p.value)}` : ''; }).filter(Boolean).join(' · ') : '';
    body += sec(gameState(g, true), `<ol class="lines fd-lines">${UI.line(g)}</ol>${l ? `<div class="fd-note">Top scorers: ${l}</div>` : ''}`);
  }
  if (evs) {
    const last = evs.filter(e => NBA.isFinal(e) && (!g || e.id !== g.id)).slice(-1)[0];
    const next = evs.find(e => e.state === 'pre' && (!g || e.id !== g.id));
    const rows = [last && ['Last game', last], next && [g ? 'After that' : 'Next game', next]].filter(Boolean);
    if (rows.length) body += `<ul class="fd-evs">${rows.map(([k, e]) => `<li><span class="fd-k">${k}</span><button class="fd-ev" data-act="fd-open" data-k="g" data-id="${esc(e.id)}">${eventText(e)}</button></li>`).join('')}</ul>`;
  } else body += `<p class="fd-note">Loading the schedule…</p>`;
  const inj = ((NBA.data('injuries') || []).find(x => x.teamId === t.id) || { list: [] }).list;
  if (inj.length) {
    const outs = inj.slice().sort((a, b) => NBA.injuryNow(b).out - NBA.injuryNow(a).out).slice(0, 5);
    body += sec('<span class="fd-k">Injuries</span>', `<ul class="fd-inj">${outs.map(i => `<li><button class="fd-ev" data-act="fd-open" data-k="p" data-id="${esc(i.id)}"><b>${esc(i.name)}</b></button> ${injuryPill(i)}</li>`).join('')}</ul>${inj.length > 5 ? `<div class="fd-note">and ${inj.length - 5} more</div>` : ''}`);
  }
  const ask = (label, q) => `<button class="chip" data-act="ask-q" data-q="${esc(q)}">${label}</button>`;
  return `<div class="fd-card">
    <div class="fd-hd">${UI.logo(t, 44, 'fd-logo')}<div class="fd-nm"><b>${esc(t.full)}</b><small>${esc(sub || ' ')}</small></div></div>
    ${body}
    <div class="fd-acts">${g ? openGame(g, gameBtn(g)) : ''}<button class="btn sm" data-act="fd-open" data-k="t" data-id="${esc(t.id)}">Team page</button>
      ${ask('Next 5 games', `${t.name} next 5 games`)}${ask('Last 5 results', `${t.name} last 5 results`)}${ask('Roster', `${t.name} roster`)}</div></div>`;
}
function playerCard(p) {
  NBA.use('injuries');
  const t = p.teamId ? NBA.T(p.teamId) : null, s = p.stats;
  // Today's game and his line in it, and the injury report, the same way his player card's "Right now" reads them
  const n = NBA.playerNow(p.id, p.teamId, { log: false }), { g, inj } = n, now = NBA.injuryNow(inj);
  const sub = [t && (t.full || t.name), p.pos, p.jersey ? '#' + p.jersey : ''].filter(Boolean).join(' · ');
  // ESPN's comment only when it's about today or tomorrow, and not when it quotes a result spoiler mode hides
  let body = `<div class="fd-sec"><div class="fd-status">${injuryPill(inj)}</div>${now && now.note ? `<div class="fd-note fd-clip">${esc(now.note)}</div>` : ''}</div>`;
  let lastFrom = 'log';
  if (g) {
    const head = gameState(g, false, `${atOrVs(g, p.teamId)} ${esc(oppOf(g, p.teamId).abbr)}`);
    let line;
    const l = n.line;
    if (n.state === 'pre' || n.state === 'pp') { line = now && now.out ? `<div class="fd-note">Listed out for this one.</div>` : ''; }
    else if (n.masked) line = `<div class="fd-note">His line is hidden in spoiler mode. ${showBtn(g.id)}</div>`;
    else {
      line = l && l.dnp ? `<div class="fd-note">${l.yet || (g.state === 'in' && !l.why) ? "Hasn't checked in yet." : `Didn't play: ${esc(l.dnp)}`}</div>` : l ? statsRow(l)
        : n.sum ? `<div class="fd-note">Not in the box score${g.state === 'in' ? ' yet' : ''}.</div>` : '<div class="fd-note">Loading his line…</div>';
      if (l && !l.dnp) lastFrom = '';
    }
    body += sec(head, line + `<div class="fd-acts">${openGame(g, gameBtn(g))}</div>`);
    if (g.state !== 'pre' && !isPP(g)) lastFrom = '';
  }
  // His last game, from his game log (tonight's, once it's played, is above)
  if (lastFrom) {
    const log = NBA.use('gamelog:' + p.id);
    const e = log && log.find(x => !g || x.id !== g.id);
    if (e) {
      const res = NBA.S.spoilers ? '' : ` · ${esc(e.result)} ${esc(e.score)}`;
      const head = `<span class="fd-k">Last game · ${esc(when(e.date))} · ${e.home ? 'vs' : '@'} ${esc(e.oppAbbr || '')}${res}</span>`;
      body += sec(head, hidden(e.id, e.date) ? `<div class="fd-note">Hidden in spoiler mode. ${showBtn(e.id)}</div>` : statsRow(e));
    } else if (log) body += `<p class="fd-note">No games yet this season.</p>`;
    else if (!NBA.status('gamelog:' + p.id).err) body += `<p class="fd-note">Loading his last game…</p>`;
  }
  const f = NBA.fix;
  body += s && s.gp ? sec('<span class="fd-k">This season</span>', `<div class="fd-note fd-season"><b>${f(s.pts)}</b> PTS · <b>${f(s.reb)}</b> REB · <b>${f(s.ast)}</b> AST · ${Number.isFinite(s.fgp) ? f(s.fgp) + '% FG · ' : ''}${s.gp} games</div>`)
    : `<p class="fd-note">Hasn't played this season.</p>`;
  return `<div class="fd-card">
    <div class="fd-hd">${UI.hs(p.headshot, 'hs fd-hs', 200)}<div class="fd-nm"><b>${esc(p.name)}</b><small>${esc(sub || ' ')}</small></div>${t && t.abbr ? UI.logo(t, 32, 'fd-tlogo') : ''}</div>
    ${body}
    <div class="fd-acts"><button class="btn sm" data-act="fd-open" data-k="p" data-id="${esc(p.id)}">Player card</button>
      ${UI.followBtn(p)}<button class="chip" data-act="ask-q" data-q="${esc(p.name)} last 5 games">Last 5 games</button></div></div>`;
}
function matchupCard(a, b) {
  const g = (() => { const x = todayGame(a.id); return x && (x.away.id === b.id || x.home.id === b.id) ? x : null; })();
  const evs = NBA.teamEvents(a.id);
  const games = evs ? evs.filter(e => e.oppId === b.id) : [];
  const done = games.filter(NBA.isFinal), next = games.find(e => e.state === 'pre' && (!g || e.id !== g.id));
  const wins = done.filter(e => e.won).length;
  const series = !done.length ? `They haven't played yet this season.` : NBA.S.spoilers ? `They've played ${done.length} time${done.length > 1 ? 's' : ''}.`
    : wins * 2 === done.length ? `Season series tied ${wins}-${wins}.` : `${esc(wins * 2 > done.length ? a.name : b.name)} lead the season series ${Math.max(wins, done.length - wins)}-${Math.min(wins, done.length - wins)}.`;
  let body = '';
  if (g) body += sec(gameState(g, true), `<ol class="lines fd-lines">${UI.line(g)}</ol>`);
  if (evs) body += `<p class="fd-note">${series}</p>` + (games.length ? `<ul class="fd-evs">${games.filter(e => !g || e.id !== g.id).map(e => `<li><button class="fd-ev" data-act="fd-open" data-k="g" data-id="${esc(e.id)}">${eventText(e).replace(/ · (vs|@) \w+ · /, ` · ${e.home ? 'at ' + esc(a.abbr) : 'at ' + esc(b.abbr)} · `)}</button></li>`).join('')}</ul>` : '');
  else body += '<p class="fd-note">Loading the schedule…</p>';
  const target = g || next;
  return `<div class="fd-card">
    <div class="fd-hd fd-vs">${UI.logo(a, 40, 'fd-logo')}<div class="fd-nm"><b>${esc(a.name)} vs ${esc(b.name)}</b><small>${games.length ? `${games.length} meeting${games.length > 1 ? 's' : ''} this season` : ' '}</small></div>${UI.logo(b, 40, 'fd-logo')}</div>
    ${body}
    <div class="fd-acts">${target ? openGame(target, g ? gameBtn(g) : 'Game preview') : ''}
      <button class="btn sm" data-act="fd-open" data-k="t" data-id="${esc(a.id)}">${esc(a.name)}</button><button class="btn sm" data-act="fd-open" data-k="t" data-id="${esc(b.id)}">${esc(b.name)}</button></div></div>`;
}

/* ---------- rows ---------- */
function teamSub(t) {
  const r = NBA.standingsMap().get(t.id), g = todayGame(t.id);
  const rec = r ? `${r.w}-${r.l}` : '';
  if (!g) return rec;
  const opp = oppOf(g, t.id), at = atOrVs(g, t.id);
  const st = g.state === 'in' ? `<span class="live">Live</span> ${hidden(g.id, g.date) ? `${at} ${esc(opp.abbr)}` : `${esc(g.away.abbr)} ${esc(g.away.score)}–${esc(g.home.score)} ${esc(g.home.abbr)} · ${esc(NBA.detail(g))}`}`
    : g.state === 'pre' ? `Tonight ${esc(UI.tipTime(g))} ${at} ${esc(opp.abbr)}`
    : isPP(g) ? `${esc(g.detail || 'Postponed')} ${at} ${esc(opp.abbr)}`
    : `${hidden(g.id, g.date) ? 'Final' : `Final ${esc(g.away.abbr)} ${esc(g.away.score)}–${esc(g.home.score)} ${esc(g.home.abbr)}`}`;
  return [esc(rec), st].filter(Boolean).join(' · ');
}
function playerSub(p) {
  const t = p.teamId ? NBA.T(p.teamId) : null, inj = injuryOf(p.id), g = p.teamId ? todayGame(p.teamId) : null;
  const bits = [t && t.abbr, p.pos].filter(Boolean).map(esc);
  if (inj) { const n = NBA.injuryNow(inj); bits.push(`<span class="${n.out ? 'out' : 'dtd'}">${esc(n.label)}</span>`); }
  if (g && g.state !== 'pre' && !hidden(g.id, g.date)) {
    const l = boxLine(NBA.data('summary:' + g.id), p.id);
    if (l && !l.dnp) bits.push(`${g.state === 'in' ? '<span class="live">Live</span> ' : ''}${esc(l.pts)} PTS ${g.state === 'in' ? 'so far' : 'tonight'}`);
  } else if (g && g.state === 'pre') bits.push(`Plays ${esc(UI.tipTime(g))}`);
  if (p.stats && p.stats.gp) bits.push(`${NBA.fix(p.stats.pts)} PPG`);
  return bits.join(' · ');
}
function row(it, i, sel) {
  let ic = '', name = '', sub = '', tag = '';
  if (it.k === 't') { ic = UI.logo(it.t, 28, 'fd-ico'); name = esc(it.t.full); sub = teamSub(it.t); tag = 'Team'; }
  else if (it.k === 'p') { ic = UI.hs(it.p.headshot, 'hs fd-ico', 120); name = esc(it.p.name); sub = playerSub(it.p); tag = 'Player'; }
  else if (it.k === 'm') {
    const g = todayGame(it.a.id), today = g && (g.away.id === it.b.id || g.home.id === it.b.id);
    ic = `<span class="fd-pair">${UI.logo(it.a, 22)}${UI.logo(it.b, 22)}</span>`; name = `${esc(it.a.name)} vs ${esc(it.b.name)}`;
    sub = today ? teamSub(it.a).replace(/^[^·]*· /, '') : 'Season series and next game'; tag = 'Matchup';
  } else if (it.k === 'page') { ic = '<span class="fd-ico fd-glyph">→</span>'; name = esc(it.label); sub = 'Go to the page'; tag = 'Page'; }
  else if (it.k === 'day') { ic = `<span class="fd-ico fd-glyph">${UI.I.cal}</span>`; name = esc(it.label); sub = 'Open the schedule on that day'; tag = 'Schedule'; }
  else { ic = '<span class="fd-ico fd-glyph">?</span>'; name = `Ask “${esc(it.q)}”`; sub = NBA.aiKey.get() ? 'Claude answers with live data' : 'Built-in answer from the site’s data'; tag = 'Ask'; }
  return `<button type="button" class="fd-row" role="option" id="fd-o${i}" aria-selected="${i === sel}" data-act="fd-row" data-i="${i}">${ic}<span class="fd-tx"><b>${name}</b><small>${sub}</small></span><span class="fd-tag">${tag}</span></button>`;
}
const isEntity = it => it && (it.k === 't' || it.k === 'p' || it.k === 'm');
const sameItem = (a, b) => a && b && a.k === b.k && (a.k === 't' ? a.t.id === b.t.id : a.k === 'p' ? a.p.id === b.p.id : a.k === 'm' ? a.a.id === b.a.id && a.b.id === b.b.id : a.k === 'page' ? a.tab === b.tab : a.k === 'day' ? a.off === b.off : true);

/* ---------- the panel ---------- */
// Called on every keystroke (ask.js); the highlight goes back to the top result
F.typed = raw => { F.raw = raw; F.sel = 0; F.pinned = null; };
F.move = d => { if (!F.items.length) return; F.sel = (F.sel + d + F.items.length) % F.items.length; F.pinned = F.items[F.sel]; };
F.count = () => F.items.length;
// The results for what's typed, and the card for the highlighted result (or the best one when a page or the question is)
F.panel = () => {
  F.warm();
  const items = F.search(F.raw);
  // A live repaint can reorder the list (a team's game goes live): keep the highlight on the same result
  if (F.pinned) { const i = items.findIndex(x => sameItem(x, F.pinned)); F.sel = i >= 0 ? i : 0; }
  F.items = items;
  if (F.sel >= items.length) F.sel = 0;
  const cur = isEntity(items[F.sel]) ? items[F.sel] : items.find(isEntity);
  let card = '';
  try {
    if (cur) card = cur.k === 't' ? teamCard(cur.t) : cur.k === 'p' ? playerCard(cur.p) : matchupCard(cur.a, cur.b);
  } catch (e) { console.error('search card', e); }
  const nobody = !items.some(isEntity) && NBA.status('psearch:' + norm(F.raw)).loading ? '<p class="fd-note">Looking for that player on ESPN…</p>' : '';
  return `<div class="fd">${card}${nobody}<div class="fd-list" role="listbox" id="fd-list" aria-label="Results">${items.map((it, i) => row(it, i, F.sel)).join('')}</div>
    <p class="fd-hint">${matchMedia('(hover:hover)').matches ? '↑ ↓ to move · Enter opens it · click a result for its card, click again to open it' : 'Tap a result for its card, tap it again to open it'}</p></div>`;
};
F.activeId = () => F.items.length ? 'fd-o' + F.sel : '';
// What Enter or a second tap does with a result. A team with a game today opens that game, since that's usually
// what a team is looked up for; its card has the team page a tap away. Focus goes back to the page, not the search
// field, when the game or player window closes (on an iPhone that would bring the keyboard back up)
F.go = (i = F.sel) => {
  const it = F.items[i];
  if (!it) return false;
  if (it.k === 'ask') { NBA.ask.run(it.q); return true; }
  remember(it);
  NBA.ask.close();
  const body = document.body;
  if (it.k === 't') { const g = todayGame(it.t.id); if (g) UI.openGame(g.id, body); else location.hash = '#teams/' + it.t.id; }
  else if (it.k === 'p') UI.openPlayer(it.p.id, body);
  else if (it.k === 'm') {
    const g = todayGame(it.a.id), today = g && (g.away.id === it.b.id || g.home.id === it.b.id) ? g : null;
    const next = !today && (NBA.teamEvents(it.a.id) || []).find(e => e.oppId === it.b.id && e.state !== 'post');
    if (today || next) UI.openGame((today || next).id, body); else location.hash = '#teams/' + it.a.id;
  } else if (it.k === 'page') location.hash = '#' + it.tab;
  else if (it.k === 'day') { const iso = NBA.shiftIso(NBA.today, it.off); NBA.dayParam = iso === NBA.today ? '' : NBA.paramOf(iso); NBA.need('day:' + NBA.dayParam).catch(() => {}); if (UI.route().tab !== 'schedule') location.hash = '#schedule'; else { window.scrollTo(0, 0); NBA.changed(); } }
  return true;
};

/* ---------- before typing: live games, today, recent ---------- */
function recent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; } }
function remember(it) {
  const r = it.k === 't' ? { k: 't', id: it.t.id, name: it.t.full } : it.k === 'p' ? { k: 'p', id: it.p.id, name: it.p.name } : it.k === 'm' ? { k: 'm', id: it.a.id, id2: it.b.id, name: `${it.a.name} vs ${it.b.name}` } : null;
  if (!r) return;
  const list = [r, ...recent().filter(x => !(x.k === r.k && x.id === r.id && x.id2 === r.id2))].slice(0, 8);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) { /* storage blocked: no recent list */ }
}
F.home = () => {
  F.warm();
  F.items = [];
  const d = NBA.data('day:');
  const games = d ? NBA.sortGames(d.games) : [];
  const live = games.filter(g => g.state === 'in');
  const list = live.length ? live : games.filter(g => g.state === 'pre').slice(0, 8);
  const mt = NBA.T(NBA.S.myTeam);
  const rec = recent();
  return `<div class="fd">
    ${list.length ? `<div class="fd-sec"><span class="fd-k${live.length ? ' live' : ''}">${live.length ? '<i class="dot blink"></i>Live now' : 'Still to come today'}</span><ol class="lines fd-lines">${list.map(UI.line).join('')}</ol></div>` : ''}
    <div class="fd-sec"><span class="fd-k">Jump to</span><div class="fd-acts">${mt.abbr ? `<button class="chip" data-act="fd-recent" data-k="t" data-id="${esc(mt.id)}">${UI.logo(mt, 16)}${esc(mt.name)}</button>` : ''}
      ${rec.filter(r => !(r.k === 't' && r.id === mt.id)).map(r => `<button class="chip" data-act="fd-recent" data-k="${esc(r.k)}" data-id="${esc(r.id)}"${r.id2 ? ` data-id2="${esc(r.id2)}"` : ''}>${esc(r.name)}</button>`).join('')}</div></div>
    <p class="hint">Type a team, a player or a game: <b>76ers</b>, <b>Paul George</b>, <b>Lakers Celtics</b>. Results show up as you type.</p></div>`;
};
// A recent pick goes straight to its card, as if typed
F.fromRecent = a => {
  const { k, id, id2 } = a.dataset;
  if (k === 't') { const t = NBA.T(id); return t.full || t.name || ''; }
  if (k === 'p') { const p = personById(id); return p ? p.name : a.textContent.trim(); }
  if (k === 'm') return `${NBA.T(id).name} ${NBA.T(id2).name}`;
  return '';
};

// A game opened from the panel (a game row, a link in an answer) closes it, like a result does
document.getElementById('ask-panel').addEventListener('click', e => {
  if (!e.target.closest('[data-act="game"], [data-act="player"], [data-act="yt"], a[href^="#"]')) return;
  const cur = F.items[F.sel];
  if (NBA.ask.mode === 'find' && isEntity(cur)) remember(cur);
  NBA.ask.close();
}, true);

Object.assign(NBA.actions, {
  // A tap on a result shows its card at the top; a tap on the one already showing (or on a page or the question) opens it
  'fd-row': a => {
    const i = +a.dataset.i, it = F.items[i];
    if (!it) return;
    if (i === F.sel || !isEntity(it)) { F.go(i); return; }
    F.sel = i; F.pinned = it;
    NBA.ask.render();
    const p = document.getElementById('ask-panel'); if (p) p.scrollTop = 0;
  },
  // A card's own buttons: the game, the team page, the player card
  'fd-open': a => {
    const { k, id } = a.dataset, cur = F.items[F.sel];
    if (isEntity(cur)) remember(cur);
    NBA.ask.close();
    if (k === 'g') UI.openGame(id, document.body);
    else if (k === 'p') UI.openPlayer(id, document.body);
    else if (k === 't') location.hash = '#teams/' + id;
  },
});
})();
