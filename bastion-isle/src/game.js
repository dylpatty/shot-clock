import { W, T, isLand, isWater, isWalkable, generateWorld, countNeighbours, tileDist } from './world.js';
import { BUILDINGS, BUILD_TYPES, RES, ROAD_COST, RESEARCH_BY_ID, computeMods, FIRST_WAVE_DELAY } from './defs.js';
import { G, notify } from './state.js';
import { DIR_X, DIR_Z } from './hex.js';
import { initPath } from './path.js';

// ------------------------------------------------------------------ resources

export function canAfford(cost) {
  for (const k in cost) if ((G.res[k] || 0) < cost[k] - 1e-6) return false;
  return true;
}
export function pay(cost) { for (const k in cost) G.res[k] -= cost[k]; }
export function refund(cost, frac) { for (const k in cost) G.res[k] += Math.floor(cost[k] * frac); }
export function scaleCost(cost, f) {
  const o = {};
  for (const k in cost) o[k] = Math.ceil(cost[k] * f);
  return o;
}

// ------------------------------------------------------------------ buildings

export class Building {
  constructor(type, tile) {
    const def = BUILDINGS[type];
    this.id = G.nextId++;
    this.type = type;
    this.def = def;
    this.tile = tile;
    this.x = W.x[tile]; this.y = W.h[tile]; this.z = W.z[tile];
    this.level = 1;
    this.maxHp = def.hp * G.mod.bhp;
    this.hp = this.maxHp;
    this.alive = true;
    this.connected = false;
    this.yaw = Math.floor(Math.random() * 6) * (Math.PI / 3) + Math.PI / 6;
    this.headYaw = Math.random() * Math.PI * 2;
    this.cool = Math.random();
    this.scan = Math.random() * 0.2;
    this.target = null;
    this.flash = 0;
    this.lastHit = -99;
    this.born = G.time;
    this.kills = 0;
    this.prod = null;
    this.ws = null;
    this.units = [];
    this.trainT = 0;
    this.radarBoost = false;
    this.marketBoost = false;
    this.burnT = Math.random();
  }
}

export function levelCostFor(b) {
  if (!b.def.upgradeCost || b.level >= (b.def.maxLevel || 1)) return null;
  return b.def.upgradeCost(b.level);
}

export function isUnlocked(type) {
  const req = BUILDINGS[type].requires;
  return !req || (G.research[req] || 0) > 0;
}

// Why a building cannot go on a tile, or null if it can
export function placeProblem(type, i) {
  if (i < 0) return 'Off the map';
  const def = BUILDINGS[type];
  const t = W.type[i];
  if (!isLand(t)) return 'Must be built on land';
  if (t === T.MOUNTAIN) return 'Too steep: mountains cannot be built on';
  if (W.bld[i]) return 'Tile is occupied';
  if (W.road[i]) return 'Tile has a road (bulldoze it first)';
  if (!def.terrain.includes(t)) {
    if (type === 'farm') return 'Farms need grassland';
    if (type === 'mine') return 'Iron mines must be built on hills';
    if (type === 'airfield') return 'Airfields need flat ground (not hills)';
    if (type === 'dock') return 'Docks go on beach or grass';
    return 'Wrong terrain';
  }
  if (!isUnlocked(type)) return `Requires research: ${RESEARCH_BY_ID[def.requires].name}`;
  if (def.unique && G.buildings.some((b) => b.type === type)) return 'Only one can be built';
  if (def.coastal && !countNeighbours(i, (tt) => isWater(tt))) return 'Must touch the sea';
  if (def.needsAdj === 'forest' && !countNeighbours(i, (tt) => tt === T.FOREST)) return 'Needs a forest beside it';
  if (def.needsAdj === 'rock' && t !== T.HILLS && !countNeighbours(i, (tt) => tt === T.HILLS || tt === T.MOUNTAIN)) return 'Needs hills or mountains beside it';
  return null;
}

export function roadProblem(i) {
  if (i < 0) return 'Off the map';
  const t = W.type[i];
  if (!isLand(t)) return 'Roads must be on land';
  if (t === T.MOUNTAIN) return 'Too steep for a road';
  if (W.bld[i]) return 'Tile is occupied';
  if (W.road[i]) return 'Already a road';
  return null;
}

