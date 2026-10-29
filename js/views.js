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
    const live = games.filter(g => g.state === 'in'), next = games.filter(g => g.state === 'pre');
    // Order finals by when they actually ended (last play's clock time); estimate from tip-off until that loads
    const endOf = g => {
      const s = NBA.use('summary:' + g.id);
      if (s && s.ended) return new Date(s.ended).getTime();
      return new Date(g.date).getTime() + (140 + 15 * Math.max(0, g.home.lines.length - 4)) * 60000;
    };
    const done = games.filter(g => g.state === 'post').map(g => [g, endOf(g)]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    const group = (label, list) => list.length ? `<div class="sub-h">${label} · ${list.length}</div><div class="games">${list.map(g => UI.gameCard(g, false)).join('')}</div>` : '';
    main = (live.length ? `<div class="sub-h live"><i class="dot blink"></i>Live now · ${live.length}</div><div class="games live-grid">${live.map(g => UI.gameCard(g, true)).join('')}</div>` : '')
      + group('Up next by tip-off', next)
      + group('Final · most recent first', done);
  }
  const head = `<div class="sec-h"><h2>${isToday ? 'Schedule' : 'Games'}</h2>
    <div class="datenav" role="group" aria-label="Choose a day">
      <button class="ib" data-act="date" data-v="-1" aria-label="Previous day">${UI.I.left}</button>
      <span class="datelbl">${esc(label)}</span>
      <button class="ib" data-act="date" data-v="1" aria-label="Next day">${UI.I.right}</button></div>
    ${isToday ? '' : `<button class="chip" data-act="date" data-v="0">Back to today</button>`}
    <span class="end sub">Times in ${esc(NBA.tzLabel())}</span></div>`;
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
const dayCard = (iso, games) => `<div class="card day"><div class="card-h"><h3>${esc(NBA.fmtDay(iso, { weekday: 'long', month: 'short', day: 'numeric' }))}<small>${games.length} game${games.length > 1 ? 's' : ''}</small></h3></div>
  <ol class="lines">${games.map(UI.line).join('')}</ol></div>`;
function upcoming() {
  const days = Array.from({ length: 7 }, (_, i) => NBA.shiftIso(NBA.today, i + 1));
  const cards = days.map(iso => {
    const d = NBA.use('day:' + NBA.paramOf(iso));
    if (!d) return `<div class="card day"><div class="card-h"><h3>${esc(NBA.fmtDay(iso))}</h3></div>${stateOf('day:' + NBA.paramOf(iso), 'games')}</div>`;
    return d.games.length ? dayCard(iso, NBA.sortGames(d.games)) : '';
  }).join('');
  return `<section class="sec"><div class="sec-h"><h2>Upcoming</h2><span class="sub">Next 7 days · times in ${esc(NBA.tzLabel())} · away team on the left, home team on the right</span></div><div class="days">${cards}</div></section>`;
}

/* ================= Rest of the season =================
   Lives in its own element under the Schedule view, so live-score repaints above never redraw it.
   Each month loads from ESPN in one request as you scroll near it. */
