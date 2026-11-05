import * as THREE from 'three';
import { Pool } from './pools.js';
import { U } from './uniforms.js';
import { W, LF, T, isLand } from '../world.js';
import { DIR_X, DIR_Z } from '../hex.js';
import { GROWTH } from '../defs.js';

// Zoned-lot buildings (SPEC.md 5.3, rendering review must_change 5/6, UX review must_change 4/5, concrete 8-10).
//
// Everything a lot shows is "kit-instanced": a handful of InstancedMesh pools that all share ONE patched
// MeshStandardMaterial (plus its depth variant), so the whole growable city costs 6 draw calls whatever its variety:
//   box      unit box (no bottom): every building body, scaffold, rooftop AC/antenna/solar, hedges, fences,
//            containers, pallets, paths, parking, cars, rubble chunks
//   roof     pitched-roof prism; the vertex shader moves the ridge per instance -> gable, hip, mono-pitch, sawtooth
//   parapet  parapet ring for flat roofs (constant 0.028u wall thickness whatever the instance scale)
//   cyl      12-sided cylinder with top cap: tanks, silos, chimneys, rooftop water tanks
//   pad      hex lot pad: lawn (R), paving (C), concrete yard (I), construction dirt, rubble
//   crane    tower crane for L3 construction (mast height and slewing in the vertex shader)
// Facades are drawn procedurally in the fragment shader from world-space storey height (0.25u) and instance scale,
// so windows keep their size on any body. Night windows, shop signs, fire flicker, abandoned and construction
// looks are all per-instance attributes evaluated against shared uniforms: nothing is uploaded per frame.
//
// Instances are written into per-tile slot ranges (Slots below); a lot change rewrites only that tile's range and
// uploads it with addUpdateRange.

// ------------------------------------------------------------------------------------------------ constants
export const P = { BOX: 0, ROOF: 1, PARAPET: 2, CYL: 3, PAD: 4, CRANE: 5 };
const POOL_MAX = [26000, 4000, 4000, 5000, 2000, 96];
const POOL_TILE_MAX = [96, 16, 12, 24, 2, 2]; // per-lot staging capacity

// surface types (aP.x)
const S = {
  PLAIN: 0, HOUSE: 1, APT: 2, OFFICE: 3, SHOP: 4, SHED: 5, SCAF: 6, RUBBLE: 7, HEDGE: 8, FENCE: 9, CONT: 10,
  WOOD: 11, ASPH: 12, PAVE: 13, METAL: 14, SOLAR: 15, TANK: 16, CHIM: 17, PAD: 18, CRANE: 19, CAR: 20, GLASS: 21,
  HOARD: 22, AWN: 23, FRAME: 24, ROOF: 25, WATER: 26, PLANTER: 27, STONE: 28,
};
// flags (aP.w)
const F = { ABAND: 1, CONSTR: 2, SCAF: 4, SHOP: 8, DOOR: 16, NOWIN: 32, BALC: 64, FINS: 128, RIBBON: 256 };

const STRIDE = 30; // floats per staged instance: matrix 16, colour 3, colour2 3, aP 4, aT 4

// ------------------------------------------------------------------------------------------------ palette
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const PAL = {
  walls: [0xECE6DA, 0xE1D2B4, 0xD7B38B, 0xC98E6A, 0xB8C1AE, 0xA8B5C1, 0x9C4E3E, 0xB4B1A9].map(lin),
  terra: lin(0xA5553A), slate: lin(0x4E5661), gravel: lin(0x8E8B84), sheet: lin(0x9AA1A6), membrane: lin(0xB9B6AE),
  darkRoof: lin(0x5A5C5E),
  glassTint: [0x6F8798, 0x7C8C88, 0x7D7468, 0x8E9AA4, 0x5E7486].map(lin),
  mullion: [0xB4B1A9, 0x4E5661, 0xD9D6CF, 0x3A3D41].map(lin),
  shed: lin(0xA7ACAE), redox: lin(0x8C3A2C), chimRed: lin(0xB8382C), chimWhite: lin(0xEDEAE2),
  concrete: lin(0xA09D95), concreteDark: lin(0x85837D), asphalt: lin(0x3A3D41), paving: lin(0x9C9991),
  curb: lin(0xC2BEB4), hedge: lin(0x4A6136), hedge2: lin(0x55693D), lawn: lin(0x5B7040), white: lin(0xEDEAE2),
  picket: lin(0xE6E2D6), woodFence: lin(0x8A6A48), chain: lin(0x9AA0A3), wood: lin(0xB08A5A),
  scafA: lin(0xE8893A), scafB: lin(0xF2F0EA), hoardA: lin(0xE6E2D6), hoardB: lin(0x3C5C7A),
  crane: lin(0xE0B030), metal: lin(0xB8BCBE), metalDark: lin(0x6E7477), solar: lin(0x1E2A3C),
  water: lin(0x4FB6C8), rubble: lin(0x8A867E),
  cont: [0x8C3A2C, 0x3E6A8E, 0x4C6B48, 0xA7ACAE, 0xC2622D, 0xD8D2C4, 0x7A838A].map(lin),
  cars: [0xE6E2D6, 0x2B2F33, 0x8E949A, 0x9C3A2E, 0x3A5677, 0xC9C2B0, 0x4F5A4A, 0x6E7579].map(lin),
  awn: [0x9C3A2E, 0x2F5F4A, 0x3A5677, 0xD6AE3A, 0x4E5661].map(lin),
  sign: [0xA0473C, 0xC2A452, 0xE6E2D6, 0x3E6688, 0x3F7458].map(lin),
  towerWalls: [0xD9D6CF, 0xB4B1A9, 0xA8B5C1, 0xE1D2B4, 0xC8C4BA, 0x9C4E3E, 0xB8C1AE, 0x9A978F, 0xECE6DA].map(lin),
};
const ZERO3 = [0, 0, 0];

// ------------------------------------------------------------------------------------------------ uniforms
// City-local uniforms (lit window fractions per zone are driven from cityFrame). Everything else is shared U.
export const CU = {
  uCityLit: { value: new THREE.Vector3(0.03, 0.15, 0.4) },
};

// ------------------------------------------------------------------------------------------------ GLSL
// Shared hash/noise helpers, also used by trees.js
export const GLSL_HASH = /* glsl */`
float cHash(vec3 p) {
  uvec3 q = uvec3(ivec3(floor(p)) + ivec3(1048576));
  uint h = q.x * 0x8da6b343u ^ q.y * 0xd8163841u ^ q.z * 0xcb1ab31fu;
  h ^= h >> 16; h *= 0x7feb352du; h ^= h >> 15; h *= 0x846ca68bu; h ^= h >> 16;
  return float(h & 0x00ffffffu) * (1.0 / 16777216.0);
}
float cNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = cHash(vec3(i, 7.0)), b = cHash(vec3(i + vec2(1.0, 0.0), 7.0));
  float c = cHash(vec3(i + vec2(0.0, 1.0), 7.0)), d = cHash(vec3(i + vec2(1.0, 1.0), 7.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
`;

const GLSL_COMMON = /* glsl */`
attribute vec2 aK;
attribute vec3 aCol2;
attribute vec4 aP;
attribute vec4 aT;
uniform float uGameTime;
uniform float uTime;
vec3 cityScale() {
  return max(vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)), vec3(1e-4));
}
// Per-instance deformation shared by the colour and the shadow-depth programs.
vec3 cityDeform(vec3 p, vec3 sc) {
  int kind = int(aK.x + 0.5);
  int sub = int(aK.y + 0.5);
  int fl = int(aP.w + 0.5);
  if (kind == 0 && (fl & 2) != 0) {
    // construction: the structure tops out at prog * total height; aCol2.x = this body's base above the lot
    float prog = clamp((uGameTime - aT.x) / max(aT.y, 0.1), 0.0, 1.0);
    float hcur = prog * aT.w - aCol2.x;
    if ((fl & 4) != 0) {
      float top = clamp(hcur + 0.05, 0.0, sc.y + 0.05);
      float bot = clamp(hcur - 0.55, 0.0, sc.y);
      p.y = mix(bot, max(top, bot + 0.002), p.y) / sc.y;
    } else {
      p.y *= max(clamp(hcur, 0.0, sc.y), 0.002) / sc.y;
    }
  } else if (kind == 1 && (sub & 1) != 0) {
    // pitched roof ridge: aT.w = hip amount (0 gable .. 1 full hip), aT.x = ridge z offset (+-0.5 = mono-pitch)
    float hipHalf = max(0.0, 0.5 - 0.5 * sc.z / sc.x);
    p.x = sign(p.x) * mix(0.5, hipHalf, aT.w);
    p.z = aT.x;
  } else if (kind == 2 && (sub & 1) != 0) {
    p.x = sign(p.x) * max(0.0, 0.5 - 0.028 / sc.x);
    p.z = sign(p.z) * max(0.0, 0.5 - 0.028 / sc.z);
  } else if (kind == 5) {
    float H = aT.w;
    if (sub == 0) p.y *= H;
    else if (sub == 1) {
      float a = aP.y * 6.2831 + 0.9 * sin(uTime * 0.06 + aP.y * 40.0);
      float c = cos(a), s = sin(a);
      p.xz = mat2(c, -s, s, c) * p.xz;
      p.y += H;
    }
  }
  return p;
}
`;

const VERT_PARS = /* glsl */`
${GLSL_COMMON}
varying vec3 vCF;   // facade coords: u (along face, world units), v (height above body base), face id
varying vec3 vCL;   // face length, body height, geometry kind
varying vec4 vCP;   // surface type, seed, zone, flags
varying vec4 vCT;   // t0, dur, fire, param
varying vec3 vC2;   // secondary colour
varying vec3 vWP;   // world position
`;

const VERT_MAIN = /* glsl */`
  vec3 csc = cityScale();
  vec3 transformed = cityDeform(vec3(position), csc);
  {
    int kind = int(aK.x + 0.5);
    vec3 n = normal;
    float face = 2.0, L = csc.x;
    vec2 fc;
    if (kind == 3) {
      if (n.y > 0.5) { face = 3.0; fc = transformed.xz * csc.xz; }
      else { face = 2.0; fc = vec2(aK.y * 3.14159 * csc.x, transformed.y * csc.y); L = 3.14159 * csc.x; }
    } else if (kind == 1 || kind == 5) {
      face = 4.0; fc = vec2(transformed.x * csc.x, transformed.y * csc.y);
    } else if (kind == 4) {
      if (n.y > 0.5) { face = 3.0; fc = transformed.xz * csc.xz; } else { face = 2.0; fc = vec2(transformed.x + transformed.z, transformed.y) * csc.xy; }
    } else {
      if (abs(n.y) > 0.5) { face = n.y > 0.0 ? 3.0 : 5.0; fc = transformed.xz * csc.xz; }
      else if (abs(n.z) > 0.5) { face = n.z > 0.0 ? 0.0 : 1.0; fc = vec2(transformed.x * csc.x * sign(n.z), transformed.y * csc.y); L = csc.x; }
      else { face = 2.0; fc = vec2(-transformed.z * csc.z * sign(n.x), transformed.y * csc.y); L = csc.z; }
    }
    vCF = vec3(fc, face);
    vCL = vec3(L, csc.y, float(kind));
    vCP = aP; vCT = aT; vC2 = aCol2;
    vWP = (instanceMatrix * vec4(transformed, 1.0)).xyz;
  }
`;

