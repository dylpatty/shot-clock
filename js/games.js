/* Games tab: stat-based NBA games built from this season's live ESPN numbers.
   Scores, streaks and picks are saved in this browser only. */
(() => {
'use strict';

const NBA = window.NBA, UI = NBA.ui, st = UI.st;
const { esc } = NBA;
const V = NBA.views;

/* ---------- saved progress ---------- */
const STORE = 'nba.games.v1';
const G = (() => { try { return JSON.parse(localStorage.getItem(STORE) || 'null') || {}; } catch (e) { return {}; } })();
const DEFAULTS = { daily: {}, hl: { best: 0 }, quiz: { right: 0, n: 0, best: 0 }, rank: { played: 0, points: 0, perfect: 0 }, team: { right: 0, n: 0 }, picks: {} };
Object.keys(DEFAULTS).forEach(k => { if (!G[k] || typeof G[k] !== 'object') G[k] = DEFAULTS[k]; });
if (!Array.isArray(G.props)) G.props = [];
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(G)); } catch (e) { /* storage blocked: progress lasts for this visit */ } };

/* ---------- helpers ---------- */
const rnd = n => Math.floor(Math.random() * n);
const pickOne = a => a[rnd(a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const players = () => NBA.data('players') || [];
const byId = id => players().find(p => p.id === id);
const teamRows = () => (NBA.data('standings') || []).flatMap(c => c.rows);
const confOf = teamId => (teamRows().find(r => r.id === teamId) || {}).conf || '';
// Recognizable names: rotation regulars, best scorers first
const known = (n = 150) => players().filter(p => p.gp >= 2 && p.min >= 20 && p.teamId).sort((a, b) => b.pts - a.pts).slice(0, n);
const POS = { G: 'Guard', F: 'Forward', C: 'Center' };
const STAT = {
  pts: { label: 'Points', short: 'PTS', unit: 'points' },
  reb: { label: 'Rebounds', short: 'REB', unit: 'rebounds' },
  ast: { label: 'Assists', short: 'AST', unit: 'assists' },
  tpm: { label: '3-pointers made', short: '3PM', unit: 'threes' },
  stl: { label: 'Steals', short: 'STL', unit: 'steals' },
  blk: { label: 'Blocks', short: 'BLK', unit: 'blocks' },
  min: { label: 'Minutes', short: 'MIN', unit: 'minutes' },
};
const ROUND_STATS = ['pts', 'reb', 'ast', 'tpm', 'stl', 'blk', 'min'];
const card = (title, end, body, cls = '') => `<div class="card gm ${cls}"><div class="card-h"><h3>${title}</h3>${end ? `<div class="end">${end}</div>` : ''}</div><div class="card-b gm-b">${body}</div></div>`;
const who = p => `${esc(p.team)} · ${esc(POS[p.pos] || p.pos || '')}`;
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
// Pressing Enter in a name box picks the first suggestion under it
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.matches('.gm-find input')) return;
  const first = e.target.parentElement.querySelector('.psugg [data-act]');
  if (first) { e.preventDefault(); first.click(); }
});
const suggestions = (q, act, skip = []) => {
  const f = fold(q).trim();
  if (f.length < 2) return '';
  const list = players().filter(p => !skip.includes(p.id) && fold(p.name).includes(f)).sort((a, b) => b.min - a.min).slice(0, 6);
  if (!list.length) return '<p class="note sugg-none">No player by that name in this season\'s stats.</p>';
  return `<div class="psugg">${list.map(p => `<button data-act="${act}" data-id="${p.id}">${UI.hs(p.headshot)}<span><b>${esc(p.name)}</b><small>${who(p)}</small></span></button>`).join('')}</div>`;
};

