// Flat-top hex minimap (UX should_change 7, concrete spec 6): base layer redrawn only when the world or lots change
// (at most every 1.5 s), dynamic layer (enemies, towers, fires, lanes, camera trapezoid) at 10 Hz. North up; a click
// or drag pans the camera. Info-view rail to its left and the legend card above it.
import { G } from '../state.js';
import { W, T, LF, isLand } from '../world.js';
import { ZONES } from '../defs.js';
import { icon } from './icons.js';
import { $, $$, setClass, setHTML, esc, fmtInt } from './util.js';
import { focus } from '../input.js';
import { UI, sound } from './ustate.js';
import { VIEWS, VIEW_BY_ID, IV, toggleView, setSub, setView, RAMPS, rampCSS } from './infoviews.js';
import { radarOnline } from './hud.js';

const MW = 512, MH = 443;
let base, dyn, bctx, dctx, scale = 4, ox = MW / 2, oy = MH / 2;
let baseKey = '', baseT = 0, camRay = null;

const TCOL = ['#123d58', '#1f6478', '#cdbd92', '#6e8c4c', '#4e6a3a', '#8d8a72', '#7a7368'];
const ZCOL = [null, '#5DBB63', '#4C9BE8', '#E0A040'];

export function buildMap(frame) {
  frame.insertAdjacentHTML('beforeend', `
  <div id="mapwrap">
    <div id="legend" class="panel hidden"></div>
    <div id="rail">${VIEWS.map((v) => `<button class="rl ch" data-view="${v.id}" data-tip="view-${v.id}">${icon(v.icon)}<kbd>${v.key}</kbd></button>`).join('')}</div>
    <div id="minimap"><div class="mm-hex"><canvas class="mm-base" width="${MW}" height="${MH}"></canvas><canvas class="mm-dyn" width="${MW}" height="${MH}"></canvas></div>
      <div class="mm-n">N</div></div>
  </div>`);
  base = $('#minimap .mm-base'); dyn = $('#minimap .mm-dyn');
  bctx = base.getContext('2d'); dctx = dyn.getContext('2d');
  for (const b of $$('#rail [data-view]')) b.addEventListener('click', () => { toggleView(b.dataset.view); sound('click'); refreshRail(); });
  const hex = $('#minimap .mm-hex');
  let drag = false;
  const pan = (e) => {
    const r = hex.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * MW, py = ((e.clientY - r.top) / r.height) * MH;
    focus((px - ox) / scale, (py - oy) / scale);
  };
  hex.addEventListener('mousedown', (e) => { if (e.button === 0) { drag = true; pan(e); e.preventDefault(); } });
  window.addEventListener('mousemove', (e) => { if (drag) pan(e); });
  window.addEventListener('mouseup', () => { drag = false; });
  $('#legend').addEventListener('click', (e) => {
    const s = e.target.closest('[data-sub]');
    if (s) { setSub(G.infoView, s.dataset.sub); sound('click'); renderLegend(true); return; }
    if (e.target.closest('[data-clay]')) { IV.clay = !IV.clay; sound('click'); renderLegend(true); return; }
    if (e.target.closest('[data-off]')) { setView(null); sound('click'); refreshRail(); }
  });
}

function layout() {
  const R = W.R || 32;
  const wx = Math.sqrt(3) * R + 1.2, wz = 1.5 * R + 1.2;
  scale = Math.min(MW / (2 * wx), MH / (2 * wz));
  ox = MW / 2; oy = MH / 2;
}

function hexPath(ctx, x, y, r) {
  // pointy-top tile, matching the world grid
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.866, y - r * 0.5);
  ctx.lineTo(x + r * 0.866, y + r * 0.5);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.866, y + r * 0.5);
  ctx.lineTo(x - r * 0.866, y - r * 0.5);
  ctx.closePath();
}

export function drawBase(force) {
  if (!W.count) return;
  const key = `${W.version}|${W.lotVersion}|${G.buildings.length}`;
  const now = performance.now();
  if (!force && (key === baseKey || now - baseT < 1500)) return;
  baseKey = key; baseT = now;
  layout();
  const c = bctx;
  c.clearRect(0, 0, MW, MH);
  c.fillStyle = '#0b2536';
  c.fillRect(0, 0, MW, MH);
  const r = scale * 1.02;
  // terrain in batches per colour
  const buckets = new Map();
  for (let i = 0; i < W.count; i++) {
    let col;
    if (W.road[i]) col = '#e8e6df';
    else if (W.zone[i]) {
      col = W.flags[i] & LF.RUBBLE ? '#6a6660' : ZCOL[W.zone[i]];
    } else col = TCOL[W.type[i]] || '#123d58';
    let b = buckets.get(col);
    if (!b) { b = []; buckets.set(col, b); }
    b.push(i);
  }
  for (const [col, list] of buckets) {
    c.beginPath();
    for (const i of list) hexPath(c, ox + W.x[i] * scale, oy + W.z[i] * scale, r);
    c.globalAlpha = ZCOL.includes(col) ? 0.78 : 1;
    c.fillStyle = col;
    c.fill();
  }
  c.globalAlpha = 1;
  // civic structures as small light hexes
  c.beginPath();
  for (const b of G.buildings) if (b.def && b.def.kind !== 'military') hexPath(c, ox + b.x * scale, oy + b.z * scale, r * 0.75);
  c.fillStyle = '#f3efe4';
  c.fill();
  if (G.hq) {
    c.beginPath(); hexPath(c, ox + G.hq.x * scale, oy + G.hq.z * scale, r * 1.6);
    c.fillStyle = '#3cc8d0'; c.fill();
    c.lineWidth = 2; c.strokeStyle = '#06272a'; c.stroke();
  }
}

