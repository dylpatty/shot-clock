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
  down: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  star: '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.4L8 11.2 4.1 13.4 5 9 1.7 6l4.4-.5z" fill="currentColor"/></svg>',
  gear: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M3 6h8M15 6h2M3 14h2M9 14h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/><circle cx="13" cy="6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="7" cy="14" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
};

/* ---------- small components ---------- */
UI.logo = (t, size = 28, cls = '') => `<img class="${cls}" src="${esc(NBA.lg(t))}" alt="" width="${size}" height="${size}" loading="lazy">`;
UI.hs = (url, cls = 'hs') => url ? `<img class="${cls}" src="${esc(url)}" alt="" loading="lazy">` : `<span class="${cls}"></span>`;
UI.teamLink = id => `#teams/${id}`;
UI.isFav = g => NBA.S.favorites.includes(g.away.id) || NBA.S.favorites.includes(g.home.id);
UI.isMine = g => g.away.id === NBA.S.myTeam || g.home.id === NBA.S.myTeam;
UI.tipTime = g => {
  if (/TBD/i.test(g.detail)) return 'Time TBD';
  const mins = Math.round((new Date(g.date) - Date.now()) / 60000);
  return NBA.fmtTime(g.date) + (mins > 0 && mins <= 60 ? ` · in ${mins}m` : '');
};
UI.oddsText = o => !o ? '' : [o.details, o.ou ? 'O/U ' + o.ou : ''].filter(Boolean).join(' · ');
/* "opened -2.5" when DraftKings has moved a line since it opened */
UI.moved = (m, prefix = '') => m && m.open !== '' && m.now !== '' && String(m.open) !== String(m.now) ? `opened ${prefix}${m.open}` : '';

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
  else {
    const sum = NBA.data('summary:' + g.id);
    status = `<span>${esc(g.detail)}${sum && sum.ended ? ' · ended ' + esc(NBA.fmtTime(sum.ended)) : ''}</span>`;
  }
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
  return `<div class="game${big ? ' big' : ''}${UI.isFav(g) ? ' fav' : ''}${UI.isMine(g) ? ' mine' : ''}" role="button" tabindex="0" data-act="game" data-id="${g.id}" aria-label="${esc(label)}">
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
  return `<li class="line${UI.isFav(g) ? ' fav' : ''}${UI.isMine(g) ? ' mine' : ''}" role="button" tabindex="0" data-act="game" data-id="${g.id}" aria-label="${esc(g.away.full)} at ${esc(g.home.full)}">
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
  { id: 'home', label: 'Home' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'standings', label: 'Standings' },
  { id: 'stats', label: 'Stats' },
  { id: 'odds', label: 'Odds' },
  { id: 'news', label: 'Injuries & News' },
  { id: 'myteam' },
  { id: 'teams', label: 'Teams' },
  { id: 'facts', label: 'Fun Facts' },
  { id: 'games', label: 'Games' },
  { id: 'players', label: 'Players' },
];
UI.route = () => {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  const [tab, arg] = h.split('/');
  return { tab: TABS.some(t => t.id === tab) ? tab : 'home', arg: arg || '' };
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
  // While games are live the header shows only a red live button with the count; it opens the schedule.
  // Painted only when it changes, so the blinking dot isn't recreated (and restarted) on every refresh.
  UI.paint(pill, live == null ? '' : live ? `<a class="live-btn" href="#schedule" data-act="golive" aria-label="${live} game${live > 1 ? 's' : ''} live now, open the schedule"><i class="dot blink"></i>${live} live</a>` : 'No games live');
  const mt = NBA.T(NBA.S.myTeam);
  if (NBA.S.teamTheme && hasColors(mt) && UI.lookKey !== mt.id + mt.color + mt.alt + NBA.S.theme) applyLook();
  const teams = [...NBA.teams.values()].filter(t => t.abbr && t.full).sort((a, b) => a.full.localeCompare(b.full));
  UI.paint($('#teampick'), `${mt.logo ? UI.logo(mt, 22) : ''}<span class="ht-col"><label class="ht-lbl" for="team-pick">Favorite team</label>
    <select id="team-pick" data-ch="myTeam" title="Favorite team">${teams.length
      ? teams.map(t => `<option value="${t.id}" ${t.id === NBA.S.myTeam ? 'selected' : ''}>${esc(t.full)}</option>`).join('')
      : `<option value="${esc(NBA.S.myTeam)}">${esc(mt.full || 'Golden State Warriors')}</option>`}</select></span>`);
  renderUpdated();
}
// The header only speaks up when ESPN can't be reached; data refreshes quietly in the background otherwise
function renderUpdated() {
  const el = $('#upd');
  el.className = NBA.failing ? 'upd err' : 'upd';
  el.textContent = NBA.failing ? "Can't reach ESPN · retrying" : '';
}
let lastTab = null, lastRoute = null;
function renderView() {
  const { tab, arg } = UI.route();
  const view = $('#view');
  const fn = NBA.views[tab];
  if (!fn) return;
  // A new tab or page opens at the top (on Schedule, today's games), not wherever the last one was scrolled
  const routeKey = tab + '/' + arg;
  if (routeKey !== lastRoute) { if (lastRoute !== null) window.scrollTo(0, 0); lastRoute = routeKey; }
  if (tab !== lastTab) { view._html = null; lastTab = tab; }
  // Lets the stylesheet give a tab its own page layout (the Schedule's right-hand performers rail)
  document.documentElement.dataset.tab = tab;
  const html = fn(arg), season = $('#season');
  // iPhone Safari doesn't hold the scroll still when today's games above change height, so when the
  // rest-of-season list is scrolled into, keep it where it was (Chrome's own correction leaves nothing to do)
  const t0 = tab === 'schedule' && view._html !== html ? season.getBoundingClientRect().top : 0;
  const changed = UI.paint(view, html);
  // The rest-of-season list under the schedule only shows on that tab
  if (tab !== 'schedule') { UI.paint(season, ''); UI.paint($('#pband'), ''); }
  if (NBA.after[tab]) NBA.after[tab](view, changed);
  if (t0 < 0) { const dy = season.getBoundingClientRect().top - t0; if (dy) window.scrollBy(0, dy); }
}
NBA.render = () => {
  renderHeader();
  renderTabs();
  renderView();
  if (UI.drawer) renderDrawer();
  if (UI.settingsOpen) renderSettings();
  if (NBA.ask && NBA.ask.render) NBA.ask.render();
  // Repaints recreate live dots and card glows; tying their pulse to the page clock lets a new one carry on mid-beat instead of restarting
  if (document.getAnimations) document.getAnimations().forEach(a => { if (a.animationName === 'blink' || a.animationName === 'glow') a.startTime = 0; });
};
window.addEventListener('hashchange', () => {
  const { tab } = UI.route();
  document.title = tab === 'home' ? 'NBA' : `${(TABS.find(t => t.id === tab) || {}).label || NBA.T(NBA.S.myTeam).name || 'NBA'} · NBA`;
  window.scrollTo(0, 0);
  NBA.render();
});

