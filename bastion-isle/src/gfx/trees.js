import * as THREE from 'three';
import { Pool } from './pools.js';
import { U } from './uniforms.js';
import { W, T, isLand } from '../world.js';
import { DIR_X, DIR_Z } from '../hex.js';
import { mulberry32 } from '../rng.js';
import { Slots, GLSL_HASH, lotTreeSpots } from './buildings.js';

// Trees and rocks (SPEC.md 5.3, rendering review should_change 13, UX review concrete 8/10).
// Three procedural tree species (broadleaf 90 tris, conifer 34 tris, poplar 50 tris), craggy rock outcrops for
// mountain tiles (80 tris) and boulders (20 tris). One shared "nature" MeshStandardMaterial with vertex-shader
// wind sway; the customDepthMaterial runs the same sway so shadows move with the canopy. Per-instance hue/value
// jitter goes in instanceColor (canopy only: trunks keep their bark colour). Instances live in per-tile slot
// ranges like the buildings, so a lot or road change only rewrites the tiles it touches.

export const SPECIES = { BROAD: 0, CONIFER: 1, POPLAR: 2 };
const POOLS = ['broadleaf', 'conifer', 'poplar', 'crag', 'boulder'];
const POOL_MAX = [9000, 7000, 3000, 1200, 4000];
const TILE_MAX = 10;
const STRIDE = 19;

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
// canopy colours per species (sRGB tokens -> linear), jittered per instance: hue +-6 %, value +-8 %
const LEAF = [[0x55783A, 0x4E7034, 0x62803F, 0x5A7A33], [0x3B5A36, 0x355234, 0x41603A], [0x5E7F3A, 0x678A40, 0x587636]];
const TRUNK = lin(0x5C4632);
const ROCK = [lin(0x7F7C76), lin(0x75726C), lin(0x8A8780), lin(0x6C6964)];

// ------------------------------------------------------------------------------------------------ GLSL
const VERT_PARS = /* glsl */`
attribute vec2 aN;   // x: sway weight (0 trunk base .. 1 canopy top), y: material 0 bark, 1 leaves, 2 rock
uniform float uTime;
uniform vec2 uWind;
varying vec3 vNW;
varying float vMat;
`;
const PROJECT = /* glsl */`
vec4 mvPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
if (aN.x > 0.0) {
  vec2 ip = instanceMatrix[3].xz;
  float hs = length(instanceMatrix[1].xyz);
  float ph = uTime * 1.7 + dot(ip, vec2(0.37, 0.71));
  float g = sin(ph) * 0.7 + sin(ph * 2.3 + 1.3) * 0.3;
  vec2 wd = normalize(uWind + vec2(1e-4));
  mvPosition.xz += wd * (0.022 * g + 0.01) * aN.x * hs;
  mvPosition.xyz += vec3(0.5, 0.25, 0.5) * 0.006 * aN.x * hs * sin(uTime * 5.3 + position.y * 23.0 + ip.x * 3.0);
}
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`;

