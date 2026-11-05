// Health bars: billboards, INSTANCE_CUSTOM.r = fill (0..1), .g = kind (0 enemy red, 1 friendly green).
shader_type spatial;
render_mode unshaded, cull_disabled, depth_test_disabled, blend_mix;

varying vec4 pc;

void vertex() {
	pc = INSTANCE_CUSTOM;
	vec3 sc = vec3(length(MODEL_MATRIX[0].xyz), length(MODEL_MATRIX[1].xyz), 1.0);
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
	MODELVIEW_MATRIX = MODELVIEW_MATRIX * mat4(vec4(sc.x, 0.0, 0.0, 0.0), vec4(0.0, sc.y, 0.0, 0.0), vec4(0.0, 0.0, 1.0, 0.0), vec4(0.0, 0.0, 0.0, 1.0));
}

void fragment() {
	vec2 uv = UV;
	float border = step(uv.x, 0.04) + step(0.96, uv.x) + step(uv.y, 0.18) + step(0.82, uv.y);
	vec3 fillc = pc.g > 0.5 ? mix(vec3(0.95, 0.75, 0.15), vec3(0.3, 0.9, 0.35), smoothstep(0.3, 0.6, pc.r)) : vec3(0.95, 0.22, 0.18);
	vec3 c = uv.x < pc.r ? fillc : vec3(0.12, 0.12, 0.14);
	if (border > 0.0) c = vec3(0.05);
	ALBEDO = c;
	ALPHA = 0.9;
}
