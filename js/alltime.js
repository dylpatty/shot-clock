/* All-time leaders on the Stats tab, like NBA.com's: regular season or playoffs, totals or per game, sorted by any stat,
   active players only if you like. Careers come from data/alltime.json, built from NBA.com by scripts/alltime.js; this
   season is laid over them live from ESPN's season stats, so active players' totals move after every game. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui, st = UI.st;
const { esc } = NBA;
const S = st.at = st.at || { type: 'rs', mode: 'tot', stat: 'pts', active: false, page: 0, q: '' };
const PAGE = 50;
NBA.def('alltime', 12 * 3600000, () => NBA.getJSON('data/alltime.json', 30000));

// The table's columns, as on NBA.com; the % ones are worked out from the totals
const COLS = [['gp', 'GP', 'Games played'], ['min', 'MIN', 'Minutes'], ['pts', 'PTS', 'Points'], ['fgm', 'FGM', 'Field goals made'], ['fga', 'FGA', 'Field goals attempted'],
  ['fgp', 'FG%', 'Field goal %'], ['fg3m', '3PM', '3-pointers made'], ['fg3a', '3PA', '3-pointers attempted'], ['fg3p', '3P%', '3-point %'], ['ftm', 'FTM', 'Free throws made'],
  ['fta', 'FTA', 'Free throws attempted'], ['ftp', 'FT%', 'Free throw %'], ['oreb', 'OREB', 'Offensive rebounds'], ['dreb', 'DREB', 'Defensive rebounds'], ['reb', 'REB', 'Rebounds'],
  ['ast', 'AST', 'Assists'], ['stl', 'STL', 'Steals'], ['blk', 'BLK', 'Blocks'], ['tov', 'TOV', 'Turnovers'], ['efg', 'EFG%', 'Effective FG %'], ['ts', 'TS%', 'True shooting %']];
const PCT = new Set(['fgp', 'fg3p', 'ftp', 'efg', 'ts']);
// The NBA's minimums for career leaderboards: a per-game average needs 400 games, FG% (and here eFG% and TS%) 2,000 made
// field goals, 3P% 250 made threes, FT% 1,200 made free throws. The playoff ones are the NBA's playoff record minimums
const MIN = { rs: { gp: 400, fgm: 2000, fg3m: 250, ftm: 1200 }, po: { gp: 25, fgm: 150, fg3m: 35, ftm: 100 } };

// Accents, periods and Jr./III off, for matching NBA.com's names to ESPN's ("Luka Dončić" is ESPN's "Luka Doncic")
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, '');

/* Every player's row for the season type being shown: { id, name, v (totals in the file's column order), espn (ESPN id
   when he's in this season's stats, for his player card), on (active) }. Regular season: career through last season
   plus this season, from ESPN's live totals when the stats feed has him (the snapshot in the file otherwise). ESPN has
   no offensive and defensive rebounds, so those two are this season as of the file's date */
