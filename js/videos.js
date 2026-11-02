/* Videos, from YouTube: postgame interviews from all 30 team channels, the league's own uploads, stat breakdowns and
   podcasts. The list comes from .github/workflows/highlights.yml (videos.json; each channel is read every half hour
   or two), and every video plays in the site's floating player. Besides the Videos tab, team pages show the videos
   about that team and the game view shows a game's postgame interviews and related videos. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui, st = UI.st;
const { esc } = NBA;
const V = NBA.views;
const RAW = 'https://raw.githubusercontent.com/dylpatty/shot-clock/highlights/';
const HOUR = 36e5;
st.vid = st.vid || { kind: 'all', mine: false, limit: 24 };
const S = st.vid;

NBA.def('videos', 5 * 60000, () => NBA.getJSON(RAW + 'videos.json').catch(e => { if (e.message === 'HTTP 404') return { items: [], channels: {} }; throw e; }));

const KINDS = [['all', 'All'], ['interview', 'Interviews'], ['breakdown', 'Breakdowns'], ['podcast', 'Podcasts'], ['highlights', 'Highlights'], ['feature', 'Features']];
const LABEL = { interview: 'Interview', breakdown: 'Breakdown', podcast: 'Podcast', highlights: 'Highlights', feature: 'Feature' };
const ago = t => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };
const viewsTxt = n => n == null ? '' : n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M views` : n >= 1e3 ? `${Math.round(n / 1e3)}K views` : `${n} views`;
// How interesting a video is: views per hour since it went up, damped so a day-old hit doesn't bury tonight's
// interviews, with breakdowns and interviews lifted a little over highlights (the NBA's own get millions regardless)
const score = v => ((v.views || 0) + 50) / Math.pow((Date.now() - v.t) / HOUR + 2, 0.9) * ({ breakdown: 1.4, interview: 1.3, podcast: 1.2, highlights: 0.8, feature: 1 }[v.kind] || 1);
const channel = (d, v) => (d.channels && d.channels[v.ch] && d.channels[v.ch].name) || v.ch;

/* One video. hide: spoiler mode is on and the title could give the result away, so it and the still are covered;
   playing it reveals the game it belongs to (gid) like the full game highlights do */
UI.vcard = (v, d, { hide = false, gid = '' } = {}) => `<button class="vc${hide ? ' hide' : ''}" data-act="yt" data-v="${esc(v.id)}"${gid ? ` data-id="${esc(gid)}"` : ''} data-title="${esc(v.title)}">
    <span class="vc-img"><img src="https://i.ytimg.com/vi/${esc(v.id)}/mqdefault.jpg" alt="" loading="lazy" decoding="async">${v.len ? `<span class="vc-dur">${NBA.fmtDur(v.len)}</span>` : ''}<span class="vc-kind k-${v.kind}">${LABEL[v.kind] || 'Video'}</span><span class="vc-play" aria-hidden="true">▶</span></span>
    <span class="vc-t">${hide ? 'Title hidden while spoiler mode is on' : esc(v.title)}</span>
    <span class="vc-m">${esc(channel(d, v))} · ${ago(v.t)}${v.views != null ? ' · ' + viewsTxt(v.views) : ''}</span></button>`;
const spoils = v => NBA.S.spoilers && (v.kind === 'interview' || v.kind === 'highlights' || NBA.spoils(v.title));
// A sideways strip of videos (it scrolls on its own, so a swipe on it doesn't change tabs or close the game)
const row = (list, d, opts) => `<div class="vrow">${list.map(v => UI.vcard(v, d, opts && opts(v))).join('')}</div>`;

/* ---------- the Videos tab ---------- */
V.videos = () => {
  const d = NBA.use('videos'), my = NBA.S.myTeam, mt = NBA.T(my);
  const head = `<div class="sec-h"><h2>Videos</h2><span class="sub">Interviews, breakdowns, podcasts and more, from YouTube</span></div>`;
  if (!d) return `<section class="sec">${head}${NBA.status('videos').err ? `<p class="empty">Couldn't load the videos. It will try again shortly.</p>` : '<p class="loading">Loading videos…</p>'}</section>`;
  const chips = KINDS.map(([k, l]) => `<button class="chip" data-act="vkind" data-v="${k}" aria-pressed="${S.kind === k}">${l}</button>`).join('')
    + (mt.abbr ? `<button class="chip" data-act="vmine" aria-pressed="${S.mine}">${mt.logo ? UI.logo(mt, 16) : ''}${esc(mt.name || 'My team')} only</button>` : '');
  let items = d.items || [];
  if (S.mine && my) items = items.filter(v => v.teams.includes(String(my)));
  let body;
  if (!items.length) body = `<p class="empty">${S.mine ? `No ${esc(mt.name || 'team')} videos in the last two weeks.` : 'No videos yet. They show up as the channels post.'}</p>`;
  else if (S.kind === 'all') {
    // Shelves: interviews from the last day and a half, newest first, then the most interesting of each kind
    const shelf = (title, list, kind) => list.length ? `<div class="vshelf"><div class="vshelf-h"><h3>${title}</h3><button class="link" data-act="vkind" data-v="${kind}">See all</button></div>${row(list, d, v => ({ hide: spoils(v) }))}</div>` : '';
    const top = k => items.filter(v => v.kind === k).sort((a, b) => score(b) - score(a)).slice(0, 12);
    const fresh = items.filter(v => v.kind === 'interview' && Date.now() - v.t < 36 * HOUR).sort((a, b) => b.t - a.t).slice(0, 16);
    body = shelf('Latest interviews', fresh.length ? fresh : top('interview'), 'interview') + shelf('Breakdowns and analysis', top('breakdown'), 'breakdown')
      + shelf('Podcasts', top('podcast'), 'podcast') + shelf('Highlights', top('highlights'), 'highlights') + shelf('Features', top('feature'), 'feature');
  } else {
    const list = items.filter(v => v.kind === S.kind).sort(S.kind === 'interview' ? (a, b) => b.t - a.t : (a, b) => score(b) - score(a));
    body = list.length ? `<div class="vgrid">${list.slice(0, S.limit).map(v => UI.vcard(v, d, { hide: spoils(v) })).join('')}</div>${list.length > S.limit ? `<button class="btn vmore" data-act="vmore">Show more</button>` : ''}`
      : `<p class="empty">Nothing in ${esc((KINDS.find(k => k[0] === S.kind) || [])[1] || 'this')} right now.</p>`;
  }
  return `<section class="sec">${head}<div class="vchips" role="group" aria-label="Kind of video">${chips}</div>${body}</section>`;
};
Object.assign(NBA.actions, {
  vkind: a => { S.kind = a.dataset.v; S.limit = 24; NBA.changed(); if (a.closest('.vshelf')) window.scrollTo({ top: 0 }); },
  vmine: () => { S.mine = !S.mine; NBA.changed(); },
  vmore: () => { S.limit += 24; NBA.changed(); },
});

