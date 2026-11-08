/* Shell: header, bookmark tabs, routing, shared components, game drawer and settings */
(() => {
'use strict';

const NBA = window.NBA;
const { esc } = NBA;
const $ = (s, r = document) => r.querySelector(s);
const UI = NBA.ui = { st: { revealed: new Set(), perfCat: 'points' } };
/* Games opened or shown with "Show score" stay revealed for a week, across launches: iOS often closes a Home Screen
   app in the background, which used to hide every one of them again. Kept as { id: when } in localStorage, newest 300 */
const REVEAL_KEY = 'nba.revealed.v1', REVEAL_FOR = 7 * 864e5;
const reveals = () => { try { const m = JSON.parse(localStorage.getItem(REVEAL_KEY) || 'null'); return m && typeof m === 'object' ? m : {}; } catch (e) { return {}; } };
Object.entries(reveals()).forEach(([id, t]) => { if (Date.now() - t < REVEAL_FOR) UI.st.revealed.add(id); });
UI.reveal = id => {
  id = String(id);
  UI.st.revealed.add(id);
  const now = Date.now(), m = reveals();
  m[id] = now;
  const keep = Object.entries(m).filter(([, t]) => now - t < REVEAL_FOR).sort((a, b) => b[1] - a[1]).slice(0, 300);
  try { localStorage.setItem(REVEAL_KEY, JSON.stringify(Object.fromEntries(keep))); } catch (e) { /* storage blocked: reveals last for this visit */ }
};
// A reload for a new build (checkBuild) leaves what was only in memory in sessionStorage; pick it back up once.
// (Builds before reveals were kept in localStorage left them here too)
try {
  const k = JSON.parse(sessionStorage.getItem('nba.keep') || 'null');
  sessionStorage.removeItem('nba.keep');
  if (k) { const { revealed, day, ...rest } = k; (revealed || []).forEach(UI.reveal); if (day) NBA.dayParam = day; Object.keys(rest).forEach(key => { if (rest[key] != null) UI.st[key] = rest[key]; }); }
} catch (e) { /* storage blocked: start fresh */ }
NBA.views = {};
NBA.actions = {};
NBA.changes = {};
NBA.after = {};

UI.I = {
  left: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  expand: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ext: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  star: '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.4L8 11.2 4.1 13.4 5 9 1.7 6l4.4-.5z" fill="currentColor"/></svg>',
  gear: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M3 6h8M15 6h2M3 14h2M9 14h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/><circle cx="13" cy="6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="7" cy="14" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  // YouTube's play mark, white on the red button
  yt: '<svg viewBox="0 0 34 24" width="34" height="24" aria-hidden="true"><rect width="34" height="24" rx="7" fill="#fff"/><path d="M13.5 6.6v10.8l9.4-5.4z" fill="#FF0000"/></svg>',
  cal: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

/* ---------- small components ---------- */
// Logos are asked for at about 3x their CSS size, in three widths so the browser cache is shared
UI.logo = (t, size = 28, cls = '') => { const px = size * 3, w = px <= 96 ? 96 : px <= 192 ? 192 : 384; return `<img class="${cls}" src="${esc(NBA.img(NBA.lg(t), w))}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`; };
// Headshots are 600x436; w is the pixel width to request (the default suits the 44x33 thumbnails)
UI.hs = (url, cls = 'hs', w = 132) => url ? `<img class="${cls}" src="${esc(NBA.img(url, w))}" alt="" loading="lazy" decoding="async">` : `<span class="${cls}"></span>`;
// The ▶ Full highlights chip on a finished game once the NBA has posted them; the yt action plays them in the #vid player
UI.fullChip = g => {
  const v = g.state === 'post' && g.completed !== false ? NBA.fullHl(g.id) : null;
  return v ? `<button class="chip hl-chip" ${NBA.ytAttrs(v, g)}>▶ Full highlights${v.dur ? ' · ' + NBA.fmtDur(v.dur) : ''}</button>` : '';
};
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
  // A postponed or canceled game is 'post' without being completed: no score, nothing to hide
  const pp = g.state === 'post' && g.completed === false;
  const hide = S.spoilers && g.state !== 'pre' && !pp && !UI.st.revealed.has(g.id);
  const showQ = S.card.quarters && g.state !== 'pre' && !pp;
  const nq = showQ ? Math.max(4, g.away.lines.length, g.home.lines.length) : 0;
  const cols = `minmax(0,1fr)${nq ? ` repeat(${nq},minmax(1.8em,auto))` : ''} auto`;
  const head = nq ? `<span></span>${Array.from({ length: nq }, (_, i) => `<span class="hd">${i < 4 ? i + 1 : perLabel(i + 1)}</span>`).join('')}<span class="hd" style="text-align:right">T</span>` : '';
  // A hidden game hides the records too: after the final they already count tonight's result
  const row = t => {
    const lost = g.state === 'post' && !pp && !hide && t.winner === false;
    const qs = nq ? Array.from({ length: nq }, (_, i) => `<span class="q">${hide ? '·' : esc(t.lines[i] ?? '')}</span>`).join('') : '';
    const bump = !hide && NBA.bumps.has(g.id + ':' + t.id) ? ' bump' : '';
    const score = g.state === 'pre' || pp ? '' : hide ? '–' : esc(t.score);
    const fav = S.favorites.includes(t.id) ? `<span class="star" title="Your team">${UI.I.star}</span>` : '';
    const l = t.leaders.find(x => x.cat === 'points');
    const ldr = g.state !== 'pre' && !pp && S.card.leaders && l && !hide ?`<span class="ldr-row" title="${esc(t.abbr)} top scorer">${esc(l.full || l.short)} <b>${esc(l.value)}</b> pts</span>` : '';
    return `<div class="team${lost ? ' lost' : ''}">${UI.logo(t, big ? 40 : 30)}
      <span class="tn"><span class="ab">${esc(t.abbr)}${fav}<span class="rec">${hide ? '' : esc(t.record)}</span></span></span></div>${qs}<span class="sc${lost ? ' lostsc' : ''}${bump}">${score}</span>${ldr}`;
  };
  let status;
  if (g.state === 'in') status = `<span class="st-live"><i class="dot blink"></i>${esc(NBA.detail(g))}</span>`;
  else if (g.state === 'pre') status = `<span>${esc(UI.tipTime(g))}</span>`;
  else {
    const sum = NBA.data('summary:' + g.id);
    status = `<span>${esc(g.detail)}${sum && sum.ended ? ' · ended ' + esc(NBA.fmtTime(sum.ended)) : ''}</span>`;
  }
  const started = !pp && g.state !== 'pre' && !/TBD/i.test(g.detail) ? 'Started ' + NBA.fmtTime(g.date) : '';
  // Top right: where the game streams in Canada (Prime Video, Sportsnet+, TSN, NBA TV Canada or League Pass), blank if
  // unknown. It never shrinks; the start time and note before it are cut short first on a narrow card
  const ca = NBA.caTv(g), lead = [started, g.note].filter(Boolean).join(' · ');
  const right = (lead ? `<span class="g-lead">${esc(lead)}</span>` : '') + (ca ? `<span class="ca-tv" title="${esc(`Streams in Canada on ${ca.label}`)}">${esc(ca.short)}</span>` : '');
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
      extra += `<div class="pre-meta">${g.odds && g.odds.details ? `<span>Line <b>${esc(g.odds.details)}</b></span>` : ''}${g.odds && g.odds.ou ? `<span>O/U <b>${esc(g.odds.ou)}</b></span>` : ''}${g && g.venue ? `<span>${esc(g.venue)}</span>` : ''}</div>`;
    }
    if (S.card.lastplay) {
      if (g.state === 'in' && g.lastPlay) extra += `<div class="last"><span class="lbl">Last play</span><span title="${esc(g.lastPlay)}">${esc(g.lastPlay)}</span></div>`;
      else if (g.state === 'post' && g.recap) extra += `<div class="last"><span class="lbl">Recap</span><span title="${esc(g.recap)}">${esc(g.recap)}</span></div>`;
    }
    const chip = UI.fullChip(g);
    if (chip) extra += `<div class="g-hl">${chip}</div>`;
  }
  const label = `${g.away.full} at ${g.home.full}, ${g.state === 'pre' ? UI.tipTime(g) : NBA.detail(g)}`;
  return `<div class="game${big ? ' big' : ''}${UI.isFav(g) ? ' fav' : ''}${UI.isMine(g) ? ' mine' : ''}" role="button" tabindex="0" data-act="game" data-id="${g.id}" aria-label="${esc(label)}">
    <div class="g-top">${status}<span class="g-right">${right}</span></div>
    <div class="ls" style="grid-template-columns:${cols}">${head}${row(g.away)}${row(g.home)}</div>${extra}</div>`;
};

UI.line = g => {
  const pp = g.state === 'post' && g.completed === false;
  const hide = NBA.S.spoilers && g.state !== 'pre' && !pp && !UI.st.revealed.has(g.id);
  let time;
  if (g.state === 'pre') time = `${esc(/TBD/i.test(g.detail) ? 'TBD' : NBA.fmtTime(g.date))}<small>${esc((NBA.caTv(g) || {}).short || '')}</small>`;
  else if (g.state === 'in') time = `<span class="st-live"><i class="dot blink"></i>Live</span><small>${esc(NBA.detail(g))}</small>`;
  else if (pp) time = esc(g.detail || 'Postponed');
  else time = `${esc(g.detail || 'Final')}<small>Started ${esc(NBA.fmtTime(g.date))}</small>`;
  const side = (t, home) => {
    const sc = g.state !== 'pre' && !pp && !hide ? `<span class="ln-score">${esc(t.score)}</span>` : '';
    const name = `<b><span class="full">${esc(t.name || t.abbr)}</span><span class="abbr">${esc(t.abbr)}</span></b>`;
    const rec = `<small>${hide ? '' : esc(t.record)}</small>`;
    return home
      ? `<span class="ln-team home">${sc}${rec}${name}${UI.logo(t, 26)}</span>`
      : `<span class="ln-team away">${UI.logo(t, 26)}${name}${rec}${sc}</span>`;
  };
  return `<li class="line${UI.isFav(g) ? ' fav' : ''}${UI.isMine(g) ? ' mine' : ''}" role="button" tabindex="0" data-act="game" data-id="${g.id}" aria-label="${esc(g.away.full)} at ${esc(g.home.full)}">
    <span class="ln-time">${time}</span>${side(g.away, false)}<span class="ln-at">@</span>${side(g.home, true)}<span class="ln-odds">${esc(UI.oddsText(g.odds))}</span></li>`;
};

/* Re-rendering replaces nodes; skip identical HTML and put keyboard focus back on the equivalent control.
   A dropdown that's open (focused) is never rebuilt under the finger: on an iPhone that closes its menu, and focusing
   the new one opens the menu a second time. Its new HTML goes in when it loses focus, without taking focus back */