function clearTileDecor(i) {
  if (W.type[i] === T.FOREST) {
    W.type[i] = T.GRASS;
    G.res.wood += 5;
    G.dirty.terrainColors = true;
  }
  if (W.ruin[i]) { W.ruin[i] = 0; G.dirty.terrainColors = true; }
  G.dirty.trees = true;
}

export function addBuilding(type, i, free = false) {
  const def = BUILDINGS[type];
  if (!free) pay(def.cost);
  clearTileDecor(i);
  const b = new Building(type, i);
  if (type === 'dock') {
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[i * 6 + d];
      if (j >= 0 && isWater(W.type[j])) { b.yaw = Math.atan2(DIR_X[d], DIR_Z[d]); break; }
    }
  }
  if (type === 'airfield') b.yaw = Math.floor(Math.random() * 3) * (Math.PI / 3);
  W.bld[i] = b.id;
  G.buildings.push(b);
  G.byId.set(b.id, b);
  if (type === 'hq') G.hq = b;
  G.stats.built++;
  markWorldChanged();
  return b;
}

export function tryPlace(type, i) {
  const p = placeProblem(type, i);
  if (p) return p;
  if (!canAfford(BUILDINGS[type].cost)) return 'Not enough resources';
  addBuilding(type, i);
  return null;
}

export function tryRoad(i) {
  const p = roadProblem(i);
  if (p) return p;
  if (!canAfford(ROAD_COST)) return 'Not enough gold';
  pay(ROAD_COST);
  clearTileDecor(i);
  W.road[i] = 1;
  markWorldChanged();
  return null;
}

export function removeBuilding(b, destroyed) {
  b.alive = false;
  W.bld[b.tile] = 0;
  const k = G.buildings.indexOf(b);
  if (k >= 0) G.buildings.splice(k, 1);
  G.byId.delete(b.id);
  if (destroyed) W.ruin[b.tile] = BUILD_TYPES.indexOf(b.type) + 1;
  if (G.selected === b) G.selected = destroyed ? { ruin: b.tile } : null;
  for (const u of b.units) u.home = null;
  markWorldChanged();
}

export function bulldoze(i) {
  if (i < 0) return 'Off the map';
  if (W.bld[i]) {
    const b = G.byId.get(W.bld[i]);
    if (!b) return null;
    if (b.type === 'hq') return 'The Town Hall cannot be demolished';
    refund(b.def.cost, 0.5);
    removeBuilding(b, false);
    return null;
  }
  if (W.road[i]) {
    W.road[i] = 0;
    G.res.gold += 1;
    markWorldChanged();
    return null;
  }
  if (W.ruin[i]) {
    W.ruin[i] = 0;
    G.dirty.terrainColors = true;
    markWorldChanged();
    return null;
  }
  return 'Nothing to clear';
}

export function rebuildRuin(i) {
  const type = BUILD_TYPES[W.ruin[i] - 1];
  if (!type) return 'Nothing to rebuild';
  const cost = scaleCost(BUILDINGS[type].cost, 0.6);
  W.ruin[i] = 0;
  const p = placeProblem(type, i);
  if (p) { W.ruin[i] = BUILD_TYPES.indexOf(type) + 1; return p; }
  if (!canAfford(cost)) { W.ruin[i] = BUILD_TYPES.indexOf(type) + 1; return 'Not enough resources'; }
  pay(cost);
  const b = addBuilding(type, i, true);
  G.dirty.terrainColors = true;
  return b;
}

export function upgrade(b) {
  const cost = levelCostFor(b);
  if (!cost) return 'Already at the top level';
  if (!canAfford(cost)) return 'Not enough resources';
  pay(cost);
  b.level++;
  const old = b.maxHp;
  b.maxHp = b.def.hp * G.mod.bhp * (1 + 0.3 * (b.level - 1));
  b.hp += b.maxHp - old;
  b.born = G.time - 0.25;
  refreshStats();
  return null;
}

export function damageBuilding(b, dmg) {
  if (!b.alive || G.mode !== 'play') return;
  b.hp -= dmg;
  b.flash = 1;
  b.lastHit = G.time;
  if (b.hp <= 0) {
    b.hp = 0;
    G.stats.lost++;
    if (b.type === 'hq') {
      b.alive = false;
      G.onHQDestroyed && G.onHQDestroyed();
      return;
    }
    notify(`${b.def.name} destroyed!`, 'bad');
    G.onBuildingDestroyed && G.onBuildingDestroyed(b);
    removeBuilding(b, true);
  }
}

