import { W, T, tileAt, groundY, isWater, isWalkable, isLand } from './world.js';
import { hexDist, angleDiff, clamp, lerp } from './hex.js';
import { ENEMIES, ALLIES, BUILDINGS, VICTORY_WAVE, WAVE_GAP } from './defs.js';
import { G, notify } from './state.js';
import { findPath } from './path.js';
import { damageBuilding, saveGame } from './game.js';
import * as FX from './fx.js';
import { sfx } from './audio.js';

const GRAV = 6;
const rnd = (a, b) => a + Math.random() * (b - a);

// Route searches allowed per simulation step, so a crowd retargeting at once spreads over a few frames
let planBudget = 3;
function canPlan() {
  if (planBudget <= 0) return false;
  planBudget--;
  return true;
}

// ------------------------------------------------------------------ waves

export function genWave(n) {
  let budget = 14 + 8 * n + 0.75 * n * n;
  const units = [];
  if (n >= 10 && n % 5 === 0) {
    const k = 1 + Math.floor((n - 10) / 10);
    for (let i = 0; i < k; i++) units.push('battleship');
    budget -= 110 * k;
  }
  const pool = Object.entries(ENEMIES).filter(([, d]) => d.cost && d.weight && n >= d.minWave);
  // the first raids always bring a landing party so marines and MG nests matter early
  if (n <= 2) { units.push('landing'); budget -= ENEMIES.landing.cost; }
  while (budget >= 6) {
    const opts = pool.filter(([, d]) => d.cost <= budget);
    if (!opts.length) break;
    let sum = 0;
    for (const [, d] of opts) sum += d.weight;
    let r = Math.random() * sum, pick = opts[0][0];
    for (const [k, d] of opts) { r -= d.weight; if (r <= 0) { pick = k; break; } }
    units.push(pick);
    budget -= ENEMIES[pick].cost;
  }
  const nd = n < 3 ? 1 : n < 8 ? 2 : 3;
  const dirs = [];
  const base = Math.random() * Math.PI * 2;
  for (let i = 0; i < nd; i++) dirs.push(base + (i * Math.PI * 2) / nd + rnd(-0.5, 0.5));
  for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [units[i], units[j]] = [units[j], units[i]]; }
  let t = 0;
  const queue = units.map((type, k) => {
    t += rnd(0.5, 1.8) * (ENEMIES[type].domain === 'air' ? 1.4 : 1);
    return { t, type, dir: dirs[k % nd] + rnd(-0.22, 0.22) };
  });
  const counts = {};
  for (const u of units) counts[u] = (counts[u] || 0) + 1;
  return { n, queue, dirs, counts };
}

const hpMul = (n) => 1 + 0.05 * (n - 1) + 0.0025 * (n - 1) * (n - 1);
const dmgMul = (n) => 1 + 0.04 * (n - 1);

export function updateWave(dt) {
  const w = G.wave;
  if (w.state === 'prep') {
    w.timer -= dt;
    if (w.timer <= 0) startWave();
  } else {
    w.elapsed += dt;
    while (w.queue.length && w.queue[0].t <= w.elapsed) {
      const q = w.queue.shift();
      spawnEnemy(q.type, q.dir, w.current);
      w.lastSpawn = w.elapsed;
    }
    if (!w.queue.length) {
      let alive = 0;
      for (const e of G.enemies) if (e.team === 'E' && !e.gone) alive++;
      if (alive && w.elapsed > (w.lastSpawn || 0) + 240) {
        for (const e of G.enemies) e.gone = true;
        notify('The last raiders have withdrawn.', 'good');
        alive = 0;
      }
      if (alive === 0) endWave();
    }
  }
}

function startWave() {
  const w = G.wave;
  w.state = 'active';
  w.current = w.n;
  w.elapsed = 0;
  w.queue = w.plan.queue.map((q) => ({ ...q }));
  w.total = w.queue.length;
  notify(`Wave ${w.current} is here! ${describeDirs(w.plan.dirs)}`, 'alert');
  sfx('alarm');
}

function endWave() {
  const w = G.wave;
  const bonus = 30 + 12 * w.current;
  G.res.gold += bonus;
  G.stats.waves = w.current;
  notify(`Wave ${w.current} repelled. +${bonus} gold`, 'good');
  sfx('victory');
  w.n = w.current + 1;
  w.state = 'prep';
  w.timer = WAVE_GAP;
  w.plan = genWave(w.n);
  if (w.current === VICTORY_WAVE && !G.victory) {
    G.victory = true;
    G.onVictory && G.onVictory();
  }
  saveGame();
}

