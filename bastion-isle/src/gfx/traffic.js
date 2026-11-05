import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Pool } from './pools.js';
import { W, LF, groundY } from '../world.js';
import { G } from '../state.js';
import { hose } from './fx.js';
import { U } from './uniforms.js';

// Cosmetic traffic (SPEC 5.5; rendering review should_change 12). Cars live in SoA typed arrays and drive the road
// graph built from W.road: right-hand lanes, quadratic-Bezier turns through junctions, U-turns at dead ends, ramps
// between tile heights, simple car-following (hashed grid) so queues form instead of cars overlapping. Matrices
// are written straight into the instance buffers (no Matrix4/Euler/Quaternion per car). Only cars inside the view
// frustum are uploaded. Fire trucks come from G.trucks (sim-owned), police cars occasionally join the traffic.
// Head/tail lights and flashers: one instanced glow-quad draw in the main scene; the same per-vehicle buffer feeds
// the headlight cones of the night light map (shared attributes, uploaded once).
//
// Vehicle geometry is injected (gfx-models): vehicleGeos = { car, van, truck, bus, fire, police, material }.
// Each faces +z, origin on the ground at its centre, real scale (car 0.36u long). Missing ones get placeholders.

export const MAXC = 600;
const LIGHT_MAX = MAXC + 64;           // cars + fire trucks + boats + spare
const OFF = 0.125;                     // lane centre offset from the road centre line (road 0.52u wide)
const J = 0.42;                        // junction inset: turns run from J before to J after the node centre
const ROAD_LIFT = 0.025;               // road surface above the tile top
const ACC = 1.6, DEC = 4.5;
const TYPES = ['car', 'van', 'truck', 'bus', 'police'];
const POOLS = ['car', 'van', 'truck', 'bus', 'police', 'fire'];
export const VEH_FLAG = { FLASH: 1, POLICE: 2, BRAKE: 4, FIRE: 8, BOAT: 16, LAMP: 32 };

// ---------------------------------------------------------------------------------- placeholder vehicle models

