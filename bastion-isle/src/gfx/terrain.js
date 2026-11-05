import * as THREE from 'three';
import { W, T, isLand, isWater, LF } from '../world.js';
import { worldToAxial } from '../hex.js';
import { makeNoise, mulberry32 } from '../rng.js';
import { U, MAP_MIN, MAP_SIZE } from './uniforms.js';
import { GU, OVERLAY_GLSL, overlayUniforms } from './overlay.js';
import grassD from '../../assets/ground/grass_d.jpg';
import sandD from '../../assets/ground/sand_d.jpg';
import rockD from '../../assets/ground/rock_d.jpg';
import dirtD from '../../assets/ground/dirt_d.jpg';
import asphaltD from '../../assets/ground/asphalt_d.jpg';
import pavingD from '../../assets/ground/paving_d.jpg';
import sidewalkD from '../../assets/ground/sidewalk_d.jpg';
import gravelD from '../../assets/ground/gravel_d.jpg';
import causticsD from '../../assets/ground/caustics.jpg';
import macro2D from '../../assets/ground/macro2.jpg';
import cliffD from '../../assets/ground/cliff_d.jpg';
import macroD from '../../assets/ground/macro.jpg';

// Terrain: ONE InstancedMesh of flat hex prisms (no bevel), heights from W.h. Shading from map-space splat
// textures (blurred + noise-warped so biome edges are not hex outlines), palette colour x texture luminance
// (UX review art rule 3), rock strata / retaining walls on height steps, sloped sand banks into the sea,
// baked contact AO, cloud shadows, night light map and all info-view overlays (overlay.js).

const C = (h) => new THREE.Color(h);
export const PAL = {
  grass: C(0x6e8c4c), meadow: C(0x8d9659), forest: C(0x4e6a3a), lawn: C(0x76964f), sand: C(0xd6c69c),
  wetSand: C(0xae9c76), rock: C(0x8a857c), darkRock: C(0x5f5b55), cliff: C(0x7a7368), dirt: C(0x7b6347),
  urban: C(0x9e9a92), gravel: C(0x8e8b84), wall: C(0x9f9b92), coping: C(0xc2beb4), clay: C(0x9a9890),
};

// per-instance flag bits (aT1.z), also used by roads.js
export const TF = { LOT: 1, ROAD: 2, BLD: 4, BUILT: 8, ELIGIBLE: 16, RUBBLE: 32, BUILDING: 64, ABANDONED: 128 };
export const SAND_PUSH = 0.42;   // how far a sand tile's bank reaches out under the sea (u)

// ------------------------------------------------------------------------------------------------ textures
async function decodeGray(bytes) {
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  const bmp = await createImageBitmap(blob);
  const w = bmp.width, h = bmp.height;
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0);
  bmp.close && bmp.close();
  return { w, h, d: ctx.getImageData(0, 0, w, h).data };
}

