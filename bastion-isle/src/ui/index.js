// Bastion Isle HUD entry point. main.js calls:
//   initUI({ sim, gfx, newGame, continueGame, toMenu, reroll, applySettings, renderer, camera, thumbs, silhouettes })
//   uiFrame(rdt, perfText)          every frame, after rendering (HUD text 4 Hz, bars 10 Hz)
//   showMainMenu(seed) / showHUD()  when entering the menu / a run
// Everything else (game over, victory, wave report, raid banners) is detected from G by uiFrame.
import { G, SETTINGS, saveSettings } from '../state.js';
import { W } from '../world.js';
import { BUILDINGS, ENEMIES, DIFFICULTY } from '../defs.js';
import { loadFonts } from './fonts.js';
import { $, $$, setText, setHTML, setClass, remPx, compassName, listJoin, errOf } from './util.js';
import { bindAPI, S, X, APP } from './bridge.js';
import { UI, sound, say } from './ustate.js';
import { buildTop, buildDock, openDrawer, closeDrawer, pickCard, refreshDock, refreshDrawer, updateTopText, updateBars, toggleTool, pickZone } from './hud.js';
import { renderInspector, updateInspector, renderTowerCard, placeTowerCard } from './inspector.js';
import { initLog, updateLog, banner, updateBanner, clearLog } from './log.js';
import { buildMap, drawBase, drawDynamic, refreshRail, renderLegend } from './minimap.js';
import { updateOverlay, cycleView, toggleView, VIEWS, setView } from './infoviews.js';
import { openSheet, closeSheet, updateSheet } from './sheets.js';
import { showMainMenu as menuScreen, openPause, closePause, hideScreen, blocking, applyHudSettings, showGameOver, showVictory, showWaveReport, openSettings, openHelp } from './menus.js';
import { initTips, updateTips } from './tooltip.js';
import { updateAdvisor, clearHints } from './advisor.js';
import { initChevrons, updateChevrons } from './chevrons.js';
import { hooks, setTool, setBrush, TOOL, mouse, focus, CAM, setOrbit, cancelDrag } from '../input.js';
import { icon } from './icons.js';

export { UI, S, X, APP };
export { showGameOver, showVictory, showWaveReport, openSettings, openHelp, openPause, closePause, openSheet, closeSheet, setView };

let tText = 0, tBars = 0, tChev = 0, tMap = 0, tInsp = 0, tSheet = 0;
let lastWaveState = null, lastReport = null, lastMode = null, lastVictory = false, lastPausedRaid = false;

export function setThumbs(t) { UI.thumbs = t || {}; if (UI.drawer) { const d = UI.drawer; closeDrawer(); openDrawer(d); } }
export function setSilhouettes(t) { UI.silhouettes = t || {}; }
export const isUIBlocking = () => blocking();

export function initUI(handlers = {}) {
  bindAPI(handlers);
  if (handlers.thumbs) UI.thumbs = handlers.thumbs;
  if (handlers.silhouettes) UI.silhouettes = handlers.silhouettes;
  loadFonts().then(() => { UI.layoutDirty = true; });
  const root = $('#ui') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'ui' }));
  root.innerHTML = `
  <div id="hud" class="hidden">
    <div id="pauseline"></div>
    <div id="frame"></div>
    <div id="chevrons"></div>
    <div id="towercard" class="hidden"></div>
    <div id="cursorchip" class="hidden"></div>
  </div>
  <div id="sheet" class="hidden"></div>
  <div id="screen" class="hidden"></div>
  <pre id="perf" class="hidden"></pre>
  <div id="tip" class="hidden"></div>`;
  const frame = $('#frame');
  buildTop(frame);
  frame.insertAdjacentHTML('beforeend', '<div id="advisor"></div><div id="log"></div><section id="inspector" class="panel hidden"></section>');
  buildDock(frame);
  buildMap(frame);
  initLog();
  initTips(root);
  initChevrons();
  applyHudSettings();

  // wiring
  frame.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-cat],[data-speed]');
    if (!b) return;
    if (b.dataset.cat) { openDrawer(b.dataset.cat); sound('click'); return; }
    if (b.dataset.speed != null) { setSpeed(+b.dataset.speed); return; }
    const a = b.dataset.act;
    if (a === 'budget') openSheet('budget');
    else if (a === 'menu') openPause();
    else if (a === 'early') callEarly();
    else if (a === 'pin') { UI.rcOpen = !UI.rcOpen; setClass($('#raidclock'), 'pinned', UI.rcOpen); sound('click'); }
    else if (a === 'bulldoze') toggleTool({ kind: 'bulldoze' });
    else if (a === 'research') openSheet('research');
  });
  UI.openSheet = openSheet;
  UI.openDrawer = openDrawer;
  UI.refreshRail = refreshRail;

  hooks.onSelect = () => { renderInspector(); };
  hooks.onError = (msg) => say(msg, 'bad');
  hooks.onPlaced = () => { refreshDrawer(); };
  hooks.onToolChange = () => { refreshDock(); refreshDrawer(); };
  hooks.isUIBlocking = () => blocking();

  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => { UI.layoutDirty = true; });
  if (APP.camera == null && handlers.camera) APP.camera = handlers.camera;
}

