// Service coverage, pollution, noise and land value fields (concrete_specs 8, 10; should_change 4).
// W.cover (bitmask) and W.poll are rebuilt only when something that affects them changes; W.lv is recomputed
// every 2 s from those fields plus a static per-tile base (coast, hills, forest neighbours).
import { W, LF, CV, T, isWater, isLand } from '../world.js';
import { G } from '../state.js';
import { ZONES } from '../defs.js';
import { tilesWithin } from './core.js';
import { lotPollution, lotLevelNow } from './zones.js';
import { powerNeed } from './utilities.js';

export const COVER_BIT = { fire: CV.FIRE, police: CV.POLICE, health: CV.HEALTH, school: CV.SCHOOL, park: CV.PARK, plaza: CV.PLAZA };
// Noise radius per structure: defs `noise`, with the MG post at 1 (spec; requested for defs.mg)
const NOISE_FALLBACK = { mg: 1 };
const SVC = {
  covDirty: true, pollDirty: true, lastPoll: -1e9, nextLV: 0.85, baseDirty: true, lvClusterT: -1e9, lvCluster: -1,
};
let lvBase = null, wdist = null, pollF = null;
const tmp = [];

export function markCoverageDirty() { SVC.covDirty = true; G.dirty.coverage = true; }
export function markPollutionDirty() { SVC.pollDirty = true; }
export function markTerrainDirty() { SVC.baseDirty = true; }

export function resetServices() {
  const n = W.count;
  lvBase = new Int8Array(n);
  wdist = new Uint8Array(n);
  pollF = new Float32Array(n);
  SVC.covDirty = true; SVC.pollDirty = true; SVC.lastPoll = -1e9; SVC.nextLV = 0.85; SVC.baseDirty = true;
  SVC.lvClusterT = -1e9; SVC.lvCluster = -1;
  computeWaterDistance();
}

// Hex distance from every tile to the nearest water tile (0 for water), capped at 255
function computeWaterDistance() {
  wdist.fill(255);
  const q = [];
  for (let i = 0; i < W.count; i++) if (isWater(W.type[i])) { wdist[i] = 0; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const c = q[k];
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[c * 6 + d];
      if (j >= 0 && wdist[j] > wdist[c] + 1) { wdist[j] = wdist[c] + 1; q.push(j); }
    }
  }
}
export const waterDistance = (i) => wdist[i];

// A forest tile is built on: it becomes grass (trees removed, land value of neighbours changes)
export function clearForest(i) {
  if (W.type[i] !== T.FOREST) return;
  W.type[i] = T.GRASS;
  G.dirty.trees = true; G.dirty.terrainColors = true; G.dirty.minimap = true;
  W.version++;
  SVC.baseDirty = true;
}

function forestNeighbours(i) {
  let n = 0;
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.type[j] === T.FOREST) n++; }
  return n;
}
const coastTerm = (i) => (wdist[i] <= 2 ? 8 : wdist[i] === 3 ? 4 : 0);
function rebuildBase() {
  SVC.baseDirty = false;
  for (const i of W.land) lvBase[i] = coastTerm(i) + (W.type[i] === T.HILLS ? 4 : 0) + Math.min(9, 3 * forestNeighbours(i));
}

// Service radius in hex tiles (the clinic grows into a hospital)
export function serviceRadius(b) {
  if (b.type === 'clinic' && b.level >= 2) return b.def.upgradeRadius || 8;
  return b.def.radius || 0;
}
const works = (b) => b.alive && b.connected && (powerNeed(b) === 0 || b.powered);

// ------------------------------------------------------------------ fields

function recomputeCoverage() {
  SVC.covDirty = false;
  W.cover.fill(0);
  for (const b of G.buildings) {
    if (!b.alive) continue;
    const d = b.def;
    // service and park coverage
    if (d.cover && works(b)) {
      const bit = COVER_BIT[d.cover];
      tilesWithin(b.tile, serviceRadius(b), tmp);
      for (const j of tmp) W.cover[j] |= bit;
    }
    // inside flak or missile range (+6 land value)
    if ((b.type === 'flak' || b.type === 'missile') && works(b)) {
      const range = b.ws ? b.ws.range : d.weapon.range;
      tilesWithin(b.tile, Math.floor(range / 1.732), tmp);
      for (const j of tmp) W.cover[j] |= CV.AA;
    }
    // noise from guns, launchers, the airfield and the gas plant
    const noise = d.noise || NOISE_FALLBACK[b.type] || 0;
    if (noise) {
      const bit = noise >= 2 ? CV.NOISE2 : CV.NOISE1;
      tilesWithin(b.tile, noise, tmp);
      for (const j of tmp) W.cover[j] |= bit;
    }
  }
  G.dirty.fields = true;
}

// Pollution = sum over sources of s x max(0, 1 - d / r), capped at 60
function recomputePollution() {
  SVC.pollDirty = false;
  SVC.lastPoll = G.time;
  pollF.fill(0);
  const add = (i, s, r) => {
    tilesWithin(i, r, tmp);
    const q0 = W.q[i], r0 = W.r[i];
    for (const j of tmp) {
      const dq = W.q[j] - q0, dr = W.r[j] - r0;
      const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
      const f = 1 - dist / r;
      if (f > 0) pollF[j] += s * f;
    }
  };
  const rI = ZONES[3].pollRadius || 3;
  for (const i of W.land) {
    if (W.zone[i] !== 3) continue;
    const s = lotPollution(i);
    if (s > 0) add(i, s, rI);
  }
  for (const b of G.buildings) if (b.alive && b.def.pollution) add(b.tile, b.def.pollution, b.def.pollRadius || 4);
  for (let i = 0; i < W.count; i++) W.poll[i] = Math.min(60, Math.round(pollF[i]));
  G.dirty.fields = true;
}

