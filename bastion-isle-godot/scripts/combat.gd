class_name Combat
extends RefCounted
## Raids: wave generation, ships with A* routes over water, landing parties, aircraft, towers, soldiers,
## fighters and projectiles. Reads and writes the state in the autoload G.

const GRAV := 6.0
const MUZZLE_Y := {"hq": 1.5, "tower": 1.45, "artillery": 0.55, "aa": 0.55}

var plan_budget := 3

func _can_plan() -> bool:
	if plan_budget <= 0:
		return false
	plan_budget -= 1
	return true

static func rnd(a: float, b: float) -> float:
	return randf_range(a, b)

static func ang_diff(a: float, b: float) -> float:
	return wrapf(a - b, -PI, PI)

static func flat_dist(a: Vector3, b: Vector3) -> float:
	return Vector2(a.x - b.x, a.z - b.z).length()

## Damage multiplier for a weapon of age `mine` against a target of age `theirs`
static func obsolescence(mine: int, theirs: int) -> float:
	var gap := theirs - mine
	return pow(0.6, gap) if gap > 0 else 1.0

# ------------------------------------------------------------------ waves
func gen_wave(n: int) -> Dictionary:
	var age := Defs.wave_age(n)
	var budget := 10.0 + 6.0 * n + 0.85 * n * n
	var units: Array = []
	if n % Defs.WAVES_PER_AGE == 0:
		units.append(Defs.BOSSES[age])
	if n >= 18:
		units.append("nuke_bomber")
		if n >= 20:
			units.append("nuke_bomber")
	var pool: Array = []
	var landers: Array = []
	for k in Defs.ENEMIES:
		var d: Dictionary = Defs.ENEMIES[k]
		if d.get("cost", 0) <= 0 or d.get("weight", 0.0) <= 0.0:
			continue
		if n < int(d.get("min_wave", 1)):
			continue
		if d.age == age:
			pool.append([k, d.weight])
			if d.role == "lander":
				landers.append(k)
		elif d.age == age - 1:
			pool.append([k, d.weight * 0.35])
	# every raid brings at least one landing party so soldiers and towers matter
	if landers.size():
		var l: String = landers[0]
		units.append(l)
		budget -= Defs.ENEMIES[l].cost
	while budget >= 6.0:
		var opts: Array = []
		var sum := 0.0
		for p in pool:
			if Defs.ENEMIES[p[0]].cost <= budget:
				opts.append(p)
				sum += p[1]
		if opts.is_empty():
			break
		var r := randf() * sum
		var pick: String = opts[0][0]
		for p in opts:
			r -= p[1]
			if r <= 0.0:
				pick = p[0]
				break
		units.append(pick)
		budget -= Defs.ENEMIES[pick].cost
	var nd := 1 if n < 3 else (2 if n < 9 else 3)
	var dirs: Array = []
	var base := randf() * TAU
	for i in nd:
		dirs.append(base + i * TAU / nd + rnd(-0.5, 0.5))
	units.shuffle()
	var t := 0.0
	var queue: Array = []
	var k2 := 0
	for ty in units:
		t += rnd(0.6, 1.8) * (1.4 if Defs.ENEMIES[ty].domain == "air" else 1.0)
		var dt_extra := 6.0 if Defs.ENEMIES[ty].get("nuke", false) else 0.0
		queue.append({"t": t + dt_extra, "type": ty, "dir": float(dirs[k2 % nd]) + rnd(-0.22, 0.22)})
		k2 += 1
	queue.sort_custom(func(a, b): return a.t < b.t)
	var counts := {}
	for u in units:
		counts[u] = counts.get(u, 0) + 1
	return {"n": n, "queue": queue, "dirs": dirs, "counts": counts, "age": age}

## JSON turns numbers into floats; make a loaded plan usable again
func fix_plan(p) -> Dictionary:
	if typeof(p) != TYPE_DICTIONARY or not p.has("queue"):
		return gen_wave(int(G.wave.get("n", 1)))
	var o: Dictionary = p.duplicate(true)
	o.n = int(o.n)
	o.age = int(o.get("age", Defs.wave_age(o.n)))
	var c := {}
	for k in o.counts:
		c[k] = int(o.counts[k])
	o.counts = c
	return o

static func hp_mul(n: int) -> float:
	return 1.0 + 0.04 * (n - 1)

static func dmg_mul(n: int) -> float:
	return 1.0 + 0.03 * (n - 1)

func update_wave(dt: float) -> void:
	var w: Dictionary = G.wave
	if w.state == "prep":
		w.timer -= dt
		if w.timer <= 0.0:
			start_wave()
	else:
		w.elapsed += dt
		while w.queue.size() and w.queue[0].t <= w.elapsed:
			var qd: Dictionary = w.queue.pop_front()
			spawn_enemy(qd.type, qd.dir, w.current)
			w.last_spawn = w.elapsed
		if w.queue.is_empty():
			var alive := 0
			for e in G.enemies:
				if e.team == "E" and not e.gone:
					alive += 1
			if alive > 0 and w.elapsed > w.get("last_spawn", 0.0) + 150.0:
				if G.selftest:
					var left := {}
					for e in G.enemies:
						if e.team == "E" and not e.gone:
							var k: String = "%s/%s/%s" % [e.type, e.state, "path" if e.path.size() else "nopath"]
							if e.domain == "sea":
								var tg = e.target
								k += " pi %d/%d tgt %s d %.1f idle %.0f tile %d" % [e.pi, e.path.size(), tg.type if tg != null else "-", flat_dist(tg.pos, e.pos) if tg != null else -1.0, e.idle_t, G.W.type[G.W.tile_at(e.pos.x, e.pos.z)]]
							left[k] = left.get(k, 0) + 1
					print("  withdraw: ", left)
				for e in G.enemies:
					if e.team == "E":
						e.gone = true
				G.notify("The last raiders have withdrawn.", "good")
				alive = 0
			if alive == 0:
				end_wave()

func start_wave() -> void:
	var w: Dictionary = G.wave
	w.state = "active"
	w.current = w.n
	w.elapsed = 0.0
	w.last_spawn = 0.0
	w.queue = w.plan.queue.duplicate(true)
	w.total = w.queue.size()
	w.kills = 0
	w.lost = 0
	w.gold0 = G.res.gold
	w.hq0 = G.hq.hp / G.hq.max_hp if G.hq else 1.0
	G.notify("Raid %d is here! %s" % [w.current, describe_dirs(w.plan.dirs)], "alert")
	G.sfx.emit("alarm", Vector3.ZERO)
	G.wave_started.emit(w.current)

func end_wave() -> void:
	var w: Dictionary = G.wave
	var bonus := 30 + 12 * int(w.current)
	G.res.gold += bonus
	G.stats.waves = w.current
	var report := {"wave": w.current, "kills": w.get("kills", 0), "lost": w.get("lost", 0), "bonus": bonus,
		"gold": int(G.res.gold - w.get("gold0", G.res.gold)), "total": w.get("total", 0), "age": Defs.wave_age(w.current)}
	G.notify("Raid %d repelled. +%d gold" % [w.current, bonus], "good")
	G.sfx.emit("victory", Vector3.ZERO)
	w.n = int(w.current) + 1
	w.state = "prep"
	w.timer = Defs.WAVE_GAP + G.mod.prep
	w.plan = gen_wave(w.n)
	G.projectiles.clear()
	G.wave_ended.emit(report)
	if int(w.current) == Defs.VICTORY_WAVE and not G.victory:
		G.end_game(true)
	if not G.selftest:
		G.save_game()

const COMPASS := ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"]

static func compass(angle: float) -> String:
	# angle measured from +z towards +x; the camera starts looking towards -z, so -z is north
	var a := fposmod(atan2(sin(angle), -cos(angle)) / TAU * 8.0 + 8.5, 8.0)
	return COMPASS[int(a) % 8]

static func describe_dirs(dirs: Array) -> String:
	var names: Array = []
	for d in dirs:
		var c := compass(d)
		if not names.has(c):
			names.append(c)
	var s := ", ".join(names)
	return "Incoming from the %s." % s

# ------------------------------------------------------------------ spawning
func _edge_tile_near(angle: float) -> int:
	var W: HexWorld = G.W
	var best: int = W.edge[0]
	var bd := 9.0
	for i in W.edge:
		var d := absf(ang_diff(atan2(W.x[i], W.z[i]), angle))
		if d < bd:
			bd = d
			best = i
	return best