// ------------------------------------------------------------------ actions

export function setSpeed(s) {
  if (G.mode !== 'play') return;
  if (s === 0) G.paused = !G.paused;
  else { G.speed = s; G.paused = false; }
  sound('click');
}
function callEarly() {
  if (!G.wave || G.wave.state !== 'prep') return;
  const r = S.callWaveEarly();
  const err = errOf(r);
  if (err) { say(err, 'bad'); sound('error'); return; }
  sound('alarm');
  if (typeof r === 'number' && r > 0) say(`Raid called early: +$${r.toLocaleString('en-US')}`, 'good');
}

export function showMainMenu(seed) {
  setTool(null);
  closeDrawer(); closeSheet(); clearLog(); clearHints();
  G.selected = null; renderInspector();
  setView(null);
  menuScreen(seed);
  setOrbit(true, 0.02);
}

export function showHUD() {
  hideScreen();
  closeSheet();
  $('#hud').classList.remove('hidden');
  UI.shown = true;
  setOrbit(false);
  renderInspector();
  refreshDock();
  refreshRail();
  drawBase(true);
  lastWaveState = G.wave ? G.wave.state : null;
  lastReport = G.wave ? G.wave.report : null;
  lastVictory = !!G.victory;
  UI.layoutDirty = true;
  tText = tBars = 0;
}

// ------------------------------------------------------------------ keyboard

function onKey(e) {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' && document.activeElement.type !== 'range') return;
  const code = e.code;
  if (code === 'F3') { e.preventDefault(); UI.perf = !UI.perf; SETTINGS.showFps = UI.perf; saveSettings(); return; }
  if (code === 'KeyF' && !e.ctrlKey) { APP.fullscreen(); return; }
  if (UI.screen === 'menu') return;
  if (code === 'Escape') {
    e.preventDefault();
    if (UI.screen === 'pause') { closePause(); return; }
    if (UI.screen === 'settings' || UI.screen === 'help') { if (UI.settingsBack === 'pause' || UI.helpBack === 'pause') openPause(); else hideScreen(); return; }
    if (UI.screen === 'report') { hideScreen(); return; }
    if (UI.screen) return;
    if (mouse.left && G.tool) { cancelDrag(); return; }
    if (G.tool) { setTool(null); refreshDock(); refreshDrawer(); return; }
    if (UI.sheet) { closeSheet(); return; }
    if (UI.drawer) { closeDrawer(); return; }
    if (G.selected) { G.selected = null; renderInspector(); return; }
    openPause();
    return;
  }
  if (blocking() || G.mode !== 'play') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // Shift + 1..8 info views (by code so the shifted symbol does not matter)
  if (e.shiftKey && /^Digit[1-8]$/.test(code)) { const v = VIEWS[+code.slice(5) - 1]; if (v) { toggleView(v.id); refreshRail(); sound('click'); } return; }
  if (/^Digit[0-9]$/.test(code)) {
    const n = (+code.slice(5) + 9) % 10;
    if (pickCard(n)) return;
    return;
  }
  switch (code) {
    case 'Space': e.preventDefault(); setSpeed(0); break;
    case 'Equal': case 'NumpadAdd': setSpeed(Math.min(3, (G.speed || 1) + 1)); break;
    case 'Minus': case 'NumpadSubtract': setSpeed(Math.max(1, (G.speed || 1) - 1)); break;
    case 'KeyP': setSpeed(0); break;
    case 'KeyR': if (UI.drawer !== 'roads') openDrawer('roads'); else closeDrawer(); sound('click'); break;
    case 'KeyZ': if (UI.drawer !== 'zoning') openDrawer('zoning'); else { setTool(null); closeDrawer(); } sound('click'); break;
    case 'KeyX': case 'Delete':
      if (code === 'Delete' && G.selected && G.selected.def && G.selected.type !== 'hq') { const s = G.selected; const v = S.sellValue(s); const err = errOf(S.sell(s)); if (err) say(err, 'bad'); else { say(`Sold ${s.def.name} for $${v.toLocaleString('en-US')}`, 'info'); G.selected = null; renderInspector(); } break; }
      toggleTool({ kind: 'bulldoze' }); break;
    case 'KeyB': openSheet('budget'); break;
    case 'KeyT': openSheet('research'); break;
    case 'KeyL': openSheet('log'); break;
    case 'KeyV': cycleView(e.shiftKey ? -1 : 1); refreshRail(); sound('click'); break;
    case 'KeyN': callEarly(); break;
    case 'KeyH': if (G.hq) focus(G.hq.x, G.hq.z, 28); break;
    case 'KeyU': if (G.selected && G.selected.def) { const err = errOf(S.upgrade(G.selected)); if (err) { say(err, 'bad'); sound('error'); } else sound('upgrade'); renderInspector(); } break;
    case 'BracketLeft': setBrush(TOOL.brush - 1); refreshDrawer(); break;
    case 'BracketRight': setBrush(TOOL.brush + 1); refreshDrawer(); break;
    default: break;
  }
}

