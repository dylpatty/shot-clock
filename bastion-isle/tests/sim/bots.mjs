// Scripted players for the balance harness. They use only the sim's public API (src/sim/*.js exports) and read
// G / W the way the UI does. One bot class with options:
//   balanced        grows the city and builds a defence sized to the planned raid
//   nodef           same city, never builds military
//   military        at most 15 lots, pours everything into towers
//   nofire          balanced, but never builds a fire station
import { G } from '../../src/state.js';
import { W, T, LF, CV, isLand } from '../../src/world.js';
import { BUILDINGS, ENEMIES } from '../../src/defs.js';
import { hexDist, angleDiff } from '../../src/hex.js';
import * as game from '../../src/sim/game.js';
import * as zones from '../../src/sim/zones.js';
import * as services from '../../src/sim/services.js';
import * as econ from '../../src/sim/economy.js';
import { isUnlocked } from '../../src/sim/milestones.js';

export const BOTS = {
  balanced: { defence: true, fire: true, maxLots: Infinity, civic: true, defMul: 1 },
  nodef: { defence: false, fire: true, maxLots: Infinity, civic: true, defMul: 0 },
  military: { defence: true, fire: true, maxLots: 15, civic: false, militaryOnly: true, defMul: 4 },
  nofire: { defence: true, fire: false, maxLots: Infinity, civic: true, defMul: 1 },
};

const mod = (a, m) => ((a % m) + m) % m;
const BIT = { fire: CV.FIRE, police: CV.POLICE, health: CV.HEALTH, school: CV.SCHOOL, park: CV.PARK, plaza: CV.PLAZA };
// which threat each tower answers (missiles count for sea and air)
const CAT = { coastal: { sea: 1 }, missile: { sea: 0.5, air: 0.5 }, flak: { air: 1 }, airfield: { air: 1 }, radar: { air: 0.5, sea: 0.5 }, mg: { ground: 1 }, barracks: { ground: 1 } };

export class Bot {
  constructor(kind) {
    this.kind = kind;
    this.o = BOTS[kind];
    this.t = 0;
  }

