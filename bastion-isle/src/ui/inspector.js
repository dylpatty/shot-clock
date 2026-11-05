// Bottom-left inspector for zone lots, towers, structures and ruins (UX concrete spec 5), plus the compact in-world
// card for a selected tower (should_change 1). Skeleton built on selection change, values refreshed at 4 Hz.
import { G } from '../state.js';
import { W, LF, CV, TERRAIN, isLand } from '../world.js';
import { BUILDINGS, BUILD_TYPES, ZONES, MILESTONES, ENEMIES } from '../defs.js';
import { icon } from './icons.js';
import { $, $$, setText, setHTML, setW, setClass, setStyle, esc, fmtMoney, fmtInt, fmtK, roman, errOf, terms } from './util.js';
import { S } from './bridge.js';
import { UI, sound, say } from './ustate.js';
import { BUILD_ICON, DOMAIN_NAME } from './hud.js';
import { project, focus, selectAt, hooks } from '../input.js';

const MODES = [['first', 'First', 'route'], ['nearest', 'Nearest', 'current-location'], ['strongest', 'Strongest', 'sort-descending'], ['weakest', 'Weakest', 'sort-ascending']];
const DOMAIN_ICON = { sea: 'ship', air: 'plane', ground: 'user' };
const REQ = [['road', 'Road', 'road'], ['power', 'Power', 'bolt'], ['water', 'Water', 'droplet'], ['fire', 'Fire', 'flame'], ['police', 'Police', 'shield-check'], ['health', 'Health', 'first-aid-kit'], ['school', 'School', 'school']];
const COVER_OF = { fire: CV.FIRE, police: CV.POLICE, health: CV.HEALTH, school: CV.SCHOOL };

