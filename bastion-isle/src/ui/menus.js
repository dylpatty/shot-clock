// Full-screen and modal screens: main menu (left-aligned showcase over the orbiting island), pause, settings, how to
// play with the keyboard map, game over (with the reason), victory, and the post-raid report.
import { G, SETTINGS, saveSettings } from '../state.js';
import { DIFFICULTY, ENEMIES, MONEY, VICTORY_WAVE, AIM_TEXT } from '../defs.js';
import { PRESETS } from '../gfx/post.js';
import { icon } from './icons.js';
import { $, $$, esc, fmtMoney, fmtInt, fmtTime, errOf } from './util.js';
import { S, APP } from './bridge.js';
import { UI, sound, say } from './ustate.js';
import { ENEMY_ICON } from './hud.js';

const EMBLEM = `<svg class="emblem" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" class="e-out"/><path d="M32 12 49 22v20L32 52 15 42V22z" class="e-in"/><path d="M20 40h24l-3-5H23z M26 35V25l6-4 6 4v10" class="e-mark"/></svg>`;

function screen(name, html, cls = '') {
  const s = $('#screen');
  UI.screen = name;
  s.className = `scr-${name} ${cls}`;
  s.innerHTML = html;
  UI.hideTip && UI.hideTip();
  return s;
}
export function hideScreen() {
  const s = $('#screen');
  s.className = 'hidden';
  s.innerHTML = '';
  UI.screen = null;
}
export const blocking = () => !!UI.screen && UI.screen !== 'report';

// ------------------------------------------------------------------ main menu

function diffDetail(k, sandbox) {
  const d = DIFFICULTY[sandbox ? 'sandbox' : k];
  if (sandbox) return `${fmtMoney(d.money)} to start · raids off (switch them on any time) · every structure still needs its milestone`;
  return `${fmtMoney(d.money)} to start · first raid at ${fmtTime(d.firstWave)} · ${fmtTime(d.gap)} between raids · raid size ×${d.budget.toFixed(1)}`;
}

export function showMainMenu(seed) {
  if (seed != null) UI.menuSeed = seed;
  $('#hud').classList.add('hidden');
  UI.shown = false;
  const cont = S.hasSave();
  const s = screen('menu', `
  <div class="mn-shade"></div>
  <div class="mn-frame">
    <div class="mn-panel">
      <div class="mn-brand">${EMBLEM}<div><h1>BASTION ISLE</h1><div class="mn-kicker">Harbour city · coastal defence</div></div></div>
      <p class="mn-tag">Zone a harbour town on a hex island, keep it powered and solvent, then hold the coast when the raids come in from the sea and the sky.</p>
      <div class="mn-actions">
        ${cont ? `<button class="btn big ch pri" data-go="continue">${icon('player-play')}<span>Continue</span><small>saved between raids</small></button>` : ''}
        <button class="btn big ch ${cont ? '' : 'pri'}" data-go="new">${icon('flag-2')}<span>New game</span><small data-k="seedtxt">Island #${UI.menuSeed}</small></button>
      </div>
      <div class="mn-setup">
        <div class="mn-row"><label>Difficulty</label><div class="seg" data-k="diff">${['relaxed', 'standard', 'hard'].map((k) => `<button class="ch ${UI.difficulty === k ? 'on' : ''}" data-diff="${k}">${DIFFICULTY[k].name}</button>`).join('')}</div>
          <button class="tgb ${UI.sandbox ? 'on' : ''}" data-sandbox="1"><i class="box"></i><span>Sandbox</span></button></div>
        <div class="mn-detail" data-k="detail">${diffDetail(UI.difficulty, UI.sandbox)}</div>
        <div class="mn-row"><label>Island</label><span class="mn-seed tnum" data-k="seed">#${UI.menuSeed}</span><button class="btn ch sm" data-go="reroll">${icon('dice-5')}<span>Another island</span></button></div>
      </div>
      <div class="mn-links">
        <button class="btn ch" data-go="settings">${icon('settings')}<span>Settings</span></button>
        <button class="btn ch" data-go="help">${icon('help-circle')}<span>How to play</span></button>
        <button class="btn ch" data-go="fullscreen">${icon('maximize')}<span>Fullscreen</span><kbd>F</kbd></button>
      </div>
      <div class="mn-foot">Barlow Semi Condensed (SIL OFL) · Tabler Icons (MIT) · three.js</div>
    </div>
  </div>`, 'menu');
  s.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    sound('click');
    if (b.dataset.diff) { UI.difficulty = b.dataset.diff; UI.sandbox = false; return showMainMenu(); }
    if (b.dataset.sandbox) { UI.sandbox = !UI.sandbox; return showMainMenu(); }
    const go = b.dataset.go;
    if (go === 'new') APP.newGame({ seed: UI.menuSeed, difficulty: UI.sandbox ? 'sandbox' : UI.difficulty, sandbox: UI.sandbox });
    else if (go === 'continue') APP.continueGame();
    else if (go === 'reroll') { const n = APP.reroll(); if (n != null) UI.menuSeed = n; else UI.menuSeed = 1 + Math.floor(Math.random() * 999999); showMainMenu(); }
    else if (go === 'settings') openSettings('menu');
    else if (go === 'help') openHelp('menu');
    else if (go === 'fullscreen') APP.fullscreen();
  });
}

