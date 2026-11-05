// Player-built structures (Building objects), placement rules, roads and connectivity, bulldozing, selling,
// upgrades, repairs, research, new game and save/load v2. Zoned lots are NOT Buildings: they live in the W.*
// per-tile arrays (see zones.js). Plain JS: runs in Node for the balance harness.
import { W, T, isLand, isWater, generateWorld, countNeighbours } from '../world.js';
import { BUILDINGS, BUILD_TYPES, ROADS, RESEARCH_BY_ID, computeMods, MONEY, DIFFICULTY, MILESTONES } from '../defs.js';
import { G, notify, MSG, SETTINGS } from '../state.js';
import { DIR_X, DIR_Z, hexDist } from '../hex.js';
import { initPath, findPath } from '../path.js';
import { hash2 } from '../rng.js';
import { CORE, LF, markLot, ignite, tilesWithin, damageTile, isLot } from './core.js';
import { FX, SFX, seedRand, rand } from './events.js';
import { resetEconomy, canAfford, moneyProblem, spend, earn, upkeepOf, gameOver, tickEconomy } from './economy.js';
import { resetZones, rebuildZonePrivate, demolishLot, clearRubble, DEZONED, scaleLotHp, tickZones } from './zones.js';
import { resetUtilities, markUtilDirty, allocate, tickUtilities } from './utilities.js';
import { resetServices, markCoverageDirty, markPollutionDirty, clearForest, refreshFields, serviceRadius, tickServices } from './services.js';
import { resetFire, rebuildFirePrivate, tickFire } from './fire.js';
import { resetMilestones, isUnlocked, unlockProblem, checkMilestones } from './milestones.js';
import { resetCombat, updateCombat } from './combat.js';

const MILITARY = (b) => b.def.kind === 'military';

// ------------------------------------------------------------------ buildings

export class Building {
  constructor(type, tile) {
    const def = BUILDINGS[type];
    this.id = G.nextId++;
    this.type = type;
    this.def = def;
    this.kind = def.kind;          // 'hq' | 'service' | 'utility' | 'park' | 'military'
    this.name = def.name;
    this.tile = tile;
    this.x = W.x[tile]; this.y = W.h[tile]; this.z = W.z[tile];
    this.level = 1;
    this.maxHp = def.hp * G.mod.bhp;
    this.hp = this.maxHp;
    this.alive = true;
    this.connected = false;
    this.powered = false;          // set by utilities.allocate (true for structures that need no power once connected)
    this.watered = false;
    this.invested = 0;             // $ spent on it (build + upgrades): the sell refund base
    this.upkeep = def.upkeep || 0; // $ per game minute (towers scale with level)
    this.targetMode = def.targetMode || 'nearest';
    this.domainPref = def.domainPref || 'any';
    this.dmgDealt = 0;
    this.kills = 0;
    // presentation and combat state (kept from the old Building)
    this.yaw = Math.floor(hash2(tile, 5) * 6) * (Math.PI / 3) + Math.PI / 6;
    this.headYaw = hash2(tile, 6) * Math.PI * 2;
    this.cool = hash2(tile, 7);
    this.scan = hash2(tile, 8) * 0.2;
    this.target = null; this.targetV = 0;
    this.flash = 0;
    this.lastHit = -99;
    this.born = G.time;            // also reset on upgrade (the renderer's pop-in animation)
    this.placedT = G.time;         // for the 15 s full-refund window
    this.placedWave = G.stats.wavesStarted || 0;
    this.units = [];
    this.trainT = 0;
    this.respawn = [];
    this.radarBoost = false;
    this.burnT = hash2(tile, 9);
    this.ws = null;
  }
}

export function buildCost(type, i = -1) {
  const d = BUILDINGS[type];
  if (!d || !d.cost) return 0;
  return Math.round(d.cost * (i >= 0 && W.type[i] === T.HILLS ? 1.25 : 1));
}

// Why `type` cannot be built on tile i, or null (money is checked separately by tryPlace)
export function placeProblem(type, i) {
  const def = BUILDINGS[type];
  if (!def || type === 'hq') return 'Cannot be built';
  if (i < 0) return 'Off the map';
  const t = W.type[i];
  if (!isLand(t)) return 'Must be built on land';
  if (t === T.MOUNTAIN) return 'Too steep: mountains cannot be built on';
  if (W.bld[i]) return 'Tile is occupied';
  if (W.road[i]) return 'Tile has a road (bulldoze it first)';
  if (W.ruin[i]) return 'Clear or rebuild the ruins first';
  if (W.zone[i] && (W.lvl[i] || W.flags[i] & LF.RUBBLE)) return 'A building stands here (bulldoze it first)';
  if (!def.terrain.includes(t)) {
    if (def.coastal) return 'Needs a beach or grassland tile';
    return 'Needs flat ground (not hills)';
  }
  if (!isUnlocked(type)) return unlockProblem(type);
  if (def.unique && G.buildings.some((b) => b.type === type && b.alive)) return 'Only one can be built';
  if (def.coastal && !countNeighbours(i, (tt) => isWater(tt))) return 'Must touch the sea';
  return null;
}

