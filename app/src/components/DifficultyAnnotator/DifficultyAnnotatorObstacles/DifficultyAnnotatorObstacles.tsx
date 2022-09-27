/* eslint-disable react/display-name */
import { ThreeEvent } from '@react-three/fiber';
import React, {
  forwardRef,
  ForwardRefExoticComponent,
  MutableRefObject,
  PropsWithoutRef,
  RefAttributes,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { useRecoilValue } from 'recoil';
import * as THREE from 'three';
import { InstancedMesh } from 'three';
import difficultyAnnotatorObstacleFragmentShader from '../../../shaders/difficultyAnnotatorObstacleFragmentShader.glsl';
import difficultyAnnotatorObstacleVertexShader from '../../../shaders/editorObstacleVertexShader.glsl';
import { settingsState } from '../../../atoms/settingsState';
import Vector3D from '../../../models/Vector3D';
import './DifficultyAnnotatorObstacles.scss';
import Obstacle from '../../../models/Obstacle';

export interface DifficultyAnnotatorObstaclesRefAttributes {
  addObstacle(obstacle: Obstacle): void;
  moveTo(targets: number[], position: Vector3D): void;
  moveBy(targets: number[], distance: Vector3D): void;
  copy(targets: number[], save: boolean): Obstacle[];
  remove(targets: number[]): void;
  export(): Obstacle[];
  configureSnap(bpm: number | false, divider?: 4 | 8 | 16 | 32, tripletDivider?: 1 | 1.5): void;
  snap(targets: number[]): void;
  select(targets: number[]): void;
  deselect(targets: number[]): void;
  getLastIndex(): number;
  resizeBy(
    targets: number[],
    distance: Vector3D,
    corner: 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right',
    reverseZ: boolean
  ): void;
  getDimensions(target: number): Vector3D;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DifficultyAnnotatorObstaclesProps {
  triggerSelectLevelObject: (
    e: ThreeEvent<MouseEvent>,
    i: number,
    type: 'obstacles' | 'obstacles'
  ) => void;
  obstaclesResizeFlag: MutableRefObject<
    null | 'do-not-resize' | 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right'
  >;
  selected: MutableRefObject<number[]>;
}

const tempObject = new THREE.Object3D();
const tempVec = new THREE.Vector3();

const EditorObstacles: ForwardRefExoticComponent<
  PropsWithoutRef<DifficultyAnnotatorObstaclesProps> &
    RefAttributes<DifficultyAnnotatorObstaclesRefAttributes>
> = forwardRef((props, ref) => {
  const settings = useRecoilValue(settingsState);
  const obstacles = useRef<Obstacle[]>([]);
  const meshRef = useRef<InstancedMesh>(null);
  const meshRefCallback = useCallback((node: InstancedMesh) => {
    if (node) {
      meshRef.current = node;
      meshRef.current.count = 0;
    }
  }, []);
  const [maxObstacles, setMaxObstacles] = useState<number>(1024);
  const isSelectedArray = useRef<Float32Array>(Float32Array.from({ length: 1024 }).fill(0));
  const snappingModulus = useRef<number>(undefined);
  const snapBuffer = useRef<number>(0);

  const _addObstacle = (obstacle: Obstacle, pushObstacles = true) => {
    if (pushObstacles) obstacles.current.push(obstacle);
    if (obstacles.current.length > maxObstacles) {
      setMaxObstacles(maxObstacles + 1024);
      const newIsSelectedArray = Float32Array.from({
        length: maxObstacles + 1024
      }).fill(0);
      newIsSelectedArray.set(isSelectedArray.current);
      isSelectedArray.current = newIsSelectedArray;
      return false;
    }
    meshRef.current.count = obstacles.current.length;
    tempObject.position.set(
      obstacle.position.x,
      obstacle.position.y,
      -settings.editorTimeScaleFactor * obstacle.position.z
    );

    tempObject.scale.set(
      obstacle.dimensions.x,
      obstacle.dimensions.y,
      settings.editorTimeScaleFactor * obstacle.dimensions.z
    );
    tempObject.updateMatrix();
    meshRef.current.setMatrixAt(obstacles.current.length - 1, tempObject.matrix);
    meshRef.current.instanceMatrix.needsUpdate = true;
    return true;
  };

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.count = 0;
      for (const obstacle of obstacles.current) {
        if (!_addObstacle(obstacle, false)) break;
      }
    }
  }, [maxObstacles]);

  useImperativeHandle(ref, () => ({
    addObstacle(obstacle: Obstacle): void {
      _addObstacle(obstacle);
    },
    moveTo(targets: number[], position: Vector3D): void {
      for (const target of targets) {
        tempObject.position.set(
          position.x,
          position.y,
          -settings.editorTimeScaleFactor * position.z
        );
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(target, tempObject.matrix);
        obstacles.current[target].position = position;
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    },
    // todo: snapping should probably work differently from collectibles
    moveBy(targets: number[], distance: Vector3D): void {
      if (typeof snappingModulus.current !== 'undefined') {
        distance.z += snapBuffer.current;
        const distanceRemainder = distance.z % snappingModulus.current;
        distance.z -= distanceRemainder;
        snapBuffer.current = distanceRemainder;
      }

      if (!distance.z && !distance.x && !distance.y) return;

      tempVec.set(distance.x, distance.y, -settings.editorTimeScaleFactor * distance.z);
      for (const target of targets) {
        meshRef.current.getMatrixAt(target, tempObject.matrix);
        tempObject.position.setFromMatrixPosition(tempObject.matrix);
        tempObject.position.add(tempVec);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(target, tempObject.matrix);
        obstacles.current[target].position.x += distance.x;
        obstacles.current[target].position.y += distance.y;
        obstacles.current[target].position.z += distance.z;
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    },

    copy(targets: number[], save: boolean): Obstacle[] {
      const selected = [];
      for (const target of targets) {
        const pos = obstacles.current[target].position;
        const dim = obstacles.current[target].dimensions;
        const newCol = {
          type: 'Obstacle',
          position: { x: pos.x, y: pos.y, z: pos.z },
          dimensions: dim,
          measure: 0, // todo
          beat: 0 // todo
        } as Obstacle;

        if (save) {
          _addObstacle(newCol);
        }
        selected.push(newCol);
      }

      return selected;
    },
    // todo: Is this efficient enough?
    remove(targets: number[]): void {
      // Sort targets largest to smallest
      // -> array shifts don't affect unhandled indexes
      targets = targets.sort((a, b) => b - a);
      targets = targets.map((target) => (target < 0 ? meshRef.current.count + target : target));
      for (const target of targets) {
        for (let i = target; i < meshRef.current.count - 1; i += 1) {
          meshRef.current.getMatrixAt(i + 1, tempObject.matrix);
          meshRef.current.setMatrixAt(i, tempObject.matrix);
        }
        obstacles.current.splice(target, 1);
        isSelectedArray.current.set([0], target);
        meshRef.current.count -= 1;
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.geometry.attributes.isSelected.needsUpdate = true;
    },
    export(): Obstacle[] {
      return obstacles.current;
    },
    configureSnap(
      bpm: number | false,
      divider: 4 | 8 | 16 | 32 = 4,
      tripletDivider: 1 | 1.5 = 1
    ): void {
      if (bpm === false) snappingModulus.current = undefined;
      else
        snappingModulus.current = divider
          ? ((60 / (bpm as number)) * 4) / divider / tripletDivider
          : 0;
    },
    snap(targets: number[]): void {
      // todo
    },
    // Will update parent's list of selected.
    // Can select from the end with negative indexes, e.g. select(-1) selects the last element.
    select(targets: number[]): void {
      for (const target of targets) {
        // eslint-disable-next-line no-continue
        if (props.selected.current.includes(target)) continue;
        // todo: If we have isSelectedArray, do we need props.selected?
        if (target < 0) {
          props.selected.current.push(obstacles.current.length + target);
          isSelectedArray.current.set([1], obstacles.current.length + target);
        } else {
          props.selected.current.push(target);
          isSelectedArray.current.set([1], target);
        }
      }
      meshRef.current.geometry.attributes.isSelected.needsUpdate = true;
    },
    // Will update parent's list of selected.
    // Can deselect from the end with negative indexes, e.g. select(-1) deselects the last element.
    deselect(targets: number[]): void {
      props.selected.current = props.selected.current.filter((e) => {
        const keep = !targets.includes(e < 0 ? e - obstacles.current.length : e);
        if (!keep) {
          if (e < 0) {
            isSelectedArray.current.set([0], obstacles.current.length + e);
          } else {
            isSelectedArray.current.set([0], e);
          }
        }
        return keep;
      });
      meshRef.current.geometry.attributes.isSelected.needsUpdate = true;
    },
    getLastIndex(): number {
      return obstacles.current.length - 1;
    },
    getDimensions(target: number): Vector3D {
      return obstacles.current[target].dimensions;
    },
    // todo: snapping
    resizeBy(
      targets: number[],
      distance: Vector3D,
      corner: 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right',
      reverseZ: boolean
    ): void {
      targets.forEach((target) => {
        if (distance.z) {
          if (reverseZ) {
            obstacles.current[target].position.z += distance.z / 2;
          } else {
            obstacles.current[target].dimensions.z += distance.z;
          }
          obstacles.current[target].position.z += distance.z / 2;
        } else {
          obstacles.current[target].position.x += distance.x / 2;
          obstacles.current[target].position.y += distance.y / 2;
          switch (corner) {
            case 'upper-right':
              obstacles.current[target].dimensions.x += distance.x;
              obstacles.current[target].dimensions.y += distance.y;
              break;
            case 'upper-left':
              obstacles.current[target].dimensions.x -= distance.x;
              obstacles.current[target].dimensions.y += distance.y;
              break;
            case 'lower-left':
              obstacles.current[target].dimensions.x -= distance.x;
              obstacles.current[target].dimensions.y -= distance.y;
              break;
            case 'lower-right':
              obstacles.current[target].dimensions.x += distance.x;
              obstacles.current[target].dimensions.y -= distance.y;
              break;
            default:
              break;
          }
        }
        if (obstacles.current[target].dimensions.x < 0.25) {
          obstacles.current[target].dimensions.x = 0.25;
          obstacles.current[target].position.x += distance.x / 2;
        }
        if (obstacles.current[target].dimensions.y < 0.25) {
          obstacles.current[target].dimensions.y = 0.25;
          obstacles.current[target].position.y += distance.y / 2;
        }
        if (obstacles.current[target].dimensions.z < 0.25) {
          obstacles.current[target].dimensions.z = 0.25;
          obstacles.current[target].position.z += distance.z / 2;
        }
        tempObject.position.set(
          obstacles.current[target].position.x,
          obstacles.current[target].position.y,
          -settings.editorTimeScaleFactor * obstacles.current[target].position.z
        );
        tempObject.scale.set(
          obstacles.current[target].dimensions.x,
          obstacles.current[target].dimensions.y,
          settings.editorTimeScaleFactor * obstacles.current[target].dimensions.z
        );
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(target, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }));

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!props.obstaclesResizeFlag) return;
    if (e.face.normal.z !== 1) props.obstaclesResizeFlag.current = 'do-not-resize';
    if (
      e.intersections[0].uv.x < 0.1 / obstacles.current[e.instanceId].dimensions.x &&
      e.intersections[0].uv.y > 1.0 - 0.1 / obstacles.current[e.instanceId].dimensions.y
    )
      props.obstaclesResizeFlag.current = 'upper-left';
    else if (
      e.intersections[0].uv.x > 1.0 - 0.1 / obstacles.current[e.instanceId].dimensions.x &&
      e.intersections[0].uv.y > 1.0 - 0.1 / obstacles.current[e.instanceId].dimensions.y
    )
      props.obstaclesResizeFlag.current = 'upper-right';
    else if (
      e.intersections[0].uv.x < 0.1 / obstacles.current[e.instanceId].dimensions.x &&
      e.intersections[0].uv.y < 0.1 / obstacles.current[e.instanceId].dimensions.y
    )
      props.obstaclesResizeFlag.current = 'lower-left';
    else if (
      e.intersections[0].uv.x > 1.0 - 0.1 / obstacles.current[e.instanceId].dimensions.x &&
      e.intersections[0].uv.y < 0.1 / obstacles.current[e.instanceId].dimensions.y
    )
      props.obstaclesResizeFlag.current = 'lower-right';
    else props.obstaclesResizeFlag.current = 'do-not-resize';
  };

  const shaderData = useMemo(
    () => ({
      vertexShader: difficultyAnnotatorObstacleVertexShader,
      fragmentShader: difficultyAnnotatorObstacleFragmentShader,
      uniforms: {
        obstaclesTexture: {
          value: new THREE.TextureLoader().load('./assets/obstacles.png')
        }
      },
      transparent: true
    }),
    []
  );

  console.log('isSelectedArray.current :>> ', isSelectedArray.current);

  return (
    <group>
      <instancedMesh
        ref={meshRefCallback}
        args={[null, null, maxObstacles]}
        onClick={(e) => {
          e.stopPropagation();
          props.triggerSelectLevelObject(e, e.instanceId, 'obstacles');
        }}
        onPointerDown={onPointerDown}>
        {/**
         * cannot do size per instance using geometry,
         * but can do size per instance using scale per instance
         * -> use cube of width, height, depth of 1 as geometry
         */}
        <boxBufferGeometry args={[1, 1, 1]}>
          <instancedBufferAttribute
            attachObject={['attributes', 'isSelected']}
            args={[isSelectedArray.current, 1]}
          />
        </boxBufferGeometry>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <shaderMaterial attach="material" {...shaderData} />
      </instancedMesh>
    </group>
  );
});

export default EditorObstacles;
