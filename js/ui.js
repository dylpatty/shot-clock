/* Shell: header, bookmark tabs, routing, shared components, game drawer and settings */
(() => {
'use strict';

const NBA = window.NBA;
const { esc } = NBA;
const $ = (s, r = document) => r.querySelector(s);
const UI = NBA.ui = { st: { revealed: new Set(), perfCat: 'points' } };
NBA.views = {};
NBA.actions = {};
NBA.changes = {};
NBA.after = {};

UI.I = {
  left: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.4L8 11.2 4.1 13.4 5 9 1.7 6l4.4-.5z" fill="currentColor"/></svg>',
  gear: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M3 6h8M15 6h2M3 14h2M9 14h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/><circle cx="13" cy="6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="7" cy="14" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
};

/* ---------- small components ---------- */
UI.logo = (t, size = 28, cls = '') => `<img class="${cls}" src="${esc(NBA.lg(t))}" alt="" width="${size}" height="${size}" loading="lazy">`;
UI.hs = (url, cls = 'hs') => url ? `<img class="${cls}" src="${esc(url)}" alt="" loading="lazy">` : `<span class="${cls}"></span>`;
UI.teamLink = id => `#teams/${id}`;
UI.isFav = g => NBA.S.favorites.includes(g.away.id) || NBA.S.favorites.includes(g.home.id);
UI.tipTime = g => {
  if (/TBD/i.test(g.detail)) return 'Time TBD';
  const mins = Math.round((new Date(g.date) - Date.now()) / 60000);
  return NBA.fmtTime(g.date) + (mins > 0 && mins <= 60 ? ` · in ${mins}m` : '');
};
UI.oddsText = o => !o ? '' : [o.details, o.ou ? 'O/U ' + o.ou : ''].filter(Boolean).join(' · ');

UI.gameCard = (g, big) => {
  const S = NBA.S, perLabel = NBA.perLabel;
  const hide = S.spoilers && g.state !== 'pre' && !UI.st.revealed.has(g.id);
  const showQ = S.card.quarters && g.state !== 'pre';
  const nq = showQ ? Math.max(4, g.away.lines.length, g.home.lines.length) : 0;
  const cols = `minmax(0,1fr)${nq ? ` repeat(${nq},minmax(1.8em,auto))` : ''} auto`;
  const head = nq ? `<span></span>${Array.from({ length: nq }, (_, i) => `<span class="hd">${i < 4 ? i + 1 : perLabel(i + 1)}</span>`).join('')}<span class="hd" style="text-align:right">T</span>` : '';
  const row = t => {
    const lost = g.state === 'post' && !hide && t.winner === false;
    const qs = nq ? Array.from({ length: nq }, (_, i) => `<span class="q">${hide ? '·' : esc(t.lines[i] ?? '')}</span>`).join('') : '';
    const bump = !hide && NBA.bumps.has(g.id + ':' + t.id) ? ' bump' : '';
    const score = g.state === 'pre' ? '' : hide ? '–' : esc(t.score);
    const fav = S.favorites.includes(t.id) ? `<span class="star" title="Your team">${UI.I.star}</span>` : '';
    const l = t.leaders.find(x => x.cat === 'points');
    const ldr = g.state !== 'pre' && S.card.leaders && l && !hide ? `<span class="ldr-row" title="${esc(t.abbr)} top scorer">${esc(l.full || l.short)} <b>${esc(l.value)}</b> pts</span>` : '';
    return `<div class="team${lost ? ' lost' : ''}">${UI.logo(t, big ? 40 : 30)}
      <span class="tn"><span class="ab">${esc(t.abbr)}${fav}<span class="rec">${esc(t.record)}</span></span></span></div>${qs}<span class="sc${lost ? ' lostsc' : ''}${bump}">${score}</span>${ldr}`;
  };
  let status;
  if (g.state === 'in') status = `<span class="st-live"><i class="dot blink"></i>${esc(g.detail)}</span>`;
  else if (g.state === 'pre') status = `<span>${esc(UI.tipTime(g))}</span>`;
  else status = `<span>${esc(g.detail)}</span>`;
  const started = g.state !== 'pre' && !/TBD/i.test(g.detail) ? 'Started ' + NBA.fmtTime(g.date) : '';
  const right = [started, g.note, g.tv].filter(Boolean).join(' · ');
  let extra = '';
  if (hide) extra = `<button class="chip reveal" data-act="reveal" data-id="${g.id}">Show score</button>`;
  else {
    if (g.state === 'in' && S.card.winprob && g.homeWin != null) {
      const hw = Math.round(g.homeWin * 100), aw = 100 - hw;
      const [ca, ch] = NBA.tones(g.away, g.home);
      extra += `<div class="wp" aria-label="Win chance: ${esc(g.away.abbr)} ${aw}%, ${esc(g.home.abbr)} ${hw}%">
        <div class="wpbar"><span style="flex:${aw};background:${ca}"></span><span style="flex:${hw};background:${ch}"></span></div>
        <div class="wplab"><span>${esc(g.away.abbr)} ${aw}%</span><span class="mut">Win chance</span><span>${esc(g.home.abbr)} ${hw}%</span></div></div>`;
    }
    if (g.state === 'pre' && (g.odds || g.venue)) {
      extra += `<div class="pre-meta">${g.odds && g.odds.details ? `<span>Line <b>${esc(g.odds.details)}</b></span>` : ''}${g.odds && g.odds.ou ? `<span>O/U <b>${esc(g.odds.ou)}</b></span>` : ''}${g.venue ? `<span>${esc(g.venue)}</span>` : ''}</div>`;
    }
    if (S.card.lastplay) {
      if (g.state === 'in' && g.lastPlay) extra += `<div class="last"><span class="lbl">Last play</span><span title="${esc(g.lastPlay)}">${esc(g.lastPlay)}</span></div>`;
      else if (g.state === 'post' && g.recap) extra += `<div class="last"><span class="lbl">Recap</span><span title="${esc(g.recap)}">${esc(g.recap)}</span></div>`;
    }
  }
  const label = `${g.away.full} at ${g.home.full}, ${g.state === 'pre' ? UI.tipTime(g) : g.detail}`;
  return `<div class="game${big ? ' big' : ''}${UI.isFav(g) ? ' fav' : ''}" role="button" tabindex="0" data-act="game" data-id="${g.id}" aria-label="${esc(label)}">
    <div class="g-top">${status}<span>${esc(right)}</span></div>
    <div class="ls" style="grid-template-columns:${cols}">${head}${row(g.away)}${row(g.home)}</div>${extra}</div>`;
};

UI.line = g => {
  const hide = NBA.S.spoilers && g.state !== 'pre' && !UI.st.revealed.has(g.id);
  let time;
  if (g.state === 'pre') time = `${esc(/TBD/i.test(g.detail) ? 'TBD' : NBA.fmtTime(g.date))}<small>${esc(g.tv || '')}</small>`;
  else if (g.state === 'in') time = `<span class="st-live"><i class="dot blink"></i>Live</span><small>${esc(g.detail)}</small>`;
  else time = `${esc(g.detail || 'Final')}<small>Started ${esc(NBA.fmtTime(g.date))}</small>`;
  const side = (t, home) => {
    const sc = g.state !== 'pre' && !hide ? `<span class="ln-score">${esc(t.score)}</span>` : '';
    const name = `<b><span class="full">${esc(t.name || t.abbr)}</span><span class="abbr">${esc(t.abbr)}</span></b>`;
    return home
      ? `<span class="ln-team home">${sc}<small>${esc(t.record)}</small>${name}${UI.logo(t, 26)}</span>`
      : `<span class="ln-team away">${UI.logo(t, 26)}${name}<small>${esc(t.record)}</small>${sc}</span>`;
  };
  return `<li class="line${UI.isFav(g) ? ' fav' : ''}" role="button" tabindex="0" data-act="game" data-id="${g.id}" aria-label="${esc(g.away.full)} at ${esc(g.home.full)}">
    <span class="ln-time">${time}</span>${side(g.away, false)}<span class="ln-at">@</span>${side(g.home, true)}<span class="ln-odds">${esc(UI.oddsText(g.odds))}</span></li>`;
};

/* Re-rendering replaces nodes; skip identical HTML and put keyboard focus back on the equivalent control */
UI.paint = (el, html) => {
  if (!el || el._html === html) return false;
  el._html = html;
  const a = document.activeElement;
  let sel = null, caret = null;
  if (a && a.tagName === 'INPUT' && el.contains(a)) { try { caret = [a.selectionStart, a.selectionEnd]; } catch (e) { caret = null; } }
  if (a && a !== document.body && el.contains(a)) {
    if (a.id) sel = '#' + CSS.escape(a.id);
    else {
      const parts = ['act', 'ch', 'id', 'k', 'v'].filter(k => a.dataset[k] != null).map(k => `[data-${k}="${CSS.escape(a.dataset[k])}"]`);
      if (parts.length) sel = parts.join('');
    }
  }
  el.innerHTML = html;
  if (sel) {
    const n = el.querySelector(sel);
    if (n) {
      n.focus({ preventScroll: true });
      if (caret && caret[0] != null) { try { n.setSelectionRange(caret[0], caret[1]); } catch (e) { /* not a text input */ } }
    }
  }
  return true;
};

/* ---------- routing ---------- */
const TABS = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'standings', label: 'Standings' },
  { id: 'stats', label: 'Stats' },
  { id: 'odds', label: 'Odds' },
  { id: 'news', label: 'Injuries & News' },
  { id: 'myteam' },
  { id: 'teams', label: 'Teams' },
  { id: 'facts', label: 'Fun Facts' },
];
UI.route = () => {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  const [tab, arg] = h.split('/');
  return { tab: TABS.some(t => t.id === tab) ? tab : 'schedule', arg: arg || '' };
};
function renderTabs() {
  const { tab } = UI.route();
  const today = NBA.data('day:');
  const live = today ? today.games.filter(g => g.state === 'in').length : 0;
  const mt = NBA.T(NBA.S.myTeam);
  const html = TABS.map(t => {
    let inner;
    if (t.id === 'myteam') inner = `${mt.logo ? UI.logo(mt, 24) : ''}${esc(mt.name || 'My team')}`;
    else if (t.id === 'schedule' && live) inner = `${t.label}<span class="badge"><i class="dot blink"></i>${live} live</span>`;
    else inner = esc(t.label);
    return `<a class="tab" role="tab" href="#${t.id}" aria-selected="${tab === t.id}">${inner}</a>`;
  }).join('');
  UI.paint($('#tabbar'), html);
}
function renderHeader() {
  const today = NBA.data('day:');
  const live = today ? today.games.filter(g => g.state === 'in').length : null;
  const pill = $('#livepill');
  pill.className = 'livepill' + (live ? ' on' : '');
  pill.innerHTML = live == null ? '' : live ? `<i class="dot blink"></i>${live} live` : 'No games live';
  renderUpdated();
}
function renderUpdated() {
  const el = $('#upd');
  if (NBA.failing) { el.className = 'upd err'; el.textContent = "Can't reach ESPN · retrying"; return; }
  el.className = 'upd';
  if (!NBA.lastUpdate) { el.textContent = 'Loading…'; return; }
  const s = Math.round((Date.now() - NBA.lastUpdate) / 1000);
  el.textContent = 'Updated ' + (s < 5 ? 'just now' : s < 60 ? s + 's ago' : Math.round(s / 60) + 'm ago');
}
let lastTab = null;
function renderView() {
  const { tab, arg } = UI.route();
  const view = $('#view');
  const fn = NBA.views[tab];
  if (!fn) return;
  if (tab !== lastTab) { view._html = null; lastTab = tab; }
  const changed = UI.paint(view, fn(arg));
  if (NBA.after[tab]) NBA.after[tab](view, changed);
}
NBA.render = () => {
  renderHeader();
  renderTabs();
  renderView();
  if (UI.drawer) renderDrawer();
  if (UI.settingsOpen) renderSettings();
  if (NBA.ask && NBA.ask.render) NBA.ask.render();
};
window.addEventListener('hashchange', () => {
  const { tab } = UI.route();
  document.title = tab === 'schedule' ? 'NBA' : `${(TABS.find(t => t.id === tab) || {}).label || NBA.T(NBA.S.myTeam).name || 'NBA'} · NBA`;
  window.scrollTo(0, 0);
  NBA.render();
});