export function markWorldChanged() {
  G.dirty.connect = true;
  G.dirty.roads = true;
  G.dirty.minimap = true;
  W.version++;
}

// ------------------------------------------------------------------ connectivity and stats

let reach = null;
export function recomputeConnectivity() {
  if (!reach || reach.length !== W.count) reach = new Uint8Array(W.count);
  reach.fill(0);
  W.conn.fill(0);
  if (!G.hq) return;
  const q = [G.hq.tile];
  reach[G.hq.tile] = 1;
  for (let k = 0; k < q.length; k++) {
    const c = q[k];
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[c * 6 + d];
      if (j >= 0 && !reach[j] && W.road[j]) { reach[j] = 1; W.conn[j] = 1; q.push(j); }
    }
  }
  for (const b of G.buildings) {
    if (b.type === 'hq') { b.connected = true; continue; }
    let ok = false;
    for (let d = 0; d < 6 && !ok; d++) {
      const j = W.nbr[b.tile * 6 + d];
      if (j >= 0 && reach[j]) ok = true;
    }
    b.connected = ok;
  }
  refreshStats();
}

export function refreshStats() {
  G.mod = computeMods(G.research);
  const radars = G.buildings.filter((b) => b.type === 'radar' && b.connected);
  const markets = G.buildings.filter((b) => b.type === 'market' && b.connected);
  for (const b of G.buildings) {
    b.radarBoost = radars.some((r) => Math.hypot(r.x - b.x, r.z - b.z) <= r.def.radius);
    b.marketBoost = b.type === 'house' && markets.some((m) => Math.hypot(m.x - b.x, m.z - b.z) <= m.def.radius);
    b.prod = computeProd(b);
    b.ws = b.def.weapon ? weaponStats(b) : null;
  }
}

export function weaponStats(b) {
  const w = b.def.weapon;
  const m = G.mod;
  const L = b.level - 1;
  let dmg = w.dmg * m.dmg * (1 + 0.35 * L);
  let range = w.range * m.range * (1 + 0.08 * L);
  let rate = w.rate * m.rate * (1 + 0.1 * L);
  let splash = w.splash || 0;
  if (w.kind === 'flak') { dmg *= m.flakDmg; splash *= m.flakSplash; }
  if (b.radarBoost) range *= 1.2;
  if (b.type !== 'hq') rate *= Math.max(0.5, Math.min(1, G.eff));
  return { dmg, range, rate, splash };
}

export function housingOf(b) {
  if (b.type === 'hq') return 10 + 5 * (b.level - 1);
  if (b.type !== 'house') return 0;
  return b.def.housing + 4 * (b.level - 1) + G.mod.housing;
}
export function jobsOf(b) {
  const j = b.def.jobs || 0;
  return j ? j + (b.level - 1) : 0;
}

export function previewProd(type, tile) {
  return computeProd({ type, tile, level: 1 });
}

function computeProd(b) {
  const m = G.mod, i = b.tile, L = 1 + 0.35 * (b.level - 1);
  const nb = (pred) => countNeighbours(i, pred);
  switch (b.type) {
    case 'hq': return { food: 8 };
    case 'farm': return { food: 30 * L * m.food };
    case 'dock': return { food: (16 + 2 * nb((t) => isWater(t))) * L * m.food };
    case 'lumber': return { wood: (6 + 6 * nb((t) => t === T.FOREST)) * L * m.prod };
    case 'quarry': return { stone: (4 + 5 * nb((t) => t === T.HILLS) + 7 * nb((t) => t === T.MOUNTAIN) + (W.type[i] === T.HILLS ? 6 : 0)) * L * m.prod };
    case 'mine': return { iron: (10 + 4 * nb((t) => t === T.MOUNTAIN) + 2 * nb((t) => t === T.HILLS)) * L * m.prod };
    default: return null;
  }
}

// ------------------------------------------------------------------ economy, once a game second

const TAX = 1.8, EAT = 0.6; // per resident per minute

