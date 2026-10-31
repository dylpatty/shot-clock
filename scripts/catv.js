/* Where each game streams legally in Canada, from the NBA's Canada-only schedule (region 2), which lists one Canadian
   broadcaster per game or none. Run by scripts/catv-job.js; pure, so it can also run on a saved copy in a browser. */

export const CA_FEED = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_2.json';
// cdn.nba.com answers 403 unless a request looks like nba.com's own page asking for it
export const CA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://www.nba.com',
  Referer: 'https://www.nba.com/',
  'Sec-Fetch-Site': 'same-site',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};

// The NBA's broadcaster ids in that feed, by the streaming service a Canadian viewer would use
const BY_ID = {
  1001731: 'p',    // Amazon Canada (TV), shown as "Prime": Prime Video
  1001844: 'sn',   // SN/SN+ (Raptors on Sportsnet)
  1563: 'sn',      // SN (Sportsnet's national games)
  1001845: 'tsn',  // TSN/TSN+ (Raptors on TSN)
  11: 'tsn',       // TSN (TSN's national games)
  1000241: 'tsn',  // TSN + NBA TV Canada
  181: 'nbac',     // NBA TV Canada
};
const BY_ABBR = { 'AMAZON CANADA (TV)': 'p', PRIME: 'p', 'SN/SN+': 'sn', SN: 'sn', 'TSN/TSN+': 'tsn', TSN: 'tsn', 'TSN/NBAC': 'tsn', NBAC: 'nbac' };
// ESPN's team codes where they differ from the NBA's
export const ESPN_ABBR = { GSW: 'GS', NYK: 'NY', SAS: 'SA', NOP: 'NO', UTA: 'UTAH', WAS: 'WSH' };
const espn = tri => ESPN_ABBR[tri] || tri;

/* { games: { 'YYYYMMDD:HOME': [[service, watchLink?], ...] }, names, unknown, counts } keyed by the game's Eastern date and
   ESPN's code for the home team (a team plays once a day). The first service is the main one. Services: p Prime Video,
   sn Sportsnet+, tsn TSN, tsnp TSN Premium (streaming-only games), nbac NBA TV Canada, lp NBA League Pass. A regular-season game with no Canadian broadcaster is
   on League Pass (it's what NBA.com's own Canadian League Pass filter shows); preseason, play-in and playoff games without
   one stay unlisted. NBA Cup knockout games are on Prime Video in Canada even before the NBA fills in their broadcaster.
   names maps each team's nickname ('Trail Blazers') to its NBA code, for reading TSN's tables */
export function buildCaTv(feed) {
  const ls = (feed && feed.leagueSchedule) || {};
  const games = {}, unknown = [], counts = {}, names = {};
  for (const day of ls.gameDates || []) {
    for (const g of day.games || []) {
      [g.homeTeam, g.awayTeam].forEach(t => { if (t && t.teamName && t.teamTricode) names[norm(t.teamName)] = t.teamTricode; });
      const home = g.homeTeam && g.homeTeam.teamTricode, date = (/^(\d{8})\//.exec(g.gameCode || '') || [])[1];
      if (!home || !date) continue; // a knockout game whose teams aren't set yet
      const list = ((g.broadcasters && g.broadcasters.intlTvBroadcasters) || []).filter(b => !b.broadcasterScope || b.broadcasterScope === 'can');
      let svc = null, link = '';
      for (const b of list) {
        const s = BY_ID[b.broadcasterId] || BY_ABBR[String(b.broadcasterAbbreviation || '').toUpperCase()];
        if (!s) { unknown.push(`${g.gameCode}: ${b.broadcasterAbbreviation} (${b.broadcasterId}) ${b.broadcasterDisplay}`); continue; }
        // Prime's games are exclusive, so it wins if a game ever lists two
        if (!svc || s === 'p') { svc = s; link = b.broadcasterVideoLink || ''; }
      }
      const regular = /^002/.test(g.gameId || ''), cup = /^006/.test(g.gameId || '') || /quarterfinal|semifinal|championship/i.test(g.gameSubLabel || '');
      if (!svc && cup) svc = 'p';
      else if (!svc && regular) svc = 'lp';
      if (!svc) continue;
      games[`${date}:${espn(home)}`] = [pair(svc, link)];
      counts[svc] = (counts[svc] || 0) + 1;
    }
  }
  return { games, names, unknown, counts };
}
const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const pair = (svc, link) => link && /^https:\/\//.test(link) ? [svc, link] : [svc];

/* Adds a service the NBA's list doesn't show. A streaming-only game (Sportsnet+'s SN NOW+ games, TSN Premium's games)
   isn't blacked out on League Pass, so it goes in front of League Pass; a TV game is a national broadcast, which League
   Pass blacks out, so it replaces League Pass. Returns true if anything changed */
export function addService(games, key, svc, link, streamingOnly) {
  const list = games[key];
  if (!list) return false;
  const have = list.find(x => x[0] === svc);
  if (have) { if (link && !have[1] && /^https:\/\//.test(link)) { have[1] = link; return true; } return false; }
  // League Pass stays last
  const lp = list.findIndex(x => x[0] === 'lp');
  if (lp < 0) list.push(pair(svc, link));
  else if (streamingOnly) list.splice(lp, 0, pair(svc, link));
  else games[key] = list.filter(x => x[0] !== 'lp').concat([pair(svc, link)]);
  return true;
}

// Eastern date (YYYYMMDD) of a moment
const etParam = ms => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');

/* Sportsnet's schedule (schedule-admin.sportsnet.ca/v1/events): NBA events have the home team's NBA code, a start time
   about 30 minutes before tip-off, and game_type 'linear' (a Sportsnet channel) or 'companion' (streaming-only on
   Sportsnet+, shown as SN NOW+) */
export function addSportsnet(games, events) {
  let n = 0;
  for (const e of events || []) {
    if (!/^nba$/i.test(e.league || '') || !e.home_team_abv || !e.start_time_utc) continue;
    const key = `${etParam((+e.start_time_utc + 1800) * 1000)}:${espn(String(e.home_team_abv).toUpperCase())}`;
    if (addService(games, key, 'sn', e.deep_link_eventlink || '', !/linear/i.test(e.game_type || ''))) n++;
  }
  return n;
}

/* TSN's "NBA on TSN" article has two tables (Date | Away | Home | Time (ET) | Network): its TV games, then its
   streaming-only TSN Premium games. Teams are nicknames ('Knicks') */
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
export function addTsn(games, html, names) {
  let n = 0;
  const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  for (const table of String(html || '').match(/<table[\s\S]*?<\/table>/gi) || []) {
    for (const row of table.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
      const cells = (row.match(/<td[\s\S]*?<\/td>/gi) || []).map(strip);
      if (cells.length < 5 || !/tsn/i.test(cells[4])) continue;
      const d = /([a-z]+)\s+(\d{1,2}),\s*(\d{4})/i.exec(cells[0]), m = d && MONTHS.indexOf(d[1].toLowerCase());
      const home = names[norm(cells[2])];
      if (!d || m < 0 || !home) continue;
      const key = `${d[3]}${String(m + 1).padStart(2, '0')}${String(+d[2]).padStart(2, '0')}:${espn(home)}`;
      // TSN Premium's games need that plan; TSN Standard has only TSN1-5
      const premium = /premium/i.test(cells[4]);
      if (addService(games, key, premium ? 'tsnp' : 'tsn', '', premium)) n++;
    }
  }
  return n;
}
