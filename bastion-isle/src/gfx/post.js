import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect, SMAAPreset, EdgeDetectionMode,
  ToneMappingEffect, ToneMappingMode, VignetteEffect, BrightnessContrastEffect, HueSaturationEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

// Quality presets. "High" is the default and is sized for 180 fps at 3440x1440 on a modern gaming GPU.
export const PRESETS = {
  ultra: { label: 'Ultra', ao: true, aoQuality: 'Medium', aoHalf: false, bloom: true, bloomLevels: 8, smaa: SMAAPreset.ULTRA, shadow: 4096, shadowType: 'soft' },
  high: { label: 'High', ao: true, aoQuality: 'Low', aoHalf: true, bloom: true, bloomLevels: 6, smaa: SMAAPreset.HIGH, shadow: 2048, shadowType: 'soft' },
  performance: { label: 'Performance', ao: false, aoQuality: 'Performance', aoHalf: true, bloom: true, bloomLevels: 4, smaa: SMAAPreset.MEDIUM, shadow: 2048, shadowType: 'pcf' },
};

export class Pipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = null;
    this.preset = null;
    this.ao = null;
    this.bloom = null;
    this.width = 1;
    this.height = 1;
    this.exposure = 1;
  }

  build(name) {
    const p = PRESETS[name] || PRESETS.high;
    this.preset = p;
    if (this.composer) this.composer.dispose();
    const r = this.renderer;
    r.toneMapping = THREE.NoToneMapping; // tone mapping happens in the effect pass
    const composer = new EffectComposer(r, { frameBufferType: THREE.HalfFloatType, multisampling: 0, stencilBuffer: false });
    composer.addPass(new RenderPass(this.scene, this.camera));
    this.ao = null;
    if (p.ao) {
      const ao = new N8AOPostPass(this.scene, this.camera, this.width, this.height);
      const c = ao.configuration;
      c.aoRadius = 1.6;
      c.distanceFalloff = 1.0;
      c.intensity = 2.2;
      c.color = new THREE.Color(0x0b0f14);
      c.halfRes = p.aoHalf;
      c.depthAwareUpsampling = true;
      c.transparencyAware = false; // never re-render particles/overlays for AO
      c.gammaCorrection = false;
      ao.setQualityMode(p.aoQuality);
      composer.addPass(ao);
      this.ao = ao;
    }
    const fx = [];
    if (p.bloom) {
      this.bloom = new BloomEffect({ mipmapBlur: true, levels: p.bloomLevels, luminanceThreshold: 0.92, luminanceSmoothing: 0.25, intensity: 0.85, radius: 0.72 });
      fx.push(this.bloom);
    } else this.bloom = null;
    this.grade = new HueSaturationEffect({ saturation: 0.3 });
    this.contrast = new BrightnessContrastEffect({ brightness: 0.02, contrast: 0.1 });
    fx.push(new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }), this.contrast, this.grade, new VignetteEffect({ offset: 0.32, darkness: 0.38 }));
    composer.addPass(new EffectPass(this.camera, ...fx));
    // anti-aliasing on the final tone-mapped image
    const smaa = new SMAAEffect({ preset: p.smaa, edgeDetectionMode: EdgeDetectionMode.COLOR });
    composer.addPass(new EffectPass(this.camera, smaa));
    this.composer = composer;
    composer.setSize(this.width, this.height, false);
  }

  setSize(w, h) {
    this.width = w; this.height = h;
    if (this.composer) this.composer.setSize(w, h, false);
  }

  render(dt) {
    this.composer.render(dt);
  }
}
