// UI demo: the real HUD (src/ui, src/input.js, style.css) over the gfx harness scene, driven by a mock G and stub
// sim/gfx APIs. Build: node tests/ui/build.mjs <outdir>; shoot: node tests/ui/shoot.cjs <url> <outdir>.
// URL params: ?no3d=1 (skip WebGL), ?scene=hud|lot|raid|budget|research|menu|report|settings|help|pause|over|victory|log
import * as THREE from 'three';
import { H } from '../../gfx/harness.js';
import { G, SETTINGS, notify, MSG } from '../../../src/state.js';
import { W, T, LF, CV, isLand, isWater, generateWorld } from '../../../src/world.js';
import { BUILDINGS, ZONES, ENEMIES, ROADS, MILESTONES, computeMods } from '../../../src/defs.js';
import { markLot } from '../../../src/sim/core.js';
import { U } from '../../../src/gfx/uniforms.js';
import { initInput, updateCamera, updatePointer, focus, snapCamera, CAM, setTool, selectAt, project, mouse } from '../../../src/input.js';
import { initUI, uiFrame, forceRefresh, showHUD, showMainMenu, openSheet, closeSheet, showWaveReport, openSettings, openHelp, openPause, closePause, showGameOver, showVictory, setView, UI } from '../../../src/ui/index.js';
import { openDrawer, closeDrawer, pickBuilding } from '../../../src/ui/hud.js';
import { hideScreen } from '../../../src/ui/menus.js';
import { clearLog } from '../../../src/ui/log.js';
import { IV } from '../../../src/ui/infoviews.js';

const q = new URLSearchParams(location.search);
const NO3D = q.has('no3d');
document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="style.css">');
if (!document.getElementById('ui')) document.body.insertAdjacentHTML('beforeend', '<div id="ui"></div>');

// ------------------------------------------------------------------ world + 3D

let camera, renderer, land = null, baseCols = null;
if (!NO3D) {
  await H.init({ seed: 7, city: true });
  renderer = H.renderer; camera = H.camera;
  renderer.setPixelRatio(+(q.get('pr') || 0.5));
  dispatchEvent(new Event('resize'));
  const g = H.basicGround();
  land = g.land;
  baseCols = new Float32Array(land.instanceColor.array);
  // SwiftShader is slow: draw the 3D scene only for a few frames after a scene change; the canvas keeps the last one
  const render = H.post.render.bind(H.post);
  H.post.render = (dt) => { if (H.budget3d > 0) { H.budget3d--; render(dt); } };
  H.budget3d = 4;
} else {
  generateWorld(7);
  H.fakeCity(7);
  camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.5, 2600);
  document.body.style.cssText = 'margin:0;background:linear-gradient(180deg,#6d8aa6 0%,#9db3c4 38%,#3d6f86 39%,#1d4f68 100%)';
}

// ------------------------------------------------------------------ mock G

