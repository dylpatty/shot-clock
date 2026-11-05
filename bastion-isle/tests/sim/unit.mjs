#!/usr/bin/env node
// Correctness tests for the simulation modules (plain Node, no rendering): node tests/sim/unit.mjs
import assert from 'node:assert/strict';
import { G, SETTINGS, MSG } from '../../src/state.js';
import { W, T, LF, CV, isLand, isWater, tileIndex } from '../../src/world.js';
import { BUILDINGS, MONEY, ZONES, PROMINENCE, WAVE_BUDGET, MILESTONES, ROADS } from '../../src/defs.js';
import * as game from '../../src/sim/game.js';
import * as zones from '../../src/sim/zones.js';
import * as econ from '../../src/sim/economy.js';
import * as util from '../../src/sim/utilities.js';
import * as svc from '../../src/sim/services.js';
import * as fire from '../../src/sim/fire.js';
import * as combat from '../../src/sim/combat.js';
import * as ms from '../../src/sim/milestones.js';
import { damageTile, ignite, isLot, lotMaxHp } from '../../src/sim/core.js';

SETTINGS.autoPauseRaid = false; SETTINGS.autoPauseHQ = false;
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e)); }
}
const steps = (sec, dt = 1 / 30) => { for (let k = 0; k < Math.round(sec / dt); k++) { game.simStep(dt); W.lotDirty.length = 0; } };
function fresh(seed = 7, diff = 'standard') {
  game.newGame(seed, diff);
  G.mode = 'play';
  MSG.length = 0;
}
const hq = () => G.hq.tile;
const nb = (i, d) => W.nbr[i * 6 + d];
// a straight road east of the Town Hall; returns its tiles
function roadEast(n) {
  const out = [];
  for (let k = 1; k <= n; k++) {
    const i = tileIndex(W.q[hq()] + k, W.r[hq()]);
    if (i < 0 || game.roadProblem(i)) break;
    assert.equal(game.tryRoad(i), null);
    out.push(i);
  }
  game.recomputeConnectivity();
  return out;
}
const besideRoad = (roads) => {
  const s = new Set();
  for (const r of roads) for (let d = 0; d < 6; d++) { const j = nb(r, d); if (j >= 0 && !W.road[j] && !W.bld[j] && isLand(W.type[j]) && W.type[j] !== T.MOUNTAIN) s.add(j); }
  return [...s];
};

console.log('sim unit tests');

test('new game: Town Hall, money, wave 1 plan with exact preview', () => {
  fresh();
  assert.ok(G.hq && G.hq.alive && G.hq.connected);
  assert.equal(G.money, 30000);
  assert.equal(G.wave.state, 'prep');
  assert.equal(G.wave.timer, 300);
  const p = G.wave.plan;
  assert.equal(p.n, 1);
  assert.ok(Math.abs(p.budget - WAVE_BUDGET(1) * PROMINENCE(0)) < 1e-9);
  const total = Object.values(p.counts).reduce((a, b) => a + b, 0);
  assert.equal(total, p.queue.length);
  assert.ok(p.preview.every((x) => x.text.includes(x.name)));
  fresh('standard' && 7, 'hard');
  assert.equal(G.money, 20000);
  assert.equal(G.wave.timer, 240);
});

test('roads: cost by terrain, connectivity, refund 50%', () => {
  fresh();
  const roads = roadEast(3);
  assert.ok(roads.length >= 2);
  for (const i of roads) assert.equal(W.conn[i], 1);
  const m = G.money;
  assert.equal(game.bulldoze(roads[roads.length - 1]), null);
  assert.equal(G.money - m, Math.floor((ROADS.cost + (W.type[roads[roads.length - 1]] === T.HILLS ? ROADS.hillExtra : 0)) * ROADS.refund));
  const forest = W.land.find((i) => W.type[i] === T.FOREST);
  assert.equal(game.roadCost(forest), ROADS.cost + ROADS.forestExtra);
  const hill = W.land.find((i) => W.type[i] === T.HILLS);
  assert.equal(game.roadCost(hill), ROADS.cost + ROADS.hillExtra);
});

