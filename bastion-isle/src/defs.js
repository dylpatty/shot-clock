// All game data and balance numbers. Values come from the systems design review (scratchpad review-systems.txt);
// change them here (with a comment saying why) when the balance harness shows they are wrong.
import { T } from './world.js';

export const BUILDABLE = [T.SAND, T.GRASS, T.FOREST, T.HILLS];
export const FLAT = [T.SAND, T.GRASS, T.FOREST];

// ------------------------------------------------------------------ difficulty
export const DIFFICULTY = {
  relaxed: { name: 'Relaxed', money: 50000, budget: 0.7, firstWave: 420, gap: 180, raids: true },
  standard: { name: 'Standard', money: 30000, budget: 1.0, firstWave: 300, gap: 120, raids: true },
  hard: { name: 'Hard', money: 20000, budget: 1.3, firstWave: 240, gap: 90, raids: true },
  sandbox: { name: 'Sandbox', money: 250000, budget: 1.0, firstWave: 300, gap: 120, raids: false },
};

export const MONEY = {
  overdraft: -10000,          // floor; below 0 nothing can be built, upgraded or repaired
  bankruptDeep: 120,          // seconds below the overdraft floor before the run is lost
  bankruptNeg: 300,           // seconds below $0 before the run is lost
  callEarlyPerSec: 20,
  waveClearBase: 750, waveClearPerWave: 300,
  sellRefund: 0.75, sellGraceRefund: 1.0, sellGraceSec: 15,
  repairCostFrac: 0.2,
};

// ------------------------------------------------------------------ zones (residents for R, jobs for C/I)
export const ZONES = {
  1: {
    key: 'R', name: 'Residential', color: '#5DBB63', taxPerHead: 0.30, levelMul: [1, 1.2, 1.4],
    levels: [{ cap: 8, power: 0.2, water: 0.2, hp: 150 }, { cap: 24, power: 0.5, water: 0.5, hp: 300 }, { cap: 60, power: 1.2, water: 1.0, hp: 600 }],
    req: [null, { lv: 30, cover: ['school', 'health'] }, { lv: 60, cover: ['school', 'health', 'police', 'fire'], milestone: 3 }],
  },
  2: {
    key: 'C', name: 'Commercial', color: '#4C9BE8', taxPerHead: 0.40, levelMul: [1, 1.2, 1.4],
    levels: [{ cap: 5, power: 0.4, water: 0.2, hp: 180 }, { cap: 12, power: 0.8, water: 0.4, hp: 360 }, { cap: 28, power: 1.6, water: 0.8, hp: 700 }],
    req: [null, { lv: 25, cover: ['police'] }, { lv: 55, cover: ['police', 'fire'], milestone: 3 }],
  },
  3: {
    key: 'I', name: 'Industrial', color: '#E0A040', taxPerHead: 0.30, levelMul: [1, 1.15, 1.3],
    levels: [{ cap: 10, power: 0.8, water: 0.5, hp: 250, poll: 12 }, { cap: 20, power: 1.5, water: 1.0, hp: 450, poll: 18 }, { cap: 36, power: 2.5, water: 1.5, hp: 800, poll: 24 }],
    req: [null, { lv: 0, cover: ['fire', 'school'] }, { lv: 0, cover: ['fire', 'police', 'school'], milestone: 3 }],
    pollRadius: 3,
  },
};
export const ZONE_TERRAIN = [T.SAND, T.GRASS, T.FOREST, T.HILLS];

export const GROWTH = {
  tick: 2,                    // seconds between growth passes
  buildTime: 8, fillTime: 10, // construction then move-in
  levelUpAt: 90, levelUpRebuild: 10,
  abandonIconAfter: 5, abandonAfter: 45, demolishAbandonedAfter: 120, reoccupy: 10,
  rubbleRegrow: 30, enemyExclusion: 6, raidStartMul: 0.25,
  demandTau: 8,
};

