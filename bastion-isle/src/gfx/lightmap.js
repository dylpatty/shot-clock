import * as THREE from 'three';
import { U, MAP_MIN, MAP_SIZE } from './uniforms.js';
import { Pool } from './pools.js';
import { W, LF } from '../world.js';
import { G } from '../state.js';

// Night light map (rendering review should_change 4). A map-space HalfFloat render target covering
// [MAP_MIN, MAP_MIN + MAP_SIZE] in x and z (the same bounds as U.uMapMin / U.uMapSize), holding the additive
// light that lamps, lit windows, industry floodlights, headlights, fires, explosions and muzzle flashes throw on
// the ground. No real lights anywhere: terrain, road, building, tree and water shaders add
//   albedo * texture(uNightLight, (worldPos.xz - uMapMin) / uMapSize).rgb * heightFalloff
// to their emissive radiance (see NIGHT_LIGHT_GLSL below). RGB is linear radiance-scale light, A is unused (1).
//
// Three layers, three draw calls, one tiny render target:
//   static   instanced radial sprites (lamps, window spill, industry sodium, player buildings), uploaded only when
//            roads or lots change; each sprite fades in at its own uNight threshold so lamps switch on gradually.
//   vehicles headlight cones + tail glows, drawn from the SAME instance buffers the traffic light quads use
//            (shared InstancedBufferAttributes, so no extra upload).
//   dynamic  fires, explosions, muzzle flashes, flashers and raid beacons, rebuilt each frame (<= 512 sprites).

export const NIGHT_LIGHT_GLSL = /* glsl */`
// --- night light map (gfx/lightmap.js). Needs uniforms U.uNightLight, U.uMapMin, U.uMapSize.
uniform sampler2D uNightLight;
uniform vec2 uMapMin;
uniform float uMapSize;
// wpos: world position of the shaded point; groundY: height of the ground under it (tile height, or ~0.3)
vec3 nightLight(vec3 wpos, float groundY) {
  vec3 L = texture2D(uNightLight, (wpos.xz - uMapMin) / uMapSize).rgb;
  return L * clamp(1.0 - (wpos.y - groundY) * 0.9, 0.0, 1.0);
}
// usage (MeshStandardMaterial patch, after <emissivemap_fragment>):
//   totalEmissiveRadiance += diffuseColor.rgb * nightLight(vWorldPos, groundY);
`;

const STATIC_MAX = 8192;
const DYN_MAX = 512;

// light colours (linear) x strength
const col = (hex, k) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const LAMP = col(0xffd7a0, 1.15);          // 3000K street lamp pool
const WIN = [null, col(0xffc27a, 0.2), col(0xd6e6ff, 0.34), col(0xffb04a, 0.22)]; // R / C / I window spill
const SODIUM = col(0xff9a3a, 0.75);        // industrial yard floodlights
const MIL = col(0xe8f0ff, 0.45);           // player buildings: floodlit compounds

const quadCorners = () => {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
};

const spriteFrag = /* glsl */`
varying vec2 vUv;
varying vec3 vCol;
varying float vShape;
void main() {
  float f;
  if (vShape < 0.5) {            // radial pool, soft quadratic falloff with a hot core
    float d = dot(vUv, vUv);
    f = max(0.0, 1.0 - d); f *= f; f += 0.35 * max(0.0, 1.0 - d * 6.0);
  } else if (vShape < 1.5) {     // headlight cone: vUv.y 0 at the car .. 1 at the far end
    float t = vUv.y * 0.5 + 0.5;
    float w = abs(vUv.x) / (0.18 + 0.82 * t);
    f = smoothstep(1.0, 0.35, w) * pow(1.0 - t, 1.3) * smoothstep(0.0, 0.12, t);
  } else {                       // ring (beacon pool on the water)
    float d = length(vUv);
    f = smoothstep(1.0, 0.75, d) * (0.35 + 0.65 * smoothstep(0.45, 0.8, d));
  }
  gl_FragColor = vec4(vCol * f, 1.0);
}`;