func _base_unit(type: String, def: Dictionary, team: String) -> Unit:
	var u := Unit.new()
	u.type = type
	u.def = def
	u.team = team
	u.domain = def.get("domain", "ground")
	u.role = def.get("role", "")
	u.hp = float(def.hp)
	u.max_hp = u.hp
	u.age = int(def.get("age", 0))
	u.cool = rnd(0.5, 2.0)
	u.think = rnd(0.0, 0.5)
	u.phase = rnd(0.0, TAU)
	u.ox = rnd(-0.3, 0.3)
	u.oz = rnd(-0.3, 0.3)
	return u

func spawn_enemy(type: String, angle: float, wave_n: int) -> Unit:
	var def: Dictionary = Defs.ENEMIES[type]
	var e := _base_unit(type, def, "E")
	e.hp = float(def.hp) * hp_mul(wave_n)
	e.max_hp = e.hp
	e.dm = dmg_mul(wave_n)
	e.wave = wave_n
	var W: HexWorld = G.W
	if e.domain == "sea":
		var t := _edge_tile_near(angle)
		e.pos = Vector3(W.x[t], 0.0, W.z[t])
		e.yaw = atan2(-e.pos.x, -e.pos.z)
		if def.has("troops"):
			e.troops = int(def.troops) + (wave_n - 1) / 6
		e.launch_t = 8.0
		e.ammo = 28 + (60 if def.get("boss", false) else 0)
	else:
		var rr := 52.0
		e.alt = float(def.alt) + rnd(0.0, 1.5)
		e.pos = Vector3(sin(angle) * rr, e.alt, cos(angle) * rr)
		e.yaw = angle + PI
		e.bombs = int(def.get("bombs", 0))
		e.rockets = int(def.get("rockets", 0))
		if e.role == "bomber":
			var aim = _nuke_target() if def.get("nuke", false) else _pick_air_target(e)
			var ap := Vector3.ZERO
			if aim != null:
				ap = aim.pos
			var ax := ap.x + (0.0 if def.get("nuke", false) else rnd(-2.5, 2.5))
			var az := ap.z + (0.0 if def.get("nuke", false) else rnd(-2.5, 2.5))
			var dv := Vector2(ax - e.pos.x, az - e.pos.z).normalized()
			e.wp = Vector2(ax, az)
			e.exitp = Vector2(ax, az) + dv * 90.0
			e.gcool = 0.0
		G.sfx.emit("plane", e.pos)
	G.enemies.append(e)
	G.unit_added.emit(e)
	return e

func spawn_infantry(type: String, p: Vector3, wave_n: int) -> void:
	var def: Dictionary = Defs.ENEMIES[type]
	var e := _base_unit(type, def, "E")
	e.hp = float(def.hp) * hp_mul(wave_n)
	e.max_hp = e.hp
	e.dm = dmg_mul(wave_n)
	e.wave = wave_n
	e.pos = Vector3(p.x + rnd(-0.35, 0.35), 0.0, p.z + rnd(-0.35, 0.35))
	e.pos.y = G.W.ground_y(e.pos.x, e.pos.z)
	e.yaw = atan2(-e.pos.x, -e.pos.z)
	G.enemies.append(e)
	G.unit_added.emit(e)

func _spawn_soldier(home: Bld) -> void:
	var key: String = home.lv().soldier
	var def: Dictionary = Defs.ALLIES[key]
	var s := _base_unit(key, def, "A")
	s.domain = "ground"
	s.role = "soldier"
	s.hp = float(def.hp) * G.mod.soldier
	s.max_hp = s.hp
	s.home = home
	var a := rnd(0.0, TAU)
	s.post = Vector2(home.pos.x + cos(a) * rnd(0.9, 1.6), home.pos.z + sin(a) * rnd(0.9, 1.6))
	s.pos = home.pos
	home.units.append(s)
	G.allies.append(s)
	G.unit_added.emit(s)
	G.emit_fx("dust", s.pos, 0.4)

func _spawn_fighter(home: Bld, slot: int) -> void:
	var key: String = home.lv().plane
	var def: Dictionary = Defs.ALLIES[key]
	var f := _base_unit(key, def, "A")
	f.domain = "air"
	f.role = "fighter"
	f.home = home
	f.slot = slot
	f.alt = 4.5
	f.state = "parked"
	_park(f)
	home.units.append(f)
	G.allies.append(f)
	G.unit_added.emit(f)

func _park(f: Unit) -> void:
	var h: Bld = f.home
	var yw := h.yaw()
	var off := -0.45 + f.slot * 0.32
	var fwd := Vector3(sin(yw), 0, cos(yw))
	var side := Vector3(cos(yw), 0, -sin(yw))
	f.pos = h.pos + side * 0.32 + fwd * off + Vector3(0, 0.08, 0)
	f.yaw = yw
	f.bank = 0.0
	f.pitch = 0.0
	f.speed = 0.0
	f.vel = Vector3.ZERO

## After a barracks or airfield upgrade its units are re-equipped
func refit_units(b: Bld) -> void:
	for u in b.units.duplicate():
		if not u.alive:
			continue
		var key: String = b.lv().get("soldier", b.lv().get("plane", ""))
		if key == "" or key == u.type:
			continue
		var frac: float = u.hp / u.max_hp
		G.unit_removed.emit(u)
		u.type = key
		u.def = Defs.ALLIES[key]
		u.age = int(u.def.age)
		u.max_hp = float(u.def.hp) * (G.mod.soldier if u.role == "soldier" else 1.0)
		u.hp = u.max_hp * frac
		G.unit_added.emit(u)

# ------------------------------------------------------------------ damage
func damage_enemy(e: Unit, dmg: float, src = null) -> void:
	if not e.alive:
		return
	e.hp -= dmg
	e.hit_t = 0.12
	if e.hp > 0.0:
		return
	e.hp = 0.0
	e.alive = false
	if e.team == "E":
		G.stats.kills += 1
		G.wave.kills = G.wave.get("kills", 0) + 1
		var gold := roundi(float(e.def.get("bounty", 0)) * (1.0 + 0.03 * e.wave))
		G.res.gold += gold
		if src != null and src is Bld:
			src.kills += 1
	if e.domain == "sea":
		e.dying = 4.0
		var r: float = e.def.get("radius", 0.6)
		G.emit_fx("explosion_water", e.pos + Vector3(0, 0.3, 0), r * 1.3)
		G.sfx.emit("boom_big", e.pos)
	elif e.domain == "air":
		e.dying = 6.0
		e.vel.y = 0.0
		G.emit_fx("explosion", e.pos, 0.7)
		G.sfx.emit("boom", e.pos)
	else:
		e.dying = 0.01
		G.emit_fx("dust", e.pos, 0.5)
	if e.team == "A" and e.home != null:
		e.home.units.erase(e)
		if e.role == "fighter":
			e.home.respawn.append(G.time + 22.0)

func _splash_buildings(p: Vector3, r: float, dmg: float, explosive: bool) -> void:
	var r2 := r * r
	for k in range(G.buildings.size() - 1, -1, -1):
		if k >= G.buildings.size():
			continue
		var b: Bld = G.buildings[k]
		var d2 := Vector2(b.pos.x - p.x, b.pos.z - p.z).length_squared()
		if d2 > r2 + 0.5:
			continue
		var f := 1.0 - 0.5 * minf(1.0, sqrt(d2) / (r + 0.7))
		G.damage_building(b, dmg * f, explosive)
	for a in G.allies:
		if not a.alive or a.domain != "ground":
			continue
		if Vector2(a.pos.x - p.x, a.pos.z - p.z).length_squared() <= r2:
			damage_enemy(a, dmg * 0.5)

func _splash_enemies(p: Vector3, r: float, dmg: float, hits: Dictionary, src, src_age: int) -> void:
	for e in G.enemies:
		if not e.alive:
			continue
		var m: float = hits.get(e.domain, 0.0)
		if m <= 0.0:
			continue
		var er: float = e.def.get("radius", 0.4)
		var dv: Vector3 = e.pos - p
		if e.domain != "air":
			dv.y = 0.0
		var d := dv.length()
		if d > r + er:
			continue
		var f := 1.0 - 0.5 * minf(1.0, d / (r + er))
		damage_enemy(e, dmg * m * f * obsolescence(src_age, e.age), src)

# ------------------------------------------------------------------ projectiles
func tracer(s: Vector3, e: Vector3, enemy: bool = false, col: int = 0) -> void:
	G.projectiles.append({"kind": "tracer", "s": s, "e": e, "p": s, "t": 0.0, "T": 0.09, "enemy": enemy, "col": col})

