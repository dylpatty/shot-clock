class_name Models
extends RefCounted
## Procedural building models: every type has a distinct look per level (age). Built once and cached.
## A model is a Dictionary: base (ArrayMesh), head (turret mesh or null) + head_y, spin (rotating part or
## null) + spin_pos / spin_axis / spin_speed, smoke (chimney points). Front faces +z.

static var mat: ShaderMaterial
static var glow_mat: ShaderMaterial
static var cache := {}

static func mats() -> void:
	if mat != null:
		return
	var sh: Shader = load("res://shaders/model.gdshader")
	mat = ShaderMaterial.new()
	mat.shader = sh
	glow_mat = ShaderMaterial.new()
	glow_mat.shader = sh
	glow_mat.set_shader_parameter("glow_strength", 2.4)
	glow_mat.set_shader_parameter("roughness", 0.4)

static func commit(mk: MK) -> ArrayMesh:
	mats()
	if mk.is_empty():
		return null
	return mk.commit(mat, glow_mat)

# ------------------------------------------------------------------ palettes
static func pal(a: int) -> Dictionary:
	match a:
		0:
			return {"wall": Color(0.93, 0.86, 0.70), "wall2": Color(0.84, 0.74, 0.56), "beam": Color(0.42, 0.27, 0.15), "roof": Color(0.88, 0.70, 0.33),
				"roof2": Color(0.74, 0.56, 0.25), "stone": Color(0.68, 0.66, 0.62), "stone2": Color(0.55, 0.53, 0.50), "trim": Color(0.48, 0.32, 0.19),
				"metal": Color(0.45, 0.45, 0.48), "win": Color(0.2, 0.15, 0.12), "accent": Color(0.95, 0.75, 0.2), "ground": Color(0.58, 0.47, 0.32)}
		1:
			return {"wall": Color(0.97, 0.92, 0.81), "wall2": Color(0.93, 0.76, 0.50), "beam": Color(0.52, 0.34, 0.2), "roof": Color(0.84, 0.39, 0.22),
				"roof2": Color(0.70, 0.30, 0.18), "stone": Color(0.86, 0.82, 0.73), "stone2": Color(0.72, 0.68, 0.60), "trim": Color(0.96, 0.95, 0.92),
				"metal": Color(0.35, 0.35, 0.38), "win": Color(0.22, 0.3, 0.4), "accent": Color(0.95, 0.75, 0.2), "ground": Color(0.75, 0.70, 0.60)}
		2:
			return {"wall": Color(0.72, 0.33, 0.23), "wall2": Color(0.60, 0.27, 0.19), "beam": Color(0.36, 0.26, 0.2), "roof": Color(0.34, 0.38, 0.47),
				"roof2": Color(0.28, 0.31, 0.39), "stone": Color(0.80, 0.76, 0.68), "stone2": Color(0.60, 0.58, 0.55), "trim": Color(0.93, 0.89, 0.79),
				"metal": Color(0.28, 0.30, 0.33), "win": Color(0.28, 0.38, 0.48), "accent": Color(0.86, 0.66, 0.26), "ground": Color(0.55, 0.53, 0.50)}
		3:
			return {"wall": Color(0.84, 0.84, 0.82), "wall2": Color(0.62, 0.67, 0.72), "beam": Color(0.30, 0.30, 0.33), "roof": Color(0.47, 0.48, 0.50),
				"roof2": Color(0.38, 0.38, 0.41), "stone": Color(0.76, 0.76, 0.73), "stone2": Color(0.55, 0.56, 0.58), "trim": Color(0.96, 0.56, 0.16),
				"metal": Color(0.56, 0.59, 0.63), "win": Color(0.38, 0.62, 0.80), "accent": Color(0.96, 0.56, 0.16), "ground": Color(0.42, 0.43, 0.45)}
		_:
			return {"wall": Color(0.95, 0.96, 0.98), "wall2": Color(0.78, 0.84, 0.91), "beam": Color(0.42, 0.47, 0.57), "roof": Color(0.86, 0.89, 0.93),
				"roof2": Color(0.62, 0.68, 0.77), "stone": Color(0.88, 0.90, 0.92), "stone2": Color(0.70, 0.74, 0.80), "trim": Color(0.30, 0.92, 1.0),
				"metal": Color(0.66, 0.71, 0.79), "win": Color(0.55, 0.95, 1.0), "accent": Color(0.30, 0.92, 1.0), "ground": Color(0.78, 0.82, 0.88)}

const FLAG := Color(0.16, 0.40, 0.90)
const FLAG2 := Color(0.98, 0.82, 0.22)
const DARK := Color(0.16, 0.13, 0.12)
const WOOD := Color(0.50, 0.33, 0.19)
const WOOD2 := Color(0.62, 0.43, 0.25)
const LEAF := Color(0.30, 0.60, 0.22)
const HAY := Color(0.93, 0.78, 0.35)
const WHEAT := Color(0.94, 0.80, 0.36)
const CROP := Color(0.45, 0.72, 0.25)
const SOIL := Color(0.50, 0.36, 0.22)
const WATER := Color(0.25, 0.62, 0.80)
const RED := Color(0.85, 0.22, 0.18)
const WHITE := Color(0.96, 0.96, 0.94)
const CYAN := Color(0.35, 0.95, 1.0)

# ------------------------------------------------------------------ shared parts
static func pad(mk: MK, col: Color, r: float = 0.84, h: float = 0.05) -> void:
	mk.hexp(Vector3(0, -0.02, 0), r, h + 0.02, col, col.lightened(0.06))

static func window(mk: MK, a: int, p: Vector3, w: float, h: float, facing: Vector3) -> void:
	# a small window on a wall facing `facing` (unit axis vector)
	var pl: Dictionary = pal(a)
	var thick := 0.025
	var size := Vector3(w if absf(facing.x) < 0.5 else thick, h, w if absf(facing.z) < 0.5 else thick)
	if a >= 4:
		mk.glow = true
		mk.box(p + facing * 0.012, size, pl.win)
		mk.glow = false
	else:
		mk.box(p + facing * 0.012, size, pl.win)
		if a >= 1:
			var fs := Vector3(size.x * (1.25 if size.x > thick else 1.0), h * 0.14, size.z * (1.25 if size.z > thick else 1.0))
			mk.box(p + facing * 0.018 - Vector3(0, h * 0.55, 0), fs, pl.trim)

## windows on all four walls of a box centred at c (bottom centre), size w x d, per floor
static func facade(mk: MK, a: int, c: Vector3, w: float, d: float, y0: float, floors: int, fh: float, per_w: int, per_d: int, ww: float = 0.08, wh: float = 0.11) -> void:
	for f in floors:
		var y := c.y + y0 + fh * f + fh * 0.55
		for i in per_w:
			var xx := c.x - w * 0.5 + w * (i + 0.5) / per_w
			window(mk, a, Vector3(xx, y, c.z + d * 0.5), ww, wh, Vector3(0, 0, 1))
			window(mk, a, Vector3(xx, y, c.z - d * 0.5), ww, wh, Vector3(0, 0, -1))
		for i in per_d:
			var zz := c.z - d * 0.5 + d * (i + 0.5) / per_d
			window(mk, a, Vector3(c.x + w * 0.5, y, zz), ww, wh, Vector3(1, 0, 0))
			window(mk, a, Vector3(c.x - w * 0.5, y, zz), ww, wh, Vector3(-1, 0, 0))

static func door(mk: MK, p: Vector3, w: float, h: float, col: Color = WOOD) -> void:
	mk.box(p + Vector3(0, h * 0.5, 0.012), Vector3(w, h, 0.03), col)

static func banner(mk: MK, p: Vector3, h: float, col: Color = FLAG, w: float = 0.18) -> void:
	mk.rod(p, p + Vector3(0, h, 0), 0.012, Color(0.35, 0.25, 0.15), 5)
	mk.box(p + Vector3(w * 0.5 + 0.01, h - 0.08, 0), Vector3(w, 0.12, 0.012), col)
	mk.box(p + Vector3(w * 0.5 + 0.01, h - 0.08 - 0.045, 0), Vector3(w, 0.025, 0.014), FLAG2)
	mk.sphere(p + Vector3(0, h + 0.015, 0), 0.02, FLAG2, 5, 3)

static func timber(mk: MK, c: Vector3, w: float, d: float, h: float, col: Color) -> void:
	# corner posts and a mid band on a box centred at c (bottom centre)
	for sx in [-1.0, 1.0]:
		for sz in [-1.0, 1.0]:
			mk.box(c + Vector3(sx * w * 0.5, h * 0.5, sz * d * 0.5), Vector3(0.04, h, 0.04), col)
	mk.box(c + Vector3(0, h * 0.5, d * 0.5), Vector3(w, 0.035, 0.03), col)
	mk.box(c + Vector3(0, h * 0.5, -d * 0.5), Vector3(w, 0.035, 0.03), col)
	mk.box(c + Vector3(w * 0.5, h * 0.5, 0), Vector3(0.03, 0.035, d), col)
	mk.box(c + Vector3(-w * 0.5, h * 0.5, 0), Vector3(0.03, 0.035, d), col)
	# diagonal braces on the front
	mk.push_at(c + Vector3(-w * 0.25, h * 0.25, d * 0.5 + 0.01))
	mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), 0.7))
	mk.box(Vector3.ZERO, Vector3(0.03, h * 0.55, 0.02), col)
	mk.pop()
	mk.pop()
	mk.push_at(c + Vector3(w * 0.25, h * 0.25, d * 0.5 + 0.01))
	mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), -0.7))
	mk.box(Vector3.ZERO, Vector3(0.03, h * 0.55, 0.02), col)
	mk.pop()
	mk.pop()

static func crenels(mk: MK, c: Vector3, r: float, h: float, col: Color, n: int = 8, s: float = 0.09) -> void:
	for i in n:
		var a := TAU * i / n
		mk.boxr(c + Vector3(cos(a) * r, h * 0.5, sin(a) * r), Vector3(s, h, s), -a, col)

static func crenels_sq(mk: MK, c: Vector3, w: float, h: float, col: Color, per: int = 3) -> void:
	for i in per:
		var t := -w * 0.5 + w * (i + 0.5) / per
		for p in [Vector3(t, 0, w * 0.5), Vector3(t, 0, -w * 0.5), Vector3(w * 0.5, 0, t), Vector3(-w * 0.5, 0, t)]:
			mk.box(c + p + Vector3(0, h * 0.5, 0), Vector3(0.08, h, 0.08), col)

static func chimney(mk: MK, p: Vector3, h: float, col: Color, smoke: Array, r: float = 0.05) -> void:
	mk.box(p + Vector3(0, h * 0.5, 0), Vector3(r * 2, h, r * 2), col)
	mk.box(p + Vector3(0, h, 0), Vector3(r * 2.4, 0.03, r * 2.4), col.darkened(0.2))
	smoke.append(p + Vector3(0, h + 0.05, 0))

static func stack(mk: MK, p: Vector3, h: float, r: float, col: Color, band: Color, smoke: Array) -> void:
	mk.cyl(p, r * 1.15, r, h, 8, col)
	mk.cyl(p + Vector3(0, h * 0.8, 0), r * 1.05, r * 1.05, 0.05, 8, band)
	mk.cyl(p + Vector3(0, h, 0), r * 1.2, r * 1.2, 0.04, 8, col.darkened(0.25))
	smoke.append(p + Vector3(0, h + 0.06, 0))

static func crate(mk: MK, p: Vector3, s: float = 0.1, col: Color = WOOD2) -> void:
	mk.box(p + Vector3(0, s * 0.5, 0), Vector3(s, s, s), col, col.lightened(0.1))

static func barrel(mk: MK, p: Vector3, s: float = 0.06) -> void:
	mk.cyl(p, s, s, s * 2.2, 8, WOOD)
	mk.cyl(p + Vector3(0, s * 0.5, 0), s * 1.04, s * 1.04, 0.012, 8, Color(0.3, 0.3, 0.32), null, false)
	mk.cyl(p + Vector3(0, s * 1.6, 0), s * 1.04, s * 1.04, 0.012, 8, Color(0.3, 0.3, 0.32), null, false)

static func bush(mk: MK, p: Vector3, s: float = 0.08) -> void:
	mk.sphere(p + Vector3(0, s * 0.7, 0), s, LEAF, 7, 4, Vector3(1, 0.8, 1))

static func tree(mk: MK, p: Vector3, s: float = 1.0) -> void:
	mk.cyl(p, 0.025 * s, 0.02 * s, 0.18 * s, 5, WOOD)
	mk.sphere(p + Vector3(0, 0.25 * s, 0), 0.12 * s, LEAF, 7, 4)

static func person(mk: MK, p: Vector3, col: Color) -> void:
	mk.cyl(p, 0.022, 0.018, 0.07, 5, col)
	mk.sphere(p + Vector3(0, 0.09, 0), 0.022, Color(0.95, 0.78, 0.62), 5, 3)

static func fence(mk: MK, a: Vector3, b: Vector3, col: Color = WOOD2, posts: int = 4) -> void:
	for i in posts + 1:
		var p := a.lerp(b, float(i) / posts)
		mk.box(p + Vector3(0, 0.05, 0), Vector3(0.025, 0.1, 0.025), col)
	var mid := (a + b) * 0.5
	var d := b - a
	var yaw := atan2(d.x, d.z)
	mk.boxr(mid + Vector3(0, 0.07, 0), Vector3(0.015, 0.015, d.length()), yaw, col)
	mk.boxr(mid + Vector3(0, 0.035, 0), Vector3(0.015, 0.015, d.length()), yaw, col)

static func field(mk: MK, c: Vector3, w: float, d: float, col: Color, rows: int = 5, soil: Color = SOIL) -> void:
	mk.box(c + Vector3(0, 0.01, 0), Vector3(w, 0.02, d), soil)
	for i in rows:
		var x := c.x - w * 0.5 + w * (i + 0.5) / rows
		mk.box(Vector3(x, c.y + 0.045, c.z), Vector3(w / rows * 0.6, 0.05, d * 0.92), col, col.lightened(0.12))

static func sheep(mk: MK, p: Vector3, yaw: float = 0.0) -> void:
	mk.push_at(p, yaw)
	mk.sphere(Vector3(0, 0.06, 0), 0.05, WHITE, 6, 4, Vector3(1.0, 0.85, 1.3))
	mk.sphere(Vector3(0, 0.075, 0.06), 0.022, DARK, 5, 3)
	for sx in [-0.025, 0.025]:
		for sz in [-0.03, 0.03]:
			mk.box(Vector3(sx, 0.015, sz), Vector3(0.012, 0.03, 0.012), DARK)
	mk.pop()

static func cow(mk: MK, p: Vector3, yaw: float = 0.0) -> void:
	mk.push_at(p, yaw)
	mk.box(Vector3(0, 0.07, 0), Vector3(0.07, 0.06, 0.13), WHITE)
	mk.box(Vector3(0.012, 0.085, 0.02), Vector3(0.072, 0.03, 0.04), DARK)
	mk.box(Vector3(0, 0.085, 0.08), Vector3(0.05, 0.045, 0.045), WHITE)
	for sx in [-0.025, 0.025]:
		for sz in [-0.045, 0.045]:
			mk.box(Vector3(sx, 0.02, sz), Vector3(0.015, 0.04, 0.015), DARK)
	mk.pop()

