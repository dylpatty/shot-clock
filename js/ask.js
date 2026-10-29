/* Search bar: built-in answers for common questions, and Claude (with the viewer's own API key)
   using tools that read the same ESPN data the site shows. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui;
const { esc } = NBA;
const $ = s => document.querySelector(s);
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.134.0/+esm';
const PRICES = { // USD per million tokens: input, output, cache write, cache read
  'claude-opus-5-5': [4, 20, 5, .2],
  'claude-sonnet-5-5': [2, 10, 2.5, .2],
  'claude-haiku-5-5': [.1, .5, .125, .01],
};
const MODEL_NAMES = { 'claude-opus-5-5': 'Claude Opus 5.5', 'claude-sonnet-5-5': 'Claude Sonnet 5.5', 'claude-haiku-5-5': 'Claude Haiku 5.5' };
const SUGGESTIONS = ['What is the Warriors record?', "Warriors' next 10 games", 'Who is leading the MVP race?', 'Who plays tonight?',
  'Best player in the East over the last week', 'Power rankings', 'Warriors vs Lakers', 'Stephen Curry last 5 games',
  'Curry vs Doncic', 'Plus-minus leaders', 'Who is hot right now?', 'Warriors defensive rating'];

const A = NBA.ask = { open: false, turns: [], convo: [], busy: false };

/* ---------- Markdown-lite renderer for Claude's answers ---------- */
function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, '$1<i>$2</i>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
function md(src) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let out = '', i = 0;
  const isTable = l => /^\s*\|.*\|\s*$/.test(l), isUl = l => /^\s*[-*•] /.test(l), isOl = l => /^\s*\d+[.)] /.test(l), isH = l => /^#{1,6} /.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (isTable(l)) {
      const rows = [];
      while (i < lines.length && isTable(lines[i])) rows.push(lines[i++]);
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^[\s|:-]+$/.test(r));
      const [h, ...rest] = body;
      out += `<div class="tblwrap"><table><thead><tr>${cells(h).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rest.map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      continue;
    }
    if (isUl(l) || isOl(l)) {
      const ordered = isOl(l), items = [];
      while (i < lines.length && (ordered ? isOl(lines[i]) : isUl(lines[i]))) items.push(lines[i++].replace(/^\s*([-*•]|\d+[.)]) /, ''));
      out += `<${ordered ? 'ol' : 'ul'}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
      continue;
    }
    if (isH(l)) { out += `<h4>${inline(l.replace(/^#+ /, ''))}</h4>`; i++; continue; }
    if (!l.trim()) { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() && !isTable(lines[i]) && !isUl(lines[i]) && !isOl(lines[i]) && !isH(lines[i])) para.push(lines[i++]);
    out += `<p>${para.map(inline).join('<br>')}</p>`;
  }
  return out;
}

/* ---------- shared lookups (used by both built-in answers and Claude's tools) ---------- */
function resolveTeam(text) {
  if (!text) return null;
  const s = String(text).trim();
  return NBA.teamByAbbr(s) || NBA.findTeams(s)[0] || null;
}
const localDate = iso => NBA.fmtDate(iso, { weekday: 'short', month: 'short', day: 'numeric' });
const gameLine = g => ({
  id: g.id, date: localDate(g.date), time: NBA.fmtTime(g.date), status: g.state === 'pre' ? 'scheduled' : g.state === 'in' ? 'live ' + g.detail : g.detail,
  away: `${g.away.full} (${g.away.record})`, home: `${g.home.full} (${g.home.record})`,
  score: g.state === 'pre' ? null : `${g.away.abbr} ${g.away.score} - ${g.home.abbr} ${g.home.score}`,
  top_scorers: g.state === 'pre' ? undefined : [g.away, g.home].map(t => { const l = t.leaders.find(x => x.cat === 'points'); return l ? `${t.abbr}: ${l.full} ${l.value}` : null; }).filter(Boolean),
  tv: g.tv || undefined, odds: g.odds && g.odds.details ? `${g.odds.details}, O/U ${g.odds.ou}` : undefined,
});
async function teamSchedule(team, which, count) {
  const sch = await NBA.need('tsched:' + team.id);
  let list;
  if (which === 'recent') list = sch.events.filter(e => e.state === 'post').slice(-count).reverse();
  else if (which === 'all') list = sch.events;
  else list = sch.events.filter(e => e.state !== 'post').slice(0, count);
  return list.map(e => ({
    id: e.id, date: localDate(e.date), time: NBA.fmtTime(e.date), where: e.home ? 'home' : 'away', opponent: NBA.T(e.oppId).full || e.oppName,
    result: e.state === 'post' ? `${e.won ? 'W' : 'L'} ${e.my}-${e.their}` : e.state === 'in' ? 'live now' : null, tv: e.tv || undefined,
  }));
}
function playerLine(p) {
  const r1 = v => Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
  return {
    name: p.name, team: NBA.T(p.teamId).full || p.team, position: p.pos, age: p.age, games: p.gp, minutes: r1(p.min),
    per_game: { pts: r1(p.pts), reb: r1(p.reb), ast: r1(p.ast), stl: r1(p.stl), blk: r1(p.blk), tov: r1(p.tov), threes_made: r1(p.tpm) },
    shooting: { fg_pct: r1(p.fgp), three_pct: r1(p.tpp), ft_pct: r1(p.ftp), true_shooting_pct: r1(p.ts) },
    totals: { pts: p.tot.pts, reb: p.tot.reb, ast: p.tot.ast, stl: p.tot.stl, blk: p.tot.blk, threes_made: p.tot.tpm },
    double_doubles: p.dd, triple_doubles: p.td,
  };
}
function marketFor(key, markets) {
  const RE = { championship: /^Winner$|Champion/i, east: /Eastern Conference - Winner/i, west: /Western Conference - Winner/i, mvp: /MVP/i, roy: /Rookie/i,
    dpoy: /Defensive/i, sixth_man: /6th Man|Sixth/i, mip: /Improved/i, clutch: /Clutch/i, coach: /Coach/i, cup: /NBA Cup Winner|Tournament Winner/i };
  return RE[key] ? markets.find(m => RE[key].test(m.name)) : null;
}
async function oddsEntries(m, limit) {
  const list = m.entries.slice(0, limit);
  await Promise.allSettled(list.filter(e => e.kind === 'athlete' && !NBA.playerById(e.id)).map(e => NBA.need('athlete:' + e.id)));
  return list.map(e => {
    if (e.kind === 'team') return { name: NBA.T(e.id).full, odds: e.odds, implied_pct: Math.round(e.implied * 1000) / 10 };
    const a = NBA.athleteInfo(e.id) || {};
    return { name: a.name || 'Unknown', team: a.teamId ? NBA.T(a.teamId).abbr : undefined, odds: e.odds, implied_pct: Math.round(e.implied * 1000) / 10 };
  });
}

