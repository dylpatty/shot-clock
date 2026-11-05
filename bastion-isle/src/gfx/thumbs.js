import * as THREE from 'three';
import { getModels, modelKey, headKey, writeSpin } from './models.js';

// Build-menu card thumbnails and raid-clock enemy silhouettes, rendered ONCE at startup from the real models into
// PNG data URLs (UX review concrete specs 4, should_change 8, 17).
//
// Program hygiene: the thumbnail scene copies the main scene's light rig shape (1 DirectionalLight with castShadow,
// 1 HemisphereLight, scene.environment, a Fog) and draws every model as an InstancedMesh with instanceColor using the
// shared uber materials, into a linear float render target like the composer does. Pass the main scene's
// environment texture (opts.environment) and these renders reuse the game's uber program: no extra programs.
// Tone mapping (Neutral) and sRGB encoding are applied on the CPU when the pixels are read back.

const _box = new THREE.Box3(), _b2 = new THREE.Box3(), _v = new THREE.Vector3(), _m = new THREE.Matrix4();

function makeStage(renderer, opts, golden) {
  const scene = new THREE.Scene();
  if (opts.environment) scene.environment = opts.environment;
  scene.environmentIntensity = opts.envIntensity != null ? opts.envIntensity : golden ? 0.75 : 1.0;
  scene.fog = new THREE.Fog(0xffffff, 1e4, 2e4);
  const hemi = new THREE.HemisphereLight(golden ? 0xffd2a8 : 0xcfe3ff, golden ? 0x6b5a48 : 0x6b604e, golden ? 0.45 : 0.45);
  const sun = new THREE.DirectionalLight(golden ? 0xffb878 : 0xfff3e0, golden ? 2.6 : 3.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.01;
  scene.add(hemi, sun, sun.target);
  return { scene, sun, hemi };
}

function instanced(entry) {
  const m = new THREE.InstancedMesh(entry.geometry, entry.material, 1);
  m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(3).fill(1), 3);
  m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  return m;
}

function setInst(mesh, x, y, z, yaw, s = 1, col) {
  _m.makeRotationY(yaw).scale(_v.set(s, s, s)).setPosition(x, y, z);
  mesh.setMatrixAt(0, _m);
  mesh.instanceMatrix.needsUpdate = true;
  if (col) { mesh.instanceColor.setXYZ(0, col[0], col[1], col[2]); mesh.instanceColor.needsUpdate = true; }
}

// resolve 'coastal' | 'coastal@3' | registry key into the parts to draw
function partsFor(R, key) {
  let [type, lvl] = key.split('@');
  lvl = +(lvl || 1);
  const k = R[type] && !lvl ? type : modelKey(type, lvl) || type;
  const e = R[k];
  if (!e) return null;
  const parts = [{ entry: e, x: 0, y: 0, z: 0, yaw: 0 }];
  if (e.head) parts.push({ entry: R[e.head], x: 0, y: e.headY, z: 0, yaw: 0.45 });
  if (e.rotor) parts.push({ entry: R[e.rotor], x: 0, y: e.rotorY, z: e.rotorZ, yaw: 0, spin: 0.3 });
  if (e.spots) for (const [sx, sz, syaw, ss] of e.spots) parts.push({ entry: R.ally_fighter, x: sx, y: 0.05, z: sz, yaw: syaw, s: ss });
  return { parts, cat: e.cat };
}

function rtFor(renderer, w, h) {
  return new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType, depthBuffer: true, samples: 0 });
}

const neutral = (c) => {
  // three.js NeutralToneMapping (Khronos PBR Neutral) per channel triple
  const sc = 0.8 - 0.04, desat = 0.15;
  let [r, g, b] = c;
  const x = Math.min(r, g, b), off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  r -= off; g -= off; b -= off;
  const peak = Math.max(r, g, b);
  if (peak < sc) return [r, g, b];
  const d = 1 - sc, np = 1 - (d * d) / (peak + d - sc), k = np / peak;
  r *= k; g *= k; b *= k;
  const gg = 1 - 1 / (desat * (peak - np) + 1);
  return [r + (np - r) * gg, g + (np - g) * gg, b + (np - b) * gg];
};
const enc = (v) => { v = Math.max(0, Math.min(1, v)); return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); };

