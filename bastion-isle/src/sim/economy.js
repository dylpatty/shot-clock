// Money, taxes, upkeep, workers and staffing, R/C/I demand, the budget sheet and bankruptcy.
// Systems review concrete_specs 1, 3, 4, 9, 21. Plain JS: runs in Node for the balance harness.
//
// Cadence: one pass per game second (tickEconomy accumulates dt). Income and upkeep are applied every second as
// rate / 60. Bounties and wave rewards ("war spoils") and repairs are booked when they happen and shown in the
// budget as 3-minute averages.
import { W, LF } from '../world.js';
import { G } from '../state.js';
import { ZONES, BUILDINGS, MONEY, DIFFICULTY, GROWTH, ROADS } from '../defs.js';
import { lotOccupants, lotLevelNow, lotPlanned, DEZONED } from './zones.js';
import { tickHints } from './hints.js';

// Government jobs per player-built structure. Towers use their `crew` from defs; the rest are not in defs yet
// (requested in tests/sim/REQUESTS.md), so they live here. The Town Hall's 5 jobs come from defs.hq.jobs.
export const GOV_JOBS = {
  park: 0, plaza: 1, fire: 8, police: 8, clinic: 6, school: 6, college: 8,
  wind: 1, gas: 8, watertower: 1, pump: 3,
};
export function jobsOf(b) {
  const d = b.def;
  if (d.jobs != null) return d.jobs;
  if (d.crew != null) return d.crew;
  const j = GOV_JOBS[b.type] || 0;
  return b.type === 'clinic' && b.level >= 2 ? j * 2 : j;
}
export function residentsOf(b) {
  return b.type === 'hq' ? (b.def.residents || 10) + 5 * (b.level - 1) : 0;
}

// Upkeep per game minute: towers scale x(1 + 0.5 (level - 1)), the clinic becomes a hospital with its own upkeep
export function upkeepOf(b) {
  const d = b.def;
  if (b.type === 'clinic' && b.level >= 2) return d.upgradeUpkeep || d.upkeep;
  const base = d.upkeep || 0;
  return d.kind === 'military' ? base * (1 + 0.5 * (b.level - 1)) : base;
}

// Budget line for a structure's upkeep
const LINE_OF = {
  wind: 'power', gas: 'power', watertower: 'water', pump: 'water', fire: 'fire', police: 'police',
  clinic: 'health', school: 'education', park: 'parks', plaza: 'parks', college: 'military',
};
export const lineOf = (b) => (b.def.kind === 'military' ? 'military' : LINE_OF[b.type] || 'other');

const INCOME_LINES = [['R', 'Residential'], ['C', 'Commercial'], ['I', 'Industrial'], ['spoils', 'War spoils']];
const EXPENSE_LINES = [
  ['roads', 'Roads'], ['power', 'Power'], ['water', 'Water'], ['fire', 'Fire'], ['police', 'Police'],
  ['health', 'Health'], ['education', 'Education'], ['parks', 'Parks'], ['military', 'Military'], ['repairs', 'Repairs'],
];

// ------------------------------------------------------------------ money

// Nothing can be bought while the treasury is negative, and a purchase may not take it below $0.
export function canAfford(cost) { return G.money >= 0 && G.money >= cost - 1e-6; }
export function moneyProblem(cost) {
  if (G.money < 0) return 'The treasury is overdrawn: nothing can be built until it is back above $0';
  if (G.money < cost - 1e-6) return `Not enough money ($${Math.ceil(cost - G.money).toLocaleString('en-US')} short)`;
  return null;
}
export function spend(amount) { G.money -= amount; }
export function earn(amount) { G.money += amount; }

// Bounties, wave-clear rewards and call-early bonuses. Booked into the War spoils budget line.
export function addSpoils(amount, kind = 'bounty') {
  if (!(amount > 0)) return;
  G.money += amount;
  G.spoilsLog.push(G.time, amount);
  const cur = G.wave && G.wave.cur;
  if (cur) { if (kind === 'bounty') cur.bounty += amount; else cur.rewards += amount; }
}