// ------------------------------------------------------------------ pause

export function openPause() {
  if (G.mode !== 'play') return;
  if (!UI.screen) UI.pausedByMenu = !G.paused;
  G.paused = true;
  const canSave = !G.wave || G.wave.state !== 'active';
  const s = screen('pause', `<div class="modal panel narrow">
    <header class="sh-head">${icon('player-pause')}<h2>Paused</h2><span class="sh-sub">Raid ${G.wave ? G.wave.n : 1} · ${fmtTime(G.time)} played</span></header>
    <div class="md-list">
      <button class="btn big ch pri" data-a="resume">${icon('player-play')}<span>Resume</span><kbd>Esc</kbd></button>
      <button class="btn ch" data-a="save" ${canSave ? '' : 'disabled'}>${icon('device-floppy')}<span>Save game</span><small>${canSave ? 'also saves after every raid' : 'only between raids'}</small></button>
      <button class="btn ch" data-a="settings">${icon('settings')}<span>Settings</span></button>
      <button class="btn ch" data-a="help">${icon('keyboard')}<span>How to play and keys</span></button>
      <button class="btn ch danger" data-a="quit">${icon('door-exit')}<span>Quit to main menu</span></button>
    </div></div>`, 'dim');
  s.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    sound('click');
    const a = b.dataset.a;
    if (a === 'resume') closePause();
    else if (a === 'save') { const ok = S.saveGame(); say(ok === false ? 'Could not save the game' : 'Game saved', ok === false ? 'bad' : 'good'); closePause(); }
    else if (a === 'settings') openSettings('pause');
    else if (a === 'help') openHelp('pause');
    else if (a === 'quit') { hideScreen(); APP.toMenu(); }
  });
}
export function closePause() {
  hideScreen();
  if (UI.pausedByMenu) G.paused = false;
  UI.pausedByMenu = false;
}

// ------------------------------------------------------------------ settings

const seg = (key, opts) => `<div class="seg" data-set="${key}">${opts.map(([v, l]) => `<button class="ch ${String(SETTINGS[key]) === String(v) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>`;
const tog = (key, label) => `<button class="tgb ${SETTINGS[key] ? 'on' : ''}" data-tog="${key}"><i class="box"></i><span>${label}</span></button>`;
const slider = (key, min, max, step, fmt) => `<div class="sl"><input type="range" min="${min}" max="${max}" step="${step}" value="${SETTINGS[key]}" data-sl="${key}"><b class="tnum" data-slv="${key}">${fmt(SETTINGS[key])}</b></div>`;
const pct = (v) => `${Math.round(v * 100)}%`;

