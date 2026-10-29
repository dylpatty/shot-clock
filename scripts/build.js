/* Builds data/extras.json: what ESPN's feeds leave out, keyed by ESPN player id.
     pay   [[season year, salary, 'P' | 'T'], ...] this and future seasons, from Basketball-Reference (P/T = player/team option)
     gtd   guaranteed money left on the deal
     wing  wingspan in inches, from Crafted NBA or the NBA Draft Combine
     wht   barefoot height in inches from the same measurement
     tm    ESPN team the salary row was matched on
   Every source is optional: when one can't be read, yesterday's values carry over. `get` does the fetching, so the
   same code runs in the GitHub Action (Node) and in a browser test. */
import { parseContracts, parseLength, parseCombine } from './sources.js';
import { matcher, assign, normName } from './match.js';

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
export const SOURCES = {
  contracts: 'https://www.basketball-reference.com/contracts/players.html',
  length: 'https://craftednba.com/player-traits/length',
  // SeasonYear 2026-27 is the 2026 combine
  combine: y => `https://stats.nba.com/stats/draftcombineplayeranthro?LeagueID=00&SeasonYear=${y}-${String(y + 1).slice(2)}`,
};
export const COMBINE_HEADERS = {
  Accept: 'application/json, text/plain, */*', Referer: 'https://www.nba.com/', Origin: 'https://www.nba.com',
  'Sec-Fetch-Mode': 'cors', 'x-nba-stats-origin': 'stats', 'x-nba-stats-token': 'true',
};

export async function buildExtras({ get, previous, now, combineYear, combineFrom = 2014, log = console.log, warn = console.warn }) {
  // Who's in the league today, from ESPN
  const teams = (await get(`${ESPN}/teams`, { json: true })).sports[0].leagues[0].teams.map(t => t.team);
  const rosters = await Promise.all(teams.map(t => get(`${ESPN}/teams/${t.id}/roster`, { json: true })));
  const roster = rosters.flatMap((j, i) => (j.athletes || []).map(a => ({ id: String(a.id), name: a.displayName || a.fullName || '', team: teams[i].abbreviation })));
  if (roster.length < 300) throw new Error(`Only ${roster.length} players on ESPN rosters`);
  const teamOf = new Map(roster.map(p => [p.id, p.team]));
  const find = matcher(roster);
  const old = (previous && previous.players) || {};
  const players = {};
  const put = (id, k, v) => { (players[id] = players[id] || {})[k] = v; };
  const report = { espnPlayers: roster.length };

  // Salaries, matched on name and team only: a waived player's dead money must not follow him to his new team
  let salaries = 0, seasons = [];
  try {
    const parsed = parseContracts(await get(SOURCES.contracts));
    // Check what was actually read, not just the row count, so a change to the page's markup keeps yesterday's numbers
    const paid = parsed.rows.filter(r => r.pay.length && !parsed.dupes.has(r.ref));
    if (!parsed.seasons.length || paid.length < 350) throw new Error(`only ${paid.length} salaries could be read from the page`);
    const { placed, missed } = assign(paid, find, r => r.name, r => r.team, false);
    if (placed.length < 300) throw new Error(`only ${placed.length} salaries matched ESPN players`);
    seasons = parsed.seasons;
    for (const { row, id } of placed) { put(id, 'pay', row.pay); put(id, 'gtd', row.gtd); put(id, 'tm', teamOf.get(id)); }
    salaries = placed.length;
    report.salaries = { rows: parsed.rows.length, matched: salaries, skippedTwoTeamRows: parsed.dupes.size, unmatched: missed.map(r => `${r.name} (${r.team})`) };
  } catch (e) {
    warn(`Salaries: ${e.message}. Keeping the last ones that were read.`);
    report.salaries = { error: e.message };
    // Only for players still on the team they were matched on
    for (const p of roster) {
      const o = old[p.id];
      if (o && o.pay && o.tm === p.team) { put(p.id, 'pay', o.pay); if (o.gtd != null) put(p.id, 'gtd', o.gtd); put(p.id, 'tm', o.tm); }
    }
  }

  // Wingspans: Crafted NBA first. A wingspan doesn't depend on the team, which is only a tie-breaker here.
  let wings = 0;
  const setWing = (id, w) => { put(id, 'wing', w.wing); if (w.ht) put(id, 'wht', w.ht); wings++; };
  try {
    const list = parseLength(await get(SOURCES.length));
    if (list.length < 300) throw new Error(`only ${list.length} measured players on the page`);
    // The slug spells names the way English-language sites do (Đ as dj), so it's a second chance at a name
    const first = assign(list, find, w => w.name, w => w.team, true);
    const second = assign(first.missed, find, w => w.slug.replace(/[-.]+/g, ' '), w => w.team, true);
    for (const { row, id } of [...first.placed, ...second.placed]) if (!(players[id] && players[id].wing)) setWing(id, row);
    report.wingspans = { rows: list.length, matched: wings, unmatched: second.missed.map(w => `${w.name} (${w.team})`) };
  } catch (e) {
    warn(`Wingspans: ${e.message}`);
    report.wingspans = { error: e.message };
  }

  // Measurements don't change, so keep any found on an earlier day that today's page doesn't give us
  for (const p of roster) {
    const o = old[p.id];
    if (o && o.wing && !(players[p.id] && players[p.id].wing)) { put(p.id, 'wing', o.wing); if (o.wht) put(p.id, 'wht', o.wht); }
  }

  // Then the draft combine, newest first, for players never measured (mostly rookies). It has no team, so the
  // name has to be unique among those players. If the newest year doesn't answer, the site is blocking us: stop there.
  try {
    const left = new Map();
    for (const p of roster) if (!(players[p.id] && players[p.id].wing)) { const n = normName(p.name); left.set(n, left.has(n) ? '' : p.id); }
    let added = 0;
    for (let y = combineYear; y >= combineFrom && left.size; y--) {
      let list;
      try { list = parseCombine(await get(SOURCES.combine(y), { json: true, headers: COMBINE_HEADERS, timeout: 15000 })); }
      catch (e) { if (y === combineYear) throw e; continue; }
      for (const c of list) {
        const n = normName(c.name), id = left.get(n);
        if (id) { setWing(id, c); left.delete(n); added++; }
      }
    }
    report.combine = { added };
  } catch (e) {
    warn(`Draft combine: ${e.message}`);
    report.combine = { error: e.message };
  }

  const sorted = Object.fromEntries(Object.keys(players).sort((a, b) => a - b).map(k => [k, players[k]]));
  const same = !!previous && JSON.stringify(previous.players) === JSON.stringify(sorted);
  const season = seasons[0] || (previous && previous.season) || 0;
  log(`ESPN players: ${roster.length} · salaries matched: ${salaries} · wingspans: ${Object.values(sorted).filter(p => p.wing).length}`);
  return {
    data: { updated: same ? previous.updated : now, season, sources: { salary: 'Basketball-Reference', wingspan: 'Crafted NBA and the NBA Draft Combine' }, players: sorted },
    changed: !same, report, ok: salaries > 0 || wings > 0,
  };
}

// One player per line, so each day's commit shows exactly what changed
export const stringify = data => {
  const { players, ...head } = data;
  const lines = Object.entries(players).map(([id, p]) => `    ${JSON.stringify(id)}: ${JSON.stringify(p)}`);
  return `{\n${Object.entries(head).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n')}\n  "players": {\n${lines.join(',\n')}\n  }\n}\n`;
};
