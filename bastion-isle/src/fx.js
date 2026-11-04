import * as THREE from 'three';
import { R } from './render.js';
import { G } from './state.js';

// Fire-and-forget particles: everything about a particle's life is computed in the vertex shader from
// its spawn attributes, so the CPU only writes a particle once and never touches it again.
const vert = /* glsl */`
attribute vec3 aVel;
attribute vec4 aTime;   // start, life, size0, size1
attribute vec4 aCol0;   // rgb, alpha
attribute vec4 aCol1;   // rgb, gravity
uniform float uTime;
uniform float uScale;
uniform float uDrag;
varying vec4 vCol;
void main() {
  float age = uTime - aTime.x;
  float k = age / aTime.y;
  if (k < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  float dt = (1.0 - exp(-uDrag * age)) / uDrag;
  vec3 p = position + aVel * dt;
  p.y -= 0.5 * aCol1.w * age * age;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(mix(aTime.z, aTime.w, k) * uScale / -mv.z, 280.0);
  float a = aCol0.a * smoothstep(0.0, 0.06, k) * (1.0 - k * k);
  vCol = vec4(mix(aCol0.rgb, aCol1.rgb, k), a);
}`;
const frag = /* glsl */`
varying vec4 vCol;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c) * 4.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(vCol.rgb, vCol.a * (1.0 - d));
  #include <colorspace_fragment>
}`;

class Particles {
  constructor(max, blending, drag) {
    this.max = max; this.head = 0; this.lo = max; this.hi = -1;
    const g = new THREE.BufferGeometry();
    const mk = (name, size) => {
      const a = new THREE.BufferAttribute(new Float32Array(max * size), size);
      a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute(name, a);
      return a;
    };
    this.aP = mk('position', 3); this.aV = mk('aVel', 3); this.aT = mk('aTime', 4); this.aC0 = mk('aCol0', 4); this.aC1 = mk('aCol1', 4);
    // park everything as already expired
    this.aT.array.fill(-1000);
    for (let i = 0; i < max; i++) this.aT.array[i * 4 + 1] = 0.001;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag,
      uniforms: { uTime: { value: 0 }, uScale: { value: 400 }, uDrag: { value: drag } },
      transparent: true, depthWrite: false, blending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = blending === THREE.AdditiveBlending ? 9 : 8;
  }

  emit(x, y, z, vx, vy, vz, life, s0, s1, r0, g0, b0, a, r1, g1, b1, grav) {
    const i = this.head;
    this.head = (i + 1) % this.max;
    const P = this.aP.array, V = this.aV.array, Tm = this.aT.array, C0 = this.aC0.array, C1 = this.aC1.array;
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
    V[i * 3] = vx; V[i * 3 + 1] = vy; V[i * 3 + 2] = vz;
    Tm[i * 4] = G.time; Tm[i * 4 + 1] = life; Tm[i * 4 + 2] = s0; Tm[i * 4 + 3] = s1;
    C0[i * 4] = r0; C0[i * 4 + 1] = g0; C0[i * 4 + 2] = b0; C0[i * 4 + 3] = a;
    C1[i * 4] = r1; C1[i * 4 + 1] = g1; C1[i * 4 + 2] = b1; C1[i * 4 + 3] = grav;
    if (i < this.lo) this.lo = i;
    if (i > this.hi) this.hi = i;
  }

  flush(time, scale) {
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uScale.value = scale;
    if (this.hi < this.lo) return;
    for (const [a, s] of [[this.aP, 3], [this.aV, 3], [this.aT, 4], [this.aC0, 4], [this.aC1, 4]]) {
      a.clearUpdateRanges();
      a.addUpdateRange(this.lo * s, (this.hi - this.lo + 1) * s);
      a.needsUpdate = true;
    }
    this.lo = this.max; this.hi = -1;
  }

  clear() {
    this.aT.array.fill(-1000);
    for (let i = 0; i < this.max; i++) this.aT.array[i * 4 + 1] = 0.001;
    this.lo = 0; this.hi = this.max - 1;
  }
}

