import * as THREE from 'three';

// Physically based sea: MeshStandardMaterial (so it gets sky reflections, sun glints, shadows and fog for free)
// extended with two scrolling normal-map layers, depth colour from a coast-distance field and animated foam.
export function makeWaterMaterial({ normalMap, mapMin, mapSize, maxDist }) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.06, metalness: 0.0, envMapIntensity: 1.0 });
  const uniforms = {
    uTime: { value: 0 },
    uNormal: { value: normalMap },
    uDist: { value: null },
    uMapMin: { value: new THREE.Vector2(mapMin, mapMin) },
    uMapSize: { value: mapSize },
    uMaxDist: { value: maxDist },
    uShallow: { value: new THREE.Color(0x38c9c4) },
    uDeep: { value: new THREE.Color(0x0d4f80) },
    uSand: { value: new THREE.Color(0xcdbf92) },
    uCaustics: { value: new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1) },
    uFoam: { value: new THREE.Color(0xf2f8f8) },
    uNight: { value: 0 },
  };
  uniforms.uCaustics.value.needsUpdate = true;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', /* glsl */`#include <common>
varying vec3 vWPos;
uniform float uTime, uMapSize, uMaxDist, uNight;
uniform sampler2D uNormal, uDist, uCaustics;
uniform vec3 uSand;
uniform vec2 uMapMin;
uniform vec3 uShallow, uDeep, uFoam;
float gFoam;`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
{
  vec2 duv = (vWPos.xz - uMapMin) / uMapSize;
  float wd = texture2D(uDist, duv).r * uMaxDist;
  float t = uTime;
  // clear shallows: sandy seabed fading to turquoise, then deep blue, with caustics dancing near the beach
  vec3 wcol = mix(uSand, uShallow, smoothstep(0.0, 0.9, wd));
  wcol = mix(wcol, uDeep, smoothstep(1.2, 7.0, wd));
  float ca = texture2D(uCaustics, vWPos.xz * 0.33 + vec2(t * 0.025, t * 0.012)).r * texture2D(uCaustics, vWPos.xz * 0.27 - vec2(t * 0.018, -t * 0.02)).r;
  wcol += vec3(0.55, 0.75, 0.7) * ca * 1.6 * (1.0 - smoothstep(0.4, 3.2, wd)) * (1.0 - uNight);
  float wave = 0.5 + 0.5 * sin(wd * 6.0 - t * 2.1 + sin(vWPos.x * 0.6 + t) * 0.9);
  float foam = (1.0 - smoothstep(0.0, 0.42, wd)) * 0.95
             + (1.0 - smoothstep(0.25, 1.5, wd)) * smoothstep(0.62, 0.96, wave) * 0.6;
  float brk = texture2D(uNormal, vWPos.xz * 0.33 + vec2(t * 0.03, -t * 0.02)).r;
  foam = clamp(foam * (0.45 + 0.9 * brk), 0.0, 1.0);
  gFoam = foam;
  diffuseColor.rgb = mix(wcol, uFoam * (1.0 - 0.75 * uNight), foam);
}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.55, gFoam);')
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
{
  vec2 p = vWPos.xz;
  float t = uTime;
  vec3 n1 = texture2D(uNormal, p * 0.042 + vec2(t * 0.011, t * 0.007)).rgb * 2.0 - 1.0;
  vec3 n2 = texture2D(uNormal, p * 0.105 + vec2(-t * 0.019, t * 0.013)).rgb * 2.0 - 1.0;
  vec2 d = (n1.xy + n2.xy) * mix(0.32, 0.12, gFoam);
  vec3 wn = normalize(vec3(d.x, 1.0, d.y));
  normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
}`);
  };
  mat.customProgramCacheKey = () => 'bastion-water-v1';
  mat.userData.uniforms = uniforms;
  return mat;
}