export function openSettings(back) {
  UI.settingsBack = back || UI.settingsBack || 'menu';
  const s = screen('settings', `<div class="modal panel wide">
    <header class="sh-head">${icon('settings')}<h2>Settings</h2><button class="ib ch" data-a="back" aria-label="Back">${icon('x')}</button></header>
    <div class="set-grid">
      <section><h4>Graphics</h4>
        <div class="set-row"><label>Quality preset</label>${seg('quality', Object.keys(PRESETS).map((k) => [k, PRESETS[k].label]))}</div>
        <div class="set-note">High is tuned for 180 fps at 3440×1440 on a modern gaming GPU. Performance drops ambient occlusion.</div>
        <div class="set-row"><label>Render scale</label>${slider('renderScale', 0.5, 1, 0.05, pct)}</div>
        <div class="set-row"><label>Performance overlay</label>${tog('showFps', 'Show (F3)')}</div>
      </section>
      <section><h4>Interface</h4>
        <div class="set-row"><label>HUD scale</label>${slider('hudScale', 0.8, 1.3, 0.05, pct)}</div>
        <div class="set-row"><label>HUD width</label>${seg('hudWidth', [['centred', 'Centred'], ['full', 'Full width']])}</div>
        <div class="set-note">Centred keeps the side margins of an ultrawide clear for incoming raids.</div>
        <div class="set-row"><label>Edge scrolling</label>${tog('edgeScroll', 'Move at screen edges')}</div>
      </section>
      <section><h4>World</h4>
        <div class="set-row"><label>Time of day</label>${seg('dayNight', [['cycle', 'Cycle'], ['day', 'Always day'], ['golden', 'Golden hour']])}</div>
        <div class="set-note">A full cycle lasts 12 minutes: 8 of day, 2 of night, two golden hours. Night is visual only.</div>
      </section>
      <section><h4>Gameplay</h4>
        <div class="set-row"><label>Raid starts</label>${tog('autoPauseRaid', 'Pause the game')}</div>
        <div class="set-row"><label>Town Hall below 50%</label>${tog('autoPauseHQ', 'Pause the game')}</div>
        <h4>Audio</h4>
        <div class="set-row"><label>Volume</label>${slider('volume', 0, 1, 0.05, pct)}</div>
      </section>
    </div>
    <footer class="md-foot"><button class="btn ch pri" data-a="back">${icon('chevron-left')}<span>Back</span></button></footer></div>`, UI.settingsBack === 'menu' ? 'over-menu' : 'dim');
  const apply = (key, v) => {
    SETTINGS[key] = v;
    saveSettings();
    applyHudSettings();
    APP.applySettings(key);
  };
  s.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    sound('click');
    if (b.dataset.a === 'back') { if (UI.settingsBack === 'pause') openPause(); else showMainMenu(); return; }
    const sg = b.closest('[data-set]');
    if (sg && b.dataset.v != null) {
      const key = sg.dataset.set;
      apply(key, b.dataset.v);
      for (const x of $$('button', sg)) x.classList.toggle('on', x === b);
      return;
    }
    if (b.dataset.tog) { const k = b.dataset.tog; apply(k, !SETTINGS[k]); b.classList.toggle('on', !!SETTINGS[k]); if (k === 'showFps') UI.perf = SETTINGS.showFps; }
  });
  for (const r of $$('input[data-sl]', s)) {
    r.addEventListener('input', () => {
      const k = r.dataset.sl;
      $(`[data-slv="${k}"]`, s).textContent = pct(+r.value);
      // HUD scale applies on release so the panel does not jump under the cursor
      if (k !== 'hudScale') apply(k, +r.value); else { SETTINGS[k] = +r.value; saveSettings(); }
    });
    r.addEventListener('change', () => { if (r.dataset.sl === 'hudScale') apply('hudScale', +r.value); });
  }
}

