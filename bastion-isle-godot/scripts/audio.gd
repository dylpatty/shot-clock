class_name Sfx
extends Node
## Tiny procedural sound bank: every effect is synthesised into an AudioStreamWAV at start-up (no audio
## files needed). Played through a small pool; volume falls off with distance from the camera target.

const RATE := 22050
var bank := {}
var pool: Array = []
var last := {}
var listener := Vector3.ZERO
var volume := 0.7
var muted := false

func _ready() -> void:
	_make_all()
	for k in 14:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		pool.append(p)
	G.sfx.connect(play)

func _wav(data: PackedFloat32Array) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	bytes.resize(data.size() * 2)
	for i in data.size():
		var v := int(clampf(data[i], -1.0, 1.0) * 32000.0)
		bytes.encode_s16(i * 2, v)
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = RATE
	w.stereo = false
	w.data = bytes
	return w

func _noise_burst(dur: float, decay: float, lp: float, amp: float = 0.9, pitch_drop: float = 0.0) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var y := 0.0
	var ph := 0.0
	for i in n:
		var t := float(i) / RATE
		var env := exp(-t * decay) * minf(1.0, t * 400.0)
		y += (randf_range(-1.0, 1.0) - y) * lp
		var s := y
		if pitch_drop > 0.0:
			ph += TAU * (pitch_drop * exp(-t * 6.0) + 30.0) / RATE
			s = s * 0.6 + sin(ph) * 0.5
		out[i] = s * env * amp
	return out

func _tone(dur: float, f0: float, f1: float, decay: float, amp: float = 0.5, square: bool = false) -> PackedFloat32Array:
	var n := int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var ph := 0.0
	for i in n:
		var t := float(i) / RATE
		var f := lerpf(f0, f1, t / dur)
		ph += TAU * f / RATE
		var s := sin(ph)
		if square:
			s = signf(s) * 0.6 + sin(ph * 3.0) * 0.2
		out[i] = s * exp(-t * decay) * minf(1.0, t * 200.0) * amp
	return out

func _mix(a: PackedFloat32Array, b: PackedFloat32Array, off: int = 0) -> PackedFloat32Array:
	var n := maxi(a.size(), b.size() + off)
	var out := PackedFloat32Array()
	out.resize(n)
	for i in n:
		var v := 0.0
		if i < a.size():
			v += a[i]
		if i - off >= 0 and i - off < b.size():
			v += b[i - off]
		out[i] = v
	return out

func _make_all() -> void:
	bank.boom = _wav(_noise_burst(0.9, 5.0, 0.12, 0.9, 70.0))
	bank.boom_big = _wav(_noise_burst(1.6, 2.8, 0.07, 1.0, 55.0))
	bank.cannon = _wav(_noise_burst(0.5, 9.0, 0.18, 0.85, 90.0))
	bank.catapult = _wav(_mix(_noise_burst(0.15, 30.0, 0.4, 0.5), _tone(0.25, 180.0, 90.0, 14.0, 0.4)))
	bank.musket = _wav(_noise_burst(0.35, 14.0, 0.35, 0.7))
	bank.mg = _wav(_noise_burst(0.07, 60.0, 0.6, 0.55))
	bank.rifle = _wav(_noise_burst(0.12, 40.0, 0.5, 0.45))
	bank.sword = _wav(_tone(0.12, 1800.0, 1400.0, 30.0, 0.25))
	bank.arrow = _wav(_noise_burst(0.22, 12.0, 0.25, 0.3))
	bank.laser = _wav(_tone(0.22, 1400.0, 300.0, 10.0, 0.35))
	bank.rail = _wav(_mix(_tone(0.4, 900.0, 120.0, 6.0, 0.45), _noise_burst(0.3, 12.0, 0.3, 0.5)))
	bank.flak = _wav(_noise_burst(0.3, 14.0, 0.25, 0.6))
	bank.missile = _wav(_noise_burst(0.7, 4.0, 0.5, 0.35))
	bank.splash = _wav(_noise_burst(0.6, 6.0, 0.7, 0.45))
	bank.bomb_drop = _wav(_tone(0.6, 900.0, 300.0, 2.0, 0.18))
	bank.landing = _wav(_noise_burst(0.5, 5.0, 0.3, 0.3))
	bank.plane = _wav(_tone(1.2, 110.0, 95.0, 1.5, 0.12, true))
	bank.nuke = _wav(_noise_burst(3.5, 1.0, 0.03, 1.0, 40.0))
	var horn := _mix(_tone(0.55, 330.0, 330.0, 0.6, 0.35, true), _tone(0.65, 262.0, 262.0, 0.6, 0.35, true), int(0.55 * RATE))
	bank.alarm = _wav(horn)
	var arp := _tone(0.25, 523.0, 523.0, 5.0, 0.35)
	arp = _mix(arp, _tone(0.25, 659.0, 659.0, 5.0, 0.35), int(0.12 * RATE))
	arp = _mix(arp, _tone(0.5, 784.0, 784.0, 3.0, 0.35), int(0.24 * RATE))
	bank.victory = _wav(arp)
	var knock := _tone(0.08, 220.0, 160.0, 40.0, 0.5)
	bank.build = _wav(_mix(_mix(knock, knock, int(0.14 * RATE)), knock, int(0.28 * RATE)))
	bank.click = _wav(_tone(0.04, 1200.0, 900.0, 60.0, 0.25))
	bank.boom_small = bank.boom

func play(name: String, pos: Vector3 = Vector3.ZERO) -> void:
	if muted or not bank.has(name):
		return
	var now := Time.get_ticks_msec()
	if now - int(last.get(name, 0)) < 45:
		return
	last[name] = now
	var global := name in ["alarm", "victory", "click", "nuke", "build"]
	var att := 1.0
	if not global and pos != Vector3.ZERO:
		var d := Vector2(pos.x - listener.x, pos.z - listener.z).length()
		att = clampf(1.0 - d / 45.0, 0.08, 1.0)
	for p in pool:
		if not p.playing:
			p.stream = bank[name]
			p.volume_db = linear_to_db(maxf(0.001, att * volume))
			p.pitch_scale = randf_range(0.92, 1.08) if not global else 1.0
			p.play()
			return
