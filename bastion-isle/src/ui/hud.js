// Top row (city card, milestone/threat chips, raid clock, status cluster) and the bottom command dock with its card
// drawers and RCI widget. Text updates are diffed and throttled by the caller (index.js): 4 Hz text, 10 Hz bars.
import { G, SETTINGS } from '../state.js';
import { W } from '../world.js';
import { BUILDINGS, DOCK, ZONES, MILESTONES, ENEMIES, MONEY, DIFFICULTY, AIM_TEXT } from '../defs.js';
import { icon } from './icons.js';
import { $, $$, el, setText, setHTML, setW, setClass, setStyle, setAttr, fmtMoney, fmtSignedMoney, fmtInt, fmtTime, fmtK, compassName, esc } from './util.js';
import { S } from './bridge.js';
import { setTool, TOOL, setBrush, BRUSH_SIZES } from '../input.js';
import { UI, sound, say } from './ustate.js';

// ------------------------------------------------------------------ static data for the dock

export const ENEMY_ICON = { gunboat: 'speedboat', landing: 'sailboat', destroyer: 'ship', battleship: 'ship', fighter: 'plane', bomber: 'plane-inflight', jet: 'plane-departure', infantry: 'user' };
export const BUILD_ICON = {
  hq: 'building-bank', park: 'trees', plaza: 'fountain', fire: 'flame', police: 'shield-check', clinic: 'first-aid-kit', school: 'school',
  college: 'books', wind: 'building-wind-turbine', gas: 'building-factory', watertower: 'droplet', pump: 'ripple',
  mg: 'crosshair', coastal: 'target', flak: 'target-arrow', barracks: 'helmet', radar: 'radar', missile: 'rocket', airfield: 'plane',
};
const CAT_ICON = { roads: 'road', zoning: 'hexagons', power: 'bolt', water: 'droplet', services: 'building-bank', parks: 'trees', coastal: 'anchor', air: 'rocket', support: 'radar-2' };
const CAT_KEY = { roads: 'R', zoning: 'Z' };
const CAT_SHORT = { air: 'Anti-air' }; // dock labels must fit a 4rem button at 0.72rem
const CAT_BLURB = {
  roads: 'Streets connect every lot and building to the Town Hall. Drag to lay a route; it avoids buildings.',
  zoning: 'Paint lots next to roads. Buildings grow where there is demand, power and water.',
  power: 'One power grid spans the Town Hall road network. Lots and high-tech defences need it.',
  water: 'Water supply is shared across the network like power.',
  services: 'Coverage raises land value and unlocks higher building levels.',
  parks: 'Green space and squares raise land value nearby.',
  coastal: 'Hold the shoreline against ships and landing parties.',
  air: 'Bring down bombers and strike jets before they reach the city.',
  support: 'Marines, sensors and the War College.',
};
export const DOMAIN_NAME = { sea: 'Ships', air: 'Aircraft', ground: 'Troops' };
const DOMAIN_IC = { sea: 'ship', air: 'plane', ground: 'user' };
// card stat line with domain glyphs for weapons ('Range 13 · [ship][user]')
export function keyStatHTML(type) {
  const d = BUILDINGS[type];
  if (d.weapon) {
    const t = d.weapon.targets;
    const doms = ['sea', 'air', 'ground'].filter((k) => (t[k] || 0) >= 0.5);
    return `Range ${Math.round(d.weapon.range * (G.mod.range || 1))} · <span class="doms">${doms.map((k) => `<i class="dm-${k}">${icon(DOMAIN_IC[k])}</i>`).join('')}</span>`;
  }
  return esc(keyStat(type));
}

export function milestoneOf(type) {
  const d = BUILDINGS[type];
  return MILESTONES[d.unlock || 0];
}

