class_name Defs
extends RefCounted
## All static game data: ages, terrain, buildings (with per-level stats), enemies, allies, research, story.

# ---------------------------------------------------------------- terrain
const DEEP := 0
const SHALLOW := 1
const SAND := 2
const GRASS := 3
const FOREST := 4
const HILLS := 5
const MOUNTAIN := 6
const TERRAIN_NAME := ["Deep Sea", "Shallows", "Beach", "Grassland", "Forest", "Hills", "Mountain"]
const BUILDABLE := [SAND, GRASS, FOREST, HILLS]
const FLAT := [SAND, GRASS, FOREST]

# ---------------------------------------------------------------- resources
const RES := ["food", "wood", "stone", "iron", "gold", "science"]
const RES_NAME := {"food": "Food", "wood": "Wood", "stone": "Stone", "iron": "Iron", "gold": "Gold", "science": "Science"}

const SECTORS := ["farm", "industry", "science", "military"]
const SECTOR_NAME := {"farm": "Farming", "industry": "Industry", "science": "Science", "military": "Military"}
const SECTOR_HINT := {
	"farm": "Farms and fishing docks: food keeps your people alive and growing.",
	"industry": "Lumber camps, quarries and mines: wood, stone and iron.",
	"science": "Scholars in libraries: science buys new ages and research.",
	"military": "Crews for towers, artillery, AA, barracks and airfields. Unstaffed weapons fire slowly.",
}

# ---------------------------------------------------------------- ages
const AGES := ["Medieval", "Renaissance", "Industrial", "Modern", "Atomic"]
const AGE_ADJ := ["Medieval", "Renaissance", "Industrial", "Modern", "Atomic"]
## Town Hall level n+1 is age n. Raiders advance one age every WAVES_PER_AGE waves.
const WAVES_PER_AGE := 4
const VICTORY_WAVE := 20
const FIRST_WAVE_DELAY := 210.0
const WAVE_GAP := 100.0
const ROAD_COST := {"gold": 2}
const TAX := 1.0        # gold per resident per minute
const EAT := 0.9        # food per resident per minute

static func wave_age(n: int) -> int:
	return clampi((maxi(1, n) - 1) / WAVES_PER_AGE, 0, 4)

