import * as THREE from 'three';
import { U } from './uniforms.js';
import { Pool } from './pools.js';
import { addLight } from './lightmap.js';
import atlasBytes from '../../assets/life/vfx_atlas.png';

// GPU particles (moved here from src/fx.js and rebuilt; rendering review should_change 10, UX concrete spec 9).
// Fire-and-forget: a particle's whole life is evaluated in the vertex shader from its spawn attributes, so the CPU
// writes each particle once. Instanced camera-facing quads (not GL_POINTS: ANGLE emulates point sprites, and
// quads allow rotation, velocity-stretched sparks and ground-aligned rings).
//
// ONE draw call for everything: premultiplied-alpha blending (src ONE, dst ONE_MINUS_SRC_ALPHA) lets a particle be
// anything from fully alpha-blended (smoke) to fully additive (sparks, flames) through its `add` factor.
// Realistic flipbooks from the Babylon.js Assets (CC BY 4.0) are channel-packed into assets/life/vfx_atlas.png:
//   R smoke shading, G smoke density (8x8), B flame density (8x8), A fireball density (4x4)
// (tests/life/tools/pack_vfx.py builds it). Smoke is lit by the time-of-day sun/ambient plus the night light map.
//
// Budgets: ring capacity per preset; a live-particle estimate (death-time histogram) throttles low-priority
// emission first (ambient smoke, wakes, trails), then medium (debris), never the core flash of an explosion.
// Emission scales down and sizes up with camera distance; on-screen size is capped; particles fade near the camera.

const SHEET = { DOT: 0, SMOKE: 1, FLAME: 2, BLAST: 3, FLARE: 4, RING: 5, STREAK: 6 };
const F_LIT = 8, F_FLAT = 16, F_STRETCH = 32, F_WIND = 64, F_ONCE = 128;

