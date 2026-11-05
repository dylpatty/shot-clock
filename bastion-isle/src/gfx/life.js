import * as THREE from 'three';
import { W } from '../world.js';
import { G, SETTINGS } from '../state.js';
import { PRESETS } from './post.js';
import {
  initFx, fxFrame, clearFx, fxStats, fxTime,
  explosion, splash, muzzle, flakBurst, trail, fire, smokePuff, dust, wake, sparks,
} from './fx.js';
import {
  initLightmap, lightmapSetVehicleLights, lightmapFrame, lightmapRender as lmRender, lightmapStats, lightmapMarkStatic,
  lightmapSetSize, lightmapSetDynamic, lightmapSetLampSource, lightmapClear, NIGHT_LIGHT_GLSL, lightmapWarm,
} from './lightmap.js';
import { initTraffic, trafficFrame, trafficCommitLights, trafficOnRoadsChanged, trafficOnLotsChanged, trafficStats, trafficSetFog, trafficClear, trafficWarm, trafficPrewarm } from './traffic.js';
import { initBillboards, billboardsFrame, billboardsOnLotsChanged, billboardsStats, billboardsClear, billboardsWarm, billboardsSetLotTop, bounty } from './billboards.js';
import { initRaidFx, raidfxFrame, raidMarkers as rfMarkers, raidfxStats, raidfxClear, raidfxWarm } from './raidfx.js';
import { initAmbient, ambientFrame, ambientOnWorldChanged, ambientOnLotsChanged, ambientStats, ambientClear, ambientWarm, ambientSetHooks } from './ambient.js';

// GFX-LIFE public API (SPEC 5.5, frame order SPEC 7). Everything that makes the world feel alive and readable:
// traffic, night light map, billboards (health bars, problem icons, bounty floaters), raid visuals, ambient life
// and the particle effects behind the sim's FX hooks.
//
//   initLife({ scene, overlay, renderer, vehicleGeos, lampPositions })   once, after the scene/post exist
//   lifeOnLotsChanged(dirtyTiles)   with the tiles main.js spliced from W.lotDirty
//   lifeOnRoadsChanged()            whenever roads changed (or a new world was generated)
//   lifeFrame(dt, camera)           every frame, real seconds (game speed / pause are applied inside)
//   lightmapRender(renderer)        every frame, before post.render()
//   raidMarkers(camera)             for the HUD: off-screen raid chevrons (reused array, read it right away)
//   Object.assign(FX, LIFE_FX)      wires the sim's FX hooks (explosion ... sparks, bounty) to the real effects

const L = {
  scene: null, overlay: null, renderer: null, quality: 'high', init: false,
  frustum: new THREE.Frustum(), pv: new THREE.Matrix4(), dir: new THREE.Vector3(),
  worldKey: null, lightSig: null, ms: 0, msAvg: 0, frames: 0, uploads: 0,
};

export function initLife({ scene, overlay, renderer, vehicleGeos = null, lampPositions = null, quality = null } = {}) {
  L.scene = scene; L.overlay = overlay; L.renderer = renderer;
  L.quality = quality || SETTINGS.quality || 'high';
  const preset = PRESETS[L.quality] || PRESETS.high;
  initLightmap(renderer, { size: preset.lightMap || 512, lampPositions });
  lightmapSetDynamic(L.quality !== 'performance');
  initFx(scene, { quality: L.quality });
  const lights = initTraffic(scene, { vehicleGeos, quality: L.quality });
  lightmapSetVehicleLights(lights.aV0, lights.aV1, lights.countRef);
  initBillboards(overlay);
  initRaidFx(scene, renderer);
  initAmbient(scene, { vehicleGeos });
  L.init = true;
  if (W.x) worldChanged();
}

// Quality preset changed in Settings (core re-runs warm-up afterwards, as for every preset switch)
export function lifeSetQuality(name) {
  L.quality = name;
  const preset = PRESETS[name] || PRESETS.high;
  lightmapSetSize(L.renderer, preset.lightMap || 512);
  lightmapSetDynamic(name !== 'performance');
}

// Optional hooks from other modules: lotTop(i) -> roof height of the building on lot i (gfx-city),
// chimneys(i, out) -> push x, y, z, scale per chimney of industrial lot i, lampPositions() -> lamp list (gfx-ground)
export function lifeSetHooks({ lotTop, chimneys, lampPositions } = {}) {
  if (lotTop) billboardsSetLotTop(lotTop);
  ambientSetHooks({ lotTop, chimneys });
  if (lampPositions) lightmapSetLampSource(lampPositions);
}

function worldChanged() {
  L.worldKey = W.x;
  L.lightSig = new Uint16Array(W.count);
  for (let i = 0; i < W.count; i++) L.lightSig[i] = sig(i);
  trafficOnRoadsChanged();
  ambientOnWorldChanged();
  billboardsOnLotsChanged(null);
  lightmapMarkStatic();
}

