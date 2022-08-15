import React from 'react';
import Vector3D from '../../models/Vector3D';
import Obstacle from '../Obstacle/Obstacle';
import './GameplayObstacle.scss';

const GameplayObstacle = (props: { position: Vector3D; dimensions: Vector3D }) => {
  return <Obstacle position={props.position} dimensions={props.dimensions} />;
};

export default GameplayObstacle;