const B = (type, tile, level = 1, extra = {}) => {
  const def = BUILDINGS[type];
  if (W.bld[tile]) return null;
  W.zone[tile] = 0; W.lvl[tile] = 0; W.road[tile] = 0;
  const L = level - 1;
  const hp = Math.round(def.hp * (1 + 0.3 * L));
  const b = {
    id: G.nextId++, type, def, tile, x: W.x[tile], y: W.h[tile], z: W.z[tile], level, hp, maxHp: hp, alive: true, connected: true, powered: true,
    kills: 0, dmgDealt: 0, targetMode: def.targetMode || 'first', domainPref: def.domainPref || 'any', invested: def.cost || 0, born: -500, units: [],
    upkeep: (def.upkeep || 0) * (1 + 0.5 * L), lastHit: -99,
    ws: def.weapon ? { dmg: def.weapon.dmg * (1 + 0.35 * L), range: def.weapon.range * (1 + 0.08 * L), rate: def.weapon.rate * (1 + 0.1 * L), splash: def.weapon.splash || 0 } : null,
    ...extra,
  };
  W.bld[tile] = b.id; G.buildings.push(b); G.byId.set(b.id, b);
  if (type === 'hq') G.hq = b;
  return b;
};
const dist = (i, j) => Math.hypot(W.x[i] - W.x[j], W.z[i] - W.z[j]);
function freeTileNear(x, z, pred = () => true) {
  let best = -1, bd = 1e9;
  for (const i of W.land) {
    if (W.bld[i] || W.type[i] === T.MOUNTAIN || !pred(i)) continue;
    const d = Math.hypot(W.x[i] - x, W.z[i] - z);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

let pristine = null;
function setupG() {
  if (!pristine) pristine = { zone: W.zone.slice(), lvl: W.lvl.slice(), road: W.road.slice() };
  else { W.zone.set(pristine.zone); W.lvl.set(pristine.lvl); W.road.set(pristine.road); }
  Object.assign(G, {
    mode: 'play', time: 1460, speed: 1, paused: false, seed: 7, difficulty: 'standard', tod: 0.62,
    money: 48230, netPerMin: 1240, moneyHist: [21000, 23500, 26800, 25100, 29900, 33400, 31200, 37800, 42600, 45900], taxes: { R: 11, C: 10, I: 12 },
    budget: { income: { R: 2210, C: 1180, I: 860, spoils: 640 }, expense: { roads: 318, power: 300, water: 120, fire: 250, police: 220, health: 200, education: 200, parks: 80, military: 1110, repairs: 60 } },
    overdraftT: 0, negT: 0, pop: 1384, workers: 692, jobs: { gov: 118, C: 336, I: 268 }, staffing: 0.82, unemployment: 0.06,
    demand: { R: 46, C: -12, I: 28 }, panic: 0, blockade: false,
    demandTerms: {
      R: [{ label: 'Small-town pull', value: 15.2 }, { label: 'Jobs vs workers', value: 38.5 }, { label: 'Residential tax 11%', value: -4 }, { label: 'Panic after raid', value: -3.7 }],
      C: [{ label: 'Shoppers vs shop jobs', value: -12 }, { label: 'Commercial tax 10%', value: 0 }],
      I: [{ label: 'Goods needed vs industry jobs', value: 36 }, { label: 'Industrial tax 12%', value: -8 }],
    },
    power: { supply: 120, demand: 110 }, water: { supply: 55, demand: 40 },
    milestone: 2, threat: 1.12, buildings: [], byId: new Map(), nextId: 1, hq: null, enemies: [], allies: [], projectiles: [], trucks: [], fires: 3,
    research: { ballistics: 1, optics: 1, sirens: 1 }, stats: { kills: 214, built: 61, lost: 4, lotsLost: 19, waves: 6, firesStarted: 22, firesOut: 18 },
    victory: false, hints: {}, selected: null, tool: null, infoView: null,
  });
  G.mod = computeMods(G.research);
  G.wave = { n: 7, state: 'prep', timer: 102, elapsed: 0, current: 6, total: 0, queue: [], report: null,
    plan: { n: 7, counts: { gunboat: 4, landing: 2, destroyer: 1, fighter: 3 }, dirs: [0.75, 2.45] } };
  W.bld.fill(0);
  B('hq', W.center, 2);
  // services in the centre
  const cx = W.x[W.center], cz = W.z[W.center];
  for (const [t, dx, dz] of [['fire', 4, -3], ['police', -5, 2], ['clinic', 2, 6], ['school', -3, -6], ['park', 7, 3], ['college', -8, -4], ['wind', 14, -10], ['wind', 16, -8], ['watertower', -12, 8], ['gas', -16, -12]]) {
    const i = freeTileNear(cx + dx, cz + dz, (j) => !W.road[j]);
    if (i >= 0) B(t, i, t === 'clinic' ? 1 : 1);
  }
  // defences on the coast
  const coast = W.coast.slice();
  const pickCoast = (ang, used) => {
    let best = -1, bd = 1e9;
    for (const i of coast) {
      if (W.bld[i]) continue;
      const a = Math.atan2(W.x[i], W.z[i]);
      let d = Math.abs(a - ang); d = Math.min(d, Math.PI * 2 - d);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  const defs = [['coastal', 0.6, 2], ['coastal', 2.3, 1], ['mg', 0.95, 2], ['mg', 3.4, 1], ['flak', 1.6, 1], ['flak', -0.9, 2], ['coastal', -2.2, 1], ['barracks', 2.9, 1], ['radar', -1.6, 1]];
  for (const [t, a, l] of defs) { const i = pickCoast(a); if (i >= 0) B(t, i, l, { kills: Math.floor(10 + Math.random() * 40), dmgDealt: Math.floor(2000 + Math.random() * 9000) }); }
  for (const b of G.buildings) if (b.type === 'coastal' && b.level === 2) { b.kills = 37; b.dmgDealt = 12840; b.hp = Math.round(b.maxHp * 0.74); }
  // a few lots with problems for the inspector, land value field, pollution, coverage
  for (const i of W.land) {
    if (!W.zone[i]) continue;
    const d = Math.hypot(W.x[i] - cx, W.z[i] - cz);
    W.lv[i] = Math.max(5, Math.min(95, Math.round(70 - d * 2.2 + (W.coast.includes(i) ? 12 : 0) + ((i * 37) % 17))));
    W.prog[i] = (i * 13) % 90;
    W.cover[i] = (d < 14 ? CV.FIRE : 0) | (d < 12 ? CV.POLICE : 0) | (d < 9 ? CV.HEALTH : 0) | (d < 11 ? CV.SCHOOL : 0);
    W.flags[i] |= LF.POWER | LF.WATER | LF.ROAD;
    if (W.zone[i] === 3) for (let k = 0; k < 6; k++) { const j = W.nbr[i * 6 + k]; if (j >= 0) W.poll[j] = Math.min(60, W.poll[j] + 14); }
  }
  let nFire = 0;
  for (const i of W.land) { if (W.fire[i] && nFire < 3) nFire++; else W.fire[i] = 0; }
  W.lotVersion++;
}

// ------------------------------------------------------------------ stub sim API

let ruins = 2;
const sim = {
  isUnlocked: (t) => (BUILDINGS[t].unlock || 0) <= G.milestone,
  placeProblem: (type, i) => {
    if (i < 0 || !isLand(W.type[i])) return 'Must be built on land';
    if (W.type[i] === T.MOUNTAIN) return 'Too steep to build';
    if (W.bld[i]) return 'Something is already here';
    if (W.road[i]) return 'Cannot build on a road';
    if (BUILDINGS[type].coastal && !W.coast.includes(i)) return 'Must touch the sea';
    return null;
  },
  roadProblem: (i) => (i < 0 || !isLand(W.type[i]) ? 'Roads need dry land' : W.type[i] === T.MOUNTAIN ? 'Too steep for a road' : W.bld[i] ? 'A building is in the way' : null),
  tryPlace: (type, i) => { const p = sim.placeProblem(type, i); if (p) return p; if (G.money < BUILDINGS[type].cost) return 'Not enough money'; G.money -= BUILDINGS[type].cost; B(type, i); return null; },
  tryRoad: (i) => { const p = sim.roadProblem(i); if (p) return p; G.money -= ROADS.cost; W.road[i] = 1; W.conn[i] = 1; W.version++; return null; },
  zonePaint: (tiles, z) => { for (const i of tiles) { W.zone[i] = z; markLot(i); } return tiles.length; },
  dezone: (tiles) => { for (const i of tiles) { W.zone[i] = 0; markLot(i); } },
  bulldoze: (i) => (W.bld[i] || W.road[i] ? null : 'Nothing to clear'),
  upgrade: (b) => { const c = b.def.upgradeCost && b.level < (b.def.maxLevel || 1) ? b.def.upgradeCost(b.level) : null; if (c == null) return 'Already at the top level'; if (c > G.money) return 'Not enough money'; G.money -= c; b.level++; return null; },
  sell: (b) => { G.money += Math.floor(b.invested * 0.75); W.bld[b.tile] = 0; b.alive = false; G.buildings.splice(G.buildings.indexOf(b), 1); return null; },
  setTargetMode: (b, m, d) => { b.targetMode = m; b.domainPref = d; },
  buyResearch: (id) => { G.research[id] = (G.research[id] || 0) + 1; return null; },
  callWaveEarly: () => { const v = Math.floor(G.wave.timer * 20); G.money += v; G.wave.timer = 0; return v; },
  landValueBreakdown: (i) => [
    { label: 'Base', value: 20 }, { label: 'Sea view (coast within 2)', value: W.coast.includes(i) ? 8 : 4 }, { label: 'Park within 2', value: 15 },
    { label: 'Police coverage', value: W.cover[i] & CV.POLICE ? 6 : 0 }, { label: 'Fire coverage', value: W.cover[i] & CV.FIRE ? 6 : 0 },
    { label: 'Inside flak range', value: 6 }, { label: 'Pollution', value: -W.poll[i] }, { label: 'Coastal gun noise', value: -12 },
  ].filter((t) => t.value),
  missingRequirements: () => [],
  budgetBreakdown: () => ({
    income: [{ key: 'R', label: 'Residential', value: 2210 }, { key: 'C', label: 'Commercial', value: 1180 }, { key: 'I', label: 'Industrial', value: 860 }, { key: 'spoils', label: 'War spoils (3 min avg)', value: 640 }],
    expense: Object.entries(G.budget.expense).map(([k, v]) => ({ key: k, value: v })),
    net: G.netPerMin,
  }),
  hasSave: () => true, saveGame: () => true,
  ruinsCost: () => ruins * 2400, rebuildAllRuins: () => { ruins = 0; return null; },
  enemiesAlive: () => G.enemies.filter((e) => e.alive).length,
};

// ------------------------------------------------------------------ stub gfx API (draws into the harness scene)

const _c = new THREE.Color(), _o = new THREE.Color(), _g = new THREE.Color(0xd8d4cc);
let lastRGBA = null;
function tint(rgba) {
  lastRGBA = rgba;
  if (!land) return;
  const arr = land.instanceColor.array;
  const clay = U.uClay.value > 0.5 || (G.infoView && IV.clay);
  W.land.forEach((i, k) => {
    _c.setRGB(baseCols[k * 3], baseCols[k * 3 + 1], baseCols[k * 3 + 2]);
    if (clay) _c.lerp(_g.setHex(0x9a9890).convertSRGBToLinear(), 0.8);
    if (rgba && rgba[i * 4 + 3]) { _o.setRGB(rgba[i * 4] / 255, rgba[i * 4 + 1] / 255, rgba[i * 4 + 2] / 255).convertSRGBToLinear(); _c.lerp(_o, Math.min(1, (rgba[i * 4 + 3] / 255) * 1.1)); }
    arr[k * 3] = _c.r; arr[k * 3 + 1] = _c.g; arr[k * 3 + 2] = _c.b;
  });
  land.instanceColor.needsUpdate = true;
}
const ringObjs = [];
function setRings(list) {
  if (NO3D) return;
  while (ringObjs.length < 8) {
    const g = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, k) => new THREE.Vector3(Math.cos((k / 96) * Math.PI * 2), 0, Math.sin((k / 96) * Math.PI * 2))));
    const m = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false }));
    m.visible = false; m.renderOrder = 10; H.scene.add(m); ringObjs.push(m);
  }
  ringObjs.forEach((o, k) => {
    const r = list[k];
    o.visible = !!r;
    if (r) { o.position.set(r.x, 0.9, r.z); o.scale.setScalar(r.r); o.material.color.setHex(r.color != null ? r.color : 0xffffff); }
  });
}
let ghost = null;
function setGhost(type, x, y, z, yaw, ok) {
  if (NO3D) return;
  if (!ghost) { ghost = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.9, 6), new THREE.MeshStandardMaterial({ color: 0x9dffb0, transparent: true, opacity: 0.6 })); H.scene.add(ghost); }
  ghost.visible = !!type;
  if (type) { ghost.position.set(x, y + 0.45, z); ghost.material.color.setHex(ok ? 0x9dffb0 : 0xff8a7a); }
}

