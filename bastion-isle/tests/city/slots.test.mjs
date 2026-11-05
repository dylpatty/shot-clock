// node tests/city/slots.test.mjs -- randomized check of the per-tile slot allocator used by the city pools
import * as THREE from 'three';
import { Pool } from '../../src/gfx/pools.js';
import { Slots } from '../../src/gfx/buildings.js';

const geo = new THREE.BoxGeometry();
const pool = new Pool(geo, new THREE.MeshBasicMaterial(), 9000);
const ex = pool.addAttribute('aX', 2);
const sl = new Slots(pool, [{ attr: ex, size: 2 }]);
const N = 300;
sl.reset(N);
const stride = sl.stride;
const stage = new Float32Array(64 * stride);
const want = new Int32Array(N);
let rnd = 12345;
const r = () => ((rnd = (rnd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
let repacks = 0;
for (let it = 0; it < 20000; it++) {
  const t = Math.floor(r() * N), n = r() < 0.2 ? 0 : 1 + Math.floor(r() * 40);
  for (let k = 0; k < n; k++) {
    stage.fill(0, k * stride, (k + 1) * stride);
    stage[k * stride + 15] = 1;          // matrix w
    stage[k * stride + 12] = t + 1;      // tag: x = tile + 1
    stage[k * stride + 19] = k;          // extra attr
  }
  sl.write(t, stage, n);
  want[t] = n;
  if (sl.fragmented()) {
    // production policy (buildLots/buildTrees): repack everything with a full rebuild
    repacks++;
    sl.reset(N);
    for (let q = 0; q < N; q++) {
      for (let k = 0; k < want[q]; k++) {
        stage.fill(0, k * stride, (k + 1) * stride);
        stage[k * stride + 15] = 1; stage[k * stride + 12] = q + 1; stage[k * stride + 19] = k;
      }
      if (want[q]) sl.write(q, stage, want[q]);
    }
  }
  if (it % 97 === 0) sl.commit();
}
sl.commit();
// verify: ranges disjoint, inside [0, end), contents tagged, leftovers zeroed
const owner = new Int32Array(sl.end).fill(-1);
let ok = true;
for (let t = 0; t < N; t++) {
  const s = sl.start[t], c = sl.cap[t];
  if (want[t] > 0 && (s < 0 || c < want[t])) { ok = false; console.log('tile', t, 'missing range'); }
  for (let k = 0; k < c; k++) {
    if (owner[s + k] !== -1) { ok = false; console.log('overlap at', s + k); }
    owner[s + k] = t;
    const x = pool.mArr[(s + k) * 16 + 12], w = pool.mArr[(s + k) * 16 + 15];
    if (k < want[t] && (x !== t + 1 || w !== 1 || ex.array[(s + k) * 2] !== k)) { ok = false; console.log('bad content', t, k); }
    if (k >= want[t] && w !== 0) { ok = false; console.log('leftover not hidden', t, k); }
  }
}
for (let i = 0; i < sl.end; i++) if (owner[i] === -1 && pool.mArr[i * 16 + 15] !== 0) { ok = false; console.log('free slot visible', i); }
const used = want.reduce((a, b) => a + b, 0);
console.log(ok ? "OK" : "FAIL", "repacks", repacks, "overflow", sl.overflow, "end", sl.end, 'live', sl.live, 'used', used, 'free ranges', sl.free.length / 2, 'mesh.count', pool.mesh.count);
process.exit(ok ? 0 : 1);
