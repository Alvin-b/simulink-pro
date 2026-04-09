import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useSimulationStore, SimComponent } from "@/stores/simulationStore";

// ─── Shared helpers ───────────────────────────────────────────
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

// Shared material constants
const PCB_GREEN = "#0a5c2e";
const COPPER = "#b87333";
const GOLD = "#d4a017";
const SILVER = "#c8c8c8";
const CHIP_BLACK = "#111111";

// ─── Pin Dot (clickable pin endpoint) ─────────────────────────
function PinDot({
  pos, pinId, componentId, label, color = GOLD
}: {
  pos: [number, number, number];
  pinId: string;
  componentId: string;
  label: string;
  color?: string;
}) {
  const wiringMode = useSimulationStore((s) => s.wiringMode);
  const setWiringMode = useSimulationStore((s) => s.setWiringMode);
  const addWire = useSimulationStore((s) => s.addWire);
  const log = useSimulationStore((s) => s.log);
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!wiringMode.active) return;
    if (!wiringMode.from) {
      setWiringMode({ active: true, from: { componentId, pinId } });
      log("info", `Wire start: ${label} (${componentId})`);
    } else {
      if (wiringMode.from.componentId === componentId && wiringMode.from.pinId === pinId) {
        setWiringMode({ active: false, from: null });
        return;
      }
      addWire(wiringMode.from, { componentId, pinId });
      setWiringMode({ active: false, from: null });
    }
  };
  const isFrom = wiringMode.from?.componentId === componentId && wiringMode.from?.pinId === pinId;
  return (
    <group position={pos} onClick={handleClick}>
      <mesh castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
        <meshStandardMaterial
          color={isFrom ? "#00ffff" : color}
          metalness={0.9} roughness={0.1}
          emissive={wiringMode.active ? (isFrom ? "#00ffff" : "#ffaa00") : "#000"}
          emissiveIntensity={wiringMode.active ? 0.6 : 0}
        />
      </mesh>
    </group>
  );
}

// ─── Raspberry Pi 4B ──────────────────────────────────────────
export function RaspberryPi4B({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const W = 2.4, H = 0.12, D = 1.6;
  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={select}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={selected ? "#0d7a50" : PCB_GREEN} roughness={0.6} metalness={0.05} />
        </mesh>
        <group position={[0.4, H / 2 + 0.02, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.04, 0.4]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
        <group position={[-0.8, H / 2 + 0.08, 0.4]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.16, 0.3]} />
            <meshStandardMaterial color={SILVER} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
        <group position={[-0.8, H / 2 + 0.08, -0.4]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.16, 0.3]} />
            <meshStandardMaterial color={SILVER} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
        <group position={[0.2, H / 2 + 0.06, -0.7]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <group key={i} position={[-0.6 + i * 0.06, 0, 0]}>
              <mesh position={[0, 0, -0.03]}>
                <boxGeometry args={[0.02, 0.12, 0.02]} />
                <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[0, 0, 0.03]}>
                <boxGeometry args={[0.02, 0.12, 0.02]} />
                <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          ))}
        </group>
        <Text position={[0, 0.15, 0]} fontSize={0.08} color="#aaddff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Raspberry Pi 4B
        </Text>
        <SelectionBox size={[W + 0.1, H + 0.2, D + 0.1]} visible={selected} />
        <CuboidCollider args={[W / 2, H / 2, D / 2]} />
      </group>
    </RigidBody>
  );
}