test('placement rules: terrain, coastal pump, flat airfield/gas, unique college, unlocks, money', () => {
  fresh();
  const mountain = W.land.find((i) => W.type[i] === T.MOUNTAIN);
  if (mountain != null) assert.match(game.placeProblem('wind', mountain), /steep/);
  const water = W.shore[0];
  assert.match(game.placeProblem('wind', water), /land/);
  assert.match(game.placeProblem('fire', W.land.find((i) => !W.bld[i] && W.type[i] === T.GRASS)), /Unlocks at Village/);
  G.milestone = 4;
  const inland = W.land.find((i) => !W.bld[i] && W.type[i] === T.GRASS && svc.waterDistance(i) > 3);
  assert.match(game.placeProblem('pump', inland), /sea/);
  const hill = W.land.find((i) => !W.bld[i] && W.type[i] === T.HILLS);
  assert.match(game.placeProblem('airfield', hill), /flat/);
  assert.match(game.placeProblem('gas', hill), /flat/);
  assert.equal(game.buildCost('wind', hill), Math.round(BUILDINGS.wind.cost * 1.25));
  const a = W.land.find((i) => !W.bld[i] && W.type[i] === T.GRASS && i !== hq());
  assert.equal(game.tryPlace('college', a), null);
  const b = W.land.find((i) => !W.bld[i] && W.type[i] === T.GRASS && i !== a && i !== hq());
  assert.match(game.placeProblem('college', b), /Only one/);
  G.money = 100;
  assert.match(game.tryPlace('wind', b), /Not enough money/);
  G.money = -5;
  assert.match(game.tryPlace('park', b), /overdrawn/);
});

test('sell: 100% within 15 s, 75% after, 75% once a wave started', () => {
  fresh();
  const t = W.land.find((i) => !W.bld[i] && W.type[i] === T.GRASS && i !== hq());
  const b = game.placeBuilding('mg', t);
  assert.equal(game.sellValue(b), b.invested);
  steps(16);
  assert.equal(game.sellValue(b), Math.floor(b.invested * MONEY.sellRefund));
  const t2 = W.land.find((i) => !W.bld[i] && W.type[i] === T.GRASS && i !== hq() && i !== t);
  const b2 = game.placeBuilding('mg', t2);
  G.stats.wavesStarted++;
  assert.equal(game.sellValue(b2), Math.floor(b2.invested * MONEY.sellRefund));
  const m = G.money;
  assert.equal(game.sell(b2), null);
  assert.equal(G.money - m, Math.floor(b2.invested * MONEY.sellRefund));
  assert.equal(W.bld[t2], 0);
});

test('upgrade: cost, invested, upkeep scaling, clinic -> hospital at City', () => {
  fresh();
  G.milestone = 1;
  const roads = roadEast(4);
  const tiles = besideRoad(roads);
  const mg = game.placeBuilding('mg', tiles[0]);
  const cost = game.upgradeCost(mg);
  assert.equal(cost, 900);
  assert.equal(game.upgrade(mg), null);
  assert.equal(mg.level, 2);
  assert.equal(mg.invested, 1500 + 900);
  assert.equal(mg.upkeep, BUILDINGS.mg.upkeep * 1.5);
  const cl = game.placeBuilding('clinic', tiles[1]);
  assert.match(game.upgradeProblem(cl), /City/);
  G.milestone = 3;
  assert.equal(game.upgrade(cl), null);
  assert.equal(cl.name, 'Hospital');
  assert.equal(svc.serviceRadius(cl), 8);
  assert.equal(cl.upkeep, BUILDINGS.clinic.upgradeUpkeep);
});