// one card's key stat line
export function keyStat(type) {
  const d = BUILDINGS[type];
  if (d.weapon) {
    const t = Object.keys(d.weapon.targets).filter((k) => d.weapon.targets[k] >= 0.5).map((k) => DOMAIN_NAME[k]).join(', ');
    return `Range ${Math.round(d.weapon.range * (G.mod.range || 1))} · ${t}`;
  }
  if (type === 'barracks') return `${d.units} marines · Troops`;
  if (type === 'airfield') return `${d.units} interceptors · ${-d.power} MW`;
  if (type === 'radar') return `+20% range · ${-d.power} MW`;
  if (d.power > 0) return `+${d.power} MW${d.powerBonus ? ` (${d.power + d.powerBonus} hills/coast)` : ''}`;
  if (d.water > 0) return `+${d.water} kL water`;
  if (d.radius && d.cover) return `Radius ${d.radius} · ${d.cover === 'health' ? 'health' : d.cover}`;
  if (type === 'college') return 'Unlocks research · 1 only';
  return '';
}

// ------------------------------------------------------------------ build

export function buildTop(frame) {
  frame.insertAdjacentHTML('beforeend', `
  <section id="citycard" class="panel ch" data-tip="money">
    <div class="cc-money">
      <div class="cc-label">${icon('wallet')}<span>Treasury</span></div>
      <div class="cc-mrow"><span class="cc-big tnum" data-k="money">$0</span><span class="cc-delta tnum" data-k="delta">+$0/min</span></div>
    </div>
    <div class="cc-div"></div>
    <div class="cc-pop" data-tip="pop">
      <div class="cc-label">${icon('users')}<span>Population</span></div>
      <div class="cc-mid tnum"><span data-k="pop">0</span><i data-k="trend"></i></div>
      <div class="cc-sub tnum" data-k="jobs">0 jobs</div>
    </div>
    <button class="cc-open ch" data-act="budget" data-tip="budget-btn" aria-label="Open budget">${icon('report-money')}<kbd>B</kbd></button>
  </section>
  <div id="chips">
    <div class="chip ms" data-tip="milestone">${icon('award')}<span data-k="ms">Settlement</span><b class="tnum" data-k="msn"></b><i class="bar"><i data-k="msbar"></i></i></div>
    <div class="chip threat" data-tip="threat">${icon('activity')}<span>Threat</span><b class="tnum" data-k="threat">×1.00</b></div>
    <div class="chip bad hidden" data-k="blockade" data-tip="blockade">${icon('ship')}<span>Blockade</span><b>−25% shop income</b></div>
    <div class="chip crit hidden" data-k="bankrupt" data-tip="bankrupt">${icon('alert-triangle')}<span>Bankrupt in</span><b class="tnum" data-k="bkt">0:00</b></div>
    <div class="chip warn hidden" data-k="fires" data-tip="fires">${icon('flame')}<b class="tnum" data-k="firen">0</b><span>fires</span></div>
  </div>
  <section id="raidclock" class="panel" data-state="prep">
    <div class="rc-main">
      <div class="rc-badge"><span>RAID</span><b class="tnum" data-k="wn">1</b></div>
      <div class="rc-body">
        <div class="rc-line"><span data-k="rclabel">Next raid</span><b class="tnum" data-k="rctime">0:00</b><span class="rc-paused">${icon('player-pause')}PAUSED</span></div>
        <div class="rc-bar"><i data-k="rcbar"></i></div>
      </div>
      <div class="rc-comp" data-k="comp"></div>
      <button class="rc-early ch" data-act="early" data-tip="early"><span data-k="earlyt">Call early</span><b class="tnum" data-k="earlyv">+$0</b><kbd>N</kbd></button>
      <div class="rc-hq ch" data-k="hq" data-tip="hq"><span>${icon('building-bank')}Town Hall</span><b class="tnum" data-k="hqv">100%</b><i class="bar"><i data-k="hqbar"></i></i></div>
      <button class="rc-pin" data-act="pin" aria-label="Pin raid details">${icon('chevron-down')}</button>
    </div>
    <div class="rc-more">
      <div class="rc-rose" data-k="rose"></div>
      <div class="rc-detail">
        <div class="rc-dir" data-k="dir"></div>
        <ul class="rc-targets" data-k="targets"></ul>
        <div class="rc-foot"><span data-k="reward"></span><span data-k="radar"></span></div>
      </div>
    </div>
  </section>
  <div id="banner" class="hidden"><div class="bn-in">${icon('alert-octagon')}<span data-k="bntext"></span></div></div>
  <section id="status" class="panel">
    <div class="st-util" data-tip="power">${icon('bolt', 'pw')}<div><div class="st-v tnum"><b data-k="pw">0</b><span>/<i data-k="pwc">0</i> MW</span></div><i class="bar pw"><i data-k="pwbar"></i></i></div></div>
    <div class="st-util" data-tip="water">${icon('droplet', 'wt')}<div><div class="st-v tnum"><b data-k="wt">0</b><span>/<i data-k="wtc">0</i> kL</span></div><i class="bar wt"><i data-k="wtbar"></i></i></div></div>
    <div class="st-clock tnum" data-tip="clock"><span data-k="todi">${icon('sun')}</span><b data-k="tod">12:00</b></div>
    <div class="st-speed">
      <button class="ch" data-speed="0" data-tip="speed-0">${icon('player-pause')}</button>
      <button class="ch" data-speed="1" data-tip="speed-1"><span>1×</span></button>
      <button class="ch" data-speed="2" data-tip="speed-2"><span>2×</span></button>
      <button class="ch" data-speed="3" data-tip="speed-3"><span>3×</span></button>
    </div>
    <button class="st-menu ch" data-act="menu" data-tip="menu-btn">${icon('menu-2')}</button>
  </section>`);
}

