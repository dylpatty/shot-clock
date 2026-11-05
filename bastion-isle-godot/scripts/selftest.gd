class_name SelfTest
extends Node
## Headless self-test: `godot --headless --path . -- --selftest [--waves=N]`.
## Builds a town with the normal placement API, plays raids with a simple AI that keeps upgrading
## (it is given extra resources so every age is reached), prints a report per raid, round-trips a save,
## builds every model, then quits. Exit code 0 = pass.

var waves_to_run := 20
var step_dt := 0.1
var wave_t0 := 0.0
var failures: Array = []
var started := false
var finished := false
var lost_total := 0
var main_ref = null
var fair := false
var seed_arg := 7
var ai_t := 0.0

func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--waves="):
			waves_to_run = int(a.substr(8))
		if a == "--fair":
			fair = true
		if a.begins_with("--seed="):
			seed_arg = int(a.substr(7))
	G.selftest = true
	G.wave_ended.connect(_on_wave_end)
	G.game_over.connect(_on_over)
	print("=== Bastion Isle v3 self-test: %d raids%s ===" % [waves_to_run, " (fair AI, no cheats)" if fair else ""])
	G.new_game(seed_arg)
	var W := G.W
	var counts := [0, 0, 0, 0, 0, 0, 0]
	for i in W.count:
		counts[W.type[i]] += 1
	print("island: %d tiles, land %d, coast %d, landing %d, edge %d, islet %d" % [W.count, W.land.size(), W.coast.size(), W.landing.size(), W.edge.size(), W.islet])
	print("terrain counts (deep, shallow, sand, grass, forest, hills, mountain): ", counts)
	if fair:
		_fair_start()
	else:
		_initial_town()
	started = true

func _on_wave_end(r: Dictionary) -> void:
	var hq_pct := int(100.0 * G.hq.hp / G.hq.max_hp) if G.hq else 0
	lost_total += int(r.lost)
	print("raid %2d [%s] units %2d  kills %2d  lost %d  bounty+bonus %4d  HQ %3d%%  took %5.1fs  pop %3d  TH %d  bld %d" % [
		r.wave, Defs.AGES[r.age], r.total, r.kills, r.lost, r.gold, hq_pct, G.time - wave_t0, G.pop, G.th_level(), G.buildings.size()])
	if fair:
		var rs := ""
		for k in Defs.RES:
			rs += "%s %d (%+.0f)  " % [k, G.res[k], G.rates[k]]
		print("         t=%4.0fs  %s workers %s" % [G.time, rs, G.assign])

func _on_over(win: bool) -> void:
	if not win:
		print("GAME OVER: Town Hall destroyed on raid %d" % G.wave.current)
		if not fair or int(G.wave.current) < 8:
			failures.append("Town Hall destroyed on raid %d" % G.wave.current)

func _process(_delta: float) -> void:
	if not started or finished:
		return
	# simulate up to ~200 game seconds per frame
	for k in 2000:
		if G.mode != "play":
			break
		if fair:
			ai_t -= step_dt
			if ai_t <= 0.0:
				ai_t = 2.0
				_fair_ai()
		elif G.wave.state == "prep":
			_prep_ai()
			if G.wave.timer > 3.0 and G.wave.n > 1:
				G.wave.timer = 3.0
		G.step(step_dt)
		if G.wave.state == "active" and G.wave.elapsed <= step_dt * 1.5:
			wave_t0 = G.time
		if int(G.stats.waves) >= waves_to_run:
			break
	if int(G.stats.waves) >= waves_to_run or G.mode != "play" or G.time > 20000.0:
		_finish()

func _finish() -> void:
	finished = true
	print("simulated %.0f game seconds, kills %d, buildings lost %d, shots %d" % [G.time, G.stats.kills, G.stats.lost, G.stats.shots])
	if fair:
		print("fair AI result: survived %d of %d raids (Town Hall level %d)" % [G.stats.waves, waves_to_run, G.th_level()])
	if int(G.stats.waves) < waves_to_run and G.mode == "play":
		failures.append("only %d raids resolved" % G.stats.waves)
	# save / load round trip
	if G.mode == "play":
		var nb := G.buildings.size()
		var e := G.save_game()
		if e != "":
			failures.append("save failed: " + e)
		else:
			var e2 := G.load_game()
			if e2 != "":
				failures.append("load failed: " + e2)
			elif G.buildings.size() != nb:
				failures.append("load restored %d of %d buildings" % [G.buildings.size(), nb])
			else:
				print("save/load round trip OK (%d buildings)" % nb)
			G.delete_save()
	if main_ref and main_ref.has_method("selftest_visuals"):
		var vr: String = main_ref.selftest_visuals()
		if vr != "":
			failures.append(vr)
	if failures.is_empty():
		print("SELFTEST PASS")
		get_tree().quit(0)
	else:
		print("SELFTEST FAIL: ", failures)
		get_tree().quit(1)