const FRAG_PARS = /* glsl */`
varying vec3 vCF;
varying vec3 vCL;
varying vec4 vCP;
varying vec4 vCT;
varying vec3 vC2;
varying vec3 vWP;
uniform vec3 uCityLit;
uniform float uNight;
uniform float uTime;
uniform float uClay;
uniform sampler2D uNightLight;
uniform vec2 uMapMin;
uniform float uMapSize;
${GLSL_HASH}
float cBox(vec2 f, vec4 r, vec2 aa) {
  return smoothstep(r.x - aa.x, r.x + aa.x, f.x) * (1.0 - smoothstep(r.y - aa.x, r.y + aa.x, f.x))
       * smoothstep(r.z - aa.y, r.z + aa.y, f.y) * (1.0 - smoothstep(r.w - aa.y, r.w + aa.y, f.y));
}
// anti-aliased periodic line at integer x, half-width w (cell units); fades to its mean coverage when tiny on screen
float cLine(float x, float w, float fw) {
  float d = abs(fract(x + 0.5) - 0.5);
  float m = 1.0 - smoothstep(w - fw, w + fw, d);
  return mix(m, 2.0 * w, smoothstep(0.25, 0.6, fw));
}
const vec3 C_GLASS = vec3(0.0194, 0.0409, 0.0685);
const vec3 C_LIT_R = vec3(1.0, 0.539, 0.195);
const vec3 C_LIT_C = vec3(0.672, 0.791, 1.0);
const vec3 C_LIT_I = vec3(1.0, 0.434, 0.0685);
const vec3 C_WARM = vec3(1.0, 0.871, 0.631);
const vec3 C_FIRE = vec3(1.0, 0.195, 0.023);
const vec3 C_CLAY = vec3(0.686, 0.665, 0.604);

// Procedural surface: albedo, roughness, metalness and emissive for every city part.
void citySurface(inout vec3 alb, out float rough, out float metal, out vec3 emi, vec3 nW) {
  int type = int(vCP.x + 0.5);
  int zone = int(vCP.z + 0.5);
  int fl = int(vCP.w + 0.5);
  float seed = vCP.y;
  float fire = vCT.z;
  int kind = int(vCL.z + 0.5);
  int face = int(vCF.z + 0.5);
  float u = vCF.x, v = vCF.y, L = vCL.x, H = vCL.y;
  vec2 fwUV = fwidth(vCF.xy) + 1e-5;
  bool topF = nW.y > 0.6;
  bool vertF = abs(nW.y) < 0.35;
  vec3 wall = vColor.rgb;
  vec3 c2 = vC2;
  rough = 0.85; metal = 0.0; emi = vec3(0.0);
  alb = wall;
  float win = 0.0;        // window coverage
  float lit = 0.0;        // lit window coverage (night)
  vec3 litCol = C_LIT_R;
  bool aband = (fl & 1) != 0;
  bool constr = (fl & 2) != 0;
  float nz = cNoise(vWP.xz * 9.0 + vWP.y * 3.0);
  float burnWin = 0.0;

  if (kind == 0 && ((type >= 1 && type <= 4) || (type == 0 && (fl & 8) != 0))) {
    // ---------------------------------------------------------------- building bodies with windows
    if (face >= 3) {
      // flat roof: gravel / membrane with seams and stains
      float n2 = cNoise(vec2(u * 24.0, v * 17.0) + seed * 50.0);
      alb = c2 * (0.86 + 0.22 * nz) * (0.93 + 0.1 * n2);
      alb *= 1.0 - 0.08 * cLine(u / 0.21, 0.04, fwUV.x / 0.21);
      rough = 0.92;
    } else {
      float fh = 0.25;
      float nf = max(1.0, floor(H / fh + 0.35));
      fh = H / nf;
      float bw = type == 1 ? 0.21 : type == 2 ? 0.185 : type == 3 ? 0.11 : 0.2;
      bw *= 0.9 + 0.22 * fract(seed * 7.13);
      float nb = max(1.0, floor(L / bw + 0.5));
      float cu = (u / L + 0.5) * nb, cv = v / fh;
      vec2 cell = floor(vec2(cu, cv)), f = fract(vec2(cu, cv));
      vec2 aa = vec2(fwUV.x * nb / L, fwUV.y / fh) * 1.3;
      float far = smoothstep(0.3, 0.75, max(aa.x, aa.y));
      vec4 R = type == 1 ? vec4(0.27, 0.73, 0.32, 0.8) : type == 2 ? vec4(0.15, 0.85, 0.3, 0.84)
             : type == 3 ? vec4(0.035, 0.965, 0.24, 0.97) : type == 4 ? vec4(0.2, 0.8, 0.3, 0.82) : vec4(0.0);
      if (type == 3 && (fl & 128) != 0) R.xy = vec2(0.12, 0.88);
      // per-building proportions so neighbouring blocks do not share one window grid
      float s1 = fract(seed * 13.7), s2 = fract(seed * 29.3), s3 = fract(seed * 51.1);
      if (type == 1) R = vec4(0.5 - 0.17 - 0.08 * s1, 0.5 + 0.17 + 0.08 * s1, 0.3, 0.76 - 0.06 * s2);
      else if (type == 2) R = vec4(0.5 - 0.26 - 0.1 * s1, 0.5 + 0.26 + 0.1 * s1, 0.26 + 0.06 * s2, 0.84);
      else if (type == 4) R = vec4(0.5 - 0.22 - 0.12 * s1, 0.5 + 0.22 + 0.12 * s1, 0.28, 0.8 - 0.04 * s2);
      bool tall = H > 0.7 && type != 1;
      win = mix(cBox(f, R, aa), (R.y - R.x) * (R.w - R.z), far);
      bool ground = cell.y < 0.5;
      bool top = cell.y > nf - 1.5;
      // stair-core bays: blank wall with a narrow window strip offset by half a floor
      float core = (type == 2 || type == 4) && tall && nb > 4.5 && s3 < 0.45 && abs(cell.x - floor(nb * (0.3 + 0.4 * s2))) < 0.5 ? 1.0 : 0.0;
      if (core > 0.5) win = cBox(vec2(f.x, fract(cv + 0.5)), vec4(0.42, 0.58, 0.25, 0.75), aa) * (1.0 - far) + 0.08 * far;
      float hw = cHash(vec3(cell + vec2(face * 31, 0.0), seed * 9973.0));
      float hw2 = cHash(vec3(cell.yx + 57.0, seed * 7717.0 + float(face)));
      float hw3 = cHash(vec3(cell * 1.7 + 3.0, seed * 3331.0));
      float lf = zone == 1 ? uCityLit.x : zone == 2 ? uCityLit.y : uCityLit.z;
      litCol = zone == 1 ? C_LIT_R : zone == 2 ? C_LIT_C : C_LIT_I;
      if (type == 3) {
        // offices light whole runs of a floor
        hw = cHash(vec3(cell.y, floor(cell.x / 4.0) + float(face) * 17.0, seed * 5113.0));
        litCol = C_LIT_C;
      }
      // facade material
      if (type == 3) {
        // curtain wall: reflective tinted glass between mullions and spandrels
        vec3 glassC = wall;
        vec3 mull = c2;
        float spandrel = 1.0 - win;
        alb = mix(mull, glassC * (0.85 + 0.25 * hw2), win);
        rough = mix(0.5, 0.07 + 0.06 * hw3, win);
        metal = mix(0.2, 0.75, win);
        if ((fl & 128) != 0) {
          // vertical fins every bay
          float fin = 1.0 - smoothstep(0.08 - aa.x, 0.08 + aa.x, abs(f.x - 0.5) * 2.0 - 0.84);
          alb = mix(alb, mull * 1.1, fin * (1.0 - far));
        }
        win *= 0.999;
      } else {
        // masonry / render with punched windows
        float stucco = 0.84 + 0.12 * nz;
        alb = wall * stucco * (1.0 - 0.06 * (1.0 - smoothstep(0.0, 0.3, v))); // a little grime near the ground
        // rain streaks under the windows
        float streak = cNoise(vec2(u * 31.0, v * 0.7 + seed * 9.0)) * (1.0 - smoothstep(0.0, R.z, f.y)) * (1.0 - far);
        alb *= 1.0 - 0.07 * streak;
        // base storey in a darker stone, crown band on top of taller blocks
        if (tall && ground && (fl & 8) == 0) alb = mix(alb, mix(wall, vec3(0.16, 0.15, 0.14), 0.45), 0.8);
        if (tall && top && type != 3) alb = mix(alb, mix(wall, vec3(0.9, 0.88, 0.84), 0.3), step(0.86, f.y) + step(f.y, 0.1) * 0.0);
        if ((fl & 256) != 0) { R.xy = vec2(-0.1, 1.1); win = mix(cBox(f, R, aa), R.w - R.z, far); }
        // floor slab / string course lines
        if (type == 2 || type == 4) alb *= 1.0 - 0.1 * cLine(cv, 0.03, aa.y);
        // window reveal shadow + sill
        float sill = cBox(f, vec4(R.x - 0.04, R.y + 0.04, R.z - 0.07, R.z - 0.01), aa) * (1.0 - far);
        alb = mix(alb, wall * 1.12 + 0.04, sill * 0.7);
        // glass: reflective (metal-like F0) so the sky shows in it by day, with blinds behind some panes
        vec3 inner = mix(vec3(0.09, 0.11, 0.14), vec3(0.2, 0.25, 0.3), hw3);
        float curt = step(0.6, hw2) * smoothstep(R.w - 0.25, R.w - 0.1, f.y) * (1.0 - far);
        inner = mix(inner, vec3(0.3, 0.27, 0.22), curt * 0.6);
        inner *= mix(1.0, 0.6, smoothstep(R.w - 0.1, R.w, f.y) * (1.0 - far)); // lintel shadow
        if ((fl & 256) != 0) inner = mix(inner, wall * 0.35, cLine(cu * 2.0, 0.05, aa.x * 2.0) * (1.0 - far)); // mullions
        alb = mix(alb, inner, win);
        rough = mix(rough, 0.1, win);
        metal = mix(metal, 0.55 * (1.0 - curt), win);
        if (type == 2 && (fl & 64) != 0 && !ground) {
          // balconies: a slab and a railing band under every other bay's window
          float bal = step(0.5, fract(cell.x * 0.5 + floor(seed * 4.0) * 0.5));
          float rail = cBox(f, vec4(0.08, 0.92, 0.02, 0.3), aa) * bal;
          alb = mix(alb, mix(c2, vec3(0.3), 0.35) * 0.9, rail * (1.0 - far * 0.5));
          win *= 1.0 - rail * 0.7;
        }
      }
      // ground floor: shopfront / door
      if (ground && (fl & 8) != 0) {
        float shop = cBox(f, vec4(0.05, 0.95, 0.07, 0.68), aa);
        float sign = cBox(f, vec4(0.02, 0.98, 0.74, 0.95), aa);
        float sh = cHash(vec3(floor(cu / 3.0), seed * 811.0, 5.0));
        vec3 signC = sh < 0.15 ? vec3(0.35, 0.07, 0.05) : sh < 0.3 ? vec3(0.54, 0.38, 0.09) : sh < 0.55 ? vec3(0.06, 0.06, 0.065)
                   : sh < 0.75 ? vec3(0.79, 0.76, 0.69) : sh < 0.88 ? vec3(0.05, 0.13, 0.25) : vec3(0.05, 0.18, 0.1);
        alb = mix(wall * 0.8, vec3(0.12, 0.14, 0.16), shop);
        alb = mix(alb, signC, sign);
        rough = mix(0.85, 0.08, shop);
        metal = mix(metal, 0.5, shop);
        win = shop;
        hw = cHash(vec3(cell.x, 3.0, seed * 1777.0)) * 0.6;
        litCol = C_WARM;
        emi += signC * sign * 2.6 * smoothstep(0.25, 0.7, uNight) * step(0.3, sh + 0.25) * (aband ? 0.0 : 1.0);
      } else if (ground && face == 0 && (fl & 16) != 0 && abs(cell.x - floor(nb * 0.5)) < 0.5) {
        float door = cBox(f, vec4(0.28, 0.72, 0.0, 0.78), aa) * (1.0 - far);
        alb = mix(alb, mix(c2, vec3(0.08, 0.06, 0.05), 0.55), door);
        win *= 1.0 - door;
      }
      if (ground && (fl & 8) == 0) alb *= mix(1.0, 0.82, step(v, 0.03));  // plinth
      // cornice / coping at the very top of the body
      alb = mix(alb, mix(wall, vec3(0.9), 0.25), step(H - 0.02, v) * (1.0 - float(type == 3) * 0.5));
      lit = mix(step(hw, lf) * win, lf * win, far);   // sub-pixel windows: average instead of sparkling
      litCol *= mix(0.6 + 0.7 * hw2, 0.95, far);
      litCol = mix(litCol, C_WARM, hw3 * 0.35 * (1.0 - far));
      if (fire > 0.0) {
        float burnFloor = 1.0 - step(fire * nf * 1.3 + 0.6, cell.y);
        burnWin = win * burnFloor * (0.35 + 0.65 * cNoise(vec2(uTime * 7.0 + hw * 40.0, cell.y * 3.1 + cell.x)));
        alb *= 1.0 - 0.6 * fire * (0.55 + 0.45 * cNoise(vec2(u * 6.0, v * 3.0 - 2.0)));
      }
    }
  } else if (type == 5) {
    // ---------------------------------------------------------------- industrial shed: corrugated cladding
    if (face >= 3) {
      alb = c2 * (0.9 + 0.15 * nz) * (1.0 - 0.12 * cLine(u / 0.05, 0.12, fwUV.x / 0.05));
      rough = 0.55; metal = 0.35;
    } else {
      float rib = cLine(u / 0.035, 0.18, fwUV.x / 0.035);
      alb = wall * (0.96 - 0.13 * rib) * (0.92 + 0.12 * nz);
      rough = 0.55; metal = 0.25;
      // clerestory window band
      float band = smoothstep(H - 0.11 - fwUV.y, H - 0.11 + fwUV.y, v) * (1.0 - smoothstep(H - 0.05 - fwUV.y, H - 0.05 + fwUV.y, v));
      float pane = 1.0 - cLine(u / 0.09, 0.06, fwUV.x / 0.09);
      win = band * pane;
      alb = mix(alb, vec3(0.32, 0.36, 0.36), win);
      rough = mix(rough, 0.3, win);
      // roller doors on the front, concrete plinth
      if (face == 0) {
        float nd = max(1.0, floor(L / 0.2));
        float cu = (u / L + 0.5) * nd;
        float door = cBox(vec2(fract(cu), v), vec4(0.18, 0.82, 0.0, 0.17), vec2(fwUV.x * nd / L, fwUV.y) * 1.3);
        door *= step(0.35, cHash(vec3(floor(cu), seed * 313.0, 2.0)));
        alb = mix(alb, vec3(0.2, 0.21, 0.22) * (1.0 - 0.25 * cLine(v / 0.02, 0.15, fwUV.y / 0.02)), door);
        metal = mix(metal, 0.4, door);
      }
      alb = mix(alb, vec3(0.42, 0.41, 0.39), step(v, 0.035));
      lit = step(cHash(vec3(floor(u / 0.09), seed * 77.0, 1.0)), uCityLit.z) * win;
      litCol = C_LIT_I;
      if (fire > 0.0) { burnWin = win * (0.4 + 0.6 * cNoise(vec2(uTime * 6.0, u * 4.0))); alb *= 1.0 - 0.5 * fire; }
    }
  } else if (type == 25) {
    // ---------------------------------------------------------------- pitched roofs (gable ends are wall)
    if (vertF) {
      alb = wall * (0.92 + 0.12 * nz);
      // little attic vent on gable ends
    } else {
      int rs = zone; // roof style: 0 tile, 1 slate, 2 sheet metal
      if (rs == 2) {
        alb = c2 * (0.95 - 0.12 * cLine(u / 0.045, 0.1, fwUV.x / 0.045)) * (0.92 + 0.12 * nz);
        rough = 0.45; metal = 0.45;
      } else {
        float row = cLine(v / (rs == 0 ? 0.032 : 0.026), 0.14, fwUV.y / 0.03);
        float tile = cHash(vec3(floor(u / 0.04), floor(v / 0.03), seed * 97.0));
        alb = c2 * (0.86 + 0.18 * tile * (rs == 0 ? 1.0 : 0.5)) * (1.0 - 0.22 * row) * (0.9 + 0.15 * nz);
        rough = rs == 0 ? 0.72 : 0.6;
      }
      // ridge cap
      alb *= 1.0 - 0.15 * smoothstep(H - 0.012, H, v);
    }
  } else if (type == 6) {
    // ---------------------------------------------------------------- scaffold with orange / white netting
    float st = step(0.5, fract(v / 0.09));
    alb = mix(PAL_SCAF_A, PAL_SCAF_B, st) * (0.85 + 0.2 * nz);
    float tubes = max(cLine(u / 0.125, 0.06, fwUV.x / 0.125), cLine(v / 0.0625, 0.08, fwUV.y / 0.0625));
    alb = mix(alb, vec3(0.08), tubes * 0.55);
    rough = 0.8;
    if (face >= 3) alb = vec3(0.25, 0.25, 0.24);
  } else if (type == 24) {
    // ---------------------------------------------------------------- raw concrete frame under construction
    float fh = 0.25;
    float slab = cLine(v / fh, 0.1, fwUV.y / fh);
    float col = cLine(u / 0.2, 0.12, fwUV.x / 0.2);
    alb = mix(vec3(0.05, 0.05, 0.055), vec3(0.42, 0.41, 0.38) * (0.9 + 0.2 * nz), max(slab, col));
    if (face >= 3) alb = vec3(0.4, 0.39, 0.36);
    rough = 0.9;
  } else if (type == 7) {
    // ---------------------------------------------------------------- rubble
    float n2 = cNoise(vWP.xz * 31.0 + vWP.y * 17.0);
    alb = wall * (0.55 + 0.6 * n2) * (0.7 + 0.4 * nz);
    alb *= 1.0 - 0.6 * smoothstep(0.55, 0.85, cNoise(vWP.xz * 5.0));
    rough = 0.95;
  } else if (type == 8) {
    // ---------------------------------------------------------------- hedge
    float n2 = cNoise(vWP.xz * 41.0 + vWP.y * 37.0);
    alb = wall * (0.62 + 0.55 * n2) * (0.85 + 0.25 * nz);
    if (topF) alb *= 1.15;
    rough = 0.95;
  } else if (type == 9) {
    // ---------------------------------------------------------------- fences: param 0 picket, 1 chain-link, 2 timber
    float kindF = vCT.w;
    if (kindF < 0.5) {
      float pk = cLine(u / 0.03, 0.25, fwUV.x / 0.03);
      alb = mix(wall * 0.55, wall, max(pk, step(H - 0.012, v) * 0.0 + cLine(v / H * 2.0, 0.08, fwUV.y / H * 2.0)));
    } else if (kindF < 1.5) {
      float post = cLine(u / 0.25, 0.04, fwUV.x / 0.25);
      float mesh = cLine((u + v) / 0.012, 0.12, (fwUV.x + fwUV.y) / 0.012) * cLine((u - v) / 0.012, 0.12, (fwUV.x + fwUV.y) / 0.012);
      alb = mix(vec3(0.22, 0.24, 0.24), wall, max(post, mesh * 0.6 + 0.25));
      metal = 0.5; rough = 0.5;
      alb = mix(alb, wall, step(H - 0.01, v));
    } else {
      float bd = cLine(u / 0.025, 0.08, fwUV.x / 0.025);
      alb = wall * (0.85 + 0.2 * cHash(vec3(floor(u / 0.025), 1.0, seed * 50.0))) * (1.0 - 0.3 * bd);
    }
  } else if (type == 10) {
    // ---------------------------------------------------------------- shipping container
    float rib = cLine(u / 0.018, 0.2, fwUV.x / 0.018);
    alb = wall * (0.95 - 0.18 * rib) * (0.88 + 0.2 * nz);
    if (face >= 3) alb = wall * (0.9 + 0.15 * nz);
    rough = 0.55; metal = 0.3;
  } else if (type == 11) {
    // ---------------------------------------------------------------- pallets / crates / timber
    float sl = cLine(v / 0.02, 0.18, fwUV.y / 0.02);
    alb = wall * (0.85 + 0.2 * nz) * (1.0 - 0.35 * sl);
    rough = 0.9;
  } else if (type == 12) {
    // ---------------------------------------------------------------- asphalt parking with bay lines
    alb = wall * (0.9 + 0.2 * cNoise(vWP.xz * 23.0));
    if (topF) {
      float bay = cLine(u / 0.2, 0.035, fwUV.x / 0.2) * step(abs(v), vCT.w);
      alb = mix(alb, vec3(0.8, 0.78, 0.72), bay);
    }
    rough = 0.9;
  } else if (type == 13 || type == 28) {
    // ---------------------------------------------------------------- paving slabs / stone
    float j = max(cLine(u / 0.06, 0.06, fwUV.x / 0.06), cLine(v / 0.06, 0.06, fwUV.y / 0.06));
    float t = cHash(vec3(floor(u / 0.06), floor(v / 0.06), seed * 31.0));
    alb = wall * (0.92 + 0.12 * t) * (1.0 - 0.25 * j);
    rough = 0.8;
  } else if (type == 14) {
    // ---------------------------------------------------------------- AC units / machinery: louvres and a fan
    float lv = cLine(v / 0.008, 0.2, fwUV.y / 0.008);
    alb = wall * (1.0 - 0.3 * lv * float(!topF));
    if (topF) { float r = length(fract(vec2(u, v) / 0.05) - 0.5); alb *= 1.0 - 0.6 * (1.0 - smoothstep(0.3, 0.38, r)); }
    rough = 0.5; metal = 0.5;
  } else if (type == 15) {
    // ---------------------------------------------------------------- solar panel
    if (topF) {
      float g = max(cLine(u / 0.025, 0.06, fwUV.x / 0.025), cLine(v / 0.025, 0.06, fwUV.y / 0.025));
      alb = mix(wall, vec3(0.5, 0.52, 0.55), g);
      rough = 0.25; metal = 0.4;
    } else { alb = vec3(0.6); metal = 0.6; rough = 0.4; }
  } else if (type == 16) {
    // ---------------------------------------------------------------- tanks / silos: weld seams, ladder
    if (face >= 3) { alb = c2 * (0.9 + 0.12 * nz); rough = 0.5; metal = 0.3; }
    else {
      float seam = cLine(v / 0.06, 0.04, fwUV.y / 0.06);
      float lad = (1.0 - smoothstep(0.012, 0.016, abs(u - L * 0.2))) * cLine(v / 0.015, 0.2, fwUV.y / 0.015);
      alb = wall * (0.94 + 0.1 * nz) * (1.0 - 0.12 * seam) * (1.0 - 0.5 * lad);
      alb *= mix(0.75, 1.0, smoothstep(0.0, 0.08, v));
      rough = 0.45; metal = 0.35;
    }
  } else if (type == 17) {
    // ---------------------------------------------------------------- chimney with red / white bands near the top
    float band = step(H - 0.36, v) * step(0.5, fract((H - v) / 0.18));
    alb = mix(wall, PAL_CHIM_RED, band) * (0.9 + 0.15 * nz);
    if (face >= 3) alb = vec3(0.03);
    alb *= 1.0 - 0.5 * smoothstep(H - 0.06, H, v) * float(face < 3);
    rough = 0.85;
  } else if (type == 18) {
    // ---------------------------------------------------------------- lot pad
    float mode = vCT.w;
    if (face != 3) { alb = wall * 0.75 * (0.9 + 0.1 * nz); rough = 0.9; }
    else if (mode > 0.5) {
      // construction dirt / rubble ground / overgrown
      float n2 = cNoise(vWP.xz * 13.0);
      if (mode < 1.5) alb = vec3(0.32, 0.24, 0.16) * (0.75 + 0.45 * n2) * (0.85 + 0.25 * nz);
      else if (mode < 2.5) alb = vec3(0.24, 0.22, 0.2) * (0.6 + 0.6 * n2);
      else alb = mix(vec3(0.17, 0.2, 0.08), vec3(0.3, 0.27, 0.15), n2) * (0.8 + 0.3 * nz);
      rough = 0.97;
    } else if (zone == 1) {
      // lawn with mowing stripes
      float stripe = step(0.5, fract(u / 0.16));
      float n2 = cNoise(vWP.xz * 19.0);
      alb = wall * (0.86 + 0.16 * n2) * (0.82 + 0.3 * nz) * mix(0.94, 1.06, stripe * (1.0 - smoothstep(0.1, 0.4, fwUV.x / 0.16)));
      rough = 0.95;
    } else if (zone == 2) {
      float j = max(cLine(u / 0.08, 0.05, fwUV.x / 0.08), cLine(v / 0.08, 0.05, fwUV.y / 0.08));
      float t = cHash(vec3(floor(u / 0.08), floor(v / 0.08), 11.0));
      alb = wall * (0.9 + 0.12 * t) * (1.0 - 0.2 * j) * (0.92 + 0.12 * nz);
      rough = 0.8;
    } else {
      float j = max(cLine(u / 0.3, 0.02, fwUV.x / 0.3), cLine(v / 0.3, 0.02, fwUV.y / 0.3));
      float stain = smoothstep(0.62, 0.9, cNoise(vWP.xz * 4.0 + 13.0));
      alb = wall * (0.85 + 0.2 * nz) * (1.0 - 0.25 * j) * (1.0 - 0.35 * stain);
      rough = 0.9;
    }
  } else if (type == 19) {
    // ---------------------------------------------------------------- crane lattice
    float lat = max(cLine((u + v) / 0.05, 0.12, (fwUV.x + fwUV.y) / 0.05), cLine((u - v) / 0.05, 0.12, (fwUV.x + fwUV.y) / 0.05));
    alb = mix(wall * 0.25, wall, max(lat, 0.35));
    rough = 0.6; metal = 0.3;
  } else if (type == 20) {
    // ---------------------------------------------------------------- vehicles: glossy paint; cabin = glass + roof
    float gl = vCT.w > 0.5 ? (1.0 - smoothstep(0.7, 0.8, v / H)) * float(face < 3) : 0.0;
    alb = mix(wall, vec3(0.025, 0.03, 0.035), gl);
    if (vCT.w < 0.5 && face < 3) alb *= mix(0.55, 1.0, smoothstep(0.0, 0.35, v / H));
    rough = mix(0.3, 0.06, gl); metal = mix(0.35, 0.1, gl);
  } else if (type == 21) {
    // ---------------------------------------------------------------- glass box / skylight
    alb = C_GLASS * 1.5; rough = 0.08; metal = 0.2;
    win = 1.0; lit = step(0.4, uCityLit.y) * 0.7; litCol = C_WARM;
  } else if (type == 22) {
    // ---------------------------------------------------------------- construction hoarding
    float pnl = step(0.5, fract(u / 0.24));
    alb = mix(PAL_HOARD_A, PAL_HOARD_B, step(v / H, 0.25)) * (0.92 + 0.1 * pnl);
    rough = 0.7;
  } else if (type == 23) {
    // ---------------------------------------------------------------- awning stripes
    float st = step(0.5, fract(u / 0.05));
    alb = mix(wall, vec3(0.8, 0.78, 0.72), st * float(!topF || true) * 0.85);
    rough = 0.9;
  } else if (type == 26) {
    // ---------------------------------------------------------------- swimming pool water
    alb = topF ? wall * (0.8 + 0.3 * cNoise(vWP.xz * 14.0 + uTime * 0.3)) : PAL_CURB;
    rough = topF ? 0.04 : 0.8;
  } else if (type == 27) {
    // ---------------------------------------------------------------- planter: concrete box with shrubs on top
    if (topF) { alb = c2 * (0.6 + 0.6 * cNoise(vWP.xz * 45.0)); rough = 0.95; }
    else { alb = wall * (0.9 + 0.12 * nz); rough = 0.8; }
  } else {
    // ---------------------------------------------------------------- plain parts
    alb = wall * (0.92 + 0.12 * nz);
    if (topF && kind == 3) alb = c2 * (0.92 + 0.1 * nz);
    if (kind == 2) { alb = wall * (0.95 + 0.1 * nz); if (topF) alb = mix(wall, vec3(0.85), 0.35); }
    rough = 0.8;
  }

  // ------------------------------------------------------------------ state looks
  if (aband) {
    float g = dot(alb, vec3(0.3, 0.59, 0.11));
    alb = mix(alb, vec3(g), 0.6) * 0.6;
    alb *= 1.0 - 0.25 * smoothstep(0.4, 0.9, cNoise(vec2(u * 9.0, v * 1.5)));
    lit = 0.0;
  }
  if (constr && type != 6) lit = 0.0;
  if (fire > 0.0 && (type > 5 || kind > 0) && type != 18) {
    alb *= 1.0 - 0.45 * fire;
    if (topF) emi += C_FIRE * fire * 3.0 * smoothstep(0.6, 0.95, cNoise(vWP.xz * 11.0 + uTime * 1.5));
  }
  // lit windows: HDR so the bloom (threshold 1.0) catches them
  float nightK = mix(0.06, 1.0, smoothstep(0.08, 0.65, uNight));
  emi += litCol * lit * 2.6 * nightK;
  emi += C_FIRE * burnWin * fire * 7.0;
  // clay mode for info views
  alb = mix(alb, C_CLAY, uClay);
  emi *= 1.0 - 0.75 * uClay;
  // night light map (street lamps, fires) on walls near the ground and on lot pads
  vec2 nuv = (vWP.xz - uMapMin) / uMapSize;
  vec3 nl = texture2D(uNightLight, nuv).rgb;
  float hgt = (face < 3 && kind != 4) ? max(v, 0.0) : 0.0;
  emi += alb * nl * (1.0 / (1.0 + hgt * 3.0));
}
`;

