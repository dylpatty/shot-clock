import * as THREE from 'three';
import { U, MAP_MIN, MAP_SIZE, ringSet } from './uniforms.js';
import { W } from '../world.js';

// Info-view overlays drawn INSIDE the ground shaders (terrain, roads, water) so they follow hills and work over
// the sea: per-hex overlay (U.uOverlayTex by tile index), smooth map-space field (U.uFieldTex), range rings
// (U.uRings), defence coverage (U.uCoverTex), hex grid lines (U.uGrid), hovered tile (U.uHighlightTile) and the
// clay look (U.uClay). See SPEC.md 5.4, UX review must-6 / concrete specs 11, 12, 14.
//
// Everything here is a uniform or a texture *content* change: switching views never changes a shader program.

const tex1 = (r, g, b, a) => { const t = new THREE.DataTexture(new Uint8Array([r, g, b, a]), 1, 1); t.needsUpdate = true; return t; };
const lin = (hex) => new THREE.Color(hex); // THREE.Color.setHex converts sRGB palette tokens to linear

// Ground-module uniforms (shared by the terrain, road, lamp and water materials; not part of core's U)
export const GU = {
  uDetail: { value: tex1(128, 128, 128, 128) },  // R grass G sand B rock A dirt   (detail ratio * 0.5)
  uDetail2: { value: tex1(128, 128, 128, 128) }, // R asphalt G concrete paving B cliff A macro noise
  uDetail3: { value: tex1(128, 128, 0, 128) },   // R sidewalk slabs G gravel B caustics A macro noise 2
  uSplat: { value: tex1(0, 0, 0, 0) },           // map-space R sand G rock B dirt A urban (grass = rest)
  uSplat2: { value: tex1(0, 255, 0, 0) },        // map-space R forest G ambient occlusion B yard A industrial
  uCoast: { value: tex1(255, 0, 0, 0) },         // map-space R sea distance to the waterline, G signed coast dist
  uHexR: { value: 32 },                          // map radius (tile-index formula in the water shader)
  uZoneView: { value: 0 },                       // zoning tool: lot borders, empty-lot tints, eligible tiles
  uZoneCurb: { value: 0.3 },                    // normal view: thin zone line on a lot's road-facing edge
  uCoverCol: { value: [lin(0x36b3e8), lin(0xa78bfa), lin(0xede3c8)] }, // sea, air, ground (UX tokens)
  uZoneCol: { value: [lin(0x5dbb63), lin(0x4c9be8), lin(0xe0a040)] },  // R, C, I
};

