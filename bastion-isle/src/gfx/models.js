import * as THREE from 'three';
import { EMI, uberMaterial, uberUnitMaterial, ghostMaterial, setGhostState } from './uber.js';
import { BUILDINGS } from '../defs.js';

// Procedural model library for Bastion Isle 2 (SPEC.md 5.6). Every model is ONE indexed BufferGeometry in the uber
// format (position, normal, color, aPBR; see uber.js) so each key draws as one InstancedMesh with the shared program.
//
// Conventions: models face +z (yaw 0 = facing +z, matching atan2(dx, dz) in the sim and Pool.put); y = 0 is the top
// of the tile (structures) or the sea surface (ships, boats); aircraft and projectiles are centred on their pivot.
// Scale: 1u = 12 m, storey 0.25u, hex circumradius 1 (corners on +-z, flat sides at x = +-0.866). Military content
// is compressed for readability per the UX scale table; civic content is real scale.

export { uberMaterial, uberUnitMaterial, ghostMaterial, setGhostState, EMI };

// ------------------------------------------------------------------ palette (sRGB hex, UX review concrete spec 8)

export const PAL = {
  // walls (8) and roofs
  wall1: 0xece6da, wall2: 0xe1d2b4, wall3: 0xd7b38b, wall4: 0xc98e6a, wall5: 0xb8c1ae, wall6: 0xa8b5c1, brick: 0x9c4e3e, wall8: 0xb4b1a9,
  terracotta: 0xa5553a, slate: 0x4e5661, gravel: 0x8e8b84, sheet: 0x9aa1a6,
  glass: 0x26394a, glassCar: 0x1d2833,
  // ground
  grass: 0x6e8c4c, meadow: 0x8d9659, forest: 0x4e6a3a, sand: 0xd6c69c, dirt: 0x7b6347, paving: 0x9e9a92,
  asphalt: 0x3a3d41, marking: 0xe6e2d6, markingY: 0xd6ae3a, sidewalk: 0xa8a59d, curb: 0xc2beb4, water: 0x1e6378,
  // military, friendly
  olive: 0x5a6240, oliveDark: 0x454b31, khaki: 0x9c916a, sandbag: 0x6f6851, sandbag2: 0x7b7259, concrete: 0x9a978e, concreteDark: 0x7d7a73,
  concreteLight: 0xb4b1a9, naval: 0x7a838a, friendly: 0x3cc8d0,
  // hostile
  eHull: 0x3d4248, eDeck: 0x5c6066, eRed: 0xb3261e, eDark: 0x2c2f33,
  // industry
  shed: 0xa7acae, redOxide: 0x8c3a2c, bandRed: 0xb8382c, bandWhite: 0xedeae2,
  // materials
  steel: 0x8e969c, gunmetal: 0x3b3f44, darkSteel: 0x2a2d31, rubber: 0x1c1d1f, wood: 0x8a6a4a, canvas: 0x8f8a6e,
  white: 0xeeece6, black: 0x202224, fireRed: 0xc0302a, policeBlue: 0x24407a, hivis: 0xc9d84a, cream: 0xf0e8d4,
  skin1: 0xc89a78, skin2: 0xa8785a, skin3: 0xe2b89a,
  // lights (albedo of the bulb; the emissive code makes them glow)
  lHead: 0xfff3d6, lTail: 0xff3b2e, lLamp: 0xffd7a0, lNavR: 0xff2a1e, lNavG: 0x2bff6a, lWhite: 0xffffff,
  lBlue: 0x2f6bff, lAmber: 0xffa21e, lTracer: 0xffd27a, lExhaust: 0xffa040,
};

// ------------------------------------------------------------------ materials

const _col = new THREE.Color();
// Material spec for the builder: linear albedo + aPBR bytes. paint: 0..1 share of instanceColor tint.
export function mt(hex, rough = 0.8, metal = 0, emi = 0, paint = 0) {
  _col.setHex(hex);
  return {
    r: _col.r, g: _col.g, b: _col.b,
    a: [Math.round(rough * 255), Math.round(metal * 255), emi & 255, Math.round(paint * 255)],
  };
}
const withE = (m, emi) => ({ r: m.r, g: m.g, b: m.b, a: [m.a[0], m.a[1], emi & 255, m.a[3]] });
const withP = (m, paint) => ({ r: m.r, g: m.g, b: m.b, a: [m.a[0], m.a[1], m.a[2], Math.round(paint * 255)] });

export const M = {
  wall1: mt(PAL.wall1, 0.85), wall2: mt(PAL.wall2, 0.85), wall3: mt(PAL.wall3, 0.85), wall4: mt(PAL.wall4, 0.85),
  wall5: mt(PAL.wall5, 0.85), wall6: mt(PAL.wall6, 0.85), brick: mt(PAL.brick, 0.9), wall8: mt(PAL.wall8, 0.85),
  terracotta: mt(PAL.terracotta, 0.8), slate: mt(PAL.slate, 0.7), gravel: mt(PAL.gravel, 0.95), sheet: mt(PAL.sheet, 0.5, 0.45),
  glass: mt(PAL.glass, 0.08, 0.1), glassCar: mt(PAL.glassCar, 0.06, 0.1),
  grass: mt(PAL.grass, 0.95), meadow: mt(PAL.meadow, 0.95), hedge: mt(PAL.forest, 0.95), sand: mt(PAL.sand, 0.95),
  dirt: mt(PAL.dirt, 0.95), paving: mt(PAL.paving, 0.9), asphalt: mt(PAL.asphalt, 0.9), marking: mt(PAL.marking, 0.8),
  markingY: mt(PAL.markingY, 0.8), sidewalk: mt(PAL.sidewalk, 0.9), curb: mt(PAL.curb, 0.85), water: mt(PAL.water, 0.06, 0.1),
  olive: mt(PAL.olive, 0.7, 0.15), oliveDark: mt(PAL.oliveDark, 0.7, 0.15), khaki: mt(PAL.khaki, 0.9), sandbag: mt(PAL.sandbag, 1.0), sandbag2: mt(PAL.sandbag2, 1.0), dish: mt(0xc4c2bb, 0.7, 0.1),
  concrete: mt(PAL.concrete, 0.9), concreteDark: mt(PAL.concreteDark, 0.92), concreteLight: mt(PAL.concreteLight, 0.88),
  naval: mt(PAL.naval, 0.55, 0.25), friendly: mt(PAL.friendly, 0.5, 0.1),
  eHull: mt(PAL.eHull, 0.55, 0.3), eDeck: mt(PAL.eDeck, 0.75, 0.2), eRed: mt(PAL.eRed, 0.55, 0.1, EMI.night(0.6)), eDark: mt(PAL.eDark, 0.6, 0.3),
  shed: mt(PAL.shed, 0.55, 0.4), redOxide: mt(PAL.redOxide, 0.7, 0.2), bandRed: mt(PAL.bandRed, 0.75), bandWhite: mt(PAL.bandWhite, 0.75),
  steel: mt(PAL.steel, 0.4, 0.75), gunmetal: mt(PAL.gunmetal, 0.45, 0.6), darkSteel: mt(PAL.darkSteel, 0.5, 0.55), rubber: mt(PAL.rubber, 0.9),
  wood: mt(PAL.wood, 0.85), canvas: mt(PAL.canvas, 0.95), white: mt(PAL.white, 0.6), black: mt(PAL.black, 0.7),
  fireRed: mt(PAL.fireRed, 0.4, 0.1), policeBlue: mt(PAL.policeBlue, 0.45, 0.1), hivis: mt(PAL.hivis, 0.8), cream: mt(PAL.cream, 0.6),
  skin1: mt(PAL.skin1, 0.8), skin2: mt(PAL.skin2, 0.8), skin3: mt(PAL.skin3, 0.8),
  // paintable bases (near-white so instanceColor sets the final colour)
  paint: mt(0xe6e6e6, 0.35, 0.15, 0, 1), paintMatte: mt(0xe0e0e0, 0.6, 0.05, 0, 1),
  // lights
  headLight: mt(PAL.lHead, 0.3, 0, EMI.night(6)), tailLight: mt(PAL.lTail, 0.4, 0, EMI.night(3)),
  lamp: mt(PAL.lLamp, 0.4, 0, EMI.night(7)), navR: mt(PAL.lNavR, 0.4, 0, EMI.nav(7)), navG: mt(PAL.lNavG, 0.4, 0, EMI.nav(7)),
  navW: mt(PAL.lWhite, 0.4, 0, EMI.nav(5)), strobe: mt(PAL.lWhite, 0.4, 0, EMI.strobe(0)), beacon: mt(PAL.lNavR, 0.4, 0, EMI.beacon(0)),
  flashR: mt(PAL.lNavR, 0.4, 0, EMI.flash(0)), flashB: mt(PAL.lBlue, 0.4, 0, EMI.flash(8)), flashA: mt(PAL.lAmber, 0.4, 0, EMI.flash(4)),
  tracer: mt(0xfff4e0, 0.5, 0, EMI.always(8), 1), exhaust: mt(PAL.lExhaust, 0.5, 0, EMI.always(9)), glow: mt(PAL.lExhaust, 0.5, 0, EMI.always(1.6)),
  screen: mt(0x6fe0c8, 0.3, 0, EMI.nav(3)),
};
// a window pane: glass by day; WINDOW emissive with a per-window hash seed at night (lit = false keeps it dark)
export const winMat = (seed, lit = true) => withE(M.glass, lit ? EMI.window(seed) : 0);

// ------------------------------------------------------------------ geometry helpers (local, flat-shaded)

function arraysGeo(pos, nor, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

// polygon builder with flat normals; faces given as vertex lists in any winding, oriented by a hint direction
class Poly {
  constructor() { this.p = []; this.n = []; this.i = []; }
  face(pts, hint) {
    // newell normal
    let nx = 0, ny = 0, nz = 0;
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k], b = pts[(k + 1) % pts.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-12) return this;
    nx /= l; ny /= l; nz /= l;
    if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { pts = pts.slice().reverse(); nx = -nx; ny = -ny; nz = -nz; }
    const base = this.p.length / 3;
    for (const q of pts) { this.p.push(q[0], q[1], q[2]); this.n.push(nx, ny, nz); }
    for (let k = 1; k < pts.length - 1; k++) this.i.push(base, base + k, base + k + 1);
    return this;
  }
  geo() { return arraysGeo(this.p, this.n, this.i); }
}

// Box with chamfered edges (catches highlights on every edge). y from 0 to h, centred in x/z.
const chamferCache = new Map();
function chamferBoxGeo(w, h, d, b) {
  const key = `${w},${h},${d},${b}`;
  if (chamferCache.has(key)) return chamferCache.get(key);
  b = Math.min(b, w * 0.45, h * 0.45, d * 0.45);
  const X = w / 2, Y = h / 2, Z = d / 2;
  const P = new Poly();
  const cv = (sx, sy, sz, f) => (f === 0 ? [sx * X, sy * (Y - b), sz * (Z - b)] : f === 1 ? [sx * (X - b), sy * Y, sz * (Z - b)] : [sx * (X - b), sy * (Y - b), sz * Z]);
  const S = [-1, 1];
  // 6 faces
  for (const s of S) {
    P.face([cv(s, -1, -1, 0), cv(s, 1, -1, 0), cv(s, 1, 1, 0), cv(s, -1, 1, 0)], [s, 0, 0]);
    P.face([cv(-1, s, -1, 1), cv(1, s, -1, 1), cv(1, s, 1, 1), cv(-1, s, 1, 1)], [0, s, 0]);
    P.face([cv(-1, -1, s, 2), cv(1, -1, s, 2), cv(1, 1, s, 2), cv(-1, 1, s, 2)], [0, 0, s]);
  }
  // 12 edges
  for (const a of S) for (const c of S) {
    P.face([cv(a, c, -1, 0), cv(a, c, 1, 0), cv(a, c, 1, 1), cv(a, c, -1, 1)], [a, c, 0]); // along z
    P.face([cv(-1, a, c, 1), cv(1, a, c, 1), cv(1, a, c, 2), cv(-1, a, c, 2)], [0, a, c]); // along x
    P.face([cv(a, -1, c, 0), cv(a, 1, c, 0), cv(a, 1, c, 2), cv(a, -1, c, 2)], [a, 0, c]); // along y
  }
  // 8 corners
  for (const sx of S) for (const sy of S) for (const sz of S) P.face([cv(sx, sy, sz, 0), cv(sx, sy, sz, 1), cv(sx, sy, sz, 2)], [sx, sy, sz]);
  const g = P.geo();
  g.translate(0, Y, 0);
  chamferCache.set(key, g);
  return g;
}

// Frustum box: bottom w0 x d0 at y=0, top w1 x d1 at y=h, top shifted by (xs, zs). Flat faces.
function tboxGeo(w0, d0, w1, d1, h, xs = 0, zs = 0) {
  const a = w0 / 2, c = d0 / 2, e = w1 / 2, f = d1 / 2;
  const B = [[-a, 0, -c], [a, 0, -c], [a, 0, c], [-a, 0, c]];
  const T = [[xs - e, h, zs - f], [xs + e, h, zs - f], [xs + e, h, zs + f], [xs - e, h, zs + f]];
  const P = new Poly();
  P.face(B, [0, -1, 0]).face(T, [0, 1, 0]);
  for (let k = 0; k < 4; k++) {
    const k2 = (k + 1) % 4;
    const mx = (B[k][0] + B[k2][0] + T[k][0] + T[k2][0]) / 4 - xs / 2, mz = (B[k][2] + B[k2][2] + T[k][2] + T[k2][2]) / 4 - zs / 2;
    P.face([B[k], B[k2], T[k2], T[k]], [mx, 0, mz]);
  }
  return P.geo();
}

// Extruded polygon in the xz plane (pts = [[x,z],...]), from y=0 to y=h, flat normals.
function prismGeo(pts, h) {
  const P = new Poly();
  const v2 = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  if (THREE.ShapeUtils.isClockWise(v2)) v2.reverse();
  const tris = THREE.ShapeUtils.triangulateShape(v2, []);
  const top = v2.map((p) => [p.x, h, p.y]), bot = v2.map((p) => [p.x, 0, p.y]);
  for (const t of tris) {
    P.face([top[t[0]], top[t[1]], top[t[2]]], [0, 1, 0]);
    P.face([bot[t[0]], bot[t[1]], bot[t[2]]], [0, -1, 0]);
  }
  // centroid for outward hints
  let cx = 0, cz = 0;
  for (const p of v2) { cx += p.x; cz += p.y; }
  cx /= v2.length; cz /= v2.length;
  for (let k = 0; k < v2.length; k++) {
    const a = v2[k], b = v2[(k + 1) % v2.length];
    // outward = perpendicular of the edge for a CCW polygon (in x,z with y up the CCW-from-above test flips)
    const ex = b.x - a.x, ez = b.y - a.y;
    let hx = ez, hz = -ex;
    const mx = (a.x + b.x) / 2 - cx, mz = (a.y + b.y) / 2 - cz;
    if (hx * mx + hz * mz < 0) { hx = -hx; hz = -hz; }
    P.face([[a.x, 0, a.y], [b.x, 0, b.y], [b.x, h, b.y], [a.x, h, a.y]], [hx, 0, hz]);
  }
  return P.geo();
}

// Gable roof, ridge along x: footprint len (x) by wid (z), height h. Closed (gable ends + soffit).
function gableGeo(len, wid, h, over = 0) {
  const l = len / 2, w = wid / 2;
  const P = new Poly();
  const A = [-l, 0, -w], B = [l, 0, -w], Cc = [l, 0, w], D = [-l, 0, w], E = [-l, h, 0], F = [l, h, 0];
  P.face([A, B, F, E], [0, 1, -1]).face([D, E, F, Cc], [0, 1, 1]).face([A, E, D], [-1, 0, 0]).face([B, Cc, F], [1, 0, 0]).face([A, D, Cc, B], [0, -1, 0]);
  return P.geo();
}

// Hip roof over len x wid, ridge along x of length len - wid (or a pyramid if ridge <= 0)
function hipGeo(len, wid, h) {
  const l = len / 2, w = wid / 2, r = Math.max(0, l - w);
  const P = new Poly();
  const A = [-l, 0, -w], B = [l, 0, -w], Cc = [l, 0, w], D = [-l, 0, w], E = [-r, h, 0], F = [r, h, 0];
  if (r > 1e-4) {
    P.face([A, B, F, E], [0, 1, -1]).face([D, E, F, Cc], [0, 1, 1]).face([A, E, D], [-1, 1, 0]).face([B, Cc, F], [1, 1, 0]);
  } else {
    P.face([A, B, E], [0, 1, -1]).face([B, Cc, E], [1, 1, 0]).face([Cc, D, E], [0, 1, 1]).face([D, A, E], [-1, 1, 0]);
  }
  P.face([A, D, Cc, B], [0, -1, 0]);
  return P.geo();
}

// ------------------------------------------------------------------ model builder

const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _n3 = new THREE.Matrix3();
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();

function localMatrix(out, x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  return out.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz));
}

// opts accepted by most primitives: { ry, rx, rz, sx, sy, sz }
export class MB {
  constructor() {
    this.P = []; this.N = []; this.C = []; this.A = []; this.I = [];
    this.M = new THREE.Matrix4();
    this.stack = [];
  }

  // group transform: everything added until pop() is placed relative to (x,y,z, rotations, scale)
  push(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) {
    this.stack.push(this.M.clone());
    this.M.multiply(localMatrix(_m2, x, y, z, ry, rx, rz, s, s, s));
    return this;
  }
  pushM(m4) { this.stack.push(this.M.clone()); this.M.multiply(m4); return this; }
  pop() { this.M = this.stack.pop(); return this; }

  // append a BufferGeometry with its own normals, transformed by local then the group matrix
  geo(g, m, local) {
    const full = local ? _m.multiplyMatrices(this.M, local) : _m.copy(this.M);
    _n3.getNormalMatrix(full);
    const flip = full.determinant() < 0;
    const pos = g.attributes.position, nor = g.attributes.normal;
    const base = this.P.length / 3;
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(full);
      this.P.push(_v.x, _v.y, _v.z);
      if (nor) { _v.fromBufferAttribute(nor, i).applyMatrix3(_n3).normalize(); this.N.push(_v.x, _v.y, _v.z); } else this.N.push(0, 1, 0);
      this.C.push(m.r, m.g, m.b);
      this.A.push(m.a[0], m.a[1], m.a[2], m.a[3]);
    }
    if (g.index) {
      const ix = g.index.array;
      for (let k = 0; k < ix.length; k += 3) {
        if (flip) this.I.push(base + ix[k], base + ix[k + 2], base + ix[k + 1]);
        else this.I.push(base + ix[k], base + ix[k + 1], base + ix[k + 2]);
      }
    } else {
      for (let k = 0; k < pos.count; k += 3) {
        if (flip) this.I.push(base + k, base + k + 2, base + k + 1);
        else this.I.push(base + k, base + k + 1, base + k + 2);
      }
    }
    return this;
  }

  _place(g, m, x, y, z, o) {
    return this.geo(g, m, localMatrix(_m2, x, y, z, o.ry || 0, o.rx || 0, o.rz || 0, o.sx || 1, o.sy || 1, o.sz || 1));
  }

  // y is the BOTTOM of box / cyl / cone / prism / tbox / roofs; the centre for boxC / ball / rod endpoints
  box(w, h, d, m, x = 0, y = 0, z = 0, o = {}) {
    const g = o.bevel ? chamferBoxGeo(w, h, d, o.bevel) : unitBox(w, h, d);
    return this._place(g, m, x, y, z, o);
  }
  cbox(w, h, d, m, x = 0, y = 0, z = 0, o = {}) { // centred box (rotation about its centre)
    const g = o.bevel ? chamferBoxGeo(w, h, d, o.bevel) : unitBox(w, h, d);
    const local = localMatrix(_m2, x, y, z, o.ry || 0, o.rx || 0, o.rz || 0, 1, 1, 1);
    local.multiply(_m.makeTranslation(0, -h / 2, 0));
    return this.geo(g, m, local.clone());
  }
  tbox(w0, d0, w1, d1, h, m, x = 0, y = 0, z = 0, o = {}) {
    return this._place(tboxGeo(w0, d0, w1, d1, h, o.xs || 0, o.zs || 0), m, x, y, z, o);
  }
  cyl(rt, rb, h, seg, m, x = 0, y = 0, z = 0, o = {}) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!o.open, o.t0 || 0, o.tl || Math.PI * 2);
    g.translate(0, h / 2, 0);
    if (o.flat) { const n = g.toNonIndexed(); n.computeVertexNormals(); return this._place(n, m, x, y, z, o); }
    return this._place(g, m, x, y, z, o);
  }
  cone(r, h, seg, m, x = 0, y = 0, z = 0, o = {}) { return this.cyl(0, r, h, seg, m, x, y, z, o); }
  // cylinder between two points (barrels, pipes, struts, masts)
  rod(x0, y0, z0, x1, y1, z1, r, seg, m, r1 = r, o = {}) {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz);
    const g = new THREE.CylinderGeometry(r1, r, len, seg, 1, !!o.open);
    g.translate(0, len / 2, 0);
    _v.set(dx, dy, dz).normalize();
    _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _v);
    const local = new THREE.Matrix4().compose(new THREE.Vector3(x0, y0, z0), _q, new THREE.Vector3(1, 1, 1));
    if (o.roll) local.multiply(new THREE.Matrix4().makeRotationY(o.roll));
    return this.geo(g, m, local);
  }
  ball(r, m, x = 0, y = 0, z = 0, ws = 10, hs = 6, o = {}) {
    const g = new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, o.p0 || 0, o.pl || Math.PI);
    return this._place(g, m, x, y, z, o);
  }
  dome(r, m, x = 0, y = 0, z = 0, ws = 12, hs = 4, o = {}) {
    const g = new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, Math.PI / 2);
    return this._place(g, m, x, y, z, o);
  }
  // lathe: profile [[r, y], ...] revolved around +y
  lathe(profile, seg, m, x = 0, y = 0, z = 0, o = {}) {
    const g = new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(Math.max(p[0], 1e-5), p[1])), seg, o.t0 || 0, o.tl || Math.PI * 2);
    return this._place(g, m, x, y, z, o);
  }
  prism(pts, h, m, x = 0, y = 0, z = 0, o = {}) { return this._place(prismGeo(pts, h), m, x, y, z, o); }
  gable(len, wid, h, m, x = 0, y = 0, z = 0, o = {}) { return this._place(gableGeo(len, wid, h), m, x, y, z, o); }
  hip(len, wid, h, m, x = 0, y = 0, z = 0, o = {}) { return this._place(hipGeo(len, wid, h), m, x, y, z, o); }
  // flat hexagonal pad, corners on +-z like the world hexes
  hexPad(r, h, m, y = 0, o = {}) { return this.cyl(r, r, h, 6, m, o.x || 0, y, o.z || 0, { flat: true }); }
  // single quad facing +z in local space (windows, signs, lights), centred at (x,y,z) then rotated by ry
  quad(w, h, m, x, y, z, ry = 0, o = {}) {
    const g = unitQuad(w, h);
    return this._place(g, m, x, y, z, { ry, rx: o.rx || 0, rz: o.rz || 0 });
  }
  // both faces of an open surface (dishes, reflectors, sails)
  geo2(g, m, local) {
    this.geo(g, m, local);
    const f = g.clone();
    const n = f.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
    if (f.index) { const a = f.index.array; for (let k = 0; k < a.length; k += 3) { const t = a[k + 1]; a[k + 1] = a[k + 2]; a[k + 2] = t; } }
    return this.geo(f, m, local);
  }
  // raw polygon face (flat), points in local coords
  face(pts, m, hint) { const P = new Poly(); P.face(pts, hint); return this.geo(P.geo(), m); }
  // merge another builder's output (already in local coords) under the current transform
  merge(other) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(other.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(other.N, 3));
    g.setIndex(other.I);
    const full = _m.copy(this.M);
    _n3.getNormalMatrix(full);
    const base = this.P.length / 3;
    const pos = g.attributes.position, nor = g.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(full); this.P.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(nor, i).applyMatrix3(_n3).normalize(); this.N.push(_v.x, _v.y, _v.z);
    }
    this.C.push(...other.C); this.A.push(...other.A);
    for (const k of other.I) this.I.push(base + k);
    return this;
  }

  tris() { return this.I.length / 3; }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('aPBR', new THREE.BufferAttribute(new Uint8Array(this.A), 4, true));
    const n = this.P.length / 3;
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

