// gfx-life visual test. Build: node tests/gfx/build.mjs tests/life/demo.js $SCRATCH/life/demo
// Open http://127.0.0.1:8200$SCRATCH/life/demo/index.html?scene=street|night|fire|raid|raidnr|nightraid|overview|perf
import * as THREE from 'three';
import { H } from '../gfx/harness.js';
import { W, T, LF, isLand } from '../../src/world.js';
import { G } from '../../src/state.js';
import { FX } from '../../src/sim/events.js';
import { hexDist } from '../../src/hex.js';
import { testGround, testRoads, testBuildings } from './testscene.js';
import {
  initLife, lifeOnRoadsChanged, lifeOnLotsChanged, lifeFrame, lightmapRender, raidMarkers, lifeStats, LIFE_FX, lifeWarm,
} from '../../src/gfx/life.js';

const q = new URLSearchParams(location.search);
const scene = q.get('scene') || 'street';
const TOD = { street: 0.3, night: 0.84, fire: 0.7, raid: 0.3, raidnr: 0.3, nightraid: 0.86, overview: 0.3, perf: 0.84, dusk: 0.7 };
H.tod = q.has('tod') ? +q.get('tod') : TOD[scene] ?? 0.3;

await H.init({ seed: +(q.get('seed') || 7), city: true });
G.pop = +(q.get('pop') || 4800);
G.mode = 'menu';

// ---- helpers
const c = W.center;
const roadTiles = [], freeTiles = [];
for (let i = 0; i < W.count; i++) {
  if (W.road[i]) roadTiles.push(i);
  else if (isLand(W.type[i]) && !W.zone[i] && W.type[i] !== T.MOUNTAIN && i !== c) freeTiles.push(i);
}
const near = (list, x, z, n = 1) => list.slice().sort((a, b) => Math.hypot(W.x[a] - x, W.z[a] - z) - Math.hypot(W.x[b] - x, W.z[b] - z)).slice(0, n);
let nextId = 1;
const addBld = (type, i, extra = {}) => {
  const b = { id: nextId++, type, x: W.x[i], y: W.h[i], z: W.z[i], hp: 300, maxHp: 300, connected: true, level: 1, ...extra };
  G.buildings.push(b); G.byId.set(b.id, b); W.bld[i] = b.id;
  return b;
};

