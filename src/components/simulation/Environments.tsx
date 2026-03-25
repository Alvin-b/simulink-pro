import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Stars, Cloud, Text } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";

// ─── Environment types ─────────────────────────────────────

export type EnvironmentTheme =
  | "robotics-lab"
  | "smart-garden"
  | "smart-home"
  | "industrial"
  | "warehouse"
  | "outdoor-field"
  | "desert"
  | "empty";

export interface EnvironmentConfig {
  id: EnvironmentTheme;
  label: string;
  icon: string;
  description: string;
  skyConfig: {
    sunPosition: [number, number, number];
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
  };
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  ambientColor: string;
  sunIntensity: number;
  sunColor: string;
  groundColor: string;
  groundRoughness: number;
  showStars: boolean;
}

export const ENVIRONMENT_CONFIGS: Record<EnvironmentTheme, EnvironmentConfig> = {
  "robotics-lab": {
    id: "robotics-lab",
    label: "Robotics Lab",
    icon: "🔬",
    description: "Indoor lab with cool LED lighting",
    skyConfig: { sunPosition: [0, 1, 0], turbidity: 0, rayleigh: 0, mieCoefficient: 0, mieDirectionalG: 0 },
    fogColor: "#0a0d12",
    fogNear: 20,
    fogFar: 60,
    ambientIntensity: 0.6,
    ambientColor: "#b0c8ff",
    sunIntensity: 1.2,
    sunColor: "#ffffff",
    groundColor: "#1a1a2e",
    groundRoughness: 0.3,
    showStars: false,
  },
  "smart-garden": {
    id: "smart-garden",
    label: "Smart Garden",
    icon: "🌿",
    description: "Outdoor garden with natural daylight",
    skyConfig: { sunPosition: [1, 0.5, 0], turbidity: 4, rayleigh: 0.5, mieCoefficient: 0.005, mieDirectionalG: 0.8 },
    fogColor: "#a8d5a2",
    fogNear: 30,
    fogFar: 80,
    ambientIntensity: 0.7,
    ambientColor: "#ffe8a0",
    sunIntensity: 1.5,
    sunColor: "#fff4cc",
    groundColor: "#3d6b35",
    groundRoughness: 0.9,
    showStars: false,
  },
  "smart-home": {
    id: "smart-home",
    label: "Smart Home",
    icon: "🏠",
    description: "Indoor home with warm lighting",
    skyConfig: { sunPosition: [0.5, 0.3, 1], turbidity: 8, rayleigh: 1, mieCoefficient: 0.01, mieDirectionalG: 0.7 },
    fogColor: "#1a1208",
    fogNear: 15,
    fogFar: 40,
    ambientIntensity: 0.5,
    ambientColor: "#ff9944",
    sunIntensity: 0.8,
    sunColor: "#ffcc88",
    groundColor: "#8b6914",
    groundRoughness: 0.5,
    showStars: false,
  },
  "industrial": {
    id: "industrial",
    label: "Industrial",
    icon: "🏭",
    description: "Factory floor with harsh lighting",
    skyConfig: { sunPosition: [0, 2, 0], turbidity: 10, rayleigh: 3, mieCoefficient: 0.02, mieDirectionalG: 0.6 },
    fogColor: "#1a1410",
    fogNear: 25,
    fogFar: 70,
    ambientIntensity: 0.4,
    ambientColor: "#ccaa88",
    sunIntensity: 1.8,
    sunColor: "#ffffff",
    groundColor: "#2a2520",
    groundRoughness: 0.8,
    showStars: false,
  },
  "warehouse": {
    id: "warehouse",
    label: "Warehouse",
    icon: "📦",
    description: "Large storage facility",
    skyConfig: { sunPosition: [0, 1, 0], turbidity: 0, rayleigh: 0, mieCoefficient: 0, mieDirectionalG: 0 },
    fogColor: "#0f0f0f",
    fogNear: 30,
    fogFar: 80,
    ambientIntensity: 0.35,
    ambientColor: "#aaaacc",
    sunIntensity: 1.5,
    sunColor: "#ffffff",
    groundColor: "#2a2a2a",
    groundRoughness: 0.7,
    showStars: false,
  },
  "outdoor-field": {
    id: "outdoor-field",
    label: "Outdoor Field",
    icon: "🌄",
    description: "Open field at golden hour",
    skyConfig: { sunPosition: [0.3, 0.15, 1], turbidity: 6, rayleigh: 2, mieCoefficient: 0.008, mieDirectionalG: 0.85 },
    fogColor: "#c8a060",
    fogNear: 40,
    fogFar: 120,
    ambientIntensity: 0.6,
    ambientColor: "#ffd080",
    sunIntensity: 2.0,
    sunColor: "#ff9944",
    groundColor: "#4a7a30",
    groundRoughness: 0.95,
    showStars: false,
  },
  "desert": {
    id: "desert",
    label: "Desert",
    icon: "🏜️",
    description: "Harsh midday desert sun",
    skyConfig: { sunPosition: [0, 1, 0.1], turbidity: 2, rayleigh: 0.3, mieCoefficient: 0.003, mieDirectionalG: 0.9 },
    fogColor: "#e8c880",
    fogNear: 50,
    fogFar: 150,
    ambientIntensity: 0.8,
    ambientColor: "#ffe4a0",
    sunIntensity: 2.5,
    sunColor: "#fffaee",
    groundColor: "#c8a050",
    groundRoughness: 1.0,
    showStars: false,
  },
  "empty": {
    id: "empty",
    label: "Empty",
    icon: "⬜",
    description: "Clean empty space",
    skyConfig: { sunPosition: [1, 1, 1], turbidity: 1, rayleigh: 0.5, mieCoefficient: 0.004, mieDirectionalG: 0.8 },
    fogColor: "#0a0d12",
    fogNear: 40,
    fogFar: 100,
    ambientIntensity: 0.4,
    ambientColor: "#8899bb",
    sunIntensity: 1.0,
    sunColor: "#ffffff",
    groundColor: "#111827",
    groundRoughness: 0.4,
    showStars: true,
  },
};

