extends Node
## Autoload "G": the whole simulation state, economy, workers, ages, placement rules and save/load.
## Combat lives in Combat (combat.gd). Nothing in here touches rendering: views listen to the signals.

signal message(text: String, kind: String)
signal building_added(b)
signal building_removed(b)
signal building_changed(b)
signal world_changed
signal unit_added(u)
signal unit_removed(u)
signal fx(kind: String, pos: Vector3, size: float)
signal beam(a: Vector3, b: Vector3, color: Color, width: float)
signal sfx(name: String, pos: Vector3)
signal wave_started(n: int)
signal wave_ended(report: Dictionary)
signal age_changed(age: int)
signal enemy_age_changed(age: int)
signal game_over(win: bool)
signal story(title: String, text: String)

const SAVE_PATH := "user://bastion_v3_save.json"

var W: HexWorld = HexWorld.new()
var path: HexPath = HexPath.new()
var combat: Combat = null

var mode := "menu"          # menu | play | over
var time := 0.0
var speed := 1
var paused := false
var frozen := false
var seed_v := 1
var res := {}
var rates := {}
var pop := 8
var housing := 10
var jobs := {}
var assign := {}
var cap := {}
var staff := {}
var idle := 0
var starving := false
var grow_t := 0.0
var econ_t := 0.0
var age := 0
var buildings: Array = []
var by_id := {}
var next_id := 1
var hq: Bld = null
var enemies: Array = []
var allies: Array = []
var projectiles: Array = []
var research := {}
var mod := {}
var stats := {}
var victory := false
var wave := {}
var dirty_connect := true
var selftest := false
var story_seen := {}
var last_enemy_age := 0

func _ready() -> void:
	combat = Combat.new()
	reset_state(1)

# ------------------------------------------------------------------ helpers
func notify(text: String, kind: String = "info") -> void:
	message.emit(text, kind)
	if selftest and kind != "info":
		print("  [msg] ", text)

func emit_fx(kind: String, p: Vector3, size: float = 1.0) -> void:
	fx.emit(kind, p, size)

func can_afford(cost: Dictionary) -> bool:
	for k in cost:
		if res.get(k, 0.0) < cost[k] - 0.0001:
			return false
	return true

func pay(cost: Dictionary) -> void:
	for k in cost:
		res[k] -= cost[k]

func refund(cost: Dictionary, frac: float) -> void:
	for k in cost:
		res[k] += floor(cost[k] * frac)

func th_level() -> int:
	return hq.level if hq else 1

func rl(id: String) -> int:
	return int(research.get(id, 0))

func compute_mods() -> void:
	mod = {
		"bhp": 1.0 + 0.2 * rl("masonry"),
		"dmg": 1.0 + 0.15 * rl("ballistics"),
		"food": 1.0 + 0.2 * rl("crops"),
		"prod": 1.0 + 0.2 * rl("tools"),
		"prep": 25.0 if rl("beacons") > 0 else 0.0,
		"early": 1.5 if rl("beacons") > 0 else 1.0,
		"range": 1.0 + 0.1 * rl("optics"),
		"sci": 1.0 + 0.2 * rl("printing"),
		"tax": 1.0 + 0.2 * rl("admin"),
		"soldier": 1.0 + 0.35 * rl("drills"),
		"train": 1.0 + 0.5 * rl("drills"),
		"growth": 2.0 if rl("medicine") > 0 else 1.0,
		"eat": 0.85 if rl("medicine") > 0 else 1.0,
		"repair": 2.0 if rl("firebrigade") > 0 else 1.0,
		"repair_delay": 3.0 if rl("firebrigade") > 0 else 6.0,
		"aa_range": 1.15 if rl("radar") > 0 else 1.0,
		"scramble": 55.0 if rl("radar") > 0 else 42.0,
		"job_cut": 1 if rl("automation") > 0 else 0,
		"shield": 0.75 if rl("shields") > 0 else 1.0,
	}

