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
  // Every version is .payroll, which puts it last on a phone's team page
  if (!ro) return `<div class="card w12 payroll">${head}<p class="loading">Loading salaries…</p></div>`;
  const list = ro.players.filter(p => p.salary > 0).sort((a, b) => b.salary - a.salary);
  if (!list.length) return `<div class="card w12 payroll">${head}<p class="empty">ESPN hasn't posted salaries for this roster yet.</p></div>`;
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

/* ---------- right now: today's game, his line in it, the injury report ---------- */
const isPP = g => g.state === 'post' && g.completed === false;
/* What a player is doing today, for his card, the search bar's player card (find.js) and the players followed on Home:
   his team's game today (live, final or still to come) with his line from its box score, the injury report's entry, and
   his last game before today from his game log. A line hidden in spoiler mode isn't fetched at all. every: how old the box
   score may get before it's fetched again (Home asks for 30 s, as it re-renders on every poll; the card takes the 15 s
   cache). log: false leaves the game log alone */
NBA.playerNow = (id, teamId, { every = 0, log = true } = {}) => {
  id = String(id);
  const g = teamId ? NBA.todayGame(teamId) : null;
  const state = !g ? 'off' : g.state === 'in' ? 'live' : isPP(g) ? 'pp' : g.state === 'post' ? 'final' : 'pre';
  const o = { id, g, state, inj: NBA.injuryOf(id), masked: (state === 'live' || state === 'final') && NBA.masked(g.id, g.date), sum: null, line: null, log: null, last: null };
  if ((state === 'live' || state === 'final') && !o.masked) {
    const k = 'summary:' + g.id;
    o.sum = (every && Date.now() - NBA.status(k).t < every ? NBA.data(k) : NBA.use(k)) || null;
    o.line = NBA.boxLine(o.sum, id);
  }
  if (log) { o.log = NBA.use('gamelog:' + id) || null; o.last = (o.log && o.log.find(x => !g || x.id !== g.id)) || null; }
  return o;
};
const statBox = (v, label, cls = '') => v === '' || v == null ? '' : `<span class="${cls}"><b>${esc(v)}</b>${label}</span>`;
// A line as stat boxes, points first; steals, blocks and fouls only when they stand out
UI.statsRow = l => `<div class="fd-stats">${statBox(l.pts, 'PTS', 'pts')}${statBox(l.reb, 'REB')}${statBox(l.ast, 'AST')}${statBox(l.fg, 'FG')}${statBox(l.tp, '3PT')}
  ${l.ft && l.ft !== '0-0' ? statBox(l.ft, 'FT') : ''}${+l.stl ? statBox(l.stl, 'STL') : ''}${+l.blk ? statBox(l.blk, 'BLK') : ''}${statBox(l.min, 'MIN')}${l.pm !== undefined && l.pm !== '' ? statBox(l.pm, '+/-') : ''}${+l.pf >= 4 ? statBox(l.pf, 'FOULS', 'warn') : ''}</div>`;
