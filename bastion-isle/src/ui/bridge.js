// The UI's only door to the simulation and the renderer. main.js passes the real functions to initUI({ sim, gfx });
// until then (or in the UI demo) everything here is a harmless stand-in, so the HUD never crashes on a missing API.
// Names and signatures are listed in tests/ui/REQUESTS.md and the module report.
import { G } from '../state.js';
import { W } from '../world.js';
import { BUILDINGS, ROADS, MONEY, ZONES } from '../defs.js';
import { T } from '../world.js';
import { ringSet } from '../gfx/uniforms.js';

const none = () => null;

// ------------------------------------------------------------------ simulation (src/sim/*)
export const S = {
  tryPlace: () => 'The game is not running',      // (type, tile) -> error string | null
  tryRoad: () => 'The game is not running',       // (tile) -> error string | null
  bulldoze: () => 'Nothing to clear',             // (tile) -> error string | null
  zonePaint: none,                                // (tiles[], zone 1|2|3) -> number painted | error
  dezone: none,                                   // (tiles[])
  upgrade: () => 'Cannot upgrade',                // (building) -> error | null
  sell: () => 'Cannot sell',                      // (building) -> error | null
  setTargetMode: (b, mode, pref) => { b.targetMode = mode; b.domainPref = pref; },
  buyResearch: () => 'Build a War College first', // (id) -> error | null
  callWaveEarly: () => 0,                         // () -> bonus $
  landValueBreakdown: () => [],                   // (tile) -> [{ label, value }]
  demandBreakdown: () => G.demandTerms,           // () -> { R: [{label, value}], C: [...], I: [...] }
  budgetBreakdown: null,                          // () -> { income: [{key,label,value}], expense: [{key,label,value,items?}] }
  missingRequirements: () => [],                  // (tile) -> [{ key, label, ok }] (or keys of what is missing)
  placeProblem: () => null,                       // (type, tile) -> error | null
  roadProblem: () => null,                        // (tile) -> error | null
  rebuildRuin: () => 'Nothing to rebuild',        // (tile) -> error | Building
  rebuildAllRuins: () => 'Nothing to rebuild',    // () -> error | null
  ruinsCost: () => 0,                             // () -> $ to rebuild every player-built ruin
  saveGame: () => false, loadGame: () => false, hasSave: () => false,
  setTax: (zone, pct) => { G.taxes[zone] = pct; }, // (key 'R'|'C'|'I', 0..25)
  isUnlocked: (type) => (BUILDINGS[type].unlock || 0) <= (G.milestone || 0),
  sellValue: (b) => {                              // (building) -> refund $
    const inv = b.invested || b.def.cost || 0;
    const grace = G.time - (b.born || 0) < MONEY.sellGraceSec && !(G.wave && G.wave.startedSince && G.wave.startedSince > b.born);
    return Math.floor(inv * (grace ? MONEY.sellGraceRefund : MONEY.sellRefund));
  },
  upgradeCost: (b) => {                            // (building) -> $ | null at max level
    const d = b.def;
    if (!d.upgradeCost || b.level >= (d.maxLevel || 1)) return null;
    return d.upgradeCost(b.level);
  },
  roadCost: (i) => {                               // (tile) -> $ to lay a road here
    let c = ROADS.cost;
    if (W.type[i] === T.HILLS) c += ROADS.hillExtra;
    if (W.type[i] === T.FOREST) c += ROADS.forestExtra;
    return c;
  },
  weaponStats: (b) => b.ws || null,               // (building) -> { dmg, range, rate, splash }
  previewUpgrade: null,                           // (building) -> { dmg, range, rate, hp } after the next level
  enemiesAlive: () => { let n = 0; for (const e of G.enemies) if (e.alive && e.team !== 'A') n++; return n; },
  lotName: null,                                  // (tile) -> '14 Harbour Street'
};

// ------------------------------------------------------------------ renderer (src/gfx/*)
export const X = {
  setInfoView: none,       // (perTileRGBA Uint8Array(W.count*4) | null, perTileStyle Uint8Array(W.count) | undefined)
  setField: none,          // (mapRGBA Uint8Array(size*size*4) | null, size)
  setRings: (list) => ringSet(list), // ([{ x, z, r, style, color }]) max 8
  rebuildCoverage: none,   // ([{ x, z, r, sea, air, ground }]) towers that cover each domain
  setGhost: none,          // (type | null, x, y, z, yaw, ok)
  raidMarkers: null,       // (camera) -> [{ sx, sy, ang, type, count, x, z }] off-screen chevrons (optional)
  makeThumbnails: null,    // (renderer, keys) -> { key: dataURL }
  makeSilhouettes: null,   // (renderer, enemyKeys) -> { key: dataURL }
};

// ------------------------------------------------------------------ app (main.js)
export const APP = {
  newGame: none,           // ({ seed, difficulty, sandbox }) start a run
  continueGame: none,      // () load the save and play
  toMenu: none,            // () quit to the main menu
  reroll: none,            // () -> new menu seed (number)
  applySettings: none,     // (changedKey) quality, renderScale, dayNight... changed in SETTINGS
  fullscreen: () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); },
  sound: null,             // (name) UI click sounds; defaults to SFX.play
  renderer: null,          // THREE.WebGLRenderer (for thumbnails)
  camera: null,            // THREE.PerspectiveCamera (for projecting tower cards and chevrons)
};

export function bindAPI(h = {}) {
  if (h.sim) for (const k in h.sim) if (typeof h.sim[k] === 'function') S[k] = h.sim[k];
  if (h.gfx) for (const k in h.gfx) if (typeof h.gfx[k] === 'function') X[k] = h.gfx[k];
  for (const k of Object.keys(APP)) if (h[k] !== undefined) APP[k] = h[k];
}

export const zoneKey = (z) => (ZONES[z] ? ZONES[z].key : '');