# ------------------------------------------------------------------ new game
func reset_state(s: int) -> void:
	seed_v = s
	time = 0.0
	speed = 1
	paused = false
	res = {"food": 80.0, "wood": 160.0, "stone": 90.0, "iron": 0.0, "gold": 220.0, "science": 0.0}
	rates = {"food": 0.0, "wood": 0.0, "stone": 0.0, "iron": 0.0, "gold": 0.0, "science": 0.0}
	pop = 8
	housing = 10
	jobs = {"farm": 0, "industry": 0, "science": 0, "military": 0}
	assign = {"farm": 0, "industry": 0, "science": 0, "military": 0}
	cap = {"farm": -1, "industry": -1, "science": -1, "military": -1}
	staff = {"farm": 0.0, "industry": 0.0, "science": 0.0, "military": 0.0}
	idle = pop
	starving = false
	grow_t = 0.0
	econ_t = 0.0
	age = 0
	for b in buildings:
		building_removed.emit(b)
	for u in enemies + allies:
		unit_removed.emit(u)
	buildings = []
	by_id = {}
	next_id = 1
	hq = null
	enemies = []
	allies = []
	projectiles = []
	research = {}
	compute_mods()
	stats = {"kills": 0, "built": 0, "lost": 0, "waves": 0, "shots": 0, "gold_earned": 0}
	victory = false
	story_seen = {}
	last_enemy_age = 0
	wave = {"n": 1, "state": "prep", "timer": Defs.FIRST_WAVE_DELAY, "elapsed": 0.0, "plan": {}, "queue": [], "current": 0, "total": 0}

func new_game(s: int) -> void:
	W = HexWorld.new()
	W.generate(s)
	path = HexPath.new()
	path.setup(W)
	combat = Combat.new()
	reset_state(s)
	var b := add_building("hq", W.center, true)
	b.build_left = 0.0
	b.rot = 0
	stats.built = 0
	wave.plan = combat.gen_wave(1)
	recompute_connectivity()
	world_changed.emit()
	mode = "play"
	_econ_tick()

# ------------------------------------------------------------------ placement rules
func count_type(t: String) -> int:
	var n := 0
	for b in buildings:
		if b.type == t:
			n += 1
	return n

func limit_of(t: String) -> int:
	var d: Dictionary = Defs.BUILDINGS[t]
	if d.has("limit"):
		return d.limit[th_level() - 1]
	return 999

func unlocked(t: String) -> bool:
	return int(Defs.level_def(t, 1).th) <= th_level()

func lock_reason(t: String) -> String:
	var need := int(Defs.level_def(t, 1).th)
	if need > th_level():
		return "Requires Town Hall level %d (%s age)" % [need, Defs.AGES[need - 1]]
	if count_type(t) >= limit_of(t):
		return "Limit reached (%d at this Town Hall level)" % limit_of(t)
	return ""

func place_problem(t: String, i: int) -> String:
	if i < 0:
		return "Off the map"
	var d: Dictionary = Defs.BUILDINGS[t]
	var tt: int = W.type[i]
	if not HexWorld.is_land(tt):
		return "Must be built on land"
	if tt == Defs.MOUNTAIN:
		return "Too steep: mountains cannot be built on"
	if W.bld[i] != 0:
		return "Tile is occupied"
	if W.road[i] != 0:
		return "Tile has a road (bulldoze it first)"
	if not d.terrain.has(tt):
		if t == "farm":
			return "Farms need grassland"
		if t == "mine":
			return "Iron mines must be built on hills"
		if t == "airfield":
			return "Airfields need flat ground (not hills)"
		if t == "dock":
			return "Docks go on beach or grass"
		return "Wrong terrain"
	var lr := lock_reason(t)
	if lr != "":
		return lr
	if d.get("unique", false) and count_type(t) > 0:
		return "Only one can be built"
	if d.get("coastal", false) and W.count_nbr(i, func(x): return HexWorld.is_water(x)) == 0:
		return "Must touch the sea"
	if d.get("needs_adj", "") == "forest" and W.count_nbr(i, func(x): return x == Defs.FOREST) == 0:
		return "Needs a forest beside it"
	if d.get("needs_adj", "") == "rock" and tt != Defs.HILLS and W.count_nbr(i, func(x): return x == Defs.HILLS or x == Defs.MOUNTAIN) == 0:
		return "Needs hills or mountains beside it"
	return ""

func road_problem(i: int) -> String:
	if i < 0:
		return "Off the map"
	var tt: int = W.type[i]
	if not HexWorld.is_land(tt):
		return "Roads must be on land"
	if tt == Defs.MOUNTAIN:
		return "Too steep for a road"
	if W.bld[i] != 0:
		return "Tile is occupied"
	if W.road[i] != 0:
		return "Already a road"
	return ""

