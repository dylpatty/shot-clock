import * as THREE from 'three';
import { U } from './uniforms.js';

// Day/night cycle and sun/shadow management (SPEC.md section 4; UX review 15, rendering review 8).
// The cycle position c in [0,1) is warped so night is short and readable: 8/12 day, 1/12 golden dusk,
// 2/12 night, 1/12 golden dawn. Every value here is a uniform or light parameter, never a shader-program change.

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const D2R = Math.PI / 180;

// sun elevation keyframes (degrees) over the cycle
const KEYS = [[0, 8], [0.333, 62], [0.667, 8], [0.75, -6], [0.833, -24], [0.917, -6], [1, 8]];
function elevationAt(c) {
  for (let k = 0; k < KEYS.length - 1; k++) {
    const [c0, e0] = KEYS[k], [c1, e1] = KEYS[k + 1];
    if (c >= c0 && c <= c1) { const t = (c - c0) / (c1 - c0); return e0 + (e1 - e0) * (0.5 - 0.5 * Math.cos(Math.PI * t)); }
  }
  return 8;
}

// mood keys: [elevation threshold, values]
const C = (h) => new THREE.Color(h);
const MOODS = {
  noon: { sun: C(0xfff3e0), sunI: 3.0, sky: C(0xcfe3ff), ground: C(0x6b604e), hemiI: 0.45, env: 1.0, fog: C(0xbcd8ea), zenith: C(0x5b8fc7), night: 0 },
  golden: { sun: C(0xffb36b), sunI: 2.1, sky: C(0xffd2a8), ground: C(0x6b5a48), hemiI: 0.42, env: 0.72, fog: C(0xf2c39a), zenith: C(0x6f86b8), night: 0.15 },
  blue: { sun: C(0x9db4ff), sunI: 0.0, sky: C(0x5a6a9a), ground: C(0x1c2028), hemiI: 0.38, env: 0.34, fog: C(0x4b5a80), zenith: C(0x1d2a4f), night: 0.72 },
  night: { sun: C(0x9db4ff), sunI: 0.95, sky: C(0x1b2a44), ground: C(0x0e1218), hemiI: 0.36, env: 0.4, fog: C(0x18223a), zenith: C(0x070b18), night: 1 },
};
const _a = new THREE.Color(), _b = new THREE.Color();

function blendMood(out, A, B, t) {
  out.sun.copy(A.sun).lerp(B.sun, t); out.sky.copy(A.sky).lerp(B.sky, t); out.ground.copy(A.ground).lerp(B.ground, t);
  out.fog.copy(A.fog).lerp(B.fog, t); out.zenith.copy(A.zenith).lerp(B.zenith, t);
  out.sunI = A.sunI + (B.sunI - A.sunI) * t; out.hemiI = A.hemiI + (B.hemiI - A.hemiI) * t;
  out.env = A.env + (B.env - A.env) * t; out.night = A.night + (B.night - A.night) * t;
}

export class Lighting {
  constructor({ scene, sun, hemi, sky, fog, envDay, envNight }) {
    Object.assign(this, { scene, sun, hemi, sky, fog, envDay, envNight });
    this.cycle = 0.25;
    this.night = 0;
    this.dayLight = 1;
    this.elevation = 40;
    this.sunDir = new THREE.Vector3(0.4, 0.8, 0.3).normalize();     // direction the visible sun/moon is in
    this.lightDir = new THREE.Vector3(0.4, 0.8, 0.3).normalize();   // direction used for the shadow light
    this.mood = { sun: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color(), fog: new THREE.Color(), zenith: new THREE.Color(), sunI: 0, hemiI: 0, env: 1, night: 0 };
    this.isMoon = false;
    this.shadowExtent = 40;
    this._snapDir = new THREE.Vector3();
  }

  // Clock as hours (0-24) for the HUD; day runs 06:00-18:00 over the day part of the cycle
  hours() {
    const c = this.cycle;
    const h = c < 0.75 ? 6 + (c / 0.75) * 12 : 18 + ((c - 0.75) / 0.25) * 12;
    return h % 24;
  }

