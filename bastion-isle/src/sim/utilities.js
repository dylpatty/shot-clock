// Power and water: one pool of each across the Town Hall road network (concrete_specs 1, 11; should_change 2).
// Supply comes from connected structures; demand from connected structures and lots. When demand exceeds
// supply, power is cut in priority order HQ > utilities > military > services > C/I lots > R lots > abandoned
// lots, oldest first within each group. Water towers need power to pump; the sea pump does not.
//
// tickUtilities() reallocates when something changed (markUtilDirty) - at most every 0.25 s - and otherwise
// once a second. It also runs the road connectivity BFS when G.dirty.connect is set.
import { W, LF, T, isWater } from '../world.js';
import { G } from '../state.js';
import { BUILDINGS } from '../defs.js';
import { recomputeConnectivity, refreshStats } from './game.js';
import { lotNeedPower, lotNeedWater, lotBornT } from './zones.js';
import { markCoverageDirty } from './services.js';
import { markLot } from './core.js';

const U = { dirty: true, last: -1e9 };
export function markUtilDirty() { U.dirty = true; }
export function resetUtilities() {
  U.dirty = true; U.last = -1e9;
  G.power = { supply: 0, demand: 0, used: 0, unpowered: 0 };
  G.water = { supply: 0, demand: 0, used: 0, unwatered: 0 };
}

// ------------------------------------------------------------------ per-structure numbers

const isCoast = (i) => {
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && isWater(W.type[j])) return true; }
  return false;
};
// Wind turbines make 10 MW, 15 MW on hills or the coast
export function windOutput(i) {
  return 10 + (W.type[i] === T.HILLS || isCoast(i) ? 5 : 0);
}
export function powerOut(b) {
  if (b.type === 'wind') return b.def.power + (W.type[b.tile] === T.HILLS || isCoast(b.tile) ? b.def.powerBonus || 0 : 0);
  return b.def.power > 0 ? b.def.power : 0;
}
export const powerNeed = (b) => (b.def.power < 0 ? -b.def.power : 0);
export const waterOut = (b) => (b.def.water > 0 ? b.def.water : 0);
export const waterNeed = (b) => (b.def.water < 0 ? -b.def.water : 0);

// What a structure would add or draw, for the build card and inspector: { power, water } (+ supplies, - draws)
export function buildingSupply(type, tile = -1) {
  const d = BUILDINGS[type];
  if (!d) return { power: 0, water: 0 };
  let p = d.power || 0;
  if (type === 'wind' && tile >= 0 && (W.type[tile] === T.HILLS || isCoast(tile))) p += d.powerBonus || 0;
  return { power: p, water: d.water || 0 };
}

// Priority group for power cuts (lower keeps power longer)
function tierOf(b) {
  if (b.type === 'hq') return 0;
  const k = b.def.kind;
  return k === 'utility' ? 1 : k === 'military' ? 2 : 3;
}

// Spare capacity after the last allocation (a scratch object: callers may count it down)
const SPARE = { power: 0, water: 0 };
export function spare() {
  SPARE.power = G.power.supply - G.power.demand;
  SPARE.water = G.water.supply - G.water.demand;
  return SPARE;
}

// ------------------------------------------------------------------ allocation

export function tickUtilities() {
  if (G.mode !== 'play') return;
  if (G.dirty.connect) recomputeConnectivity();
  const since = G.time - U.last;
  if (U.dirty ? since < 0.25 : since < 1) return;
  allocate();
}

const bScratch = [], lotCI = [], lotR = [], lotAb = [];
const byAge = (a, b) => lotBornT(a) - lotBornT(b);
const byTier = (a, b) => tierOf(a) - tierOf(b) || a.born - b.born;

