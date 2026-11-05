// Test-only stand-ins for the modules gfx-life sits on (ground, roads, buildings), so life can be judged in context.
// Every material here samples the night light map exactly the way the real terrain/road/building shaders should
// (NIGHT_LIGHT_GLSL from src/gfx/lightmap.js).
import * as THREE from 'three';
import { W, T, TERRAIN, isLand, LF } from '../../src/world.js';
import { U } from '../../src/gfx/uniforms.js';
import { NIGHT_LIGHT_GLSL, defaultLampPositions } from '../../src/gfx/lightmap.js';

const J = 0.42, LIFT = 0.025;

// patch a MeshStandardMaterial to add albedo * nightLight to its emissive radiance (+ optional procedural windows)
export function withNightLight(mat, key, { windows = false, instanced = true } = {}) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uNightLight = U.uNightLight; sh.uniforms.uMapMin = U.uMapMin; sh.uniforms.uMapSize = U.uMapSize; sh.uniforms.uNight = U.uNight;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLifeW;\nvarying vec3 vLifeN;\nvarying float vLifeSeed;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
  { vec4 lw = vec4(transformed, 1.0);
    vec3 ln = objectNormal; vLifeSeed = 0.0;
    ${instanced ? '#ifdef USE_INSTANCING\n lw = instanceMatrix * lw; ln = mat3(instanceMatrix) * ln;\n vLifeSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);\n#endif' : ''}
    vLifeW = (modelMatrix * lw).xyz; vLifeN = normalize(mat3(modelMatrix) * ln); }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLifeW;\nvarying vec3 vLifeN;\nvarying float vLifeSeed;\nuniform float uNight;\n${NIGHT_LIGHT_GLSL}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += diffuseColor.rgb * nightLight(vLifeW, 0.3);
  ${windows ? `
  if (abs(vLifeN.y) < 0.5) {
    vec2 f = vec2(dot(vLifeW.xz, normalize(vec2(-vLifeN.z, vLifeN.x))) / 0.16, (vLifeW.y - 0.3) / 0.25);
    vec2 cell = floor(f), fr = fract(f);
    float win = step(0.22, fr.x) * step(fr.x, 0.78) * step(0.3, fr.y) * step(fr.y, 0.8) * step(0.0, cell.y);
    float h = fract(sin(dot(cell + vLifeSeed * 17.0, vec2(41.3, 289.1))) * 43758.5);
    float lit = step(h, 0.65 * smoothstep(0.1, 0.8, uNight));
    vec3 wc = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.86, 0.62), fract(h * 7.0));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.07, 0.09), win * 0.85);
    totalEmissiveRadiance += win * lit * wc * 2.6;
  }` : ''}`);
  };
  mat.customProgramCacheKey = () => 'life-test-' + key;
  return mat;
}

// ground hexes and sea that receive the light map
export function testGround(scene) {
  const geo = new THREE.CylinderGeometry(1, 1, 4, 6).translate(0, -2, 0);
  const mat = withNightLight(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'ground');
  const land = W.land;
  const m = new THREE.InstancedMesh(geo, mat, land.length);
  const mx = new THREE.Matrix4(), col = new THREE.Color();
  const pal = { [T.SAND]: 0xd6c69c, [T.GRASS]: 0x6e8c4c, [T.FOREST]: 0x4e6a3a, [T.HILLS]: 0x8d9659, [T.MOUNTAIN]: 0x8a857c };
  land.forEach((i, k) => {
    m.setMatrixAt(k, mx.makeTranslation(W.x[i], W.h[i], W.z[i]));
    col.setHex(W.road[i] ? 0x8f8c86 : W.zone[i] ? 0x9e9a92 : pal[W.type[i]] || TERRAIN[W.type[i]].color);
    m.setColorAt(k, col);
  });
  m.receiveShadow = m.castShadow = true;
  scene.add(m);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2),
    withNightLight(new THREE.MeshStandardMaterial({ color: 0x1b5f7e, roughness: 0.12 }), 'sea', { instanced: false }));
  sea.position.y = -0.03; sea.renderOrder = 5; sea.receiveShadow = true;
  scene.add(sea);
  return { land: m, sea };
}

// asphalt ribbons along every road edge (ramps exactly where traffic ramps), junction pads, dashed centre lines
export function testRoads(scene) {
  const pos = [], idx = [], dpos = [], didx = [];
  const quad = (P, I, a, b, c, d) => { const o = P.length / 3; P.push(...a, ...b, ...c, ...d); I.push(o, o + 2, o + 1, o, o + 3, o + 2); };
  for (let i = 0; i < W.count; i++) {
    if (!W.road[i]) continue;
    // hex pad
    const o = pos.length / 3, y = W.h[i] + LIFT * 0.9;
    pos.push(W.x[i], y, W.z[i]);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; pos.push(W.x[i] + Math.cos(a) * 0.36, y, W.z[i] + Math.sin(a) * 0.36); }
    for (let k = 0; k < 6; k++) idx.push(o, o + 1 + ((k + 1) % 6), o + 1 + k);
    for (let d = 0; d < 3; d++) {
      const j = W.nbr[i * 6 + d];
      if (j < 0 || !W.road[j]) continue;
      const dx = W.x[j] - W.x[i], dz = W.z[j] - W.z[i], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz * 0.26, nz = ux * 0.26;
      const yi = W.h[i] + LIFT, yj = W.h[j] + LIFT;
      const P = (t) => { const y = t <= J ? yi : t >= L - J ? yj : yi + (yj - yi) * (t - J) / (L - 2 * J); return [W.x[i] + ux * t, y, W.z[i] + uz * t]; };
      const ts = [0, J, L - J, L];
      for (let s = 0; s < 3; s++) {
        const a = P(ts[s]), b = P(ts[s + 1]);
        quad(pos, idx, [a[0] - nx, a[1], a[2] - nz], [a[0] + nx, a[1], a[2] + nz], [b[0] + nx, b[1], b[2] + nz], [b[0] - nx, b[1], b[2] - nz]);
      }
      for (let t = 0.4; t < L - 0.4; t += 0.24) {
        const a = P(t), b = P(t + 0.12), w = 0.008;
        quad(dpos, didx, [a[0] - uz * w, a[1] + 0.002, a[2] + ux * w], [a[0] + uz * w, a[1] + 0.002, a[2] - ux * w], [b[0] + uz * w, b[1] + 0.002, b[2] - ux * w], [b[0] - uz * w, b[1] + 0.002, b[2] + ux * w]);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const road = new THREE.Mesh(g, withNightLight(new THREE.MeshStandardMaterial({ color: 0x3a3d41, roughness: 0.9 }), 'road', { instanced: false }));
  road.receiveShadow = true;
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dpos, 3)); dg.setIndex(didx); dg.computeVertexNormals();
  const dash = new THREE.Mesh(dg, withNightLight(new THREE.MeshStandardMaterial({ color: 0xe6e2d6, roughness: 0.8 }), 'dash', { instanced: false }));
  dash.receiveShadow = true;
  scene.add(road, dash);
  // lamp posts with emissive heads
  const lamps = defaultLampPositions([]);
  const n = lamps.length / 3;
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.01, 0.014, 0.5, 5).translate(0, 0.25, 0), new THREE.MeshStandardMaterial({ color: 0x3b3e42, roughness: 0.6 }), n);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffd7a0, emissiveIntensity: 0 });
  const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.025, 0.04), headMat, n);
  const mx = new THREE.Matrix4();
  for (let k = 0; k < n; k++) {
    const x = lamps[k * 3], z = lamps[k * 3 + 2], y = lamps[k * 3 + 1] - 0.5;
    pole.setMatrixAt(k, mx.makeTranslation(x, y, z));
    head.setMatrixAt(k, mx.makeTranslation(x, y + 0.5, z));
  }
  pole.castShadow = true;
  scene.add(pole, head);
  return { road, dash, lampHead: headMat };
}

// box buildings on lots, with procedural lit windows
export function testBuildings(scene) {
  const lots = [];
  for (let i = 0; i < W.count; i++) if (W.zone[i] && W.lvl[i] && !(W.flags[i] & LF.RUBBLE)) lots.push(i);
  const mat = withNightLight(new THREE.MeshStandardMaterial({ roughness: 0.85 }), 'bld', { windows: true });
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), mat, lots.length * 2);
  const roofs = [0xece6da, 0xe1d2b4, 0xd7b38b, 0xc98e6a, 0xb8c1ae, 0xa8b5c1, 0x9c4e3e, 0xb4b1a9];
  const ind = [0xa7acae, 0x8c3a2c, 0x9a978e];
  const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  let n = 0;
  const H = [0, 0.42, 1.0, 2.6];
  for (const i of lots) {
    const lv = W.lvl[i], z = W.zone[i], s = W.style[i];
    const h = H[lv] * (0.85 + (s % 31) / 100), w = z === 3 ? 1.05 : 0.62 + lv * 0.08;
    let yaw = 0;
    for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j]) { yaw = Math.atan2(W.x[j] - W.x[i], W.z[j] - W.z[i]); break; } }
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    mx.compose(new THREE.Vector3(W.x[i], W.h[i], W.z[i]), q, new THREE.Vector3(w, z === 3 ? h * 0.6 : h, z === 3 ? 0.8 : w * 0.85));
    m.setMatrixAt(n, mx);
    col.setHex(z === 3 ? ind[s % 3] : roofs[s % 8]).multiplyScalar(0.78);
    if (W.flags[i] & LF.ABANDONED) col.multiplyScalar(0.6);
    m.setColorAt(n++, col);
  }
  m.count = n;
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
}