// ---------------------------------------------------------------------------------------------------- GLSL
// Shared by every ground shader. Needs U and GU uniforms bound under the same names.
export const OVERLAY_GLSL = /* glsl */`
uniform sampler2D uOverlayTex, uFieldTex, uCoverTex;
uniform float uOverlayW, uOverlayMix, uFieldMix, uCoverMix, uGrid, uClay, uHighlightTile, uHexR, uTime, uNight;
uniform vec4 uRings[8];
uniform vec3 uRingCol[8];
uniform int uRingCount;
uniform vec3 uCoverCol[3];
uniform vec2 uMapMin;
uniform float uMapSize;

// pointy-top hex with circumradius 1: distance from p (hex-local) to the nearest edge, positive inside
float bgHexEdge(vec2 p) {
  vec2 a = abs(p);
  return 0.8660254 - max(a.x, a.x * 0.5 + a.y * 0.8660254);
}
// world xz -> rounded axial (q, r), same as hex.js worldToAxial
vec2 bgAxial(vec2 w) {
  float qf = 0.57735027 * w.x - w.y / 3.0;
  float rf = 0.66666667 * w.y;
  float sf = -qf - rf;
  float q = floor(qf + 0.5), r = floor(rf + 0.5), s = floor(sf + 0.5);
  float dq = abs(q - qf), dr = abs(r - rf), ds = abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
  return vec2(q, r);
}
vec2 bgHexCenter(vec2 qr) { return vec2(1.7320508 * (qr.x + qr.y * 0.5), 1.5 * qr.y); }
// tile index of (q, r) in world.js order (q outer loop, r inner, |q + r| <= R), -1 off the map
float bgTileIndex(vec2 qr) {
  float R = uHexR, q = qr.x, r = qr.y;
  if (abs(q) > R || abs(r) > R || abs(q + r) > R) return -1.0;
  float before;
  if (q <= 0.0) { float m = q + R; before = m * (R + 1.0) + m * (m - 1.0) * 0.5; }
  else before = R * (R + 1.0) + R * (R - 1.0) * 0.5 + q * (2.0 * R + 1.0) - q * (q - 1.0) * 0.5;
  return before + r - (q <= 0.0 ? -R - q : -R);
}

// Info-view layers on top of the (already clay-mixed) albedo. wxz: world xz; tile: tile index or -1;
// local: hex-local position (tile centre at 0); px: world units per pixel; gridK scales the grid lines. Adds a little emissive so overlays
// stay readable at night.
void bgOverlays(vec2 wxz, float tile, vec2 local, float px, float gridK, inout vec3 col, inout vec3 emi) {
  vec2 muv = (wxz - uMapMin) / uMapSize;
  float glow = 0.08 + 0.5 * uNight;
  float he = bgHexEdge(local);
  if (uOverlayMix > 0.001 && tile >= 0.0) {
    int ti = int(tile + 0.5), ow = int(uOverlayW + 0.5);
    vec4 ov = texelFetch(uOverlayTex, ivec2(ti % ow, ti / ow), 0);
    float a = ov.a * uOverlayMix;
    float rim = 1.0 - smoothstep(0.025, 0.025 + 1.5 * px, he);
    vec3 oc = ov.rgb * (1.0 - 0.3 * rim);
    col = mix(col, oc, a);
    emi += oc * a * glow;
  }
  if (uFieldMix > 0.001) {
    vec4 fv = texture(uFieldTex, muv);
    float a = fv.a * uFieldMix;
    col = mix(col, fv.rgb, a);
    emi += fv.rgb * a * glow;
  }
  if (uCoverMix > 0.001) {
    vec3 cv = texture(uCoverTex, muv).rgb;
    vec3 fw = max(fwidth(cv), vec3(1e-4));
    vec3 fillC = vec3(0.0); float n = 0.0; vec3 edgeC = vec3(0.0); float edge = 0.0;
    for (int k = 0; k < 3; k++) {
      float c = cv[k];
      float inside = smoothstep(0.25 - fw[k], 0.25 + fw[k], c);
      float e = 1.0 - smoothstep(0.6, 1.6, abs(c - 0.25) / fw[k]);
      float dens = 1.0 + 0.9 * smoothstep(0.5, 1.0, c);
      fillC += uCoverCol[k] * inside * dens; n += inside;
      if (e > edge) { edge = e; edgeC = uCoverCol[k]; }
    }
    float m = uCoverMix;
    col *= 1.0 - 0.18 * m * (1.0 - min(n, 1.0));              // gaps read darker
    col = mix(col, fillC / max(n, 1.0), min(n, 1.0) * 0.22 * m);
    col = mix(col, edgeC, edge * 0.9 * m);
    emi += (fillC / max(n, 1.0)) * min(n, 1.0) * 0.22 * m * glow + edgeC * edge * m * (0.25 + glow);
  }
  for (int k = 0; k < 8; k++) {
    if (k >= uRingCount) break;
    vec4 rg = uRings[k];
    vec3 rc = uRingCol[k];
    vec2 dv = wxz - rg.xy;
    float dist = length(dv);
    float d = dist - rg.z;
    float style = rg.w;
    float hw = style > 1.5 ? 0.02 + 0.5 * px : 0.03 + 0.75 * px;
    float line = 1.0 - smoothstep(hw - 0.5 * px, hw + 0.5 * px, abs(d));
    float ang = atan(dv.y, dv.x);
    if (style > 0.5 && style < 1.5) {               // dashed placement ring, marching at 0.5u/s
      float f = fract((ang * rg.z - uTime * 0.5) / 0.7);
      float aa = px / 0.7;
      line *= smoothstep(0.0, aa, f) * (1.0 - smoothstep(0.55 - aa, 0.55, f));
    }
    float tick = 0.0, fill = 0.0;
    if (style < 1.5) {
      float arc = abs(fract(ang / 0.2617994 + 0.5) - 0.5) * 0.2617994 * dist;  // every 15 degrees
      tick = (1.0 - smoothstep(hw * 0.5, hw * 0.5 + px, arc)) * step(-0.3, d) * step(d, 0.0);
      fill = (1.0 - smoothstep(-px, px, d)) * 0.07;
    }
    float a = max(line, tick * 0.85);
    col = mix(col, rc, max(a, fill));
    emi += rc * (a * (0.3 + glow) + fill * glow);
  }
  if (uGrid > 0.001 && tile >= 0.0) {
    float g = (1.0 - smoothstep(0.25 * px, 1.25 * px, he)) * gridK;
    col = mix(col, vec3(1.0), g * 0.35 * uGrid);
    emi += vec3(g * 0.25 * uGrid * glow);
  }
  if (tile >= 0.0 && abs(tile - uHighlightTile) < 0.5) {
    float g = 1.0 - smoothstep(0.035, 0.035 + 1.5 * px, he);
    col = mix(col, vec3(1.0), g * 0.35 + 0.06);
    emi += vec3(g * 0.2 * (0.3 + glow));
  }
}
`;

