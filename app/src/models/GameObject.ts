import Vector3D from './Vector3D';

export default interface GameObject {
  position: Vector3D;
  measure: number;
  beat: number;
}
