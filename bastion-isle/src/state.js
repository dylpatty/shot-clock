import { computeMods } from './defs.js';

// The whole game state. Plain data so the sim runs in Node for the balance harness.
// Field ownership is in SPEC.md; keep new fields documented here.
export const G = {
  mode: 'menu',          // 'menu' | 'play' | 'over'
  time: 0,               // game seconds (stops while paused)
  speed: 1,
  paused: false,
  seed: 1,
  difficulty: 'standard',
  tod: 0.36,             // time of day 0..1 (0 midnight, 0.5 noon)

  // economy
  money: 0,
  moneyHist: [],         // one sample per game minute for the budget sparkline (max 10)
  taxes: { R: 10, C: 10, I: 10 },
  budget: { income: { R: 0, C: 0, I: 0, spoils: 0 }, expense: {} }, // $ per minute, by line
  netPerMin: 0,
  overdraftT: 0, negT: 0, // seconds spent below the overdraft floor / below $0
  spoilsLog: [],          // [time, $] of bounties and wave rewards, for the spoils line

  // people and jobs
  pop: 0,                // occupied residents (P)
  workers: 0,            // 0.5 * P
  jobs: { gov: 0, C: 0, I: 0 },
  staffing: 1,           // fraction of C/I jobs filled after government jobs
  unemployment: 0,
  demand: { R: 0, C: 0, I: 0 },        // smoothed, -100..100
  demandTerms: { R: [], C: [], I: [] }, // [{ label, value }] for tooltips
  panic: 0,
  blockade: false,

  // utilities (MW / kL across the Town Hall road network)
  power: { supply: 0, demand: 0 },
  water: { supply: 0, demand: 0 },

  // progression and threat
  milestone: 0,
  threat: 1,             // prominence multiplier used for the next wave plan

  // structures, units, combat
  buildings: [], byId: new Map(), nextId: 1, hq: null,
  enemies: [], allies: [], projectiles: [], trucks: [],
  fires: 0,
  wave: { n: 1, state: 'prep', timer: 0, elapsed: 0, plan: null, queue: [], current: 0, report: null },
  research: {},
  mod: computeMods({}),
  stats: { kills: 0, built: 0, lost: 0, lotsLost: 0, waves: 0, shots: 0, firesStarted: 0, firesOut: 0 },
  victory: false,
  hints: {},             // advisor hints already shown

  // interaction
  selected: null,        // Building, or { lot: tileIndex }, or { ruin: tileIndex }
  tool: null,            // null | { kind: 'build', type } | { kind: 'road' } | { kind: 'zone', zone, brush } | { kind: 'dezone' } | { kind: 'bulldoze' }
  infoView: null,        // null | 'zones' | 'power' | 'water' | 'landvalue' | 'pollution' | 'services' | 'fire' | 'defence'
  dirty: { connect: true, roads: true, trees: true, terrainColors: true, minimap: true, coverage: true, fields: true },
};

const SETTINGS_KEY = 'bastion.settings.v2';
export const SETTINGS = {
  quality: 'high',       // 'ultra' | 'high' | 'performance'
  renderScale: 1,
  showFps: false,
  edgeScroll: false,
  volume: 0.6,
  dayNight: 'cycle',     // 'cycle' | 'day' | 'golden'
  dayLength: 720,        // seconds of game time per day/night cycle
  hudScale: 1,
  hudWidth: 'centred',   // 'centred' | 'full'
  autoPauseRaid: false,
  ...(() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; } })(),
};
export function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch { /* storage unavailable */ }
}

// Harbour Log notification queue, drained by the UI. x/z (optional) let a click jump the camera.
export const MSG = [];
export function notify(text, kind = 'info', x, z) { MSG.push({ text, kind, x, z, t: G.time }); }
