// Fires and fire trucks (concrete_specs 18). Intensity per tile is W.fire (0-255 = f x 255); the true float lives
// in a private array so slow changes are not lost to rounding. Fires are started by core.ignite() (explosives via
// damageTile, raider sabotage, spread, spontaneous); this module finds them on its 1 s pass.
//
// Trucks (G.trucks) drive along roads from their station to the hottest fire within the station's radius and
// spray it. Each entry: { id, station, x, y, z, yaw, state: 'home'|'out'|'spray'|'back', tile, path, pi, target }.
// Draw the ones whose state is not 'home' (G.trucks[k].active is the same test).
import { W, LF, CV, isLand } from '../world.js';
import { G, notify } from '../state.js';
import { FIRE } from '../defs.js';
import { ignite, isLot, lotMaxHp, markLot, buildingAt } from './core.js';
import { rand, FX, SFX } from './events.js';
import { findPath } from '../path.js';
import { hexDist } from '../hex.js';
import { LOTLIST } from './economy.js';
import { onLotDestroyed } from './zones.js';
import { damageBuilding } from './game.js';
import { serviceRadius } from './services.js';
import { powerNeed } from './utilities.js';

let fireF = null;
const burning = [];
const FS = { acc: 0.65, nextTruckId: 1 };  // fire pass at t = 0.35 s in the stagger
export const FIRE_STATE = FS;
export const burningTiles = () => burning;

export function resetFire() {
  fireF = new Float32Array(W.count);
  burning.length = 0;
  FS.acc = 0.65; FS.nextTruckId = 1;
  G.trucks = [];
  G.fires = 0;
}
export function rebuildFirePrivate() { for (let i = 0; i < W.count; i++) fireF[i] = W.fire[i] / 255; }

// Can something on this tile burn? Zoned buildings, and player structures except the Town Hall and parks.
function burnableBuilding(b) { return b && b.alive && b.type !== 'hq' && b.def.kind !== 'park'; }
export function burnable(i) {
  if (W.bld[i]) return burnableBuilding(buildingAt(i));
  return isLot(i);
}
// Spread multiplier M: industry 1.5, other buildings 1, roads / parks / empty / water 0 (firebreaks)
function spreadMul(j) {
  if (W.bld[j]) return burnableBuilding(buildingAt(j)) ? 1 : 0;
  if (!isLot(j)) return 0;
  return W.zone[j] === 3 ? FIRE.industryMul : 1;
}

export function extinguish(i, byTruck = true) {
  if (!W.fire[i] && !fireF[i]) return;
  W.fire[i] = 0;
  fireF[i] = 0;
  G.fires = Math.max(0, G.fires - 1);
  if (byTruck) G.stats.firesOut++;
  FX.smokePuff(W.x[i], W.h[i] + 0.4, W.z[i], 1, 0.6);
  markLot(i);
}

export function tickFire(dt) {
  if (G.mode !== 'play') return;
  updateTrucks(dt);
  FS.acc += dt;
  if (FS.acc >= 1) { FS.acc -= 1; fireStep(1); }
}

