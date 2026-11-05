import * as THREE from 'three';
import { U } from './uniforms.js';
import { Pool } from './pools.js';
import { W, isLand, groundY } from '../world.js';
import { G } from '../state.js';
import { ENEMIES } from '../defs.js';
import { lightmapBeacon } from './lightmap.js';
import { pushVehicleLight, VEH_FLAG } from './traffic.js';

// Raid visuals (UX must_change 7, should_change 9, concrete spec 13):
//   spawn beacons   additive red light columns (r 0.6u, 6u tall, 1 Hz pulse) at the map edge from 30 s before a raid
//   approach lanes  marching red dashes on the water (sea) / chevrons on the ground (air), only with a connected
//                   radar; without one, short sector chevrons near the coast
//   searchlights    AA sites sweep cones at night during raids (max 8), locking onto nearby aircraft
//   lighthouse beam (for ambient.js) drawn by the same instanced beam mesh
//   raidMarkers()   off-screen chevron data for the HUD (true screen edges, type, count, fresh flag)
// Beams: one instanced draw. Lanes: one draw (CPU-built ribbon, rebuilt only when the plan or radar changes).

const BEAM_MAX = 32;
const SEA_EDGE_R = 54, AIR_R = 56;
const HOSTILE = new THREE.Color(0xff4d3d);

