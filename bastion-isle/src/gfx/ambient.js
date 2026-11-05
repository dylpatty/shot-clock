import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { U } from './uniforms.js';
import { Pool } from './pools.js';
import { W, T, LF, isLand, tileAt } from '../world.js';
import { G } from '../state.js';
import { fireColumn, stackSmoke, wake } from './fx.js';
import { pushVehicleLight, VEH_FLAG } from './traffic.js';
import { lightmapSetFireList } from './lightmap.js';
import { raidfxSetLighthouse } from './raidfx.js';

// Ambient life (SPEC 5.5, UX should_change 9, concrete spec 16): civilian boats wandering the shallows and racing
// home to the docks during raids, gulls circling the coast (scattering when a raid starts, roosting at night),
// smoke from industry chimneys and gas plants, fires on burning lots (flames, embers, a dark smoke column lit from
// below), and a lighthouse on the most exposed headland whose beam sweeps the bay at night.
// Draw calls: boats 1-3 (one per hull type), gulls 1, lighthouse 1. Fires and smoke use the shared particles.

const BOATS = 12, GULLS = 60;
const LOT_TOP = [0, 0.5, 1.15, 2.7];

const A = {
  boatPools: [], boatGeoInfo: [], gullPool: null, lhPool: null,
  boats: [], gulls: [], docks: [], lighthouse: -1, lhPos: null,
  fireTiles: new Int32Array(0), nFire: 0, fireScanT: 0,
  stacks: new Float32Array(0), nStacks: 0, stackT: 0,
  raidT: 0, lotTop: null, chimneys: null,
  stats: { fires: 0, stacks: 0, boats: 0, gulls: 0 },
};

// ---------------------------------------------------------------------------------------------- placeholder models

