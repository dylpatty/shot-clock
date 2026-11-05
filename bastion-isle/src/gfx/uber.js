import * as THREE from 'three';
import { U } from './uniforms.js';

// ONE "uber" MeshStandardMaterial program for every procedural or imported model (military, civic, units, vehicles,
// boats, projectiles, rubble). Rendering review should_change 5, SPEC.md 5.6.
//
// Geometry contract (models.js and assets.js produce it; anything else drawn with this material must too):
//   position  Float32 x3
//   normal    Float32 x3
//   color     Float32 x3   linear albedo (palette hex converted with THREE.Color)
//   aPBR      Uint8 x4 normalized = (roughness, metalness, emissive code E, paint mask)
// Every mesh that uses the material is an InstancedMesh WITH an instanceColor attribute (Pool does this by default), so
// the whole game shares one program variant (+ three's own instanced depth variant for the shadow pass).
//
// instanceColor only tints vertices in proportion to their paint mask (car bodies, boat hulls, tracer cores):
//   albedo = color * mix(1, instanceColor, paint). Tyres, glass, lights and markings never change colour.
//
// Emissive code E (aPBR.z * 255). Emission colour is the vertex colour (after paint) unless noted. U.uNight = n.
//   0          none
//   1..63      NIGHT   I = E/63*8, on with smoothstep(0.12,0.45,n)        headlights, tail lights, lamp heads
//   64..127    WINDOW  warm window colour; s=E-64 hashes a per-window switch-on threshold, intensity and tint
//   128..159   ALWAYS  I = (E-128)/31*12, day and night                   tracers, shell cores, rocket exhaust
//   160..191   NAV     I = (E-160)/31*8 * mix(0.07,1,n)  (stays under the bloom threshold by day)   nav / signal lights
//   192..255   BLINK   s=E-192, mode=s/16, sub=(s%16)/16 phase offset; phase also hashed per instance position
//                mode 0 STROBE  white double-flash 1 Hz      aircraft strobes, masthead strobes
//                mode 1 BEACON  slow 0.5 Hz red blink        anti-collision beacons, chimney and mast warning lights
//                mode 2 FLASH   3 Hz square wave             fire truck / police flashers (sub 0 vs 8 alternate)
//                mode 3 PULSE   smooth 0.8 Hz breathing      radar ready lamps
export const EMI = {
  NONE: 0,
  night: (i) => Math.max(1, Math.min(63, Math.round((i / 8) * 63))),            // i = linear intensity 0..8
  window: (s) => 64 + (((s % 64) + 64) % 64),                                   // s = any integer (hash seed)
  always: (i) => 128 + Math.max(1, Math.min(31, Math.round((i / 12) * 31))),    // i = 0..12
  nav: (i) => 160 + Math.max(1, Math.min(31, Math.round((i / 8) * 31))),        // i = 0..8
  strobe: (sub = 0) => 192 + (sub & 15),
  beacon: (sub = 0) => 208 + (sub & 15),
  flash: (sub = 0) => 224 + (sub & 15),
  pulse: (sub = 0) => 240 + (sub & 15),
};

const VERT_PARS = /* glsl */`
attribute vec4 aPBR;
varying vec2 vPBR;
varying vec3 vEmis;
varying vec3 vWorldP;
uniform float uTime;
uniform float uNight;
`;

// replaces <color_vertex>: paint-masked instance tint, then emissive from the code in aPBR.z
const VERT_COLOR = /* glsl */`
#if defined( USE_COLOR )
  vColor = color;
  #ifdef USE_INSTANCING_COLOR
    vColor *= mix( vec3( 1.0 ), instanceColor.rgb, aPBR.w );
  #endif
  vec3 uberBase = vColor;
#else
  vec3 uberBase = vec3( 1.0 );
#endif
vPBR = aPBR.xy;
{
  float E = floor( aPBR.z * 255.0 + 0.5 );
  vec3 em = vec3( 0.0 );
  if ( E > 0.5 ) {
    float n = uNight;
    float ph = 0.0;
    #ifdef USE_INSTANCING
      ph = fract( sin( dot( instanceMatrix[ 3 ].xz, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
    #endif
    if ( E < 63.5 ) {
      em = uberBase * ( E / 63.0 * 8.0 ) * smoothstep( 0.12, 0.45, n );
    } else if ( E < 127.5 ) {
      float s = E - 64.0;
      float thr = 0.1 + 0.55 * fract( s * 0.618034 );
      float I = 1.4 + 1.8 * fract( s * 0.381966 );
      vec3 wc = mix( vec3( 1.0, 0.54, 0.2 ), vec3( 1.0, 0.87, 0.63 ), fract( s * 0.7548 ) );
      em = wc * I * smoothstep( thr, thr + 0.12, n );
    } else if ( E < 159.5 ) {
      em = uberBase * ( ( E - 128.0 ) / 31.0 * 12.0 );
    } else if ( E < 191.5 ) {
      em = uberBase * ( ( E - 160.0 ) / 31.0 * 8.0 ) * mix( 0.07, 1.0, n );
    } else {
      float s = E - 192.0;
      float mode = floor( s / 16.0 );
      float sub = ( s - mode * 16.0 ) / 16.0;
      float t = uTime;
      if ( mode < 0.5 ) {
        float x = fract( t + ph + sub );
        float on = step( x, 0.05 ) + step( 0.16, x ) * step( x, 0.2 );
        em = uberBase * on * mix( 7.0, 14.0, n );
      } else if ( mode < 1.5 ) {
        float x = fract( t * 0.5 + ph + sub );
        em = uberBase * smoothstep( 0.0, 0.05, x ) * ( 1.0 - smoothstep( 0.3, 0.38, x ) ) * mix( 1.5, 7.0, n );
      } else if ( mode < 2.5 ) {
        float x = fract( t * 3.0 + ph + sub );
        em = uberBase * step( 0.5, x ) * mix( 5.0, 10.0, n );
      } else {
        em = uberBase * ( 0.5 + 0.5 * sin( 6.2832 * ( t * 0.8 + ph + sub ) ) ) * mix( 0.6, 4.0, n );
      }
    }
  }
  vEmis = em;
}
`;