static func boat(mk: MK, p: Vector3, yaw: float, s: float, a: int) -> void:
	mk.push_at(p, yaw, s)
	var pl: Dictionary = pal(a)
	if a <= 1:
		mk.hull(0.5, 0.16, 0.06, WOOD, RED if a == 0 else FLAG, WOOD2, 0.03, 0.02, 0.4)
		mk.rod(Vector3(0, 0, 0.02), Vector3(0, 0.3, 0.02), 0.008, WOOD)
		mk.box(Vector3(0, 0.17, 0.05), Vector3(0.005, 0.2, 0.14), WHITE)
	elif a == 2:
		mk.hull(0.6, 0.18, 0.08, Color(0.2, 0.22, 0.25), RED, WOOD2, 0.02, 0.0, 0.6)
		mk.box(Vector3(0, 0.05, -0.06), Vector3(0.1, 0.08, 0.14), WHITE)
		mk.cyl(Vector3(0, 0.08, -0.02), 0.02, 0.02, 0.14, 6, Color(0.15, 0.15, 0.15))
	else:
		mk.hull(0.6, 0.2, 0.08, pl.wall, pl.accent, pl.wall2, 0.03, 0.0, 0.6)
		mk.box(Vector3(0, 0.06, -0.05), Vector3(0.12, 0.08, 0.16), pl.wall2)
		mk.box(Vector3(0, 0.09, 0.01), Vector3(0.1, 0.03, 0.03), pl.win)
	mk.pop()

static func scaffold() -> ArrayMesh:
	if cache.has("scaffold"):
		return cache["scaffold"]
	var mk := MK.new()
	mk.ao = false
	var col := Color(0.72, 0.55, 0.32)
	for i in 6:
		var a := PI / 6.0 + TAU * i / 6.0
		var p := Vector3(cos(a) * 0.62, 0, sin(a) * 0.62)
		mk.box(p + Vector3(0, 0.55, 0), Vector3(0.04, 1.1, 0.04), col)
	for y in [0.35, 0.75, 1.1]:
		for i in 6:
			var a0 := PI / 6.0 + TAU * i / 6.0
			var a1 := PI / 6.0 + TAU * (i + 1) / 6.0
			mk.rod(Vector3(cos(a0) * 0.62, y, sin(a0) * 0.62), Vector3(cos(a1) * 0.62, y, sin(a1) * 0.62), 0.016, col, 4)
	mk.rod(Vector3(0.62, 0.0, 0.0), Vector3(-0.3, 1.1, 0.54), 0.015, col, 4)
	crate(mk, Vector3(0.3, 0, 0.45), 0.12)
	crate(mk, Vector3(-0.45, 0, 0.25), 0.1, Color(0.7, 0.7, 0.72))
	var m := commit(mk)
	cache["scaffold"] = m
	return m

static func rubble(variant: int) -> ArrayMesh:
	var key := "rubble%d" % variant
	if cache.has(key):
		return cache[key]
	var mk := MK.new()
	var cols := [Color(0.45, 0.42, 0.40), Color(0.32, 0.28, 0.26), Color(0.55, 0.45, 0.35), Color(0.22, 0.2, 0.2)]
	pad(mk, Color(0.36, 0.32, 0.30), 0.8, 0.03)
	for i in 14:
		var a := HexWorld.hash2(i, variant) * TAU
		var r := HexWorld.hash2(i, variant + 9) * 0.55
		var s := 0.08 + HexWorld.hash2(i, variant + 3) * 0.14
		mk.push_at(Vector3(cos(a) * r, s * 0.3, sin(a) * r), a * 2.0)
		mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), HexWorld.hash2(i, 7) - 0.5))
		mk.box(Vector3.ZERO, Vector3(s, s * 0.7, s * 1.3), cols[i % 4])
		mk.pop()
		mk.pop()
	mk.rod(Vector3(-0.2, 0.05, 0.1), Vector3(0.25, 0.25, -0.15), 0.03, Color(0.2, 0.15, 0.12))
	mk.rod(Vector3(0.1, 0.05, 0.3), Vector3(-0.15, 0.3, -0.05), 0.025, Color(0.2, 0.15, 0.12))
	var m := commit(mk)
	cache[key] = m
	return m

# ------------------------------------------------------------------ entry point
static func building(type: String, level: int, mask: int = 0) -> Dictionary:
	var key := "%s_%d_%d" % [type, level, mask if type == "wall" else 0]
	if cache.has(key):
		return cache[key]
	var a := Defs.level_age(type, level)
	var mk := MK.new()
	var out := {"base": null, "head": null, "head_y": 0.0, "spin": null, "spin_pos": Vector3.ZERO, "spin_axis": Vector3(0, 0, 1), "spin_speed": 1.0, "smoke": []}
	match type:
		"hq": _hq(mk, a, out)
		"house": _house(mk, a, out)
		"farm": _farm(mk, a, out)
		"dock": _dock(mk, a, out)
		"lumber": _lumber(mk, a, out)
		"quarry": _quarry(mk, a, out)
		"mine": _mine(mk, a, out)
		"library": _library(mk, a, out)
		"market": _market(mk, a, out)
		"barracks": _barracks(mk, a, out)
		"tower": _tower(mk, a, out)
		"artillery": _artillery(mk, a, out)
		"aa": _aa(mk, a, out)
		"airfield": _airfield(mk, a, out)
		"wall": _wall(mk, a, mask, out)
	out.base = commit(mk)
	cache[key] = out
	return out

static func _new_part() -> MK:
	var m := MK.new()
	m.ao = false
	return m