const boxCache = new Map();
function unitBox(w, h, d) {
  const key = `${w},${h},${d}`;
  let g = boxCache.get(key);
  if (!g) { g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); boxCache.set(key, g); }
  return g;
}
const quadCache = new Map();
function unitQuad(w, h) {
  const key = `${w},${h}`;
  let g = quadCache.get(key);
  if (!g) { g = new THREE.PlaneGeometry(w, h); quadCache.set(key, g); }
  return g;
}

// deterministic cosmetic random for model detail (window lights, debris)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// raw local mesh with given normals (smooth surfaces such as hull lofts)
MB.prototype.mesh = function (pos, nor, idx, m) {
  const g = arraysGeo(pos, nor, idx);
  return this.geo(g, m);
};

// ------------------------------------------------------------------ shared parts

const smooth01 = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

// Ship / boat hull lofted along z (transom at -len/2, stem at +len/2); y = 0 is the waterline.
// o: len, beam, free (deck height above water at midships), draft, sheer (extra deck height at the bow), stern (transom
//    width ratio), bow (station where the bow taper starts), rake (0..0.3, how much shorter the keel is than the deck),
//    flare (0..0.2, topside wider than the waterline near the bow), paint(t, band, row) -> material, band one of
//    'top' (rows 0-1 above the boot-top), 'boot' (waterline band), 'bottom' (below), 'deck', 'transom'.
export function hull(b, o) {
  const L = o.len, B = o.beam / 2, F = o.free, D = o.draft;
  const sternW = o.stern != null ? o.stern : 0.8, bs = o.bow != null ? o.bow : 0.55, rake = o.rake != null ? o.rake : 0.14;
  const flare = o.flare != null ? o.flare : 0.08, sheer = o.sheer || 0;
  const ST = o.stations || [0, 0.04, 0.12, 0.24, 0.38, 0.5, 0.6, 0.69, 0.77, 0.84, 0.9, 0.945, 0.978, 1];
  const shape = (t) => {
    if (t < bs) return sternW + (1 - sternW) * Math.sin(Math.min(1, t / Math.max(0.05, bs * 0.6)) * Math.PI / 2);
    const u = (t - bs) / (1 - bs);
    return Math.pow(Math.max(0, 1 - Math.pow(u, 2.2)), 0.62);
  };
  const deckY = (t) => F + sheer * smooth01((t - 0.55) / 0.45);
  // rows: [width scale, y(t), length scale]
  const bootTop = o.bootTop != null ? o.bootTop : 0.028;
  const ROWS = [
    [1.0, (t) => deckY(t), 1.0],
    [1.0, (t) => 0.42 * deckY(t), 1 - rake * 0.12],
    [1.0 - flare * 0.5, () => bootTop, 1 - rake * 0.3],
    [1.0 - flare, () => -0.022, 1 - rake * 0.42],
    [(1.0 - flare) * 0.78, () => -D * 0.7, 1 - rake * 0.75],
    [0.0, () => -D, 1 - rake],
  ];
  const NR = ROWS.length, NS = ST.length;
  const P = []; // P[s][r] = [x,y,z] right side
  for (let s = 0; s < NS; s++) {
    const t = ST[s], row = [];
    for (let r = 0; r < NR; r++) {
      const [ws, yf, ls] = ROWS[r];
      // the flare shrinks near the stern: lower rows keep more width aft
      const wsr = r >= 2 && r < NR - 1 ? ws + (1 - ws) * (1 - smooth01(t / 0.6)) * 0.8 : ws;
      row.push([B * shape(t) * wsr, yf(t), -L / 2 + t * L * ls]);
    }
    P.push(row);
  }
  // smooth normals on the side surface (right side), outward +x
  const sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
  const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const NN = [];
  for (let s = 0; s < NS; s++) {
    const row = [];
    for (let r = 0; r < NR; r++) {
      const T = sub(P[Math.min(NS - 1, s + 1)][r], P[Math.max(0, s - 1)][r]);
      const S = sub(P[s][Math.min(NR - 1, r + 1)], P[s][Math.max(0, r - 1)]);
      // n = T x S  (T along +z, S downward gives +x)
      let n = [T[1] * S[2] - T[2] * S[1], T[2] * S[0] - T[0] * S[2], T[0] * S[1] - T[1] * S[0]];
      n = nrm(n);
      if (n[0] < -0.2 && r < NR - 1) n = [-n[0], -n[1], -n[2]];
      row.push(n);
    }
    NN.push(row);
  }
  const bandOf = (r) => (r <= 1 ? 'top' : r === 2 ? 'boot' : 'bottom');
  const paint = o.paint;
  for (const side of [1, -1]) {
    for (let s = 0; s < NS - 1; s++) {
      const tm = (ST[s] + ST[s + 1]) / 2;
      for (let r = 0; r < NR - 1; r++) {
        const m = paint(tm, bandOf(r), r);
        const q = [P[s][r], P[s + 1][r], P[s + 1][r + 1], P[s][r + 1]];
        const qn = [NN[s][r], NN[s + 1][r], NN[s + 1][r + 1], NN[s][r + 1]];
        const pos = [], nor = [];
        for (let k = 0; k < 4; k++) { pos.push(q[k][0] * side, q[k][1], q[k][2]); nor.push(qn[k][0] * side, qn[k][1], qn[k][2]); }
        // winding: (a,b,c) normal should agree with the outward normal
        const ab = [pos[3] - pos[0], pos[4] - pos[1], pos[5] - pos[2]], ac = [pos[6] - pos[0], pos[7] - pos[1], pos[8] - pos[2]];
        const cx = ab[1] * ac[2] - ab[2] * ac[1];
        const idx = cx * side > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
        b.mesh(pos, nor, idx, m);
      }
    }
  }
  // deck
  for (let s = 0; s < NS - 1; s++) {
    const tm = (ST[s] + ST[s + 1]) / 2;
    const a = P[s][0], c = P[s + 1][0];
    b.face([[a[0], a[1], a[2]], [c[0], c[1], c[2]], [-c[0], c[1], c[2]], [-a[0], a[1], a[2]]], paint(tm, 'deck', -1), [0, 1, 0]);
  }
  // transom
  const tr = [];
  for (let r = 0; r < NR; r++) tr.push([P[0][r][0], P[0][r][1], P[0][r][2]]);
  for (let r = NR - 2; r >= 0; r--) tr.push([-P[0][r][0], P[0][r][1], P[0][r][2]]);
  b.face(tr, paint(0, 'transom', -1), [0, 0, -1]);
  return { deckY, deckAt: (z) => deckY((z + L / 2) / L), halfBeam: (t) => B * shape(t), z: (t) => -L / 2 + t * L };
}

// A standing / crouching figure about 0.25u tall (compressed ~1.7x for readability). Faces +z.
// u: { body, legs, head (helmet/cap material), skin, band (armband/marking material or null), vest }
export function person(b, u, x, y, z, s = 1, o = {}) {
  b.push(x, y, z, o.ry || 0, 0, 0, s);
  const crouch = o.crouch ? 0.62 : 1;
  const legH = 0.1 * crouch;
  b.box(0.035, legH, 0.045, u.legs, -0.025, 0, 0);
  b.box(0.035, legH, 0.045, u.legs, 0.025, 0, o.stride ? 0.02 : 0);
  b.box(0.09, 0.085, 0.055, u.vest || u.body, 0, legH, 0, { bevel: 0.012 });
  if (u.band) b.box(0.012, 0.022, 0.05, u.band, 0.049, legH + 0.05, 0);
  // arms forward holding a rifle
  b.box(0.026, 0.07, 0.028, u.body, -0.056, legH + 0.012, 0.012, { rx: -0.5 });
  b.box(0.026, 0.07, 0.028, u.body, 0.056, legH + 0.012, 0.012, { rx: -0.5 });
  b.ball(0.026, u.skin, 0, legH + 0.11, 0, 6, 4);
  b.dome(0.031, u.head, 0, legH + 0.115, 0, 7, 2);
  if (o.rifle !== false) b.box(0.012, 0.016, 0.11, M.gunmetal, 0.018, legH + 0.05, 0.05);
  b.pop();
  return b;
}

export const UNIFORMS = {
  marine: { body: mt(0x5a6342, 0.9), legs: mt(0x4a5236, 0.9), head: mt(0x4d5537, 0.7), skin: M.skin1, band: M.friendly, vest: mt(0x6a6e48, 0.9) },
  officer: { body: mt(0x22304a, 0.8), legs: mt(0x1c2436, 0.8), head: mt(0x1e2a40, 0.5), skin: M.skin3, band: M.friendly, vest: M.hivis },
  raider: { body: mt(0x34373b, 0.9), legs: mt(0x2a2c30, 0.9), head: mt(0x2a2c2f, 0.7), skin: M.skin2, band: M.eRed, vest: mt(0x3b3d3a, 0.9) },
  crew: { body: mt(0x5a6342, 0.9), legs: mt(0x4a5236, 0.9), head: mt(0x4d5537, 0.7), skin: M.skin1, band: null },
};

// Ring of sandbag courses (trapezoid pillows), optionally leaving a gap centred on angle gapA.
export function sandbags(b, r, y0, rows, n, gapA = null, gapW = 0.9, m = M.sandbag) {
  const bagW = (2 * Math.PI * r) / n * 1.02;
  for (let row = 0; row < rows; row++) {
    const off = row % 2 ? 0.5 : 0;
    for (let i = 0; i < n; i++) {
      const a = ((i + off) / n) * Math.PI * 2;
      if (gapA != null) { let d = Math.abs(((a - gapA + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < gapW / 2) continue; }
      b.tbox(bagW, 0.075, bagW * 0.9, 0.055, 0.052, m === M.sandbag && (i * 7 + row * 3) % 5 === 0 ? M.sandbag2 : m, Math.sin(a) * r, y0 + row * 0.05, Math.cos(a) * r, { ry: a });
    }
  }
  return b;
}

// straight sandbag wall along x, centred at (x, z)
export function sandbagWall(b, len, x, y, z, rows = 2, ry = 0, m = M.sandbag) {
  const n = Math.max(1, Math.round(len / 0.085));
  b.push(x, y, z, ry);
  for (let row = 0; row < rows; row++) for (let i = 0; i < n - (row % 2); i++) {
    const px = -len / 2 + (i + 0.5 + (row % 2) * 0.5) * (len / n);
    b.tbox(len / n * 1.02, 0.075, len / n * 0.9, 0.055, 0.052, m, px, row * 0.05, 0);
  }
  b.pop();
  return b;
}

// a row of window panes on a facade. Facade plane: faces direction ry (0 = +z). Panes centred along local x.
export function windows(b, cx, y, cz, ry, count, span, w, h, rnd, litP = 0.7, mOverride) {
  for (let i = 0; i < count; i++) {
    const lx = count === 1 ? 0 : -span / 2 + (i / (count - 1)) * span;
    const x = cx + Math.cos(ry) * lx, z = cz - Math.sin(ry) * lx;
    const m = mOverride || winMat(Math.floor(rnd() * 64), rnd() < litP);
    b.quad(w, h, m, x, y, z, ry);
  }
  return b;
}

// windows on all four sides of a box volume (w x d) for storeys starting at y0, storey height 0.25
export function boxWindows(b, x, z, w, d, y0, floors, rnd, o = {}) {
  const sh = o.storey || 0.25, wh = o.wh || 0.11, ww = o.ww || 0.075, pitch = o.pitch || 0.16, lit = o.lit != null ? o.lit : 0.65;
  const off = 0.004;
  const sides = o.sides || [0, 1, 2, 3];
  for (let f = 0; f < floors; f++) {
    const y = y0 + f * sh + sh * 0.55;
    for (const s of sides) {
      const ry = s * Math.PI / 2;
      const len = s % 2 === 0 ? w : d, dist = (s % 2 === 0 ? d : w) / 2 + off;
      const n = Math.max(1, Math.floor((len - 0.08) / pitch));
      const cx = x + Math.sin(ry) * dist, cz = z + Math.cos(ry) * dist;
      if (o.skipFirst && f === 0 && s === 0) continue;
      windows(b, cx, y, cz, ry, n, (n - 1) * pitch, ww, wh, rnd, lit);
    }
  }
  return b;
}

// ribbon windows (modern): one continuous glass band per storey with dark mullion-free look, split into lit bays
export function ribbon(b, x, z, w, d, y0, floors, rnd, o = {}) {
  const sh = o.storey || 0.25, bh = o.bh || 0.1, bay = o.bay || 0.2, lit = o.lit != null ? o.lit : 0.6;
  const sides = o.sides || [0, 1, 2, 3];
  for (let f = 0; f < floors; f++) {
    const y = y0 + f * sh + (o.yo != null ? o.yo : sh * 0.55);
    for (const s of sides) {
      const ry = s * Math.PI / 2;
      const len = (s % 2 === 0 ? w : d) - (o.inset != null ? o.inset : 0.06), dist = (s % 2 === 0 ? d : w) / 2 + 0.004;
      const n = Math.max(1, Math.round(len / bay)), bw = len / n;
      for (let i = 0; i < n; i++) {
        const lx = -len / 2 + (i + 0.5) * bw;
        const px = x + Math.sin(ry) * dist + Math.cos(ry) * lx, pz = z + Math.cos(ry) * dist - Math.sin(ry) * lx;
        b.quad(bw * 0.97, bh, winMat(Math.floor(rnd() * 64), rnd() < lit), px, y, pz, ry);
      }
    }
  }
  return b;
}

export function flagpole(b, x, z, h, flag, y = 0) {
  b.cyl(0.006, 0.009, h, 5, M.steel, x, y, z);
  b.ball(0.011, M.steel, x, y + h, z, 5, 3);
  b.box(0.12, 0.075, 0.006, flag, x + 0.065, y + h - 0.09, z);
  return b;
}

export function lampPost(b, x, z, h = 0.5, y = 0) {
  b.cyl(0.008, 0.012, h, 5, M.darkSteel, x, y, z);
  b.box(0.05, 0.012, 0.022, M.darkSteel, x + 0.02, y + h, z);
  b.box(0.034, 0.008, 0.016, M.lamp, x + 0.03, y + h - 0.007, z);
  return b;
}

// park / street tree: trunk + clustered faceted canopy (forest greens), ~60-90 tris
export function tree(b, x, z, s = 1, y = 0, tone = 0) {
  const leaf = [mt(0x4e6a3a, 0.95), mt(0x5c7a40, 0.95), mt(0x41592f, 0.95)][tone % 3];
  const leaf2 = [mt(0x5f7d45, 0.95), mt(0x6b8a4b, 0.95), mt(0x4f6a3a, 0.95)][tone % 3];
  b.cyl(0.018 * s, 0.026 * s, 0.16 * s, 5, M.wood, x, y, z);
  b.push(x, y, z, tone * 1.3, 0, 0, s);
  b.geo(icoGeo(0.13, 0), leaf, localMatrix(_m2, 0, 0.27, 0, 0, 0, 0, 1, 0.9, 1));
  b.geo(icoGeo(0.09, 0), leaf2, localMatrix(_m2, 0.06, 0.34, -0.03, 0.7, 0, 0, 1, 1, 1));
  b.geo(icoGeo(0.085, 0), leaf, localMatrix(_m2, -0.07, 0.23, 0.05, 0.3, 0, 0, 1, 0.9, 1));
  b.pop();
  return b;
}
const icoCache = new Map();
function icoGeo(r, det) {
  const k = r + ':' + det;
  if (!icoCache.has(k)) icoCache.set(k, new THREE.IcosahedronGeometry(r, det));
  return icoCache.get(k);
}

export function bench(b, x, z, ry = 0, y = 0) {
  b.push(x, y, z, ry);
  b.box(0.1, 0.008, 0.03, M.wood, 0, 0.03, 0);
  b.box(0.1, 0.025, 0.006, M.wood, 0, 0.04, -0.014);
  b.box(0.006, 0.03, 0.03, M.darkSteel, -0.04, 0, 0);
  b.box(0.006, 0.03, 0.03, M.darkSteel, 0.04, 0, 0);
  b.pop();
  return b;
}

// antenna mast with a blinking red beacon on top
export function mast(b, x, z, h, y = 0, beacon = true) {
  b.cyl(0.005, 0.009, h, 4, M.steel, x, y, z);
  if (beacon) b.box(0.016, 0.016, 0.016, M.beacon, x, y + h, z);
  return b;
}

// rooftop clutter: AC units with fan grilles
export function acUnit(b, x, y, z, ry = 0) {
  b.box(0.07, 0.04, 0.05, M.shed, x, y, z, { ry });
  b.cyl(0.016, 0.016, 0.004, 8, M.darkSteel, x, y + 0.04, z);
  return b;
}

// parabolic dish facing +z (rim radius r, depth d), both sides, on its own back mount
export function dish(b, r, d, m, x, y, z, o = {}) {
  const prof = [];
  for (let i = 0; i <= 4; i++) { const rr = (i / 4) * r; prof.push(new THREE.Vector2(Math.max(rr, 1e-4), (rr * rr) / (r * r) * d)); }
  const g = new THREE.LatheGeometry(prof, o.seg || 10);
  // lathe opens toward +y; rotate so it opens toward +z
  const local = localMatrix(new THREE.Matrix4(), x, y, z, o.ry || 0, (o.rx || 0) + Math.PI / 2, 0, 1, 1, 1);
  b.geo2(g, m, local);
  return b;
}

// ------------------------------------------------------------------ military: MG post (headY 0.2, muzzle 0.32)

function mgBase(lvl) {
  const b = new MB();
  b.cyl(0.44, 0.5, 0.025, 12, M.dirt);
  if (lvl === 3) {
    // low hexagonal pillbox with firing slits, sandbags on the roof edge
    b.cyl(0.36, 0.42, 0.15, 6, M.concrete, 0, 0.02, 0, { flat: true, ry: Math.PI / 6 });
    b.cyl(0.36, 0.36, 0.012, 6, M.concreteDark, 0, 0.17, 0, { flat: true, ry: Math.PI / 6 });
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      if (k === 3) continue;
      b.quad(0.16, 0.025, M.black, Math.sin(a) * 0.395, 0.12, Math.cos(a) * 0.395, a, { rx: -0.13 });
    }
    b.box(0.1, 0.11, 0.02, M.darkSteel, 0, 0.02, -0.39); // rear door
    sandbags(b, 0.31, 0.18, 1, 14, Math.PI, 0.7);
    // searchlight tower at the rear corner
    b.rod(-0.3, 0.17, -0.2, -0.3, 0.42, -0.2, 0.008, 4, M.steel);
    b.box(0.05, 0.035, 0.05, M.olive, -0.3, 0.42, -0.2);
    b.quad(0.03, 0.022, M.lamp, -0.3, 0.437, -0.174, 0);
    b.cyl(0.004, 0.004, 0.18, 3, M.steel, 0.32, 0.17, -0.18);
  } else {
    if (lvl === 2) {
      // corrugated steel revetment under the bags
      b.lathe([[0.38, 0.025], [0.38, 0.11], [0.36, 0.11], [0.36, 0.025]], 14, M.oliveDark, 0, 0, 0, { t0: Math.PI * 0.62, tl: Math.PI * 1.76 });
    }
    sandbags(b, 0.31, lvl === 2 ? 0.11 : 0.025, lvl === 2 ? 2 : 3, 14, Math.PI, 0.75);
  }
  // ammo crates and a jerrycan stack inside / beside the ring
  b.box(0.07, 0.04, 0.045, M.olive, 0.36, 0.025, -0.28, { ry: 0.4 });
  b.box(0.07, 0.04, 0.045, M.oliveDark, 0.36, 0.065, -0.27, { ry: 0.5 });
  b.box(0.05, 0.05, 0.04, M.olive, -0.38, 0.025, -0.24, { ry: -0.3 });
  return b;
}

function mgHead(lvl, gnd = -0.18) {
  const b = new MB();
  const g = gnd; // floor below the pivot
  b.cyl(0.012, 0.016, 0.26, 5, M.darkSteel, 0, g, 0.0);
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; b.rod(0, g + 0.15, 0, Math.sin(a) * 0.09, g, Math.cos(a) * 0.09, 0.006, 3, M.darkSteel); }
  const twin = lvl >= 2;
  const xs = twin ? [-0.026, 0.026] : [0];
  b.box(twin ? 0.1 : 0.05, 0.035, 0.05, M.gunmetal, 0, 0.08, 0.0, { bevel: 0.006 });
  for (const x of xs) {
    b.box(0.032, 0.04, 0.17, M.gunmetal, x, 0.1, 0.03, { bevel: 0.006 });
    b.rod(x, 0.12, 0.11, x, 0.12, 0.2, 0.014, 6, M.darkSteel);
    b.rod(x, 0.12, 0.2, x, 0.12, 0.32, 0.008, 5, M.darkSteel);
    b.box(0.03, 0.035, 0.04, M.olive, x + (x <= 0 ? -0.03 : 0.03), 0.085, 0.02); // ammo can
  }
  // gun shield
  b.tbox(twin ? 0.2 : 0.15, 0.012, twin ? 0.17 : 0.13, 0.012, 0.1, M.olive, 0, 0.065, 0.12, { rx: -0.12 });
  b.quad(0.04, 0.012, M.friendly, twin ? 0.06 : 0.045, 0.14, 0.128, 0);
  person(b, UNIFORMS.crew, 0, g, -0.12, 0.95, { crouch: true, rifle: false });
  if (lvl >= 3) {
    // searchlight on the mount
    b.cyl(0.026, 0.026, 0.05, 8, M.olive, -0.1, 0.1, 0.06, { rx: Math.PI / 2 });
    b.cyl(0.022, 0.022, 0.004, 8, M.lamp, -0.1, 0.1, 0.11, { rx: Math.PI / 2 });
  }
  return b;
}