func _arc(kind: String, s: Vector3, target_xz: Vector3, dmg: float, splash: float, team: String, hits: Dictionary, src, src_age: int, spd: float = 16.0) -> void:
	var W: HexWorld = G.W
	var dist := flat_dist(s, target_xz)
	var ti := W.tile_at(target_xz.x, target_xz.z)
	var ey := W.h[ti] if ti >= 0 and HexWorld.is_land(W.type[ti]) else 0.0
	var apex := 0.5 + dist * (0.16 if kind != "arrow" else 0.08)
	G.projectiles.append({"kind": kind, "s": s, "e": Vector3(target_xz.x, ey, target_xz.z), "p": s, "t": 0.0,
		"T": 0.35 + dist / spd, "apex": apex, "dmg": dmg, "splash": splash, "team": team, "hits": hits,
		"src": src, "age": src_age, "water": ey == 0.0, "vel": Vector3.ZERO})

func _update_projectiles(dt: float) -> void:
	var P: Array = G.projectiles
	var i := P.size() - 1
	while i >= 0:
		var p: Dictionary = P[i]
		var done := false
		var kind: String = p.kind
		if kind == "tracer":
			p.t += dt
			done = p.t >= p.T
		elif kind == "shell" or kind == "stone" or kind == "arrow" or kind == "bolt":
			p.t += dt
			var k: float = minf(1.0, p.t / p.T)
			var prev: Vector3 = p.p
			var np: Vector3 = p.s.lerp(p.e, k)
			np.y += p.apex * 4.0 * k * (1.0 - k)
			p.p = np
			p.vel = (np - prev) / maxf(dt, 0.0001)
			if k >= 1.0:
				done = true
				if p.team == "P":
					_splash_enemies(np, p.splash, p.dmg, p.hits, p.src, p.age)
				else:
					_splash_buildings(np, p.splash, p.dmg, false)
				if kind == "arrow" or kind == "bolt":
					G.emit_fx("splash_small" if p.water else "dust", np, 0.25)
				else:
					G.emit_fx("explosion_water" if p.water else "explosion", np, 0.45 + p.splash * 0.3)
					G.sfx.emit("splash" if p.water else "boom", np)
		elif kind == "flak":
			p.t += dt
			var k2: float = minf(1.0, p.t / p.T)
			p.p = p.s.lerp(p.e, k2)
			if k2 >= 1.0:
				done = true
				_splash_enemies(p.p, p.splash, p.dmg, {"air": 1.0}, p.src, p.age)
				G.emit_fx("flak", p.p, 0.6 + p.splash * 0.2)
				G.sfx.emit("flak", p.p)
		elif kind == "bomb" or kind == "nuke":
			p.vel.y -= GRAV * dt
			p.p += p.vel * dt
			var gy: float = G.W.ground_y(p.p.x, p.p.z)
			if p.p.y <= gy:
				done = true
				var hitp := Vector3(p.p.x, gy, p.p.z)
				_splash_buildings(hitp, p.splash, p.dmg, true)
				if kind == "nuke":
					G.emit_fx("nuke", hitp, p.splash)
					G.sfx.emit("nuke", hitp)
					G.notify("A nuclear bomb has struck Bastion!", "bad")
				else:
					G.emit_fx("explosion_water" if gy == 0.0 else "explosion", hitp, 0.9)
					G.sfx.emit("boom", hitp)
		elif kind == "rocket":
			p.t += dt
			var k3: float = minf(1.0, p.t / p.T)
			var prev3: Vector3 = p.p
			p.p = p.s.lerp(p.e, k3)
			p.vel = (p.p - prev3) / maxf(dt, 0.0001)
			p.trail = p.get("trail", 0.0) - dt
			if p.trail <= 0.0:
				p.trail = 0.03
				G.emit_fx("trail", p.p, 0.8)
			if k3 >= 1.0:
				done = true
				_splash_buildings(p.p, p.splash, p.dmg, true)
				G.emit_fx("explosion_water" if p.e.y == 0.0 else "explosion", p.p, 0.8)
				G.sfx.emit("boom", p.p)
		elif kind == "missile":
			p.t += dt
			var tg = p.target
			if tg == null or not tg.alive:
				p.target = null
				var best = null
				var bd := 64.0
				for e in G.enemies:
					if not e.alive or p.hits.get(e.domain, 0.0) <= 0.0:
						continue
					var d2: float = (e.pos - p.p).length_squared()
					if d2 < bd:
						bd = d2
						best = e
				p.target = best
			var spd := 15.0
			if p.target != null:
				var t: Unit = p.target
				var tp: Vector3 = t.pos if t.domain == "air" else t.pos + Vector3(0, 0.3, 0)
				var dv: Vector3 = tp - p.p
				var l := dv.length()
				if l < 0.7:
					done = true
					damage_enemy(t, p.dmg * p.hits.get(t.domain, 1.0) * obsolescence(p.age, t.age), p.src)
					_splash_enemies(p.p, p.splash, p.dmg * 0.4, p.hits, p.src, p.age)
					G.emit_fx("explosion_water" if t.domain == "sea" else "explosion", p.p, 0.8)
					G.sfx.emit("boom", p.p)
				else:
					var steer := minf(1.0, dt * (2.0 if p.t < 0.35 else 7.0))
					p.vel += (dv / l * spd - p.vel) * steer
			if not done:
				p.vel = p.vel.normalized() * spd
				p.p += p.vel * dt
				p.trail = p.get("trail", 0.0) - dt
				if p.trail <= 0.0:
					p.trail = 0.02
					G.emit_fx("trail", p.p, 1.0)
				if p.t > 5.0 or p.p.y < G.W.ground_y(p.p.x, p.p.z) - 0.1:
					done = true
					G.emit_fx("explosion", Vector3(p.p.x, maxf(p.p.y, 0.0), p.p.z), 0.5)
		if done:
			P[i] = P[P.size() - 1]
			P.pop_back()
		i -= 1

# ------------------------------------------------------------------ towers
func _acquire(b: Bld, rng: float, targets: Dictionary) -> Unit:
	var best: Unit = null
	var bs := INF
	var r2 := rng * rng
	for e in G.enemies:
		if not e.alive:
			continue
		var m: float = targets.get(e.domain, 0.0)
		if m <= 0.0:
			continue
		var d2 := Vector2(e.pos.x - b.pos.x, e.pos.z - b.pos.z).length_squared()
		if d2 > r2:
			continue
		var s := d2 / m
		if s < bs:
			bs = s
			best = e
	return best

func _muzzle(b: Bld) -> Vector3:
	var y: float = MUZZLE_Y.get(b.type, 0.6)
	if b.type == "tower":
		y = [1.45, 1.35, 1.35, 0.75, 1.05][b.level - 1]
	elif b.type == "hq":
		y = [1.7, 1.9, 2.0, 2.6, 3.2][b.level - 1]
	var fwd := Vector3(sin(b.head_yaw), 0, cos(b.head_yaw))
	return b.pos + Vector3(0, y, 0) + fwd * (0.35 if b.type != "hq" else 0.0)