export function tryPlace(type, i) {
  const r = placeBuilding(type, i);
  return typeof r === 'string' ? r : null;
}
// Build and pay. Returns the Building, or an error string.
export function placeBuilding(type, i) {
  const p = placeProblem(type, i);
  if (p) return p;
  const cost = buildCost(type, i);
  const m = moneyProblem(cost);
  if (m) return m;
  spend(cost);
  const b = addBuilding(type, i);
  b.invested = cost;
  SFX.play('build', b.x, b.z);
  return b;
}

function clearTileDecor(i) {
  if (W.type[i] === T.FOREST) clearForest(i);
  if (W.ruin[i]) { W.ruin[i] = 0; G.dirty.terrainColors = true; }
  if (W.zone[i] && !W.lvl[i] && !(W.flags[i] & LF.RUBBLE)) { W.zone[i] = 0; W.flags[i] = 0; markLot(i); }
  G.dirty.trees = true;
}

function faceWater(b) {
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[b.tile * 6 + d];
    if (j >= 0 && isWater(W.type[j])) { b.yaw = Math.atan2(DIR_X[d], DIR_Z[d]); b.headYaw = b.yaw; return; }
  }
}

// Low-level add (no checks, no payment)
export function addBuilding(type, i) {
  clearTileDecor(i);
  const b = new Building(type, i);
  if (type === 'pump' || type === 'coastal') faceWater(b);
  if (type === 'airfield') b.yaw = Math.floor(hash2(i, 10) * 3) * (Math.PI / 3);
  W.bld[i] = b.id;
  G.buildings.push(b);
  G.byId.set(b.id, b);
  if (type === 'hq') G.hq = b;
  G.stats.built++;
  b.upkeep = upkeepOf(b);
  b.ws = b.def.weapon ? weaponStats(b) : null;
  markWorldChanged();
  markBuildingsChanged(b);
  return b;
}

function markBuildingsChanged(b) {
  markUtilDirty();
  markCoverageDirty();
  if (b && b.def.pollution) markPollutionDirty();
}

export function removeBuilding(b, destroyed) {
  b.alive = false;
  W.bld[b.tile] = 0;
  if (W.fire[b.tile]) W.fire[b.tile] = 0;
  const k = G.buildings.indexOf(b);
  if (k >= 0) G.buildings.splice(k, 1);
  G.byId.delete(b.id);
  if (destroyed && b.type !== 'hq') { W.ruin[b.tile] = BUILD_TYPES.indexOf(b.type) + 1; G.dirty.terrainColors = true; }
  if (G.selected === b) G.selected = destroyed ? { ruin: b.tile } : null;
  for (const u of b.units) u.home = null;
  markWorldChanged();
  markBuildingsChanged(b);
  refreshStats();
}

// ------------------------------------------------------------------ roads

export function roadCost(i) {
  if (i < 0) return 0;
  let c = ROADS.cost;
  if (W.type[i] === T.HILLS) c += ROADS.hillExtra;
  if (W.type[i] === T.FOREST) c += ROADS.forestExtra;
  return c;
}

export function roadProblem(i) {
  if (i < 0) return 'Off the map';
  const t = W.type[i];
  if (!isLand(t)) return 'Roads must be on land';
  if (t === T.MOUNTAIN) return 'Too steep for a road';
  if (W.bld[i]) return 'Tile is occupied';
  if (W.road[i]) return 'Already a road';
  if (W.ruin[i]) return 'Clear the ruins first';
  if (W.zone[i] && (W.lvl[i] || W.flags[i] & LF.RUBBLE)) return 'A building stands here (bulldoze it first)';
  return null;
}

export function tryRoad(i) {
  const p = roadProblem(i);
  if (p) return p;
  const cost = roadCost(i);
  const m = moneyProblem(cost);
  if (m) return m;
  spend(cost);
  clearTileDecor(i);
  W.road[i] = 1;
  markWorldChanged();
  return null;
}

