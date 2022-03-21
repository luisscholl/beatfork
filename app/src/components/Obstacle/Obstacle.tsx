import React from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import Vector3D from "../../models/Vector3D";
import "./Obstacle.scss";

const Obstacle = (props: {
  position: Vector3D;
  dimensions: Vector3D;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  childRef?: any;
}) => {
  const { x, y, z } = props.position;
  const a = props.dimensions.x;
  const b = props.dimensions.y;
  const c = props.dimensions.z;
  return (
    <mesh position={[x, y, z]} onClick={props.onClick} ref={props.childRef}>
      <boxGeometry args={[a, b, c]} />
      <meshStandardMaterial side={THREE.DoubleSide} color="#ff0000" />
    </mesh>
  );
};

Obstacle.defaultProps = {
  onClick: null,
  childRef: null,
};

export default Obstacle;