/* ---------- Claude's tools ---------- */
const STAT_KEYS = Object.keys(NBA.STATS);
const TOOLS = [
  { name: 'get_standings', description: 'Current NBA standings with seed, record, games behind, streak, last 10, home and road records, and points scored/allowed per game.',
    input_schema: { type: 'object', properties: { conference: { type: 'string', enum: ['East', 'West', 'both'], description: 'Which conference. Defaults to both.' } } } },
  { name: 'get_team_overview', description: "One team's season at a glance: record, conference seed, streak, last 10, home/road, scoring with league ranks, coach, next and last game, top players, and injuries.",
    input_schema: { type: 'object', properties: { team: { type: 'string', description: 'Team name, city or abbreviation, e.g. "Warriors", "GS", "Golden State".' } }, required: ['team'] } },
  { name: 'get_team_schedule', description: "A team's upcoming games or recent results with dates (viewer's local time), opponents, home/away, results and TV.",
    input_schema: { type: 'object', properties: { team: { type: 'string' }, which: { type: 'string', enum: ['upcoming', 'recent', 'all'] }, count: { type: 'integer', minimum: 1, maximum: 82 } }, required: ['team', 'which'] } },
  { name: 'get_scoreboard', description: 'All games on one date with status, scores, top scorers, TV and betting line. Omit date for today.',
    input_schema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD. Omit for today.' } } } },
  { name: 'get_game_box_score', description: 'Full box score for one game by its id (from get_scoreboard or get_team_schedule): player lines and team totals.',
    input_schema: { type: 'object', properties: { game_id: { type: 'string' } }, required: ['game_id'] } },
  { name: 'get_league_leaders', description: 'Season leaders for a stat. Per-game leaders use NBA qualification rules. Can filter by conference, team or position. Set lowest to true for the lowest values.',
    input_schema: { type: 'object', properties: { stat: { type: 'string', enum: STAT_KEYS, description: 'pts, reb, ast, stl, blk, tpm (threes made), fgp, tpp (3P%), ftp, ts (true shooting), efg, pra (pts+reb+ast), stocks (stl+blk), astTo, min, tov, pf, fgm, ftm, dd (double-doubles), td (triple-doubles), gp' },
      mode: { type: 'string', enum: ['game', 'total'] }, limit: { type: 'integer', minimum: 1, maximum: 50 }, conference: { type: 'string', enum: ['East', 'West'] }, team: { type: 'string' }, position: { type: 'string', description: 'G, F or C' }, lowest: { type: 'boolean' } }, required: ['stat'] } },
  { name: 'get_player', description: "A player's season stats (per game, shooting, totals), team, position, age and injury status. Matches by name.",
    input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'get_team_roster', description: "A team's roster with jersey, position, age, height, injury status and season averages.",
    input_schema: { type: 'object', properties: { team: { type: 'string' } }, required: ['team'] } },
  { name: 'get_injuries', description: 'Current injury report: status, injury, expected return and a short note. Optionally for one team.',
    input_schema: { type: 'object', properties: { team: { type: 'string' } } } },
  { name: 'get_odds', description: 'DraftKings futures odds (American) with implied chance. Markets: championship, east, west, mvp, roy, dpoy, sixth_man, mip, clutch, coach, cup, or list to see every market name.',
    input_schema: { type: 'object', properties: { market: { type: 'string', enum: ['championship', 'east', 'west', 'mvp', 'roy', 'dpoy', 'sixth_man', 'mip', 'clutch', 'coach', 'cup', 'list'] }, limit: { type: 'integer', minimum: 1, maximum: 30 } }, required: ['market'] } },
  { name: 'get_recent_performances', description: 'Players ranked over the last N days from every box score: per-game points, rebounds, assists, steals, blocks, plus-minus and average Game Score (a single-number rating of a box score line). Use for "best player this week" style questions. Can be slow (reads every game).',
    input_schema: { type: 'object', properties: { days: { type: 'integer', minimum: 1, maximum: 14 }, conference: { type: 'string', enum: ['East', 'West'] }, team: { type: 'string' }, sort: { type: 'string', enum: ['gameScore', 'pts', 'reb', 'ast', 'stl', 'blk', 'pm'] }, limit: { type: 'integer', minimum: 1, maximum: 30 } } } },
  { name: 'get_team_stats', description: 'Per-game team stats for all 30 teams with league ranks: points, allowed, margin, FG%, 3P%, FT%, rebounds, assists, turnovers, steals, blocks, threes.',
    input_schema: { type: 'object', properties: { sort: { type: 'string', enum: ['ppg', 'oppg', 'diff', 'fgp', 'tpp', 'ftp', 'rpg', 'apg', 'tov', 'spg', 'bpg', 'tpm', 'tpa'] } } } },
  { name: 'get_news', description: 'Latest NBA headlines from ESPN, optionally for one team.',
    input_schema: { type: 'object', properties: { team: { type: 'string' } } } },
  { name: 'get_power_rankings', description: 'All 30 teams with net, offensive and defensive rating (points per 100 possessions, with league ranks), pace, last-7-days record and margin, and trend versus season margin. Use for best-team, who is hot or slipping, and team efficiency questions.',
    input_schema: { type: 'object', properties: { sort: { type: 'string', enum: ['net', 'ortg', 'drtg', 'pace', 'last7', 'trend'] } } } },
  { name: 'get_player_game_log', description: "A player's game log this season (regular season, play-in and playoffs), newest first: date, opponent, result, minutes, points, rebounds, assists, steals, blocks, turnovers and shooting.",
    input_schema: { type: 'object', properties: { name: { type: 'string' }, count: { type: 'integer', minimum: 1, maximum: 82 } }, required: ['name'] } },
  { name: 'get_plus_minus', description: "Season plus-minus. With a player name, that player's total and per game. Without one, league leaders among rotation players (20+ minutes a game).",
    input_schema: { type: 'object', properties: { name: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 30 } } } },
];
const TOOL_LABEL = {
  get_standings: 'Checking standings', get_team_overview: 'Looking up the team', get_team_schedule: 'Reading the schedule', get_scoreboard: 'Checking the scoreboard',
  get_game_box_score: 'Opening the box score', get_league_leaders: 'Checking league leaders', get_player: 'Looking up the player', get_team_roster: 'Reading the roster',
  get_injuries: 'Checking injuries', get_odds: 'Checking odds', get_recent_performances: 'Reading recent box scores', get_team_stats: 'Comparing team stats', get_news: 'Reading headlines',
  get_power_rankings: 'Checking power rankings', get_player_game_log: 'Reading the game log', get_plus_minus: 'Checking plus-minus',
};
const RUN = {
  async get_standings({ conference }) {
    const confs = await NBA.need('standings');
    return confs.filter(c => !conference || conference === 'both' || c.abbr === conference).map(c => ({
      conference: c.name, teams: c.rows.map(r => ({ seed: r.seed, team: r.full, w: r.w, l: r.l, pct: r.pct, gb: r.gb, streak: r.strk, last10: r.l10, home: r.home, road: r.road, ppg: +NBA.fix(r.ppg), opp_ppg: +NBA.fix(r.opp) })),
    }));
  },
  async get_team_overview({ team }) {
    const t = resolveTeam(team);
    if (!t) return { error: `No team matches "${team}".` };
    const [confs, sch, roster] = await Promise.all([NBA.need('standings'), NBA.need('tsched:' + t.id), NBA.need('roster:' + t.id).catch(() => null)]);
    await Promise.allSettled([NBA.need('players'), NBA.need('teamstats'), NBA.need('injuries')]);
    const r = confs.flatMap(c => c.rows).find(x => x.id === t.id) || {};
    const ts = (NBA.data('teamstats') || []).find(x => x.id === t.id);
    const next = sch.events.find(e => e.state !== 'post'), last = sch.events.filter(e => e.state === 'post').slice(-1)[0];
    const lead = k => { const p = NBA.leaders({ stat: k, teamId: t.id, limit: 1 })[0]; return p ? `${p.name} ${NBA.statFmt(k, NBA.statValue(k, p, 'game'), 'game')}` : null; };
    const inj = ((NBA.data('injuries') || []).find(g => g.teamId === t.id) || { list: [] }).list;
    return {
      team: t.full, record: `${r.w}-${r.l}`, standing: sch.standing, conference_seed: r.seed ? `${NBA.ord(r.seed)} in the ${r.conf}` : null,
      streak: r.strk, last10: r.l10, home: r.home, road: r.road, coach: roster && roster.coach,
      scoring: ts ? { ppg: +NBA.fix(ts.ppg), ppg_rank: ts.rank.ppg, opp_ppg: +NBA.fix(ts.oppg), opp_rank: ts.rank.oppg, margin: +NBA.fix(ts.diff), margin_rank: ts.rank.diff } : { ppg: r.ppg, opp_ppg: r.opp },
      next_game: next ? { date: localDate(next.date), time: NBA.fmtTime(next.date), opponent: NBA.T(next.oppId).full, where: next.home ? 'home' : 'away', status: next.state === 'in' ? 'live now' : 'scheduled' } : null,
      last_game: last ? { date: localDate(last.date), opponent: NBA.T(last.oppId).full, result: `${last.won ? 'W' : 'L'} ${last.my}-${last.their}` } : null,
      team_leaders: { points: lead('pts'), rebounds: lead('reb'), assists: lead('ast'), steals: lead('stl'), blocks: lead('blk'), threes: lead('tpm') },
      injuries: inj.map(i => `${i.name}: ${i.status}${i.type ? ' (' + i.type + ')' : ''}`),
    };
  },
  async get_team_schedule({ team, which = 'upcoming', count = 10 }) {
    const t = resolveTeam(team);
    if (!t) return { error: `No team matches "${team}".` };
    return { team: t.full, which, games: await teamSchedule(t, which, Math.max(1, Math.min(82, count || 10))) };
  },
  async get_scoreboard({ date }) {
    const key = !date || date === NBA.today ? 'day:' : 'day:' + NBA.paramOf(date);
    const d = await NBA.need(key);
    return { date: d.day, games: NBA.sortGames(d.games).map(gameLine) };
  },
  async get_game_box_score({ game_id }) {
    const s = await NBA.need('summary:' + String(game_id).replace(/\D/g, ''));
    return {
      game: `${s.away.full} ${s.away.score} at ${s.home.full} ${s.home.score}`, status: s.detail,
      teams: s.box.map(b => ({
        team: NBA.T(b.teamId).full, columns: ['player', ...b.labels], totals: b.totals,
        players: b.players.filter(p => !p.dnp).map(p => [p.full + (p.starter ? ' (starter)' : ''), ...p.stats]),
      })),
    };
  },
  async get_league_leaders({ stat, mode = 'game', limit = 10, conference, team, position, lowest }) {
    await Promise.all([NBA.need('players'), NBA.need('standings')]);
    if (!NBA.STATS[stat]) return { error: 'Unknown stat ' + stat };
    const t = team ? resolveTeam(team) : null;
    const list = NBA.leaders({ stat, mode, limit: Math.min(50, limit || 10), conf: conference, teamId: t && t.id, pos: position, lowest });
    return { stat: NBA.STATS[stat].label, mode: mode === 'total' ? 'season totals' : 'per game (qualified players)', leaders: list.map((p, i) => ({ rank: i + 1, player: p.name, team: p.team, games: p.gp, value: NBA.statFmt(stat, NBA.statValue(stat, p, mode), mode) })) };
  },
  async get_player({ name }) {
    await Promise.allSettled([NBA.need('players'), NBA.need('injuries')]);
    const hits = NBA.findPlayers(name);
    const exact = (NBA.players() || []).filter(p => p.name.toLowerCase().includes(String(name).toLowerCase()));
    const list = (exact.length ? exact : hits).slice(0, 3);
    if (!list.length) return { error: `No player matching "${name}" has played this season.` };
    return list.map(p => {
      const inj = (NBA.data('injuries') || []).flatMap(g => g.list).find(i => i.id === p.id);
      return Object.assign(playerLine(p), { injury: inj ? `${inj.status}${inj.type ? ' (' + inj.type + ')' : ''}${inj.ret ? ', est. return ' + inj.ret : ''}` : 'none listed' });
    });
  },
  async get_team_roster({ team }) {
    const t = resolveTeam(team);
    if (!t) return { error: `No team matches "${team}".` };
    const [roster] = await Promise.all([NBA.need('roster:' + t.id), NBA.need('players').catch(() => null)]);
    return { team: t.full, coach: roster.coach, players: roster.players.map(p => {
      const s = NBA.playerById(p.id);
      return { name: p.name, jersey: p.jersey, pos: p.pos, age: p.age, height: p.ht, status: p.injury || 'active', gp: s ? s.gp : 0, pts: s ? +NBA.fix(s.pts) : null, reb: s ? +NBA.fix(s.reb) : null, ast: s ? +NBA.fix(s.ast) : null };
    }) };
  },
  async get_injuries({ team }) {
    const inj = await NBA.need('injuries');
    const t = team ? resolveTeam(team) : null;
    if (team && !t) return { error: `No team matches "${team}".` };
    return inj.filter(g => !t || g.teamId === t.id).map(g => ({ team: NBA.T(g.teamId).full || g.teamName, players: g.list.map(i => ({ name: i.name, pos: i.pos, status: i.status, injury: [i.side, i.type, i.detail].filter(Boolean).join(' '), est_return: i.ret || null, note: i.short })) }));
  },
  async get_odds({ market, limit = 10 }) {
    const markets = await NBA.need('futures');
    await NBA.need('players').catch(() => {});
    if (market === 'list') return markets.map(m => m.name);
    const m = marketFor(market, markets);
    if (!m) return { error: `DraftKings has no ${market} market listed right now.`, available: markets.map(x => x.name) };
    return { market: m.name, sportsbook: m.provider, odds: await oddsEntries(m, Math.min(30, limit || 10)) };
  },
  async get_recent_performances({ days = 7, conference, team, sort = 'gameScore', limit = 15 }) {
    const t = team ? resolveTeam(team) : null;
    const r = await NBA.recentPerformances({ days: Math.max(1, Math.min(14, days)), conf: conference, teamId: t && t.id, sort, limit: Math.min(30, limit) });
    const r1 = v => Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
    return { from: r.from, to: r.to, games_read: r.games, players: r.players.map(p => ({ player: p.name, team: p.team, games: p.gp, game_score: r1(p.gameScore), pts: r1(p.pts), reb: r1(p.reb), ast: r1(p.ast), stl: r1(p.stl), blk: r1(p.blk), plus_minus: r1(p.pm), fg_pct: r1(p.fgPct), best_scoring_game: p.bestPts })) };
  },
  async get_team_stats({ sort = 'ppg' }) {
    const ts = await NBA.need('teamstats');
    const low = ['oppg', 'tov'].includes(sort);
    return ts.slice().sort((a, b) => low ? a[sort] - b[sort] : b[sort] - a[sort]).map(t => ({ team: NBA.T(t.id).full || t.name, ppg: +NBA.fix(t.ppg), opp_ppg: +NBA.fix(t.oppg), margin: +NBA.fix(t.diff), fg_pct: +NBA.fix(t.fgp), three_pct: +NBA.fix(t.tpp), ft_pct: +NBA.fix(t.ftp), reb: +NBA.fix(t.rpg), ast: +NBA.fix(t.apg), tov: +NBA.fix(t.tov), stl: +NBA.fix(t.spg), blk: +NBA.fix(t.bpg), threes_made: +NBA.fix(t.tpm), ranks: t.rank }));
  },
  async get_news({ team }) {
    const t = team ? resolveTeam(team) : null;
    const list = await NBA.need('news:' + (t ? t.abbr.toLowerCase() : ''));
    return list.slice(0, 12).map(a => ({ headline: a.headline, summary: a.description, published: a.published, type: a.type }));
  },
  async get_power_rankings({ sort = 'net' }) {
    await Promise.allSettled([NBA.need('teamstats'), NBA.need('standings'), recentDays()]);
    const rows = NBA.powerRows() || [];
    const key = { last7: 'fm' }[sort] || sort, low = sort === 'drtg';
    const r1 = v => Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
    return rows.slice().sort((a, b) => low ? a[key] - b[key] : (b[key] ?? -1e9) - (a[key] ?? -1e9)).map(t => ({
      team: NBA.T(t.id).full, record: `${t.w}-${t.l}`, net_rating: r1(t.net), net_rank: t.rank.net, off_rating: r1(t.ortg), off_rank: t.rank.ortg,
      def_rating: r1(t.drtg), def_rank: t.rank.drtg, pace: r1(t.pace), last_7_days: t.f ? `${t.f.w}-${t.f.l}` : null, last_7_margin: r1(t.fm),
      season_margin: r1(t.season), trend: r1(t.trend), streak: t.strk,
    }));
  },
  async get_player_game_log({ name, count = 10 }) {
    await NBA.need('players');
    const p = NBA.findPlayers(name)[0] || (NBA.players() || []).find(x => x.name.toLowerCase().includes(String(name).toLowerCase()));
    if (!p) return { error: `No player matching "${name}" has played this season.` };
    const log = await NBA.need('gamelog:' + p.id);
    return { player: p.name, team: p.team, games: log.slice(0, Math.min(82, count || 10)).map(g => ({ date: localDate(g.date), opponent: (g.home ? 'vs ' : '@ ') + g.oppAbbr, result: `${g.result} ${g.score}`, min: g.min, pts: g.pts, reb: g.reb, ast: g.ast, stl: g.stl, blk: g.blk, tov: g.tov, fg: g.fg, three: g.tp, ft: g.ft })) };
  },
  async get_plus_minus({ name, limit = 10 }) {
    await NBA.need('players');
    if (name) {
      const p = NBA.findPlayers(name)[0] || (NBA.players() || []).find(x => x.name.toLowerCase().includes(String(name).toLowerCase()));
      if (!p) return { error: `No player matching "${name}" has played this season.` };
      const v = await NBA.need('pm:' + p.id);
      return { player: p.name, team: p.team, games: p.gp, plus_minus_total: v, plus_minus_per_game: v == null ? null : Math.round(v / Math.max(1, p.gp) * 10) / 10 };
    }
    const rows = await NBA.need('pmlead');
    return rows.slice().sort((a, b) => b.total - a.total).slice(0, Math.min(30, limit || 10)).map((r, i) => { const p = NBA.playerById(r.id) || {}; return { rank: i + 1, player: p.name, team: p.team, games: r.gp, plus_minus_total: r.total, per_game: Math.round(r.total / Math.max(1, r.gp) * 10) / 10 }; });
  },
};

