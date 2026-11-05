class_name UnitModels
extends RefCounted
## Procedural unit models: chunky cartoon soldiers with big heads, shields and weapons; rounded ship hulls
## with sails, oars, shields, cannons and funnels; aircraft per age. Enemies wear crimson and black,
## Bastion's forces royal blue and gold. Front faces +z. Results are cached.

static var cache := {}

const SKIN := Color(0.97, 0.78, 0.6)
const BEARD := Color(0.85, 0.45, 0.18)
const IRON := Color(0.62, 0.64, 0.68)
const DIRON := Color(0.3, 0.31, 0.34)
const WOOD := Color(0.5, 0.32, 0.18)
const WOOD2 := Color(0.66, 0.45, 0.26)
const BOOT := Color(0.24, 0.17, 0.12)
const E1 := Color(0.78, 0.13, 0.12)    # enemy crimson
const E2 := Color(0.14, 0.12, 0.13)    # enemy black
const A1 := Color(0.17, 0.42, 0.9)     # ally blue
const A2 := Color(0.98, 0.8, 0.25)     # ally gold
const WHITE := Color(0.96, 0.96, 0.94)
const GREY := Color(0.55, 0.58, 0.62)
const NAVY := Color(0.42, 0.45, 0.5)
const GLOW_R := Color(1.0, 0.25, 0.15)
const GLOW_C := Color(0.35, 0.95, 1.0)

static func get_mesh(type: String) -> ArrayMesh:
	if cache.has(type):
		return cache[type]
	var mk := MK.new()
	mk.ao = false
	match type:
		# ---- infantry
		"raider": _soldier(mk, "raider", E1, E2)
		"knight": _soldier(mk, "knight", E1, E2)
		"musketeer": _soldier(mk, "musket", E1, E2)
		"rifleman": _soldier(mk, "rifle", Color(0.45, 0.42, 0.38), E1)
		"marine": _soldier(mk, "marine", Color(0.4, 0.36, 0.34), E1)
		"exo": _soldier(mk, "exo", Color(0.28, 0.26, 0.28), GLOW_R)
		"militia": _soldier(mk, "militia", A1, A2)
		"musketeer_a": _soldier(mk, "musket", A1, A2)
		"rifleman_a": _soldier(mk, "rifle", Color(0.62, 0.58, 0.42), A1)
		"marine_a": _soldier(mk, "marine", Color(0.34, 0.42, 0.55), A1)
		"exo_a": _soldier(mk, "exo", Color(0.85, 0.88, 0.94), GLOW_C)
		# ---- ships
		"longship": _longship(mk, 1.6, false)
		"dragonship": _longship(mk, 2.6, true)
		"raider_boat": _rowboat(mk, 0.95, "raider")
		"longboat": _rowboat(mk, 1.05, "musket")
		"war_cog": _cog(mk)
		"frigate": _sailship(mk, 1.8, 2, 1)
		"galleon": _sailship(mk, 2.3, 3, 1)
		"ship_of_line": _sailship(mk, 3.1, 3, 3)
		"gunboat": _steamer(mk, 1.6, false)
		"steam_launch": _launch(mk)
		"ironclad": _steamer(mk, 2.3, true)
		"dreadnought": _warship(mk, 3.3, 3, 2, Color(0.46, 0.48, 0.5), false)
		"destroyer": _warship(mk, 2.7, 2, 1, NAVY, true)
		"battleship": _warship(mk, 3.7, 3, 1, Color(0.5, 0.52, 0.55), true)
		"landing_craft": _lcraft(mk)
		"missile_cruiser": _cruiser(mk)
		"hovercraft": _hover(mk)
		"carrier": _carrier(mk)
		# ---- aircraft
		"biplane": _biplane(mk, E1, E2)
		"ally_biplane": _biplane(mk, A1, WHITE)
		"zeppelin": _zeppelin(mk)
		"jet": _jet(mk, Color(0.4, 0.4, 0.43), E1, false)
		"ally_jet": _jet(mk, Color(0.7, 0.75, 0.8), A1, false)
		"stealth_jet": _jet(mk, Color(0.18, 0.18, 0.2), GLOW_R, true)
		"heavy_bomber": _bomber(mk)
		"nuke_bomber": _wing(mk, 2.6, Color(0.12, 0.12, 0.14), GLOW_R)
		"ally_drone": _wing(mk, 1.0, Color(0.92, 0.94, 0.97), GLOW_C)
		_:
			mk.box(Vector3(0, 0.15, 0), Vector3(0.3, 0.3, 0.3), Color.MAGENTA)
	var m := Models.commit(mk)
	cache[type] = m
	return m

## Hover/selection radius in world units, and height of the health bar
static func info(type: String) -> Vector2:
	if Defs.ENEMIES.has(type):
		var d: Dictionary = Defs.ENEMIES[type]
		var r: float = d.get("radius", 0.4)
		if d.domain == "ground":
			return Vector2(0.35, 0.6)
		if d.domain == "air":
			return Vector2(r + 0.4, 0.7)
		return Vector2(r + 0.3, 1.2 + r * 0.6)
	if type.begins_with("ally_"):
		return Vector2(0.8, 0.6)
	return Vector2(0.35, 0.6)

