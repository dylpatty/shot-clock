import * as THREE from 'three';
import { R, recolorTerrain } from './render.js';
import { W, tileAt, isLand } from './world.js';
import { clamp, lerp } from './hex.js';
import { G, SETTINGS } from './state.js';
import { BUILDINGS, ROAD_COST } from './defs.js';
import { placeProblem, roadProblem, tryPlace, tryRoad, bulldoze, canAfford } from './game.js';
import { findPath } from './path.js';
import { sfx, setListener } from './audio.js';
import * as FX from './fx.js';

export const CAM = { tx: 0, tz: 4, yaw: 0, dist: 44, tilt: 0, g: { tx: 0, tz: 4, yaw: 0, dist: 44, tilt: 0 }, orbit: false };
const MIN_D = 9, MAX_D = 82;
export const keys = new Set();
export const mouse = {
  x: -1, y: -1, tile: -1, wx: 0, wz: 0, over: false,
  left: false, right: false, middle: false, sx: 0, sy: 0, moved: 0,
  roadStart: -1, roadPath: [], roadValid: [], bulldozed: new Set(),
};
export const hooks = { onSelect: null, onError: null, onPlaced: null, isUIBlocking: () => false };

// ------------------------------------------------------------------ camera

const _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2();
let shakeT = 0, shakeA = 0;

export function focus(x, z, dist) {
  CAM.g.tx = x; CAM.g.tz = z;
  if (dist) CAM.g.dist = dist;
}

export function updateCamera(dt) {
  const g = CAM.g;
  if (CAM.orbit) {
    g.yaw += dt * 0.05;
  } else if (!hooks.isUIBlocking()) {
    let px = 0, pz = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) pz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) pz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) px -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) px += 1;
    if (SETTINGS.edgeScroll && mouse.over && document.hasFocus()) {
      const m = 4;
      if (mouse.x <= m) px -= 1; else if (mouse.x >= window.innerWidth - 1 - m) px += 1;
      if (mouse.y <= m) pz -= 1; else if (mouse.y >= window.innerHeight - 1 - m) pz += 1;
    }
    if (px || pz) {
      const sp = g.dist * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 1.8 : 0.95) * dt;
      const c = Math.cos(g.yaw), s = Math.sin(g.yaw);
      g.tx += (c * px + s * pz) * sp;
      g.tz += (-s * px + c * pz) * sp;
    }
    if (keys.has('KeyQ')) g.yaw += dt * 1.6;
    if (keys.has('KeyE')) g.yaw -= dt * 1.6;
  }
  const lim = 42;
  const r = Math.hypot(g.tx, g.tz);
  if (r > lim) { g.tx *= lim / r; g.tz *= lim / r; }
  g.dist = clamp(g.dist, MIN_D, MAX_D);
  g.tilt = clamp(g.tilt, -0.35, 0.3);

  const k = 1 - Math.exp(-dt * 11);
  CAM.tx = lerp(CAM.tx, g.tx, k); CAM.tz = lerp(CAM.tz, g.tz, k);
  CAM.yaw = lerp(CAM.yaw, g.yaw, k);
  CAM.dist = lerp(CAM.dist, g.dist, 1 - Math.exp(-dt * 9));
  CAM.tilt = lerp(CAM.tilt, g.tilt, k);

  const zf = (CAM.dist - MIN_D) / (MAX_D - MIN_D);
  const pitch = clamp(lerp(0.6, 1.13, Math.sqrt(zf)) + CAM.tilt, 0.3, 1.45);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  let x = CAM.tx + Math.sin(CAM.yaw) * cp * CAM.dist;
  let y = 0.4 + sp * CAM.dist;
  let z = CAM.tz + Math.cos(CAM.yaw) * cp * CAM.dist;

  if (G.shakeReq) {
    const a = G.shakeAt ? Math.hypot(G.shakeAt.x - CAM.tx, G.shakeAt.z - CAM.tz) : 0;
    const amt = G.shakeReq / (1 + (a / 14) ** 2) * (30 / Math.max(15, CAM.dist));
    if (amt > shakeA * (shakeT / 0.35)) { shakeA = amt; shakeT = 0.35; }
    G.shakeReq = 0;
  }
  let ox = 0, oy = 0;
  if (shakeT > 0) {
    shakeT -= dt;
    const s = shakeA * (shakeT / 0.35);
    ox = (Math.random() - 0.5) * s; oy = (Math.random() - 0.5) * s;
  }
  R.camera.position.set(x + ox, y + oy, z);
  R.camera.lookAt(CAM.tx + ox * 0.5, 0.4, CAM.tz);
  setListener(CAM.tx, CAM.tz, CAM.yaw, CAM.dist);
}