// simple blocks so the scene reads as a town in screenshots (not part of the game)
function addBlocks() {
  if (NO3D) return;
  const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const lots = W.land.filter((i) => W.zone[i] && W.lvl[i]);
  const m = new THREE.InstancedMesh(geo, mat, lots.length + G.buildings.length);
  const mx = new THREE.Matrix4(), col = new THREE.Color();
  const walls = [0xece6da, 0xe1d2b4, 0xd7b38b, 0xc98e6a, 0xb8c1ae, 0xa8b5c1, 0x9c4e3e, 0xb4b1a9];
  let k = 0;
  for (const i of lots) {
    const h = [0.4, 0.95, 2.6][W.lvl[i] - 1] * (0.8 + ((i * 7) % 5) * 0.1);
    const s = W.zone[i] === 3 ? 1.05 : 0.85;
    mx.makeRotationY(((i % 6) * Math.PI) / 3).scale(new THREE.Vector3(s, h, s * 0.75)).setPosition(W.x[i], W.h[i], W.z[i]);
    m.setMatrixAt(k, mx); m.setColorAt(k++, col.setHex(walls[i % 8]));
  }
  for (const b of G.buildings) {
    const mil = b.def.kind === 'military';
    mx.makeScale(mil ? 0.7 : 1.1, mil ? 0.55 : b.type === 'hq' ? 1.6 : 0.8, mil ? 0.7 : 1.1).setPosition(b.x, b.y, b.z);
    m.setMatrixAt(k, mx); m.setColorAt(k++, col.setHex(mil ? 0x7a838a : b.type === 'hq' ? 0xece6da : 0xc2beb4));
  }
  m.count = k; m.castShadow = m.receiveShadow = true;
  H.scene.add(m);
}