const vert = /* glsl */`
attribute vec2 corner;
attribute vec4 aP;  // x y z t0
attribute vec4 aV;  // vx vy vz life
attribute vec4 aS;  // size0 size1 accelY drag
attribute vec4 aC0; // rgb a (start)
attribute vec4 aC1; // rgb a (end)
attribute vec4 aM;  // sheet+flags, rot0, rotSpeed, additive 0..1
attribute vec4 aE;  // emissive rgb (lit particles: fire glow at birth), decay power
uniform float uFxTime, uPxScale, uMaxPx, uNear0, uNear1, uMapSize;
uniform vec2 uWind, uMapMin;
uniform vec3 uSmokeAmb, uSmokeSun;
uniform sampler2D uNightLight;
varying vec2 vUv;
varying vec4 vFrame;   // uv offset of frame A (xy) and frame B (zw)
varying vec4 vCol;     // premultiplied-ready colour (rgb) and coverage multiplier (a)
varying vec3 vInfo;    // sheet, frame blend, additive
varying float vCell;   // frame cell size in uv
varying float vFogDepth;
float hash1(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  float age = uFxTime - aP.w;
  float life = aV.w;
  float k = age / life;
  if (k < 0.0 || k >= 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float fl = aM.x;
  float sheet = mod(fl, 8.0);
  float lit = mod(floor(fl / 8.0), 2.0);
  float flat_ = mod(floor(fl / 16.0), 2.0);
  float stretch = mod(floor(fl / 32.0), 2.0);
  float wind = mod(floor(fl / 64.0), 2.0);
  float once = mod(floor(fl / 128.0), 2.0);
  float drag = aS.w;
  float dk = drag > 0.0 ? (1.0 - exp(-drag * age)) / drag : age;
  vec3 p = aP.xyz + aV.xyz * dk;
  p.y += 0.5 * aS.z * age * age;
  if (wind > 0.5) p.xz += uWind * (0.12 * age + 0.03 * age * age);
  float e = 1.0 - k;
  float size = mix(aS.x, aS.y, 1.0 - e * e * e);
  vec4 mv;
  float rot = aM.y + aM.z * age;
  float cr = cos(rot), sr = sin(rot);
  vec2 c = vec2(corner.x * cr - corner.y * sr, corner.x * sr + corner.y * cr);
  // size is the diameter; the quad spans +-size/2
  if (flat_ > 0.5) {
    mv = viewMatrix * vec4(p + vec3(c.x, 0.0, c.y) * size * 0.5, 1.0);
  } else {
    mv = viewMatrix * vec4(p, 1.0);
    float depth = max(-mv.z, 0.05);
    float px = size * uPxScale / depth;
    if (px > uMaxPx) size *= uMaxPx / px;                                   // screen-size cap
    if (sheet < 0.5 || sheet > 5.5) size = max(size, 2.0 * depth / uPxScale); // sparks never thinner than ~2 px
    float hs = size * 0.5;
    if (stretch > 0.5) {
      vec3 vel = aV.xyz * exp(-drag * age) + vec3(0.0, aS.z * age, 0.0);
      vec2 vv = (mat3(viewMatrix) * vel).xy;
      float sp = length(vv);
      vec2 d = sp > 1e-4 ? vv / sp : vec2(0.0, 1.0);
      float len = hs * 2.0 + sp * 0.035;
      mv.xy += d * corner.y * len + vec2(-d.y, d.x) * corner.x * hs;
    } else {
      mv.xy += c * hs;
    }
  }
  gl_Position = projectionMatrix * mv;
  vFogDepth = -mv.z;

  float a = mix(aC0.a, aC1.a, k) * smoothstep(0.0, 0.07, k) * (1.0 - smoothstep(0.6, 1.0, k));
  if (sheet > 2.5 && sheet < 3.5) a = mix(aC0.a, aC1.a, k);      // fireball: the flipbook fades itself
  a *= smoothstep(uNear0, uNear1, -mv.z);                           // camera-near fade
  vec3 col = mix(aC0.rgb, aC1.rgb, k);
  if (lit > 0.5) {
    // smoke lit by the time-of-day key + ambient, the night light map below it, and its own fire glow at birth
    vec3 L = texture2D(uNightLight, (p.xz - uMapMin) / uMapSize).rgb * clamp(1.0 - (p.y - 0.3) * 0.3, 0.06, 1.0);
    col = col * (uSmokeAmb + uSmokeSun + L * 0.3) + aE.rgb * pow(e, aE.w);
  }
  vCol = vec4(col, a);

  // flipbooks: 8x8 loops (smoke 18 fps, flames 30 fps), 4x4 fireball once over the life
  float n = sheet > 2.5 ? 4.0 : 8.0;
  float frames = n * n;
  float f;
  if (sheet > 2.5 || once > 0.5) f = k * (frames - 1.0);
  else f = hash1(aP.w * 13.7 + aP.x) * frames + age * (sheet > 1.5 ? 30.0 : 18.0);
  float f0 = mod(floor(f), frames), f1 = mod(f0 + 1.0, frames);
  float cell = 1.0 / n;
  vFrame = vec4(mod(f0, n) * cell, (n - 1.0 - floor(f0 / n)) * cell, mod(f1, n) * cell, (n - 1.0 - floor(f1 / n)) * cell);
  vCell = cell;
  vInfo = vec3(sheet, fract(f), aM.w);
  vUv = corner;
}`;

const frag = /* glsl */`
uniform sampler2D uAtlas;
varying vec2 vUv;
varying vec4 vFrame;
varying vec4 vCol;
varying vec3 vInfo;
varying float vCell;
varying float vFogDepth;
#ifdef USE_FOG
uniform vec3 fogColor;
uniform float fogNear, fogFar;
#endif
void main() {
  float sheet = vInfo.x;
  float cov;
  vec3 col = vCol.rgb;
  if (sheet < 0.5) {                       // soft dot
    float d = dot(vUv, vUv);
    cov = max(0.0, 1.0 - d); cov *= cov;
  } else if (sheet < 3.5) {                // flipbooks
    vec2 uv = (vUv * 0.5 + 0.5) * vCell * 0.98 + vCell * 0.01;
    vec4 A = texture2D(uAtlas, vFrame.xy + uv);
    vec4 B = texture2D(uAtlas, vFrame.zw + uv);
    vec4 s = mix(A, B, vInfo.y);
    if (sheet < 1.5) { cov = s.g; col *= 0.55 + 0.9 * s.r; }
    else if (sheet < 2.5) { cov = s.b; col *= 0.5 + 1.1 * s.b * s.b; }
    else { cov = s.a; col *= 0.45 + 1.1 * s.a * s.a; }
  } else if (sheet < 4.5) {                // flare: hot core plus halo
    float d = dot(vUv, vUv);
    cov = exp(-d * 9.0) + 0.28 * max(0.0, 1.0 - d) * max(0.0, 1.0 - d);
  } else if (sheet < 5.5) {                // shock / foam ring
    float d = length(vUv);
    cov = smoothstep(0.55, 0.86, d) * smoothstep(1.0, 0.88, d);
  } else {                                 // velocity streak
    cov = max(0.0, 1.0 - vUv.x * vUv.x) * max(0.0, 1.0 - vUv.y * vUv.y);
    cov *= cov;
  }
  cov *= vCol.a;
  if (cov < 0.002) discard;
  float add = vInfo.z;
#ifdef USE_FOG
  float ff = smoothstep(fogNear, fogFar, vFogDepth);
  col = mix(col, fogColor * (1.0 - add), ff);
#endif
  gl_FragColor = vec4(col * cov, cov * (1.0 - add));
}`;

