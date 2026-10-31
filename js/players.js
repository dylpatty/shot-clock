/* Player cards, team payrolls and the Players tab. Clicking a player anywhere on the site opens the same card:
   bio and contract from ESPN rosters, plus this season's stats and recent games. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui, st = UI.st;
const { esc } = NBA;
const V = NBA.views;
st.plq = st.plq || '';

/* League salary lines by season, from the NBA's announcement for 2026-27 */
const CAPS = {
  2027: { cap: 164.961e6, tax: 200.428e6, apron1: 209.015e6, apron2: 221.686e6 },
};
NBA.capLines = () => CAPS[NBA.SEASON] || CAPS[Math.max(...Object.keys(CAPS).map(Number))];
NBA.money = n => !n ? '–' : n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : '$' + Math.round(n / 1e3) + 'K';
const seasonLabel = yr => `${yr - 1}-${String(yr).slice(2)}`;
const teamRows = () => (NBA.data('standings') || []).flatMap(c => c.rows);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pill = s => `<span class="pill ${/out/i.test(s) ? 'out' : /day|question|doubt|prob/i.test(s) ? 'dtd' : 'neutral'}">${esc(s)}</span>`;
const share = (v, total) => { const p = v / total * 100; return p < 1 ? '<1%' : Math.round(p) + '%'; };
const OPTION = { P: 'Player option', T: 'Team option', E: 'Early termination option' };
// 84.5 inches -> 7' 0.5"
const ftIn = n => { const f = Math.floor(n / 12); return `${f}' ${Math.round((n - f * 12) * 100) / 100}"`; };

// Everyone on a loaded roster, by id, with the team they're on
function rosterIndex() {
  const idx = new Map(), rows = teamRows();
  let loaded = 0;
  rows.forEach(r => { const ro = NBA.data('roster:' + r.id); if (!ro) return; loaded++; ro.players.forEach(p => idx.set(p.id, { ...p, teamId: String(r.id) })); });
  return { idx, loaded, done: rows.length > 0 && loaded === rows.length };
}