# ------------------------------------------------------------------ Town Hall
static func _hq(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	match a:
		0:
			pad(mk, p.stone2, 0.86, 0.08)
			mk.hexp(Vector3(0, 0.06, 0), 0.74, 0.1, p.stone, p.stone.lightened(0.05))
			# long hall with timber frame and steep thatch
			var c := Vector3(0, 0.16, -0.05)
			mk.box(c + Vector3(0, 0.22, 0), Vector3(0.8, 0.44, 0.5), p.wall)
			timber(mk, c, 0.8, 0.5, 0.44, p.beam)
			mk.gable(c + Vector3(0, 0.44, 0), 0.84, 0.54, 0.42, p.roof, p.wall2, 0.08)
			mk.box(c + Vector3(0, 0.87, 0), Vector3(0.96, 0.05, 0.06), p.roof2)
			door(mk, c + Vector3(0, 0, 0.25), 0.16, 0.24, p.beam)
			window(mk, a, c + Vector3(-0.25, 0.28, 0.25), 0.08, 0.1, Vector3(0, 0, 1))
			window(mk, a, c + Vector3(0.25, 0.28, 0.25), 0.08, 0.1, Vector3(0, 0, 1))
			# dragon-head gable ends
			mk.rod(c + Vector3(0.47, 0.8, 0), c + Vector3(0.6, 0.98, 0), 0.025, p.beam)
			mk.rod(c + Vector3(-0.47, 0.8, 0), c + Vector3(-0.6, 0.98, 0), 0.025, p.beam)
			# watchtower (archers shoot from here)
			var t := Vector3(0.48, 0.16, 0.36)
			for sx in [-1.0, 1.0]:
				for sz in [-1.0, 1.0]:
					mk.rod(t + Vector3(sx * 0.1, 0, sz * 0.1), t + Vector3(sx * 0.08, 1.3, sz * 0.08), 0.022, p.beam)
			mk.box(t + Vector3(0, 1.3, 0), Vector3(0.3, 0.05, 0.3), WOOD2)
			for i in 4:
				var o: Vector3 = [Vector3(0.14, 0, 0), Vector3(-0.14, 0, 0), Vector3(0, 0, 0.14), Vector3(0, 0, -0.14)][i]
				mk.box(t + Vector3(0, 1.38, 0) + o, Vector3(0.3 if o.z != 0 else 0.03, 0.12, 0.03 if o.z != 0 else 0.3), p.beam)
			mk.cone(t + Vector3(0, 1.48, 0), 0.24, 0.3, 6, p.roof)
			banner(mk, Vector3(-0.55, 0.16, 0.3), 0.75)
			banner(mk, t + Vector3(0, 1.75, 0), 0.25, FLAG, 0.14)
			barrel(mk, Vector3(-0.4, 0.16, 0.42))
			crate(mk, Vector3(-0.28, 0.16, 0.46))
		1:
			pad(mk, p.stone2, 0.86, 0.08)
			mk.hexp(Vector3(0, 0.06, 0), 0.76, 0.08, p.stone)
			var c := Vector3(0, 0.14, -0.08)
			mk.box(c + Vector3(0, 0.38, 0), Vector3(0.9, 0.76, 0.5), p.wall)
			mk.box(c + Vector3(0, 0.05, 0), Vector3(0.94, 0.1, 0.54), p.stone)
			mk.box(c + Vector3(0, 0.4, 0), Vector3(0.92, 0.04, 0.52), p.trim)
			mk.pyramid(c + Vector3(0, 0.76, 0), 0.9, 0.5, 0.3, p.roof, 0.05, 0.22)
			facade(mk, a, c, 0.9, 0.5, 0.08, 2, 0.32, 4, 2)
			# arcade on the front
			for i in 5:
				mk.box(c + Vector3(-0.36 + i * 0.18, 0.2, 0.28), Vector3(0.05, 0.3, 0.05), p.trim)
			mk.box(c + Vector3(0, 0.37, 0.28), Vector3(0.82, 0.05, 0.08), p.trim)
			# clock tower
			var t := c + Vector3(0, 0, 0.0)
			mk.box(t + Vector3(0, 0.95, 0), Vector3(0.26, 1.9, 0.26), p.wall2)
			mk.box(t + Vector3(0, 1.62, 0.135), Vector3(0.16, 0.16, 0.02), WHITE)
			mk.box(t + Vector3(0, 1.62, 0.15), Vector3(0.02, 0.08, 0.01), DARK)
			mk.box(t + Vector3(0, 1.9, 0), Vector3(0.32, 0.06, 0.32), p.trim)
			for sx in [-1.0, 1.0]:
				for sz in [-1.0, 1.0]:
					mk.box(t + Vector3(sx * 0.12, 2.0, sz * 0.12), Vector3(0.04, 0.16, 0.04), p.trim)
			mk.pyramid(t + Vector3(0, 2.08, 0), 0.3, 0.3, 0.42, p.roof)
			mk.sphere(t + Vector3(0, 2.52, 0), 0.035, p.accent, 6, 3)
			banner(mk, Vector3(-0.55, 0.14, 0.36), 0.8)
			banner(mk, Vector3(0.55, 0.14, 0.36), 0.8)
			bush(mk, Vector3(-0.3, 0.14, 0.45))
			bush(mk, Vector3(0.3, 0.14, 0.45))
		2:
			pad(mk, p.stone2, 0.86, 0.08)
			mk.hexp(Vector3(0, 0.06, 0), 0.78, 0.08, p.stone)
			var c := Vector3(0, 0.14, -0.1)
			mk.box(c + Vector3(0, 0.45, 0), Vector3(1.0, 0.9, 0.55), p.wall)
			mk.box(c + Vector3(0, 0.06, 0), Vector3(1.04, 0.12, 0.6), p.stone)
			for y in [0.33, 0.62, 0.9]:
				mk.box(c + Vector3(0, y, 0), Vector3(1.03, 0.035, 0.58), p.trim)
			facade(mk, a, c, 1.0, 0.55, 0.12, 3, 0.27, 5, 2, 0.08, 0.13)
			mk.pyramid(c + Vector3(0, 0.92, 0), 1.0, 0.55, 0.22, p.roof, 0.04, 0.3)
			# portico with columns
			for i in 4:
				mk.cyl(c + Vector3(-0.24 + i * 0.16, 0.12, 0.34), 0.035, 0.035, 0.46, 8, p.trim)
			mk.box(c + Vector3(0, 0.6, 0.34), Vector3(0.6, 0.06, 0.16), p.trim)
			mk.gable(c + Vector3(0, 0.63, 0.34), 0.6, 0.16, 0.14, p.trim, p.trim, 0.02)
			# central dome tower with clock
			var t := c + Vector3(0, 0.9, 0)
			mk.box(t + Vector3(0, 0.25, 0), Vector3(0.34, 0.5, 0.34), p.trim)
			mk.cyl(t + Vector3(0, 0.36, 0.172), 0.09, 0.09, 0.01, 10, WHITE)
			mk.dome(t + Vector3(0, 0.5, 0), 0.2, Color(0.35, 0.62, 0.55), 10, 4, 1.2)
			mk.rod(t + Vector3(0, 0.72, 0), t + Vector3(0, 0.95, 0), 0.015, p.accent)
			chimney(mk, c + Vector3(0.38, 0.9, -0.12), 0.25, p.wall2, out.smoke)
			chimney(mk, c + Vector3(-0.38, 0.9, -0.12), 0.25, p.wall2, out.smoke)
			banner(mk, Vector3(-0.6, 0.14, 0.4), 0.9)
			banner(mk, Vector3(0.6, 0.14, 0.4), 0.9)
		3:
			pad(mk, p.stone2, 0.88, 0.06)
			mk.hexp(Vector3(0, 0.04, 0), 0.8, 0.04, p.stone)
			# plaza podium + glass tower + wing
			mk.box(Vector3(0, 0.22, -0.05), Vector3(1.1, 0.36, 0.7), p.wall)
			mk.box(Vector3(0, 0.36, 0.31), Vector3(1.0, 0.18, 0.02), p.win)
			var t := Vector3(-0.12, 0.4, -0.1)
			mk.box(t + Vector3(0, 1.0, 0), Vector3(0.5, 2.0, 0.45), p.wall2)
			for f in 9:
				mk.box(t + Vector3(0, 0.2 + f * 0.2, 0), Vector3(0.52, 0.11, 0.47), p.win)
			mk.box(t + Vector3(0, 2.02, 0), Vector3(0.54, 0.04, 0.49), p.wall)
			mk.cyl(t + Vector3(0, 2.04, 0), 0.16, 0.16, 0.02, 12, Color(0.3, 0.3, 0.32))
			mk.box(t + Vector3(0, 2.065, 0), Vector3(0.12, 0.005, 0.03), WHITE)
			mk.rod(t + Vector3(0.18, 2.04, -0.15), t + Vector3(0.18, 2.6, -0.15), 0.012, p.metal)
			mk.glow = true
			mk.sphere(t + Vector3(0.18, 2.62, -0.15), 0.025, RED, 5, 3)
			mk.glow = false
			mk.box(Vector3(0.38, 0.6, -0.1), Vector3(0.3, 0.5, 0.4), p.wall)
			facade(mk, a, Vector3(0.38, 0.35, -0.1), 0.3, 0.4, 0.0, 2, 0.24, 2, 2, 0.1, 0.12)
			# flag poles
			for i in 3:
				banner(mk, Vector3(-0.4 + i * 0.2, 0.4, 0.42), 0.55, FLAG if i != 1 else FLAG2, 0.14)
			tree(mk, Vector3(0.55, 0.04, 0.5), 0.9)
			tree(mk, Vector3(-0.6, 0.04, 0.45), 0.9)
		_:
			pad(mk, p.stone2, 0.88, 0.06)
			mk.hexp(Vector3(0, 0.04, 0), 0.8, 0.06, p.wall, p.wall)
			mk.dome(Vector3(0, 0.1, 0), 0.62, p.wall2, 12, 4, 0.55)
			mk.glow = true
			mk.ring(Vector3(0, 0.12, 0), 0.66, 0.025, CYAN, 18, 4)
			mk.glow = false
			# tapering spire with glowing rings
			mk.cyl(Vector3(0, 0.3, 0), 0.3, 0.12, 2.9, 8, p.wall, p.wall)
			mk.glow = true
			for i in 6:
				var y := 0.7 + i * 0.4
				var r := lerpf(0.29, 0.14, (y - 0.3) / 2.9) + 0.02
				mk.cyl(Vector3(0, y, 0), r, r, 0.05, 8, CYAN, null, false)
			mk.sphere(Vector3(0, 3.35, 0), 0.08, CYAN, 8, 5)
			mk.glow = false
			mk.rod(Vector3(0, 3.2, 0), Vector3(0, 3.8, 0), 0.015, p.metal)
			# sky gardens
			for i in 3:
				var an := TAU * i / 3.0 + 0.4
				mk.box(Vector3(cos(an) * 0.32, 1.4 + i * 0.5, sin(an) * 0.32), Vector3(0.22, 0.04, 0.22), p.wall2)
				bush(mk, Vector3(cos(an) * 0.32, 1.42 + i * 0.5, sin(an) * 0.32), 0.07)
			banner(mk, Vector3(0.6, 0.1, 0.38), 0.6, FLAG, 0.16)

# ------------------------------------------------------------------ Houses
static func _house(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	match a:
		0:
			pad(mk, Color(0.55, 0.5, 0.35), 0.7, 0.03)
			var c := Vector3(0, 0.02, -0.05)
			mk.box(c + Vector3(0, 0.03, 0), Vector3(0.56, 0.06, 0.44), p.stone2)
			mk.box(c + Vector3(0, 0.2, 0), Vector3(0.52, 0.3, 0.4), p.wall)
			timber(mk, c + Vector3(0, 0.05, 0), 0.52, 0.4, 0.3, p.beam)
			mk.gable(c + Vector3(0, 0.35, 0), 0.52, 0.4, 0.34, p.roof, p.wall2, 0.09)
			mk.box(c + Vector3(0, 0.69, 0), Vector3(0.66, 0.05, 0.07), p.roof2)
			door(mk, c + Vector3(0.08, 0.05, 0.2), 0.11, 0.18, p.beam)
			window(mk, a, c + Vector3(-0.14, 0.24, 0.2), 0.08, 0.07, Vector3(0, 0, 1))
			chimney(mk, c + Vector3(0.16, 0.45, -0.1), 0.3, p.stone, out.smoke, 0.045)
			fence(mk, Vector3(-0.5, 0.02, 0.35), Vector3(-0.1, 0.02, 0.5))
			mk.cyl(Vector3(0.4, 0.02, 0.32), 0.07, 0.06, 0.08, 7, HAY)
			bush(mk, Vector3(-0.36, 0.02, -0.34), 0.07)
		1:
			pad(mk, p.stone2, 0.72, 0.03)
			var c := Vector3(0, 0.02, -0.04)
			mk.box(c + Vector3(0, 0.14, 0), Vector3(0.56, 0.28, 0.44), p.stone)
			mk.box(c + Vector3(0, 0.42, 0), Vector3(0.6, 0.28, 0.48), p.wall2)
			timber(mk, c + Vector3(0, 0.28, 0), 0.6, 0.48, 0.28, p.beam)
			mk.gable(c + Vector3(0, 0.56, 0), 0.6, 0.48, 0.3, p.roof, p.wall2, 0.07)
			door(mk, c + Vector3(-0.1, 0.0, 0.22), 0.12, 0.2, p.beam)
			window(mk, a, c + Vector3(0.12, 0.15, 0.22), 0.09, 0.1, Vector3(0, 0, 1))
			window(mk, a, c + Vector3(-0.14, 0.44, 0.24), 0.09, 0.1, Vector3(0, 0, 1))
			window(mk, a, c + Vector3(0.14, 0.44, 0.24), 0.09, 0.1, Vector3(0, 0, 1))
			mk.box(c + Vector3(0.14, 0.38, 0.27), Vector3(0.12, 0.03, 0.04), Color(0.85, 0.3, 0.45))
			chimney(mk, c + Vector3(-0.18, 0.62, -0.1), 0.25, p.stone, out.smoke, 0.045)
			bush(mk, Vector3(0.36, 0.02, 0.36), 0.08)
			barrel(mk, Vector3(-0.38, 0.02, 0.3), 0.05)
		2:
			pad(mk, p.stone2, 0.74, 0.03)
			for i in 2:
				var c := Vector3(-0.2 + i * 0.4, 0.02, -0.05)
				var wc: Color = p.wall if i == 0 else p.wall2
				mk.box(c + Vector3(0, 0.36, 0), Vector3(0.38, 0.72, 0.5), wc)
				mk.box(c + Vector3(0, 0.04, 0), Vector3(0.4, 0.08, 0.52), p.stone)
				facade(mk, a, c, 0.38, 0.5, 0.08, 3, 0.21, 2, 0, 0.07, 0.11)
				mk.gable(c + Vector3(0, 0.72, 0), 0.38, 0.5, 0.2, p.roof, wc, 0.03)
				chimney(mk, c + Vector3(0.12, 0.82, -0.12), 0.18, p.wall2, out.smoke, 0.04)
				door(mk, c + Vector3(0, 0.08, 0.25), 0.1, 0.17, Color(0.15, 0.25, 0.4) if i == 0 else Color(0.3, 0.15, 0.12))
				mk.box(c + Vector3(0, 0.27, 0.27), Vector3(0.16, 0.03, 0.06), p.trim)
			mk.box(Vector3(0, 0.05, 0.4), Vector3(0.8, 0.02, 0.12), p.stone2)
		3:
			pad(mk, p.stone2, 0.78, 0.03)
			var c := Vector3(0, 0.02, -0.05)
			var h := 1.3
			mk.box(c + Vector3(0, h * 0.5, 0), Vector3(0.66, h, 0.5), p.wall)
			for f in 5:
				var y := 0.18 + f * 0.24
				mk.box(c + Vector3(0, y, 0.26), Vector3(0.6, 0.12, 0.02), p.win)
				mk.box(c + Vector3(0, y - 0.08, 0.3), Vector3(0.66, 0.025, 0.1), p.wall2)
				mk.box(c + Vector3(0.335, y, 0), Vector3(0.02, 0.12, 0.42), p.win)
				mk.box(c + Vector3(-0.335, y, 0), Vector3(0.02, 0.12, 0.42), p.win)
			mk.box(c + Vector3(0, h + 0.02, 0), Vector3(0.7, 0.04, 0.54), p.roof)
			mk.cyl(c + Vector3(0.18, h + 0.04, -0.1), 0.08, 0.08, 0.16, 8, p.metal)
			mk.cone(c + Vector3(0.18, h + 0.2, -0.1), 0.09, 0.05, 8, p.metal)
			mk.box(c + Vector3(-0.15, h + 0.08, 0.05), Vector3(0.16, 0.12, 0.12), p.wall2)
			door(mk, c + Vector3(0, 0.0, 0.25), 0.14, 0.15, p.metal)
			tree(mk, Vector3(0.5, 0.02, 0.45), 0.8)
		_:
			pad(mk, p.stone2, 0.78, 0.04)
			var h := 2.0
			mk.cyl(Vector3(0, 0.02, 0), 0.38, 0.32, h, 10, p.wall, p.wall)
			mk.glow = true
			for f in 7:
				var y := 0.25 + f * 0.26
				var r := lerpf(0.38, 0.32, y / h) + 0.006
				mk.cyl(Vector3(0, y, 0), r, r, 0.07, 10, p.win, null, false)
			mk.glow = false
			for f in 3:
				var y2 := 0.5 + f * 0.6
				mk.cyl(Vector3(0, y2, 0), 0.44, 0.44, 0.03, 10, p.wall2)
			mk.dome(Vector3(0, h + 0.02, 0), 0.3, Color(0.4, 0.75, 0.5), 10, 3, 0.8)
			mk.glow = true
			mk.ring(Vector3(0, h + 0.03, 0), 0.32, 0.015, CYAN, 14, 3)
			mk.glow = false
			bush(mk, Vector3(0.5, 0.04, 0.4), 0.08)
			bush(mk, Vector3(-0.5, 0.04, 0.35), 0.08)

# ------------------------------------------------------------------ Farms
static func _farm(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	match a:
		0:
			pad(mk, Color(0.48, 0.62, 0.28), 0.86, 0.02)
			field(mk, Vector3(-0.3, 0.02, 0.15), 0.42, 0.7, WHEAT, 5)
			field(mk, Vector3(0.2, 0.02, 0.38), 0.46, 0.3, CROP, 4)
			fence(mk, Vector3(-0.55, 0.02, -0.25), Vector3(-0.55, 0.02, 0.52))
			# little wooden post mill
			var m := Vector3(0.32, 0.02, -0.2)
			mk.cyl(m, 0.12, 0.09, 0.42, 6, p.wall2)
			timber(mk, m + Vector3(0, 0.0, 0), 0.14, 0.14, 0.42, p.beam)
			mk.cone(m + Vector3(0, 0.42, 0), 0.14, 0.2, 6, p.roof)
			out.spin = _sails(0.32, WOOD2, Color(0.92, 0.88, 0.78))
			out.spin_pos = m + Vector3(0, 0.38, 0.12)
			out.spin_speed = 1.2
			mk.cyl(Vector3(0.45, 0.02, 0.1), 0.07, 0.06, 0.08, 7, HAY)
			sheep(mk, Vector3(0.1, 0.02, -0.45), 0.6)
			sheep(mk, Vector3(-0.05, 0.02, -0.55), 2.0)
		1:
			pad(mk, Color(0.48, 0.62, 0.28), 0.86, 0.02)
			field(mk, Vector3(-0.32, 0.02, 0.12), 0.4, 0.76, WHEAT, 5)
			field(mk, Vector3(0.18, 0.02, 0.42), 0.5, 0.26, Color(0.85, 0.55, 0.2), 5)
			# barn with terracotta roof
			var b := Vector3(0.22, 0.02, -0.12)
			mk.box(b + Vector3(0, 0.15, 0), Vector3(0.4, 0.3, 0.3), p.wall)
			timber(mk, b, 0.4, 0.3, 0.3, p.beam)
			mk.gable(b + Vector3(0, 0.3, 0), 0.4, 0.3, 0.2, p.roof, p.wall, 0.05)
			door(mk, b + Vector3(0, 0, 0.15), 0.14, 0.18, p.beam)
			# stone tower windmill
			var m := Vector3(-0.3, 0.02, -0.42)
			mk.cyl(m, 0.13, 0.09, 0.6, 8, p.stone)
			mk.cone(m + Vector3(0, 0.6, 0), 0.12, 0.14, 8, p.roof)
			out.spin = _sails(0.36, WOOD2, WHITE)
			out.spin_pos = m + Vector3(0, 0.55, 0.12)
			out.spin_speed = 1.0
			cow(mk, Vector3(0.5, 0.02, 0.15), 0.4)
			fence(mk, Vector3(0.6, 0.02, -0.1), Vector3(0.6, 0.02, 0.32), WOOD2, 3)
		2:
			pad(mk, Color(0.48, 0.62, 0.28), 0.86, 0.02)
			field(mk, Vector3(-0.3, 0.02, 0.18), 0.44, 0.62, WHEAT, 6)
			field(mk, Vector3(0.25, 0.02, 0.42), 0.4, 0.26, CROP, 5)
			var b := Vector3(0.18, 0.02, -0.15)
			mk.box(b + Vector3(0, 0.18, 0), Vector3(0.42, 0.36, 0.32), RED)
			mk.box(b + Vector3(0, 0.18, 0.162), Vector3(0.16, 0.24, 0.01), WHITE)
			mk.box(b + Vector3(0, 0.18, 0.165), Vector3(0.02, 0.24, 0.01), RED.darkened(0.2))
			mk.gable(b + Vector3(0, 0.36, 0), 0.42, 0.32, 0.18, p.roof, RED, 0.04)
			# silo
			var s := Vector3(-0.2, 0.02, -0.38)
			mk.cyl(s, 0.12, 0.12, 0.62, 10, Color(0.75, 0.75, 0.72))
			mk.dome(s + Vector3(0, 0.62, 0), 0.12, p.metal, 10, 3)
			for y in [0.15, 0.3, 0.45]:
				mk.cyl(s + Vector3(0, y, 0), 0.125, 0.125, 0.015, 10, p.metal, null, false)
			# water tower
			var wt := Vector3(0.55, 0.02, 0.1)
			for sx in [-1.0, 1.0]:
				mk.rod(wt + Vector3(sx * 0.06, 0, 0), wt + Vector3(sx * 0.05, 0.4, 0), 0.012, WOOD)
			mk.cyl(wt + Vector3(0, 0.4, 0), 0.09, 0.09, 0.12, 8, WOOD2)
			mk.cone(wt + Vector3(0, 0.52, 0), 0.1, 0.06, 8, p.roof)
			chimney(mk, b + Vector3(-0.12, 0.38, -0.08), 0.14, p.wall2, out.smoke, 0.03)
		3:
			pad(mk, Color(0.48, 0.62, 0.28), 0.86, 0.02)
			field(mk, Vector3(-0.25, 0.02, 0.2), 0.55, 0.6, WHEAT, 8)
			for i in 2:
				var s := Vector3(0.3 + i * 0.2, 0.02, -0.3)
				mk.cyl(s, 0.09, 0.09, 0.7, 10, p.metal)
				mk.cone(s + Vector3(0, 0.7, 0), 0.1, 0.08, 10, p.metal.lightened(0.15))
			mk.rod(Vector3(0.3, 0.75, -0.3), Vector3(0.5, 0.75, -0.3), 0.015, p.metal)
			mk.box(Vector3(-0.2, 0.15, -0.35), Vector3(0.5, 0.26, 0.3), Color(0.85, 0.85, 0.82))
			mk.box(Vector3(-0.2, 0.3, -0.35), Vector3(0.52, 0.04, 0.32), p.roof)
			# tractor
			var t := Vector3(0.32, 0.02, 0.25)
			mk.box(t + Vector3(0, 0.07, 0), Vector3(0.1, 0.06, 0.16), Color(0.2, 0.6, 0.25))
			mk.box(t + Vector3(0, 0.12, -0.03), Vector3(0.08, 0.06, 0.06), Color(0.2, 0.6, 0.25))
			mk.push_at(t + Vector3(0, 0.05, -0.05))
			mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), PI / 2))
			mk.cyl(Vector3(0, -0.07, 0), 0.05, 0.05, 0.14, 8, DARK)
			mk.pop()
			mk.pop()
			mk.push_at(t + Vector3(0, 0.03, 0.06))
			mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), PI / 2))
			mk.cyl(Vector3(0, -0.06, 0), 0.03, 0.03, 0.12, 8, DARK)
			mk.pop()
			mk.pop()
		_:
			pad(mk, p.stone2, 0.86, 0.03)
			mk.dome(Vector3(-0.1, 0.04, 0.05), 0.5, Color(0.55, 0.85, 0.95), 12, 4, 0.75)
			mk.glow = true
			for i in 4:
				mk.box(Vector3(-0.1 - 0.24 + i * 0.16, 0.1, 0.05), Vector3(0.08, 0.06, 0.6), Color(0.45, 1.0, 0.5))
			mk.ring(Vector3(-0.1, 0.05, 0.05), 0.5, 0.02, CYAN, 16, 3)
			mk.glow = false
			for i in 3:
				mk.push_at(Vector3(0.58, 0.08 + i * 0.0, -0.4 + i * 0.3), 0.3)
				mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), -0.5))
				mk.box(Vector3.ZERO, Vector3(0.2, 0.015, 0.22), Color(0.15, 0.2, 0.4))
				mk.pop()
				mk.pop()
			mk.box(Vector3(0.45, 0.12, 0.45), Vector3(0.2, 0.2, 0.16), p.wall)