func _fire(b: Bld, t: Unit, ws: Dictionary, w: Dictionary) -> void:
	var m := _muzzle(b)
	var dist := flat_dist(t.pos, b.pos)
	var my_age := b.age()
	var obs := obsolescence(my_age, t.age)
	var tm: float = w.targets.get(t.domain, 0.0)
	G.stats.shots += 1
	var kind: String = w.kind
	var aim_y := t.pos.y + (0.2 if t.domain != "air" else 0.0)
	var tp := Vector3(t.pos.x, aim_y, t.pos.z)
	match kind:
		"arrow":
			var lead := t.pos + t.vel * (0.35 + dist / 14.0)
			_arc("arrow", m, lead, ws.dmg * tm, 0.35, "P", w.targets, b, my_age, 14.0)
			G.sfx.emit("arrow", b.pos)
		"musket", "mg":
			var acc: float = w.get("acc", 0.8) * (0.75 if t.domain == "air" else 1.0)
			var hit := randf() < acc
			var spread := 0.1 if hit else 0.6
			tracer(m, tp + Vector3(rnd(-spread, spread), rnd(-spread, spread) * 0.5, rnd(-spread, spread)), false, 1 if kind == "musket" else 0)
			if hit:
				damage_enemy(t, ws.dmg * tm * obs, b)
			if kind == "musket":
				G.emit_fx("musket_smoke", m, 0.5)
				G.sfx.emit("musket", b.pos)
			else:
				if randf() < 0.5:
					G.emit_fx("muzzle", m, 0.6)
				G.sfx.emit("mg", b.pos)
		"laser":
			G.beam.emit(m, tp, Color(0.4, 1.0, 1.0) if b.type != "aa" else Color(1.0, 0.4, 0.9), 0.06)
			damage_enemy(t, ws.dmg * tm * obs, b)
			G.emit_fx("spark", tp, 0.5)
			G.sfx.emit("laser", b.pos)
		"rail":
			G.beam.emit(m, tp, Color(0.5, 0.8, 1.0), 0.16)
			damage_enemy(t, ws.dmg * tm * obs, b)
			_splash_enemies(tp, ws.splash, ws.dmg * 0.4, w.targets, b, my_age)
			G.emit_fx("explosion_water" if t.domain == "sea" else "explosion", tp, 0.9)
			G.sfx.emit("rail", b.pos)
		"shell", "stone":
			var tt := 0.35 + dist / 16.0
			var sc := 0.25 + dist * 0.03
			var px := t.pos + t.vel * tt + Vector3(rnd(-sc, sc), 0, rnd(-sc, sc))
			_arc(kind, m, px, ws.dmg, ws.splash, "P", w.targets, b, my_age)
			G.emit_fx("muzzle", m, 1.6 if kind == "shell" else 0.0)
			if kind == "shell":
				G.emit_fx("musket_smoke", m, 1.0)
			G.sfx.emit("cannon" if kind == "shell" else "catapult", b.pos)
		"flak":
			var tt2 := (t.pos - m).length() / 28.0
			var pp := t.pos + t.vel * tt2
			tt2 = (pp - m).length() / 28.0
			var s := 0.55
			var ep := t.pos + t.vel * tt2 + Vector3(rnd(-s, s), rnd(-s, s), rnd(-s, s))
			G.projectiles.append({"kind": "flak", "s": m, "e": ep, "p": m, "t": 0.0, "T": tt2, "dmg": ws.dmg * obs, "splash": ws.splash, "src": b, "age": my_age})
			G.emit_fx("muzzle", m, 1.1)
			G.sfx.emit("flak", b.pos)
		"missile":
			var v0 := Vector3(sin(b.head_yaw) * 6.0, 8.0, cos(b.head_yaw) * 6.0)
			G.projectiles.append({"kind": "missile", "p": m, "vel": v0, "t": 0.0, "target": t, "dmg": ws.dmg, "splash": ws.splash, "hits": w.targets, "src": b, "age": my_age})
			G.emit_fx("muzzle", m, 1.3)
			G.sfx.emit("missile", b.pos)

func _update_weapon(b: Bld, dt: float) -> void:
	var w: Dictionary = b.lv().weapon
	var ws: Dictionary = b.ws
	if not b.connected or ws.is_empty() or not b.working():
		b.target = null
		b.head_yaw += dt * 0.1
		return
	b.cool -= dt
	b.scan -= dt
	var t = b.target
	if t != null and (not t.alive or Vector2(t.pos.x - b.pos.x, t.pos.z - b.pos.z).length_squared() > ws.range * ws.range):
		t = null
		b.target = null
	if t == null and b.scan <= 0.0:
		b.scan = 0.12 + randf() * 0.1
		t = _acquire(b, ws.range, w.targets)
		b.target = t
	if t != null:
		var diff := ang_diff(atan2(t.pos.x - b.pos.x, t.pos.z - b.pos.z), b.head_yaw)
		var k: String = w.kind
		var turn := (10.0 if k == "mg" or k == "laser" or k == "musket" or k == "arrow" else (5.0 if k == "flak" else 3.2)) * dt
		b.head_yaw += clampf(diff, -turn, turn)
		if b.cool <= 0.0 and absf(diff) < w.get("aim", 0.6):
			_fire(b, t, ws, w)
			b.cool = maxf(b.cool, -0.05) + 1.0 / ws.rate
	else:
		b.head_yaw += dt * 0.25
		if b.cool < 0.0:
			b.cool = 0.0

func barracks_cap(b: Bld) -> int:
	return maxi(1, int(ceil(float(b.lv().units) * G.staff.military)))

func fighter_cap(b: Bld) -> int:
	return maxi(1, int(ceil(float(b.lv().units) * G.staff.military)))

func _update_buildings(dt: float) -> void:
	for k in range(G.buildings.size() - 1, -1, -1):
		if k >= G.buildings.size():
			continue
		var b: Bld = G.buildings[k]
		if b.flash > 0.0:
			b.flash = maxf(0.0, b.flash - dt * 5.0)
		if b.hp < b.max_hp and b.connected and G.time - b.last_hit > G.mod.repair_delay:
			b.hp = minf(b.max_hp, b.hp + b.max_hp * 0.015 * G.mod.repair * dt)
		if b.hp < b.max_hp * 0.55:
			b.burn_t -= dt
			if b.burn_t <= 0.0:
				b.burn_t = 0.22 + randf() * 0.2
				G.emit_fx("smoke", b.pos + Vector3(rnd(-0.3, 0.3), 0.5, rnd(-0.3, 0.3)), 0.8)
				if b.hp < b.max_hp * 0.3:
					G.emit_fx("fire", b.pos + Vector3(rnd(-0.3, 0.3), 0.3, rnd(-0.3, 0.3)), 0.8)
		if not b.working():
			continue
		if b.type == "barracks":
			if b.connected and b.units.size() < barracks_cap(b):
				b.train_t += dt * maxf(0.3, G.staff.military) * G.mod.train
				if b.train_t >= 9.0:
					b.train_t = 0.0
					_spawn_soldier(b)
		elif b.type == "airfield":
			if b.connected:
				while b.respawn.size() and b.respawn[0] <= G.time:
					b.respawn.pop_front()
				if b.units.size() + b.respawn.size() < fighter_cap(b):
					var used := {}
					for u in b.units:
						used[u.slot] = true
					var slot := 0
					while used.has(slot):
						slot += 1
					_spawn_fighter(b, slot)
		if not b.ws.is_empty():
			_update_weapon(b, dt)

# ------------------------------------------------------------------ enemies
func _nearest_building(p: Vector3, filter: Callable = Callable()) -> Bld:
	var best: Bld = null
	var bd := INF
	for b in G.buildings:
		if not b.alive:
			continue
		if filter.is_valid() and not filter.call(b):
			continue
		var d := Vector2(b.pos.x - p.x, b.pos.z - p.z).length_squared()
		if d < bd:
			bd = d
			best = b
	return best

func _sea_cost(j: int, _from: int) -> float:
	return 1.0 if G.W.sea_ok(j) else 0.0

func _land_cost_enemy(j: int, _from: int) -> float:
	var W: HexWorld = G.W
	var t: int = W.type[j]
	if not HexWorld.is_walkable(t):
		return 0.0
	if W.bld[j] != 0:
		var b: Bld = G.by_id.get(W.bld[j])
		if b != null and b.type == "wall":
			return 7.0 + b.hp / 200.0
	if W.road[j] != 0:
		return 0.8
	return 1.5 if t == Defs.FOREST else (2.0 if t == Defs.HILLS else 1.0)

func _land_cost_ally(j: int, _from: int) -> float:
	var W: HexWorld = G.W
	var t: int = W.type[j]
	if not HexWorld.is_walkable(t):
		return 0.0
	if W.road[j] != 0:
		return 0.8
	return 1.5 if t == Defs.FOREST else (2.0 if t == Defs.HILLS else 1.0)

func _start_tile(u: Unit, water: bool) -> int:
	var W: HexWorld = G.W
	var i := W.tile_at(u.pos.x, u.pos.z)
	if i >= 0 and (W.sea_ok(i) if water else HexWorld.is_walkable(W.type[i])):
		return i
	if i < 0:
		return -1
	var best := -1
	var bd := INF
	for d in 6:
		var j := W.nbr[i * 6 + d]
		if j < 0:
			continue
		if W.sea_ok(j) if water else HexWorld.is_walkable(W.type[j]):
			var dd := Vector2(W.x[j] - u.pos.x, W.z[j] - u.pos.z).length_squared()
			if dd < bd:
				bd = dd
				best = j
	return best

func _sea_path_to(u: Unit, goal: Callable, heur: Callable) -> PackedInt32Array:
	return G.path.find(_start_tile(u, true), _sea_cost, goal, heur)

func _plan_ship_attack(e: Unit) -> bool:
	var W: HexWorld = G.W
	var tried := {}
	var rr: float = float(e.def.range) * 0.85
	for attempt in 4:
		var target := _nearest_building(e.pos, func(b): return not tried.has(b.id))
		if target == null:
			return false
		tried[target.id] = true
		var tx := target.pos.x
		var tz := target.pos.z
		var reachable := false
		for i in W.shore:
			if (W.x[i] - tx) * (W.x[i] - tx) + (W.z[i] - tz) * (W.z[i] - tz) <= rr * rr:
				reachable = true
				break
		if not reachable:
			continue
		var p := _sea_path_to(e, func(j): return Vector2(W.x[j] - tx, W.z[j] - tz).length() <= rr,
			func(j): return maxf(0.0, Vector2(W.x[j] - tx, W.z[j] - tz).length() - rr) / 1.732)
		if p.size():
			e.target = target
			e.path = p
			e.pi = 1
			e.idle_t = 0.0
			return true
	var tg := _nearest_building(e.pos)
	if tg == null:
		return false
	var best := -1
	var bd := INF
	for i in W.shore:
		var d := Vector2(W.x[i] - tg.pos.x, W.z[i] - tg.pos.z).length_squared()
		if d < bd and W.sea_ok(i):
			bd = d
			best = i
	if best < 0:
		return false
	var p2 := _sea_path_to(e, func(j): return j == best, func(j): return Vector2(W.x[j] - W.x[best], W.z[j] - W.z[best]).length() / 1.732)
	if p2.is_empty():
		return false
	e.target = tg
	e.path = p2
	e.pi = 1
	e.idle_t = 0.0
	return true

