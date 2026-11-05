// GFX-CITY public API (SPEC.md 5.3 and 7). Zone-lot buildings (buildings.js) plus trees and rocks (trees.js).
//
//   initCity(scene)          once at startup, after the scene exists and before the shader warm-up. Creates every
//                            pool (visible with count 0, so warm-up compiles the 4 programs: city, city depth,
//                            nature, nature depth). Nothing is drawn until the world exists.
//   cityOnWorldChanged()     after generateWorld() or a save load (new W arrays): reallocates per-tile slots and
//                            rebuilds all lots, trees and rocks. ~10-25 ms, call it behind the loading screen.
//   syncLots(dirtyTiles)     every frame in the presentation-sync phase with `W.lotDirty.splice(0)`; patches only
//                            those tiles (plus neighbours whose shared border changes). null = rebuild all lots.
//                            Never clears W.lotDirty itself (main.js owns it).
//   cityOnRoadsChanged()     after roads were built or removed (re-orients the lots next to them, clears trees on
//                            new roads). Diffs W.road internally, so it is cheap to call more often than needed.
//   cityFrame(dt)            once per frame: lit-window fractions from U.uNight and a cheap change scan of
//                            W.road / W.bld / W.type / W.ruin (player buildings placed on forest, terrain edits).
//                            No buffer uploads unless something changed.
// Extra helpers: lotTop(i) (world y of a lot's roof, for icons and fire FX), cityStats() for the F3 overlay,
// cityMeshes() (for warm-up or debug views), CITY_GLSL (shared hash/noise GLSL).
import { W } from '../world.js';
import { U } from './uniforms.js';
import { initBuildings, resetBuildings, buildLots, buildingStats, buildingMeshes, lotTop, CU, GLSL_HASH } from './buildings.js';
import { initTrees, resetTrees, buildTrees, treeStats, treeMeshes } from './trees.js';

const C = {
  scene: null,
  snapRoad: null, snapBld: null, snapType: null, snapRuin: null, snapLot: null,
  mark: null, list: [], scanT: 0, nightT: 0,
  timing: { full: 0, patch: 0, patchTiles: 0 },
};

export function initCity(scene) {
  if (C.scene) return;
  C.scene = scene;
  initBuildings(scene);
  initTrees(scene);
  if (W.count) cityOnWorldChanged();
}

function snapshot() {
  const n = W.count;
  C.snapRoad = new Uint8Array(W.road);
  C.snapBld = new Int32Array(W.bld);
  C.snapType = new Uint8Array(W.type);
  C.snapRuin = new Uint8Array(W.ruin);
  C.snapLot = new Uint8Array(n);
  for (let i = 0; i < n; i++) C.snapLot[i] = lotKey(i);
  C.mark = new Uint8Array(n);
}
const lotKey = (i) => (W.zone[i] > 0 && (W.lvl[i] > 0 || (W.flags[i] & 64)) ? W.zone[i] : 0);

export function cityOnWorldChanged() {
  if (!C.scene || !W.count) return;
  const t0 = performance.now();
  resetBuildings();
  resetTrees();
  snapshot();
  buildLots(null);
  buildTrees(null);
  C.timing.full = performance.now() - t0;
}

function add(i) { if (i >= 0 && !C.mark[i]) { C.mark[i] = 1; C.list.push(i); } }
function addWithNeighbours(i) { add(i); for (let d = 0; d < 6; d++) add(W.nbr[i * 6 + d]); }
function flush() {
  if (!C.list.length) return;
  const t0 = performance.now();
  buildLots(C.list);
  buildTrees(C.list);
  for (const i of C.list) C.mark[i] = 0;
  C.timing.patch = performance.now() - t0;
  C.timing.patchTiles = C.list.length;
  C.list.length = 0;
}

// Patch the given tiles. A tile whose lot appeared, vanished or changed zone also patches its neighbours (their
// shared hedge / fence border depends on it).
export function syncLots(dirtyTiles) {
  if (!C.scene || !W.count) return;
  if (!C.mark || C.mark.length !== W.count) { cityOnWorldChanged(); return; }
  if (dirtyTiles == null) {
    const t0 = performance.now();
    for (let i = 0; i < W.count; i++) C.snapLot[i] = lotKey(i);
    buildLots(null);
    buildTrees(null);
    C.timing.full = performance.now() - t0;
    return;
  }
  if (!dirtyTiles.length) return;
  for (const i of dirtyTiles) {
    if (i < 0 || i >= W.count) continue;
    const k = lotKey(i);
    if (k !== C.snapLot[i]) { C.snapLot[i] = k; addWithNeighbours(i); } else add(i);
  }
  flush();
}

// Roads changed: re-orient lots beside changed road tiles and clear / restore trees.
export function cityOnRoadsChanged() {
  if (!C.scene || !W.count || !C.snapRoad) return;
  scan(true);
}

function scan(roadsOnly) {
  const n = W.count;
  for (let i = 0; i < n; i++) {
    if (W.road[i] !== C.snapRoad[i]) { C.snapRoad[i] = W.road[i]; addWithNeighbours(i); }
    if (roadsOnly) continue;
    if (W.bld[i] !== C.snapBld[i]) { C.snapBld[i] = W.bld[i]; add(i); }
    if (W.ruin[i] !== C.snapRuin[i]) { C.snapRuin[i] = W.ruin[i]; add(i); }
    if (W.type[i] !== C.snapType[i]) { C.snapType[i] = W.type[i]; addWithNeighbours(i); }
  }
  flush();
}

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

export function cityFrame(dt) {
  // Lit window fractions (UX review 9, rendering review concrete 9): residential 3 % by day, 55 % at dusk,
  // ~72 % in the evening, falling to ~32 % late at night; commercial 15 / 80 / 25 %; industrial 40 % at night.
  const n = U.uNight.value;
  if (n > 0.9) C.nightT += dt; else if (n < 0.3) C.nightT = 0;
  const late = sm(25, 80, C.nightT) * sm(0.4, 0.9, n);
  const dusk = sm(0.05, 0.7, n), eve = sm(0.7, 1.0, n);
  const r = mix(mix(0.03, 0.55, dusk), 0.72, eve);
  const c = mix(mix(0.15, 0.8, dusk), 0.8, eve);
  const ind = mix(0.22, 0.4, dusk);
  CU.uCityLit.value.set(mix(r, 0.32, late), mix(c, 0.25, late), ind);
  // change scan: a few microseconds for ~3k tiles; runs ~4 times a second
  C.scanT -= dt;
  if (C.scanT <= 0 && C.snapRoad && C.snapRoad.length === W.count) { C.scanT = 0.25; scan(false); }
}

export function cityStats() {
  const b = buildingStats(), t = treeStats();
  const all = [...b.pools, ...t];
  let draws = 0, tris = 0, inst = 0;
  for (const p of all) { if (p.count > 0) draws++; tris += p.tris; inst += p.count; }
  return { draws, tris, instances: inst, pools: all, timing: { ...C.timing }, uploads: b.uploads };
}
export function cityMeshes() { return [...buildingMeshes(), ...treeMeshes()]; }

// SPEC.md 5.3 / 7 names
export const initBuildingsApi = initCity;
export const buildingsFrame = cityFrame;
export const updateBuildings = cityFrame;
export { lotTop, GLSL_HASH as CITY_GLSL };