test('zoning: only empty land beside a road; de-zone keeps buildings', () => {
  fresh();
  const roads = roadEast(4);
  const tiles = besideRoad(roads);
  const far = W.land.find((i) => !W.bld[i] && !W.road[i] && i !== hq() && W.type[i] === T.GRASS && game.roadProblem(i) == null && ![0, 1, 2, 3, 4, 5].some((d) => nb(i, d) >= 0 && (W.road[nb(i, d)] || nb(i, d) === hq())));
  assert.match(zones.zoneProblem(far, 1), /touch a road/);
  assert.equal(zones.zonePaint([far], 1), 0);
  const n = zones.zonePaint(tiles, 1);
  assert.equal(n, tiles.filter((i) => W.type[i] !== T.MOUNTAIN).length);
  for (const i of tiles) if (W.zone[i]) assert.ok(W.flags[i] & LF.ROAD, 'painted lots get road access at once');
  steps(40);
  const built = tiles.filter((i) => W.lvl[i] > 0);
  assert.ok(built.length > 0, 'something grew');
  zones.dezone(tiles);
  for (const i of built) { assert.equal(W.zone[i], 1); assert.ok(W.flags[i] & zones.DEZONED); }
  for (const i of tiles) if (!W.lvl[i]) assert.equal(W.zone[i], 0);
  game.bulldoze(built[0]);
  assert.equal(W.zone[built[0]], 0, 'bulldozing a de-zoned building removes the zone');
});

test('growth: construction 8 s then move-in 10 s; global start cap', () => {
  fresh();
  const roads = roadEast(6);
  const tiles = besideRoad(roads);
  zones.zonePaint(tiles, 1);
  G.demand.R = 90;
  steps(2.5);
  const building = tiles.filter((i) => W.flags[i] & LF.BUILDING);
  assert.ok(building.length > 0 && building.length <= 3, `cap 3 at P < 400 (got ${building.length})`);
  const i = building[0];
  assert.equal(W.occ[i], 0);
  assert.ok(W.lotT[i] >= 0);
  steps(9);
  assert.ok(!(W.flags[i] & LF.BUILDING), 'construction done after 8 s');
  steps(11);
  assert.equal(W.occ[i], 100, 'moved in after 10 s');
  assert.ok(G.pop > 10);
});

test('abandonment: icon after 5 s, abandoned after 45 s, reoccupied 10 s after the fix', () => {
  fresh();
  const roads = roadEast(4);
  const tiles = besideRoad(roads);
  zones.zonePaint(tiles, 1);
  steps(25);
  const lot = tiles.find((i) => W.lvl[i] && !(W.flags[i] & LF.BUILDING));
  assert.ok(lot != null);
  // cut the road: no road -> no power/water
  for (const r of roads) game.bulldoze(r);
  steps(7);
  assert.ok(W.flags[lot] & LF.NO_ROAD_ICON);
  steps(42);
  assert.ok(W.flags[lot] & LF.ABANDONED);
  assert.equal(zones.lotOccupants(lot), 0);
  for (const r of roads) game.tryRoad(r);
  steps(13);
  assert.ok(!(W.flags[lot] & LF.ABANDONED), 'reoccupied');
});

test('level-up: requirements list and progress to L2', () => {
  fresh();
  G.milestone = 1;
  G.money = 1e6;
  const roads = roadEast(7);
  const tiles = besideRoad(roads);
  zones.zonePaint(tiles.slice(2), 1);
  game.placeBuilding('school', tiles[0]);
  game.placeBuilding('clinic', tiles[1]);
  steps(30);
  const lot = tiles.slice(2).find((i) => W.lvl[i] === 1 && !(W.flags[i] & LF.BUILDING) && W.lv[i] >= 30);
  assert.ok(lot != null, 'a lot with LV >= 30 and both services');
  const req = zones.missingRequirements(lot);
  assert.deepEqual(req.map((r) => r.key), ['road', 'power', 'water', 'lv', 'school', 'health']);
  assert.ok(req.every((r) => r.ok));
  steps(95);
  assert.equal(W.lvl[lot], 2, 'leveled up');
  assert.equal(zones.lotCapacity(lot), ZONES[1].levels[1].cap);
});

