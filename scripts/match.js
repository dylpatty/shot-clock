/* Matching players across sites to ESPN ids. Plain functions with no Node or browser APIs, so the same file runs in the
   daily GitHub Action and can be tested in a browser. */

// ESPN's team abbreviations, keyed by the codes other sites use (Basketball-Reference and most others)
export const TEAM_CODES = {
  ATL: 'ATL', BOS: 'BOS', BRK: 'BKN', BKN: 'BKN', NJN: 'BKN', CHO: 'CHA', CHA: 'CHA', CHH: 'CHA', CHI: 'CHI', CLE: 'CLE', DAL: 'DAL', DEN: 'DEN', DET: 'DET',
  GSW: 'GS', GS: 'GS', HOU: 'HOU', IND: 'IND', LAC: 'LAC', LAL: 'LAL', MEM: 'MEM', MIA: 'MIA', MIL: 'MIL', MIN: 'MIN', NOP: 'NO', NO: 'NO', NOH: 'NO',
  NYK: 'NY', NY: 'NY', OKC: 'OKC', ORL: 'ORL', PHI: 'PHI', PHO: 'PHX', PHX: 'PHX', POR: 'POR', SAC: 'SAC', SAS: 'SA', SA: 'SA', TOR: 'TOR',
  UTA: 'UTAH', UTAH: 'UTAH', WAS: 'WSH', WSH: 'WSH',
};
export const teamCode = code => TEAM_CODES[String(code || '').trim().toUpperCase()] || '';

// Names that differ between sites even after normalizing. Both sides go through this, so each pair just has to
// collapse the two spellings into one; it doesn't matter which one ESPN uses.
const ALIASES = {
  'nicolas claxton': 'nic claxton', 'herbert jones': 'herb jones', 'cameron thomas': 'cam thomas', 'kenyon martin': 'kj martin',
  'alexandre sarr': 'alex sarr', 'carlton carrington': 'bub carrington', 'moe wagner': 'moritz wagner', 'ronald holland': 'ron holland',
  'gregory jackson': 'gg jackson', 'nahshon hyland': 'bones hyland', 'nah shon hyland': 'bones hyland', 'jakob poltl': 'jakob poeltl',
};

// "Nikola Jokić" -> "nikola jokic", "Jaren Jackson Jr." -> "jaren jackson", "De'Anthony Melton" -> "deanthony melton"
export function normName(s) {
  // Đ doesn't come apart under NFD, so spell it the way English-language sites do
  let n = String(s || '').replace(/Đ/g, 'Dj').replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&#39;|&#x27;|['’`.]/g, '').replace(/[^a-z0-9 -]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  n = n.replace(/ (jr|sr|ii|iii|iv|v)$/, '').trim();
  return ALIASES[n] || n;
}

/* players: [{ id, name, team }] from ESPN rosters. Returns find(name, teamCode, anyTeam) -> ESPN id or ''.
   Tries name + team, then the same last name on that team with one first name the start of the other (Ron / Ronald,
   never Seth / Stephen). With anyTeam it also accepts the name alone when only one ESPN player has it: right for a
   wingspan, wrong for a salary (a waived player's dead money stays with his old team). find.exact is the first step alone. */
export function matcher(players) {
  const byKey = new Map(), byName = new Map(), byTeam = new Map();
  for (const p of players) {
    const n = normName(p.name);
    byKey.set(n + '|' + p.team, p.id);
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(p.id);
    if (!byTeam.has(p.team)) byTeam.set(p.team, []);
    byTeam.get(p.team).push({ id: p.id, n });
  }
  const key = (name, team) => normName(name) + '|' + (teamCode(team) || team || '');
  const find = (name, team, anyTeam) => {
    const n = normName(name), t = teamCode(team) || team || '';
    if (byKey.has(n + '|' + t)) return byKey.get(n + '|' + t);
    const parts = n.split(' '), last = parts.slice(1).join(' '), first = parts[0] || '';
    const close = last && first ? (byTeam.get(t) || []).filter(x => {
      const q = x.n.split(' '), f = q[0] || '';
      return q.slice(1).join(' ') === last && f && (f.startsWith(first) || first.startsWith(f));
    }) : [];
    if (close.length === 1) return close[0].id;
    const same = byName.get(n);
    return anyTeam && same && same.length === 1 ? same[0] : '';
  };
  find.exact = (name, team) => byKey.get(key(name, team)) || '';
  return find;
}

/* Pairs source rows with ESPN ids: rows with an exact name + team match first, then the looser rules, which may never
   take an id an exact row already has. Returns [{ row, id }] for the rows it could place, and the rows it couldn't. */
export function assign(rows, find, nameOf, teamOf, anyTeam) {
  const placed = [], missed = [], taken = new Set();
  const exact = rows.map(r => find.exact(nameOf(r), teamOf(r)));
  exact.forEach((id, i) => { if (id && !taken.has(id)) { taken.add(id); placed.push({ row: rows[i], id }); } });
  rows.forEach((r, i) => {
    if (exact[i]) return;
    const id = find(nameOf(r), teamOf(r), anyTeam);
    if (id && !taken.has(id)) { taken.add(id); placed.push({ row: r, id }); } else missed.push(r);
  });
  return { placed, missed };
}
