class_name HexPath
extends RefCounted
## A* over the hex grid with reusable packed arrays and a binary heap.

var W: HexWorld
var g := PackedFloat32Array()
var came := PackedInt32Array()
var seen := PackedInt32Array()
var closed := PackedInt32Array()
var heap_i := PackedInt32Array()
var heap_f := PackedFloat32Array()
var hn := 0
var stamp := 0

func setup(w: HexWorld) -> void:
	W = w
	var n := w.count
	g.resize(n); came.resize(n); seen.resize(n); closed.resize(n)
	seen.fill(0); closed.fill(0)
	heap_i.resize(n * 8); heap_f.resize(n * 8)
	stamp = 0

func _push(i: int, f: float) -> void:
	if hn >= heap_i.size():
		return
	var k := hn
	hn += 1
	heap_i[k] = i
	heap_f[k] = f
	while k > 0:
		var p := (k - 1) >> 1
		if heap_f[p] <= heap_f[k]:
			break
		var ti := heap_i[p]
		var tf := heap_f[p]
		heap_i[p] = heap_i[k]; heap_f[p] = heap_f[k]
		heap_i[k] = ti; heap_f[k] = tf
		k = p

func _pop() -> int:
	var top := heap_i[0]
	hn -= 1
	if hn > 0:
		heap_i[0] = heap_i[hn]
		heap_f[0] = heap_f[hn]
		var k := 0
		while true:
			var l := k * 2 + 1
			var rr := l + 1
			var m := k
			if l < hn and heap_f[l] < heap_f[m]:
				m = l
			if rr < hn and heap_f[rr] < heap_f[m]:
				m = rr
			if m == k:
				break
			var ti := heap_i[m]
			var tf := heap_f[m]
			heap_i[m] = heap_i[k]; heap_f[m] = heap_f[k]
			heap_i[k] = ti; heap_f[k] = tf
			k = m
	return top

## cost(next, from) > 0 to enter a tile, <= 0 when impassable. Returns tile indices from start to goal
## (empty when there is no route).
func find(start: int, cost: Callable, is_goal: Callable, heur: Callable, max_iter: int = 5000) -> PackedInt32Array:
	var out := PackedInt32Array()
	if start < 0:
		return out
	stamp += 1
	hn = 0
	g[start] = 0.0
	seen[start] = stamp
	came[start] = -1
	_push(start, heur.call(start))
	var it := 0
	while hn > 0 and it < max_iter:
		it += 1
		var cur := _pop()
		if closed[cur] == stamp:
			continue
		closed[cur] = stamp
		if is_goal.call(cur):
			var c := cur
			while c != -1:
				out.append(c)
				c = came[c]
			out.reverse()
			return out
		var gc := g[cur]
		for d in 6:
			var nb := W.nbr[cur * 6 + d]
			if nb < 0 or closed[nb] == stamp:
				continue
			var cc: float = cost.call(nb, cur)
			if cc <= 0.0:
				continue
			var ng := gc + cc
			if seen[nb] != stamp or ng < g[nb]:
				seen[nb] = stamp
				g[nb] = ng
				came[nb] = cur
				_push(nb, ng + heur.call(nb))
	return out
