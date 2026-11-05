// Waves, enemy AI (ships, landing parties, aircraft), towers with targeting modes, marines, police officers,
// interceptors, projectiles. Adapted from Bastion Isle 1's combat.js to the money economy:
//  - every random decision uses the seeded rand() (sim/events.js); every effect goes through FX / SFX hooks
//  - enemies aim at tiles (W.bld structures or zoned lots) found with hex-radius / ring lookups, never by looping
//    over every lot; damage goes through damageTile()
//  - per-type target priorities (defs ENEMIES[*].aim, concrete_specs 17), money bounties (addSpoils)
//  - wave budget = WAVE_BUDGET(n) x difficulty x prominence, planned when the previous wave ends (exact preview)
//  - blockade, sheltering, sabotage, police officers, power needs for radar / missiles / airfield
import { W, T, tileAt, tileIndex, groundY, isWater, isWalkable, isLand } from '../world.js';
import { DIRS, hexDist, angleDiff, clamp, lerp } from '../hex.js';
import { ENEMIES, ALLIES, VICTORY_WAVE, WAVE_BUDGET, PROMINENCE, DIFFICULTY, MONEY, AIM_TEXT } from '../defs.js';
import { G, notify, SETTINGS } from '../state.js';
import { findPath } from '../path.js';
import { FX, SFX, rand, randRange as rnd } from './events.js';
import { damageTile, ignite, tilesWithin, isLot, buildingAt, markLot, LF } from './core.js';
import { addSpoils, chargeRepair, LOTLIST } from './economy.js';
import { saveGame, repairCost, ruinsCost } from './game.js';
import { lvCluster, serviceRadius, waterDistance } from './services.js';
import { hint } from './hints.js';

const GRAV = 6;
const STEP = 1.732;
const MIL = (b) => b.def.kind === 'military';

// Route searches allowed per simulation step, so a crowd retargeting at once spreads over a few frames
let planBudget = 3;
function canPlan() {
  if (planBudget <= 0) return false;
  planBudget--;
  return true;
}

// Per-world lookups (resetCombat): hex distance from each water tile to land (blockade), shore reach of the HQ
let seaDist = null, triedStamp = null, triedN = 1, shelterMark = null, shelterN = 1;
let hqShore = false;
const tmp = [], tmp2 = [], shelterOld = [], shelterNew = [];
const C = { shelterT: 0 };

// ------------------------------------------------------------------ waves

function newReport(n) {
  return {
    n, kills: {}, killsTotal: 0, bounty: 0, rewards: 0, lostOwn: 0, lostOwnValue: 0, lostTypes: {}, lostPrivate: 0,
    fires: 0, firesStart: G.stats.firesStarted, firesOutStart: G.stats.firesOut, repairs: 0, shelterLost: 0, taxLostPerMin: 0,
    startT: G.time, dmgBy: {},
  };
}

// Reset combat state for a new or loaded game. `saved` is the wave part of a save ({ n, timer, plan, report }).
export function resetCombat(saved) {
  const n = W.count;
  seaDist = new Uint8Array(n).fill(255);
  const q = [];
  for (let i = 0; i < n; i++) if (isLand(W.type[i])) { seaDist[i] = 0; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const c = q[k];
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[c * 6 + d];
      if (j >= 0 && seaDist[j] > seaDist[c] + 1) { seaDist[j] = seaDist[c] + 1; q.push(j); }
    }
  }
  triedStamp = new Uint32Array(n); triedN = 1;
  shelterMark = new Uint32Array(n); shelterN = 1;
  shelterOld.length = 0; shelterNew.length = 0;
  C.shelterT = 0;
  const hq = G.hq;
  hqShore = false;
  if (hq) for (const i of W.shore) if (Math.hypot(W.x[i] - hq.x, W.z[i] - hq.z) <= ENEMIES.battleship.range) { hqShore = true; break; }
  G.enemies.length = 0; G.allies.length = 0; G.projectiles.length = 0;
  G.blockade = false;
  const diff = DIFFICULTY[G.difficulty] || DIFFICULTY.standard;
  G.wave = { n: 1, state: 'prep', timer: diff.firstWave, elapsed: 0, plan: null, queue: [], current: 0, report: null, cur: null, total: 0, lastSpawn: 0, hqWarned: false };
  if (saved) {
    G.wave.n = saved.n; G.wave.timer = saved.timer; G.wave.plan = saved.plan; G.wave.report = saved.report || null;
  }
  if (!G.wave.plan) G.wave.plan = planWave(G.wave.n);
  G.threat = G.wave.plan.prominence;
  G.wave.cur = newReport(G.wave.n);
}

// Plan raid n with the city's current size (concrete_specs 16). The plan is the exact preview.
export function planWave(n) {
  const diff = DIFFICULTY[G.difficulty] || DIFFICULTY.standard;
  const prominence = PROMINENCE(G.pop);
  const total = WAVE_BUDGET(n) * diff.budget * prominence;
  let budget = total;
  const units = [];
  if (n >= 10 && n % 5 === 0) {
    const k = 1 + Math.floor((n - 10) / 10);
    for (let i = 0; i < k; i++) units.push('battleship');
    budget -= ENEMIES.battleship.cost * k;
  }
  const pool = Object.entries(ENEMIES).filter(([, d]) => d.cost && d.weight && n >= d.minWave);
  // the first raids always bring a landing party so marines and MG posts matter early
  if (n <= 2) { units.push('landing'); budget -= ENEMIES.landing.cost; }
  while (budget >= 6) {
    const opts = pool.filter(([, d]) => d.cost <= budget);
    if (!opts.length) break;
    let sum = 0;
    for (const [, d] of opts) sum += d.weight;
    let r = rand() * sum, pick = opts[0][0];
    for (const [k, d] of opts) { r -= d.weight; if (r <= 0) { pick = k; break; } }
    units.push(pick);
    budget -= ENEMIES[pick].cost;
  }
  const nd = n < 3 ? 1 : n < 8 ? 2 : 3;
  const dirs = [];
  const base = rand() * Math.PI * 2;
  for (let i = 0; i < nd; i++) dirs.push(base + (i * Math.PI * 2) / nd + rnd(-0.5, 0.5));
  for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [units[i], units[j]] = [units[j], units[i]]; }
  let t = 0;
  const queue = units.map((type, k) => {
    t += rnd(0.5, 1.8) * (ENEMIES[type].domain === 'air' ? 1.4 : 1);
    return { t, type, dir: dirs[k % nd] + rnd(-0.22, 0.22) };
  });
  const counts = {};
  for (const u of units) counts[u] = (counts[u] || 0) + 1;
  let air = 0, landing = 0;
  for (const u of units) { if (ENEMIES[u].domain === 'air') air++; if (u === 'landing') landing++; }
  return { n, queue, dirs, counts, budget: total, prominence, difficulty: diff.budget, preview: previewOf(counts), air, landing };
}

// [{ type, name, count, domain, aim, text }] for the raid clock and wave report, biggest groups first
export function previewOf(counts) {
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((type) => {
    const d = ENEMIES[type];
    const aim = AIM_TEXT[d.aim] || '';
    return { type, name: d.name, count: counts[type], domain: d.domain, aim, text: `${d.name} x${counts[type]}: ${aim}` };
  });
}
export const wavePreview = () => (G.wave.plan ? G.wave.plan.preview : []);

const hpMul = (n) => 1 + 0.05 * (n - 1) + 0.0025 * (n - 1) * (n - 1);
const dmgMul = (n) => 1 + 0.04 * (n - 1);

export function updateWave(dt) {
  const w = G.wave;
  if (w.state === 'prep') {
    if (!G.raidsOn) return;            // sandbox: the clock waits until raids are switched on
    w.timer -= dt;
    if (w.timer <= 0) startWave();
  } else {
    w.elapsed += dt;
    while (w.queue.length && w.queue[0].t <= w.elapsed) {
      const q = w.queue.shift();
      spawnEnemy(q.type, q.dir, w.current);
      w.lastSpawn = w.elapsed;
    }
    if (!w.queue.length) {
      let alive = 0;
      for (const e of G.enemies) if (e.team === 'E' && !e.gone) alive++;
      // failsafe: whatever is left four minutes after the last spawn withdraws
      if (alive && w.elapsed > (w.lastSpawn || 0) + 240) {
        for (const e of G.enemies) e.gone = true;
        notify('The last raiders have withdrawn.', 'good');
        alive = 0;
      }
      if (alive === 0) endWave();
    }
  }
}

export function startWave() {
  const w = G.wave;
  w.state = 'active';
  w.current = w.n;
  w.elapsed = 0;
  w.lastSpawn = 0;
  w.queue = w.plan.queue.map((q) => ({ ...q }));
  w.total = w.queue.length;
  w.cur = newReport(w.current);
  w.hqWarned = false;
  G.stats.wavesStarted++;
  notify(`Raid ${w.current} is here! ${describeDirs(w.plan.dirs)}`, 'alert');
  SFX.play('alarm');
  if (SETTINGS.autoPauseRaid) G.paused = true;
}

