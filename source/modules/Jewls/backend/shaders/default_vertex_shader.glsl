#version 300 es

in vec3 a_vertexPosition;
in vec2 a_uvCoord;

uniform float u_priority;
uniform float u_flip_y;
uniform vec2 u_size;
uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;
uniform vec2 u_uvModifier;
uniform vec2 u_uvTranslator;

out vec2 v_uvCoord;

void main() {
	vec2 positionSlice = vec2(a_vertexPosition.x, a_vertexPosition.y);
	vec2 scaledPosition = positionSlice * u_scale;
	vec2 rotatedOrigin = vec2(
		scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
		scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);
	vec2 position = rotatedOrigin + u_translation;
	vec2 zto = position / u_resolution;
	vec2 ztt = zto * 2.0;
	//vec2 clip = ztt - 1.0;

	gl_Position = vec4(ztt * vec2(1, u_flip_y), (a_vertexPosition.z + u_priority) / 100.0, 1);
	v_uvCoord = a_uvCoord * u_uvModifier + u_uvTranslator;
}