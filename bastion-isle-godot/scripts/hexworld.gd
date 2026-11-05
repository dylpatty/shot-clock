class_name HexWorld
extends RefCounted
## Procedural hex island. Pointy-top axial hexes with circumradius 1: neighbours are sqrt(3) apart and
## corners point along +-z. All map data lives in flat packed arrays indexed by tile number.

const SQRT3 := 1.7320508
const DIRS := [Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1), Vector2i(-1, 0), Vector2i(-1, 1), Vector2i(0, 1)]

var R := 18
var count := 0
var seed_v := 1
var q := PackedInt32Array()
var r := PackedInt32Array()
var x := PackedFloat32Array()
var z := PackedFloat32Array()
var h := PackedFloat32Array()
var type := PackedByteArray()
var orig_type := PackedByteArray()
var bld := PackedInt32Array()      # building id on the tile, 0 = none
var road := PackedByteArray()
var conn := PackedByteArray()
var ruin := PackedInt32Array()     # destroyed building: type index + 1
var ruin_lv := PackedByteArray()
var nbr := PackedInt32Array()      # 6 neighbour indices per tile, -1 off the map
var lookup := PackedInt32Array()
var center := 0
var islet := -1                    # the lighthouse rock, impassable to ships
var land: Array = []
var coast: Array = []
var edge: Array = []
var landing: Array = []
var shore: Array = []
var version := 0

static func hex_x(qq: int, rr: int) -> float:
	return SQRT3 * (qq + rr * 0.5)

static func hex_z(_qq: int, rr: int) -> float:
	return 1.5 * rr

static func hex_dist(q1: int, r1: int, q2: int, r2: int) -> int:
	var dq := q1 - q2
	var dr := r1 - r2
	return (absi(dq) + absi(dr) + absi(dq + dr)) / 2

static func is_water(t: int) -> bool:
	return t <= Defs.SHALLOW

static func is_land(t: int) -> bool:
	return t >= Defs.SAND

static func is_walkable(t: int) -> bool:
	return t >= Defs.SAND and t != Defs.MOUNTAIN

static func hash2(a: int, b: int) -> float:
	var hh: int = (a * 374761393 + b * 668265263) & 0xFFFFFFFF
	hh = ((hh ^ (hh >> 13)) * 1274126177) & 0xFFFFFFFF
	hh = hh ^ (hh >> 16)
	return float(hh & 0xFFFFFF) / 16777216.0

func tile_index(qq: int, rr: int) -> int:
	if qq < -R or qq > R or rr < -R or rr > R or qq + rr < -R or qq + rr > R:
		return -1
	return lookup[(qq + R) * (2 * R + 1) + (rr + R)]

func tile_at(px: float, pz: float) -> int:
	var qf := (SQRT3 / 3.0) * px - pz / 3.0
	var rf := (2.0 / 3.0) * pz
	var sf := -qf - rf
	var qi := roundi(qf)
	var ri := roundi(rf)
	var si := roundi(sf)
	var dq := absf(qi - qf)
	var dr := absf(ri - rf)
	var ds := absf(si - sf)
	if dq > dr and dq > ds:
		qi = -ri - si
	elif dr > ds:
		ri = -qi - si
	return tile_index(qi, ri)

## Height of the ground (or the sea surface) under a world position
func ground_y(px: float, pz: float) -> float:
	var i := tile_at(px, pz)
	if i < 0:
		return 0.0
	return h[i] if is_land(type[i]) else 0.0

func tile_dist(a: int, b: int) -> int:
	return hex_dist(q[a], r[a], q[b], r[b])

func tpos(i: int) -> Vector3:
	return Vector3(x[i], h[i], z[i])

func count_nbr(i: int, pred: Callable) -> int:
	var n := 0
	for d in 6:
		var j := nbr[i * 6 + d]
		if j >= 0 and pred.call(type[j]):
			n += 1
	return n

func _noise(s: int, oct: int) -> FastNoiseLite:
	var n := FastNoiseLite.new()
	n.seed = s
	n.noise_type = FastNoiseLite.TYPE_PERLIN
	n.frequency = 1.0
	n.fractal_type = FastNoiseLite.FRACTAL_FBM
	n.fractal_octaves = oct
	return n

