// Tooltips: HUD elements with data-tip (120 ms delay) and the world tile under the cursor (250 ms), 1rem from the
// cursor, max 22rem. Demand, land value, budget and threat tips break the number into its terms.
import { G, SETTINGS } from '../state.js';
import { W, LF, CV, TERRAIN, isLand, isWater } from '../world.js';
import { BUILDINGS, ZONES, MILESTONES, ENEMIES, MONEY, ROADS, AIM_TEXT, DIFFICULTY, PROMINENCE, RESEARCH_BY_ID } from '../defs.js';
import { icon } from './icons.js';
import { $, esc, fmtMoney, fmtSignedMoney, fmtInt, fmtTime, terms } from './util.js';
import { S } from './bridge.js';
import { UI } from './ustate.js';
import { mouse, TOOL } from '../input.js';
import { DOMAIN_NAME, milestoneOf, keyStat } from './hud.js';
import { coverageAt, VIEW_BY_ID, IV } from './infoviews.js';
import { lotName } from './inspector.js';

let tipEl = null, hudKey = null, hudAnchor = null, hudTimer = 0, worldTile = -1, worldSince = 0, shown = null, pinUntil = 0;

const ROWCLS = { pos: 'up', neg: 'dn' };
const row = (label, value, cls = '') => `<div class="tp-row ${ROWCLS[cls] || cls}"><span>${esc(label)}</span><b class="tnum">${value}</b></div>`;
const sgn = (v, d = 0) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}`;
function termRows(list, d = 0, unit = '') {
  return list.map((t) => row(t.label, `${sgn(t.value, d)}${unit}`, t.value > 0.05 ? 'pos' : t.value < -0.05 ? 'neg' : '')).join('');
}
const title = (t, sub = '') => `<div class="tp-title">${t}${sub ? `<small>${sub}</small>` : ''}</div>`;
const note = (t, cls = '') => `<div class="tp-note ${cls}">${t}</div>`;

function demandTerms(k) {
  const all = S.demandBreakdown ? S.demandBreakdown() : G.demandTerms;
  return terms((all && all[k]) || (G.demandTerms && G.demandTerms[k]));
}

function lvTerms(i) { return terms(S.landValueBreakdown(i)); }

function budgetLines() {
  const b = S.budgetBreakdown ? S.budgetBreakdown() : null;
  if (b) return { income: terms(b.income), expense: terms(b.expense) };
  const inc = G.budget && G.budget.income ? G.budget.income : {};
  const exp = G.budget && G.budget.expense ? G.budget.expense : {};
  const L = { R: 'Residential tax', C: 'Commercial tax', I: 'Industrial tax', spoils: 'War spoils' };
  return {
    income: Object.keys(inc).map((k) => ({ label: L[k] || k, value: inc[k] })),
    expense: Object.keys(exp).map((k) => ({ label: k[0].toUpperCase() + k.slice(1), value: -Math.abs(exp[k]) })),
  };
}

// ------------------------------------------------------------------ HUD tips

export function tipFor(key) {
  if (!key) return '';
  if (key.startsWith('b-')) return buildingTip(key.slice(2));
  if (key.startsWith('demand-')) {
    const k = key.slice(7), Z = ZONES[{ R: 1, C: 2, I: 3 }[k]];
    const v = (G.demand && G.demand[k]) || 0;
    const t = demandTerms(k);
    return title(`${Z.name} demand`, `${sgn(v)}`) + (t.length ? termRows(t) : note('Terms appear once the city is running.')) + note(v > 0 ? 'Positive: new buildings will grow on empty lots.' : 'Negative: no growth; long oversupply empties buildings.');
  }
  if (key.startsWith('zone-')) {
    const k = key.slice(5), z = { R: 1, C: 2, I: 3 }[k], Z = ZONES[z];
    const lv = Z.levels.map((l, n) => `L${n + 1} ${l.cap}`).join(' · ');
    return title(Z.name, 'Free · paint next to roads') + note(z === 1 ? 'Homes. Residents pay tax and fill jobs.' : z === 2 ? 'Shops and offices. Jobs and tax; needs customers.' : 'Workshops and factories. Jobs and tax; pollutes within 3 tiles.')
      + row(z === 1 ? 'Residents' : 'Jobs', lv) + row('Demand', sgn((G.demand && G.demand[k]) || 0)) + termRows(demandTerms(k)) + note('Brush 1 / 7 / 19 with [ ]. Shift-drag fills along a road.', 'dim');
  }
  if (key.startsWith('lv-')) {
    const i = +key.slice(3);
    const t = lvTerms(i);
    return title(`Land value ${W.lv[i]}`, lotName(i)) + (t.length ? termRows(t) : note('No breakdown available yet.'));
  }
  if (key.startsWith('req-')) {
    const k = key.slice(4);
    const txt = { road: 'A road next to the lot, linked to the Town Hall.', power: 'Enough power on the network.', water: 'Enough water on the network.', fire: 'Inside a fire station\'s district.', police: 'Inside a police station\'s district.', health: 'Inside a clinic or hospital\'s district.', school: 'Inside a school\'s district.' }[k];
    return title(k[0].toUpperCase() + k.slice(1)) + note(txt) + note('Green: the lot has it. Red: the next level needs it.', 'dim');
  }
  if (key.startsWith('enemy-')) {
    const e = ENEMIES[key.slice(6)];
    if (!e) return '';
    return title(e.name, e.domain === 'sea' ? 'Ship' : e.domain === 'air' ? 'Aircraft' : 'Troops') + row('Health', fmtInt(e.hp)) + row('Bounty', fmtMoney(e.bounty)) + note(`Goes for ${AIM_TEXT[e.aim] || 'whatever is nearest'}.`);
  }
  if (key.startsWith('view-')) {
    const v = VIEW_BY_ID[key.slice(5)];
    return v ? title(v.name, `Shift+${v.key}`) + note('V cycles views. Press again to switch sub-view or close.', 'dim') : '';
  }
  if (key.startsWith('cat-')) {
    const k = key.slice(4);
    const names = { roads: ['Roads', 'R'], zoning: ['Zoning', 'Z'], power: ['Power'], water: ['Water'], services: ['Services'], parks: ['Parks'], coastal: ['Coastal defence'], air: ['Air defence'], support: ['Support'] }[k] || [k];
    return title(names[0], names[1] ? `Key ${names[1]}` : '') + note('Opens a drawer of cards. Keys 1–0 pick a card.', 'dim');
  }
  if (key.startsWith('tax-')) {
    const k = key.slice(4);
    return title(`${ZONES[{ R: 1, C: 2, I: 3 }[k]].name} tax`) + note('Each point above 10% costs 4 demand; revenue usually peaks around 15–18%.');
  }
  if (key.startsWith('speed-')) {
    const s = +key.slice(6);
    return title(s === 0 ? 'Pause' : `Speed ${s}×`, s === 0 ? 'Space' : '+ / −');
  }
  if (key.startsWith('res-')) {
    const r = RESEARCH_BY_ID[key.slice(4)];
    return r ? title(r.name) + note(r.desc) : '';
  }
  switch (key) {
    case 'money': {
      const b = budgetLines();
      const inc = b.income.reduce((a, t) => a + t.value, 0), exp = b.expense.reduce((a, t) => a + Math.abs(t.value), 0);
      return title('Treasury', fmtMoney(G.money)) + row('Income', `${fmtSignedMoney(inc)}/min`, 'pos') + row('Expenses', `−${fmtMoney(exp).slice(1)}/min`, 'neg') + row('Net', `${fmtSignedMoney(G.netPerMin || 0)}/min`, (G.netPerMin || 0) >= 0 ? 'pos' : 'neg')
        + note(`You can overdraw to ${fmtMoney(MONEY.overdraft)}; below $0 nothing can be built or repaired.`, 'dim') + note('Open the budget with B.', 'dim');
    }
    case 'pop': {
      const jobs = (G.jobs.gov || 0) + (G.jobs.C || 0) + (G.jobs.I || 0);
      return title('Population', fmtInt(G.pop)) + row('Workers', fmtInt(G.workers)) + row('Government jobs', fmtInt(G.jobs.gov || 0)) + row('Shop and office jobs', fmtInt(G.jobs.C || 0)) + row('Industry jobs', fmtInt(G.jobs.I || 0))
        + row('Total jobs', fmtInt(jobs)) + row('Unemployment', `${Math.round((G.unemployment || 0) * 100)}%`) + row('Shop and factory staffing', `${Math.round((G.staffing ?? 1) * 100)}%`);
    }
    case 'budget-btn': return title('Budget and taxes', 'B');
    case 'milestone': {
      const n = MILESTONES[(G.milestone || 0) + 1];
      if (!n) return title(MILESTONES[G.milestone].name) + note('Every milestone reached.');
      const un = Object.keys(BUILDINGS).filter((k) => BUILDINGS[k].unlock === (G.milestone || 0) + 1).map((k) => BUILDINGS[k].name);
      return title(`Next: ${n.name}`, `${fmtInt(n.pop)} people or raid ${n.wave}`) + row('Population', `${fmtInt(G.pop)} / ${fmtInt(n.pop)}`) + row('Raids survived', `${Math.max(0, (G.wave.n || 1) - 1)} / ${n.wave}`) + row('Reward', fmtMoney(n.reward), 'pos')
        + (un.length ? note(`Unlocks ${un.join(', ')}${(G.milestone || 0) + 1 === 3 ? ', level 3 buildings' : ''}.`) : '');
    }
    case 'threat': {
      const d = DIFFICULTY[G.difficulty] || DIFFICULTY.standard;
      const p = PROMINENCE(G.pop || 0);
      return title(`Threat ×${(G.threat || 1).toFixed(2)}`, 'Raid size multiplier') + row('City prominence', `×${p.toFixed(2)}`) + row('Difficulty', `×${d.budget.toFixed(2)}`)
        + note("Your city's size draws bigger raids. It grows with the logarithm of population, so growing always pays: x0.9 at 200 people, x1.25 at 3,000, capped at x1.6.");
    }
    case 'blockade': return title('Blockade', 'Warship within 6 tiles') + note('Commercial income −25% and commercial demand −15 while an enemy warship sits off the coast. Sink it.');
    case 'bankrupt': return title('Bankruptcy', 'Red countdown') + note(`Below $0 for ${MONEY.bankruptNeg / 60} minutes, or below ${fmtMoney(MONEY.overdraft)} for ${MONEY.bankruptDeep / 60} minutes, ends the run. Raise taxes or sell upkeep-heavy structures.`, 'bad');
    case 'fires': return title(`${G.fires} fires burning`) + note('Fire spreads to neighbouring buildings; roads are firebreaks. Fire stations send trucks inside their district.');
    case 'hq': return title('Town Hall integrity') + note('If the Town Hall falls, the island is lost. Below 50% the game can pause automatically.');
    case 'early': {
      const bonus = Math.floor(Math.max(0, G.wave.timer || 0) * MONEY.callEarlyPerSec);
      return title('Call the raid early', 'N') + row('Bonus now', fmtMoney(bonus), 'pos') + note(`$${MONEY.callEarlyPerSec} for every second left on the clock.`, 'dim');
    }
    case 'power': case 'water': {
      const p = G[key] || {}, unit = key === 'power' ? 'MW' : 'kL';
      const f = p.supply ? p.demand / p.supply : 0;
      return title(key === 'power' ? 'Power' : 'Water', `${fmtInt(p.demand)} / ${fmtInt(p.supply)} ${unit}`) + row('Used', `${Math.round(f * 100)}%`, f >= 1 ? 'neg' : '')
        + note(f >= 1 ? 'Demand exceeds supply: the newest buildings are cut off first.' : f >= 0.9 ? 'Nearly at capacity: build more before zoning further.' : 'One shared network across every road linked to the Town Hall.', f >= 0.9 ? 'bad' : 'dim');
    }
    case 'clock': return title('Time of day', SETTINGS.dayNight === 'cycle' ? 'Day and night cycle' : SETTINGS.dayNight === 'golden' ? 'Locked at golden hour' : 'Always day') + note('Night is visual only. Change it in Settings.', 'dim');
    case 'menu-btn': return title('Menu', 'Esc');
    case 'rci': return title('Demand', 'R C I') + note('Bars above the line: the city wants more of that zone. Hover a bar for its terms.', 'dim');
    case 'tool-road': return title('Street', 'R') + row('Cost', `$${ROADS.cost} per tile`) + row('Hills / forest', `+$${ROADS.hillExtra} / +$${ROADS.forestExtra}`) + row('Upkeep', `$${ROADS.upkeepPerTile}/tile/min`) + note('Drag from start to end; the route avoids buildings and shows its cost live.', 'dim');
    case 'tool-bulldoze': return title('Bulldoze', 'X') + note('Click or drag to demolish. Structures refund 75% (100% within 15 s of placing), roads 50%.', 'dim');
    case 'tool-research': return title('Research', 'T') + note('Defence upgrades bought with money. Needs a War College.', 'dim');
    case 'dezone': return title('De-zone', 'Free') + note('Removes zoning. Buildings already standing stay until you bulldoze them.', 'dim');
    case 'upgrade': {
      const b = G.selected;
      if (!b || !b.def) return '';
      const c = S.upgradeCost(b);
      if (c == null) return title('Fully upgraded');
      const L = b.level || 1;
      const f = (k) => Math.round(((1 + k * L) / (1 + k * (L - 1)) - 1) * 100);
      const p = S.previewUpgrade ? S.previewUpgrade(b) : null;
      return title(`Upgrade to level ${L + 1}`, fmtMoney(c)) + (Array.isArray(p) ? p.map((t) => row(t, '', 'pos')).join('') : b.def.weapon ? row('Damage', `+${f(0.35)}%`, 'pos') + row('Range', `+${f(0.08)}%`, 'pos') + row('Fire rate', `+${f(0.1)}%`, 'pos') + row('Health', `+${f(0.3)}%`, 'pos') : row('Health', `+${f(0.3)}%`, 'pos'))
        + row('Upkeep after', `${fmtMoney((b.def.upkeep || 0) * (1 + 0.5 * L))}/min`, 'neg');
    }
    case 'sell': return title('Sell') + note('Refunds 75% of everything invested, or all of it within 15 s of placing if no raid has started since.', 'dim');
    case 'focus': return title('Centre the camera');
    case 'cycle': { const b = G.selected; return title('Targeting', b && b.targetMode ? b.targetMode[0].toUpperCase() + b.targetMode.slice(1) : '') + note('Click to cycle First, Nearest, Strongest, Weakest. Shift+click applies it to every tower of this type.', 'dim'); }
    case 'close': return title('Close', 'Esc');
    case 'lv-break': return G.selected && G.selected.lot != null ? tipFor('lv-' + G.selected.lot) : '';
  }
  return '';
}

function buildingTip(type) {
  const d = BUILDINGS[type];
  if (!d) return '';
  let h = title(d.name, `${fmtMoney(d.cost)} · ${fmtMoney(d.upkeep)}/min`) + note(esc(d.desc || ''));
  if (d.weapon) {
    const w = d.weapon;
    h += row('Damage', `${Math.round(w.dmg * (G.mod.dmg || 1))}${w.splash ? ' area' : ''}`) + row('Range', (w.range * (G.mod.range || 1)).toFixed(1)) + row('Fire rate', `${(w.rate * (G.mod.rate || 1)).toFixed(2)}/s`)
      + row('Engages', Object.keys(w.targets).filter((k) => w.targets[k] >= 0.5).map((k) => DOMAIN_NAME[k]).join(', '));
  } else if (keyStat(type)) h += row('Provides', esc(keyStat(type)));
  if (d.power < 0) h += row('Power use', `${-d.power} MW`, 'neg');
  if (d.water < 0) h += row('Water use', `${-d.water} kL`, 'neg');
  if (d.crew) h += row('Crew jobs', d.crew);
  if (d.noise) h += note('Noisy: lowers land value nearby.', 'dim');
  if (d.coastal) h += note('Must touch the sea.', 'dim');
  if (!S.isUnlocked(type)) { const m = milestoneOf(type); h += note(`${icon('lock')} Unlocks at ${m.name}: ${fmtInt(m.pop)} people or raid ${m.wave}.`, 'bad'); }
  else if (d.cost > G.money) h += note(`Needs ${fmtMoney(d.cost - G.money)} more.`, 'bad');
  return h;
}

// ------------------------------------------------------------------ world tips

function worldTip(i) {
  if (i < 0) return '';
  const t = G.tool;
  if (t) {
    if (t.kind === 'road' && TOOL.previewBad.includes(i)) return note(esc(S.roadProblem(i) || 'Cannot build a road here'), 'bad');
    if (t.kind === 'build') { const p = S.placeProblem(t.type, i); if (p) return note(esc(p), 'bad'); }
    return '';
  }
  let h = '';
  const view = G.infoView;
  if (W.bld[i]) {
    const b = G.byId.get(W.bld[i]);
    if (b) h += title(esc(b.level > 1 && b.def.upgradeName ? b.def.upgradeName : b.def.name), `${fmtInt(b.hp)} / ${fmtInt(b.maxHp)} HP`) + (b.connected === false ? note('No road to the Town Hall', 'bad') : '');
  } else if (W.zone[i]) {
    const Z = ZONES[W.zone[i]], lvl = W.lvl[i];
    h += title(esc(lotName(i)), `${Z.name}${lvl ? ` L${lvl}` : ' · empty lot'}`);
    const fl = W.flags[i];
    if (W.fire[i]) h += note('On fire', 'bad');
    else if (fl & LF.ABANDONED) h += note('Abandoned', 'bad');
    else if (lvl && !(fl & LF.POWER)) h += note('No power', 'bad');
    else if (lvl && !(fl & LF.WATER)) h += note('No water', 'bad');
    else if (!(fl & LF.ROAD)) h += note('No road access', 'bad');
  } else if (W.ruin[i]) {
    h += title('Ruins') + note('Click to rebuild or clear', 'dim');
  } else if (isLand(W.type[i])) {
    h += title(TERRAIN[W.type[i]].name.replace('Grassland', 'Meadow'), W.road[i] ? (W.conn[i] ? 'Street' : 'Street · not linked to the Town Hall') : '');
  } else {
    h += title(isWater(W.type[i]) ? TERRAIN[W.type[i]].name : '');
  }
  if (view === 'landvalue' && isLand(W.type[i])) h += row('Land value', W.lv[i]) + termRows(lvTerms(i));
  else if (view === 'pollution') h += row('Pollution', W.poll[i]);
  else if (view === 'defence') {
    const c = coverageAt(i);
    if (c) h += row('Sea cover', `${c.sea} tower${c.sea === 1 ? '' : 's'}`) + row('Air cover', `${c.air}`) + row('Ground cover', `${c.ground}`);
    if (W.landing && W.landing.includes(i)) h += note('Landing beach: troops can come ashore here.', 'bad');
  } else if (view === 'services' && isLand(W.type[i])) {
    const bit = { fire: CV.FIRE, police: CV.POLICE, health: CV.HEALTH, school: CV.SCHOOL }[IV.sub.services];
    h += row(`${IV.sub.services[0].toUpperCase() + IV.sub.services.slice(1)} coverage`, W.cover[i] & bit ? 'Yes' : 'No', W.cover[i] & bit ? 'pos' : 'neg');
  } else if (W.zone[i] && isLand(W.type[i])) h += row('Land value', W.lv[i]);
  return h;
}

// ------------------------------------------------------------------ plumbing

function place(x, y, anchor) {
  const rem = UI.rem || 15;
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let px, py;
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    px = r.left + r.width / 2 - w / 2;
    py = r.top > innerHeight * 0.5 ? r.top - h - 0.5 * rem : r.bottom + 0.5 * rem;
  } else { px = x + rem; py = y + rem; if (px + w > innerWidth - 8) px = x - w - rem; if (py + h > innerHeight - 8) py = y - h - rem; }
  px = Math.max(8, Math.min(innerWidth - w - 8, px));
  py = Math.max(8, Math.min(innerHeight - h - 8, py));
  tipEl.style.transform = `translate(${Math.round(px)}px, ${Math.round(py)}px)`;
}
function show(html, x, y, anchor) {
  if (!html) { hide(); return; }
  if (tipEl._h !== html) { tipEl._h = html; tipEl.innerHTML = html; }
  tipEl.classList.remove('hidden');
  place(x, y, anchor);
}
function hide() { if (!tipEl.classList.contains('hidden')) tipEl.classList.add('hidden'); shown = null; }

export function initTips(root) {
  tipEl = $('#tip');
  root.addEventListener('mouseover', (e) => {
    const a = e.target.closest('[data-tip]');
    if (!a || a === hudAnchor) return;
    hudAnchor = a; hudKey = a.dataset.tip; hudTimer = performance.now() + 120;
    shown = null;
  });
  root.addEventListener('mouseout', (e) => {
    const a = e.target.closest('[data-tip]');
    if (a && a === hudAnchor && !a.contains(e.relatedTarget)) { hudAnchor = null; hudKey = null; if (performance.now() > pinUntil) hide(); }
  });
  UI.pinTip = (key, anchor) => { show(tipFor(key), 0, 0, anchor); shown = 'pin'; pinUntil = performance.now() + 4000; };
  UI.hideTip = () => { hudAnchor = null; hudKey = null; hide(); };
}

// called every frame (cheap): resolves delays, refreshes the visible tip at 4 Hz
let refreshT = 0;
export function updateTips(dt) {
  const now = performance.now();
  if (now < pinUntil && shown === 'pin') return;
  if (hudAnchor) {
    if (!document.body.contains(hudAnchor)) { hudAnchor = null; hide(); return; }
    if (now < hudTimer) return;
    refreshT -= dt;
    if (shown !== 'hud:' + hudKey || refreshT <= 0) { refreshT = 0.25; show(tipFor(hudKey), 0, 0, hudAnchor); shown = 'hud:' + hudKey; }
    return;
  }
  // world: the cursor has rested on a tile for 250 ms
  const i = G.mode === 'play' && mouse.over && mouse.x >= 0 && !mouse.left && !mouse.right && !mouse.middle && !UI.sheet && !UI.screen ? mouse.tile : -1;
  if (i !== worldTile) { worldTile = i; worldSince = now; if (shown && shown.startsWith('w')) hide(); return; }
  if (i < 0 || now - worldSince < 250 || now - mouse.lastMove < 250) { if (shown && shown.startsWith('w') && now - mouse.lastMove < 60) hide(); return; }
  refreshT -= dt;
  if (shown !== 'w' + i || refreshT <= 0) { refreshT = 0.25; show(worldTip(i), mouse.x, mouse.y); shown = 'w' + i; }
}