  init() {
    const hq = G.hq.tile;
    this.hq = hq; this.q0 = W.q[hq]; this.r0 = W.r[hq];
    // road pattern: every third axial row (so every other tile touches a road), plus a connector column every 8
    this.pattern = new Uint8Array(W.count);
    for (const i of W.land) {
      if (mod(W.r[i] - this.r0, 3) === 0 || mod(W.q[i] - this.q0, 8) === 0) this.pattern[i] = 1;
    }
    // BFS order of pattern tiles from the Town Hall: the order roads get built
    const seen = new Uint8Array(W.count), order = [], q = [hq];
    seen[hq] = 1;
    for (let k = 0; k < q.length; k++) {
      const c = q[k];
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[c * 6 + d];
        if (j < 0 || seen[j] || !this.pattern[j] || !isLand(W.type[j]) || W.type[j] === T.MOUNTAIN) continue;
        seen[j] = 1; q.push(j); order.push(j);
      }
    }
    this.roadPlan = order;
    this.roadIdx = 0;
    // industrial district: the 70 degree wedge with the most land
    let bestA = 0, bestN = -1;
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      let n = 0;
      for (const i of W.land) if (Math.abs(angleDiff(this.angle(i), ang)) < 0.6 && this.distHQ(i) > 3) n++;
      if (n > bestN) { bestN = n; bestA = ang; }
    }
    this.indAngle = bestA;
  }

  angle(i) { return Math.atan2(W.x[i] - W.x[this.hq], W.z[i] - W.z[this.hq]); }
  isInd(i) { return Math.abs(angleDiff(this.angle(i), this.indAngle)) < 0.6 && this.distHQ(i) > 2; }
  distHQ(i) { return hexDist(W.q[i], W.r[i], this.q0, this.r0); }
  count(type) { let n = 0; for (const b of G.buildings) if (b.type === type) n++; return n; }
  lotsBuilt() { return G.lotCounts.R + G.lotCounts.C + G.lotCounts.I; }

  // tiles next to a connected road (or the Town Hall) where something could be placed
  frontage(filterFn) {
    const out = [];
    for (const i of W.land) {
      if (this.pattern[i] || W.bld[i] || W.road[i] || W.ruin[i]) continue;
      if (W.zone[i] && (W.lvl[i] || W.flags[i] & LF.RUBBLE)) continue;
      let ok = false;
      for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && (W.conn[j] || j === this.hq)) { ok = true; break; } }
      if (ok && (!filterFn || filterFn(i))) out.push(i);
    }
    return out;
  }

  tick() {
    this.t++;
    if (G.mode !== 'play') return;
    if (this.o.militaryOnly) { this.tickMilitaryOnly(); return; }
    this.manageTaxes();
    this.manageUtilities();
    this.manageZones();
    if (this.t % 2) return;
    this.manageRuins();
    // spending order: urgent defence, first fire station, services, defence, the rest
    const deficit = this.o.defence ? this.defenceDeficit() : 0;
    // defence first while it is short of the planned raid, then the city
    if (deficit > 0.1 && this.manageDefence(deficit > 0.4 ? 300 : 1200)) return;
    if (this.manageServices(deficit)) return;
    if (this.o.defence) this.manageDefence(4000);
  }

  // ---------------------------------------------------------------- city

  manageTaxes() {
    for (const k of ['R', 'C', 'I']) {
      const D = G.demand[k];
      let t = G.taxes[k];
      if (D > 40 && t < 12) t++;
      else if (D < -5 && t > 9) t--;
      econ.setTax(k, t);
    }
  }

  manageUtilities() {
    const p = G.power, w = G.water;
    // spare capacity against bombers knocking out a plant or two
    const pMargin = Math.max(5, 0.25 * p.demand), wMargin = Math.max(4, 0.25 * w.demand);
    if (p.supply - p.demand < pMargin && G.money > 1600) {
      let best = -1, bs = -1e9;
      for (const i of this.frontage()) {
        if (game.placeProblem('wind', i)) continue;
        const wd = services.waterDistance(i);
        const bonus = W.type[i] === T.HILLS ? 50 : wd <= 1 ? 20 : 0;
        const s = bonus + Math.min(wd, 5) * 4 - this.distHQ(i) * 0.3 - (W.zone[i] ? 30 : 0);
        if (s > bs) { bs = s; best = i; }
      }
      if (best >= 0) game.placeBuilding('wind', best);
    }
    if (w.supply - w.demand < wMargin && G.money > 1600) {
      const usePump = isUnlocked('pump') && G.money > 9000 && w.demand > 20;
      const tiles = this.frontage();
      for (const type of usePump ? ['pump', 'watertower'] : ['watertower']) {
        let best = -1, bs = -1e9;
        for (const i of tiles) {
          if (game.placeProblem(type, i)) continue;
          const s = (type === 'pump' ? 0 : Math.min(services.waterDistance(i), 5) * 4) - this.distHQ(i) * 0.3 - (W.zone[i] ? 20 : 0);
          if (s > bs) { bs = s; best = i; }
        }
        if (best >= 0) { game.placeBuilding(type, best); break; }
      }
    }
  }

  manageZones() {
    if (!this.o.civic) return;
    const P = G.pop;
    const want = { R: 4 + P / 150, C: 2 + P / 800, I: 2 + P / 600 };
    const free = G.lotCounts.free;
    let needRoads = false;
    for (const [k, z] of [['R', 1], ['C', 2], ['I', 3]]) {
      if (G.demand[k] < 5 || free[k] >= want[k]) continue;
      if (this.lotsBuilt() + free.R + free.C + free.I >= this.o.maxLots) return;
      const n = Math.ceil(want[k] - free[k]);
      const cands = this.frontage((i) => !W.zone[i] && !zones.zoneProblem(i, z) && (z === 3 ? this.isInd(i) : !this.isInd(i)));
      if (cands.length < n) needRoads = true;
      // R: high land value, near the centre; C: near the centre; I: inside the district, near the centre
      cands.sort((a, b) => (z === 1 ? (W.lv[b] - W.lv[a]) * 0.3 : 0) + this.distHQ(a) - this.distHQ(b));
      zones.zonePaint(cands.slice(0, n), z);
    }
    if (needRoads) this.extendRoads(6);
  }

  extendRoads(n) {
    let built = 0;
    while (built < n && this.roadIdx < this.roadPlan.length && G.money > 600) {
      const i = this.roadPlan[this.roadIdx++];
      if (W.road[i]) continue;
      let adj = false;
      for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && (W.road[j] || j === this.hq)) { adj = true; break; } }
      if (!adj) continue;
      if (!game.tryRoad(i)) built++;
    }
    if (built) game.recomputeConnectivity();
  }

  // place a service where it covers the most lots that lack it; returns true when built
  placeService(type, lotFilter, minGain) {
    const d = BUILDINGS[type];
    const r = d.radius || 2, bit = BIT[d.cover];
    const lots = [];
    for (const j of W.land) {
      if (!W.zone[j] || !W.lvl[j] || (bit && W.cover[j] & bit)) continue;
      if (lotFilter && !lotFilter(j)) continue;
      lots.push(j);
    }
    if (lots.length < minGain) return false;
    let best = -1, bs = 0;
    for (const i of this.frontage((t) => !game.placeProblem(type, t) && !W.zone[t])) {
      let s = 0;
      const qi = W.q[i], ri = W.r[i];
      for (const j of lots) if (hexDist(qi, ri, W.q[j], W.r[j]) <= r) s += 1 + 0.3 * W.lvl[j];
      if (s > bs) { bs = s; best = i; }
    }
    if (best < 0 || bs < minGain) return false;
    return typeof game.placeBuilding(type, best) !== 'string';
  }

  manageServices(deficit) {
    if (!this.o.civic) return false;
    const m = G.money;
    const lots = this.lotsBuilt();
    // the first fire station as soon as it unlocks (fires spread fast without one)
    if (this.o.fire && isUnlocked('fire') && !this.count('fire')) {
      if (m > BUILDINGS.fire.cost + 300) return this.placeService('fire', null, 1);
      return true; // save up for it
    }
    // school + clinic over homes first: level 2 triples the residents, so they pay for themselves in minutes
    const urgent = deficit > 0.5 ? 4000 : 800;
    const tryBuild = (type, filt, min, keep = urgent) => isUnlocked(type) && m > BUILDINGS[type].cost + keep && this.placeService(type, filt, min);
    const homes = (j) => W.zone[j] === 1;
    if (this.count('school') <= this.count('clinic') ? tryBuild('school', homes, 10) || tryBuild('clinic', homes, 10) : tryBuild('clinic', homes, 10) || tryBuild('school', homes, 10)) return true;
    if (this.o.fire && tryBuild('fire', null, 18, urgent + 1500)) return true;
    if (tryBuild('police', (j) => W.zone[j] !== 3, 16, urgent + 2500)) return true;
    // land value for level 3 homes: parks, then plazas
    if (lots > 30 && tryBuild('park', (j) => homes(j) && W.lvl[j] >= 2, 6, urgent + 2000)) return true;
    if (G.milestone >= 3 && tryBuild('plaza', (j) => homes(j) && W.lvl[j] >= 2, 10, urgent + 4000)) return true;
    const spare = m - (deficit > 0.2 ? 8000 : 3000);
    // hospital upgrades in the City era
    for (const b of G.buildings) if (b.type === 'clinic' && !game.upgradeProblem(b) && spare > 10000) { game.upgrade(b); return true; }
    // a War College and research once the city is rich
    if (isUnlocked('college') && !this.count('college') && spare > 25000) {
      const t = this.frontage((i) => !game.placeProblem('college', i) && !W.zone[i])[0];
      if (t != null) { game.placeBuilding('college', t); return true; }
    }
    if (G.buildings.some((b) => b.type === 'college' && b.powered)) {
      for (const id of ['civic', 'ballistics', 'firebrigade', 'loaders', 'concrete', 'optics', 'sirens', 'drills', 'fuzes', 'jets']) {
        const c = game.researchCost(id);
        if (c != null && !game.researchProblem(id) && spare > c + 15000) { game.buyResearch(id); return true; }
      }
    }
    return false;
  }

  // Ruins: rebuild military, utilities and services; clear the rest (rubble costs neighbours land value)
  manageRuins() {
    for (const i of W.land) {
      if (!W.ruin[i]) continue;
      const type = game.ruinType(i);
      const kind = BUILDINGS[type] && BUILDINGS[type].kind;
      const keep = kind === 'utility' || kind === 'service' || (kind === 'military' && this.o.defence);
      if (keep) {
        const urgent = kind === 'utility';
        if (G.money > game.ruinCost(i) + (urgent ? 300 : 3000) && (urgent || G.wave.state === 'prep')) game.rebuildRuin(i);
      } else game.bulldoze(i);
    }
  }

  // ---------------------------------------------------------------- defence

  // Share of the planned raid's budget by threat category
  threatShares() {
    const plan = G.wave.plan;
    const s = { sea: 0, air: 0, ground: 0 };
    let tot = 0;
    for (const k in plan.counts) {
      const d = ENEMIES[k], c = d.cost * plan.counts[k];
      if (k === 'landing') s.ground += c; else s[d.domain] += c;
      tot += c;
    }
    // raiders do most of the damage once ashore: ground defence gets at least a third
    const floor = { sea: 0.25, air: 0.15, ground: 0.35 };
    for (const k in s) s[k] = Math.max(floor[k], s[k] / Math.max(1, tot));
    const sum = s.sea + s.air + s.ground;
    for (const k in s) s[k] /= sum;
    return s;
  }
  // $ of towers wanted for the planned raid
  wantedValue() { return 260 * G.wave.plan.budget * this.o.defMul; }
  valueBy() {
    const v = { sea: 0, air: 0, ground: 0, total: 0 };
    for (const b of G.buildings) {
      const c = CAT[b.type];
      if (!c) continue;
      for (const k in c) v[k] += b.invested * c[k];
      v.total += b.invested;
    }
    return v;
  }
  defenceDeficit() {
    const want = this.wantedValue();
    return want > 0 ? Math.max(0, 1 - this.valueBy().total / want) : 0;
  }

  likelyBeach() {
    const goal = services.lvCluster();
    let best = -1, bd = Infinity;
    for (const i of W.landing) {
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[i * 6 + d];
        if (j < 0 || !isLand(W.type[j])) continue;
        const dd = Math.hypot(W.x[j] - W.x[goal], W.z[j] - W.z[goal]);
        if (dd < bd) { bd = dd; best = j; }
      }
    }
    return best;
  }

  siteScore(type, i) {
    const dirs = G.wave.plan ? G.wave.plan.dirs : [0];
    const wd = services.waterDistance(i);
    const ang = Math.atan2(W.x[i], W.z[i]);
    let da = 9;
    for (const a of dirs) da = Math.min(da, Math.abs(angleDiff(ang, a)));
    let spread = 0;
    for (const b of G.buildings) if (b.type === type && hexDist(W.q[b.tile], W.r[b.tile], W.q[i], W.r[i]) < 3) spread++;
    const zonePen = W.zone[i] ? 6 : 0;
    const beach = this.beach;
    const db = beach >= 0 ? hexDist(W.q[beach], W.r[beach], W.q[i], W.r[i]) : 8;
    switch (type) {
      case 'coastal': return (wd <= 2 ? 20 : -50) - da * 4 - spread * 12 - zonePen;
      case 'mg': {
        // on the raiders' way: near the likely beach, or near the Town Hall (their goal)
        const dh = this.distHQ(i);
        return 20 - Math.min(db * 2.5, dh * 2 + 4) - spread * 6 - zonePen;
      }
      case 'barracks': return 20 - db * 2 - spread * 8 - zonePen;
      case 'flak': case 'missile': case 'radar': {
        let near = 0;
        for (const b of G.buildings) if (hexDist(W.q[b.tile], W.r[b.tile], W.q[i], W.r[i]) <= 5) near += b.def.kind === 'military' ? 2 : 1;
        return near - spread * 6 - zonePen - this.distHQ(i) * 0.3;
      }
      case 'airfield': return 10 - this.distHQ(i) * 0.3 - zonePen;
      default: return 0;
    }
  }

  placeTower(type) {
    let best = -1, bs = -1e9;
    for (const i of this.frontage((t) => !game.placeProblem(type, t) && (type !== 'coastal' || services.waterDistance(t) <= 2))) {
      const s = this.siteScore(type, i);
      if (s > bs) { bs = s; best = i; }
    }
    if (type === 'coastal' && (best < 0 || bs < -5)) { this.roadToCoast(); if (best < 0) return false; }
    if (best < 0) return false;
    return typeof game.placeBuilding(type, best) !== 'string';
  }

  roadToCoast() {
    const dirs = G.wave.plan ? G.wave.plan.dirs : [0];
    let goal = -1, bs = Infinity;
    for (const i of W.coast) {
      if (W.type[i] === T.MOUNTAIN || W.bld[i]) continue;
      let da = 9;
      for (const a of dirs) da = Math.min(da, Math.abs(angleDiff(Math.atan2(W.x[i], W.z[i]), a)));
      const s = da * 10 + this.distHQ(i) * 0.3;
      if (s < bs) { bs = s; goal = i; }
    }
    if (goal < 0) return;
    let start = -1, sd = Infinity;
    for (const i of W.land) if (W.conn[i]) { const d = hexDist(W.q[i], W.r[i], W.q[goal], W.r[goal]); if (d < sd) { sd = d; start = i; } }
    if (start < 0) start = this.hq;
    const rp = game.roadPath(start, goal);
    if (rp.cost > 0 && rp.cost < G.money - 2000) {
      game.buildRoads(rp.tiles.slice(0, -1).filter((j) => !W.road[j]));
      game.recomputeConnectivity();
    }
  }

  // the cheapest upgrade among towers of these types
  cheapestUpgrade(types) {
    let best = null, bc = Infinity;
    for (const b of G.buildings) {
      if (!types.includes(b.type)) continue;
      const c = game.upgradeCost(b);
      if (c == null || game.upgradeProblem(b)) continue;
      if (c < bc) { bc = c; best = b; }
    }
    return best;
  }

  // Buy one tower or upgrade for the most under-defended threat. Returns true when money was spent.
  manageDefence(cushion) {
    const want = this.wantedValue();
    const have = this.valueBy();
    if (have.total >= want) return false;
    this.beach = this.likelyBeach();
    const sh = this.threatShares();
    const gap = (k) => 1 - have[k] / Math.max(1, want * sh[k]);
    const cats = ['sea', 'air', 'ground'].filter((k) => gap(k) > 0).sort((a, b) => gap(b) - gap(a));
    for (const cat of cats) if (this.buyFor(cat, cushion)) return true;
    return false;
  }

  buyFor(cat, cushion) {
    const n = G.wave.n, m = G.milestone;
    const can = (type) => isUnlocked(type) && G.money >= BUILDINGS[type].cost + cushion;
    const opts = [];
    if (cat === 'sea') {
      if (m >= 3 && this.count('missile') < 1 + this.count('coastal') / 4) opts.push('missile');
      if (this.count('coastal') < 3 + n / 2) opts.push('coastal');
      opts.push('up:coastal,missile');
    } else if (cat === 'air') {
      if (m >= 2 && !this.count('radar')) opts.push('radar');
      if (m >= 4 && !this.count('airfield')) opts.push('airfield');
      if (m >= 3 && this.count('missile') < 1 + this.count('flak') / 4) opts.push('missile');
      if (this.count('flak') < 2 + n / 2) opts.push('flak');
      opts.push('up:flak,missile,airfield');
    } else {
      if (m >= 1 && this.count('barracks') < 1 + Math.floor(n / 6)) opts.push('barracks');
      if (this.count('mg') < 2 + n / 2) opts.push('mg');
      opts.push('up:mg,barracks');
    }
    for (const o of opts) {
      if (o.startsWith('up:')) {
        const b = this.cheapestUpgrade(o.slice(3).split(','));
        if (b && G.money >= game.upgradeCost(b) + cushion) { game.upgrade(b); return true; }
      } else if (can(o) && this.placeTower(o)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- all-military player

  tickMilitaryOnly() {
    if (this.t === 1) {
      this.extendRoads(14);
      const cands = this.frontage((i) => !zones.zoneProblem(i, 1));
      zones.zonePaint(cands.slice(0, 9), 1);
      zones.zonePaint(cands.slice(9, 12), 2);
      zones.zonePaint(cands.slice(12, 15), 3);
    }
    this.manageUtilities();
    if (this.t % 2) return;
    this.manageRuins();
    if (!this.manageDefence(0) && this.roadIdx < 150 && G.money > 3000) this.extendRoads(4);
  }
}
