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

/* ---------- small parsing helpers ---------- */
// The JSON string literal starting at html[i] (an opening quote), decoded
export function stringAt(html, i) {
  let j = i + 1;
  for (; j < html.length; j++) { const c = html[j]; if (c === '\\') j++; else if (c === '"') break; }
  try { return JSON.parse(html.slice(i, j + 1)); } catch (e) { return null; }
}
// Every <script type="application/json"> block that parses
export function jsonScripts(html) {
  const out = [], re = /<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html || ''))) { try { out.push(JSON.parse(m[1])); } catch (e) { /* not JSON */ } }
  return out;
}
// Every object under root that passes test (not looking inside a match)
export function findAll(root, test, out = []) {
  if (!root || typeof root !== 'object') return out;
  if (test(root)) { out.push(root); return out; }
  for (const k in root) findAll(root[k], test, out);
  return out;
}
const decodeEntities = s => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n));

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
    if ((m = /instagram\.com\/(?:p|reel)\/([\w-]+)/.exec(url))) dup = 'ig:' + m[1];
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
/* X has no free API. Posts are found three ways: the public timelines behind X's embedded-timeline widget (an account's
   newest 20 posts with full counts; some big accounts only get a frozen "top posts" list there, which is skipped), Nitter
   mirrors' RSS (a search for today's most-liked NBA posts, and insiders' feeds), and r/nba links. Counts and media for a
   post come from the data behind X's embedded-post widget */
export const X_TIMELINES = ['NBA', 'BleacherReport', 'espn', 'SportsCenter', 'warriors', 'Lakers', 'celtics', 'NBATV'];
const X_NBA_ONLY = new Set(['NBA', 'warriors', 'Lakers', 'celtics', 'NBATV', 'ShamsCharania', 'UnderdogNBA', 'TheNBACentral', 'TheHoopCentral', 'ChrisBHaynes', 'TheSteinLine', 'JakeLFischer', 'MikeAScotto', 'NBAonPrime', 'NBAonTNT', 'NBAonNBC']);
const X_INSIDERS = new Set(['ShamsCharania', 'ChrisBHaynes', 'TheSteinLine', 'JakeLFischer', 'MikeAScotto', 'KeithSmith', 'wojespn', 'BobbyMarks42', 'TimBontemps', 'anthonyVslater']);
export const NITTER = ['nitter.kareem.one', 'nitter.mizuki.st', 'nitter.jaydenha.uk', 'nitter.mie.foundation', 'nitter.netbub.com'];
const NITTER_FEEDS = ['ShamsCharania', 'UnderdogNBA', 'TheHoopCentral', 'ChrisBHaynes'];
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
    news: X_INSIDERS.has(handle) || undefined, media, sensitive: !!t.possibly_sensitive,
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

