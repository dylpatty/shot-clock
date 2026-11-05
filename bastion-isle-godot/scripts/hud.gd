class_name Hud
extends CanvasLayer
## All UI, built in code: resource bar, raid timer and speed controls, worker assignment panel, build menu,
## building info panel with upgrade preview, notifications, hover tooltips, chronicle (story) panels,
## research, market, main menu, pause menu, raid reports and end screens.

signal action(name: String, arg)

const RES_COL := {"food": Color(0.55, 0.85, 0.3), "wood": Color(0.72, 0.5, 0.27), "stone": Color(0.72, 0.72, 0.75),
	"iron": Color(0.55, 0.65, 0.8), "gold": Color(1.0, 0.82, 0.25), "science": Color(0.45, 0.82, 1.0)}
const GOLD := Color(0.9, 0.72, 0.38)
const TXT := Color(0.96, 0.94, 0.88)
const DIM := Color(0.72, 0.72, 0.7)

var main = null
var root: Control
var top_panel: PanelContainer
var worker_panel: PanelContainer
var res_labels := {}
var pop_label: Label
var age_label: Label
var wave_label: Label
var early_btn: Button
var speed_btns: Array = []
var worker_rows := {}
var idle_label: Label
var tip_label: Label
var build_bar: PanelContainer
var cat_btns := {}
var cards_box: HBoxContainer
var cur_cat := "eco"
var card_btns := {}
var road_btn: Button
var doze_btn: Button
var info: PanelContainer
var info_title: Label
var info_sub: Label
var info_desc: Label
var info_stats: RichTextLabel
var info_hp: ProgressBar
var up_box: VBoxContainer
var up_name: Label
var up_cost: RichTextLabel
var up_btn: Button
var info_extra: HBoxContainer
var demolish_btn: Button
var preview_vp: SubViewport
var preview_mesh: MeshInstance3D
var preview_head: MeshInstance3D
var preview_key := ""
var wave_panel: PanelContainer
var wave_info: Label
var notes: VBoxContainer
var tooltip: PanelContainer
var tooltip_label: Label
var modal_dim: ColorRect
var modal_panel: PanelContainer
var modal_box: VBoxContainer
var modal_kind := ""
var story_queue: Array = []
var toast: PanelContainer
var toast_label: Label
var toast_t := 0.0
var _acc := 0.0
var _last_sel = null

func _ready() -> void:
	layer = 10
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.theme = _make_theme()
	add_child(root)
	_build_top()
	_build_workers()
	_build_buildbar()
	_build_info()
	_build_wave_panel()
	notes = VBoxContainer.new()
	notes.mouse_filter = Control.MOUSE_FILTER_IGNORE
	notes.set_anchors_preset(Control.PRESET_CENTER_TOP)
	notes.position = Vector2(-260, 150)
	notes.custom_minimum_size = Vector2(520, 0)
	notes.alignment = BoxContainer.ALIGNMENT_BEGIN
	root.add_child(notes)
	_build_toast()
	tooltip = PanelContainer.new()
	tooltip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tooltip_label = _lbl("", 14)
	tooltip.add_child(tooltip_label)
	tooltip.visible = false
	root.add_child(tooltip)
	modal_dim = ColorRect.new()
	modal_dim.color = Color(0, 0, 0, 0.45)
	modal_dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	modal_dim.visible = false
	root.add_child(modal_dim)
	modal_panel = PanelContainer.new()
	modal_panel.set_anchors_preset(Control.PRESET_CENTER)
	modal_panel.visible = false
	root.add_child(modal_panel)
	var mm := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		mm.add_theme_constant_override("margin_" + side, 18)
	modal_panel.add_child(mm)
	modal_box = VBoxContainer.new()
	modal_box.add_theme_constant_override("separation", 10)
	mm.add_child(modal_box)
	G.message.connect(_on_message)
	G.story.connect(func(t, x): show_story(t, x))
	G.wave_ended.connect(_on_wave_end)
	G.game_over.connect(_on_game_over)

# ------------------------------------------------------------------ theme and helpers
func _sb(bg: Color, border: Color, radius: int = 8, bw: int = 2, margin: int = 8) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(bw)
	s.set_corner_radius_all(radius)
	s.set_content_margin_all(margin)
	s.shadow_color = Color(0, 0, 0, 0.35)
	s.shadow_size = 4
	return s