UI.paint = (el, html) => {
  if (!el) return false;
  // A sideways strip under a finger, or still gliding, isn't rebuilt either (see UI.heldStrip below)
  if (UI.heldStrip && el.contains(UI.heldStrip)) return false;
  const a = document.activeElement;
  if (a && a.tagName === 'SELECT' && el.contains(a)) {
    el._pending = html;
    // The flag lives on this dropdown, so a replaced one gets its own; any later paint also applies the newest HTML
    if (!a._paintOnBlur) {
      a._paintOnBlur = true;
      a.addEventListener('blur', () => setTimeout(() => {
        a._paintOnBlur = false;
        if (el._pending != null) UI.paint(el, el._pending);
      }, 0), { once: true });
    }
    return false;
  }
  el._pending = null;
  if (el._html === html) return false;
  el._html = html;
  let sel = null, caret = null;
  if (a && a.tagName === 'INPUT' && el.contains(a)) { try { caret = [a.selectionStart, a.selectionEnd]; } catch (e) { caret = null; } }
  if (a && a !== document.body && el.contains(a)) {
    if (a.id) sel = '#' + CSS.escape(a.id);
    else {
      const parts = ['act', 'ch', 'id', 'k', 'v'].filter(k => a.dataset[k] != null).map(k => `[data-${k}="${CSS.escape(a.dataset[k])}"]`);
      if (parts.length) sel = parts.join('');
    }
  }
  // Sideways strips marked data-sx (the video rows) keep their place when the part around them is rebuilt
  const sx = {};
  el.querySelectorAll('[data-sx]').forEach(n => { if (n.scrollLeft) sx[n.dataset.sx] = n.scrollLeft; });
  el.innerHTML = html;
  UI.tick(el);
  for (const k in sx) { const n = el.querySelector(`[data-sx="${CSS.escape(k)}"]`); if (n) n.scrollLeft = sx[k]; }
  if (sel) {
    const n = el.querySelector(sel);
    if (n) {
      n.focus({ preventScroll: true });
      if (caret && caret[0] != null) { try { n.setSelectionRange(caret[0], caret[1]); } catch (e) { /* not a text input */ } }
    }
  }
  return true;
};

/* Text that changes with the clock ("5m ago", a Social game chip's live score) stays out of the HTML. UI.paint only skips
   identical HTML, so one "5m ago" turning "6m ago" used to rebuild a whole feed of avatars and pictures every minute,
   and a chip's score on every 10 s poll. Such text goes in as an empty element with data-tk naming its ticker in
   UI.tickers (data-t holds the time, data-g the game), and UI.tick writes it: into each part UI.paint puts in, at the
   end of every render, and every 30 s. A ticker gets the element and returns its text */
