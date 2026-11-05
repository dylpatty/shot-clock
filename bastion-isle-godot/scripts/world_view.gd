class_name WorldView
extends Node3D
## Keeps 3D nodes in step with the simulation: buildings (with turrets, spinning parts, scaffolding,
## chimney smoke), ruins, units, projectiles, beams, health bars, the placement ghost, selection and range
## rings, raid direction markers, and ambient life (townsfolk walking the roads, gulls overhead).

var fx: FX
var bnodes := {}
var unodes := {}
var ruin_nodes := {}
var beams: Array = []
var bars: MultiMeshInstance3D
var proj_solid: MultiMeshInstance3D
var proj_glow: MultiMeshInstance3D
var walkers_mm: MultiMeshInstance3D
var birds_mm: MultiMeshInstance3D
var ghost: Node3D
var ghost_mat: ShaderMaterial
var ghost_key := ""
var hover_ring: MeshInstance3D
var sel_ring: MeshInstance3D
var range_ring: MeshInstance3D
var markers: Array = []
var warn_mat: StandardMaterial3D
var t_anim := 0.0
var walkers: Array = []
var birds: Array = []
var _ruins_dirty := true

const BAR_CAP := 400
const PROJ_CAP := 600
const GLOW_CAP := 900

func _ready() -> void:
	G.building_added.connect(_add_b)
	G.building_removed.connect(_rm_b)
	G.building_changed.connect(_chg_b)
	G.unit_added.connect(_add_u)
	G.unit_removed.connect(_rm_u)
	G.beam.connect(func(a, b, c, w): beams.append({"a": a, "b": b, "c": c, "w": w, "t": 0.16}))
	G.world_changed.connect(func(): _ruins_dirty = true)
	bars = _mk_mm(QuadMesh.new(), "res://shaders/bar.gdshader", BAR_CAP)
	var sph := SphereMesh.new()
	sph.radius = 0.5
	sph.height = 1.0
	sph.radial_segments = 8
	sph.rings = 4
	proj_solid = _mk_mm(sph, "res://shaders/solid_inst.gdshader", PROJ_CAP)
	var bx := BoxMesh.new()
	bx.size = Vector3.ONE
	proj_glow = _mk_mm(bx, "res://shaders/glowline.gdshader", GLOW_CAP)
	ghost_mat = ShaderMaterial.new()
	ghost_mat.shader = load("res://shaders/ghost.gdshader")
	ghost = Node3D.new()
	add_child(ghost)
	hover_ring = _ring_node(_hex_outline(0.97, 0.05), Color(1, 1, 1, 0.55))
	sel_ring = _ring_node(_hex_outline(1.0, 0.07), Color(1.0, 0.85, 0.3, 0.9))
	range_ring = _ring_node(null, Color(1.0, 1.0, 1.0, 0.45))
	warn_mat = StandardMaterial3D.new()
	warn_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	warn_mat.albedo_color = Color(1.0, 0.25, 0.2)
	warn_mat.emission_enabled = true
	warn_mat.emission = Color(1.0, 0.2, 0.1)
	walkers_mm = _mk_prop_mm(_person_mesh(), 64)
	birds_mm = _mk_prop_mm(_bird_mesh(), 16)

func _mk_mm(mesh: Mesh, shader: String, cap: int) -> MultiMeshInstance3D:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_custom_data = true
	mm.mesh = mesh
	mm.instance_count = cap
	mm.visible_instance_count = 0
	var mi := MultiMeshInstance3D.new()
	mi.multimesh = mm
	var m := ShaderMaterial.new()
	m.shader = load(shader)
	mi.material_override = m
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.custom_aabb = AABB(Vector3(-200, -20, -200), Vector3(400, 120, 400))
	add_child(mi)
	return mi