// March the mouse ray down through tile tops, so cliffs and hills pick correctly
export function pickAt(cx, cy) {
  _ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  _ray.setFromCamera(_ndc, R.camera);
  const o = _ray.ray.origin, d = _ray.ray.direction;
  if (d.y > -1e-3) return -1;
  const t0 = (2.6 - o.y) / d.y, t1 = (0 - o.y) / d.y;
  const hlen = (t1 - t0) * Math.hypot(d.x, d.z);
  const steps = Math.max(4, Math.ceil(hlen / 0.15));
  for (let s = 0; s <= steps; s++) {
    const t = lerp(t0, t1, s / steps);
    const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    const i = tileAt(x, z);
    if (i < 0) continue;
    const top = isLand(W.type[i]) ? W.h[i] : 0;
    if (y <= top + 0.001) { mouse.wx = x; mouse.wz = z; return i; }
  }
  const x = o.x + d.x * t1, z = o.z + d.z * t1;
  mouse.wx = x; mouse.wz = z;
  return tileAt(x, z);
}

// ------------------------------------------------------------------ tools

export function setTool(tool) {
  G.tool = tool;
  mouse.roadStart = -1;
  mouse.roadPath = [];
  for (const k in R.ghosts) R.ghosts[k].visible = false;
  applyToolTint();
}

// Dim the tiles the current tool cannot use
export function applyToolTint() {
  const tool = G.tool;
  if (tool && tool.kind === 'build') {
    const type = tool.type;
    recolorTerrain((i) => (placeProblem(type, i) ? 0.5 : 1.04));
  } else if (tool && tool.kind === 'road') {
    recolorTerrain((i) => (roadProblem(i) && !W.road[i] ? 0.55 : 1.02));
  } else {
    recolorTerrain(null);
  }
}

function roadCost(j) {
  if (W.bld[j]) return 0;
  if (W.road[j]) return 0.4;
  return roadProblem(j) ? 0 : 1;
}

function planRoad(a, b) {
  if (a < 0 || b < 0) return [];
  if (a === b) return [a];
  if (roadCost(a) === 0 && !W.road[a]) return [a];
  const tx = W.x[b], tz = W.z[b];
  const p = findPath(a, (j) => roadCost(j), (j) => j === b, (j) => Math.hypot(W.x[j] - tx, W.z[j] - tz) / 1.732 * 0.4, 4000);
  return p || [a];
}

export function roadPreviewCost() {
  let n = 0;
  for (const i of mouse.roadPath) if (!W.road[i] && !roadProblem(i)) n++;
  return { tiles: n, gold: n * ROAD_COST.gold };
}

function commitRoad() {
  let placed = 0, failed = null;
  for (const i of mouse.roadPath) {
    if (W.road[i]) continue;
    const p = tryRoad(i);
    if (p) { failed = p; if (p.startsWith('Not enough')) break; } else { placed++; }
  }
  if (placed) { sfx('build'); FX.dust(W.x[mouse.roadPath[0]], W.h[mouse.roadPath[0]], W.z[mouse.roadPath[0]], 0.4); }
  if (failed && failed.startsWith('Not enough')) hooks.onError && hooks.onError(failed);
  mouse.roadPath = [];
  mouse.roadStart = -1;
  if (placed) applyToolTint();
}

function useToolAt(i) {
  const t = G.tool;
  if (!t) return;
  if (t.kind === 'build') {
    const p = tryPlace(t.type, i);
    if (p) { sfx('error'); hooks.onError && hooks.onError(p); return; }
    sfx('build');
    FX.dust(W.x[i], W.h[i], W.z[i], 1);
    hooks.onPlaced && hooks.onPlaced(t.type, i);
    if (BUILDINGS[t.type].unique) setTool(null);
    else applyToolTint();
  } else if (t.kind === 'bulldoze') {
    if (mouse.bulldozed.has(i)) return;
    mouse.bulldozed.add(i);
    const p = bulldoze(i);
    if (p) { if (mouse.bulldozed.size === 1 && p !== 'Nothing to clear') { sfx('error'); hooks.onError && hooks.onError(p); } return; }
    sfx('demolish');
    FX.dust(W.x[i], W.h[i], W.z[i], 1.2);
  }
}