UI.tickers = { rel: n => n.dataset.t ? NBA.relTime(+n.dataset.t) : '' };
UI.tick = (root = document) => {
  root.querySelectorAll('[data-tk]').forEach(n => {
    const f = UI.tickers[n.dataset.tk], v = f ? String(f(n) ?? '') : '';
    if (n.textContent !== v) n.textContent = v;
  });
};
setInterval(() => { if (!document.hidden) UI.tick(); }, 30000);

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
  { id: 'videos', label: 'Videos' },
  { id: 'social', label: 'Social' },
];
UI.route = () => {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  const [tab, arg] = h.split('/');
  return { tab: TABS.some(t => t.id === tab) ? tab : 'home', arg: arg || '' };
};
let tabShown = null;
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
  // On phones most tabs are off-screen: bring a newly selected one to the middle of the bar
  const tb = $('#tabbar');
  if (tab !== tabShown) {
    const a = tb.querySelector('[aria-selected="true"]');
    if (a) {
      const r = a.getBoundingClientRect(), R = tb.getBoundingClientRect();
      tb.scrollTo({ left: Math.max(0, tb.scrollLeft + r.left - R.left - (R.width - r.width) / 2), behavior: tabShown && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
    }
    tabShown = tab;
  }
  // .more fades the right edge while tabs are still hidden past it
  const more = () => tb.classList.toggle('more', tb.scrollLeft + tb.clientWidth < tb.scrollWidth - 4);
  if (!tb._moreBound) {
    tb._moreBound = true; tb.addEventListener('scroll', more, { passive: true }); window.addEventListener('resize', more);
    // On a laptop too narrow for every tab, the mouse wheel scrolls the bar sideways (it has no visible scrollbar)
    tb.addEventListener('wheel', e => { if (tb.scrollWidth > tb.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { tb.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  }
  more();
}
function renderTitle() {
  const { tab } = UI.route();
  // The favorite team's tab has no fixed label; its name arrives with the data, so this runs on every render
  const name = tab === 'myteam' ? (NBA.T(NBA.S.myTeam).name || 'My team') : ((TABS.find(t => t.id === tab) || {}).label || 'NBA');
  const title = tab === 'home' ? 'Full Court' : `${name} · Full Court`;
  if (document.title !== title) document.title = title;
}
function renderHeader() {
  const today = NBA.data('day:');
  const live = today ? today.games.filter(g => g.state === 'in').length : null;
  const pill = $('#livepill');
  pill.className = 'livepill' + (live ? ' on' : '');
  // While games are live the header shows only a red live button with the count; it opens the schedule.
  // Painted only when it changes, so the blinking dot isn't recreated (and restarted) on every refresh.
  // On the narrowest phones the stylesheet hides the word "live", leaving the count
  UI.paint(pill, live == null ? '' : live ? `<a class="live-btn" href="#schedule" data-act="golive" aria-label="${live} game${live > 1 ? 's' : ''} live now, open the schedule"><i class="dot blink"></i>${live}<span class="lv-word"> live</span></a>` : 'No games live');
  const mt = NBA.T(NBA.S.myTeam);
  if (NBA.S.teamTheme && hasColors(mt) && UI.lookKey !== mt.id + mt.color + mt.alt + NBA.S.theme) applyLook();
  // Only the standings give a team its conference, which keeps out NBA Cup 'TBD' slots and All-Star teams
  const teams = [...NBA.teams.values()].filter(t => t.abbr && t.full && t.conf).sort((a, b) => (a.name || a.full).localeCompare(b.name || b.full));
  UI.paint($('#teampick'), `${mt.logo ? UI.logo(mt, 22) : ''}<span class="ht-col"><label class="ht-lbl" for="team-pick">Favorite team</label>
    <select id="team-pick" data-ch="myTeam" title="Favorite team">${teams.length
      ? teams.map(t => `<option value="${t.id}" ${t.id === NBA.S.myTeam ? 'selected' : ''}>${esc(t.name || t.full)}</option>`).join('')
      : `<option value="${esc(NBA.S.myTeam)}">${esc(mt.name || 'Warriors')}</option>`}</select></span>`);
  renderUpdated();
}
/* The header speaks up when ESPN can't be reached, or when the scores haven't refreshed for a while (after a resume,
   or a poll that stalls). Runs every second, so it touches the DOM only when something changed */
function renderUpdated() {
  const el = $('#upd'), last = NBA.lastUpdate, age = Date.now() - last;
  // Measured against the delay the poll timer was actually set with, not today's nextDelay(), which can drop between polls
  const stale = !!last && !document.hidden && age > Math.max(30000, 3 * (NBA.pollDelay || (NBA.nextDelay ? NBA.nextDelay() : 120000)));
  const at = last ? NBA.fmtTime(new Date(last).toISOString()) : '';
  const txt = NBA.failing ? (at ? `Offline · scores as of ${at}` : "Can't reach ESPN · retrying") : stale ? `Updated ${at} · refreshing` : '';
  const cls = 'upd' + (NBA.failing ? ' err' : stale ? ' stale' : '');
  if (el.className !== cls) el.className = cls;
  if (el.textContent !== txt) el.textContent = txt;
  // Up to 900px wide the note hangs under the header as a strip: the page and its sticky headings move down by its height
  const sh = cls !== 'upd' && matchMedia('(max-width:900px)').matches ? el.offsetHeight + 'px' : '0px', rs = document.documentElement.style;
  if (rs.getPropertyValue('--strip-h') !== sh) rs.setProperty('--strip-h', sh);
  // Stops the live dots blinking while the scores on screen may be old
  document.documentElement.classList.toggle('stale', stale || (NBA.failing && age > 30000));
}
let lastTab = null, lastRoute = null;
function renderView() {
  const { tab, arg } = UI.route();
  const view = $('#view');
  const fn = NBA.views[tab];
  if (!fn) return;
  // A new tab or page opens at the top (on Schedule, today's games), not wherever the last one was scrolled
  const routeKey = tab + '/' + arg, sameRoute = routeKey === lastRoute;
  if (!sameRoute) { if (lastRoute !== null) window.scrollTo(0, 0); lastRoute = routeKey; }
  if (tab !== lastTab) {
    view._html = null; lastTab = tab;
    // A tab reached by swiping slides in from the side the finger moved toward
    view.classList.remove('sw-next', 'sw-prev');
    if (UI.swipeDir) { void view.offsetWidth; view.classList.add('sw-' + UI.swipeDir); }
  }
  UI.swipeDir = null;
  // Lets the stylesheet give a tab its own page layout (the Schedule's right-hand performers rail)
  document.documentElement.dataset.tab = tab;
  // The same page while it's being scrolled waits (see UI.pageMoving): the newest of everything goes in once it settles
  if (sameRoute && view._html && UI.pageMoving()) { UI.viewHeld = true; return; }
  UI.viewHeld = false;
  const html = fn(arg), season = $('#season');
  // iPhone Safari doesn't hold the scroll still when today's games above change height, so when the
  // rest-of-season list is scrolled into, keep it where it was (Chrome's own correction leaves nothing to do)
  const t0 = tab === 'schedule' && view._html !== html ? season.getBoundingClientRect().top : 0;
  // Live refreshes rebuild the page's tables (a team page's roster during its game), so keep each one scrolled
  // sideways where it was, on the same page only
  const xs = sameRoute && view._html ? [...view.querySelectorAll('.tblwrap')].map(w => w.scrollLeft) : [];
  const changed = UI.paint(view, html);
  if (changed) view.querySelectorAll('.tblwrap').forEach((w, i) => { if (xs[i]) w.scrollLeft = xs[i]; });
  // The rest-of-season list under the schedule only shows on that tab
  if (tab !== 'schedule') { UI.paint(season, ''); UI.paint($('#pband'), ''); }
  if (NBA.after[tab]) NBA.after[tab](view, changed);
  if (t0 < 0) { const dy = season.getBoundingClientRect().top - t0; if (dy) window.scrollBy(0, dy); }
}
// Each part renders on its own, so one that throws on odd ESPN data can't leave the page frozen or stop an open game updating
const safe = (name, f) => { try { f(); return false; } catch (e) { console.error(name, e); return true; } };
// Up to this width the game window (and a player card) fills the whole screen, the same breakpoint as the stylesheet
const FULL = matchMedia('(max-width:760px)');
NBA.render = () => {
  safe('header', () => { renderHeader(); renderTabs(); renderTitle(); });
  // A page nobody can see isn't rebuilt on every live poll: under a full-screen game window it waits, and closing the
  // window paints it (UI.closeAll). The window loads what it needs itself, so nothing in it depends on the page
  const covered = UI.drawer && FULL.matches;
  if (!covered && safe('view', renderView)) {
    UI.paint($('#view'), `<section class="sec"><p class="empty">Something in ESPN's data broke this page. It will try again on the next refresh.</p></section>`);
    UI.paint($('#season'), ''); UI.paint($('#pband'), '');
  }
  if (UI.drawer) safe('drawer', renderDrawer);
  if (UI.settingsOpen) safe('settings', renderSettings);
  if (NBA.ask && NBA.ask.render) safe('ask', NBA.ask.render);
  // The clock's text in parts that weren't repainted (a chip's new score, a reveal), before the frame shows
  safe('tick', () => UI.tick());
  // Repaints recreate live dots and card glows; tying their pulse to the page clock lets a new one carry on mid-beat instead of restarting
  if (document.getAnimations) document.getAnimations().forEach(a => { if (a.animationName === 'blink' || a.animationName === 'glow') a.startTime = 0; });
};
window.addEventListener('hashchange', () => {
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
  // The scrim stops the mouse but not the Tab key: the page behind an open game or Settings is made inert, so Tab stays
  // in the window and Enter can't change the tab underneath it. The windows, the scrim and the video player are siblings
  // of these, so they stay usable (older browsers ignore inert, which is no worse than before)
  ['#top', '#pband', '#view', '#season', '#ask-panel', 'footer.foot'].forEach(s => { const n = $(s); if (n) n.inert = on; });
}
UI.closeAll = fromHistory => {
  const had = UI.drawer || UI.settingsOpen;
  UI.drawer = null; UI.drawerBack = null; UI.settingsOpen = false; UI.resetArmed = false;
  $('#drawer').hidden = true; $('#settings').hidden = true;
  lock(false);
  if (UI.histPushed) { UI.histPushed = false; if (fromHistory !== true) history.back(); }
  if (had && UI.lastFocus instanceof Node && document.contains(UI.lastFocus)) UI.lastFocus.focus();
  // The page under a full-screen window waited (see NBA.render): it catches up as soon as the window closes
  if (had) NBA.changed();
};
/* The game view takes a history entry, so the browser's back button or a phone's back swipe closes it */
window.addEventListener('popstate', () => { if (UI.drawer || UI.settingsOpen) UI.closeAll(true); else UI.histPushed = false; });
/* On touch screens, a sideways swipe closes the game view (except inside tables and the chart, which scroll sideways) */
(() => {
  const el = document.getElementById('drawer');
  let x0 = 0, y0 = 0, armed = false;
  el.addEventListener('touchstart', e => {
    const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY;
    armed = e.touches.length === 1 && !e.target.closest('.tblwrap, .dtabs, .wpwrap') && !UI.ownsSwipe(e.target);
  }, { passive: true });
  el.addEventListener('touchend', e => {
    if (!armed || !UI.drawer) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 90 && Math.abs(dx) > 2 * Math.abs(dy)) UI.closeAll();
  }, { passive: true });
})();
/* Swiping the phone box score: remember which team is showing (repaints come back to it) and light its button */
document.getElementById('drawer').addEventListener('scroll', e => {
  const bs = e.target;
  if (!bs.classList || !bs.classList.contains('box-swipe') || !UI.drawer || !bs.clientWidth) return;
  const i = Math.round(bs.scrollLeft / bs.clientWidth);
  if (i === (UI.drawer.boxIdx || 0)) return;
  UI.drawer.boxIdx = i;
  bs.parentElement.querySelectorAll('.box-tabs button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === i)));
}, { capture: true, passive: true });
// A window narrowed into the swipe layout (or a tablet turned upright) finds the strip at its start: put it back on the
// team whose button is lit, which is your team on a freshly opened game (older Safari has no addEventListener here)
const swipeMq = matchMedia('(max-width:900px)');
if (swipeMq.addEventListener) swipeMq.addEventListener('change', e => {
  const bs = e.matches && UI.drawer && UI.drawer.boxIdx && document.querySelector('#drawer .box-swipe');
  if (bs) bs.scrollLeft = UI.drawer.boxIdx * bs.clientWidth;
});
/* The nearest thing around el that scrolls sideways (a wide table, a carousel, a video strip, the tab bar) */
UI.sideScroller = el => {
  for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return n;
  }
  return null;
};
/* Something under the finger that scrolls sideways, or a control that takes the gesture itself: a sideways swipe that
   starts there belongs to it, not to the page */
UI.ownsSwipe = el => !!(el && el.closest && el.closest('[data-noswipe], input, textarea, select, iframe, video')) || !!UI.sideScroller(el);
/* Live polls never rebuild a sideways strip under a finger or still gliding from a flick: on an iPhone that ends the
   swipe dead (the gesture belongs to the element that started it). UI.paint skips any part holding UI.heldStrip; once
   the strip has been still for a moment a normal render paints the newest of everything, after-paint hooks included */
(() => {
  let quiet = 0, lifted = true;
  const release = () => { clearTimeout(quiet); if (!UI.heldStrip) return; UI.heldStrip = null; NBA.changed(); };
  const settle = () => { clearTimeout(quiet); quiet = setTimeout(release, 300); };
  addEventListener('touchstart', e => {
    const s = UI.sideScroller(e.target);
    if (!s) return;
    if (UI.heldStrip && UI.heldStrip !== s) release();
    UI.heldStrip = s; lifted = false; clearTimeout(quiet);
  }, { passive: true, capture: true });
  const lift = () => { if (UI.heldStrip) { lifted = true; settle(); } };
  addEventListener('touchend', lift, { passive: true, capture: true });
  addEventListener('touchcancel', lift, { passive: true, capture: true });
  // A tap isn't a swipe (only a touch that didn't scroll ends in a click): its own repaint, like a newly chosen tab
  // lighting up in the tab bar, goes straight through. Capture runs before the click's action and its hashchange
  addEventListener('click', release, true);
  // A glide keeps the hold going until the strip stops moving
  addEventListener('scroll', e => { if (lifted && e.target === UI.heldStrip) settle(); }, { passive: true, capture: true });
})();
/* Scrolling the page up and down: while a finger is moving it, or it's still gliding from a flick, live refreshes don't
   rebuild the page. On an iPhone, swapping the page's HTML mid-scroll (a score, a "5m ago") makes it stutter or jump,
   and correcting the scroll position for a change above stops the glide dead. Once it has been still for a moment, a
   normal render paints the newest of everything. A tap that doesn't scroll isn't held up */
(() => {
  let down = false, moved = false, last = 0, timer = 0;
  UI.pageMoving = () => (down && moved) || Date.now() - last < 150;
  const settle = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (UI.pageMoving()) settle(); else if (UI.viewHeld) NBA.changed(); }, 160);
  };
  addEventListener('touchstart', e => { down = e.touches.length > 0; moved = false; }, { passive: true, capture: true });
  const up = e => { if (e.touches && e.touches.length) return; down = false; if (moved) settle(); };
  addEventListener('touchend', up, { passive: true, capture: true });
  addEventListener('touchcancel', up, { passive: true, capture: true });
  // Only the page's own scroll (scroll events from strips, tables and the game window don't reach the window)
  addEventListener('scroll', () => { last = Date.now(); if (down) moved = true; settle(); }, { passive: true });
})();
/* Touch screens: a quick sideways swipe anywhere else on the page moves to the next or previous tab, so the tab bar
   needn't be reached. Nothing happens while a game, settings, a video, the calendar or search is open */
(() => {
  let x0 = 0, y0 = 0, t0 = 0, armed = false;
  const busy = () => UI.drawer || UI.settingsOpen || ($('#vid') && $('#vid').open) || ($('#calpop') && $('#calpop').open)
    || document.documentElement.classList.contains('srch') || (NBA.ask && NBA.ask.isOpen());
  addEventListener('touchstart', e => {
    armed = false;
    if (e.touches.length !== 1 || busy()) return;
    const t = e.touches[0];
    // In Safari itself (not the Home Screen app) a swipe in from the screen's edge is the browser's back and forward
    if (!navigator.standalone && (t.clientX < 24 || t.clientX > innerWidth - 24)) return;
    if (UI.ownsSwipe(e.target)) return;
    x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); armed = true;
  }, { passive: true });
  addEventListener('touchcancel', () => { armed = false; }, { passive: true });
  addEventListener('touchend', e => {
    if (!armed) return;
    armed = false;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    // Far enough, mostly sideways and quick: a slow wander is someone reading or scrolling, not changing tabs
    if (Math.abs(dx) < Math.max(70, innerWidth * 0.2) || Math.abs(dx) < 1.8 * Math.abs(dy) || Date.now() - t0 > 800) return;
    if (String(getSelection ? getSelection() : '')) return;
    const ids = TABS.map(x => x.id), i = ids.indexOf(UI.route().tab), j = i + (dx < 0 ? 1 : -1);
    if (i < 0 || j < 0 || j >= ids.length) return;
    UI.swipeDir = dx < 0 ? 'next' : 'prev';
    location.hash = '#' + ids[j];
  }, { passive: true });
})();

/* ---------- game drawer ---------- */
const BOX_COMPACT = ['minutes', 'points', 'rebounds', 'assists', 'fieldGoalsMade-fieldGoalsAttempted', 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', 'plusMinus'];
// [ESPN stat, label, made-attempted split, a percentage, fewer is better]. Technicals only show when someone has one
const TEAM_STATS = [
  ['fieldGoalPct', 'Field goal %', 'fieldGoalsMade-fieldGoalsAttempted', true],
  ['threePointFieldGoalPct', '3-point %', 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', true],
  ['freeThrowPct', 'Free throw %', 'freeThrowsMade-freeThrowsAttempted', true],
  ['totalRebounds', 'Rebounds'], ['offensiveRebounds', 'Offensive rebounds'], ['defensiveRebounds', 'Defensive rebounds'], ['assists', 'Assists'], ['steals', 'Steals'], ['blocks', 'Blocks'],
  ['totalTurnovers', 'Turnovers', null, false, true], ['turnoverPoints', 'Points off turnovers'], ['pointsInPaint', 'Points in the paint'], ['fastBreakPoints', 'Fast break points'],
  ['fouls', 'Fouls', null, false, true], ['technicalFouls', 'Technicals', null, false, true], ['largestLead', 'Largest lead'], ['leadPercentage', 'Time leading', null, true],
];
function findGame(id) {
  for (const k of ['day:', 'day:' + NBA.dayParam]) { const d = NBA.data(k); const g = d && d.games.find(x => x.id === id); if (g) return g; }
  return null;
}
// Focus returns to what opened the window; a control inside the window (a box-score name, a game-log row) is about to be replaced
function noteOpener(opener) {
  const n = opener || document.activeElement;
  if (!(UI.drawer && $('#drawer').contains(n))) UI.lastFocus = n;
}
UI.openGame = (id, opener) => {
  noteOpener(opener);
  // Opening a game shows its score, so in spoiler mode it stays shown elsewhere too (remembered for a week). Not for one
  // opened before tip-off (to check the matchup or the channel): its result must stay hidden later. One whose state
  // isn't known yet, or that tips off while open, is revealed by renderDrawer
  const g0 = findGame(id), s0 = NBA.data('summary:' + id), st0 = (g0 && g0.state) || (s0 && s0.state);
  if (st0 && st0 !== 'pre') UI.reveal(id);
  // The first tab is picked once the game's state is known: Matchup before tip-off, else Box score
  UI.drawer = { id, tab: null, sort: null, scoringOnly: false, showAll: false, game: g0 };
  UI.drawerBack = null;
  UI.settingsOpen = false; $('#settings').hidden = true;
  if (!UI.histPushed) { history.pushState({ nbaGame: id }, ''); UI.histPushed = true; }
  $('#drawer').hidden = false; lock(true);
  $('#drawer')._html = null;
  renderDrawer();
  $('#drawer').scrollTop = 0;
  const c = $('#drawer [data-act="close"]'); if (c) c.focus();
  // A finished game's cached box score can't change, so only an unfinished one is refetched on open
  const cached = NBA.data('summary:' + id);
  NBA.need('summary:' + id, !(cached && cached.state === 'post')).catch(() => {});
  NBA.changed();
};
/* A player's card opens in the same window as a game, so closing, the back button and swipes all work the same way.
   Opened from a game, the game is kept in UI.drawerBack for the card's '← Back' button */
UI.openPlayer = (id, opener) => {
  if (UI.drawer && UI.drawer.kind !== 'player') {
    const s = NBA.data('summary:' + UI.drawer.id) || findGame(UI.drawer.id) || UI.drawer.game;
    UI.drawerBack = Object.assign({}, UI.drawer, { scroll: $('#drawer').scrollTop, title: s && s.away && s.home ? `${s.away.abbr} @ ${s.home.abbr}` : 'game' });
  } else if (!UI.drawer) UI.drawerBack = null;
  noteOpener(opener);
  UI.drawer = { kind: 'player', id: String(id) };
  UI.settingsOpen = false; $('#settings').hidden = true;
  if (!UI.histPushed) { history.pushState({ nbaPlayer: id }, ''); UI.histPushed = true; }
  $('#drawer').hidden = false; lock(true);
  $('#drawer')._html = null;
  renderDrawer();
  $('#drawer').scrollTop = 0;
  const c = $('#drawer [data-act="close"]'); if (c) c.focus();
};
// The open game, including one waiting under a player card, so it keeps refreshing there
const openGameId = () => !UI.drawer ? null : UI.drawer.kind === 'player' ? (UI.drawerBack && UI.drawerBack.id) || null : UI.drawer.id;
NBA.pollHooks.push({
  live: () => { const gid = openGameId(), d = gid && NBA.data('summary:' + gid); return !!(d && d.state === 'in'); },
  run: () => {
    const gid = openGameId();
    if (!gid) return null;
    const k = 'summary:' + gid, d = NBA.data(k), g = findGame(gid);
    // A game opened before tip-off is refetched once tip is near (or the scoreboard says it started), so it turns live on its own
    const tipping = d && d.state === 'pre' && ((g && g.state !== 'pre') || new Date(d.date) - Date.now() < 15 * 60000);
    if (!d || d.state === 'in' || tipping) return NBA.need(k, true);
    // After the final the summary's own schedule decides (every 5 min until ESPN posts the recap, then rarely), so a
    // window left open on the final buzzer still gets the recap and ESPN's stat corrections
    return d.state === 'post' ? NBA.need(k) : null;
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
  // Postponed: 'post' without being completed, from the scoreboard game or the summary's own status
  const pp = state === 'post' && ((!!g && g.completed === false) || (!!data && data.completed === false));
  // The game's score is on screen from here on, so it counts as revealed: one opened from a team schedule or a player's
  // log (state unknown until the summary loads), or one that tipped off while open. The next render finds it in the set
  if (state && state !== 'pre' && !pp && !UI.st.revealed.has(d.id)) { UI.reveal(d.id); NBA.changed(); }
  // A cached summary can be hours old: if the scoreboard says the game has started, open on the box score.
  // A postponed game has no box score, plays or chart, only its matchup
  if (pp) d.tab = 'preview';
  else if (!d.tab && state) d.tab = state === 'pre' && !(g && g.state !== 'pre') ? 'preview' : 'box';
  const detail = data ? (data.state === 'pre' && data.date ? UI.tipTime({ date: data.date, detail: data.detail }) : NBA.detail(data)) : g ? (g.state === 'pre' ? UI.tipTime(g) : NBA.detail(g)) : '';
  const link = data ? data.link : g ? g.link : `https://www.espn.com/nba/game/_/gameId/${d.id}`;
  const title = away && home ? `${away.full || away.abbr} at ${home.full || home.abbr}` : 'Game';
  let html = `<div class="dr-bar dpad"><button class="ib" data-act="close" aria-label="Close game">${UI.I.close}</button>
    <span class="dr-title" id="dr-title">${esc(title)}</span><a class="ext" href="${esc(link)}" target="_blank" rel="noopener">Open on ESPN ↗</a></div>`;
  if (away && home) {
    const side = (t, isHome) => `<div class="dr-team${isHome ? ' home' : ''}">${UI.logo(Object.assign({}, t, NBA.T(t.id).logo ? { logo: NBA.T(t.id).logo, logoDark: NBA.T(t.id).logoDark } : {}), 56)}
      <div><div class="ab">${esc(t.abbr)}</div><div class="rec">${esc(t.record || '')}</div></div>
      <div class="sc${state === 'post' && !pp && t.winner === false ? ' lostsc' : ''}">${state === 'pre' || pp ? '' : esc(t.score)}</div></div>`;
    html += `<div class="dr-score dpad">${side(away, false)}<div class="dr-status${state === 'in' ? ' live' : ''}">${state === 'in' ? '<i class="dot blink"></i>' : ''}${esc(detail)}</div>${side(home, true)}</div>`;
    if (state === 'in' && data) html += liveStrip(data);
    // The status above already says postponed or canceled
    if (pp) html += `<div class="dpad pre-meta dr-pp"><span>This game wasn't played</span></div>`;
    const nq = Math.max(away.lines.length, home.lines.length);
    if (nq && state !== 'pre' && !pp) {
      const cells = t => Array.from({ length: nq }, (_, i) => `<td>${esc(t.lines[i] ?? '')}</td>`).join('');
      html += `<div class="tblwrap dpad"><table class="lsx"><thead><tr><th></th>${Array.from({ length: nq }, (_, i) => `<th scope="col">${NBA.perLabel(i + 1)}</th>`).join('')}<th scope="col">T</th></tr></thead>
        <tbody><tr><td>${esc(away.abbr)}</td>${cells(away)}<td>${esc(away.score)}</td></tr><tr><td>${esc(home.abbr)}</td>${cells(home)}<td>${esc(home.score)}</td></tr></tbody></table></div>`;
    }
    // The NBA's full game highlights and the recap story; opening a game reveals it, so there's no spoiler check here.
    // Until the NBA posts the video (about an hour after the final) the box says so, and fills in on its own
    if (state === 'post' && !pp) {
      const v = NBA.fullHl(d.id), rc = data && data.recap;
      const tm = t => NBA.T(t.id).logo ? NBA.T(t.id) : t;
      let box = '';
      if (v) {
        box = `<button class="dr-vid" ${NBA.ytAttrs(v, { id: d.id, away, home })} aria-label="Play the full game highlights${v.dur ? ', ' + NBA.fmtDur(v.dur) : ''}">
          <span class="dr-vid-img"><img ${NBA.ytSrcset(v)} sizes="(max-width:640px) 92vw, 380px" alt="" loading="lazy" decoding="async"><span class="hl-play" aria-hidden="true">▶</span>${v.dur ? `<span class="dr-dur">${NBA.fmtDur(v.dur)}</span>` : ''}</span>
          <span class="dr-vid-cap"><b>Full game highlights</b><small>From the NBA on YouTube</small></span></button>`;
      } else if (NBA.data('ythl') !== undefined || NBA.status('ythl').err) {
        const when = (data && data.date) || (g && g.date);
        const old = when && Date.now() - Date.parse(when) > 2 * 864e5;
        box = `<div class="dr-vid pending"><span class="dr-vid-img"><span class="pend-logos">${UI.logo(tm(away), 44)}${UI.logo(tm(home), 44)}</span></span>
          <span class="dr-vid-cap"><b>Full game highlights</b><small>${old ? "The NBA didn't post full game highlights for this game." : "The NBA usually posts them about an hour after the final. They'll show up here on their own."}</small></span></div>`;
      }
      if (box || rc) html += `<div class="dpad dr-recap">${box}${rc ? `<div class="dr-story"><b>${esc(rc.headline)}</b><p class="note">${esc(rc.description)}</p></div>` : ''}</div>`;
    }
    // A game opened from a team schedule may not be on a loaded scoreboard; the summary has its date and teams too
    const ca = NBA.caTv(g || data);
    // Where to watch in Canada, linked straight to the game's page on that service when the NBA lists one
    const caLinks = () => `<span>Watch in Canada <b>${ca.items.map(s => s.link ? `<a class="ca-link" href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>` : esc(s.label)).join(' / ')}</b></span>`;
    // Mid-game is when the stream is wanted most, so the links stay (without the line and the venue)
    if (state === 'in' && ca) html += `<div class="dpad pre-meta dr-ca">${caLinks()}</div>`;
    if (state === 'pre' && ((g && (g.odds || g.venue)) || ca)) {
      const o = g && g.odds, sm = o && UI.moved(o.spreadHome, home.abbr + ' '), tm = o && UI.moved(o.total);
      html += `<div class="dpad pre-meta" style="justify-content:center;padding-bottom:12px">${ca ? caLinks() : ''}${o && o.details ? `<span>Line <b>${esc(o.details)}</b>${sm ? ` (${esc(sm)})` : ''}</span>` : ''}${o && o.ou ? `<span>O/U <b>${esc(o.ou)}</b>${tm ? ` (${esc(tm)})` : ''}</span>` : ''}${o && o.awayML ? `<span>Moneyline <b>${esc(g.away.abbr)} ${esc(o.awayML)} · ${esc(g.home.abbr)} ${esc(o.homeML)}</b></span>` : ''}${g && g.venue ? `<span>${esc(g.venue)}</span>` : ''}</div>`;
    }
  }
  // Matchup is there before tip-off, and stays for a game that tips off while it's open on that tab. A postponed game
  // only has its matchup (ESPN keeps the injuries and each side's last 5)
  const tabs = pp ? [['preview', 'Matchup']] : [...(state === 'pre' || d.tab === 'preview' ? [['preview', 'Matchup']] : []), ['box', 'Box score'], ['team', 'Team stats'], ['plays', 'Plays'], ['wp', 'Win chance']];
  const tabBar = `<div class="dtabs dpad" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-act="dtab" data-v="${k}" aria-selected="${d.tab === k}">${l}</button>`).join('')}</div>`;
  // The win chance chart is drawn at the pane's real width, so its labels keep their size on a phone. The width
  // ends up in the HTML, so a rotation redraws it on the next render
  WP.W = Math.max(280, Math.min(1100, Math.round(el.clientWidth - (innerWidth <= 640 ? 28 : 44))));
  WP.H = WP.W < 500 ? 210 : 230;
  let pane;
  if (!data) pane = `<p class="empty">${err ? "Couldn't load this game from ESPN. It will retry on the next refresh." : 'Loading game…'}</p>`;
  else if (d.tab === 'preview') pane = paneMatchup(data, g);
  else if (d.tab === 'box') pane = paneBox(d, data);
  else if (d.tab === 'team') pane = paneTeam(data);
  else if (d.tab === 'plays') pane = panePlays(d, data);
  else pane = paneWp(data);
  // Postgame interviews and related videos from YouTube (or the run-up, before tip-off), under the box score and the
  // other tabs: js/videos.js
  const vids = away && home && NBA.gameVideos && !pp ? NBA.gameVideos({ id: d.id, date: (data && data.date) || (g && g.date), away, home }, state) : '';
  const top = el.scrollTop;
  // The window is painted in parts, so a live poll rebuilds only what changed (the score at the top and the open tab),
  // not the tab bar or the row of video stills. openGame and drawerback clear el._html, which puts in a fresh frame
  UI.paint(el, DR_FRAME);
  const [pTop, pTabs, pPane, pVids] = ['#dr-top', '#dr-tabs', '#dr-pane', '#dr-vids'].map(s => el.querySelector(s));
  if (!pPane) return;
  paintPart(pTop, html, d.id);
  paintPart(pTabs, tabBar, d.id);
  // A finger scrubbing the win chance chart keeps it (see bindWp); letting go paints what came in meanwhile
  const held = d.tab === 'wp' && UI.wpHold && pPane.contains(UI.wpHold);
  if (!held && paintPart(pPane, pane, d.id + '/' + d.tab)) {
    // On a phone, stay on the team being looked at
    const bs = pPane.querySelector('.box-swipe');
    if (bs && d.boxIdx) bs.scrollLeft = d.boxIdx * bs.clientWidth;
    if (data && d.tab === 'wp') bindWp(data);
  }
  UI.paint(pVids, vids);
  // Setting scrollTop stops an iPhone flick mid-glide, so only put it back if the repaint moved it
  if (el.scrollTop !== top) el.scrollTop = top;
}
// The game window's parts. display:contents keeps the close bar and the tab bar sticking to the window as they did
const DR_FRAME = '<div class="dr-part" id="dr-top"></div><div class="dr-part" id="dr-tabs"></div><div class="pane dpad" id="dr-pane" role="tabpanel"></div><div class="dr-part" id="dr-vids"></div>';
// Live refreshes rebuild a part's tables (the line score, the box score), so each keeps its sideways scroll, as long as
// the part still shows the same thing (key: the game, and for the pane its tab)
function paintPart(n, html, key) {
  const xs = n._key === key ? [...n.querySelectorAll('.tblwrap')].map(w => w.scrollLeft) : [];
  n._key = key;
  if (!UI.paint(n, html)) return false;
  n.querySelectorAll('.tblwrap').forEach((w, i) => { if (xs[i]) w.scrollLeft = xs[i]; });
  return true;
}
/* Under the score while live: each side's timeouts left and fouls this period, BONUS on the side that shoots on the
   other team's next common foul, a dot on the side with the ball, and the run going on now once it's 6-0 or more.
   What can't be worked out is left out (NBA.liveSit in js/core.js). Screen readers get each side as one sentence */
const abbrOf = (data, id) => (id === data.away.id ? data.away : data.home).abbr || '';
function liveStrip(data) {
  const ls = NBA.liveSit(data);
  if (!ls) return '';
  const f = NBA.gameFlow(data), run = f && f.cur && f.cur.n >= 6 ? f.cur : null;
  const per = data.clockS === 0 ? data.period + 1 : data.period;
  const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const side = (t, me, opp, isHome) => {
    const say = [pl(me.to, 'timeout') + ' left', me.fouls != null ? `${pl(me.fouls, 'team foul')} this ${per > 4 ? 'overtime' : 'quarter'}` : '',
      opp.pen ? 'in the bonus' : '', me.poss ? 'has the ball' : ''].filter(Boolean).join(', ');
    return `<div class="dl-side${isHome ? ' home' : ''}"><span class="sr">${esc(t.abbr)}: ${say}.</span><span class="dl-bits" aria-hidden="true">${me.poss ? '<i class="dl-ball"></i>' : ''}<span><b>${me.to}</b> TO</span>${me.fouls != null ? `<span><b>${me.fouls}</b> ${me.fouls === 1 ? 'foul' : 'fouls'}</span>` : ''}${opp.pen ? '<span class="dl-bonus">Bonus</span>' : ''}</span></div>`;
  };
  return `<div class="dr-live dpad">${side(data.away, ls.away, ls.home, false)}<div class="dl-run">${run ? `${esc(abbrOf(data, run.teamId))} ${run.n}-0 run` : ''}</div>${side(data.home, ls.home, ls.away, true)}</div>`;
}
/* Before tip-off: ESPN's predictor, each side's last 5, the season series, team leaders, injuries, the line and
   the preview story, all from the game's summary. A part ESPN hasn't posted is left out */
function paneMatchup(data, g) {
  const p = data.preview || {}, sides = [data.away, data.home].filter(Boolean);
  // Each per-team list in away, home order, paired with that side's team
  const per = list => sides.map(t => [t, (list || []).find(x => x.teamId === t.id)]).filter(([, x]) => x);
  const tag = t => `${UI.logo(Object.assign({}, t, NBA.T(t.id).logo ? { logo: NBA.T(t.id).logo, logoDark: NBA.T(t.id).logoDark } : {}), 22)}<b>${esc(t.abbr)}</b>`;
  const teamHd = t => `<div class="mx-row">${tag(t)}</div>`;
  const out = [];
  if (p.pred && Number.isFinite(p.pred.home) && Number.isFinite(p.pred.away)) {
    const hw = Math.round(p.pred.home), aw = Math.round(p.pred.away);
    const [ca, ch] = NBA.tones(data.away, data.home);
    out.push(`<div class="mx-sec wp" aria-label="ESPN matchup predictor: ${esc(data.away.abbr)} ${aw}%, ${esc(data.home.abbr)} ${hw}%">
      <div class="wpbar"><span style="flex:${aw};background:${ca}"></span><span style="flex:${hw};background:${ch}"></span></div>
      <div class="wplab"><span>${esc(data.away.abbr)} ${aw}%</span><span class="mut">ESPN matchup predictor</span><span>${esc(data.home.abbr)} ${hw}%</span></div></div>`);
  }
  const l5 = per(p.last5).filter(([, x]) => x.games.length);
  if (l5.length) {
    // Results from the last 2 days stay hidden in spoiler mode until that game is opened
    const pill = x => {
      const m = NBA.masked(x.id, x.date);
      return `<button class="mx-g ${m ? '' : x.res === 'W' ? 'w' : x.res === 'L' ? 'lo' : ''}" data-act="game" data-id="${esc(x.id)}"${m || x.my == null ? '' : ` title="${esc(`${x.res} ${x.my}-${x.their}`)}"`}><b>${m ? '•' : esc(x.res)}</b><small>${x.at === '@' ? '@' : 'vs'} ${esc(x.opp)}</small></button>`;
    };
    // Rest: the days since each side's latest game (the list runs oldest first), by Eastern date like the schedule
    const rest = x => {
      const last = x.games.reduce((m, e) => { const dd = e.date ? NBA.etDay(e.date) : ''; return dd > m ? dd : m; }, '');
      const days = last && data.date ? Math.round((NBA.dateOfIso(NBA.etDay(data.date)) - NBA.dateOfIso(last)) / 864e5) : 0;
      if (days < 1) return '';
      const txt = days === 1 ? '2nd night of a back-to-back' : days >= 4 ? '3+ days of rest' : `${days - 1} day${days > 2 ? 's' : ''} of rest`;
      return `<p class="mx-rest${days === 1 ? ' b2b' : ''}">${txt}</p>`;
    };
    out.push(`<div class="mx-sec"><h3 class="bx-team">Last 5 games</h3>${l5.map(([t, x]) => `<div class="mx-row">${tag(t)}<div class="mx-pills">${x.games.map(pill).join('')}</div></div>${rest(x)}`).join('')}</div>`);
  }
  const s = p.series;
  if (s && (s.summary || s.total)) {
    // Before the first meeting the summary ('Series starts 11/1') gives nothing away
    const txt = NBA.S.spoilers && s.done ? `${s.done} of ${s.total} meetings played` : s.summary || `${s.done} of ${s.total} meetings played`;
    // The other meetings, each opening its game. In spoiler mode a played one stays a dot until it's opened, as strict
    // as the line above (a meeting a week old would give away who leads); ones still to come show their date
    const meet = e => {
      const when = e.date ? NBA.fmtDate(e.date, { month: 'short', day: 'numeric' }) : '', where = e.home.abbr ? 'at ' + e.home.abbr : '';
      const w = e.away.winner ? e.away : e.home.winner ? e.home : null, l = w === e.away ? e.home : e.away;
      const res = !e.done ? '' : w ? `${w.abbr} ${w.score}-${l.score}` : `${e.away.score}-${e.home.score}`;
      const hide = e.done && NBA.S.spoilers && !UI.st.revealed.has(e.id);
      return `<button class="mx-g mx-mt" data-act="game" data-id="${esc(e.id)}"${res && !hide ? ` title="${esc(`${res}, ${when}`)}"` : ''}><b>${e.done ? (hide ? '•' : esc(res)) : esc(when)}</b><small>${esc(e.done ? [when, where].filter(Boolean).join(' · ') : where)}</small></button>`;
    };
    const games = s.games || [];
    out.push(`<div class="mx-sec"><h3 class="bx-team">${s.type === 'playoff' ? 'Playoff series' : 'Season series'}</h3><p class="note">${esc(txt)}</p>${games.length ? `<div class="mx-pills mx-meet">${games.map(meet).join('')}</div>` : ''}</div>`);
  }
  const tape = taleOfTape(data);
  if (tape) out.push(`<div class="mx-sec"><h3 class="bx-team">Tale of the tape</h3>${tape}</div>`);
  const ld = per(p.leaders).filter(([, x]) => x.list.length);
  if (ld.length) {
    const unit = { points: 'PPG', rebounds: 'RPG', assists: 'APG' };
    out.push(`<div class="mx-sec"><h3 class="bx-team">Team leaders</h3><div class="mx-lead">${ld.map(([t, x]) => `<div>${teamHd(t)}<ul class="inj2">${x.list.map(l => `<li>${l.id ? `<button class="plink" data-act="player" data-id="${esc(l.id)}">${UI.hs(l.headshot)}<b>${esc(l.name)}</b></button>` : `<b>${esc(l.name)}</b>`} <span class="mut">${esc(l.value)} ${unit[l.cat] || ''}</span></li>`).join('')}</ul></div>`).join('')}</div></div>`);
  }
  const inj = per(data.injuries);
  if (inj.length) {
    out.push(`<div class="mx-sec"><h3 class="bx-team">Injury report</h3><div class="mx-lead">${inj.map(([t, x]) => `<div>${teamHd(t)}<ul class="inj2">${x.list.map(i => `<li><b>${esc(i.name)}</b> <span class="mut">${esc(i.status)}${i.type ? ' · ' + esc(i.type) : ''}</span></li>`).join('')}</ul></div>`).join('')}</div></div>`);
  }
  // The line, unless the odds strip above the tabs already shows it
  const pk = p.pick, ml = v => v === '' || v == null ? '' : (+v > 0 ? '+' : '') + v;
  if (pk && pk.details && !(g && g.odds && g.odds.details)) {
    const parts = [`Line ${pk.details}`, pk.ou !== '' ? `O/U ${pk.ou}` : '', pk.awayML !== '' && pk.homeML !== '' ? `ML ${data.away.abbr} ${ml(pk.awayML)} / ${data.home.abbr} ${ml(pk.homeML)}` : ''];
    out.push(`<div class="mx-sec"><p class="note">${esc(parts.filter(Boolean).join(' · '))}</p></div>`);
  }
  if (p.article) out.push(`<div class="mx-sec"><a class="ext" href="${esc(p.article.href)}" target="_blank" rel="noopener">Preview: ${esc(p.article.headline)} ↗</a></div>`);
  return out.length ? `<div class="mx">${out.join('')}</div>` : `<p class="empty">ESPN hasn't posted a preview for this game yet.</p>`;
}
/* The two teams' seasons side by side before tip-off (the Team stats tab is empty until then): ratings and shooting
   with each team's league rank, then the records that matter here. Left out until the team stats or standings load */
const TAPE = [['net', 'Net rating', v => (v > 0 ? '+' : '') + NBA.fix(v)], ['ortg', 'Offensive rating'], ['drtg', 'Defensive rating'],
  ['pace', 'Pace', null, true], ['tpp', '3-point %', v => NBA.fix(v) + '%'], ['rpg', 'Rebounds'], ['tov', 'Turnovers']];
function taleOfTape(data) {
  const A = data.away, H = data.home;
  if (!A || !H) return '';
  const [ca, ch] = NBA.tones(A, H);
  // Values come in escaped; better: -1 away, 1 home, 0 neither
  const row = (label, va, vh, wa, wh, better) => `<div class="cmp-row"><div class="cmp-lbl">${label}</div>
    <div class="cmp-bars"><span class="v${better < 0 ? ' b' : ''}">${va}</span>
    <div class="hbar l"><i style="width:${wa.toFixed(1)}%;background:${ca}"></i></div>
    <div class="hbar"><i style="width:${wh.toFixed(1)}%;background:${ch}"></i></div>
    <span class="v${better > 0 ? ' b' : ''}">${vh}</span></div></div>`;
  const ts = NBA.use('teamstats') || [], ta = ts.find(t => t.id === A.id), th = ts.find(t => t.id === H.id);
  const rows = [];
  // Bars are league rank (longer is better); each team's ranks already treat fewer turnovers and points allowed as better
  if (ta && th && ta.rank && th.rank) TAPE.forEach(([k, label, fmt, neutral]) => {
    const ra = ta.rank[k], rh = th.rank[k];
    if (!ra || !rh || !Number.isFinite(ta[k]) || !Number.isFinite(th[k])) return;
    const v = (t, r) => `${esc((fmt || NBA.fix)(t[k]))}<small>${NBA.ord(r)}</small>`;
    rows.push(row(esc(label), v(ta, ra), v(th, rh), (31 - ra) / 30 * 100, (31 - rh) / 30 * 100, neutral || ra === rh ? 0 : ra < rh ? -1 : 1));
  });
  // Records from the standings: overall, then the away side on the road against the home side at home
  const st = (NBA.use('standings') || []).flatMap(c => c.rows), sa = st.find(r => r.id === A.id), sh = st.find(r => r.id === H.id);
  const pct = s => { const m = /^(\d+)-(\d+)$/.exec(s || ''); return m && +m[1] + +m[2] ? +m[1] / (+m[1] + +m[2]) : null; };
  const rec = (label, a, h) => {
    const pa = pct(a), ph = pct(h);
    if (pa == null || ph == null) return;
    rows.push(row(label, esc(a), esc(h), pa * 100, ph * 100, pa === ph ? 0 : pa > ph ? -1 : 1));
  };
  if (sa && sh) {
    rec('Record', `${sa.w}-${sa.l}`, `${sh.w}-${sh.l}`);
    rec(`${esc(A.abbr)} on the road · ${esc(H.abbr)} at home`, sa.road, sh.home);
  }
  if (!rows.length) return '';
  return `<div class="cmp tape"><div class="cmp-head"><span></span><span>${esc(A.abbr)}</span><span>${esc(H.abbr)}</span><span></span></div>${rows.join('')}</div>
    <p class="note">The better side is bold. Under each stat is the team's league rank, which its bar shows: longer is better (for pace, faster), so fewer turnovers and a lower defensive rating rank higher. Record bars show winning percentage.</p>`;
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
  else {
    // Wide screens show the two teams side by side; phones swipe between them, with a button for each team above
    const boxes = [data.away, data.home].map(t => data.box.find(b => b.teamId === t.id)).filter(Boolean);
    // A freshly opened game starts on your team's box score (the repaint below scrolls the phone strip to it)
    if (d.boxIdx == null) { const mi = boxes.findIndex(b => b.teamId === NBA.S.myTeam); d.boxIdx = mi > 0 ? mi : 0; }
    const at = Math.min(d.boxIdx || 0, boxes.length - 1);
    const pick = boxes.length > 1 ? `<div class="box-tabs" role="group" aria-label="Team">${boxes.map((b, i) => {
      const t = NBA.T(b.teamId);
      return `<button data-act="boxteam" data-v="${i}" aria-pressed="${i === at}">${UI.logo(t, 20)}${esc(t.name || t.abbr)}</button>`;
    }).join('')}</div>` : '';
    // .fit: the key stats are squeezed to fit a phone's width, so a swipe anywhere on them changes team
    const live = data.state === 'in';
    out += tools + pick + `<div class="box-pair box-swipe${NBA.S.boxCols === 'full' ? '' : ' fit'}${live ? ' live' : ''}">${boxes.map(b => boxTeam(b, d, data)).join('')}</div>`;
    // What the live marks mean (the floor bar only when ESPN says who's on it)
    const anyOn = boxes.some(b => b.players.some(p => p.onCourt));
    if (live) out += `<p class="note bx-key">${anyOn ? '<span><i class="bx-on" aria-hidden="true"></i>On the floor</span>' : ''}<span><b class="ft">PF</b> Foul trouble</span><span><b class="fo">PF</b> Fouled out</span></p>`;
  }
  // Each team's injuries under its own box score column: away on the left, home on the right
  if (data.injuries.length) {
    const order = [data.away, data.home].map(t => data.injuries.find(x => x.teamId === t.id)).filter(Boolean);
    const rest = data.injuries.filter(x => !order.includes(x));
    out += `<div class="bx-inj"><h3 class="bx-team">Injury report</h3><div class="box-pair">${order.concat(rest).map(t => `<div><p class="bx-inj-tm">${UI.logo(NBA.T(t.teamId), 20)}${esc(NBA.T(t.teamId).name || NBA.T(t.teamId).abbr)}</p>
      <ul class="inj2">${t.list.map(i => `<li><b>${esc(i.name)}</b> <span class="mut">${esc(i.status)}${i.type ? ' · ' + esc(i.type) : ''}</span></li>`).join('')}</ul></div>`).join('')}</div></div>`;
  }
  return out;
}
function boxTeam(b, d, data) {
  const t = NBA.T(b.teamId), live = data.state === 'in';
  // Live, personal fouls join the key stats: foul trouble decides who stays on the floor
  const idx = b.keys.map((k, i) => i).filter(i => NBA.S.boxCols === 'full' || BOX_COMPACT.includes(b.keys[i]) || (live && b.keys[i] === 'fouls'));
  const played = b.players.filter(p => !p.dnp), dnp = b.players.filter(p => p.dnp && !p.yet), yet = b.players.filter(p => p.yet);
  // The five on the floor, while live; anything other than 1 to 5 of them means ESPN's flag can't be trusted
  const nOn = played.filter(p => p.onCourt).length, onOk = live && nOn > 0 && nOn <= 5;
  // Foul trouble: 2 in the 1st, 3 in the 2nd, 4 in the 3rd, 5 after that. 6 (or an ejection) is out of the game
  const pfI = b.keys.indexOf('fouls'), trouble = (data.period || 0) >= 4 ? 5 : (data.period || 0) + 1;
  const pfCls = p => {
    const n = NBA.num(p.stats[pfI]);
    return p.ejected || n >= 6 ? 'fo' : live && data.period && n >= trouble ? 'ft' : '';
  };
  const cell = (p, i) => {
    const c = [b.keys[i] === 'points' ? 'pts' : '', i === pfI ? pfCls(p) : ''].filter(Boolean).join(' ');
    return `<td${c ? ` class="${c}"` : ''}>${esc(p.stats[i] ?? '')}</td>`;
  };
  const th = idx.map(i => {
    const on = d.sort && d.sort.k === b.keys[i];
    return `<th scope="col"><button class="sortb${on ? ' on' : ''}" data-act="sort" data-k="${esc(b.keys[i])}" aria-label="Sort by ${esc(b.labels[i])}">${esc(b.labels[i])}${on ? (d.sort.desc ? ' ↓' : ' ↑') : ''}</button></th>`;
  }).join('');
  // A name opens the player's card, which has a button back to this game
  const prow = p => {
    const on = onOk && p.onCourt, tag = p.ejected ? ' (ejected)' : on ? ' (on the floor)' : '';
    return `<tr${on ? ' class="on"' : ''}><th class="pl" scope="row"><button class="plink" data-act="player" data-id="${esc(p.id)}">${esc(p.name)}</button>${tag ? `<span class="sr">${tag}</span>` : ''}<span class="pp">${esc(p.pos || '')}</span></th>${idx.map(i => cell(p, i)).join('')}</tr>`;
  };
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
    ${yet.length ? `<p class="dnp">Not in yet: ${yet.map(p => esc(p.name)).join(', ')}</p>` : ''}
    ${dnp.length ? `<p class="dnp">Did not play: ${dnp.map(p => esc(p.name) + (p.reason ? ` (${esc(p.reason.toLowerCase())})` : '')).join(', ')}</p>` : ''}</div>`;
}
function paneTeam(data) {
  const a = data.tstats.find(x => x.teamId === data.away.id), h = data.tstats.find(x => x.teamId === data.home.id);
  if (!a || !h || !Object.keys(a.m).length) return `<p class="empty">Team stats fill in once the game tips off.</p>`;
  const [ca, ch] = NBA.tones(data.away, data.home);
  // How the game went: ESPN's lead changes (one number for the game), and ties and the biggest run from the scoring
  // plays. Left out until ESPN counts lead changes
  const f = NBA.gameFlow(data), b = f && f.best, lc = parseInt(a.m.leadChanges, 10);
  const at = p => `${NBA.perLabel(p.period)} ${p.clock}`;
  const flow = !Number.isFinite(lc) || !f ? '' : `<div class="cmp-flow">
      <div><b>${lc}</b><small>Lead change${lc === 1 ? '' : 's'}</small></div><div><b>${f.ties}</b><small>Tie${f.ties === 1 ? '' : 's'}</small></div>
      ${b ? `<div><b>${esc(abbrOf(data, b.teamId))} ${b.n}-0</b><small>Biggest run · ${esc(b.from.period === b.to.period ? `${at(b.from)}–${b.to.clock}` : `${at(b.from)}–${at(b.to)}`)}</small></div>` : ''}</div>`;
  // Technicals only once someone has one
  const tech = +a.m.technicalFouls || +h.m.technicalFouls;
  const rows = TEAM_STATS.filter(([k]) => a.m[k] != null && h.m[k] != null && (k !== 'technicalFouls' || tech)).map(([k, label, split, pct, lowerBetter]) => {
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
  return `${flow}<div class="cmp"><div class="cmp-head"><span></span><span>${esc(data.away.abbr)}</span><span>${esc(data.home.abbr)}</span><span></span></div>${rows}</div>
    <p class="note">The stronger number in each row is bold. For turnovers and fouls, fewer is better. Time leading leaves out the time tied.</p>`;
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
/* The chart runs on the game clock: 12-minute quarters across the width, and 5 minutes more for each overtime played.
   A live game's line stops partway, with what's left of the game still empty. Each point takes its play's time; one
   without a usable play or clock keeps the time before it, and time never runs backwards */
const perStart = p => p <= 4 ? (p - 1) * 720 : 2880 + (p - 5) * 300;
function wpTimes(data) {
  const pm = new Map(data.plays.map(p => [p.id, p]));
  let t = 0, top = 4;
  const ts = data.wp.map(w => {
    const pl = pm.get(String(w.playId));
    const m = pl && /^(\d+):(\d+(?:\.\d+)?)$|^(\d+(?:\.\d+)?)$/.exec(pl.clock), per = pl && pl.period;
    if (m && per > 0) {
      const left = m[3] != null ? +m[3] : +m[1] * 60 + +m[2];
      t = Math.max(t, perStart(per) + Math.max(0, (per <= 4 ? 720 : 300) - left));
      top = Math.max(top, per);
    }
    return t;
  });
  return { ts, pm, T: perStart(top + 1), periods: top };
}
function wpGeom(T) {
  return {
    x: s => WP.l + Math.min(1, s / T) * (WP.W - WP.l - WP.r),
    y: v => WP.t + (1 - v) * (WP.H - WP.t - WP.b),
  };
}
function paneWp(data) {
  const pts = data.wp;
  if (!pts || pts.length < 2) return `<p class="empty">The win chance chart starts once the game is underway.</p>`;
  const n = pts.length, { ts, T, periods } = wpTimes(data), { x, y } = wpGeom(T);
  const [ca, ch] = NBA.tones(data.away, data.home);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(ts[i]).toFixed(1)},${y(p.homeWinPercentage).toFixed(1)}`).join('');
  const area = `${line}L${x(ts[n - 1]).toFixed(1)},${y(.5).toFixed(1)}L${x(ts[0]).toFixed(1)},${y(.5).toFixed(1)}Z`;
  // Every quarter is marked from the start, so the empty part of a live game's chart shows how much is left
  let seps = '';
  for (let p = 1; p <= periods; p++) {
    const sx = x(perStart(p));
    if (p > 1) seps += `<line class="sep" x1="${sx.toFixed(1)}" x2="${sx.toFixed(1)}" y1="${WP.t}" y2="${WP.H - WP.b}"/>`;
    seps += `<text class="ax" x="${(sx + 4).toFixed(1)}" y="${WP.H - 8}">${NBA.perLabel(p)}</text>`;
  }
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
      <circle class="end" cx="${x(ts[n - 1]).toFixed(1)}" cy="${y(lastV).toFixed(1)}" r="5"/>
      <text class="axb" x="${(x(ts[n - 1]) + 9).toFixed(1)}" y="${(y(lastV) + 4).toFixed(1)}">${esc(endTeam)} ${endPct}%</text>
      <line class="hx" id="wphx" y1="${WP.t}" y2="${WP.H - WP.b}" visibility="hidden"/>
      <circle class="end" id="wpdot" r="5" visibility="hidden"/>
    </svg><div class="wptip" id="wptip" hidden></div></div>
    <p class="note">${esc(desc)}. Shaded above the dashed line favors ${esc(data.home.abbr)}, below favors ${esc(data.away.abbr)}. Hover or drag across the chart to see each play.</p>`;
}
/* Live polls replace the chart. On an iPhone a drag stays with the SVG it started on, so a finger that's down holds the
   pane (UI.wpHold, checked in renderDrawer) until it lifts or the page takes over the gesture for a scroll. A mouse
   needs no hold, since its next move finds the new chart, but the hover line is put back where the pointer rests */
let wpAt = null;
function bindWp(data) {
  const svg = $('#wpsvg'), tip = $('#wptip'), hx = $('#wphx'), dot = $('#wpdot');
  if (!svg) return;
  const pts = data.wp, n = pts.length, { ts, pm, T } = wpTimes(data), { x, y } = wpGeom(T);
  // The point nearest in game time; of several at the same moment (free throws), the last
  const near = s => {
    let lo = 0, hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ts[m] <= s) lo = m + 1; else hi = m; }
    let i = lo - 1;
    if (lo < n && (i < 0 || ts[lo] - s < s - ts[i])) { i = lo; while (i + 1 < n && ts[i + 1] === ts[i]) i++; }
    return Math.max(0, i);
  };
  const show = e => {
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const sx = (e.clientX - r.left) / r.width * WP.W;
    const i = near((sx - WP.l) / (WP.W - WP.l - WP.r) * T);
    const p = pts[i], pl = pm.get(String(p.playId)) || {}, px0 = x(ts[i]);
    const v = p.homeWinPercentage, lead = v >= .5 ? data.home.abbr : data.away.abbr, pct = Math.round((v >= .5 ? v : 1 - v) * 100);
    hx.setAttribute('x1', px0); hx.setAttribute('x2', px0); hx.setAttribute('visibility', 'visible');
    dot.setAttribute('cx', px0); dot.setAttribute('cy', y(v)); dot.setAttribute('visibility', 'visible');
    tip.innerHTML = `<b>${esc(lead)} ${pct}% · ${pl.period ? NBA.perLabel(pl.period) + ' ' + esc(pl.clock) : ''}</b>${esc(pl.text || '')}${pl.away != null ? ` <span>(${esc(pl.away)}–${esc(pl.home)})</span>` : ''}`;
    tip.hidden = false;
    const px = px0 / WP.W * r.width, half = tip.offsetWidth / 2;
    tip.style.left = Math.max(half, Math.min(r.width - half, px)) + 'px';
    if (v >= .5) { tip.style.top = 'auto'; tip.style.bottom = (WP.b / WP.H * r.height + 4) + 'px'; }
    else { tip.style.top = '4px'; tip.style.bottom = 'auto'; }
  };
  const hide = () => { tip.hidden = true; hx.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); };
  const letGo = () => { if (UI.wpHold !== svg) return; UI.wpHold = null; NBA.changed(); };
  svg.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') wpAt = { clientX: e.clientX, clientY: e.clientY }; show(e); });
  svg.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') UI.wpHold = svg; show(e); });
  svg.addEventListener('pointerup', letGo);
  svg.addEventListener('pointercancel', () => { hide(); letGo(); });
  svg.addEventListener('pointerleave', () => { wpAt = null; hide(); letGo(); });
  // A mouse resting on the old chart: show the play under it on this one (unless it has since moved off)
  if (wpAt) {
    const r = svg.getBoundingClientRect();
    if (wpAt.clientX >= r.left && wpAt.clientX <= r.right && wpAt.clientY >= r.top && wpAt.clientY <= r.bottom) show(wpAt);
    else wpAt = null;
  }
}

/* ---------- settings ---------- */
UI.openSettings = opener => {
  UI.lastFocus = opener || document.activeElement;
  UI.drawer = null; UI.drawerBack = null; $('#drawer').hidden = true;
  UI.settingsOpen = true; UI.resetArmed = false;
  // Its own history entry, like a game's: the browser's or the mouse's Back button closes Settings and stays on this tab
  if (!UI.histPushed) { history.pushState({ nbaSettings: 1 }, ''); UI.histPushed = true; }
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
  // With no saved choice the theme follows the phone, so the button for what's showing is the pressed one
  const cur = k => k === 'theme' && S.theme === 'system' ? (NBA.isDark() ? 'dark' : 'light') : (S[k] || '');
  const seg = (k, opts, label) => `<div class="seg big" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button data-act="set" data-k="${k}" data-v="${v}" aria-pressed="${cur(k) === v}">${l}</button>`).join('')}</div>`;
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
function applyLook() { applyLookInner(); syncThemeColor(); }
function applyLookInner() {
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
/* The browser's toolbar takes the header's actual color: the chosen theme, tinted when team colors are on.
   One meta tag without a media query, so it no longer follows only the phone's own setting */
function syncThemeColor() {
  const top = $('#top'); if (!top) return;
  let c = getComputedStyle(top).backgroundColor; // resolves the color-mix team tint
  // color-mix() comes back as color(srgb r g b), which a theme-color may not accept
  const m = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)/.exec(c);
  if (m) c = `rgb(${[m[1], m[2], m[3]].map(v => Math.round(Math.min(1, Math.max(0, +v)) * 255)).join(', ')})`;
  document.querySelectorAll('meta[name="theme-color"]').forEach((n, i) => { if (i) n.remove(); else { n.removeAttribute('media'); if (n.getAttribute('content') !== c) n.setAttribute('content', c); } });
}
UI.applyLook = applyLook;
// A theme that follows the phone changes with it (older Safari has no addEventListener here)
const darkMq = matchMedia('(prefers-color-scheme: dark)');
if (darkMq.addEventListener) darkMq.addEventListener('change', () => { if (NBA.S.theme === 'system') { applyLook(); NBA.changed(); } });
function repaintAll() {
  document.querySelectorAll('#view, #tabbar, #settings').forEach(el => { el._html = null; });
  // A game window repaints part by part and keeps its frame, so focus stays on the button just pressed (Key stats / All
  // stats); a player card repaints whole
  const dr = $('#drawer'), parts = dr.querySelectorAll('.dr-part, #dr-pane');
  if (parts.length) parts.forEach(n => { n._html = null; }); else dr._html = null;
  NBA.render();
}

/* ---------- events ---------- */
Object.assign(NBA.actions, {
  game: a => UI.openGame(a.dataset.id, a),
  reveal: a => { UI.reveal(a.dataset.id); NBA.changed(); },
  close: () => UI.closeAll(),
  settings: a => UI.openSettings(a),
  // The header's live button always lands on today's live games, even from another day or deep in the season list
  golive: () => {
    NBA.dayParam = '';
    if (UI.route().tab !== 'schedule') location.hash = '#schedule'; // the hashchange handler scrolls to the top and re-renders
    else { window.scrollTo(0, 0); NBA.changed(); }
  },
  dtab: a => { if (UI.drawer) { UI.drawer.tab = a.dataset.v; renderDrawer(); } },
  // A team's button above the phone box score slides to that team
  boxteam: a => {
    const bs = $('#drawer .box-swipe'), i = +a.dataset.v;
    if (!bs || !UI.drawer) return;
    UI.drawer.boxIdx = i;
    // Lit straight away: with Reduce Motion the jump fires no scroll that the listener below would hear
    a.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === a)));
    bs.scrollTo({ left: i * bs.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  },
  sort: a => {
    if (!UI.drawer) return;
    const k = a.dataset.k, s = UI.drawer.sort;
    UI.drawer.sort = !k ? null : (s && s.k === k ? { k, desc: !s.desc } : { k, desc: true });
    renderDrawer();
  },
  allplays: () => { if (UI.drawer) { UI.drawer.showAll = true; renderDrawer(); } },
  // From a player card back to the game it was opened from, on the same tab, sort and scroll
  drawerback: () => {
    const b = UI.drawerBack;
    if (!b) return;
    UI.drawerBack = null; UI.drawer = b;
    const el = $('#drawer'); el._html = null;
    renderDrawer();
    el.scrollTop = b.scroll || 0;
    const c = $('#drawer [data-act="close"]'); if (c) c.focus({ preventScroll: true });
  },
  // Full game highlights play in the #vid dialog, a player floating over the middle of the screen, outside the view and
  // the game window so live repaints can't cut a video off. YouTube's own button (or ours) takes it full screen.
  // Watching a game's highlights counts as opening it, so in spoiler mode its score shows afterwards
  yt: a => {
    const id = a.dataset.v, gid = a.dataset.id;
    if (gid && !UI.st.revealed.has(gid)) { UI.reveal(gid); NBA.changed(); }
    UI.playYouTube(id, a.dataset.title);
  },
  vidfs: () => {
    const f = $('#vid .vid-frame iframe, #vid .vid-frame video, #vid .vid-frame img');
    const go = f && (f.requestFullscreen || f.webkitRequestFullscreen);
    if (go) Promise.resolve(go.call(f)).catch(() => {});
  },
  hlclose: () => stopVid($('#vid')),
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
  // Turning spoiler mode on or off starts the reveals over, the kept ones too
  spoilers: t => { NBA.S.spoilers = t.checked; UI.st.revealed.clear(); try { localStorage.removeItem(REVEAL_KEY); } catch (e) { /* storage blocked */ } NBA.save(); NBA.changed(); },
  // The favorite team is also the highlighted team, and drives the team-colors theme. Standings on a phone reopens on its conference
  // The pick is made, so the menu closes first; the header then redraws with the new team instead of waiting
  myTeam: t => { if (!t.value) return; t.blur(); NBA.S.myTeam = t.value; NBA.S.favorites = [t.value]; NBA.save(); UI.st.confIdx = null; applyLook(); repaintAll(); },
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
  // The video dialog and the Schedule's calendar close themselves on Esc; the game under the video stays open
  const vid = $('#vid'), cal = $('#calpop');
  if (e.key === 'Escape' && ((vid && vid.open) || (cal && cal.open))) return;
  // A game or settings window sits on top of the answers panel, so Esc closes it first
  if (e.key === 'Escape') {
    if (UI.drawer || UI.settingsOpen) { UI.closeAll(); return; }
    if (NBA.ask && NBA.ask.isOpen()) { NBA.ask.close(); return; }
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); }
  if (e.key === '/' && !UI.drawer && !UI.settingsOpen && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#ask-input').focus(); }
});
// Emptying the video dialog stops the video and its sound
function stopVid(d) { if (!d) return; if (d.open) d.close(); d.innerHTML = ''; }
/* The floating player: a medium window over the middle of the screen with a title bar (full screen, open at the source,
   close). body is the player itself: an iframe, a <video>, or a picture. tall: a portrait video (reels, phone clips),
   which gets a narrower window. yt: the link under the player is YouTube's big red button. Without <dialog> support the
   link opens instead */
UI.openVid = ({ title, body, link, linkLabel = 'Open', tall = false, hint = '', yt = false }) => {
  const d = $('#vid');
  if (!d || !d.showModal) { if (link) window.open(link, '_blank', 'noopener'); return null; }
  const fs = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  const foot = !link ? '' : yt
    ? `<div class="vid-foot">${hint ? `<span class="vid-msg">${esc(hint)}</span>` : ''}<a class="yt-btn" href="${esc(link)}" target="_blank" rel="noopener">${UI.I.yt}<span>${esc(linkLabel)}</span></a></div>`
    : `<a class="vid-alt" href="${esc(link)}" target="_blank" rel="noopener">${hint ? `<span class="vid-msg">${esc(hint)}</span> ` : ''}${esc(linkLabel)} ↗</a>`;
  d.classList.toggle('tall', !!tall);
  d.innerHTML = `<div class="vid-bar"><b>${esc(title || '')}</b><span class="vid-tools">${fs ? `<button class="ib" data-act="vidfs" aria-label="Full screen" title="Full screen">${UI.I.expand}</button>` : ''}${link ? `<a class="ib" href="${esc(link)}" target="_blank" rel="noopener" aria-label="${esc(linkLabel)}" title="${esc(linkLabel)}">${UI.I.ext}</a>` : ''}<button class="ib" data-act="hlclose" aria-label="Close video" title="Close">${UI.I.close}</button></span></div>
    <div class="vid-frame">${body}</div>${foot}`;
  if (!d.open) d.showModal();
  return d;
};
/* A YouTube video in the floating player. Its still and a spinner hold the window until YouTube's player says it's
   ready (an ad often plays first), so it's never just a black box. The player reports through YouTube's postMessage
   API: an error (the video can't be embedded or played here) swaps the spinner for a clear message, and the "Watch on
   YouTube" link under the player (the YouTube app on a phone) always works */
UI.playYouTube = (id, title) => {
  const watch = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  const src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  const d = UI.openVid({
    title, link: watch, linkLabel: 'Watch on YouTube', hint: 'Not playing?', yt: true,
    body: `<div class="vid-wait" style="background-image:url('https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg')"><span class="vid-spin" aria-hidden="true"></span><span class="vid-wait-t">Loading the video…</span></div>
      <iframe id="ytp" src="${esc(src)}" title="${esc(title || 'Video')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`,
  });
  if (!d) return;
  const f = d.querySelector('#ytp'), wait = d.querySelector('.vid-wait');
  let ready = false;
  const done = () => { ready = true; if (wait) wait.classList.add('gone'); };
  const fail = code => {
    ready = true;
    if (wait) { wait.classList.remove('gone'); wait.classList.add('err'); wait.querySelector('.vid-wait-t').textContent = code === 101 || code === 150 || code === 152 ? "YouTube won't play this video outside YouTube." : "This video won't play here."; }
    const alt = d.querySelector('.vid-foot'); if (alt) alt.classList.add('loud');
  };
  // YouTube answers once told we're listening; hearing anything from it means the player is up
  const hello = () => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'ytp', channel: 'widget' }), '*'); } catch (e) { /* closed */ } };
  const onMsg = e => {
    if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin) || !f.isConnected || e.source !== f.contentWindow) return;
    let m; try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    if (!m || !m.event) return;
    // The still lifts once the video plays, or shortly after the player is up: an ad may be showing (which must be
    // seen and skippable), or a phone may be waiting for a tap on YouTube's own play button
    if (m.event === 'onError') fail(+m.info);
    else if (m.info && m.info.playerState === 1) done();
    else if (m.event === 'onReady' && !ready) setTimeout(() => { if (!wait.classList.contains('err')) done(); }, 1800);
  };
  addEventListener('message', onMsg);
  f.addEventListener('load', () => { hello(); setTimeout(hello, 600); setTimeout(hello, 1500); });
  // Without word from YouTube the still stays up, and after a while the link below says what to do
  setTimeout(() => { if (!ready && f.isConnected) { done(); const alt = d.querySelector('.vid-foot'); if (alt) alt.classList.add('loud'); } }, 9000);
  new MutationObserver((m, o) => { if (!f.isConnected) { removeEventListener('message', onMsg); o.disconnect(); } }).observe(d, { childList: true });
};
(() => {
  const vid = $('#vid');
  if (!vid) return;
  // Esc closes the dialog natively; its close event comes a moment later, so check it wasn't reopened since
  vid.addEventListener('close', e => { if (!e.target.open) e.target.innerHTML = ''; });
  // A tap on the backdrop closes it. A press that starts inside (dragging the seek bar) and ends over the backdrop
  // also fires its click on the dialog, so only a press that started on the backdrop counts
  let downOnBackdrop = false;
  vid.addEventListener('pointerdown', e => { downOnBackdrop = e.target === vid; });
  vid.addEventListener('click', e => { if (e.target === vid && downOnBackdrop) stopVid(vid); downOnBackdrop = false; });
})();

