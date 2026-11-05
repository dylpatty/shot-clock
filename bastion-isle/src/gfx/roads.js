import * as THREE from 'three';
import { W, isLand, tileAt } from '../world.js';
import { U } from './uniforms.js';
import { Pool } from './pools.js';
import { GU, OVERLAY_GLSL, overlayUniforms } from './overlay.js';
import { patchCloudLight } from './terrain.js';

// Streets (UX review must-3): asphalt ribbon 0.52u with a dashed centre line, 0.10u sidewalks behind a raised
// curb, junction pads where 3+ spokes meet, zebra crossings on junction approaches, ramps with retaining walls
// between tiles of different height, and lamp posts every ~0.87u on alternating sides.
//
// Geometry: ONE merged BufferGeometry with a fixed block of vertices per road tile ("slot"). A road tile's
// block holds a flat hexagon at the tile height plus up to six ramp quads with side walls. The street layout
// itself is an analytic signed-distance field evaluated in the fragment shader from the tile's 6-bit spoke mask,
// so markings, curbs and crosswalks stay crisp at every zoom and cost no geometry. Editing a road rewrites only
// the slots of that tile and its neighbours (a few KB through addUpdateRange): dragging roads never hitches.

const VPS = 78;            // vertices per slot: hex 6 + 6 spokes x (ramp 4 + 2 walls x 4)
const IPS = 12 + 6 * 18;   // indices per slot
const HALF = 0.36;         // half width incl. sidewalk (asphalt 0.26 + curb 0.02 + walk 0.08)
const RAMP_T0 = 0.22;      // ramps start this far from the lower tile's centre
const Y_OFS = 0.004;
const SDIR = [[1, 0], [0.5, -0.8660254], [-0.5, -0.8660254], [-1, 0], [-0.5, 0.8660254], [0.5, 0.8660254]];

const C = (h) => new THREE.Color(h);
export const RPAL = {
  asphalt: C(0x3a3d41), mark: C(0xe6e2d6), yellow: C(0xd6ae3a), walk: C(0xb4b0a8), curb: C(0xc2beb4),
  wall: C(0x9f9b92), clayRoad: C(0x7d7b77), clayWalk: C(0xb3b1ab),
};