const STREETS = ['Harbour', 'Quay', 'Beacon', 'Chapel', 'Mill', 'Signal', 'Lighthouse', 'Saltmarsh', 'Gull', 'Anchor', 'Ferry', 'Rope', 'Cliff', 'Pier', 'Market', 'Station', 'Garrison', 'Battery', 'Tidewater', 'Kelp', 'Seawall', 'Lantern', 'Breakwater', 'Netmakers', 'Coastguard', 'Pilot', 'Shipwright', 'Orchard', 'Heath', 'Ridge'];
const SUFFIX = ['Street', 'Road', 'Lane', 'Row', 'Way', 'Hill', 'Terrace', 'Walk'];
function hash(i, s) { let h = (i * 374761393 + s * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function lotName(i) {
  if (S.lotName) { const n = S.lotName(i); if (n) return n; }
  let road = -1;
  for (let d = 0; d < 6; d++) { const j = W.nbr[i * 6 + d]; if (j >= 0 && W.road[j]) { road = j; break; } }
  // the street name belongs to a stretch of road (coarse cell), the number to the lot
  const cell = road >= 0 ? Math.floor((W.q[road] + 64) / 4) * 97 + Math.floor((W.r[road] + 64) / 4) : i;
  const st = STREETS[Math.floor(hash(cell, 3) * STREETS.length)] + ' ' + SUFFIX[Math.floor(hash(cell, 5) * SUFFIX.length)];
  return `${1 + Math.floor(hash(i, 9) * 118)} ${st}`;
}

const isTower = (b) => !!(b && b.def && b.def.weapon);
function domainsOf(b) {
  const t = (b.def.weapon && b.def.weapon.targets) || {};
  const list = Object.keys(t).filter((k) => t[k] >= 0.5).sort((a, c) => t[c] - t[a]);
  const two = list.slice(0, 2);
  if (two.length < 2) for (const k of ['sea', 'air', 'ground']) if (!two.includes(k) && two.length < 2) two.push(k);
  return two.map((k) => ({ k, ok: (t[k] || 0) >= 0.5 }));
}
function upkeepOf(b) { return b.upkeep != null ? b.upkeep : (b.def.upkeep || 0) * (1 + 0.5 * ((b.level || 1) - 1)); }
function thumbHTML(type, cls = '') {
  const th = UI.thumbs[type];
  return th ? `<img src="${th}" alt="" class="${cls}">` : `<div class="ph ${cls}">${icon(BUILD_ICON[type] || 'hexagon')}</div>`;
}
function pips(n, max) { let s = ''; for (let k = 1; k <= max; k++) s += `<i class="${k <= n ? 'on' : ''}"></i>`; return `<span class="pips">${s}</span>`; }

function upgradeDeltas(b) {
  if (S.previewUpgrade) {
    const p = S.previewUpgrade(b);
    if (p) return p;
  }
  const L = b.level || 1;
  const f = (k) => Math.round(((1 + k * L) / (1 + k * (L - 1)) - 1) * 100);
  const out = [];
  if (b.def.weapon) out.push(`+${f(0.35)}% damage`, `+${f(0.08)}% range`, `+${f(0.1)}% rate`);
  out.push(`+${f(0.3)}% health`);
  if (b.def.units) out.push(`+1 ${b.type === 'airfield' ? 'fighter' : 'unit'}`);
  if (b.def.upgradeName && L === 1) out.unshift(`Becomes ${b.def.upgradeName}`);
  return out;
}

// ------------------------------------------------------------------ build per selection

export function renderInspector() {
  const box = $('#inspector');
  const s = G.selected;
  UI.sel = s;
  if (!s || G.mode !== 'play') { box.classList.add('hidden'); box.innerHTML = ''; renderTowerCard(); return; }
  box.classList.remove('hidden');
  let html = '';
  if (s.ruin != null) html = ruinHTML(s.ruin);
  else if (s.lot != null) html = lotHTML(s.lot);
  else if (isTower(s)) html = towerHTML(s);
  else if (s.def) html = structHTML(s);
  box.innerHTML = html;
  box.dataset.kind = s.ruin != null ? 'ruin' : s.lot != null ? 'lot' : isTower(s) ? 'tower' : 'struct';
  wire(box, s);
  renderTowerCard();
  updateInspector(true);
}

function head(thumb, name, sub, kind = '') {
  return `<header class="ip-head ${kind}"><div class="ip-thumb">${thumb}</div><div class="ip-title"><h3>${name}</h3><div class="ip-sub" data-k="sub">${sub}</div></div>
    <div class="ip-hbtn"><button class="ib ch" data-act="focus" data-tip="focus">${icon('focus-2')}</button><button class="ib ch" data-act="close" data-tip="close">${icon('x')}</button></div></header>`;
}

function towerHTML(b) {
  const d = b.def;
  const max = d.maxLevel || 1;
  const doms = domainsOf(b);
  const seg = [...MODES.map(([k, l, ic]) => `<button class="ch" data-mode="${k}">${icon(ic)}<span>${l}</span></button>`),
    ...doms.map(({ k, ok }) => `<button class="ch dom-${k}" data-dom="${k}" ${ok ? '' : 'disabled'}>${icon(DOMAIN_ICON[k])}<span>${DOMAIN_NAME[k]}</span></button>`)].join('');
  return `${head(thumbHTML(b.type), esc(d.name), '', 'def')}
  <div class="ip-body">
    <div class="ip-hp"><i data-k="hp"></i><span class="tnum" data-k="hpt"></span></div>
    <div class="ip-row3">
      <div><label>Level</label><span data-k="lvl">${pips(b.level, max)}</span></div>
      <div><label>Kills</label><b class="tnum" data-k="kills">0</b></div>
      <div><label>Damage dealt</label><b class="tnum" data-k="dealt">0</b></div>
    </div>
    <div class="ip-stats" data-k="stats"></div>
    <div class="ip-sect"><span>Targeting</span><small>Shift+click: all ${esc(d.name)}s</small></div>
    <div class="ip-target" data-k="target">${seg}</div>
    <div class="ip-flags" data-k="flags"></div>
    <div class="ip-actions">
      ${d.upgradeCost ? `<button class="btn ch up" data-act="upgrade" data-tip="upgrade"><span data-k="ut">Upgrade</span><b class="tnum" data-k="uc"></b><kbd>U</kbd></button>` : ''}
      ${b.type !== 'hq' ? `<button class="btn ch sell" data-act="sell" data-tip="sell"><span>Sell</span><b class="tnum" data-k="sv"></b></button>` : ''}
    </div>
    <div class="ip-foot"><label class="tg"><input type="checkbox" data-act="range" ${b.showRange === false ? '' : 'checked'}><span>Show range</span></label><span class="tnum" data-k="upk"></span></div>
  </div>`;
}

function structHTML(b) {
  const d = b.def;
  const max = d.maxLevel || 1;
  return `${head(thumbHTML(b.type), esc(b.level > 1 && d.upgradeName ? d.upgradeName : d.name), '', d.kind === 'military' ? 'def' : '')}
  <div class="ip-body">
    <div class="ip-hp"><i data-k="hp"></i><span class="tnum" data-k="hpt"></span></div>
    ${max > 1 ? `<div class="ip-row3"><div><label>Level</label><span data-k="lvl">${pips(b.level, max)}</span></div><div></div><div></div></div>` : ''}
    <div class="ip-stats" data-k="stats"></div>
    <div class="ip-desc">${esc(d.desc || '')}</div>
    <div class="ip-flags" data-k="flags"></div>
    <div class="ip-actions">
      ${b.type === 'college' ? `<button class="btn ch" data-act="research">${icon('flask-2')}<span>Open research</span><kbd>T</kbd></button>` : ''}
      ${d.upgradeCost ? `<button class="btn ch up" data-act="upgrade" data-tip="upgrade"><span data-k="ut">Upgrade</span><b class="tnum" data-k="uc"></b><kbd>U</kbd></button>` : ''}
      ${b.type !== 'hq' ? `<button class="btn ch sell" data-act="sell" data-tip="sell"><span>Sell</span><b class="tnum" data-k="sv"></b></button>` : ''}
    </div>
    <div class="ip-foot"><span></span><span class="tnum" data-k="upk"></span></div>
  </div>`;
}

function lotHTML(i) {
  const z = W.zone[i], Z = ZONES[z] || ZONES[1];
  const zt = `<div class="ph zone z${Z.key}">${icon(z === 1 ? 'home' : z === 2 ? 'building-store' : 'building-factory-2')}</div>`;
  return `${head(zt, esc(lotName(i)), '', 'zone z' + Z.key)}
  <div class="ip-body">
    <div class="ip-lvl"><span data-k="lvl"></span><div class="ip-prog"><i data-k="prog"></i></div><span class="tnum" data-k="progt"></span></div>
    <div class="ip-req" data-k="req">${REQ.map(([k, l, ic]) => `<span class="rq" data-r="${k}" data-tip="req-${k}">${icon(ic)}<small>${l}</small></span>`).join('')}</div>
    <div class="ip-reqnote" data-k="reqnote"></div>
    <div class="ip-stats" data-k="stats"></div>
    <ul class="ip-probs" data-k="probs"></ul>
    <div class="ip-actions">
      <button class="btn ch" data-act="lv" data-tip="lv-break">${icon('chart-area')}<span>Land value</span><b class="tnum" data-k="lvv"></b></button>
      <button class="btn ch sell" data-act="demolish">${icon('bulldozer')}<span>Demolish</span></button>
    </div>
  </div>`;
}

function ruinHTML(i) {
  const type = BUILD_TYPES[W.ruin[i] - 1];
  const d = BUILDINGS[type] || { name: 'building', cost: 0 };
  return `${head(thumbHTML(type, 'ruined'), `Ruins of a ${esc(d.name)}`, 'Destroyed in a raid', 'ruin')}
  <div class="ip-body">
    <div class="ip-desc">Rebuild it on the same spot for 60% of the original price, or clear the rubble.</div>
    <div class="ip-actions">
      <button class="btn ch up" data-act="rebuild"><span>Rebuild</span><b class="tnum">${fmtMoney(Math.round((d.cost || 0) * 0.6))}</b></button>
      <button class="btn ch sell" data-act="clear"><span>Clear rubble</span></button>
    </div>
  </div>`;
}

// ------------------------------------------------------------------ actions

function act(a, s, e) {
  if (a === 'close') { G.selected = null; renderInspector(); return; }
  if (a === 'focus') { const t = s.tile ?? s.lot ?? s.ruin; if (t != null) focus(W.x[t], W.z[t], 22); return; }
  if (a === 'research') { UI.openSheet && UI.openSheet('research'); return; }
  if (a === 'upgrade') {
    const err = errOf(S.upgrade(s));
    if (err) { say(err, 'bad'); sound('error'); } else { sound('upgrade'); say(`${s.def.name} upgraded to level ${s.level}`, 'good', s.x, s.z); }
    renderInspector();
    return;
  }
  if (a === 'sell') {
    const v = S.sellValue(s);
    const err = errOf(S.sell(s));
    if (err) { say(err, 'bad'); sound('error'); return; }
    sound('demolish');
    say(`Sold ${s.def.name} for ${fmtMoney(v)}`, 'info');
    G.selected = null; renderInspector();
    return;
  }
  if (a === 'demolish') {
    const err = errOf(S.bulldoze(s.lot));
    if (err) { say(err, 'bad'); sound('error'); return; }
    sound('demolish');
    renderInspector();
    return;
  }
  if (a === 'rebuild') {
    const r = S.rebuildRuin(s.ruin);
    const err = errOf(r);
    if (err) { say(err, 'bad'); sound('error'); return; }
    sound('build');
    if (r && typeof r === 'object') G.selected = r; else selectAt(s.ruin);
    renderInspector();
    return;
  }
  if (a === 'clear') {
    const err = errOf(S.bulldoze(s.ruin));
    if (err) { say(err, 'bad'); sound('error'); return; }
    sound('demolish'); G.selected = null; renderInspector();
    return;
  }
  if (a === 'lv') { UI.pinTip && UI.pinTip('lv-' + s.lot, e && e.currentTarget); return; }
}

function setTargeting(b, mode, dom, all) {
  const list = all ? G.buildings.filter((x) => x.type === b.type) : [b];
  for (const x of list) S.setTargetMode(x, mode ?? x.targetMode, dom ?? x.domainPref);
  sound('click');
  if (all && list.length > 1) say(`Targeting copied to ${list.length} ${b.def.name}s`, 'info');
  updateInspector(true);
  renderTowerCard();
}

function wire(box, s) {
  for (const b of $$('[data-act]', box)) {
    if (b.tagName === 'INPUT') b.addEventListener('change', () => { s.showRange = b.checked; });
    else b.addEventListener('click', (e) => act(b.dataset.act, s, e));
  }
  for (const b of $$('[data-mode]', box)) b.addEventListener('click', (e) => setTargeting(s, b.dataset.mode, null, e.shiftKey));
  for (const b of $$('[data-dom]', box)) b.addEventListener('click', (e) => setTargeting(s, null, s.domainPref === b.dataset.dom ? 'any' : b.dataset.dom, e.shiftKey));
}

// ------------------------------------------------------------------ 4 Hz refresh

function statRow(label, value, tip) { return `<div${tip ? ` data-tip="${tip}"` : ''}><label>${label}</label><b class="tnum">${value}</b></div>`; }

export function updateInspector(force) {
  const s = G.selected;
  if (s !== UI.sel) { renderInspector(); return; }
  if (!s) return;
  const box = $('#inspector');
  const q = (k) => box.querySelector(`[data-k="${k}"]`);
  if (s.ruin != null) { if (!W.ruin[s.ruin]) { G.selected = null; renderInspector(); } return; }
  if (s.lot != null) { updateLot(s.lot, q); return; }
  const b = s, d = b.def;
  const f = b.maxHp ? b.hp / b.maxHp : 1;
  setW(q('hp'), f);
  setClass(q('hp'), 'mid', f < 0.6); setClass(q('hp'), 'low', f < 0.3);
  setText(q('hpt'), `${fmtInt(b.hp)} / ${fmtInt(b.maxHp)}`);
  const max = d.maxLevel || 1;
  if (q('lvl')) setHTML(q('lvl'), pips(b.level || 1, max));
  setText(q('upk'), upkeepOf(b) ? `${fmtMoney(upkeepOf(b))}/min upkeep` : '');
  const name = b.level > 1 && d.upgradeName ? d.upgradeName : d.name;
  const flags = [];
  if (b.connected === false) flags.push(['bad', 'road-off', 'No road to the Town Hall: not working']);
  if (d.power < 0 && b.powered === false) flags.push(['bad', 'plug-off', b.type === 'missile' ? 'No power: missiles hold fire' : b.type === 'radar' ? 'No power: radar boost off' : 'No power: not working']);
  if (b.lastHit != null && G.time - b.lastHit < 6) flags.push(['bad', 'alert-triangle', 'Under attack']);
  else if (b.hp < b.maxHp) flags.push(['', 'tools', G.money < 0 ? 'Repairs paused: treasury below $0' : 'Repairing']);
  if (b.fire > 0 || (W.fire && W.fire[b.tile])) flags.push(['bad', 'flame', 'On fire']);
  setHTML(q('flags'), flags.map(([c, ic, t]) => `<span class="fl ${c}">${icon(c === 'bad' ? 'alert-triangle' : ic)}${esc(t)}</span>`).join(''));

  if (isTower(b)) {
    setText(q('sub'), `${b.type === 'hq' ? 'Town Hall' : 'Defence'} · Level ${b.level || 1}${b.type !== 'hq' ? ` of ${max}` : ''}`);
    setText(q('kills'), fmtInt(b.kills || 0));
    setText(q('dealt'), fmtInt(b.dmgDealt || 0));
    const ws = S.weaponStats(b) || b.ws || { dmg: d.weapon.dmg, range: d.weapon.range, rate: d.weapon.rate, splash: d.weapon.splash };
    const t = d.weapon.targets;
    const hits = Object.keys(t).filter((k) => t[k] >= 0.5).map((k) => DOMAIN_NAME[k]).join(', ');
    setHTML(q('stats'), statRow('Damage', `${Math.round(ws.dmg)}${ws.splash ? ` <small>area ${ws.splash.toFixed(1)}</small>` : ''}`)
      + statRow('Range', `${ws.range.toFixed(1)}${b.radarBoost ? ' <small class="good">radar +20%</small>' : ''}`)
      + statRow('Fire rate', `${ws.rate.toFixed(2)}/s`) + statRow('Engages', hits));
    for (const btn of $$('[data-mode]', box)) setClass(btn, 'on', (b.targetMode || 'first') === btn.dataset.mode);
    for (const btn of $$('[data-dom]', box)) setClass(btn, 'on', b.domainPref === btn.dataset.dom);
  } else {
    setText(q('sub'), `${d.kind === 'utility' ? 'Utility' : d.kind === 'park' ? 'Park' : d.kind === 'military' ? 'Defence support' : d.kind === 'hq' ? 'Seat of government' : 'Service'}${max > 1 ? ` · Level ${b.level} of ${max}` : ''}`);
    const rows = [];
    if (d.power > 0) rows.push(statRow('Power output', `+${fmtInt(b.output != null ? b.output : d.power)} MW`));
    if (d.water > 0) rows.push(statRow('Water output', `+${fmtInt(d.water)} kL`));
    if (d.power < 0) rows.push(statRow('Power use', `${-d.power} MW`));
    if (d.radius) rows.push(statRow('Coverage', `${b.level > 1 && d.upgradeRadius ? d.upgradeRadius : d.radius} tiles`));
    if (d.trucks) rows.push(statRow('Fire trucks', `${(b.trucksOut != null ? `${b.trucksOut} out · ` : '')}${d.trucks + (G.mod.extraTrucks || 0)}`));
    if (d.officers) rows.push(statRow('Officers', d.officers));
    if (d.crew) rows.push(statRow('Crew', d.crew));
    if (b.units) rows.push(statRow(b.type === 'airfield' ? 'Fighters' : 'Marines', `${b.units.length}`));
    if (d.residents) rows.push(statRow('Residents', d.residents));
    if (d.jobs) rows.push(statRow('Jobs', d.jobs));
    if (b.type === 'hq') rows.push(statRow('Supplies', `${d.power} MW · ${d.water} kL`));
    if (d.pollution) rows.push(statRow('Pollution', `${d.pollution} within ${d.pollRadius}`));
    setHTML(q('stats'), rows.join(''));
    setText(box.querySelector('h3'), name);
  }
  const ub = box.querySelector('[data-act="upgrade"]');
  if (ub) {
    const cost = S.upgradeCost(b);
    const locked = d.upgradeUnlock && (G.milestone || 0) < d.upgradeUnlock && (b.level || 1) === 1;
    setText(q('ut'), cost == null ? 'Fully upgraded' : locked ? `${d.upgradeName || 'Upgrade'} at ${MILESTONES[d.upgradeUnlock].name}` : `Upgrade to L${(b.level || 1) + 1}`);
    setText(q('uc'), cost == null || locked ? '' : fmtMoney(cost));
    ub.disabled = cost == null || locked;
    setClass(ub, 'poor', cost != null && (cost > G.money || G.money < 0));
    ub.dataset.tip = 'upgrade';
  }
  if (q('sv')) setText(q('sv'), `+${fmtMoney(S.sellValue(b))}`);
}

function updateLot(i, q) {
  const z = W.zone[i];
  if (!z) { setText(q('sub'), 'Unzoned land'); return; }
  const Z = ZONES[z], lvl = W.lvl[i], fl = W.flags[i];
  const cap = lvl ? Z.levels[lvl - 1].cap : 0;
  const occ = Math.round((cap * W.occ[i]) / 100);
  const what = z === 1 ? 'residents' : 'jobs';
  setText(q('sub'), lvl ? `${Z.name} L${lvl} · ${occ} ${what}` : fl & LF.RUBBLE ? `${Z.name} · rubble` : `${Z.name} · empty lot`);
  setHTML(q('lvl'), pips(lvl, 3));
  const p = Math.min(90, W.prog[i]);
  setW(q('prog'), lvl >= 3 ? 1 : p / 90);
  setText(q('progt'), lvl >= 3 ? 'Top level' : !lvl ? (fl & LF.BUILDING ? 'Under construction' : 'Waiting for demand') : fl & LF.BUILDING ? 'Rebuilding' : `${Math.round((p / 90) * 100)}% to L${lvl + 1}`);

  // requirement checklist: which services/utilities the lot has, and which the next level needs
  const need = (Z.req[Math.min(2, lvl)] || {});
  const needCover = new Set(need.cover || []);
  const missing = new Set();
  const mr = S.missingRequirements(i);
  if (Array.isArray(mr)) for (const m of mr) { const k = typeof m === 'string' ? m : m.ok === false ? m.key : null; if (k) missing.add(k); }
  const has = {
    road: !!(fl & LF.ROAD), power: !!(fl & LF.POWER), water: !!(fl & LF.WATER),
    fire: !!(W.cover[i] & CV.FIRE), police: !!(W.cover[i] & CV.POLICE), health: !!(W.cover[i] & CV.HEALTH), school: !!(W.cover[i] & CV.SCHOOL),
  };
  for (const el of $$('.rq', $('#inspector'))) {
    const k = el.dataset.r;
    const ok = has[k] && !missing.has(k);
    const needed = k === 'road' || k === 'power' || k === 'water' || needCover.has(k);
    setClass(el, 'ok', ok);
    setClass(el, 'bad', !ok && needed);
    setClass(el, 'need', needed);
  }
  const notes = [];
  if (lvl && lvl < 3) {
    if (need.lv && W.lv[i] < need.lv) notes.push(`land value ${need.lv}+`);
    if (need.milestone && (G.milestone || 0) < need.milestone) notes.push(`${MILESTONES[need.milestone].name} milestone`);
    const cv = [...needCover].filter((k) => !has[k]);
    if (cv.length) notes.push(cv.join(', ') + ' coverage');
  }
  setText(q('reqnote'), lvl >= 3 ? 'Highest level reached.' : notes.length ? `L${lvl + 1} needs ${notes.join(' · ')}` : lvl ? `Meets every L${lvl + 1} requirement: levelling up` : '');
  setClass(q('reqnote'), 'bad', notes.length > 0);

  const t = (G.taxes && G.taxes[Z.key]) ?? 10;
  const staffing = z === 1 ? 1 : G.staffing ?? 1;
  const shelter = fl & LF.SHELTER;
  const tax = lvl && !(fl & LF.ABANDONED) && !shelter ? Z.taxPerHead * t * occ * Z.levelMul[lvl - 1] * staffing * (G.mod.tax || 1) : 0;
  setHTML(q('stats'), statRow('Land value', `${W.lv[i]}`, 'lv-' + i)
    + statRow(z === 1 ? 'Residents' : 'Jobs filled', lvl ? `${occ} / ${cap}` : '—')
    + statRow('Taxes', lvl ? `${fmtMoney(tax)}/min` : '—')
    + statRow('Pollution', W.poll[i] ? `${W.poll[i]}` : 'none'));
  setText(q('lvv'), W.lv[i]);

  const probs = [];
  if (W.fire[i]) probs.push(['flame', 'On fire', `${Math.round((W.fire[i] / 255) * 100)}% intensity`]);
  if (fl & LF.RUBBLE) probs.push(['skull', 'Rubble', 'Clears and regrows when demand returns']);
  if (fl & LF.ABANDONED) probs.push(['home-off', 'Abandoned', 'Pays no tax until power, water and road return']);
  if (!(fl & LF.ROAD)) probs.push(['road-off', 'No road access', 'Needs a road linked to the Town Hall']);
  if (lvl && !(fl & LF.POWER)) probs.push(['plug-off', 'No power', 'Build wind turbines or a gas plant']);
  if (lvl && !(fl & LF.WATER)) probs.push(['droplet-off', 'No water', 'Build a water tower or pump']);
  if (shelter) probs.push(['alert-triangle', 'Sheltering', 'Raiders nearby: no tax']);
  if (fl & LF.UNDERSTAFFED) probs.push(['briefcase', 'Understaffed', 'Not enough workers']);
  setHTML(q('probs'), probs.map(([ic, h, s]) => `<li>${icon(ic)}<b>${h}</b><span>${s}</span></li>`).join(''));
}

// ------------------------------------------------------------------ in-world tower card

export function renderTowerCard() {
  const c = $('#towercard');
  const b = G.selected;
  if (!isTower(b) || b.type === 'hq' || G.mode !== 'play') { c.classList.add('hidden'); c.innerHTML = ''; UI.cardFor = null; return; }
  UI.cardFor = b;
  const max = b.def.maxLevel || 1;
  const cost = S.upgradeCost(b);
  const mode = MODES.find((m) => m[0] === (b.targetMode || 'first')) || MODES[0];
  const dom = b.domainPref && b.domainPref !== 'any' ? ` · ${DOMAIN_NAME[b.domainPref]}` : '';
  const deltas = cost != null ? upgradeDeltas(b) : [];
  c.innerHTML = `<div class="tc-head"><b>${esc(b.def.name)}</b>${pips(b.level || 1, max)}</div>
    <button class="btn ch up" data-act="upgrade" ${cost == null ? 'disabled' : ''}><span>${cost == null ? 'Max level' : `Upgrade L${b.level + 1}`}</span><b class="tnum">${cost == null ? '' : fmtMoney(cost)}</b></button>
    ${deltas.length ? `<div class="tc-delta">${deltas.slice(0, 3).map(esc).join(' · ')}</div>` : ''}
    <div class="tc-row"><button class="btn ch cyc" data-act="cycle" data-tip="cycle">${icon(mode[2])}<span>${mode[1]}</span>${dom ? `<i class="dom-${b.domainPref}">${icon(DOMAIN_ICON[b.domainPref] || 'target')}</i>` : ''}</button><button class="btn ch sell" data-act="sell"><span>Sell</span><b class="tnum">${fmtK(S.sellValue(b))}</b></button></div>`;
  setClass($('[data-act="upgrade"]', c), 'poor', cost != null && cost > G.money);
  c.classList.remove('hidden');
  UI.cardW = c.offsetWidth; UI.cardH = c.offsetHeight; // measured once per render, not per frame
  for (const btn of $$('[data-act]', c)) {
    btn.addEventListener('click', (e) => {
      const a = btn.dataset.act;
      if (a === 'cycle') {
        const k = MODES.findIndex((m) => m[0] === (b.targetMode || 'first'));
        setTargeting(b, MODES[(k + 1) % MODES.length][0], null, e.shiftKey);
      } else act(a, b, e);
    });
  }
}

const _p = { x: 0, y: 0, z: 0 };
// every frame: transform only (no layout), clamped inside the HUD frame
export function placeTowerCard() {
  const b = UI.cardFor;
  if (!b) return;
  const c = $('#towercard');
  if (b !== G.selected || b.alive === false) { renderTowerCard(); return; }
  const on = project(b.x, (b.y || 0) + 1.1, b.z, _p);
  const fr = UI.frameRect;
  if (!on || !fr) { if (!c.classList.contains('off')) c.classList.add('off'); return; }
  const w = UI.cardW || 220, h = UI.cardH || 120;
  const rem = UI.rem || 15;
  let x = _p.x - w / 2, y = _p.y - 2 * rem - h;
  x = Math.max(fr.left, Math.min(fr.right - w, x));
  y = Math.max(fr.top + 5 * rem, Math.min(fr.bottom - 6 * rem - h, y));
  const off = _p.x < 0 || _p.x > innerWidth || _p.y < 0 || _p.y > innerHeight;
  setClass(c, 'off', off);
  const tr = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  if (c._tr !== tr) { c._tr = tr; c.style.transform = tr; }
}

export { hooks, ENEMIES, TERRAIN, isLand, terms };
