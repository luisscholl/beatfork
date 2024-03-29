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
import editorCollectibleFragmentShader from '../../../shaders/difficultyAnnotatorCollectibleFragmentShader.glsl';
import editorCollectibleVertexShader from '../../../shaders/editorCollectibleVertexShader.glsl';
import { settingsState } from '../../../atoms/settingsState';
import Collectible from '../../../models/Collectible';
import Vector3D from '../../../models/Vector3D';
import './DifficultyAnnotatorCollectibles.scss';

export interface DifficultyAnnotatorCollectiblesRefAttributes {
  addCollectible(collectible: Collectible): void;
  moveTo(targets: number[], position: Vector3D): void;
  moveBy(targets: number[], distance: Vector3D): void;
  copy(targets: number[], save: boolean): Collectible[];
  remove(targets: number[]): void;
  export(): Collectible[];
  configureSnap(bpm: number | false, divider?: 4 | 8 | 16 | 32, tripletDivider?: 1 | 1.5): void;
  snap(targets: number[]): void;
  select(targets: number[]): void;
  deselect(targets: number[]): void;
  getLastIndex(): number;
  setSnappingXY(snapTo: 0.0109375 | 0.21875 | 0.4375): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DifficultyAnnotatorCollectiblesProps {
  onClick: (e: ThreeEvent<MouseEvent>, i: number, type: 'collectibles' | 'obstacles') => void;
  selected: MutableRefObject<number[]>;
  snappingModulusXY: number;
}

const tempObject = new THREE.Object3D();
const tempVec = new THREE.Vector3();

const EditorCollectibles: ForwardRefExoticComponent<
  PropsWithoutRef<DifficultyAnnotatorCollectiblesProps> &
    RefAttributes<DifficultyAnnotatorCollectiblesRefAttributes>
> = forwardRef((props, ref) => {
  const settings = useRecoilValue(settingsState);
  const collectibles = useRef<Collectible[]>([]);
  const meshRef = useRef<InstancedMesh>(null);
  const meshRefCallback = useCallback((node: InstancedMesh) => {
    if (node) {
      meshRef.current = node;
      meshRef.current.count = 0;
    }
  }, []);
  const [maxCollectibles, setMaxCollectibles] = useState<number>(1024);
  const collectibleTypeArray = useRef<Float32Array>(Float32Array.from({ length: 1024 }));
  const isSelectedArray = useRef<Float32Array>(Float32Array.from({ length: 1024 }).fill(0));
  const snappingModulusZ = useRef<number>(undefined);
  const snappingModulusXY = useRef<number>(0.21875);

  const snapBufferX = useRef<number>(0);
  const snapBufferY = useRef<number>(0);
  const snapBufferZ = useRef<number>(0);

  const _addCollectible = (collectible: Collectible, pushCollectible = true) => {
    if (pushCollectible) collectibles.current.push(collectible);
    if (collectibles.current.length > maxCollectibles) {
      setMaxCollectibles(maxCollectibles + 1024);
      const newCollectibleTypeArray = Float32Array.from({
        length: maxCollectibles + 1024
      });
      newCollectibleTypeArray.set(collectibleTypeArray.current);
      collectibleTypeArray.current = newCollectibleTypeArray;
      const newIsSelectedArray = Float32Array.from({
        length: maxCollectibles + 1024
      }).fill(0);
      newIsSelectedArray.set(isSelectedArray.current);
      isSelectedArray.current = newIsSelectedArray;
      return false;
    }
    meshRef.current.count = collectibles.current.length;
    tempObject.position.set(
      collectible.position.x,
      collectible.position.y,
      -settings.editorTimeScaleFactor * collectible.position.z
    );
    tempObject.updateMatrix();
    meshRef.current.setMatrixAt(collectibles.current.length - 1, tempObject.matrix);
    collectibleTypeArray.current.set(
      [collectible.collectibleType],
      collectibles.current.length - 1
    );
    meshRef.current.geometry.attributes.collectibleType.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
    return true;
  };

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.count = 0;
      for (const collectible of collectibles.current) {
        if (!_addCollectible(collectible, false)) break;
      }
    }
  }, [maxCollectibles]);

  useImperativeHandle(ref, () => ({
    addCollectible(collectible: Collectible): void {
      _addCollectible(collectible);
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
        collectibles.current[target].position = position;
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    },
    moveBy(targets: number[], distance: Vector3D): void {
      distance.x += snapBufferX.current;
      distance.y += snapBufferY.current;
      const distanceRemainderX = distance.x % snappingModulusXY.current;
      const distanceRemainderY = distance.y % snappingModulusXY.current;
      distance.x -= distanceRemainderX;
      distance.y -= distanceRemainderY;
      snapBufferX.current = distanceRemainderX;
      snapBufferY.current = distanceRemainderY;
      if (typeof snappingModulusZ.current !== 'undefined') {
        distance.z += snapBufferZ.current;
        const distanceRemainderZ = distance.z % snappingModulusZ.current;
        distance.z -= distanceRemainderZ;
        snapBufferZ.current = distanceRemainderZ;
      }

      if (!distance.z && !distance.x && !distance.y) return;

      tempVec.set(distance.x, distance.y, -settings.editorTimeScaleFactor * distance.z);
      for (const target of targets) {
        meshRef.current.getMatrixAt(target, tempObject.matrix);
        tempObject.position.setFromMatrixPosition(tempObject.matrix);
        tempObject.position.add(tempVec);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(target, tempObject.matrix);
        collectibles.current[target].position.x += distance.x;
        collectibles.current[target].position.y += distance.y;
        collectibles.current[target].position.z += distance.z;
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    },

    copy(targets: number[], save: boolean): Collectible[] {
      const selected = [];
      for (const target of targets) {
        const pos = collectibles.current[target].position;
        const newCol = {
          type: 'Collectible',
          collectibleType: collectibles.current[target].collectibleType,
          position: { x: pos.x, y: pos.y, z: pos.z },
          measure: 0, // todo
          beat: 0 // todo
        } as Collectible;

        if (save) {
          _addCollectible(newCol);
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
        collectibleTypeArray.current.set(collectibleTypeArray.current.subarray(target + 1), target);
        collectibles.current.splice(target, 1);
        isSelectedArray.current.set([0], target);
        meshRef.current.count -= 1;
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.geometry.attributes.collectibleType.needsUpdate = true;
      meshRef.current.geometry.attributes.isSelected.needsUpdate = true;
    },
    export(): Collectible[] {
      return collectibles.current;
    },
    configureSnap(
      bpm: number | false,
      divider: 4 | 8 | 16 | 32 = 4,
      tripletDivider: 1 | 1.5 = 1
    ): void {
      if (bpm === false) snappingModulusZ.current = undefined;
      else
        snappingModulusZ.current = divider
          ? ((60 / (bpm as number)) * 4) / divider / tripletDivider
          : 0;
    },
    snap(targets: number[]): void {
      targets = targets.map((target) => (target < 0 ? meshRef.current.count + target : target));
      targets.forEach((target) => {
        if (typeof snappingModulusXY.current !== 'undefined') {
          const remainderX = collectibles.current[target].position.x % snappingModulusXY.current;
          if (snappingModulusXY.current - remainderX > 1e-12) {
            collectibles.current[target].position.x -= remainderX;
          }
          const remainderY = collectibles.current[target].position.y % snappingModulusXY.current;
          if (snappingModulusXY.current - remainderY > 1e-12) {
            collectibles.current[target].position.y -= remainderY;
          }
        }
        if (typeof snappingModulusZ.current !== 'undefined') {
          const remainderZ = collectibles.current[target].position.z % snappingModulusZ.current;
          if (snappingModulusZ.current - remainderZ > 1e-12) {
            collectibles.current[target].position.z -= remainderZ;
          }
        }
        tempObject.position.x = collectibles.current[target].position.x;
        tempObject.position.y = collectibles.current[target].position.y;
        tempObject.position.z =
          -settings.editorTimeScaleFactor * collectibles.current[target].position.z;
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(target, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    },
    // Will update parent's list of selected.
    // Can select from the end with negative indexes, e.g. select(-1) selects the last element.
    select(targets: number[]): void {
      for (const target of targets) {
        // eslint-disable-next-line no-continue
        if (props.selected.current.includes(target)) continue;
        // todo: If we have isSelectedArray, do we need props.selected?
        if (target < 0) {
          props.selected.current.push(collectibles.current.length + target);
          isSelectedArray.current.set([1], collectibles.current.length + target);
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
        const keep = !targets.includes(e < 0 ? e - collectibles.current.length : e);
        if (!keep) {
          if (e < 0) {
            isSelectedArray.current.set([0], collectibles.current.length + e);
          } else {
            isSelectedArray.current.set([0], e);
          }
        }
        return keep;
      });
      meshRef.current.geometry.attributes.isSelected.needsUpdate = true;
    },
    getLastIndex(): number {
      return collectibles.current.length - 1;
    },
    setSnappingXY(snapTo: 0.0109375 | 0.21875 | 0.4375): void {
      snappingModulusXY.current = snapTo;
    }
  }));

  const shaderData = useMemo(
    () => ({
      vertexShader: editorCollectibleVertexShader,
      fragmentShader: editorCollectibleFragmentShader,
      uniforms: {
        collectibleTexture: {
          value: new THREE.TextureLoader().load('/assets/collectibles.png')
        }
      },
      transparent: true
    }),
    []
  );

  return (
    <instancedMesh
      ref={meshRefCallback}
      args={[null, null, maxCollectibles]}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick(e, e.instanceId, 'collectibles');
      }}>
      <boxBufferGeometry args={[0.25, 0.25, 0.25]}>
        <instancedBufferAttribute
          attachObject={['attributes', 'collectibleType']}
          args={[collectibleTypeArray.current, 1]}
        />
        <instancedBufferAttribute
          attachObject={['attributes', 'isSelected']}
          args={[isSelectedArray.current, 1]}
        />
      </boxBufferGeometry>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <shaderMaterial attach="material" {...shaderData} />
    </instancedMesh>
  );
});

export default EditorCollectibles;