/* ---------- team payroll ---------- */
NBA.payrollCard = teamId => {
  const ro = NBA.data('roster:' + teamId);
  const head = `<div class="card-h"><h3>Payroll</h3><div class="end"><span class="eyebrow">${NBA.SEASON_LABEL} salaries</span></div></div>`;
  if (!ro) return `<div class="card w12">${head}<p class="loading" style="padding:var(--pad)">Loading salaries…</p></div>`;
  const list = ro.players.filter(p => p.salary > 0).sort((a, b) => b.salary - a.salary);
  if (!list.length) return `<div class="card w12">${head}<p class="empty" style="padding:var(--pad)">ESPN hasn't posted salaries for this roster yet.</p></div>`;
  const L = NBA.capLines(), tone = NBA.tone(NBA.T(teamId));
  // ESPN is often slow to post salaries for players signed in the offseason, so those make the totals a floor, not the full number
  const twoWay = ro.players.filter(p => !p.salary && p.deal), missing = ro.players.filter(p => !p.salary && !p.deal);
  const part = missing.length > 0;
  const total = list.reduce((n, p) => n + p.salary, 0), room = L.cap - total, toTax = L.tax - total;
  const status = total >= L.apron2 ? ['Over the 2nd apron', 'The tightest trade and signing limits']
    : total >= L.apron1 ? ['Over the 1st apron', part ? 'Missing salaries only push it higher' : `${NBA.money(L.apron2 - total)} below the 2nd apron`]
    : total >= L.tax ? ['Paying luxury tax', part ? 'Missing salaries only push it higher' : `${NBA.money(L.apron1 - total)} below the 1st apron`]
    : total >= L.cap ? ['Over the cap', part ? 'Missing salaries only push it higher' : `${NBA.money(toTax)} below the tax line`]
    : part ? ['Not clear yet', 'Under the cap on listed salaries'] : ['Under the cap', 'Room to sign free agents outright'];
  const tile = (v, l, s) => `<div class="pr-tile"><b>${v}</b><span>${l}</span><small>${s}</small></div>`;
  const tiles = [
    tile(NBA.money(total) + (part ? '+' : ''), part ? 'Listed payroll' : 'Payroll', part ? `${list.length} of ${list.length + missing.length} salaries posted` : `${list.length} players`),
    room >= 0 ? tile(NBA.money(room), part ? 'Cap space, at most' : 'Cap space left', `Cap is ${NBA.money(L.cap)}`)
      : tile(NBA.money(-room) + (part ? '+' : ''), 'Over the cap', `Cap is ${NBA.money(L.cap)}`),
    toTax >= 0 ? tile(NBA.money(toTax), part ? 'Under the tax, at most' : 'Under the tax', `Tax line is ${NBA.money(L.tax)}`)
      : tile(NBA.money(-toTax) + (part ? '+' : ''), 'Over the tax', `Tax line is ${NBA.money(L.tax)}`),
    tile(esc(status[0]), 'Cap status', esc(status[1])),
  ].join('');
  // One bar of the whole payroll, a slice per player, against the cap, tax and apron lines
  const max = Math.max(L.apron2, total) * 1.06;
  const at = v => (v / max * 100).toFixed(2) + '%';
  const marks = [['Cap', 'Cap', L.cap, 'up'], ['Tax', 'Tax', L.tax, 'dn'], ['1st apron', 'A1', L.apron1, 'up'], ['2nd apron', 'A2', L.apron2, 'dn']];
  const meter = `<div class="pr-meter">
      <div class="pr-track">${list.map(p => `<i style="width:${at(p.salary)};background:${esc(tone)}" title="${esc(p.name)} · ${NBA.money(p.salary)}"></i>`).join('')}</div>
      ${marks.map(([l, s, v, side]) => `<span class="pr-mark ${side}" style="left:${at(v)}" title="${l}: ${NBA.money(v)}"><em><span class="lg">${l}</span><span class="sm">${s}</span></em></span>`).join('')}
    </div>`;
  const top = list[0].salary;
  const bars = `<ol class="pr-bars">${list.map(p => `<li data-act="player" data-id="${esc(p.id)}">
      <span class="nm">${UI.hs(p.headshot)}<b>${esc(p.name)}</b></span>
      <span class="bar"><i style="width:${(p.salary / top * 100).toFixed(1)}%;background:${esc(tone)}"></i></span>
      <span class="v"><b>${NBA.money(p.salary)}</b><small>${share(p.salary, total)} of ${part ? 'listed' : 'payroll'}${p.years ? ' · thru ' + seasonLabel(NBA.SEASON + p.years - 1) : ''}</small></span></li>`).join('')}</ol>`;
  const names = ps => esc(ps.map(p => p.name).join(', '));
  const filled = [...new Set(list.map(p => p.salaryFrom).filter(s => s && s !== 'ESPN'))];
  const warn = part ? `<p class="pr-warn">No ${NBA.SEASON_LABEL} salary is posted yet for ${missing.length} player${missing.length === 1 ? '' : 's'} (${names(missing)}), so the real payroll is higher. These numbers fill in on their own as salaries are posted.</p>` : '';
  return `<div class="card w12 payroll">${head}${warn}<div class="pr-tiles">${tiles}</div>${meter}${bars}
    <p class="note" style="padding:0 var(--pad) var(--pad)">${filled.length ? `Salaries come from ${esc(filled.join(' and '))}, refreshed every morning, and from ESPN for anyone not listed there` : "Salaries are ESPN's for players on the current roster"}.${twoWay.length ? ` Two-way contracts don't count against the cap: ${names(twoWay)}.` : ''} Dead money and cap holds aren't in the feed, so official cap sheets can run a little higher. League lines are the NBA's ${NBA.SEASON_LABEL} figures. Tap a player for their full card.</p></div>`;
};

