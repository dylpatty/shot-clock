class_name TerrainView
extends Node3D
## Draws the island: chunky bevelled hex tiles with earthy cliff sides (one merged mesh), faceted mountains,
## rocky hill mounds, the sea floor, roads, MultiMesh nature (pines, broadleaf trees, bushes, rocks, grass
## tufts, flowers), the water plane and the lighthouse rock.

var terrain_mi: MeshInstance3D
var road_mi: MeshInstance3D
var water_mi: MeshInstance3D
var terrain_mat: ShaderMaterial
var water_mat: ShaderMaterial
var prop_mats := {}
var props := {}           # name -> MultiMeshInstance3D
var lighthouse: Node3D
var beam: Node3D
var _types := PackedByteArray()
var _ruins := PackedInt32Array()
var _dirty := false
var _built_for = null
var tri_count := 0

# arrays for the terrain builder
var _v := PackedVector3Array()
var _n := PackedVector3Array()
var _c := PackedColorArray()
var _uv := PackedVector2Array()

func _ready() -> void:
	terrain_mat = ShaderMaterial.new()
	terrain_mat.shader = load("res://shaders/terrain.gdshader")
	terrain_mat.set_shader_parameter("grass_tex", load("res://assets/tex/grass.jpg"))
	terrain_mat.set_shader_parameter("sand_tex", load("res://assets/tex/sand.jpg"))
	terrain_mat.set_shader_parameter("rock_tex", load("res://assets/tex/rock.jpg"))
	terrain_mat.set_shader_parameter("cliff_tex", load("res://assets/tex/cliff.jpg"))
	terrain_mat.set_shader_parameter("caustics_tex", load("res://assets/tex/caustics.jpg"))
	terrain_mi = MeshInstance3D.new()
	add_child(terrain_mi)
	road_mi = MeshInstance3D.new()
	road_mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(road_mi)
	water_mat = ShaderMaterial.new()
	water_mat.shader = load("res://shaders/water.gdshader")
	water_mat.set_shader_parameter("normal_tex", load("res://assets/tex/waternormals.jpg"))
	var pm := PlaneMesh.new()
	pm.size = Vector2(320, 320)
	pm.subdivide_width = 200
	pm.subdivide_depth = 200
	water_mi = MeshInstance3D.new()
	water_mi.mesh = pm
	water_mi.material_override = water_mat
	water_mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(water_mi)
	# dark ocean floor beyond the map so the edge of the sea bed never shows through the water
	var floor_mesh := PlaneMesh.new()
	floor_mesh.size = Vector2(320, 320)
	var fm := StandardMaterial3D.new()
	fm.albedo_color = Color(0.06, 0.16, 0.24)
	fm.roughness = 1.0
	var floor_mi := MeshInstance3D.new()
	floor_mi.mesh = floor_mesh
	floor_mi.material_override = fm
	floor_mi.position = Vector3(0, -3.3, 0)
	floor_mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(floor_mi)
	var psh: Shader = load("res://shaders/prop.gdshader")
	for k in ["tree", "grass", "rock"]:
		var m := ShaderMaterial.new()
		m.shader = psh
		m.set_shader_parameter("sway", {"tree": 0.025, "grass": 0.6, "rock": 0.0}[k])
		prop_mats[k] = m
	G.world_changed.connect(func(): _dirty = true)

func _process(_d: float) -> void:
	if _dirty:
		_dirty = false
		refresh()
	if beam:
		beam.rotation.y += _d * 0.9

## Full rebuild for a new island
func rebuild() -> void:
	_built_for = G.W
	_types = PackedByteArray()
	refresh()
	_build_lighthouse()

func refresh() -> void:
	var W: HexWorld = G.W
	if W.count == 0:
		return
	if _built_for != W:
		_built_for = W
		_types = PackedByteArray()
		_build_lighthouse()
	if _types != W.type or _ruins != W.ruin:
		_types = W.type.duplicate()
		_ruins = W.ruin.duplicate()
		_build_terrain()
	_build_roads()
	_build_props()