const FRAG_CONSTS = (() => {
  const v3 = (c) => `vec3(${c.map((x) => x.toFixed(4)).join(', ')})`;
  return `const vec3 PAL_SCAF_A = ${v3(PAL.scafA)};\nconst vec3 PAL_SCAF_B = ${v3(PAL.scafB)};\n`
    + `const vec3 PAL_CHIM_RED = ${v3(PAL.chimRed)};\nconst vec3 PAL_CURB = ${v3(PAL.curb)};\n`
    + `const vec3 PAL_HOARD_A = ${v3(PAL.hoardA)};\nconst vec3 PAL_HOARD_B = ${v3(PAL.hoardB)};\n`;
})();

function patchMain(shader) {
  Object.assign(shader.uniforms, {
    uGameTime: U.uGameTime, uTime: U.uTime, uNight: U.uNight, uClay: U.uClay, uNightLight: U.uNightLight,
    uMapMin: U.uMapMin, uMapSize: U.uMapSize, uCityLit: CU.uCityLit,
  });
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\n' + VERT_PARS)
    .replace('#include <begin_vertex>', VERT_MAIN);
  shader.fragmentShader = shader.fragmentShader
    .replace('void main() {', FRAG_CONSTS + FRAG_PARS + '\nvoid main() {')
    .replace('#include <normal_fragment_begin>', /* glsl */`
      #include <normal_fragment_begin>
      // pitched roofs and the slewing crane are deformed per instance: use the true face normal there
      vec3 cfdx = dFdx(vWP), cfdy = dFdy(vWP);
      vec3 cnW = normalize(cross(cfdx, cfdy));
      if (vCL.z > 0.5 && (vCL.z < 1.5 || vCL.z > 4.5)) normal = normalize((viewMatrix * vec4(cnW, 0.0)).xyz);
      vec3 cAlb = diffuseColor.rgb; float cRough, cMetal; vec3 cEmi;
      citySurface(cAlb, cRough, cMetal, cEmi, cnW);
      diffuseColor.rgb = cAlb;
      roughnessFactor = cRough;
      metalnessFactor = cMetal;`)
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += cEmi;');
}

function patchDepth(shader) {
  Object.assign(shader.uniforms, { uGameTime: U.uGameTime, uTime: U.uTime });
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\n' + GLSL_COMMON)
    .replace('#include <begin_vertex>', 'vec3 transformed = cityDeform(vec3(position), cityScale());');
}

