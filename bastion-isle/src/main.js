import * as THREE from 'three';
import { R, initRenderer, rebuildTerrain, rebuildDecor, rebuildRoads, buildWaterTexture, makeThumbnails } from './render.js';
import { initFx, flushFx, clearFx } from './fx.js';
import * as FX from './fx.js';
import { G, SETTINGS } from './state.js';
import { W } from './world.js';
import { BUILDINGS } from './defs.js';
import {
  newGame, loadGame, econTick, recomputeConnectivity, deleteSave, rememberForests, removeBuilding,
  tryPlace, tryRoad, addBuilding, placeProblem, roadProblem,
} from './game.js';
import { genWave, updateCombat, shake, spawnEnemy, spawnInfantry } from './combat.js';
import { initInput, updateCamera, updatePointer, CAM, setTool, applyToolTint, focus } from './input.js';
import { initUI, setThumbs, updateHUD, showMainMenu, showHUD, showGameOver, showVictory, openHelp, openSettings, toggleFullscreen, UI } from './ui.js';
import { initAudio, sfx } from './audio.js';

// ------------------------------------------------------------------ boot

const canvas = document.getElementById('view');
try {
  initRenderer(canvas);
} catch (err) {
  document.getElementById('ui').innerHTML = `<div class="fatal"><h1>Bastion Isle needs WebGL</h1><p>Your browser could not start 3D graphics. Make sure hardware acceleration is turned on in your browser settings, then reload.</p><pre>${String(err && err.message || err)}</pre></div>`;
  throw err;
}
initFx();
initInput(canvas);
initUI({
  newGame: () => startGame(false),
  continue: () => startGame(true),
  reroll: () => { menuSeed = randomSeed(); showIsland(menuSeed); showMainMenu(menuSeed); },
  help: () => openHelp(false),
  settings: () => openSettings(false),
  quit: () => toMenu(),
  fullscreen: () => toggleFullscreen(),
  msaaAtStart: SETTINGS.msaa,
});
UI.perf = !!SETTINGS.showFps;
setThumbs(makeThumbnails(Object.keys(BUILDINGS)));

// unlock audio on the first interaction (browsers require a gesture)
const unlock = () => { initAudio(); };
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

let menuSeed = randomSeed();
function randomSeed() { return 1 + Math.floor(Math.random() * 999999); }

function refreshWorldVisuals() {
  rebuildTerrain();
  buildWaterTexture();
  rebuildDecor();
  rebuildRoads();
  clearFx();
  for (const k in G.dirty) G.dirty[k] = false;
  G.dirty.connect = true;
}

function showIsland(seed) {
  G.mode = 'menu';
  newGame(seed, genWave);
  rememberForests();
  refreshWorldVisuals();
  CAM.orbit = true;
  CAM.g.tx = 0; CAM.g.tz = 0; CAM.g.dist = 62; CAM.g.tilt = 0.05;
}

function startGame(fromSave) {
  setTool(null);
  if (fromSave) {
    if (!loadGame()) { startGame(false); return; }
    menuSeed = G.seed;
  } else {
    newGame(menuSeed, genWave);
    rememberForests();
  }
  refreshWorldVisuals();
  G.mode = 'play';
  CAM.orbit = false;
  CAM.g.yaw = Math.round(CAM.g.yaw / (Math.PI * 2)) * Math.PI * 2;
  focus(G.hq.x, G.hq.z + 4, 30);
  CAM.g.tilt = 0;
  showHUD();
  sfx('click');
}

function toMenu() {
  setTool(null);
  G.selected = null;
  menuSeed = randomSeed();
  showIsland(menuSeed);
  showMainMenu(menuSeed);
}