function fireStep(dt) {
  // find every burning tile (new ones were lit by core.ignite)
  burning.length = 0;
  const land = W.land;
  for (let k = 0; k < land.length; k++) {
    const i = land[k];
    if (!W.fire[i]) { if (fireF[i]) fireF[i] = 0; continue; }
    if (!burnable(i)) { W.fire[i] = 0; fireF[i] = 0; markLot(i); continue; }
    if (!fireF[i]) {
      fireF[i] = W.fire[i] / 255;
      if (!(W.cover[i] & CV.FIRE) && !G.stats.firstFireUncovered) G.stats.firstFireUncovered = i + 1;
      if (G.wave.cur) G.wave.cur.fires++;
      notify('A building is on fire', 'bad', W.x[i], W.z[i]);
      SFX.play('fire', W.x[i], W.z[i]);
    }
    burning.push(i);
  }
  G.fires = burning.length;
  const capMul = burning.length > FIRE.cap ? 0.5 : 1;

  for (let k = 0; k < burning.length; k++) {
    const i = burning[k];
    let f = Math.min(1, fireF[i] + FIRE.grow * dt);
    // damage: 2 % of max hp per second x intensity (about 60 s from full hp to collapse)
    const cur = G.wave.cur;
    if (W.bld[i]) {
      const b = buildingAt(i);
      if (cur) cur.dmgBy.fire = (cur.dmgBy.fire || 0) + FIRE.hpLoss * b.maxHp * f * dt;
      damageBuilding(b, FIRE.hpLoss * b.maxHp * f * dt, 'fire');
      if (!b.alive) { W.fire[i] = 0; fireF[i] = 0; continue; }
    } else {
      if (cur) cur.dmgBy.fire = (cur.dmgBy.fire || 0) + FIRE.hpLoss * lotMaxHp(i) * f * dt;
      const hp = W.lotHp[i] - FIRE.hpLoss * lotMaxHp(i) * f * dt;
      if (hp <= 0) {
        W.lotHp[i] = 0;
        fireF[i] = 0;
        onLotDestroyed(i, 'fire');
        continue;
      }
      W.lotHp[i] = hp;
    }
    // spread to neighbours (roads, parks and empty land are firebreaks)
    if (f >= FIRE.spreadMinF) {
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[i * 6 + d];
        if (j < 0 || W.fire[j]) continue;
        const M = spreadMul(j);
        if (!M) continue;
        const S = W.cover[j] & CV.FIRE ? FIRE.coveredMul : 1;
        if (rand() < FIRE.spread * f * S * M * capMul) {
          if (ignite(j)) fireF[j] = FIRE.start;
        }
      }
    }
    const old = W.fire[i];
    fireF[i] = f;
    W.fire[i] = Math.max(1, Math.round(f * 255));
    if ((old >> 6) !== (W.fire[i] >> 6)) markLot(i);
  }

  // spontaneous fires: 1 per 36,000 s per lot outside fire cover, x0.2 inside
  const N = LOTLIST.length;
  if (N && rand() < N * FIRE.spontaneousPerLotSec * dt) {
    const i = LOTLIST[Math.floor(rand() * N)];
    if (isLot(i) && !W.fire[i] && !(W.flags[i] & LF.BUILDING) && rand() < (W.cover[i] & CV.FIRE ? 0.2 : 1)) {
      if (ignite(i)) fireF[i] = FIRE.start;
    }
  }

  syncTrucks();
  dispatchTrucks();
}

// ------------------------------------------------------------------ trucks

const roadOnly = (j) => (W.road[j] ? 1 : 0);
function roadBeside(i) {
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j] && W.conn[j]) return j; }
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j]) return j; }
  return -1;
}
const adjacent = (a, b) => { for (let d = 0; d < 6; d++) if (W.nbr[a * 6 + d] === b) return true; return false; };

// Keep 2 trucks per fire station (+1 with Fire Brigade Training); drop trucks of stations that are gone
function syncTrucks() {
  const want = FIRE.trucks + (G.mod.extraTrucks || 0);
  const T = G.trucks;
  for (let k = T.length - 1; k >= 0; k--) {
    const st = G.byId.get(T[k].station);
    if (!st || !st.alive) T.splice(k, 1);
  }
  for (const b of G.buildings) {
    if (b.type !== 'fire' || !b.alive) continue;
    let have = 0;
    for (const t of T) if (t.station === b.id) have++;
    for (; have < want; have++) {
      const home = roadBeside(b.tile);
      T.push({
        id: FS.nextTruckId++, station: b.id, home, tile: home >= 0 ? home : b.tile,
        x: b.x, y: b.y, z: b.z, yaw: b.yaw || 0, state: 'home', active: false, path: null, pi: 0, target: -1, spray: 0,
      });
    }
  }
}

function assigned(target) {
  let n = 0;
  for (const t of G.trucks) if (t.target === target && t.state !== 'home' && t.state !== 'back') n++;
  return n;
}