# ------------------------------------------------------------------ soldiers
static func _soldier(mk: MK, style: String, c1: Color, c2: Color) -> void:
	var exo := style == "exo"
	var s := 1.25 if exo else 1.0
	mk.push_at(Vector3.ZERO, 0.0, s)
	var trousers: Color = BOOT if style in ["raider", "militia"] else c2.darkened(0.3) if style != "marine" else c1.darkened(0.25)
	if style == "musket":
		trousers = WHITE.darkened(0.08)
	# legs + boots
	for sx in [-0.035, 0.035]:
		mk.box(Vector3(sx, 0.06, 0), Vector3(0.05, 0.1, 0.055), trousers)
		mk.box(Vector3(sx, 0.015, 0.01), Vector3(0.055, 0.03, 0.07), BOOT)
	# body
	var body: Color = c1
	if style == "knight":
		body = IRON
	mk.box(Vector3(0, 0.17, 0), Vector3(0.15, 0.14, 0.1), body, body.lightened(0.1))
	mk.box(Vector3(0, 0.115, 0), Vector3(0.155, 0.025, 0.105), Color(0.3, 0.2, 0.12))
	if style == "knight":
		mk.box(Vector3(0, 0.16, 0.052), Vector3(0.1, 0.13, 0.01), c1)
		mk.box(Vector3(0, 0.17, 0.058), Vector3(0.025, 0.07, 0.005), A2 if c1 == A1 else WHITE)
	if style == "musket":
		mk.rod(Vector3(-0.07, 0.24, 0.052), Vector3(0.07, 0.11, 0.052), 0.008, WHITE, 3)
		mk.rod(Vector3(0.07, 0.24, 0.052), Vector3(-0.07, 0.11, 0.052), 0.008, WHITE, 3)
	if style == "marine" or style == "rifle":
		mk.box(Vector3(0, 0.18, 0.0), Vector3(0.16, 0.09, 0.11), c1.darkened(0.15))
		mk.box(Vector3(0, 0.2, -0.06), Vector3(0.1, 0.1, 0.04), c1.darkened(0.3))
	if exo:
		mk.box(Vector3(0, 0.19, 0), Vector3(0.19, 0.12, 0.12), c1.lightened(0.1))
		mk.box(Vector3(-0.1, 0.22, 0), Vector3(0.06, 0.06, 0.1), c1)
		mk.box(Vector3(0.1, 0.22, 0), Vector3(0.06, 0.06, 0.1), c1)
		mk.glow = true
		mk.box(Vector3(0, 0.18, 0.062), Vector3(0.05, 0.03, 0.01), c2)
		mk.glow = false
	# arms
	for sx in [-0.095, 0.095]:
		mk.box(Vector3(sx, 0.17, 0.01), Vector3(0.04, 0.11, 0.045), body.darkened(0.1))
		mk.sphere(Vector3(sx, 0.11, 0.02), 0.022, SKIN if not exo and style != "knight" else body.darkened(0.2), 5, 3)
	# head (big)
	var hy := 0.31
	if not exo:
		mk.sphere(Vector3(0, hy, 0), 0.075, SKIN, 9, 6)
		mk.box(Vector3(-0.025, hy + 0.005, 0.07), Vector3(0.014, 0.018, 0.008), E2)
		mk.box(Vector3(0.025, hy + 0.005, 0.07), Vector3(0.014, 0.018, 0.008), E2)
	match style:
		"raider":
			mk.dome(Vector3(0, hy + 0.01, 0), 0.08, IRON, 8, 3)
			mk.box(Vector3(0, hy + 0.035, 0.075), Vector3(0.016, 0.05, 0.01), IRON)
			for sx in [-1.0, 1.0]:
				mk.rod(Vector3(sx * 0.07, hy + 0.05, 0), Vector3(sx * 0.12, hy + 0.1, 0.01), 0.016, WHITE, 5, 0.004)
			mk.box(Vector3(0, hy - 0.06, 0.05), Vector3(0.09, 0.07, 0.04), BEARD)
			# round shield + axe
			_round_shield(mk, Vector3(-0.13, 0.17, 0.03), 0.085, c1, WOOD2)
			mk.rod(Vector3(0.11, 0.1, 0.03), Vector3(0.11, 0.33, 0.06), 0.011, WOOD, 4)
			mk.box(Vector3(0.11, 0.31, 0.1), Vector3(0.015, 0.07, 0.06), IRON)
		"knight":
			mk.cyl(Vector3(0, hy - 0.07, 0), 0.082, 0.078, 0.15, 8, IRON, IRON.lightened(0.1))
			mk.box(Vector3(0, hy + 0.0, 0.078), Vector3(0.1, 0.014, 0.01), E2)
			mk.sphere(Vector3(0, hy + 0.11, -0.01), 0.04, c1, 6, 4, Vector3(0.6, 1.4, 1.2))
			_kite_shield(mk, Vector3(-0.135, 0.17, 0.03), c1, A2 if c1 == A1 else WHITE)
			mk.rod(Vector3(0.11, 0.12, 0.04), Vector3(0.11, 0.38, 0.1), 0.012, IRON, 4)
			mk.box(Vector3(0.11, 0.14, 0.045), Vector3(0.07, 0.012, 0.015), Color(0.7, 0.55, 0.2))
		"militia":
			mk.dome(Vector3(0, hy + 0.01, 0), 0.08, Color(0.55, 0.38, 0.22), 8, 2)
			_round_shield(mk, Vector3(-0.13, 0.17, 0.03), 0.075, c1, c2)
			mk.rod(Vector3(0.11, 0.02, 0.03), Vector3(0.11, 0.5, 0.06), 0.01, WOOD, 4)
			mk.cone(Vector3(0.11, 0.5, 0.06), 0.022, 0.07, 4, IRON)
		"musket":
			mk.cyl(Vector3(0, hy + 0.045, 0), 0.11, 0.09, 0.035, 3, E2 if c1 == E1 else Color(0.12, 0.15, 0.3), null, true, PI / 2)
			mk.sphere(Vector3(0.0, hy + 0.085, 0.0), 0.025, c2, 5, 3)
			mk.rod(Vector3(0.1, 0.08, -0.04), Vector3(0.1, 0.45, 0.08), 0.013, WOOD, 4)
			mk.rod(Vector3(0.1, 0.36, 0.05), Vector3(0.1, 0.47, 0.09), 0.008, DIRON, 4)
		"rifle":
			if c2 == E1:
				mk.dome(Vector3(0, hy + 0.01, 0), 0.085, Color(0.3, 0.3, 0.3), 8, 3)
				mk.cone(Vector3(0, hy + 0.08, 0), 0.015, 0.06, 4, IRON)
			else:
				mk.cyl(Vector3(0, hy + 0.04, 0), 0.11, 0.07, 0.03, 10, Color(0.42, 0.44, 0.32))
			mk.rod(Vector3(0.1, 0.12, -0.06), Vector3(0.1, 0.24, 0.2), 0.013, WOOD, 4)
			mk.rod(Vector3(0.1, 0.2, 0.12), Vector3(0.1, 0.26, 0.3), 0.007, IRON, 4)
		"marine":
			mk.dome(Vector3(0, hy + 0.005, 0), 0.088, c1.darkened(0.15), 9, 3)
			mk.box(Vector3(0, hy + 0.03, 0.075), Vector3(0.09, 0.02, 0.02), c1.darkened(0.3))
			mk.box(Vector3(0.09, 0.18, 0.1), Vector3(0.03, 0.05, 0.22), Color(0.18, 0.18, 0.2))
			mk.box(Vector3(0.09, 0.15, 0.04), Vector3(0.025, 0.06, 0.03), Color(0.18, 0.18, 0.2))
			mk.box(Vector3(-0.0, 0.17, -0.06), Vector3(0.02, 0.02, 0.02), c2)
		"exo":
			mk.box(Vector3(0, hy, 0), Vector3(0.13, 0.12, 0.13), c1, c1.lightened(0.15))
			mk.glow = true
			mk.box(Vector3(0, hy + 0.01, 0.066), Vector3(0.1, 0.03, 0.01), c2)
			mk.glow = false
			mk.box(Vector3(0.13, 0.18, 0.06), Vector3(0.07, 0.07, 0.22), c1.darkened(0.3))
			mk.glow = true
			mk.cyl(Vector3(0.13, 0.18, 0.17), 0.025, 0.025, 0.0, 6, c2)
			mk.glow = false
			mk.box(Vector3(0, 0.24, -0.08), Vector3(0.12, 0.12, 0.05), c1.darkened(0.2))
	mk.pop()