G.onHQDestroyed = () => {
  const b = G.hq;
  G.mode = 'over';
  setTool(null);
  FX.explosion(b.x, b.y + 0.6, b.z, 3);
  FX.explosion(b.x + 0.5, b.y + 0.3, b.z - 0.4, 2);
  sfx('boomBig', b.x, b.z);
  shake(b.x, b.z, 1);
  removeBuilding(b, true);
  deleteSave();
  focus(b.x, b.z, 26);
  setTimeout(() => showGameOver(), 2600);
};
G.onVictory = () => showVictory();
G.onBuildingDestroyed = (b) => {
  FX.explosion(b.x, b.y + 0.4, b.z, 1.5);
  FX.dust(b.x, b.y, b.z, 1.5);
  sfx('boomBig', b.x, b.z);
  shake(b.x, b.z, 0.35);
};

// Draw one frame with every instanced pool, ghost, overlay and particle system populated (out of sight under
// the sea), so all shader programs, including the shadow-pass variants, are built now rather than mid-battle.
function warmUp() {
  R.renderer.debug.checkShaderErrors = false;
  const P = R.pools;
  for (const k in P) { P[k].begin(); P[k].put(0, -40, 0); P[k].end(); }
  R.hb.begin(); R.hb.bar(0, -40, 0, 0.5); R.hb.end();
  for (const k in R.ghosts) { R.ghosts[k].visible = true; R.ghosts[k].position.set(0, -40, 0); }
  for (const o of [R.hover, R.select, R.rangeRing, R.rangeFill]) { o.visible = true; o.position.set(0, -40, 0); }
  FX.explosion(0, -40, 0, 1, true);
  FX.flushFx();
  R.post.render(0);
  for (const k in P) { P[k].begin(); P[k].end(); }
  R.hb.begin(); R.hb.end();
  for (const k in R.ghosts) R.ghosts[k].visible = false;
  for (const o of [R.hover, R.select, R.rangeRing, R.rangeFill]) o.visible = false;
}
warmUp();
showIsland(menuSeed);
showMainMenu(menuSeed);

// ------------------------------------------------------------------ simulation

function simulate(dt) {
  G.time += dt;
  if (G.mode === 'play') {
    G.econT += dt;
    while (G.econT >= 1) { G.econT -= 1; econTick(); }
  }
  updateCombat(dt);
}

function syncWorld() {
  if (G.dirty.connect) { recomputeConnectivity(); G.dirty.connect = false; G.dirty.roads = true; }
  if (G.dirty.roads) { rebuildRoads(); G.dirty.roads = false; }
  if (G.dirty.trees) { rebuildDecor(); G.dirty.trees = false; }
  if (G.dirty.terrainColors) { applyToolTint(); G.dirty.terrainColors = false; }
}

// ------------------------------------------------------------------ entities -> GPU instances

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const HEAD_TYPES = { mg: 1, coastal: 1, flak: 1, missile: 1, radar: 1 };
const BPOOLS = [...Object.keys(BUILDINGS).map((k) => 'b_' + k), 'b_house2', ...Object.keys(HEAD_TYPES).map((k) => 'h_' + k)];
const UPOOLS = ['u_gunboat', 'u_landing', 'u_destroyer', 'u_battleship', 'u_fighter', 'u_bomber', 'u_jet', 'u_infantry', 'u_soldier', 'u_ally_fighter'];
const ruinsList = [];
let ruinsVersion = -1;

function putOriented(pool, x, y, z, pitch, yaw, roll, s, r, g, b) {
  _e.set(pitch, yaw, roll, 'YXZ');
  _q.setFromEuler(_e);
  _m.compose(_p.set(x, y, z), _q, _s.set(s, s, s));
  pool.putMatrix(_m, r, g, b);
}

// buildings are drawn a touch larger than their models so they read well at strategy-camera distances
const BSCALE = 1.12;
const easeOutBack = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