// ------------------------------------------------------------------ player-built structures
// kind: hq | service | utility | park | military
// cost and upkeep in $ (upkeep per game minute). power/water: + supplies, - consumes (MW / kL).
// unlock: milestone index needed. radius in hex tiles for services.
export const BUILDINGS = {
  hq: {
    kind: 'hq', name: 'Town Hall', hp: 2200, power: 5, water: 5, residents: 10, jobs: 5, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => (l === 1 ? 8000 : 16000), upkeep: 0,
    weapon: { kind: 'mg', range: 6.5, dmg: 3, rate: 4, acc: 0.8, targets: { ground: 1, sea: 0.8, air: 0.5 }, muzzleY: 1.05 },
    desc: 'The seat of your island government. If it falls, the island is lost. Supplies a little power and water and has a rooftop gun.',
  },

  // services
  park: { kind: 'park', cat: 'services', name: 'Park', cost: 500, upkeep: 20, radius: 2, cover: 'park', power: 0, water: 0, hp: 120, unlock: 0, terrain: BUILDABLE, desc: 'Raises land value nearby.' },
  plaza: { kind: 'park', cat: 'services', name: 'Plaza', cost: 2000, upkeep: 60, radius: 3, cover: 'plaza', power: -0.5, water: -0.3, hp: 200, unlock: 2, terrain: BUILDABLE, desc: 'A paved square with a fountain. Raises land value further.' },
  fire: { kind: 'service', cat: 'services', name: 'Fire Station', cost: 5000, upkeep: 250, radius: 6, cover: 'fire', trucks: 2, power: -0.5, water: -0.3, hp: 400, unlock: 1, terrain: BUILDABLE, desc: 'Fire trucks put out fires along the roads in range. Needed for higher-level buildings.' },
  police: { kind: 'service', cat: 'services', name: 'Police Station', cost: 4500, upkeep: 220, radius: 6, cover: 'police', officers: 2, power: -0.5, water: -0.3, hp: 400, unlock: 1, terrain: BUILDABLE, desc: 'Officers protect the area and fight landing parties inside their district.' },
  clinic: { kind: 'service', cat: 'services', name: 'Clinic', cost: 4000, upkeep: 200, radius: 5, cover: 'health', power: -0.5, water: -0.3, hp: 350, unlock: 1, terrain: BUILDABLE, maxLevel: 2, upgradeCost: () => 8000, upgradeUnlock: 3, upgradeName: 'Hospital', upgradeUpkeep: 450, upgradeRadius: 8, desc: 'Healthcare for the district. Upgrades into a Hospital in the City era.' },
  school: { kind: 'service', cat: 'services', name: 'School', cost: 4000, upkeep: 200, radius: 5, cover: 'school', power: -0.5, water: -0.3, hp: 350, unlock: 1, terrain: BUILDABLE, desc: 'Education for the district. Needed for higher-level buildings.' },
  college: { kind: 'service', cat: 'services', name: 'War College', cost: 8000, upkeep: 200, radius: 0, power: -0.5, water: -0.3, hp: 500, unlock: 2, unique: true, terrain: BUILDABLE, desc: 'Defence research (T). Only one can be built.' },

  // utilities
  wind: { kind: 'utility', cat: 'utilities', name: 'Wind Turbine', cost: 1500, upkeep: 50, power: 10, powerBonus: 5, water: 0, hp: 160, unlock: 0, terrain: BUILDABLE, desc: '10 MW of clean power, 15 MW on hills or the coast.' },
  gas: { kind: 'utility', cat: 'utilities', name: 'Gas Power Plant', cost: 12000, upkeep: 240, power: 60, water: -1, hp: 700, unlock: 2, pollution: 40, pollRadius: 4, noise: 2, explodes: true, terrain: FLAT, desc: '60 MW from one site. Pollutes, and explodes if destroyed.' },
  watertower: { kind: 'utility', cat: 'utilities', name: 'Water Tower', cost: 1500, upkeep: 40, power: -0.2, water: 8, hp: 200, unlock: 0, terrain: BUILDABLE, desc: '8 kL of fresh water.' },
  pump: { kind: 'utility', cat: 'utilities', name: 'Water Pump', cost: 6000, upkeep: 200, power: 0, water: 50, hp: 300, unlock: 1, coastal: true, terrain: [T.SAND, T.GRASS], desc: '50 kL of water. Must touch the sea; needs no power.' },

  // defence
  mg: {
    kind: 'military', cat: 'defence', group: 'ground', name: 'MG Post', cost: 1500, upkeep: 45, crew: 2, power: 0, hp: 220, unlock: 0, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => (l === 1 ? 900 : 1500), targetMode: 'first', domainPref: 'ground',
    weapon: { kind: 'mg', range: 6.5, dmg: 3.2, rate: 6, acc: 0.8, targets: { ground: 1, sea: 1, air: 0.55 }, headY: 0.2, muzzle: 0.32 },
    desc: 'Rapid fire at short range. Shreds landing troops and small boats, and can harass low aircraft.',
  },
  coastal: {
    kind: 'military', cat: 'defence', group: 'sea', name: 'Coastal Gun', cost: 4000, upkeep: 120, crew: 4, power: 0, hp: 420, unlock: 0, noise: 2, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => (l === 1 ? 2400 : 4000), targetMode: 'strongest', domainPref: 'sea',
    weapon: { kind: 'shell', range: 13, dmg: 70, rate: 1 / 3, splash: 1.6, targets: { sea: 1, ground: 0.8 }, headY: 0.32, muzzle: 0.85, aim: 0.25 },
    desc: 'Heavy artillery that outranges ships and shells troops on the beach. Cannot hit aircraft.',
  },
  flak: {
    kind: 'military', cat: 'defence', group: 'air', name: 'Flak Battery', cost: 3500, upkeep: 105, crew: 4, power: 0, hp: 300, unlock: 0, noise: 1, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => (l === 1 ? 2100 : 3500), targetMode: 'first', domainPref: 'air',
    weapon: { kind: 'flak', range: 11, dmg: 22, rate: 1.1, splash: 2.1, targets: { air: 1 }, headY: 0.3, muzzle: 0.5, aim: 0.5 },
    desc: 'Anti-aircraft guns. Airburst shells damage every plane caught in the blast.',
  },
  barracks: {
    kind: 'military', cat: 'defence', group: 'ground', name: 'Barracks', cost: 3000, upkeep: 90, crew: 10, power: 0, hp: 420, unlock: 1, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => (l === 1 ? 1800 : 3000), units: 4, guard: 15,
    desc: 'Trains marines (4, +2 per level) who hunt landing parties near the barracks.',
  },
  radar: {
    kind: 'military', cat: 'defence', group: 'support', name: 'Radar Station', cost: 6000, upkeep: 180, crew: 4, power: -2, hp: 250, unlock: 2, radius: 6, terrain: BUILDABLE,
    spin: true, headY: 0.55,
    desc: 'Weapons within range get +20% reach, and the raid clock shows each raid in full with its approach lanes. Needs 2 MW.',
  },
  missile: {
    kind: 'military', cat: 'defence', group: 'air', name: 'Missile Battery', cost: 12000, upkeep: 360, crew: 6, power: -2, hp: 360, unlock: 3, noise: 2, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => (l === 1 ? 7200 : 12000), targetMode: 'strongest', domainPref: 'any',
    weapon: { kind: 'missile', range: 17, dmg: 130, rate: 0.25, splash: 1.2, targets: { air: 1, sea: 1 }, headY: 0.28, muzzle: 0.3, aim: 0.6 },
    desc: 'Guided missiles with the longest reach on the island. Hits ships and aircraft. Needs 2 MW.',
  },
  airfield: {
    kind: 'military', cat: 'defence', group: 'air', name: 'Airfield', cost: 16000, upkeep: 480, crew: 12, power: -4, hp: 520, unlock: 4, noise: 2, terrain: FLAT, maxLevel: 3,
    upgradeCost: (l) => (l === 1 ? 9600 : 16000), units: 3,
    desc: 'Interceptor fighters (3, +1 per level) that chase bombers and strafe ships. Needs 4 MW.',
  },
};
export const BUILD_TYPES = Object.keys(BUILDINGS);