/* ---------- built-in answers (no API key needed) ---------- */
const table = (cols, rows) => `<div class="tblwrap"><table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const STAT_WORDS = [
  [/(three|3)[- ]?(point|pt)?\w*\s*(%|percent|percentage|shoot)/, 'tpp'], [/free[- ]throw/, 'ftp'], [/field[- ]goal\s*(%|percent)|\bfg ?%/, 'fgp'], [/true shooting|\bts ?%/, 'ts'],
  [/\b(threes|3s|3-pointers|three-pointers|3pm|3 pointers|three pointers)\b/, 'tpm'], [/rebound|\brpg\b|boards/, 'reb'], [/assist|\bapg\b|dimes/, 'ast'], [/steal/, 'stl'], [/block/, 'blk'],
  [/turnover/, 'tov'], [/minute/, 'min'], [/double[- ]double/, 'dd'], [/triple[- ]double/, 'td'], [/point|scor|\bppg\b|buckets/, 'pts'],
];
async function quick(q) {
  const s = ' ' + q.toLowerCase().replace(/[?!,]/g, ' ') + ' ';
  await Promise.allSettled([NBA.need('standings'), NBA.need('players')]);
  const teams = NBA.findTeams(q), team = teams[0];
  const nm = s.match(/\b(\d{1,2})\b/), n = nm ? Math.min(30, +nm[1]) : null;
  const conf = /\beast(ern)?\b/.test(s) ? 'East' : /\bwest(ern)?\b/.test(s) ? 'West' : null;
  const teamWords = new Set(teams.flatMap(t => [t.name, t.location].filter(Boolean).map(x => x.toLowerCase())));
  const players = NBA.findPlayers(q).filter(p => !teamWords.has(p.name.split(' ').slice(-1)[0].toLowerCase())).slice(0, 2);
  const player = players[0];
  const stat = (STAT_WORDS.find(([re]) => re.test(s)) || [])[1];

  if (/\bmvp\b|most valuable/.test(s)) return mvpAnswer();
  if (/champion|title|win (it all|the finals)|finals odds|favorite to win/.test(s)) return oddsAnswer('championship', 'Championship odds');
  if (teams.length >= 2 && /\b(vs|versus|against|play|meet|matchup|head to head|h2h|series|beat)\b/.test(s)) return matchupAnswer(teams[0], teams[1]);
  if (/plus[ -]?minus|\+\/-|\+-/.test(s)) return pmAnswer(player);
  if (players.length >= 2 && /\b(vs|versus|compare|comparison|or|better)\b/.test(s)) return compareAnswer(players[0], players[1]);
  if (player && /\b(last|recent|lately|game ?log|past)\b/.test(s) && !/week|days/.test(s)) return gamelogAnswer(player, n || 5);
  if (team && /next|upcoming|schedule|coming up|play next|when do/.test(s)) return scheduleAnswer(team, 'upcoming', n || 5);
  if (team && /\b(last|recent|results|previous|past)\b/.test(s) && !/week|days/.test(s)) return scheduleAnswer(team, 'recent', n || 5);
  if (/last night|yesterday/.test(s)) return slateAnswer('yesterday');
  if (/tonight|today|on tv|who plays|games on/.test(s) && !player && teams.length < 2) return slateAnswer('today');
  if (/injur|hurt|\bout\b/.test(s)) return injuriesAnswer(team);
  if (/(best|top|hottest|who.*(dominat|played)).*(last|past|this) (week|\d+ days)|(last|past|this) (week|\d+ days).*(best|top)/.test(s)) {
    const dm = s.match(/(\d+) days/);
    return recentAnswer({ days: dm ? Math.min(14, +dm[1]) : 7, conf, team: team && /\b(on|for)\b/.test(s) ? team : null });
  }
  if (!team && /power rank|best team|top teams|net rating|rank(ing)? (all|the) teams|team rankings/.test(s)) return powerAnswer();
  if (!player && /\b(hot|cold|slipping|struggling|rolling|form|trending)\b/.test(s)) return formAnswer(team);
  if (team && /rating|offense|offence|defense|defence|pace|efficien/.test(s)) return teamRatingAnswer(team);
  if (team && /roster|lineup|who plays for/.test(s)) return rosterAnswer(team);
  if (team && /news|headline/.test(s)) return newsAnswer(team);
  if (team && !stat && /best player|leader|leading|top scorer|who leads|star/.test(s)) return teamLeadersAnswer(team);
  if (stat && /lead|leader|top|most|best|highest|who has|rank|averag|league/.test(s)) return leadersAnswer(stat, /total/.test(s) ? 'total' : 'game', team, conf, n || 10);
  if (/standing|seed|playoff picture|table/.test(s)) return standingsAnswer(conf);
  if (player && (!team || s.includes(player.name.toLowerCase()))) return playerAnswer(player);
  if (team) return teamAnswer(team);
  return null;
}
const recentDays = () => Promise.allSettled(Array.from({ length: 7 }, (_, i) => NBA.need(i === 0 ? 'day:' : 'day:' + NBA.paramOf(NBA.shiftIso(NBA.today, -i)))));
const signed = v => (v > 0 ? '+' : '') + NBA.fix(v);
async function matchupAnswer(a, b) {
  const sch = await NBA.need('tsched:' + a.id);
  const games = sch.events.filter(e => e.oppId === b.id);
  if (!games.length) return `<p>The ${esc(a.name)} and ${esc(b.name)} don't play each other in the regular season schedule.</p>`;
  const done = games.filter(e => e.state === 'post'), wins = done.filter(e => e.won).length, next = games.find(e => e.state !== 'post');
  let lead;
  if (!done.length) lead = `They haven't played yet this season.`;
  else if (NBA.S.spoilers) lead = `They've played ${done.length} time${done.length > 1 ? 's' : ''} this season.`;
  else lead = wins * 2 === done.length ? `The season series is tied ${wins}-${wins}.` : `The ${esc(wins * 2 > done.length ? a.name : b.name)} lead the season series ${Math.max(wins, done.length - wins)}-${Math.min(wins, done.length - wins)}.`;
  const nx = next ? ` Next meeting: ${esc(localDate(next.date))} at ${esc(NBA.fmtTime(next.date))}, ${next.home ? 'in ' + esc(a.location || a.name) : 'in ' + esc(b.location || b.name)}.` : '';
  return `<p><b>${esc(a.name)} vs. ${esc(b.name)}:</b> ${lead}${nx}</p>
    ${table(['Date', 'Where', 'Result'], games.map(e => [esc(localDate(e.date)), e.home ? `at ${esc(a.abbr)}` : `at ${esc(b.abbr)}`,
      e.state === 'post' ? (NBA.S.spoilers ? 'Final' : `${esc(a.abbr)} ${e.won ? 'won' : 'lost'} ${esc(e.my)}–${esc(e.their)}`) : esc(NBA.fmtTime(e.date))]))}`;
}
async function slateAnswer(which) {
  const key = which === 'yesterday' ? 'day:' + NBA.paramOf(NBA.shiftIso(NBA.today, -1)) : 'day:';
  const d = await NBA.need(key);
  const label = which === 'yesterday' ? 'Yesterday' : 'Today';
  if (!d.games.length) return `<p>No NBA games ${which === 'yesterday' ? 'yesterday' : 'today'}.</p>`;
  const games = NBA.sortGames(d.games);
  const cell = g => g.state === 'pre' ? esc(NBA.fmtTime(g.date)) + (g.tv ? ` · ${esc(g.tv)}` : '')
    : NBA.S.spoilers ? esc(g.state === 'in' ? 'Live' : 'Final') : `${g.state === 'in' ? '<b>Live</b> ' : ''}${esc(g.away.abbr)} ${esc(g.away.score)} – ${esc(g.home.abbr)} ${esc(g.home.score)}${g.state === 'in' ? ` · ${esc(g.detail)}` : ''}`;
  return `<p><b>${label}: ${games.length} game${games.length > 1 ? 's' : ''}</b> (${esc(NBA.fmtDay(d.day, { weekday: 'long', month: 'short', day: 'numeric' }))}).</p>
    ${table(['Matchup', which === 'yesterday' ? 'Final' : 'Time or score'], games.map(g => [`${esc(g.away.name)} @ ${esc(g.home.name)}`, cell(g)]))}`;
}
async function powerAnswer() {
  await Promise.allSettled([NBA.need('teamstats'), recentDays()]);
  const rows = (NBA.powerRows() || []).sort((a, b) => b.net - a.net).slice(0, 10);
  if (!rows.length) return `<p>Team stats haven't loaded yet. Try again in a moment.</p>`;
  return `<p><b>The ${esc(NBA.T(rows[0].id).name)} rank first by net rating</b> at ${signed(rows[0].net)} points per 100 possessions.</p>
    ${table(['#', 'Team', 'W-L', 'Net', 'Off rtg', 'Def rtg'], rows.map((t, i) => [i + 1, esc(NBA.T(t.id).name), `${t.w}-${t.l}`, `<b>${signed(t.net)}</b>`, `${NBA.fix(t.ortg)} (${NBA.ord(t.rank.ortg)})`, `${NBA.fix(t.drtg)} (${NBA.ord(t.rank.drtg)})`]))}
    <p><a href="#teams">Full power rankings →</a></p>`;
}
async function formAnswer(team) {
  if (NBA.S.spoilers) return `<p>Recent form is hidden while spoiler mode is on.</p>`;
  await Promise.allSettled([NBA.need('teamstats'), recentDays()]);
  const rows = (NBA.powerRows() || []).filter(t => t.f && t.f.gp >= 1);
  if (team) {
    const t = rows.find(x => x.id === team.id);
    if (!t) return `<p>The ${esc(team.name)} haven't played in the last week.</p>`;
    const word = t.trend > 3 ? 'trending up' : t.trend < -3 ? 'trending down' : 'playing about to their season level';
    return `<p><b>The ${esc(team.name)} are ${t.f.w}-${t.f.l} over the last 7 days</b>, outscoring opponents by ${signed(t.fm)} a game against ${signed(t.season)} for the season, so they're ${word}.${t.strk ? ` Current streak: ${esc(t.strk)}.` : ''}</p>`;
  }
  const hot = rows.filter(t => t.f.gp >= 2 && t.f.w > t.f.l).sort((a, b) => b.fm - a.fm).slice(0, 5);
  const slip = rows.filter(t => t.f.gp >= 2 && t.trend < 0 && (t.f.l > t.f.w || /^L/.test(t.strk || ''))).sort((a, b) => a.trend - b.trend).slice(0, 5);
  const list = l => table(['Team', 'Last 7 days', 'Margin', 'Streak'], l.map(t => [esc(NBA.T(t.id).name), `${t.f.w}-${t.f.l}`, signed(t.fm), esc(t.strk || '')]));
  return `<p><b>Hot right now</b></p>${hot.length ? list(hot) : '<p class="mut">No team has a winning week with 2+ games yet.</p>'}<p><b>Slipping</b></p>${slip.length ? list(slip) : '<p class="mut">No one is clearly slipping.</p>'}`;
}
async function teamRatingAnswer(team) {
  await Promise.allSettled([NBA.need('teamstats'), recentDays()]);
  const t = (NBA.powerRows() || []).find(x => x.id === team.id);
  if (!t) return `<p>Team stats haven't loaded yet. Try again in a moment.</p>`;
  return `<p><b>The ${esc(team.name)} have a net rating of ${signed(t.net)}</b>, ${NBA.ord(t.rank.net)} in the NBA.</p>
    ${table(['', 'Value', 'League rank'], [['Offensive rating', NBA.fix(t.ortg), NBA.ord(t.rank.ortg)], ['Defensive rating', NBA.fix(t.drtg), NBA.ord(t.rank.drtg)], ['Pace (possessions)', NBA.fix(t.pace), NBA.ord(t.rank.pace)], ['Points per game', NBA.fix(t.ppg), NBA.ord(t.rank.ppg)], ['Allowed per game', NBA.fix(t.oppg), NBA.ord(t.rank.oppg)]])}
    <p class="note">Ratings are points per 100 possessions, estimated from ESPN's team stats.</p>`;
}
async function rosterAnswer(team) {
  const r = await RUN.get_team_roster({ team: team.abbr });
  return `<p><b>${esc(r.team)} roster</b>${r.coach ? ` · Coach ${esc(r.coach)}` : ''}</p>
    ${table(['Player', '#', 'Pos', 'Age', 'PTS', 'REB', 'AST', 'Status'], r.players.slice().sort((a, b) => (b.pts ?? -1) - (a.pts ?? -1)).map(p => [esc(p.name), esc(p.jersey || ''), esc(p.pos || ''), esc(p.age ?? ''), p.pts ?? '–', p.reb ?? '–', p.ast ?? '–', esc(p.status)]))}`;
}
async function newsAnswer(team) {
  const list = await NBA.need('news:' + team.abbr.toLowerCase());
  const items = list.filter(a => a.links && a.links.web).slice(0, 6);
  if (!items.length) return `<p>No recent ${esc(team.name)} headlines.</p>`;
  return `<p><b>Latest ${esc(team.name)} news</b></p><ul>${items.map(a => `<li><a href="${esc(a.links.web.href)}" target="_blank" rel="noopener">${esc(a.headline)}</a> <span class="mut">${esc(NBA.relTime(a.published))}</span></li>`).join('')}</ul>`;
}
function teamLeadersAnswer(team) {
  const rows = ['pts', 'reb', 'ast', 'stl', 'blk', 'tpm'].map(k => [k, NBA.leaders({ stat: k, teamId: team.id, limit: 1 })[0]]).filter(x => x[1]);
  if (!rows.length) return `<p>No ${esc(team.name)} stats yet.</p>`;
  const top = rows[0][1];
  return `<p><b>${esc(top.name)} leads the ${esc(team.name)} in scoring</b> at ${NBA.fix(top.pts)} points a game.</p>
    ${table(['Category', 'Leader', 'Per game'], rows.map(([k, p]) => [esc(NBA.STATS[k].label), esc(p.name), NBA.statFmt(k, NBA.statValue(k, p, 'game'), 'game')]))}`;
}
function compareAnswer(a, b) {
  const R = [['PTS', 'pts'], ['REB', 'reb'], ['AST', 'ast'], ['STL', 'stl'], ['BLK', 'blk'], ['3PM', 'tpm'], ['FG%', 'fgp'], ['3P%', 'tpp'], ['TS%', 'ts'], ['TOV', 'tov', true], ['MIN', 'min']];
  const cell = (k, x, y, low) => { const v = NBA.statValue(k, x, 'game'), w = NBA.statValue(k, y, 'game'); const s = NBA.statFmt(k, v, 'game'); return (low ? v < w : v > w) ? `<b>${s}</b>` : s; };
  return `<p><b>${esc(a.name)} vs. ${esc(b.name)}</b>, season averages (the better number is bold):</p>
    ${table(['', esc(a.name), esc(b.name)], [['Team', esc(a.team), esc(b.team)], ['Games', a.gp, b.gp], ...R.map(([l, k, low]) => [l, cell(k, a, b, low), cell(k, b, a, low)])])}`;
}
async function gamelogAnswer(p, n) {
  const log = await NBA.need('gamelog:' + p.id);
  if (!log.length) return `<p>${esc(p.name)} hasn't played a game yet.</p>`;
  const games = log.slice(0, n);
  const avg = k => NBA.fix(games.reduce((s, g) => s + (parseFloat(g[k]) || 0), 0) / games.length);
  return `<p><b>${esc(p.name)}, last ${games.length} game${games.length > 1 ? 's' : ''}:</b> ${avg('pts')} points, ${avg('reb')} rebounds and ${avg('ast')} assists a game.</p>${logTable(games)}`;
}
const logTable = games => table(['Date', 'Opp', 'Result', 'MIN', 'PTS', 'REB', 'AST', 'FG', '3PT'], games.map(g => [esc(localDate(g.date)), `${g.home ? 'vs' : '@'} ${esc(g.oppAbbr || '')}`,
  NBA.S.spoilers ? '–' : `${esc(g.result)} ${esc(g.score)}`, esc(g.min ?? ''), `<b>${esc(g.pts ?? '')}</b>`, esc(g.reb ?? ''), esc(g.ast ?? ''), esc(g.fg ?? ''), esc(g.tp ?? '')]));