function syncEntities() {
  const P = R.pools, hb = R.hb, time = G.time;
  for (const k of BPOOLS) P[k].begin();
  for (const k of UPOOLS) P[k].begin();
  P.marker.begin(); P.rubble.begin(); P.arrow.begin();
  P.shell.begin(); P.bomb.begin(); P.missileP.begin(); P.rocketP.begin(); P.tracer.begin();
  hb.begin();

  for (const b of G.buildings) {
    const age = time - b.born;
    const sy = age < 0.45 ? Math.max(0.02, easeOutBack(Math.max(0, age / 0.45))) : 1;
    let r = 1, g = 1, bl = 1;
    if (b.level === 2) { r = 1.05; g = 1.0; bl = 0.88; } else if (b.level >= 3) { r = 1.1; g = 0.98; bl = 0.74; }
    if (!b.connected) { r *= 0.72; g *= 0.72; bl *= 0.78; }
    if (b.flash > 0) { const f = b.flash; r += f * 0.8; g *= 1 - 0.6 * f; bl *= 1 - 0.6 * f; }
    const key = b.type === 'house' && b.level >= 2 ? 'b_house2' : 'b_' + b.type;
    P[key].put(b.x, b.y, b.z, b.yaw, BSCALE, sy * BSCALE, BSCALE, r, g, bl);
    if (HEAD_TYPES[b.type]) {
      const hs = (1 + 0.08 * (b.level - 1)) * BSCALE;
      const hy = (b.def.weapon && b.def.weapon.headY) || b.def.headY || 0;
      P['h_' + b.type].put(b.x, b.y + hy * sy * BSCALE, b.z, b.headYaw, hs, hs * sy, hs, r, g, bl);
    }
    if (!b.connected && b.type !== 'hq') P.marker.put(b.x, b.y + 1.05 + Math.sin(time * 3 + b.id) * 0.08, b.z, time * 1.4 + b.id);
    if (b.hp < b.maxHp - 0.5) hb.bar(b.x, b.y + (b.type === 'hq' ? 2.0 : 1.25), b.z, b.hp / b.maxHp, b.type === 'hq' ? 1.6 : 1);
  }

  if (ruinsVersion !== W.version) {
    ruinsVersion = W.version;
    ruinsList.length = 0;
    for (let i = 0; i < W.count; i++) if (W.ruin[i]) ruinsList.push(i);
  }
  for (const i of ruinsList) if (W.ruin[i]) P.rubble.put(W.x[i], W.h[i], W.z[i], i * 1.7);

  for (const e of G.enemies) {
    if (e.gone) continue;
    const hit = e.hitT > 0 ? 1 : 0;
    const r = 1 + hit * 0.8, g = 1 - hit * 0.5, b = 1 - hit * 0.5;
    const pool = P['u_' + e.type];
    if (e.domain === 'ground') pool.put(e.x, e.y, e.z, e.yaw, 1, 1, 1, r, g, b);
    else putOriented(pool, e.x, e.y, e.z, e.pitch, e.yaw, e.bank, 1, r, g, b);
    if (e.alive && e.hp < e.maxHp) {
      const rad = e.def.radius || 0.4;
      hb.bar(e.x, e.y + (e.domain === 'air' ? 0.6 : e.domain === 'sea' ? 0.7 + rad * 0.5 : 0.55), e.z, -e.hp / e.maxHp, 0.55 + rad * 0.5);
    }
  }
  for (const a of G.allies) {
    if (a.gone) continue;
    const hit = a.hitT > 0 ? 1 : 0;
    const r = 1 + hit * 0.8, g = 1 - hit * 0.5, b = 1 - hit * 0.5;
    if (a.type === 'soldier') P.u_soldier.put(a.x, a.y, a.z, a.yaw, 1, 1, 1, r, g, b);
    else putOriented(P.u_ally_fighter, a.x, a.y, a.z, a.pitch, a.yaw, a.bank, a.state === 'parked' ? 0.85 : 1, r, g, b);
    if (a.alive && a.hp < a.maxHp && a.state !== 'parked') hb.bar(a.x, a.y + 0.5, a.z, a.hp / a.maxHp, 0.6);
  }

  for (const p of G.projectiles) {
    switch (p.kind) {
      case 'shell': {
        const s = 1 + Math.min(1.2, p.splash * 0.3);
        if (p.team === 'E') P.shell.put(p.x, p.y, p.z, 0, s, s, s, 1.6, 0.55, 0.25);
        else P.shell.put(p.x, p.y, p.z, 0, s, s, s, 1.6, 1.3, 0.6);
        break;
      }
      case 'flak': P.shell.put(p.x, p.y, p.z, 0, 0.8, 0.8, 0.8, 1.5, 1.2, 0.6); break;
      case 'bomb': putOriented(P.bomb, p.x, p.y, p.z, -Math.atan2(p.vy, Math.hypot(p.vx, p.vz)), Math.atan2(p.vx, p.vz), 0, 1.2, 1, 1, 1); break;
      case 'missile': putOriented(P.missileP, p.x, p.y, p.z, -Math.atan2(p.vy, Math.hypot(p.vx, p.vz)), Math.atan2(p.vx, p.vz), 0, 1, 1, 1, 1); break;
      case 'rocket': {
        const dx = p.ex - p.sx, dy = p.ey - p.sy, dz = p.ez - p.sz;
        putOriented(P.rocketP, p.x, p.y, p.z, -Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 0.8, 1, 1, 1);
        break;
      }
      case 'tracer': {
        const dx = p.ex - p.sx, dy = p.ey - p.sy, dz = p.ez - p.sz;
        const L = Math.hypot(dx, dy, dz) || 1;
        const k = Math.min(1, p.t / p.T);
        const len = Math.min(1.1, L * 0.4);
        const k0 = Math.max(0, k - len / L);
        _e.set(-Math.asin(dy / L), Math.atan2(dx, dz), 0, 'YXZ');
        _q.setFromEuler(_e);
        _m.compose(_p.set(p.sx + dx * k0, p.sy + dy * k0, p.sz + dz * k0), _q, _s.set(0.035, 0.035, (k - k0) * L + 0.02));
        if (p.enemy) P.tracer.putMatrix(_m, 1.0, 0.45, 0.3);
        else P.tracer.putMatrix(_m, 1.0, 0.9, 0.5);
        break;
      }
    }
  }

  // raid warnings on the sea
  const w = G.wave;
  if (G.mode === 'play' && w.state === 'prep' && w.plan) {
    const radar = G.buildings.some((b) => b.type === 'radar' && b.connected);
    if (radar || w.timer < 25) {
      const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 180);
      for (const a of w.plan.dirs) {
        const rr = 34 + Math.sin(performance.now() / 400) * 0.8;
        P.arrow.put(Math.sin(a) * rr, 0.08, Math.cos(a) * rr, a + Math.PI, 1.6, 1, 1.6, pulse * 1.2, pulse * 0.25, pulse * 0.2);
      }
    }
  }

  for (const k of BPOOLS) P[k].end();
  for (const k of UPOOLS) P[k].end();
  P.marker.end(); P.rubble.end(); P.arrow.end();
  P.shell.end(); P.bomb.end(); P.missileP.end(); P.rocketP.end(); P.tracer.end();
  hb.end();
}