// ─── Ground plane ──────────────────────────────────────────

function Ground({ config }: { config: EnvironmentConfig }) {
  return (
    <RigidBody type="fixed">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200, 32, 32]} />
        <meshStandardMaterial
          color={config.groundColor}
          roughness={config.groundRoughness}
          metalness={0.0}
        />
      </mesh>
      <CuboidCollider args={[100, 0.05, 100]} position={[0, -0.05, 0]} />
    </RigidBody>
  );
}

// ─── Robotics Lab ──────────────────────────────────────────

function RoboticsLabScene() {
  return (
    <group>
      {/* Ceiling */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0d1020" roughness={0.8} />
      </mesh>

      {/* Walls */}
      {[
        { pos: [0, 3, -12] as [number,number,number], rot: [0,0,0] as [number,number,number], w: 30, h: 6 },
        { pos: [0, 3, 12] as [number,number,number],  rot: [0, Math.PI, 0] as [number,number,number], w: 30, h: 6 },
        { pos: [-12, 3, 0] as [number,number,number], rot: [0, Math.PI/2, 0] as [number,number,number], w: 24, h: 6 },
        { pos: [12, 3, 0] as [number,number,number],  rot: [0, -Math.PI/2, 0] as [number,number,number], w: 24, h: 6 },
      ].map((w, i) => (
        <mesh key={i} position={w.pos} rotation={w.rot} receiveShadow>
          <planeGeometry args={[w.w, w.h]} />
          <meshStandardMaterial color="#0f1520" roughness={0.9} />
        </mesh>
      ))}

      {/* LED strip lights on ceiling */}
      {[-4, 0, 4].map((x, i) => (
        <group key={i} position={[x, 5.8, 0]}>
          <mesh>
            <boxGeometry args={[0.1, 0.05, 20]} />
            <meshStandardMaterial color="#ffffff" emissive="#8ab4ff" emissiveIntensity={2} />
          </mesh>
          <pointLight color="#7099ff" intensity={1.2} distance={12} position={[0, -0.5, 0]} />
        </group>
      ))}

      {/* Workbenches */}
      {[[-5, 0, -9], [5, 0, -9]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <RigidBody type="fixed">
            <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
              <boxGeometry args={[3, 0.06, 1.2]} />
              <meshStandardMaterial color="#5a4030" roughness={0.5} />
            </mesh>
            {[[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]].map(([lx, lz], j) => (
              <mesh key={j} position={[lx, 0.44, lz]} castShadow>
                <boxGeometry args={[0.06, 0.88, 0.06]} />
                <meshStandardMaterial color="#3a2a18" roughness={0.7} />
              </mesh>
            ))}
            <CuboidCollider args={[1.5, 0.03, 0.6]} position={[0, 0.88, 0]} />
          </RigidBody>
          {/* Monitor on bench */}
          <mesh position={[0, 1.3, -0.4]} castShadow>
            <boxGeometry args={[0.8, 0.5, 0.04]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.3, -0.39]}>
            <planeGeometry args={[0.72, 0.42]} />
            <meshStandardMaterial color="#001133" emissive="#002266" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Shelving unit on wall */}
      {[1.5, 2.5, 3.5].map((y, i) => (
        <mesh key={i} position={[-11, y, 0]} castShadow>
          <boxGeometry args={[0.3, 0.04, 6]} />
          <meshStandardMaterial color="#3a3040" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* Overhead camera on ceiling */}
      <group position={[0, 5.5, 0]}>
        <mesh>
          <boxGeometry args={[0.15, 0.15, 0.2]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <pointLight color="#0044ff" intensity={0.3} distance={2} position={[0, -0.1, 0]} />
      </group>

      {/* Floor grid lines */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[24, 24, 24, 24]} />
        <meshBasicMaterial color="#1a2040" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ─── Smart Garden ──────────────────────────────────────────

function SmartGardenScene() {
  const leafRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (leafRef.current) {
      leafRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  // Tree geometry
  function Tree({ position }: { position: [number, number, number] }) {
    return (
      <group position={position}>
        <mesh castShadow position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.12, 0.18, 3, 8]} />
          <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 3.5, 0]}>
          <coneGeometry args={[1.2, 2.5, 8]} />
          <meshStandardMaterial color="#2d5a1b" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 4.5, 0]}>
          <coneGeometry args={[0.9, 2, 8]} />
          <meshStandardMaterial color="#367020" roughness={0.8} />
        </mesh>
      </group>
    );
  }

  function FlowerBed({ position }: { position: [number, number, number] }) {
    const colors = ["#ff4466", "#ff8800", "#ffdd00", "#ff44aa", "#cc44ff"];
    return (
      <group position={position}>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[2, 1]} />
          <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
        </mesh>
        {Array.from({length: 12}).map((_, i) => (
          <mesh key={i} position={[
            (Math.random() - 0.5) * 1.8,
            0.12,
            (Math.random() - 0.5) * 0.8
          ]} castShadow>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial
              color={colors[i % colors.length]}
              emissive={colors[i % colors.length]}
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* Grass patches */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#3d6b35" roughness={0.95} />
      </mesh>

      {/* Garden path - stones */}
      {Array.from({length: 12}).map((_, i) => (
        <mesh key={i} position={[0, 0.02, -5 + i * 1]} rotation={[-Math.PI/2, Math.random()*0.3, 0]} receiveShadow>
          <boxGeometry args={[0.5 + Math.random()*0.3, 0.06, 0.4 + Math.random()*0.2]} />
          <meshStandardMaterial color="#8a8878" roughness={0.9} />
        </mesh>
      ))}

      {/* Trees */}
      <Tree position={[-6, 0, -4]} />
      <Tree position={[7, 0, -5]} />
      <Tree position={[-8, 0, 5]} />
      <Tree position={[9, 0, 3]} />

      {/* Flower beds */}
      <FlowerBed position={[-3, 0, -3]} />
      <FlowerBed position={[3, 0, -3]} />
      <FlowerBed position={[0, 0, 4]} />

      {/* Raised garden beds (IoT soil sensors go here) */}
      {[[-4, 0, 2], [4, 0, 2]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <RigidBody type="fixed">
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2, 0.4, 1]} />
              <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.23, 0]}>
              <boxGeometry args={[1.8, 0.06, 0.8]} />
              <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
            </mesh>
            <CuboidCollider args={[1, 0.2, 0.5]} />
          </RigidBody>
        </group>
      ))}

      {/* Irrigation pipe system */}
      <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 14, 8]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Weather station pole */}
      <group position={[8, 0, 8]}>
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 4, 8]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Anemometer */}
        <mesh position={[0, 4.1, 0]}>
          <boxGeometry args={[0.6, 0.04, 0.04]} />
          <meshStandardMaterial color="#888" metalness={0.7} />
        </mesh>
        {[-0.3, 0.3].map((x, i) => (
          <mesh key={i} position={[x, 4.1, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#555" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Fence */}
      {Array.from({length: 14}).map((_, i) => (
        <group key={i} position={[-6.5 + i, 0, -10]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[0.06, 1.6, 0.06]} />
            <meshStandardMaterial color="#8b6914" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.2, -10]} castShadow>
        <boxGeometry args={[13, 0.06, 0.06]} />
        <meshStandardMaterial color="#8b6914" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, -10]} castShadow>
        <boxGeometry args={[13, 0.06, 0.06]} />
        <meshStandardMaterial color="#8b6914" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Smart Home ────────────────────────────────────────────

function SmartHomeScene() {
  return (
    <group>
      {/* Floor - wooden */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[20, 16]} />
        <meshStandardMaterial color="#8b6914" roughness={0.6} />
      </mesh>

      {/* Floor boards pattern */}
      {Array.from({length: 20}).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[-9.5 + i, 0.002, 0]}>
          <planeGeometry args={[0.9, 16]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#8b6914" : "#7a5c10"} roughness={0.6} />
        </mesh>
      ))}

      {/* Walls */}
      {[
        { pos: [0, 1.5, -7] as [number,number,number], rot: [0,0,0] as [number,number,number], w: 20, h: 3 },
        { pos: [-9, 1.5, 0] as [number,number,number], rot: [0, Math.PI/2, 0] as [number,number,number], w: 16, h: 3 },
        { pos: [9, 1.5, 0] as [number,number,number], rot: [0, -Math.PI/2, 0] as [number,number,number], w: 16, h: 3 },
      ].map((w, i) => (
        <RigidBody key={i} type="fixed">
          <mesh position={w.pos} rotation={w.rot} castShadow receiveShadow>
            <boxGeometry args={[w.w, w.h, 0.15]} />
            <meshStandardMaterial color="#e8e0d0" roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}

      {/* Wall-mounted TV screen */}
      <group position={[0, 1.5, -6.8]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 1.4, 0.06]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[2.3, 1.3]} />
          <meshStandardMaterial color="#001133" emissive="#003388" emissiveIntensity={0.6} />
        </mesh>
        {/* TV glow */}
        <pointLight color="#2244ff" intensity={0.4} distance={4} position={[0, 0, 0.5]} />
        <Text position={[0, 0, 0.05]} fontSize={0.1} color="#44aaff" anchorX="center">
          Smart Home Dashboard
        </Text>
      </group>

      {/* Smart speaker */}
      <group position={[-3, 0, -5]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 0.4, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Speaker grill */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.3, 16]} />
            <meshStandardMaterial color="#333" roughness={0.8} wireframe />
          </mesh>
          {/* LED ring */}
          <mesh position={[0, 0.42, 0]}>
            <ringGeometry args={[0.1, 0.15, 16]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={1.5} />
          </mesh>
          <pointLight color="#00aaff" intensity={0.3} distance={1} position={[0, 0.5, 0]} />
          <CuboidCollider args={[0.18, 0.21, 0.18]} position={[0, 0.2, 0]} />
        </RigidBody>
      </group>

      {/* Smart light bulbs on ceiling */}
      {[[-3, -3], [3, -3], [-3, 3], [3, 3], [0, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 2.95, z]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.08, 0.12, 8]} />
            <meshStandardMaterial color="#ffe8a0" emissive="#ffe8a0" emissiveIntensity={3} />
          </mesh>
          <pointLight color="#ffcc66" intensity={0.8} distance={6} castShadow />
        </group>
      ))}

      {/* Sofa */}
      <group position={[0, 0, 2]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[2.4, 0.6, 0.9]} />
            <meshStandardMaterial color="#4a3060" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.7, -0.35]} castShadow>
            <boxGeometry args={[2.4, 0.5, 0.2]} />
            <meshStandardMaterial color="#4a3060" roughness={0.7} />
          </mesh>
          {[-0.95, 0.95].map((x, i) => (
            <mesh key={i} position={[x, 0.7, 0]} castShadow>
              <boxGeometry args={[0.2, 0.5, 0.9]} />
              <meshStandardMaterial color="#3a2050" roughness={0.7} />
            </mesh>
          ))}
          <CuboidCollider args={[1.2, 0.3, 0.45]} position={[0, 0.3, 0]} />
        </RigidBody>
      </group>

      {/* Coffee table */}
      <group position={[0, 0, 0.5]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[1.2, 0.06, 0.6]} />
            <meshStandardMaterial color="#5c3a1e" roughness={0.5} />
          </mesh>
          {[[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.2, z]} castShadow>
              <boxGeometry args={[0.06, 0.4, 0.06]} />
              <meshStandardMaterial color="#3a2a18" />
            </mesh>
          ))}
          <CuboidCollider args={[0.6, 0.03, 0.3]} position={[0, 0.4, 0]} />
        </RigidBody>
      </group>

      {/* Smart light switches on wall */}
      {[-2, 2].map((x, i) => (
        <group key={i} position={[x, 1.2, -6.78]}>
          <mesh>
            <boxGeometry args={[0.1, 0.14, 0.02]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.02, 0.015]}>
            <boxGeometry args={[0.06, 0.04, 0.01]} />
            <meshStandardMaterial color="#ddd" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.07, 0.015]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}

      {/* Motion sensor on ceiling */}
      <group position={[0, 2.9, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} />
          <meshStandardMaterial color="#eee" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <sphereGeometry args={[0.04, 8, 8, 0, Math.PI*2, 0, Math.PI/2]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Window with light coming through */}
      <group position={[8.9, 1.5, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 1.5, 1.2]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.3} />
        </mesh>
        <pointLight color="#ffe8cc" intensity={1.5} distance={8} position={[-1, 0, 0]} />
      </group>

      {/* ── Smart Thermostat on wall ── */}
      <group position={[4, 1.3, -6.78]}>
        {/* Housing */}
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.04, 24]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0, 0.025]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.08, 24]} />
          <meshStandardMaterial color="#001122" emissive="#0044aa" emissiveIntensity={0.8} />
        </mesh>
        {/* Temperature text glow */}
        <Text position={[0, 0.01, 0.03]} fontSize={0.04} color="#00ccff" anchorX="center">
          22°C
        </Text>
      </group>

      {/* ── Smart Door Lock ── */}
      <group position={[-8.85, 1.1, -2]}>
        {/* Door */}
        <mesh castShadow>
          <boxGeometry args={[0.08, 2.2, 0.9]} />
          <meshStandardMaterial color="#5c3a1e" roughness={0.7} />
        </mesh>
        {/* Lock housing */}
        <mesh position={[0.05, 0, 0.3]} castShadow>
          <boxGeometry args={[0.06, 0.2, 0.08]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Lock keypad */}
        <mesh position={[0.08, 0.15, 0.3]}>
          <boxGeometry args={[0.02, 0.15, 0.06]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
        {/* Lock LED */}
        <mesh position={[0.09, 0.25, 0.3]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={3} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.05, 0, 0.3]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* ── Security Camera (indoor) ── */}
      <group position={[7, 2.7, -5]}>
        {/* Mount bracket */}
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.06, 0.1]} />
          <meshStandardMaterial color="#222" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Camera body */}
        <mesh position={[0, -0.08, 0.04]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.12, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Lens */}
        <mesh position={[0, -0.12, 0.1]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} />
          <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* IR LED ring */}
        <mesh position={[0, -0.12, 0.11]} rotation={[0.3, 0, 0]}>
          <ringGeometry args={[0.025, 0.035, 12]} />
          <meshStandardMaterial color="#440000" emissive="#330000" emissiveIntensity={1} />
        </mesh>
        {/* Status LED */}
        <mesh position={[0.04, -0.06, 0]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* ── Smart Plug (on coffee table) ── */}
      <group position={[0.4, 0.45, 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.06, 0.06]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <circleGeometry args={[0.015, 8]} />
          <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* ── Bookshelf with smart display ── */}
      <group position={[-7, 0, 3]}>
        <RigidBody type="fixed">
          {/* Shelf frame */}
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[1.5, 2, 0.4]} />
            <meshStandardMaterial color="#5c3a1e" roughness={0.7} />
          </mesh>
          {/* Shelves */}
          {[0.3, 0.8, 1.3, 1.8].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <boxGeometry args={[1.4, 0.03, 0.35]} />
              <meshStandardMaterial color="#4a2a10" roughness={0.6} />
            </mesh>
          ))}
          {/* Books */}
          {[[-0.4, 0.5], [-0.2, 0.5], [0, 0.5], [0.2, 0.5], [-0.3, 1.0], [0.1, 1.0]].map(([x, y], i) => (
            <mesh key={`book-${i}`} position={[x, y, 0]} castShadow>
              <boxGeometry args={[0.08, 0.25, 0.2]} />
              <meshStandardMaterial color={["#cc3333", "#2255aa", "#339933", "#cc8833", "#663399", "#cc6633"][i]} roughness={0.8} />
            </mesh>
          ))}
          <CuboidCollider args={[0.75, 1, 0.2]} position={[0, 1, 0]} />
        </RigidBody>
        {/* Smart display frame on shelf */}
        <mesh position={[0, 1.45, 0.12]} castShadow>
          <boxGeometry args={[0.5, 0.35, 0.03]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.45, 0.14]}>
          <planeGeometry args={[0.45, 0.3]} />
          <meshStandardMaterial color="#001133" emissive="#003366" emissiveIntensity={0.6} />
        </mesh>
        <Text position={[0, 1.48, 0.15]} fontSize={0.03} color="#44aaff" anchorX="center">
          IoT Dashboard
        </Text>
        <Text position={[0, 1.42, 0.15]} fontSize={0.025} color="#00cc88" anchorX="center">
          Temp: 22°C | Hum: 55%
        </Text>
      </group>

      {/* ── Floor Lamp with smart bulb ── */}
      <group position={[5, 0, 3]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 12]} />
          <meshStandardMaterial color="#444" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.65, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.15, 0.25, 12]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ffe8a0" emissive="#ffcc44" emissiveIntensity={3} />
        </mesh>
        <pointLight color="#ffcc66" intensity={1.2} distance={5} position={[0, 1.5, 0]} castShadow />
      </group>

      {/* ── Wall-mounted second screen (side wall) ── */}
      <group position={[8.85, 1.3, -3]}>
        <mesh rotation={[0, -Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[1.2, 0.7, 0.04]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[-0.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.1, 0.6]} />
          <meshStandardMaterial color="#001133" emissive="#002255" emissiveIntensity={0.5} />
        </mesh>
        <Text position={[-0.04, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.06} color="#44aaff" anchorX="center">
          Security Feeds
        </Text>
      </group>

      {/* ── Smart Curtain Motor (on window) ── */}
      <group position={[8.6, 2.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.08, 1.4]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.3} />
        </mesh>
        <mesh position={[0.02, 0, 0.6]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Curtain fabric */}
        <mesh position={[0, -0.6, 0]} castShadow>
          <boxGeometry args={[0.04, 1.2, 1.3]} />
          <meshStandardMaterial color="#8b7060" roughness={0.9} transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Industrial Factory ─────────────────────────────────────

function IndustrialScene() {
  const conveyorRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (conveyorRef.current) {
      (conveyorRef.current.material as THREE.MeshStandardMaterial).map &&
        ((conveyorRef.current.material as THREE.MeshStandardMaterial).map!.offset.x = state.clock.elapsedTime * 0.1);
    }
  });

  return (
    <group>
      {/* Concrete floor */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#2a2520" roughness={0.95} />
      </mesh>

      {/* Yellow safety lines */}
      {[-3, 0, 3].map((z, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.002, z]}>
          <planeGeometry args={[20, 0.12]} />
          <meshStandardMaterial color="#ffdd00" roughness={0.8} />
        </mesh>
      ))}

      {/* Conveyor belt */}
      <group position={[0, 0, 0]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[8, 0.3, 0.8]} />
            <meshStandardMaterial color="#333" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh ref={conveyorRef} position={[0, 0.56, 0]}>
            <boxGeometry args={[7.8, 0.02, 0.7]} />
            <meshStandardMaterial color="#222" roughness={0.9} />
          </mesh>
          {[-3.8, 3.8].map((x, i) => (
            <mesh key={i} position={[x, 0.42, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.75, 12]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          <CuboidCollider args={[4, 0.15, 0.4]} position={[0, 0.4, 0]} />
        </RigidBody>
      </group>

      {/* Industrial robot arm base */}
      <group position={[-4, 0, -3]}>
        <RigidBody type="fixed">
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.5, 0.4, 8]} />
            <meshStandardMaterial color="#ff6600" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.3, 0.3, 8]} />
            <meshStandardMaterial color="#ff6600" roughness={0.3} metalness={0.6} />
          </mesh>
          <CuboidCollider args={[0.5, 0.2, 0.5]} position={[0, 0.2, 0]} />
        </RigidBody>
      </group>

      {/* Control panel */}
      <group position={[5, 0, -4]}>
        <RigidBody type="fixed">
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[0.6, 2, 0.4]} />
            <meshStandardMaterial color="#222" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Panel buttons */}
          {[[0, 1.6], [0, 1.3], [0, 1.0]].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0.21]}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
              <meshStandardMaterial
                color={["#ff3333", "#33ff33", "#ffff33"][i]}
                emissive={["#ff0000", "#00ff00", "#ffff00"][i]}
                emissiveIntensity={0.8}
              />
            </mesh>
          ))}
          {/* Small screen */}
          <mesh position={[0, 1.9, 0.21]}>
            <planeGeometry args={[0.4, 0.25]} />
            <meshStandardMaterial color="#001122" emissive="#002244" emissiveIntensity={1} />
          </mesh>
          <CuboidCollider args={[0.3, 1, 0.2]} position={[0, 1, 0]} />
        </RigidBody>
      </group>

      {/* Overhead industrial lights */}
      {[[-4, 0], [0, 0], [4, 0], [-4, -5], [0, -5], [4, -5]].map(([x, z], i) => (
        <group key={i} position={[x, 5.5, z]}>
          <mesh>
            <boxGeometry args={[0.6, 0.15, 0.3]} />
            <meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.5, 0.04, 0.25]} />
            <meshStandardMaterial color="#ffffee" emissive="#ffffee" emissiveIntensity={3} />
          </mesh>
          <pointLight color="#ffffcc" intensity={1.5} distance={8} castShadow position={[0, -0.3, 0]} />
        </group>
      ))}

      {/* Ceiling structure */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[30, 0.3, 25]} />
        <meshStandardMaterial color="#1a1510" roughness={0.8} />
      </mesh>
      {[-10, -5, 0, 5, 10].map((x, i) => (
        <mesh key={i} position={[x, 3.5, 0]} castShadow>
          <boxGeometry args={[0.15, 7, 0.15]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Warning sign */}
      <group position={[0, 3, -12]}>
        <mesh>
          <planeGeometry args={[1.5, 0.5]} />
          <meshStandardMaterial color="#ffdd00" roughness={0.5} />
        </mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.12} color="#000000" anchorX="center">
          ⚠ AUTOMATION ZONE
        </Text>
      </group>
    </group>
  );
}

