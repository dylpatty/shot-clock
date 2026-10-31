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

/* { games: { 'YYYYMMDD:HOME': [service, watchLink?] }, unknown: [...], counts } keyed by the game's Eastern date and
   ESPN's code for the home team (a team plays once a day). Services: p Prime Video, sn Sportsnet+, tsn TSN,
   nbac NBA TV Canada, lp NBA League Pass. A regular-season game with no Canadian broadcaster is on League Pass (it's what
   NBA.com's own Canadian League Pass filter shows); preseason, play-in and playoff games without one stay unlisted.
   NBA Cup knockout games are on Prime Video in Canada even before the NBA fills in their broadcaster */
export function buildCaTv(feed) {
  const ls = (feed && feed.leagueSchedule) || {};
  const games = {}, unknown = [], counts = {};
  for (const day of ls.gameDates || []) {
    for (const g of day.games || []) {
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
      games[`${date}:${espn(home)}`] = link && /^https:\/\//.test(link) ? [svc, link] : [svc];
      counts[svc] = (counts[svc] || 0) + 1;
    }
  }
  return { games, unknown, counts };
}