static func _sails(r: float, frame: Color, cloth: Color) -> ArrayMesh:
	var mk := _new_part()
	mk.cyl(Vector3(0, 0, -0.02), 0.03, 0.03, 0.04, 6, frame)
	for i in 4:
		var an := TAU * i / 4.0
		var d := Vector3(cos(an), sin(an), 0)
		var side := Vector3(-sin(an), cos(an), 0)
		mk.rod(Vector3.ZERO, d * r, 0.012, frame, 4)
		var c := d * r * 0.58 + side * 0.04
		mk.push_basis(c, Basis(side, d, Vector3(0, 0, 1)))
		mk.box(Vector3.ZERO, Vector3(0.07, r * 0.75, 0.008), cloth)
		mk.pop()
	return commit(mk)

# ------------------------------------------------------------------ Docks
static func _dock(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	# a pier runs out over the water in front (+z)
	var deck: Color = WOOD2 if a <= 2 else p.stone
	var post: Color = WOOD if a <= 2 else p.stone2
	match a:
		0, 1:
			pad(mk, Color(0.8, 0.72, 0.5) if a == 0 else p.stone, 0.72, 0.03)
			mk.box(Vector3(0, 0.03, 0.85), Vector3(0.26, 0.04, 1.0), deck)
			for i in 4:
				for sx in [-0.12, 0.12]:
					mk.cyl(Vector3(sx, -1.0, 0.45 + i * 0.3), 0.025, 0.025, 1.05, 6, post)
			var h := Vector3(-0.15, 0.02, -0.2)
			if a == 0:
				mk.box(h + Vector3(0, 0.14, 0), Vector3(0.34, 0.28, 0.3), WOOD2)
				mk.gable(h + Vector3(0, 0.28, 0), 0.34, 0.3, 0.2, p.roof, WOOD2, 0.05)
				# drying nets
				mk.rod(Vector3(0.3, 0.02, -0.35), Vector3(0.3, 0.3, -0.35), 0.012, WOOD)
				mk.rod(Vector3(0.55, 0.02, -0.15), Vector3(0.55, 0.3, -0.15), 0.012, WOOD)
				mk.boxr(Vector3(0.425, 0.2, -0.25), Vector3(0.005, 0.18, 0.3), 0.9, Color(0.75, 0.7, 0.55))
				boat(mk, Vector3(0.3, -0.2, 1.0), 0.2, 1.0, 0)
			else:
				mk.box(h + Vector3(0, 0.2, 0), Vector3(0.44, 0.4, 0.34), p.wall)
				mk.gable(h + Vector3(0, 0.4, 0), 0.44, 0.34, 0.22, p.roof, p.wall, 0.05)
				door(mk, h + Vector3(0, 0, 0.17), 0.14, 0.2, p.beam)
				# wooden crane
				mk.rod(Vector3(0.12, 0.05, 1.2), Vector3(0.12, 0.6, 1.2), 0.025, WOOD)
				mk.rod(Vector3(0.12, 0.55, 1.2), Vector3(0.45, 0.55, 1.35), 0.018, WOOD)
				mk.rod(Vector3(0.45, 0.55, 1.35), Vector3(0.45, 0.25, 1.35), 0.004, DARK)
				crate(mk, Vector3(0.38, 0.17, 1.35), 0.08)
				boat(mk, Vector3(-0.32, -0.2, 1.05), -0.1, 1.3, 1)
			barrel(mk, Vector3(0.05, 0.05, 0.6), 0.04)
			crate(mk, Vector3(-0.06, 0.05, 0.75), 0.07)
		2:
			pad(mk, p.stone, 0.76, 0.04)
			mk.box(Vector3(0, 0.03, 0.85), Vector3(0.4, 0.06, 1.0), p.stone2)
			mk.box(Vector3(0, -0.5, 0.85), Vector3(0.38, 1.0, 0.98), p.stone2.darkened(0.15))
			var h := Vector3(-0.2, 0.02, -0.18)
			mk.box(h + Vector3(0, 0.22, 0), Vector3(0.5, 0.44, 0.38), p.wall)
			mk.gable(h + Vector3(0, 0.44, 0), 0.5, 0.38, 0.18, p.roof, p.wall, 0.04)
			facade(mk, a, h, 0.5, 0.38, 0.05, 2, 0.2, 3, 0, 0.07, 0.09)
			stack(mk, Vector3(0.3, 0.02, -0.35), 0.5, 0.05, p.wall2, p.trim, out.smoke)
			# iron crane
			mk.rod(Vector3(-0.1, 0.06, 1.15), Vector3(-0.1, 0.7, 1.15), 0.03, p.metal)
			mk.rod(Vector3(-0.1, 0.68, 1.15), Vector3(0.35, 0.6, 1.4), 0.02, p.metal)
			mk.rod(Vector3(0.35, 0.6, 1.4), Vector3(0.35, 0.3, 1.4), 0.004, DARK)
			boat(mk, Vector3(0.38, -0.18, 1.05), 0.05, 1.5, 2)
		3:
			pad(mk, p.stone, 0.78, 0.04)
			mk.box(Vector3(0, 0.03, 0.85), Vector3(0.5, 0.06, 1.0), p.stone)
			mk.box(Vector3(0, -0.5, 0.85), Vector3(0.48, 1.0, 0.98), p.stone2)
			mk.box(Vector3(-0.15, 0.22, -0.2), Vector3(0.6, 0.4, 0.4), p.wall2)
			mk.box(Vector3(-0.15, 0.43, -0.2), Vector3(0.62, 0.04, 0.42), p.roof)
			mk.box(Vector3(-0.15, 0.2, 0.005), Vector3(0.3, 0.28, 0.01), p.accent)
			# containers
			var cc := [Color(0.85, 0.3, 0.2), Color(0.2, 0.45, 0.8), Color(0.95, 0.7, 0.15)]
			for i in 3:
				mk.box(Vector3(0.38, 0.08 + (0.11 if i == 2 else 0.0), -0.2 + (i % 2) * 0.22), Vector3(0.14, 0.11, 0.2), cc[i])
			# gantry crane
			for sx in [-0.22, 0.22]:
				mk.box(Vector3(sx, 0.4, 1.0), Vector3(0.04, 0.75, 0.04), p.accent)
			mk.box(Vector3(0, 0.78, 1.05), Vector3(0.5, 0.05, 0.6), p.accent)
			boat(mk, Vector3(0.45, -0.18, 1.1), 0.0, 1.6, 3)
		_:
			pad(mk, p.stone, 0.78, 0.04)
			mk.box(Vector3(0, 0.03, 0.8), Vector3(0.3, 0.05, 0.9), p.wall)
			for i in 2:
				var c := Vector3(-0.35 + i * 0.7, -0.05, 1.05)
				mk.cyl(c, 0.3, 0.3, 0.06, 14, p.wall2)
				mk.cyl(c + Vector3(0, 0.0, 0), 0.26, 0.26, 0.065, 14, Color(0.2, 0.55, 0.7))
				mk.glow = true
				mk.ring(c + Vector3(0, 0.07, 0), 0.3, 0.012, CYAN, 14, 3)
				mk.glow = false
			mk.dome(Vector3(-0.1, 0.04, -0.2), 0.35, p.wall, 10, 3, 0.8)
			mk.glow = true
			mk.box(Vector3(-0.1, 0.12, 0.13), Vector3(0.2, 0.06, 0.02), CYAN)
			mk.glow = false
			boat(mk, Vector3(0.0, -0.18, 1.5), 1.57, 1.4, 4)

# ------------------------------------------------------------------ Lumber
static func _logpile(mk: MK, c: Vector3, n: int = 3, col: Color = WOOD) -> void:
	for i in n:
		for j in n - i:
			mk.push_at(c + Vector3(-0.05 * (n - i - 1) + j * 0.1, 0.045 + i * 0.08, 0))
			mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), PI / 2))
			mk.cyl(Vector3(0, -0.14, 0), 0.045, 0.045, 0.28, 7, col, Color(0.85, 0.7, 0.45))
			mk.pop()
			mk.pop()

static func _lumber(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	match a:
		0:
			pad(mk, Color(0.45, 0.55, 0.28), 0.8, 0.02)
			var c := Vector3(-0.1, 0.02, -0.15)
			# log cabin
			for i in 5:
				mk.push_at(c + Vector3(0, 0.04 + i * 0.065, 0.17))
				mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), PI / 2))
				mk.cyl(Vector3(0, -0.22, 0), 0.035, 0.035, 0.44, 6, WOOD)
				mk.pop()
				mk.pop()
			mk.box(c + Vector3(0, 0.17, 0), Vector3(0.42, 0.32, 0.32), WOOD2)
			mk.gable(c + Vector3(0, 0.33, 0), 0.42, 0.34, 0.2, p.roof, WOOD2, 0.06)
			door(mk, c + Vector3(0.1, 0.02, 0.2), 0.09, 0.16, DARK)
			_logpile(mk, Vector3(0.35, 0.02, 0.2), 3)
			mk.cyl(Vector3(0.0, 0.02, 0.35), 0.07, 0.07, 0.07, 8, WOOD, Color(0.85, 0.7, 0.45))
			mk.rod(Vector3(0.0, 0.09, 0.35), Vector3(0.08, 0.2, 0.33), 0.01, WOOD)
			mk.box(Vector3(0.08, 0.2, 0.33), Vector3(0.05, 0.03, 0.01), p.metal)
			mk.cyl(Vector3(0.45, 0.02, -0.3), 0.06, 0.06, 0.05, 7, WOOD, Color(0.85, 0.7, 0.45))
		1:
			pad(mk, Color(0.45, 0.55, 0.28), 0.82, 0.02)
			var c := Vector3(-0.1, 0.02, -0.12)
			mk.box(c + Vector3(0, 0.08, 0), Vector3(0.5, 0.16, 0.38), p.stone)
			mk.box(c + Vector3(0, 0.3, 0), Vector3(0.5, 0.28, 0.38), p.wall)
			timber(mk, c + Vector3(0, 0.16, 0), 0.5, 0.38, 0.28, p.beam)
			mk.gable(c + Vector3(0, 0.44, 0), 0.5, 0.38, 0.22, p.roof, p.wall, 0.05)
			# mill race + water wheel on the side
			mk.box(Vector3(0.28, 0.03, -0.12), Vector3(0.12, 0.03, 0.6), WATER)
			out.spin = _wheel(0.22, WOOD, WOOD2)
			out.spin_pos = Vector3(0.24, 0.24, -0.12)
			out.spin_axis = Vector3(1, 0, 0)
			out.spin_speed = 1.5
			_logpile(mk, Vector3(-0.3, 0.02, 0.38), 3)
			_logpile(mk, Vector3(0.15, 0.02, 0.38), 2, WOOD2)
		2:
			pad(mk, p.stone2, 0.82, 0.03)
			var c := Vector3(-0.1, 0.02, -0.12)
			mk.box(c + Vector3(0, 0.25, 0), Vector3(0.6, 0.5, 0.4), p.wall)
			mk.gable(c + Vector3(0, 0.5, 0), 0.6, 0.4, 0.18, p.roof, p.wall, 0.04)
			facade(mk, a, c, 0.6, 0.4, 0.06, 2, 0.21, 3, 2, 0.07, 0.1)
			stack(mk, Vector3(0.35, 0.02, -0.3), 0.85, 0.06, p.wall2, p.trim, out.smoke)
			# conveyor with planks
			mk.rod(Vector3(0.0, 0.2, 0.15), Vector3(0.45, 0.05, 0.45), 0.02, p.metal)
			_logpile(mk, Vector3(0.45, 0.02, 0.35), 3, WOOD)
			for i in 3:
				mk.box(Vector3(-0.35, 0.03 + i * 0.03, 0.4), Vector3(0.3, 0.025, 0.12), WOOD2)
		3:
			pad(mk, p.stone2, 0.84, 0.03)
			# corrugated hall
			var c := Vector3(-0.05, 0.02, -0.12)
			mk.box(c + Vector3(0, 0.22, 0), Vector3(0.7, 0.44, 0.42), Color(0.45, 0.58, 0.68))
			for i in 8:
				mk.box(c + Vector3(-0.31 + i * 0.09, 0.22, 0.215), Vector3(0.03, 0.42, 0.01), Color(0.4, 0.52, 0.62))
			mk.gable(c + Vector3(0, 0.44, 0), 0.7, 0.42, 0.12, p.roof, Color(0.45, 0.58, 0.68), 0.02)
			mk.box(c + Vector3(0.15, 0.14, 0.215), Vector3(0.2, 0.24, 0.02), DARK)
			_logpile(mk, Vector3(-0.35, 0.02, 0.38), 3)
			_logpile(mk, Vector3(0.0, 0.02, 0.38), 3)
			# forklift
			var f := Vector3(0.42, 0.02, 0.35)
			mk.box(f + Vector3(0, 0.06, 0), Vector3(0.08, 0.08, 0.12), p.accent)
			mk.box(f + Vector3(0, 0.12, -0.02), Vector3(0.07, 0.06, 0.06), DARK)
			mk.box(f + Vector3(0, 0.07, 0.09), Vector3(0.06, 0.12, 0.01), p.metal)
		_:
			pad(mk, p.stone2, 0.84, 0.04)
			mk.dome(Vector3(-0.15, 0.04, -0.1), 0.42, p.wall, 10, 3, 0.9)
			mk.glow = true
			mk.box(Vector3(-0.15, 0.14, 0.31), Vector3(0.25, 0.14, 0.02), CYAN)
			mk.glow = false
			for i in 3:
				var v := Vector3(0.45, 0.04, -0.4 + i * 0.32)
				mk.cyl(v, 0.11, 0.11, 0.36, 10, Color(0.6, 0.9, 0.95))
				tree(mk, v + Vector3(0, 0.02, 0), 0.9)
				mk.cyl(v + Vector3(0, 0.36, 0), 0.12, 0.12, 0.03, 10, p.wall2)
			_logpile(mk, Vector3(-0.3, 0.04, 0.42), 2, Color(0.75, 0.6, 0.4))