const PRESET = {
  ultra: { max: 8192, budget: 3500, emit: 1 },
  high: { max: 6144, budget: 2500, emit: 1 },
  performance: { max: 4096, budget: 1500, emit: 0.6 },
};

const S = {
  mesh: null, geo: null, mat: null, max: 0, head: 0, nEmit: 0, headAtFlush: 0,
  time: 0, budget: 2500, emitMul: 1,
  hist: new Int32Array(400), histT: 0, live: 0,
  zoom: 1, fires: 0, attrs: null, arr: null,
  sun: null, hemi: null, bytes: 0, emitted: 0, dropped: 0,
};

function decodeAtlas(tex) {
  const blob = new Blob([atlasBytes], { type: 'image/png' });
  // every channel is data: never premultiply or colour-convert
  return createImageBitmap(blob, { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }).then((bmp) => {
    tex.image = bmp;
    tex.needsUpdate = true;
  });
}

export function initFx(scene, { quality = 'high' } = {}) {
  const p = PRESET[quality] || PRESET.high;
  const max = p.max;
  S.max = max; S.budget = p.budget; S.emitMul = p.emit;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const names = ['aP', 'aV', 'aS', 'aC0', 'aC1', 'aM', 'aE'];
  S.attrs = names.map((n) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
    a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute(n, a);
    return a;
  });
  S.arr = S.attrs.map((a) => a.array);
  // park every slot as expired
  const P = S.arr[0], V = S.arr[1];
  for (let i = 0; i < max; i++) { P[i * 4 + 3] = -1e6; V[i * 4 + 3] = 1e-3; }
  g.instanceCount = max;
  S.geo = g;

  // valid 1x1 placeholder until the PNG decodes (same sampler type, so the program never changes)
  const ph = new THREE.DataTexture(new Uint8Array([128, 0, 0, 0]), 1, 1);
  ph.needsUpdate = true;
  const u = {
    uAtlas: { value: ph },
    uFxTime: { value: 0 }, uPxScale: { value: 400 }, uMaxPx: { value: 300 },
    uNear0: { value: 1.2 }, uNear1: { value: 4.5 },
    uWind: U.uWind, uMapMin: U.uMapMin, uMapSize: U.uMapSize, uNightLight: U.uNightLight,
    uSmokeAmb: { value: new THREE.Color(0.35, 0.37, 0.4) }, uSmokeSun: { value: new THREE.Color(0.9, 0.85, 0.75) },
    fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 1000 },
  };
  const atlas = new THREE.Texture();
  atlas.colorSpace = THREE.NoColorSpace;
  atlas.flipY = false;
  atlas.premultiplyAlpha = false;
  atlas.generateMipmaps = true;
  atlas.minFilter = THREE.LinearMipmapLinearFilter;
  atlas.magFilter = THREE.LinearFilter;
  S.atlasReady = decodeAtlas(atlas).then(() => { u.uAtlas.value = atlas; });
  S.mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, uniforms: u, fog: true,
    transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendEquation: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  S.mesh = new THREE.Mesh(g, S.mat);
  S.mesh.frustumCulled = false;
  S.mesh.renderOrder = 8;
  S.mesh.name = 'fx-particles';
  scene.add(S.mesh);
  // the fixed light rig (one sun/moon + one hemisphere): smoke is lit from them
  scene.traverse((o) => {
    if (o.isDirectionalLight && !S.sun) S.sun = o;
    if (o.isHemisphereLight && !S.hemi) S.hemi = o;
  });
  return S.mesh;
}

// ---------------------------------------------------------------------------------------------- emission core

// priority: 0 always, 1 medium (debris, flames), 2 low (ambient smoke, wakes, trails)
let gate1 = 1, gate2 = 1;
const pass = (pri) => (pri === 0 ? true : Math.random() < (pri === 1 ? gate1 : gate2));

