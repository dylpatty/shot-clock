import { computeMods } from './defs.js';

export const G = {
  mode: 'menu',          // 'menu' | 'play' | 'over'
  time: 0,               // game seconds (stops while paused)
  speed: 1,
  paused: false,
  seed: 1,
  res: { food: 0, wood: 0, stone: 0, iron: 0, gold: 0 },
  rates: { food: 0, wood: 0, stone: 0, iron: 0, gold: 0 },
  pop: 0, housing: 0, jobs: 0, eff: 1, effFood: 1, starving: false,
  growT: 0, econT: 0,
  buildings: [], byId: new Map(), nextId: 1, hq: null,
  enemies: [], allies: [], projectiles: [],
  wave: { n: 1, state: 'prep', timer: 0, elapsed: 0, plan: null, queue: [], current: 0 },
  research: {},
  mod: computeMods({}),
  stats: { kills: 0, built: 0, lost: 0, waves: 0, shots: 0 },
  victory: false,
  selected: null,        // building or { ruin: tileIndex }
  tool: null,            // null | { kind: 'build', type } | { kind: 'road' } | { kind: 'bulldoze' }
  dirty: { connect: true, roads: true, trees: true, terrainColors: true, minimap: true },
};

const SETTINGS_KEY = 'bastion.settings.v1';
export const SETTINGS = {
  renderScale: 1,
  shadows: 2,          // 0 off, 1 low, 2 high
  msaa: true,
  showFps: false,
  edgeScroll: false,
  volume: 0.6,
  ...(() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; } })(),
};
export function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch { /* storage unavailable */ }
}

// UI notification queue, drained by ui.js
export const MSG = [];
export function notify(text, kind = 'info') { MSG.push({ text, kind }); }
