import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  useCallback,
} from "react";
import ReactDOM from "react-dom";
import { Canvas, useThree, useLoader, MeshProps } from "@react-three/fiber";
import {
  Pose,
  POSE_CONNECTIONS,
  POSE_LANDMARKS_LEFT,
  POSE_LANDMARKS_NEUTRAL,
  POSE_LANDMARKS_RIGHT,
} from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

import "./CalibrationScene.scss";

import * as THREE from "three";
// import CSS from "csstype";
import {
  // eslint-disable-next-line camelcase
  useRecoilValue,
} from "recoil";

import { Mesh } from "three";
import { useMachine } from "@xstate/react";
import { createMachine } from "xstate";
import PlayerHologram from "../PlayerHologram/PlayerHologram";
import { settingsState } from "../../atoms/settingsState";
import LandmarkDebugCanvas from "../LandmarkDebugCanvas/LandmarkDebugCanvas";
import calculateAngleBetweenTwoPoints from "../../util/calculateAngleBetweenTwoPoints";

const leftHandThreeURL = "assets/hand_left.png";
const rightHandThreeURL = "assets/hand_right.png";
const leftFootThreeURL = "assets/foot_left.png";
const rightFootThreeURL = "assets/foot_right.png";

const calibrationMachine = createMachine(
  {
    id: "calibration",
    initial: "idle",
    states: {
      idle: { on: { isReady: "step1" } },
      step1: { on: { step1Finished: "step1Finished", isNotReady: "idle" } },
      step1Finished: { on: { isReady2: "step2" } },
      step2: {
        on: { step2Finished: "step2Finished", isNotReady2: "step1Finished" },
      },
      step2Finished: { entry: ["saveCalibrationParameters"] },
    },
  },
  {
    actions: {
      // set param 1 cache to zero
      flushParam1: (context, event) => {
        console.log("flushing param1...");
      },
      // set param 2 cache to zero
      flushParam2: (context, event) => {
        console.log("flushing param2...");
      },
      // save all recorded params
      saveCalibrationParameters: (context, event) => {
        console.log("saving...");
      },
    },
  }
);

