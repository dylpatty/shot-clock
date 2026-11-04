import * as THREE from 'three';
import { W, T, TERRAIN, isLand, treesFor } from './world.js';
import { DIR_X, DIR_Z, SQRT3 } from './hex.js';
import { hash2 } from './rng.js';
import { buildModels, C } from './models.js';
import { BUILDINGS } from './defs.js';
import { G, SETTINGS } from './state.js';
import { Pipeline } from './gfx/post.js';
import { envFromHDR, makeSky, imageTexture } from './gfx/env.js';
import { makeWaterMaterial } from './gfx/water.js';
import { Lighting } from './gfx/lighting.js';
import hdrDay from '../assets/hdri/quarry_01_1k.hdr';
import hdrNight from '../assets/hdri/moonless_golf_1k.hdr';
import waterNormals from '../assets/tex/waternormals.jpg';

export const R = {
  renderer: null, scene: null, camera: null, sun: null, M: null,
  pools: {}, terrain: null, water: null, ghosts: {}, waterTex: null,
  width: 1, height: 1, pixelScale: 1,
};

// ------------------------------------------------------------------ instanced pools

export class Pool {
  constructor(geo, mat, max, opts = {}) {
    const m = new THREE.InstancedMesh(geo, mat, max);
    m.count = 0;
    m.frustumCulled = false;
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.hasColor = opts.colors !== false;
    if (this.hasColor) {
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3);
      m.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }
    if (opts.order != null) m.renderOrder = opts.order;
    this.mesh = m; this.max = max; this.n = 0;
    this.mArr = m.instanceMatrix.array;
    this.cArr = this.hasColor ? m.instanceColor.array : null;
    this.extra = null;
  }
  begin() { this.n = 0; }
  put(x, y, z, yaw = 0, sx = 1, sy = 1, sz = 1, r = 1, g = 1, b = 1) {
    if (this.n >= this.max) return -1;
    const o = this.n * 16, a = this.mArr, c = Math.cos(yaw), s = Math.sin(yaw);
    a[o] = c * sx; a[o + 1] = 0; a[o + 2] = -s * sx; a[o + 3] = 0;
    a[o + 4] = 0; a[o + 5] = sy; a[o + 6] = 0; a[o + 7] = 0;
    a[o + 8] = s * sz; a[o + 9] = 0; a[o + 10] = c * sz; a[o + 11] = 0;
    a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
    if (this.cArr) { const k = this.n * 3; this.cArr[k] = r; this.cArr[k + 1] = g; this.cArr[k + 2] = b; }
    return this.n++;
  }
  putMatrix(m4, r = 1, g = 1, b = 1) {
    if (this.n >= this.max) return -1;
    m4.toArray(this.mArr, this.n * 16);
    if (this.cArr) { const k = this.n * 3; this.cArr[k] = r; this.cArr[k + 1] = g; this.cArr[k + 2] = b; }
    return this.n++;
  }
  end() {
    const m = this.mesh;
    m.count = this.n;
    m.visible = this.n > 0;
    if (!this.n) return;
    const im = m.instanceMatrix;
    im.clearUpdateRanges(); im.addUpdateRange(0, this.n * 16); im.needsUpdate = true;
    if (this.cArr) {
      const ic = m.instanceColor;
      ic.clearUpdateRanges(); ic.addUpdateRange(0, this.n * 3); ic.needsUpdate = true;
    }
    if (this.extra) {
      const e = this.extra;
      e.clearUpdateRanges(); e.addUpdateRange(0, this.n * e.itemSize); e.needsUpdate = true;
    }
  }
}

// ------------------------------------------------------------------ geometry helpers

function hexPrismGeo(bevel = 0.08, drop = 0.05, depth = 4) {
  const pos = [], col = [];
  const P = [], O = [], B = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const cx = Math.cos(a), cz = Math.sin(a);
    P.push([cx * (1 - bevel), 0, cz * (1 - bevel)]);
    O.push([cx, -drop, cz]);
    B.push([cx, -depth, cz]);
  }
  const tri = (a, b, c, ca, cb, cc) => { pos.push(...a, ...b, ...c); col.push(ca, ca, ca, cb, cb, cb, cc, cc, cc); };
  const ctr = [0, 0, 0];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    tri(ctr, P[j], P[i], 1, 1, 1);
    tri(P[i], P[j], O[j], 1, 1, 0.9);
    tri(P[i], O[j], O[i], 1, 0.9, 0.9);
    tri(O[i], O[j], B[j], 0.72, 0.72, 0.38);
    tri(O[i], B[j], B[i], 0.72, 0.38, 0.38);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function hexRingGeo(inner, outer) {
  const g = new THREE.RingGeometry(inner, outer, 6, 1, Math.PI / 2, Math.PI * 2);
  g.rotateX(-Math.PI / 2);
  return g;
}