static func _round_shield(mk: MK, p: Vector3, r: float, face: Color, rim: Color) -> void:
	mk.push_at(p)
	mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), PI / 2))
	mk.cyl(Vector3(0, -0.012, 0), r, r, 0.024, 10, rim)
	mk.cyl(Vector3(0, -0.016, 0), r * 0.82, r * 0.82, 0.032, 10, face)
	mk.cyl(Vector3(0, -0.026, 0), r * 0.25, r * 0.15, 0.012, 8, IRON)
	mk.pop()
	mk.pop()

static func _kite_shield(mk: MK, p: Vector3, face: Color, mark: Color) -> void:
	mk.push_at(p, PI / 2)
	mk.slab([Vector2(-0.07, 0.0), Vector2(0.07, 0.0), Vector2(0.06, -0.0)], 0.0, 0.0, face)
	mk.pop()
	mk.box(p + Vector3(-0.01, 0.02, 0), Vector3(0.025, 0.15, 0.12), face)
	mk.box(p + Vector3(-0.01, -0.07, 0), Vector3(0.025, 0.04, 0.06), face)
	mk.box(p + Vector3(-0.025, 0.02, 0), Vector3(0.006, 0.1, 0.025), mark)
	mk.box(p + Vector3(-0.025, 0.04, 0), Vector3(0.006, 0.025, 0.08), mark)

## A tiny crew figure for boats
static func _crew(mk: MK, p: Vector3, style: String) -> void:
	mk.push_at(p, 0.0, 0.8)
	var coat: Color = E1 if style != "musket" else E1.darkened(0.1)
	mk.box(Vector3(0, 0.06, 0), Vector3(0.1, 0.1, 0.08), coat)
	mk.sphere(Vector3(0, 0.15, 0), 0.055, SKIN, 7, 4)
	if style == "raider":
		mk.dome(Vector3(0, 0.155, 0), 0.06, IRON, 7, 2)
		mk.rod(Vector3(0.05, 0.18, 0), Vector3(0.09, 0.22, 0), 0.012, WHITE, 4, 0.003)
		mk.rod(Vector3(-0.05, 0.18, 0), Vector3(-0.09, 0.22, 0), 0.012, WHITE, 4, 0.003)
	elif style == "musket":
		mk.cyl(Vector3(0, 0.185, 0), 0.08, 0.07, 0.025, 3, E2, null, true, PI / 2)
	else:
		mk.dome(Vector3(0, 0.155, 0), 0.062, Color(0.35, 0.35, 0.33), 7, 2)
	mk.pop()

# ------------------------------------------------------------------ ships
static func _striped_sail(mk: MK, c: Vector3, w: float, h: float, a: Color, b: Color, n: int = 5, billow: float = 0.06) -> void:
	for i in n:
		var y := c.y - h * 0.5 + h * (i + 0.5) / n
		var bz := sin(PI * (i + 0.5) / n) * billow
		mk.box(Vector3(c.x, y, c.z + bz), Vector3(w, h / n + 0.002, 0.015), a if i % 2 == 0 else b)

static func _oars(mk: MK, L: float, B: float, y: float, n: int) -> void:
	for side in [-1.0, 1.0]:
		for i in n:
			var z := -L * 0.3 + L * 0.6 * (i + 0.5) / n
			mk.rod(Vector3(side * B * 0.3, y, z), Vector3(side * (B * 0.5 + 0.28), -0.08, z - 0.05), 0.012, WOOD2, 4)

static func _shields_row(mk: MK, L: float, B: float, y: float, n: int) -> void:
	var cols := [E1, WHITE, E2, Color(0.95, 0.75, 0.2)]
	for side in [-1.0, 1.0]:
		for i in n:
			var z := -L * 0.32 + L * 0.64 * (i + 0.5) / n
			var w := pow(maxf(0.0, 1.0 - pow(absf(z) / (L * 0.5), 2.0)), 0.7)
			mk.push_at(Vector3(side * (B * 0.5 * w + 0.005), y, z), PI / 2 * side)
			mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), PI / 2))
			mk.cyl(Vector3(0, -0.01, 0), 0.055, 0.055, 0.02, 8, cols[(i + (1 if side > 0 else 0)) % 4])
			mk.cyl(Vector3(0, -0.015, 0), 0.016, 0.016, 0.03, 6, IRON)
			mk.pop()
			mk.pop()

