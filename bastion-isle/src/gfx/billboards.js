import * as THREE from 'three';
import { Pool } from './pools.js';
import { W, LF } from '../world.js';
import { G, SETTINGS } from '../state.js';
import { lotMaxHp } from '../sim/core.js';

// Instanced screen-space billboards in post.overlay (UX must_change 9/10, should_change 6, concrete spec 13):
//   health bars   0.9u wide clamped to 40-80 px, shown for 5 s after a hit, or while hovered/selected.
//                 Hostile bars red on dark; friendly bars green / amber / red by health.
//   problem icons one per lot/building, highest priority only: fire > no road > no power > no water > abandoned >
//                 sheltering > understaffed, after the problem has lasted 6 s (fire: 3 s), 18-32 px on screen;
//                 beyond camera distance 70 only fire and critical icons.
//   bounty floaters '+$1,250' rising 0.8u over 1.2 s, from an instanced glyph atlas (one quad per floater, the
//                 fragment shader picks each character from packed glyph codes).
// One InstancedBufferGeometry, one ShaderMaterial, one draw call. The atlas is drawn at startup on a canvas with
// Tabler icon paths (MIT), so no image assets are needed.

const MAX = 900;
const ICON = { FIRE: 0, ROAD: 1, POWER: 2, WATER: 3, ABANDONED: 4, SHELTER: 5, STAFF: 6, CRITICAL: 7, NONE: 255 };
const SHOW_AFTER = [3, 6, 6, 6, 6, 6, 6, 0];
const FAR = 70;
const LOT_TOP = [0, 0.5, 1.15, 2.7];

// Tabler icons (MIT, (c) Pawel Kuna): outline path data, 24x24 viewBox, stroke 2
const PATHS = {
  flame: ['M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235'],
  road: ['M4 19l3.332 -11.661', 'M16 5l2.806 9.823', 'M12 8v-2', 'M12 13v-1', 'M12 18v-2', 'M3 3l18 18'],
  power: ['M3 3l18 18', 'M15.212 15.21l-4.212 5.79v-7h-6l3.79 -5.21m1.685 -2.32l2.525 -3.47v6m1 1h5l-2.104 2.893'],
  water: ['M18.963 14.938a6.54 6.54 0 0 0 -.899 -4.06l-4.89 -7.26c-.42 -.626 -1.287 -.804 -1.936 -.398a1.376 1.376 0 0 0 -.41 .397l-1.282 1.9m-1.625 2.415l-1.986 2.946c-1.695 2.837 -1.035 6.44 1.567 8.545c2.602 2.105 6.395 2.105 8.996 0a6.83 6.83 0 0 0 1.376 -1.499', 'M3 3l18 18'],
  abandoned: ['M5 12h-2l4.497 -4.497m2 -2l2.504 -2.504l9 9h-2', 'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2m0 -4v-3', 'M9 21v-6a2 2 0 0 1 2 -2h2m2 2v6', 'M3 3l18 18'],
  shelter: ['M8 16v-4a4 4 0 0 1 8 0v4', 'M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7', 'M6 16m0 1a1 1 0 0 1 1 -1h10a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z'],
  staff: ['M5 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0', 'M3 21v-2a4 4 0 0 1 4 -4h4c.948 0 1.818 .33 2.504 .88', 'M16 3.13a4 4 0 0 1 0 7.75', 'M16 19h6'],
  critical: ['M12 9v4', 'M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z', 'M12 16h.01'],
};
// badge ring colours (UX colour tokens)
const BADGES = [
  { p: 'flame', ring: '#FF4D3D', bg: 'rgba(110,18,12,0.94)', glyph: '#FFD9A0' },
  { p: 'road', ring: '#E8EDF1', bg: 'rgba(13,19,26,0.92)', glyph: '#E8EDF1' },
  { p: 'power', ring: '#F5CF4A', bg: 'rgba(13,19,26,0.92)', glyph: '#F5CF4A' },
  { p: 'water', ring: '#4FB3FF', bg: 'rgba(13,19,26,0.92)', glyph: '#4FB3FF' },
  { p: 'abandoned', ring: '#93A3B0', bg: 'rgba(13,19,26,0.92)', glyph: '#C4CDD4' },
  { p: 'shelter', ring: '#FFB547', bg: 'rgba(13,19,26,0.92)', glyph: '#FFB547' },
  { p: 'staff', ring: '#93A3B0', bg: 'rgba(13,19,26,0.92)', glyph: '#C4CDD4' },
  { p: 'critical', ring: '#FF4D3D', bg: 'rgba(110,18,12,0.94)', glyph: '#FFFFFF' },
];
const GLYPHS = '0123456789+$,-';
const AW = 512, AH = 128, ICELL = 64, GW = 32, GH = 48, GY = 72;