export function buildDock(frame) {
  const btn = (c, half) => `<button class="dk-btn ch ${half}" data-cat="${c.key}" data-tip="cat-${c.key}">${icon(CAT_ICON[c.key])}<span>${CAT_SHORT[c.key] || c.name}</span>${CAT_KEY[c.key] ? `<kbd>${CAT_KEY[c.key]}</kbd>` : ''}</button>`;
  frame.insertAdjacentHTML('beforeend', `
  <div id="drawer" class="panel hidden"></div>
  <nav id="dock" class="panel">
    <div id="rci" data-tip="rci">
      <div class="rci-bars">
        ${['R', 'C', 'I'].map((k) => `<div class="rci-col" data-z="${k}" data-tip="demand-${k}"><div class="rci-track"><i data-k="d${k}"></i></div><span>${k}</span></div>`).join('')}
      </div>
      <div class="rci-cap">Demand</div>
    </div>
    <div class="dk-half civic">${DOCK.civic.map((c) => btn(c, 'civ')).join('')}</div>
    <div class="dk-hazard" aria-hidden="true"></div>
    <div class="dk-half defence">${DOCK.defence.map((c) => btn(c, 'def')).join('')}</div>
    <div class="dk-div" aria-hidden="true"></div>
    <div class="dk-half tools">
      <button class="dk-btn ch" data-act="bulldoze" data-tip="tool-bulldoze">${icon('bulldozer')}<span>Bulldoze</span><kbd>X</kbd></button>
      <button class="dk-btn ch" data-act="research" data-tip="tool-research">${icon('flask-2')}<span>Research</span><kbd>T</kbd></button>
    </div>
  </nav>`);
}

// ------------------------------------------------------------------ drawer

function cardHTML(type, k) {
  const d = BUILDINGS[type];
  const th = UI.thumbs[type];
  return `<button class="card ch" data-type="${type}" data-tip="b-${type}">
    <div class="cd-thumb ${th ? '' : 'ph'}">${th ? `<img src="${th}" alt="">` : icon(BUILD_ICON[type] || 'hexagon', 'cd-ph')}<kbd>${(k + 1) % 10}</kbd></div>
    <div class="cd-name">${esc(d.name)}</div>
    <div class="cd-cost tnum"><b data-k="cost">${fmtMoney(d.cost)}</b><span> · ${fmtMoney(d.upkeep)}/min</span></div>
    <div class="cd-stat">${keyStatHTML(type)}</div>
    <div class="cd-lock">${icon('lock')}<span data-k="lock"></span></div>
  </button>`;
}

