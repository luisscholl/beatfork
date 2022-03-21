import GameObject from "./GameObject";
import Vector3D from "./Vector3D";

export default interface Obstacle extends GameObject {
  dimensions: Vector3D;
  type: "Obstacle";
}
