import { G, SETTINGS, saveSettings, MSG } from './state.js';
import { BUILDINGS, BUILD_ORDER, BUILD_TYPES, RES, RES_NAME, RESEARCH, RESEARCH_BY_ID, ENEMIES, ROAD_COST, VICTORY_WAVE } from './defs.js';
import { W, T, TERRAIN, isLand } from './world.js';
import {
  canAfford, levelCostFor, upgrade, bulldoze, rebuildRuin, buyResearch, isUnlocked, placeProblem, roadProblem,
  housingOf, jobsOf, saveGame, hasSave, scaleCost, previewProd, staffing, TRADES, trade,
} from './game.js';
import { setTool, mouse, CAM, focus, roadPreviewCost, hooks } from './input.js';
import { callWaveEarly, compass, fighterCap, barracksCap, enemiesAlive } from './combat.js';
import { R, applyShadowSetting, resize } from './render.js';
import { sfx, setVolume } from './audio.js';

const ICON = {
  food: '<svg viewBox="0 0 24 24"><path d="M12 23V7" stroke="#c9a23c" stroke-width="2"/><ellipse cx="12" cy="4.6" rx="2.2" ry="3.2" fill="#f3cd5c"/><ellipse cx="8.4" cy="10" rx="2" ry="3.1" transform="rotate(-35 8.4 10)" fill="#f3cd5c"/><ellipse cx="15.6" cy="10" rx="2" ry="3.1" transform="rotate(35 15.6 10)" fill="#f3cd5c"/><ellipse cx="8.4" cy="15.4" rx="2" ry="3.1" transform="rotate(-35 8.4 15.4)" fill="#e2b444"/><ellipse cx="15.6" cy="15.4" rx="2" ry="3.1" transform="rotate(35 15.6 15.4)" fill="#e2b444"/></svg>',
  wood: '<svg viewBox="0 0 24 24"><rect x="1.5" y="7.5" width="17" height="10" rx="2" fill="#a2713f"/><path d="M4 10.5h11M4 14.5h9" stroke="#7d5530" stroke-width="1.2"/><ellipse cx="18.5" cy="12.5" rx="3.4" ry="5" fill="#e3b47c"/><ellipse cx="18.5" cy="12.5" rx="1.7" ry="2.6" fill="#b98550"/></svg>',
  stone: '<svg viewBox="0 0 24 24"><path d="M2.5 17.5l3-8.5 6.5-4.5 7 3 2.5 8.5-5 4.5H7.5z" fill="#b0aca3"/><path d="M12 4.5l-2.2 7.8 10.6 3.3M9.8 12.3l-4.3 5" stroke="#807b73" stroke-width="1.3" fill="none"/></svg>',
  iron: '<svg viewBox="0 0 24 24"><path d="M3 17.5l3.2-8h11.6l3.2 8z" fill="#7f97ad"/><path d="M6.2 9.5h11.6l1.6 3.8H4.6z" fill="#bccbd9"/><path d="M8 7l2-3h4l2 3z" fill="#9fb3c6"/></svg>',
  gold: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#f2c94c"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#c4952a" stroke-width="1.6"/><path d="M12 7.6v8.8" stroke="#c4952a" stroke-width="2"/></svg>',
  pop: '<svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="4.2" fill="#a9cdff"/><path d="M3.5 22c0-5.4 3.8-8.6 8.5-8.6s8.5 3.2 8.5 8.6z" fill="#a9cdff"/></svg>',
  road: '<svg viewBox="0 0 24 24"><path d="M8 2L3 22h18L16 2z" fill="#c9b48b"/><path d="M12 4v3M12 10v3M12 16v4" stroke="#fff" stroke-width="1.6"/></svg>',
  bulldoze: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="12" height="6" rx="1" fill="#e2a73a"/><rect x="6" y="6" width="6" height="5" fill="#e2a73a"/><rect x="7" y="7" width="4" height="3" fill="#9fd2ec"/><path d="M15 9l5 2v8h-5" fill="#888"/><circle cx="6" cy="19" r="2" fill="#333"/><circle cx="12" cy="19" r="2" fill="#333"/></svg>',
  research: '<svg viewBox="0 0 24 24"><path d="M9 2h6v2h-1v5l6 10c.8 1.4-.2 3-1.8 3H5.8c-1.6 0-2.6-1.6-1.8-3l6-10V4H9z" fill="#c9e3f2"/><path d="M6.5 16h11l1.6 2.8c.3.6-.1 1.2-.7 1.2H5.6c-.6 0-1-.6-.7-1.2z" fill="#6fd0a0"/></svg>',
};

const $ = (s, el = document) => el.querySelector(s);
const fmt = (v) => (v >= 10000 ? (v / 1000).toFixed(1) + 'k' : Math.floor(v).toString());
const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const escapeHTML = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const UI = {
  thumbs: {}, cat: 'city', modal: null, perf: false, handlers: {}, infoFor: null, tipKind: null,
};

function costHTML(cost, cls = '') {
  return Object.keys(cost).map((k) => `<span class="cost ${cls}" data-res="${k}" data-amt="${cost[k]}">${ICON[k]}${cost[k]}</span>`).join('');
}
function refreshCostSpans(el) {
  for (const s of el.querySelectorAll('.cost[data-res]')) {
    s.classList.toggle('short', (G.res[s.dataset.res] || 0) < +s.dataset.amt);
  }
}

// ------------------------------------------------------------------ DOM

