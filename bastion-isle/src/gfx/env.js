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

export function makeSky() {
  const sky = new Sky();
  sky.scale.setScalar(1800);
  const u = sky.material.uniforms;
  u.turbidity.value = 6;
  u.rayleigh.value = 1.4;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.86;
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  return sky;
}
