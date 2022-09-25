/* eslint-disable react/display-name */
import React, {
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';
import { useRecoilValue } from 'recoil';
import * as THREE from 'three';
import { InstancedMesh } from 'three';
import gameplayCollectibleFragmentShader from '../../../shaders/gameplayCollectibleFragmentShader.glsl';
import gameplayCollectibleVertexShader from '../../../shaders/gameplayCollectibleVertexShader.glsl';
import { settingsState } from '../../../atoms/settingsState';
import Collectible from '../../../models/Collectible';
import './GameplayCollectibles.scss';

export interface GameplayCollectiblesRefAttributes {
  hide(targets: number[]): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GameplayCollectiblesProps {
  collectibles: Collectible[];
}

const tempObject = new THREE.Object3D();

const GameplayCollectibles: ForwardRefExoticComponent<
  PropsWithoutRef<GameplayCollectiblesProps> & RefAttributes<GameplayCollectiblesRefAttributes>
> = forwardRef((props, ref) => {
  const settings = useRecoilValue(settingsState);
  const meshRef = useRef<InstancedMesh>(null);
  const meshRefCallback = useCallback((node: InstancedMesh) => {
    if (node) {
      meshRef.current = node;
      // Init instancedMesh
      for (let i = 0; i < props.collectibles.length; i += 1) {
        tempObject.position.set(
          props.collectibles[i].position.x,
          props.collectibles[i].position.y,
          -settings.gamePlaytimeScaleFactor * props.collectibles[i].position.z
        );
        tempObject.updateMatrix();
        node.setMatrixAt(i, tempObject.matrix);
      }
      node.instanceMatrix.needsUpdate = true;
    }
  }, []);

  const collectibleTypeArray = useRef<Float32Array>(
    Float32Array.from(props.collectibles.map((collectible) => collectible.collectibleType))
  );

  const shaderData = useMemo(
    () => ({
      vertexShader: gameplayCollectibleVertexShader,
      fragmentShader: gameplayCollectibleFragmentShader,
      uniforms: {
        collectibleTexture: {
          value: new THREE.TextureLoader().load('/assets/collectibles.png')
        }
      }
    }),
    []
  );

  useImperativeHandle(ref, () => ({
    hide(targets: number[]): void {
      targets = targets.map((target) => (target < 0 ? meshRef.current.count + target : target));
      tempObject.position.z = -1000;
      tempObject.updateMatrix();
      for (const target of targets) {
        meshRef.current.setMatrixAt(target, tempObject.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }));

  return (
    <instancedMesh ref={meshRefCallback} args={[null, null, props.collectibles.length]}>
      <boxBufferGeometry args={[0.25, 0.25, 0.25]}>
        <instancedBufferAttribute
          attachObject={['attributes', 'collectibleType']}
          args={[collectibleTypeArray.current, 1]}
        />
      </boxBufferGeometry>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <shaderMaterial attach="material" {...shaderData} />
    </instancedMesh>
  );
});

export default GameplayCollectibles;