// Dock layout: civic half and defence half, each with drawers of cards
export const DOCK = {
  civic: [
    { key: 'roads', name: 'Roads', tool: 'road' },
    { key: 'zoning', name: 'Zoning', tool: 'zone' },
    { key: 'power', name: 'Power', items: ['wind', 'gas'] },
    { key: 'water', name: 'Water', items: ['watertower', 'pump'] },
    { key: 'services', name: 'Services', items: ['fire', 'police', 'clinic', 'school', 'college'] },
    { key: 'parks', name: 'Parks', items: ['park', 'plaza'] },
  ],
  defence: [
    { key: 'coastal', name: 'Coastal', items: ['coastal', 'mg'] },
    { key: 'air', name: 'Air Defence', items: ['flak', 'missile', 'airfield'] },
    { key: 'support', name: 'Support', items: ['barracks', 'radar'] },
  ],
};

export const ROADS = { cost: 40, hillExtra: 10, forestExtra: 20, upkeepPerTile: 1.5, refund: 0.5 };

// ------------------------------------------------------------------ milestones
export const MILESTONES = [
  { name: 'Settlement', pop: 0, wave: 0, reward: 0 },
  { name: 'Village', pop: 300, wave: 3, reward: 5000 },
  { name: 'Town', pop: 1000, wave: 6, reward: 10000 },
  { name: 'City', pop: 2500, wave: 10, reward: 20000 },
  { name: 'Metropolis', pop: 5000, wave: 14, reward: 40000 },
];