// Road drag tool: A* from a to b around buildings, preferring existing roads.
// -> { tiles, cost, valid: [bool per tile], problem } where cost counts only tiles that would be built.
const roadStepCost = (j) => {
  if (W.road[j]) return 0.35;
  if (roadProblem(j)) return 0;
  return 1 + (W.type[j] === T.FOREST ? 0.4 : 0) + (W.type[j] === T.HILLS ? 0.2 : 0);
};
export function roadPath(a, b) {
  if (a < 0 || b < 0) return { tiles: [], cost: 0, valid: [], problem: 'Off the map' };
  const okStart = W.road[a] || !roadProblem(a);
  let tiles = null;
  if (okStart) {
    const bq = W.q[b], br = W.r[b];
    tiles = findPath(a, roadStepCost, (j) => j === b, (j) => hexDist(W.q[j], W.r[j], bq, br) * 0.35, 6000);
  }
  if (!tiles) tiles = [a];
  const valid = tiles.map((j) => !!W.road[j] || !roadProblem(j));
  let cost = 0;
  for (let k = 0; k < tiles.length; k++) if (!W.road[tiles[k]] && valid[k]) cost += roadCost(tiles[k]);
  const problem = tiles[tiles.length - 1] !== b ? 'No route for a road' : valid.every((v) => v) ? null : roadProblem(tiles[valid.indexOf(false)]);
  return { tiles, cost, valid, problem };
}
// Build roads on the given tiles in order, stopping when money runs out. -> { built, cost, problem }
export function buildRoads(tiles) {
  let built = 0, cost = 0, problem = null;
  for (const i of tiles) {
    if (W.road[i]) continue;
    const c = roadCost(i);
    const p = tryRoad(i);
    if (p) { if (!problem) problem = p; if (p.startsWith('Not enough') || p.startsWith('The treasury')) break; continue; }
    built++; cost += c;
  }
  return { built, cost, problem };
}

// ------------------------------------------------------------------ selling, bulldozing, upgrading, ruins

export function sellValue(b) {
  if (!b || b.type === 'hq') return 0;
  const grace = G.time - b.placedT <= MONEY.sellGraceSec && (G.stats.wavesStarted || 0) === b.placedWave;
  return Math.floor(b.invested * (grace ? MONEY.sellGraceRefund : MONEY.sellRefund));
}
export function sell(b) {
  if (!b || !b.alive) return 'Nothing to sell';
  if (b.type === 'hq') return 'The Town Hall cannot be demolished';
  earn(sellValue(b));
  SFX.play('sell', b.x, b.z);
  removeBuilding(b, false);
  return null;
}

// What bulldozing tile i would do: { action, refund, label } or null
export function bulldozeInfo(i) {
  if (i < 0) return null;
  if (W.bld[i]) {
    const b = G.byId.get(W.bld[i]);
    if (!b) return null;
    if (b.type === 'hq') return { action: 'none', refund: 0, label: 'The Town Hall cannot be demolished' };
    return { action: 'sell', refund: sellValue(b), label: `Sell ${b.def.name}` };
  }
  if (W.road[i]) return { action: 'road', refund: Math.floor(roadRefundBase(i) * ROADS.refund), label: 'Remove road' };
  if (W.ruin[i]) return { action: 'ruin', refund: 0, label: 'Clear ruins' };
  if (W.zone[i] && W.flags[i] & LF.RUBBLE) return { action: 'rubble', refund: 0, label: 'Clear rubble' };
  if (W.zone[i] && W.lvl[i]) return { action: 'lot', refund: 0, label: 'Demolish building' };
  if (W.zone[i]) return { action: 'dezone', refund: 0, label: 'Remove zoning' };
  return null;
}
const roadRefundBase = (i) => ROADS.cost + (W.type[i] === T.HILLS ? ROADS.hillExtra : 0);

export function bulldoze(i) {
  if (i < 0) return 'Off the map';
  if (W.bld[i]) {
    const b = G.byId.get(W.bld[i]);
    if (!b) return null;
    return sell(b);
  }
  if (W.road[i]) {
    W.road[i] = 0;
    W.conn[i] = 0;
    earn(Math.floor(roadRefundBase(i) * ROADS.refund));
    markWorldChanged();
    return null;
  }
  if (W.ruin[i]) {
    W.ruin[i] = 0;
    G.dirty.terrainColors = true;
    if (G.selected && G.selected.ruin === i) G.selected = null;
    markWorldChanged();
    G.dirty.fields = true;
    return null;
  }
  if (W.zone[i]) {
    if (W.flags[i] & LF.RUBBLE) { clearRubble(i); return null; }
    if (W.lvl[i]) {
      FX.dust(W.x[i], W.h[i], W.z[i], 1);
      demolishLot(i);
      // a bulldozed de-zoned lot is gone for good; a zoned one becomes an empty lot that may regrow
      return null;
    }
    W.zone[i] = 0; W.flags[i] &= LF.ROAD; markLot(i); G.dirty.fields = true;
    return null;
  }
  return 'Nothing to clear';
}

