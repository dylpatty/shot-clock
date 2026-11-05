class_name Unit
extends RefCounted
## A moving unit: enemy ships, aircraft and troops, and friendly soldiers and fighters.

var type := ""
var def: Dictionary = {}
var team := "E"
var domain := "ground"
var role := ""
var pos := Vector3.ZERO
var vel := Vector3.ZERO
var yaw := 0.0
var bank := 0.0
var pitch := 0.0
var hp := 1.0
var max_hp := 1.0
var alive := true
var dying := 0.0
var gone := false
var state := "approach"
var path := PackedInt32Array()
var pi := 0
var target = null
var foe = null
var cool := 0.0
var think := 0.0
var phase := 0.0
var ox := 0.0
var oz := 0.0
var wave := 1
var dm := 1.0
var age := 0
var troops := 0
var land_tile := -1
var alt := 0.0
var bombs := 0
var rockets := 0
var passes := 0
var wp := Vector2.ZERO
var exitp := Vector2.ZERO
var gcool := 0.0
var home = null
var slot := 0
var post := Vector2.ZERO
var repath := 0.0
var t := 0.0
var speed := 0.0
var idle_t := 0.0
var stuck_t := 0.0
var block_t := 0.0
var force := false
var egress_t := 0.0
var hit_t := 0.0
var wake_t := 0.0
var trail_t := 0.0
var launch_t := 0.0
var walk := 0.0
var anim := 0.0
var ammo := 0
var node = null

func title() -> String:
	return def.get("name", type)