export async function readX({ get, prev = [], now, log = () => {} }) {
  const found = new Map();
  const keep = it => it && !it.sensitive && now - it.time < 30 * 3600000 && (X_NBA_ONLY.has(it.author.handle.slice(1)) || NBA_WORDS.test(it.text || ''));
  let tl = 0;
  for (const name of X_TIMELINES) {
    try {
      const list = xTimeline(await get(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${name}`, { headers: PAGE_HEADERS }), now);
      if (list) { tl++; list.filter(keep).forEach(it => found.set(it.id, it)); }
    } catch (e) { if (/429/.test(e.message)) { log('X: timeline limit reached for this run'); break; } }
    await sleep(500);
  }
  // Nitter: today's most-liked NBA posts and the insiders' feeds, from the first mirror that answers
  const ids = new Set();
  const since = new Date(now - 30 * 3600000).toISOString().slice(0, 10);
  const q = encodeURIComponent(`(nba OR lakers OR celtics OR warriors OR knicks OR thunder OR nuggets OR "full highlights") min_faves:2000 since:${since}`);
  // When X turned the timeline widget away (its limit is per address, and GitHub's are shared), the mirrors stand in for it
  const paths = [`/search/rss?f=tweets&q=${q}`, ...NITTER_FEEDS.map(u => `/${u}/rss`), ...(tl ? [] : X_TIMELINES.slice(0, 5).map(u => `/${u}/rss`))];
  let nit = 0;
  for (const p of paths) {
    for (const host of NITTER) {
      try { const xml = await get(`https://${host}${p}`, { headers: { 'User-Agent': BOT_UA, Accept: 'application/rss+xml, text/xml' } }); const got = rssIds(xml); if (got.length) { got.forEach(id => ids.add(id)); nit++; break; } } catch (e) { /* next mirror */ }
    }
    await sleep(400);
  }
  // Posts r/nba linked to aren't known here; the job passes them in through prev's dup keys elsewhere
  const need = [...ids].filter(id => !found.has('x:' + id));
  const refresh = prev.filter(it => now - it.time < 12 * 3600000 && !found.has(it.id)).sort((a, b) => (b.stats.likes || 0) - (a.stats.likes || 0)).slice(0, 25).map(it => it.id.slice(2));
  let hyd = 0;
  for (const id of [...need.slice(0, 40), ...refresh]) {
    try {
      const it = xItem(JSON.parse(await get(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${xToken(id)}`, { headers: { 'User-Agent': CHROME_UA, Accept: 'application/json' } })));
      if (keep(it)) { found.set(it.id, it); hyd++; }
    } catch (e) { /* deleted, or not reachable */ }
    await sleep(250);
  }
  if (!tl && !nit && !hyd) throw new Error('no X timeline, mirror or post could be read');
  log(`X: ${tl} timelines, ${nit} mirror feeds, ${hyd} posts looked up`);
  return [...found.values()].map(it => { delete it.sensitive; return it; });
}

/* ---------- Instagram ---------- */
// Big NBA accounts; each profile page carries its 12 newest posts
export const IG_ACCOUNTS = ['nba', 'houseofhighlights', 'bleacherreport', 'espn', 'nbaonprime', 'slamonline', 'overtime', 'ballislife', 'nbatv', 'warriors'];
const IG_NAMES = { nba: 'NBA', houseofhighlights: 'House of Highlights', bleacherreport: 'Bleacher Report', espn: 'ESPN', nbaonprime: 'NBA on Prime', slamonline: 'SLAM', overtime: 'Overtime', ballislife: 'Ballislife', nbatv: 'NBA TV', warriors: 'Golden State Warriors' };
// Instagram ids count up from 2011: the creation time is in the high bits
export const igTime = pk => Math.floor(Number(BigInt(pk) >> 23n)) + 1314220021721;

// The posts on a logged-out profile page
export function igProfilePosts(html) {
  const nodes = [];
  jsonScripts(html).forEach(j => findAll(j, o => typeof o.pk === 'string' && typeof o.code === 'string' && (o.media_type != null || o.__typename) && o.user, nodes));
  const seen = new Set();
  return nodes.filter(n => !seen.has(n.code) && seen.add(n.code)).map(n => ({
    code: n.code, pk: n.pk, time: igTime(n.pk), user: (n.user && n.user.username) || '',
    caption: (n.caption && n.caption.text) || '', reel: n.product_type === 'clips', video: n.media_type === 2, thumb: n.display_uri || '',
  }));
}
// What a post's official embed page knows: counts, caption, owner and the media files
export function igEmbed(html) {
  const i = (html || '').indexOf('"contextJSON":"');
  if (i < 0) return null;
  const s = stringAt(html, i + '"contextJSON":'.length);
  let ctx; try { ctx = JSON.parse(s); } catch (e) { return null; }
  return (ctx && ctx.gql_data && ctx.gql_data.shortcode_media) || null;
}
export function igItem(post, m) {
  const media = [], dims = x => (x && x.dimensions) || {};
  // A video without its file (the profile embed leaves it out) plays in Instagram's own embedded player
  const embed = `https://www.instagram.com/p/${post.code}/embed/captioned/`;
  const one = x => x.is_video
    ? (x.video_url
      ? { kind: 'video', thumb: x.display_url, mp4: x.video_url, w: dims(x).width, h: dims(x).height, dur: x.video_duration ? Math.round(x.video_duration) : undefined, embed }
      : { kind: 'embed', thumb: x.display_url, embed, w: dims(x).width, h: dims(x).height, tall: dims(x).height > dims(x).width })
    : { kind: 'image', thumb: x.display_url, w: dims(x).width, h: dims(x).height };
  if (m) {
    const kids = m.edge_sidecar_to_children && m.edge_sidecar_to_children.edges;
    if (kids && kids.length) kids.forEach(e => media.push(one(e.node))); else media.push(one(m));
  } else if (post.thumb) media.push({ kind: post.video ? 'embed' : 'image', thumb: post.thumb, embed: `https://www.instagram.com/p/${post.code}/embed/captioned/`, tall: post.reel });
  const owner = (m && m.owner) || {};
  const caption = (m && m.edge_media_to_caption && m.edge_media_to_caption.edges[0] && m.edge_media_to_caption.edges[0].node.text) || post.caption;
  return {
    id: 'ig:' + post.code, src: 'ig', dup: 'ig:' + post.code,
    author: { name: IG_NAMES[owner.username || post.user] || owner.full_name || owner.username || post.user, handle: '@' + (owner.username || post.user), avatar: owner.profile_pic_url || '', verified: !!owner.is_verified },
    text: caption, time: post.time, url: `https://www.instagram.com/${post.reel ? 'reel' : 'p'}/${post.code}/`,
    stats: m ? { likes: (m.edge_liked_by || m.edge_media_preview_like || {}).count || 0, replies: (m.edge_media_to_comment || {}).count || 0, views: m.video_view_count || undefined } : {},
    media,
  };
}
const IG_EMBED_HEADERS = Object.assign({}, PAGE_HEADERS, { 'Sec-Fetch-Dest': 'iframe', 'Sec-Fetch-Site': 'cross-site', Referer: 'https://dylpatty.github.io/' });
delete IG_EMBED_HEADERS['Sec-Fetch-User'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

// An account's official profile embed (/<user>/embed/, what sites embed): its 6 newest posts with likes, comments,
// time and pictures, in one request. Instagram serves it to servers that its profile pages turn away
export function igProfileEmbed(html) {
  const i = (html || '').indexOf('"contextJSON":"');
  if (i < 0) return [];
  let ctx; try { ctx = JSON.parse(stringAt(html, i + '"contextJSON":'.length)).context; } catch (e) { return []; }
  const owner = { username: ctx.username, full_name: ctx.full_name, is_verified: !!(ctx.is_verified || ctx.verified), profile_pic_url: ctx.profile_pic_url };
  return (ctx.graphql_media || []).map(x => x && x.shortcode_media).filter(m => m && m.shortcode)
    .map(m => ({ post: { code: m.shortcode, time: m.taken_at_timestamp ? m.taken_at_timestamp * 1000 : igTime(m.id), user: ctx.username }, m: Object.assign({ owner }, m, { owner: Object.assign({}, owner, m.owner) }) }));
}

/* Each run: every account's newest posts from its profile embed (the profile page as a fallback), then the post's own
   embed page for new videos (the video file) and for the biggest recent posts no longer in the newest six (fresh counts).
   prev: last run's Instagram items */
export async function readInstagram({ get, prev = [], now, maxEmbeds = 14, log = () => {} }) {
  const found = new Map(), fails = [];
  for (const u of IG_ACCOUNTS) {
    let got = [];
    try { got = igProfileEmbed(await get(`https://www.instagram.com/${u}/embed/`, { headers: IG_EMBED_HEADERS })); } catch (e) { /* try the profile page */ }
    if (!got.length) {
      try { got = igProfilePosts(await get(`https://www.instagram.com/${u}/`, { headers: PAGE_HEADERS })).map(post => ({ post, m: null })); } catch (e) { /* neither answered */ }
    }
    if (!got.length) fails.push(u);
    got.filter(g => now - g.post.time < 26 * 3600000).forEach(g => found.set(g.post.code, g));
    await sleep(700);
  }
  if (fails.length === IG_ACCOUNTS.length) {
    // What Instagram sends this machine instead, for the run's log
    const tries = [
      ['embed', 'https://www.instagram.com/nba/embed/', IG_EMBED_HEADERS],
      ['embed, no referrer', 'https://www.instagram.com/nba/embed/', Object.assign({}, IG_EMBED_HEADERS, { Referer: undefined })],
      ['embed, iPhone', 'https://www.instagram.com/nba/embed/', { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', Accept: 'text/html', 'Sec-Fetch-Dest': 'iframe', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Site': 'cross-site' }],
      ['post embed', 'https://www.instagram.com/p/DfJVylCG8nA/embed/captioned/', IG_EMBED_HEADERS],
    ];
    for (const [label, url, h] of tries) {
      try {
        const html = await get(url, { headers: Object.fromEntries(Object.entries(h).filter(([, v]) => v != null)) });
        log(`Instagram check (${label}): ${html.length} bytes, contextJSON ${html.includes('"contextJSON":"') ? 'yes' : 'no'}, route ${(/"canonicalRouteName":"([^"]*)"/.exec(html) || [])[1] || '-'}, login ${/login|LoginAndSignup/i.test(html) ? 'yes' : 'no'}`);
      } catch (e) { log(`Instagram check (${label}): ${e.message}`); }
      await sleep(500);
    }
    throw new Error('no Instagram account could be read: ' + fails.slice(0, 3).join(', '));
  }
  if (fails.length) log(`Instagram: nothing from ${fails.join(', ')}`);
  const had = new Map(prev.map(it => [it.id.slice(3), it]));
  const hasFile = it => (it.media || []).some(x => x.mp4);
  // Videos new this run (or still without a file), then the biggest recent posts that dropped out of the newest six
  const videos = [...found.values()].filter(g => (g.m ? g.m.is_video || g.m.__typename === 'GraphSidecar' : g.post.video) && !(had.get(g.post.code) && hasFile(had.get(g.post.code)))).map(g => g.post);
  const older = prev.filter(it => now - it.time < 12 * 3600000 && !found.has(it.id.slice(3))).sort((a, b) => ((b.stats || {}).likes || 0) - ((a.stats || {}).likes || 0)).slice(0, 6)
    .map(it => ({ code: it.id.slice(3), time: it.time, user: (it.author.handle || '').slice(1) }));
  let n = 0;
  for (const p of [...videos, ...older]) {
    if (n++ >= maxEmbeds) break;
    try {
      const m = igEmbed(await get(`https://www.instagram.com/p/${p.code}/embed/captioned/`, { headers: IG_EMBED_HEADERS }));
      if (m) found.set(p.code, { post: p, m });
    } catch (e) { /* the profile embed's data stands in */ }
    await sleep(600);
  }
  return [...found.values()].map(g => igItem(g.post, g.m));
}