function box(w, h, l, x, y, z, rgb) {
  const g = new THREE.BoxGeometry(w, h, l).translate(x, y, z);
  const n = g.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = rgb[0]; c[i * 3 + 1] = rgb[1]; c[i * 3 + 2] = rgb[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const PAINT = [1, 1, 1], GLASS = [0.035, 0.045, 0.06], TYRE = [0.02, 0.02, 0.022], HEAD = [0.95, 0.93, 0.85], TAIL = [0.55, 0.03, 0.02];
const CHROME = [0.5, 0.5, 0.52];
function wheels(parts, l, w, r = 0.026) {
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) parts.push(box(0.03, r * 2, r * 2.6, sx * (w / 2 - 0.012), r, sz * l * 0.32, TYRE));
}
function lights(parts, l, w, y) {
  for (const sx of [-1, 1]) {
    parts.push(box(0.035, 0.018, 0.006, sx * w * 0.34, y, l / 2 + 0.002, HEAD));
    parts.push(box(0.035, 0.016, 0.006, sx * w * 0.34, y, -l / 2 - 0.002, TAIL));
  }
}
export function placeholderVehicles() {
  const G = {};
  { // car 0.36 x 0.16 x 0.12
    const p = [box(0.16, 0.055, 0.36, 0, 0.05, 0, PAINT), box(0.14, 0.05, 0.19, 0, 0.1, -0.02, GLASS), box(0.142, 0.01, 0.16, 0, 0.127, -0.025, PAINT)];
    wheels(p, 0.36, 0.16); lights(p, 0.36, 0.16, 0.055);
    G.car = mergeGeometries(p);
  }
  { // police: car with a roof light bar
    const p = [box(0.16, 0.055, 0.36, 0, 0.05, 0, PAINT), box(0.14, 0.05, 0.19, 0, 0.1, -0.02, GLASS), box(0.142, 0.01, 0.16, 0, 0.127, -0.025, PAINT),
      box(0.11, 0.02, 0.035, 0, 0.14, -0.01, [0.1, 0.15, 0.9]), box(0.16, 0.022, 0.12, 0, 0.06, 0, [0.03, 0.04, 0.08])];
    wheels(p, 0.36, 0.16); lights(p, 0.36, 0.16, 0.055);
    G.police = mergeGeometries(p);
  }
  { // van 0.45 x 0.17 x 0.16
    const p = [box(0.17, 0.12, 0.45, 0, 0.09, -0.01, PAINT), box(0.155, 0.05, 0.03, 0, 0.12, 0.215, GLASS), box(0.172, 0.035, 0.3, 0, 0.12, -0.05, GLASS)];
    wheels(p, 0.45, 0.17); lights(p, 0.45, 0.17, 0.06);
    G.van = mergeGeometries(p);
  }
  { // truck 0.7: cab + box body
    const p = [box(0.19, 0.13, 0.17, 0, 0.1, 0.26, PAINT), box(0.17, 0.05, 0.02, 0, 0.13, 0.346, GLASS),
      box(0.2, 0.19, 0.5, 0, 0.14, -0.09, [0.86, 0.86, 0.84]), box(0.06, 0.02, 0.62, 0, 0.035, 0, CHROME)];
    wheels(p, 0.7, 0.19, 0.03); lights(p, 0.7, 0.19, 0.06);
    G.truck = mergeGeometries(p);
  }
  { // bus 0.95
    const p = [box(0.2, 0.17, 0.95, 0, 0.115, 0, PAINT), box(0.204, 0.06, 0.86, 0, 0.14, -0.02, GLASS), box(0.17, 0.07, 0.01, 0, 0.13, 0.476, GLASS),
      box(0.16, 0.025, 0.4, 0, 0.212, -0.1, [0.75, 0.76, 0.77])];
    wheels(p, 0.95, 0.2, 0.032); lights(p, 0.95, 0.2, 0.06);
    G.bus = mergeGeometries(p);
  }
  { // fire truck 0.75: red body baked in, ladder on top
    const red = [0.62, 0.03, 0.02];
    const p = [box(0.2, 0.16, 0.75, 0, 0.11, 0, red), box(0.18, 0.06, 0.02, 0, 0.15, 0.37, GLASS), box(0.205, 0.02, 0.6, 0, 0.12, -0.05, [0.85, 0.85, 0.8]),
      box(0.07, 0.025, 0.62, 0.03, 0.205, -0.06, [0.7, 0.7, 0.72]), box(0.12, 0.018, 0.03, 0, 0.198, 0.3, [0.9, 0.1, 0.05])];
    wheels(p, 0.75, 0.2, 0.032); lights(p, 0.75, 0.2, 0.06);
    G.fire = mergeGeometries(p);
  }
  return G;
}

// ---------------------------------------------------------------------------------- state

const N = MAXC;
const C = {
  alive: new Uint8Array(N), type: new Uint8Array(N), dying: new Uint8Array(N),
  a: new Int32Array(N), b: new Int32Array(N), c: new Int32Array(N),
  piece: new Uint8Array(N), u: new Float32Array(N), len: new Float32Array(N),
  p0x: new Float32Array(N), p0y: new Float32Array(N), p0z: new Float32Array(N),
  cx: new Float32Array(N), cy: new Float32Array(N), cz: new Float32Array(N),
  p1x: new Float32Array(N), p1y: new Float32Array(N), p1z: new Float32Array(N),
  spd: new Float32Array(N), vmax: new Float32Array(N), lim: new Float32Array(N), nextLim: new Float32Array(N),
  trip: new Int16Array(N), stopT: new Float32Array(N), ghostT: new Float32Array(N), scl: new Float32Array(N),
  x: new Float32Array(N), y: new Float32Array(N), z: new Float32Array(N), yaw: new Float32Array(N), pitch: new Float32Array(N),
  dx: new Float32Array(N), dz: new Float32Array(N), brake: new Uint8Array(N), flash: new Uint8Array(N),
  r: new Float32Array(N), g: new Float32Array(N), bl: new Float32Array(N),
  free: new Int16Array(N), nFree: 0, count: 0,
};
for (let i = 0; i < N; i++) C.free[i] = N - 1 - i;
C.nFree = N;

// hashed grid for car following
const GB = 4096, CELL = 0.8;
const gHead = new Int16Array(GB), gStamp = new Int32Array(GB), gNext = new Int16Array(N);
let stamp = 1;
const cellKey = (cx, cz) => ((Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663)) >>> 0) & (GB - 1);

// road graph
let roadMask = null;       // Uint8Array per tile: bit d set when neighbour d is a road
let spawnTiles = new Int32Array(0), spawnW = new Float32Array(0), nSpawn = 0, spawnTotal = 0;
let roadCount = 0;

const T = {
  pools: {}, halfLen: new Float32Array(6), halfWid: new Float32Array(6), lightY: new Float32Array(6),
  lightGeo: null, lightMesh: null, aV0: null, aV1: null, lightRef: { n: 0 },
  spawnAcc: 0, police: 0, stats: { cars: 0, visible: 0, trucks: 0, bytes: 0, ms: 0 },
  hasPoliceStation: false, buildingsLen: -1,
};

const PALETTE = [0xe9e9e6, 0xe9e9e6, 0xd8d8d4, 0xb5b9bd, 0xb5b9bd, 0x6c7176, 0x2a2c2f, 0x1b1c1e, 0x23395a, 0x7d1b19,
  0xb3a487, 0x2d4936, 0x6e8eaa, 0x8f8f86, 0x4b2d22].map((h) => new THREE.Color(h));
