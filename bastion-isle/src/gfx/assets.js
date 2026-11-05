import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getModels, registerModel, MB, M, mt, uberUnitMaterial } from './models.js';
import f16Bytes from '../../assets/models/jet-f16.glb';
import f35Bytes from '../../assets/models/jet-f35.glb';

// Embedded GLB models normalised to the house style (SPEC.md 5.6, UX review must_change 4):
// materials and textures are dropped; each vertex gets a palette colour + aPBR (roughness, metalness, emissive code,
// paint) baked from the source's palette texture and material, then scale, facing (+z) and pivot are fixed and our
// own markings and nav/strobe lights are added. The result is one uber-format BufferGeometry per model.
//
// Sources (see assets/credits/models.md):
//   jet-f16.glb, jet-f35.glb: munim-maps-vehicles 0.5.0 (Apache-2.0, Munim Technologies / sheehanmunim), simplified.

const SRC = {
  // hostile strike jet: dark hostile greys, red fin tops and wingtips
  jet_f35: { bytes: f35Bytes, length: 1.0, side: 'hostile', replaces: 'jet', maxTris: 1900 },
  // friendly interceptor: naval greys with a cyan fin flash
  ally_f16: { bytes: f16Bytes, length: 1.0, side: 'friendly', replaces: 'ally_fighter', maxTris: 1900 },
};

let loaded = null;

// Parse, normalise and register every embedded model. Resolves to the list of registered keys.
// opts.replace (default true): also point the gameplay keys ('jet', 'ally_fighter') at the imported models; the
// procedural originals stay available as 'jet_proc' / 'ally_fighter_proc'. Call once at boot BEFORE creating pools.
export function loadAssetModels(opts = {}) {
  if (loaded) return loaded;
  const replace = opts.replace !== false;
  const reg = getModels();
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loaded = (async () => {
    const keys = [];
    for (const key in SRC) {
      const s = SRC[key];
      try {
        const buf = s.bytes.buffer.slice(s.bytes.byteOffset, s.bytes.byteOffset + s.bytes.byteLength);
        const gltf = await loader.parseAsync(buf, '');
        const geo = await normaliseAircraft(gltf.scene, s);
        geo.name = key;
        const entry = {
          key, cat: 'unit', geometry: geo, material: uberUnitMaterial, tris: geo.index.count / 3,
          radius: geo.boundingSphere.radius, cast: true, source: 'asset',
        };
        registerModel(key, entry);
        if (replace && s.replaces) {
          if (!reg[s.replaces + '_proc']) registerModel(s.replaces + '_proc', reg[s.replaces]);
          registerModel(s.replaces, Object.assign({}, entry, { key: s.replaces }));
        }
        keys.push(key);
        disposeScene(gltf.scene);
      } catch (err) {
        console.warn('[models] could not load embedded model', key, err);
      }
    }
    return keys;
  })();
  return loaded;
}

function disposeScene(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        for (const k in m) if (m[k] && m[k].isTexture) { if (m[k].image && m[k].image.close) m[k].image.close(); m[k].dispose(); }
        m.dispose();
      }
    }
  });
}

// --- texture sampling (palette textures: flat colour cells, nearest lookup)

const texCache = new Map();
function texData(tex) {
  if (!tex || !tex.image) return null;
  if (texCache.has(tex)) return texCache.get(tex);
  const img = tex.image;
  const w = img.width, h = img.height;
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const d = { w, h, px: ctx.getImageData(0, 0, w, h).data, flipY: tex.flipY };
  texCache.set(tex, d);
  return d;
}
const s2l = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function sample(d, u, v, out) {
  u -= Math.floor(u); v -= Math.floor(v);
  const x = Math.min(d.w - 1, Math.floor(u * d.w));
  const y = Math.min(d.h - 1, Math.floor((d.flipY ? 1 - v : v) * d.h));
  const k = (y * d.w + x) * 4;
  out[0] = s2l(d.px[k] / 255); out[1] = s2l(d.px[k + 1] / 255); out[2] = s2l(d.px[k + 2] / 255);
  return out;
}

// --- palette mapping

const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
function sat(c) { const mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]); return mx > 1e-4 ? (mx - mn) / mx : 0; }