# ------------------------------------------------------------------ terrain mesh
func _tri(A: Vector3, B: Vector3, C: Vector3, col: Color, m: int, ref: Vector3) -> void:
	var nn := (C - A).cross(B - A)
	if nn.length_squared() < 1e-12:
		return
	nn = nn.normalized()
	if nn.dot((A + B + C) / 3.0 - ref) < 0.0:
		var t := B
		B = C
		C = t
		nn = -nn
	_v.append(A); _v.append(B); _v.append(C)
	_n.append(nn); _n.append(nn); _n.append(nn)
	_c.append(col); _c.append(col); _c.append(col)
	var uv := Vector2(m, 0)
	_uv.append(uv); _uv.append(uv); _uv.append(uv)

func _quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3, col: Color, m: int, ref: Vector3) -> void:
	_tri(a, b, c, col, m, ref)
	_tri(a, c, d, col, m, ref)

static func corner(k: int, r: float) -> Vector3:
	var a := deg_to_rad(30.0 + 60.0 * k)
	return Vector3(cos(a) * r, 0, sin(a) * r)

func _vary(col: Color, i: int, amt: float) -> Color:
	var v := (HexWorld.hash2(i, 31) - 0.5) * amt
	var hshift := (HexWorld.hash2(i, 47) - 0.5) * amt * 0.5
	return Color(clampf(col.r + v + hshift, 0, 1), clampf(col.g + v, 0, 1), clampf(col.b + v - hshift, 0, 1))

func floor_h(i: int) -> float:
	var W: HexWorld = G.W
	if i == W.islet:
		return W.h[i]
	return W.h[i]

func _top_info(i: int) -> Array:
	var W: HexWorld = G.W
	var t: int = W.type[i]
	var col := Color(0.45, 0.74, 0.27)
	var m := 0
	if i == W.islet:
		return [_vary(Color(0.56, 0.55, 0.53), i, 0.08), 2]
	if t == Defs.DEEP:
		col = Color(0.42, 0.5, 0.52)
		m = 4
	elif t == Defs.SHALLOW:
		col = Color(0.9, 0.84, 0.62)
		m = 4
	elif t == Defs.SAND:
		col = Color(0.96, 0.86, 0.6)
		m = 1
	elif t == Defs.GRASS:
		col = Color(0.45, 0.75, 0.27) if W.h[i] < 0.6 else Color(0.41, 0.69, 0.25)
	elif t == Defs.FOREST:
		col = Color(0.30, 0.54, 0.20)
	elif t == Defs.HILLS:
		col = Color(0.60, 0.64, 0.35)
	else:
		col = Color(0.58, 0.57, 0.56)
		m = 2
	if W.ruin[i] != 0:
		col = col.lerp(Color(0.3, 0.27, 0.24), 0.6)
	return [_vary(col, i, 0.06), m]

