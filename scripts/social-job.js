/* Run by .github/workflows/highlights.yml every 10 minutes: reads r/nba, Instagram and X, merges them into the last day's
   feed (social.json) and the week's and season's biggest posts (social-archive.json), written to $OUT and $OUT_ARCH.
   A source that fails keeps its last posts and is marked in social.json's status, so the site can say so; only the daily
   check run ($CHECK=true) fails, and only if every source failed */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readReddit, readInstagram, readX } from './social-sources.js';
import { mergeFeed, buildArchive, slim, engagement } from './socialcore.js';

const { PREV, PREV_ARCH, OUT = 'social.json', OUT_ARCH = 'social-archive.json' } = process.env;
const CHECK = process.env.CHECK === 'true';
const readJSON = async f => { try { return f ? JSON.parse(await readFile(f, 'utf8')) : null; } catch { return null; } };
const prev = (await readJSON(PREV)) || { items: [], status: {}, state: {} };
const prevArch = (await readJSON(PREV_ARCH)) || {};

async function get(url, { headers = {}, timeout = 30000 } = {}) {
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, { headers, signal: ac.signal, redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } catch (e) {
    throw e.name === 'AbortError' ? new Error(`no answer in ${timeout / 1000}s`) : e;
  } finally {
    clearTimeout(timer);
  }
}

const now = Date.now();
const mine = src => (prev.items || []).filter(it => it.src === src);
const status = Object.assign({}, prev.status), state = Object.assign({}, prev.state), fresh = {};
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
await run('ig', 'Instagram', () => readInstagram({ get, prev: mine('ig'), now, log }));
await run('x', 'X', () => readX({ get, prev: mine('x'), now, log }));

let items = mergeFeed(prev.items, fresh, now);
// Each site's day is trimmed to the posts worth ranking: Reddit's quiet posts (no score, few comments) once they've had
// an hour and a half to catch on, and a cap per site so the file stays small for phones
const CAP = { reddit: 220, ig: 120, x: 200 };
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
