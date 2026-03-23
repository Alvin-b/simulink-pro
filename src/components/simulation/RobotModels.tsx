import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useSimulationStore, SimComponent } from "@/stores/simulationStore";

// ─── Shared selection handler ─────────────────────────────

function useSelect(id: string) {
  const select = useSimulationStore((s) => s.selectComponent);
  const selected = useSimulationStore((s) => s.selectedComponent === id);
  return { select: (e: any) => { e.stopPropagation(); select(id); }, selected };
}

function SelectionBox({ size, visible }: { size: [number, number, number]; visible: boolean }) {
  if (!visible) return null;
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
    </mesh>
  );
}

// ─── Raspberry Pi 4B ────────────────────────────────────────

export function RaspberryPi4B({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>
        {/* PCB - green, credit-card sized */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.08, 2.0]} />
          <meshStandardMaterial color={selected ? "#118844" : "#0d6e3f"} roughness={0.5} metalness={0.1} />
        </mesh>
        {/* CPU/SoC - silver heat spreader */}
        <mesh position={[0.3, 0.08, 0.2]} castShadow>
          <boxGeometry args={[0.5, 0.06, 0.5]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* RAM chip */}
        <mesh position={[0.3, -0.08, 0.2]} castShadow>
          <boxGeometry args={[0.45, 0.04, 0.45]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* USB 3.0 ports (blue, stacked) */}
        {[0.4, -0.4].map((z, i) => (
          <mesh key={`usb3-${i}`} position={[1.3, 0.14, z]} castShadow>
            <boxGeometry args={[0.35, 0.25, 0.5]} />
            <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        {/* USB 2.0 ports (black, stacked) */}
        <mesh position={[1.3, 0.14, -0.9]}>
          <boxGeometry args={[0.35, 0.25, 0.5]} />
          <meshStandardMaterial color="#555" metalness={0.7} />
        </mesh>
        {/* Ethernet RJ45 */}
        <mesh position={[1.3, 0.15, 0.85]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.45]} />
          <meshStandardMaterial color="#999" metalness={0.7} />
        </mesh>
        {/* Micro HDMI ports */}
        {[0.15, -0.1].map((x, i) => (
          <mesh key={`hdmi-${i}`} position={[x, 0.06, -0.95]} castShadow>
            <boxGeometry args={[0.18, 0.06, 0.12]} />
            <meshStandardMaterial color="#444" metalness={0.6} />
          </mesh>
        ))}
        {/* USB-C power */}
        <mesh position={[-0.6, 0.06, -0.95]}>
          <boxGeometry args={[0.2, 0.06, 0.1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {/* GPIO header 2x20 */}
        <mesh position={[0, 0.12, 0.85]}>
          <boxGeometry args={[1.7, 0.15, 0.15]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={`gpio-${i}`} position={[-0.8 + i * 0.085, 0.2, 0.85]}>
            <boxGeometry args={[0.025, 0.08, 0.025]} />
            <meshStandardMaterial color="#d4a017" metalness={0.8} />
          </mesh>
        ))}
        {/* Power LED */}
        <mesh position={[-1.2, 0.06, -0.5]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>
        {/* Activity LED */}
        <mesh position={[-1.2, 0.06, -0.35]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
        <Text position={[0, 0.06, 0.5]} fontSize={0.12} color="#aaffcc" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Raspberry Pi 4B
        </Text>
        <SelectionBox size={[3.0, 0.4, 2.2]} visible={selected} />
        <CuboidCollider args={[1.4, 0.2, 1.0]} />
      </group>
    </RigidBody>
  );
}

// ─── ESP32-WROOM ────────────────────────────────────────────

export function ESP32Model({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.08, 0.8]} />
          <meshStandardMaterial color={selected ? "#113355" : "#0a2240"} roughness={0.5} />
        </mesh>
        {/* ESP32 module (metal can) */}
        <mesh position={[0.3, 0.08, 0]} castShadow>
          <boxGeometry args={[0.6, 0.1, 0.55]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Antenna trace */}
        <mesh position={[0.8, 0.06, 0]}>
          <boxGeometry args={[0.3, 0.01, 0.4]} />
          <meshStandardMaterial color="#d4a017" metalness={0.8} />
        </mesh>
        {/* USB-C */}
        <mesh position={[-0.85, 0.06, 0]}>
          <boxGeometry args={[0.2, 0.08, 0.25]} />
          <meshStandardMaterial color="#888" metalness={0.8} />
        </mesh>
        {/* Pin headers */}
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={`pin-${i}`} position={[-0.7 + i * 0.1, 0.1, -0.35]}>
            <boxGeometry args={[0.03, 0.12, 0.03]} />
            <meshStandardMaterial color="#d4a017" metalness={0.8} />
          </mesh>
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={`pin2-${i}`} position={[-0.7 + i * 0.1, 0.1, 0.35]}>
            <boxGeometry args={[0.03, 0.12, 0.03]} />
            <meshStandardMaterial color="#d4a017" metalness={0.8} />
          </mesh>
        ))}
        <Text position={[0.3, 0.15, 0]} fontSize={0.07} color="#aaccff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          ESP32-WROOM
        </Text>
        <SelectionBox size={[2.0, 0.3, 1.0]} visible={selected} />
        <CuboidCollider args={[0.9, 0.12, 0.4]} />
      </group>
    </RigidBody>
  );
}