async function pmAnswer(p) {
  if (p) {
    const v = await NBA.need('pm:' + p.id);
    if (v == null) return `<p>ESPN has no plus-minus for ${esc(p.name)} yet.</p>`;
    return `<p><b>${esc(p.name)} is ${signed(v).replace('.0', '')} this season</b>, ${signed(v / Math.max(1, p.gp))} per game over ${p.gp} game${p.gp > 1 ? 's' : ''}. That's how much the ${esc(NBA.T(p.teamId).name)} outscore opponents with ${esc(p.name)} on the floor.</p>`;
  }
  const rows = await NBA.need('pmlead');
  const list = rows.slice().sort((a, b) => b.total - a.total).slice(0, 10);
  if (!list.length) return '<p>No plus-minus leaders yet. ESPN has no season plus-minus for rotation players right now, so try again shortly.</p>';
  return `<p><b>${esc((NBA.playerById(list[0].id) || {}).name || '')} leads the league in plus-minus</b> at ${signed(list[0].total).replace('.0', '')}.</p>
    ${table(['#', 'Player', 'Team', 'GP', '+/-', 'Per game'], list.map((r, i) => { const pl = NBA.playerById(r.id) || {}; return [i + 1, esc(pl.name || ''), esc(pl.team || ''), r.gp, `<b>${signed(r.total).replace('.0', '')}</b>`, signed(r.total / Math.max(1, r.gp))]; }))}
    <p class="note">Rotation players only (20+ minutes a game).</p>`;
}
async function teamAnswer(t) {
  const o = await RUN.get_team_overview({ team: t.abbr });
  const nx = o.next_game ? `Next: ${o.next_game.where === 'home' ? 'vs' : '@'} ${esc(o.next_game.opponent)}, ${esc(o.next_game.date)} at ${esc(o.next_game.time)}.` : '';
  return `<p><b>The ${esc(t.name)} are ${esc(o.record)}</b>${o.conference_seed ? `, ${esc(o.conference_seed)}` : ''}${o.streak ? `, on a ${esc(o.streak)} streak` : ''}.</p>
    ${table(['Last 10', 'Home', 'Road', 'Points', 'Allowed', 'Margin'], [[esc(o.last10 || '–'), esc(o.home || '–'), esc(o.road || '–'), `${o.scoring.ppg}${o.scoring.ppg_rank ? ` (${NBA.ord(o.scoring.ppg_rank)})` : ''}`, `${o.scoring.opp_ppg}${o.scoring.opp_rank ? ` (${NBA.ord(o.scoring.opp_rank)})` : ''}`, `${o.scoring.margin ?? '–'}`]])}
    <p>${nx} ${o.last_game ? `Last: ${esc(o.last_game.result)} vs ${esc(o.last_game.opponent)}.` : ''}</p>
    <p><a href="#teams/${t.id}">Open the ${esc(t.name)} page →</a></p>`;
}
async function scheduleAnswer(t, which, count) {
  const games = await teamSchedule(t, which, count);
  if (!games.length) return `<p>The ${esc(t.name)} have no ${which === 'recent' ? 'completed' : 'upcoming'} games listed.</p>`;
  const title = which === 'recent' ? `${esc(t.name)} last ${games.length} games` : `${esc(t.name)} next ${games.length} games`;
  return `<p><b>${title}</b></p>${table(['Date', '', 'Opponent', which === 'recent' ? 'Result' : 'Time'], games.map(g => [esc(g.date), g.where === 'home' ? 'vs' : '@', esc(g.opponent), esc(g.result || g.time)]))}`;
}
async function leadersAnswer(stat, mode, team, conf, n) {
  const r = await RUN.get_league_leaders({ stat, mode, limit: n, conference: conf, team: team && team.abbr });
  if (!r.leaders.length) return `<p>No leaders yet for that stat.</p>`;
  const top = r.leaders[0];
  return `<p><b>${esc(top.player)} (${esc(top.team)}) leads${team ? ' the ' + esc(team.name) : conf ? ' the ' + conf : ' the league'} in ${esc(r.stat.toLowerCase())}</b> at ${esc(top.value)} ${mode === 'total' ? 'total' : 'per game'}.</p>
    ${table(['#', 'Player', 'Team', 'GP', NBA.STATS[stat].short], r.leaders.map(l => [l.rank, esc(l.player), esc(l.team), l.games, `<b>${esc(l.value)}</b>`]))}`;
}
async function standingsAnswer(conf) {
  const r = await RUN.get_standings({ conference: conf || 'both' });
  return r.map(c => `<p><b>${esc(c.conference)}</b></p>${table(['#', 'Team', 'W-L', 'GB', 'Streak'], c.teams.map(t => [t.seed, esc(t.team), `${t.w}-${t.l}`, esc(t.gb), esc(t.streak)]))}`).join('');
}
async function injuriesAnswer(team) {
  const r = await RUN.get_injuries({ team: team && team.abbr });
  if (r.error) return `<p>${esc(r.error)}</p>`;
  if (!r.length) return `<p>${team ? `No ${esc(team.name)} players are` : 'No one is'} on the injury report.</p>`;
  if (team) return `<p><b>${esc(team.name)} injury report</b></p>${table(['Player', 'Status', 'Injury', 'Est. return'], r[0].players.map(p => [esc(p.name), esc(p.status), esc(p.injury), esc(p.est_return ? NBA.fmtDay(p.est_return, { month: 'short', day: 'numeric' }) : '–')]))}`;
  const outs = r.flatMap(t => t.players.filter(p => /out/i.test(p.status)).map(p => [esc(p.name), esc(t.team), esc(p.injury)]));
  return `<p><b>${outs.length} players are listed as out</b> across ${r.length} teams.</p>${table(['Player', 'Team', 'Injury'], outs.slice(0, 25))}<p><a href="#news">See the full injury report →</a></p>`;
}
async function oddsAnswer(market, title) {
  const r = await RUN.get_odds({ market, limit: 10 });
  if (r.error) return `<p>${esc(r.error)}</p>`;
  const top = r.odds[0];
  return `<p><b>${esc(top.name)} ${market === 'championship' ? 'are' : 'is'} the favorite at ${esc(top.odds)}</b> (about ${top.implied_pct}% implied) on ${esc(r.sportsbook)}.</p>
    ${table(['#', title.includes('MVP') ? 'Player' : 'Team', 'Odds', 'Implied'], r.odds.map((o, i) => [i + 1, esc(o.name) + (o.team ? ` <span class="mut">${esc(o.team)}</span>` : ''), `<b>${esc(o.odds)}</b>`, o.implied_pct + '%']))}`;
}
async function mvpAnswer() {
  const odds = await oddsAnswer('mvp', 'MVP odds');
  await NBA.need('players').catch(() => {});
  const pra = NBA.leaders({ stat: 'pra', limit: 5 });
  return odds + (pra.length ? `<p>On the stat sheet, the top all-around producers (points + rebounds + assists per game) are ${pra.map(p => `${esc(p.name)} ${NBA.fix(p.pra)}`).join(', ')}.</p>` : '');
}
async function recentAnswer({ days, conf, team }) {
  const r = await RUN.get_recent_performances({ days, conference: conf, team: team && team.abbr, limit: 10 });
  if (!r.players.length) return `<p>No box scores in that window yet.</p>`;
  const top = r.players[0];
  return `<p><b>${esc(top.player)} (${esc(top.team)}) has been the best${conf ? ' in the ' + conf : ''}${team ? ' for the ' + esc(team.name) : ''} over the last ${days} days</b>, averaging ${top.pts} points, ${top.reb} rebounds and ${top.ast} assists in ${top.games} game${top.games > 1 ? 's' : ''}.</p>
    ${table(['#', 'Player', 'Team', 'GP', 'Game Score', 'PTS', 'REB', 'AST', '+/-'], r.players.map((p, i) => [i + 1, esc(p.player), esc(p.team), p.games, `<b>${p.game_score}</b>`, p.pts, p.reb, p.ast, p.plus_minus]))}
    <p class="note">Ranked by average Game Score, a one-number rating of a box score line, from ${r.games_read} games.</p>`;
}
async function playerAnswer(p) {
  const l = playerLine(p);
  const [log, pm] = await Promise.all([NBA.need('gamelog:' + p.id).catch(() => null), NBA.need('pm:' + p.id).catch(() => null)]);
  return `<div style="display:flex;gap:14px;align-items:center">${UI.hs(p.headshot)}<div><b style="font-size:17px">${esc(p.name)}</b><div class="mut">${esc(l.team)} · ${esc(p.pos)}${p.age ? ' · age ' + p.age : ''} · ${p.gp} games</div></div></div>
    ${table(['PTS', 'REB', 'AST', 'STL', 'BLK', '3PM', 'FG%', '3P%', 'FT%', 'TS%', 'MIN', '+/-'], [[l.per_game.pts, l.per_game.reb, l.per_game.ast, l.per_game.stl, l.per_game.blk, l.per_game.threes_made, l.shooting.fg_pct ?? '–', l.shooting.three_pct ?? '–', l.shooting.ft_pct ?? '–', l.shooting.true_shooting_pct ?? '–', l.minutes, pm != null ? signed(pm / Math.max(1, p.gp)) : '–']].map(r => r.map(v => esc(v ?? '–'))))}
    <p class="mut">Season totals: ${l.totals.pts} points, ${l.totals.reb} rebounds, ${l.totals.ast} assists${p.dd ? `, ${p.dd} double-doubles` : ''}${p.td ? `, ${p.td} triple-doubles` : ''}${pm != null ? `, ${signed(pm).replace('.0', '')} plus-minus` : ''}.</p>
    ${log && log.length ? `<p><b>Last ${Math.min(5, log.length)} games</b></p>${logTable(log.slice(0, 5))}` : ''}`;
}