// Upgrade cost for the next level, or null at the top (or not yet unlocked: see upgradeProblem)
export function upgradeCost(b) {
  const d = b.def;
  if (!d.upgradeCost || b.level >= (d.maxLevel || 1)) return null;
  return d.upgradeCost(b.level);
}
export const levelCostFor = upgradeCost;
export function upgradeProblem(b) {
  const cost = upgradeCost(b);
  if (cost == null) return 'Already at the top level';
  if (b.def.upgradeUnlock && G.milestone < b.def.upgradeUnlock) {
    const m = MILESTONES[b.def.upgradeUnlock];
    return `${b.def.upgradeName || 'Upgrade'} unlocks at ${m.name} (${m.pop.toLocaleString('en-US')} people or wave ${m.wave})`;
  }
  return moneyProblem(cost);
}
export function upgrade(b) {
  if (!b || !b.alive) return 'Nothing to upgrade';
  const p = upgradeProblem(b);
  if (p) return p;
  const cost = upgradeCost(b);
  spend(cost);
  b.invested += cost;
  b.level++;
  const old = b.maxHp;
  b.maxHp = maxHpFor(b);
  b.hp += b.maxHp - old;
  b.born = G.time - 0.25;
  if (b.type === 'clinic' && b.level >= 2) b.name = b.def.upgradeName || 'Hospital';
  b.upkeep = upkeepOf(b);
  refreshStats();
  markBuildingsChanged(b);
  SFX.play('upgrade', b.x, b.z);
  return null;
}
const maxHpFor = (b) => b.def.hp * G.mod.bhp * (1 + 0.3 * (b.level - 1));

// Stats after the next upgrade, for the tower card: { dmg, range, rate, hp, upkeep } (null at the top level)
export function previewUpgrade(b) {
  if (upgradeCost(b) == null) return null;
  const nb = { ...b, level: b.level + 1 };
  return {
    dmg: b.def.weapon ? weaponStats(nb).dmg : 0, range: b.def.weapon ? weaponStats(nb).range : 0,
    rate: b.def.weapon ? weaponStats(nb).rate : 0, hp: maxHpFor(nb), upkeep: upkeepOf(nb),
    radius: b.type === 'clinic' ? b.def.upgradeRadius : serviceRadius(b),
  };
}

// Cost to fully repair a damaged structure (20 % of what it cost x the missing fraction)
export function repairCost(b) {
  if (!b || b.hp >= b.maxHp) return 0;
  return Math.ceil(MONEY.repairCostFrac * (b.invested || b.def.cost || 0) * (1 - b.hp / b.maxHp));
}

export function ruinType(i) { return i >= 0 && W.ruin[i] ? BUILD_TYPES[W.ruin[i] - 1] : null; }
export function ruinCost(i) {
  const type = ruinType(i);
  return type ? Math.round(buildCost(type, i) * 0.6) : 0;
}
export function ruinsCost() {
  let s = 0;
  for (const i of W.land) if (W.ruin[i]) s += ruinCost(i);
  return s;
}
// Player-built ruins rebuild at 60 % of their cost. -> Building | error string
export function rebuildRuin(i) {
  const type = ruinType(i);
  if (!type) return 'Nothing to rebuild';
  const cost = ruinCost(i);
  const keep = W.ruin[i];
  W.ruin[i] = 0;
  const p = placeProblem(type, i) || moneyProblem(cost);
  if (p) { W.ruin[i] = keep; return p; }
  spend(cost);
  const b = addBuilding(type, i);
  b.invested = cost;
  G.dirty.terrainColors = true;
  return b;
}
// Wave report button: rebuild every player ruin the treasury can pay for. -> error string | null
export function rebuildAllRuins() {
  const list = W.land.filter((i) => W.ruin[i]).sort((a, b) => ruinCost(a) - ruinCost(b));
  if (!list.length) return 'Nothing to rebuild';
  let n = 0, err = null;
  for (const i of list) {
    const r = rebuildRuin(i);
    if (typeof r === 'string') { err = err || r; continue; }
    n++;
  }
  if (!n) return err || 'Nothing could be rebuilt';
  notify(`Rebuilt ${n} structure${n > 1 ? 's' : ''}`, 'good');
  return null;
}