// Repairs of player-built structures are paid as they heal
const repairLog = [];
export function chargeRepair(amount) {
  if (!(amount > 0)) return;
  G.money -= amount;
  repairLog.push(G.time, amount);
  const cur = G.wave && G.wave.cur;
  if (cur) cur.repairs += amount;
}

// Sum of a flat [t, $, t, $, ...] log over the last `win` seconds; drops older entries
function windowSum(log, win) {
  const t0 = G.time - win;
  let k = 0;
  while (k < log.length && log[k] < t0) k += 2;
  if (k) log.splice(0, k);
  let s = 0;
  for (let j = 1; j < log.length; j += 2) s += log[j];
  return s;
}

export function setTax(zone, pct) {
  if (!(zone in G.taxes)) return 'Unknown zone';
  G.taxes[zone] = Math.max(0, Math.min(25, Math.round(Number(pct) || 0)));
  return null;
}

// ------------------------------------------------------------------ the per-second pass

const ECON = {
  acc: 0.999,      // first pass on the first step of a game (economy is phase 0 of the stagger)
  resTax: 0, jobsCtax: 0, jobsItax: 0, // occupants x level multiplier, after sheltering
  shelterLost: 0,  // $/min lost to sheltering right now
  roads: 0,        // road tile count
  negNetT: 0,      // seconds the net income has been below zero (advisor hint)
  histT: 0,
  zoneLots: [0, 0, 0, 0], zoneBuilt: [0, 0, 0, 0], zoneFree: [0, 0, 0, 0],
};
export const ECON_STATE = ECON;
// Standing (or under construction) zoned lots, rebuilt every second. Combat samples targets from it.
export const LOTLIST = [];

export function resetEconomy(difficulty) {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.standard;
  G.money = d.money;
  G.moneyHist = [];
  G.taxes = { R: 10, C: 10, I: 10 };
  G.budget = { income: { R: 0, C: 0, I: 0, spoils: 0 }, expense: {}, military: {} };
  for (const [k] of EXPENSE_LINES) G.budget.expense[k] = 0;
  G.netPerMin = 0;
  G.overdraftT = 0; G.negT = 0; G.bankruptIn = null; G.bankrupt = false;
  G.spoilsLog = [];
  repairLog.length = 0;
  G.pop = 0; G.workers = 0;
  G.jobs = { gov: 0, C: 0, I: 0 };
  G.staffing = 1; G.govStaffing = 1; G.unemployment = 0;
  G.demand = { R: 0, C: 0, I: 0 };
  G.demandTarget = { R: 0, C: 0, I: 0 };
  G.demandTerms = { R: [], C: [], I: [] };
  G.panic = 0; G.panicLog = [];
  G.blockade = false;
  G.lotCounts = { R: 0, C: 0, I: 0, free: { R: 0, C: 0, I: 0 } };
  G.planned = { R: 0, C: 0, I: 0 };
  ECON.acc = 0.999; ECON.negNetT = 0; ECON.histT = 0; ECON.shelterLost = 0;
  LOTLIST.length = 0;
}

export function tickEconomy(dt) {
  if (G.mode !== 'play') return;
  ECON.acc += dt;
  if (ECON.acc < 1) return;
  ECON.acc -= 1;
  econStep(1);
}

// Panic: 10 per zoned lot destroyed in the last 120 s, fading linearly, capped at 40
export function recordLotLoss() { G.panicLog.push(G.time); }
function panicNow() {
  const log = G.panicLog;
  while (log.length && G.time - log[0] > 120) log.shift();
  let p = 0;
  for (const t of log) p += 10 * Math.max(0, 1 - (G.time - t) / 120);
  return Math.min(40, p);
}