let built = null, builtKey = '';
function rowsOf(d) {
  const pl = NBA.players(), live = pl && pl.type === 2 && NBA.seasonType === 2 ? pl : null;
  const key = [NBA.status('alltime').t, live ? NBA.status('players').t : 0, S.type].join('|');
  if (built && builtKey === key) return built;
  const ix = Object.fromEntries(d.cols.map((c, i) => [c, i]));
  const active = new Set(d.active);
  const byName = new Map((pl || []).map(p => [norm(p.name), p]));
  const csBy = new Map(d.cs.map(r => [r[0], r]));
  const espnOf = (name, team) => byName.get(norm(name)) || (team && (pl || []).find(p => p.team === team && norm(p.name).endsWith(norm(name.split(' ').slice(-1)[0]))));
  // ESPN's season line in the file's columns; the snapshot when ESPN has fewer games (it hasn't caught up yet)
  const fromEspn = (e, c) => {
    const snap = c.slice(2);
    if (!e || !(e.gp >= snap[ix.gp])) return snap;
    const t = e.tot;
    const m = { gp: e.gp, min: t.min, fgm: t.fgm, fga: t.fga, fg3m: t.tpm, fg3a: t.tpa, ftm: t.ftm, fta: t.fta, oreb: snap[ix.oreb], dreb: snap[ix.dreb], reb: t.reb, ast: t.ast, stl: t.stl, blk: t.blk, tov: t.tov, pts: t.pts };
    return d.cols.map((k, i) => Number.isFinite(m[k]) ? Math.round(m[k]) : snap[i]);
  };
  const add = (a, b) => a.map((x, i) => x == null && b[i] == null ? null : (x || 0) + (b[i] || 0));
  built = (S.type === 'po' ? d.po : d.base).map(r => {
    const id = r[0], name = r[1], c = S.type === 'rs' ? csBy.get(id) : null, on = active.has(id);
    const e = on ? espnOf(name, c && c[1]) : null;
    return { id, name, on, espn: e ? e.id : '', v: c ? add(r.slice(2), live ? fromEspn(e, c) : c.slice(2)) : r.slice(2) };
  });
  built.ix = ix;
  builtKey = key;
  return built;
}
const get = (r, ix, k) => r.v[ix[k]];
// A row's value for a column, in the mode shown (per game divides the totals by games, but not games themselves)
function val(r, ix, k) {
  const g = c => get(r, ix, c);
  if (k === 'fgp') return g('fga') ? g('fgm') / g('fga') * 100 : null;
  if (k === 'fg3p') return g('fg3a') ? g('fg3m') / g('fg3a') * 100 : null;
  if (k === 'ftp') return g('fta') ? g('ftm') / g('fta') * 100 : null;
  if (k === 'efg') return g('fga') ? (g('fgm') + .5 * (g('fg3m') || 0)) / g('fga') * 100 : null;
  if (k === 'ts') return g('fga') != null && g('fta') != null && g('fga') + g('fta') > 0 ? g('pts') / (2 * (g('fga') + .44 * g('fta'))) * 100 : null;
  const x = g(k);
  return x == null ? null : S.mode === 'pg' && k !== 'gp' ? x / Math.max(1, g('gp')) : x;
}
// Whether a row counts for a leaderboard of k (the minimums above)
function qualifies(r, ix, k) {
  const m = MIN[S.type], g = c => get(r, ix, c) || 0;
  if (k === 'fgp' || k === 'efg' || k === 'ts') return g('fgm') >= m.fgm;
  if (k === 'fg3p') return g('fg3m') >= m.fg3m;
  if (k === 'ftp') return g('ftm') >= m.ftm;
  return S.mode !== 'pg' || k === 'gp' || g('gp') >= m.gp;
}
const fmt = (k, v) => v == null ? '–' : PCT.has(k) ? v.toFixed(1) : S.mode === 'pg' && k !== 'gp' ? v.toFixed(1) : Math.round(v).toLocaleString('en-US');

let sorted = null, sortedKey = '';
function leaders(d) {
  const rows = rowsOf(d), ix = rows.ix, k = S.stat, q = norm(S.q);
  const key = [builtKey, S.mode, k, S.active, q].join('|');
  if (sorted && sortedKey === key) return sorted;
  sorted = rows.filter(r => (!S.active || r.on) && (!q || norm(r.name).includes(q)) && qualifies(r, ix, k))
    .map(r => ({ r, x: val(r, ix, k) })).filter(o => o.x != null).sort((a, b) => b.x - a.x).map(o => o.r);
  sorted.ix = ix;
  sortedKey = key;
  return sorted;
}

