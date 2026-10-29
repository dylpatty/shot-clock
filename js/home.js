/* Home tab, the swipeable chart deck on Fun Facts, and the card-deck component they share.
   Every chart and card is recalculated from live ESPN data each time the page renders. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui, st = UI.st;
const { esc } = NBA;
const V = NBA.views;
st.deckIdx = st.deckIdx || {};
st.deckKey = st.deckKey || {};

const mean = a => a.reduce((n, v) => n + v, 0) / (a.length || 1);
const rec = s => { const m = /^(\d+)-(\d+)/.exec(s || ''); return m ? { w: +m[1], l: +m[2] } : null; };
const winPct = r => r && r.w + r.l ? r.w / (r.w + r.l) * 100 : NaN;
const hashStr = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const teamRows = () => (NBA.data('standings') || []).flatMap(c => c.rows);

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
// Steps are 1, 2 or 5 times a power of ten only: a 2.5 step would put ticks at x.5, which the whole-number labels can't show
const niceStep = (span, n) => { const raw = span / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
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
  // On narrow charts the left and right corner labels sit on separate lines so they can't run into each other
  const dy = narrow ? 15 : 0;
  if (q) guides += `<text class="quad" x="${W - m.r - 6}" y="${m.t + 16 + dy}" text-anchor="end">${esc(q[0])}</text><text class="quad" x="${m.l + 6}" y="${m.t + 16}">${esc(q[1])}</text>
    <text class="quad" x="${W - m.r - 6}" y="${H - m.b - 8 - dy}" text-anchor="end">${esc(q[2])}</text><text class="quad" x="${m.l + 6}" y="${H - m.b - 8}">${esc(q[3])}</text>`;
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
    tip.hidden = false;
    // Clamp by the tip's real width so long lines aren't cut off at the card edges
    const r = wrap.getBoundingClientRect(), b = g.getBoundingClientRect(), half = tip.offsetWidth / 2 + 4;
    tip.style.left = Math.max(half, Math.min(r.width - half, b.left + b.width / 2 - r.left)) + 'px';
    tip.style.top = (b.top - r.top) + 'px';
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
    add({ id: 'threes', title: 'Three-point identity', sub: 'Team volume against accuracy', xLabel: 'Threes attempted per game', yLabel: '3-point %', yFmt: v => v.toFixed(0) + '%',
      quads: ['Bombs away, on target', 'Picky but accurate', 'Shooting a lot, missing a lot', 'Rarely and poorly'], quadsShort: ['Volume + accuracy', 'Picky', 'Chuckers', 'Rarely'],
      pts: ts.map(t => teamPt(byId.get(t.id), t.tpa, t.tpp, `${f1(t.tpm)} of ${f1(t.tpa)} a game · ${f1(t.tpp)}%`)) });
    add({ id: 'possessions', title: 'The possession battle', sub: 'Offensive rebounds against turnovers', xLabel: 'Offensive rebounds per game', yLabel: 'Turnovers per game (fewer is higher)', yUp: false,
      quads: ['Extra shots, few giveaways', 'Careful, but one shot only', 'Crash hard, cough it up', 'Losing the possession game'], quadsShort: ['Winning it', 'Careful', 'Crash + cough', 'Losing it'],
      note: 'Offensive boards add possessions and turnovers throw them away. Up and to the right gets the most shots.',
      pts: ts.map(t => teamPt(byId.get(t.id), t.orpg, t.tov, `${f1(t.orpg)} offensive boards · ${f1(t.tov)} turnovers`)) });
    add({ id: 'luck', title: 'Three-point luck', sub: 'Own 3-point % against opponents\' 3-point %', xLabel: '3-point % made', yLabel: 'Opponents\' 3-point % (lower is higher)', yUp: false, xFmt: v => v.toFixed(0) + '%', yFmt: v => v.toFixed(0) + '%',
      quads: ['Hot and lucky', 'Cold, but opponents colder', 'Hot, but opponents hotter', 'Cold and unlucky'], quadsShort: ['Hot + lucky', 'Opponents cold', 'Opponents hot', 'Cold + unlucky'],
      note: 'Opponent three-point shooting swings a lot from game to game, so teams far up or down here often drift back.',
      pts: ts.map(t => teamPt(byId.get(t.id), t.tpp, t.opp3p, `${f1(t.tpp)}% from three · opponents ${f1(t.opp3p)}%`)) });
  }
  add({ id: 'homeroad', title: 'Home and away', sub: 'Win % at home against win % on the road', xLabel: 'Home win %', yLabel: 'Road win %', xFmt: v => v.toFixed(0) + '%', yFmt: v => v.toFixed(0) + '%',
    quads: ['Win anywhere', 'Road warriors', 'Home cooking', 'Struggling everywhere'],
    pts: rows.map(r => { const h = rec(r.home), a = rec(r.road); return teamPt(r, winPct(h), winPct(a), `${r.home} home · ${r.road} road`); }).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)) });
  if (players.length) {
    const byTeam = new Map();
    players.filter(p => p.age && p.min >= 10 && p.gp >= 1).forEach(p => { const a = byTeam.get(p.teamId) || { m: 0, am: 0 }; a.m += p.min; a.am += p.age * p.min; byTeam.set(p.teamId, a); });
    add({ id: 'age', title: 'Youth vs. results', sub: 'Average age, weighted by minutes', xLabel: 'Average age of the rotation', yLabel: 'Win %', yFmt: v => v.toFixed(0) + '%',
      quads: ['Veterans winning now', 'Young and winning', 'Old and struggling', 'Young and growing'],
      pts: rows.filter(r => byTeam.get(r.id)).map(r => { const a = byTeam.get(r.id), age = a.am / a.m; return teamPt(r, age, winPct(r), `${rec2(r)} · average age ${f1(age)}`); }) });
  }
  const power = NBA.powerRows();
  if (power) add({ id: 'trend', title: "Who's trending", sub: 'Last 7 days against the season', xLabel: 'Season scoring margin', yLabel: 'Margin over the last 7 days', diag: true, avg: false,
    note: 'Above the diagonal line, a team is playing better this week than its season average. Below it, cooling off.',
    pts: power.filter(t => t.f && t.f.gp && byId.has(t.id)).map(t => teamPt(byId.get(t.id), t.season, t.fm, `Season ${t.season > 0 ? '+' : ''}${f1(t.season)} · last 7 days ${t.fm > 0 ? '+' : ''}${f1(t.fm)} (${t.f.w}-${t.f.l})`)) });
  const futures = NBA.data('futures') || [];
  const champ = futures.find(m => /^Winner$|Champion/i.test(m.name));
  if (champ) add({ id: 'vegas', title: 'Vegas vs. the standings', sub: `${champ.provider} title odds against record`, xLabel: 'Win %', yLabel: 'Chance to win the title (implied)', yLog: true, xFmt: v => v.toFixed(0) + '%', yFmt: v => v + '%', avg: false,
    note: 'The vertical scale is logarithmic so long shots stay readable. Implied chance comes from the American odds and includes the sportsbook margin.',
    pts: champ.entries.filter(e => e.kind === 'team' && byId.has(e.id)).map(e => { const r = byId.get(e.id); return teamPt(r, winPct(r), e.implied * 100, `${rec2(r)} · ${e.odds} to win it all (${f1(e.implied * 100)}%)`); }) });
  // ESPN rosters add salary, height and experience
  const rosters = rows.map(r => [r, NBA.data('roster:' + r.id)]).filter(x => x[1]);
  if (rosters.length >= 25) {
    const bio = new Map(rosters.flatMap(([, ro]) => ro.players).map(p => [p.id, p]));
    const pay = rosters.map(([r, ro]) => [r, ro.players.reduce((n, p) => n + (p.salary || 0), 0) / 1e6]).filter(x => x[1] > 0);
    add({ id: 'payroll', title: 'Money vs. wins', sub: 'Team payroll against win %', xLabel: 'Payroll ($ millions)', yLabel: 'Win %', xFmt: v => '$' + Math.round(v) + 'M', yFmt: v => v.toFixed(0) + '%',
      quads: ['Paying and winning', 'Winning on a budget', 'Expensive and losing', 'Cheap and losing'], quadsShort: ['Paid + winning', 'Budget winners', 'Pricey + losing', 'Cheap + losing'],
      note: "Payroll adds up this season's salaries for players on each current roster, from ESPN. Official cap figures also count dead money and cap holds, so they run a little higher.",
      pts: pay.map(([r, v]) => teamPt(r, v, winPct(r), `${rec2(r)} · $${f1(v)}M payroll`)) });
    const sal = p => ((bio.get(p.id) || {}).salary || 0) / 1e6;
    const paid = players.filter(p => sal(p) > 0 && p.min >= 22 && p.gp >= 2).sort((a, b) => b.min - a.min).slice(0, 60);
    add({ id: 'value', face: true, title: 'Best value contracts', sub: 'Salary against scoring · 60 heaviest-minute players', xLabel: 'Salary this season ($ millions)', yLabel: 'Points per game', xFmt: v => '$' + Math.round(v) + 'M',
      quads: ['Paid and producing', 'Bargains', 'Not earning it yet', 'Role players'],
      pts: paid.map(p => playerPt(p, sal(p), p.pts, `$${f1(sal(p))}M · ${f1(p.pts)} pts, ${f1(p.reb)} reb, ${f1(p.ast)} ast`)) });
    const rookies = NBA.rookies();
    if (rookies) add({ id: 'rookies', face: true, title: 'Rookie watch', sub: 'Every first-year player who has played', xLabel: 'Minutes per game', yLabel: 'Points per game',
      note: 'Rookies come from ESPN rosters (zero years of NBA experience). The ones up and to the right are earning real roles.',
      pts: rookies.map(p => playerPt(p, p.min, p.pts, `${f1(p.min)} min · ${f1(p.pts)} pts, ${f1(p.reb)} reb, ${f1(p.ast)} ast`)) });
    // Height against what size should buy you: rebounds and blocks
    const ht = p => (bio.get(p.id) || {}).htIn;
    const ftIn = v => { const n = Math.round(v); return `${Math.floor(n / 12)}'${n % 12}"`; };
    const sized = players.filter(p => p.gp >= 2 && p.min >= 20 && ht(p)).sort((a, b) => b.min - a.min).slice(0, 70);
    add({ id: 'height-reb', face: true, title: 'Size vs. rebounding', sub: 'Height against rebounds · 70 heaviest-minute players', xLabel: 'Height', yLabel: 'Rebounds per game', xFmt: ftIn,
      quads: ['Big and owning the glass', 'Undersized rebounders', 'Tall, few boards', 'Guards being guards'], quadsShort: ['Big + boards', 'Undersized', 'Tall, few boards', 'Guards'],
      note: 'Up and to the left are the hustle players: rebounding well above their size.',
      pts: sized.map(p => playerPt(p, ht(p), p.reb, `${ftIn(ht(p))} · ${f1(p.reb)} rebounds a game`)) });
    add({ id: 'height-blk', face: true, title: 'Size vs. rim protection', sub: 'Height against blocks · 70 heaviest-minute players', xLabel: 'Height', yLabel: 'Blocks per game', xFmt: ftIn,
      quads: ['Towers', 'Undersized shot blockers', 'Tall but grounded', 'Perimeter players'], quadsShort: ['Towers', 'Undersized', 'Grounded', 'Perimeter'],
      pts: sized.map(p => playerPt(p, ht(p), p.blk, `${ftIn(ht(p))} · ${f1(p.blk)} blocks a game`)) });
  }
  if (players.length) {
    const passers = players.filter(p => p.gp >= 2 && p.min >= 20 && p.ast >= 3).sort((a, b) => b.ast - a.ast).slice(0, 40);
    add({ id: 'astto', face: true, title: 'Playmaking vs. ball security', sub: 'Assists against turnovers · top 40 passers', xLabel: 'Assists per game', yLabel: 'Turnovers per game (fewer is higher)', yUp: false,
      quads: ['Elite and careful', 'Safe hands', 'High risk, high reward', 'Loose with the ball'], quadsShort: ['Elite', 'Safe hands', 'High risk', 'Loose'],
      note: 'Up and to the right: lots of assists without giving it away. Hover a player for their assist-to-turnover ratio.',
      pts: passers.map(p => playerPt(p, p.ast, p.tov, `${f1(p.ast)} ast · ${f1(p.tov)} tov · ${p.tov ? f1(p.ast / p.tov) : '–'} to 1`)) });
    const volume = players.filter(p => p.gp >= 2 && p.min >= 20).map(p => ({ p, tsa: p.fga + .44 * p.fta })).sort((a, b) => b.tsa - a.tsa).slice(0, 40);
    add({ id: 'shots', face: true, title: 'Shot volume vs. efficiency', sub: 'Shot attempts against true shooting · 40 highest-volume shooters', xLabel: 'Shot attempts per game (free-throw trips count)', yLabel: 'True shooting %', yFmt: v => v.toFixed(0) + '%',
      quads: ['Efficient volume scorers', 'Efficient finishers', 'Volume, lower efficiency', 'Struggling'], quadsShort: ['Elite', 'Efficient', 'Volume', 'Struggling'],
      note: 'True shooting counts threes and free throws, so it is the fairest single measure of scoring efficiency.',
      pts: volume.map(({ p, tsa }) => playerPt(p, tsa, p.ts, `${f1(tsa)} attempts · ${f1(p.ts)}% true shooting · ${f1(p.pts)} pts`)) });
    const snipers = players.filter(p => p.gp >= 2 && p.tpa >= 4).sort((a, b) => b.tpa - a.tpa).slice(0, 40);
    add({ id: 'deep', face: true, title: 'Three-point marksmen', sub: 'Threes attempted against 3-point % · 40 highest-volume shooters', xLabel: 'Threes attempted per game', yLabel: '3-point %', yFmt: v => v.toFixed(0) + '%',
      quads: ['Volume and accuracy', 'Picky snipers', 'Bombing away', 'Cold from deep'], quadsShort: ['Volume + accuracy', 'Snipers', 'Bombing', 'Cold'],
      pts: snipers.map(p => playerPt(p, p.tpa, p.tpp, `${f1(p.tpm)} of ${f1(p.tpa)} a game · ${f1(p.tpp)}%`)) });
    const fouled = players.filter(p => p.gp >= 2 && p.fta >= 3).sort((a, b) => b.fta - a.fta).slice(0, 40);
    add({ id: 'line', face: true, title: 'Living at the line', sub: 'Free throws attempted against free-throw %', xLabel: 'Free throws attempted per game', yLabel: 'Free-throw %', yFmt: v => v.toFixed(0) + '%',
      quads: ['Foul magnets who convert', 'Automatic', 'Foul magnets who miss', 'Leaving points out there'], quadsShort: ['Magnets', 'Automatic', 'Missing', 'Leaving points'],
      pts: fouled.map(p => playerPt(p, p.fta, p.ftp, `${f1(p.ftm)} of ${f1(p.fta)} a game · ${f1(p.ftp)}%`)) });
    const mvp = futures.find(m => /MVP/i.test(m.name));
    if (mvp) add({ id: 'mvp', face: true, title: 'The MVP race', sub: `${mvp.provider} MVP odds against scoring`, xLabel: 'Points per game', yLabel: 'Chance to win MVP (implied)', yLog: true, yFmt: v => v + '%', avg: false,
      note: 'Logarithmic vertical scale. Only candidates with stats this season are shown.',
      pts: mvp.entries.map(e => [e, NBA.playerById(e.id)]).filter(x => x[1]).map(([e, p]) => playerPt(p, p.pts, e.implied * 100, `${e.odds} (${f1(e.implied * 100)}%) · ${f1(p.pts)} pts, ${f1(p.reb)} reb, ${f1(p.ast)} ast`)) });
  }
  return out;
}
// Each chart leads with a big title and a plain "this vs. that" line naming both axes
const axisName = l => String(l).replace(/\s*\([^)]*\)/g, '');
const chartCard = (s, { chrome = 300, tag = '' } = {}) => `<article class="card chart-card"><header class="chart-head">
    ${tag ? `<span class="tag-day">${esc(tag)}</span>` : ''}<h3 class="chart-title">${esc(s.title)}</h3>
    <p class="chart-what">${esc(axisName(s.xLabel))} <span class="vs">vs.</span> ${esc(axisName(s.yLabel))}<small>${esc(s.sub)}</small></p></header>
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
    ${deckHtml('deck-charts', specs.map(s => chartCard(s)), { label: 'Charts', cls: 'deck-charts', keys: specs.map(s => s.id) })}`;
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

/* ---------- the card deck ----------
   A native scroll-snap carousel: the browser's own scrolling moves the cards on the graphics compositor,
   so a swipe tracks your finger at the screen's full refresh rate. With a mouse you can drag it too. */
