// Model line-ups for visual review (GFX-MODELS).
//   node tests/gfx/build.mjs tests/models/lineup.js OUT
//   node tests/models/shoot.cjs "http://127.0.0.1:8200/OUT/index.html" OUTDIR shotA,shotB@0.84,...
// Everything is laid out once; window.goShot(name, tod) moves the camera (no shader recompiles between shots).
import { H } from '../gfx/harness.js';
import * as THREE from 'three';
import { getModels, putSpin, CAR_PAINTS, BOAT_PAINTS, TRACER_FRIENDLY, TRACER_HOSTILE, ghostMaterial, modelKey, AIRFIELD_SPOTS } from '../../src/gfx/models.js';
import { loadAssetModels } from '../../src/gfx/assets.js';
import { Pool } from '../../src/gfx/pools.js';

const q = new URLSearchParams(location.search);
const LAND_Y = 0.3;
await H.init({ seed: 7, city: false });
H.camera.fov = +(q.get('fov') || 26);
H.camera.updateProjectionMatrix();
if (q.get('assets') !== '0') await loadAssetModels();
const MODELS = getModels();
window.MODELS = MODELS;

// placeholder ground: land slab (top y = 0.3) for z < 5, sea beyond
const S = H.scene;
const hexGeo = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, -0.5, 0);
const land = new THREE.Mesh(new THREE.BoxGeometry(90, 1, 50).translate(0, LAND_Y - 0.5 - 0.004, -20), new THREE.MeshStandardMaterial({ color: 0x6e8c4c, roughness: 0.95 }));
land.receiveShadow = true; S.add(land);
const tiles = new THREE.InstancedMesh(hexGeo, new THREE.MeshStandardMaterial({ color: 0x8d9659, roughness: 0.95 }), 200);
tiles.count = 0; tiles.receiveShadow = true; S.add(tiles);
const _m = new THREE.Matrix4();
function tile(x, z) { _m.makeScale(0.995, 0.05, 0.995).setPosition(x, LAND_Y + 0.0, z); tiles.setMatrixAt(tiles.count++, _m); }
const road = new THREE.Mesh(new THREE.BoxGeometry(14, 0.02, 0.7).translate(0, LAND_Y + 0.003, 2.6), new THREE.MeshStandardMaterial({ color: 0x3a3d41, roughness: 0.9 }));
road.receiveShadow = true; S.add(road);
const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1e6378, roughness: 0.1 }));
sea.position.y = -0.01; sea.receiveShadow = true; sea.renderOrder = 5; S.add(sea);

const pools = {};
function pool(key) {
  if (!pools[key]) {
    const e = MODELS[key];
    if (!e) throw new Error('no model ' + key);
    pools[key] = new Pool(e.geometry, e.material, 64, { cast: true });
    S.add(pools[key].mesh);
    pools[key].begin();
  }
  return pools[key];
}
const labels = [];
function label(text, x, y, z) { labels.push({ text, p: new THREE.Vector3(x, y, z) }); }
const spins = [];
function placeStructure(key, x, z, yaw = 0, headYaw = 0.5) {
  const e = MODELS[key];
  tile(x, z);
  pool(key).put(x, LAND_Y, z, yaw);
  if (e.head) pool(e.head).put(x, LAND_Y + e.headY, z, yaw + headYaw);
  if (e.rotor) spins.push({ key: e.rotor, x: x + Math.sin(yaw) * e.rotorZ, y: LAND_Y + e.rotorY, z: z + Math.cos(yaw) * e.rotorZ, yaw });
  if (e.spots) for (const [sx, sz, syaw, ss] of e.spots) pool('ally_fighter').put(x + sx, LAND_Y + 0.05, z + sz, syaw, ss, ss, ss);
  label(`${key} ${e.tris}${e.head ? '+' + MODELS[e.head].tris : ''}`, x, LAND_Y, z + 1.0);
}
const SHOTS = {};