// read a float RT, box-downsample by ss, tone map + sRGB, return a canvas
function readBack(renderer, rt, W, H, ss, mode, color) {
  const px = new Float32Array(W * H * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
  const w = W / ss, h = H / ss;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const n = ss * ss;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let j = 0; j < ss; j++) for (let i = 0; i < ss; i++) {
      const k = (((H - 1 - (y * ss + j)) * W) + x * ss + i) * 4;
      const al = Math.min(1, Math.max(0, px[k + 3]));
      r += px[k] * al; g += px[k + 1] * al; b += px[k + 2] * al; a += al;
    }
    const o = (y * w + x) * 4;
    const A = a / n;
    if (mode === 'mask') {
      img.data[o] = color[0]; img.data[o + 1] = color[1]; img.data[o + 2] = color[2]; img.data[o + 3] = Math.round(A * 255);
    } else {
      const t = a > 0 ? neutral([r / a, g / a, b / a]) : [0, 0, 0];
      img.data[o] = enc(t[0]); img.data[o + 1] = enc(t[1]); img.data[o + 2] = enc(t[2]); img.data[o + 3] = Math.round(A * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function withState(renderer, fn) {
  const prevRT = renderer.getRenderTarget();
  const prevClear = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
  const prevAuto = renderer.autoClear, prevShadowUpd = renderer.shadowMap.autoUpdate;
  renderer.shadowMap.autoUpdate = true;
  try { return fn(); } finally {
    renderer.setRenderTarget(prevRT);
    renderer.setClearColor(prevClear, prevAlpha);
    renderer.autoClear = prevAuto;
    renderer.shadowMap.autoUpdate = prevShadowUpd;
    renderer.shadowMap.needsUpdate = true;
  }
}

// Card thumbnails. keys: structure types ('coastal'), 'type@level' ('coastal@3') or any registry key.
// opts: { width = 176, height = 116, ss = 2, environment (main scene.environment!), envIntensity, tile = true,
//         yaw = -0.6 (view azimuth), pitch = 0.5, golden = true, exposure = 1.0 }
// Returns { key: 'data:image/png;base64,...' } with a transparent background.
export function makeThumbnails(renderer, keys, opts = {}) {
  const R = getModels();
  const W0 = opts.width || 176, H0 = opts.height || 116, ss = opts.ss || 2;
  const W = W0 * ss, H = H0 * ss;
  const out = {};
  withState(renderer, () => {
    const { scene, sun } = makeStage(renderer, opts, opts.golden !== false);
    const cam = new THREE.PerspectiveCamera(opts.fov || 24, W / H, 0.05, 200);
    const rt = rtFor(renderer, W, H);
    const tile = opts.tile !== false ? instanced(R.thumb_tile) : null;
    if (tile) { setInst(tile, 0, 0, 0, 0); scene.add(tile); }
    const meshes = new Map();
    const exposure = opts.exposure || 1;
    for (const key of keys) {
      const p = partsFor(R, key);
      if (!p) continue;
      const added = [];
      _box.makeEmpty();
      for (const part of p.parts) {
        const mesh = instanced(part.entry);
        if (part.spin != null) {
          const fake = { mArr: mesh.instanceMatrix.array, cArr: null, n: 0, max: 1 };
          writeSpin(fake, 0, part.x, part.y, part.z, part.yaw, part.spin, 1);
          mesh.instanceMatrix.needsUpdate = true;
        } else setInst(mesh, part.x, part.y, part.z, part.yaw, part.s || 1);
        scene.add(mesh); added.push(mesh);
        mesh.updateMatrixWorld();
        _b2.copy(part.entry.geometry.boundingBox);
        mesh.getMatrixAt(0, _m);
        _b2.applyMatrix4(_m);
        _box.union(_b2);
      }
      const unitLike = p.cat !== 'structure';
      if (tile) tile.visible = !unitLike;
      // frame: fit the bounding sphere of the model (tile counted only partially so towers fill the card)
      const ctr = _box.getCenter(new THREE.Vector3()), size = _box.getSize(new THREE.Vector3());
      const rad = Math.max(0.3, 0.5 * Math.hypot(size.x, size.y * 1.1, size.z));
      const yaw = opts.yaw != null ? opts.yaw : -0.6, pitch = opts.pitch != null ? opts.pitch : 0.5;
      const fovV = THREE.MathUtils.degToRad(cam.fov), fovH = 2 * Math.atan(Math.tan(fovV / 2) * cam.aspect);
      const dist = rad / Math.sin(Math.min(fovV, fovH) / 2) * 0.92;
      const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
      cam.position.copy(ctr).addScaledVector(dir, dist);
      cam.near = dist * 0.05; cam.far = dist * 4;
      cam.lookAt(ctr);
      cam.updateProjectionMatrix();
      // golden-hour key light from the front-left, low
      const L = new THREE.Vector3(Math.sin(yaw - 0.9), 0.55, Math.cos(yaw - 0.9)).normalize();
      sun.position.copy(ctr).addScaledVector(L, rad * 6);
      sun.target.position.copy(ctr);
      sun.target.updateMatrixWorld();
      const sc = sun.shadow.camera;
      sc.left = -rad * 1.6; sc.right = rad * 1.6; sc.top = rad * 1.6; sc.bottom = -rad * 1.6; sc.near = 0.1; sc.far = rad * 14;
      sc.updateProjectionMatrix();
      sun.intensity = (opts.golden !== false ? 2.6 : 3.0) * exposure;
      renderer.setRenderTarget(rt);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(scene, cam);
      out[key] = readBack(renderer, rt, W, H, ss, 'color').toDataURL('image/png');
      for (const m of added) { scene.remove(m); m.dispose(); }
    }
    meshes.clear();
    rt.dispose();
    if (sun.shadow.map) sun.shadow.map.dispose();
    if (tile) tile.dispose();
  });
  return out;
}

// Raid-clock silhouettes: orthographic, flat colour from the real model's coverage.
// Ships and infantry: side view, bow to the right, above the waterline. Aircraft: plan view, nose to the right.
// opts: { width = 128, height = 64, ss = 3, color = '#FF4D3D', pad = 0.06, environment }
export function makeSilhouettes(renderer, keys, opts = {}) {
  const R = getModels();
  const W0 = opts.width || 128, H0 = opts.height || 64, ss = opts.ss || 3;
  const W = W0 * ss, H = H0 * ss;
  // sRGB bytes of the colour token
  const c = new THREE.Color(); c.setStyle(opts.color || '#ff4d3d', THREE.SRGBColorSpace);
  const srgb = c.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
  const rgb = [Math.round(srgb.r * 255), Math.round(srgb.g * 255), Math.round(srgb.b * 255)];
  const out = {};
  withState(renderer, () => {
    const { scene } = makeStage(renderer, opts, false);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
    const rt = rtFor(renderer, W, H);
    const pad = opts.pad != null ? opts.pad : 0.06;
    for (const key of keys) {
      const e = R[key];
      if (!e) continue;
      const mesh = instanced(e);
      setInst(mesh, 0, 0, 0, 0);
      mesh.castShadow = false;
      scene.add(mesh);
      const bb = e.geometry.boundingBox;
      const air = ['fighter', 'bomber', 'jet', 'ally_fighter'].includes(key) || /jet|fighter|bomber/.test(key);
      const aspect = W / H;
      const fit = (hw, hh) => {
        let fw = hw * (1 + pad * 2), fh = hh * (1 + pad * 2);
        if (fw / fh > aspect) fh = fw / aspect; else fw = fh * aspect;
        cam.left = -fw; cam.right = fw; cam.top = fh; cam.bottom = -fh;
        return [fw, fh];
      };
      if (air) {
        // plan view from above, nose (+z) to screen right: camera up = +x
        const zc = (bb.min.z + bb.max.z) / 2, xc = (bb.min.x + bb.max.x) / 2;
        fit((bb.max.z - bb.min.z) / 2, (bb.max.x - bb.min.x) / 2);
        cam.up.set(1, 0, 0);
        cam.position.set(xc, 50, zc); cam.lookAt(xc, 0, zc);
      } else {
        // side view from -x, bow (+z) to screen right; ships sit on the bottom edge (nothing below the waterline)
        const ship = bb.min.y < -0.01;
        const y0 = ship ? 0.0 : bb.min.y, y1 = bb.max.y;
        const zc = (bb.min.z + bb.max.z) / 2;
        const [, fh] = fit((bb.max.z - bb.min.z) / 2, (y1 - y0) / 2);
        const yc = ship ? y0 + fh - (y1 - y0) * pad : (y0 + y1) / 2;
        cam.up.set(0, 1, 0);
        cam.position.set(-50, yc, zc); cam.lookAt(0, yc, zc);
      }
      cam.near = 1; cam.far = 100;
      cam.updateProjectionMatrix();
      renderer.setRenderTarget(rt);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(scene, cam);
      out[key] = readBack(renderer, rt, W, H, ss, 'mask', rgb).toDataURL('image/png');
      scene.remove(mesh); mesh.dispose();
    }
    rt.dispose();
    scene.traverse((o) => { if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose(); });
  });
  return out;
}
