// Zoned lots: painting, growth with construction and move-in, level-ups, abandonment, rubble and regrowth.
// Systems review concrete_specs 2, 5, 6, 7 (+ should_change 6 and 8). Lots live entirely in the W.* typed arrays
// (SPEC section 1); nothing here allocates per lot.
//
// Lot life cycle (per tile with W.zone > 0):
//   empty        W.lvl = 0, no RUBBLE
//   building     W.lvl >= 1, LF.BUILDING, W.lotT = start time. New builds take GROWTH.buildTime with occ = 0;
//                level-ups take GROWTH.levelUpRebuild and stay occupied (the old level's people stay in).
//   standing     occupancy fills 10 %/s up to the zone's occupancy cap (oversupply lowers it to 60 %).
//                Missing road / power / water: icon after 5 s, abandoned after 45 s.
//   abandoned    LF.ABANDONED, occ = 0 (dark, no tax). Demolished to an empty lot after 120 s, or reoccupied
//                10 s after the cause is fixed.
//   rubble       LF.RUBBLE (W.lvl kept so the renderer knows the size). Clears and regrows for free after 30 s
//                when demand >= 0 and no enemy is within 6 tiles.
// W.timer holds the problem / abandonment / rubble seconds; it is negative during the reoccupy countdown.
import { W, LF, T, isLand, tileAt } from '../world.js';
import { G, notify } from '../state.js';
import { ZONES, ZONE_TERRAIN, GROWTH, MILESTONES } from '../defs.js';
import { markLot, tilesWithin, lotMaxHp, isLot, CORE, CV } from './core.js';
import { rand, FX, SFX } from './events.js';
import { recordLotLoss } from './economy.js';
import { markUtilDirty, spare } from './utilities.js';
import { markPollutionDirty, clearForest } from './services.js';
import { hash2 } from '../rng.js';

// LF bit for "de-zoned, building kept until bulldozed" (requested for world.js LF as DEZONED: 2048)
export const DEZONED = LF.DEZONED || 2048;

const KEYS = ['', 'R', 'C', 'I'];
const COVER_BITS = { fire: CV.FIRE, police: CV.POLICE, health: CV.HEALTH, school: CV.SCHOOL };
const COVER_LABEL = { fire: 'Fire station nearby', police: 'Police station nearby', health: 'Clinic nearby', school: 'School nearby' };

// Private per-tile state (allocated by resetZones)
let progF = null;   // Float32 level-up progress (W.prog is its rounded copy for the UI)
let bornT = null;   // Float32 time the building first opened: older lots keep power first
let upg = null;     // Uint8 1 while LF.BUILDING is a level-up rebuild
let lastHp = null;  // Uint16 hp seen on the previous pass (to notice hits)
let hitT = null;    // Float32 time of the last hit (lots repair for free after 6 s unhit)
let exclStamp = null, exclN = 1, exclTime = -1; // enemy exclusion map (6 tiles round live enemies)
const tmp = [];

const Z = {
  lotAcc: 0.5, growAcc: 0.75,          // stagger: lot pass at t = 0.5 s, growth at t = 1.25 s (economy runs at 0)
  occCap: [100, 100, 100, 100], overT: [0, 0, 0, 0], declining: [false, false, false, false],
  active: [0, 0, 0, 0],                 // new constructions running per zone
  started: 0, completed: 0, upgrades: 0, abandonedEver: 0,
};
export const ZONE_STATE = Z;

export function resetZones() {
  const n = W.count;
  progF = new Float32Array(n); bornT = new Float32Array(n); upg = new Uint8Array(n);
  lastHp = new Uint16Array(n); hitT = new Float32Array(n).fill(-99);
  exclStamp = new Uint32Array(n); exclN = 1; exclTime = -1;
  Z.lotAcc = 0.5; Z.growAcc = 0.75;
  Z.occCap.fill(100); Z.overT.fill(0); Z.declining.fill(false); Z.active.fill(0);
  Z.started = 0; Z.completed = 0; Z.upgrades = 0; Z.abandonedEver = 0;
}