// "Live · Q3 5:21 · BOS 78-71 PHI", "Final · ..." (the score hidden in spoiler mode) or "Tonight · 7:30 PM · TSN".
// With a game row under it (brief), it leaves out what the row already shows. vs is "@ MIL" for a player's team,
// said only when there's no score naming both teams
UI.gameState = (g, brief, vs = '') => {
  const masked = NBA.masked(g.id, g.date), sc = masked || brief ? '' : ` · ${esc(g.away.abbr)} ${esc(g.away.score)}–${esc(g.home.score)} ${esc(g.home.abbr)}`;
  const at = vs && (!sc || g.state === 'pre') ? ` · ${vs}` : '';
  if (g.state === 'in') return `<span class="fd-k live"><i class="dot blink"></i>Live · ${esc(NBA.detail(g))}${sc}${at}</span>`;
  if (isPP(g)) return `<span class="fd-k">${esc(g.detail || 'Postponed')}${at}</span>`;
  // A hidden final is just "Final": "Final/OT" would give away a close game
  if (g.state === 'post') return `<span class="fd-k">${esc(masked ? 'Final' : g.detail || 'Final')}${sc}${at}</span>`;
  const tv = NBA.caTv(g);
  return `<span class="fd-k">Tonight${brief ? '' : ` · ${esc(UI.tipTime(g))}${tv ? ' · ' + esc(tv.short) : ''}`}${at}</span>`;
};
// "Questionable" with the injury and, when it's still ahead, ESPN's estimated return (see NBA.injuryNow)
UI.injuryPill = i => {
  const n = NBA.injuryNow(i);
  if (!n) return '<span class="pill ok">No injury listed</span>';
  const what = [n.what, n.ret].filter(Boolean).join(' · ');
  return `<span class="pill ${n.cls}">${esc(n.label)}</span>${what ? `<span class="fd-injtx">${esc(what)}</span>` : ''}`;
};
// "Last game · Sat, Nov 7 · @ ATL · L 121-124" and his line, both hidden in spoiler mode until the game is opened (a tap opens it)
const lastLine = e => `${NBA.masked(e.id, e.date) ? 'Result hidden in spoiler mode · tap to open the game'
  : [`<b>${esc(e.pts ?? '–')}</b> PTS`, `${esc(e.reb ?? '–')} REB`, `${esc(e.ast ?? '–')} AST`, e.fg ? `${esc(e.fg)} FG` : '', e.tp ? `${esc(e.tp)} 3PT` : '', e.min ? `${esc(e.min)} MIN` : ''].filter(Boolean).join(' · ')}`;
const lastHead = e => `${esc(NBA.fmtDate(e.date, { weekday: 'short', month: 'short', day: 'numeric' }))} · ${e.home ? 'vs' : '@'} ${esc(e.oppAbbr || '')}${NBA.masked(e.id, e.date) || !e.result ? '' : ` · <span class="${e.result === 'W' ? 'win' : e.result === 'L' ? 'loss' : ''}">${esc(e.result)}</span> ${esc(e.score || '')}`}`;
/* The card's first section: tonight's line live or final (a tap opens the box score), or tip-off and where it streams in
   Canada; the injury report's latest; and his last game before today, which answers "how did he do last night" before
   the Last 5 table further down. It repaints on every poll, so a live line keeps itself fresh */
function nowCard(id, teamId) {
  NBA.use('injuries');
  const n = NBA.playerNow(id, teamId), { g, inj } = n, x = NBA.injuryNow(inj);
  const parts = [];
  if (g) {
    const opp = g.away.id === teamId ? g.home : g.away, vs = `${g.home.id === teamId ? 'vs' : '@'} ${esc(opp.abbr)}`;
    let body = '';
    if (n.state === 'pre' || n.state === 'pp') body = x && x.out ? '<p class="fd-note">Listed out for this one.</p>' : '';
    else if (n.masked) body = '<p class="fd-note">His line is hidden in spoiler mode. Tap to open the game and show it.</p>';
    else if (n.line && n.line.dnp) body = `<p class="fd-note">${n.state === 'live' && !n.line.why ? "Hasn't checked in yet." : `Didn't play: ${esc(n.line.dnp)}`}</p>`;
    else if (n.line) body = UI.statsRow(n.line);
    else body = `<p class="fd-note">${n.sum ? `Not in the box score${n.state === 'live' ? ' yet' : ''}.` : NBA.status('summary:' + g.id).err ? "Couldn't load his line from ESPN. It will try again shortly." : 'Loading his line…'}</p>`;
    // Opened from this very game, the tap goes back to it (same tab, same scroll) instead of opening it afresh
    const back = UI.drawerBack && UI.drawerBack.id === g.id;
    const go = back ? '← Back to the game' : n.state === 'pre' ? 'Preview →' : 'Box score →';
    parts.push(`<div class="pc-g" role="button" tabindex="0" ${back ? 'data-act="drawerback"' : `data-act="game" data-id="${esc(g.id)}"`}>
      <div class="pc-g-top">${UI.gameState(g, false, vs)}<span class="pc-go">${go}</span></div>${body}</div>`);
  }
  if (x) parts.push(`<div class="pc-inj"><div class="fd-status">${UI.injuryPill(inj)}</div>${x.note ? `<p class="fd-note pc-clip">${esc(x.note)}</p>` : ''}</div>`);
  // Once he has played tonight, tonight's line is the answer; before that, his last game is
  const e = n.state === 'live' || n.state === 'final' ? null : n.last;
  if (e) parts.push(`<div class="pc-last" role="button" tabindex="0" data-act="game" data-id="${esc(e.id)}"><span class="fd-k">Last game · ${lastHead(e)}</span><span class="pc-ln">${lastLine(e)}</span></div>`);
  else if (!g && !x && !n.log && !NBA.status('gamelog:' + id).err) parts.push('<p class="fd-note">Loading his last game…</p>');
  if (!parts.length) return '';
  const when = g ? NBA.fmtDay(NBA.today, { weekday: 'short', month: 'short', day: 'numeric' }) : 'No game today';
  return `<div class="card pc-wide pc-now"><div class="card-h"><h3>Right now</h3><div class="end"><span class="eyebrow">${esc(when)}</span></div></div><div class="pc-now-b">${parts.join('')}</div></div>`;
}

