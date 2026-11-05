extends Node3D
## Entry point. Builds the scene in code (environment, sun, camera, views, HUD), drives the simulation at
## 1x/2x/3x, and turns mouse and keyboard input into tools: select, build (R rotates), road, bulldoze.
## Run with `-- --selftest` for the headless self-test.

var env: Environment
var sun: DirectionalLight3D
var fill: DirectionalLight3D
var rig: CameraRig
var terrain: TerrainView
var view: WorldView
var fx: FX
var sfx: Sfx
var hud: Hud
var selftest := false

var tool_kind := ""      # "" | build | road | bulldoze
var tool_type := ""
var tool_rot := 0
var rot_manual := false
var hover_tile := -1
var hover_text := ""
var selected = null      # Bld, or {"ruin": tile}
var painting := false
var last_paint := -1
var quality := 2
var menu_seed := 1

func _ready() -> void:
	selftest = OS.get_cmdline_user_args().has("--selftest")
	_setup_environment()
	rig = CameraRig.new()
	add_child(rig)
	terrain = TerrainView.new()
	add_child(terrain)
	fx = FX.new()
	add_child(fx)
	view = WorldView.new()
	view.fx = fx
	add_child(view)
	sfx = Sfx.new()
	add_child(sfx)
	hud = Hud.new()
	hud.main = self
	add_child(hud)
	hud.action.connect(_on_action)
	G.game_over.connect(_on_game_over)
	G.wave_started.connect(func(_n): pass)
	G.age_changed.connect(func(_a): terrain.refresh())
	G.building_removed.connect(_on_b_removed)
	if selftest:
		sfx.muted = true
		var st := SelfTest.new()
		st.main_ref = self
		add_child(st)
		terrain.rebuild()
		return
	menu_seed = randi() % 9000 + 100
	_preview_world(menu_seed)
	hud.show_main_menu(G.has_save(), menu_seed)

func _preview_world(s: int) -> void:
	G.new_game(s)
	G.mode = "menu"
	view.clear_all()
	terrain.rebuild()
	rig.orbit = true
	rig.target_dist = 34.0
	rig.target_focus = Vector3.ZERO

# ------------------------------------------------------------------ environment and light
func _setup_environment() -> void:
	env = Environment.new()
	env.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var psm := ProceduralSkyMaterial.new()
	psm.sky_top_color = Color(0.24, 0.47, 0.82)
	psm.sky_horizon_color = Color(0.66, 0.8, 0.93)
	psm.ground_bottom_color = Color(0.1, 0.24, 0.38)
	psm.ground_horizon_color = Color(0.62, 0.76, 0.9)
	psm.sun_angle_max = 6.0
	psm.sun_curve = 0.4
	psm.sky_energy_multiplier = 1.0
	sky.sky_material = psm
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 1.0
	env.ambient_light_energy = 0.8
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.0
	env.tonemap_white = 3.2
	env.ssao_radius = 1.1
	env.ssao_intensity = 1.7
	env.ssao_power = 1.4
	env.ssao_detail = 0.6
	env.ssil_radius = 3.0
	env.ssil_intensity = 0.55
	env.glow_intensity = 0.45
	env.glow_strength = 0.9
	env.glow_bloom = 0.02
	env.glow_hdr_threshold = 1.15
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT
	env.fog_enabled = true
	env.fog_light_color = Color(0.72, 0.82, 0.93)
	env.fog_density = 0.003
	env.fog_aerial_perspective = 0.2
	env.fog_sky_affect = 0.0
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.12
	env.adjustment_contrast = 1.04
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, 32, 0)
	sun.light_color = Color(1.0, 0.95, 0.86)
	sun.light_energy = 1.35
	sun.light_angular_distance = 0.8
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_max_distance = 80.0
	sun.shadow_blur = 1.2
	sun.shadow_bias = 0.05
	sun.shadow_normal_bias = 1.2
	add_child(sun)
	fill = DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-30, -150, 0)
	fill.light_color = Color(0.7, 0.8, 1.0)
	fill.light_energy = 0.22
	fill.shadow_enabled = false
	fill.light_specular = 0.0
	add_child(fill)
	_apply_quality()