// After loading a save: derive the private arrays from the W arrays
export function rebuildZonePrivate() {
  for (let i = 0; i < W.count; i++) {
    progF[i] = W.prog[i];
    bornT[i] = W.lvl[i] ? -1e6 + i : 0;   // keep tile order as the age order
    lastHp[i] = W.lotHp[i];
    upg[i] = W.lvl[i] > 1 && W.flags[i] & LF.BUILDING && W.occ[i] > 0 ? 1 : 0;
  }
}

// ------------------------------------------------------------------ lot queries

const zdef = (i) => ZONES[W.zone[i]];
export const lotUpgrading = (i) => upg[i] === 1;
export const lotBornT = (i) => bornT[i];

// The level whose occupants live in the building right now (the old level while a level-up is being built)
export function lotLevelNow(i) {
  const L = W.lvl[i];
  return upg[i] && L > 1 ? L - 1 : L;
}
// Residents (R) or jobs (C/I) on a lot right now
export function lotOccupants(i) {
  const z = W.zone[i];
  if (!z || !W.lvl[i]) return 0;
  const fl = W.flags[i];
  if (fl & (LF.RUBBLE | LF.ABANDONED)) return 0;
  if (fl & LF.BUILDING && !upg[i]) return 0;
  return (ZONES[z].levels[lotLevelNow(i) - 1].cap * W.occ[i]) / 100;
}
// Occupants a lot will have once construction and move-in finish (demand counts the building pipeline, so a
// burst of starts does not overshoot while the 8 s construction and 10 s move-in run)
export function lotPlanned(i) {
  const z = W.zone[i];
  if (!z || !W.lvl[i]) return 0;
  const fl = W.flags[i];
  if (fl & (LF.RUBBLE | LF.ABANDONED)) return 0;
  const cap = ZONES[z].levels[W.lvl[i] - 1].cap, tgt = Z.occCap[z];
  if (fl & LF.BUILDING) return (cap * tgt) / 100;
  return (cap * Math.max(W.occ[i], tgt)) / 100;
}
export function lotCapacity(i) {
  const z = zdef(i);
  return z && W.lvl[i] ? z.levels[W.lvl[i] - 1].cap : 0;
}
// Power and water a standing or building lot draws (a level-up reserves the new level's needs)
export function lotNeedPower(i) { const z = zdef(i); return z && W.lvl[i] ? z.levels[W.lvl[i] - 1].power : 0; }
export function lotNeedWater(i) { const z = zdef(i); return z && W.lvl[i] ? z.levels[W.lvl[i] - 1].water : 0; }
export function lotPollution(i) {
  if (W.zone[i] !== 3 || !W.lvl[i]) return 0;
  const fl = W.flags[i];
  if (fl & (LF.RUBBLE | LF.ABANDONED) || (fl & LF.BUILDING && !upg[i])) return 0;
  return ZONES[3].levels[lotLevelNow(i) - 1].poll || 0;
}
const standing = (i) => W.lvl[i] > 0 && !(W.flags[i] & LF.RUBBLE);

// ------------------------------------------------------------------ painting

// Why tile i cannot be zoned, or null
export function zoneProblem(i, zone = 1) {
  if (i < 0) return 'Off the map';
  const t = W.type[i];
  if (!isLand(t)) return 'Zones must be on land';
  if (!ZONE_TERRAIN.includes(t)) return 'Too steep to build on';
  if (W.bld[i]) return 'Tile is occupied';
  if (W.road[i]) return 'Tile has a road';
  if (W.ruin[i]) return 'Clear the ruins first';
  if (W.zone[i] && W.zone[i] !== zone && (standing(i) || W.flags[i] & LF.RUBBLE)) return 'Bulldoze the building first';
  let road = false;
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[i * 6 + d];
    if (j >= 0 && (W.road[j] || (G.hq && j === G.hq.tile))) { road = true; break; }
  }
  if (!road) return 'Zones must touch a road';
  return null;
}