func _clear_tile(i: int) -> void:
	if W.type[i] == Defs.FOREST:
		W.type[i] = Defs.GRASS
		res.wood += 5
	W.ruin[i] = 0
	W.ruin_lv[i] = 0

func build_time(t: String, lvl: int) -> float:
	if t == "wall":
		return 1.0 + lvl * 0.5
	if t == "hq":
		return 10.0 + 8.0 * lvl
	if lvl <= 1:
		return 3.0 if t == "house" else 5.0
	return 4.0 + 3.0 * lvl

## Rotation that faces the first water neighbour (docks)
func water_rot(i: int) -> int:
	for k in 6:
		var a := PI / 6.0 + k * PI / 3.0
		var px := W.x[i] + sin(a) * 1.732
		var pz := W.z[i] + cos(a) * 1.732
		var j := W.tile_at(px, pz)
		if j >= 0 and HexWorld.is_water(W.type[j]):
			return k
	return 0

func add_building(t: String, i: int, free: bool = false, rot: int = 0) -> Bld:
	var d: Dictionary = Defs.BUILDINGS[t]
	if not free:
		pay(d.levels[0].cost)
	_clear_tile(i)
	var b := Bld.new()
	b.id = next_id
	next_id += 1
	b.type = t
	b.def = d
	b.tile = i
	b.pos = W.tpos(i)
	b.level = 1
	b.rot = posmod(rot, 6)
	b.max_hp = float(d.levels[0].hp) * mod.bhp
	b.hp = b.max_hp
	b.head_yaw = randf() * TAU
	b.cool = randf()
	b.scan = randf() * 0.2
	b.burn_t = randf()
	b.build_total = build_time(t, 1)
	b.build_left = 0.0 if free else b.build_total
	W.bld[i] = b.id
	buildings.append(b)
	by_id[b.id] = b
	if t == "hq":
		hq = b
	stats.built += 1
	_world_dirty()
	building_added.emit(b)
	if t == "wall":
		_walls_changed(i)
	return b

func try_place(t: String, i: int, rot: int = 0) -> String:
	var p := place_problem(t, i)
	if p != "":
		return p
	if not can_afford(Defs.BUILDINGS[t].levels[0].cost):
		return "Not enough resources"
	if t == "dock":
		rot = water_rot(i) if rot < 0 else rot
	add_building(t, i, false, maxi(rot, 0))
	sfx.emit("build", W.tpos(i))
	return ""

func try_road(i: int) -> String:
	var p := road_problem(i)
	if p != "":
		return p
	if not can_afford(Defs.ROAD_COST):
		return "Not enough gold"
	pay(Defs.ROAD_COST)
	_clear_tile(i)
	W.road[i] = 1
	_world_dirty()
	return ""

func remove_building(b: Bld, destroyed: bool) -> void:
	b.alive = false
	W.bld[b.tile] = 0
	buildings.erase(b)
	by_id.erase(b.id)
	if destroyed:
		W.ruin[b.tile] = Defs.BUILDINGS.keys().find(b.type) + 1
		W.ruin_lv[b.tile] = b.level
	for u in b.units:
		u.home = null
	building_removed.emit(b)
	_world_dirty()
	if b.type == "wall":
		_walls_changed(b.tile)

func _walls_changed(i: int) -> void:
	for d in 6:
		var j := W.nbr[i * 6 + d]
		if j >= 0 and W.bld[j] != 0:
			var o: Bld = by_id.get(W.bld[j])
			if o and o.type == "wall":
				building_changed.emit(o)

func bulldoze(i: int) -> String:
	if i < 0:
		return "Off the map"
	if W.bld[i] != 0:
		var b: Bld = by_id.get(W.bld[i])
		if b == null:
			return ""
		if b.type == "hq":
			return "The Town Hall cannot be demolished"
		refund(b.def.levels[0].cost, 0.5)
		remove_building(b, false)
		return ""
	if W.road[i] != 0:
		W.road[i] = 0
		res.gold += 1
		_world_dirty()
		return ""
	if W.ruin[i] != 0:
		W.ruin[i] = 0
		W.ruin_lv[i] = 0
		_world_dirty()
		return ""
	return "Nothing to clear"