func _mk_prop_mm(mesh: Mesh, cap: int) -> MultiMeshInstance3D:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_custom_data = true
	mm.mesh = mesh
	mm.instance_count = cap
	mm.visible_instance_count = 0
	var mi := MultiMeshInstance3D.new()
	mi.multimesh = mm
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/prop.gdshader")
	m.set_shader_parameter("sway", 0.0)
	mi.material_override = m
	mi.custom_aabb = AABB(Vector3(-200, -20, -200), Vector3(400, 120, 400))
	add_child(mi)
	return mi

func _ring_node(mesh: Mesh, col: Color) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/overlay.gdshader")
	m.set_shader_parameter("col", col)
	mi.material_override = m
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.visible = false
	add_child(mi)
	return mi

static func _hex_outline(r: float, w: float) -> ArrayMesh:
	var mk := MK.new()
	mk.ao = false
	for k in 6:
		var a := TerrainView.corner(k, r)
		var b := TerrainView.corner(k + 1, r)
		var mid := (a + b) * 0.5
		mk.boxr(mid, Vector3(w, 0.03, (b - a).length() + w), atan2(b.x - a.x, b.z - a.z), Color.WHITE)
	return Models.commit(mk)

static func _circle(r: float, w: float) -> ArrayMesh:
	var mk := MK.new()
	mk.ao = false
	var seg := 64
	for k in seg:
		var a0 := TAU * k / seg
		var a1 := TAU * (k + 1) / seg
		var p0 := Vector3(cos(a0), 0, sin(a0))
		var p1 := Vector3(cos(a1), 0, sin(a1))
		mk.quad(p0 * (r - w), p1 * (r - w), p1 * (r + w), p0 * (r + w), Color.WHITE, Vector3(0, -1, 0))
	return Models.commit(mk)

static func _person_mesh() -> ArrayMesh:
	var mk := MK.new()
	mk.ao = false
	mk.box(Vector3(0, 0.035, 0), Vector3(0.045, 0.07, 0.035), Color(0.3, 0.25, 0.2))
	mk.box(Vector3(0, 0.1, 0), Vector3(0.06, 0.07, 0.045), Color(1, 1, 1))
	mk.sphere(Vector3(0, 0.16, 0), 0.03, Color(0.97, 0.8, 0.65), 6, 4)
	return Models.commit(mk)

static func _bird_mesh() -> ArrayMesh:
	var mk := MK.new()
	mk.ao = false
	mk.sphere(Vector3(0, 0, 0), 0.05, Color(0.97, 0.97, 0.97), 6, 3, Vector3(0.7, 0.6, 1.8))
	for s in [-1.0, 1.0]:
		mk.push_basis(Vector3(s * 0.12, 0.03, 0), Basis(Vector3(0, 0, 1), s * 0.35))
		mk.box(Vector3.ZERO, Vector3(0.24, 0.01, 0.08), Color(0.95, 0.95, 0.95))
		mk.box(Vector3(s * 0.1, 0, -0.01), Vector3(0.06, 0.012, 0.06), Color(0.3, 0.3, 0.32))
		mk.pop()
	mk.cone(Vector3(0, 0, 0.08), 0.012, 0.03, 4, Color(1.0, 0.7, 0.2))
	return Models.commit(mk)

# ------------------------------------------------------------------ buildings
func _wall_mask(b: Bld) -> int:
	var W: HexWorld = G.W
	var m := 0
	for d in 6:
		var j := W.nbr[b.tile * 6 + d]
		if j >= 0 and W.bld[j] != 0:
			var o: Bld = G.by_id.get(W.bld[j])
			if o != null and o.type == "wall":
				m |= 1 << d
	return m

func _add_b(b: Bld) -> void:
	var root := Node3D.new()
	add_child(root)
	bnodes[b] = {"root": root, "key": ""}
	_rebuild_b(b)

func _chg_b(b: Bld) -> void:
	if bnodes.has(b):
		_rebuild_b(b)

func _rm_b(b: Bld) -> void:
	if bnodes.has(b):
		var e: Dictionary = bnodes[b]
		e.root.queue_free()
		bnodes.erase(b)
	_ruins_dirty = true