// Beside a road connected to the Town Hall, or beside the Town Hall itself (what connectivity sets LF.ROAD for)
function touchesNetwork(i) {
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[i * 6 + d];
    if (j >= 0 && (W.conn[j] || (G.hq && j === G.hq.tile))) return true;
  }
  return false;
}

// Paint zone 1|2|3 on the given tiles. Returns how many tiles changed (0 if none could be zoned).
export function zonePaint(tiles, zone) {
  if (!(zone >= 1 && zone <= 3)) return 0;
  let n = 0;
  for (const i of tiles) {
    if (zoneProblem(i, zone)) continue;
    const fl = W.flags[i];
    if (W.zone[i] === zone && !(fl & DEZONED)) continue;
    W.zone[i] = zone;
    W.flags[i] = (fl & ~DEZONED) | (touchesNetwork(i) ? LF.ROAD : 0);
    if (!standing(i)) { W.occ[i] = 0; W.prog[i] = 0; progF[i] = 0; W.timer[i] = 0; }
    markLot(i);
    n++;
  }
  if (n) G.dirty.fields = true;
  return n;
}

// Remove zoning. Standing buildings stay (marked de-zoned) until bulldozed or destroyed. Returns the count.
export function dezone(tiles) {
  let n = 0;
  for (const i of tiles) {
    if (i < 0 || !W.zone[i]) continue;
    if (standing(i) || W.flags[i] & LF.RUBBLE) {
      if (W.flags[i] & DEZONED) continue;
      W.flags[i] |= DEZONED;
    } else {
      W.zone[i] = 0; W.flags[i] &= LF.ROAD; W.occ[i] = 0; W.prog[i] = 0; progF[i] = 0; W.timer[i] = 0;
    }
    markLot(i);
    n++;
  }
  if (n) G.dirty.fields = true;
  return n;
}

// Tiles within `radius` of i that could take a zone (the brush tool: radius 0/1/2)
export function zoneBrush(i, radius, out = []) {
  out.length = 0;
  if (i < 0) return out;
  tilesWithin(i, radius, tmp);
  for (const j of tmp) out.push(j);
  return out;
}

// "Fill along this road": every zonable tile beside the road run containing road tile i (up to maxRoads tiles)
export function tilesAlongRoad(i, maxRoads = 40, out = []) {
  out.length = 0;
  if (i < 0 || !W.road[i]) return out;
  const seen = new Set([i]), queue = [i];
  for (let k = 0; k < queue.length && queue.length <= maxRoads; k++) {
    const c = queue[k];
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[c * 6 + d];
      if (j < 0 || seen.has(j)) continue;
      seen.add(j);
      if (W.road[j]) { if (queue.length < maxRoads) queue.push(j); } else if (isLand(W.type[j]) && !W.bld[j]) out.push(j);
    }
  }
  return out;
}

// ------------------------------------------------------------------ demolition (bulldoze) and destruction

// Remove the building on a lot (bulldoze): the lot becomes empty (or unzoned if it was de-zoned)
export function demolishLot(i) {
  if (!W.zone[i]) return false;
  if (W.fire[i]) W.fire[i] = 0;
  clearLot(i);
  return true;
}

function clearLot(i) {
  const wasI = W.zone[i] === 3;
  const dz = W.flags[i] & DEZONED;
  W.lvl[i] = 0; W.occ[i] = 0; W.prog[i] = 0; progF[i] = 0; upg[i] = 0; W.lotT[i] = -1; W.timer[i] = 0; W.lotHp[i] = 0;
  W.flags[i] &= LF.ROAD | DEZONED;
  if (dz) { W.zone[i] = 0; W.flags[i] &= LF.ROAD; }
  markLot(i);
  markUtilDirty();
  if (wasI) markPollutionDirty();
}

