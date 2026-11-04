// Visual test harness for gfx modules (see SPEC.md section 5). Import it from a demo entry, build with build.mjs,
// open the generated HTML through the static server and screenshot it with shoot.cjs.
//
//   import { H } from '../harness.js';
//   await H.init({ seed: 7, city: true });          // world + fake city in W/G
//   H.basicGround();                                  // optional placeholder terrain + water
//   ... add your module's meshes to H.scene, use H.U uniforms ...
//   H.onFrame((dt, t) => { ... });                    // per-frame hook
//   H.setCam({ x: 0, z: 0, dist: 30, yaw: 0.6, tilt: 0 }); H.setTod(0.5);
//   H.start();                                        // sets window.__ready after warm-up frames
import * as THREE from 'three';
import { generateWorld, W, T, TERRAIN, isLand, LF, ZONE } from '../../src/world.js';
import { G } from '../../src/state.js';
import { Pipeline } from '../../src/gfx/post.js';
import { envFromHDR, makeSky } from '../../src/gfx/env.js';
import { Lighting } from '../../src/gfx/lighting.js';
import { U, MAP_MIN, MAP_SIZE } from '../../src/gfx/uniforms.js';
import { hexDist } from '../../src/hex.js';
import { mulberry32 } from '../../src/rng.js';
import hdrDay from '../../assets/hdri/quarry_01_1k.hdr';
import hdrNight from '../../assets/hdri/moonless_golf_1k.hdr';

const q = new URLSearchParams(location.search);
export const H = {
  THREE, W, G, U, T, LF, ZONE, MAP_MIN, MAP_SIZE,
  scene: null, camera: null, renderer: null, post: null, light: null,
  cam: { x: 0, z: 0, dist: 34, yaw: 0.7, tilt: 0 },
  tod: q.has('tod') ? +q.get('tod') : 0.4,
  frameFns: [],
  quality: q.get('quality') || 'high',
  stats: {},
};

H.init = async function ({ seed = +(q.get('seed') || 7), city = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh';
  document.body.style.margin = '0';
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;
  renderer.debug.checkShaderErrors = true; // the harness wants errors
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbcd8ea, 120, 420);
  scene.environment = envFromHDR(renderer, hdrDay);
  const sky = makeSky(); scene.add(sky);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 2600);
  const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x6b604e, 0.4); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3e0, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun, sun.target);
  Object.assign(H, { renderer, scene, camera, sun, hemi, sky });
  H.light = new Lighting({ scene, sun, hemi, sky, fog: scene.fog, envDay: scene.environment, envNight: envFromHDR(renderer, hdrNight) });
  H.post = new Pipeline(renderer, scene, camera);
  H.post.build(H.quality);
  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); H.post.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize); resize();
  generateWorld(seed);
  G.time = 0; G.buildings = []; G.byId = new Map(); G.enemies = []; G.allies = []; G.projectiles = []; G.trucks = [];
  if (city) H.fakeCity(seed);
  // mouse orbit for manual viewing
  let drag = null;
  canvas.addEventListener('mousedown', (e) => { drag = { x: e.clientX, y: e.clientY, b: e.button }; });
  addEventListener('mouseup', () => { drag = null; });
  addEventListener('mousemove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (drag.b === 0) { H.cam.yaw -= dx * 0.005; H.cam.tilt += dy * 0.003; }
    else { const c = Math.cos(H.cam.yaw), s = Math.sin(H.cam.yaw), k = H.cam.dist * 0.002; H.cam.x -= (c * dx + s * dy) * k; H.cam.z -= (-s * dx + c * dy) * k; }
  });
  canvas.addEventListener('wheel', (e) => { H.cam.dist *= Math.exp(Math.sign(e.deltaY) * 0.1); });
  return H;
};