export function initUI(handlers) {
  UI.handlers = handlers;
  const root = document.getElementById('ui');
  root.innerHTML = `
  <div id="hud" class="hidden">
    <div id="topbar">
      ${RES.map((k) => `<div class="res" id="r-${k}" data-tip="res-${k}">${ICON[k]}<div><b>0</b><small>+0/min</small></div></div>`).join('')}
      <div class="res" id="r-pop" data-tip="res-pop">${ICON.pop}<div><b>0/0</b><small>workers</small></div></div>
    </div>
    <div id="wavebox">
      <div class="wb-title"><span id="wb-name">Wave 1</span><span id="wb-goal"></span></div>
      <div id="wb-timer">2:30</div>
      <div id="wb-bar"><div></div></div>
      <div id="wb-intel"></div>
      <button id="wb-early" class="btn small">Send it now <span></span> (N)</button>
    </div>
    <div id="speedbox">
      <button data-speed="0" title="Pause (Space)">❚❚</button>
      <button data-speed="1" title="Normal speed">▶</button>
      <button data-speed="2" title="Fast">▶▶</button>
      <button data-speed="3" title="Fastest">▶▶▶</button>
      <button id="menu-btn" title="Menu (Esc)">☰</button>
    </div>
    <div id="buildbox">
      <div class="tabs"><button data-cat="city" class="on">City</button><button data-cat="military">Military</button></div>
      <div class="list" id="build-list"></div>
      <div class="tools">
        <button class="tool" id="tool-road" data-tip="tool-road">${ICON.road}<span>Road</span><kbd>R</kbd></button>
        <button class="tool" id="tool-bulldoze" data-tip="tool-bulldoze">${ICON.bulldoze}<span>Bulldoze</span><kbd>X</kbd></button>
        <button class="tool" id="tool-research" data-tip="tool-research">${ICON.research}<span>Research</span><kbd>T</kbd></button>
      </div>
    </div>
    <div id="infobox" class="hidden"></div>
    <div id="minimap"><canvas width="300" height="300"></canvas></div>
    <div id="toasts"></div>
    <div id="hint"></div>
    <div id="paused-banner" class="hidden">PAUSED</div>
  </div>
  <div id="perf" class="hidden"></div>
  <div id="tip" class="hidden"></div>
  <div id="screen" class="hidden"></div>
  <div id="modal" class="hidden"></div>`;

  // speed / menu
  for (const b of root.querySelectorAll('#speedbox [data-speed]')) {
    b.addEventListener('click', () => { setSpeed(+b.dataset.speed); sfx('click'); });
  }
  $('#menu-btn').addEventListener('click', () => openPause());
  $('#wb-early').addEventListener('click', () => sendEarly());
  for (const b of root.querySelectorAll('#buildbox .tabs button')) {
    b.addEventListener('click', () => { setCategory(b.dataset.cat); sfx('click'); });
  }
  $('#tool-road').addEventListener('click', () => toggleTool({ kind: 'road' }));
  $('#tool-bulldoze').addEventListener('click', () => toggleTool({ kind: 'bulldoze' }));
  $('#tool-research').addEventListener('click', () => openResearch());

  // tooltips for anything with data-tip
  root.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-tip]');
    if (!el) return;
    showTip(tipFor(el.dataset.tip), el);
  });
  root.addEventListener('mouseout', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && !el.contains(e.relatedTarget)) hideTip();
  });

  const mm = $('#minimap canvas');
  const mmMove = (e) => {
    const r = mm.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 300, py = ((e.clientY - r.top) / r.height) * 300;
    focus((px - 150) / MM_SCALE, (py - 150) / MM_SCALE);
  };
  mm.addEventListener('mousedown', (e) => { if (e.button === 0) { mmMove(e); UI.mmDrag = true; } });
  window.addEventListener('mousemove', (e) => { if (UI.mmDrag) mmMove(e); });
  window.addEventListener('mouseup', () => { UI.mmDrag = false; });

  hooks.onSelect = () => renderInfo();
  hooks.onError = (msg) => toast(msg, 'bad');
  hooks.onPlaced = () => { updateBuildList(); };
  hooks.isUIBlocking = () => !!UI.modal || G.mode !== 'play';

  window.addEventListener('keydown', onKey);
  setCategory('city');
}

export function setThumbs(t) { UI.thumbs = t; buildList(); }

function buildList() {
  const list = $('#build-list');
  const types = BUILD_ORDER[UI.cat];
  list.innerHTML = types.map((type, k) => {
    const d = BUILDINGS[type];
    return `<button class="bbtn" data-type="${type}" data-tip="b-${type}">
      <img src="${UI.thumbs[type] || ''}" alt="">
      <div class="bb-txt"><div class="bb-name">${d.name}</div><div class="bb-cost">${costHTML(d.cost)}</div></div>
      <kbd>${(k + 1) % 10}</kbd><i class="lock">🔒</i></button>`;
  }).join('');
  for (const b of list.querySelectorAll('.bbtn')) {
    b.addEventListener('click', () => pickBuilding(b.dataset.type));
  }
  updateBuildList();
}

function setCategory(cat) {
  UI.cat = cat;
  for (const b of document.querySelectorAll('#buildbox .tabs button')) b.classList.toggle('on', b.dataset.cat === cat);
  buildList();
}

function pickBuilding(type) {
  if (!isUnlocked(type)) { toast(`Research ${RESEARCH_BY_ID[BUILDINGS[type].requires].name} first (T)`, 'bad'); sfx('error'); return; }
  if (BUILDINGS[type].unique && G.buildings.some((b) => b.type === type)) { toast('Only one can be built', 'bad'); sfx('error'); return; }
  toggleTool({ kind: 'build', type });
}

function toggleTool(tool) {
  const cur = G.tool;
  const same = cur && cur.kind === tool.kind && cur.type === tool.type;
  setTool(same ? null : tool);
  sfx('click');
  updateToolButtons();
}

function updateToolButtons() {
  const t = G.tool;
  for (const b of document.querySelectorAll('.bbtn')) b.classList.toggle('on', !!(t && t.kind === 'build' && t.type === b.dataset.type));
  $('#tool-road').classList.toggle('on', !!(t && t.kind === 'road'));
  $('#tool-bulldoze').classList.toggle('on', !!(t && t.kind === 'bulldoze'));
}

function updateBuildList() {
  for (const b of document.querySelectorAll('.bbtn')) {
    const type = b.dataset.type, d = BUILDINGS[type];
    const locked = !isUnlocked(type);
    const done = d.unique && G.buildings.some((x) => x.type === type);
    b.classList.toggle('locked', locked);
    b.classList.toggle('done', !!done);
    b.classList.toggle('poor', !canAfford(d.cost));
    refreshCostSpans(b);
  }
}

// ------------------------------------------------------------------ tooltips