// CORE hook: a lot's hp reached zero (shells, bombs, raiders, fire). It becomes rubble.
export function onLotDestroyed(i, cause) {
  const z = W.zone[i];
  if (!z || !W.lvl[i] || W.flags[i] & LF.RUBBLE) return;
  const tax = lotTaxGuess(i);
  W.fire[i] = 0;
  W.flags[i] = (W.flags[i] & (LF.ROAD | DEZONED)) | LF.RUBBLE;
  W.occ[i] = 0; W.prog[i] = 0; progF[i] = 0; upg[i] = 0; W.lotT[i] = -1; W.timer[i] = 0; W.lotHp[i] = 0;
  G.stats.lotsLost++;
  if (cause === 'fire') G.stats.lotsLostFire = (G.stats.lotsLostFire || 0) + 1;
  recordLotLoss();
  const cur = G.wave && G.wave.cur;
  if (cur) { cur.lostPrivate++; cur.taxLostPerMin += tax; }
  const x = W.x[i], y = W.h[i], zz = W.z[i];
  FX.explosion(x, y + 0.3, zz, 0.6 + 0.3 * W.lvl[i], false);
  FX.dust(x, y, zz, 1 + 0.4 * W.lvl[i]);
  SFX.play('collapse', x, zz);
  notify(`${ZONES[z].name} building destroyed`, 'bad', x, zz);
  markLot(i);
  markUtilDirty();
  if (z === 3) markPollutionDirty();
  G.dirty.fields = true;
}
CORE.onLotDestroyed = onLotDestroyed;

function lotTaxGuess(i) {
  const z = W.zone[i];
  const zd = ZONES[z];
  const n = lotOccupants(i);
  return zd.taxPerHead * G.taxes[zd.key] * n * zd.levelMul[lotLevelNow(i) - 1] * (z > 1 ? G.staffing : 1);
}

// Bulldoze rubble: back to an empty zoned lot (or unzoned if de-zoned)
export function clearRubble(i) {
  if (!(W.flags[i] & LF.RUBBLE)) return false;
  clearLot(i);
  G.dirty.fields = true;
  return true;
}

// ------------------------------------------------------------------ enemy exclusion (no growth near raiders)

// Marks tiles within GROWTH.enemyExclusion of any live enemy; rebuilt at most once per game second
function refreshExclusion() {
  if (exclTime === G.time) return;
  exclTime = G.time;
  exclN++;
  if (exclN > 0xfffffff0) { exclStamp.fill(0); exclN = 1; }
  const R = GROWTH.enemyExclusion;
  for (const e of G.enemies) {
    if (!e.alive || e.team !== 'E') continue;
    const t = tileAt(e.x, e.z);
    if (t < 0) continue;
    tilesWithin(t, R, tmp);
    for (const j of tmp) exclStamp[j] = exclN;
  }
}
export const enemyNearTile = (i) => exclStamp[i] === exclN && exclTime >= 0;
function anyEnemies() {
  for (const e of G.enemies) if (e.alive && e.team === 'E') return true;
  return false;
}

// ------------------------------------------------------------------ ticking

export function tickZones(dt) {
  if (G.mode !== 'play') return;
  Z.lotAcc += dt;
  if (Z.lotAcc >= 1) { Z.lotAcc -= 1; lotPass(1); }
  Z.growAcc += dt;
  if (Z.growAcc >= GROWTH.tick) { Z.growAcc -= GROWTH.tick; growthStep(); }
}

// Requirement for the next level: returns -1 not met, 0 at the top level, 1 met, 1.5 met with the LV bonus
function levelRate(i, z, L) {
  const req = ZONES[z].req[L];
  if (!req) return 0;
  if ((req.milestone || 0) > G.milestone) return -1;
  const lv = W.lv[i];
  if (lv < req.lv) return -1;
  const cov = W.cover[i];
  for (const c of req.cover) if (!(cov & COVER_BITS[c])) return -1;
  return req.lv > 0 && lv >= req.lv + 20 ? 1.5 : 1;
}