func _make_theme() -> Theme:
	var t := Theme.new()
	t.default_font_size = 15
	t.set_stylebox("panel", "PanelContainer", _sb(Color(0.08, 0.1, 0.14, 0.88), Color(0.85, 0.68, 0.35, 0.85)))
	t.set_stylebox("normal", "Button", _sb(Color(0.19, 0.24, 0.33), Color(0.55, 0.46, 0.3), 6, 1, 6))
	t.set_stylebox("hover", "Button", _sb(Color(0.27, 0.33, 0.45), Color(0.95, 0.78, 0.42), 6, 1, 6))
	t.set_stylebox("pressed", "Button", _sb(Color(0.36, 0.3, 0.16), Color(1.0, 0.85, 0.45), 6, 2, 6))
	t.set_stylebox("disabled", "Button", _sb(Color(0.15, 0.16, 0.18, 0.9), Color(0.3, 0.3, 0.3), 6, 1, 6))
	t.set_stylebox("focus", "Button", StyleBoxEmpty.new())
	t.set_color("font_color", "Button", TXT)
	t.set_color("font_disabled_color", "Button", Color(0.55, 0.55, 0.55))
	t.set_color("font_hover_color", "Button", Color(1, 0.95, 0.8))
	t.set_color("font_color", "Label", TXT)
	t.set_color("default_color", "RichTextLabel", TXT)
	var bg := _sb(Color(0.1, 0.1, 0.12), Color(0.3, 0.3, 0.3), 3, 1, 0)
	t.set_stylebox("background", "ProgressBar", bg)
	t.set_stylebox("fill", "ProgressBar", _sb(Color(0.35, 0.8, 0.4), Color(0.35, 0.8, 0.4), 3, 0, 0))
	t.set_stylebox("panel", "TooltipPanel", _sb(Color(0.06, 0.07, 0.1, 0.95), GOLD, 6, 1, 6))
	t.set_color("font_color", "TooltipLabel", TXT)
	return t

func _lbl(text: String, size: int = 15, col: Color = TXT) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _btn(text: String, cb: Callable, tip: String = "") -> Button:
	var b := Button.new()
	b.text = text
	b.tooltip_text = tip
	b.focus_mode = Control.FOCUS_NONE
	b.pressed.connect(_on_btn.bind(cb))
	return b

func _on_btn(cb: Callable) -> void:
	G.sfx.emit("click", Vector3.ZERO)
	cb.call()

func _close_then(name: String) -> void:
	close_modal()
	action.emit(name, null)

func _set_cat(c: String) -> void:
	cur_cat = c
	_fill_cards()

func _panel(parent: Control) -> PanelContainer:
	var p := PanelContainer.new()
	p.mouse_filter = Control.MOUSE_FILTER_STOP
	parent.add_child(p)
	return p

static func fmt_time(s: float) -> String:
	var t := int(maxf(0.0, s))
	return "%d:%02d" % [t / 60, t % 60]

static func cost_bb(cost: Dictionary) -> String:
	var parts := []
	for k in Defs.RES:
		if cost.get(k, 0) > 0:
			var ok: bool = G.res.get(k, 0.0) >= cost[k]
			parts.append("[color=#%s]%d %s[/color]" % [(RES_COL[k] if ok else Color(1, 0.35, 0.3)).to_html(false), cost[k], Defs.RES_NAME[k]])
	return ", ".join(parts) if parts.size() else "free"

static func cost_short(cost: Dictionary) -> String:
	var ab := {"food": "F", "wood": "W", "stone": "S", "iron": "I", "gold": "G", "science": "Sc"}
	var parts := []
	for k in Defs.RES:
		if cost.get(k, 0) > 0:
			parts.append("%d%s" % [cost[k], ab[k]])
	return " ".join(parts)

# ------------------------------------------------------------------ top bar
func _build_top() -> void:
	var p := _panel(root)
	top_panel = p
	p.set_anchors_preset(Control.PRESET_TOP_WIDE)
	p.offset_left = 6
	p.offset_right = -6
	p.offset_top = 4
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 10)
	p.add_child(hb)
	for k in Defs.RES:
		var box := HBoxContainer.new()
		box.add_theme_constant_override("separation", 5)
		box.tooltip_text = Defs.RES_NAME[k]
		box.mouse_filter = Control.MOUSE_FILTER_PASS
		var sw := ColorRect.new()
		sw.color = RES_COL[k]
		sw.custom_minimum_size = Vector2(14, 14)
		sw.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		sw.mouse_filter = Control.MOUSE_FILTER_IGNORE
		box.add_child(sw)
		var l := _lbl("0", 15)
		l.custom_minimum_size = Vector2(80, 0)
		box.add_child(l)
		res_labels[k] = l
		hb.add_child(box)
	pop_label = _lbl("Pop", 15)
	hb.add_child(pop_label)
	age_label = _lbl("Medieval", 15, GOLD)
	hb.add_child(age_label)
	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sp.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hb.add_child(sp)
	wave_label = _lbl("Raid 1", 15, Color(1.0, 0.75, 0.6))
	hb.add_child(wave_label)
	early_btn = _btn("Start raid now", func(): action.emit("early", null), "Call the next raid now for bonus gold (more time left = more gold).")
	hb.add_child(early_btn)
	for s in [0, 1, 2, 3]:
		var b := _btn("II" if s == 0 else "%dx" % s, func(): action.emit("speed", s), "Pause (Space)" if s == 0 else "Game speed %dx (key %d)" % [s, s])
		b.toggle_mode = true
		b.custom_minimum_size = Vector2(38, 0)
		hb.add_child(b)
		speed_btns.append(b)
	hb.add_child(_btn("Research", func(): show_research(), "Research upgrades with science (L)"))
	hb.add_child(_btn("Menu", func(): action.emit("pause_menu", null), "Pause menu (Esc)"))

