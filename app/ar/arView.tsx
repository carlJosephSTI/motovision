// @ts-nocheck

import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import { useRef } from "react";
import { View } from "react-native";

const THREE = require("three");

export default function ARViewer() {
  const animationRef = useRef(null);

  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f2f2);

    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );

    camera.position.z = 5;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      roughness: 0.4,
      metalness: 0.2,
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const render = () => {
      animationRef.current = requestAnimationFrame(render);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };

  return (
    <View style={{ flex: 1 }}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}