const beamVert = /* glsl */`
attribute vec4 aR0;  // base xyz, length
attribute vec4 aR1;  // direction xyz, kind (0 beacon, 1 searchlight, 2 lighthouse)
attribute vec4 aR2;  // radius at base, radius at tip, intensity, phase
attribute vec3 aR3;  // colour (linear)
varying float vAlong;
varying float vEdge;
varying float vKind;
varying vec4 vP;
varying vec3 vC;
varying float vFogDepth;
void main() {
  vec3 d = aR1.xyz;
  vec3 ref = abs(d.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(d, ref));
  vec3 b = cross(d, t);
  float along = position.y;                       // 0..1 (CylinderGeometry translated to 0..1)
  float r = mix(aR2.x, aR2.y, along);
  vec3 radial = t * position.x + b * position.z;   // unit circle in the cross-section
  vec3 wp = aR0.xyz + d * along * aR0.w + radial * r;
  vec3 n = normalize(radial);
  vec3 v = normalize(cameraPosition - wp);
  // facing term: bright where we look through the middle of the beam, soft at the silhouette
  vEdge = abs(dot(n, v));
  vAlong = along;
  vKind = aR1.w;
  vP = aR2;
  vC = aR3;
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  vFogDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const beamFrag = /* glsl */`
uniform float uTime;
varying float vAlong;
varying float vEdge;
varying float vKind;
varying vec4 vP;
varying vec3 vC;
varying float vFogDepth;
#ifdef USE_FOG
uniform vec3 fogColor;
uniform float fogNear, fogFar;
#endif
void main() {
  float k = vAlong;
  float edge = vEdge * vEdge;
  float a;
  if (vKind < 0.5) {
    // beacon: 1 Hz pulse 0.35..0.7, energy bands rising, hot base, soft top
    float pulse = 0.35 + 0.35 * (0.5 + 0.5 * sin((uTime + vP.w) * 6.2832));
    float bands = 0.7 + 0.3 * sin((k * 5.0 - uTime * 1.6) * 6.2832);
    a = pulse * bands * (1.0 - smoothstep(0.55, 1.0, k)) * (0.55 + 0.45 * edge) + 0.9 * exp(-k * 18.0) * edge;
  } else {
    // light cone: fades along its length, with a hot core near the lamp
    a = pow(1.0 - k, 1.6) * (0.25 + 0.75 * edge * edge) * smoothstep(0.0, 0.03, k) + 1.4 * exp(-k * 40.0) * edge;
  }
  vec3 c = vC * a * vP.z;
#ifdef USE_FOG
  c *= 1.0 - smoothstep(fogNear, fogFar * 1.4, vFogDepth) * 0.85;
#endif
  gl_FragColor = vec4(c, 0.0);
}`;

const laneVert = /* glsl */`
attribute vec4 aLane;   // distance along, across (-1..1), total length, kind (0 sea, 1 air, 2 sector chevrons)
attribute float aDir;   // lane index (for per-lane fade)
uniform float uLaneFade[8];
varying vec4 vL;
varying float vFade;
varying float vFogDepth;
void main() {
  vL = aLane;
  int li = int(aDir + 0.5);
  float f = 0.0;
  for (int i = 0; i < 8; i++) if (i == li) f = uLaneFade[i];
  vFade = f;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFogDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const laneFrag = /* glsl */`
uniform float uTime;
uniform vec3 uCol;
varying vec4 vL;
varying float vFade;
varying float vFogDepth;
#ifdef USE_FOG
uniform vec3 fogColor;
uniform float fogNear, fogFar;
#endif
void main() {
  float dist = vL.x, across = vL.y, total = vL.z, kind = vL.w;
  float side = smoothstep(1.0, 0.72, abs(across));
  float prog = dist / max(total, 0.001);
  float a;
  if (kind < 0.5) {
    // marching dashes: 0.8u on, 0.5u off, moving 1.5u/s toward the island
    float ph = fract((dist - uTime * 1.5) / 1.3) * 1.3;
    float w = fwidth(dist) * 1.5;
    float on = smoothstep(0.0, w, ph) * (1.0 - smoothstep(0.8 - w, 0.8, ph));
    a = 0.55 * on * side;
  } else if (kind < 1.5) {
    // air: chevrons pointing along the lane
    float ph = fract((dist - abs(across) * 0.45 - uTime * 2.2) / 1.6);
    float w = fwidth(dist) / 1.6 * 1.5;
    float on = smoothstep(0.0, w, ph) * (1.0 - smoothstep(0.28 - w, 0.28, ph));
    a = 0.35 * on * smoothstep(1.0, 0.85, abs(across));
  } else {
    // sector chevrons (no radar): three chevrons lighting up in sequence toward the island
    float cell = floor(dist / (total / 3.0));
    float ph = fract(dist / (total / 3.0) - abs(across) * 0.35);
    float seq = fract(uTime * 0.9 - cell / 3.0);
    float on = smoothstep(0.30, 0.38, ph) * (1.0 - smoothstep(0.62, 0.70, ph));
    a = on * (0.35 + 0.55 * smoothstep(0.5, 0.0, abs(seq - 0.5) * 2.0 - 0.5)) * smoothstep(1.0, 0.85, abs(across));
  }
  a *= smoothstep(0.0, 0.06, prog) * (1.0 - smoothstep(0.85, 1.0, prog)) * vFade;
#ifdef USE_FOG
  a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth) * 0.7;
#endif
  if (a < 0.003) discard;
  gl_FragColor = vec4(uCol * a * 1.6, a);
  #include <colorspace_fragment>
}`;

const R = {
  beamGeo: null, beamMesh: null, a0: null, a1: null, a2: null, a3: null, nBeam: 0,
  laneMesh: null, laneGeo: null, laneMat: null, laneKey: '', laneDirs: [], laneFade: new Float32Array(8),
  beaconFade: 0, searchFade: 0, lights: [], lighthouse: null,
  markers: [], markerPool: [], seen: new Map(), renderer: null,
  dirInfo: [], stats: { beams: 0, lanes: 0, markers: 0 },
};

function radarOnline() {
  for (const b of G.buildings || []) if (b.type === 'radar' && b.connected !== false && b.powered !== false && !(b.hp <= 0)) return true;
  return false;
}

export function initRaidFx(scene, renderer) {
  R.renderer = renderer;
  // unit open cylinder, y 0..1, radius 1
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true).translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', cyl.attributes.position);
  g.setIndex(cyl.index);
  const mk = (name, n) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(BEAM_MAX * n), n); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
  R.a0 = mk('aR0', 4); R.a1 = mk('aR1', 4); R.a2 = mk('aR2', 4); R.a3 = mk('aR3', 3);
  g.instanceCount = 0;
  R.beamGeo = g;
  const fogU = () => ({ fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 1000 } });
  R.beamMesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    vertexShader: beamVert, fragmentShader: beamFrag, fog: true,
    uniforms: { uTime: U.uTime, ...fogU() },
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
  }));
  R.beamMesh.frustumCulled = false;
  R.beamMesh.renderOrder = 9;
  R.beamMesh.name = 'raid-beams';
  scene.add(R.beamMesh);

  R.laneGeo = new THREE.BufferGeometry();
  R.laneMat = new THREE.ShaderMaterial({
    vertexShader: laneVert, fragmentShader: laneFrag, fog: true,
    uniforms: { uTime: U.uTime, uCol: { value: HOSTILE.clone() }, uLaneFade: { value: R.laneFade }, ...fogU() },
    transparent: true, depthWrite: false, depthTest: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
  });
  R.laneMesh = new THREE.Mesh(R.laneGeo, R.laneMat);
  R.laneMesh.frustumCulled = false;
  R.laneMesh.renderOrder = 7;
  R.laneMesh.visible = false;
  R.laneMesh.name = 'raid-lanes';
  scene.add(R.laneMesh);
}