function lotPass(dt) {
  // oversupply: D < -40 for 60 s lowers the zone's occupancy 1 %/s to 60 %; D > 0 recovers 2 %/s
  for (let z = 1; z <= 3; z++) {
    const D = G.demand[KEYS[z]];
    Z.overT[z] = D < -40 ? Z.overT[z] + dt : 0;
    if (Z.overT[z] >= 60) Z.declining[z] = true;
    if (D > 0) Z.declining[z] = false;
    if (Z.declining[z]) Z.occCap[z] = Math.max(60, Z.occCap[z] - dt);
    else if (D > 0) Z.occCap[z] = Math.min(100, Z.occCap[z] + 2 * dt);
  }
  const raid = anyEnemies();
  if (raid) refreshExclusion();
  const sp = spare();
  let utilChanged = false, pollChanged = false;
  const land = W.land;
  for (let k = 0; k < land.length; k++) {
    const i = land[k];
    const z = W.zone[i];
    if (!z) continue;
    let fl = W.flags[i];

    if (fl & LF.RUBBLE) {
      W.timer[i] += dt;
      if (W.timer[i] >= GROWTH.rubbleRegrow) {
        if (fl & DEZONED) { clearLot(i); continue; }
        if (G.demand[KEYS[z]] >= 0 && !(raid && enemyNearTile(i))) {
          const L = Math.max(1, W.lvl[i]);
          clearLot(i);
          if (W.flags[i] & LF.ROAD) startConstruction(i, L);
        }
      }
      continue;
    }
    const L = W.lvl[i];
    if (!L) continue;

    // hits and free repair
    const hp = W.lotHp[i];
    if (hp < lastHp[i]) hitT[i] = G.time;
    const max = lotMaxHp(i);
    if (hp < max && !W.fire[i] && G.time - hitT[i] >= 6) {
      W.lotHp[i] = Math.min(max, hp + Math.max(1, max * 0.015 * (G.mod.repair || 1) * dt));
      markLot(i);
    } else if (hp > max) W.lotHp[i] = max;
    lastHp[i] = W.lotHp[i];

    if (fl & LF.BUILDING) {
      const need = upg[i] ? GROWTH.levelUpRebuild : GROWTH.buildTime;
      if (G.time - W.lotT[i] >= need) {
        fl &= ~LF.BUILDING;
        W.lotT[i] = -1;
        if (upg[i]) {
          const zd = ZONES[z];
          const old = (zd.levels[L - 2].cap * W.occ[i]) / 100;
          upg[i] = 0;
          W.occ[i] = Math.min(100, Math.round((old / zd.levels[L - 1].cap) * 100));
        } else {
          bornT[i] = G.time;
          W.occ[i] = 0;
          Z.completed++;
        }
        W.flags[i] = fl;
        markLot(i);
        utilChanged = true;
        if (z === 3) pollChanged = true;
      }
      continue;
    }

    // road / power / water problems
    const missing = (fl & LF.ROAD ? 0 : LF.NO_ROAD_ICON) | (fl & LF.POWER ? 0 : LF.NO_POWER_ICON) | (fl & LF.WATER ? 0 : LF.NO_WATER_ICON);
    const icons = LF.NO_ROAD_ICON | LF.NO_POWER_ICON | LF.NO_WATER_ICON;
    let nf = fl;
    if (fl & LF.ABANDONED) {
      if (missing) {
        if (W.timer[i] < 0) W.timer[i] = 0;
        W.timer[i] += dt;
        nf = (nf & ~icons) | missing;
        if (W.timer[i] >= GROWTH.demolishAbandonedAfter) {
          clearLot(i);
          utilChanged = true;
          if (z === 3) pollChanged = true;
          continue;
        }
      } else {
        if (W.timer[i] >= 0) W.timer[i] = -GROWTH.reoccupy;
        W.timer[i] += dt;
        nf &= ~icons;
        if (W.timer[i] >= 0) {
          nf &= ~LF.ABANDONED;
          W.timer[i] = 0;
          W.occ[i] = 0;
          utilChanged = true;
          if (z === 3) pollChanged = true;
        }
      }
    } else if (missing) {
      W.timer[i] += dt;
      if (W.timer[i] >= GROWTH.abandonIconAfter) nf = (nf & ~icons) | missing;
      if (W.timer[i] >= GROWTH.abandonAfter) {
        nf = (nf | LF.ABANDONED) & ~LF.UNDERSTAFFED;
        W.timer[i] = 0;
        W.occ[i] = 0;
        progF[i] = 0; W.prog[i] = 0;
        Z.abandonedEver++;
        if (!G.stats.firstAbandoned) G.stats.firstAbandoned = i + 1;
        utilChanged = true;
        if (z === 3) pollChanged = true;
      }
      if (progF[i] > 0) { progF[i] = Math.max(0, progF[i] - dt); W.prog[i] = Math.round(progF[i]); }
    } else {
      W.timer[i] = 0;
      nf &= ~icons;
      // move-in up to the zone's occupancy cap
      const cap = Math.round(Z.occCap[z]);
      const occ = W.occ[i];
      if (occ < cap) W.occ[i] = Math.min(cap, occ + 10 * dt);
      else if (occ > cap) W.occ[i] = Math.max(cap, occ - dt);
      if (((occ / 10) | 0) !== ((W.occ[i] / 10) | 0)) markLot(i);
      // level-up progress
      const rate = levelRate(i, z, L);
      if (rate > 0) progF[i] = Math.min(GROWTH.levelUpAt, progF[i] + rate * dt);
      else if (rate < 0) progF[i] = Math.max(0, progF[i] - dt);
      W.prog[i] = Math.round(progF[i]);
      if (progF[i] >= GROWTH.levelUpAt && rate > 0) {
        const zd = ZONES[z];
        const dp = zd.levels[L].power - zd.levels[L - 1].power, dw = zd.levels[L].water - zd.levels[L - 1].water;
        if (sp.power >= dp && sp.water >= dw && W.flags[i] & LF.ROAD) {
          sp.power -= dp; sp.water -= dw;
          beginUpgrade(i, L + 1);
          utilChanged = true;
          if (z === 3) pollChanged = true;
          continue;
        }
      }
    }
    if (nf !== fl) { W.flags[i] = nf; markLot(i); }
  }
  if (utilChanged) markUtilDirty();
  if (pollChanged) markPollutionDirty();
}