function endWave() {
  const w = G.wave;
  const bonus = MONEY.waveClearBase + MONEY.waveClearPerWave * w.current;
  addSpoils(bonus, 'wave');
  G.stats.waves = w.current;
  const cur = w.cur;
  let ruins = 0;
  for (const i of W.land) if (W.ruin[i]) ruins++;
  let repairBill = 0;
  for (const b of G.buildings) repairBill += repairCost(b);
  w.n = w.current + 1;
  w.state = 'prep';
  w.timer = (DIFFICULTY[G.difficulty] || DIFFICULTY.standard).gap;
  w.plan = planWave(w.n);
  G.threat = w.plan.prominence;
  w.report = {
    n: cur.n, kills: cur.kills, killsTotal: cur.killsTotal, bounty: Math.round(cur.bounty), reward: bonus,
    lostOwn: cur.lostOwn, lostOwnValue: cur.lostOwnValue, lostTypes: cur.lostTypes, lostPrivate: cur.lostPrivate,
    firesStarted: G.stats.firesStarted - cur.firesStart, firesOut: G.stats.firesOut - cur.firesOutStart,
    repairsPaid: Math.round(cur.repairs), repairBill, rebuildCost: ruinsCost(), ruins,
    taxLost: Math.round(cur.shelterLost), taxLostPerMin: Math.round(cur.taxLostPerMin), duration: G.time - cur.startT,
    dmgBy: roundAll(cur.dmgBy),
    next: { n: w.n, preview: w.plan.preview, prominence: w.plan.prominence, dirs: w.plan.dirs, text: describeDirs(w.plan.dirs) },
  };
  w.cur = newReport(w.n);
  notify(`Raid ${cur.n} repelled. +$${bonus.toLocaleString('en-US')}`, 'good');
  SFX.play('victory');
  if (cur.n === VICTORY_WAVE && !G.victory) {
    G.victory = true;
    if (typeof G.onVictory === 'function') G.onVictory();
  }
  saveGame();
}

function roundAll(o) { const r = {}; for (const k in o) r[k] = Math.round(o[k]); return r; }
// Damage enemies did to structures and lots, by attacker type (wave report: what hurt the city most)
export function logDamage(by, dmg) {
  const cur = G.wave.cur;
  if (cur && by) cur.dmgBy[by] = (cur.dmgBy[by] || 0) + dmg;
}

// Send the next raid now for $20 per second left on the clock. Returns the bonus paid.
export function earlyBonus() {
  const w = G.wave;
  return w.state === 'prep' && G.raidsOn ? Math.floor(Math.max(0, w.timer)) * MONEY.callEarlyPerSec : 0;
}
export function callWaveEarly() {
  const w = G.wave;
  if (w.state !== 'prep' || !G.raidsOn) return 0;
  const bonus = earlyBonus();
  addSpoils(bonus, 'early');
  w.timer = 0;
  return bonus;
}
// Sandbox switch (raids on / off). Turning raids on in sandbox starts the usual clock.
export function setRaids(on) { G.raidsOn = !!on; }

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
export function compass(angle) {
  // angle measured from +z; the camera starts looking towards -z, so -z is "north"
  const a = ((Math.atan2(Math.sin(angle), -Math.cos(angle)) / (Math.PI * 2)) * 8 + 8.5) % 8;
  return COMPASS[Math.floor(a)];
}
export function describeDirs(dirs) {
  const names = [...new Set(dirs.map(compass))];
  return 'Incoming from the ' + names.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.';
}

// ------------------------------------------------------------------ spawning