/* ---------- team pages ---------- */
// The team's own uploads and everything else about them: the last two days' interviews first, newest first, then the
// most interesting of the rest
NBA.teamVideos = id => {
  const d = NBA.use('videos');
  if (!d || !d.items) return '';
  const all = d.items.filter(v => v.teams.includes(String(id)));
  if (!all.length) return '';
  const recent = all.filter(v => v.kind === 'interview' && Date.now() - v.t < 48 * HOUR).sort((a, b) => b.t - a.t);
  const rest = all.filter(v => !recent.includes(v)).sort((a, b) => score(b) - score(a));
  const t = NBA.T(id);
  return `<div class="card w12 vcard-team"><div class="card-h"><h3>${esc(t.name || 'Team')} videos</h3><div class="end"><span class="eyebrow">Interviews, podcasts and more from YouTube</span></div></div>
    <div class="card-b">${row(recent.concat(rest).slice(0, 18), d, v => ({ hide: spoils(v) }))}</div></div>`;
};

/* ---------- the game view ---------- */
// Words in a title beat the time it went up, which can be as rough as "1d ago": a shootaround or practice is the
// run-up, a postgame press conference or the game's highlights come after
const PRE = /shootaround|pre[- ]?game|practice|morning|training camp|media day/i;
const POST = /post[- ]?game|walk-?off|after (?:the |a )?(?:game|win|loss)|recaps?\b|breaks? down|full game|highlights/i;
// The videos about one game: either team's, from its day. A title's own date ("| Oct. 30, 2026") settles which game;
// without one, the time it went up does. One naming both teams can come a day and a half later (some teams post the
// next day); one naming only its own team must be within 20 hours, before the team's next game
function forGame(g, d) {
  const ids = [g.away && g.away.id, g.home && g.home.id].filter(Boolean).map(String);
  const tip = Date.parse(g.date), day = NBA.etDay(g.date);
  if (!ids.length || !Number.isFinite(tip)) return { pre: [], post: [] };
  const both = v => ids.every(x => v.teams.includes(x));
  // A video that names a team outside this game (and not this game's other team) is about another game, like the
  // 76ers' "Win Over Knicks" from the night before
  const mine = d.items.filter(v => v.teams.some(x => ids.includes(x)) && (both(v) || v.teams.every(x => ids.includes(x))));
  const isPost = v => {
    if (PRE.test(v.title) || (v.date && v.date !== day)) return false;
    if (v.date) return POST.test(v.title) || v.t > tip;
    return v.t > tip + 45 * 60000 && v.t < tip + (both(v) ? 36 : 20) * HOUR;
  };
  const post = mine.filter(isPost);
  const pre = mine.filter(v => !post.includes(v) && !POST.test(v.title) && (v.date ? v.date === day : v.t > tip - 20 * HOUR && v.t <= tip));
  const order = (a, b) => (both(b) - both(a)) || score(b) - score(a);
  return { pre: pre.sort(order).slice(0, 12), post: post.sort(order) };
}
NBA.gameVideos = (g, state) => {
  const d = NBA.use('videos');
  if (!d || !d.items || !g) return '';
  const { pre, post } = forGame(g, d);
  // Opening a game reveals it (see the full game highlights in ui.js), so nothing here is covered for spoilers
  const opts = () => ({ gid: g.id });
  let out = '';
  if (state === 'post') {
    const talk = post.filter(v => v.kind === 'interview'), more = post.filter(v => v.kind !== 'interview');
    const ended = Date.now() - Date.parse(g.date) < 6 * HOUR;
    out += talk.length ? `<div class="dr-vh"><h3 class="bx-team">Postgame interviews</h3></div>${row(talk, d, opts)}`
      : ended ? `<div class="dr-vh"><h3 class="bx-team">Postgame interviews</h3></div><p class="note">They usually go up on the teams' YouTube channels within an hour or two of the final, and show up here on their own.</p>` : '';
    if (more.length) out += `<div class="dr-vh"><h3 class="bx-team">More videos</h3></div>${row(more.slice(0, 12), d, opts)}`;
  } else if (pre.length) {
    out += `<div class="dr-vh"><h3 class="bx-team">Before the game</h3></div>${row(pre, d, () => ({}))}`;
  }
  return out ? `<div class="dpad dr-videos">${out}</div>` : '';
};
})();