function zoneCardHTML(z, k) {
  const Z = ZONES[z];
  const range = Z.levels.map((l) => l.cap).join(' / ');
  const what = z === 1 ? 'residents' : 'jobs';
  return `<button class="card ch zonecard" data-zone="${z}" data-tip="zone-${Z.key}">
    <div class="cd-thumb zt z${Z.key}"><div class="zt-pat"></div>${icon(z === 1 ? 'home' : z === 2 ? 'building-store' : 'building-factory-2', 'cd-ph')}<kbd>${k + 1}</kbd>
      <div class="zt-dem"><i data-k="zd${Z.key}"></i></div></div>
    <div class="cd-name">${Z.name}</div>
    <div class="cd-cost tnum"><b class="free">Free</b><span> · demand <i data-k="zdv${Z.key}">0</i></span></div>
    <div class="cd-stat">${range} ${what} · L1–L3</div>
  </button>`;
}

// toggles from the dock; force keeps it open (hotkeys, advisor actions, tests)
export function openDrawer(cat, force) {
  const dr = $('#drawer');
  if (!cat || (UI.drawer === cat && !force)) { closeDrawer(); return; }
  UI.drawer = cat;
  const all = [...DOCK.civic, ...DOCK.defence];
  const c = all.find((x) => x.key === cat);
  if (!c) { closeDrawer(); return; }
  const isDef = DOCK.defence.includes(c);
  let head = `<div class="dr-head"><div class="dr-title ${isDef ? 'def' : ''}">${icon(CAT_ICON[cat])}<b>${esc(c.name)}</b></div><div class="dr-blurb">${CAT_BLURB[cat] || ''}</div>`;
  let cards = '';
  if (cat === 'zoning') {
    head += `<div class="dr-ctl"><span class="dr-hint"><kbd>Shift</kbd> fill along road · <kbd>[</kbd><kbd>]</kbd> brush</span>
      <div class="seg" data-k="brush">${BRUSH_SIZES.map((n, r) => `<button class="ch" data-brush="${r}">${n}</button>`).join('')}</div></div>`;
    cards = [1, 2, 3].map((z, k) => zoneCardHTML(z, k)).join('') + `<button class="card ch zonecard" data-dezone="1" data-tip="dezone">
      <div class="cd-thumb zt zX">${icon('eraser', 'cd-ph')}<kbd>4</kbd></div>
      <div class="cd-name">De-zone</div><div class="cd-cost"><b class="free">Free</b></div><div class="cd-stat">Buildings stay until bulldozed</div></button>`;
  } else if (cat === 'roads') {
    head += `<div class="dr-ctl"><span class="dr-hint">Drag to plan · release to build · right-click cancels</span></div>`;
    cards = `<button class="card ch" data-road="1" data-tip="tool-road">
      <div class="cd-thumb ph road">${icon('road', 'cd-ph')}<kbd>1</kbd></div>
      <div class="cd-name">Street</div>
      <div class="cd-cost tnum"><b>$40</b><span> · $1.5/min</span></div>
      <div class="cd-stat">+$10 hills · +$20 forest</div></button>`;
  } else {
    cards = (c.items || []).map((t, k) => cardHTML(t, k)).join('');
  }
  dr.innerHTML = `${head}</div><div class="dr-cards">${cards}</div>`;
  dr.classList.remove('hidden');
  dr.classList.toggle('def', isDef);
  for (const b of $$('.card[data-type]', dr)) b.addEventListener('click', () => pickBuilding(b.dataset.type));
  for (const b of $$('.card[data-zone]', dr)) b.addEventListener('click', () => pickZone(+b.dataset.zone));
  for (const b of $$('.card[data-dezone]', dr)) b.addEventListener('click', () => toggleTool({ kind: 'dezone' }));
  for (const b of $$('.card[data-road]', dr)) b.addEventListener('click', () => toggleTool({ kind: 'road' }, true));
  for (const b of $$('[data-brush]', dr)) b.addEventListener('click', () => { setBrush(+b.dataset.brush); sound('click'); refreshDrawer(); });
  if (cat === 'roads' && !(G.tool && G.tool.kind === 'road')) toggleTool({ kind: 'road' }, true);
  if (cat === 'zoning' && !(G.tool && (G.tool.kind === 'zone' || G.tool.kind === 'dezone'))) pickZone(UI.lastZone || 1, true);
  refreshDock();
  refreshDrawer();
}

