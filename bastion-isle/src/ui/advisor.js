// One-time advisor hints driven by game state (systems review concrete spec 26). Each shows once (G.hints), stacks
// at most two cards under the city card, and can carry one action (open a sheet, switch an info view, jump).
import { G } from '../state.js';
import { W, LF, CV } from '../world.js';
import { MILESTONES, BUILDINGS, ENEMIES } from '../defs.js';
import { icon } from './icons.js';
import { $, el, esc } from './util.js';
import { UI, sound } from './ustate.js';
import { setView } from './infoviews.js';
import { focus } from '../input.js';

let checkT = 0, negT = 0, lastMilestone = -1;
const shown = [];

function act(a) {
  if (!a) return;
  if (a.view) { setView(a.view); UI.refreshRail && UI.refreshRail(); }
  if (a.sheet) UI.openSheet && UI.openSheet(a.sheet);
  if (a.drawer) UI.openDrawer && UI.openDrawer(a.drawer, true);
  if (a.x != null) focus(a.x, a.z, 26);
}

export function hint(id, title, text, action) {
  if (!G.hints) G.hints = {};
  if (G.hints[id]) return;
  G.hints[id] = true;
  const box = $('#advisor');
  const c = el('div', 'adv ch');
  c.innerHTML = `<i class="adv-ic">${icon('bulb')}</i><div class="adv-tx"><b>${esc(title)}</b><span>${esc(text)}</span>
    <div class="adv-act">${action ? `<button class="btn ch sm pri" data-a="go">${esc(action.label)}</button>` : ''}<button class="btn ch sm" data-a="ok">Got it</button></div></div>`;
  c.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    sound('click');
    if (b.dataset.a === 'go') act(action);
    c.remove();
    const k = shown.indexOf(c); if (k >= 0) shown.splice(k, 1);
  });
  box.prepend(c);
  shown.unshift(c);
  while (shown.length > 2) shown.pop().remove();
}

export function clearHints() { for (const c of shown) c.remove(); shown.length = 0; }

export function updateAdvisor(dt) {
  if (G.mode !== 'play') return;
  if ((G.netPerMin || 0) < 0) negT += dt; else negT = 0;
  checkT -= dt;
  if (checkT > 0) return;
  checkT = 2;
  const H = G.hints || (G.hints = {});
  if (lastMilestone < 0) lastMilestone = G.milestone || 0;

  if ((G.milestone || 0) > lastMilestone) {
    lastMilestone = G.milestone;
    const m = MILESTONES[G.milestone];
    const un = Object.keys(BUILDINGS).filter((k) => BUILDINGS[k].unlock === G.milestone).map((k) => BUILDINGS[k].name);
    hint('milestone' + G.milestone, `${m.name} reached`, `+$${m.reward.toLocaleString('en-US')}. New: ${un.join(', ') || 'higher building levels'}.`);
  }
  if (!H.rDemand && G.demand.R > 50) {
    let free = 0;
    for (let i = 0; i < W.count && !free; i++) if (W.zone[i] === 1 && !W.lvl[i] && !(W.flags[i] & LF.RUBBLE)) free++;
    if (!free) hint('rDemand', 'People want to move in', 'Residential demand is high and every home lot is taken. Zone more residential next to roads.', { label: 'Zoning (Z)', drawer: 'zoning' });
  }
  const pf = G.power && G.power.supply ? G.power.demand / G.power.supply : 0;
  const wf = G.water && G.water.supply ? G.water.demand / G.water.supply : 0;
  if (pf >= 0.9) hint('power90', `Power at ${Math.round(pf * 100)}%`, 'Build wind turbines (more on hills and the coast) before zoning further, or new buildings will sit dark.', { label: 'Power', drawer: 'power' });
  if (wf >= 0.9) hint('water90', `Water at ${Math.round(wf * 100)}%`, 'Add a water tower, or a pump on the shore once you reach Village.', { label: 'Water', drawer: 'water' });
  if (negT > 60) hint('netNeg', 'Spending more than you earn', 'The budget has been negative for a minute. Raise a tax rate a little, or sell structures with high upkeep.', { label: 'Budget (B)', sheet: 'budget' });
  let abandoned = -1, blocked = 0, fireOut = -1;
  for (let i = 0; i < W.count; i++) {
    if (!W.zone[i]) continue;
    if (abandoned < 0 && W.flags[i] & LF.ABANDONED) abandoned = i;
    if (W.lvl[i] === 1 && W.zone[i] === 1 && W.prog[i] === 0 && !((W.cover[i] & CV.SCHOOL) && (W.cover[i] & CV.HEALTH))) blocked++;
    if (fireOut < 0 && W.fire[i] && !(W.cover[i] & CV.FIRE)) fireOut = i;
  }
  if (abandoned >= 0) hint('abandoned', 'A building was abandoned', 'It went without power, water or its road for too long. Fix the cause and people move back in.', { label: 'Show me', x: W.x[abandoned], z: W.z[abandoned] });
  if (blocked >= 10) hint('blockedL2', `${blocked} homes stuck at level 1`, 'Level 2 homes need a school and a clinic in range, and land value 30+.', { label: 'Services view', view: 'services' });
  if (fireOut >= 0) hint('fireOutside', 'Fire outside any fire district', 'No trucks can reach it. A fire station covers 6 tiles; roads stop fire spreading.', { label: 'Fire risk view', view: 'fire' });
  const plan = G.wave && G.wave.plan;
  if (plan && plan.counts && G.wave.state === 'prep') {
    const air = Object.keys(plan.counts).some((k) => ENEMIES[k] && ENEMIES[k].domain === 'air' && plan.counts[k] > 0);
    if (air && !G.buildings.some((b) => b.type === 'flak' || b.type === 'missile' || b.type === 'airfield')) hint('noFlak', 'Aircraft in the next raid', 'You have no anti-aircraft guns. Flak batteries burst shells among bombers.', { label: 'Air defence', drawer: 'air' });
  }
  if (!H.beach && W.landing && W.landing.length) {
    const guards = G.buildings.filter((b) => b.type === 'mg' || b.type === 'barracks');
    if ((G.wave && G.wave.n >= 2) || G.time > 200) {
      const open = W.landing.find((i) => !guards.some((b) => Math.hypot(b.x - W.x[i], b.z - W.z[i]) <= 6 * 1.732));
      if (open != null && open >= 0) hint('beach', 'An open landing beach', 'Troops can come ashore here with no MG post or barracks within 6 tiles.', { label: 'Show me', x: W.x[open], z: W.z[open] });
    }
  }
  if ((G.unemployment || 0) > 0.15 && G.pop > 60) hint('jobs', `Unemployment ${Math.round(G.unemployment * 100)}%`, 'Zone commercial or industrial lots so residents have work.', { label: 'Zoning (Z)', drawer: 'zoning' });
  const inc = G.budget && G.budget.income ? Object.values(G.budget.income).reduce((a, v) => a + v, 0) : 0;
  const mil = G.budget && G.budget.expense ? Math.abs(G.budget.expense.military || 0) : 0;
  if (inc > 0 && mil > 0.45 * inc) hint('milUpkeep', 'Defence is eating the budget', `Military upkeep is ${Math.round((mil / inc) * 100)}% of income. Grow the city before adding more towers.`, { label: 'Budget (B)', sheet: 'budget' });
  if ((G.threat || 1) > 1.3) hint('threat', `Threat ×${G.threat.toFixed(2)}`, 'Your city now draws noticeably bigger raids. Growth still pays: taxes grow faster than raids.');
}