func _rebuild_b(b: Bld) -> void:
	var e: Dictionary = bnodes[b]
	var root: Node3D = e.root
	var mask := _wall_mask(b) if b.type == "wall" else 0
	var key := "%d_%d_%s" % [b.level, mask, str(b.build_left > 0.0)]
	if key == e.key:
		return
	e.key = key
	for c in root.get_children():
		c.queue_free()
	root.position = b.pos
	root.rotation = Vector3(0, 0 if b.type == "wall" else b.yaw(), 0)
	var model: Dictionary = Models.building(b.type, b.level, mask)
	e.model = model
	var base := MeshInstance3D.new()
	base.mesh = model.base
	root.add_child(base)
	e.base = base
	e.head = null
	e.spin = null
	if model.head != null:
		var hd := MeshInstance3D.new()
		hd.mesh = model.head
		hd.position = Vector3(0, model.head_y, 0)
		base.add_child(hd)
		e.head = hd
	if model.spin != null:
		var sp := MeshInstance3D.new()
		sp.mesh = model.spin
		sp.position = model.spin_pos
		base.add_child(sp)
		e.spin = sp
	e.scaffold = null
	if b.build_left > 0.0:
		var sc := MeshInstance3D.new()
		sc.mesh = Models.scaffold()
		var s := 1.0 if b.type != "hq" else 1.3
		sc.scale = Vector3(s, s * (1.6 if b.type == "hq" else 1.0), s)
		root.add_child(sc)
		e.scaffold = sc
	e.warn = null
	e.smoke_t = randf()

func _ensure_warn(e: Dictionary, on: bool) -> void:
	if on and e.get("warn") == null:
		var mi := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.09
		sm.height = 0.18
		mi.mesh = sm
		mi.material_override = warn_mat
		mi.position = Vector3(0, 1.4, 0)
		e.root.add_child(mi)
		var bar := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(0.08, 0.26, 0.08)
		bar.mesh = bm
		bar.material_override = warn_mat
		bar.position = Vector3(0, 0.25, 0)
		mi.add_child(bar)
		e.warn = mi
	elif not on and e.get("warn") != null:
		e.warn.queue_free()
		e.warn = null

func _sync_ruins() -> void:
	_ruins_dirty = false
	var W: HexWorld = G.W
	for t in ruin_nodes.keys():
		if t >= W.count or W.ruin[t] == 0:
			ruin_nodes[t].queue_free()
			ruin_nodes.erase(t)
	for i in W.count:
		if W.ruin[i] != 0 and not ruin_nodes.has(i):
			var mi := MeshInstance3D.new()
			mi.mesh = Models.rubble(i % 3)
			mi.position = W.tpos(i)
			mi.rotation.y = HexWorld.hash2(i, 3) * TAU
			add_child(mi)
			ruin_nodes[i] = mi

func clear_all() -> void:
	for t in ruin_nodes:
		ruin_nodes[t].queue_free()
	ruin_nodes.clear()
	_ruins_dirty = true

# ------------------------------------------------------------------ units
func _add_u(u: Unit) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = UnitModels.get_mesh(u.type)
	add_child(mi)
	unodes[u] = mi
	_place_u(u, mi)

func _rm_u(u: Unit) -> void:
	if unodes.has(u):
		unodes[u].queue_free()
		unodes.erase(u)

func _place_u(u: Unit, mi: MeshInstance3D) -> void:
	var b := Basis(Vector3.UP, u.yaw) * Basis(Vector3.RIGHT, u.pitch) * Basis(Vector3(0, 0, 1), u.bank)
	var p := u.pos
	if u.domain == "ground":
		p.y += absf(sin(u.walk)) * 0.035
		if u.anim > 0.0:
			b = b * Basis(Vector3.RIGHT, sin(u.anim * PI) * 0.35)
	mi.transform = Transform3D(b, p)