export function closeDrawer() {
  UI.drawer = null;
  const dr = $('#drawer');
  dr.classList.add('hidden');
  dr.innerHTML = '';
  refreshDock();
}

// 1-0 inside the open drawer
export function pickCard(n) {
  const dr = $('#drawer');
  if (!UI.drawer) return false;
  const cards = $$('.card', dr);
  const c = cards[n];
  if (!c) return false;
  c.click();
  return true;
}

export function pickBuilding(type) {
  const d = BUILDINGS[type];
  if (!S.isUnlocked(type)) { say(`${d.name} unlocks at ${milestoneOf(type).name}`, 'bad'); sound('error'); return; }
  if (d.unique && G.buildings.some((b) => b.type === type)) { say(`Only one ${d.name} can be built`, 'bad'); sound('error'); return; }
  toggleTool({ kind: 'build', type });
}
export function pickZone(z, keep) {
  UI.lastZone = z;
  const cur = G.tool;
  if (!keep && cur && cur.kind === 'zone' && cur.zone === z) { setTool(null); sound('click'); refreshDock(); refreshDrawer(); return; }
  setTool({ kind: 'zone', zone: z, brush: TOOL.brush });
  sound('click');
  refreshDock(); refreshDrawer();
}
export function toggleTool(tool, keep) {
  const cur = G.tool;
  const same = cur && cur.kind === tool.kind && cur.type === tool.type && cur.zone === tool.zone;
  setTool(same && !keep ? null : tool);
  sound('click');
  refreshDock(); refreshDrawer();
}

export function refreshDock() {
  const t = G.tool;
  for (const b of $$('#dock [data-cat]')) setClass(b, 'on', UI.drawer === b.dataset.cat);
  setClass($('#dock [data-act="bulldoze"]'), 'on', !!(t && t.kind === 'bulldoze'));
  setClass($('#dock [data-act="research"]'), 'on', UI.sheet === 'research');
}

// cards: locked / unaffordable / active (2-4 Hz while the drawer is open)
export function refreshDrawer() {
  const dr = $('#drawer');
  if (!UI.drawer) return;
  const t = G.tool;
  for (const c of $$('.card[data-type]', dr)) {
    const type = c.dataset.type, d = BUILDINGS[type];
    const locked = !S.isUnlocked(type);
    const done = d.unique && G.buildings.some((b) => b.type === type);
    setClass(c, 'locked', locked || done);
    setClass(c, 'poor', !locked && (d.cost > G.money || G.money < 0));
    setClass(c, 'on', !!(t && t.kind === 'build' && t.type === type));
    if (locked) {
      const m = milestoneOf(type);
      setText($('[data-k="lock"]', c), `${m.name} · ${fmtInt(m.pop)} people or raid ${m.wave}`);
    } else if (done) setText($('[data-k="lock"]', c), 'Already built');
  }
  for (const c of $$('.card[data-zone]', dr)) {
    const z = +c.dataset.zone, k = ZONES[z].key;
    setClass(c, 'on', !!(t && t.kind === 'zone' && t.zone === z));
    const v = Math.round((G.demand && G.demand[k]) || 0);
    setText($(`[data-k="zdv${k}"]`, c), (v > 0 ? '+' : '') + v);
    const bar = $(`[data-k="zd${k}"]`, c);
    setStyle(bar, 'height', `${Math.min(100, Math.abs(v))}%`);
    setClass(bar, 'neg', v < 0);
  }
  for (const c of $$('.card[data-dezone]', dr)) setClass(c, 'on', !!(t && t.kind === 'dezone'));
  for (const c of $$('.card[data-road]', dr)) setClass(c, 'on', !!(t && t.kind === 'road'));
  for (const b of $$('[data-brush]', dr)) setClass(b, 'on', +b.dataset.brush === TOOL.brush);
}