// civic: two rows of eight at z = -22 / -19.6
['hq', 'hq_l2', 'hq_l3', 'fire', 'police', 'clinic', 'hospital', 'school'].forEach((k, i) => placeStructure(k, -7.7 + i * 2.2, -22));
['college', 'park', 'plaza', 'wind', 'gas', 'watertower', 'pump', 'rubble'].forEach((k, i) => placeStructure(k, -7.7 + i * 2.2, -19.4));
SHOTS.civicA = { x: -4.4, z: -20.9, dist: 15, yaw: 0, tilt: -0.08 };
SHOTS.civicB = { x: 4.4, z: -20.9, dist: 15, yaw: 0, tilt: -0.08 };
SHOTS.civicAll = { x: 0, z: -20.7, dist: 26, yaw: 0, tilt: -0.1 };
SHOTS.hqClose = { x: -5.5, z: -22, dist: 8.5, yaw: 0.35, tilt: -0.15 };
SHOTS.servClose = { x: 2.2, z: -22, dist: 9, yaw: 0.0, tilt: -0.15 };
SHOTS.utilClose = { x: 3.3, z: -19.4, dist: 9.5, yaw: 0.0, tilt: -0.2 };

// military: columns per type, rows per level, z = -12.6 .. -8.4
const types = ['mg', 'coastal', 'flak', 'missile', 'barracks', 'airfield'];
types.forEach((t, c) => [1, 2, 3].forEach((l) => placeStructure(modelKey(t, l), -5.5 + c * 2.2, -12.6 + (l - 1) * 2.1, 0, 0.5 + l * 0.3)));
placeStructure('radar', 7.7, -12.6);
placeStructure('rubble_b', 7.7, -10.5);
SHOTS.milA = { x: -4.4, z: -10.5, dist: 12, yaw: 0, tilt: -0.1 };
SHOTS.milB = { x: 0.0, z: -10.5, dist: 12, yaw: 0, tilt: -0.1 };
SHOTS.milC = { x: 4.4, z: -10.5, dist: 12, yaw: 0, tilt: -0.1 };
SHOTS.milAll = { x: 1.1, z: -10.5, dist: 22, yaw: 0, tilt: -0.1 };
SHOTS.towerClose = { x: -4.4, z: -10.5, dist: 6.5, yaw: 0.5, tilt: -0.12 };

// ghost (placement) demo
const gp = new Pool(MODELS.coastal_l3.geometry, ghostMaterial, 1, { cast: false, receive: false, colors: false });
gp.put(7.7, LAND_Y, -8.4, 0); gp.end(); S.add(gp.mesh);
label('ghost', 7.7, LAND_Y, -7.5);

// air: aircraft at y = 1.8 over z = -4, infantry and projectiles in front
const air = ['fighter', 'bomber', 'jet', 'ally_fighter', 'jet_proc', 'ally_fighter_proc'].filter((k) => MODELS[k]);
air.forEach((k, i) => { const x = -5.2 + i * 2.1, y = 1.0, z = -4.6; pool(k).put(x, y, z, Math.PI * 0.75); label(`${k} ${MODELS[k].tris}`, x, y - 0.6, z + 0.9); });
['infantry', 'soldier', 'officer'].forEach((k, i) => {
  for (let j = 0; j < 4; j++) pool(k).put(-4.6 + i * 1.1 + (j % 2) * 0.25, LAND_Y, -2.0 + Math.floor(j / 2) * 0.25, 0.4 + j * 0.3);
  label(`${k} ${MODELS[k].tris}`, -4.4 + i * 1.1, LAND_Y, -1.2);
});
['shell', 'bomb', 'missileP', 'rocketP'].forEach((k, i) => { pool(k).put(-0.8 + i * 0.9, LAND_Y + 0.4, -1.8, Math.PI / 2, 1.5, 1.5, 1.5, ...(i % 2 ? TRACER_HOSTILE : TRACER_FRIENDLY)); label(`${k} ${MODELS[k].tris}`, -0.8 + i * 0.9, LAND_Y, -1.2); });
pool('tracer').put(3.0, LAND_Y + 0.4, -1.8, Math.PI / 2, 0.025, 0.025, 1.2, ...TRACER_FRIENDLY);
pool('tracer').put(3.0, LAND_Y + 0.6, -1.8, Math.PI / 2, 0.025, 0.025, 1.2, ...TRACER_HOSTILE);
SHOTS.air = { x: 0.0, z: -3.2, dist: 13, yaw: 0, tilt: -0.05 };
SHOTS.airClose = { x: -3.1, z: -4.6, dist: 6.0, yaw: 0.0, tilt: 0.1 };
SHOTS.airClose2 = { x: 2.8, z: -4.6, dist: 6.0, yaw: 0.0, tilt: 0.1 };
SHOTS.inf = { x: -2.5, z: -1.9, dist: 4.5, yaw: 0.3, tilt: -0.15 };