// static + dynamic sprites share one program
const spriteVert = /* glsl */`
attribute vec2 corner;
attribute vec4 aL0;   // x, z, half-extent along local x, half-extent along local y
attribute vec4 aL1;   // r, g, b, angle
attribute vec4 aL2;   // shape, night threshold (<0 = always on, scaled by uDayGain), flicker seed, unused
uniform vec2 uMapMin;
uniform float uMapSize, uNight, uTime, uDayGain;
varying vec2 vUv;
varying vec3 vCol;
varying float vShape;
void main() {
  float ca = cos(aL1.w), sa = sin(aL1.w);
  vec2 l = corner * aL0.zw;
  vec2 w = aL0.xy + vec2(l.x * ca - l.y * sa, l.x * sa + l.y * ca);
  gl_Position = vec4((w - uMapMin) / uMapSize * 2.0 - 1.0, 0.0, 1.0);
  float on = aL2.y < 0.0 ? mix(uDayGain, 1.0, uNight) : smoothstep(aL2.y, aL2.y + 0.12, uNight);
  if (aL2.z > 0.0) on *= 0.72 + 0.28 * sin(uTime * 11.0 + aL2.z * 7.0) * sin(uTime * 6.3 + aL2.z * 3.1);
  vCol = aL1.rgb * on;
  vUv = corner;
  vShape = aL2.x;
}`;

// headlights from the traffic light buffer: aV0 = (x, y, z, yaw), aV1 = (halfLen, halfWid, lightY, flags)
const carVert = /* glsl */`
attribute vec2 corner;
attribute float aWhich; // 0 headlight cone, 1 tail glow
attribute vec4 aV0;
attribute vec4 aV1;
uniform vec2 uMapMin;
uniform float uMapSize, uNight, uTime;
varying vec2 vUv;
varying vec3 vCol;
varying float vShape;
void main() {
  float flags = aV1.w;
  float boat = mod(floor(flags / 16.0), 2.0);
  float lamp = mod(floor(flags / 32.0), 2.0);
  float flash = mod(flags, 2.0);
  float police = mod(floor(flags / 2.0), 2.0);
  float c = cos(aV0.w), s = sin(aV0.w);
  vec2 fwd = vec2(s, c), right = vec2(c, -s);
  vec2 l; vec2 ctr; vec3 colr; float shape;
  float n = smoothstep(0.3, 0.65, uNight);
  if (aWhich < 0.5) {
    // headlight cone ahead of the vehicle (boats: a soft white masthead pool)
    float len = boat > 0.5 ? 0.9 : 1.25 + aV1.x;
    float wid = boat > 0.5 ? 0.9 : 0.42 + aV1.y;
    ctr = aV0.xz + fwd * (aV1.x + len * 0.5);
    l = vec2(corner.x * wid, corner.y * len * 0.5);
    colr = boat > 0.5 ? vec3(0.3, 0.3, 0.27) : vec3(1.3, 1.18, 0.95);
    colr *= n;
    shape = boat > 0.5 ? 0.0 : 1.0;
    if (boat > 0.5) ctr = aV0.xz;
  } else {
    // tail glow, or alternating flasher wash for fire trucks / police
    float ph = step(0.5, fract(uTime * 3.0));
    ctr = aV0.xz - fwd * aV1.x * 0.8;
    float r = flash > 0.5 ? 1.1 : 0.32;
    l = corner * r;
    colr = flash > 0.5 ? (police > 0.5 ? vec3(0.1, 0.25, 1.6) * (0.4 + 0.6 * ph) : mix(vec3(1.8, 0.12, 0.08), vec3(0.12, 0.3, 1.8), ph)) * mix(0.35, 1.0, uNight)
                       : vec3(0.7, 0.04, 0.02) * n;
    if (boat > 0.5) colr = vec3(0.0);
    shape = 0.0;
  }
  if (lamp > 0.5) {
    // fixed lamps (searchlights, lighthouse): a small pool at the base
    ctr = aV0.xz; l = corner * 1.6; shape = 0.0;
    colr = aWhich < 0.5 ? vec3(1.0, 0.9, 0.7) * aV1.y * 0.12 : vec3(0.0);
  }
  vec2 w = ctr + right * l.x + fwd * l.y;
  gl_Position = vec4((w - uMapMin) / uMapSize * 2.0 - 1.0, 0.0, 1.0);
  if (dot(colr, colr) < 1e-6) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vUv = vec2(corner.x, corner.y);
  vCol = colr;
  vShape = shape;
}`;