static func _wheel(r: float, rim: Color, paddle: Color) -> ArrayMesh:
	var mk := _new_part()
	mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), PI / 2))
	mk.ring(Vector3(0, 0.03, 0), r, 0.018, rim, 14, 4)
	mk.ring(Vector3(0, -0.03, 0), r, 0.018, rim, 14, 4)
	mk.cyl(Vector3(0, -0.06, 0), 0.03, 0.03, 0.12, 6, rim)
	for i in 8:
		var an := TAU * i / 8.0
		mk.rod(Vector3.ZERO, Vector3(cos(an) * r, 0, sin(an) * r), 0.01, rim, 4)
		mk.boxr(Vector3(cos(an) * r, 0, sin(an) * r), Vector3(0.05, 0.08, 0.012), -an, paddle)
	mk.pop()
	return commit(mk)

# ------------------------------------------------------------------ Quarry
static func _quarry(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	var rock := Color(0.62, 0.6, 0.57)
	# cut rock terraces at the back
	pad(mk, Color(0.6, 0.56, 0.5), 0.84, 0.03)
	mk.box(Vector3(-0.1, 0.18, -0.4), Vector3(0.9, 0.36, 0.32), rock, rock.lightened(0.1))
	mk.box(Vector3(-0.1, 0.1, -0.15), Vector3(0.8, 0.2, 0.2), rock.darkened(0.05), rock.lightened(0.08))
	for i in 4:
		crate(mk, Vector3(-0.35 + i * 0.12, 0.02, 0.15 + (i % 2) * 0.12), 0.09, Color(0.78, 0.76, 0.72))
	match a:
		0:
			# treadwheel crane
			mk.rod(Vector3(0.35, 0.02, 0.1), Vector3(0.3, 0.6, -0.1), 0.02, WOOD)
			mk.rod(Vector3(0.3, 0.6, -0.1), Vector3(0.0, 0.5, -0.15), 0.015, WOOD)
			mk.rod(Vector3(0.0, 0.5, -0.15), Vector3(0.0, 0.3, -0.15), 0.004, DARK)
			out.spin = _wheel(0.13, WOOD, WOOD2)
			out.spin_pos = Vector3(0.38, 0.15, 0.25)
			out.spin_axis = Vector3(1, 0, 0)
			out.spin_speed = 0.8
			person(mk, Vector3(0.1, 0.02, 0.4), Color(0.6, 0.35, 0.2))
		1:
			mk.box(Vector3(0.35, 0.15, 0.25), Vector3(0.3, 0.26, 0.25), p.wall)
			mk.gable(Vector3(0.35, 0.28, 0.25), 0.3, 0.25, 0.15, p.roof, p.wall, 0.04)
			# rail cart
			mk.box(Vector3(0.0, 0.025, 0.45), Vector3(0.6, 0.01, 0.06), p.metal)
			mk.box(Vector3(-0.1, 0.07, 0.45), Vector3(0.12, 0.07, 0.1), WOOD)
			mk.box(Vector3(-0.1, 0.12, 0.45), Vector3(0.1, 0.04, 0.08), rock)
		2:
			var bl := Vector3(0.35, 0.02, 0.2)
			mk.box(bl + Vector3(0, 0.12, 0), Vector3(0.26, 0.22, 0.22), p.wall)
			stack(mk, bl + Vector3(0.05, 0.22, -0.05), 0.35, 0.04, p.metal, p.trim, out.smoke)
			mk.rod(Vector3(0.2, 0.24, 0.1), Vector3(-0.1, 0.7, -0.2), 0.025, p.metal)
			mk.rod(Vector3(-0.1, 0.7, -0.2), Vector3(-0.1, 0.4, -0.2), 0.004, DARK)
		3:
			for i in 2:
				var s := Vector3(0.3 + i * 0.22, 0.02, 0.0)
				mk.cyl(s + Vector3(0, 0.25, 0), 0.09, 0.09, 0.4, 10, Color(0.85, 0.85, 0.82))
				mk.cone(s + Vector3(0, 0.25, 0), 0.09, -0.15, 10, Color(0.85, 0.85, 0.82))
				for sx in [-0.06, 0.06]:
					mk.box(s + Vector3(sx, 0.12, 0), Vector3(0.015, 0.25, 0.015), p.metal)
			out.spin = _drum(p.accent)
			out.spin_pos = Vector3(0.3, 0.12, 0.4)
			out.spin_axis = Vector3(0, 0, 1)
			out.spin_speed = 2.0
			mk.box(Vector3(0.3, 0.05, 0.4), Vector3(0.14, 0.06, 0.22), p.accent)
		_:
			mk.hexp(Vector3(0.3, 0.02, 0.25), 0.18, 0.25, p.wall, p.wall2)
			mk.glow = true
			mk.cyl(Vector3(0.3, 0.27, 0.25), 0.09, 0.09, 0.05, 8, CYAN)
			mk.glow = false
			out.spin = _floating_cube(p)
			out.spin_pos = Vector3(0.3, 0.5, 0.25)
			out.spin_axis = Vector3(0, 1, 0)
			out.spin_speed = 1.2

static func _drum(col: Color) -> ArrayMesh:
	var mk := _new_part()
	mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), PI / 2))
	mk.cyl(Vector3(0, -0.1, 0), 0.06, 0.08, 0.2, 8, col)
	mk.pop()
	return commit(mk)

static func _floating_cube(p: Dictionary) -> ArrayMesh:
	var mk := _new_part()
	mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 1).normalized(), 0.6))
	mk.box(Vector3.ZERO, Vector3(0.14, 0.14, 0.14), p.stone, p.wall)
	mk.pop()
	mk.glow = true
	mk.ring(Vector3(0, 0, 0), 0.15, 0.01, CYAN, 12, 3)
	mk.glow = false
	return commit(mk)

# ------------------------------------------------------------------ Mine
static func _mine(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	var ore := Color(0.55, 0.32, 0.25)
	pad(mk, Color(0.55, 0.5, 0.42), 0.84, 0.03)
	match a:
		0:
			# mine mouth in a mound
			mk.sphere(Vector3(-0.1, 0.0, -0.25), 0.45, Color(0.55, 0.52, 0.45), 8, 4, Vector3(1.1, 0.6, 0.8))
			mk.box(Vector3(-0.1, 0.12, 0.08), Vector3(0.2, 0.22, 0.04), DARK)
			mk.box(Vector3(-0.21, 0.12, 0.1), Vector3(0.04, 0.24, 0.04), WOOD)
			mk.box(Vector3(0.01, 0.12, 0.1), Vector3(0.04, 0.24, 0.04), WOOD)
			mk.box(Vector3(-0.1, 0.25, 0.1), Vector3(0.28, 0.04, 0.05), WOOD)
			mk.box(Vector3(-0.1, 0.025, 0.35), Vector3(0.05, 0.01, 0.5), p.metal)
			mk.box(Vector3(-0.1, 0.07, 0.4), Vector3(0.1, 0.07, 0.12), WOOD)
			mk.sphere(Vector3(-0.1, 0.12, 0.4), 0.045, ore, 5, 3)
			# small forge
			var f := Vector3(0.38, 0.02, 0.15)
			mk.box(f + Vector3(0, 0.1, 0), Vector3(0.22, 0.2, 0.2), p.stone)
			mk.glow = true
			mk.box(f + Vector3(0, 0.08, 0.101), Vector3(0.08, 0.06, 0.01), Color(1.0, 0.5, 0.15))
			mk.glow = false
			chimney(mk, f + Vector3(0, 0.2, -0.04), 0.18, p.stone2, out.smoke, 0.04)
		1:
			mk.sphere(Vector3(-0.2, 0.0, -0.3), 0.4, Color(0.55, 0.52, 0.45), 8, 4, Vector3(1.0, 0.5, 0.8))
			# headframe with wheel
			var h := Vector3(0.15, 0.02, 0.0)
			for sx in [-1.0, 1.0]:
				mk.rod(h + Vector3(sx * 0.15, 0, 0.1), h + Vector3(sx * 0.04, 0.7, 0), 0.022, WOOD)
				mk.rod(h + Vector3(sx * 0.15, 0, -0.1), h + Vector3(sx * 0.04, 0.7, 0), 0.022, WOOD)
			mk.box(h + Vector3(0, 0.72, 0), Vector3(0.12, 0.04, 0.12), WOOD2)
			out.spin = _wheel(0.13, WOOD, WOOD)
			out.spin_pos = h + Vector3(0, 0.74, 0)
			out.spin_axis = Vector3(1, 0, 0)
			out.spin_speed = 1.0
			mk.box(h + Vector3(0, 0.08, 0), Vector3(0.2, 0.16, 0.2), p.wall)
			mk.sphere(Vector3(0.45, 0.02, 0.35), 0.12, ore, 6, 3, Vector3(1.3, 0.6, 1.0))
			mk.sphere(Vector3(-0.35, 0.02, 0.35), 0.1, Color(0.2, 0.2, 0.22), 6, 3, Vector3(1.3, 0.6, 1.0))
		2:
			# blast furnace + iron headframe
			var f := Vector3(-0.25, 0.02, -0.15)
			mk.cyl(f, 0.2, 0.13, 0.65, 8, p.wall)
			mk.cyl(f + Vector3(0, 0.65, 0), 0.14, 0.1, 0.12, 8, p.metal)
			mk.glow = true
			mk.box(f + Vector3(0, 0.1, 0.18), Vector3(0.1, 0.08, 0.04), Color(1.0, 0.45, 0.1))
			mk.glow = false
			out.smoke.append(f + Vector3(0, 0.82, 0))
			stack(mk, Vector3(-0.5, 0.02, 0.15), 0.8, 0.05, p.wall2, p.trim, out.smoke)
			var h := Vector3(0.3, 0.02, 0.1)
			for sx in [-1.0, 1.0]:
				mk.rod(h + Vector3(sx * 0.13, 0, 0.1), h + Vector3(sx * 0.03, 0.75, 0), 0.018, p.metal)
				mk.rod(h + Vector3(sx * 0.13, 0, -0.1), h + Vector3(sx * 0.03, 0.75, 0), 0.018, p.metal)
			out.spin = _wheel(0.12, p.metal, p.metal)
			out.spin_pos = h + Vector3(0, 0.78, 0)
			out.spin_axis = Vector3(1, 0, 0)
			out.spin_speed = 1.4
			mk.sphere(Vector3(0.1, 0.02, 0.45), 0.12, ore, 6, 3, Vector3(1.3, 0.6, 1.0))
		3:
			mk.box(Vector3(-0.1, 0.26, -0.15), Vector3(0.7, 0.5, 0.45), Color(0.5, 0.55, 0.6))
			mk.gable(Vector3(-0.1, 0.51, -0.15), 0.7, 0.45, 0.12, p.roof, Color(0.5, 0.55, 0.6), 0.02)
			for i in 3:
				stack(mk, Vector3(-0.35 + i * 0.25, 0.6, -0.3), 0.5, 0.045, Color(0.7, 0.7, 0.7), RED, out.smoke)
			mk.glow = true
			mk.box(Vector3(-0.1, 0.15, 0.08), Vector3(0.2, 0.15, 0.01), Color(1.0, 0.55, 0.15))
			mk.glow = false
			mk.rod(Vector3(0.25, 0.1, 0.1), Vector3(0.55, 0.45, 0.4), 0.03, p.accent)
			mk.sphere(Vector3(0.5, 0.02, 0.45), 0.13, ore, 6, 3, Vector3(1.3, 0.6, 1.0))
		_:
			mk.hexp(Vector3(0, 0.02, -0.05), 0.5, 0.15, p.wall2, p.wall)
			mk.glow = true
			mk.ring(Vector3(0, 0.45, -0.05), 0.32, 0.06, Color(1.0, 0.55, 0.2), 16, 5)
			mk.sphere(Vector3(0, 0.45, -0.05), 0.12, Color(1.0, 0.85, 0.5), 8, 5)
			mk.glow = false
			for i in 3:
				var an := TAU * i / 3.0
				mk.rod(Vector3(cos(an) * 0.42, 0.15, sin(an) * 0.42 - 0.05), Vector3(cos(an) * 0.32, 0.45, sin(an) * 0.32 - 0.05), 0.03, p.wall)
			out.smoke.append(Vector3(0, 0.6, -0.05))

# ------------------------------------------------------------------ Library (science)
static func _library(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	match a:
		0:
			pad(mk, p.stone2, 0.78, 0.04)
			var c := Vector3(-0.08, 0.04, -0.05)
			mk.box(c + Vector3(0, 0.22, 0), Vector3(0.6, 0.44, 0.4), p.stone)
			mk.gable(c + Vector3(0, 0.44, 0), 0.6, 0.4, 0.26, p.roof2.darkened(0.1), p.stone, 0.05)
			door(mk, c + Vector3(0, 0, 0.2), 0.12, 0.2, p.beam)
			mk.glow = true
			for i in 3:
				mk.box(c + Vector3(0.301, 0.25, -0.12 + i * 0.12), Vector3(0.01, 0.12, 0.05), Color(1.0, 0.75, 0.35))
			mk.glow = false
			# round tower
			var t := Vector3(0.3, 0.04, -0.25)
			mk.cyl(t, 0.14, 0.13, 0.85, 8, p.stone)
			mk.cone(t + Vector3(0, 0.85, 0), 0.17, 0.3, 8, p.roof2.darkened(0.15))
			window(mk, a, t + Vector3(0, 0.6, 0.135), 0.05, 0.1, Vector3(0, 0, 1))
			# book stand + candle
			crate(mk, Vector3(-0.35, 0.04, 0.35), 0.08, Color(0.6, 0.2, 0.2))
			crate(mk, Vector3(-0.25, 0.04, 0.38), 0.07, Color(0.2, 0.3, 0.6))
		1:
			pad(mk, p.stone2, 0.8, 0.04)
			var c := Vector3(0, 0.04, -0.05)
			mk.box(c + Vector3(0, 0.3, 0), Vector3(0.74, 0.6, 0.46), p.wall)
			for i in 6:
				mk.cyl(c + Vector3(-0.3 + i * 0.12, 0.02, 0.26), 0.028, 0.028, 0.5, 8, p.trim)
			mk.box(c + Vector3(0, 0.55, 0.26), Vector3(0.78, 0.06, 0.1), p.trim)
			mk.gable(c + Vector3(0, 0.58, 0.26), 0.74, 0.08, 0.1, p.trim, p.trim, 0.0)
			mk.pyramid(c + Vector3(0, 0.6, -0.04), 0.74, 0.4, 0.14, p.roof)
			# observatory dome with telescope
			mk.cyl(c + Vector3(0, 0.6, -0.05), 0.18, 0.18, 0.12, 10, p.wall2)
			mk.dome(c + Vector3(0, 0.72, -0.05), 0.18, Color(0.55, 0.62, 0.68), 10, 4)
			mk.rod(c + Vector3(0, 0.82, -0.05), c + Vector3(0.15, 1.0, 0.1), 0.025, p.accent)
			facade(mk, a, c, 0.74, 0.46, 0.12, 1, 0.3, 0, 2, 0.08, 0.14)
		2:
			pad(mk, p.stone2, 0.82, 0.04)
			var c := Vector3(-0.08, 0.04, -0.05)
			mk.box(c + Vector3(0, 0.33, 0), Vector3(0.7, 0.66, 0.45), p.wall)
			mk.box(c + Vector3(0, 0.03, 0), Vector3(0.74, 0.06, 0.49), p.stone)
			facade(mk, a, c, 0.7, 0.45, 0.08, 3, 0.2, 4, 2, 0.07, 0.11)
			mk.gable(c + Vector3(0, 0.66, 0), 0.7, 0.45, 0.2, p.roof, p.wall, 0.03)
			var t := c + Vector3(0.38, 0, -0.1)
			mk.box(t + Vector3(0, 0.6, 0), Vector3(0.22, 1.2, 0.22), p.wall2)
			mk.cyl(t + Vector3(0, 0.98, 0.112), 0.07, 0.07, 0.01, 10, WHITE)
			mk.pyramid(t + Vector3(0, 1.2, 0), 0.24, 0.24, 0.3, p.roof)
			door(mk, c + Vector3(0, 0.06, 0.225), 0.14, 0.2, Color(0.3, 0.18, 0.12))
			tree(mk, Vector3(-0.5, 0.04, 0.4), 0.8)
		3:
			pad(mk, p.stone2, 0.82, 0.04)
			mk.box(Vector3(-0.1, 0.3, -0.05), Vector3(0.7, 0.55, 0.5), p.wall)
			for f in 2:
				mk.box(Vector3(-0.1, 0.18 + f * 0.24, 0.205), Vector3(0.66, 0.13, 0.01), p.win)
			mk.box(Vector3(-0.1, 0.59, -0.05), Vector3(0.72, 0.04, 0.52), p.roof)
			mk.box(Vector3(0.4, 0.2, 0.2), Vector3(0.25, 0.35, 0.3), p.wall2)
			# satellite dish spinner
			mk.cyl(Vector3(-0.25, 0.6, -0.15), 0.03, 0.03, 0.18, 6, p.metal)
			out.spin = _dish(0.2, WHITE, p.metal)
			out.spin_pos = Vector3(-0.25, 0.8, -0.15)
			out.spin_axis = Vector3(0, 1, 0)
			out.spin_speed = 0.4
			mk.rod(Vector3(0.2, 0.6, -0.2), Vector3(0.2, 1.1, -0.2), 0.01, p.metal)
		_:
			pad(mk, p.stone2, 0.82, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.5, 0.25, p.wall, p.wall2)
			mk.cyl(Vector3(0, 0.29, 0), 0.08, 0.05, 0.4, 8, p.metal)
			mk.sphere(Vector3(0, 0.95, 0), 0.26, p.wall, 12, 7)
			mk.glow = true
			mk.cyl(Vector3(0, 0.92, 0), 0.265, 0.265, 0.05, 12, CYAN, null, false)
			mk.glow = false
			out.spin = _rings(0.42)
			out.spin_pos = Vector3(0, 0.95, 0)
			out.spin_axis = Vector3(0, 1, 0)
			out.spin_speed = 0.9

static func _dish(r: float, col: Color, frame: Color) -> ArrayMesh:
	var mk := _new_part()
	mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), -0.9))
	mk.cyl(Vector3(0, 0, 0), r * 0.25, r, r * 0.35, 12, col)
	mk.rod(Vector3(0, 0, 0), Vector3(0, r * 0.8, 0), 0.01, frame)
	mk.pop()
	return commit(mk)