function tipFor(key) {
  if (key.startsWith('b-')) {
    const type = key.slice(2), d = BUILDINGS[type];
    let extra = '';
    if (d.weapon) {
      const w = d.weapon;
      const tg = Object.keys(w.targets).map((k) => ({ sea: 'Ships', air: 'Aircraft', ground: 'Troops' }[k])).join(', ');
      extra = `<div class="tip-stats"><span>Damage ${Math.round(w.dmg * G.mod.dmg)}${w.splash ? ' (area)' : ''}</span><span>Range ${(w.range * G.mod.range).toFixed(1)}</span><span>Rate ${(w.rate * G.mod.rate).toFixed(2)}/s</span><span>Hits: ${tg}</span></div>`;
    }
    if (d.jobs) extra += `<div class="tip-sub">Workers: ${d.jobs}</div>`;
    const req = d.requires && !isUnlocked(type) ? `<div class="tip-bad">Requires research: ${RESEARCH_BY_ID[d.requires].name}</div>` : '';
    return `<div class="tip-title">${d.name}</div><div>${d.desc}</div>${extra}<div class="tip-cost">${costHTML(d.cost)}</div>${req}`;
  }
  if (key === 'tool-road') return `<div class="tip-title">Road</div><div>Click and drag to lay a road. Buildings only work when a road links them to the Town Hall.</div><div class="tip-cost">${costHTML(ROAD_COST)} per tile</div>`;
  if (key === 'tool-bulldoze') return '<div class="tip-title">Bulldoze</div><div>Click or drag to demolish buildings, roads and rubble. Buildings refund half their cost.</div>';
  if (key === 'tool-research') return '<div class="tip-title">Research</div><div>Improve your weapons, unlock radar, missiles and aircraft. Needs a War College.</div>';
  if (key.startsWith('res-')) {
    const k = key.slice(4);
    if (k === 'pop') return `<div class="tip-title">Population</div><div>${Math.floor(G.pop)} residents in homes for ${G.housing}. ${G.jobs} jobs need workers. Farms and docks are staffed first (${Math.round(G.effFood * 100)}%), then everything else (${Math.round(G.eff * 100)}%).</div><div class="tip-sub">Build houses for more people. They need food to grow. Short-staffed weapons fire slower.</div>`;
    const rate = G.rates[k] || 0;
    const src = { food: 'Farms and fishing docks. Every resident eats.', wood: 'Lumber camps beside forests.', stone: 'Quarries beside hills and mountains.', iron: 'Iron mines on hills.', gold: 'Taxes from residents (markets boost them), kill bounties and wave rewards.' }[k];
    return `<div class="tip-title">${RES_NAME[k]}</div><div>${rate >= 0 ? '+' : ''}${rate.toFixed(1)} per minute.</div><div class="tip-sub">${src}</div>`;
  }
  return '';
}

function showTip(html, anchor) {
  if (!html) return;
  const tip = $('#tip');
  tip.innerHTML = html;
  tip.classList.remove('hidden');
  refreshCostSpans(tip);
  UI.tipKind = 'ui';
  const r = anchor.getBoundingClientRect();
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = r.right + 10, y = r.top;
  if (x + tw > window.innerWidth - 8) x = r.left - tw - 10;
  if (y + th > window.innerHeight - 8) y = window.innerHeight - th - 8;
  if (r.top < 120 && r.bottom < 200) { x = Math.min(window.innerWidth - tw - 8, Math.max(8, r.left)); y = r.bottom + 8; }
  tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}
function hideTip() { $('#tip').classList.add('hidden'); UI.tipKind = null; }

