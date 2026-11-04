import { SETTINGS } from './state.js';

// All sounds are synthesised with Web Audio, so the game ships no audio files.
let ctx = null, master = null, comp = null, noise = null;
let voices = 0;
const last = {};
const L = { x: 0, z: 0, yaw: 0, dist: 40 };

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch { ctx = null; return; }
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master = ctx.createGain();
  master.gain.value = SETTINGS.volume;
  master.connect(comp);
  comp.connect(ctx.destination);
  const len = ctx.sampleRate;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
}

export function setVolume(v) { if (master) master.gain.value = v; }
export function setListener(x, z, yaw, dist) { L.x = x; L.z = z; L.yaw = yaw; L.dist = dist; }

function env(g, t, a, peak, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function noiseHit(out, t, dur, type, f0, f1, vol, q = 0.8) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = ctx.createBiquadFilter();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  env(g, t, 0.004, vol, dur);
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t, Math.random() * 0.5, dur + 0.05);
  return src;
}

function tone(out, t, dur, type, f0, f1, vol, a = 0.005) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  env(g, t, a, vol, dur);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.05);
  return o;
}

const S = {
  mg: { gap: 0.045, vol: 0.18, play: (o, t, v) => { noiseHit(o, t, 0.05, 'highpass', 1400, 900, v); tone(o, t, 0.04, 'square', 160, 90, v * 0.4); } },
  rifle: { gap: 0.07, vol: 0.12, play: (o, t, v) => noiseHit(o, t, 0.06, 'bandpass', 2400, 1200, v, 1.2) },
  gun: { gap: 0.1, vol: 0.4, play: (o, t, v) => { noiseHit(o, t, 0.2, 'lowpass', 2000, 300, v); tone(o, t, 0.15, 'sine', 140, 50, v); } },
  cannon: { gap: 0.08, vol: 0.7, play: (o, t, v) => { noiseHit(o, t, 0.7, 'lowpass', 1200, 80, v); tone(o, t, 0.4, 'sine', 90, 30, v * 1.2); } },
  flak: { gap: 0.06, vol: 0.4, play: (o, t, v) => { noiseHit(o, t, 0.22, 'lowpass', 1800, 200, v); tone(o, t, 0.12, 'sine', 120, 45, v * 0.8); } },
  flakBurst: { gap: 0.05, vol: 0.3, play: (o, t, v) => noiseHit(o, t, 0.4, 'bandpass', 900, 250, v, 0.6) },
  missile: { gap: 0.1, vol: 0.35, play: (o, t, v) => { noiseHit(o, t, 0.9, 'bandpass', 500, 2600, v, 2); noiseHit(o, t, 0.25, 'lowpass', 900, 200, v * 0.8); } },
  boom: { gap: 0.04, vol: 0.55, play: (o, t, v) => { noiseHit(o, t, 0.9, 'lowpass', 700, 60, v); tone(o, t, 0.5, 'sine', 70, 28, v); } },
  boomBig: { gap: 0.15, vol: 0.9, play: (o, t, v) => { noiseHit(o, t, 2.0, 'lowpass', 500, 40, v); tone(o, t, 1.0, 'sine', 55, 22, v * 1.2); } },
  splash: { gap: 0.05, vol: 0.4, play: (o, t, v) => { noiseHit(o, t, 0.6, 'bandpass', 1400, 300, v, 0.7); tone(o, t, 0.2, 'sine', 90, 40, v * 0.6); } },
  bombDrop: { gap: 0.25, vol: 0.12, play: (o, t, v) => tone(o, t, 0.9, 'sine', 1400, 500, v, 0.05) },
  plane: { gap: 1.2, vol: 0.2, play: (o, t, v) => {
    const os = tone(o, t, 2.2, 'sawtooth', 95, 80, v, 0.4);
    const lfo = ctx.createOscillator(); const lg = ctx.createGain();
    lfo.frequency.value = 18; lg.gain.value = 12; lfo.connect(lg); lg.connect(os.frequency);
    lfo.start(t); lfo.stop(t + 2.3);
  } },
  landing: { gap: 1, vol: 0.2, play: (o, t, v) => { tone(o, t, 0.5, 'square', 196, 190, v, 0.05); } },
  alarm: { gap: 2, vol: 0.28, ui: true, play: (o, t, v) => {
    for (let k = 0; k < 3; k++) { tone(o, t + k * 0.8, 0.4, 'sine', 620, 900, v, 0.05); tone(o, t + k * 0.8 + 0.4, 0.4, 'sine', 900, 620, v, 0.02); }
  } },
  victory: { gap: 1, vol: 0.22, ui: true, play: (o, t, v) => { [523, 659, 784, 1046].forEach((f, k) => tone(o, t + k * 0.11, 0.5, 'triangle', f, f, v, 0.01)); } },
  build: { gap: 0.05, vol: 0.35, ui: true, play: (o, t, v) => { tone(o, t, 0.18, 'sine', 220, 70, v); noiseHit(o, t, 0.1, 'lowpass', 2500, 400, v * 0.6); } },
  upgrade: { gap: 0.1, vol: 0.25, ui: true, play: (o, t, v) => { [392, 523, 659].forEach((f, k) => tone(o, t + k * 0.07, 0.25, 'triangle', f, f, v, 0.01)); } },
  click: { gap: 0.03, vol: 0.12, ui: true, play: (o, t, v) => tone(o, t, 0.05, 'sine', 1100, 800, v) },
  error: { gap: 0.15, vol: 0.18, ui: true, play: (o, t, v) => { tone(o, t, 0.16, 'square', 160, 120, v); } },
  demolish: { gap: 0.1, vol: 0.35, ui: true, play: (o, t, v) => { noiseHit(o, t, 0.5, 'lowpass', 1500, 100, v); } },
};

export function sfx(name, x, z) {
  if (!ctx || ctx.state !== 'running' || SETTINGS.volume <= 0) return;
  const s = S[name];
  if (!s) return;
  const now = ctx.currentTime;
  if (last[name] && now - last[name] < s.gap) return;
  if (voices > 32) return;
  let vol = s.vol, pan = 0;
  if (x !== undefined && !s.ui) {
    const dx = x - L.x, dz = z - L.z;
    const d = Math.hypot(dx, dz);
    vol *= 1 / (1 + (d / 16) ** 2) * Math.min(1.4, 32 / Math.max(12, L.dist));
    if (vol < 0.01) return;
    // camera right vector is (cos yaw, -sin yaw)
    pan = Math.max(-0.9, Math.min(0.9, (dx * Math.cos(L.yaw) - dz * Math.sin(L.yaw)) / (d + 6)));
  }
  last[name] = now;
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  p.connect(master);
  voices++;
  setTimeout(() => { voices--; p.disconnect(); }, 2600);
  s.play(p, now, vol);
}