static func _longship(mk: MK, L: float, boss: bool) -> void:
	var B := L * 0.26
	mk.hull(L, B, 0.16 * L / 1.6, WOOD, Color(0.35, 0.22, 0.12), WOOD2, 0.22 * L / 1.6, 0.18 * L / 1.6, 0.25, 0.75, 12)
	# curled prow and stern posts
	var pz := L * 0.5
	mk.rod(Vector3(0, 0.15 * L / 1.6, pz - 0.05), Vector3(0, 0.42 * L / 1.6, pz + 0.04), 0.035 * L / 1.6, WOOD, 6)
	mk.rod(Vector3(0, 0.12 * L / 1.6, -pz + 0.05), Vector3(0, 0.36 * L / 1.6, -pz - 0.04), 0.03 * L / 1.6, WOOD, 6)
	if boss:
		# dragon head with glowing eyes
		var hp := Vector3(0, 0.46 * L / 1.6, pz + 0.08)
		mk.sphere(hp, 0.1, Color(0.2, 0.45, 0.25), 8, 5, Vector3(0.8, 0.9, 1.4))
		mk.cone(hp + Vector3(0, 0, 0.1), 0.06, 0.0, 6, Color(0.2, 0.45, 0.25))
		mk.rod(hp + Vector3(0, 0.0, 0.08), hp + Vector3(0, -0.02, 0.24), 0.05, Color(0.2, 0.45, 0.25), 6, 0.02)
		for sx in [-0.05, 0.05]:
			mk.rod(hp + Vector3(sx, 0.06, -0.02), hp + Vector3(sx * 2.0, 0.16, -0.1), 0.015, WHITE, 4, 0.003)
		mk.glow = true
		mk.sphere(hp + Vector3(0.06, 0.03, 0.06), 0.02, GLOW_R, 5, 3)
		mk.sphere(hp + Vector3(-0.06, 0.03, 0.06), 0.02, GLOW_R, 5, 3)
		mk.glow = false
	else:
		mk.sphere(Vector3(0, 0.44 * L / 1.6, pz + 0.05), 0.04, WOOD2, 6, 4)
	_shields_row(mk, L, B, 0.1 * L / 1.6, 5 if not boss else 8)
	_oars(mk, L, B, 0.07, 4 if not boss else 6)
	# mast and striped sail
	var mh := 0.9 * L / 1.6
	mk.rod(Vector3(0, 0.0, 0.05), Vector3(0, mh, 0.05), 0.025 * L / 1.6, WOOD, 6)
	mk.rod(Vector3(-B * 0.9, mh * 0.88, 0.07), Vector3(B * 0.9, mh * 0.88, 0.07), 0.015 * L / 1.6, WOOD, 5)
	_striped_sail(mk, Vector3(0, mh * 0.55, 0.09), B * 1.7, mh * 0.62, E1, WHITE if not boss else E2, 5, 0.08 * L / 1.6)
	if boss:
		mk.rod(Vector3(0, 0.0, -0.6), Vector3(0, mh * 0.75, -0.6), 0.03, WOOD, 6)
		_striped_sail(mk, Vector3(0, mh * 0.45, -0.58), B * 1.3, mh * 0.45, E2, E1, 4, 0.06)
		# pennant
	mk.box(Vector3(0.08, mh - 0.04, 0.05), Vector3(0.16, 0.05, 0.01), E1)
	for i in (3 if not boss else 6):
		_crew(mk, Vector3((i % 2 - 0.5) * B * 0.4, 0.02, -L * 0.25 + i * L * 0.5 / maxf(1.0, (2.0 if not boss else 5.0))), "raider")

static func _rowboat(mk: MK, L: float, style: String) -> void:
	var B := L * 0.34
	mk.hull(L, B, 0.12, WOOD if style == "raider" else Color(0.35, 0.25, 0.2), E1 if style == "raider" else E2, WOOD2, 0.1, 0.06, 0.35, 0.8, 8)
	if style == "raider":
		_shields_row(mk, L, B, 0.06, 3)
		mk.rod(Vector3(0, 0.08, L * 0.47), Vector3(0, 0.24, L * 0.52), 0.025, WOOD, 6)
	else:
		mk.box(Vector3(0.0, 0.32, -L * 0.42), Vector3(0.16, 0.1, 0.01), E1)
		mk.rod(Vector3(0, 0.0, -L * 0.42), Vector3(0, 0.38, -L * 0.42), 0.012, WOOD, 4)
	_oars(mk, L, B, 0.05, 3)
	for i in 3:
		_crew(mk, Vector3(0, 0.01, -L * 0.25 + i * L * 0.25), style)

static func _cog(mk: MK) -> void:
	var L := 1.9
	var B := 0.7
	mk.hull(L, B, 0.32, WOOD, E2, WOOD2, 0.18, 0.22, 0.7, 0.6, 10)
	# castles fore and aft with crenellations
	for zz in [-0.65, 0.62]:
		var cz: float = zz
		mk.box(Vector3(0, 0.33, cz), Vector3(0.5, 0.22, 0.4), WOOD2)
		for i in 4:
			mk.box(Vector3(-0.2 + i * 0.133, 0.48, cz + 0.2), Vector3(0.07, 0.08, 0.04), WOOD)
			mk.box(Vector3(-0.2 + i * 0.133, 0.48, cz - 0.2), Vector3(0.07, 0.08, 0.04), WOOD)
		mk.box(Vector3(0, 0.33, cz + 0.205), Vector3(0.5, 0.05, 0.01), E1)
	mk.rod(Vector3(0, 0.1, 0), Vector3(0, 1.35, 0), 0.035, WOOD, 6)
	mk.rod(Vector3(-0.5, 1.2, 0.02), Vector3(0.5, 1.2, 0.02), 0.02, WOOD, 5)
	_striped_sail(mk, Vector3(0, 0.82, 0.05), 0.95, 0.72, E1, E2, 6, 0.1)
	mk.box(Vector3(0, 0.82, 0.12), Vector3(0.22, 0.22, 0.012), Color(0.95, 0.75, 0.2))
	mk.cone(Vector3(0, 1.35, 0), 0.06, 0.12, 5, E1)
	# ballista on the fore castle
	mk.box(Vector3(0, 0.5, 0.68), Vector3(0.06, 0.05, 0.3), WOOD)
	mk.rod(Vector3(-0.16, 0.52, 0.74), Vector3(0.16, 0.52, 0.74), 0.015, WOOD, 4)
	_crew(mk, Vector3(0.1, 0.44, -0.6), "raider")
	_crew(mk, Vector3(-0.1, 0.44, 0.55), "raider")