// ------------------------------------------------------------------ scenes

function enemiesFor(raid) {
  G.enemies = [];
  if (!raid) return;
  const add = (type, ang, r, y = 0) => G.enemies.push({ type, team: 'E', domain: ENEMIES[type].domain, alive: true, x: Math.sin(ang) * r, y, z: Math.cos(ang) * r, hp: ENEMIES[type].hp * 0.7, maxHp: ENEMIES[type].hp });
  add('gunboat', 0.75, 46); add('gunboat', 0.8, 47); add('destroyer', 0.7, 50); add('landing', 0.85, 44);
  add('fighter', 2.45, 52, 5); add('fighter', 2.5, 51, 5); add('fighter', 2.4, 53, 5); add('gunboat', 0.6, 30);
}

function towerOnScreen() {
  const b = G.buildings.find((x) => x.type === 'coastal' && x.level === 2) || G.buildings.find((x) => x.def.weapon && x.type !== 'hq');
  return b;
}

// synthetic pointer over a tile (projected through the live camera)
const _sp = { x: 0, y: 0, z: 0 };
function pointAt(tile) { updateCamera(0.016); project(W.x[tile], isLand(W.type[tile]) ? W.h[tile] : 0, W.z[tile], _sp); return { clientX: _sp.x, clientY: _sp.y }; }
function hoverTile(tile) {
  const p = pointAt(tile);
  inputEl.dispatchEvent(new MouseEvent('mouseenter', p));
  window.dispatchEvent(new MouseEvent('mousemove', p));
}
function pressTile(tile) { inputEl.dispatchEvent(new MouseEvent('mousedown', { ...pointAt(tile), button: 0, bubbles: true })); }
function nearRoadTile(minD, maxD) {
  return W.land.find((i) => { const d = Math.hypot(W.x[i] - W.x[W.center], W.z[i] - W.z[W.center]); return d > minD && d < maxD && !W.road[i] && !W.bld[i] && W.type[i] !== T.MOUNTAIN && W.nbr.slice(i * 6, i * 6 + 6).some((j) => j >= 0 && W.road[j]); });
}