export function applyHudSettings() {
  const root = document.documentElement;
  root.style.setProperty('--hud-scale', String(Math.max(0.8, Math.min(1.3, +SETTINGS.hudScale || 1))));
  root.classList.toggle('hud-full', SETTINGS.hudWidth === 'full');
  UI.perf = !!SETTINGS.showFps;
  UI.layoutDirty = true;
}

// ------------------------------------------------------------------ how to play + keyboard map

export const KEYMAP = [
  ['Camera', [['W A S D / arrows', 'Pan (Shift: faster)'], ['Right-drag', 'Pan by grabbing the ground'], ['Q / E, middle-drag', 'Rotate (middle-drag also tilts)'], ['Wheel', 'Zoom towards the cursor'], ['H', 'Jump to the Town Hall'], ['Minimap click', 'Move the camera there']]],
  ['Build', [['R', 'Roads (drag to plan, release to build)'], ['Z', 'Zoning drawer'], ['[ ]', 'Zone brush 1 / 7 / 19 tiles'], ['Shift + drag', 'Zone along a road'], ['X', 'Bulldoze (drag)'], ['1 – 0', 'Pick a card in the open drawer'], ['Right-click, Esc', 'Cancel tool, deselect']]],
  ['Manage', [['B', 'Budget and taxes'], ['T', 'Research'], ['V / Shift+V', 'Next / previous info view'], ['Shift + 1…8', 'Info view directly'], ['L', 'Harbour Log history'], ['U, Delete', 'Upgrade, sell the selection'], ['N', 'Call the next raid early']]],
  ['Time', [['Space', 'Pause'], ['+ / −', 'Game speed 1× – 3×'], ['Esc', 'Menu'], ['F, F3', 'Fullscreen, performance overlay']]],
];

export function openHelp(back) {
  UI.helpBack = back || 'menu';
  const keys = KEYMAP.map(([h, rows]) => `<div class="kb-group"><h5>${h}</h5>${rows.map(([k, d]) => `<div class="kb-row"><span class="kb-keys">${k.split(/(\s\/\s|,\s|\s\+\s|\s–\s|…)/).map((p) => (/^(\s\/\s|,\s|\s\+\s|\s–\s|…)$/.test(p) ? `<i>${p.trim()}</i>` : p.trim() ? `<kbd>${esc(p.trim())}</kbd>` : '')).join('')}</span><span>${esc(d)}</span></div>`).join('')}</div>`).join('');
  const s = screen('help', `<div class="modal panel wide help">
    <header class="sh-head">${icon('help-circle')}<h2>How to play</h2><button class="ib ch" data-a="back" aria-label="Back">${icon('x')}</button></header>
    <div class="hp-grid">
      <section><h4>${icon('building-community')}The city</h4>
        <p><b>Roads</b> link everything to the Town Hall. <b>Zone</b> residential, commercial and industrial lots beside them; buildings grow by themselves when the demand bars are up and the lot has power and water.</p>
        <p><b>Power and water</b> are one shared network. Wind turbines and water towers start you off; keep both under 90%.</p>
        <p><b>Services</b> (fire, police, clinic, school) raise land value and let buildings reach level 2 and 3. The inspector shows exactly what a lot is missing.</p>
        <p><b>Taxes</b> fund upkeep. Each point above 10% costs demand. Below $0 you cannot build; stay too deep for too long and the island goes bankrupt.</p>
      </section>
      <section><h4>${icon('shield-half')}The defence</h4>
        <p>Raids arrive on the <b>Raid Clock</b>. Its preview names every ship and aircraft and what it is after. <b>Radar</b> reveals the approach lanes.</p>
        <p><b>Coastal guns</b> outrange ships, <b>MG posts</b> and <b>barracks</b> stop landing parties, <b>flak</b> and <b>missiles</b> bring down aircraft. Set each tower's targeting in its card.</p>
        <p>Shells and bombs start <b>fires</b>; roads are firebreaks and fire stations send trucks. Ruins can be rebuilt from the raid report.</p>
        <p>Lose the <b>Town Hall</b> or go bankrupt and the run ends. Survive raid ${VICTORY_WAVE} to win.</p>
      </section>
      <section class="kb">${keys}</section>
    </div>
    <footer class="md-foot"><button class="btn ch pri" data-a="back">${icon('chevron-left')}<span>Back</span></button></footer></div>`, UI.helpBack === 'menu' ? 'over-menu' : 'dim');
  s.addEventListener('click', (e) => {
    if (!e.target.closest('[data-a="back"]')) return;
    sound('click');
    if (UI.helpBack === 'pause') openPause(); else if (UI.helpBack === 'game') hideScreen(); else showMainMenu();
  });
}

