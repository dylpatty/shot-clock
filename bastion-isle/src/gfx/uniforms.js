import * as THREE from 'three';

// Shared uniforms: every patched material references these objects, so a value changes once per frame for all.
// See SPEC.md section 4. Map-space textures cover [MAP_MIN, MAP_MIN + MAP_SIZE] in world x and z.
export const MAP_MIN = -70;
export const MAP_SIZE = 140;

const tex1 = (r, g, b, a) => { const t = new THREE.DataTexture(new Uint8Array([r, g, b, a]), 1, 1); t.needsUpdate = true; return t; };

export const U = {
  uTime: { value: 0 },            // seconds (real time, for cosmetic animation)
  uGameTime: { value: 0 },        // game seconds (pauses with the game)
  uNight: { value: 0 },           // 0 day .. 1 night: windows, lamps, headlights
  uDayLight: { value: 1 },        // sun strength 0..1
  uWind: { value: new THREE.Vector2(0.8, 0.3) },
  uCloudOfs: { value: new THREE.Vector2(0, 0) },
  uCloudStrength: { value: 0.22 },
  uMapMin: { value: new THREE.Vector2(MAP_MIN, MAP_MIN) },
  uMapSize: { value: MAP_SIZE },

  // night light map (map-space, HalfFloat RGBA): additive light from lamps, windows, fires, headlights
  uNightLight: { value: tex1(0, 0, 0, 255) },

  // info views
  uOverlayTex: { value: tex1(0, 0, 0, 0) }, // per-tile RGBA, sampled by tile index
  uOverlayW: { value: 1 },                  // overlay texture width in texels (tiles per row)
  uOverlayMix: { value: 0 },                // 0 off .. 1 full
  uFieldTex: { value: tex1(0, 0, 0, 0) },   // map-space smooth field (land value, pollution...) RGBA
  uFieldMix: { value: 0 },
  uClay: { value: 0 },                      // 0 colour .. 1 clay model look while an info view is on

  // range rings (x, z, radius, style) and colours; style 0 solid, 1 dashed (placement), 2 coverage edge
  uRings: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) },
  uRingCol: { value: Array.from({ length: 8 }, () => new THREE.Color(1, 1, 1)) },
  uRingCount: { value: 0 },
  uCoverTex: { value: tex1(0, 0, 0, 0) },   // defence coverage RGB: R sea, G air, B ground (0..255 = towers)
  uCoverMix: { value: 0 },
  uGrid: { value: 0 },                      // hex grid lines strength (tools active)
  uHighlightTile: { value: -1 },
};

export function ringSet(list) {
  const n = Math.min(8, list.length);
  for (let k = 0; k < n; k++) {
    const r = list[k];
    U.uRings.value[k].set(r.x, r.z, r.r, r.style || 0);
    U.uRingCol.value[k].set(r.color != null ? r.color : 0xffffff);
  }
  U.uRingCount.value = n;
}
