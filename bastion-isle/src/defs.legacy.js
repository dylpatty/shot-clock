import { T } from './world.js';

export const RES = ['food', 'wood', 'stone', 'iron', 'gold'];
export const RES_NAME = { food: 'Food', wood: 'Wood', stone: 'Stone', iron: 'Iron', gold: 'Gold' };

const BUILDABLE = [T.SAND, T.GRASS, T.FOREST, T.HILLS];
const FLAT = [T.SAND, T.GRASS, T.FOREST];

// Ranges, speeds and blast radii are in world units; neighbouring tiles are 1.73 apart.
// rate = shots per second. targets = damage multiplier against each domain.
export const BUILDINGS = {
  hq: {
    name: 'Town Hall', icon: 'hq', hp: 2200, housing: 10, jobs: 0, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => ({ wood: 80 * l, stone: 120 * l, gold: 150 * l }),
    weapon: { kind: 'mg', range: 6.5, dmg: 3, rate: 4, acc: 0.8, targets: { ground: 1, sea: 0.8, air: 0.5 }, muzzleY: 1.05 },
    desc: 'The heart of your colony. If it falls, the island is lost. Its rooftop gun gives a little cover.',
  },
  house: {
    name: 'House', cat: 'city', cost: { wood: 10, gold: 10 }, hp: 150, housing: 6, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => ({ wood: 20 * l, stone: 15 * l, gold: 10 * l }),
    desc: 'Homes for 6 citizens (+4 per upgrade). Residents pay taxes and eat food. Needs a road.',
  },
  farm: {
    name: 'Farm', cat: 'city', cost: { wood: 15, gold: 10 }, hp: 120, jobs: 4, terrain: [T.GRASS], maxLevel: 3,
    upgradeCost: (l) => ({ wood: 30 * l, stone: 10 * l, gold: 15 * l }),
    desc: 'Grows 30 food a minute. Grassland only.',
  },
  dock: {
    name: 'Fishing Dock', cat: 'city', cost: { wood: 15, gold: 10 }, hp: 120, jobs: 2, terrain: [T.SAND, T.GRASS], coastal: true, maxLevel: 3,
    upgradeCost: (l) => ({ wood: 25 * l, gold: 15 * l }),
    desc: 'Catches 16 food a minute, plus 2 for each water tile beside it. Must touch the sea.',
  },
  lumber: {
    name: 'Lumber Camp', cat: 'city', cost: { wood: 5, gold: 15 }, hp: 130, jobs: 3, terrain: BUILDABLE, needsAdj: 'forest', maxLevel: 3,
    upgradeCost: (l) => ({ wood: 20 * l, stone: 15 * l, gold: 10 * l }),
    desc: 'Cuts 6 wood a minute plus 6 for each forest tile beside it.',
  },
  quarry: {
    name: 'Quarry', cat: 'city', cost: { wood: 20, gold: 15 }, hp: 180, jobs: 3, terrain: BUILDABLE, needsAdj: 'rock', maxLevel: 3,
    upgradeCost: (l) => ({ wood: 30 * l, gold: 15 * l }),
    desc: 'Cuts 4 stone a minute, plus 5 per hill and 7 per mountain beside it, plus 6 if built on hills.',
  },
  mine: {
    name: 'Iron Mine', cat: 'city', cost: { wood: 25, stone: 15, gold: 20 }, hp: 200, jobs: 4, terrain: [T.HILLS], maxLevel: 3,
    upgradeCost: (l) => ({ wood: 30 * l, stone: 30 * l, gold: 20 * l }),
    desc: 'Digs 10 iron a minute, plus 4 per mountain and 2 per hill beside it. Hills only.',
  },
  market: {
    name: 'Market', cat: 'city', cost: { wood: 30, stone: 20, gold: 40 }, hp: 200, jobs: 2, terrain: BUILDABLE, radius: 7.5,
    desc: 'Houses within reach pay 50% more tax. Traders here sell wood, stone, iron and food for gold.',
  },
  college: {
    name: 'War College', cat: 'city', cost: { wood: 50, stone: 50, gold: 120 }, hp: 400, jobs: 3, terrain: BUILDABLE, unique: true,
    desc: 'Unlocks military research (press T). Only one can be built.',
  },

  mg: {
    name: 'MG Nest', cat: 'military', cost: { wood: 10, stone: 10, gold: 25 }, hp: 220, jobs: 1, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => ({ wood: 15 * l, stone: 20 * l, gold: 25 * l }),
    weapon: { kind: 'mg', range: 6.5, dmg: 3.2, rate: 6, acc: 0.8, targets: { ground: 1, sea: 1, air: 0.55 }, headY: 0.2, muzzle: 0.32 },
    desc: 'Rapid fire at short range. Shreds landing troops and small boats, and can harass low aircraft.',
  },
  coastal: {
    name: 'Coastal Gun', cat: 'military', cost: { wood: 10, stone: 35, gold: 50 }, hp: 420, jobs: 2, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => ({ stone: 40 * l, iron: 15 * l, gold: 40 * l }),
    weapon: { kind: 'shell', range: 13, dmg: 70, rate: 1 / 3, splash: 1.6, targets: { sea: 1, ground: 0.8 }, headY: 0.32, muzzle: 0.85, aim: 0.25 },
    desc: 'Heavy artillery. Long range shells that hit ships and troops on the beach. Cannot hit aircraft.',
  },
  flak: {
    name: 'Flak Cannon', cat: 'military', cost: { stone: 30, iron: 15, gold: 40 }, hp: 300, jobs: 2, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => ({ stone: 30 * l, iron: 25 * l, gold: 40 * l }),
    weapon: { kind: 'flak', range: 11, dmg: 22, rate: 1.1, splash: 2.1, targets: { air: 1 }, headY: 0.3, muzzle: 0.5, aim: 0.5 },
    desc: 'Anti-aircraft gun. Its airburst shells damage every plane caught in the blast.',
  },
  barracks: {
    name: 'Barracks', cat: 'military', cost: { wood: 30, stone: 25, gold: 50 }, hp: 420, jobs: 4, terrain: BUILDABLE, maxLevel: 3,
    upgradeCost: (l) => ({ wood: 30 * l, stone: 30 * l, gold: 40 * l }),
    units: 4, guard: 15,
    desc: 'Trains marines (4, +2 per upgrade) that hunt down enemy landing parties near the barracks.',
  },
  radar: {
    name: 'Radar Station', cat: 'military', cost: { stone: 40, iron: 30, gold: 60 }, hp: 250, jobs: 2, terrain: BUILDABLE, requires: 'radar', radius: 11,
    weapon: null, spin: true, headY: 0.55,
    desc: 'Weapons within reach get +20% range. Reveals what every raid is bringing and where it will come from.',
  },
  missile: {
    name: 'Missile Battery', cat: 'military', cost: { stone: 40, iron: 60, gold: 120 }, hp: 360, jobs: 3, terrain: BUILDABLE, requires: 'rocketry', maxLevel: 3,
    upgradeCost: (l) => ({ stone: 30 * l, iron: 50 * l, gold: 80 * l }),
    weapon: { kind: 'missile', range: 17, dmg: 130, rate: 0.25, splash: 1.2, targets: { air: 1, sea: 1 }, headY: 0.28, muzzle: 0.3, aim: 0.6 },
    desc: 'Guided missiles with the longest reach on the island. Hits ships and aircraft.',
  },
  airfield: {
    name: 'Airfield', cat: 'military', cost: { wood: 60, stone: 80, iron: 50, gold: 150 }, hp: 520, jobs: 6, terrain: FLAT, requires: 'aviation', maxLevel: 3,
    upgradeCost: (l) => ({ stone: 60 * l, iron: 60 * l, gold: 100 * l }),
    units: 3,
    desc: 'Home to interceptor fighters (3, +1 per upgrade) that chase down bombers and strafe ships.',
  },
};