func ruin_type(i: int) -> String:
	if W.ruin[i] <= 0:
		return ""
	return Defs.BUILDINGS.keys()[W.ruin[i] - 1]

func rebuild_cost(i: int) -> Dictionary:
	var t := ruin_type(i)
	var o := {}
	if t == "":
		return o
	var lv := mini(W.ruin_lv[i], max_level_now(t))
	for l in range(1, lv + 1):
		var c: Dictionary = Defs.level_def(t, l).cost
		for k in c:
			o[k] = o.get(k, 0) + int(ceil(c[k] * 0.4))
	return o

func rebuild_ruin(i: int) -> String:
	var t := ruin_type(i)
	if t == "":
		return "Nothing to rebuild"
	var cost := rebuild_cost(i)
	var keep: int = W.ruin[i]
	var keep_lv: int = W.ruin_lv[i]
	W.ruin[i] = 0
	var p := place_problem(t, i)
	if p == "" and not can_afford(cost):
		p = "Not enough resources"
	if p != "":
		W.ruin[i] = keep
		W.ruin_lv[i] = keep_lv
		return p
	pay(cost)
	var b := add_building(t, i, true, randi() % 6 if t != "dock" else water_rot(i))
	b.level = mini(keep_lv, max_level_now(t))
	b.max_hp = float(b.lv().hp) * mod.bhp
	b.hp = b.max_hp
	b.build_total = build_time(t, b.level)
	b.build_left = b.build_total
	building_changed.emit(b)
	return ""

func max_level_now(t: String) -> int:
	if t == "hq":
		return Defs.max_level("hq")
	var m := 1
	for l in range(1, Defs.max_level(t) + 1):
		if int(Defs.level_def(t, l).th) <= th_level():
			m = l
	return m

func upgrade_cost(b: Bld) -> Dictionary:
	if b.level >= Defs.max_level(b.type):
		return {}
	return Defs.level_def(b.type, b.level + 1).cost

func upgrade_problem(b: Bld) -> String:
	if b.level >= Defs.max_level(b.type):
		return "Already at the top level"
	if b.build_left > 0.0:
		return "Construction in progress"
	var nxt := Defs.level_def(b.type, b.level + 1)
	if b.type != "hq" and int(nxt.th) > th_level():
		return "Needs Town Hall level %d (%s)" % [nxt.th, Defs.AGES[int(nxt.th) - 1]]
	if not can_afford(nxt.cost):
		return "Not enough resources"
	return ""

func upgrade(b: Bld) -> String:
	var p := upgrade_problem(b)
	if p != "":
		return p
	pay(upgrade_cost(b))
	b.upgrading = true
	b.build_total = build_time(b.type, b.level + 1)
	b.build_left = b.build_total
	building_changed.emit(b)
	sfx.emit("build", b.pos)
	return ""

func _finish_construction(b: Bld) -> void:
	b.build_left = 0.0
	if b.upgrading:
		b.upgrading = false
		var frac := b.hp / b.max_hp
		b.level += 1
		b.max_hp = float(b.lv().hp) * mod.bhp
		b.hp = maxf(b.max_hp * frac, b.max_hp * 0.6)
		if b.type == "barracks" or b.type == "airfield":
			combat.refit_units(b)
		if b.type == "hq":
			_enter_age(b.level - 1)
		else:
			notify("%s upgraded to %s." % [b.def.name, b.lv().name], "good")
	emit_fx("build", b.pos, 1.0)
	refresh_stats()
	building_changed.emit(b)

func _enter_age(a: int) -> void:
	age = a
	refresh_stats()
	notify("Bastion enters the %s age! New building levels are unlocked." % Defs.AGES[a], "good")
	age_changed.emit(a)
	var s: Array = Defs.STORY_AGE[a]
	if s[0] != "" and not story_seen.has("age%d" % a):
		story_seen["age%d" % a] = true
		story.emit(s[0], s[1])