// ------------------------------------------------------------------ damage

const EXPLOSIVE = { shell: 1, bomb: 1, rocket: 1 };
const canIgnite = (b) => b.def.kind === 'service' || b.def.kind === 'utility';

// CORE.onBuildingDamaged: every hit on a player structure lands here (kind as in damageTile, plus 'blast')
export function damageBuilding(b, dmg, kind = 'shell') {
  if (!b || !b.alive || G.mode !== 'play' || !(dmg > 0)) return;
  if (EXPLOSIVE[kind] && !W.fire[b.tile] && canIgnite(b)) {
    const p = Math.min(0.6, Math.max(0, (dmg - 10) / 80)) * (G.mod.igniteMul || 1);
    if (rand() < p) ignite(b.tile);
  }
  b.hp -= dmg;
  if (kind !== 'fire') { b.flash = 1; b.lastHit = G.time; }
  if (b.hp > 0) {
    if (b === G.hq && b.hp < b.maxHp * 0.5 && !G.wave.hqWarned) {
      G.wave.hqWarned = true;
      notify('The Town Hall is below half health!', 'alert', b.x, b.z);
      if (SETTINGS.autoPauseHQ !== false) G.paused = true;   // auto-pause (setting, default on)
      if (typeof G.onHQLow === 'function') G.onHQLow();
    }
    return;
  }
  b.hp = 0;
  G.stats.lost++;
  if (b.type === 'hq') {
    b.alive = false;
    notify('The Town Hall has fallen.', 'alert', b.x, b.z);
    FX.explosion(b.x, b.y + 0.6, b.z, 3, false);
    FX.shake(b.x, b.z, 1);
    SFX.play('boomBig', b.x, b.z);
    gameOver('hq');
    if (typeof G.onHQDestroyed === 'function') G.onHQDestroyed();
    return;
  }
  const cur = G.wave.cur;
  if (cur) { cur.lostOwn++; cur.lostOwnValue += b.invested || 0; cur.lostTypes[b.type] = (cur.lostTypes[b.type] || 0) + 1; }
  notify(`${b.name} destroyed!`, 'bad', b.x, b.z);
  FX.explosion(b.x, b.y + 0.4, b.z, 1.5, false);
  FX.dust(b.x, b.y, b.z, 1.5);
  FX.shake(b.x, b.z, 0.35);
  SFX.play('boomBig', b.x, b.z);
  if (typeof G.onBuildingDestroyed === 'function') G.onBuildingDestroyed(b);
  removeBuilding(b, true);
  if (b.def.explodes) explode(b);
}
CORE.onBuildingDamaged = damageBuilding;

// Gas plant: 150 damage within 2 tiles and a 60 % chance to ignite each neighbour
const _blast = [];
function explode(b) {
  FX.explosion(b.x, b.y + 0.8, b.z, 3.2, false);
  FX.shake(b.x, b.z, 0.8);
  SFX.play('boomBig', b.x, b.z);
  tilesWithin(b.tile, 2, _blast);
  const tiles = _blast.slice();
  for (const j of tiles) if (j !== b.tile) damageTile(j, 150, 'blast');
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[b.tile * 6 + d];
    if (j >= 0 && (isLot(j) || W.bld[j]) && rand() < 0.6) ignite(j);
  }
}

// ------------------------------------------------------------------ connectivity and stats

export function markWorldChanged() {
  G.dirty.connect = true;
  G.dirty.roads = true;
  G.dirty.minimap = true;
  W.version++;
}

let reach = null;
// BFS from the Town Hall along roads: W.conn for roads, b.connected for structures, LF.ROAD for lots
export function recomputeConnectivity() {
  G.dirty.connect = false;
  if (!reach || reach.length !== W.count) reach = new Uint8Array(W.count);
  reach.fill(0);
  W.conn.fill(0);
  if (G.hq && G.hq.alive) {
    const q = [G.hq.tile];
    reach[G.hq.tile] = 1;
    for (let k = 0; k < q.length; k++) {
      const c = q[k];
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[c * 6 + d];
        if (j >= 0 && !reach[j] && W.road[j]) { reach[j] = 1; W.conn[j] = 1; q.push(j); }
      }
    }
  }
  const touches = (i) => {
    for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && reach[j]) return true; }
    return false;
  };
  let changed = false;
  for (const b of G.buildings) {
    const c = b.type === 'hq' ? true : touches(b.tile);
    if (c !== b.connected) { b.connected = c; changed = true; }
  }
  for (const i of W.land) {
    if (!W.zone[i]) continue;
    const fl = W.flags[i];
    const nf = touches(i) ? fl | LF.ROAD : fl & ~(LF.ROAD | LF.POWER | LF.WATER);
    if (nf !== fl) { W.flags[i] = nf; markLot(i); }
  }
  markUtilDirty();
  if (changed) { markCoverageDirty(); refreshStats(); }
  G.dirty.roads = true;
}