export const isFoodBuilding = (b) => b.type === 'farm' || b.type === 'dock';
export const staffing = (b) => (b.type === 'hq' ? 1 : isFoodBuilding(b) ? G.effFood : G.eff);

export function econTick() {
  let housing = 0, foodJobs = 0, otherJobs = 0;
  for (const b of G.buildings) {
    if (!b.connected) continue;
    housing += housingOf(b);
    if (isFoodBuilding(b)) foodJobs += jobsOf(b); else otherJobs += jobsOf(b);
  }
  G.housing = housing;
  G.jobs = foodJobs + otherJobs;
  const prevEff = G.eff;
  // farms and docks are staffed first, so a hungry town can always feed itself
  G.effFood = foodJobs > 0 ? Math.min(1, G.pop / foodJobs) : 1;
  G.eff = otherJobs > 0 ? Math.min(1, Math.max(0, G.pop - foodJobs) / otherJobs) : 1;

  const rates = { food: 0, wood: 0, stone: 0, iron: 0, gold: 0 };
  for (const b of G.buildings) {
    if (!b.connected || !b.prod) continue;
    const f = staffing(b);
    for (const k in b.prod) rates[k] += b.prod[k] * f;
  }
  // taxes: residents spread evenly over the homes
  const occ = housing > 0 ? Math.min(1, G.pop / housing) : 0;
  let tax = 0;
  for (const b of G.buildings) {
    if (!b.connected) continue;
    const h = housingOf(b);
    if (h) tax += h * occ * TAX * (b.marketBoost ? 1.5 : 1);
  }
  rates.gold += tax * G.mod.tax;
  rates.food -= G.pop * EAT;
  G.rates = rates;
  for (const k of RES) G.res[k] = Math.max(0, G.res[k] + rates[k] / 60);

  G.starving = G.res.food <= 0.01 && rates.food < 0;
  if (G.pop > housing) {
    G.pop = Math.max(housing, G.pop - 1);
  } else if (G.starving) {
    G.growT += 1;
    // a skeleton crew always stays on at the Town Hall
    if (G.growT >= 4) { G.growT = 0; G.pop = Math.max(Math.min(4, housing), G.pop - 1); notify('Your people are starving! Build farms or docks.', 'bad'); }
  } else if (G.pop < housing && G.res.food > 1) {
    G.growT += 1;
    const interval = Math.max(0.6, 2.2 - housing / 120);
    while (G.growT >= interval && G.pop < housing) { G.growT -= interval; G.pop++; }
  } else {
    G.growT = 0;
  }
  if (Math.abs(prevEff - G.eff) > 0.001) refreshWeaponStats();
}

function refreshWeaponStats() {
  for (const b of G.buildings) if (b.def.weapon) b.ws = weaponStats(b);
}

// The market sells raw materials for gold
export const TRADES = [
  { res: 'wood', amt: 25, gold: 55 },
  { res: 'stone', amt: 25, gold: 70 },
  { res: 'iron', amt: 15, gold: 80 },
  { res: 'food', amt: 40, gold: 45 },
];
export function trade(k) {
  const t = TRADES[k];
  if (!t) return 'Unknown trade';
  if (!G.buildings.some((b) => b.type === 'market' && b.connected)) return 'Needs a Market connected by road';
  if (G.res.gold < t.gold) return 'Not enough gold';
  G.res.gold -= t.gold;
  G.res[t.res] += t.amt;
  return null;
}

export function buyResearch(id) {
  const r = RESEARCH_BY_ID[id];
  const lvl = G.research[id] || 0;
  if (lvl >= r.max) return 'Fully researched';
  if (r.req && !(G.research[r.req] > 0)) return `Requires ${RESEARCH_BY_ID[r.req].name}`;
  if (!G.buildings.some((b) => b.type === 'college' && b.connected)) return 'Build a War College connected by road';
  const cost = r.cost(lvl);
  if (!canAfford(cost)) return 'Not enough resources';
  pay(cost);
  G.research[id] = lvl + 1;
  const oldBhp = G.mod.bhp;
  refreshStats();
  if (G.mod.bhp !== oldBhp) {
    for (const b of G.buildings) {
      const f = G.mod.bhp / oldBhp;
      b.maxHp *= f; b.hp *= f;
    }
  }
  notify(`Research complete: ${r.name}${r.max > 1 ? ' ' + ['I', 'II', 'III'][lvl] : ''}`, 'good');
  return null;
}