function emit(x, y, z, vx, vy, vz, life, s0, s1, acc, drag, r0, g0, b0, a0, r1, g1, b1, a1, flags, rot0, rotSpd, add, er, eg, eb, ep) {
  if (!S.max) return;
  const i = S.head;
  S.head = i === 0 ? S.max - 1 : i - 1;   // newest particles get the lowest indices: drawn later than older ones above them
  S.nEmit++;
  const o = i * 4, A = S.arr;
  let a = A[0]; a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = S.time;
  a = A[1]; a[o] = vx; a[o + 1] = vy; a[o + 2] = vz; a[o + 3] = life;
  a = A[2]; a[o] = s0; a[o + 1] = s1; a[o + 2] = acc; a[o + 3] = drag;
  a = A[3]; a[o] = r0; a[o + 1] = g0; a[o + 2] = b0; a[o + 3] = a0;
  a = A[4]; a[o] = r1; a[o + 1] = g1; a[o + 2] = b1; a[o + 3] = a1;
  a = A[5]; a[o] = flags; a[o + 1] = rot0; a[o + 2] = rotSpd; a[o + 3] = add;
  a = A[6]; a[o] = er; a[o + 1] = eg; a[o + 2] = eb; a[o + 3] = ep;
  // live estimate: count by death time (0.1 s buckets, lives < 40 s)
  const b = Math.floor((S.time + life) * 10) % 400;
  S.hist[b]++; S.live++; S.emitted++;
}

const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = 6.283185307;
// smoke albedo is linear grey; colours below are linear, HDR where they glow

// lit flipbook smoke. glow: fire light on the smoke at birth (fades with power `gp` of the remaining life)
function smokeP(x, y, z, vx, vy, vz, life, s0, s1, grey, alpha, buoy, drag, glow, tint = 1, gp = 18) {
  const g = grey;
  emit(x, y, z, vx, vy, vz, life, s0, s1, buoy, drag, g, g * tint, g * tint * tint, alpha, g * 1.15, g * 1.15 * tint, g * 1.15 * tint, 0,
    SHEET.SMOKE | F_LIT | F_WIND, rnd(0, TAU), rnd(-0.35, 0.35), 0, 2.2 * glow, 0.75 * glow, 0.16 * glow, gp);
}
function flareP(x, y, z, life, s0, s1, r, g, b) {
  emit(x, y, z, 0, 0, 0, life, s0, s1, 0, 0, r, g, b, 1, r * 0.5, g * 0.3, b * 0.2, 0, SHEET.FLARE, 0, 0, 1, 0, 0, 0, 1);
}
function streakP(x, y, z, vx, vy, vz, life, size, grav, r, g, b) {
  emit(x, y, z, vx, vy, vz, life, size, size * 0.6, grav, 0.6, r, g, b, 1, r * 0.35, g * 0.15, b * 0.05, 0.6, SHEET.STREAK | F_STRETCH, 0, 0, 1, 0, 0, 0, 1);
}

// ---------------------------------------------------------------------------------------------- public API
// Signatures match the sim's FX hooks (src/sim/events.js).

