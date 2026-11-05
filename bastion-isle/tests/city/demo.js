// GFX-CITY visual test. URL params: seed, tod (cycle 0..1), x, z, dist, yaw, tilt, scene=fake|dense|downtown,
// gt (game time for construction progress), clay (0..1).
import { H } from '../gfx/harness.js';
import { W, T, isLand, LF, ZONE } from '../../src/world.js';
import { hexDist } from '../../src/hex.js';
import { mulberry32 } from '../../src/rng.js';
import { initCity, cityOnWorldChanged, syncLots, cityFrame, cityStats } from '../../src/gfx/city.js';
import { cityTestGround } from './ground.js';

const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) ? +q.get(k) : d);
const sceneKind = q.get('scene') || 'fake';
await H.init({ seed: num('seed', 7), city: true });

function zoneAround(maxD, roadRings, fn) {
  const c = W.center, rnd = mulberry32(99);
  for (let i = 0; i < W.count; i++) {
    if (!isLand(W.type[i]) || W.type[i] === T.MOUNTAIN) continue;
    const d = hexDist(W.q[i], W.r[i], W.q[c], W.r[c]);
    const radial = W.q[i] === W.q[c] || W.r[i] === W.r[c] || (W.q[i] + W.r[i]) === (W.q[c] + W.r[c]);
    if (roadRings.includes(d) || (radial && d <= maxD + 1)) { W.road[i] = 1; W.zone[i] = 0; W.lvl[i] = 0; }
  }
  for (let i = 0; i < W.count; i++) {
    if (W.road[i] || !isLand(W.type[i]) || W.type[i] === T.MOUNTAIN || i === c) continue;
    const d = hexDist(W.q[i], W.r[i], W.q[c], W.r[c]);
    if (d > maxD) continue;
    let near = false;
    for (let k = 0; k < 6; k++) { const j = W.nbr[i * 6 + k]; if (j >= 0 && W.road[j]) near = true; }
    if (!near) continue;
    fn(i, d, rnd);
  }
}
if (sceneKind === 'downtown') {
  zoneAround(9, [2, 4, 6, 8], (i, d, rnd) => {
    W.zone[i] = d < 6 ? (rnd() < 0.65 ? ZONE.C : ZONE.R) : (rnd() < 0.5 ? ZONE.R : ZONE.C);
    W.lvl[i] = d < 6 ? 3 : 1 + Math.floor(rnd() * 3);
    W.style[i] = Math.floor(rnd() * 256);
    W.flags[i] = LF.POWER | LF.WATER | LF.ROAD; W.fire[i] = 0;
    if (rnd() < 0.05) { W.flags[i] |= LF.BUILDING; W.lotT[i] = -3; }
  });
} else if (sceneKind === 'dense') {
  zoneAround(18, [3, 5, 7, 9, 11, 13, 15], (i, d, rnd) => {
    W.zone[i] = d < 6 ? (rnd() < 0.6 ? ZONE.C : ZONE.R) : d < 12 ? (rnd() < 0.7 ? ZONE.R : ZONE.C) : (rnd() < 0.5 ? ZONE.I : ZONE.R);
    W.lvl[i] = d < 5 ? 3 : 1 + Math.floor(rnd() * 3);
    W.style[i] = Math.floor(rnd() * 256);
    W.flags[i] = LF.POWER | LF.WATER | LF.ROAD;
  });
}
if (sceneKind === 'showcase') {
  // every zone x level plus the special states, cycling around two ring roads (close-up QA)
  let k = 0;
  const seq = [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3], [1, 1, 'aband'], [2, 2, 'fire'], [1, 2, 'build'], [2, 3, 'build'], [3, 2, 'rubble'], [1, 1], [2, 1]];
  zoneAround(8, [3, 6, 9], (i, d, rnd) => {
    const [z, l, st] = seq[k++ % seq.length];
    W.zone[i] = z; W.lvl[i] = l; W.style[i] = Math.floor(rnd() * 256); W.fire[i] = 0; W.lotT[i] = -1;
    W.flags[i] = LF.POWER | LF.WATER | LF.ROAD;
    if (st === 'aband') W.flags[i] |= LF.ABANDONED;
    if (st === 'fire') W.fire[i] = 200;
    if (st === 'build') { W.flags[i] |= LF.BUILDING; W.lotT[i] = -2 - rnd() * 4; }
    if (st === 'rubble') { W.flags[i] |= LF.RUBBLE; W.lvl[i] = 0; }
  });
}
const gt = num('gt', 3);
if (q.has('mix')) {
  // a showcase strip: force every zone x level next to the centre for close-ups
}
cityTestGround(H.scene);
const noCity = q.has('nocity');           // baseline for draw-call / triangle deltas
if (!noCity) { initCity(H.scene); cityOnWorldChanged(); }
const t0 = performance.now();
for (let k = 0; k < 5; k++) syncLots(null);
const fullMs = (performance.now() - t0) / 5;
// 10-tile patches (fire/level changes)
const lots = []; for (let i = 0; i < W.count; i++) if (W.zone[i] && W.lvl[i]) lots.push(i);
let patchMs = 0;
const rr = mulberry32(5);
for (let k = 0; k < 20; k++) {
  const list = [];
  for (let n = 0; n < 10; n++) { const i = lots[Math.floor(rr() * lots.length)]; list.push(i); }
  const a = performance.now(); syncLots(list); patchMs += performance.now() - a;
}
patchMs /= 20;
H.setCam({ x: num('x', 0), z: num('z', 4), dist: num('dist', 40), yaw: num('yaw', 0.7), tilt: num('tilt', 0) });
H.setTod(num('tod', 0.33));
H.U.uClay.value = num('clay', 0);
let curGt = gt;
window.__frames = 0;
H.onFrame((dt) => {
  H.G.time = curGt; H.U.uGameTime.value = curGt;
  cityFrame(dt);
  window.__frames++;
});
// shoot.cjs drives several shots per page load
window.__shot = (s) => {
  if (s.cam) H.setCam(s.cam);
  if (s.tod != null) H.setTod(s.tod);
  if (s.gt != null) curGt = s.gt;
  if (s.clay != null) H.U.uClay.value = s.clay;
  window.__frames = 0;
};
H.start(num('warm', 2));
window.__city = () => ({ fullMs, patchMs, lots: lots.length, ...cityStats() });