// ------------------------------------------------------------------ military: coastal gun (headY 0.32, muzzle 0.85)

function coastalBase(lvl) {
  const b = new MB();
  const top = 0.3;
  // stepped concrete emplacement: weathered foot band, battered walls, chamfered rim
  b.lathe([[0.58, 0.0], [0.57, 0.06], [0.0, 0.06]], 16, M.concreteDark);
  b.lathe([[0.55, 0.06], [0.5, top - 0.03], [0.47, top], [0.0, top]], 16, M.concrete);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8; b.box(0.012, top - 0.07, 0.03, M.concreteDark, Math.sin(a) * 0.525, 0.06, Math.cos(a) * 0.525, { ry: a, rx: 0 }); }
  // turntable well
  b.cyl(0.33, 0.33, 0.006, 20, M.concreteDark, 0, top, 0);
  // parapet ring (higher with level)
  const ph = lvl === 1 ? 0.035 : lvl === 2 ? 0.06 : 0.09;
  b.lathe([[0.48, top], [0.46, top + ph], [0.42, top + ph], [0.42, top]], 20, M.concreteLight);
  // ammunition bunker door in the rear face, steps up the side
  b.box(0.16, 0.14, 0.12, M.concreteDark, 0, 0, -0.56);
  b.box(0.1, 0.1, 0.02, M.darkSteel, 0, 0, -0.62);
  b.box(0.2, 0.025, 0.14, M.concreteLight, 0, 0.14, -0.56);
  for (let k = 0; k < 4; k++) b.box(0.1, 0.02, 0.05, M.concreteLight, 0.36, k * 0.065, -0.44 + k * 0.045, { ry: -0.68 });
  // ready-ammo lockers on the deck
  b.box(0.09, 0.05, 0.05, M.olive, -0.37, top, -0.18, { ry: 1.0 });
  b.box(0.09, 0.05, 0.05, M.olive, 0.37, top, -0.18, { ry: -1.0 });
  if (lvl >= 2) {
    // earth berm round the foot, sandbags crowning it, rangefinder hut
    b.lathe([[0.7, 0.0], [0.64, 0.1], [0.59, 0.11], [0.57, 0.06]], 20, M.dirt);
    sandbags(b, 0.63, 0.1, 1, 24, Math.PI, 0.5);
    b.box(0.15, 0.1, 0.12, M.concrete, -0.5, 0.06, -0.42, { bevel: 0.012, ry: 0.6 });
    b.quad(0.1, 0.012, M.black, -0.468, 0.135, -0.368, 0.6);
  }
  if (lvl >= 3) {
    // armoured shelters flanking the front, lit command post entrance, warning beacon mast
    for (const sx of [-1, 1]) b.box(0.18, 0.16, 0.12, M.concreteDark, sx * 0.48, 0, 0.4, { ry: -sx * 0.75, bevel: 0.015 });
    b.quad(0.06, 0.06, winMat(11), 0, 0.05, -0.6215, Math.PI);
    b.cyl(0.004, 0.006, 0.42, 4, M.steel, 0.5, 0.0, -0.3);
    b.box(0.014, 0.014, 0.014, M.beacon, 0.5, 0.42, -0.3);
  }
  return b;
}

function coastalHead(lvl) {
  const b = new MB();
  const twin = lvl >= 2;
  const W = twin ? 0.44 : 0.38;
  b.cyl(0.3, 0.3, 0.035, 18, M.darkSteel, 0, 0, 0);
  // faceted gunhouse
  b.tbox(W, 0.5, W * 0.78, 0.34, 0.2, M.naval, 0, 0.035, -0.03, { zs: -0.04 });
  b.tbox(W * 0.9, 0.06, W * 0.76, 0.05, 0.13, M.naval, 0, 0.05, 0.215, { zs: -0.01 });
  // mantlet and barrels
  const xs = twin ? [-0.075, 0.075] : [0];
  for (const x of xs) {
    b.cyl(0.05, 0.05, 0.06, 10, M.gunmetal, x, 0.12, 0.23, { rx: Math.PI / 2 });
    b.rod(x, 0.12, 0.25, x, 0.122, 0.62, 0.032, 10, M.gunmetal, 0.028);
    b.rod(x, 0.122, 0.62, x, 0.124, 0.82, 0.025, 10, M.gunmetal, 0.023);
    b.rod(x, 0.124, 0.82, x, 0.124, 0.875, 0.034, 10, M.darkSteel, 0.034);
  }
  // roof: hatches, sights, friendly marking
  b.cyl(0.04, 0.04, 0.015, 10, M.naval, -0.08, 0.235, -0.1);
  b.box(0.04, 0.03, 0.05, M.gunmetal, 0.1, 0.235, 0.02);
  for (const s of [-1, 1]) b.quad(0.12, 0.025, M.friendly, s * (W * 0.445 + 0.004), 0.17, -0.06, s * Math.PI / 2 + s * 0.1);
  b.cyl(0.002, 0.003, 0.2, 3, M.steel, -0.12, 0.235, -0.2);
  if (lvl >= 3) {
    // rangefinder bar and fire-control dish on the roof
    b.rod(-0.24, 0.27, -0.06, 0.24, 0.27, -0.06, 0.018, 8, M.naval);
    for (const s of [-1, 1]) b.cyl(0.026, 0.026, 0.03, 8, M.gunmetal, s * 0.245, 0.27, -0.06, { rz: Math.PI / 2 });
    b.cyl(0.012, 0.012, 0.035, 5, M.naval, 0, 0.235, -0.06);
    b.cyl(0.01, 0.01, 0.1, 5, M.steel, 0, 0.235, -0.2);
    dish(b, 0.07, 0.025, M.dish, 0, 0.34, -0.2, { ry: 0, rx: -0.3 });
  }
  return b;
}

// ------------------------------------------------------------------ military: flak battery (headY 0.3, muzzle 0.5)

function flakBase(lvl) {
  const b = new MB();
  b.cyl(0.47, 0.52, 0.03, 14, M.dirt);
  b.cyl(0.36, 0.36, 0.02, 14, M.concrete, 0, 0.03, 0);
  if (lvl >= 2) b.lathe([[0.5, 0.03], [0.44, 0.15], [0.39, 0.15], [0.39, 0.03]], 18, M.concrete, 0, 0, 0, { t0: Math.PI * 1.12, tl: Math.PI * 1.76 });
  sandbags(b, 0.42, lvl >= 2 ? 0.15 : 0.03, lvl >= 2 ? 1 : 3, 18, Math.PI, 0.55);
  // ammunition racks inside the pit
  for (const s of [-1, 1]) {
    b.box(0.12, 0.06, 0.05, M.olive, s * 0.26, 0.05, -0.2, { ry: s * 0.6 });
    b.box(0.05, 0.06, 0.12, M.oliveDark, s * 0.3, 0.05, 0.06, { ry: s * 0.2 });
  }
  if (lvl >= 3) {
    // fire-control radar on a lattice mast outside the barrel sweep, plus generator
    const mx = -0.55, mz = -0.36;
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.rod(mx + dx * 0.05, 0.0, mz + dz * 0.05, mx + dx * 0.02, 0.5, mz + dz * 0.02, 0.006, 3, M.steel);
    b.cyl(0.05, 0.05, 0.02, 8, M.olive, mx, 0.5, mz);
    dish(b, 0.09, 0.03, M.dish, mx, 0.6, mz + 0.01, { rx: -0.35 });
    b.box(0.014, 0.014, 0.014, M.beacon, mx, 0.68, mz - 0.04);
    b.box(0.16, 0.08, 0.1, M.olive, 0.5, 0.0, -0.4, { ry: -0.6, bevel: 0.01 });
    b.cyl(0.012, 0.012, 0.05, 6, M.darkSteel, 0.47, 0.08, -0.41);
  }
  return b;
}

function flakHead(lvl) {
  const b = new MB();
  const g = -0.25; // floor of the pit below the pivot
  b.cyl(0.1, 0.14, 0.25, 10, M.olive, 0, g, 0);
  b.box(0.3, 0.07, 0.24, M.olive, 0, 0.0, -0.01, { bevel: 0.012 });
  // cradle
  const el = 0.85; // ~49 degrees
  const dy = Math.sin(el), dz = Math.cos(el);
  const rows = lvl >= 2 ? [0.0, 0.055] : [0.03];
  const cols = [-0.055, 0.055];
  b.push(0, 0.1, 0.02, 0, -el, 0);
  b.box(0.17, 0.08, 0.2, M.olive, 0, -0.04, -0.05, { bevel: 0.01 });
  for (const c of cols) b.box(0.035, 0.05, 0.18, M.gunmetal, c * 1.2, 0.03, -0.04);
  b.pop();
  for (const r of rows) for (const c of cols) {
    const y0 = 0.1 + r, z0 = 0.03;
    b.rod(c, y0, z0, c, y0 + dy * 0.3, z0 + dz * 0.3, 0.013, 6, M.darkSteel, 0.011);
    b.rod(c, y0 + dy * 0.3, z0 + dz * 0.3, c, y0 + dy * 0.5, z0 + dz * 0.5, 0.009, 5, M.darkSteel);
    b.rod(c, y0 + dy * 0.47, z0 + dz * 0.47, c, y0 + dy * 0.52, z0 + dz * 0.52, 0.014, 6, M.gunmetal);
  }
  // ammo cassettes on top and the gunner seats
  for (const c of cols) b.box(0.05, 0.05, 0.1, M.olive, c * 2.1, 0.07, -0.02, { rx: -0.3 });
  b.quad(0.06, 0.02, M.friendly, 0.151, 0.035, -0.02, Math.PI / 2);
  b.quad(0.06, 0.02, M.friendly, -0.151, 0.035, -0.02, -Math.PI / 2);
  person(b, UNIFORMS.crew, -0.17, g + 0.18, -0.12, 0.9, { crouch: true, rifle: false });
  if (lvl >= 3) {
    b.cyl(0.008, 0.008, 0.1, 5, M.steel, 0.13, 0.07, -0.13);
    dish(b, 0.055, 0.02, M.dish, 0.13, 0.19, -0.12, { rx: -0.4 });
  }
  return b;
}

// ------------------------------------------------------------------ military: missile battery (headY 0.28, muzzle 0.3)

function missileBase(lvl) {
  const b = new MB();
  b.hexPad(0.8, 0.02, M.concrete);
  // safety ring and hazard markings
  b.lathe([[0.42, 0.022], [0.38, 0.022]], 24, M.markingY);
  // launcher trailer: chassis, wheels, outriggers, turntable under the head (headY 0.28)
  const y0 = 0.02;
  b.box(0.24, 0.1, 0.64, M.olive, 0, y0 + 0.07, -0.04, { bevel: 0.015 });
  b.box(0.2, 0.06, 0.2, M.oliveDark, 0, y0 + 0.17, 0.0, { bevel: 0.01 });
  b.cyl(0.13, 0.14, 0.03, 14, M.darkSteel, 0, y0 + 0.23, 0);
  for (const z of [-0.24, -0.32]) b.rod(-0.15, y0 + 0.05, z, 0.15, y0 + 0.05, z, 0.05, 8, M.rubber);
  b.box(0.16, 0.06, 0.14, M.oliveDark, 0, y0 + 0.08, 0.33, { bevel: 0.01 });
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    b.rod(sx * 0.12, y0 + 0.12, sz * 0.22, sx * 0.26, y0 + 0.01, sz * 0.26, 0.01, 4, M.darkSteel);
    b.cyl(0.03, 0.03, 0.012, 6, M.darkSteel, sx * 0.26, y0, sz * 0.26);
  }
  // equipment shelter, generator, cable trays
  b.box(0.3, 0.17, 0.18, M.olive, -0.46, y0, -0.42, { ry: 0.5, bevel: 0.015 });
  b.box(0.05, 0.1, 0.006, M.darkSteel, -0.37, y0, -0.33, { ry: 0.5 });
  acUnit(b, -0.56, y0 + 0.17, -0.47, 0.5);
  b.cyl(0.005, 0.006, 0.35, 4, M.steel, -0.59, y0 + 0.17, -0.38);
  b.box(0.014, 0.014, 0.014, M.beacon, -0.59, y0 + 0.52, -0.38);
  b.box(0.2, 0.11, 0.12, M.oliveDark, 0.48, y0, -0.42, { ry: -0.5, bevel: 0.012 });
  b.box(0.012, 0.012, 0.3, M.darkSteel, 0.3, y0, -0.24, { ry: -0.6 });
  if (lvl >= 2) {
    // concrete blast walls (T-walls) at both sides
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      b.box(0.13, 0.22, 0.035, M.concreteLight, s * 0.62, y0, -0.12 + k * 0.14, { ry: Math.PI / 2 });
      b.box(0.06, 0.02, 0.11, M.concreteLight, s * 0.62, y0, -0.12 + k * 0.14);
    }
  }
  if (lvl >= 3) {
    // phased-array radar on its own trailer at the rear corner
    b.box(0.22, 0.06, 0.14, M.olive, 0.0, y0, -0.68, { bevel: 0.01 });
    b.push(0, y0 + 0.06, -0.66, 0, -0.35, 0);
    b.box(0.22, 0.22, 0.04, M.oliveDark, 0, 0, 0, { bevel: 0.008 });
    b.quad(0.18, 0.18, mt(0x2c3436, 0.35, 0.4, EMI.pulse(3)), 0, 0.11, 0.021, 0);
    b.pop();
  }
  return b;
}

function missileHead(lvl) {
  const b = new MB();
  b.cyl(0.17, 0.17, 0.04, 14, M.oliveDark, 0, -0.02, 0);
  b.box(0.26, 0.08, 0.2, M.olive, 0, 0.02, -0.02, { bevel: 0.012 });
  const el = 0.55;
  const ncol = lvl >= 2 ? 3 : 2;
  b.push(0, 0.12, -0.02, 0, -el, 0);
  // canister pack
  const cw = 0.095, len = 0.5;
  const w = ncol * cw, h = 2 * cw;
  b.box(w + 0.02, h + 0.02, 0.05, M.oliveDark, 0, -0.01, -len * 0.42, { bevel: 0.008 });
  for (let i = 0; i < ncol; i++) for (let j = 0; j < 2; j++) {
    const x = -w / 2 + cw * (i + 0.5), y = j * cw;
    b.box(cw * 0.94, cw * 0.94, len, M.olive, x, y, -0.05, { bevel: 0.008 });
    b.quad(cw * 0.8, cw * 0.8, mt(0xa39d8a, 0.8), x, y + cw * 0.47, -0.05 + len / 2 + 0.002, 0);
    b.quad(cw * 0.85, 0.012, M.friendly, x, y + cw * 0.94 + 0.001, 0.1, 0, { rx: -Math.PI / 2 });
  }
  b.pop();
  // elevation rams
  for (const s of [-1, 1]) b.rod(s * 0.1, 0.03, 0.05, s * 0.1, 0.12, 0.12, 0.01, 5, M.steel);
  if (lvl >= 3) {
    b.box(0.04, 0.12, 0.04, M.oliveDark, 0.17, 0.02, -0.08);
    dish(b, 0.06, 0.02, M.dish, 0.17, 0.17, -0.07, { rx: -0.2 });
  }
  return b;
}

// ------------------------------------------------------------------ military: radar station (headY 0.55)

function radarBase() {
  const b = new MB();
  b.hexPad(0.8, 0.02, M.concrete);
  // operations building
  b.box(0.42, 0.24, 0.3, M.concreteLight, -0.3, 0.02, 0.32, { bevel: 0.015, ry: 0.0 });
  b.box(0.44, 0.02, 0.32, M.concreteDark, -0.3, 0.26, 0.32);
  ribbon(b, -0.3, 0.32, 0.42, 0.3, 0.02, 1, rng(31), { bh: 0.05, bay: 0.1, sides: [0, 1, 3], yo: 0.15, lit: 0.8 });
  b.box(0.08, 0.13, 0.006, M.darkSteel, -0.08, 0.02, 0.473);
  acUnit(b, -0.38, 0.28, 0.3); acUnit(b, -0.22, 0.28, 0.36);
  b.cyl(0.004, 0.006, 0.3, 4, M.steel, -0.46, 0.28, 0.42);
  b.quad(0.1, 0.03, M.friendly, -0.3, 0.2, 0.4735, 0);
  // lattice tower to the head
  const H = 0.53, r0 = 0.17, r1 = 0.06;
  const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of legs) b.rod(sx * r0, 0.02, sz * r0, sx * r1, H, sz * r1, 0.011, 4, M.steel);
  const lv = [0.02, 0.18, 0.32, 0.44, H];
  for (let k = 0; k < lv.length - 1; k++) {
    const ya = lv[k], yb = lv[k + 1];
    const ra = r0 + (r1 - r0) * (ya - 0.02) / (H - 0.02), rb = r0 + (r1 - r0) * (yb - 0.02) / (H - 0.02);
    for (let i = 0; i < 4; i++) {
      const [ax, az] = legs[i], [bx, bz] = legs[(i + 1) % 4];
      b.rod(ax * ra, ya, az * ra, bx * rb, yb, bz * rb, 0.005, 3, M.steel);
      b.rod(ax * rb, yb, az * rb, bx * rb, yb, bz * rb, 0.005, 3, M.steel);
    }
  }
  b.cyl(0.09, 0.09, 0.02, 10, M.steel, 0, H - 0.01, 0);
  // fence posts at the pad corners and a generator
  b.box(0.18, 0.1, 0.1, M.olive, 0.42, 0.02, -0.4, { ry: -0.5, bevel: 0.01 });
  return b;
}

function radarHead() {
  const b = new MB();
  b.cyl(0.04, 0.05, 0.08, 8, M.gunmetal, 0, 0, 0);
  b.box(0.12, 0.05, 0.08, M.gunmetal, 0, 0.06, -0.02, { bevel: 0.01 });
  // curved reflector (parabolic cylinder), tilted back, with a grid of ribs and a feed boom
  b.push(0, 0.2, -0.02, 0, -0.25, 0);
  const refl = new THREE.CylinderGeometry(0.2, 0.2, 0.86, 8, 1, true, Math.PI - 0.7, 1.4);
  b.geo2(refl, M.dish, localMatrix(new THREE.Matrix4(), 0, 0, 0.17, 0, 0, Math.PI / 2, 1, 1, 1));
  for (let k = -3; k <= 3; k++) b.box(0.006, 0.16, 0.03, M.steel, k * 0.13, -0.08, -0.03);
  b.box(0.86, 0.012, 0.02, M.steel, 0, -0.085, -0.025);
  b.box(0.86, 0.012, 0.02, M.steel, 0, 0.07, -0.025);
  b.rod(0, -0.02, 0.0, 0, -0.05, 0.16, 0.008, 4, M.steel);
  b.box(0.05, 0.03, 0.04, M.gunmetal, 0, -0.07, 0.16);
  // IFF bar on top
  b.box(0.7, 0.025, 0.012, M.gunmetal, 0, 0.1, -0.03);
  b.pop();
  b.box(0.016, 0.016, 0.016, M.beacon, 0, 0.33, -0.08);
  return b;
}

// ------------------------------------------------------------------ military: barracks (3 levels)

function hut(b, x, z, len, r, ry = 0, m = M.olive) {
  b.push(x, 0, z, ry);
  const g = new THREE.CylinderGeometry(r, r, len, 10, 1, false, 0, Math.PI);
  // rotate so the half-cylinder lies along x with its flat side down
  b.geo(g, m, localMatrix(new THREE.Matrix4(), 0, 0, 0, 0, 0, Math.PI / 2, 1, 1, 1));
  // end walls with doors and windows
  b.box(0.06, 0.09, 0.006, M.darkSteel, len / 2 + 0.001, 0, 0, { ry: Math.PI / 2 });
  b.quad(0.035, 0.03, winMat(Math.round(x * 97 + z * 31)), len / 2 + 0.004, 0.12, r * 0.45, Math.PI / 2);
  b.quad(0.035, 0.03, winMat(Math.round(x * 53 + z * 17), false), -len / 2 - 0.004, 0.1, 0, -Math.PI / 2);
  b.box(0.012, 0.012, len * 0.9, M.oliveDark, 0, r - 0.004, 0, { ry: Math.PI / 2 });
  b.pop();
  return b;
}

function barracksModel(lvl) {
  const b = new MB();
  b.hexPad(0.82, 0.015, M.dirt);
  // parade ground
  b.box(0.7, 0.006, 0.34, M.asphalt, 0.02, 0.015, 0.36);
  for (let k = 0; k < 4; k++) b.box(0.004, 0.002, 0.26, M.marking, -0.24 + k * 0.17, 0.021, 0.36);
  hut(b, 0.0, -0.06, 0.78, 0.13, 0);
  if (lvl >= 2) hut(b, -0.08, -0.38, 0.6, 0.12, 0);
  else hut(b, -0.08, -0.38, 0.6, 0.12, 0, M.khaki);
  if (lvl >= 3) {
    // two-storey command building with a comms mast
    b.box(0.26, 0.42, 0.22, M.concreteLight, 0.5, 0.015, -0.3, { bevel: 0.012 });
    b.box(0.28, 0.02, 0.24, M.concreteDark, 0.5, 0.435, -0.3);
    boxWindows(b, 0.5, -0.3, 0.26, 0.22, 0.04, 2, rng(77), { storey: 0.19, wh: 0.07, ww: 0.05, pitch: 0.09 });
    mast(b, 0.55, -0.34, 0.45, 0.455);
    b.quad(0.12, 0.03, M.friendly, 0.5, 0.36, -0.1855, 0);
  }
  // flag, gate and guard post
  flagpole(b, 0.46, 0.38, 0.6, M.friendly, 0.015);
  sandbagWall(b, 0.3, -0.5, 0.015, 0.5, 2, 0.5);
  b.box(0.1, 0.13, 0.1, M.olive, -0.62, 0.015, 0.14, { bevel: 0.01 });
  b.box(0.13, 0.015, 0.13, M.oliveDark, -0.62, 0.145, 0.14);
  if (lvl >= 2) {
    // watch tower with searchlight
    const tx = 0.52, tz = 0.08;
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.rod(tx + dx * 0.06, 0.015, tz + dz * 0.06, tx + dx * 0.04, 0.5, tz + dz * 0.04, 0.008, 4, M.wood);
    b.box(0.14, 0.012, 0.14, M.wood, tx, 0.5, tz);
    b.box(0.14, 0.05, 0.14, M.olive, tx, 0.512, tz, { sx: 1 });
    b.hip(0.17, 0.17, 0.06, M.oliveDark, tx, 0.6, tz);
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.rod(tx + dx * 0.065, 0.56, tz + dz * 0.065, tx + dx * 0.065, 0.6, tz + dz * 0.065, 0.005, 3, M.wood);
    b.quad(0.03, 0.02, M.lamp, tx, 0.58, tz + 0.075, 0);
  }
  // a crate stack and a jeep on the hardstanding
  b.box(0.08, 0.06, 0.06, M.olive, -0.3, 0.015, 0.62);
  b.box(0.08, 0.06, 0.06, M.oliveDark, -0.21, 0.015, 0.63);
  if (lvl >= 3) jeep(b, 0.15, 0.62, Math.PI / 2 + 0.3);
  return b;
}

