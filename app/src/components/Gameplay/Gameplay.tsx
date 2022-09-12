/* eslint-disable react/jsx-props-no-spreading */
import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  useCallback
} from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useThree, useLoader, MeshProps } from '@react-three/fiber';
import {
  Pose,
  POSE_CONNECTIONS,
  POSE_LANDMARKS_LEFT,
  POSE_LANDMARKS_NEUTRAL,
  POSE_LANDMARKS_RIGHT
} from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import './Gameplay.scss';
import { PerspectiveCamera, useTexture } from '@react-three/drei';
import { Vector2, Vector3, TextureLoader, Mesh, InstancedMesh } from 'three';
import * as THREE from 'three';
// import CSS from "csstype";
import {
  // eslint-disable-next-line camelcase
  useRecoilBridgeAcrossReactRoots_UNSTABLE,
  useRecoilValue,
  useRecoilState
} from 'recoil';
import { Howl } from 'howler';
import { useNavigate, useParams } from 'react-router-dom';
import Level from '../../models/Level';
import Obstacle from '../../models/Obstacle';
import Collectible, { CollectibleType } from '../../models/Collectible';
import GameplayObstacle from '../GameplayObstacle/GameplayObstacle';
import Ground from '../Ground/Ground';
import ProgressIndicator from '../ProgressIndicator/ProgressIndicator';
import HealthBar from '../HealthBar/HealthBar';
import Score from '../Score/Score';
import PlayerHologram from '../PlayerHologram/PlayerHologram';
import { settingsState } from '../../atoms/settingsState';
import LandmarkDebugCanvas from '../LandmarkDebugCanvas/LandmarkDebugCanvas';
import GameplayCollectibles, {
  GameplayCollectiblesRefAttributes
} from '../GameplayCollectibles/GameplayCollectibles';
import { viewState } from '../../atoms/viewState';
import { LevelService } from '../../services/LevelService';

const leftHandThreeURL = '/assets/hand_left.png';
const rightHandThreeURL = '/assets/hand_right.png';
const leftFootThreeURL = '/assets/foot_left.png';
const rightFootThreeURL = '/assets/foot_right.png';
const collectibleAudio = new Howl({ src: ['/sounds/collectibleHit.mp3'] });
const hologramRadius = 0.125;
const collectibleMeasure = 0.25;