async function packRGBA(list, aniso) {
  const im = await Promise.all(list.map(decodeGray));
  const { w, h } = im[0];
  const out = new Uint8Array(w * h * 4);
  for (let c = 0; c < 4; c++) { const src = im[c].d; for (let p = 0, n = w * h; p < n; p++) out[p * 4 + c] = src[p * 4]; }
  const t = new THREE.DataTexture(out, w, h);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = aniso;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

// Decode the embedded detail maps and pack them into two RGBA textures (one fetch for four layers)
export async function loadGroundTextures(renderer, aniso = 4) {
  const a = Math.min(aniso, renderer ? renderer.capabilities.getMaxAnisotropy() : 4);
  const [t1, t2, t3] = await Promise.all([
    packRGBA([grassD, sandD, rockD, dirtD], a),
    packRGBA([asphaltD, pavingD, cliffD, macroD], a),
    packRGBA([sidewalkD, gravelD, causticsD, macro2D], a),
  ]);
  GU.uDetail.value = t1;
  GU.uDetail2.value = t2;
  GU.uDetail3.value = t3;
}

// ------------------------------------------------------------------------------------------------ geometry
// 18 vertices: corners k = 0..5 (angle 60k - 30 deg, pointy-top) on three rings; position.y = ring id
// (0 top, 1 sea level, 2 bottom). The vertex shader places them (see VERT_BEGIN). 28 triangles.
function prismGeometry() {
  const pos = [], corner = [], idx = [];
  for (let ring = 0; ring < 3; ring++) {
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k - Math.PI / 6;
      pos.push(Math.cos(a), ring, Math.sin(a));
      corner.push(k);
    }
  }
  const v = (ring, k) => ring * 6 + (k % 6);
  const P = (i) => [pos[i * 3], pos[i * 3 + 1] === 0 ? 0 : -pos[i * 3 + 1], pos[i * 3 + 2]];
  // add a triangle, flipping it if its normal does not face `out`
  const tri = (a, b, c, out) => {
    const pa = P(a), pb = P(b), pc = P(c);
    const ux = pb[0] - pa[0], uy = pb[1] - pa[1], uz = pb[2] - pa[2];
    const wx = pc[0] - pa[0], wy = pc[1] - pa[1], wz = pc[2] - pa[2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    if (nx * out[0] + ny * out[1] + nz * out[2] < 0) idx.push(a, c, b); else idx.push(a, b, c);
  };
  // top: fan of 4 triangles
  for (let k = 1; k < 5; k++) tri(v(0, 0), v(0, k), v(0, k + 1), [0, 1, 0]);
  // sides: top->mid, mid->bottom
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * (k + 0.5) - Math.PI / 6;
    const out = [Math.cos(a), 0, Math.sin(a)];
    for (let ring = 0; ring < 2; ring++) {
      tri(v(ring, k), v(ring, k + 1), v(ring + 1, k + 1), out);
      tri(v(ring, k), v(ring + 1, k + 1), v(ring + 1, k), out);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('aCorner', new THREE.Float32BufferAttribute(corner, 1));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  return g;
}

// ------------------------------------------------------------------------------------------------ shaders
const VERT_PARS = /* glsl */`
attribute float aCorner;
attribute vec4 aT0;   // tile index, corner coast mask (6 bits), sand-bank push, tile height
attribute vec4 aT1;   // terrain type, zone, flags (TF), road-facing edge mask
`;
const VERT_PARS_MAIN = VERT_PARS + /* glsl */`
flat varying vec4 vT0;
flat varying vec4 vT1;
varying vec3 vWPos;
varying vec2 vLocal;
`;
// ring 0 = top at the tile height; ring 1 = just under sea level (pushed outwards on coast corners of sand
// tiles, which makes a sloped beach bank instead of a wall); ring 2 = deep bottom
const BEGIN = /* glsl */`
  float ring = position.y;
  float h = aT0.w;
  float bit = mod(floor(aT0.y / exp2(aCorner) + 0.001), 2.0);
  float push = ring > 0.5 ? bit * aT0.z : 0.0;
  float ly = ring < 0.5 ? 0.0 : (ring < 1.5 ? -0.07 - h : -3.0 - h);
  vec3 transformed = vec3(position.x * (1.0 + push), ly, position.z * (1.0 + push));
`;
const VERT_BEGIN = BEGIN + /* glsl */`
  vT0 = aT0; vT1 = aT1;
  vLocal = transformed.xz;
  vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
`;

const FRAG_PARS = /* glsl */`
uniform sampler2D uDetail, uDetail2, uDetail3, uSplat, uSplat2, uCoast, uNightLight;
uniform vec2 uCloudOfs;
uniform float uCloudStrength, uZoneView, uZoneCurb;
uniform vec3 uZoneCol[3];
uniform vec3 cGrass, cMeadow, cForest, cLawn, cSand, cWetSand, cRock, cDarkRock, cCliff, cDirt, cUrban, cGravel, cWall, cCoping, cClay;
flat varying vec4 vT0;
flat varying vec4 vT1;
varying vec3 vWPos;
varying vec2 vLocal;
float gRough = 0.9;
float gAO = 1.0;
float gCloud = 1.0;
vec3 gEmi = vec3(0.0);
${OVERLAY_GLSL}
`;

const FRAG_MAIN = /* glsl */`
{
  vec3 wp = vWPos;
  vec2 w = wp.xz;
  vec3 fN = normalize(cross(dFdx(wp), dFdy(wp)));
  float px = max(length(dFdx(w)), length(dFdy(w)));
  vec2 muv = (w - uMapMin) / uMapSize;
  int flags = int(vT1.z + 0.5);
  int ttype = int(vT1.x + 0.5);
  float topY = vT0.w;

  // macro variation (two scales) also warps the splat lookup so biome edges are organic
  float mac = texture(uDetail2, w * 0.0435).a;
  float mac2 = texture(uDetail2, w * 0.137 + vec2(0.31, 0.77)).a;
  vec2 wo = (vec2(mac, mac2) - 0.5) * 0.9 / uMapSize;
  vec4 sp = texture(uSplat, muv + wo);
  vec4 sp2 = texture(uSplat2, muv + wo * 0.5);
  vec2 cst = texture(uCoast, muv).rg;
  vec4 d1 = texture(uDetail, w * 0.25);
  vec4 d2 = texture(uDetail2, w * 0.25 + vec2(0.37, 0.61));
  vec4 d5 = texture(uDetail3, w * 0.31 + vec2(0.71, 0.13));

  // ---- top surface: height-blended splat layers
  float wU = sp.a;
  vec4 wv = vec4(max(0.0, 1.0 - sp.r - sp.g - sp.b - wU), sp.r, sp.g, sp.b); // grass sand rock dirt
  vec4 hh = d1 + 0.2;
  wv *= hh * hh;
  float hu = d2.g + 0.2;
  float wu = wU * hu * hu;
  float ws = wv.x + wv.y + wv.z + wv.w + wu + 1e-5;
  wv /= ws; wu /= ws;
  float wet = smoothstep(0.38, 0.49, cst.g);
  vec3 grass = mix(cGrass, cMeadow, smoothstep(0.36, 0.7, mac));
  grass = mix(grass, cForest, sp2.r);
  grass = mix(grass, cLawn, sp2.b * 0.85);
  grass *= mix(1.0, d1.r * 2.0, 0.8);
  vec3 sand = mix(cSand, cWetSand, wet) * mix(1.0, d1.g * 2.0, 1.6);
  vec3 rock = mix(cRock, cDarkRock, smoothstep(0.42, 0.68, mac2)) * mix(1.0, d1.b * 2.0, 1.3);
  vec3 dirt = cDirt * mix(1.0, d1.a * 2.0, 0.85) * mix(1.0, d5.g * 2.0, 0.35);
  vec3 urban = mix(cUrban * mix(1.0, d2.g * 2.0, 1.2), cGravel * mix(1.0, d5.g * 2.0, 0.9), sp2.a);
  vec3 topCol = grass * wv.x + sand * wv.y + rock * wv.z + dirt * wv.w + urban * wu;
  topCol *= 0.9 + 0.2 * mac;
  float topRough = 0.95 * wv.x + mix(0.92, 0.5, wet) * wv.y + 0.86 * wv.z + 0.95 * wv.w + 0.8 * wu;

  // ---- side faces: rock strata, earth banks, concrete retaining / quay walls
  vec2 hn = fN.xz / max(length(fN.xz), 1e-4);
  float su = dot(w, vec2(-hn.y, hn.x));
  vec4 d3 = texture(uDetail2, vec2(su * 0.3, wp.y * 0.3));
  float below = topY - wp.y;
  vec3 sideCol; float sideRough;
  if ((flags & 14) != 0) {
    float jx = abs(fract(su / 0.32) - 0.5) * 0.32;
    float joint = 1.0 - (1.0 - smoothstep(0.003, 0.007, jx)) * 0.3;
    float course = abs(fract((wp.y - topY) / 0.06) - 0.5) * 0.06;
    joint *= 1.0 - (1.0 - smoothstep(0.002, 0.005, course)) * 0.12;
    sideCol = cWall * mix(1.0, d2.g * 2.0, 1.0) * joint * (0.92 + 0.16 * mac2);
    sideCol = mix(sideCol, cCoping, 1.0 - smoothstep(0.012, 0.018, below));
    sideRough = 0.85;
  } else if (ttype == 2) {
    sideCol = mix(cSand, cWetSand, 0.35 + 0.65 * wet) * mix(1.0, d1.g * 2.0, 1.5);
    sideRough = 0.9;
  } else {
    float st = d3.b * 2.0;
    sideCol = mix(cCliff, cDarkRock, 0.35 * smoothstep(0.45, 0.7, mac) + 0.3 * smoothstep(1.0, 0.6, st)) * st;
    if (ttype != 6) {
      float lip = 1.0 - smoothstep(0.01, 0.03 + 0.05 * mac2 * d1.r, below);
      vec3 lipCol = (ttype == 4 ? cForest : mix(cGrass, cMeadow, 0.4)) * mix(1.0, d1.r * 2.0, 0.6);
      sideCol = mix(sideCol, lipCol, lip);
      sideCol *= 0.8 + 0.2 * smoothstep(0.0, 0.15, below);
    }
    sideRough = 0.88;
  }
  // tide line on everything that meets the sea
  sideCol *= 1.0 - 0.38 * (1.0 - smoothstep(0.0, 0.1 + 0.05 * mac, wp.y));
  float top = smoothstep(0.45, 0.75, fN.y);
  vec3 col = mix(sideCol, topCol, top);
  gRough = mix(sideRough, topRough, top);
  gAO = mix(0.85 + 0.15 * smoothstep(0.0, 0.25, below), sp2.g, top);

  // ---- clay model look for info views
  col = mix(col, cClay * (0.94 + 0.12 * mac) * mix(1.0, 0.86, 1.0 - top), uClay);

  // ---- zoning: inset lot borders, empty-lot tint + colour-blind pattern, eligible tiles; curb line
  vec3 emi = vec3(0.0);
  float glow = 0.08 + 0.5 * uNight;
  if (top > 0.5) {
    int zone = int(vT1.y + 0.5);
    float he = bgHexEdge(vLocal);
    if (zone > 0) {
      vec3 zc = uZoneCol[zone - 1];
      float band = smoothstep(0.12 - 0.5 * px, 0.12 + 0.5 * px, he) * (1.0 - smoothstep(0.18 - 0.5 * px, 0.18 + 0.5 * px, he));
      float a = band * 0.9 * uZoneView;
      if ((flags & 8) == 0) {
        vec2 q = w / 0.16;
        float h1 = abs(fract(q.x + q.y) - 0.5), h2 = abs(fract(q.x - q.y) - 0.5);
        float aa = px / 0.16 * 1.4;
        float s1 = 1.0 - smoothstep(0.15, 0.15 + aa, h1), s2 = 1.0 - smoothstep(0.15, 0.15 + aa, h2);
        float pat = zone == 1 ? 0.0 : (zone == 2 ? s1 : max(s1, s2));
        a = max(a, (0.22 + 0.4 * pat) * uZoneView * step(0.12, he));
      }
      int rm = int(vT1.w + 0.5);
      float ang = atan(vLocal.y, vLocal.x);
      int dd = int(mod(floor(-ang / 1.0471976 + 0.5), 6.0));
      if (((rm >> dd) & 1) != 0) {
        float cl = 1.0 - smoothstep(0.018, 0.018 + px, he);
        a = max(a, cl * uZoneCurb * (1.0 - uZoneView) * (1.0 - uClay));
      }
      col = mix(col, zc, a);
      emi += zc * a * glow;
    } else if ((flags & 16) != 0 && uZoneView > 0.001) {
      float g = 1.0 - smoothstep(0.02, 0.02 + 1.5 * px, he);
      col = mix(col, vec3(1.0), g * 0.25 * uZoneView);
    }
  }
  bgOverlays(w, vT0.x, vLocal, px, 1.0, col, emi);
  emi += col * texture(uNightLight, muv).rgb;
  gEmi = emi;
  gCloud = 1.0 - uCloudStrength * smoothstep(0.4, 0.72, texture(uDetail2, (w + uCloudOfs) * 0.019 + vec2(0.13, 0.29)).a);
  diffuseColor.rgb = col;
}
`;

export function terrainUniforms() {
  const pal = {};
  for (const k in PAL) pal['c' + k[0].toUpperCase() + k.slice(1)] = { value: PAL[k] };
  return {
    ...overlayUniforms(), ...pal,
    uDetail: GU.uDetail, uDetail2: GU.uDetail2, uDetail3: GU.uDetail3, uSplat: GU.uSplat, uSplat2: GU.uSplat2, uCoast: GU.uCoast,
    uNightLight: U.uNightLight, uCloudOfs: U.uCloudOfs, uCloudStrength: U.uCloudStrength,
    uZoneView: GU.uZoneView, uZoneCurb: GU.uZoneCurb, uZoneCol: GU.uZoneCol,
  };
}

// Cloud shadows: scale the one directional light by gCloud
export function patchCloudLight(fs) {
  const chunk = THREE.ShaderChunk.lights_fragment_begin.replace(
    'getDirectionalLightInfo( directionalLight, directLight );',
    'getDirectionalLightInfo( directionalLight, directLight );\n\t\tdirectLight.color *= gCloud;');
  return fs.replace('#include <lights_fragment_begin>', chunk);
}

function makeTerrainMaterial() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, flatShading: true });
  const uni = terrainUniforms();
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS_MAIN)
      .replace('#include <begin_vertex>', VERT_BEGIN);
    let fs = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('#include <map_fragment>', FRAG_MAIN)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = gRough;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gEmi;')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.indirectDiffuse *= gAO; reflectedLight.indirectSpecular *= gAO; reflectedLight.directDiffuse *= mix(1.0, gAO, 0.3);');
    sh.fragmentShader = patchCloudLight(fs);
  };
  mat.customProgramCacheKey = () => 'bastion-ground-terrain-v1';
  return mat;
}