// The Stats tab's all-time view; viewSeg is the This season | All-time switch from views.js
NBA.allTimeView = viewSeg => {
  const d = NBA.use('alltime');
  NBA.use('players');
  const ctl = (act, cur, opts, label) => `<div class="seg sm" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`;
  const head = `<div class="sec-h"><h2>Stats</h2><span class="sub">All-time leaders · ${S.type === 'po' ? 'playoffs' : 'regular season'} · ${S.mode === 'pg' ? 'per game' : 'career totals'}</span></div>
    <div class="stats-view">${viewSeg}</div>`;
  if (!d) return `<section class="sec">${head}${NBA.status('alltime').err ? `<p class="empty">Couldn't load the all-time numbers. It will try again shortly.</p>` : '<p class="loading">Loading every career in NBA history…</p>'}</section>`;
  const list = leaders(d), ix = list.ix, pages = Math.max(1, Math.ceil(list.length / PAGE));
  if (S.page >= pages) S.page = pages - 1;
  const from = S.page * PAGE, shown = list.slice(from, from + PAGE);
  const tools = `<div class="at-tools">
    <label class="at-f"><span>Season type</span>${ctl('atset', S.type, [['rs', 'Regular season'], ['po', 'Playoffs']], 'Season type')}</label>
    <label class="at-f"><span>Per mode</span>${ctl('atmode', S.mode, [['tot', 'Totals'], ['pg', 'Per game']], 'Per mode')}</label>
    <label class="at-f"><span>Stat category</span><select class="field" id="at-stat" data-ch="atstat">${COLS.map(([k, , l]) => `<option value="${k}"${k === S.stat ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
    <label class="at-f at-tog"><input type="checkbox" id="at-active" data-ch="atactive"${S.active ? ' checked' : ''}><span class="sw" aria-hidden="true"></span><span>Only active players</span></label>
    <label class="at-f at-q"><span>Find a player</span><input class="field" id="at-q" type="search" data-in="atq" value="${esc(S.q)}" placeholder="Name" autocomplete="off" spellcheck="false"></label></div>`;
  const pager = `<div class="at-pager"><span class="mut">${list.length.toLocaleString('en-US')} player${list.length === 1 ? '' : 's'} · page ${S.page + 1} of ${pages}</span>
    <button class="ib" data-act="atpage" data-v="-1" aria-label="Previous page"${S.page ? '' : ' disabled'}>${UI.I.left}</button><button class="ib" data-act="atpage" data-v="1" aria-label="Next page"${S.page < pages - 1 ? '' : ' disabled'}>${UI.I.right}</button></div>`;
  const th = COLS.map(([k, l, full]) => `<th scope="col"${k === S.stat ? ' class="on" aria-sort="descending"' : ''}><button class="sortb" data-act="atsort" data-v="${k}" title="${esc(full)}">${l}</button></th>`).join('');
  // On a phone the sorted stat also sits right after the name, so it's on screen whichever column it is
  const keyLabel = (COLS.find(c => c[0] === S.stat) || [, ''])[1];
  const name = r => r.espn ? `<button class="plink" data-act="player" data-id="${esc(r.espn)}">${esc(r.name)}</button>` : `<a class="plink" href="https://www.nba.com/stats/player/${r.id}" target="_blank" rel="noopener">${esc(r.name)}</a>`;
  const body = shown.length ? shown.map((r, i) => `<tr><td class="rk">${from + i + 1}</td><th class="pl sticky" scope="row">${name(r)}${r.on ? '<i class="at-on" title="Active"></i>' : ''}</th><td class="at-key">${fmt(S.stat, val(r, ix, S.stat))}</td>${COLS.map(([k]) => `<td${k === S.stat ? ' class="on"' : ''}>${fmt(k, val(r, ix, k))}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${COLS.length + 3}" class="empty">No players match.</td></tr>`;
  const m = MIN[S.type], n = v => v.toLocaleString('en-US');
  const asOf = NBA.fmtDay(String(d.updated).slice(0, 10), { month: 'short', day: 'numeric', year: 'numeric' });
  return `<section class="sec">${head}
    <div class="card at-card">${tools}${pager}
      <div class="tblwrap" data-sx="at-tbl"><table class="tbl at-tbl"><thead><tr><th scope="col" class="rk">#</th><th scope="col" class="pl sticky">Player</th><th scope="col" class="at-key">${esc(keyLabel)}</th>${th}</tr></thead><tbody>${body}</tbody></table></div>
      ${pages > 1 ? pager : ''}</div>
    <p class="note">From NBA.com: careers through last season, with this season added live from ESPN as games finish (offensive and defensive rebounds this season as of ${esc(asOf)}). ${S.mode === 'pg' ? `Per game needs ${n(m.gp)} games. ` : ''}FG%, eFG% and TS% need ${n(m.fgm)} made field goals, 3P% ${n(m.fg3m)} made threes and FT% ${n(m.ftm)} made free throws. Steals and blocks were first counted in 1973-74, turnovers in 1977-78 and threes in 1979-80. Tap a column to sort by it.</p></section>`;
};

const reset = () => { S.page = 0; NBA.changed(); };
Object.assign(NBA.actions, {
  atset: a => { S.type = a.dataset.v; reset(); },
  atmode: a => { S.mode = a.dataset.v; reset(); },
  atsort: a => { S.stat = a.dataset.v; reset(); },
  atpage: a => {
    S.page = Math.max(0, S.page + +a.dataset.v);
    NBA.changed();
    // A pager under the table takes you back up to the top of it
    const card = document.querySelector('.at-card');
    if (card && a.closest('.at-pager') !== card.querySelector('.at-pager')) setTimeout(() => card.scrollIntoView({ block: 'start' }), 0);
  },
});
Object.assign(NBA.changes, {
  atstat: t => { S.stat = t.value; reset(); },
  atactive: t => { S.active = t.checked; reset(); },
  atq: t => { S.q = t.value; reset(); },
});
})();