function edgeTileNear(angle) {
  let best = W.edge[0], bd = 9;
  for (const i of W.edge) {
    const d = Math.abs(angleDiff(Math.atan2(W.x[i], W.z[i]), angle));
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function baseUnit(type, def, team) {
  return {
    type, def, team, domain: def.domain || 'ground',
    x: 0, y: 0, z: 0, yaw: 0, bank: 0, pitch: 0, vx: 0, vy: 0, vz: 0,
    hp: def.hp, maxHp: def.hp, alive: true, dying: 0, gone: false,
    state: 'approach', path: null, pi: 0, tt: -1, foe: null, landTile: -1,
    cool: rnd(0.5, 2), think: rnd(0, 0.5), phase: rnd(0, 6.28), ox: rnd(-0.3, 0.3), oz: rnd(-0.3, 0.3),
    born: G.time, hitT: 0, sabT: 0, atkT: 0, skip0: -1, skip1: -1, skip2: -1,
  };
}

export function spawnEnemy(type, angle, wave) {
  const def = ENEMIES[type];
  const e = baseUnit(type, def, 'E');
  e.hp = e.maxHp = def.hp * hpMul(wave);
  e.dm = dmgMul(wave);
  e.wave = wave;
  if (def.domain === 'sea') {
    const t = edgeTileNear(angle);
    e.x = W.x[t]; e.z = W.z[t];
    e.yaw = Math.atan2(-e.x, -e.z);
    if (def.troops) e.troops = def.troops + Math.floor((wave - 1) / 4);
  } else {
    const r = 72;
    e.x = Math.sin(angle) * r; e.z = Math.cos(angle) * r;
    e.alt = def.alt + rnd(0, 1.5);
    e.y = e.alt;
    e.yaw = angle + Math.PI;
    e.bombs = def.bombs || 0;
    e.rockets = def.rockets || 0;
    e.passes = 0;
    if (type === 'bomber') {
      const aim = pickAirTarget(e);
      const ax = (aim >= 0 ? W.x[aim] : G.hq ? G.hq.x : 0) + rnd(-2.5, 2.5), az = (aim >= 0 ? W.z[aim] : G.hq ? G.hq.z : 0) + rnd(-2.5, 2.5);
      const dx = ax - e.x, dz = az - e.z, l = Math.hypot(dx, dz) || 1;
      e.tt = aim;
      e.wpx = ax; e.wpz = az;
      e.exx = ax + (dx / l) * 90; e.exz = az + (dz / l) * 90;
      e.gcool = 0;
    }
    SFX.play('plane', e.x, e.z);
  }
  G.enemies.push(e);
  return e;
}

export function spawnInfantry(x, z, wave) {
  const def = ENEMIES.infantry;
  const e = baseUnit('infantry', def, 'E');
  e.hp = e.maxHp = def.hp * hpMul(wave);
  e.dm = dmgMul(wave);
  e.wave = wave;
  e.x = x + rnd(-0.35, 0.35); e.z = z + rnd(-0.35, 0.35);
  e.y = groundY(e.x, e.z);
  e.yaw = Math.atan2(-e.x, -e.z);
  G.enemies.push(e);
  return e;
}

function spawnSoldier(home, type = 'soldier') {
  const def = ALLIES[type];
  const s = baseUnit(type, def, 'A');
  s.hp = s.maxHp = def.hp * G.mod.soldier;
  s.home = home;
  const a = rnd(0, 6.28);
  s.postX = home.x + Math.cos(a) * rnd(0.9, 1.6);
  s.postZ = home.z + Math.sin(a) * rnd(0.9, 1.6);
  s.x = home.x; s.z = home.z; s.y = home.y;
  home.units.push(s);
  G.allies.push(s);
  FX.dust(s.x, s.y, s.z, 0.4);
  return s;
}

function spawnFighter(home, slot) {
  const def = ALLIES.fighter;
  const f = baseUnit('ally_fighter', def, 'A');
  f.domain = 'air';
  f.hp = f.maxHp = def.hp;
  f.home = home;
  f.slot = slot;
  f.alt = 4.5;
  f.state = 'parked';
  parkFighter(f);
  home.units.push(f);
  G.allies.push(f);
}

function parkFighter(f) {
  const h = f.home;
  const off = -0.55 + f.slot * 0.42;
  f.x = h.x + Math.cos(h.yaw) * 0.18 + Math.sin(h.yaw) * off;
  f.z = h.z - Math.sin(h.yaw) * 0.18 + Math.cos(h.yaw) * off;
  f.y = h.y + 0.1;
  f.yaw = h.yaw;
  f.bank = 0; f.pitch = 0; f.speed = 0;
  f.vx = f.vy = f.vz = 0;
}

// ------------------------------------------------------------------ targets (tiles: a structure or a zoned lot)

const occupied = (i) => i >= 0 && (W.bld[i] ? true : isLot(i));
const tAlive = occupied;

// First tile matching pred in rings of growing hex distance round `center` (nearest by hex distance)
function ringSearch(center, maxR, pred) {
  if (center < 0) return -1;
  if (pred(center)) return center;
  const q0 = W.q[center], r0 = W.r[center];
  for (let k = 1; k <= maxR; k++) {
    let q = q0 + DIRS[4][0] * k, r = r0 + DIRS[4][1] * k;
    for (let side = 0; side < 6; side++) {
      for (let s = 0; s < k; s++) {
        const j = tileIndex(q, r);
        if (j >= 0 && pred(j)) return j;
        q += DIRS[side][0]; r += DIRS[side][1];
      }
    }
  }
  return -1;
}

// Could a ship with this range shell tile i from the water?
const shellable = (i, range) => waterDistance(i) * STEP <= range * 0.85 + 0.9;

// Weighted pick in pickAirTarget style: weight x 1 / (1 + d / 25)
const candT = [], candW = [];
function weightedPick() {
  let sum = 0;
  for (const w of candW) sum += w;
  if (sum <= 0) return -1;
  let r = rand() * sum;
  for (let k = 0; k < candT.length; k++) { r -= candW[k]; if (r <= 0) return candT[k]; }
  return candT[candT.length - 1];
}
const near = (e, i) => 1 / (1 + Math.hypot(W.x[i] - e.x, W.z[i] - e.z) / 25);

function pickShipTarget(e) {
  const d = e.def, range = d.range;
  const ok = (i) => occupied(i) && triedStamp[i] !== triedN && shellable(i, range);
  const start = startTile(e, true);
  if (d.aim === 'hq') {
    const hq = G.hq;
    if (hq && hq.alive && hqShore && triedStamp[hq.tile] !== triedN) return hq.tile;
    // the tower nearest the Town Hall that can be reached from the water
    let best = -1, bd = Infinity;
    for (const b of G.buildings) {
      if (!b.alive || !MIL(b) || !ok(b.tile)) continue;
      const dd = hq ? Math.hypot(b.x - hq.x, b.z - hq.z) : 0;
      if (dd < bd) { bd = dd; best = b.tile; }
    }
    if (best >= 0) return best;
  } else if (d.aim === 'military') {
    candT.length = 0; candW.length = 0;
    for (const b of G.buildings) {
      if (!b.alive || !ok(b.tile)) continue;
      candT.push(b.tile); candW.push((MIL(b) ? 3 : 1) * near(e, b.tile));
    }
    const lot = ringSearch(start, 2 * W.R, (i) => !W.bld[i] && ok(i));
    if (lot >= 0) { candT.push(lot); candW.push(near(e, lot)); }
    const t = weightedPick();
    if (t >= 0) return t;
  }
  // gunboats (and the fall-back for everyone): the nearest structure or lot reachable from the water
  return ringSearch(start, 2 * W.R, ok);
}

// Air targets: per-type weights over player structures plus a sample of zoned lots (concrete_specs 17).
// The lots as a group weigh about as much as 24 lots so the named targets stay the main ones.
function airWeightB(aim, b) {
  switch (aim) {
    case 'towers': return MIL(b) ? 4 : b.def.kind === 'utility' ? 2 : 1;
    case 'utilities': return b.type !== 'hq' && b.def.power > 0 ? 6 : b.type !== 'hq' && b.def.water > 0 ? 4 : 0.5;
    case 'hightech': return b.type === 'radar' ? 6 : b.type === 'missile' || b.type === 'airfield' ? 5 : b.type === 'flak' ? 3 : MIL(b) ? 1 : 0.3;
    default: return 1;
  }
}
function airWeightLot(aim, i) {
  if (aim === 'utilities') return W.zone[i] === 3 ? 2 : W.lvl[i] >= 3 ? 1.5 : 0.5;
  if (aim === 'hightech') return 0.3;
  return 1;
}
function pickAirTarget(e) {
  const aim = e.def.aim;
  candT.length = 0; candW.length = 0;
  for (const b of G.buildings) {
    if (!b.alive) continue;
    candT.push(b.tile); candW.push(airWeightB(aim, b) * near(e, b.tile));
  }
  const N = LOTLIST.length;
  if (N) {
    const S = Math.min(12, N), scale = Math.min(N, 24) / S;
    for (let s = 0; s < S; s++) {
      const i = LOTLIST[Math.floor(rand() * N)];
      if (!isLot(i)) continue;
      candT.push(i); candW.push(airWeightLot(aim, i) * scale * near(e, i));
    }
  }
  return weightedPick();
}

// ------------------------------------------------------------------ damage

export function damageEnemy(e, dmg, src) {
  if (!e.alive) return;
  const dealt = Math.min(e.hp, dmg);
  e.hp -= dmg;
  e.hitT = 0.12;
  if (src && src.dmgDealt != null) src.dmgDealt += dealt;
  if (e.hp > 0) return;
  e.hp = 0;
  e.alive = false;
  if (e.team === 'E') {
    G.stats.kills++;
    const gold = Math.round((e.def.bounty || 0) * (1 + 0.03 * (e.wave || 1)));
    addSpoils(gold, 'bounty');
    FX.bounty(e.x, e.y + 0.5, e.z, gold);
    if (src && src.kills != null) src.kills++;
    const cur = G.wave.cur;
    if (cur) { cur.kills[e.type] = (cur.kills[e.type] || 0) + 1; cur.killsTotal++; }
  }
  if (e.domain === 'sea') {
    e.dying = 3.5;
    FX.explosion(e.x, 0.3, e.z, e.def.radius * 1.3, true);
    SFX.play('boomBig', e.x, e.z);
    FX.shake(e.x, e.z, 0.3 * e.def.radius);
  } else if (e.domain === 'air') {
    e.dying = 6;
    e.vy = 0;
    FX.explosion(e.x, e.y, e.z, 0.6, false);
    SFX.play('boom', e.x, e.z);
  } else {
    e.dying = 0.01;
    FX.dust(e.x, e.y, e.z, 0.5);
  }
  if (e.team === 'A' && e.home && e.home.units) {
    const k = e.home.units.indexOf(e);
    if (k >= 0) e.home.units.splice(k, 1);
    if (e.type === 'ally_fighter') e.home.respawn.push(G.time + 22);
  }
}

export function shake(x, z, amount) { FX.shake(x, z, amount); }

// Enemy explosions: damage every structure or lot whose tile centre is within reach, plus allies. Only the tile
// that was hit rolls for fire (concrete_specs 18: explosive hits ignite); its neighbours take 'splash' damage.
function splashTiles(x, z, r, dmg, kind, by) {
  const c = tileAt(x, z);
  if (c >= 0) {
    const reach = r + 0.4;
    tilesWithin(c, Math.ceil(reach / STEP), tmp2);
    for (let k = 0; k < tmp2.length; k++) {
      const j = tmp2[k];
      if (!occupied(j)) continue;
      const d = Math.hypot(W.x[j] - x, W.z[j] - z);
      if (d > reach) continue;
      const dd = dmg * (1 - 0.5 * Math.min(1, d / (r + 0.7)));
      logDamage(by, dd);
      damageTile(j, dd, j === c ? kind : 'splash');
    }
  }
  const r2 = r * r;
  for (const a of G.allies) {
    if (!a.alive || a.domain !== 'ground') continue;
    const dx = a.x - x, dz = a.z - z;
    if (dx * dx + dz * dz <= r2) damageEnemy(a, dmg * 0.5);
  }
}

function splashEnemies(x, y, z, r, dmg, hits, src) {
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const m = hits[e.domain];
    if (!m) continue;
    const dx = e.x - x, dz = e.z - z, dy = e.domain === 'air' ? e.y - y : 0;
    const er = e.def.radius || 0.4;
    const d2 = dx * dx + dz * dz + dy * dy;
    if (d2 > (r + er) * (r + er)) continue;
    const f = 1 - 0.5 * Math.min(1, Math.sqrt(d2) / (r + er));
    damageEnemy(e, dmg * m * f, src);
  }
}

// ------------------------------------------------------------------ projectiles

function addProj(p) { G.projectiles.push(p); return p; }

export function tracer(sx, sy, sz, ex, ey, ez, enemy = false) {
  addProj({ kind: 'tracer', sx, sy, sz, ex, ey, ez, t: 0, T: 0.09, enemy });
}

function shellTo(sx, sy, sz, ex, ez, dmg, splash, team, hits, src, speed = 16) {
  const dist = Math.hypot(ex - sx, ez - sz);
  const ti = tileAt(ex, ez);
  const ey = ti >= 0 && isLand(W.type[ti]) ? W.h[ti] : 0;
  return addProj({
    kind: 'shell', sx, sy, sz, ex, ey, ez, x: sx, y: sy, z: sz, t: 0, T: 0.45 + dist / speed, apex: 0.5 + dist * 0.16,
    dmg, splash, team, hits, src, water: ey === 0,
  });
}

function updateProjectiles(dt) {
  const P = G.projectiles;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    let done = false;
    switch (p.kind) {
      case 'tracer':
        p.t += dt;
        done = p.t >= p.T;
        break;
      case 'shell': {
        p.t += dt;
        const k = Math.min(1, p.t / p.T);
        p.x = lerp(p.sx, p.ex, k); p.z = lerp(p.sz, p.ez, k);
        p.y = lerp(p.sy, p.ey, k) + p.apex * 4 * k * (1 - k);
        if (k >= 1) {
          done = true;
          if (p.team === 'P') splashEnemies(p.x, p.y, p.z, p.splash, p.dmg, p.hits, p.src);
          else splashTiles(p.x, p.z, p.splash, p.dmg, 'shell', p.by);
          FX.explosion(p.x, p.y, p.z, 0.45 + p.splash * 0.3, p.water);
          SFX.play(p.water ? 'splash' : 'boom', p.x, p.z);
          if (!p.water) FX.shake(p.x, p.z, 0.08);
        }
        break;
      }
      case 'flak': {
        p.t += dt;
        const k = Math.min(1, p.t / p.T);
        p.x = lerp(p.sx, p.ex, k); p.y = lerp(p.sy, p.ey, k); p.z = lerp(p.sz, p.ez, k);
        if (k >= 1) {
          done = true;
          splashEnemies(p.x, p.y, p.z, p.splash, p.dmg, FLAK_HITS, p.src);
          FX.flakBurst(p.x, p.y, p.z, 0.6 + p.splash * 0.2);
          SFX.play('flakBurst', p.x, p.z);
        }
        break;
      }
      case 'bomb': {
        p.vy -= GRAV * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const gy = groundY(p.x, p.z);
        if (p.y <= gy) {
          done = true;
          const water = gy === 0;
          splashTiles(p.x, p.z, p.splash, p.dmg, 'bomb', p.by);
          FX.explosion(p.x, gy, p.z, 0.9, water);
          SFX.play(water ? 'splash' : 'boom', p.x, p.z);
          FX.shake(p.x, p.z, 0.18);
        }
        break;
      }
      case 'rocket': {
        p.t += dt;
        const k = Math.min(1, p.t / p.T);
        p.x = lerp(p.sx, p.ex, k); p.y = lerp(p.sy, p.ey, k); p.z = lerp(p.sz, p.ez, k);
        p.trailT = (p.trailT || 0) - dt;
        if (p.trailT <= 0) { p.trailT = 0.025; FX.trail(p.x, p.y, p.z, 0.8); }
        if (k >= 1) {
          done = true;
          splashTiles(p.x, p.z, p.splash, p.dmg, 'rocket', 'jet');
          FX.explosion(p.x, p.y, p.z, 0.8, p.ey === 0);
          SFX.play('boom', p.x, p.z);
          FX.shake(p.x, p.z, 0.15);
        }
        break;
      }
      case 'missile': {
        p.t += dt;
        const tg = p.target;
        if (!tg || !tg.alive) {
          p.target = null;
          // find something else nearby, else keep flying and self-destruct
          let best = null, bd = 64;
          for (const e of G.enemies) {
            if (!e.alive || !p.hits[e.domain]) continue;
            const d2 = (e.x - p.x) ** 2 + (e.z - p.z) ** 2;
            if (d2 < bd) { bd = d2; best = e; }
          }
          p.target = best;
        }
        const speed = 15;
        if (p.target) {
          const t = p.target;
          const ty = t.domain === 'air' ? t.y : 0.3;
          const dx = t.x - p.x, dy = ty - p.y, dz = t.z - p.z;
          const l = Math.hypot(dx, dy, dz) || 1;
          if (l < 0.7) {
            done = true;
            damageEnemy(t, p.dmg * (p.hits[t.domain] || 1), p.src);
            splashEnemies(p.x, p.y, p.z, p.splash, p.dmg * 0.4, p.hits, p.src);
            FX.explosion(p.x, p.y, p.z, 0.8, t.domain === 'sea');
            SFX.play('boom', p.x, p.z);
            break;
          }
          const steer = Math.min(1, dt * (p.t < 0.35 ? 2 : 7));
          p.vx += (dx / l * speed - p.vx) * steer;
          p.vy += (dy / l * speed - p.vy) * steer;
          p.vz += (dz / l * speed - p.vz) * steer;
        }
        const vl = Math.hypot(p.vx, p.vy, p.vz) || 1;
        p.vx *= speed / vl; p.vy *= speed / vl; p.vz *= speed / vl;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.trailT = (p.trailT || 0) - dt;
        if (p.trailT <= 0) { p.trailT = 0.02; FX.trail(p.x, p.y, p.z, 1); }
        if (p.t > 5 || p.y < groundY(p.x, p.z) - 0.1) {
          done = true;
          FX.explosion(p.x, Math.max(p.y, 0), p.z, 0.5, p.y <= 0.05);
        }
        break;
      }
    }
    if (done) { P[i] = P[P.length - 1]; P.pop(); }
  }
}
const FLAK_HITS = { air: 1 };

