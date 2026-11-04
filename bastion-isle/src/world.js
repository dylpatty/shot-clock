import { SQRT3, DIRS, hexX, hexZ, hexDist, worldToAxial } from './hex.js';
import { mulberry32, makeNoise, fbm, hash2 } from './rng.js';

export const T = { DEEP: 0, SHALLOW: 1, SAND: 2, GRASS: 3, FOREST: 4, HILLS: 5, MOUNTAIN: 6 };
export const TERRAIN = [
  { name: 'Deep Sea', color: 0x1d5f8a },
  { name: 'Shallows', color: 0x4fb8c4 },
  { name: 'Beach', color: 0xe9d6a0 },
  { name: 'Grassland', color: 0x8cbd52 },
  { name: 'Forest', color: 0x6a9f42 },
  { name: 'Hills', color: 0xb1a27a },
  { name: 'Mountain', color: 0x8f8a84 },
];
export const isWater = (t) => t <= T.SHALLOW;
export const isLand = (t) => t >= T.SAND;
export const isWalkable = (t) => t >= T.SAND && t !== T.MOUNTAIN;

// All map data lives in flat typed arrays indexed by tile number
export const W = {
  R: 0, count: 0, seed: 0,
  q: null, r: null, x: null, z: null, h: null, type: null,
  bld: null,   // building id on the tile, 0 = none
  road: null,  // 1 if the tile carries a road
  conn: null,  // 1 if this road reaches the town hall
  ruin: null,  // building type index + 1 of a destroyed building's rubble
  nbr: null,   // 6 neighbour indices per tile, -1 off the map
  lookup: null,
  center: 0,
  land: [], coast: [], edge: [], landing: [], shore: [],
  version: 0,  // bumped whenever terrain or roads change (minimap, connectivity)
};

export function tileIndex(q, r) {
  const R = W.R;
  if (q < -R || q > R || r < -R || r > R || q + r < -R || q + r > R) return -1;
  return W.lookup[(q + R) * (2 * R + 1) + (r + R)];
}

const _a = { q: 0, r: 0 };
export function tileAt(x, z) {
  worldToAxial(x, z, _a);
  return tileIndex(_a.q, _a.r);
}

// Height of the ground (or sea surface) under a world position
export function groundY(x, z) {
  const i = tileAt(x, z);
  if (i < 0) return 0;
  return isLand(W.type[i]) ? W.h[i] : 0;
}

export function tileDist(a, b) { return hexDist(W.q[a], W.r[a], W.q[b], W.r[b]); }
export function worldDist(a, b) { return Math.hypot(W.x[a] - W.x[b], W.z[a] - W.z[b]); }

export function countNeighbours(i, pred) {
  let n = 0;
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[i * 6 + d];
    if (j >= 0 && pred(W.type[j], j)) n++;
  }
  return n;
}