const VAN_PAL = [0xf0f0ec, 0xf0f0ec, 0xe2e2dc, 0x9aa2a8, 0x2f4f78, 0xc9b28a].map((h) => new THREE.Color(h));
const TRUCK_PAL = [0xe9e9e6, 0x8c2a20, 0x2c4a73, 0x3d6b4a, 0xd5a23a].map((h) => new THREE.Color(h));
const BUS_COL = new THREE.Color(0x2f7f93);
const POLICE_COL = new THREE.Color(0xf2f2f0);

// ---------------------------------------------------------------------------------- init

const lightVert = /* glsl */`
attribute vec2 corner;
attribute float aWhich;  // 0,1 headlights  2,3 tail lights  4,5 flashers
attribute vec4 aV0;      // x y z yaw
attribute vec4 aV1;      // halfLen halfWid lightY flags
uniform float uNight, uTime;
varying vec2 vUv;
varying vec3 vCol;
varying float vFogDepth;
void main() {
  float fl = aV1.w;
  float flash = mod(fl, 2.0), police = mod(floor(fl / 2.0), 2.0), brake = mod(floor(fl / 4.0), 2.0), boat = mod(floor(fl / 16.0), 2.0);
  float hl = aV1.x, hw = aV1.y, ly = aV1.z;
  float n = smoothstep(0.25, 0.6, uNight);
  vec3 lp = vec3(0.0), col = vec3(0.0);
  float size = 0.05, face = 0.0;
  float lamp = mod(floor(fl / 32.0), 2.0);
  if (lamp > 0.5) {
    // fixed lamp (searchlight head, lighthouse lantern): aV1 = (size, intensity, y offset, flags)
    if (aWhich < 0.5) { lp = vec3(0.0, ly, 0.0); col = vec3(1.0, 0.92, 0.75) * hw; size = hl; }
  } else if (boat > 0.5) {
    if (aWhich < 0.5) { lp = vec3(hw, ly, 0.1 * hl); col = vec3(4.0, 0.12, 0.08); }        // port: red
    else if (aWhich < 1.5) { lp = vec3(-hw, ly, 0.1 * hl); col = vec3(0.1, 3.6, 0.7); }    // starboard: green
    else if (aWhich < 2.5) { lp = vec3(0.0, ly * 2.4, 0.25 * hl); col = vec3(4.0, 3.9, 3.6); } // masthead
    col *= n; size = 0.045;
  } else if (aWhich < 1.5) {
    lp = vec3((aWhich < 0.5 ? 1.0 : -1.0) * hw * 0.68, ly, hl); col = vec3(6.0, 5.6, 4.6) * n; size = 0.075; face = 1.0;
  } else if (aWhich < 3.5) {
    lp = vec3((aWhich < 2.5 ? 1.0 : -1.0) * hw * 0.68, ly, -hl); col = vec3(3.2, 0.2, 0.1) * (n * 0.9 + brake * 1.4); size = 0.055; face = -1.0;
  } else if (flash > 0.5) {
    float second = step(4.5, aWhich);
    float ph = step(0.5, fract(uTime * 3.0 + second * 0.5));
    lp = vec3((second > 0.5 ? -1.0 : 1.0) * hw * 0.42, ly * 2.5, hl * 0.32);
    vec3 cA = police > 0.5 ? vec3(0.25, 0.5, 7.0) : (second > 0.5 ? vec3(0.25, 0.5, 7.0) : vec3(8.0, 0.35, 0.2));
    col = cA * ph * mix(0.6, 1.0, n); size = 0.07;
  }
  if (dot(col, col) < 1e-6) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float c = cos(aV0.w), s = sin(aV0.w);
  vec3 wp = aV0.xyz + vec3(lp.x * c + lp.z * s, lp.y, -lp.x * s + lp.z * c);
  if (face != 0.0) {
    vec3 toCam = normalize(cameraPosition - wp);
    col *= 0.15 + 0.85 * smoothstep(-0.35, 0.55, dot(toCam, vec3(s, 0.0, c)) * face);
  }
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  size = max(size, -mv.z * 0.0026);   // never smaller than ~2 px, so lights read at strategy zoom
  mv.xy += corner * size;
  gl_Position = projectionMatrix * mv;
  vFogDepth = -mv.z;
  vUv = corner;
  vCol = col;
}`;
const lightFrag = /* glsl */`
varying vec2 vUv;
varying vec3 vCol;
varying float vFogDepth;
#ifdef USE_FOG
uniform vec3 fogColor;
uniform float fogNear, fogFar;
#endif
void main() {
  float d = dot(vUv, vUv);
  float f = exp(-d * 5.0) - 0.0067;
  if (f <= 0.0) discard;
  vec3 c = vCol * f;
#ifdef USE_FOG
  c *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
#endif
  gl_FragColor = vec4(c, 1.0);
}`;