/* ---------- Claude ---------- */
let sdk = null, sdkTries = 0;
async function loadSdk() {
  // Forget a failed import so the next question tries again (offline on a train, say). The retry
  // URL is new because browsers can remember a failed module fetch for the life of the page.
  if (!sdk) sdk = import(SDK_URL + (sdkTries ? '?retry=' + sdkTries : '')).then(m => m.default || m.Anthropic, () => {
    sdk = null; sdkTries++;
    throw new Error("Couldn't load Claude. Check your connection and try again.");
  });
  return sdk;
}
const SYSTEM = `You are the answer engine inside a personal NBA dashboard website. The site shows live data from ESPN's public feeds and DraftKings odds via ESPN, and your tools read that same data.

How to answer:
- Look facts up with the tools. Never guess records, stats, schedules, injuries or odds. If the tools can't answer something, say what's missing.
- Lead with the direct answer in one sentence. Add a short Markdown table or list only when it helps, such as for more than three items.
- Keep it tight: no preamble, no restating the question, no sign-off.
- Dates and times from the tools are already in the time zone named at the start of each question. Use them as given.
- "Last week" means the last 7 days. For "best player" questions, rank by average Game Score from get_recent_performances or by season stats, and say which measure you used.
- Odds are American odds from DraftKings. You may give the implied chance. Don't give betting advice.
- Use common team names (Warriors, Lakers) and full player names.`;
function contextLine() {
  const zone = NBA.S.tz === 'local' ? `the viewer's time zone (${Intl.DateTimeFormat().resolvedOptions().timeZone})` : 'Eastern Time (ET)';
  return `Today is ${NBA.fmtDay(NBA.today, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Times are in ${zone}. Season: ${NBA.SEASON_LABEL}. Viewer's team: ${NBA.T(NBA.S.myTeam).full || 'Golden State Warriors'}.`;
}
async function askClaude(turn, q) {
  const Anthropic = await loadSdk();
  const client = new Anthropic({ apiKey: NBA.aiKey.get(), dangerouslyAllowBrowser: true });
  const model = NBA.S.aiModel in PRICES ? NBA.S.aiModel : 'claude-opus-5-5';
  const start = A.convo.length;
  A.convo.push({ role: 'user', content: `${contextLine()}\n\nQuestion: ${q}` });
  const usage = { in: 0, out: 0, cw: 0, cr: 0 };
  let text = '', lookups = 0;
  try {
    for (let step = 0; step < 10; step++) {
      const params = { model, max_tokens: 16000, system: SYSTEM, tools: TOOLS, messages: A.convo, output_config: { effort: 'medium' }, cache_control: { type: 'ephemeral' } };
      const resp = model === 'claude-haiku-5-5'
        ? await client.messages.create(params)
        : await client.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
      const u = resp.usage || {};
      usage.in += u.input_tokens || 0; usage.out += u.output_tokens || 0; usage.cw += u.cache_creation_input_tokens || 0; usage.cr += u.cache_read_input_tokens || 0;
      A.convo.push({ role: 'assistant', content: resp.content });
      const said = resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      if (resp.stop_reason === 'refusal') { text = said || "Claude declined to answer that one."; break; }
      if (resp.stop_reason === 'pause_turn') continue;
      if (resp.stop_reason !== 'tool_use') { text = said || text; if (resp.stop_reason === 'max_tokens') text += '\n\n*(The answer was cut off.)*'; break; }
      if (said) text = said;
      const calls = resp.content.filter(b => b.type === 'tool_use');
      calls.forEach(c => turn.steps.push(TOOL_LABEL[c.name] || c.name));
      lookups += calls.length;
      renderPanel();
      const results = await Promise.all(calls.map(async c => {
        try {
          const input = typeof c.input === 'string' ? JSON.parse(c.input) : (c.input || {});
          const out = await RUN[c.name](input);
          return { type: 'tool_result', tool_use_id: c.id, content: JSON.stringify(out).slice(0, 60000) };
        } catch (e) {
          return { type: 'tool_result', tool_use_id: c.id, content: 'Lookup failed: ' + (e && e.message || 'unknown error'), is_error: true };
        }
      }));
      A.convo.push({ role: 'user', content: results });
    }
  } catch (e) {
    A.convo.length = start; // drop the unanswered question so the next one starts clean
    throw explain(e, Anthropic);
  }
  if (A.convo[A.convo.length - 1].role === 'user') A.convo.length = start; // step limit hit mid-lookup
  const [pi, po, pw, pr] = PRICES[model];
  const cost = (usage.in * pi + usage.out * po + usage.cw * pw + usage.cr * pr) / 1e6;
  return { html: md(text || 'No answer came back.'), meta: `${MODEL_NAMES[model]} · ${lookups} lookup${lookups === 1 ? '' : 's'} · about $${cost < .01 ? cost.toFixed(4) : cost.toFixed(2)}` };
}
function explain(e, Anthropic) {
  const is = name => Anthropic && Anthropic[name] && e instanceof Anthropic[name];
  if (is('AuthenticationError')) return new Error('Anthropic rejected the API key. Paste a new one at the bottom of this panel.');
  if (is('PermissionDeniedError')) return new Error("This API key doesn't have access to Claude Opus 5.5. Check the key's permissions in the Anthropic console.");
  if (is('NotFoundError')) return new Error("Claude Opus 5.5 isn't available to this API key. Check the key in the Anthropic console.");
  if (is('RateLimitError')) return new Error('Too many questions in a short time. Wait a moment and ask again.');
  if (is('InternalServerError')) return new Error('Anthropic is having trouble right now. Try again in a minute.');
  if (is('APIConnectionError')) return new Error("Couldn't reach Anthropic. Check your connection and try again.");
  if (is('APIError') && e.type === 'billing_error') return new Error('Your Anthropic account is out of credit. Add credit in the Anthropic console.');
  if (is('APIError')) return new Error('Anthropic returned an error: ' + (e.message || e.status));
  return new Error((e && e.message) || 'Something went wrong.');
}

