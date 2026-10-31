/* Readers for the Social tab's sources, each turning a site's posts into the feed's common shape:
   { id, src, author: { name, handle, avatar, verified }, title, text, time (ms), url, stats: { up | likes, replies,
     reposts, quotes, views }, flair, self, news, media: [{ kind: image|video|embed, thumb, full, mp4, hls, embed, w, h, dur }],
     link: { url, domain, title, thumb }, top: { author, text, up }, dup }
   Everything that touches the network comes in through `get`, so the parsers also run on saved pages in a browser. */

export const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const CH = { 'sec-ch-ua': '"Chromium";v="141", "Not?A_Brand";v="8", "Google Chrome";v="141"', 'sec-ch-ua-mobile': '?0', 'sec-ch-ua-platform': '"Windows"' };
export const PAGE_HEADERS = Object.assign({
  'User-Agent': CHROME_UA, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Site': 'none', 'Sec-Fetch-User': '?1', 'Upgrade-Insecure-Requests': '1',
}, CH);

/* ---------- small helpers ---------- */
const decodeEntities = s => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Reddit r/nba, through Arctic Shift ---------- */
/* Reddit closed its own feeds to logged-out readers in 2026, so r/nba comes from Arctic Shift, a public archive of Reddit
   that picks up each post within seconds. It re-reads every post 4 hours after it went up, so a younger post's score
   isn't real yet (sf: score final); until then its comment count, counted from the archive's live comment stream, is the
   signal. Docs: github.com/ArthurHeitmann/arctic_shift/blob/master/api/README.md */