func _apply_quality() -> void:
	env.ssao_enabled = quality >= 1
	env.ssil_enabled = quality >= 2
	env.glow_enabled = quality >= 1
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS if quality >= 1 else DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.light_angular_distance = 0.8 if quality >= 2 else 0.0

func quality_name() -> String:
	return ["Low", "Medium", "High"][quality]

func cycle_quality() -> void:
	quality = (quality + 2) % 3
	_apply_quality()

# ------------------------------------------------------------------ main loop
func _process(delta: float) -> void:
	var modal: bool = hud.modal_open()
	G.frozen = G.paused or modal or G.mode != "play"
	if not selftest and G.mode == "play" and not G.paused and not modal:
		var sim := minf(delta, 0.1) * G.speed
		while sim > 0.0001:
			var st := minf(sim, 1.0 / 30.0)
			G.step(st)
			sim -= st
	rig.keys_enabled = not modal or hud.modal_kind == "story"
	sfx.listener = rig.focus
	if fx.shake > 0.0:
		rig.shake = maxf(rig.shake, fx.shake)
	sun.directional_shadow_max_distance = clampf(rig.dist * 2.6, 30.0, 120.0)
	view.set_markers(G.wave.plan.get("dirs", []) if G.wave.has("plan") and G.wave.plan is Dictionary else [], G.mode == "play" and G.wave.get("state", "") == "prep")
	_update_hover()

func _update_hover() -> void:
	hover_text = ""
	if selftest or G.mode != "play" or hud.modal_open():
		view.set_ghost("", -1, 0, false)
		view.set_hover(-1)
		return
	var mp := get_viewport().get_mouse_position()
	var over_ui := _mouse_over_ui()
	var p := rig.ground_ray(mp)
	hover_tile = G.W.tile_at(p.x, p.z) if p.y > -50.0 and not over_ui else -1
	view.set_hover(hover_tile if tool_kind != "" or hover_tile >= 0 else -1)
	if tool_kind == "build":
		if tool_type == "dock" and not rot_manual and hover_tile >= 0:
			tool_rot = G.water_rot(hover_tile)
		var prob: String = G.place_problem(tool_type, hover_tile) if hover_tile >= 0 else "Off the map"
		var cost: Dictionary = Defs.level_def(tool_type, 1).cost
		if prob == "" and not G.can_afford(cost):
			prob = "Not enough resources (%s)" % Defs.cost_text(cost)
		view.set_ghost(tool_type, hover_tile, tool_rot, prob == "")
		if hover_tile >= 0:
			var lv := Defs.level_def(tool_type, 1)
			hover_text = "%s  -  %s" % [lv.name, Defs.cost_text(cost)]
			if prob != "":
				hover_text += "\n" + prob
			else:
				var pr: Dictionary = G.preview_prod(tool_type, hover_tile)
				for k in pr:
					hover_text += "\n+%.0f %s / min at full staff" % [pr[k], Defs.RES_NAME[k]]
				hover_text += "\nR: rotate   Right-click: cancel"
		return
	view.set_ghost("", -1, 0, false)
	if tool_kind == "road":
		if hover_tile >= 0:
			var rp: String = G.road_problem(hover_tile)
			hover_text = "Road  -  2 gold" + ("" if rp == "" else "\n" + rp)
		if painting and hover_tile >= 0 and hover_tile != last_paint:
			last_paint = hover_tile
			G.try_road(hover_tile)
		return
	if tool_kind == "bulldoze":
		if hover_tile >= 0:
			hover_text = "Bulldoze"
			if G.W.bld[hover_tile] != 0:
				hover_text += ": " + G.by_id[G.W.bld[hover_tile]].lv().name
			elif G.W.road[hover_tile] != 0:
				hover_text += ": road"
			elif G.W.ruin[hover_tile] != 0:
				hover_text += ": ruins"
		if painting and hover_tile >= 0 and hover_tile != last_paint:
			last_paint = hover_tile
			if G.W.bld[hover_tile] == 0:
				G.bulldoze(hover_tile)
		return
	if over_ui:
		return
	# units under the mouse
	var cam := rig.cam
	var best = null
	var bd := 26.0
	for list in [G.enemies, G.allies]:
		for u in list:
			if not u.alive:
				continue
			var inf := UnitModels.info(u.type)
			var wp: Vector3 = u.pos + Vector3(0, inf.y * 0.4, 0)
			if cam.is_position_behind(wp):
				continue
			var sp := cam.unproject_position(wp)
			var rpx := maxf(16.0, inf.x * 600.0 / maxf(rig.dist, 1.0))
			var d := sp.distance_to(mp)
			if d < rpx and d < bd + rpx * 0.5:
				bd = d
				best = u
	if best != null:
		var u: Unit = best
		var side := "Grey Armada" if u.team == "E" else "Bastion"
		hover_text = "%s · %s · %d / %d HP\n%s" % [u.title(), Defs.AGES[u.age], ceili(u.hp), ceili(u.max_hp), side]
		if u.team == "E" and u.troops > 0:
			hover_text += " · carrying %d troops" % u.troops
		return
	if hover_tile >= 0 and G.W.bld[hover_tile] != 0:
		var b: Bld = G.by_id.get(G.W.bld[hover_tile])
		if b:
			hover_text = "%s (Lv %d) · %s · %d / %d HP" % [b.lv().name, b.level, Defs.AGES[b.age()], ceili(b.hp), ceili(b.max_hp)]
			if b.build_left > 0.0:
				hover_text += "\n%s %s" % ["Upgrading" if b.upgrading else "Building", Hud.fmt_time(b.build_left)]
			elif not b.connected and not b.def.get("noroad", false):
				hover_text += "\nNo road to the Town Hall!"
	elif hover_tile >= 0 and G.W.ruin[hover_tile] != 0:
		hover_text = "Ruins of a %s" % Defs.BUILDINGS[G.ruin_type(hover_tile)].name
	elif hover_tile >= 0 and Input.is_key_pressed(KEY_ALT):
		hover_text = Defs.TERRAIN_NAME[G.W.type[hover_tile]]