function econStep(dt) {
  // ---- people and jobs from the lots
  let res = 0, resTax = 0, jobsC = 0, jobsCtax = 0, jobsI = 0, jobsItax = 0, resShelter = 0, jobsCShelter = 0, jobsIShelter = 0;
  let planR = 0, planC = 0, planI = 0;
  const lots = ECON.zoneLots, built = ECON.zoneBuilt, free = ECON.zoneFree;
  lots.fill(0); built.fill(0); free.fill(0);
  LOTLIST.length = 0;
  const shelterPay = 1 - (G.mod.shelterLoss != null ? G.mod.shelterLoss : 1); // sirens: pay half while sheltering
  const land = W.land;
  for (let k = 0; k < land.length; k++) {
    const i = land[k];
    const z = W.zone[i];
    if (!z) continue;
    lots[z]++;
    const fl = W.flags[i];
    if (fl & LF.RUBBLE) continue;
    if (!W.lvl[i]) { if (!(fl & DEZONED)) free[z]++; continue; }
    LOTLIST.push(i);
    built[z]++;
    const pl = lotPlanned(i);
    if (z === 1) planR += pl; else if (z === 2) planC += pl; else planI += pl;
    const n = lotOccupants(i);
    if (n <= 0) continue;
    const mul = ZONES[z].levelMul[lotLevelNow(i) - 1];
    const sh = fl & LF.SHELTER;
    const pay = sh ? shelterPay : 1;
    if (z === 1) { res += n; resTax += n * mul * pay; if (sh) resShelter += n * mul; }
    else if (z === 2) { jobsC += n; jobsCtax += n * mul * pay; if (sh) jobsCShelter += n * mul; }
    else { jobsI += n; jobsItax += n * mul * pay; if (sh) jobsIShelter += n * mul; }
  }

  // ---- player-built structures: residents and government jobs (connected only), upkeep by line (all)
  const exp = G.budget.expense, mil = G.budget.military;
  for (const k in exp) exp[k] = 0;
  for (const k in mil) mil[k] = 0;
  let gov = 0;
  for (const b of G.buildings) {
    if (!b.alive) continue;
    if (b.connected) { gov += jobsOf(b); const r = residentsOf(b); res += r; resTax += r; planR += r; }
    const u = b.upkeep;
    if (u) {
      const line = lineOf(b);
      exp[line] = (exp[line] || 0) + u;
      if (line === 'military') mil[b.type] = (mil[b.type] || 0) + u;
    }
  }
  let roads = 0;
  for (let k = 0; k < land.length; k++) if (W.road[land[k]]) roads++;
  ECON.roads = roads;
  exp.roads = roads * ROADS.upkeepPerTile;

  G.pop = res;
  G.workers = 0.5 * res;
  G.jobs.gov = gov; G.jobs.C = jobsC; G.jobs.I = jobsI;
  const Wk = G.workers, J = gov + jobsC + jobsI;
  G.govStaffing = gov > 0 ? Math.min(1, Wk / gov) : 1;
  const f = jobsC + jobsI > 0 ? Math.max(0, Math.min(1, (Wk - gov) / (jobsC + jobsI))) : 1;
  setUnderstaffed(G.staffing >= 0.7, f >= 0.7);
  G.staffing = f;
  G.unemployment = Wk > 0 ? Math.max(0, Wk - J) / Wk : 0;
  G.lotCounts.R = built[1]; G.lotCounts.C = built[2]; G.lotCounts.I = built[3];
  G.lotCounts.free.R = free[1]; G.lotCounts.free.C = free[2]; G.lotCounts.free.I = free[3];
  G.planned = { R: planR, C: planC, I: planI };

  // ---- demand (targets, then an exponential moving average with tau = 8 s)
  G.panic = panicNow();
  computeDemandTargets();
  const a = 1 - Math.exp(-dt / GROWTH.demandTau);
  for (const k of ['R', 'C', 'I']) G.demand[k] += (G.demandTarget[k] - G.demand[k]) * a;

  // ---- taxes ($ per minute)
  const t = G.taxes, mod = G.mod.tax || 1, blk = G.blockade ? 0.75 : 1;
  const inc = G.budget.income;
  inc.R = ZONES[1].taxPerHead * t.R * resTax * mod;
  inc.C = ZONES[2].taxPerHead * t.C * jobsCtax * f * blk * mod;
  inc.I = ZONES[3].taxPerHead * t.I * jobsItax * f * mod;
  ECON.resTax = resTax; ECON.jobsCtax = jobsCtax; ECON.jobsItax = jobsItax;
  ECON.shelterLost = (ZONES[1].taxPerHead * t.R * resShelter + (ZONES[2].taxPerHead * t.C * jobsCShelter * blk + ZONES[3].taxPerHead * t.I * jobsIShelter) * f) * mod * (1 - shelterPay);
  if (G.wave && G.wave.cur && G.wave.state === 'active') G.wave.cur.shelterLost += ECON.shelterLost / 60 * dt;
  inc.spoils = windowSum(G.spoilsLog, 180) / 3;
  exp.repairs = windowSum(repairLog, 180) / 3;

  let incomeNow = inc.R + inc.C + inc.I, expenseNow = 0;
  for (const k in exp) if (k !== 'repairs') expenseNow += exp[k];
  G.money += ((incomeNow - expenseNow) / 60) * dt;
  G.netPerMin = incomeNow + inc.spoils - expenseNow - exp.repairs;

  // ---- bankruptcy: below the overdraft floor for 120 s, or below $0 for 300 s, in a row
  if (G.money < MONEY.overdraft) G.overdraftT += dt; else G.overdraftT = 0;
  if (G.money < 0) G.negT += dt; else G.negT = 0;
  if (G.money < 0) {
    const left = Math.min(G.money < MONEY.overdraft ? MONEY.bankruptDeep - G.overdraftT : Infinity, MONEY.bankruptNeg - G.negT);
    G.bankruptIn = Math.max(0, left);
  } else G.bankruptIn = null;
  if (!G.bankrupt && (G.overdraftT >= MONEY.bankruptDeep || G.negT >= MONEY.bankruptNeg)) gameOver('bankrupt');

  // ---- money sparkline: one sample per game minute, 10 kept
  ECON.histT += dt;
  if (ECON.histT >= 60) {
    ECON.histT -= 60;
    G.moneyHist.push(Math.round(G.money));
    if (G.moneyHist.length > 10) G.moneyHist.shift();
  }
  ECON.negNetT = G.netPerMin < 0 ? ECON.negNetT + dt : 0;

  tickHints(dt);
}