// ------------------------------------------------------------------------------------------------ beams

function beam(x, y, z, dx, dy, dz, len, kind, r0, r1, inten, phase, r, g, b) {
  if (R.nBeam >= BEAM_MAX) return;
  const k = R.nBeam++;
  const A = R.a0.array, B = R.a1.array, C = R.a2.array, D = R.a3.array;
  const l = Math.hypot(dx, dy, dz) || 1;
  A[k * 4] = x; A[k * 4 + 1] = y; A[k * 4 + 2] = z; A[k * 4 + 3] = len;
  B[k * 4] = dx / l; B[k * 4 + 1] = dy / l; B[k * 4 + 2] = dz / l; B[k * 4 + 3] = kind;
  C[k * 4] = r0; C[k * 4 + 1] = r1; C[k * 4 + 2] = inten; C[k * 4 + 3] = phase;
  D[k * 3] = r; D[k * 3 + 1] = g; D[k * 3 + 2] = b;
}

export function raidfxSetLighthouse(lh) { R.lighthouse = lh; } // { x, y, z } lamp position, or null

// ------------------------------------------------------------------------------------------------ plan analysis

function edgeAngleTile(a) {
  // the sea spawn tile (same rule as the sim: edge tile closest to the direction)
  let best = -1, bd = 1e9;
  for (const t of W.edge || []) {
    let d = Math.atan2(W.x[t], W.z[t]) - a;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < bd) { bd = Math.abs(d); best = t; }
  }
  return best;
}

function analysePlan(plan) {
  const dirs = plan && plan.dirs ? plan.dirs : [];
  const info = R.dirInfo;
  info.length = 0;
  for (let k = 0; k < dirs.length; k++) info.push({ a: dirs[k], sea: 0, air: 0, ground: 0, top: null, topN: 0, counts: {} });
  const q = plan && plan.queue;
  if (q && q.length) {
    for (const e of q) {
      let bi = 0, bd = 9;
      for (let k = 0; k < info.length; k++) {
        const d = Math.abs(Math.atan2(Math.sin(e.dir - info[k].a), Math.cos(e.dir - info[k].a)));
        if (d < bd) { bd = d; bi = k; }
      }
      const it = info[bi];
      if (!it) continue;
      const dom = (ENEMIES[e.type] && ENEMIES[e.type].domain) || 'sea';
      it[dom]++;
      it.counts[e.type] = (it.counts[e.type] || 0) + 1;
      if (it.counts[e.type] > it.topN) { it.topN = it.counts[e.type]; it.top = e.type; }
    }
  } else for (const it of info) { it.sea = 1; it.air = 1; }
  return info;
}