// ─── 2WD Smart Robot Car ────────────────────────────────────

export function Robot2WDCar({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const wheelFL = useRef<THREE.Mesh>(null);
  const wheelFR = useRef<THREE.Mesh>(null);
  const speed = component.properties.speed as number;

  useFrame((_, delta) => {
    if (simState === "running") {
      const rot = speed * delta * 5;
      if (wheelFL.current) wheelFL.current.rotation.x += rot;
      if (wheelFR.current) wheelFR.current.rotation.x += rot;
    }
  });

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.32}>
      <group onClick={select}>
        {/* Chassis - acrylic plate */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.08, 1.2]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} transparent opacity={0.85} />
        </mesh>
        {/* Upper deck */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.6, 0.06, 1.0]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} transparent opacity={0.85} />
        </mesh>
        {/* Standoffs */}
        {[[-0.6, -0.4], [-0.6, 0.4], [0.6, -0.4], [0.6, 0.4]].map(([x, z], i) => (
          <mesh key={`standoff-${i}`} position={[x, 0.2, z]}>
            <cylinderGeometry args={[0.04, 0.04, 0.28, 6]} />
            <meshStandardMaterial color="#d4a017" metalness={0.8} />
          </mesh>
        ))}
        {/* Left wheel */}
        <group position={[-0.5, -0.1, -0.7]}>
          <mesh ref={wheelFL} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.13, 16]} />
            <meshStandardMaterial color="#444" roughness={0.5} />
          </mesh>
        </group>
        {/* Right wheel */}
        <group position={[-0.5, -0.1, 0.7]}>
          <mesh ref={wheelFR} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.13, 16]} />
            <meshStandardMaterial color="#444" roughness={0.5} />
          </mesh>
        </group>
        {/* Left rear wheel */}
        <group position={[0.5, -0.1, -0.7]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        </group>
        {/* Right rear wheel */}
        <group position={[0.5, -0.1, 0.7]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        </group>
        {/* DC Motors */}
        {[-0.7, 0.7].map((z, i) => (
          <mesh key={`motor-${i}`} position={[-0.5, -0.05, z * 0.55]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.35, 8]} />
            <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* Battery pack */}
        <mesh position={[0.3, -0.08, 0]} castShadow>
          <boxGeometry args={[0.6, 0.15, 0.45]} />
          <meshStandardMaterial color="#222" roughness={0.4} />
        </mesh>
        {/* L298N driver board */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.55, 0.06, 0.55]} />
          <meshStandardMaterial color="#cc2222" roughness={0.6} />
        </mesh>
        {/* Arduino on top deck */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.9, 0.06, 0.6]} />
          <meshStandardMaterial color="#006d5b" roughness={0.5} />
        </mesh>
        {/* HC-SR04 at front */}
        <group position={[-0.9, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[0.15, 0.08, 0.55]} />
            <meshStandardMaterial color="#0066cc" />
          </mesh>
          {[-0.12, 0.12].map((z, i) => (
            <mesh key={`trans-${i}`} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
            </mesh>
          ))}
        </group>
        {/* LEDs */}
        <mesh position={[-0.85, 0.08, 0.35]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[-0.85, 0.08, -0.35]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1.5} />
        </mesh>
        <Text position={[0, 0.5, 0]} fontSize={0.1} color="#aaaaff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          2WD Smart Car
        </Text>
        <SelectionBox size={[2.0, 0.8, 1.6]} visible={selected} />
        <CuboidCollider args={[0.9, 0.3, 0.8]} />
      </group>
    </RigidBody>
  );
}