export function initTraffic(scene, { vehicleGeos = null, quality = 'high' } = {}) {
  const ph = placeholderVehicles();
  const geos = Object.assign({}, ph, vehicleGeos || {});
  const mat = (vehicleGeos && vehicleGeos.material) || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.2 });
  const caps = { car: N, van: 160, truck: 120, bus: 50, police: 40, fire: 24 };
  POOLS.forEach((k, ti) => {
    const geo = geos[k] || geos.car;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox;
    T.halfLen[ti] = Math.max(Math.abs(bb.max.z), Math.abs(bb.min.z));
    T.halfWid[ti] = Math.max(Math.abs(bb.max.x), Math.abs(bb.min.x));
    T.lightY[ti] = bb.min.y + (bb.max.y - bb.min.y) * 0.4;
    const pool = new Pool(geo, mat, caps[k], { cast: quality === 'ultra', receive: true, order: 3 });
    pool.mesh.name = 'traffic-' + k;
    T.pools[k] = pool;
    scene.add(pool.mesh);
  });

  // light glow quads: 6 per vehicle
  const corner = [], which = [], idx = [];
  for (let q = 0; q < 6; q++) {
    corner.push(-1, -1, 1, -1, 1, 1, -1, 1);
    which.push(q, q, q, q);
    const o = q * 4; idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array(corner), 2));
  g.setAttribute('aWhich', new THREE.BufferAttribute(new Float32Array(which), 1));
  g.setIndex(idx);
  T.aV0 = new THREE.InstancedBufferAttribute(new Float32Array(LIGHT_MAX * 4), 4);
  T.aV1 = new THREE.InstancedBufferAttribute(new Float32Array(LIGHT_MAX * 4), 4);
  T.aV0.setUsage(THREE.DynamicDrawUsage); T.aV1.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aV0', T.aV0); g.setAttribute('aV1', T.aV1);
  g.instanceCount = 0;
  T.lightGeo = g;
  T.lightMesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    vertexShader: lightVert, fragmentShader: lightFrag, fog: true,
    uniforms: { uNight: U.uNight, uTime: U.uTime, fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 1000 } },
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  T.lightMesh.frustumCulled = false;
  T.lightMesh.renderOrder = 9;
  T.lightMesh.name = 'vehicle-lights';
  scene.add(T.lightMesh);
  return { aV0: T.aV0, aV1: T.aV1, countRef: T.lightRef };
}

// ---------------------------------------------------------------------------------- road graph

export function trafficOnRoadsChanged() {
  if (!W.road) return;
  if (!roadMask || roadMask.length !== W.count) roadMask = new Uint8Array(W.count);
  roadCount = 0;
  for (let i = 0; i < W.count; i++) {
    let m = 0;
    if (W.road[i]) {
      roadCount++;
      for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j]) m |= 1 << d; }
    }
    roadMask[i] = m;
  }
  // cars on a road that disappeared leave politely
  for (let i = 0; i < N; i++) {
    if (!C.alive[i]) continue;
    if (!W.road[C.a[i]] || !W.road[C.b[i]] || !(roadMask[C.b[i]] & 63)) C.dying[i] = 1;
  }
  trafficOnLotsChanged();
}

// spawn points: road tiles next to built lots, weighted by level; a little through-traffic everywhere else
export function trafficOnLotsChanged() {
  if (!roadMask) return;
  if (spawnTiles.length < W.count) { spawnTiles = new Int32Array(W.count); spawnW = new Float32Array(W.count); }
  nSpawn = 0; spawnTotal = 0;
  for (let i = 0; i < W.count; i++) {
    if (!roadMask[i]) continue;
    let w = 0.05;
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[i * 6 + d];
      if (j >= 0 && W.zone[j] && W.lvl[j] && !(W.flags[j] & (LF.ABANDONED | LF.RUBBLE))) w += W.lvl[j] * (W.zone[j] === 2 ? 1.6 : 1);
    }
    spawnTiles[nSpawn] = i;
    spawnTotal += w;
    spawnW[nSpawn++] = spawnTotal;
  }
}

function pickSpawn() {
  if (!nSpawn) return -1;
  const r = Math.random() * spawnTotal;
  let lo = 0, hi = nSpawn - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (spawnW[m] < r) lo = m + 1; else hi = m; }
  return spawnTiles[lo];
}

const roadY = (i) => W.h[i] + ROAD_LIFT;

// choose the node after b when arriving from a: prefer straight on, never a U-turn unless it is a dead end
function pickNext(a, b) {
  const m = roadMask[b];
  let back = -1;
  for (let d = 0; d < 6; d++) if (W.nbr[b * 6 + d] === a) back = d;
  let total = 0;
  const opp = back >= 0 ? (back + 3) % 6 : -1;
  for (let d = 0; d < 6; d++) {
    if (!(m & (1 << d)) || d === back) continue;
    total += d === opp ? 2.2 : 1;
  }
  if (total === 0) return a;
  let r = Math.random() * total;
  for (let d = 0; d < 6; d++) {
    if (!(m & (1 << d)) || d === back) continue;
    r -= d === opp ? 2.2 : 1;
    if (r <= 0) return W.nbr[b * 6 + d];
  }
  return a;
}

