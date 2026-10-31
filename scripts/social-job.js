/* Run by .github/workflows/highlights.yml every 10 minutes: reads r/nba and X, merges them into the last day's feed
   (social.json) and the week's and season's biggest posts (social-archive.json), written to $OUT and $OUT_ARCH.
   A source that fails keeps its last posts and is marked in social.json's status, so the site can say so; only the daily
   check run ($CHECK=true) fails, and only if every source failed */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readReddit, readX } from './social-sources.js';
import { mergeFeed, buildArchive, slim, engagement } from './socialcore.js';

const { PREV, PREV_ARCH, OUT = 'social.json', OUT_ARCH = 'social-archive.json' } = process.env;
const CHECK = process.env.CHECK === 'true';
// The feed's sites and how many of each site's posts a day keeps. Posts from any other site in the saved lists (Instagram
// was one until Oct 31, 2026) are dropped on the next run
const CAP = { reddit: 220, x: 450 };
const ours = it => it && CAP[it.src] != null;
const readJSON = async f => { try { return f ? JSON.parse(await readFile(f, 'utf8')) : null; } catch { return null; } };
const prev = (await readJSON(PREV)) || { items: [], status: {}, state: {} };
prev.items = (prev.items || []).filter(ours);
const prevArch = (await readJSON(PREV_ARCH)) || {};
['week', 'season'].forEach(k => { prevArch[k] = (prevArch[k] || []).filter(ours); });

// withHeaders: also hand back the response's headers (Nitter sends the next page's cursor in one)
async function get(url, { headers = {}, timeout = 30000, withHeaders = false } = {}) {
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, { headers, signal: ac.signal, redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    return withHeaders ? { text, header: n => r.headers.get(n) } : text;
  } catch (e) {
    throw e.name === 'AbortError' ? new Error(`no answer in ${timeout / 1000}s`) : e;
  } finally {
    clearTimeout(timer);
  }
}

const now = Date.now();
const mine = src => (prev.items || []).filter(it => it.src === src);
const status = Object.fromEntries(Object.entries(prev.status || {}).filter(([k]) => CAP[k] != null)), state = Object.assign({}, prev.state), fresh = {};
const log = msg => console.log(msg);
const run = async (src, label, f) => {
  const t = Date.now();
  try {
    const items = await f();
    fresh[src] = items;
    status[src] = { ok: true, at: new Date().toISOString(), n: items.length };
    console.log(`${label}: ${items.length} posts in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  } catch (e) {
    // Keep showing what it had; the site says when a source was last read
    status[src] = Object.assign({}, status[src], { ok: false, note: `Couldn't be read on the last check (${String(e.message).slice(0, 80)})`, tried: new Date().toISOString() });
    console.log(`::warning::${label} couldn't be read: ${e.message}`);
  }
};

await run('reddit', 'Reddit', async () => { const r = await readReddit({ get, prev: mine('reddit'), state: state.reddit, now, log }); state.reddit = r.state; return r.items; });
// X posts r/nba linked to get looked up too
const linked = (fresh.reddit || []).map(it => it.dup).filter(d => d && d.startsWith('x:')).map(d => d.slice(2));
await run('x', 'X', () => readX({ get, prev: mine('x'), now, extra: linked, log }));

let items = mergeFeed(prev.items, fresh, now);
// Each site's day is trimmed to the posts worth ranking: Reddit's quiet posts (no score, few comments) once they've had
// an hour and a half to catch on, and a cap per site so the file stays small for phones
items = Object.entries(CAP).flatMap(([src, cap]) => items.filter(it => it.src === src)
  .filter(it => it.src !== 'reddit' || now - it.time < 90 * 60000 || (it.stats.replies || 0) >= 5 || (it.sf && (it.stats.up || 0) >= 30))
  .sort((a, b) => engagement(b) - engagement(a)).slice(0, cap)).map(slim).sort((a, b) => b.time - a.time);
const archive = buildArchive(prevArch, items, now);

const ok = Object.keys(fresh).length;
console.log(`${items.length} posts today (${Object.entries(CAP).map(([s]) => `${s} ${items.filter(i => i.src === s).length}`).join(', ')}); archive: ${archive.week.length} this week, ${archive.season.length} this season.`);
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), status, state, items }));
await mkdir(dirname(OUT_ARCH), { recursive: true });
await writeFile(OUT_ARCH, JSON.stringify({ updated: new Date().toISOString(), week: archive.week.map(slim), season: archive.season.map(slim) }));
if (!ok && CHECK) {
  console.log('::error::No social source could be read on this run.');
  process.exit(1);
}