function beginUpgrade(i, L) {
  const frac = W.lotHp[i] / Math.max(1, lotMaxHp(i));
  W.lvl[i] = L;
  upg[i] = 1;
  W.flags[i] |= LF.BUILDING;
  W.lotT[i] = G.time;
  progF[i] = 0; W.prog[i] = 0;
  W.lotHp[i] = Math.max(1, Math.round(lotMaxHp(i) * frac));
  lastHp[i] = W.lotHp[i];
  Z.upgrades++;
  markLot(i);
}

function startConstruction(i, L = 1) {
  if (W.type[i] === T.FOREST) clearForest(i);
  W.lvl[i] = L;
  upg[i] = 0;
  W.flags[i] = (W.flags[i] & (LF.ROAD | LF.POWER | LF.WATER | DEZONED)) | LF.BUILDING;
  W.lotT[i] = G.time;
  W.occ[i] = 0;
  progF[i] = 0; W.prog[i] = 0;
  W.timer[i] = 0;
  W.style[i] = Math.floor(rand() * 256);
  W.lotHp[i] = lotMaxHp(i);
  lastHp[i] = W.lotHp[i];
  hitT[i] = -99;
  bornT[i] = G.time;
  Z.started++;
  markLot(i);
}

// Every 2 s: new buildings start on empty zoned lots where there is demand (concrete_specs 5).
// The cap 3 + P/400 is shared by all zones, and a building counts against it from the start of construction
// until its move-in ends (8 s + 10 s): this is what paces early growth to the review's bands (tests/sim).
const cand = [], candW = [];
const zoneOrder = [1, 2, 3];
export function activeBuilds() {
  let n = 0;
  const land = W.land, fill = GROWTH.fillTime;
  for (let k = 0; k < land.length; k++) {
    const i = land[k];
    if (!W.zone[i] || !W.lvl[i] || upg[i]) continue;
    const fl = W.flags[i];
    if (fl & LF.RUBBLE) continue;
    if (fl & LF.BUILDING || G.time - bornT[i] < fill) { n++; Z.active[W.zone[i]]++; }
  }
  return n;
}
function growthStep() {
  const P = G.pop;
  const cap = 3 + Math.floor(P / 400);
  const raidActive = G.wave && G.wave.state === 'active';
  const raid = anyEnemies();
  if (raid) refreshExclusion();
  Z.active.fill(0);
  let remaining = cap - activeBuilds();
  if (remaining <= 0) return;
  const land = W.land;
  zoneOrder.sort((a, b) => G.demand[KEYS[b]] - G.demand[KEYS[a]]);
  const sp = spare();
  for (const z of zoneOrder) {
    const D = G.demand[KEYS[z]];
    if (D <= 0 || remaining <= 0) continue;
    let starts = Math.min(1 + Math.floor(D / 35), remaining);
    if (raidActive) starts = Math.floor(starts * GROWTH.raidStartMul + rand());
    if (starts <= 0) continue;
    const need = ZONES[z].levels[0];
    if (sp.power < need.power || sp.water < need.water) continue;
    // eligible: zoned, empty, connected, not de-zoned, not near a live enemy
    cand.length = 0; candW.length = 0;
    let sum = 0;
    for (let k = 0; k < land.length; k++) {
      const i = land[k];
      if (W.zone[i] !== z || W.lvl[i]) continue;
      const fl = W.flags[i];
      if (fl & (LF.RUBBLE | DEZONED) || !(fl & LF.ROAD)) continue;
      if (raid && enemyNearTile(i)) continue;
      let w = (W.lv[i] + 10) * (W.lv[i] + 10);
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[i * 6 + d];
        if (j >= 0 && W.zone[j] === z && standing(j)) { w *= 1.5; break; }
      }
      cand.push(i); candW.push(w); sum += w;
    }
    starts = Math.min(starts, cand.length);
    for (let s = 0; s < starts && sum > 0; s++) {
      if (sp.power < need.power || sp.water < need.water) break;
      let r = rand() * sum, pick = -1;
      for (let c = 0; c < cand.length; c++) {
        if (candW[c] <= 0) continue;
        r -= candW[c];
        if (r <= 0) { pick = c; break; }
      }
      if (pick < 0) for (let c = cand.length - 1; c >= 0; c--) if (candW[c] > 0) { pick = c; break; }
      if (pick < 0) break;
      sum -= candW[pick]; candW[pick] = 0;
      startConstruction(cand[pick], 1);
      sp.power -= need.power; sp.water -= need.water;
      remaining--;
    }
  }
  markUtilDirty();
}