function jeep(b, x, z, ry) {
  b.push(x, 0.015, z, ry);
  b.box(0.11, 0.04, 0.22, M.olive, 0, 0.025, 0, { bevel: 0.01 });
  b.tbox(0.11, 0.08, 0.1, 0.07, 0.035, M.oliveDark, 0, 0.065, -0.04);
  b.quad(0.09, 0.025, M.glassCar, 0, 0.08, 0.005, 0, { rx: -0.4 });
  for (const zz of [-0.07, 0.07]) b.rod(-0.065, 0.025, zz, 0.065, 0.025, zz, 0.025, 6, M.rubber);
  b.pop();
}

// ------------------------------------------------------------------ military: airfield (3 levels)

// local parking spots for interceptors on the apron: [x, z, yaw, scale] (yaw pi/2 = nose toward the runway)
export const AIRFIELD_SPOTS = [[-0.34, 0.42, Math.PI / 2, 0.42], [-0.34, 0.06, Math.PI / 2, 0.42], [-0.34, -0.3, Math.PI / 2, 0.42]];

// arched hangar, axis along local x, doors on the +x end
function hangar(b, x, z, len, r) {
  b.push(x, 0.012, z, 0);
  const g = new THREE.CylinderGeometry(r, r, len, 12, 1, false, 0, Math.PI);
  b.geo(g, M.sheet, localMatrix(new THREE.Matrix4(), 0, 0, 0, 0, 0, Math.PI / 2, 0.8, 1, 1));
  b.box(0.006, r * 0.6, r * 1.45, M.gunmetal, len / 2 + 0.003, 0, 0);
  b.box(0.008, r * 0.6, 0.006, M.markingY, len / 2 + 0.006, 0, 0);
  for (let k = -2; k <= 2; k++) b.cbox(0.01, 0.01, r * 2.04, M.steel, k * len / 5, 0.005, 0);
  b.quad(0.05, 0.02, M.lamp, len / 2 + 0.008, r * 0.66, 0, Math.PI / 2);
  b.pop();
}

function airfieldModel(lvl) {
  const b = new MB();
  b.hexPad(0.86, 0.012, M.grass);
  const rx = 0.22, RW = 0.28, RL = 1.5;
  b.box(RW, 0.006, RL, M.asphalt, rx, 0.012, 0);
  // markings: centreline dashes, piano keys, edge lines, touchdown blocks
  for (let k = 0; k < 7; k++) b.box(0.012, 0.002, 0.09, M.marking, rx, 0.018, -0.48 + k * 0.16);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) b.box(0.016, 0.002, 0.08, M.marking, rx - 0.1 + k * 0.04, 0.018, s * 0.66);
    b.box(0.006, 0.002, RL - 0.02, M.marking, rx + s * 0.13, 0.018, 0);
    for (const t of [-1, 1]) b.box(0.03, 0.002, 0.06, M.marking, rx + t * 0.06, 0.018, s * 0.45);
    // threshold lights (green outbound / red stop bar)
    for (let k = 0; k < 5; k++) b.box(0.012, 0.01, 0.012, s > 0 ? M.navG : M.navR, rx - 0.12 + k * 0.06, 0.012, s * 0.755);
  }
  // runway edge lights
  for (let k = 0; k < 9; k++) for (const e of [-1, 1]) b.box(0.01, 0.012, 0.01, mt(0xfff0c8, 0.4, 0, EMI.night(5)), rx + e * 0.15, 0.012, -0.64 + k * 0.16);
  // taxiway and apron
  b.box(0.36, 0.006, 1.2, M.concrete, -0.36, 0.012, 0);
  b.box(0.16, 0.006, 0.12, M.concrete, -0.1, 0.012, 0.3);
  b.box(0.16, 0.006, 0.12, M.concrete, -0.1, 0.012, -0.3);
  for (const [x, z] of AIRFIELD_SPOTS) b.box(0.3, 0.002, 0.004, M.markingY, x + 0.05, 0.018, z);
  b.box(0.004, 0.002, 1.1, M.markingY, -0.2, 0.018, 0);
  hangar(b, -0.7, 0.32, 0.3, 0.14);
  if (lvl >= 2) {
    hangar(b, -0.7, -0.08, 0.3, 0.14);
    // fuel tanks and windsock
    for (const k of [0, 1]) { b.cyl(0.05, 0.05, 0.1, 10, M.white, 0.55 + k * 0.12, 0.012, -0.55 + k * 0.03); b.cyl(0.05, 0.05, 0.006, 10, M.steel, 0.55 + k * 0.12, 0.112, -0.55 + k * 0.03); }
    b.cyl(0.003, 0.004, 0.18, 3, M.steel, 0.5, 0.012, 0.55);
    b.cyl(0.012, 0.02, 0.06, 6, mt(0xe8742a, 0.8), 0.5, 0.17, 0.585, { rx: Math.PI / 2 });
  } else {
    b.box(0.14, 0.08, 0.2, M.olive, -0.68, 0.012, -0.05, { bevel: 0.01 });
  }
  if (lvl >= 3) {
    // control tower: column + glazed cab + beacon, radar dome on a pylon, approach lights
    const tx = 0.6, tz = 0.2;
    b.box(0.12, 0.5, 0.12, M.concreteLight, tx, 0.012, tz, { bevel: 0.01 });
    b.tbox(0.18, 0.18, 0.2, 0.2, 0.08, M.glass, tx, 0.51, tz);
    for (let k = 0; k < 4; k++) b.quad(0.15, 0.05, winMat(5 + k), tx + Math.sin(k * Math.PI / 2) * 0.096, 0.55, tz + Math.cos(k * Math.PI / 2) * 0.096, k * Math.PI / 2);
    b.box(0.22, 0.02, 0.22, M.concreteDark, tx, 0.59, tz);
    b.cyl(0.004, 0.005, 0.12, 3, M.steel, tx, 0.61, tz);
    b.box(0.014, 0.014, 0.014, M.beacon, tx, 0.73, tz);
    b.cyl(0.02, 0.03, 0.18, 6, M.steel, 0.62, 0.012, -0.25);
    b.ball(0.08, M.white, 0.62, 0.25, -0.25, 12, 8);
  }
  return b;
}

// ------------------------------------------------------------------ Town Hall (hq, 3 levels; rooftop gun at headY 0.93)

export const HQ_HEAD_Y = 0.93;

function columns(b, n, x0, x1, z, y0, h, r, m) {
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? x0 : x0 + (i / (n - 1)) * (x1 - x0);
    b.cyl(r * 1.25, r * 1.25, 0.012, 8, m, x, y0, z);
    b.cyl(r, r * 1.1, h - 0.024, 8, m, x, y0 + 0.012, z);
    b.box(r * 2.6, 0.014, r * 2.6, m, x, y0 + h - 0.014, z);
  }
}

function townHall(lvl) {
  const b = new MB();
  const R = rng(1001 + lvl);
  b.hexPad(0.86, 0.014, M.paving);
  const y0 = 0.014;
  // lawns either side of the entrance walk
  for (const s of [-1, 1]) {
    b.box(0.26, 0.012, 0.2, M.grass, s * 0.29, y0, 0.47);
    b.box(0.27, 0.02, 0.012, M.curb, s * 0.29, y0, 0.57);
  }
  // main block: stone plinth, three storeys, cornice, balustraded flat roof
  const W = 0.84, D = 0.44, zc = -0.02, H = 0.8;
  b.box(W + 0.02, 0.07, D + 0.02, M.concreteLight, 0, y0, zc, { bevel: 0.006 });
  b.box(W, H - 0.07, D, M.wall1, 0, y0 + 0.07, zc);
  for (const s of [-1, 1]) b.box(0.05, H - 0.07, D + 0.012, M.wall2, s * (W / 2 - 0.02), y0 + 0.07, zc); // corner quoins
  b.box(W + 0.035, 0.03, D + 0.035, M.wall1, 0, y0 + H, zc, { bevel: 0.006 });
  b.box(W - 0.02, 0.01, D - 0.02, M.gravel, 0, y0 + H + 0.03, zc);
  for (const s of [-1, 1]) {
    b.box(W + 0.035, 0.045, 0.02, M.wall1, 0, y0 + H + 0.03, zc + s * (D / 2 + 0.008));
    b.box(0.02, 0.045, D + 0.035, M.wall1, s * (W / 2 + 0.008), y0 + H + 0.03, zc);
  }
  b.box(W + 0.006, 0.012, D + 0.006, M.wall1, 0, y0 + 0.33, zc); // string course
  // tall windows, three floors, all sides (front centre left for the portico)
  for (let f = 0; f < 3; f++) {
    const y = y0 + 0.07 + f * 0.24 + 0.12;
    for (const [ry, len, dist] of [[0, W, D / 2], [Math.PI, W, D / 2], [Math.PI / 2, D, W / 2], [-Math.PI / 2, D, W / 2]]) {
      const n = ry === 0 || ry === Math.PI ? 7 : 3;
      const span = len - 0.16;
      for (let i = 0; i < n; i++) {
        const lx = -span / 2 + (i / (n - 1)) * span;
        if (ry === 0 && Math.abs(lx) < 0.12 && f < 2) continue;
        const px = Math.sin(ry) * (dist + 0.004) + Math.cos(ry) * lx, pz = zc + Math.cos(ry) * (dist + 0.004) - Math.sin(ry) * lx;
        b.quad(0.055, 0.13, winMat(Math.floor(R() * 64), R() < 0.75), px, y, pz, ry);
        b.quad(0.07, 0.012, M.wall1, px + Math.sin(ry) * 0.001, y + 0.075, pz + Math.cos(ry) * 0.001, ry);
      }
    }
  }
  // portico: four columns, entablature, pediment, steps, door
  const pz = zc + D / 2 + 0.07;
  b.box(0.36, 0.035, 0.16, M.concreteLight, 0, y0, pz - 0.01);
  for (let k = 0; k < 3; k++) b.box(0.3 - k * 0.02, 0.012, 0.06, M.concreteLight, 0, y0, pz + 0.08 + k * 0.03 - 0.03);
  columns(b, 4, -0.13, 0.13, pz + 0.04, y0 + 0.035, 0.42, 0.018, M.wall1);
  b.box(0.34, 0.05, 0.14, M.wall1, 0, y0 + 0.455, pz - 0.0);
  b.gable(0.15, 0.36, 0.08, M.wall1, 0, y0 + 0.505, pz, { ry: Math.PI / 2 });
  b.quad(0.1, 0.16, mt(0x4a3a2c, 0.6), 0, y0 + 0.115, zc + D / 2 + 0.003, 0);
  b.quad(0.04, 0.03, M.lamp, -0.08, y0 + 0.2, zc + D / 2 + 0.004, 0);
  b.quad(0.04, 0.03, M.lamp, 0.08, y0 + 0.2, zc + D / 2 + 0.004, 0);
  // rooftop gun nest (the HQ weapon pivots at HQ_HEAD_Y)
  b.cyl(0.15, 0.15, 0.02, 12, M.concreteDark, 0, y0 + H + 0.03, 0);
  sandbags(b, 0.15, y0 + H + 0.05, 1, 10, Math.PI, 0.8);
  // clock tower behind
  const tz = -0.43, TH = 1.26;
  b.box(0.2, TH, 0.2, M.wall1, 0, y0, tz, { bevel: 0.008 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.box(0.03, TH, 0.03, M.wall2, sx * 0.09, y0, tz + sz * 0.09);
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, ox = Math.sin(a) * 0.104, oz = Math.cos(a) * 0.104;
    b.cyl(0.062, 0.062, 0.008, 14, mt(0xf3efe2, 0.5, 0, EMI.night(1.2)), ox, y0 + 1.08, tz + oz, { rx: Math.PI / 2, ry: a });
    b.cbox(0.006, 0.05, 0.004, M.black, ox * 1.04, y0 + 1.095, tz + oz * 1.04, { ry: a });
    b.cbox(0.035, 0.006, 0.004, M.black, ox * 1.04 + Math.cos(a) * 0.012, y0 + 1.08, tz + oz * 1.04 - Math.sin(a) * 0.012, { ry: a });
    for (let f = 0; f < 3; f++) b.quad(0.03, 0.07, winMat(Math.floor(R() * 64), R() < 0.4), ox * 1.02, y0 + 0.92 - f * 0.25 + (f === 0 ? -0.05 : 0), tz + oz * 1.02, a);
  }
  // belfry
  const by = y0 + TH;
  b.box(0.22, 0.02, 0.22, M.wall2, 0, by, tz);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.box(0.035, 0.14, 0.035, M.wall1, sx * 0.085, by + 0.02, tz + sz * 0.085);
  b.box(0.12, 0.13, 0.12, mt(0x2a2622, 0.9), 0, by + 0.02, tz);
  b.box(0.23, 0.02, 0.23, M.wall2, 0, by + 0.16, tz);
  if (lvl >= 3) {
    b.cyl(0.08, 0.09, 0.06, 12, M.wall1, 0, by + 0.18, tz);
    b.dome(0.085, mt(0x6f9c8c, 0.55, 0.3), 0, by + 0.24, tz, 14, 5);
    b.cyl(0.02, 0.02, 0.06, 6, M.markingY, 0, by + 0.32, tz);
    flagpole(b, 0, tz, 0.22, M.friendly, by + 0.38);
  } else {
    b.hip(0.22, 0.22, 0.2, M.slate, 0, by + 0.18, tz);
    flagpole(b, 0, tz, 0.2, M.friendly, by + 0.36);
  }
  if (lvl >= 2) {
    // side wings with slate hip roofs
    const wf = lvl >= 3 ? 3 : 2, wh = 0.07 + wf * 0.22;
    for (const s of [-1, 1]) {
      const wx = s * 0.6, ww = 0.34, wd = 0.36;
      b.box(ww, 0.06, wd + 0.01, M.concreteLight, wx, y0, zc - 0.02);
      b.box(ww, wh - 0.06, wd, M.wall1, wx, y0 + 0.06, zc - 0.02);
      b.box(ww + 0.02, 0.02, wd + 0.02, M.wall1, wx, y0 + wh, zc - 0.02);
      b.hip(ww + 0.02, wd + 0.02, 0.13, M.slate, wx, y0 + wh + 0.02, zc - 0.02);
      boxWindows(b, wx, zc - 0.02, ww, wd, y0 + 0.06, wf, R, { storey: 0.22, wh: 0.11, ww: 0.05, pitch: 0.1, sides: [0, 1, 2, 3].filter((k) => k !== (s > 0 ? 3 : 1)) });
    }
  }
  // flags and lamps along the front
  const nf = lvl >= 3 ? 3 : lvl >= 2 ? 2 : 1;
  for (let k = 0; k < nf; k++) {
    const x = nf === 1 ? 0.42 : -0.42 + (k / (nf - 1)) * 0.84;
    flagpole(b, x === 0 ? 0.42 : x, 0.66 - Math.abs(x) * 0.3, 0.42, k % 2 ? mt(0xece6da, 0.8) : M.friendly, y0);
  }
  lampPost(b, -0.2, 0.62, 0.4, y0); lampPost(b, 0.2, 0.62, 0.4, y0);
  if (lvl >= 3) {
    // forecourt fountain
    b.lathe([[0, 0.0], [0.11, 0.0], [0.11, 0.04], [0.095, 0.04], [0.095, 0.02], [0, 0.02]], 16, M.concreteLight, 0, y0, 0.6);
    b.cyl(0.095, 0.095, 0.004, 16, M.water, 0, y0 + 0.03, 0.6);
    b.cyl(0.012, 0.018, 0.09, 8, M.concreteLight, 0, y0, 0.6);
    b.cone(0.03, 0.05, 6, mt(0xdff3f6, 0.1, 0, EMI.nav(1.0)), 0, y0 + 0.09, 0.6);
  }
  return b;
}

function hqHead() {
  const b = mgHead(2, -0.066);
  return b;
}

// ------------------------------------------------------------------ services

function fireStation() {
  const b = new MB();
  const R = rng(2001), y0 = 0.014;
  b.hexPad(0.86, y0, M.paving);
  // apron with yellow keep-clear hatching
  b.box(0.7, 0.004, 0.36, M.concrete, -0.04, y0, 0.42);
  for (let k = 0; k < 9; k++) b.box(0.012, 0.002, 0.2, M.markingY, -0.36 + k * 0.08, y0 + 0.004, 0.52, { ry: 0.6 });
  // two-storey brick station, cream trims
  const W = 0.74, D = 0.46, zc = -0.04, H = 0.56;
  b.box(W, H, D, M.brick, -0.04, y0, zc);
  b.box(W + 0.02, 0.03, D + 0.02, M.cream, -0.04, y0 + H, zc);
  b.box(W - 0.02, 0.01, D - 0.02, M.gravel, -0.04, y0 + H + 0.03, zc);
  b.box(W + 0.006, 0.05, D + 0.006, M.cream, -0.04, y0 + 0.27, zc);
  // three engine bays
  for (let k = 0; k < 3; k++) {
    const x = -0.28 + k * 0.22;
    b.box(0.19, 0.25, 0.01, M.cream, x, y0, zc + D / 2 + 0.001);
    b.quad(0.16, 0.22, mt(PAL.fireRed, 0.45, 0.2), x, y0 + 0.11, zc + D / 2 + 0.008, 0);
    for (let s = 0; s < 6; s++) b.quad(0.16, 0.004, mt(0x8e2620, 0.5), x, y0 + 0.02 + s * 0.036, zc + D / 2 + 0.009, 0);
    b.quad(0.12, 0.03, winMat(Math.floor(R() * 64), true), x, y0 + 0.19, zc + D / 2 + 0.01, 0);
    b.box(0.03, 0.015, 0.02, M.lamp, x, y0 + 0.255, zc + D / 2 + 0.01);
  }
  // upper floor windows and side windows
  windows(b, -0.04, y0 + 0.42, zc + D / 2 + 0.004, 0, 5, 0.56, 0.07, 0.1, R, 0.7);
  windows(b, -0.04, y0 + 0.42, zc - D / 2 - 0.004, Math.PI, 5, 0.56, 0.07, 0.1, R, 0.5);
  windows(b, -0.04 + W / 2 + 0.004, y0 + 0.42, zc, Math.PI / 2, 3, 0.3, 0.07, 0.1, R, 0.6);
  windows(b, -0.04 + W / 2 + 0.004, y0 + 0.15, zc, Math.PI / 2, 3, 0.3, 0.07, 0.1, R, 0.6);
  // sign band with red/white stripe
  b.box(0.42, 0.04, 0.008, M.white, -0.06, y0 + 0.3, zc + D / 2 + 0.008);
  b.box(0.42, 0.012, 0.01, M.fireRed, -0.06, y0 + 0.314, zc + D / 2 + 0.009);
  // hose-drying tower with louvres
  const tx = 0.43, tz = -0.18;
  b.box(0.18, 1.0, 0.18, M.brick, tx, y0, tz);
  b.box(0.2, 0.03, 0.2, M.cream, tx, y0 + 1.0, tz);
  for (let f = 0; f < 3; f++) for (const ry of [0, Math.PI / 2]) b.quad(0.04, 0.12, winMat(Math.floor(R() * 64), R() < 0.4), tx + Math.sin(ry) * 0.094, y0 + 0.5 + f * 0.17, tz + Math.cos(ry) * 0.094, ry);
  b.box(0.012, 0.012, 0.012, M.beacon, tx, y0 + 1.03, tz);
  acUnit(b, -0.25, y0 + H + 0.04, -0.12); acUnit(b, 0.1, y0 + H + 0.04, -0.14);
  flagpole(b, 0.42, 0.42, 0.45, M.fireRed, y0);
  // hydrant
  b.cyl(0.012, 0.014, 0.04, 6, M.fireRed, 0.33, y0, 0.3);
  return b;
}

// low-detail parked car baked into structure models (police station, clinic car parks)
function parkedCar(b, x, z, ry, body, roofLight) {
  b.push(x, 0.014, z, ry);
  b.box(0.15, 0.04, 0.34, body, 0, 0.018, 0, { bevel: 0.012 });
  b.tbox(0.14, 0.18, 0.12, 0.12, 0.04, M.glassCar, 0, 0.058, -0.02);
  b.box(0.12, 0.006, 0.12, body, 0, 0.098, -0.02);
  for (const zz of [-0.11, 0.11]) b.rod(-0.075, 0.022, zz, 0.075, 0.022, zz, 0.022, 6, M.rubber);
  if (roofLight) { b.box(0.03, 0.012, 0.035, M.flashB, -0.02, 0.104, -0.02); b.box(0.03, 0.012, 0.035, M.flashR, 0.02, 0.104, -0.02); }
  b.pop();
}

function policeStation() {
  const b = new MB();
  const R = rng(2101), y0 = 0.014;
  b.hexPad(0.86, y0, M.paving);
  // car park
  b.box(0.42, 0.004, 0.36, M.asphalt, 0.32, y0, 0.32);
  for (let k = 0; k < 3; k++) b.box(0.006, 0.002, 0.16, M.marking, 0.16 + k * 0.15, y0 + 0.004, 0.4);
  parkedCar(b, 0.24, 0.4, 0, M.white, true);
  parkedCar(b, 0.39, 0.4, 0, M.white, true);
  // three-storey modern block: blue-grey cladding, white floor bands, glazed ground floor
  const W = 0.6, D = 0.4, x0 = -0.14, zc = -0.12, H = 0.78;
  b.box(W, 0.25, D, M.wall1, x0, y0, zc);
  b.box(W, H - 0.25, D, M.wall6, x0, y0 + 0.25, zc, { bevel: 0.006 });
  for (let f = 1; f <= 3; f++) b.box(W + 0.012, 0.018, D + 0.012, M.white, x0, y0 + f * 0.25 - 0.009, zc);
  b.box(W - 0.03, 0.01, D - 0.03, M.gravel, x0, y0 + H, zc);
  ribbon(b, x0, zc, W, D, y0, 1, R, { bh: 0.16, bay: 0.15, yo: 0.1, lit: 0.9 });
  ribbon(b, x0, zc, W, D, y0 + 0.25, 2, R, { bh: 0.11, bay: 0.12, lit: 0.65 });
  // blue band and lit sign over the entrance
  b.box(W + 0.014, 0.03, D + 0.014, M.policeBlue, x0, y0 + 0.21, zc);
  b.box(0.22, 0.05, 0.012, mt(0x1c2c50, 0.4), x0, y0 + 0.255, zc + D / 2 + 0.006);
  b.box(0.18, 0.016, 0.004, mt(0xffffff, 0.4, 0, EMI.nav(3)), x0, y0 + 0.272, zc + D / 2 + 0.013);
  b.box(0.14, 0.012, 0.1, M.wall1, x0, y0 + 0.2, zc + D / 2 + 0.05);
  b.box(0.022, 0.03, 0.022, mt(PAL.lBlue, 0.3, 0, EMI.nav(5)), x0 + 0.09, y0 + 0.17, zc + D / 2 + 0.03);
  // roof: comms mast with beacon, AC plant
  mast(b, x0 - 0.2, zc - 0.1, 0.5, y0 + H);
  acUnit(b, x0 + 0.1, y0 + H + 0.01, zc - 0.05); acUnit(b, x0 + 0.18, y0 + H + 0.01, zc - 0.08);
  b.box(0.14, 0.06, 0.1, M.wall8, x0 - 0.05, y0 + H + 0.01, zc + 0.05);
  // fence and flag
  for (let k = 0; k < 7; k++) b.box(0.006, 0.07, 0.006, M.darkSteel, 0.56, y0, 0.1 + k * 0.07);
  b.box(0.004, 0.006, 0.44, M.darkSteel, 0.56, y0 + 0.065, 0.31);
  flagpole(b, -0.48, 0.38, 0.45, M.policeBlue, y0);
  return b;
}

function greenCross(b, x, y, z, ry, s = 1) {
  const g = mt(0x2fa05a, 0.4, 0, EMI.nav(4)), w = mt(0xf5f5f0, 0.5);
  b.push(x, y, z, ry, 0, 0, s);
  b.box(0.1, 0.1, 0.01, w, 0, -0.05, 0);
  b.box(0.07, 0.022, 0.012, g, 0, -0.011, 0);
  b.box(0.022, 0.07, 0.012, g, 0, -0.035, 0);
  b.pop();
}

function clinic() {
  const b = new MB();
  const R = rng(2201), y0 = 0.014;
  b.hexPad(0.86, y0, M.paving);
  b.box(0.3, 0.012, 0.6, M.grass, -0.48, y0, 0.05);
  // two-storey L-shaped white rendered block with a timber-clad wing
  b.box(0.62, 0.5, 0.3, M.wall1, 0.06, y0, -0.2, { bevel: 0.006 });
  b.box(0.26, 0.26, 0.3, mt(0x9b7a58, 0.85), -0.25, y0, 0.12);
  b.box(0.64, 0.02, 0.32, M.wall8, 0.06, y0 + 0.5, -0.2);
  b.box(0.28, 0.02, 0.32, M.wall8, -0.25, y0 + 0.26, 0.12);
  ribbon(b, 0.06, -0.2, 0.62, 0.3, y0, 2, R, { bh: 0.1, bay: 0.15, lit: 0.6 });
  ribbon(b, -0.25, 0.12, 0.26, 0.3, y0, 1, R, { bh: 0.1, bay: 0.13, sides: [0, 3], lit: 0.7 });
  // entrance canopy and sign
  b.box(0.3, 0.02, 0.18, M.white, 0.18, y0 + 0.2, 0.03);
  for (const s of [-1, 1]) b.cyl(0.008, 0.008, 0.2, 5, M.steel, 0.18 + s * 0.13, y0, 0.11);
  b.quad(0.16, 0.18, winMat(9, true), 0.18, y0 + 0.09, -0.046, 0);
  greenCross(b, 0.18, y0 + 0.44, -0.04, 0);
  greenCross(b, 0.375, y0 + 0.44, -0.2, Math.PI / 2, 0.9);
  // ambulance bay
  b.box(0.3, 0.004, 0.3, M.asphalt, 0.34, y0, 0.4);
  b.box(0.24, 0.002, 0.006, M.markingY, 0.34, y0 + 0.004, 0.26);
  ambulanceSmall(b, 0.34, 0.42, 0.3);
  acUnit(b, -0.05, y0 + 0.52, -0.22);
  tree(b, -0.5, 0.35, 0.9, y0, 1); tree(b, -0.5, -0.12, 0.8, y0, 2);
  bench(b, -0.35, 0.42, Math.PI / 2, y0);
  return b;
}

function ambulanceSmall(b, x, z, ry) {
  b.push(x, 0.014, z, ry);
  b.box(0.15, 0.05, 0.3, M.white, 0, 0.018, 0.02, { bevel: 0.01 });
  b.box(0.15, 0.1, 0.2, M.white, 0, 0.068, -0.03, { bevel: 0.01 });
  b.box(0.152, 0.02, 0.2, mt(0x2fa05a, 0.5), 0, 0.09, -0.03);
  b.tbox(0.14, 0.08, 0.13, 0.05, 0.05, M.glassCar, 0, 0.068, 0.11);
  b.box(0.03, 0.012, 0.03, M.flashB, -0.04, 0.168, 0.05); b.box(0.03, 0.012, 0.03, M.flashB, 0.04, 0.168, 0.05);
  for (const zz of [-0.09, 0.1]) b.rod(-0.075, 0.022, zz, 0.075, 0.022, zz, 0.022, 6, M.rubber);
  b.pop();
}

function hospital() {
  const b = new MB();
  const R = rng(2301), y0 = 0.014;
  b.hexPad(0.86, y0, M.paving);
  // two-storey podium
  b.box(0.92, 0.48, 0.5, M.wall1, 0, y0, -0.1, { bevel: 0.006 });
  b.box(0.94, 0.02, 0.52, M.wall8, 0, y0 + 0.48, -0.1);
  ribbon(b, 0, -0.1, 0.92, 0.5, y0, 2, R, { bh: 0.1, bay: 0.15, storey: 0.24, lit: 0.7 });
  // five-storey ward tower
  const tx = -0.08, tz = -0.18, TW = 0.58, TD = 0.28, TH = 1.25;
  b.box(TW, TH - 0.48, TD, M.wall6, tx, y0 + 0.5, tz, { bevel: 0.008 });
  for (let f = 0; f < 4; f++) b.box(TW + 0.012, 0.022, TD + 0.012, M.white, tx, y0 + 0.5 + f * 0.19 + 0.17, tz);
  ribbon(b, tx, tz, TW, TD, y0 + 0.5, 4, R, { bh: 0.1, bay: 0.12, storey: 0.19, yo: 0.09, lit: 0.75 });
  b.box(TW + 0.02, 0.02, TD + 0.02, M.wall8, tx, y0 + TH + 0.02, tz);
  // rooftop helipad: dark deck, H, perimeter lights
  const hy = y0 + TH + 0.04;
  b.cyl(0.13, 0.13, 0.012, 16, mt(0x3d4146, 0.85), tx, hy, tz);
  b.lathe([[0.122, 0.013], [0.112, 0.013]], 16, M.marking, tx, hy, tz);
  b.box(0.012, 0.004, 0.09, M.marking, tx - 0.03, hy + 0.012, tz);
  b.box(0.012, 0.004, 0.09, M.marking, tx + 0.03, hy + 0.012, tz);
  b.box(0.06, 0.004, 0.012, M.marking, tx, hy + 0.012, tz);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; b.box(0.008, 0.01, 0.008, mt(0x9ce88f, 0.4, 0, EMI.nav(5)), tx + Math.sin(a) * 0.125, hy + 0.012, tz + Math.cos(a) * 0.125); }
  // plant room and lift overrun on the podium roof
  b.box(0.16, 0.1, 0.12, M.wall8, 0.34, y0 + 0.5, -0.22);
  acUnit(b, 0.3, y0 + 0.5, 0.03); acUnit(b, 0.4, y0 + 0.5, 0.03);
  // emergency entrance canopy + signs
  b.box(0.36, 0.022, 0.2, M.white, 0.2, y0 + 0.2, 0.25);
  for (const s of [-1, 1]) b.cyl(0.009, 0.009, 0.2, 5, M.steel, 0.2 + s * 0.16, y0, 0.33);
  b.box(0.3, 0.035, 0.01, mt(0xc4302a, 0.4, 0, EMI.nav(3)), 0.2, y0 + 0.225, 0.352);
  greenCross(b, tx, y0 + TH - 0.05, tz + TD / 2 + 0.006, 0, 1.3);
  greenCross(b, tx + TW / 2 + 0.006, y0 + TH - 0.05, tz, Math.PI / 2, 1.3);
  ambulanceSmall(b, 0.42, 0.52, 0.2);
  ambulanceSmall(b, -0.02, 0.52, -0.1);
  b.box(0.7, 0.004, 0.28, M.asphalt, 0.18, y0, 0.48);
  tree(b, -0.55, 0.42, 0.9, y0, 0); tree(b, -0.4, 0.55, 0.75, y0, 1);
  return b;
}

