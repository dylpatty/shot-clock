/* Builds data/alltime.json, the Stats tab's all-time leaders, from NBA.com's stats feed (stats.nba.com).
   Run it on a computer, not in GitHub Actions: stats.nba.com doesn't answer GitHub's servers.
     node scripts/alltime.js
   The file holds every player's regular-season career totals through last season ("base"), this season so far as of
   the run ("cs"; the site lays ESPN's live season totals over it, so active players stay current every night), the
   playoffs all time, and which players are active. Rebuild it at the start of each season and after the playoffs. */
import { writeFile } from 'node:fs/promises';

const FILE = new URL('../data/alltime.json', import.meta.url);
const HEADERS = {
  Accept: 'application/json, text/plain, */*', Referer: 'https://www.nba.com/', Origin: 'https://www.nba.com',
  'Sec-Fetch-Mode': 'cors', 'x-nba-stats-origin': 'stats', 'x-nba-stats-token': 'true', 'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
};
// The counting stats kept, in this order in every row (percentages are worked out on the site)
const COLS = ['GP', 'MIN', 'FGM', 'FGA', 'FG3M', 'FG3A', 'FTM', 'FTA', 'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PTS'];

async function leaders(params) {
  const q = new URLSearchParams({ LeagueID: '00', PerMode: 'Totals', Scope: 'S', StatCategory: 'PTS', ActiveFlag: '', ...params });
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 60000);
  try {
    const r = await fetch(`https://stats.nba.com/stats/leagueLeaders?${q}`, { headers: HEADERS, signal: ac.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${params.Season} ${params.SeasonType}`);
    const j = await r.json(), set = j.resultSet || (j.resultSets || [])[0];
    const at = n => set.headers.indexOf(n);
    const name = at('PLAYER_NAME') >= 0 ? at('PLAYER_NAME') : at('PLAYER');
    return set.rowSet.map(row => ({ id: row[at('PLAYER_ID')], name: row[name], team: at('TEAM') >= 0 ? row[at('TEAM')] : '', v: COLS.map(c => row[at(c)] ?? null) }));
  } finally { clearTimeout(t); }
}

// The season under way: from August on, the season that starts that autumn
const now = new Date(), y = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
const season = `${y}-${String(y + 1).slice(2)}`;
const [rs, po, act, cs] = await Promise.all([
  leaders({ Season: 'All Time', SeasonType: 'Regular Season' }),
  leaders({ Season: 'All Time', SeasonType: 'Playoffs' }),
  leaders({ Season: 'All Time', SeasonType: 'Regular Season', ActiveFlag: 'Yes' }),
  leaders({ Season: season, SeasonType: 'Regular Season' }).catch(() => []),
]);
if (rs.length < 4000 || po.length < 2500) throw new Error(`Too few rows (${rs.length} regular season, ${po.length} playoffs); NBA.com may have changed its feed`);

// Career totals through last season: all time minus this season so far. Columns NBA.com didn't keep in a player's
// era (steals, blocks and turnovers before the mid-1970s) stay empty
const csBy = new Map(cs.map(r => [r.id, r]));
const base = rs.map(r => {
  const c = csBy.get(r.id);
  return [r.id, r.name, ...r.v.map((v, i) => v == null ? null : c && c.v[i] != null ? v - c.v[i] : v)];
}).filter(r => r[2] > 0 || csBy.has(r[0]));
const data = {
  updated: now.toISOString(), season, source: 'NBA.com stats (stats.nba.com)',
  cols: COLS.map(c => c.toLowerCase()),
  base,
  cs: cs.map(r => [r.id, r.team, ...r.v]),
  po: po.map(r => [r.id, r.name, ...r.v]),
  active: act.map(r => r.id),
};
// One player per line, so a rebuild's commit shows what changed
const lines = (k, rows) => `  ${JSON.stringify(k)}: [\n${rows.map(r => '    ' + JSON.stringify(r)).join(',\n')}\n  ]`;
const head = ['updated', 'season', 'source', 'cols', 'active'].map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(data[k])}`);
await writeFile(FILE, `{\n${[...head, lines('base', data.base), lines('cs', data.cs), lines('po', data.po)].join(',\n')}\n}\n`);
console.log(`Wrote ${base.length} regular-season careers, ${cs.length} this season (${season}), ${po.length} playoff careers, ${act.length} active players.`);