function updateTileTip() {
  if (UI.tipKind === 'ui') return;
  const tip = $('#tip');
  const i = mouse.tile;
  if (G.mode !== 'play' || i < 0 || UI.modal || mouse.right || mouse.middle) { tip.classList.add('hidden'); UI.tipKind = null; return; }
  let html = '';
  const t = G.tool;
  const ter = TERRAIN[W.type[i]].name;
  if (t && t.kind === 'build') {
    const p = placeProblem(t.type, i);
    if (p) html = `<div class="tip-bad">${p}</div>`;
    else {
      const prod = previewProd(t.type, i);
      html = `<div class="tip-title">${BUILDINGS[t.type].name}</div>`;
      if (prod) html += Object.keys(prod).map((k) => `<div class="tip-good">${ICON[k]} +${Math.round(prod[k])} ${RES_NAME[k].toLowerCase()} / min</div>`).join('');
      if (!canAfford(BUILDINGS[t.type].cost)) html += '<div class="tip-bad">Not enough resources</div>';
      if (!touchesNetwork(i)) html += '<div class="tip-warn">Needs a road to the Town Hall to work</div>';
    }
  } else if (t && t.kind === 'road') {
    if (mouse.roadPath.length > 1) {
      const c = roadPreviewCost();
      html = `<div class="tip-title">Road: ${c.tiles} tile${c.tiles === 1 ? '' : 's'}</div><div class="tip-cost">${costHTML({ gold: c.gold })}</div>`;
    } else {
      const p = roadProblem(i);
      html = p && !W.road[i] ? `<div class="tip-bad">${p}</div>` : '<div class="tip-sub">Click and drag to lay a road</div>';
    }
  } else if (t && t.kind === 'bulldoze') {
    if (W.bld[i]) { const b = G.byId.get(W.bld[i]); if (b) html = `<div class="tip-title">Demolish ${b.def.name}</div>${b.type !== 'hq' ? `<div class="tip-sub">Refund ${costHTML(scaleCost(b.def.cost, 0.5))}</div>` : '<div class="tip-bad">Cannot demolish the Town Hall</div>'}`; }
    else if (W.road[i]) html = '<div class="tip-title">Remove road</div>';
    else if (W.ruin[i]) html = '<div class="tip-title">Clear rubble</div>';
  } else {
    if (W.bld[i]) {
      const b = G.byId.get(W.bld[i]);
      if (b) html = `<div class="tip-title">${b.def.name}${b.level > 1 ? ' ' + roman(b.level) : ''}</div><div class="tip-sub">${Math.ceil(b.hp)} / ${Math.ceil(b.maxHp)} HP${b.connected ? '' : ' · <span class="tip-bad">no road</span>'}</div>`;
    } else if (W.ruin[i]) {
      html = `<div class="tip-title">Ruins</div><div class="tip-sub">Click to rebuild</div>`;
    } else if (isLand(W.type[i])) {
      html = `<div class="tip-sub">${ter}${W.road[i] ? ' · road' : ''}</div>`;
    }
  }
  if (!html) { tip.classList.add('hidden'); UI.tipKind = null; return; }
  if (tip.innerHTML !== html) { tip.innerHTML = html; refreshCostSpans(tip); }
  tip.classList.remove('hidden');
  UI.tipKind = 'tile';
  const x = Math.min(window.innerWidth - tip.offsetWidth - 8, mouse.x + 18);
  const y = Math.min(window.innerHeight - tip.offsetHeight - 8, mouse.y + 18);
  tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

function touchesNetwork(i) {
  for (let d = 0; d < 6; d++) {
    const j = W.nbr[i * 6 + d];
    if (j >= 0 && (W.conn[j] || (G.hq && j === G.hq.tile))) return true;
  }
  return false;
}

const roman = (n) => ['', 'I', 'II', 'III', 'IV'][n] || n;

// ------------------------------------------------------------------ info panel

function renderInfo() {
  const box = $('#infobox');
  const s = G.selected;
  UI.infoFor = s;
  if (!s) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  box.classList.remove('hidden');
  if (s.ruin != null) {
    const type = BUILD_TYPES[W.ruin[s.ruin] - 1];
    const d = BUILDINGS[type];
    const cost = scaleCost(d.cost, 0.6);
    box.innerHTML = `
      <div class="ip-head"><img src="${UI.thumbs[type] || ''}" class="ruined"><div><div class="ip-name">Ruins of a ${d.name}</div><div class="ip-sub">Destroyed in battle</div></div><button class="ip-x" data-act="close">✕</button></div>
      <div class="ip-actions"><button class="btn" data-act="rebuild">Rebuild <span>${costHTML(cost)}</span></button><button class="btn danger" data-act="clear">Clear rubble</button></div>`;
  } else {
    const b = s, d = b.def;
    box.innerHTML = `
      <div class="ip-head"><img src="${UI.thumbs[b.type] || ''}"><div><div class="ip-name">${d.name}</div><div class="ip-sub" data-k="lvl"></div></div><button class="ip-x" data-act="close">✕</button></div>
      <div class="hpbar"><div data-k="hpfill"></div><span data-k="hptext"></span></div>
      <div class="ip-status" data-k="status"></div>
      <div class="ip-stats" data-k="stats"></div>
      <div class="ip-desc">${d.desc}</div>
      <div class="ip-actions">
        ${d.upgradeCost ? '<button class="btn" data-act="upgrade"><span data-k="utext">Upgrade</span> <span data-k="ucost"></span></button>' : ''}
        ${b.type === 'college' ? '<button class="btn" data-act="research">Open research (T)</button>' : ''}
        ${b.type === 'market' ? `<div class="ip-trade">${TRADES.map((t, k) => `<button class="btn small" data-trade="${k}">Buy ${ICON[t.res]}${t.amt}<span>${costHTML({ gold: t.gold })}</span></button>`).join('')}</div>` : ''}
        ${b.type !== 'hq' ? `<button class="btn danger" data-act="demolish">Demolish <span>${costHTML(scaleCost(d.cost, 0.5), 'refund')}</span></button>` : ''}
      </div>`;
  }
  for (const btn of box.querySelectorAll('[data-act]')) btn.addEventListener('click', () => infoAction(btn.dataset.act));
  for (const btn of box.querySelectorAll('[data-trade]')) {
    btn.addEventListener('click', () => {
      const p = trade(+btn.dataset.trade);
      if (p) { toast(p, 'bad'); sfx('error'); } else sfx('build');
    });
  }
  UI.uKey = '';
  updateInfo();
}

function infoAction(act) {
  const s = G.selected;
  if (act === 'close') { G.selected = null; renderInfo(); return; }
  if (!s) return;
  if (act === 'upgrade') {
    const p = upgrade(s);
    if (p) { toast(p, 'bad'); sfx('error'); } else { sfx('upgrade'); toast(`${s.def.name} upgraded to level ${s.level}`, 'good'); }
    UI.uKey = '';
    updateInfo();
  } else if (act === 'demolish') {
    bulldoze(s.tile); sfx('demolish'); G.selected = null; renderInfo();
  } else if (act === 'research') openResearch();
  else if (act === 'rebuild') {
    const r = rebuildRuin(s.ruin);
    if (typeof r === 'string') { toast(r, 'bad'); sfx('error'); } else { sfx('build'); G.selected = r; renderInfo(); }
  } else if (act === 'clear') {
    bulldoze(s.ruin); sfx('demolish'); G.selected = null; renderInfo();
  }
}

function statRows(b) {
  const rows = [];
  const row = (k, v) => rows.push(`<div><span>${k}</span><b>${v}</b></div>`);
  const d = b.def;
  if (b.ws) {
    const w = d.weapon;
    row('Damage', `${Math.round(b.ws.dmg)}${w.splash ? ` <small>area ${b.ws.splash.toFixed(1)}</small>` : ''}`);
    row('Range', `${b.ws.range.toFixed(1)}${b.radarBoost ? ' <small class="good">radar +20%</small>' : ''}`);
    row('Fire rate', `${b.ws.rate.toFixed(2)}/s`);
    row('Targets', Object.keys(w.targets).map((k) => ({ sea: 'Ships', air: 'Aircraft', ground: 'Troops' }[k])).join(', '));
    row('Kills', b.kills);
  }
  if (b.prod) for (const k in b.prod) row(RES_NAME[k], `+${(b.prod[k] * (b.connected ? staffing(b) : 0)).toFixed(0)} / min`);
  const h = housingOf(b);
  if (h) row('Residents', `${Math.round(h * Math.min(1, G.housing ? G.pop / G.housing : 0))} / ${h}${b.marketBoost ? ' <small class="good">market +50% tax</small>' : ''}`);
  const j = jobsOf(b);
  if (j) row('Workers', `${Math.round(j * staffing(b))} / ${j}`);
  if (b.type === 'barracks') row('Marines', `${b.units.length} / ${barracksCap(b)}${b.units.length < barracksCap(b) && b.connected ? ` <small>training ${Math.round((b.trainT / 9) * 100)}%</small>` : ''}`);
  if (b.type === 'airfield') {
    const up = b.units.filter((u) => u.state !== 'parked').length;
    row('Fighters', `${b.units.length} / ${fighterCap(b)}${up ? ` <small>${up} airborne</small>` : ''}`);
  }
  if (b.type === 'market') row('Houses boosted', G.buildings.filter((x) => x.marketBoost && Math.hypot(x.x - b.x, x.z - b.z) <= d.radius).length);
  if (b.type === 'radar') row('Weapons boosted', G.buildings.filter((x) => x.ws && Math.hypot(x.x - b.x, x.z - b.z) <= d.radius).length);
  return rows.join('');
}

function updateInfo() {
  const s = G.selected;
  if (s !== UI.infoFor) { renderInfo(); return; }
  if (!s || s.ruin != null) { if (s) refreshCostSpans($('#infobox')); return; }
  const box = $('#infobox');
  const q = (k) => box.querySelector(`[data-k="${k}"]`);
  const b = s;
  const maxL = b.def.maxLevel || 1;
  q('lvl').innerHTML = maxL > 1 ? `Level ${b.level} / ${maxL}` : '';
  const f = b.hp / b.maxHp;
  q('hpfill').style.width = `${(f * 100).toFixed(1)}%`;
  q('hpfill').className = f < 0.3 ? 'low' : f < 0.6 ? 'mid' : '';
  q('hptext').textContent = `${Math.ceil(b.hp)} / ${Math.ceil(b.maxHp)}`;
  q('status').innerHTML = b.connected
    ? `<span class="good">● Connected</span>${G.time - b.lastHit < 6 ? ' · <span class="bad">under attack</span>' : b.hp < b.maxHp ? ' · repairing' : ''}`
    : '<span class="bad">● No road to the Town Hall: not working</span>';
  q('stats').innerHTML = statRows(b);
  const ub = box.querySelector('[data-act="upgrade"]');
  if (ub) {
    const cost = levelCostFor(b);
    const key = cost ? JSON.stringify(cost) : 'max';
    if (key !== UI.uKey) {
      UI.uKey = key;
      q('utext').textContent = cost ? `Upgrade to level ${b.level + 1} (U)` : 'Fully upgraded';
      q('ucost').innerHTML = cost ? costHTML(cost) : '';
    }
    ub.disabled = !cost;
    ub.classList.toggle('poor', !!cost && !canAfford(cost));
  }
  refreshCostSpans(box);
}

// ------------------------------------------------------------------ research

export function openResearch() {
  hideTip();
  UI.modal = 'research';
  const m = $('#modal');
  m.classList.remove('hidden');
  renderResearch();
}

function renderResearch() {
  const m = $('#modal');
  const hasCollege = G.buildings.some((b) => b.type === 'college' && b.connected);
  m.innerHTML = `<div class="panel research">
    <div class="panel-head"><h2>Research</h2><button class="ip-x" data-act="close">✕</button></div>
    ${hasCollege ? '' : '<div class="banner bad">Build a War College (City tab) and connect it by road to start researching.</div>'}
    <div class="rgrid">${RESEARCH.map((r) => {
      const l = G.research[r.id] || 0;
      const maxed = l >= r.max;
      const locked = r.req && !(G.research[r.req] > 0);
      const cost = maxed ? null : r.cost(l);
      return `<div class="rcard ${maxed ? 'maxed' : ''} ${locked ? 'locked' : ''}">
        <div class="rc-name">${r.name}</div>
        <div class="rc-pips">${Array.from({ length: r.max }, (_, k) => `<i class="${k < l ? 'on' : ''}"></i>`).join('')}</div>
        <div class="rc-desc">${r.desc}</div>
        ${locked ? `<div class="rc-req">Requires ${RESEARCH_BY_ID[r.req].name}</div>` : ''}
        ${maxed ? '<div class="rc-done">Complete</div>' : `<button class="btn ${!hasCollege || locked || !canAfford(cost) ? 'poor' : ''}" data-r="${r.id}" ${!hasCollege || locked ? 'disabled' : ''}>Research ${costHTML(cost)}</button>`}
      </div>`;
    }).join('')}</div></div>`;
  m.querySelector('[data-act="close"]').addEventListener('click', closeModal);
  for (const b of m.querySelectorAll('[data-r]')) {
    b.addEventListener('click', () => {
      const p = buyResearch(b.dataset.r);
      if (p) { toast(p, 'bad'); sfx('error'); } else { sfx('upgrade'); updateBuildList(); }
      renderResearch();
    });
  }
  refreshCostSpans(m);
}

export function closeModal() {
  UI.modal = null;
  $('#modal').classList.add('hidden');
  $('#modal').innerHTML = '';
  if (UI.wasPausedByModal) { G.paused = false; UI.wasPausedByModal = false; }
}

// ------------------------------------------------------------------ menus

function screen(html) {
  const s = $('#screen');
  s.innerHTML = html;
  s.classList.remove('hidden');
  for (const b of s.querySelectorAll('[data-go]')) b.addEventListener('click', () => { sfx('click'); UI.handlers[b.dataset.go](); });
  return s;
}
export function hideScreen() { $('#screen').classList.add('hidden'); $('#screen').innerHTML = ''; }

export function showMainMenu(seed) {
  $('#hud').classList.add('hidden');
  const cont = hasSave();
  screen(`<div class="title-wrap">
    <div class="title">BASTION ISLE</div>
    <div class="subtitle">Build a town. Fortify the coast. Hold the island.</div>
    <div class="menu">
      ${cont ? '<button class="btn big" data-go="continue">Continue</button>' : ''}
      <button class="btn big" data-go="newGame">New Game</button>
      <button class="btn" data-go="reroll">Another island</button>
      <button class="btn" data-go="help">How to play</button>
      <button class="btn" data-go="settings">Settings</button>
      <button class="btn" data-go="fullscreen">Fullscreen (F)</button>
    </div>
    <div class="seed">Island #${seed}</div>
  </div>`);
}

export function showHUD() {
  hideScreen();
  $('#hud').classList.remove('hidden');
  renderInfo();
  updateBuildList();
  updateToolButtons();
  UI.mmBase = null;
}

export function openPause() {
  if (G.mode !== 'play') return;
  hideTip();
  UI.modal = 'pause';
  UI.wasPausedByModal = !G.paused;
  G.paused = true;
  const canSave = G.wave.state === 'prep';
  const m = $('#modal');
  m.classList.remove('hidden');
  m.innerHTML = `<div class="panel pause">
    <div class="panel-head"><h2>Paused</h2></div>
    <div class="menu">
      <button class="btn big" data-a="resume">Resume</button>
      <button class="btn" data-a="save" ${canSave ? '' : 'disabled'}>Save game${canSave ? '' : ' <small>(between waves)</small>'}</button>
      <button class="btn" data-a="help">How to play</button>
      <button class="btn" data-a="settings">Settings</button>
      <button class="btn danger" data-a="quit">Quit to main menu</button>
    </div>
    <div class="note">The game also saves itself after every wave.</div></div>`;
  m.querySelector('[data-a="resume"]').addEventListener('click', closeModal);
  m.querySelector('[data-a="save"]').addEventListener('click', () => { if (saveGame()) { toast('Game saved', 'good'); closeModal(); } });
  m.querySelector('[data-a="help"]').addEventListener('click', () => openHelp(true));
  m.querySelector('[data-a="settings"]').addEventListener('click', () => openSettings(true));
  m.querySelector('[data-a="quit"]').addEventListener('click', () => { closeModal(); UI.handlers.quit(); });
}

const HELP = `
  <div class="help-cols">
    <div>
      <h3>Goal</h3>
      <p>Enemy fleets and air raids strike your island in waves. Survive ${VICTORY_WAVE} waves to win (then keep going as long as you can). If the Town Hall falls, the island is lost.</p>
      <h3>Building a town</h3>
      <p><b>Roads</b> connect everything: a building only works if it sits beside a road that leads back to the Town Hall.</p>
      <p><b>Houses</b> bring residents who pay taxes in gold, eat food and work in your buildings. If there are more jobs than people, everything slows down.</p>
      <p><b>Farms</b> and <b>docks</b> feed people. <b>Lumber camps</b> want forest next to them, <b>quarries</b> want hills or mountains, <b>iron mines</b> go on hills.</p>
      <h3>Defence</h3>
      <p><b>MG nests</b> stop landing troops. <b>Coastal guns</b> outrange ships. <b>Flak</b> shoots down aircraft. <b>Barracks</b> train marines who hunt landing parties.</p>
      <p>Build a <b>War College</b> to research better weapons, <b>Radar</b>, <b>Missile batteries</b> and an <b>Airfield</b> of interceptors. Select any building to upgrade it.</p>
      <p>Damaged buildings repair themselves when they are out of the fight. Destroyed ones leave ruins you can rebuild cheaply.</p>
    </div>
    <div>
      <h3>Controls</h3>
      <table class="keys">
        <tr><td>W A S D / arrows</td><td>Move the camera (Shift: faster)</td></tr>
        <tr><td>Right-drag</td><td>Pan</td></tr>
        <tr><td>Q / E, middle-drag</td><td>Rotate and tilt</td></tr>
        <tr><td>Mouse wheel</td><td>Zoom</td></tr>
        <tr><td>Left-click</td><td>Select / place</td></tr>
        <tr><td>Right-click, Esc</td><td>Cancel tool / deselect</td></tr>
        <tr><td>1 – 9</td><td>Build from the open tab</td></tr>
        <tr><td>Tab</td><td>Switch City / Military</td></tr>
        <tr><td>R</td><td>Road tool (drag)</td></tr>
        <tr><td>X / Delete</td><td>Bulldoze / demolish selected</td></tr>
        <tr><td>U</td><td>Upgrade selected</td></tr>
        <tr><td>T</td><td>Research</td></tr>
        <tr><td>N</td><td>Send the next wave now (bonus gold)</td></tr>
        <tr><td>Space</td><td>Pause</td></tr>
        <tr><td>+ / −</td><td>Game speed</td></tr>
        <tr><td>H</td><td>Jump to the Town Hall</td></tr>
        <tr><td>F</td><td>Fullscreen</td></tr>
        <tr><td>F3</td><td>Performance stats</td></tr>
      </table>
    </div>
  </div>`;

export function openHelp(fromPause) {
  UI.modal = UI.modal || 'help';
  const m = $('#modal');
  m.classList.remove('hidden');
  m.innerHTML = `<div class="panel help"><div class="panel-head"><h2>How to play</h2><button class="ip-x" data-act="close">✕</button></div>${HELP}</div>`;
  m.querySelector('[data-act="close"]').addEventListener('click', () => (fromPause ? openPauseAgain() : closeModal()));
}

function openPauseAgain() { const was = UI.wasPausedByModal; UI.modal = null; openPause(); UI.wasPausedByModal = was; }

export function openSettings(fromPause) {
  UI.modal = UI.modal || 'settings';
  const m = $('#modal');
  m.classList.remove('hidden');
  const msaaStart = UI.handlers.msaaAtStart;
  m.innerHTML = `<div class="panel settings"><div class="panel-head"><h2>Settings</h2><button class="ip-x" data-act="close">✕</button></div>
    <label class="row"><span>Render resolution <small>(lower for more FPS)</small></span><input type="range" min="50" max="100" step="5" id="s-scale" value="${Math.round(SETTINGS.renderScale * 100)}"><b id="s-scale-v">${Math.round(SETTINGS.renderScale * 100)}%</b></label>
    <label class="row"><span>Shadows</span><select id="s-shadows"><option value="0">Off</option><option value="1">Normal</option><option value="2">High</option></select></label>
    <label class="row"><span>Anti-aliasing (MSAA)</span><input type="checkbox" id="s-msaa" ${SETTINGS.msaa ? 'checked' : ''}></label>
    <div class="row note" id="s-msaa-note" ${SETTINGS.msaa === msaaStart ? 'hidden' : ''}>Anti-aliasing changes after a reload. <button class="btn small" id="s-reload">Reload now</button></div>
    <label class="row"><span>Fullscreen <small>(F)</small></span><button class="btn small" id="s-fs">Toggle</button></label>
    <label class="row"><span>Show FPS counter <small>(F3)</small></span><input type="checkbox" id="s-fps" ${SETTINGS.showFps ? 'checked' : ''}></label>
    <label class="row"><span>Scroll at screen edges</span><input type="checkbox" id="s-edge" ${SETTINGS.edgeScroll ? 'checked' : ''}></label>
    <label class="row"><span>Volume</span><input type="range" min="0" max="100" step="5" id="s-vol" value="${Math.round(SETTINGS.volume * 100)}"><b id="s-vol-v">${Math.round(SETTINGS.volume * 100)}%</b></label>
    <div class="note">Frame rate follows your monitor's refresh rate (180 Hz on a 180 Hz display). Turn off "Battery saver" style power modes and use a Chromium browser with hardware acceleration on for the smoothest result.</div>
  </div>`;
  $('#s-shadows').value = String(SETTINGS.shadows);
  $('#s-scale').addEventListener('input', (e) => { SETTINGS.renderScale = +e.target.value / 100; $('#s-scale-v').textContent = e.target.value + '%'; resize(); saveSettings(); });
  $('#s-shadows').addEventListener('change', (e) => { SETTINGS.shadows = +e.target.value; applyShadowSetting(); saveSettings(); });
  $('#s-msaa').addEventListener('change', (e) => { SETTINGS.msaa = e.target.checked; saveSettings(); $('#s-msaa-note').hidden = SETTINGS.msaa === msaaStart; });
  $('#s-reload').addEventListener('click', () => location.reload());
  $('#s-fs').addEventListener('click', (e) => { e.preventDefault(); toggleFullscreen(); });
  $('#s-fps').addEventListener('change', (e) => { SETTINGS.showFps = e.target.checked; UI.perf = e.target.checked; saveSettings(); });
  $('#s-edge').addEventListener('change', (e) => { SETTINGS.edgeScroll = e.target.checked; saveSettings(); });
  $('#s-vol').addEventListener('input', (e) => { SETTINGS.volume = +e.target.value / 100; $('#s-vol-v').textContent = e.target.value + '%'; setVolume(SETTINGS.volume); saveSettings(); });
  m.querySelector('[data-act="close"]').addEventListener('click', () => (fromPause ? openPauseAgain() : closeModal()));
}

export function showGameOver() {
  hideTip();
  screen(`<div class="title-wrap end">
    <div class="title small bad">THE ISLAND HAS FALLEN</div>
    <div class="subtitle">The Town Hall was destroyed during wave ${G.wave.current || G.wave.n}.</div>
    <div class="endstats">
      <div><b>${G.stats.waves}</b><span>waves survived</span></div>
      <div><b>${G.stats.kills}</b><span>enemies destroyed</span></div>
      <div><b>${G.stats.built}</b><span>buildings raised</span></div>
      <div><b>${G.stats.lost}</b><span>buildings lost</span></div>
    </div>
    <div class="menu row"><button class="btn big" data-go="newGame">Try again</button><button class="btn" data-go="quit">Main menu</button></div>
  </div>`);
}

export function showVictory() {
  hideTip();
  UI.modal = 'victory';
  UI.wasPausedByModal = !G.paused;
  G.paused = true;
  const m = $('#modal');
  m.classList.remove('hidden');
  m.innerHTML = `<div class="panel victory">
    <div class="title small good">VICTORY</div>
    <div class="subtitle">You held the island through ${VICTORY_WAVE} waves.</div>
    <div class="endstats">
      <div><b>${G.stats.kills}</b><span>enemies destroyed</span></div>
      <div><b>${G.stats.built}</b><span>buildings raised</span></div>
      <div><b>${G.stats.lost}</b><span>buildings lost</span></div>
    </div>
    <div class="menu row"><button class="btn big" data-a="go">Keep defending</button><button class="btn" data-a="quit">Main menu</button></div></div>`;
  m.querySelector('[data-a="go"]').addEventListener('click', closeModal);
  m.querySelector('[data-a="quit"]').addEventListener('click', () => { closeModal(); UI.handlers.quit(); });
}

// ------------------------------------------------------------------ toasts

export function toast(text, kind = 'info') {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  box.prepend(el);
  while (box.children.length > 5) box.lastChild.remove();
  setTimeout(() => el.classList.add('out'), kind === 'alert' ? 5200 : 3600);
  setTimeout(() => el.remove(), kind === 'alert' ? 5800 : 4200);
}

// ------------------------------------------------------------------ keys

export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
}