/* ---------- overlays ---------- */
function lock(on) {
  const b = document.body;
  // Windows scrollbars take up room: pad the page by the scrollbar it's about to lose, so nothing shifts sideways
  if (on !== b.classList.contains('locked')) b.style.paddingRight = on ? Math.max(0, innerWidth - document.documentElement.clientWidth) + 'px' : '';
  b.classList.toggle('locked', on);
  $('#scrim').hidden = !on;
}
UI.closeAll = fromHistory => {
  const had = UI.drawer || UI.settingsOpen;
  UI.drawer = null; UI.settingsOpen = false; UI.resetArmed = false;
  $('#drawer').hidden = true; $('#settings').hidden = true;
  lock(false);
  if (UI.histPushed) { UI.histPushed = false; if (fromHistory !== true) history.back(); }
  if (had && UI.lastFocus && document.contains(UI.lastFocus)) UI.lastFocus.focus();
};
/* The game view takes a history entry, so the browser's back button or a phone's back swipe closes it */
window.addEventListener('popstate', () => { if (UI.drawer || UI.settingsOpen) UI.closeAll(true); else UI.histPushed = false; });
/* On touch screens, a sideways swipe closes the game view (except inside tables and the chart, which scroll sideways) */
(() => {
  const el = document.getElementById('drawer');
  let x0 = 0, y0 = 0, armed = false;
  el.addEventListener('touchstart', e => {
    const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY;
    armed = e.touches.length === 1 && !e.target.closest('.tblwrap, .dtabs, .wpwrap');
  }, { passive: true });
  el.addEventListener('touchend', e => {
    if (!armed || !UI.drawer) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 90 && Math.abs(dx) > 2 * Math.abs(dy)) UI.closeAll();
  }, { passive: true });
})();

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
  if (!UI.histPushed) { history.pushState({ nbaGame: id }, ''); UI.histPushed = true; }
  $('#drawer').hidden = false; lock(true);
  $('#drawer')._html = null;
  renderDrawer();
  $('#drawer').scrollTop = 0;
  const c = $('#drawer [data-act="close"]'); if (c) c.focus();
  NBA.need('summary:' + id, true).catch(() => {});
  NBA.changed();
};
/* A player's card opens in the same window as a game, so closing, the back button and swipes all work the same way */
UI.openPlayer = (id, opener) => {
  UI.lastFocus = opener || document.activeElement;
  UI.drawer = { kind: 'player', id: String(id) };
  UI.settingsOpen = false; $('#settings').hidden = true;
  if (!UI.histPushed) { history.pushState({ nbaPlayer: id }, ''); UI.histPushed = true; }
  $('#drawer').hidden = false; lock(true);
  $('#drawer')._html = null;
  renderDrawer();
  $('#drawer').scrollTop = 0;
  const c = $('#drawer [data-act="close"]'); if (c) c.focus();
};
NBA.pollHooks.push({
  live: () => { const d = UI.drawer && NBA.data('summary:' + UI.drawer.id); return !!(d && d.state === 'in'); },
  run: () => {
    if (!UI.drawer || UI.drawer.kind === 'player') return null;
    const k = 'summary:' + UI.drawer.id, d = NBA.data(k), g = findGame(UI.drawer.id);
    // A game opened before tip-off is refetched once tip is near (or the scoreboard says it started), so it turns live on its own
    const tipping = d && d.state === 'pre' && ((g && g.state !== 'pre') || new Date(d.date) - Date.now() < 15 * 60000);
    return (!d || d.state === 'in' || tipping) ? NBA.need(k, true) : null;
  },
});
function renderDrawer() {
  const d = UI.drawer, el = $('#drawer');
  if (!d) return;
  el.classList.toggle('pmodal', d.kind === 'player');
  if (d.kind === 'player') { UI.paint(el, NBA.playerCard ? NBA.playerCard(d.id) : ''); return; }
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
      const o = g.odds, sm = o && UI.moved(o.spreadHome, g.home.abbr + ' '), tm = o && UI.moved(o.total);
      html += `<div class="dpad pre-meta" style="justify-content:center;padding-bottom:12px">${g.tv ? `<span>TV <b>${esc(g.tv)}</b></span>` : ''}${o && o.details ? `<span>Line <b>${esc(o.details)}</b>${sm ? ` (${esc(sm)})` : ''}</span>` : ''}${o && o.ou ? `<span>O/U <b>${esc(o.ou)}</b>${tm ? ` (${esc(tm)})` : ''}</span>` : ''}${o && o.awayML ? `<span>Moneyline <b>${esc(g.away.abbr)} ${esc(o.awayML)} · ${esc(g.home.abbr)} ${esc(o.homeML)}</b></span>` : ''}${g.venue ? `<span>${esc(g.venue)}</span>` : ''}</div>`;
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
  // Live refreshes rebuild the tables, so keep each one scrolled sideways where it was (not on a freshly opened game)
  const xs = el._html ? [...el.querySelectorAll('.tblwrap')].map(w => w.scrollLeft) : [];
  if (UI.paint(el, html)) {
    el.querySelectorAll('.tblwrap').forEach((w, i) => { if (xs[i]) w.scrollLeft = xs[i]; });
    // Setting scrollTop stops an iPhone flick mid-glide, so only put it back if the repaint moved it
    if (el.scrollTop !== top) el.scrollTop = top;
    if (data && d.tab === 'wp') bindWp(data);
  }
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
  else out += tools + `<div class="box-pair">${[data.away, data.home].map(t => data.box.find(b => b.teamId === t.id)).filter(Boolean).map(b => boxTeam(b, d)).join('')}</div>`;
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
  const S = NBA.S, t = NBA.T(S.myTeam);
  const seg = (k, opts, label) => `<div class="seg big" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button data-act="set" data-k="${k}" data-v="${v}" aria-pressed="${(S[k] || '') === v}">${l}</button>`).join('')}</div>`;
  const sw = c => c ? `<i class="swatch" style="background:${esc(c)}"></i>` : '';
  const html = `
    <div class="dr-bar dpad"><button class="ib" data-act="close" aria-label="Close settings">${UI.I.close}</button><span class="dr-title" id="st-title">Settings</span><span class="note">Saves automatically</span></div>
    <div class="dpad">
      <section class="cz-sec"><h3>Theme</h3>${seg('theme', [['light', 'Light'], ['dark', 'Dark']], 'Theme')}</section>
      <section class="cz-sec"><h3>Colors</h3><p class="hint">Use your favorite team's colors for highlights, buttons and the header. Change your favorite team at the top of the page.</p>
        ${seg('teamTheme', [['', 'Standard'], ['1', `${t.logo ? UI.logo(t, 18) : ''}${esc(t.name || 'Team')} colors ${sw(t.color)}${sw(t.alt)}`]], 'Colors')}</section>
      <section class="cz-sec"><h3>No spoilers</h3><label class="chk"><input type="checkbox" id="spoilers" data-ch="spoilers" ${S.spoilers ? 'checked' : ''}> Hide scores until I open a game</label>
        <p class="hint">Hides scores, win chances, leaders, recaps and results. Each card gets a Show score button.</p></section>
      <p class="hint">Live scores refresh every 10 seconds while games are on. Everything else refreshes on its own through the day.</p>
    </div>`;
  const top = el.scrollTop;
  if (UI.paint(el, html)) el.scrollTop = top;
}
const TEAM_VARS = ['--accent', '--accent-soft', '--accent-ink', '--chrome'];
// A team known only from standings has no colors yet, and ESPN's stand-in is gray
function hasColors(t) { return !!t.abbr && /^#[0-9a-f]{6}$/i.test(t.color || '') && t.color !== '#888888'; }
function applyLook() {
  const r = document.documentElement;
  if (NBA.S.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', NBA.S.theme);
  r.setAttribute('data-density', NBA.S.density);
  // Team colors: accents from the favorite team, and a header tinted with its deeper color.
  // Until ESPN has sent the team's colors, keep the look remembered from the last visit.
  const team = NBA.T(NBA.S.myTeam);
  if (NBA.S.teamTheme && !hasColors(team)) return;
  UI.lookKey = NBA.S.teamTheme ? team.id + team.color + team.alt + NBA.S.theme : '';
  const a = NBA.S.teamTheme ? NBA.accentFor(team) : null;
  let look = null;
  if (a) {
    const dark = NBA.isDark();
    look = { '--accent': a.accent, '--accent-ink': a.ink,
      '--accent-soft': `color-mix(in srgb, ${a.accent} ${dark ? 22 : 16}%, ${dark ? '#151A21' : '#FFFFFF'})`,
      '--chrome': `color-mix(in srgb, ${a.base} ${dark ? 26 : 18}%, ${dark ? '#07090C' : '#E2E5EA'})` };
    Object.entries(look).forEach(([k, v]) => r.style.setProperty(k, v));
  } else TEAM_VARS.forEach(k => r.style.removeProperty(k));
  // Remembered so the next visit paints in team colors straight away
  try { if (look) localStorage.setItem('nba.look', JSON.stringify(look)); else localStorage.removeItem('nba.look'); } catch (e) { /* storage blocked */ }
}
UI.applyLook = applyLook;
function repaintAll() {
  document.querySelectorAll('#view, #tabbar, #drawer, #settings').forEach(el => { el._html = null; });
  NBA.render();
}

/* ---------- events ---------- */
Object.assign(NBA.actions, {
  game: a => UI.openGame(a.dataset.id, a),
  reveal: a => { UI.st.revealed.add(a.dataset.id); NBA.changed(); },
  close: () => UI.closeAll(),
  settings: a => UI.openSettings(a),
  // The header's live button always lands on today's live games, even from another day or deep in the season list
  golive: () => {
    NBA.dayParam = '';
    if (UI.route().tab !== 'schedule') location.hash = '#schedule'; // the hashchange handler scrolls to the top and re-renders
    else { window.scrollTo(0, 0); NBA.changed(); }
  },
  dtab: a => { if (UI.drawer) { UI.drawer.tab = a.dataset.v; renderDrawer(); } },
  sort: a => {
    if (!UI.drawer) return;
    const k = a.dataset.k, s = UI.drawer.sort;
    UI.drawer.sort = !k ? null : (s && s.k === k ? { k, desc: !s.desc } : { k, desc: true });
    renderDrawer();
  },
  allplays: () => { if (UI.drawer) { UI.drawer.showAll = true; renderDrawer(); } },
  // Only the theme and team colors can be set here; everything else is fixed
  set: a => {
    const k = a.dataset.k;
    if (k !== 'theme' && k !== 'teamTheme' && k !== 'boxCols') return;
    NBA.S[k] = a.dataset.v; NBA.save();
    applyLook();
    repaintAll();
  },
});
Object.assign(NBA.changes, {
  spoilers: t => { NBA.S.spoilers = t.checked; UI.st.revealed.clear(); NBA.save(); NBA.changed(); },
  // The favorite team is also the highlighted team, and drives the team-colors theme
  myTeam: t => { if (!t.value) return; NBA.S.myTeam = t.value; NBA.S.favorites = [t.value]; NBA.save(); applyLook(); repaintAll(); },
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
  if (tab !== 'home') document.title = `${(TABS.find(t => t.id === tab) || {}).label || 'NBA'} · NBA`;
  NBA.need('standings').catch(() => {});
  // The favorite team's schedule also supplies its colors on days it isn't on today's scoreboard
  NBA.need('tsched:' + NBA.S.myTeam).catch(() => {});
  NBA.render();
  setInterval(renderUpdated, 1000);
  NBA.poll();
};
})();