// ------------------------------------------------------------------ enemies (bounty in $)
export const ENEMIES = {
  gunboat: { name: 'Gunboat', domain: 'sea', hp: 80, speed: 2.6, turn: 1.6, range: 7, dmg: 8, rate: 0.7, splash: 0.7, bounty: 200, cost: 6, minWave: 1, weight: 3, radius: 0.6, aim: 'shore' },
  landing: { name: 'Landing Craft', domain: 'sea', hp: 110, speed: 2.2, turn: 1.4, troops: 3, bounty: 250, cost: 8, minWave: 1, weight: 2.2, radius: 0.6, aim: 'beach' },
  destroyer: { name: 'Destroyer', domain: 'sea', hp: 460, speed: 1.8, turn: 0.9, range: 11, dmg: 32, rate: 0.33, splash: 1.1, bounty: 750, cost: 22, minWave: 5, weight: 1.6, radius: 1.0, aim: 'military' },
  battleship: { name: 'Battleship', domain: 'sea', hp: 2000, speed: 1.1, turn: 0.5, range: 15, dmg: 55, rate: 0.5, splash: 1.5, bounty: 5000, cost: 110, minWave: 10, weight: 0, radius: 1.5, aim: 'hq' },
  fighter: { name: 'Dive Bomber', domain: 'air', hp: 70, speed: 7, turn: 1.4, alt: 5, bombs: 2, bombDmg: 55, splash: 1.3, bounty: 300, cost: 8, minWave: 3, weight: 2.4, radius: 0.6, aim: 'towers' },
  bomber: { name: 'Heavy Bomber', domain: 'air', hp: 340, speed: 4.4, turn: 0.5, alt: 8, bombs: 8, bombDmg: 36, splash: 1.4, bounty: 1000, cost: 30, minWave: 7, weight: 1.1, radius: 1.2, aim: 'utilities' },
  jet: { name: 'Strike Jet', domain: 'air', hp: 150, speed: 12, turn: 1.3, alt: 6, rockets: 4, rocketDmg: 40, splash: 1.0, bounty: 750, cost: 26, minWave: 12, weight: 1.3, radius: 0.6, aim: 'hightech' },
  infantry: { name: 'Raider', domain: 'ground', hp: 35, speed: 1.3, range: 2.4, dmg: 5, rate: 1, bounty: 50, radius: 0.3, aim: 'hq' },
};
export const AIM_TEXT = {
  shore: 'whatever is nearest the shore', beach: 'landing raiders on the beaches', military: 'your defences',
  hq: 'the Town Hall', towers: 'your towers', utilities: 'power and water', hightech: 'radar, missiles and airfields',
};

export const ALLIES = {
  soldier: { hp: 70, speed: 1.7, range: 2.6, dmg: 7, rate: 1 },
  officer: { hp: 50, speed: 1.6, range: 2.4, dmg: 5, rate: 1 },
  fighter: { hp: 110, speed: 8, turn: 2.3, range: 3.4, dmg: 4, rate: 8, acc: 0.65 },
};