// ground point under a screen position (y = 0 plane), for the camera trapezoid
function groundAt(camera, sx, sy, out) {
  if (!camRay) camRay = { o: camera.position.clone(), d: camera.position.clone() };
  const o = camRay.o, d = camRay.d;
  o.setFromMatrixPosition(camera.matrixWorld);
  d.set(sx, sy, 0.5).unproject(camera).sub(o).normalize();
  let t = d.y < -1e-3 ? -o.y / d.y : 400;
  t = Math.min(t, 400);
  out[0] = o.x + d.x * t; out[1] = o.z + d.z * t;
}
const _a = [0, 0], _b = [0, 0], _c = [0, 0], _d = [0, 0];

export function drawDynamic(camera) {
  if (!W.count) return;
  const c = dctx;
  c.clearRect(0, 0, MW, MH);
  const P = (x) => ox + x * scale, Q = (z) => oy + z * scale;
  // predicted approach lanes (radar) or sector chevrons
  const w = G.wave;
  if (w && w.state === 'prep' && w.plan && w.plan.dirs && G.mode === 'play') {
    const radar = radarOnline();
    c.strokeStyle = 'rgba(255,77,61,0.85)';
    c.fillStyle = 'rgba(255,77,61,0.85)';
    for (const a of w.plan.dirs) {
      const ex = Math.sin(a) * 54, ez = Math.cos(a) * 54;
      if (radar) {
        c.setLineDash([6, 5]); c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(P(ex), Q(ez)); c.lineTo(P(ex * 0.42), Q(ez * 0.42)); c.stroke();
        c.setLineDash([]);
      }
      // chevron at the edge pointing inwards
      const x = P(ex * 0.93), y = Q(ez * 0.93), ang = Math.atan2(-ez, -ex);
      c.save(); c.translate(x, y); c.rotate(ang);
      c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -8); c.lineTo(-2, 0); c.lineTo(-6, 8); c.closePath(); c.fill();
      c.restore();
    }
  }
  // towers
  c.fillStyle = '#3cc8d0';
  c.strokeStyle = '#06272a'; c.lineWidth = 1.5;
  for (const b of G.buildings) {
    if (!b.def || b.def.kind !== 'military') continue;
    c.beginPath(); c.arc(P(b.x), Q(b.z), 3.6, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  // fires
  if (G.fires > 0 && W.fire) {
    c.fillStyle = '#ff8a2a';
    for (const i of W.land) if (W.fire[i]) { c.beginPath(); c.arc(P(W.x[i]), Q(W.z[i]), 3, 0, Math.PI * 2); c.fill(); }
  }
  // enemies: red triangles (hostile is always red and triangular)
  c.fillStyle = '#ff4d3d'; c.strokeStyle = '#2a0805'; c.lineWidth = 1.2;
  for (const e of G.enemies) {
    if (!e.alive || e.team === 'A') continue;
    const x = P(e.x), y = Q(e.z), s = e.domain === 'air' ? 4.5 : e.type === 'battleship' || e.type === 'destroyer' ? 5.5 : 4;
    c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.9, y + s * 0.7); c.lineTo(x - s * 0.9, y + s * 0.7); c.closePath(); c.fill(); c.stroke();
  }
  // camera trapezoid
  if (camera && G.mode === 'play') {
    groundAt(camera, -1, -1, _a); groundAt(camera, 1, -1, _b); groundAt(camera, 1, 1, _c); groundAt(camera, -1, 1, _d);
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(P(_a[0]), Q(_a[1])); c.lineTo(P(_b[0]), Q(_b[1])); c.lineTo(P(_c[0]), Q(_c[1])); c.lineTo(P(_d[0]), Q(_d[1])); c.closePath(); c.stroke();
  }
}

export function refreshRail() {
  for (const b of $$('#rail [data-view]')) setClass(b, 'on', G.infoView === b.dataset.view);
  renderLegend(true);
}

// ------------------------------------------------------------------ legend