class Sprites {
  constructor(max) {
    this.max = max; this.n = 0;
    const g = quadCorners();
    const mk = (name) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
      a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute(name, a);
      return a;
    };
    this.a0 = mk('aL0'); this.a1 = mk('aL1'); this.a2 = mk('aL2');
    g.instanceCount = 0;
    this.geo = g;
  }
  // x, z, rx, rz, r, g, b, angle, shape, threshold, flicker
  add(x, z, rx, rz, r, g, b, ang, shape, th, fl) {
    if (this.n >= this.max) return;
    const k = this.n++ * 4, A = this.a0.array, B = this.a1.array, C = this.a2.array;
    A[k] = x; A[k + 1] = z; A[k + 2] = rx; A[k + 3] = rz;
    B[k] = r; B[k + 1] = g; B[k + 2] = b; B[k + 3] = ang;
    C[k] = shape; C[k + 1] = th; C[k + 2] = fl; C[k + 3] = 0;
  }
  commit() {
    this.geo.instanceCount = this.n;
    if (!this.n) return 0;
    for (const a of [this.a0, this.a1, this.a2]) { a.clearUpdateRanges(); a.addUpdateRange(0, this.n * 4); a.needsUpdate = true; }
    const bytes = this.n * 48;
    Pool.uploaded += bytes;
    return bytes;
  }
}

const S = {
  rt: null, size: 512, scene: null, cam: null,
  stat: null, dyn: null, statMesh: null, dynMesh: null, carMesh: null, carGeo: null,
  mat: null, carMat: null,
  lampFn: null, staticDirty: true, dynamicOn: true, bldCount: -1,
  // transient lights (explosions, muzzle flashes): ring of [x, z, radius, r, g, b, t0, life]
  tr: new Float32Array(256 * 8), trHead: 0, time: 0,
  stats: { static: 0, dynamic: 0, bytes: 0 },
  lotTop: null,
};

const uniforms = () => ({
  uMapMin: U.uMapMin, uMapSize: U.uMapSize, uNight: U.uNight, uTime: U.uTime, uDayGain: { value: 0.3 },
});

export function initLightmap(renderer, { size = 512, lampPositions = null } = {}) {
  S.size = size;
  S.rt = new THREE.WebGLRenderTarget(size, size, {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false,
  });
  S.rt.texture.colorSpace = THREE.NoColorSpace;
  S.rt.texture.name = 'nightLightMap';
  S.scene = new THREE.Scene();
  S.scene.matrixWorldAutoUpdate = false;
  S.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); // unused by the shaders (they write clip space directly)
  const blend = { blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, toneMapped: false };
  S.mat = new THREE.ShaderMaterial({ vertexShader: spriteVert, fragmentShader: spriteFrag, uniforms: uniforms(), ...blend });
  S.stat = new Sprites(STATIC_MAX);
  S.dyn = new Sprites(DYN_MAX);
  S.statMesh = new THREE.Mesh(S.stat.geo, S.mat);
  S.dynMesh = new THREE.Mesh(S.dyn.geo, S.mat);
  for (const m of [S.statMesh, S.dynMesh]) { m.frustumCulled = false; m.matrixAutoUpdate = false; S.scene.add(m); }
  S.carMat = new THREE.ShaderMaterial({ vertexShader: carVert, fragmentShader: spriteFrag, uniforms: uniforms(), ...blend });
  S.lampFn = lampPositions;
  U.uNightLight.value = S.rt.texture;
  // clear once so the texture is valid black before the first render
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(S.rt); renderer.setClearColor(0x000000, 1); renderer.clear(true, false, false);
  renderer.setRenderTarget(prev);
}

// The traffic module hands over its per-vehicle light attributes (shared, uploaded once by whoever renders first)
export function lightmapSetVehicleLights(aV0, aV1, countRef) {
  // two sprites per vehicle (aWhich 0 = headlight cone, 1 = tail glow / flasher wash): the base geometry holds
  // two quads and the per-vehicle data is the instanced part
  const corner = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1]);
  const which = new Float32Array([0, 0, 0, 0, 1, 1, 1, 1]);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('corner', new THREE.BufferAttribute(corner, 2));
  geo.setAttribute('aWhich', new THREE.BufferAttribute(which, 1));
  geo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  geo.setAttribute('aV0', aV0);
  geo.setAttribute('aV1', aV1);
  geo.instanceCount = 0;
  S.carGeo = geo;
  S.carCount = countRef;
  S.carMesh = new THREE.Mesh(geo, S.carMat);
  S.carMesh.frustumCulled = false; S.carMesh.matrixAutoUpdate = false;
  S.scene.add(S.carMesh);
}

export function lightmapSetSize(renderer, size) {
  if (!S.rt || S.rt.width === size) return;
  S.rt.setSize(size, size);
  S.size = size;
  U.uNightLight.value = S.rt.texture;
}

export function lightmapSetLampSource(fn) { S.lampFn = fn; S.staticDirty = true; }
export function lightmapSetDynamic(on) { S.dynamicOn = on; }
export function lightmapSetLotTop(fn) { S.lotTop = fn; }
export function lightmapMarkStatic() { S.staticDirty = true; }

