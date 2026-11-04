// Pointy-top hex grid in axial coordinates (q, r). A hex has circumradius 1, so neighbouring
// centres are SQRT3 apart and every corner points along ±z.
export const SQRT3 = Math.sqrt(3);
export const STEP = SQRT3; // world distance between neighbouring tile centres

// Neighbour offsets, going round counter-clockwise from +x
export const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

export const hexX = (q, r) => SQRT3 * (q + r / 2);
export const hexZ = (q, r) => 1.5 * r;

// Unit vectors from a centre towards each neighbour
export const DIR_X = DIRS.map(([q, r]) => hexX(q, r) / SQRT3);
export const DIR_Z = DIRS.map(([q, r]) => hexZ(q, r) / SQRT3);

export function hexDist(q1, r1, q2, r2) {
  const dq = q1 - q2, dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

const _ax = { q: 0, r: 0 };
export function worldToAxial(x, z, out = _ax) {
  const qf = (SQRT3 / 3) * x - z / 3;
  const rf = (2 / 3) * z;
  const sf = -qf - rf;
  let q = Math.round(qf), r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  out.q = q; out.r = r;
  return out;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