// ------------------------------------------------------------------------------------------------ lanes

const _pos = [], _lane = [], _dir = [], _idx = [];
function pushRibbon(points, width, kind, laneIdx) {
  // points: flat [x, y, z, ...] along the lane
  const n = points.length / 3;
  if (n < 2) return;
  let total = 0;
  const cum = [0];
  for (let k = 1; k < n; k++) {
    total += Math.hypot(points[k * 3] - points[k * 3 - 3], points[k * 3 + 2] - points[k * 3 - 1]);
    cum.push(total);
  }
  const base = _pos.length / 3;
  for (let k = 0; k < n; k++) {
    const k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1);
    let tx = points[k1 * 3] - points[k0 * 3], tz = points[k1 * 3 + 2] - points[k0 * 3 + 2];
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz * width * 0.5, nz = tx * width * 0.5;
    const x = points[k * 3], y = points[k * 3 + 1], z = points[k * 3 + 2];
    _pos.push(x - nx, y, z - nz, x + nx, y, z + nz);
    _lane.push(cum[k], -1, total, kind, cum[k], 1, total, kind);
    _dir.push(laneIdx, laneIdx);
    if (k < n - 1) { const o = base + k * 2; _idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  }
}

function lanePoints(a, fromR, sea, maxLen) {
  // from the map edge toward the island centre in 0.6u steps; sea lanes stop at the coast
  const pts = [];
  const sx = Math.sin(a), sz = Math.cos(a);
  let len = 0;
  for (let r = fromR; r > 1; r -= 0.6) {
    const x = sx * r, z = sz * r;
    const ground = groundY(x, z);
    const land = ground > 0.05;
    if (sea && land) break;
    pts.push(x, land ? ground + 0.07 : 0.035, z);
    len += 0.6;
    if (len > maxLen) break;
  }
  return pts;
}

function rebuildLanes(info, radar) {
  _pos.length = 0; _lane.length = 0; _dir.length = 0; _idx.length = 0;
  R.laneDirs.length = 0;
  info.forEach((it, k) => {
    if (k >= 8) return;
    const t = edgeAngleTile(it.a);
    const ea = t >= 0 ? Math.atan2(W.x[t], W.z[t]) : it.a;
    if (radar) {
      if (it.sea) pushRibbon(lanePoints(ea, SEA_EDGE_R, true, 80), 0.3, 0, k);
      if (it.air) pushRibbon(lanePoints(it.a + 0.05, AIR_R, false, 60), 0.5, 1, k);
    } else {
      // sector chevrons: 4.5u long strip on the water a few units off the coast
      const pts = lanePoints(ea, SEA_EDGE_R, true, 200);
      const n = pts.length / 3;
      if (n >= 2) {
        const end = Math.max(0, n - 1 - 4), start = Math.max(0, end - 8);
        pushRibbon(pts.slice(start * 3, (end + 1) * 3), 1.4, 2, k);
      }
    }
  });
  const g = R.laneGeo;
  g.setAttribute('position', new THREE.Float32BufferAttribute(_pos, 3));
  g.setAttribute('aLane', new THREE.Float32BufferAttribute(_lane, 4));
  g.setAttribute('aDir', new THREE.Float32BufferAttribute(_dir, 1));
  g.setIndex(_idx);
  g.computeBoundingSphere();
  Pool.uploaded += _pos.length * 4 + _lane.length * 4 + _dir.length * 4 + _idx.length * 4;
}

// ------------------------------------------------------------------------------------------------ per frame