# ------------------------------------------------------------------ workers
func _build_workers() -> void:
	var p := _panel(root)
	worker_panel = p
	p.position = Vector2(8, 58)
	p.custom_minimum_size = Vector2(300, 0)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 6)
	p.add_child(vb)
	vb.add_child(_lbl("Workers", 18, GOLD))
	idle_label = _lbl("", 14)
	vb.add_child(idle_label)
	for s in Defs.SECTORS:
		var row := VBoxContainer.new()
		row.add_theme_constant_override("separation", 2)
		row.tooltip_text = Defs.SECTOR_HINT[s]
		row.mouse_filter = Control.MOUSE_FILTER_PASS
		var hb := HBoxContainer.new()
		var name_l := _lbl(Defs.SECTOR_NAME[s], 15)
		name_l.custom_minimum_size = Vector2(84, 0)
		hb.add_child(name_l)
		var minus := _btn("-", func(): action.emit("workers", [s, -5 if Input.is_key_pressed(KEY_SHIFT) else -1]), "Remove a worker (Shift: 5)")
		minus.custom_minimum_size = Vector2(30, 0)
		hb.add_child(minus)
		var cnt := _lbl("0 / 0", 15)
		cnt.custom_minimum_size = Vector2(78, 0)
		cnt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		hb.add_child(cnt)
		var plus := _btn("+", func(): action.emit("workers", [s, 5 if Input.is_key_pressed(KEY_SHIFT) else 1]), "Add a worker (Shift: 5). Takes idle citizens first, then borrows from other sectors.")
		plus.custom_minimum_size = Vector2(30, 0)
		hb.add_child(plus)
		var out := _lbl("", 13, DIM)
		hb.add_child(out)
		row.add_child(hb)
		var bar := ProgressBar.new()
		bar.custom_minimum_size = Vector2(0, 6)
		bar.show_percentage = false
		bar.max_value = 1.0
		bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
		row.add_child(bar)
		vb.add_child(row)
		worker_rows[s] = {"cnt": cnt, "bar": bar, "out": out}
	vb.add_child(_btn("Auto-assign all", func(): action.emit("auto_workers", null), "Spread everyone over the open jobs (food first when hungry). Clears your manual caps."))
	tip_label = _lbl("", 13, DIM)
	tip_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tip_label.custom_minimum_size = Vector2(280, 0)
	vb.add_child(tip_label)

# ------------------------------------------------------------------ build bar
func _build_buildbar() -> void:
	build_bar = _panel(root)
	build_bar.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	build_bar.grow_horizontal = Control.GROW_DIRECTION_BOTH
	build_bar.grow_vertical = Control.GROW_DIRECTION_BEGIN
	build_bar.offset_bottom = -6
	var vb := VBoxContainer.new()
	build_bar.add_child(vb)
	var tabs := HBoxContainer.new()
	tabs.add_theme_constant_override("separation", 6)
	vb.add_child(tabs)
	for c in ["eco", "civic", "def"]:
		var b := _btn(Defs.CAT_NAME[c], _set_cat.bind(c), "")
		b.toggle_mode = true
		tabs.add_child(b)
		cat_btns[c] = b
	var sp := Control.new()
	sp.custom_minimum_size = Vector2(30, 0)
	tabs.add_child(sp)
	road_btn = _btn("Road (T)", func(): action.emit("tool_road", null), "Build roads (2 gold each). Click and drag. Buildings need a road to the Town Hall.")
	road_btn.toggle_mode = true
	tabs.add_child(road_btn)
	doze_btn = _btn("Bulldoze (X)", func(): action.emit("tool_bulldoze", null), "Remove roads, ruins and buildings (half refund).")
	doze_btn.toggle_mode = true
	tabs.add_child(doze_btn)
	tabs.add_child(_lbl("   R rotates   Right-click cancels", 13, DIM))
	cards_box = HBoxContainer.new()
	cards_box.add_theme_constant_override("separation", 6)
	vb.add_child(cards_box)
	_fill_cards()

func _fill_cards() -> void:
	for c in cards_box.get_children():
		c.queue_free()
	card_btns.clear()
	for c in cat_btns:
		cat_btns[c].button_pressed = c == cur_cat
	for t in Defs.BUILD_MENU[cur_cat]:
		var b := _btn("", func(): action.emit("tool_build", t), "")
		b.custom_minimum_size = Vector2(128, 58)
		b.clip_text = true
		cards_box.add_child(b)
		card_btns[t] = b
	_update_cards()

func _update_cards() -> void:
	for t in card_btns:
		var b: Button = card_btns[t]
		var d: Dictionary = Defs.BUILDINGS[t]
		var lv := Defs.level_def(t, 1)
		var reason: String = G.lock_reason(t)
		var cost: Dictionary = lv.cost
		var lim: int = G.limit_of(t)
		var cnt: int = G.count_type(t)
		var lim_txt := "" if lim >= 999 else "  %d/%d" % [cnt, lim]
		b.text = "%s%s\n%s" % [lv.name if reason == "" else d.name, lim_txt, cost_short(cost)]
		b.disabled = reason != ""
		var tip: String = "%s - %s\n%s\nCost: %s" % [lv.name, d.name, d.desc, Defs.cost_text(cost)]
		if reason != "":
			tip += "\n\nLOCKED: " + reason
		b.tooltip_text = tip
		b.modulate = Color(1, 1, 1) if G.can_afford(cost) or reason != "" else Color(1.0, 0.75, 0.7)
		if main and main.tool_kind == "build" and main.tool_type == t:
			b.modulate = Color(1.0, 0.95, 0.6)

