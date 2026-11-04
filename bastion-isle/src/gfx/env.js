import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Decode an .hdr file that esbuild embedded as bytes (so the game still runs from file://)
export function hdrTexture(bytes) {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const loader = new RGBELoader();
  loader.setDataType(THREE.HalfFloatType);
  const d = loader.parse(buf);
  const t = new THREE.DataTexture(d.data, d.width, d.height, THREE.RGBAFormat, d.type);
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.flipY = true;
  t.needsUpdate = true;
  return t;
}

export function envFromHDR(renderer, bytes) {
  const pm = new THREE.PMREMGenerator(renderer);
  const eq = hdrTexture(bytes);
  const env = pm.fromEquirectangular(eq).texture;
  eq.dispose();
  pm.dispose();
  return env;
}

// Decode an embedded jpg/png into a texture (async, via ImageBitmap)
export async function imageTexture(bytes, { srgb = true, repeat = true, mime = 'image/jpeg' } = {}) {
  const bmp = await createImageBitmap(new Blob([bytes], { type: mime }), { imageOrientation: 'flipY' });
  const t = new THREE.Texture(bmp);
  t.flipY = false;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

// Cheap gradient sky drawn last among opaques (only background pixels are shaded): horizon = fog colour,
// zenith from the time-of-day mood, an HDR sun disc for bloom, stars and a moon at night.
export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color(0x5b8fc7) }, uHorizon: { value: new THREE.Color(0xbcd8ea) },
      uSunCol: { value: new THREE.Color(0xfff3e0) }, uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uMoonDir: { value: new THREE.Vector3(-0.3, 0.6, -0.7).normalize() }, uNight: { value: 0 }, uSunVis: { value: 1 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww; // on the far plane
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZenith, uHorizon, uSunCol, uSunDir, uMoonDir;
      uniform float uNight, uSunVis;
      varying vec3 vDir;
      float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uZenith, pow(h, 0.5));
        float sd = max(dot(d, uSunDir), 0.0);
        col += uSunCol * (pow(sd, 6.0) * 0.28 + pow(sd, 48.0) * 0.5) * uSunVis;
        col += uSunCol * smoothstep(0.99955, 0.9998, sd) * 22.0 * uSunVis;
        if (uNight > 0.01) {
          float s = hash(floor(d * 380.0));
          col += vec3(0.85, 0.9, 1.0) * step(0.9982, s) * uNight * 1.8 * smoothstep(0.02, 0.25, d.y);
          float md = dot(d, uMoonDir);
          col += vec3(0.85, 0.9, 1.0) * (smoothstep(0.99935, 0.9996, md) * 4.0 + pow(max(md, 0.0), 60.0) * 0.15) * uNight;
        }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat);
  sky.frustumCulled = false;
  sky.renderOrder = 6;
  sky.onBeforeRender = (renderer, scene, camera) => {
    sky.position.copy(camera.position);
    sky.scale.setScalar(camera.far * 0.8);
    sky.updateMatrixWorld();
  };
  const u = mat.uniforms;
  sky.userData.update = (L) => {
    u.uZenith.value.copy(L.mood.zenith);
    u.uHorizon.value.copy(L.mood.fog);
    u.uSunDir.value.copy(L.sunDir);
    u.uSunCol.value.copy(L.mood.sun).multiplyScalar(Math.max(0, Math.min(1, (L.elevation + 3) / 8)));
    u.uSunVis.value = L.elevation > -3 ? 1 : 0;
    u.uNight.value = L.night;
  };
  return sky;
}