/* ---------- following players ---------- */
/* The players followed on Home, newest first: { id, name, teamId, headshot } as of the follow, so a row shows before any
   feed has loaded. They keep their own storage key, since lockSettings resets part of the settings on every load */
const FOLLOW_KEY = 'nba.follow.v1', FOLLOW_MAX = 12;
let follows = [];
try {
  const v = JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]');
  if (Array.isArray(v)) follows = v.filter(x => x && x.id).map(x => ({ id: String(x.id), name: String(x.name || ''), teamId: String(x.teamId || ''), headshot: String(x.headshot || '') }))
    .filter((x, i, a) => a.findIndex(y => y.id === x.id) === i).slice(0, FOLLOW_MAX);
} catch (e) { /* storage blocked or bad JSON: nobody followed */ }
NBA.follows = () => follows.slice();
NBA.isFollowed = id => follows.some(x => x.id === String(id));
// The Follow toggle carries the player with it; star: just the star, for a list row
UI.followBtn = (p, cls = 'chip', star = false) => {
  const on = NBA.isFollowed(p.id);
  return `<button type="button" class="${cls} fol${on ? ' on' : ''}" data-act="follow" data-id="${esc(p.id)}" data-name="${esc(p.name || '')}" data-team="${esc(p.teamId || '')}" data-hs="${esc(p.headshot || '')}" aria-pressed="${on}" aria-label="Follow ${esc(p.name || 'this player')} on Home"${star ? ` title="${on ? 'Following on Home' : 'Follow on Home'}"` : ''}>${on ? '★' : '☆'}${star ? '' : on ? ' Following' : ' Follow'}</button>`;
};
// At the limit, the longest-followed player makes room
NBA.actions.follow = a => {
  const id = String(a.dataset.id || '');
  if (!id) return;
  follows = NBA.isFollowed(id) ? follows.filter(x => x.id !== id)
    : [{ id, name: a.dataset.name || '', teamId: a.dataset.team || '', headshot: a.dataset.hs || '' }, ...follows].slice(0, FOLLOW_MAX);
  try { localStorage.setItem(FOLLOW_KEY, JSON.stringify(follows)); } catch (e) { /* storage blocked: the list lasts for this visit */ }
  // On Home the list above grows or shrinks by a row, which would push the page under the finger (iPhone Safari doesn't
  // hold the scroll still itself), so the button stays where it was tapped
  const onPage = document.getElementById('view').contains(a), y0 = a.getBoundingClientRect().top;
  NBA.render();
  const n = onPage && document.querySelector(`#view .${a.classList[0]}[data-act="follow"][data-id="${CSS.escape(id)}"]`);
  if (n) { const dy = n.getBoundingClientRect().top - y0; if (Math.abs(dy) > 1) window.scrollBy(0, dy); }
};
/* Home's "Players you follow": one row each with his line live or final, tonight's tip-off, the injury report or his last
   game. Live first, then by tip-off, then the rest. Empty until someone is followed */
