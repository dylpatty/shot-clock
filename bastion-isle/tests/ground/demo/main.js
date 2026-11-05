// Ground module visual test. Build: node tests/gfx/build.mjs tests/ground/demo/main.js <scratch>/ground
// URL params: shot = noon | golden | night | info | zone | street | overview | coast, seed, bld=1 (GFX-CITY
// buildings if present), lm=0 (disable the GFX-LIFE light map; a local fallback is used), w=1 (walk the city:
// change roads/lots every second to exercise partial updates).
import { H } from '../../gfx/harness.js';
import * as GR from '../../../src/gfx/ground.js';

const q = new URLSearchParams(location.search);
const shot = q.get('shot') || 'noon';
await H.init({ seed: +(q.get('seed') || 7), city: q.get('city') !== '0' });
const { W, U, THREE } = H;
await GR.initGround(H.scene, H.renderer, { aniso: 4 });

// --- optional neighbours' modules so the integrated look can be judged
let lm = null;
if (q.get('bld') === '1') {
  try {
    const B = await import('../../../src/gfx/buildings.js');
    B.initBuildings(H.scene);
    const all = []; for (let i = 0; i < W.count; i++) if (W.zone[i] || W.bld[i]) all.push(i);
    B.buildLots(all);
    H.buildings = B;
  } catch (e) { console.warn('buildings module failed: ' + e.message); }
}
if (q.get('lm') !== '0') {
  try {
    lm = await import('../../../src/gfx/lightmap.js');
    lm.initLightmap(H.renderer, { size: 512, lampPositions: GR.lampPositions });
  } catch (e) { console.warn('lightmap module failed: ' + e.message); lm = null; }
}
if (!lm) {
  // fallback: CPU splat of lamp pools into a small map-space texture
  const N = 512, data = new Uint16Array(N * N * 4), cell = H.MAP_SIZE / N;
  const f = new Float32Array(N * N * 3);
  const P = GR.lampPositions();
  for (let k = 0; k < P.length; k += 3) {
    const x = P[k], z = P[k + 2], r = 0.75;
    const x0 = Math.floor((x - r - H.MAP_MIN) / cell), x1 = Math.ceil((x + r - H.MAP_MIN) / cell);
    const z0 = Math.floor((z - r - H.MAP_MIN) / cell), z1 = Math.ceil((z + r - H.MAP_MIN) / cell);
    for (let tz = z0; tz <= z1; tz++) for (let tx = x0; tx <= x1; tx++) {
      const dx = H.MAP_MIN + (tx + 0.5) * cell - x, dz = H.MAP_MIN + (tz + 0.5) * cell - z;
      const a = Math.max(0, 1 - Math.hypot(dx, dz) / r); const v = a * a * 1.6;
      const p = (tz * N + tx) * 3; f[p] += v; f[p + 1] += v * 0.72; f[p + 2] += v * 0.42;
    }
  }
  for (let p = 0; p < N * N; p++) for (let c = 0; c < 3; c++) data[p * 4 + c] = THREE.DataUtils.toHalfFloat(f[p * 3 + c]);
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.HalfFloatType);
  t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
  H.onFrame(() => { U.uNightLight.value = t; t.userData.k = U.uNight.value; });
  // fade with the night
  const base = new Uint16Array(data);
  let lastK = -1;
  H.onFrame(() => {
    const k = Math.round(U.uNight.value * 20) / 20;
    if (k === lastK) return; lastK = k;
    for (let p = 0; p < N * N; p++) for (let c = 0; c < 3; c++) data[p * 4 + c] = THREE.DataUtils.toHalfFloat(f[p * 3 + c] * k);
    t.needsUpdate = true;
  });
}

// --- placeholder city blocks when the real buildings are not loaded, so the street scale reads
if (!H.buildings && q.get('blocks') !== '0') {
  const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.85 });
  const n = W.land.filter((i) => W.zone[i] && W.lvl[i]).length;
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
  const mx = new THREE.Matrix4(), col = new THREE.Color();
  let k = 0;
  for (const i of W.land) {
    if (!W.zone[i] || !W.lvl[i]) continue;
    const ht = W.lvl[i] === 3 ? 1.2 + (W.style[i] % 7) * 0.25 : W.lvl[i] === 2 ? 0.55 + (W.style[i] % 4) * 0.1 : 0.28;
    const wd = W.zone[i] === 3 ? 1.0 : 0.85;
    mx.compose(new THREE.Vector3(W.x[i], W.h[i], W.z[i]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (W.style[i] % 6) * Math.PI / 3, 0)), new THREE.Vector3(wd, ht, wd * 0.8));
    m.setMatrixAt(k, mx);
    col.setHex([0xece6da, 0xe1d2b4, 0xd7b38b, 0xb8c1ae, 0xa8b5c1, 0xb4b1a9][W.style[i] % 6]);
    m.setColorAt(k, col); k++;
  }
  m.count = k; m.castShadow = m.receiveShadow = true; m.renderOrder = 1;
  H.scene.add(m);
}

