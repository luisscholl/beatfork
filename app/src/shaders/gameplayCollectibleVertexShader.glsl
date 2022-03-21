uniform sampler2D collectibleTexture;
attribute float collectibleType;
varying vec2 vertexUV;
varying float vCollectibleType, vZ;

// #ifdef USE_INSTANCING
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  vertexUV = uv;
  vCollectibleType = collectibleType;
  vZ = position.z;
}
// #endif