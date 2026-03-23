import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";

function SimulationScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 4, 6]} fov={50} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={50}
      />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#00d4ff" />

      {/* Ground grid */}
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a2332"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#0ea5e9"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
        position={[0, 0, 0]}
      />

      {/* Sample Arduino board representation */}
      <group position={[0, 0.15, 0]}>
        {/* PCB */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.12, 1.5]} />
          <meshStandardMaterial color="#006d5b" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Chip */}
        <mesh position={[0.2, 0.12, 0]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.5]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* USB connector */}
        <mesh position={[-1.0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.35, 0.18, 0.45]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Pin headers */}
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={`pin-top-${i}`} position={[-0.8 + i * 0.12, 0.12, -0.6]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#d4a017" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={`pin-bot-${i}`} position={[-0.8 + i * 0.12, 0.12, 0.6]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#d4a017" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        {/* Status LEDs */}
        <mesh position={[0.7, 0.12, -0.3]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.7, 0.12, -0.15]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Breadboard */}
      <group position={[3, 0.08, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.08, 1.2]} />
          <meshStandardMaterial color="#f5f5f0" roughness={0.8} />
        </mesh>
        {/* Center groove */}
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[2.4, 0.01, 0.08]} />
          <meshStandardMaterial color="#e0e0d8" roughness={0.9} />
        </mesh>
        {/* Holes pattern */}
        {Array.from({ length: 20 }).map((_, col) =>
          Array.from({ length: 5 }).map((_, row) => (
            <mesh key={`hole-${col}-${row}`} position={[-1.1 + col * 0.11, 0.045, -0.35 + row * 0.1]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 6]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          ))
        )}
      </group>

      {/* HC-SR04 Ultrasonic Sensor */}
      <group position={[-2, 0.2, 1.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.12, 0.4]} />
          <meshStandardMaterial color="#0066cc" roughness={0.6} />
        </mesh>
        {/* Transducers */}
        <mesh position={[-0.18, 0.06, 0.15]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.18, 0.06, 0.15]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Servo Motor */}
      <group position={[-2, 0.2, -1.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.35, 0.25]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      <Environment preset="city" />
    </>
  );
}

export function Viewport3D() {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows className="w-full h-full" gl={{ antialias: true, alpha: false }} style={{ background: "#0d1117" }}>
        <Suspense fallback={null}>
          <SimulationScene />
        </Suspense>
      </Canvas>

      {/* Viewport overlay info */}
      <div className="absolute top-3 left-3 flex gap-2">
        <span className="px-2 py-1 text-[10px] font-mono rounded bg-card/80 text-muted-foreground border border-border backdrop-blur-sm">
          Perspective
        </span>
        <span className="px-2 py-1 text-[10px] font-mono rounded bg-card/80 text-primary border border-primary/20 backdrop-blur-sm">
          ● Simulation Ready
        </span>
      </div>

      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-muted-foreground/60">
        3 objects • 0 connections • Physics: idle
      </div>

      <div className="absolute bottom-3 right-3 flex gap-1">
        {["XY", "XZ", "YZ", "3D"].map((v) => (
          <button
            key={v}
            className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
              v === "3D"
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-card/80 text-muted-foreground border-border hover:border-primary/30 backdrop-blur-sm"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
