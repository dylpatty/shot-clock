#!/usr/bin/env node
// Bastion Isle 2 balance harness: runs scripted bots on the real simulation in plain Node (no rendering),
// at 1x game speed with fixed 1/30 s steps, across seeds; prints pacing against the review's target bands
// (concrete_specs 27), losses, stalls (a raid lasting over 6 min) and per-step sim cost.
//
//   node tests/sim/harness.mjs [seeds=20] [waves=25] [--bots=balanced,nodef,military,nofire] [--jobs=N]
//                              [--seed0=1] [--stress] [--json=out.json] [--override=file.json] [--quiet]
//
// --override applies a JSON patch to defs before each game, e.g. {"ZONES.1.levels.0.cap": 9} (dotted paths),
// to test a defs.js change before requesting it.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';

const BANDS = { 1: [150, 300], 5: [600, 1200], 10: [1800, 3000], 15: [3000, 5000], 25: [6000, 10000] };
const ALL_BOTS = ['balanced', 'nodef', 'military', 'nofire'];

function parseArgs(argv) {
  const a = { seeds: 20, waves: 25, bots: ALL_BOTS, jobs: Math.max(1, os.cpus().length), seed0: 1, stress: false, json: null, override: null, quiet: false };
  const pos = [];
  for (const s of argv) {
    if (s.startsWith('--bots=')) a.bots = s.slice(7).split(',');
    else if (s.startsWith('--jobs=')) a.jobs = +s.slice(7);
    else if (s.startsWith('--seed0=')) a.seed0 = +s.slice(8);
    else if (s === '--stress') a.stress = true;
    else if (s.startsWith('--json=')) a.json = s.slice(7);
    else if (s.startsWith('--override=')) a.override = JSON.parse(readFileSync(s.slice(11), 'utf8'));
    else if (s === '--quiet') a.quiet = true;
    else pos.push(s);
  }
  if (pos[0]) a.seeds = +pos[0];
  if (pos[1]) a.waves = +pos[1];
  return a;
}

// ------------------------------------------------------------------ one game (inside a worker)

async function loadSim() {
  const base = new URL('../../src/', import.meta.url);
  const m = {};
  m.state = await import(new URL('state.js', base));
  m.world = await import(new URL('world.js', base));
  m.defs = await import(new URL('defs.js', base));
  m.game = await import(new URL('sim/game.js', base));
  m.econ = await import(new URL('sim/economy.js', base));
  m.combat = await import(new URL('sim/combat.js', base));
  m.bots = await import(new URL('./bots.mjs', import.meta.url));
  return m;
}

function applyOverride(defs, patch) {
  if (!patch) return;
  for (const path in patch) {
    const keys = path.split('.');
    let o = defs[keys[0]];
    for (let k = 1; k < keys.length - 1; k++) o = o[keys[k]];
    o[keys[keys.length - 1]] = patch[path];
  }
}