function buildAtlas() {
  const cv = document.createElement('canvas');
  cv.width = AW; cv.height = AH;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, AW, AH);
  BADGES.forEach((b, k) => {
    const x0 = k * ICELL;
    g.save();
    g.translate(x0, 0);
    // chamfered badge (HUD motif: two opposite corners cut) with a short pin tail
    const m = 6, c = 10, s = ICELL - 2 * m - 6;
    const path = () => {
      g.beginPath();
      g.moveTo(m + c, m); g.lineTo(m + s, m); g.lineTo(m + s, m + s - c); g.lineTo(m + s - c, m + s);
      g.lineTo(m + s / 2 + 6, m + s); g.lineTo(m + s / 2, m + s + 6); g.lineTo(m + s / 2 - 6, m + s);
      g.lineTo(m, m + s); g.lineTo(m, m + c); g.closePath();
    };
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 4;
    path(); g.fillStyle = b.bg; g.fill();
    g.shadowBlur = 0;
    g.lineWidth = 3; g.strokeStyle = b.ring; path(); g.stroke();
    // glyph
    g.translate(m + s / 2 - 15, m + s / 2 - 15);
    g.scale(30 / 24, 30 / 24);
    g.lineWidth = 2.1; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = b.glyph;
    for (const d of PATHS[b.p]) g.stroke(new Path2D(d));
    g.restore();
  });
  // glyphs for floaters: gold fill, dark outline
  g.font = `700 ${GH - 6}px "Barlow Semi Condensed", "Arial Narrow", "Roboto Condensed", Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let k = 0; k < GLYPHS.length; k++) {
    const x = k * GW + GW / 2, y = GY + GH / 2;
    g.lineWidth = 6; g.strokeStyle = 'rgba(20,14,4,0.9)'; g.lineJoin = 'round';
    g.strokeText(GLYPHS[k], x, y);
    g.fillStyle = '#FFD27A';
    g.fillText(GLYPHS[k], x, y);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 1;
  return t;
}

const vert = /* glsl */`
attribute vec2 corner;
attribute vec4 aB0;   // x y z kind (0 bar, 1 icon, 2 text)
attribute vec4 aB1;   // bar: hp, hostile, worldWidth, alpha | icon: index, pulse, unused, alpha | text: codesA, codesB, nChars, alpha
uniform vec2 uViewport;
uniform float uScale, uTime;
varying vec2 vUv;
varying vec4 vP;
varying vec2 vPx;
varying float vKind;
void main() {
  vec4 clip = projectionMatrix * viewMatrix * vec4(aB0.xyz, 1.0);
  if (clip.w <= 0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float kind = aB0.w;
  float ppu = projectionMatrix[1][1] * 0.5 * uViewport.y / clip.w;   // pixels per world unit at this depth
  vec2 px; vec2 shift = vec2(0.0);
  if (kind < 0.5) {
    float w = clamp(aB1.z * ppu, 40.0, 80.0) * uScale;
    px = vec2(floor(w), max(5.0, floor(w * 0.085 + 0.5)) );
  } else if (kind < 1.5) {
    float s = clamp(0.55 * ppu, 18.0, 32.0) * uScale * (1.0 + aB1.y * 0.08 * sin(uTime * 9.0));
    px = vec2(s);
    shift.y = s * 0.5;
  } else {
    float h = 21.0 * uScale;
    px = vec2(aB1.z * h * 0.62, h);
  }
  // snap the centre to the pixel grid so 1 px borders stay crisp
  vec2 ndc = clip.xy / clip.w;
  vec2 sp = (ndc * 0.5 + 0.5) * uViewport;
  sp = floor(sp) + mod(px, 2.0) * 0.5;
  sp += corner * px * 0.5 + shift;
  gl_Position = vec4((sp / uViewport * 2.0 - 1.0) * clip.w, 0.0, clip.w);
  vUv = corner * 0.5 + 0.5;
  vPx = px;
  vP = aB1;
  vKind = kind;
}`;

const frag = /* glsl */`
uniform sampler2D uAtlas;
uniform vec3 uGood, uWarn, uBad, uBg, uEdge;
varying vec2 vUv;
varying vec4 vP;
varying vec2 vPx;
varying float vKind;
float glyphCode(float packed, float k) { return mod(floor(packed / pow(16.0, k)), 16.0); }
void main() {
  vec4 c;
  if (vKind < 0.5) {
    vec2 p = vUv * vPx;                       // pixel coordinates inside the bar
    float hp = vP.x;
    vec3 fill = vP.y > 0.5 ? uBad : (hp > 0.6 ? uGood : hp > 0.3 ? uWarn : uBad);
    bool edge = p.x < 1.0 || p.y < 1.0 || p.x > vPx.x - 1.0 || p.y > vPx.y - 1.0;
    float inner = (p.x - 1.0) / max(1.0, vPx.x - 2.0);
    c = edge ? vec4(uEdge, 0.95) : (inner <= hp ? vec4(fill * (0.85 + 0.3 * step(vPx.y * 0.55, p.y)), 1.0) : vec4(uBg, 0.82));
  } else if (vKind < 1.5) {
    vec2 uv = vec2((vP.x + vUv.x) * ${ICELL / AW}, 1.0 - (1.0 - vUv.y) * ${ICELL / AH});
    c = texture2D(uAtlas, uv);
  } else {
    float n = vP.z;
    float ci = min(floor(vUv.x * n), n - 1.0);
    float code = ci < 6.0 ? glyphCode(vP.x, ci) : glyphCode(vP.y, ci - 6.0);
    float fx = fract(vUv.x * n);
    vec2 uv = vec2((code + fx) * ${GW / AW}, 1.0 - (${GY}.0 + (1.0 - vUv.y) * ${GH}.0) / ${AH}.0);
    c = texture2D(uAtlas, uv);
  }
  c.a *= vP.w;
  if (c.a < 0.004) discard;
  gl_FragColor = c;
  #include <colorspace_fragment>
}`;

const S = {
  mesh: null, geo: null, a0: null, a1: null, n: 0,
  kind: null, since: null, hitT: null, lastHp: null, scanPos: 0, iconList: null, nIcons: 0,
  bld: new Map(), ent: new WeakMap(),
  // floaters ring: x y z t0 codesA codesB nChars
  fl: new Float32Array(64 * 7), flHead: 0,
  time: 0, stats: { bars: 0, icons: 0, floaters: 0, bytes: 0 },
  lotTop: null,
};

const lin = (hex) => new THREE.Color(hex);

export function initBillboards(overlay) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  S.a0 = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 4), 4);
  S.a1 = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 4), 4);
  S.a0.setUsage(THREE.DynamicDrawUsage); S.a1.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aB0', S.a0); g.setAttribute('aB1', S.a1);
  g.instanceCount = 0;
  S.geo = g;
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: {
      uAtlas: { value: buildAtlas() }, uViewport: { value: new THREE.Vector2(1720, 720) }, uScale: { value: 1 }, uTime: { value: 0 },
      uGood: { value: lin(0x5fd38a) }, uWarn: { value: lin(0xffb547) }, uBad: { value: lin(0xff4d3d) },
      uBg: { value: lin(0x0d131a) }, uEdge: { value: lin(0x05080b) },
    },
    transparent: true, depthTest: false, depthWrite: false,
  });
  S.mesh = new THREE.Mesh(g, mat);
  S.mesh.frustumCulled = false;
  S.mesh.renderOrder = 30;
  S.mesh.name = 'life-billboards';
  overlay.add(S.mesh);
}

function ensureTiles() {
  if (S.kind && S.kind.length === W.count) return;
  const n = W.count;
  S.kind = new Uint8Array(n).fill(ICON.NONE);
  S.since = new Float32Array(n);
  S.hitT = new Float32Array(n).fill(-1e9);
  S.lastHp = new Uint16Array(n);
  S.iconList = new Int32Array(n);
  S.nIcons = 0; S.scanPos = 0;
  if (W.lotHp) S.lastHp.set(W.lotHp);
}

export function billboardsSetLotTop(fn) { S.lotTop = fn; }
const lotTopY = (i) => (S.lotTop ? S.lotTop(i) : W.h[i] + LOT_TOP[W.lvl[i]] * (0.85 + ((W.style[i] * 37) % 31) / 100));

// lots whose hp went down get their bar for 5 s
export function billboardsOnLotsChanged(dirty) {
  ensureTiles();
  if (!dirty) return;
  for (let k = 0; k < dirty.length; k++) {
    const i = dirty[k];
    const hp = W.lotHp[i];
    if (hp < S.lastHp[i]) S.hitT[i] = S.time;
    S.lastHp[i] = hp;
    // re-evaluate the icon right away
    evalLot(i);
  }
}

function lotProblem(i) {
  if (!W.zone[i] || !W.lvl[i]) return ICON.NONE;
  const f = W.flags[i];
  if (f & LF.RUBBLE) return ICON.NONE;
  if (W.fire[i] > 0) return ICON.FIRE;
  if (f & LF.NO_ROAD_ICON) return ICON.ROAD;
  if (f & LF.NO_POWER_ICON) return ICON.POWER;
  if (f & LF.NO_WATER_ICON) return ICON.WATER;
  if (f & LF.ABANDONED) return ICON.ABANDONED;
  if (f & LF.SHELTER) return ICON.SHELTER;
  if (f & LF.UNDERSTAFFED) return ICON.STAFF;
  return ICON.NONE;
}
function evalLot(i) {
  const k = lotProblem(i);
  if (k !== S.kind[i]) { S.kind[i] = k; S.since[i] = S.time; }
}

// time-sliced rescan (a full pass about every 16 frames) catches flag changes that were never marked dirty
function scan() {
  const n = W.count, step = Math.max(64, (n / 16) | 0);
  const end = Math.min(n, S.scanPos + step);
  for (let i = S.scanPos; i < end; i++) evalLot(i);
  S.scanPos = end >= n ? 0 : end;
  if (S.scanPos === 0 || S.nIcons === 0 || (S.time * 4 | 0) !== (S._lastList || 0)) {
    S._lastList = S.time * 4 | 0;
    let m = 0;
    for (let i = 0; i < n; i++) if (S.kind[i] !== ICON.NONE) S.iconList[m++] = i;
    S.nIcons = m;
  }
}

function put(x, y, z, kind, p0, p1, p2, alpha) {
  if (S.n >= MAX) return;
  const o = S.n++ * 4, A = S.a0.array, B = S.a1.array;
  A[o] = x; A[o + 1] = y; A[o + 2] = z; A[o + 3] = kind;
  B[o] = p0; B[o + 1] = p1; B[o + 2] = p2; B[o + 3] = alpha;
}

// player building problem tracking (by id)
function bldProblem(b) {
  const f = b.fire > 1 ? b.fire / 255 : b.fire || 0;
  if (f > 0) return ICON.FIRE;
  if (b.connected === false && b.type !== 'hq') return ICON.ROAD;
  if (b.powered === false) return ICON.POWER;
  if (b.maxHp && b.hp < b.maxHp * 0.3) return ICON.CRITICAL;
  return ICON.NONE;
}

function hpFrac(o) { return o.maxHp ? Math.max(0, Math.min(1, o.hp / o.maxHp)) : 1; }
function recentHit(o) {
  let rec = S.ent.get(o);
  if (!rec) { rec = { hp: o.hp, t: -1e9 }; S.ent.set(o, rec); }
  if (o.hp < rec.hp - 1e-3 || o.hitT > 0) rec.t = S.time;
  rec.hp = o.hp;
  return S.time - rec.t;
}

// time: life clock (game-scaled seconds). camPos: camera world position.
export function billboardsFrame(time, camera, renderer) {
  if (!S.mesh) return;
  S.time = time;
  ensureTiles();
  if (W.zone) scan();
  S.n = 0;
  const cp = camera.position;
  const hover = G.hover || G.hovered || null;
  const sel = G.selected || null;
  const selLot = sel && sel.lot != null ? sel.lot : -1;
  const hovLot = hover && hover.lot != null ? hover.lot : -1;
  let nb = 0, ni = 0;

  // ---- health bars
  for (const e of G.enemies || []) {
    if (e.gone || e.alive === false || !e.maxHp) continue;
    const since = recentHit(e);
    if (since > 5 && e !== hover && e !== sel) continue;
    if (e.hp >= e.maxHp && e !== hover && e !== sel) continue;
    const r = (e.def && e.def.radius) || 0.4;
    const y = e.y + (e.domain === 'air' ? 0.6 : e.domain === 'sea' ? 0.7 + r * 0.5 : 0.55);
    const a = since > 4 ? Math.max(0, 5 - since) : 1;
    put(e.x, y, e.z, 0, hpFrac(e), 1, 0.6 + r * 0.5, e === hover || e === sel ? 1 : a); nb++;
  }
  for (const u of G.allies || []) {
    if (u.gone || u.alive === false || !u.maxHp || u.state === 'parked') continue;
    const since = recentHit(u);
    if ((since > 5 || u.hp >= u.maxHp) && u !== hover && u !== sel) continue;
    put(u.x, u.y + 0.5, u.z, 0, hpFrac(u), 0, 0.6, since > 4 ? Math.max(0, 5 - since) : 1); nb++;
  }
  for (const b of G.buildings || []) {
    if (!b.maxHp) continue;
    const since = b.lastHit != null ? G.time - b.lastHit : recentHit(b);
    const focus = b === hover || b === sel;
    if (!focus && (since > 5 || b.hp >= b.maxHp)) continue;
    const top = b.type === 'hq' ? 2.0 : 1.25;
    put(b.x, (b.y || 0) + top, b.z, 0, hpFrac(b), 0, b.type === 'hq' ? 1.4 : 0.9, focus ? 1 : since > 4 ? Math.max(0, 5 - since) : 1); nb++;
  }
  // zoned lots hit in the last 5 s
  if (W.lotHp) {
    for (let i = 0, n = W.count; i < n; i++) {
      const since = time - S.hitT[i];
      if (since > 5 && i !== selLot && i !== hovLot) continue;
      if (!W.lvl[i] || !W.zone[i]) continue;
      const max = lotMaxHp(i);
      const frac = max ? Math.min(1, W.lotHp[i] / max) : 1;
      put(W.x[i], lotTopY(i) + 0.35, W.z[i], 0, frac, 0, 0.9, since > 4 ? Math.max(0, 5 - since) : 1); nb++;
    }
  }

  // ---- problem icons
  for (let k = 0; k < S.nIcons; k++) {
    const i = S.iconList[k];
    const kind = S.kind[i];
    if (kind === ICON.NONE) continue;
    const age = time - S.since[i];
    if (age < SHOW_AFTER[kind] && i !== selLot && i !== hovLot) continue;
    const y = lotTopY(i) + 0.45;
    const dx = W.x[i] - cp.x, dy = y - cp.y, dz = W.z[i] - cp.z;
    if (kind !== ICON.FIRE && kind !== ICON.CRITICAL && dx * dx + dy * dy + dz * dz > FAR * FAR) continue;
    const fadeIn = Math.min(1, (age - SHOW_AFTER[kind]) * 3 + (i === selLot || i === hovLot ? 1 : 0));
    put(W.x[i], y, W.z[i], 1, kind, kind === ICON.FIRE ? 1 : 0, 0, Math.max(0, fadeIn)); ni++;
  }
  for (const b of G.buildings || []) {
    const kind = bldProblem(b);
    let rec = S.bld.get(b.id);
    if (!rec) { rec = { kind: ICON.NONE, since: time }; S.bld.set(b.id, rec); }
    if (rec.kind !== kind) { rec.kind = kind; rec.since = time; }
    if (kind === ICON.NONE || time - rec.since < SHOW_AFTER[kind]) continue;
    const y = (b.y || 0) + (b.type === 'hq' ? 2.6 : 1.7);
    const dx = b.x - cp.x, dy = y - cp.y, dz = b.z - cp.z;
    if (kind !== ICON.FIRE && kind !== ICON.CRITICAL && dx * dx + dy * dy + dz * dz > FAR * FAR) continue;
    put(b.x, y, b.z, 1, kind, kind === ICON.FIRE || kind === ICON.CRITICAL ? 1 : 0, 0, Math.min(1, (time - rec.since - SHOW_AFTER[kind]) * 3)); ni++;
  }

  // ---- bounty floaters
  let nf = 0;
  const F = S.fl;
  for (let k = 0; k < 64; k++) {
    const o = k * 7, t0 = F[o + 3];
    if (!F[o + 6]) continue;
    const age = time - t0;
    if (age < 0 || age > 1.2) { if (age > 1.2) F[o + 6] = 0; continue; }
    const q = age / 1.2;
    const rise = 0.8 * (1 - (1 - q) * (1 - q));
    const a = Math.min(1, q * 8) * (1 - Math.max(0, (q - 0.65) / 0.35));
    put(F[o], F[o + 1] + rise, F[o + 2], 2, F[o + 4], F[o + 5], F[o + 6], a); nf++;
  }

  const u = S.mesh.material.uniforms;
  if (renderer) renderer.getDrawingBufferSize(u.uViewport.value);
  u.uScale.value = Math.max(0.8, Math.min(1.3, SETTINGS.hudScale || 1)) * Math.max(0.75, Math.min(1.5, u.uViewport.value.y / 1440 * 1.15));
  u.uTime.value = time;
  S.geo.instanceCount = S.n;
  S.mesh.visible = S.n > 0;
  if (S.n) {
    for (const a of [S.a0, S.a1]) { a.clearUpdateRanges(); a.addUpdateRange(0, S.n * 4); a.needsUpdate = true; }
    Pool.uploaded += S.n * 32;
  }
  S.stats.bars = nb; S.stats.icons = ni; S.stats.floaters = nf; S.stats.bytes = S.n * 32;
}


// FX.bounty(x, y, z, amount): '+$1,250' rising from the wreck
export function bounty(x, y, z, amount) {
  if (!S.mesh) return;
  let v = Math.max(0, Math.round(amount || 0));
  // build glyph codes right to left: digits with thousands separators, then '$' and '+'
  const codes = _codes; let n = 0, d = 0;
  do {
    if (d > 0 && d % 3 === 0) codes[n++] = 12;
    codes[n++] = v % 10; v = Math.floor(v / 10); d++;
  } while (v > 0 && n < 9);
  codes[n++] = 11; codes[n++] = 10;
  let A = 0, B = 0;
  for (let k = 0; k < n; k++) {
    const c = codes[n - 1 - k];           // left to right
    if (k < 6) A += c * Math.pow(16, k); else B += c * Math.pow(16, k - 6);
  }
  const o = S.flHead * 7;
  S.flHead = (S.flHead + 1) & 63;
  const F = S.fl;
  F[o] = x; F[o + 1] = y + 0.3; F[o + 2] = z; F[o + 3] = S.time; F[o + 4] = A; F[o + 5] = B; F[o + 6] = n;
}
const _codes = new Uint8Array(16);

export function billboardsStats() { return S.stats; }
export function billboardsClear() { S.fl.fill(0); S.kind = null; S.bld.clear(); }
export function billboardsWarm() { S.n = 0; put(0, -60, 0, 0, 0.5, 0, 1, 1); put(0, -60, 0, 1, 0, 0, 0, 1); put(0, -60, 0, 2, 0, 0, 3, 1); S.geo.instanceCount = S.n; S.mesh.visible = true; for (const a of [S.a0, S.a1]) { a.clearUpdateRanges(); a.addUpdateRange(0, S.n * 4); a.needsUpdate = true; } }
export { ICON };