function makeTerrainDepthMaterial() {
  const mat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <begin_vertex>', BEGIN);
  };
  mat.customProgramCacheKey = () => 'bastion-ground-terrain-depth-v1';
  return mat;
}

// ------------------------------------------------------------------------------------------------ state
export const TR = {
  mesh: null, slotOf: null, max: 0, aT0: null, aT1: null,
  splatTex: null, splat2Tex: null, coastTex: null,
};

export function createTerrain(scene) {
  const max = 4096;
  const geo = prismGeometry();
  const a0 = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
  const a1 = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
  a0.setUsage(THREE.DynamicDrawUsage); a1.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aT0', a0); geo.setAttribute('aT1', a1);
  const mesh = new THREE.InstancedMesh(geo, makeTerrainMaterial(), max);
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.customDepthMaterial = makeTerrainDepthMaterial();
  mesh.renderOrder = 0;
  mesh.name = 'ground-terrain';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  Object.assign(TR, { mesh, max, aT0: a0, aT1: a1 });
  return mesh;
}

// ---- per-tile classification (shared with roads.js)
export function tileFlags(i) {
  let f = 0;
  const z = W.zone[i];
  if (z) f |= TF.LOT;
  if (W.road[i]) f |= TF.ROAD;
  if (W.bld[i]) f |= TF.BLD;
  const fl = W.flags[i];
  if (z && W.lvl[i] > 0 && !(fl & LF.RUBBLE)) f |= TF.BUILT;
  if (fl & LF.RUBBLE || W.ruin[i]) f |= TF.RUBBLE;
  if (fl & LF.BUILDING) f |= TF.BUILDING;
  if (fl & LF.ABANDONED) f |= TF.ABANDONED;
  if (!z && !W.road[i] && !W.bld[i] && isLand(W.type[i]) && W.type[i] !== T.MOUNTAIN) {
    for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j]) { f |= TF.ELIGIBLE; break; } }
  }
  return f;
}
export function roadMask(i) {
  let m = 0;
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j]) m |= 1 << d; }
  return m;
}
// corner k touches neighbours (7 - k) % 6 and (6 - k) % 6
function cornerMask(i) {
  let m = 0;
  for (let k = 0; k < 6; k++) {
    const a = W.nbr[i * 6 + ((7 - k) % 6)], b = W.nbr[i * 6 + ((6 - k) % 6)];
    if (a < 0 || b < 0 || isWater(W.type[a]) || isWater(W.type[b])) m |= 1 << k;
  }
  return m;
}

