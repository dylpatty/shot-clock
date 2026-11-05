// Node bench for the city modules (no rendering): node tests/city/node-bench.mjs [dense]
import * as THREE from 'three';
import { generateWorld, W, T, isLand, LF, ZONE } from '../../src/world.js';
import { hexDist } from '../../src/hex.js';
import { mulberry32 } from '../../src/rng.js';
const { initCity, cityOnWorldChanged, syncLots, cityStats, cityFrame } = await import('../../src/gfx/city.js');
const dense = process.argv[2] === 'dense';
generateWorld(7);
const rnd = mulberry32(7 * 977);
const c = W.center;
for (let i = 0; i < W.count; i++) {
  if (!isLand(W.type[i]) || W.type[i] === T.MOUNTAIN) continue;
  const d = hexDist(W.q[i], W.r[i], W.q[c], W.r[c]);
  const radial = W.q[i] === W.q[c] || W.r[i] === W.r[c] || (W.q[i] + W.r[i]) === (W.q[c] + W.r[c]);
  if ((d === 3 || d === 7 || d === 11 || (dense && (d === 5 || d === 9 || d === 13 || d===15))) || (radial && d <= (dense ? 18 : 14))) W.road[i] = 1;
}
for (let i = 0; i < W.count; i++) {
  if (W.road[i] || !isLand(W.type[i]) || W.type[i] === T.MOUNTAIN || i === c) continue;
  let nearRoad = false;
  for (let k = 0; k < 6; k++) { const j = W.nbr[i * 6 + k]; if (j >= 0 && W.road[j]) nearRoad = true; }
  if (!nearRoad) continue;
  const d = hexDist(W.q[i], W.r[i], W.q[c], W.r[c]);
  if (d > (dense ? 18 : 13)) continue;
  const x = rnd();
  W.zone[i] = d < 5 ? (x < 0.6 ? 2 : 1) : d < 10 ? (x < 0.7 ? 1 : 2) : (x < 0.5 ? 3 : 1);
  W.lvl[i] = dense ? 1 + Math.floor(rnd() * 3) : rnd() < 0.15 ? 0 : d < 4 ? 3 : d < 8 ? 1 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 2);
  W.style[i] = Math.floor(rnd() * 256);
  W.flags[i] = LF.POWER | LF.WATER | LF.ROAD;
  if (rnd() < 0.04) W.flags[i] |= LF.ABANDONED;
  if (rnd() < 0.03) W.fire[i] = 160;
  if (rnd() < 0.04) { W.flags[i] |= LF.BUILDING; W.lotT[i] = -2; }
  if (rnd() < 0.02) { W.flags[i] |= LF.RUBBLE; }
}
const scene = new THREE.Scene();
initCity(scene);
let t0 = performance.now();
for (let k = 0; k < 5; k++) cityOnWorldChanged();
console.log('full rebuild (world changed) avg ms', ((performance.now() - t0) / 5).toFixed(2));
t0 = performance.now();
for (let k = 0; k < 10; k++) syncLots(null);
console.log('syncLots(null) avg ms', ((performance.now() - t0) / 10).toFixed(2));
const lots = []; for (let i = 0; i < W.count; i++) if (W.zone[i]) lots.push(i);
let tot = 0, N = 200;
for (let k = 0; k < N; k++) {
  const list = [];
  for (let q = 0; q < 10; q++) { const i = lots[Math.floor(Math.random() * lots.length)]; W.lvl[i] = 1 + Math.floor(Math.random() * 3); W.style[i] = Math.floor(Math.random()*256); list.push(i); }
  const a = performance.now(); syncLots(list); tot += performance.now() - a;
}
console.log('10-tile patch avg ms', (tot / N).toFixed(3));
tot = 0;
for (let k = 0; k < N; k++) {
  const list = [];
  for (let q = 0; q < 10; q++) { const i = lots[Math.floor(Math.random() * lots.length)]; W.fire[i] = Math.floor(Math.random()*255); list.push(i); }
  const a = performance.now(); syncLots(list); tot += performance.now() - a;
}
console.log('10-tile fire patch avg ms', (tot / N).toFixed(3));
let fr = 0; const a = performance.now(); for (let k = 0; k < 1000; k++) cityFrame(1/60); fr = (performance.now() - a) / 1000;
console.log('cityFrame avg ms', fr.toFixed(4));
const st = cityStats();
console.log('lots', lots.length, 'draws', st.draws, 'tris', st.tris, 'instances', st.instances);
for (const p of st.pools) console.log(' ', p.name.padEnd(18), 'count', String(p.count).padStart(6), 'live', String(p.live).padStart(6), 'tris', String(p.tris).padStart(7), 'overflow', p.overflow);