function patchMain(shader) {
  Object.assign(shader.uniforms, {
    uTime: U.uTime, uWind: U.uWind, uNight: U.uNight, uClay: U.uClay, uNightLight: U.uNightLight,
    uMapMin: U.uMapMin, uMapSize: U.uMapSize,
  });
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\n' + VERT_PARS)
    .replace('#include <color_vertex>', '#include <color_vertex>\n if (aN.y < 0.5) vColor = color; // bark ignores the canopy tint\n vMat = aN.y;')
    .replace('#include <project_vertex>', PROJECT)
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vNW = (instanceMatrix * vec4(transformed, 1.0)).xyz;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
varying vec3 vNW;
varying float vMat;
uniform float uNight, uClay, uMapSize;
uniform vec2 uMapMin;
uniform sampler2D uNightLight;
${GLSL_HASH}`)
    .replace('#include <color_fragment>', /* glsl */`
#include <color_fragment>
float nRough = 0.9;
if (vMat > 1.5) {
  // rock: strata and lichen
  float s1 = cNoise(vec2(vNW.y * 9.0, (vNW.x + vNW.z) * 2.0));
  float s2 = cNoise(vNW.xz * 7.0 + vNW.y * 3.0);
  diffuseColor.rgb *= (0.78 + 0.32 * s1) * (0.85 + 0.25 * s2);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22, 0.26, 0.14), smoothstep(0.72, 0.9, s2) * 0.35);
  nRough = 0.88;
} else if (vMat > 0.5) {
  // leaves: clumpy value noise breaks the flat canopy colour
  float l1 = cNoise(vNW.xz * 23.0 + vNW.y * 31.0);
  float l2 = cNoise(vNW.xz * 6.0 - vNW.y * 9.0);
  diffuseColor.rgb *= (0.72 + 0.4 * l1) * (0.88 + 0.22 * l2);
  nRough = 0.78;
} else {
  diffuseColor.rgb *= 0.8 + 0.3 * cNoise(vec2(vNW.y * 40.0, (vNW.x - vNW.z) * 60.0));
}
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.49, 0.45), uClay);
`)
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = nRough;')
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
 totalEmissiveRadiance += diffuseColor.rgb * texture2D(uNightLight, (vNW.xz - uMapMin) / uMapSize).rgb * 0.6;`);
}

function patchDepth(shader) {
  Object.assign(shader.uniforms, { uTime: U.uTime, uWind: U.uWind });
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute vec2 aN;\nuniform float uTime;\nuniform vec2 uWind;')
    .replace('#include <project_vertex>', PROJECT);
}

// ------------------------------------------------------------------------------------------------ geometry
class NB {
  constructor(seed) { this.p = []; this.n = []; this.c = []; this.a = []; this.rnd = mulberry32(seed); }
  // add a triangle list (flat arrays) with per-vertex normal, colour and aN
  push(pos, nrm, col, an) { this.p.push(...pos); this.n.push(...nrm); this.c.push(...col); this.a.push(...an); }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aN', new THREE.Float32BufferAttribute(this.a, 2));
    g.computeBoundingSphere();
    return g;
  }
}

// tapered prism trunk without caps (10 tris)
function trunk(b, r0, r1, h, seg = 5) {
  for (let s = 0; s < seg; s++) {
    const a0 = (s / seg) * Math.PI * 2, a1 = ((s + 1) / seg) * Math.PI * 2;
    const v = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
    const A = v(a0, r0, 0), B = v(a1, r0, 0), C = v(a1, r1, h), D = v(a0, r1, h);
    const nA = [Math.cos(a0), 0.15, Math.sin(a0)], nB = [Math.cos(a1), 0.15, Math.sin(a1)];
    const sw = (y) => [Math.pow(y, 2) * 0.25, 0];
    b.push([...A, ...C, ...B, ...A, ...D, ...C], [...nA, ...nB, ...nB, ...nA, ...nA, ...nB],
      [...TRUNK, ...TRUNK, ...TRUNK, ...TRUNK, ...TRUNK, ...TRUNK], [...sw(0), ...sw(h), ...sw(0), ...sw(0), ...sw(h), ...sw(h)]);
  }
}

