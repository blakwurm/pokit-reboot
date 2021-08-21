#version 300 es

precision mediump float;

in vec2 v_uvCoord;

uniform sampler2D u_image;
uniform vec4 u_trans;

out vec4 pixel;

void main() {
	vec4 test = vec4(255,0,255,255);
	pixel = texture(u_image, v_uvCoord);
	float eps = 0.0001f;
	if((all(greaterThanEqual(pixel,u_trans-eps)) && all(lessThanEqual(pixel, u_trans+eps))) || v_uvCoord.x < 0.0f)
		pixel = vec4(0,0,0,0);
}