# ------------------------------------------------------------------ AI helpers
func _cheat() -> void:
	# generous income so the test reaches every age; the test is about the systems, not balance
	var lv := G.th_level()
	for k in ["wood", "stone", "iron", "gold"]:
		G.res[k] = maxf(G.res[k], 400.0 * lv)
	G.res.food = maxf(G.res.food, 200.0)

func _connect(i: int) -> void:
	var W := G.W
	if W.road[i] != 0:
		return
	for d in 6:
		var j := W.nbr[i * 6 + d]
		if j >= 0 and (W.conn[j] != 0 or j == G.hq.tile):
			return
	var p := G.path.find(i, func(j, _f): return 1.0 if HexWorld.is_walkable(W.type[j]) and (W.bld[j] == 0 or j == G.hq.tile) else 0.0,
		func(j): return j == G.hq.tile or W.conn[j] != 0,
		func(j): return float(W.tile_dist(j, G.hq.tile)), 4000)
	for k in range(1, p.size()):
		var t: int = p[k]
		if t == G.hq.tile or W.conn[t] != 0:
			break
		if W.road[t] == 0 and W.bld[t] == 0:
			G.res.gold += 2
			G.try_road(t)
	G.recompute_connectivity()

func _place(type: String, prefer_coast: bool = false) -> bool:
	var W := G.W
	var best := -1
	var bs := INF
	var cands: Array = W.coast if prefer_coast else W.land
	for i in cands:
		if G.place_problem(type, i) != "":
			continue
		var s := float(W.tile_dist(i, G.hq.tile)) + HexWorld.hash2(i, type.length()) * 1.5
		if prefer_coast:
			s = HexWorld.hash2(i, G.count_type(type) + 3) * 10.0 + s * 0.3
		if s < bs:
			bs = s
			best = i
	if best < 0:
		return false
	var e := G.try_place(type, best, -1 if type == "dock" else randi() % 6)
	if e != "":
		return false
	if type != "wall":
		_connect(best)
	return true

func _initial_town() -> void:
	_cheat()
	for t in ["house", "house", "farm", "farm", "dock", "lumber", "quarry", "mine", "library", "library", "market", "house", "house", "barracks"]:
		if not _place(t):
			print("  (could not place %s)" % t)
	for k in 4:
		_place("tower", true)
	_place("artillery", true)
	for k in 6:
		_place("wall", true)
	G.auto_workers()
	print("initial town: %d buildings, pop %d / %d, jobs %s" % [G.buildings.size(), G.pop, G.housing, G.jobs])

func _prep_ai() -> void:
	_cheat()
	var W := G.W
	var n: int = G.wave.n
	# keep the Town Hall one step ahead of the raiders
	var want_th := mini(5, Defs.wave_age(n) + 1)
	if G.hq.level < want_th and G.hq.build_left <= 0.0:
		G.res.science = maxf(G.res.science, 2000.0)
		G.upgrade(G.hq)
		G.hq.build_left = 0.01
	for b in G.buildings.duplicate():
		if b.build_left <= 0.0 and G.upgrade_problem(b) == "":
			G.upgrade(b)
			b.build_left = minf(b.build_left, 0.05)
	for t in ["tower", "artillery", "aa", "barracks", "airfield", "house", "library"]:
		if G.lock_reason(t) == "" and G.count_type(t) < mini(G.limit_of(t), 6):
			_place(t, t != "house" and t != "library" and t != "barracks" and t != "airfield")
	for id in ["masonry", "ballistics", "optics", "drills", "radar", "shields"]:
		G.res.science = maxf(G.res.science, 800.0)
		G.buy_research(id)
	if n % 3 == 0:
		G.auto_workers()
	G.pop = maxi(G.pop, mini(G.housing, 400))

# ------------------------------------------------------------------ fair AI (no cheats): a rough model of a sensible player
func _fair_start() -> void:
	for t in ["house", "farm", "lumber", "house", "quarry", "library", "tower"]:
		_try(t)
	G.auto_workers()
	print("fair start: %d buildings, res %s" % [G.buildings.size(), G.res])

func _try(t: String, coast: bool = false) -> bool:
	if G.lock_reason(t) != "":
		return false
	if not G.can_afford(Defs.level_def(t, 1).cost):
		return false
	return _place(t, coast)

func _busy() -> int:
	var n := 0
	for b in G.buildings:
		if b.build_left > 0.0:
			n += 1
	return n

func _place_near(t: String, coast: bool) -> bool:
	## sensible placement: as close to the town as possible (defences on the nearest coast)
	var W := G.W
	var best := -1
	var bs := INF
	var cands: Array = W.coast if coast else W.land
	for i in cands:
		if G.place_problem(t, i) != "":
			continue
		var s := float(W.tile_dist(i, G.hq.tile)) + HexWorld.hash2(i, G.count_type(t) + 7) * (3.0 if coast else 1.0)
		if s < bs:
			bs = s
			best = i
	if best < 0:
		return false
	if G.try_place(t, best, -1 if t == "dock" else randi() % 6) != "":
		return false
	if t != "wall":
		_connect(best)
	return true