export function callWaveEarly() {
  const w = G.wave;
  if (w.state !== 'prep') return 0;
  const bonus = Math.floor(w.timer * 0.6);
  G.res.gold += bonus;
  w.timer = 0;
  return bonus;
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
export function compass(angle) {
  // angle measured from +z; the camera starts looking towards -z, so -z is "north"
  const a = ((Math.atan2(Math.sin(angle), -Math.cos(angle)) / (Math.PI * 2)) * 8 + 8.5) % 8;
  return COMPASS[Math.floor(a)];
}
export function describeDirs(dirs) {
  const names = [...new Set(dirs.map(compass))];
  return 'Incoming from the ' + names.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.';
}

// ------------------------------------------------------------------ spawning

function edgeTileNear(angle) {
  let best = W.edge[0], bd = 9;
  for (const i of W.edge) {
    const d = Math.abs(angleDiff(Math.atan2(W.x[i], W.z[i]), angle));
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function baseUnit(type, def, team) {
  return {
    type, def, team, domain: def.domain || 'ground',
    x: 0, y: 0, z: 0, yaw: 0, bank: 0, pitch: 0, vx: 0, vy: 0, vz: 0,
    hp: def.hp, maxHp: def.hp, alive: true, dying: 0, gone: false,
    state: 'approach', path: null, pi: 0, target: null, foe: null,
    cool: rnd(0.5, 2), think: rnd(0, 0.5), phase: rnd(0, 6.28), ox: rnd(-0.3, 0.3), oz: rnd(-0.3, 0.3),
    born: G.time,
  };
}

export function spawnEnemy(type, angle, wave) {
  const def = ENEMIES[type];
  const e = baseUnit(type, def, 'E');
  e.hp = e.maxHp = def.hp * hpMul(wave);
  e.dm = dmgMul(wave);
  e.wave = wave;
  if (def.domain === 'sea') {
    const t = edgeTileNear(angle);
    e.x = W.x[t]; e.z = W.z[t];
    e.yaw = Math.atan2(-e.x, -e.z);
    if (def.troops) e.troops = def.troops + Math.floor((wave - 1) / 4);
  } else {
    const r = 52;
    e.x = Math.sin(angle) * r; e.z = Math.cos(angle) * r;
    e.alt = def.alt + rnd(0, 1.5);
    e.y = e.alt;
    e.yaw = angle + Math.PI;
    e.bombs = def.bombs || 0;
    e.rockets = def.rockets || 0;
    e.passes = 0;
    if (type === 'bomber') {
      const aim = pickAirTarget(e) || G.hq || { x: 0, z: 0 };
      const ax = aim.x + rnd(-2.5, 2.5), az = aim.z + rnd(-2.5, 2.5);
      const dx = ax - e.x, dz = az - e.z, l = Math.hypot(dx, dz);
      e.wpx = ax; e.wpz = az;
      e.exx = ax + (dx / l) * 90; e.exz = az + (dz / l) * 90;
      e.gcool = 0;
    }
    sfx('plane', e.x, e.z);
  }
  G.enemies.push(e);
  return e;
}

export function spawnInfantry(x, z, wave) {
  const def = ENEMIES.infantry;
  const e = baseUnit('infantry', def, 'E');
  e.hp = e.maxHp = def.hp * hpMul(wave);
  e.dm = dmgMul(wave);
  e.x = x + rnd(-0.35, 0.35); e.z = z + rnd(-0.35, 0.35);
  e.y = groundY(e.x, e.z);
  e.yaw = Math.atan2(-e.x, -e.z);
  G.enemies.push(e);
}

function spawnSoldier(home) {
  const def = ALLIES.soldier;
  const s = baseUnit('soldier', def, 'A');
  s.hp = s.maxHp = def.hp * G.mod.soldier;
  s.home = home;
  const a = rnd(0, 6.28);
  s.postX = home.x + Math.cos(a) * rnd(0.9, 1.6);
  s.postZ = home.z + Math.sin(a) * rnd(0.9, 1.6);
  s.x = home.x; s.z = home.z; s.y = home.y;
  home.units.push(s);
  G.allies.push(s);
  FX.dust(s.x, s.y, s.z, 0.4);
}

function spawnFighter(home, slot) {
  const def = ALLIES.fighter;
  const f = baseUnit('ally_fighter', def, 'A');
  f.domain = 'air';
  f.hp = f.maxHp = def.hp;
  f.home = home;
  f.slot = slot;
  f.alt = 4.5;
  f.state = 'parked';
  parkFighter(f);
  home.units.push(f);
  G.allies.push(f);
}

function parkFighter(f) {
  const h = f.home;
  const off = -0.55 + f.slot * 0.42;
  f.x = h.x + Math.cos(h.yaw) * 0.18 + Math.sin(h.yaw) * off;
  f.z = h.z - Math.sin(h.yaw) * 0.18 + Math.cos(h.yaw) * off;
  f.y = h.y + 0.1;
  f.yaw = h.yaw;
  f.bank = 0; f.pitch = 0; f.speed = 0;
  f.vx = f.vy = f.vz = 0;
}

// ------------------------------------------------------------------ damage

export function damageEnemy(e, dmg, src) {
  if (!e.alive) return;
  e.hp -= dmg;
  e.hitT = 0.12;
  if (e.hp <= 0) {
    e.hp = 0;
    e.alive = false;
    if (e.team === 'E') {
      G.stats.kills++;
      const gold = Math.round((e.def.bounty || 0) * (1 + 0.03 * (e.wave || 1)));
      G.res.gold += gold;
      if (src && src.kills != null) src.kills++;
    }
    if (e.domain === 'sea') {
      e.dying = 3.5;
      FX.explosion(e.x, 0.3, e.z, e.def.radius * 1.3, true);
      sfx('boomBig', e.x, e.z);
      shake(e.x, e.z, 0.3 * e.def.radius);
    } else if (e.domain === 'air') {
      e.dying = 6;
      e.vy = 0;
      FX.explosion(e.x, e.y, e.z, 0.6, false);
      sfx('boom', e.x, e.z);
    } else {
      e.dying = 0.01;
      FX.dust(e.x, e.y, e.z, 0.5);
    }
    if (e.team === 'A' && e.home && e.home.units) {
      const k = e.home.units.indexOf(e);
      if (k >= 0) e.home.units.splice(k, 1);
      if (e.type === 'ally_fighter') e.home.respawn = (e.home.respawn || []).concat(G.time + 22);
    }
  }
}

export function shake(x, z, amount) {
  G.shakeReq = Math.max(G.shakeReq || 0, amount, 0);
  G.shakeAt = { x, z };
}

function splashBuildings(x, z, r, dmg) {
  const r2 = r * r;
  for (let k = G.buildings.length - 1; k >= 0; k--) {
    const b = G.buildings[k];
    const dx = b.x - x, dz = b.z - z, d2 = dx * dx + dz * dz;
    if (d2 > r2 + 0.5) continue;
    const f = 1 - 0.5 * Math.min(1, Math.sqrt(d2) / (r + 0.7));
    damageBuilding(b, dmg * f);
  }
  for (const a of G.allies) {
    if (!a.alive || a.domain !== 'ground') continue;
    const dx = a.x - x, dz = a.z - z;
    if (dx * dx + dz * dz <= r2) damageEnemy(a, dmg * 0.5);
  }
}

function splashEnemies(x, y, z, r, dmg, hits, src) {
  const r2 = r * r;
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const m = hits[e.domain];
    if (!m) continue;
    const dx = e.x - x, dz = e.z - z, dy = e.domain === 'air' ? e.y - y : 0;
    const er = e.def.radius || 0.4;
    const d2 = dx * dx + dz * dz + dy * dy;
    if (d2 > (r + er) * (r + er)) continue;
    const f = 1 - 0.5 * Math.min(1, Math.sqrt(d2) / (r + er));
    damageEnemy(e, dmg * m * f, src);
  }
}

// ------------------------------------------------------------------ projectiles

function addProj(p) { G.projectiles.push(p); return p; }

export function tracer(sx, sy, sz, ex, ey, ez, enemy = false) {
  addProj({ kind: 'tracer', sx, sy, sz, ex, ey, ez, t: 0, T: 0.09, enemy });
}

function shellTo(sx, sy, sz, ex, ez, dmg, splash, team, hits, src, speed = 16) {
  const dist = Math.hypot(ex - sx, ez - sz);
  const ti = tileAt(ex, ez);
  const ey = ti >= 0 && isLand(W.type[ti]) ? W.h[ti] : 0;
  return addProj({
    kind: 'shell', sx, sy, sz, ex, ey, ez, x: sx, y: sy, z: sz, t: 0, T: 0.45 + dist / speed, apex: 0.5 + dist * 0.16,
    dmg, splash, team, hits, src, water: ey === 0,
  });
}

function updateProjectiles(dt) {
  const P = G.projectiles;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    let done = false;
    switch (p.kind) {
      case 'tracer':
        p.t += dt;
        done = p.t >= p.T;
        break;
      case 'shell': {
        p.t += dt;
        const k = Math.min(1, p.t / p.T);
        p.x = lerp(p.sx, p.ex, k); p.z = lerp(p.sz, p.ez, k);
        p.y = lerp(p.sy, p.ey, k) + p.apex * 4 * k * (1 - k);
        if (k >= 1) {
          done = true;
          if (p.team === 'P') splashEnemies(p.x, p.y, p.z, p.splash, p.dmg, p.hits, p.src);
          else splashBuildings(p.x, p.z, p.splash, p.dmg);
          FX.explosion(p.x, p.y, p.z, 0.45 + p.splash * 0.3, p.water);
          sfx(p.water ? 'splash' : 'boom', p.x, p.z);
          if (!p.water) shake(p.x, p.z, 0.08);
        }
        break;
      }
      case 'flak': {
        p.t += dt;
        const k = Math.min(1, p.t / p.T);
        p.x = lerp(p.sx, p.ex, k); p.y = lerp(p.sy, p.ey, k); p.z = lerp(p.sz, p.ez, k);
        if (k >= 1) {
          done = true;
          splashEnemies(p.x, p.y, p.z, p.splash, p.dmg, { air: 1 }, p.src);
          FX.flakBurst(p.x, p.y, p.z, 0.6 + p.splash * 0.2);
          sfx('flakBurst', p.x, p.z);
        }
        break;
      }
      case 'bomb': {
        p.vy -= GRAV * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const gy = groundY(p.x, p.z);
        if (p.y <= gy) {
          done = true;
          const water = gy === 0;
          splashBuildings(p.x, p.z, p.splash, p.dmg);
          FX.explosion(p.x, gy, p.z, 0.9, water);
          sfx(water ? 'splash' : 'boom', p.x, p.z);
          shake(p.x, p.z, 0.18);
        }
        break;
      }
      case 'rocket': {
        p.t += dt;
        const k = Math.min(1, p.t / p.T);
        p.x = lerp(p.sx, p.ex, k); p.y = lerp(p.sy, p.ey, k); p.z = lerp(p.sz, p.ez, k);
        p.trailT = (p.trailT || 0) - dt;
        if (p.trailT <= 0) { p.trailT = 0.025; FX.trail(p.x, p.y, p.z, 0.8); }
        if (k >= 1) {
          done = true;
          splashBuildings(p.x, p.z, p.splash, p.dmg);
          FX.explosion(p.x, p.y, p.z, 0.8, p.ey === 0);
          sfx('boom', p.x, p.z);
          shake(p.x, p.z, 0.15);
        }
        break;
      }
      case 'missile': {
        p.t += dt;
        const tg = p.target;
        if (!tg || !tg.alive) {
          p.target = null;
          // find something else nearby, else keep flying and self-destruct
          let best = null, bd = 64;
          for (const e of G.enemies) {
            if (!e.alive || !p.hits[e.domain]) continue;
            const d2 = (e.x - p.x) ** 2 + (e.z - p.z) ** 2;
            if (d2 < bd) { bd = d2; best = e; }
          }
          p.target = best;
        }
        const speed = 15;
        if (p.target) {
          const t = p.target;
          const ty = t.domain === 'air' ? t.y : 0.3;
          let dx = t.x - p.x, dy = ty - p.y, dz = t.z - p.z;
          const l = Math.hypot(dx, dy, dz) || 1;
          if (l < 0.7) {
            done = true;
            damageEnemy(t, p.dmg * (p.hits[t.domain] || 1), p.src);
            splashEnemies(p.x, p.y, p.z, p.splash, p.dmg * 0.4, p.hits, p.src);
            FX.explosion(p.x, p.y, p.z, 0.8, t.domain === 'sea');
            sfx('boom', p.x, p.z);
            break;
          }
          const steer = Math.min(1, dt * (p.t < 0.35 ? 2 : 7));
          p.vx += (dx / l * speed - p.vx) * steer;
          p.vy += (dy / l * speed - p.vy) * steer;
          p.vz += (dz / l * speed - p.vz) * steer;
        }
        const vl = Math.hypot(p.vx, p.vy, p.vz) || 1;
        p.vx *= speed / vl; p.vy *= speed / vl; p.vz *= speed / vl;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.trailT = (p.trailT || 0) - dt;
        if (p.trailT <= 0) { p.trailT = 0.02; FX.trail(p.x, p.y, p.z, 1); }
        if (p.t > 5 || p.y < groundY(p.x, p.z) - 0.1) {
          done = true;
          FX.explosion(p.x, Math.max(p.y, 0), p.z, 0.5, p.y <= 0.05);
        }
        break;
      }
    }
    if (done) { P[i] = P[P.length - 1]; P.pop(); }
  }
}

// ------------------------------------------------------------------ towers and other buildings

function acquire(b, range, targets) {
  let best = null, bs = Infinity;
  const r2 = range * range;
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const m = targets[e.domain];
    if (!m) continue;
    const dx = e.x - b.x, dz = e.z - b.z, d2 = dx * dx + dz * dz;
    if (d2 > r2) continue;
    const s = d2 / m;
    if (s < bs) { bs = s; best = e; }
  }
  return best;
}