const _sl = [];
export function raidfxFrame(dt, time, scene) {
  R.nBeam = 0;
  const w = G.wave || {};
  const plan = w.plan;
  const prep = w.state === 'prep';
  const active = w.state === 'active';
  const night = U.uNight.value;
  const radar = radarOnline();
  const info = plan ? analysePlan(plan) : (R.dirInfo.length = 0, R.dirInfo);
  const playing = G.mode === 'play' || G.mode == null;

  // ---- beacons (last 30 s of the countdown) and lanes
  const warn = playing && prep && plan && w.timer <= 30;
  const laneOn = playing && plan && ((prep && (radar ? w.timer <= 60 : w.timer <= 30)) || (active && w.queue && w.queue.length > 0));
  R.beaconFade += ((warn ? 1 : 0) - R.beaconFade) * Math.min(1, dt * 1.5);
  if (R.beaconFade > 0.01) {
    info.forEach((it, k) => {
      const v = R.beaconFade;
      if (it.sea || !it.air) {
        const t = edgeAngleTile(it.a);
        if (t >= 0) {
          beam(W.x[t], -0.2, W.z[t], 0, 1, 0, 6.2, 0, 0.6, 0.6, 1.9 * v, k * 0.17, 1.0, 0.18, 0.12);
          lightmapBeacon(W.x[t], W.z[t], v);
        }
      }
      if (it.air) {
        const x = Math.sin(it.a + 0.05) * AIR_R, z = Math.cos(it.a + 0.05) * AIR_R;
        beam(x, -0.2, z, 0, 1, 0, 9, 0, 0.35, 0.35, 1.6 * v, k * 0.17 + 0.5, 1.0, 0.25, 0.15);
        lightmapBeacon(x, z, v * 0.7);
      }
    });
  }
  const key = plan ? `${plan.n}|${radar ? 1 : 0}|${info.length}` : '';
  if (laneOn && key !== R.laneKey && info.length) { R.laneKey = key; rebuildLanes(info, radar); }
  for (let k = 0; k < 8; k++) {
    const want = laneOn && k < info.length ? 1 : 0;
    R.laneFade[k] += (want - R.laneFade[k]) * Math.min(1, dt * 1.2);
  }
  R.laneMesh.visible = laneOn || R.laneFade[0] > 0.01 || R.laneFade[1] > 0.01 || R.laneFade[2] > 0.01;

  // ---- AA searchlights at night during raids
  const sOn = active && night > 0.45 ? 1 : 0;
  R.searchFade += (sOn - R.searchFade) * Math.min(1, dt * 0.8);
  if (R.searchFade > 0.01) {
    _sl.length = 0;
    for (const b of G.buildings || []) if ((b.type === 'flak' || b.type === 'missile') && !(b.hp <= 0)) _sl.push(b);
    const n = Math.min(8, _sl.length);
    for (let k = 0; k < n; k++) {
      const b = _sl[k];
      let st = R.lights[k];
      if (!st || st.id !== b.id) st = R.lights[k] = { id: b.id, az: Math.random() * 6.28, el: 1.0, ph: Math.random() * 10 };
      // sweep, or lock onto the nearest aircraft within 24u
      let tx = 0, ty = 0, tz = 0, bd = 24 * 24, lock = false;
      for (const e of G.enemies || []) {
        if (e.gone || e.alive === false || e.domain !== 'air') continue;
        const dx = e.x - b.x, dz = e.z - b.z, d = dx * dx + dz * dz;
        if (d < bd) { bd = d; tx = dx; ty = (e.y || 5) - 0.6; tz = dz; lock = true; }
      }
      let az, el;
      if (lock) { az = Math.atan2(tx, tz); el = Math.atan2(ty, Math.hypot(tx, tz)); }
      else { az = st.ph + Math.sin(time * 0.31 + st.ph) * 1.4 + time * 0.12; el = 1.05 + 0.25 * Math.sin(time * 0.43 + st.ph * 2); }
      const da = Math.atan2(Math.sin(az - st.az), Math.cos(az - st.az));
      const rate = lock ? 2.5 : 1;
      st.az += da * Math.min(1, dt * rate); st.el += (el - st.el) * Math.min(1, dt * rate);
      const ce = Math.cos(st.el);
      const y0 = (b.y || groundY(b.x, b.z)) + 0.45;
      beam(b.x, y0, b.z, Math.sin(st.az) * ce, Math.sin(st.el), Math.cos(st.az) * ce, 28, 1, 0.05, 1.7, 0.22 * R.searchFade * (lock ? 1.3 : 1), 0, 0.85, 0.92, 1.0);
      pushVehicleLight(b.x, y0, b.z, 0, 0.16, 6 * R.searchFade, 0, VEH_FLAG.LAMP);
    }
  }

  // ---- lighthouse beam (two opposed beams, one turn per 6 s) at night
  const lh = R.lighthouse;
  if (lh && night > 0.25) {
    const v = Math.min(1, (night - 0.25) / 0.35);
    const a = time * (Math.PI * 2 / 6);
    for (let s = 0; s < 2; s++) {
      const aa = a + s * Math.PI;
      beam(lh.x, lh.y, lh.z, Math.sin(aa), -0.045, Math.cos(aa), 24, 2, 0.08, 2.2, 0.3 * v, 0, 1.0, 0.9, 0.7);
    }
    pushVehicleLight(lh.x, lh.y, lh.z, 0, 0.3, 9 * v, 0, VEH_FLAG.LAMP);
  }

  // upload beams
  R.beamGeo.instanceCount = R.nBeam;
  R.beamMesh.visible = R.nBeam > 0;
  if (R.nBeam) {
    for (const a of [R.a0, R.a1, R.a2, R.a3]) { a.clearUpdateRanges(); a.addUpdateRange(0, R.nBeam * a.itemSize); a.needsUpdate = true; }
    Pool.uploaded += R.nBeam * 60;
  }
  if (scene && scene.fog) for (const m of [R.beamMesh.material, R.laneMat]) {
    m.uniforms.fogColor.value.copy(scene.fog.color); m.uniforms.fogNear.value = scene.fog.near; m.uniforms.fogFar.value = scene.fog.far;
  }
  R.stats.beams = R.nBeam;
}