// ------------------------------------------------------------------ towers: targeting modes (concrete_specs 15)

export const TARGET_MODES = ['first', 'nearest', 'strongest', 'weakest'];
export const DOMAIN_PREFS = ['any', 'sea', 'air', 'ground'];

// Distance from an enemy to its own objective ("First" targets the one closest to doing damage)
function objectiveDist(e) {
  if (e.domain === 'air') {
    if (!(e.bombs > 0 || e.rockets > 0)) return 999;
    if (e.type === 'bomber') return Math.hypot(e.wpx - e.x, e.wpz - e.z);
    return e.tt >= 0 ? Math.hypot(W.x[e.tt] - e.x, W.z[e.tt] - e.z) : 999;
  }
  let t = e.tt;
  if (e.domain === 'sea' && e.def.troops) t = e.landTile;
  else if (e.domain === 'ground' && t < 0 && G.hq) t = G.hq.tile;
  if (t < 0) return 500;
  const dd = Math.hypot(W.x[t] - e.x, W.z[t] - e.z);
  return e.domain === 'sea' && !e.def.troops ? Math.max(0, dd - e.def.range) : dd;
}

// Higher is better; `m` is the weapon's multiplier against the enemy's domain
function scoreOf(mode, b, e, m) {
  switch (mode) {
    case 'first': return 1 / (1 + objectiveDist(e));
    case 'strongest': return e.hp;
    case 'weakest': return 1 / (1 + e.hp);
    default: { const d2 = (e.x - b.x) ** 2 + (e.z - b.z) ** 2; return m / (d2 + 0.01); }
  }
}

// Best enemy in range by the tower's mode; the domain preference wins whenever one of that domain is in range
function acquire(b, range, targets) {
  let best = null, bv = -1, bestP = null, bvP = -1;
  const r2 = range * range, pref = b.domainPref || 'any', mode = b.targetMode || 'nearest';
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const m = targets[e.domain];
    if (!m) continue;
    const dx = e.x - b.x, dz = e.z - b.z;
    if (dx * dx + dz * dz > r2) continue;
    const v = scoreOf(mode, b, e, m);
    if (v > bv) { bv = v; best = e; }
    if (pref !== 'any' && e.domain === pref && v > bvP) { bvP = v; bestP = e; }
  }
  if (bestP) { b.targetV = bvP; return bestP; }
  b.targetV = bv;
  return best;
}

// From the tower panel; copyTargeting does the Shift+click "same for every tower of this type"
export function setTargetMode(b, mode, pref) {
  if (!b) return 'Nothing selected';
  if (mode && TARGET_MODES.includes(mode)) b.targetMode = mode;
  if (pref && DOMAIN_PREFS.includes(pref)) b.domainPref = pref;
  b.scan = 0;
  return null;
}
export function copyTargeting(b) {
  let n = 0;
  for (const o of G.buildings) if (o !== b && o.type === b.type) { o.targetMode = b.targetMode; o.domainPref = b.domainPref; o.scan = 0; n++; }
  return n;
}

function fireWeapon(b, t, ws, w) {
  let mx, my, mz;
  if (b.type === 'hq') { mx = b.x - 0.3; my = b.y + 1.2; mz = b.z - 0.3; }
  else {
    const m = w.muzzle || 0.3;
    mx = b.x + Math.sin(b.headYaw) * m; my = b.y + (w.headY || 0.2) + 0.12; mz = b.z + Math.cos(b.headYaw) * m;
  }
  const dist = Math.hypot(t.x - b.x, t.z - b.z);
  G.stats.shots++;
  switch (w.kind) {
    case 'mg': {
      const acc = (w.acc || 0.8) * (t.domain === 'air' ? 0.75 : 1);
      const hit = rand() < acc;
      const ty = t.domain === 'air' ? t.y : t.y + (t.domain === 'ground' ? 0.18 : 0.2);
      const spread = hit ? 0.12 : 0.7;
      tracer(mx, my, mz, t.x + rnd(-spread, spread), ty + rnd(-spread, spread) * 0.5, t.z + rnd(-spread, spread));
      if (hit) damageEnemy(t, ws.dmg * w.targets[t.domain], b);
      if (rand() < 0.5) FX.muzzle(mx, my, mz, 0.6);
      SFX.play('mg', b.x, b.z);
      break;
    }
    case 'shell': {
      const T = 0.45 + dist / 16;
      const sc = 0.25 + dist * 0.03;
      const px = t.x + t.vx * T + rnd(-sc, sc), pz = t.z + t.vz * T + rnd(-sc, sc);
      shellTo(mx, my, mz, px, pz, ws.dmg, ws.splash, 'P', w.targets, b);
      FX.muzzle(mx, my, mz, 1.6);
      SFX.play('cannon', b.x, b.z);
      break;
    }
    case 'flak': {
      let T = Math.hypot(t.x - mx, t.y - my, t.z - mz) / 28;
      const px = t.x + t.vx * T, py = t.y + t.vy * T, pz = t.z + t.vz * T;
      T = Math.hypot(px - mx, py - my, pz - mz) / 28;
      const s = 0.55;
      addProj({ kind: 'flak', sx: mx, sy: my, sz: mz, ex: t.x + t.vx * T + rnd(-s, s), ey: t.y + t.vy * T + rnd(-s, s), ez: t.z + t.vz * T + rnd(-s, s), x: mx, y: my, z: mz, t: 0, T, dmg: ws.dmg, splash: ws.splash, src: b });
      FX.muzzle(mx, my, mz, 1.1);
      SFX.play('flak', b.x, b.z);
      break;
    }
    case 'missile': {
      const s = 6;
      addProj({ kind: 'missile', x: mx, y: my, z: mz, vx: Math.sin(b.headYaw) * s, vy: 8, vz: Math.cos(b.headYaw) * s, t: 0, target: t, dmg: ws.dmg, splash: ws.splash, hits: w.targets, src: b });
      FX.muzzle(mx, my, mz, 1.3);
      SFX.play('missile', b.x, b.z);
      break;
    }
  }
}

function updateWeapon(b, dt) {
  const w = b.def.weapon, ws = b.ws;
  // unconnected towers are unmanned; missile batteries also hold fire without power
  if (!b.connected || !ws || (b.def.power < 0 && !b.powered)) { b.target = null; b.headYaw += dt * 0.1; return; }
  b.cool -= dt; b.scan -= dt;
  let t = b.target;
  const r2 = ws.range * ws.range;
  if (t && (!t.alive || (t.x - b.x) ** 2 + (t.z - b.z) ** 2 > r2)) t = b.target = null;
  if (b.scan <= 0) {
    if (!t) {
      b.scan = 0.12 + rand() * 0.1;
      t = b.target = acquire(b, ws.range, w.targets);
    } else {
      // re-check every 0.5 s; switch only to a target at least 15 % better
      b.scan = 0.5;
      const m = w.targets[t.domain] || 1;
      const curV = scoreOf(b.targetMode, b, t, m);
      const cand = acquire(b, ws.range, w.targets);
      const prefOk = b.domainPref === 'any' || t.domain === b.domainPref || !cand || cand.domain !== b.domainPref;
      if (cand && cand !== t && (b.targetV >= curV * 1.15 || !prefOk)) t = b.target = cand;
    }
  }
  if (t) {
    const diff = angleDiff(Math.atan2(t.x - b.x, t.z - b.z), b.headYaw);
    const turn = (w.kind === 'mg' ? 10 : w.kind === 'flak' ? 5 : 3.2) * dt;
    b.headYaw += clamp(diff, -turn, turn);
    if (b.cool <= 0 && Math.abs(diff) < (w.aim || 0.6)) {
      fireWeapon(b, t, ws, w);
      // understaffed government jobs slow every tower except the Town Hall's own gun (never below half rate)
      const staff = b.type === 'hq' ? 1 : Math.max(0.5, Math.min(1, G.govStaffing));
      b.cool = Math.max(b.cool, -0.05) + 1 / (ws.rate * staff);
    }
  } else {
    b.headYaw += dt * 0.25;
    if (b.cool < 0) b.cool = 0;
  }
}