function fireWeapon(b, t, ws, w) {
  let mx, my, mz;
  if (b.type === 'hq') { mx = b.x - 0.3; my = b.y + 1.2; mz = b.z - 0.3; }
  else {
    const m = w.muzzle || 0.3;
    mx = b.x + Math.sin(b.headYaw) * m; my = b.y + (w.headY || 0.2) + 0.12; mz = b.z + Math.cos(b.headYaw) * m;
  }
  const dist = Math.hypot(t.x - b.x, t.z - b.z);
  G.stats.shots++;
  switch (w.kind) {
    case 'mg': {
      const acc = (w.acc || 0.8) * (t.domain === 'air' ? 0.75 : 1);
      const hit = Math.random() < acc;
      const ty = t.domain === 'air' ? t.y : t.y + (t.domain === 'ground' ? 0.18 : 0.2);
      const spread = hit ? 0.12 : 0.7;
      tracer(mx, my, mz, t.x + rnd(-spread, spread), ty + rnd(-spread, spread) * 0.5, t.z + rnd(-spread, spread));
      if (hit) damageEnemy(t, ws.dmg * w.targets[t.domain], b);
      if (Math.random() < 0.5) FX.muzzle(mx, my, mz, 0.6);
      sfx('mg', b.x, b.z);
      break;
    }
    case 'shell': {
      const T = 0.45 + dist / 16;
      const sc = 0.25 + dist * 0.03;
      const px = t.x + t.vx * T + rnd(-sc, sc), pz = t.z + t.vz * T + rnd(-sc, sc);
      shellTo(mx, my, mz, px, pz, ws.dmg, ws.splash, 'P', w.targets, b);
      FX.muzzle(mx, my, mz, 1.6);
      sfx('cannon', b.x, b.z);
      break;
    }
    case 'flak': {
      let T = Math.hypot(t.x - mx, t.y - my, t.z - mz) / 28;
      const px = t.x + t.vx * T, py = t.y + t.vy * T, pz = t.z + t.vz * T;
      T = Math.hypot(px - mx, py - my, pz - mz) / 28;
      const s = 0.55;
      addProj({ kind: 'flak', sx: mx, sy: my, sz: mz, ex: t.x + t.vx * T + rnd(-s, s), ey: t.y + t.vy * T + rnd(-s, s), ez: t.z + t.vz * T + rnd(-s, s), x: mx, y: my, z: mz, t: 0, T, dmg: ws.dmg, splash: ws.splash, src: b });
      FX.muzzle(mx, my, mz, 1.1);
      sfx('flak', b.x, b.z);
      break;
    }
    case 'missile': {
      const s = 6;
      addProj({ kind: 'missile', x: mx, y: my, z: mz, vx: Math.sin(b.headYaw) * s, vy: 8, vz: Math.cos(b.headYaw) * s, t: 0, target: t, dmg: ws.dmg, splash: ws.splash, hits: w.targets, src: b });
      FX.muzzle(mx, my, mz, 1.3);
      sfx('missile', b.x, b.z);
      break;
    }
  }
}