function makeMaterials() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  mat.onBeforeCompile = patchMain;
  mat.customProgramCacheKey = () => 'bastion-city-v1';
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = patchDepth;
  depth.customProgramCacheKey = () => 'bastion-city-depth-v1';
  return { mat, depth };
}

// ------------------------------------------------------------------------------------------------ geometry
// Small builder for flat-faced kit pieces with the attributes every city geometry carries (position, normal,
// color, aK = [kind, sub]).
class GB {
  constructor(kind) { this.kind = kind; this.p = []; this.n = []; this.c = []; this.k = []; }
  tri(a, b, c, sub = [0, 0, 0], col = [1, 1, 1]) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const [v, s] of [[a, sub[0]], [b, sub[1]], [c, sub[2]]]) {
      this.p.push(v[0], v[1], v[2]); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); this.k.push(this.kind, s);
    }
  }
  quad(a, b, c, d, sub = [0, 0, 0, 0], col) { this.tri(a, b, c, [sub[0], sub[1], sub[2]], col); this.tri(a, c, d, [sub[0], sub[2], sub[3]], col); }
  // axis-aligned box from (x0,y0,z0) to (x1,y1,z1), outward faces, optional bottom
  box(x0, y0, z0, x1, y1, z1, sub = 0, col, bottom = false) {
    const s = [sub, sub, sub, sub];
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], s, col); // +z
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], s, col); // -z
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], s, col); // +x
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], s, col); // -x
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], s, col); // +y
    if (bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], s, col);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 2));
    g.computeBoundingSphere();
    return g;
  }
}

function geoBox() { const b = new GB(P.BOX); b.box(-0.5, 0, -0.5, 0.5, 1, 0.5); return b.geo(); }

function geoRoof() {
  const b = new GB(P.ROOF);
  const A = [-0.5, 0, 0.5], B = [0.5, 0, 0.5], C = [0.5, 0, -0.5], D = [-0.5, 0, -0.5];
  const R1 = [0.5, 1, 0], R0 = [-0.5, 1, 0];
  b.quad(A, B, R1, R0, [0, 0, 1, 1]);           // front slope
  b.quad(C, D, R0, R1, [0, 0, 1, 1]);           // back slope
  b.tri(B, C, R1, [0, 0, 1]);                   // +x end
  b.tri(D, A, R0, [0, 0, 1]);                   // -x end
  b.quad(D, C, B, A);                           // underside (closed for the shadow pass)
  return b.geo();
}

function geoParapet() {
  // inner vertices (sub = 1) start at 0.4 and are moved to a constant 0.028u wall thickness by the shader
  const b = new GB(P.PARAPET);
  const o = 0.5, i = 0.4;
  const sq = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
  for (let k = 0; k < 4; k++) {
    const [ax, az] = sq[k], [bx, bz] = sq[(k + 1) % 4];
    b.quad([ax * o, 0, az * o], [bx * o, 0, bz * o], [bx * o, 1, bz * o], [ax * o, 1, az * o]);                       // outer wall
    b.quad([ax * o, 1, az * o], [bx * o, 1, bz * o], [bx * i, 1, bz * i], [ax * i, 1, az * i], [0, 0, 1, 1]);          // coping
    b.quad([ax * i, 1, az * i], [bx * i, 1, bz * i], [bx * i, 0, bz * i], [ax * i, 0, az * i], [1, 1, 1, 1]);          // inner wall
  }
  return b.geo();
}

function geoCyl(seg = 12) {
  const b = new GB(P.CYL);
  for (let s = 0; s < seg; s++) {
    const a0 = (s / seg) * Math.PI * 2, a1 = ((s + 1) / seg) * Math.PI * 2;
    const x0 = Math.cos(a0) * 0.5, z0 = Math.sin(a0) * 0.5, x1 = Math.cos(a1) * 0.5, z1 = Math.sin(a1) * 0.5;
    // side quad with smooth normals; aK.y carries the angle fraction for the facade u coordinate
    const base = b.p.length / 3;
    b.quad([x0, 0, z0], [x0, 1, z0], [x1, 1, z1], [x1, 0, z1], [s / seg, s / seg, (s + 1) / seg, (s + 1) / seg]);
    const nn = [[x0, z0], [x0, z0], [x1, z1], [x0, z0], [x1, z1], [x1, z1]];
    for (let v = 0; v < 6; v++) { b.n[(base + v) * 3] = nn[v][0] * 2; b.n[(base + v) * 3 + 1] = 0; b.n[(base + v) * 3 + 2] = nn[v][1] * 2; }
    b.tri([0, 1, 0], [x1, 1, z1], [x0, 1, z0]);
  }
  return b.geo();
}

function geoPad() {
  // hex in lot-local space: flat edges at +-z, corners at +-x
  const b = new GB(P.PAD);
  const cs = [];
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; cs.push([Math.cos(a), Math.sin(a)]); }
  for (let k = 0; k < 6; k++) {
    const [ax, az] = cs[k], [bx, bz] = cs[(k + 1) % 6];
    b.tri([0, 1, 0], [bx, 1, bz], [ax, 1, az]);
    b.quad([ax, 0, az], [ax, 1, az], [bx, 1, bz], [bx, 0, bz]);
  }
  const g = b.geo();
  return g;
}

function geoCrane() {
  const b = new GB(P.CRANE);
  const Y = lin(0xE0B030), Wt = lin(0xE6E2D6), G = lin(0x6E7477), D = lin(0x3A3D41);
  b.box(-0.035, 0, -0.035, 0.035, 1, 0.035, 0, Y);                 // mast (scaled to H)
  b.box(-0.1, 0, -0.1, 0.1, 0.06, 0.1, 2, G, true);                // footing (static)
  b.box(-0.32, 0, -0.025, 1.0, 0.05, 0.025, 1, Y, true);           // jib + counter-jib
  b.box(-0.3, -0.07, -0.05, -0.18, 0.02, 0.05, 1, G, true);        // counterweight
  b.box(-0.02, 0.05, -0.02, 0.02, 0.2, 0.02, 1, Y);                // apex
  b.box(0.02, -0.06, -0.045, 0.1, 0.0, 0.045, 1, Wt, true);        // cab
  b.box(0.62, -0.42, -0.004, 0.628, 0.0, 0.004, 1, D);             // hoist cable
  b.box(0.6, -0.46, -0.02, 0.65, -0.42, 0.02, 1, D, true);         // hook block
  // tie bars from the apex to the jib tip and the counterweight
  const tie = (x1, len) => {
    const steps = 1;
    for (let s = 0; s < steps; s++) b.quad([0, 0.2, -0.004], [x1, 0.05, -0.004], [x1, 0.05, 0.004], [0, 0.2, 0.004], [1, 1, 1, 1], D);
    return len;
  };
  tie(0.95, 1); tie(-0.3, 1);
  return b.geo();
}

// ------------------------------------------------------------------------------------------------ slot allocator
// Per-tile contiguous slot ranges inside one Pool. A tile rewrites its range in place when the new content fits,
// otherwise it gets a new range (first fit in the free list, else appended). Dirty ranges are uploaded with one
// addUpdateRange per range (merged when adjacent).
export class Slots {
  constructor(pool, extras) {
    this.pool = pool;
    this.extras = extras; // [{ attr, size }] in staging order after matrix and colour
    this.start = new Int32Array(0); this.cap = new Uint16Array(0); this.cnt = new Uint16Array(0);
    this.end = 0; this.free = []; this.dirty = []; this.overflow = 0; this.live = 0; this.used = 0;
    this.stride = 16 + 3 + extras.reduce((a, e) => a + e.size, 0);
  }
  reset(nTiles) {
    if (this.start.length !== nTiles) { this.start = new Int32Array(nTiles); this.cap = new Uint16Array(nTiles); this.cnt = new Uint16Array(nTiles); }
    this.start.fill(-1); this.cap.fill(0); this.cnt.fill(0);
    this.end = 0; this.free.length = 0; this.dirty.length = 0; this.live = 0; this.used = 0;
    this.full = true;
  }
  _alloc(n) {
    for (let k = 0; k < this.free.length; k += 2) {
      const s = this.free[k], c = this.free[k + 1];
      if (c >= n) {
        if (c === n) this.free.splice(k, 2); else { this.free[k] = s + n; this.free[k + 1] = c - n; }
        return s;
      }
    }
    if (this.end + n > this.pool.max) return -1;
    const s = this.end; this.end += n;
    return s;
  }
  _release(s, c) {
    // insert sorted, merge neighbours, trim the end
    let k = 0;
    while (k < this.free.length && this.free[k] < s) k += 2;
    this.free.splice(k, 0, s, c);
    if (k + 2 < this.free.length && this.free[k] + this.free[k + 1] === this.free[k + 2]) { this.free[k + 1] += this.free[k + 3]; this.free.splice(k + 2, 2); }
    if (k > 0 && this.free[k - 2] + this.free[k - 1] === this.free[k]) { this.free[k - 1] += this.free[k + 1]; this.free.splice(k, 2); k -= 2; }
    const last = this.free.length - 2;
    if (last >= 0 && this.free[last] + this.free[last + 1] === this.end) { this.end = this.free[last]; this.free.length = last; }
  }
  // Copy n staged instances (Float32Array, `stride` floats each) into the tile's range.
  // true when holes and slack make the drawn range much larger than what is in use (repack with a full rebuild)
  fragmented() { return this.end > Math.max(512, this.used * 1.6); }
  write(tile, stage, n) {
    this.used += n - this.cnt[tile];
    this.cnt[tile] = n;
    let s = this.start[tile], c = this.cap[tile];
    if (n > c || (n === 0 && c > 0) || (c > 8 && n < c >> 1)) {
      if (c > 0) { this._zero(s, c); this._mark(s, c); this._release(s, c); this.live -= c; }
      s = -1; c = 0;
      if (n > 0) {
        const want = n <= 2 ? n : n + Math.max(1, n >> 3);
        s = this._alloc(want);
        if (s < 0) { s = this._alloc(n); c = n; } else c = want;
        if (s < 0) { this.overflow++; c = 0; this.used -= n; this.cnt[tile] = 0; }
      }
      this.start[tile] = s; this.cap[tile] = c; this.live += c;
      if (c === 0) return;
    }
    const pool = this.pool, m = pool.mArr, col = pool.cArr, st = this.stride;
    for (let k = 0; k < n; k++) {
      const o = k * st, slot = s + k;
      for (let q = 0; q < 16; q++) m[slot * 16 + q] = stage[o + q];
      col[slot * 3] = stage[o + 16]; col[slot * 3 + 1] = stage[o + 17]; col[slot * 3 + 2] = stage[o + 18];
      let off = o + 19;
      for (const e of this.extras) {
        const arr = e.attr.array, sz = e.size;
        for (let q = 0; q < sz; q++) arr[slot * sz + q] = stage[off + q];
        off += sz;
      }
    }
    if (n < c) this._zero(s + n, c - n);
    this._mark(s, c);
  }
  _zero(s, c) {
    this.pool.mArr.fill(0, s * 16, (s + c) * 16);
  }
  _mark(s, c) { if (!this.full) this.dirty.push(s, c); }
  // Upload what changed; returns bytes uploaded
  commit() {
    const pool = this.pool, mesh = pool.mesh;
    mesh.count = this.end;
    const attrs = [[mesh.instanceMatrix, 16], [mesh.instanceColor, 3], ...this.extras.map((e) => [e.attr, e.size])];
    let ranges = [];
    if (this.full) { if (this.end > 0) ranges.push(0, this.end); this.full = false; }
    else if (this.dirty.length) {
      const d = this.dirty, idx = [];
      for (let k = 0; k < d.length; k += 2) idx.push(k);
      idx.sort((a, b) => d[a] - d[b]);
      for (const k of idx) {
        const s = d[k], e = s + d[k + 1], n = ranges.length;
        if (n && s <= ranges[n - 2] + ranges[n - 1] + 8) ranges[n - 1] = Math.max(ranges[n - 2] + ranges[n - 1], e) - ranges[n - 2];
        else ranges.push(s, e - s);
      }
      if (ranges.length > 64) { const s0 = ranges[0], e1 = ranges[ranges.length - 2] + ranges[ranges.length - 1]; ranges = [s0, e1 - s0]; }
    }
    this.dirty.length = 0;
    if (!ranges.length) return 0;
    let inst = 0;
    for (const [a, sz] of attrs) {
      a.clearUpdateRanges();
      for (let k = 0; k < ranges.length; k += 2) a.addUpdateRange(ranges[k] * sz, ranges[k + 1] * sz);
      a.needsUpdate = true;
    }
    for (let k = 0; k < ranges.length; k += 2) inst += ranges[k + 1];
    const bytes = inst * this.stride * 4;
    Pool.uploaded += bytes;
    return bytes;
  }
}

// ------------------------------------------------------------------------------------------------ module state
const B = {
  scene: null, mat: null, depth: null, pools: [], slots: [], stage: [], stageN: [],
  treeBuf: null, treeN: null, topY: null, stats: { full: 0, patch: 0, repack: 0, uploads: 0 },
};

export function initBuildings(scene) {
  if (B.scene) return B;
  B.scene = scene;
  const { mat, depth } = makeMaterials();
  B.mat = mat; B.depth = depth;
  const geos = [geoBox(), geoRoof(), geoParapet(), geoCyl(12), geoPad(), geoCrane()];
  const cast = [true, true, true, true, false, true];
  geos.forEach((g, pid) => {
    const pool = new Pool(g, mat, POOL_MAX[pid], { cast: cast[pid], receive: true, order: 1 });
    pool.mesh.customDepthMaterial = depth;
    pool.mesh.name = 'city-' + ['box', 'roof', 'parapet', 'cyl', 'pad', 'crane'][pid];
    pool.mesh.count = 0;
    pool.mesh.visible = true; // count 0 draws nothing, but stays visible so warm-up compiles the programs
    pool.mArr.fill(0);
    const extras = [{ attr: pool.addAttribute('aCol2', 3), size: 3 }, { attr: pool.addAttribute('aP', 4), size: 4 }, { attr: pool.addAttribute('aT', 4), size: 4 }];
    for (const e of extras) e.attr.setUsage(THREE.StaticDrawUsage);
    pool.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    pool.mesh.instanceColor.setUsage(THREE.StaticDrawUsage);
    B.pools.push(pool);
    B.slots.push(new Slots(pool, extras));
    B.stage.push(new Float32Array(POOL_TILE_MAX[pid] * STRIDE));
    B.stageN.push(0);
    scene.add(pool.mesh);
  });
  return B;
}

