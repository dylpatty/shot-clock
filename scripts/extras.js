/* Daily job, run by .github/workflows/extras.yml: rebuilds data/extras.json and writes it only when something changed.
   Exits with an error only when no source at all could be read, so a failed run means it needs a look. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { buildExtras, stringify } from './build.js';

const FILE = new URL('../data/extras.json', import.meta.url);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function get(url, { json, headers = {}, timeout = 30000 } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, {
      signal: ac.signal,
      headers: {
        'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9',
        Accept: json ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...headers,
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} from ${new URL(url).host}`);
    return json ? await r.json() : await r.text();
  } catch (e) {
    throw e.name === 'AbortError' ? new Error(`no answer from ${new URL(url).host} in ${timeout / 1000}s`) : e;
  } finally {
    clearTimeout(timer);
  }
}

let previous = null;
try { previous = JSON.parse(await readFile(FILE, 'utf8')); } catch { /* first run */ }

const now = new Date();
const { data, changed, report, ok } = await buildExtras({
  get, previous, now: now.toISOString(),
  // The combine is in May, so its numbers for this year's draft class are up from June on
  combineYear: now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1,
  warn: msg => console.log(`::warning::${msg}`),
});
console.log(JSON.stringify(report, null, 2));

if (!ok) {
  console.log('::error::None of the sources could be read today; data/extras.json was left as it was.');
  process.exit(1);
}
if (!changed) {
  console.log('Nothing changed since the last run.');
} else {
  await mkdir(new URL('../data/', import.meta.url), { recursive: true });
  await writeFile(FILE, stringify(data));
  console.log(`Wrote ${Object.keys(data.players).length} players to data/extras.json.`);
}