// ------------------------------------------------------------------ loop

let last = performance.now();
const frameTimes = new Float32Array(180);
let ftIdx = 0, perfT = 0, perfText = '', updAcc = 0, glAcc = 0, cpuN = 0;
const PERF = { fps: 0, avg: 0, worst: 0, upd: 0, gl: 0 };

function perfReport(rdt, upd, gl) {
  frameTimes[ftIdx] = rdt * 1000;
  ftIdx = (ftIdx + 1) % frameTimes.length;
  updAcc += upd; glAcc += gl; cpuN++;
  perfT -= rdt;
  if (perfT > 0) return;
  perfT = 0.5;
  let sum = 0, worst = 0, n = 0;
  for (let i = 0; i < frameTimes.length; i++) { const v = frameTimes[i]; if (v > 0) { sum += v; n++; if (v > worst) worst = v; } }
  const avg = sum / Math.max(1, n);
  const info = R.renderer.info.render;
  PERF.fps = 1000 / avg; PERF.avg = avg; PERF.worst = worst; PERF.upd = updAcc / cpuN; PERF.gl = glAcc / cpuN;
  perfText = `<b>${PERF.fps.toFixed(0)}</b> fps · ${avg.toFixed(2)} ms · worst ${worst.toFixed(1)} ms<br>game ${PERF.upd.toFixed(2)} ms · draw ${PERF.gl.toFixed(2)} ms (CPU)<br>${R.width}×${R.height} · ${info.calls} draws · ${(info.triangles / 1000).toFixed(0)}k tris<br>${G.enemies.length} enemies · ${G.allies.length} allies · ${G.projectiles.length} shots`;
  updAcc = 0; glAcc = 0; cpuN = 0;
}