function school() {
  const b = new MB();
  const R = rng(2401), y0 = 0.014;
  b.hexPad(0.86, y0, M.paving);
  // L-shaped two-storey: warm brick classroom wings with terracotta hip roofs
  const wing = (x, z, w, d) => {
    b.box(w, 0.5, d, M.wall3, x, y0, z);
    b.box(w + 0.006, 0.12, d + 0.006, M.brick, x, y0, z);
    b.hip(w + 0.05, d + 0.05, 0.13, M.terracotta, x, y0 + 0.5, z);
    b.box(w + 0.03, 0.012, d + 0.03, M.cream, x, y0 + 0.49, z);
  };
  wing(-0.06, -0.34, 0.86, 0.24);
  wing(-0.36, 0.06, 0.26, 0.56);
  boxWindows(b, -0.06, -0.34, 0.86, 0.24, y0, 2, R, { wh: 0.12, ww: 0.1, pitch: 0.14, sides: [0, 2] });
  boxWindows(b, -0.36, 0.06, 0.26, 0.56, y0, 2, R, { wh: 0.12, ww: 0.1, pitch: 0.14, sides: [1, 3] });
  // glazed entrance hall at the corner
  b.box(0.16, 0.3, 0.16, M.glass, -0.14, y0, -0.12);
  b.box(0.18, 0.02, 0.18, M.white, -0.14, y0 + 0.3, -0.12);
  b.quad(0.12, 0.2, winMat(3, true), -0.14, y0 + 0.13, -0.035, 0);
  // sports court and playground
  b.box(0.5, 0.004, 0.36, mt(0x8a4b3a, 0.85), 0.28, y0, 0.3);
  b.box(0.46, 0.002, 0.004, M.marking, 0.28, y0 + 0.005, 0.3);
  b.lathe([[0.058, 0.005], [0.05, 0.005]], 14, M.marking, 0.28, y0, 0.3);
  for (const s of [-1, 1]) {
    b.box(0.004, 0.002, 0.33, M.marking, 0.28 + s * 0.23, y0 + 0.005, 0.3);
    b.box(0.46, 0.002, 0.004, M.marking, 0.28, y0 + 0.005, 0.3 + s * 0.165);
    b.cyl(0.005, 0.005, 0.14, 4, M.steel, 0.28 + s * 0.25, y0, 0.3);
    b.box(0.006, 0.04, 0.05, M.white, 0.28 + s * 0.24, y0 + 0.12, 0.3);
  }
  flagpole(b, 0.12, -0.08, 0.5, M.friendly, y0);
  tree(b, 0.55, -0.15, 0.9, y0, 0); tree(b, 0.38, -0.05, 0.75, y0, 2);
  bench(b, 0.1, 0.06, 0, y0);
  return b;
}

function warCollege() {
  const b = new MB();
  const R = rng(2501), y0 = 0.014;
  b.hexPad(0.86, y0, M.paving);
  for (const s of [-1, 1]) b.box(0.28, 0.012, 0.24, M.grass, s * 0.3, y0, 0.46);
  // neoclassical academy: rusticated base, three storeys, portico with six columns, central dome
  const W = 0.9, D = 0.42, zc = -0.08, H = 0.72;
  b.box(W, 0.1, D, M.concreteLight, 0, y0, zc);
  b.box(W - 0.01, H - 0.1, D - 0.01, M.wall1, 0, y0 + 0.1, zc);
  b.box(W + 0.03, 0.03, D + 0.03, M.wall2, 0, y0 + H, zc, { bevel: 0.006 });
  b.hip(W + 0.02, D + 0.02, 0.12, M.slate, 0, y0 + H + 0.03, zc);
  for (let f = 0; f < 3; f++) {
    const y = y0 + 0.1 + f * 0.2 + 0.1;
    windows(b, -0.3, y, zc + D / 2 + 0.004, 0, 3, 0.2, 0.05, 0.11, R, 0.7);
    windows(b, 0.3, y, zc + D / 2 + 0.004, 0, 3, 0.2, 0.05, 0.11, R, 0.7);
    windows(b, 0, y, zc - D / 2 - 0.004, Math.PI, 7, 0.76, 0.05, 0.11, R, 0.6);
    windows(b, W / 2 + 0.004, y, zc, Math.PI / 2, 3, 0.26, 0.05, 0.11, R, 0.6);
    windows(b, -W / 2 - 0.004, y, zc, -Math.PI / 2, 3, 0.26, 0.05, 0.11, R, 0.6);
  }
  const pz = zc + D / 2 + 0.08;
  b.box(0.42, 0.05, 0.18, M.concreteLight, 0, y0, pz - 0.02);
  for (let k = 0; k < 3; k++) b.box(0.38 - k * 0.02, 0.016, 0.05, M.concreteLight, 0, y0, pz + 0.08 + k * 0.025 - 0.02);
  columns(b, 6, -0.17, 0.17, pz + 0.03, y0 + 0.05, 0.54, 0.02, M.wall1);
  b.box(0.42, 0.05, 0.16, M.wall2, 0, y0 + 0.59, pz - 0.01);
  b.gable(0.17, 0.44, 0.1, M.wall1, 0, y0 + 0.64, pz - 0.01, { ry: Math.PI / 2 });
  b.quad(0.1, 0.18, mt(0x3d3026, 0.6), 0, y0 + 0.14, zc + D / 2 + 0.004, 0);
  // drum and dome
  b.cyl(0.13, 0.13, 0.14, 16, M.wall1, 0, y0 + H + 0.08, zc);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; b.quad(0.03, 0.07, winMat(Math.floor(R() * 64), R() < 0.6), Math.sin(a) * 0.132, y0 + H + 0.15, zc + Math.cos(a) * 0.132, a); }
  b.box(0.29, 0.02, 0.29, M.wall2, 0, y0 + H + 0.06, zc);
  b.dome(0.14, mt(0x6f9c8c, 0.55, 0.3), 0, y0 + H + 0.22, zc, 16, 6);
  b.cyl(0.025, 0.03, 0.06, 8, M.wall1, 0, y0 + H + 0.35, zc);
  b.cone(0.03, 0.05, 8, M.markingY, 0, y0 + H + 0.41, zc);
  // flags and lamps
  flagpole(b, -0.36, 0.4, 0.5, M.friendly, y0);
  flagpole(b, 0.36, 0.4, 0.5, mt(0x2b3a52, 0.8), y0);
  lampPost(b, -0.15, 0.52, 0.38, y0); lampPost(b, 0.15, 0.52, 0.38, y0);
  // field gun on display
  b.box(0.06, 0.04, 0.06, M.concreteLight, 0, y0, 0.6);
  b.rod(0, y0 + 0.06, 0.58, 0, y0 + 0.08, 0.7, 0.012, 6, M.olive);
  b.box(0.05, 0.03, 0.06, M.olive, 0, y0 + 0.04, 0.58);
  return b;
}

// ------------------------------------------------------------------ parks

function park() {
  const b = new MB();
  const y0 = 0.014;
  b.hexPad(0.86, y0, M.grass);
  // curved gravel paths: a ring and two spokes
  b.lathe([[0.44, 0.003], [0.36, 0.003]], 24, mt(0xc9bb98, 0.95), 0, y0, 0);
  b.box(0.08, 0.004, 0.5, mt(0xc9bb98, 0.95), 0, y0, 0.62);
  b.box(0.5, 0.004, 0.08, mt(0xc9bb98, 0.95), -0.62, y0, 0);
  // pond with a stone rim and a small jetty
  b.lathe([[0.26, 0.0], [0.25, 0.028], [0.22, 0.028], [0.22, 0.01]], 18, M.concreteLight, 0.04, y0, -0.04);
  b.cyl(0.22, 0.22, 0.016, 18, M.water, 0.04, y0, -0.04);
  b.box(0.04, 0.012, 0.14, M.wood, 0.2, y0 + 0.014, 0.1);
  // trees, hedges, benches, lamps
  const T = [[-0.48, 0.38, 1.1, 0], [-0.55, -0.3, 1.0, 1], [0.5, 0.38, 0.95, 2], [0.52, -0.32, 1.15, 0], [0.0, 0.62, 0.8, 1], [-0.12, -0.58, 0.9, 2], [0.28, -0.58, 0.8, 0]];
  for (const [x, z, s, t] of T) tree(b, x, z, s, y0, t);
  for (const [x, z, r] of [[0.32, 0.34, 0.6], [-0.3, -0.42, 2.2], [-0.32, 0.32, -0.7]]) b.box(0.22, 0.05, 0.05, M.hedge, x, y0, z, { ry: r, bevel: 0.015 });
  bench(b, 0.3, 0.18, -Math.PI / 2 - 0.5, y0); bench(b, -0.26, 0.16, Math.PI / 2 + 0.4, y0); bench(b, 0.08, -0.38, Math.PI, y0);
  lampPost(b, 0.4, 0.05, 0.38, y0); lampPost(b, -0.38, -0.1, 0.38, y0); lampPost(b, 0.06, 0.4, 0.38, y0);
  // flower beds
  for (const [x, z, c] of [[0.42, 0.5, 0xc0503e], [-0.22, 0.52, 0xd9b84a], [0.55, 0.02, 0xb85a8a]]) {
    b.cyl(0.07, 0.07, 0.025, 8, M.dirt, x, y0, z);
    b.cyl(0.06, 0.055, 0.02, 8, mt(c, 0.9), x, y0 + 0.02, z);
  }
  return b;
}

function plaza() {
  const b = new MB();
  const R = rng(2601), y0 = 0.014;
  b.hexPad(0.86, y0, mt(0xb3ab9c, 0.9));
  // paving pattern: concentric bands and radial joints
  b.lathe([[0.34, 0.003], [0.3, 0.003]], 24, mt(0x8f877a, 0.9), 0, y0, 0);
  b.lathe([[0.6, 0.003], [0.56, 0.003]], 24, mt(0x8f877a, 0.9), 0, y0, 0);
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; b.box(0.008, 0.003, 0.22, mt(0x8f877a, 0.9), Math.sin(a) * 0.45, y0, Math.cos(a) * 0.45, { ry: a }); }
  // fountain: stepped basin, water, central column with jets
  b.lathe([[0, 0], [0.26, 0], [0.26, 0.05], [0.235, 0.05], [0.235, 0.025], [0, 0.025]], 24, M.concreteLight, 0, y0, 0);
  b.cyl(0.235, 0.235, 0.008, 24, M.water, 0, y0 + 0.032, 0);
  b.cyl(0.03, 0.045, 0.14, 10, M.concreteLight, 0, y0, 0);
  b.lathe([[0.0, 0.0], [0.09, 0.0], [0.09, 0.02], [0.0, 0.02]], 12, M.concreteLight, 0, y0 + 0.14, 0);
  b.cyl(0.085, 0.085, 0.005, 12, M.water, 0, y0 + 0.155, 0);
  const jet = mt(0xe6f6fa, 0.1, 0, EMI.nav(1.2));
  b.cone(0.025, 0.12, 8, jet, 0, y0 + 0.16, 0);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; b.rod(Math.sin(a) * 0.08, y0 + 0.16, Math.cos(a) * 0.08, Math.sin(a) * 0.18, y0 + 0.04, Math.cos(a) * 0.18, 0.006, 3, jet, 0.002); }
  // planters with small trees, benches, kiosk with awning, lamps
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3 + Math.PI / 6;
    const x = Math.sin(a) * 0.48, z = Math.cos(a) * 0.48;
    if (k === 1) continue;
    b.box(0.12, 0.05, 0.12, M.concreteLight, x, y0, z, { ry: a, bevel: 0.008 });
    b.box(0.1, 0.006, 0.1, M.dirt, x, y0 + 0.05, z, { ry: a });
    tree(b, x, z, 0.7, y0 + 0.05, k % 3);
    bench(b, Math.sin(a + 0.35) * 0.38, Math.cos(a + 0.35) * 0.38, a + Math.PI, y0);
  }
  const kx = Math.sin(Math.PI / 2) * 0.5, kz = 0.0;
  b.box(0.14, 0.12, 0.1, M.wall4, kx, y0, kz, { bevel: 0.008 });
  b.tbox(0.18, 0.14, 0.15, 0.11, 0.03, mt(0x2f6b5a, 0.7), kx, y0 + 0.12, kz);
  b.quad(0.1, 0.05, winMat(21, true), kx - 0.071, y0 + 0.07, kz, -Math.PI / 2);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; lampPost(b, Math.sin(a) * 0.66, Math.cos(a) * 0.66, 0.4, y0); }
  return b;
}

// ------------------------------------------------------------------ utilities

export const WIND_HUB_Y = 1.95, WIND_HUB_Z = 0.15;

function windTower() {
  const b = new MB();
  const y0 = 0.014;
  b.cyl(0.2, 0.22, y0 + 0.03, 12, M.concrete, 0, 0, 0);
  // tapered tubular tower with a grey foot band
  b.lathe([[0.068, y0 + 0.03], [0.054, 0.9], [0.038, WIND_HUB_Y - 0.05]], 12, M.white);
  b.lathe([[0.077, y0 + 0.03], [0.074, 0.2]], 12, M.wall8);
  b.box(0.035, 0.07, 0.006, M.darkSteel, 0, y0 + 0.03, 0.074);
  // nacelle + hub mount
  b.box(0.09, 0.09, 0.28, M.white, 0, WIND_HUB_Y - 0.05, -0.05, { bevel: 0.022 });
  b.box(0.06, 0.02, 0.1, M.wall8, 0, WIND_HUB_Y + 0.04, -0.12);
  b.box(0.014, 0.014, 0.014, M.beacon, 0, WIND_HUB_Y + 0.06, -0.16);
  // transformer kiosk
  b.box(0.1, 0.08, 0.07, M.wall5, 0.22, 0.0, 0.1, { bevel: 0.006 });
  b.quad(0.05, 0.04, mt(0xd8c84a, 0.6), 0.22, 0.05, 0.1355, 0);
  return b;
}