// ─── 4-DOF Robotic Arm ──────────────────────────────────────

export function RobotArm4DOF({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const baseAngle = ((component.properties.baseAngle as number) || 90);
  const shoulderAngle = ((component.properties.shoulderAngle as number) || 90);
  const elbowAngle = ((component.properties.elbowAngle as number) || 90);
  const gripperAngle = ((component.properties.gripperAngle as number) || 90);

  const baseRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (baseRef.current) baseRef.current.rotation.y += (((baseAngle - 90) * Math.PI / 180) - baseRef.current.rotation.y) * 0.1;
    if (shoulderRef.current) shoulderRef.current.rotation.z += (((shoulderAngle - 90) * Math.PI / 180) - shoulderRef.current.rotation.z) * 0.1;
    if (elbowRef.current) elbowRef.current.rotation.z += (((elbowAngle - 90) * Math.PI / 180) - elbowRef.current.rotation.z) * 0.1;
  });

  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>
        {/* Base platform */}
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.15, 16]} />
          <meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Turntable */}
        <group ref={baseRef as any} position={[0, 0.15, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.3, 0.1, 12]} />
            <meshStandardMaterial color="#555" metalness={0.6} />
          </mesh>
          {/* Shoulder servo housing */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.15]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.4} />
          </mesh>
          {/* Upper arm */}
          <group ref={shoulderRef as any} position={[0, 0.3, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, 0.8, 0.06]} />
              <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Elbow joint */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#888" metalness={0.8} />
            </mesh>
            {/* Forearm */}
            <group ref={elbowRef as any} position={[0, 0.45, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.06, 0.6, 0.05]} />
                <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.3} />
              </mesh>
              {/* Gripper */}
              <group position={[0, 0.35, 0]}>
                <mesh position={[-0.06, 0, 0]} castShadow>
                  <boxGeometry args={[0.04, 0.15, 0.04]} />
                  <meshStandardMaterial color="#555" metalness={0.6} />
                </mesh>
                <mesh position={[0.06, 0, 0]} castShadow>
                  <boxGeometry args={[0.04, 0.15, 0.04]} />
                  <meshStandardMaterial color="#555" metalness={0.6} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
        <Text position={[0.5, 0.1, 0]} fontSize={0.08} color="#ffcc00" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          4-DOF Arm
        </Text>
        <SelectionBox size={[1.2, 2.0, 1.2]} visible={selected} />
        <CuboidCollider args={[0.5, 0.8, 0.5]} />
      </group>
    </RigidBody>
  );
}

// ─── Tank Tracked Robot ─────────────────────────────────────