// ------------------------------------------------------------------------------------------------ lot generator
const PI = Math.PI;
const ST = 0.25; // storey
const TREE_MAX = 6;

// per-lot context (reused, no allocation per lot)
const L = {
  i: 0, zone: 0, lvl: 0, fl: 0, seed: 0, rs: 0, fire: 0, aband: false, build: false, rubble: false,
  t0: 0, dur: 8, cx: 0, cy: 0, cz: 0, c: 1, s: 0, yaw: 0, d: 0, corner: false, roadMask: 0, stateFlags: 0,
  buildH: 0, top: 0, nt: 0, emit: false, frontZ: -1,
};
function rnd() {
  L.rs = (L.rs + 0x6D2B79F5) | 0;
  let t = L.rs;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (a, b) => a + (b - a) * rnd();
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const jit = (col, k = 0.05) => { const f = 1 + (rnd() * 2 - 1) * k; return [col[0] * f, col[1] * f, col[2] * f]; };

const _rot = new Float32Array(9);
// Write one instance into staging. (lx, lz) are lot-local; y is above the lot ground; rot is relative to the lot.
function put(pid, lx, y, lz, rot, sx, sy, sz, col, col2, type, flags, param = 0, pitch = 0, roll = 0, aTx = null, aTy = null) {
  if (L.build && !L.emit) return; // construction mode: only body() emits (rising frame + scaffold)
  const n = B.stageN[pid];
  if ((n + 1) * STRIDE > B.stage[pid].length) return;
  const a = B.stage[pid], o = n * STRIDE;
  const yaw = L.yaw + rot, c = Math.cos(yaw), s = Math.sin(yaw);
  const wx = L.cx + lx * L.c + lz * L.s, wz = L.cz - lx * L.s + lz * L.c, wy = L.cy + y;
  if (pitch === 0 && roll === 0) {
    a[o] = c * sx; a[o + 1] = 0; a[o + 2] = -s * sx; a[o + 3] = 0;
    a[o + 4] = 0; a[o + 5] = sy; a[o + 6] = 0; a[o + 7] = 0;
    a[o + 8] = s * sz; a[o + 9] = 0; a[o + 10] = c * sz; a[o + 11] = 0;
  } else {
    // R = Ry(yaw) * Rx(pitch) * Rz(roll)
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    // columns of Rx*Rz
    const x0 = cr, x1 = sr * cp, x2 = sr * sp;
    const y0 = -sr, y1 = cr * cp, y2 = cr * sp;
    const z0 = 0, z1 = -sp, z2 = cp;
    // apply Ry: (x, y, z) -> (c x + s z, y, -s x + c z)
    _rot[0] = c * x0 + s * x2; _rot[1] = x1; _rot[2] = -s * x0 + c * x2;
    _rot[3] = c * y0 + s * y2; _rot[4] = y1; _rot[5] = -s * y0 + c * y2;
    _rot[6] = c * z0 + s * z2; _rot[7] = z1; _rot[8] = -s * z0 + c * z2;
    a[o] = _rot[0] * sx; a[o + 1] = _rot[1] * sx; a[o + 2] = _rot[2] * sx; a[o + 3] = 0;
    a[o + 4] = _rot[3] * sy; a[o + 5] = _rot[4] * sy; a[o + 6] = _rot[5] * sy; a[o + 7] = 0;
    a[o + 8] = _rot[6] * sz; a[o + 9] = _rot[7] * sz; a[o + 10] = _rot[8] * sz; a[o + 11] = 0;
  }
  a[o + 12] = wx; a[o + 13] = wy; a[o + 14] = wz; a[o + 15] = 1;
  a[o + 16] = col[0]; a[o + 17] = col[1]; a[o + 18] = col[2];
  a[o + 19] = col2[0]; a[o + 20] = col2[1]; a[o + 21] = col2[2];
  a[o + 22] = type; a[o + 23] = L.seed; a[o + 24] = L.zone; a[o + 25] = flags | L.stateFlags;
  a[o + 26] = aTx != null ? aTx : L.t0; a[o + 27] = aTy != null ? aTy : L.dur; a[o + 28] = L.fire; a[o + 29] = param;
  B.stageN[pid] = n + 1;
  const top = wy + sy;
  if (pid !== P.PAD && top > L.top) L.top = top;
}

// --- hex fitting in the lot frame. Edge-facing lots have flat edges at +-z; corner-facing lots have them at +-x.
const A0 = 0.866;
function hexOK(x, z, m) {
  const ax = Math.abs(x), az = Math.abs(z), A = A0 - m;
  return L.corner ? (ax <= A && 0.5 * ax + A0 * az <= A) : (az <= A && A0 * ax + 0.5 * az <= A);
}
function rectOK(x, z, w, d, rot, m) {
  const c = Math.cos(rot), s = Math.sin(rot);
  for (const [px, pz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) {
    if (!hexOK(x + px * c + pz * s, z - px * s + pz * c, m)) return false;
  }
  return true;
}
// Largest front-face z for an axis-aligned w x d footprint centred at x, margin m
function frontLimit(x, w, m) {
  const A = A0 - m, ex = Math.abs(x) + w / 2;
  return L.corner ? (A - 0.5 * ex) / A0 : Math.min(A, 2 * (A - A0 * ex));
}
// Place a w x d body with its front `setback` behind the frontage; shrinks to fit. Returns [x, z, w, d].
const _fit = [0, 0, 0, 0];
function placeFront(x, w, d, setback, m = 0.07) {
  for (let it = 0; it < 12; it++) {
    const zf = frontLimit(x, w, m) - setback;
    const z = zf - d / 2;
    if (rectOK(x, z, w, d, 0, m)) { _fit[0] = x; _fit[1] = z; _fit[2] = w; _fit[3] = d; L.frontZ = Math.max(L.frontZ, zf); return _fit; }
    w *= 0.94; d *= 0.95;
  }
  _fit[0] = x; _fit[1] = 0; _fit[2] = w; _fit[3] = d;
  return _fit;
}
function fitAt(x, z, w, d, rot = 0, m = 0.07) {
  for (let it = 0; it < 12; it++) {
    if (rectOK(x, z, w, d, rot, m)) { _fit[0] = x; _fit[1] = z; _fit[2] = w; _fit[3] = d; return _fit; }
    w *= 0.93; d *= 0.93; x *= 0.95; z *= 0.95;
  }
  _fit[0] = x; _fit[1] = z; _fit[2] = w; _fit[3] = d;
  return _fit;
}

// --- building parts -------------------------------------------------------------------------------------------
// A main body. In construction mode it becomes a rising concrete frame wrapped in a scaffold band.
function body(x, z, y0, w, d, h, rot, wall, roof, type, flags = 0) {
  if (L.build) {
    L.emit = true;
    put(P.BOX, x, y0, z, rot, w, h, d, PAL.concrete, [y0, 0, 0], S.FRAME, F.CONSTR, L.buildH);
    put(P.BOX, x, y0, z, rot, w + 0.035, h, d + 0.035, PAL.scafA, [y0, 0, 0], S.SCAF, F.CONSTR | F.SCAF, L.buildH);
    L.emit = false;
    return false;
  }
  put(P.BOX, x, y0, z, rot, w, h, d, wall, roof, type, flags);
  return true;
}
// Total height of the stack being built (for the construction rise); archetypes call this before body()
function stackH(h) { if (h > L.buildH) L.buildH = h; }

function parapet(x, z, y, w, d, rot, col, ph = 0.04) {
  if (L.build) return;
  put(P.PARAPET, x, y, z, rot, w, ph, d, col, col, S.PLAIN, 0);
}
// pitched roof: ridge along the body's local x. hip 0..1, mono = ridge offset (0 centre, 0.5 = mono-pitch)
function pitched(x, z, y, w, d, rot, rh, roofCol, wall, style, hip = 0, mono = 0, ov = 0.035) {
  if (L.build) return;
  put(P.ROOF, x, y, z, rot, w + ov * 2, rh, d + ov * 2, wall, roofCol, S.ROOF, 0, hip, 0, 0, mono, 0);
  // the roof's style travels in aP.z (zone slot) for the shader
  const a = B.stage[P.ROOF], o = (B.stageN[P.ROOF] - 1) * STRIDE; a[o + 24] = style;
}
function cyl(x, z, y, dia, h, col, col2, type = S.TANK, flags = 0) {
  if (L.build) return;
  put(P.CYL, x, y, z, rnd() * PI, dia, h, dia, col, col2, type, flags);
}
function prop(x, z, y, w, h, d, rot, col, type, pitch = 0, param = 0) {
  if (L.build) return;
  put(P.BOX, x, y, z, rot, w, h, d, col, col, type, 0, param, pitch, 0);
}
function treeSpot(x, z, y, species, scale) {
  if (L.nt >= TREE_MAX) return;
  const wx = L.cx + x * L.c + z * L.s, wz = L.cz - x * L.s + z * L.c;
  const o = (L.i * TREE_MAX + L.nt) * 5;
  B.treeBuf[o] = wx; B.treeBuf[o + 1] = L.cy + y; B.treeBuf[o + 2] = wz; B.treeBuf[o + 3] = species; B.treeBuf[o + 4] = scale;
  L.nt++;
}

// rooftop clutter on a flat roof of size w x d at height y (local frame of a body at x,z rot)
function roofClutter(x, z, y, w, d, rot, kind) {
  if (L.build) return;
  const c = Math.cos(rot), s = Math.sin(rot);
  const at = (px, pz) => [x + px * c + pz * s, z - px * s + pz * c];
  const n = kind === 'big' ? ri(3, 6) : kind === 'house' ? ri(0, 1) : ri(1, 4);
  const used = [];
  const free = (px, pz, r) => { for (let k = 0; k < used.length; k += 3) if (Math.hypot(px - used[k], pz - used[k + 1]) < r + used[k + 2]) return false; used.push(px, pz, r); return true; };
  // stair / lift head on bigger roofs
  if (kind !== 'house' && w > 0.3 && d > 0.25) {
    const sw = Math.min(0.16, w * 0.3), sd = Math.min(0.12, d * 0.35), px = rr(-0.2, 0.2) * (w - sw), pz = rr(-0.2, 0.2) * (d - sd);
    free(px, pz, 0.1);
    const [qx, qz] = at(px, pz);
    put(P.BOX, qx, y, qz, rot, sw, kind === 'big' ? 0.16 : 0.11, sd, PAL.walls[7], PAL.membrane, S.PLAIN, 0);
  }
  for (let k = 0; k < n; k++) {
    const r = rnd();
    const px = rr(-0.4, 0.4) * w, pz = rr(-0.4, 0.4) * d;
    if (r < 0.45) { // AC units
      if (!free(px, pz, 0.05)) continue;
      const [qx, qz] = at(px, pz);
      put(P.BOX, qx, y, qz, rot, 0.07, 0.04, 0.05, PAL.metal, PAL.metal, S.METAL, 0);
    } else if (r < 0.65 && (kind === 'big' || kind === 'res')) { // water tank on legs
      if (!free(px, pz, 0.06)) continue;
      const [qx, qz] = at(px, pz);
      put(P.BOX, qx, y, qz, rot, 0.06, 0.04, 0.06, PAL.metalDark, PAL.metalDark, S.PLAIN, 0);
      put(P.CYL, qx, y + 0.04, qz, 0, 0.08, 0.08, 0.08, PAL.wood, PAL.darkRoof, S.TANK, 0);
    } else if (r < 0.8) { // antenna mast
      if (!free(px, pz, 0.02)) continue;
      const [qx, qz] = at(px, pz);
      put(P.BOX, qx, y, qz, rot, 0.008, rr(0.12, 0.3), 0.008, PAL.metalDark, PAL.metalDark, S.PLAIN, 0);
    } else { // solar array
      const sw = Math.min(0.18, w * 0.4), sd = 0.07;
      if (!free(px, pz, 0.1)) continue;
      const [qx, qz] = at(px, pz);
      put(P.BOX, qx, y + 0.02, qz, rot, sw, 0.006, sd, PAL.solar, PAL.solar, S.SOLAR, 0, 0, -0.4, 0);
    }
  }
}

// --- lot borders and dressing -----------------------------------------------------------------------------------
// local edge k: normal angle th = th0 + 60k; world neighbour dir = (L.d + k) % 6
function edgeInfo(k) {
  const th = (L.corner ? -PI / 6 : 0) + k * PI / 3;
  const dir = (L.d + k) % 6;
  return { th, dir, nbr: W.nbr[L.i * 6 + dir] };
}
function isLotTile(j) { return j >= 0 && W.zone[j] > 0 && (W.lvl[j] > 0 || (W.flags[j] & LF.RUBBLE)); }
// Draw a border element along every edge that is not a road and not shared with a lower-index lot.
function borders(fn) {
  for (let k = 0; k < 6; k++) {
    const e = edgeInfo(k);
    if (e.nbr >= 0 && W.road[e.nbr]) continue;
    if (isLotTile(e.nbr) && e.nbr < L.i && W.zone[e.nbr] === L.zone) continue;
    fn(e.th, k, e.nbr);
  }
}
function edgeSeg(th, inset, len, y, h, thick, col, type, param = 0, col2 = null) {
  const nx = Math.sin(th), nz = Math.cos(th), r = A0 - inset;
  put(P.BOX, nx * r, y, nz * r, th, len, h, thick, col, col2 || col, type, 0, param);
}
function pad(mode = 0) {
  const zc = L.zone === 1 ? (L.aband ? PAL.lawn : PAL.lawn) : L.zone === 2 ? PAL.paving : PAL.concrete;
  const yaw = L.corner ? PI / 6 : 0;
  const r = L.zone === 1 ? 0.985 : 0.998;
  put(P.PAD, 0, 0, 0, yaw, r, 0.014, r, jit(zc, 0.04), zc, S.PAD, 0, L.aband && L.zone === 1 ? 3 : mode);
}
// a path from (x, zFrom) to the frontage
function frontPath(x, zFrom, w, col, type) {
  const zTo = frontLimit(x, w, 0.0) + 0.02;
  const len = zTo - zFrom;
  if (len <= 0.02) return;
  put(P.BOX, x, 0.014, zFrom + len / 2, 0, w, 0.004, len, col, col, type, 0, 0);
}
function car(x, z, rot) {
  const col = jit(pick(PAL.cars), 0.06), c = Math.cos(rot), s = Math.sin(rot), back = rr(-0.01, 0.02);
  put(P.BOX, x, 0.022, z, rot, 0.36, 0.055, 0.155, col, col, S.CAR, 0, 0);
  put(P.BOX, x - back * c, 0.077, z + back * s, rot, 0.2, 0.05, 0.14, col, col, S.CAR, 0, 1);
}
function truck(x, z, rot, len = 0.62) {
  const c = Math.cos(rot), s = Math.sin(rot), col = jit(pick(PAL.cars), 0.05);
  const tl = len - 0.14, o1 = -0.07, o2 = len / 2 - 0.07;
  put(P.BOX, x + o1 * c, 0.03, z - o1 * s, rot, tl, 0.17, 0.18, jit(PAL.walls[0], 0.03), PAL.walls[0], S.PLAIN, 0);
  put(P.BOX, x + o2 * c, 0.022, z - o2 * s, rot, 0.13, 0.15, 0.17, col, col, S.CAR, 0, 0);
}
function parkedCars(x, z, rot, n, spacing = 0.42) {
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let k = 0; k < n; k++) {
    if (rnd() < 0.3) continue;
    const o = (k - (n - 1) / 2) * spacing;
    car(x + o * c, z - o * s, rot + (rnd() < 0.5 ? 0 : PI) + rr(-0.04, 0.04));
  }
}
function parking(x, z, w, d, rot, cars = true) {
  if (L.build) return;
  put(P.BOX, x, 0.014, z, rot, w, 0.003, d, PAL.asphalt, PAL.asphalt, S.ASPH, 0, d * 0.5);
  if (cars) parkedCars(x, z, rot, Math.max(1, Math.floor(w / 0.42)));
}

// ================================================================================================ archetypes
// Residential L1: detached house (gable or hip), terrace pair, bungalow
function resL1() {
  const v = rnd();
  const wall = jit(pick(PAL.walls), 0.04), wall2 = jit(pick(PAL.walls), 0.04);
  const roofCol = rnd() < 0.6 ? jit(PAL.terra, 0.06) : jit(PAL.slate, 0.06);
  const style = roofCol[0] > 0.2 ? 0 : 1;
  const storeys = rnd() < 0.55 ? 2 : 1;
  const h = storeys * ST + 0.03;
  stackH(h + 0.15);
  if (v < 0.55) {
    // detached house with an optional garage wing
    const [x, z, w, d] = placeFront(rr(-0.1, 0.1), rr(0.62, 0.78), rr(0.44, 0.54), rr(0.16, 0.26));
    const flipRidge = rnd() < 0.35;
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.HOUSE, F.DOOR);
    const hip = rnd() < 0.35 ? 1 : 0;
    if (flipRidge && !hip) pitched(x, z, h, d, w, PI / 2, rr(0.17, 0.22), roofCol, wall, style);
    else pitched(x, z, h, w, d, 0, rr(0.16, 0.21), roofCol, wall, style, hip);
    if (rnd() < 0.7) prop(x + w * rr(-0.3, 0.3), z - d * 0.15, h + 0.04, 0.06, 0.18, 0.06, 0, PAL.walls[6], S.PLAIN);
    // garage wing to one side
    const side = x > 0 ? -1 : 1;
    const gw = 0.26, gx = x + side * (w / 2 + gw / 2 - 0.01), gz = z + d / 2 - 0.17;
    if (!L.build && rnd() < 0.65 && rectOK(gx, gz, gw, 0.34, 0, 0.06)) {
      body(gx, gz, 0, gw, 0.34, ST * 0.9, 0, wall2, PAL.gravel, S.HOUSE, 0);
      parapet(gx, gz, ST * 0.9, gw, 0.34, 0, wall2, 0.02);
      frontPath(gx, gz + 0.17, 0.2, PAL.asphalt, S.ASPH);
    }
    if (!L.build) frontPath(x, z + d / 2, 0.07, PAL.paving, S.PAVE);
    // back garden: shed or pool, trees
    if (!L.build) {
      const bz = z - d / 2 - 0.14;
      if (rnd() < 0.25 && rectOK(x, bz, 0.24, 0.12, 0, 0.08)) put(P.BOX, x, 0.012, bz, 0, 0.24, 0.006, 0.12, PAL.water, PAL.water, S.WATER, 0);
      else if (rnd() < 0.4 && rectOK(-x * 0.5, bz, 0.1, 0.08, 0, 0.1)) {
        put(P.BOX, -x * 0.5, 0, bz, 0, 0.1, 0.07, 0.08, PAL.woodFence, PAL.woodFence, S.WOOD, 0);
        pitched(-x * 0.5, bz, 0.07, 0.1, 0.08, 0, 0.03, PAL.slate, PAL.woodFence, 1, 0, 0.5, 0.01);
      }
      treeSpot(rr(-0.45, 0.45), z - d / 2 - rr(0.14, 0.24), 0, rnd() < 0.7 ? 0 : 2, rr(0.36, 0.5));
      if (rnd() < 0.6) treeSpot(side * -0.62, rr(-0.1, 0.2), 0, 0, rr(0.32, 0.45));
    }
  } else if (v < 0.8) {
    // pair of terraced / semi-detached houses
    const n = 2 + (rnd() < 0.4 ? 1 : 0);
    const uw = rr(0.3, 0.36), d = rr(0.44, 0.52);
    const [x0, z, wt] = placeFront(0, uw * n, d, rr(0.12, 0.2));
    const u = wt / n;
    for (let k = 0; k < n; k++) {
      const x = x0 - wt / 2 + u * (k + 0.5);
      const wk = k % 2 ? wall2 : wall;
      const hk = h + (k % 2 ? 0.0 : 0.0);
      body(x, z, 0, u - 0.002, d, hk, 0, wk, roofCol, S.HOUSE, F.DOOR);
      pitched(x, z, hk, u, d, 0, 0.17, roofCol, wk, style, 0, 0, 0.02);
      if (rnd() < 0.5) prop(x + u * 0.3, z - d * 0.1, hk + 0.05, 0.04, 0.14, 0.04, 0, PAL.walls[6], S.PLAIN);
      if (!L.build) frontPath(x, z + d / 2, 0.06, PAL.paving, S.PAVE);
    }
    if (!L.build) {
      treeSpot(rr(-0.35, 0.35), z - d / 2 - 0.16, 0, rnd() < 0.5 ? 0 : 2, rr(0.34, 0.48));
      if (rnd() < 0.5) treeSpot(rr(-0.35, 0.35), z - d / 2 - 0.2, 0, 0, rr(0.3, 0.42));
    }
  } else {
    // bungalow with hip roof and a carport
    const [x, z, w, d] = placeFront(rr(-0.08, 0.08), rr(0.72, 0.86), rr(0.5, 0.58), rr(0.16, 0.24));
    body(x, z, 0, w, d, ST + 0.03, 0, wall, roofCol, S.HOUSE, F.DOOR);
    pitched(x, z, ST + 0.03, w, d, 0, rr(0.14, 0.18), roofCol, wall, style, 1);
    if (!L.build) {
      frontPath(x, z + d / 2, 0.07, PAL.paving, S.PAVE);
      treeSpot(rr(-0.35, 0.35), z - d / 2 - 0.16, 0, 0, rr(0.4, 0.55));
      treeSpot(x > 0 ? -0.66 : 0.66, 0.1, 0, 2, rr(0.36, 0.46));
    }
  }
  if (!L.build) {
    // garden borders: hedge, picket fence or timber fence
    const b = rnd();
    borders((th) => {
      if (b < 0.45) edgeSeg(th, 0.045, 0.94, 0.012, rr(0.05, 0.07), 0.05, jit(PAL.hedge, 0.08), S.HEDGE);
      else if (b < 0.75) edgeSeg(th, 0.03, 0.96, 0.012, 0.05, 0.012, PAL.picket, S.FENCE, 0);
      else edgeSeg(th, 0.03, 0.96, 0.012, 0.09, 0.012, jit(PAL.woodFence, 0.05), S.FENCE, 2);
    });
  }
}

