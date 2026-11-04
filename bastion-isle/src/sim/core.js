// Shared helpers for the per-tile lot data (see SPEC.md section 1-2). Plain JS, no three.js.
import { W, LF, CV, ZONE, isLand } from '../world.js';
import { G } from '../state.js';
import { ZONES, FIRE } from '../defs.js';
import { rand } from './events.js';

export { LF, CV, ZONE };

// A lot's visuals changed: the renderer patches only these tiles
export function markLot(i) {
  W.lotVersion++;
  W.lotDirty.push(i);
}

// Tiles within hex distance `radius` of tile i (including i), written into `out` (reused). Returns the count.
export function tilesWithin(i, radius, out) {
  out.length = 0;
  const q0 = W.q[i], r0 = W.r[i], R = W.R;
  for (let dq = -radius; dq <= radius; dq++) {
    const lo = Math.max(-radius, -dq - radius), hi = Math.min(radius, -dq + radius);
    for (let dr = lo; dr <= hi; dr++) {
      const q = q0 + dq, r = r0 + dr;
      if (q < -R || q > R || r < -R || r > R || q + r < -R || q + r > R) continue;
      const j = W.lookup[(q + R) * (2 * R + 1) + (r + R)];
      if (j >= 0) out.push(j);
    }
  }
  return out.length;
}

// Is there a standing (or under construction) zoned building on this tile?
export function isLot(i) { return W.zone[i] > 0 && W.lvl[i] > 0 && !(W.flags[i] & LF.RUBBLE); }
export function buildingAt(i) { return W.bld[i] ? G.byId.get(W.bld[i]) || null : null; }
export function lotMaxHp(i) {
  const z = ZONES[W.zone[i]];
  return z && W.lvl[i] ? Math.round(z.levels[W.lvl[i] - 1].hp * (G.mod.lotHp || 1)) : 0;
}

// Hooks filled in by the modules that own the consequences (avoids import cycles):
//   onLotDestroyed(i)              zones.js turns the lot into rubble and records losses
//   onBuildingDamaged(b, dmg)      game.js applies damage to a player-built structure
export const CORE = { onLotDestroyed: null, onBuildingDamaged: null };

const EXPLOSIVE = { shell: 1, bomb: 1, rocket: 1 };

// Route damage to whatever stands on tile i. Explosives may start a fire (FIRE table, sirens research).
export function damageTile(i, dmg, kind) {
  if (i < 0 || dmg <= 0 || G.mode === 'over') return;
  if (W.bld[i]) {
    const b = G.byId.get(W.bld[i]);
    if (b && CORE.onBuildingDamaged) CORE.onBuildingDamaged(b, dmg, kind);
    return;
  }
  if (!isLot(i)) return;
  const hp = W.lotHp[i] - dmg;
  if (EXPLOSIVE[kind] && !W.fire[i]) {
    const p = Math.min(FIRE.igniteMax, Math.max(0, (dmg - FIRE.igniteMin) / FIRE.igniteSpan)) * (G.mod.igniteMul || 1);
    if (rand() < p) ignite(i);
  }
  if (hp <= 0) {
    W.lotHp[i] = 0;
    if (CORE.onLotDestroyed) CORE.onLotDestroyed(i);
  } else {
    W.lotHp[i] = hp;
  }
  markLot(i);
}

export function ignite(i) {
  if (W.fire[i] || !isLand(W.type[i])) return false;
  if (G.fires >= FIRE.cap * 2) return false;
  W.fire[i] = Math.round(FIRE.start * 255);
  G.fires++;
  G.stats.firesStarted++;
  markLot(i);
  return true;
}