function writeInstance(s, i) {
  const m = TR.mesh.instanceMatrix.array, o = s * 16;
  m.fill(0, o, o + 16);
  m[o] = 1; m[o + 5] = 1; m[o + 10] = 1; m[o + 15] = 1;
  m[o + 12] = W.x[i]; m[o + 13] = W.h[i]; m[o + 14] = W.z[i];
  const a0 = TR.aT0.array, a1 = TR.aT1.array, k = s * 4;
  a0[k] = i; a0[k + 1] = cornerMask(i); a0[k + 2] = W.type[i] === T.SAND ? SAND_PUSH : 0; a0[k + 3] = W.h[i];
  writeFlags(s, i);
}
function writeFlags(s, i) {
  const a1 = TR.aT1.array, k = s * 4;
  a1[k] = W.type[i]; a1[k + 1] = W.zone[i]; a1[k + 2] = tileFlags(i); a1[k + 3] = roadMask(i);
}

// ------------------------------------------------------------------------------------------------ splat
const SN = 512, CELL = MAP_SIZE / SN, BLUR = 2;
let tileW = null;   // per-tile class weights, 8 channels (0..1)
let rawA = null, rawB = null, finA = null, finB = null;
let warpNoise = null;
let pendingRects = [];

// channels: 0 sand 1 rock 2 dirt 3 urban | 4 forest 5 ao 6 yard 7 industrial
function classify(i, out, o) {
  for (let c = 0; c < 8; c++) out[o + c] = 0;
  out[o + 5] = 1;
  const t = W.type[i];
  if (!isLand(t)) { out[o] = 0.55; out[o + 1] = 0.45; return; }
  if (t === T.SAND) out[o] = 1;
  else if (t === T.FOREST) { out[o + 4] = 1; out[o + 2] = 0.12; out[o + 5] = 0.8; }
  else if (t === T.HILLS) { out[o + 1] = 0.3; out[o + 2] = 0.05; }
  else if (t === T.MOUNTAIN) out[o + 1] = 1;
  const f = tileFlags(i);
  let urb = 0, ind = 0, yard = 0, dirt = 0;
  if (f & TF.ROAD) urb = 0.55;
  if (f & TF.BLD) urb = Math.max(urb, 0.92);
  if (f & TF.LOT) {
    const z = W.zone[i];
    if (f & TF.BUILT) {
      if (z === 1) { urb = Math.max(urb, 0.4); yard = 1; }
      else if (z === 2) urb = 1;
      else { urb = 0.85; ind = 1; }
    }
    if (f & TF.BUILDING) { dirt = 0.55; urb = Math.max(urb * 0.5, 0.25); }
  }
  if (f & TF.RUBBLE) { dirt = 0.45; urb = Math.max(urb, 0.45); ind = 0.6; }
  if (urb > 0 || dirt > 0) {
    const keep = Math.max(0, 1 - urb - dirt);
    out[o] *= keep; out[o + 1] *= keep; out[o + 2] = out[o + 2] * keep + dirt; out[o + 3] = urb;
    out[o + 4] *= keep;
  }
  out[o + 6] = yard; out[o + 7] = ind;
}

