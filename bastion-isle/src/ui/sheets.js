// Sheets over the scene (they do not pause): Budget (B), Research (T) and the Harbour Log history (L).
import { G } from '../state.js';
import { RESEARCH, MILESTONES, MONEY, ZONES } from '../defs.js';
import { icon } from './icons.js';
import { $, $$, esc, setText, setHTML, setClass, fmtMoney, fmtSignedMoney, fmtInt, errOf, terms } from './util.js';
import { S } from './bridge.js';
import { UI, sound, say } from './ustate.js';
import { historyHTML } from './log.js';
import { refreshDock } from './hud.js';

export function openSheet(name) {
  if (UI.sheet === name) { closeSheet(); return; }
  UI.sheet = name;
  UI.taxBase = null;
  UI.hideTip && UI.hideTip();
  const sh = $('#sheet');
  sh.className = 'sheet-' + name;
  sh.innerHTML = name === 'budget' ? budgetHTML() : name === 'research' ? researchHTML() : name === 'log' ? logHTML() : '';
  wire(sh, name);
  updateSheet(true);
  refreshDock();
  sound('open');
}
export function closeSheet() {
  if (!UI.sheet) return;
  UI.sheet = null;
  const sh = $('#sheet');
  sh.className = 'hidden';
  sh.innerHTML = '';
  refreshDock();
}

function wire(sh, name) {
  for (const b of $$('[data-act="close"]', sh)) b.addEventListener('click', closeSheet);
  if (name === 'budget') {
    for (const r of $$('input[data-tax]', sh)) {
      r.addEventListener('input', () => { S.setTax(r.dataset.tax, +r.value); if (G.taxes) G.taxes[r.dataset.tax] = +r.value; updateSheet(true); });
    }
    for (const b of $$('[data-expand]', sh)) b.addEventListener('click', () => { b.closest('li').classList.toggle('open'); sound('click'); });
  }
  if (name === 'research') {
    sh.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (!b || b.disabled) return;
      const err = errOf(S.buyResearch(b.dataset.r));
      if (err) { say(err, 'bad'); sound('error'); } else { sound('upgrade'); }
      sh.querySelector('.rs-grid').innerHTML = researchCards();
      updateSheet(true);
    });
  }
}

// ------------------------------------------------------------------ budget

const EXP_LABEL = { roads: 'Roads', power: 'Power', water: 'Water', fire: 'Fire', police: 'Police', health: 'Health', education: 'Education', parks: 'Parks', military: 'Military', repairs: 'Repairs', services: 'Services', utilities: 'Utilities' };
const EXP_ICON = { roads: 'road', power: 'bolt', water: 'droplet', fire: 'flame', police: 'shield-check', health: 'first-aid-kit', education: 'school', parks: 'trees', military: 'shield-half', repairs: 'tools' };
const INC_ICON = { R: 'home', C: 'building-store', I: 'building-factory-2', spoils: 'medal' };

function budgetData() {
  const b = S.budgetBreakdown ? S.budgetBreakdown() : null;
  let income, expense;
  if (b) {
    income = (b.income || []).map((t) => ({ key: t.key || t.label, label: t.label || EXP_LABEL[t.key] || t.key, value: +t.value || 0 }));
    expense = (b.expense || []).map((t) => ({ key: t.key || t.label, label: t.label || EXP_LABEL[t.key] || t.key, value: Math.abs(+t.value || 0), items: t.items ? terms(t.items) : null }));
  } else {
    const inc = (G.budget && G.budget.income) || {}, exp = (G.budget && G.budget.expense) || {};
    income = [['R', 'Residential'], ['C', 'Commercial'], ['I', 'Industrial'], ['spoils', 'War spoils']].map(([k, l]) => ({ key: k, label: l, value: inc[k] || 0 }));
    expense = Object.keys(EXP_LABEL).filter((k) => exp[k] != null).map((k) => ({ key: k, label: EXP_LABEL[k], value: Math.abs(exp[k]) }));
  }
  const mil = expense.find((e) => e.key === 'military');
  if (mil && !mil.items) {
    const by = {};
    for (const x of G.buildings) {
      if (!x.def || x.def.kind !== 'military') continue;
      const u = x.upkeep != null ? x.upkeep : (x.def.upkeep || 0) * (1 + 0.5 * ((x.level || 1) - 1));
      const k = x.def.name;
      by[k] = by[k] || { label: k, value: 0, n: 0 };
      by[k].value += u; by[k].n++;
    }
    mil.items = Object.values(by).sort((a, c) => c.value - a.value).map((t) => ({ label: `${t.label} ×${t.n}`, value: t.value }));
  }
  const inc = income.reduce((a, t) => a + t.value, 0), exp = expense.reduce((a, t) => a + t.value, 0);
  return { income, expense, inc, exp, net: b && b.net != null ? b.net : G.netPerMin != null ? G.netPerMin : inc - exp };
}