func _build_terrain() -> void:
	var W: HexWorld = G.W
	_v = PackedVector3Array(); _n = PackedVector3Array(); _c = PackedColorArray(); _uv = PackedVector2Array()
	for i in W.count:
		var t: int = W.type[i]
		var land: bool = HexWorld.is_land(t) or i == W.islet
		var h: float = W.h[i]
		var cen := Vector3(W.x[i], h, W.z[i])
		var info := _top_info(i)
		var tc: Color = info[0]
		var m: int = info[1]
		var rt := 0.9 if land else 1.0
		var bev := 0.08 if land else 0.0
		var ref := cen - Vector3(0, 0.5, 0)
		# top
		for k in 6:
			_tri(cen, cen + corner(k, rt), cen + corner(k + 1, rt), tc, m, ref)
		if land:
			var bc := tc.darkened(0.1)
			for k in 6:
				var a := cen + corner(k, rt)
				var b := cen + corner(k + 1, rt)
				var c := cen + corner(k + 1, 1.0) - Vector3(0, bev, 0)
				var d := cen + corner(k, 1.0) - Vector3(0, bev, 0)
				_quad(a, b, c, d, bc, m, ref)
		# sides down to the lower neighbour
		for k in 6:
			var dvec: Vector2i = HexWorld.DIRS[5 - k]
			var j := W.tile_index(W.q[i] + dvec.x, W.r[i] + dvec.y)
			var nh := -3.2
			if j >= 0:
				nh = W.h[j]
			var ytop := h - bev
			if nh >= ytop - 0.001:
				continue
			var ybot := maxf(nh - (0.0 if j >= 0 else 0.0), -3.2)
			var a2 := Vector3(W.x[i], 0, W.z[i]) + corner(k, 1.0)
			var b2 := Vector3(W.x[i], 0, W.z[i]) + corner(k + 1, 1.0)
			var sref := Vector3(W.x[i], (ytop + ybot) * 0.5, W.z[i])
			if land:
				var dirt := Color(0.55, 0.40, 0.25) if t != Defs.SAND else Color(0.86, 0.76, 0.52)
				var rock := Color(0.56, 0.51, 0.46) if t != Defs.SAND else Color(0.74, 0.66, 0.5)
				if t == Defs.MOUNTAIN or t == Defs.HILLS or i == W.islet:
					dirt = Color(0.58, 0.54, 0.5)
					rock = Color(0.5, 0.48, 0.46)
				dirt = _vary(dirt, i + k, 0.05)
				rock = _vary(rock, i * 3 + k, 0.06)
				var ymid := maxf(ybot, ytop - 0.22)
				_quad(a2 + Vector3(0, ytop, 0), b2 + Vector3(0, ytop, 0), b2 + Vector3(0, ymid, 0), a2 + Vector3(0, ymid, 0), dirt, 3, sref)
				if ymid > ybot + 0.001:
					var yl := ybot
					var ystep := maxf(0.45, (ymid - ybot) * 0.5)
					var y0 := ymid
					var band := 0
					while y0 > yl + 0.001:
						var y1 := maxf(yl, y0 - ystep)
						var rc := rock.darkened(0.06 * band) if y1 > -0.05 else rock.darkened(0.25)
						_quad(a2 + Vector3(0, y0, 0), b2 + Vector3(0, y0, 0), b2 + Vector3(0, y1, 0), a2 + Vector3(0, y1, 0), rc, 3, sref)
						y0 = y1
						band += 1
			else:
				_quad(a2 + Vector3(0, ytop, 0), b2 + Vector3(0, ytop, 0), b2 + Vector3(0, ybot, 0), a2 + Vector3(0, ybot, 0), tc.darkened(0.2), 4, sref)
		if t == Defs.MOUNTAIN:
			_mountain(i, cen)
		elif t == Defs.HILLS and W.bld[i] == 0:
			_mounds(i, cen)
	var arr := []
	arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = _v
	arr[Mesh.ARRAY_NORMAL] = _n
	arr[Mesh.ARRAY_COLOR] = _c
	arr[Mesh.ARRAY_TEX_UV] = _uv
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	mesh.surface_set_material(0, terrain_mat)
	terrain_mi.mesh = mesh
	tri_count = _v.size() / 3
	_v = PackedVector3Array(); _n = PackedVector3Array(); _c = PackedColorArray(); _uv = PackedVector2Array()