func damage_building(b: Bld, dmg: float, explosive: bool = false) -> void:
	if not b.alive or mode != "play":
		return
	if explosive:
		dmg *= mod.shield
	b.hp -= dmg
	b.flash = 1.0
	b.last_hit = time
	if b.hp <= 0.0:
		b.hp = 0.0
		stats.lost += 1
		if wave.has("lost"):
			wave.lost += 1
		if b.type == "hq":
			b.alive = false
			emit_fx("explosion", b.pos + Vector3(0, 0.5, 0), 2.0)
			end_game(false)
			return
		notify("%s destroyed!" % b.lv().name, "bad")
		emit_fx("explosion", b.pos + Vector3(0, 0.3, 0), 1.2)
		sfx.emit("boom", b.pos)
		remove_building(b, true)

func _world_dirty() -> void:
	dirty_connect = true
	W.version += 1
	world_changed.emit()

# ------------------------------------------------------------------ connectivity and stats
func recompute_connectivity() -> void:
	dirty_connect = false
	W.conn.fill(0)
	if hq == null:
		return
	var reach := PackedByteArray()
	reach.resize(W.count)
	reach.fill(0)
	var qq: Array = [hq.tile]
	reach[hq.tile] = 1
	var k := 0
	while k < qq.size():
		var c: int = qq[k]
		k += 1
		for d in 6:
			var j := W.nbr[c * 6 + d]
			if j >= 0 and reach[j] == 0 and W.road[j] != 0:
				reach[j] = 1
				W.conn[j] = 1
				qq.append(j)
	for b in buildings:
		if b.type == "hq" or b.def.get("noroad", false):
			b.connected = true
			continue
		var ok := false
		for d in 6:
			var j := W.nbr[b.tile * 6 + d]
			if j >= 0 and reach[j] != 0:
				ok = true
				break
		b.connected = ok
	refresh_stats()

func refresh_stats() -> void:
	compute_mods()
	var markets: Array = []
	for b in buildings:
		if b.type == "market" and b.connected and b.working():
			markets.append(b)
	for b in buildings:
		b.market_boost = 1.0
		if b.type == "house":
			for m in markets:
				if Vector2(m.pos.x - b.pos.x, m.pos.z - b.pos.z).length() <= m.def.radius:
					b.market_boost = maxf(b.market_boost, float(m.lv().tax))
		b.prod = compute_prod(b)
		b.ws = weapon_stats(b) if b.lv().has("weapon") else {}

func weapon_stats(b: Bld) -> Dictionary:
	var w: Dictionary = b.lv().weapon
	var dmg: float = w.dmg * mod.dmg
	var rng: float = w.range * mod.range
	if b.type == "aa":
		rng *= mod.aa_range
	var rate: float = w.rate
	if b.type != "hq":
		rate *= 0.3 + 0.7 * staff.get("military", 0.0)
	return {"dmg": dmg, "range": rng, "rate": rate, "splash": w.get("splash", 0.0)}

func housing_of(b: Bld) -> int:
	if b.type == "hq":
		return int(b.lv().housing)
	if b.type != "house" or not b.working():
		return 0
	return int(b.lv().housing)

func jobs_of(b: Bld) -> int:
	var j := int(b.lv().get("jobs", 0))
	if j <= 0 or not b.working():
		return 0
	return maxi(1, j - int(mod.job_cut))

func preview_prod(t: String, i: int) -> Dictionary:
	var b := Bld.new()
	b.type = t
	b.def = Defs.BUILDINGS[t]
	b.tile = i
	b.level = 1
	return compute_prod(b)

func compute_prod(b: Bld) -> Dictionary:
	var lvd := b.lv()
	var i := b.tile
	match b.type:
		"hq":
			return lvd.prod.duplicate()
		"library":
			return {"science": lvd.prod.science * mod.sci}
		"farm":
			return {"food": lvd.prod.food * mod.food}
		"dock":
			var wn := W.count_nbr(i, func(x): return HexWorld.is_water(x))
			return {"food": (lvd.prod.food + 2.5 * wn * (1.0 + 0.4 * (b.level - 1))) * mod.food}
		"lumber":
			var fn := W.count_nbr(i, func(x): return x == Defs.FOREST)
			return {"wood": (6.0 + 6.0 * fn) * lvd.mult * mod.prod}
		"quarry":
			var hn := W.count_nbr(i, func(x): return x == Defs.HILLS)
			var mn := W.count_nbr(i, func(x): return x == Defs.MOUNTAIN)
			var on := 6.0 if W.type[i] == Defs.HILLS else 0.0
			return {"stone": (4.0 + 5.0 * hn + 7.0 * mn + on) * lvd.mult * mod.prod}
		"mine":
			var hn2 := W.count_nbr(i, func(x): return x == Defs.HILLS)
			var mn2 := W.count_nbr(i, func(x): return x == Defs.MOUNTAIN)
			return {"iron": (10.0 + 4.0 * mn2 + 2.0 * hn2) * lvd.mult * mod.prod}
	return {}