export function RobotTank({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="dynamic" position={component.position} mass={1.5}>
      <group onClick={select}>
        {/* Hull */}
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.4, 1.2]} />
          <meshStandardMaterial color="#3d4f2f" roughness={0.7} metalness={0.3} />
        </mesh>
        {/* Turret */}
        <mesh position={[0.2, 0.35, 0]} castShadow>
          <boxGeometry args={[0.8, 0.25, 0.7]} />
          <meshStandardMaterial color="#334422" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Camera / sensor mount */}
        <mesh position={[0.6, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.15, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* Left track */}
        <mesh position={[0, -0.15, -0.7]} castShadow>
          <boxGeometry args={[2.4, 0.35, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Right track */}
        <mesh position={[0, -0.15, 0.7]} castShadow>
          <boxGeometry args={[2.4, 0.35, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Track wheels */}
        {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
          <group key={`tw-${i}`}>
            <mesh position={[x, -0.15, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.05, 10]} />
              <meshStandardMaterial color="#444" metalness={0.6} />
            </mesh>
            <mesh position={[x, -0.15, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.05, 10]} />
              <meshStandardMaterial color="#444" metalness={0.6} />
            </mesh>
          </group>
        ))}
        <Text position={[0, 0.65, 0]} fontSize={0.1} color="#aaffaa" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Tank Robot
        </Text>
        <SelectionBox size={[2.5, 0.8, 1.6]} visible={selected} />
        <CuboidCollider args={[1.2, 0.3, 0.8]} />
      </group>
    </RigidBody>
  );
}

// ─── Quadcopter Drone ───────────────────────────────────────

export function RobotQuadcopter({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const propRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const throttle = component.properties.throttle as number;
  const armed = component.properties.armed as boolean;

  useFrame((_, delta) => {
    if (armed) {
      propRefs.forEach((ref) => {
        if (ref.current) ref.current.rotation.y += delta * 30;
      });
    }
  });

  const armPositions: [number, number, number][] = [
    [0.6, 0, 0.6], [-0.6, 0, 0.6], [-0.6, 0, -0.6], [0.6, 0, -0.6],
  ];

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.8}>
      <group onClick={select}>
        {/* Center body */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.08, 0.3]} />
          <meshStandardMaterial color="#222" roughness={0.3} />
        </mesh>
        {/* Arms */}
        {armPositions.map((pos, i) => (
          <group key={`arm-${i}`}>
            <mesh position={[pos[0] * 0.5, 0, pos[2] * 0.5]} castShadow>
              <boxGeometry args={[Math.abs(pos[0]) > 0 ? 0.85 : 0.04, 0.04, Math.abs(pos[2]) > 0 ? 0.04 : 0.85]} />
              <meshStandardMaterial color={i < 2 ? "#cc2222" : "#222"} />
            </mesh>
            {/* Motor */}
            <mesh position={pos} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
              <meshStandardMaterial color="#555" metalness={0.7} />
            </mesh>
            {/* Propeller */}
            <mesh ref={propRefs[i]} position={[pos[0], 0.06, pos[2]]}>
              <boxGeometry args={[0.4, 0.01, 0.04]} />
              <meshStandardMaterial color="#888" transparent opacity={armed ? 0.4 : 0.8} />
            </mesh>
          </group>
        ))}
        {/* Battery */}
        <mesh position={[0, -0.08, 0]} castShadow>
          <boxGeometry args={[0.2, 0.08, 0.12]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Landing gear */}
        {[-0.2, 0.2].map((z) => (
          <mesh key={`gear-${z}`} position={[0, -0.18, z]}>
            <boxGeometry args={[0.4, 0.02, 0.02]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        ))}
        <Text position={[0, 0.15, 0]} fontSize={0.06} color="#aaccff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          F450 Drone
        </Text>
        <SelectionBox size={[1.5, 0.4, 1.5]} visible={selected} />
        <CuboidCollider args={[0.7, 0.15, 0.7]} />
      </group>
    </RigidBody>
  );
}

// ─── Hexapod Robot ──────────────────────────────────────────