// ─── Outdoor Field ─────────────────────────────────────────

function OutdoorFieldScene() {
  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4a7a30" roughness={0.95} />
      </mesh>

      {/* Road */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3, 40]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      {/* Road lines */}
      {Array.from({length: 10}).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, -18 + i*4]}>
          <planeGeometry args={[0.15, 1.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      ))}

      {/* Rolling hills in distance */}
      {[[-20, 0, -20], [20, 0, -25], [-15, 0, -30], [25, 0, -20]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[6 + i, 8, 8, 0, Math.PI*2, 0, Math.PI/2]} />
          <meshStandardMaterial color={["#3a6028", "#356025", "#406830", "#2d5520"][i]} roughness={0.95} />
        </mesh>
      ))}

      {/* Power line poles */}
      {[-6, 0, 6].map((z, i) => (
        <group key={i} position={[8, 0, z * 3]}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 6, 8]} />
            <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
          </mesh>
          <mesh position={[0, 5.8, 0]}>
            <boxGeometry args={[1.2, 0.06, 0.06]} />
            <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Drone landing pad */}
      <group position={[0, 0.01, 5]}>
        <mesh rotation={[-Math.PI/2, 0, 0]}>
          <circleGeometry args={[2, 32]} />
          <meshStandardMaterial color="#444" roughness={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.001, 0]}>
          <ringGeometry args={[1.7, 2, 32]} />
          <meshStandardMaterial color="#ffdd00" roughness={0.5} />
        </mesh>
        <Text rotation={[-Math.PI/2, 0, 0]} position={[0, 0.002, 0]} fontSize={0.4} color="#ffdd00" anchorX="center">
          H
        </Text>
      </group>
    </group>
  );
}