// Roads radiating from the centre plus ring roads, and zoned lots of all levels next to them.
H.fakeCity = function (seed = 7) {
  const rnd = mulberry32(seed * 977);
  const c = W.center;
  for (let i = 0; i < W.count; i++) {
    if (!isLand(W.type[i]) || W.type[i] === T.MOUNTAIN) continue;
    const d = hexDist(W.q[i], W.r[i], W.q[c], W.r[c]);
    const radial = W.q[i] === W.q[c] || W.r[i] === W.r[c] || (W.q[i] + W.r[i]) === (W.q[c] + W.r[c]);
    if ((d === 3 || d === 7 || d === 11) || (radial && d <= 14)) W.road[i] = 1;
  }
  for (let i = 0; i < W.count; i++) if (W.road[i]) W.conn[i] = 1;
  for (let i = 0; i < W.count; i++) {
    if (W.road[i] || !isLand(W.type[i]) || W.type[i] === T.MOUNTAIN || i === c) continue;
    let nearRoad = false;
    for (let k = 0; k < 6; k++) { const j = W.nbr[i * 6 + k]; if (j >= 0 && W.road[j]) nearRoad = true; }
    if (!nearRoad) continue;
    const d = hexDist(W.q[i], W.r[i], W.q[c], W.r[c]);
    if (d > 13) continue;
    const x = rnd();
    W.zone[i] = d < 5 ? (x < 0.6 ? ZONE.C : ZONE.R) : d < 10 ? (x < 0.7 ? ZONE.R : ZONE.C) : (x < 0.5 ? ZONE.I : ZONE.R);
    W.lvl[i] = rnd() < 0.15 ? 0 : d < 4 ? 3 : d < 8 ? 1 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 2);
    W.style[i] = Math.floor(rnd() * 256);
    W.occ[i] = 100;
    W.lotHp[i] = 300;
    W.flags[i] = LF.POWER | LF.WATER | LF.ROAD;
    if (rnd() < 0.04) W.flags[i] |= LF.ABANDONED;
    if (rnd() < 0.03) W.fire[i] = 160;
    if (rnd() < 0.04) { W.flags[i] |= LF.BUILDING; W.lotT[i] = -2; }
    W.lv[i] = Math.floor(30 + 50 * rnd());
  }
  W.lotVersion++;
  W.lotDirty.length = 0;
  for (let i = 0; i < W.count; i++) if (W.zone[i]) W.lotDirty.push(i);
};

// Placeholder ground: flat-coloured hex prisms and a simple sea, until the ground module replaces it.
H.basicGround = function () {
  const geo = new THREE.CylinderGeometry(1, 1, 4, 6).translate(0, -2, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95 });
  const land = W.land;
  const m = new THREE.InstancedMesh(geo, mat, land.length);
  const mx = new THREE.Matrix4(), col = new THREE.Color();
  land.forEach((i, k) => {
    m.setMatrixAt(k, mx.makeTranslation(W.x[i], W.h[i], W.z[i]));
    col.setHex(W.road[i] ? 0x55585c : W.zone[i] ? 0x9e9a92 : TERRAIN[W.type[i]].color);
    m.setColorAt(k, col);
  });
  m.receiveShadow = m.castShadow = true;
  H.scene.add(m);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1b5f7e, roughness: 0.15 }));
  sea.position.y = -0.03; sea.renderOrder = 5;
  H.scene.add(sea);
  return { land: m, sea };
};

H.onFrame = (fn) => H.frameFns.push(fn);
H.setCam = (o) => Object.assign(H.cam, o);
H.setTod = (t) => { H.tod = t; };

H.start = function (warmFrames = 2) {
  let last = performance.now(), frames = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    G.time += dt;
    U.uTime.value = now / 1000; U.uGameTime.value = G.time;
    H.light.update(H.tod);
    U.uNight.value = H.light.night;
    const c = H.cam, pitch = Math.min(1.45, Math.max(0.3, 0.55 + 0.45 * Math.min(1, c.dist / 80) + c.tilt));
    H.camera.position.set(c.x + Math.sin(c.yaw) * Math.cos(pitch) * c.dist, 0.4 + Math.sin(pitch) * c.dist, c.z + Math.cos(c.yaw) * Math.cos(pitch) * c.dist);
    H.camera.lookAt(c.x, 0.4, c.z);
    H.light.fitShadow(c.x, c.z, c.dist);
    for (const f of H.frameFns) f(dt, G.time);
    H.renderer.info.reset();
    H.post.render(dt);
    const inf = H.renderer.info;
    H.stats = { calls: inf.render.calls, tris: inf.render.triangles, programs: inf.programs ? inf.programs.length : 0, geometries: inf.memory.geometries, textures: inf.memory.textures };
    if (++frames === warmFrames + 1) window.__ready = true;
  };
  requestAnimationFrame(frame);
};
window.H = H;