export function explosion(x, y, z, scale = 1, onWater = false) {
  const s = scale, zs = S.zoomEmit;
  flareP(x, y + 0.25 * s, z, 0.13, 1.8 * Math.min(s, 1.6), 2.8 * Math.min(s, 1.6), 9, 6, 3);
  // fireball: 4x4 flipbook, hot core cooling to dull orange
  const nb = s > 1.2 ? 3 : 2, fs = s < 1 ? s : Math.sqrt(s);
  for (let i = 0; i < nb; i++) {
    const a = rnd(0, TAU), r = rnd(0, 0.2) * fs;
    emit(x + Math.cos(a) * r, y + 0.15 * fs + rnd(0, 0.15) * fs, z + Math.sin(a) * r, Math.cos(a) * 0.25 * fs, rnd(0.3, 0.8) * fs, Math.sin(a) * 0.25 * fs,
      rnd(0.42, 0.58), rnd(0.7, 0.95) * fs, rnd(1.6, 2.1) * fs, 0, 1.4,
      5.5, 2.4, 0.7, 1, 1.1, 0.22, 0.05, 0.9, SHEET.BLAST | F_ONCE, rnd(0, TAU), rnd(-0.6, 0.6), 0.55, 0, 0, 0, 1);
  }
  // embers / debris streaks
  if (pass(1)) {
    const ne = Math.round((6 + 6 * Math.min(2, s)) * zs);
    for (let i = 0; i < ne; i++) {
      const a = rnd(0, TAU), sp = rnd(1.8, 4.5) * Math.sqrt(s);
      streakP(x, y + 0.2 * s, z, Math.cos(a) * sp, rnd(2, 6) * Math.sqrt(s), Math.sin(a) * sp, rnd(0.5, 1.0), 0.045 * Math.max(1, s * 0.7), -9, 9, 4.5, 1.2);
    }
    // dark chunks
    for (let i = 0; i < 4 * Math.min(2, s); i++) {
      const a = rnd(0, TAU), sp = rnd(1, 3) * Math.sqrt(s);
      emit(x, y + 0.2, z, Math.cos(a) * sp, rnd(2.5, 5), Math.sin(a) * sp, rnd(0.7, 1.1), 0.07 * s, 0.05 * s, -9.8, 0.2,
        0.04, 0.035, 0.03, 1, 0.04, 0.035, 0.03, 1, SHEET.DOT | F_LIT, 0, 0, 0, 0.6, 0.2, 0.05, 3);
    }
  }
  // smoke: dark, lit by the fire at birth, rising and spreading
  const ns = Math.round((4 + 4 * Math.min(2.5, s)) * zs);
  for (let i = 0; i < ns; i++) {
    if (i > 2 && !pass(1)) break;
    const a = rnd(0, TAU), sp = rnd(0.3, 1.1) * s;
    const g = onWater ? 0.5 : rnd(0.07, 0.12);
    smokeP(x + Math.cos(a) * 0.2 * s, y + 0.25 * s, z + Math.sin(a) * 0.2 * s, Math.cos(a) * sp, rnd(0.6, 1.5) * s, Math.sin(a) * sp,
      rnd(2.4, 4.0) * Math.min(1.6, 0.8 + s * 0.4), 0.6 * fs * S.zoomSize, rnd(1.9, 2.6) * fs * S.zoomSize, g, onWater ? 0.55 : 0.88, 0.25, 1.4, onWater ? 0.2 : 1);
  }
  // ground shock: dust ring on land, foam ring + spray column on water
  if (onWater) splash(x, z, s * 0.9);
  else emit(x, Math.max(0.02, y - 0.15), z, 0, 0, 0, 0.75, 0.3 * s, 2.8 * s, 0, 0, 0.32, 0.27, 0.21, 0.55, 0.36, 0.31, 0.25, 0,
    SHEET.RING | F_LIT | F_FLAT, rnd(0, TAU), 0, 0, 0, 0, 0, 1);
  addLight(x, z, 2.2 + 1.6 * s, 3.2 * Math.min(2, s), 1.5 * Math.min(2, s), 0.45 * Math.min(2, s), 0.5);
}

export function splash(x, z, s = 1) {
  const n = Math.round((7 + 6 * Math.min(2, s)) * S.zoomEmit);
  for (let i = 0; i < n; i++) {
    const a = rnd(0, TAU), sp = rnd(0.15, 0.8) * s;
    emit(x + Math.cos(a) * 0.15 * s, 0.05, z + Math.sin(a) * 0.15 * s, Math.cos(a) * sp, rnd(3.2, 6.5) * Math.sqrt(s), Math.sin(a) * sp,
      rnd(0.9, 1.4), rnd(0.25, 0.4) * s, rnd(0.6, 1.0) * s, -7, 0.5, 0.82, 0.88, 0.92, 0.9, 0.9, 0.94, 0.97, 0,
      SHEET.SMOKE | F_LIT, rnd(0, TAU), rnd(-1, 1), 0, 0, 0, 0, 1);
  }
  // foam ring and lingering mist
  emit(x, 0.04, z, 0, 0, 0, 1.6, 0.4 * s, 3.0 * s, 0, 0, 0.9, 0.95, 0.97, 0.75, 0.9, 0.95, 0.97, 0, SHEET.RING | F_LIT | F_FLAT, rnd(0, TAU), 0, 0, 0, 0, 0, 1);
  if (pass(2)) emit(x, 0.3, z, 0, 0.3, 0, 2.2, 0.8 * s, 2.4 * s, 0, 0.8, 0.85, 0.9, 0.95, 0.4, 0.9, 0.93, 0.96, 0, SHEET.SMOKE | F_LIT | F_WIND, rnd(0, TAU), 0.2, 0, 0, 0, 0, 1);
}

