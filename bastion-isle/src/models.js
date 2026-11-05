import * as THREE from 'three';

// Every model is a single flat-shaded BufferGeometry with per-vertex colours, so a whole building type
// draws in one instanced call. Models face +z; y = 0 is the top of the tile.
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

export const C = {
  wall: 0xf1e7d3, wall2: 0xe0d0b0, brick: 0x9a4a3a, roofRed: 0xb4503a, roofDark: 0x6e3a2e, roofBlue: 0x3f63a8, roofGreen: 0x4f7a44,
  wood: 0x93683f, wood2: 0xa77c4f, woodDark: 0x5c3f27, stone: 0xbdb6a8, stoneDark: 0x8b867c, plaza: 0xd6cbb2,
  concrete: 0xaeb0a8, concreteDark: 0x7f827c, metal: 0x4d5257, metalDark: 0x2f3337, metalLight: 0x9aa3ab,
  olive: 0x6f7a46, oliveDark: 0x4e5632, gun: 0x5f6b4f, sandbag: 0xc4b07c, soil: 0x7a5a3a,
  field: 0xe3c35c, fieldG: 0x9ccb5c, white: 0xf3f3ee, red: 0xc23a2e, blue: 0x3a6fd8, glass: 0x9fd2ec, dark: 0x22252a,
  copper: 0x6fae94, snow: 0xf4f6fa, rock: 0x8e8a84, rockDark: 0x6f6b66, leaf: 0x3f8a3a, leaf2: 0x57a145, trunk: 0x6b4a2e,
  asphalt: 0x4a4d50, yellow: 0xe8c040, skin: 0xe0b48c,
  eHull: 0x4b5057, eDeck: 0x7a7d7f, eCabin: 0x8d9195, eRed: 0xb3302a, eOlive: 0x59603f, eTroop: 0x8f3a30,
  ePlane: 0x7c3b30, ePlane2: 0x5c5f63, aPlane: 0x4d74c4, aPlane2: 0xd8dde6, aTroop: 0x3c62b5,
};

export class MB {
  constructor() { this.p = []; this.c = []; }

  add(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const pos = g.attributes.position;
    _e.set(rx, ry, rz, 'YXZ');
    _q.setFromEuler(_e);
    _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz));
    _c.setHex(color);
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(_m);
      this.p.push(_v.x, _v.y, _v.z);
      this.c.push(_c.r, _c.g, _c.b);
    }
    if (g !== geo) g.dispose();
    geo.dispose();
    return this;
  }

  // y is the bottom of the shape for box, cyl, cone, gable and pyramid; the centre for the *C and sphere helpers
  box(w, h, d, color, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, rx, ry, rz);
  }
  boxC(w, h, d, color, x, y, z, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz);
  }
  cyl(rt, rb, h, seg, color, x = 0, y = 0, z = 0, ry = 0) {
    return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), color, x, y + h / 2, z, 0, ry, 0);
  }
  cylC(rt, rb, len, seg, color, x, y, z, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.CylinderGeometry(rt, rb, len, seg), color, x, y, z, rx, ry, rz);
  }
  cone(r, h, seg, color, x = 0, y = 0, z = 0, ry = 0) {
    return this.add(new THREE.ConeGeometry(r, h, seg), color, x, y + h / 2, z, 0, ry, 0);
  }
  sphere(r, color, x, y, z, ws = 8, hs = 6, sx = 1, sy = 1, sz = 1) {
    return this.add(new THREE.SphereGeometry(r, ws, hs), color, x, y, z, 0, 0, 0, sx, sy, sz);
  }
  dome(r, color, x, y, z, ws = 10) {
    return this.add(new THREE.SphereGeometry(r, ws, 4, 0, Math.PI * 2, 0, Math.PI / 2), color, x, y, z);
  }
  raw(verts, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return this.add(g, color, x, y, z, rx, ry, rz);
  }
  // Triangular prism roof, ridge along local x
  gable(len, wid, hgt, color, x = 0, y = 0, z = 0, ry = 0) {
    const l = len / 2, w = wid / 2, h = hgt;
    const A = [-l, 0, -w], B = [l, 0, -w], Cc = [l, 0, w], D = [-l, 0, w], E = [-l, h, 0], F = [l, h, 0];
    const v = [...A, ...F, ...B, ...A, ...E, ...F, ...D, ...Cc, ...F, ...D, ...F, ...E, ...A, ...D, ...E, ...B, ...F, ...Cc];
    return this.raw(v, color, x, y, z, 0, ry, 0);
  }
  pyramid(w, d, h, color, x = 0, y = 0, z = 0, ry = 0) {
    const a = w / 2, b = d / 2;
    const A = [-a, 0, -b], B = [a, 0, -b], Cc = [a, 0, b], D = [-a, 0, b], P = [0, h, 0];
    const v = [...A, ...P, ...B, ...B, ...P, ...Cc, ...Cc, ...P, ...D, ...D, ...P, ...A];
    return this.raw(v, color, x, y, z, 0, ry, 0);
  }

  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

