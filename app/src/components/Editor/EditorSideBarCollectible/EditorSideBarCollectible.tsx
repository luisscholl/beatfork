import { PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CollectibleType } from '../../../models/Collectible';
import './EditorSideBarCollectible.scss';
import editorCollectibleFragmentShader from '../../../shaders/editorCollectibleFragmentShader.glsl';
import editorCollectibleVertexShader from '../../../shaders/editorCollectibleVertexShader.glsl';

const EditorSideBarCollectible = (props: { type: CollectibleType }) => {
  const shaderData = useMemo(
    () => ({
      fragmentShader: editorCollectibleFragmentShader,
      vertexShader: editorCollectibleVertexShader,
      uniforms: {
        collectibleTexture: {
          value: new THREE.TextureLoader().load('/assets/collectibles.png')
        }
      }
    }),
    []
  );

  return (
    <div className="EditorSideBarCollectible" data-testid="EditorSideBarCollectible">
      <Canvas>
        <mesh position={[0, 0, 0]}>
          <boxBufferGeometry args={[0.25, 0.25, 0.25]} attach="geometry">
            <instancedBufferAttribute
              attachObject={['attributes', 'collectibleType']}
              args={[Float32Array.from([props.type]), 1]}
            />
          </boxBufferGeometry>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <shaderMaterial attach="material" {...shaderData} />
        </mesh>
        <PerspectiveCamera makeDefault position={[0, 0, 0.55]} rotation={[0, 0, 0]} />
        <directionalLight position={[-5, 20, -35]} />
      </Canvas>
      {props.type === CollectibleType.All && <p>Basic Collectible</p>}
      {props.type === CollectibleType.Hands && <p>Hands Collectible</p>}
      {props.type === CollectibleType.Feet && <p>Feet Collectible</p>}
      {props.type === CollectibleType.Left && <p>Left Side Collectible</p>}
      {props.type === CollectibleType.Right && <p>Right Side Collectible</p>}
      {props.type === CollectibleType.LeftHand && <p>Left Hand Collectible</p>}
      {props.type === CollectibleType.RightHand && <p>Right Hand Collectible</p>}
      {props.type === CollectibleType.LeftFoot && <p>Left Foot Collectible</p>}
      {props.type === CollectibleType.RightFoot && <p>Right Foot Collectible</p>}
    </div>
  );
};

export default EditorSideBarCollectible;