# ------------------------------------------------------------------ per frame
func _process(dt: float) -> void:
	var sdt: float = 0.0 if G.frozen else dt * float(G.speed)
	t_anim += sdt
	if _ruins_dirty:
		_sync_ruins()
	for b in bnodes:
		var e: Dictionary = bnodes[b]
		if not e.has("base"):
			continue
		var base: MeshInstance3D = e.base
		var root: Node3D = e.root
		if e.head != null:
			e.head.rotation.y = b.head_yaw - root.rotation.y
		var working: bool = b.build_left <= 0.0
		if e.spin != null and working and b.connected:
			var m: Dictionary = e.model
			e.spin.basis = Basis(m.spin_axis, t_anim * m.spin_speed * 2.0)
		base.set_instance_shader_parameter("flash", b.flash)
		if not working:
			var k := clampf(1.0 - b.build_left / maxf(b.build_total, 0.01), 0.0, 1.0)
			base.scale = Vector3(1, 1, 1) if b.upgrading else Vector3(1, lerpf(0.12, 1.0, k), 1)
		elif base.scale.y != 1.0:
			base.scale = Vector3.ONE
		var need_road: bool = not b.connected and not b.def.get("noroad", false)
		_ensure_warn(e, need_road)
		if e.get("warn") != null:
			e.warn.position.y = 1.5 + sin(Time.get_ticks_msec() * 0.005) * 0.08
		# chimney smoke from working buildings
		var sm: Array = e.model.smoke
		if sm.size() and working and b.connected and sdt > 0.0:
			e.smoke_t -= sdt
			if e.smoke_t <= 0.0:
				e.smoke_t = 0.7 + randf() * 0.6
				var sp: Vector3 = sm[randi() % sm.size()]
				fx.emit("chimney", root.transform * sp, 1.0)
	for u in unodes:
		if u.anim > 0.0:
			u.anim = maxf(0.0, u.anim - sdt * 4.0)
		_place_u(u, unodes[u])
		unodes[u].set_instance_shader_parameter("flash", clampf(u.hit_t / 0.12, 0.0, 1.0))
	_update_bars()
	_update_projectiles(dt)
	_update_life(sdt)

func _update_bars() -> void:
	var mm := bars.multimesh
	var buf := PackedFloat32Array()
	buf.resize(BAR_CAP * 16)
	var n := 0
	for b in G.buildings:
		if n >= BAR_CAP:
			break
		if b.hp < b.max_hp - 0.5 and b.alive:
			var h: float = 1.5 if b.type != "hq" else 2.6 + b.level * 0.25
			if b.type == "wall":
				h = 0.8
			n = _bar(buf, n, b.pos + Vector3(0, h, 0), 0.8, 0.09, b.hp / b.max_hp, 1.0)
	for list in [G.enemies, G.allies]:
		for u in list:
			if n >= BAR_CAP:
				break
			if u.alive and u.hp < u.max_hp - 0.1:
				var inf := UnitModels.info(u.type)
				n = _bar(buf, n, u.pos + Vector3(0, inf.y, 0), clampf(inf.x * 0.9, 0.4, 1.4), 0.07, u.hp / u.max_hp, 1.0 if u.team == "A" else 0.0)
	mm.buffer = buf
	mm.visible_instance_count = n

func _bar(buf: PackedFloat32Array, n: int, p: Vector3, w: float, h: float, f: float, kind: float) -> int:
	var o := n * 16
	buf[o] = w; buf[o + 3] = p.x
	buf[o + 5] = h; buf[o + 7] = p.y
	buf[o + 10] = 1.0; buf[o + 11] = p.z
	buf[o + 12] = f; buf[o + 13] = kind
	return n + 1

static func _put(buf: PackedFloat32Array, n: int, b: Basis, p: Vector3, c: Color) -> void:
	var o := n * 16
	buf[o] = b.x.x; buf[o + 1] = b.y.x; buf[o + 2] = b.z.x; buf[o + 3] = p.x
	buf[o + 4] = b.x.y; buf[o + 5] = b.y.y; buf[o + 6] = b.z.y; buf[o + 7] = p.y
	buf[o + 8] = b.x.z; buf[o + 9] = b.y.z; buf[o + 10] = b.z.z; buf[o + 11] = p.z
	buf[o + 12] = c.r; buf[o + 13] = c.g; buf[o + 14] = c.b; buf[o + 15] = c.a