  // c: cycle position in [0,1). Mode 'day' and 'golden' lock it.
  update(c) {
    this.cycle = ((c % 1) + 1) % 1;
    const elev = elevationAt(this.cycle);
    this.elevation = elev;
    // azimuth sweeps 110 -> 250 degrees across the lit part of the cycle
    const dayPart = Math.min(1, this.cycle / 0.75);
    const az = (110 + 140 * dayPart) * D2R;

    // mood from elevation
    const m = this.mood;
    if (elev >= 30) blendMood(m, MOODS.noon, MOODS.noon, 0);
    else if (elev >= 8) blendMood(m, MOODS.golden, MOODS.noon, smooth(8, 30, elev));
    else if (elev >= -4) blendMood(m, MOODS.blue, MOODS.golden, smooth(-4, 8, elev));
    else blendMood(m, MOODS.night, MOODS.blue, smooth(-14, -4, elev));

    // visible sun direction (can sink below the horizon)
    const e = elev * D2R;
    this.sunDir.set(Math.cos(az) * Math.cos(e), Math.sin(e), Math.sin(az) * Math.cos(e));

    // the shadow-casting light: sun while up, moon at night; elevation clamped 15-62 degrees
    this.isMoon = elev < -4;
    let le, la;
    if (this.isMoon) { le = 40 * D2R; la = 300 * D2R; } else { le = Math.min(62, Math.max(15, elev)) * D2R; la = az; }
    // quantise to 0.25 degree steps so shadows do not crawl every frame
    const q = 0.25 * D2R;
    le = Math.round(le / q) * q; la = Math.round(la / q) * q;
    this.lightDir.set(Math.cos(la) * Math.cos(le), Math.sin(le), Math.sin(la) * Math.cos(le));

    // fade the key light through blue hour, then bring the moon up
    let keyI;
    if (elev > 2) keyI = m.sunI * smooth(2, 10, elev);
    else if (elev > -4) keyI = 0;
    else keyI = MOODS.night.sunI * smooth(-4, -12, elev);
    this.sun.color.copy(this.isMoon ? MOODS.night.sun : m.sun);
    this.sun.intensity = keyI;
    this.sun.shadow.intensity = this.isMoon ? 0.6 : 1;

    this.hemi.color.copy(m.sky);
    this.hemi.groundColor.copy(m.ground);
    this.hemi.intensity = m.hemiI;
    const env = m.night > 0.6 && this.envNight ? this.envNight : this.envDay;
    if (this.scene.environment !== env) this.scene.environment = env;
    this.scene.environmentIntensity = m.env;
    this.fog.color.copy(m.fog);

    this.night = m.night;
    this.dayLight = Math.max(0, Math.min(1, keyI / 3));
    U.uNight.value = m.night;
    U.uDayLight.value = this.dayLight;
    if (this.sky && this.sky.userData.update) this.sky.userData.update(this);
  }

  // Keep a sharp shadow map over what the camera is looking at; snap to texels so it does not shimmer.
  fitShadow(cx, cz, viewDist) {
    const s = this.sun;
    const ext = Math.ceil(Math.min(75, Math.max(14, viewDist * 0.95)));
    const size = s.shadow.mapSize.x;
    const cam = s.shadow.camera;
    if (cam.right !== ext) {
      cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext;
      cam.near = 1; cam.far = 240;
      cam.updateProjectionMatrix();
    }
    const L = this.lightDir;
    // light-space basis
    const fwd = _v1.copy(L).negate();
    const right = _v2.crossVectors(fwd, UP).normalize();
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    const up = _v3.crossVectors(right, fwd).normalize();
    const texel = (2 * ext) / size;
    // snap the centre in light space
    const px = cx * right.x + cz * right.z, py = cx * up.x + cz * up.z, pz = cx * fwd.x + cz * fwd.z;
    const sx = Math.floor(px / texel) * texel, sy = Math.floor(py / texel) * texel;
    const tx = right.x * sx + up.x * sy + fwd.x * pz, ty = right.y * sx + up.y * sy + fwd.y * pz, tz = right.z * sx + up.z * sy + fwd.z * pz;
    s.target.position.set(tx, ty, tz);
    s.position.set(tx + L.x * 120, ty + L.y * 120, tz + L.z * 120);
    s.target.updateMatrixWorld();
    this.shadowExtent = ext;
    s.shadow.bias = -0.0002;
    s.shadow.normalBias = 1.25 * texel;
  }
}
const UP = new THREE.Vector3(0, 1, 0);
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
export { MOODS };