// ------------------------------------------------------------------------------------------------ material
const VERT_PARS = /* glsl */`
attribute vec4 aRoad;   // hex-local x, z (relative to the owning tile centre), spoke mask, tile index
varying vec2 vLocal;
flat varying vec2 vInfo;
varying vec3 vWPos;
`;
const VERT_MAIN = /* glsl */`
vLocal = aRoad.xy; vInfo = aRoad.zw;
vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

const FRAG_PARS = /* glsl */`
uniform sampler2D uDetail, uDetail2, uDetail3, uNightLight;
uniform vec2 uCloudOfs;
uniform float uCloudStrength;
uniform vec3 cAsphalt, cMark, cWalk, cCurb, cWall, cClayRoad, cClayWalk;
varying vec2 vLocal;
flat varying vec2 vInfo;
varying vec3 vWPos;
float gRough = 0.9;
float gCloud = 1.0;
float gAO = 1.0;
vec3 gEmi = vec3(0.0);
vec3 gBend = vec3(0.0);
${OVERLAY_GLSL}
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
const vec2 SPK[6] = vec2[6](vec2(1.0, 0.0), vec2(0.5, -0.8660254), vec2(-0.5, -0.8660254), vec2(-1.0, 0.0), vec2(-0.5, 0.8660254), vec2(0.5, 0.8660254));
`;

const FRAG_MAIN = /* glsl */`
{
  vec2 p = vLocal;
  vec3 wp = vWPos;
  vec2 w = wp.xz;
  vec2 muv = (w - uMapMin) / uMapSize;
  int mask = int(vInfo.x + 0.5);
  vec3 gn = normalize(cross(dFdx(wp), dFdy(wp)));
  bool wall = abs(gn.y) < 0.5;
  // ---- street signed distance: union of capsules along the spokes, filleted corners, junction pad
  float dm = 1e3, best = 1e3;
  vec2 bts = vec2(0.0), bdir = vec2(1.0, 0.0);
  int n = 0;
  for (int d = 0; d < 6; d++) {
    if (((mask >> d) & 1) == 0) continue;
    n++;
    vec2 dir = SPK[d];
    float t = dot(p, dir), s = dot(p, vec2(-dir.y, dir.x));
    float tc = clamp(t, 0.0, 1.3);
    float dist = length(vec2(t - tc, s));
    dm = smin(dm, dist, 0.16);
    if (dist < best) { best = dist; bts = vec2(t, s); bdir = dir; }
  }
  if (n == 0) { dm = length(p); best = dm; bts = vec2(dm, 0.0); bdir = dm > 1e-4 ? p / dm : vec2(1.0, 0.0); }
  if (n >= 3) dm = smin(dm, length(p) - 0.11, 0.1);
  float fw = max(fwidth(dm), 1e-4);
  if (!wall && dm > ${HALF.toFixed(3)} + 0.5 * fw) discard;
  vec2 grad = best > 1e-4 ? (p - bdir * clamp(bts.x, 0.0, 1.3)) / best : vec2(0.0);
  if (n >= 3 && length(p) < 0.25) grad = normalize(p + 1e-4);

  vec4 d1 = texture(uDetail, w * 0.25);
  vec4 d2 = texture(uDetail2, w * 0.5);
  float mac = texture(uDetail2, w * 0.061 + vec2(0.7, 0.2)).a;
  vec3 col; float rough;
  if (wall) {
    // ramp side walls: concrete with panel joints
    float u = dot(w, normalize(vec2(-gn.z, gn.x) + 1e-5));
    float jx = abs(fract(u / 0.3) - 0.5) * 0.3;
    col = cWall * mix(1.0, d1.b * 2.0, 0.6) * (1.0 - (1.0 - smoothstep(0.003, 0.007, jx)) * 0.3);
    rough = 0.85;
  } else {
    float asph = 1.0 - smoothstep(0.26 - 0.5 * fw, 0.26 + 0.5 * fw, dm);
    float curbT = smoothstep(0.26 - 0.5 * fw, 0.26 + 0.5 * fw, dm) * (1.0 - smoothstep(0.282 - 0.5 * fw, 0.282 + 0.5 * fw, dm));
    float walkT = smoothstep(0.282 - 0.5 * fw, 0.282 + 0.5 * fw, dm);
    // asphalt: photo detail, repair patches, darker polished wheel tracks, gutter shade
    float s = bts.y, t = bts.x;
    float patchN = smoothstep(0.55, 0.6, texture(uDetail2, w * 0.17 + vec2(0.11, 0.53)).a);
    vec3 ac = cAsphalt * 1.9 * mix(1.0, d2.r * 2.0, 1.0) * (0.93 + 0.14 * mac) * (1.0 - 0.07 * patchN);
    float track = 1.0 - smoothstep(0.02, 0.045, abs(abs(s) - 0.13) - 0.055);
    ac *= 1.0 - 0.07 * track * step(float(n), 2.5);
    ac *= 1.0 - 0.25 * smoothstep(0.2, 0.26, dm);
    // markings
    float mk = 0.0;
    float u = 0.8660254 - t;  // distance from the tile edge: dashes line up across tiles
    float tStart = n >= 3 ? 0.6 : (n == 1 ? 0.2 : -1.0);
    float lineW = 0.0085 + 0.5 * fw;
    if (t > tStart) {
      float f = fract(u / 0.5 + 0.25);
      float aa = fw / 0.5;
      float dash = smoothstep(0.0, aa, f) * (1.0 - smoothstep(0.5 - aa, 0.5, f));
      mk = max(mk, (1.0 - smoothstep(lineW - fw, lineW, abs(s))) * dash);
    }
    if (n >= 3 && t > 0.36 && t < 0.5) {      // zebra crossing on each approach
      float z = abs(fract(s / 0.062) - 0.5);
      float bar = smoothstep(0.25 - fw / 0.062, 0.25, z) * (1.0 - smoothstep(0.235 - fw, 0.235, abs(s)));
      float ends = smoothstep(0.36, 0.36 + fw, t) * (1.0 - smoothstep(0.5 - fw, 0.5, t));
      mk = max(mk, bar * ends);
    }
    if (n >= 3 && t > 0.53 && t < 0.548 && s < 0.0 && s > -0.25) mk = max(mk, 0.9);  // stop line, right-hand traffic
    mk *= asph * (0.8 + 0.2 * d2.r * 2.0);
    vec3 roadCol = mix(ac, cMark * (0.9 + 0.1 * d1.b * 2.0), mk);
    // sidewalk slabs + curb
    float ws = dm - 0.282;
    float slab = texture(uDetail3, w * 2.0).r * 2.0;
    vec3 wc = cWalk * mix(1.0, slab, 0.9) * mix(1.0, d1.b * 2.0, 0.25) * (0.95 + 0.1 * mac);
    wc *= 1.0 - 0.4 * smoothstep(0.066, 0.078, ws);
    vec3 cc = cCurb * mix(1.0, d1.b * 2.0, 0.4);
    col = roadCol * asph + cc * curbT + wc * walkT;
    rough = mix(mix(0.9, 0.62, mk), 0.82, 1.0 - asph);
    col = mix(col, mix(cClayRoad, cClayWalk, 1.0 - asph), uClay);
    // fake bevel: the curb face catches light, the gutter is shaded
    float face = smoothstep(0.255, 0.268, dm) * (1.0 - smoothstep(0.268, 0.282, dm));
    gBend = vec3(-grad.x, 0.0, -grad.y) * face * 1.4 + vec3(grad.x, 0.0, grad.y) * 0.25 * (1.0 - smoothstep(0.282, 0.295, dm)) * step(0.27, dm);
    gAO = 1.0 - 0.3 * smoothstep(0.215, 0.26, dm) * asph;
  }
  vec3 emi = vec3(0.0);
  float px = max(length(dFdx(w)), length(dFdy(w)));
  bgOverlays(w, vInfo.y, p, px, 1.0, col, emi);
  emi += col * texture(uNightLight, muv).rgb;
  gEmi = emi;
  gRough = rough;
  gCloud = 1.0 - uCloudStrength * smoothstep(0.4, 0.72, texture(uDetail2, (w + uCloudOfs) * 0.019 + vec2(0.13, 0.29)).a);
  diffuseColor.rgb = col;
}
`;

function makeRoadMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.9, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  });
  const uni = {
    ...overlayUniforms(), uDetail: GU.uDetail, uDetail2: GU.uDetail2, uDetail3: GU.uDetail3, uNightLight: U.uNightLight,
    uCloudOfs: U.uCloudOfs, uCloudStrength: U.uCloudStrength,
    cAsphalt: { value: RPAL.asphalt }, cMark: { value: RPAL.mark }, cWalk: { value: RPAL.walk }, cCurb: { value: RPAL.curb },
    cWall: { value: RPAL.wall }, cClayRoad: { value: RPAL.clayRoad }, cClayWalk: { value: RPAL.clayWalk },
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_MAIN);
    const fs = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('#include <map_fragment>', FRAG_MAIN)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = gRough;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(normal + (viewMatrix * vec4(gBend, 0.0)).xyz);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gEmi;')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.indirectDiffuse *= gAO; reflectedLight.directDiffuse *= mix(1.0, gAO, 0.5);');
    sh.fragmentShader = patchCloudLight(fs);
  };
  mat.customProgramCacheKey = () => 'bastion-ground-roads-v1';
  return mat;
}

// ------------------------------------------------------------------------------------------------ lamps
// 0.5u (6 m) pole with an arm over the road; the lens is emissive at night (HDR, so bloom catches it)
function lampGeometry() {
  const parts = [];
  const add = (g, col, glow) => {
    const n = g.attributes.position.count;
    const c = new THREE.Color(col);
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3).map((_, i) => [c.r, c.g, c.b][i % 3]), 3));
    g.setAttribute('aGlow', new THREE.Float32BufferAttribute(new Float32Array(n).fill(glow), 1));
    if (g.index) g = g.toNonIndexed();
    parts.push(g);
  };
  add(new THREE.CylinderGeometry(0.009, 0.013, 0.49, 6, 1, true).translate(0, 0.245, 0), 0x4a4f55, 0);
  add(new THREE.CylinderGeometry(0.02, 0.022, 0.03, 6, 1).translate(0, 0.015, 0), 0x55595e, 0);
  add(new THREE.BoxGeometry(0.115, 0.01, 0.012).translate(0.055, 0.485, 0), 0x4a4f55, 0);
  add(new THREE.BoxGeometry(0.07, 0.016, 0.034).translate(0.12, 0.482, 0), 0x3c4046, 0);
  const lens = new THREE.PlaneGeometry(0.062, 0.028).rotateX(Math.PI / 2).translate(0.12, 0.4735, 0);
  add(lens, 0xe8e4da, 1);
  const merged = mergeGeos(parts);
  merged.computeBoundingSphere();
  return merged;
}
function mergeGeos(list) {
  const names = ['position', 'normal', 'color', 'aGlow'];
  const out = new THREE.BufferGeometry();
  for (const nm of names) {
    const size = list[0].attributes[nm].itemSize;
    const total = list.reduce((s, g) => s + g.attributes[nm].count, 0);
    const arr = new Float32Array(total * size);
    let o = 0;
    for (const g of list) { arr.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; }
    out.setAttribute(nm, new THREE.BufferAttribute(arr, size));
  }
  return out;
}
function makeLampMaterial() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.5 });
  const uni = { uNight: U.uNight, uClay: U.uClay };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;\nuniform float uNight, uClay;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.69, 0.68, 0.65), uClay);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlow * vec3(1.0, 0.68, 0.36) * 7.0 * uNight * (1.0 - uClay);');
  };
  mat.customProgramCacheKey = () => 'bastion-ground-lamps-v1';
  return mat;
}

// ------------------------------------------------------------------------------------------------ state
export const RD = {
  mesh: null, geo: null, pos: null, nrm: null, info: null, maxSlots: 0, slotOf: null, used: null, top: 0,
  cacheRoad: null, cacheH: null, lamps: null, lampPos: new Float32Array(0), lampCount: 0, lampVersion: 0,
};

export function createRoads(scene) {
  RD.mesh = new THREE.Mesh(new THREE.BufferGeometry(), makeRoadMaterial());
  RD.mesh.frustumCulled = false;
  RD.mesh.receiveShadow = true;
  RD.mesh.castShadow = false;
  RD.mesh.renderOrder = -1; // ground layer; before the terrain so early-z skips the terrain under streets
  RD.mesh.name = 'ground-roads';
  scene.add(RD.mesh);
  const lamps = new Pool(lampGeometry(), makeLampMaterial(), 6000, { colors: false, order: 2, cast: true, receive: true });
  lamps.mesh.name = 'ground-lamps';
  scene.add(lamps.mesh);
  RD.lamps = lamps;
}

function allocGeometry(maxSlots) {
  const g = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(maxSlots * VPS * 3), 3);
  const nrm = new THREE.BufferAttribute(new Float32Array(maxSlots * VPS * 3), 3);
  const info = new THREE.BufferAttribute(new Float32Array(maxSlots * VPS * 4), 4);
  for (const a of [pos, nrm, info]) a.setUsage(THREE.DynamicDrawUsage);
  const idx = new Uint32Array(maxSlots * IPS);
  for (let s = 0; s < maxSlots; s++) {
    const b = s * VPS; let o = s * IPS;
    for (let k = 1; k < 5; k++) { idx[o++] = b; idx[o++] = b + k + 1; idx[o++] = b + k; }
    for (let d = 0; d < 6; d++) {
      const q = b + 6 + d * 12;
      for (let part = 0; part < 3; part++) {
        const v = q + part * 4;
        idx[o++] = v; idx[o++] = v + 1; idx[o++] = v + 2; idx[o++] = v; idx[o++] = v + 2; idx[o++] = v + 3;
      }
    }
  }
  g.setAttribute('position', pos); g.setAttribute('normal', nrm); g.setAttribute('aRoad', info);
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  g.setDrawRange(0, 0);
  if (RD.geo) RD.geo.dispose();
  RD.mesh.geometry = g;
  Object.assign(RD, { geo: g, pos, nrm, info, maxSlots, used: new Uint8Array(maxSlots), top: 0 });
}

function allocSlot() {
  for (let s = 0; s < RD.maxSlots; s++) if (!RD.used[s]) { RD.used[s] = 1; if (s + 1 > RD.top) RD.top = s + 1; return s; }
  return -1;
}
function freeSlot(s) {
  RD.used[s] = 0;
  clearSlot(s);
  while (RD.top > 0 && !RD.used[RD.top - 1]) RD.top--;
}
function clearSlot(s) {
  RD.pos.array.fill(0, s * VPS * 3, (s + 1) * VPS * 3);
  RD.nrm.array.fill(0, s * VPS * 3, (s + 1) * VPS * 3);
  RD.info.array.fill(0, s * VPS * 4, (s + 1) * VPS * 4);
  markSlot(s);
}
function markSlot(s) {
  RD.pos.addUpdateRange(s * VPS * 3, VPS * 3); RD.nrm.addUpdateRange(s * VPS * 3, VPS * 3); RD.info.addUpdateRange(s * VPS * 4, VPS * 4);
  RD.pos.needsUpdate = RD.nrm.needsUpdate = RD.info.needsUpdate = true;
}

// write one vertex of slot s
function vtx(s, v, x, y, z, nx, ny, nz, lx, lz, mask, tile) {
  const k = (s * VPS + v);
  const P = RD.pos.array, N = RD.nrm.array, I = RD.info.array;
  P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z;
  N[k * 3] = nx; N[k * 3 + 1] = ny; N[k * 3 + 2] = nz;
  I[k * 4] = lx; I[k * 4 + 1] = lz; I[k * 4 + 2] = mask; I[k * 4 + 3] = tile;
}

function spokeMask(i) {
  let m = 0;
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j] && isLand(W.type[j])) m |= 1 << d; }
  return m;
}

// quad (4 verts at v..v+3) with winding fixed to face `out`
const _q = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
function quad(s, v, pts, out, cx, cz, mask, tile) {
  const [a, b, c] = pts;
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
  let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
  const l = Math.hypot(nx, ny, nz) || 1;
  nx /= l; ny /= l; nz /= l;
  let order = [0, 1, 2, 3];
  if (nx * out[0] + ny * out[1] + nz * out[2] < 0) { order = [0, 3, 2, 1]; nx = -nx; ny = -ny; nz = -nz; }
  for (let k = 0; k < 4; k++) {
    const p = pts[order[k]];
    vtx(s, v + k, p[0], p[1], p[2], nx, ny, nz, p[0] - cx, p[2] - cz, mask, tile);
  }
}

function writeSlot(s, i) {
  clearSlot(s);
  const mask = spokeMask(i);
  const cx = W.x[i], cz = W.z[i], h = W.h[i], y = h + Y_OFS;
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k - Math.PI / 6;
    const lx = Math.cos(a), lz = Math.sin(a);
    vtx(s, k, cx + lx, y, cz + lz, 0, 1, 0, lx, lz, mask, i);
  }
  for (let d = 0; d < 6; d++) {
    if (!(mask & (1 << d))) continue;
    const j = W.nbr[i * 6 + d];
    const dh = W.h[j] - h;
    if (dh < 0.01) continue;
    // ramp up to the higher neighbour, inside this tile, with walls down to this tile's ground
    const [dx, dz] = SDIR[d], px = -dz, pz = dx;
    const t0 = RAMP_T0, t1 = 0.8660254, y1 = y + dh;
    const P = (t, sd, yy) => [cx + dx * t + px * sd, yy, cz + dz * t + pz * sd];
    const v = 6 + d * 12;
    quad(s, v, [P(t0, -HALF, y), P(t0, HALF, y), P(t1, HALF, y1), P(t1, -HALF, y1)], [0, 1, 0], cx, cz, mask, i);
    const side = (sd) => [P(t0, sd, y - Y_OFS), P(t1, sd, y1), P(t1, sd, y - Y_OFS), P(t0, sd, y - Y_OFS)];
    quad(s, v + 4, side(HALF), [px, 0, pz], cx, cz, mask, i);
    quad(s, v + 8, side(-HALF), [-px, 0, -pz], cx, cz, mask, i);
  }
}

function lampsRebuild() {
  const L = RD.lamps;
  L.begin();
  const out = [];
  for (let i = 0; i < W.count; i++) {
    if (!W.road[i] || !isLand(W.type[i])) continue;
    const mask = spokeMask(i);
    for (let d = 0; d < 6; d++) {
      if (!(mask & (1 << d))) continue;
      // +perp side is blocked by spoke (d + 5) % 6, -perp side by (d + 1) % 6
      let side = 1;
      if (mask & (1 << ((d + 5) % 6))) { if (mask & (1 << ((d + 1) % 6))) continue; side = -1; }
      const [dx, dz] = SDIR[d], px = -dz * side, pz = dx * side;
      const t = 0.433, sOff = 0.322;
      const x = W.x[i] + dx * t + px * sOff, z = W.z[i] + dz * t + pz * sOff;
      const j = W.nbr[i * 6 + d];
      const dh = W.h[j] - W.h[i];
      const y = W.h[i] + (dh > 0.01 ? dh * Math.max(0, (t - RAMP_T0) / (0.8660254 - RAMP_T0)) : 0);
      // local +x of the lamp points back over the road
      const yaw = Math.atan2(pz, -px);
      if (L.put(x, y, z, yaw, 1, 1, 1) < 0) break;
      out.push(x - px * 0.12, y + 0.474, z - pz * 0.12);
    }
  }
  L.end();
  RD.lampPos = new Float32Array(out);
  RD.lampCount = out.length / 3;
  RD.lampVersion++;
}

// ------------------------------------------------------------------------------------------------ public
export function roadsRebuild() {
  const maxSlots = Math.max(64, W.land.length + 16);
  allocGeometry(maxSlots);
  RD.slotOf = new Int32Array(W.count).fill(-1);
  RD.cacheRoad = new Uint8Array(W.count);
  RD.cacheH = new Float32Array(W.count);
  for (let i = 0; i < W.count; i++) {
    RD.cacheRoad[i] = W.road[i] && isLand(W.type[i]) ? 1 : 0;
    RD.cacheH[i] = W.h[i];
    if (RD.cacheRoad[i]) { const s = allocSlot(); RD.slotOf[i] = s; writeSlot(s, i); }
  }
  for (const a of [RD.pos, RD.nrm, RD.info]) { a.clearUpdateRanges(); a.needsUpdate = true; }
  RD.geo.setDrawRange(0, RD.top * IPS);
  lampsRebuild();
}

// Diff W.road against the cached copy; rewrite changed tiles and their neighbours. Returns the changed tiles.
export function roadsUpdate() {
  if (!RD.cacheRoad || RD.cacheRoad.length !== W.count) { roadsRebuild(); return null; }
  const changed = [];
  for (let i = 0; i < W.count; i++) {
    const r = W.road[i] && isLand(W.type[i]) ? 1 : 0;
    if (r !== RD.cacheRoad[i] || RD.cacheH[i] !== W.h[i]) changed.push(i);
  }
  if (!changed.length) return changed;
  const redo = new Set();
  for (const i of changed) {
    RD.cacheRoad[i] = W.road[i] && isLand(W.type[i]) ? 1 : 0;
    RD.cacheH[i] = W.h[i];
    redo.add(i);
    for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0) redo.add(j); }
  }
  for (const i of redo) {
    let s = RD.slotOf[i];
    if (RD.cacheRoad[i]) {
      if (s < 0) { s = allocSlot(); RD.slotOf[i] = s; }
      if (s >= 0) { writeSlot(s, i); }
    } else if (s >= 0) { freeSlot(s); RD.slotOf[i] = -1; }
  }
  RD.geo.setDrawRange(0, RD.top * IPS);
  lampsRebuild();
  return changed;
}

// Lamp head positions for the night light map: { pos: Float32Array [x, y, z, ...], count, version }.
// version increments whenever the lamps change, so the light map only re-renders its static layer then.
export function lampPositions() { return { pos: RD.lampPos, count: RD.lampCount, version: RD.lampVersion }; }

// Height of the street surface at world (x, z): tile height + lift, or along a ramp towards a higher neighbour
export function roadSurfaceY(x, z) {
  const i = tileAt(x, z);
  if (i < 0) return 0;
  if (!isLand(W.type[i])) return 0;
  const h = W.h[i] + Y_OFS;
  if (!W.road[i]) return W.h[i];
  const lx = x - W.x[i], lz = z - W.z[i];
  let best = -1, bt = 0;
  for (let d = 0; d < 6; d++) { const t = lx * SDIR[d][0] + lz * SDIR[d][1]; if (t > bt) { bt = t; best = d; } }
  if (best < 0) return h;
  const j = W.nbr[i * 6 + best];
  if (j < 0 || !W.road[j]) return h;
  const dh = W.h[j] - W.h[i];
  if (dh < 0.01) return h;
  return h + dh * Math.min(1, Math.max(0, (bt - RAMP_T0) / (0.8660254 - RAMP_T0)));
}
export const ROAD_LIFT = Y_OFS;