// lumpy blob from an icosahedron; normals blend the face normal with the direction from the canopy centre
function blob(b, cx, cy, cz, rx, ry, rz, detail, ccx, ccy, ccz, jit = 0.14, aoLow = 0.55) {
  const ico = new THREE.IcosahedronGeometry(1, detail);
  const pos = ico.attributes.position;
  // jitter shared vertices consistently
  const key = (x, y, z) => `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
  const jm = new Map();
  const P = [];
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k), kk = key(x, y, z);
    if (!jm.has(kk)) jm.set(kk, 1 + (b.rnd() * 2 - 1) * jit);
    const f = jm.get(kk);
    P.push([cx + x * rx * f, cy + y * ry * f, cz + z * rz * f]);
  }
  for (let k = 0; k < P.length; k += 3) {
    const t = [P[k], P[k + 1], P[k + 2]];
    const ux = t[1][0] - t[0][0], uy = t[1][1] - t[0][1], uz = t[1][2] - t[0][2];
    const vx = t[2][0] - t[0][0], vy = t[2][1] - t[0][1], vz = t[2][2] - t[0][2];
    let fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
    for (const p of t) {
      let dx = p[0] - ccx, dy = (p[1] - ccy) * 0.8, dz = p[2] - ccz;
      const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      let nx = dx * 0.7 + fx * 0.3, ny = dy * 0.7 + fy * 0.3 + 0.15, nz = dz * 0.7 + fz * 0.3;
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      // AO: darker underneath and toward the inside of the canopy
      const up = Math.max(0, Math.min(1, (p[1] - (cy - ry)) / (2 * ry)));
      const ao = aoLow + (1 - aoLow) * Math.pow(up, 0.8);
      b.push(p, [nx, ny, nz], [ao, ao, ao], [Math.min(1, Math.pow(Math.max(0, p[1]), 2) * 1.2), 1]);
    }
  }
  ico.dispose();
}

function cone(b, y0, r, h, seg, ccy) {
  const off = b.rnd() * Math.PI;
  for (let s = 0; s < seg; s++) {
    const a0 = off + (s / seg) * Math.PI * 2, a1 = off + ((s + 1) / seg) * Math.PI * 2;
    const j0 = 1 + (b.rnd() - 0.5) * 0.18, j1 = 1;
    const A = [Math.cos(a0) * r * j0, y0 - 0.02, Math.sin(a0) * r * j0], B = [Math.cos(a1) * r * j1, y0 - 0.02 + (b.rnd() - 0.5) * 0.03, Math.sin(a1) * r * j1], C = [0, y0 + h, 0];
    const sl = r / h;
    const nA = [Math.cos(a0), sl, Math.sin(a0)], nB = [Math.cos(a1), sl, Math.sin(a1)], nC = [Math.cos((a0 + a1) / 2), sl, Math.sin((a0 + a1) / 2)];
    for (const n of [nA, nB, nC]) { const l = Math.hypot(...n); n[0] /= l; n[1] /= l; n[2] /= l; }
    const sw = (p) => [Math.min(1, Math.pow(Math.max(0, p[1]), 2) * 1.2), 1];
    const aoB = 0.55, aoT = 1.0;
    b.push([...A, ...C, ...B], [...nA, ...nC, ...nB], [aoB, aoB, aoB, aoT, aoT, aoT, aoB, aoB, aoB], [...sw(A), ...sw(C), ...sw(B)]);
  }
}

function geoBroadleaf() {
  const b = new NB(11);
  trunk(b, 0.04, 0.024, 0.46);
  const cc = [0, 0.62, 0];
  blob(b, 0, 0.66, 0, 0.3, 0.26, 0.3, 0, ...cc);
  blob(b, 0.15, 0.53, 0.08, 0.22, 0.19, 0.22, 0, ...cc);
  blob(b, -0.13, 0.55, -0.09, 0.22, 0.2, 0.21, 0, ...cc);
  blob(b, 0.02, 0.82, -0.04, 0.19, 0.17, 0.19, 0, ...cc);
  return b.geo();
}
function geoConifer() {
  const b = new NB(23);
  trunk(b, 0.032, 0.02, 0.3);
  cone(b, 0.12, 0.27, 0.44, 8, 0.5);
  cone(b, 0.36, 0.21, 0.38, 8, 0.6);
  cone(b, 0.58, 0.14, 0.42, 7, 0.8);
  return b.geo();
}
function geoPoplar() {
  const b = new NB(37);
  trunk(b, 0.028, 0.018, 0.36);
  const cc = [0, 0.66, 0];
  blob(b, 0, 0.58, 0, 0.16, 0.3, 0.16, 0, ...cc, 0.1);
  blob(b, 0.01, 0.84, 0.01, 0.12, 0.18, 0.12, 0, ...cc, 0.1);
  return b.geo();
}

// craggy rock: displaced icosahedron, flat-shaded, base embedded below y = 0 (boulders)
function geoRock(detail, seed, sy = 1.0, spike = 0.35) {
  const b = new NB(seed);
  const ico = new THREE.IcosahedronGeometry(0.5, detail);
  const pos = ico.attributes.position;
  const rnd = mulberry32(seed * 7 + 1);
  const planes = [];
  for (let k = 0; k < 7; k++) {
    const t = rnd() * Math.PI * 2, u = rnd() * 0.9 - 0.2;
    planes.push([Math.cos(t) * Math.sqrt(1 - u * u), u, Math.sin(t) * Math.sqrt(1 - u * u), 0.32 + rnd() * 0.12]);
  }
  const cache = new Map();
  const disp = (x, y, z) => {
    const kk = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (cache.has(kk)) return cache.get(kk);
    let px = x, py = y * sy, pz = z;
    for (const [nx, ny, nz, d] of planes) {
      const dist = px * nx + py * ny + pz * nz - d * (py > 0 ? 1.0 + spike * py : 1);
      if (dist > 0) { px -= nx * dist; py -= ny * dist; pz -= nz * dist; }
    }
    const f = 1 + (rnd() - 0.5) * 0.16;
    px *= f; pz *= f;
    if (py < -0.18) py = -0.18 - (py + 0.18) * 0.1;
    const v = [px, py + 0.18, pz];
    cache.set(kk, v);
    return v;
  };
  const top = 0.5 * sy + 0.18;
  for (let k = 0; k < pos.count; k += 3) {
    const t = [0, 1, 2].map((q) => disp(pos.getX(k + q), pos.getY(k + q), pos.getZ(k + q)));
    flatTri(b, t[0], t[1], t[2], top);
  }
  ico.dispose();
  return b.geo();
}
function flatTri(b, p0, p1, p2, top) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2];
  const vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  for (const p of [p0, p1, p2]) {
    const h = Math.max(0, Math.min(1, p[1] / top));
    const shade = (0.55 + 0.45 * h) * (ny > 0.55 ? 1.12 : 1);
    b.push(p, [nx, ny, nz], [shade, shade, shade], [0, 2]);
  }
}
// craggy outcrop: a cluster of tapered, slant-topped shards (jointed limestone / basalt look); top at y = 1
function geoCrag(seed) {
  const b = new NB(seed);
  const rnd = mulberry32(seed);
  const shards = [[0, 0, 0.26, 1.0], [0.24, 0.1, 0.18, 0.66], [-0.2, 0.17, 0.19, 0.74], [0.06, -0.25, 0.2, 0.58], [-0.22, -0.16, 0.15, 0.46], [0.3, -0.18, 0.13, 0.4]];
  for (const [cx, cz, r, h] of shards) {
    const n = 5 + (rnd() < 0.5 ? 1 : 0), a0 = rnd() * 6.28;
    const tdx = rnd() - 0.5, tdz = rnd() - 0.5, slope = 0.25 + rnd() * 0.35;
    const lean = [(rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12];
    const base = [], topv = [];
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * Math.PI * 2 + (rnd() - 0.5) * 0.4, rk = r * (0.8 + rnd() * 0.4);
      const x = Math.cos(a) * rk, z = Math.sin(a) * rk;
      base.push([cx + x * 1.1, -0.3, cz + z * 1.1]);
      const tx = x * (0.55 + rnd() * 0.25), tz = z * (0.55 + rnd() * 0.25);
      topv.push([cx + tx + lean[0] * h, h + (tx * tdx + tz * tdz) * slope * 2 - rnd() * 0.06 * h, cz + tz + lean[1] * h]);
    }
    let tcx = 0, tcy = 0, tcz = 0;
    for (const t of topv) { tcx += t[0] / n; tcy += t[1] / n; tcz += t[2] / n; }
    for (let k = 0; k < n; k++) {
      const k1 = (k + 1) % n;
      // side quad (two triangles), outward winding
      flatTri(b, base[k], topv[k1], base[k1], 1);
      flatTri(b, base[k], topv[k], topv[k1], 1);
      flatTri(b, [tcx, tcy + 0.02, tcz], topv[k1], topv[k], 1);
    }
  }
  return b.geo();
}

// ------------------------------------------------------------------------------------------------ module
const TR = { scene: null, pools: [], slots: [], stage: [], stageN: [], mat: null, depth: null, stats: { full: 0, patch: 0 } };

export function initTrees(scene) {
  if (TR.scene) return TR;
  TR.scene = scene;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  mat.onBeforeCompile = patchMain;
  mat.customProgramCacheKey = () => 'bastion-nature-v1';
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = patchDepth;
  depth.customProgramCacheKey = () => 'bastion-nature-depth-v1';
  TR.mat = mat; TR.depth = depth;
  const geos = [geoBroadleaf(), geoConifer(), geoPoplar(), geoCrag(5), geoRock(0, 9, 0.8, 0.2)];
  geos.forEach((g, k) => {
    const pool = new Pool(g, mat, POOL_MAX[k], { cast: true, receive: true, order: 2 });
    pool.mesh.customDepthMaterial = depth;
    pool.mesh.name = 'nature-' + POOLS[k];
    pool.mesh.count = 0;
    pool.mesh.visible = true;
    pool.mArr.fill(0);
    pool.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    pool.mesh.instanceColor.setUsage(THREE.StaticDrawUsage);
    TR.pools.push(pool);
    TR.slots.push(new Slots(pool, []));
    TR.stage.push(new Float32Array(TILE_MAX * STRIDE));
    TR.stageN.push(0);
    scene.add(pool.mesh);
  });
  return TR;
}

export function resetTrees() { for (const s of TR.slots) s.reset(W.count); }

// --- per-tile generation ----------------------------------------------------------------------------------------
let rs = 1;
function rnd() {
  rs = (rs + 0x6D2B79F5) | 0;
  let t = rs;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (a, b) => a + (b - a) * rnd();

function put(pid, x, y, z, yaw, sx, sy, sz, col, tilt = 0) {
  const n = TR.stageN[pid];
  if ((n + 1) * STRIDE > TR.stage[pid].length) return;
  const a = TR.stage[pid], o = n * STRIDE, c = Math.cos(yaw), s = Math.sin(yaw);
  if (!tilt) {
    a[o] = c * sx; a[o + 1] = 0; a[o + 2] = -s * sx; a[o + 3] = 0;
    a[o + 4] = 0; a[o + 5] = sy; a[o + 6] = 0; a[o + 7] = 0;
    a[o + 8] = s * sz; a[o + 9] = 0; a[o + 10] = c * sz; a[o + 11] = 0;
  } else {
    // small lean about the local x axis after the yaw
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    a[o] = c * sx; a[o + 1] = 0; a[o + 2] = -s * sx; a[o + 3] = 0;
    a[o + 4] = s * st * sy; a[o + 5] = ct * sy; a[o + 6] = c * st * sy; a[o + 7] = 0;
    a[o + 8] = s * ct * sz; a[o + 9] = -st * sz; a[o + 10] = c * ct * sz; a[o + 11] = 0;
  }
  a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
  a[o + 16] = col[0]; a[o + 17] = col[1]; a[o + 18] = col[2];
  TR.stageN[pid] = n + 1;
}

const _c = new THREE.Color(), _hsl = { h: 0, s: 0, l: 0 };
const _col = [0, 0, 0];
function leafColour(species) {
  const pal = LEAF[species];
  _c.setHex(pal[Math.floor(rnd() * pal.length)]);
  _c.getHSL(_hsl);
  _c.setHSL(_hsl.h + (rnd() * 2 - 1) * 0.06 * 0.25, _hsl.s * (0.92 + rnd() * 0.16), _hsl.l * (0.92 + rnd() * 0.16));
  _col[0] = _c.r; _col[1] = _c.g; _col[2] = _c.b;
  return _col;
}
function tree(species, x, y, z, h) {
  const w = h * rr(0.85, 1.15);
  put(species, x, y - 0.01, z, rnd() * Math.PI * 2, w, h, w * rr(0.9, 1.1), leafColour(species), rr(-0.05, 0.05));
}
function rockCol(k = 0.08) {
  const b = ROCK[Math.floor(rnd() * ROCK.length)], f = 1 + (rnd() * 2 - 1) * k;
  _col[0] = b[0] * f; _col[1] = b[1] * f; _col[2] = b[2] * f;
  return _col;
}

const _nearRoad = new Float32Array(12);
// local points inside the hex that keep clear of road edges
function spot(i, rMin, rMax, clear = 0.42) {
  for (let t = 0; t < 6; t++) {
    const a = rnd() * Math.PI * 2, r = rMin + (rMax - rMin) * Math.sqrt(rnd());
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    let ok = true;
    for (let d = 0; d < 6; d++) {
      if (!_nearRoad[d]) continue;
      if (x * DIR_X[d] + z * DIR_Z[d] > clear) { ok = false; break; }
    }
    // stay inside the hex (apothem 0.866)
    for (let d = 0; d < 6 && ok; d++) if (x * DIR_X[d] + z * DIR_Z[d] > 0.8) ok = false;
    if (ok) return [W.x[i] + x, W.z[i] + z];
  }
  return null;
}

function genTile(i) {
  for (let p = 0; p < TR.stageN.length; p++) TR.stageN[p] = 0;
  const t = W.type[i];
  if (!isLand(t)) return;
  rs = (i * 2246822519 ^ (W.seed | 0) * 3266489917) | 0;
  rnd();
  const y = W.h[i];
  const lots = lotTreeSpots();
  const isLotT = W.zone[i] > 0 && (W.lvl[i] > 0 || (W.flags[i] & 64));
  if (isLotT) {
    // trees chosen by the lot generator (gardens, courtyards, street trees)
    const n = lots.n ? lots.n[i] : 0;
    for (let k = 0; k < n; k++) {
      const o = (i * lots.max + k) * 5;
      tree(lots.buf[o + 3] | 0, lots.buf[o], lots.buf[o + 1], lots.buf[o + 2], lots.buf[o + 4]);
    }
    return;
  }
  if (W.road[i] || W.bld[i] || W.ruin[i] || i === W.center) return;
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; _nearRoad[d] = j >= 0 && W.road[j] ? 1 : 0; }
  const h0 = rnd();
  if (t === T.FOREST) {
    // mixed stands: a slow noise decides conifer vs broadleaf so species form patches
    const pc = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(W.x[i] * 0.21 + W.seed) * Math.cos(W.z[i] * 0.17 - W.seed * 0.3));
    const n = 4 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const p = spot(i, 0.05, 0.75);
      if (!p) continue;
      const sp = rnd() < pc ? 1 : rnd() < 0.85 ? 0 : 2;
      tree(sp, p[0], y, p[1], sp === 1 ? rr(0.55, 0.85) : rr(0.45, 0.72));
    }
    // understorey shrub
    if (rnd() < 0.5) { const p = spot(i, 0.2, 0.75); if (p) tree(0, p[0], y, p[1], rr(0.18, 0.26)); }
  } else if (t === T.GRASS) {
    if (h0 < 0.13) {
      const n = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) { const p = spot(i, 0.1, 0.72); if (p) tree(rnd() < 0.75 ? 0 : 2, p[0], y, p[1], rr(0.38, 0.62)); }
    } else if (h0 < 0.3) {
      const p = spot(i, 0.1, 0.72); if (p) tree(0, p[0], y, p[1], rr(0.18, 0.28));
    }
  } else if (t === T.HILLS) {
    const nb = Math.floor(rnd() * 3);
    for (let k = 0; k < nb; k++) {
      const p = spot(i, 0.0, 0.72); if (!p) continue;
      const s = rr(0.1, 0.24);
      put(4, p[0], y - 0.03, p[1], rnd() * 6.28, s * rr(0.9, 1.4), s * rr(0.6, 1.0), s, rockCol(), rr(-0.15, 0.15));
    }
    if (h0 < 0.4) {
      const n = 1 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) { const p = spot(i, 0.1, 0.7); if (p) tree(1, p[0], y, p[1], rr(0.5, 0.75)); }
    }
  } else if (t === T.MOUNTAIN) {
    // a central outcrop on the top plus smaller edge crags that break the hex silhouette; total height <= 3.5u
    const room = Math.max(0.25, 3.5 - y);
    const hc = Math.min(room, rr(0.45, 0.95));
    put(3, W.x[i] + rr(-0.12, 0.12), y - 0.02, W.z[i] + rr(-0.12, 0.12), rnd() * 6.28, rr(1.0, 1.35), hc, rr(1.0, 1.35), rockCol(), rr(-0.06, 0.06));
    const ne = 2 + Math.floor(rnd() * 2);
    const a0 = rnd() * 6.28;
    for (let k = 0; k < ne; k++) {
      const a = a0 + (k / ne) * 6.28 + rr(-0.4, 0.4), r = rr(0.6, 0.82);
      const he = Math.min(room + 0.3, rr(0.35, 0.7));
      put(3, W.x[i] + Math.cos(a) * r, y - he * 0.5, W.z[i] + Math.sin(a) * r, rnd() * 6.28, rr(0.55, 0.8), he, rr(0.55, 0.8), rockCol(), rr(-0.15, 0.15));
    }
    if (rnd() < 0.6) { const p = spot(i, 0.4, 0.8); if (p) put(4, p[0], y - 0.03, p[1], rnd() * 6.28, rr(0.15, 0.3), rr(0.1, 0.2), rr(0.15, 0.3), rockCol(), 0.1); }
    if (rnd() < 0.35) { const p = spot(i, 0.55, 0.8); if (p) tree(1, p[0], y, p[1], rr(0.45, 0.65)); }
  } else if (t === T.SAND) {
    if (h0 < 0.06) { const p = spot(i, 0.1, 0.7); if (p) { const s = rr(0.1, 0.22); put(4, p[0], y - 0.03, p[1], rnd() * 6.28, s * 1.3, s * 0.7, s, rockCol(0.05)); } }
  }
}

// Rebuild trees on the given tiles (iterable) or everywhere (null)
export function buildTrees(tiles) {
  if (!TR.scene || !W.count) return 0;
  if (TR.slots[0].start.length !== W.count) { resetTrees(); tiles = null; }
  if (tiles == null) {
    resetTrees();
    for (let i = 0; i < W.count; i++) writeTile(i);
    TR.stats.full++;
  } else {
    for (const i of tiles) writeTile(i);
    TR.stats.patch++;
    if (TR.slots.some((s) => s.fragmented())) return buildTrees(null);
  }
  let bytes = 0;
  for (const s of TR.slots) bytes += s.commit();
  return bytes;
}
function writeTile(i) {
  genTile(i);
  for (let p = 0; p < TR.slots.length; p++) {
    const s = TR.slots[p];
    if (TR.stageN[p] === 0 && s.cap[i] === 0) continue;
    s.write(i, TR.stage[p], TR.stageN[p]);
  }
}

export function treeStats() {
  return TR.pools.map((p, k) => ({ name: p.mesh.name, count: p.mesh.count, live: TR.slots[k].live, max: p.max, overflow: TR.slots[k].overflow, tris: p.mesh.count * (p.mesh.geometry.attributes.position.count / 3) }));
}
export function treeMeshes() { return TR.pools.map((p) => p.mesh); }