// ------------------------------------------------------------------ end screens

function statGrid(rows) { return `<div class="end-stats">${rows.map(([l, v]) => `<div><span>${l}</span><b class="tnum">${v}</b></div>`).join('')}</div>`; }

export function showGameOver(reason) {
  reason = reason || G.overReason || (G.hq && G.hq.hp <= 0 ? 'hq' : 'hq');
  const why = reason === 'bankrupt'
    ? ['The island went bankrupt', 'The treasury stayed in the red for too long. Upkeep outran taxes and spoils.']
    : ['The Town Hall has fallen', 'Raiders broke through to the seat of government. The island is lost.'];
  const st = G.stats || {};
  const s = screen('over', `<div class="end panel e-lose">
    <div class="end-icon">${icon(reason === 'bankrupt' ? 'coins' : 'skull')}</div>
    <h2>${why[0]}</h2><p>${why[1]}</p>
    ${statGrid([['Raids survived', fmtInt(st.waves || Math.max(0, (G.wave.n || 1) - 1))], ['Population', fmtInt(G.pop)], ['Enemies destroyed', fmtInt(st.kills || 0)], ['Lots lost', fmtInt(st.lotsLost || 0)], ['Time played', fmtTime(G.time)], ['Difficulty', (DIFFICULTY[G.difficulty] || DIFFICULTY.standard).name]])}
    <div class="end-act"><button class="btn big ch pri" data-a="new">${icon('refresh')}<span>Try another island</span></button><button class="btn big ch" data-a="menu">${icon('door-exit')}<span>Main menu</span></button></div></div>`, 'dim');
  s.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    sound('click');
    hideScreen();
    if (b.dataset.a === 'new') APP.newGame({ seed: 1 + Math.floor(Math.random() * 999999), difficulty: G.difficulty || 'standard', sandbox: G.difficulty === 'sandbox' });
    else APP.toMenu();
  });
}

export function showVictory() {
  const st = G.stats || {};
  const s = screen('victory', `<div class="end panel e-win">
    <div class="end-icon">${icon('trophy')}</div>
    <h2>The island holds</h2><p>Raid ${VICTORY_WAVE} repelled. The harbour is safe, and the raids will keep coming for as long as you want to play.</p>
    ${statGrid([['Population', fmtInt(G.pop)], ['Enemies destroyed', fmtInt(st.kills || 0)], ['Treasury', fmtMoney(G.money)], ['Time played', fmtTime(G.time)]])}
    <div class="end-act"><button class="btn big ch pri" data-a="go">${icon('player-play')}<span>Keep playing</span></button><button class="btn big ch" data-a="menu">${icon('door-exit')}<span>Main menu</span></button></div></div>`, 'dim');
  s.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    sound('click');
    hideScreen();
    if (b.dataset.a === 'menu') APP.toMenu();
  });
}

// ------------------------------------------------------------------ raid report (after every raid, non-blocking)