static func _sailship(mk: MK, L: float, masts: int, decks: int) -> void:
	var B := L * 0.3
	var D := 0.3 * L / 2.0
	mk.hull(L, B, D, Color(0.3, 0.18, 0.1), Color(0.88, 0.7, 0.25), WOOD2, 0.12, 0.28 * L / 2.0, 0.65, 0.55, 12)
	# gun ports with cannon muzzles
	for dk in decks:
		var y := 0.02 + dk * 0.1 - D * 0.1
		for side in [-1.0, 1.0]:
			for i in 6:
				var z := -L * 0.3 + L * 0.6 * (i + 0.5) / 6.0
				var w := pow(maxf(0.0, 1.0 - pow(absf(z) / (L * 0.5), 2.0)), 0.55) * B * 0.5
				mk.box(Vector3(side * w * 0.98, y, z), Vector3(0.02, 0.05, 0.06), Color(0.12, 0.08, 0.06))
				mk.rod(Vector3(side * w * 0.9, y, z), Vector3(side * (w + 0.06), y, z), 0.018, Color(0.15, 0.15, 0.16), 5)
	# stern castle
	mk.box(Vector3(0, 0.25 * L / 2.0, -L * 0.36), Vector3(B * 0.75, 0.22 * L / 2.0, L * 0.2), Color(0.35, 0.2, 0.12))
	mk.box(Vector3(0, 0.37 * L / 2.0, -L * 0.36), Vector3(B * 0.8, 0.02, L * 0.21), Color(0.88, 0.7, 0.25))
	mk.glow = true
	for sx in [-0.06, 0.06]:
		mk.box(Vector3(sx * L / 2.0, 0.26 * L / 2.0, -L * 0.465), Vector3(0.04, 0.05, 0.01), Color(1.0, 0.75, 0.35))
	mk.glow = false
	# bowsprit
	mk.rod(Vector3(0, 0.12, L * 0.45), Vector3(0, 0.3, L * 0.68), 0.02, WOOD, 5)
	var zs := [L * 0.22, -L * 0.02, -L * 0.24]
	var hs := [1.0, 1.15, 0.85]
	for m in masts:
		var z: float = zs[m] if masts == 3 else ([L * 0.15, -L * 0.15][m])
		var mh: float = 1.05 * L / 2.0 * hs[m if masts == 3 else m + 1]
		mk.rod(Vector3(0, 0.0, z), Vector3(0, mh, z), 0.025, WOOD, 6)
		var sw := B * 1.5
		for k in 3:
			var yy := mh * (0.35 + k * 0.24)
			var ww := sw * (1.0 - k * 0.2)
			mk.rod(Vector3(-ww * 0.55, yy + mh * 0.11, z + 0.02), Vector3(ww * 0.55, yy + mh * 0.11, z + 0.02), 0.012, WOOD, 4)
			var sc: Color = WHITE if (k + m) % 2 == 0 or decks < 3 else Color(0.92, 0.88, 0.8)
			_striped_sail(mk, Vector3(0, yy, z + 0.04), ww, mh * 0.2, sc, sc.darkened(0.06), 3, 0.05)
		mk.box(Vector3(0.1, mh + 0.02, z), Vector3(0.2, 0.05, 0.01), E1)
	# emblem on the main sail
	mk.box(Vector3(0, 1.05 * L / 2.0 * 0.6, (zs[1] if masts == 3 else -L * 0.15) + 0.09), Vector3(0.16, 0.16, 0.01), E1)

static func _funnel(mk: MK, p: Vector3, r: float, h: float, col: Color, band: Color) -> void:
	mk.cyl(p, r, r * 0.92, h, 8, col)
	mk.cyl(p + Vector3(0, h * 0.72, 0), r * 0.95, r * 0.95, h * 0.14, 8, band)
	mk.cyl(p + Vector3(0, h, 0), r * 0.7, r * 0.7, 0.0, 8, Color(0.08, 0.08, 0.08))

static func _turret(mk: MK, p: Vector3, s: float, col: Color, barrels: int, yaw: float = 0.0) -> void:
	mk.push_at(p, yaw, s)
	mk.cyl(Vector3(0, 0, 0), 0.16, 0.14, 0.1, 10, col, col.lightened(0.08))
	mk.box(Vector3(0, 0.1, -0.02), Vector3(0.22, 0.08, 0.24), col)
	for i in barrels:
		var x := (i - (barrels - 1) * 0.5) * 0.06
		mk.rod(Vector3(x, 0.1, 0.08), Vector3(x, 0.11, 0.4), 0.018, Color(0.22, 0.23, 0.25), 6)
	mk.pop()

static func _steamer(mk: MK, L: float, ironclad: bool) -> void:
	var B := L * 0.3
	var hull_c := Color(0.16, 0.16, 0.18) if ironclad else Color(0.32, 0.34, 0.36)
	mk.hull(L, B, 0.26 * L / 2.0, hull_c, E1, Color(0.5, 0.42, 0.32), 0.04, 0.02, 0.6, 0.5, 10, 0.3)
	if ironclad:
		# sloped casemate
		mk.cyl(Vector3(0, 0.0, 0.0), B * 0.5, B * 0.32, 0.22, 8, Color(0.24, 0.24, 0.26), null, true, PI / 8)
		mk.push_at(Vector3(0, 0.12, 0))
		for side in [-1.0, 1.0]:
			for i in 2:
				mk.rod(Vector3(side * B * 0.35, 0, -0.15 + i * 0.3), Vector3(side * (B * 0.5 + 0.08), 0.0, -0.15 + i * 0.3), 0.03, DIRON, 6)
		mk.pop()
		_funnel(mk, Vector3(0, 0.2, -0.05), 0.08, 0.38, Color(0.2, 0.2, 0.2), E1)
		mk.rod(Vector3(0, 0.0, L * 0.45), Vector3(0, -0.05, L * 0.55), 0.04, DIRON, 6, 0.01)
		mk.box(Vector3(0, 0.3, -L * 0.3), Vector3(0.18, 0.1, 0.14), Color(0.22, 0.22, 0.24))
		mk.rod(Vector3(0, 0.3, -L * 0.3), Vector3(0, 0.8, -L * 0.3), 0.015, WOOD, 4)
		mk.box(Vector3(0.08, 0.76, -L * 0.3), Vector3(0.16, 0.08, 0.01), E1)
	else:
		mk.box(Vector3(0, 0.1, -0.1), Vector3(B * 0.55, 0.16, L * 0.3), Color(0.75, 0.72, 0.65))
		mk.box(Vector3(0, 0.2, -0.1), Vector3(B * 0.6, 0.03, L * 0.32), E2)
		_funnel(mk, Vector3(0, 0.2, -0.05), 0.06, 0.3, Color(0.2, 0.2, 0.2), E1)
		_turret(mk, Vector3(0, 0.04, L * 0.3), 0.9, Color(0.38, 0.4, 0.42), 1)
		mk.rod(Vector3(0, 0.2, -L * 0.3), Vector3(0, 0.7, -L * 0.3), 0.012, WOOD, 4)
		mk.box(Vector3(0.07, 0.66, -L * 0.3), Vector3(0.14, 0.07, 0.01), E1)