// rotor: hub at the origin, blades in the xy plane, spin axis +z
function windRotor() {
  const b = new MB();
  b.lathe([[0.05, -0.04], [0.055, 0.0], [0.05, 0.03], [0.03, 0.08], [0.0, 0.1]], 10, M.white, 0, 0, 0, { rx: Math.PI / 2 });
  for (let k = 0; k < 3; k++) {
    const a = k * 2.0944;
    b.push(0, 0, 0.01, 0, 0, a);
    // tapered, slightly twisted blade along +y
    b.tbox(0.066, 0.016, 0.02, 0.007, 0.8, M.white, 0, 0.03, 0, { xs: 0.01 });
    b.tbox(0.024, 0.009, 0.02, 0.007, 0.05, mt(0xb8382c, 0.6), 0.01, 0.825, 0, { xs: 0.0 });
    b.pop();
  }
  return b;
}

function gasPlant() {
  const b = new MB();
  const R = rng(3001), y0 = 0.014;
  b.hexPad(0.86, y0, M.concrete);
  // turbine hall: sheet-metal shed with red-oxide trims and a clerestory
  const hx = -0.12, hz = 0.2;
  b.box(0.74, 0.42, 0.36, M.shed, hx, y0, hz);
  b.gable(0.76, 0.38, 0.08, M.sheet, hx, y0 + 0.42, hz);
  b.box(0.75, 0.04, 0.365, M.redOxide, hx, y0, hz);
  for (let k = 0; k < 7; k++) b.box(0.012, 0.42, 0.366, mt(0x8f9496, 0.5, 0.4), hx - 0.36 + k * 0.12, y0, hz);
  ribbon(b, hx, hz, 0.74, 0.36, y0, 1, R, { bh: 0.05, bay: 0.12, yo: 0.34, lit: 0.85, sides: [0, 2] });
  b.box(0.16, 0.2, 0.01, M.redOxide, hx + 0.2, y0, hz + 0.181);
  // heat-recovery boiler blocks feeding the stacks
  for (const s of [-1, 1]) {
    const bx = 0.12 + s * 0.13, bz = -0.18;
    b.box(0.2, 0.5, 0.22, M.wall8, bx, y0, bz);
    b.box(0.21, 0.02, 0.23, M.redOxide, bx, y0 + 0.5, bz);
    for (let f = 0; f < 3; f++) b.box(0.212, 0.008, 0.232, M.darkSteel, bx, y0 + 0.12 + f * 0.13, bz);
    b.rod(bx, y0 + 0.36, bz - 0.11, bx, y0 + 0.36, bz - 0.24, 0.04, 8, M.steel);
  }
  // twin stacks with red/white bands and aircraft warning beacons
  for (const s of [-1, 1]) {
    const sx = 0.12 + s * 0.13, sz = -0.42, H = 2.2;
    b.lathe([[0.075, y0], [0.06, H]], 12, M.concreteLight, sx, 0, sz);
    for (let k = 0; k < 3; k++) {
      const yb = H - 0.12 - k * 0.24;
      const r = 0.075 - (0.015 * yb) / H;
      b.cyl(r + 0.002, r + 0.003, 0.12, 12, k % 2 ? M.bandWhite : M.bandRed, sx, yb, sz);
    }
    b.cyl(0.063, 0.063, 0.02, 12, M.darkSteel, sx, H, sz);
    b.lathe([[0.05, H + 0.02], [0.05, H - 0.02]], 10, M.black, sx, 0, sz);
    b.box(0.014, 0.014, 0.014, M.beacon, sx + 0.064, H - 0.03, sz);
    b.box(0.014, 0.014, 0.014, M.beacon, sx - 0.064, H * 0.55, sz);
    b.cyl(0.072, 0.072, 0.01, 12, M.darkSteel, sx, H * 0.55, sz);
  }
  // gas receiver bullet tank, fin-fan coolers, transformer yard
  b.rod(-0.58, y0 + 0.08, -0.4, -0.58, y0 + 0.08, -0.08, 0.075, 12, M.white);
  b.ball(0.075, M.white, -0.58, y0 + 0.08, -0.4, 10, 6); b.ball(0.075, M.white, -0.58, y0 + 0.08, -0.08, 10, 6);
  for (const z of [-0.33, -0.15]) { b.box(0.04, 0.05, 0.03, M.darkSteel, -0.58, y0, z); }
  for (let k = 0; k < 3; k++) {
    const fx = 0.5, fz = 0.32 - k * 0.15;
    b.box(0.2, 0.08, 0.13, M.darkSteel, fx, y0 + 0.04, fz);
    for (const d of [-1, 1]) b.cyl(0.04, 0.04, 0.006, 10, M.gunmetal, fx + d * 0.05, y0 + 0.12, fz);
    for (const d of [-1, 1]) for (const e of [-1, 1]) b.box(0.012, 0.04, 0.012, M.steel, fx + d * 0.09, y0, fz + e * 0.055);
  }
  for (let k = 0; k < 2; k++) {
    const tx = 0.55, tz = -0.25 + k * 0.17;
    b.box(0.1, 0.1, 0.08, M.gunmetal, tx, y0, tz);
    for (let f = 0; f < 4; f++) b.box(0.006, 0.07, 0.09, M.darkSteel, tx - 0.04 + f * 0.027, y0 + 0.02, tz);
    for (let i = 0; i < 3; i++) b.cyl(0.008, 0.01, 0.05, 5, mt(0x9a8a6a, 0.6), tx - 0.03 + i * 0.03, y0 + 0.1, tz);
  }
  // pipe rack between tank and hall
  b.rod(-0.5, y0 + 0.16, -0.24, 0.0, y0 + 0.16, -0.24, 0.018, 6, mt(0xd6ae3a, 0.6, 0.3));
  b.rod(-0.5, y0 + 0.2, -0.22, 0.0, y0 + 0.2, -0.22, 0.014, 6, M.steel);
  for (let k = 0; k < 4; k++) b.box(0.01, 0.2, 0.05, M.darkSteel, -0.45 + k * 0.14, y0, -0.23);
  return b;
}

function waterTower() {
  const b = new MB();
  const y0 = 0.014;
  b.hexPad(0.6, y0, M.paving);
  b.cyl(0.24, 0.26, y0 + 0.02, 12, M.concrete, 0, 0, 0);
  // fluted concrete column and spheroid tank
  b.lathe([[0.1, y0 + 0.02], [0.085, 1.0], [0.11, 1.12]], 12, M.concreteLight);
  b.lathe([[0.11, 1.12], [0.26, 1.24], [0.33, 1.36], [0.34, 1.42], [0.31, 1.52], [0.2, 1.6], [0.0, 1.63]], 18, mt(0xa8b5c1, 0.5, 0.3));
  b.cyl(0.345, 0.345, 0.02, 18, M.steel, 0, 1.4, 0);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; b.box(0.006, 0.05, 0.006, M.steel, Math.sin(a) * 0.343, 1.42, Math.cos(a) * 0.343); }
  b.lathe([[0.343, 1.465], [0.347, 1.465], [0.347, 1.47], [0.343, 1.47]], 18, M.steel);
  b.box(0.016, 0.016, 0.016, M.beacon, 0, 1.63, 0);
  b.quad(0.22, 0.06, M.white, 0, 1.38, 0.336, 0, { rx: 0.1 });
  b.quad(0.18, 0.02, mt(0x4fb3ff, 0.4), 0, 1.38, 0.339, 0, { rx: 0.1 });
  // pump house at the foot
  b.box(0.2, 0.14, 0.14, M.wall2, 0.3, y0, 0.2, { bevel: 0.008 });
  b.gable(0.22, 0.16, 0.05, M.terracotta, 0.3, y0 + 0.14, 0.2);
  b.box(0.05, 0.09, 0.006, M.darkSteel, 0.3, y0, 0.272);
  b.rod(0.2, y0 + 0.04, 0.2, 0.08, y0 + 0.04, 0.05, 0.018, 6, mt(0x3d6fa8, 0.5, 0.4));
  return b;
}

function pumpStation() {
  const b = new MB();
  const R = rng(3201), y0 = 0.014;
  b.hexPad(0.86, y0, M.paving);
  // pump hall (concrete with blue trim), sheet roof
  b.box(0.5, 0.32, 0.34, M.concreteLight, -0.12, y0, -0.25, { bevel: 0.008 });
  b.gable(0.54, 0.38, 0.09, M.sheet, -0.12, y0 + 0.32, -0.25);
  b.box(0.505, 0.03, 0.345, mt(0x2f5f9a, 0.6), -0.12, y0 + 0.25, -0.25);
  windows(b, -0.12, y0 + 0.17, -0.25 + 0.174, 0, 4, 0.36, 0.06, 0.08, R, 0.7);
  b.box(0.12, 0.18, 0.01, M.darkSteel, 0.06, y0, -0.25 + 0.171);
  // big intake/delivery pipes running toward the sea side (+z)
  const blue = mt(0x3d6fa8, 0.45, 0.45);
  for (const x of [-0.26, -0.04]) {
    b.rod(x, y0 + 0.07, -0.08, x, y0 + 0.07, 0.75, 0.05, 10, blue);
    for (let k = 0; k < 4; k++) b.box(0.12, 0.05, 0.03, M.concrete, x, y0, 0.0 + k * 0.22);
    b.cyl(0.065, 0.065, 0.025, 10, M.darkSteel, x, y0 + 0.07, 0.3, { rx: Math.PI / 2 });
  }
  // intake head on the shore edge and valve chamber
  b.box(0.42, 0.12, 0.12, M.concrete, -0.15, -0.06, 0.74);
  b.box(0.42, 0.012, 0.13, M.markingY, -0.15, 0.06, 0.74);
  b.box(0.16, 0.06, 0.16, M.concrete, 0.32, y0, 0.12);
  b.cyl(0.02, 0.02, 0.05, 8, M.fireRed, 0.32, y0 + 0.06, 0.12);
  b.cyl(0.05, 0.05, 0.008, 8, M.fireRed, 0.32, y0 + 0.11, 0.12);
  // treatment tanks
  for (const [x, z] of [[0.42, -0.3], [0.5, -0.05]]) {
    b.cyl(0.11, 0.11, 0.12, 14, M.concreteLight, x, y0, z);
    b.cyl(0.095, 0.095, 0.005, 14, M.water, x, y0 + 0.11, z);
  }
  return b;
}

// ------------------------------------------------------------------ hostile ships (y = 0 is the waterline)

const hostilePaint = (bands) => (t, band) => {
  if (band === 'deck') return M.eDeck;
  if (band === 'transom') return M.eHull;
  if (band === 'boot') return M.eRed;
  if (band === 'bottom') return M.eDark;
  for (const [a, c] of bands) if (t > a && t < c) return M.eRed;
  return M.eHull;
};

// faceted gun turret with n barrels along +z, pivot at the turret centre (y = deck)
function navalTurret(b, x, y, z, ry, w, d, h, n, blen, br, m = M.eDeck, seg = 10) {
  b.push(x, y, z, ry);
  b.cyl(w * 0.42, w * 0.46, h * 0.25, seg, M.eDark, 0, 0, 0);
  b.tbox(w, d, w * 0.72, d * 0.7, h, m, 0, h * 0.2, -d * 0.05, { zs: -d * 0.08 });
  const sp = n > 1 ? (w * 0.62) / (n - 1) : 0;
  for (let i = 0; i < n; i++) {
    const bx = -((n - 1) * sp) / 2 + i * sp;
    if (seg > 6) b.cyl(br * 1.5, br * 1.5, 0.03, 6, M.eDark, bx, h * 0.55, d * 0.38, { rx: Math.PI / 2 });
    b.rod(bx, h * 0.55, d * 0.38, bx, h * 0.6, d * 0.38 + blen, br, seg > 6 ? 6 : 4, M.gunmetal, br * 0.8, { open: seg <= 6 });
  }
  b.pop();
}

function navLights(b, x, y, z, beam) {
  b.box(0.016, 0.014, 0.022, M.navR, x + beam, y, z);
  b.box(0.016, 0.014, 0.022, M.navG, x - beam, y, z);
}

function gunboat() {
  const b = new MB();
  const h = hull(b, { len: 1.4, beam: 0.3, free: 0.075, draft: 0.05, sheer: 0.035, stern: 0.86, bow: 0.5, rake: 0.22, flare: 0.1, paint: hostilePaint([[0.7, 0.76], [0.79, 0.83]]) });
  // wheelhouse with raked windows
  b.tbox(0.19, 0.34, 0.15, 0.24, 0.11, M.eDeck, 0, 0.075, -0.07, { zs: -0.03 });
  b.quad(0.15, 0.035, M.glass, 0, 0.16, 0.085, 0, { rx: -0.55 });
  for (const s of [-1, 1]) b.quad(0.18, 0.03, M.glass, s * 0.087, 0.15, -0.07, s * Math.PI / 2, { rx: 0 });
  b.tbox(0.15, 0.24, 0.12, 0.18, 0.04, M.eHull, 0, 0.185, -0.1);
  // mast: radar bar, nav lights, beacon
  b.rod(0, 0.225, -0.12, 0, 0.42, -0.14, 0.008, 4, M.eDark);
  b.box(0.12, 0.012, 0.02, M.eDark, 0, 0.36, -0.135);
  b.box(0.1, 0.01, 0.03, M.gunmetal, 0, 0.392, -0.14);
  b.box(0.014, 0.014, 0.014, M.navW, 0, 0.42, -0.14);
  b.box(0.012, 0.012, 0.012, M.beacon, 0, 0.44, -0.145);
  navLights(b, 0, 0.14, 0.02, 0.098);
  b.box(0.012, 0.012, 0.012, M.navW, 0, 0.1, -0.69);
  // forward gun: small turret, twin barrels
  navalTurret(b, 0, h.deckAt(0.3) - 0.005, 0.3, 0, 0.12, 0.13, 0.06, 2, 0.16, 0.011);
  // aft heavy MG on a ring and depth-charge racks
  b.cyl(0.035, 0.035, 0.03, 8, M.eDark, 0, 0.075, -0.4);
  b.rod(0, 0.12, -0.4, 0, 0.13, -0.28, 0.008, 4, M.gunmetal);
  b.box(0.05, 0.03, 0.06, M.gunmetal, 0, 0.1, -0.41);
  for (const s of [-1, 1]) b.rod(s * 0.07, 0.1, -0.55, s * 0.07, 0.1, -0.66, 0.02, 6, M.eDark);
  // exhausts and a hostile flag
  for (const s of [-1, 1]) b.box(0.02, 0.03, 0.04, M.black, s * 0.05, 0.225, -0.2);
  b.box(0.08, 0.05, 0.004, M.eRed, 0.045, 0.37, -0.14);
  return b;
}

function landingCraft() {
  const b = new MB();
  const red = M.eRed;
  // blunt barge hull
  hull(b, { len: 1.2, beam: 0.46, free: 0.06, draft: 0.05, sheer: 0.0, stern: 0.96, bow: 0.8, rake: 0.28, flare: 0.0, stations: [0, 0.05, 0.2, 0.4, 0.6, 0.75, 0.84, 0.91, 0.96, 1], paint: (t, band) => (band === 'deck' ? M.eDeck : band === 'boot' ? red : band === 'bottom' ? M.eDark : M.eHull) });
  // high bulwarks along the well deck
  for (const s of [-1, 1]) {
    b.box(0.03, 0.08, 0.86, M.eHull, s * 0.205, 0.06, -0.02);
    b.box(0.034, 0.014, 0.86, red, s * 0.205, 0.14, -0.02);
  }
  // bow ramp with a red hostile chevron
  b.push(0, 0.06, 0.45, 0, -0.32, 0);
  b.box(0.42, 0.13, 0.025, M.eHull, 0, 0, 0);
  b.face([[-0.12, 0.1, 0.014], [0.0, 0.03, 0.014], [0.12, 0.1, 0.014], [0.12, 0.07, 0.014], [0.0, 0.0, 0.014], [-0.12, 0.07, 0.014]], red, [0, 0, 1]);
  b.pop();
  // wheelhouse aft with nav lights and mast
  b.box(0.42, 0.06, 0.18, M.eHull, 0, 0.06, -0.45);
  b.tbox(0.18, 0.12, 0.15, 0.1, 0.1, M.eDeck, 0.08, 0.12, -0.46);
  b.quad(0.13, 0.03, M.glass, 0.08, 0.19, -0.398, 0, { rx: -0.25 });
  b.rod(0.08, 0.22, -0.48, 0.08, 0.36, -0.48, 0.006, 4, M.eDark);
  b.box(0.012, 0.012, 0.012, M.navW, 0.08, 0.36, -0.48);
  navLights(b, 0.08, 0.2, -0.43, 0.08);
  b.box(0.07, 0.045, 0.004, red, 0.12, 0.31, -0.48);
  // raiders in the well
  const U = UNIFORMS.raider;
  for (const [x, z] of [[-0.1, 0.25], [0.1, 0.22], [-0.09, 0.02], [0.1, -0.02], [0.0, -0.2]]) person(b, U, x, 0.06, z, 0.95);
  return b;
}

function destroyer() {
  const b = new MB();
  const h = hull(b, { len: 2.8, beam: 0.36, free: 0.12, draft: 0.08, sheer: 0.07, stern: 0.78, bow: 0.46, rake: 0.18, flare: 0.12, paint: hostilePaint([[0.8, 0.83], [0.85, 0.88]]) });
  const dy = 0.12;
  // forward gun and VLS
  navalTurret(b, 0, h.deckAt(0.82) - 0.01, 0.82, 0, 0.14, 0.17, 0.08, 1, 0.26, 0.014, M.eDeck);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) b.box(0.04, 0.008, 0.04, M.eDark, -0.05 + j * 0.1, h.deckAt(0.55 - i * 0.05) - 0.002, 0.55 - i * 0.05);
  // stepped bridge superstructure
  b.tbox(0.28, 0.5, 0.26, 0.46, 0.13, M.eDeck, 0, dy, 0.18);
  b.tbox(0.24, 0.26, 0.2, 0.2, 0.09, M.eDeck, 0, dy + 0.13, 0.26, { zs: -0.02 });
  b.quad(0.19, 0.035, M.glass, 0, dy + 0.19, 0.364, 0, { rx: -0.45 });
  for (const s of [-1, 1]) b.box(0.05, 0.012, 0.06, M.eDeck, s * 0.14, dy + 0.18, 0.3);
  navLights(b, 0, dy + 0.19, 0.3, 0.165);
  // integrated mast with radar faces
  b.tbox(0.16, 0.16, 0.07, 0.07, 0.3, M.eDeck, 0, dy + 0.22, 0.17);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; b.quad(0.07, 0.07, mt(0x2b2f34, 0.4, 0.4), Math.sin(a) * 0.066, dy + 0.33, 0.17 + Math.cos(a) * 0.066, a, { rx: -0.22 }); }
  b.rod(0, dy + 0.52, 0.17, 0, dy + 0.68, 0.16, 0.007, 4, M.eDark);
  b.box(0.16, 0.008, 0.012, M.eDark, 0, dy + 0.6, 0.165);
  b.box(0.014, 0.014, 0.014, M.navW, 0, dy + 0.64, 0.17);
  b.box(0.012, 0.012, 0.012, M.strobe, 0, dy + 0.69, 0.16);
  b.box(0.08, 0.05, 0.004, M.eRed, 0.045, dy + 0.62, 0.16);
  // funnel, boats, hangar, CIWS, helideck
  b.tbox(0.16, 0.24, 0.12, 0.16, 0.2, M.eDeck, 0, dy, -0.3, { zs: -0.03 });
  b.box(0.12, 0.03, 0.16, M.black, 0, dy + 0.2, -0.33);
  for (const s of [-1, 1]) {
    b.box(0.04, 0.035, 0.12, M.white, s * 0.15, dy + 0.06, -0.12, { bevel: 0.01 });
    b.box(0.06, 0.04, 0.1, M.eDark, s * 0.11, dy, -0.5);
  }
  b.box(0.26, 0.12, 0.3, M.eDeck, 0, dy, -0.66);
  b.cyl(0.035, 0.04, 0.05, 8, M.eDeck, 0, dy + 0.12, -0.6);
  b.dome(0.035, M.white, 0, dy + 0.17, -0.6, 8, 3);
  b.box(0.3, 0.004, 0.42, mt(0x4b4f55, 0.8), 0, dy - 0.0, -1.1);
  b.lathe([[0.1, 0.0045], [0.115, 0.0045]], 16, M.marking, 0, dy - 0.003, -1.08);
  b.box(0.012, 0.012, 0.012, M.navW, 0, dy + 0.02, -1.39);
  // anti-ship missile launchers amidships
  for (const s of [-1, 1]) b.box(0.05, 0.04, 0.16, M.eDark, s * 0.06, dy, -0.05, { ry: s * 0.25, rx: -0.15 });
  return b;
}