function pct(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

async function runGame(m, botKind, seed, maxWaves) {
  const { G, SETTINGS, MSG } = m.state;
  const { W } = m.world;
  SETTINGS.autoPauseRaid = false;
  SETTINGS.autoPauseHQ = false;
  m.game.newGame(seed, 'standard');
  G.mode = 'play';
  const bot = new m.bots.Bot(botKind);
  bot.init();
  const dt = 1 / 30;
  const times = [];
  let botT = 0.5, last = G.wave.state, waveT0 = 0;
  const pacing = {}, stalls = [];
  let peakLots = 0, fireAt10 = null;
  const maxTime = 300 + maxWaves * 600;
  let lastWaveDur = 0;
  const waveDur = [];
  while (G.mode === 'play') {
    const t0 = performance.now();
    m.game.simStep(dt);
    times.push(performance.now() - t0);
    W.lotDirty.length = 0;
    if (MSG.length > 200) MSG.splice(0, MSG.length - 50);
    if (G.hintQueue && G.hintQueue.length > 4) G.hintQueue.length = 0;
    botT += dt;
    if (botT >= 1) { botT -= 1; bot.tick(); }
    const lots = G.lotCounts.R + G.lotCounts.C + G.lotCounts.I;
    if (lots > peakLots) peakLots = lots;
    const st = G.wave.state;
    if (st === 'active' && last !== 'active') {
      const n = G.wave.current;
      pacing[n] = { t: G.time, pop: Math.round(G.pop), money: Math.round(G.money), lots, towers: G.buildings.filter((b) => b.def.kind === 'military').length, lost: G.stats.lotsLost };
      waveT0 = G.time;
      if (n === 10) fireAt10 = { fire: G.stats.lotsLostFire, peak: peakLots };
    }
    if (st === 'active' && G.time - waveT0 > 360 && !stalls.includes(G.wave.current)) stalls.push(G.wave.current);
    if (st === 'prep' && last === 'active') { lastWaveDur = G.time - waveT0; waveDur.push(Math.round(lastWaveDur)); }
    last = st;
    if (G.stats.waves >= maxWaves) break;
    if (G.time > maxTime) break;
  }
  times.sort((a, b) => a - b);
  let sum = 0;
  for (const t of times) sum += t;
  const outcome = G.mode === 'over' ? G.gameOver : G.stats.waves >= maxWaves ? 'reached' : 'timeout';
  return {
    bot: botKind, seed, outcome, waves: G.stats.waves, time: Math.round(G.time), pacing, stalls,
    lotsLost: G.stats.lotsLost, lotsLostFire: G.stats.lotsLostFire, ownLost: G.stats.lost, peakLots, fireAt10,
    finalPop: Math.round(G.pop), finalMoney: Math.round(G.money), milestone: G.milestone,
    stepAvg: sum / times.length, stepP99: pct(times, 0.99), stepMax: times[times.length - 1], waveDur,
    buildings: countTypes(G.buildings), kills: G.stats.kills,
  };
}
function countTypes(list) {
  const o = {};
  for (const b of list) o[b.type] = (o[b.type] || 0) + 1;
  return o;
}

// Late-game cost profile: a synthetic 8k city, ~60 towers and 150 live enemies
async function runStress(m, seed) {
  const { G, SETTINGS } = m.state;
  const { W, LF } = m.world;
  const { ZONES } = m.defs;
  SETTINGS.autoPauseRaid = false; SETTINGS.autoPauseHQ = false;
  m.game.newGame(seed, 'sandbox');
  G.mode = 'play';
  const bot = new m.bots.Bot('balanced');
  bot.init();
  G.money = 1e7;
  bot.extendRoads(10000);
  m.game.recomputeConnectivity();
  const front = bot.frontage();
  const zonesMod = await import(new URL('../../src/sim/zones.js', new URL('../../src/', import.meta.url)));
  // utilities first, then zone everything else and force full lots
  let k = 0;
  const place = (type, n) => { for (let c = 0; c < n && k < front.length; k++) if (typeof m.game.placeBuilding(type, front[k]) !== 'string') c++; };
  place('wind', 30); G.milestone = 4; place('gas', 3); place('pump', 4); place('watertower', 10);
  place('fire', 6); place('police', 6); place('clinic', 6); place('school', 6); place('park', 10);
  for (const t of ['mg', 'coastal', 'flak', 'missile']) place(t, 12);
  place('barracks', 3); place('radar', 1); place('airfield', 1);
  const rest = front.slice(k).filter((i) => !W.bld[i]);
  for (let j = 0; j < rest.length; j++) {
    const i = rest[j];
    const z = j % 10 < 6 ? 1 : j % 10 < 8 ? 2 : 3;
    if (zonesMod.zonePaint([i], z)) { W.lvl[i] = j % 3 === 0 ? 3 : 2; W.occ[i] = 100; W.lotHp[i] = ZONES[z].levels[W.lvl[i] - 1].hp; W.flags[i] |= LF.ROAD; }
  }
  G.raidsOn = true;
  for (let s = 0; s < 90; s++) { m.game.simStep(1 / 30); W.lotDirty.length = 0; }
  // 150 enemies
  const types = ['gunboat', 'destroyer', 'landing', 'fighter', 'bomber', 'jet'];
  for (let e = 0; e < 120; e++) m.combat.spawnEnemy(types[e % types.length], (e / 120) * Math.PI * 2, 18);
  for (let e = 0; e < 30; e++) { const t = W.landing[e * 3 % W.landing.length]; m.combat.spawnInfantry(W.x[t], W.z[t], 18); }
  G.wave.state = 'active'; G.wave.current = 18; G.wave.queue = []; G.wave.lastSpawn = 0; G.wave.elapsed = 0;
  const times = [];
  let maxEn = 0;
  for (let s = 0; s < 30 * 60; s++) {
    if (s % 300 === 0) while (m.combat.enemiesAlive() < 150) { const t = types[Math.floor(Math.random() * types.length)]; m.combat.spawnEnemy(t, Math.random() * 6.28, 18); }
    const t0 = performance.now();
    m.game.simStep(1 / 30);
    times.push(performance.now() - t0);
    W.lotDirty.length = 0;
    maxEn = Math.max(maxEn, m.combat.enemiesAlive());
    if (G.mode !== 'play') { G.mode = 'play'; }
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return { pop: Math.round(G.pop), lots: G.lotCounts.R + G.lotCounts.C + G.lotCounts.I, buildings: G.buildings.length, enemies: maxEn, avg, p99: pct(times, 0.99), max: times[times.length - 1] };
}

async function worker() {
  const m = await loadSim();
  applyOverride(m.defs, workerData.override);
  parentPort.on('message', async (task) => {
    if (task === 'exit') process.exit(0);
    try {
      const r = task.stress ? await runStress(m, task.seed) : await runGame(m, task.bot, task.seed, task.waves);
      parentPort.postMessage({ ok: true, r, task });
    } catch (err) {
      parentPort.postMessage({ ok: false, err: String(err && err.stack || err), task });
    }
  });
  parentPort.postMessage({ ready: true });
}

// ------------------------------------------------------------------ main

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const tasks = [];
  if (a.stress) tasks.push({ stress: true, seed: a.seed0 });
  else for (const bot of a.bots) for (let s = 0; s < a.seeds; s++) tasks.push({ bot, seed: a.seed0 + s, waves: a.waves });
  const results = [];
  const t0 = Date.now();
  await new Promise((resolve) => {
    let next = 0, done = 0;
    const n = Math.min(a.jobs, tasks.length);
    for (let w = 0; w < n; w++) {
      const wk = new Worker(fileURLToPath(import.meta.url), { workerData: { override: a.override } });
      const feed = () => { if (next < tasks.length) wk.postMessage(tasks[next++]); else wk.postMessage('exit'); };
      wk.on('message', (msg) => {
        if (msg.ready) { feed(); return; }
        done++;
        if (msg.ok) results.push(msg.r); else console.error('FAILED', msg.task, msg.err);
        if (!a.quiet && msg.ok && !msg.r.avg) {
          const r = msg.r;
          console.log(`  ${r.bot.padEnd(9)} seed ${String(r.seed).padStart(3)}: ${r.outcome.padEnd(8)} wave ${String(r.waves).padStart(2)}  pop ${String(r.finalPop).padStart(5)}  $${String(r.finalMoney).padStart(7)}  lost ${r.lotsLost} (fire ${r.lotsLostFire})  step ${r.stepAvg.toFixed(3)}/${r.stepP99.toFixed(3)} ms`);
        }
        if (done === tasks.length) resolve();
        else feed();
      });
      wk.on('error', (e) => { console.error(e); });
    }
  });
  if (a.stress) {
    const r = results[0];
    console.log(`\nSTRESS (seed ${a.seed0}): pop ${r.pop}, lots ${r.lots}, structures ${r.buildings}, live enemies ${r.enemies}`);
    console.log(`  sim step: avg ${r.avg.toFixed(3)} ms, p99 ${r.p99.toFixed(3)} ms, max ${r.max.toFixed(2)} ms`);
    return;
  }
  report(results, a);
  console.log(`\n(${tasks.length} games in ${((Date.now() - t0) / 1000).toFixed(0)} s on ${Math.min(a.jobs, tasks.length)} workers)`);
  if (a.json) writeFileSync(a.json, JSON.stringify(results, null, 1));
}

function median(a) { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }
const fmt = (v) => (Number.isFinite(v) ? Math.round(v).toLocaleString('en-US') : '-');

function report(results, a) {
  for (const bot of a.bots) {
    const R = results.filter((r) => r.bot === bot).sort((x, y) => x.seed - y.seed);
    if (!R.length) continue;
    console.log(`\n=== ${bot} (${R.length} seeds, target ${a.waves} waves)`);
    console.log('wave | band          | pop median (min-max)      | in band | money median | reached');
    for (const n of [1, 5, 10, 15, 20, 25]) {
      if (n > a.waves) continue;
      const rows = R.filter((r) => r.pacing[n]);
      const pops = rows.map((r) => r.pacing[n].pop), money = rows.map((r) => r.pacing[n].money);
      const band = BANDS[n];
      const inBand = band ? rows.filter((r) => r.pacing[n].pop >= band[0] && r.pacing[n].pop <= band[1]).length : null;
      const bandTxt = band ? `${band[0]}-${band[1]}`.padEnd(13) : '-'.padEnd(13);
      console.log(`${String(n).padStart(4)} | ${bandTxt} | ${(fmt(median(pops)) + ' (' + fmt(Math.min(...pops)) + '-' + fmt(Math.max(...pops)) + ')').padEnd(25)} | ${inBand == null ? '  -  ' : (inBand + '/' + rows.length).padStart(5)}   | ${fmt(median(money)).padStart(12)} | ${rows.length}/${R.length}`);
    }
    const out = {};
    for (const r of R) out[r.outcome] = (out[r.outcome] || 0) + 1;
    const lossWaves = R.filter((r) => r.outcome === 'hq' || r.outcome === 'bankrupt').map((r) => r.waves + 1);
    console.log(`outcomes: ${Object.entries(out).map(([k, v]) => `${k} ${v}`).join(', ')}${lossWaves.length ? `; lost during wave ${lossWaves.sort((x, y) => x - y).join(',')}` : ''}`);
    const w1 = R.filter((r) => r.pacing[1]).map((r) => r.pacing[1].money);
    console.log(`money at wave 1: median $${fmt(median(w1))}, >= $8k in ${w1.filter((v) => v >= 8000).length}/${w1.length}`);
    const fireShare = R.filter((r) => r.fireAt10).map((r) => r.fireAt10.fire / Math.max(1, r.fireAt10.peak));
    console.log(`lots lost: median ${fmt(median(R.map((r) => r.lotsLost)))} (to fire ${fmt(median(R.map((r) => r.lotsLostFire)))}); own structures lost median ${fmt(median(R.map((r) => r.ownLost)))}`);
    if (fireShare.length) console.log(`lost to fire by wave 10 / peak lots: median ${(median(fireShare) * 100).toFixed(0)}%, >= 20% in ${fireShare.filter((v) => v >= 0.2).length}/${fireShare.length}`);
    const stalls = R.filter((r) => r.stalls.length);
    console.log(`stalls (raid > 6 min): ${stalls.length ? stalls.map((r) => `seed ${r.seed} wave ${r.stalls.join('/')}`).join('; ') : 'none'}`);
    const dur = R.flatMap((r) => r.waveDur);
    console.log(`raid length: median ${fmt(median(dur))} s, max ${fmt(Math.max(...dur))} s`);
    console.log(`sim step: avg ${(R.reduce((s, r) => s + r.stepAvg, 0) / R.length).toFixed(3)} ms, p99 ${median(R.map((r) => r.stepP99)).toFixed(3)} ms (median of seeds), worst ${Math.max(...R.map((r) => r.stepMax)).toFixed(2)} ms`);
  }
}

if (isMainThread) main(); else worker();