export function generateWorld(seed, R = 24) {
  W.R = R; W.seed = seed;
  const coords = [];
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (Math.abs(q + r) <= R) coords.push(q, r);
    }
  }
  const n = coords.length / 2;
  W.count = n;
  W.q = new Int16Array(n); W.r = new Int16Array(n);
  W.x = new Float32Array(n); W.z = new Float32Array(n); W.h = new Float32Array(n);
  W.type = new Uint8Array(n); W.bld = new Int32Array(n); W.road = new Uint8Array(n);
  W.conn = new Uint8Array(n); W.ruin = new Uint8Array(n);
  W.nbr = new Int32Array(n * 6);
  W.lookup = new Int32Array((2 * R + 1) * (2 * R + 1)).fill(-1);
  for (let i = 0; i < n; i++) {
    const q = coords[i * 2], r = coords[i * 2 + 1];
    W.q[i] = q; W.r[i] = r;
    W.x[i] = hexX(q, r); W.z[i] = hexZ(q, r);
    W.lookup[(q + R) * (2 * R + 1) + (r + R)] = i;
  }
  for (let i = 0; i < n; i++) {
    for (let d = 0; d < 6; d++) W.nbr[i * 6 + d] = tileIndex(W.q[i] + DIRS[d][0], W.r[i] + DIRS[d][1]);
  }
  W.center = tileIndex(0, 0);

  const rand = mulberry32(seed);
  const nE = makeNoise(rand), nM = makeNoise(rand), nR = makeNoise(rand), nW = makeNoise(rand);
  const elev = new Float32Array(n), moist = new Float32Array(n), ridge = new Float32Array(n);

  let islandR = R * 1.5 * 0.6;
  let land = 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    land = 0;
    for (let i = 0; i < n; i++) {
      const x = W.x[i], z = W.z[i];
      const wx = x + fbm(nW, x * 0.045, z * 0.045, 2) * 7;
      const wz = z + fbm(nW, x * 0.045 + 31.7, z * 0.045 - 12.3, 2) * 7;
      const d = Math.hypot(wx, wz) / islandR;
      elev[i] = 1 - d * d * 0.9 - d * 0.15 + fbm(nE, wx * 0.085, wz * 0.085, 4) * 0.45;
      moist[i] = fbm(nM, x * 0.1 + 5.1, z * 0.1 - 3.3, 3);
      ridge[i] = 1 - Math.abs(fbm(nR, x * 0.065, z * 0.065, 4)) * 2.2;
      if (elev[i] > 0) land++;
    }
    if (land < 420) islandR *= 1.08;
    else if (land > 900) islandR *= 0.93;
    else break;
  }

  // Classify, nudging thresholds until the island has enough of every resource
  let thF = 0.12, thH = 0.8, thM = 0.93;
  for (let attempt = 0; attempt < 8; attempt++) {
    let nF = 0, nH = 0, nMt = 0, nL = 0;
    for (let i = 0; i < n; i++) {
      if (elev[i] <= 0) { W.type[i] = T.DEEP; continue; }
      nL++;
      const nearCentre = hexDist(W.q[i], W.r[i], 0, 0) <= 2;
      let t = T.GRASS;
      if (!nearCentre) {
        if (ridge[i] > thM && elev[i] > 0.42) t = T.MOUNTAIN;
        else if (ridge[i] > thH && elev[i] > 0.22) t = T.HILLS;
        else if (moist[i] > thF) t = T.FOREST;
      }
      W.type[i] = t;
      if (t === T.FOREST) nF++; else if (t === T.HILLS) nH++; else if (t === T.MOUNTAIN) nMt++;
    }
    let ok = true;
    if (nF < nL * 0.16) { thF -= 0.07; ok = false; } else if (nF > nL * 0.34) { thF += 0.06; ok = false; }
    if (nH < nL * 0.07) { thH -= 0.05; ok = false; } else if (nH > nL * 0.18) { thH += 0.03; ok = false; }
    if (nMt < nL * 0.02) { thM -= 0.025; ok = false; } else if (nMt > nL * 0.07) { thM += 0.015; ok = false; }
    if (ok) break;
  }

  // Keep only the land connected to the centre
  const seen = new Uint8Array(n);
  const stack = [W.center];
  seen[W.center] = 1;
  W.type[W.center] = T.GRASS;
  while (stack.length) {
    const c = stack.pop();
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[c * 6 + d];
      if (j >= 0 && !seen[j] && isLand(W.type[j])) { seen[j] = 1; stack.push(j); }
    }
  }
  for (let i = 0; i < n; i++) if (isLand(W.type[i]) && !seen[i]) W.type[i] = T.DEEP;
  // Nothing may touch the map edge
  for (let i = 0; i < n; i++) if (hexDist(W.q[i], W.r[i], 0, 0) >= R - 4) W.type[i] = T.DEEP;

  // Beaches along low coast
  for (let i = 0; i < n; i++) {
    if (!isLand(W.type[i]) || W.type[i] === T.MOUNTAIN) continue;
    if (hexDist(W.q[i], W.r[i], 0, 0) <= 2) continue;
    let water = 0;
    for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j < 0 || !isLand(W.type[j])) water++; }
    if (water > 0 && (elev[i] < 0.3 || W.type[i] !== T.HILLS) && hash2(i, seed) < 0.82) W.type[i] = T.SAND;
  }

  // Shallows: water within 2 tiles of land
  const dist = new Int16Array(n).fill(999);
  const queue = [];
  for (let i = 0; i < n; i++) if (isLand(W.type[i])) { dist[i] = 0; queue.push(i); }
  for (let qi = 0; qi < queue.length; qi++) {
    const c = queue[qi];
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[c * 6 + d];
      if (j >= 0 && dist[j] > dist[c] + 1) { dist[j] = dist[c] + 1; queue.push(j); }
    }
  }
  for (let i = 0; i < n; i++) if (!isLand(W.type[i])) W.type[i] = dist[i] <= 2 ? T.SHALLOW : T.DEEP;

  // Heights, stepped a little for a terraced look
  for (let i = 0; i < n; i++) {
    const t = W.type[i];
    const v = hash2(i, seed + 7) - 0.5;
    let h;
    switch (t) {
      case T.DEEP: h = -1.4; break;
      case T.SHALLOW: h = -0.5; break;
      case T.SAND: h = 0.16 + v * 0.04; break;
      case T.GRASS: h = 0.3 + Math.max(0, elev[i] - 0.3) * 0.22 + v * 0.05; break;
      case T.FOREST: h = 0.32 + Math.max(0, elev[i] - 0.3) * 0.22 + v * 0.05; break;
      case T.HILLS: h = 0.62 + Math.max(0, ridge[i] - thH) * 2 + v * 0.08; break;
      case T.MOUNTAIN: h = 1.05 + Math.max(0, ridge[i] - thM) * 9 + v * 0.15; break;
    }
    if (t >= T.SAND && t <= T.HILLS) h = Math.round(h / 0.06) * 0.06;
    W.h[i] = Math.min(h, 2.4);
  }

  rebuildLists();
  W.version++;
}

export function rebuildLists() {
  W.land = []; W.coast = []; W.edge = []; W.landing = []; W.shore = [];
  for (let i = 0; i < W.count; i++) {
    const t = W.type[i];
    if (isLand(t)) {
      W.land.push(i);
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[i * 6 + d];
        if (j >= 0 && isWater(W.type[j])) { W.coast.push(i); break; }
      }
    } else {
      if (hexDist(W.q[i], W.r[i], 0, 0) === W.R) W.edge.push(i);
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[i * 6 + d];
        if (j >= 0 && isLand(W.type[j])) { W.shore.push(i); break; }
      }
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[i * 6 + d];
        if (j >= 0 && isWalkable(W.type[j])) { W.landing.push(i); break; }
      }
    }
  }
}

// Decorations: trees on forests, rocks on hills. Deterministic from the tile index.
export function treesFor(i, out) {
  const k = 3 + Math.floor(hash2(i, 11) * 3);
  for (let t = 0; t < k; t++) {
    const a = hash2(i, 20 + t) * Math.PI * 2;
    const r = 0.18 + hash2(i, 40 + t) * 0.5;
    out.push(W.x[i] + Math.cos(a) * r, W.h[i], W.z[i] + Math.sin(a) * r, 0.75 + hash2(i, 60 + t) * 0.55, hash2(i, 80 + t));
  }
}