const VERT_WORLD = /* glsl */`
{
  vec4 uwp = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    uwp = instanceMatrix * uwp;
  #endif
  vWorldP = ( modelMatrix * uwp ).xyz;
}
`;

const FRAG_PARS = /* glsl */`
varying vec2 vPBR;
varying vec3 vEmis;
varying vec3 vWorldP;
uniform float uClay;
uniform float uClayAmt;
uniform sampler2D uNightLight;
uniform vec2 uMapMin;
uniform float uMapSize;
`;

const FRAG_CLAY = /* glsl */`
diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.686, 0.658, 0.604 ), uClay * uClayAmt );
`;

// night light map (map-space radiance from lamps, windows, fires; GFX-LIFE) lights the lower parts of models
const FRAG_EMIS = /* glsl */`
totalEmissiveRadiance = vEmis;
{
  vec2 luv = ( vWorldP.xz - uMapMin ) / uMapSize;
  float fall = clamp( 1.6 - vWorldP.y * 0.45, 0.0, 1.0 );
  totalEmissiveRadiance += diffuseColor.rgb * texture2D( uNightLight, luv ).rgb * fall;
}
`;

const CACHE_KEY = 'bastion-uber-v1';

function patchUber(mat, clayAmt) {
  mat.userData.clayAmt = { value: clayAmt };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = U.uTime;
    shader.uniforms.uNight = U.uNight;
    shader.uniforms.uClay = U.uClay;
    shader.uniforms.uClayAmt = mat.userData.clayAmt;
    shader.uniforms.uNightLight = U.uNightLight;
    shader.uniforms.uMapMin = U.uMapMin;
    shader.uniforms.uMapSize = U.uMapSize;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <color_vertex>', VERT_COLOR)
      .replace('#include <fog_vertex>', '#include <fog_vertex>\n' + VERT_WORLD);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + FRAG_CLAY)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * vPBR.x;')
      .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = metalness * vPBR.y;')
      .replace('#include <emissivemap_fragment>', FRAG_EMIS);
  };
  // identical key for both uber materials: they share one compiled program, uniforms stay per material
  mat.customProgramCacheKey = () => CACHE_KEY;
  return mat;
}

function makeUber(name, clayAmt) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 1, color: 0xffffff });
  m.name = name;
  return patchUber(m, clayAmt);
}

// Structures (civic, utilities, military bases and heads, rubble): follow the info-view clay mode.
export const uberMaterial = makeUber('uber', 1);
// Units, vehicles, boats, projectiles: keep their colours in clay mode so they stay readable over the data.
export const uberUnitMaterial = makeUber('uber-units', 0);

// ------------------------------------------------------------------ placement ghost

// Holographic placement ghost: transparent, fresnel rim, depth-tested but not depth-writing. Draw it as an
// InstancedMesh (count 1; pools.js Pool with { cast:false, receive:false, colors:false }) so it is one program.
// setGhostState(valid) switches signal cyan / hostile red. Program key 'bastion-ghost-v1'.
export const ghostMaterial = new THREE.ShaderMaterial({
  name: 'ghost',
  uniforms: {
    uColor: { value: new THREE.Color(0x3cc8d0) },
    uTime: U.uTime,
    uAlpha: { value: 1 },
  },
  vertexShader: /* glsl */`
    varying vec3 vN;
    varying vec3 vV;
    varying float vY;
    void main() {
      vec4 p = vec4( position, 1.0 );
      vec3 n = normal;
      #ifdef USE_INSTANCING
        p = instanceMatrix * p;
        n = mat3( instanceMatrix ) * n;
      #endif
      vY = position.y;
      vec4 mv = modelViewMatrix * p;
      vV = -mv.xyz;
      vN = normalize( normalMatrix * n );
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uAlpha;
    varying vec3 vN;
    varying vec3 vV;
    varying float vY;
    void main() {
      vec3 n = normalize( vN );
      vec3 v = normalize( vV );
      float f = pow( 1.0 - abs( dot( n, v ) ), 2.0 );
      float shade = 0.55 + 0.45 * clamp( n.y * 0.7 + 0.5, 0.0, 1.0 );
      float scan = 0.85 + 0.15 * step( 0.5, fract( vY * 14.0 - uTime * 1.5 ) );
      vec3 col = uColor * ( shade * 0.9 + f * 1.6 ) * scan;
      gl_FragColor = vec4( col, ( 0.32 + 0.55 * f ) * uAlpha );
      #include <colorspace_fragment>
    }`,
  transparent: true,
  depthWrite: false,
  depthTest: true,
  fog: false,
});
ghostMaterial.customProgramCacheKey = () => 'bastion-ghost-v1';

const GHOST_OK = new THREE.Color(0x3cc8d0), GHOST_BAD = new THREE.Color(0xff4d3d);
export function setGhostState(valid) {
  ghostMaterial.uniforms.uColor.value.copy(valid ? GHOST_OK : GHOST_BAD);
}