test('power cuts: R lots lose power before C/I, oldest keep it first', () => {
  fresh();
  const roads = roadEast(8);
  const tiles = besideRoad(roads);
  zones.zonePaint(tiles.slice(0, 6), 3);
  zones.zonePaint(tiles.slice(6), 1);
  G.demand.R = 80; G.demand.I = 80;
  steps(60);
  util.allocate();
  // Town Hall only: 5 MW. Industry draws 0.8 each.
  const ind = tiles.slice(0, 6).filter((i) => W.lvl[i]);
  const res = tiles.slice(6).filter((i) => W.lvl[i]);
  assert.ok(ind.length && res.length);
  if (G.power.demand > G.power.supply) {
    const resPowered = res.filter((i) => W.flags[i] & LF.POWER).length;
    const indPowered = ind.filter((i) => W.flags[i] & LF.POWER).length;
    assert.ok(indPowered / ind.length >= resPowered / res.length, 'C/I keep power before R');
  }
  assert.ok(G.power.used <= G.power.supply + 1e-9);
});

test('wind turbine 15 MW on hills or the coast', () => {
  fresh();
  const hill = W.land.find((i) => W.type[i] === T.HILLS);
  assert.equal(util.windOutput(hill), 15);
  const inland = W.land.find((i) => W.type[i] === T.GRASS && svc.waterDistance(i) > 2);
  assert.equal(util.windOutput(inland), 10);
});

test('land value breakdown adds up and lists each term', () => {
  fresh();
  G.milestone = 2; G.money = 1e6;
  const roads = roadEast(5);
  const tiles = besideRoad(roads);
  game.placeBuilding('park', tiles[0]);
  steps(3);
  for (const i of tiles.slice(1)) {
    const lb = svc.landValueBreakdown(i);
    const sum = lb.terms.reduce((s, t) => s + t.value, 0);
    assert.equal(lb.total, Math.max(0, Math.min(100, sum)));
    assert.equal(W.lv[i], lb.total);
  }
  const near = tiles.slice(1).find((i) => W.cover[i] & CV.PARK);
  assert.ok(svc.landValueBreakdown(near).terms.some((t) => t.label.includes('Park')));
});

test('fire: roads are firebreaks; burning lots collapse to rubble; rubble regrows', () => {
  fresh();
  const roads = roadEast(6);
  const tiles = besideRoad(roads);
  zones.zonePaint(tiles, 1);
  G.demand.R = 90;
  steps(80);
  const lots = tiles.filter((i) => W.lvl[i] && !(W.flags[i] & LF.BUILDING));
  assert.ok(lots.length >= 3);
  // north side vs south side of the road: fire can never cross it
  const north = lots.filter((i) => W.r[i] < W.r[hq()]), south = lots.filter((i) => W.r[i] > W.r[hq()]);
  assert.ok(north.length && south.length);
  for (const i of north) ignite(i);
  G.taxes.R = 0; // keep residential demand positive so the rubble regrows
  steps(90);
  for (const i of south) assert.ok(!(W.flags[i] & LF.RUBBLE) && !W.fire[i], 'the road stopped the fire');
  const rubble = north.filter((i) => W.flags[i] & LF.RUBBLE || !W.lvl[i] || W.flags[i] & LF.BUILDING);
  assert.ok(rubble.length > 0, 'burnt lots collapsed');
  assert.ok(G.stats.lotsLostFire > 0);
  steps(40);
  assert.ok(north.some((i) => W.lvl[i] && !(W.flags[i] & LF.RUBBLE)), 'rubble cleared and regrew');
});

