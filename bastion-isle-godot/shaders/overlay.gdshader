// Flat overlays on the ground: selection rings, range circles, raid direction arrows.
shader_type spatial;
render_mode unshaded, cull_disabled, blend_mix, depth_draw_never, depth_test_disabled;

uniform vec4 col : source_color = vec4(1.0, 1.0, 1.0, 0.6);
uniform float pulse = 0.0;

void fragment() {
	ALBEDO = col.rgb;
	ALPHA = col.a * (1.0 - pulse * 0.4 + pulse * 0.4 * sin(TIME * 6.0));
}