/* ---------- the tab ---------- */
const GAMES = [
  { id: 'sleuth', name: 'Stat Sleuth', ico: '?', daily: true, blurb: 'A new mystery player every day. Eight guesses, and each one shows how close you are on team, age and stats.', status: sleuthStatus, view: sleuthView },
  { id: 'higher', name: 'Higher or Lower', ico: '↑↓', blurb: 'Does the next player average more or fewer? Keep the streak alive as long as you can.', status: () => G.hl.best ? `Best streak: ${G.hl.best}` : 'No streak yet', view: hlView },
  { id: 'guess', name: 'Guess the Player', ico: 'ID', blurb: 'One season stat line, four names. Pick the right player.', status: () => G.quiz.n ? `${G.quiz.right} of ${G.quiz.n} right · best streak ${G.quiz.best}` : 'Not played yet', view: quizView },
  { id: 'rank', name: "Rank 'Em", ico: '1-5', blurb: 'Five players, one stat. Tap them in order from most to fewest.', status: () => G.rank.played ? `${G.rank.played} rounds · ${(G.rank.points / G.rank.played).toFixed(1)} of 5 on average · ${G.rank.perfect} perfect` : 'Not played yet', view: rankView },
  { id: 'team', name: 'Name That Team', ico: 'TM', blurb: 'A team\'s season profile with the name hidden. Which of four teams is it?', status: () => G.team.n ? `${G.team.right} of ${G.team.n} right` : 'Not played yet', view: teamView },
  { id: 'pickem', name: "Pick'em", ico: 'W/L', blurb: 'Pick the winner of every game today and tomorrow. Your record updates itself when games go final.', status: pickStatus, view: pickView },
  { id: 'props', name: 'Breakout Calls', ico: '↗', blurb: 'Call over or under on a player\'s next game, or swing for a breakout night. Graded automatically after they play.', status: propStatus, view: propView },
];
// For the Home tab's "Play today" card
NBA.gamesMenu = () => GAMES.map(g => ({ id: g.id, name: g.name, ico: g.ico, daily: !!g.daily, status: g.status() }));
V.games = arg => {
  NBA.use('players'); NBA.use('standings'); NBA.use('teamstats'); NBA.use('day:');
  resolvePicks(); resolveProps();
  const head = `<div class="sec-h"><h2>Games</h2><span class="sub">NBA stat games built from this season's live numbers. Your scores and picks are saved on this device.</span></div>`;
  if (!players().length) return `<section class="sec">${head}${NBA.status('players').err ? '<p class="empty">Couldn\'t load player stats from ESPN. It will try again shortly.</p>' : '<p class="loading">Loading player stats…</p>'}</section>`;
  const game = GAMES.find(g => g.id === arg);
  const tile = g => `<a class="card gm-tile${g.daily ? ' daily' : ''}" href="#games/${g.id}"><div class="gm-top"><span class="gm-ico">${g.ico}</span>${g.daily ? '<span class="gm-tag">Daily</span>' : ''}</div>
    <h3>${esc(g.name)}</h3><p>${esc(g.blurb)}</p><div class="gm-stat">${esc(g.status())}</div></a>`;
  if (!game) return `<section class="sec">${head}<div class="gm-tiles">${GAMES.map(tile).join('')}</div></section>`;
  const mini = g => `<a class="card gm-mini" href="#games/${g.id}"><span class="gm-ico sm">${g.ico}</span><span><b>${esc(g.name)}</b><small>${esc(g.status())}</small></span></a>`;
  return `<section class="sec"><a class="backlink" href="#games">← All games</a>
    <div class="gm-page"><div class="gm-main">${game.view()}</div>
      <aside class="gm-side" aria-label="More games"><div class="eyebrow">More games</div><div class="gm-side-list">${GAMES.filter(g => g !== game).map(mini).join('')}</div></aside></div></section>`;
};