// Residential L2: apartment slab, L-block, hip-roofed townhouse block
function resL2() {
  const v = rnd();
  const wall = jit(pick([PAL.walls[0], PAL.walls[1], PAL.walls[2], PAL.walls[7], PAL.walls[5], PAL.walls[6], PAL.walls[3]]), 0.04);
  const storeys = ri(3, 5);
  const h = storeys * ST + 0.03;
  stackH(h + 0.05);
  const flat = rnd() < 0.6;
  const roofCol = flat ? jit(pick([PAL.gravel, PAL.membrane, PAL.darkRoof]), 0.05) : jit(rnd() < 0.6 ? PAL.terra : PAL.slate, 0.05);
  const style = roofCol === PAL.terra || roofCol[0] > 0.25 ? 0 : 1;
  const balc = rnd() < 0.6 ? F.BALC : 0;
  if (v < 0.6) {
    const [x, z, w, d] = placeFront(rr(-0.05, 0.05), rr(0.9, 1.04), rr(0.46, 0.56), rr(0.1, 0.18));
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.APT, F.DOOR | balc);
    if (flat) { parapet(x, z, h, w, d, 0, wall); roofClutter(x, z, h, w, d, 0, 'res'); }
    else pitched(x, z, h, w, d, 0, rr(0.16, 0.22), roofCol, wall, style, rnd() < 0.5 ? 1 : 0);
    if (!L.build) {
      frontPath(x, z + d / 2, 0.1, PAL.paving, S.PAVE);
      const bz = z - d / 2 - 0.15;
      if (rectOK(0, bz, 0.84, 0.2, 0, 0.06)) parking(0, bz, 0.84, 0.2, 0);
      else treeSpot(rr(-0.3, 0.3), bz, 0, 0, rr(0.38, 0.5));
      treeSpot(x - w / 2 - 0.08 > -0.7 ? -0.62 : 0.62, z + 0.1, 0, rnd() < 0.5 ? 0 : 2, rr(0.38, 0.5));
    }
  } else if (v < 0.85) {
    // L-block around a courtyard
    const [x, z, w, d] = placeFront(0, rr(0.92, 1.04), 0.42, rr(0.08, 0.14));
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.APT, F.DOOR | balc);
    const side = rnd() < 0.5 ? -1 : 1;
    const ww = 0.38, wd = rr(0.44, 0.56);
    const wx = x + side * (w / 2 - ww / 2), wz = z - d / 2 - wd / 2 + 0.01;
    const [fx, fz, fw, fd] = fitAt(wx, wz, ww, wd);
    body(fx, fz, 0, fw, fd, h - ST, 0, wall, roofCol, S.APT, balc);
    if (flat) {
      parapet(x, z, h, w, d, 0, wall); parapet(fx, fz, h - ST, fw, fd, 0, wall);
      roofClutter(x, z, h, w, d, 0, 'res');
    } else {
      pitched(x, z, h, w, d, 0, 0.18, roofCol, wall, style, 1);
      pitched(fx, fz, h - ST, fd, fw, PI / 2, 0.16, roofCol, wall, style, 1);
    }
    if (!L.build) {
      treeSpot(-side * 0.25, z - d / 2 - 0.25, 0, 0, rr(0.42, 0.55));
      treeSpot(-side * 0.05, z - d / 2 - 0.45, 0, 2, rr(0.38, 0.5));
      frontPath(x, z + d / 2, 0.1, PAL.paving, S.PAVE);
    }
  } else {
    // two staggered blocks
    const hw = rr(0.44, 0.5), d = rr(0.42, 0.5);
    const [x0, z0, w0] = placeFront(-0.22, hw, d, 0.12);
    body(x0, z0, 0, w0, d, h, 0, wall, roofCol, S.APT, F.DOOR | balc);
    const wallB = jit(pick(PAL.walls), 0.04);
    const [x1, z1, w1, d1] = fitAt(0.26, z0 - 0.16, hw, d);
    body(x1, z1, 0, w1, d1, h - ST, 0, wallB, roofCol, S.APT, F.DOOR | balc);
    if (flat) { parapet(x0, z0, h, w0, d, 0, wall); parapet(x1, z1, h - ST, w1, d1, 0, wallB); roofClutter(x0, z0, h, w0, d, 0, 'res'); }
    else { pitched(x0, z0, h, w0, d, 0, 0.17, roofCol, wall, style, 1); pitched(x1, z1, h - ST, w1, d1, 0, 0.16, roofCol, wallB, style, 1); }
    if (!L.build) { treeSpot(0.3, z1 - d1 / 2 - 0.2, 0, 0, rr(0.4, 0.5)); frontPath(x0, z0 + d / 2, 0.08, PAL.paving, S.PAVE); }
  }
  if (!L.build) borders((th) => { if (rnd() < 0.7) edgeSeg(th, 0.045, 0.9, 0.012, 0.055, 0.05, jit(PAL.hedge2, 0.08), S.HEDGE); });
}

// Residential L3: tower on a podium, slab tower, twin towers
function resL3() {
  const v = rnd();
  const wall = jit(pick(PAL.towerWalls), 0.04);
  const accent = jit(pick(PAL.towerWalls), 0.03);
  const rib = rnd() < 0.35 ? F.RIBBON : 0;
  const storeys = ri(8, 16);
  const pod = ST + 0.04;
  const h = storeys * ST;
  stackH(pod + h + 0.2);
  const [px, pz, pw, pd] = placeFront(0, rr(0.86, 0.98), rr(0.66, 0.76), rr(0.04, 0.1));
  body(px, pz, 0, pw, pd, pod, 0, accent, PAL.membrane, S.SHOP, F.SHOP);
  parapet(px, pz, pod, pw, pd, 0, accent, 0.03);
  if (v < 0.5) {
    const tw = rr(0.52, 0.64), td = rr(0.46, 0.56);
    const tx = px + rr(-0.06, 0.06), tz = pz + rr(-0.04, 0.02);
    body(tx, tz, pod, tw, td, h, 0, wall, PAL.gravel, S.APT, F.BALC | rib);
    parapet(tx, tz, pod + h, tw, td, 0, wall);
    put(P.BOX, tx, pod + h, tz, 0, tw * 0.45, 0.15, td * 0.45, PAL.walls[7], PAL.gravel, S.PLAIN, 0);
    roofClutter(tx, tz, pod + h, tw, td, 0, 'big');
  } else if (v < 0.75) {
    const tw = rr(0.66, 0.76), td = rr(0.32, 0.38);
    body(px, pz - 0.04, pod, tw, td, h - ST * 2, 0, wall, PAL.gravel, S.APT, F.BALC | rib);
    parapet(px, pz - 0.04, pod + h - ST * 2, tw, td, 0, wall);
    roofClutter(px, pz - 0.04, pod + h - ST * 2, tw, td, 0, 'big');
  } else {
    const tw = 0.36, h2 = h - ri(2, 4) * ST;
    body(px - 0.21, pz + 0.02, pod, tw, tw, h, 0, wall, PAL.gravel, S.APT, F.BALC | rib);
    body(px + 0.22, pz - 0.06, pod, tw, tw, h2, 0, wall, PAL.gravel, S.APT, F.BALC | rib);
    parapet(px - 0.21, pz + 0.02, pod + h, tw, tw, 0, wall);
    parapet(px + 0.22, pz - 0.06, pod + h2, tw, tw, 0, wall);
    roofClutter(px - 0.21, pz + 0.02, pod + h, tw, tw, 0, 'res');
    roofClutter(px + 0.22, pz - 0.06, pod + h2, tw, tw, 0, 'res');
  }
  if (!L.build) {
    treeSpot(0.6 * (rnd() < 0.5 ? 1 : -1), pz + pd / 2 + 0.05, 0, 2, rr(0.38, 0.48));
    planterRow();
  }
}