export function muzzle(x, y, z, s = 1) {
  flareP(x, y, z, 0.07, 0.5 * s, 0.32 * s, 16, 11, 5.5);
  emit(x, y, z, 0, 0.1, 0, 0.12, 0.22 * s, 0.42 * s, 0, 0, 10, 5.5, 2, 1, 4, 1.2, 0.3, 0.4, SHEET.BLAST | F_ONCE, rnd(0, TAU), 0, 0.85, 0, 0, 0, 1);
  if (pass(2)) smokeP(x, y, z, rnd(-0.2, 0.2), 0.45, rnd(-0.2, 0.2), rnd(0.9, 1.3), 0.15 * s, 0.75 * s, 0.55, 0.38, 0.25, 1.2, 0.25);
  addLight(x, z, 1.4 + 1.2 * s, 3.5, 2.4, 1.0, 0.08);
}

export function flakBurst(x, y, z, s = 1) {
  flareP(x, y, z, 0.12, 1.3 * s, 2.0 * s, 12, 8, 3.5);
  const n = pass(1) ? 4 : 2;
  for (let i = 0; i < n; i++) {
    smokeP(x + rnd(-0.25, 0.25) * s, y + rnd(-0.2, 0.2) * s, z + rnd(-0.25, 0.25) * s, rnd(-0.3, 0.3), rnd(-0.1, 0.25), rnd(-0.3, 0.3),
      rnd(1.8, 2.6), 0.5 * s, rnd(1.3, 1.7) * s, 0.045, 0.92, 0.05, 1.5, 0.45);
  }
  if (pass(1)) for (let i = 0; i < 7; i++) {
    const a = rnd(0, TAU), b = rnd(-1, 1), c = Math.sqrt(1 - b * b);
    streakP(x, y, z, Math.cos(a) * c * 4.5, b * 4.5, Math.sin(a) * c * 4.5, rnd(0.2, 0.35), 0.035, -4, 9, 5, 1.5);
  }
  addLight(x, z, 3.5 + 2 * s, 0.9, 0.55, 0.22, 0.14);
}

export function trail(x, y, z, s = 1, dark = false) {
  if (!pass(2)) return;
  if (dark) smokeP(x, y, z, rnd(-0.1, 0.1), rnd(0.05, 0.25), rnd(-0.1, 0.1), rnd(1.8, 2.6), 0.2 * s, 0.9 * s, 0.05, 0.8, 0.15, 0.8, 0.3);
  else {
    smokeP(x, y, z, rnd(-0.06, 0.06), rnd(0.0, 0.12), rnd(-0.06, 0.06), rnd(1.1, 1.6), 0.1 * s, 0.55 * s, 0.75, 0.5, 0.05, 0.6, 0.0);
    flareP(x, y, z, 0.06, 0.28 * s, 0.12 * s, 10, 6, 2.5);
  }
}

export function fire(x, y, z, s = 1) {
  if (!pass(1)) return;
  emit(x + rnd(-0.15, 0.15) * s, y, z + rnd(-0.15, 0.15) * s, rnd(-0.08, 0.08), rnd(0.5, 1.0) * s, rnd(-0.08, 0.08), rnd(0.45, 0.7),
    0.6 * s, 0.42 * s, 0.4, 0.4, 4.2, 1.7, 0.35, 1, 1.6, 0.3, 0.05, 0.7, SHEET.FLAME, rnd(-0.15, 0.15), 0, 0.85, 0, 0, 0, 1);
  if (Math.random() < 0.3 && pass(2)) smokeP(x, y + 0.3 * s, z, rnd(-0.1, 0.1), rnd(0.6, 1.0), rnd(-0.1, 0.1), rnd(2, 3), 0.35 * s, 1.3 * s, 0.06, 0.7, 0.2, 1, 0.6);
}

export function smokePuff(x, y, z, s = 1, g = 0.2) {
  if (!pass(2)) return;
  smokeP(x + rnd(-0.2, 0.2) * s, y, z + rnd(-0.2, 0.2) * s, rnd(-0.12, 0.12), rnd(0.5, 0.9), rnd(-0.12, 0.12), rnd(2.2, 3.2),
    0.35 * s * S.zoomSize, 1.5 * s * S.zoomSize, g * 0.6, 0.7, 0.15, 1, 0);
}