export const BUILD_ORDER = {
  city: ['house', 'farm', 'dock', 'lumber', 'quarry', 'mine', 'market', 'college'],
  military: ['mg', 'coastal', 'flak', 'barracks', 'radar', 'missile', 'airfield'],
};
export const BUILD_TYPES = Object.keys(BUILDINGS);
export const ROAD_COST = { gold: 2 };

// Enemy forces. cost = raid budget points, weight = how often a raid picks it.
export const ENEMIES = {
  gunboat: { name: 'Gunboat', domain: 'sea', hp: 80, speed: 2.6, turn: 1.6, range: 7, dmg: 8, rate: 0.7, splash: 0.7, bounty: 8, cost: 6, minWave: 1, weight: 3, radius: 0.6 },
  landing: { name: 'Landing Craft', domain: 'sea', hp: 110, speed: 2.2, turn: 1.4, troops: 3, bounty: 10, cost: 8, minWave: 1, weight: 2.2, radius: 0.6 },
  destroyer: { name: 'Destroyer', domain: 'sea', hp: 460, speed: 1.8, turn: 0.9, range: 11, dmg: 32, rate: 0.33, splash: 1.1, bounty: 30, cost: 22, minWave: 5, weight: 1.6, radius: 1.0 },
  battleship: { name: 'Battleship', domain: 'sea', hp: 2000, speed: 1.1, turn: 0.5, range: 15, dmg: 55, rate: 0.5, splash: 1.5, bounty: 200, cost: 110, minWave: 10, weight: 0, radius: 1.5 },
  fighter: { name: 'Dive Bomber', domain: 'air', hp: 70, speed: 7, turn: 1.4, alt: 5, bombs: 2, bombDmg: 55, splash: 1.3, bounty: 12, cost: 8, minWave: 3, weight: 2.4, radius: 0.6 },
  bomber: { name: 'Heavy Bomber', domain: 'air', hp: 340, speed: 4.4, turn: 0.5, alt: 8, bombs: 8, bombDmg: 36, splash: 1.4, bounty: 40, cost: 30, minWave: 7, weight: 1.1, radius: 1.2 },
  jet: { name: 'Strike Jet', domain: 'air', hp: 150, speed: 12, turn: 1.3, alt: 6, rockets: 4, rocketDmg: 40, splash: 1.0, bounty: 30, cost: 26, minWave: 12, weight: 1.3, radius: 0.6 },
  infantry: { name: 'Marine Raider', domain: 'ground', hp: 35, speed: 1.3, range: 2.4, dmg: 5, rate: 1, bounty: 2, radius: 0.3 },
};