# ---------------------------------------------------------------- buildings
# Every level: name, th (Town Hall level needed), cost, hp, plus type specific stats.
# A building's level also sets its age (th - 1), which decides how modern it looks and how well its
# weapons cope with raiders of a later age.
const BUILDINGS := {
	"hq": {
		"name": "Town Hall", "cat": "civic", "terrain": BUILDABLE, "unique": true, "noroad": true,
		"desc": "The heart of Bastion and the measure of your age. Upgrade it (science + resources) to enter a new age and unlock the next level of every other building. If it falls, the island is lost.",
		"levels": [
			{"name": "Great Hall", "th": 1, "cost": {}, "hp": 2400, "housing": 10, "prod": {"food": 6, "science": 3},
				"weapon": {"kind": "arrow", "range": 6.5, "dmg": 8.0, "rate": 1.2, "targets": {"ground": 1.0, "sea": 0.7}}},
			{"name": "Guildhall", "th": 1, "cost": {"science": 140, "wood": 150, "stone": 150, "gold": 250}, "hp": 3300, "housing": 14, "prod": {"food": 8, "science": 5},
				"weapon": {"kind": "musket", "range": 6.5, "dmg": 9.0, "rate": 1.2, "acc": 0.8, "targets": {"ground": 1.0, "sea": 0.7}},
				"note": "Enter the Renaissance: gunpowder, terracotta and stone."},
			{"name": "City Hall", "th": 2, "cost": {"science": 420, "stone": 280, "iron": 110, "gold": 480}, "hp": 4400, "housing": 18, "prod": {"food": 10, "science": 8},
				"weapon": {"kind": "mg", "range": 7.0, "dmg": 4.0, "rate": 5.0, "acc": 0.8, "targets": {"ground": 1.0, "sea": 0.8, "air": 0.5}},
				"note": "Enter the Industrial age: steam, brick and iron. Unlocks AA and airfields."},
			{"name": "Civic Centre", "th": 3, "cost": {"science": 1000, "stone": 480, "iron": 300, "gold": 880}, "hp": 5800, "housing": 24, "prod": {"food": 12, "science": 12},
				"weapon": {"kind": "mg", "range": 7.5, "dmg": 7.0, "rate": 6.0, "acc": 0.85, "targets": {"ground": 1.0, "sea": 0.9, "air": 0.7}},
				"note": "Enter the Modern age: concrete, glass, jets and missiles."},
			{"name": "Arcology Spire", "th": 4, "cost": {"science": 2000, "stone": 650, "iron": 600, "gold": 1400}, "hp": 7500, "housing": 32, "prod": {"food": 16, "science": 18},
				"weapon": {"kind": "laser", "range": 8.5, "dmg": 34.0, "rate": 2.0, "targets": {"ground": 1.0, "sea": 1.0, "air": 1.0}},
				"note": "Enter the Atomic age: lasers, railguns and fusion."},
		],
	},
	"house": {
		"name": "House", "cat": "civic", "terrain": BUILDABLE,
		"desc": "Homes for your people. Residents pay taxes and eat food. Needs a road to the Town Hall.",
		"levels": [
			{"name": "Thatched Cottage", "th": 1, "cost": {"wood": 20, "gold": 15}, "hp": 150, "housing": 6},
			{"name": "Timber House", "th": 2, "cost": {"wood": 40, "stone": 20, "gold": 35}, "hp": 230, "housing": 10},
			{"name": "Brick Townhouse", "th": 3, "cost": {"stone": 60, "iron": 10, "gold": 80}, "hp": 340, "housing": 16},
			{"name": "Apartment Block", "th": 4, "cost": {"stone": 110, "iron": 40, "gold": 150}, "hp": 480, "housing": 26},
			{"name": "Habitat Tower", "th": 5, "cost": {"stone": 170, "iron": 90, "gold": 250}, "hp": 650, "housing": 40},
		],
	},
	"farm": {
		"name": "Farm", "cat": "eco", "sector": "farm", "terrain": [GRASS],
		"desc": "Grows food. Grassland only. Output scales with Farming workers.",
		"levels": [
			{"name": "Strip Farm", "th": 1, "cost": {"wood": 15, "gold": 10}, "hp": 120, "jobs": 4, "prod": {"food": 34}},
			{"name": "Manor Farm", "th": 2, "cost": {"wood": 40, "stone": 20, "gold": 30}, "hp": 180, "jobs": 4, "prod": {"food": 54}},
			{"name": "Steam Farm", "th": 3, "cost": {"wood": 40, "stone": 50, "iron": 15, "gold": 70}, "hp": 260, "jobs": 5, "prod": {"food": 80}},
			{"name": "Mechanised Farm", "th": 4, "cost": {"stone": 90, "iron": 40, "gold": 120}, "hp": 360, "jobs": 5, "prod": {"food": 115}},
			{"name": "Hydroponic Dome", "th": 5, "cost": {"stone": 140, "iron": 90, "gold": 200}, "hp": 480, "jobs": 6, "prod": {"food": 160}},
		],
	},
	"dock": {
		"name": "Fishing Dock", "cat": "eco", "sector": "farm", "terrain": [SAND, GRASS], "coastal": true,
		"desc": "Catches food from the sea, more for every water tile beside it. Must touch the sea; it turns to face the water.",
		"levels": [
			{"name": "Fishing Jetty", "th": 1, "cost": {"wood": 15, "gold": 10}, "hp": 120, "jobs": 2, "prod": {"food": 16}},
			{"name": "Harbour Wharf", "th": 2, "cost": {"wood": 35, "stone": 15, "gold": 30}, "hp": 180, "jobs": 3, "prod": {"food": 26}},
			{"name": "Steam Trawler Pier", "th": 3, "cost": {"wood": 30, "stone": 40, "iron": 15, "gold": 60}, "hp": 260, "jobs": 3, "prod": {"food": 40}},
			{"name": "Fish Cannery", "th": 4, "cost": {"stone": 70, "iron": 35, "gold": 110}, "hp": 360, "jobs": 4, "prod": {"food": 58}},
			{"name": "Aqua Farm", "th": 5, "cost": {"stone": 110, "iron": 80, "gold": 180}, "hp": 480, "jobs": 4, "prod": {"food": 82}},
		],
	},
	"lumber": {
		"name": "Lumber Camp", "cat": "eco", "sector": "industry", "terrain": BUILDABLE, "needs_adj": "forest",
		"desc": "Cuts wood: a base amount plus more for each forest tile beside it.",
		"levels": [
			{"name": "Woodcutter's Hut", "th": 1, "cost": {"wood": 5, "gold": 15}, "hp": 130, "jobs": 3, "mult": 1.0},
			{"name": "Water Sawmill", "th": 2, "cost": {"wood": 30, "stone": 25, "gold": 30}, "hp": 200, "jobs": 3, "mult": 1.5},
			{"name": "Steam Sawmill", "th": 3, "cost": {"stone": 50, "iron": 20, "gold": 60}, "hp": 280, "jobs": 4, "mult": 2.1},
			{"name": "Timber Plant", "th": 4, "cost": {"stone": 80, "iron": 45, "gold": 110}, "hp": 380, "jobs": 4, "mult": 2.8},
			{"name": "Bio-Timber Works", "th": 5, "cost": {"stone": 120, "iron": 90, "gold": 180}, "hp": 500, "jobs": 5, "mult": 3.6},
		],
	},
	"quarry": {
		"name": "Quarry", "cat": "eco", "sector": "industry", "terrain": BUILDABLE, "needs_adj": "rock",
		"desc": "Cuts stone: more for each hill and mountain beside it, and more again if built on hills.",
		"levels": [
			{"name": "Stone Pit", "th": 1, "cost": {"wood": 20, "gold": 15}, "hp": 180, "jobs": 3, "mult": 1.0},
			{"name": "Quarry Works", "th": 2, "cost": {"wood": 40, "stone": 20, "gold": 35}, "hp": 260, "jobs": 3, "mult": 1.5},
			{"name": "Steam Quarry", "th": 3, "cost": {"wood": 30, "stone": 40, "iron": 25, "gold": 60}, "hp": 340, "jobs": 4, "mult": 2.1},
			{"name": "Concrete Works", "th": 4, "cost": {"stone": 70, "iron": 50, "gold": 110}, "hp": 440, "jobs": 4, "mult": 2.8},
			{"name": "Matter Compactor", "th": 5, "cost": {"stone": 100, "iron": 100, "gold": 180}, "hp": 560, "jobs": 5, "mult": 3.6},
		],
	},
	"mine": {
		"name": "Iron Mine", "cat": "eco", "sector": "industry", "terrain": [HILLS],
		"desc": "Digs iron: more for each mountain and hill beside it. Hills only.",
		"levels": [
			{"name": "Iron Pit", "th": 1, "cost": {"wood": 25, "stone": 15, "gold": 20}, "hp": 200, "jobs": 4, "mult": 1.0},
			{"name": "Mine Shaft", "th": 2, "cost": {"wood": 40, "stone": 35, "gold": 40}, "hp": 280, "jobs": 4, "mult": 1.5},
			{"name": "Ironworks", "th": 3, "cost": {"wood": 30, "stone": 60, "iron": 20, "gold": 70}, "hp": 380, "jobs": 5, "mult": 2.1},
			{"name": "Steel Mill", "th": 4, "cost": {"stone": 90, "iron": 50, "gold": 120}, "hp": 500, "jobs": 5, "mult": 2.8},
			{"name": "Fusion Foundry", "th": 5, "cost": {"stone": 130, "iron": 100, "gold": 200}, "hp": 640, "jobs": 6, "mult": 3.6},
		],
	},
	"library": {
		"name": "Library", "cat": "eco", "sector": "science", "terrain": BUILDABLE,
		"desc": "Scholars produce science. Science pays for new ages and research: if it falls behind, the raiders' weapons will outclass yours.",
		"levels": [
			{"name": "Scriptorium", "th": 1, "cost": {"wood": 30, "stone": 15, "gold": 15}, "hp": 200, "jobs": 3, "prod": {"science": 9}},
			{"name": "Academy", "th": 2, "cost": {"wood": 40, "stone": 45, "gold": 50}, "hp": 280, "jobs": 4, "prod": {"science": 16}},
			{"name": "University", "th": 3, "cost": {"stone": 80, "iron": 25, "gold": 90}, "hp": 380, "jobs": 5, "prod": {"science": 26}},
			{"name": "Research Lab", "th": 4, "cost": {"stone": 110, "iron": 60, "gold": 150}, "hp": 480, "jobs": 6, "prod": {"science": 40}},
			{"name": "Quantum Institute", "th": 5, "cost": {"stone": 150, "iron": 110, "gold": 230}, "hp": 600, "jobs": 7, "prod": {"science": 60}},
		],
	},
	"market": {
		"name": "Market", "cat": "civic", "terrain": BUILDABLE, "radius": 7.5,
		"limit": [1, 2, 2, 3, 3],
		"desc": "Houses within reach pay more tax. Traders here swap surplus goods for gold (select the market).",
		"levels": [
			{"name": "Market Stalls", "th": 1, "cost": {"wood": 30, "stone": 15, "gold": 40}, "hp": 200, "tax": 1.4},
			{"name": "Trading House", "th": 2, "cost": {"wood": 40, "stone": 40, "gold": 70}, "hp": 280, "tax": 1.5},
			{"name": "Exchange Hall", "th": 3, "cost": {"stone": 80, "iron": 20, "gold": 120}, "hp": 380, "tax": 1.6},
			{"name": "Shopping Centre", "th": 4, "cost": {"stone": 120, "iron": 50, "gold": 180}, "hp": 480, "tax": 1.7},
			{"name": "Hyper-Mall", "th": 5, "cost": {"stone": 160, "iron": 100, "gold": 260}, "hp": 600, "tax": 1.85},
		],
	},
	"tower": {
		"name": "Watch Tower", "cat": "def", "sector": "military", "terrain": BUILDABLE,
		"limit": [6, 8, 10, 12, 14],
		"desc": "Short-range rapid fire against landing troops and boats. From the Industrial level it can also shoot at aircraft.",
		"levels": [
			{"name": "Archer Tower", "th": 1, "cost": {"wood": 25, "stone": 10, "gold": 20}, "hp": 260, "jobs": 1,
				"weapon": {"kind": "arrow", "range": 6.0, "dmg": 6.0, "rate": 1.3, "targets": {"ground": 1.0, "sea": 0.8}}},
			{"name": "Musket Tower", "th": 2, "cost": {"wood": 30, "stone": 40, "gold": 50}, "hp": 400, "jobs": 1,
				"weapon": {"kind": "musket", "range": 6.5, "dmg": 13.0, "rate": 1.1, "acc": 0.8, "targets": {"ground": 1.0, "sea": 0.8}}},
			{"name": "Gatling Tower", "th": 3, "cost": {"stone": 60, "iron": 30, "gold": 80}, "hp": 560, "jobs": 2,
				"weapon": {"kind": "mg", "range": 7.0, "dmg": 5.5, "rate": 6.0, "acc": 0.75, "targets": {"ground": 1.0, "sea": 0.9, "air": 0.55}}},
			{"name": "Autocannon Bunker", "th": 4, "cost": {"stone": 90, "iron": 60, "gold": 130}, "hp": 760, "jobs": 2,
				"weapon": {"kind": "mg", "range": 7.5, "dmg": 11.0, "rate": 6.0, "acc": 0.8, "targets": {"ground": 1.0, "sea": 1.0, "air": 0.75}}},
			{"name": "Laser Turret", "th": 5, "cost": {"stone": 120, "iron": 110, "gold": 200}, "hp": 1000, "jobs": 2,
				"weapon": {"kind": "laser", "range": 8.5, "dmg": 44.0, "rate": 2.4, "targets": {"ground": 1.0, "sea": 1.0, "air": 1.0}}},
		],
	},
	"artillery": {
		"name": "Artillery", "cat": "def", "sector": "military", "terrain": BUILDABLE,
		"limit": [2, 3, 4, 5, 6],
		"desc": "Long-range splash damage against ships and troops on the beach. Cannot hit aircraft.",
		"levels": [
			{"name": "Catapult", "th": 1, "cost": {"wood": 40, "stone": 30, "gold": 40}, "hp": 360, "jobs": 2,
				"weapon": {"kind": "stone", "range": 9.0, "dmg": 34.0, "rate": 0.28, "splash": 1.1, "targets": {"sea": 1.0, "ground": 0.7}}},
			{"name": "Cannon Battery", "th": 2, "cost": {"wood": 30, "stone": 60, "gold": 80}, "hp": 520, "jobs": 2,
				"weapon": {"kind": "shell", "range": 11.0, "dmg": 62.0, "rate": 0.34, "splash": 1.3, "targets": {"sea": 1.0, "ground": 0.8}}},
			{"name": "Coastal Gun", "th": 3, "cost": {"stone": 90, "iron": 40, "gold": 120}, "hp": 700, "jobs": 3,
				"weapon": {"kind": "shell", "range": 13.0, "dmg": 105.0, "rate": 0.36, "splash": 1.5, "targets": {"sea": 1.0, "ground": 0.8}}},
			{"name": "Howitzer Battery", "th": 4, "cost": {"stone": 120, "iron": 80, "gold": 180}, "hp": 900, "jobs": 3,
				"weapon": {"kind": "shell", "range": 15.0, "dmg": 175.0, "rate": 0.42, "splash": 1.7, "targets": {"sea": 1.0, "ground": 0.85}}},
			{"name": "Railgun", "th": 5, "cost": {"stone": 150, "iron": 150, "gold": 260}, "hp": 1150, "jobs": 3,
				"weapon": {"kind": "rail", "range": 18.0, "dmg": 520.0, "rate": 0.3, "splash": 0.9, "targets": {"sea": 1.0, "ground": 0.9}}},
		],
	},
	"aa": {
		"name": "Air Defence", "cat": "def", "sector": "military", "terrain": BUILDABLE,
		"limit": [0, 0, 3, 4, 5],
		"desc": "Shoots down aircraft. Biplanes and zeppelins arrive with the Industrial raiders; later, jets and the nuclear bomber.",
		"levels": [
			{"name": "Flak Battery", "th": 3, "cost": {"stone": 50, "iron": 30, "gold": 70}, "hp": 450, "jobs": 2,
				"weapon": {"kind": "flak", "range": 10.5, "dmg": 30.0, "rate": 1.1, "splash": 2.0, "targets": {"air": 1.0}}},
			{"name": "SAM Site", "th": 4, "cost": {"stone": 70, "iron": 70, "gold": 140}, "hp": 620, "jobs": 3,
				"weapon": {"kind": "missile", "range": 16.0, "dmg": 160.0, "rate": 0.4, "splash": 1.4, "targets": {"air": 1.0}}},
			{"name": "Laser AA Array", "th": 5, "cost": {"stone": 100, "iron": 130, "gold": 220}, "hp": 820, "jobs": 3,
				"weapon": {"kind": "laser", "range": 17.0, "dmg": 70.0, "rate": 2.2, "targets": {"air": 1.0}}},
		],
	},
	"barracks": {
		"name": "Barracks", "cat": "def", "sector": "military", "terrain": BUILDABLE,
		"limit": [1, 2, 3, 3, 4], "guard": 15.0,
		"desc": "Trains soldiers that hunt down enemy landing parties near the barracks. Each level trains a more modern soldier.",
		"levels": [
			{"name": "Militia Camp", "th": 1, "cost": {"wood": 40, "stone": 20, "gold": 50}, "hp": 420, "jobs": 3, "units": 3, "soldier": "militia"},
			{"name": "Musketeer Barracks", "th": 2, "cost": {"wood": 40, "stone": 50, "gold": 80}, "hp": 560, "jobs": 4, "units": 4, "soldier": "musketeer_a"},
			{"name": "Rifle Depot", "th": 3, "cost": {"stone": 70, "iron": 30, "gold": 110}, "hp": 720, "jobs": 4, "units": 5, "soldier": "rifleman_a"},
			{"name": "Marine Base", "th": 4, "cost": {"stone": 100, "iron": 60, "gold": 160}, "hp": 900, "jobs": 5, "units": 6, "soldier": "marine_a"},
			{"name": "Exo-Trooper Bay", "th": 5, "cost": {"stone": 130, "iron": 120, "gold": 240}, "hp": 1100, "jobs": 6, "units": 7, "soldier": "exo_a"},
		],
	},
	"airfield": {
		"name": "Airfield", "cat": "def", "sector": "military", "terrain": FLAT,
		"limit": [0, 0, 1, 2, 2],
		"desc": "Home to interceptors that chase down aircraft and strafe ships. Needs flat ground.",
		"levels": [
			{"name": "Airstrip", "th": 3, "cost": {"wood": 60, "stone": 60, "iron": 40, "gold": 140}, "hp": 600, "jobs": 4, "units": 2, "plane": "ally_biplane"},
			{"name": "Air Base", "th": 4, "cost": {"stone": 100, "iron": 80, "gold": 200}, "hp": 800, "jobs": 5, "units": 3, "plane": "ally_jet"},
			{"name": "Aerospace Base", "th": 5, "cost": {"stone": 130, "iron": 140, "gold": 280}, "hp": 1000, "jobs": 6, "units": 4, "plane": "ally_drone"},
		],
	},
	"wall": {
		"name": "Wall", "cat": "def", "terrain": BUILDABLE, "noroad": true,
		"desc": "Blocks landing troops: they must break through or walk around. Walls join up with their neighbours. No road or workers needed.",
		"levels": [
			{"name": "Palisade", "th": 1, "cost": {"wood": 5}, "hp": 260},
			{"name": "Stone Wall", "th": 2, "cost": {"stone": 8, "gold": 2}, "hp": 560},
			{"name": "Brick Bastion", "th": 3, "cost": {"stone": 12, "iron": 2, "gold": 4}, "hp": 950},
			{"name": "Concrete Barrier", "th": 4, "cost": {"stone": 16, "iron": 6, "gold": 6}, "hp": 1500},
			{"name": "Force Wall", "th": 5, "cost": {"stone": 20, "iron": 12, "gold": 10}, "hp": 2400},
		],
	},
}