function turnLimit(a, b, c) {
  if (c === a) return 0.32;
  const ax = W.x[b] - W.x[a], az = W.z[b] - W.z[a], bx = W.x[c] - W.x[b], bz = W.z[c] - W.z[b];
  const cos = (ax * bx + az * bz) / (Math.hypot(ax, az) * Math.hypot(bx, bz));
  return cos > 0.9 ? 9 : cos > 0.4 ? 0.75 : 0.48;
}

// straight piece along edge a->b in the right-hand lane
function setStraight(i) {
  const a = C.a[i], b = C.b[i];
  let dx = W.x[b] - W.x[a], dz = W.z[b] - W.z[a];
  const L = Math.hypot(dx, dz); dx /= L; dz /= L;
  const nx = -dz, nz = dx;   // right-hand normal of the travel direction
  C.p0x[i] = W.x[a] + dx * J + nx * OFF; C.p0z[i] = W.z[a] + dz * J + nz * OFF; C.p0y[i] = roadY(a);
  C.p1x[i] = W.x[b] - dx * J + nx * OFF; C.p1z[i] = W.z[b] - dz * J + nz * OFF; C.p1y[i] = roadY(b);
  C.cx[i] = (C.p0x[i] + C.p1x[i]) * 0.5; C.cy[i] = (C.p0y[i] + C.p1y[i]) * 0.5; C.cz[i] = (C.p0z[i] + C.p1z[i]) * 0.5;
  C.len[i] = Math.max(0.05, L - 2 * J);
  C.piece[i] = 0;
  C.lim[i] = 9;
}

// turn piece at node b from a->b into b->c
function setTurn(i) {
  const a = C.a[i], b = C.b[i], c = C.c[i];
  let d1x = W.x[b] - W.x[a], d1z = W.z[b] - W.z[a];
  let l = Math.hypot(d1x, d1z); d1x /= l; d1z /= l;
  let d2x = W.x[c] - W.x[b], d2z = W.z[c] - W.z[b];
  l = Math.hypot(d2x, d2z); d2x /= l; d2z /= l;
  const n1x = -d1z, n1z = d1x, n2x = -d2z, n2z = d2x;
  const Bx = W.x[b], Bz = W.z[b], y = roadY(b);
  C.p0x[i] = Bx - d1x * J + n1x * OFF; C.p0z[i] = Bz - d1z * J + n1z * OFF;
  C.p1x[i] = Bx + d2x * J + n2x * OFF; C.p1z[i] = Bz + d2z * J + n2z * OFF;
  C.p0y[i] = C.p1y[i] = C.cy[i] = y;
  // control point: intersection of the two lane lines (midpoint if they are parallel, a loop for U-turns)
  const cr = d1x * d2z - d1z * d2x;
  if (c === a) { C.cx[i] = Bx + d1x * 0.3; C.cz[i] = Bz + d1z * 0.3; }
  else if (Math.abs(cr) < 1e-3) { C.cx[i] = (C.p0x[i] + C.p1x[i]) * 0.5; C.cz[i] = (C.p0z[i] + C.p1z[i]) * 0.5; }
  else {
    // P0 + t d1 = P1 - s d2  -> solve for t
    const ex = C.p1x[i] - C.p0x[i], ez = C.p1z[i] - C.p0z[i];
    const t = (ex * d2z - ez * d2x) / cr;
    C.cx[i] = C.p0x[i] + d1x * t; C.cz[i] = C.p0z[i] + d1z * t;
  }
  const ax = C.cx[i] - C.p0x[i], az = C.cz[i] - C.p0z[i], bx = C.p1x[i] - C.cx[i], bz = C.p1z[i] - C.cz[i];
  C.len[i] = Math.max(0.05, (Math.hypot(ax, az) + Math.hypot(bx, bz) + Math.hypot(C.p1x[i] - C.p0x[i], C.p1z[i] - C.p0z[i])) * 0.5);
  C.piece[i] = 1;
  C.lim[i] = turnLimit(a, b, c);
}

function enterEdge(i, a, b) {
  C.a[i] = a; C.b[i] = b;
  C.c[i] = pickNext(a, b);
  C.nextLim[i] = turnLimit(a, b, C.c[i]);
  setStraight(i);
}