func _mountain(i: int, cen: Vector3) -> void:
	var n := 1 + int(HexWorld.hash2(i, 5) * 2.99)
	for p in n:
		var a := HexWorld.hash2(i, 60 + p) * TAU
		var off := 0.0 if p == 0 else 0.35 + HexWorld.hash2(i, 70 + p) * 0.15
		var base := cen + Vector3(cos(a) * off, -0.02, sin(a) * off)
		var hgt := (1.1 + HexWorld.hash2(i, 80 + p) * 1.0 + (cen.y - 1.3) * 1.5) * (1.0 if p == 0 else 0.6)
		var rad := (0.68 + HexWorld.hash2(i, 90 + p) * 0.18) * (1.0 if p == 0 else 0.6)
		var seg := 6 + (p % 2)
		var ring0: Array = []
		var ring1: Array = []
		var rot := HexWorld.hash2(i, 100 + p) * TAU
		for s in seg:
			var an := rot + TAU * s / seg
			var j0 := 0.85 + HexWorld.hash2(i * 7 + s, 110 + p) * 0.3
			var j1 := 0.75 + HexWorld.hash2(i * 7 + s, 120 + p) * 0.5
			ring0.append(base + Vector3(cos(an) * rad * j0, 0, sin(an) * rad * j0))
			ring1.append(base + Vector3(cos(an + 0.2) * rad * 0.42 * j1, hgt * (0.5 + HexWorld.hash2(i + s, 130 + p) * 0.12), sin(an + 0.2) * rad * 0.42 * j1))
		var apex := base + Vector3((HexWorld.hash2(i, 140 + p) - 0.5) * 0.12, hgt, (HexWorld.hash2(i, 150 + p) - 0.5) * 0.12)
		var ref := base + Vector3(0, hgt * 0.3, 0)
		for s in seg:
			var s2 := (s + 1) % seg
			var g := 0.5 + HexWorld.hash2(i * 13 + s, 160 + p) * 0.12
			var low := Color(g, g * 0.99, g * 1.02)
			_quad(ring0[s], ring0[s2], ring1[s2], ring1[s], low, 2, ref)
			var snow := Color(0.92, 0.93, 0.96) if hgt > 1.2 else Color(0.72, 0.72, 0.74)
			_tri(ring1[s], ring1[s2], apex, snow.darkened(HexWorld.hash2(i + s, 170) * 0.08), 2, ref)

func _mounds(i: int, cen: Vector3) -> void:
	var n := 2
	for p in n:
		var a := HexWorld.hash2(i, 200 + p) * TAU
		var off := 0.25 + HexWorld.hash2(i, 210 + p) * 0.3
		var base := cen + Vector3(cos(a) * off, -0.02, sin(a) * off)
		var r := 0.3 + HexWorld.hash2(i, 220 + p) * 0.18
		var hh := 0.16 + HexWorld.hash2(i, 230 + p) * 0.16
		var seg := 7
		var ring: Array = []
		for s in seg:
			var an := TAU * s / seg + a
			var j := 0.85 + HexWorld.hash2(i * 5 + s, 240 + p) * 0.3
			ring.append(base + Vector3(cos(an) * r * j, hh * 0.55, sin(an) * r * j))
		var top := base + Vector3(0, hh, 0)
		var ref := base
		var col := _vary(Color(0.56, 0.62, 0.33), i + p, 0.06)
		var rk := _vary(Color(0.62, 0.6, 0.56), i + p * 3, 0.05)
		for s in seg:
			var s2 := (s + 1) % seg
			var b0: Vector3 = base + (ring[s] - base) * Vector3(1.35, 0, 1.35)
			var b1: Vector3 = base + (ring[s2] - base) * Vector3(1.35, 0, 1.35)
			_quad(b0, b1, ring[s2], ring[s], rk if (s + p) % 3 == 0 else col.darkened(0.08), 0, ref)
			_tri(ring[s], ring[s2], top, col, 0, ref)