const BUILD_MENU := {
	"eco": ["farm", "dock", "lumber", "quarry", "mine", "library"],
	"civic": ["house", "market"],
	"def": ["tower", "artillery", "aa", "barracks", "airfield", "wall"],
}
const CAT_NAME := {"eco": "Economy", "civic": "Town", "def": "Defence"}

# ---------------------------------------------------------------- enemies
# role: gunship (shells buildings), lander (carries troops), striker (attack passes), bomber (bombing run),
# infantry (land troops). cost = raid budget points, weight = how often a raid picks it.
const ENEMIES := {
	# ---- Medieval
	"longship": {"name": "Longship", "age": 0, "domain": "sea", "role": "gunship", "hp": 80, "speed": 2.4, "turn": 1.6, "range": 5.5, "dmg": 6.0, "rate": 0.8, "splash": 0.6, "shot": "arrow", "bounty": 6, "cost": 6, "weight": 3.0, "radius": 0.6},
	"raider_boat": {"name": "Raider Boat", "age": 0, "domain": "sea", "role": "lander", "hp": 70, "speed": 2.6, "turn": 1.6, "troops": 3, "troop": "raider", "bounty": 5, "cost": 6, "weight": 2.6, "radius": 0.5},
	"war_cog": {"name": "War Cog", "age": 0, "domain": "sea", "role": "gunship", "hp": 260, "speed": 1.6, "turn": 1.0, "range": 8.0, "dmg": 20.0, "rate": 0.3, "splash": 0.9, "shot": "bolt", "bounty": 18, "cost": 18, "weight": 1.0, "radius": 0.8, "min_wave": 3},
	"dragonship": {"name": "Dragon Ship", "age": 0, "domain": "sea", "role": "gunship", "boss": true, "hp": 900, "speed": 1.4, "turn": 0.8, "range": 9.0, "dmg": 26.0, "rate": 0.45, "splash": 1.0, "shot": "bolt", "bounty": 80, "cost": 0, "weight": 0.0, "radius": 1.1, "troops": 4, "troop": "knight"},
	"raider": {"name": "Raider", "age": 0, "domain": "ground", "role": "infantry", "hp": 35, "speed": 1.3, "range": 0.9, "dmg": 7.0, "rate": 1.0, "bounty": 2, "radius": 0.3},
	"knight": {"name": "Knight", "age": 0, "domain": "ground", "role": "infantry", "hp": 110, "speed": 1.05, "range": 0.9, "dmg": 13.0, "rate": 0.9, "bounty": 4, "radius": 0.3},
	# ---- Renaissance
	"frigate": {"name": "Frigate", "age": 1, "domain": "sea", "role": "gunship", "hp": 230, "speed": 3.0, "turn": 1.4, "range": 8.0, "dmg": 15.0, "rate": 0.7, "splash": 0.8, "shot": "shell", "bounty": 12, "cost": 12, "weight": 2.4, "radius": 0.7},
	"longboat": {"name": "Longboat", "age": 1, "domain": "sea", "role": "lander", "hp": 140, "speed": 2.6, "turn": 1.5, "troops": 4, "troop": "musketeer", "bounty": 8, "cost": 9, "weight": 2.2, "radius": 0.55},
	"galleon": {"name": "Galleon", "age": 1, "domain": "sea", "role": "gunship", "hp": 600, "speed": 1.7, "turn": 0.8, "range": 10.0, "dmg": 30.0, "rate": 0.45, "splash": 1.0, "shot": "shell", "bounty": 30, "cost": 26, "weight": 1.2, "radius": 1.0},
	"ship_of_line": {"name": "Ship of the Line", "age": 1, "domain": "sea", "role": "gunship", "boss": true, "hp": 2200, "speed": 1.2, "turn": 0.5, "range": 11.0, "dmg": 34.0, "rate": 0.9, "splash": 1.1, "shot": "shell", "bounty": 160, "cost": 0, "weight": 0.0, "radius": 1.4},
	"musketeer": {"name": "Musketeer", "age": 1, "domain": "ground", "role": "infantry", "hp": 75, "speed": 1.2, "range": 2.6, "dmg": 10.0, "rate": 0.8, "bounty": 3, "radius": 0.3},
	# ---- Industrial
	"gunboat": {"name": "Steam Gunboat", "age": 2, "domain": "sea", "role": "gunship", "hp": 420, "speed": 3.2, "turn": 1.5, "range": 9.0, "dmg": 20.0, "rate": 0.8, "splash": 0.9, "shot": "shell", "bounty": 16, "cost": 14, "weight": 2.2, "radius": 0.7},
	"steam_launch": {"name": "Steam Launch", "age": 2, "domain": "sea", "role": "lander", "hp": 260, "speed": 2.8, "turn": 1.5, "troops": 5, "troop": "rifleman", "bounty": 10, "cost": 12, "weight": 2.0, "radius": 0.6},
	"ironclad": {"name": "Ironclad", "age": 2, "domain": "sea", "role": "gunship", "hp": 1300, "speed": 1.6, "turn": 0.7, "range": 11.0, "dmg": 45.0, "rate": 0.4, "splash": 1.2, "shot": "shell", "bounty": 45, "cost": 34, "weight": 1.2, "radius": 1.0},
	"biplane": {"name": "Biplane Bomber", "age": 2, "domain": "air", "role": "striker", "hp": 130, "speed": 6.0, "turn": 1.4, "alt": 4.5, "bombs": 2, "bomb_dmg": 50.0, "splash": 1.2, "bounty": 12, "cost": 10, "weight": 1.8, "radius": 0.6},
	"zeppelin": {"name": "Zeppelin", "age": 2, "domain": "air", "role": "bomber", "hp": 900, "speed": 2.2, "turn": 0.4, "alt": 7.5, "bombs": 10, "bomb_dmg": 34.0, "splash": 1.3, "bounty": 35, "cost": 28, "weight": 0.8, "radius": 1.3},
	"dreadnought": {"name": "Dreadnought", "age": 2, "domain": "sea", "role": "gunship", "boss": true, "hp": 5200, "speed": 1.2, "turn": 0.45, "range": 13.0, "dmg": 70.0, "rate": 0.55, "splash": 1.4, "shot": "shell", "bounty": 260, "cost": 0, "weight": 0.0, "radius": 1.5},
	"rifleman": {"name": "Rifleman", "age": 2, "domain": "ground", "role": "infantry", "hp": 120, "speed": 1.25, "range": 3.0, "dmg": 14.0, "rate": 0.9, "bounty": 4, "radius": 0.3},
	# ---- Modern
	"destroyer": {"name": "Destroyer", "age": 3, "domain": "sea", "role": "gunship", "hp": 1700, "speed": 2.6, "turn": 0.9, "range": 12.0, "dmg": 50.0, "rate": 0.55, "splash": 1.2, "shot": "shell", "bounty": 50, "cost": 36, "weight": 1.6, "radius": 1.0},
	"landing_craft": {"name": "Landing Craft", "age": 3, "domain": "sea", "role": "lander", "hp": 520, "speed": 2.6, "turn": 1.4, "troops": 6, "troop": "marine", "bounty": 14, "cost": 16, "weight": 2.0, "radius": 0.65},
	"jet": {"name": "Strike Jet", "age": 3, "domain": "air", "role": "striker", "hp": 340, "speed": 11.0, "turn": 1.3, "alt": 6.0, "rockets": 4, "rocket_dmg": 55.0, "splash": 1.1, "bounty": 26, "cost": 20, "weight": 1.7, "radius": 0.6},
	"heavy_bomber": {"name": "Heavy Bomber", "age": 3, "domain": "air", "role": "bomber", "hp": 1200, "speed": 4.2, "turn": 0.5, "alt": 8.0, "bombs": 10, "bomb_dmg": 55.0, "splash": 1.4, "bounty": 45, "cost": 34, "weight": 1.0, "radius": 1.2},
	"battleship": {"name": "Battleship", "age": 3, "domain": "sea", "role": "gunship", "boss": true, "hp": 9000, "speed": 1.3, "turn": 0.45, "range": 15.0, "dmg": 95.0, "rate": 0.6, "splash": 1.6, "shot": "shell", "bounty": 400, "cost": 0, "weight": 0.0, "radius": 1.6},
	"marine": {"name": "Marine", "age": 3, "domain": "ground", "role": "infantry", "hp": 190, "speed": 1.35, "range": 3.2, "dmg": 20.0, "rate": 1.0, "bounty": 5, "radius": 0.3},
	# ---- Atomic
	"missile_cruiser": {"name": "Missile Cruiser", "age": 4, "domain": "sea", "role": "gunship", "hp": 3200, "speed": 2.4, "turn": 0.8, "range": 15.0, "dmg": 80.0, "rate": 0.45, "splash": 1.4, "shot": "rocket", "bounty": 70, "cost": 46, "weight": 1.5, "radius": 1.1},
	"hovercraft": {"name": "Assault Hovercraft", "age": 4, "domain": "sea", "role": "lander", "hp": 900, "speed": 3.4, "turn": 1.6, "troops": 7, "troop": "exo", "bounty": 18, "cost": 20, "weight": 2.0, "radius": 0.7},
	"stealth_jet": {"name": "Stealth Jet", "age": 4, "domain": "air", "role": "striker", "hp": 620, "speed": 13.0, "turn": 1.3, "alt": 6.5, "rockets": 6, "rocket_dmg": 75.0, "splash": 1.2, "bounty": 34, "cost": 26, "weight": 1.7, "radius": 0.7},
	"nuke_bomber": {"name": "Nuclear Bomber", "age": 4, "domain": "air", "role": "bomber", "nuke": true, "hp": 2800, "speed": 3.4, "turn": 0.4, "alt": 9.0, "bombs": 1, "bomb_dmg": 1100.0, "splash": 4.8, "bounty": 220, "cost": 0, "weight": 0.0, "radius": 1.5},
	"carrier": {"name": "Supercarrier", "age": 4, "domain": "sea", "role": "gunship", "boss": true, "hp": 15000, "speed": 1.3, "turn": 0.4, "range": 15.0, "dmg": 110.0, "rate": 0.5, "splash": 1.6, "shot": "rocket", "bounty": 600, "cost": 0, "weight": 0.0, "radius": 1.8, "launch": "stealth_jet"},
	"exo": {"name": "Exo-Trooper", "age": 4, "domain": "ground", "role": "infantry", "hp": 330, "speed": 1.45, "range": 3.5, "dmg": 30.0, "rate": 1.0, "bounty": 7, "radius": 0.32},
}
const BOSSES := ["dragonship", "ship_of_line", "dreadnought", "battleship", "carrier"]