function updateWeapon(b, dt) {
  const w = b.def.weapon, ws = b.ws;
  if (!b.connected || !ws) { b.target = null; b.headYaw += dt * 0.1; return; }
  b.cool -= dt; b.scan -= dt;
  let t = b.target;
  if (t && (!t.alive || (t.x - b.x) ** 2 + (t.z - b.z) ** 2 > ws.range * ws.range)) t = b.target = null;
  if (!t && b.scan <= 0) {
    b.scan = 0.12 + Math.random() * 0.1;
    t = b.target = acquire(b, ws.range, w.targets);
  }
  if (t) {
    const diff = angleDiff(Math.atan2(t.x - b.x, t.z - b.z), b.headYaw);
    const turn = (w.kind === 'mg' ? 10 : w.kind === 'flak' ? 5 : 3.2) * dt;
    b.headYaw += clamp(diff, -turn, turn);
    if (b.cool <= 0 && Math.abs(diff) < (w.aim || 0.6)) {
      fireWeapon(b, t, ws, w);
      b.cool = Math.max(b.cool, -0.05) + 1 / ws.rate;
    }
  } else {
    b.headYaw += dt * 0.25;
    if (b.cool < 0) b.cool = 0;
  }
}

function barracksCap(b) { return b.def.units + 2 * (b.level - 1) + G.mod.barracksCap; }
export function fighterCap(b) { return b.def.units + (b.level - 1); }
export { barracksCap };

export function updateBuildings(dt) {
  for (let k = G.buildings.length - 1; k >= 0; k--) {
    const b = G.buildings[k];
    if (!b) continue;
    if (b.flash > 0) b.flash = Math.max(0, b.flash - dt * 5);
    if (b.hp < b.maxHp && b.connected && G.time - b.lastHit > 6) {
      b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.015 * G.mod.repair * dt);
    }
    if (b.hp < b.maxHp * 0.55) {
      b.burnT -= dt;
      if (b.burnT <= 0) {
        b.burnT = 0.22 + Math.random() * 0.2;
        FX.smokePuff(b.x, b.y + 0.5, b.z, 0.8, 0.13);
        if (b.hp < b.maxHp * 0.3) FX.fire(b.x, b.y + 0.3, b.z, 0.8);
      }
    }
    if (b.type === 'radar') b.headYaw += dt * (b.connected ? 1.6 : 0.2);
    else if (b.type === 'barracks') {
      if (b.connected && b.units.length < barracksCap(b)) {
        b.trainT += dt * Math.max(0.3, G.eff);
        if (b.trainT >= 9) { b.trainT = 0; spawnSoldier(b); }
      }
    } else if (b.type === 'airfield') {
      if (b.connected) {
        if (b.respawn && b.respawn.length && b.respawn[0] <= G.time) b.respawn.shift();
        const pending = b.respawn ? b.respawn.length : 0;
        if (b.units.length + pending < fighterCap(b)) {
          const used = new Set(b.units.map((u) => u.slot));
          let slot = 0;
          while (used.has(slot)) slot++;
          spawnFighter(b, slot);
        }
      }
    }
    if (b.ws) updateWeapon(b, dt);
  }
}

// ------------------------------------------------------------------ enemies