function planterRow() {
  // planters + street trees along the frontage (C forecourts, tower podiums), clear of the facade
  const zf = Math.max(frontLimit(0, 0.6, 0.06) - 0.05, L.frontZ + 0.07);
  for (const x of [-0.42, 0.42]) {
    if (!hexOK(x, zf, 0.06)) continue;
    put(P.BOX, x, 0.012, zf, 0, 0.1, 0.045, 0.1, PAL.concrete, PAL.hedge, S.PLANTER, 0);
    if (rnd() < 0.7) treeSpot(x, zf, 0.05, rnd() < 0.6 ? 0 : 2, rr(0.32, 0.42));
  }
}

// Commercial L1: shop row with awning, corner diner, small office
function comL1() {
  const v = rnd();
  const wall = jit(pick(PAL.walls), 0.04);
  const roofCol = jit(pick([PAL.gravel, PAL.membrane, PAL.darkRoof]), 0.05);
  const storeys = rnd() < 0.5 ? 1 : 2;
  const h = storeys * ST + 0.04;
  stackH(h + 0.05);
  if (v < 0.6) {
    const [x, z, w, d] = placeFront(rr(-0.04, 0.04), rr(0.86, 1.0), rr(0.46, 0.56), rr(0.12, 0.18));
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.SHOP, F.SHOP);
    parapet(x, z, h, w, d, 0, wall, 0.06);
    roofClutter(x, z, h, w, d, 0, 'com');
    if (!L.build) {
      const ac = jit(pick(PAL.awn), 0.04);
      put(P.BOX, x, ST * 0.78, z + d / 2 + 0.05, 0, w * 0.96, 0.012, 0.1, ac, ac, S.AWN, 0, 0, 0.32, 0);
      const bz = z - d / 2 - 0.15;
      if (rectOK(0, bz, 0.84, 0.2, 0, 0.06)) parking(0, bz, 0.84, 0.2, 0);
    }
  } else if (v < 0.8) {
    // pavilion: glass box with a deep flat roof canopy
    const [x, z, w, d] = placeFront(0, rr(0.66, 0.78), rr(0.44, 0.52), rr(0.16, 0.24));
    body(x, z, 0, w, d, ST + 0.04, 0, jit(PAL.walls[0], 0.03), roofCol, S.SHOP, F.SHOP);
    if (!L.build) {
      put(P.BOX, x, ST + 0.04, z + 0.02, 0, w + 0.1, 0.03, d + 0.1, PAL.walls[7], roofCol, S.PLAIN, 0);
      prop(x, z, ST + 0.07, w * 0.5, 0.06, 0.012, 0, jit(pick(PAL.sign), 0.02), S.PLAIN);
      const bx = x > 0 ? -0.45 : 0.45;
      if (rectOK(bx, 0, 0.2, 0.5, 0, 0.08)) parking(bx, -0.05, 0.5, 0.2, PI / 2);
    }
  } else {
    const [x, z, w, d] = placeFront(rr(-0.08, 0.08), rr(0.62, 0.74), rr(0.48, 0.56), rr(0.12, 0.2));
    body(x, z, 0, w, d, 2 * ST + 0.04, 0, wall, roofCol, S.SHOP, F.SHOP);
    parapet(x, z, 2 * ST + 0.04, w, d, 0, wall, 0.05);
    roofClutter(x, z, 2 * ST + 0.04, w, d, 0, 'com');
    if (!L.build) treeSpot(-x * 1.4, z - 0.2, 0, 0, rr(0.38, 0.48));
  }
  if (!L.build) planterRow();
}

// Commercial L2: mixed-use block, low office with glass ribbons, department store
function comL2() {
  const v = rnd();
  const storeys = ri(3, 5);
  const h = storeys * ST + 0.04;
  stackH(h + 0.08);
  const roofCol = jit(pick([PAL.gravel, PAL.membrane, PAL.darkRoof]), 0.05);
  if (v < 0.5) {
    const wall = jit(pick(PAL.walls), 0.04);
    const [x, z, w, d] = placeFront(rr(-0.04, 0.04), rr(0.92, 1.04), rr(0.56, 0.66), rr(0.05, 0.1));
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.SHOP, F.SHOP);
    parapet(x, z, h, w, d, 0, wall, 0.05);
    roofClutter(x, z, h, w, d, 0, 'com');
    if (!L.build && rnd() < 0.6) { const ac = jit(pick(PAL.awn), 0.04); put(P.BOX, x, ST * 0.8, z + d / 2 + 0.045, 0, w * 0.9, 0.012, 0.09, ac, ac, S.AWN, 0, 0, 0.3, 0); }
  } else if (v < 0.8) {
    const glass = jit(pick(PAL.glassTint), 0.03), mull = pick(PAL.mullion);
    const [x, z, w, d] = placeFront(0, rr(0.86, 0.98), rr(0.56, 0.64), rr(0.08, 0.14));
    body(x, z, 0, w, d, ST + 0.04, 0, mull, roofCol, S.SHOP, F.SHOP); // podium
    body(x, z, ST + 0.04, w, d, h - ST - 0.04, 0, glass, mull, S.OFFICE, rnd() < 0.4 ? F.FINS : 0);
    parapet(x, z, h, w, d, 0, mull, 0.04);
    roofClutter(x, z, h, w, d, 0, 'big');
    if (!L.build) { const bx = x > 0 ? -0.5 : 0.5; if (rectOK(bx, -0.1, 0.2, 0.4, 0, 0.08)) parking(bx, -0.1, 0.4, 0.2, PI / 2); }
  } else {
    const wall = jit(pick([PAL.walls[7], PAL.walls[1], PAL.walls[0]]), 0.03);
    const [x, z, w, d] = placeFront(0, rr(0.98, 1.08), rr(0.68, 0.76), 0.06);
    body(x, z, 0, w, d, 3 * ST + 0.04, 0, wall, roofCol, S.PLAIN, F.SHOP);
    parapet(x, z, 3 * ST + 0.04, w, d, 0, wall, 0.06);
    prop(x, z + d / 2 + 0.006, 2 * ST, w * 0.5, 0.1, 0.012, 0, jit(pick(PAL.sign), 0.02), S.PLAIN);
    roofClutter(x, z, 3 * ST + 0.04, w, d, 0, 'big');
  }
  if (!L.build) planterRow();
}

// Commercial L3: glass tower with setbacks, slender crowned tower, office slab with fins
function comL3() {
  const v = rnd();
  const storeys = ri(8, 16);
  const glass = jit(pick(PAL.glassTint), 0.03), mull = pick(PAL.mullion);
  const stone = jit(pick([PAL.walls[7], PAL.walls[1], PAL.walls[0], PAL.walls[2]]), 0.03);
  const pod = 2 * ST + 0.04;
  const h = storeys * ST;
  stackH(pod + h + 0.3);
  const [px, pz, pw, pd] = placeFront(0, rr(0.9, 1.02), rr(0.7, 0.8), 0.04);
  body(px, pz, 0, pw, pd, pod, 0, stone, PAL.membrane, S.SHOP, F.SHOP);
  parapet(px, pz, pod, pw, pd, 0, stone, 0.03);
  if (v < 0.45) {
    const tw = rr(0.62, 0.72), td = rr(0.54, 0.64), h1 = h - ri(2, 4) * ST;
    body(px, pz, pod, tw, td, h1, 0, glass, mull, S.OFFICE, 0);
    const sw = tw * rr(0.62, 0.75), sd = td * rr(0.62, 0.75);
    body(px, pz, pod + h1, sw, sd, h - h1, 0, glass, mull, S.OFFICE, 0);
    parapet(px, pz, pod + h1, tw, td, 0, mull, 0.03);
    parapet(px, pz, pod + h, sw, sd, 0, mull, 0.05);
    if (rnd() < 0.5) put(P.CYL, px, pod + h, pz, 0, 0.025, rr(0.35, 0.6), 0.025, PAL.metal, PAL.metal, S.PLAIN, 0);
    roofClutter(px, pz, pod + h, sw, sd, 0, 'big');
  } else if (v < 0.75) {
    const tw = rr(0.52, 0.6);
    const facade = rnd() < 0.5;
    body(px, pz, pod, tw, tw, h, 0, facade ? glass : stone, facade ? mull : PAL.walls[7], facade ? S.OFFICE : S.SHOP, facade ? F.FINS : 0);
    // crown: a lighter top band and a mechanical box
    put(P.BOX, px, pod + h, pz, 0, tw * 0.9, 0.12, tw * 0.9, mull, PAL.membrane, S.PLAIN, 0);
    parapet(px, pz, pod + h, tw, tw, 0, mull, 0.05);
    put(P.BOX, px, pod + h + 0.12, pz, 0, 0.012, rr(0.3, 0.5), 0.012, PAL.metalDark, PAL.metalDark, S.PLAIN, 0);
  } else {
    const tw = rr(0.76, 0.86), td = rr(0.38, 0.44), h1 = h - 2 * ST;
    body(px, pz - 0.05, pod, tw, td, h1, 0, glass, mull, S.OFFICE, F.FINS);
    parapet(px, pz - 0.05, pod + h1, tw, td, 0, mull, 0.04);
    roofClutter(px, pz - 0.05, pod + h1, tw, td, 0, 'big');
  }
  if (!L.build) planterRow();
}

// Industrial L1: workshop shed with office, yard storage
function indL1() {
  const wall = jit(pick([PAL.shed, PAL.redox, PAL.walls[7], PAL.walls[4], PAL.walls[5]]), 0.04);
  const roofCol = jit(pick([PAL.sheet, PAL.slate, PAL.redox]), 0.04);
  const h = rr(0.28, 0.34);
  stackH(h + 0.08);
  const [x, z, w, d] = placeFront(rr(-0.12, 0.12), rr(0.66, 0.8), rr(0.46, 0.56), rr(0.16, 0.26));
  body(x, z, 0, w, d, h, 0, wall, roofCol, S.SHED, 0);
  pitched(x, z, h, w, d, 0, 0.09, roofCol, wall, 2);
  const side = x > 0 ? -1 : 1;
  const ox = x + side * (w / 2 + 0.11), oz = z + d / 2 - 0.11;
  if (rectOK(ox, oz, 0.22, 0.22, 0, 0.06)) {
    body(ox, oz, 0, 0.22, 0.22, ST + 0.03, 0, PAL.walls[0], PAL.gravel, S.SHOP, F.DOOR);
    parapet(ox, oz, ST + 0.03, 0.22, 0.22, 0, PAL.walls[0], 0.02);
  }
  yardClutter(z - d / 2 - 0.05, 3);
  if (!L.build) {
    frontPath(x, z + d / 2, 0.24, PAL.concreteDark, S.PAVE);
    car(x - w * 0.2, z + d / 2 + 0.14, PI / 2 + 0.1);
  }
  chainFence();
}

function chainFence() {
  if (L.build) return;
  borders((th) => edgeSeg(th, 0.025, 0.97, 0.012, 0.13, 0.008, PAL.chain, S.FENCE, 1));
}
function yardClutter(zBack, n) {
  if (L.build) return;
  for (let k = 0; k < n; k++) {
    const x = rr(-0.5, 0.5), z = zBack - rr(0.05, 0.3);
    const r = rnd();
    if (r < 0.45) {
      // container (0.5 x 0.2 x 0.21 = 6 m x 2.4 m x 2.6 m)
      if (!rectOK(x, z, 0.5, 0.2, 0, 0.06)) continue;
      const stack = rnd() < 0.3 ? 2 : 1;
      for (let s = 0; s < stack; s++) put(P.BOX, x + s * rr(-0.02, 0.02), s * 0.21, z, rr(-0.04, 0.04), 0.5, 0.21, 0.2, jit(pick(PAL.cont), 0.05), ZERO3, S.CONT, 0);
    } else if (r < 0.8) {
      if (!hexOK(x, z, 0.1)) continue;
      const nn = ri(1, 3);
      for (let s = 0; s < nn; s++) put(P.BOX, x + s * 0.1, 0.012, z, 0, 0.09, rr(0.03, 0.08), 0.09, jit(PAL.wood, 0.08), ZERO3, S.WOOD, 0);
    } else {
      if (!hexOK(x, z, 0.12)) continue;
      put(P.CYL, x, 0.012, z, 0, 0.12, 0.14, 0.12, jit(PAL.shed, 0.05), PAL.metalDark, S.TANK, 0);
    }
  }
}

// Industrial L2: warehouse with sawtooth or shallow roof, factory with chimney, tank yard
function indL2() {
  const v = rnd();
  const wall = jit(pick([PAL.shed, PAL.redox, PAL.walls[7], PAL.walls[4], PAL.walls[5]]), 0.04);
  const roofCol = jit(pick([PAL.sheet, PAL.slate, PAL.redox, PAL.gravel]), 0.04);
  const h = rr(0.4, 0.5);
  stackH(h + 0.12);
  if (v < 0.5) {
    const [x, z, w, d] = placeFront(rr(-0.04, 0.04), rr(0.96, 1.08), rr(0.62, 0.72), rr(0.1, 0.16));
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.SHED, 0);
    if (rnd() < 0.5) {
      const n = 4, dd = d / n;
      for (let k = 0; k < n; k++) pitched(x, z - d / 2 + dd * (k + 0.5), h, w, dd, 0, 0.08, roofCol, wall, 2, 0, 0.5, 0.0);
    } else pitched(x, z, h, w, d, 0, 0.08, roofCol, wall, 2, 0, 0, 0.02);
    // loading canopy
    if (!L.build) put(P.BOX, x, h * 0.55, z + d / 2 + 0.05, 0, w * 0.6, 0.015, 0.1, PAL.metalDark, PAL.metalDark, S.PLAIN, 0);
    yardClutter(z - d / 2, 4);
    if (!L.build && rectOK(x + w * 0.25, z + d / 2 + 0.2, 0.18, 0.62, 0, 0.04)) truck(x + w * 0.25, z + d / 2 + 0.2, PI / 2 + 0.05);
  } else {
    const [x, z, w, d] = placeFront(rr(-0.18, -0.1), rr(0.68, 0.78), rr(0.54, 0.62), rr(0.12, 0.2));
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.SHED, 0);
    pitched(x, z, h, w, d, 0, 0.09, roofCol, wall, 2);
    const cx = x + w / 2 + 0.12, cz = z - d * 0.2;
    if (hexOK(cx, cz, 0.08)) {
      const ch = rr(0.9, 1.2);
      stackH(ch);
      cyl(cx, cz, 0, 0.075, ch, rnd() < 0.5 ? PAL.chimWhite : PAL.concrete, PAL.chimWhite, S.CHIM);
    }
    const tx = x + w / 2 + 0.14, tz = z + d * 0.3;
    if (hexOK(tx, tz, 0.12)) cyl(tx, tz, 0, 0.18, rr(0.22, 0.3), jit(PAL.walls[0], 0.03), PAL.sheet, S.TANK);
    yardClutter(z - d / 2, 3);
  }
  chainFence();
}