// ------------------------------------------------------------------ inspector

const STREETS = ['Harbour Street', 'Quay Road', 'Lighthouse Lane', 'Mill Street', 'Chapel Row', 'Station Road', 'Cliff Walk',
  'Market Street', 'Anchor Lane', 'Signal Hill', 'Rope Walk', 'Garrison Road', 'Beacon Street', 'Saltmarsh Lane',
  'Ferry Road', 'Tide Street', 'Gull Terrace', 'Netmakers Row', 'Breakwater Road', 'Pilot Street', 'Orchard Lane', 'Kelp Street'];
// A stable street address for a lot ('14 Harbour Street')
export function lotName(i) {
  const s = STREETS[Math.floor(hash2(i, 991) * STREETS.length)];
  return `${1 + Math.floor(hash2(i, 37) * 98)} ${s}`;
}

// Checklist for the lot's next level: [{ key, label, ok }]. Always includes road, power and water; then land
// value, each service the next level needs, and the milestone. At the top level only the basics are listed.
export function missingRequirements(i) {
  const out = [];
  const z = W.zone[i];
  if (!z) return out;
  const fl = W.flags[i];
  out.push({ key: 'road', label: 'Road to the Town Hall', ok: !!(fl & LF.ROAD) });
  out.push({ key: 'power', label: 'Power', ok: !!(fl & LF.POWER) });
  out.push({ key: 'water', label: 'Water', ok: !!(fl & LF.WATER) });
  const L = Math.max(1, W.lvl[i]);
  const req = ZONES[z].req[L];
  if (!req) return out;
  if (req.lv > 0) out.push({ key: 'lv', label: `Land value ${req.lv}+ (now ${W.lv[i]})`, ok: W.lv[i] >= req.lv, need: req.lv, have: W.lv[i] });
  for (const c of req.cover) out.push({ key: c, label: COVER_LABEL[c], ok: !!(W.cover[i] & COVER_BITS[c]) });
  if (req.milestone) out.push({ key: 'milestone', label: `${MILESTONES[req.milestone].name} milestone`, ok: G.milestone >= req.milestone });
  return out;
}