# ---------------------------------------------------------------- allies
const ALLIES := {
	"militia": {"name": "Militia", "age": 0, "hp": 70, "speed": 1.7, "range": 0.9, "dmg": 8.0, "rate": 1.0},
	"musketeer_a": {"name": "Musketeer", "age": 1, "hp": 100, "speed": 1.7, "range": 2.6, "dmg": 12.0, "rate": 0.9},
	"rifleman_a": {"name": "Rifleman", "age": 2, "hp": 150, "speed": 1.8, "range": 3.0, "dmg": 17.0, "rate": 1.0},
	"marine_a": {"name": "Marine", "age": 3, "hp": 230, "speed": 1.9, "range": 3.2, "dmg": 24.0, "rate": 1.1},
	"exo_a": {"name": "Exo-Trooper", "age": 4, "hp": 400, "speed": 2.0, "range": 3.6, "dmg": 36.0, "rate": 1.1},
	"ally_biplane": {"name": "Biplane Fighter", "age": 2, "hp": 160, "speed": 6.5, "turn": 2.2, "range": 3.0, "dmg": 6.0, "rate": 6.0, "acc": 0.6},
	"ally_jet": {"name": "Interceptor Jet", "age": 3, "hp": 320, "speed": 10.5, "turn": 2.3, "range": 3.6, "dmg": 12.0, "rate": 8.0, "acc": 0.65},
	"ally_drone": {"name": "Combat Drone", "age": 4, "hp": 520, "speed": 12.0, "turn": 2.8, "range": 4.0, "dmg": 22.0, "rate": 8.0, "acc": 0.75},
}