static func _streak(dir: Vector3, length: float, width: float) -> Basis:
	var z := dir.normalized() if dir.length_squared() > 1e-8 else Vector3.FORWARD
	var x := z.cross(Vector3.UP if absf(z.y) < 0.95 else Vector3.RIGHT).normalized()
	var y := x.cross(z).normalized()
	return Basis(x * width, y * width, z * length)

func _update_projectiles(dt: float) -> void:
	var sb := PackedFloat32Array()
	sb.resize(PROJ_CAP * 16)
	var gb := PackedFloat32Array()
	gb.resize(GLOW_CAP * 16)
	var ns := 0
	var ng := 0
	for p in G.projectiles:
		var kind: String = p.kind
		if kind == "tracer":
			if ng >= GLOW_CAP:
				continue
			var k: float = clampf(p.t / p.T, 0.0, 1.0)
			var s: Vector3 = p.s
			var e: Vector3 = p.e
			var d := e - s
			var head := s + d * minf(1.0, k + 0.35)
			var tail := s + d * k
			var col := Color(1.0, 0.85, 0.4, 1.0) if not p.enemy else Color(1.0, 0.45, 0.25, 1.0)
			if p.get("col", 0) == 1:
				col = Color(1.0, 0.95, 0.8, 0.7)
			_put(gb, ng, _streak(head - tail, (head - tail).length(), 0.025), (head + tail) * 0.5, col)
			ng += 1
		elif ns < PROJ_CAP:
			var pos: Vector3 = p.p
			var vel: Vector3 = p.get("vel", Vector3.ZERO)
			match kind:
				"shell":
					_put(sb, ns, Basis.from_scale(Vector3.ONE * 0.09), pos, Color(0.15, 0.15, 0.16))
				"stone":
					_put(sb, ns, Basis.from_scale(Vector3.ONE * 0.14), pos, Color(0.55, 0.53, 0.5))
				"arrow":
					_put(sb, ns, _streak(vel, 0.28, 0.02), pos, Color(0.4, 0.28, 0.15))
				"bolt":
					_put(sb, ns, _streak(vel, 0.45, 0.035), pos, Color(0.35, 0.25, 0.15))
				"bomb":
					_put(sb, ns, _streak(vel + Vector3(0, -0.01, 0), 0.22, 0.09), pos, Color(0.22, 0.25, 0.2))
				"nuke":
					_put(sb, ns, _streak(vel + Vector3(0, -0.01, 0), 0.5, 0.2), pos, Color(0.9, 0.8, 0.2))
				"rocket", "missile":
					_put(sb, ns, _streak(vel, 0.3, 0.05), pos, Color(0.92, 0.92, 0.9))
					if ng < GLOW_CAP:
						_put(gb, ng, _streak(vel, 0.25, 0.07), pos - vel.normalized() * 0.25, Color(1.0, 0.6, 0.2, 1.0))
						ng += 1
				"flak":
					_put(sb, ns, Basis.from_scale(Vector3.ONE * 0.05), pos, Color(0.2, 0.2, 0.2))
			ns += 1
	var i := beams.size() - 1
	while i >= 0:
		var bm: Dictionary = beams[i]
		bm.t -= 0.0 if G.frozen else dt * float(G.speed)
		if bm.t <= 0.0:
			beams.remove_at(i)
		elif ng < GLOW_CAP:
			var a: Vector3 = bm.a
			var b: Vector3 = bm.b
			var c: Color = bm.c
			c.a = clampf(bm.t / 0.16, 0.0, 1.0)
			_put(gb, ng, _streak(b - a, (b - a).length(), bm.w), (a + b) * 0.5, c)
			ng += 1
		i -= 1
	proj_solid.multimesh.buffer = sb
	proj_solid.multimesh.visible_instance_count = ns
	proj_glow.multimesh.buffer = gb
	proj_glow.multimesh.visible_instance_count = ng

