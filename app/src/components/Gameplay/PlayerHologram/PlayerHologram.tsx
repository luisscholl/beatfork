import { useTexture } from '@react-three/drei';
import { MeshProps, useLoader } from '@react-three/fiber';
import React, { Ref } from 'react';
import { DoubleSide, Euler, Mesh, TextureLoader, Vector3 } from 'three';
import * as THREE from 'three';
import Vector3D from '../../../models/Vector3D';
// import { Url } from "url";
import './PlayerHologram.scss';

const PlayerHologram = (props: { threeRef: Ref<Mesh>; icon: string }) => {
  const texture = useLoader(TextureLoader, props.icon);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  return (
    <mesh ref={props.threeRef}>
      <planeBufferGeometry attach="geometry" args={[0.25, 0.25]} />
      <meshStandardMaterial
        attach="material"
        transparent
        map={texture}
        side={DoubleSide}
        opacity={0.8}
      />
    </mesh>
  );
};

export default PlayerHologram;