// ---- scenario setup (before meshes are built)
const focusTile = near(roadTiles.filter((i) => hexDist(W.q[i], W.r[i], W.q[c], W.r[c]) === 3), 4, 3)[0];
let cam = { x: W.x[focusTile], z: W.z[focusTile], dist: 13, yaw: 0.75 };
const burning = [];
if (scene === 'fire' || scene === 'nightraid' || scene === 'night' || scene === 'street') {
  // a burning block near the focus
  const lots = [];
  for (let i = 0; i < W.count; i++) if (W.zone[i] && W.lvl[i]) lots.push(i);
  let fx = W.x[focusTile] - 4, fz = W.z[focusTile] - 3;
  let pool = lots;
  if (scene === 'fire') {
    // a low-rise block on the ring road at distance 7, seen from outside the city
    const ring = roadTiles.filter((i) => hexDist(W.q[i], W.r[i], W.q[c], W.r[c]) === 7);
    const rt = near(ring, -9, 5, 1)[0];
    fx = W.x[rt]; fz = W.z[rt];
    pool = lots.filter((i) => W.lvl[i] <= 2 && hexDist(W.q[i], W.r[i], W.q[c], W.r[c]) >= 7);
  }
  const n = scene === 'fire' ? 3 : 1;
  for (const i of near(pool, fx, fz, n)) { W.fire[i] = 150 + 50 * burning.length; burning.push(i); }
}
// problem icons on a few lots
{
  const lots = [];
  for (let i = 0; i < W.count; i++) if (W.zone[i] && W.lvl[i] && !W.fire[i]) lots.push(i);
  const picks = near(lots, W.x[focusTile] + 2, W.z[focusTile] - 2, 8);
  const flags = [LF.NO_POWER_ICON, LF.NO_WATER_ICON, LF.NO_ROAD_ICON, LF.ABANDONED, LF.SHELTER, LF.UNDERSTAFFED];
  picks.forEach((i, k) => { if (k < flags.length && k % 2 === 0) W.flags[i] |= flags[k]; });
}
// player buildings: fire station, police, radar, AA sites
const ft = near(freeTiles, W.x[focusTile] + 3, W.z[focusTile] + 2, 1)[0];
addBld('fire', ft);
addBld('police', near(freeTiles.filter((i) => !W.bld[i]), -6, 6, 1)[0]);
if (scene !== 'raidnr') addBld('radar', near(freeTiles.filter((i) => !W.bld[i]), 8, -8, 1)[0]);
for (const [x, z] of [[cam.x - 3, cam.z + 4], [cam.x + 6, cam.z - 2], [-10, -10], [12, 6], [-4, 14]]) addBld('flak', near(freeTiles.filter((i) => !W.bld[i]), x, z, 1)[0]);
addBld('gas', near(freeTiles.filter((i) => !W.bld[i] && W.type[i] !== T.SAND), 10, 10, 1)[0]);
// fire trucks: one racing along a road, one hosing the fire
G.trucks = [];
if (burning.length) {
  const rt = near(roadTiles, W.x[burning[0]], W.z[burning[0]], 3);
  const a = rt[0], b = rt[2];
  G.trucks.push({ x: W.x[a] + 0.12, z: W.z[a] + 0.1, yaw: Math.atan2(W.x[burning[0]] - W.x[a], W.z[burning[0]] - W.z[a]), state: 'spray', target: burning[0] });
  G.trucks.push({ x: W.x[b], z: W.z[b], yaw: 0.5, state: 'drive' });
}
// raids
const dirs = [0.6, 0.6 + 2.2, 0.6 + 4.2];
const plan = { n: 7, dirs, queue: [
  ...[0, 1, 2, 3].map((k) => ({ t: k, type: 'gunboat', dir: dirs[0] })), { t: 4, type: 'destroyer', dir: dirs[0] },
  ...[0, 1, 2].map((k) => ({ t: k, type: 'fighter', dir: dirs[1] })), ...[0, 1].map((k) => ({ t: k, type: 'landing', dir: dirs[2] })), { t: 5, type: 'bomber', dir: dirs[2] },
], counts: {} };
if (scene === 'raid' || scene === 'raidnr') {
  G.mode = 'play'; G.paused = false;
  G.wave = { n: 7, state: 'prep', timer: 18, elapsed: 0, plan, queue: [], current: 7 };
  cam = { x: 6, z: 0, dist: 78, yaw: 0.9 };
}
if (scene === 'nightraid') {
  G.mode = 'play';
  G.wave = { n: 7, state: 'active', timer: 0, elapsed: 30, plan, queue: [{ t: 99, type: 'bomber', dir: dirs[1] }], current: 7 };
  for (let k = 0; k < 4; k++) {
    const a = 0.9 + k * 0.25, r = 9 + k * 3;
    G.enemies.push({ team: 'E', type: k < 2 ? 'bomber' : 'fighter', domain: 'air', x: cam.x + Math.sin(a) * r * 0.6, y: 5 + k, z: cam.z + Math.cos(a) * r * 0.6, hp: 200 - k * 40, maxHp: 340, alive: true, hitT: 0.1, def: { radius: k < 2 ? 1.2 : 0.6 } });
  }
  G.enemies.push({ team: 'E', type: 'destroyer', domain: 'sea', x: 30, y: 0, z: -34, hp: 300, maxHp: 460, alive: true, def: { radius: 1 } });
  G.enemies.push({ team: 'E', type: 'gunboat', domain: 'sea', x: -45, y: 0, z: 20, hp: 60, maxHp: 80, alive: true, def: { radius: 0.6 } });
  cam = { x: cam.x, z: cam.z, dist: 30, yaw: 0.75 };
}
if (scene === 'overview') cam = { x: 2, z: 2, dist: 62, yaw: 0.7 };
if (scene === 'fire') {
  let x = 0, z = 0; for (const i of burning) { x += W.x[i] / burning.length; z += W.z[i] / burning.length; }
  cam = { x, z, dist: 9, yaw: Math.atan2(x, z) + 0.35 };
}
if (q.has('dist')) cam.dist = +q.get('dist');
if (q.has('yaw')) cam.yaw = +q.get('yaw');
H.setCam(cam);

// ---- meshes
testGround(H.scene);
const roads = testRoads(H.scene);
testBuildings(H.scene);
initLife({ scene: H.scene, overlay: H.post.overlay, renderer: H.renderer, vehicleGeos: null, lampPositions: null, quality: H.quality });
Object.assign(FX, LIFE_FX);
lifeOnRoadsChanged();
const all = [];
for (let i = 0; i < W.count; i++) if (W.zone[i]) all.push(i);
lifeOnLotsChanged(all);

// camera placement identical to the harness
function placeCam() {
  const k = H.cam, pitch = Math.min(1.45, Math.max(0.3, 0.55 + 0.45 * Math.min(1, k.dist / 80) + k.tilt));
  H.camera.position.set(k.x + Math.sin(k.yaw) * Math.cos(pitch) * k.dist, 0.4 + Math.sin(pitch) * k.dist, k.z + Math.cos(k.yaw) * Math.cos(pitch) * k.dist);
  H.camera.lookAt(k.x, 0.4, k.z);
  H.camera.updateMatrixWorld();
}
placeCam();
H.light.update(H.tod);