export function showWaveReport(r) {
  r = r || (G.wave && G.wave.report);
  if (!r) return;
  const kills = Object.keys(r.kills || {}).filter((k) => r.kills[k] > 0);
  const killN = kills.reduce((a, k) => a + r.kills[k], 0);
  const plan = (G.wave && G.wave.plan) || {};
  const counts = plan.counts || {};
  const cost = r.ruinsCost != null ? r.ruinsCost : S.ruinsCost();
  const next = Object.keys(counts).filter((k) => counts[k] > 0).map((k) => `<li class="${ENEMIES[k].domain}">${icon(ENEMY_ICON[k] || 'skull')}<b>${ENEMIES[k].name} ×${counts[k]}</b><span>→ ${esc((plan.targets && plan.targets[k]) || AIM_TEXT[ENEMIES[k].aim] || '')}</span></li>`).join('');
  const s = screen('report', `<div class="report panel">
    <header class="sh-head">${icon('flag-2')}<h2>Raid ${r.n || ''} repelled</h2><span class="sh-sub">${fmtInt(killN)} destroyed</span><button class="ib ch" data-a="close" aria-label="Close">${icon('x')}</button></header>
    <div class="rp-kills">${kills.map((k) => `<span class="rc-unit ${ENEMIES[k] ? ENEMIES[k].domain : ''}">${UI.silhouettes[k] ? `<img src="${UI.silhouettes[k]}" alt="">` : icon(ENEMY_ICON[k] || 'skull')}<b class="tnum">×${r.kills[k]}</b></span>`).join('') || '<span class="dim">No kills</span>'}</div>
    <div class="rp-grid">
      <div><span>Bounties</span><b class="tnum pos">+${fmtMoney(r.bounty || 0)}</b></div>
      <div><span>Clear bonus</span><b class="tnum pos">+${fmtMoney(r.bonus != null ? r.bonus : MONEY.waveClearBase + MONEY.waveClearPerWave * (r.n || 1))}</b></div>
      <div><span>Your structures lost</span><b class="tnum ${r.lostOwn ? 'neg' : ''}">${fmtInt(r.lostOwn || 0)}</b></div>
      <div><span>City buildings lost</span><b class="tnum ${r.lostPrivate ? 'neg' : ''}">${fmtInt(r.lostPrivate || 0)}</b></div>
      <div><span>Fires started / put out</span><b class="tnum">${fmtInt(r.firesStarted || 0)} / ${fmtInt(r.firesOut || 0)}</b></div>
      <div><span>Repair bill</span><b class="tnum neg">−${fmtMoney(r.repairBill || 0).slice(1)}</b></div>
      <div><span>Tax lost (est.)</span><b class="tnum neg">−${fmtMoney(r.taxLost || 0).slice(1)}</b></div>
      <div><span>Town Hall</span><b class="tnum">${G.hq ? Math.round((G.hq.hp / G.hq.maxHp) * 100) + '%' : '—'}</b></div>
    </div>
    <div class="rp-next"><h4>Next: raid ${(G.wave && G.wave.n) || ''} in ${fmtTime(G.wave ? G.wave.timer : 0)}</h4><ul class="rc-targets">${next || '<li class="none">Not planned yet</li>'}</ul></div>
    <footer class="md-foot">
      <button class="btn ch up" data-a="rebuild" ${cost > 0 ? '' : 'disabled'}>${icon('hammer')}<span>Rebuild all ruins</span><b class="tnum">${cost > 0 ? fmtMoney(cost) : 'none'}</b></button>
      <button class="btn ch pri" data-a="close">${icon('player-play')}<span>Continue</span></button>
    </footer></div>`);
  s.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    sound('click');
    if (b.dataset.a === 'rebuild') {
      const err = errOf(S.rebuildAllRuins());
      if (err) { say(err, 'bad'); sound('error'); return; }
      say('Ruins rebuilt', 'good');
      b.disabled = true;
      return;
    }
    hideScreen();
  });
}