static func _launch(mk: MK) -> void:
	var L := 1.1
	mk.hull(L, 0.38, 0.13, Color(0.3, 0.3, 0.32), E1, WOOD2, 0.06, 0.03, 0.5, 0.6, 8)
	mk.box(Vector3(0, 0.08, -0.25), Vector3(0.24, 0.12, 0.25), Color(0.75, 0.72, 0.65))
	_funnel(mk, Vector3(0, 0.12, -0.2), 0.04, 0.22, Color(0.2, 0.2, 0.2), E1)
	for i in 4:
		_crew(mk, Vector3((i % 2 - 0.5) * 0.16, 0.01, 0.0 + (i / 2) * 0.2), "rifle")

static func _warship(mk: MK, L: float, turrets: int, funnels: int, col: Color, modern: bool) -> void:
	var B := L * 0.2
	mk.hull(L, B, 0.24 * L / 2.7, col.darkened(0.15), E1.darkened(0.2), col.lightened(0.05), 0.08, 0.02, 0.55, 0.45, 12, 0.3)
	# superstructure
	mk.box(Vector3(0, 0.12, -0.05), Vector3(B * 0.55, 0.16, L * 0.32), col)
	mk.box(Vector3(0, 0.25, 0.05), Vector3(B * 0.45, 0.14, L * 0.14), col.lightened(0.08))
	mk.box(Vector3(0, 0.3, 0.12), Vector3(B * 0.42, 0.04, 0.02), Color(0.15, 0.2, 0.28))
	for f in funnels:
		_funnel(mk, Vector3(0, 0.2, -0.12 - f * 0.28), 0.07 * L / 2.7, 0.24 * L / 2.7, col.darkened(0.1), E2)
	var tz := [L * 0.3, L * 0.18, -L * 0.33]
	for t in turrets:
		_turret(mk, Vector3(0, 0.03 + (0.05 if t == 1 else 0.0), tz[t]), L / 2.7 * (1.1 if turrets == 3 else 0.9), col.lightened(0.04), 3 if turrets == 3 else 2, 0.0 if t < 2 else PI)
	# masts
	if modern:
		mk.rod(Vector3(0, 0.3, 0.0), Vector3(0, 0.75 * L / 2.7, 0.0), 0.02, col.darkened(0.2), 5)
		mk.box(Vector3(0, 0.6 * L / 2.7, 0.0), Vector3(0.22, 0.05, 0.03), col.darkened(0.2))
		mk.box(Vector3(0, 0.45, 0.06), Vector3(0.12, 0.12, 0.02), Color(0.3, 0.32, 0.36))
	else:
		for sx in [-0.06, 0.06]:
			mk.rod(Vector3(sx, 0.2, 0.08), Vector3(0, 0.9 * L / 3.3, 0.02), 0.018, col.darkened(0.2), 5)
		mk.rod(Vector3(0, 0.2, -0.08), Vector3(0, 0.9 * L / 3.3, 0.02), 0.018, col.darkened(0.2), 5)
		mk.box(Vector3(0, 0.9 * L / 3.3, 0.02), Vector3(0.12, 0.08, 0.12), col.darkened(0.1))
	mk.box(Vector3(0.09, 0.85 * L / 2.7, 0.0), Vector3(0.18, 0.07, 0.01), E1)

static func _lcraft(mk: MK) -> void:
	var c := Color(0.42, 0.44, 0.42)
	mk.box(Vector3(0, -0.02, 0), Vector3(0.5, 0.18, 1.2), c, Color(0.32, 0.33, 0.32))
	mk.box(Vector3(0, -0.02, 0), Vector3(0.42, 0.185, 1.0), Color(0.3, 0.31, 0.3))
	mk.box(Vector3(0, 0.05, 0.6), Vector3(0.48, 0.22, 0.04), c.lightened(0.06))
	mk.box(Vector3(0, 0.12, -0.5), Vector3(0.3, 0.2, 0.18), c.lightened(0.05))
	mk.box(Vector3(0, 0.0, 0), Vector3(0.505, 0.04, 1.205), E1.darkened(0.25))
	for i in 6:
		_crew(mk, Vector3((i % 2 - 0.5) * 0.2, 0.02, -0.2 + (i / 2) * 0.22), "marine")

static func _cruiser(mk: MK) -> void:
	var L := 2.9
	var col := Color(0.3, 0.31, 0.34)
	var B := L * 0.2
	mk.hull(L, B, 0.26, col.darkened(0.1), E2, col.lightened(0.05), 0.1, 0.02, 0.55, 0.45, 12, 0.3)
	# angular stealth superstructure
	mk.cyl(Vector3(0, 0.0, -0.05), B * 0.45, B * 0.25, 0.42, 4, col, null, true, PI / 4)
	mk.box(Vector3(0, 0.3, 0.12), Vector3(B * 0.32, 0.05, 0.02), Color(0.12, 0.14, 0.18))
	mk.glow = true
	for i in 8:
		mk.box(Vector3(-0.08 + (i % 2) * 0.16, 0.012, 0.65 + (i / 2) * 0.1), Vector3(0.06, 0.01, 0.06), GLOW_R)
	for i in 6:
		mk.box(Vector3(-0.08 + (i % 2) * 0.16, 0.012, -0.65 - (i / 2) * 0.1), Vector3(0.06, 0.01, 0.06), GLOW_R)
	mk.glow = false
	mk.rod(Vector3(0, 0.4, -0.05), Vector3(0, 0.9, -0.05), 0.025, col.darkened(0.2), 4)
	mk.box(Vector3(0, 0.78, -0.05), Vector3(0.24, 0.04, 0.04), col.darkened(0.2))
	_turret(mk, Vector3(0, 0.03, L * 0.38), 0.8, col, 1)