export function barracksCap(b) { return b.def.units + 2 * (b.level - 1) + G.mod.barracksCap; }
export function fighterCap(b) { return b.def.units + (b.level - 1); }
export function officerCap(b) { return b.def.officers || 0; }

export function updateBuildings(dt) {
  for (let k = G.buildings.length - 1; k >= 0; k--) {
    const b = G.buildings[k];
    if (!b) continue;
    if (b.flash > 0) b.flash = Math.max(0, b.flash - dt * 5);
    // repairs: 1.5 %/s once unhit for 6 s, paid at 20 % of cost x fraction healed, paused while overdrawn
    if (b.hp < b.maxHp && b.connected && G.time - b.lastHit > 6 && !W.fire[b.tile] && G.money >= 0) {
      const heal = Math.min(b.maxHp - b.hp, b.maxHp * 0.015 * G.mod.repair * dt);
      chargeRepair(MONEY.repairCostFrac * (b.invested || 0) * (heal / b.maxHp));
      b.hp += heal;
    }
    if (b.hp < b.maxHp * 0.55) {
      b.burnT -= dt;
      if (b.burnT <= 0) {
        b.burnT = 0.22 + rand() * 0.2;
        FX.smokePuff(b.x, b.y + 0.5, b.z, 0.8, 0.13);
        if (b.hp < b.maxHp * 0.3) FX.fire(b.x, b.y + 0.3, b.z, 0.8);
      }
    }
    if (b.type === 'radar') b.headYaw += dt * (b.connected && b.powered ? 1.6 : 0.2);
    else if (b.type === 'barracks') {
      if (b.connected && b.units.length < barracksCap(b)) {
        b.trainT += dt * Math.max(0.3, G.govStaffing);
        if (b.trainT >= 9) { b.trainT = 0; spawnSoldier(b, 'soldier'); }
      }
    } else if (b.type === 'police') {
      if (b.connected && b.powered && b.units.length < officerCap(b)) {
        b.trainT += dt;
        if (b.trainT >= 12) { b.trainT = 0; spawnSoldier(b, 'officer'); }
      }
    } else if (b.type === 'airfield') {
      // without power the airfield cannot rearm: no replacements and no new sorties
      if (b.connected && b.powered) {
        while (b.respawn.length && b.respawn[0] <= G.time) b.respawn.shift();
        if (b.units.length + b.respawn.length < fighterCap(b)) {
          let slot = 0;
          while (b.units.some((u) => u.slot === slot)) slot++;
          spawnFighter(b, slot);
        }
      }
    }
    if (b.ws) updateWeapon(b, dt);
  }
}

// ------------------------------------------------------------------ ships

const seaCost = (j) => (isWater(W.type[j]) ? 1 : 0);
const landCost = (j) => {
  const t = W.type[j];
  if (!isWalkable(t)) return 0;
  return W.road[j] ? 0.5 : t === T.FOREST ? 1.5 : t === T.HILLS ? 2 : 1;
};

function startTile(e, water) {
  const i = tileAt(e.x, e.z);
  if (i >= 0 && (water ? isWater(W.type[i]) : isWalkable(W.type[i]))) return i;
  // nudge to the nearest suitable neighbour
  let best = -1, bd = Infinity;
  if (i < 0) return -1;
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[i * 6 + d];
    if (j < 0) continue;
    if (water ? isWater(W.type[j]) : isWalkable(W.type[j])) {
      const dd = (W.x[j] - e.x) ** 2 + (W.z[j] - e.z) ** 2;
      if (dd < bd) { bd = dd; best = j; }
    }
  }
  return best;
}

function planShipAttack(e) {
  triedN++;
  if (triedN > 0xfffffff0) { triedStamp.fill(0); triedN = 1; }
  const start = startTile(e, true);
  const r = e.def.range * 0.85;
  for (let attempt = 0; attempt < 4; attempt++) {
    const target = pickShipTarget(e);
    if (target < 0) break;
    triedStamp[target] = triedN;
    const tx = W.x[target], tz = W.z[target];
    const path = findPath(start, seaCost,
      (j) => Math.hypot(W.x[j] - tx, W.z[j] - tz) <= r,
      (j) => Math.max(0, Math.hypot(W.x[j] - tx, W.z[j] - tz) - r) / STEP);
    if (path) { e.tt = target; e.path = path; e.pi = 1; e.idleT = 0; return true; }
  }
  // Nothing is within reach of the water: close in as far as possible, and withdraw later if still out of range
  const target = ringSearch(start, 2 * W.R, occupied);
  if (target < 0) return false;
  let best = -1, bd = Infinity;
  for (const i of W.shore) {
    const d = (W.x[i] - W.x[target]) ** 2 + (W.z[i] - W.z[target]) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  if (best < 0) return false;
  const path = findPath(start, seaCost, (j) => j === best, (j) => Math.hypot(W.x[j] - W.x[best], W.z[j] - W.z[best]) / STEP);
  if (!path) return false;
  e.tt = target; e.path = path; e.pi = 1; e.idleT = 0;
  return true;
}

// Landing craft head for the beach nearest the richest neighbourhood (highest land value cluster)
function planLanding(e) {
  const goal = lvCluster();
  const gx = W.x[goal], gz = W.z[goal];
  let best = -1, bs = Infinity, land = -1;
  for (const i of W.landing) {
    let lt = -1, ld = Infinity;
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[i * 6 + d];
      if (j >= 0 && isWalkable(W.type[j])) {
        const dd = Math.hypot(W.x[j] - gx, W.z[j] - gz);
        if (dd < ld) { ld = dd; lt = j; }
      }
    }
    if (lt < 0) continue;
    const s = Math.hypot(W.x[i] - e.x, W.z[i] - e.z) + 0.7 * ld + rand() * 6;
    if (s < bs) { bs = s; best = i; land = lt; }
  }
  if (best < 0) return false;
  const start = startTile(e, true);
  const path = findPath(start, seaCost, (j) => j === best, (j) => Math.hypot(W.x[j] - W.x[best], W.z[j] - W.z[best]) / STEP);
  if (!path) return false;
  e.path = path; e.pi = 1; e.landTile = land;
  return true;
}

function planExit(e) {
  const start = startTile(e, true);
  const R = W.R;
  const path = findPath(start, seaCost, (j) => hexDist(W.q[j], W.r[j], 0, 0) >= R, (j) => R - hexDist(W.q[j], W.r[j], 0, 0));
  e.path = path; e.pi = 1;
}

function followSeaPath(e, dt) {
  const d = e.def;
  if (!e.path || e.pi >= e.path.length) { e.vx *= 0.95; e.vz *= 0.95; e.x += e.vx * dt; e.z += e.vz * dt; return true; }
  const t = e.path[e.pi];
  const dx = W.x[t] - e.x, dz = W.z[t] - e.z, dist = Math.hypot(dx, dz);
  const last = e.pi === e.path.length - 1;
  if (dist < (last ? 0.4 : 1.0)) { e.pi++; return e.pi >= e.path.length; }
  const diff = angleDiff(Math.atan2(dx, dz), e.yaw);
  e.yaw += clamp(diff, -d.turn * dt, d.turn * dt);
  const sf = clamp(1 - Math.abs(diff) / 1.5, 0.2, 1) * (last ? clamp(dist / 1.5, 0.3, 1) : 1);
  const sp = d.speed * sf;
  const nx = e.x + Math.sin(e.yaw) * sp * dt, nz = e.z + Math.cos(e.yaw) * sp * dt;
  const ti = tileAt(nx, nz);
  if (ti < 0 || isWater(W.type[ti])) {
    e.vx = (nx - e.x) / dt; e.vz = (nz - e.z) / dt;
    e.x = nx; e.z = nz;
  } else {
    // a corner of land is in the way: the straight line to the next water tile centre is clear, so take it
    const st = Math.min(dist, d.speed * 0.6 * dt);
    e.vx = (dx / dist) * d.speed * 0.6; e.vz = (dz / dist) * d.speed * 0.6;
    e.x += (dx / dist) * st; e.z += (dz / dist) * st;
    e.yaw += clamp(diff, -d.turn * 2 * dt, d.turn * 2 * dt);
  }
  return false;
}