function battleship() {
  const b = new MB();
  const h = hull(b, { len: 4.5, beam: 0.62, free: 0.16, draft: 0.12, sheer: 0.08, stern: 0.7, bow: 0.5, rake: 0.15, flare: 0.1, paint: hostilePaint([[0.83, 0.855], [0.875, 0.9]]) });
  const dy = 0.16;
  // main battery: two forward and one aft triple turret, superfiring with a barbette
  navalTurret(b, 0, h.deckAt(1.25) - 0.01, 1.25, 0, 0.32, 0.38, 0.13, 3, 0.48, 0.022);
  b.cyl(0.15, 0.16, 0.08, 14, M.eDeck, 0, dy, 0.85);
  navalTurret(b, 0, dy + 0.08, 0.85, 0, 0.32, 0.38, 0.13, 3, 0.48, 0.022);
  navalTurret(b, 0, dy, -1.35, Math.PI, 0.32, 0.38, 0.13, 3, 0.48, 0.022);
  // citadel and tower superstructure
  b.box(0.42, 0.13, 1.1, M.eDeck, 0, dy, -0.15, { bevel: 0.01 });
  b.tbox(0.3, 0.32, 0.24, 0.26, 0.2, M.eDeck, 0, dy + 0.13, 0.32);
  b.tbox(0.22, 0.22, 0.18, 0.16, 0.18, M.eDeck, 0, dy + 0.33, 0.33);
  b.tbox(0.16, 0.14, 0.12, 0.1, 0.14, M.eDeck, 0, dy + 0.51, 0.34);
  b.quad(0.2, 0.035, M.glass, 0, dy + 0.29, 0.484, 0, { rx: -0.1 });
  b.quad(0.16, 0.03, M.glass, 0, dy + 0.47, 0.444, 0, { rx: -0.1 });
  navLights(b, 0, dy + 0.3, 0.42, 0.155);
  // director with rangefinder ears and the main mast
  b.box(0.1, 0.06, 0.1, M.eDeck, 0, dy + 0.65, 0.34);
  b.rod(-0.12, dy + 0.69, 0.34, 0.12, dy + 0.69, 0.34, 0.014, 6, M.eDark);
  b.rod(0, dy + 0.71, 0.33, 0, dy + 1.02, 0.3, 0.01, 5, M.eDark);
  b.box(0.26, 0.01, 0.014, M.eDark, 0, dy + 0.9, 0.31);
  b.box(0.12, 0.008, 0.04, M.gunmetal, 0, dy + 0.95, 0.3);
  b.box(0.014, 0.014, 0.014, M.navW, 0, dy + 0.98, 0.3);
  b.box(0.014, 0.014, 0.014, M.strobe, 0, dy + 1.03, 0.3);
  b.box(0.11, 0.07, 0.004, M.eRed, 0.06, dy + 0.93, 0.3);
  // two funnels with caps
  for (const [z, s] of [[0.05, 1], [-0.32, 0.92]]) {
    b.tbox(0.16 * s, 0.24 * s, 0.13 * s, 0.18 * s, 0.26 * s, M.eDeck, 0, dy + 0.13, z, { zs: -0.03 });
    b.box(0.13 * s, 0.025, 0.18 * s, M.black, 0, dy + 0.13 + 0.26 * s, z - 0.03);
    b.box(0.135 * s, 0.025, 0.185 * s, M.eRed, 0, dy + 0.13 + 0.2 * s, z - 0.025);
  }
  // secondary turrets and AA mounts along the citadel
  for (const s of [-1, 1]) {
    for (const z of [0.3, -0.05, -0.4]) navalTurret(b, s * 0.24, dy + 0.05, z, s * 0.9, 0.09, 0.1, 0.05, 2, 0.12, 0.008, M.eDeck, 6);
    for (const z of [-0.6, 0.55]) { b.cyl(0.03, 0.03, 0.03, 8, M.eDark, s * 0.22, dy, z); b.rod(s * 0.22, dy + 0.04, z, s * 0.22, dy + 0.12, z + 0.04, 0.006, 4, M.gunmetal); }
  }
  // aft crane and catapult
  b.rod(0.12, dy, -1.7, 0.12, dy + 0.3, -1.72, 0.012, 5, M.eDark);
  b.rod(0.12, dy + 0.3, -1.72, 0.12, dy + 0.18, -1.95, 0.008, 4, M.eDark);
  b.box(0.04, 0.02, 0.36, M.eDark, -0.14, dy, -1.82, { ry: 0.25 });
  b.box(0.012, 0.012, 0.012, M.navW, 0, dy + 0.02, -2.24);
  return b;
}

// ------------------------------------------------------------------ aircraft (pivot at the centre of mass, nose +z)

// fuselage from a profile [[r, z], ...] (nose = largest z), elliptic section sx/sy
function fuselage(b, prof, m, seg = 10, sx = 1, sy = 1, y = 0) {
  b.lathe(prof.map(([r, z]) => [r, z]), seg, m, 0, y, 0, { rx: Math.PI / 2, sx, sz: sy });
}

// wing panel from a planform [[x, z], ...] with thickness t, dihedral angle (around z), on side s (+1 left/port +x)
function wingPanel(b, plan, t, m, y, s, dihedral = 0) {
  b.push(0, y, 0, 0, 0, s * dihedral);
  const pts = plan.map(([x, z]) => [x * s, z]);
  b.prism(pts, t, m, 0, -t / 2, 0);
  b.pop();
}

// hostile insignia: red triangle on the upper surface of a wing panel
function triMark(b, x, y, z, size, m, s = 1, dihedral = 0) {
  b.push(0, y, 0, 0, 0, s * dihedral);
  b.prism([[x * s - size * 0.5, z - size * 0.4], [x * s + size * 0.5, z - size * 0.4], [x * s, z + size * 0.5]], 0.004, m, 0, 0.0, 0);
  b.pop();
}

function diveBomber() {
  const b = new MB();
  const top = M.eHull, low = M.eDeck;
  fuselage(b, [[0.0, -0.4], [0.02, -0.38], [0.038, -0.28], [0.058, -0.08], [0.064, 0.12], [0.06, 0.26], [0.052, 0.31], [0.03, 0.33]], top, 10, 1, 1.15);
  // canopy and cockpit
  b.ball(0.05, M.glass, 0, 0.045, 0.04, 10, 6, { sz: 2.2, sy: 0.8, pl: Math.PI / 2 });
  // straight, tapered wings with slight dihedral
  const plan = [[0.03, 0.12], [0.4, 0.06], [0.42, -0.02], [0.03, -0.07]];
  for (const s of [1, -1]) {
    wingPanel(b, plan, 0.022, top, -0.03, s, 0.07);
    triMark(b, 0.26, -0.03 + 0.012, 0.03, 0.09, M.eRed, s, 0.07);
    b.box(0.014, 0.012, 0.03, s > 0 ? M.navR : M.navG, s * 0.415, -0.03 + 0.03, 0.02);
    // underwing bomb
    b.lathe([[0.0, -0.08], [0.018, -0.05], [0.02, 0.02], [0.012, 0.06], [0.0, 0.07]], 6, M.olive, s * 0.18, -0.07, 0.02, { rx: Math.PI / 2 });
    b.box(0.006, 0.03, 0.03, M.eDark, s * 0.18, -0.05, 0.03);
  }
  b.lathe([[0.0, -0.1], [0.025, -0.07], [0.028, 0.04], [0.016, 0.08], [0.0, 0.09]], 6, M.olive, 0, -0.085, 0.04, { rx: Math.PI / 2 });
  // tail
  for (const s of [1, -1]) wingPanel(b, [[0.01, -0.28], [0.14, -0.33], [0.14, -0.37], [0.01, -0.39]], 0.012, top, 0.02, s, 0);
  b.push(0, 0.02, 0, 0, 0, Math.PI / 2);
  b.prism([[0.0, -0.24], [0.15, -0.34], [0.15, -0.38], [0.0, -0.4]], 0.012, top, 0, -0.006, 0);
  b.prism([[0.1, -0.31], [0.15, -0.34], [0.15, -0.38], [0.1, -0.38]], 0.014, M.eRed, 0, -0.007, 0);
  b.pop();
  b.box(0.012, 0.012, 0.012, M.strobe, 0, 0.17, -0.39);
  b.box(0.012, 0.012, 0.012, M.beacon, 0, -0.07, -0.1);
  // propeller: red spinner and four blades
  b.cone(0.03, 0.06, 8, M.eRed, 0, 0, 0.33, { rx: Math.PI / 2 });
  for (let k = 0; k < 4; k++) b.cbox(0.02, 0.17, 0.006, M.black, 0, 0, 0.335, { rz: k * Math.PI / 2 + 0.3, ry: 0 });
  // belly scoop and exhaust stubs
  b.box(0.04, 0.03, 0.12, low, 0, -0.08, 0.12);
  return b;
}

function heavyBomber() {
  const b = new MB();
  const top = M.eHull, low = M.eDeck;
  fuselage(b, [[0.0, -0.66], [0.03, -0.62], [0.05, -0.45], [0.072, -0.1], [0.075, 0.3], [0.065, 0.5], [0.045, 0.6], [0.0, 0.66]], top, 12, 1, 1.05);
  b.ball(0.044, M.glass, 0, 0.02, 0.6, 10, 6, { sz: 1.4 });
  b.ball(0.035, M.glass, 0, 0.055, 0.46, 10, 6, { sz: 1.8, pl: Math.PI / 2 });
  b.ball(0.025, M.glass, 0, 0.0, -0.66, 8, 6);
  // swept wings with four turboprop nacelles
  const plan = [[0.05, 0.22], [0.7, -0.08], [0.72, -0.15], [0.05, -0.08]];
  for (const s of [1, -1]) {
    wingPanel(b, plan, 0.03, top, -0.01, s, 0.04);
    triMark(b, 0.48, 0.012, -0.04, 0.12, M.eRed, s, 0.04);
    b.box(0.014, 0.012, 0.03, s > 0 ? M.navR : M.navG, s * 0.715, 0.03, -0.12);
    for (const [nx, nz] of [[0.22, 0.15], [0.44, 0.04]]) {
      b.lathe([[0.0, -0.14], [0.03, -0.1], [0.036, 0.04], [0.03, 0.12], [0.0, 0.14]], 8, low, s * nx, -0.03, nz, { rx: Math.PI / 2 });
      b.cone(0.016, 0.04, 6, M.eDark, s * nx, -0.03, nz + 0.14, { rx: Math.PI / 2 });
      for (let k = 0; k < 4; k++) b.cbox(0.014, 0.15, 0.004, M.black, s * nx, -0.03, nz + 0.17, { rz: k * Math.PI / 2 + 0.6 + s * 0.3 });
    }
  }
  // tail: swept fin with a red band, stabilisers
  for (const s of [1, -1]) wingPanel(b, [[0.02, -0.46], [0.24, -0.6], [0.25, -0.65], [0.02, -0.6]], 0.016, top, 0.02, s, 0);
  b.push(0, 0.03, 0, 0, 0, Math.PI / 2);
  b.prism([[0.0, -0.36], [0.27, -0.58], [0.28, -0.66], [0.0, -0.64]], 0.016, top, 0, -0.008, 0);
  b.prism([[0.16, -0.5], [0.24, -0.56], [0.25, -0.62], [0.16, -0.6]], 0.018, M.eRed, 0, -0.009, 0);
  b.pop();
  b.box(0.014, 0.014, 0.014, M.strobe, 0, 0.31, -0.66);
  b.box(0.014, 0.014, 0.014, M.beacon, 0, 0.08, 0.1);
  b.box(0.014, 0.014, 0.014, M.beacon, 0, -0.08, -0.1);
  // bomb-bay doors
  b.box(0.08, 0.006, 0.36, M.eDark, 0, -0.077, 0.0);
  return b;
}

// delta-wing jet. hostile: strike jet; friendly: interceptor (naval grey + cyan fin flash)
function jetModel(friendly) {
  const b = new MB();
  const top = friendly ? M.naval : M.eHull, low = friendly ? mt(0x969ea4, 0.55, 0.25) : M.eDeck, mark = friendly ? M.friendly : M.eRed;
  fuselage(b, [[0.0, -0.5], [0.04, -0.48], [0.055, -0.3], [0.06, 0.0], [0.05, 0.25], [0.03, 0.42], [0.0, 0.55]], top, 10, 1, 0.9);
  b.ball(0.035, M.glass, 0, 0.035, 0.24, 10, 6, { sz: 2.4, pl: Math.PI / 2 });
  // intakes
  for (const s of [-1, 1]) b.tbox(0.04, 0.16, 0.034, 0.14, 0.05, low, s * 0.055, -0.04, 0.05);
  // cropped delta wing + canards / tailplanes
  const plan = [[0.04, 0.2], [0.4, -0.2], [0.4, -0.27], [0.04, -0.3]];
  for (const s of [1, -1]) {
    wingPanel(b, plan, 0.016, top, -0.01, s, -0.04);
    if (friendly) b.prism([[s * 0.2, -0.2], [s * 0.34, -0.22], [s * 0.34, -0.25], [s * 0.2, -0.24]], 0.003, mark, 0, -0.0, 0);
    else triMark(b, 0.22, 0.0, -0.13, 0.1, mark, s, -0.04);
    b.box(0.012, 0.01, 0.025, s > 0 ? M.navR : M.navG, s * 0.395, -0.01, -0.24);
    wingPanel(b, [[0.04, -0.36], [0.17, -0.45], [0.17, -0.5], [0.04, -0.47]], 0.01, top, -0.01, s, 0);
    // stores: rockets (strike) / missiles (interceptor)
    b.rod(s * 0.2, -0.04, 0.0, s * 0.2, -0.04, -0.2, 0.012, 6, friendly ? M.white : M.olive);
    b.cone(0.012, 0.03, 6, friendly ? M.white : M.eRed, s * 0.2, -0.04, 0.0, { rx: Math.PI / 2 });
  }
  // fin with marking
  b.push(0, 0.03, 0, 0, 0, Math.PI / 2);
  b.prism([[0.0, -0.22], [0.2, -0.42], [0.2, -0.48], [0.0, -0.46]], 0.012, top, 0, -0.006, 0);
  b.prism([[0.1, -0.33], [0.2, -0.42], [0.2, -0.48], [0.1, -0.45]], 0.014, mark, 0, -0.007, 0);
  b.pop();
  b.box(0.012, 0.012, 0.012, M.strobe, 0, 0.23, -0.47);
  b.box(0.012, 0.012, 0.012, M.beacon, 0, -0.065, -0.05);
  b.cyl(0.036, 0.036, 0.03, 10, M.darkSteel, 0, 0, -0.5, { rx: Math.PI / 2 });
  b.cyl(0.026, 0.026, 0.006, 10, M.glow, 0, 0, -0.52, { rx: Math.PI / 2 });
  return b;
}

// ------------------------------------------------------------------ infantry

function infantry(u, rifle = true) {
  const b = new MB();
  person(b, u, 0, 0, 0, 1.0, { rifle });
  return b;
}

// ------------------------------------------------------------------ traffic vehicles (paint mask = body, tint via instanceColor)

function wheels(b, w, zs, r = 0.028, y = r) {
  for (const z of zs) b.rod(-w / 2, y, z, w / 2, y, z, r, 7, M.rubber, r, { roll: Math.PI / 7 });
}
function lights(b, w, zf, zb, y, hw = 0.032, hh = 0.016) {
  for (const s of [-1, 1]) {
    b.quad(hw, hh, M.headLight, s * (w / 2 - hw * 0.8), y, zf + 0.002, 0);
    b.quad(hw * 0.9, hh, M.tailLight, s * (w / 2 - hw * 0.75), y, zb - 0.002, Math.PI);
  }
}

// car kinds: sedan (0.36u), hatch (0.31u), suv (0.38u), taxi (sedan + roof sign), police (white/blue + light bar)
function car(kind) {
  const b = new MB();
  const L = kind === 'suv' ? 0.38 : kind === 'hatch' ? 0.31 : 0.36, W = 0.16;
  const fixed = kind === 'police';
  const body = fixed ? M.white : M.paint;
  const bh = kind === 'suv' ? 0.07 : 0.055, y0 = 0.02;
  b.box(W, bh, L, body, 0, y0, 0, { bevel: 0.016 });
  // dark sills / bumpers
  b.box(W + 0.004, 0.016, L + 0.006, M.black, 0, y0 - 0.002, 0);
  // greenhouse
  const ch = kind === 'suv' ? 0.065 : 0.055;
  let cl, ct, cz, zs;
  if (kind === 'hatch') { cl = 0.2; ct = 0.14; cz = -0.035; zs = -0.025; }
  else if (kind === 'suv') { cl = 0.27; ct = 0.23; cz = -0.035; zs = -0.01; }
  else { cl = 0.2; ct = 0.12; cz = -0.02; zs = -0.01; }
  b.tbox(W * 0.9, cl, W * 0.76, ct, ch, M.glassCar, 0, y0 + bh, cz, { zs });
  b.box(W * 0.74, 0.008, ct * 0.94, body, 0, y0 + bh + ch, cz + zs);
  wheels(b, W + 0.008, [L / 2 - 0.065, -L / 2 + 0.065]);
  lights(b, W, L / 2, -L / 2, y0 + bh * 0.62);
  if (kind === 'police') {
    for (const s of [-1, 1]) b.quad(L * 0.6, 0.024, M.policeBlue, s * (W / 2 + 0.001), y0 + bh * 0.5, 0, s * Math.PI / 2);
    b.box(0.1, 0.014, 0.03, M.darkSteel, 0, y0 + bh + ch + 0.008, cz + zs);
    b.box(0.04, 0.014, 0.026, M.flashB, -0.026, y0 + bh + ch + 0.012, cz + zs);
    b.box(0.04, 0.014, 0.026, M.flashR, 0.026, y0 + bh + ch + 0.012, cz + zs);
  }
  if (kind === 'taxi') b.box(0.05, 0.018, 0.024, mt(0xfff0b0, 0.5, 0, EMI.night(3)), 0, y0 + bh + ch + 0.008, cz + zs);
  return b;
}

function van(amb) {
  const b = new MB();
  const L = 0.45, W = 0.17, y0 = 0.02;
  const body = amb ? M.white : M.paint;
  b.box(W, 0.06, L, body, 0, y0, 0, { bevel: 0.014 });
  b.box(W + 0.004, 0.016, L + 0.006, M.black, 0, y0 - 0.002, 0);
  b.box(W, 0.1, L * 0.7, body, 0, y0 + 0.06, -L * 0.15, { bevel: 0.012 });
  b.tbox(W * 0.96, 0.08, W * 0.9, 0.03, 0.08, M.glassCar, 0, y0 + 0.06, L * 0.22, { zs: -0.03 });
  for (const s of [-1, 1]) b.quad(0.07, 0.045, M.glassCar, s * (W / 2 + 0.001), y0 + 0.115, L * 0.14, s * Math.PI / 2);
  wheels(b, W + 0.008, [L / 2 - 0.075, -L / 2 + 0.07]);
  lights(b, W, L / 2, -L / 2, y0 + 0.04);
  if (amb) {
    for (const s of [-1, 1]) {
      b.quad(L * 0.66, 0.026, mt(0x2fa05a, 0.5), s * (W / 2 + 0.002), y0 + 0.09, -L * 0.15, s * Math.PI / 2);
      b.quad(L * 0.66, 0.012, mt(0xd8c040, 0.5), s * (W / 2 + 0.002), y0 + 0.07, -L * 0.15, s * Math.PI / 2);
    }
    b.box(0.05, 0.016, 0.03, M.flashB, -0.045, y0 + 0.16, L * 0.17);
    b.box(0.05, 0.016, 0.03, mt(PAL.lBlue, 0.4, 0, EMI.flash(8)), 0.045, y0 + 0.16, L * 0.17);
  }
  return b;
}

function truck() {
  const b = new MB();
  const L = 0.7, W = 0.19, y0 = 0.022;
  // chassis, cab (paint), box body
  b.box(W * 0.8, 0.03, L, M.darkSteel, 0, y0 + 0.01, 0);
  b.box(W, 0.13, 0.15, M.paint, 0, y0 + 0.02, L / 2 - 0.08, { bevel: 0.016 });
  b.tbox(W * 0.94, 0.04, W * 0.9, 0.03, 0.06, M.glassCar, 0, y0 + 0.09, L / 2 - 0.02, { zs: -0.01 });
  for (const s of [-1, 1]) b.quad(0.06, 0.05, M.glassCar, s * (W / 2 + 0.001), y0 + 0.12, L / 2 - 0.07, s * Math.PI / 2);
  b.box(W * 1.02, 0.17, L - 0.18, M.wall1, 0, y0 + 0.035, -0.08, { bevel: 0.008 });
  for (const s of [-1, 1]) b.quad(L - 0.24, 0.03, M.paint, s * (W * 0.51 + 0.001), y0 + 0.17, -0.08, s * Math.PI / 2);
  wheels(b, W + 0.01, [L / 2 - 0.09, -L / 2 + 0.17, -L / 2 + 0.08], 0.032);
  lights(b, W, L / 2 - 0.005, -L / 2 + 0.01, y0 + 0.05);
  b.box(0.08, 0.01, 0.01, mt(PAL.lAmber, 0.4, 0, EMI.night(2)), 0, y0 + 0.155, L / 2 - 0.01);
  return b;
}

function bus() {
  const b = new MB();
  const L = 0.95, W = 0.2, y0 = 0.022;
  b.box(W, 0.1, L, M.paint, 0, y0, 0, { bevel: 0.014 });
  b.box(W, 0.1, L, M.white, 0, y0 + 0.1, 0, { bevel: 0.014 });
  b.box(W + 0.004, 0.016, L + 0.006, M.black, 0, y0 - 0.004, 0);
  // window band with lit interior at night, windscreen, destination display
  const winLit = mt(PAL.glassCar, 0.06, 0.1, EMI.night(1.6));
  for (const s of [-1, 1]) b.quad(L - 0.14, 0.07, winLit, s * (W / 2 + 0.002), y0 + 0.14, -0.03, s * Math.PI / 2);
  b.quad(W - 0.03, 0.1, M.glassCar, 0, y0 + 0.12, L / 2 + 0.002, 0);
  b.quad(W - 0.06, 0.022, mt(PAL.lAmber, 0.4, 0, EMI.nav(3)), 0, y0 + 0.185, L / 2 + 0.004, 0);
  b.box(0.12, 0.03, 0.22, M.wall8, 0, y0 + 0.2, -0.15);
  wheels(b, W + 0.01, [L / 2 - 0.13, -L / 2 + 0.17], 0.034);
  lights(b, W, L / 2, -L / 2, y0 + 0.05);
  return b;
}

function fireTruck() {
  const b = new MB();
  const L = 0.75, W = 0.2, y0 = 0.022;
  const red = M.fireRed;
  b.box(W * 0.8, 0.03, L, M.darkSteel, 0, y0 + 0.01, 0);
  b.box(W, 0.14, 0.2, red, 0, y0 + 0.02, L / 2 - 0.1, { bevel: 0.016 });
  b.tbox(W * 0.95, 0.04, W * 0.92, 0.03, 0.06, M.glassCar, 0, y0 + 0.09, L / 2 - 0.004, { zs: -0.01 });
  for (const s of [-1, 1]) b.quad(0.12, 0.05, M.glassCar, s * (W / 2 + 0.001), y0 + 0.13, L / 2 - 0.1, s * Math.PI / 2);
  b.box(W * 1.02, 0.15, L - 0.22, red, 0, y0 + 0.03, -0.1, { bevel: 0.01 });
  // roller shutters and a white stripe
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) b.quad(0.13, 0.11, mt(0x9a9fa3, 0.4, 0.6), s * (W * 0.51 + 0.002), y0 + 0.1, -0.28 + k * 0.15, s * Math.PI / 2);
    b.quad(L - 0.04, 0.014, M.white, s * (W * 0.51 + 0.003), y0 + 0.04, 0.0, s * Math.PI / 2);
  }
  // ladder on the roof
  for (const s of [-1, 1]) b.box(0.012, 0.012, L - 0.12, M.steel, s * 0.05, y0 + 0.19, -0.05);
  for (let k = 0; k < 6; k++) b.box(0.1, 0.006, 0.008, M.steel, 0, y0 + 0.195, -0.33 + k * 0.1);
  // light bar and side flashers alternating red/blue
  b.box(0.16, 0.014, 0.03, M.darkSteel, 0, y0 + 0.16, L / 2 - 0.09);
  b.box(0.06, 0.016, 0.028, M.flashR, -0.045, y0 + 0.166, L / 2 - 0.09);
  b.box(0.06, 0.016, 0.028, M.flashB, 0.045, y0 + 0.166, L / 2 - 0.09);
  b.box(0.02, 0.02, 0.02, M.flashR, -W / 2 + 0.01, y0 + 0.17, -L / 2 + 0.03);
  b.box(0.02, 0.02, 0.02, M.flashB, W / 2 - 0.01, y0 + 0.17, -L / 2 + 0.03);
  wheels(b, W + 0.01, [L / 2 - 0.12, -L / 2 + 0.16, -L / 2 + 0.07], 0.033);
  lights(b, W, L / 2, -L / 2, y0 + 0.05);
  return b;
}