const CalibrationScene = () => {
  const settings = useRecoilValue(settingsState);
  const captureVideo = useRef<HTMLVideoElement>();
  const gameplayWrapper = useRef<HTMLDivElement>();
  const [, setMediaPipeReady] = useState<boolean>(false);
  const mediaPipeCamera = useRef<Camera>();
  const [state, send] = useMachine(calibrationMachine);
  const leftHand = useRef<{
    x: number;
    y: number;
    rotation: number;
  }>({
    x: 0,
    y: 0,
    rotation: 0,
  });
  const rightHand = useRef<{
    x: number;
    y: number;
    rotation: number;
  }>({
    x: 0,
    y: 0,
    rotation: 0,
  });
  const leftFoot = useRef<{
    x: number;
    y: number;
    rotation: number;
  }>({
    x: 0,
    y: 0,
    rotation: 0,
  });
  const rightFoot = useRef<{
    x: number;
    y: number;
    rotation: number;
  }>({
    x: 0,
    y: 0,
    rotation: 0,
  });
  const leftHandHologramRef = useRef<Mesh>();
  const rightHandHologramRef = useRef<Mesh>();
  const leftFootHologramRef = useRef<Mesh>();
  const rightFootHologramRef = useRef<Mesh>();

  // Global variable calibrationMatrix (accessible to Gameplay.tsx)
  const calibrationMatrix = useRef<[number]>();
  const [calibrationStep, setCalibrationStep] = useState<1 | 2>(1); // typescript

  function setHologramRANs(results: any) {
    leftHand.current = {
      x: (-results.poseLandmarks[15].x + 0.5) * 2 * settings.hologramScale, // Rescaling @ calculateHologramTransform
      y: (-results.poseLandmarks[15].y + 0.5) * 2 * settings.hologramScale, // Rescaling @ calculateHologramTransform
      rotation: calculateAngleBetweenTwoPoints(
        results.poseLandmarks[13],
        results.poseLandmarks[15]
      ),
    };
    leftHandHologramRef.current.position.set(
      leftHand.current.x,
      leftHand.current.y,
      -1
    );
    leftHandHologramRef.current.rotation.set(0, 0, leftHand.current.rotation);
    rightHand.current = {
      x: (-results.poseLandmarks[16].x + 0.5) * 2 * settings.hologramScale, // Rescaling @ calculateHologramTransform
      y: (-results.poseLandmarks[16].y + 0.5) * 2 * settings.hologramScale, // Rescaling @ calculateHologramTransform
      rotation: calculateAngleBetweenTwoPoints(
        results.poseLandmarks[14],
        results.poseLandmarks[16]
      ),
    };
    rightHandHologramRef.current.position.set(
      rightHand.current.x,
      rightHand.current.y,
      -1
    );
    rightHandHologramRef.current.rotation.set(0, 0, rightHand.current.rotation);
    leftFoot.current = {
      x: (-results.poseLandmarks[27].x + 0.5) * 2 * settings.hologramScale, // Rescaling @ calculateHologramTransform
      y: (-results.poseLandmarks[27].y + 0.5) * 2 * settings.hologramScale, // Rescaling @ calculateHologramTransform
      rotation:
        calculateAngleBetweenTwoPoints(
          results.poseLandmarks[25],
          results.poseLandmarks[27]
        ) + Math.PI,
    };
    leftFootHologramRef.current.position.set(
      leftFoot.current.x,
      leftFoot.current.y,
      -1
    );
    leftFootHologramRef.current.rotation.set(0, 0, leftFoot.current.rotation);
    rightFoot.current = {
      x: (-results.poseLandmarks[28].x + 0.5) * 2 * settings.hologramScale, // Rescaling @ calculateHologramTransform
      y: (-results.poseLandmarks[28].y + 0.5) * 2 * settings.hologramScale, // Rescaling @ calculateHologramTransform
      rotation:
        calculateAngleBetweenTwoPoints(
          results.poseLandmarks[26],
          results.poseLandmarks[28]
        ) + Math.PI,
    };
    rightFootHologramRef.current.position.set(
      rightFoot.current.x,
      rightFoot.current.y,
      -1
    );
    rightFootHologramRef.current.rotation.set(0, 0, rightFoot.current.rotation);
  }

  function checkReadinessForStep1(results: any) {
    // Helper function to check if number is in range
    function between(x: number, min: number, max: number) {
      return x >= min && x <= max;
    }

    // Check right side, desired: (3/2)pi
    const angleRightLink1 = calculateAngleBetweenTwoPoints(
      results.poseLandmarks[12],
      results.poseLandmarks[14]
    );
    const angleRightLink2 = calculateAngleBetweenTwoPoints(
      results.poseLandmarks[14],
      results.poseLandmarks[16]
    );

    // Check left side, desired: (1/2)pi
    const angleLeftLink1 = calculateAngleBetweenTwoPoints(
      results.poseLandmarks[11],
      results.poseLandmarks[13]
    );
    const angleLeftLink2 = calculateAngleBetweenTwoPoints(
      results.poseLandmarks[13],
      results.poseLandmarks[15]
    );
    // console.log(`Link 1: ${angleRightLink1}`);
    // console.log(`Link 2: ${angleRightLink2}`);
    const range = 0.25; // high tolerance due to perspective distortion
    return (
      between(
        angleRightLink1,
        1.5 * Math.PI * (1 - range),
        1.5 * Math.PI * (1 + range)
      ) &&
      between(
        angleRightLink2,
        1.5 * Math.PI * (1 - range),
        1.5 * Math.PI * (1 + range)
      ) &&
      between(
        angleLeftLink1,
        0.5 * Math.PI * (1 - range),
        0.5 * Math.PI * (1 + range)
      ) &&
      between(
        angleLeftLink2,
        0.5 * Math.PI * (1 - range),
        0.5 * Math.PI * (1 + range)
      )
    );
  }

  function checkReadinessForStep2(results: any) {
    // Check right side, desired: (3/2)pi
    const angleRightLink1 = calculateAngleBetweenTwoPoints(
      results.poseLandmarks[12],
      results.poseLandmarks[14]
    );
    const angleRightLink2 = calculateAngleBetweenTwoPoints(
      results.poseLandmarks[14],
      results.poseLandmarks[16]
    );

    // Check left side, desired: (1/2)pi
    const angleLeftLink1 = calculateAngleBetweenTwoPoints(
      results.poseLandmarks[11],
      results.poseLandmarks[13]
    );
    const angleLeftLink2 = calculateAngleBetweenTwoPoints(
      results.poseLandmarks[13],
      results.poseLandmarks[15]
    );
    // console.log(`Link 1: ${angleRightLink1}`);
    // console.log(`Link 2: ${angleRightLink2}`);
    const range = 0.15;
    return (
      (angleRightLink1 > 2 * Math.PI * (1 - range) ||
        angleRightLink1 < 2 * Math.PI * range) &&
      (angleRightLink2 > 2 * Math.PI * (1 - range) ||
        angleRightLink2 < 2 * Math.PI * range) &&
      (angleLeftLink1 > 2 * Math.PI * (1 - range) ||
        angleLeftLink1 < 2 * Math.PI * range) &&
      (angleLeftLink2 > 2 * Math.PI * (1 - range) ||
        angleLeftLink2 < 2 * Math.PI * range)
    );
  }

  function detectedPose(results: any) {
    if (!results.poseLandmarks) return;
    setMediaPipeReady(true);

    // Calculate and set position and rotation of holograms
    setHologramRANs(results);

    // Check readiness of player to start calibration step 1
    if (checkReadinessForStep1(results)) {
      send("isReady");
    } else {
      send("isNotReady");
    }
    if (checkReadinessForStep2(results)) {
      send("isReady2");
      console.log(state.value);
    }
  }

  const pose = useMemo(
    () =>
      new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      }),
    []
  );
  pose.setOptions({
    modelComplexity: 0,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  pose.onResults(detectedPose);

  useEffect(() => {
    if (!process.env.REACT_APP_VIDEO_SOURCE) {
      mediaPipeCamera.current =
        captureVideo.current &&
        new Camera(captureVideo.current, {
          onFrame: async () => {
            await pose.send({
              image: captureVideo.current as unknown as HTMLVideoElement,
            });
          },
          width: settings.mediaPipeResolution,
          height: settings.mediaPipeResolution,
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
            image: captureVideo.current as unknown as HTMLVideoElement,
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
  }, [captureVideo, pose, settings.mediaPipeResolution]);

  return (
    <div
      className="CalibrationScene"
      data-testid="Gameplay"
      ref={gameplayWrapper}
    >
      <video
        className="instruction-canvas"
        autoPlay
        controls={false}
        loop
        src={
          calibrationStep === 1
            ? "/assets/Calibration Instruction I.mp4"
            : "/assets/Calibration Instruction II.mp4"
        }
      />
      <div className="player-feedback">
        <Canvas id="playerHologram-canvas">
          <Suspense fallback={null}>
            <PlayerHologram
              threeRef={leftHandHologramRef}
              icon={leftHandThreeURL}
            />
            <PlayerHologram
              threeRef={rightHandHologramRef}
              icon={rightHandThreeURL}
            />
            <PlayerHologram
              threeRef={leftFootHologramRef}
              icon={leftFootThreeURL}
            />
            <PlayerHologram
              threeRef={rightFootHologramRef}
              icon={rightFootThreeURL}
            />
          </Suspense>
        </Canvas>
        {process.env.REACT_APP_VIDEO_SOURCE ? (
          // If the flag is active: Source is video file

          <video
            width={`${settings.mediaPipeResolution}px`}
            height={`${settings.mediaPipeResolution}px`}
            className="video-capture"
            ref={captureVideo}
            autoPlay
          >
            <source src={process.env.REACT_APP_VIDEO_SOURCE} type="video/mp4" />
          </video>
        ) : (
          // ...otherwise: Source is webcam feed
          <video className="video-capture" ref={captureVideo} />
        )}
      </div>
    </div>
  );
};

export default CalibrationScene;