function spawnCar(raidMode) {
  if (!C.nFree) return false;
  const t = pickSpawn();
  if (t < 0) return false;
  const m = roadMask[t];
  if (!m) return false;
  // random outgoing spoke
  let d = (Math.random() * 6) | 0;
  for (let k = 0; k < 6 && !(m & (1 << d)); k++) d = (d + 1) % 6;
  const nb = W.nbr[t * 6 + d];
  const i = C.free[--C.nFree];
  C.alive[i] = 1; C.dying[i] = 0;
  enterEdge(i, t, nb);
  C.u[i] = 0.15 + Math.random() * 0.6;
  // vehicle type
  let ty = 0;
  const r = Math.random();
  const police = T.hasPoliceStation ? 0.05 : 0.012;
  const pop = G.pop || 0;
  if (r < police) ty = 4;
  else if (r < police + 0.035 && pop > 400) ty = 3;
  else if (r < police + 0.12) ty = 2;
  else if (r < police + 0.27) ty = 1;
  C.type[i] = ty;
  const col = ty === 0 ? PALETTE[(Math.random() * PALETTE.length) | 0] : ty === 1 ? VAN_PAL[(Math.random() * VAN_PAL.length) | 0]
    : ty === 2 ? TRUCK_PAL[(Math.random() * TRUCK_PAL.length) | 0] : ty === 3 ? BUS_COL : POLICE_COL;
  C.r[i] = col.r; C.g[i] = col.g; C.bl[i] = col.b;
  C.vmax[i] = (ty === 2 || ty === 3 ? 0.8 : 1.0) * (0.85 + Math.random() * 0.35);
  C.spd[i] = C.vmax[i] * 0.6;
  C.trip[i] = 6 + ((Math.random() * 30) | 0);
  C.stopT[i] = 0; C.ghostT[i] = 0; C.scl[i] = 0;
  C.flash[i] = ty === 4 && (raidMode || Math.random() < 0.15) ? 1 : 0;
  C.count++;
  evalPos(i);
  return true;
}

function freeCar(i) {
  C.alive[i] = 0;
  C.free[C.nFree++] = i;
  C.count--;
}

function evalPos(i) {
  const u = C.u[i], v = 1 - u;
  const a = v * v, b = 2 * u * v, c = u * u;
  C.x[i] = a * C.p0x[i] + b * C.cx[i] + c * C.p1x[i];
  C.y[i] = a * C.p0y[i] + b * C.cy[i] + c * C.p1y[i];
  C.z[i] = a * C.p0z[i] + b * C.cz[i] + c * C.p1z[i];
  // tangent
  let tx = 2 * v * (C.cx[i] - C.p0x[i]) + 2 * u * (C.p1x[i] - C.cx[i]);
  const ty = 2 * v * (C.cy[i] - C.p0y[i]) + 2 * u * (C.p1y[i] - C.cy[i]);
  let tz = 2 * v * (C.cz[i] - C.p0z[i]) + 2 * u * (C.p1z[i] - C.cz[i]);
  const h = Math.hypot(tx, tz);
  if (h > 1e-5) { tx /= h; tz /= h; C.dx[i] = tx; C.dz[i] = tz; C.yaw[i] = Math.atan2(tx, tz); }
  C.pitch[i] = h > 1e-5 ? Math.atan2(ty, h) : 0;
}

// ---------------------------------------------------------------------------------- per frame

const _sph = new THREE.Sphere();
function writeMatrix(arr, o, x, y, z, yaw, pitch, s) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  // X = right (cos yaw, 0, -sin yaw), Y = up, Z = forward (sin yaw cos p, sin p, cos yaw cos p)
  arr[o] = cy * s; arr[o + 1] = 0; arr[o + 2] = -sy * s; arr[o + 3] = 0;
  arr[o + 4] = -sy * sp * s; arr[o + 5] = cp * s; arr[o + 6] = -cy * sp * s; arr[o + 7] = 0;
  arr[o + 8] = sy * cp * s; arr[o + 9] = sp * s; arr[o + 10] = cy * cp * s; arr[o + 11] = 0;
  arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1;
}

let nLights = 0;
function pushLight(x, y, z, yaw, hl, hw, ly, flags) {
  if (nLights >= LIGHT_MAX) return;
  const o = nLights * 4, A = T.aV0.array, B = T.aV1.array;
  A[o] = x; A[o + 1] = y; A[o + 2] = z; A[o + 3] = yaw;
  B[o] = hl; B[o + 1] = hw; B[o + 2] = ly; B[o + 3] = flags;
  nLights++;
}
export { pushLight as pushVehicleLight };

function putVehicle(key, ti, x, y, z, yaw, pitch, s, r, g, b, flags) {
  const pool = T.pools[key];
  if (pool.n >= pool.max) return;
  const k = pool.n++;
  writeMatrix(pool.mArr, k * 16, x, y, z, yaw, pitch, s);
  const c = pool.cArr; c[k * 3] = r; c[k * 3 + 1] = g; c[k * 3 + 2] = b;
  if (s > 0.6) pushLight(x, y, z, yaw, T.halfLen[ti] * s, T.halfWid[ti] * s, T.lightY[ti] * s, flags);
}

const IDLE_TRUCK = { idle: 1, parked: 1, home: 1, station: 1, docked: 1, ready: 1 };
const SPRAY_TRUCK = { spray: 1, spraying: 1, fight: 1, fighting: 1, extinguish: 1, extinguishing: 1, work: 1, working: 1 };