function selectAt(i) {
  if (i < 0) { G.selected = null; hooks.onSelect && hooks.onSelect(null); return; }
  if (W.bld[i]) {
    const b = G.byId.get(W.bld[i]);
    G.selected = b || null;
  } else if (W.ruin[i]) {
    G.selected = { ruin: i };
  } else {
    G.selected = null;
  }
  if (G.selected) sfx('click');
  hooks.onSelect && hooks.onSelect(G.selected);
}

// ------------------------------------------------------------------ events

export function initInput(canvas) {
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('mouseenter', () => { mouse.over = true; });
  canvas.addEventListener('mouseleave', () => { mouse.over = false; mouse.tile = -1; });

  canvas.addEventListener('mousedown', (e) => {
    if (G.mode !== 'play') return;
    mouse.sx = e.clientX; mouse.sy = e.clientY; mouse.moved = 0;
    if (e.button === 0) {
      mouse.left = true;
      const i = pickAt(e.clientX, e.clientY);
      mouse.tile = i;
      const t = G.tool;
      if (t && t.kind === 'road') {
        mouse.roadStart = i;
        mouse.roadPath = i >= 0 ? planRoad(i, i) : [];
      } else if (t && t.kind === 'bulldoze') {
        mouse.bulldozed.clear();
        if (i >= 0) useToolAt(i);
      } else if (t && t.kind === 'build') {
        if (i >= 0) useToolAt(i);
      } else {
        selectAt(i);
      }
    } else if (e.button === 2) {
      mouse.right = true;
    } else if (e.button === 1) {
      mouse.middle = true;
      e.preventDefault();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0 && mouse.left) {
      mouse.left = false;
      if (G.tool && G.tool.kind === 'road' && mouse.roadStart >= 0) commitRoad();
      mouse.bulldozed.clear();
    } else if (e.button === 2 && mouse.right) {
      mouse.right = false;
      if (mouse.moved < 6 && G.mode === 'play') {
        if (G.tool) setTool(null);
        else if (G.selected) { G.selected = null; hooks.onSelect && hooks.onSelect(null); }
      }
    } else if (e.button === 1) {
      mouse.middle = false;
    }
  });

  window.addEventListener('mousemove', (e) => {
    const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (mouse.right || mouse.middle || mouse.left) mouse.moved += Math.abs(dx) + Math.abs(dy);
    if (G.mode !== 'play') return;
    if (mouse.right) {
      const wpp = (2 * CAM.dist * Math.tan((R.camera.fov * Math.PI) / 360)) / window.innerHeight;
      const c = Math.cos(CAM.g.yaw), s = Math.sin(CAM.g.yaw);
      CAM.g.tx -= (c * dx + s * dy * 1.4) * wpp;
      CAM.g.tz -= (-s * dx + c * dy * 1.4) * wpp;
    }
    if (mouse.middle) {
      CAM.g.yaw -= dx * 0.006;
      CAM.g.tilt += dy * 0.003;
    }
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (G.mode !== 'play') return;
    const old = CAM.g.dist;
    const f = Math.exp(Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120) * 0.0016);
    CAM.g.dist = clamp(old * f, MIN_D, MAX_D);
    if (CAM.g.dist < old) {
      pickAt(e.clientX, e.clientY);
      const k = 1 - CAM.g.dist / old;
      CAM.g.tx += (mouse.wx - CAM.g.tx) * k;
      CAM.g.tz += (mouse.wz - CAM.g.tz) * k;
    }
  }, { passive: false });

  window.addEventListener('keydown', (e) => { keys.add(e.code); });
  window.addEventListener('keyup', (e) => { keys.delete(e.code); });
  window.addEventListener('blur', () => { keys.clear(); mouse.left = mouse.right = mouse.middle = false; });
}

