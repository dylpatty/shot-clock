/* Home tab, the swipeable chart deck on Fun Facts, and the card-deck component they share.
   Every chart and card is recalculated from live ESPN data each time the page renders. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui, st = UI.st;
const { esc } = NBA;
const V = NBA.views;
st.deckIdx = st.deckIdx || {};

const mean = a => a.reduce((n, v) => n + v, 0) / (a.length || 1);
const rec = s => { const m = /^(\d+)-(\d+)/.exec(s || ''); return m ? { w: +m[1], l: +m[2] } : null; };
const winPct = r => r && r.w + r.l ? r.w / (r.w + r.l) * 100 : NaN;
const hashStr = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const teamRows = () => (NBA.data('standings') || []).flatMap(c => c.rows);
// The day's order for anything that rotates: same all day, different tomorrow
const dailyOrder = (list, salt) => list.map((x, i) => [hashStr(salt + NBA.today + i), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

/* ---------- shared player helpers ---------- */
// First-year players come from ESPN rosters (0 years of experience); null until enough rosters have loaded
NBA.rookies = () => {
  const rows = teamRows();
  const rosters = rows.map(r => NBA.data('roster:' + r.id)).filter(Boolean);
  if (rows.length && rosters.length < rows.length * .8) return null;
  const ids = new Set(rosters.flatMap(x => x.players).filter(p => p.exp === 0).map(p => p.id));
  return (NBA.data('players') || []).filter(p => ids.has(p.id) && p.gp >= 1);
};
NBA.loadRosters = () => teamRows().forEach(r => NBA.use('roster:' + r.id));
// Game Score per game (Hollinger), with rebounds weighted .4 since the feed doesn't split offensive and defensive boards
NBA.gameScore = p => p.pts + .4 * p.fgm - .7 * p.fga - .4 * (p.fta - p.ftm) + .4 * p.reb + p.stl + .7 * p.ast + .7 * p.blk - .4 * p.pf - p.tov;
NBA.topPlayers = (n = 25) => {
  const gpOf = new Map(teamRows().map(r => [r.id, r.w + r.l]));
  return (NBA.data('players') || []).filter(p => p.min >= 20 && p.gp >= Math.max(2, (gpOf.get(p.teamId) || 0) * .6))
    .map(p => ({ p, v: NBA.gameScore(p) })).sort((a, b) => b.v - a.v).slice(0, n);
};