// ------------------------------------------------------------------------------------------------ HUD markers

const _v = new THREE.Vector3();
const SECTORS = 12;
const _cl = Array.from({ length: SECTORS * 3 }, () => ({ n: 0, x: 0, z: 0, y: 0, types: {}, top: null, topN: 0 }));
const DOMS = ['sea', 'air', 'ground'];

function getMarker(i) {
  let m = R.markerPool[i];
  if (!m) m = R.markerPool[i] = { x: 0, y: 0, angle: 0, kind: 'sea', type: null, count: 0, fresh: false, wx: 0, wz: 0, phase: 'incoming', key: '' };
  return m;
}

// Returns screen-edge markers (CSS px, origin top-left) for enemy groups and incoming raids that are off-screen.
// Reuses its array and objects: copy what you need, do not keep references across frames.
export function raidMarkers(camera, inset = 20) {
  const out = R.markers;
  out.length = 0;
  const el = R.renderer && R.renderer.domElement;
  const Wd = (el && el.clientWidth) || innerWidth, Hd = (el && el.clientHeight) || innerHeight;
  const now = performance.now() / 1000;
  const w = G.wave || {};
  let n = 0;
  const add = (wx, wy, wz, kind, type, count, phase, key) => {
    _v.set(wx, wy, wz).applyMatrix4(camera.matrixWorldInverse);
    const behind = _v.z > 0;
    _v.applyMatrix4(camera.projectionMatrix);
    let nx = _v.x, ny = _v.y;
    if (behind) { nx = -nx; ny = -ny; }
    const mx = 1 - (inset * 2) / Wd, my = 1 - (inset * 2) / Hd;
    if (!behind && Math.abs(nx) <= 1 && Math.abs(ny) <= 1) return;  // on screen: no chevron
    const s = Math.max(Math.abs(nx) / mx, Math.abs(ny) / my, 1e-6);
    nx /= s; ny /= s;
    const m = getMarker(n++);
    m.x = (nx * 0.5 + 0.5) * Wd; m.y = (0.5 - ny * 0.5) * Hd;
    m.angle = Math.atan2(-ny, nx);
    m.kind = kind; m.type = type; m.count = count; m.wx = wx; m.wz = wz; m.phase = phase; m.key = key;
    const first = R.seen.get(key);
    if (first == null) R.seen.set(key, now);
    m.fresh = now - (first == null ? now : first) < 2;
    out.push(m);
  };
  if (w.state === 'prep' && w.plan && w.timer <= 30) {
    const info = R.dirInfo.length ? R.dirInfo : analysePlan(w.plan);
    for (let k = 0; k < info.length; k++) {
      const it = info[k];
      const kind = it.sea && it.air ? 'mixed' : it.air ? 'air' : 'sea';
      add(Math.sin(it.a) * 40, 0, Math.cos(it.a) * 40, kind, it.top, it.sea + it.air + it.ground, 'incoming', `in${w.plan.n}:${k}`);
    }
  } else if (w.state === 'active') {
    for (const c of _cl) { c.n = 0; c.x = 0; c.y = 0; c.z = 0; c.top = null; c.topN = 0; for (const t in c.types) c.types[t] = 0; }
    for (const e of G.enemies || []) {
      if (e.gone || e.alive === false || e.team === 'A') continue;
      let s = Math.floor(((Math.atan2(e.x, e.z) + Math.PI) / (Math.PI * 2)) * SECTORS);
      if (s >= SECTORS) s = SECTORS - 1;
      const d = Math.max(0, DOMS.indexOf(e.domain));
      const c = _cl[s * 3 + d];
      c.n++; c.x += e.x; c.y += e.y || 0; c.z += e.z;
      c.types[e.type] = (c.types[e.type] || 0) + 1;
      if (c.types[e.type] > c.topN) { c.topN = c.types[e.type]; c.top = e.type; }
    }
    for (let k = 0; k < _cl.length; k++) {
      const c = _cl[k];
      if (!c.n) continue;
      add(c.x / c.n, c.y / c.n, c.z / c.n, DOMS[k % 3], c.top, c.n, 'raid', `r${w.n}:${k}`);
    }
  }
  if (R.seen.size > 200) R.seen.clear();
  R.stats.markers = out.length;
  return out;
}