// Uniform table for ShaderMaterial/onBeforeCompile: everything OVERLAY_GLSL declares
export function overlayUniforms() {
  return {
    uOverlayTex: U.uOverlayTex, uOverlayW: U.uOverlayW, uOverlayMix: U.uOverlayMix,
    uFieldTex: U.uFieldTex, uFieldMix: U.uFieldMix, uCoverTex: U.uCoverTex, uCoverMix: U.uCoverMix,
    uGrid: U.uGrid, uClay: U.uClay, uHighlightTile: U.uHighlightTile, uTime: U.uTime, uNight: U.uNight,
    uRings: U.uRings, uRingCol: U.uRingCol, uRingCount: U.uRingCount, uMapMin: U.uMapMin, uMapSize: U.uMapSize,
    uHexR: GU.uHexR, uCoverCol: GU.uCoverCol,
  };
}

// ---------------------------------------------------------------------------------------------------- state
const OVERLAY_W = 64; // tiles per texel row of the per-hex overlay texture
let overlayTex = null, fieldTex = null, coverTex = null;
const COVER_N = 256;
let coverData = null, coverCount = null;
const fade = {
  overlay: { cur: 0, target: 0 }, field: { cur: 0, target: 0 }, cover: { cur: 0, target: 0 },
  clay: { cur: 0, target: 0 }, zone: { cur: 0, target: 0 },
};
const FADE_RATE = 4; // 1 / 0.25 s

// perTileRGBA: Uint8Array(W.count * 4), sRGB colour + alpha per tile (null turns the view off).
// opts.clay (default true) fades the colour scene to the clay look while the view is on.
export function setInfoView(perTileRGBA, opts = {}) {
  if (!perTileRGBA) {
    fade.overlay.target = 0;
    if (!fade.field.target && !fade.cover.target) fade.clay.target = 0;
    return;
  }
  const rows = Math.ceil(W.count / OVERLAY_W);
  if (!overlayTex || overlayTex.image.height !== rows) {
    if (overlayTex) overlayTex.dispose();
    overlayTex = new THREE.DataTexture(new Uint8Array(OVERLAY_W * rows * 4), OVERLAY_W, rows);
    overlayTex.colorSpace = THREE.SRGBColorSpace;
    overlayTex.magFilter = overlayTex.minFilter = THREE.NearestFilter;
    overlayTex.generateMipmaps = false;
  }
  overlayTex.image.data.set(perTileRGBA.subarray(0, Math.min(perTileRGBA.length, W.count * 4)));
  overlayTex.needsUpdate = true;
  U.uOverlayTex.value = overlayTex;
  U.uOverlayW.value = OVERLAY_W;
  fade.overlay.target = 1;
  fade.clay.target = opts.clay === false ? 0 : 1;
}

// rgba: Uint8Array(size * size * 4) over the map bounds (MAP_MIN, MAP_SIZE), row 0 at z = MAP_MIN, sRGB colour +
// alpha. null turns the field off. Updating the data while it is shown is fine (texture upload only).
export function setField(rgba, size = Math.round(Math.sqrt(rgba ? rgba.length / 4 : 1)), opts = {}) {
  if (!rgba) {
    fade.field.target = 0;
    if (!fade.overlay.target && !fade.cover.target) fade.clay.target = 0;
    return;
  }
  if (!fieldTex || fieldTex.image.width !== size) {
    if (fieldTex) fieldTex.dispose();
    fieldTex = new THREE.DataTexture(new Uint8Array(size * size * 4), size, size);
    fieldTex.colorSpace = THREE.SRGBColorSpace;
    fieldTex.magFilter = fieldTex.minFilter = THREE.LinearFilter;
    fieldTex.wrapS = fieldTex.wrapT = THREE.ClampToEdgeWrapping;
    fieldTex.generateMipmaps = false;
  }
  fieldTex.image.data.set(rgba.subarray(0, size * size * 4));
  fieldTex.needsUpdate = true;
  U.uFieldTex.value = fieldTex;
  fade.field.target = 1;
  fade.clay.target = opts.clay === false ? 0 : 1;
}

// Range rings: list of { x, z, r, style (0 solid + ticks, 1 dashed marching, 2 thin coverage edge), color }.
// Up to 8; colour is a hex number (sRGB), default white.
export function setRings(list) { ringSet(list || []); }