// ------------------------------------------------------------------ civilian boats

function ferry() {
  const b = new MB();
  const blue = mt(0x2e5a88, 0.5, 0.1);
  hull(b, { len: 2.4, beam: 0.5, free: 0.12, draft: 0.07, sheer: 0.05, stern: 0.88, bow: 0.55, rake: 0.2, flare: 0.08, paint: (t, band, r) => (band === 'deck' ? mt(0x8a8f8f, 0.8) : band === 'boot' ? blue : band === 'bottom' ? mt(0x7a2c26, 0.8) : r === 0 ? blue : M.white) });
  const R = rng(4001), dy = 0.12;
  // two passenger decks with window bands, bridge on top
  b.box(0.44, 0.12, 1.5, M.white, 0, dy, -0.15, { bevel: 0.02 });
  ribbon(b, 0, -0.15, 0.44, 1.5, dy, 1, R, { storey: 0.12, bh: 0.055, bay: 0.12, yo: 0.065, lit: 0.85, sides: [1, 3, 0] });
  b.box(0.4, 0.11, 1.1, M.white, 0, dy + 0.12, -0.2, { bevel: 0.02 });
  ribbon(b, 0, -0.2, 0.4, 1.1, dy + 0.12, 1, R, { storey: 0.11, bh: 0.05, bay: 0.12, yo: 0.06, lit: 0.85, sides: [1, 3] });
  b.box(0.46, 0.012, 1.54, blue, 0, dy + 0.12, -0.15);
  b.tbox(0.3, 0.2, 0.28, 0.16, 0.08, M.white, 0, dy + 0.23, 0.18);
  b.quad(0.26, 0.035, M.glass, 0, dy + 0.27, 0.27, 0, { rx: -0.3 });
  // funnel (blue with white band) and mast
  b.tbox(0.12, 0.18, 0.1, 0.14, 0.16, blue, 0, dy + 0.23, -0.4, { zs: -0.02 });
  b.box(0.104, 0.03, 0.15, M.white, 0, dy + 0.33, -0.415);
  b.box(0.09, 0.012, 0.13, M.black, 0, dy + 0.39, -0.42);
  b.rod(0, dy + 0.31, 0.2, 0, dy + 0.52, 0.2, 0.006, 4, M.white);
  b.box(0.014, 0.014, 0.014, M.navW, 0, dy + 0.52, 0.2);
  navLights(b, 0, dy + 0.27, 0.18, 0.155);
  b.box(0.012, 0.012, 0.012, M.navW, 0, dy + 0.02, -1.19);
  // lifeboats and railings
  for (const s of [-1, 1]) for (const z of [-0.5, 0.0]) b.box(0.05, 0.04, 0.16, mt(0xe8742a, 0.6), s * 0.24, dy + 0.13, z, { bevel: 0.012 });
  return b;
}

function trawler() {
  const b = new MB();
  hull(b, { len: 1.2, beam: 0.34, free: 0.1, draft: 0.07, sheer: 0.08, stern: 0.82, bow: 0.5, rake: 0.18, flare: 0.1, paint: (t, band, r) => (band === 'deck' ? M.wood : band === 'boot' ? M.white : band === 'bottom' ? mt(0x7a2c26, 0.8) : r === 0 && t > 0.05 ? M.white : M.paint) });
  const dy = 0.1;
  // forward wheelhouse
  b.box(0.2, 0.13, 0.22, M.white, 0, dy, 0.2, { bevel: 0.012 });
  b.quad(0.16, 0.04, M.glass, 0, dy + 0.095, 0.312, 0);
  for (const s of [-1, 1]) b.quad(0.14, 0.04, M.glass, s * 0.102, dy + 0.095, 0.2, s * Math.PI / 2);
  b.box(0.22, 0.012, 0.24, M.darkSteel, 0, dy + 0.13, 0.2);
  b.rod(0, dy + 0.14, 0.18, 0, dy + 0.42, 0.18, 0.007, 4, M.white);
  b.box(0.012, 0.012, 0.012, M.navW, 0, dy + 0.42, 0.18);
  navLights(b, 0, dy + 0.1, 0.2, 0.105);
  // derrick mast with booms, net drum and stern A-frame (orange)
  b.rod(0, dy, -0.05, 0, dy + 0.36, -0.05, 0.008, 4, M.darkSteel);
  for (const s of [-1, 1]) b.rod(0, dy + 0.06, -0.05, s * 0.3, dy + 0.3, -0.12, 0.005, 3, M.darkSteel);
  b.rod(-0.08, dy + 0.06, -0.3, 0.08, dy + 0.06, -0.3, 0.05, 10, mt(0x4b6a52, 0.8));
  const orange = mt(0xe0662a, 0.6, 0.2);
  for (const s of [-1, 1]) b.rod(s * 0.13, dy, -0.5, s * 0.08, dy + 0.24, -0.54, 0.01, 5, orange);
  b.rod(-0.08, dy + 0.24, -0.54, 0.08, dy + 0.24, -0.54, 0.01, 5, orange);
  b.box(0.012, 0.012, 0.012, M.navW, 0, dy + 0.26, -0.54);
  // fish boxes
  for (let k = 0; k < 3; k++) b.box(0.05, 0.025, 0.04, mt(0x3a72b0, 0.7), -0.09 + k * 0.06, dy, -0.16);
  return b;
}

function yacht() {
  const b = new MB();
  const navy = mt(0x1f2c44, 0.35, 0.2);
  hull(b, { len: 0.9, beam: 0.22, free: 0.07, draft: 0.04, sheer: 0.03, stern: 0.85, bow: 0.42, rake: 0.3, flare: 0.08, paint: (t, band, r) => (band === 'deck' ? mt(0xb89a6e, 0.7) : band === 'boot' ? navy : band === 'bottom' ? M.white : M.white) });
  const dy = 0.07;
  b.tbox(0.18, 0.42, 0.16, 0.3, 0.07, M.white, 0, dy, -0.04, { zs: -0.04 });
  b.quad(0.15, 0.03, mt(PAL.glassCar, 0.05, 0.2, EMI.night(1.2)), 0, dy + 0.045, 0.165, 0, { rx: -0.9 });
  for (const s of [-1, 1]) b.quad(0.32, 0.026, mt(PAL.glassCar, 0.05, 0.2, EMI.night(1.2)), s * 0.087, dy + 0.04, -0.05, s * Math.PI / 2);
  b.tbox(0.14, 0.24, 0.12, 0.16, 0.04, M.white, 0, dy + 0.07, -0.1, { zs: -0.03 });
  b.box(0.13, 0.008, 0.14, navy, 0, dy + 0.11, -0.12);
  b.rod(0, dy + 0.11, -0.04, 0, dy + 0.2, -0.06, 0.004, 3, M.steel);
  b.box(0.01, 0.01, 0.01, M.navW, 0, dy + 0.2, -0.06);
  navLights(b, 0, dy + 0.06, 0.1, 0.085);
  for (const s of [-1, 1]) b.quad(0.5, 0.012, navy, s * 0.111, 0.045, 0.0, s * Math.PI / 2);
  return b;
}

// ------------------------------------------------------------------ projectiles (centred, flying toward +z)

function shellModel() {
  const b = new MB();
  b.rod(0, 0, -0.07, 0, 0, 0.04, 0.02, 6, M.tracer);
  b.cone(0.02, 0.04, 6, M.tracer, 0, 0, 0.04, { rx: Math.PI / 2 });
  return b;
}
function bombModel() {
  const b = new MB();
  b.lathe([[0.0, -0.12], [0.02, -0.1], [0.04, -0.04], [0.042, 0.06], [0.03, 0.11], [0.0, 0.13]], 8, mt(0x4a5038, 0.6, 0.2), 0, 0, 0, { rx: Math.PI / 2 });
  b.cyl(0.043, 0.043, 0.015, 8, M.markingY, 0, 0, 0.08, { rx: Math.PI / 2 });
  for (let k = 0; k < 4; k++) b.cbox(0.004, 0.08, 0.06, M.eDark, 0, 0, -0.12, { rz: k * Math.PI / 2 + Math.PI / 4 });
  return b;
}
function missileProj() {
  const b = new MB();
  b.rod(0, 0, -0.16, 0, 0, 0.12, 0.022, 8, M.white);
  b.cone(0.022, 0.07, 8, M.wall8, 0, 0, 0.12, { rx: Math.PI / 2 });
  b.cyl(0.023, 0.023, 0.02, 8, M.friendly, 0, 0, 0.05, { rx: Math.PI / 2 });
  for (let k = 0; k < 4; k++) {
    b.cbox(0.004, 0.09, 0.05, M.wall8, 0, 0, -0.13, { rz: k * Math.PI / 2 });
    b.cbox(0.004, 0.06, 0.04, M.wall8, 0, 0, 0.02, { rz: k * Math.PI / 2 });
  }
  b.cone(0.02, 0.09, 6, M.exhaust, 0, 0, -0.16, { rx: -Math.PI / 2 });
  return b;
}
function rocketProj() {
  const b = new MB();
  b.rod(0, 0, -0.1, 0, 0, 0.07, 0.014, 6, M.eDark);
  b.cone(0.014, 0.04, 6, M.eRed, 0, 0, 0.07, { rx: Math.PI / 2 });
  for (let k = 0; k < 3; k++) b.cbox(0.003, 0.05, 0.03, M.eDark, 0, 0, -0.09, { rz: k * 2.094 });
  b.cone(0.013, 0.07, 6, M.exhaust, 0, 0, -0.1, { rx: -Math.PI / 2 });
  return b;
}
// unit tracer streak from z = 0 to z = 1 (scale x/y for thickness, z for length); paint-tinted emissive
function tracerModel() {
  const b = new MB();
  b.box(1, 1, 1, M.tracer, 0, -0.5, 0.5);
  return b;
}

// ------------------------------------------------------------------ rubble

function rubble(seed) {
  const b = new MB();
  const R = rng(seed);
  b.lathe([[0.7, 0.0], [0.55, 0.015], [0.3, 0.05], [0.0, 0.07]], 12, mt(0x6a625a, 0.95));
  const mats = [M.concreteDark, mt(0x7e766c, 0.95), M.brick, mt(0x3a3634, 0.95), M.concrete, mt(0x4a3f36, 0.9)];
  for (let i = 0; i < 26; i++) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.55;
    const w = 0.05 + R() * 0.14, h = 0.02 + R() * 0.05, d = 0.04 + R() * 0.12;
    const y = 0.07 * (1 - r / 0.6) - 0.01;
    b.cbox(w, h, d, mats[i % mats.length], Math.cos(a) * r, y + h * 0.3, Math.sin(a) * r, { ry: R() * 6.28, rx: (R() - 0.5) * 0.9, rz: (R() - 0.5) * 0.9 });
  }
  // a standing wall fragment, slabs, rebar and charred beams
  b.box(0.3, 0.22 + R() * 0.12, 0.05, M.wall2, -0.18, 0, -0.28, { ry: 0.3 });
  b.box(0.12, 0.12, 0.052, M.brick, 0.0, 0, -0.33, { ry: 0.3 });
  b.cbox(0.32, 0.03, 0.22, M.concrete, 0.18, 0.08, 0.12, { ry: 0.8, rx: 0.35 });
  for (let k = 0; k < 4; k++) b.rod(0.05 + k * 0.03, 0.09, 0.05, 0.1 + k * 0.04, 0.2, 0.0 - k * 0.02, 0.004, 3, mt(0x5a3a2a, 0.7, 0.5));
  for (let k = 0; k < 3; k++) b.cbox(0.24, 0.03, 0.03, mt(0x2a2420, 0.9), -0.1 + k * 0.1, 0.06, 0.25 - k * 0.05, { ry: k * 0.9, rz: 0.2 });
  return b;
}

// ------------------------------------------------------------------ thumbnail ground tile

function thumbTile() {
  const b = new MB();
  b.cyl(1, 1, 0.012, 6, M.grass, 0, -0.012, 0, { flat: true });
  b.cyl(1, 0.98, 0.25, 6, M.dirt, 0, -0.262, 0, { flat: true });
  return b;
}

// ================================================================== registry

// cat: 'structure' | 'head' | 'rotor' | 'unit' | 'vehicle' | 'boat' | 'projectile' | 'misc'
// mat: 'static' (uberMaterial, follows clay mode) | 'unit' (uberUnitMaterial)
const BUILDERS = {
  // Town Hall
  hq: ['structure', () => townHall(1)], hq_l2: ['structure', () => townHall(2)], hq_l3: ['structure', () => townHall(3)],
  hq_head: ['head', hqHead],
  // services, parks, utilities
  fire: ['structure', fireStation], police: ['structure', policeStation], clinic: ['structure', clinic], hospital: ['structure', hospital],
  school: ['structure', school], college: ['structure', warCollege], park: ['structure', park], plaza: ['structure', plaza],
  wind: ['structure', windTower], wind_rotor: ['rotor', windRotor], gas: ['structure', gasPlant], watertower: ['structure', waterTower], pump: ['structure', pumpStation],
  // defence: bases and heads per level
  mg: ['structure', () => mgBase(1)], mg_l2: ['structure', () => mgBase(2)], mg_l3: ['structure', () => mgBase(3)],
  mg_head: ['head', () => mgHead(1)], mg_head_l2: ['head', () => mgHead(2)], mg_head_l3: ['head', () => mgHead(3)],
  coastal: ['structure', () => coastalBase(1)], coastal_l2: ['structure', () => coastalBase(2)], coastal_l3: ['structure', () => coastalBase(3)],
  coastal_head: ['head', () => coastalHead(1)], coastal_head_l2: ['head', () => coastalHead(2)], coastal_head_l3: ['head', () => coastalHead(3)],
  flak: ['structure', () => flakBase(1)], flak_l2: ['structure', () => flakBase(2)], flak_l3: ['structure', () => flakBase(3)],
  flak_head: ['head', () => flakHead(1)], flak_head_l2: ['head', () => flakHead(2)], flak_head_l3: ['head', () => flakHead(3)],
  missile: ['structure', () => missileBase(1)], missile_l2: ['structure', () => missileBase(2)], missile_l3: ['structure', () => missileBase(3)],
  missile_head: ['head', () => missileHead(1)], missile_head_l2: ['head', () => missileHead(2)], missile_head_l3: ['head', () => missileHead(3)],
  radar: ['structure', radarBase], radar_head: ['head', radarHead],
  barracks: ['structure', () => barracksModel(1)], barracks_l2: ['structure', () => barracksModel(2)], barracks_l3: ['structure', () => barracksModel(3)],
  airfield: ['structure', () => airfieldModel(1)], airfield_l2: ['structure', () => airfieldModel(2)], airfield_l3: ['structure', () => airfieldModel(3)],
  rubble: ['structure', () => rubble(7)], rubble_b: ['structure', () => rubble(23)],
  // hostile units
  gunboat: ['unit', gunboat], landing: ['unit', landingCraft], destroyer: ['unit', destroyer], battleship: ['unit', battleship],
  fighter: ['unit', diveBomber], bomber: ['unit', heavyBomber], jet: ['unit', () => jetModel(false)],
  infantry: ['unit', () => infantry(UNIFORMS.raider)],
  // friendly units
  soldier: ['unit', () => infantry(UNIFORMS.marine)], officer: ['unit', () => infantry(UNIFORMS.officer, false)],
  ally_fighter: ['unit', () => jetModel(true)],
  // projectiles
  shell: ['projectile', shellModel], bomb: ['projectile', bombModel], missileP: ['projectile', missileProj], rocketP: ['projectile', rocketProj],
  tracer: ['projectile', tracerModel],
  // traffic and civil
  car_sedan: ['vehicle', () => car('sedan')], car_hatch: ['vehicle', () => car('hatch')], car_suv: ['vehicle', () => car('suv')],
  taxi: ['vehicle', () => car('taxi')], police_car: ['vehicle', () => car('police')], van: ['vehicle', () => van(false)],
  ambulance: ['vehicle', () => van(true)], truck: ['vehicle', truck], bus: ['vehicle', bus], firetruck: ['vehicle', fireTruck],
  ferry: ['boat', ferry], trawler: ['boat', trawler], yacht: ['boat', yacht],
  thumb_tile: ['misc', thumbTile],
};

const REG = {};
let built = false;

function headYFor(type) {
  if (type === 'hq') return HQ_HEAD_Y;
  const d = BUILDINGS[type];
  return (d && ((d.weapon && d.weapon.headY) || d.headY)) || 0;
}

const UPGRADABLE = ['hq', 'mg', 'coastal', 'flak', 'missile', 'barracks', 'airfield'];
const HEADED = ['hq', 'mg', 'coastal', 'flak', 'missile', 'radar'];

// Registry key for a structure type at a level (1-3). Clinic level 2 is the hospital.
export function modelKey(type, level = 1) {
  if (type === 'clinic') return level >= 2 ? 'hospital' : 'clinic';
  if (level >= 3 && REG[type + '_l3']) return type + '_l3';
  if (level >= 2 && REG[type + '_l2']) return type + '_l2';
  return REG[type] ? type : null;
}
// Registry key of the rotating head for a structure type at a level, or null
export function headKey(type, level = 1) {
  const base = type + '_head';
  if (level >= 3 && REG[base + '_l3']) return base + '_l3';
  if (level >= 2 && REG[base + '_l2']) return base + '_l2';
  return REG[base] ? base : null;
}

export function registerModel(key, entry) {
  REG[key] = entry;
  return entry;
}

function makeEntry(key, cat, b) {
  const geometry = b.build();
  geometry.name = key;
  const mat = cat === 'unit' || cat === 'vehicle' || cat === 'boat' || cat === 'projectile' ? 'unit' : 'static';
  return {
    key, cat, geometry, tris: b.tris(),
    material: mat === 'unit' ? uberUnitMaterial : uberMaterial,
    radius: geometry.boundingSphere.radius,
    // suggested shadow casting (review: High preset - vehicles, infantry, projectiles do not cast)
    cast: cat === 'structure' || cat === 'head' || cat === 'rotor' || cat === 'unit' && !['infantry', 'soldier', 'officer'].includes(key),
  };
}

// Build (once) and return the registry: { key: { key, cat, geometry, material, tris, radius, cast, head?, headY?,
// rotor?, rotorY?, rotorZ?, spots? } }. Head / rotor fields name other registry keys.
export function getModels() {
  if (built) return REG;
  built = true;
  for (const key in BUILDERS) {
    const [cat, fn] = BUILDERS[key];
    REG[key] = makeEntry(key, cat, fn());
  }
  REG.clinic_l2 = REG.hospital;
  for (const type of HEADED) {
    for (const lvl of [1, 2, 3]) {
      const k = modelKey(type, lvl);
      if (!k) continue;
      REG[k].head = headKey(type, lvl);
      REG[k].headY = headYFor(type);
      if (!UPGRADABLE.includes(type)) break;
    }
  }
  Object.assign(REG.wind, { rotor: 'wind_rotor', rotorY: WIND_HUB_Y, rotorZ: WIND_HUB_Z });
  for (const k of ['airfield', 'airfield_l2', 'airfield_l3']) REG[k].spots = AIRFIELD_SPOTS;
  return REG;
}

// key lists for integration
export const KEYS = {
  structures: ['hq', 'fire', 'police', 'clinic', 'hospital', 'school', 'college', 'park', 'plaza', 'wind', 'gas', 'watertower', 'pump',
    'mg', 'coastal', 'flak', 'missile', 'radar', 'barracks', 'airfield'],
  enemies: ['gunboat', 'landing', 'destroyer', 'battleship', 'fighter', 'bomber', 'jet', 'infantry'],
  allies: ['soldier', 'officer', 'ally_fighter'],
  projectiles: ['shell', 'bomb', 'missileP', 'rocketP', 'tracer'],
  vehicles: ['car_sedan', 'car_hatch', 'car_suv', 'taxi', 'police_car', 'van', 'ambulance', 'truck', 'bus', 'firetruck'],
  boats: ['ferry', 'trawler', 'yacht'],
  rubble: ['rubble', 'rubble_b'],
};

// Linear-space paint colours for traffic (instanceColor), weighted toward real-world greys
const lin = (h) => { _col.setHex(h); return [_col.r, _col.g, _col.b]; };
export const CAR_PAINTS = [0xe8e8e4, 0xe8e8e4, 0xa9adb0, 0xa9adb0, 0x26282b, 0x4a4e52, 0x2c3e5c, 0x8e2b25, 0x3a5f8a, 0x3f5e46, 0xbfb39a, 0x6b6f72].map(lin);
export const TAXI_PAINT = lin(0xd9a92b);
export const VAN_PAINTS = [0xe8e8e4, 0xe8e8e4, 0xa9adb0, 0x2c3e5c, 0x8e2b25, 0x3f5e46].map(lin);
export const BUS_PAINTS = [0x2e5a88, 0x8e2b25, 0x2f6b4f].map(lin);
export const BOAT_PAINTS = [0xb3402e, 0x2e5a88, 0x2f6b4f, 0x8e2b25].map(lin);
// projectile / tracer core tints (instanceColor): friendly warm yellow, hostile red-orange
export const TRACER_FRIENDLY = [1.0, 0.86, 0.55], TRACER_HOSTILE = [1.0, 0.42, 0.28];

// Write a spinning part (wind rotor): T(x,y,z) * Ry(yaw) * Rz(angle) * S(s) into the next pool slot.
// For the turbine: x += sin(yaw)*rotorZ, z += cos(yaw)*rotorZ, y += rotorY.
export function putSpin(pool, x, y, z, yaw, angle, s = 1, r = 1, g = 1, bl = 1) {
  if (pool.n >= pool.max) return -1;
  writeSpin(pool, pool.n, x, y, z, yaw, angle, s, r, g, bl);
  return pool.n++;
}
export function writeSpin(pool, slot, x, y, z, yaw, angle, s = 1, r = 1, g = 1, bl = 1) {
  const a = pool.mArr, o = slot * 16;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), ca = Math.cos(angle), sa = Math.sin(angle);
  a[o] = cy * ca * s; a[o + 1] = sa * s; a[o + 2] = -sy * ca * s; a[o + 3] = 0;
  a[o + 4] = -cy * sa * s; a[o + 5] = ca * s; a[o + 6] = sy * sa * s; a[o + 7] = 0;
  a[o + 8] = sy * s; a[o + 9] = 0; a[o + 10] = cy * s; a[o + 11] = 0;
  a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
  if (pool.cArr) { const k = slot * 3; pool.cArr[k] = r; pool.cArr[k + 1] = g; pool.cArr[k + 2] = bl; }
}