function setSpeed(s) {
  if (s === 0) { G.paused = !G.paused; }
  else { G.speed = s; G.paused = false; }
  updateSpeedButtons();
}
function updateSpeedButtons() {
  for (const b of document.querySelectorAll('#speedbox [data-speed]')) {
    const s = +b.dataset.speed;
    b.classList.toggle('on', s === 0 ? G.paused : !G.paused && G.speed === s);
  }
  $('#paused-banner').classList.toggle('hidden', !(G.paused && !UI.modal));
}

function sendEarly() {
  const g = callWaveEarly();
  if (g) { toast(`Wave called early: +${g} gold`, 'good'); sfx('click'); }
}

function onKey(e) {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  if (G.mode !== 'play') return;
  const k = e.code;
  if (k === 'Tab' || k === 'F3' || k === 'Space') e.preventDefault();
  if (k === 'Escape') {
    if (UI.modal === 'pause') closeModal();
    else if (UI.modal) closeModal();
    else if (G.tool) { setTool(null); updateToolButtons(); }
    else if (G.selected) { G.selected = null; renderInfo(); }
    else openPause();
    return;
  }
  if (k === 'F3') { UI.perf = !UI.perf; SETTINGS.showFps = UI.perf; saveSettings(); return; }
  if (UI.modal) {
    if (k === 'KeyT' && UI.modal === 'research') closeModal();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === 'KeyS') {
    e.preventDefault();
    const ok = saveGame();
    toast(ok ? 'Game saved' : 'You can save between waves', ok ? 'good' : 'bad');
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'Space') setSpeed(0);
  else if (k === 'KeyR') toggleTool({ kind: 'road' });
  else if (k === 'KeyX') toggleTool({ kind: 'bulldoze' });
  else if (k === 'Delete') {
    if (G.selected && G.selected.def) infoAction('demolish'); else toggleTool({ kind: 'bulldoze' });
  } else if (k === 'KeyT') openResearch();
  else if (k === 'KeyN') sendEarly();
  else if (k === 'KeyU') { if (G.selected && G.selected.def && G.selected.def.upgradeCost) infoAction('upgrade'); }
  else if (k === 'Tab') setCategory(UI.cat === 'city' ? 'military' : 'city');
  else if (k === 'KeyH' || k === 'Home') { if (G.hq) focus(G.hq.x, G.hq.z + 3); }
  else if (k === 'KeyF') toggleFullscreen();
  else if (k === 'Equal' || k === 'NumpadAdd') setSpeed(Math.min(3, G.speed + 1));
  else if (k === 'Minus' || k === 'NumpadSubtract') setSpeed(Math.max(1, G.speed - 1));
  else if (/^Digit\d$/.test(k) || /^Numpad\d$/.test(k)) {
    const n = +k.slice(-1);
    const idx = n === 0 ? 9 : n - 1;
    const type = BUILD_ORDER[UI.cat][idx];
    if (type) pickBuilding(type);
  }
}