static func _rings(r: float) -> ArrayMesh:
	var mk := _new_part()
	mk.glow = true
	mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), 0.5))
	mk.ring(Vector3.ZERO, r, 0.015, CYAN, 18, 3)
	mk.pop()
	mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), -0.6))
	mk.ring(Vector3.ZERO, r * 0.85, 0.012, Color(0.8, 0.5, 1.0), 18, 3)
	mk.pop()
	mk.glow = false
	return commit(mk)

# ------------------------------------------------------------------ Market
static func _stall(mk: MK, c: Vector3, yaw: float, cloth: Color) -> void:
	mk.push_at(c, yaw)
	for sx in [-0.1, 0.1]:
		for sz in [-0.08, 0.08]:
			mk.box(Vector3(sx, 0.11, sz), Vector3(0.02, 0.22, 0.02), WOOD)
	mk.box(Vector3(0, 0.08, 0.04), Vector3(0.22, 0.03, 0.1), WOOD2)
	for i in 4:
		mk.box(Vector3(-0.09 + i * 0.06, 0.24 - 0.0, 0), Vector3(0.06, 0.015, 0.22), cloth if i % 2 == 0 else WHITE)
	mk.sphere(Vector3(-0.05, 0.11, 0.05), 0.02, Color(0.9, 0.35, 0.2), 5, 3)
	mk.sphere(Vector3(0.04, 0.11, 0.05), 0.02, Color(0.4, 0.75, 0.25), 5, 3)
	mk.pop()