export function RobotHexapod({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const legAngles = useRef(Array(6).fill(0));
  const simState = useSimulationStore((s) => s.simState);

  useFrame((_, delta) => {
    if (simState === "running") {
      legAngles.current = legAngles.current.map((a, i) => a + delta * (i % 2 === 0 ? 3 : -3));
    }
  });

  const legPositions: [number, number][] = [
    [-0.4, -0.45], [0, -0.5], [0.4, -0.45],
    [-0.4, 0.45], [0, 0.5], [0.4, 0.45],
  ];

  return (
    <RigidBody type="dynamic" position={component.position} mass={1.2}>
      <group onClick={select}>
        {/* Body - hexagonal */}
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.12, 6]} />
          <meshStandardMaterial color="#2d2d3d" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Top shell */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.48, 0.04, 6]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Legs */}
        {legPositions.map(([x, z], i) => (
          <group key={`leg-${i}`} position={[x, -0.05, z]}>
            {/* Coxa */}
            <mesh castShadow>
              <boxGeometry args={[0.15, 0.05, 0.05]} />
              <meshStandardMaterial color="#555" metalness={0.6} />
            </mesh>
            {/* Femur */}
            <mesh position={[z > 0 ? 0.12 : -0.12, -0.1, 0]} castShadow>
              <boxGeometry args={[0.04, 0.2, 0.04]} />
              <meshStandardMaterial color="#d4a017" metalness={0.6} />
            </mesh>
            {/* Tibia */}
            <mesh position={[z > 0 ? 0.15 : -0.15, -0.25, 0]} castShadow>
              <boxGeometry args={[0.03, 0.15, 0.03]} />
              <meshStandardMaterial color="#888" metalness={0.5} />
            </mesh>
            {/* Foot */}
            <mesh position={[z > 0 ? 0.15 : -0.15, -0.33, 0]}>
              <sphereGeometry args={[0.02, 6, 6]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        ))}
        <Text position={[0, 0.15, 0]} fontSize={0.07} color="#ccaaff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Hexapod
        </Text>
        <SelectionBox size={[1.4, 0.6, 1.4]} visible={selected} />
        <CuboidCollider args={[0.6, 0.2, 0.6]} />
      </group>
    </RigidBody>
  );
}

// ─── Humanoid Robot ─────────────────────────────────────────

export function RobotHumanoid({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>
        {/* Head */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="#ddd" roughness={0.3} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.05, 1.63, 0.1]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.05, 1.63, 0.1]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.35, 0.5, 0.2]} />
          <meshStandardMaterial color="#2d2d3d" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Arms */}
        {[-0.25, 0.25].map((x, i) => (
          <group key={`arm-${i}`}>
            <mesh position={[x, 1.3, 0]} castShadow>
              <boxGeometry args={[0.08, 0.3, 0.08]} />
              <meshStandardMaterial color="#555" metalness={0.5} />
            </mesh>
            <mesh position={[x, 1.05, 0]} castShadow>
              <boxGeometry args={[0.07, 0.25, 0.07]} />
              <meshStandardMaterial color="#d4a017" metalness={0.5} />
            </mesh>
            <mesh position={[x, 0.9, 0]}>
              <boxGeometry args={[0.06, 0.08, 0.04]} />
              <meshStandardMaterial color="#888" />
            </mesh>
          </group>
        ))}
        {/* Legs */}
        {[-0.1, 0.1].map((x, i) => (
          <group key={`leg-${i}`}>
            <mesh position={[x, 0.8, 0]} castShadow>
              <boxGeometry args={[0.1, 0.35, 0.1]} />
              <meshStandardMaterial color="#555" metalness={0.5} />
            </mesh>
            <mesh position={[x, 0.5, 0]} castShadow>
              <boxGeometry args={[0.09, 0.3, 0.09]} />
              <meshStandardMaterial color="#d4a017" metalness={0.5} />
            </mesh>
            <mesh position={[x, 0.32, 0.04]} castShadow>
              <boxGeometry args={[0.1, 0.06, 0.16]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        ))}
        <Text position={[0, 1.85, 0]} fontSize={0.07} color="#aaddff" anchorX="center">
          Humanoid 17-DOF
        </Text>
        <SelectionBox size={[0.6, 1.8, 0.4]} visible={selected} />
        <CuboidCollider args={[0.25, 0.9, 0.15]} />
      </group>
    </RigidBody>
  );
}