const FW_ORDER = { live: 0, pre: 1, final: 2, pp: 3, off: 4 };
NBA.followSection = () => {
  if (!follows.length) return '';
  NBA.use('injuries');
  const day = NBA.data('day:');
  const rows = follows.map((f, i) => {
    // This season's stats feed has his current team (a trade since the follow) and headshot
    const s = NBA.playerById(f.id), p = { id: f.id, name: (s && s.name) || f.name || 'Player', teamId: (s && s.teamId) || f.teamId, headshot: (s && s.headshot) || f.headshot };
    const n = NBA.playerNow(p.id, p.teamId, { every: 30000, log: false }), { g, line } = n, x = NBA.injuryNow(n.inj), t = NBA.T(p.teamId);
    const opp = g && (g.away.id === p.teamId ? g.home : g.away), vs = g ? `${g.home.id === p.teamId ? 'vs' : '@'} ${esc(opp.abbr)}` : '';
    const show = g ? ` <button class="link" data-act="reveal" data-id="${esc(g.id)}">Show</button>` : '';
    const injTx = x ? `<span class="${x.cls}">${esc(x.label)}</span>` : '';
    let sub = '', big = '';
    if (n.state === 'live' || n.state === 'final') {
      // A hidden final is just "Final": "Final/OT" would give away a close game
      const head = n.state === 'live' ? `<span class="live">Live</span> · ${esc(n.masked ? vs : NBA.detail(g))}` : esc(n.masked ? 'Final' : g.detail || 'Final');
      const me = opp === g.home ? g.away : g.home, wl = me.winner ? 'W' : opp.winner ? 'L' : '';
      const res = n.state === 'final' && !n.masked ? ` · ${wl ? `<span class="${wl === 'W' ? 'win' : 'loss'}">${wl}</span> ` : ''}${esc(me.score)}-${esc(opp.score)} ${vs}` : '';
      if (n.masked) sub = `${head}${n.state === 'final' ? ` · ${vs}` : ''} · line hidden${show}`;
      else if (line && line.dnp) sub = `${head}${res} · ${n.state === 'live' && !line.why ? "hasn't checked in" : `didn't play: ${esc(line.dnp)}`}`;
      else if (line) { big = `<span class="fw-v"><b>${esc(line.pts)}</b>PTS</span>`; sub = `${head}${res} · ${[`${esc(line.reb)} REB`, `${esc(line.ast)} AST`, line.fg ? `${esc(line.fg)} FG` : ''].filter(Boolean).join(' · ')}`; }
      else sub = `${head} · ${vs} · ${n.sum ? 'not in the box score' : 'loading his line…'}`;
    } else if (n.state === 'pre') {
      const tv = NBA.caTv(g);
      sub = `${injTx ? injTx + ' · ' : ''}Tonight ${vs} · ${esc(UI.tipTime(g))}${tv ? ' · ' + esc(tv.short) : ''}`;
    } else if (n.state === 'pp') sub = `${esc(g.detail || 'Postponed')} ${vs}`;
    else if (!day) sub = 'Loading today’s games…';
    else if (x) sub = [injTx, esc(x.what), esc(x.ret)].filter(Boolean).join(' · ');
    else {
      // No game today: his last one, from his game log (only fetched for these rows)
      const log = NBA.use('gamelog:' + p.id), e = log && log[0];
      sub = e ? `Last: ${NBA.masked(e.id, e.date) ? `${e.home ? 'vs' : '@'} ${esc(e.oppAbbr || '')} · ${esc(NBA.fmtDate(e.date, { month: 'short', day: 'numeric' }))} · line hidden <button class="link" data-act="reveal" data-id="${esc(e.id)}">Show</button>`
        : `${esc(e.pts ?? '–')} PTS · ${esc(e.reb ?? '–')} REB · ${esc(e.ast ?? '–')} AST ${e.home ? 'vs' : '@'} ${esc(e.oppAbbr || '')} · ${esc(NBA.fmtDate(e.date, { month: 'short', day: 'numeric' }))}`}`
        : log ? 'No games yet this season' : 'No game today';
    }
    const html = `<li class="fw${n.state === 'live' ? ' live' : ''}" role="button" tabindex="0" data-act="player" data-id="${esc(p.id)}">${UI.hs(p.headshot)}
      <span class="fw-tx"><b><span class="fw-nm">${esc(p.name)}</span>${t.abbr ? UI.logo(t, 16) : ''}</b><small>${sub}</small></span>${big}</li>`;
    return { html, k: FW_ORDER[n.state] * 1e14 + (n.state === 'pre' ? Date.parse(g.date) || 0 : 0) + i };
  }).sort((a, b) => a.k - b.k);
  return `<div class="sec-h"><h2>Players you follow</h2><span class="sub">Tonight's lines, injuries and last games · tap a player for his card</span></div>
    <ul class="fw-list">${rows.map(r => r.html).join('')}</ul>`;
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

  // The injury report (refreshed every 10 minutes) once it's in; until then the roster's own status
  const inj = NBA.data('injuries') ? NBA.injuryNow(NBA.injuryOf(id)) : null;
  const status = inj ? `<span class="pill ${inj.cls}">${esc(inj.label)}</span>` : !NBA.data('injuries') && r && r.injury ? pill(r.injury) : '<span class="pill ok">Active</span>';
  const hero = `<section class="pc-hero" style="--tc:${esc(t.color || '#444')};--logo:url('${esc(NBA.img(t.logo || '', 384))}')">
    ${headshot ? `<img class="pc-shot" src="${esc(NBA.img(headshot, 528))}" alt="">` : ''}
    <div class="pc-id"><div class="pc-team">${t.abbr ? UI.logo(t, 22) : ''}${esc([t.full, r && r.jersey ? '#' + r.jersey : '', pos].filter(Boolean).join(' · '))}</div>
      <h2>${esc(name)}</h2>
      <div class="pc-tags">${status}${r && r.exp === 0 ? '<span class="pill neutral">Rookie</span>' : ''}${UI.followBtn({ id, name, teamId, headshot }, 'pc-follow')}</div></div>
    ${r && r.salary ? `<div class="pc-pay"><b>${NBA.money(r.salary)}</b><span>a year</span></div>` : ''}
  </section>`;

  // This season, with league rank where the player qualifies for the leaderboard
  let statsHtml;
  // Placeholder stat tiles the size of the real ones (number, label, league rank), so the card doesn't grow under you
  // when the numbers arrive
  if (!stats) statsHtml = `<div class="pc-stats" aria-busy="true">${CARD_STATS.map(() => `<div aria-hidden="true"><b>${UI.skel.bar('62%')}</b><span>${UI.skel.bar('38%')}</span><small>${UI.skel.bar('70%')}</small></div>`).join('')}<span class="sr">Loading stats…</span></div>`;
  else if (!s || !s.gp) statsHtml = `<p class="empty">No games played yet this season.</p>`;
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
  const logHtml = `<div class="card"><div class="card-h"><h3>Last 5 games</h3></div>${!games ? '<p class="loading">Loading games…</p>' : !games.length ? '<p class="empty">No games yet this season.</p>'
    : `<div class="tblwrap" data-sx="pc-log"><table class="tbl pc-log"><thead><tr><th class="l" scope="col">Game</th><th scope="col">MIN</th><th scope="col">PTS</th><th scope="col">REB</th><th scope="col">AST</th><th scope="col">FG</th><th scope="col">3PT</th></tr></thead>
      <tbody>${games.map(g => `<tr class="click" data-act="game" data-id="${esc(g.id)}"><td class="l"><b>${esc(NBA.fmtDate(g.date, { month: 'short', day: 'numeric' }))}</b> ${g.home ? 'vs' : '@'} ${esc(g.oppAbbr || '')} <span class="${m(g) ? '' : g.result === 'W' ? 'win' : g.result === 'L' ? 'loss' : ''}">${m(g) ? '' : esc(g.result)}</span></td>
        <td>${cell(g, g.min)}</td><td><b>${cell(g, g.pts)}</b></td><td>${cell(g, g.reb)}</td><td>${cell(g, g.ast)}</td><td>${cell(g, g.fg)}</td><td>${cell(g, g.tp)}</td></tr>`).join('')}</tbody></table></div>`}</div>`;

  // The card repaints on every poll for the live line, so the wide tables (data-sx) keep their sideways scroll
  return `${bar}<div class="pc dpad">${hero}<div class="pc-grid">${nowCard(id, teamId)}
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
  if (!car) return `<div class="card pc-wide">${head}${NBA.status(`career:${id}.${type}`).err ? '<p class="empty">Couldn\'t load career stats from ESPN. It will try again shortly.</p>' : '<p class="loading">Loading career stats…</p>'}</div>`;
  if (!car.rows.length) return `<div class="card pc-wide">${head}<p class="empty">${type === '3' ? 'No playoff games yet.' : 'No NBA games yet.'}</p></div>`;
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
  return `<div class="card pc-wide">${head}<div class="tblwrap" data-sx="pc-career"><table class="tbl pc-career">
    <thead><tr><th class="l sticky" scope="col">Season</th><th scope="col">Age</th><th class="l" scope="col">Team</th><th class="l" scope="col">Lg</th><th class="l" scope="col">Pos</th>${CAREER_COLS.map(([k]) => `<th scope="col">${k}</th>`).join('')}<th class="l" scope="col">Awards</th></tr></thead>
    <tbody>${car.rows.map(row).join('')}</tbody>
    ${c ? `<tfoot><tr><th class="l sticky" scope="row">${car.seasons} Yr${car.seasons === 1 ? '' : 's'}</th><td></td><td></td><td></td><td></td>${CAREER_COLS.map(([, f]) => `<td>${f(c)}</td>`).join('')}<td></td></tr></tfoot>` : ''}
  </table></div><p class="note" style="padding:10px var(--pad) var(--pad)">Per game, from ESPN, and updated after every game. Awards are the ones ESPN lists as won (MVP, All-NBA, All-Defensive, All-Rookie and the like; Finals MVPs under Playoffs). ESPN doesn't list All-Star picks or voting finishes.</p></div>`;
}
NBA.actions.pctype = a => { st.pcType = a.dataset.v; NBA.render(); };