# ------------------------------------------------------------------ info panel
func _build_info() -> void:
	info = _panel(root)
	info.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	info.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	info.offset_top = 58
	info.offset_right = -8
	info.custom_minimum_size = Vector2(340, 0)
	info.visible = false
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 6)
	info.add_child(vb)
	var hb := HBoxContainer.new()
	info_title = _lbl("", 20, GOLD)
	info_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hb.add_child(info_title)
	hb.add_child(_btn("x", func(): action.emit("deselect", null), "Close (Esc)"))
	vb.add_child(hb)
	info_sub = _lbl("", 14, DIM)
	vb.add_child(info_sub)
	info_desc = _lbl("", 13, DIM)
	info_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info_desc.custom_minimum_size = Vector2(320, 0)
	vb.add_child(info_desc)
	info_hp = ProgressBar.new()
	info_hp.custom_minimum_size = Vector2(0, 14)
	info_hp.show_percentage = false
	vb.add_child(info_hp)
	info_stats = RichTextLabel.new()
	info_stats.bbcode_enabled = true
	info_stats.fit_content = true
	info_stats.scroll_active = false
	info_stats.custom_minimum_size = Vector2(320, 0)
	info_stats.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vb.add_child(info_stats)
	up_box = VBoxContainer.new()
	vb.add_child(up_box)
	up_box.add_child(HSeparator.new())
	up_name = _lbl("", 15, Color(0.75, 0.95, 1.0))
	up_name.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	up_name.custom_minimum_size = Vector2(320, 0)
	up_box.add_child(up_name)
	var svc := SubViewportContainer.new()
	svc.stretch = true
	svc.custom_minimum_size = Vector2(320, 150)
	svc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	up_box.add_child(svc)
	preview_vp = SubViewport.new()
	preview_vp.own_world_3d = true
	preview_vp.transparent_bg = true
	preview_vp.size = Vector2i(320, 150)
	preview_vp.msaa_3d = Viewport.MSAA_4X
	svc.add_child(preview_vp)
	var cam := Camera3D.new()
	cam.fov = 35
	cam.position = Vector3(0, 2.3, 3.6)
	preview_vp.add_child(cam)
	cam.look_at_from_position(cam.position, Vector3(0, 0.7, 0), Vector3.UP)
	var lt := DirectionalLight3D.new()
	lt.rotation_degrees = Vector3(-50, -35, 0)
	lt.light_energy = 1.3
	preview_vp.add_child(lt)
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.75, 0.8, 0.9)
	env.ambient_light_energy = 0.8
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	var we := WorldEnvironment.new()
	we.environment = env
	preview_vp.add_child(we)
	preview_mesh = MeshInstance3D.new()
	preview_vp.add_child(preview_mesh)
	preview_head = MeshInstance3D.new()
	preview_mesh.add_child(preview_head)
	up_cost = RichTextLabel.new()
	up_cost.bbcode_enabled = true
	up_cost.fit_content = true
	up_cost.scroll_active = false
	up_cost.custom_minimum_size = Vector2(320, 0)
	up_cost.mouse_filter = Control.MOUSE_FILTER_IGNORE
	up_box.add_child(up_cost)
	up_btn = _btn("Upgrade (U)", func(): action.emit("upgrade", null), "")
	up_box.add_child(up_btn)
	info_extra = HBoxContainer.new()
	info_extra.add_theme_constant_override("separation", 6)
	vb.add_child(info_extra)
	demolish_btn = _btn("Demolish", func(): action.emit("demolish", null), "Remove this building (50% refund of its build cost)")
	vb.add_child(demolish_btn)

func _set_preview(type: String, lvl: int) -> void:
	var key := "%s%d" % [type, lvl]
	if key == preview_key:
		return
	preview_key = key
	var m: Dictionary = Models.building(type, lvl, 3 if type == "wall" else 0)
	preview_mesh.mesh = m.base
	preview_head.mesh = m.head
	preview_head.position = Vector3(0, m.head_y, 0)
	var s := 0.75 if type == "hq" or type == "house" else 1.0
	if type == "airfield" or type == "dock":
		s = 0.65
	preview_mesh.scale = Vector3.ONE * s
	preview_mesh.position = Vector3(0, 0, -0.3 if type == "dock" else 0.0)

func _info_extra_set(items: Array) -> void:
	for c in info_extra.get_children():
		c.queue_free()
	for it in items:
		info_extra.add_child(it)

