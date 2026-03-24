import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";
import { ComponentRenderer } from "./ModelLoader";

/**
 * ─── Enhanced 3D Viewport ───────────────────────────────────
 * 
 * Renders components using high-quality GLTF models.
 * Optimized for WebGL stability with error handling.
 */

// ─── Component Renderer ──────────────────────────────────────

function SimComponentRenderer({ component }: { component: any }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      // Update position/rotation from simulation state
      groupRef.current.position.set(...component.position);
      groupRef.current.rotation.set(...component.rotation);
      groupRef.current.scale.set(...component.scale);
    }
  });

  return (
    <group ref={groupRef}>
      <ComponentRenderer component={component} />
    </group>
  );
}

// ─── Wire Renderer ──────────────────────────────────────────

function WireRenderer({ wires }: { wires: any[] }) {
  const linesRef = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    if (!linesRef.current || wires.length === 0) return;

    const points: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];

    wires.forEach((wire) => {
      const fromComponent = wire.fromComponent;
      const toComponent = wire.toComponent;

      if (fromComponent && toComponent) {
        const fromPos = new THREE.Vector3(...fromComponent.position);
        const toPos = new THREE.Vector3(...toComponent.position);

        points.push(fromPos, toPos);

        // Color based on wire type
        const color = wire.type === "power" ? new THREE.Color(0xff0000) : new THREE.Color(0x00ff00);
        colors.push(color, color);
      }
    });

    if (points.length === 0) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors.flatMap((c) => [c.r, c.g, c.b])), 3));

    linesRef.current.geometry = geometry;
  }, [wires]);

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry />
      <lineBasicMaterial vertexColors />
    </lineSegments>
  );
}

// ─── Scene Content ──────────────────────────────────────────

function SceneContent() {
  const components = useSimulationStore((s) => s.components);
  const wires = useSimulationStore((s) => s.wires);
  const { gl } = useThree();

  // Handle WebGL context loss
  useEffect(() => {
    const handleContextLoss = () => {
      console.warn("WebGL context lost. Attempting recovery...");
    };

    const handleContextRestored = () => {
      console.log("WebGL context restored.");
    };

    gl.domElement.addEventListener("webglcontextlost", handleContextLoss);
    gl.domElement.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      gl.domElement.removeEventListener("webglcontextlost", handleContextLoss);
      gl.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
      <OrbitControls />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      {/* Grid */}
      <Grid args={[10, 10]} cellSize={0.5} cellColor="#6f6f6f" sectionSize={5} sectionColor="#9d4edd" fadeDistance={50} fadeStrength={1} />

      {/* Components */}
      {components.map((component) => (
        <SimComponentRenderer key={component.id} component={component} />
      ))}

      {/* Wires */}
      <WireRenderer wires={wires} />
    </>
  );
}

// ─── Main Viewport Component ────────────────────────────────

export function EnhancedViewport3D() {
  const [hasError, setHasError] = useState(false);

  const handleCanvasError = (error: any) => {
    console.error("Canvas error:", error);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1a1a1a", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <h2>WebGL Error</h2>
          <p>Your browser or graphics card doesn't support WebGL.</p>
          <button onClick={() => setHasError(false)} style={{ padding: "10px 20px", marginTop: "10px" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        shadows
        onCreated={(state) => {
          state.gl.setClearColor(new THREE.Color(0x1a1a1a));
          state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          state.gl.setSize(window.innerWidth, window.innerHeight);
        }}
        onError={handleCanvasError}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
