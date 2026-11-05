// Tracers, laser beams and projectile glows: unshaded additive, colour from INSTANCE_CUSTOM.
shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_never, blend_add;

varying vec4 pc;

void vertex() {
	pc = INSTANCE_CUSTOM;
}

void fragment() {
	ALBEDO = pc.rgb * pc.a * 2.0;
}