const SCENES = {
  zone() {
    hideScreen(); closeSheet(); setView(null); enemiesFor(false);
    const t = nearRoadTile(14, 22) ?? nearRoadTile(8, 14);
    // clear a patch so the brush has empty lots to paint
    for (const i of W.land) if (Math.hypot(W.x[i] - W.x[t], W.z[i] - W.z[t]) < 5.5 && !W.road[i] && !W.bld[i]) { W.zone[i] = 0; W.lvl[i] = 0; }
    W.lotVersion++;
    focus(W.x[t], W.z[t] + 3, 24); CAM.g.yaw = 0.3; snapCamera();
    G.selected = null; UI.sel = undefined;
    openDrawer('zoning', true);
    hoverTile(t);
  },
  road() {
    hideScreen(); closeSheet(); setView(null); enemiesFor(false); closeDrawer();
    const a = nearRoadTile(14, 24) ?? nearRoadTile(6, 14);
    let b = a;
    for (const i of W.land) { const d = Math.hypot(W.x[i] - W.x[a], W.z[i] - W.z[a]); if (d > 7 && d < 9.5 && !W.bld[i] && W.type[i] !== T.MOUNTAIN && Math.hypot(W.x[i], W.z[i]) > Math.hypot(W.x[a], W.z[a])) { b = i; break; } }
    focus((W.x[a] + W.x[b]) / 2, (W.z[a] + W.z[b]) / 2 + 3, 26); CAM.g.yaw = -0.2; snapCamera();
    G.selected = null; UI.sel = undefined;
    openDrawer('roads', true);
    hoverTile(a); pressTile(a); hoverTile(b);
  },
  place() {
    hideScreen(); closeSheet(); setView(null); enemiesFor(false);
    const t = W.coast.find((i) => !W.bld[i] && Math.atan2(W.x[i], W.z[i]) > -0.3 && Math.atan2(W.x[i], W.z[i]) < 0.3) ?? W.coast.find((i) => !W.bld[i]);
    focus(W.x[t] * 0.85, W.z[t] * 0.85 + 2, 38); CAM.g.yaw = 0; snapCamera();
    G.selected = null; UI.sel = undefined;
    openDrawer('air', true);
    pickBuilding('flak');
    hoverTile(t);
  },
  hud() {
    hideScreen(); closeSheet(); setView(null); setTool(null);
    G.wave.state = 'prep'; G.paused = false; enemiesFor(false);
    const b = towerOnScreen();
    focus(b.x * 0.75, b.z * 0.75 + 4, 34); CAM.g.yaw = 0.35; snapCamera();
    G.selected = b; UI.sel = undefined;
    openDrawer('coastal', true);
    MSG.length = 0;
    notify('Town reached: Gas Power Plant, Plaza, Radar Station and War College unlocked', 'good');
    notify('Fire: 3 buildings burning on Quay Street', 'bad', W.x[W.center] + 6, W.z[W.center] - 4);
    notify('Raid 6 repelled: +$2,550 in bounties and bonus', 'good');
    notify('Power at 92%: build more generation before zoning', 'bad');
  },
  lot() {
    hideScreen(); closeSheet(); closeDrawer();
    G.wave.state = 'prep'; enemiesFor(false);
    const lot = W.land.find((i) => W.zone[i] === 1 && W.lvl[i] === 2 && Math.hypot(W.x[i], W.z[i]) > 6) ?? W.land.find((i) => W.zone[i] === 1);
    W.flags[lot] &= ~LF.WATER; W.cover[lot] &= ~CV.SCHOOL; W.prog[lot] = 54;
    focus(W.x[lot], W.z[lot] + 2, 26); CAM.g.yaw = -0.4; snapCamera();
    G.selected = { lot }; UI.sel = undefined;
    openDrawer('zoning', true);
    setTool(null);
    setView('landvalue');
    const h = W.land.find((i) => W.zone[i] && i !== lot && Math.hypot(W.x[i] - W.x[lot], W.z[i] - W.z[lot]) > 4 && Math.hypot(W.x[i] - W.x[lot], W.z[i] - W.z[lot]) < 7);
    if (h != null) setTimeout(() => hoverTile(h), 30);
  },
  raid() {
    hideScreen(); closeSheet(); closeDrawer(); setTool(null); setView(null);
    G.wave.state = 'prep'; G.wave.timer = 0.5;
    enemiesFor(true);
    const b = G.buildings.find((x) => x.type === 'flak');
    G.selected = b; UI.sel = undefined;
    focus(4, 2, 44); CAM.g.yaw = 0; snapCamera();
    G.tod = 0.85; G.fires = 5; G.hq.hp = G.hq.maxHp * 0.62; G.blockade = true; G.money = -1830; G.netPerMin = -410; G.negT = 64;
    // the next frame sees prep -> active and raises the critical banner
    setTimeout(() => { G.wave.state = 'active'; G.wave.current = 7; G.wave.total = 12; G.wave.queue = [{ type: 'bomber' }, { type: 'fighter' }, { type: 'fighter' }]; notify('Raid 7 is here! Incoming from the north-east and south.', 'alert', 20, -20); }, 50);
    setView('defence');
  },
  budget() { SCENES.hud(); closeDrawer(); G.selected = null; UI.sel = undefined; openSheet('budget'); },
  research() { SCENES.hud(); closeDrawer(); G.selected = null; UI.sel = undefined; openSheet('research'); },
  log() { SCENES.hud(); closeDrawer(); openSheet('log'); },
  report() {
    SCENES.hud(); closeDrawer(); G.selected = null; UI.sel = undefined;
    G.wave.report = { n: 6, kills: { gunboat: 5, landing: 2, infantry: 6, fighter: 3, destroyer: 1 }, bounty: 3290, bonus: 2550, lostOwn: 1, lostPrivate: 7, firesStarted: 6, firesOut: 4, repairBill: 1460, taxLost: 820 };
    showWaveReport(G.wave.report);
  },
  menu() { G.mode = 'menu'; closeSheet(); setView(null); setTool(null); showMainMenu(482113); },
  settings() { SCENES.menu(); openSettings('menu'); },
  help() { SCENES.menu(); openHelp('menu'); },
  pause() { SCENES.hud(); openPause(); },
  over() { SCENES.hud(); closeDrawer(); G.mode = 'over'; G.selected = null; UI.sel = undefined; showGameOver('bankrupt'); },
  victory() { SCENES.hud(); closeDrawer(); G.victory = true; showVictory(); },
};

