import React from 'react';
import * as THREE from 'three';
import Vector3D from '../../../models/Vector3D';
import './GameplayObstacle.scss';

const GameplayObstacle = (props: { position: Vector3D; dimensions: Vector3D }) => {
  return (
    <mesh position={[props.position.x, props.position.y, props.position.z]}>
      <boxGeometry args={[props.dimensions.x, props.dimensions.y, props.dimensions.z]} />
      <meshStandardMaterial side={THREE.DoubleSide} color="#ff0000" />
    </mesh>
  );
};

export default GameplayObstacle;