// Ends the run. reason: 'bankrupt' | 'hq'. main.js shows the screen through G.onGameOver.
export function gameOver(reason) {
  if (G.mode === 'over') return;
  if (reason === 'bankrupt') G.bankrupt = true;
  G.gameOver = reason;
  G.mode = 'over';
  if (typeof G.onGameOver === 'function') G.onGameOver(reason);
}

// C/I lots show the understaffed icon while staffing is below 70%
function setUnderstaffed(wasOk, ok) {
  if (wasOk === ok) return;
  for (const i of LOTLIST) {
    if (W.zone[i] < 2) continue;
    const fl = W.flags[i];
    const nf = ok ? fl & ~LF.UNDERSTAFFED : fl | LF.UNDERSTAFFED;
    if (nf !== fl) { W.flags[i] = nf; W.lotVersion++; W.lotDirty.push(i); }
  }
}

// ------------------------------------------------------------------ demand

// The formulas of concrete_specs 4. The supply side of each zone counts the building pipeline (G.planned:
// lots under construction or still moving in at their target occupancy) so demand reacts when a build starts.
function computeDemandTargets() {
  const P = G.pop, t = G.taxes, panic = G.panic, pl = G.planned;
  const Pr = Math.max(P, pl.R), Wk = 0.5 * Pr, J = G.jobs.gov + Math.max(G.jobs.C, pl.C) + Math.max(G.jobs.I, pl.I);
  const baseR = 15 + 35 * Math.max(0, 1 - Pr / 300);
  const jobsR = (100 * (J - Wk)) / Math.max(Wk, 40);
  const taxR = 4 * (10 - t.R);
  const R = [
    { label: 'Settlers moving in', value: baseR },
    { label: J >= Wk ? 'Jobs waiting for workers' : 'Unemployment', value: jobsR },
    { label: `Residential tax ${t.R}%`, value: taxR },
  ];
  if (panic > 0) R.push({ label: 'Panic after raids', value: -panic });

  const Ct = 0.12 * P + 10, Jc = Math.max(G.jobs.C, pl.C);
  const C = [
    { label: 'Shoppers vs shops', value: (100 * (Ct - Jc)) / Math.max(Ct, 20) },
    { label: `Commercial tax ${t.C}%`, value: 4 * (10 - t.C) },
  ];
  if (panic > 0) C.push({ label: 'Panic after raids', value: -0.5 * panic });
  if (G.blockade) C.push({ label: 'Naval blockade', value: -15 });

  const It = 0.3 * P + 15, Ji = Math.max(G.jobs.I, pl.I);
  const I = [
    { label: 'Demand for goods vs factories', value: (100 * (It - Ji)) / Math.max(It, 20) },
    { label: `Industrial tax ${t.I}%`, value: 4 * (10 - t.I) },
  ];
  const sum = (a) => Math.max(-100, Math.min(100, a.reduce((s, x) => s + x.value, 0)));
  G.demandTerms.R = R; G.demandTerms.C = C; G.demandTerms.I = I;
  G.demandTarget.R = sum(R); G.demandTarget.C = sum(C); G.demandTarget.I = sum(I);
}