func _mouse_over_ui() -> bool:
	var c := get_viewport().gui_get_hovered_control()
	return c != null and c.mouse_filter != Control.MOUSE_FILTER_IGNORE

# ------------------------------------------------------------------ input
func _unhandled_input(ev: InputEvent) -> void:
	if selftest:
		return
	if ev is InputEventKey and ev.pressed and not ev.echo:
		_key(ev.keycode)
		return
	if G.mode != "play" or hud.modal_open():
		return
	if ev is InputEventMouseButton:
		var mb := ev as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_click()
			else:
				painting = false
				last_paint = -1
		elif mb.button_index == MOUSE_BUTTON_RIGHT and not mb.pressed:
			if rig.drag_moved < 6.0:
				if tool_kind != "":
					cancel_tool()
				else:
					selected = null

func _click() -> void:
	var t := hover_tile
	match tool_kind:
		"build":
			if t < 0:
				return
			var e: String = G.try_place(tool_type, t, tool_rot)
			if e != "":
				G.notify(e, "bad")
			elif G.lock_reason(tool_type) != "":
				cancel_tool()
		"road":
			painting = true
			last_paint = t
			if t >= 0:
				var e2: String = G.try_road(t)
				if e2 != "" and e2 != "Already a road":
					G.notify(e2, "bad")
		"bulldoze":
			painting = true
			last_paint = t
			if t >= 0:
				var e3: String = G.bulldoze(t)
				if e3 != "":
					G.notify(e3, "bad")
				elif selected is Bld and not selected.alive:
					selected = null
		_:
			if t < 0:
				selected = null
				return
			if G.W.bld[t] != 0:
				selected = G.by_id.get(G.W.bld[t])
			elif G.W.ruin[t] != 0:
				selected = {"ruin": t}
			else:
				selected = null
	_sync_selection()