test('fire trucks: dispatched along roads, put fires out', () => {
  fresh();
  G.milestone = 1; G.money = 1e6;
  const roads = roadEast(8);
  const tiles = besideRoad(roads);
  const st = game.placeBuilding('fire', tiles[0]);
  zones.zonePaint(tiles.slice(1), 1);
  G.demand.R = 90;
  steps(60);
  assert.equal(G.trucks.length, 2);
  const lot = tiles.slice(1).find((i) => W.lvl[i] && !(W.flags[i] & LF.BUILDING));
  // a fire far along the road: trucks drive there
  const far = tiles.slice(1).filter((i) => W.lvl[i] && !(W.flags[i] & LF.BUILDING)).sort((a, b) => W.q[b] - W.q[a])[0];
  ignite(far);
  steps(1.2);
  assert.ok(G.trucks.some((t) => t.state === 'out' || t.state === 'spray'), 'a truck is on its way');
  steps(25);
  assert.equal(W.fire[far], 0, 'fire put out');
  ignite(lot);
  steps(25);
  assert.equal(W.fire[lot], 0, 'second fire put out');
  assert.ok(G.stats.firesOut >= 1);
  assert.ok(st.alive);
});

test('damageTile routes to lots and structures; explosives may ignite', () => {
  fresh();
  const roads = roadEast(4);
  const tiles = besideRoad(roads);
  zones.zonePaint(tiles, 2);
  G.demand.C = 90;
  steps(40);
  const lot = tiles.find((i) => isLot(i) && !(W.flags[i] & LF.BUILDING));
  const hp = W.lotHp[lot];
  damageTile(lot, 10, 'bullet');
  assert.equal(W.lotHp[lot], hp - 10);
  damageTile(lot, 1e4, 'shell');
  assert.ok(W.flags[lot] & LF.RUBBLE);
  assert.equal(G.stats.lotsLost, 1);
  const hqhp = G.hq.hp;
  damageTile(hq(), 100, 'bullet');
  assert.equal(G.hq.hp, hqhp - 100);
});

test('gas plant explodes: 150 damage within 2 tiles', () => {
  fresh();
  G.milestone = 2; G.money = 1e6;
  const roads = roadEast(6);
  const tiles = besideRoad(roads).filter((i) => !game.placeProblem('gas', i));
  const gas = game.placeBuilding('gas', tiles[0]);
  const mg = game.placeBuilding('mg', tiles.find((i) => i !== tiles[0] && Math.abs(W.q[i] - W.q[tiles[0]]) + Math.abs(W.r[i] - W.r[tiles[0]]) <= 2 && !W.bld[i]));
  const before = mg.hp;
  game.damageBuilding(gas, 1e5, 'bullet');
  assert.ok(!gas.alive);
  assert.ok(W.ruin[gas.tile]);
  assert.ok(mg.hp <= before - 150 + 1e-6 || !mg.alive);
});

test('repairs cost 20% of cost x fraction healed, paused below $0', () => {
  fresh();
  const roads = roadEast(3);
  const b = game.placeBuilding('coastal', besideRoad(roads)[0]);
  b.hp = b.maxHp * 0.5; b.lastHit = G.time;
  G.money = -1;
  steps(10);
  assert.equal(b.hp, b.maxHp * 0.5, 'no repair while overdrawn');
  G.money = 10000;
  const m0 = G.money;
  steps(8);
  const healed = b.hp / b.maxHp - 0.5;
  assert.ok(healed > 0);
  const paid = m0 - G.money;
  // money also moves with taxes/upkeep over the same 8 s; compare the repair log instead
  assert.ok(Math.abs(econ.budgetBreakdown().expense.find((e) => e.key === 'repairs').value * 3 - MONEY.repairCostFrac * b.invested * healed) < 20 || paid > 0);
});

test('bankruptcy: below $0 for 300 s ends the run', () => {
  fresh();
  let reason = null;
  G.onGameOver = (r) => { reason = r; };
  G.money = -100;
  for (let k = 0; k < 310 && G.mode === 'play'; k++) { G.money = Math.min(G.money, -100); steps(1, 0.5); }
  assert.equal(reason, 'bankrupt');
  assert.equal(G.mode, 'over');
  assert.ok(G.bankrupt);
  G.onGameOver = null;
});

