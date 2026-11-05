// Placement preview: translucent, tinted green (valid) or red (blocked), with a pulsing rim.
shader_type spatial;
render_mode unshaded, cull_back, blend_mix, depth_draw_opaque;

uniform vec4 col : source_color = vec4(0.4, 1.0, 0.5, 0.5);

void fragment() {
	float rim = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 2.0);
	ALBEDO = col.rgb * (0.6 + 0.6 * rim) * (0.85 + 0.15 * sin(TIME * 5.0));
	ALPHA = col.a * (0.55 + 0.45 * rim);
}
