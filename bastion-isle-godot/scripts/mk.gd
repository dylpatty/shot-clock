class_name MK
extends RefCounted
## Mesh kit: builds flat-shaded, vertex-coloured low-poly meshes from primitives under a transform stack.
## Two surfaces: the main one (lit) and a glow one (emissive windows, lasers, lamps).
## Faces are oriented outward automatically from an "inside" reference point, so primitives can be
## authored without worrying about winding. Godot front faces are clockwise: n = (C - A) x (B - A).

var v := PackedVector3Array()
var n := PackedVector3Array()
var c := PackedColorArray()
var gv := PackedVector3Array()
var gn := PackedVector3Array()
var gc := PackedColorArray()
var xf := Transform3D.IDENTITY
var _stack: Array = []
var glow := false
var ao := true
var ao_h := 0.4

func push(t: Transform3D) -> void:
	_stack.append(xf)
	xf = xf * t

func push_at(p: Vector3, yaw: float = 0.0, s: float = 1.0) -> void:
	push(Transform3D(Basis(Vector3.UP, yaw).scaled(Vector3(s, s, s)), p))

func push_basis(p: Vector3, b: Basis) -> void:
	push(Transform3D(b, p))

func pop() -> void:
	xf = _stack.pop_back()

func _col(p: Vector3, col: Color) -> Color:
	if not ao or glow:
		return col
	var k := clampf(p.y / ao_h, 0.0, 1.0)
	var f := 0.72 + 0.28 * k
	return Color(col.r * f, col.g * f, col.b * f, col.a)

func tri_w(A: Vector3, B: Vector3, C: Vector3, col: Color, ref = null) -> void:
	## world-space (model-space) triangle
	var nn := (C - A).cross(B - A)
	if nn.length_squared() < 1e-14:
		return
	nn = nn.normalized()
	if ref != null and nn.dot((A + B + C) / 3.0 - ref) < 0.0:
		var t := B
		B = C
		C = t
		nn = -nn
	if glow:
		gv.append(A); gv.append(B); gv.append(C)
		gn.append(nn); gn.append(nn); gn.append(nn)
		gc.append(col); gc.append(col); gc.append(col)
	else:
		v.append(A); v.append(B); v.append(C)
		n.append(nn); n.append(nn); n.append(nn)
		c.append(_col(A, col)); c.append(_col(B, col)); c.append(_col(C, col))

func tri(a: Vector3, b: Vector3, cc: Vector3, col: Color, inside = null) -> void:
	tri_w(xf * a, xf * b, xf * cc, col, (xf * inside) if inside != null else null)

func quad(a: Vector3, b: Vector3, cc: Vector3, d: Vector3, col: Color, inside = null) -> void:
	tri(a, b, cc, col, inside)
	tri(a, cc, d, col, inside)

## Axis-aligned box (in the current transform). top: optional different colour for the top face.
func box(center: Vector3, size: Vector3, col: Color, top = null) -> void:
	var h := size * 0.5
	var p := []
	for i in 8:
		p.append(center + Vector3(h.x * (1 if i & 1 else -1), h.y * (1 if i & 2 else -1), h.z * (1 if i & 4 else -1)))
	var tc: Color = top if top != null else col
	quad(p[0], p[1], p[3], p[2], col, center)   # -z
	quad(p[4], p[5], p[7], p[6], col, center)   # +z
	quad(p[0], p[2], p[6], p[4], col, center)   # -x
	quad(p[1], p[3], p[7], p[5], col, center)   # +x
	quad(p[2], p[3], p[7], p[6], tc, center)    # top
	quad(p[0], p[1], p[5], p[4], col, center)   # bottom

## Box rotated about y around its centre
func boxr(center: Vector3, size: Vector3, yaw: float, col: Color, top = null) -> void:
	push_at(center, yaw)
	box(Vector3.ZERO, size, col, top)
	pop()