func _update_info() -> void:
	var sel = main.selected if main else null
	if sel == null:
		info.visible = false
		_last_sel = null
		return
	info.visible = true
	var changed: bool = sel != _last_sel
	_last_sel = sel
	if sel is Dictionary:
		var tile: int = sel.ruin
		var t: String = G.ruin_type(tile)
		if t == "":
			main.selected = null
			return
		info_title.text = "Ruins"
		info_sub.text = "%s (level %d) was destroyed here" % [Defs.BUILDINGS[t].name, G.W.ruin_lv[tile]]
		info_desc.text = "Rebuild it at its old level for a fraction of the cost, or bulldoze the rubble."
		info_hp.visible = false
		info_stats.text = "Rebuild cost: " + cost_bb(G.rebuild_cost(tile))
		up_box.visible = false
		demolish_btn.text = "Clear rubble"
		if changed:
			_info_extra_set([_btn("Rebuild", func(): action.emit("rebuild", tile), "")])
		return
	var b: Bld = sel
	if not b.alive:
		main.selected = null
		return
	var lv := b.lv()
	info_title.text = lv.name
	info_sub.text = "%s  -  level %d of %d  -  %s" % [b.def.name, b.level, Defs.max_level(b.type), Defs.AGES[b.age()]]
	info_desc.text = b.def.desc
	info_hp.visible = true
	info_hp.max_value = b.max_hp
	info_hp.value = b.hp
	var st := "Health %d / %d" % [int(b.hp), int(b.max_hp)]
	if b.build_left > 0.0:
		st += "\n[color=#ffd070]%s: %s left[/color]" % ["Upgrading" if b.upgrading else "Under construction", fmt_time(b.build_left)]
	if not b.connected and not b.def.get("noroad", false):
		st += "\n[color=#ff7060]Not connected: build a road from here to the Town Hall.[/color]"
	var sector: String = b.def.get("sector", "")
	if G.jobs_of(b) > 0:
		st += "\nJobs %d  -  %s staffing %d%%" % [G.jobs_of(b), Defs.SECTOR_NAME[sector], int(G.staff[sector] * 100)]
	var h := G.housing_of(b)
	if h > 0:
		st += "\nHousing %d%s" % [h, ("  (market: x%.2f tax)" % b.market_boost) if b.market_boost > 1.0 else ""]
	for k in b.prod:
		var f := G.staffing_of(b)
		st += "\n[color=#%s]%s +%.1f / min[/color]" % [RES_COL[k].to_html(false), Defs.RES_NAME[k], b.prod[k] * f]
	if not b.ws.is_empty():
		var w: Dictionary = lv.weapon
		var tg := []
		for dmn in ["ground", "sea", "air"]:
			if w.targets.get(dmn, 0.0) > 0.0:
				tg.append(dmn)
		st += "\nDamage %.0f  -  %.2f shots/s  -  range %.1f\nHits: %s" % [b.ws.dmg, b.ws.rate, b.ws.range, ", ".join(tg)]
		var ea := Defs.wave_age(G.wave.n if G.wave.state == "prep" else G.wave.current)
		if ea > b.age():
			st += "\n[color=#ff7060]Outdated: %d%% damage against %s raiders. Upgrade![/color]" % [int(Combat.obsolescence(b.age(), ea) * 100), Defs.AGES[ea]]
		st += "\nKills: %d" % b.kills
	if b.type == "barracks":
		st += "\nSoldiers %d / %d (%s)" % [b.units.size(), G.combat.barracks_cap(b), Defs.ALLIES[lv.soldier].name]
	if b.type == "airfield":
		st += "\nAircraft %d / %d (%s)" % [b.units.size(), G.combat.fighter_cap(b), Defs.ALLIES[lv.plane].name]
	if b.type == "market":
		st += "\nTax bonus x%.2f for houses within %.1f" % [lv.tax, b.def.radius]
	info_stats.text = st
	# upgrade preview
	if b.level < Defs.max_level(b.type):
		up_box.visible = true
		var nl := Defs.level_def(b.type, b.level + 1)
		var na := Defs.level_age(b.type, b.level + 1)
		var txt := "Next: %s  (%s)" % [nl.name, Defs.AGES[na]]
		if nl.has("note"):
			txt += "\n" + nl.note
		up_name.text = txt
		_set_preview(b.type, b.level + 1)
		preview_mesh.rotation.y += 0.01
		var prob: String = G.upgrade_problem(b)
		var ct := "Cost: " + cost_bb(nl.cost) + "   Time %s" % fmt_time(G.build_time(b.type, b.level + 1))
		if prob != "" and prob != "Not enough resources":
			ct += "\n[color=#ff9070]%s[/color]" % prob
		up_cost.text = ct
		up_btn.disabled = prob != ""
		up_btn.text = "Advance to the %s age (U)" % Defs.AGES[na] if b.type == "hq" else "Upgrade (U)"
	else:
		up_box.visible = false
	demolish_btn.visible = b.type != "hq"
	demolish_btn.text = "Demolish"
	if changed:
		var extra := []
		if b.type == "hq":
			extra.append(_btn("Research...", func(): show_research(), ""))
		if b.type == "market":
			extra.append(_btn("Trade...", func(): show_market(), ""))
		_info_extra_set(extra)

# ------------------------------------------------------------------ raid panel
func _build_wave_panel() -> void:
	wave_panel = _panel(root)
	wave_panel.set_anchors_preset(Control.PRESET_CENTER_TOP)
	wave_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	wave_panel.offset_top = 56
	wave_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wave_info = _lbl("", 14)
	wave_info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wave_info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wave_info.custom_minimum_size = Vector2(600, 0)
	wave_panel.add_child(wave_info)

