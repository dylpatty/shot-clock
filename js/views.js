/* Tab views: Schedule, Standings, Stats, Odds, Injuries & News, team pages, Teams, Fun Facts */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui, st = UI.st;
const { esc } = NBA;
const V = NBA.views;
Object.assign(st, { standMode: 'conf', tsSort: { k: 'ppg', desc: true }, psort: { k: 'pts', desc: true }, pq: '', pteam: '', plimit: 50, injStatus: 'all', injTeam: '' });

const loading = what => `<p class="loading">Loading ${what}…</p>`;
const failed = what => `<p class="empty">Couldn't load ${what} from ESPN. It will try again shortly.</p>`;
const stateOf = (key, what) => NBA.status(key).err ? failed(what) : loading(what);
const seg = (act, cur, opts, label) => `<div class="seg sm" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`;
const statusPill = s => {
  const c = /out/i.test(s) ? 'out' : /day|question|doubt|prob/i.test(s) ? 'dtd' : 'neutral';
  return `<span class="pill ${c}">${esc(s || 'Listed')}</span>`;
};
const conferenceName = c => c === 'East' ? 'East' : c === 'West' ? 'West' : c;

/* ================= Schedule ================= */
V.schedule = () => {
  const key = 'day:' + NBA.dayParam;
  const day = NBA.use(key);
  const isToday = !NBA.dayParam;
  const iso = day ? day.day : (NBA.dayParam ? NBA.isoFromParam(NBA.dayParam) : NBA.today);
  const label = (iso === NBA.today ? 'Today · ' : '') + NBA.fmtDay(iso, { weekday: 'short', month: 'short', day: 'numeric' });
  let main;
  if (!day) main = stateOf(key, 'games');
  else if (!day.games.length) main = `<p class="empty">No games on ${esc(NBA.fmtDay(iso, { weekday: 'long', month: 'long', day: 'numeric' }))}.</p>`;
  else {
    const games = NBA.sortGames(day.games);
    const live = games.filter(g => g.state === 'in'), rest = games.filter(g => g.state !== 'in');
    main = (live.length ? `<div class="sub-h live"><i class="dot blink"></i>Live now · ${live.length}</div><div class="games live-grid">${live.map(g => UI.gameCard(g, true)).join('')}</div>` : '')
      + (rest.length ? `<div class="sub-h">${live.length ? 'Rest of the slate' : 'The slate'} · ${rest.length} by tip-off</div><div class="games">${rest.map(g => UI.gameCard(g, false)).join('')}</div>` : '');
  }
  const head = `<div class="sec-h"><h2>${isToday ? 'Schedule' : 'Games'}</h2>
    <div class="datenav" role="group" aria-label="Choose a day">
      <button class="ib" data-act="date" data-v="-1" aria-label="Previous day">${UI.I.left}</button>
      <span class="datelbl">${esc(label)}</span>
      <button class="ib" data-act="date" data-v="1" aria-label="Next day">${UI.I.right}</button></div>
    ${isToday ? '' : `<button class="chip" data-act="date" data-v="0">Back to today</button>`}
    <span class="end sub">Times in your time zone</span></div>`;
  const side = performers(day ? day.games : []) + myTeamCard();
  return `<section class="sec"><div class="sched"><div class="sec" style="gap:12px">${head}${main}</div><aside class="sched-side">${side}</aside></div></section>${upcoming()}`;
};
function performers(games) {
  const cats = [['points', 'PTS'], ['rebounds', 'REB'], ['assists', 'AST']];
  const cat = st.perfCat;
  const head = `<div class="card-h"><h3>Top performers</h3><div class="end">${seg('perf', cat, cats, 'Stat')}</div></div>`;
  if (NBA.S.spoilers) return `<div class="card">${head}<div class="card-b"><p class="empty">Hidden while spoiler mode is on.</p></div></div>`;
  const rows = [];
  games.filter(g => g.state !== 'pre').forEach(g => [g.away, g.home].forEach(t => {
    const l = t.leaders.find(x => x.cat === cat);
    if (l && l.value != null) rows.push({ l, t, opp: t === g.away ? g.home : g.away, at: t === g.away, g });
  }));
  rows.sort((a, b) => NBA.num(b.l.value) - NBA.num(a.l.value));
  const body = rows.length ? `<ol class="perf">${rows.slice(0, 10).map((x, i) => `
    <li><span class="rk">${i + 1}</span>${UI.hs(x.l.headshot)}
      <button class="who" data-act="game" data-id="${x.g.id}"><div class="nm">${esc(x.l.full || x.l.short)}</div>
      <div class="mt2">${esc(x.t.abbr)} ${x.at ? '@' : 'vs'} ${esc(x.opp.abbr)} · ${esc(x.g.detail)}</div></button>
      <span class="val">${esc(x.l.value)}</span></li>`).join('')}</ol>`
    : `<p class="empty">${games.length ? 'Leaders show up once games tip off.' : 'No games on this day.'}</p>`;
  return `<div class="card">${head}<div class="card-b" style="padding-block:4px">${body}</div></div>`;
}
function myTeamCard() {
  const id = NBA.S.myTeam, t = NBA.T(id), sch = NBA.use('tsched:' + id);
  if (!sch) return '';
  const today = NBA.data('day:');
  const live = today && today.games.find(g => g.state === 'in' && (g.away.id === id || g.home.id === id));
  if (live) return `<div class="card"><div class="card-h"><h3>${esc(t.name)} live</h3></div><div class="card-b">${UI.gameCard(live, false)}</div></div>`;
  const next = sch.events.find(e => e.state === 'pre');
  const last = sch.events.filter(e => e.state === 'post').slice(-1)[0];
  return `<div class="card"><div class="card-h"><h3>${esc(t.name || 'Your team')}</h3><div class="end"><a class="chip" href="#myteam">Team page</a></div></div>
    <ul class="glist">${last ? glistItem(last) : ''}${next ? glistItem(next) : ''}</ul>${!next && !last ? '<p class="empty">No games scheduled.</p>' : ''}</div>`;
}
function upcoming() {
  const days = Array.from({ length: 7 }, (_, i) => NBA.shiftIso(NBA.today, i + 1));
  const cards = days.map(iso => {
    const d = NBA.use('day:' + NBA.paramOf(iso));
    if (!d) return `<div class="card day"><div class="card-h"><h3>${esc(NBA.fmtDay(iso))}</h3></div>${stateOf('day:' + NBA.paramOf(iso), 'games')}</div>`;
    if (!d.games.length) return '';
    const games = NBA.sortGames(d.games);
    return `<div class="card day"><div class="card-h"><h3>${esc(NBA.fmtDay(iso, { weekday: 'long', month: 'short', day: 'numeric' }))}<small>${games.length} game${games.length > 1 ? 's' : ''}</small></h3></div>
      <ol class="lines">${games.map(UI.line).join('')}</ol></div>`;
  }).join('');
  return `<section class="sec"><div class="sec-h"><h2>Upcoming</h2><span class="sub">Next 7 days · away team on the left, home team on the right</span></div><div class="days">${cards}</div></section>`;
}
NBA.actions.date = a => {
  const v = +a.dataset.v;
  if (v === 0) NBA.dayParam = '';
  else {
    const cur = NBA.dayParam ? NBA.isoFromParam(NBA.dayParam) : NBA.today;
    const iso = NBA.shiftIso(cur, v);
    NBA.dayParam = iso === NBA.today ? '' : NBA.paramOf(iso);
  }
  NBA.changed();
  NBA.need('day:' + NBA.dayParam).catch(() => {});
};
NBA.actions.perf = a => { st.perfCat = a.dataset.v; NBA.changed(); };