export const VICTORY_WAVE = 25;
export const WAVE_BUDGET = (n) => 14 + 8 * n + 0.75 * n * n;
// Raids grow with city size on a log scale so growing always pays: x0.9 at 200 people, x1.25 at 3k, capped x1.6
export const PROMINENCE = (pop) => Math.min(1.6, Math.max(0.85, 0.85 + 0.2 * Math.log2(1 + pop / 1000)));

// ------------------------------------------------------------------ fire
export const FIRE = {
  igniteMin: 10, igniteSpan: 80, igniteMax: 0.6, // p = clamp((dmg - 10) / 80, 0, 0.6)
  start: 0.2, grow: 0.05, hpLoss: 0.02,           // per second, x intensity
  spread: 0.025, coveredMul: 0.3, industryMul: 1.5, spreadMinF: 0.4,
  truckSpeed: 3 * 1.732, truckRate: 0.15, trucks: 2,
  spontaneousPerLotSec: 1 / 36000, cap: 40,
};

// ------------------------------------------------------------------ research ($, needs a War College)
export const RESEARCH = [
  { id: 'ballistics', name: 'Ballistics', max: 3, cost: (l) => [5000, 10000, 15000][l], desc: '+20% damage for every weapon, per level.' },
  { id: 'optics', name: 'Rangefinders', max: 2, cost: (l) => [6000, 12000][l], desc: '+12% weapon range, per level.' },
  { id: 'loaders', name: 'Autoloaders', max: 3, cost: (l) => [5000, 10000, 15000][l], desc: '+15% rate of fire, per level.' },
  { id: 'concrete', name: 'Reinforced Concrete', max: 2, cost: (l) => [6000, 12000][l], desc: '+35% health for your structures and +25% for city buildings, per level; faster repairs.' },
  { id: 'fuzes', name: 'Proximity Fuzes', max: 1, cost: () => 10000, desc: 'Flak hits 30% harder with a 50% wider burst.' },
  { id: 'jets', name: 'Jet Engines', max: 1, needMilestone: 4, cost: () => 15000, desc: 'Interceptors fly 40% faster and hit 50% harder.' },
  { id: 'drills', name: 'Marine Drills', max: 2, cost: (l) => [4000, 8000][l], desc: 'Marines and officers get +40% health and damage per level; barracks hold 2 more.' },
  { id: 'firebrigade', name: 'Fire Brigade Training', max: 1, cost: () => 6000, desc: 'Fire trucks drive and extinguish 50% faster; +1 truck per station.' },
  { id: 'sirens', name: 'Air-Raid Sirens', max: 1, cost: () => 6000, desc: 'Explosions are 30% less likely to start fires; sheltering costs half the tax.' },
  { id: 'civic', name: 'Civic Administration', max: 2, cost: (l) => [8000, 16000][l], desc: '+8% tax income, per level.' },
];
export const RESEARCH_BY_ID = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));

export function computeMods(levels) {
  const L = (id) => levels[id] || 0;
  return {
    dmg: 1 + 0.2 * L('ballistics'),
    range: 1 + 0.12 * L('optics'),
    rate: 1 + 0.15 * L('loaders'),
    bhp: 1 + 0.35 * L('concrete'),
    lotHp: 1 + 0.25 * L('concrete'),
    repair: 1 + 0.6 * L('concrete'),
    flakDmg: L('fuzes') ? 1.3 : 1,
    flakSplash: L('fuzes') ? 1.5 : 1,
    soldier: 1 + 0.4 * L('drills'),
    barracksCap: 2 * L('drills'),
    fighterSpeed: L('jets') ? 1.4 : 1,
    fighterDmg: L('jets') ? 1.5 : 1,
    truckMul: L('firebrigade') ? 1.5 : 1,
    extraTrucks: L('firebrigade') ? 1 : 0,
    igniteMul: L('sirens') ? 0.7 : 1,
    shelterLoss: L('sirens') ? 0.5 : 1,
    tax: 1 + 0.08 * L('civic'),
  };
}