## Tapered prism / cylinder / cone. base = centre of the bottom. seg sides, rot = start angle.
func cyl(base: Vector3, rb: float, rt: float, h: float, seg: int, col: Color, top = null, caps: bool = true, rot: float = 0.0) -> void:
	var inside := base + Vector3(0, h * 0.5, 0)
	var tc: Color = top if top != null else col
	for i in seg:
		var a0 := rot + TAU * i / seg
		var a1 := rot + TAU * (i + 1) / seg
		var b0 := base + Vector3(cos(a0) * rb, 0, sin(a0) * rb)
		var b1 := base + Vector3(cos(a1) * rb, 0, sin(a1) * rb)
		var t0 := base + Vector3(cos(a0) * rt, h, sin(a0) * rt)
		var t1 := base + Vector3(cos(a1) * rt, h, sin(a1) * rt)
		if rt > 0.0001:
			quad(b0, b1, t1, t0, col, inside)
			if caps:
				tri(base + Vector3(0, h, 0), t0, t1, tc, inside)
		else:
			tri(b0, b1, t0, col, inside)
		if caps and rb > 0.0001:
			tri(base, b0, b1, col, inside)

func cone(base: Vector3, r: float, h: float, seg: int, col: Color, rot: float = 0.0) -> void:
	cyl(base, r, 0.0, h, seg, col, null, true, rot)

## Hex prism with corners pointing along +-z (matches the tiles)
func hexp(base: Vector3, r: float, h: float, col: Color, top = null, rt: float = -1.0) -> void:
	cyl(base, r, r if rt < 0.0 else rt, h, 6, col, top, true, PI / 6.0)

## Cylinder between two points (barrels, masts, oars, poles)
func rod(a: Vector3, b: Vector3, r: float, col: Color, seg: int = 6, r2: float = -1.0) -> void:
	var d := b - a
	var l := d.length()
	if l < 0.0001:
		return
	var y := d / l
	var x := y.cross(Vector3.FORWARD if absf(y.z) < 0.9 else Vector3.RIGHT).normalized()
	var z := x.cross(y).normalized()
	push(Transform3D(Basis(x, y, z), a))
	cyl(Vector3.ZERO, r, r if r2 < 0.0 else r2, l, seg, col)
	pop()

## Low-poly ellipsoid
func sphere(center: Vector3, r: float, col: Color, seg: int = 8, rings: int = 5, scale: Vector3 = Vector3.ONE, top = null) -> void:
	var pts := []
	for j in rings + 1:
		var phi := PI * j / rings
		var row := []
		for i in seg:
			var th := TAU * i / seg
			row.append(center + Vector3(sin(phi) * cos(th) * r * scale.x, cos(phi) * r * scale.y, sin(phi) * sin(th) * r * scale.z))
		pts.append(row)
	for j in rings:
		var cc: Color = top if (top != null and j < rings / 2) else col
		for i in seg:
			var i2 := (i + 1) % seg
			if j == 0:
				tri(pts[0][0], pts[1][i], pts[1][i2], cc, center)
			elif j == rings - 1:
				tri(pts[j][i], pts[j][i2], pts[j + 1][0], cc, center)
			else:
				quad(pts[j][i], pts[j][i2], pts[j + 1][i2], pts[j + 1][i], cc, center)

## Half sphere (dome) sitting on base
func dome(base: Vector3, r: float, col: Color, seg: int = 10, rings: int = 4, hscale: float = 1.0) -> void:
	var pts := []
	for j in rings + 1:
		var phi := (PI * 0.5) * j / rings
		var row := []
		for i in seg:
			var th := TAU * i / seg
			row.append(base + Vector3(cos(phi) * cos(th) * r, sin(phi) * r * hscale, cos(phi) * sin(th) * r))
		pts.append(row)
	var inside := base + Vector3(0, r * 0.3 * hscale, 0)
	for j in rings:
		for i in seg:
			var i2 := (i + 1) % seg
			if j == rings - 1:
				tri(pts[j][i], pts[j][i2], pts[j + 1][0], col, inside)
			else:
				quad(pts[j][i], pts[j][i2], pts[j + 1][i2], pts[j + 1][i], col, inside)