/* ================= Standings ================= */
V.standings = () => {
  const confs = NBA.use('standings');
  const head = `<div class="sec-h"><h2>Standings</h2><span class="sub">${esc(NBA.SEASON_LABEL)} regular season</span>
    <div class="end">${seg('standmode', st.standMode, [['conf', 'Conference'], ['league', 'League']], 'View')}</div></div>`;
  if (!confs) return `<section class="sec">${head}${stateOf('standings', 'standings')}</section>`;
  const fav = new Set(NBA.S.favorites);
  const table = (caption, rows, opts = {}) => `<div class="card"><div class="card-b st-wrap"><div class="tblwrap"><table class="tbl"><caption>${esc(caption)}</caption>
    <thead><tr><th class="n" scope="col">#</th><th class="tm" scope="col">Team</th><th scope="col">W</th><th scope="col">L</th><th scope="col">Pct</th><th scope="col">GB</th>
      ${opts.conf ? '<th scope="col">Conf</th>' : ''}<th class="x1" scope="col">Home</th><th class="x1" scope="col">Road</th><th scope="col">L10</th><th scope="col">Strk</th>
      <th class="x2" scope="col">PPG</th><th class="x2" scope="col">Opp</th><th class="x2" scope="col">Diff</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr class="click${fav.has(r.id) ? ' fav' : ''}${!opts.conf && r.seed === 6 ? ' cut' : ''}${!opts.conf && r.seed === 10 ? ' cut2' : ''}" data-act="team" data-id="${r.id}">
      <td class="n">${opts.conf ? i + 1 : r.seed ?? ''}</td><td class="tm"><span>${UI.logo(NBA.T(r.id).logo ? NBA.T(r.id) : r, 22)}${esc(r.name)}</span></td>
      <td>${r.w}</td><td>${r.l}</td><td>${esc(r.pct)}</td><td>${esc(r.gb)}</td>${opts.conf ? `<td>${esc(r.conf)} ${r.seed ?? ''}</td>` : ''}
      <td class="x1">${esc(r.home)}</td><td class="x1">${esc(r.road)}</td><td>${esc(r.l10)}</td>
      <td class="${/^W/.test(r.strk) ? 'w' : /^L/.test(r.strk) ? 'lo' : ''}">${esc(r.strk)}</td>
      <td class="x2">${NBA.fix(r.ppg)}</td><td class="x2">${NBA.fix(r.opp)}</td><td class="x2">${r.diff > 0 ? '+' : ''}${NBA.fix(r.diff)}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  let body;
  if (st.standMode === 'league') {
    const all = confs.flatMap(c => c.rows).sort((a, b) => b.pctV - a.pctV || b.diff - a.diff);
    body = table('League', all, { conf: true });
  } else {
    body = `<div class="st-pair">${confs.map(c => table(c.name, c.rows)).join('')}</div>
      <div class="legend"><span><i class="l1"></i>Top 6 make the playoffs</span><span><i class="l2"></i>7–10 go to the play-in</span>${fav.size ? '<span>Your highlighted teams are shaded</span>' : ''}<span>Click a team for its page</span></div>`;
  }
  return `<section class="sec">${head}${body}</section>`;
};
NBA.actions.standmode = a => { st.standMode = a.dataset.v; NBA.changed(); };
NBA.actions.team = a => { location.hash = '#teams/' + a.dataset.id; };

/* ================= Stats ================= */
const HERO = { game: ['pts', 'reb', 'ast', 'stl', 'blk', 'tpm'], total: ['pts', 'reb', 'ast', 'stl', 'blk', 'tpm'] };
const MINI = { game: ['fgp', 'tpp', 'ftp', 'ts', 'efg', 'pra', 'stocks', 'astTo', 'min', 'dd', 'td', 'tov'], total: ['fgm', 'ftm', 'pra', 'stocks', 'min', 'dd', 'td', 'tov', 'pf', 'gp'] };
V.stats = () => {
  const players = NBA.use('players');
  NBA.use('standings');
  const per = NBA.use('per'), teams = NBA.use('teamstats');
  const mode = NBA.S.statsMode === 'total' ? 'total' : 'game';
  const head = `<div class="sec-h"><h2>Stats</h2><span class="sub">${esc(NBA.SEASON_LABEL)} season leaders · ${mode === 'total' ? 'season totals' : 'per game, qualified players'}</span>
    <div class="end">${seg('statsmode', mode, [['game', 'Per game'], ['total', 'Totals']], 'Stat type')}</div></div>`;
  if (!players) return `<section class="sec">${head}${stateOf('players', 'player stats')}</section>`;
  const heroes = HERO[mode].map(k => leadCard(k, mode)).join('');
  let minis = MINI[mode].map(k => miniCard(k, mode)).join('');
  if (mode === 'game' && per && per.length) {
    minis = `<div class="card mini"><div class="card-h"><h3>Player efficiency</h3><div class="end">PER</div></div><ol class="rank">${per.slice(0, 5).map((p, i) => {
      const pl = NBA.playerById(p.id);
      return `<li data-act="player" data-id="${esc(p.id)}" style="cursor:pointer"><span class="rk">${i + 1}</span><span class="nm">${esc(p.name)}<small>${esc(pl ? pl.team : '')}</small></span><span class="v">${esc(p.display)}</span></li>`;
    }).join('')}</ol></div>` + minis;
  }
  return `<section class="sec">${head}<div class="lead-grid">${heroes}</div></section>
    <section class="sec"><div class="sec-h"><h3>More leaders</h3><span class="sub">Shooting and efficiency leaders use the NBA's minimum-attempt rules, scaled to games played so far</span></div><div class="mini-grid">${minis}</div></section>
    <section class="sec">${teamTable(teams)}</section>
    <section class="sec">${playerTable(players, mode)}</section>
    <p class="note">Season plus-minus isn't in ESPN's public feed, so it isn't listed here. Each game's box score shows plus-minus for that game.</p>`;
};
function leadCard(k, mode) {
  const d = NBA.STATS[k], list = NBA.leaders({ stat: k, mode, limit: 8 });
  if (!list.length) return '';
  const top = list[0], v = p => NBA.statFmt(k, NBA.statValue(k, p, mode), mode);
  return `<div class="card lead-card"><div class="card-h"><h3>${esc(d.label)}</h3><div class="end"><span class="eyebrow">${mode === 'total' ? 'Total' : 'Per game'}</span></div></div>
    <div class="top1" data-act="player" data-id="${top.id}">${UI.hs(top.headshot, '')}<div><div class="nm">${esc(top.name)}</div><div class="tm">${esc(top.team)} · ${esc(top.pos)} · ${top.gp} GP</div></div><div class="val">${v(top)}</div></div>
    <ol class="rank">${list.slice(1).map((p, i) => `<li data-act="player" data-id="${p.id}" style="cursor:pointer"><span class="rk">${i + 2}</span><span class="nm">${esc(p.name)}<small>${esc(p.team)}</small></span><span class="v">${v(p)}</span></li>`).join('')}</ol></div>`;
}
function miniCard(k, mode) {
  const d = NBA.STATS[k], list = NBA.leaders({ stat: k, mode, limit: 5 });
  if (!list.length) return '';
  return `<div class="card mini"><div class="card-h"><h3>${esc(d.label)}</h3><div class="end">${esc(d.short)}</div></div>
    <ol class="rank">${list.map((p, i) => `<li data-act="player" data-id="${p.id}" style="cursor:pointer"><span class="rk">${i + 1}</span><span class="nm">${esc(p.name)}<small>${esc(p.team)}</small></span><span class="v">${NBA.statFmt(k, NBA.statValue(k, p, mode), mode)}</span></li>`).join('')}</ol></div>`;
}
const TEAM_COLS = [['ppg', 'PPG'], ['oppg', 'Opp PPG'], ['diff', 'Diff'], ['fgp', 'FG%'], ['tpp', '3P%'], ['ftp', 'FT%'], ['rpg', 'REB'], ['apg', 'AST'], ['tov', 'TOV'], ['spg', 'STL'], ['bpg', 'BLK'], ['tpa', '3PA']];
function teamTable(teams) {
  const head = `<div class="sec-h"><h3>Team stats</h3><span class="sub">Per game · click a column to sort, a team to open it</span></div>`;
  if (!teams) return head + stateOf('teamstats', 'team stats');
  const s = st.tsSort;
  const rows = teams.slice().sort((a, b) => (s.desc ? 1 : -1) * ((b[s.k] ?? 0) - (a[s.k] ?? 0)));
  const fmt = (k, v) => k === 'diff' ? (v > 0 ? '+' : '') + NBA.fix(v) : NBA.fix(v);
  return head + `<div class="card"><div class="card-b"><div class="tblwrap"><table class="tbl">
    <thead><tr><th class="n" scope="col">#</th><th class="tm sticky" scope="col">Team</th>${TEAM_COLS.map(([k, l]) => `<th scope="col"><button class="sortb${s.k === k ? ' on' : ''}" data-act="tsort" data-k="${k}">${l}${s.k === k ? (s.desc ? ' ↓' : ' ↑') : ''}</button></th>`).join('')}</tr></thead>
    <tbody>${rows.map((t, i) => `<tr class="click${NBA.S.favorites.includes(t.id) ? ' fav' : ''}" data-act="team" data-id="${t.id}"><td class="n">${i + 1}</td>
      <td class="tm sticky"><span>${UI.logo(NBA.T(t.id), 22)}${esc(NBA.T(t.id).name || t.name)}</span></td>
      ${TEAM_COLS.map(([k]) => `<td title="Ranks ${NBA.ord(t.rank[k])} in the league">${fmt(k, t[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>`;
}
const PCOLS = [['gp', 'GP'], ['min', 'MIN'], ['pts', 'PTS'], ['reb', 'REB'], ['ast', 'AST'], ['stl', 'STL'], ['blk', 'BLK'], ['tov', 'TOV'], ['tpm', '3PM'], ['fgp', 'FG%'], ['tpp', '3P%'], ['ftp', 'FT%'], ['ts', 'TS%']];
function playerTable(players, mode) {
  const s = st.psort;
  let list = players.filter(p => p.gp > 0);
  if (st.pteam) list = list.filter(p => p.teamId === st.pteam);
  if (st.pq) { const q = st.pq.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || (p.team || '').toLowerCase() === q); }
  const val = p => NBA.statValue(s.k, p, mode);
  list.sort((a, b) => (s.desc ? 1 : -1) * ((Number.isFinite(val(b)) ? val(b) : -1e9) - (Number.isFinite(val(a)) ? val(a) : -1e9)));
  const total = list.length;
  list = list.slice(0, st.plimit);
  const teams = [...NBA.teams.values()].filter(t => t.abbr).sort((a, b) => a.full.localeCompare(b.full));
  return `<div class="sec-h"><h3>All players</h3><span class="sub">${total} players · ${mode === 'total' ? 'season totals' : 'per game'}</span>
      <div class="end tools"><label class="sr" for="pq">Find a player</label><input class="field" id="pq" data-in="pq" type="search" placeholder="Find a player" value="${esc(st.pq)}">
      <label class="sr" for="pteam">Team</label><select id="pteam" data-ch="pteam"><option value="">All teams</option>${teams.map(t => `<option value="${t.id}" ${st.pteam === t.id ? 'selected' : ''}>${esc(t.full)}</option>`).join('')}</select></div></div>
    <div class="card"><div class="card-b"><div class="tblwrap"><table class="tbl">
      <thead><tr><th class="l sticky" scope="col">Player</th><th class="l" scope="col">Team</th><th class="l" scope="col">Pos</th>${PCOLS.map(([k, l]) => `<th scope="col"><button class="sortb${s.k === k ? ' on' : ''}" data-act="psort" data-k="${k}">${l}${s.k === k ? (s.desc ? ' ↓' : ' ↑') : ''}</button></th>`).join('')}</tr></thead>
      <tbody>${list.map(p => `<tr class="click" data-act="player" data-id="${p.id}"><td class="l sticky"><b>${esc(p.name)}</b></td><td class="l">${esc(p.team)}</td><td class="l">${esc(p.pos)}</td>
        ${PCOLS.map(([k]) => `<td>${NBA.statFmt(k, NBA.statValue(k, p, mode), mode)}</td>`).join('')}</tr>`).join('') || `<tr><td class="l" colspan="${PCOLS.length + 3}">No players match.</td></tr>`}</tbody></table></div>
      ${total > list.length ? `<div style="padding-top:12px"><button class="btn" data-act="pmore">Show ${Math.min(50, total - list.length)} more</button></div>` : ''}</div></div>`;
}
NBA.actions.statsmode = a => { NBA.S.statsMode = a.dataset.v; NBA.save(); NBA.changed(); };
NBA.actions.tsort = a => { const k = a.dataset.k; st.tsSort = st.tsSort.k === k ? { k, desc: !st.tsSort.desc } : { k, desc: !['oppg', 'tov'].includes(k) }; NBA.changed(); };
NBA.actions.psort = a => { const k = a.dataset.k; st.psort = st.psort.k === k ? { k, desc: !st.psort.desc } : { k, desc: true }; NBA.changed(); };
NBA.actions.pmore = () => { st.plimit += 50; NBA.changed(); };
NBA.changes.pq = t => { st.pq = t.value; st.plimit = 50; NBA.render(); };
NBA.changes.pteam = t => { st.pteam = t.value; st.plimit = 50; NBA.changed(); };
NBA.actions.player = a => { if (NBA.ask) NBA.ask.player(a.dataset.id); };

/* ================= Odds ================= */
V.odds = () => {
  const markets = NBA.use('futures');
  NBA.use('players'); NBA.use('standings');
  const tomorrow = NBA.paramOf(NBA.shiftIso(NBA.today, 1));
  const days = [NBA.use('day:'), NBA.use('day:' + tomorrow)];
  const head = `<div class="sec-h"><h2>Odds</h2><span class="sub">DraftKings via ESPN · American odds · the % is the implied chance before the sportsbook's margin</span></div>`;
  if (!markets) return `<section class="sec">${head}${stateOf('futures', 'odds')}</section>`;
  const find = re => markets.find(m => re.test(m.name));
  const used = new Set();
  const take = re => { const m = find(re); if (m) used.add(m.id); return m; };
  const champ = take(/^Winner$|Champion/i), east = take(/Eastern Conference - Winner/i), west = take(/Western Conference - Winner/i);
  const mvp = take(/MVP/i), smoy = take(/6th Man|Sixth/i), coy = take(/Coach/i), clutch = take(/Clutch/i), roy = take(/Rookie/i), dpoy = take(/Defensive/i), mip = take(/Improved/i);
  const cup = take(/NBA Cup Winner|Tournament Winner/i);
  const divisions = markets.filter(m => /Division/i.test(m.name)); divisions.forEach(m => used.add(m.id));
  const groups = markets.filter(m => /Group/i.test(m.name)); groups.forEach(m => used.add(m.id));
  const rest = markets.filter(m => !used.has(m.id));
  const card = (m, title, opts = {}) => m ? `<div class="card ${opts.cls || ''}"><div class="card-h"><h3>${esc(title || m.name)}</h3><div class="end"><span class="eyebrow">${esc(m.provider)}</span></div></div>${oddsList(m, opts)}</div>` : '';
  const awards = [[mvp, 'MVP'], [roy, 'Rookie of the Year'], [dpoy, 'Defensive Player of the Year'], [smoy, 'Sixth Man of the Year'], [mip, 'Most Improved Player'], [clutch, 'Clutch Player of the Year'], [coy, 'Coach of the Year']].filter(x => x[0]);
  return `<section class="sec">${head}<div class="odds-grid">
      ${card(champ, 'NBA Championship', { cls: 'w8', cols: 2, limit: 30 })}
      ${gameLines(days)}
      ${awards.map(([m, t], i) => card(m, t, { cls: i === 0 ? 'w6' : '', limit: i === 0 ? 15 : 8, athletes: true })).join('')}
      ${east || west ? `<div class="card w6"><div class="card-h"><h3>Conference winners</h3><div class="end"><span class="eyebrow">DraftKings</span></div></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))">${[[east, 'East'], [west, 'West']].filter(x => x[0]).map(([m, l]) => `<div><div class="eyebrow" style="padding:12px var(--pad) 0">${l}</div>${oddsList(m, { limit: 15 })}</div>`).join('')}</div></div>` : ''}
      ${card(cup, 'NBA Cup winner', { limit: 12 })}
      ${divisions.length ? `<div class="card w12"><div class="card-h"><h3>Division winners</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))">${divisions.map(m => `<div><div class="eyebrow" style="padding:12px var(--pad) 0">${esc(m.name.replace(/.*Conference\s*-\s*/i, ''))}</div>${oddsList(m, { limit: 5 })}</div>`).join('')}</div></div>` : ''}
      ${groups.length ? `<div class="card w12"><div class="card-h"><h3>NBA Cup groups</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))">${groups.map(m => `<div><div class="eyebrow" style="padding:12px var(--pad) 0">${esc(m.name.replace(/NBA Cup\s*/i, ''))}</div>${oddsList(m, { limit: 5 })}</div>`).join('')}</div></div>` : ''}
      ${rest.map(m => card(m, m.name, { limit: 8 })).join('')}
    </div><p class="note">Odds change constantly and are shown for information only. Implied chances across a market add up to more than 100% because of the sportsbook's margin.</p></section>`;
};
function oddsList(m, { limit = 10, cols = 1 } = {}) {
  const list = m.entries.slice(0, limit);
  const max = Math.max(...list.map(e => e.implied), .01);
  const fav = new Set(NBA.S.favorites);
  return `<ol class="olist" style="--cols:${cols}">${list.map((e, i) => {
    let img, name, sub = '', isFav = false;
    if (e.kind === 'team') {
      const t = NBA.T(e.id); isFav = fav.has(e.id);
      img = UI.logo(t, 30); name = t.full || t.name || 'Team ' + e.id;
    } else {
      const a = NBA.athleteInfo(e.id) || {};
      const t = a.teamId ? NBA.T(a.teamId) : null; isFav = !!(t && fav.has(t.id));
      img = a.headshot ? `<img class="hs" src="${esc(a.headshot)}" alt="" loading="lazy">` : (t ? UI.logo(t, 30) : '<span></span>');
      name = a.name || 'Loading…'; sub = [t && t.abbr, a.coach ? 'Coach' : ''].filter(Boolean).join(' · ');
    }
    const pct = e.implied * 100;
    return `<li class="${isFav ? 'fav' : ''}"><span class="rk">${i + 1}</span>${img}<span class="nm">${esc(name)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>
      <span class="od">${esc(e.odds)}</span><span class="ibar">${pct < 1 ? '<1' : pct.toFixed(0)}%<i style="width:${(e.implied / max * 100).toFixed(1)}%"></i></span></li>`;
  }).join('')}</ol>`;
}
function gameLines(days) {
  const games = days.filter(Boolean).flatMap(d => d.games).filter(g => g.state === 'pre');
  const withOdds = games.filter(g => g.odds && (g.odds.details || g.odds.awayML));
  const body = withOdds.length ? `<div class="tblwrap"><table class="tbl lines-tbl"><thead><tr><th class="l" scope="col">Game</th><th scope="col">Line</th><th scope="col">O/U</th><th scope="col">Moneyline</th></tr></thead>
    <tbody>${withOdds.map(g => `<tr class="click" data-act="game" data-id="${g.id}"><td class="l"><b>${esc(g.away.abbr)} @ ${esc(g.home.abbr)}</b><br><span class="mut">${esc(NBA.fmtDate(g.date, { weekday: 'short' }))} ${esc(NBA.fmtTime(g.date))}</span></td>
      <td>${esc(g.odds.details)}</td><td>${esc(g.odds.ou)}</td><td>${esc(g.away.abbr)} ${esc(g.odds.awayML)}<br>${esc(g.home.abbr)} ${esc(g.odds.homeML)}</td></tr>`).join('')}</tbody></table></div>`
    : `<p class="empty">${games.length ? 'DraftKings posts game lines on game day. None are up yet for the next games.' : 'No upcoming games today or tomorrow.'}</p>`;
  return `<div class="card"><div class="card-h"><h3>Game lines</h3><div class="end"><span class="eyebrow">Today & tomorrow</span></div></div><div class="card-b" style="padding-block:6px">${body}</div></div>`;
}

/* ================= Injuries & News ================= */
V.news = () => {
  const news = NBA.use('news:'), inj = NBA.use('injuries');
  NBA.use('standings');
  let newsHtml;
  if (!news) newsHtml = stateOf('news:', 'headlines');
  else {
    const items = news.filter(a => a.links && a.links.web && a.links.web.href).slice(0, 25);
    newsHtml = `<div class="news-grid">${items.map((a, i) => storyCard(a, i === 0)).join('')}</div>`;
  }
  return `<div class="news-layout"><section class="sec"><div class="sec-h"><h2>News</h2><span class="sub">ESPN · updates every few minutes</span></div>${newsHtml}</section>
    <section class="sec">${injuryPanel(inj)}</section></div>`;
};
const NEWS_TYPE = { HeadlineNews: 'News', Media: 'Video', Recap: 'Recap', Story: 'Story', Preview: 'Preview' };
function storyCard(a, lead) {
  const img = a.images && a.images[0] && a.images[0].url;
  return `<a class="card story${lead ? ' lead-story' : ''}" href="${esc(a.links.web.href)}" target="_blank" rel="noopener">
    ${img ? `<img class="th" src="${esc(img)}" alt="" loading="lazy">` : '<span class="th"></span>'}
    <span class="tx"><span class="eyebrow">${esc(NEWS_TYPE[a.type] || a.type || 'Story')} · ${esc(NBA.relTime(a.published))}</span><h3>${esc(a.headline)}</h3>${a.description ? `<p>${esc(a.description)}</p>` : ''}</span></a>`;
}
function injuryPanel(inj) {
  const head = `<div class="sec-h"><h2>Injuries</h2><span class="sub">${inj ? 'Updated ' + esc(NBA.relTime(new Date(NBA.status('injuries').t).toISOString())) : ''}</span></div>`;
  if (!inj) return head + stateOf('injuries', 'the injury report');
  const fav = new Set(NBA.S.favorites);
  const teams = [...NBA.teams.values()].filter(t => t.abbr).sort((a, b) => a.full.localeCompare(b.full));
  const match = i => st.injStatus === 'all' || (st.injStatus === 'out' ? /out/i.test(i.status) : !/out/i.test(i.status));
  let groups = inj.map(g => ({ ...g, list: g.list.filter(match) })).filter(g => g.list.length && (!st.injTeam || g.teamId === st.injTeam));
  groups.sort((a, b) => (fav.has(b.teamId) - fav.has(a.teamId)) || NBA.T(a.teamId).full.localeCompare(NBA.T(b.teamId).full));
  const total = groups.reduce((n, g) => n + g.list.length, 0);
  const tools = `<div class="tools">${seg('injstatus', st.injStatus, [['all', 'All'], ['out', 'Out'], ['dtd', 'Day-to-day & other']], 'Status')}
    <label class="sr" for="injteam">Team</label><select id="injteam" data-ch="injteam"><option value="">All teams</option>${teams.map(t => `<option value="${t.id}" ${st.injTeam === t.id ? 'selected' : ''}>${esc(t.full)}</option>`).join('')}</select>
    <span class="note">${total} players</span></div>`;
  const body = groups.length ? groups.map(g => {
    const t = NBA.T(g.teamId);
    return `<details class="inj-team" open><summary>${UI.logo(t, 24)}${esc(t.full || g.teamName)}<span class="cnt">${g.list.length}</span></summary>
      <ul class="inj">${g.list.map(i => `<li><span class="who2">${esc(i.name)}<small>${esc(i.pos || '')}</small></span>${statusPill(i.status)}
        <span class="what">${esc([i.side, i.type, i.detail].filter(Boolean).join(' '))}${i.ret ? ` · est. return ${esc(NBA.fmtDay(i.ret, { month: 'short', day: 'numeric' }))}` : ''}</span>
        ${i.short ? `<span class="cm" title="${esc(i.long || i.short)}">${esc(i.short)}</span>` : ''}</li>`).join('')}</ul></details>`;
  }).join('') : '<p class="empty">No injuries match.</p>';
  return head + tools + `<div class="card">${body}</div>`;
}
NBA.actions.injstatus = a => { st.injStatus = a.dataset.v; NBA.changed(); };
NBA.changes.injteam = t => { st.injTeam = t.value; NBA.changed(); };

/* ================= Team pages ================= */
function glistItem(e) {
  const op = NBA.T(e.oppId);
  let rs;
  if (e.state === 'post') rs = NBA.S.spoilers ? '<span class="mut">Final</span>' : `<span class="${e.won ? 'W' : 'L'}">${e.won ? 'W' : 'L'}</span> ${esc(e.my)}–${esc(e.their)}`;
  else if (e.state === 'in') rs = `<span class="st-live"><i class="dot blink"></i>Live</span>`;
  else rs = `<span class="mut">${esc(/TBD/i.test(e.detail || '') ? 'TBD' : NBA.fmtTime(e.date))}</span>`;
  return `<li data-act="game" data-id="${e.id}" role="button" tabindex="0"><span class="dt">${esc(NBA.fmtDate(e.date, { weekday: 'short', month: 'numeric', day: 'numeric' }))}</span>
    <span class="ha">${e.home ? 'vs' : '@'}</span>${UI.logo(op.abbr ? op : { logo: '' }, 26)}<span class="op">${esc(op.name || e.oppName || e.oppAbbr || '')}</span><span class="rs">${rs}</span></li>`;
}
function teamView(id) {
  id = String(id);
  NBA.use('standings');
  const t = NBA.T(id), sm = NBA.standingsMap(), r = sm.get(id);
  const sch = NBA.use('tsched:' + id), roster = NBA.use('roster:' + id), players = NBA.use('players'), ts = NBA.use('teamstats'), inj = NBA.use('injuries');
  const news = t.abbr ? NBA.use('news:' + t.abbr.toLowerCase()) : null;
  if (!t.abbr) return loading('team');
  const tsr = ts && ts.find(x => x.id === id);
  const rank = k => tsr && tsr.rank[k] ? `<small>${NBA.ord(tsr.rank[k])}</small>` : '';
  const isFav = NBA.S.favorites.includes(id);
  const stat = (v, l, extra = '') => `<div><b>${v}</b><span>${l}</span>${extra}</div>`;
  const hero = `<section class="team-hero" style="--tc:${esc(t.color || '#444')};--logo:url('${esc(t.logo || '')}')">
    <img class="big-logo" src="${esc(t.logoDark || t.logo || '')}" alt="">
    <div><h2>${esc(t.full)}</h2><div class="sub2">${esc([sch && sch.standing, roster && roster.coach ? 'Coach ' + roster.coach : ''].filter(Boolean).join(' · '))}</div>
      <div class="hero-stats">${r ? [
        stat(r.seed ? NBA.ord(r.seed) : '–', `In the ${conferenceName(r.conf)}`),
        stat(esc(r.strk || '–'), 'Streak'), stat(esc(r.l10 || '–'), 'Last 10'), stat(esc(r.home || '–'), 'Home'), stat(esc(r.road || '–'), 'Road'),
        stat(NBA.fix(r.ppg), 'Points', rank('ppg')), stat(NBA.fix(r.opp), 'Allowed', rank('oppg')), stat((r.diff > 0 ? '+' : '') + NBA.fix(r.diff), 'Margin', rank('diff')),
      ].join('') : ''}</div></div>
    <div class="hero-side"><div class="hero-rec">${r ? `${r.w}-${r.l}` : esc((sch && sch.record) || '')}</div>
      <button class="btn hero-btn" data-act="fav" data-id="${id}">${isFav ? '★ Highlighted' : '☆ Highlight team'}</button></div></section>`;

  const today = NBA.data('day:');
  const live = today && today.games.find(g => g.state === 'in' && (g.away.id === id || g.home.id === id));
  const evs = sch ? sch.events : [];
  const next = evs.find(e => e.state === 'pre');
  let nextCard;
  if (live) nextCard = `<div class="card"><div class="card-h"><h3>Live now</h3></div><div class="card-b">${UI.gameCard(live, true)}</div></div>`;
  else if (next) {
    const op = NBA.T(next.oppId), opr = sm.get(next.oppId);
    const me = { t, rec: r ? `${r.w}-${r.l}` : '' }, them = { t: op, rec: opr ? `${opr.w}-${opr.l}` : '' };
    const [left, right] = next.home ? [them, me] : [me, them];
    nextCard = `<div class="card"><div class="card-h"><h3>Next game</h3></div><div class="next-game" data-act="game" data-id="${next.id}" role="button" tabindex="0" style="cursor:pointer">
      <div class="eyebrow">${esc(NBA.fmtDate(next.date, { weekday: 'long', month: 'short', day: 'numeric' }))} · ${esc(NBA.fmtTime(next.date))}${next.tv ? ' · ' + esc(next.tv) : ''}</div>
      <div class="vs"><div>${UI.logo(left.t, 64)}<div class="ab">${esc(left.t.abbr)}</div><div class="mut">${esc(left.rec)}</div></div><div class="mid">@</div>
      <div>${UI.logo(right.t, 64)}<div class="ab">${esc(right.t.abbr)}</div><div class="mut">${esc(right.rec)}</div></div></div></div></div>`;
  } else nextCard = `<div class="card"><div class="card-h"><h3>Next game</h3></div>${sch ? '<p class="empty" style="padding:var(--pad)">No upcoming games scheduled.</p>' : stateOf('tsched:' + id, 'schedule')}</div>`;

  const LEAD = ['pts', 'reb', 'ast', 'stl', 'blk', 'tpm', 'fgp', 'min'];
  const leadersHtml = players ? `<div class="tleaders">${LEAD.map(k => {
    const p = NBA.leaders({ stat: k, teamId: id, limit: 1 })[0];
    if (!p) return '';
    return `<div class="tleader" data-act="player" data-id="${p.id}" style="cursor:pointer">${UI.hs(p.headshot, '')}<div><div class="k">${esc(NBA.STATS[k].label)}</div><div class="v">${NBA.statFmt(k, NBA.statValue(k, p, 'game'), 'game')}</div><div class="nm">${esc(p.name)}</div></div></div>`;
  }).join('')}</div>` : stateOf('players', 'player stats');

  const upcomingList = evs.filter(e => e.state !== 'post').slice(0, 10);
  const recent = evs.filter(e => e.state === 'post').slice(-10).reverse();
  const listCard = (title, list) => `<div class="card"><div class="card-h"><h3>${title}</h3></div>${sch ? (list.length ? `<ul class="glist">${list.map(e => glistItem(e)).join('')}</ul>` : '<p class="empty" style="padding:var(--pad)">None yet.</p>') : stateOf('tsched:' + id, 'schedule')}</div>`;

  const RANKS = [['ppg', 'Points', v => NBA.fix(v)], ['oppg', 'Points allowed', v => NBA.fix(v)], ['fgp', 'Field goal %', v => NBA.fix(v) + '%'], ['tpp', '3-point %', v => NBA.fix(v) + '%'], ['ftp', 'Free throw %', v => NBA.fix(v) + '%'],
    ['rpg', 'Rebounds', v => NBA.fix(v)], ['apg', 'Assists', v => NBA.fix(v)], ['tov', 'Turnovers', v => NBA.fix(v)], ['spg', 'Steals', v => NBA.fix(v)], ['bpg', 'Blocks', v => NBA.fix(v)], ['tpm', '3-pointers made', v => NBA.fix(v)]];
  const tone = NBA.tone(t);
  const ranksHtml = tsr ? `<ul class="rankbars">${RANKS.map(([k, l, fmt]) => `<li><span>${l}</span><span class="v">${fmt(tsr[k])}</span><span class="r">${NBA.ord(tsr.rank[k])}</span>
    <span class="bar"><i style="width:${((31 - tsr.rank[k]) / 30 * 100).toFixed(1)}%;background:${tone}"></i></span></li>`).join('')}</ul><p class="note" style="padding:0 var(--pad) var(--pad)">Bars show league rank: longer is better, out of 30 teams.</p>` : stateOf('teamstats', 'team stats');

  let rosterHtml;
  if (!roster) rosterHtml = stateOf('roster:' + id, 'roster');
  else {
    const byId = new Map((players || []).filter(p => p.teamId === id).map(p => [p.id, p]));
    const rows = roster.players.map(p => ({ ...p, s: byId.get(p.id) })).sort((a, b) => ((b.s && b.s.pts) || -1) - ((a.s && a.s.pts) || -1));
    const c = (p, k) => p.s ? NBA.statFmt(k, NBA.statValue(k, p.s, 'game'), 'game') : '–';
    rosterHtml = `<div class="tblwrap"><table class="tbl"><thead><tr><th class="l sticky" scope="col">Player</th><th scope="col">#</th><th class="l" scope="col">Pos</th><th scope="col">Age</th><th class="l" scope="col">Ht</th>
      <th scope="col">GP</th><th scope="col">MIN</th><th scope="col">PTS</th><th scope="col">REB</th><th scope="col">AST</th><th scope="col">STL</th><th scope="col">BLK</th><th scope="col">FG%</th><th scope="col">3P%</th><th scope="col">FT%</th><th class="l" scope="col">Status</th></tr></thead>
      <tbody>${rows.map(p => `<tr class="click" data-act="player" data-id="${p.id}"><td class="l sticky"><b>${esc(p.name)}</b></td><td>${esc(p.jersey || '')}</td><td class="l">${esc(p.pos || '')}</td><td>${esc(p.age ?? '')}</td><td class="l">${esc(p.ht || '')}</td>
        <td>${p.s ? p.s.gp : 0}</td><td>${c(p, 'min')}</td><td><b>${c(p, 'pts')}</b></td><td>${c(p, 'reb')}</td><td>${c(p, 'ast')}</td><td>${c(p, 'stl')}</td><td>${c(p, 'blk')}</td><td>${c(p, 'fgp')}</td><td>${c(p, 'tpp')}</td><td>${c(p, 'ftp')}</td>
        <td class="l">${p.injury ? statusPill(p.injury) : '<span class="pill ok">Active</span>'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  const teamInj = inj ? (inj.find(g => g.teamId === id) || { list: [] }).list : null;
  const injHtml = teamInj == null ? stateOf('injuries', 'injuries') : teamInj.length ? `<ul class="inj" style="padding-top:12px">${teamInj.map(i => `<li><span class="who2">${esc(i.name)}<small>${esc(i.pos || '')}</small></span>${statusPill(i.status)}
    <span class="what">${esc([i.side, i.type, i.detail].filter(Boolean).join(' '))}${i.ret ? ` · est. return ${esc(NBA.fmtDay(i.ret, { month: 'short', day: 'numeric' }))}` : ''}</span>${i.short ? `<span class="cm" title="${esc(i.long || i.short)}">${esc(i.short)}</span>` : ''}</li>`).join('')}</ul>` : '<p class="empty" style="padding:var(--pad)">No one on the injury report.</p>';
  const newsHtml = news ? `<div class="news-grid" style="padding:var(--pad)">${news.filter(a => a.links && a.links.web).slice(0, 6).map(a => storyCard(a, false)).join('')}</div>` : stateOf('news:' + t.abbr.toLowerCase(), 'news');

  return `${hero}<div class="team-grid">
    ${nextCard}
    <div class="card w8"><div class="card-h"><h3>Team leaders</h3><div class="end"><span class="eyebrow">Per game</span></div></div>${leadersHtml}</div>
    ${listCard('Upcoming games', upcomingList)}
    ${listCard('Recent results', recent)}
    <div class="card"><div class="card-h"><h3>Team stats</h3><div class="end"><span class="eyebrow">League rank</span></div></div>${ranksHtml}</div>
    <div class="card w12"><div class="card-h"><h3>Roster</h3><div class="end"><span class="eyebrow">Season averages</span></div></div><div class="card-b">${rosterHtml}</div></div>
    <div class="card"><div class="card-h"><h3>Injuries</h3></div>${injHtml}</div>
    <div class="card w8"><div class="card-h"><h3>${esc(t.name)} news</h3></div>${newsHtml}</div>
  </div>`;
}
V.myteam = () => teamView(NBA.S.myTeam);
V.teams = arg => {
  if (arg) return `<a class="backlink" href="#teams">${UI.I.left} All teams</a>${teamView(arg)}`;
  const confs = NBA.use('standings');
  if (!confs) return `<section class="sec"><div class="sec-h"><h2>Teams</h2></div>${stateOf('standings', 'teams')}</section>`;
  return `<section class="sec"><div class="sec-h"><h2>Teams</h2><span class="sub">Pick a team for its record, leaders, schedule, roster and injuries</span></div>
    <div class="team-pick">${confs.map(c => `<div class="card"><div class="card-h"><h3>${esc(c.name)}</h3></div><div class="tp-grid">${c.rows.slice().sort((a, b) => a.full.localeCompare(b.full)).map(r => {
      const t = NBA.T(r.id);
      return `<a class="tp" href="#teams/${r.id}">${UI.logo(t.logo ? t : r, 36)}<span><b>${esc(r.full)}</b><small>${r.w}-${r.l} · ${NBA.ord(r.seed || 0)} ${esc(c.abbr)}</small></span></a>`;
    }).join('')}</div></div>`).join('')}</div></section>`;
};

/* ================= Fun Facts ================= */
V.facts = () => {
  const confs = NBA.use('standings'), players = NBA.use('players'), ts = NBA.use('teamstats');
  const pastKeys = Array.from({ length: 7 }, (_, i) => i === 0 ? 'day:' : 'day:' + NBA.paramOf(NBA.shiftIso(NBA.today, -i)));
  const past = pastKeys.map(k => NBA.use(k)).filter(Boolean);
  const head = `<div class="sec-h"><h2>Fun facts</h2><span class="sub">Trends, extremes and oddities from this season and the past week</span></div>`;
  if (!confs) return `<section class="sec">${head}${stateOf('standings', 'standings')}</section>`;
  const rows = confs.flatMap(c => c.rows);
  const cards = [];
  const fact = (eyebrow, big, text, who) => cards.push(`<div class="card fact"><div class="eyebrow">${eyebrow}</div>${who || ''}<div class="big">${big}</div><p>${text}</p></div>`);
  const teamWho = r => `<div class="who3">${UI.logo(NBA.T(r.id).logo ? NBA.T(r.id) : r, 34)}${esc(r.full)}</div>`;
  const playerWho = p => `<div class="who3">${UI.hs(p.headshot)}${esc(p.name)} <span class="mut" style="font-weight:600">${esc(p.team)}</span></div>`;

  const gamesPlayed = rows.reduce((n, r) => n + r.w + r.l, 0) / 2;
  const totalGames = 1230;
  cards.push(`<div class="card fact"><div class="eyebrow">Season progress</div><div class="big">${Math.round(gamesPlayed)}<small>of ${totalGames} games</small></div>
    <div class="progress"><i style="width:${Math.min(100, gamesPlayed / totalGames * 100).toFixed(1)}%"></i></div><p>${(gamesPlayed / totalGames * 100).toFixed(1)}% of the regular season is in the books.</p></div>`);
  const hot = rows.filter(r => r.strkV > 0 && /^W/.test(r.strk)).sort((a, b) => b.strkV - a.strkV)[0];
  if (hot) fact('Hottest team', esc(hot.strk), `${esc(hot.name)} have won ${hot.strkV} straight and sit ${NBA.ord(hot.seed)} in the ${esc(hot.conf)}.`, teamWho(hot));
  const cold = rows.filter(r => /^L/.test(r.strk)).sort((a, b) => Math.abs(b.strkV) - Math.abs(a.strkV))[0];
  if (cold) fact('Coldest team', esc(cold.strk), `${esc(cold.name)} have lost ${Math.abs(cold.strkV)} in a row.`, teamWho(cold));
  const perfect = rows.filter(r => r.l === 0 && r.w > 0);
  if (perfect.length) fact('Still perfect', perfect.map(r => esc(r.abbr)).join(' · '), `${perfect.length === 1 ? 'The only team' : 'The teams'} without a loss so far: ${perfect.map(r => `${esc(r.name)} (${r.w}-0)`).join(', ')}.`);
  const winless = rows.filter(r => r.w === 0 && r.l > 0);
  if (winless.length) fact('Still searching', winless.map(r => esc(r.abbr)).join(' · '), `Still looking for a first win: ${winless.map(r => `${esc(r.name)} (0-${r.l})`).join(', ')}.`);
  const bestO = rows.slice().sort((a, b) => b.ppg - a.ppg)[0], bestD = rows.slice().sort((a, b) => a.opp - b.opp)[0];
  if (bestO) fact('Best offense', NBA.fix(bestO.ppg) + '<small>points a game</small>', `${esc(bestO.name)} score the most points per game in the league.`, teamWho(bestO));
  if (bestD) fact('Stingiest defense', NBA.fix(bestD.opp) + '<small>allowed</small>', `${esc(bestD.name)} allow the fewest points per game.`, teamWho(bestD));
  const blow = rows.slice().sort((a, b) => b.diff - a.diff)[0];
  if (blow) fact('Biggest margin', '+' + NBA.fix(blow.diff), `${esc(blow.name)} outscore opponents by ${NBA.fix(blow.diff)} points a game, the best in the NBA.`, teamWho(blow));

  if (ts && ts.length) {
    const lgTpa = ts.reduce((n, t) => n + t.tpa, 0) / ts.length, lgPpg = ts.reduce((n, t) => n + t.ppg, 0) / ts.length;
    const bomb = ts.slice().sort((a, b) => b.tpa - a.tpa)[0];
    fact('League average', NBA.fix(lgPpg) + '<small>points per team</small>', `Teams average ${NBA.fix(lgTpa)} three-point attempts a game. ${esc(NBA.T(bomb.id).name)} fire the most at ${NBA.fix(bomb.tpa)}.`);
  }
  if (players && players.length) {
    const scorers = NBA.leaders({ stat: 'ts', limit: 50 }).filter(p => p.pts >= 15);
    if (scorers[0]) fact('Most efficient scorer', NBA.fix(scorers[0].ts) + '%<small>true shooting</small>', `Best true shooting among players scoring 15 or more a game, on ${NBA.fix(scorers[0].pts)} points per game.`, playerWho(scorers[0]));
    const tds = players.filter(p => p.td > 0).sort((a, b) => b.td - a.td);
    if (tds.length) fact('Triple-double club', String(tds.reduce((n, p) => n + p.td, 0)), `Triple-doubles so far, led by ${tds.slice(0, 3).map(p => `${esc(p.name)} (${p.td})`).join(', ')}.`, playerWho(tds[0]));
    const young = players.filter(p => p.age && p.pts >= 15 && p.gp >= 2).sort((a, b) => a.age - b.age)[0];
    if (young) fact('Youngest star', `${young.age}<small>years old</small>`, `${esc(young.name)} is the youngest player averaging 15+ points, at ${NBA.fix(young.pts)} a game.`, playerWho(young));
    const iron = NBA.leaders({ stat: 'min', limit: 1 })[0];
    if (iron) fact('Iron man', NBA.fix(iron.min) + '<small>minutes a game</small>', `${esc(iron.name)} logs the most minutes per game.`, playerWho(iron));
    const sniper = NBA.leaders({ stat: 'tpp', limit: 30 }).filter(p => p.tpa >= 5)[0];
    if (sniper) fact('Sharpshooter', NBA.fix(sniper.tpp) + '%<small>from three</small>', `Best 3-point percentage among players taking 5+ threes a game (${NBA.fix(sniper.tpm)} made per game).`, playerWho(sniper));
  }
  const finals = past.flatMap(d => d.games).filter(g => g.state === 'post' && g.away.score !== '' && g.home.score !== '');
  if (finals.length && !NBA.S.spoilers) {
    const total = g => (+g.away.score) + (+g.home.score), margin = g => Math.abs((+g.away.score) - (+g.home.score));
    const label = g => `${esc(g.away.abbr)} ${esc(g.away.score)}, ${esc(g.home.abbr)} ${esc(g.home.score)} on ${esc(NBA.fmtDate(g.date, { weekday: 'short', month: 'short', day: 'numeric' }))}`;
    const shoot = finals.slice().sort((a, b) => total(b) - total(a))[0];
    fact('Shootout of the week', String(total(shoot)) + '<small>combined points</small>', label(shoot) + '.');
    const rout = finals.slice().sort((a, b) => margin(b) - margin(a))[0];
    fact('Blowout of the week', String(margin(rout)) + '<small>point margin</small>', label(rout) + '.');
    const close = finals.slice().sort((a, b) => margin(a) - margin(b))[0];
    fact('Thriller of the week', String(margin(close)) + '<small>point margin</small>', label(close) + '.');
    const big = finals.flatMap(g => [g.away, g.home].map(t => ({ g, t, l: t.leaders.find(x => x.cat === 'points') }))).filter(x => x.l).sort((a, b) => NBA.num(b.l.value) - NBA.num(a.l.value))[0];
    if (big) fact('Best scoring night', esc(big.l.value) + '<small>points</small>', `${esc(big.l.full)} for ${esc(big.t.abbr)} on ${esc(NBA.fmtDate(big.g.date, { weekday: 'short', month: 'short', day: 'numeric' }))}.`, `<div class="who3">${UI.hs(big.l.headshot)}${esc(big.l.full)}</div>`);
    const close5 = finals.filter(g => margin(g) <= 5).length;
    fact('Nail-biters', `${Math.round(close5 / finals.length * 100)}%`, `${close5} of the last ${finals.length} games were decided by 5 points or fewer.`);
  }
  return `<section class="sec">${head}${scatter(rows)}</section><section class="sec"><div class="facts">${cards.join('')}</div></section>`;
};
const SC = { W: 1000, H: 560, l: 64, r: 28, t: 28, b: 56 };
function scatter(rows) {
  if (!rows.length || !rows.some(r => r.ppg)) return '';
  const xs = rows.map(r => r.ppg), ys = rows.map(r => r.opp);
  const x0 = Math.floor(Math.min(...xs) - 2), x1 = Math.ceil(Math.max(...xs) + 2), y0 = Math.floor(Math.min(...ys) - 2), y1 = Math.ceil(Math.max(...ys) + 2);
  const X = v => SC.l + (v - x0) / (x1 - x0) * (SC.W - SC.l - SC.r);
  const Y = v => SC.t + (v - y0) / (y1 - y0) * (SC.H - SC.t - SC.b);
  const ax = rows.reduce((n, r) => n + r.ppg, 0) / rows.length, ay = rows.reduce((n, r) => n + r.opp, 0) / rows.length;
  const step = (x1 - x0) > 24 ? 5 : 2;
  let grid = '';
  for (let v = Math.ceil(x0 / step) * step; v <= x1; v += step) grid += `<line class="gl" x1="${X(v)}" x2="${X(v)}" y1="${SC.t}" y2="${SC.H - SC.b}"/><text class="ax" x="${X(v)}" y="${SC.H - SC.b + 20}" text-anchor="middle">${v}</text>`;
  for (let v = Math.ceil(y0 / step) * step; v <= y1; v += step) grid += `<line class="gl" x1="${SC.l}" x2="${SC.W - SC.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${SC.l - 10}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  const fav = new Set(NBA.S.favorites);
  const pts = rows.map(r => {
    const t = NBA.T(r.id);
    return `<g class="pt${fav.has(r.id) ? ' on' : ''}" data-id="${r.id}" data-tip="${esc(`${r.full}|${r.w}-${r.l} · ${NBA.fix(r.ppg)} scored · ${NBA.fix(r.opp)} allowed`)}" transform="translate(${X(r.ppg).toFixed(1)},${Y(r.opp).toFixed(1)})" data-act="team" tabindex="0" role="button" aria-label="${esc(r.full)}: ${NBA.fix(r.ppg)} points scored, ${NBA.fix(r.opp)} allowed">
      <circle r="19"/><image href="${esc(NBA.lg(t.logo ? t : r))}" x="-14" y="-14" width="28" height="28"/></g>`;
  }).join('');
  return `<div class="card"><div class="card-h"><h3>Offense vs. defense</h3><div class="end"><span class="eyebrow">Points per game · all 30 teams</span></div></div>
    <div class="scatter-wrap" id="scatter"><svg viewBox="0 0 ${SC.W} ${SC.H}" role="img" aria-label="Scatter chart of points scored versus points allowed per game for every team. Teams up and to the right score more and allow less.">
      ${grid}
      <line class="avg" x1="${X(ax)}" x2="${X(ax)}" y1="${SC.t}" y2="${SC.H - SC.b}"/><line class="avg" x1="${SC.l}" x2="${SC.W - SC.r}" y1="${Y(ay)}" y2="${Y(ay)}"/>
      <text class="quad" x="${SC.W - SC.r - 8}" y="${SC.t + 18}" text-anchor="end">Score a lot · allow little</text>
      <text class="quad" x="${SC.l + 8}" y="${SC.t + 18}">Defense first</text>
      <text class="quad" x="${SC.W - SC.r - 8}" y="${SC.H - SC.b - 10}" text-anchor="end">Shootouts</text>
      <text class="quad" x="${SC.l + 8}" y="${SC.H - SC.b - 10}">Struggling both ends</text>
      <text class="axt" x="${(SC.l + SC.W - SC.r) / 2}" y="${SC.H - 10}" text-anchor="middle">Points scored per game →</text>
      <text class="axt" transform="translate(16 ${(SC.t + SC.H - SC.b) / 2}) rotate(-90)" text-anchor="middle">← Points allowed per game (fewer is higher)</text>
      ${pts}
    </svg><div class="tip" id="sc-tip" hidden></div></div>
    <p class="note" style="padding:0 var(--pad) var(--pad)">Dashed lines mark the league averages. Hover a logo for details; click it to open the team.</p></div>`;
}
NBA.after.facts = (view, changed) => {
  if (!changed) return;
  const wrap = view.querySelector('#scatter'), tip = view.querySelector('#sc-tip');
  if (!wrap) return;
  const show = g => {
    const [name, line] = g.dataset.tip.split('|');
    tip.innerHTML = `<b>${esc(name)}</b>${esc(line)}`;
    const r = wrap.getBoundingClientRect(), b = g.getBoundingClientRect();
    tip.style.left = Math.max(80, Math.min(r.width - 80, b.left + b.width / 2 - r.left)) + 'px';
    tip.style.top = (b.top - r.top) + 'px';
    tip.hidden = false;
  };
  wrap.querySelectorAll('.pt').forEach(g => {
    g.addEventListener('pointerenter', () => show(g));
    g.addEventListener('focus', () => show(g));
    g.addEventListener('pointerleave', () => { tip.hidden = true; });
    g.addEventListener('blur', () => { tip.hidden = true; });
  });
};
})();
