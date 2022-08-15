/* eslint-disable react/display-name */
import { Box, RoundedBox } from '@react-three/drei';
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';
import { useRecoilValue } from 'recoil';
import * as THREE from 'three';
import { InstancedMesh, Mesh, Vector3 } from 'three';
import { settingsState } from '../../atoms/settingsState';
import './Ground.scss';

const noBeatIndicators = 20;
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const beatIndicatorsStartColor = tempColor.set('#8ed667').toArray();
const beatIndicatorsEndColor = tempColor.set('#72b54e').toArray();

const Ground = forwardRef(
  (props: { bpm: number; timeScaleFactor: number }, ref: Ref<{ animate: (t: number) => void }>) => {
    const settings = useRecoilValue(settingsState);

    const colorArray = useMemo(
      () =>
        Float32Array.from(
          new Array(noBeatIndicators).fill(null).flatMap((_, i) => beatIndicatorsStartColor)
        ),
      []
    );

    useImperativeHandle(ref, () => ({
      animate(t: number) {
        if (groundMesh.current) {
          groundMesh.current.position.set(0, -5.75, -props.timeScaleFactor * t - 495);
        }
        if (hitPlaneIndicatorMesh.current) {
          hitPlaneIndicatorMesh.current.position.set(0, -0.75, -props.timeScaleFactor * t);
        }
        if (beatIndicatorMesh.current) {
          const tBase = t - (t % (60 / props.bpm));

          for (let i = 0; i < noBeatIndicators; i += 1) {
            tempObject.position.set(
              0,
              -0.75,
              -props.timeScaleFactor * (tBase + (i * 60) / props.bpm)
            );
            const percentage = 1 - (-(t % 1) + (i + 1)) / (noBeatIndicators + 1);
            tempColor
              .setRGB(
                beatIndicatorsStartColor[0] * percentage +
                  beatIndicatorsEndColor[0] * (1 - percentage),
                beatIndicatorsStartColor[1] * percentage +
                  beatIndicatorsEndColor[1] * (1 - percentage),
                beatIndicatorsStartColor[2] * percentage +
                  beatIndicatorsEndColor[2] * (1 - percentage)
              )
              .toArray(colorArray, i * 3);
            tempObject.updateMatrix();
            beatIndicatorMesh.current.setMatrixAt(i, tempObject.matrix);
          }
          beatIndicatorMesh.current.instanceMatrix.needsUpdate = true;
          beatIndicatorMesh.current.geometry.attributes.color.needsUpdate = true;
        }
      }
    }));

    const beatIndicatorMesh = useRef<InstancedMesh>();
    const groundMesh = useRef<Mesh>();
    const hitPlaneIndicatorMesh = useRef<Mesh>();

    return (
      <>
        <Box ref={groundMesh} args={[2, 10, 1000]} receiveShadow>
          <meshStandardMaterial attach="material" color="#72b54e" />
        </Box>
        <Box ref={hitPlaneIndicatorMesh} args={[2, 0.05, 0.05]} receiveShadow>
          <meshStandardMaterial attach="material" color="#ff3639" />
        </Box>
        <instancedMesh ref={beatIndicatorMesh} args={[null, null, noBeatIndicators]} receiveShadow>
          <boxGeometry args={[2, 0.04, 0.02]}>
            <instancedBufferAttribute
              attachObject={['attributes', 'color']}
              args={[colorArray, 3]}
            />
          </boxGeometry>
          <meshStandardMaterial vertexColors={(THREE as any).VertexColors} />
        </instancedMesh>
      </>
    );
  }
);

export default Ground;