// ─── ESP32 Model ──────────────────────────────────────────────
export function ESP32Model({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const W = 1.4, H = 0.1, D = 0.8;
  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={select}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={selected ? "#1a1a1a" : "#222"} roughness={0.5} />
        </mesh>
        <mesh position={[0.2, H / 2 + 0.02, 0]} castShadow>
          <boxGeometry args={[0.5, 0.04, 0.5]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        <group position={[0, H / 2 + 0.05, 0]}>
          {Array.from({ length: 15 }).map((_, i) => (
            <group key={i} position={[-0.6 + i * 0.08, 0, 0]}>
              <mesh position={[0, 0, -0.35]}>
                <boxGeometry args={[0.02, 0.1, 0.02]} />
                <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[0, 0, 0.35]}>
                <boxGeometry args={[0.02, 0.1, 0.02]} />
                <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          ))}
        </group>
        <Text position={[0, 0.12, 0]} fontSize={0.06} color="#aaddff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          ESP32-WROOM
        </Text>
        <SelectionBox size={[W + 0.1, H + 0.15, D + 0.1]} visible={selected} />
        <CuboidCollider args={[W / 2, H / 2, D / 2]} />
      </group>
    </RigidBody>
  );
}

// ─── 2WD Robot Car ────────────────────────────────────────────
export function Robot2WDCar({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const rbRef = useRef<any>(null);
  const wheelL = useRef<THREE.Mesh>(null);
  const wheelR = useRef<THREE.Mesh>(null);
  const casterRef = useRef<THREE.Group>(null);
  
  const linearVel = (component.properties.linear_vel as number) || 0;
  const angularVel = (component.properties.angular_vel as number) || 0;

  useFrame((_, delta) => {
    if (simState === "running" && rbRef.current) {
      // Apply ROS velocities to the physics body
      // We need to convert local velocities to world velocities
      const rotation = rbRef.current.rotation();
      const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
      
      // Linear velocity in local X direction (forward)
      const forward = new THREE.Vector3(linearVel * 5, 0, 0).applyQuaternion(quat);
      rbRef.current.setLinvel({ x: forward.x, y: rbRef.current.linvel().y, z: forward.z }, true);
      
      // Angular velocity around local Y axis (up)
      rbRef.current.setAngvel({ x: 0, y: -angularVel * 2, z: 0 }, true);

      // Animate wheels based on velocity
      const rot = linearVel * delta * 20;
      if (wheelL.current) wheelL.current.rotation.x += rot;
      if (wheelR.current) wheelR.current.rotation.x += rot;
    }
  });

  return (
    <RigidBody ref={rbRef} type="dynamic" position={component.position} mass={0.5} colliders="cuboid">
      <group onClick={select}>
        {/* ── Lower chassis plate (acrylic, transparent blue-tinted) ── */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.06, 1.3]} />
          <meshStandardMaterial color="#1a2240" roughness={0.2} transparent opacity={0.75} metalness={0.05} />
        </mesh>
        {/* Chassis cutouts / slots (for motor mounts) */}
        {[[-0.5, -0.45], [-0.5, 0.45]].map(([x, z], i) => (
          <mesh key={`slot-${i}`} position={[x, 0, z]}>
            <boxGeometry args={[0.5, 0.07, 0.2]} />
            <meshStandardMaterial color="#0a1020" roughness={0.3} transparent opacity={0.6} />
          </mesh>
        ))}
        {/* ── Upper deck plate ── */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.6, 0.05, 1.1]} />
          <meshStandardMaterial color="#1a2240" roughness={0.2} transparent opacity={0.75} metalness={0.05} />
        </mesh>
        {/* Mounting holes on upper deck */}
        {[[-0.5, -0.35], [-0.5, 0.35], [0.5, -0.35], [0.5, 0.35]].map(([x, z], i) => (
          <mesh key={`hole-${i}`} position={[x, 0.43, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.01, 8]} />
            <meshStandardMaterial color="#0a1020" transparent opacity={0.5} />
          </mesh>
        ))}
        {/* ── Hex standoffs between plates ── */}
        {[[-0.6, -0.42], [-0.6, 0.42], [0.6, -0.42], [0.6, 0.42]].map(([x, z], i) => (
          <mesh key={`standoff-${i}`} position={[x, 0.2, z]}>
            <cylinderGeometry args={[0.04, 0.04, 0.34, 6]} />
            <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.15} />
          </mesh>
        ))}
        {/* ── Yellow TT DC gear motors ── */}
        {[[-0.5, -0.55], [-0.5, 0.55]].map(([x, z], i) => (
          <group key={`motor-${i}`} position={[x, -0.02, z]}>
            {/* Motor body (yellow translucent) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <boxGeometry args={[0.28, 0.22, 0.22]} />
              <meshStandardMaterial color="#e8c820" roughness={0.4} transparent opacity={0.9} />
            </mesh>
            {/* Gearbox section */}
            <mesh position={[0.18, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.22, 0.22]} />
              <meshStandardMaterial color="#ccb020" roughness={0.5} transparent opacity={0.85} />
            </mesh>
            {/* Motor shaft (extends to wheel) */}
            <mesh position={[0, 0, z > 0 ? -0.18 : 0.18]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.14, 8]} />
              <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Motor terminals */}
            <mesh position={[-0.14, 0.08, 0]}>
              <boxGeometry args={[0.03, 0.06, 0.02]} />
              <meshStandardMaterial color="#cc2222" roughness={0.3} />
            </mesh>
            <mesh position={[-0.14, -0.08, 0]}>
              <boxGeometry args={[0.03, 0.06, 0.02]} />
              <meshStandardMaterial color="#111" roughness={0.3} />
            </mesh>
            {/* Speed encoder disc */}
            <mesh position={[0.24, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.005, 16]} />
              <meshStandardMaterial color="#222" roughness={0.3} />
            </mesh>
          </group>
        ))}
        {/* ── Drive wheels (black rubber with spokes) ── */}
        {[[-0.5, -0.75], [-0.5, 0.75]].map(([x, z], i) => {
          const ref = i === 0 ? wheelL : wheelR;
          return (
            <group key={`wheel-${i}`} position={[x, -0.02, z]}>
              {/* Tire */}
              <mesh ref={ref} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.26, 0.26, 0.15, 20]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
              </mesh>
              {/* Tire tread pattern */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.265, 0.265, 0.14, 20, 1, true]} />
                <meshStandardMaterial color="#333" roughness={0.95} />
              </mesh>
              {/* Wheel hub (yellow to match motor) */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.16, 8]} />
                <meshStandardMaterial color="#e8c820" roughness={0.4} />
              </mesh>
              {/* Hub spokes */}
              {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle, j) => (
                <mesh key={j} position={[0, 0, 0]} rotation={[angle, 0, Math.PI / 2]}>
                  <boxGeometry args={[0.14, 0.02, 0.02]} />
                  <meshStandardMaterial color="#ccaa00" roughness={0.4} />
                </mesh>
              ))}
            </group>
          );
        })}
        {/* ── Ball caster wheel (front) ── */}
        <group ref={casterRef} position={[0.7, -0.18, 0]}>
          {/* Housing */}
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.06, 12]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Ball */}
          <mesh position={[0, -0.06, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.15} />
          </mesh>
        </group>
        {/* ── Arduino Uno on upper deck ── */}
        <group position={[0.1, 0.48, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.06, 0.6]} />
            <meshStandardMaterial color="#006d5b" roughness={0.6} metalness={0.1} />
          </mesh>
          {/* ATmega chip */}
          <mesh position={[0.1, 0.04, 0]}>
            <boxGeometry args={[0.25, 0.03, 0.12]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
          {/* USB connector */}
          <mesh position={[-0.4, 0.06, 0]}>
            <boxGeometry args={[0.16, 0.1, 0.2]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Pin headers */}
          {Array.from({ length: 10 }).map((_, j) => (
            <mesh key={j} position={[-0.25 + j * 0.06, 0.06, -0.25]}>
              <boxGeometry args={[0.02, 0.08, 0.02]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
        {/* ── L298N motor driver on lower deck ── */}
        <group position={[-0.1, 0.06, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.05, 0.55]} />
            <meshStandardMaterial color="#cc2222" roughness={0.6} />
          </mesh>
          {/* Heatsink */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.25, 0.12, 0.2]} />
            <meshStandardMaterial color="#222" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Screw terminals */}
          {[-0.22, 0.22].map((z, k) => (
            <mesh key={k} position={[0.22, 0.04, z]}>
              <boxGeometry args={[0.08, 0.04, 0.12]} />
              <meshStandardMaterial color="#00aa44" roughness={0.5} />
            </mesh>
          ))}
        </group>
        {/* ── 4xAA battery holder (underneath) ── */}
        <group position={[0.2, -0.08, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.65, 0.16, 0.5]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
          </mesh>
          {/* Battery terminals */}
          <mesh position={[0.33, 0.04, 0]}>
            <boxGeometry args={[0.04, 0.06, 0.08]} />
            <meshStandardMaterial color="#cc0000" roughness={0.3} />
          </mesh>
          <mesh position={[-0.33, 0.04, 0]}>
            <boxGeometry args={[0.04, 0.06, 0.08]} />
            <meshStandardMaterial color="#222" roughness={0.3} />
          </mesh>
        </group>
        {/* ── HC-SR04 ultrasonic sensor (front bracket) ── */}
        <group position={[0.92, 0.1, 0]}>
          {/* Mounting bracket */}
          <mesh castShadow>
            <boxGeometry args={[0.06, 0.2, 0.55]} />
            <meshStandardMaterial color="#333" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Sensor PCB */}
          <mesh position={[0.06, 0.02, 0]} castShadow>
            <boxGeometry args={[0.06, 0.12, 0.5]} />
            <meshStandardMaterial color="#0066cc" roughness={0.6} />
          </mesh>
          {/* Transducers */}
          {[-0.12, 0.12].map((z, k) => (
            <mesh key={k} position={[0.1, 0.02, z]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 14]} />
              <meshStandardMaterial color={SILVER} metalness={0.85} roughness={0.1} />
            </mesh>
          ))}
          {/* Crystal on PCB */}
          <mesh position={[0.07, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 6]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
        <Text position={[0, 0.65, 0]} fontSize={0.1} color="#aaffaa" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          2WD Robot Car
        </Text>
        <SelectionBox size={[2.1, 0.8, 1.6]} visible={selected} />
        <CuboidCollider args={[0.9, 0.3, 0.7]} />
      </group>
    </RigidBody>
  );
}

// ─── 4WD / Tank Robot ─────────────────────────────────────────
export function RobotTank({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="dynamic" position={component.position} mass={0.8}>
      <group onClick={select}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.4, 1.8]} />
          <meshStandardMaterial color="#333" roughness={0.5} />
        </mesh>
        {/* Tracks */}
        {[-1.0, 1.0].map((z, i) => (
          <mesh key={i} position={[0, -0.1, z]} castShadow>
            <boxGeometry args={[2.4, 0.3, 0.4]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        ))}
        <Text position={[0, 0.3, 0]} fontSize={0.1} color="#aaddff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Tank Robot
        </Text>
        <SelectionBox size={[2.5, 0.6, 2.2]} visible={selected} />
        <CuboidCollider args={[1.1, 0.2, 0.9]} />
      </group>
    </RigidBody>
  );
}

// ─── Robot Arm 4-DOF ──────────────────────────────────────────
export function RobotArm4DOF({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
          <meshStandardMaterial color="#222" roughness={0.4} />
        </mesh>
        <group position={[0, 0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.15, 1.0, 0.15]} />
            <meshStandardMaterial color="#444" roughness={0.5} />
          </mesh>
          <group position={[0, 0.5, 0]}>
            <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
              <boxGeometry args={[0.15, 0.8, 0.15]} />
              <meshStandardMaterial color="#555" roughness={0.5} />
            </mesh>
          </group>
        </group>
        <Text position={[0, 1.5, 0]} fontSize={0.1} color="#aaddff" anchorX="center">
          4-DOF Arm
        </Text>
        <SelectionBox size={[1.0, 2.0, 1.0]} visible={selected} />
        <CuboidCollider args={[0.4, 0.05, 0.4]} />
      </group>
    </RigidBody>
  );
}

// ─── Quadcopter ───────────────────────────────────────────────
export function RobotQuadcopter({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="dynamic" position={component.position} mass={0.4}>
      <group onClick={select}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
          <meshStandardMaterial color="#222" roughness={0.4} />
        </mesh>
        {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.05, 0.1]} />
              <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.01, 16]} />
              <meshStandardMaterial color="#888" transparent opacity={0.3} />
            </mesh>
          </group>
        ))}
        <Text position={[0, 0.2, 0]} fontSize={0.08} color="#aaddff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Quadcopter
        </Text>
        <SelectionBox size={[1.2, 0.2, 1.2]} visible={selected} />
        <CuboidCollider args={[0.2, 0.05, 0.2]} />
      </group>
    </RigidBody>
  );
}

