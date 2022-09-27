varying vec2 vertexUV;
varying float vIsSelected;

void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  // vIsSelected == 1.0 results in stripes on object.
  // todo: Research a better way to pass in flags.
  if (vIsSelected > 0.5) { 
    gl_FragColor.a = 1.0;
  } else {
    gl_FragColor.a = 0.5;
  }
}