static func _hover(mk: MK) -> void:
	var skirt := Color(0.12, 0.12, 0.12)
	mk.cyl(Vector3(0, -0.06, 0), 0.4, 0.42, 0.12, 12, skirt)
	mk.push_basis(Vector3.ZERO, Basis.from_scale(Vector3(1.0, 1.0, 1.6)))
	mk.cyl(Vector3(0, 0.06, 0), 0.4, 0.37, 0.08, 12, Color(0.45, 0.42, 0.4))
	mk.pop()
	mk.box(Vector3(0, 0.2, 0.05), Vector3(0.4, 0.16, 0.6), Color(0.38, 0.36, 0.36))
	mk.box(Vector3(0, 0.25, 0.36), Vector3(0.3, 0.06, 0.02), Color(0.1, 0.12, 0.15))
	for sx in [-0.16, 0.16]:
		mk.cyl(Vector3(sx, 0.12, -0.5), 0.14, 0.14, 0.04, 10, E2)
		mk.push_at(Vector3(sx, 0.28, -0.52))
		mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), PI / 2))
		mk.ring(Vector3(0, 0, 0), 0.13, 0.02, Color(0.3, 0.3, 0.32), 12, 4)
		mk.pop()
		mk.pop()
	mk.glow = true
	mk.box(Vector3(0, 0.29, 0.35), Vector3(0.2, 0.015, 0.01), GLOW_R)
	mk.glow = false

static func _carrier(mk: MK) -> void:
	var L := 4.3
	var col := Color(0.36, 0.37, 0.4)
	mk.hull(L, L * 0.2, 0.32, col.darkened(0.12), E2, col, 0.05, 0.02, 0.7, 0.5, 12, 0.4)
	mk.box(Vector3(0.05, 0.2, 0), Vector3(1.0, 0.06, L * 0.95), Color(0.28, 0.29, 0.31))
	mk.box(Vector3(0.05, 0.231, 0), Vector3(0.03, 0.004, L * 0.9), WHITE)
	mk.box(Vector3(0.35, 0.231, 0.5), Vector3(0.02, 0.004, L * 0.4), Color(0.95, 0.8, 0.2))
	# island
	mk.box(Vector3(0.42, 0.45, -0.3), Vector3(0.16, 0.45, 0.6), col)
	mk.box(Vector3(0.42, 0.62, -0.18), Vector3(0.17, 0.05, 0.2), Color(0.1, 0.12, 0.16))
	mk.rod(Vector3(0.42, 0.65, -0.3), Vector3(0.42, 1.1, -0.3), 0.02, col.darkened(0.2), 4)
	mk.box(Vector3(0.42, 0.95, -0.3), Vector3(0.05, 0.05, 0.3), col.darkened(0.2))
	# parked jets
	for i in 3:
		mk.push_at(Vector3(-0.22, 0.24, -1.2 + i * 0.5), 0.3, 0.45)
		_jet(mk, Color(0.2, 0.2, 0.22), GLOW_R, true)
		mk.pop()

# ------------------------------------------------------------------ aircraft
static func _fuselage(mk: MK, L: float, r: float, col: Color, nose: Color) -> void:
	mk.rod(Vector3(0, 0, -L * 0.5), Vector3(0, 0, L * 0.28), r * 0.55, col, 8, r)
	mk.rod(Vector3(0, 0, L * 0.28), Vector3(0, 0, L * 0.5), r, nose, 8, r * 0.3)

static func _biplane(mk: MK, c1: Color, c2: Color) -> void:
	_fuselage(mk, 0.95, 0.075, c1, c2)
	for y in [-0.06, 0.12]:
		mk.box(Vector3(0, y, 0.12), Vector3(1.0, 0.025, 0.17), c1 if y < 0 else c2, (c1 if y < 0 else c2).lightened(0.1))
	for sx in [-0.38, 0.38, -0.15, 0.15]:
		mk.rod(Vector3(sx, -0.05, 0.12), Vector3(sx, 0.11, 0.12), 0.008, WOOD, 4)
	mk.box(Vector3(0, 0.0, -0.42), Vector3(0.34, 0.02, 0.1), c2)
	mk.box(Vector3(0, 0.07, -0.43), Vector3(0.02, 0.14, 0.1), c1)
	mk.box(Vector3(0, 0.09, -0.05), Vector3(0.08, 0.04, 0.1), Color(0.15, 0.15, 0.15))
	mk.cyl(Vector3(0, -0.02, 0.48), 0.0, 0.0, 0.0, 3, c2)
	mk.push_at(Vector3(0, 0, 0.49))
	mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), PI / 2))
	mk.cyl(Vector3(0, 0, 0), 0.16, 0.16, 0.006, 12, Color(0.75, 0.75, 0.72, 1.0))
	mk.pop()
	mk.pop()
	for sx in [-0.14, 0.14]:
		mk.rod(Vector3(sx, -0.06, 0.15), Vector3(sx, -0.14, 0.15), 0.008, DIRON, 4)
		mk.push_at(Vector3(sx, -0.15, 0.15))
		mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), PI / 2))
		mk.cyl(Vector3(0, -0.015, 0), 0.04, 0.04, 0.03, 8, Color(0.12, 0.12, 0.12))
		mk.pop()
		mk.pop()

static func _zeppelin(mk: MK) -> void:
	mk.sphere(Vector3(0, 0, 0), 0.4, Color(0.62, 0.6, 0.58), 12, 7, Vector3(1.0, 1.0, 3.2), Color(0.7, 0.68, 0.65))
	mk.ring(Vector3(0, 0, 0), 0.0, 0.0, E1, 3, 3)
	for i in 3:
		mk.push_at(Vector3(0, 0, -0.6 + i * 0.6))
		mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), PI / 2))
		mk.ring(Vector3.ZERO, 0.4 * sqrt(maxf(0.05, 1.0 - pow((-0.6 + i * 0.6) / 1.28, 2.0))), 0.02, E1, 14, 3)
		mk.pop()
		mk.pop()
	for a in [0.0, PI / 2, PI, PI * 1.5]:
		var d := Vector3(cos(a), sin(a), 0)
		mk.push_basis(Vector3(0, 0, -1.05) + d * 0.22, Basis(Vector3(0, 0, 1), a))
		mk.box(Vector3(0.12, 0, 0), Vector3(0.24, 0.02, 0.32), E1)
		mk.pop()
	mk.box(Vector3(0, -0.45, 0.1), Vector3(0.14, 0.1, 0.5), E2)
	mk.box(Vector3(0, -0.45, 0.36), Vector3(0.1, 0.06, 0.02), Color(1.0, 0.8, 0.4))
	for sx in [-0.2, 0.2]:
		mk.cyl(Vector3(sx, -0.35, -0.2), 0.04, 0.04, 0.08, 6, E2)