function updateShip(e, dt) {
  const d = e.def;
  if (e.dying) {
    e.dying -= dt;
    e.y -= dt * 0.22 * (1 + d.radius);
    e.pitch += dt * 0.12;
    e.bank += dt * 0.08;
    if (rand() < dt * 8) FX.smokePuff(e.x + rnd(-0.3, 0.3), Math.max(0, e.y + 0.4), e.z + rnd(-0.3, 0.3), d.radius, 0.1);
    if (rand() < dt * 6) FX.fire(e.x, Math.max(0, e.y + 0.2), e.z, d.radius);
    if (e.dying <= 0) e.gone = true;
    return;
  }
  e.think -= dt;
  e.cool -= dt;
  if (e.state === 'leave' && !d.troops) {
    if (!e.path && e.think <= 0 && canPlan()) { e.think = 2; planExit(e); if (!e.path) e.gone = true; }
    if (e.path && followSeaPath(e, dt)) e.gone = true;
  } else if (d.troops) {
    if (e.state === 'approach') {
      if (!e.path && e.think <= 0 && canPlan()) { e.think = 1; if (!planLanding(e)) e.state = 'leave'; }
      if (e.path && followSeaPath(e, dt)) {
        const lt = e.landTile;
        for (let k = 0; k < e.troops; k++) spawnInfantry(W.x[lt], W.z[lt], e.wave);
        e.troops = 0;
        e.state = 'leave';
        e.path = null; e.think = 1.5;
        SFX.play('landing', e.x, e.z);
        checkBeachDefence(lt);
      }
    } else {
      if (!e.path && e.think <= 0 && canPlan()) { e.think = 2; planExit(e); }
      if (e.path && followSeaPath(e, dt)) e.gone = true;
      if (!e.path && e.think > 1.9) e.gone = true; // nowhere to go
    }
  } else {
    if (!tAlive(e.tt) && e.think <= 0 && canPlan()) {
      e.think = 0.8;
      e.tt = -1;
      if (!planShipAttack(e)) { e.path = null; e.state = 'leave'; }
    }
    const t = tAlive(e.tt) ? e.tt : -1;
    const tdist = t >= 0 ? Math.hypot(W.x[t] - e.x, W.z[t] - e.z) : Infinity;
    // stop as soon as the target is in range rather than fighting other ships for the exact spot
    let arrived;
    if (tdist <= d.range * 0.92) {
      arrived = true;
      e.vx *= 1 - Math.min(1, dt * 2); e.vz *= 1 - Math.min(1, dt * 2);
      e.x += e.vx * dt; e.z += e.vz * dt;
    } else {
      arrived = followSeaPath(e, dt);
      const end = e.path && e.path.length ? e.path[e.path.length - 1] : -1;
      const nearEnd = arrived || (end >= 0 && Math.hypot(W.x[end] - e.x, W.z[end] - e.z) < 1.8);
      // parked with nothing in range for a while: give up and sail away
      if (t >= 0 && nearEnd) {
        e.idleT = (e.idleT || 0) + dt;
        if (e.idleT > 20) { e.state = 'leave'; e.path = null; e.think = 0; }
      }
    }
    if (t >= 0) {
      const tx = W.x[t], tz = W.z[t];
      if (arrived) {
        const diff = angleDiff(Math.atan2(tx - e.x, tz - e.z) + Math.PI / 2 * (e.phase > 3.14 ? 1 : -1) * (d.radius > 0.8 ? 1 : 0), e.yaw);
        e.yaw += clamp(diff, -d.turn * 0.5 * dt, d.turn * 0.5 * dt);
      }
      if (tdist <= d.range && e.cool <= 0) {
        e.cool = (1 / d.rate) * rnd(0.85, 1.15);
        const sc = 0.4 + tdist * 0.06;
        const sx = e.x + Math.sin(e.yaw) * d.radius * 0.5, sz = e.z + Math.cos(e.yaw) * d.radius * 0.5;
        shellTo(sx, 0.45, sz, tx + rnd(-sc, sc), tz + rnd(-sc, sc), d.dmg * e.dm, d.splash, 'E', null, e, 13).by = e.type;
        FX.muzzle(sx, 0.45, sz, 0.8 + d.radius);
        SFX.play(d.radius > 0.8 ? 'cannon' : 'gun', e.x, e.z);
      }
    }
  }
  // keep ships from stacking
  for (const o of G.enemies) {
    if (o === e || o.domain !== 'sea' || o.dying) continue;
    const dx = e.x - o.x, dz = e.z - o.z, d2 = dx * dx + dz * dz;
    const min = d.radius + o.def.radius;
    if (d2 < min * min && d2 > 1e-4) {
      const l = Math.sqrt(d2), push = (min - l) * 0.5 * Math.min(1, dt * 4);
      const nx = e.x + (dx / l) * push, nz = e.z + (dz / l) * push;
      const ti = tileAt(nx, nz);
      if (ti >= 0 && isWater(W.type[ti])) { e.x = nx; e.z = nz; }
    }
  }
  e.y = Math.sin(G.time * 1.6 + e.phase) * 0.03;
  e.pitch = Math.sin(G.time * 1.3 + e.phase) * 0.025;
  e.bank = Math.sin(G.time * 1.1 + e.phase * 2) * 0.035;
  const sp2 = e.vx * e.vx + e.vz * e.vz;
  if (sp2 > 0.3) {
    e.wakeT = (e.wakeT || 0) - dt;
    if (e.wakeT <= 0) {
      e.wakeT = 0.07;
      FX.wake(e.x - Math.sin(e.yaw) * d.radius * 0.8, e.z - Math.cos(e.yaw) * d.radius * 0.8, d.radius);
    }
  }
}

// Advisor hint: raiders came ashore with no MG post or barracks within 6 tiles
function checkBeachDefence(lt) {
  if (G.hints.beach != null || lt < 0) return;
  const q0 = W.q[lt], r0 = W.r[lt];
  const covered = G.buildings.some((b) => (b.type === 'mg' || b.type === 'barracks') && hexDist(W.q[b.tile], W.r[b.tile], q0, r0) <= 6);
  if (!covered) hint('beach', 'Raiders landed on a beach with no MG post or barracks within 6 tiles. Guard the beaches (shown in the Defence view).', W.x[lt], W.z[lt]);
}

// ------------------------------------------------------------------ aircraft

function steerPlane(e, tx, tz, dt, turn, speed) {
  const diff = angleDiff(Math.atan2(tx - e.x, tz - e.z), e.yaw);
  const step = clamp(diff, -turn * dt, turn * dt);
  e.yaw += step;
  e.bank += (clamp(-diff * 1.4, -1, 1) * 0.85 - e.bank) * Math.min(1, dt * 3);
  e.vx = Math.sin(e.yaw) * speed;
  e.vz = Math.cos(e.yaw) * speed;
  e.x += e.vx * dt; e.z += e.vz * dt;
  return diff;
}

function holdAlt(e, alt, dt, rate = 1.5) {
  const dy = clamp(alt - e.y, -rate * dt, rate * dt);
  e.y += dy;
  e.vy = dy / Math.max(dt, 1e-4);
  e.pitch += (clamp(-e.vy * 0.12, -0.5, 0.5) - e.pitch) * Math.min(1, dt * 3);
}

function crash(e, dt) {
  e.dying -= dt;
  e.vy -= GRAV * 0.7 * dt;
  e.y += e.vy * dt;
  e.x += e.vx * 0.85 * dt; e.z += e.vz * 0.85 * dt;
  e.bank += dt * 4;
  e.pitch = clamp(-e.vy * 0.08, -0.9, 0.9);
  e.trailT = (e.trailT || 0) - dt;
  if (e.trailT <= 0) { e.trailT = 0.03; FX.trail(e.x, e.y, e.z, 1.2, true); FX.fire(e.x, e.y, e.z, 0.5); }
  const gy = groundY(e.x, e.z);
  if (e.y <= gy || e.dying <= 0) {
    FX.explosion(e.x, gy, e.z, e.def.radius || 0.7, gy === 0);
    SFX.play(gy === 0 ? 'splash' : 'boom', e.x, e.z);
    e.gone = true;
  }
}

function dropBomb(e) {
  addProj({ kind: 'bomb', x: e.x, y: e.y - 0.15, z: e.z, vx: e.vx, vy: 0, vz: e.vz, dmg: e.def.bombDmg * e.dm, splash: e.def.splash, by: e.type });
  SFX.play('bombDrop', e.x, e.z);
}

function leave(e, dt) {
  const l = Math.hypot(e.x, e.z) || 1;
  steerPlane(e, e.x + (e.x / l) * 50, e.z + (e.z / l) * 50, dt, e.def.turn, e.def.speed);
  holdAlt(e, (e.alt || 4.5) + 2, dt);
  if (l > 80) e.gone = true;
}

function updateAttacker(e, dt, rockets) {
  const d = e.def;
  if (e.state === 'approach' || e.state === 'attack') {
    if (!tAlive(e.tt)) {
      e.tt = pickAirTarget(e);
      if (e.tt < 0) { e.state = 'leave'; return; }
    }
    const t = e.tt, tx = W.x[t], ty = W.h[t], tz = W.z[t];
    const dist = Math.hypot(tx - e.x, tz - e.z);
    const diff = steerPlane(e, tx, tz, dt, d.turn, d.speed);
    if (rockets) {
      holdAlt(e, Math.max(3.5, e.alt - (dist < 14 ? 2.5 : 0)), dt, 2);
      if (dist < 8.5 && Math.abs(diff) < 0.12 && e.rockets > 0) {
        for (let k = 0; k < 2 && e.rockets > 0; k++, e.rockets--) {
          const ox = Math.cos(e.yaw) * (k ? 0.3 : -0.3), oz = -Math.sin(e.yaw) * (k ? 0.3 : -0.3);
          const sx = e.x + ox, sz = e.z + oz;
          const dd = Math.hypot(tx - sx, ty - e.y, tz - sz);
          addProj({ kind: 'rocket', sx, sy: e.y - 0.1, sz, ex: tx + rnd(-0.4, 0.4), ey: ty + 0.2, ez: tz + rnd(-0.4, 0.4), x: sx, y: e.y, z: sz, t: 0, T: dd / 18, dmg: d.rocketDmg * e.dm, splash: d.splash });
        }
        SFX.play('missile', e.x, e.z);
        e.state = 'egress'; e.egT = 2.6; e.passes++;
      } else if (dist < 4 && Math.abs(diff) > 0.4) { e.state = 'egress'; e.egT = 2.0; e.passes++; }
    } else {
      holdAlt(e, e.alt, dt);
      const lead = d.speed * Math.sqrt((2 * Math.max(0.5, e.y - ty)) / GRAV);
      if (dist <= lead) {
        if (Math.abs(diff) < 0.12 || e.passes >= 4) { dropBomb(e); e.bombs--; }
        e.state = 'egress'; e.egT = 2.4; e.passes++;
      }
    }
  } else if (e.state === 'egress') {
    steerPlane(e, e.x + Math.sin(e.yaw) * 10, e.z + Math.cos(e.yaw) * 10, dt, d.turn, d.speed);
    holdAlt(e, e.alt, dt);
    e.egT -= dt;
    if (e.egT <= 0) {
      const ammo = rockets ? e.rockets : e.bombs;
      e.state = ammo > 0 && e.passes < 8 ? 'attack' : 'leave';
      e.tt = -1;
    }
  } else leave(e, dt);
}