// ------------------------------------------------------------------ periodic updates

const popHist = [];
let popT = 0;

export function updateTopText(dt) {
  const q = (k) => UI.k[k] || (UI.k[k] = $(`[data-k="${k}"]`));
  setText(q('money'), fmtMoney(G.money));
  setClass(q('money'), 'neg', G.money < 0);
  const net = G.netPerMin || 0;
  setText(q('delta'), `${fmtSignedMoney(net)}/min`);
  setClass(q('delta'), 'good', net >= 0);
  setClass(q('delta'), 'bad', net < 0);
  setText(q('pop'), fmtInt(G.pop));
  popT -= dt;
  if (popT <= 0) { popT = 5; popHist.push(G.pop); if (popHist.length > 7) popHist.shift(); }
  const d = popHist.length > 1 ? G.pop - popHist[0] : 0;
  setHTML(q('trend'), d > 0.5 ? icon('trending-up') : d < -0.5 ? icon('trending-down') : '');
  setClass(q('trend'), 'down', d < -0.5);
  const jobs = (G.jobs.gov || 0) + (G.jobs.C || 0) + (G.jobs.I || 0);
  setText(q('jobs'), `${fmtInt(jobs)} jobs · ${Math.round((G.unemployment || 0) * 100)}% jobless`);

  // milestone and threat chips
  const next = MILESTONES[(G.milestone || 0) + 1];
  setText(q('ms'), next ? `${MILESTONES[G.milestone || 0].name} → ${next.name}` : MILESTONES[G.milestone || 0].name);
  setText(q('msn'), next ? `${fmtInt(G.pop)} / ${fmtInt(next.pop)}` : 'Top tier');
  setW(q('msbar'), next ? Math.max(G.pop / next.pop, ((G.wave.n || 1) - 1) / next.wave) : 1);
  setText(q('threat'), `×${(G.threat || 1).toFixed(2)}`);
  setClass(q('threat').parentNode, 'warn', (G.threat || 1) >= 1.3);
  setClass(q('blockade'), 'hidden', !G.blockade);
  const deep = G.overdraftT > 0, neg = G.negT > 0;
  setClass(q('bankrupt'), 'hidden', !(deep || neg));
  if (deep || neg) {
    const left = Math.min(deep ? MONEY.bankruptDeep - G.overdraftT : 1e9, neg ? MONEY.bankruptNeg - G.negT : 1e9);
    setText(q('bkt'), fmtTime(left));
  }
  setClass(q('fires'), 'hidden', !(G.fires > 0));
  if (G.fires > 0) setText(q('firen'), G.fires);

  updateRaidClock();

  // clock
  // G.clockHours (0-24, from the lighting cycle) wins over G.tod (0 midnight, 0.5 noon)
  const hours = G.clockHours != null ? G.clockHours : (G.tod ?? 0.5) * 24;
  const mins = Math.floor(hours * 60) % 1440;
  setText(q('tod'), `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`);
  const night = hours < 5.5 || hours > 19.5, golden = !night && (hours < 7.5 || hours > 17.5);
  setHTML(q('todi'), icon(night ? 'moon' : golden ? 'sunset' : 'sun'));
  for (const b of UI.speedBtns || (UI.speedBtns = $$('#status [data-speed]'))) {
    const s = +b.dataset.speed;
    setClass(b, 'on', s === 0 ? G.paused : !G.paused && G.speed === s);
  }
  setClass($('#hud'), 'paused', !!G.paused);
}