// ------------------------------------------------------------------ per-frame state watching

function enemySummary(counts) {
  let sea = 0, air = 0;
  for (const k in counts) { const e = ENEMIES[k]; if (!e) continue; if (e.domain === 'air') air += counts[k]; else sea += counts[k]; }
  return { sea, air };
}

function watchState() {
  const w = G.wave;
  if (G.mode !== lastMode) {
    if (G.mode === 'over' && lastMode === 'play') setTimeout(() => { if (G.mode === 'over') showGameOver(G.overReason); }, 2400);
    lastMode = G.mode;
  }
  if (G.mode !== 'play' || !w) return;
  if (w.state !== lastWaveState) {
    if (w.state === 'active' && lastWaveState === 'prep') {
      const counts = (w.plan && w.plan.counts) || {};
      const { sea, air } = enemySummary(counts);
      const ABBR = { north: 'N', 'north-east': 'NE', east: 'E', 'south-east': 'SE', south: 'S', 'south-west': 'SW', west: 'W', 'north-west': 'NW' };
      let dirs = [...new Set(((w.plan && w.plan.dirs) || []).map(compassName))];
      if (dirs.length > 1) dirs = dirs.map((d) => ABBR[d] || d);
      const kind = air && !sea ? 'AIR RAID' : sea && !air ? 'NAVAL RAID' : `RAID ${w.current || w.n}`;
      const parts = [];
      if (sea) parts.push(`${sea} ship${sea === 1 ? '' : 's'}`);
      if (air) parts.push(`${air} aircraft`);
      banner(`${kind}: ${listJoin(parts) || 'enemies'}${dirs.length ? ` from the ${listJoin(dirs)}` : ''}`);
      UI.raidPulse = 1.5;
      if (SETTINGS.autoPauseRaid && !G.paused) { G.paused = true; say('Paused: a raid has started (Settings)', 'info'); }
    }
    lastWaveState = w.state;
  }
  if (w.report && w.report !== lastReport) {
    lastReport = w.report;
    if (w.state !== 'active') showWaveReport(w.report);
  }
  if (G.victory && !lastVictory) { lastVictory = true; showVictory(); }
  const hqLow = G.hq && G.hq.hp < G.hq.maxHp * 0.5;
  if (hqLow && !lastPausedRaid && SETTINGS.autoPauseHQ && !G.paused) { G.paused = true; say('Paused: the Town Hall is below 50%', 'alert', G.hq.x, G.hq.z); }
  lastPausedRaid = !!hqLow;
}

function layout() {
  UI.layoutDirty = false;
  UI.rem = remPx();
  const r = $('#frame').getBoundingClientRect();
  UI.frameRect = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
}

// ------------------------------------------------------------------ frame

// run every throttled update on the next frame (after loading a game, switching scenes in tests)
export function forceRefresh() { tText = tBars = tChev = tMap = tInsp = tSheet = 0; UI.layoutDirty = true; drawBase(true); }

export function uiFrame(dt, perfText) {
  if (UI.layoutDirty) layout();
  updateLog();
  updateBanner(dt);
  watchState();
  updateOverlay(dt);
  updateTips(dt);

  const perf = UI.perfEl || (UI.perfEl = $('#perf'));
  setClass(perf, 'hidden', !UI.perf);
  if (UI.perf && perfText != null) setHTML(perf, String(perfText));

  if (!UI.shown || G.mode === 'menu') return;
  tText -= dt; tBars -= dt; tChev -= dt; tMap -= dt; tInsp -= dt; tSheet -= dt;
  if (tText <= 0) { tText = 0.25; updateTopText(0.25); refreshDrawer(); renderLegend(false); updateAdvisor(0.25); }
  if (tBars <= 0) { tBars = 0.1; updateBars(); }
  if (tInsp <= 0) { tInsp = 0.25; updateInspector(); }
  if (tSheet <= 0) { tSheet = 0.25; updateSheet(); }
  if (tMap <= 0) { tMap = 0.1; drawBase(false); drawDynamic(APP.camera); }
  if (tChev <= 0) { tChev = 0.1; updateChevrons(APP.camera); }
  placeTowerCard();
  updateCursorChip();
  if (UI.raidPulse > 0) { UI.raidPulse -= dt; setClass($('#hud'), 'raidpulse', UI.raidPulse > 0); }
}

function updateCursorChip() {
  const c = UI.chipEl || (UI.chipEl = $('#cursorchip'));
  const on = !!TOOL.chip && mouse.over && G.tool && !UI.screen;
  setClass(c, 'hidden', !on);
  if (!on) return;
  setText(c, TOOL.chip);
  setClass(c, 'bad', TOOL.chipBad);
  const rem = UI.rem || 15;
  const tr = `translate(${Math.round(mouse.x + rem * 1.1)}px, ${Math.round(mouse.y + rem * 1.1)}px)`;
  if (c._tr !== tr) { c._tr = tr; c.style.transform = tr; }
}

export { pickZone, setTool, CAM, BUILDINGS, DIFFICULTY, W, icon, $$ };