func _update_wave() -> void:
	var w: Dictionary = G.wave
	if w.is_empty():
		return
	if w.state == "prep":
		var plan: Dictionary = w.plan
		var age := Defs.wave_age(w.n)
		wave_label.text = "Raid %d/%d in %s" % [w.n, Defs.VICTORY_WAVE, fmt_time(w.timer)]
		early_btn.visible = true
		early_btn.text = "Start now (+%d)" % int(floor(w.timer * 0.6 * G.mod.early))
		var parts := []
		for k in plan.counts:
			parts.append("%d %s" % [plan.counts[k], Defs.ENEMIES[k].name])
		wave_info.text = "Next raid: %s Armada  -  %s\n%s" % [Defs.AGES[age], ", ".join(parts), Combat.describe_dirs(plan.dirs)]
		var mine := G.th_level() - 1
		if age > mine:
			wave_info.text += "\nWARNING: the raiders are a whole age ahead of you - your weapons will be weak!"
		wave_panel.modulate = Color(1, 1, 1) if age <= mine else Color(1.0, 0.8, 0.75)
	else:
		var left: int = G.combat.enemies_alive() + w.queue.size()
		wave_label.text = "Raid %d: %d raiders left" % [w.current, left]
		early_btn.visible = false
		wave_info.text = "Raid %d in progress  -  %s Armada" % [w.current, Defs.AGES[Defs.wave_age(w.current)]]
		wave_panel.modulate = Color(1.0, 0.85, 0.8)

# ------------------------------------------------------------------ per frame
func _process(dt: float) -> void:
	_acc += dt
	if toast_t > 0.0:
		toast_t -= dt
		toast.modulate.a = clampf(toast_t, 0.0, 1.0)
		toast.visible = toast_t > 0.0
	for n in notes.get_children():
		var t: float = n.get_meta("t", 0.0) - dt
		n.set_meta("t", t)
		n.modulate.a = clampf(t, 0.0, 1.0)
		if t <= 0.0:
			n.queue_free()
	_update_tooltip()
	if _acc < 0.1:
		return
	_acc = 0.0
	var playing: bool = G.mode == "play"
	for c in [build_bar, wave_panel, top_panel, worker_panel]:
		c.visible = playing
	if not playing:
		info.visible = false
		return
	for k in Defs.RES:
		var r: float = G.rates.get(k, 0.0)
		res_labels[k].text = "%d %s" % [int(G.res[k]), ("(%+.0f)" % r) if absf(r) >= 0.5 else ""]
		res_labels[k].add_theme_color_override("font_color", Color(1.0, 0.5, 0.45) if r < -0.5 and G.res[k] < 30 else TXT)
	pop_label.text = "Pop %d / %d" % [G.pop, G.housing]
	age_label.text = "%s age" % Defs.AGES[G.age]
	for i in speed_btns.size():
		speed_btns[i].button_pressed = (i == 0 and G.paused) or (not G.paused and G.speed == i)
	idle_label.text = "Idle citizens: %d" % G.idle
	idle_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.4) if G.idle > 0 else DIM)
	var outs := {"farm": ["food"], "industry": ["wood", "stone", "iron"], "science": ["science"], "military": []}
	for s in Defs.SECTORS:
		var r2: Dictionary = worker_rows[s]
		r2.cnt.text = "%d / %d%s" % [G.assign[s], G.jobs[s], " *" if G.cap[s] >= 0 else ""]
		r2.bar.value = G.staff[s]
		var o := ""
		for k in outs[s]:
			var tot := 0.0
			for b in G.buildings:
				if b.connected and b.working() and b.prod.has(k) and b.type != "hq":
					tot += b.prod[k] * G.staffing_of(b)
			o += "%s%+.0f%s " % ["", tot, k.substr(0, 1).to_upper()]
		if s == "military":
			o = "weapons %d%%" % int((0.3 + 0.7 * G.staff.military) * 100)
		r2.out.text = o
	var tip := ""
	if G.starving:
		tip = "Starving! Move workers to Farming or build farms and docks."
	elif G.idle > 0:
		tip = "%d citizens have no job: build workplaces." % G.idle
	elif G.res.science < 20 and G.rates.science < 8:
		tip = "Science is low. Libraries and scholars keep your age ahead of the raiders."
	elif G.pop >= G.housing:
		tip = "Housing is full: build or upgrade houses to grow."
	else:
		tip = "Shift+click +/- moves 5. A * marks a sector you capped by hand."
	tip_label.text = tip
	_update_cards()
	_update_wave()
	_update_info()
	road_btn.button_pressed = main != null and main.tool_kind == "road"
	doze_btn.button_pressed = main != null and main.tool_kind == "bulldoze"

func _update_tooltip() -> void:
	var txt := ""
	if main and modal_kind == "":
		txt = main.hover_text
	if txt == "":
		tooltip.visible = false
		return
	tooltip.visible = true
	tooltip_label.text = txt
	var mp := root.get_global_mouse_position()
	tooltip.position = mp + Vector2(18, 18)
	var vs := root.get_viewport_rect().size
	if tooltip.position.x + tooltip.size.x > vs.x:
		tooltip.position.x = mp.x - tooltip.size.x - 10
	if tooltip.position.y + tooltip.size.y > vs.y:
		tooltip.position.y = mp.y - tooltip.size.y - 10