function rubbleNeighbours(i) {
  let n = 0;
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[i * 6 + d];
    if (j >= 0 && (W.flags[j] & LF.RUBBLE || W.ruin[j])) n++;
  }
  return n;
}

const SVC_BITS = CV.FIRE | CV.POLICE | CV.HEALTH | CV.SCHOOL;
function popcount4(c) { return (c & CV.FIRE ? 1 : 0) + (c & CV.POLICE ? 1 : 0) + (c & CV.HEALTH ? 1 : 0) + (c & CV.SCHOOL ? 1 : 0); }

function landValueOf(i) {
  const c = W.cover[i];
  let v = 20 + lvBase[i];
  v += Math.min(25, (c & CV.PARK ? 15 : 0) + (c & CV.PLAZA ? 20 : 0));
  if (c & SVC_BITS) v += 6 * popcount4(c);
  if (c & CV.AA) v += 6;
  v -= W.poll[i];
  v -= c & CV.NOISE2 ? 12 : c & CV.NOISE1 ? 6 : 0;
  v -= 10 * Math.min(2, rubbleNeighbours(i));
  return v < 0 ? 0 : v > 100 ? 100 : v;
}

function recomputeLandValue() {
  if (SVC.baseDirty) rebuildBase();
  const land = W.land;
  for (let k = 0; k < land.length; k++) { const i = land[k]; W.lv[i] = landValueOf(i); }
  G.dirty.fields = true;
}

// Coverage immediately when it changes; pollution at most once a second; land value every 2 s
export function tickServices() {
  if (G.mode !== 'play') return;
  if (SVC.covDirty) recomputeCoverage();
  if (SVC.pollDirty && G.time - SVC.lastPoll >= 1) recomputePollution();
  // (the second test re-anchors the schedule after a load moved G.time)
  if (G.time >= SVC.nextLV || SVC.nextLV - G.time > 2) { SVC.nextLV = G.time + 2; recomputeLandValue(); }
}

// Force every field now (new game, load, tests)
export function refreshFields() {
  rebuildBase();
  recomputeCoverage();
  recomputePollution();
  recomputeLandValue();
}

// ------------------------------------------------------------------ queries

// Land value tooltip: { total, terms: [{ label, value }] } listing every plus and minus for tile i
export function landValueBreakdown(i) {
  if (i < 0 || !isLand(W.type[i])) return { total: 0, terms: [] };
  const c = W.cover[i];
  const terms = [{ label: 'Base', value: 20 }];
  const coast = coastTerm(i);
  if (coast) terms.push({ label: wdist[i] <= 2 ? 'Sea view' : 'Near the sea', value: coast });
  if (W.type[i] === T.HILLS) terms.push({ label: 'Hillside', value: 4 });
  const fn = forestNeighbours(i);
  if (fn) terms.push({ label: `Forest nearby (${fn})`, value: Math.min(9, 3 * fn) });
  const park = c & CV.PARK ? 15 : 0, plaza = c & CV.PLAZA ? 20 : 0;
  if (park || plaza) {
    if (park && plaza) terms.push({ label: 'Park and plaza (max 25)', value: Math.min(25, park + plaza) });
    else terms.push({ label: park ? 'Park nearby' : 'Plaza nearby', value: park || plaza });
  }
  if (c & CV.FIRE) terms.push({ label: 'Fire cover', value: 6 });
  if (c & CV.POLICE) terms.push({ label: 'Police cover', value: 6 });
  if (c & CV.HEALTH) terms.push({ label: 'Healthcare', value: 6 });
  if (c & CV.SCHOOL) terms.push({ label: 'School', value: 6 });
  if (c & CV.AA) terms.push({ label: 'Under air defence', value: 6 });
  if (W.poll[i]) terms.push({ label: 'Pollution', value: -W.poll[i] });
  if (c & CV.NOISE2) terms.push({ label: 'Noise (guns, launchers, airfield, gas plant)', value: -12 });
  else if (c & CV.NOISE1) terms.push({ label: 'Noise (MG or flak)', value: -6 });
  const rb = Math.min(2, rubbleNeighbours(i));
  if (rb) terms.push({ label: `Rubble next door (${rb})`, value: -10 * rb });
  return { total: landValueOf(i), terms };
}

// Names of the services covering tile i
export function coverageAt(i) {
  const c = W.cover[i], out = [];
  for (const k in COVER_BIT) if (c & COVER_BIT[k]) out.push(k);
  if (c & CV.AA) out.push('aa');
  return out;
}

// The lot with the highest land value summed over standing lots within 2 tiles: landing craft head for the beach
// nearest it. Cached for 30 s.
export function lvCluster() {
  if (G.time - SVC.lvClusterT < 30 && SVC.lvCluster >= 0) return SVC.lvCluster;
  SVC.lvClusterT = G.time;
  let best = -1, bs = -1;
  for (const i of W.land) {
    if (!W.zone[i] || !W.lvl[i] || W.flags[i] & LF.RUBBLE) continue;
    tilesWithin(i, 2, tmp);
    let s = 0;
    for (const j of tmp) if (W.zone[j] && W.lvl[j] && !(W.flags[j] & LF.RUBBLE)) s += W.lv[j] * lotLevelNow(j);
    if (s > bs) { bs = s; best = i; }
  }
  SVC.lvCluster = best >= 0 ? best : G.hq ? G.hq.tile : W.center;
  return SVC.lvCluster;
}
