/* Run by .github/workflows/highlights.yml every 10 minutes: reads the YouTube channels in video-channels.js that are
   due (team channels every half hour, analysis and podcasts every two) and writes videos.json to $OUT for the site's
   Videos tab, team pages and game pages. A channel that can't be read keeps its videos; only the daily check run
   ($CHECK=true) fails, and only if no channel could be read at all */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildVideos } from './videocore.js';
import { CHANNELS } from './video-channels.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' };

async function get(url, timeout = 25000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: HEADERS });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } catch (e) {
    throw e.name === 'AbortError' ? new Error(`no answer in ${timeout / 1000}s`) : e;
  } finally {
    clearTimeout(timer);
  }
}

const PREV = process.env.PREV, OUT = process.env.OUT || 'videos.json', CHECK = process.env.CHECK === 'true';
let prev = null;
try { if (PREV) prev = JSON.parse(await readFile(PREV, 'utf8')); } catch { /* first run */ }

const { data, status, ok } = await buildVideos({
  get, channels: CHANNELS, prev,
  log: msg => console.log(msg),
  warn: msg => console.log(`::warning::${msg}`),
});
const kinds = {};
data.items.forEach(v => { kinds[v.kind] = (kinds[v.kind] || 0) + 1; });
console.log(`Kinds: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')}`);
if (status.read) {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data));
  console.log(`Wrote ${OUT}.`);
} else {
  console.log('No channel was read on this run; the last list stays up.');
}
if (!ok && CHECK) {
  console.log('::error::No YouTube channel could be read on this run.');
  process.exit(1);
}