# ------------------------------------------------------------------ roads
func _build_roads() -> void:
	var W: HexWorld = G.W
	var age: int = G.age
	var cols := [Color(0.66, 0.52, 0.34), Color(0.70, 0.66, 0.6), Color(0.58, 0.55, 0.52), Color(0.30, 0.31, 0.33), Color(0.78, 0.82, 0.88)]
	var col: Color = cols[clampi(age, 0, 4)]
	var edge_col: Color = col.darkened(0.2) if age < 3 else Color(0.75, 0.75, 0.72)
	_v = PackedVector3Array(); _n = PackedVector3Array(); _c = PackedColorArray(); _uv = PackedVector2Array()
	var any := false
	for i in W.count:
		if W.road[i] == 0:
			continue
		any = true
		var cen := Vector3(W.x[i], W.h[i] + 0.025, W.z[i])
		var ref := cen - Vector3(0, 1, 0)
		var c2: Color = col if W.conn[i] != 0 else col.lerp(Color(0.7, 0.35, 0.3), 0.35)
		var mm := 2 if age <= 1 else 4
		for k in 6:
			_tri(cen, cen + corner(k, 0.36), cen + corner(k + 1, 0.36), c2, mm, ref)
		for d in 6:
			var j := W.nbr[i * 6 + d]
			if j < 0:
				continue
			if W.road[j] == 0 and W.bld[j] == 0:
				continue
			var dv := Vector3(W.x[j] - W.x[i], 0, W.z[j] - W.z[i]).normalized()
			var side := Vector3(-dv.z, 0, dv.x) * 0.2
			var mid := Vector3(W.x[i], 0, W.z[i]) + dv * 0.866
			var ym := (W.h[i] + W.h[j]) * 0.5 + 0.025 if W.road[j] != 0 else W.h[i] + 0.025
			var p0 := cen + dv * 0.18
			var p1 := Vector3(mid.x, ym, mid.z) + dv * (0.02 if W.road[j] != 0 else -0.15)
			_quad(p0 - side, p0 + side, p1 + side, p1 - side, c2, mm, ref + dv * 0.5)
			if age >= 3:
				var ls := side * 0.12
				var up := Vector3(0, 0.004, 0)
				_quad(p0 - ls + up, p0 + ls + up, p1 + ls + up, p1 - ls + up, Color(0.95, 0.85, 0.3) if age == 3 else Color(0.4, 0.95, 1.0), mm, ref + dv * 0.5)
			else:
				var up2 := Vector3(0, -0.004, 0)
				_quad(p0 - side * 1.18 + up2, p0 + side * 1.18 + up2, p1 + side * 1.18 + up2, p1 - side * 1.18 + up2, edge_col, mm, ref + dv * 0.5)
	if not any:
		road_mi.mesh = null
		return
	var arr := []
	arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = _v
	arr[Mesh.ARRAY_NORMAL] = _n
	arr[Mesh.ARRAY_COLOR] = _c
	arr[Mesh.ARRAY_TEX_UV] = _uv
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	mesh.surface_set_material(0, terrain_mat)
	road_mi.mesh = mesh
	_v = PackedVector3Array(); _n = PackedVector3Array(); _c = PackedColorArray(); _uv = PackedVector2Array()

# ------------------------------------------------------------------ nature props
static var _prop_meshes := {}