func _sync_selection() -> void:
	if selected is Bld and selected.alive:
		view.set_selected(selected.tile)
		var b: Bld = selected
		if not b.ws.is_empty():
			view.show_range(b.pos, b.ws.range, Color(1, 1, 1, 0.45))
		elif b.type == "market":
			view.show_range(b.pos, b.def.radius, Color(1.0, 0.9, 0.4, 0.4))
		elif b.type == "barracks":
			view.show_range(b.pos, b.def.guard, Color(0.5, 0.7, 1.0, 0.35))
		elif tool_kind != "build":
			view.hide_range()
	elif selected is Dictionary:
		view.set_selected(selected.ruin)
		view.hide_range()
	else:
		view.set_selected(-1)
		if tool_kind != "build":
			view.hide_range()

func _key(k: int) -> void:
	if hud.modal_open():
		if k == KEY_ESCAPE and hud.modal_kind in ["research", "market", "help", "pause"]:
			hud.close_modal()
		elif (k == KEY_ENTER or k == KEY_SPACE) and hud.modal_kind == "story":
			hud.close_modal()
		return
	if G.mode != "play":
		return
	match k:
		KEY_ESCAPE:
			if tool_kind != "":
				cancel_tool()
			elif selected != null:
				selected = null
				_sync_selection()
			else:
				hud.show_pause()
		KEY_SPACE:
			G.paused = not G.paused
		KEY_1:
			_on_action("speed", 1)
		KEY_2:
			_on_action("speed", 2)
		KEY_3:
			_on_action("speed", 3)
		KEY_R:
			if tool_kind == "build":
				tool_rot = (tool_rot + 1) % 6
				rot_manual = true
		KEY_T:
			_on_action("tool_road", null)
		KEY_X:
			_on_action("tool_bulldoze", null)
		KEY_U:
			_on_action("upgrade", null)
		KEY_L:
			hud.show_research()
		KEY_H, KEY_F1:
			hud.show_help(false)
		KEY_F5:
			G.notify(do_save(), "info")
		KEY_F9:
			_on_action("load", null)
		KEY_DELETE:
			_on_action("demolish", null)

func cancel_tool() -> void:
	tool_kind = ""
	tool_type = ""
	painting = false
	view.set_ghost("", -1, 0, false)
	_sync_selection()

func do_save() -> String:
	var e: String = G.save_game()
	return "Game saved." if e == "" else e

# ------------------------------------------------------------------ actions from the HUD
func _on_action(name: String, arg) -> void:
	match name:
		"speed":
			if arg == 0:
				G.paused = not G.paused
			else:
				G.speed = arg
				G.paused = false
		"early":
			var g: int = G.call_wave_early()
			if g > 0:
				G.notify("The raiders are lured in early: +%d gold" % g, "good")
		"pause_menu":
			hud.show_pause()
		"resume":
			pass
		"workers":
			G.adjust_workers(arg[0], arg[1])
		"auto_workers":
			G.auto_workers()
		"tool_build":
			if tool_kind == "build" and tool_type == arg:
				cancel_tool()
				return
			tool_kind = "build"
			tool_type = arg
			rot_manual = false
			tool_rot = 0
			selected = null
			_sync_selection()
		"tool_road":
			if tool_kind == "road":
				cancel_tool()
			else:
				tool_kind = "road"
				selected = null
				_sync_selection()
		"tool_bulldoze":
			if tool_kind == "bulldoze":
				cancel_tool()
			else:
				tool_kind = "bulldoze"
				selected = null
				_sync_selection()
		"deselect":
			selected = null
			_sync_selection()
		"upgrade":
			if selected is Bld:
				var e: String = G.upgrade(selected)
				if e != "":
					G.notify(e, "bad")
		"demolish":
			if selected is Bld:
				var e2: String = G.bulldoze(selected.tile)
				if e2 != "":
					G.notify(e2, "bad")
				selected = null
			elif selected is Dictionary:
				G.bulldoze(selected.ruin)
				selected = null
			_sync_selection()
		"rebuild":
			var e3: String = G.rebuild_ruin(arg)
			if e3 != "":
				G.notify(e3, "bad")
			else:
				selected = G.by_id.get(G.W.bld[arg])
			_sync_selection()
		"new_game":
			cancel_tool()
			selected = null
			view.clear_all()
			G.new_game(menu_seed)
			terrain.rebuild()
			rig.orbit = false
			rig.target_dist = 24.0
			rig.target_focus = Vector3.ZERO
			G.auto_workers()
			hud.show_intro()
		"load":
			var e4: String = G.load_game()
			if e4 != "":
				G.notify(e4, "bad")
				if G.mode != "play":
					hud.show_main_menu(G.has_save(), menu_seed)
				return
			cancel_tool()
			selected = null
			view.clear_all()
			terrain.rebuild()
			rig.orbit = false
			rig.target_dist = 24.0
			G.notify("Game loaded.", "good")
		"reroll":
			menu_seed = randi() % 9000 + 100
			_preview_world(menu_seed)
			hud.close_modal()
			hud.show_main_menu(G.has_save(), menu_seed)
		"main_menu":
			cancel_tool()
			selected = null
			_preview_world(menu_seed)
			hud.show_main_menu(G.has_save(), menu_seed)
		"main_menu_show":
			hud.show_main_menu(G.has_save(), menu_seed)
		"quit":
			get_tree().quit()