// what the static light layer depends on for a lot
const sig = (i) => (W.zone[i] | (W.lvl[i] << 2) | ((W.flags[i] & 0x4b) << 4) | ((W.occ[i] >> 5) << 12));

export function lifeOnRoadsChanged() {
  if (!L.init) return;
  if (L.worldKey !== W.x) { worldChanged(); return; }
  trafficOnRoadsChanged();
  ambientOnWorldChanged();
  lightmapMarkStatic();
}

export function lifeOnLotsChanged(dirty) {
  if (!L.init || !dirty || !dirty.length) return;
  if (L.worldKey !== W.x) worldChanged();
  billboardsOnLotsChanged(dirty);
  ambientOnLotsChanged(dirty);
  let lightsChanged = false, spawnChanged = false;
  for (let k = 0; k < dirty.length; k++) {
    const i = dirty[k];
    const s = sig(i);
    if (s !== L.lightSig[i]) { if ((s & 0x3ff) !== (L.lightSig[i] & 0x3ff)) spawnChanged = true; L.lightSig[i] = s; lightsChanged = true; }
  }
  if (lightsChanged) lightmapMarkStatic();
  if (spawnChanged) { trafficOnLotsChanged(); ambientOnWorldChanged(); }
}

// game-scaled time: frozen while paused, faster at 2x/3x; the menu showcase runs in real time
function gameDt(dt) {
  if (G.mode === 'play' || G.mode === 'over') return G.paused ? 0 : dt * (G.speed || 1);
  return dt;
}

export function lifeFrame(dt, camera) {
  if (!L.init) return;
  const t0 = performance.now();
  if (L.worldKey !== W.x && W.x) worldChanged();
  const gdt = Math.min(0.25, gameDt(dt));
  camera.updateMatrixWorld();
  L.pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  L.frustum.setFromProjectionMatrix(L.pv);
  // camera distance to the ground point it looks at (zoom), for particle emission scaling
  camera.getWorldDirection(L.dir);
  const camDist = L.dir.y < -0.05 ? Math.min(400, camera.position.y / -L.dir.y) : 120;
  const time = fxTime() + gdt;

  trafficFrame(gdt, L.frustum, camera.position);
  ambientFrame(gdt, L.frustum, camera.position);
  raidfxFrame(dt, time, L.scene);
  trafficCommitLights();
  trafficSetFog(L.scene.fog);
  fxFrame(gdt, camera, L.renderer, camDist, L.scene);
  lightmapFrame(fxTime());
  billboardsFrame(fxTime(), camera, L.renderer);

  const ms = performance.now() - t0;
  L.ms = ms;
  L.msAvg += (ms - L.msAvg) * 0.05;
  L.frames++;
}

export function lightmapRender(renderer) { if (L.init) lmRender(renderer || L.renderer); }
export function raidMarkers(camera) { return rfMarkers(camera); }

// warm-up (SPEC 4): with on=true every life mesh gets one instance off-screen so all programs compile during the
// two warm-up composer frames; lifeWarm(false) afterwards (the next lifeFrame overwrites everything anyway)
export function lifeWarm(on = true) {
  if (!L.init) return;
  if (on) {
    trafficWarm(); billboardsWarm(); raidfxWarm(); ambientWarm(); lightmapWarm(true);
    explosion(0, -60, 0, 1, false);
    explosion(0, -60, 0, 1, true);
    fxFrame(0, null, null, 40, L.scene);
  } else {
    lightmapWarm(false);
  }
}

// new game / new island
export function lifeClear() {
  clearFx(); trafficClear(); billboardsClear(); raidfxClear(); ambientClear(); lightmapClear();
  L.worldKey = null;
}

export function lifeStats() {
  const t = trafficStats(), f = fxStats(), lm = lightmapStats(), b = billboardsStats(), r = raidfxStats(), a = ambientStats();
  return {
    ms: L.ms, msAvg: L.msAvg,
    cars: t.cars, carsVisible: t.visible, trucks: t.trucks, trafficMs: t.ms,
    particles: f.live, particleBudget: f.budget,
    lightStatic: lm.static, lightDynamic: lm.dynamic,
    bars: b.bars, icons: b.icons, floaters: b.floaters,
    beams: r.beams, markers: r.markers, fires: a.fires, stacks: a.stacks, boats: a.boats, gulls: a.gulls,
    uploadBytes: t.bytes + f.bytes + lm.bytes + b.bytes,
  };
}

export const LIFE_FX = { explosion, splash, muzzle, flakBurst, trail, fire, smokePuff, dust, wake, sparks, bounty };
export { explosion, splash, muzzle, flakBurst, trail, fire, smokePuff, dust, wake, sparks, bounty, NIGHT_LIGHT_GLSL, trafficPrewarm };