static func prop_mesh(kind: String) -> ArrayMesh:
	if _prop_meshes.has(kind):
		return _prop_meshes[kind]
	var mk := MK.new()
	mk.ao = true
	mk.ao_h = 0.5
	match kind:
		"pine":
			mk.cyl(Vector3(0, 0, 0), 0.06, 0.045, 0.3, 6, Color(0.42, 0.27, 0.15))
			mk.cone(Vector3(0, 0.18, 0), 0.4, 0.46, 7, Color(0.13, 0.36, 0.17), 0.2)
			mk.cone(Vector3(0, 0.44, 0), 0.32, 0.42, 7, Color(0.16, 0.42, 0.2), 0.6)
			mk.cone(Vector3(0, 0.7, 0), 0.22, 0.4, 7, Color(0.2, 0.49, 0.23), 1.1)
		"broadleaf":
			mk.cyl(Vector3(0, 0, 0), 0.06, 0.045, 0.38, 6, Color(0.45, 0.3, 0.17))
			mk.rod(Vector3(0, 0.3, 0), Vector3(0.12, 0.45, 0.04), 0.03, Color(0.45, 0.3, 0.17), 5)
			mk.sphere(Vector3(0, 0.56, 0), 0.3, Color(0.33, 0.6, 0.21), 8, 5, Vector3(1, 0.85, 1))
			mk.sphere(Vector3(0.17, 0.62, 0.06), 0.22, Color(0.38, 0.66, 0.24), 7, 4)
			mk.sphere(Vector3(-0.14, 0.66, -0.08), 0.2, Color(0.36, 0.64, 0.22), 7, 4)
			mk.sphere(Vector3(0.0, 0.78, 0.02), 0.17, Color(0.42, 0.7, 0.27), 7, 4)
		"bush":
			mk.sphere(Vector3(0, 0.1, 0), 0.15, Color(0.3, 0.56, 0.2), 7, 4, Vector3(1, 0.75, 1))
			mk.sphere(Vector3(0.1, 0.08, 0.05), 0.1, Color(0.34, 0.6, 0.22), 6, 3)
		"rock":
			mk.sphere(Vector3(0, 0.06, 0), 0.16, Color(0.62, 0.61, 0.6), 6, 3, Vector3(1.0, 0.7, 0.85), Color(0.7, 0.69, 0.68))
			mk.sphere(Vector3(0.13, 0.03, 0.06), 0.08, Color(0.56, 0.55, 0.54), 5, 3, Vector3(1.0, 0.7, 0.9))
		"grass":
			mk.ao = false
			for b in 5:
				var a := TAU * b / 5.0 + 0.3
				var p := Vector3(cos(a) * 0.04, 0, sin(a) * 0.04)
				var tip := p * 2.2 + Vector3(0, 0.16 + 0.04 * (b % 2), 0)
				var side := Vector3(-sin(a), 0, cos(a)) * 0.018
				mk.tri(p - side, p + side, tip, Color(0.42, 0.7, 0.24) if b % 2 else Color(0.5, 0.78, 0.3))
		"flower":
			mk.ao = false
			for b in 4:
				var a := TAU * b / 4.0
				var p := Vector3(cos(a) * 0.06, 0.06 + 0.02 * (b % 2), sin(a) * 0.06)
				mk.rod(p - Vector3(0, 0.06, 0), p, 0.006, Color(0.35, 0.6, 0.2), 3)
				mk.sphere(p, 0.026, Color(1, 1, 1), 5, 3)
		"boulder":
			mk.sphere(Vector3(0, 0.12, 0), 0.26, Color(0.6, 0.59, 0.58), 7, 4, Vector3(1.0, 0.75, 0.9), Color(0.68, 0.67, 0.66))
	var m := Models.commit(mk)
	# props use the prop shader; strip the model materials (MultiMesh gets material_override)
	_prop_meshes[kind] = m
	return m

func _mm(kind: String, mat_key: String, xforms: Array, tints: Array) -> void:
	var mmi: MultiMeshInstance3D = props.get(kind)
	if mmi == null:
		mmi = MultiMeshInstance3D.new()
		mmi.material_override = prop_mats[mat_key]
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if mat_key != "grass" else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mmi)
		props[kind] = mmi
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_custom_data = true
	mm.mesh = prop_mesh(kind)
	mm.instance_count = xforms.size()
	for k in xforms.size():
		mm.set_instance_transform(k, xforms[k])
		mm.set_instance_custom_data(k, tints[k])
	mmi.multimesh = mm

