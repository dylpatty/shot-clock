/* Run by .github/workflows/highlights.yml: every 3 hours (and on a manual run), reads the NBA's Canada schedule and
   writes catv.json (each game's Canadian streaming services) to $OUT, only when something changed. Sportsnet's schedule
   and TSN's broadcast tables add the streaming-only games the NBA's list leaves out; either can fail without stopping
   the run. Like the highlights, a failed NBA read only fails the daily check run ($CHECK=true); the site keeps the last
   good list */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { CA_FEED, CA_HEADERS, buildCaTv, addSportsnet, addTsn } from './catv.js';

const PREV = process.env.PREV, OUT = process.env.OUT || 'catv.json', CHECK = process.env.CHECK === 'true';
const SPORTSNET = 'https://schedule-admin.sportsnet.ca/v1/events';
const TSN = 'https://www.tsn.ca/nba/article/nba-us-games-broadcast-schedule-on-tsn/';
const UA = CA_HEADERS['User-Agent'];

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
async function get(url, headers, ms = 60000) {
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { headers, signal: ac.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } catch (e) {
    throw e.name === 'AbortError' ? new Error(`no answer in ${ms / 1000}s`) : e;
  } finally {
    clearTimeout(timer);
  }
}

let feed;
try { feed = JSON.parse(await get(CA_FEED, CA_HEADERS)); }
catch (e) { fail(`The NBA's Canada schedule didn't load: ${e.message}.`); }

const { games, names, unknown, counts } = buildCaTv(feed);
console.log(`${Object.keys(games).length} games from the NBA:`, JSON.stringify(counts));
unknown.forEach(u => console.log(`::warning::A Canadian broadcaster the site doesn't know yet: ${u}`));
// A short or empty schedule is a bad read, not a real change
if (Object.keys(games).length < 300) fail(`The NBA's Canada schedule only had ${Object.keys(games).length} games in it.`);

// Sportsnet lists about three weeks ahead, 100 events (all sports) a page
try {
  const from = Math.floor(now / 1000) - 2 * 86400, to = from + 23 * 86400, events = [];
  for (let offset = 0, total = Infinity; offset < total && offset < 3000; offset += 100) {
    const j = JSON.parse(await get(`${SPORTSNET}?day_start=${from}&day_end=${to}&offset=${offset}`, { 'User-Agent': UA, Accept: 'application/json' }, 30000));
    total = +j.total || 0;
    events.push(...(j.data || []));
    if (!(j.data || []).length) break;
  }
  console.log(`Sportsnet: ${events.filter(e => /^nba$/i.test(e.league || '')).length} NBA events; ${addSportsnet(games, events)} games added or linked.`);
} catch (e) { console.log(`::warning::Sportsnet's schedule didn't load (${e.message}); its streaming-only games are left out this time.`); }

try {
  console.log(`TSN: ${addTsn(games, await get(TSN, { 'User-Agent': UA, Accept: 'text/html' }, 30000), names)} games added.`);
} catch (e) { console.log(`::warning::TSN's broadcast tables didn't load (${e.message}); its streaming-only games are left out this time.`); }

if (prev && JSON.stringify(prev.games) === JSON.stringify(games)) {
  console.log('Nothing changed since the last read.');
} else {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({ updated: now.toISOString(), season: feed.leagueSchedule && feed.leagueSchedule.seasonYear, games }));
  console.log(`Wrote ${OUT}.`);
}