// Runs every frame: hover, drag tools, ghost preview
const _tint = new THREE.Color();
export function updatePointer() {
  const P = R.pools;
  if (G.mode !== 'play' || !mouse.over || mouse.right || mouse.middle) {
    if (!mouse.over) mouse.tile = -1;
  } else {
    mouse.tile = pickAt(mouse.x, mouse.y);
  }
  const i = mouse.tile;
  const t = G.tool;

  if (mouse.left && t) {
    if (t.kind === 'road' && mouse.roadStart >= 0 && i >= 0) mouse.roadPath = planRoad(mouse.roadStart, i);
    if (t.kind === 'bulldoze' && i >= 0) useToolAt(i);
  }

  // hover ring
  const showHover = i >= 0 && G.mode === 'play' && isLand(W.type[i]);
  R.hover.visible = showHover;
  if (showHover) {
    R.hover.position.set(W.x[i], W.h[i] + 0.03, W.z[i]);
    const bad = t && ((t.kind === 'build' && placeProblem(t.type, i)) || (t.kind === 'road' && roadProblem(i) && !W.road[i]));
    R.hover.material.color.setHex(t && t.kind === 'bulldoze' ? 0xff7a4a : bad ? 0xff5a4a : 0xffffff);
  }

  // build ghost
  for (const k in R.ghosts) R.ghosts[k].visible = false;
  R.rangeRing.visible = R.rangeFill.visible = false;
  if (t && t.kind === 'build' && i >= 0 && isLand(W.type[i])) {
    const g = R.ghosts[t.type];
    g.visible = true;
    g.scale.setScalar(1.12);
    g.position.set(W.x[i], W.h[i], W.z[i]);
    g.rotation.y = Math.PI / 6;
    if (t.type === 'dock') {
      for (let d = 0; d < 6; d++) {
        const j = W.nbr[i * 6 + d];
        if (j >= 0 && W.type[j] <= 1) { g.rotation.y = Math.atan2(W.x[j] - W.x[i], W.z[j] - W.z[i]); break; }
      }
    }
    const ok = !placeProblem(t.type, i) && canAfford(BUILDINGS[t.type].cost);
    R.ghostMat.color.setHex(ok ? 0xc8ffd0 : 0xff9a8a);
    R.ghostMat.emissive.setHex(ok ? 0x1d5a26 : 0x6a1a12);
    const def = BUILDINGS[t.type];
    const rr = def.weapon ? def.weapon.range * G.mod.range : def.radius || (def.guard || 0);
    if (rr) showRange(W.x[i], W.h[i], W.z[i], rr, def.weapon ? 0xffffff : 0x9fd8ff);
  }

  // road preview
  P.ghostRoad.begin();
  if (t && t.kind === 'road') {
    const path = mouse.roadPath.length ? mouse.roadPath : (i >= 0 ? [i] : []);
    let gold = G.res.gold;
    for (const j of path) {
      if (W.road[j]) continue;
      const bad = roadProblem(j);
      const afford = !bad && gold >= ROAD_COST.gold;
      if (afford) gold -= ROAD_COST.gold;
      _tint.setHex(bad ? 0xff4a3a : afford ? 0x9dffb0 : 0xffb04a);
      P.ghostRoad.put(W.x[j], (isLand(W.type[j]) ? W.h[j] : 0) + 0.04, W.z[j], 0, 0.95, 1, 0.95, _tint.r, _tint.g, _tint.b);
    }
  }
  P.ghostRoad.end();

  // selection ring and range
  const s = G.selected;
  R.select.visible = false;
  if (s) {
    const tile = s.ruin != null ? s.ruin : s.tile;
    if (s.ruin == null && !s.alive) { G.selected = null; hooks.onSelect && hooks.onSelect(null); }
    else {
      R.select.visible = true;
      R.select.position.set(W.x[tile], W.h[tile] + 0.04, W.z[tile]);
      if (!(t && t.kind === 'build') && s.def) {
        const rr = s.ws ? s.ws.range : s.def.radius || s.def.guard || 0;
        if (rr) showRange(s.x, s.y, s.z, rr, s.ws ? 0xffe27a : 0x9fd8ff);
      }
    }
  }
}

function showRange(x, y, z, r, col) {
  R.rangeRing.visible = R.rangeFill.visible = true;
  R.rangeRing.position.set(x, y + 0.06, z);
  R.rangeFill.position.set(x, y + 0.05, z);
  R.rangeRing.scale.setScalar(r);
  R.rangeFill.scale.setScalar(r);
  R.rangeRing.material.color.setHex(col);
  R.rangeFill.material.color.setHex(col);
}