// gdt: game-scaled dt. frustum: THREE.Frustum of the current camera. camPos: camera position.
export function trafficFrame(gdt, frustum, camPos) {
  const t0 = performance.now();
  if (!roadMask) trafficOnRoadsChanged();
  if (!roadMask) return;
  const raid = G.wave && G.wave.state === 'active';
  // police presence
  if ((G.buildings || []).length !== T.buildingsLen) {
    T.buildingsLen = (G.buildings || []).length;
    T.hasPoliceStation = (G.buildings || []).some((b) => b.type === 'police');
  }
  // target count from population; during raids spawning drops to 30 %
  const pop = G.pop || 0;
  const target = Math.min(N, Math.floor(pop / 8), roadCount * 2);
  const want = raid ? target * 0.3 : target;
  if (C.count < want && gdt > 0) {
    T.spawnAcc += gdt * (2 + (want - C.count) * 1.5) * (raid ? 0.3 : 1);
    let guard = 8;
    while (T.spawnAcc >= 1 && guard-- > 0) { T.spawnAcc -= 1; if (!spawnCar(raid)) break; }
    if (T.spawnAcc > 4) T.spawnAcc = 4;
  }

  // 1) grid of current positions
  stamp++;
  for (let i = 0; i < N; i++) {
    if (!C.alive[i]) continue;
    const key = cellKey(Math.floor(C.x[i] / CELL), Math.floor(C.z[i] / CELL));
    if (gStamp[key] !== stamp) { gStamp[key] = stamp; gHead[key] = -1; }
    gNext[i] = gHead[key]; gHead[key] = i;
  }

  // 2) drive
  for (let i = 0; i < N; i++) {
    if (!C.alive[i]) continue;
    if (gdt <= 0) continue;
    const ti = C.type[i];
    const hl = T.halfLen[ti];
    // car ahead?
    let blocked = false;
    if (C.ghostT[i] > 0) C.ghostT[i] -= gdt;
    else {
      const px = C.x[i] + C.dx[i] * (hl + 0.32), pz = C.z[i] + C.dz[i] * (hl + 0.32);
      const gx = Math.floor(px / CELL - 0.5), gz = Math.floor(pz / CELL - 0.5);
      for (let ox = 0; ox < 2 && !blocked; ox++) for (let oz = 0; oz < 2 && !blocked; oz++) {
        const key = cellKey(gx + ox, gz + oz);
        if (gStamp[key] !== stamp) continue;
        for (let j = gHead[key]; j >= 0; j = gNext[j]) {
          if (j === i || !C.alive[j]) continue;
          const rx = C.x[j] - C.x[i], rz = C.z[j] - C.z[i];
          const along = rx * C.dx[i] + rz * C.dz[i];
          if (along <= 0) continue;
          const lat = Math.abs(rx * C.dz[i] - rz * C.dx[i]);
          if (lat > 0.11) continue;
          const dot = C.dx[i] * C.dx[j] + C.dz[i] * C.dz[j];
          if (dot < -0.2) continue;
          // crossing traffic: only a car approaching a junction yields to one already inside it (no gridlock)
          if (dot < 0.5 && !(C.piece[i] === 0 && C.piece[j] === 1)) continue;
          if (along < hl + T.halfLen[C.type[j]] + 0.1 + C.spd[i] * 0.25) { blocked = true; break; }
        }
      }
    }
    let target = C.vmax[i];
    if (C.piece[i] === 1) target = Math.min(target, C.lim[i]);
    else {
      // brake ahead of a sharp turn
      const rem = (1 - C.u[i]) * C.len[i];
      const vt = C.nextLim[i];
      target = Math.min(target, Math.sqrt(vt * vt + 2 * DEC * 0.6 * rem));
    }
    if (blocked) target = 0;
    const v0 = C.spd[i];
    let v = v0 + Math.max(-DEC * gdt, Math.min(ACC * gdt, target - v0));
    if (v < 0) v = 0;
    C.spd[i] = v;
    C.brake[i] = v < v0 - 0.4 * gdt || v < 0.05 ? 1 : 0;
    if (v < 0.03) { C.stopT[i] += gdt; if (C.stopT[i] > 2.5 + (i % 7) * 0.4) { C.ghostT[i] = 1.2; C.stopT[i] = 0; } }
    else C.stopT[i] = 0;
    // advance along the piece chain
    let u = C.u[i] + (v * gdt) / C.len[i];
    let guard = 4;
    while (u >= 1 && guard-- > 0) {
      const over = (u - 1) * C.len[i];
      if (C.piece[i] === 0) {
        if (!roadMask[C.b[i]]) { C.dying[i] = 1; u = 1; break; }
        // the next node may have changed since we chose it
        if (C.c[i] !== C.a[i] && !W.road[C.c[i]]) C.c[i] = pickNext(C.a[i], C.b[i]);
        setTurn(i);
      } else {
        const a = C.b[i], b = C.c[i];
        if (!W.road[b]) { C.dying[i] = 1; u = 1; break; }
        enterEdge(i, a, b);
        if (--C.trip[i] <= 0) C.dying[i] = 1;
      }
      u = over / C.len[i];
    }
    C.u[i] = Math.min(u, 1);
    // scale in on spawn, out at the end of the trip
    if (C.dying[i]) { C.scl[i] -= gdt * 2.5; if (C.scl[i] <= 0) { freeCar(i); continue; } }
    else if (C.scl[i] < 1) C.scl[i] = Math.min(1, C.scl[i] + gdt * 2.5);
    evalPos(i);
  }

  // 3) upload visible vehicles
  for (const k of POOLS) T.pools[k].n = 0;
  nLights = 0;
  let vis = 0;
  for (let i = 0; i < N; i++) {
    if (!C.alive[i]) continue;
    _sph.center.set(C.x[i], C.y[i], C.z[i]); _sph.radius = 1.6;
    if (frustum && !frustum.intersectsSphere(_sph)) continue;
    vis++;
    const ti = C.type[i];
    const s = C.scl[i];
    let flags = C.brake[i] ? VEH_FLAG.BRAKE : 0;
    if (ti === 4 && (C.flash[i] || raid)) flags |= VEH_FLAG.FLASH | VEH_FLAG.POLICE;
    putVehicle(TYPES[ti], ti, C.x[i], C.y[i], C.z[i], C.yaw[i], C.pitch[i], s < 1 ? s * s * (3 - 2 * s) : 1, C.r[i], C.g[i], C.bl[i], flags);
  }
  // fire trucks (sim-owned): red and blue flashers while responding, a hose jet while working
  let nt = 0;
  const trucks = G.trucks || [];
  for (let k = 0; k < trucks.length; k++) {
    const t = trucks[k];
    if (t.x == null || t.gone) continue;
    nt++;
    const y = groundY(t.x, t.z) + ROAD_LIFT;
    _sph.center.set(t.x, y, t.z); _sph.radius = 2;
    const working = SPRAY_TRUCK[t.state];
    if (working && gdt > 0) {
      let tx = t.tx, tz = t.tz;
      if (tx == null && t.target != null && t.target >= 0 && W.x) { tx = W.x[t.target]; tz = W.z[t.target]; }
      if (tx != null && Math.random() < gdt * 40) hose(t.x, y + 0.24, t.z, tx, tz);
    }
    if (frustum && !frustum.intersectsSphere(_sph)) continue;
    const flags = IDLE_TRUCK[t.state] ? 0 : VEH_FLAG.FLASH | VEH_FLAG.FIRE;
    putVehicle('fire', 5, t.x, y, t.z, t.yaw || 0, 0, 1, 1, 1, 1, flags);
  }
  let bytes = 0;
  for (const k of POOLS) {
    const p = T.pools[k];
    const m = p.mesh;
    m.count = p.n; m.visible = p.n > 0;
    if (p.n) { p.upload(0, p.n); bytes += p.n * 76; }
  }
  T.stats.cars = C.count; T.stats.visible = vis; T.stats.trucks = nt;
  T.stats.bytes = bytes;
  T.stats.ms = performance.now() - t0;
}