/* ---------- overlays ---------- */
function lock(on) { document.body.classList.toggle('locked', on); $('#scrim').hidden = !on; }
UI.closeAll = () => {
  const had = UI.drawer || UI.settingsOpen;
  UI.drawer = null; UI.settingsOpen = false; UI.resetArmed = false;
  $('#drawer').hidden = true; $('#settings').hidden = true;
  lock(false);
  if (had && UI.lastFocus && document.contains(UI.lastFocus)) UI.lastFocus.focus();
};

/* ---------- game drawer ---------- */
const BOX_COMPACT = ['minutes', 'points', 'rebounds', 'assists', 'fieldGoalsMade-fieldGoalsAttempted', 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', 'plusMinus'];
const TEAM_STATS = [
  ['fieldGoalPct', 'Field goal %', 'fieldGoalsMade-fieldGoalsAttempted', true],
  ['threePointFieldGoalPct', '3-point %', 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', true],
  ['freeThrowPct', 'Free throw %', 'freeThrowsMade-freeThrowsAttempted', true],
  ['totalRebounds', 'Rebounds'], ['offensiveRebounds', 'Offensive rebounds'], ['assists', 'Assists'], ['steals', 'Steals'], ['blocks', 'Blocks'],
  ['totalTurnovers', 'Turnovers', null, false, true], ['pointsInPaint', 'Points in the paint'], ['fastBreakPoints', 'Fast break points'], ['largestLead', 'Largest lead'],
];
function findGame(id) {
  for (const k of ['day:', 'day:' + NBA.dayParam]) { const d = NBA.data(k); const g = d && d.games.find(x => x.id === id); if (g) return g; }
  return null;
}
UI.openGame = (id, opener) => {
  UI.lastFocus = opener || document.activeElement;
  UI.st.revealed.add(id);
  UI.drawer = { id, tab: 'box', sort: null, scoringOnly: false, showAll: false, game: findGame(id) };
  UI.settingsOpen = false; $('#settings').hidden = true;
  $('#drawer').hidden = false; lock(true);
  $('#drawer')._html = null;
  renderDrawer();
  $('#drawer').scrollTop = 0;
  const c = $('#drawer [data-act="close"]'); if (c) c.focus();
  NBA.need('summary:' + id, true).catch(() => {});
  NBA.changed();
};
NBA.pollHooks.push({
  live: () => { const d = UI.drawer && NBA.data('summary:' + UI.drawer.id); return !!(d && d.state === 'in'); },
  run: () => { if (!UI.drawer) return null; const d = NBA.data('summary:' + UI.drawer.id); return (!d || d.state === 'in') ? NBA.need('summary:' + UI.drawer.id, true) : null; },
});
function renderDrawer() {
  const d = UI.drawer, el = $('#drawer');
  if (!d) return;
  const data = NBA.data('summary:' + d.id), err = NBA.status('summary:' + d.id).err;
  const g = findGame(d.id) || d.game;
  const away = data ? data.away : g && g.away, home = data ? data.home : g && g.home;
  const state = data ? data.state : g && g.state;
  const detail = data ? (data.state === 'pre' && data.date ? UI.tipTime({ date: data.date, detail: data.detail }) : data.detail) : g ? (g.state === 'pre' ? UI.tipTime(g) : g.detail) : '';
  const link = data ? data.link : g ? g.link : `https://www.espn.com/nba/game/_/gameId/${d.id}`;
  const title = away && home ? `${away.full || away.abbr} at ${home.full || home.abbr}` : 'Game';
  let html = `<div class="dr-bar dpad"><button class="ib" data-act="close" aria-label="Close game">${UI.I.close}</button>
    <span class="dr-title" id="dr-title">${esc(title)}</span><a class="ext" href="${esc(link)}" target="_blank" rel="noopener">Open on ESPN ↗</a></div>`;
  if (away && home) {
    const side = (t, isHome) => `<div class="dr-team${isHome ? ' home' : ''}">${UI.logo(Object.assign({}, t, NBA.T(t.id).logo ? { logo: NBA.T(t.id).logo, logoDark: NBA.T(t.id).logoDark } : {}), 56)}
      <div><div class="ab">${esc(t.abbr)}</div><div class="rec">${esc(t.record || '')}</div></div>
      <div class="sc${state === 'post' && t.winner === false ? ' lostsc' : ''}">${state === 'pre' ? '' : esc(t.score)}</div></div>`;
    html += `<div class="dr-score dpad">${side(away, false)}<div class="dr-status${state === 'in' ? ' live' : ''}">${state === 'in' ? '<i class="dot blink"></i>' : ''}${esc(detail)}</div>${side(home, true)}</div>`;
    const nq = Math.max(away.lines.length, home.lines.length);
    if (nq && state !== 'pre') {
      const cells = t => Array.from({ length: nq }, (_, i) => `<td>${esc(t.lines[i] ?? '')}</td>`).join('');
      html += `<div class="tblwrap dpad"><table class="lsx"><thead><tr><th></th>${Array.from({ length: nq }, (_, i) => `<th scope="col">${NBA.perLabel(i + 1)}</th>`).join('')}<th scope="col">T</th></tr></thead>
        <tbody><tr><td>${esc(away.abbr)}</td>${cells(away)}<td>${esc(away.score)}</td></tr><tr><td>${esc(home.abbr)}</td>${cells(home)}<td>${esc(home.score)}</td></tr></tbody></table></div>`;
    }
    if (state === 'pre' && g && (g.odds || g.tv || g.venue)) {
      html += `<div class="dpad pre-meta" style="justify-content:center;padding-bottom:12px">${g.tv ? `<span>TV <b>${esc(g.tv)}</b></span>` : ''}${g.odds && g.odds.details ? `<span>Line <b>${esc(g.odds.details)}</b></span>` : ''}${g.odds && g.odds.ou ? `<span>O/U <b>${esc(g.odds.ou)}</b></span>` : ''}${g.venue ? `<span>${esc(g.venue)}</span>` : ''}</div>`;
    }
  }
  const tabs = [['box', 'Box score'], ['team', 'Team stats'], ['plays', 'Plays'], ['wp', 'Win chance']];
  html += `<div class="dtabs dpad" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-act="dtab" data-v="${k}" aria-selected="${d.tab === k}">${l}</button>`).join('')}</div>`;
  let pane;
  if (!data) pane = `<p class="empty">${err ? "Couldn't load this game from ESPN. It will retry on the next refresh." : 'Loading game…'}</p>`;
  else if (d.tab === 'box') pane = paneBox(d, data);
  else if (d.tab === 'team') pane = paneTeam(data);
  else if (d.tab === 'plays') pane = panePlays(d, data);
  else pane = paneWp(data);
  html += `<div class="pane dpad" role="tabpanel">${pane}</div>`;
  const top = el.scrollTop;
  if (UI.paint(el, html)) { el.scrollTop = top; if (data && d.tab === 'wp') bindWp(data); }
}
function paneBox(d, data) {
  const S = NBA.S;
  const tools = `<div class="pane-tools"><div class="seg sm" role="group" aria-label="Columns">
      <button data-act="set" data-k="boxCols" data-v="compact" aria-pressed="${S.boxCols === 'compact'}">Key stats</button>
      <button data-act="set" data-k="boxCols" data-v="full" aria-pressed="${S.boxCols === 'full'}">All stats</button></div>
      ${d.sort ? `<button class="chip" data-act="sort" data-k="">Starters and bench</button>` : '<span class="note">Tap a column to sort</span>'}</div>`;
  const teams = data.box.filter(b => b.players.some(p => !p.dnp));
  let out = '';
  if (!teams.length) out += `<p class="empty">The box score fills in once the game tips off.</p>`;
  else out += tools + [data.away, data.home].map(t => data.box.find(b => b.teamId === t.id)).filter(Boolean).map(b => boxTeam(b, d)).join('');
  if (data.injuries.length) {
    out += `<div><h3 class="bx-team">Injury report</h3>${data.injuries.map(t => `<p class="note" style="margin:8px 0 4px;font-weight:800;color:var(--ink)">${esc(NBA.T(t.teamId).name || NBA.T(t.teamId).abbr)}</p>
      <ul class="inj2">${t.list.map(i => `<li><b>${esc(i.name)}</b> <span class="mut">${esc(i.status)}${i.type ? ' · ' + esc(i.type) : ''}</span></li>`).join('')}</ul>`).join('')}</div>`;
  }
  return out;
}
function boxTeam(b, d) {
  const t = NBA.T(b.teamId);
  const idx = b.keys.map((k, i) => i).filter(i => NBA.S.boxCols === 'full' || BOX_COMPACT.includes(b.keys[i]));
  const played = b.players.filter(p => !p.dnp), dnp = b.players.filter(p => p.dnp);
  const th = idx.map(i => {
    const on = d.sort && d.sort.k === b.keys[i];
    return `<th scope="col"><button class="sortb${on ? ' on' : ''}" data-act="sort" data-k="${esc(b.keys[i])}" aria-label="Sort by ${esc(b.labels[i])}">${esc(b.labels[i])}${on ? (d.sort.desc ? ' ↓' : ' ↑') : ''}</button></th>`;
  }).join('');
  const prow = p => `<tr><th class="pl" scope="row">${esc(p.name)}<span class="pp">${esc(p.pos || '')}</span></th>${idx.map(i => `<td class="${b.keys[i] === 'points' ? 'pts' : ''}">${esc(p.stats[i] ?? '')}</td>`).join('')}</tr>`;
  const sub = l => `<tr class="sub"><th scope="rowgroup">${l}</th><th colspan="${idx.length}"></th></tr>`;
  let rows;
  if (d.sort) {
    const k = b.keys.indexOf(d.sort.k), m = d.sort.desc ? 1 : -1;
    rows = played.slice().sort((x, y) => m * (NBA.num(y.stats[k]) - NBA.num(x.stats[k]))).map(prow).join('');
  } else {
    const st = played.filter(p => p.starter), bn = played.filter(p => !p.starter);
    rows = (st.length ? sub('Starters') + st.map(prow).join('') : '') + (bn.length ? sub('Bench') + bn.map(prow).join('') : '');
  }
  const tot = `<tr class="tot"><th class="pl" scope="row">Team</th>${idx.map(i => `<td>${esc(b.totals[i] ?? '')}</td>`).join('')}</tr>`;
  return `<div><h3 class="bx-team">${UI.logo(t, 26)}${esc(t.full || t.abbr)}</h3>
    <div class="tblwrap"><table class="bx"><thead><tr><th class="pl" scope="col">Player</th>${th}</tr></thead><tbody>${rows}${tot}</tbody></table></div>
    ${dnp.length ? `<p class="dnp">Did not play: ${dnp.map(p => esc(p.name) + (p.reason ? ` (${esc(p.reason.toLowerCase())})` : '')).join(', ')}</p>` : ''}</div>`;
}
function paneTeam(data) {
  const a = data.tstats.find(x => x.teamId === data.away.id), h = data.tstats.find(x => x.teamId === data.home.id);
  if (!a || !h || !Object.keys(a.m).length) return `<p class="empty">Team stats fill in once the game tips off.</p>`;
  const [ca, ch] = NBA.tones(data.away, data.home);
  const rows = TEAM_STATS.filter(([k]) => a.m[k] != null && h.m[k] != null).map(([k, label, split, pct, lowerBetter]) => {
    const va = parseFloat(a.m[k]) || 0, vh = parseFloat(h.m[k]) || 0, max = Math.max(va, vh, 1);
    const better = va === vh ? 0 : ((va > vh) !== !!lowerBetter ? -1 : 1);
    const fmt = v => esc(v) + (pct ? '%' : '');
    const splitTxt = split && a.m[split] ? ` <small>(${esc(a.m[split])} · ${esc(h.m[split])})</small>` : '';
    return `<div class="cmp-row"><div class="cmp-lbl">${esc(label)}${splitTxt}</div>
      <div class="cmp-bars"><span class="v${better < 0 ? ' b' : ''}">${fmt(a.m[k])}</span>
      <div class="hbar l"><i style="width:${(va / max * 100).toFixed(1)}%;background:${ca}"></i></div>
      <div class="hbar"><i style="width:${(vh / max * 100).toFixed(1)}%;background:${ch}"></i></div>
      <span class="v${better > 0 ? ' b' : ''}">${fmt(h.m[k])}</span></div></div>`;
  }).join('');
  return `<div class="cmp"><div class="cmp-head"><span></span><span>${esc(data.away.abbr)}</span><span>${esc(data.home.abbr)}</span><span></span></div>${rows}</div>
    <p class="note">The stronger number in each row is bold. For turnovers, fewer is better.</p>`;
}
function panePlays(d, data) {
  if (!data.plays.length) return `<p class="empty">Play-by-play starts at tip-off.</p>`;
  let list = data.plays.slice().reverse();
  if (d.scoringOnly) list = list.filter(p => p.scoring);
  const total = list.length;
  if (!d.showAll) list = list.slice(0, 60);
  return `<div class="pane-tools"><label class="chk"><input type="checkbox" id="scoring-only" data-ch="scoring" ${d.scoringOnly ? 'checked' : ''}> Scoring plays only</label><span class="note">Newest first</span></div>
    <ol class="plays">${list.map(p => `<li class="${p.scoring ? 'scr' : ''}"><span class="pt">${NBA.perLabel(p.period)} ${esc(p.clock)}</span>
      <span class="tc">${esc(p.teamId ? NBA.T(p.teamId).abbr : '')}</span><span class="tx">${esc(p.text)}</span><span class="ps">${esc(p.away)}–${esc(p.home)}</span></li>`).join('')}</ol>
    ${!d.showAll && total > 60 ? `<button class="btn" data-act="allplays">Show all ${total} plays</button>` : ''}`;
}
const WP = { W: 640, H: 230, l: 44, r: 64, t: 14, b: 26 };
function wpGeom(n) {
  return {
    x: i => WP.l + (n <= 1 ? 0 : i / (n - 1)) * (WP.W - WP.l - WP.r),
    y: v => WP.t + (1 - v) * (WP.H - WP.t - WP.b),
  };
}
function paneWp(data) {
  const pts = data.wp;
  if (!pts || pts.length < 2) return `<p class="empty">The win chance chart starts once the game is underway.</p>`;
  const n = pts.length, { x, y } = wpGeom(n);
  const pm = new Map(data.plays.map(p => [p.id, p]));
  const [ca, ch] = NBA.tones(data.away, data.home);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.homeWinPercentage).toFixed(1)}`).join('');
  const area = `${line}L${x(n - 1).toFixed(1)},${y(.5).toFixed(1)}L${x(0).toFixed(1)},${y(.5).toFixed(1)}Z`;
  let seps = '', prev = null;
  pts.forEach((p, i) => {
    const per = (pm.get(String(p.playId)) || {}).period;
    if (per && per !== prev) {
      if (prev !== null) seps += `<line class="sep" x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${WP.t}" y2="${WP.H - WP.b}"/>`;
      seps += `<text class="ax" x="${(x(i) + 4).toFixed(1)}" y="${WP.H - 8}">${NBA.perLabel(per)}</text>`;
      prev = per;
    }
  });
  const lastV = pts[n - 1].homeWinPercentage, homeLeads = lastV >= .5;
  const endPct = Math.round((homeLeads ? lastV : 1 - lastV) * 100), endTeam = homeLeads ? data.home.abbr : data.away.abbr;
  const desc = `${data.state === 'post' ? 'Final' : 'Current'} win chance: ${endTeam} ${endPct}%`;
  return `<div class="wpwrap"><svg id="wpsvg" viewBox="0 0 ${WP.W} ${WP.H}" role="img" aria-label="${esc(desc)}. Line above the middle favors ${esc(data.home.abbr)}, below favors ${esc(data.away.abbr)}.">
      <defs><clipPath id="wpTop"><rect x="0" y="0" width="${WP.W}" height="${y(.5).toFixed(1)}"/></clipPath>
      <clipPath id="wpBot"><rect x="0" y="${y(.5).toFixed(1)}" width="${WP.W}" height="${WP.H}"/></clipPath></defs>
      <line class="grid-l" x1="${WP.l}" x2="${WP.W - WP.r}" y1="${y(.75)}" y2="${y(.75)}"/>
      <line class="grid-l" x1="${WP.l}" x2="${WP.W - WP.r}" y1="${y(.25)}" y2="${y(.25)}"/>
      ${seps}
      <path d="${area}" fill="${ch}" fill-opacity=".32" clip-path="url(#wpTop)"/>
      <path d="${area}" fill="${ca}" fill-opacity=".32" clip-path="url(#wpBot)"/>
      <line class="mid" x1="${WP.l}" x2="${WP.W - WP.r}" y1="${y(.5)}" y2="${y(.5)}"/>
      <text class="axb" x="4" y="${WP.t + 10}">${esc(data.home.abbr)}</text>
      <text class="ax" x="4" y="${y(.75) + 4}">75%</text><text class="ax" x="4" y="${y(.5) + 4}">50%</text><text class="ax" x="4" y="${y(.25) + 4}">75%</text>
      <text class="axb" x="4" y="${WP.H - WP.b - 2}">${esc(data.away.abbr)}</text>
      <path class="ln" d="${line}"/>
      <circle class="end" cx="${x(n - 1).toFixed(1)}" cy="${y(lastV).toFixed(1)}" r="5"/>
      <text class="axb" x="${(x(n - 1) + 9).toFixed(1)}" y="${(y(lastV) + 4).toFixed(1)}">${esc(endTeam)} ${endPct}%</text>
      <line class="hx" id="wphx" y1="${WP.t}" y2="${WP.H - WP.b}" visibility="hidden"/>
      <circle class="end" id="wpdot" r="5" visibility="hidden"/>
    </svg><div class="wptip" id="wptip" hidden></div></div>
    <p class="note">${esc(desc)}. Shaded above the dashed line favors ${esc(data.home.abbr)}, below favors ${esc(data.away.abbr)}. Hover or drag across the chart to see each play.</p>`;
}
function bindWp(data) {
  const svg = $('#wpsvg'), tip = $('#wptip'), hx = $('#wphx'), dot = $('#wpdot');
  if (!svg) return;
  const pts = data.wp, n = pts.length, { x, y } = wpGeom(n);
  const pm = new Map(data.plays.map(p => [p.id, p]));
  const show = e => {
    const r = svg.getBoundingClientRect();
    const sx = (e.clientX - r.left) / r.width * WP.W;
    const i = Math.max(0, Math.min(n - 1, Math.round((sx - WP.l) / (WP.W - WP.l - WP.r) * (n - 1))));
    const p = pts[i], pl = pm.get(String(p.playId)) || {};
    const v = p.homeWinPercentage, lead = v >= .5 ? data.home.abbr : data.away.abbr, pct = Math.round((v >= .5 ? v : 1 - v) * 100);
    hx.setAttribute('x1', x(i)); hx.setAttribute('x2', x(i)); hx.setAttribute('visibility', 'visible');
    dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(v)); dot.setAttribute('visibility', 'visible');
    tip.innerHTML = `<b>${esc(lead)} ${pct}% · ${pl.period ? NBA.perLabel(pl.period) + ' ' + esc(pl.clock) : ''}</b>${esc(pl.text || '')}${pl.away != null ? ` <span>(${esc(pl.away)}–${esc(pl.home)})</span>` : ''}`;
    tip.hidden = false;
    const px = x(i) / WP.W * r.width, half = tip.offsetWidth / 2;
    tip.style.left = Math.max(half, Math.min(r.width - half, px)) + 'px';
    if (v >= .5) { tip.style.top = 'auto'; tip.style.bottom = (WP.b / WP.H * r.height + 4) + 'px'; }
    else { tip.style.top = '4px'; tip.style.bottom = 'auto'; }
  };
  const hide = () => { tip.hidden = true; hx.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); };
  svg.addEventListener('pointermove', show);
  svg.addEventListener('pointerdown', show);
  svg.addEventListener('pointerleave', hide);
}