# ---------------------------------------------------------------- research (bought at the Town Hall)
const RESEARCH := [
	{"id": "masonry", "name": "Masonry", "max": 3, "th": 1, "cost": {"science": 30, "stone": 40}, "desc": "+20% health for every building, per level."},
	{"id": "ballistics", "name": "Ballistics", "max": 3, "th": 1, "cost": {"science": 45, "gold": 60}, "desc": "+15% damage for every weapon, per level."},
	{"id": "crops", "name": "Crop Rotation", "max": 3, "th": 1, "cost": {"science": 30, "wood": 40}, "desc": "+20% food from farms and docks, per level."},
	{"id": "tools", "name": "Better Tools", "max": 3, "th": 1, "cost": {"science": 35, "gold": 50}, "desc": "+20% wood, stone and iron, per level."},
	{"id": "beacons", "name": "Signal Beacons", "max": 1, "th": 1, "cost": {"science": 40, "wood": 60}, "desc": "+25 s to prepare between raids, and starting raids early pays 50% more."},
	{"id": "optics", "name": "Optics", "max": 2, "th": 2, "cost": {"science": 80, "gold": 90}, "desc": "+10% range for every weapon, per level."},
	{"id": "printing", "name": "Printing Press", "max": 2, "th": 2, "cost": {"science": 70, "gold": 80}, "desc": "+20% science, per level."},
	{"id": "admin", "name": "Civic Administration", "max": 2, "th": 2, "cost": {"science": 60, "stone": 60}, "desc": "+20% tax income, per level."},
	{"id": "drills", "name": "Drill Sergeants", "max": 2, "th": 2, "cost": {"science": 60, "food": 60}, "desc": "Soldiers get +35% health and damage per level, and barracks train faster."},
	{"id": "medicine", "name": "Medicine", "max": 1, "th": 3, "cost": {"science": 140, "food": 120}, "desc": "Population grows twice as fast and needs 15% less food."},
	{"id": "firebrigade", "name": "Fire Brigades", "max": 1, "th": 3, "cost": {"science": 120, "iron": 40}, "desc": "Buildings repair twice as fast and start repairing sooner."},
	{"id": "radar", "name": "Radar", "max": 1, "th": 4, "cost": {"science": 260, "iron": 80}, "desc": "+15% range for air defence and fighters scramble earlier."},
	{"id": "automation", "name": "Automation", "max": 1, "th": 4, "cost": {"science": 300, "iron": 100}, "desc": "Every workplace needs one fewer worker."},
	{"id": "shields", "name": "Energy Shields", "max": 1, "th": 5, "cost": {"science": 600, "iron": 200}, "desc": "Buildings take 25% less damage from bombs, rockets and the nuclear bomb."},
]