# ------------------------------------------------------------------ messages
func _on_message(text: String, kind: String) -> void:
	var col := TXT
	match kind:
		"good": col = Color(0.6, 1.0, 0.6)
		"bad": col = Color(1.0, 0.55, 0.5)
		"alert": col = Color(1.0, 0.8, 0.4)
	var l := _lbl(text, 16, col)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.9))
	l.add_theme_constant_override("shadow_offset_x", 1)
	l.add_theme_constant_override("shadow_offset_y", 2)
	l.set_meta("t", 6.0)
	notes.add_child(l)
	while notes.get_child_count() > 5:
		notes.get_child(0).free()

func _build_toast() -> void:
	toast = _panel(root)
	toast.set_anchors_preset(Control.PRESET_CENTER)
	toast.grow_horizontal = Control.GROW_DIRECTION_BOTH
	toast.grow_vertical = Control.GROW_DIRECTION_BOTH
	toast.offset_top = -220
	toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	toast_label = _lbl("", 17)
	toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.add_child(toast_label)
	toast.visible = false

func _on_wave_end(r: Dictionary) -> void:
	toast_label.text = "Raid %d repelled!\n%d raiders sunk, shot down or slain  -  %d buildings lost\n+%d gold earned (raid bonus %d)" % [r.wave, r.kills, r.lost, r.gold, r.bonus]
	var na := Defs.wave_age(int(r.wave) + 1)
	if na > int(r.age):
		toast_label.text += "\nThe next raid comes from the %s age!" % Defs.AGES[na]
	toast.visible = true
	toast_t = 7.0

# ------------------------------------------------------------------ modals
func modal_open() -> bool:
	return modal_kind != ""

func _modal(kind: String, title: String) -> void:
	for c in modal_box.get_children():
		c.queue_free()
	modal_kind = kind
	modal_dim.visible = true
	modal_panel.visible = true
	if title != "":
		var t := _lbl(title, 26, GOLD)
		t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		modal_box.add_child(t)
	call_deferred("_recenter")

func _recenter() -> void:
	modal_panel.reset_size()
	modal_panel.position = (root.get_viewport_rect().size - modal_panel.size) * 0.5

func close_modal() -> void:
	modal_kind = ""
	modal_dim.visible = false
	modal_panel.visible = false
	for c in modal_box.get_children():
		c.queue_free()
	if story_queue.size():
		var s: Array = story_queue.pop_front()
		show_story(s[0], s[1])

func _text(t: String, w: float = 580.0, size: int = 16) -> Label:
	var l := _lbl(t, size)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(w, 0)
	return l

func show_story(title: String, text: String, button: String = "Continue") -> void:
	if modal_kind != "" and modal_kind != "story_pending":
		story_queue.append([title, text])
		return
	_modal("story", title)
	var sub := _lbl("~ from the Chronicle of Bastion ~", 13, DIM)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	modal_box.add_child(sub)
	modal_box.add_child(_text(text))
	var b := _btn(button, func(): close_modal(), "")
	modal_box.add_child(b)

func show_intro() -> void:
	story_queue.clear()
	var pages: Array = Defs.STORY_INTRO
	for k in range(1, pages.size()):
		story_queue.append(pages[k])
	show_story(pages[0][0], pages[0][1], "Continue")

func show_main_menu(has_save: bool, seed_v: int) -> void:
	_modal("menu", "")
	var t := _lbl("BASTION ISLE", 44, GOLD)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	modal_box.add_child(t)
	var s := _lbl("A city of five ages, and the raiders who follow", 16, DIM)
	s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	modal_box.add_child(s)
	modal_box.add_child(HSeparator.new())
	var nb := _btn("New Game", _close_then.bind("new_game"), "Start on this island")
	nb.custom_minimum_size = Vector2(320, 44)
	modal_box.add_child(nb)
	var cb := _btn("Continue", _close_then.bind("load"), "Load your saved game")
	cb.disabled = not has_save
	cb.custom_minimum_size = Vector2(320, 40)
	modal_box.add_child(cb)
	modal_box.add_child(_btn("Another Island (seed %d)" % seed_v, func(): action.emit("reroll", null), "Generate a different island"))
	modal_box.add_child(_btn("How to Play", func(): show_help(true), ""))
	modal_box.add_child(_btn("Quit", func(): action.emit("quit", null), ""))

func show_pause() -> void:
	_modal("pause", "Paused")
	var msg := _lbl("", 14, DIM)
	modal_box.add_child(_btn("Resume", _close_then.bind("resume"), ""))
	modal_box.add_child(_btn("Save Game (F5)", func(): msg.text = main.do_save(), "Saving is possible between raids"))
	modal_box.add_child(_btn("Load Game (F9)", _close_then.bind("load"), ""))
	modal_box.add_child(_btn("How to Play", func(): show_help(false), ""))
	var snd := _btn("Sound: on" if not main.sfx.muted else "Sound: off", func(): pass, "")
	var on_snd := func():
		main.sfx.muted = not main.sfx.muted
		snd.text = "Sound: on" if not main.sfx.muted else "Sound: off"
	snd.pressed.connect(on_snd)
	modal_box.add_child(snd)
	var gfx := _btn("Graphics: %s" % main.quality_name(), func(): pass, "Toggle the heavier effects (SSIL, SSAO, glow, shadow quality)")
	var on_gfx := func():
		main.cycle_quality()
		gfx.text = "Graphics: %s" % main.quality_name()
	gfx.pressed.connect(on_gfx)
	modal_box.add_child(gfx)
	modal_box.add_child(_btn("Main Menu", _close_then.bind("main_menu"), ""))
	modal_box.add_child(_btn("Quit", func(): action.emit("quit", null), ""))
	modal_box.add_child(msg)