// Transient light: explosions, muzzle flashes, flak. Cheap ring buffer, evaluated each frame.
export function addLight(x, z, radius, r, g, b, life) {
  const k = S.trHead * 8;
  S.trHead = (S.trHead + 1) & 255;
  const T = S.tr;
  T[k] = x; T[k + 1] = z; T[k + 2] = radius; T[k + 3] = r; T[k + 4] = g; T[k + 5] = b; T[k + 6] = S.time; T[k + 7] = life;
}

const _lampTmp = [];
function forEachLamp(fn) {
  let src = S.lampFn ? S.lampFn() : null;
  if (!src) src = defaultLampPositions(_lampTmp);
  if (!src || !src.length) return;
  if (typeof src[0] === 'number') {
    for (let k = 0; k + 2 < src.length; k += 3) fn(src[k], src[k + 2]);
  } else {
    for (const p of src) {
      if (Array.isArray(p)) fn(p[0], p.length > 2 ? p[2] : p[1]);
      else fn(p.x, p.z);
    }
  }
}

// Fallback lamp layout (used until gfx-ground's lampPositions() is wired): a lamp every ~0.9u along each road
// spoke, alternating sides, 0.32u off the centre line. Flat array x, y, z.
export function defaultLampPositions(out = []) {
  out.length = 0;
  if (!W.road) return out;
  for (let i = 0; i < W.count; i++) {
    if (!W.road[i]) continue;
    for (let d = 0; d < 3; d++) {
      const j = W.nbr[i * 6 + d];
      if (j < 0 || !W.road[j]) continue;
      const dx = W.x[j] - W.x[i], dz = W.z[j] - W.z[i], L = Math.hypot(dx, dz);
      const ux = dx / L, uz = dz / L, side = ((i + d) & 1) ? 1 : -1;
      for (let t = 0.45; t < L; t += 0.87) {
        const s = side * (((t / 0.87) | 0) & 1 ? 1 : -1);
        out.push(W.x[i] + ux * t - uz * 0.32 * s, Math.max(W.h[i], W.h[j]) + 0.5, W.z[i] + uz * t + ux * 0.32 * s);
      }
    }
  }
  return out;
}