function nearestBuilding(x, z, filter) {
  let best = null, bd = Infinity;
  for (const b of G.buildings) {
    if (!b.alive || (filter && !filter(b))) continue;
    const d = (b.x - x) ** 2 + (b.z - z) ** 2;
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

const seaCost = (j) => (isWater(W.type[j]) ? 1 : 0);
const landCost = (j) => {
  const t = W.type[j];
  if (!isWalkable(t)) return 0;
  return W.road[j] ? 0.8 : t === T.FOREST ? 1.5 : t === T.HILLS ? 2 : 1;
};

function startTile(e, water) {
  let i = tileAt(e.x, e.z);
  if (i >= 0 && (water ? isWater(W.type[i]) : isWalkable(W.type[i]))) return i;
  // nudge to the nearest suitable neighbour
  let best = -1, bd = Infinity;
  if (i < 0) return -1;
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[i * 6 + d];
    if (j < 0) continue;
    if (water ? isWater(W.type[j]) : isWalkable(W.type[j])) {
      const dd = (W.x[j] - e.x) ** 2 + (W.z[j] - e.z) ** 2;
      if (dd < bd) { bd = dd; best = j; }
    }
  }
  return best;
}

function planShipAttack(e) {
  const tried = new Set();
  for (let attempt = 0; attempt < 4; attempt++) {
    const target = nearestBuilding(e.x, e.z, (b) => !tried.has(b));
    if (!target) return false;
    tried.add(target);
    const r = e.def.range * 0.85;
    const tx = target.x, tz = target.z;
    // skip the search when no water at all lies within range of this target
    let reachable = false;
    for (const i of W.shore) if ((W.x[i] - tx) ** 2 + (W.z[i] - tz) ** 2 <= r * r) { reachable = true; break; }
    if (!reachable) continue;
    const start = startTile(e, true);
    const path = findPath(start, seaCost,
      (j) => Math.hypot(W.x[j] - tx, W.z[j] - tz) <= r,
      (j) => Math.max(0, Math.hypot(W.x[j] - tx, W.z[j] - tz) - r) / 1.732);
    if (path) { e.target = target; e.path = path; e.pi = 1; e.idleT = 0; return true; }
  }
  // Nothing is within reach of the water: close in as far as possible, and withdraw later if still out of range
  const target = nearestBuilding(e.x, e.z);
  if (!target) return false;
  let best = -1, bd = Infinity;
  for (const i of W.shore) {
    const d = (W.x[i] - target.x) ** 2 + (W.z[i] - target.z) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  if (best < 0) return false;
  const start = startTile(e, true);
  const path = findPath(start, seaCost, (j) => j === best, (j) => Math.hypot(W.x[j] - W.x[best], W.z[j] - W.z[best]) / 1.732);
  if (!path) return false;
  e.target = target; e.path = path; e.pi = 1; e.idleT = 0;
  return true;
}

function planLanding(e) {
  const hq = G.hq || { x: 0, z: 0 };
  let best = -1, bs = Infinity, land = -1;
  for (const i of W.landing) {
    let lt = -1, ld = Infinity;
    for (let d = 0; d < 6; d++) {
      const j = W.nbr[i * 6 + d];
      if (j >= 0 && isWalkable(W.type[j])) {
        const dd = Math.hypot(W.x[j] - hq.x, W.z[j] - hq.z);
        if (dd < ld) { ld = dd; lt = j; }
      }
    }
    if (lt < 0) continue;
    const s = Math.hypot(W.x[i] - e.x, W.z[i] - e.z) + 0.7 * ld + Math.random() * 6;
    if (s < bs) { bs = s; best = i; land = lt; }
  }
  if (best < 0) return false;
  const start = startTile(e, true);
  const path = findPath(start, seaCost, (j) => j === best, (j) => Math.hypot(W.x[j] - W.x[best], W.z[j] - W.z[best]) / 1.732);
  if (!path) return false;
  e.path = path; e.pi = 1; e.landTile = land;
  return true;
}

function planExit(e) {
  const start = startTile(e, true);
  const R = W.R;
  const path = findPath(start, seaCost, (j) => hexDist(W.q[j], W.r[j], 0, 0) >= R, (j) => R - hexDist(W.q[j], W.r[j], 0, 0));
  e.path = path; e.pi = 1;
}

function followSeaPath(e, dt) {
  const d = e.def;
  if (!e.path || e.pi >= e.path.length) { e.vx *= 0.95; e.vz *= 0.95; e.x += e.vx * dt; e.z += e.vz * dt; return true; }
  const t = e.path[e.pi];
  const dx = W.x[t] - e.x, dz = W.z[t] - e.z, dist = Math.hypot(dx, dz);
  const last = e.pi === e.path.length - 1;
  if (dist < (last ? 0.4 : 1.0)) { e.pi++; return e.pi >= e.path.length; }
  const diff = angleDiff(Math.atan2(dx, dz), e.yaw);
  e.yaw += clamp(diff, -d.turn * dt, d.turn * dt);
  const sf = clamp(1 - Math.abs(diff) / 1.5, 0.2, 1) * (last ? clamp(dist / 1.5, 0.3, 1) : 1);
  const sp = d.speed * sf;
  const nx = e.x + Math.sin(e.yaw) * sp * dt, nz = e.z + Math.cos(e.yaw) * sp * dt;
  const ti = tileAt(nx, nz);
  if (ti < 0 || isWater(W.type[ti])) {
    e.vx = (nx - e.x) / dt; e.vz = (nz - e.z) / dt;
    e.x = nx; e.z = nz;
  } else {
    // a corner of land is in the way: the straight line to the next water tile centre is clear, so take it
    const st = Math.min(dist, d.speed * 0.6 * dt);
    e.vx = (dx / dist) * d.speed * 0.6; e.vz = (dz / dist) * d.speed * 0.6;
    e.x += (dx / dist) * st; e.z += (dz / dist) * st;
    e.yaw += clamp(diff, -d.turn * 2 * dt, d.turn * 2 * dt);
  }
  return false;
}

function updateShip(e, dt) {
  const d = e.def;
  if (e.dying) {
    e.dying -= dt;
    e.y -= dt * 0.22 * (1 + d.radius);
    e.pitch += dt * 0.12;
    e.bank += dt * 0.08;
    if (Math.random() < dt * 8) FX.smokePuff(e.x + rnd(-0.3, 0.3), Math.max(0, e.y + 0.4), e.z + rnd(-0.3, 0.3), d.radius, 0.1);
    if (Math.random() < dt * 6) FX.fire(e.x, Math.max(0, e.y + 0.2), e.z, d.radius);
    if (e.dying <= 0) e.gone = true;
    return;
  }
  e.think -= dt;
  e.cool -= dt;
  if (e.state === 'leave' && !d.troops) {
    if (!e.path && e.think <= 0 && canPlan()) { e.think = 2; planExit(e); if (!e.path) e.gone = true; }
    if (e.path && followSeaPath(e, dt)) e.gone = true;
  } else if (d.troops) {
    if (e.state === 'approach') {
      if (!e.path && e.think <= 0 && canPlan()) { e.think = 1; if (!planLanding(e)) { e.state = 'leave'; } }
      if (e.path && followSeaPath(e, dt)) {
        const lt = e.landTile;
        for (let k = 0; k < e.troops; k++) spawnInfantry(W.x[lt], W.z[lt], e.wave);
        e.troops = 0;
        e.state = 'leave';
        e.path = null; e.think = 1.5;
        sfx('landing', e.x, e.z);
      }
    } else {
      if (!e.path && e.think <= 0 && canPlan()) { e.think = 2; planExit(e); }
      if (e.path && followSeaPath(e, dt)) e.gone = true;
      if (!e.path && e.think > 1.9) e.gone = true; // nowhere to go
    }
  } else {
    if ((!e.target || !e.target.alive) && e.think <= 0 && canPlan()) {
      e.think = 0.8;
      if (!planShipAttack(e)) { e.target = null; e.path = null; e.state = 'leave'; }
    }
    const t = e.target && e.target.alive ? e.target : null;
    const tdist = t ? Math.hypot(t.x - e.x, t.z - e.z) : Infinity;
    // stop as soon as the target is in range rather than fighting other ships for the exact spot
    let arrived;
    if (tdist <= d.range * 0.92) {
      arrived = true;
      e.vx *= 1 - Math.min(1, dt * 2); e.vz *= 1 - Math.min(1, dt * 2);
      e.x += e.vx * dt; e.z += e.vz * dt;
    } else {
      arrived = followSeaPath(e, dt);
      const end = e.path && e.path.length ? e.path[e.path.length - 1] : -1;
      const nearEnd = arrived || (end >= 0 && Math.hypot(W.x[end] - e.x, W.z[end] - e.z) < 1.8);
      // parked with nothing in range for a while: give up and sail away
      if (t && nearEnd) {
        e.idleT = (e.idleT || 0) + dt;
        if (e.idleT > 20) { e.state = 'leave'; e.path = null; e.think = 0; }
      }
    }
    if (t) {
      const dist = tdist;
      if (arrived) {
        const diff = angleDiff(Math.atan2(t.x - e.x, t.z - e.z) + Math.PI / 2 * (e.phase > 3.14 ? 1 : -1) * (d.radius > 0.8 ? 1 : 0), e.yaw);
        e.yaw += clamp(diff, -d.turn * 0.5 * dt, d.turn * 0.5 * dt);
      }
      if (dist <= d.range && e.cool <= 0) {
        e.cool = (1 / d.rate) * rnd(0.85, 1.15);
        const sc = 0.4 + dist * 0.06;
        const sx = e.x + Math.sin(e.yaw) * d.radius * 0.5, sz = e.z + Math.cos(e.yaw) * d.radius * 0.5;
        shellTo(sx, 0.45, sz, t.x + rnd(-sc, sc), t.z + rnd(-sc, sc), d.dmg * e.dm, d.splash, 'E', null, e, 13);
        FX.muzzle(sx, 0.45, sz, 0.8 + d.radius);
        sfx(d.radius > 0.8 ? 'cannon' : 'gun', e.x, e.z);
      }
    }
  }
  // keep ships from stacking
  for (const o of G.enemies) {
    if (o === e || o.domain !== 'sea' || o.dying) continue;
    const dx = e.x - o.x, dz = e.z - o.z, d2 = dx * dx + dz * dz;
    const min = d.radius + o.def.radius;
    if (d2 < min * min && d2 > 1e-4) {
      const l = Math.sqrt(d2), push = (min - l) * 0.5 * Math.min(1, dt * 4);
      const nx = e.x + (dx / l) * push, nz = e.z + (dz / l) * push;
      const ti = tileAt(nx, nz);
      if (ti >= 0 && isWater(W.type[ti])) { e.x = nx; e.z = nz; }
    }
  }
  e.y = Math.sin(G.time * 1.6 + e.phase) * 0.03;
  e.pitch = Math.sin(G.time * 1.3 + e.phase) * 0.025;
  e.bank = Math.sin(G.time * 1.1 + e.phase * 2) * 0.035;
  const sp2 = e.vx * e.vx + e.vz * e.vz;
  if (sp2 > 0.3) {
    e.wakeT = (e.wakeT || 0) - dt;
    if (e.wakeT <= 0) {
      e.wakeT = 0.07;
      FX.wake(e.x - Math.sin(e.yaw) * d.radius * 0.8, e.z - Math.cos(e.yaw) * d.radius * 0.8, d.radius);
    }
  }
}

// --- aircraft

function steerPlane(e, tx, tz, dt, turn, speed) {
  const diff = angleDiff(Math.atan2(tx - e.x, tz - e.z), e.yaw);
  const step = clamp(diff, -turn * dt, turn * dt);
  e.yaw += step;
  e.bank += (clamp(-diff * 1.4, -1, 1) * 0.85 - e.bank) * Math.min(1, dt * 3);
  e.vx = Math.sin(e.yaw) * speed;
  e.vz = Math.cos(e.yaw) * speed;
  e.x += e.vx * dt; e.z += e.vz * dt;
  return diff;
}

function holdAlt(e, alt, dt, rate = 1.5) {
  const dy = clamp(alt - e.y, -rate * dt, rate * dt);
  e.y += dy;
  e.vy = dy / Math.max(dt, 1e-4);
  e.pitch += (clamp(-e.vy * 0.12, -0.5, 0.5) - e.pitch) * Math.min(1, dt * 3);
}

function pickAirTarget(e) {
  let sum = 0;
  const cand = [];
  for (const b of G.buildings) {
    if (!b.alive) continue;
    const mil = b.def.weapon || b.type === 'airfield' || b.type === 'barracks' || b.type === 'radar';
    const w = (mil ? 3 : b.type === 'hq' ? 2 : 1) / (1 + Math.hypot(b.x - e.x, b.z - e.z) / 25);
    cand.push(b, w);
    sum += w;
  }
  let r = Math.random() * sum;
  for (let k = 0; k < cand.length; k += 2) { r -= cand[k + 1]; if (r <= 0) return cand[k]; }
  return cand[0] || null;
}

function crash(e, dt) {
  e.dying -= dt;
  e.vy -= GRAV * 0.7 * dt;
  e.y += e.vy * dt;
  e.x += e.vx * 0.85 * dt; e.z += e.vz * 0.85 * dt;
  e.bank += dt * 4;
  e.pitch = clamp(-e.vy * 0.08, -0.9, 0.9);
  e.trailT = (e.trailT || 0) - dt;
  if (e.trailT <= 0) { e.trailT = 0.03; FX.trail(e.x, e.y, e.z, 1.2, true); FX.fire(e.x, e.y, e.z, 0.5); }
  const gy = groundY(e.x, e.z);
  if (e.y <= gy || e.dying <= 0) {
    FX.explosion(e.x, gy, e.z, e.def.radius || 0.7, gy === 0);
    sfx(gy === 0 ? 'splash' : 'boom', e.x, e.z);
    e.gone = true;
  }
}

function dropBomb(e) {
  addProj({ kind: 'bomb', x: e.x, y: e.y - 0.15, z: e.z, vx: e.vx, vy: 0, vz: e.vz, dmg: e.def.bombDmg * e.dm, splash: e.def.splash });
  sfx('bombDrop', e.x, e.z);
}

function leave(e, dt) {
  const l = Math.hypot(e.x, e.z) || 1;
  steerPlane(e, e.x + (e.x / l) * 50, e.z + (e.z / l) * 50, dt, e.def.turn, e.def.speed);
  holdAlt(e, e.alt + 2, dt);
  if (l > 60) e.gone = true;
}

function updateAttacker(e, dt, rockets) {
  const d = e.def;
  if (e.state === 'approach' || e.state === 'attack') {
    if (!e.target || !e.target.alive) {
      e.target = pickAirTarget(e);
      if (!e.target) { e.state = 'leave'; return; }
    }
    const t = e.target;
    const dist = Math.hypot(t.x - e.x, t.z - e.z);
    const diff = steerPlane(e, t.x, t.z, dt, d.turn, d.speed);
    if (rockets) {
      holdAlt(e, Math.max(3.5, e.alt - (dist < 14 ? 2.5 : 0)), dt, 2);
      if (dist < 8.5 && Math.abs(diff) < 0.12 && e.rockets > 0) {
        for (let k = 0; k < 2 && e.rockets > 0; k++, e.rockets--) {
          const ox = Math.cos(e.yaw) * (k ? 0.3 : -0.3), oz = -Math.sin(e.yaw) * (k ? 0.3 : -0.3);
          const sx = e.x + ox, sz = e.z + oz;
          const dd = Math.hypot(t.x - sx, t.y - e.y, t.z - sz);
          addProj({ kind: 'rocket', sx, sy: e.y - 0.1, sz, ex: t.x + rnd(-0.4, 0.4), ey: t.y + 0.2, ez: t.z + rnd(-0.4, 0.4), x: sx, y: e.y, z: sz, t: 0, T: dd / 18, dmg: d.rocketDmg * e.dm, splash: d.splash });
        }
        sfx('missile', e.x, e.z);
        e.state = 'egress'; e.egT = 2.6; e.passes++;
      } else if (dist < 4 && Math.abs(diff) > 0.4) { e.state = 'egress'; e.egT = 2.0; e.passes++; }
    } else {
      holdAlt(e, e.alt, dt);
      const lead = d.speed * Math.sqrt((2 * Math.max(0.5, e.y - t.y)) / GRAV);
      if (dist <= lead) {
        if (Math.abs(diff) < 0.12 || e.passes >= 4) { dropBomb(e); e.bombs--; }
        e.state = 'egress'; e.egT = 2.4; e.passes++;
      }
    }
  } else if (e.state === 'egress') {
    steerPlane(e, e.x + Math.sin(e.yaw) * 10, e.z + Math.cos(e.yaw) * 10, dt, d.turn, d.speed);
    holdAlt(e, e.alt, dt);
    e.egT -= dt;
    if (e.egT <= 0) {
      const ammo = rockets ? e.rockets : e.bombs;
      e.state = ammo > 0 && e.passes < 8 ? 'attack' : 'leave';
      e.target = null;
    }
  } else leave(e, dt);
}

function updateBomber(e, dt) {
  const d = e.def;
  if (e.state === 'approach') {
    steerPlane(e, e.wpx, e.wpz, dt, d.turn, d.speed);
    if (Math.hypot(e.wpx - e.x, e.wpz - e.z) < 3) e.state = 'run';
  } else {
    steerPlane(e, e.exx, e.exz, dt, d.turn, d.speed);
    if (Math.hypot(e.x, e.z) > 62) e.gone = true;
  }
  holdAlt(e, e.alt, dt);
  e.cool -= dt;
  if (e.bombs > 0 && e.cool <= 0) {
    const ft = Math.sqrt((2 * e.y) / GRAV);
    const ti = tileAt(e.x + e.vx * ft, e.z + e.vz * ft);
    if (ti >= 0 && W.bld[ti]) { dropBomb(e); e.bombs--; e.cool = 0.32; }
  }
  // tail gunners
  e.gcool -= dt;
  if (e.gcool <= 0) {
    e.gcool = 0.4;
    for (const a of G.allies) {
      if (!a.alive || a.domain !== 'air' || a.state === 'parked') continue;
      const dd = Math.hypot(a.x - e.x, a.y - e.y, a.z - e.z);
      if (dd < 4.5) {
        tracer(e.x, e.y, e.z, a.x + rnd(-0.3, 0.3), a.y, a.z + rnd(-0.3, 0.3), true);
        if (Math.random() < 0.5) damageEnemy(a, 5 * e.dm);
        break;
      }
    }
  }
}

function updatePlane(e, dt) {
  if (e.dying) { crash(e, dt); return; }
  if (e.type === 'bomber') updateBomber(e, dt);
  else updateAttacker(e, dt, e.type === 'jet');
}

// --- ground troops

function moveGround(u, tx, tz, speed, dt, force = false) {
  const dx = tx - u.x, dz = tz - u.z, l = Math.hypot(dx, dz);
  if (l < 0.02) { u.vx = u.vz = 0; return true; }
  const s = Math.min(l, speed * dt);
  let nx = u.x + (dx / l) * s, nz = u.z + (dz / l) * s;
  let ti = tileAt(nx, nz);
  if (!force && (ti < 0 || !isWalkable(W.type[ti]))) {
    // slide along whichever axis is open
    ti = tileAt(nx, u.z);
    if (ti >= 0 && isWalkable(W.type[ti])) nz = u.z;
    else { ti = tileAt(u.x, nz); if (ti >= 0 && isWalkable(W.type[ti])) nx = u.x; else { u.vx = u.vz = 0; return false; } }
  }
  u.vx = (nx - u.x) / dt; u.vz = (nz - u.z) / dt;
  u.x = nx; u.z = nz;
  u.yaw += clamp(angleDiff(Math.atan2(dx, dz), u.yaw), -8 * dt, 8 * dt);
  return l < speed * dt + 0.05;
}

function followLandPath(u, dt, speed) {
  if (!u.path || u.pi >= u.path.length) return true;
  const t = u.path[u.pi];
  const last = u.pi === u.path.length - 1;
  // aim for a spread-out spot on the tile; once wedged on a corner, push straight for the centre until there
  const tx = W.x[t] + (u.force ? 0 : u.ox), tz = W.z[t] + (u.force ? 0 : u.oz);
  const px = u.x, pz = u.z;
  const reached = moveGround(u, tx, tz, speed, dt, !!u.force);
  if (!u.force) {
    if (u.x === px && u.z === pz && !reached) { u.blockT = (u.blockT || 0) + dt; if (u.blockT > 0.3) u.force = true; }
    else u.blockT = 0;
  }
  if (reached || Math.hypot(tx - u.x, tz - u.z) < (last ? 0.15 : 0.5)) { u.pi++; u.blockT = 0; u.force = false; }
  return u.pi >= u.path.length;
}

function landPathTo(u, tile, near = 1) {
  const start = startTile(u, false);
  const tq = W.q[tile], tr = W.r[tile];
  return findPath(start, landCost, (j) => hexDist(W.q[j], W.r[j], tq, tr) <= near, (j) => Math.max(0, hexDist(W.q[j], W.r[j], tq, tr) - near), 3000);
}

function settleY(u, dt) {
  const gy = groundY(u.x, u.z);
  u.y += (gy - u.y) * Math.min(1, dt * 10);
}

function updateInfantry(e, dt) {
  const d = e.def;
  if (e.dying) { e.gone = true; return; }
  e.think -= dt; e.cool -= dt;
  if (e.think <= 0) {
    e.think = rnd(0.35, 0.6);
    e.foe = null;
    let bd = d.range * d.range;
    for (const a of G.allies) {
      if (!a.alive || a.domain !== 'ground') continue;
      const dd = (a.x - e.x) ** 2 + (a.z - e.z) ** 2;
      if (dd < bd) { bd = dd; e.foe = a; }
    }
    if (!e.target || !e.target.alive) {
      e.target = nearestBuilding(e.x, e.z);
      e.path = null;
    }
    if (e.target && !e.path && !e.foe && canPlan()) {
      e.path = landPathTo(e, e.target.tile, 1);
      e.pi = 1;
      // walled off by mountains: march on the Town Hall instead
      if (!e.path && G.hq && e.target !== G.hq) { e.target = G.hq; e.path = landPathTo(e, G.hq.tile, 1); }
      if (!e.path) e.target = null;
    }
  }
  const foe = e.foe && e.foe.alive ? e.foe : null;
  const tgt = foe || e.target;
  if (!tgt) {
    // stranded with nowhere to march: they surrender rather than stall the wave
    e.stuckT = (e.stuckT || 0) + dt;
    if (e.stuckT > 20) { e.gone = true; FX.dust(e.x, e.y, e.z, 0.4); }
    settleY(e, dt);
    return;
  }
  e.stuckT = 0;
  const dist = Math.hypot(tgt.x - e.x, tgt.z - e.z);
  const reach = d.range + (foe ? 0 : 0.6);
  if (dist <= reach) {
    e.vx = e.vz = 0;
    e.yaw += clamp(angleDiff(Math.atan2(tgt.x - e.x, tgt.z - e.z), e.yaw), -8 * dt, 8 * dt);
    if (e.cool <= 0) {
      e.cool = (1 / d.rate) * rnd(0.8, 1.2);
      tracer(e.x, e.y + 0.2, e.z, tgt.x + rnd(-0.2, 0.2), tgt.y + 0.25, tgt.z + rnd(-0.2, 0.2), true);
      if (foe) { if (Math.random() < 0.7) damageEnemy(foe, d.dmg * e.dm); }
      else damageBuilding(tgt, d.dmg * e.dm);
      sfx('rifle', e.x, e.z);
    }
  } else if (e.path) {
    if (followLandPath(e, dt, d.speed)) e.path = null;
  }
  settleY(e, dt);
}

function updateSoldier(s, dt) {
  const d = ALLIES.soldier;
  if (s.dying) { s.gone = true; return; }
  s.think -= dt; s.cool -= dt;
  const home = s.home && s.home.alive ? s.home : null;
  const gx = home ? home.x : s.x, gz = home ? home.z : s.z;
  const guard = home ? home.def.guard : 6;
  if (s.think <= 0) {
    s.think = rnd(0.3, 0.5);
    let best = null, bd = Infinity;
    for (const e of G.enemies) {
      if (!e.alive || e.domain !== 'ground') continue;
      if ((e.x - gx) ** 2 + (e.z - gz) ** 2 > guard * guard) continue;
      const dd = (e.x - s.x) ** 2 + (e.z - s.z) ** 2;
      if (dd < bd) { bd = dd; best = e; }
    }
    if (best !== s.foe) { s.foe = best; s.path = null; s.repath = 0; }
  }
  const f = s.foe && s.foe.alive ? s.foe : null;
  const dmg = d.dmg * G.mod.soldier;
  if (f) {
    const dist = Math.hypot(f.x - s.x, f.z - s.z);
    if (dist <= d.range) {
      s.vx = s.vz = 0;
      s.yaw += clamp(angleDiff(Math.atan2(f.x - s.x, f.z - s.z), s.yaw), -8 * dt, 8 * dt);
      if (s.cool <= 0) {
        s.cool = (1 / d.rate) * rnd(0.8, 1.2);
        tracer(s.x, s.y + 0.2, s.z, f.x + rnd(-0.15, 0.15), f.y + 0.2, f.z + rnd(-0.15, 0.15));
        if (Math.random() < 0.75) damageEnemy(f, dmg, s.home);
        sfx('rifle', s.x, s.z);
      }
    } else {
      s.repath = (s.repath || 0) - dt;
      if ((!s.path || s.repath <= 0) && canPlan()) {
        s.repath = 1.0;
        const ft = tileAt(f.x, f.z);
        s.path = ft >= 0 ? landPathTo(s, ft, 0) : null;
        s.pi = 1;
      }
      if (s.path && s.pi < s.path.length) followLandPath(s, dt, d.speed);
      else moveGround(s, f.x, f.z, d.speed, dt, true);
    }
  } else if (home) {
    const dist = Math.hypot(s.postX - s.x, s.postZ - s.z);
    if (dist > 3.5) {
      s.repath = (s.repath || 0) - dt;
      if ((!s.path || s.repath <= 0) && canPlan()) { s.repath = 2; s.path = landPathTo(s, home.tile, 0); s.pi = 1; }
      if (s.path) { if (followLandPath(s, dt, d.speed)) s.path = null; }
    } else if (dist > 0.15) {
      s.path = null;
      moveGround(s, s.postX, s.postZ, d.speed * 0.6, dt);
    } else { s.vx = s.vz = 0; }
  }
  settleY(s, dt);
}

function updateFighter(f, dt) {
  const d = ALLIES.fighter;
  if (f.dying) { crash(f, dt); return; }
  const home = f.home && f.home.alive ? f.home : null;
  const speed = d.speed * G.mod.fighterSpeed;
  if (f.state === 'parked') {
    if (!home) { f.gone = true; return; }
    parkFighter(f);
    if (!home.connected) return;
    let threat = false;
    for (const e of G.enemies) if (e.alive && (e.domain === 'air' || e.domain === 'sea') && Math.hypot(e.x, e.z) < 42) { threat = true; break; }
    if (threat && G.time >= (home.nextLaunch || 0)) {
      home.nextLaunch = G.time + 1.2;
      f.state = 'takeoff'; f.t = 0; f.speed = 1.5;
      sfx('plane', f.x, f.z);
    }
    return;
  }
  if (f.state === 'takeoff') {
    f.t += dt;
    f.speed = Math.min(speed, f.speed + speed * 0.6 * dt);
    f.vx = Math.sin(f.yaw) * f.speed; f.vz = Math.cos(f.yaw) * f.speed;
    f.x += f.vx * dt; f.z += f.vz * dt;
    if (f.t > 0.8) holdAlt(f, 4.5, dt, 2.2);
    if (f.t > 2.5) { f.state = 'engage'; f.think = 0; }
    return;
  }
  f.think -= dt; f.cool -= dt;
  if (f.think <= 0) {
    f.think = 0.5;
    let best = null, bd = Infinity;
    for (const e of G.enemies) {
      if (!e.alive || (e.domain !== 'air' && e.domain !== 'sea')) continue;
      if (Math.hypot(e.x, e.z) > 40) continue;
      const dd = Math.hypot(e.x - f.x, e.z - f.z) * (e.domain === 'air' ? 0.5 : 1);
      if (dd < bd) { bd = dd; best = e; }
    }
    f.target = best;
    f.state = best ? 'engage' : 'return';
  }
  const t = f.target && f.target.alive ? f.target : null;
  if (f.state === 'engage' && t) {
    const diff = steerPlane(f, t.x - t.vx * 0.2, t.z - t.vz * 0.2, dt, d.turn, speed);
    holdAlt(f, t.domain === 'air' ? t.y : 2.0, dt, 3);
    const dist = Math.hypot(t.x - f.x, t.y - f.y, t.z - f.z);
    if (dist < d.range && Math.abs(diff) < 0.35 && f.cool <= 0) {
      f.cool = 1 / d.rate;
      const hit = Math.random() < d.acc;
      tracer(f.x + Math.sin(f.yaw) * 0.3, f.y, f.z + Math.cos(f.yaw) * 0.3, t.x + rnd(-0.3, 0.3), t.y + 0.1, t.z + rnd(-0.3, 0.3));
      if (hit) damageEnemy(t, d.dmg * G.mod.fighterDmg * (t.domain === 'sea' ? 0.7 : 1), home);
      sfx('mg', f.x, f.z);
    }
  } else {
    // return and land
    if (!home) { leave(f, dt); if (f.gone) return; return; }
    const dist = Math.hypot(home.x - f.x, home.z - f.z);
    steerPlane(f, home.x, home.z, dt, d.turn, dist < 6 ? speed * 0.6 : speed);
    holdAlt(f, dist < 6 ? home.y + 0.6 : 4.5, dt, 2);
    if (dist < 1.2) { f.state = 'parked'; parkFighter(f); }
  }
}

// ------------------------------------------------------------------ main update

export function updateCombat(dt) {
  planBudget = 3;
  updateWave(dt);
  updateBuildings(dt);
  const E = G.enemies;
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    if (e.hitT > 0) e.hitT -= dt;
    if (e.domain === 'sea') updateShip(e, dt);
    else if (e.domain === 'air') updatePlane(e, dt);
    else updateInfantry(e, dt);
  }
  const A = G.allies;
  for (let i = 0; i < A.length; i++) {
    const a = A[i];
    if (a.hitT > 0) a.hitT -= dt;
    if (a.type === 'soldier') updateSoldier(a, dt);
    else updateFighter(a, dt);
  }
  updateProjectiles(dt);
  compact(E);
  compact(A);
}

function compact(list) {
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const u = list[i];
    if (u.gone) {
      if (u.team === 'A' && u.home && u.home.units) {
        const k = u.home.units.indexOf(u);
        if (k >= 0) u.home.units.splice(k, 1);
      }
      continue;
    }
    list[j++] = u;
  }
  list.length = j;
}

export function enemiesAlive() {
  let n = 0;
  for (const e of G.enemies) if (e.alive) n++;
  return n;
}