static func _market(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	match a:
		0:
			pad(mk, Color(0.7, 0.62, 0.45), 0.8, 0.03)
			_stall(mk, Vector3(-0.3, 0.03, 0.1), 0.3, RED)
			_stall(mk, Vector3(0.3, 0.03, 0.15), -0.4, FLAG)
			_stall(mk, Vector3(0.0, 0.03, -0.3), PI, Color(0.95, 0.75, 0.2))
			_stall(mk, Vector3(-0.35, 0.03, -0.35), 2.5, Color(0.3, 0.65, 0.3))
			barrel(mk, Vector3(0.1, 0.03, 0.35), 0.05)
			crate(mk, Vector3(0.45, 0.03, -0.2), 0.08)
			crate(mk, Vector3(0.5, 0.03, -0.1), 0.07)
			mk.cyl(Vector3(0, 0.03, 0), 0.08, 0.08, 0.12, 8, p.stone)
			person(mk, Vector3(-0.1, 0.03, 0.25), Color(0.7, 0.3, 0.3))
			person(mk, Vector3(0.2, 0.03, -0.05), Color(0.3, 0.4, 0.7))
		1:
			pad(mk, p.stone2, 0.82, 0.04)
			var c := Vector3(0, 0.04, -0.15)
			mk.box(c + Vector3(0, 0.25, 0), Vector3(0.7, 0.5, 0.34), p.wall2)
			for i in 5:
				mk.box(c + Vector3(-0.28 + i * 0.14, 0.15, 0.18), Vector3(0.04, 0.3, 0.04), p.trim)
			mk.box(c + Vector3(0, 0.31, 0.18), Vector3(0.66, 0.04, 0.06), p.trim)
			mk.gable(c + Vector3(0, 0.5, 0), 0.7, 0.34, 0.2, p.roof, p.wall2, 0.05)
			facade(mk, a, c, 0.7, 0.34, 0.33, 1, 0.17, 4, 0, 0.07, 0.08)
			_stall(mk, Vector3(-0.3, 0.04, 0.35), 0.0, RED)
			_stall(mk, Vector3(0.3, 0.04, 0.35), 0.0, FLAG)
			barrel(mk, Vector3(0.0, 0.04, 0.4), 0.05)
		2:
			pad(mk, p.stone2, 0.84, 0.04)
			var c := Vector3(0, 0.04, -0.1)
			mk.box(c + Vector3(0, 0.3, 0), Vector3(0.8, 0.6, 0.5), p.wall)
			facade(mk, a, c, 0.8, 0.5, 0.1, 2, 0.24, 5, 3, 0.08, 0.12)
			mk.box(c + Vector3(0, 0.62, 0), Vector3(0.82, 0.04, 0.52), p.trim)
			# glass barrel roof
			for i in 6:
				var an := PI * (i + 0.5) / 6.0
				mk.boxr(c + Vector3(0, 0.64 + sin(an) * 0.18, cos(an) * 0.2), Vector3(0.78, 0.015, 0.1), 0.0, Color(0.6, 0.78, 0.85) if i % 2 else p.metal)
			for i in 4:
				mk.cyl(c + Vector3(-0.27 + i * 0.18, 0.0, 0.3), 0.03, 0.03, 0.4, 8, p.trim)
			mk.box(c + Vector3(0, 0.42, 0.3), Vector3(0.7, 0.05, 0.1), p.trim)
		3:
			pad(mk, Color(0.35, 0.36, 0.38), 0.86, 0.03)
			mk.box(Vector3(0, 0.2, -0.15), Vector3(0.9, 0.36, 0.5), p.wall)
			mk.box(Vector3(0, 0.15, 0.105), Vector3(0.86, 0.22, 0.01), p.win)
			var sc := [RED, FLAG, Color(0.95, 0.7, 0.15), Color(0.3, 0.75, 0.35)]
			for i in 4:
				mk.box(Vector3(-0.32 + i * 0.21, 0.32, 0.11), Vector3(0.17, 0.06, 0.02), sc[i])
			mk.box(Vector3(0, 0.39, -0.15), Vector3(0.92, 0.04, 0.52), p.roof)
			# car park
			for i in 3:
				mk.box(Vector3(-0.3 + i * 0.3, 0.035, 0.42), Vector3(0.12, 0.06, 0.2), sc[(i + 1) % 4])
				mk.box(Vector3(-0.3 + i * 0.3, 0.08, 0.41), Vector3(0.1, 0.04, 0.1), p.win)
		_:
			pad(mk, p.stone2, 0.86, 0.04)
			mk.dome(Vector3(0, 0.04, -0.05), 0.6, p.wall, 12, 4, 0.6)
			mk.glow = true
			mk.ring(Vector3(0, 0.25, -0.05), 0.53, 0.02, Color(1.0, 0.45, 0.85), 16, 3)
			mk.box(Vector3(0, 0.2, 0.52), Vector3(0.36, 0.08, 0.02), CYAN)
			mk.glow = false
			mk.cyl(Vector3(0, 0.36, -0.05), 0.12, 0.08, 0.3, 8, p.wall2)
			mk.glow = true
			mk.sphere(Vector3(0, 0.72, -0.05), 0.07, Color(1.0, 0.45, 0.85), 8, 5)
			mk.glow = false

# ------------------------------------------------------------------ Barracks
static func _tent(mk: MK, c: Vector3, col: Color, s: float = 1.0) -> void:
	mk.pyramid(c, 0.24 * s, 0.24 * s, 0.24 * s, col, 0.0)
	mk.box(c + Vector3(0, 0.05 * s, 0.121 * s), Vector3(0.06 * s, 0.1 * s, 0.01), DARK)
	mk.rod(c + Vector3(0, 0.22 * s, 0), c + Vector3(0, 0.32 * s, 0), 0.008, WOOD)

static func _barracks(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	match a:
		0:
			pad(mk, Color(0.6, 0.52, 0.36), 0.82, 0.03)
			_tent(mk, Vector3(-0.3, 0.03, -0.25), Color(0.85, 0.8, 0.65), 1.3)
			_tent(mk, Vector3(0.3, 0.03, -0.3), Color(0.8, 0.3, 0.25), 1.2)
			_tent(mk, Vector3(-0.4, 0.03, 0.2), Color(0.85, 0.8, 0.65), 1.1)
			# campfire
			mk.cyl(Vector3(0.1, 0.03, 0.15), 0.08, 0.08, 0.03, 8, p.stone2)
			mk.glow = true
			mk.cone(Vector3(0.1, 0.05, 0.15), 0.05, 0.1, 6, Color(1.0, 0.55, 0.15))
			mk.glow = false
			out.smoke.append(Vector3(0.1, 0.2, 0.15))
			# weapon rack
			mk.box(Vector3(0.4, 0.12, 0.25), Vector3(0.2, 0.02, 0.02), WOOD)
			for i in 3:
				mk.rod(Vector3(0.33 + i * 0.07, 0.03, 0.23), Vector3(0.33 + i * 0.07, 0.3, 0.26), 0.008, WOOD)
				mk.cone(Vector3(0.33 + i * 0.07, 0.3, 0.26), 0.015, 0.05, 4, p.metal)
			mk.cyl(Vector3(0.45, 0.03, 0.5), 0.07, 0.07, 0.02, 8, RED)
			banner(mk, Vector3(0.0, 0.03, -0.45), 0.7, FLAG)
		1:
			pad(mk, p.stone2, 0.84, 0.04)
			var c := Vector3(0, 0.04, -0.2)
			mk.box(c + Vector3(0, 0.22, 0), Vector3(0.8, 0.44, 0.34), p.stone)
			mk.gable(c + Vector3(0, 0.44, 0), 0.8, 0.34, 0.2, p.roof, p.stone, 0.05)
			facade(mk, a, c, 0.8, 0.34, 0.1, 1, 0.25, 5, 0, 0.07, 0.1)
			door(mk, c + Vector3(0, 0, 0.17), 0.14, 0.22, p.beam)
			mk.box(Vector3(0, 0.045, 0.3), Vector3(0.7, 0.01, 0.35), Color(0.82, 0.75, 0.6))
			banner(mk, Vector3(-0.5, 0.04, 0.3), 0.8)
			banner(mk, Vector3(0.5, 0.04, 0.3), 0.8)
			for i in 3:
				barrel(mk, Vector3(0.35 - i * 0.08, 0.04, -0.45 + 0.0), 0.04)
		2:
			pad(mk, p.stone2, 0.84, 0.04)
			var c := Vector3(0, 0.04, -0.2)
			mk.box(c + Vector3(0, 0.25, 0), Vector3(0.85, 0.5, 0.36), p.wall)
			mk.gable(c + Vector3(0, 0.5, 0), 0.85, 0.36, 0.16, p.roof, p.wall, 0.03)
			facade(mk, a, c, 0.85, 0.36, 0.08, 2, 0.2, 6, 0, 0.06, 0.1)
			chimney(mk, c + Vector3(0.3, 0.5, -0.08), 0.18, p.wall2, out.smoke, 0.04)
			# sandbags
			for i in 7:
				var an := -0.9 + i * 0.3
				mk.sphere(Vector3(sin(an) * 0.55, 0.06, 0.2 + cos(an) * 0.25), 0.06, Color(0.78, 0.7, 0.5), 6, 3, Vector3(1.3, 0.7, 0.9))
			banner(mk, Vector3(0.0, 0.04, 0.3), 0.85)
		3:
			pad(mk, p.stone2, 0.84, 0.04)
			mk.box(Vector3(0, 0.18, -0.2), Vector3(0.85, 0.32, 0.4), p.wall2)
			mk.box(Vector3(0, 0.35, -0.2), Vector3(0.87, 0.04, 0.42), p.roof)
			mk.box(Vector3(0, 0.16, 0.005), Vector3(0.8, 0.06, 0.01), DARK)
			mk.rod(Vector3(0.3, 0.37, -0.3), Vector3(0.3, 1.2, -0.3), 0.012, p.metal)
			mk.glow = true
			mk.sphere(Vector3(0.3, 1.22, -0.3), 0.02, RED, 5, 3)
			mk.glow = false
			for i in 9:
				var an := -1.2 + i * 0.3
				mk.sphere(Vector3(sin(an) * 0.6, 0.06, 0.15 + cos(an) * 0.3), 0.06, Color(0.6, 0.6, 0.45), 6, 3, Vector3(1.3, 0.7, 0.9))
			# jeep
			mk.box(Vector3(-0.35, 0.07, 0.3), Vector3(0.12, 0.08, 0.2), Color(0.35, 0.42, 0.3))
			banner(mk, Vector3(0.0, 0.04, 0.35), 0.7)
		_:
			pad(mk, p.stone2, 0.86, 0.04)
			mk.box(Vector3(0, 0.25, -0.2), Vector3(0.8, 0.46, 0.4), p.wall)
			mk.dome(Vector3(0, 0.48, -0.2), 0.35, p.wall2, 10, 3, 0.35)
			mk.glow = true
			mk.box(Vector3(0, 0.2, 0.005), Vector3(0.4, 0.3, 0.01), CYAN)
			mk.glow = false
			# mech suit on display
			var m := Vector3(0.45, 0.04, 0.3)
			mk.box(m + Vector3(0, 0.2, 0), Vector3(0.14, 0.14, 0.1), p.wall)
			mk.box(m + Vector3(-0.04, 0.07, 0), Vector3(0.04, 0.14, 0.04), p.metal)
			mk.box(m + Vector3(0.04, 0.07, 0), Vector3(0.04, 0.14, 0.04), p.metal)
			mk.glow = true
			mk.box(m + Vector3(0, 0.25, 0.051), Vector3(0.08, 0.025, 0.01), CYAN)
			mk.glow = false
			banner(mk, Vector3(-0.45, 0.04, 0.35), 0.7)

# ------------------------------------------------------------------ Watch tower (turret head)
static func _tower(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	var hd := _new_part()
	match a:
		0:
			pad(mk, p.stone2, 0.6, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.36, 0.2, p.stone)
			for sx in [-1.0, 1.0]:
				for sz in [-1.0, 1.0]:
					mk.rod(Vector3(sx * 0.24, 0.2, sz * 0.24), Vector3(sx * 0.18, 1.25, sz * 0.18), 0.03, p.beam)
			mk.rod(Vector3(-0.22, 0.5, 0.22), Vector3(0.2, 0.9, 0.2), 0.015, p.beam)
			mk.rod(Vector3(0.22, 0.5, -0.22), Vector3(-0.2, 0.9, -0.2), 0.015, p.beam)
			mk.box(Vector3(0, 1.25, 0), Vector3(0.48, 0.05, 0.48), WOOD2)
			for o in [Vector3(0.23, 0, 0), Vector3(-0.23, 0, 0), Vector3(0, 0, 0.23), Vector3(0, 0, -0.23)]:
				mk.box(Vector3(0, 1.33, 0) + o, Vector3(0.48 if o.z != 0 else 0.03, 0.12, 0.03 if o.z != 0 else 0.48), p.beam)
			for sx in [-1.0, 1.0]:
				for sz in [-1.0, 1.0]:
					mk.rod(Vector3(sx * 0.2, 1.25, sz * 0.2), Vector3(sx * 0.2, 1.62, sz * 0.2), 0.015, p.beam)
			mk.pyramid(Vector3(0, 1.62, 0), 0.46, 0.46, 0.28, p.roof)
			banner(mk, Vector3(0, 1.9, 0), 0.22, FLAG, 0.12)
			# head: archer with a big bow
			_archer(hd, RED.darkened(0.1))
			out.head_y = 1.28
		1:
			pad(mk, p.stone2, 0.62, 0.04)
			mk.cyl(Vector3(0, 0.04, 0), 0.34, 0.28, 1.15, 10, p.stone)
			mk.cyl(Vector3(0, 1.15, 0), 0.33, 0.33, 0.08, 10, p.stone2)
			crenels(mk, Vector3(0, 1.23, 0), 0.29, 0.1, p.stone, 8, 0.08)
			mk.box(Vector3(0, 0.3, 0.285), Vector3(0.1, 0.18, 0.04), p.beam)
			window(mk, a, Vector3(0, 0.75, 0.31), 0.05, 0.12, Vector3(0, 0, 1))
			banner(mk, Vector3(0.2, 1.23, -0.2), 0.4, FLAG, 0.14)
			# head: swivel gun with a musketeer
			hd.cyl(Vector3(0, 0, 0), 0.06, 0.05, 0.08, 6, WOOD)
			hd.rod(Vector3(0, 0.08, -0.05), Vector3(0, 0.1, 0.32), 0.025, Color(0.3, 0.3, 0.32), 8)
			hd.cyl(Vector3(0, 0.08, 0.32), 0.035, 0.035, 0.0, 8, DARK)
			_little_man(hd, Vector3(0.12, 0.0, -0.08), FLAG, Color(0.15, 0.15, 0.18), 1)
			out.head_y = 1.2
		2:
			pad(mk, p.stone2, 0.62, 0.04)
			mk.box(Vector3(0, 0.58, 0), Vector3(0.52, 1.1, 0.52), p.wall)
			for y in [0.3, 0.65]:
				mk.box(Vector3(0, y, 0), Vector3(0.55, 0.04, 0.55), p.trim)
			window(mk, a, Vector3(0, 0.8, 0.262), 0.08, 0.12, Vector3(0, 0, 1))
			mk.box(Vector3(0, 1.15, 0), Vector3(0.6, 0.06, 0.6), p.metal)
			crenels_sq(mk, Vector3(0, 1.18, 0), 0.54, 0.08, p.metal, 3)
			# head: gatling on a pintle with a shield
			hd.cyl(Vector3(0, 0, 0), 0.08, 0.07, 0.1, 8, p.metal)
			hd.box(Vector3(0, 0.15, 0.08), Vector3(0.22, 0.14, 0.02), Color(0.4, 0.42, 0.38))
			for i in 6:
				var an := TAU * i / 6.0
				hd.rod(Vector3(cos(an) * 0.025, 0.14 + sin(an) * 0.025, 0.0), Vector3(cos(an) * 0.025, 0.14 + sin(an) * 0.025, 0.36), 0.01, DARK, 4)
			hd.cyl(Vector3(0, 0.14, -0.08), 0.05, 0.05, 0.0, 8, p.accent)
			hd.box(Vector3(0, 0.14, -0.04), Vector3(0.08, 0.08, 0.1), p.accent)
			out.head_y = 1.2
		3:
			pad(mk, p.stone2, 0.66, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.5, 0.5, p.wall, p.wall)
			mk.box(Vector3(0, 0.3, 0.44), Vector3(0.3, 0.06, 0.02), DARK)
			for i in 10:
				var an := TAU * i / 10.0
				mk.sphere(Vector3(cos(an) * 0.6, 0.06, sin(an) * 0.6), 0.06, Color(0.6, 0.6, 0.45), 6, 3, Vector3(1.3, 0.7, 0.9))
			# head: twin autocannon turret
			hd.cyl(Vector3(0, 0, 0), 0.22, 0.2, 0.12, 10, p.wall2)
			hd.box(Vector3(0, 0.17, 0), Vector3(0.26, 0.12, 0.26), p.wall2)
			hd.box(Vector3(0, 0.22, 0.11), Vector3(0.12, 0.03, 0.02), p.win)
			for sx in [-0.06, 0.06]:
				hd.rod(Vector3(sx, 0.16, 0.1), Vector3(sx, 0.16, 0.48), 0.022, Color(0.25, 0.27, 0.3), 6)
				hd.cyl(Vector3(sx, 0.16, 0.45), 0.03, 0.03, 0.0, 6, DARK)
			out.head_y = 0.54
		_:
			pad(mk, p.stone2, 0.64, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.42, 0.3, p.wall, p.wall2)
			mk.cyl(Vector3(0, 0.34, 0), 0.16, 0.1, 0.5, 8, p.metal)
			mk.glow = true
			mk.ring(Vector3(0, 0.36, 0), 0.43, 0.02, CYAN, 14, 3)
			mk.glow = false
			# head: laser emitter
			hd.sphere(Vector3(0, 0.1, 0), 0.16, p.wall, 10, 6)
			hd.rod(Vector3(0, 0.1, 0.05), Vector3(0, 0.1, 0.36), 0.045, p.wall2, 8, 0.03)
			hd.glow = true
			hd.sphere(Vector3(0, 0.1, 0.38), 0.04, CYAN, 8, 5)
			hd.cyl(Vector3(0, 0.1, -0.165), 0.06, 0.06, 0.0, 8, CYAN)
			hd.ring(Vector3(0, 0.1, 0), 0.165, 0.012, CYAN, 12, 3)
			hd.glow = false
			out.head_y = 0.86
	out.head = commit(hd)

static func _little_man(mk: MK, p: Vector3, coat: Color, hat: Color, style: int) -> void:
	mk.box(p + Vector3(-0.025, 0.04, 0), Vector3(0.03, 0.08, 0.03), Color(0.25, 0.2, 0.18))
	mk.box(p + Vector3(0.025, 0.04, 0), Vector3(0.03, 0.08, 0.03), Color(0.25, 0.2, 0.18))
	mk.box(p + Vector3(0, 0.13, 0), Vector3(0.1, 0.11, 0.07), coat)
	mk.sphere(p + Vector3(0, 0.23, 0), 0.05, Color(0.96, 0.78, 0.62), 7, 4)
	if style == 1:
		mk.cyl(p + Vector3(0, 0.26, 0), 0.07, 0.06, 0.025, 3, hat, null, true, 0.5)
	else:
		mk.dome(p + Vector3(0, 0.25, 0), 0.055, hat, 7, 2)

static func _archer(mk: MK, _col: Color) -> void:
	var skin := Color(0.96, 0.78, 0.62)
	mk.box(Vector3(-0.03, 0.05, 0), Vector3(0.035, 0.1, 0.035), Color(0.35, 0.25, 0.18))
	mk.box(Vector3(0.03, 0.05, 0), Vector3(0.035, 0.1, 0.035), Color(0.35, 0.25, 0.18))
	mk.box(Vector3(0, 0.16, 0), Vector3(0.12, 0.13, 0.08), Color(0.2, 0.55, 0.3))
	mk.sphere(Vector3(0, 0.29, 0), 0.06, skin, 7, 4)
	mk.cone(Vector3(0, 0.32, 0), 0.07, 0.08, 6, Color(0.2, 0.5, 0.25))
	# bow
	for i in 4:
		var a0 := -0.9 + i * 0.45
		var a1 := a0 + 0.45
		mk.rod(Vector3(0.07, 0.18 + sin(a0) * 0.16, 0.08 + cos(a0) * 0.06), Vector3(0.07, 0.18 + sin(a1) * 0.16, 0.08 + cos(a1) * 0.06), 0.008, WOOD, 4)
	mk.rod(Vector3(0.07, 0.18 + sin(-0.9) * 0.16, 0.08 + cos(-0.9) * 0.06), Vector3(0.07, 0.18 + sin(0.9) * 0.16, 0.08 + cos(0.9) * 0.06), 0.002, WHITE, 3)
	mk.rod(Vector3(-0.05, 0.12, -0.04), Vector3(-0.04, 0.3, -0.06), 0.02, WOOD2, 5)

# ------------------------------------------------------------------ Artillery (turret head)
static func _artillery(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	var hd := _new_part()
	match a:
		0:
			pad(mk, p.stone2, 0.72, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.6, 0.18, p.stone, p.stone.lightened(0.05))
			for i in 4:
				mk.sphere(Vector3(-0.42 + i * 0.07, 0.25, 0.3), 0.04, Color(0.5, 0.48, 0.45), 5, 3)
			# head: mangonel on a turntable
			hd.cyl(Vector3(0, 0, 0), 0.32, 0.32, 0.04, 8, WOOD)
			for sx in [-0.14, 0.14]:
				hd.box(Vector3(sx, 0.06, 0.0), Vector3(0.05, 0.08, 0.5), WOOD2)
				hd.rod(Vector3(sx, 0.05, -0.1), Vector3(sx * 0.7, 0.4, 0.05), 0.022, WOOD)
				hd.rod(Vector3(sx, 0.05, 0.2), Vector3(sx * 0.7, 0.4, 0.05), 0.022, WOOD)
			hd.rod(Vector3(-0.1, 0.4, 0.05), Vector3(0.1, 0.4, 0.05), 0.025, WOOD)
			hd.rod(Vector3(0, 0.1, -0.22), Vector3(0, 0.5, 0.22), 0.025, WOOD2)
			hd.cyl(Vector3(0, 0.44, 0.24), 0.07, 0.09, 0.07, 6, WOOD)
			hd.sphere(Vector3(0, 0.52, 0.24), 0.05, Color(0.5, 0.48, 0.45), 5, 3)
			hd.box(Vector3(0, 0.1, -0.25), Vector3(0.16, 0.12, 0.1), p.stone2)
			out.head_y = 0.22
		1:
			pad(mk, p.stone2, 0.78, 0.04)
			# star bastion
			mk.hexp(Vector3(0, 0.04, 0), 0.66, 0.24, p.stone, p.stone.lightened(0.05), 0.6)
			mk.hexp(Vector3(0, 0.28, 0), 0.62, 0.04, p.stone2)
			for i in 3:
				mk.sphere(Vector3(0.35 + i * 0.07, 0.34, -0.3), 0.035, DARK, 5, 3)
			barrel(mk, Vector3(-0.38, 0.32, -0.25), 0.04)
			# head: bronze cannon on a wheeled carriage
			hd.box(Vector3(0, 0.06, -0.02), Vector3(0.18, 0.08, 0.36), WOOD)
			for sx in [-0.11, 0.11]:
				hd.push_at(Vector3(sx, 0.07, 0.05))
				hd.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), PI / 2))
				hd.cyl(Vector3(0, -0.02, 0), 0.07, 0.07, 0.04, 10, WOOD2)
				hd.pop()
				hd.pop()
			hd.rod(Vector3(0, 0.14, -0.15), Vector3(0, 0.18, 0.38), 0.05, Color(0.72, 0.52, 0.24), 10, 0.04)
			hd.ring(Vector3(0, 0.18, 0.37), 0.045, 0.012, Color(0.72, 0.52, 0.24), 8, 3)
			out.head_y = 0.32
		2:
			pad(mk, p.stone2, 0.8, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.68, 0.22, p.stone, p.stone)
			mk.cyl(Vector3(0, 0.26, 0), 0.4, 0.4, 0.03, 12, p.metal)
			# head: breech-loading coastal gun behind a shield
			hd.cyl(Vector3(0, 0, 0), 0.26, 0.24, 0.08, 12, p.metal)
			hd.box(Vector3(0, 0.18, 0.06), Vector3(0.34, 0.24, 0.3), Color(0.42, 0.45, 0.4))
			hd.box(Vector3(0, 0.3, 0.04), Vector3(0.3, 0.04, 0.26), Color(0.38, 0.4, 0.36))
			hd.rod(Vector3(0, 0.17, 0.1), Vector3(0, 0.17, 0.75), 0.05, Color(0.26, 0.27, 0.29), 10, 0.04)
			hd.box(Vector3(0, 0.12, -0.18), Vector3(0.2, 0.12, 0.12), Color(0.38, 0.4, 0.36))
			out.head_y = 0.3
		3:
			pad(mk, p.stone2, 0.82, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.7, 0.2, p.wall, p.wall)
			mk.box(Vector3(0.45, 0.3, -0.25), Vector3(0.2, 0.18, 0.2), p.wall2)
			# head: twin howitzer turret
			hd.cyl(Vector3(0, 0, 0), 0.34, 0.32, 0.1, 12, p.wall2)
			hd.box(Vector3(0, 0.2, -0.03), Vector3(0.44, 0.22, 0.48), Color(0.45, 0.5, 0.42))
			hd.pyramid(Vector3(0, 0.31, -0.03), 0.44, 0.48, 0.06, Color(0.45, 0.5, 0.42), 0.0, 0.1)
			for sx in [-0.1, 0.1]:
				hd.rod(Vector3(sx, 0.2, 0.2), Vector3(sx, 0.24, 0.9), 0.04, Color(0.28, 0.3, 0.3), 8, 0.035)
				hd.cyl(Vector3(sx, 0.24, 0.88), 0.05, 0.05, 0.0, 8, DARK)
			hd.box(Vector3(0.15, 0.34, -0.15), Vector3(0.1, 0.06, 0.1), p.metal)
			out.head_y = 0.24
		_:
			pad(mk, p.stone2, 0.82, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.68, 0.2, p.wall, p.wall2)
			mk.glow = true
			mk.ring(Vector3(0, 0.25, 0), 0.6, 0.02, CYAN, 16, 3)
			mk.glow = false
			# head: railgun with glowing coils
			hd.cyl(Vector3(0, 0, 0), 0.3, 0.28, 0.1, 10, p.wall2)
			hd.box(Vector3(0, 0.18, -0.1), Vector3(0.3, 0.2, 0.4), p.wall)
			for sx in [-0.06, 0.06]:
				hd.box(Vector3(sx, 0.2, 0.45), Vector3(0.04, 0.06, 1.0), p.metal)
			hd.glow = true
			for i in 4:
				hd.box(Vector3(0, 0.2, 0.15 + i * 0.22), Vector3(0.18, 0.1, 0.04), CYAN)
			hd.glow = false
			out.head_y = 0.24
	out.head = commit(hd)

# ------------------------------------------------------------------ Air defence (turret head)
static func _aa(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	var hd := _new_part()
	match a:
		2:
			pad(mk, p.stone2, 0.72, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.52, 0.12, p.stone)
			for i in 12:
				var an := TAU * i / 12.0
				mk.sphere(Vector3(cos(an) * 0.55, 0.2, sin(an) * 0.55), 0.07, Color(0.78, 0.7, 0.5), 6, 3, Vector3(1.2, 0.7, 0.9))
			for i in 3:
				crate(mk, Vector3(-0.3 + i * 0.1, 0.16, -0.32), 0.07, Color(0.4, 0.45, 0.3))
			# head: flak gun angled up
			hd.cyl(Vector3(0, 0, 0), 0.2, 0.18, 0.08, 10, p.metal)
			hd.box(Vector3(0, 0.14, 0), Vector3(0.18, 0.16, 0.2), Color(0.42, 0.46, 0.38))
			hd.rod(Vector3(0, 0.18, 0.0), Vector3(0, 0.6, 0.45), 0.035, Color(0.26, 0.28, 0.3), 8)
			hd.cyl(Vector3(0, 0.08, 0.0), 0.1, 0.1, 0.0, 8, DARK)
			out.head_y = 0.18
		3:
			pad(mk, p.stone2, 0.74, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.5, 0.1, p.wall)
			# radar mast beside
			mk.rod(Vector3(0.48, 0.04, -0.3), Vector3(0.48, 0.7, -0.3), 0.025, p.metal)
			out.spin = _radar(p)
			out.spin_pos = Vector3(0.48, 0.72, -0.3)
			out.spin_axis = Vector3(0, 1, 0)
			out.spin_speed = 2.5
			# head: four-tube SAM launcher
			hd.cyl(Vector3(0, 0, 0), 0.2, 0.18, 0.1, 10, Color(0.45, 0.5, 0.42))
			hd.push_at(Vector3(0, 0.22, 0.0))
			hd.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), -0.6))
			for sx in [-0.08, 0.08]:
				for sy in [-0.05, 0.05]:
					hd.rod(Vector3(sx, sy, -0.25), Vector3(sx, sy, 0.3), 0.04, WHITE, 8)
					hd.cone(Vector3(sx, sy, 0.3), 0.0, 0.0, 3, RED)
					hd.rod(Vector3(sx, sy, 0.3), Vector3(sx, sy, 0.38), 0.035, RED, 8, 0.002)
			hd.pop()
			hd.pop()
			hd.box(Vector3(0, 0.12, 0), Vector3(0.1, 0.16, 0.1), p.metal)
			out.head_y = 0.14
		_:
			pad(mk, p.stone2, 0.74, 0.04)
			mk.hexp(Vector3(0, 0.04, 0), 0.5, 0.18, p.wall, p.wall2)
			mk.glow = true
			mk.ring(Vector3(0, 0.22, 0), 0.5, 0.02, Color(1.0, 0.4, 0.9), 14, 3)
			mk.glow = false
			# head: dish emitter
			hd.cyl(Vector3(0, 0, 0), 0.18, 0.12, 0.2, 10, p.wall2)
			hd.push_at(Vector3(0, 0.3, 0))
			hd.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), 0.9))
			hd.cyl(Vector3(0, 0, 0), 0.06, 0.28, 0.12, 12, p.wall)
			hd.glow = true
			hd.sphere(Vector3(0, 0.14, 0), 0.06, Color(1.0, 0.45, 0.95), 8, 5)
			hd.glow = false
			hd.pop()
			hd.pop()
			out.head_y = 0.22
	out.head = commit(hd)

