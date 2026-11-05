// UI-local state shared by the HUD modules (never read by the sim).
import { G, notify } from '../state.js';
import { SFX } from '../sim/events.js';
import { APP } from './bridge.js';

export const UI = {
  k: {},               // cached [data-k] lookups for the always-on HUD
  thumbs: {},          // building type -> data URL (rendered from the real models at startup)
  silhouettes: {},     // enemy type -> data URL
  drawer: null,        // open dock category
  sheet: null,         // 'budget' | 'research' | 'log' | null
  screen: null,        // 'menu' | 'pause' | 'settings' | 'help' | 'over' | 'victory' | 'report' | null
  rcOpen: false,       // raid clock pinned open
  lastZone: 1,
  perf: false,
  perfText: '',
  sel: undefined,      // selection the inspector was built for
  shown: false,        // HUD visible
  menuSeed: 1,
  difficulty: 'standard',
  sandbox: false,
};

export function sound(name) {
  if (APP.sound) APP.sound(name); else SFX.play(name);
}
// a UI-originated Harbour Log entry (errors from tools, confirmations)
export function say(text, kind = 'info', x, z) {
  notify(text, kind, x, z);
}
export { G };