/* ---------- Players tab ---------- */
/* Every card is in the page once, whatever is typed: the search hides the cards that don't match in place (plFilter), so
   a keystroke builds nothing and the field being typed in is never replaced (on an iPhone that resets predictive text).
   The page's HTML doesn't depend on the search, so a live repaint never rebuilds it either */
let plSince = 0, plTimer = 0, plNote = '', plDone = null;
V.players = () => {
  NBA.use('standings');
  NBA.loadRosters();
  const { idx, loaded, done } = rosterIndex();
  plNote = done ? '' : ` · loading rosters, ${loaded} of ${teamRows().length}`;
  const head = `<div class="sec-h"><h2>Players</h2><span class="sub">Everyone on an NBA roster, A to Z by last name · tap a player for their card</span></div>`;
  const tools = `<div class="pl-tools"><label class="sr" for="plq">Search players</label><input class="field big" id="plq" data-in="plq" type="search" autocomplete="off" spellcheck="false" placeholder="Search players by name or team">
      <span class="mut" id="pl-count" aria-live="polite"></span></div>`;
  // The 30 rosters arrive one by one, and each would rebuild the whole list: it waits for all of them (or 1.5 s, after
  // which the late ones still add their players as they come)
  if (!plSince) plSince = Date.now();
  const wait = !done && Date.now() - plSince < 1500;
  if (wait && !plTimer) plTimer = setTimeout(() => { plTimer = 0; NBA.changed(); }, 1500 - (Date.now() - plSince) + 20);
  if (!idx.size || wait) return `<section class="sec">${head}${tools}<p class="loading">Loading rosters…</p></section>`;
  const list = [...idx.values()].map(p => ({ p, k: norm(p.last || p.name.split(' ').pop()) + ' ' + norm(p.first || p.name) })).sort((a, b) => a.k.localeCompare(b.k));
  const groups = new Map();
  list.forEach(({ p, k }) => { const L = /[a-z]/.test(k[0]) ? k[0].toUpperCase() : '#'; if (!groups.has(L)) groups.set(L, []); groups.get(L).push(p); });
  const az = `<nav class="pl-az" aria-label="Jump to a letter">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(L => groups.has(L) ? `<button data-act="plaz" data-v="${L}">${L}</button>` : `<span>${L}</span>`).join('')}</nav>`;
  // data-q: name | team | team code, what the search matches on
  const card = p => {
    const t = NBA.T(p.teamId);
    return `<button type="button" class="pl-card" data-act="player" data-id="${esc(p.id)}" data-q="${esc(`${norm(p.name)}|${norm(t.full)}|${norm(t.abbr)}`)}">${UI.hs(p.headshot)}<span class="pl-nm"><b>${esc(p.name)}</b>
      <small>${t.logo ? UI.logo(t, 14) : ''}${esc(t.abbr || '')}${p.pos ? ' · ' + esc(p.pos) : ''}${p.jersey ? ' · #' + esc(p.jersey) : ''}</small></span>${p.injury ? '<i class="pl-inj" title="On the injury report"></i>' : ''}</button>`;
  };
  const body = [...groups].map(([L, ps]) => `<section class="pl-group" id="pl-${L}" data-l="${L}"><h3 class="pl-letter">${L}</h3><div class="pl-grid">${ps.map(card).join('')}</div></section>`).join('');
  return `<section class="sec">${head}${tools}${az}${body}<p class="empty" id="pl-none" hidden></p></section>`;
};
// Every typed word has to be in the name or the team's name, or be the team's code ("lebron lakers", "bos")
function plFilter(view) {
  const words = norm(st.plq).trim().split(/\s+/).filter(Boolean);
  let shown = 0;
  view.querySelectorAll('.pl-group').forEach(gr => {
    let any = false;
    gr.querySelectorAll('.pl-card').forEach(c => {
      const q = c._q || (c._q = (c.dataset.q || '').split('|'));
      const ok = words.every(w => q[0].includes(w) || q[1].includes(w) || q[2] === w);
      if (c.hidden === ok) c.hidden = !ok;
      if (ok) { any = true; shown++; }
    });
    if (gr.hidden === any) gr.hidden = !any;
    // A letter with nobody left in it can't be jumped to
    const b = view.querySelector(`.pl-az button[data-v="${gr.dataset.l}"]`);
    if (b && b.disabled === any) b.disabled = !any;
  });
  const count = view.querySelector('#pl-count'), none = view.querySelector('#pl-none');
  const txt = view.querySelector('.pl-group') ? `${shown} player${shown === 1 ? '' : 's'}${plNote}` : '';
  if (count && count.textContent !== txt) count.textContent = txt;
  if (none) { const hide = !words.length || shown > 0 || !view.querySelector('.pl-group'); none.hidden = hide; if (!hide) none.textContent = `No players match “${st.plq.trim()}”.`; }
}
// After a repaint (a roster arriving, a tab revisit) the search goes back on; a poll that changed nothing has nothing to redo
NBA.after.players = (view, changed) => {
  const q = view.querySelector('#plq');
  if (q && q.value !== st.plq) q.value = st.plq;
  if (changed || plDone !== st.plq) { plDone = st.plq; plFilter(view); }
};
NBA.changes.plq = t => { st.plq = plDone = t.value; plFilter(document.getElementById('view')); };
NBA.actions.plaz = a => { const el = document.getElementById('pl-' + a.dataset.v); if (el) el.scrollIntoView({ block: 'start' }); };
})();
