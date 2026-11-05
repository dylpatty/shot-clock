class_name FX
extends Node3D
## CPU particles drawn with two MultiMeshes (one draw call each): soft alpha-blended smoke, dust and spray,
## and additive glows for fire, flashes and sparks. Driven by G.fx events.

class Pool:
	var pos := PackedVector3Array()
	var vel := PackedVector3Array()
	var life := PackedFloat32Array()
	var maxl := PackedFloat32Array()
	var s0 := PackedFloat32Array()
	var s1 := PackedFloat32Array()
	var c0 := PackedColorArray()
	var c1 := PackedColorArray()
	var drag := PackedFloat32Array()
	var grav := PackedFloat32Array()
	var n := 0
	var cap := 1600
	var mmi: MultiMeshInstance3D
	var buf := PackedFloat32Array()

	func setup(c: int, mat: Material, parent: Node3D) -> void:
		cap = c
		pos.resize(cap); vel.resize(cap)
		life.resize(cap); maxl.resize(cap); s0.resize(cap); s1.resize(cap)
		c0.resize(cap); c1.resize(cap); drag.resize(cap); grav.resize(cap)
		buf.resize(cap * 16)
		buf.fill(0.0)
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_custom_data = true
		var q := QuadMesh.new()
		q.size = Vector2(1, 1)
		mm.mesh = q
		mm.instance_count = cap
		mm.visible_instance_count = 0
		mmi = MultiMeshInstance3D.new()
		mmi.multimesh = mm
		mmi.material_override = mat
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mmi.custom_aabb = AABB(Vector3(-200, -20, -200), Vector3(400, 120, 400))
		parent.add_child(mmi)

	func add(p: Vector3, v: Vector3, l: float, a: float, b: float, ca: Color, cb: Color, dr: float = 1.0, gr: float = 0.0) -> void:
		if n >= cap:
			return
		pos[n] = p; vel[n] = v; life[n] = 0.0; maxl[n] = maxf(l, 0.01)
		s0[n] = a; s1[n] = b; c0[n] = ca; c1[n] = cb; drag[n] = dr; grav[n] = gr
		n += 1

	func update(dt: float) -> void:
		var i := 0
		while i < n:
			life[i] += dt
			if life[i] >= maxl[i]:
				n -= 1
				pos[i] = pos[n]; vel[i] = vel[n]; life[i] = life[n]; maxl[i] = maxl[n]
				s0[i] = s0[n]; s1[i] = s1[n]; c0[i] = c0[n]; c1[i] = c1[n]; drag[i] = drag[n]; grav[i] = grav[n]
				continue
			var v := vel[i]
			v.y -= grav[i] * dt
			v *= maxf(0.0, 1.0 - drag[i] * dt)
			vel[i] = v
			pos[i] += v * dt
			i += 1
		for k in n:
			var t := life[k] / maxl[k]
			var s := lerpf(s0[k], s1[k], sqrt(t))
			var c := c0[k].lerp(c1[k], t)
			var p := pos[k]
			var o := k * 16
			buf[o] = s; buf[o + 1] = 0.0; buf[o + 2] = 0.0; buf[o + 3] = p.x
			buf[o + 4] = 0.0; buf[o + 5] = s; buf[o + 6] = 0.0; buf[o + 7] = p.y
			buf[o + 8] = 0.0; buf[o + 9] = 0.0; buf[o + 10] = s; buf[o + 11] = p.z
			buf[o + 12] = c.r; buf[o + 13] = c.g; buf[o + 14] = c.b; buf[o + 15] = c.a * (1.0 - t * t)
		mmi.multimesh.buffer = buf
		mmi.multimesh.visible_instance_count = n

var smoke: Pool
var glow: Pool
var shake := 0.0
var enabled := true

func _ready() -> void:
	var sm := ShaderMaterial.new()
	sm.shader = load("res://shaders/particle.gdshader")
	var gm := ShaderMaterial.new()
	gm.shader = load("res://shaders/additive.gdshader")
	smoke = Pool.new()
	smoke.setup(1800, sm, self)
	glow = Pool.new()
	glow.setup(1400, gm, self)
	G.fx.connect(emit)

func _process(dt: float) -> void:
	var sdt: float = dt * (0.0 if G.frozen else float(G.speed))
	if sdt > 0.0:
		smoke.update(sdt)
		glow.update(sdt)
	shake = maxf(0.0, shake - dt * 1.5)

static func rv(s: float) -> Vector3:
	return Vector3(randf_range(-s, s), randf_range(-s, s), randf_range(-s, s))