const sw = (col, label, cls = '') => `<li class="${cls}"><i style="background:${col}"></i><span>${label}</span></li>`;
let legendKey = '';
export function renderLegend(force) {
  const lg = $('#legend');
  const v = G.infoView ? VIEW_BY_ID[G.infoView] : null;
  if (!v || G.mode !== 'play') { lg.classList.add('hidden'); legendKey = ''; return; }
  const st = IV.stats || {};
  const key = `${v.id}|${IV.sub[v.id] || ''}|${IV.clay}|${JSON.stringify(st)}|${Math.round(G.demand.R)}|${Math.round(G.demand.C)}|${Math.round(G.demand.I)}`;
  if (!force && key === legendKey) return;
  legendKey = key;
  lg.classList.remove('hidden');
  let body = '';
  const subs = v.subs ? `<div class="lg-subs seg">${v.subs.map(([k, l]) => `<button class="ch ${IV.sub[v.id] === k ? 'on' : ''}" data-sub="${k}">${l}</button>`).join('')}</div>` : '';
  switch (v.id) {
    case 'zones':
      body = `<ul class="lg-sw">${[1, 2, 3].map((z) => sw(ZCOL[z], `${ZONES[z].name} <b class="tnum">${Math.round(G.demand[ZONES[z].key] || 0)}</b>`, 'pat' + z)).join('')}${sw('#e8e6df', 'Road linked to the Town Hall')}${sw('#FF4D3D', 'Road cut off')}</ul>`;
      break;
    case 'power': case 'water': {
      const col = v.id === 'power' ? '#F5CF4A' : '#4FB3FF';
      body = `<ul class="lg-sw">${sw(col, v.id === 'power' ? 'Powered' : 'Supplied')}${sw('#FF4D3D', v.id === 'power' ? 'No power' : 'No water', 'hatch')}${sw(col, 'Producer', 'ring')}</ul><div class="lg-stat">${st.unpowered ? `<b class="bad">${fmtInt(st.unpowered)}</b> buildings without ${v.id}` : `Every building has ${v.id}`}</div>`;
      break;
    }
    case 'landvalue':
      body = `<div class="lg-ramp" style="background:linear-gradient(90deg, ${rampCSS(RAMPS.landvalue)})"></div><div class="lg-scale"><span>0</span><span>50</span><span>100</span></div><div class="lg-stat">Zoned average <b class="tnum">${Math.round(st.avg || 0)}</b> · hover a tile for its terms</div>`;
      break;
    case 'pollution':
      body = `<div class="lg-ramp" style="background:linear-gradient(90deg, rgba(217,199,106,0.25), ${rampCSS(RAMPS.pollution)})"></div><div class="lg-scale"><span>clean</span><span>30</span><span>60</span></div><div class="lg-stat">${st.lots ? `<b class="bad">${fmtInt(st.lots)}</b> homes in polluted air` : 'No homes in polluted air'}</div>`;
      break;
    case 'services':
      body = `<ul class="lg-sw">${sw('#3CC8D0', 'Covered')}${sw('#FF4D3D', 'Building outside coverage', 'hatch')}</ul><div class="lg-stat"><b class="tnum">${fmtInt(st.covered || 0)}</b> covered · <b class="tnum ${st.uncovered ? 'bad' : ''}">${fmtInt(st.uncovered || 0)}</b> outside</div>`;
      break;
    case 'fire':
      body = `<ul class="lg-sw">${sw('#FF4D3D', 'Burning now', 'pulse')}${sw('#FFB547', 'Outside fire coverage', 'hatch')}${sw('#5FD38A', 'Covered by a fire station')}</ul><div class="lg-stat">${st.burning ? `<b class="bad">${st.burning}</b> burning · ` : ''}<b class="tnum">${fmtInt(st.uncovered || 0)}</b> at risk</div>`;
      break;
    case 'defence':
      body = `<ul class="lg-sw">${sw('#5FD38A', '2+ towers in range')}${sw('#FFB547', '1 tower')}${sw('#FF4D3D', 'Not covered', 'hatch')}${IV.sub.defence === 'ground' ? sw('#FF4D3D', 'Landing beach (MG or barracks within 6 = green)', 'hatch ring') : ''}</ul><div class="lg-stat">${IV.sub.defence === 'ground' ? `<b class="tnum ${st.gaps ? 'bad' : ''}">${st.gaps || 0}</b> of ${st.beaches || 0} beaches unguarded` : `<b class="tnum ${st.gaps ? 'bad' : ''}">${fmtInt(st.gaps || 0)}</b> tiles in reach of raids uncovered`}</div>`;
      break;
  }
  lg.innerHTML = `<div class="lg-head">${icon(v.icon)}<b>${esc(v.name)}</b><kbd>⇧${v.key}</kbd><button class="ib" data-off="1" aria-label="Close view">${icon('x')}</button></div>${subs}${body}
    <button class="lg-clay tgb ${IV.clay ? 'on' : ''}" data-clay="1"><i class="box"></i><span>Clay model</span></button>`;
}

