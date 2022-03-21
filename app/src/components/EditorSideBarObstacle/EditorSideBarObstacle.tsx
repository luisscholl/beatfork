import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useMemo } from "react";
import * as THREE from "three";
import "./EditorSideBarObstacle.scss";
import editorObstacleFragmentShader from "../../shaders/editorObstacleFragmentShader.glsl";
import editorObstacleVertexShader from "../../shaders/editorObstacleVertexShader.glsl";

const EditorSideBarObstacle = () => {
  const shaderData = useMemo(
    () => ({
      fragmentShader: editorObstacleFragmentShader,
      vertexShader: editorObstacleVertexShader,
      uniforms: {
        obstacleTexture: {
          value: new THREE.TextureLoader().load("./assets/obstacles.png"),
        },
      },
    }),
    []
  );

  return (
    <div className="EditorSideBarObstacle" data-testid="EditorSideBarObstacle">
      <Canvas>
        <mesh position={[0, 0, 0]}>
          <boxBufferGeometry args={[0.25, 0.25, 0.25]} attach="geometry" />
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <shaderMaterial attach="material" {...shaderData} />
        </mesh>
        <PerspectiveCamera
          makeDefault
          position={[0, 0, 0.55]}
          rotation={[0, 0, 0]}
        />
        <directionalLight position={[-5, 20, -35]} />
      </Canvas>
      <p>Obstacle</p>
    </div>
  );
};

export default EditorSideBarObstacle;