/* ---------- logo scatter charts ---------- */
const niceStep = (span, n) => { const raw = span / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; };
const tickFmt = step => v => step < 1 ? v.toFixed(step < .1 ? 2 : 1) : String(Math.round(v));
const LOG_TICKS = [.1, .2, .5, 1, 2, 5, 10, 20, 50, 100];
function drawChart(wrap, spec) {
  const pts = spec.pts.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && (!spec.yLog || p.y > 0));
  if (pts.length < 3) { wrap.innerHTML = '<p class="empty">Not enough games yet for this chart.</p>'; return; }
  const cs = getComputedStyle(wrap);
  const W = Math.max(260, Math.floor(wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)));
  const narrow = W < 600;
  const top = document.getElementById('top');
  // Leave room for the card's title, note and deck controls so a whole card fits on one screen
  const avail = innerHeight - (top ? top.offsetHeight : 0) - (+wrap.dataset.chrome || 220);
  const H = Math.round(Math.max(260, Math.min(avail, W * (narrow ? 1.1 : .56))));
  const m = narrow ? { l: 40, r: 12, t: 14, b: 44 } : { l: 64, r: 24, t: 24, b: 56 };
  const rad = spec.face ? (narrow ? 14 : W < 1200 ? 18 : 22) : (narrow ? 11 : W < 1200 ? 16 : 20);
  const ty = spec.yLog ? Math.log10 : v => v;
  const span = (lo, hi) => { const s = (hi - lo) || 1; return [lo - s * .07, hi + s * .07]; };
  const [x0, x1] = span(Math.min(...pts.map(p => p.x)), Math.max(...pts.map(p => p.x)));
  const [y0, y1] = span(Math.min(...pts.map(p => ty(p.y))), Math.max(...pts.map(p => ty(p.y))));
  const X = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r);
  const Yt = t => spec.yUp === false ? m.t + (t - y0) / (y1 - y0) * (H - m.t - m.b) : H - m.b - (t - y0) / (y1 - y0) * (H - m.t - m.b);
  const Y = v => Yt(ty(v));
  let grid = '';
  const xs = niceStep(x1 - x0, narrow ? 4 : 9), xf = spec.xFmt || tickFmt(xs);
  for (let v = Math.ceil(x0 / xs) * xs; v <= x1; v += xs) grid += `<line class="gl" x1="${X(v)}" x2="${X(v)}" y1="${m.t}" y2="${H - m.b}"/><text class="ax" x="${X(v)}" y="${H - m.b + 18}" text-anchor="middle">${esc(xf(v))}</text>`;
  let yt, yf;
  if (spec.yLog) { yt = LOG_TICKS.filter(v => ty(v) >= y0 && ty(v) <= y1); yf = spec.yFmt || (v => String(v)); }
  else { const s = niceStep(y1 - y0, narrow ? 5 : 7); yt = []; for (let v = Math.ceil(y0 / s) * s; v <= y1; v += s) yt.push(v); yf = spec.yFmt || tickFmt(s); }
  yt.forEach(v => { grid += `<line class="gl" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${esc(yf(v))}</text>`; });
  let guides = '';
  if (spec.avg !== false) {
    guides += `<line class="avg" x1="${X(mean(pts.map(p => p.x)))}" x2="${X(mean(pts.map(p => p.x)))}" y1="${m.t}" y2="${H - m.b}"/>`;
    if (!spec.yLog) guides += `<line class="avg" x1="${m.l}" x2="${W - m.r}" y1="${Y(mean(pts.map(p => p.y)))}" y2="${Y(mean(pts.map(p => p.y)))}"/>`;
  }
  if (spec.diag) { const lo = Math.max(x0, y0), hi = Math.min(x1, y1); if (hi > lo) guides += `<line class="avg" x1="${X(lo)}" y1="${Yt(lo)}" x2="${X(hi)}" y2="${Yt(hi)}"/>`; }
  const q = narrow && spec.quadsShort ? spec.quadsShort : spec.quads;
  if (q) guides += `<text class="quad" x="${W - m.r - 6}" y="${m.t + 16}" text-anchor="end">${esc(q[0])}</text><text class="quad" x="${m.l + 6}" y="${m.t + 16}">${esc(q[1])}</text>
    <text class="quad" x="${W - m.r - 6}" y="${H - m.b - 8}" text-anchor="end">${esc(q[2])}</text><text class="quad" x="${m.l + 6}" y="${H - m.b - 8}">${esc(q[3])}</text>`;
  // Highlighted teams draw last so they sit on top
  const order = pts.slice().sort((a, b) => (a.on ? 1 : 0) - (b.on ? 1 : 0));
  const img = p => spec.face
    ? `<image href="${esc(p.img || '')}" x="${-rad * 1.3}" y="${-rad * 1}" width="${rad * 2.6}" height="${rad * 1.9}" clip-path="url(#cl-${spec.id})" preserveAspectRatio="xMidYMin slice"/>`
    : `<image href="${esc(p.img || '')}" x="${-rad * .74}" y="${-rad * .74}" width="${rad * 1.48}" height="${rad * 1.48}"/>`;
  const dots = order.map(p => `<g class="pt${p.on ? ' on' : ''}" data-act="${p.act}" data-id="${esc(p.id)}" data-tip="${esc(p.tip)}" transform="translate(${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)})" tabindex="0" role="button" aria-label="${esc(p.tip.replace('|', ': '))}"><circle r="${rad}"/>${img(p)}</g>`).join('');
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(spec.title + ': ' + spec.xLabel + ' against ' + spec.yLabel)}">
    ${spec.face ? `<defs><clipPath id="cl-${spec.id}"><circle r="${rad - 1.5}"/></clipPath></defs>` : ''}${grid}${guides}
    <text class="axt" x="${(m.l + W - m.r) / 2}" y="${H - 8}" text-anchor="middle">${esc(spec.xLabel)} →</text>
    <text class="axt" transform="translate(12 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">${esc(spec.yUp === false ? '← ' + spec.yLabel : spec.yLabel + ' →')}</text>
    ${dots}</svg><div class="tip" hidden></div>`;
  const tip = wrap.querySelector('.tip');
  const show = g => {
    const [name, line] = g.dataset.tip.split('|');
    tip.innerHTML = `<b>${esc(name)}</b>${esc(line || '')}`;
    const r = wrap.getBoundingClientRect(), b = g.getBoundingClientRect();
    tip.style.left = Math.max(90, Math.min(r.width - 90, b.left + b.width / 2 - r.left)) + 'px';
    tip.style.top = (b.top - r.top) + 'px';
    tip.hidden = false;
  };
  wrap.querySelectorAll('.pt').forEach(g => {
    g.addEventListener('pointerenter', () => show(g));
    g.addEventListener('focus', () => show(g));
    g.addEventListener('pointerleave', () => { tip.hidden = true; });
    g.addEventListener('blur', () => { tip.hidden = true; });
  });
}

/* ---------- the charts ---------- */
const teamPt = (r, x, y, line) => { const t = NBA.T(r.id); return { id: r.id, act: 'team', x, y, img: NBA.lg(t.logo ? t : r), tip: `${r.full || t.full}|${line}`, on: NBA.S.favorites.includes(r.id) }; };
const playerPt = (p, x, y, line) => ({ id: p.id, act: 'player', x, y, img: p.headshot, tip: `${p.name} · ${p.team}|${line}`, on: NBA.S.favorites.includes(p.teamId) });
const f1 = NBA.fix;
const SPECS = new Map();
function chartSpecs() {
  const rows = teamRows();
  if (!rows.length) return [];
  const byId = new Map(rows.map(r => [r.id, r]));
  const ts = (NBA.data('teamstats') || []).filter(t => byId.has(t.id));
  const players = NBA.data('players') || [];
  const out = [];
  const add = s => { if (s.pts.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)).length >= 5) out.push(s); };
  const rec2 = r => `${r.w}-${r.l}`;

  add({ id: 'offdef', title: 'Offense vs. defense', sub: 'Points per game · all 30 teams', xLabel: 'Points scored per game', yLabel: 'Points allowed per game (fewer is higher)', yUp: false,
    quads: ['Score a lot · allow little', 'Defense first', 'Shootouts', 'Struggling both ends'], quadsShort: ['Best of both', 'Defense first', 'Shootouts', 'Struggling'],
    note: 'Dashed lines mark the league averages. Up and to the right is where contenders live.',
    pts: rows.map(r => teamPt(r, r.ppg, r.opp, `${rec2(r)} · ${f1(r.ppg)} scored · ${f1(r.opp)} allowed`)) });
  if (ts.length) {
    add({ id: 'ratings', title: 'Efficiency', sub: 'Points per 100 possessions', xLabel: 'Offensive rating', yLabel: 'Defensive rating (lower is higher)', yUp: false,
      quads: ['Elite both ways', 'Defense carries them', 'Outscore everyone', 'Rebuilding'], quadsShort: ['Elite', 'Defense', 'Offense', 'Rebuilding'],
      note: 'Ratings take out pace, so fast and slow teams compare fairly. These are estimates from box-score totals.',
      pts: ts.map(t => teamPt(byId.get(t.id), t.ortg, t.drtg, `Off ${f1(t.ortg)} · Def ${f1(t.drtg)} · Net ${t.net > 0 ? '+' : ''}${f1(t.net)}`)) });
    add({ id: 'pace', title: 'Does speed pay?', sub: 'Pace against net rating', xLabel: 'Possessions per game', yLabel: 'Net rating',
      quads: ['Run and win', 'Slow and winning', 'Fast and losing', 'Slow and losing'],
      note: 'Net rating is points scored minus allowed per 100 possessions.',
      pts: ts.map(t => teamPt(byId.get(t.id), t.pace, t.net, `Pace ${f1(t.pace)} · Net ${t.net > 0 ? '+' : ''}${f1(t.net)}`)) });
    add({ id: 'threes', title: 'Three-point identity', sub: 'Volume against accuracy', xLabel: 'Threes attempted per game', yLabel: '3-point %', yFmt: v => v.toFixed(0) + '%',
      quads: ['Bombs away, on target', 'Picky but accurate', 'Shooting a lot, missing a lot', 'Rarely and poorly'], quadsShort: ['Volume + accuracy', 'Picky', 'Chuckers', 'Rarely'],
      pts: ts.map(t => teamPt(byId.get(t.id), t.tpa, t.tpp, `${f1(t.tpm)} of ${f1(t.tpa)} a game · ${f1(t.tpp)}%`)) });
    add({ id: 'ball', title: 'Share it, keep it', sub: 'Assists against turnovers', xLabel: 'Assists per game', yLabel: 'Turnovers per game (fewer is higher)', yUp: false,
      quads: ['Share it and protect it', 'Careful, not creative', 'Pass-happy but sloppy', 'Stagnant and sloppy'], quadsShort: ['Share + protect', 'Careful', 'Sloppy passers', 'Stagnant'],
      pts: ts.map(t => teamPt(byId.get(t.id), t.apg, t.tov, `${f1(t.apg)} assists · ${f1(t.tov)} turnovers`)) });
    add({ id: 'defense', title: 'Defensive pressure', sub: 'Steals and blocks against opponent shooting', xLabel: 'Steals + blocks per game', yLabel: 'Opponent FG% (lower is higher)', yUp: false, yFmt: v => v.toFixed(0) + '%',
      quads: ['Disruptive and stingy', 'Stingy without gambling', 'Gambling and getting burned', 'Leaky'], quadsShort: ['Disruptive', 'Stingy', 'Gambling', 'Leaky'],
      pts: ts.map(t => teamPt(byId.get(t.id), t.spg + t.bpg, t.oppFgp, `${f1(t.spg)} steals · ${f1(t.bpg)} blocks · opponents shoot ${f1(t.oppFgp)}%`)) });
  }
  add({ id: 'homeroad', title: 'Home and away', sub: 'Win % at home against win % on the road', xLabel: 'Home win %', yLabel: 'Road win %', xFmt: v => v.toFixed(0) + '%', yFmt: v => v.toFixed(0) + '%',
    quads: ['Win anywhere', 'Road warriors', 'Home cooking', 'Struggling everywhere'],
    pts: rows.map(r => { const h = rec(r.home), a = rec(r.road); return teamPt(r, winPct(h), winPct(a), `${r.home} home · ${r.road} road`); }).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)) });
  const power = NBA.powerRows();
  if (power) add({ id: 'trend', title: "Who's trending", sub: 'Last 7 days against the season', xLabel: 'Season scoring margin', yLabel: 'Margin over the last 7 days', diag: true, avg: false,
    note: 'Above the diagonal line, a team is playing better this week than its season average. Below it, cooling off.',
    pts: power.filter(t => t.f && t.f.gp && byId.has(t.id)).map(t => teamPt(byId.get(t.id), t.season, t.fm, `Season ${t.season > 0 ? '+' : ''}${f1(t.season)} · last 7 days ${t.fm > 0 ? '+' : ''}${f1(t.fm)} (${t.f.w}-${t.f.l})`)) });
  if (players.length) {
    const byTeam = new Map();
    players.filter(p => p.age && p.min >= 10 && p.gp >= 1).forEach(p => { const a = byTeam.get(p.teamId) || { m: 0, am: 0 }; a.m += p.min; a.am += p.age * p.min; byTeam.set(p.teamId, a); });
    add({ id: 'age', title: 'Youth vs. results', sub: 'Average age, weighted by minutes', xLabel: 'Average age of the rotation', yLabel: 'Win %', yFmt: v => v.toFixed(0) + '%',
      quads: ['Veterans winning now', 'Young and winning', 'Old and struggling', 'Young and growing'],
      pts: rows.filter(r => byTeam.get(r.id)).map(r => { const a = byTeam.get(r.id), age = a.am / a.m; return teamPt(r, age, winPct(r), `${rec2(r)} · average age ${f1(age)}`); }) });
  }
  const futures = NBA.data('futures') || [];
  const champ = futures.find(m => /^Winner$|Champion/i.test(m.name));
  if (champ) add({ id: 'vegas', title: 'Vegas vs. the standings', sub: `${champ.provider} title odds against record`, xLabel: 'Win %', yLabel: 'Chance to win the title (implied)', yLog: true, xFmt: v => v.toFixed(0) + '%', yFmt: v => v + '%', avg: false,
    note: 'The vertical scale is logarithmic so long shots stay readable. Implied chance comes from the American odds and includes the sportsbook margin.',
    pts: champ.entries.filter(e => e.kind === 'team' && byId.has(e.id)).map(e => { const r = byId.get(e.id); return teamPt(r, winPct(r), e.implied * 100, `${rec2(r)} · ${e.odds} to win it all (${f1(e.implied * 100)}%)`); }) });
  // Payroll from ESPN rosters: this season's salaries for players currently on each roster
  const rosters = rows.map(r => [r, NBA.data('roster:' + r.id)]).filter(x => x[1]);
  if (rosters.length >= 25) {
    const pay = rosters.map(([r, ro]) => [r, ro.players.reduce((n, p) => n + (p.salary || 0), 0) / 1e6]).filter(x => x[1] > 0);
    add({ id: 'payroll', title: 'Money vs. wins', sub: 'Team payroll against win %', xLabel: 'Payroll ($ millions)', yLabel: 'Win %', xFmt: v => '$' + Math.round(v) + 'M', yFmt: v => v.toFixed(0) + '%',
      quads: ['Paying and winning', 'Winning on a budget', 'Expensive and losing', 'Cheap and losing'], quadsShort: ['Paid + winning', 'Budget winners', 'Pricey + losing', 'Cheap + losing'],
      note: "Payroll adds up this season's salaries for players on each current roster, from ESPN. Official cap figures also count dead money and cap holds, so they run a little higher.",
      pts: pay.map(([r, v]) => teamPt(r, v, winPct(r), `${rec2(r)} · $${f1(v)}M payroll`)) });
    const salary = new Map(rosters.flatMap(([, ro]) => ro.players).filter(p => p.salary > 0).map(p => [p.id, p.salary / 1e6]));
    const paid = players.filter(p => salary.has(p.id) && p.min >= 22 && p.gp >= 2).sort((a, b) => b.min - a.min).slice(0, 60);
    add({ id: 'value', face: true, title: 'Best value contracts', sub: 'Salary against scoring · 60 heaviest-minute players', xLabel: 'Salary this season ($ millions)', yLabel: 'Points per game', xFmt: v => '$' + Math.round(v) + 'M',
      quads: ['Paid and producing', 'Bargains', 'Not earning it yet', 'Role players'],
      pts: paid.map(p => playerPt(p, salary.get(p.id), p.pts, `$${f1(salary.get(p.id))}M · ${f1(p.pts)} pts, ${f1(p.reb)} reb, ${f1(p.ast)} ast`)) });
    const rookies = NBA.rookies();
    if (rookies) add({ id: 'rookies', face: true, title: 'Rookie watch', sub: 'Every first-year player who has played', xLabel: 'Minutes per game', yLabel: 'Points per game',
      note: 'Rookies come from ESPN rosters (zero years of NBA experience). The ones up and to the right are earning real roles.',
      pts: rookies.map(p => playerPt(p, p.min, p.pts, `${f1(p.min)} min · ${f1(p.pts)} pts, ${f1(p.reb)} reb, ${f1(p.ast)} ast`)) });
  }
  if (players.length) {
    const scorers = players.filter(p => p.gp >= 2 && p.min >= 20).sort((a, b) => b.pts - a.pts).slice(0, 40);
    add({ id: 'scoring', face: true, title: 'Volume vs. efficiency', sub: 'Top 40 scorers', xLabel: 'Points per game', yLabel: 'True shooting %', yFmt: v => v.toFixed(0) + '%',
      quads: ['Volume and efficiency', 'Efficient finishers', 'High volume, lower efficiency', 'Struggling scorers'], quadsShort: ['Elite scorers', 'Efficient', 'Volume', 'Struggling'],
      note: 'True shooting counts threes and free throws, so it is the fairest single measure of scoring efficiency.',
      pts: scorers.map(p => playerPt(p, p.pts, p.ts, `${f1(p.pts)} pts on ${f1(p.ts)}% true shooting`)) });
    const mvp = futures.find(m => /MVP/i.test(m.name));
    if (mvp) add({ id: 'mvp', face: true, title: 'The MVP race', sub: `${mvp.provider} MVP odds against scoring`, xLabel: 'Points per game', yLabel: 'Chance to win MVP (implied)', yLog: true, yFmt: v => v + '%', avg: false,
      note: 'Logarithmic vertical scale. Only candidates with stats this season are shown.',
      pts: mvp.entries.map(e => [e, NBA.playerById(e.id)]).filter(x => x[1]).map(([e, p]) => playerPt(p, p.pts, e.implied * 100, `${e.odds} (${f1(e.implied * 100)}%) · ${f1(p.pts)} pts, ${f1(p.reb)} reb, ${f1(p.ast)} ast`)) });
    const heavy = players.filter(p => p.gp >= 2 && p.min >= 24).sort((a, b) => b.min - a.min).slice(0, 45);
    add({ id: 'glass', face: true, title: 'Boards and dimes', sub: 'Rebounds against assists · 45 heaviest-minute players', xLabel: 'Rebounds per game', yLabel: 'Assists per game',
      quads: ['Do-it-alls', 'Playmakers', 'Glass cleaners', 'Scorers and specialists'], quadsShort: ['Do-it-alls', 'Playmakers', 'Glass', 'Specialists'],
      pts: heavy.map(p => playerPt(p, p.reb, p.ast, `${f1(p.reb)} reb · ${f1(p.ast)} ast · ${f1(p.pts)} pts`)) });
    add({ id: 'agepts', face: true, title: 'Young stars and old guards', sub: 'Age against scoring · top 50 scorers', xLabel: 'Age', yLabel: 'Points per game',
      quads: ['Ageless', 'Young stars', 'Veteran role players', 'Still developing'],
      pts: players.filter(p => p.age && p.gp >= 2 && p.min >= 20).sort((a, b) => b.pts - a.pts).slice(0, 50).map(p => playerPt(p, p.age, p.pts, `Age ${p.age} · ${f1(p.pts)} pts`)) });
  }
  return out;
}
const chartCard = (s, chrome = 230) => `<article class="card chart-card"><div class="card-h"><h3>${esc(s.title)}</h3><div class="end"><span class="eyebrow">${esc(s.sub)}</span></div></div>
  <div class="scatter-wrap" data-chart="${s.id}" data-chrome="${chrome}"></div>
  <p class="note chart-note">${esc(s.note ? s.note + ' ' : '')}Hover or tap a logo for details; click it to open ${s.face ? 'the player' : 'the team'}.</p></article>`;
function loadChartData() {
  ['teamstats', 'players', 'futures'].forEach(k => NBA.use(k));
  NBA.loadRosters();
  for (let i = 0; i < 7; i++) NBA.use(i ? 'day:' + NBA.paramOf(NBA.shiftIso(NBA.today, -i)) : 'day:');
}
NBA.chartDeck = () => {
  loadChartData();
  const specs = chartSpecs();
  specs.forEach(s => SPECS.set(s.id, s));
  if (!specs.length) return '<p class="loading">Loading charts…</p>';
  return `<div class="sec-h"><h3>Swipe the charts</h3><span class="sub">${specs.length} charts · swipe, use the arrows, or press ← →</span></div>
    ${deckHtml('deck-charts', specs.map(s => chartCard(s)), { label: 'Charts', cls: 'deck-charts' })}`;
};
// Draw each chart once its card has a real size, and again only when its data or the screen size changes
function drawCharts(root) {
  root.querySelectorAll('[data-chart]').forEach(w => {
    const s = SPECS.get(w.dataset.chart);
    if (!s || !w.clientWidth) return;
    const sig = s.pts.map(p => `${p.id}:${(+p.x).toFixed(2)}:${(+p.y).toFixed(2)}:${p.on ? 1 : 0}`).join() + `|${w.clientWidth}|${innerHeight}|${NBA.isDark()}`;
    if (w._sig !== sig) { w._sig = sig; drawChart(w, s); }
  });
}

/* ---------- the card deck ---------- */
function deckHtml(id, cards, { label = 'Cards', cls = '' } = {}) {
  const n = cards.length;
  return `<div class="deck ${cls}" role="region" aria-roledescription="carousel" aria-label="${esc(label)}">
    <div class="deck-track" id="${id}" tabindex="0" aria-label="${esc(label)}: swipe or use the arrow keys">${cards.map((c, i) => `<div class="deck-slide" role="group" aria-roledescription="card" aria-label="${i + 1} of ${n}">${c}</div>`).join('')}<div class="deck-end" aria-hidden="true"></div></div>
    <div class="deck-bar"><button class="ib" data-act="deckgo" data-deck="${id}" data-dir="-1" aria-label="Previous card">${UI.I.left}</button>
      <div class="deck-prog" aria-hidden="true"><i></i></div><span class="deck-count"><b>1</b> / ${n}</span>
      <button class="ib" data-act="deckgo" data-deck="${id}" data-dir="1" aria-label="Next card">${UI.I.right}</button></div></div>`;
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
function deckState(track) {
  const slides = [...track.querySelectorAll('.deck-slide')];
  if (!slides.length) return;
  const w = slides[0].offsetWidth || 1, pos = track.scrollLeft / w;
  const i = Math.max(0, Math.min(slides.length - 1, Math.round(pos)));
  st.deckIdx[track.id] = i;
  const deck = track.parentElement;
  deck.querySelector('.deck-count b').textContent = i + 1;
  deck.querySelector('.deck-prog i').style.width = ((i + 1) / slides.length * 100).toFixed(1) + '%';
  if (reduceMotion.matches) return;
  // Deck of cards: the next few cards wait stacked behind the current one, and the card you swipe away tilts off
  slides.forEach((s, k) => {
    const p = k - pos;
    if (p < -1.3 || p > 3.5) { s.style.transform = ''; s.style.opacity = p > 0 ? '0' : ''; s.style.zIndex = ''; return; }
    if (p <= 0) { s.style.transform = `rotate(${(p * 6).toFixed(2)}deg) scale(${(1 + p * .06).toFixed(3)})`; s.style.opacity = (1 + p * .55).toFixed(2); s.style.zIndex = '300'; }
    else {
      const d = Math.min(p, 3);
      s.style.transform = `translateX(${(-p * w + d * 14).toFixed(1)}px) scale(${(1 - d * .04).toFixed(3)})`;
      s.style.opacity = String(Math.max(0, Math.min(1, 3.4 - p)));
      s.style.zIndex = String(200 - Math.round(p * 10));
    }
  });
}
function bindDecks(root) {
  root.querySelectorAll('.deck-track').forEach(t => {
    if (!t._bound) {
      t._bound = true;
      // Re-renders replace the deck, so put it back on the card you were looking at
      const i = st.deckIdx[t.id] || 0, first = t.querySelector('.deck-slide');
      if (i && first) t.scrollLeft = i * first.offsetWidth;
      t.addEventListener('scroll', () => deckState(t), { passive: true });
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        NBA.actions.deckgo({ dataset: { deck: t.id, dir: e.key === 'ArrowRight' ? '1' : '-1' } });
      });
    }
    deckState(t);
  });
}
NBA.actions.deckgo = a => {
  const t = document.getElementById(a.dataset.deck), slides = t ? t.querySelectorAll('.deck-slide') : [];
  if (!slides.length) return;
  const w = slides[0].offsetWidth, i = Math.max(0, Math.min(slides.length - 1, Math.round(t.scrollLeft / w) + (+a.dataset.dir)));
  t.scrollTo({ left: i * w, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
};
window.addEventListener('resize', () => { document.querySelectorAll('.deck-track').forEach(deckState); drawCharts(document); });
NBA.after.facts = view => { bindDecks(view); drawCharts(view); };

/* ================= Home ================= */
const TOP_SNAP = 'nba.top25.v1';
// Rank changes since the last day you opened the site
function topMovement(ids) {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(TOP_SNAP) || 'null'); } catch (e) { s = null; }
  if (!s || s.day !== NBA.today) s = { day: NBA.today, ids, prev: s ? { day: s.day, ids: s.ids } : null };
  else s.ids = ids;
  try { localStorage.setItem(TOP_SNAP, JSON.stringify(s)); } catch (e) { /* storage blocked: no movement arrows */ }
  return s.prev;
}
function gameTile(g) {
  const hide = NBA.S.spoilers && g.state !== 'pre';
  const sc = t => g.state === 'pre' || hide ? '' : `<b class="hg-sc">${esc(t.score)}</b>`;
  const won = t => g.state === 'post' && !hide && t.winner ? ' won' : '';
  const status = g.state === 'in' ? `<span class="hg-live"><i class="dot blink"></i>${esc(hide ? 'Live' : g.detail)}</span>` : g.state === 'post' ? `<span>${esc(hide ? 'Final' : g.detail)}</span>` : `<span>${esc(UI.tipTime(g))}</span>`;
  const row = t => `<span class="hg-row${won(t)}">${UI.logo(t, 28)}<span class="hg-ab">${esc(t.abbr)}</span><small>${esc(t.record || '')}</small>${sc(t)}</span>`;
  return `<button class="hg${g.state === 'in' ? ' live' : ''}${UI.isMine(g) ? ' mine' : ''}" data-act="game" data-id="${g.id}"><span class="hg-st">${status}</span>${row(g.away)}${row(g.home)}</button>`;
}
V.home = () => {
  const day = NBA.use('day:'), confs = NBA.use('standings'), news = NBA.use('news:');
  ['players', 'teamstats', 'futures'].forEach(k => NBA.use(k));
  const myId = NBA.S.myTeam, t = NBA.T(myId), sch = NBA.use('tsched:' + myId), sm = NBA.standingsMap(), mine = sm.get(myId);
  const now = new Date(), hr = now.getHours();
  const greet = hr < 5 ? 'Late-night hoops' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const games = day ? NBA.sortGames(day.games) : [];
  const live = games.filter(g => g.state === 'in');
  const nextTip = games.filter(g => g.state === 'pre' && new Date(g.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const until = d => { const m = Math.max(1, Math.round((new Date(d) - now) / 60000)); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; };
  const myNext = sch && sch.events.find(e => e.state === 'pre');
  const myLive = live.find(g => g.away.id === myId || g.home.id === myId);
  const chips = [
    day ? `<span class="hchip"><b>${games.length}</b> game${games.length === 1 ? '' : 's'} on ${esc(NBA.fmtDay(day.day, { weekday: 'long' }))}</span>` : '',
    live.length ? `<span class="hchip live"><i class="dot blink"></i><b>${live.length}</b> live now</span>` : '',
    nextTip ? `<span class="hchip">Next tip in <b>${until(nextTip.date)}</b></span>` : '',
    myLive ? `<button class="hchip mine" data-act="game" data-id="${myLive.id}">${UI.logo(t, 18)}${esc(t.name)} are live</button>`
      : myNext ? `<a class="hchip mine" href="#myteam">${UI.logo(t, 18)}${esc(t.name)} ${myNext.home ? 'vs' : '@'} ${esc(myNext.oppAbbr || '')} · ${esc(NBA.fmtDate(myNext.date, { weekday: 'short' }))} ${esc(NBA.fmtTime(myNext.date))}</a>` : '',
  ].filter(Boolean).join('');
  const hero = `<section class="home-hero" style="--tc:${esc(t.color || '#444')}">
    <div class="hh-txt"><div class="eyebrow">${esc(NBA.fmtDay(NBA.today, { weekday: 'long', month: 'long', day: 'numeric' }))} · ${esc(NBA.SEASON_LABEL)} season</div>
      <h2>${greet}</h2><div class="hchips">${chips}</div></div>
    ${t.logo ? `<img class="hh-logo" src="${esc(NBA.lg(t))}" alt="">` : ''}</section>`;

  const strip = !day ? '<p class="loading">Loading games…</p>' : games.length
    ? `<div class="hg-strip">${games.map(gameTile).join('')}</div>` : '<p class="empty">No games today.</p>';
  const gamesSec = `<section class="sec"><div class="sec-h"><h2>${live.length ? 'Live and today' : 'Today'}</h2><span class="sub">Tap a game for the box score</span><div class="end"><a class="chip" href="#schedule">Full schedule</a></div></div>${strip}</section>`;

  // Fun fact deck, dealt in a new order each day
  const fg = NBA.factGroups();
  const facts = fg ? dailyOrder(fg.league.concat(fg.people, fg.week), 'facts') : [];
  const factCard = `<div class="card hm hm-facts"><div class="card-h"><h3>Did you know?</h3><div class="end"><a class="chip" href="#facts">All fun facts</a></div></div>
    <div class="card-b">${facts.length ? deckHtml('deck-home-facts', facts, { label: 'Fun facts', cls: 'deck-facts' }) : '<p class="loading">Dealing the cards…</p>'}</div></div>`;

  // Your team
  let teamCard = '';
  if (t.abbr) {
    const last = sch && sch.events.filter(e => e.state === 'post').slice(-1)[0];
    const leaders = NBA.leaders ? NBA.leaders({ stat: 'pts', teamId: myId, limit: 3 }) : [];
    teamCard = `<div class="card hm hm-team" style="--tc:${esc(t.color || '#444')}"><div class="hm-team-top">${UI.logo(t, 56)}<div><div class="eyebrow">Your team</div><h3>${esc(t.full)}</h3>
      <div class="mut">${mine ? [`${mine.w}-${mine.l}`, mine.seed ? `${NBA.ord(mine.seed)} in the ${esc(mine.conf)}` : esc(mine.conf), esc(mine.strk || '')].filter(Boolean).join(' · ') : esc((sch && sch.record) || '')}</div></div></div>
      <div class="hm-team-games">${last ? `<button class="hm-g" data-act="game" data-id="${last.id}"><span class="eyebrow">Last game</span><b>${NBA.S.spoilers ? 'Final' : `<span class="${last.won ? 'w' : 'lo'}">${last.won ? 'W' : 'L'}</span> ${esc(last.my)}-${esc(last.their)}`}</b><small>${last.home ? 'vs' : '@'} ${esc(last.oppAbbr || '')} · ${esc(NBA.fmtDate(last.date, { month: 'short', day: 'numeric' }))}</small></button>` : ''}
        ${myNext ? `<button class="hm-g" data-act="game" data-id="${myNext.id}"><span class="eyebrow">Next game</span><b>${myNext.home ? 'vs' : '@'} ${esc(myNext.oppAbbr || '')}</b><small>${esc(NBA.fmtDate(myNext.date, { weekday: 'short', month: 'short', day: 'numeric' }))} · ${esc(NBA.fmtTime(myNext.date))}</small></button>` : ''}</div>
      ${leaders.length ? `<ul class="hm-lead3">${leaders.map(p => `<li data-act="player" data-id="${p.id}">${UI.hs(p.headshot)}<span><b>${esc(p.name)}</b><small>${f1(p.pts)} pts · ${f1(p.reb)} reb · ${f1(p.ast)} ast</small></span></li>`).join('')}</ul>` : ''}
      <a class="chip" href="#myteam">Team page</a></div>`;
  }

  // Top 25 players
  const top = NBA.topPlayers(25);
  const prev = top.length ? topMovement(top.map(x => x.p.id)) : null;
  const move = (id, i) => {
    if (!prev) return '';
    const j = prev.ids.indexOf(id);
    if (j < 0) return '<span class="mv new">New</span>';
    return j > i ? `<span class="mv up">▲${j - i}</span>` : j < i ? `<span class="mv dn">▼${i - j}</span>` : '<span class="mv">–</span>';
  };
  const topCard = `<div class="card hm hm-top"><div class="card-h"><h3>Top 25 players</h3><div class="end"><span class="eyebrow">Game Score per game</span></div></div>
    ${top.length ? `<ol class="top25">${top.map((x, i) => `<li data-act="player" data-id="${x.p.id}"><span class="rk">${i + 1}</span>${UI.hs(x.p.headshot)}<span class="nm"><b>${esc(x.p.name)}</b><small>${esc(x.p.team)} · ${f1(x.p.pts)} / ${f1(x.p.reb)} / ${f1(x.p.ast)}</small></span>${move(x.p.id, i)}<span class="v">${f1(x.v)}</span></li>`).join('')}</ol>
      <p class="note" style="padding:0 var(--pad) var(--pad)">Game Score rolls a player's whole box score into one number per game. Regulars only (20+ minutes, most of their team's games).${prev ? ` Arrows show moves since ${esc(NBA.fmtDay(prev.day, { month: 'short', day: 'numeric' }))}.` : ' Come back tomorrow to see who moved.'}</p>`
      : '<p class="loading" style="padding:var(--pad)">Loading player stats…</p>'}</div>`;

  // Standings: all 30 teams, East and West side by side
  const standRow = r => `<li class="${r.id === myId ? 'me' : ''}${r.seed === 6 ? ' cut' : ''}${r.seed === 10 ? ' cut2' : ''}" data-act="team" data-id="${r.id}"><span class="sd">${r.seed || ''}</span>${UI.logo(NBA.T(r.id).logo ? NBA.T(r.id) : r, 20)}<span class="ab">${esc(r.abbr)}</span><span class="wl">${r.w}-${r.l}</span><span class="${/^W/.test(r.strk) ? 'w' : 'lo'} sk">${esc(r.strk || '')}</span></li>`;
  const standCard = `<div class="card hm hm-stand"><div class="card-h"><h3>Standings</h3><div class="end"><a class="chip" href="#standings">Full table</a></div></div>
    ${confs ? `<div class="hs-cols">${confs.map(c => `<div><div class="eyebrow">${esc(c.name || c.abbr)}</div><ol class="hs-list">${c.rows.slice().sort((a, b) => (a.seed || 99) - (b.seed || 99)).map(standRow).join('')}</ol></div>`).join('')}</div>
      <p class="note" style="padding:0 var(--pad) var(--pad)">Top 6 make the playoffs; 7–10 play in.</p>` : '<p class="loading" style="padding:var(--pad)">Loading standings…</p>'}</div>`;

  // Chart of the day, from the charts that don't need all 30 rosters
  const specs = chartSpecs().filter(s => !['payroll', 'value', 'rookies'].includes(s.id));
  specs.forEach(s => SPECS.set(s.id, s));
  const cod = specs.length ? specs[hashStr('chart' + NBA.today) % specs.length] : null;
  const chartDay = cod ? `<div class="hm hm-chart">${chartCard(cod, 260).replace('<div class="end">', '<div class="end"><span class="tag-day">Chart of the day</span>')}<a class="chip hm-more" href="#facts">Swipe all the charts</a></div>` : '';

  // League leaders
  const LEAD = [['pts', 'Points'], ['reb', 'Rebounds'], ['ast', 'Assists'], ['tpm', 'Threes'], ['stl', 'Steals'], ['blk', 'Blocks']];
  const leadCard = NBA.data('players') ? `<div class="card hm hm-leaders"><div class="card-h"><h3>League leaders</h3><div class="end"><a class="chip" href="#stats">All stats</a></div></div>
    <div class="hl-grid">${LEAD.map(([k, l]) => { const list = NBA.leaders({ stat: k, mode: 'game', limit: 3 }); const p = list[0]; if (!p) return ''; return `<div class="hl-cell" data-act="player" data-id="${p.id}">${UI.hs(p.headshot)}<div><div class="eyebrow">${l}</div><b>${esc(NBA.statFmt(k, NBA.statValue(k, p, 'game'), 'game'))}</b><small>${esc(p.name)}</small><small class="mut">${list.slice(1).map(x => esc(x.name.split(' ').slice(-1)[0]) + ' ' + esc(NBA.statFmt(k, NBA.statValue(k, x, 'game'), 'game'))).join(' · ')}</small></div></div>`; }).join('')}</div></div>` : '';

  // News
  const stories = (news || []).filter(a => a.links && a.links.web).slice(0, 5);
  const newsCard = `<div class="card hm hm-news"><div class="card-h"><h3>Latest news</h3><div class="end"><a class="chip" href="#news">More</a></div></div>
    ${stories.length ? `<ul class="hn-list">${stories.map(a => { const img = a.images && a.images[0] && a.images[0].url; return `<li><a href="${esc(a.links.web.href)}" target="_blank" rel="noopener">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}<span><b>${esc(a.headline)}</b><small>${esc(NBA.relTime(a.published))}</small></span></a></li>`; }).join('')}</ul>` : '<p class="loading" style="padding:var(--pad)">Loading news…</p>'}</div>`;

  // Today's games to play
  const menu = NBA.gamesMenu ? NBA.gamesMenu() : [];
  const playCard = menu.length ? `<div class="card hm hm-play"><div class="card-h"><h3>Play today</h3><div class="end"><a class="chip" href="#games">All games</a></div></div>
    <div class="hp-list">${menu.slice(0, 4).map(g => `<a class="hp" href="#games/${g.id}"><span class="gm-ico sm">${g.ico}</span><span><b>${esc(g.name)}${g.daily ? ' <em>Daily</em>' : ''}</b><small>${esc(g.status)}</small></span></a>`).join('')}</div></div>` : '';

  return `${hero}${gamesSec}<section class="sec"><div class="home-grid">${standCard}${factCard}${teamCard}${topCard}${chartDay}${leadCard}${playCard}${newsCard}</div></section>`;
};
NBA.after.home = view => { bindDecks(view); drawCharts(view); };
})();