const HOSTILE = { dark: M.eDark, mid: M.eHull, light: M.eDeck, mark: M.eRed };
const FRIENDLY = { dark: mt(0x4a5157, 0.55, 0.25), mid: M.naval, light: mt(0x9aa2a8, 0.55, 0.25), mark: M.friendly };

// Map one source vertex colour to a house material. info: { emissive (linear rgb or null), glassy }
function recolor(c, info, pal) {
  if (info.emissive) {
    const e = info.emissive;
    if (e[0] > e[1] * 2) return M.navR;
    if (e[1] > e[0] * 2) return M.navG;
    return M.navW;
  }
  const L = lum(c), S = sat(c);
  // canopies are tinted gold/brown in the source: strongly saturated warm hue
  if (S > 0.45 && c[0] > c[2] * 1.6) return M.glass;
  if (S > 0.45 && c[2] > c[0] * 1.4) return M.glass;
  if (L > 0.72) return M.white; // missiles, pylons
  if (L < 0.035) return pal.dark;
  if (L < 0.12) return pal.mid;
  return pal.light;
}

// --- aircraft normalisation

const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _c = [0, 0, 0];
const _n3 = new THREE.Matrix3();

async function normaliseAircraft(root, s) {
  root.updateMatrixWorld(true);
  const verts = []; // {p: Vector3, n: Vector3, m: material spec}
  const tris = [];
  const pal = s.side === 'hostile' ? HOSTILE : FRIENDLY;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
    _n3.getNormalMatrix(o.matrixWorld);
    const groups = g.groups.length ? g.groups : [{ start: 0, count: g.index ? g.index.count : pos.count, materialIndex: 0 }];
    const idx = g.index ? g.index.array : null;
    for (const grp of groups) {
      const mat = mats[grp.materialIndex || 0] || mats[0];
      const td = mat.map ? texData(mat.map) : null;
      const em = mat.emissive && (mat.emissive.r + mat.emissive.g + mat.emissive.b) * (mat.emissiveIntensity || 1) > 0.05 ? [mat.emissive.r, mat.emissive.g, mat.emissive.b] : null;
      const remap = new Map();
      for (let k = grp.start; k < grp.start + grp.count; k += 3) {
        const tri = [];
        for (let j = 0; j < 3; j++) {
          const vi = idx ? idx[k + j] : k + j;
          let ni = remap.get(vi);
          if (ni === undefined) {
            const p = new THREE.Vector3().fromBufferAttribute(pos, vi).applyMatrix4(o.matrixWorld);
            const n = nor ? new THREE.Vector3().fromBufferAttribute(nor, vi).applyMatrix3(_n3).normalize() : new THREE.Vector3(0, 1, 0);
            if (td && uv) sample(td, uv.getX(vi), uv.getY(vi), _c); else { _c[0] = 1; _c[1] = 1; _c[2] = 1; }
            const col = [_c[0] * mat.color.r, _c[1] * mat.color.g, _c[2] * mat.color.b];
            ni = verts.length;
            verts.push({ p, n, m: recolor(col, { emissive: em }, pal) });
            remap.set(vi, ni);
          }
          tri.push(ni);
        }
        tris.push(tri);
      }
    }
  });
  // facing: the tail (highest fin vertex) must be at -z
  const box = new THREE.Box3();
  let top = verts[0];
  for (const v of verts) { box.expandByPoint(v.p); if (v.p.y > top.p.y) top = v; }
  const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const flip = top.p.z > ctr.z ? -1 : 1; // rotate 180 degrees about y if the tail is at +z
  const k = s.length / size.z;
  for (const v of verts) {
    v.p.sub(ctr); v.p.x *= flip * k; v.p.z *= flip * k; v.p.y *= k;
    v.n.x *= flip; v.n.z *= flip;
  }
  const half = { x: size.x * k / 2, y: size.y * k / 2, z: size.z * k / 2 };
  // markings: fin tops (rear, high) and wingtips
  for (const v of verts) {
    if (v.m === M.glass || v.m.a[2]) continue;
    // fin flash: the upper part of the tail fins
    if (v.p.y > half.y * 0.5 && v.p.z < -half.z * 0.3) v.m = pal.mark;
  }
  // decimate by vertex clustering if over the unit budget (positions snap to cluster means; collapsed tris drop)
  if (s.maxTris && tris.length > s.maxTris) decimate(verts, tris, s.maxTris, s.length);
  // build the uber geometry
  const n = verts.length;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), A = new Uint8Array(n * 4);
  verts.forEach((v, i) => {
    P[i * 3] = v.p.x; P[i * 3 + 1] = v.p.y; P[i * 3 + 2] = v.p.z;
    N[i * 3] = v.n.x; N[i * 3 + 1] = v.n.y; N[i * 3 + 2] = v.n.z;
    C[i * 3] = v.m.r; C[i * 3 + 1] = v.m.g; C[i * 3 + 2] = v.m.b;
    A.set(v.m.a, i * 4);
  });
  const I = [];
  for (const t of tris) if (!t.dead) I.push(t[0], t[1], t[2]); // a 180 degree turn keeps the winding
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.setAttribute('aPBR', new THREE.BufferAttribute(A, 4, true));
  g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
  // our lights: wingtip nav (port red at +x, starboard green at -x), fin strobe, belly beacon, engine glow
  let left = verts[0], right = verts[0], tail = verts[0], fin = verts[0];
  for (const v of verts) {
    if (v.p.x > left.p.x) left = v;
    if (v.p.x < right.p.x) right = v;
    if (v.p.z < tail.p.z && Math.abs(v.p.x) < half.x * 0.15 && Math.abs(v.p.y) < half.y * 0.4) tail = v;
    if (v.p.y > fin.p.y) fin = v;
  }
  const b = new MB();
  const ls = 0.014;
  b.box(ls, ls, ls * 1.6, M.navR, left.p.x, left.p.y - ls / 2, left.p.z);
  b.box(ls, ls, ls * 1.6, M.navG, right.p.x, right.p.y - ls / 2, right.p.z);
  b.box(ls, ls, ls, M.strobe, fin.p.x, fin.p.y, fin.p.z);
  b.box(ls, ls, ls, M.beacon, 0, -half.y * 0.35, 0.0);
  b.cyl(0.026, 0.026, 0.006, 10, M.glow, 0, tail.p.y, tail.p.z - 0.004, { rx: -Math.PI / 2 });
  // hostile insignia: red triangles on the upper wing surfaces (found by sampling the highest wing vertex)
  if (s.side === 'hostile') {
    for (const sx of [1, -1]) {
      const wx = sx * half.x * 0.5, wz = -half.z * 0.12;
      let wy = -Infinity;
      for (const v of verts) if (Math.abs(v.p.x - wx) < half.x * 0.12 && Math.abs(v.p.z - wz) < half.z * 0.12 && v.n.y > 0.5) wy = Math.max(wy, v.p.y);
      if (wy === -Infinity) continue;
      const sz = half.x * 0.28;
      b.prism([[wx - sz * 0.5, wz - sz * 0.4], [wx + sz * 0.5, wz - sz * 0.4], [wx, wz + sz * 0.5]], 0.004, M.eRed, 0, wy + 0.002, 0);
    }
  }
  const extra = b.build();
  const out = mergeGeometries([g, extra], false);
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

function decimate(verts, tris, maxTris, length) {
  const orig = verts.map((v) => v.p.clone());
  let step = length * 0.004;
  for (let iter = 0; iter < 24; iter++) {
    const cells = new Map();
    const key = new Array(verts.length);
    verts.forEach((v, i) => {
      const k = Math.floor(orig[i].x / step) + ',' + Math.floor(orig[i].y / step) + ',' + Math.floor(orig[i].z / step);
      key[i] = k;
      let c = cells.get(k);
      if (!c) cells.set(k, (c = { x: 0, y: 0, z: 0, n: 0 }));
      c.x += orig[i].x; c.y += orig[i].y; c.z += orig[i].z; c.n++;
    });
    let alive = 0;
    for (const t of tris) {
      t.dead = key[t[0]] === key[t[1]] || key[t[1]] === key[t[2]] || key[t[0]] === key[t[2]];
      if (!t.dead) alive++;
    }
    if (alive <= maxTris || iter === 23) {
      verts.forEach((v, i) => { const c = cells.get(key[i]); v.p.set(c.x / c.n, c.y / c.n, c.z / c.n); });
      return alive;
    }
    step *= 1.25;
  }
  return tris.length;
}