static func research_by_id(id: String) -> Dictionary:
	for r in RESEARCH:
		if r.id == id:
			return r
	return {}

static func research_cost(r: Dictionary, lvl: int) -> Dictionary:
	var o := {}
	var f := pow(1.8, lvl)
	for k in r.cost:
		o[k] = int(ceil(r.cost[k] * f))
	return o

# ---------------------------------------------------------------- story
const STORY_INTRO := [
	["The Chronicle of Bastion", "Year One of the Warden.\n\nThe old kingdom has fallen to the Grey Armada, the mist-raiders of the northern sea. You lead the last free folk across the water to a forgotten island ringed by cliffs and crowned with pines. The elders name it Bastion."],
	["The Raiders Will Follow", "They always do. Their longships come with the tide, and every season they return with sharper steel and stranger engines.\n\nRaise a hall, build homes and roads, and set your people to work: farmers to feed us, woodcutters and masons to build, scholars to remember, and soldiers to keep the watch."],
	["Heed the Scholars", "The old books warn of iron ships that need no wind and of fire that falls from the sky. If our learning lags behind the raiders' weapons, our towers will be as paper.\n\nUpgrade the Town Hall to carry Bastion into each new age. Survive twenty raids and Bastion endures."],
]
const STORY_AGE := [
	["", ""],
	["The Age of Sail and Reason", "Our scholars have mastered the compass and the printing press. Gunpowder thunders from new stone towers and the Guildhall rises in painted plaster and terracotta.\n\nBut the Armada has learned too: galleons bristling with cannon have been sighted on the horizon."],
	["The Age of Steam", "Smokestacks crowd the skyline and the forges never cool. Our walls are brick, our guns are rifled, and the first air defence batteries can be built.\n\nThe raiders answer with ironclads, and our lookouts swear they have seen great cloth whales and rattling biplanes above the clouds."],
	["The Modern Age", "Concrete, radio and the jet engine. Bastion is a city now, its people counted in the hundreds.\n\nThe Armada has become a navy of destroyers and strike jets. Keep the laboratories humming and the skies watched."],
	["The Atomic Age", "Our scientists have split the atom, and our towers fire beams of light.\n\nYet the enemy has done the same. Scouts speak of a bomber that carries a single, terrible weapon. If one gets through, whole districts will burn. Guard the skies above all."],
]
const ENEMY_AGE_NEWS := [
	"",
	"The Armada has entered the Renaissance: frigates, galleons and musketeers are coming!",
	"The Armada has entered the Industrial age: ironclads, riflemen, biplanes and zeppelins!",
	"The Armada has entered the Modern age: destroyers, marines, strike jets and heavy bombers!",
	"The Armada has entered the Atomic age: missile cruisers, exo-troopers, stealth jets - and the nuclear bomber!",
]
const STORY_WIN := ["Bastion Endures", "Twenty raids have broken upon Bastion's shores, and the Grey Armada lies at the bottom of the sea.\n\nFrom a thatched hall to a shining spire, your people endured. The Chronicle is complete, but the sea is wide: you may keep the watch as long as you like."]
const STORY_LOSE := ["The Hall Has Fallen", "Smoke rises over the ruins of the Town Hall. The survivors take to the boats, and the Chronicle of Bastion ends here.\n\nPerhaps another Warden, on another island, will learn from these pages."]

static func level_def(type: String, lvl: int) -> Dictionary:
	var lv: Array = BUILDINGS[type].levels
	return lv[clampi(lvl, 1, lv.size()) - 1]

static func max_level(type: String) -> int:
	return BUILDINGS[type].levels.size()

## Age a building level belongs to (0 = Medieval .. 4 = Atomic)
static func level_age(type: String, lvl: int) -> int:
	if type == "hq":
		return lvl - 1
	return int(level_def(type, lvl).th) - 1

static func cost_text(cost: Dictionary) -> String:
	var parts := []
	for k in RES:
		if cost.has(k) and cost[k] > 0:
			parts.append("%d %s" % [cost[k], RES_NAME[k]])
	return ", ".join(parts) if parts.size() else "free"