// Defence coverage. towers: [{ x, z, range, domains }] with domains a bitmask (1 sea, 2 air, 4 ground) or an
// array of 'sea' | 'air' | 'ground'. Rebuilds the 256x256 coverage texture (call when towers change, not per
// frame). Encoding per channel (R sea, G air, B ground): 0.5 * antialiased union + 0.125 * (count - 1), so the
// coverage edge is the 0.25 iso-line and overlap of several towers reads denser.
const DOM = { sea: 1, air: 2, ground: 4 };
export function rebuildCoverage(towers) {
  const N = COVER_N, cell = MAP_SIZE / N;
  if (!coverData) {
    coverData = new Uint8Array(N * N * 4);
    coverCount = new Float32Array(N * N * 6); // union (3) + count (3)
    coverTex = new THREE.DataTexture(coverData, N, N);
    coverTex.magFilter = coverTex.minFilter = THREE.LinearFilter;
    coverTex.generateMipmaps = false;
    coverTex.colorSpace = THREE.NoColorSpace;
    U.uCoverTex.value = coverTex;
  }
  coverCount.fill(0);
  for (const t of towers || []) {
    let mask = t.domains;
    if (Array.isArray(mask)) mask = mask.reduce((m, d) => m | (DOM[d] || 0), 0);
    if (typeof mask === 'string') mask = DOM[mask] || 0;
    mask = mask == null ? 7 : mask | 0;
    const r = t.range;
    if (!(r > 0) || !mask) continue;
    const x0 = Math.max(0, Math.floor((t.x - r - 1 - MAP_MIN) / cell)), x1 = Math.min(N - 1, Math.ceil((t.x + r + 1 - MAP_MIN) / cell));
    const z0 = Math.max(0, Math.floor((t.z - r - 1 - MAP_MIN) / cell)), z1 = Math.min(N - 1, Math.ceil((t.z + r + 1 - MAP_MIN) / cell));
    for (let tz = z0; tz <= z1; tz++) {
      const wz = MAP_MIN + (tz + 0.5) * cell - t.z;
      for (let tx = x0; tx <= x1; tx++) {
        const wx = MAP_MIN + (tx + 0.5) * cell - t.x;
        const d = Math.sqrt(wx * wx + wz * wz);
        const u = Math.min(1, Math.max(0, (r - d) / cell + 0.5));
        if (u <= 0) continue;
        const k = (tz * N + tx) * 6;
        for (let c = 0; c < 3; c++) {
          if (!(mask & (1 << c))) continue;
          if (u > coverCount[k + c]) coverCount[k + c] = u;
          if (d < r) coverCount[k + 3 + c] += 1;
        }
      }
    }
  }
  for (let p = 0, n = N * N; p < n; p++) {
    for (let c = 0; c < 3; c++) {
      const v = 0.5 * coverCount[p * 6 + c] + 0.125 * Math.min(4, Math.max(0, coverCount[p * 6 + 3 + c] - 1));
      coverData[p * 4 + c] = Math.round(Math.min(1, v) * 255);
    }
    coverData[p * 4 + 3] = 255;
  }
  coverTex.needsUpdate = true;
}
export const setCoverage = rebuildCoverage;

// 0..1 strength of the coverage view (0.5 is what the placement tool uses per the UX review)
export function setCoverageView(strength, opts = {}) {
  fade.cover.target = Math.max(0, Math.min(1, strength || 0));
  if (fade.cover.target > 0 && opts.clay) fade.clay.target = 1;
  if (!fade.cover.target && !fade.overlay.target && !fade.field.target) fade.clay.target = 0;
}
export function setClay(on) { fade.clay.target = on ? 1 : 0; }
export function setGrid(strength) { U.uGrid.value = Math.max(0, strength || 0); }
export function setZoneView(strength) { fade.zone.target = Math.max(0, Math.min(1, +strength || 0)); }
export function setHighlightTile(i) { U.uHighlightTile.value = i == null ? -1 : i; }

// per-frame: ease the view strengths (250 ms)
export function overlayFrame(dt) {
  for (const k in fade) {
    const f = fade[k];
    if (f.cur === f.target) continue;
    const s = FADE_RATE * dt;
    f.cur = f.cur < f.target ? Math.min(f.target, f.cur + s) : Math.max(f.target, f.cur - s);
  }
  const e = (x) => x * x * (3 - 2 * x);
  U.uOverlayMix.value = e(fade.overlay.cur);
  U.uFieldMix.value = e(fade.field.cur);
  U.uCoverMix.value = e(fade.cover.cur);
  U.uClay.value = e(fade.clay.cur);
  GU.uZoneView.value = e(fade.zone.cur);
}

// jump straight to the targets (tests, screenshots)
export function overlaySnap() { for (const k in fade) fade[k].cur = fade[k].target; overlayFrame(0); }