const hash = (i, s) => { let h = (i * 374761393 + s * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

function rebuildStatic() {
  const st = S.stat;
  st.n = 0;
  if (!W.x) { st.commit(); return; }
  // street lamps
  let li = 0;
  forEachLamp((x, z) => {
    const th = 0.18 + hash(li++, 3) * 0.3;
    st.add(x, z, 0.82, 0.82, LAMP[0], LAMP[1], LAMP[2], 0, 0, th, 0);
  });
  // lit-window spill and shopfronts per lot
  for (let i = 0; i < W.count; i++) {
    const z = W.zone[i], lv = W.lvl[i];
    if (!z || !lv) continue;
    const f = W.flags[i];
    if (f & (LF.ABANDONED | LF.RUBBLE)) continue;
    const c = WIN[z];
    const occ = 0.45 + 0.55 * (W.occ[i] / 100);
    const k = (0.55 + 0.45 * lv) * occ * ((f & LF.POWER) || !(f & LF.BUILDING) ? 1 : 0.15);
    const r = 0.85 + 0.2 * lv;
    st.add(W.x[i], W.z[i], r, r, c[0] * k, c[1] * k, c[2] * k, 0, 0, 0.3 + hash(i, 5) * 0.35, 0);
    if (z === 3) {
      const a = hash(i, 9) * 6.283;
      st.add(W.x[i] + Math.cos(a) * 0.45, W.z[i] + Math.sin(a) * 0.45, 1.25, 1.25, SODIUM[0], SODIUM[1], SODIUM[2], 0, 0, 0.25 + hash(i, 7) * 0.2, 0);
    }
  }
  // player buildings: floodlit compounds
  for (const b of G.buildings || []) {
    if (b.x == null) continue;
    const big = b.type === 'hq' ? 1.8 : 1.15;
    st.add(b.x, b.z, big, big, MIL[0], MIL[1], MIL[2], 0, 0, 0.3 + hash(b.id | 0, 11) * 0.2, 0);
  }
  S.bldCount = (G.buildings || []).length;
  S.stats.static = st.n;
  S.stats.bytes += st.commit();
  S.staticDirty = false;
}

// fires: list of burning tiles kept by ambient.js; trucks / beacons get their own sprites
const _fireList = { tiles: null, n: 0 };
export function lightmapSetFireList(tiles, n) { _fireList.tiles = tiles; _fireList.n = n; }
const _beacons = [];
export function lightmapBeacon(x, z, k) { _beacons.push(x, z, k); }

function rebuildDynamic(time) {
  const dy = S.dyn;
  dy.n = 0;
  // burning lots: big flickering orange pools
  const ft = _fireList.tiles;
  if (ft) {
    for (let k = 0; k < _fireList.n; k++) {
      const i = ft[k];
      const f = W.fire[i] / 255;
      if (f <= 0) continue;
      const r = 1.25 + 1.4 * f;
      const s = 0.45 + 1.0 * f;
      dy.add(W.x[i], W.z[i], r, r, 2.2 * s, 0.8 * s, 0.2 * s, 0, 0, -1, 1 + (i % 97));
    }
  }
  // burning player buildings
  for (const b of G.buildings || []) {
    const f = b.fire > 1 ? b.fire / 255 : b.fire || 0;
    if (f > 0) dy.add(b.x, b.z, 1.4 + 1.4 * f, 1.4 + 1.4 * f, 1.0 + 2.2 * f, 0.36 + 0.8 * f, 0.1 + 0.2 * f, 0, 0, -1, 1 + ((b.id | 0) % 97));
  }
  // transient lights
  const T = S.tr;
  for (let k = 0; k < 256; k++) {
    const o = k * 8, life = T[o + 7];
    if (life <= 0) continue;
    const age = time - T[o + 6];
    if (age < 0 || age > life) { if (age > life) T[o + 7] = 0; continue; }
    const q = 1 - age / life, e = q * q;
    dy.add(T[o], T[o + 1], T[o + 2], T[o + 2], T[o + 3] * e, T[o + 4] * e, T[o + 5] * e, 0, 0, -1, 0);
  }
  // raid beacons: a red ring on the water
  for (let k = 0; k < _beacons.length; k += 3) {
    const v = _beacons[k + 2];
    dy.add(_beacons[k], _beacons[k + 1], 2.2, 2.2, 2.4 * v, 0.35 * v, 0.25 * v, 0, 2, -1, 0);
  }
  _beacons.length = 0;
  S.stats.dynamic = dy.n;
  S.stats.bytes += dy.commit();
}

// Called by life.js each frame (before lightmapRender): advance the clock, rebuild the dynamic layer.
export function lightmapFrame(time) {
  S.time = time;
  S.stats.bytes = 0;
  if (!S.rt) return;
  if (G.buildings && G.buildings.length !== S.bldCount) S.staticDirty = true;
  // static layer: at most every 0.4 s of real time (fires and damage mark lots dirty very often)
  const now = performance.now();
  if (S.staticDirty && !S.warm && now - (S.lastStatic || 0) > 400) { S.lastStatic = now; rebuildStatic(); }
  if (S.warm) return;
  if (S.dynamicOn) rebuildDynamic(time); else { S.dyn.n = 0; S.dyn.geo.instanceCount = 0; _beacons.length = 0; }
}

const _cc = new THREE.Color();
export function lightmapRender(renderer) {
  if (!S.rt) return;
  const night = U.uNight.value;
  S.statMesh.visible = (night > 0.02 || S.warm) && S.stat.n > 0;
  if (S.carMesh) {
    const n = S.carCount ? S.carCount.n : 0;
    S.carGeo.instanceCount = n;
    S.carMesh.visible = n > 0 && S.dynamicOn;
  }
  S.dynMesh.visible = S.dyn.n > 0;
  const prevRT = renderer.getRenderTarget();
  renderer.getClearColor(_cc);
  const prevA = renderer.getClearAlpha();
  const prevAuto = renderer.autoClear;
  renderer.setRenderTarget(S.rt);
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = true;
  renderer.render(S.scene, S.cam);
  renderer.autoClear = prevAuto;
  renderer.setClearColor(_cc, prevA);
  renderer.setRenderTarget(prevRT);
  U.uNightLight.value = S.rt.texture;
}

// warm-up: one sprite in every layer so both light-map programs compile with the other warm-up passes
export function lightmapWarm(on) {
  S.warm = on;
  if (on) {
    S.stat.n = 0; S.stat.add(0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0); S.stat.commit();
    S.dyn.n = 0; S.dyn.add(0, 0, 1, 1, 0, 0, 0, 0, 0, -1, 0); S.dyn.commit();
  } else S.staticDirty = true;
}
export function lightmapStats() { return S.stats; }
export function lightmapTexture() { return S.rt && S.rt.texture; }
export function lightmapClear() { S.tr.fill(0); S.staticDirty = true; }