static func _radar(p: Dictionary) -> ArrayMesh:
	var mk := _new_part()
	mk.box(Vector3(0, 0.06, 0), Vector3(0.36, 0.1, 0.03), p.metal)
	for i in 5:
		mk.box(Vector3(-0.16 + i * 0.08, 0.06, 0.02), Vector3(0.02, 0.12, 0.02), p.wall)
	return commit(mk)

# ------------------------------------------------------------------ Airfield
static func _airfield(mk: MK, a: int, out: Dictionary) -> void:
	var p := pal(a)
	# runway along local z through the tile, extending past it
	match a:
		2:
			pad(mk, Color(0.5, 0.66, 0.3), 0.86, 0.02)
			mk.box(Vector3(-0.28, 0.025, 0.0), Vector3(0.3, 0.02, 1.9), Color(0.62, 0.76, 0.4))
			for i in 6:
				mk.box(Vector3(-0.28, 0.04, -0.8 + i * 0.32), Vector3(0.03, 0.01, 0.12), WHITE)
			# wooden hangar
			var h := Vector3(0.32, 0.02, -0.15)
			mk.box(h + Vector3(0, 0.15, 0), Vector3(0.36, 0.3, 0.5), WOOD2)
			mk.gable(h + Vector3(0, 0.3, 0), 0.36, 0.5, 0.14, p.roof, WOOD2, 0.03)
			mk.box(h + Vector3(-0.181, 0.13, 0), Vector3(0.01, 0.24, 0.36), DARK)
			# windsock
			mk.rod(Vector3(0.45, 0.02, 0.45), Vector3(0.45, 0.4, 0.45), 0.01, WHITE)
			mk.rod(Vector3(0.45, 0.38, 0.45), Vector3(0.58, 0.36, 0.45), 0.025, Color(1.0, 0.5, 0.15), 6, 0.012)
		3:
			pad(mk, p.stone2, 0.86, 0.02)
			mk.box(Vector3(-0.28, 0.025, 0.0), Vector3(0.34, 0.02, 2.0), Color(0.3, 0.31, 0.33))
			for i in 7:
				mk.box(Vector3(-0.28, 0.04, -0.9 + i * 0.3), Vector3(0.025, 0.01, 0.14), WHITE)
			var h := Vector3(0.33, 0.02, -0.2)
			mk.cyl(h + Vector3(0, 0, 0), 0.0, 0.0, 0.0, 3, p.wall)
			mk.box(h + Vector3(0, 0.17, 0), Vector3(0.36, 0.34, 0.5), p.wall)
			mk.dome(h + Vector3(0, 0.34, 0), 0.25, p.wall2, 8, 2, 0.3)
			mk.box(h + Vector3(-0.181, 0.14, 0), Vector3(0.01, 0.26, 0.4), p.metal)
			# control tower with radar
			var t := Vector3(0.38, 0.02, 0.35)
			mk.box(t + Vector3(0, 0.3, 0), Vector3(0.12, 0.6, 0.12), p.wall)
			mk.box(t + Vector3(0, 0.66, 0), Vector3(0.2, 0.12, 0.2), p.win)
			mk.box(t + Vector3(0, 0.73, 0), Vector3(0.22, 0.03, 0.22), p.roof)
			out.spin = _radar(p)
			out.spin_pos = t + Vector3(0, 0.76, 0)
			out.spin_axis = Vector3(0, 1, 0)
			out.spin_speed = 2.0
		_:
			pad(mk, p.stone2, 0.86, 0.02)
			mk.box(Vector3(-0.28, 0.025, 0.0), Vector3(0.36, 0.02, 2.0), p.wall2)
			mk.glow = true
			for i in 8:
				for sx in [-0.17, 0.17]:
					mk.box(Vector3(-0.28 + sx, 0.04, -0.9 + i * 0.26), Vector3(0.02, 0.01, 0.05), CYAN)
			mk.glow = false
			var h := Vector3(0.33, 0.02, -0.15)
			mk.dome(h, 0.3, p.wall, 10, 3, 0.9)
			mk.glow = true
			mk.box(h + Vector3(-0.2, 0.08, 0.0), Vector3(0.01, 0.12, 0.3), CYAN)
			mk.glow = false
			mk.cyl(Vector3(0.4, 0.02, 0.4), 0.14, 0.14, 0.02, 10, p.wall2)
			mk.glow = true
			mk.ring(Vector3(0.4, 0.04, 0.4), 0.12, 0.008, Color(1.0, 0.6, 0.2), 10, 3)
			mk.glow = false

# ------------------------------------------------------------------ Walls (shape follows neighbours)
## mask bit d set = a wall neighbour in direction d (yaw = PI/2 - d*PI/3 from +z... computed by caller)
static func _wall(mk: MK, a: int, mask: int, _out: Dictionary) -> void:
	var p := pal(a)
	var h: float = [0.42, 0.5, 0.5, 0.42, 0.32][a]
	var th: float = [0.12, 0.16, 0.16, 0.14, 0.06][a]
	var col: Color = [WOOD, p.stone, p.wall, p.stone, p.wall][a]
	# central post
	match a:
		0:
			mk.cyl(Vector3(0, 0, 0), 0.08, 0.08, h + 0.08, 6, WOOD)
			mk.cone(Vector3(0, h + 0.08, 0), 0.08, 0.1, 6, WOOD2)
		1:
			mk.box(Vector3(0, (h + 0.1) * 0.5, 0), Vector3(0.24, h + 0.1, 0.24), p.stone2)
			crenels_sq(mk, Vector3(0, h + 0.1, 0), 0.2, 0.07, p.stone2, 2)
		2:
			mk.box(Vector3(0, (h + 0.1) * 0.5, 0), Vector3(0.24, h + 0.1, 0.24), p.wall2)
			mk.box(Vector3(0, h + 0.12, 0), Vector3(0.28, 0.04, 0.28), p.trim)
		3:
			mk.box(Vector3(0, (h + 0.05) * 0.5, 0), Vector3(0.2, h + 0.05, 0.2), p.stone)
		_:
			mk.cyl(Vector3(0, 0, 0), 0.08, 0.06, h + 0.1, 6, p.wall2)
			mk.glow = true
			mk.sphere(Vector3(0, h + 0.12, 0), 0.045, CYAN, 6, 4)
			mk.glow = false
	var any := false
	for d in 6:
		if mask & (1 << d) == 0:
			continue
		any = true
		var dirv := Vector3(cos(-d * PI / 3.0), 0, sin(-d * PI / 3.0))
		# HexWorld.DIRS[d] in world: d0 = +x, d1 = (+0.5, -0.866) ... matches angle -d*60deg
		var yaw := atan2(dirv.x, dirv.z)
		var L := 0.87
		mk.push_at(dirv * L * 0.5, yaw)
		match a:
			0:
				for i in 4:
					var z := -L * 0.5 + (i + 0.5) * L / 4.0
					mk.cyl(Vector3(0, 0, z), 0.055, 0.055, h, 6, WOOD if i % 2 == 0 else WOOD2)
					mk.cone(Vector3(0, h, z), 0.055, 0.08, 6, WOOD2)
				mk.box(Vector3(0, h * 0.6, 0), Vector3(0.12, 0.03, L), WOOD.darkened(0.2))
			1:
				mk.box(Vector3(0, h * 0.5, 0), Vector3(th, h, L), col, col.lightened(0.05))
				for i in 3:
					mk.box(Vector3(0, h + 0.035, -L * 0.33 + i * L * 0.33), Vector3(th, 0.07, 0.09), col)
			2:
				mk.box(Vector3(0, h * 0.5, 0), Vector3(th, h, L), col)
				mk.box(Vector3(0, h + 0.015, 0), Vector3(th + 0.03, 0.03, L), p.trim)
				mk.box(Vector3(0, 0.05, 0), Vector3(th + 0.04, 0.1, L), p.stone)
			3:
				mk.cyl(Vector3(0, 0, 0), 0.0, 0.0, 0.0, 3, col)
				mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 1, 0), 0.0))
				mk.box(Vector3(0, 0.06, 0), Vector3(0.2, 0.12, L), col)
				mk.box(Vector3(0, h * 0.55, 0), Vector3(0.09, h * 0.8, L), col)
				mk.pop()
				mk.rod(Vector3(0, h + 0.03, -L * 0.5), Vector3(0, h + 0.03, L * 0.5), 0.012, Color(0.3, 0.3, 0.3), 4)
			_:
				mk.box(Vector3(0, 0.04, 0), Vector3(0.1, 0.08, L), p.wall2)
				mk.glow = true
				mk.box(Vector3(0, h * 0.6, 0), Vector3(0.012, h, L), Color(0.4, 0.85, 1.0))
				mk.glow = false
		mk.pop()
	if not any:
		# a lone wall piece: a short stub so it reads as a wall
		mk.push_at(Vector3.ZERO, 0.0)
		mk.box(Vector3(0, h * 0.4, 0), Vector3(0.5, h * 0.8, th), col)
		mk.pop()
