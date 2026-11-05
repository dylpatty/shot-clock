// Sea: gentle waves, depth-based colour (turquoise shallows to deep blue), shoreline foam from the
// depth texture, soft fresnel. Specular kept low so the sun does not glare off the water.
shader_type spatial;
render_mode blend_mix, cull_back, diffuse_burley, specular_schlick_ggx, depth_draw_never;

uniform sampler2D depth_tex : hint_depth_texture, filter_linear_mipmap;
uniform sampler2D normal_tex : hint_normal, filter_linear_mipmap, repeat_enable;
uniform vec3 shallow_col : source_color = vec3(0.30, 0.86, 0.80);
uniform vec3 mid_col : source_color = vec3(0.09, 0.56, 0.72);
uniform vec3 deep_col : source_color = vec3(0.04, 0.24, 0.48);
uniform vec3 foam_col : source_color = vec3(0.96, 0.99, 1.0);
uniform vec3 sky_col : source_color = vec3(0.62, 0.80, 0.95);

varying vec3 wpos;

float wave(vec2 p, float t) {
	return sin(p.x * 0.35 + t * 1.1) * 0.035 + sin(p.y * 0.42 - t * 0.9) * 0.03 + sin((p.x + p.y) * 0.9 + t * 1.7) * 0.012;
}

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	VERTEX.y += wave(wpos.xz, TIME);
}

void fragment() {
	float raw = texture(depth_tex, SCREEN_UV).r;
	vec4 vp = INV_PROJECTION_MATRIX * vec4(SCREEN_UV * 2.0 - 1.0, raw, 1.0);
	vp.xyz /= vp.w;
	float scene_d = -vp.z;
	float water_d = -VERTEX.z;
	// convert the view-ray depth difference to an approximate vertical depth
	vec3 vdir = normalize(VERTEX);
	float dview = max(scene_d - water_d, 0.0);
	float d = dview * abs(dot(vdir, (VIEW_MATRIX * vec4(0.0, 1.0, 0.0, 0.0)).xyz));

	vec2 uv1 = wpos.xz * 0.06 + vec2(TIME * 0.012, TIME * 0.008);
	vec2 uv2 = wpos.xz * 0.11 - vec2(TIME * 0.009, -TIME * 0.014);
	vec3 n1 = texture(normal_tex, uv1).rgb;
	vec3 n2 = texture(normal_tex, uv2).rgb;
	NORMAL_MAP = normalize(mix(n1, n2, 0.5));
	NORMAL_MAP_DEPTH = 0.35;

	float k1 = 1.0 - exp(-d * 1.6);
	float k2 = 1.0 - exp(-d * 0.45);
	vec3 col = mix(shallow_col, mid_col, k1);
	col = mix(col, deep_col, k2);

	float noise = texture(normal_tex, wpos.xz * 0.21 + vec2(TIME * 0.02, TIME * 0.015)).r;
	float band = 1.0 - smoothstep(0.0, 0.32, d);
	float lines = smoothstep(0.7, 1.0, sin(d * 16.0 - TIME * 2.0 + noise * 5.0)) * (1.0 - smoothstep(0.05, 0.55, d));
	float foam = clamp(smoothstep(0.55, 0.9, band + noise * 0.35) + lines * 0.55, 0.0, 1.0);

	float fr = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 5.0);
	col = mix(col, sky_col, fr * 0.25);
	col = mix(col, foam_col, foam);

	ALBEDO = col;
	ALPHA = clamp(mix(0.55, 0.97, k2) + foam, 0.0, 1.0);
	ROUGHNESS = mix(0.28, 0.9, foam);
	SPECULAR = 0.12;
	METALLIC = 0.0;
}