st.seasonReq = new Set();
const monthLabel = (ym, opts) => NBA.fmtDay(`${ym.slice(0, 4)}-${ym.slice(4)}-15`, opts || { month: 'long', year: 'numeric' });
const seasonDays = () => { const from = NBA.shiftIso(NBA.today, 8); return (NBA.calendar || []).filter(d => d >= from); };
function seasonSkeleton(days, months) {
  const t = NBA.T(NBA.S.myTeam);
  const range = `${NBA.fmtDay(days[0], { month: 'short', day: 'numeric' })} – ${NBA.fmtDay(days[days.length - 1], { month: 'short', day: 'numeric' })}`;
  return `<div class="sbump" id="season-bump">
      <div class="eyebrow">Past the next 7 days</div>
      <h2>Rest of the season</h2>
      <p class="sub">${esc(range)} · ${days.length} game days · times in ${esc(NBA.tzLabel())}</p>
      <div class="bump-tools">${seg('seasonmine', st.seasonMine ? '1' : '', [['', 'All games'], ['1', `${esc(t.name || 'My team')} only`]], 'Show')}
        <nav class="bump-months" aria-label="Jump to a month">${months.map(ym => `<button class="chip" data-act="seasonjump" data-ym="${ym}">${esc(monthLabel(ym, { month: 'short' }))}</button>`).join('')}</nav></div>
      <span class="bump-arrow" aria-hidden="true">${UI.I.down}</span>
    </div>
    ${months.map(ym => `<section class="smonth" id="sm-${ym}" data-ym="${ym}" aria-label="${esc(monthLabel(ym))}"></section>`).join('')}`;
}
function monthHtml(ym, days) {
  const key = 'month:' + ym;
  const m = st.seasonReq.has(ym) ? NBA.use(key) : NBA.data(key);
  const head = sub => `<div class="sm-h"><h3>${esc(monthLabel(ym))}</h3><span class="sub">${sub}</span></div>`;
  if (!m) return head(NBA.status(key).err ? "Couldn't load from ESPN. It will try again shortly." : 'Loading…') + '<div class="sm-wait"></div>';
  const mine = st.seasonMine ? NBA.S.myTeam : '';
  const prefix = `${ym.slice(0, 4)}-${ym.slice(4)}`;
  let n = 0;
  const cards = days.filter(d => d.startsWith(prefix)).map(iso => {
    let games = m.days[iso] || [];
    if (mine) games = games.filter(g => g.away.id === mine || g.home.id === mine);
    n += games.length;
    return games.length ? dayCard(iso, NBA.sortGames(games)) : '';
  }).join('');
  return head(`${n} game${n === 1 ? '' : 's'}`) + (cards ? `<div class="days">${cards}</div>` : '<p class="empty">No games this month.</p>');
}
// Load a month once it comes within about a screen of view
function loadNearMonths() {
  document.querySelectorAll('#season .smonth').forEach(s => {
    if (!st.seasonReq.has(s.dataset.ym) && s.getBoundingClientRect().top < innerHeight + 900) requestMonth(s.dataset.ym);
  });
}
window.addEventListener('scroll', loadNearMonths, { passive: true });
function requestMonth(ym) {
  if (st.seasonReq.has(ym)) return NBA.need('month:' + ym);
  st.seasonReq.add(ym);
  const p = NBA.need('month:' + ym);
  p.then(paintSeason, paintSeason);
  return p;
}
function paintSeason() {
  const el = document.getElementById('season');
  if (!el || UI.route().tab !== 'schedule') return;
  const days = seasonDays();
  if (!days.length) { UI.paint(el, ''); return; }
  const months = [...new Set(days.map(d => d.slice(0, 4) + d.slice(5, 7)))];
  const top = document.getElementById('top');
  if (top) document.documentElement.style.setProperty('--top-h', top.offsetHeight + 'px');
  UI.paint(el, seasonSkeleton(days, months));
  months.forEach(ym => UI.paint(document.getElementById('sm-' + ym), monthHtml(ym, days)));
  loadNearMonths();
}
NBA.after.schedule = () => paintSeason();
NBA.actions.seasonmine = a => {
  st.seasonMine = !!a.dataset.v;
  paintSeason();
  const b = document.getElementById('season-bump');
  if (b && b.getBoundingClientRect().top < 0) b.scrollIntoView({ block: 'start' });
};
// Jumping ahead loads every month up to the target first, so the page doesn't shift under the scroll
NBA.actions.seasonjump = a => {
  const ym = a.dataset.ym;
  const before = [...document.querySelectorAll('#season .smonth')].map(s => s.dataset.ym).filter(x => x <= ym);
  Promise.allSettled(before.map(requestMonth)).then(() => {
    paintSeason();
    const s = document.getElementById('sm-' + ym);
    if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};
NBA.actions.jumpto = a => { const el = document.getElementById(a.dataset.to); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

/* The speed bump: as a rest-of-season divider comes up, mouse-wheel scrolling slows to a third and settles on it.
   On phones and trackpads, CSS scroll snapping does the same job (html:has(.sbump) in the stylesheet). */
window.addEventListener('wheel', e => {
  if (e.deltaY <= 0 || e.ctrlKey || e.defaultPrevented) return;
  const b = document.querySelector('#view .sbump, #season .sbump');
  if (!b || (e.target.closest && e.target.closest('.drawer, .tblwrap, .ask-panel, #ask-panel'))) return;
  const top = document.getElementById('top');
  const y = b.getBoundingClientRect().top - (top ? top.offsetHeight : 0);
  if (y > 16 && y < innerHeight * .6) {
    e.preventDefault();
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    window.scrollBy(0, Math.max(1, Math.min(px * .3, y - 10)));
  }
}, { passive: false });
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
    // On phones the two conferences sit side by side in a swipe track; it opens on your team's conference
    if (st.confIdx == null) st.confIdx = Math.max(0, confs.findIndex(c => c.rows.some(r => r.id === NBA.S.myTeam)));
    body = `<div class="conf-tabs" role="tablist" aria-label="Conference">${confs.map((c, i) => `<button role="tab" data-act="confgo" data-i="${i}" aria-selected="${i === st.confIdx}">${esc(conferenceName(c.abbr))}</button>`).join('')}</div>
      <div class="st-pair" id="st-pair">${confs.map(c => table(c.name, c.rows)).join('')}</div>
      <div class="legend"><span><i class="l1"></i>Top 6 make the playoffs</span><span><i class="l2"></i>7–10 go to the play-in</span>${fav.size ? '<span>Your highlighted teams are shaded</span>' : ''}<span class="ph-only">Swipe sideways to switch conferences</span><span>Click a team for its page</span></div>`;
  }
  return `<section class="sec">${head}${body}</section>`;
};
NBA.actions.standmode = a => { st.standMode = a.dataset.v; NBA.changed(); };
const confSlides = track => [...track.children];
const markConf = (view, i) => view.querySelectorAll('.conf-tabs [role=tab]').forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
NBA.actions.confgo = a => {
  const track = document.getElementById('st-pair'), i = +a.dataset.i;
  if (!track) return;
  st.confIdx = i;
  markConf(document, i);
  const s = confSlides(track);
  track.scrollTo({ left: s[i].offsetLeft - s[0].offsetLeft, behavior: 'smooth' });
};
NBA.after.standings = (view, changed) => {
  const track = view.querySelector('#st-pair');
  if (!track) return;
  const s = confSlides(track);
  // Re-renders replace the track, so put it back on the conference being viewed
  if (changed && s[st.confIdx] && track.scrollWidth > track.clientWidth + 4) track.scrollLeft = s[st.confIdx].offsetLeft - s[0].offsetLeft;
  if (track._bound) return;
  track._bound = true;
  track.addEventListener('scroll', () => {
    const x = track.scrollLeft;
    let best = 0;
    s.forEach((el, k) => { if (Math.abs(el.offsetLeft - s[0].offsetLeft - x) < Math.abs(s[best].offsetLeft - s[0].offsetLeft - x)) best = k; });
    if (best !== st.confIdx) { st.confIdx = best; markConf(view, best); }
  }, { passive: true });
};
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
  let minis = pmCard(NBA.use('pmlead'), mode) + MINI[mode].map(k => miniCard(k, mode)).join('');
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
    <p class="note">Plus-minus covers rotation players (20+ minutes a game with enough games played) and refreshes every few hours.</p>`;
};
function pmCard(rows, mode) {
  const head = `<div class="card-h"><h3>Plus-minus</h3><div class="end">${mode === 'total' ? 'Season total' : 'Per game'}</div></div>`;
  if (!rows) return `<div class="card mini">${head}<p class="note" style="padding:var(--pad)">${NBA.status('pmlead').err ? "Couldn't load plus-minus from ESPN." : 'Adding up plus-minus for rotation players…'}</p></div>`;
  const val = r => mode === 'total' ? r.total : r.total / Math.max(1, r.gp);
  const list = rows.slice().sort((a, b) => val(b) - val(a)).slice(0, 5);
  return `<div class="card mini">${head}<ol class="rank">${list.map((r, i) => {
    const p = NBA.playerById(r.id) || {};
    const v = val(r);
    return `<li data-act="player" data-id="${r.id}" style="cursor:pointer"><span class="rk">${i + 1}</span><span class="nm">${esc(p.name || '')}<small>${esc(p.team || '')}</small></span><span class="v">${v > 0 ? '+' : ''}${mode === 'total' ? Math.round(v) : NBA.fix(v)}</span></li>`;
  }).join('')}</ol></div>`;
}
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
  // When ESPN's feed has no Rookie of the Year market, show the rookie race by the numbers instead
  const rookieRace = () => {
    if (roy) return '';
    NBA.loadRosters();
    const list = NBA.rookies();
    const h = `<div class="card-h"><h3>Rookie of the Year race</h3><div class="end"><span class="eyebrow">No odds posted</span></div></div>`;
    if (!list) return `<div class="card">${h}<p class="loading" style="padding:var(--pad)">Finding this year's rookies…</p></div>`;
    const top = list.filter(p => p.gp >= 2).map(p => ({ p, v: NBA.gameScore(p) })).sort((a, b) => b.v - a.v).slice(0, 8);
    return `<div class="card">${h}<p class="note" style="padding:12px var(--pad) 0">DraftKings isn't offering Rookie of the Year odds through ESPN right now, so this ranks rookies by Game Score per game. Real odds show here as soon as they're posted.</p>
      <ol class="rank">${top.map((x, i) => `<li data-act="player" data-id="${x.p.id}" style="cursor:pointer"><span class="rk">${i + 1}</span><span class="nm">${esc(x.p.name)}<small>${esc(x.p.team)} · ${NBA.fix(x.p.pts)} pts, ${NBA.fix(x.p.reb)} reb, ${NBA.fix(x.p.ast)} ast</small></span><span class="v">${NBA.fix(x.v)}</span></li>`).join('')}</ol></div>`;
  };
  return `<section class="sec">${head}<div class="odds-grid">
      ${card(champ, 'NBA Championship', { cls: 'w8', cols: 2, limit: 30 })}
      ${gameLines(days)}
      ${awards.map(([m, t], i) => card(m, t, { cls: i === 0 ? 'w6' : '', limit: i === 0 ? 15 : 8, athletes: true })).join('')}
      ${rookieRace()}
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
  const coachMarket = /Coach/i.test(m.name || '');
  return `<ol class="olist" style="--cols:${cols}">${list.map((e, i) => {
    let img, name, sub = '', isFav = false;
    if (e.kind === 'team') {
      const t = NBA.T(e.id); isFav = fav.has(e.id);
      img = UI.logo(t, 30); name = t.full || t.name || 'Team ' + e.id;
    } else {
      const a = NBA.athleteInfo(e.id) || {};
      const t = a.teamId ? NBA.T(a.teamId) : null; isFav = !!(t && fav.has(t.id));
      // Coaches get their team's logo rather than a photo
      img = (a.coach || coachMarket) ? (t ? UI.logo(t, 30) : '<span></span>')
        : a.headshot ? `<img class="hs" src="${esc(a.headshot)}" alt="" loading="lazy">` : (t ? UI.logo(t, 30) : '<span></span>');
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
  const mv = txt => txt ? `<br><small class="mut">${esc(txt)}</small>` : '';
  const body = withOdds.length ? `<div class="tblwrap"><table class="tbl lines-tbl"><thead><tr><th class="l" scope="col">Game</th><th scope="col">Line</th><th scope="col">O/U</th><th scope="col">Moneyline</th></tr></thead>
    <tbody>${withOdds.map(g => {
      const o = g.odds;
      const mlMove = [UI.moved(o.mlAway, g.away.abbr + ' '), UI.moved(o.mlHome, g.home.abbr + ' ')].filter(Boolean).join(', ');
      return `<tr class="click" data-act="game" data-id="${g.id}"><td class="l"><b>${esc(g.away.abbr)} @ ${esc(g.home.abbr)}</b><br><span class="mut">${esc(NBA.fmtDate(g.date, { weekday: 'short' }))} ${esc(NBA.fmtTime(g.date))}</span></td>
      <td>${esc(o.details)}${mv(UI.moved(o.spreadHome, g.home.abbr + ' '))}</td><td>${esc(o.ou)}${mv(UI.moved(o.total))}</td>
      <td>${esc(g.away.abbr)} ${esc(o.awayML)}<br>${esc(g.home.abbr)} ${esc(o.homeML)}${mv(mlMove)}</td></tr>`;
    }).join('')}</tbody></table></div>`
    : `<p class="empty">${games.length ? 'DraftKings posts game lines on game day. None are up yet for the next games.' : 'No upcoming games today or tomorrow.'}</p>`;
  return `<div class="card"><div class="card-h"><h3>Game lines</h3><div class="end"><span class="eyebrow">DraftKings · today & tomorrow</span></div></div><div class="card-b" style="padding-block:6px">${body}
    ${withOdds.length ? '<p class="note" style="padding-top:8px">"Opened" shows where a line started when DraftKings has moved it since. ESPN only carries DraftKings, so other sportsbooks aren\'t listed.</p>' : ''}</div></div>`;
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
function glistItem(e, tags = '') {
  const op = NBA.T(e.oppId);
  let rs;
  if (e.state === 'post') rs = NBA.S.spoilers ? '<span class="mut">Final</span>' : `<span class="${e.won ? 'W' : 'L'}">${e.won ? 'W' : 'L'}</span> ${esc(e.my)}–${esc(e.their)}`;
  else if (e.state === 'in') rs = `<span class="st-live"><i class="dot blink"></i>Live</span>`;
  else rs = `<span class="mut">${esc(/TBD/i.test(e.detail || '') ? 'TBD' : NBA.fmtTime(e.date))}</span>`;
  return `<li data-act="game" data-id="${e.id}" role="button" tabindex="0"><span class="dt">${esc(NBA.fmtDate(e.date, { weekday: 'short', month: 'numeric', day: 'numeric' }))}</span>
    <span class="ha">${e.home ? 'vs' : '@'}</span>${UI.logo(op.abbr ? op : { logo: '' }, 26)}<span class="op">${esc(op.name || e.oppName || e.oppAbbr || '')}${tags}</span><span class="rs">${rs}</span></li>`;
}
/* A team's whole remaining schedule, month by month, behind the same speed-bump divider as the Schedule tab */
function teamSeason(t, evs) {
  const all = evs.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const left = all.filter(e => e.state === 'pre');
  if (!left.length) return '';
  // Second night of a back-to-back: the team also played the day before
  const days = new Set(all.map(e => NBA.etDay(e.date)));
  const b2b = e => days.has(NBA.shiftIso(NBA.etDay(e.date), -1));
  const tags = e => (b2b(e) ? '<span class="tag b2b" title="Second night of a back-to-back">B2B</span>' : '') + (e.tv ? `<span class="tag">${esc(e.tv)}</span>` : '');
  const months = [];
  left.forEach(e => { const ym = NBA.etDay(e.date).slice(0, 7).replace('-', ''); const m = months[months.length - 1]; if (m && m[0] === ym) m[1].push(e); else months.push([ym, [e]]); });
  const home = left.filter(e => e.home).length, backs = left.filter(b2b).length, tv = left.filter(e => e.tv).length;
  return `<div class="sbump">
      <div class="eyebrow">${esc(t.full)}</div>
      <h2>Rest of the season</h2>
      <p class="sub">${left.length} games left · ${home} home, ${left.length - home} away · ${backs} back-to-backs · ${tv} on national TV</p>
      <nav class="bump-months" aria-label="Jump to a month">${months.map(([ym]) => `<button class="chip" data-act="jumpto" data-to="tm-${ym}">${esc(monthLabel(ym, { month: 'short' }))}</button>`).join('')}</nav>
      <span class="bump-arrow" aria-hidden="true">${UI.I.down}</span>
    </div>
    <div class="season-months">${months.map(([ym, list]) => `<div class="card sm-card" id="tm-${ym}"><div class="card-h"><h3>${esc(monthLabel(ym))}</h3><div class="end"><span class="eyebrow">${list.length} game${list.length > 1 ? 's' : ''} · ${list.filter(e => e.home).length} home</span></div></div>
      <ul class="glist">${list.map(e => glistItem(e, tags(e))).join('')}</ul></div>`).join('')}</div>`;
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
  </div>
  ${sch ? `<section class="sec team-season">${teamSeason(t, evs)}</section>` : ''}`;
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
    }).join('')}</div></div>`).join('')}</div></section>${teamsOverview()}`;
};

/* League-wide team comparison: ratings per 100 possessions, recent form, and team stat leaders */
st.prSort = { k: 'net', desc: true };
function teamsOverview() {
  const head = `<div class="sec-h"><h2>Power rankings</h2><span class="sub">All 30 teams by net rating · click a column to sort, a team to open it</span></div>`;
  const rows = NBA.powerRows(NBA.use);
  if (!rows) return `<section class="sec">${head}${stateOf('teamstats', 'team stats')}</section>`;
  const fav = new Set(NBA.S.favorites);
  const s = st.prSort, v = x => (x == null || !Number.isFinite(x) ? -1e9 : x);
  const sorted = rows.slice().sort((a, b) => (s.desc ? 1 : -1) * (v(b[s.k]) - v(a[s.k])));
  const rk = (t, k) => `<small class="mut" style="margin-left:5px">${NBA.ord(t.rank[k])}</small>`;
  const trendCell = t => {
    if (NBA.S.spoilers || t.trend == null) return '<span class="mut">–</span>';
    if (t.trend > 3) return `<span class="w">▲ +${NBA.fix(t.trend)}</span>`;
    if (t.trend < -3) return `<span class="lo">▼ ${NBA.fix(t.trend)}</span>`;
    return `<span class="mut">Steady</span>`;
  };
  const th = (k, l) => `<th scope="col"><button class="sortb${s.k === k ? ' on' : ''}" data-act="prsort" data-k="${k}">${l}${s.k === k ? (s.desc ? ' ↓' : ' ↑') : ''}</button></th>`;
  const table = `<div class="card"><div class="card-b"><div class="tblwrap"><table class="tbl spread">
    <thead><tr><th class="n" scope="col">#</th><th class="tm sticky" scope="col">Team</th><th scope="col">W-L</th>${th('net', 'Net rtg')}${th('ortg', 'Off rtg')}${th('drtg', 'Def rtg')}${th('pace', 'Pace')}${th('fm', 'Last 7 days')}${th('trend', 'Trend')}<th scope="col">Strk</th></tr></thead>
    <tbody>${sorted.map((t, i) => `<tr class="click${fav.has(t.id) ? ' fav' : ''}" data-act="team" data-id="${t.id}"><td class="n">${i + 1}</td>
      <td class="tm sticky"><span>${UI.logo(NBA.T(t.id), 22)}${esc(NBA.T(t.id).name || t.name)}</span></td><td>${t.w ?? '–'}-${t.l ?? '–'}</td>
      <td><b>${t.net > 0 ? '+' : ''}${NBA.fix(t.net)}</b>${rk(t, 'net')}</td><td>${NBA.fix(t.ortg)}${rk(t, 'ortg')}</td><td>${NBA.fix(t.drtg)}${rk(t, 'drtg')}</td><td>${NBA.fix(t.pace)}${rk(t, 'pace')}</td>
      <td>${NBA.S.spoilers || !t.f ? '–' : `${t.f.w}-${t.f.l} <small class="mut">${t.fm > 0 ? '+' : ''}${NBA.fix(t.fm)}</small>`}</td><td>${trendCell(t)}</td>
      <td class="${/^W/.test(t.strk || '') ? 'w' : /^L/.test(t.strk || '') ? 'lo' : ''}">${esc(t.strk || '')}</td></tr>`).join('')}</tbody></table></div></div></div>
    <p class="note">Offensive and defensive ratings are points scored and allowed per 100 possessions, so fast and slow teams compare fairly. Net rating is the difference. Pace is possessions per game. Trend compares the last 7 days' scoring margin with the season margin.</p>`;

  const formRows = rows.filter(t => t.f && t.f.gp >= 2);
  const formList = (list, kind) => list.length ? `<ol class="rank">${list.map((t, i) => `<li data-act="team" data-id="${t.id}" style="cursor:pointer"><span class="rk">${i + 1}</span>
      <span class="nm" style="display:flex;align-items:center;gap:8px">${UI.logo(NBA.T(t.id), 22)}${esc(NBA.T(t.id).name)}<small>${t.f.w}-${t.f.l} last 7 days${t.strk ? ' · ' + esc(t.strk) : ''}</small></span>
      <span class="v ${kind === 'hot' ? 'w' : 'lo'}">${kind === 'hot' ? (t.fm > 0 ? '+' : '') + NBA.fix(t.fm) : '▼ ' + NBA.fix(t.trend)}</span></li>`).join('')}</ol>` : '<p class="empty" style="padding:var(--pad)">Not enough games in the last week yet.</p>';
  const hot = formRows.filter(t => t.f.w > t.f.l).sort((a, b) => b.fm - a.fm).slice(0, 6);
  const slipping = formRows.filter(t => t.trend < 0 && (t.f.l > t.f.w || /^L/.test(t.strk || ''))).sort((a, b) => a.trend - b.trend).slice(0, 6);
  const formCards = NBA.S.spoilers ? `<div class="card"><div class="card-b"><p class="empty">Hot and slipping teams are hidden while spoiler mode is on.</p></div></div>`
    : `<div class="card mini"><div class="card-h"><h3>Hot right now</h3><div class="end">Margin a game, last 7 days</div></div>${formList(hot, 'hot')}</div>
       <div class="card mini"><div class="card-h"><h3>Slipping</h3><div class="end">Last 7 days vs. season margin</div></div>${formList(slipping, 'slip')}</div>`;

  const BOARDS = [['ortg', 'Best offense', 'Off rtg'], ['drtg', 'Best defense', 'Def rtg', true], ['net', 'Net rating', 'Net'], ['pace', 'Fastest pace', 'Poss.'],
    ['ppg', 'Most points', 'PPG'], ['oppg', 'Fewest allowed', 'Opp PPG', true], ['tpp', '3-point %', '3P%'], ['fgp', 'Field goal %', 'FG%'],
    ['rpg', 'Rebounds', 'RPG'], ['apg', 'Assists', 'APG'], ['tov', 'Fewest turnovers', 'TOV', true], ['spg', 'Steals', 'SPG'], ['bpg', 'Blocks', 'BPG'], ['tpm', '3-pointers made', '3PM']];
  const boards = BOARDS.map(([k, title, short, low]) => {
    const list = rows.slice().sort((a, b) => low ? a[k] - b[k] : b[k] - a[k]).slice(0, 5);
    const fmt = x => (k === 'net' && x > 0 ? '+' : '') + NBA.fix(x) + (['tpp', 'fgp'].includes(k) ? '%' : '');
    return `<div class="card mini"><div class="card-h"><h3>${title}</h3><div class="end">${short}</div></div><ol class="rank">${list.map((t, i) => `<li data-act="team" data-id="${t.id}" style="cursor:pointer"><span class="rk">${i + 1}</span>
      <span class="nm" style="display:flex;align-items:center;gap:8px">${UI.logo(NBA.T(t.id), 22)}${esc(NBA.T(t.id).name || t.name)}</span><span class="v">${fmt(t[k])}</span></li>`).join('')}</ol></div>`;
  }).join('');
  return `<section class="sec">${head}${table}</section>
    <section class="sec"><div class="sec-h"><h2>Form guide</h2><span class="sub">Who's rolling and who's cooling off over the last week</span></div><div class="mini-grid" style="--min:340px">${formCards}</div></section>
    <section class="sec"><div class="sec-h"><h2>Team leaders</h2><span class="sub">Top five teams in each category, per game</span></div><div class="mini-grid">${boards}</div></section>`;
}
NBA.actions.prsort = a => { const k = a.dataset.k; st.prSort = st.prSort.k === k ? { k, desc: !st.prSort.desc } : { k, desc: k !== 'drtg' }; NBA.changed(); };

/* ================= Fun Facts ================= */
/* Every fact card, grouped; Fun Facts and the Home deck both deal from this */
NBA.factGroups = () => {
  const confs = NBA.use('standings'), players = NBA.use('players'), ts = NBA.use('teamstats');
  const pastKeys = Array.from({ length: 7 }, (_, i) => i === 0 ? 'day:' : 'day:' + NBA.paramOf(NBA.shiftIso(NBA.today, -i)));
  const past = pastKeys.map(k => NBA.use(k)).filter(Boolean);
  if (!confs) return null;
  const rows = confs.flatMap(c => c.rows);
  // Facts land in three groups; `into` is the group being filled
  const league = [], people = [], week = [];
  let into = league;
  const fact = (eyebrow, big, text, who) => into.push(`<div class="card fact"><div class="eyebrow">${eyebrow}</div>${who || ''}<div class="big">${big}</div><p>${text}</p></div>`);
  const teamWho = r => r ? `<div class="who3">${UI.logo(NBA.T(r.id).logo ? NBA.T(r.id) : r, 34)}${esc(r.full)}</div>` : '';
  const playerWho = p => `<div class="who3">${UI.hs(p.headshot)}${esc(p.name)} <span class="mut" style="font-weight:600">${esc(p.team)}</span></div>`;
  const rowOf = id => rows.find(r => r.id === id);
  const tname = id => (rowOf(id) || NBA.T(id) || {}).name || '';

  const gamesPlayed = rows.reduce((n, r) => n + r.w + r.l, 0) / 2;
  const totalGames = 1230;
  league.push(`<div class="card fact"><div class="eyebrow">Season progress</div><div class="big">${Math.round(gamesPlayed)}<small>of ${totalGames} games</small></div>
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
    const byPace = ts.slice().sort((a, b) => b.pace - a.pace), fast = byPace[0], slow = byPace[byPace.length - 1];
    fact('Need for speed', NBA.fix(fast.pace) + '<small>possessions a game</small>', `The ${esc(tname(fast.id))} play the fastest. The ${esc(tname(slow.id))} are the slowest at ${NBA.fix(slow.pace)}.`, teamWho(rowOf(fast.id)));
    const share3 = t => t.tpm * 3 / t.ppg * 100, arc = ts.slice().sort((a, b) => share3(b) - share3(a)), lowArc = arc[arc.length - 1];
    fact('Living by the three', Math.round(share3(arc[0])) + '%<small>of points from 3s</small>', `The ${esc(tname(arc[0].id))} get the biggest share of their points from deep. The ${esc(tname(lowArc.id))} rely on it least, at ${Math.round(share3(lowArc))}%.`, teamWho(rowOf(arc[0].id)));
    const glass = ts.slice().sort((a, b) => b.orpg - a.orpg)[0];
    fact('Second chances', NBA.fix(glass.orpg) + '<small>offensive rebounds</small>', `The ${esc(tname(glass.id))} grab the most offensive rebounds per game.`, teamWho(rowOf(glass.id)));
    const line = ts.slice().sort((a, b) => b.fta - a.fta)[0];
    fact('Living at the line', NBA.fix(line.fta) + '<small>free throws a game</small>', `The ${esc(tname(line.id))} get to the free-throw line most often and make ${NBA.fix(line.ftp)}% of them.`, teamWho(rowOf(line.id)));
  }
  // Best home and road records, noting ties
  const bestRec = key => {
    const pct = o => o.x.w / (o.x.w + o.x.l);
    const list = rows.map(r => ({ r, x: rec(r[key]) })).filter(o => o.x && o.x.w + o.x.l >= 2).sort((a, b) => pct(b) - pct(a) || b.x.w - a.x.w);
    if (!list.length) return null;
    return Object.assign(list[0], { ties: list.filter(o => pct(o) === pct(list[0]) && o.x.w === list[0].x.w).length - 1 });
  };
  const tieNote = n => n > 0 ? ` (tied with ${n} other team${n > 1 ? 's' : ''})` : '';
  const home = bestRec('home'), road = bestRec('road');
  if (home) fact('Home cooking', `${home.x.w}-${home.x.l}<small>at home</small>`, `The ${esc(home.r.name)} have the best home record${tieNote(home.ties)}. They are ${esc(home.r.road || '0-0')} on the road.`, teamWho(home.r));
  if (road) fact('Road warriors', `${road.x.w}-${road.x.l}<small>on the road</small>`, `The ${esc(road.r.name)} have the best road record${tieNote(road.ties)}. They are ${esc(road.r.home || '0-0')} at home.`, teamWho(road.r));
  // Each team's record outside its conference adds up to the East vs. West series
  const inter = { East: { w: 0, l: 0 }, West: { w: 0, l: 0 } };
  const interOk = rows.every(r => { const c = rec(r.confRec); if (!c || !inter[r.conf]) return false; inter[r.conf].w += r.w - c.w; inter[r.conf].l += r.l - c.l; return true; });
  const ew = inter.East;
  if (interOk && ew.w + ew.l > 0) fact('East vs. West', `${Math.max(ew.w, ew.l)}-${Math.min(ew.w, ew.l)}`, ew.w === ew.l ? 'The conferences are dead even in games against each other this season.' : `The ${ew.w > ew.l ? 'East' : 'West'} leads the head-to-head series between the conferences this season.`);
  into = people;
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

    // Regulars: players who have appeared in at least half their team's games
    const tsBy = Object.fromEntries((ts || []).map(t => [t.id, t]));
    const regular = players.filter(p => p.gp >= Math.max(2, ((tsBy[p.teamId] || {}).gp || 0) / 2));
    const byTeam = {};
    regular.forEach(p => { (byTeam[p.teamId] = byTeam[p.teamId] || []).push(p); });
    const show = regular.filter(p => tsBy[p.teamId] && tsBy[p.teamId].ppg).map(p => ({ p, s: p.pts / tsBy[p.teamId].ppg * 100 })).sort((a, b) => b.s - a.s)[0];
    if (show) fact('One-man show', Math.round(show.s) + '%<small>of team scoring</small>', `${esc(show.p.name)} averages ${NBA.fix(show.p.pts)} points, ${Math.round(show.s)}% of everything the ${esc(tname(show.p.teamId) || show.p.team)} score. Nobody carries a bigger share.`, playerWho(show.p));
    const allround = Object.values(byTeam).filter(list => list.length >= 5).map(list => {
      const top = k => list.reduce((b, p) => p[k] > b[k] ? p : b, list[0]);
      const a = top('pts');
      return a === top('reb') && a === top('ast') ? a : null;
    }).filter(Boolean).sort((a, b) => b.pra - a.pra);
    if (allround.length) fact('Does it all', String(allround.length) + `<small>${allround.length === 1 ? 'player' : 'players'}</small>`, `${allround.length === 1 ? 'The only player' : 'Players'} leading their team in points, rebounds and assists: ${allround.slice(0, 4).map(p => `${esc(p.name)} (${esc(p.team)})`).join(', ')}${allround.length > 4 ? ` and ${allround.length - 4} more` : ''}.`, playerWho(allround[0]));
    const big = regular.filter(p => p.pos === 'C' && p.tpm > 0).sort((a, b) => b.tpm - a.tpm)[0];
    if (big) fact('Stretch big', NBA.fix(big.tpm) + '<small>threes a game</small>', `The center making the most 3-pointers, shooting ${NBA.fix(big.tpp)}% from deep.`, playerWho(big));
    const ft = regular.slice().sort((a, b) => b.fta - a.fta)[0];
    if (ft) fact('Foul magnet', NBA.fix(ft.fta) + '<small>free throws a game</small>', `Gets to the line more than anyone and makes ${NBA.fix(ft.ftp)}% of them.`, playerWho(ft));
    const vet = regular.filter(p => p.age && p.min >= 24).sort((a, b) => b.age - a.age)[0];
    if (vet) fact('Ageless', `${vet.age}<small>years old</small>`, `The oldest player logging 24+ minutes a game, putting up ${NBA.fix(vet.pts)} points, ${NBA.fix(vet.reb)} rebounds and ${NBA.fix(vet.ast)} assists.`, playerWho(vet));
    const safe = regular.filter(p => p.ast >= 5 && p.tov > 0).sort((a, b) => b.astTo - a.astTo)[0];
    if (safe) fact('Safe hands', NBA.fix(safe.astTo) + '<small>assists per turnover</small>', `Best ratio among players averaging 5+ assists: ${NBA.fix(safe.ast)} assists to ${NBA.fix(safe.tov)} turnovers a game.`, playerWho(safe));

    // Team facts that come from player numbers go in the league group
    into = league;
    const depthAll = Object.keys(byTeam).map(id => ({ id, n: byTeam[id].filter(p => p.pts >= 10).length })).sort((a, b) => b.n - a.n);
    const depth = depthAll[0];
    if (depth && depth.n >= 4) {
      const tied = depthAll.filter(x => x.n === depth.n).length - 1;
      fact('Deepest roster', `${depth.n}<small>double-digit scorers</small>`, `The ${esc(tname(depth.id))} have ${depth.n} players averaging 10 or more points a game, ${tied ? 'tied for the most' : 'the most'} in the league.`, teamWho(rowOf(depth.id)));
    }
    const ageOf = list => { const l = list.filter(p => p.age && p.min >= 10), m = l.reduce((n, p) => n + p.min, 0); return m ? l.reduce((n, p) => n + p.age * p.min, 0) / m : NaN; };
    const ages = Object.keys(byTeam).map(id => ({ id, a: ageOf(byTeam[id]) })).filter(x => Number.isFinite(x.a)).sort((a, b) => a.a - b.a);
    if (ages.length > 1) {
      const y = ages[0], o = ages[ages.length - 1];
      fact('Youngest rotation', NBA.fix(y.a) + '<small>years old</small>', `The ${esc(tname(y.id))} play the youngest lineup, with each player's age weighted by minutes. The ${esc(tname(o.id))} are the oldest at ${NBA.fix(o.a)}.`, teamWho(rowOf(y.id)));
    }
  }
  into = week;
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
    const day = g => esc(NBA.fmtDate(g.date, { weekday: 'short', month: 'short', day: 'numeric' }));
    const other = (g, t) => g.away === t ? g.home : g.away;
    const qName = i => i < 4 ? NBA.ord(i + 1) + ' quarter' : i === 4 ? 'overtime' : NBA.ord(i - 3) + ' overtime';
    const quarters = finals.flatMap(g => [g.away, g.home].flatMap(t => (t.lines || []).map((v, i) => ({ g, t, i, v: +v })))).filter(x => Number.isFinite(x.v));
    const bigQ = quarters.sort((a, b) => b.v - a.v)[0];
    if (bigQ) fact('Biggest quarter', bigQ.v + '<small>points</small>', `The ${esc(bigQ.t.name)} poured in ${bigQ.v} in the ${qName(bigQ.i)} against ${esc(other(bigQ.g, bigQ.t).abbr)} on ${day(bigQ.g)}.`, teamWho(rowOf(bigQ.t.id)));
    const half = t => (+t.lines[0] || 0) + (+t.lines[1] || 0);
    const comeback = finals.filter(g => g.away.lines.length >= 2 && g.home.lines.length >= 2).map(g => {
      const w = +g.away.score > +g.home.score ? g.away : g.home, l = other(g, w);
      return { g, w, l, d: half(l) - half(w) };
    }).filter(x => x.d > 0).sort((a, b) => b.d - a.d)[0];
    if (comeback) {
      const { g, w, l, d } = comeback;
      fact('Comeback of the week', d + '<small>down at the half</small>', `The ${esc(w.name)} trailed the ${esc(l.name)} ${half(l)}-${half(w)} at halftime and won ${esc(w.score)}-${esc(l.score)} on ${day(g)}.`, teamWho(rowOf(w.id)));
    }
    const roadW = finals.filter(g => +g.away.score > +g.home.score).length, ot = finals.filter(g => g.away.lines.length > 4).length;
    fact('Road vs. home', `${roadW}-${finals.length - roadW}`, `Road teams' record over the last 7 days. ${ot ? `${ot} of the ${finals.length} games went to overtime.` : 'None of them went to overtime.'}`);
  }
  return { rows, league, people, week };
};
V.facts = () => {
  const head = `<div class="sec-h"><h2>Fun facts</h2><span class="sub">Charts, trends, extremes and oddities, recalculated from live ESPN data every time you open the page</span></div>`;
  const f = NBA.factGroups();
  if (!f) return `<section class="sec">${head}${stateOf('standings', 'standings')}</section>`;
  const group = (title, sub, list) => list.length ? `<section class="sec"><div class="sec-h"><h2>${title}</h2><span class="sub">${sub}</span></div><div class="facts">${list.join('')}</div></section>` : '';
  return `<section class="sec">${head}${NBA.chartDeck()}</section>
    <section class="sec">${luckCard(f.rows)}</section>
    ${group('Around the league', 'Team records, styles and extremes', f.league)}
    ${group('Player oddities', 'Season numbers that stand out', f.people)}
    ${group('This week', 'From every game in the last 7 days', f.week)}`;
};
const rec = s => { const m = /^(\d+)-(\d+)/.exec(s || ''); return m ? { w: +m[1], l: +m[2] } : null; };