func emit(kind: String, p: Vector3, size: float = 1.0) -> void:
	if not enabled:
		return
	match kind:
		"explosion":
			glow.add(p, Vector3.ZERO, 0.18, 0.6 * size, 1.6 * size, Color(1.0, 0.85, 0.5), Color(1.0, 0.4, 0.1))
			for k in 6:
				glow.add(p + rv(0.15 * size), rv(1.2) * size + Vector3(0, 1.0, 0), 0.45, 0.35 * size, 0.7 * size, Color(1.0, 0.6, 0.15), Color(0.8, 0.15, 0.05), 3.0)
			for k in 7:
				smoke.add(p + rv(0.2 * size), rv(0.6) * size + Vector3(0, 0.9, 0), 1.6 + randf() * 0.8, 0.4 * size, 1.3 * size, Color(0.35, 0.32, 0.3, 0.85), Color(0.55, 0.53, 0.5, 0.0), 1.5, -0.2)
			for k in 6:
				glow.add(p, rv(3.5) + Vector3(0, 2.5, 0), 0.5, 0.08, 0.04, Color(1.0, 0.8, 0.4), Color(1.0, 0.3, 0.1), 0.5, 6.0)
			for k in 4:
				smoke.add(p, rv(2.0) + Vector3(0, 2.5, 0), 0.8, 0.07, 0.07, Color(0.2, 0.18, 0.16, 1.0), Color(0.2, 0.18, 0.16, 1.0), 0.2, 7.0)
			if size > 1.0:
				shake = maxf(shake, 0.25 * size)
		"explosion_water":
			glow.add(p + Vector3(0, 0.2, 0), Vector3.ZERO, 0.15, 0.4 * size, 1.0 * size, Color(1.0, 0.8, 0.5), Color(1.0, 0.4, 0.1))
			for k in 12:
				var v := Vector3(randf_range(-1, 1), randf_range(3.0, 5.5), randf_range(-1, 1)) * (0.7 + size * 0.4)
				smoke.add(p, v, 0.9, 0.18 * size, 0.35 * size, Color(0.95, 0.98, 1.0, 0.95), Color(0.85, 0.92, 0.98, 0.0), 0.6, 7.0)
			for k in 5:
				smoke.add(p + rv(0.3 * size) * Vector3(1, 0, 1), Vector3(0, 0.3, 0), 1.5, 0.4 * size, 1.4 * size, Color(0.9, 0.95, 1.0, 0.7), Color(1, 1, 1, 0.0), 1.0)
			for k in 3:
				smoke.add(p + Vector3(0, 0.3, 0), rv(0.4) + Vector3(0, 0.8, 0), 1.6, 0.3 * size, 1.0 * size, Color(0.3, 0.3, 0.3, 0.6), Color(0.5, 0.5, 0.5, 0.0), 1.2)
		"splash_small":
			for k in 4:
				smoke.add(p, Vector3(randf_range(-0.4, 0.4), randf_range(1.5, 2.5), randf_range(-0.4, 0.4)), 0.5, 0.08, 0.14, Color(0.95, 0.98, 1.0, 0.9), Color(1, 1, 1, 0.0), 0.5, 7.0)
		"muzzle":
			if size > 0.0:
				glow.add(p, Vector3.ZERO, 0.07, 0.25 * size, 0.45 * size, Color(1.0, 0.85, 0.45), Color(1.0, 0.5, 0.1))
		"musket_smoke":
			for k in 2:
				smoke.add(p + rv(0.05), rv(0.15) + Vector3(0, 0.25, 0), 1.2 + randf() * 0.6, 0.12 * size, 0.45 * size, Color(0.92, 0.92, 0.9, 0.7), Color(0.95, 0.95, 0.95, 0.0), 1.2)
		"smoke":
			smoke.add(p + rv(0.1), rv(0.1) + Vector3(0.15, 0.6, 0.05), 2.4, 0.25 * size, 0.9 * size, Color(0.22, 0.2, 0.19, 0.75), Color(0.45, 0.43, 0.42, 0.0), 0.6)
		"smoke_dark":
			smoke.add(p, rv(0.2), 1.6, 0.25 * size, 0.7 * size, Color(0.15, 0.14, 0.14, 0.85), Color(0.35, 0.34, 0.33, 0.0), 1.0)
		"chimney":
			smoke.add(p, Vector3(0.12 + randf() * 0.08, 0.35, 0.05), 3.2, 0.07 * size, 0.38 * size, Color(0.88, 0.88, 0.88, 0.5), Color(0.95, 0.95, 0.95, 0.0), 0.3, -0.03)
		"fire":
			glow.add(p + rv(0.1 * size), rv(0.2) + Vector3(0, 0.9, 0), 0.5 + randf() * 0.3, 0.25 * size, 0.08 * size, Color(1.0, 0.6, 0.15), Color(0.9, 0.2, 0.05), 1.0)
		"dust":
			for k in 4:
				smoke.add(p + rv(0.1) * Vector3(1, 0, 1), rv(0.5) * Vector3(1, 0.2, 1) + Vector3(0, 0.3, 0), 0.9, 0.12 * size, 0.5 * size, Color(0.75, 0.66, 0.5, 0.7), Color(0.8, 0.72, 0.58, 0.0), 2.0)
		"flak":
			glow.add(p, Vector3.ZERO, 0.12, 0.3 * size, 0.7 * size, Color(1.0, 0.8, 0.4), Color(1.0, 0.4, 0.1))
			for k in 3:
				smoke.add(p + rv(0.2), rv(0.2), 1.8, 0.3 * size, 0.8 * size, Color(0.15, 0.14, 0.14, 0.9), Color(0.3, 0.3, 0.3, 0.0), 0.8)
		"trail":
			smoke.add(p, rv(0.05), 0.9, 0.06 * size, 0.25 * size, Color(0.9, 0.9, 0.9, 0.6), Color(0.95, 0.95, 0.95, 0.0), 0.5)
			glow.add(p, Vector3.ZERO, 0.06, 0.12 * size, 0.04, Color(1.0, 0.7, 0.3), Color(1.0, 0.4, 0.1))
		"wake":
			smoke.add(p + rv(0.1) * Vector3(1, 0, 1), Vector3(0, 0.02, 0), 1.6, 0.18 * size, 0.6 * size, Color(0.95, 0.98, 1.0, 0.55), Color(1, 1, 1, 0.0), 1.0)
		"spark":
			for k in 5:
				glow.add(p, rv(2.0), 0.25, 0.08, 0.02, Color(0.6, 1.0, 1.0), Color(0.3, 0.6, 1.0), 2.0)
		"build":
			for k in 10:
				var a := TAU * k / 10.0
				smoke.add(p + Vector3(cos(a) * 0.5, 0.05, sin(a) * 0.5), Vector3(cos(a), 0.3, sin(a)) * 0.6, 0.9, 0.15, 0.45, Color(0.85, 0.78, 0.62, 0.7), Color(0.9, 0.85, 0.7, 0.0), 2.0)
			for k in 6:
				glow.add(p + Vector3(randf_range(-0.4, 0.4), randf_range(0.3, 1.0), randf_range(-0.4, 0.4)), Vector3(0, 0.5, 0), 0.6, 0.1, 0.02, Color(1.0, 0.95, 0.6), Color(1.0, 0.8, 0.3), 1.0)
		"nuke":
			var s := size
			glow.add(p + Vector3(0, 1.0, 0), Vector3.ZERO, 0.5, 2.0 * s, 6.0 * s, Color(1.0, 1.0, 0.9), Color(1.0, 0.6, 0.2))
			for k in 30:
				glow.add(p + rv(0.6 * s) + Vector3(0, 0.5, 0), rv(1.5) + Vector3(0, 2.0, 0), 1.2 + randf(), 0.8 * s * 0.5, 1.5 * s * 0.5, Color(1.0, 0.65, 0.2), Color(0.8, 0.15, 0.05), 1.0)
			for k in 60:
				var a2 := randf() * TAU
				var rr := randf() * 0.4 * s
				smoke.add(p + Vector3(cos(a2) * rr, randf() * 0.5, sin(a2) * rr), Vector3(cos(a2) * 0.3, 2.2 + randf() * 2.0, sin(a2) * 0.3), 4.0 + randf() * 2.0, 0.6 * s * 0.4, 1.6 * s * 0.5, Color(0.4, 0.3, 0.25, 0.9), Color(0.6, 0.55, 0.5, 0.0), 0.5, -0.1)
			for k in 40:
				var a3 := TAU * k / 40.0
				smoke.add(p + Vector3(0, 0.2, 0), Vector3(cos(a3), 0.05, sin(a3)) * 5.0, 2.5, 0.5, 1.5, Color(0.75, 0.7, 0.62, 0.8), Color(0.8, 0.78, 0.72, 0.0), 1.2)
			shake = 1.6
