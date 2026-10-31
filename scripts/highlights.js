/* Run by .github/workflows/highlights.yml every 10 minutes on game nights: finds the NBA's full game highlights
   on YouTube and writes highlights.json (ESPN game id -> video) to $OUT, only when something changed.
   Frequent runs never fail, so a YouTube hiccup doesn't send an email every 10 minutes; the daily check run
   ($CHECK=true) fails if YouTube couldn't be read. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildHighlights } from './hlcore.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' };

async function request(url, init = {}, timeout = 25000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, Object.assign({ signal: ac.signal }, init, { headers: Object.assign({}, HEADERS, init.headers) }));
    if (!r.ok) throw new Error(`HTTP ${r.status} from ${new URL(url).host}`);
    return r;
  } catch (e) {
    throw e.name === 'AbortError' ? new Error(`no answer from ${new URL(url).host} in ${timeout / 1000}s`) : e;
  } finally {
    clearTimeout(timer);
  }
}
const get = async (url, { json } = {}) => { const r = await request(url); return json ? r.json() : r.text(); };
const post = async (url, body) => (await request(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })).json();
const exists = async url => { try { await request(url, { method: 'HEAD' }, 10000); return true; } catch (e) { return false; } };

const PREV = process.env.PREV, OUT = process.env.OUT || 'highlights.json', CHECK = process.env.CHECK === 'true';
let prev = null;
try { if (PREV) prev = JSON.parse(await readFile(PREV, 'utf8')); } catch { /* first run */ }

const { data, changed, report, ok } = await buildHighlights({
  get, post, exists, prev,
  log: msg => console.log(msg),
  warn: msg => console.log(`::warning::${msg}`),
});
console.log(JSON.stringify(report, null, 2));
console.log(`${Object.keys(data.games).length} games have full game highlights.`);

if (changed) {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data));
  console.log(`Wrote ${OUT}.`);
} else {
  console.log('Nothing changed since the last run.');
}
if (!ok && CHECK) {
  console.log("::error::YouTube's full game highlights playlist couldn't be read on this run.");
  process.exit(1);
}