// Tooltip data for the demand bars: { R: [{ label, value }], C: [...], I: [...] }. The terms add up to the target
// the bar is moving towards (G.demandTarget); the bar itself shows the smoothed G.demand.
export function demandBreakdown() {
  const r = (a) => a.map((x) => ({ label: x.label, value: Math.round(x.value) }));
  return { R: r(G.demandTerms.R), C: r(G.demandTerms.C), I: r(G.demandTerms.I), target: { ...G.demandTarget }, value: { ...G.demand } };
}

// ------------------------------------------------------------------ budget sheet

// { income: [{ key, label, value }], expense: [{ key, label, value, items? }], net, bankruptIn, minutesLeft, hist }
// Values are $ per game minute. Military expands per tower type; spoils and repairs are 3-minute averages.
export function budgetBreakdown() {
  const inc = G.budget.income, exp = G.budget.expense;
  const income = INCOME_LINES.map(([key, label]) => ({ key, label, value: Math.round(inc[key] || 0) }));
  const expense = EXPENSE_LINES.map(([key, label]) => {
    const line = { key, label, value: Math.round(exp[key] || 0) };
    if (key === 'military') {
      line.items = Object.keys(G.budget.military).filter((k) => G.budget.military[k] > 0)
        .map((k) => ({ key: k, label: BUILDINGS[k] ? BUILDINGS[k].name : k, value: Math.round(G.budget.military[k]) }));
    }
    return line;
  });
  const net = G.netPerMin;
  let minutesLeft = null;
  if (net < 0) minutesLeft = Math.max(0, (G.money - MONEY.overdraft) / -net);
  return {
    income, expense, net: Math.round(net), money: Math.round(G.money), bankruptIn: G.bankruptIn, minutesLeft,
    hist: G.moneyHist.slice(), taxes: { ...G.taxes },
  };
}

// Projected income from one zone at another tax rate, for the budget sliders.
// -> { rate, income, delta, demand } where demand is the change in that zone's demand target vs now.
export function taxPreview(zone, pct) {
  pct = Math.max(0, Math.min(25, pct));
  const now = G.taxes[zone];
  const inc = G.budget.income[zone] || 0;
  const income = now > 0 ? (inc * pct) / now : estimateIncomeAt(zone, pct);
  return { rate: pct, income: Math.round(income), delta: Math.round(income - inc), demand: Math.round(4 * (now - pct)) };
}
function estimateIncomeAt(zone, pct) {
  const mod = G.mod.tax || 1;
  if (zone === 'R') return ZONES[1].taxPerHead * pct * ECON.resTax * mod;
  if (zone === 'C') return ZONES[2].taxPerHead * pct * ECON.jobsCtax * G.staffing * (G.blockade ? 0.75 : 1) * mod;
  return ZONES[3].taxPerHead * pct * ECON.jobsItax * G.staffing * mod;
}

// Tax a single lot pays per minute right now (inspector)
export function lotTaxPerMin(i) {
  const z = W.zone[i];
  const n = lotOccupants(i);
  if (!z || n <= 0) return 0;
  const zd = ZONES[z], key = zd.key;
  let v = zd.taxPerHead * G.taxes[key] * n * zd.levelMul[lotLevelNow(i) - 1] * (G.mod.tax || 1);
  if (z > 1) v *= G.staffing;
  if (z === 2 && G.blockade) v *= 0.75;
  if (W.flags[i] & LF.SHELTER) v *= 1 - (G.mod.shelterLoss != null ? G.mod.shelterLoss : 1);
  return v;
}