export function raidfxStats() { return R.stats; }
export function raidfxWarm() {
  R.nBeam = 0; beam(0, -60, 0, 0, 1, 0, 1, 0, 0.5, 0.5, 1, 0, 1, 0, 0);
  R.beamGeo.instanceCount = 1; R.beamMesh.visible = true;
  for (const a of [R.a0, R.a1, R.a2, R.a3]) { a.clearUpdateRanges(); a.addUpdateRange(0, a.itemSize); a.needsUpdate = true; }
  _pos.length = 0; _lane.length = 0; _dir.length = 0; _idx.length = 0;
  pushRibbon([0, -60, 0, 0, -60, 1, 0, -60, 2], 0.3, 0, 0);
  const g = R.laneGeo;
  g.setAttribute('position', new THREE.Float32BufferAttribute(_pos, 3));
  g.setAttribute('aLane', new THREE.Float32BufferAttribute(_lane, 4));
  g.setAttribute('aDir', new THREE.Float32BufferAttribute(_dir, 1));
  g.setIndex(_idx);
  R.laneMesh.visible = true; R.laneKey = '';
}
export function raidfxClear() { R.laneKey = ''; R.lights.length = 0; R.seen.clear(); R.beaconFade = 0; R.searchFade = 0; R.laneFade.fill(0); }
