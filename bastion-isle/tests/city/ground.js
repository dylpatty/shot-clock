// Test-only placeholder ground for GFX-CITY screenshots: flat hex prisms in the UX palette plus simple street
// ribbons (asphalt, centre dashes) so lot orientation can be judged. The real ground lives in gfx/terrain.js.
import * as THREE from 'three';
import { W, T, isLand } from '../../src/world.js';
import { DIR_X, DIR_Z } from '../../src/hex.js';

const COL = { [T.SAND]: 0xD6C69C, [T.GRASS]: 0x6E8C4C, [T.FOREST]: 0x4E6A3A, [T.HILLS]: 0x7E8A55, [T.MOUNTAIN]: 0x6F6B64 };

export function cityTestGround(scene) {
  const land = W.land;
  const geo = new THREE.CylinderGeometry(1.0, 1.0, 6, 6, 1).translate(0, -3, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGW = (instanceMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vGW;
float gh(vec2 p){ return fract(sin(dot(floor(p), vec2(127.1,311.7)))*43758.5453); }
float gn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(gh(i),gh(i+vec2(1,0)),f.x), mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb *= 0.8 + 0.25 * gn(vGW.xz * 3.0) + 0.12 * gn(vGW.xz * 17.0);
if (vGW.y < -0.05) diffuseColor.rgb *= 0.7;`);
  };
  mat.customProgramCacheKey = () => 'city-test-ground';
  const m = new THREE.InstancedMesh(geo, mat, land.length);
  const mx = new THREE.Matrix4(), col = new THREE.Color();
  land.forEach((i, k) => {
    m.setMatrixAt(k, mx.makeTranslation(W.x[i], W.h[i], W.z[i]));
    let c = COL[W.type[i]] || 0x6E8C4C;
    if (W.road[i]) c = 0xA8A59D;
    else if (W.zone[i] && W.lvl[i] && W.zone[i] !== 1) c = 0x9E9A92;
    col.setHex(c);
    m.setColorAt(k, col);
  });
  m.receiveShadow = true; m.castShadow = true;
  scene.add(m);
  // streets: asphalt spokes towards road neighbours + junction pads + centre dashes
  const segs = [];
  for (let i = 0; i < W.count; i++) {
    if (!W.road[i]) continue;
    let deg = 0;
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[i * 6 + d];
      if (j < 0 || !W.road[j]) continue;
      deg++;
      const len = 0.87, x = W.x[i] + DIR_X[d] * len / 2, z = W.z[i] + DIR_Z[d] * len / 2;
      segs.push([x, W.h[i] + 0.012, z, Math.atan2(DIR_X[d], DIR_Z[d]), 0.52, len, 0x3A3D41]);
      for (let k = 0; k < 2; k++) {
        const t = 0.22 + k * 0.4;
        segs.push([W.x[i] + DIR_X[d] * t, W.h[i] + 0.016, W.z[i] + DIR_Z[d] * t, Math.atan2(DIR_X[d], DIR_Z[d]), 0.018, 0.16, 0xE6E2D6]);
      }
    }
    segs.push([W.x[i], W.h[i] + 0.011, W.z[i], 0, 0.6, 0.6, 0x3A3D41, true]);
  }
  const bg = new THREE.BoxGeometry(1, 0.01, 1).translate(0, -0.005, 0);
  const cg = new THREE.CylinderGeometry(0.5, 0.5, 0.01, 12).translate(0, -0.005, 0);
  const rm = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const boxes = segs.filter((s) => !s[7]), discs = segs.filter((s) => s[7]);
  for (const [list, g] of [[boxes, bg], [discs, cg]]) {
    const im = new THREE.InstancedMesh(g, rm, list.length);
    list.forEach((s, k) => {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s[3]);
      mx.compose(new THREE.Vector3(s[0], s[1], s[2]), q, new THREE.Vector3(s[4], 1, s[5]));
      im.setMatrixAt(k, mx); col.setHex(s[6]); im.setColorAt(k, col);
    });
    im.receiveShadow = true;
    scene.add(im);
  }
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1E6378, roughness: 0.12 }));
  sea.position.y = -0.03; sea.renderOrder = 5;
  scene.add(sea);
}
