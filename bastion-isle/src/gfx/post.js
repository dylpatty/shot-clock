import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect, SMAAPreset, EdgeDetectionMode, FXAAEffect,
  ToneMappingEffect, ToneMappingMode, VignetteEffect, BrightnessContrastEffect, HueSaturationEffect, BlendFunction,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

// Quality presets. "High" is the default and is sized for 180 fps at 3440x1440 on a modern gaming GPU.
// Values from the rendering review (scratchpad review-rendering.txt, concrete specs 3-6).
export const PRESETS = {
  ultra: { label: 'Ultra', ao: true, aoSamples: 32, aoDenoise: 8, aoDenoiseRadius: 8, aoIntensity: 3, bloomLevels: 7, bloomHalf: false, aa: 'smaa', smaa: SMAAPreset.HIGH, shadow: 4096, lightMap: 1024, aniso: 8 },
  high: { label: 'High', ao: true, aoSamples: 16, aoDenoise: 8, aoDenoiseRadius: 12, aoIntensity: 2.5, bloomLevels: 6, bloomHalf: true, aa: 'smaa', smaa: SMAAPreset.MEDIUM, shadow: 2048, lightMap: 512, aniso: 4 },
  performance: { label: 'Performance', ao: false, aoSamples: 8, aoDenoise: 4, aoDenoiseRadius: 12, aoIntensity: 2, bloomLevels: 5, bloomHalf: true, aa: 'fxaa', smaa: SMAAPreset.LOW, shadow: 2048, lightMap: 512, aniso: 2 },
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
    this.overlay = new THREE.Scene();
  }

  build(name) {
    const p = PRESETS[name] || PRESETS.high;
    this.preset = p;
    this.presetName = PRESETS[name] ? name : 'high';
    if (this.composer) this.composer.dispose();
    const r = this.renderer;
    r.toneMapping = THREE.NoToneMapping; // tone mapping happens in the effect pass
    const composer = new EffectComposer(r, { frameBufferType: THREE.HalfFloatType, multisampling: 0, stencilBuffer: false });
    composer.addPass(new RenderPass(this.scene, this.camera));
    this.ao = null;
    if (p.ao) {
      const ao = new N8AOPostPass(this.scene, this.camera, this.width, this.height);
      const c = ao.configuration;
      c.transparencyAware = false; // set explicitly: also stops the per-frame transparency scan
      c.gammaCorrection = false;
      c.halfRes = true;
      c.depthAwareUpsampling = true;
      c.aoSamples = p.aoSamples;
      c.denoiseSamples = p.aoDenoise;
      c.denoiseRadius = p.aoDenoiseRadius;
      c.denoiseIterations = 2;
      c.aoRadius = 1.2;
      c.distanceFalloff = 1.0;
      c.intensity = p.aoIntensity;
      c.color = new THREE.Color(0x0f141c);
      c.screenSpaceRadius = false;
      c.accumulate = false;
      composer.addPass(ao);
      this.ao = ao;
    }
    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD, mipmapBlur: true, levels: p.bloomLevels,
      luminanceThreshold: 1.0, luminanceSmoothing: 0.25, intensity: 0.9, radius: 0.7,
    });
    if (p.bloomHalf && this.bloom.luminancePass && this.bloom.luminancePass.resolution) this.bloom.luminancePass.resolution.scale = 0.5;
    const fx = [this.bloom, new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      new HueSaturationEffect({ saturation: 0.08 }), new BrightnessContrastEffect({ contrast: 0.05 }),
      new VignetteEffect({ offset: 0.3, darkness: 0.35 })];
    if (p.aa === 'fxaa') fx.push(new FXAAEffect());
    const main = new EffectPass(this.camera, ...fx);
    composer.addPass(main);
    let last = main;
    if (p.aa === 'smaa') {
      last = new EffectPass(this.camera, new SMAAEffect({ preset: p.smaa, edgeDetectionMode: EdgeDetectionMode.COLOR }));
      composer.addPass(last);
    }
    last.dithering = true;
    this.composer = composer;
    composer.setSize(this.width, this.height, false);
  }

  // N8AO radius follows the zoom so contact shadows stay in proportion
  setZoom(dist) {
    if (!this.ao) return;
    const r = Math.min(2.0, Math.max(0.35, dist * 0.025));
    const c = this.ao.configuration;
    if (Math.abs(c.aoRadius - r) / r > 0.02) c.aoRadius = r;
  }

  setSize(w, h) {
    this.width = w; this.height = h;
    if (this.composer) this.composer.setSize(w, h, false);
  }

  render(dt) {
    this.composer.render(dt);
    // overlays (health bars, rings, icons) go straight to the canvas, untouched by AO, bloom or tone mapping
    if (this.overlay.children.length) {
      const r = this.renderer;
      const ac = r.autoClear;
      r.autoClear = false;
      r.setRenderTarget(null);
      r.render(this.overlay, this.camera);
      r.autoClear = ac;
    }
  }
}