func _plan_landing(e: Unit) -> bool:
	var W: HexWorld = G.W
	var hp := G.hq.pos if G.hq else Vector3.ZERO
	var best := -1
	var bs := INF
	var landt := -1
	for i in W.landing:
		var lt := -1
		var ld := INF
		for d in 6:
			var j := W.nbr[i * 6 + d]
			if j >= 0 and HexWorld.is_walkable(W.type[j]):
				var dd := Vector2(W.x[j] - hp.x, W.z[j] - hp.z).length()
				if dd < ld:
					ld = dd
					lt = j
		if lt < 0:
			continue
		var s := Vector2(W.x[i] - e.pos.x, W.z[i] - e.pos.z).length() + 0.7 * ld + randf() * 6.0
		if s < bs:
			bs = s
			best = i
			landt = lt
	if best < 0:
		return false
	var p := _sea_path_to(e, func(j): return j == best, func(j): return Vector2(W.x[j] - W.x[best], W.z[j] - W.z[best]).length() / 1.732)
	if p.is_empty():
		return false
	e.path = p
	e.pi = 1
	e.land_tile = landt
	return true

func _plan_exit(e: Unit) -> void:
	var W: HexWorld = G.W
	var R := W.R
	e.path = _sea_path_to(e, func(j): return HexWorld.hex_dist(W.q[j], W.r[j], 0, 0) >= R,
		func(j): return float(R - HexWorld.hex_dist(W.q[j], W.r[j], 0, 0)))
	e.pi = 1

func _follow_sea_path(e: Unit, dt: float) -> bool:
	var W: HexWorld = G.W
	var d: Dictionary = e.def
	if e.path.is_empty() or e.pi >= e.path.size():
		e.vel *= 0.95
		e.pos += e.vel * dt
		return true
	# a big ship circling a waypoint it cannot turn into: skip ahead
	e.block_t += dt
	if e.block_t > 9.0 and e.pi < e.path.size() - 1:
		e.pi += 1
		e.block_t = 0.0
	var t: int = e.path[e.pi]
	var dx: float = W.x[t] - e.pos.x
	var dz: float = W.z[t] - e.pos.z
	var dist := sqrt(dx * dx + dz * dz)
	var last := e.pi == e.path.size() - 1
	if dist < (0.4 if last else 1.0):
		e.pi += 1
		e.block_t = 0.0
		return e.pi >= e.path.size()
	var diff := ang_diff(atan2(dx, dz), e.yaw)
	var turn: float = d.turn
	e.yaw += clampf(diff, -turn * dt, turn * dt)
	var sf := clampf(1.0 - absf(diff) / 1.5, 0.2, 1.0) * (clampf(dist / 1.5, 0.3, 1.0) if last else 1.0)
	var sp: float = float(d.speed) * sf
	var nx := e.pos.x + sin(e.yaw) * sp * dt
	var nz := e.pos.z + cos(e.yaw) * sp * dt
	var ti := W.tile_at(nx, nz)
	if ti < 0 or W.sea_ok(ti):
		e.vel = Vector3((nx - e.pos.x) / dt, 0, (nz - e.pos.z) / dt)
		e.pos.x = nx
		e.pos.z = nz
	else:
		var st := minf(dist, float(d.speed) * 0.6 * dt)
		e.vel = Vector3(dx / dist, 0, dz / dist) * float(d.speed) * 0.6
		e.pos.x += dx / dist * st
		e.pos.z += dz / dist * st
		e.yaw += clampf(diff, -turn * 2.0 * dt, turn * 2.0 * dt)
	return false

func _ship_fire(e: Unit, t: Bld) -> void:
	var d: Dictionary = e.def
	var dist := flat_dist(t.pos, e.pos)
	var sc := 0.4 + dist * 0.06
	var r: float = d.radius
	var s := e.pos + Vector3(sin(e.yaw) * r * 0.3, 0.5, cos(e.yaw) * r * 0.3)
	var shot: String = d.get("shot", "shell")
	var tgt := t.pos + Vector3(rnd(-sc, sc), 0, rnd(-sc, sc))
	var dmg: float = float(d.dmg) * e.dm
	if shot == "rocket":
		var dd := (tgt - s).length()
		G.projectiles.append({"kind": "rocket", "s": s, "e": tgt + Vector3(0, 0.2, 0), "p": s, "t": 0.0, "T": dd / 14.0, "dmg": dmg, "splash": d.splash, "vel": Vector3.ZERO})
		G.sfx.emit("missile", e.pos)
	else:
		_arc(shot, s, tgt, dmg, d.splash, "E", {}, e, e.age, 13.0 if shot == "shell" else 15.0)
		if shot == "shell":
			G.emit_fx("muzzle", s, 0.8 + r)
			G.emit_fx("musket_smoke", s, 0.8)
		G.sfx.emit("cannon" if shot == "shell" else "arrow", e.pos)

func _update_ship(e: Unit, dt: float) -> void:
	var d: Dictionary = e.def
	var r: float = d.radius
	if e.dying > 0.0:
		e.dying -= dt
		e.pos.y -= dt * 0.22 * (1.0 + r)
		e.pitch += dt * 0.12
		e.bank += dt * 0.08
		if randf() < dt * 8.0:
			G.emit_fx("smoke", Vector3(e.pos.x + rnd(-0.3, 0.3), maxf(0.0, e.pos.y + 0.4), e.pos.z + rnd(-0.3, 0.3)), r)
		if randf() < dt * 6.0:
			G.emit_fx("fire", Vector3(e.pos.x, maxf(0.0, e.pos.y + 0.2), e.pos.z), r)
		if e.dying <= 0.0:
			e.gone = true
		return
	e.think -= dt
	e.cool -= dt
	var troops: bool = d.has("troops") and d.role == "lander"
	if e.state == "leave":
		e.t += dt
		if e.t > 60.0:
			e.gone = true
	if e.state == "leave" and not troops:
		if e.path.is_empty() and e.think <= 0.0 and _can_plan():
			e.think = 2.0
			_plan_exit(e)
			if e.path.is_empty():
				e.gone = true
		if not e.path.is_empty() and _follow_sea_path(e, dt):
			e.gone = true
	elif troops:
		if e.state == "approach":
			if e.path.is_empty() and e.think <= 0.0 and _can_plan():
				e.think = 1.0
				if not _plan_landing(e):
					e.state = "leave"
			if not e.path.is_empty() and _follow_sea_path(e, dt):
				var lt := e.land_tile
				for k in e.troops:
					spawn_infantry(d.troop, G.W.tpos(lt), e.wave)
				e.troops = 0
				e.state = "leave"
				e.path = PackedInt32Array()
				e.think = 1.5
				G.sfx.emit("landing", e.pos)
		else:
			if e.path.is_empty() and e.think <= 0.0 and _can_plan():
				e.think = 2.0
				_plan_exit(e)
				if e.path.is_empty():
					e.gone = true
			if not e.path.is_empty() and _follow_sea_path(e, dt):
				e.gone = true
	else:
		if (e.target == null or not e.target.alive) and e.think <= 0.0 and _can_plan():
			e.think = 0.8
			if not _plan_ship_attack(e):
				e.target = null
				e.path = PackedInt32Array()
				e.state = "leave"
		var t: Bld = e.target if e.target != null and e.target.alive else null
		var tdist := flat_dist(t.pos, e.pos) if t != null else INF
		var arrived := false
		var rng: float = d.range
		if tdist <= rng * 0.92:
			arrived = true
			e.vel *= 1.0 - minf(1.0, dt * 2.0)
			e.pos += e.vel * dt
		else:
			arrived = _follow_sea_path(e, dt)
			var near_end := arrived
			if not near_end and e.path.size():
				var endt: int = e.path[e.path.size() - 1]
				near_end = Vector2(G.W.x[endt] - e.pos.x, G.W.z[endt] - e.pos.z).length() < 1.8
			if t != null and near_end:
				e.idle_t += dt
				if e.idle_t > 20.0:
					e.state = "leave"
					e.path = PackedInt32Array()
					e.think = 0.0
		if t != null:
			if arrived:
				var broadside := PI / 2.0 * (1.0 if e.phase > PI else -1.0) * (1.0 if r > 0.8 else 0.0)
				var diff := ang_diff(atan2(t.pos.x - e.pos.x, t.pos.z - e.pos.z) + broadside, e.yaw)
				e.yaw += clampf(diff, -float(d.turn) * 0.5 * dt, float(d.turn) * 0.5 * dt)
			if tdist <= rng and e.cool <= 0.0:
				e.cool = (1.0 / float(d.rate)) * rnd(0.85, 1.15)
				_ship_fire(e, t)
				e.ammo -= 1
				if e.ammo <= 0:
					e.state = "leave"
					e.path = PackedInt32Array()
					e.think = 0.0
		if d.has("launch"):
			e.launch_t -= dt
			if e.launch_t <= 0.0:
				e.launch_t = 12.0
				var jet := spawn_enemy(d.launch, 0.0, e.wave)
				jet.pos = e.pos + Vector3(0, 1.0, 0)
				jet.alt = 6.0
				jet.yaw = e.yaw
	# boss ships with troops drop them on arrival at the beach
	if d.has("troops") and d.role == "gunship" and e.troops > 0 and e.state != "leave":
		var ti := G.W.tile_at(e.pos.x, e.pos.z)
		if ti >= 0 and G.W.landing.has(ti):
			for dd in 6:
				var j := G.W.nbr[ti * 6 + dd]
				if j >= 0 and HexWorld.is_walkable(G.W.type[j]):
					for k in e.troops:
						spawn_infantry(d.troop, G.W.tpos(j), e.wave)
					e.troops = 0
					break
	# keep ships from stacking
	for o in G.enemies:
		if o == e or o.domain != "sea" or o.dying > 0.0:
			continue
		var dv: Vector3 = e.pos - o.pos
		dv.y = 0.0
		var d2 := dv.length_squared()
		var mn: float = r + float(o.def.radius)
		if d2 < mn * mn and d2 > 0.0001:
			var l := sqrt(d2)
			var push := (mn - l) * 0.5 * minf(1.0, dt * 4.0)
			var np: Vector3 = e.pos + dv / l * push
			if G.W.sea_ok(G.W.tile_at(np.x, np.z)):
				e.pos.x = np.x
				e.pos.z = np.z
	e.pos.y = sin(G.time * 1.6 + e.phase) * 0.03
	e.pitch = sin(G.time * 1.3 + e.phase) * 0.025
	e.bank = sin(G.time * 1.1 + e.phase * 2.0) * 0.035
	if e.vel.length_squared() > 0.3:
		e.wake_t -= dt
		if e.wake_t <= 0.0:
			e.wake_t = 0.08
			G.emit_fx("wake", Vector3(e.pos.x - sin(e.yaw) * r * 0.9, 0.02, e.pos.z - cos(e.yaw) * r * 0.9), r)