function aoAt(i, lx, lz) {
  let ao = tileW[i * 8 + 5];
  if (!isLand(W.type[i])) return 1;
  const f = tileFlags(i);
  const r2 = lx * lx + lz * lz;
  if (f & TF.BUILT) { const k = 0.18 + 0.08 * W.lvl[i]; ao *= 1 - k * Math.exp(-r2 / 0.3); }
  else if (f & TF.BLD) ao *= 1 - 0.3 * Math.exp(-r2 / 0.35);
  const h = W.h[i];
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[i * 6 + d];
    if (j < 0 || !isLand(W.type[j])) continue;
    const dh = W.h[j] - h;
    if (dh < 0.08) continue;
    const dx = DIRX[d], dz = DIRZ[d];
    const e = 0.866 - (lx * dx + lz * dz);
    ao *= 1 - 0.42 * Math.min(1, dh / 0.4) * Math.exp(-Math.max(0, e) / 0.16);
  }
  return ao;
}
const DIRX = [1, 0.5, -0.5, -1, -0.5, 0.5], DIRZ = [0, -0.8660254, -0.8660254, 0, 0.8660254, 0.8660254];

const _ax = { q: 0, r: 0 };
function tileAtXZ(x, z) {
  worldToAxial(x, z, _ax);
  const R = W.R, q = _ax.q, r = _ax.r;
  if (q < -R || q > R || r < -R || r > R || q + r < -R || q + r > R) return -1;
  return W.lookup[(q + R) * (2 * R + 1) + (r + R)];
}