# ------------------------------------------------------------------ workers
func total_assigned() -> int:
	var n := 0
	for s in Defs.SECTORS:
		n += int(assign[s])
	return n

func _fix_assign() -> void:
	var tot := total_assigned()
	while tot > pop:
		var best := ""
		var bs := -INF
		for s in Defs.SECTORS:
			if assign[s] <= 0:
				continue
			var sc: float = float(assign[s] - jobs[s]) * 10.0 + float(assign[s]) * 0.01
			if s == "farm":
				sc -= 0.005
			if sc > bs:
				bs = sc
				best = s
		if best == "":
			break
		assign[best] -= 1
		if cap[best] >= 0:
			cap[best] = mini(cap[best], assign[best])
		tot -= 1
	idle = pop - tot

func _fill_idle() -> void:
	idle = pop - total_assigned()
	var food_short: bool = rates.get("food", 0.0) < 0.0 or res.food < 25.0
	var pri := {"farm": 0.0, "military": 0.12, "industry": 0.2, "science": 0.16}
	while idle > 0:
		var best := ""
		var bs := INF
		for s in Defs.SECTORS:
			if cap[s] >= 0 and assign[s] >= cap[s]:
				continue
			if assign[s] >= jobs[s]:
				continue
			var sc: float = float(assign[s]) / float(maxi(1, jobs[s])) + pri[s]
			if s == "farm" and food_short:
				sc -= 1.0
			if sc < bs:
				bs = sc
				best = s
		if best == "":
			break
		assign[best] += 1
		idle -= 1

## +/- buttons on the worker panel
func adjust_workers(s: String, delta: int) -> void:
	for _k in absi(delta):
		if delta > 0:
			if idle <= 0:
				# borrow a worker from the sector with the most to spare
				var donor := ""
				var ds := -INF
				for o in Defs.SECTORS:
					if o == s or assign[o] <= 0:
						continue
					var sc: float = float(assign[o] - jobs[o]) * 10.0 + float(assign[o]) / float(maxi(1, jobs[o]))
					if o == "farm":
						sc -= 0.5
					if sc > ds:
						ds = sc
						donor = o
				if donor == "":
					return
				assign[donor] -= 1
				cap[donor] = assign[donor]
				idle += 1
			assign[s] += 1
			idle -= 1
			if cap[s] >= 0:
				cap[s] = maxi(cap[s], assign[s])
		else:
			if assign[s] <= 0:
				return
			assign[s] -= 1
			cap[s] = assign[s]
			idle += 1
	_update_staff()
	refresh_stats()

func auto_workers() -> void:
	for s in Defs.SECTORS:
		assign[s] = 0
		cap[s] = -1
	_fill_idle()
	_update_staff()
	refresh_stats()

func _update_staff() -> void:
	idle = pop - total_assigned()
	for s in Defs.SECTORS:
		staff[s] = minf(1.0, float(assign[s]) / float(jobs[s])) if jobs[s] > 0 else 0.0

func staffing_of(b: Bld) -> float:
	var s: String = b.def.get("sector", "")
	if s == "" or b.type == "hq":
		return 1.0
	return staff[s]