export function wake(x, z, s = 1) {
  if (!pass(2)) return;
  emit(x + rnd(-0.06, 0.06), 0.035, z + rnd(-0.06, 0.06), rnd(-0.12, 0.12), 0, rnd(-0.12, 0.12), rnd(1.4, 2.0), 0.18 * s, 0.75 * s, 0, 1.2,
    0.85, 0.9, 0.92, 0.55, 0.85, 0.9, 0.92, 0, SHEET.SMOKE | F_LIT | F_FLAT, rnd(0, TAU), rnd(-0.3, 0.3), 0, 0, 0, 0, 1);
}

export function dust(x, y, z, s = 1) {
  const n = Math.max(2, Math.round(7 * s * S.zoomEmit));
  for (let i = 0; i < n; i++) {
    if (i > 1 && !pass(2)) break;
    const a = rnd(0, TAU), sp = rnd(0.5, 1.5);
    emit(x, y + 0.05, z, Math.cos(a) * sp, rnd(0.15, 0.6), Math.sin(a) * sp, rnd(1.0, 1.6), 0.25 * s, 1.0 * s, -0.1, 2,
      0.36, 0.3, 0.22, 0.6, 0.4, 0.35, 0.27, 0, SHEET.SMOKE | F_LIT | F_WIND, rnd(0, TAU), rnd(-0.4, 0.4), 0, 0, 0, 0, 1);
  }
}

export function sparks(x, y, z) {
  for (let i = 0; i < 5; i++) {
    const a = rnd(0, TAU);
    streakP(x, y, z, Math.cos(a) * 2.2, rnd(1, 3.2), Math.sin(a) * 2.2, rnd(0.2, 0.35), 0.03, -9, 10, 6, 2);
  }
}

// ---- used by ambient.js (not sim hooks)

// lot / building fire: flames over the roof, embers, and a column of dark smoke (lit orange from below)
export function fireColumn(x, y, z, f, w, rate, dt) {
  // f intensity 0..1, w footprint half-width, rate multiplier (budget)
  const nf = f * 18 * rate * dt * S.zoomEmit;
  for (let n = nf + Math.random(); n >= 1; n--) {
    if (!pass(1)) break;
    const sz = (0.5 + 0.55 * f) * rnd(0.8, 1.2);
    emit(x + rnd(-w, w), y + rnd(-0.05, 0.1), z + rnd(-w, w), rnd(-0.05, 0.05), rnd(0.35, 0.8) * (0.6 + f), rnd(-0.05, 0.05), rnd(0.5, 0.85),
      sz, sz * 0.7, 0.5, 0.4, 4.2, 1.7, 0.35, 1, 1.6, 0.3, 0.05, 0.6, SHEET.FLAME, rnd(-0.12, 0.12), 0, 0.82, 0, 0, 0, 1);
  }
  const ns = (1.2 + 3.2 * f) * rate * dt * S.zoomEmit;
  for (let n = ns + Math.random(); n >= 1; n--) {
    if (!pass(2)) break;
    const s0 = (0.35 + 0.35 * f) * S.zoomSize, s1 = (1.6 + 1.6 * f) * S.zoomSize;
    smokeP(x + rnd(-w, w) * 0.7, y + 0.35, z + rnd(-w, w) * 0.7, rnd(-0.08, 0.08), rnd(0.55, 0.9) * (0.7 + 0.5 * f), rnd(-0.08, 0.08),
      rnd(5, 7.5), s0, s1, rnd(0.035, 0.07), 0.82, 0.04, 0.35, 0.5, 1, 14);
  }
  if (Math.random() < f * 6 * rate * dt && pass(2)) {
    streakP(x + rnd(-w, w), y + 0.2, z + rnd(-w, w), rnd(-0.4, 0.4), rnd(1.0, 2.2), rnd(-0.4, 0.4), rnd(1.0, 1.8), 0.022, 0.3, 8, 3.5, 0.8);
  }
}

// industrial chimney / gas plant stack: pale smoke drifting downwind
export function stackSmoke(x, y, z, s, grey) {
  if (!pass(2)) return;
  smokeP(x, y, z, rnd(-0.04, 0.04), rnd(0.35, 0.55), rnd(-0.04, 0.04), rnd(4.5, 6.5), 0.16 * s * S.zoomSize, (1.1 + rnd(0, 0.5)) * s * S.zoomSize,
    grey, 0.55, 0.03, 0.5, 0, 0.98);
}