// ------------------------------------------------------------------ new game / save / load

export function resetState(seed) {
  G.seed = seed;
  G.time = 0; G.speed = 1; G.paused = false;
  G.res = { food: 80, wood: 150, stone: 80, iron: 0, gold: 200 };
  G.rates = { food: 0, wood: 0, stone: 0, iron: 0, gold: 0 };
  G.pop = 8; G.housing = 10; G.jobs = 0; G.eff = 1; G.effFood = 1; G.starving = false; G.growT = 0; G.econT = 0;
  G.buildings = []; G.byId = new Map(); G.nextId = 1; G.hq = null;
  G.enemies = []; G.allies = []; G.projectiles = [];
  G.research = {};
  G.mod = computeMods({});
  G.stats = { kills: 0, built: 0, lost: 0, waves: 0, shots: 0 };
  G.victory = false;
  G.selected = null; G.tool = null;
}

export function newGame(seed, genWave) {
  generateWorld(seed);
  initPath();
  resetState(seed);
  addBuilding('hq', W.center, true);
  G.stats.built = 0;
  G.wave = { n: 1, state: 'prep', timer: FIRST_WAVE_DELAY, elapsed: 0, plan: genWave(1), queue: [], current: 0 };
  recomputeConnectivity();
  for (const k in G.dirty) G.dirty[k] = true;
}

const SAVE_KEY = 'bastion.save.v1';

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}

export function saveGame() {
  if (G.mode !== 'play' || G.wave.state !== 'prep') return false;
  const roads = [], ruins = [], forest = [];
  for (let i = 0; i < W.count; i++) {
    if (W.road[i]) roads.push(i);
    if (W.ruin[i]) ruins.push(i, W.ruin[i]);
  }
  // forests cleared by building are remembered so the island matches on load
  for (let i = 0; i < W.count; i++) if (W.type[i] === T.GRASS && W._origForest && W._origForest[i]) forest.push(i);
  const data = {
    v: 1, seed: G.seed, time: G.time, res: G.res, pop: G.pop, research: G.research, stats: G.stats, victory: G.victory,
    wave: { n: G.wave.n, timer: G.wave.timer, plan: G.wave.plan },
    buildings: G.buildings.map((b) => [b.type, b.tile, b.level, Math.round(b.hp / b.maxHp * 1000) / 1000, Math.round(b.yaw * 1000) / 1000]),
    roads, ruins, cleared: forest,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}

export function loadGame() {
  let data;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { data = null; }
  if (!data || data.v !== 1) return false;
  generateWorld(data.seed);
  initPath();
  rememberForests();
  resetState(data.seed);
  G.time = data.time || 0;
  for (const i of data.cleared || []) if (W.type[i] === T.FOREST) W.type[i] = T.GRASS;
  for (const i of data.roads || []) W.road[i] = 1;
  for (let k = 0; k < (data.ruins || []).length; k += 2) W.ruin[data.ruins[k]] = data.ruins[k + 1];
  for (const [type, tile, level, hpf, yaw] of data.buildings) {
    if (!BUILDINGS[type]) continue;
    const b = addBuilding(type, tile, true);
    b.level = level;
    b.maxHp = b.def.hp * computeMods(data.research).bhp * (1 + 0.3 * (level - 1));
    b.hp = b.maxHp * hpf;
    b.yaw = yaw;
    b.born = -10;
  }
  G.res = { ...G.res, ...data.res };
  G.pop = data.pop;
  G.research = data.research || {};
  G.stats = { ...G.stats, ...data.stats };
  G.victory = !!data.victory;
  G.wave = { n: data.wave.n, state: 'prep', timer: data.wave.timer, elapsed: 0, plan: data.wave.plan, queue: [], current: 0 };
  recomputeConnectivity();
  for (const k in G.dirty) G.dirty[k] = true;
  return true;
}

export function rememberForests() {
  W._origForest = new Uint8Array(W.count);
  for (let i = 0; i < W.count; i++) if (W.type[i] === T.FOREST) W._origForest[i] = 1;
}

export function deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }

export { isWalkable, tileDist };
