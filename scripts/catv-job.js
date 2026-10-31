/* Run by .github/workflows/highlights.yml: every 3 hours (and on a manual run), reads the NBA's Canada schedule and
   writes catv.json (each game's Canadian streaming service) to $OUT, only when something changed. Like the highlights,
   a failed read only fails the daily check run ($CHECK=true); the site keeps the last good list */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { CA_FEED, CA_HEADERS, buildCaTv } from './catv.js';

const PREV = process.env.PREV, OUT = process.env.OUT || 'catv.json', CHECK = process.env.CHECK === 'true';
let prev = null;
try { if (PREV) prev = JSON.parse(await readFile(PREV, 'utf8')); } catch { /* first run */ }

const now = new Date();
// The schedule's broadcasters change a few times a season, and the file is 3.7 MB, so it's read every 3 hours
const due = !prev || CHECK || (now.getUTCHours() % 3 === 0 && now.getUTCMinutes() < 30);
if (!due) {
  console.log('The Canadian TV list is read every 3 hours; not this run.');
  process.exit(0);
}
const fail = msg => {
  console.log(`${CHECK ? '::error::' : '::warning::'}${msg} The site keeps the last list.`);
  process.exit(CHECK ? 1 : 0);
};

let feed;
const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 60000);
try {
  const r = await fetch(CA_FEED, { headers: CA_HEADERS, signal: ac.signal });
  if (!r.ok) fail(`The NBA's Canada schedule answered HTTP ${r.status}.`);
  feed = JSON.parse(await r.text());
} catch (e) {
  fail(`The NBA's Canada schedule didn't load: ${e.name === 'AbortError' ? 'no answer in 60s' : e.message}.`);
} finally {
  clearTimeout(timer);
}

const { games, unknown, counts } = buildCaTv(feed);
console.log(`${Object.keys(games).length} games:`, JSON.stringify(counts));
unknown.forEach(u => console.log(`::warning::A Canadian broadcaster the site doesn't know yet: ${u}`));
// A short or empty schedule is a bad read, not a real change
if (Object.keys(games).length < 300) fail(`The NBA's Canada schedule only had ${Object.keys(games).length} games in it.`);

if (prev && JSON.stringify(prev.games) === JSON.stringify(games)) {
  console.log('Nothing changed since the last read.');
} else {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({ updated: now.toISOString(), season: feed.leagueSchedule && feed.leagueSchedule.seasonYear, games }));
  console.log(`Wrote ${OUT}.`);
}