/* Lucky or good: actual wins against the wins a team's scoring margin predicts (Pythagorean expectation, exponent 14) */
function luckCard(rows) {
  const list = rows.filter(r => r.w + r.l > 0 && r.ppg && r.opp).map(r => {
    const k = 14, exp = (r.w + r.l) * Math.pow(r.ppg, k) / (Math.pow(r.ppg, k) + Math.pow(r.opp, k));
    return { r, exp, d: r.w - exp };
  }).sort((a, b) => b.d - a.d);
  if (list.length < 10) return '';
  const max = Math.max(.5, ...list.map(x => Math.abs(x.d)));
  return `<div class="card luck"><div class="card-h"><h3>Lucky or good?</h3><div class="end"><span class="eyebrow">Wins above or below what the point margin predicts</span></div></div>
    <ol class="luck-list">${list.map(x => {
      const w = (Math.abs(x.d) / max * 50).toFixed(1), up = x.d >= 0;
      return `<li data-act="team" data-id="${x.r.id}" title="${esc(`${x.r.full}: ${x.r.w}-${x.r.l}, margin predicts ${NBA.fix(x.exp)} wins`)}">${UI.logo(NBA.T(x.r.id).logo ? NBA.T(x.r.id) : x.r, 20)}<span class="ab">${esc(x.r.abbr)}</span>
        <span class="bar"><i class="${up ? 'up' : 'dn'}" style="${up ? 'left' : 'right'}:50%;width:${w}%"></i></span><span class="v">${x.d > .05 ? '+' : x.d < -.05 ? '−' : ''}${NBA.fix(Math.abs(x.d))}</span></li>`;
    }).join('')}</ol>
    <p class="note" style="padding:12px var(--pad) var(--pad)">Over a season, points scored and allowed predict a team's record closely. Teams with green bars have won more than their margin suggests, usually by taking close games. Red bars have lost more. It tends to even out. Tap a team for its page.</p></div>`;
}
})();
