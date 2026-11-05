// Additive camera-facing glow particles (fire, muzzle flashes, sparks, explosions' cores).
shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_never, blend_add;

varying vec4 pc;

void vertex() {
	pc = INSTANCE_CUSTOM;
	float s = length(MODEL_MATRIX[0].xyz);
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
	MODELVIEW_MATRIX = MODELVIEW_MATRIX * mat4(vec4(s, 0.0, 0.0, 0.0), vec4(0.0, s, 0.0, 0.0), vec4(0.0, 0.0, s, 0.0), vec4(0.0, 0.0, 0.0, 1.0));
}

void fragment() {
	vec2 p = UV * 2.0 - 1.0;
	float r = length(p);
	float a = pow(max(1.0 - r, 0.0), 1.6);
	ALBEDO = pc.rgb * a * pc.a * 2.2;
}