# ------------------------------------------------------------------ ambient life
func _update_life(sdt: float) -> void:
	var W: HexWorld = G.W
	if W.count == 0:
		return
	# townsfolk on connected roads
	var want := clampi(G.pop / 5, 0, 60)
	var roads: Array = []
	if walkers.size() < want:
		for i in W.count:
			if W.conn[i] != 0:
				roads.append(i)
	while walkers.size() < want and roads.size() > 1:
		var t: int = roads[randi() % roads.size()]
		walkers.append({"a": t, "b": t, "k": 1.0, "spd": randf_range(0.35, 0.6), "off": randf_range(-0.12, 0.12),
			"col": [Color(0.85, 0.3, 0.3), Color(0.3, 0.45, 0.85), Color(0.9, 0.8, 0.3), Color(0.4, 0.7, 0.4), Color(0.9, 0.9, 0.9), Color(0.6, 0.4, 0.7)][randi() % 6]})
	while walkers.size() > want:
		walkers.pop_back()
	var buf := PackedFloat32Array()
	buf.resize(64 * 16)
	var n := 0
	for wk in walkers:
		wk.k += sdt * wk.spd
		if wk.k >= 1.0:
			wk.k = 0.0
			wk.a = wk.b
			var opts: Array = []
			for d in 6:
				var j := W.nbr[int(wk.a) * 6 + d]
				if j >= 0 and W.road[j] != 0 and j != wk.get("prev", -1):
					opts.append(j)
			wk.prev = wk.a
			wk.b = opts[randi() % opts.size()] if opts.size() else wk.a
		if W.road[int(wk.a)] == 0:
			wk.k = 1.0
			continue
		var pa := W.tpos(int(wk.a))
		var pb := W.tpos(int(wk.b))
		var p := pa.lerp(pb, wk.k)
		var d2 := pb - pa
		var yaw := atan2(d2.x, d2.z) if d2.length_squared() > 0.001 else 0.0
		var side := Vector3(cos(yaw), 0, -sin(yaw)) * float(wk.off)
		p += side + Vector3(0, 0.03 + absf(sin(t_anim * 9.0 + float(wk.off) * 50.0)) * 0.015, 0)
		if n < 64:
			var c: Color = wk.col
			c.a = 0.0
			_put(buf, n, Basis(Vector3.UP, yaw).scaled(Vector3(1.4, 1.4, 1.4)), p, c)
			n += 1
	walkers_mm.multimesh.buffer = buf
	walkers_mm.multimesh.visible_instance_count = n
	# gulls
	if birds.is_empty():
		for k in 10:
			birds.append({"c": Vector3(randf_range(-14, 14), randf_range(4.0, 7.0), randf_range(-14, 14)), "r": randf_range(4.0, 10.0), "a": randf() * TAU, "w": randf_range(0.25, 0.45) * (1 if randf() < 0.5 else -1), "f": randf() * 10.0})
	var bb := PackedFloat32Array()
	bb.resize(16 * 16)
	var nb := 0
	for bd in birds:
		bd.a += sdt * bd.w + (0.0 if sdt > 0.0 else 0.0)
		bd.f += maxf(sdt, 0.0) * 9.0
		var p2: Vector3 = bd.c + Vector3(cos(bd.a) * bd.r, sin(bd.a * 2.0) * 0.4, sin(bd.a) * bd.r)
		var tang := Vector3(-sin(bd.a), 0, cos(bd.a)) * signf(bd.w)
		var yaw2 := atan2(tang.x, tang.z)
		var flap := 0.55 + 0.45 * sin(bd.f)
		var bs := Basis(Vector3.UP, yaw2) * Basis(Vector3(0, 0, 1), -0.3 * signf(bd.w))
		bs = bs.scaled(Vector3(1.6, 1.6 * flap + 0.3, 1.6))
		_put(bb, nb, bs, p2, Color(1, 1, 1, 0.0))
		nb += 1
	birds_mm.multimesh.buffer = bb
	birds_mm.multimesh.visible_instance_count = nb