// 10 Hz: utility bars and RCI
export function updateBars() {
  const q = (k) => UI.k[k] || (UI.k[k] = $(`[data-k="${k}"]`));
  const util = (p, k) => {
    const sup = p.supply || 0, dem = p.demand || 0, f = sup > 0 ? dem / sup : dem > 0 ? 2 : 0;
    setText(q(k), fmtInt(dem));
    setText(q(k + 'c'), fmtInt(sup));
    setW(q(k + 'bar'), Math.min(1, f));
    const bar = q(k + 'bar').parentNode;
    setClass(bar, 'warn', f >= 0.9 && f < 1);
    setClass(bar, 'bad', f >= 1);
    setClass(q(k).parentNode.parentNode.parentNode, 'bad', f >= 1);
  };
  util(G.power || {}, 'pw');
  util(G.water || {}, 'wt');
  for (const k of ['R', 'C', 'I']) {
    const v = Math.max(-100, Math.min(100, (G.demand && G.demand[k]) || 0));
    const bar = q('d' + k);
    setStyle(bar, 'height', `${(Math.abs(v) / 2).toFixed(1)}%`);
    setClass(bar, 'neg', v < 0);
  }
}

function plannedTotal(plan) {
  if (!plan) return 0;
  if (plan.queue) return plan.queue.length;
  let n = 0; for (const k in plan.counts || {}) n += plan.counts[k];
  return n;
}

export function radarOnline() { return G.buildings.some((b) => b.type === 'radar' && b.powered !== false && b.connected !== false); }

function compHTML(counts) {
  const order = Object.keys(ENEMIES);
  let keys = Object.keys(counts || {}).filter((k) => counts[k] > 0).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  let more = 0;
  if (keys.length > 4) { const byN = keys.slice().sort((a, b) => counts[b] - counts[a]); const keep = new Set(byN.slice(0, 3)); for (const k of keys) if (!keep.has(k)) more += counts[k]; keys = keys.filter((k) => keep.has(k)); }
  return keys.map((k) => {
    const sil = UI.silhouettes[k];
    const big = k === 'battleship' || k === 'bomber' ? ' big' : '';
    return `<span class="rc-unit ${ENEMIES[k].domain}${big}" data-tip="enemy-${k}">${sil ? `<img src="${sil}" alt="">` : icon(ENEMY_ICON[k] || 'skull')}<b class="tnum">×${counts[k]}</b></span>`;
  }).join('') + (more ? `<span class="rc-unit more"><b class="tnum">+${more}</b></span>` : '');
}

function roseSVG(dirs, radar) {
  const wedges = (dirs || []).map((a) => {
    // world angle from +z, north = -z: screen angle with north up
    const s = Math.atan2(Math.sin(a), -Math.cos(a));
    const w = radar ? 0.22 : 0.42;
    const p = (ang, r) => `${(32 + Math.sin(ang) * r).toFixed(1)},${(32 - Math.cos(ang) * r).toFixed(1)}`;
    return `<path d="M${p(s - w, 29)} A29 29 0 0 1 ${p(s + w, 29)} L${p(s, 9)} Z" class="wedge"/>`;
  }).join('');
  const ticks = Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; const r0 = k % 2 ? 25 : 22; return `<line x1="${32 + Math.sin(a) * r0}" y1="${32 - Math.cos(a) * r0}" x2="${32 + Math.sin(a) * 29}" y2="${32 - Math.cos(a) * 29}"/>`; }).join('');
  return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" class="ring"/><circle cx="32" cy="32" r="15" class="ring in"/>${ticks}${wedges}<path d="M32 22 L35 32 L32 30 L29 32Z" class="isle"/><text x="32" y="10">N</text></svg>`;
}

const AIM_SHORT = { shore: 'nearest the shore', beach: 'land raiders on beaches', military: 'your defences', hq: 'the Town Hall', towers: 'your towers', utilities: 'power and water', hightech: 'radar, missiles, airfield' };

