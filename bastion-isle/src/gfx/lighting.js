import * as THREE from 'three';

// Day/night cycle and sun/shadow management.
// tod: time of day in [0, 1): 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset.

const _c = new THREE.Color(), _c2 = new THREE.Color();
const _v = new THREE.Vector3(), _m = new THREE.Matrix4();
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const SKY_DAY = new THREE.Color(0xb9d6e8), SKY_DUSK = new THREE.Color(0xe7b48f), SKY_NIGHT = new THREE.Color(0x0d1726);
const SUN_NOON = new THREE.Color(0xfff3e2), SUN_LOW = new THREE.Color(0xffa45c), MOON = new THREE.Color(0x9db8ff);

export class Lighting {
  constructor({ scene, sun, hemi, sky, fog, envDay, envNight }) {
    Object.assign(this, { scene, sun, hemi, sky, fog, envDay, envNight });
    this.tod = 0.38;
    this.night = 0;        // 0 day .. 1 full night: drives windows, street lights, headlights
    this.dusk = 0;         // warm light amount
    this.sunDir = new THREE.Vector3(0.4, 0.8, 0.3).normalize();
    this.azimuth = 0.6;    // rotates the whole sun arc so shadows fall at a pleasant angle
    this.shadowExtent = 40;
    this.mapSize = 2048;
  }

  // Advance the clock and update every light-related value
  update(tod) {
    this.tod = ((tod % 1) + 1) % 1;
    const ang = (this.tod - 0.25) * Math.PI * 2;  // 0 at sunrise, PI/2 at noon
    const elev = Math.sin(ang);                    // -1..1
    const sunUp = elev > -0.04;
    // sun travels east to west on a tilted arc
    const az = this.azimuth + Math.cos(ang) * 1.25;
    const e = Math.max(elev, 0.06);
    const sx = Math.cos(az) * Math.cos(Math.asin(Math.min(0.92, e))), sz = Math.sin(az) * Math.cos(Math.asin(Math.min(0.92, e)));
    this.sunDir.set(sx, Math.min(0.92, e) * 1.0, sz).normalize();

    const day = smooth(-0.08, 0.18, elev);         // 0 night .. 1 day
    this.night = 1 - smooth(-0.12, 0.08, elev);
    this.dusk = smooth(-0.1, 0.05, elev) * (1 - smooth(0.12, 0.42, elev));

    // sun or moon
    const moon = !sunUp;
    if (moon) {
      // moon opposite-ish, high and cold
      this.sunDir.set(-Math.cos(this.azimuth) * 0.45, 0.82, -Math.sin(this.azimuth) * 0.45).normalize();
      this.sun.color.copy(MOON);
      this.sun.intensity = 0.55 * this.night;
    } else {
      _c.copy(SUN_LOW).lerp(SUN_NOON, smooth(0.04, 0.45, elev));
      this.sun.color.copy(_c);
      this.sun.intensity = 3.3 * smooth(-0.04, 0.16, elev) + 0.15;
    }

    // ambient: sky dome light and image-based lighting
    _c.copy(SKY_NIGHT).lerp(SKY_DAY, day);
    _c2.copy(SKY_DUSK);
    _c.lerp(_c2, this.dusk * 0.55);
    this.hemi.color.copy(_c);
    this.hemi.groundColor.setHex(0x6f604a).multiplyScalar(0.25 + 0.75 * day);
    this.hemi.intensity = 0.18 + 0.22 * day;
    const wantNight = this.night > 0.6;
    const env = wantNight && this.envNight ? this.envNight : this.envDay;
    if (this.scene.environment !== env) this.scene.environment = env;
    this.scene.environmentIntensity = wantNight ? 0.35 : 0.12 + 0.88 * day * (1 - this.dusk * 0.25);

    // fog/horizon colour follows the sky
    this.fog.color.copy(_c).multiplyScalar(wantNight ? 0.9 : 1);

    // physical sky
    if (this.sky) {
      const u = this.sky.material.uniforms;
      _v.set(Math.cos(az) * Math.cos(Math.asin(Math.max(-1, Math.min(1, elev)))), elev, Math.sin(az) * Math.cos(Math.asin(Math.max(-1, Math.min(1, elev))))).normalize();
      u.sunPosition.value.copy(_v);
      u.rayleigh.value = 1.2 + this.dusk * 1.6;
      u.turbidity.value = 5 + this.dusk * 5;
      this.sky.visible = true;
    }
  }

  // Keep a sharp shadow map over what the camera is looking at; snap to texels so it does not shimmer.
  fitShadow(cx, cz, viewDist) {
    const s = this.sun;
    const ext = Math.min(70, Math.max(16, viewDist * 0.95));
    const size = s.shadow.mapSize.x;
    const cam = s.shadow.camera;
    if (cam.right !== ext) {
      cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext;
      cam.updateProjectionMatrix();
    }
    cam.near = 1; cam.far = 220;
    // snap the centre to whole shadow-map texels in light space
    const texel = (2 * ext) / size;
    _m.lookAt(_v.set(0, 0, 0), this.sunDir, THREE.Object3D.DEFAULT_UP);
    const inv = _m.clone().invert();
    const p = new THREE.Vector3(cx, 0, cz).applyMatrix4(inv);
    p.x = Math.round(p.x / texel) * texel;
    p.y = Math.round(p.y / texel) * texel;
    p.applyMatrix4(_m);
    s.target.position.copy(p);
    s.position.copy(p).addScaledVector(this.sunDir, 110);
    s.target.updateMatrixWorld();
    this.shadowExtent = ext;
    s.shadow.bias = -0.00025 * (ext / 30);
    s.shadow.normalBias = 0.02 + 0.02 * (ext / 40);
  }
}