// ------------------------------------------------------------------ per-frame HUD

let hudT = 0, tipT = 0, mmT = 0;
const last = {};
function setText(el, v) { if (el._v !== v) { el._v = v; el.textContent = v; } }
function setHTML(el, v) { if (el._h !== v) { el._h = v; el.innerHTML = v; } }

export function updateHUD(dt, perf) {
  if (G.mode !== 'play') return;
  while (MSG.length) { const m = MSG.shift(); toast(m.text, m.kind); }
  tipT -= dt;
  if (tipT <= 0) { tipT = 0.08; updateTileTip(); }
  mmT -= dt;
  if (mmT <= 0) { mmT = 0.15; drawMinimap(); }
  updateHint();
  updateToolButtonsIfChanged();
  hudT -= dt;
  if (hudT > 0) return;
  hudT = 0.125;

  for (const k of RES) {
    const el = document.getElementById('r-' + k);
    if (!last[k]) last[k] = { b: el.querySelector('b'), s: el.querySelector('small') };
    setText(last[k].b, fmt(G.res[k]));
    const r = G.rates[k] || 0;
    setText(last[k].s, `${r >= 0 ? '+' : '−'}${Math.abs(r).toFixed(0)}/min`);
    last[k].s.className = r > 0.05 ? 'up' : r < -0.05 ? 'down' : '';
  }
  const pe = document.getElementById('r-pop');
  if (!last.pop) last.pop = { b: pe.querySelector('b'), s: pe.querySelector('small') };
  setText(last.pop.b, `${Math.floor(G.pop)} / ${G.housing}`);
  setText(last.pop.s, G.jobs ? `jobs ${G.jobs} · ${Math.round(G.eff * 100)}%` : 'no jobs yet');
  last.pop.s.className = G.eff < 0.999 ? 'down' : G.starving ? 'down' : '';
  pe.classList.toggle('alarm', G.starving);

  // wave box
  const w = G.wave;
  const hasRadar = G.buildings.some((b) => b.type === 'radar' && b.connected);
  setText($('#wb-name'), `Wave ${w.state === 'prep' ? w.n : w.current}`);
  setText($('#wb-goal'), G.victory ? 'endless' : `of ${VICTORY_WAVE}`);
  const bar = $('#wb-bar div');
  const early = $('#wb-early');
  if (w.state === 'prep') {
    setText($('#wb-timer'), `arrives in ${fmtTime(w.timer)}`);
    bar.style.width = '0%';
    early.classList.remove('hidden');
    setText(early.querySelector('span'), `+${Math.floor(w.timer * 0.6)}`);
    const plan = w.plan;
    let intel = '';
    if (plan) {
      if (hasRadar) {
        intel = Object.keys(plan.counts).map((t) => `<span class="ei ${ENEMIES[t].domain}">${plan.counts[t]}× ${ENEMIES[t].name}</span>`).join('');
      } else {
        let sea = 0, air = 0;
        for (const t in plan.counts) (ENEMIES[t].domain === 'air' ? (air += plan.counts[t]) : (sea += plan.counts[t]));
        intel = `<span class="ei sea">~${sea} ships</span>${air ? `<span class="ei air">~${air} aircraft</span>` : ''}<span class="ei dim">Radar reveals details</span>`;
      }
      if (hasRadar || w.timer < 25) intel += `<div class="dirs">${[...new Set(plan.dirs.map(compass))].map((d) => `From the ${d}`).join(' · ')}</div>`;
    }
    setHTML($('#wb-intel'), intel);
  } else {
    const alive = enemiesAlive();
    const left = alive + w.queue.length;
    setText($('#wb-timer'), `${left} enem${left === 1 ? 'y' : 'ies'} left`);
    bar.style.width = `${(100 * (1 - left / Math.max(1, (w.total || 1)))).toFixed(1)}%`;
    early.classList.add('hidden');
    setHTML($('#wb-intel'), '');
  }
  $('#wavebox').classList.toggle('active', w.state !== 'prep');

  updateBuildList();
  updateSpeedButtons();
  if (G.selected) updateInfo();
  if (UI.modal === 'research') refreshResearchAffordability();

  const pf = $('#perf');
  pf.classList.toggle('hidden', !UI.perf);
  if (UI.perf && perf) setHTML(pf, perf);
}