// Pick the hottest fire in the station's radius (spreading trucks over fires) and route there along roads
function routeTruck(t, st) {
  const R = serviceRadius(st);
  const q0 = W.q[st.tile], r0 = W.r[st.tile];
  let best = -1, bs = -1;
  for (const i of burning) {
    if (!W.fire[i] || hexDist(W.q[i], W.r[i], q0, r0) > R) continue;
    const s = fireF[i] - 0.35 * assigned(i);
    if (s > bs) { bs = s; best = i; }
  }
  if (best < 0) return false;
  const start = W.road[t.tile] ? t.tile : t.home;
  if (start < 0) return false;
  const tq = W.q[best], tr = W.r[best];
  const path = adjacent(start, best) ? [start]
    : findPath(start, roadOnly, (j) => adjacent(j, best), (j) => Math.max(0, hexDist(W.q[j], W.r[j], tq, tr) - 1), 2500);
  if (!path) return false;
  t.target = best; t.path = path; t.pi = 0; t.state = 'out'; t.active = true;
  if (t.tile === t.home) SFX.play('siren', t.x, t.z);
  return true;
}

function dispatchTrucks() {
  if (!burning.length) return;
  for (const t of G.trucks) {
    if (t.state !== 'home' && t.state !== 'back') continue;
    const st = G.byId.get(t.station);
    if (!st || !st.connected || (powerNeed(st) && !st.powered)) continue;
    routeTruck(t, st);
  }
}

function sendHome(t) {
  t.target = -1;
  if (t.home < 0 || t.tile === t.home) { t.state = 'home'; t.active = false; t.path = null; return; }
  const h = t.home, hq = W.q[h], hr = W.r[h];
  const path = findPath(W.road[t.tile] ? t.tile : t.home, roadOnly, (j) => j === h, (j) => hexDist(W.q[j], W.r[j], hq, hr), 2500);
  if (!path) { t.state = 'home'; t.active = false; t.tile = h; t.x = W.x[h]; t.z = W.z[h]; t.y = W.h[h]; t.path = null; return; }
  t.path = path; t.pi = 0; t.state = 'back'; t.active = true;
}

function updateTrucks(dt) {
  const T = G.trucks;
  if (!T.length) return;
  const speed = FIRE.truckSpeed * (G.mod.truckMul || 1);
  for (const t of T) {
    if (t.state === 'out' || t.state === 'back') {
      let step = speed * dt;
      while (step > 0 && t.path && t.pi < t.path.length) {
        const p = t.path[t.pi];
        const dx = W.x[p] - t.x, dz = W.z[p] - t.z, d = Math.hypot(dx, dz);
        if (d <= step) { t.x = W.x[p]; t.z = W.z[p]; t.tile = p; t.pi++; step -= d; }
        else { t.x += (dx / d) * step; t.z += (dz / d) * step; t.yaw = Math.atan2(dx, dz); step = 0; }
      }
      t.y = W.h[t.tile] || 0;
      if (!t.path || t.pi >= t.path.length) {
        if (t.state === 'back') { t.state = 'home'; t.active = false; t.path = null; }
        else if (t.target >= 0 && W.fire[t.target]) { t.state = 'spray'; t.spray = 0; t.yaw = Math.atan2(W.x[t.target] - t.x, W.z[t.target] - t.z); }
        else { const st = G.byId.get(t.station); if (!st || !routeTruck(t, st)) sendHome(t); }
      }
    } else if (t.state === 'spray') {
      const i = t.target;
      if (i < 0 || !W.fire[i]) {
        const st = G.byId.get(t.station);
        if (!st || !routeTruck(t, st)) sendHome(t);
        continue;
      }
      fireF[i] -= FIRE.truckRate * (G.mod.truckMul || 1) * dt;
      t.spray -= dt;
      if (t.spray <= 0) { t.spray = 0.25; FX.smokePuff(W.x[i], W.h[i] + 0.5, W.z[i], 0.6, 0.85); }
      if (fireF[i] <= 0) extinguish(i, true);
      else W.fire[i] = Math.max(1, Math.round(fireF[i] * 255));
    }
  }
}

// Fire-risk view helper: 0 safe (covered or nothing to burn), 1 burnable outside fire cover, 2 burning
export function fireRisk(i) {
  if (W.fire[i]) return 2;
  if (!burnable(i)) return 0;
  return W.cover[i] & CV.FIRE ? 0 : 1;
}
export { isLand };