/* ---------- player card ---------- */
const CARD_STATS = ['pts', 'reb', 'ast', 'stl', 'blk', 'tpm', 'min', 'fgp', 'tpp', 'ftp'];
const RANKED = new Set(['pts', 'reb', 'ast', 'stl', 'blk', 'tpm']);
NBA.playerCard = id => {
  id = String(id);
  const stats = NBA.use('players'), log = NBA.use('gamelog:' + id), s = NBA.playerById(id);
  // Only his own roster: the salary rank comes from data/extras.json. Someone missing from the stats feed, or not on
  // the roster it names (a trade it hasn't caught up with), is looked for on every roster.
  const own = s && s.teamId ? NBA.use('roster:' + s.teamId) : null;
  if (s && s.teamId ? own && !own.players.some(p => p.id === id) : stats || NBA.status('players').err) { NBA.use('standings'); NBA.loadRosters(); }
  const { idx, done } = rosterIndex();
  // Standings may not be loaded on this tab, so his roster goes in directly
  if (own) own.players.forEach(p => { if (!idx.has(p.id)) idx.set(p.id, { ...p, teamId: String(s.teamId) }); });
  const r = idx.get(id);
  const name = (r && r.name) || (s && s.name) || 'Player';
  const teamId = (r && r.teamId) || (s && s.teamId) || '', t = NBA.T(teamId);
  const back = UI.drawerBack ? `<button class="chip dr-back" data-act="drawerback">← ${esc(UI.drawerBack.title || 'Back to game')}</button>` : '';
  const bar = `<div class="dr-bar dpad"><button class="ib" data-act="close" aria-label="Close player">${UI.I.close}</button>
    <span class="dr-title" id="dr-title">${esc(name)}</span>${back}<a class="ext" href="https://www.espn.com/nba/player/_/id/${esc(id)}" target="_blank" rel="noopener">Open on ESPN ↗</a></div>`;
  if (!r && !s) return bar + `<div class="dpad pc-wait">${!done || (!stats && !NBA.status('players').err) ? '<p class="loading">Loading player…</p>' : `<p class="empty">This player isn't on a current NBA roster.</p>`}</div>`;
  const pos = (r && r.pos) || (s && s.pos) || '', headshot = (r && r.headshot) || (s && s.headshot);

  const hero = `<section class="pc-hero" style="--tc:${esc(t.color || '#444')};--logo:url('${esc(NBA.img(t.logo || '', 384))}')">
    ${headshot ? `<img class="pc-shot" src="${esc(NBA.img(headshot, 528))}" alt="">` : ''}
    <div class="pc-id"><div class="pc-team">${t.abbr ? UI.logo(t, 22) : ''}${esc([t.full, r && r.jersey ? '#' + r.jersey : '', pos].filter(Boolean).join(' · '))}</div>
      <h2>${esc(name)}</h2>
      <div class="pc-tags">${r && r.injury ? pill(r.injury) : '<span class="pill ok">Active</span>'}${r && r.exp === 0 ? '<span class="pill neutral">Rookie</span>' : ''}</div></div>
    ${r && r.salary ? `<div class="pc-pay"><b>${NBA.money(r.salary)}</b><span>a year</span></div>` : ''}
  </section>`;

  // This season, with league rank where the player qualifies for the leaderboard
  let statsHtml;
  if (!stats) statsHtml = '<p class="loading" style="padding:var(--pad)">Loading stats…</p>';
  else if (!s || !s.gp) statsHtml = `<p class="empty" style="padding:var(--pad)">No games played yet this season.</p>`;
  else statsHtml = `<div class="pc-stats">${CARD_STATS.map(k => {
    const v = NBA.statValue(k, s, 'game');
    const rank = RANKED.has(k) ? NBA.leaders({ stat: k, limit: 999 }).findIndex(x => x.id === id) + 1 : 0;
    return `<div><b>${NBA.statFmt(k, v, 'game')}</b><span>${esc(NBA.STATS[k].short)}</span>${rank && rank <= 50 ? `<small>${NBA.ord(rank)} in NBA</small>` : ''}</div>`;
  }).join('')}</div>`;

  let contract = '';
  if (r && (r.salary || r.pay.length)) {
    const paid = [...idx.values()].filter(x => x.salary > 0).sort((a, b) => b.salary - a.salary);
    const teamPay = paid.filter(x => x.teamId === teamId).reduce((n, x) => n + x.salary, 0);
    // League rank from this season's pay in data/extras.json (about 440 players), topped up by the rosters that are loaded.
    // Ignored, like the rosters do, once Basketball-Reference has moved to next season.
    const exAll = NBA.data('extras') || {}, cur = !(exAll.season > NBA.SEASON), ex = cur ? exAll.players || {} : {}, pay = new Map();
    Object.entries(ex).forEach(([pid, x]) => { const p = (x.pay || []).find(q => q[0] === NBA.SEASON); if (p) pay.set(pid, p[1]); });
    if (cur) Object.entries(exAll.espnPay || {}).forEach(([pid, v]) => pay.set(pid, v));
    paid.forEach(x => pay.set(x.id, x.salary));
    // Without extras, or with an extras file from before it listed ESPN's salaries, it counts every roster, as before
    const full = pay.size >= 200 && !!exAll.espnPay;
    if (!full && r.salary) { NBA.use('standings'); NBA.loadRosters(); }
    const paidList = full ? [...pay.entries()].sort((a, b) => b[1] - a[1]).map(([pid]) => pid) : paid.map(x => x.id);
    const rank = r.salary && (full || done) ? paidList.indexOf(id) + 1 : 0;
    const fut = r.future || [];
    const end = fut.length ? fut[fut.length - 1][0] : r.years ? NBA.SEASON + r.years - 1 : 0;
    // Only options still to come: the current season's mark stays on the page even after the option was picked up
    const opts = fut.filter(p => p[2] && p[0] > NBA.SEASON).map(p => `${OPTION[p[2]] || 'Option'} in ${seasonLabel(p[0])}`);
    const past = r.pay.filter(x => x.yr <= NBA.SEASON);
    const career = past.reduce((n, x) => n + x.salary, 0);
    const tile = (l, v, sub = '') => `<div><span>${l}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
    const from = r.salaryFrom && r.salaryFrom !== 'ESPN' ? `From ${esc(r.salaryFrom)} · ` : '';
    const tiles = [
      tile('Salary this season', r.salary ? NBA.money(r.salary) : r.deal ? 'Two-way' : 'Not posted', r.salary && teamPay ? `${from}${share(r.salary, teamPay)} of the team's payroll` : r.deal ? "Doesn't count against the cap" : 'Not posted anywhere yet'),
      tile('Contract length', r.years ? (r.years === 1 ? 'Final year' : `${r.years} years left`) : '–', end ? `Signed through ${seasonLabel(end)}${opts.length ? ' · ' + esc(opts.join(', ')) : ''}` : 'Not listed'),
      fut.length > 1 ? tile('Left on the deal', NBA.money(fut.reduce((n, p) => n + p[1], 0)), [opts.length ? 'Counting option years' : 'Every season left, this one included', r.gtd != null ? (r.gtd ? `${NBA.money(r.gtd)} guaranteed` : 'None of it guaranteed') : ''].filter(Boolean).join(' · '))
        : r.years && r.salary ? tile('Left on the deal', r.years > 1 ? '≈ ' + NBA.money(r.salary * r.years) : NBA.money(r.salary), r.years > 1 ? "Estimate at this year's salary" : r.gtd === 0 ? 'This season only · not guaranteed' : 'This season only') : '',
      r.salary ? tile('NBA salary rank', rank ? NBA.ord(rank) : '…', rank ? `of ${paidList.length} posted salaries` : 'Counting every roster') : '',
      tile('Career earnings', NBA.money(career), past.length ? `${past.length} season${past.length === 1 ? '' : 's'} since ${seasonLabel(past[0].yr)}` : ''),
    ].join('');
    // Salary by season: the last ten paid, then the seasons still to come, faded
    const hist = [...past.slice(-10), ...fut.filter(p => p[0] > NBA.SEASON).map(p => ({ yr: p[0], salary: p[1], opt: p[2], ahead: true }))];
    const hmax = Math.max(...hist.map(x => x.salary), 1);
    const chart = hist.length > 1 ? `<div class="pc-hist" role="img" aria-label="Salary by season">${hist.map(x => `<div class="${x.yr === NBA.SEASON ? 'now' : x.ahead ? 'ahead' : ''}" title="${seasonLabel(x.yr)}: ${NBA.money(x.salary)}${x.opt ? ' · ' + (OPTION[x.opt] || 'option') : ''}">
        <small>${NBA.money(x.salary).replace('.0M', 'M')}</small><i style="height:${Math.max(3, x.salary / hmax * 100).toFixed(1)}%;--tc:${esc(NBA.tone(t))}"></i><span>'${String(x.yr).slice(2)}${x.opt ? `<sup>${esc(x.opt)}O</sup>` : ''}</span></div>`).join('')}</div>` : '';
    contract = `<div class="card pc-wide"><div class="card-h"><h3>Contract</h3><div class="end"><span class="eyebrow">From ${from ? esc(r.salaryFrom) + ' and ESPN' : 'ESPN'}</span></div></div><div class="pc-money">${tiles}</div>${chart}</div>`;
  }

  const bio = r ? [
    ['Height', r.ht],
    ['Wingspan', r.wingIn ? `${ftIn(r.wingIn)}${r.wingHt ? ` · ${r.wingIn >= r.wingHt ? '+' : '−'}${Math.abs(Math.round((r.wingIn - r.wingHt) * 100) / 100)}" vs barefoot height` : ''}` : ''],
    ['Weight', r.wt],
    ['Age', r.age != null ? `${r.age}${r.dob ? ` · born ${NBA.fmtDay(r.dob.slice(0, 10), { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}` : ''],
    ['Experience', r.exp == null ? '' : r.exp === 0 ? 'Rookie' : `${r.exp} year${r.exp === 1 ? '' : 's'}`],
    ['College', r.college], ['Hometown', r.born], ['Jersey', r.jersey ? '#' + r.jersey : ''], ['Position', pos],
  ].filter(x => x[1]) : [];
  const bioHtml = bio.length ? `<div class="card"><div class="card-h"><h3>Bio</h3></div><dl class="pc-bio">${bio.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>` : '';

  const games = log ? log.slice(0, 5) : null;
  // No spoilers: a recent game's result and line stay hidden until it's opened (the row opens it)
  const m = g => NBA.masked(g.id, g.date), cell = (g, v) => m(g) ? '·' : esc(v ?? '–');
  const logHtml = `<div class="card"><div class="card-h"><h3>Last 5 games</h3></div>${!games ? '<p class="loading" style="padding:var(--pad)">Loading games…</p>' : !games.length ? '<p class="empty" style="padding:var(--pad)">No games yet this season.</p>'
    : `<div class="tblwrap"><table class="tbl pc-log"><thead><tr><th class="l" scope="col">Game</th><th scope="col">MIN</th><th scope="col">PTS</th><th scope="col">REB</th><th scope="col">AST</th><th scope="col">FG</th><th scope="col">3PT</th></tr></thead>
      <tbody>${games.map(g => `<tr class="click" data-act="game" data-id="${esc(g.id)}"><td class="l"><b>${esc(NBA.fmtDate(g.date, { month: 'short', day: 'numeric' }))}</b> ${g.home ? 'vs' : '@'} ${esc(g.oppAbbr || '')} <span class="${m(g) ? '' : g.result === 'W' ? 'win' : g.result === 'L' ? 'loss' : ''}">${m(g) ? '' : esc(g.result)}</span></td>
        <td>${cell(g, g.min)}</td><td><b>${cell(g, g.pts)}</b></td><td>${cell(g, g.reb)}</td><td>${cell(g, g.ast)}</td><td>${cell(g, g.fg)}</td><td>${cell(g, g.tp)}</td></tr>`).join('')}</tbody></table></div>`}</div>`;

  return `${bar}<div class="pc dpad">${hero}<div class="pc-grid">
    <div class="card pc-wide"><div class="card-h"><h3>${NBA.SEASON_LABEL} season</h3><div class="end"><span class="eyebrow">${s && s.gp ? `Per game · ${s.gp} game${s.gp === 1 ? '' : 's'}` : 'Per game'}</span></div></div>${statsHtml}</div>
    ${contract}${bioHtml}${logHtml}${careerCard(id, r)}</div></div>`;
};

/* Career per-game table, season by season, in Basketball-Reference's column order */
st.pcType = st.pcType || '2';
const AWARDS = [
  [/(eastern|western|conference) .*finals.*(mvp|most valuable)/i, 'CF MVP'], [/finals.*(mvp|most valuable)/i, 'Finals MVP'], [/all-star.*(mvp|most valuable)/i, 'AS MVP'],
  [/(nba cup|in-season).*(mvp|most valuable)/i, 'Cup MVP'], [/(mvp|most valuable)/i, 'MVP'], [/all-nba.*(1st|first)/i, 'NBA1'], [/all-nba.*(2nd|second)/i, 'NBA2'], [/all-nba.*(3rd|third)/i, 'NBA3'],
  [/all-defensive.*(1st|first)/i, 'DEF1'], [/all-defensive.*(2nd|second)/i, 'DEF2'], [/all-rookie.*(1st|first)/i, 'ROOK1'], [/all-rookie.*(2nd|second)/i, 'ROOK2'],
  [/all-star/i, 'AS'], [/rookie of the year/i, 'ROY'], [/defensive player/i, 'DPOY'], [/sixth man/i, '6MOY'], [/most improved/i, 'MIP'],
  [/clutch/i, 'CPOY'], [/in-season|nba cup/i, 'Cup'], [/champion/i, 'Champ'],
];
const awardCode = name => (AWARDS.find(([re]) => re.test(name)) || [null, name])[1];
// Basketball-Reference style: .512, blank when there were no attempts
const pct3 = v => !Number.isFinite(v) ? '' : v >= 1 ? '1.000' : '.' + String(Math.round(v * 1000)).padStart(3, '0');
const one = v => Number.isFinite(v) ? v.toFixed(1) : '';
const CAREER_COLS = [
  ['G', r => Number.isFinite(r.g) ? r.g : ''], ['GS', r => Number.isFinite(r.gs) ? r.gs : ''], ['MP', r => one(r.mp)],
  ['FG', r => one(r.fg)], ['FGA', r => one(r.fga)], ['FG%', r => pct3(r.fgp)], ['3P', r => one(r.tp)], ['3PA', r => one(r.tpa)], ['3P%', r => pct3(r.tpp)],
  ['2P', r => one(r.two)], ['2PA', r => one(r.twoa)], ['2P%', r => pct3(r.twop)], ['eFG%', r => pct3(r.efg)],
  ['FT', r => one(r.ft)], ['FTA', r => one(r.fta)], ['FT%', r => pct3(r.ftp)], ['ORB', r => one(r.orb)], ['DRB', r => one(r.drb)], ['TRB', r => one(r.trb)],
  ['AST', r => one(r.ast)], ['STL', r => one(r.stl)], ['BLK', r => one(r.blk)], ['TOV', r => one(r.tov)], ['PF', r => one(r.pf)], ['PTS', r => `<b>${one(r.pts)}</b>`],
];
function careerCard(id, r) {
  const type = st.pcType;
  const car = NBA.use(`career:${id}.${type}`), aw = NBA.use('awards:' + id) || [];
  const tabs = `<div class="seg sm" role="group" aria-label="Season type">${[['2', 'Regular season'], ['3', 'Playoffs']].map(([v, l]) => `<button data-act="pctype" data-v="${v}" aria-pressed="${type === v}">${l}</button>`).join('')}</div>`;
  const head = `<div class="card-h"><h3>Career stats</h3><div class="end">${tabs}</div></div>`;
  if (!car) return `<div class="card pc-wide">${head}${NBA.status(`career:${id}.${type}`).err ? '<p class="empty" style="padding:var(--pad)">Couldn\'t load career stats from ESPN. It will try again shortly.</p>' : '<p class="loading" style="padding:var(--pad)">Loading career stats…</p>'}</div>`;
  if (!car.rows.length) return `<div class="card pc-wide">${head}<p class="empty" style="padding:var(--pad)">${type === '3' ? 'No playoff games yet.' : 'No NBA games yet.'}</p></div>`;
  // Age on February 1 of the season, the way Basketball-Reference counts it
  const born = r && r.dob ? NBA.dateOfIso(r.dob.slice(0, 10)) : null;
  const ageIn = yr => born ? yr - born.getFullYear() - (born.getMonth() > 1 || (born.getMonth() === 1 && born.getDate() > 1) ? 1 : 0) : '';
  const awardsIn = yr => type === '2' ? aw.filter(a => a.yr === yr && !/finals/i.test(a.name)) : aw.filter(a => a.yr === yr && /finals/i.test(a.name));
  const row = x => {
    const won = x.part ? [] : awardsIn(x.yr), allStar = won.some(a => awardCode(a.name) === 'AS');
    // ESPN's abbreviation for that season (SEA, NJ...), falling back to the franchise's current one
    const team = x.team || (x.teamId ? NBA.T(x.teamId).abbr : '') || '';
    return `<tr class="${x.part ? 'part' : ''}${x.yr === NBA.SEASON && !x.part ? ' cur' : ''}"><th class="l sticky" scope="row">${x.part ? '' : esc(x.season)}${allStar ? '<span class="pc-star" title="All-Star">★</span>' : ''}</th>
      <td>${x.part ? '' : ageIn(x.yr)}</td><td class="l">${esc(team)}</td><td class="l">NBA</td><td class="l">${esc(x.pos)}</td>
      ${CAREER_COLS.map(([, f]) => `<td>${f(x)}</td>`).join('')}<td class="l aw">${esc([...new Set(won.map(a => awardCode(a.name)))].join(', '))}</td></tr>`;
  };
  const c = car.career;
  return `<div class="card pc-wide">${head}<div class="tblwrap"><table class="tbl pc-career">
    <thead><tr><th class="l sticky" scope="col">Season</th><th scope="col">Age</th><th class="l" scope="col">Team</th><th class="l" scope="col">Lg</th><th class="l" scope="col">Pos</th>${CAREER_COLS.map(([k]) => `<th scope="col">${k}</th>`).join('')}<th class="l" scope="col">Awards</th></tr></thead>
    <tbody>${car.rows.map(row).join('')}</tbody>
    ${c ? `<tfoot><tr><th class="l sticky" scope="row">${car.seasons} Yr${car.seasons === 1 ? '' : 's'}</th><td></td><td></td><td></td><td></td>${CAREER_COLS.map(([, f]) => `<td>${f(c)}</td>`).join('')}<td></td></tr></tfoot>` : ''}
  </table></div><p class="note" style="padding:10px var(--pad) var(--pad)">Per game, from ESPN, and updated after every game. Awards are the ones ESPN lists as won (MVP, All-NBA, All-Defensive, All-Rookie and the like; Finals MVPs under Playoffs). ESPN doesn't list All-Star picks or voting finishes.</p></div>`;
}
NBA.actions.pctype = a => { st.pcType = a.dataset.v; NBA.render(); };

/* ---------- Players tab ---------- */
V.players = () => {
  NBA.use('standings');
  NBA.loadRosters();
  const { idx, loaded, done } = rosterIndex();
  const head = `<div class="sec-h"><h2>Players</h2><span class="sub">Everyone on an NBA roster, A to Z by last name · tap a player for their card</span></div>`;
  if (!idx.size) return `<section class="sec">${head}<p class="loading">Loading rosters…</p></section>`;
  const q = norm(st.plq).trim();
  let list = [...idx.values()].map(p => ({ p, k: norm(p.last || p.name.split(' ').pop()) + ' ' + norm(p.first || p.name) })).sort((a, b) => a.k.localeCompare(b.k));
  if (q) list = list.filter(({ p }) => { const t = NBA.T(p.teamId); return norm(p.name).includes(q) || norm(t.full).includes(q) || norm(t.abbr) === q; });
  const groups = new Map();
  list.forEach(({ p, k }) => { const L = /[a-z]/.test(k[0]) ? k[0].toUpperCase() : '#'; if (!groups.has(L)) groups.set(L, []); groups.get(L).push(p); });
  const az = `<nav class="pl-az" aria-label="Jump to a letter">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(L => groups.has(L) ? `<button data-act="plaz" data-v="${L}">${L}</button>` : `<span>${L}</span>`).join('')}</nav>`;
  const card = p => {
    const t = NBA.T(p.teamId);
    return `<button type="button" class="pl-card" data-act="player" data-id="${esc(p.id)}">${UI.hs(p.headshot)}<span class="pl-nm"><b>${esc(p.name)}</b>
      <small>${t.logo ? UI.logo(t, 14) : ''}${esc(t.abbr || '')}${p.pos ? ' · ' + esc(p.pos) : ''}${p.jersey ? ' · #' + esc(p.jersey) : ''}</small></span>${p.injury ? '<i class="pl-inj" title="On the injury report"></i>' : ''}</button>`;
  };
  const body = list.length ? [...groups].map(([L, ps]) => `<section class="pl-group" id="pl-${L}"><h3 class="pl-letter">${L}</h3><div class="pl-grid">${ps.map(card).join('')}</div></section>`).join('')
    : `<p class="empty">No players match “${esc(st.plq.trim())}”.</p>`;
  return `<section class="sec">${head}
    <div class="pl-tools"><label class="sr" for="plq">Search players</label><input class="field big" id="plq" data-in="plq" type="search" autocomplete="off" spellcheck="false" placeholder="Search players by name or team" value="${esc(st.plq)}">
      <span class="mut">${list.length} player${list.length === 1 ? '' : 's'}${done ? '' : ` · loading rosters, ${loaded} of ${teamRows().length}`}</span></div>
    ${az}${body}</section>`;
};
NBA.changes.plq = t => { st.plq = t.value; NBA.render(); };
NBA.actions.plaz = a => { const el = document.getElementById('pl-' + a.dataset.v); if (el) el.scrollIntoView({ block: 'start' }); };
})();