function rasterRect(x0, z0, x1, z1) {
  for (let tz = z0; tz <= z1; tz++) {
    const wz = MAP_MIN + (tz + 0.5) * CELL;
    for (let tx = x0; tx <= x1; tx++) {
      const wx = MAP_MIN + (tx + 0.5) * CELL;
      const n1 = warpNoise(wx * 0.33, wz * 0.33) * 0.32 + warpNoise(wx * 1.3 + 5.2, wz * 1.3 - 7.7) * 0.1;
      const n2 = warpNoise(wx * 0.33 + 17.3, wz * 0.33 - 9.1) * 0.32 + warpNoise(wx * 1.3 - 3.1, wz * 1.3 + 2.9) * 0.1;
      let i = tileAtXZ(wx + n1, wz + n2);
      const p = (tz * SN + tx) * 4;
      if (i < 0) { rawA[p] = 140; rawA[p + 1] = 115; rawA[p + 2] = 0; rawA[p + 3] = 0; rawB[p] = 0; rawB[p + 1] = 255; rawB[p + 2] = 0; rawB[p + 3] = 0; continue; }
      const o = i * 8;
      for (let c = 0; c < 4; c++) { rawA[p + c] = tileW[o + c] * 255; rawB[p + c] = tileW[o + 4 + c] * 255; }
      // AO from the unwarped tile so cliff bases and footprints stay put
      const i0 = tileAtXZ(wx, wz);
      rawB[p + 1] = i0 >= 0 ? aoAt(i0, wx - W.x[i0], wz - W.z[i0]) * 255 : 255;
    }
  }
}

// separable [1 2 1] blur applied BLUR times, from raw into fin over the rect (needs raw over rect +- BLUR)
let _ta = new Float32Array(0), _tb = new Float32Array(0);
function blurRect(raw, fin, x0, z0, x1, z1) {
  const bx0 = Math.max(0, x0 - BLUR), bz0 = Math.max(0, z0 - BLUR), bx1 = Math.min(SN - 1, x1 + BLUR), bz1 = Math.min(SN - 1, z1 + BLUR);
  const w = bx1 - bx0 + 1, h = bz1 - bz0 + 1;
  if (_ta.length < w * h * 4) { _ta = new Float32Array(w * h * 4); _tb = new Float32Array(w * h * 4); }
  const a = _ta, b = _tb;
  for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) for (let c = 0; c < 4; c++) a[(z * w + x) * 4 + c] = raw[((bz0 + z) * SN + bx0 + x) * 4 + c];
  for (let it = 0; it < BLUR; it++) {
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
      const xm = Math.max(0, x - 1), xp = Math.min(w - 1, x + 1);
      for (let c = 0; c < 4; c++) b[(z * w + x) * 4 + c] = (a[(z * w + xm) * 4 + c] + 2 * a[(z * w + x) * 4 + c] + a[(z * w + xp) * 4 + c]) * 0.25;
    }
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
      const zm = Math.max(0, z - 1), zp = Math.min(h - 1, z + 1);
      for (let c = 0; c < 4; c++) a[(z * w + x) * 4 + c] = (b[(zm * w + x) * 4 + c] + 2 * b[(z * w + x) * 4 + c] + b[(zp * w + x) * 4 + c]) * 0.25;
    }
  }
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) for (let c = 0; c < 4; c++) fin[(z * SN + x) * 4 + c] = a[((z - bz0) * w + (x - bx0)) * 4 + c] + 0.5;
}

