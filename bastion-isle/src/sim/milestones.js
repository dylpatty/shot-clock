// Milestones (concrete_specs 19), unlocks, and the threat / prominence multiplier (concrete_specs 16, must_change 5).
// A milestone is reached at its population OR when its wave number comes up (G.wave.n is the next or current
// raid), so a struggling city is never locked out of a counter it needs.
import { G, notify } from '../state.js';
import { BUILDINGS, MILESTONES, PROMINENCE, RESEARCH } from '../defs.js';
import { hint } from './hints.js';

// What each milestone opens, for the HUD and the notification
export function unlocksAt(m) {
  const out = [];
  for (const k in BUILDINGS) if ((BUILDINGS[k].unlock || 0) === m && k !== 'hq') out.push(BUILDINGS[k].name);
  for (const k in BUILDINGS) if (BUILDINGS[k].upgradeUnlock === m) out.push(BUILDINGS[k].upgradeName);
  if (m === 0) out.unshift('Roads', 'Residential, commercial and industrial zones');
  if (m === 3) out.push('Level 3 zoned buildings');
  for (const r of RESEARCH) if (r.needMilestone === m) out.push(`Research: ${r.name}`);
  return out;
}

export function isUnlocked(type) {
  const d = BUILDINGS[type];
  return !!d && type !== 'hq' && (d.unlock || 0) <= G.milestone;
}
export function unlockProblem(type) {
  const d = BUILDINGS[type];
  if (!d) return 'Unknown building';
  if (isUnlocked(type)) return null;
  const m = MILESTONES[d.unlock];
  return `Unlocks at ${m.name} (${m.pop.toLocaleString('en-US')} people or wave ${m.wave})`;
}

export function resetMilestones() { G.milestone = 0; G.threat = PROMINENCE(0); }

export function checkMilestones() {
  if (G.mode !== 'play') return;
  while (G.milestone < MILESTONES.length - 1) {
    const m = MILESTONES[G.milestone + 1];
    if (!(G.pop >= m.pop || (G.wave && G.wave.n >= m.wave))) break;
    G.milestone++;
    if (m.reward) G.money += m.reward;
    const list = unlocksAt(G.milestone);
    notify(`${m.name} reached! +$${m.reward.toLocaleString('en-US')}. New: ${list.join(', ')}.`, 'good');
    hint('milestone' + G.milestone, `Your island is now a ${m.name}. New buildings are open in the dock: ${list.join(', ')}.`);
  }
}

// Next milestone for the HUD: { index, name, pop, wave, progress 0..1, reward, unlocks } or null at the top
export function nextMilestone() {
  const k = G.milestone + 1;
  if (k >= MILESTONES.length) return null;
  const m = MILESTONES[k];
  return {
    index: k, name: m.name, pop: m.pop, wave: m.wave, reward: m.reward,
    progress: Math.min(1, Math.max(G.pop / m.pop, (G.wave.n - 1) / Math.max(1, m.wave - 1))), unlocks: unlocksAt(k),
  };
}

// Threat chip: the multiplier the next raid was planned with (exact) and what the city would draw now
export function threatInfo() {
  const planned = G.wave && G.wave.plan ? G.wave.plan.prominence : G.threat;
  const live = PROMINENCE(G.pop);
  return {
    planned, live,
    text: `Threat x${planned.toFixed(2)}: your city's size draws bigger raids`,
    detail: `Raids scale with population on a log scale (x0.85 to x1.6). At ${Math.round(G.pop).toLocaleString('en-US')} people the next plan would be x${live.toFixed(2)}.`,
  };
}