export function refreshStats() {
  G.mod = computeMods(G.research);
  const radars = G.buildings.filter((b) => b.type === 'radar' && b.alive && b.connected && b.powered);
  for (const b of G.buildings) {
    b.radarBoost = radars.some((r) => hexDist(W.q[r.tile], W.r[r.tile], W.q[b.tile], W.r[b.tile]) <= r.def.radius);
    b.ws = b.def.weapon ? weaponStats(b) : null;
    b.upkeep = upkeepOf(b);
  }
}

// Weapon numbers after research, level and radar (gov staffing is applied when firing)
export function weaponStats(b) {
  const w = b.def.weapon;
  const m = G.mod;
  const L = b.level - 1;
  let dmg = w.dmg * m.dmg * (1 + 0.35 * L);
  let range = w.range * m.range * (1 + 0.08 * L);
  const rate = w.rate * m.rate * (1 + 0.1 * L);
  let splash = w.splash || 0;
  if (w.kind === 'flak') { dmg *= m.flakDmg; splash *= m.flakSplash; }
  if (b.radarBoost) range *= 1.2;
  return { dmg, range, rate, splash };
}

// ------------------------------------------------------------------ research ($, instant, needs the War College)

export function researchCost(id) {
  const r = RESEARCH_BY_ID[id];
  const lvl = G.research[id] || 0;
  return r && lvl < r.max ? r.cost(lvl) : null;
}
export function researchProblem(id) {
  const r = RESEARCH_BY_ID[id];
  if (!r) return 'Unknown research';
  const lvl = G.research[id] || 0;
  if (lvl >= r.max) return 'Fully researched';
  if (r.needMilestone && G.milestone < r.needMilestone) return `Needs the ${MILESTONES[r.needMilestone].name} milestone`;
  if (!G.buildings.some((b) => b.type === 'college' && b.alive && b.connected && b.powered)) return 'Build a War College connected by road (and powered)';
  return moneyProblem(r.cost(lvl));
}
export function buyResearch(id) {
  const p = researchProblem(id);
  if (p) return p;
  const r = RESEARCH_BY_ID[id];
  const lvl = G.research[id] || 0;
  spend(r.cost(lvl));
  G.research[id] = lvl + 1;
  const oldBhp = G.mod.bhp, oldLot = G.mod.lotHp;
  refreshStats();
  if (G.mod.bhp !== oldBhp) for (const b of G.buildings) { const f = G.mod.bhp / oldBhp; b.maxHp *= f; b.hp *= f; }
  if (G.mod.lotHp !== oldLot) scaleLotHp(G.mod.lotHp / oldLot);
  markCoverageDirty();
  notify(`Research complete: ${r.name}${r.max > 1 ? ' ' + ['I', 'II', 'III'][lvl] : ''}`, 'good');
  return null;
}

// Inspector data for a player structure
export function buildingInfo(b) {
  if (!b) return null;
  return {
    id: b.id, type: b.type, name: b.name, kind: b.kind, level: b.level, maxLevel: b.def.maxLevel || 1,
    hp: b.hp, maxHp: b.maxHp, connected: b.connected, powered: b.powered, watered: b.watered,
    upkeep: b.upkeep, invested: b.invested, sellValue: sellValue(b), upgradeCost: upgradeCost(b), upgradeProblem: upgradeProblem(b),
    repairCost: repairCost(b), kills: b.kills, dmgDealt: Math.round(b.dmgDealt), targetMode: b.targetMode, domainPref: b.domainPref,
    ws: b.ws, radius: serviceRadius(b), units: b.units.length, onFire: W.fire[b.tile] / 255,
  };
}

// ------------------------------------------------------------------ new game