func generate(seed_in: int, radius: int = 18) -> void:
	R = radius
	seed_v = seed_in
	var coords: Array = []
	for qq in range(-R, R + 1):
		for rr in range(-R, R + 1):
			if absi(qq + rr) <= R:
				coords.append(Vector2i(qq, rr))
	count = coords.size()
	var n := count
	q.resize(n); r.resize(n); x.resize(n); z.resize(n); h.resize(n)
	type.resize(n); bld.resize(n); road.resize(n); conn.resize(n); ruin.resize(n); ruin_lv.resize(n)
	nbr.resize(n * 6)
	lookup.resize((2 * R + 1) * (2 * R + 1))
	lookup.fill(-1)
	bld.fill(0); road.fill(0); conn.fill(0); ruin.fill(0); ruin_lv.fill(0)
	for i in n:
		var c: Vector2i = coords[i]
		q[i] = c.x
		r[i] = c.y
		x[i] = hex_x(c.x, c.y)
		z[i] = hex_z(c.x, c.y)
		lookup[(c.x + R) * (2 * R + 1) + (c.y + R)] = i
	for i in n:
		for d in 6:
			var dv: Vector2i = DIRS[d]
			nbr[i * 6 + d] = tile_index(q[i] + dv.x, r[i] + dv.y)
	center = tile_index(0, 0)

	var nE := _noise(seed_in * 7 + 1, 4)
	var nM := _noise(seed_in * 7 + 2, 3)
	var nR := _noise(seed_in * 7 + 3, 4)
	var nW := _noise(seed_in * 7 + 4, 2)
	var elev := PackedFloat32Array(); elev.resize(n)
	var moist := PackedFloat32Array(); moist.resize(n)
	var ridge := PackedFloat32Array(); ridge.resize(n)

	var island_r := R * 1.5 * 0.6
	for attempt in 8:
		var landc := 0
		for i in n:
			var px := x[i]
			var pz := z[i]
			var wx := px + nW.get_noise_2d(px * 0.045, pz * 0.045) * 7.0
			var wz := pz + nW.get_noise_2d(px * 0.045 + 31.7, pz * 0.045 - 12.3) * 7.0
			var d := sqrt(wx * wx + wz * wz) / island_r
			elev[i] = 1.0 - d * d * 0.9 - d * 0.15 + nE.get_noise_2d(wx * 0.085, wz * 0.085) * 0.55
			moist[i] = nM.get_noise_2d(px * 0.1 + 5.1, pz * 0.1 - 3.3)
			ridge[i] = 1.0 - absf(nR.get_noise_2d(px * 0.065, pz * 0.065)) * 2.2
			if elev[i] > 0.0:
				landc += 1
		if landc < 240:
			island_r *= 1.07
		elif landc > 420:
			island_r *= 0.94
		else:
			break

	# classify, nudging thresholds until the island has enough of every resource
	var thF := 0.05
	var thH := 0.8
	var thM := 0.93
	for attempt in 12:
		var nF := 0
		var nH := 0
		var nMt := 0
		var nL := 0
		for i in n:
			if elev[i] <= 0.0:
				type[i] = Defs.DEEP
				continue
			nL += 1
			var near_c := hex_dist(q[i], r[i], 0, 0) <= 2
			var t := Defs.GRASS
			if not near_c:
				if ridge[i] > thM and elev[i] > 0.42:
					t = Defs.MOUNTAIN
				elif ridge[i] > thH and elev[i] > 0.22:
					t = Defs.HILLS
				elif moist[i] > thF:
					t = Defs.FOREST
			type[i] = t
			if t == Defs.FOREST:
				nF += 1
			elif t == Defs.HILLS:
				nH += 1
			elif t == Defs.MOUNTAIN:
				nMt += 1
		var ok := true
		if nF < nL * 0.18:
			thF -= 0.05
			ok = false
		elif nF > nL * 0.34:
			thF += 0.04
			ok = false
		if nH < nL * 0.08:
			thH -= 0.04
			ok = false
		elif nH > nL * 0.18:
			thH += 0.03
			ok = false
		if nMt < nL * 0.03:
			thM -= 0.025
			ok = false
		elif nMt > nL * 0.07:
			thM += 0.015
			ok = false
		if ok:
			break

	# keep only the land connected to the centre
	var seen := PackedByteArray(); seen.resize(n); seen.fill(0)
	var stack: Array = [center]
	seen[center] = 1
	type[center] = Defs.GRASS
	while stack.size():
		var c: int = stack.pop_back()
		for d in 6:
			var j := nbr[c * 6 + d]
			if j >= 0 and seen[j] == 0 and is_land(type[j]):
				seen[j] = 1
				stack.append(j)
	for i in n:
		if is_land(type[i]) and seen[i] == 0:
			type[i] = Defs.DEEP
		if hex_dist(q[i], r[i], 0, 0) >= R - 4:
			type[i] = Defs.DEEP

	# beaches along low coast
	for i in n:
		if not is_land(type[i]) or type[i] == Defs.MOUNTAIN:
			continue
		if hex_dist(q[i], r[i], 0, 0) <= 2:
			continue
		var water := 0
		for d in 6:
			var j := nbr[i * 6 + d]
			if j < 0 or not is_land(type[j]):
				water += 1
		if water > 0 and (elev[i] < 0.3 or type[i] != Defs.HILLS) and hash2(i, seed_in) < 0.8:
			type[i] = Defs.SAND

	# distance to land decides shallows
	var dist := PackedInt32Array(); dist.resize(n); dist.fill(999)
	var queue: Array = []
	for i in n:
		if is_land(type[i]):
			dist[i] = 0
			queue.append(i)
	var qi := 0
	while qi < queue.size():
		var c: int = queue[qi]
		qi += 1
		for d in 6:
			var j := nbr[c * 6 + d]
			if j >= 0 and dist[j] > dist[c] + 1:
				dist[j] = dist[c] + 1
				queue.append(j)
	for i in n:
		if not is_land(type[i]):
			type[i] = Defs.SHALLOW if dist[i] <= 2 else Defs.DEEP

	# heights, terraced for a chunky diorama look
	for i in n:
		var t := type[i]
		var v := hash2(i, seed_in + 7) - 0.5
		var hh := 0.0
		if t == Defs.DEEP:
			hh = -2.0 - minf(dist[i] - 3, 4) * 0.15 + v * 0.2
		elif t == Defs.SHALLOW:
			hh = (-0.42 if dist[i] == 1 else -0.85) + v * 0.08
		elif t == Defs.SAND:
			hh = 0.22
		elif t == Defs.GRASS or t == Defs.FOREST:
			hh = 0.75 if elev[i] > 0.62 else 0.45
		elif t == Defs.HILLS:
			hh = 1.0 + (0.25 if ridge[i] > thH + 0.06 else 0.0)
		else:
			hh = 1.3 + clampf((ridge[i] - thM) * 3.0, 0.0, 0.5)
		h[i] = hh

	# a lighthouse rock in the shallows
	islet = -1
	var best := 1e9
	for i in n:
		if type[i] == Defs.SHALLOW and dist[i] == 2:
			var s := hash2(i, seed_in + 99)
			if s < best:
				# must not block a strait: every water neighbour keeps another water route
				var wn := 0
				for d in 6:
					var j := nbr[i * 6 + d]
					if j >= 0 and is_water(type[j]):
						wn += 1
				if wn == 6:
					best = s
					islet = i
	if islet >= 0:
		h[islet] = 0.35
	orig_type = type.duplicate()
	rebuild_lists()
	version += 1

func rebuild_lists() -> void:
	land.clear(); coast.clear(); edge.clear(); landing.clear(); shore.clear()
	for i in count:
		var t := type[i]
		if is_land(t):
			land.append(i)
			for d in 6:
				var j := nbr[i * 6 + d]
				if j >= 0 and is_water(type[j]):
					coast.append(i)
					break
		elif i != islet:
			if hex_dist(q[i], r[i], 0, 0) == R:
				edge.append(i)
			var is_shore := false
			var is_landing := false
			for d in 6:
				var j := nbr[i * 6 + d]
				if j >= 0 and is_land(type[j]):
					is_shore = true
					if is_walkable(type[j]):
						is_landing = true
			if is_shore:
				shore.append(i)
			if is_landing:
				landing.append(i)

## Water a ship may enter
func sea_ok(i: int) -> bool:
	return i >= 0 and is_water(type[i]) and i != islet
