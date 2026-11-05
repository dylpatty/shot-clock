// Vertex-coloured, flat-shaded models (buildings, units). Per-instance hit flash and tint.
shader_type spatial;
render_mode cull_back, diffuse_burley, specular_schlick_ggx;

instance uniform float flash = 0.0;
instance uniform vec4 tint : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float glow_strength = 0.0;
uniform float roughness = 0.82;

vec3 s2l(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

void fragment() {
	vec3 c = s2l(COLOR.rgb) * tint.rgb;
	ALBEDO = mix(c, vec3(1.0, 0.25, 0.12), flash * 0.55);
	ROUGHNESS = roughness;
	SPECULAR = 0.35;
	EMISSION = c * glow_strength + vec3(1.0, 0.3, 0.1) * flash * 0.6;
}