## Gable roof: base rectangle w (x) by d (z), ridge along x at height h, with overhang
func gable(base: Vector3, w: float, d: float, h: float, col: Color, gable_col = null, ov: float = 0.06) -> void:
	var hw := w * 0.5 + ov
	var hd := d * 0.5 + ov
	var gc_: Color = gable_col if gable_col != null else col
	var inside := base + Vector3(0, h * 0.3, 0)
	var a := base + Vector3(-hw, 0, -hd)
	var b := base + Vector3(hw, 0, -hd)
	var cc := base + Vector3(hw, 0, hd)
	var dd := base + Vector3(-hw, 0, hd)
	var r0 := base + Vector3(-hw, h, 0)
	var r1 := base + Vector3(hw, h, 0)
	quad(a, b, r1, r0, col, inside)
	quad(dd, cc, r1, r0, col, inside)
	tri(a, dd, r0, gc_, inside)
	tri(b, cc, r1, gc_, inside)
	# thickness: underside
	quad(a, b, cc, dd, col.darkened(0.3), inside + Vector3(0, h, 0))

## Four-sided pyramid / hip roof
func pyramid(base: Vector3, w: float, d: float, h: float, col: Color, ov: float = 0.05, ridge: float = 0.0) -> void:
	var hw := w * 0.5 + ov
	var hd := d * 0.5 + ov
	var inside := base + Vector3(0, h * 0.25, 0)
	var a := base + Vector3(-hw, 0, -hd)
	var b := base + Vector3(hw, 0, -hd)
	var cc := base + Vector3(hw, 0, hd)
	var dd := base + Vector3(-hw, 0, hd)
	var t0 := base + Vector3(-ridge, h, 0)
	var t1 := base + Vector3(ridge, h, 0)
	quad(a, b, t1, t0, col, inside)
	quad(dd, cc, t1, t0, col, inside)
	tri(a, dd, t0, col, inside)
	tri(b, cc, t1, col, inside)
	quad(a, b, cc, dd, col.darkened(0.3), inside + Vector3(0, h, 0))

## Extruded convex polygon (points in xz, counter-clockwise or not) from y0 to y0+t
func slab(pts: Array, y0: float, t: float, col: Color, top = null) -> void:
	var cen := Vector3.ZERO
	for p in pts:
		cen += Vector3(p.x, 0, p.y)
	cen /= pts.size()
	cen.y = y0 + t * 0.5
	var tc: Color = top if top != null else col
	var k := pts.size()
	for i in k:
		var p0: Vector2 = pts[i]
		var p1: Vector2 = pts[(i + 1) % k]
		quad(Vector3(p0.x, y0, p0.y), Vector3(p1.x, y0, p1.y), Vector3(p1.x, y0 + t, p1.y), Vector3(p0.x, y0 + t, p0.y), col, cen)
		tri(Vector3(cen.x, y0 + t, cen.z), Vector3(p0.x, y0 + t, p0.y), Vector3(p1.x, y0 + t, p1.y), tc, cen)
		tri(Vector3(cen.x, y0, cen.z), Vector3(p0.x, y0, p0.y), Vector3(p1.x, y0, p1.y), col, cen)

## Torus ring lying flat
func ring(center: Vector3, r: float, tube: float, col: Color, seg: int = 16, tseg: int = 4) -> void:
	for i in seg:
		var a0 := TAU * i / seg
		var a1 := TAU * (i + 1) / seg
		var c0 := center + Vector3(cos(a0) * r, 0, sin(a0) * r)
		var c1 := center + Vector3(cos(a1) * r, 0, sin(a1) * r)
		for j in tseg:
			var b0 := TAU * j / tseg
			var b1 := TAU * (j + 1) / tseg
			var o00 := Vector3(cos(a0) * cos(b0), sin(b0), sin(a0) * cos(b0)) * tube
			var o01 := Vector3(cos(a0) * cos(b1), sin(b1), sin(a0) * cos(b1)) * tube
			var o10 := Vector3(cos(a1) * cos(b0), sin(b0), sin(a1) * cos(b0)) * tube
			var o11 := Vector3(cos(a1) * cos(b1), sin(b1), sin(a1) * cos(b1)) * tube
			var mid := (c0 + c1) * 0.5
			quad(c0 + o00, c1 + o10, c1 + o11, c0 + o01, col, mid)

