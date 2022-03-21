/* eslint-disable react/display-name */
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useRecoilValue } from "recoil";
import { settingsState } from "../../atoms/settingsState";
import "./LandmarkDebugCanvas.scss";

const LandmarkDebugCanvas = forwardRef((props: any, ref) => {
  const settings = useRecoilValue(settingsState);

  const debugCanvas = useRef<HTMLCanvasElement>();
  const debugCanvasCtx = useRef<CanvasRenderingContext2D>();
  const landmarkContainer: any = useRef(null);

  useEffect(() => {
    if (debugCanvas.current)
      debugCanvasCtx.current = (
        debugCanvas.current as HTMLCanvasElement
      ).getContext("2d");
  }, [debugCanvas]);

  useImperativeHandle(ref, () => ({
    draw(results: any) {
      if (!debugCanvasCtx.current) return;
      debugCanvasCtx.current.save();
      debugCanvasCtx.current.clearRect(
        0,
        0,
        debugCanvas.current.width,
        debugCanvas.current.height
      );

      // Only overwrite existing pixels.
      debugCanvasCtx.current.globalCompositeOperation = "source-in";
      debugCanvasCtx.current.fillStyle = "#00FF00";
      debugCanvasCtx.current.fillRect(
        0,
        0,
        debugCanvas.current.width,
        debugCanvas.current.height
      );

      // Only overwrite missing pixels.
      debugCanvasCtx.current.globalCompositeOperation = "destination-atop";
      debugCanvasCtx.current.drawImage(
        results.image,
        0,
        0,
        debugCanvas.current.width,
        debugCanvas.current.height
      );

      debugCanvasCtx.current.globalCompositeOperation = "source-over";

      // Draws the landmarks of interest
      drawLandmarks(
        debugCanvasCtx.current,
        [13, 14, 15, 16, 25, 26, 27, 28].map(
          (index) => results.poseLandmarks[index]
        ),
        {
          color: "white",
          fillColor: "white",
        }
      );

      // Draws the connections between landmarks
      drawConnectors(
        debugCanvasCtx.current,
        results.poseLandmarks,
        // Show only the forearm and lowerleg connections (subset of POSE_CONNECTIONS)
        [
          [14, 16],
          [13, 15],
          [25, 27],
          [26, 28],
        ],
        {
          color: "white",
          lineWidth: 4,
        }
      );

      debugCanvasCtx.current.restore();
      debugCanvasCtx.current.restore();
    },
  }));

  return (
    <div className="LandmarkDebugCanvas" data-testid="LandmarkDebugCanvas">
      <canvas
        width={`${settings.mediaPipeResolution}px`}
        height={`${settings.mediaPipeResolution}px`}
        ref={debugCanvas}
      />
      <div ref={landmarkContainer} />
    </div>
  );
});

export default LandmarkDebugCanvas;