func _build_props() -> void:
	var W: HexWorld = G.W
	var L := {"pine": [[], []], "broadleaf": [[], []], "bush": [[], []], "rock": [[], []], "grass": [[], []], "flower": [[], []], "boulder": [[], []]}
	var flower_cols := [Color(1.0, 1.0, 1.0), Color(1.0, 0.85, 0.2), Color(1.0, 0.45, 0.6), Color(0.7, 0.45, 1.0), Color(1.0, 0.35, 0.25)]
	for i in W.count:
		var t: int = W.type[i]
		if not HexWorld.is_land(t):
			continue
		var occupied: bool = W.bld[i] != 0 or W.road[i] != 0 or W.ruin[i] != 0
		var cx: float = W.x[i]
		var cz: float = W.z[i]
		var h: float = W.h[i]
		var add := func(kind: String, k: int, rmin: float, rmax: float, smin: float, smax: float, tint: Color) -> void:
			var a := HexWorld.hash2(i, 300 + k) * TAU
			var r := rmin + HexWorld.hash2(i, 400 + k) * (rmax - rmin)
			var s := smin + HexWorld.hash2(i, 500 + k) * (smax - smin)
			var p := Vector3(cx + cos(a) * r, h - 0.01, cz + sin(a) * r)
			var b := Basis(Vector3.UP, HexWorld.hash2(i, 600 + k) * TAU).scaled(Vector3(s, s * (0.9 + HexWorld.hash2(i, 650 + k) * 0.25), s))
			L[kind][0].append(Transform3D(b, p))
			var v := 0.9 + HexWorld.hash2(i, 700 + k) * 0.2
			L[kind][1].append(Color(tint.r * v, tint.g * v, tint.b * v, HexWorld.hash2(i, 800 + k)))
		if t == Defs.FOREST and not occupied:
			var n := 4 + int(HexWorld.hash2(i, 11) * 3.5)
			for k in n:
				var pine := HexWorld.hash2(i, 900 + k) < 0.72
				add.call("pine" if pine else "broadleaf", k, 0.1 if k > 0 else 0.0, 0.72, 0.62, 0.98, Color(1, 1, 1))
			add.call("bush", 20, 0.4, 0.75, 0.7, 1.1, Color(1, 1, 1))
			add.call("grass", 21, 0.3, 0.8, 0.8, 1.2, Color(0.8, 0.85, 0.8))
		elif t == Defs.GRASS:
			if not occupied:
				if HexWorld.hash2(i, 12) < 0.22:
					add.call("broadleaf", 30, 0.2, 0.6, 0.62, 0.9, Color(1, 1, 1))
				if HexWorld.hash2(i, 13) < 0.25:
					add.call("bush", 31, 0.3, 0.75, 0.7, 1.2, Color(1, 1, 1))
				if HexWorld.hash2(i, 14) < 0.35:
					var fc: Color = flower_cols[int(HexWorld.hash2(i, 15) * 5) % 5]
					for k in 4 + int(HexWorld.hash2(i, 16) * 5):
						add.call("flower", 40 + k, 0.1, 0.75, 0.8, 1.2, fc)
				if HexWorld.hash2(i, 17) < 0.12:
					add.call("rock", 32, 0.3, 0.75, 0.6, 1.0, Color(1, 1, 1))
			var ng := 2 + int(HexWorld.hash2(i, 18) * 4)
			for k in ng:
				add.call("grass", 50 + k, 0.55 if occupied else 0.1, 0.85, 0.8, 1.3, Color(1, 1, 1))
		elif t == Defs.HILLS:
			if not occupied:
				for k in 1 + int(HexWorld.hash2(i, 19) * 2.5):
					add.call("boulder", 60 + k, 0.2, 0.7, 0.6, 1.1, Color(1, 1, 1))
				if HexWorld.hash2(i, 20) < 0.3:
					add.call("pine", 70, 0.3, 0.7, 0.6, 0.85, Color(1, 1, 1))
			for k in 2:
				add.call("rock", 80 + k, 0.5, 0.85, 0.5, 0.9, Color(1, 1, 1))
			add.call("grass", 85, 0.4, 0.85, 0.8, 1.1, Color(0.9, 0.9, 0.75))
		elif t == Defs.SAND:
			if HexWorld.hash2(i, 21) < 0.25 and not occupied:
				add.call("rock", 90, 0.2, 0.75, 0.5, 0.9, Color(1.0, 0.95, 0.85))
			if HexWorld.hash2(i, 22) < 0.4:
				add.call("grass", 91, 0.4, 0.8, 0.7, 1.0, Color(1.0, 0.95, 0.65))
		elif t == Defs.MOUNTAIN:
			for k in 2:
				add.call("boulder", 95 + k, 0.65, 0.85, 0.5, 0.8, Color(0.95, 0.95, 0.95))
	for kind in L:
		var mk_key := "tree" if kind in ["pine", "broadleaf", "bush"] else ("grass" if kind in ["grass", "flower"] else "rock")
		_mm(kind, mk_key, L[kind][0], L[kind][1])