function scene(name) {
  if (!NO3D) H.budget3d = 6;
  window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
  inputEl.dispatchEvent(new MouseEvent('mouseleave'));
  mouse.x = -1; mouse.y = -1;
  clearLog(); MSG.length = 0;
  setupG();
  G.mode = 'play';
  showHUD();
  (SCENES[name] || SCENES.hud)();
  return name;
}

// ------------------------------------------------------------------ boot

setupG();
addBlocks();
let inputEl = NO3D ? Object.assign(document.createElement('div'), { style: 'position:fixed;inset:0' }) : renderer.domElement;
if (NO3D) document.body.prepend(inputEl);
initInput(inputEl, camera);
initUI({ sim, gfx: { setInfoView: tint, setRings, setGhost }, camera, newGame: () => scene('hud'), continueGame: () => scene('hud'), toMenu: () => scene('menu'), reroll: () => 1 + Math.floor(Math.random() * 999999), applySettings: () => {} });
showHUD();
scene(q.get('scene') || 'hud');

let last = performance.now(), frames = 0;
const tick = (dt) => {
  frames++;
  updateCamera(dt);
  updatePointer();
  if (!NO3D) Object.assign(H.cam, { x: CAM.tx, z: CAM.tz, dist: CAM.dist, yaw: CAM.yaw });
  uiFrame(dt, '<b>182</b> fps · 5.49 ms avg · p95 5.8 · p99 6.4 · worst 9.1<br>display ~180 Hz · 2 slow frames / 360<br>CPU ms: input 0.04 · sim 0.31 · sync 0.42 · life 0.18 · lightmap 0.05 · post 1.02 · hud 0.12<br>GPU 4.21 ms · 118 draws · 412k tris · 41 programs · 38 KB/frame upload');
};
if (NO3D) {
  const loop = (now) => { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; tick(dt); };
  requestAnimationFrame(loop);
} else {
  H.onFrame((dt) => tick(dt));
  H.setTod(+(q.get('tod') || 0.42));
  H.start(2);
}