// --- pick a street junction near the centre for close-ups
function junction(minD, maxD) {
  let best = -1, bd = 1e9;
  for (let i = 0; i < W.count; i++) {
    if (!W.road[i]) continue;
    let n = 0; for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j]) n++; }
    const r = Math.hypot(W.x[i], W.z[i]);
    if (n >= 3 && r >= minD && r <= maxD && r < bd) { bd = r; best = i; }
  }
  return best;
}
const jc = junction(+(q.get('jmin') || 4), 30);
const jx = jc >= 0 ? W.x[jc] : 0, jz = jc >= 0 ? W.z[jc] : 0;

// --- info view data: land value per tile, rings over land and sea, coverage from a few fake towers
function landValueView() {
  const a = new Uint8Array(W.count * 4);
  const ramp = [[0.85, 0.25, 0.2], [0.95, 0.75, 0.25], [0.35, 0.8, 0.4]];
  for (const i of W.land) {
    const v = W.zone[i] ? W.lv[i] / 100 : Math.max(0, 0.6 - Math.hypot(W.x[i], W.z[i]) / 40);
    const t = Math.min(1, Math.max(0, v)) * 2, k = Math.min(1, Math.floor(t)), f = t - k;
    const c0 = ramp[k], c1 = ramp[Math.min(2, k + 1)];
    for (let c = 0; c < 3; c++) a[i * 4 + c] = (c0[c] + (c1[c] - c0[c]) * f) * 255;
    a[i * 4 + 3] = 200;
  }
  return a;
}
const towers = [
  { x: -14, z: 12, range: 13, domains: 1 }, { x: 16, z: -10, range: 13, domains: 1 }, { x: 4, z: 18, range: 11, domains: 3 },
  { x: -6, z: -16, range: 9, domains: 2 }, { x: 2, z: 2, range: 6, domains: 4 }, { x: 20, z: 12, range: 12, domains: 1 },
];

const presets = {
  noon: { cam: { x: 0, z: 4, dist: 45, yaw: 0.7 }, tod: 0.36 },
  overview: { cam: { x: 0, z: 0, dist: 80, yaw: 0.5 }, tod: 0.36 },
  golden: { cam: { x: jx, z: jz, dist: 10, yaw: 2.3 }, tod: 0.63 },
  street: { cam: { x: jx, z: jz, dist: 9, yaw: 0.9 }, tod: 0.42 },
  night: { cam: { x: jx, z: jz, dist: 12, yaw: 2.3 }, tod: 0.84 },
  nightwide: { cam: { x: 0, z: 2, dist: 40, yaw: 0.7 }, tod: 0.84 },
  info: { cam: { x: 2, z: 6, dist: 55, yaw: 0.4 }, tod: 0.4 },
  cover: { cam: { x: 2, z: 6, dist: 55, yaw: 0.4 }, tod: 0.4 },
  zone: { cam: { x: jx, z: jz, dist: 16, yaw: 0.9 }, tod: 0.4 },
  coast: { cam: { x: +(q.get('cx') || 18), z: +(q.get('cz') || 14), dist: 12, yaw: 0.3 }, tod: 0.6 },
};
const p = presets[shot] || presets.noon;
H.setCam({ ...p.cam, ...(q.has('dist') ? { dist: +q.get('dist') } : {}), ...(q.has('yaw') ? { yaw: +q.get('yaw') } : {}) });
H.setTod(q.has('tod') ? +q.get('tod') : p.tod);

if (shot === 'info') {
  GR.setInfoView(landValueView());
  GR.setRings([
    { x: -14, z: 12, r: 13, style: 0, color: 0x3cc8d0 }, { x: 16, z: -10, r: 13, style: 1, color: 0xffffff },
    { x: 4, z: 18, r: 7, style: 2, color: 0xa78bfa },
  ]);
  GR.overlaySnap();
}
if (shot === 'cover') {
  GR.rebuildCoverage(towers);
  GR.setCoverageView(1, { clay: true });
  GR.setRings([{ x: -14, z: 12, r: 13, style: 0, color: 0x3cc8d0 }]);
  GR.overlaySnap();
}
if (shot === 'zone') {
  GR.setGrid(1); GR.setZoneView(1);
  // a few empty zoned lots so the tint/pattern shows
  let k = 0;
  for (const i of W.land) if (W.zone[i] && k < 400) { if ((W.style[i] & 3) === 0) { W.lvl[i] = 0; } k++; }
  W.lotVersion++;
  GR.setHighlightTile(jc >= 0 ? W.nbr[jc * 6 + 1] : -1);
  GR.overlaySnap();
}
U.uCloudStrength.value = q.has('clouds') ? +q.get('clouds') : 0.22;

// exercise partial updates: toggle roads and lots
if (q.get('w') === '1') {
  let t = 0, n = 0;
  H.onFrame((dt) => {
    t += dt; if (t < 0.5) return; t = 0; n++;
    const i = W.land[(n * 7919) % W.land.length];
    if (W.zone[i]) { W.lvl[i] = (W.lvl[i] + 1) % 4; W.lotVersion++; }
    else if (!W.bld[i]) { W.road[i] = W.road[i] ? 0 : 1; W.version++; }
  });
}

H.onFrame((dt, time) => {
  U.uCloudOfs.value.set(time * 0.6, time * 0.25);
  GR.groundFrame(dt);
  if (lm) { lm.lightmapFrame(time); lm.lightmapRender(H.renderer); }
});
window.GR = GR;
H.start(+(q.get('warm') || 2));