/* ---------- new deploys ---------- */
/* A Home Screen app can run for days without reloading. index.html carries a build stamp (and the same ?v= on every
   asset): after a long time hidden, or half an hour idle, fetch it fresh and reload if the stamp changed, unless a
   window is open or something is being typed */
const BUILD = (document.querySelector('meta[name="build"]') || {}).content || '';
let hiddenAt = 0, lastCheck = Date.now(), lastInput = Date.now();
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => addEventListener(t, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
NBA.checkBuild = async () => {
  lastCheck = Date.now();
  if (!BUILD) return;
  try {
    const html = await (await fetch('./?build=' + Date.now(), { cache: 'no-store' })).text();
    const m = /<meta name="build" content="([^"]+)"/.exec(html);
    const vid = $('#vid');
    const busy = UI.drawer || UI.settingsOpen || (vid && vid.open) || (NBA.ask && (NBA.ask.busy || (NBA.ask.isOpen && NBA.ask.isOpen()))) || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if (m && m[1] !== BUILD && !busy) {
      // Keep what lives only in memory across the reload: the selected day, the games' current rounds and streaks
      // (spoiler reveals are kept in localStorage, see UI.reveal)
      const s = UI.st;
      try { sessionStorage.setItem('nba.keep', JSON.stringify({ day: NBA.dayParam, hl: s.hl, hlStreak: s.hlStreak, quiz: s.quiz, quizStreak: s.quizStreak, slMode: s.slMode, slPractice: s.slPractice })); } catch (e) {}
      location.reload();
    }
  } catch (e) { /* offline: check again later */ }
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && Date.now() - hiddenAt > 10 * 60000) NBA.checkBuild();
});
setInterval(() => { if (!document.hidden && Date.now() - lastCheck > 30 * 60000 && Date.now() - lastInput > 2 * 60000) NBA.checkBuild(); }, 60000);

/* ---------- boot ---------- */
NBA.boot = () => {
  applyLook();
  NBA.need('standings').catch(() => {});
  // The favorite team's schedule also supplies its colors on days it isn't on today's scoreboard
  NBA.need('tsched:' + NBA.S.myTeam).catch(() => {});
  NBA.render();
  setInterval(renderUpdated, 1000);
  NBA.poll();
};
})();
