class_name CameraRig
extends Node3D
## RTS camera: WASD / arrows pan, Q/E rotate, wheel zoom, right-drag pan, middle-drag rotate.

var cam: Camera3D
var yaw := 0.0
var pitch := 52.0
var dist := 26.0
var target_dist := 26.0
var target_yaw := 0.0
var focus := Vector3.ZERO
var target_focus := Vector3.ZERO
var dragging := false
var rotating := false
var drag_moved := 0.0
var last_mouse := Vector2.ZERO
var orbit := false
var shake := 0.0
var keys_enabled := true

func _ready() -> void:
	cam = Camera3D.new()
	cam.fov = 42.0
	cam.near = 0.1
	cam.far = 500.0
	add_child(cam)
	_apply(1.0)

func _unhandled_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton:
		var mb := ev as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			target_dist = clampf(target_dist * 0.88, 7.0, 62.0)
		elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			target_dist = clampf(target_dist * 1.13, 7.0, 62.0)
		elif mb.button_index == MOUSE_BUTTON_RIGHT:
			dragging = mb.pressed
			if mb.pressed:
				drag_moved = 0.0
			last_mouse = mb.position
		elif mb.button_index == MOUSE_BUTTON_MIDDLE:
			rotating = mb.pressed
			last_mouse = mb.position
	elif ev is InputEventMouseMotion:
		var mm := ev as InputEventMouseMotion
		if dragging:
			var d := mm.position - last_mouse
			drag_moved += d.length()
			var k := dist * 0.0016
			var fwd := Vector3(-sin(yaw), 0, -cos(yaw))
			var right := Vector3(cos(yaw), 0, -sin(yaw))
			target_focus += (-right * d.x + fwd * d.y) * k
		elif rotating:
			var d2 := mm.position - last_mouse
			target_yaw -= d2.x * 0.006
		last_mouse = mm.position

func _process(dt: float) -> void:
	if orbit:
		target_yaw += dt * 0.06
	elif keys_enabled:
		var mv := Vector3.ZERO
		if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
			mv.z -= 1
		if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
			mv.z += 1
		if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
			mv.x -= 1
		if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
			mv.x += 1
		if Input.is_key_pressed(KEY_Q):
			target_yaw += dt * 1.6
		if Input.is_key_pressed(KEY_E):
			target_yaw -= dt * 1.6
		if mv != Vector3.ZERO:
			mv = mv.normalized().rotated(Vector3.UP, yaw) * dist * 0.9 * dt
			target_focus += mv
	var lim := 30.0
	var fl := Vector2(target_focus.x, target_focus.z)
	if fl.length() > lim:
		fl = fl.normalized() * lim
		target_focus = Vector3(fl.x, 0, fl.y)
	_apply(minf(1.0, dt * 8.0))

func _apply(k: float) -> void:
	dist = lerpf(dist, target_dist, k)
	yaw = lerp_angle(yaw, target_yaw, k)
	focus = focus.lerp(target_focus, k)
	pitch = lerpf(38.0, 62.0, clampf((dist - 7.0) / 50.0, 0.0, 1.0))
	var pr := deg_to_rad(pitch)
	var off := Vector3(sin(yaw) * cos(pr), sin(pr), cos(yaw) * cos(pr)) * dist
	var sh := Vector3.ZERO
	if shake > 0.0:
		sh = Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)) * shake * 0.12
		shake = maxf(0.0, shake - 0.05)
	position = focus + Vector3(0, 0.6, 0)
	cam.position = off + sh
	cam.look_at(position + sh * 0.5, Vector3.UP)

func ground_ray(screen: Vector2) -> Vector3:
	## March a ray from the camera to the terrain; returns the hit point (y = -100 if none).
	var o := cam.project_ray_origin(screen)
	var d := cam.project_ray_normal(screen)
	var W: HexWorld = G.W
	if d.y > -0.01:
		return Vector3(0, -100, 0)
	var t := maxf(0.0, (3.5 - o.y) / d.y)
	var p := o + d * t
	for i in 600:
		var gy := W.ground_y(p.x, p.z)
		if p.y <= gy:
			return Vector3(p.x, gy, p.z)
		p += d * 0.08
		if p.y < -1.0:
			break
	var t2 := -o.y / d.y
	return o + d * t2