// fire-truck hose: a short white jet
export function hose(x, y, z, tx, tz) {
  if (!pass(2)) return;
  const dx = tx - x, dz = tz - z, L = Math.hypot(dx, dz) || 1, sp = Math.min(3.2, 1.8 + L);
  emit(x, y, z, (dx / L) * sp + rnd(-0.15, 0.15), rnd(1.4, 1.9), (dz / L) * sp + rnd(-0.15, 0.15), rnd(0.55, 0.75), 0.05, 0.22, -5, 0.3,
    0.85, 0.9, 0.95, 0.85, 0.9, 0.93, 0.97, 0, SHEET.SMOKE | F_LIT, rnd(0, TAU), 0, 0, 0, 0, 0, 1);
}

// ---------------------------------------------------------------------------------------------- per frame

const _sunDir = new THREE.Vector3();
// gdt: game-scaled dt (0 while paused). camDist: camera distance to its target (zoom), for emission scaling.
export function fxFrame(gdt, camera, renderer, camDist = 40, scene = null) {
  if (!S.max) return;
  S.time += gdt;
  // retire dead particles from the live estimate
  const now = Math.floor(S.time * 10);
  if (now - S.histT > 400) { S.hist.fill(0); S.live = 0; S.histT = now; }
  while (S.histT < now) { S.histT++; const b = S.histT % 400; S.live -= S.hist[b]; S.hist[b] = 0; }
  if (S.live < 0) S.live = 0;
  // budget gates: low-priority emission thins from 50% of the budget, medium from 85%
  const B = S.budget;
  gate2 = Math.max(0, Math.min(1, (B - S.live) / (0.5 * B))) * S.emitMul;
  gate1 = Math.max(0.15, Math.min(1, (1.25 * B - S.live) / (0.4 * B)));
  // zoom: fewer, larger particles when far away
  const z = Math.max(0.45, Math.min(1, 55 / Math.max(1, camDist)));
  S.zoomEmit = z;
  S.zoomSize = 1 / Math.sqrt(z);

  const u = S.mat.uniforms;
  u.uFxTime.value = S.time;
  if (renderer && camera) {
    const h = renderer.getDrawingBufferSize ? renderer.getDrawingBufferSize(_v2).y : 720;
    u.uPxScale.value = h * camera.projectionMatrix.elements[5] * 0.5;
    u.uMaxPx.value = h * 0.3;
  }
  if (scene && scene.fog) { u.fogColor.value.copy(scene.fog.color); u.fogNear.value = scene.fog.near; u.fogFar.value = scene.fog.far; }
  // smoke lighting from the fixed light rig
  if (S.sun) {
    const k = S.sun.intensity;
    _sunDir.copy(S.sun.position).sub(S.sun.target.position).normalize();
    const up = Math.max(0.15, _sunDir.y);
    u.uSmokeSun.value.copy(S.sun.color).multiplyScalar(k * 0.32 * (0.6 + 0.4 * up));
  }
  if (S.hemi) {
    const h = S.hemi;
    u.uSmokeAmb.value.copy(h.color).lerp(h.groundColor, 0.35).multiplyScalar(h.intensity * 0.9);
  }
  flushRanges();
}
const _v2 = new THREE.Vector2();

function flushRanges() {
  const n = S.nEmit;
  if (!n) return;
  const max = S.max, h0 = S.headAtFlush;
  S.nEmit = 0;
  S.headAtFlush = S.head;
  let bytes = 0;
  for (const a of S.attrs) {
    a.clearUpdateRanges();
    if (n >= max) a.addUpdateRange(0, max * 4);
    else {
      // written indices: h0, h0-1, ..., h0-n+1 (mod max)
      const lo = h0 - n + 1;
      if (lo >= 0) a.addUpdateRange(lo * 4, n * 4);
      else { a.addUpdateRange(0, (h0 + 1) * 4); a.addUpdateRange((max + lo) * 4, -lo * 4); }
    }
    a.needsUpdate = true;
  }
  bytes = Math.min(n, max) * 7 * 16;
  S.bytes = bytes;
  Pool.uploaded += bytes;
}

export function clearFx() {
  if (!S.max) return;
  const P = S.arr[0];
  for (let i = 0; i < S.max; i++) P[i * 4 + 3] = -1e6;
  S.hist.fill(0); S.live = 0;
  for (const a of S.attrs) { a.clearUpdateRanges(); a.needsUpdate = true; }
}

export function fxStats() { return { live: S.live, max: S.max, budget: S.budget, bytes: S.bytes, emitted: S.emitted, time: S.time }; }
export function fxTime() { return S.time; }
export function fxMesh() { return S.mesh; }
S.zoomEmit = 1; S.zoomSize = 1;