export const ALLIES = {
  soldier: { hp: 70, speed: 1.7, range: 2.6, dmg: 7, rate: 1 },
  fighter: { hp: 110, speed: 8, turn: 2.3, range: 3.4, dmg: 4, rate: 8, acc: 0.65 },
};

export const VICTORY_WAVE = 25;
export const FIRST_WAVE_DELAY = 150;
export const WAVE_GAP = 75;

// Research. cost(l) is the price of the next level when l levels are owned.
export const RESEARCH = [
  { id: 'ballistics', name: 'Ballistics', max: 3, cost: (l) => ({ gold: 60 + 60 * l, iron: 15 + 20 * l }), desc: '+20% damage for every weapon, per level.' },
  { id: 'optics', name: 'Rangefinders', max: 2, cost: (l) => ({ gold: 90 + 80 * l, iron: 25 + 25 * l }), desc: '+12% range for every weapon, per level.' },
  { id: 'loaders', name: 'Autoloaders', max: 3, cost: (l) => ({ gold: 70 + 60 * l, iron: 20 + 20 * l }), desc: '+15% rate of fire, per level.' },
  { id: 'concrete', name: 'Reinforced Concrete', max: 2, cost: (l) => ({ gold: 50 + 50 * l, stone: 60 + 60 * l }), desc: '+35% building health per level, and faster repairs.' },
  { id: 'fuzes', name: 'Proximity Fuzes', max: 1, cost: () => ({ gold: 150, iron: 60 }), desc: 'Flak hits 30% harder with a 50% wider burst.' },
  { id: 'radar', name: 'Radar', max: 1, cost: () => ({ gold: 120, iron: 40 }), desc: 'Unlocks the Radar Station.' },
  { id: 'rocketry', name: 'Rocketry', max: 1, req: 'radar', cost: () => ({ gold: 220, iron: 90 }), desc: 'Unlocks the Missile Battery.' },
  { id: 'aviation', name: 'Aviation', max: 1, cost: () => ({ gold: 250, iron: 80, wood: 60 }), desc: 'Unlocks the Airfield and its interceptors.' },
  { id: 'jets', name: 'Jet Engines', max: 1, req: 'aviation', cost: () => ({ gold: 300, iron: 120 }), desc: 'Your fighters fly 40% faster and hit 50% harder.' },
  { id: 'drills', name: 'Marine Drills', max: 2, cost: (l) => ({ gold: 60 + 60 * l, food: 40 + 40 * l }), desc: 'Marines get +40% health and damage per level; barracks hold 2 more.' },
  { id: 'crops', name: 'Crop Rotation', max: 2, cost: (l) => ({ gold: 40 + 40 * l, wood: 40 + 30 * l }), desc: '+25% food from farms and docks, per level.' },
  { id: 'tools', name: 'Steel Tools', max: 2, cost: (l) => ({ gold: 50 + 50 * l, iron: 20 + 20 * l }), desc: '+20% wood, stone and iron, per level.' },
  { id: 'taxes', name: 'Civic Administration', max: 2, cost: (l) => ({ gold: 80 + 80 * l, stone: 40 + 40 * l }), desc: '+20% tax income, per level.' },
  { id: 'tenements', name: 'Tenements', max: 1, cost: () => ({ wood: 120, stone: 80, gold: 100 }), desc: 'Every house holds 3 more residents.' },
];
export const RESEARCH_BY_ID = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));

export function computeMods(levels) {
  const L = (id) => levels[id] || 0;
  return {
    dmg: 1 + 0.2 * L('ballistics'),
    range: 1 + 0.12 * L('optics'),
    rate: 1 + 0.15 * L('loaders'),
    bhp: 1 + 0.35 * L('concrete'),
    repair: 1 + 0.6 * L('concrete'),
    flakDmg: L('fuzes') ? 1.3 : 1,
    flakSplash: L('fuzes') ? 1.5 : 1,
    soldier: 1 + 0.4 * L('drills'),
    barracksCap: 2 * L('drills'),
    fighterSpeed: L('jets') ? 1.4 : 1,
    fighterDmg: L('jets') ? 1.5 : 1,
    food: 1 + 0.25 * L('crops'),
    prod: 1 + 0.2 * L('tools'),
    tax: 1 + 0.2 * L('taxes'),
    housing: L('tenements') ? 3 : 0,
    unlock: { radar: !!L('radar'), missile: !!L('rocketry'), airfield: !!L('aviation') },
  };
}
