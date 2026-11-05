// MultiMesh props (trees, rocks, grass, flowers): vertex colour * per-instance tint (INSTANCE_CUSTOM.rgb),
// wind sway scaled by height; INSTANCE_CUSTOM.a = sway phase.
shader_type spatial;
render_mode cull_disabled, diffuse_burley;

uniform float sway = 0.04;
uniform float roughness = 0.85;

vec3 s2l(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

varying vec3 vcol;

void vertex() {
	vec3 wp = MODEL_MATRIX[3].xyz;
	float ph = INSTANCE_CUSTOM.a * 6.2831 + wp.x * 0.3 + wp.z * 0.2;
	float k = max(VERTEX.y, 0.0);
	VERTEX.x += sin(TIME * 1.6 + ph) * sway * k * k;
	VERTEX.z += cos(TIME * 1.3 + ph * 1.3) * sway * 0.6 * k * k;
	vcol = s2l(COLOR.rgb) * INSTANCE_CUSTOM.rgb;
}

void fragment() {
	ALBEDO = vcol;
	ROUGHNESS = roughness;
	SPECULAR = 0.25;
	BACKLIGHT = vec3(0.12) * vcol;
}
