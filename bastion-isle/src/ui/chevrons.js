// Off-screen raid chevrons on the true screen edges (1.25rem inset), grouped by enemy type and direction, with type
// icon and count; new groups pulse for 2 s; a click jumps the camera. Uses X.raidMarkers(camera) when the life module
// provides it, otherwise projects G.enemies itself. Positioned with transforms at 10 Hz.
import { G } from '../state.js';
import { icon } from './icons.js';
import { $, el, setText, setClass } from './util.js';
import { X } from './bridge.js';
import { project, focus } from '../input.js';
import { ENEMY_ICON } from './hud.js';
import { UI, sound } from './ustate.js';

const MAX = 10;
const pool = [];
const seen = new Map(); // group key -> first seen time
const _p = { x: 0, y: 0, z: 0 };

export function initChevrons() {
  const box = $('#chevrons');
  for (let k = 0; k < MAX; k++) {
    const c = el('button', 'chev hidden');
    c.innerHTML = `<i class="cv-arrow"></i><span class="cv-ic"></span><b class="cv-n tnum"></b>`;
    c.addEventListener('click', () => { if (c._x != null) { focus(c._x, c._z, 30); sound('click'); } });
    box.appendChild(c);
    pool.push(c);
  }
}

function groups(camera) {
  if (X.raidMarkers) return X.raidMarkers(camera) || [];
  const w = innerWidth, h = innerHeight, cx = w / 2, cy = h / 2;
  const g = new Map();
  for (const e of G.enemies) {
    if (!e.alive || e.team === 'A') continue;
    const front = project(e.x, e.y || 0, e.z, _p);
    let x = _p.x, y = _p.y;
    if (!front) { x = cx - (x - cx) * 50; y = cy - (y - cy) * 50; }
    if (front && x >= 0 && x <= w && y >= 0 && y <= h) continue;
    const ang = Math.atan2(y - cy, x - cx);
    const sector = Math.round((ang / (Math.PI * 2)) * 12);
    const key = e.type + ':' + sector;
    let o = g.get(key);
    if (!o) { o = { key, type: e.type, count: 0, ax: 0, ay: 0, x: 0, z: 0 }; g.set(key, o); }
    o.count++; o.ax += Math.cos(ang); o.ay += Math.sin(ang); o.x += e.x; o.z += e.z;
  }
  const out = [];
  for (const o of g.values()) { o.ang = Math.atan2(o.ay, o.ax); o.x /= o.count; o.z /= o.count; out.push(o); }
  out.sort((a, b) => b.count - a.count);
  return out;
}

// HUD panels the chevrons step around (cached, refreshed every 0.5 s): a chevron that would land on a panel moves
// just inside it (below a top-row panel, above a bottom-row one) so both stay readable and clickable
const AVOID = ['citycard', 'chips', 'raidclock', 'status', 'log', 'inspector', 'dock', 'drawer', 'mapwrap', 'rail', 'legend', 'advisor', 'towercard'];
let avoid = [], avoidT = 0;
function refreshAvoid() {
  avoid = [];
  for (const id of AVOID) {
    const e = document.getElementById(id);
    if (!e || e.classList.contains('hidden') || !e.offsetParent) continue;
    const r = e.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) avoid.push(r);
  }
}
function dodge(p, rem) {
  const pad = 1.4 * rem;
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const r of avoid) {
      if (p.x < r.left - pad || p.x > r.right + pad || p.y < r.top - pad || p.y > r.bottom + pad) continue;
      p.y = r.top > innerHeight * 0.5 ? r.top - pad : r.bottom + pad;
      moved = true;
    }
    if (!moved) break;
  }
}
const _q = { x: 0, y: 0 };

export function updateChevrons(camera) {
  const list = G.mode === 'play' ? groups(camera) : [];
  if (list.length && (performance.now() - avoidT > 500 || UI.layoutDirty)) { avoidT = performance.now(); refreshAvoid(); }
  const w = innerWidth, h = innerHeight, cx = w / 2, cy = h / 2;
  const rem = UI.rem || 15, inset = 1.25 * rem + 1.25 * rem;
  const now = performance.now();
  for (let k = 0; k < MAX; k++) {
    const c = pool[k], o = list[k];
    if (!o) { setClass(c, 'hidden', true); continue; }
    setClass(c, 'hidden', false);
    // intersect the ray from the screen centre with the inset screen rectangle
    let px, py;
    if (o.sx != null) { px = o.sx; py = o.sy; } else {
      const dx = Math.cos(o.ang), dy = Math.sin(o.ang);
      const tx = dx ? (cx - inset) / Math.abs(dx) : 1e9, ty = dy ? (cy - inset) / Math.abs(dy) : 1e9;
      const t = Math.min(tx, ty);
      px = cx + dx * t; py = cy + dy * t;
    }
    _q.x = px; _q.y = py; dodge(_q, rem); px = _q.x; py = _q.y;
    const tr = `translate(${Math.round(px - 1.25 * rem)}px, ${Math.round(py - 1.25 * rem)}px)`;
    if (c._tr !== tr) { c._tr = tr; c.style.transform = tr; }
    const rot = `rotate(${((o.ang * 180) / Math.PI).toFixed(0)}deg)`;
    const ar = c.firstChild;
    if (ar._r !== rot) { ar._r = rot; ar.style.transform = rot; }
    if (c._type !== o.type) { c._type = o.type; c.children[1].innerHTML = icon(ENEMY_ICON[o.type] || 'skull'); }
    setText(c.children[2], o.count > 1 ? `×${o.count}` : '');
    if (!seen.has(o.key)) seen.set(o.key, now);
    setClass(c, 'new', now - seen.get(o.key) < 2000);
    c._x = o.x; c._z = o.z;
  }
  if (seen.size > 64) seen.clear();
}
