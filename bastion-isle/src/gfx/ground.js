// GFX-GROUND public API (SPEC.md 5.4). Terrain, streets + lamps, sea, and the in-shader info-view overlays.
//
//   await initGround(scene, renderer, { aniso })   once at boot, after the renderer exists; resolves when the
//                                                   embedded textures are decoded (meshes exist immediately).
//                                                   If W already holds a world it is built right away.
//   groundOnWorldChanged()      new world generated / loaded, or any terrain type or height changed
//   groundOnRoadsChanged()      after W.road changes (diffs W.road itself; also refreshes lot flags next to roads)
//   groundOnLotsChanged(tiles)  tiles whose zone / lvl / flags / W.bld / W.ruin changed (the frame's lotDirty list)
//   groundFrame(dt)             every frame, before post.render(): eases view fades, uploads queued splat texels
//                               (partial texture uploads), keeps the sea's env map in step with the time of day.
//                               Also self-heals: if W.version / W.lotVersion moved without the calls above, it
//                               diffs the per-tile state and updates what changed.
//
//   setInfoView(perTileRGBA | null, { clay = true })   per-hex overlay, Uint8Array(W.count * 4) sRGB + alpha,
//                               tile index order; fades in over 250 ms with the clay look. null fades it out.
//   setField(rgba | null, size, { clay = true })       smooth map-space field, Uint8Array(size * size * 4) over
//                               MAP_MIN..MAP_MIN + MAP_SIZE (row 0 at z = MAP_MIN), sRGB + alpha.
//   setRings(list)              up to 8 rings [{ x, z, r, style: 0 solid+ticks | 1 dashed marching | 2 thin edge,
//                               color: 0xRRGGBB }] drawn on land AND sea. [] clears.
//   rebuildCoverage(towers)     defence coverage texture from [{ x, z, range, domains }] (domains bitmask 1 sea,
//                               2 air, 4 ground, or ['sea', 'air', ...]). Call when towers change. (alias setCoverage)
//   setCoverageView(strength)   0..1 coverage view strength (0.5 while placing a tower, 1 in the coverage view)
//   setGrid(strength)           hex grid lines (only while a tool is active), writes U.uGrid
//   setZoneView(strength)       zoning tool: lot inset borders, empty-lot tint + pattern, eligible-tile outlines
//   setClay(on)                 force the clay look without a data layer
//   setHighlightTile(i | -1)    hovered tile outline (U.uHighlightTile)
//   lampPositions()             Float32Array [x, y, z, ...] of lamp heads (pass to lightmapSetLampSource)
//   lampVersion()               increments whenever the lamps change
//   roadSurfaceY(x, z)          height of the street surface at a world position (ramps included), for traffic
//   groundStats()               { draws, instances, roadSlots, lamps } for the F3 overlay
import { W, isLand, LF } from '../world.js';
import { imageTexture } from './env.js';
import { createTerrain, terrainRebuild, terrainTilesChanged, terrainFrame, loadGroundTextures, TR } from './terrain.js';
import { createRoads, roadsRebuild, roadsUpdate, RD, roadSurfaceY } from './roads.js';
import { createWater, waterFrame } from './water.js';
import {
  overlayFrame, overlaySnap, setInfoView, setField, setRings, rebuildCoverage, setCoverage, setCoverageView, setGrid,
  setZoneView, setClay, setHighlightTile, GU,
} from './overlay.js';
import waterNormals from '../../assets/tex/waternormals.jpg';

export {
  setInfoView, setField, setRings, rebuildCoverage, setCoverage, setCoverageView, setGrid, setZoneView, setClay,
  setHighlightTile, overlaySnap, roadSurfaceY, GU,
};

const S = {
  scene: null, renderer: null, water: null, ready: false,
  sig: null, h: null, land: null, version: -1, lotVersion: -1, uploaded: 0,
};

export async function initGround(scene, renderer, { aniso = 4 } = {}) {
  S.scene = scene; S.renderer = renderer;
  createTerrain(scene);
  createRoads(scene);
  S.water = createWater(scene, null);
  if (W.count) groundOnWorldChanged();
  await Promise.all([
    loadGroundTextures(renderer, aniso),
    imageTexture(waterNormals, { srgb: false }).then((t) => {
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      S.water.material.userData.uniforms.uNormal.value = t;
    }),
  ]);
  S.ready = true;
}

// per-tile state the ground cares about, packed (type, zone, level, road, building, rubble/construction/abandoned)
function sigOf(i) {
  return W.type[i] | (W.zone[i] << 3) | ((W.lvl[i] & 3) << 5) | (W.road[i] ? 128 : 0) | (W.bld[i] ? 256 : 0)
    | (W.ruin[i] ? 512 : 0) | ((W.flags[i] & (LF.RUBBLE | LF.BUILDING | LF.ABANDONED)) << 10);
}

export function groundOnWorldChanged() {
  if (!TR.mesh) return;
  terrainRebuild();
  roadsRebuild();
  S.sig = new Uint32Array(W.count);
  S.h = new Float32Array(W.count);
  S.land = new Uint8Array(W.count);
  for (let i = 0; i < W.count; i++) { S.sig[i] = sigOf(i); S.h[i] = W.h[i]; S.land[i] = isLand(W.type[i]) ? 1 : 0; }
  S.version = W.version; S.lotVersion = W.lotVersion;
}

// diff the given tiles (or all); returns false if a full rebuild was needed
const _changed = new Set();
function diffTiles(list) {
  _changed.clear();
  const n = list ? list.length : W.count;
  for (let k = 0; k < n; k++) {
    const i = list ? list[k] : k;
    if (i < 0 || i >= W.count) continue;
    if (S.h[i] !== W.h[i] || S.land[i] !== (isLand(W.type[i]) ? 1 : 0)) { groundOnWorldChanged(); return false; }
    const s = sigOf(i);
    if (s === S.sig[i]) continue;
    const roadFlip = ((s ^ S.sig[i]) & 128) !== 0;
    S.sig[i] = s;
    _changed.add(i);
    if (roadFlip) for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0) _changed.add(j); }
  }
  if (_changed.size) terrainTilesChanged(_changed);
  return true;
}

export function groundOnRoadsChanged() {
  if (!S.sig || S.sig.length !== W.count) { groundOnWorldChanged(); return; }
  if (!diffTiles(null)) return;
  roadsUpdate();
  S.version = W.version;
}

export function groundOnLotsChanged(tiles) {
  if (!S.sig || S.sig.length !== W.count) { groundOnWorldChanged(); return; }
  diffTiles(tiles && tiles.length != null ? tiles : null);
  if (!tiles) S.lotVersion = W.lotVersion;
}

export function groundFrame(dt) {
  if (!S.sig) { if (W.count && TR.mesh) groundOnWorldChanged(); else return; }
  if (W.version !== S.version) groundOnRoadsChanged();
  if (W.lotVersion !== S.lotVersion) { diffTiles(null); S.lotVersion = W.lotVersion; }
  overlayFrame(dt);
  S.uploaded = terrainFrame(S.renderer);
  if (S.water) waterFrame(S.water, S.scene);
}

export function lampPositions() { return RD.lampPos; }
export function lampVersion() { return RD.lampVersion; }
export function groundMeshes() { return { terrain: TR.mesh, roads: RD.mesh, lamps: RD.lamps && RD.lamps.mesh, water: S.water }; }
export function groundStats() {
  return { draws: 4, instances: TR.mesh ? TR.mesh.count : 0, roadSlots: RD.top, lamps: RD.lampCount, splatBytes: S.uploaded };
}
export function groundReady() { return S.ready; }
