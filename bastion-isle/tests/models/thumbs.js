// Thumbnail + silhouette contact sheet. Build: node tests/gfx/build.mjs tests/models/thumbs.js OUT; shoot with
// tests/gfx/shoot.cjs (waits for window.__ready).
import { H } from '../gfx/harness.js';
import { makeThumbnails, makeSilhouettes } from '../../src/gfx/thumbs.js';
import { loadAssetModels } from '../../src/gfx/assets.js';
import { getModels, KEYS } from '../../src/gfx/models.js';
import { BUILD_TYPES } from '../../src/defs.js';

await H.init({ seed: 7, city: false });
await loadAssetModels();
getModels();
const r = H.renderer;
const progBefore = r.info.programs.length;
const t0 = performance.now();
const types = BUILD_TYPES.concat(['hq@2', 'hq@3', 'coastal@3', 'flak@3', 'missile@3', 'clinic@2', 'airfield@3', 'barracks@3']);
const thumbs = makeThumbnails(r, types, { environment: H.scene.environment });
const t1 = performance.now();
const sil = makeSilhouettes(r, KEYS.enemies, { environment: H.scene.environment });
const t2 = performance.now();
const css = document.createElement('style');
css.textContent = `#sheet{position:fixed;inset:0;overflow:auto;background:#0d131a;color:#e8edf1;font:12px/1.2 sans-serif;padding:12px;z-index:5}
.card{display:inline-block;width:176px;margin:6px;background:#18222d;border:1px solid rgba(255,255,255,.1);vertical-align:top}
.card img{display:block;width:176px;height:116px;background:linear-gradient(#2a3a4a,#16202a)}
.card div{padding:4px 6px}.sil{display:inline-block;margin:6px 10px;text-align:center}.sil img{display:block;width:128px;height:64px;background:#18222d}`;
document.head.appendChild(css);
const sheet = document.createElement('div');
sheet.id = 'sheet';
sheet.innerHTML = types.map((k) => `<div class="card"><img src="${thumbs[k] || ''}"><div>${k}</div></div>`).join('') +
  '<div style="margin-top:10px">' + KEYS.enemies.map((k) => `<div class="sil"><img src="${sil[k] || ''}">${k}</div>`).join('') + '</div>' +
  `<div id="info" style="margin-top:8px;color:#93a3b0">thumbs ${(t1 - t0).toFixed(0)} ms, silhouettes ${(t2 - t1).toFixed(0)} ms, programs before ${progBefore} after ${r.info.programs.length}</div>`;
document.body.appendChild(sheet);
H.onFrame(() => { window.__report = { progBefore, progAfter: r.info.programs.length, names: r.info.programs.map((p) => p.name) }; });
H.start(1);