function refreshResearchAffordability() {
  for (const b of document.querySelectorAll('#modal [data-r]')) {
    const r = RESEARCH_BY_ID[b.dataset.r];
    b.classList.toggle('poor', b.disabled || !canAfford(r.cost(G.research[r.id] || 0)));
  }
  refreshCostSpans($('#modal'));
}

let lastToolSig = '';
function updateToolButtonsIfChanged() {
  const t = G.tool;
  const sig = t ? t.kind + (t.type || '') : '';
  if (sig !== lastToolSig) { lastToolSig = sig; updateToolButtons(); }
}

function updateHint() {
  const t = G.tool;
  let h;
  if (t && t.kind === 'build') h = `Placing <b>${BUILDINGS[t.type].name}</b> · left-click to build · right-click or Esc to stop`;
  else if (t && t.kind === 'road') h = 'Road · click and drag from tile to tile · 2 gold per tile · right-click to stop';
  else if (t && t.kind === 'bulldoze') h = 'Bulldoze · click or drag · buildings refund half their cost';
  else h = 'WASD move · Q/E rotate · wheel zoom · click a building to inspect · Space pause';
  setHTML($('#hint'), h);
}

// ------------------------------------------------------------------ minimap

const MM_SCALE = 300 / 66;
function mmPos(x, z) { return [150 + x * MM_SCALE, 150 + z * MM_SCALE]; }