import { TOOL } from '../../../src/input.js';
window.__demo = {
  tool: () => ({ start: TOOL.roadStart, path: TOOL.roadPath.slice(), cost: TOOL.roadCost, n: TOOL.roadNew, tile: mouse.tile, over: mouse.over, left: mouse.left, x: mouse.x, y: mouse.y, chip: TOOL.chip, roads: TOOL.roadPath.map((i) => W.road[i]) }),
  scene: (n) => { const r = scene(n); forceRefresh(); return r; }, G, W, UI, IV,
  frames: () => frames,
  // resolves after the scene has had time to settle (fonts loaded, a few UI ticks)
  ready: async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 450)); return true; },
  overlaps() {
    const ids = ['citycard', 'chips', 'advisor', 'raidclock', 'status', 'log', 'inspector', 'dock', 'drawer', 'rail', 'minimap', 'legend', 'towercard', 'banner'];
    const R = {};
    for (const id of ids) { const e = document.getElementById(id); if (!e || e.classList.contains('hidden') || !e.offsetParent && id !== 'towercard') continue; const r = e.getBoundingClientRect(); if (r.width && r.height) R[id] = r; }
    // children of #chips / #advisor / #log measured as their union
    const out = [];
    const keys = Object.keys(R);
    for (let a = 0; a < keys.length; a++) for (let b = a + 1; b < keys.length; b++) {
      const p = R[keys[a]], s = R[keys[b]];
      const ix = Math.min(p.right, s.right) - Math.max(p.left, s.left), iy = Math.min(p.bottom, s.bottom) - Math.max(p.top, s.top);
      if (ix > 1 && iy > 1) out.push(`${keys[a]} x ${keys[b]} (${Math.round(ix)}x${Math.round(iy)})`);
    }
    const off = keys.filter((k) => R[k].left < -1 || R[k].top < -1 || R[k].right > innerWidth + 1 || R[k].bottom > innerHeight + 1);
    return { overlaps: out, offscreen: off, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) };
  },
};
if (NO3D) window.__ready = true;