function resetState(seed, difficulty) {
  G.seed = seed;
  G.difficulty = DIFFICULTY[difficulty] ? difficulty : 'standard';
  G.time = 0; G.speed = 1; G.paused = false;
  G.buildings = []; G.byId = new Map(); G.nextId = 1; G.hq = null;
  G.enemies = []; G.allies = []; G.projectiles = []; G.trucks = [];
  G.fires = 0;
  G.research = {};
  G.mod = computeMods({});
  G.stats = { kills: 0, built: 0, lost: 0, lotsLost: 0, lotsLostFire: 0, waves: 0, wavesStarted: 0, shots: 0, firesStarted: 0, firesOut: 0, firstAbandoned: 0, firstFireUncovered: 0 };
  G.victory = false;
  G.gameOver = null;
  G.hints = {}; G.hintQueue = [];
  G.selected = null; G.tool = null;
  G.raidsOn = DIFFICULTY[G.difficulty].raids;
  for (const k in G.dirty) G.dirty[k] = true;
}

function resetModules(difficulty) {
  resetEconomy(difficulty);
  resetZones();
  resetUtilities();
  resetServices();
  resetFire();
  resetMilestones();
}

// Start a run on the island `seed`. difficulty: 'relaxed' | 'standard' | 'hard' | 'sandbox'.
// Leaves G.mode alone (main.js sets 'play' when the player starts; the menu shows the island behind it).
export function newGame(seed, difficulty = 'standard') {
  generateWorld(seed);
  initPath();
  seedRand(seed);
  rememberForests();
  resetState(seed, difficulty);
  resetModules(G.difficulty);
  addBuilding('hq', W.center);
  G.stats.built = 0;
  resetCombat();
  recomputeConnectivity();
  allocate();
  refreshFields();
  MSG.length = 0;
}

// One simulation step in the SPEC section 7 order (main.js may call the ticks itself instead)
export function simStep(dt) {
  G.time += dt;
  tickEconomy(dt);
  tickZones(dt);
  tickUtilities();
  tickServices();
  tickFire(dt);
  updateCombat(dt);
  checkMilestones();
}

// ------------------------------------------------------------------ save / load v2

const SAVE_KEY = 'bastion.save.v2';
const OLD_SAVE_KEY = 'bastion.save.v1';
const store = () => { try { return globalThis.localStorage || null; } catch { return null; } };

export function rememberForests() {
  W._origForest = new Uint8Array(W.count);
  for (let i = 0; i < W.count; i++) if (W.type[i] === T.FOREST) W._origForest[i] = 1;
}

// Run-length encoding of a typed array: [value, count, value, count, ...]
export function rleEncode(arr, map = null) {
  const out = [];
  let prev = null, n = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = map ? map(arr[i]) : arr[i];
    if (v === prev) { n++; continue; }
    if (n) out.push(prev, n);
    prev = v; n = 1;
  }
  if (n) out.push(prev, n);
  return out;
}
export function rleDecode(rle, out, map = null) {
  let k = 0;
  for (let j = 0; j < rle.length; j += 2) {
    const v = map ? map(rle[j]) : rle[j];
    for (let c = 0; c < rle[j + 1] && k < out.length; c++) out[k++] = v;
  }
  return out;
}

// Saves only between raids (and only while playing). Returns true when written.
export function saveProblem() {
  if (G.mode !== 'play') return 'Not playing';
  if (G.wave.state === 'active') return 'The game saves between raids';
  return null;
}
export function serializeGame() {
  const cleared = new Uint8Array(W.count);
  if (W._origForest) for (let i = 0; i < W.count; i++) if (W._origForest[i] && W.type[i] !== T.FOREST) cleared[i] = 1;
  const keepFlags = ~(LF.SHELTER) & 0xffff;
  return {
    v: 2, seed: G.seed, difficulty: G.difficulty, time: G.time, tod: G.tod, money: G.money, taxes: G.taxes,
    research: G.research, stats: G.stats, victory: G.victory, milestone: G.milestone, hints: G.hints, raidsOn: G.raidsOn,
    moneyHist: G.moneyHist, panicLog: G.panicLog, demand: G.demand, overdraftT: G.overdraftT, negT: G.negT, nextId: G.nextId,
    wave: { n: G.wave.n, timer: G.wave.timer, plan: G.wave.plan, report: G.wave.report },
    buildings: G.buildings.map((b) => [b.type, b.tile, b.level, Math.round((b.hp / b.maxHp) * 1000) / 1000, Math.round(b.yaw * 1000) / 1000,
      b.invested, b.targetMode, b.domainPref, b.kills, Math.round(b.dmgDealt)]),
    tiles: {
      road: rleEncode(W.road), ruin: rleEncode(W.ruin), zone: rleEncode(W.zone), lvl: rleEncode(W.lvl), occ: rleEncode(W.occ),
      fire: rleEncode(W.fire), flags: rleEncode(W.flags, (v) => v & keepFlags), prog: rleEncode(W.prog), lotHp: rleEncode(W.lotHp),
      style: rleEncode(W.style), lotT: rleEncode(W.lotT, (v) => Math.round(v * 10)), timer: rleEncode(W.timer, (v) => Math.round(v * 10)),
      cleared: rleEncode(cleared),
    },
  };
}
export function saveGame() {
  if (saveProblem()) return false;
  const s = store();
  if (!s) return false;
  try { s.setItem(SAVE_KEY, JSON.stringify(serializeGame())); return true; } catch { return false; }
}
export function hasSave() { const s = store(); try { return !!(s && s.getItem(SAVE_KEY)); } catch { return false; } }
// A save from Bastion Isle 1 (food/wood/stone economy) exists: show 'old save from an earlier version'
export function hasOldSave() { const s = store(); try { return !!(s && s.getItem(OLD_SAVE_KEY)) && !hasSave(); } catch { return false; } }
export function deleteSave() { const s = store(); try { if (s) s.removeItem(SAVE_KEY); } catch { /* ignore */ } }
export function deleteOldSave() { const s = store(); try { if (s) s.removeItem(OLD_SAVE_KEY); } catch { /* ignore */ } }