function drawMinimapBase() {
  const c = document.createElement('canvas');
  c.width = c.height = 300;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a5f8e';
  ctx.beginPath(); ctx.arc(150, 150, 150, 0, Math.PI * 2); ctx.fill();
  // one path per colour keeps this cheap enough to redraw whenever the map changes
  const r = 1.02 * MM_SCALE;
  const groups = new Map();
  for (let i = 0; i < W.count; i++) {
    const t = W.type[i];
    if (t === T.DEEP) continue;
    const col = W.road[i] ? '#d9c497' : t === T.SHALLOW ? '#3fa9bb' : '#' + TERRAIN[t].color.toString(16).padStart(6, '0');
    if (!groups.has(col)) groups.set(col, []);
    groups.get(col).push(i);
  }
  for (const [col, tiles] of groups) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (const i of tiles) {
      const [x, y] = mmPos(W.x[i], W.z[i]);
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k - Math.PI / 6;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fill();
  }
  UI.mmBase = c;
  UI.mmVersion = W.version;
}

function drawMinimap() {
  const cv = $('#minimap canvas');
  if (!cv) return;
  if (!UI.mmBase || UI.mmVersion !== W.version) drawMinimapBase();
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 300, 300);
  ctx.save();
  ctx.beginPath(); ctx.arc(150, 150, 149, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(UI.mmBase, 0, 0);
  for (const b of G.buildings) {
    const [x, y] = mmPos(b.x, b.z);
    ctx.fillStyle = b.type === 'hq' ? '#ffd84a' : b.def.cat === 'military' ? '#7fb2ff' : '#f4efe4';
    const s = b.type === 'hq' ? 7 : 4.4;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
  }
  for (const a of G.allies) {
    if (!a.alive) continue;
    const [x, y] = mmPos(a.x, a.z);
    ctx.fillStyle = '#62a8ff';
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const [x, y] = mmPos(e.x, e.z);
    ctx.fillStyle = e.domain === 'air' ? '#ffb347' : '#ff3b30';
    ctx.beginPath();
    if (e.domain === 'air') { ctx.moveTo(x + Math.sin(e.yaw) * 5, y + Math.cos(e.yaw) * 5); ctx.lineTo(x + Math.sin(e.yaw + 2.5) * 4, y + Math.cos(e.yaw + 2.5) * 4); ctx.lineTo(x + Math.sin(e.yaw - 2.5) * 4, y + Math.cos(e.yaw - 2.5) * 4); }
    else ctx.arc(x, y, e.def.radius > 0.8 ? 4 : 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  // raid directions
  const w = G.wave;
  const hasRadar = G.buildings.some((b) => b.type === 'radar' && b.connected);
  if (w.state === 'prep' && w.plan && (hasRadar || w.timer < 25)) {
    ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 3;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 200);
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    for (const a of w.plan.dirs) {
      const x0 = 150 + Math.sin(a) * 140, y0 = 150 + Math.cos(a) * 140;
      const x1 = 150 + Math.sin(a) * 112, y1 = 150 + Math.cos(a) * 112;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + Math.sin(a + 0.5) * 10, y1 + Math.cos(a + 0.5) * 10);
      ctx.lineTo(x1 + Math.sin(a - 0.5) * 10, y1 + Math.cos(a - 0.5) * 10);
      ctx.closePath(); ctx.fillStyle = '#ff3b30'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // camera
  const [cx, cy] = mmPos(CAM.tx, CAM.tz);
  const fw = CAM.dist * 0.75 * MM_SCALE;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-CAM.yaw);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-fw * 1.1, -fw * 0.55, fw * 2.2, fw * 1.1);
  ctx.restore();
  ctx.restore();
  // north marker
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', 150, 18);
}