/* ---------- settings ---------- */
UI.openSettings = opener => {
  UI.lastFocus = opener || document.activeElement;
  UI.drawer = null; $('#drawer').hidden = true;
  UI.settingsOpen = true; UI.resetArmed = false;
  $('#settings').hidden = false; lock(true);
  $('#settings')._html = null;
  renderSettings();
  $('#settings').scrollTop = 0;
  const c = $('#settings [data-act="close"]'); if (c) c.focus();
};
const MODELS = [
  ['claude-opus-5-5', 'Claude Opus 5.5 · best answers · about 5–15¢ a question'],
  ['claude-sonnet-5-5', 'Claude Sonnet 5.5 · fast · about 2–6¢ a question'],
  ['claude-haiku-5-5', 'Claude Haiku 5.5 · cheapest · well under 1¢ a question'],
];
UI.MODELS = MODELS;
function renderSettings() {
  const el = $('#settings');
  if (!UI.settingsOpen) return;
  const S = NBA.S;
  const teams = [...NBA.teams.values()].filter(t => t.abbr && t.conf);
  const byConf = [['East', 'Eastern Conference'], ['West', 'Western Conference']].map(([k, l]) => [l, teams.filter(t => t.conf === k).sort((a, b) => (a.name || '').localeCompare(b.name || ''))]);
  const tbtn = t => `<button class="tbtn" data-act="fav" data-id="${t.id}" aria-pressed="${S.favorites.includes(t.id)}">${UI.logo(t, 22)}<span>${esc(t.name || t.abbr)}</span></button>`;
  const opt = (k, label) => `<label class="chk"><input type="checkbox" id="card-${k}" data-ch="card" data-k="${k}" ${S.card[k] ? 'checked' : ''}> ${label}</label>`;
  const seg = (k, opts, label) => `<div class="seg" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button data-act="set" data-k="${k}" data-v="${v}" aria-pressed="${S[k] === v}">${l}</button>`).join('')}</div>`;
  const key = NBA.aiKey.get();
  const html = `
    <div class="dr-bar dpad"><button class="ib" data-act="close" aria-label="Close settings">${UI.I.close}</button><span class="dr-title" id="st-title">Settings</span><span class="note">Saves automatically</span></div>
    <div class="dpad">
      <section class="cz-sec"><h3>Your team tab</h3><p class="hint">This team gets its own tab next to Teams.</p>
        <select id="myteam" data-ch="myTeam">${teams.slice().sort((a, b) => a.full.localeCompare(b.full)).map(t => `<option value="${t.id}" ${S.myTeam === t.id ? 'selected' : ''}>${esc(t.full)}</option>`).join('') || `<option>${esc(NBA.T(S.myTeam).full || 'Golden State Warriors')}</option>`}</select></section>
      <section class="cz-sec"><h3>Highlighted teams</h3><p class="hint">Starred on score cards and highlighted in the schedule, standings and odds.</p>
        ${teams.length ? byConf.map(([l, list]) => `<h4>${l}</h4><div class="tgrid">${list.map(tbtn).join('')}</div>`).join('') : '<p class="hint">Loading teams…</p>'}</section>
      <section class="cz-sec"><h3>Ask anything (Claude)</h3>
        <p class="hint">The search bar answers common questions on its own. For anything else it uses Claude with your own Anthropic API key. You pay Anthropic per question, separately from any Claude subscription. The key is stored only in this browser and sent only to api.anthropic.com. Get a key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>.</p>
        <div class="keyrow"><label class="sr" for="ai-key">Anthropic API key</label><input class="field" id="ai-key" type="password" autocomplete="off" spellcheck="false" placeholder="${key ? 'Key saved · paste a new one to replace it' : 'sk-ant-…'}">
          <button class="btn primary" data-act="savekey">Save key</button></div>
        ${key ? `<div class="row2"><span class="note">A key is saved in this browser.</span><button class="link" data-act="clearkey">Remove key</button></div>` : ''}
        <div class="row2"><label for="ai-model">Model</label><select id="ai-model" data-ch="aiModel">${MODELS.map(([v, l]) => `<option value="${v}" ${S.aiModel === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></section>
      <section class="cz-sec"><h3>Score cards</h3><div class="opts">
        ${opt('quarters', 'Quarter-by-quarter scores')}${opt('winprob', 'Live win chance bar')}${opt('leaders', 'Top scorer under each team')}${opt('lastplay', 'Last play (live) and recap line (final)')}</div></section>
      <section class="cz-sec"><h3>Spoiler mode</h3><label class="chk"><input type="checkbox" id="spoilers" data-ch="spoilers" ${S.spoilers ? 'checked' : ''}> Hide scores until I open a game</label>
        <p class="hint">Hides scores, win chances, leaders, recaps and results. Each card gets a Show score button.</p></section>
      <section class="cz-sec"><h3>Live updates</h3><div class="row2"><label for="refresh">Refresh while games are live</label>
        <select id="refresh" data-ch="refresh">${[10, 15, 30, 60].map(s => `<option value="${s}" ${S.refresh === s ? 'selected' : ''}>Every ${s} seconds</option>`).join('')}</select></div>
        <p class="hint">With no live games it checks every 2 minutes, and it pauses while this tab is in the background.</p></section>
      <section class="cz-sec"><h3>Look</h3>
        <div class="row2"><span>Game times</span>${seg('tz', [['et', 'Eastern (ET)'], ['local', 'My time zone']], 'Game times')}</div>
        <div class="row2"><span>Theme</span>${seg('theme', [['system', 'Match system'], ['light', 'Light'], ['dark', 'Dark']], 'Theme')}</div>
        <div class="row2"><span>Density</span>${seg('density', [['comfortable', 'Comfortable'], ['compact', 'Compact']], 'Density')}</div>
        <div class="row2"><span>Box score columns</span>${seg('boxCols', [['compact', 'Key stats'], ['full', 'All stats']], 'Box score columns')}</div></section>
      <section class="cz-sec"><button class="btn" data-act="reset">${UI.resetArmed ? 'Click again to reset settings' : 'Reset settings'}</button>
        <p class="hint">Resetting keeps your saved API key.</p></section>
    </div>`;
  const top = el.scrollTop;
  if (UI.paint(el, html)) el.scrollTop = top;
}
function applyLook() {
  const r = document.documentElement;
  if (NBA.S.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', NBA.S.theme);
  r.setAttribute('data-density', NBA.S.density);
}
UI.applyLook = applyLook;
function repaintAll() {
  document.querySelectorAll('#view, #tabbar, #drawer, #settings').forEach(el => { el._html = null; });
  NBA.render();
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (NBA.S.theme === 'system') repaintAll(); });

/* ---------- events ---------- */
Object.assign(NBA.actions, {
  game: a => UI.openGame(a.dataset.id, a),
  reveal: a => { UI.st.revealed.add(a.dataset.id); NBA.changed(); },
  close: () => UI.closeAll(),
  settings: a => UI.openSettings(a),
  dtab: a => { if (UI.drawer) { UI.drawer.tab = a.dataset.v; renderDrawer(); } },
  sort: a => {
    if (!UI.drawer) return;
    const k = a.dataset.k, s = UI.drawer.sort;
    UI.drawer.sort = !k ? null : (s && s.k === k ? { k, desc: !s.desc } : { k, desc: true });
    renderDrawer();
  },
  allplays: () => { if (UI.drawer) { UI.drawer.showAll = true; renderDrawer(); } },
  fav: a => {
    const id = a.dataset.id, S = NBA.S, i = S.favorites.indexOf(id);
    if (i >= 0) S.favorites.splice(i, 1); else S.favorites.push(id);
    NBA.save(); repaintAll();
  },
  set: a => {
    NBA.S[a.dataset.k] = a.dataset.v; NBA.save();
    if (a.dataset.k === 'theme' || a.dataset.k === 'density') applyLook();
    repaintAll();
  },
  savekey: () => {
    const inp = $('#ai-key'), v = inp.value.trim();
    if (!v) { inp.focus(); return; }
    NBA.aiKey.set(v); inp.value = '';
    $('#settings')._html = null; renderSettings();
    if (NBA.ask) NBA.ask.keyChanged();
  },
  clearkey: () => { NBA.aiKey.set(''); $('#settings')._html = null; renderSettings(); if (NBA.ask) NBA.ask.keyChanged(); },
  reset: () => {
    if (!UI.resetArmed) { UI.resetArmed = true; renderSettings(); setTimeout(() => { if (UI.resetArmed) { UI.resetArmed = false; renderSettings(); } }, 4000); return; }
    UI.resetArmed = false; NBA.resetSettings(); applyLook(); repaintAll();
  },
});
Object.assign(NBA.changes, {
  card: t => { NBA.S.card[t.dataset.k] = t.checked; NBA.save(); NBA.changed(); },
  spoilers: t => { NBA.S.spoilers = t.checked; UI.st.revealed.clear(); NBA.save(); NBA.changed(); },
  refresh: t => { NBA.S.refresh = +t.value; NBA.save(); NBA.reschedule(); },
  myTeam: t => { NBA.S.myTeam = t.value; NBA.save(); repaintAll(); },
  aiModel: t => { NBA.S.aiModel = t.value; NBA.save(); },
  scoring: t => { if (UI.drawer) { UI.drawer.scoringOnly = t.checked; renderDrawer(); } },
});
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a || a.disabled) return;
  const fn = NBA.actions[a.dataset.act];
  if (fn) { e.preventDefault(); fn(a, e); }
});
document.addEventListener('change', e => {
  const t = e.target, ch = t.dataset && t.dataset.ch;
  if (ch && NBA.changes[ch]) NBA.changes[ch](t, e);
});
document.addEventListener('input', e => {
  const t = e.target, ch = t.dataset && t.dataset.in;
  if (ch && NBA.changes[ch]) NBA.changes[ch](t, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (NBA.ask && NBA.ask.isOpen()) { NBA.ask.close(); return; }
    if (UI.drawer || UI.settingsOpen) { UI.closeAll(); return; }
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#ask-input').focus(); }
});

/* ---------- boot ---------- */
NBA.boot = () => {
  applyLook();
  const { tab } = UI.route();
  if (tab !== 'schedule') document.title = `${(TABS.find(t => t.id === tab) || {}).label || 'NBA'} · NBA`;
  NBA.need('standings').catch(() => {});
  NBA.render();
  setInterval(renderUpdated, 1000);
  NBA.poll();
};
})();