## Lofted boat hull along z (stern at -L/2, bow at +L/2), keel at -D, deck edge at sheer height.
func hull(L: float, B: float, D: float, col_hull: Color, col_band: Color, col_deck: Color, sheer_bow: float = 0.0, sheer_stern: float = 0.0, stern_w: float = 0.55, bow_pow: float = 0.7, stations: int = 10, flat_bottom: float = 0.0) -> void:
	var secs := []
	for s in stations + 1:
		var t := float(s) / stations
		var w := 0.0
		if t < 0.5:
			w = lerpf(stern_w, 1.0, smoothstep(0.0, 0.5, t))
		else:
			w = pow(maxf(0.0, 1.0 - pow((t - 0.5) / 0.5, 2.0)), bow_pow)
		if s == stations:
			w = 0.0
		var hw := B * 0.5 * w
		var zz := -L * 0.5 + L * t
		var yd := sheer_stern * pow(1.0 - t, 3.0) + sheer_bow * pow(t, 3.0)
		var keel := -D * (0.35 + 0.65 * sqrt(clampf(w * 1.2, 0.0, 1.0)))
		secs.append([
			Vector3(hw, yd, zz), Vector3(hw * 0.97, yd * 0.4 - D * 0.3, zz), Vector3(hw * (0.7 + flat_bottom * 0.3), keel * 0.8, zz),
			Vector3(hw * flat_bottom, keel, zz),
		])
	for s in stations:
		var A: Array = secs[s]
		var Bn: Array = secs[s + 1]
		var ins := Vector3(0, -D * 0.4, (A[0].z + Bn[0].z) * 0.5)
		for side in [1.0, -1.0]:
			var m := Vector3(side, 1, 1)
			for k in 3:
				var cc: Color = col_band if k == 0 else col_hull
				quad(A[k] * m, Bn[k] * m, Bn[k + 1] * m, A[k + 1] * m, cc, ins)
		# keel strip between the two flat-bottom edges
		if flat_bottom > 0.0:
			quad(A[3], Bn[3], Bn[3] * Vector3(-1, 1, 1), A[3] * Vector3(-1, 1, 1), col_hull, ins)
		# deck
		var dy := -0.02
		quad(A[0] + Vector3(0, dy, 0), Bn[0] + Vector3(0, dy, 0), Bn[0] * Vector3(-1, 1, 1) + Vector3(0, dy, 0), A[0] * Vector3(-1, 1, 1) + Vector3(0, dy, 0), col_deck, ins)
	# transom (stern face)
	var S: Array = secs[0]
	var ins2: Vector3 = Vector3(0, -D * 0.4, S[0].z + 0.2)
	for k in 3:
		quad(S[k], S[k + 1], S[k + 1] * Vector3(-1, 1, 1), S[k] * Vector3(-1, 1, 1), col_hull.darkened(0.1), ins2)

func is_empty() -> bool:
	return v.is_empty() and gv.is_empty()

func commit(mat: Material, glow_mat: Material) -> ArrayMesh:
	var m := ArrayMesh.new()
	if v.size():
		var a := []
		a.resize(Mesh.ARRAY_MAX)
		a[Mesh.ARRAY_VERTEX] = v
		a[Mesh.ARRAY_NORMAL] = n
		a[Mesh.ARRAY_COLOR] = c
		m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, a)
		m.surface_set_material(m.get_surface_count() - 1, mat)
	if gv.size():
		var a2 := []
		a2.resize(Mesh.ARRAY_MAX)
		a2[Mesh.ARRAY_VERTEX] = gv
		a2[Mesh.ARRAY_NORMAL] = gn
		a2[Mesh.ARRAY_COLOR] = gc
		m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, a2)
		m.surface_set_material(m.get_surface_count() - 1, glow_mat)
	return m
