varying vec2 vertexUV;
varying float vIsSelected;
varying vec3 vNormal, vDim;

void main() {
  // todo: make highlighted areas size independent of object size using passed size
  gl_FragColor = 
    (vNormal.z > 0.5 && vIsSelected > 0.5) &&
    ((vertexUV.x < 0.1 / vDim.x &&
      vertexUV.y < 0.1 / vDim.y) ||
    (vertexUV.x > 1.0 - 0.1 / vDim.x &&
      vertexUV.y < 0.1 / vDim.y) ||
    (vertexUV.x > 1.0 - 0.1 / vDim.x &&
      vertexUV.y > 1.0 - 0.1 / vDim.y) ||
    (vertexUV.x < 0.1 / vDim.x &&
      vertexUV.y > 1.0 - 0.1 / vDim.y)) ?
    vec4(1.0, 1.0, 0.0, 1.0) :
    vec4(1.0, 0.0, 0.0, 1.0);
}