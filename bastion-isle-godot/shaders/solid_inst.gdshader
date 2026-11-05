// Small solid projectiles (cannonballs, arrows, bombs): colour from INSTANCE_CUSTOM.
shader_type spatial;
render_mode cull_back;

varying vec4 pc;

void vertex() {
	pc = INSTANCE_CUSTOM;
}

void fragment() {
	ALBEDO = pc.rgb;
	ROUGHNESS = 0.6;
}