let glow, smoke;
export function initFx() {
  glow = new Particles(9000, THREE.AdditiveBlending, 2.2);
  smoke = new Particles(9000, THREE.NormalBlending, 1.1);
  R.scene.add(glow.points, smoke.points);
}

export function flushFx() {
  const scale = R.height * R.camera.projectionMatrix.elements[5] * 0.5;
  glow.flush(G.time, scale);
  smoke.flush(G.time, scale);
}

export function clearFx() { glow.clear(); smoke.clear(); }

const rnd = (a, b) => a + Math.random() * (b - a);
// Colours are linear (the shader converts to sRGB)
const L = (v) => Math.pow(v, 2.2);

export function explosion(x, y, z, scale = 1, onWater = false) {
  const s = scale;
  glow.emit(x, y + 0.2 * s, z, 0, 0.5, 0, 0.18, 2.8 * s, 4.2 * s, 1, 0.9, 0.6, 1, 1, 0.5, 0.2, 0);
  const nf = Math.round(10 * Math.min(2, s));
  for (let i = 0; i < nf; i++) {
    const a = Math.random() * 6.283, sp = rnd(1.5, 4) * s;
    glow.emit(x, y + 0.15, z, Math.cos(a) * sp, rnd(1.5, 4.5) * s, Math.sin(a) * sp, rnd(0.35, 0.65), rnd(0.8, 1.3) * s, 0.25 * s,
      1, L(0.75), L(0.3), 0.95, L(0.7), L(0.12), L(0.03), -1.5);
  }
  const ns = Math.round(8 * Math.min(2, s));
  for (let i = 0; i < ns; i++) {
    const a = Math.random() * 6.283, sp = rnd(0.4, 1.4) * s;
    const g = onWater ? 0.85 : 0.22;
    smoke.emit(x, y + 0.3, z, Math.cos(a) * sp, rnd(0.8, 2.2) * s, Math.sin(a) * sp, rnd(1.4, 2.6), rnd(0.6, 0.9) * s, rnd(1.6, 2.4) * s,
      L(g), L(g), L(g), onWater ? 0.6 : 0.75, L(g * 1.4), L(g * 1.4), L(g * 1.4), -0.4);
  }
  for (let i = 0; i < 6 * s; i++) {
    const a = Math.random() * 6.283, sp = rnd(2, 5) * s;
    glow.emit(x, y + 0.2, z, Math.cos(a) * sp, rnd(3, 7), Math.sin(a) * sp, rnd(0.5, 1.0), 0.18, 0.08, 1, L(0.85), L(0.5), 1, 1, L(0.3), 0, 9);
  }
  if (onWater) splash(x, z, s);
}

export function splash(x, z, s = 1) {
  for (let i = 0; i < 14 * s; i++) {
    const a = Math.random() * 6.283, sp = rnd(0.3, 1.4) * s;
    smoke.emit(x, 0.05, z, Math.cos(a) * sp, rnd(3, 6) * s, Math.sin(a) * sp, rnd(0.7, 1.1), rnd(0.35, 0.6) * s, rnd(0.6, 0.9) * s,
      0.92, 0.97, 1, 0.85, 0.85, 0.95, 1, 9);
  }
  smoke.emit(x, 0.05, z, 0, 0.2, 0, 1.4, 0.8 * s, 2.6 * s, 0.9, 0.97, 1, 0.5, 0.9, 0.97, 1, 0);
}

export function muzzle(x, y, z, s = 1) {
  glow.emit(x, y, z, 0, 0.2, 0, 0.07, 0.7 * s, 0.4 * s, 1, L(0.85), L(0.45), 1, 1, L(0.5), L(0.1), 0);
  smoke.emit(x, y, z, rnd(-0.2, 0.2), 0.5, rnd(-0.2, 0.2), 0.8, 0.25 * s, 0.7 * s, L(0.7), L(0.7), L(0.7), 0.35, L(0.8), L(0.8), L(0.8), -0.3);
}

