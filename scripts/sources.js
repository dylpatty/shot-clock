/* Parsers for the pages the daily job reads. Plain string work with no Node or browser APIs, so the same file runs in
   the GitHub Action and can be tested in a browser against saved copies of each page. */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
export const decode = s => String(s || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENTITIES[e.toLowerCase()] ?? m;
});

// 6'11.25" or 6' 11.25'' -> 83.25 inches
export function inches(s) {
  const m = /(\d+)\s*'\s*([\d.]+)?/.exec(decode(s));
  if (!m) return 0;
  const v = +m[1] * 12 + (m[2] ? +m[2] : 0);
  return v >= 60 && v <= 108 ? v : 0;
}

/* Basketball-Reference's all-player contracts table (https://www.basketball-reference.com/contracts/players.html).
   Returns { rows: [{ ref, name, team, pay: [[season year, salary, 'P' | 'T' | undefined]], gtd }], dupes: Set of ids }.
   Season years are the year a season ends (2026-27 -> 2027), read from the column headers since they move every season.
   A player listed twice is carrying dead money from a team that waived him, and both rows show the two amounts added
   together, so those ids come back in dupes and shouldn't be used. */
export function parseContracts(html) {
  const head = /<thead>([\s\S]*?)<\/thead>/.exec(html);
  const years = {};
  for (const m of (head ? head[1] : html).matchAll(/aria-label="(\d{4})-\d{2}"\s+data-stat="(y\d+)"/g)) if (!(m[2] in years)) years[m[2]] = +m[1] + 1;
  const rows = [], seen = new Map();
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const tr = m[1];
    const id = /data-append-csv="([^"]+)"\s+data-stat="player"/.exec(tr);
    if (!id) continue;
    const name = /data-stat="player"[^>]*>(?:\s*<a [^>]*>)*([^<]+)</.exec(tr);
    const team = /data-stat="team_id"[^>]*>(?:\s*<a [^>]*>)?\s*([A-Z]{2,4})\s*</.exec(tr);
    if (!name || !team) continue;
    const pay = [];
    for (const c of tr.matchAll(/<td class="([^"]*)"\s+data-stat="(y\d+)"(?:\s+csk="(\d+)")?/g)) {
      const yr = years[c[2]], amount = c[3] ? +c[3] : 0;
      if (!yr || !amount) continue;
      pay.push([yr, amount, /salary-pl/.test(c[1]) ? 'P' : /salary-tm/.test(c[1]) ? 'T' : undefined].filter(v => v !== undefined));
    }
    const gtd = /data-stat="remain_gtd"(?:\s+csk="(\d+)")?/.exec(tr);
    seen.set(id[1], (seen.get(id[1]) || 0) + 1);
    rows.push({ ref: id[1], name: decode(name[1]).trim(), team: team[1], pay, gtd: gtd && gtd[1] ? +gtd[1] : 0 });
  }
  return { rows, dupes: new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k)), seasons: Object.values(years) };
}

/* Crafted NBA's length table (https://craftednba.com/player-traits/length): every measured player with barefoot
   height and wingspan. Returns [{ slug, name, team, ht, wing }] in inches, one row per player. */
export function parseLength(html) {
  const out = new Map();
  const re = /<a href="\/players\/([^"]+)"[^>]*>([^<]+)<\/a>\s*<span[^>]*>([^<|]*?)\s*\|\s*([^<]*)<\/span>\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>/g;
  for (const m of html.matchAll(re)) {
    const wing = inches(m[6]);
    if (!wing || out.has(m[1])) continue;
    out.set(m[1], { slug: m[1], name: decode(m[2]).trim(), team: m[3].trim(), ht: inches(m[5]), wing });
  }
  return [...out.values()];
}

/* NBA Draft Combine measurements from stats.nba.com (draftcombineplayeranthro), for rookies Crafted NBA hasn't
   measured. Returns [{ name, ht, wing }]; there's no team in this data. */
export function parseCombine(json) {
  const set = ((json && json.resultSets) || [])[0];
  if (!set) return [];
  const col = k => set.headers.indexOf(k);
  const [name, wing, ht] = [col('PLAYER_NAME'), col('WINGSPAN'), col('HEIGHT_WO_SHOES')];
  return (set.rowSet || []).map(r => ({ name: String(r[name] || ''), wing: +r[wing] || 0, ht: +r[ht] || 0 })).filter(r => r.name && r.wing >= 60 && r.wing <= 108);
}