function updateBomber(e, dt) {
  const d = e.def;
  if (e.state === 'approach') {
    steerPlane(e, e.wpx, e.wpz, dt, d.turn, d.speed);
    if (Math.hypot(e.wpx - e.x, e.wpz - e.z) < 3) e.state = 'run';
  } else {
    steerPlane(e, e.exx, e.exz, dt, d.turn, d.speed);
    if (Math.hypot(e.x, e.z) > 82) e.gone = true;
  }
  holdAlt(e, e.alt, dt);
  e.cool -= dt;
  if (e.bombs > 0 && e.cool <= 0) {
    const ft = Math.sqrt((2 * e.y) / GRAV);
    const ti = tileAt(e.x + e.vx * ft, e.z + e.vz * ft);
    if (occupied(ti)) { dropBomb(e); e.bombs--; e.cool = 0.32; }
  }
  // tail gunners
  e.gcool -= dt;
  if (e.gcool <= 0) {
    e.gcool = 0.4;
    for (const a of G.allies) {
      if (!a.alive || a.domain !== 'air' || a.state === 'parked') continue;
      const dd = Math.hypot(a.x - e.x, a.y - e.y, a.z - e.z);
      if (dd < 4.5) {
        tracer(e.x, e.y, e.z, a.x + rnd(-0.3, 0.3), a.y, a.z + rnd(-0.3, 0.3), true);
        if (rand() < 0.5) damageEnemy(a, 5 * e.dm);
        break;
      }
    }
  }
}

function updatePlane(e, dt) {
  if (e.dying) { crash(e, dt); return; }
  if (e.type === 'bomber') updateBomber(e, dt);
  else updateAttacker(e, dt, e.type === 'jet');
}

// ------------------------------------------------------------------ ground troops

function moveGround(u, tx, tz, speed, dt, force = false) {
  const dx = tx - u.x, dz = tz - u.z, l = Math.hypot(dx, dz);
  if (l < 0.02) { u.vx = u.vz = 0; return true; }
  const s = Math.min(l, speed * dt);
  let nx = u.x + (dx / l) * s, nz = u.z + (dz / l) * s;
  let ti = tileAt(nx, nz);
  if (!force && (ti < 0 || !isWalkable(W.type[ti]))) {
    // slide along whichever axis is open
    ti = tileAt(nx, u.z);
    if (ti >= 0 && isWalkable(W.type[ti])) nz = u.z;
    else { ti = tileAt(u.x, nz); if (ti >= 0 && isWalkable(W.type[ti])) nx = u.x; else { u.vx = u.vz = 0; return false; } }
  }
  u.vx = (nx - u.x) / dt; u.vz = (nz - u.z) / dt;
  u.x = nx; u.z = nz;
  u.yaw += clamp(angleDiff(Math.atan2(dx, dz), u.yaw), -8 * dt, 8 * dt);
  return l < speed * dt + 0.05;
}

function followLandPath(u, dt, speed) {
  if (!u.path || u.pi >= u.path.length) return true;
  const t = u.path[u.pi];
  const last = u.pi === u.path.length - 1;
  // aim for a spread-out spot on the tile; once wedged on a corner, push straight for the centre until there
  const tx = W.x[t] + (u.force ? 0 : u.ox), tz = W.z[t] + (u.force ? 0 : u.oz);
  const px = u.x, pz = u.z;
  const reached = moveGround(u, tx, tz, speed, dt, !!u.force);
  if (!u.force) {
    if (u.x === px && u.z === pz && !reached) { u.blockT = (u.blockT || 0) + dt; if (u.blockT > 0.3) u.force = true; }
    else u.blockT = 0;
  }
  if (reached || Math.hypot(tx - u.x, tz - u.z) < (last ? 0.15 : 0.5)) { u.pi++; u.blockT = 0; u.force = false; }
  return u.pi >= u.path.length;
}

function landPathTo(u, tile, near = 1) {
  const start = startTile(u, false);
  const tq = W.q[tile], tr = W.r[tile];
  return findPath(start, landCost, (j) => hexDist(W.q[j], W.r[j], tq, tr) <= near, (j) => Math.max(0, hexDist(W.q[j], W.r[j], tq, tr) - near) * 0.5, 3000);
}

function settleY(u, dt) {
  const gy = groundY(u.x, u.z);
  u.y += (gy - u.y) * Math.min(1, dt * 10);
}

// Raiders march on the Town Hall preferring roads and attack anything within reach on the way (concrete_specs 17):
//  - zoned lots they shoot while they keep marching; firing at the same lot for 4 s sets it on fire (sabotage)
//  - player structures (towers, utilities, services) they stop for, up to 8 s each, then march on
//  - the Town Hall they fight to the end; marines and officers in reach they fight first
// So a landing party torches its way to the Town Hall rather than levelling every block next to the beach.
const RAID_BLD_T = 8;
function nearestTargetInReach(e, reach) {
  const c = tileAt(e.x, e.z);
  if (c < 0) return -1;
  tilesWithin(c, 2, tmp);
  let best = -1, bd = reach;
  for (const j of tmp) {
    if (!occupied(j) || j === e.skip0 || j === e.skip1 || j === e.skip2) continue;
    // structures first (a lot only when no structure is in reach)
    const d = Math.hypot(W.x[j] - e.x, W.z[j] - e.z) + (W.bld[j] ? 0 : 3);
    if (d < bd + (W.bld[best] || best < 0 ? 0 : 3)) { bd = d; best = j; }
  }
  return best;
}

function raiderShoot(e, tx, ty, tz) {
  e.cool = (1 / e.def.rate) * rnd(0.8, 1.2);
  tracer(e.x, e.y + 0.2, e.z, tx + rnd(-0.2, 0.2), ty, tz + rnd(-0.2, 0.2), true);
  SFX.play('rifle', e.x, e.z);
}

function updateInfantry(e, dt) {
  const d = e.def;
  if (e.dying) { e.gone = true; return; }
  e.think -= dt; e.cool -= dt;
  const reach = d.range + 0.6;
  if (e.think <= 0) {
    e.think = rnd(0.35, 0.6);
    e.foe = null;
    let bd = d.range * d.range;
    for (const a of G.allies) {
      if (!a.alive || a.domain !== 'ground') continue;
      const dd = (a.x - e.x) ** 2 + (a.z - e.z) ** 2;
      if (dd < bd) { bd = dd; e.foe = a; }
    }
    // keep the current target while it stands and stays in reach
    if (!tAlive(e.tt) || Math.hypot(W.x[e.tt] - e.x, W.z[e.tt] - e.z) > reach) {
      const t = nearestTargetInReach(e, reach);
      if (t !== e.tt) { e.tt = t; e.sabT = 0; e.atkT = 0; }
    }
    if (!e.path && !e.noPath && G.hq && canPlan()) {
      e.path = landPathTo(e, G.hq.tile, 1);
      e.pi = 1;
      if (!e.path) e.noPath = true; // walled off by mountains: wreck what is in reach, else surrender
    }
  }
  const foe = e.foe && e.foe.alive ? e.foe : null;
  const tt = tAlive(e.tt) ? e.tt : -1;
  if (!foe && tt < 0 && !e.path) {
    // stranded with nowhere to march: they surrender rather than stall the wave
    e.stuckT = (e.stuckT || 0) + dt;
    if (e.stuckT > 20) { e.gone = true; e.alive = false; FX.dust(e.x, e.y, e.z, 0.4); }
    settleY(e, dt);
    return;
  }
  e.stuckT = 0;
  // fight marines / officers in reach (standing still)
  if (foe && Math.hypot(foe.x - e.x, foe.z - e.z) <= d.range) {
    e.vx = e.vz = 0;
    e.yaw += clamp(angleDiff(Math.atan2(foe.x - e.x, foe.z - e.z), e.yaw), -8 * dt, 8 * dt);
    if (e.cool <= 0) { raiderShoot(e, foe.x, foe.y + 0.25, foe.z); if (rand() < 0.7) damageEnemy(foe, d.dmg * e.dm); }
    settleY(e, dt);
    return;
  }
  let stop = false;
  if (tt >= 0 && Math.hypot(W.x[tt] - e.x, W.z[tt] - e.z) <= reach) {
    const isHQ = G.hq && tt === G.hq.tile;
    stop = !!W.bld[tt];   // structures are worth stopping for; lots get shot on the move
    if (e.cool <= 0) {
      raiderShoot(e, W.x[tt], W.h[tt] + 0.25, W.z[tt]);
      logDamage('infantry', d.dmg * e.dm);
      damageTile(tt, d.dmg * e.dm, 'bullet');
    }
    e.sabT += dt;
    e.atkT += dt;
    if (e.sabT >= 4 && !W.fire[tt] && isLot(tt)) { ignite(tt); e.sabT = -1e9; }
    if (stop && !isHQ && e.atkT >= RAID_BLD_T) {
      e.skip2 = e.skip1; e.skip1 = e.skip0; e.skip0 = tt;
      e.tt = -1; e.think = 0; stop = false;
    }
    if (stop) {
      e.vx = e.vz = 0;
      e.yaw += clamp(angleDiff(Math.atan2(W.x[tt] - e.x, W.z[tt] - e.z), e.yaw), -8 * dt, 8 * dt);
    }
  }
  if (!stop && e.path) {
    if (followLandPath(e, dt, d.speed)) e.path = null;
  } else if (!stop && !e.path && tt >= 0) {
    // at the end of the march with only lots in reach: keep firing where they stand
    e.vx = e.vz = 0;
  }
  settleY(e, dt);
}