# ------------------------------------------------------------------ economy, once a game second
func _econ_tick() -> void:
	var hs := 0
	for s in Defs.SECTORS:
		jobs[s] = 0
	for b in buildings:
		if not b.connected:
			continue
		hs += housing_of(b)
		var s: String = b.def.get("sector", "")
		if s != "":
			jobs[s] += jobs_of(b)
	housing = hs
	_fix_assign()
	_fill_idle()
	_update_staff()

	var r := {"food": 0.0, "wood": 0.0, "stone": 0.0, "iron": 0.0, "gold": 0.0, "science": 0.0}
	for b in buildings:
		if not b.connected or not b.working() or b.prod.is_empty():
			continue
		var f := staffing_of(b)
		for k in b.prod:
			r[k] += b.prod[k] * f
	var occ := minf(1.0, float(pop) / float(housing)) if housing > 0 else 0.0
	var tax := 0.0
	for b in buildings:
		if not b.connected:
			continue
		var hh := housing_of(b)
		if hh > 0:
			tax += hh * occ * Defs.TAX * b.market_boost
	r.gold += tax * mod.tax
	r.food -= pop * Defs.EAT * mod.eat
	rates = r
	for k in Defs.RES:
		res[k] = maxf(0.0, res[k] + r[k] / 60.0)

	starving = res.food <= 0.01 and r.food < 0.0
	if pop > housing:
		pop = maxi(housing, pop - 1)
	elif starving:
		grow_t += 1.0
		if grow_t >= 4.0:
			grow_t = 0.0
			pop = maxi(mini(4, housing), pop - 1)
			notify("Your people are starving! Build farms or docks, or move workers to Farming.", "bad")
	elif pop < housing and res.food > 1.0:
		grow_t += 1.0
		var interval: float = maxf(1.2, 3.0 - housing / 150.0) / mod.growth
		while grow_t >= interval and pop < housing:
			grow_t -= interval
			pop += 1
	else:
		grow_t = 0.0
	idle = pop - total_assigned()
	for b in buildings:
		if not b.ws.is_empty():
			b.ws = weapon_stats(b)

# ------------------------------------------------------------------ market and research
const TRADES := [
	{"res": "wood", "amt": 25, "buy": 55, "sell": 22},
	{"res": "stone", "amt": 25, "buy": 70, "sell": 28},
	{"res": "iron", "amt": 15, "buy": 80, "sell": 32},
	{"res": "food", "amt": 40, "buy": 45, "sell": 18},
]

func market_level() -> int:
	var m := 0
	for b in buildings:
		if b.type == "market" and b.connected and b.working():
			m = maxi(m, b.level)
	return m

func trade(k: int, buy: bool) -> String:
	var t: Dictionary = TRADES[k]
	var ml := market_level()
	if ml == 0:
		return "Needs a working Market connected by road"
	var f := 1.0 - 0.06 * (ml - 1)
	if buy:
		var price := int(ceil(t.buy * f))
		if res.gold < price:
			return "Not enough gold"
		res.gold -= price
		res[t.res] += t.amt
	else:
		var gain := int(floor(t.sell / f))
		if res[t.res] < t.amt:
			return "Not enough %s" % Defs.RES_NAME[t.res]
		res[t.res] -= t.amt
		res.gold += gain
	return ""

func research_problem(id: String) -> String:
	var r := Defs.research_by_id(id)
	var lvl := rl(id)
	if lvl >= int(r.max):
		return "Fully researched"
	if int(r.th) > th_level():
		return "Needs Town Hall level %d" % r.th
	if not can_afford(Defs.research_cost(r, lvl)):
		return "Not enough resources"
	return ""

func buy_research(id: String) -> String:
	var p := research_problem(id)
	if p != "":
		return p
	var r := Defs.research_by_id(id)
	var lvl := rl(id)
	pay(Defs.research_cost(r, lvl))
	research[id] = lvl + 1
	var old_bhp: float = mod.bhp
	refresh_stats()
	if mod.bhp != old_bhp:
		for b in buildings:
			var f: float = mod.bhp / old_bhp
			b.max_hp *= f
			b.hp *= f
	notify("Research complete: %s%s" % [r.name, (" " + ["I", "II", "III"][lvl]) if int(r.max) > 1 else ""], "good")
	return ""

# ------------------------------------------------------------------ main step
func step(dt: float) -> void:
	if mode != "play":
		return
	time += dt
	econ_t += dt
	while econ_t >= 1.0:
		econ_t -= 1.0
		_econ_tick()
	if dirty_connect:
		recompute_connectivity()
	for k in range(buildings.size() - 1, -1, -1):
		if k >= buildings.size():
			continue
		var b: Bld = buildings[k]
		if b.build_left > 0.0:
			b.build_left -= dt * (1.0 if b.connected else 0.25)
			if b.build_left <= 0.0:
				_finish_construction(b)
	combat.update(dt)
	var ea := Defs.wave_age(wave.current if wave.state == "active" else wave.n)
	if ea > last_enemy_age:
		last_enemy_age = ea
		notify(Defs.ENEMY_AGE_NEWS[ea], "alert")
		enemy_age_changed.emit(ea)