function makeMapTex(data, n, format = THREE.RGBAFormat) {
  const t = new THREE.DataTexture(data, n, n, format);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

function rebuildSplat() {
  if (!rawA) {
    rawA = new Uint8Array(SN * SN * 4); rawB = new Uint8Array(SN * SN * 4);
    finA = new Uint8Array(SN * SN * 4); finB = new Uint8Array(SN * SN * 4);
    TR.splatTex = makeMapTex(finA, SN); TR.splat2Tex = makeMapTex(finB, SN);
    GU.uSplat.value = TR.splatTex; GU.uSplat2.value = TR.splat2Tex;
  }
  warpNoise = makeNoise(mulberry32((W.seed | 0) * 31 + 17));
  tileW = new Float32Array(W.count * 8);
  for (let i = 0; i < W.count; i++) classify(i, tileW, i * 8);
  rasterRect(0, 0, SN - 1, SN - 1);
  // full blur in strips to keep the temp small
  for (let z = 0; z < SN; z += 48) for (let x = 0; x < SN; x += 48) {
    const x1 = Math.min(SN - 1, x + 47), z1 = Math.min(SN - 1, z + 47);
    blurRect(rawA, finA, x, z, x1, z1); blurRect(rawB, finB, x, z, x1, z1);
  }
  TR.splatTex.needsUpdate = true; TR.splat2Tex.needsUpdate = true;
  pendingRects.length = 0;
}

// tile changed (lot, road, building): re-raster its neighbourhood
function splatTile(i) {
  const o = i * 8;
  classify(i, tileW, o);
  const r = 1.0 + 0.45; // hex radius + warp amplitude
  const x0 = Math.max(0, Math.floor((W.x[i] - r - MAP_MIN) / CELL) - 1), x1 = Math.min(SN - 1, Math.ceil((W.x[i] + r - MAP_MIN) / CELL) + 1);
  const z0 = Math.max(0, Math.floor((W.z[i] - r - MAP_MIN) / CELL) - 1), z1 = Math.min(SN - 1, Math.ceil((W.z[i] + r - MAP_MIN) / CELL) + 1);
  pendingRects.push([x0, z0, x1, z1]);
}

// ------------------------------------------------------------------------------------------------ coast field
const CN = 512, CCELL = MAP_SIZE / CN, MAXD = 10;
let coastData = null;
function hexD(dx, dz) { const ax = Math.abs(dx), az = Math.abs(dz); return Math.max(ax, ax * 0.5 + az * 0.8660254) - 0.8660254; }

function rebuildCoast() {
  if (!coastData) {
    coastData = new Uint8Array(CN * CN * 2);
    TR.coastTex = makeMapTex(coastData, CN, THREE.RGFormat);
    GU.uCoast.value = TR.coastTex;
  }
  const water = new Float32Array(CN * CN).fill(MAXD);   // distance to the waterline (beach banks reach out)
  const seaD = new Float32Array(CN * CN).fill(3);       // distance from land hexes (into the sea)
  const landD = new Float32Array(CN * CN).fill(3);      // distance from water hexes (into the land)
  const region = (cx, cz, rad, fn) => {
    const x0 = Math.max(0, Math.floor((cx - rad - MAP_MIN) / CCELL)), x1 = Math.min(CN - 1, Math.ceil((cx + rad - MAP_MIN) / CCELL));
    const z0 = Math.max(0, Math.floor((cz - rad - MAP_MIN) / CCELL)), z1 = Math.min(CN - 1, Math.ceil((cz + rad - MAP_MIN) / CCELL));
    for (let tz = z0; tz <= z1; tz++) {
      const dz = MAP_MIN + (tz + 0.5) * CCELL - cz;
      for (let tx = x0; tx <= x1; tx++) fn(tz * CN + tx, MAP_MIN + (tx + 0.5) * CCELL - cx, dz);
    }
  };
  for (const i of W.coast) {
    const k = W.type[i] === T.SAND ? 1 + SAND_PUSH * 0.72 : 1;
    region(W.x[i], W.z[i], MAXD + 1.5, (p, dx, dz) => {
      const d = Math.max(0, hexD(dx / k, dz / k) * k);
      if (d < water[p]) water[p] = d;
      const s = Math.max(0, hexD(dx, dz));
      if (s < seaD[p]) seaD[p] = s;
    });
  }
  for (const i of W.shore) {
    region(W.x[i], W.z[i], 3.5, (p, dx, dz) => {
      const d = Math.max(0, hexD(dx, dz));
      if (d < landD[p]) landD[p] = d;
    });
  }
  for (let p = 0; p < CN * CN; p++) {
    coastData[p * 2] = Math.round(Math.min(1, water[p] / MAXD) * 255);
    const s = seaD[p] - landD[p];
    coastData[p * 2 + 1] = Math.round(Math.min(1, Math.max(0, 0.5 + s / 4)) * 255);
  }
  TR.coastTex.needsUpdate = true;
}
export const COAST_MAXD = MAXD;

// ------------------------------------------------------------------------------------------------ public
// World created or terrain types / heights changed: rebuild instances and every map-space field
export function terrainRebuild() {
  if (W.count > TR.max) {
    // grow (only if a bigger map than R = 36 is ever generated)
    const scene = TR.mesh.parent;
    scene.remove(TR.mesh);
    TR.mesh.geometry.dispose();
    createTerrain(scene);
  }
  GU.uHexR.value = W.R;
  TR.slotOf = new Int32Array(W.count).fill(-1);
  let n = 0;
  for (const i of W.land) { TR.slotOf[i] = n; writeInstance(n, i); n++; }
  const m = TR.mesh;
  m.count = n;
  m.instanceMatrix.clearUpdateRanges(); m.instanceMatrix.needsUpdate = true;
  for (const a of [TR.aT0, TR.aT1]) { a.clearUpdateRanges(); a.needsUpdate = true; }
  rebuildSplat();
  rebuildCoast();
}

// Per-tile visuals changed (lot, road, building, rubble). Patches instance flags and queues splat texels.
export function terrainTilesChanged(tiles) {
  if (!TR.slotOf) return;
  const a1 = TR.aT1;
  let touched = false;
  for (const i of tiles) {
    const s = TR.slotOf[i];
    if (s >= 0) { writeFlags(s, i); a1.addUpdateRange(s * 4, 4); touched = true; }
    if (isLand(W.type[i])) splatTile(i);
  }
  if (touched) a1.needsUpdate = true;
}

// Upload queued splat rectangles (partial texture uploads via copyTextureToTexture; called once per frame)
const _box = new THREE.Box2(), _pos = new THREE.Vector2();
export function terrainFrame(renderer) {
  if (!pendingRects.length || !renderer) return 0;
  let bx0 = SN, bz0 = SN, bx1 = -1, bz1 = -1, area = 0;
  for (const r of pendingRects) {
    bx0 = Math.min(bx0, r[0]); bz0 = Math.min(bz0, r[1]); bx1 = Math.max(bx1, r[2]); bz1 = Math.max(bz1, r[3]);
    area += (r[2] - r[0] + 1) * (r[3] - r[1] + 1);
  }
  const boxArea = (bx1 - bx0 + 1) * (bz1 - bz0 + 1);
  let rects;
  if (boxArea <= area * 2 || boxArea <= 48 * 48) { rects = [[bx0, bz0, bx1, bz1]]; pendingRects.length = 0; }
  else rects = pendingRects.splice(0, 32); // scattered changes: at most 32 small rects per frame
  let bytes = 0;
  for (const [x0, z0, x1, z1] of rects) {
    const rx0 = Math.max(0, x0 - BLUR), rz0 = Math.max(0, z0 - BLUR), rx1 = Math.min(SN - 1, x1 + BLUR), rz1 = Math.min(SN - 1, z1 + BLUR);
    rasterRect(rx0, rz0, rx1, rz1);
    blurRect(rawA, finA, x0, z0, x1, z1); blurRect(rawB, finB, x0, z0, x1, z1);
    _box.min.set(x0, z0); _box.max.set(x1 + 1, z1 + 1); _pos.set(x0, z0);
    renderer.copyTextureToTexture(TR.splatTex, TR.splatTex, _box, _pos);
    renderer.copyTextureToTexture(TR.splat2Tex, TR.splat2Tex, _box, _pos);
    bytes += (x1 - x0 + 1) * (z1 - z0 + 1) * 8;
  }
  return bytes;
}