function part(geo, rgb) {
  const n = geo.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = rgb[0]; c[i * 3 + 1] = rgb[1]; c[i * 3 + 2] = rgb[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  if (geo.index) return geo.toNonIndexed();
  return geo;
}
function hull(len, wid, h, rgb) {
  const g = new THREE.BoxGeometry(wid, h, len, 1, 1, 2).translate(0, h / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i), y = p.getY(i);
    if (z > len * 0.2) p.setX(i, p.getX(i) * Math.max(0.05, 1 - (z - len * 0.2) / (len * 0.3)));
    if (y < h * 0.5) p.setX(i, p.getX(i) * 0.75);
  }
  g.computeVertexNormals();
  return part(g, rgb);
}
function placeholderBoats() {
  const white = [0.86, 0.87, 0.86], navy = [0.06, 0.1, 0.2], glass = [0.04, 0.05, 0.07], red = [0.45, 0.06, 0.04], wood = [0.42, 0.3, 0.18];
  const yacht = mergeGeometries([
    hull(0.62, 0.2, 0.08, white),
    part(new THREE.BoxGeometry(0.21, 0.015, 0.6).translate(0, 0.02, 0), navy),
    part(new THREE.BoxGeometry(0.14, 0.06, 0.24).translate(0, 0.11, -0.06), white),
    part(new THREE.BoxGeometry(0.145, 0.025, 0.2).translate(0, 0.115, -0.05), glass),
    part(new THREE.BoxGeometry(0.15, 0.01, 0.12).translate(0, 0.08, -0.24), wood),
  ]);
  const trawler = mergeGeometries([
    hull(0.95, 0.28, 0.12, red),
    part(new THREE.BoxGeometry(0.29, 0.02, 0.9).translate(0, 0.11, 0), navy),
    part(new THREE.BoxGeometry(0.2, 0.13, 0.22).translate(0, 0.185, 0.12), white),
    part(new THREE.BoxGeometry(0.205, 0.035, 0.18).translate(0, 0.215, 0.13), glass),
    part(new THREE.CylinderGeometry(0.01, 0.012, 0.42, 5).translate(0, 0.33, -0.05), [0.3, 0.3, 0.3]),
    part(new THREE.BoxGeometry(0.22, 0.01, 0.01).translate(0, 0.44, -0.05), [0.3, 0.3, 0.3]),
  ]);
  return [yacht, trawler];
}
function lighthouseGeo() {
  const white = [0.9, 0.9, 0.88], red = [0.62, 0.07, 0.05], dark = [0.08, 0.09, 0.1], glass = [0.75, 0.7, 0.55];
  const parts = [part(new THREE.CylinderGeometry(0.42, 0.48, 0.18, 10).translate(0, 0.09, 0), [0.55, 0.53, 0.5])];
  const H = 1.9, seg = 5;
  for (let k = 0; k < seg; k++) {
    const y0 = 0.18 + (k * H) / seg, y1 = 0.18 + ((k + 1) * H) / seg;
    const r0 = 0.24 - (0.09 * k) / seg, r1 = 0.24 - (0.09 * (k + 1)) / seg;
    parts.push(part(new THREE.CylinderGeometry(r1, r0, y1 - y0, 12).translate(0, (y0 + y1) / 2, 0), k % 2 ? red : white));
  }
  const top = 0.18 + H;
  parts.push(part(new THREE.CylinderGeometry(0.24, 0.2, 0.05, 12).translate(0, top + 0.025, 0), dark));
  parts.push(part(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 10).translate(0, top + 0.15, 0), glass));
  parts.push(part(new THREE.ConeGeometry(0.16, 0.16, 10).translate(0, top + 0.33, 0), red));
  // keeper's house
  parts.push(part(new THREE.BoxGeometry(0.42, 0.24, 0.3).translate(0.42, 0.12, 0.05), white));
  parts.push(part(new THREE.BoxGeometry(0.46, 0.06, 0.34).translate(0.42, 0.27, 0.05), red));
  return { geo: mergeGeometries(parts), lampY: top + 0.15 };
}
function gullGeo() {
  // body + two wings; aWing marks wing vertices (|aWing| = distance from the body, sign = side)
  const pos = [], wing = [], col = [];
  const W2 = 0.11;
  const tri = (a, b, c, wa, wb, wc, ca) => { pos.push(...a, ...b, ...c); wing.push(wa, wb, wc); col.push(...ca, ...ca, ...ca); };
  const white = [0.92, 0.92, 0.9], grey = [0.55, 0.57, 0.6], tip = [0.08, 0.08, 0.09];
  // wings (double-sided: emit both windings)
  for (const s of [-1, 1]) {
    const root0 = [0, 0, 0.025], root1 = [0, 0, -0.02], mid = [s * W2 * 0.55, 0.012, 0.0], tipP = [s * W2, 0, -0.025];
    const tris = [[root0, root1, mid, 0, 0, 0.55 * s, grey], [mid, root1, tipP, 0.55 * s, 0, 1 * s, tip]];
    for (const [a, b, c, wa, wb, wc, cc] of tris) { tri(a, b, c, wa, wb, wc, cc); tri(a, c, b, wa, wc, wb, cc); }
  }
  // body
  const b0 = [0, 0, 0.06], b1 = [0.012, -0.008, -0.01], b2 = [-0.012, -0.008, -0.01], b3 = [0, 0, -0.05], b4 = [0, 0.012, 0];
  tri(b0, b1, b4, 0, 0, 0, white); tri(b0, b4, b2, 0, 0, 0, white); tri(b4, b1, b3, 0, 0, 0, white); tri(b4, b3, b2, 0, 0, 0, white);
  tri(b0, b2, b1, 0, 0, 0, white); tri(b1, b2, b3, 0, 0, 0, white);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------------------------- init

export function initAmbient(scene, { vehicleGeos = null } = {}) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 });
  const boatGeos = (vehicleGeos && vehicleGeos.boats && vehicleGeos.boats.length ? vehicleGeos.boats : placeholderBoats()).slice(0, 3);
  const bmat = (vehicleGeos && vehicleGeos.boats && vehicleGeos.material) || mat;
  boatGeos.forEach((g, k) => {
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox;
    A.boatGeoInfo.push({ hl: Math.max(-bb.min.z, bb.max.z), hw: Math.max(-bb.min.x, bb.max.x), top: bb.max.y });
    const p = new Pool(g, bmat, BOATS, { cast: false, receive: true, order: 3 });
    p.mesh.name = 'boats-' + k;
    A.boatPools.push(p);
    scene.add(p.mesh);
  });

  // gulls: flapping in the vertex shader
  const gmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide });
  gmat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aWing;\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  float gph = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453) * 6.2832;
  float glide = smoothstep(0.2, 0.7, sin(uTime * 0.7 + gph * 3.0));
  float flap = sin(uTime * 11.0 + gph) * mix(1.0, 0.15, glide);
  transformed.y += flap * 0.05 * abs(aWing) * abs(aWing) + 0.012 * abs(aWing) * (1.0 - glide);`);
  };
  gmat.customProgramCacheKey = () => 'life-gull-v1';
  A.gullPool = new Pool(gullGeo(), gmat, GULLS, { cast: false, receive: false, order: 3 });
  A.gullPool.mesh.name = 'gulls';
  scene.add(A.gullPool.mesh);

  const lh = lighthouseGeo();
  A.lhLampY = lh.lampY;
  A.lhPool = new Pool(lh.geo, mat, 1, { cast: true, receive: true, order: 2 });
  A.lhPool.mesh.name = 'lighthouse';
  scene.add(A.lhPool.mesh);
}

export function ambientSetHooks({ lotTop, chimneys } = {}) {
  if (lotTop) A.lotTop = lotTop;
  if (chimneys) A.chimneys = chimneys;
}

const hash = (i, s) => { let h = (i * 374761393 + s * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const lotTopY = (i) => (A.lotTop ? A.lotTop(i) : W.h[i] + LOT_TOP[W.lvl[i]] * (0.85 + ((W.style[i] * 37) % 31) / 100));
const isWaterAt = (x, z) => { const t = tileAt(x, z); return t < 0 || W.type[t] <= T.SHALLOW; };

// ---------------------------------------------------------------------------------------------- world changes

export function ambientOnWorldChanged() {
  // docks: shallow water next to coast tiles that carry a road or a lot
  A.docks.length = 0;
  for (const i of W.shore || []) {
    if (W.type[i] !== T.SHALLOW) continue;
    let ok = false;
    for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && isLand(W.type[j]) && (W.road[j] || W.zone[j] || W.bld[j])) ok = true; }
    if (ok) A.docks.push(i);
  }
  pickLighthouse();
  rebuildStacks();
  // keep boat homes valid
  for (const b of A.boats) if (A.docks.length && A.docks.indexOf(b.home) < 0) b.home = A.docks[(Math.random() * A.docks.length) | 0];
}

function pickLighthouse() {
  const cur = A.lighthouse;
  if (cur >= 0 && !W.road[cur] && !W.zone[cur] && !W.bld[cur] && isLand(W.type[cur])) return;
  // most exposed headland: coast tile with the most water within 3 tiles, far from the centre, not built on
  let best = -1, bs = -1;
  for (const i of W.coast || []) {
    const t = W.type[i];
    if (t === T.MOUNTAIN || W.road[i] || W.zone[i] || W.bld[i]) continue;
    let water = 0;
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[i * 6 + d];
      if (j < 0) { water += 3; continue; }
      if (!isLand(W.type[j])) water += 2;
      for (let e = 0; e < 6; e++) { const k = W.nbr[j * 6 + e]; if (k < 0 || !isLand(W.type[k])) water += 0.5; }
    }
    const score = water + Math.hypot(W.x[i], W.z[i]) * 0.12 + (t === T.HILLS ? 2 : t === T.SAND ? -1.5 : 0);
    if (score > bs) { bs = score; best = i; }
  }
  A.lighthouse = best;
  if (best >= 0) {
    const y = W.h[best];
    A.lhPos = { x: W.x[best], y: y + A.lhLampY, z: W.z[best] };
    A.lhPool.setCount(1);
    A.lhPool.setSlot(0, W.x[best], y, W.z[best], hash(best, 3) * 6.28, 1, 1, 1, 1, 1, 1);
    A.lhPool.commit();
    raidfxSetLighthouse(A.lhPos);
  } else { A.lhPool.setCount(0); raidfxSetLighthouse(null); }
}

// chimney positions: injected (gfx-city) or estimated from the lot footprint
function rebuildStacks() {
  const out = [];
  for (let i = 0; i < W.count; i++) {
    if (W.zone[i] !== 3 || !W.lvl[i] || (W.flags[i] & (LF.ABANDONED | LF.RUBBLE | LF.BUILDING))) continue;
    if (A.chimneys) { A.chimneys(i, out); continue; }
    const a = hash(i, 21) * 6.28, r = 0.35;
    const n = W.lvl[i] >= 3 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const aa = a + k * 0.9;
      out.push(W.x[i] + Math.cos(aa) * r, lotTopY(i) + 0.45 + 0.25 * W.lvl[i], W.z[i] + Math.sin(aa) * r, 0.7 + 0.25 * W.lvl[i]);
    }
  }
  for (const b of G.buildings || []) {
    if (b.type !== 'gas') continue;
    for (let k = 0; k < 2; k++) out.push(b.x + (k ? 0.3 : -0.3), (b.y || W.h[tileAt(b.x, b.z)] || 0.3) + 1.6, b.z - 0.25, 1.5);
  }
  A.stacks = new Float32Array(out);
  A.nStacks = out.length / 4;
  A.bldLen = (G.buildings || []).length;
}

export function ambientOnLotsChanged(dirty) {
  if (!W.fire) return;
  if (A.fireTiles.length !== W.count) A.fireTiles = new Int32Array(W.count);
  // dirty tiles that started burning join the list at once; the periodic rescan removes the extinguished ones
  if (dirty) for (const i of dirty) {
    if (W.fire[i] > 0) {
      let found = false;
      for (let k = 0; k < A.nFire; k++) if (A.fireTiles[k] === i) { found = true; break; }
      if (!found && A.nFire < A.fireTiles.length) A.fireTiles[A.nFire++] = i;
    }
    if (W.zone[i] === 3) A.stacksDirty = true;
  }
  lightmapSetFireList(A.fireTiles, A.nFire);
}

function rescanFires() {
  if (A.fireTiles.length !== W.count) A.fireTiles = new Int32Array(W.count);
  let n = 0;
  for (let i = 0; i < W.count; i++) if (W.fire[i] > 0) A.fireTiles[n++] = i;
  A.nFire = n;
  lightmapSetFireList(A.fireTiles, n);
}

// ---------------------------------------------------------------------------------------------- boats

function randomShallow(nearX, nearZ, maxD) {
  const sh = W.shore || [];
  for (let k = 0; k < 20; k++) {
    const i = sh[(Math.random() * sh.length) | 0];
    if (i == null) return -1;
    if (W.type[i] !== T.SHALLOW) continue;
    if (nearX != null && Math.hypot(W.x[i] - nearX, W.z[i] - nearZ) > maxD) continue;
    return i;
  }
  return sh.length ? sh[(Math.random() * sh.length) | 0] : -1;
}
function clearPath(x0, z0, x1, z1) {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 0.5);
  for (let k = 1; k <= n; k++) { const t = k / n; if (!isWaterAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false; }
  return true;
}
function spawnBoats() {
  A.boats.length = 0;
  const n = Math.min(BOATS, Math.max(4, Math.floor((W.shore || []).length / 25)));
  for (let k = 0; k < n; k++) {
    const home = A.docks.length ? A.docks[(Math.random() * A.docks.length) | 0] : randomShallow();
    if (home < 0) break;
    const t = randomShallow();
    const st = t >= 0 ? t : home;
    A.boats.push({
      type: k % A.boatPools.length, home, x: W.x[st], z: W.z[st], yaw: Math.random() * 6.28, speed: 0, vmax: 0.55 + Math.random() * 0.4,
      tx: W.x[st], tz: W.z[st], state: 0, ph: Math.random() * 10, wakeT: 0,
    });
  }
}
function newWaypoint(b) {
  for (let k = 0; k < 8; k++) {
    const t = randomShallow(b.x, b.z, 14);
    if (t < 0) return;
    const x = W.x[t] + (Math.random() - 0.5) * 0.8, z = W.z[t] + (Math.random() - 0.5) * 0.8;
    if (isWaterAt(x, z) && clearPath(b.x, b.z, x, z)) { b.tx = x; b.tz = z; return; }
  }
  b.tx = b.x - Math.sin(b.yaw) * 2; b.tz = b.z - Math.cos(b.yaw) * 2;
}

function updateBoats(gdt, raid, frustum) {
  if (!A.boats.length && (W.shore || []).length) spawnBoats();
  for (const p of A.boatPools) p.n = 0;
  const night = U.uNight.value;
  for (const b of A.boats) {
    if (gdt > 0) {
      if (raid && b.state === 0) {
        b.state = 1;
        const h = b.home;
        b.tx = W.x[h]; b.tz = W.z[h];
        b.via = 0;
        if (!clearPath(b.x, b.z, b.tx, b.tz)) {
          // go via open water: first straight out to sea, then home
          const r = Math.hypot(b.x, b.z) || 1;
          b.tx = b.x + (b.x / r) * 5; b.tz = b.z + (b.z / r) * 5; b.via = 1;
        }
      } else if (!raid && b.state === 2 && Math.random() < gdt * 0.15) { b.state = 0; newWaypoint(b); }
      const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz);
      let want = b.state === 1 ? 1.7 : b.state === 2 ? 0 : b.vmax;
      if (d < 0.6) {
        if (b.state === 1 && b.via) { b.via = 0; b.tx = W.x[b.home]; b.tz = W.z[b.home]; }
        else if (b.state === 1) { b.state = 2; want = 0; }
        else if (b.state === 0) newWaypoint(b);
      }
      if (d < 2) want *= Math.max(0.25, d / 2);
      const ta = Math.atan2(dx, dz);
      const da = Math.atan2(Math.sin(ta - b.yaw), Math.cos(ta - b.yaw));
      if (b.state !== 2) b.yaw += Math.max(-1, Math.min(1, da * 2)) * gdt * (0.6 + b.speed * 0.4);
      b.speed += (want * Math.max(0.2, Math.cos(da)) - b.speed) * Math.min(1, gdt * 0.8);
      const nx = b.x + Math.sin(b.yaw) * b.speed * gdt, nz = b.z + Math.cos(b.yaw) * b.speed * gdt;
      if (isWaterAt(nx + Math.sin(b.yaw) * 0.4, nz + Math.cos(b.yaw) * 0.4)) { b.x = nx; b.z = nz; }
      else { b.yaw += 2.0 * gdt * 3; b.speed *= 0.5; if (b.state === 0) newWaypoint(b); }
      b.wakeT -= gdt;
      if (b.speed > 0.2 && b.wakeT <= 0) {
        b.wakeT = 0.12 / b.speed;
        const info = A.boatGeoInfo[b.type];
        wake(b.x - Math.sin(b.yaw) * info.hl, b.z - Math.cos(b.yaw) * info.hl, 0.6 + b.speed * 0.4);
      }
    }
    const info = A.boatGeoInfo[b.type];
    const t = U.uTime.value;
    const bob = Math.sin(t * 1.3 + b.ph) * 0.012, pitch = Math.sin(t * 1.1 + b.ph * 2) * 0.03, roll = Math.sin(t * 0.9 + b.ph) * 0.05;
    _s.center.set(b.x, 0, b.z); _s.radius = 1.5;
    if (frustum && !frustum.intersectsSphere(_s)) continue;
    const pool = A.boatPools[b.type];
    if (pool.n >= pool.max) continue;
    writeBoat(pool.mArr, pool.n * 16, b.x, -0.02 + bob, b.z, b.yaw, pitch, roll);
    pool.cArr[pool.n * 3] = pool.cArr[pool.n * 3 + 1] = pool.cArr[pool.n * 3 + 2] = 1;
    pool.n++;
    if (night > 0.3) pushVehicleLight(b.x, 0, b.z, b.yaw, info.hl, info.hw * 0.9, info.top * 0.7, VEH_FLAG.BOAT);
  }
  for (const p of A.boatPools) { p.mesh.count = p.n; p.mesh.visible = p.n > 0; if (p.n) p.upload(0, p.n); }
  A.stats.boats = A.boats.length;
}
const _s = new THREE.Sphere();
function writeBoat(a, o, x, y, z, yaw, pitch, roll) {
  // R = Ry(yaw) * Rx(-pitch) * Rz(roll), written directly
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  // columns of Ry*Rx*Rz
  const m00 = cy * cr + sy * sp * sr, m10 = cp * sr, m20 = -sy * cr + cy * sp * sr;
  const m01 = -cy * sr + sy * sp * cr, m11 = cp * cr, m21 = sy * sr + cy * sp * cr;
  const m02 = sy * cp, m12 = -sp, m22 = cy * cp;
  a[o] = m00; a[o + 1] = m10; a[o + 2] = m20; a[o + 3] = 0;
  a[o + 4] = m01; a[o + 5] = m11; a[o + 6] = m21; a[o + 7] = 0;
  a[o + 8] = m02; a[o + 9] = m12; a[o + 10] = m22; a[o + 11] = 0;
  a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
}

// ---------------------------------------------------------------------------------------------- gulls

function spawnGulls() {
  A.gulls.length = 0;
  const anchors = A.docks.length ? A.docks : (W.shore || []);
  if (!anchors.length) return;
  const nFlocks = Math.min(10, anchors.length);
  for (let f = 0; f < nFlocks; f++) {
    const t = anchors[(Math.random() * anchors.length) | 0];
    const n = GULLS / nFlocks;
    for (let k = 0; k < n; k++) {
      A.gulls.push({
        ax: W.x[t] + (Math.random() - 0.5) * 2, az: W.z[t] + (Math.random() - 0.5) * 2, r: 0.8 + Math.random() * 2.8,
        h: 1.2 + Math.random() * 2.2, w: (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.45), th: Math.random() * 6.28,
        out: 0, ox: 0, oz: 0,
      });
    }
  }
}

function updateGulls(gdt, raid, frustum) {
  if (!A.gulls.length && (W.shore || []).length) spawnGulls();
  const p = A.gullPool;
  p.n = 0;
  const night = U.uNight.value;
  const vis = 1 - Math.min(1, Math.max(0, (night - 0.5) / 0.2));
  for (const g of A.gulls) {
    g.th += g.w * gdt;
    // scatter during raids: fly outward and up, then come back when it is over
    g.out += ((raid ? 1 : 0) - g.out) * Math.min(1, gdt * (raid ? 0.35 : 0.08));
    const r = g.r + g.out * 14, h = g.h + g.out * 5;
    const x = g.ax + Math.cos(g.th) * r, z = g.az + Math.sin(g.th) * r;
    const yaw = Math.atan2(-Math.sin(g.th) * g.w, Math.cos(g.th) * g.w);
    const s = vis * (1 - g.out * 0.9) * 1.3;
    if (s < 0.05) continue;
    _s.center.set(x, h, z); _s.radius = 0.5;
    if (frustum && !frustum.intersectsSphere(_s)) continue;
    const bank = -Math.sign(g.w) * 0.35;
    const o = p.n * 16;
    writeBoat(p.mArr, o, x, h, z, yaw, 0, bank);
    for (let k = 0; k < 11; k++) if (k !== 3 && k !== 7) p.mArr[o + k] *= s;
    p.cArr[p.n * 3] = p.cArr[p.n * 3 + 1] = p.cArr[p.n * 3 + 2] = 1;
    p.n++;
    if (p.n >= p.max) break;
  }
  p.mesh.count = p.n; p.mesh.visible = p.n > 0;
  if (p.n) p.upload(0, p.n);
  A.stats.gulls = p.n;
}

// ---------------------------------------------------------------------------------------------- fires and smoke

function updateFires(gdt, frustum, camPos) {
  A.fireScanT -= gdt;
  if (A.fireScanT <= 0 || A.nFire === 0 && G.fires > 0) { A.fireScanT = 0.5; rescanFires(); }
  if (gdt <= 0) return;
  // visible fires share the emission budget: many fires each emit less
  let vis = 0;
  for (let k = 0; k < A.nFire; k++) {
    const i = A.fireTiles[k];
    _s.center.set(W.x[i], W.h[i] + 1, W.z[i]); _s.radius = 3;
    if (!frustum || frustum.intersectsSphere(_s)) vis++;
  }
  const rate = Math.min(1, 10 / Math.max(1, vis));
  for (let k = 0; k < A.nFire; k++) {
    const i = A.fireTiles[k];
    const f = W.fire[i] / 255;
    if (f <= 0) continue;
    _s.center.set(W.x[i], W.h[i] + 1, W.z[i]); _s.radius = 3;
    if (frustum && !frustum.intersectsSphere(_s)) continue;
    const dist = camPos ? Math.hypot(W.x[i] - camPos.x, W.z[i] - camPos.z) : 0;
    const top = W.lvl[i] ? lotTopY(i) : W.h[i] + 0.1;
    fireColumn(W.x[i], top, W.z[i], f, 0.3 + 0.08 * W.lvl[i], rate * (dist > 90 ? 0.5 : 1), gdt);
  }
  // burning player buildings
  for (const b of G.buildings || []) {
    const f = b.fire > 1 ? b.fire / 255 : b.fire || 0;
    if (f > 0) fireColumn(b.x, (b.y || 0.3) + 0.6, b.z, f, 0.3, rate, gdt);
  }
  A.stats.fires = A.nFire;
}

function updateStacks(gdt, frustum, camPos) {
  if (A.stacksDirty || (G.buildings || []).length !== A.bldLen) { A.stacksDirty = false; rebuildStacks(); }
  if (gdt <= 0) return;
  let emitting = 0;
  const S = A.stacks;
  for (let k = 0; k < A.nStacks && emitting < 36; k++) {
    const x = S[k * 4], y = S[k * 4 + 1], z = S[k * 4 + 2], s = S[k * 4 + 3];
    _s.center.set(x, y + 2, z); _s.radius = 3;
    if (frustum && !frustum.intersectsSphere(_s)) continue;
    if (camPos && Math.hypot(x - camPos.x, z - camPos.z) > 110) continue;
    emitting++;
    if (Math.random() < gdt * (1.4 + s * 0.8)) stackSmoke(x, y, z, s, s > 1.2 ? 0.62 : 0.72);
  }
  A.stats.stacks = emitting;
}

// ---------------------------------------------------------------------------------------------- per frame

export function ambientFrame(gdt, frustum, camPos) {
  if (!W.x) return;
  const raid = G.wave && G.wave.state === 'active';
  updateBoats(gdt, raid, frustum);
  updateGulls(gdt, raid, frustum);
  updateFires(gdt, frustum, camPos);
  updateStacks(gdt, frustum, camPos);
}

export function ambientStats() { return A.stats; }
export function ambientClear() { A.boats.length = 0; A.gulls.length = 0; A.nFire = 0; A.lighthouse = -1; }
export function ambientWarm() {
  for (const p of [...A.boatPools, A.gullPool]) { p.n = 0; p.put(0, -60, 0); p.mesh.count = 1; p.mesh.visible = true; p.upload(0, 1); }
}