# --- aircraft
func _steer_plane(e: Unit, tx: float, tz: float, dt: float, turn: float, spd: float) -> float:
	var diff := ang_diff(atan2(tx - e.pos.x, tz - e.pos.z), e.yaw)
	e.yaw += clampf(diff, -turn * dt, turn * dt)
	e.bank += (clampf(-diff * 1.4, -1.0, 1.0) * 0.85 - e.bank) * minf(1.0, dt * 3.0)
	e.vel.x = sin(e.yaw) * spd
	e.vel.z = cos(e.yaw) * spd
	e.pos.x += e.vel.x * dt
	e.pos.z += e.vel.z * dt
	return diff

func _hold_alt(e: Unit, a: float, dt: float, rate: float = 1.5) -> void:
	var dy := clampf(a - e.pos.y, -rate * dt, rate * dt)
	e.pos.y += dy
	e.vel.y = dy / maxf(dt, 0.0001)
	e.pitch += (clampf(-e.vel.y * 0.12, -0.5, 0.5) - e.pitch) * minf(1.0, dt * 3.0)

func _pick_air_target(e: Unit) -> Bld:
	var sum := 0.0
	var cand: Array = []
	for b in G.buildings:
		if not b.alive or b.type == "wall":
			continue
		var mil: bool = not b.ws.is_empty() or b.type == "airfield" or b.type == "barracks"
		var w := (3.0 if mil else (2.0 if b.type == "hq" else 1.0)) / (1.0 + flat_dist(b.pos, e.pos) / 25.0)
		cand.append([b, w])
		sum += w
	var r := randf() * sum
	for c in cand:
		r -= c[1]
		if r <= 0.0:
			return c[0]
	return cand[0][0] if cand.size() else null

## The nuclear bomber aims for the densest cluster of defences
func _nuke_target() -> Bld:
	var best: Bld = null
	var bs := -1.0
	for b in G.buildings:
		if b.type == "wall":
			continue
		var s := 0.0
		for o in G.buildings:
			if flat_dist(o.pos, b.pos) < 4.5:
				s += 2.0 if not o.ws.is_empty() else 1.0
		if s > bs:
			bs = s
			best = b
	return best

func _crash(e: Unit, dt: float) -> void:
	e.dying -= dt
	e.vel.y -= GRAV * 0.7 * dt
	e.pos += Vector3(e.vel.x * 0.85, e.vel.y, e.vel.z * 0.85) * dt
	e.bank += dt * 4.0
	e.pitch = clampf(-e.vel.y * 0.08, -0.9, 0.9)
	e.trail_t -= dt
	if e.trail_t <= 0.0:
		e.trail_t = 0.04
		G.emit_fx("smoke_dark", e.pos, 0.8)
		G.emit_fx("fire", e.pos, 0.5)
	var gy: float = G.W.ground_y(e.pos.x, e.pos.z)
	if e.pos.y <= gy or e.dying <= 0.0:
		G.emit_fx("explosion_water" if gy == 0.0 else "explosion", Vector3(e.pos.x, gy, e.pos.z), float(e.def.get("radius", 0.7)))
		G.sfx.emit("splash" if gy == 0.0 else "boom", e.pos)
		e.gone = true

func _drop_bomb(e: Unit) -> void:
	var nuke: bool = e.def.get("nuke", false)
	G.projectiles.append({"kind": "nuke" if nuke else "bomb", "p": e.pos - Vector3(0, 0.15, 0), "vel": Vector3(e.vel.x, 0, e.vel.z),
		"dmg": float(e.def.bomb_dmg) * e.dm, "splash": e.def.splash})
	G.sfx.emit("bomb_drop", e.pos)

func _leave(e: Unit, dt: float) -> void:
	var l := Vector2(e.pos.x, e.pos.z).length()
	if l < 0.01:
		l = 0.01
	_steer_plane(e, e.pos.x + e.pos.x / l * 50.0, e.pos.z + e.pos.z / l * 50.0, dt, float(e.def.turn), float(e.def.speed))
	_hold_alt(e, e.alt + 2.0, dt)
	if l > 60.0:
		e.gone = true

func _update_striker(e: Unit, dt: float) -> void:
	var d: Dictionary = e.def
	var rockets: bool = d.has("rockets")
	if e.state == "approach" or e.state == "attack":
		if e.target == null or not e.target.alive:
			e.target = _pick_air_target(e)
			if e.target == null:
				e.state = "leave"
				return
		var t: Bld = e.target
		var dist := flat_dist(t.pos, e.pos)
		var diff := _steer_plane(e, t.pos.x, t.pos.z, dt, d.turn, d.speed)
		if rockets:
			_hold_alt(e, maxf(3.5, e.alt - (2.5 if dist < 14.0 else 0.0)), dt, 2.0)
			if dist < 8.5 and absf(diff) < 0.12 and e.rockets > 0:
				for k in 2:
					if e.rockets <= 0:
						break
					e.rockets -= 1
					var side := Vector3(cos(e.yaw), 0, -sin(e.yaw)) * (0.3 if k == 0 else -0.3)
					var s: Vector3 = e.pos + side
					var tgt := t.pos + Vector3(rnd(-0.4, 0.4), 0.2, rnd(-0.4, 0.4))
					G.projectiles.append({"kind": "rocket", "s": s, "e": tgt, "p": s, "t": 0.0, "T": (tgt - s).length() / 18.0,
						"dmg": float(d.rocket_dmg) * e.dm, "splash": d.splash, "vel": Vector3.ZERO})
				G.sfx.emit("missile", e.pos)
				e.state = "egress"
				e.egress_t = 2.6
				e.passes += 1
			elif dist < 4.0 and absf(diff) > 0.4:
				e.state = "egress"
				e.egress_t = 2.0
				e.passes += 1
		else:
			_hold_alt(e, e.alt, dt)
			var lead: float = float(d.speed) * sqrt(2.0 * maxf(0.5, e.pos.y - t.pos.y) / GRAV)
			if dist <= lead:
				if absf(diff) < 0.12 or e.passes >= 4:
					_drop_bomb(e)
					e.bombs -= 1
				e.state = "egress"
				e.egress_t = 2.4
				e.passes += 1
	elif e.state == "egress":
		_steer_plane(e, e.pos.x + sin(e.yaw) * 10.0, e.pos.z + cos(e.yaw) * 10.0, dt, d.turn, d.speed)
		_hold_alt(e, e.alt, dt)
		e.egress_t -= dt
		if e.egress_t <= 0.0:
			var ammo := e.rockets if rockets else e.bombs
			e.state = "attack" if ammo > 0 and e.passes < 8 else "leave"
			e.target = null
	else:
		_leave(e, dt)