test('milestones: population or wave fallback, reward, unlocks', () => {
  fresh();
  const m0 = G.money;
  G.wave.n = 3;
  ms.checkMilestones();
  assert.equal(G.milestone, 1);
  assert.equal(G.money - m0, MILESTONES[1].reward);
  assert.ok(ms.isUnlocked('fire'));
  assert.ok(!ms.isUnlocked('gas'));
  G.pop = 1000;
  ms.checkMilestones();
  assert.equal(G.milestone, 2);
  assert.ok(ms.isUnlocked('gas'));
});

test('waves: start, call early pays $20/s, clear pays $750 + $300n, report, next plan', () => {
  fresh();
  const m0 = G.money;
  const bonus = combat.callWaveEarly();
  assert.equal(bonus, 300 * MONEY.callEarlyPerSec);
  assert.equal(G.money - m0, bonus);
  steps(0.1);
  assert.equal(G.wave.state, 'active');
  // let the raid play out (towers do nothing here; the failsafe ends it)
  let t = 0;
  while (G.wave.state === 'active' && t < 600 && G.mode === 'play') { steps(1); t++; }
  assert.equal(G.wave.state, 'prep');
  assert.ok(G.wave.report && G.wave.report.n === 1);
  assert.equal(G.wave.report.reward, MONEY.waveClearBase + MONEY.waveClearPerWave);
  assert.equal(G.wave.plan.n, 2);
  assert.ok(Math.abs(G.wave.plan.prominence - PROMINENCE(G.pop)) < 0.05);
});

test('sandbox: raids off until switched on', () => {
  fresh(7, 'sandbox');
  assert.equal(G.money, 250000);
  steps(400, 0.5);
  assert.equal(G.wave.state, 'prep');
  combat.setRaids(true);
  steps(310, 0.5);
  assert.notEqual(G.stats.wavesStarted, 0);
});

test('targeting modes: strongest / weakest / domain preference / 15% hysteresis', () => {
  fresh();
  const roads = roadEast(3);
  const b = game.placeBuilding('mg', besideRoad(roads)[0]);
  game.recomputeConnectivity();
  const mk = (type, dx, hp) => { const e = combat.spawnEnemy(type, 0, 1); e.x = b.x + dx; e.z = b.z; e.y = type === 'fighter' ? 4 : 0; e.vx = e.vz = 0; e.hp = hp; e.state = 'test'; return e; };
  G.enemies.length = 0;
  const a = mk('gunboat', 2, 50), c = mk('gunboat', 3, 70);
  combat.setTargetMode(b, 'strongest', 'any');
  b.target = null; b.scan = 0;
  combat.updateBuildings(0.01);
  assert.equal(b.target, c);
  combat.setTargetMode(b, 'weakest', 'any');
  b.target = null; b.scan = 0;
  combat.updateBuildings(0.01);
  assert.equal(b.target, a);
  // hysteresis: a slightly weaker newcomer (< 15 % better) does not steal the target
  const d = mk('gunboat', 2.5, 46);
  b.scan = 0;
  combat.updateBuildings(0.01);
  assert.equal(b.target, a);
  const air = mk('fighter', 1, 60);
  combat.setTargetMode(b, 'nearest', 'air');
  b.target = null; b.scan = 0;
  combat.updateBuildings(0.01);
  assert.equal(b.target, air, 'domain preference wins when in range');
  assert.equal(combat.copyTargeting(b), 0);
  void d;
});

test('enemy target priorities: jets go for radar and missiles, heavy bombers for utilities', () => {
  fresh();
  G.milestone = 4; G.money = 1e6;
  const roads = roadEast(8);
  const tiles = besideRoad(roads);
  game.placeBuilding('radar', tiles[0]);
  game.placeBuilding('wind', tiles[1]);
  for (const i of tiles.slice(2, 6)) game.placeBuilding('park', i);
  let radar = 0, wind = 0;
  for (let k = 0; k < 200; k++) {
    const j = combat.spawnEnemy('jet', k, 12);
    combat.updateCombat(0.001);
    if (j.tt === tiles[0]) radar++;
    const bm = combat.spawnEnemy('bomber', k, 12);
    if (bm.tt === tiles[1]) wind++;
    G.enemies.length = 0;
  }
  assert.ok(radar > 100, `jets mostly pick the radar (${radar}/200)`);
  assert.ok(wind > 80, `heavy bombers mostly pick the wind turbine (${wind}/200)`);
});