// ─── Hexapod ──────────────────────────────────────────────────
export function RobotHexapod({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="dynamic" position={component.position} mass={0.6}>
      <group onClick={select}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.2, 6]} />
          <meshStandardMaterial color="#222" roughness={0.4} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * Math.PI) / 3;
          return (
            <group key={i} rotation={[0, angle, 0]} position={[0.6, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
                <boxGeometry args={[0.4, 0.08, 0.08]} />
                <meshStandardMaterial color="#444" />
              </mesh>
            </group>
          );
        })}
        <Text position={[0, 0.3, 0]} fontSize={0.1} color="#aaddff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Hexapod
        </Text>
        <SelectionBox size={[1.5, 0.5, 1.5]} visible={selected} />
        <CuboidCollider args={[0.6, 0.1, 0.6]} />
      </group>
    </RigidBody>
  );
}

// ─── Humanoid ─────────────────────────────────────────────────
export function RobotHumanoid({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  return (
    <RigidBody type="dynamic" position={component.position} mass={1.2}>
      <group onClick={select}>
        {/* Torso */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.3]} />
          <meshStandardMaterial color="#333" roughness={0.5} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.65, 0]} castShadow>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial color="#444" roughness={0.4} />
        </mesh>
        {/* Legs */}
        {[-0.15, 0.15].map((x, i) => (
          <group key={i} position={[x, 0.9, 0]}>
            <mesh position={[0, -0.45, 0]} castShadow>
              <boxGeometry args={[0.15, 0.9, 0.15]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          </group>
        ))}
        {/* Arms */}
        {[-0.35, 0.35].map((x, i) => (
          <group key={i} position={[x, 1.4, 0]}>
            <mesh position={[0, -0.3, 0]} castShadow>
              <boxGeometry args={[0.12, 0.6, 0.12]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          </group>
        ))}
        <Text position={[0, 2.0, 0]} fontSize={0.1} color="#aaddff" anchorX="center">
          Humanoid
        </Text>
        <SelectionBox size={[0.8, 2.0, 0.4]} visible={selected} />
        <CuboidCollider args={[0.25, 1.0, 0.15]} position={[0, 1.0, 0]} />
      </group>
    </RigidBody>
  );
}

// ─── Environment Models ───────────────────────────────────────
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.9} />
      </mesh>
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
        <mesh position={[0, h, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.06, d]} />
          <meshStandardMaterial color="#8B7355" roughness={0.6} />
        </mesh>
        {[[-w / 2 + 0.05, -d / 2 + 0.05], [w / 2 - 0.05, -d / 2 + 0.05], [-w / 2 + 0.05, d / 2 - 0.05], [w / 2 - 0.05, d / 2 - 0.05]].map(([x, z], i) => (
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
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[length - 0.1, 0.02, 0.5]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
        </mesh>
        {[-length / 2 + 0.1, length / 2 - 0.1].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.55, 12]} />
            <meshStandardMaterial color="#888" metalness={0.7} />
          </mesh>
        ))}
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