// Industrial L3: heavy plant with tall chimney and tanks, tank farm, silo plant
function indL3() {
  const v = rnd();
  const wall = jit(pick([PAL.shed, PAL.redox, PAL.walls[7], PAL.walls[5]]), 0.04);
  const roofCol = jit(pick([PAL.sheet, PAL.slate, PAL.gravel]), 0.04);
  if (v < 0.45) {
    const h = rr(0.55, 0.7);
    stackH(1.9);
    const [x, z, w, d] = placeFront(rr(-0.16, -0.08), rr(0.8, 0.9), rr(0.58, 0.66), rr(0.06, 0.12));
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.SHED, 0);
    pitched(x, z, h, w, d, 0, 0.08, roofCol, wall, 2, 0, 0, 0.02);
    // annex with flat roof
    body(x - w * 0.1, z + d / 2 + 0.0 - 0.1, 0, w * 0.5, 0.2, ST + 0.05, 0, PAL.walls[7], PAL.gravel, S.SHOP, F.DOOR);
    const cx = x + w / 2 + 0.14, cz = z - d * 0.25;
    const chH = rr(1.5, 2.1);
    stackH(chH);
    if (hexOK(cx, cz, 0.06)) cyl(cx, cz, 0, 0.1, chH, PAL.chimWhite, PAL.chimWhite, S.CHIM);
    for (let k = 0; k < 2; k++) {
      const tx = x + w / 2 + 0.12, tz = z + d * 0.25 - k * 0.0, ty = 0;
      if (k === 0 && hexOK(tx, tz + 0.12, 0.12)) cyl(tx, tz + 0.12, ty, 0.2, rr(0.35, 0.45), jit(PAL.walls[0], 0.03), PAL.sheet, S.TANK);
    }
    // pipe rack gantry along the back
    if (!L.build) {
      const gz = z - d / 2 - 0.12;
      for (let k = -2; k <= 2; k++) prop(k * 0.12, gz, 0.012, 0.015, 0.22, 0.015, 0, PAL.metalDark, S.PLAIN);
      prop(0, gz, 0.2, 0.5, 0.025, 0.05, 0, PAL.redox, S.PLAIN);
    }
    yardClutter(z - d / 2 - 0.1, 2);
  } else if (v < 0.75) {
    // tank farm with a control building
    stackH(0.9);
    const [x, z, w, d] = placeFront(0.3, 0.26, 0.22, 0.1);
    body(x, z, 0, w, d, ST * 2 + 0.03, 0, PAL.walls[0], PAL.gravel, S.SHOP, F.DOOR);
    parapet(x, z, ST * 2 + 0.03, w, d, 0, PAL.walls[0], 0.02);
    const tanks = [[-0.3, 0.25], [-0.3, -0.25], [0.15, -0.3], [0.45, -0.2]];
    for (const [tx, tz] of tanks) if (hexOK(tx, tz, 0.17)) cyl(tx, tz, 0, rr(0.28, 0.34), rr(0.22, 0.32), jit(rnd() < 0.7 ? PAL.walls[0] : PAL.shed, 0.03), PAL.sheet, S.TANK);
    if (hexOK(-0.05, 0.05, 0.06)) cyl(-0.05, 0.05, 0, 0.035, rr(0.8, 1.0), PAL.metalDark, PAL.metalDark, S.CHIM);
    if (!L.build) {
      prop(-0.05, -0.02, 0.1, 0.7, 0.02, 0.03, 0.55, PAL.metal, S.PLAIN);
      prop(-0.3, 0.0, 0.1, 0.03, 0.02, 0.4, 0, PAL.metal, S.PLAIN);
    }
  } else {
    // silo plant: a row of tall silos, conveyor gantry and a shed
    stackH(1.3);
    const h = rr(0.45, 0.55);
    const [x, z, w, d] = placeFront(0.22, 0.36, 0.34, 0.12);
    body(x, z, 0, w, d, h, 0, wall, roofCol, S.SHED, 0);
    pitched(x, z, h, w, d, 0, 0.07, roofCol, wall, 2);
    const sh = rr(0.9, 1.15), n = ri(3, 4);
    for (let k = 0; k < n; k++) {
      const sx = -0.42 + k * 0.17, sz = -0.08 + (k % 2) * 0.0;
      if (hexOK(sx, sz, 0.1)) cyl(sx, sz, 0, 0.16, sh, jit(PAL.walls[7], 0.03), PAL.sheet, S.TANK);
    }
    if (!L.build) {
      prop(-0.2, -0.08, sh + 0.0, 0.55, 0.06, 0.06, 0, PAL.metalDark, S.PLAIN);
      prop(0.06, -0.08, sh * 0.5, 0.06, 0.05, 0.06, 0, PAL.metalDark, S.PLAIN, -0.55);
    }
    yardClutter(-0.3, 2);
  }
  chainFence();
}

function rubbleLot() {
  pad(2);
  const n = ri(5, 8);
  const col = PAL.rubble;
  for (let k = 0; k < n; k++) {
    const x = rr(-0.4, 0.4), z = rr(-0.35, 0.35);
    if (!hexOK(x, z, 0.12)) continue;
    const s = rr(0.08, 0.24);
    put(P.BOX, x, -0.02, z, rnd() * PI, s, rr(0.04, 0.1), s * rr(0.6, 1.2), jit(col, 0.12), col, S.RUBBLE, 0, 0, rr(-0.5, 0.5), rr(-0.4, 0.4));
  }
  // a broken wall stub
  if (rnd() < 0.7) put(P.BOX, rr(-0.2, 0.2), 0, rr(-0.2, 0.1), rnd() * PI, rr(0.2, 0.35), rr(0.12, 0.3), 0.04, jit(pick(PAL.walls), 0.05), col, S.RUBBLE, 0);
}

function constructionDressing() {
  L.build = false;
  pad(1);
  // site hoarding along every non-road edge, site cabin, material pallets
  borders((th) => edgeSeg(th, 0.03, 0.96, 0.012, 0.1, 0.012, PAL.hoardA, S.HOARD));
  const cx = rnd() < 0.5 ? -0.5 : 0.5;
  if (hexOK(cx, -0.3, 0.12)) put(P.BOX, cx, 0.014, -0.3, PI / 2, 0.24, 0.1, 0.12, PAL.walls[0], PAL.walls[0], S.CONT, 0);
  for (let k = 0; k < 2; k++) {
    const x = rr(-0.4, 0.4), z = rr(-0.5, -0.2);
    if (hexOK(x, z, 0.1)) put(P.BOX, x, 0.014, z, rnd(), 0.1, 0.05, 0.1, jit(PAL.wood, 0.08), ZERO3, S.WOOD, 0);
  }
}

const ARCH = [null, [resL1, resL2, resL3], [comL1, comL2, comL3], [indL1, indL2, indL3]];

function chooseFront(i) {
  let mask = 0;
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j]) mask |= 1 << d; }
  L.roadMask = mask;
  if (!mask) { L.d = W.style[i] % 6; L.corner = false; return; }
  // runs of consecutive road neighbours: 2 -> face the corner between them, else the middle edge
  let best = -1, bestLen = 0, bestScore = -1;
  for (let d = 0; d < 6; d++) {
    if (!(mask & (1 << d)) || (mask & (1 << ((d + 5) % 6)) && mask !== 63)) continue;
    let len = 0;
    while (len < 6 && (mask & (1 << ((d + len) % 6)))) len++;
    const j = W.nbr[i * 6 + d];
    let deg = 0;
    for (let k = 0; k < 6; k++) { const n = W.nbr[j * 6 + k]; if (n >= 0 && W.road[n]) deg++; }
    const score = (len === 2 ? 30 : len) * 10 + deg + ((W.style[i] >> d) & 1) * 0.5;
    if (score > bestScore) { bestScore = score; best = d; bestLen = len; }
  }
  if (best < 0) { best = 0; bestLen = 6; }
  if (bestLen === 2) { L.d = best; L.corner = true; }
  else { L.d = (best + Math.floor((Math.min(bestLen, 5) - 1) / 2)) % 6; L.corner = false; }
}

// Generate staged instances for lot i. Returns true if anything was generated.
function genLot(i) {
  for (let p = 0; p < B.stageN.length; p++) B.stageN[p] = 0;
  L.nt = 0;
  L.top = 0;
  L.frontZ = -1;
  const z = W.zone[i], lvl = W.lvl[i], fl = W.flags[i];
  B.topY[i] = 0;
  const rubble = !!(fl & LF.RUBBLE);
  if (!z || (!lvl && !rubble) || !isLand(W.type[i])) { B.treeN[i] = 0; return false; }
  L.i = i; L.zone = z; L.lvl = Math.max(1, Math.min(3, lvl)); L.fl = fl;
  L.rs = (W.style[i] * 2654435761 ^ i * 40503 ^ L.lvl * 977 ^ z * 7919) | 0;
  rnd(); rnd();
  L.seed = ((W.style[i] * 131 + i * 17) % 997) / 997;
  L.fire = W.fire[i] / 255;
  L.aband = !!(fl & LF.ABANDONED);
  L.build = !!(fl & LF.BUILDING) && !rubble;
  L.rubble = rubble;
  L.stateFlags = L.aband ? F.ABAND : 0;
  L.t0 = W.lotT[i] >= 0 || L.build ? W.lotT[i] : 0;
  L.dur = lvl > 1 ? (GROWTH.levelUpRebuild || GROWTH.buildTime || 8) : (GROWTH.buildTime || 8);
  L.buildH = 0;
  L.cx = W.x[i]; L.cy = W.h[i]; L.cz = W.z[i];
  chooseFront(i);
  let dx = DIR_X[L.d], dz = DIR_Z[L.d];
  if (L.corner) { dx += DIR_X[(L.d + 1) % 6]; dz += DIR_Z[(L.d + 1) % 6]; }
  L.yaw = Math.atan2(dx, dz);
  L.c = Math.cos(L.yaw); L.s = Math.sin(L.yaw);
  if (rubble) { rubbleLot(); B.treeN[i] = 0; B.topY[i] = L.top; return true; }
  if (L.build) {
    // run the archetype in construction mode to get the masses, then dress the site
    const save = L.rs;
    ARCH[z][L.lvl - 1]();
    const nb = B.stageN[P.BOX];
    // the archetype set buildH via stackH(); patch it into every construction instance
    const a = B.stage[P.BOX];
    for (let k = 0; k < nb; k++) a[k * STRIDE + 29] = L.buildH;
    L.rs = save;
    constructionDressing();
    if (L.lvl === 3) craneFor();
    B.treeN[i] = 0;
    B.topY[i] = L.cy + L.buildH;
    return true;
  }
  pad(0);
  ARCH[z][L.lvl - 1]();
  B.treeN[i] = L.nt;
  B.topY[i] = L.top;
  return true;
}

function craneFor() {
  // stand the crane beside the stack, jib over it
  const opts = [[0.55, -0.3], [-0.55, -0.3], [0.55, 0.3], [-0.55, 0.3], [0, -0.62]];
  for (const [x, z] of opts) {
    if (!hexOK(x, z, 0.08)) continue;
    put(P.CRANE, x, 0, z, 0, 1, 1, 1, [1, 1, 1], [0, 0, 0], S.CRANE, 0, L.buildH + 0.45);
    return;
  }
}

// ------------------------------------------------------------------------------------------------ public
// Allocate per-tile state for the current world (call when W.count changes or a new world is generated).
export function resetBuildings() {
  const n = W.count;
  for (const s of B.slots) s.reset(n);
  B.treeBuf = new Float32Array(n * TREE_MAX * 5);
  B.treeN = new Uint8Array(n);
  B.topY = new Float32Array(n);
}

// Rebuild the lots in `tiles` (iterable of tile indices; duplicates allowed), or every tile when null.
export function buildLots(tiles) {
  if (!B.scene || !W.count) return;
  if (!B.treeN || B.treeN.length !== W.count) { resetBuildings(); tiles = null; }
  if (tiles == null) {
    for (const s of B.slots) s.reset(W.count);
    for (let i = 0; i < W.count; i++) writeLot(i);
    B.stats.full++;
  } else {
    for (const i of tiles) writeLot(i);
    B.stats.patch++;
    if (B.slots.some((s) => s.fragmented())) { B.stats.repack++; return buildLots(null); }
  }
  let bytes = 0;
  for (const s of B.slots) bytes += s.commit();
  B.stats.uploads += bytes;
  return bytes;
}

function writeLot(i) {
  genLot(i);
  for (let p = 0; p < B.slots.length; p++) {
    const s = B.slots[p];
    if (B.stageN[p] === 0 && s.cap[i] === 0) continue;
    s.write(i, B.stage[p], B.stageN[p]);
  }
}

export function lotTreeSpots() { return { buf: B.treeBuf, n: B.treeN, max: TREE_MAX }; }
// World-space top of the lot's building (0 when the lot shows nothing): for icons, fire FX, health bars.
export function lotTop(i) { return B.topY && i >= 0 && i < B.topY.length ? B.topY[i] : 0; }

export function buildingStats() {
  const pools = B.pools.map((p, k) => ({ name: p.mesh.name, count: p.mesh.count, live: B.slots[k].live, max: p.max, overflow: B.slots[k].overflow, tris: p.mesh.count * (p.mesh.geometry.attributes.position.count / 3) }));
  return { pools, ...B.stats };
}
export function buildingMeshes() { return B.pools.map((p) => p.mesh); }
export { B as _buildings, S as SURF, F as LOTF };
