// One-time advisor hints driven by game state (concrete_specs 26). Each fires once per run: G.hints[id] holds the
// time it was shown. A hint is posted to the Harbour Log (notify, kind 'info') and queued on G.hintQueue as
// { id, text, x, z } for the advisor card; the UI shifts entries off the queue as it shows them.
import { G, notify } from '../state.js';
import { W } from '../world.js';
import { lotsBlockedForSchoolOrClinic } from './zones.js';
import { ECON_STATE } from './economy.js';

export function hint(id, text, x, z) {
  if (!G.hints || G.hints[id] != null) return false;
  G.hints[id] = G.time;
  notify(text, 'info', x, z);
  if (!G.hintQueue) G.hintQueue = [];
  G.hintQueue.push({ id, text, x, z });
  if (G.hintQueue.length > 8) G.hintQueue.shift();
  return true;
}

const has = (types) => G.buildings.some((b) => b.alive && types.includes(b.type));
let slowT = 0;

// Called once per game second from the economy pass
export function tickHints(dt) {
  if (!G.hints) return;
  const h = G.hints;
  if (h.rNoLots == null && G.time > 30 && G.demand.R > 50 && G.lotCounts.free.R === 0) {
    hint('rNoLots', 'People want to move in, but there are no empty residential lots. Zone more Residential (green) beside your roads.');
  }
  if (h.utilities == null) {
    const p = G.power, w = G.water;
    if ((p.supply > 0 && p.demand >= 0.9 * p.supply) || (w.supply > 0 && w.demand >= 0.9 * w.supply)) {
      const which = p.supply > 0 && p.demand >= 0.9 * p.supply ? 'Power' : 'Water';
      hint('utilities', `${which} is at 90% of capacity. New buildings only grow while there is spare power and water: build a ${which === 'Power' ? 'wind turbine' : 'water tower'}.`);
    }
  }
  if (h.netNegative == null && ECON_STATE.negNetT >= 60) {
    hint('netNegative', 'You have been losing money for a minute. Open the budget (B): raise taxes a little, or cut upkeep you do not need.');
  }
  if (h.abandoned == null && G.stats.firstAbandoned) {
    const i = G.stats.firstAbandoned - 1;
    hint('abandoned', 'A building was abandoned: it went 45 s without road, power or water. Fix the cause and people move back in.', worldX(i), worldZ(i));
  }
  if (h.fireUncovered == null && G.stats.firstFireUncovered) {
    const i = G.stats.firstFireUncovered - 1;
    hint('fireUncovered', 'A fire broke out where no fire station can reach. Fires spread between buildings; roads and parks stop them. Build a Fire Station.', worldX(i), worldZ(i));
  }
  if (h.unemployment == null && G.pop > 100 && G.unemployment > 0.15) {
    hint('unemployment', `${Math.round(G.unemployment * 100)}% of workers have no job. Zone Commercial or Industrial to create jobs.`);
  }
  if (h.militaryUpkeep == null) {
    const inc = G.budget.income.R + G.budget.income.C + G.budget.income.I;
    if (inc > 200 && G.budget.expense.military > 0.45 * inc) {
      hint('militaryUpkeep', 'Defence upkeep is over 45% of your tax income. Grow the city to pay for it, or sell towers you do not need.');
    }
  }
  if (h.threat == null && G.wave.plan && G.wave.plan.prominence > 1.3) {
    hint('threat', `Threat x${G.wave.plan.prominence.toFixed(2)}: your city's size now draws bigger raids. Taxes still grow faster than the raids do.`);
  }
  if (h.airNoFlak == null && G.wave.state === 'prep' && G.wave.plan && G.wave.plan.air > 0 && !has(['flak', 'missile', 'airfield'])) {
    hint('airNoFlak', 'The next raid includes aircraft and you have no air defence. Build a Flak Battery near what they target.');
  }
  slowT -= dt;
  if (slowT <= 0) {
    slowT = 10;
    if (h.blockedL2 == null && G.milestone >= 1 && lotsBlockedForSchoolOrClinic() >= 10) {
      hint('blockedL2', 'Houses need a School and a Clinic nearby (and land value 30) to grow to level 2. Build them where homes cluster.');
    }
  }
}

const worldX = (i) => (i >= 0 ? W.x[i] : undefined);
const worldZ = (i) => (i >= 0 ? W.z[i] : undefined);