function budgetHTML() {
  const d = budgetData();
  const taxRow = (k) => {
    const Z = ZONES[{ R: 1, C: 2, I: 3 }[k]];
    const t = (G.taxes && G.taxes[k]) ?? 10;
    return `<div class="bg-tax" data-tip="tax-${k}"><div class="bg-tl">${icon(INC_ICON[k])}<b>${Z.name}</b><span class="tnum" data-k="tv${k}">${t}%</span></div>
      <input type="range" min="0" max="25" step="1" value="${t}" data-tax="${k}" style="--zc: ${Z.color}">
      <div class="bg-proj tnum"><span data-k="tp${k}"></span><span data-k="td${k}"></span></div></div>`;
  };
  return `<div class="sheet panel">
    <header class="sh-head">${icon('report-money')}<h2>Budget</h2><span class="sh-sub">per game minute</span><button class="ib ch" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="bg-grid">
      <section class="bg-col"><h4>Income</h4><ul class="bg-list" data-k="inc">${d.income.map((t) => `<li><i>${icon(INC_ICON[t.key] || 'coins')}</i><span>${esc(t.label)}</span><b class="tnum pos" data-v="${esc(t.key)}"></b></li>`).join('')}</ul>
        <div class="bg-total"><span>Total income</span><b class="tnum pos" data-k="inct"></b></div></section>
      <section class="bg-col"><h4>Expenses</h4><ul class="bg-list" data-k="exp">${d.expense.map((t) => `<li class="${t.items && t.items.length ? 'has' : ''}"><i>${icon(EXP_ICON[t.key] || 'coins')}</i><span>${esc(t.label)}${t.items && t.items.length ? `<button class="bg-x" data-expand="1">${icon('chevron-down')}</button>` : ''}</span><b class="tnum neg" data-v="${esc(t.key)}"></b>
          ${t.items && t.items.length ? `<ul class="bg-sub">${t.items.map((s) => `<li><span>${esc(s.label)}</span><b class="tnum">${fmtMoney(s.value)}</b></li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>
        <div class="bg-total"><span>Total expenses</span><b class="tnum neg" data-k="expt"></b></div></section>
      <section class="bg-col taxes"><h4>Tax rates</h4>${['R', 'C', 'I'].map(taxRow).join('')}<div class="bg-tnote">Each point above 10% costs 4 demand. Revenue usually peaks around 15–18%.</div></section>
    </div>
    <footer class="bg-foot">
      <div class="bg-net"><span>Net</span><b class="tnum" data-k="net"></b><small data-k="proj"></small></div>
      <div class="bg-spark"><div class="bg-sl"><span>Treasury, last 10 min</span><b class="tnum" data-k="money"></b></div><svg viewBox="0 0 300 60" preserveAspectRatio="none" data-k="spark"></svg></div>
    </footer>
  </div>`;
}

function sparkSVG(hist) {
  const pts = [...hist.slice(-10), G.money];
  if (pts.length < 2) pts.unshift(G.money);
  let lo = Math.min(...pts, 0), hi = Math.max(...pts, 1);
  if (hi - lo < 1) hi = lo + 1;
  const X = (k) => (k / (pts.length - 1)) * 296 + 2, Y = (v) => 56 - ((v - lo) / (hi - lo)) * 52;
  const line = pts.map((v, k) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const zero = lo < 0 ? `<line x1="0" x2="300" y1="${Y(0)}" y2="${Y(0)}" class="zero"/>` : '';
  const last = pts[pts.length - 1];
  return `${zero}<polygon points="2,58 ${line} 298,58" class="area"/><polyline points="${line}" class="line ${last < 0 ? 'neg' : ''}"/><circle cx="${X(pts.length - 1)}" cy="${Y(last)}" r="3" class="dot"/>`;
}

function updateBudget(sh) {
  const d = budgetData();
  for (const t of d.income) setText(sh.querySelector(`[data-k="inc"] [data-v="${t.key}"]`), fmtSignedMoney(t.value));
  for (const t of d.expense) setText(sh.querySelector(`[data-k="exp"] [data-v="${t.key}"]`), `−${fmtMoney(t.value).slice(1)}`);
  setText(sh.querySelector('[data-k="inct"]'), `${fmtSignedMoney(d.inc)}/min`);
  setText(sh.querySelector('[data-k="expt"]'), `−${fmtMoney(d.exp).slice(1)}/min`);
  const net = sh.querySelector('[data-k="net"]');
  setText(net, `${fmtSignedMoney(d.net)}/min`);
  setClass(net, 'pos', d.net >= 0); setClass(net, 'neg', d.net < 0);
  let proj = '';
  if (d.net < 0) {
    const mins = (G.money - MONEY.overdraft) / -d.net;
    proj = mins > 0 ? `Overdraft limit in ${mins >= 60 ? Math.round(mins / 60) + ' h' : Math.max(1, Math.round(mins)) + ' min'} at this rate` : 'Past the overdraft limit';
  } else proj = 'The treasury is growing';
  setText(sh.querySelector('[data-k="proj"]'), proj);
  setClass(sh.querySelector('[data-k="proj"]'), 'bad', d.net < 0);
  setText(sh.querySelector('[data-k="money"]'), fmtMoney(G.money));
  setHTML(sh.querySelector('[data-k="spark"]'), sparkSVG(G.moneyHist || []));
  for (const k of ['R', 'C', 'I']) {
    const t = (G.taxes && G.taxes[k]) ?? 10;
    setText(sh.querySelector(`[data-k="tv${k}"]`), `${t}%`);
    const cur = d.income.find((x) => x.key === k);
    const base = UI.taxBase || (UI.taxBase = {});
    // projection: income scales with the rate from what it was when the sheet opened (before the demand response)
    if (base[k] == null) base[k] = { t, v: cur ? cur.value : 0 };
    const b0 = base[k];
    const projected = b0.t > 0 ? (b0.v * t) / b0.t : 0;
    setText(sh.querySelector(`[data-k="tp${k}"]`), `≈ ${fmtSignedMoney(projected)}/min`);
    const dem = 4 * (10 - t);
    const de = sh.querySelector(`[data-k="td${k}"]`);
    setText(de, dem === 0 ? 'demand ±0' : `${dem > 0 ? '+' : '−'}${Math.abs(dem)} demand`);
    setClass(de, 'neg', dem < 0); setClass(de, 'pos', dem > 0);
  }
}

// ------------------------------------------------------------------ research

const RES_ICON = { ballistics: 'target', optics: 'eye', loaders: 'refresh', concrete: 'building-skyscraper', fuzes: 'bomb', jets: 'plane-inflight', drills: 'helmet', firebrigade: 'fire-extinguisher', sirens: 'bell-ringing', civic: 'building-bank' };
function hasCollege() { return G.buildings.some((b) => b.type === 'college' && b.connected !== false); }

function researchCards() {
  const col = hasCollege();
  return RESEARCH.map((r) => {
    const l = (G.research && G.research[r.id]) || 0;
    const maxed = l >= r.max;
    const lockedM = r.needMilestone && (G.milestone || 0) < r.needMilestone;
    const cost = maxed ? 0 : r.cost(l);
    const poor = !maxed && cost > G.money;
    return `<div class="rs-card ch ${maxed ? 'done' : ''} ${lockedM ? 'locked' : ''}">
      <div class="rs-top"><i>${icon(RES_ICON[r.id] || 'flask-2')}</i><b>${esc(r.name)}</b><span class="pips">${Array.from({ length: r.max }, (_, k) => `<i class="${k < l ? 'on' : ''}"></i>`).join('')}</span></div>
      <p>${esc(r.desc)}</p>
      ${lockedM ? `<div class="rs-req">${icon('lock')}Needs ${MILESTONES[r.needMilestone].name}</div>` : ''}
      ${maxed ? `<div class="rs-done">${icon('circle-check')}Complete</div>` : `<button class="btn ch up ${poor ? 'poor' : ''}" data-r="${r.id}" ${!col || lockedM ? 'disabled' : ''}><span>${l ? `Level ${l + 1}` : 'Research'}</span><b class="tnum">${fmtMoney(cost)}</b></button>`}
    </div>`;
  }).join('');
}

function researchHTML() {
  return `<div class="sheet panel">
    <header class="sh-head def">${icon('flask-2')}<h2>Research</h2><span class="sh-sub">War College · instant · paid in $</span><span class="sh-money tnum" data-k="rmoney"></span><button class="ib ch" data-act="close" aria-label="Close">${icon('x')}</button></header>
    ${hasCollege() ? '' : `<div class="sh-banner warn">${icon('alert-triangle')}<span>Build a War College (Services, unlocks at Town) and link it by road to start research.</span></div>`}
    <div class="rs-grid">${researchCards()}</div>
  </div>`;
}

// ------------------------------------------------------------------ log history

function logHTML() {
  return `<div class="sheet panel">
    <header class="sh-head">${icon('list-details')}<h2>Harbour Log</h2><span class="sh-sub">last 50 dispatches</span><button class="ib ch" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="lg-hist" data-k="hist">${historyHTML()}</div>
  </div>`;
}

export function updateSheet() {
  const sh = $('#sheet');
  if (!UI.sheet) return;
  if (UI.sheet === 'budget') updateBudget(sh);
  if (UI.sheet === 'research') setText(sh.querySelector('[data-k="rmoney"]'), fmtMoney(G.money));
  if (UI.sheet === 'log') setHTML(sh.querySelector('[data-k="hist"]'), historyHTML());
}

