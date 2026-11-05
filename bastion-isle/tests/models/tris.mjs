// node tests/models/tris.mjs  -> triangle / vertex budget table for every procedural model (runs in plain Node)
import { getModels } from '../../src/gfx/models.js';
const t0 = performance.now();
const R = getModels();
const ms = performance.now() - t0;
const BUDGET = { structure: 4000, head: 4000, rotor: 4000, unit: 2000, vehicle: 400, boat: 2000, projectile: 300, misc: 1000 };
let fail = 0;
const rows = [];
for (const k in R) {
  const e = R[k];
  if (e.key !== k) continue; // aliases
  const over = e.tris > BUDGET[e.cat];
  if (over) fail++;
  rows.push(`${k.padEnd(18)} ${e.cat.padEnd(10)} ${String(e.tris).padStart(5)} tris ${String(e.geometry.attributes.position.count).padStart(5)} verts  r=${e.radius.toFixed(2)}${e.head ? '  head=' + e.head + ' @' + e.headY : ''}${over ? '  OVER BUDGET ' + BUDGET[e.cat] : ''}`);
}
console.log(rows.join('\n'));
console.log(`\n${rows.length} models built in ${ms.toFixed(0)} ms, ${fail} over budget`);
process.exitCode = fail ? 1 : 0;