// ------------------------------------------------------------------ water

const MAP_MIN = -52, MAP_SIZE = 104, MAX_DIST = 9, TEX = 256;

export function buildWaterTexture() {
  const data = new Uint8Array(TEX * TEX).fill(255);
  const dist = new Float32Array(TEX * TEX).fill(MAX_DIST);
  const cell = MAP_SIZE / TEX;
  for (const i of W.coast) {
    const cx = W.x[i], cz = W.z[i];
    const x0 = Math.max(0, Math.floor((cx - MAX_DIST - 1 - MAP_MIN) / cell));
    const x1 = Math.min(TEX - 1, Math.ceil((cx + MAX_DIST + 1 - MAP_MIN) / cell));
    const z0 = Math.max(0, Math.floor((cz - MAX_DIST - 1 - MAP_MIN) / cell));
    const z1 = Math.min(TEX - 1, Math.ceil((cz + MAX_DIST + 1 - MAP_MIN) / cell));
    for (let tz = z0; tz <= z1; tz++) {
      const wz = MAP_MIN + (tz + 0.5) * cell - cz;
      for (let tx = x0; tx <= x1; tx++) {
        const wx = MAP_MIN + (tx + 0.5) * cell - cx;
        // distance to the hexagon's edge (pointy-top, inradius 0.866)
        const ax = Math.abs(wx), az = Math.abs(wz);
        const hd = Math.max(ax, ax * 0.5 + az * 0.866) - 0.866;
        const d = Math.max(0, hd);
        const k = tz * TEX + tx;
        if (d < dist[k]) dist[k] = d;
      }
    }
  }
  for (let k = 0; k < dist.length; k++) data[k] = Math.round((dist[k] / MAX_DIST) * 255);
  if (R.waterTex) R.waterTex.dispose();
  const tex = new THREE.DataTexture(data, TEX, TEX, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  R.waterTex = tex;
  if (R.water) R.water.material.userData.uniforms.uDist.value = tex;
}

// ------------------------------------------------------------------ health bars

const hbVert = /* glsl */`
attribute float aHp;
varying vec2 vUv;
varying float vHp;
void main() {
  vUv = uv; vHp = aHp;
  vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float s = length(instanceMatrix[0].xyz);
  c.xy += position.xy * vec2(0.9, 0.12) * s;
  gl_Position = projectionMatrix * c;
}`;
const hbFrag = /* glsl */`
varying vec2 vUv;
varying float vHp;
void main() {
  float hp = abs(vHp);
  vec3 full = vHp < 0.0 ? vec3(0.95, 0.28, 0.22) : vec3(0.35, 0.9, 0.35);
  vec3 low = vHp < 0.0 ? vec3(0.95, 0.28, 0.22) : vec3(0.95, 0.35, 0.2);
  vec3 col = vUv.x < hp ? mix(low, full, smoothstep(0.2, 0.6, hp)) : vec3(0.1, 0.1, 0.12);
  if (vUv.x < 0.025 || vUv.x > 0.975 || vUv.y < 0.16 || vUv.y > 0.84) col = vec3(0.03);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

class HealthBars extends Pool {
  constructor(max) {
    const mat = new THREE.ShaderMaterial({ vertexShader: hbVert, fragmentShader: hbFrag, depthTest: false, depthWrite: false, transparent: true });
    const geo = new THREE.PlaneGeometry(1, 1);
    const attr = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aHp', attr);
    super(geo, mat, max, { cast: false, receive: false, colors: false, order: 20 });
    this.extra = attr;
  }
  bar(x, y, z, hp, size = 1) {
    const k = this.put(x, y, z, 0, size, size, size);
    if (k >= 0) this.extra.array[k] = hp;
  }
}

// ------------------------------------------------------------------ setup

export function initRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, depth: true });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;
  R.renderer = renderer;

  const scene = new THREE.Scene();
  const fogCol = new THREE.Color(0xb7d3e3);
  scene.fog = new THREE.Fog(fogCol, 110, 420);
  scene.environment = envFromHDR(renderer, hdrDay);
  scene.environmentIntensity = 0.9;
  R.scene = scene;
  R.sky = makeSky();
  scene.add(R.sky);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 2600);
  R.camera = camera;

  const hemi = new THREE.HemisphereLight(0xd6ecff, 0x7d6c52, 0.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.2);
  sun.position.set(-30, 52, 24);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  const sc = sun.shadow.camera;
  sc.left = -46; sc.right = 46; sc.top = 46; sc.bottom = -46; sc.near = 5; sc.far = 140;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.035;
  scene.add(sun, sun.target);
  R.sun = sun;
  R.sky.material.uniforms.sunPosition.value.copy(sun.position).normalize();
  R.post = new Pipeline(renderer, scene, camera);
  applyShadowSetting();

  R.M = buildModels();
  const M = R.M;
  const lit = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.0 });
  R.lit = lit;
  const glow = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const additive = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });

  // terrain
  const terrain = new THREE.InstancedMesh(hexPrismGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }), 4000);
  terrain.count = 0;
  terrain.frustumCulled = false;
  terrain.receiveShadow = true; terrain.castShadow = true;
  terrain.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(4000 * 3).fill(1), 3);
  scene.add(terrain);
  R.terrain = terrain;

  // water
  const flatNormal = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  flatNormal.needsUpdate = true;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2),
    makeWaterMaterial({ normalMap: flatNormal, mapMin: MAP_MIN, mapSize: MAP_SIZE, maxDist: MAX_DIST }));
  water.position.y = -0.02;
  water.receiveShadow = true;
  // drawn after the land so the depth test discards the sea hidden under the island before shading it
  water.renderOrder = 1;
  scene.add(water);
  R.water = water;
  imageTexture(waterNormals, { srgb: false }).then((t) => { water.material.userData.uniforms.uNormal.value = t; });
  R.light = new Lighting({ scene, sun, hemi, sky: R.sky, fog: scene.fog, envDay: scene.environment, envNight: envFromHDR(renderer, hdrNight) });

  const P = R.pools;
  const add = (key, geo, max, mat = lit, opts) => { P[key] = new Pool(geo, mat, max, opts); scene.add(P[key].mesh); };
  add('tree', M.tree, 6000);
  add('rock', M.rock, 1500);
  add('peak', M.peak, 600);
  // roads have no vertex colours, only per-instance ones
  const plain = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  add('roadC', new THREE.CylinderGeometry(0.3, 0.3, 0.05, 6), 3000, plain, { cast: false });
  add('roadS', new THREE.BoxGeometry(1, 0.05, 1).translate(0, 0, 0.5), 12000, plain, { cast: false });
  add('rubble', M.rubble, 400, lit, { cast: false });
  for (const type of Object.keys(BUILDINGS)) add('b_' + type, M[type], type === 'house' ? 600 : type === 'hq' ? 2 : 200);
  add('b_house2', M.house2, 600);
  for (const h of ['mg', 'coastal', 'flak', 'missile', 'radar']) add('h_' + h, M[h + '_head'], 200);
  for (const u of ['gunboat', 'landing', 'destroyer', 'battleship', 'fighter', 'bomber', 'jet']) add('u_' + u, M[u], 120);
  add('u_infantry', M.infantry, 400);
  add('u_soldier', M.soldier, 300);
  add('u_ally_fighter', M.ally_fighter, 80);
  add('marker', M.marker, 300, lit, { cast: false });
  add('arrow', M.arrow, 8, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }), { cast: false, receive: false });
  add('shell', new THREE.SphereGeometry(0.075, 6, 4), 500, glow, { cast: false, receive: false });
  add('bomb', M.bomb, 300, lit, { receive: false });
  add('missileP', M.missileP, 200, lit, { receive: false });
  add('rocketP', M.rocketP, 200, lit, { receive: false });
  add('tracer', new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5), 600, additive, { cast: false, receive: false });
  R.hb = new HealthBars(800);
  scene.add(R.hb.mesh);

  // overlays
  const overlay = (col, op) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthTest: false, depthWrite: false, toneMapped: false });
  R.hover = new THREE.Mesh(hexRingGeo(0.84, 1.0), overlay(0xffffff, 0.85));
  R.hover.renderOrder = 15;
  R.select = new THREE.Mesh(hexRingGeo(0.8, 1.0), overlay(0xffd84a, 0.95));
  R.select.renderOrder = 16;
  R.rangeRing = new THREE.Mesh(new THREE.RingGeometry(0.975, 1.0, 120).rotateX(-Math.PI / 2), overlay(0xffffff, 0.75));
  R.rangeRing.renderOrder = 14;
  R.rangeFill = new THREE.Mesh(new THREE.CircleGeometry(1, 120).rotateX(-Math.PI / 2), overlay(0xffffff, 0.07));
  R.rangeFill.renderOrder = 13;
  for (const o of [R.hover, R.select, R.rangeRing, R.rangeFill]) { o.visible = false; scene.add(o); }
  add('ghostRoad', new THREE.CylinderGeometry(0.92, 0.92, 0.06, 6), 400, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false }), { cast: false, receive: false });
  P.ghostRoad.mesh.renderOrder = 12;

  // building placement ghosts
  const ghostMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.62, depthWrite: false, emissive: 0x000000 });
  R.ghostMat = ghostMat;
  for (const type of Object.keys(BUILDINGS)) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(M[type], ghostMat));
    if (M[type + '_head']) {
      const h = new THREE.Mesh(M[type + '_head'], ghostMat);
      h.position.y = (BUILDINGS[type].weapon && BUILDINGS[type].weapon.headY) || BUILDINGS[type].headY || 0;
      g.add(h);
    }
    g.visible = false;
    g.renderOrder = 11;
    scene.add(g);
    R.ghosts[type] = g;
  }

  R.post.build(SETTINGS.quality || 'high');
  window.addEventListener('resize', resize);
  resize();
}

export function applyShadowSetting() {
  const s = SETTINGS.shadows | 0;
  R.sun.castShadow = s > 0;
  const size = s >= 2 ? 4096 : 2048;
  if (R.sun.shadow.mapSize.x !== size) {
    R.sun.shadow.mapSize.set(size, size);
    if (R.sun.shadow.map) { R.sun.shadow.map.dispose(); R.sun.shadow.map = null; }
  }
  R.renderer.shadowMap.needsUpdate = true;
}

export function resize() {
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.max(0.4, Math.min(1, SETTINGS.renderScale || 1));
  const w = Math.max(1, Math.floor(window.innerWidth * dpr * scale));
  const h = Math.max(1, Math.floor(window.innerHeight * dpr * scale));
  R.width = w; R.height = h; R.pixelScale = dpr * scale;
  R.renderer.setSize(w, h, false);
  if (R.post) R.post.setSize(w, h);
  R.camera.aspect = w / h;
  R.camera.updateProjectionMatrix();
}

// ------------------------------------------------------------------ world sync

const _col = new THREE.Color();
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
let landSlot = null; // tile -> terrain instance

export function rebuildTerrain() {
  const t = R.terrain;
  const arr = t.instanceMatrix.array;
  landSlot = new Int32Array(W.count).fill(-1);
  let n = 0;
  for (const i of W.land) {
    landSlot[i] = n;
    _m4.makeTranslation(W.x[i], W.h[i], W.z[i]);
    _m4.toArray(arr, n * 16);
    n++;
  }
  t.count = n;
  t.instanceMatrix.needsUpdate = true;
  recolorTerrain(null);
}

// dimFn(tileIndex) -> brightness multiplier, or null for normal colours
export function recolorTerrain(dimFn) {
  const t = R.terrain;
  const c = t.instanceColor.array;
  for (const i of W.land) {
    const k = landSlot[i] * 3;
    _col.setHex(TERRAIN[W.type[i]].color);
    let v = 0.92 + hash2(i, 3) * 0.16;
    if (W.ruin[i]) v *= 0.7;
    if (dimFn) v *= dimFn(i);
    c[k] = _col.r * v; c[k + 1] = _col.g * v; c[k + 2] = _col.b * v * (W.type[i] === T.FOREST ? 0.9 : 1);
  }
  t.instanceColor.needsUpdate = true;
}

const _trees = [];
export function rebuildDecor() {
  const P = R.pools;
  P.tree.begin(); P.rock.begin(); P.peak.begin();
  for (const i of W.land) {
    const t = W.type[i];
    if (t === T.FOREST && !W.bld[i] && !W.road[i]) {
      _trees.length = 0;
      treesFor(i, _trees);
      for (let k = 0; k < _trees.length; k += 5) {
        const s = _trees[k + 3], v = 0.85 + _trees[k + 4] * 0.3;
        P.tree.put(_trees[k], _trees[k + 1], _trees[k + 2], _trees[k + 4] * 6, s, s * (0.9 + _trees[k + 4] * 0.3), s, v, v, v);
      }
    } else if (t === T.HILLS && !W.bld[i] && !W.road[i]) {
      const a = hash2(i, 5) * 6.28;
      P.rock.put(W.x[i] + Math.cos(a) * 0.35, W.h[i], W.z[i] + Math.sin(a) * 0.35, a, 1 + hash2(i, 6) * 0.6, 1 + hash2(i, 9), 1 + hash2(i, 6) * 0.6);
    } else if (t === T.MOUNTAIN) {
      const s = 0.85 + hash2(i, 7) * 0.4;
      P.peak.put(W.x[i], W.h[i], W.z[i], 0, s, s * (0.8 + hash2(i, 8) * 0.9), s);
    }
  }
  P.tree.end(); P.rock.end(); P.peak.end();
}

export function rebuildRoads() {
  const P = R.pools;
  P.roadC.begin(); P.roadS.begin();
  _col.setHex(0xcbb68b);
  const cr = _col.r, cg = _col.g, cb = _col.b;
  for (let i = 0; i < W.count; i++) {
    if (!W.road[i]) continue;
    const k = W.conn[i] ? 1 : 0.7;
    const y = W.h[i] + 0.012;
    P.roadC.put(W.x[i], y, W.z[i], 0, 1, 1, 1, cr * k, cg * k, cb * k);
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[i * 6 + d];
      if (j < 0 || !(W.road[j] || W.bld[j])) continue;
      const hm = (W.h[i] + W.h[j]) / 2 + 0.012;
      const dh = hm - y, len = Math.hypot(SQRT3 / 2, dh);
      const yaw = Math.atan2(DIR_X[d], DIR_Z[d]);
      _e.set(-Math.asin(dh / len), yaw, 0, 'YXZ');
      _q.setFromEuler(_e);
      _m4.compose(_p.set(W.x[i], y, W.z[i]), _q, _s.set(0.36, 1, len));
      P.roadS.putMatrix(_m4, cr * k * 0.96, cg * k * 0.96, cb * k * 0.96);
    }
  }
  P.roadC.end(); P.roadS.end();
}

// ------------------------------------------------------------------ thumbnails for the build menu

export function makeThumbnails(types) {
  const out = {};
  const size = 128;
  const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x6c5c46, 2.2));
  const dl = new THREE.DirectionalLight(0xffffff, 2.6);
  dl.position.set(-2, 4, 3);
  scene.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const lit = R.lit;
  const tile = new THREE.Mesh(hexPrismGeo(0.08, 0.05, 0.3), new THREE.MeshLambertMaterial({ vertexColors: true, color: 0x8cbd52 }));
  scene.add(tile);
  const pixels = new Uint8Array(size * size * 4);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const prevTarget = R.renderer.getRenderTarget();
  for (const type of types) {
    const geo = R.M[type];
    if (!geo) continue;
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, lit));
    const def = BUILDINGS[type];
    if (R.M[type + '_head']) {
      const h = new THREE.Mesh(R.M[type + '_head'], lit);
      h.position.y = (def && def.weapon && def.weapon.headY) || (def && def.headY) || 0;
      h.rotation.y = 0.5;
      group.add(h);
    }
    group.rotation.y = -0.5;
    scene.add(group);
    tile.material.color.setHex(TERRAIN[type === 'mine' ? T.HILLS : T.GRASS].color);
    cam.position.set(2.2, 2.3, 2.9);
    cam.lookAt(0, 0.35, 0);
    R.renderer.setRenderTarget(rt);
    R.renderer.setClearColor(0x000000, 0);
    R.renderer.clear();
    R.renderer.render(scene, cam);
    R.renderer.readRenderTargetPixels(rt, 0, 0, size, size, pixels);
    for (let y = 0; y < size; y++) {
      const src = (size - 1 - y) * size * 4, dst = y * size * 4;
      img.data.set(pixels.subarray(src, src + size * 4), dst);
    }
    ctx.putImageData(img, 0, 0);
    out[type] = canvas.toDataURL();
    scene.remove(group);
  }
  R.renderer.setRenderTarget(prevTarget);
  R.renderer.setClearColor(R.scene.background, 1);
  rt.dispose();
  return out;
}