func show_help(back_to_menu: bool) -> void:
	_modal("help", "How to Play")
	modal_box.add_child(_text("""Build a town on the island and defend it from raids that grow more modern every four raids.

- Roads: every building (except walls) needs a road to the Town Hall. Press T or use the Road tool, click and drag.
- Workers: citizens fill open jobs automatically. Use + / - in the Workers panel to shift people between Farming, Industry, Science and Military. Unstaffed weapons fire slowly.
- Ages: upgrade the Town Hall (it costs science) to enter the next age. Every other building can then be upgraded to that age's level, and it changes look, name and strength.
- Raiders: each raid comes from an age. Weapons from an older age than the raiders deal much less damage, so keep science up and upgrade your defences. Aircraft arrive with the Industrial Armada: build Air Defence.
- Walls block landing troops; they must break through. Barracks soldiers hunt landing parties.
- Between raids you can save, or start the raid early for bonus gold.

Controls: WASD / arrows pan, Q / E rotate, mouse wheel zoom, right-drag pan, middle-drag rotate.
Left-click selects or places. R rotates the building you are placing. T road, X bulldoze, U upgrade, L research.
1 / 2 / 3 game speed, Space pause, Esc cancel / menu, F5 save, F9 load, H hides this help.""", 620, 15))
	var on_back := func():
		close_modal()
		if back_to_menu:
			action.emit("main_menu_show", null)
		elif G.mode == "play":
			show_pause()
	modal_box.add_child(_btn("Back", on_back, ""))

func show_research() -> void:
	if G.mode != "play":
		return
	_modal("research", "Research")
	modal_box.add_child(_text("Spend science (and some materials) on lasting improvements. Science also pays for new ages, so choose carefully.", 640, 14))
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	modal_box.add_child(grid)
	for r in Defs.RESEARCH:
		var lvl: int = G.rl(r.id)
		var done := lvl >= int(r.max)
		var cost := Defs.research_cost(r, lvl)
		var prob: String = G.research_problem(r.id)
		var b := Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(330, 62)
		b.text = "%s  %s\n%s" % [r.name, ("(%d/%d)" % [lvl, r.max]) if int(r.max) > 1 else ("(done)" if done else ""), ("Done" if done else cost_short(cost) + ("" if prob == "" or prob == "Not enough resources" else "  - " + prob))]
		b.tooltip_text = r.desc
		b.disabled = prob != ""
		var rid: String = r.id
		b.pressed.connect(_buy_research.bind(rid))
		grid.add_child(b)
	modal_box.add_child(_btn("Close", func(): close_modal(), ""))

func _buy_research(rid: String) -> void:
	var e: String = G.buy_research(rid)
	if e != "":
		G.notify(e, "bad")
	show_research()

func _trade(k: int, buy: bool) -> void:
	var e: String = G.trade(k, buy)
	if e != "":
		G.notify(e, "bad")

func show_market() -> void:
	_modal("market", "Market")
	var ml: int = G.market_level()
	modal_box.add_child(_text("Trade with passing merchants. Better markets get better prices." if ml > 0 else "You need a working market connected by road.", 480, 14))
	for k in G.TRADES.size():
		var t: Dictionary = G.TRADES[k]
		var f := 1.0 - 0.06 * (maxi(ml, 1) - 1)
		var hb := HBoxContainer.new()
		hb.add_child(_lbl("%d %s" % [t.amt, Defs.RES_NAME[t.res]], 15))
		var buy := _btn("Buy for %d gold" % int(ceil(t.buy * f)), _trade.bind(k, true), "")
		var sell := _btn("Sell for %d gold" % int(floor(t.sell / f)), _trade.bind(k, false), "")
		buy.disabled = ml == 0
		sell.disabled = ml == 0
		hb.add_child(buy)
		hb.add_child(sell)
		modal_box.add_child(hb)
	modal_box.add_child(_btn("Close", func(): close_modal(), ""))

func _on_game_over(win: bool) -> void:
	var s: Array = Defs.STORY_WIN if win else Defs.STORY_LOSE
	_modal("over", s[0])
	modal_box.add_child(_text(s[1]))
	modal_box.add_child(_lbl("Raids survived: %d    Raiders defeated: %d    Buildings built: %d    Lost: %d" % [G.stats.waves, G.stats.kills, G.stats.built, G.stats.lost], 14, DIM))
	if win:
		modal_box.add_child(_btn("Keep playing (endless raids)", func(): close_modal(), ""))
	modal_box.add_child(_btn("Main Menu", _close_then.bind("main_menu"), ""))