export function flakBurst(x, y, z, s = 1) {
  glow.emit(x, y, z, 0, 0, 0, 0.12, 1.8 * s, 2.4 * s, 1, L(0.85), L(0.5), 1, 1, L(0.5), 0, 0);
  for (let i = 0; i < 5; i++) {
    smoke.emit(x + rnd(-0.3, 0.3), y + rnd(-0.3, 0.3), z + rnd(-0.3, 0.3), rnd(-0.4, 0.4), rnd(-0.2, 0.4), rnd(-0.4, 0.4), rnd(1.4, 2.0),
      0.7 * s, 1.5 * s, L(0.16), L(0.16), L(0.17), 0.85, L(0.3), L(0.3), L(0.3), 0.15);
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * 6.283, b = rnd(-1, 1);
    glow.emit(x, y, z, Math.cos(a) * 4, b * 4, Math.sin(a) * 4, 0.25, 0.14, 0.05, 1, L(0.8), L(0.4), 1, 1, L(0.4), 0, 4);
  }
}

export function trail(x, y, z, s = 1, dark = false) {
  const g = dark ? 0.15 : 0.8;
  smoke.emit(x, y, z, rnd(-0.1, 0.1), rnd(0, 0.2), rnd(-0.1, 0.1), dark ? 1.6 : 1.0, 0.2 * s, 0.7 * s, L(g), L(g), L(g), dark ? 0.7 : 0.5, L(g + 0.1), L(g + 0.1), L(g + 0.1), -0.2);
  if (!dark) glow.emit(x, y, z, 0, 0, 0, 0.08, 0.35 * s, 0.1, 1, L(0.7), L(0.3), 1, 1, L(0.4), 0, 0);
}

export function fire(x, y, z, s = 1) {
  glow.emit(x + rnd(-0.2, 0.2) * s, y, z + rnd(-0.2, 0.2) * s, rnd(-0.1, 0.1), rnd(0.8, 1.6), rnd(-0.1, 0.1), rnd(0.4, 0.7), 0.6 * s, 0.15 * s,
    1, L(0.6), L(0.15), 0.9, L(0.7), L(0.1), 0, -0.5);
}

export function smokePuff(x, y, z, s = 1, g = 0.2) {
  smoke.emit(x + rnd(-0.2, 0.2) * s, y, z + rnd(-0.2, 0.2) * s, rnd(-0.15, 0.15), rnd(0.6, 1.1), rnd(-0.15, 0.15), rnd(2.2, 3.2), 0.4 * s, 1.6 * s,
    L(g), L(g), L(g), 0.6, L(g + 0.25), L(g + 0.25), L(g + 0.25), -0.15);
}

export function wake(x, z, s = 1) {
  smoke.emit(x + rnd(-0.08, 0.08), 0.04, z + rnd(-0.08, 0.08), rnd(-0.15, 0.15), 0, rnd(-0.15, 0.15), rnd(1.4, 2.0), 0.3 * s, 0.9 * s, 0.95, 0.98, 1, 0.5, 0.9, 0.97, 1, 0);
}

export function dust(x, y, z, s = 1) {
  for (let i = 0; i < 10 * s; i++) {
    const a = Math.random() * 6.283, sp = rnd(0.5, 1.6);
    smoke.emit(x, y + 0.05, z, Math.cos(a) * sp, rnd(0.2, 0.8), Math.sin(a) * sp, rnd(0.8, 1.4), 0.3 * s, 0.9 * s, L(0.72), L(0.62), L(0.48), 0.6, L(0.8), L(0.72), L(0.6), 0.5);
  }
}

export function sparks(x, y, z) {
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * 6.283;
    glow.emit(x, y, z, Math.cos(a) * 2, rnd(1, 3), Math.sin(a) * 2, 0.25, 0.12, 0.05, 1, L(0.85), L(0.5), 1, 1, L(0.4), 0, 9);
  }
}