// ─── Desert Scene ──────────────────────────────────────────

function DesertScene() {
  return (
    <group>
      {/* Sandy terrain patches */}
      {[[-8, 0, -6], [6, 0, -8], [-5, 0, 5], [8, 0, 4]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[2 + i * 0.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d4a850" roughness={1} />
        </mesh>
      ))}
      {/* Rocks */}
      {[[-3, 0, -4], [5, 0, 2], [-7, 0, 3]].map(([x, y, z], i) => (
        <mesh key={`rock-${i}`} position={[x, 0.3, z]} castShadow>
          <dodecahedronGeometry args={[0.5 + i * 0.2, 0]} />
          <meshStandardMaterial color="#8a7a60" roughness={0.9} />
        </mesh>
      ))}
      {/* Solar panel array */}
      <group position={[0, 0, -5]}>
        <RigidBody type="fixed">
          {[0, 2, 4].map((x, i) => (
            <group key={i} position={[x - 2, 0, 0]}>
              <mesh position={[0, 1, 0]} rotation={[-0.4, 0, 0]} castShadow>
                <boxGeometry args={[1.8, 0.04, 1.2]} />
                <meshStandardMaterial color="#1a2244" roughness={0.2} metalness={0.6} />
              </mesh>
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.06, 1, 0.06]} />
                <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          ))}
          <CuboidCollider args={[3.5, 0.5, 0.8]} position={[0, 1, 0]} />
        </RigidBody>
      </group>
      {/* Drone landing pad */}
      <group position={[5, 0.01, 5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.5, 24]} />
          <meshStandardMaterial color="#444" roughness={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <ringGeometry args={[1.2, 1.5, 24]} />
          <meshStandardMaterial color="#ffdd00" roughness={0.5} />
        </mesh>
        <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} fontSize={0.4} color="#ffdd00" anchorX="center">
          H
        </Text>
      </group>
    </group>
  );
}