// Marines (barracks) and police officers. Officers fight only raiders inside their station's coverage.
function updateSoldier(s, dt) {
  const d = ALLIES[s.type] || ALLIES.soldier;
  if (s.dying) { s.gone = true; return; }
  s.think -= dt; s.cool -= dt;
  const home = s.home && s.home.alive ? s.home : null;
  const gx = home ? home.x : s.x, gz = home ? home.z : s.z;
  const guard = home ? (s.type === 'officer' ? serviceRadius(home) * STEP : home.def.guard || 15) : 6;
  if (s.think <= 0) {
    s.think = rnd(0.3, 0.5);
    let best = null, bd = Infinity;
    for (const e of G.enemies) {
      if (!e.alive || e.domain !== 'ground') continue;
      if ((e.x - gx) ** 2 + (e.z - gz) ** 2 > guard * guard) continue;
      const dd = (e.x - s.x) ** 2 + (e.z - s.z) ** 2;
      if (dd < bd) { bd = dd; best = e; }
    }
    if (best !== s.foe) { s.foe = best; s.path = null; s.repath = 0; }
  }
  const f = s.foe && s.foe.alive ? s.foe : null;
  const dmg = d.dmg * G.mod.soldier;
  if (f) {
    const dist = Math.hypot(f.x - s.x, f.z - s.z);
    if (dist <= d.range) {
      s.vx = s.vz = 0;
      s.yaw += clamp(angleDiff(Math.atan2(f.x - s.x, f.z - s.z), s.yaw), -8 * dt, 8 * dt);
      if (s.cool <= 0) {
        s.cool = (1 / d.rate) * rnd(0.8, 1.2);
        tracer(s.x, s.y + 0.2, s.z, f.x + rnd(-0.15, 0.15), f.y + 0.2, f.z + rnd(-0.15, 0.15));
        if (rand() < 0.75) damageEnemy(f, dmg, s.home);
        SFX.play('rifle', s.x, s.z);
      }
    } else {
      s.repath = (s.repath || 0) - dt;
      if ((!s.path || s.repath <= 0) && canPlan()) {
        s.repath = 1.0;
        const ft = tileAt(f.x, f.z);
        s.path = ft >= 0 ? landPathTo(s, ft, 0) : null;
        s.pi = 1;
      }
      if (s.path && s.pi < s.path.length) followLandPath(s, dt, d.speed);
      else moveGround(s, f.x, f.z, d.speed, dt, true);
    }
  } else if (home) {
    const dist = Math.hypot(s.postX - s.x, s.postZ - s.z);
    if (dist > 3.5) {
      s.repath = (s.repath || 0) - dt;
      if ((!s.path || s.repath <= 0) && canPlan()) { s.repath = 2; s.path = landPathTo(s, home.tile, 0); s.pi = 1; }
      if (s.path) { if (followLandPath(s, dt, d.speed)) s.path = null; }
    } else if (dist > 0.15) {
      s.path = null;
      moveGround(s, s.postX, s.postZ, d.speed * 0.6, dt);
    } else { s.vx = s.vz = 0; }
  } else {
    // home destroyed: stand down
    s.gone = true;
  }
  settleY(s, dt);
}

function updateFighter(f, dt) {
  const d = ALLIES.fighter;
  if (f.dying) { crash(f, dt); return; }
  const home = f.home && f.home.alive ? f.home : null;
  const speed = d.speed * G.mod.fighterSpeed;
  if (f.state === 'parked') {
    if (!home) { f.gone = true; return; }
    parkFighter(f);
    if (!home.connected || !home.powered) return;
    let threat = false;
    for (const e of G.enemies) if (e.alive && (e.domain === 'air' || e.domain === 'sea') && Math.hypot(e.x, e.z) < 55) { threat = true; break; }
    if (threat && G.time >= (home.nextLaunch || 0)) {
      home.nextLaunch = G.time + 1.2;
      f.state = 'takeoff'; f.t = 0; f.speed = 1.5;
      SFX.play('plane', f.x, f.z);
    }
    return;
  }
  if (f.state === 'takeoff') {
    f.t += dt;
    f.speed = Math.min(speed, f.speed + speed * 0.6 * dt);
    f.vx = Math.sin(f.yaw) * f.speed; f.vz = Math.cos(f.yaw) * f.speed;
    f.x += f.vx * dt; f.z += f.vz * dt;
    if (f.t > 0.8) holdAlt(f, 4.5, dt, 2.2);
    if (f.t > 2.5) { f.state = 'engage'; f.think = 0; }
    return;
  }
  f.think -= dt; f.cool -= dt;
  if (f.think <= 0) {
    f.think = 0.5;
    let best = null, bd = Infinity;
    for (const e of G.enemies) {
      if (!e.alive || (e.domain !== 'air' && e.domain !== 'sea')) continue;
      if (Math.hypot(e.x, e.z) > 50) continue;
      const dd = Math.hypot(e.x - f.x, e.z - f.z) * (e.domain === 'air' ? 0.5 : 1);
      if (dd < bd) { bd = dd; best = e; }
    }
    f.target = best;
    f.state = best ? 'engage' : 'return';
  }
  const t = f.target && f.target.alive ? f.target : null;
  if (f.state === 'engage' && t) {
    const diff = steerPlane(f, t.x - t.vx * 0.2, t.z - t.vz * 0.2, dt, d.turn, speed);
    holdAlt(f, t.domain === 'air' ? t.y : 2.0, dt, 3);
    const dist = Math.hypot(t.x - f.x, t.y - f.y, t.z - f.z);
    if (dist < d.range && Math.abs(diff) < 0.35 && f.cool <= 0) {
      f.cool = 1 / d.rate;
      const hit = rand() < d.acc;
      tracer(f.x + Math.sin(f.yaw) * 0.3, f.y, f.z + Math.cos(f.yaw) * 0.3, t.x + rnd(-0.3, 0.3), t.y + 0.1, t.z + rnd(-0.3, 0.3));
      if (hit) damageEnemy(t, d.dmg * G.mod.fighterDmg * (t.domain === 'sea' ? 0.7 : 1), home);
      SFX.play('mg', f.x, f.z);
    }
  } else {
    // return and land
    if (!home) { leave(f, dt); return; }
    const dist = Math.hypot(home.x - f.x, home.z - f.z);
    steerPlane(f, home.x, home.z, dt, d.turn, dist < 6 ? speed * 0.6 : speed);
    holdAlt(f, dist < 6 ? home.y + 0.6 : 4.5, dt, 2);
    if (dist < 1.2) { f.state = 'parked'; parkFighter(f); }
  }
}

// ------------------------------------------------------------------ blockade and sheltering

// Blockade: an enemy warship (not a landing craft) within 6 tiles of land
function updateBlockade() {
  let on = false;
  for (const e of G.enemies) {
    if (!e.alive || e.domain !== 'sea' || e.def.troops) continue;
    const i = tileAt(e.x, e.z);
    if (i >= 0 && seaDist[i] <= 6) { on = true; break; }
  }
  if (on !== G.blockade) {
    G.blockade = on;
    if (on) notify('Naval blockade! Commercial income is down 25% while enemy warships are off the coast.', 'alert');
    else notify('The blockade is lifted.', 'good');
  }
}

// Sheltering: zoned lots within 3 tiles of a live raider pay no tax (half with Air-Raid Sirens)
function updateShelter() {
  shelterN++;
  if (shelterN > 0xfffffff0) { shelterMark.fill(0); shelterN = 1; }
  shelterNew.length = 0;
  for (const e of G.enemies) {
    if (!e.alive || e.domain !== 'ground') continue;
    const c = tileAt(e.x, e.z);
    if (c < 0) continue;
    tilesWithin(c, 3, tmp);
    for (const j of tmp) {
      if (shelterMark[j] === shelterN || !W.zone[j] || !W.lvl[j]) continue;
      shelterMark[j] = shelterN;
      shelterNew.push(j);
    }
  }
  for (const j of shelterOld) {
    if (shelterMark[j] !== shelterN && W.flags[j] & LF.SHELTER) { W.flags[j] &= ~LF.SHELTER; markLot(j); }
  }
  for (const j of shelterNew) {
    if (!(W.flags[j] & LF.SHELTER) && !(W.flags[j] & LF.RUBBLE)) { W.flags[j] |= LF.SHELTER; markLot(j); }
  }
  shelterOld.length = 0;
  for (const j of shelterNew) shelterOld.push(j);
}

// ------------------------------------------------------------------ main update

export function updateCombat(dt) {
  planBudget = 3;
  const playing = G.mode === 'play';
  if (playing) { updateWave(dt); updateBuildings(dt); }
  const E = G.enemies;
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    if (e.hitT > 0) e.hitT -= dt;
    if (e.domain === 'sea') updateShip(e, dt);
    else if (e.domain === 'air') updatePlane(e, dt);
    else updateInfantry(e, dt);
  }
  const A = G.allies;
  for (let i = 0; i < A.length; i++) {
    const a = A[i];
    if (a.hitT > 0) a.hitT -= dt;
    if (a.type === 'soldier' || a.type === 'officer') updateSoldier(a, dt);
    else updateFighter(a, dt);
  }
  updateProjectiles(dt);
  if (playing) {
    updateBlockade();
    C.shelterT -= dt;
    if (C.shelterT <= 0) { C.shelterT = 0.5; updateShelter(); }
  }
  compact(E);
  compact(A);
}

function compact(list) {
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const u = list[i];
    if (u.gone) {
      if (u.team === 'A' && u.home && u.home.units) {
        const k = u.home.units.indexOf(u);
        if (k >= 0) u.home.units.splice(k, 1);
      }
      continue;
    }
    list[j++] = u;
  }
  list.length = j;
}

export function enemiesAlive() {
  let n = 0;
  for (const e of G.enemies) if (e.alive && e.team === 'E') n++;
  return n;
}