const AS = 'https://arctic-shift.photon-reddit.com/api';
const REPORTER = /^\[(?:charania|shams|haynes|stein|wojnarowski|woj|fischer|scotto|amick|siegel|windhorst|spears|marks|vardon|slater|mcmenamin|youngmisuk|begley|bontemps|lowe|givony|katz|townsend|iko|lewenberg|murray|smith|edwards|medina|pincus|buha|mcdonald|vorkunov)\b/i;
const unamp = s => String(s || '').replace(/&amp;/g, '&');
function redditPreview(p) {
  const im = p.preview && p.preview.images && p.preview.images[0];
  if (!im) return null;
  const r = (im.resolutions || []).find(x => x.width >= 640) || im.source || (im.resolutions || []).slice(-1)[0];
  return r ? { url: unamp(r.url), w: (im.source || r).width, h: (im.source || r).height } : null;
}
export function redditItem(p) {
  const url = unamp(p.url || ''), pv = redditPreview(p), media = [];
  let link = null, dup;
  let m;
  const rv = p.secure_media && p.secure_media.reddit_video;
  if ((m = /streamable\.com\/(?:[eo]\/)?([a-z0-9]+)/i.exec(url))) media.push({ kind: 'video', streamable: m[1], thumb: pv && pv.url, w: pv && pv.w, h: pv && pv.h, mp4: rv && rv.fallback_url && /external-packaged-media/.test(rv.fallback_url) ? rv.fallback_url : undefined });
  else if ((m = /v\.redd\.it\/([a-z0-9]+)/i.exec(url)) || rv) {
    const vid = m ? m[1] : (/v\.redd\.it\/([a-z0-9]+)/i.exec((rv && (rv.hls_url || rv.fallback_url)) || '') || [])[1];
    if (vid) media.push({ kind: 'video', hls: `https://v.redd.it/${vid}/HLSPlaylist.m3u8`, thumb: pv && pv.url, w: (rv && rv.width) || (pv && pv.w), h: (rv && rv.height) || (pv && pv.h), dur: rv && rv.duration });
  } else if (/^https:\/\/i\.redd\.it\//.test(url) || p.post_hint === 'image') media.push({ kind: 'image', thumb: (pv && pv.url) || url, full: url, w: pv && pv.w, h: pv && pv.h });
  else if ((m = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url))) media.push({ kind: 'embed', embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&playsinline=1&rel=0`, thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`, w: 16, h: 9, tall: /shorts\//.test(url) });
  else if (!p.is_self && url && !/reddit\.com\/r\/nba\/comments/.test(url)) {
    let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { /* not a URL */ }
    link = { url, domain: host, title: p.title, thumb: pv && pv.url };
    if ((m = /(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/.exec(url))) dup = 'x:' + m[1];
  }
  const flair = p.link_flair_text || '';
  return {
    id: 'reddit:' + p.id, src: 'reddit', dup,
    author: { name: 'u/' + p.author, handle: 'u/' + p.author },
    title: decodeEntities(p.title), text: p.is_self && p.selftext ? decodeEntities(p.selftext).slice(0, 600) : undefined,
    time: p.created_utc * 1000, url: 'https://www.reddit.com' + (p.permalink || `/r/nba/comments/${p.id}/`),
    stats: { up: p.score || 0, replies: p.num_comments || 0 }, sf: p._meta && p._meta.retrieved_2nd_on ? 1 : undefined,
    flair: flair || undefined, self: p.is_self || undefined, news: REPORTER.test(p.title || '') || /^news$/i.test(flair) || undefined,
    media, link,
  };
}
const keepPost = p => p && p.id && !p.removed_by_category && !(p._meta && p._meta.was_deleted_later) && !p.stickied && !p.over_18 && p.author !== '[deleted]' && p.author !== 'AutoModerator';

/* Each run: the newest posts (more pages until it meets what it already has, up to a day and a half back), the final
   scores of posts that turned 4 hours old, the comments posted since the last run (counted per post), and the top
   replies of the biggest posts whose comment count moved. state carries the newest comment time between runs */
export async function readReddit({ get, prev = [], state = {}, now, log = () => {} }) {
  const json = async url => { const j = JSON.parse(await get(url, { headers: { 'User-Agent': 'shot-clock/1.0 (github.com/dylpatty/shot-clock)', Accept: 'application/json' } })); if (j.error) throw new Error(j.error); return j.data || []; };
  const have = new Map(prev.map(it => [it.id, it]));
  const newest = prev.reduce((t, it) => Math.max(t, it.time), 0);
  const posts = [];
  let before = '';
  for (let page = 0; page < 10; page++) {
    const list = await json(`${AS}/posts/search?subreddit=nba&limit=100${before ? '&before=' + before : ''}`);
    posts.push(...list);
    if (list.length < 100) break;
    const oldest = Math.min(...list.map(p => p.created_utc)) * 1000;
    if (oldest < newest || now - oldest > 30 * 3600000) break;
    before = Math.floor(oldest / 1000);
    await sleep(1200);
  }
  // Scores that became final since the last run (re-read 4 hours after posting)
  const due = prev.filter(it => !it.sf && now - it.time > 4.1 * 3600000).map(it => it.id.slice(7));
  for (let i = 0; i < due.length && i < 300; i += 100) {
    try { posts.push(...await json(`${AS}/posts/ids?ids=${due.slice(i, i + 100).join(',')}`)); } catch (e) { log(`Reddit: final scores didn't load (${e.message})`); }
    await sleep(1000);
  }
  const byId = new Map();
  posts.filter(keepPost).forEach(p => { const it = redditItem(p); const old = byId.get(it.id); if (!old || it.sf || !old.sf) byId.set(it.id, it); });
  // Live comment counts: every comment since the last run, counted per post
  const counts = {};
  let since = state.commentsAt || Math.floor(now / 1000) - 1800, top = since;
  try {
    let cursor = '';
    for (let page = 0; page < 6; page++) {
      const list = await json(`${AS}/comments/search?subreddit=nba&limit=100${cursor ? '&before=' + cursor : ''}`);
      const fresh = list.filter(c => c.created_utc > since);
      fresh.forEach(c => { const id = String(c.link_id || '').replace(/^t3_/, ''); counts[id] = (counts[id] || 0) + 1; top = Math.max(top, c.created_utc); });
      if (fresh.length < list.length || list.length < 100) break;
      cursor = Math.min(...list.map(c => c.created_utc));
      await sleep(1000);
    }
  } catch (e) { log(`Reddit: the comment stream didn't load (${e.message})`); }
  const out = [];
  const all = new Map([...have].map(([k, v]) => [k, v]));
  byId.forEach((it, k) => all.set(k, Object.assign({}, all.get(k) || {}, it, { top: (all.get(k) || {}).top, seen: (all.get(k) || {}).seen })));
  all.forEach((it, k) => {
    const n = counts[k.slice(7)] || 0;
    const seen = (it.seen || 0) + n;
    // Before its score is final, the archive's comment count is a snapshot from when it was posted; the counted stream is live
    const replies = Math.max(it.stats.replies || 0, it.sf ? 0 : seen);
    out.push(Object.assign({}, it, { seen: seen || undefined, stats: Object.assign({}, it.stats, { replies }) }));
  });
  // Top replies for the biggest posts whose comment count moved (a few per run)
  const eng = it => (it.sf ? it.stats.up : 0) + 3 * it.stats.replies;
  const needReplies = out.filter(it => now - it.time < 24 * 3600000 && it.stats.replies >= 20 && it.stats.replies !== (it.top && it.top.at))
    .sort((a, b) => eng(b) - eng(a)).slice(0, 6);
  for (const it of needReplies) {
    try {
      const tree = await json(`${AS}/comments/tree?link_id=${it.id.slice(7)}&limit=50`);
      const best = tree.map(t => (t && t.data) || t).filter(c => c && c.body && c.author !== 'AutoModerator' && !c.stickied && !/^\[(deleted|removed)\]$/.test(c.body)).sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      if (best) it.top = { author: 'u/' + best.author, text: decodeEntities(best.body).slice(0, 300), up: best.score || undefined, at: it.stats.replies };
    } catch (e) { /* replies are a nice-to-have */ }
    await sleep(900);
  }
  return { items: out, state: { commentsAt: top } };
}

/* ---------- X ---------- */
/* X has no free API. Posts are found three ways:
   - the accounts themselves (the league, all 30 teams, star players, insiders, NBA media), read through Nitter mirrors'
     RSS (each account's newest 20 posts), a third of the list each run so every account is read every half hour; the
     timeline behind X's own embedded-timeline widget is tried first, but GitHub's servers share its per-address limit
   - searches on a Nitter mirror for popular posts from anyone that name the NBA, a team, a star player or a coach,
     two pages each
   - r/nba links
   Counts and media for every post come from the data behind X's embedded-post widget */
const X_LEAGUE = ['NBA', 'NBATV', 'NBAonPrime', 'NBAonNBC', 'ESPNNBA'];
export const X_TEAMS = ['ATLHawks', 'celtics', 'BrooklynNets', 'hornets', 'chicagobulls', 'cavs', 'dallasmavs', 'nuggets', 'DetroitPistons', 'warriors', 'HoustonRockets', 'Pacers', 'LAClippers', 'Lakers', 'memgrizz', 'MiamiHEAT', 'Bucks', 'Timberwolves', 'PelicansNBA', 'nyknicks', 'okcthunder', 'OrlandoMagic', 'sixers', 'Suns', 'trailblazers', 'SacramentoKings', 'spurs', 'Raptors', 'utahjazz', 'WashWizards'];
const X_PLAYERS = ['KingJames', 'StephenCurry30', 'KDTrey5', 'JoelEmbiid', 'jaytatum0', 'AntDavis23', 'Giannis_An34', 'luka7doncic', 'DevinBook', 'JaMorant', 'TheTraeYoung', 'Dame_Lillard', 'KyrieIrving', 'JHarden13', 'KarlTowns', 'swipathefox', 'jalenbrunson1', 'KlayThompson', 'Money23Green', 'CJMcCollum', 'FCHWPO', 'Zionwilliamson', 'Bam1of1', 'TyHaliburton22', 'wemby', 'shaiglalex', 'theantedwards_'];
const X_INSIDER_LIST = ['ShamsCharania', 'ChrisBHaynes', 'TheSteinLine', 'JakeLFischer', 'MikeAScotto', 'BobbyMarks42', 'TimBontemps', 'anthonyVslater', 'WindhorstESPN', 'KCJHoop', 'ZachLowe_NBA'];
const X_MEDIA = ['BleacherReport', 'HoHighlights', 'TheHoopCentral', 'UnderdogNBA', 'ClutchPointsApp', 'SLAMonline', 'Ballislife', 'TheNBACentral'];
export const X_ACCOUNTS = [...X_LEAGUE, ...X_TEAMS, ...X_PLAYERS, ...X_INSIDER_LIST, ...X_MEDIA];
export const X_TIMELINES = ['NBA', 'BleacherReport', 'warriors', 'Lakers', 'celtics', 'NBATV'];
// Accounts whose posts always count; anyone else's has to be about the NBA
const X_NBA_ONLY = new Set([...X_LEAGUE, ...X_TEAMS, ...X_PLAYERS, ...X_INSIDER_LIST, 'UnderdogNBA', 'TheNBACentral', 'TheHoopCentral', 'NBAonTNT', 'HoHighlights'].map(s => s.toLowerCase()));
const X_INSIDERS = new Set([...X_INSIDER_LIST, 'KeithSmith', 'wojespn'].map(s => s.toLowerCase()));
export const NITTER = ['nitter.kareem.one', 'nitter.mizuki.st', 'nitter.jaydenha.uk', 'nitter.mie.foundation', 'nitter.netbub.com'];
// Searches: popular posts from anyone naming the league, a team, a star or a coach (each one two pages of 20)
const X_SEARCHES = [
  ['nba', 800],
  ['(lakers OR celtics OR warriors OR knicks OR sixers OR 76ers OR nets OR raptors OR bulls OR cavs OR cavaliers OR pistons OR pacers OR bucks OR hawks)', 300],
  ['(hornets OR "miami heat" OR "orlando magic" OR wizards OR nuggets OR timberwolves OR thunder OR blazers OR "utah jazz" OR clippers OR "sacramento kings" OR suns OR mavericks OR mavs OR rockets OR grizzlies OR pelicans OR spurs)', 300],
  ['(lebron OR "steph curry" OR luka OR doncic OR wemby OR wembanyama OR giannis OR jokic OR "shai gilgeous" OR sga OR "anthony edwards" OR "cooper flagg" OR tatum OR embiid OR durant OR brunson OR "ja morant" OR haliburton OR dybantsa OR booker)', 300],
  ['("steve kerr" OR redick OR spoelstra OR mazzulla OR daigneault OR "doc rivers" OR thibodeau OR "jason kidd" OR udoka OR "chris finch" OR "nick nurse" OR "mike budenholzer" OR "kenny atkinson" OR "jb bickerstaff" OR "joe mazzulla")', 150],
];
const BOT_UA = 'shot-clock/1.0 (+https://dylpatty.github.io/shot-clock)';
// Posts from general sports accounts only count when they're about the NBA
export const NBA_WORDS = /\bNBA\b|Lakers|Celtics|Warriors|Knicks|\bNets\b|76ers|Sixers|Raptors|\bBulls\b|Cavaliers|\bCavs\b|Pistons|Pacers|\bBucks\b|\bHawks\b|Hornets|\bHeat\b|\bMagic\b|Wizards|Nuggets|Timberwolves|Wolves|Thunder|Blazers|\bJazz\b|Clippers|\bKings\b|\bSuns\b|Mavericks|\bMavs\b|Rockets|Grizzlies|Pelicans|\bSpurs\b|LeBron|Curry|\bSteph\b|Luka|Giannis|Jokic|Wemby|Wembanyama|Durant|Embiid|Tatum|Edwards|\bShai\b|\bSGA\b|Flagg|Brunson|Morant|Haliburton|Dybantsa|Boozer/i;
// react-tweet's token formula; X doesn't check it today, but it's what its own widget sends
const xToken = id => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');

function xMedia(list) {
  return (list || []).map(m => {
    const w = (m.original_info && m.original_info.width) || (m.sizes && m.sizes.large && m.sizes.large.w), h = (m.original_info && m.original_info.height) || (m.sizes && m.sizes.large && m.sizes.large.h);
    if (m.type === 'photo') return { kind: 'image', thumb: m.media_url_https + '?format=jpg&name=small', full: m.media_url_https + '?format=jpg&name=large', w, h };
    const vs = ((m.video_info && m.video_info.variants) || []);
    const mp4 = vs.filter(v => /mp4/.test(v.content_type || v.type || '')).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const best = mp4.find(v => (v.bitrate || 0) <= 2200000) || mp4[mp4.length - 1];
    const hls = vs.find(v => /mpegurl/i.test(v.content_type || v.type || ''));
    return { kind: 'video', thumb: m.media_url_https, mp4: best && (best.url || best.src), hls: hls && (hls.url || hls.src), w, h, dur: m.video_info && m.video_info.duration_millis ? Math.round(m.video_info.duration_millis / 1000) : undefined, gif: m.type === 'animated_gif' || undefined, nr: 1 };
  }).filter(x => x.thumb);
}
// Expands t.co links and drops the link X adds for the post's own media
function xText(t) {
  let s = t.full_text || t.text || '';
  const ent = t.entities || {};
  (ent.urls || []).forEach(u => { s = s.split(u.url).join(u.expanded_url || u.display_url || ''); });
  (ent.media || []).forEach(u => { s = s.split(u.url).join(''); });
  return decodeEntities(s.replace(/https:\/\/t\.co\/\w+\s*$/, '')).trim();
}
// One post, from either the timeline widget's data or the embedded-post data
export function xItem(t) {
  if (!t || !t.id_str || !t.user) return null;
  if (t.retweeted_status) return xItem(t.retweeted_status);
  const u = t.user, handle = u.screen_name;
  const media = xMedia((t.extended_entities && t.extended_entities.media) || t.mediaDetails || []);
  return {
    id: 'x:' + t.id_str, src: 'x', dup: 'x:' + t.id_str,
    author: { name: u.name, handle: '@' + handle, avatar: (u.profile_image_url_https || '').replace('_normal.', '_bigger.'), verified: !!(u.is_blue_verified || u.verified || u.verified_type) },
    text: xText(t), time: Date.parse(t.created_at), url: `https://x.com/${handle}/status/${t.id_str}`,
    stats: { likes: t.favorite_count || 0, reposts: t.retweet_count, replies: t.reply_count != null ? t.reply_count : t.conversation_count, quotes: t.quote_count },
    news: X_INSIDERS.has(String(handle).toLowerCase()) || undefined, media, sensitive: !!t.possibly_sensitive,
  };
}
// The widget timeline: __NEXT_DATA__ props.pageProps.timeline.entries[].content.tweet; null when it's the frozen top list
export function xTimeline(html, now) {
  const m = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(html || '');
  if (!m) return null;
  let j; try { j = JSON.parse(m[1]); } catch (e) { return null; }
  const entries = (((j.props || {}).pageProps || {}).timeline || {}).entries || [];
  const items = entries.map(e => xItem(e.content && e.content.tweet)).filter(Boolean);
  const newest = Math.max(0, ...items.map(i => i.time));
  if (entries.length > 25 || now - newest > 48 * 3600000) return null;
  return items;
}
// Nitter RSS: each item's guid is the post id
export const rssIds = xml => [...String(xml || '').matchAll(/<guid[^>]*>(\d{10,25})<\/guid>/g)].map(m => m[1]);

/* Each run: the widget timelines while X allows (it stops at its first refusal), a third of the accounts through the
   mirrors (spread across them in turn, skipping any that fails), the searches (two pages each, on the mirrors that
   search), then counts and media for every new post (newest searches first) and fresh counts for the biggest recent
   ones. extra: post ids found elsewhere (r/nba links). Returns the posts and how many of each step worked */
export async function readX({ get, prev = [], now, extra = [], log = () => {}, maxNew = 260, maxRefresh = 60 }) {
  const found = new Map();
  const keep = it => it && !it.sensitive && now - it.time < 30 * 3600000 && (X_NBA_ONLY.has(it.author.handle.slice(1).toLowerCase()) || NBA_WORDS.test(it.text || ''));
  let tl = 0;
  for (const name of X_TIMELINES) {
    try {
      const list = xTimeline(await get(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${name}`, { headers: PAGE_HEADERS }), now);
      if (list) { tl++; list.filter(keep).forEach(it => found.set(it.id, it)); }
    } catch (e) { if (/429/.test(e.message)) { log('X: the timeline widget refused this run (its limit is shared)'); break; } }
    await sleep(400);
  }
  const RSS = { 'User-Agent': BOT_UA, Accept: 'application/rss+xml, text/xml' };
  const dead = new Set(), searchIds = [], accountIds = [];
  // One mirror after another, starting from a different one each time so the load is shared; a mirror that fails is
  // left out for the rest of the run
  let turn = 0;
  const mirror = async (path, only) => {
    const hosts = (only || NITTER).filter(h => !dead.has(h));
    for (let k = 0; k < hosts.length; k++) {
      const host = hosts[(turn + k) % hosts.length];
      try {
        const r = await get(`https://${host}${path}`, { headers: RSS, withHeaders: true });
        const ids = rssIds(r.text);
        if (ids.length) { turn++; return { ids, cursor: r.header('min-id') }; }
      } catch (e) { if (/HTTP (403|429)|no answer/.test(e.message)) dead.add(host); } // a 5xx can be one route's trouble
    }
    return null;
  };
  // The accounts: a third of the list per run
  const slot = Math.floor(now / 600000) % 3;
  const accounts = X_ACCOUNTS.filter((_, i) => i % 3 === slot);
  let acc = 0;
  for (const u of accounts) {
    const r = await mirror(`/${u}/rss`);
    if (r) { acc++; accountIds.push(...r.ids); }
    await sleep(250);
  }
  // The searches, on the mirrors that search (the others answer with nothing)
  const since = new Date(now - 30 * 3600000).toISOString().slice(0, 10);
  let srch = 0;
  for (const [terms, faves] of X_SEARCHES) {
    const q = encodeURIComponent(`${terms} min_faves:${faves} -filter:replies since:${since}`);
    let r = await mirror(`/search/rss?f=tweets&q=${q}`, NITTER.slice(0, 2));
    if (r) { srch++; searchIds.push(...r.ids); }
    if (r && r.cursor) {
      await sleep(600);
      const r2 = await mirror(`/search/rss?f=tweets&q=${q}&cursor=${encodeURIComponent(r.cursor)}`, NITTER.slice(0, 2));
      if (r2) searchIds.push(...r2.ids);
    }
    await sleep(500);
  }
  // Counts and media: popular finds first, then the accounts' posts and r/nba links, then refreshes
  const known = new Set(prev.map(it => it.id.slice(2)));
  const need = [...new Set([...searchIds, ...extra, ...accountIds])].filter(id => !found.has('x:' + id) && !known.has(id)).slice(0, maxNew);
  const refresh = prev.filter(it => now - it.time < 12 * 3600000 && !found.has(it.id)).sort((a, b) => (b.stats.likes || 0) - (a.stats.likes || 0)).slice(0, maxRefresh).map(it => it.id.slice(2));
  let hyd = 0;
  const queue = [...need, ...refresh];
  // A few at a time: the post data comes from X's CDN, which answered dozens in a row without limits
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const id = queue.shift();
      try {
        const it = xItem(JSON.parse(await get(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${xToken(id)}`, { headers: { 'User-Agent': CHROME_UA, Accept: 'application/json' } })));
        if (keep(it)) { found.set(it.id, it); hyd++; }
      } catch (e) { /* deleted, protected, or not reachable */ }
      await sleep(120);
    }
  }));
  if (!tl && !acc && !srch && !hyd) throw new Error('no X timeline, mirror or post could be read');
  log(`X: ${tl} timelines, ${acc} of ${accounts.length} accounts, ${srch} of ${X_SEARCHES.length} searches, ${need.length} new posts and ${refresh.length} refreshes looked up, ${hyd} kept${dead.size ? `; mirrors down: ${[...dead].join(', ')}` : ''}`);
  return [...found.values()].map(it => { delete it.sensitive; return it; });
}