// ─── Warehouse Scene ───────────────────────────────────────

function WarehouseScene() {
  return (
    <group>
      {/* Concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.85} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 7, 0]}>
        <boxGeometry args={[40, 0.2, 30]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      {/* Walls */}
      {[
        { pos: [0, 3.5, -14.9] as [number, number, number], w: 40, h: 7 },
        { pos: [0, 3.5, 14.9] as [number, number, number], w: 40, h: 7 },
        { pos: [-19.9, 3.5, 0] as [number, number, number], w: 30, h: 7, rotY: Math.PI / 2 },
        { pos: [19.9, 3.5, 0] as [number, number, number], w: 30, h: 7, rotY: Math.PI / 2 },
      ].map((w, i) => (
        <mesh key={i} position={w.pos} rotation={[0, (w as any).rotY || 0, 0]}>
          <boxGeometry args={[w.w, w.h, 0.2]} />
          <meshStandardMaterial color="#2a2520" roughness={0.9} />
        </mesh>
      ))}
      {/* Shelving racks */}
      {[-8, -2, 4, 10].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <RigidBody type="fixed">
            {/* Uprights */}
            {[-3, 3].map((z, j) => (
              <mesh key={j} position={[0, 2.5, z]} castShadow>
                <boxGeometry args={[0.08, 5, 0.08]} />
                <meshStandardMaterial color="#ff6600" roughness={0.4} metalness={0.5} />
              </mesh>
            ))}
            {/* Shelves */}
            {[1, 2.5, 4].map((y, j) => (
              <mesh key={`shelf-${j}`} position={[0, y, 0]} castShadow>
                <boxGeometry args={[1.2, 0.04, 6.2]} />
                <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
              </mesh>
            ))}
            {/* Random cargo boxes */}
            {[1.1, 2.6, 4.1].map((y, j) => (
              <mesh key={`cargo-${j}`} position={[0, y + 0.25, (j - 1) * 1.5]} castShadow>
                <boxGeometry args={[0.8, 0.5, 0.6]} />
                <meshStandardMaterial color={["#8b6914", "#555", "#336699"][j]} roughness={0.7} />
              </mesh>
            ))}
            <CuboidCollider args={[0.6, 2.5, 3.1]} position={[0, 2.5, 0]} />
          </RigidBody>
        </group>
      ))}
      {/* Floor markings */}
      {[-5, 0, 5].map((z, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, z]}>
          <planeGeometry args={[30, 0.12]} />
          <meshStandardMaterial color="#ffdd00" roughness={0.5} />
        </mesh>
      ))}
      {/* Overhead lights */}
      {[[-8, 0], [0, 0], [8, 0], [-8, -6], [0, -6], [8, -6]].map(([x, z], i) => (
        <group key={i} position={[x, 6.8, z]}>
          <mesh>
            <boxGeometry args={[0.5, 0.1, 0.3]} />
            <meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.45, 0.03, 0.25]} />
            <meshStandardMaterial color="#ffffee" emissive="#ffffee" emissiveIntensity={3} />
          </mesh>
          <pointLight color="#ffffcc" intensity={1.5} distance={10} castShadow position={[0, -0.3, 0]} />
        </group>
      ))}
    </group>
  );
}


