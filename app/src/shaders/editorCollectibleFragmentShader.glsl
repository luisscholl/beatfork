uniform sampler2D collectibleTexture;
varying vec2 vertexUV;
varying float vCollectibleType, vZ, vIsSelected;

void main() {
  float isFront = vZ * 8.0 < 0.99 ? 0.0 : 1.0;
  gl_FragColor = texelFetch(collectibleTexture, ivec2(
    clamp(
      (vertexUV.x + vCollectibleType - 1.0) * 16.0, (vCollectibleType - 1.0) * 16.0 + 0.1, vCollectibleType * 16.0 - 0.1
    ),
    clamp(
      (vertexUV.y + isFront + 2.0 * vIsSelected) * 16.0,
      (isFront + 2.0 * vIsSelected) * 16.0 + 0.01,
      (isFront + 1.0 + 2.0 * vIsSelected) * 16.0 - 0.01
    )
  ),
  0);
}