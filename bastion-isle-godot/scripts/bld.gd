class_name Bld
extends RefCounted
## A placed building.

var id := 0
var type := ""
var def: Dictionary = {}
var tile := -1
var pos := Vector3.ZERO
var level := 1
var rot := 0
var hp := 100.0
var max_hp := 100.0
var alive := true
var connected := false
var build_left := 0.0      # seconds of construction left (0 = working)
var build_total := 1.0
var upgrading := false
var head_yaw := 0.0
var cool := 0.0
var scan := 0.0
var target = null
var flash := 0.0
var last_hit := -99.0
var kills := 0
var prod: Dictionary = {}
var ws: Dictionary = {}
var units: Array = []
var train_t := 0.0
var market_boost := 1.0
var burn_t := 0.0
var respawn: Array = []
var next_launch := 0.0
var smoke_t := 0.0
var node = null

func lv() -> Dictionary:
	return def.levels[level - 1]

func yaw() -> float:
	return PI / 6.0 + rot * PI / 3.0

func age() -> int:
	return Defs.level_age(type, level)

func title() -> String:
	return "%s (Lv %d)" % [lv().name, level]

func working() -> bool:
	return alive and build_left <= 0.0