function SceneSky({ config, theme }: { config: EnvironmentConfig; theme: EnvironmentTheme }) {
  const isIndoor = theme === "robotics-lab" || theme === "smart-home" || theme === "warehouse";

  if (isIndoor) {
    return (
      <>
        <color attach="background" args={[config.fogColor]} />
        <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />
      </>
    );
  }

  if (theme === "empty") {
    return (
      <>
        <color attach="background" args={["#0a0d12"]} />
        <Stars radius={80} depth={60} count={3000} factor={4} saturation={0.5} fade />
        <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />
      </>
    );
  }

  return (
    <>
      <Sky
        sunPosition={config.skyConfig.sunPosition}
        turbidity={config.skyConfig.turbidity}
        rayleigh={config.skyConfig.rayleigh}
        mieCoefficient={config.skyConfig.mieCoefficient}
        mieDirectionalG={config.skyConfig.mieDirectionalG}
      />
      <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />
    </>
  );
}

// ─── Main environment renderer ─────────────────────────────

interface Props {
  theme: EnvironmentTheme;
}

export function EnvironmentScene({ theme }: Props) {
  const config = ENVIRONMENT_CONFIGS[theme];

  return (
    <>
      <SceneSky config={config} theme={theme} />

      {/* Lighting */}
      <ambientLight intensity={config.ambientIntensity} color={config.ambientColor} />
      <directionalLight
        position={config.skyConfig.sunPosition}
        intensity={config.sunIntensity}
        color={config.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={[config.ambientColor as any, config.groundColor as any, 0.3]} />

      {/* Ground */}
      <Ground config={config} />

      {/* Scene-specific props */}
      {theme === "robotics-lab"   && <RoboticsLabScene />}
      {theme === "smart-garden"   && <SmartGardenScene />}
      {theme === "smart-home"     && <SmartHomeScene />}
      {theme === "industrial"     && <IndustrialScene />}
      {theme === "outdoor-field"  && <OutdoorFieldScene />}
      {theme === "desert"         && <DesertScene />}
      {theme === "warehouse"      && <WarehouseScene />}
    </>
  );
}