// ─── Environment Models ─────────────────────────────────────

export function EnvWall({ component }: { component: SimComponent }) {
  return (
    <RigidBody type="fixed" position={component.position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[component.scale[0], component.scale[1], component.scale[2]]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.8} />
      </mesh>
      <CuboidCollider args={[component.scale[0] / 2, component.scale[1] / 2, component.scale[2] / 2]} />
    </RigidBody>
  );
}

export function EnvRamp({ component }: { component: SimComponent }) {
  const angle = (component.properties.angle as number) || 30;
  return (
    <RigidBody type="fixed" position={component.position}>
      <mesh rotation={[0, 0, (-angle * Math.PI) / 180]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshStandardMaterial color="#887755" roughness={0.7} />
      </mesh>
      <CuboidCollider args={[1.5, 0.05, 0.75]} />
    </RigidBody>
  );
}

export function EnvObstacle({ component }: { component: SimComponent }) {
  return (
    <RigidBody type="fixed" position={component.position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[component.scale[0], component.scale[1], component.scale[2]]} />
        <meshStandardMaterial color="#885533" roughness={0.7} />
      </mesh>
      <CuboidCollider args={[component.scale[0] / 2, component.scale[1] / 2, component.scale[2] / 2]} />
    </RigidBody>
  );
}

export function EnvLineTrack({ component }: { component: SimComponent }) {
  const size = (component.properties.size as number) || 8;
  return (
    <group position={component.position}>
      {/* White ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.9} />
      </mesh>
      {/* Black oval track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[size * 0.25, size * 0.27, 32]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function EnvTable({ component }: { component: SimComponent }) {
  const w = (component.properties.width as number) || 2;
  const d = (component.properties.depth as number) || 1;
  const h = (component.properties.height as number) || 0.8;
  return (
    <RigidBody type="fixed" position={component.position}>
      <group>
        {/* Tabletop */}
        <mesh position={[0, h, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.06, d]} />
          <meshStandardMaterial color="#8B7355" roughness={0.6} />
        </mesh>
        {/* Legs */}
        {[[-w/2 + 0.05, -d/2 + 0.05], [w/2 - 0.05, -d/2 + 0.05], [-w/2 + 0.05, d/2 - 0.05], [w/2 - 0.05, d/2 - 0.05]].map(([x, z], i) => (
          <mesh key={i} position={[x, h / 2, z]} castShadow>
            <boxGeometry args={[0.06, h, 0.06]} />
            <meshStandardMaterial color="#6B5B45" roughness={0.7} />
          </mesh>
        ))}
        <CuboidCollider args={[w / 2, 0.03, d / 2]} position={[0, h, 0]} />
      </group>
    </RigidBody>
  );
}

export function EnvConveyor({ component }: { component: SimComponent }) {
  const length = (component.properties.length as number) || 3;
  return (
    <RigidBody type="fixed" position={component.position}>
      <group>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[length, 0.15, 0.6]} />
          <meshStandardMaterial color="#444" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Belt surface */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[length - 0.1, 0.02, 0.5]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
        </mesh>
        {/* Rollers */}
        {[-length/2 + 0.1, length/2 - 0.1].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.55, 12]} />
            <meshStandardMaterial color="#888" metalness={0.7} />
          </mesh>
        ))}
        {/* Side rails */}
        {[-0.32, 0.32].map((z, i) => (
          <mesh key={`rail-${i}`} position={[0, 0.12, z]}>
            <boxGeometry args={[length, 0.08, 0.03]} />
            <meshStandardMaterial color="#666" metalness={0.5} />
          </mesh>
        ))}
        <CuboidCollider args={[length / 2, 0.08, 0.3]} />
      </group>
    </RigidBody>
  );
}