/* ---------- panel ---------- */
function placePanel() {
  const top = $('#top').getBoundingClientRect().bottom;
  document.documentElement.style.setProperty('--ask-top', Math.round(top + 8) + 'px');
}
function renderPanel() {
  const el = $('#ask-panel');
  if (!A.open) { el.hidden = true; return; }
  el.hidden = false;
  placePanel();
  const hasKey = !!NBA.aiKey.get();
  const engine = hasKey ? MODEL_NAMES[NBA.S.aiModel] || 'Claude' : 'Built-in answers';
  const body = A.turns.length ? A.turns.map(t => `<div class="qa-q">${esc(t.q)}</div><div class="qa-a">
      ${t.pending ? `<div class="thinking"><i></i>${t.steps.length ? esc(t.steps[t.steps.length - 1]) + '…' : 'Thinking…'}</div>` : ''}
      ${t.error ? `<p class="qa-err">${esc(t.error)}</p>` : ''}
      ${t.html ? `<div class="md">${t.html}</div>` : ''}
      ${!t.pending && t.steps.length ? `<div class="qa-steps">${[...new Set(t.steps)].map(s => `<span>${esc(s)}</span>`).join('')}</div>` : ''}
      ${t.meta ? `<div class="qa-meta"><span>${esc(t.meta)}</span></div>` : ''}</div>`).join('')
    : `<p class="hint">Ask about records, schedules, stats, leaders, injuries, odds or recent form. Try one:</p>`;
  const sugg = `<div class="sugg">${SUGGESTIONS.map(s => `<button class="chip" data-act="ask-q" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
  // The API key lives here rather than in Settings, right where ask-anything needs it
  const keyNote = hasKey
    ? `<p class="note ask-keynote">Ask-anything is on with your Anthropic API key, saved only in this browser.${A.busy ? '' : ' <button class="link" data-act="ask-key-clear">Remove key</button>'}</p>`
    : `<div class="ask-key"><p class="note">The search bar answers common questions by itself. To ask anything, paste an Anthropic API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>. You pay Anthropic per question (about 5–15¢), separately from any Claude subscription. The key stays in this browser and is only sent to Anthropic.</p>
        <div class="keyrow"><label class="sr" for="ask-key">Anthropic API key</label><input class="field" id="ask-key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…"><button class="btn primary" data-act="ask-key-save">Save key</button></div></div>`;
  // New question and Remove key wait until the answer finishes; ask() re-renders then and they come back
  const html = `<div class="ask-head"><span class="eyebrow">Ask · ${esc(engine)}</span>${A.turns.length && !A.busy ? '<button class="chip" data-act="ask-new">New question</button>' : ''}<button class="ib" data-act="ask-close" aria-label="Close answers">${UI.I.close}</button></div>
    <div class="ask-body" id="ask-body">${body}${A.turns.length ? '' : sugg}${keyNote}</div>`;
  UI.paint(el, html);
}
A.render = () => { if (A.open) renderPanel(); };
A.isOpen = () => A.open;
A.close = () => { A.open = false; renderPanel(); };
A.keyChanged = () => { A.convo = []; renderPanel(); };
function scrollToLast() {
  const el = $('#ask-panel'), qs = el.querySelectorAll('.qa-q');
  if (qs.length) el.scrollTop = qs[qs.length - 1].offsetTop - 60;
}
async function ask(q) {
  q = q.trim();
  if (!q || A.busy) return;
  A.open = true; A.busy = true;
  const turn = { q, steps: [], pending: true };
  A.turns.push(turn);
  renderPanel(); scrollToLast();
  try {
    if (NBA.aiKey.get()) {
      const r = await askClaude(turn, q);
      turn.html = r.html; turn.meta = r.meta;
    } else {
      turn.steps.push('Looking it up');
      const html = await quick(q);
      if (html) { turn.html = html; turn.meta = 'Built-in answer from site data · free'; }
      else turn.html = `<p>I can't answer that one without Claude. Built-in answers cover team records, schedules, results and head-to-head, tonight's games and last night's scores, league and team leaders, standings, power rankings and ratings, who's hot or slipping, injuries, rosters, news, odds and MVP, player stats, game logs, comparisons and plus-minus, and the best players over recent days.</p><p><button class="link" data-act="settings">Add an Anthropic API key</button> to ask anything.</p>`;
      turn.steps = [];
    }
  } catch (e) {
    turn.error = e.message || 'Something went wrong.';
  }
  turn.pending = false; A.busy = false;
  renderPanel();
  scrollToLast();
}
Object.assign(NBA.actions, {
  'ask-q': a => { $('#ask-input').value = a.dataset.q; ask(a.dataset.q); },
  // No reset while a question is running: it is still writing to A.convo and holds A.busy
  'ask-new': () => { if (A.busy) return; A.turns = []; A.convo = []; renderPanel(); $('#ask-input').focus(); },
  'ask-close': () => A.close(),
  'ask-key-save': () => {
    const inp = $('#ask-key'), v = inp ? inp.value.trim() : '';
    if (!v) { if (inp) inp.focus(); return; }
    NBA.aiKey.set(v);
    A.keyChanged();
  },
  'ask-key-clear': () => { if (A.busy) return; NBA.aiKey.set(''); A.keyChanged(); },
});
document.getElementById('ask-form').addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('#ask-input');
  ask(inp.value);
  inp.select();
});
document.getElementById('ask-input').addEventListener('focus', () => { if (!A.open && !A.turns.length) { A.open = true; renderPanel(); } });
window.addEventListener('resize', () => { if (A.open) placePanel(); });
document.addEventListener('pointerdown', e => {
  if (!A.open || A.busy) return;
  if (e.target.closest('#ask-panel, #ask-form, .drawer, .scrim')) return;
  A.close();
});
})();