// ---- scripted events
let clock = 0, boomT = 0.4, bountyT = 0.2, flakT = 0.3;
const lotsForBoom = burning.length ? burning : [focusTile];
function events(dt) {
  clock += dt;
  if (scene === 'fire' || scene === 'nightraid') {
    boomT -= dt;
    if (boomT <= 0) {
      boomT = scene === 'fire' ? 1.6 : 1.1;
      const i = lotsForBoom[(Math.random() * lotsForBoom.length) | 0];
      FX.explosion(W.x[i] + (Math.random() - 0.5) * 1.2, W.h[i] + 0.4, W.z[i] + (Math.random() - 0.5) * 1.2, 1.1 + Math.random() * 0.6, false);
    }
  }
  if (scene === 'nightraid') {
    flakT -= dt;
    if (flakT <= 0) {
      flakT = 0.18;
      const e = G.enemies[(Math.random() * 4) | 0];
      FX.flakBurst(e.x + (Math.random() - 0.5) * 3, e.y + (Math.random() - 0.5) * 1.5, e.z + (Math.random() - 0.5) * 3, 0.8);
      const b = G.buildings.filter((x) => x.type === 'flak')[(Math.random() * 2) | 0];
      FX.muzzle(b.x, b.y + 0.5, b.z, 0.9);
    }
    for (const e of G.enemies) { e.hitT = 0.1; if (e.domain === 'air') { e.x += Math.sin(clock * 0.3) * dt; } }
  }
  bountyT -= dt;
  if (bountyT <= 0 && (scene === 'nightraid' || scene === 'fire' || scene === 'street')) {
    bountyT = 0.5;
    const e = G.enemies[0] || { x: W.x[focusTile] + 1, y: 0.5, z: W.z[focusTile] };
    FX.bounty(e.x + (Math.random() - 0.5) * 2, e.y + 0.5, e.z + (Math.random() - 0.5) * 2, [200, 750, 1000, 5000, 250][(Math.random() * 5) | 0]);
  }
}

// prewarm: traffic spreads over the network, smoke columns and icons develop
const pre = +(q.get('pre') || 30);
for (let t = 0; t < pre; t += 0.1) {
  if (t > pre - 3) events(0.1);
  lifeFrame(0.1, H.camera);
}
if (scene === 'fire') FX.explosion(W.x[burning[1] || burning[0]] - 0.3, W.h[burning[0]] + 0.5, W.z[burning[0]] + 0.2, 1.6, false);
if (scene === 'nightraid' || scene === 'street') FX.explosion(W.x[focusTile] - 2.4, W.h[focusTile] + 0.3, W.z[focusTile] + 1.5, 1.2, false);

// ---- perf: lifeFrame cost with the full car count (no rendering)
if (scene === 'perf') {
  const N = 400, times = [];
  for (let k = 0; k < N; k++) {
    events(1 / 60);
    const t0 = performance.now();
    lifeFrame(1 / 60, H.camera);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const st = lifeStats();
  window.__perf = { avg: times.reduce((a, b) => a + b, 0) / N, p50: times[N >> 1], p95: times[Math.floor(N * 0.95)], max: times[N - 1], stats: st };
  console.log('PERF ' + JSON.stringify(window.__perf));
}

H.onFrame((dt) => {
  events(dt);
  lifeFrame(dt, H.camera);
  const r = H.renderer;
  r.info.reset();
  lightmapRender(r);
  window.__lmDraws = r.info.render.calls;
  roads.lampHead.emissiveIntensity = 7 * H.U.uNight.value;
  window.__markers = raidMarkers(H.camera).map((m) => ({ x: m.x | 0, y: m.y | 0, kind: m.kind, type: m.type, count: m.count }));
  window.__life = lifeStats();
  // life draws in the main scene and overlay
  let draws = 0;
  H.scene.traverse((o) => { if (o.visible && (o.isMesh) && /^(traffic|vehicle|fx-|raid|boats|gulls|lighthouse)/.test(o.name || '') && (o.count > 0 || (o.geometry.instanceCount ?? 1) > 0)) draws++; });
  H.post.overlay.traverse((o) => { if (o.visible && o.isMesh && o.geometry.instanceCount > 0) draws++; });
  window.__lifeDraws = draws;
});
if (q.get('warm') === '1') lifeWarm(true);
H.start(+(q.get('frames') || 2));
