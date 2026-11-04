// Performance instrumentation for the F3 overlay (rendering review concrete specs 15-16).
// CPU: per-phase timers. GPU: EXT_disjoint_timer_query_webgl2 queries read back a few frames later (never blocks).
import { Pool } from './pools.js';

const PHASES = ['input', 'sim', 'sync', 'life', 'lightmap', 'post', 'hud'];

export class Perf {
  constructor(renderer) {
    this.renderer = renderer;
    const gl = renderer.getContext();
    this.gl = gl;
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    this.ring = [];            // pending GPU queries [{q, frame}]
    this.gpuMs = 0; this.gpuSamples = [];
    this.cpu = Object.fromEntries(PHASES.map((p) => [p, 0]));
    this.cpuAcc = Object.fromEntries(PHASES.map((p) => [p, 0]));
    this.t0 = 0; this.phase = null;
    this.frames = new Float32Array(360); this.fi = 0;
    this.n = 0;
    this.programsAtWarm = 0;
    this.refresh = 0;
    this.text = '';
    this.timer = 0;
    this.uploadAcc = 0;
  }

  // CPU phase timing: mark('sim') ... mark('sync') ... end()
  mark(name) {
    const t = performance.now();
    if (this.phase) this.cpuAcc[this.phase] += t - this.t0;
    this.phase = name; this.t0 = t;
  }
  endPhases() { this.mark(null); }

  gpuBegin() {
    if (!this.ext || this.active) return;
    const gl = this.gl;
    const q = gl.createQuery();
    gl.beginQuery(this.ext.TIME_ELAPSED_EXT, q);
    this.active = q;
  }
  gpuEnd() {
    if (!this.active) return;
    const gl = this.gl;
    gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    this.ring.push(this.active);
    this.active = null;
    // read results that are ready (3+ frames old); never block
    while (this.ring.length > 3) {
      const q = this.ring[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      const disjoint = gl.getParameter(this.ext.GPU_DISJOINT_EXT);
      const ns = gl.getQueryParameter(q, gl.QUERY_RESULT);
      gl.deleteQuery(q);
      this.ring.shift();
      if (!disjoint) { this.gpuSamples.push(ns / 1e6); if (this.gpuSamples.length > 60) this.gpuSamples.shift(); }
    }
  }

  snapshotPrograms() { this.programsAtWarm = this.renderer.info.programs ? this.renderer.info.programs.length : 0; }

  // Call once per frame with the real frame interval (seconds). Returns the overlay text every 0.5 s.
  frame(rdt, extra) {
    this.frames[this.fi] = rdt * 1000; this.fi = (this.fi + 1) % this.frames.length;
    this.n++;
    this.uploadAcc += Pool.uploaded; Pool.uploaded = 0;
    this.timer -= rdt;
    if (this.timer > 0) return this.text;
    this.timer = 0.5;
    const arr = Array.from(this.frames).filter((v) => v > 0).sort((a, b) => a - b);
    const pick = (p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0;
    const avg = arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
    const med = pick(0.5);
    // refresh estimate: the median frame interval while the game keeps up
    this.refresh = med > 0 ? Math.round(1000 / med) : 0;
    const dropped = arr.filter((v) => v > med * 1.5).length;
    for (const p of PHASES) { this.cpu[p] = this.cpuAcc[p] / Math.max(1, this.n); this.cpuAcc[p] = 0; }
    const upKB = this.uploadAcc / Math.max(1, this.n) / 1024;
    this.uploadAcc = 0;
    this.n = 0;
    const gpu = this.gpuSamples.length ? this.gpuSamples.reduce((a, b) => a + b, 0) / this.gpuSamples.length : null;
    const info = this.renderer.info;
    const programs = info.programs ? info.programs.length : 0;
    const progWarn = this.programsAtWarm && programs > this.programsAtWarm;
    const cpuTxt = PHASES.map((p) => `${p} ${this.cpu[p].toFixed(2)}`).join(' · ');
    this.text =
      `<b>${(1000 / avg).toFixed(0)}</b> fps · ${avg.toFixed(2)} ms avg · p95 ${pick(0.95).toFixed(1)} · p99 ${pick(0.99).toFixed(1)} · worst ${arr.length ? arr[arr.length - 1].toFixed(1) : 0}<br>` +
      `display ~${this.refresh} Hz · ${dropped} slow frames / ${arr.length}<br>` +
      `CPU ms: ${cpuTxt}<br>` +
      `GPU ${gpu == null ? 'timer n/a' : gpu.toFixed(2) + ' ms'} · ${info.render.calls} draws · ${(info.render.triangles / 1000).toFixed(0)}k tris · ` +
      `<span style="color:${progWarn ? '#ff6b5e' : 'inherit'}">${programs} programs${progWarn ? ' (+' + (programs - this.programsAtWarm) + ' since warm-up!)' : ''}</span> · ${upKB.toFixed(0)} KB/frame upload` +
      (extra ? `<br>${extra}` : '');
    return this.text;
  }
}