# ------------------------------------------------------------------ lighthouse
func _build_lighthouse() -> void:
	if lighthouse:
		lighthouse.queue_free()
		lighthouse = null
		beam = null
	var W: HexWorld = G.W
	if W.islet < 0:
		return
	lighthouse = Node3D.new()
	lighthouse.position = Vector3(W.x[W.islet], W.h[W.islet], W.z[W.islet])
	add_child(lighthouse)
	var mk := MK.new()
	mk.sphere(Vector3(0.35, 0.0, 0.2), 0.35, Color(0.52, 0.5, 0.48), 7, 4, Vector3(1.2, 0.6, 1.0))
	mk.sphere(Vector3(-0.4, 0.0, -0.1), 0.3, Color(0.48, 0.47, 0.45), 6, 3, Vector3(1.2, 0.5, 1.0))
	mk.cyl(Vector3(0, 0, 0), 0.3, 0.32, 0.12, 10, Color(0.6, 0.58, 0.55))
	for s in 5:
		mk.cyl(Vector3(0, 0.12 + s * 0.3, 0), 0.25 - s * 0.022, 0.25 - (s + 1) * 0.022, 0.3, 10, Color(0.96, 0.96, 0.94) if s % 2 == 0 else Color(0.85, 0.2, 0.18))
	mk.cyl(Vector3(0, 1.62, 0), 0.2, 0.2, 0.04, 10, Color(0.2, 0.2, 0.22))
	mk.glow = true
	mk.cyl(Vector3(0, 1.66, 0), 0.12, 0.12, 0.2, 8, Color(1.0, 0.92, 0.6))
	mk.glow = false
	for k in 6:
		var a := TAU * k / 6.0
		mk.rod(Vector3(cos(a) * 0.13, 1.66, sin(a) * 0.13), Vector3(cos(a) * 0.13, 1.86, sin(a) * 0.13), 0.012, Color(0.2, 0.2, 0.22), 4)
	mk.cone(Vector3(0, 1.86, 0), 0.18, 0.22, 10, Color(0.85, 0.2, 0.18))
	mk.box(Vector3(0.0, 0.25, 0.25), Vector3(0.1, 0.18, 0.03), Color(0.3, 0.2, 0.15))
	var mi := MeshInstance3D.new()
	mi.mesh = Models.commit(mk)
	lighthouse.add_child(mi)
	beam = Node3D.new()
	beam.position = Vector3(0, 1.76, 0)
	lighthouse.add_child(beam)
	var cone := CylinderMesh.new()
	cone.top_radius = 0.06
	cone.bottom_radius = 0.9
	cone.height = 7.0
	cone.radial_segments = 12
	cone.cap_top = false
	cone.cap_bottom = false
	var bm := StandardMaterial3D.new()
	bm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	bm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	bm.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	bm.cull_mode = BaseMaterial3D.CULL_DISABLED
	bm.albedo_color = Color(1.0, 0.9, 0.6, 0.09)
	bm.no_depth_test = false
	var bmi := MeshInstance3D.new()
	bmi.mesh = cone
	bmi.material_override = bm
	bmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	bmi.rotation = Vector3(PI / 2, 0, 0)
	bmi.position = Vector3(0, 0, 3.5)
	beam.add_child(bmi)
	var light := OmniLight3D.new()
	light.light_color = Color(1.0, 0.85, 0.55)
	light.light_energy = 1.2
	light.omni_range = 3.0
	light.position = Vector3(0, 1.75, 0)
	lighthouse.add_child(light)