/* ================= Stat Sleuth (daily) ================= */
const MAXG = 8;
// hit = counts as a match, near = close. Arrows point toward the mystery player's number.
const SL_COLS = [
  { k: 'team', label: 'Team' }, { k: 'pos', label: 'Pos' }, { k: 'age', label: 'Age', hit: 0, near: 2 },
  { k: 'pts', label: 'PTS', hit: 1, near: 3 }, { k: 'reb', label: 'REB', hit: .7, near: 2 }, { k: 'ast', label: 'AST', hit: .7, near: 2 }, { k: 'tpm', label: '3PM', hit: .4, near: 1 },
];
const sleuthPool = () => players().filter(p => p.gp >= 2 && p.min >= 25 && p.pts >= 14 && p.teamId).sort((a, b) => a.id.localeCompare(b.id));
const hashStr = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
function sleuthGame() {
  if (st.slMode === 'practice' && st.slPractice) return st.slPractice;
  let g = G.daily[NBA.today];
  if (!g) {
    const pool = sleuthPool();
    if (!pool.length) return null;
    // The day's answer is fixed the first time you open it, so later stat updates can't change it
    g = G.daily[NBA.today] = { ans: pool[hashStr('sleuth' + NBA.today) % pool.length].id, guesses: [], done: false, won: false };
    save();
  }
  return g;
}
function slCell(col, p, ans) {
  if (col.k === 'team') {
    const t = NBA.T(p.teamId);
    const cls = p.teamId === ans.teamId ? 'hit' : confOf(p.teamId) && confOf(p.teamId) === confOf(ans.teamId) ? 'near' : '';
    return { cls, html: `${t.logo ? UI.logo(t, 24) : ''}<small>${esc(t.abbr || p.team)}</small>` };
  }
  if (col.k === 'pos') return { cls: p.pos === ans.pos ? 'hit' : '', html: esc(p.pos || '–') };
  const g = +p[col.k] || 0, a = +ans[col.k] || 0, d = a - g;
  const cls = Math.abs(d) <= col.hit + 1e-9 ? 'hit' : Math.abs(d) <= col.near + 1e-9 ? 'near' : '';
  const arrow = d > .05 ? '↑' : d < -.05 ? '↓' : '';
  return { cls, html: `${col.k === 'age' ? g : NBA.fix(g)}${arrow ? `<i aria-label="${d > 0 ? 'mystery player is higher' : 'mystery player is lower'}">${arrow}</i>` : ''}` };
}
function sleuthStreak() {
  let n = 0, d = NBA.today;
  for (let i = 0; i < 400; i++, d = NBA.shiftIso(d, -1)) {
    const g = G.daily[d];
    if (g && g.won) n++;
    else if (!(i === 0 && (!g || !g.done))) break;
  }
  return n;
}
function sleuthStatus() {
  const g = G.daily[NBA.today];
  const today = g && g.done ? (g.won ? `Solved today in ${g.guesses.length}` : 'Missed today') : g && g.guesses.length ? `${MAXG - g.guesses.length} guesses left today` : 'Today\'s player is ready';
  const s = sleuthStreak();
  return today + (s > 1 ? ` · ${s}-day streak` : '');
}
function sleuthView() {
  const practice = st.slMode === 'practice';
  const g = sleuthGame();
  const seg = `<div class="seg sm" role="group" aria-label="Mode"><button data-act="slmode" data-v="daily" aria-pressed="${!practice}">Today</button><button data-act="slmode" data-v="practice" aria-pressed="${practice}">Practice</button></div>`;
  if (!g) return card('Stat Sleuth', seg, '<p class="empty">Not enough player data yet.</p>');
  const ans = byId(g.ans);
  if (!ans) return card('Stat Sleuth', seg, '<p class="empty">Today\'s mystery player dropped out of ESPN\'s stats feed. Try a practice round.</p>');
  const guesses = g.guesses.map(byId).filter(Boolean);
  const left = MAXG - guesses.length;
  const board = guesses.length ? `<div class="sl-board"><div class="sl-row sl-head"><span class="sl-name">Guess</span>${SL_COLS.map(c => `<span>${c.label}</span>`).join('')}</div>
    ${guesses.slice().reverse().map((p, i) => `<div class="sl-row${p.id === ans.id ? ' win' : ''}"><div class="sl-name"><span class="sl-num">${guesses.length - i}</span>${UI.hs(p.headshot)}<span class="nm">${esc(p.name)}</span></div>
      ${SL_COLS.map(c => { const x = slCell(c, p, ans); return `<div class="sl-c ${x.cls}">${x.html}</div>`; }).join('')}</div>`).join('')}</div>` : '';
  let top;
  if (!g.done) {
    top = `<div class="gm-find"><label class="sr" for="sl-q">Guess a player</label><input class="field big" id="sl-q" data-in="slq" type="search" autocomplete="off" spellcheck="false" placeholder="Type a player's name · ${left} guess${left === 1 ? '' : 'es'} left" value="${esc(st.slQ || '')}">${suggestions(st.slQ, 'slguess', g.guesses)}</div>`;
  } else {
    top = `<div class="gm-reveal ${g.won ? 'won' : 'lost'}">${UI.hs(ans.headshot)}<div class="rv-txt"><div class="eyebrow">${g.won ? `Solved in ${guesses.length} of ${MAXG}` : 'Out of guesses. It was'}</div><div class="nm">${esc(ans.name)}</div>
      <div class="mut">${who(ans)} · ${ans.age ? ans.age + ' years old · ' : ''}${NBA.fix(ans.pts)} pts, ${NBA.fix(ans.reb)} reb, ${NBA.fix(ans.ast)} ast</div></div>
      <div class="rv-acts">${practice ? '<button class="btn primary" data-act="slpractice">Another round</button>' : `<button class="btn" data-act="slshare">${st.slCopied ? 'Copied' : 'Copy result'}</button><button class="btn primary" data-act="slpractice">Practice round</button>`}</div></div>`;
  }
  const played = Object.values(G.daily).filter(x => x.done), won = played.filter(x => x.won).length;
  const intro = practice ? 'Practice round: a random player. Play as many as you like.' : `Today's mystery player for ${esc(NBA.fmtDay(NBA.today, { weekday: 'long', month: 'long', day: 'numeric' }))}. Everyone gets a new one tomorrow.`;
  return card('Stat Sleuth', seg, `<p class="gm-how">${intro} Each guess shows how that player compares. <span class="key hit">Green</span> is a match or within a hair, <span class="key near">amber</span> is close (for Team, same conference), and arrows point toward the mystery player's number. Stats are this season's per-game averages.</p>
    ${top}${board}
    ${practice ? '' : `<div class="gm-foot"><span>Played <b>${played.length}</b></span><span>Won <b>${won}</b></span><span>Win rate <b>${pct(won, played.length)}</b></span><span>Streak <b>${sleuthStreak()}</b></span></div>`}`);
}
NBA.changes.slq = t => { st.slQ = t.value; NBA.render(); };
NBA.actions.slguess = a => {
  const g = sleuthGame(), id = a.dataset.id;
  if (!g || g.done || g.guesses.includes(id)) return;
  g.guesses.push(id);
  if (id === g.ans) { g.done = true; g.won = true; } else if (g.guesses.length >= MAXG) g.done = true;
  st.slQ = '';
  if (g !== st.slPractice) save();
  NBA.render();
  const box = document.getElementById('sl-q');
  if (box && !matchMedia('(pointer: coarse)').matches) box.focus();
};
const newPractice = () => { const pool = sleuthPool(); st.slPractice = pool.length ? { ans: pickOne(pool).id, guesses: [], done: false, won: false } : null; };
NBA.actions.slmode = a => { st.slMode = a.dataset.v; if (st.slMode === 'practice' && !st.slPractice) newPractice(); st.slQ = ''; NBA.changed(); };
NBA.actions.slpractice = () => { st.slMode = 'practice'; newPractice(); st.slQ = ''; NBA.changed(); };
NBA.actions.slshare = () => {
  const g = G.daily[NBA.today], ans = g && byId(g.ans);
  if (!ans) return;
  const lines = g.guesses.map(byId).filter(Boolean).map(p => SL_COLS.map(c => ({ hit: '🟩', near: '🟨' })[slCell(c, p, ans).cls] || '⬛').join(''));
  const text = `NBA Stat Sleuth · ${NBA.fmtDay(NBA.today, { month: 'short', day: 'numeric' })} · ${g.won ? g.guesses.length : 'X'}/${MAXG}\n${lines.join('\n')}`;
  const done = () => { st.slCopied = true; NBA.changed(); setTimeout(() => { st.slCopied = false; NBA.changed(); }, 2000); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
};

/* ================= Higher or Lower ================= */
function hlRound(keep) {
  const pool = known();
  for (let i = 0; i < 50; i++) {
    const k = pickOne(ROUND_STATS);
    const a = keep ? byId(keep) : pickOne(pool), b = pickOne(pool);
    if (a && b && a.id !== b.id && NBA.fix(a[k]) !== NBA.fix(b[k])) return { k, a: a.id, b: b.id, pick: null };
  }
  return null;
}
function hlView() {
  if (!st.hl) { st.hl = hlRound(); st.hlStreak = 0; }
  const r = st.hl, a = r && byId(r.a), b = r && byId(r.b);
  const end = `<span class="gm-score">Streak <b>${st.hlStreak}</b> · Best <b>${G.hl.best}</b></span>`;
  if (!a || !b) return card('Higher or Lower', end, '<p class="empty">Not enough player data yet.</p>');
  const s = STAT[r.k], done = r.pick != null, right = done && (r.pick === 'more') === (b[r.k] > a[r.k]);
  const side = (p, show) => `<div class="hl-p${done && p === b ? (right ? ' ok' : ' no') : ''}">${UI.hs(p.headshot)}<div class="nm">${esc(p.name)}</div><div class="mut">${who(p)}</div>
    <div class="val">${show ? NBA.fix(p[r.k]) : '?'}</div><div class="eyebrow">${s.unit} per game</div></div>`;
  const ask = !done
    ? `<div class="hl-ask"><p>Does <b>${esc(b.name)}</b> average more or fewer ${s.unit} than ${esc(a.name)}?</p>
        <div class="hl-btns"><button class="btn big" data-act="hlpick" data-v="more">↑ More</button><button class="btn big" data-act="hlpick" data-v="fewer">↓ Fewer</button></div></div>`
    : `<div class="gm-result ${right ? 'won' : 'lost'}"><span><b>${right ? 'Correct.' : 'Wrong.'}</b> ${esc(b.name)} averages ${NBA.fix(b[r.k])} ${s.unit}${right ? '' : `, so your streak ends at ${st.hlStreak}`}.</span>
        <button class="btn primary" data-act="hlnext">${right ? 'Next player' : 'Play again'}</button></div>`;
  return card('Higher or Lower', end, `<p class="gm-how">This round's stat: <b>${s.label} per game</b>. Get it right and the second player stays on for the next round with a new stat.</p>
    <div class="hl">${side(a, true)}<div class="hl-vs">vs</div>${side(b, done)}</div>${ask}`);
}
NBA.actions.hlpick = a => {
  const r = st.hl;
  if (!r || r.pick) return;
  r.pick = a.dataset.v;
  const A = byId(r.a), B = byId(r.b);
  r.right = (r.pick === 'more') === (B[r.k] > A[r.k]);
  if (r.right) { st.hlStreak++; if (st.hlStreak > G.hl.best) { G.hl.best = st.hlStreak; save(); } }
  NBA.changed();
};
NBA.actions.hlnext = () => {
  const r = st.hl;
  if (r && r.right) st.hl = hlRound(r.b) || hlRound();
  else { st.hl = hlRound(); st.hlStreak = 0; }
  NBA.changed();
};

/* ================= Guess the Player ================= */
function newQuiz() {
  const pool = known(90);
  if (pool.length < 8) return null;
  st.quizSeen = st.quizSeen || [];
  let fresh = pool.filter(p => !st.quizSeen.includes(p.id));
  if (!fresh.length) { st.quizSeen = []; fresh = pool; }
  const ans = pickOne(fresh);
  st.quizSeen.push(ans.id);
  // Decoys play the same position when possible, so the numbers have to do the work
  const decoys = shuffle(pool.filter(p => p.id !== ans.id && p.pos === ans.pos)).concat(shuffle(pool.filter(p => p.id !== ans.id && p.pos !== ans.pos))).slice(0, 3);
  return { id: ans.id, opts: shuffle([ans, ...decoys].map(p => p.id)), pick: null };
}
function quizView() {
  if (!st.quiz || !byId(st.quiz.id)) st.quiz = newQuiz();
  st.quizStreak = st.quizStreak || 0;
  const q = st.quiz;
  const end = `<span class="gm-score">${G.quiz.right} of ${G.quiz.n} right · Streak <b>${st.quizStreak}</b></span>`;
  if (!q) return card('Guess the Player', end, '<p class="empty">Not enough player data yet.</p>');
  const p = byId(q.id), done = q.pick != null, conf = confOf(p.teamId);
  const clues = [
    `${NBA.fix(p.pts)} points · ${NBA.fix(p.reb)} rebounds · ${NBA.fix(p.ast)} assists`,
    `${p.tpa >= .5 ? `${NBA.fix(p.tpp)}% from three on ${NBA.fix(p.tpa)} attempts` : 'Almost never shoots threes'} · ${NBA.fix(p.min)} minutes a game`,
    [p.age ? `Age ${p.age}` : '', POS[p.pos] || p.pos, conf ? `${conf}ern Conference` : ''].filter(Boolean).join(' · '),
  ];
  return card('Guess the Player', end, `<div class="q-mystery">${done ? `<button class="q-face" data-act="player" data-id="${p.id}" aria-label="Open ${esc(p.name)}'s player card">${UI.hs(p.headshot, '')}</button>` : '<div class="q-face" aria-hidden="true">?</div>'}
      <ul class="q-clues">${clues.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
    <div class="q-opts">${q.opts.map(id => {
      const o = byId(id) || {};
      const cls = !done ? '' : id === q.id ? ' right' : id === q.pick ? ' wrong' : '';
      return `<button class="q-opt${cls}" data-act="quizpick" data-id="${id}"${done ? ' disabled' : ''}>${esc(o.name || '')}${done ? `<small>${esc(o.team || '')}</small>` : ''}</button>`;
    }).join('')}</div>
    ${done ? `<div class="gm-result ${q.pick === q.id ? 'won' : 'lost'}"><span><b>${q.pick === q.id ? 'Correct.' : `It was ${esc(p.name)}.`}</b></span><button class="btn primary" data-act="quiznext">Next player</button></div>` : ''}`);
}
NBA.actions.quizpick = a => {
  const q = st.quiz;
  if (!q || q.pick != null) return;
  q.pick = a.dataset.id;
  G.quiz.n++;
  if (q.pick === q.id) { G.quiz.right++; st.quizStreak++; G.quiz.best = Math.max(G.quiz.best, st.quizStreak); } else st.quizStreak = 0;
  save();
  NBA.changed();
};
NBA.actions.quiznext = () => { st.quiz = newQuiz(); NBA.changed(); };

/* ================= Rank 'Em ================= */
function rankRound() {
  const pool = known();
  for (let i = 0; i < 50; i++) {
    const k = pickOne(ROUND_STATS), five = shuffle(pool.slice()).slice(0, 5);
    if (five.length === 5 && new Set(five.map(p => NBA.fix(p[k]))).size === 5) return { k, ids: five.map(p => p.id), order: [], done: false };
  }
  return null;
}
function rankView() {
  if (!st.rk || st.rk.ids.some(id => !byId(id))) st.rk = rankRound();
  const r = st.rk;
  const end = G.rank.played ? `<span class="gm-score">${G.rank.played} rounds · ${G.rank.perfect} perfect</span>` : '';
  if (!r) return card("Rank 'Em", end, '<p class="empty">Not enough player data yet.</p>');
  const s = STAT[r.k], ps = r.ids.map(byId);
  const truth = ps.slice().sort((a, b) => b[r.k] - a[r.k]).map(p => p.id);
  let body;
  if (!r.done) {
    body = `<p class="gm-how">Tap the players from <b>most ${s.unit} per game</b> to fewest. Tap a numbered player again to take it back.</p>
      <div class="rk-grid">${ps.map(p => { const n = r.order.indexOf(p.id); return `<button class="rk-p${n >= 0 ? ' on' : ''}" data-act="rkpick" data-id="${p.id}">${n >= 0 ? `<span class="rk-n">${n + 1}</span>` : ''}${UI.hs(p.headshot)}<span class="rk-t"><b>${esc(p.name)}</b><small>${who(p)}</small></span></button>`; }).join('')}</div>
      ${r.order.length ? '<div class="gm-actions"><button class="btn" data-act="rkclear">Start over</button></div>' : ''}`;
  } else {
    const score = truth.filter((id, i) => r.order[i] === id).length;
    body = `<div class="gm-result ${score === 5 ? 'won' : score >= 3 ? 'meh' : 'lost'}"><span><b>${score} of 5</b> in the right spot${score === 5 ? '. Perfect.' : '.'}</span><button class="btn primary" data-act="rknext">New round</button></div>
      <ol class="rk-list">${truth.map((id, i) => { const p = byId(id), you = r.order.indexOf(id) + 1; return `<li class="${you === i + 1 ? 'ok' : 'no'}"><span class="rk-n">${i + 1}</span>${UI.hs(p.headshot)}<span class="rk-t"><b>${esc(p.name)}</b><small>${who(p)} · you had them ${NBA.ord(you)}</small></span><span class="rk-v">${NBA.fix(p[r.k])}<small>${s.short}</small></span></li>`; }).join('')}</ol>`;
  }
  return card("Rank 'Em", end, `<div class="rk-stat"><span class="eyebrow">This round</span><b>${s.label} per game</b></div>${body}`);
}
NBA.actions.rkpick = a => {
  const r = st.rk, id = a.dataset.id;
  if (!r || r.done) return;
  const i = r.order.indexOf(id);
  if (i >= 0) r.order.splice(i, 1); else r.order.push(id);
  if (r.order.length === 5) {
    r.done = true;
    const truth = r.ids.map(byId).sort((x, y) => y[r.k] - x[r.k]).map(p => p.id);
    const score = truth.filter((t, k) => r.order[k] === t).length;
    G.rank.played++; G.rank.points += score; if (score === 5) G.rank.perfect++;
    save();
  }
  NBA.changed();
};
NBA.actions.rkclear = () => { if (st.rk) st.rk.order = []; NBA.changed(); };
NBA.actions.rknext = () => { st.rk = rankRound(); NBA.changed(); };

/* ================= Name That Team ================= */
function teamRound() {
  const ts = NBA.data('teamstats') || [];
  if (ts.length < 8 || !teamRows().length) return null;
  const ans = pickOne(ts), conf = confOf(ans.id);
  const others = shuffle(ts.filter(t => t.id !== ans.id && confOf(t.id) === conf)).slice(0, 3);
  return { id: ans.id, opts: shuffle([ans.id, ...others.map(t => t.id)]), pick: null };
}
function teamView() {
  if (!st.tq) st.tq = teamRound();
  const q = st.tq;
  const end = G.team.n ? `<span class="gm-score">${G.team.right} of ${G.team.n} right</span>` : '';
  const t = q && (NBA.data('teamstats') || []).find(x => x.id === q.id);
  if (!t) return card('Name That Team', end, '<p class="empty">Loading team stats…</p>');
  const rk = k => NBA.ord(t.rank[k]);
  const top = players().filter(p => p.teamId === t.id && p.gp >= 2).sort((a, b) => b.pts - a.pts)[0];
  const row = teamRows().find(r => r.id === t.id) || {};
  const clues = [
    ['Scoring', `${NBA.fix(t.ppg)} points a game, ${rk('ppg')} in the NBA`],
    ['Defense', `Allows ${NBA.fix(t.oppg)}, ${rk('oppg')} fewest`],
    ['Pace', `${NBA.fix(t.pace)} possessions a game, ${rk('pace')} fastest`],
    ['From three', `${NBA.fix(t.tpm)} made a game on ${NBA.fix(t.tpp)}%, ${rk('tpm')} in makes`],
    ['Glass and passing', `${NBA.fix(t.rpg)} rebounds (${rk('rpg')}) and ${NBA.fix(t.apg)} assists (${rk('apg')})`],
    top ? ['Top scorer', `A ${top.age ? top.age + '-year-old ' : ''}${(POS[top.pos] || 'player').toLowerCase()} averaging ${NBA.fix(top.pts)} points`] : null,
  ].filter(Boolean);
  const done = q.pick != null;
  return card('Name That Team', end, `<p class="gm-how">All four choices are in the ${esc(confOf(t.id))}ern Conference. Ranks are out of 30 teams.</p>
    <dl class="tq-clues">${clues.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <div class="tq-opts">${q.opts.map(id => {
      const o = NBA.T(id);
      const cls = !done ? '' : id === q.id ? ' right' : id === q.pick ? ' wrong' : '';
      return `<button class="q-opt tq-opt${cls}" data-act="tqpick" data-id="${id}"${done ? ' disabled' : ''}>${UI.logo(o, 36)}<span>${esc(o.name || o.full)}</span></button>`;
    }).join('')}</div>
    ${done ? `<div class="gm-result ${q.pick === q.id ? 'won' : 'lost'}"><span><b>${q.pick === q.id ? `Correct, it's the ${esc(NBA.T(q.id).name)}.` : `It was the ${esc(NBA.T(q.id).name)}.`}</b> They are ${row.w ?? '–'}-${row.l ?? '–'} this season.</span><button class="btn primary" data-act="tqnext">Next team</button></div>` : ''}`);
}
NBA.actions.tqpick = a => {
  const q = st.tq;
  if (!q || q.pick != null) return;
  q.pick = a.dataset.id;
  G.team.n++; if (q.pick === q.id) G.team.right++;
  save();
  NBA.changed();
};
NBA.actions.tqnext = () => { st.tq = teamRound(); NBA.changed(); };

/* ================= Pick'em ================= */
const dayKey = param => param === NBA.paramOf(NBA.today) ? 'day:' : 'day:' + param;
const started = g => g.state !== 'pre' || Date.now() >= new Date(g.date).getTime();
function resolvePicks() {
  let dirty = false;
  Object.entries(G.picks).forEach(([gid, p]) => {
    if (p.result) return;
    const day = NBA.use(dayKey(p.param));
    const g = day && day.games.find(x => x.id === gid);
    if (!g || g.state !== 'post' || g.away.score === '' || g.home.score === '') return;
    const winner = +g.away.score > +g.home.score ? g.away : g.home;
    p.result = winner.id === p.team ? 'W' : 'L';
    p.final = `${g.away.abbr} ${g.away.score}, ${g.home.abbr} ${g.home.score}`;
    dirty = true;
  });
  if (dirty) save();
}
const pickRecord = () => { const all = Object.values(G.picks); return { w: all.filter(p => p.result === 'W').length, l: all.filter(p => p.result === 'L').length, open: all.filter(p => !p.result).length }; };
function pickStatus() { const r = pickRecord(); return r.w + r.l ? `Record ${r.w}-${r.l}${r.open ? ` · ${r.open} open` : ''}` : r.open ? `${r.open} picks waiting on results` : 'No picks yet'; }
function pickView() {
  const tmIso = NBA.shiftIso(NBA.today, 1);
  // Labelled by date: just after midnight ESPN's "today" is still last night's games
  const label = iso => esc(NBA.fmtDay(iso, { weekday: 'long', month: 'short', day: 'numeric' }));
  const slates = [
    { label: label(NBA.today), param: NBA.paramOf(NBA.today), day: NBA.use('day:') },
    { label: label(tmIso), param: NBA.paramOf(tmIso), day: NBA.use('day:' + NBA.paramOf(tmIso)) },
  ];
  const rec = pickRecord();
  const end = `<span class="gm-score">Record <b>${rec.w}-${rec.l}</b>${rec.w + rec.l ? ` · ${pct(rec.w, rec.w + rec.l)}` : ''}</span>`;
  const gameRow = (g, param) => {
    const p = G.picks[g.id], locked = started(g);
    const btn = t => {
      const on = p && p.team === t.id;
      const mark = on && p.result ? `<span class="pk-res ${p.result === 'W' ? 'w' : 'lo'}">${p.result === 'W' ? '✓' : '✗'}</span>` : '';
      return `<button class="pk-team${on ? ' on' : ''}" data-act="pick" data-g="${g.id}" data-t="${t.id}" data-p="${param}"${locked ? ' disabled' : ''} aria-pressed="${!!on}">${UI.logo(t, 32)}<span><b>${esc(t.name)}</b><small>${esc(t.record || '')}</small></span>${mark}</button>`;
    };
    const mid = g.state === 'post' ? `<b>Final</b><small>${NBA.S.spoilers ? '' : `${esc(g.away.score)}-${esc(g.home.score)}`}</small>`
      : g.state === 'in' ? `<b class="live">Live</b><small>${esc(g.detail)}</small>`
      : locked ? '<b>Locked</b>' : `<b>${esc(UI.tipTime(g))}</b>${g.odds && g.odds.details ? `<small>${esc(g.odds.details)}</small>` : ''}`;
    return `<div class="pk-game${UI.isMine(g) ? ' mine' : ''}">${btn(g.away)}<div class="pk-mid">${mid}</div>${btn(g.home)}</div>`;
  };
  // A slate you can still pick from goes first; one that is all locked drops below it
  const hasOpen = s => !!(s.day && s.day.games.some(g => !started(g)));
  slates.sort((a, b) => hasOpen(b) - hasOpen(a));
  const sections = slates.map(s => {
    if (!s.day) return `<div class="pk-slate"><h4>${s.label}</h4><p class="loading">Loading games…</p></div>`;
    if (!s.day.games.length) return `<div class="pk-slate"><h4>${s.label}</h4><p class="empty">No games.</p></div>`;
    const open = s.day.games.filter(g => !started(g)).length;
    return `<div class="pk-slate"><h4>${s.label} <span class="mut">${open ? `${open} open to pick` : 'all locked'}</span></h4><div class="pk-grid">${NBA.sortGames(s.day.games).map(g => gameRow(g, s.param)).join('')}</div></div>`;
  }).join('');
  const past = Object.values(G.picks).filter(p => p.result).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
  const history = past.length ? `<div class="pk-hist"><h4>Recent results</h4><ul>${past.map(p => `<li><span class="pk-res ${p.result === 'W' ? 'w' : 'lo'}">${p.result === 'W' ? '✓' : '✗'}</span><span>Picked <b>${esc(p.pickAbbr)}</b> · ${esc(p.final)}</span><small>${esc(NBA.fmtDate(p.date, { month: 'short', day: 'numeric' }))}</small></li>`).join('')}</ul></div>` : '';
  return card("Pick'em", end, `<p class="gm-how">Tap the team you think wins. Home teams are on the right. Picks lock at tip-off, and your record updates when games go final. The line shown is DraftKings' spread.</p>${sections}${history}`);
}
NBA.actions.pick = a => {
  const { g: gid, t, p: param } = a.dataset;
  const day = NBA.data(dayKey(param)), g = day && day.games.find(x => x.id === gid);
  if (!g || started(g)) return;
  if (G.picks[gid] && G.picks[gid].team === t) delete G.picks[gid];
  else G.picks[gid] = { team: t, pickAbbr: (t === g.away.id ? g.away : g.home).abbr, param, date: g.date };
  save();
  NBA.changed();
};

/* ================= Breakout Calls ================= */
// Lines sit on the half point so there are no pushes; a breakout line is about 35% above the season average
const PROP_STATS = ['pts', 'reb', 'ast', 'tpm'];
const lineOf = avg => Math.floor(avg) + .5;
const breakoutOf = avg => Math.max(lineOf(avg) + 2, Math.floor(avg * 1.35) + .5);
function resolveProps() {
  let dirty = false;
  G.props.forEach(pr => {
    if (pr.result) return;
    const log = NBA.use('gamelog:' + pr.pid);
    if (!log) return;
    // The first finished game that tipped off after the call was made
    const game = log.filter(g => g.result && new Date(g.date).getTime() > pr.made).pop();
    if (!game) return;
    const actual = pr.stat === 'tpm' ? parseInt(game.tp, 10) : +game[pr.stat];
    if (!Number.isFinite(actual)) return;
    const over = actual > pr.line;
    pr.result = (pr.side === 'under' ? !over : over) ? 'W' : 'L';
    pr.actual = actual;
    pr.gameDate = game.date;
    pr.opp = (game.home ? 'vs ' : '@ ') + (game.oppAbbr || '');
    dirty = true;
  });
  if (dirty) save();
}
const propPoints = pr => pr.result === 'W' ? (pr.tier === 'breakout' ? 3 : 1) : 0;
function propStatus() {
  const done = G.props.filter(p => p.result), w = done.filter(p => p.result === 'W').length, open = G.props.length - done.length;
  return done.length ? `${done.reduce((n, p) => n + propPoints(p), 0)} points · ${w}-${done.length - w}${open ? ` · ${open} open` : ''}` : open ? `${open} calls waiting on games` : 'No calls yet';
}
// Who plays next: teams with a game today that hasn't started, otherwise tomorrow's teams
function nextGames() {
  const tmIso = NBA.shiftIso(NBA.today, 1);
  const map = new Map();
  [NBA.data('day:'), NBA.use('day:' + NBA.paramOf(tmIso))].forEach(d => (d ? d.games : []).filter(g => !started(g)).forEach(g => {
    [[g.away, g.home, '@'], [g.home, g.away, 'vs']].forEach(([t, o, at]) => { if (!map.has(t.id)) map.set(t.id, { g, opp: o, at }); });
  }));
  return map;
}
function propView() {
  const next = nextGames();
  const done = G.props.filter(p => p.result), open = G.props.filter(p => !p.result);
  const pts = done.reduce((n, p) => n + propPoints(p), 0), w = done.filter(p => p.result === 'W').length;
  const end = `<span class="gm-score"><b>${pts}</b> points · ${w}-${done.length - w}</span>`;
  const young = !!st.ppYoung;
  const cands = known(220).filter(p => next.has(p.teamId) && (!young || (p.age && p.age <= 23))).sort((a, b) => young ? b.pts - a.pts : b.min - a.min).slice(0, 10);
  const sel = st.ppSel && byId(st.ppSel);
  const nextLine = p => { const n = next.get(p.teamId); return n ? `${n.at} ${esc(n.opp.abbr)} · ${esc(NBA.fmtDate(n.g.date, { weekday: 'short' }))} ${esc(NBA.fmtTime(n.g.date))}` : 'Next game not on the schedule yet'; };
  const builder = sel ? `<div class="pp-sel">${UI.hs(sel.headshot)}<div><div class="nm">${esc(sel.name)}</div><div class="mut">${who(sel)} · Next: ${nextLine(sel)}</div></div><button class="btn" data-act="ppsel" data-id="">Change</button></div>
      <div class="pp-lines">${PROP_STATS.filter(k => sel[k] >= .5).map(k => {
        const avg = sel[k], line = lineOf(avg), bo = breakoutOf(avg), s = STAT[k];
        const b = (side, tier, ln, label) => `<button class="btn pp-btn${tier === 'breakout' ? ' bo' : ''}" data-act="ppcall" data-k="${k}" data-side="${side}" data-tier="${tier}" data-line="${ln}">${label}</button>`;
        return `<div class="pp-line"><div class="pp-k"><b>${s.label}</b><small>Season ${NBA.fix(avg)}</small></div>${b('over', 'line', line, `Over ${line}`)}${b('under', 'line', line, `Under ${line}`)}${b('over', 'breakout', bo, `Breakout ${bo}+ <small>3 pts</small>`)}</div>`;
      }).join('')}</div>`
    : `<div class="gm-find"><label class="sr" for="pp-q">Find a player</label><input class="field big" id="pp-q" data-in="ppq" type="search" autocomplete="off" spellcheck="false" placeholder="Search any player" value="${esc(st.ppQ || '')}">${suggestions(st.ppQ, 'ppsel')}</div>
      <div class="pp-cands"><div class="pp-ch"><span class="eyebrow">Playing next</span><div class="seg sm" role="group" aria-label="Show"><button data-act="ppyoung" data-v="" aria-pressed="${!young}">Top players</button><button data-act="ppyoung" data-v="1" aria-pressed="${young}">Young guns, 23 and under</button></div></div>
        ${cands.length ? `<div class="pp-cgrid">${cands.map(p => `<button class="pp-cand" data-act="ppsel" data-id="${p.id}">${UI.hs(p.headshot)}<span><b>${esc(p.name)}</b><small>${esc(p.team)} · ${NBA.fix(p.pts)} / ${NBA.fix(p.reb)} / ${NBA.fix(p.ast)}${p.age ? ` · age ${p.age}` : ''}</small></span></button>`).join('')}</div>` : '<p class="empty">No upcoming games found. Search for any player above.</p>'}</div>`;
  const callTxt = p => `${p.tier === 'breakout' ? 'Breakout' : p.side === 'over' ? 'Over' : 'Under'} ${p.line}${p.tier === 'breakout' ? '+' : ''} ${STAT[p.stat].unit}`;
  const openList = open.length ? `<ul class="pp-list">${open.map(p => `<li><span class="pp-st wait">•</span><span><b>${esc(p.name)}</b> ${callTxt(p)}<small>Waiting for their next game</small></span><button class="pp-x" data-act="ppcancel" data-id="${p.id}" aria-label="Cancel this call">×</button></li>`).join('')}</ul>` : '<p class="empty">No open calls. Pick a player to make one.</p>';
  const doneList = done.length ? `<h4>Graded</h4><ul class="pp-list">${done.slice().sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate)).slice(0, 15).map(p => `<li><span class="pp-st ${p.result === 'W' ? 'w' : 'lo'}">${p.result === 'W' ? '✓' : '✗'}</span><span><b>${esc(p.name)}</b> ${callTxt(p)}<small>Had ${p.actual} ${p.opp} on ${esc(NBA.fmtDate(p.gameDate, { month: 'short', day: 'numeric' }))}${p.result === 'W' ? ` · +${propPoints(p)}` : ''}</small></span></li>`).join('')}</ul>` : '';
  return card('Breakout Calls', end, `<p class="gm-how">Pick a player, then call over or under on their next game, or go for a breakout night for 3 points. Lines come from their season averages. Each call is graded on the first game they play after you make it.</p>
    <div class="pp"><div class="pp-build">${builder}</div><div class="pp-mine"><h4>Your calls</h4>${openList}${doneList}</div></div>`);
}
NBA.changes.ppq = t => { st.ppQ = t.value; NBA.render(); };
NBA.actions.ppsel = a => { st.ppSel = a.dataset.id || null; st.ppQ = ''; NBA.changed(); };
NBA.actions.ppyoung = a => { st.ppYoung = !!a.dataset.v; NBA.changed(); };
NBA.actions.ppcall = a => {
  const p = byId(st.ppSel);
  if (!p) return;
  const { k, side, tier } = a.dataset, line = +a.dataset.line;
  if (G.props.some(x => !x.result && x.pid === p.id && x.stat === k && x.side === side && x.tier === tier)) return;
  if (G.props.filter(x => !x.result).length >= 15) return;
  G.props.push({ id: Date.now().toString(36) + rnd(1e4), pid: p.id, name: p.name, stat: k, side, tier, line, made: Date.now() });
  save();
  st.ppSel = null;
  NBA.changed();
};
NBA.actions.ppcancel = a => { G.props = G.props.filter(x => x.id !== a.dataset.id || x.result); save(); NBA.changed(); };
})();