function hullGeo(len, beam, h, bow = 0.28) {
  const L = len / 2, B = beam / 2;
  const s = new THREE.Shape();
  // Shape +y becomes world -z after the rotation below, so the bow sits at shape -y
  s.moveTo(-B * 0.78, L);
  s.lineTo(B * 0.78, L);
  s.lineTo(B, L * 0.55);
  s.lineTo(B, -L * (1 - 2 * bow));
  s.lineTo(B * 0.5, -L * 0.86);
  s.lineTo(0, -L);
  s.lineTo(-B * 0.5, -L * 0.86);
  s.lineTo(-B, -L * (1 - 2 * bow));
  s.lineTo(-B, L * 0.55);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

function sandbagRing(b, r, y, n, gap = -1) {
  for (let i = 0; i < n; i++) {
    if (i === gap) continue;
    const a = (i / n) * Math.PI * 2;
    b.box(r * 0.75, 0.13, 0.11, C.sandbag, Math.cos(a) * r, y, Math.sin(a) * r, -a - Math.PI / 2);
  }
}

function person(b, body, x, y, z, s = 1) {
  b.box(0.1 * s, 0.15 * s, 0.07 * s, body, x, y, z);
  b.sphere(0.045 * s, C.skin, x, y + 0.19 * s, z, 6, 4);
  b.dome(0.05 * s, body, x, y + 0.2 * s, z, 6);
}

function tinyTree(b, x, z, s = 1) {
  b.cyl(0.025 * s, 0.035 * s, 0.1 * s, 5, C.trunk, x, 0, z);
  b.cone(0.13 * s, 0.26 * s, 6, C.leaf, x, 0.08 * s, z);
}

// ---------------------------------------------------------------- buildings

function mHQ() {
  const b = new MB();
  b.cyl(0.84, 0.88, 0.12, 6, C.stone);
  b.box(1.0, 0.42, 0.6, C.wall, 0.06, 0.12, 0.08);
  b.gable(1.1, 0.72, 0.3, C.roofBlue, 0.06, 0.54, 0.08);
  b.box(0.16, 0.24, 0.02, C.woodDark, 0.06, 0.12, 0.39);
  for (const x of [-0.3, -0.12, 0.24, 0.42]) b.box(0.1, 0.13, 0.02, C.glass, x, 0.28, 0.39);
  b.box(0.34, 0.04, 0.16, C.stoneDark, 0.06, 0.12, 0.46);
  // clock tower
  b.box(0.3, 0.95, 0.3, C.wall2, -0.36, 0.12, -0.3);
  b.box(0.34, 0.06, 0.34, C.stoneDark, -0.36, 1.07, -0.3);
  b.pyramid(0.36, 0.36, 0.32, C.roofBlue, -0.36, 1.13, -0.3);
  b.cylC(0.08, 0.08, 0.02, 10, C.white, -0.36, 0.85, -0.14, Math.PI / 2);
  b.cylC(0.012, 0.012, 0.5, 4, C.metalDark, -0.36, 1.66, -0.3);
  b.box(0.24, 0.14, 0.012, C.blue, -0.23, 1.72, -0.3);
  return b.geo();
}

function mHouse(stories) {
  const b = new MB();
  const h = stories === 2 ? 0.56 : 0.34;
  b.box(0.58, h, 0.44, C.wall, -0.1, 0, -0.06);
  b.gable(0.68, 0.56, 0.26, stories === 2 ? C.roofBlue : C.roofRed, -0.1, h, -0.06);
  b.box(0.08, 0.22, 0.08, C.brick, 0.08, h + 0.06, -0.14);
  b.box(0.12, 0.2, 0.02, C.woodDark, -0.1, 0, 0.165);
  b.box(0.1, 0.1, 0.02, C.glass, -0.3, 0.14, 0.165);
  b.box(0.1, 0.1, 0.02, C.glass, 0.1, 0.14, 0.165);
  if (stories === 2) {
    b.box(0.1, 0.1, 0.02, C.glass, -0.3, 0.38, 0.165);
    b.box(0.1, 0.1, 0.02, C.glass, 0.1, 0.38, 0.165);
    b.box(0.1, 0.1, 0.02, C.glass, -0.1, 0.38, 0.165);
  }
  b.box(0.26, 0.22, 0.26, C.wall2, 0.36, 0, 0.28);
  b.gable(0.3, 0.32, 0.14, C.roofDark, 0.36, 0.22, 0.28, Math.PI / 2);
  b.box(0.3, 0.06, 0.04, C.wood, -0.42, 0, 0.42, 0.5);
  tinyTree(b, -0.46, 0.3, 0.9);
  return b.geo();
}

function mFarm() {
  const b = new MB();
  b.box(0.78, 0.02, 1.02, C.soil, 0.26, 0, 0.0);
  for (let i = 0; i < 4; i++) b.box(0.14, 0.05, 0.94 - (i === 3 ? 0.3 : 0), i % 2 ? C.fieldG : C.field, 0.0 + i * 0.18, 0.02, 0.0);
  b.box(0.38, 0.3, 0.46, C.red, -0.42, 0, -0.18);
  b.gable(0.54, 0.44, 0.18, C.roofDark, -0.42, 0.3, -0.18, Math.PI / 2);
  b.box(0.16, 0.18, 0.02, C.white, -0.42, 0, 0.055);
  b.cyl(0.1, 0.1, 0.52, 8, C.metalLight, -0.45, 0, 0.3);
  b.dome(0.1, C.roofDark, -0.45, 0.52, 0.3, 8);
  return b.geo();
}

function mDock() {
  const b = new MB();
  b.box(0.7, 0.06, 0.5, C.wood, 0, -0.02, 0.05);
  b.box(0.26, 0.05, 1.25, C.wood2, 0.05, -0.02, 0.9);
  for (const z of [0.6, 1.05, 1.45]) for (const x of [-0.08, 0.18]) b.cyl(0.025, 0.025, 0.55, 5, C.woodDark, x, -0.55, z);
  b.box(0.36, 0.26, 0.3, C.wood, -0.24, 0.04, -0.3);
  b.gable(0.42, 0.38, 0.14, C.roofRed, -0.24, 0.3, -0.3);
  b.box(0.12, 0.12, 0.12, C.woodDark, 0.25, 0.04, -0.25);
  b.cyl(0.05, 0.05, 0.12, 6, C.wood, 0.3, 0.04, -0.05);
  b.add(hullGeo(0.5, 0.18, 0.09), C.white, 0.38, -0.25, 1.1);
  b.box(0.1, 0.08, 0.12, C.red, 0.38, -0.16, 1.05);
  return b.geo();
}

function mLumber() {
  const b = new MB();
  b.box(0.42, 0.28, 0.34, C.woodDark, -0.22, 0, -0.22);
  b.gable(0.5, 0.42, 0.16, C.roofGreen, -0.22, 0.28, -0.22);
  for (const [z, y] of [[0.08, 0], [0.22, 0], [0.36, 0], [0.15, 0.12], [0.29, 0.12]]) {
    b.cylC(0.065, 0.065, 0.62, 7, C.wood2, 0.12, y + 0.065, z, 0, 0, Math.PI / 2);
  }
  b.cyl(0.08, 0.09, 0.1, 7, C.wood, -0.35, 0, 0.3);
  b.box(0.02, 0.16, 0.02, C.metalDark, -0.33, 0.1, 0.3, 0, 0.4);
  tinyTree(b, 0.45, -0.35, 1.1);
  tinyTree(b, 0.25, -0.5, 0.9);
  return b.geo();
}

function mQuarry() {
  const b = new MB();
  b.box(0.8, 0.1, 0.7, C.stoneDark, 0.05, 0, 0.0);
  b.box(0.58, 0.14, 0.5, C.stone, 0.12, 0.1, -0.06);
  b.box(0.36, 0.14, 0.32, C.stoneDark, 0.18, 0.24, -0.12);
  for (const [x, z, s] of [[-0.4, 0.3, 1], [-0.25, 0.42, 0.8], [0.45, 0.4, 0.9], [-0.45, 0.1, 0.7]]) b.box(0.13 * s, 0.11 * s, 0.13 * s, C.stone, x, 0, z, x * 3);
  b.box(0.04, 0.6, 0.04, C.woodDark, -0.3, 0, -0.32);
  b.boxC(0.5, 0.035, 0.035, C.wood, -0.1, 0.58, -0.32, 0, 0, -0.25);
  b.cylC(0.006, 0.006, 0.3, 3, C.dark, 0.12, 0.38, -0.32);
  b.box(0.08, 0.08, 0.08, C.stone, 0.12, 0.18, -0.32);
  b.box(0.3, 0.2, 0.24, C.wood, -0.38, 0, -0.05);
  return b.geo();
}

function mMine() {
  const b = new MB();
  b.sphere(0.5, C.rockDark, -0.05, 0.02, -0.15, 7, 4, 1.1, 0.55, 0.9);
  b.box(0.28, 0.26, 0.12, C.dark, 0.0, 0, 0.3);
  b.box(0.05, 0.3, 0.05, C.wood, -0.17, 0, 0.36);
  b.box(0.05, 0.3, 0.05, C.wood, 0.17, 0, 0.36);
  b.box(0.42, 0.06, 0.06, C.wood, 0, 0.28, 0.36);
  b.box(0.03, 0.02, 0.5, C.metal, -0.06, 0, 0.6);
  b.box(0.03, 0.02, 0.5, C.metal, 0.06, 0, 0.6);
  b.box(0.2, 0.12, 0.16, C.metalLight, 0, 0.03, 0.62);
  b.cone(0.1, 0.1, 5, C.dark, 0.0, 0.15, 0.62);
  // headframe
  b.box(0.04, 0.7, 0.04, C.woodDark, 0.32, 0, -0.1, 0, 0, 0.12);
  b.box(0.04, 0.7, 0.04, C.woodDark, 0.5, 0, -0.1, 0, 0, -0.12);
  b.cylC(0.1, 0.1, 0.03, 10, C.metal, 0.41, 0.66, -0.1, Math.PI / 2);
  b.cone(0.12, 0.12, 5, C.rockDark, -0.42, 0, 0.35);
  return b.geo();
}

function mMarket() {
  const b = new MB();
  b.cyl(0.8, 0.82, 0.04, 6, C.plaza);
  const stalls = [[-0.35, -0.25, C.red], [0.35, -0.2, C.yellow], [0.0, 0.38, C.blue]];
  for (const [x, z, col] of stalls) {
    for (const dx of [-0.15, 0.15]) for (const dz of [-0.12, 0.12]) b.box(0.025, 0.24, 0.025, C.woodDark, x + dx, 0.04, z + dz);
    b.pyramid(0.42, 0.34, 0.14, col, x, 0.28, z);
    b.box(0.3, 0.1, 0.2, C.wood2, x, 0.04, z);
  }
  b.cyl(0.08, 0.1, 0.12, 8, C.stoneDark, 0.05, 0.04, -0.02);
  b.box(0.1, 0.1, 0.1, C.wood, -0.55, 0.04, 0.2);
  b.cyl(0.05, 0.05, 0.12, 6, C.wood, 0.55, 0.04, 0.2);
  return b.geo();
}

function mCollege() {
  const b = new MB();
  b.box(1.08, 0.08, 0.86, C.stone, 0, 0, 0);
  b.box(0.92, 0.44, 0.52, C.wall, 0, 0.08, -0.08);
  for (let i = 0; i < 6; i++) b.cyl(0.035, 0.04, 0.4, 6, C.white, -0.38 + i * 0.152, 0.08, 0.28);
  b.box(0.96, 0.05, 0.22, C.wall2, 0, 0.48, 0.24);
  b.gable(0.98, 0.7, 0.16, C.roofDark, 0, 0.52, -0.05);
  b.cyl(0.2, 0.2, 0.14, 10, C.wall2, 0, 0.62, -0.08);
  b.dome(0.21, C.copper, 0, 0.76, -0.08, 12);
  b.cyl(0.015, 0.015, 0.2, 4, C.metalDark, 0, 0.95, -0.08);
  b.box(0.14, 0.2, 0.02, C.woodDark, 0, 0.08, 0.19);
  return b.geo();
}

function mBarracks() {
  const b = new MB();
  b.box(0.95, 0.3, 0.42, C.olive, 0, 0, -0.18);
  b.gable(1.02, 0.52, 0.18, C.oliveDark, 0, 0.3, -0.18);
  b.box(0.14, 0.2, 0.02, C.woodDark, 0.1, 0, 0.035);
  for (const x of [-0.35, -0.15, 0.32]) b.box(0.1, 0.08, 0.02, C.glass, x, 0.14, 0.035);
  b.box(0.95, 0.02, 0.5, C.sandbag, 0, 0, 0.3);
  for (const x of [-0.36, -0.12, 0.12, 0.36]) b.box(0.2, 0.1, 0.1, C.sandbag, x, 0.02, 0.55);
  b.cyl(0.012, 0.012, 0.8, 4, C.metalDark, -0.42, 0, 0.3);
  b.box(0.22, 0.13, 0.012, C.blue, -0.3, 0.64, 0.3);
  b.box(0.12, 0.1, 0.1, C.wood, 0.4, 0.02, 0.3);
  return b.geo();
}

function mMG() {
  const b = new MB();
  b.cyl(0.42, 0.46, 0.06, 8, C.soil);
  sandbagRing(b, 0.37, 0.06, 9);
  sandbagRing(b, 0.37, 0.19, 9, 0);
  b.box(0.12, 0.08, 0.08, C.olive, -0.15, 0.06, -0.12);
  return b.geo();
}
function mMGHead() {
  const b = new MB();
  b.cyl(0.02, 0.03, 0.1, 5, C.metalDark, 0, 0, 0);
  b.box(0.07, 0.07, 0.24, C.metalDark, 0, 0.1, 0.04);
  b.cylC(0.016, 0.016, 0.24, 5, C.metal, 0, 0.135, 0.27, Math.PI / 2);
  b.box(0.18, 0.12, 0.02, C.gun, 0, 0.06, 0.12);
  person(b, C.aTroop, 0, -0.02, -0.14, 0.9);
  return b.geo();
}

function mCoastal() {
  const b = new MB();
  b.cyl(0.6, 0.68, 0.3, 8, C.concrete);
  b.cyl(0.5, 0.5, 0.04, 8, C.concreteDark, 0, 0.3, 0, Math.PI / 8);
  b.box(0.2, 0.1, 0.14, C.olive, -0.42, 0.3, 0.1);
  b.box(0.28, 0.16, 0.06, C.dark, 0, 0.08, 0.62);
  return b.geo();
}
function mCoastalHead() {
  const b = new MB();
  b.box(0.44, 0.22, 0.5, C.gun, 0, 0, -0.06);
  b.box(0.36, 0.14, 0.1, C.gun, 0, 0.02, 0.22);
  b.box(0.16, 0.06, 0.16, C.oliveDark, -0.08, 0.22, -0.12);
  b.cylC(0.055, 0.068, 0.76, 8, C.metal, 0, 0.11, 0.56, Math.PI / 2);
  b.cylC(0.078, 0.078, 0.08, 8, C.metalDark, 0, 0.11, 0.92, Math.PI / 2);
  return b.geo();
}

function mFlak() {
  const b = new MB();
  b.cyl(0.52, 0.56, 0.14, 10, C.concrete);
  sandbagRing(b, 0.48, 0.14, 11);
  b.box(0.14, 0.1, 0.1, C.olive, 0.3, 0.14, -0.25);
  b.box(0.14, 0.1, 0.1, C.olive, -0.3, 0.14, -0.25);
  return b.geo();
}
function mFlakHead() {
  const b = new MB();
  b.cyl(0.16, 0.2, 0.12, 8, C.gun);
  b.box(0.3, 0.14, 0.22, C.gun, 0, 0.1, 0);
  for (const x of [-0.07, 0.07]) b.cylC(0.03, 0.036, 0.62, 6, C.metal, x, 0.4, 0.22, Math.PI / 4);
  b.box(0.08, 0.06, 0.08, C.metalDark, 0.18, 0.12, -0.06);
  person(b, C.aTroop, -0.18, 0.0, -0.14, 0.9);
  return b.geo();
}

function mMissile() {
  const b = new MB();
  b.cyl(0.6, 0.64, 0.08, 6, C.concrete);
  b.box(0.3, 0.18, 0.18, C.olive, -0.35, 0.08, -0.3);
  b.cylC(0.07, 0.07, 0.36, 8, C.white, 0.38, 0.17, -0.3, 0, 0, Math.PI / 2);
  b.cylC(0.07, 0.07, 0.36, 8, C.white, 0.38, 0.17, -0.12, 0, 0, Math.PI / 2);
  return b.geo();
}
function mMissileHead() {
  const b = new MB();
  b.cyl(0.18, 0.22, 0.1, 8, C.olive);
  b.boxC(0.42, 0.26, 0.6, C.olive, 0, 0.3, 0.05, -Math.PI / 6);
  for (const x of [-0.1, 0.1]) for (const y of [-0.06, 0.06]) {
    b.add(new THREE.ConeGeometry(0.05, 0.12, 6), C.red, x, 0.45 + y * 0.87, 0.34 - y * 0.5, Math.PI / 3);
  }
  return b.geo();
}

function mRadar() {
  const b = new MB();
  b.box(0.42, 0.28, 0.4, C.wall2, -0.25, 0, 0.2);
  b.box(0.46, 0.04, 0.44, C.concreteDark, -0.25, 0.28, 0.2);
  b.cyl(0.05, 0.12, 0.56, 4, C.metal, 0.05, 0, -0.1, Math.PI / 4);
  b.box(0.1, 0.1, 0.1, C.metalDark, 0.05, 0.5, -0.1);
  return b.geo();
}
function mRadarHead() {
  const b = new MB();
  b.cylC(0.34, 0.06, 0.1, 12, C.white, 0, 0.18, 0, Math.PI / 2 - 0.35);
  b.cylC(0.012, 0.012, 0.3, 4, C.metalDark, 0, 0.2, 0.16, Math.PI / 2 - 0.35);
  b.box(0.06, 0.12, 0.06, C.metalDark, 0, 0, 0);
  return b.geo();
}

function mAirfield() {
  const b = new MB();
  b.cyl(0.84, 0.86, 0.025, 6, C.concreteDark);
  b.box(0.48, 0.035, 1.62, C.asphalt, 0.18, 0, 0);
  for (let i = 0; i < 5; i++) b.box(0.04, 0.04, 0.15, C.white, 0.18, 0, -0.64 + i * 0.32);
  b.add(new THREE.CylinderGeometry(0.25, 0.25, 0.52, 9, 1, false, 0, Math.PI), C.metalLight, -0.4, 0.02, 0.18, 0, Math.PI / 2, Math.PI / 2);
  b.box(0.12, 0.42, 0.12, C.wall2, -0.42, 0, -0.42);
  b.box(0.18, 0.1, 0.18, C.glass, -0.42, 0.42, -0.42);
  b.box(0.2, 0.03, 0.2, C.metalDark, -0.42, 0.52, -0.42);
  return b.geo();
}

// ---------------------------------------------------------------- ships

function mGunboat() {
  const b = new MB();
  b.add(hullGeo(1.0, 0.36, 0.17), C.eHull, 0, -0.07, 0);
  b.box(0.26, 0.02, 0.62, C.eDeck, 0, 0.1, -0.05);
  b.box(0.22, 0.15, 0.26, C.eCabin, 0, 0.1, -0.12);
  b.box(0.18, 0.05, 0.02, C.glass, 0, 0.18, 0.015);
  b.cyl(0.045, 0.06, 0.06, 6, C.metalDark, 0, 0.1, 0.24);
  b.cylC(0.018, 0.02, 0.24, 5, C.metalDark, 0, 0.16, 0.36, Math.PI / 2);
  b.cylC(0.008, 0.008, 0.3, 3, C.metalDark, 0, 0.36, -0.2);
  b.box(0.12, 0.07, 0.01, C.eRed, 0.06, 0.44, -0.2);
  return b.geo();
}

function mLanding() {
  const b = new MB();
  b.box(0.5, 0.17, 0.92, C.eOlive, 0, -0.08, 0);
  b.box(0.46, 0.04, 0.84, C.eDeck, 0, 0.06, 0);
  b.box(0.04, 0.1, 0.84, C.eOlive, -0.23, 0.09, 0);
  b.box(0.04, 0.1, 0.84, C.eOlive, 0.23, 0.09, 0);
  b.boxC(0.5, 0.18, 0.04, C.eOlive, 0, 0.12, 0.47, -0.25);
  b.box(0.2, 0.16, 0.16, C.eCabin, 0, 0.09, -0.36);
  for (const x of [-0.1, 0.1]) for (const z of [-0.1, 0.1, 0.28]) person(b, C.eTroop, x, 0.1, z, 0.75);
  return b.geo();
}

function mDestroyer() {
  const b = new MB();
  b.add(hullGeo(2.0, 0.44, 0.2), C.eHull, 0, -0.08, 0);
  b.box(0.36, 0.02, 1.5, C.eDeck, 0, 0.12, -0.12);
  b.box(0.3, 0.2, 0.46, C.eCabin, 0, 0.12, 0.18);
  b.box(0.22, 0.14, 0.26, C.eCabin, 0, 0.32, 0.22);
  b.box(0.2, 0.04, 0.02, C.glass, 0, 0.4, 0.35);
  b.cyl(0.08, 0.09, 0.3, 8, C.eHull, 0, 0.14, -0.22);
  b.box(0.17, 0.03, 0.17, C.dark, 0, 0.44, -0.22);
  b.cylC(0.012, 0.012, 0.6, 4, C.metalDark, 0, 0.6, 0.12);
  b.box(0.2, 0.02, 0.02, C.metalDark, 0, 0.75, 0.12);
  deckGunAt(b, 0.62, 1.1);
  deckGunAt(b, -0.62, 1.1, Math.PI);
  b.box(0.12, 0.08, 0.01, C.eRed, 0.06, 0.82, 0.12);
  return b.geo();
}
function deckGunAt(b, z, s, ry = 0) {
  b.cyl(0.08 * s, 0.1 * s, 0.05 * s, 7, C.eCabin, 0, 0.12, z);
  b.box(0.16 * s, 0.09 * s, 0.18 * s, C.eCabin, 0, 0.16, z);
  for (const x of [-0.03, 0.03]) {
    b.cylC(0.016 * s, 0.02 * s, 0.26 * s, 5, C.metalDark, x * s, 0.21, z + Math.cos(ry) * 0.2 * s, Math.PI / 2);
  }
}

function mBattleship() {
  const b = new MB();
  b.add(hullGeo(3.0, 0.68, 0.26), C.eHull, 0, -0.1, 0);
  b.box(0.58, 0.02, 2.3, C.eDeck, 0, 0.16, -0.15);
  b.box(0.46, 0.22, 0.9, C.eCabin, 0, 0.16, -0.05);
  b.box(0.32, 0.26, 0.36, C.eCabin, 0, 0.38, 0.12);
  b.box(0.22, 0.2, 0.2, C.eCabin, 0, 0.64, 0.14);
  b.box(0.24, 0.04, 0.02, C.glass, 0, 0.74, 0.25);
  b.cyl(0.1, 0.11, 0.42, 8, C.eHull, 0, 0.38, -0.25);
  b.cyl(0.09, 0.1, 0.36, 8, C.eHull, 0, 0.38, -0.52);
  b.cylC(0.015, 0.015, 0.7, 4, C.metalDark, 0, 1.05, 0.1);
  b.box(0.3, 0.025, 0.025, C.metalDark, 0, 1.2, 0.1);
  b.box(0.16, 0.1, 0.01, C.eRed, 0.08, 1.3, 0.1);
  for (const [z, ry] of [[0.9, 0], [0.55, 0], [-0.95, Math.PI]]) {
    b.cyl(0.15, 0.17, 0.06, 8, C.eCabin, 0, 0.16, z);
    b.box(0.28, 0.13, 0.3, C.eCabin, 0, 0.21, z);
    for (const x of [-0.07, 0, 0.07]) b.cylC(0.022, 0.028, 0.42, 5, C.metalDark, x, 0.28, z + Math.cos(ry) * 0.32, Math.PI / 2);
  }
  return b.geo();
}

// ---------------------------------------------------------------- aircraft

function prop(b, z, r = 0.12, x = 0, y = 0) {
  b.cylC(r, r, 0.012, 8, C.dark, x, y, z, Math.PI / 2);
}

function mFighter(main, second, mark) {
  const b = new MB();
  b.cylC(0.075, 0.05, 0.8, 7, main, 0, 0, 0, Math.PI / 2);
  b.cylC(0.06, 0.075, 0.12, 7, second, 0, 0, 0.44, Math.PI / 2);
  b.box(1.04, 0.026, 0.2, main, 0, -0.04, 0.05);
  b.box(0.38, 0.02, 0.1, main, 0, 0.0, -0.36);
  b.box(0.02, 0.15, 0.13, main, 0, 0.02, -0.36);
  b.box(0.1, 0.06, 0.18, C.glass, 0, 0.06, 0.04);
  for (const x of [-0.36, 0.36]) b.cylC(0.055, 0.055, 0.03, 8, mark, x, -0.035, 0.05);
  prop(b, 0.5, 0.13);
  return b.geo();
}

function mBomber() {
  const b = new MB();
  b.cylC(0.14, 0.09, 1.55, 8, C.ePlane2, 0, 0, 0, Math.PI / 2);
  b.sphere(0.13, C.glass, 0, 0.0, 0.76, 7, 5, 1, 1, 1.2);
  b.box(2.3, 0.045, 0.34, C.ePlane2, 0, 0.02, 0.15);
  b.box(0.8, 0.03, 0.18, C.ePlane2, 0, 0.05, -0.68);
  b.box(0.03, 0.32, 0.24, C.ePlane2, 0, 0.05, -0.68);
  for (const x of [-0.85, -0.45, 0.45, 0.85]) {
    b.cylC(0.065, 0.06, 0.28, 7, C.eHull, x, 0.0, 0.3, Math.PI / 2);
    prop(b, 0.45, 0.13, x, 0);
  }
  for (const x of [-0.7, 0.7]) b.cylC(0.08, 0.08, 0.05, 8, C.eRed, x, -0.0, 0.1);
  return b.geo();
}

function mJet() {
  const b = new MB();
  b.cylC(0.05, 0.1, 1.1, 7, C.ePlane2, 0, 0, 0, Math.PI / 2);
  b.add(new THREE.ConeGeometry(0.05, 0.22, 7), C.ePlane2, 0, 0, 0.66, Math.PI / 2);
  // delta wing, both faces
  const top = [0, 0, 0.28, 0.62, 0, -0.42, -0.62, 0, -0.42];
  const bot = [0, 0, 0.28, -0.62, 0, -0.42, 0.62, 0, -0.42];
  b.raw(top, C.ePlane, 0, 0.0, 0);
  b.raw(bot, C.ePlane, 0, -0.01, 0);
  b.box(0.02, 0.24, 0.24, C.ePlane, 0, 0.04, -0.42);
  b.box(0.08, 0.06, 0.2, C.glass, 0, 0.07, 0.22);
  for (const x of [-0.32, 0.32]) b.cylC(0.05, 0.05, 0.02, 8, C.eRed, x, 0.005, -0.2);
  return b.geo();
}

function mTrooper(col) {
  const b = new MB();
  person(b, col, 0, 0, 0, 1.25);
  b.box(0.02, 0.02, 0.2, C.dark, 0.06, 0.12, 0.06);
  return b.geo();
}

// ---------------------------------------------------------------- props and projectiles

// Tall layered pine: dark tiers, slightly irregular, like a dense coastal conifer forest
function mTree() {
  const b = new MB();
  b.cyl(0.03, 0.05, 0.22, 5, C.trunk);
  const tiers = [[0.3, 0.42, 0.14, 0x1d4a25], [0.24, 0.38, 0.36, 0x22552a], [0.17, 0.32, 0.57, 0x285f2f], [0.1, 0.24, 0.76, 0x2f6a35]];
  for (const [r, h, y, col] of tiers) b.cone(r, h, 7, col, 0, y, 0, y * 3);
  return b.geo();
}
// Round broadleaf tree for meadows
function mBroadleaf() {
  const b = new MB();
  b.cyl(0.035, 0.05, 0.3, 5, C.trunk);
  b.add(new THREE.IcosahedronGeometry(0.26, 0), 0x3c7d2e, 0, 0.48, 0, 0, 0, 0, 1, 0.9, 1);
  b.add(new THREE.IcosahedronGeometry(0.19, 0), 0x5fae46, 0.12, 0.62, 0.05, 0.4, 0.3, 0);
  b.add(new THREE.IcosahedronGeometry(0.17, 0), 0x468f36, -0.12, 0.56, -0.06, 0.2, 0.9, 0);
  return b.geo();
}
function mRock() {
  const b = new MB();
  b.add(new THREE.DodecahedronGeometry(0.17, 0), 0x9a968e, 0, 0.06, 0, 0, 0, 0, 1, 0.65, 1);
  b.add(new THREE.DodecahedronGeometry(0.1, 0), 0x7d7973, 0.18, 0.03, 0.1, 0, 0.5, 0, 1, 0.7, 1);
  return b.geo();
}
// Jagged faceted crag: several sharp peaks with displaced, flat-shaded faces (light granite, pale tips)
function mPeak() {
  const b = new MB();
  const peaks = [[0, 0, 1.0, 1.9], [0.38, 0.25, 0.62, 1.3], [-0.35, 0.2, 0.55, 1.15], [0.1, -0.42, 0.6, 1.25], [-0.2, -0.3, 0.45, 0.9]];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const [x, z, r, h] of peaks) {
    const g = new THREE.ConeGeometry(r, h, 6, 3);
    const pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const y = pos.getY(k);
      if (y < h / 2 - 1e-3) { pos.setX(k, pos.getX(k) * (0.8 + rnd() * 0.45)); pos.setZ(k, pos.getZ(k) * (0.8 + rnd() * 0.45)); pos.setY(k, y + (rnd() - 0.5) * 0.12); }
    }
    b.add(g, 0x77726c, x, h / 2, z, 0, rnd() * 3, (rnd() - 0.5) * 0.15);
    const tip = new THREE.ConeGeometry(r * 0.3, h * 0.28, 6);
    b.add(tip, 0xb9b6b0, x, h * 0.86, z, 0, rnd() * 3, 0);
  }
  b.cyl(0.95, 1.0, 0.12, 6, 0x5f5a54);
  return b.geo();
}
function mFlower() {
  const b = new MB();
  b.add(new THREE.IcosahedronGeometry(0.035, 0), 0xffffff, 0, 0.04, 0);
  b.add(new THREE.IcosahedronGeometry(0.03, 0), 0xffffff, 0.06, 0.03, 0.03);
  b.add(new THREE.IcosahedronGeometry(0.028, 0), 0xffffff, -0.04, 0.03, 0.05);
  return b.geo();
}
function mTuft() {
  const b = new MB();
  for (let k = 0; k < 4; k++) b.add(new THREE.ConeGeometry(0.018, 0.12, 3), 0x6fa83f, Math.cos(k * 1.6) * 0.03, 0.05, Math.sin(k * 1.6) * 0.03, Math.cos(k) * 0.25, 0, Math.sin(k) * 0.25);
  return b.geo();
}
// Red-and-white lighthouse on a rock islet
function mLighthouse() {
  const b = new MB();
  b.add(new THREE.DodecahedronGeometry(0.75, 0), 0x6f6a63, 0, -0.1, 0, 0, 0, 0, 1.3, 0.55, 1.1);
  b.cyl(0.6, 0.65, 0.12, 8, 0x9a958c, 0, 0.18, 0);
  for (let k = 0; k < 5; k++) b.cyl(0.24 - k * 0.025, 0.26 - k * 0.025, 0.3, 10, k % 2 ? C.white : C.red, 0, 0.3 + k * 0.3, 0);
  b.cyl(0.2, 0.2, 0.06, 10, C.dark, 0, 1.8, 0);
  b.cyl(0.15, 0.15, 0.22, 10, 0xfff2b0, 0, 1.86, 0);
  b.cone(0.2, 0.22, 10, C.red, 0, 2.08, 0);
  b.box(0.3, 0.22, 0.25, C.white, 0.42, 0.28, 0.1);
  b.gable(0.36, 0.3, 0.12, C.red, 0.42, 0.5, 0.1);
  return b.geo();
}
function mRubble() {
  const b = new MB();
  b.cyl(0.7, 0.72, 0.02, 6, 0x3a3634);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, r = 0.12 + (i % 3) * 0.17;
    b.boxC(0.14 + (i % 2) * 0.08, 0.07, 0.12, i % 3 ? C.stoneDark : C.woodDark, Math.cos(a) * r, 0.05, Math.sin(a) * r, 0.3 * i, a, 0.2 * i);
  }
  return b.geo();
}
function mMarker() {
  const b = new MB();
  b.add(new THREE.ConeGeometry(0.12, 0.26, 4), C.red, 0, 0.13, 0, Math.PI, 0, 0);
  b.sphere(0.12, C.red, 0, 0.3, 0, 8, 6);
  b.sphere(0.05, C.white, 0, 0.3, 0.1, 6, 4);
  return b.geo();
}
function mArrow() {
  const b = new MB();
  b.box(0.5, 0.06, 1.4, C.red, 0, 0, -0.5);
  b.raw([0, 0.06, 1.0, 0.7, 0.06, 0.2, -0.7, 0.06, 0.2], C.red);
  return b.geo();
}
function mBomb() {
  const b = new MB();
  b.cylC(0.045, 0.045, 0.2, 6, C.dark, 0, 0, 0, Math.PI / 2);
  b.add(new THREE.ConeGeometry(0.045, 0.08, 6), C.dark, 0, 0, 0.14, Math.PI / 2);
  b.box(0.12, 0.012, 0.04, C.dark, 0, 0, -0.1);
  return b.geo();
}
function mMissileProj(col) {
  const b = new MB();
  b.cylC(0.035, 0.035, 0.38, 6, C.white, 0, 0, 0, Math.PI / 2);
  b.add(new THREE.ConeGeometry(0.035, 0.1, 6), col, 0, 0, 0.24, Math.PI / 2);
  b.box(0.13, 0.01, 0.06, col, 0, 0, -0.16);
  b.box(0.01, 0.13, 0.06, col, 0, 0, -0.16);
  return b.geo();
}

