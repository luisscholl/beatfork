attribute float isSelected;
varying vec2 vertexUV;
varying float vIsSelected;
varying vec3 vNormal, vDim; 

#ifdef USE_INSTANCING
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  vertexUV = uv;
  vIsSelected = isSelected;
  vNormal = normal;
  vDim = (instanceMatrix * vec4(1.0, 1.0, 1.0, 1.0) - instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
}
#else
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vertexUV = uv;
  vIsSelected = isSelected;
  vNormal = normal;
}
#endif