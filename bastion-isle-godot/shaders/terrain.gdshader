// Hex tiles: vertex colour tint modulated by texture detail (grass, sand, rock, cliff), caustics under water.
shader_type spatial;
render_mode cull_back, diffuse_burley;

uniform sampler2D grass_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D sand_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D rock_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D cliff_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D caustics_tex : filter_linear_mipmap, repeat_enable;
uniform float detail = 0.38;

varying vec3 wpos;
varying vec3 wnrm;

vec3 s2l(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

float det(sampler2D t, vec2 uv) {
	float a = lum(texture(t, uv).rgb);
	float m = lum(textureLod(t, uv, 10.0).rgb);
	return a / max(m, 0.05);
}

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wnrm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
}

void fragment() {
	int m = int(UV.x + 0.5);
	vec3 tint = s2l(COLOR.rgb);
	float d = 1.0;
	vec2 top = wpos.xz * 0.32;
	vec2 side = (abs(wnrm.x) > abs(wnrm.z) ? wpos.zy : wpos.xy) * vec2(0.45, 0.6);
	bool up = wnrm.y > 0.6;
	if (m == 0) d = up ? det(grass_tex, top) : det(cliff_tex, side);
	else if (m == 1) d = up ? det(sand_tex, top * 0.8) : det(sand_tex, side);
	else if (m == 2) d = up ? det(rock_tex, top) : det(rock_tex, side);
	else if (m == 3) d = det(cliff_tex, side);
	else d = det(sand_tex, top * 0.6);
	d = clamp(d, 0.4, 1.7);
	vec3 c = tint * mix(1.0, d, detail);
	if (wpos.y < -0.02) {
		float cs = texture(caustics_tex, wpos.xz * 0.22 + vec2(TIME * 0.03, TIME * 0.02)).r;
		float cs2 = texture(caustics_tex, wpos.xz * 0.17 - vec2(TIME * 0.025, -TIME * 0.018)).r;
		float k = smoothstep(-3.0, -0.2, wpos.y);
		c += vec3(0.55, 0.75, 0.7) * min(cs, cs2) * 0.55 * k;
		c *= mix(0.55, 1.0, k);
	}
	ALBEDO = c;
	ROUGHNESS = 0.92;
	SPECULAR = 0.2;
}