// traffic on the road strip z = 2.6
const veh = ['car_sedan', 'car_hatch', 'car_suv', 'taxi', 'police_car', 'van', 'ambulance', 'truck', 'bus', 'firetruck'];
veh.forEach((k, i) => {
  const x = -5.4 + i * 1.15;
  const c = k === 'taxi' ? [0.69, 0.4, 0.03] : CAR_PAINTS[(i * 5) % CAR_PAINTS.length];
  pool(k).put(x, LAND_Y + 0.013, 2.75, 0.35, 1, 1, 1, ...c);
  label(`${k} ${MODELS[k].tris}`, x, LAND_Y, 3.4);
});
for (let i = 0; i < 8; i++) pool(['car_sedan', 'car_hatch', 'car_suv'][i % 3]).put(-5 + i * 0.55, LAND_Y + 0.013, 2.4, -Math.PI / 2, 1, 1, 1, ...CAR_PAINTS[i]);
SHOTS.traffic = { x: -0.2, z: 2.6, dist: 7.5, yaw: 0, tilt: -0.2 };
SHOTS.trafficClose = { x: -3.0, z: 2.6, dist: 3.6, yaw: 0.4, tilt: -0.25 };

// naval on the sea, z = 10
const nav = [['battleship', -6.5, 10.5], ['destroyer', -1.8, 10.5], ['gunboat', 1.6, 10], ['landing', 3.8, 10], ['ferry', 6.8, 10.5], ['trawler', 9.4, 10], ['yacht', 11.2, 10]];
nav.forEach(([k, x, z]) => { pool(k).put(x, 0, z, Math.PI * 0.5 + 0.35, 1, 1, 1, ...(k === 'trawler' ? BOAT_PAINTS[1] : [1, 1, 1])); label(`${k} ${MODELS[k].tris}`, x, 0, z + 1.5); });
SHOTS.naval = { x: 2.4, z: 10.4, dist: 18, yaw: 0, tilt: -0.08 };
SHOTS.navalA = { x: -4.2, z: 10.4, dist: 9.5, yaw: 0, tilt: -0.08 };
SHOTS.navalB = { x: 4.8, z: 10.2, dist: 9.5, yaw: 0, tilt: -0.08 };

for (const k in pools) pools[k].end();
tiles.instanceMatrix.needsUpdate = true;
const spinPool = spins.length ? new Pool(MODELS.wind_rotor.geometry, MODELS.wind_rotor.material, 16, { cast: true }) : null;
if (spinPool) S.add(spinPool.mesh);

const div = document.createElement('div');
div.style.cssText = 'position:fixed;inset:0;pointer-events:none;font:11px monospace;color:#fff';
if (q.get('labels') !== '0') document.body.appendChild(div);
let frames = 0;
window.goShot = (name, tod) => { H.setCam(SHOTS[name]); if (tod != null) H.setTod(tod); frames = 0; };
window.shotFrames = () => frames;
window.SHOTS = SHOTS;
H.setCam(SHOTS[q.get('shot') || 'milA']);
const _v = new THREE.Vector3();
H.onFrame((dt, t) => {
  frames++;
  if (spinPool) { spinPool.begin(); for (const s of spins) putSpin(spinPool, s.x, s.y, s.z, s.yaw, t * 1.5); spinPool.end(); }
  let html = '';
  for (const l of labels) {
    _v.copy(l.p).project(H.camera);
    if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) continue;
    const x = (_v.x * 0.5 + 0.5) * innerWidth, y = (-_v.y * 0.5 + 0.5) * innerHeight;
    html += `<div style="position:absolute;left:${x | 0}px;top:${y | 0}px;transform:translateX(-50%);background:rgba(0,0,0,.55);padding:0 3px">${l.text}</div>`;
  }
  div.innerHTML = html;
  const inf = H.renderer.info;
  window.__report = { programs: inf.programs.map((p) => p.name + ':' + p.usedTimes), stats: H.stats };
});
H.start(3);