func _update_bomber(e: Unit, dt: float) -> void:
	var d: Dictionary = e.def
	if e.state == "approach":
		_steer_plane(e, e.wp.x, e.wp.y, dt, d.turn, d.speed)
		if Vector2(e.wp.x - e.pos.x, e.wp.y - e.pos.z).length() < 3.0:
			e.state = "run"
	else:
		_steer_plane(e, e.exitp.x, e.exitp.y, dt, d.turn, d.speed)
		if Vector2(e.pos.x, e.pos.z).length() > 62.0:
			e.gone = true
	_hold_alt(e, e.alt, dt)
	e.cool -= dt
	if e.bombs > 0 and e.cool <= 0.0:
		var ft := sqrt(2.0 * e.pos.y / GRAV)
		var ti: int = G.W.tile_at(e.pos.x + e.vel.x * ft, e.pos.z + e.vel.z * ft)
		var nuke: bool = d.get("nuke", false)
		var go := false
		if nuke:
			go = Vector2(e.pos.x + e.vel.x * ft - e.wp.x, e.pos.z + e.vel.z * ft - e.wp.y).length() < 1.2
		else:
			go = ti >= 0 and G.W.bld[ti] != 0
		if go:
			_drop_bomb(e)
			e.bombs -= 1
			e.cool = 0.32
	e.gcool -= dt
	if e.gcool <= 0.0:
		e.gcool = 0.4
		for a in G.allies:
			if not a.alive or a.domain != "air" or a.state == "parked":
				continue
			if (a.pos - e.pos).length() < 4.5:
				tracer(e.pos, a.pos + Vector3(rnd(-0.3, 0.3), 0, rnd(-0.3, 0.3)), true)
				if randf() < 0.5:
					damage_enemy(a, 6.0 * e.dm)
				break

func _update_plane(e: Unit, dt: float) -> void:
	if e.dying > 0.0:
		_crash(e, dt)
		return
	if e.role == "bomber":
		_update_bomber(e, dt)
	else:
		_update_striker(e, dt)

# --- ground troops
func _move_ground(u: Unit, tx: float, tz: float, spd: float, dt: float, force: bool = false) -> bool:
	var W: HexWorld = G.W
	var dx := tx - u.pos.x
	var dz := tz - u.pos.z
	var l := sqrt(dx * dx + dz * dz)
	if l < 0.02:
		u.vel = Vector3.ZERO
		return true
	var s := minf(l, spd * dt)
	var nx := u.pos.x + dx / l * s
	var nz := u.pos.z + dz / l * s
	var ti := W.tile_at(nx, nz)
	if not force and (ti < 0 or not HexWorld.is_walkable(W.type[ti])):
		ti = W.tile_at(nx, u.pos.z)
		if ti >= 0 and HexWorld.is_walkable(W.type[ti]):
			nz = u.pos.z
		else:
			ti = W.tile_at(u.pos.x, nz)
			if ti >= 0 and HexWorld.is_walkable(W.type[ti]):
				nx = u.pos.x
			else:
				u.vel = Vector3.ZERO
				return false
	u.vel = Vector3((nx - u.pos.x) / dt, 0, (nz - u.pos.z) / dt)
	u.pos.x = nx
	u.pos.z = nz
	u.yaw += clampf(ang_diff(atan2(dx, dz), u.yaw), -8.0 * dt, 8.0 * dt)
	u.walk += s * 9.0
	return l < spd * dt + 0.05

func _follow_land_path(u: Unit, dt: float, spd: float) -> bool:
	var W: HexWorld = G.W
	if u.path.is_empty() or u.pi >= u.path.size():
		return true
	var t: int = u.path[u.pi]
	var last := u.pi == u.path.size() - 1
	var tx := W.x[t] + (0.0 if u.force else u.ox)
	var tz := W.z[t] + (0.0 if u.force else u.oz)
	var px := u.pos.x
	var pz := u.pos.z
	var reached := _move_ground(u, tx, tz, spd, dt, u.force)
	if not u.force:
		if u.pos.x == px and u.pos.z == pz and not reached:
			u.block_t += dt
			if u.block_t > 0.3:
				u.force = true
		else:
			u.block_t = 0.0
	if reached or Vector2(tx - u.pos.x, tz - u.pos.z).length() < (0.15 if last else 0.5):
		u.pi += 1
		u.block_t = 0.0
		u.force = false
	return u.pi >= u.path.size()

func _land_path_to(u: Unit, tile: int, near: int, ally: bool) -> PackedInt32Array:
	var W: HexWorld = G.W
	var tq: int = W.q[tile]
	var tr: int = W.r[tile]
	return G.path.find(_start_tile(u, false), _land_cost_ally if ally else _land_cost_enemy,
		func(j): return HexWorld.hex_dist(W.q[j], W.r[j], tq, tr) <= near,
		func(j): return float(maxi(0, HexWorld.hex_dist(W.q[j], W.r[j], tq, tr) - near)), 3000)

func _settle_y(u: Unit, dt: float) -> void:
	var gy: float = G.W.ground_y(u.pos.x, u.pos.z)
	u.pos.y += (gy - u.pos.y) * minf(1.0, dt * 10.0)

func _update_infantry(e: Unit, dt: float) -> void:
	var d: Dictionary = e.def
	if e.dying > 0.0:
		e.gone = true
		return
	e.think -= dt
	e.cool -= dt
	if e.think <= 0.0:
		e.think = rnd(0.35, 0.6)
		e.foe = null
		var bd: float = float(d.range) * float(d.range) + 1.0
		for a in G.allies:
			if not a.alive or a.domain != "ground":
				continue
			var dd: float = (a.pos - e.pos).length_squared()
			if dd < bd:
				bd = dd
				e.foe = a
		if e.target == null or not e.target.alive:
			e.target = _nearest_building(e.pos, func(b): return b.type != "wall")
			e.path = PackedInt32Array()
		if e.target != null and e.path.is_empty() and e.foe == null and _can_plan():
			e.path = _land_path_to(e, e.target.tile, 1, false)
			e.pi = 1
			if e.path.is_empty() and G.hq != null and e.target != G.hq:
				e.target = G.hq
				e.path = _land_path_to(e, G.hq.tile, 1, false)
			if e.path.is_empty():
				e.target = null
	var foe: Unit = e.foe if e.foe != null and e.foe.alive else null
	# a wall in the way must be broken first
	var wall: Bld = null
	if foe == null and e.path.size() and e.pi < e.path.size():
		var nt: int = e.path[e.pi]
		if G.W.bld[nt] != 0:
			var wb: Bld = G.by_id.get(G.W.bld[nt])
			if wb != null and wb.type == "wall" and wb.alive:
				wall = wb
	var tgt = foe if foe != null else (wall if wall != null else e.target)
	if tgt == null:
		e.stuck_t += dt
		if e.stuck_t > 20.0:
			e.gone = true
			G.emit_fx("dust", e.pos, 0.4)
		_settle_y(e, dt)
		return
	e.stuck_t = 0.0
	var dist := flat_dist(tgt.pos, e.pos)
	var reach: float = float(d.range) + (0.0 if foe != null else 1.05)
	if dist <= reach:
		e.vel = Vector3.ZERO
		e.yaw += clampf(ang_diff(atan2(tgt.pos.x - e.pos.x, tgt.pos.z - e.pos.z), e.yaw), -8.0 * dt, 8.0 * dt)
		if e.cool <= 0.0:
			e.cool = (1.0 / float(d.rate)) * rnd(0.8, 1.2)
			var melee: bool = float(d.range) < 1.5
			if not melee:
				tracer(e.pos + Vector3(0, 0.25, 0), tgt.pos + Vector3(rnd(-0.2, 0.2), 0.25, rnd(-0.2, 0.2)), true, 1 if e.age <= 1 else 0)
				if e.age <= 1:
					G.emit_fx("musket_smoke", e.pos + Vector3(0, 0.3, 0), 0.3)
			else:
				e.anim = 1.0
			if foe != null:
				if randf() < 0.7:
					damage_enemy(foe, float(d.dmg) * e.dm)
			else:
				G.damage_building(tgt, float(d.dmg) * e.dm)
			G.sfx.emit("sword" if melee else "rifle", e.pos)
	elif not e.path.is_empty():
		if _follow_land_path(e, dt, d.speed):
			e.path = PackedInt32Array()
	else:
		# route finished (or none needed) but still out of reach: walk straight at the target
		_move_ground(e, tgt.pos.x, tgt.pos.z, d.speed, dt, false)
	_settle_y(e, dt)