export function updateRaidClock() {
  const q = (k) => UI.k[k] || (UI.k[k] = $(`[data-k="${k}"]`));
  const rc = $('#raidclock');
  const w = G.wave || {};
  const diff = DIFFICULTY[G.difficulty] || DIFFICULTY.standard;
  const raidsOff = G.raidsOff != null ? G.raidsOff : !diff.raids;
  const state = raidsOff ? 'off' : w.state === 'active' ? 'raid' : 'prep';
  setAttr(rc, 'data-state', state);
  const radar = radarOnline();
  if (state === 'raid') {
    const total = w.total || plannedTotal(w.plan) || 1;
    const left = S.enemiesAlive() + (w.queue ? w.queue.length : 0);
    setText(q('wn'), w.current || w.n);
    setText(q('rclabel'), 'Raid in progress');
    setText(q('rctime'), `${left} left`);
    setW(q('rcbar'), left / total);
    const hq = G.hq;
    if (hq) {
      const f = hq.hp / hq.maxHp;
      setText(q('hqv'), `${Math.round(f * 100)}%`);
      setW(q('hqbar'), f);
      setClass(q('hq'), 'low', f < 0.5);
    }
    const alive = {};
    for (const e of G.enemies) if (e.alive && e.team !== 'A') alive[e.type] = (alive[e.type] || 0) + 1;
    if (w.queue) for (const u of w.queue) alive[u.type] = (alive[u.type] || 0) + 1;
    setHTML(q('comp'), compHTML(alive));
  } else if (state === 'prep') {
    const total = (w.n || 1) <= 1 ? diff.firstWave : diff.gap;
    setText(q('wn'), w.n || 1);
    setText(q('rclabel'), 'Next raid');
    setText(q('rctime'), fmtTime(w.timer));
    setW(q('rcbar'), 1 - Math.max(0, w.timer || 0) / Math.max(1, total));
    setHTML(q('comp'), compHTML(w.plan && w.plan.counts));
  } else {
    setText(q('wn'), '—');
    setText(q('rclabel'), 'Raids are off');
    setText(q('rctime'), 'Sandbox');
    setW(q('rcbar'), 0);
    setHTML(q('comp'), '');
  }
  const bonus = Math.floor(Math.max(0, w.timer || 0) * MONEY.callEarlyPerSec);
  setText(q('earlyv'), state === 'prep' ? `+${fmtK(bonus)}` : '');
  setText(q('earlyt'), state === 'prep' ? 'Call early' : state === 'raid' ? 'Under attack' : 'Peace');
  setAttr($('[data-act="early"]'), 'disabled', state !== 'prep');

  // expanded details
  if (UI.rcOpen || rc.matches(':hover')) {
    const plan = w.plan || {};
    const dirs = plan.dirs || [];
    setHTML(q('rose'), roseSVG(dirs, radar));
    const names = [...new Set(dirs.map(compassName))];
    setText(q('dir'), state === 'off' ? 'No raids in Sandbox' : names.length ? `${radar ? 'Approach' : 'Expected'} from the ${names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0]}` : 'Direction unknown');
    const counts = plan.counts || {};
    const order = Object.keys(ENEMIES);
    const rows = Object.keys(counts).filter((k) => counts[k] > 0).sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((k) => {
      const e = ENEMIES[k];
      const tgt = (plan.targets && plan.targets[k]) || AIM_SHORT[e.aim] || AIM_TEXT[e.aim] || '';
      return `<li class="${e.domain}">${icon(ENEMY_ICON[k] || 'skull')}<b>${esc(e.name)}${counts[k] > 1 ? 's' : ''} ×${counts[k]}</b><span>→ ${esc(tgt)}</span></li>`;
    }).join('');
    setHTML(q('targets'), rows || '<li class="none">No raid planned</li>');
    const reward = MONEY.waveClearBase + MONEY.waveClearPerWave * (w.n || 1);
    setText(q('reward'), `Clear reward ${fmtMoney(reward)}`);
    setHTML(q('radar'), radar ? `${icon('radar')}Radar shows approach lanes` : `${icon('radar')}Radar reveals approach lanes`);
  }
}