func _on_b_removed(b) -> void:
	if selected == b:
		selected = null
		_sync_selection()

func _on_game_over(win: bool) -> void:
	if not win:
		cancel_tool()

# ------------------------------------------------------------------ self-test support
func selftest_visuals() -> String:
	var n := 0
	for t in Defs.BUILDINGS:
		for l in range(1, Defs.max_level(t) + 1):
			var m: Dictionary = Models.building(t, l, 0)
			if m.base == null:
				return "model %s level %d is empty" % [t, l]
			n += 1
	for mask in [0, 1, 9, 63]:
		for l in range(1, 6):
			Models.building("wall", l, mask)
	var u := 0
	for k in Defs.ENEMIES:
		if UnitModels.get_mesh(k) == null:
			return "unit model %s is empty" % k
		u += 1
	for k in Defs.ALLIES:
		if UnitModels.get_mesh(k) == null:
			return "unit model %s is empty" % k
		u += 1
	for k in ["pine", "broadleaf", "bush", "rock", "grass", "flower", "boulder"]:
		TerrainView.prop_mesh(k)
	terrain.rebuild()
	var tris: int = terrain.tri_count
	print("visuals: %d building models, %d unit models, terrain %d triangles, %d building nodes, %d props types" % [n, u, tris, view.bnodes.size(), terrain.props.size()])
	# exercise the UI code paths
	G.mode = "play"
	hud.show_research()
	hud.close_modal()
	hud.show_market()
	hud.close_modal()
	hud.show_pause()
	hud.close_modal()
	hud.show_help(false)
	hud.close_modal()
	hud.show_intro()
	while hud.modal_open():
		hud.close_modal()
	if G.buildings.size():
		selected = G.buildings[0]
		hud._update_info()
		selected = G.hq
		hud._update_info()
	hud._update_wave()
	# drive the input paths the way a player would (hover, tools, clicks, keys)
	selftest = false
	var free_tile := -1
	for i in G.W.land:
		if G.place_problem("house", i) == "":
			free_tile = i
			break
	for tk in [["tool_build", "house"], ["tool_road", null], ["tool_bulldoze", null], ["deselect", null]]:
		_on_action(tk[0], tk[1])
		_update_hover()
		hover_tile = free_tile
		if tk[0] == "tool_build":
			_key(KEY_R)
			G.res.wood += 100
			G.res.gold += 100
			_click()
		elif tk[0] == "tool_road":
			_click()
		cancel_tool()
	hover_tile = G.hq.tile
	_click()
	_sync_selection()
	_key(KEY_U)
	_key(KEY_ESCAPE)
	_key(KEY_ESCAPE)
	hud._process(0.2)
	hud._process(0.2)
	while hud.modal_open():
		hud.close_modal()
	_on_action("early", null)
	_on_action("speed", 3)
	_on_action("workers", ["science", 1])
	_on_action("workers", ["farm", -1])
	_on_action("auto_workers", null)
	_process(0.016)
	_on_action("reroll", null)
	_on_action("new_game", null)
	while hud.modal_open():
		hud.close_modal()
	_process(0.016)
	hud._process(0.2)
	selftest = true
	print("ui/input paths OK, new game on seed %d with %d buildings" % [menu_seed, G.buildings.size()])
	return ""