// `keys` name each card so a re-render can return to the same card even when new ones land before it
function deckHtml(id, cards, { label = 'Cards', cls = '', keys = [] } = {}) {
  const n = cards.length;
  return `<div class="deck ${cls}" role="region" aria-roledescription="carousel" aria-label="${esc(label)}">
    <div class="deck-track" id="${id}" tabindex="0" aria-label="${esc(label)}: swipe, drag or use the arrow keys">${cards.map((c, i) => `<div class="deck-slide"${keys[i] != null ? ` data-key="${esc(keys[i])}"` : ''} role="group" aria-roledescription="card" aria-label="${i + 1} of ${n}">${c}</div>`).join('')}<div class="deck-end" aria-hidden="true"></div></div>
    <div class="deck-bar"><button class="ib" data-act="deckgo" data-deck="${id}" data-dir="-1" aria-label="Previous card">${UI.I.left}</button>
      <div class="deck-prog" aria-hidden="true"><i></i></div><span class="deck-count"><b>1</b> / ${n}</span>
      <button class="ib" data-act="deckgo" data-deck="${id}" data-dir="1" aria-label="Next card">${UI.I.right}</button></div></div>`;
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const slides = t => t.querySelectorAll('.deck-slide');
const slideStep = t => { const s = slides(t); return s.length > 1 ? s[1].offsetLeft - s[0].offsetLeft : (s[0] ? s[0].offsetWidth : 1) || 1; };
function deckState(track) {
  const n = slides(track).length;
  if (!n) return;
  const i = Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / slideStep(track))));
  if (track._i === i) return;
  track._i = i;
  st.deckIdx[track.id] = i;
  st.deckKey[track.id] = slides(track)[i].dataset.key;
  const deck = track.parentElement;
  deck.querySelector('.deck-count b').textContent = i + 1;
  deck.querySelector('.deck-prog i').style.transform = `scaleX(${((i + 1) / n).toFixed(4)})`;
}
function goTo(t, i) {
  const n = slides(t).length;
  i = Math.max(0, Math.min(n - 1, i));
  // Remember where we're heading, so a quick second click or a held arrow key steps on from there
  t._target = i;
  clearTimeout(t._tgtT);
  t._tgtT = setTimeout(() => { t._target = null; }, 700); // in case scrollend never fires (older Safari)
  t.scrollTo({ left: i * slideStep(t), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}
const curIdx = t => t._target != null ? t._target : Math.round(t.scrollLeft / slideStep(t));
// Mouse dragging; touch already scrolls natively
function bindDrag(t) {
  let pid = null, x0 = 0, s0 = 0, moved = 0;
  const settle = () => { clearTimeout(t._settle); t._settle = setTimeout(() => t.classList.remove('dragging'), 450); };
  t.addEventListener('pointerdown', e => {
    t._swallow = false;
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pid = e.pointerId; x0 = e.clientX; s0 = t.scrollLeft; moved = 0; t._target = null;
    // Drag mode waits for the mouse to move, so a plain click still reaches the logo or card under it
    clearTimeout(t._settle);
    t.classList.remove('dragging');
    // The button can come up outside the deck before the pointer is captured
    window.addEventListener('pointerup', end, { once: true });
  });
  t.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    if (!(e.buttons & 1)) { end(e); return; }
    const dx = e.clientX - x0;
    moved = Math.max(moved, Math.abs(dx));
    if (moved <= 4) return;
    if (!t.classList.contains('dragging')) {
      t.classList.add('dragging');
      try { t.setPointerCapture(pid); } catch (err) { /* pointer already gone */ }
      // Drop any text the first few pixels of the drag selected
      const sel = window.getSelection && getSelection();
      if (sel) sel.removeAllRanges();
    }
    t.scrollLeft = s0 - dx;
  });
  const end = e => {
    if (e.pointerId !== pid) return;
    pid = null;
    if (moved <= 4) return; // a plain click: nothing moved, so let it through
    const step = slideStep(t), from = Math.round(s0 / step), d = t.scrollLeft - s0;
    // A short, deliberate drag still moves one card
    goTo(t, Math.abs(d) > 40 ? from + Math.sign(d) : from);
    settle();
    t._swallow = true;
  };
  t.addEventListener('pointerup', end);
  t.addEventListener('pointercancel', end);
  // The click that ends a drag shouldn't open a player or team
  t.addEventListener('click', e => { if (t._swallow) { t._swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
  t.addEventListener('dragstart', e => e.preventDefault());
}
function bindDecks(root) {
  root.querySelectorAll('.deck-track').forEach(t => {
    if (!t._bound) {
      t._bound = true;
      // Re-renders replace the deck, so put it back on the card you were looking at. Find it by key first:
      // cards that load later can land before it and shift its position.
      let i = st.deckIdx[t.id] || 0;
      const k = st.deckKey[t.id];
      if (k != null) { const j = [...slides(t)].findIndex(s => s.dataset.key === k); if (j >= 0) i = j; }
      if (i) t.scrollLeft = i * slideStep(t);
      const tick = () => { if (!t._raf) t._raf = requestAnimationFrame(() => { t._raf = 0; deckState(t); }); };
      t.addEventListener('scroll', tick, { passive: true });
      t.addEventListener('scrollend', () => { t._target = null; deckState(t); });
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        goTo(t, curIdx(t) + (e.key === 'ArrowRight' ? 1 : -1));
      });
      bindDrag(t);
    }
    t._i = null;
    deckState(t);
  });
}
NBA.actions.deckgo = a => {
  const t = document.getElementById(a.dataset.deck);
  if (t) goTo(t, curIdx(t) + (+a.dataset.dir));
};
let chartRz = 0;
window.addEventListener('resize', () => {
  document.querySelectorAll('.deck-track').forEach(t => { t._i = null; deckState(t); });
  // Redrawing every chart is heavy, so wait until the resize settles; the SVGs scale down to fit meanwhile
  clearTimeout(chartRz);
  chartRz = setTimeout(() => drawCharts(document), 150);
});
NBA.after.facts = view => { bindDecks(view); drawCharts(view); };

/* ================= Home ================= */
// The face of each team for the Home banner, as ESPN athlete ids. Teams not listed, or whose pick has
// since left, use whoever on the roster has the best Game Score this season.
const MARQUEE = {
  GS: '3975', BKN: '4278104', ATL: '2490149', CLE: '3992',            // Curry, Porter Jr., McCollum, Harden
  BOS: '4065648', CHA: '4433287', DAL: '5041939', DEN: '3112335',      // Tatum, Miller, Flagg, Jokic
  DET: '4432166', HOU: '3202', IND: '4396993', LAC: '4396907',         // Cunningham, Durant, Haliburton, Garland
  LAL: '3945274', MIA: '3032977', MIL: '4395725', MIN: '4594268',      // Doncic, Antetokounmpo, Herro, Edwards
  NO: '4395628', NY: '3934672', OKC: '4278073', ORL: '4432573',        // Williamson, Brunson, Gilgeous-Alexander, Banchero
  PHI: '3059318', PHX: '3136193', POR: '6606', SA: '5104157',          // Embiid, Booker, Lillard, Wembanyama
  TOR: '6450', WSH: '6583',                                            // Leonard, Davis
};
const headshotUrl = id => `https://a.espncdn.com/i/headshots/nba/players/full/${id}.png`;
NBA.marqueeOf = teamId => marqueeOf(teamId);
function marqueeOf(teamId) {
  const t = NBA.T(teamId), players = NBA.data('players');
  const pick = MARQUEE[t.abbr];
  if (!players) return pick ? { id: pick, headshot: headshotUrl(pick) } : null;
  const mine = players.filter(p => p.teamId === String(teamId));
  const chosen = pick && mine.find(p => p.id === pick);
  if (chosen) return chosen;
  const best = mine.filter(p => p.min >= 20 && p.gp >= 1).sort((a, b) => NBA.gameScore(b) - NBA.gameScore(a))[0]
    || mine.slice().sort((a, b) => b.pts - a.pts)[0];
  return best || null;
}
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
/* The Home headline reacts to your team first, then the calendar, then the clock.
   Results stay out of it while spoiler mode is on. */
const clockSecs = c => { const s = String(c || ''); if (s.includes(':')) { const [m, x] = s.split(':'); return +m * 60 + parseFloat(x); } return parseFloat(s); };
const surname = n => String(n || '').trim().split(' ').slice(-1)[0];
const dayKeyOf = iso => iso === NBA.today ? 'day:' : 'day:' + NBA.paramOf(iso);
function heroMessage({ now, games, live, myId, t, sch, mine, loaded }) {
  const name = t.name || 'your team', hide = NBA.S.spoilers;
  const score = (a, b) => `${a.abbr} ${a.score}, ${b.abbr} ${b.score}`;
  // 1. Your team is on right now
  const g = live.find(x => x.away.id === myId || x.home.id === myId);
  if (g && !hide) {
    const me = g.away.id === myId ? g.away : g.home, them = me === g.away ? g.home : g.away;
    const d = (+me.score) - (+them.score), period = Math.max(g.away.lines.length, g.home.lines.length);
    const clock = clockSecs((/(\d+:\d+(?:\.\d)?|\d+\.\d)/.exec(g.detail) || [])[1]);
    const sub = `${score(g.away, g.home)} · ${g.detail}`;
    if (period >= 4 && clock <= 300 && Math.abs(d) <= 5) return { title: 'Crunch time', sub };
    if (d >= 15) return { title: 'Blowout alert', sub: `The ${name} are up ${d} on the ${them.name}. ${sub}` };
    if (d <= -12) return { title: 'Comeback time', sub: `The ${name} are down ${-d} to the ${them.name}. ${sub}` };
    return { title: 'Game on', sub };
  }
  // 2. Your team's last game, if it finished in the last day
  const last = sch && sch.events.filter(e => e.state === 'post').slice(-1)[0];
  if (last && !hide && now - new Date(last.date) < 22 * 3600000) {
    const m = (+last.my) - (+last.their), opp = NBA.T(last.oppId).name || last.oppAbbr || 'opponent', fin = `${last.my}-${last.their}`;
    if (last.won && m <= 3) {
      // A game-winner: the score that last put us ahead came in the final five seconds.
      // Late free throws that only stretch a lead don't count.
      const sum = NBA.use('summary:' + last.id), plays = (sum && sum.plays) || [];
      const my = sum && sum.home && sum.home.id === myId ? 'home' : 'away', op = my === 'home' ? 'away' : 'home';
      let shot = null, prev = 0;
      plays.forEach(p => {
        if (!p.scoring || p[my] == null) return;
        const lead = (+p[my] || 0) - (+p[op] || 0);
        if (lead > 0 && prev <= 0) shot = p;
        prev = lead;
      });
      if (shot && shot.teamId === myId && shot.period >= 4 && clockSecs(shot.clock) <= 5) return { title: 'Bang!', sub: `${shot.text} with ${shot.clock} left to beat the ${opp} ${fin}.` };
    }
    const day = NBA.use(dayKeyOf(NBA.etDay(last.date))), game = day && day.games.find(x => x.id === last.id);
    const side = game && (game.away.id === myId ? game.away : game.home);
    const top = side && side.leaders.find(l => l.cat === 'points');
    if (top && NBA.num(top.value) >= 40) return { title: `${surname(top.full)} went off`, sub: `${top.full} scored ${top.value} as the ${name} ${last.won ? 'beat' : 'fell to'} the ${opp} ${fin}.` };
    if (last.won && m >= 20) return { title: 'Statement win', sub: `The ${name} beat the ${opp} by ${m}, ${fin}.` };
    if (last.won && m <= 3) return { title: 'Clutch W', sub: `The ${name} held on to beat the ${opp} ${fin}.` };
    if (last.won) return { title: 'W in the books', sub: `The ${name} beat the ${opp} ${fin}.` };
    if (m <= -20) return { title: 'Forget that one', sub: `The ${name} lost to the ${opp} ${fin}. On to the next.` };
    return { title: 'On to the next', sub: `The ${name} fell to the ${opp} ${fin}.` };
  }
  // 3. Your team plays today
  const next = sch && sch.events.find(e => e.state === 'pre');
  if (next && NBA.etDay(next.date) === NBA.today) return { title: 'Game day', sub: `${t.name || ''} ${next.home ? 'vs.' : 'at'} the ${NBA.T(next.oppId).name || next.oppAbbr} · tip-off ${NBA.fmtTime(next.date)}${next.tv ? ' on ' + next.tv : ''}.` };
  // 4. The calendar, only once there are games to count (not while they load, or on a playoff off-day)
  const md = NBA.today.slice(5);
  const cup = games.filter(x => /Cup|In-Season/i.test(x.note || '')).length;
  if (games.length && NBA.seasonType === 3) return { title: 'Playoff hoops', sub: `${games.length} playoff game${games.length === 1 ? '' : 's'} today.` };
  if (cup) return { title: 'NBA Cup night', sub: `${cup} Cup game${cup === 1 ? '' : 's'} on the schedule today.` };
  if (games.length && md === '12-25') return { title: 'Christmas hoops', sub: `${games.length} games on the NBA's biggest regular-season day.` };
  if (games.length && (md === '12-31' || md === '01-01')) return { title: 'New year hoops', sub: `${games.length} games to ring it in.` };
  if (games.length && md === '10-31') return { title: 'Halloween hoops', sub: `${games.length} games tonight. Nothing scarier than a 30-point quarter.` };
  // 5. Streaks
  const sv = mine ? mine.strkV : 0;
  if (mine && /^W/.test(mine.strk) && sv >= 4) return { title: `${sv} straight`, sub: `The ${name} have won ${sv} in a row.` };
  if (mine && /^L/.test(mine.strk) && Math.abs(sv) >= 4) return { title: 'Bounce-back time', sub: `The ${name} have lost ${Math.abs(sv)} straight.` };
  // 6. The clock
  const hr = now.getHours();
  if (live.length >= 6) return { title: 'Full slate', sub: `${live.length} games on right now.` };
  if (hr < 5) return { title: 'Late-night hoops', sub: live.length ? `${live.length} game${live.length > 1 ? 's' : ''} still going.` : '' };
  if (loaded && !games.length) return { title: 'Off night', sub: 'No games today. Catch up on the standings and fun facts below.' };
  return { title: hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening', sub: '' };
}
/* Niche, ESPN-style facts that change as games are played: season "clubs" only a few players belong to,
   and oddities from the most recent night of full box scores */
const rowStats = (keys, stats) => {
  const o = {};
  keys.forEach((k, i) => {
    const v = stats[i];
    if (k.includes('-')) { const [a, b] = String(v || '').split('-'), [ka, kb] = k.split('-'); o[ka] = +a || 0; o[kb] = +b || 0; }
    else o[k] = parseFloat(v) || 0;
  });
  return o;
};
const CLUBS = [
  ['25-10-5 club', p => p.pts >= 25 && p.reb >= 10 && p.ast >= 5, 'averaging at least 25 points, 10 rebounds and 5 assists', p => `${f1(p.pts)}/${f1(p.reb)}/${f1(p.ast)}`],
  ['30 a night', p => p.pts >= 30, 'averaging 30 or more points', p => `${f1(p.pts)} ppg`],
  ['Point forwards', p => p.reb >= 7 && p.ast >= 7, 'averaging 7+ rebounds and 7+ assists', p => `${f1(p.reb)} reb, ${f1(p.ast)} ast`],
  ['Efficient volume', p => p.pts >= 20 && p.ts >= 63, 'scoring 20+ a game on 63%+ true shooting', p => `${f1(p.pts)} on ${f1(p.ts)}%`],
  ['Stocks monsters', p => p.stl >= 1.5 && p.blk >= 1.5, 'averaging 1.5+ steals and 1.5+ blocks', p => `${f1(p.stl)} stl, ${f1(p.blk)} blk`],
  ['Volume snipers', p => p.tpm >= 3.5 && p.tpp >= 40, 'making 3.5+ threes a game at 40% or better', p => `${f1(p.tpm)} a game at ${f1(p.tpp)}%`],
  ['Stretch bigs', p => p.reb >= 9 && p.tpm >= 1.5, 'averaging 9+ rebounds and 1.5+ threes', p => `${f1(p.reb)} reb, ${f1(p.tpm)} 3PM`],
  ['Floor generals', p => p.ast >= 8 && p.tov <= 2.5, 'dishing 8+ assists with 2.5 or fewer turnovers', p => `${f1(p.ast)} ast, ${f1(p.tov)} tov`],
  ['Glass and points', p => p.pts >= 15 && p.reb >= 12, 'averaging 15+ points and 12+ rebounds', p => `${f1(p.pts)}/${f1(p.reb)}`],
  ['Young guns', p => p.age && p.age <= 21 && p.pts >= 15, 'aged 21 or younger and scoring 15+ a game', p => `age ${p.age}, ${f1(p.pts)} ppg`],
  ['Old school', p => p.age >= 35 && p.min >= 25, 'aged 35 or older and playing 25+ minutes', p => `age ${p.age}, ${f1(p.min)} min`],
  ['Automatic', p => p.fta >= 5 && p.ftp >= 90, 'shooting 90%+ on 5+ free throws a game', p => `${f1(p.ftp)}% on ${f1(p.fta)}`],
];
function nicheFacts() {
  const cards = [];
  const card = (eyebrow, big, text, who) => cards.push(`<div class="card fact"><div class="eyebrow">${esc(eyebrow)}</div>${who || ''}<div class="big">${big}</div><p>${text}</p></div>`);
  const face = (id, name, team) => `<div class="who3">${UI.hs((NBA.playerById(id) || {}).headshot || headshotUrl(id))}${esc(name)} <span class="mut" style="font-weight:600">${esc(team || '')}</span></div>`;
  const regs = (NBA.data('players') || []).filter(p => p.gp >= 2 && p.min >= 15);
  CLUBS.forEach(([title, test, desc, line]) => {
    const club = regs.filter(test).sort((a, b) => NBA.gameScore(b) - NBA.gameScore(a));
    if (!club.length || club.length > 6) return;
    card(title, `${club.length}<small>${club.length === 1 ? 'player' : 'players'}</small>`,
      `${club.length === 1 ? 'The only player' : `Only ${club.length} players are`} ${desc}: ${club.slice(0, 4).map(p => `${esc(p.name)} (${esc(line(p))})`).join(', ')}.`, face(club[0].id, club[0].name, club[0].team));
  });
  if (NBA.S.spoilers) return cards;
  // The latest night with finished games
  let slate = NBA.use('day:');
  if (!slate || slate.games.filter(g => g.state === 'post').length < 3) slate = NBA.use('day:' + NBA.paramOf(NBA.shiftIso(NBA.today, -1)));
  const finals = slate ? slate.games.filter(g => g.state === 'post') : [];
  const lines = [];
  finals.forEach(g => {
    const s = NBA.use('summary:' + g.id);
    if (!s) return;
    s.box.forEach(b => b.players.forEach(p => {
      if (p.dnp) return;
      const o = rowStats(b.keys, p.stats), opp = b.teamId === g.away.id ? g.home : g.away;
      lines.push(Object.assign(o, { p, team: NBA.T(b.teamId).abbr, opp: opp.abbr }));
    }));
  });
  if (lines.length < 40) return cards;
  const when = slate.day === NBA.today ? 'today' : NBA.fmtDay(slate.day, { weekday: 'long' });
  const top = (list, k) => list.slice().sort((a, b) => b[k] - a[k])[0];
  const who = o => face(o.p.id, o.p.full, o.team);
  const vs = o => `against ${esc(o.opp)} ${esc(when)}`;
  const eff = lines.filter(o => o.points >= 20 && o.fieldGoalsAttempted).sort((a, b) => b.points / b.fieldGoalsAttempted - a.points / a.fieldGoalsAttempted)[0];
  if (eff) card('Efficiency of the night', `${eff.points}<small>points on ${eff.fieldGoalsAttempted} shots</small>`, `${esc(eff.p.full)} went ${eff.fieldGoalsMade}-for-${eff.fieldGoalsAttempted} from the field ${vs(eff)}.`, who(eff));
  const perfect = lines.filter(o => o.fieldGoalsMade >= 6 && o.fieldGoalsMade === o.fieldGoalsAttempted).sort((a, b) => b.fieldGoalsMade - a.fieldGoalsMade)[0];
  if (perfect) card('Perfect from the field', `${perfect.fieldGoalsMade}-for-${perfect.fieldGoalsMade}`, `${esc(perfect.p.full)} didn't miss a shot ${vs(perfect)}, finishing with ${perfect.points} points.`, who(perfect));
  const pm = top(lines, 'plusMinus');
  if (pm && pm.plusMinus >= 15) card('Plus-minus king', `+${pm.plusMinus}`, `The team outscored its opponent by ${pm.plusMinus} with ${esc(pm.p.full)} on the floor ${vs(pm)}.`, who(pm));
  const threes = top(lines, 'threePointFieldGoalsMade');
  if (threes && threes.threePointFieldGoalsMade >= 5) card('Splash of the night', `${threes.threePointFieldGoalsMade}<small>threes</small>`, `${esc(threes.p.full)} hit ${threes.threePointFieldGoalsMade} of ${threes.threePointFieldGoalsAttempted} from deep ${vs(threes)}.`, who(threes));
  const stocks = lines.map(o => Object.assign(o, { stk: o.steals + o.blocks })).sort((a, b) => b.stk - a.stk)[0];
  if (stocks && stocks.stk >= 5) card('Defensive havoc', `${stocks.stk}<small>steals + blocks</small>`, `${esc(stocks.p.full)} had ${stocks.steals} steals and ${stocks.blocks} blocks ${vs(stocks)}.`, who(stocks));
  const td = lines.filter(o => ['points', 'rebounds', 'assists', 'steals', 'blocks'].filter(k => o[k] >= 10).length >= 3);
  if (td.length) card('Triple-double watch', `${td.length}`, `Triple-double${td.length > 1 ? 's' : ''} ${esc(when)}: ${td.map(o => `${esc(o.p.full)} (${o.points}/${o.rebounds}/${o.assists})`).join(', ')}.`, who(td[0]));
  const clean = lines.filter(o => o.assists >= 8 && o.turnovers === 0).sort((a, b) => b.assists - a.assists)[0];
  if (clean) card('Clean sheet', `${clean.assists}<small>assists, 0 turnovers</small>`, `${esc(clean.p.full)} ran the offense without a single giveaway ${vs(clean)}.`, who(clean));
  const thirty = lines.filter(o => o.points >= 30).sort((a, b) => b.points - a.points);
  if (thirty.length) card('30-point club', `${thirty.length}`, `Players with 30+ ${esc(when)}: ${thirty.slice(0, 5).map(o => `${esc(o.p.full)} (${o.points})`).join(', ')}.`, who(thirty[0]));
  const glass = top(lines, 'rebounds');
  if (glass && glass.rebounds >= 14) card('Glass eater', `${glass.rebounds}<small>rebounds</small>`, `${esc(glass.p.full)} owned the boards ${vs(glass)}${glass.offensiveRebounds >= 5 ? `, ${glass.offensiveRebounds} of them offensive` : ''}.`, who(glass));
  const bench = lines.filter(o => !o.p.starter).sort((a, b) => b.points - a.points)[0];
  if (bench && bench.points >= 18) card('Sixth man of the night', `${bench.points}<small>off the bench</small>`, `${esc(bench.p.full)} came off the bench to score ${bench.points} ${vs(bench)}.`, who(bench));
  const line = lines.filter(o => o.freeThrowsMade >= 8 && o.freeThrowsMade === o.freeThrowsAttempted).sort((a, b) => b.freeThrowsMade - a.freeThrowsMade)[0];
  if (line) card('Money at the line', `${line.freeThrowsMade}-for-${line.freeThrowsMade}`, `${esc(line.p.full)} didn't miss a free throw ${vs(line)}.`, who(line));
  const fouled = lines.filter(o => o.fouls >= 6);
  if (fouled.length) card('Fouled out', `${fouled.length}`, `Fouled out ${esc(when)}: ${fouled.map(o => `${esc(o.p.full)} (${esc(o.team)})`).join(', ')}.`);
  return cards;
}
// Dealt in a fresh order on every visit, and kept in that order while you're here
st.factSeed = st.factSeed || String(Math.random());
const factKey = html => (/class="eyebrow">([^<]*)</.exec(html) || [])[1] || html.slice(0, 60);
const shuffleFacts = list => list.map(h => [hashStr(st.factSeed + factKey(h)), h]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
function gameTile(g) {
  const hide = NBA.S.spoilers && g.state !== 'pre';
  const sc = t => g.state === 'pre' || hide ? '' : `<b class="hg-sc">${esc(t.score)}</b>`;
  const won = t => g.state === 'post' && !hide && t.winner ? ' won' : '';
  const status = g.state === 'in' ? `<span class="hg-live"><i class="dot blink"></i>${esc(hide ? 'Live' : g.detail)}</span>` : g.state === 'post' ? `<span>${esc(hide ? 'Final' : g.detail)}</span>` : `<span>${esc(UI.tipTime(g))}</span>`;
  const row = t => `<span class="hg-row${won(t)}">${UI.logo(t, 28)}<span class="hg-ab">${esc(t.abbr)}</span><small>${esc(t.record || '')}</small>${sc(t)}</span>`;
  return `<button class="hg${g.state === 'in' ? ' live' : ''}${UI.isMine(g) ? ' mine' : ''}" data-act="game" data-id="${g.id}"><span class="hg-st">${status}</span>${row(g.away)}${row(g.home)}</button>`;
}
// Charts that can be the chart of the day, in a fixed order, with the feeds each needs besides standings
// ('week' is the last 7 days of scoreboards)
const DAY_CHARTS = {
  offdef: [], ratings: ['teamstats'], pace: ['teamstats'], threes: ['teamstats'], possessions: ['teamstats'], luck: ['teamstats'], homeroad: [],
  age: ['players'], trend: ['teamstats', 'week'], vegas: ['futures'], astto: ['players'], shots: ['players'], deep: ['players'], line: ['players'], mvp: ['futures', 'players'],
};
// The parts of Home that NBA.after.home paints, each only when its own HTML changes
let homeParts = { hero: '', games: '', rest: '' };
V.home = () => {
  const day = NBA.use('day:'), confs = NBA.use('standings'), news = NBA.use('news:');
  ['players', 'teamstats', 'futures'].forEach(k => NBA.use(k));
  const myId = NBA.S.myTeam, t = NBA.T(myId), sch0 = NBA.use('tsched:' + myId), sm = NBA.standingsMap(), mine = sm.get(myId);
  const now = new Date();
  const games = day ? NBA.sortGames(day.games) : [];
  // The team schedule is cached for 15 minutes, so take today's game state and score from the scoreboard,
  // which refreshes every poll. Otherwise a game that just ended still looks live (or not started) here.
  const dayById = new Map(games.map(g => [g.id, g]));
  const sch = sch0 && Object.assign({}, sch0, { events: sch0.events.map(e => {
    const g = dayById.get(e.id);
    if (!g || g.state === e.state) return e;
    const me = g.away.id === myId ? g.away : g.home, op = me === g.away ? g.home : g.away;
    return Object.assign({}, e, { state: g.state, detail: g.detail, my: me.score, their: op.score, won: g.state === 'post' ? me.winner : e.won });
  }) });
  const live = games.filter(g => g.state === 'in');
  const nextTip = games.filter(g => g.state === 'pre' && new Date(g.date) > now).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const until = d => { const m = Math.max(1, Math.round((new Date(d) - now) / 60000)); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; };
  const myNext = sch && sch.events.find(e => e.state === 'pre');
  const myLive = live.find(g => g.away.id === myId || g.home.id === myId);
  const chips = [
    day ? `<span class="hchip"><b>${games.length}</b> game${games.length === 1 ? '' : 's'} on ${esc(NBA.fmtDay(day.day, { weekday: 'long' }))}</span>` : '',
    live.length ? `<span class="hchip live"><i class="dot blink"></i><b>${live.length}</b> live now</span>` : '',
    nextTip ? `<span class="hchip">Next tip in <b>${until(nextTip.date)}</b></span>` : '',
  ].filter(Boolean).join('');
  // Your team's next game (or live score), front and centre: away team on the left, home on the right
  const side = (team, rec, score) => `<span class="nx-tm">${UI.logo(team, 60)}<b>${esc(team.abbr || '')}</b><small>${esc(rec || '')}</small>${score != null ? `<span class="nx-sc">${esc(score)}</span>` : ''}</span>`;
  const recOf = id => { const r = sm.get(id); return r ? `${r.w}-${r.l}` : ''; };
  const countdown = d => {
    const m = Math.max(1, Math.round((new Date(d) - now) / 60000)), days = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60);
    return days ? `${days} day${days > 1 ? 's' : ''}${h ? `, ${h} hr` : ''}` : h ? `${h} hr ${m % 60} min` : `${m} min`;
  };
  let nextPanel = '';
  if (myLive) {
    const hide = NBA.S.spoilers;
    nextPanel = `<button class="hh-next live" data-act="game" data-id="${myLive.id}"><span class="eyebrow"><i class="dot blink"></i>${esc(t.name)} are live</span>
      <span class="nx-vs">${side(myLive.away, myLive.away.record, hide ? null : myLive.away.score)}<span class="nx-at">${esc(hide ? 'Live' : myLive.detail)}</span>${side(myLive.home, myLive.home.record, hide ? null : myLive.home.score)}</span>
      <span class="nx-when">Tap for the box score</span></button>`;
  } else if (myNext) {
    const opp = NBA.T(myNext.oppId);
    const [L, R] = myNext.home ? [[opp, recOf(myNext.oppId)], [t, recOf(myId)]] : [[t, recOf(myId)], [opp, recOf(myNext.oppId)]];
    nextPanel = `<button class="hh-next" data-act="game" data-id="${myNext.id}"><span class="eyebrow">${esc(t.name)} next game</span>
      <span class="nx-vs">${side(L[0], L[1])}<span class="nx-at">@</span>${side(R[0], R[1])}</span>
      <span class="nx-when"><b>${esc(NBA.fmtDate(myNext.date, { weekday: 'long', month: 'short', day: 'numeric' }))}</b> · ${esc(/TBD/i.test(myNext.detail || '') ? 'Time TBD' : NBA.fmtTime(myNext.date))}${myNext.tv ? ' · ' + esc(myNext.tv) : ''}</span>
      <span class="nx-count">Tip-off in <b>${esc(countdown(myNext.date))}</b></span></button>`;
  }
  const msg = heroMessage({ now, games, live, myId, t, sch, mine, loaded: !!day });
  const star = t.abbr ? marqueeOf(myId) : null;
  const hero = `<section class="home-hero${nextPanel ? ' has-next' : ''}${star ? ' has-star' : ''}" style="--tc:${esc(t.color || '#444')}">
    ${star && star.headshot ? `<img class="hh-star" src="${esc(star.headshot)}" alt="" aria-hidden="true">` : ''}
    <div class="hh-txt"><div class="eyebrow">${esc(NBA.fmtDay(NBA.today, { weekday: 'long', month: 'long', day: 'numeric' }))} · ${esc(NBA.SEASON_LABEL)} season</div>
      <h2>${esc(msg.title)}</h2>${msg.sub ? `<p class="hh-sub">${esc(msg.sub)}</p>` : ''}<div class="hchips">${chips}</div></div>
    ${t.logo ? `<img class="hh-logo" src="${esc(NBA.lg(t))}" alt="">` : ''}${nextPanel}</section>`;

  const strip = !day ? '<p class="loading">Loading games…</p>' : games.length
    ? `<div class="hg-strip">${games.map(gameTile).join('')}</div>` : '<p class="empty">No games today.</p>';
  const gamesSec = `<div class="sec-h"><h2>${live.length ? 'Live and today' : 'Today'}</h2><span class="sub">Tap a game for the box score</span><div class="end"><a class="chip" href="#schedule">Full schedule</a></div></div>${strip}`;

  // Fun fact deck: the Fun Facts cards plus niche season clubs and last night's oddities, shuffled each visit
  const fg = NBA.factGroups();
  const facts = fg ? shuffleFacts(fg.league.concat(fg.people, fg.week, nicheFacts())) : [];
  const factCard = `<div class="card hm hm-facts"><div class="card-h"><h3>Did you know?</h3><div class="end"><a class="chip" href="#facts">All fun facts</a></div></div>
    <div class="card-b">${facts.length ? deckHtml('deck-home-facts', facts, { label: 'Fun facts', cls: 'deck-facts', keys: facts.map(factKey) }) : '<p class="loading">Dealing the cards…</p>'}</div></div>`;

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

  // Chart of the day, from the charts that don't need all 30 rosters. It's picked from a fixed list so it doesn't
  // swap as each feed arrives; only once today's pick has its data (or its feed failed) and still can't be drawn
  // does the next chart in the list stand in.
  const specs = chartSpecs().filter(s => DAY_CHARTS[s.id]);
  specs.forEach(s => SPECS.set(s.id, s));
  const week = Array.from({ length: 7 }, (_, i) => i ? 'day:' + NBA.paramOf(NBA.shiftIso(NBA.today, -i)) : 'day:');
  const settled = k => NBA.data(k) !== undefined || !!NBA.status(k).err;
  const pool = Object.keys(DAY_CHARTS), at = hashStr('chart' + NBA.today) % pool.length, want = pool[at];
  const ready = ['standings', ...DAY_CHARTS[want]].flatMap(k => k === 'week' ? week : [k]).every(settled);
  let cod = specs.find(s => s.id === want) || null;
  for (let i = 1; !cod && ready && i < pool.length; i++) cod = specs.find(s => s.id === pool[(at + i) % pool.length]) || null;
  const chartDay = cod ? `<div class="hm hm-chart">${chartCard(cod, { chrome: 320, tag: 'Chart of the day' })}<a class="chip hm-more" href="#facts">Swipe all the charts</a></div>`
    : ready ? '' : '<div class="hm hm-chart"><p class="loading">Loading chart…</p></div>';

  // League leaders
  const LEAD = [['pts', 'Points'], ['reb', 'Rebounds'], ['ast', 'Assists'], ['tpm', 'Threes'], ['stl', 'Steals'], ['blk', 'Blocks']];
  const leadCard = NBA.data('players') ? `<div class="card hm hm-leaders"><div class="card-h"><h3>League leaders</h3><div class="end"><a class="chip" href="#stats">All stats</a></div></div>
    <div class="hl-grid">${LEAD.map(([k, l]) => { const list = NBA.leaders({ stat: k, mode: 'game', limit: 3 }); const p = list[0]; if (!p) return ''; return `<div class="hl-cell" data-act="player" data-id="${p.id}">${UI.hs(p.headshot)}<div><div class="eyebrow">${l}</div><b>${esc(NBA.statFmt(k, NBA.statValue(k, p, 'game'), 'game'))}</b><small>${esc(p.name)}</small><small class="mut">${list.slice(1).map(x => esc(x.name.split(' ').slice(-1)[0]) + ' ' + esc(NBA.statFmt(k, NBA.statValue(k, x, 'game'), 'game'))).join(' · ')}</small></div></div>`; }).join('')}</div></div>` : '';

  // News
  const stories = (news || []).filter(a => a.links && a.links.web).slice(0, 5);
  // Fresh stories say "In the last hour" rather than "5m ago", so the cards don't repaint every minute
  const ago = iso => Date.now() - new Date(iso) < 3600000 ? 'In the last hour' : NBA.relTime(iso);
  const newsCard = `<div class="card hm hm-news"><div class="card-h"><h3>Latest news</h3><div class="end"><a class="chip" href="#news">More</a></div></div>
    ${stories.length ? `<ul class="hn-list">${stories.map(a => { const img = a.images && a.images[0] && a.images[0].url; return `<li><a href="${esc(a.links.web.href)}" target="_blank" rel="noopener">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}<span><b>${esc(a.headline)}</b><small>${esc(ago(a.published))}</small></span></a></li>`; }).join('')}</ul>` : '<p class="loading" style="padding:var(--pad)">Loading news…</p>'}</div>`;

  // Today's games to play
  const menu = NBA.gamesMenu ? NBA.gamesMenu() : [];
  const playCard = menu.length ? `<div class="card hm hm-play"><div class="card-h"><h3>Play today</h3><div class="end"><a class="chip" href="#games">All games</a></div></div>
    <div class="hp-list">${menu.slice(0, 4).map(g => `<a class="hp" href="#games/${g.id}"><span class="gm-ico sm">${g.ico}</span><span><b>${esc(g.name)}${g.daily ? ' <em>Daily</em>' : ''}</b><small>${esc(g.status)}</small></span></a>`).join('')}</div></div>` : '';

  // The view itself is a fixed frame, so a poll only rebuilds the parts whose text changed: a score or clock tick
  // repaints the hero and games strip, and leaves the fact deck and chart of the day alone
  homeParts = { hero, games: gamesSec, rest: `<div class="home-grid">${standCard}${factCard}${teamCard}${topCard}${chartDay}${leadCard}${playCard}${newsCard}</div>` };
  return '<div id="hm-hero"></div><section class="sec" id="hm-games"></section><section class="sec" id="hm-rest"></section>';
};
NBA.after.home = view => {
  UI.paint(view.querySelector('#hm-hero'), homeParts.hero);
  UI.paint(view.querySelector('#hm-games'), homeParts.games);
  UI.paint(view.querySelector('#hm-rest'), homeParts.rest);
  // On phones the games strip scrolls sideways; keep it on the same games when the scores refresh
  const strip = view.querySelector('.hg-strip');
  if (strip && !strip._bound) {
    strip._bound = true;
    strip.scrollLeft = st.hgX || 0;
    strip.addEventListener('scroll', () => { st.hgX = strip.scrollLeft; }, { passive: true });
  }
  bindDecks(view);
  drawCharts(view);
};
})();