// Everything the inspector shows for a zoned tile, or null
export function lotInfo(i) {
  const z = W.zone[i];
  if (i < 0 || !z) return null;
  const zd = ZONES[z], fl = W.flags[i];
  const problems = [];
  if (W.fire[i]) problems.push('On fire');
  if (fl & LF.NO_ROAD_ICON) problems.push('No road to the Town Hall');
  if (fl & LF.NO_POWER_ICON) problems.push('No power');
  if (fl & LF.NO_WATER_ICON) problems.push('No water');
  if (fl & LF.ABANDONED) problems.push('Abandoned');
  if (fl & LF.SHELTER) problems.push('Sheltering from raiders (no tax)');
  if (fl & LF.UNDERSTAFFED) problems.push('Understaffed: not enough workers');
  if (fl & DEZONED) problems.push('De-zoned: will not be rebuilt');
  const n = lotOccupants(i);
  const state = fl & LF.RUBBLE ? 'rubble' : !W.lvl[i] ? 'empty' : fl & LF.BUILDING ? (upg[i] ? 'upgrading' : 'building')
    : fl & LF.ABANDONED ? 'abandoned' : 'open';
  const buildLeft = fl & LF.BUILDING ? Math.max(0, (upg[i] ? GROWTH.levelUpRebuild : GROWTH.buildTime) - (G.time - W.lotT[i])) : 0;
  return {
    tile: i, name: lotName(i), zone: z, key: zd.key, zoneName: zd.name, level: W.lvl[i], state,
    occupancy: W.occ[i], capacity: lotCapacity(i), occupants: Math.round(n), unit: z === 1 ? 'residents' : 'jobs',
    hp: W.lotHp[i], maxHp: lotMaxHp(i), landValue: W.lv[i], pollution: W.poll[i],
    progress: W.prog[i], progressMax: GROWTH.levelUpAt, buildLeft,
    fire: W.fire[i] / 255, problems, requirements: missingRequirements(i), dezoned: !!(fl & DEZONED),
    abandonIn: !(fl & LF.ABANDONED) && W.timer[i] > 0 ? Math.max(0, GROWTH.abandonAfter - W.timer[i]) : null,
  };
}

// Lots at L1 that cannot reach L2 only for lack of a school or clinic (advisor hint)
export function lotsBlockedForSchoolOrClinic() {
  let n = 0;
  for (const i of W.land) {
    if (W.zone[i] !== 1 || W.lvl[i] !== 1 || W.flags[i] & (LF.RUBBLE | LF.BUILDING | LF.ABANDONED)) continue;
    const c = W.cover[i];
    if (!(c & CV.SCHOOL) || !(c & CV.HEALTH)) n++;
  }
  return n;
}

// Research (Reinforced Concrete) raised lot hp: scale every standing lot
export function scaleLotHp(f) {
  for (const i of W.land) if (W.zone[i] && W.lvl[i] && W.lotHp[i]) { W.lotHp[i] = Math.min(65535, Math.round(W.lotHp[i] * f)); lastHp[i] = W.lotHp[i]; }
}

export { isLot };