func end_game(win: bool) -> void:
	if mode != "play":
		return
	if win:
		victory = true
		game_over.emit(true)
	else:
		mode = "over"
		delete_save()
		game_over.emit(false)

func call_wave_early() -> int:
	if wave.state != "prep":
		return 0
	var bonus := int(floor(wave.timer * 0.6 * mod.early))
	res.gold += bonus
	wave.timer = 0.0
	return bonus

# ------------------------------------------------------------------ save / load
func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)

func delete_save() -> void:
	if has_save():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))

func save_game() -> String:
	if mode != "play":
		return "Nothing to save"
	if wave.state != "prep":
		return "You can only save between raids"
	var roads := []
	var ruins := []
	var changed := []
	for i in W.count:
		if W.road[i] != 0:
			roads.append(i)
		if W.ruin[i] != 0:
			ruins.append([i, W.ruin[i], W.ruin_lv[i]])
		if W.type[i] != W.orig_type[i]:
			changed.append([i, W.type[i]])
	var bl := []
	for b in buildings:
		bl.append([b.type, b.tile, b.level, snappedf(b.hp / b.max_hp, 0.001), b.rot, snappedf(b.build_left, 0.01), b.upgrading])
	var data := {
		"v": 3, "seed": seed_v, "time": time, "res": res, "pop": pop, "assign": assign, "cap": cap,
		"research": research, "stats": stats, "victory": victory, "story": story_seen,
		"wave": {"n": wave.n, "timer": wave.timer, "plan": wave.plan},
		"buildings": bl, "roads": roads, "ruins": ruins, "changed": changed,
	}
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		return "Could not write the save file"
	f.store_string(JSON.stringify(data))
	f.close()
	return ""

func load_game() -> String:
	if not has_save():
		return "No saved game"
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return "Could not read the save file"
	var data = JSON.parse_string(f.get_as_text())
	f.close()
	if typeof(data) != TYPE_DICTIONARY or int(data.get("v", 0)) != 3:
		return "Save file is from another version"
	W = HexWorld.new()
	W.generate(int(data.seed))
	path = HexPath.new()
	path.setup(W)
	combat = Combat.new()
	reset_state(int(data.seed))
	time = float(data.time)
	for c in data.changed:
		W.type[int(c[0])] = int(c[1])
	for i in data.roads:
		W.road[int(i)] = 1
	for rr in data.ruins:
		W.ruin[int(rr[0])] = int(rr[1])
		W.ruin_lv[int(rr[0])] = int(rr[2])
	var rsd: Dictionary = data.research
	for k in rsd:
		research[k] = int(rsd[k])
	compute_mods()
	for e in data.buildings:
		var t: String = e[0]
		if not Defs.BUILDINGS.has(t):
			continue
		var b := add_building(t, int(e[1]), true, int(e[4]))
		b.level = clampi(int(e[2]), 1, Defs.max_level(t))
		b.max_hp = float(b.lv().hp) * mod.bhp
		b.hp = b.max_hp * float(e[3])
		b.build_left = float(e[5])
		b.upgrading = bool(e[6])
		b.build_total = build_time(t, b.level + (1 if b.upgrading else 0))
		if t == "hq":
			age = b.level - 1
	for k in Defs.RES:
		res[k] = float(data.res.get(k, 0.0))
	pop = int(data.pop)
	for s in Defs.SECTORS:
		assign[s] = int(data.assign.get(s, 0))
		cap[s] = int(data.cap.get(s, -1))
	var st: Dictionary = data.stats
	for k in st:
		stats[k] = int(st[k])
	victory = bool(data.victory)
	story_seen = data.get("story", {})
	wave = {"n": int(data.wave.n), "state": "prep", "timer": float(data.wave.timer), "elapsed": 0.0,
		"plan": combat.fix_plan(data.wave.plan), "queue": [], "current": int(data.wave.n) - 1, "total": 0}
	last_enemy_age = Defs.wave_age(wave.n)
	mode = "play"
	recompute_connectivity()
	for b in buildings:
		building_changed.emit(b)
	world_changed.emit()
	_econ_tick()
	age_changed.emit(age)
	return ""