export function allocate() {
  U.dirty = false;
  U.last = G.time;
  let pSup = 0, pDem = 0, wDem = 0;
  for (const b of G.buildings) {
    if (!b.alive || !b.connected) continue;
    pSup += powerOut(b);
    pDem += powerNeed(b);
    wDem += waterNeed(b);
  }
  const land = W.land;
  let lotsP = 0, lotsW = 0;
  for (let k = 0; k < land.length; k++) {
    const i = land[k];
    if (!W.zone[i] || !W.lvl[i]) continue;
    const fl = W.flags[i];
    if (fl & LF.RUBBLE || !(fl & LF.ROAD)) continue;
    lotsP += lotNeedPower(i);
    lotsW += lotNeedWater(i);
  }
  pDem += lotsP; wDem += lotsW;

  // ---- power
  let remP = pSup, unpowered = 0;
  const cutPower = pSup + 1e-6 < pDem;
  bScratch.length = 0;
  for (const b of G.buildings) if (b.alive) bScratch.push(b);
  if (cutPower) bScratch.sort(byTier);
  for (const b of bScratch) {
    const need = powerNeed(b);
    let ok = b.connected;
    if (ok && need > 0) {
      if (!cutPower || remP + 1e-6 >= need) remP -= need; else ok = false;
    }
    if (need === 0) ok = b.connected || b.type === 'hq';
    setPowered(b, ok);
    if (!ok && need > 0) unpowered++;
  }
  // lots: C/I, then R, then abandoned, oldest first (only sorted when supply is short)
  lotCI.length = 0; lotR.length = 0; lotAb.length = 0;
  for (let k = 0; k < land.length; k++) {
    const i = land[k];
    if (!W.zone[i]) continue;
    const fl = W.flags[i];
    if (!W.lvl[i] || fl & LF.RUBBLE || !(fl & LF.ROAD)) {
      if (fl & (LF.POWER | LF.WATER)) { W.flags[i] = fl & ~(LF.POWER | LF.WATER); markLot(i); }
      continue;
    }
    if (fl & LF.ABANDONED) lotAb.push(i); else if (W.zone[i] === 1) lotR.push(i); else lotCI.push(i);
  }
  if (cutPower) { lotCI.sort(byAge); lotR.sort(byAge); lotAb.sort(byAge); }
  const powerLots = (list) => {
    for (const i of list) {
      const need = lotNeedPower(i);
      let ok = true;
      if (cutPower) { if (remP + 1e-6 >= need) remP -= need; else ok = false; }
      if (!ok) unpowered++;
      setLotFlag(i, LF.POWER, ok);
    }
  };
  powerLots(lotCI); powerLots(lotR); powerLots(lotAb);

  // ---- water (towers pump only when powered)
  let wSup = 0;
  for (const b of G.buildings) {
    if (!b.alive || !b.connected) continue;
    const out = waterOut(b);
    if (out && (powerNeed(b) === 0 || b.powered)) wSup += out;
  }
  let remW = wSup, unwatered = 0;
  const cutWater = wSup + 1e-6 < wDem;
  for (const b of bScratch) {
    const need = waterNeed(b);
    let ok = b.connected || b.type === 'hq';
    if (ok && need > 0 && cutWater) { if (remW + 1e-6 >= need) remW -= need; else ok = false; }
    if (!ok && need > 0) unwatered++;
    b.watered = ok;
  }
  if (cutWater && !cutPower) { lotCI.sort(byAge); lotR.sort(byAge); lotAb.sort(byAge); }
  const waterLots = (list) => {
    for (const i of list) {
      const need = lotNeedWater(i);
      let ok = true;
      if (cutWater) { if (remW + 1e-6 >= need) remW -= need; else ok = false; }
      if (!ok) unwatered++;
      setLotFlag(i, LF.WATER, ok);
    }
  };
  waterLots(lotCI); waterLots(lotR); waterLots(lotAb);

  G.power.supply = pSup; G.power.demand = pDem; G.power.used = Math.min(pSup, pDem); G.power.unpowered = unpowered;
  G.water.supply = wSup; G.water.demand = wDem; G.water.used = Math.min(wSup, wDem); G.water.unwatered = unwatered;
}

function setLotFlag(i, bit, on) {
  const fl = W.flags[i];
  const nf = on ? fl | bit : fl & ~bit;
  if (nf !== fl) { W.flags[i] = nf; markLot(i); }
}

function setPowered(b, ok) {
  if (b.powered === ok) return;
  b.powered = ok;
  // coverage, radar boost and missile readiness depend on power
  if (b.def.kind === 'service' || b.def.kind === 'park' || b.def.kind === 'military') markCoverageDirty();
  if (b.def.kind === 'military') refreshStats();
}