export function buildModels() {
  return {
    hq: mHQ(), house: mHouse(1), house2: mHouse(2), farm: mFarm(), dock: mDock(), lumber: mLumber(), quarry: mQuarry(),
    mine: mMine(), market: mMarket(), college: mCollege(), barracks: mBarracks(),
    mg: mMG(), mg_head: mMGHead(), coastal: mCoastal(), coastal_head: mCoastalHead(),
    flak: mFlak(), flak_head: mFlakHead(), missile: mMissile(), missile_head: mMissileHead(),
    radar: mRadar(), radar_head: mRadarHead(), airfield: mAirfield(),
    gunboat: mGunboat(), landing: mLanding(), destroyer: mDestroyer(), battleship: mBattleship(),
    fighter: mFighter(C.ePlane, C.ePlane2, C.eRed), bomber: mBomber(), jet: mJet(),
    infantry: mTrooper(C.eTroop), soldier: mTrooper(C.aTroop), ally_fighter: mFighter(C.aPlane, C.aPlane2, C.white),
    tree: mTree(), broadleaf: mBroadleaf(), rock: mRock(), peak: mPeak(), flower: mFlower(), tuft: mTuft(), lighthouse: mLighthouse(), rubble: mRubble(), marker: mMarker(), arrow: mArrow(),
    bomb: mBomb(), missileP: mMissileProj(C.blue), rocketP: mMissileProj(C.red),
  };
}