# ------------------------------------------------------------------ ghost, rings and markers
func set_ghost(type: String, tile: int, rot: int, ok: bool) -> void:
	if type == "" or tile < 0:
		ghost.visible = false
		range_ring.visible = false
		return
	var W: HexWorld = G.W
	var key := type
	if key != ghost_key:
		ghost_key = key
		for c in ghost.get_children():
			c.queue_free()
		var model := Models.building(type, 1, 0)
		var mi := MeshInstance3D.new()
		mi.mesh = model.base
		mi.material_override = ghost_mat
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		ghost.add_child(mi)
		if model.head != null:
			var hd := MeshInstance3D.new()
			hd.mesh = model.head
			hd.position = Vector3(0, model.head_y, 0)
			hd.material_override = ghost_mat
			mi.add_child(hd)
	ghost.visible = true
	ghost.position = W.tpos(tile)
	ghost.rotation.y = 0.0 if type == "wall" else PI / 6.0 + rot * PI / 3.0
	ghost_mat.set_shader_parameter("col", Color(0.35, 1.0, 0.45, 0.55) if ok else Color(1.0, 0.3, 0.25, 0.55))
	var lv := Defs.level_def(type, 1)
	if lv.has("weapon"):
		show_range(W.tpos(tile), float(lv.weapon.range) * G.mod.range, Color(1, 1, 1, 0.45))
	elif type == "market":
		show_range(W.tpos(tile), float(Defs.BUILDINGS.market.radius), Color(1.0, 0.9, 0.4, 0.4))
	elif type == "barracks":
		show_range(W.tpos(tile), float(Defs.BUILDINGS.barracks.guard), Color(0.5, 0.7, 1.0, 0.35))
	else:
		range_ring.visible = false

var _range_r := -1.0
func show_range(p: Vector3, r: float, col: Color) -> void:
	if absf(r - _range_r) > 0.01:
		_range_r = r
		range_ring.mesh = _circle(r, 0.05)
	range_ring.visible = true
	range_ring.position = Vector3(p.x, p.y + 0.06, p.z)
	range_ring.material_override.set_shader_parameter("col", col)

func hide_range() -> void:
	range_ring.visible = false

func set_hover(tile: int) -> void:
	if tile < 0:
		hover_ring.visible = false
		return
	hover_ring.visible = true
	var p: Vector3 = G.W.tpos(tile)
	if not HexWorld.is_land(G.W.type[tile]):
		p.y = 0.02
	hover_ring.position = p + Vector3(0, 0.03, 0)

func set_selected(tile: int) -> void:
	if tile < 0:
		sel_ring.visible = false
		return
	sel_ring.visible = true
	sel_ring.position = G.W.tpos(tile) + Vector3(0, 0.04, 0)

func set_markers(dirs: Array, show: bool) -> void:
	while markers.size() < dirs.size():
		var mk := MK.new()
		mk.ao = false
		mk.slab([Vector2(0, 1.4), Vector2(0.9, 0.2), Vector2(0.35, 0.2), Vector2(0.35, -1.0), Vector2(-0.35, -1.0), Vector2(-0.35, 0.2), Vector2(-0.9, 0.2)], 0.0, 0.05, Color.WHITE)
		var mi := _ring_node(Models.commit(mk), Color(1.0, 0.25, 0.2, 0.8))
		mi.material_override.set_shader_parameter("pulse", 1.0)
		markers.append(mi)
	for k in markers.size():
		var m: MeshInstance3D = markers[k]
		if not show or k >= dirs.size():
			m.visible = false
			continue
		var a: float = dirs[k]
		var r := G.W.R * 1.5 - 4.0
		m.visible = true
		m.position = Vector3(sin(a) * r, 0.15, cos(a) * r)
		m.rotation.y = a + PI
		m.scale = Vector3.ONE * 1.3
