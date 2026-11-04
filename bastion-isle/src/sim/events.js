// Bridge from the simulation to presentation. The sim calls these hooks; main.js replaces the no-ops with the
// real particle/audio/camera functions. In the Node balance harness they stay no-ops.
import { mulberry32 } from '../rng.js';

const noop = () => {};
export const FX = {
  explosion: noop, splash: noop, muzzle: noop, flakBurst: noop, trail: noop, fire: noop, smokePuff: noop,
  dust: noop, wake: noop, sparks: noop, shake: noop, bounty: noop,
};
export const SFX = { play: noop };

// Seeded randomness for everything that affects game outcomes, so harness runs reproduce.
let rng = mulberry32(1);
export function seedRand(seed) { rng = mulberry32((seed >>> 0) ^ 0x9e3779b9); }
export function rand() { return rng(); }
export function randRange(a, b) { return a + rng() * (b - a); }