const Gameplay = (props: { debug: boolean }) => {
  const { levelId, versionId } = useParams();
  const navigate = useNavigate();

  const settings = useRecoilValue(settingsState);
  const RecoildBridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

  const music = useRef<Howl>();
  const captureVideo = useRef<HTMLVideoElement>();
  const gameplayWrapper = useRef<HTMLDivElement>();
  const gameplayCollectibles = useRef<GameplayCollectiblesRefAttributes>(null);
  const [mediaPipeReady, setMediaPipeReady] = useState<boolean>(false);
  const mediaPipeCamera = useRef<Camera>();
  // MatrixCalibration Variables:
  let leftBorder = Number.MAX_SAFE_INTEGER;
  let rightBorder = 0;
  let topBorder = Number.MAX_SAFE_INTEGER;
  let bottomBorder = 0;
  const recordedAngle: number[] = [];
  const leftHand = useRef<{
    x: number;
    y: number;
    z: number;
    rotation: number;
  }>({
    x: 0,
    y: 0,
    z: 1,
    rotation: 0
  });
  const rightHand = useRef<{
    x: number;
    y: number;
    z: number;
    rotation: number;
  }>({
    x: 0,
    y: 0,
    z: 1,
    rotation: 0
  });
  const leftFoot = useRef<{
    x: number;
    y: number;
    z: number;
    rotation: number;
  }>({
    x: 0,
    y: 0,
    z: 1,
    rotation: 0
  });
  const rightFoot = useRef<{
    x: number;
    y: number;
    z: number;
    rotation: number;
  }>({
    x: 0,
    y: 0,
    z: 1,
    rotation: 0
  });
  const leftHandHologramRef = useRef<Mesh>();
  const rightHandHologramRef = useRef<Mesh>();
  const leftFootHologramRef = useRef<Mesh>();
  const rightFootHologramRef = useRef<Mesh>();
  const calibrationMatrix = useRef<[number]>();
  const [calibrationStep, setCalibrationStep] = useState<1 | 2>(1);
  const [view, setView] = useRecoilState(viewState); // do we still need this?

  const [level, setLevel] = useState<Level>();

  function detectedPose(results: any) {
    if (!results.poseLandmarks) return;
    setMediaPipeReady(true);
    /**
     * Calculates the angles between two landmarks which are represented as position vectors.
     * @param {2-tuple} point1        Elbow/Knee
     * @param {2-tuple} point2        Wrist/Ankle
     *
     * @return {number} Returns the angle in radians
     */
    function calculateAngleBetweenTwoPoints(point1: any, point2: any) {
      const joint1 = new Vector2(point1.x, point1.y); // Ref line 51
      const joint2 = new Vector2(point2.x, point2.y); // Ref line 52

      // See https://threejs.org/docs/#api/en/math/Vector2
      const link = joint2.sub(joint1);

      return -Math.atan2(link.x, link.y) + Math.PI;
      // Short: return -Math.atan2(point2.y - point1.y, point2.x - point1.x) + Math.PI
    }
    function getMatrix() {
      // Left Wrist
      const p15X = results.poseLandmarks[15].x;
      const p15Y = results.poseLandmarks[15].y;
      const p15Z = results.poseLandmarks[15].z;
      const p15x = p15X * 1;
      const p15y = p15Y * 1;
      const leftWristPoint: [number, number, any] = [p15x, p15y, p15Z];
      if (leftWristPoint[0] > rightBorder) {
        // eslint-disable-next-line prefer-destructuring
        rightBorder = leftWristPoint[0];
      }
      // Right Wrist
      const p16X = results.poseLandmarks[16].x;
      const p16Y = results.poseLandmarks[16].y;
      const p16Z = results.poseLandmarks[16].z;
      const p16x = p16X * 1;
      const p16y = p16Y * 1;
      const rightWristPoint: [number, number, any] = [p16x, p16y, p16Z];
      if (rightWristPoint[0] < leftBorder) {
        // eslint-disable-next-line prefer-destructuring
        leftBorder = rightWristPoint[0];
      }
      const top = (rightWristPoint[1] + leftWristPoint[1]) / 2;
      if (top < topBorder) {
        topBorder = top;
      }
      const armsVector: [number, number, any] = [
        leftWristPoint[0] - rightWristPoint[0],
        leftWristPoint[1] - rightWristPoint[1],
        leftWristPoint[2] - rightWristPoint[2]
      ];
      const ArmsAngle = Math.round(Math.atan2(armsVector[1], armsVector[0]));
      recordedAngle.push(ArmsAngle);
      const ankleY = results.poseLandmarks[28].y * 1;
      if (ankleY > bottomBorder) {
        bottomBorder = ankleY;
      }
      // Calculate n and f for perspective transformation
      const n = (1 * 0.5 * (topBorder + bottomBorder)) / Math.tan(Math.max(...recordedAngle));
      const f = n + (rightBorder - leftBorder);
      // Now we can calculate the perspective Transformation matrix
      const matrixTransl: number[][] = [
        [1, 0, n - leftBorder], // -1 or - leftBorder
        [0, 1, -0.5 * (topBorder + bottomBorder)],
        [0, 0, 1]
      ];
      const matrixRot: number[][] = [
        [0, 1, 0],
        [-1, 0, 0],
        [0, 0, 1]
      ];
      const matrixPersp: number[][] = [
        [1, 0, 0],
        [0, 1 + f / n, f],
        [0, 1 / -n, 0]
      ];
      const matrixRotInv: number[][] = [
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, 1]
      ];
      const matrixTranslInv: number[][] = [
        [1, 0, -(n - leftBorder)],
        [0, 1, 0.5 * (topBorder + bottomBorder)],
        [0, 0, 1]
      ];
      const matrix: number[][] = multiplyMatrices(
        matrixTranslInv,
        multiplyMatrices(
          matrixRotInv,
          multiplyMatrices(matrixPersp, multiplyMatrices(matrixTransl, matrixRot))
        )
      );
      return matrix;
    }
    function multiplyMatrices(a: number[][], b: number[][]) {
      const aNumRows = a.length;
      const aNumCols = a[0].length;
      const bNumRows = b.length;
      const bNumCols = b[0].length;
      const m = new Array(aNumRows); // initialize array of rows
      // eslint-disable-next-line no-plusplus
      for (let r = 0; r < aNumRows; ++r) {
        m[r] = new Array(bNumCols); // initialize the current row
        // eslint-disable-next-line no-plusplus
        for (let c = 0; c < bNumCols; ++c) {
          m[r][c] = 0; // initialize the current cell
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < aNumCols; ++i) {
            m[r][c] += a[r][i] * b[i][c];
          }
        }
      }
      return m;
    }
    const matrix15 = multiplyMatrices(
      [[results.results.poseLandmarks[15].x], [results.poseLandmarks[15].y], [1]],
      getMatrix()
    );
    const matrix16 = multiplyMatrices(
      [[results.results.poseLandmarks[16].x], [results.poseLandmarks[16].y], [1]],
      getMatrix()
    );
    const matrix27 = multiplyMatrices(
      [[results.results.poseLandmarks[27].x], [results.poseLandmarks[27].y], [1]],
      getMatrix()
    );
    const matrix28 = multiplyMatrices(
      [[results.results.poseLandmarks[28].x], [results.poseLandmarks[28].y], [1]],
      getMatrix()
    );
    // Calculate and set position and rotation of holograms
    leftHand.current = {
      x: matrix15[0] * settings.hologramScale, // Rescaling @ calculateHologramTransform
      y: matrix15[1] * settings.hologramScale, // Rescaling @ calculateHologramTransform
      z: 1,
      rotation: calculateAngleBetweenTwoPoints(results.poseLandmarks[13], results.poseLandmarks[15])
    };
    leftHandHologramRef.current.position.set(leftHand.current.x, leftHand.current.y, -1);
    // leftHandHologramRef.current.rotation.set(0, 0, leftHand.current.rotation);
    rightHand.current = {
      x: matrix16[0] * settings.hologramScale, // Rescaling @ calculateHologramTransform
      y: matrix16[0] * settings.hologramScale, // Rescaling @ calculateHologramTransform
      z: 1,
      rotation: calculateAngleBetweenTwoPoints(results.poseLandmarks[14], results.poseLandmarks[16])
    };
    rightHandHologramRef.current.position.set(rightHand.current.x, rightHand.current.y, -1);
    // rightHandHologramRef.current.rotation.set(0, 0, rightHand.current.rotation);
    leftFoot.current = {
      x: matrix27[0] * settings.hologramScale, // Rescaling @ calculateHologramTransform
      y: matrix27[1] * settings.hologramScale, // Rescaling @ calculateHologramTransform
      z: 1,
      rotation:
        calculateAngleBetweenTwoPoints(results.poseLandmarks[25], results.poseLandmarks[27]) +
        Math.PI
    };
    leftFootHologramRef.current.position.set(leftFoot.current.x, leftFoot.current.y, -1);
    // leftFootHologramRef.current.rotation.set(0, 0, leftFoot.current.rotation);
    rightFoot.current = {
      x: matrix28[0] * settings.hologramScale, // Rescaling @ calculateHologramTransform
      y: matrix28[1] * settings.hologramScale, // Rescaling @ calculateHologramTransform
      z: 1,
      rotation:
        calculateAngleBetweenTwoPoints(results.poseLandmarks[26], results.poseLandmarks[28]) +
        Math.PI
    };
    rightFootHologramRef.current.position.set(rightFoot.current.x, rightFoot.current.y, -1);
    // rightFootHologramRef.current.rotation.set(0, 0, rightFoot.current.rotation);

    if (landmarkDebugCanvas.current) landmarkDebugCanvas.current.draw(results);
  }

  const pose = useMemo(
    () =>
      new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      }),
    []
  );
  pose.setOptions({
    modelComplexity: 0,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  pose.onResults(detectedPose);

  // todo: only fetch version
  useEffect(() => {
    setView((old) => {
      return {
        ...old,
        level: {
          ...old.level,
          id: levelId
        },
        version: versionId
      };
    });
    LevelService.getLevel(levelId, versionId).then((result) => {
      setView((old) => {
        return {
          ...old,
          level: result
        };
      });
      setLevel(result);
    });
  }, [levelId, versionId]);

  useEffect(() => {
    if (!level) return null;
    if (!process.env.REACT_APP_VIDEO_SOURCE) {
      mediaPipeCamera.current =
        captureVideo.current &&
        new Camera(captureVideo.current, {
          onFrame: async () => {
            await pose.send({
              image: captureVideo.current as unknown as HTMLVideoElement
            });
          },
          width: settings.mediaPipeResolution,
          height: settings.mediaPipeResolution
        });
      if (mediaPipeCamera.current) mediaPipeCamera.current.start();
    } else if (captureVideo.current) {
      let animationFrameId: number;
      const debugAnimate = async () => {
        if (
          captureVideo.current.currentTime > 0 &&
          !captureVideo.current.paused &&
          !captureVideo.current.ended
        ) {
          await pose.send({
            image: captureVideo.current as unknown as HTMLVideoElement
          });
        }
        animationFrameId = requestAnimationFrame(debugAnimate);
      };
      debugAnimate();
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }
    return undefined;
  }, [level, captureVideo, pose]);

  // Level Playback Logic
  useEffect(() => {
    if (!level) return;
    clippedObjectsThree.current = [];
    for (const obstacle of obstacles) {
      clippedObjectsThree.current.push(
        <GameplayObstacle
          key={clippingIndex.current}
          position={{
            x: obstacle.position.x,
            y: obstacle.position.y,
            z: -obstacle.position.z * settings.gamePlaytimeScaleFactor
          }}
          dimensions={{
            x: obstacle.dimensions.x,
            y: obstacle.dimensions.y,
            z: -obstacle.dimensions.z * settings.gamePlaytimeScaleFactor
          }}
        />
      );
    }
    setClippedObjectsThreeAsState([...clippedObjectsThree.current]);
  }, [level]);

  const collectibles: Array<Collectible & { pristine: boolean }> = useMemo(() => {
    if (!level) return null;
    return level.versions[versionId].objects
      .filter((e: Collectible | Obstacle) => e.type === 'Collectible')
      .map((e) => {
        return {
          ...e,
          pristine: true
        };
      }) as Array<Collectible & { pristine: boolean }>;
  }, [level]);

  const obstacles: Array<Obstacle & { pristine: boolean }> = useMemo(() => {
    if (!level) return null;
    return level.versions[versionId].objects
      .filter((e: Collectible | Obstacle) => e.type === 'Obstacle')
      .map((e) => {
        return {
          ...e,
          pristine: true
        };
      }) as Array<Obstacle & { pristine: boolean }>;
  }, [level]);

  const t0 = useRef<number>();
  const tLast = useRef<number>();
  const animationFrameRequest = useRef<number>();
  const physicsIntervalId = useRef<number>();
  const clippingIndex = useRef<number>(1);
  const clippedObjectsThree = useRef<Array<ReactElement<any>>>([]);

  const [clippedObjectsThreeAsState, setClippedObjectsThreeAsState] = useState<
    Array<ReactElement<any>>
  >([]);

  useEffect(() => {
    if (!level) return;
    if (level.versions[versionId].objects[0].type === 'Obstacle') {
      clippedObjectsThree.current.push(
        <GameplayObstacle
          key={0}
          position={{
            x: level.versions[versionId].objects[0].position.x,
            y: level.versions[versionId].objects[0].position.y,
            z: -level.versions[versionId].objects[0].position.z * settings.gamePlaytimeScaleFactor
          }}
          dimensions={{
            x: (level.versions[versionId].objects[0] as Obstacle).dimensions.x,
            y: (level.versions[versionId].objects[0] as Obstacle).dimensions.y,
            z:
              -(level.versions[versionId].objects[0] as Obstacle).dimensions.z *
              settings.gamePlaytimeScaleFactor
          }}
        />
      );
    }
  }, [level]);
  const camera = useRef<THREE.PerspectiveCamera>();
  // todo: If we have a lot of time, figure out how to do the types correctly.
  const ground = useRef<typeof Ground & { animate: (t: number) => void }>(null);
  const progressIndicator = useRef<typeof ProgressIndicator & { animate: (t: number) => void }>(
    null
  );
  const landmarkDebugCanvas = useRef<typeof LandmarkDebugCanvas & { draw: (results: any) => void }>(
    null
  );
  const pointsByCollectible = 100;
  // Scoring Variables
  // todo: Determine whether it should be replaced with useRef -> Probably yes, because physics function is recreated on change
  const [score, setScore] = useState<number>(0);
  // todo: Determine whether it should be replaced with useRef -> Probably yes, because physics function is recreated on change
  const [currentMultiplier, setMultiplier] = useState<number>(1);
  const [health, setHealth] = useState<number>(100);
  let comboCounter = 0;
  let currMultiplier = 1;
  let currHealth = 100;

  useEffect(() => {
    if (!level) return null;
    if (!music.current) return null;
    const musicEndedHandler = () => {
      setView((old: any) => {
        return {
          ...old,
          score
        };
      });
      navigate('/level-completed');
    };
    music.current.once('end', musicEndedHandler);
    return () => {
      music.current.off();
    };
  }, [level, mediaPipeReady, score]);

  useEffect(() => {
    if (health > 0) return;
    if (typeof animationFrameRequest.current === 'number')
      cancelAnimationFrame(animationFrameRequest.current);
    if (typeof physicsIntervalId.current === 'number') clearInterval(physicsIntervalId.current);
    music.current.pause();
    navigate('/game-over');
  }, [health]);

  useEffect(() => {
    if (!level) return null;
    if (!mediaPipeReady) return null;
    for (const audio of level.audioLinks) {
      if (audio.startsWith('/')) {
        music.current = new Howl({ src: audio });
        break;
      }
    }
    if (!music.current) alert('Audio could not be loaded.'); // todo
    music.current.play();
    t0.current = 0;
    tLast.current = t0.current;
    animationFrameRequest.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRequest.current) cancelAnimationFrame(animationFrameRequest.current);
    };
  }, [level, mediaPipeReady]);

  useEffect(() => {
    physicsIntervalId.current = window.setInterval(physics, 1000 / 60);
    return () => {
      if (physicsIntervalId.current) clearInterval(physicsIntervalId.current as any);
    };
  }, [level, score, currentMultiplier, health]);

  const animate = () => {
    // Player holograms are rendered when MediaPipe has detected a new position, because rendering here would be wasted CPU time.
    animationFrameRequest.current = requestAnimationFrame(animate);
    const tCurrent = music.current.seek();
    const tSince0 = tCurrent - (t0.current as number);
    ground.current?.animate(tSince0);
    progressIndicator.current?.animate(tSince0);
    camera.current.position.setZ(-settings.gamePlaytimeScaleFactor * tSince0 + 2);
  };

  // Checks if there is an intersection between a circle and a rectangle and returns true or false
  const isColliding = (
    hologramPosition: { x: number; y: number; rotation: number },
    levelObject: (Collectible & { pristine: boolean }) | Obstacle
  ) => {
    const circleDistanceX = Math.abs(hologramPosition.x - levelObject.position.x);
    const circleDistanceY = Math.abs(hologramPosition.y - levelObject.position.y);
    const width =
      levelObject.type === 'Collectible' ? collectibleMeasure : levelObject.dimensions.x;
    const height =
      levelObject.type === 'Collectible' ? collectibleMeasure : levelObject.dimensions.y;

    if (
      circleDistanceX > hologramRadius + width / 2 ||
      circleDistanceY > hologramRadius + height / 2
    )
      return false;

    if (
      (circleDistanceX <= width / 2 || circleDistanceY <= height / 2) &&
      (levelObject.type === 'Obstacle' || levelObject.pristine)
    )
      return true;

    return (
      (circleDistanceX - width / 2) ** 2 + (circleDistanceY - height / 2) ** 2 <=
        hologramRadius ** 2 &&
      (levelObject.type === 'Obstacle' || levelObject.pristine)
    );
  };

  const firstPhysicsRelevantCollectible = useRef<number>(0);

  // todo: Use line from last frame to current frame for intersection instead of position on current frame for increased hit detection reliability.
  const physics = () => {
    if (!level) return;
    if (!music.current) return;
    const tCurrent = music.current.seek();
    const tDelta = (tLast.current as number) - tCurrent;
    const tSince0 = tCurrent - (t0.current as number);
    tLast.current = tCurrent;

    // For every rendered cube that is near the area where collection is possible, check if there is an collision with the relevant hand/foot hologram. In that case, remove cube.
    // todo: Check for early loop termination
    for (let i = firstPhysicsRelevantCollectible.current; i < collectibles.length; i += 1) {
      // levelObjects is sorted by z-distance. If an object is behind the player, there is no chance for the player to hit it anymore. Thus it can be skipped from now on.
      // todo: Is -0.15 ok? Find a good constant for it.
      if (collectibles[i].position.z - tSince0 < -0.125) {
        if (collectibles[i].pristine) {
          // Reset Multiplier and Combo value
          currMultiplier = 1;
          setMultiplier(currMultiplier);
          comboCounter = 0;
          // Decrease Health
          currHealth = health - 10;
          setHealth(currHealth);
        }

        firstPhysicsRelevantCollectible.current = i + 1;
        // eslint-disable-next-line no-continue
        continue;
      }

      if (Math.abs(collectibles[i].position.z - tSince0) < 0.125) {
        let collisionDetected = false;
        switch (collectibles[i].collectibleType) {
          case CollectibleType.LeftHand:
            collisionDetected = isColliding(leftHand.current, collectibles[i]);
            break;
          case CollectibleType.RightHand:
            collisionDetected = isColliding(rightHand.current, collectibles[i]);
            break;
          case CollectibleType.LeftFoot:
            collisionDetected = isColliding(leftFoot.current, collectibles[i]);
            break;
          case CollectibleType.RightFoot:
            collisionDetected = isColliding(rightFoot.current, collectibles[i]);
            break;
          case CollectibleType.Hands:
            collisionDetected =
              isColliding(leftHand.current, collectibles[i]) ||
              isColliding(rightHand.current, collectibles[i]);
            break;
          case CollectibleType.Feet:
            collisionDetected =
              isColliding(leftFoot.current, collectibles[i]) ||
              isColliding(rightFoot.current, collectibles[i]);
            break;
          case CollectibleType.Left:
            collisionDetected =
              isColliding(leftHand.current, collectibles[i]) ||
              isColliding(leftFoot.current, collectibles[i]);
            break;
          case CollectibleType.Right:
            collisionDetected =
              isColliding(rightHand.current, collectibles[i]) ||
              isColliding(rightFoot.current, collectibles[i]);
            break;
          case CollectibleType.All:
            collisionDetected =
              isColliding(leftHand.current, collectibles[i]) ||
              isColliding(rightHand.current, collectibles[i]) ||
              isColliding(leftFoot.current, collectibles[i]) ||
              isColliding(rightFoot.current, collectibles[i]);
            break;
          default:
            break;
        }

        if (collisionDetected) {
          // Play Sound Effect
          // todo
          collectibleAudio.play();
          // Increase Combo when Collectible is hit.
          comboCounter += 1;
          // Increase Multiplier, if x Collectibles are hit in a row.
          currMultiplier = currentMultiplier === 8 ? 8 : currentMultiplier * 2;
          setMultiplier(currMultiplier);
          comboCounter = 0;
          // Increase Score when Collectible is hit
          const currScore = score + pointsByCollectible * currMultiplier;
          setScore(currScore);
          // Increase Health when Collectible is hit
          currHealth = health + 5;
          setHealth(currHealth);
          // Remove Collectible
          collectibles[i].pristine = false;
          /* firstPhysicsRelevantCollectible.current = i + 1;
          tempObject.visible = false;
          tempObject.updateMatrix();
          collectibleMeshRef.current.setMatrixAt(i, tempObject.matrix);
          collectibleMeshRef.current.instanceMatrix.needsUpdate = true; */
          firstPhysicsRelevantCollectible.current = i + 1;
          gameplayCollectibles.current.hide([i]);
        }
      }
    }
    for (let i = 0; i < obstacles.length; i += 1) {
      const curr = obstacles[i];

      if (Math.abs(curr.position.z - tSince0) < curr.dimensions.z / 2) {
        const collisionDetected =
          isColliding(leftHand.current, curr) ||
          isColliding(rightHand.current, curr) ||
          isColliding(leftFoot.current, curr) ||
          isColliding(rightFoot.current, curr);

        if (collisionDetected) {
          currHealth = health - 1;
          setHealth(currHealth);
        }
      }
    }
  };

  if (!level) return <div>Loading...</div>;
  return (
    <div className="Gameplay" data-testid="Gameplay" ref={gameplayWrapper}>
      <div className="UI">
        <div className="ProgressIndicator-wrapper">
          <ProgressIndicator ref={progressIndicator} max={level.length} />
        </div>
        <div className="HealthBar-wrapper">
          <HealthBar current={health} max={100} />
        </div>
        <div className="Score-wrapper">
          <Score score={score} multiplier={currentMultiplier} />
        </div>
      </div>
      <Canvas id="main-canvas">
        <RecoildBridge>
          {clippedObjectsThreeAsState}
          <color attach="background" args={['#158ed4']} />
          <PerspectiveCamera
            ref={camera}
            makeDefault
            position={[0, 0, 0.2]}
            rotation={[0, 0, 0]} // x_rot, y_rot, z_rot
          />
          <directionalLight position={[5, 20, 35]} />
          <GameplayCollectibles collectibles={collectibles} ref={gameplayCollectibles} />
          <Ground ref={ground} bpm={level.bpm} timeScaleFactor={settings.gamePlaytimeScaleFactor} />
        </RecoildBridge>
      </Canvas>
      <Canvas id="PlayerHologram-canvas">
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 0, 0.75]}
            rotation={[0, 0, 0]} // x_rot, y_rot, z_rot
          />
          <directionalLight position={[5, 20, 35]} />
          <PlayerHologram threeRef={leftHandHologramRef} icon={leftHandThreeURL} />
          <PlayerHologram threeRef={rightHandHologramRef} icon={rightHandThreeURL} />
          <PlayerHologram threeRef={leftFootHologramRef} icon={leftFootThreeURL} />
          <PlayerHologram threeRef={rightFootHologramRef} icon={rightFootThreeURL} />
        </Suspense>
      </Canvas>
      {process.env.REACT_APP_VIDEO_SOURCE ? (
        // If the flag is active: Source is video file
        <video
          width={`${settings.mediaPipeResolution}px`}
          height={`${settings.mediaPipeResolution}px`}
          className="video-capture"
          ref={captureVideo}
          autoPlay>
          <source src={process.env.REACT_APP_VIDEO_SOURCE} type="video/mp4" />
        </video>
      ) : (
        // ...otherwise: Source is webcam feed
        <video className="video-capture" ref={captureVideo} />
      )}
      {props.debug && <LandmarkDebugCanvas ref={landmarkDebugCanvas} />}
    </div>
  );
};

export default Gameplay;