// After ambient.js pushed its boats: finalise the light buffer for this frame.
export function trafficCommitLights() {
  T.lightRef.n = nLights;
  T.lightGeo.instanceCount = nLights;
  T.lightMesh.visible = nLights > 0;
  if (nLights) {
    for (const a of [T.aV0, T.aV1]) { a.clearUpdateRanges(); a.addUpdateRange(0, nLights * 4); a.needsUpdate = true; }
    Pool.uploaded += nLights * 32;
    T.stats.bytes += nLights * 32;
  }
}

export function trafficSetFog(fog) {
  const u = T.lightMesh && T.lightMesh.material.uniforms;
  if (!u || !fog) return;
  u.fogColor.value.copy(fog.color); u.fogNear.value = fog.near; u.fogFar.value = fog.far;
}

export function trafficClear() {
  for (let i = 0; i < N; i++) if (C.alive[i]) freeCar(i);
  C.count = 0;
}

export function trafficStats() { return T.stats; }
export function trafficPools() { return T.pools; }

// warm-up: one instance of everything, far below the sea
export function trafficWarm() {
  for (const k of POOLS) { const p = T.pools[k]; p.n = 0; putVehicle(k, POOLS.indexOf(k), 0, -60, 0, 0, 0, 1, 1, 1, 1, 0); p.mesh.count = 1; p.mesh.visible = true; p.upload(0, 1); }
  nLights = 0; pushLight(0, -60, 0, 0, 0.2, 0.1, 0.05, VEH_FLAG.FLASH); trafficCommitLights();
}

// (testing) fill the network quickly: simulate n seconds without rendering
export function trafficPrewarm(seconds, step = 0.1) {
  for (let t = 0; t < seconds; t += step) trafficFrame(step, null, null);
}