function frame(now) {
  requestAnimationFrame(frame);
  let rdt = (now - last) / 1000;
  last = now;
  if (rdt > 0.25) rdt = 0.25;
  if (rdt <= 0) rdt = 1 / 1000;
  const t0 = performance.now();

  if (G.mode === 'play' || G.mode === 'over') {
    let rem = G.paused ? 0 : Math.min(rdt * G.speed, 0.3);
    while (rem > 1e-6) {
      const step = Math.min(rem, 1 / 30);
      simulate(step);
      rem -= step;
    }
  }
  syncWorld();
  updateCamera(rdt);
  updatePointer();
  syncEntities();
  R.water.material.userData.uniforms.uTime.value = now / 1000;
  if (G.mode === 'play' && !G.paused && SETTINGS.dayNight !== false) G.tod = ((G.tod ?? 0.36) + (rdt * G.speed) / (SETTINGS.dayLength || 600)) % 1;
  R.light.update(SETTINGS.dayNight === false ? 0.4 : (G.tod ?? 0.36));
  R.water.material.userData.uniforms.uNight.value = R.light.night;
  R.light.fitShadow(CAM.tx, CAM.tz, CAM.dist);
  flushFx();
  const t1 = performance.now();
  R.renderer.info.reset();
  R.post.render(rdt);
  const t2 = performance.now();
  updateHUD(rdt, perfText);
  perfReport(rdt, t1 - t0 + (performance.now() - t2), t2 - t1);
}
requestAnimationFrame(frame);

// for debugging and automated tests from the console
window.__bastion = {
  G, W, R, CAM, PERF,
  game: { tryPlace, tryRoad, addBuilding, placeProblem, roadProblem, recomputeConnectivity },
  combat: { spawnEnemy, spawnInfantry, genWave },
  // run the simulation without rendering: n steps of dt seconds
  step(n, dt = 1 / 30) {
    let worst = 0;
    const t0 = performance.now();
    const ph = this.phases || (this.phases = { sim: 0, world: 0, ents: 0, fx: 0 });
    for (let i = 0; i < n && G.mode === 'play'; i++) {
      const a = performance.now();
      simulate(dt);
      const b = performance.now();
      syncWorld();
      const c = performance.now();
      syncEntities();
      const d = performance.now();
      flushFx();
      const e = performance.now();
      ph.sim = Math.max(ph.sim, b - a); ph.world = Math.max(ph.world, c - b); ph.ents = Math.max(ph.ents, d - c); ph.fx = Math.max(ph.fx, e - d);
      const hist = this.hist || (this.hist = { n: 0, over1: 0, over2: 0, over4: 0, worldOver1: 0 });
      hist.n++; if (e - a > 1) hist.over1++; if (e - a > 2) hist.over2++; if (e - a > 4) hist.over4++; if (c - b > 1) hist.worldOver1++;
      worst = Math.max(worst, e - a);
    }
    return { ms: (performance.now() - t0) / n, worst };
  },
};