// Load the v2 save. Returns true on success, false otherwise (see hasOldSave for the earlier-version message).
export function loadGame() {
  const s = store();
  let data = null;
  try { data = JSON.parse((s && s.getItem(SAVE_KEY)) || 'null'); } catch { data = null; }
  if (!data || data.v !== 2) return false;
  return restoreGame(data);
}

export function restoreGame(data) {
  generateWorld(data.seed);
  initPath();
  seedRand((data.seed ^ Math.floor(data.time * 1000)) >>> 0);
  rememberForests();
  resetState(data.seed, data.difficulty);
  resetModules(G.difficulty);
  const t = data.tiles;
  const cleared = rleDecode(t.cleared, new Uint8Array(W.count));
  for (let i = 0; i < W.count; i++) if (cleared[i] && W.type[i] === T.FOREST) W.type[i] = T.GRASS;
  rleDecode(t.road, W.road); rleDecode(t.ruin, W.ruin); rleDecode(t.zone, W.zone); rleDecode(t.lvl, W.lvl);
  rleDecode(t.occ, W.occ); rleDecode(t.fire, W.fire); rleDecode(t.flags, W.flags); rleDecode(t.prog, W.prog);
  rleDecode(t.lotHp, W.lotHp); rleDecode(t.style, W.style);
  rleDecode(t.lotT, W.lotT, (v) => v / 10); rleDecode(t.timer, W.timer, (v) => v / 10);
  G.time = data.time || 0;
  G.tod = data.tod != null ? data.tod : G.tod;
  G.research = data.research || {};
  G.mod = computeMods(G.research);
  for (const [type, tile, level, hpf, yaw, invested, tm, dp, kills, dmg] of data.buildings) {
    if (!BUILDINGS[type]) continue;
    const b = addBuilding(type, tile);
    b.level = level;
    b.maxHp = maxHpFor(b);
    b.hp = b.maxHp * hpf;
    b.yaw = yaw;
    b.invested = invested || 0;
    b.targetMode = tm || b.targetMode; b.domainPref = dp || b.domainPref;
    b.kills = kills || 0; b.dmgDealt = dmg || 0;
    b.born = -10; b.placedT = -100;
    if (type === 'clinic' && level >= 2) b.name = b.def.upgradeName || 'Hospital';
    b.upkeep = upkeepOf(b);
  }
  G.nextId = Math.max(G.nextId, data.nextId || 0);
  G.money = data.money;
  G.taxes = { ...G.taxes, ...data.taxes };
  G.stats = { ...G.stats, ...data.stats };
  G.victory = !!data.victory;
  G.milestone = data.milestone || 0;
  G.hints = data.hints || {};
  G.raidsOn = data.raidsOn != null ? data.raidsOn : G.raidsOn;
  G.moneyHist = data.moneyHist || [];
  G.panicLog = data.panicLog || [];
  if (data.demand) G.demand = { ...data.demand };
  G.overdraftT = data.overdraftT || 0; G.negT = data.negT || 0;
  resetCombat(data.wave);
  rebuildZonePrivate();
  rebuildFirePrivate();
  recomputeConnectivity();
  refreshStats();
  allocate();
  refreshFields();
  for (const k in G.dirty) G.dirty[k] = true;
  W.lotVersion++;
  for (const i of W.land) if (W.zone[i] || W.fire[i]) W.lotDirty.push(i);
  return true;
}

export { DEZONED };