func _update_soldier(s: Unit, dt: float) -> void:
	var d: Dictionary = s.def
	if s.dying > 0.0:
		s.gone = true
		return
	s.think -= dt
	s.cool -= dt
	var home: Bld = s.home if s.home != null and s.home.alive else null
	var gx: float = home.pos.x if home else s.pos.x
	var gz: float = home.pos.z if home else s.pos.z
	var guard: float = float(home.def.guard) if home else 6.0
	if s.think <= 0.0:
		s.think = rnd(0.3, 0.5)
		var best: Unit = null
		var bd := INF
		for e in G.enemies:
			if not e.alive or e.domain != "ground":
				continue
			if (e.pos.x - gx) * (e.pos.x - gx) + (e.pos.z - gz) * (e.pos.z - gz) > guard * guard:
				continue
			var dd: float = (e.pos - s.pos).length_squared()
			if dd < bd:
				bd = dd
				best = e
		if best != s.foe:
			s.foe = best
			s.path = PackedInt32Array()
			s.repath = 0.0
	var f: Unit = s.foe if s.foe != null and s.foe.alive else null
	var dmg: float = float(d.dmg) * G.mod.soldier * obsolescence(s.age, f.age if f else 0)
	if f != null:
		var dist := flat_dist(f.pos, s.pos)
		if dist <= float(d.range):
			s.vel = Vector3.ZERO
			s.yaw += clampf(ang_diff(atan2(f.pos.x - s.pos.x, f.pos.z - s.pos.z), s.yaw), -8.0 * dt, 8.0 * dt)
			if s.cool <= 0.0:
				s.cool = (1.0 / float(d.rate)) * rnd(0.8, 1.2)
				if float(d.range) > 1.5:
					tracer(s.pos + Vector3(0, 0.25, 0), f.pos + Vector3(rnd(-0.15, 0.15), 0.22, rnd(-0.15, 0.15)), false, 1 if s.age <= 1 else 0)
				else:
					s.anim = 1.0
				if randf() < 0.75:
					damage_enemy(f, dmg, s.home)
				G.sfx.emit("rifle" if float(d.range) > 1.5 else "sword", s.pos)
		else:
			s.repath -= dt
			if (s.path.is_empty() or s.repath <= 0.0) and _can_plan():
				s.repath = 1.0
				var ft: int = G.W.tile_at(f.pos.x, f.pos.z)
				s.path = _land_path_to(s, ft, 0, true) if ft >= 0 else PackedInt32Array()
				s.pi = 1
			if s.path.size() and s.pi < s.path.size():
				_follow_land_path(s, dt, d.speed)
			else:
				_move_ground(s, f.pos.x, f.pos.z, d.speed, dt, true)
	elif home != null:
		var dist2 := Vector2(s.post.x - s.pos.x, s.post.y - s.pos.z).length()
		if dist2 > 3.5:
			s.repath -= dt
			if (s.path.is_empty() or s.repath <= 0.0) and _can_plan():
				s.repath = 2.0
				s.path = _land_path_to(s, home.tile, 0, true)
				s.pi = 1
			if s.path.size():
				if _follow_land_path(s, dt, d.speed):
					s.path = PackedInt32Array()
		elif dist2 > 0.15:
			s.path = PackedInt32Array()
			_move_ground(s, s.post.x, s.post.y, float(d.speed) * 0.6, dt)
		else:
			s.vel = Vector3.ZERO
	_settle_y(s, dt)

func _update_fighter(f: Unit, dt: float) -> void:
	var d: Dictionary = f.def
	if f.dying > 0.0:
		_crash(f, dt)
		return
	var home: Bld = f.home if f.home != null and f.home.alive else null
	var spd: float = d.speed
	if f.state == "parked":
		if home == null:
			f.gone = true
			return
		_park(f)
		if not home.connected or not home.working():
			return
		var threat := false
		for e in G.enemies:
			if e.alive and (e.domain == "air" or e.domain == "sea") and Vector2(e.pos.x, e.pos.z).length() < G.mod.scramble:
				threat = true
				break
		if threat and G.time >= home.next_launch:
			home.next_launch = G.time + 1.2
			f.state = "takeoff"
			f.t = 0.0
			f.speed = 1.5
			G.sfx.emit("plane", f.pos)
		return
	if f.state == "takeoff":
		f.t += dt
		f.speed = minf(spd, f.speed + spd * 0.6 * dt)
		f.vel = Vector3(sin(f.yaw) * f.speed, 0, cos(f.yaw) * f.speed)
		f.pos += f.vel * dt
		if f.t > 0.8:
			_hold_alt(f, 4.5, dt, 2.2)
		if f.t > 2.5:
			f.state = "engage"
			f.think = 0.0
		return
	f.think -= dt
	f.cool -= dt
	if f.think <= 0.0:
		f.think = 0.5
		var best: Unit = null
		var bd := INF
		for e in G.enemies:
			if not e.alive or (e.domain != "air" and e.domain != "sea"):
				continue
			if Vector2(e.pos.x, e.pos.z).length() > 40.0:
				continue
			var dd := flat_dist(e.pos, f.pos) * (0.5 if e.domain == "air" else 1.0)
			if dd < bd:
				bd = dd
				best = e
		f.target = best
		f.state = "engage" if best != null else "return"
	var t: Unit = f.target if f.target != null and f.target.alive else null
	if f.state == "engage" and t != null:
		var diff := _steer_plane(f, t.pos.x - t.vel.x * 0.2, t.pos.z - t.vel.z * 0.2, dt, d.turn, spd)
		_hold_alt(f, t.pos.y if t.domain == "air" else 2.0, dt, 3.0)
		var dist := (t.pos - f.pos).length()
		if dist < float(d.range) and absf(diff) < 0.35 and f.cool <= 0.0:
			f.cool = 1.0 / float(d.rate)
			var hit := randf() < float(d.acc)
			var fwd := Vector3(sin(f.yaw), 0, cos(f.yaw)) * 0.3
			tracer(f.pos + fwd, t.pos + Vector3(rnd(-0.3, 0.3), 0.1, rnd(-0.3, 0.3)))
			if hit:
				damage_enemy(t, float(d.dmg) * (0.7 if t.domain == "sea" else 1.0) * obsolescence(f.age, t.age), home)
			G.sfx.emit("mg", f.pos)
	else:
		if home == null:
			_leave(f, dt)
			return
		var dist2 := flat_dist(home.pos, f.pos)
		_steer_plane(f, home.pos.x, home.pos.z, dt, d.turn, spd * 0.6 if dist2 < 6.0 else spd)
		_hold_alt(f, home.pos.y + 0.6 if dist2 < 6.0 else 4.5, dt, 2.0)
		if dist2 < 1.2:
			f.state = "parked"
			_park(f)

# ------------------------------------------------------------------ main update
func update(dt: float) -> void:
	plan_budget = 3
	update_wave(dt)
	_update_buildings(dt)
	for e in G.enemies:
		if e.hit_t > 0.0:
			e.hit_t -= dt
		if e.domain == "sea":
			_update_ship(e, dt)
		elif e.domain == "air":
			_update_plane(e, dt)
		else:
			_update_infantry(e, dt)
	for a in G.allies:
		if a.hit_t > 0.0:
			a.hit_t -= dt
		if a.role == "soldier":
			_update_soldier(a, dt)
		else:
			_update_fighter(a, dt)
	_update_projectiles(dt)
	G.enemies = _compact(G.enemies)
	G.allies = _compact(G.allies)

func _compact(list: Array) -> Array:
	var out: Array = []
	for u in list:
		if u.gone:
			if u.team == "A" and u.home != null:
				u.home.units.erase(u)
			G.unit_removed.emit(u)
		else:
			out.append(u)
	return out

func enemies_alive() -> int:
	var n := 0
	for e in G.enemies:
		if e.alive:
			n += 1
	return n