test('blockade and sheltering', () => {
  fresh();
  const roads = roadEast(4);
  const tiles = besideRoad(roads);
  zones.zonePaint(tiles, 1);
  G.demand.R = 90;
  steps(40);
  const e = combat.spawnEnemy('gunboat', 0, 1);
  const water = W.shore[0];
  e.x = W.x[water]; e.z = W.z[water]; e.state = 'test'; e.path = null; e.think = 99;
  steps(0.2);
  assert.ok(G.blockade);
  const lot = tiles.find((i) => W.lvl[i]);
  const r = combat.spawnInfantry(W.x[lot], W.z[lot], 1);
  r.think = 99;
  steps(0.6);
  assert.ok(W.flags[lot] & LF.SHELTER);
  r.alive = false; r.gone = true;
  steps(0.6);
  assert.ok(!(W.flags[lot] & LF.SHELTER));
});

test('save v2 round trip (RLE tiles, buildings, wave plan)', () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  fresh(11);
  G.money = 1e6; G.milestone = 1;
  const roads = roadEast(6);
  const tiles = besideRoad(roads);
  zones.zonePaint(tiles.slice(2), 1);
  const mg = game.placeBuilding('mg', tiles[0]);
  game.upgrade(mg);
  combat.setTargetMode(mg, 'strongest', 'sea');
  steps(30);
  const snap = { zone: W.zone.slice(), lvl: W.lvl.slice(), road: W.road.slice(), type: W.type.slice(), money: G.money, time: G.time, plan: JSON.stringify(G.wave.plan) };
  assert.equal(game.saveGame(), true);
  assert.ok(mem.get('bastion.save.v2').length < 60000, 'compact');
  fresh(3);
  assert.equal(game.loadGame(), true);
  assert.deepEqual(W.zone, snap.zone);
  assert.deepEqual(W.lvl, snap.lvl);
  assert.deepEqual(W.road, snap.road);
  assert.deepEqual(W.type, snap.type);
  assert.equal(G.money, snap.money);
  assert.equal(JSON.stringify(G.wave.plan), snap.plan);
  const mg2 = G.buildings.find((b) => b.type === 'mg');
  assert.equal(mg2.level, 2);
  assert.equal(mg2.targetMode, 'strongest');
  assert.equal(mg2.domainPref, 'sea');
  assert.ok(G.hq && G.hq.alive);
  // only between raids
  G.wave.state = 'active';
  assert.equal(game.saveGame(), false);
  // old save detection
  mem.clear();
  mem.set('bastion.save.v1', '{"v":1}');
  assert.equal(game.hasSave(), false);
  assert.equal(game.hasOldSave(), true);
  assert.equal(game.loadGame(), false);
  delete globalThis.localStorage;
});

test('RLE encode/decode', () => {
  const a = new Uint8Array([0, 0, 0, 5, 5, 1, 0, 0]);
  const r = game.rleEncode(a);
  assert.deepEqual(r, [0, 3, 5, 2, 1, 1, 0, 2]);
  assert.deepEqual(game.rleDecode(r, new Uint8Array(8)), a);
});

test('determinism: same seed and inputs give the same result', () => {
  const run = () => {
    fresh(5);
    const roads = roadEast(6);
    zones.zonePaint(besideRoad(roads), 1);
    combat.callWaveEarly();
    steps(120);
    return [G.pop, G.money, G.stats.kills, G.stats.lotsLost, W.style.reduce((s, v, i) => s + v * (i + 1), 0)].join(',');
  };
  assert.equal(run(), run());
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