func _tryn(t: String, coast: bool = false) -> bool:
	if G.lock_reason(t) != "":
		return false
	if not G.can_afford(Defs.level_def(t, 1).cost):
		return false
	return _place_near(t, coast)

func _fair_ai() -> void:
	var lv := G.th_level()
	var n: int = G.wave.n
	var ea := Defs.wave_age(n)
	var th_cost := G.upgrade_cost(G.hq)
	if not th_cost.is_empty() and G.upgrade_problem(G.hq) == "" and lv - 1 <= ea:
		G.upgrade(G.hq)
		return
	var saving_for_th: bool = not th_cost.is_empty() and lv - 1 <= ea and G.res.science >= th_cost.get("science", 0) * 0.5
	# 1. food
	if G.rates.food < 3.0 or G.res.food < 20.0:
		if not _tryn("farm"):
			_tryn("dock", true)
	# 2. defence keeps pace with the raids
	if G.count_type("tower") < mini(G.limit_of("tower"), 3 + n / 2):
		_try_cover("tower", 6.0)
	if G.count_type("artillery") < mini(G.limit_of("artillery"), 1 + n / 3):
		_try_cover("artillery", 9.0)
	if G.count_type("barracks") < mini(G.limit_of("barracks"), 1 + n / 6):
		_tryn("barracks")
	if lv >= 3:
		if G.count_type("aa") < G.limit_of("aa"):
			_try_cover("aa", 10.0)
		if G.count_type("airfield") < 1:
			_tryn("airfield")
	# 3. science
	if G.count_type("library") < lv + 1:
		_tryn("library")
	# 4. jobs and homes
	if G.idle > 3:
		var stock := {"lumber": G.res.wood, "quarry": G.res.stone, "mine": G.res.iron * 1.5 + (0.0 if lv >= 2 else 200.0), "library": G.res.science}
		var order := ["lumber", "quarry", "mine", "library"]
		order.sort_custom(func(a, b): return stock[a] < stock[b])
		for t in order:
			if _tryn(t):
				break
	elif G.pop >= G.housing - 2 and G.idle <= 1:
		var up := false
		for b in G.buildings:
			if b.type == "house" and G.upgrade_problem(b) == "":
				G.upgrade(b)
				up = true
				break
		if not up:
			_tryn("house")
	if G.count_type("market") == 0 and G.count_type("house") >= 5:
		_tryn("market")
	# 5. upgrades: outdated weapons first
	if _busy() < 3 and not saving_for_th:
		var cands: Array = []
		for b in G.buildings:
			if b.type == "hq" or b.type == "wall" or G.upgrade_problem(b) != "":
				continue
			var pri := 4.0
			if not b.ws.is_empty() or b.type == "barracks" or b.type == "airfield":
				pri = 10.0 + float(ea - b.age()) * 5.0
			elif b.type == "library":
				pri = 8.0
			elif b.type == "farm" or b.type == "dock":
				pri = 7.0 if G.rates.food < 15.0 else 3.0
			cands.append([pri, b])
		cands.sort_custom(func(a, b): return a[0] > b[0])
		if cands.size():
			G.upgrade(cands[0][1])
	if not saving_for_th:
		for id in ["ballistics", "masonry", "printing", "crops", "tools", "beacons", "optics", "drills", "admin", "medicine", "radar", "automation", "firebrigade", "shields"]:
			if G.research_problem(id) == "" and G.res.science > 50:
				G.buy_research(id)
				break
	if int(G.time) % 20 == 0:
		G.auto_workers()

## put a defence where it protects the most buildings not yet covered by one of its kind
func _try_cover(t: String, rng: float) -> bool:
	if G.lock_reason(t) != "" or not G.can_afford(Defs.level_def(t, 1).cost):
		return false
	var W := G.W
	var guards: Array = []
	for b in G.buildings:
		if b.type == t:
			guards.append(b.pos)
	var best := -1
	var bs := -1.0
	for i in W.land:
		if G.place_problem(t, i) != "":
			continue
		var p := W.tpos(i)
		var sc := 0.0
		for b in G.buildings:
			if b.type == "wall":
				continue
			if Combat.flat_dist(b.pos, p) > rng:
				continue
			var covered := false
			for gp in guards:
				if Combat.flat_dist(gp, b.pos) <= rng:
					covered = true
					break
			if not covered:
				sc += 1.0
		sc += (0.5 if W.coast.has(i) else 0.0) - W.tile_dist(i, G.hq.tile) * 0.05
		if sc > bs:
			bs = sc
			best = i
	if best < 0 or G.try_place(t, best, randi() % 6) != "":
		return false
	_connect(best)
	return true