static func _jet(mk: MK, body: Color, mark: Color, stealth: bool) -> void:
	_fuselage(mk, 1.2, 0.08, body, body.darkened(0.15))
	var wing := [Vector2(0.0, 0.25), Vector2(0.55, -0.25), Vector2(0.55, -0.35), Vector2(0.0, -0.2)]
	var wing2 := [Vector2(0.0, 0.25), Vector2(0.0, -0.2), Vector2(-0.55, -0.35), Vector2(-0.55, -0.25)]
	if stealth:
		wing = [Vector2(0.0, 0.5), Vector2(0.6, -0.3), Vector2(0.4, -0.35), Vector2(0.0, -0.25)]
		wing2 = [Vector2(0.0, 0.5), Vector2(0.0, -0.25), Vector2(-0.4, -0.35), Vector2(-0.6, -0.3)]
	mk.slab(wing, -0.015, 0.03, body, body.lightened(0.08))
	mk.slab(wing2, -0.015, 0.03, body, body.lightened(0.08))
	mk.slab([Vector2(0.0, -0.4), Vector2(0.25, -0.58), Vector2(0.25, -0.62), Vector2(0.0, -0.55)], -0.01, 0.02, body)
	mk.slab([Vector2(0.0, -0.4), Vector2(0.0, -0.55), Vector2(-0.25, -0.62), Vector2(-0.25, -0.58)], -0.01, 0.02, body)
	for sx in ([-0.07, 0.07] if stealth else [0.0]):
		mk.push_at(Vector3(sx, 0.02, -0.45), 0.0)
		mk.push_basis(Vector3.ZERO, Basis(Vector3(0, 0, 1), (0.4 if sx > 0 else -0.4) if stealth else 0.0))
		mk.slab([Vector2(0.0, -0.18), Vector2(0.0, 0.05), Vector2(0.0, -0.18)], 0.0, 0.0, body)
		mk.box(Vector3(0, 0.12, -0.1), Vector3(0.018, 0.22, 0.18), body)
		mk.box(Vector3(0, 0.2, -0.13), Vector3(0.02, 0.06, 0.1), mark)
		mk.pop()
		mk.pop()
	mk.sphere(Vector3(0, 0.07, 0.25), 0.06, Color(0.15, 0.22, 0.3), 8, 4, Vector3(0.8, 0.7, 2.0))
	mk.box(Vector3(0.5, 0.0, -0.28), Vector3(0.1, 0.035, 0.08), mark)
	mk.box(Vector3(-0.5, 0.0, -0.28), Vector3(0.1, 0.035, 0.08), mark)
	mk.glow = true
	mk.cyl(Vector3(0, 0, -0.62), 0.05, 0.05, 0.0, 8, Color(1.0, 0.6, 0.25) if not stealth else mark)
	mk.glow = false

static func _bomber(mk: MK) -> void:
	var body := Color(0.35, 0.36, 0.34)
	_fuselage(mk, 2.0, 0.13, body, Color(0.3, 0.35, 0.4))
	mk.slab([Vector2(1.2, -0.05), Vector2(1.2, -0.22), Vector2(-1.2, -0.22), Vector2(-1.2, -0.05), Vector2(0.0, 0.25)], -0.02, 0.04, body, body.lightened(0.08))
	mk.slab([Vector2(0.42, -0.85), Vector2(0.42, -0.95), Vector2(-0.42, -0.95), Vector2(-0.42, -0.85), Vector2(0.0, -0.7)], -0.01, 0.03, body)
	mk.box(Vector3(0, 0.18, -0.9), Vector3(0.03, 0.34, 0.2), body)
	mk.box(Vector3(0, 0.3, -0.92), Vector3(0.035, 0.08, 0.14), E1)
	for sx in [-0.75, -0.4, 0.4, 0.75]:
		mk.rod(Vector3(sx, -0.04, -0.15), Vector3(sx, -0.04, 0.22), 0.06, body.darkened(0.1), 8)
		mk.push_at(Vector3(sx, -0.04, 0.23))
		mk.push_basis(Vector3.ZERO, Basis(Vector3(1, 0, 0), PI / 2))
		mk.cyl(Vector3(0, 0, 0), 0.14, 0.14, 0.006, 10, Color(0.75, 0.75, 0.72))
		mk.pop()
		mk.pop()
	mk.box(Vector3(1.05, 0.0, -0.14), Vector3(0.18, 0.045, 0.1), E1)
	mk.box(Vector3(-1.05, 0.0, -0.14), Vector3(0.18, 0.045, 0.1), E1)
	mk.sphere(Vector3(0, 0.08, 0.75), 0.08, Color(0.15, 0.22, 0.3), 8, 4, Vector3(1.0, 0.7, 1.6))

static func _wing(mk: MK, span: float, body: Color, glow: Color) -> void:
	var s := span / 2.6
	mk.slab([Vector2(0, 0.8 * s), Vector2(1.3 * s, -0.3 * s), Vector2(1.15 * s, -0.42 * s), Vector2(0.7 * s, -0.25 * s), Vector2(0.45 * s, -0.42 * s),
		Vector2(0.0, -0.25 * s), Vector2(-0.45 * s, -0.42 * s), Vector2(-0.7 * s, -0.25 * s), Vector2(-1.15 * s, -0.42 * s), Vector2(-1.3 * s, -0.3 * s)], -0.04 * s, 0.08 * s, body, body.lightened(0.06))
	mk.sphere(Vector3(0, 0.04 * s, 0.25 * s), 0.25 * s, body.lightened(0.05), 10, 4, Vector3(1.2, 0.4, 2.0))
	mk.box(Vector3(0, 0.1 * s, 0.4 * s), Vector3(0.18 * s, 0.03 * s, 0.1 * s), Color(0.1, 0.12, 0.16))
	mk.glow = true
	for sx in [-0.3, 0.3]:
		mk.box(Vector3(sx * s, 0.02 * s, -0.3 * s), Vector3(0.18 * s, 0.03 * s, 0.03 * s), glow)
	mk.box(Vector3(1.2 * s, 0.0, -0.32 * s), Vector3(0.08 * s, 0.03 * s, 0.03 * s), glow)
	mk.box(Vector3(-1.2 * s, 0.0, -0.32 * s), Vector3(0.08 * s, 0.03 * s, 0.03 * s), glow)
	mk.glow = false
