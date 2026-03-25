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
      log("info", `Wire start: ${label} on ${componentId}`);
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
          metalness={0.9}
          roughness={0.1}
          emissive={wiringMode.active ? (isFrom ? "#00ffff" : "#ffaa00") : "#000"}
          emissiveIntensity={wiringMode.active ? 0.5 : 0}
        />
      </mesh>
    </group>
  );
}

// ─── Raspberry Pi 4B ─────────────────────────────────────────

export function RaspberryPi4B({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const wiringMode = useSimulationStore((s) => s.wiringMode);

  // GPIO pin positions (2x20 header)
  const gpioPins = Array.from({ length: 40 }, (_, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    return { id: `GPIO${i + 1}`, x: -0.8 + row * 0.085, z: 0.82 + col * 0.085 };
  });

  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>
        {/* PCB - green, credit-card sized 85mm x 56mm */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.08, 2.0]} />
          <meshStandardMaterial color={selected ? "#118844" : "#0d6e3f"} roughness={0.5} metalness={0.1} />
        </mesh>
        {/* Silkscreen logo area */}
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[2.6, 0.002, 1.8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.04} roughness={1} />
        </mesh>
        {/* CPU/SoC BCM2711 - silver heat spreader */}
        <mesh position={[0.3, 0.08, 0.2]} castShadow>
          <boxGeometry args={[0.5, 0.06, 0.5]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>
        <Text position={[0.3, 0.12, 0.2]} fontSize={0.05} color="#333" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          BCM2711
        </Text>
        {/* RAM chip (stacked under CPU) */}
        <mesh position={[0.3, -0.06, 0.2]} castShadow>
          <boxGeometry args={[0.45, 0.04, 0.45]} />
          <meshStandardMaterial color="#222" roughness={0.3} />
        </mesh>
        {/* USB 3.0 ports (blue, stacked pair) */}
        {[0.4, -0.4].map((z, i) => (
          <group key={`usb3-${i}`} position={[1.35, 0.14, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.35, 0.28, 0.5]} />
              <meshStandardMaterial color="#4488cc" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* USB port openings */}
            <mesh position={[-0.14, 0.04, 0]}>
              <boxGeometry args={[0.08, 0.08, 0.52]} />
              <meshStandardMaterial color="#001133" roughness={0.5} />
            </mesh>
            <mesh position={[-0.14, -0.06, 0]}>
              <boxGeometry args={[0.08, 0.08, 0.52]} />
              <meshStandardMaterial color="#001133" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* USB 2.0 ports (black, stacked pair) */}
        <group position={[1.35, 0.14, -0.9]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.28, 0.5]} />
            <meshStandardMaterial color="#555" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.14, 0.04, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.52]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          <mesh position={[-0.14, -0.06, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.52]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
        </group>
        {/* Ethernet RJ45 */}
        <group position={[1.35, 0.15, 0.85]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.32, 0.45]} />
            <meshStandardMaterial color="#999" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.18, 0, 0]}>
            <boxGeometry args={[0.1, 0.22, 0.47]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
          </mesh>
          {/* LEDs on RJ45 */}
          <mesh position={[0.15, 0.1, 0.23]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0.15, 0.1, -0.23]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1.5} />
          </mesh>
        </group>
        {/* Micro HDMI ports */}
        {[0.15, -0.1].map((x, i) => (
          <group key={`hdmi-${i}`} position={[x, 0.06, -0.97]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.07, 0.12]} />
              <meshStandardMaterial color="#444" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, -0.04]}>
              <boxGeometry args={[0.12, 0.04, 0.06]} />
              <meshStandardMaterial color="#111" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* USB-C power */}
        <group position={[-0.6, 0.06, -0.97]}>
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.07, 0.12]} />
            <meshStandardMaterial color="#333" metalness={0.5} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[0.1, 0.04, 0.06]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
        </group>
        {/* 3.5mm audio jack */}
        <group position={[-1.0, 0.06, -0.97]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.12, 12]} />
            <meshStandardMaterial color="#222" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
        {/* Camera CSI ribbon connector */}
        <mesh position={[-0.8, 0.06, 0]} castShadow>
          <boxGeometry args={[0.25, 0.04, 0.12]} />
          <meshStandardMaterial color="#333" roughness={0.4} />
        </mesh>
        {/* Display DSI ribbon connector */}
        <mesh position={[-0.4, 0.06, 0]} castShadow>
          <boxGeometry args={[0.25, 0.04, 0.12]} />
          <meshStandardMaterial color="#333" roughness={0.4} />
        </mesh>
        {/* GPIO header 2x20 */}
        <mesh position={[0, 0.1, 0.87]}>
          <boxGeometry args={[1.72, 0.12, 0.18]} />
          <meshStandardMaterial color="#222" roughness={0.5} />
        </mesh>
        {/* GPIO pins */}
        {Array.from({ length: 20 }).map((_, i) => (
          <group key={`gpio-row-${i}`}>
            <mesh position={[-0.82 + i * 0.086, 0.17, 0.82]}>
              <boxGeometry args={[0.025, 0.1, 0.025]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[-0.82 + i * 0.086, 0.17, 0.91]}>
              <boxGeometry args={[0.025, 0.1, 0.025]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        ))}
        {/* Clickable GPIO pins in wire mode */}
        {wiringMode.active && gpioPins.slice(0, 26).map((p) => (
          <PinDot key={p.id} pos={[p.x, 0.22, p.z]} pinId={p.id} componentId={component.id} label={p.id} />
        ))}
        {/* SD card slot */}
        <mesh position={[0.5, -0.05, -0.97]} castShadow>
          <boxGeometry args={[0.35, 0.04, 0.06]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.2} />
        </mesh>
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
        <Text position={[0, 0.06, 0.4]} fontSize={0.1} color="#aaffcc" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Raspberry Pi 4B
        </Text>
        <SelectionBox size={[3.0, 0.4, 2.2]} visible={selected} />
        <CuboidCollider args={[1.4, 0.2, 1.0]} />
      </group>
    </RigidBody>
  );
}

// ─── ESP32-WROOM-32 (Highly Realistic) ────────────────────────

export function ESP32Model({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const wiringMode = useSimulationStore((s) => s.wiringMode);

  // Real ESP32-WROOM-32 DevKit V1 dimensions: ~52mm x 28mm PCB
  // Scale: 1 unit ≈ 10mm → PCB is 5.2 x 2.8 units
  const W = 2.0, H = 0.08, D = 1.1;

  // Real ESP32 DevKit V1 pin layout (19 pins per side)
  const leftPins = [
    "3V3", "GND", "D15", "D2", "D4", "RX2", "TX2", "D5", "D18", "D19",
    "D21", "RX0", "TX0", "D22", "D23"
  ];
  const rightPins = [
    "VIN", "GND", "D13", "D12", "D14", "D27", "D26", "D25", "D33", "D32",
    "D35", "D34", "VN", "VP", "EN"
  ];

  const pinColor = (label: string) => {
    if (label === "3V3") return "#ff4444";
    if (label === "VIN") return "#ff6600";
    if (label === "GND") return "#333333";
    if (label.startsWith("D")) return GOLD;
    if (label === "EN") return "#ff8800";
    return GOLD;
  };

  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>
        {/* ── PCB base (dark blue) ── */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={selected ? "#1a3a6a" : "#0a2240"} roughness={0.5} metalness={0.1} />
        </mesh>

        {/* ── ESP32-WROOM-32 module (metal RF shield can) ── */}
        <group position={[0.2, H / 2 + 0.055, 0]}>
          {/* Metal can */}
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.11, 0.8]} />
            <meshStandardMaterial color="#b0b0b0" metalness={0.92} roughness={0.08} />
          </mesh>
          {/* Module PCB edge (green peeking out) */}
          <mesh position={[0, -0.055, 0]}>
            <boxGeometry args={[0.92, 0.01, 0.82]} />
            <meshStandardMaterial color="#0a5c2e" roughness={0.6} />
          </mesh>
          {/* "ESP32-WROOM-32" silkscreen */}
          <Text position={[0, 0.06, 0]} fontSize={0.055} color="#333333" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
            ESP32-WROOM-32
          </Text>
          {/* Antenna cutout (PCB trace antenna) */}
          <mesh position={[0.5, 0, 0]}>
            <boxGeometry args={[0.12, 0.115, 0.25]} />
            <meshStandardMaterial color="#0a2240" roughness={0.5} />
          </mesh>
          {/* Antenna trace */}
          <mesh position={[0.52, 0.06, 0]}>
            <boxGeometry args={[0.04, 0.005, 0.22]} />
            <meshStandardMaterial color={COPPER} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* ── USB Micro-B connector ── */}
        <group position={[-0.92, H / 2 + 0.04, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.08, 0.22]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.85} roughness={0.1} />
          </mesh>
          <mesh position={[-0.06, 0, 0]}>
            <boxGeometry args={[0.07, 0.05, 0.14]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
        </group>

        {/* ── EN (Reset) button ── */}
        <group position={[0.7, H / 2 + 0.02, -0.42]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.04, 0.1]} />
            <meshStandardMaterial color="#222" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
            <meshStandardMaterial color="#cc2222" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.08, 0]} fontSize={0.04} color="#aaaaaa" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">EN</Text>
        </group>

        {/* ── BOOT button ── */}
        <group position={[0.7, H / 2 + 0.02, 0.42]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.04, 0.1]} />
            <meshStandardMaterial color="#222" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
            <meshStandardMaterial color="#2244cc" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.08, 0]} fontSize={0.04} color="#aaaaaa" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">BOOT</Text>
        </group>

        {/* ── Power LED ── */}
        <mesh position={[-0.6, H / 2 + 0.02, -0.3]} castShadow>
          <boxGeometry args={[0.035, 0.035, 0.035]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>

        {/* ── Left pin header (15 pins) ── */}
        <group position={[-0.65, H / 2 + 0.05, -0.5]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 0.08, 0.1]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {leftPins.map((label, i) => (
            <group key={`lp-${i}`} position={[-0.62 + i * 0.093, 0.06, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.03, 0.12, 0.03]} />
                <meshStandardMaterial color={pinColor(label)} metalness={0.9} roughness={0.1} />
              </mesh>
              {i % 3 === 0 && (
                <Text position={[0, 0.15, 0]} fontSize={0.035} color="#aaaaaa" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
                  {label}
                </Text>
              )}
            </group>
          ))}
        </group>

        {/* ── Right pin header (15 pins) ── */}
        <group position={[-0.65, H / 2 + 0.05, 0.5]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 0.08, 0.1]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {rightPins.map((label, i) => (
            <group key={`rp-${i}`} position={[-0.62 + i * 0.093, 0.06, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.03, 0.12, 0.03]} />
                <meshStandardMaterial color={pinColor(label)} metalness={0.9} roughness={0.1} />
              </mesh>
              {i % 3 === 0 && (
                <Text position={[0, 0.15, 0]} fontSize={0.035} color="#aaaaaa" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
                  {label}
                </Text>
              )}
            </group>
          ))}
        </group>

        {/* ── Clickable pin dots (wire mode) ── */}
        {wiringMode.active && leftPins.map((label, i) => (
          <PinDot
            key={`lpin-${i}`}
            pos={[-0.65 + (-0.62 + i * 0.093), H / 2 + 0.18, -0.5]}
            pinId={label}
            componentId={component.id}
            label={label}
            color={pinColor(label)}
          />
        ))}
        {wiringMode.active && rightPins.map((label, i) => (
          <PinDot
            key={`rpin-${i}`}
            pos={[-0.65 + (-0.62 + i * 0.093), H / 2 + 0.18, 0.5]}
            pinId={label}
            componentId={component.id}
            label={label}
            color={pinColor(label)}
          />
        ))}

        {/* ── SMD capacitors ── */}
        {[[-0.3, 0.35], [0.0, -0.35], [0.5, 0.35]].map(([x, z], i) => (
          <mesh key={`cap-${i}`} position={[x, H / 2 + 0.01, z]} castShadow>
            <boxGeometry args={[0.04, 0.025, 0.025]} />
            <meshStandardMaterial color="#4488aa" roughness={0.3} metalness={0.4} />
          </mesh>
        ))}

        <SelectionBox size={[W + 0.1, 0.4, D + 0.1]} visible={selected} />
        <CuboidCollider args={[W / 2, 0.12, D / 2]} />
      </group>
    </RigidBody>
  );
}

// ─── 2WD Smart Robot Car (Highly Realistic Kit Chassis) ──────

export function Robot2WDCar({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const wheelL = useRef<THREE.Mesh>(null);
  const wheelR = useRef<THREE.Mesh>(null);
  const casterRef = useRef<THREE.Group>(null);
  const speed = (component.properties.speed as number) || 0;

  useFrame((_, delta) => {
    if (simState === "running") {
      const rot = speed * delta * 5;
      if (wheelL.current) wheelL.current.rotation.x += rot;
      if (wheelR.current) wheelR.current.rotation.x += rot;
    }
  });

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.32}>
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

        {/* ── Wiring (colored cables between components) ── */}
        {/* Motor wires */}
        {[
          { from: [-0.3, 0.06, -0.55], to: [-0.5, -0.02, -0.45], color: "#ff2222" },
          { from: [-0.3, 0.06, 0.55], to: [-0.5, -0.02, 0.45], color: "#222222" },
          { from: [0.1, 0.45, -0.25], to: [-0.1, 0.1, -0.22], color: "#ff8800" },
          { from: [0.1, 0.45, 0.25], to: [-0.1, 0.1, 0.22], color: "#ffff00" },
        ].map((wire, i) => {
          const start = new THREE.Vector3(...(wire.from as [number, number, number]));
          const end = new THREE.Vector3(...(wire.to as [number, number, number]));
          const mid = start.clone().add(end).multiplyScalar(0.5);
          mid.y += 0.1;
          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          const points = curve.getPoints(8);
          const geo = new THREE.BufferGeometry().setFromPoints(points);
          return (
            <line key={`wire-${i}`}>
              <primitive object={geo} attach="geometry" />
              <lineBasicMaterial color={wire.color} linewidth={2} />
            </line>
          );
        })}

        {/* ── On/Off toggle switch ── */}
        <mesh position={[-0.7, 0.08, 0]} castShadow>
          <boxGeometry args={[0.12, 0.06, 0.08]} />
          <meshStandardMaterial color="#333" roughness={0.4} />
        </mesh>
        <mesh position={[-0.68, 0.12, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.03]} />
          <meshStandardMaterial color="#cc0000" roughness={0.3} />
        </mesh>

        <Text position={[0, 0.65, 0]} fontSize={0.1} color="#aaffaa" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          2WD Robot Car
        </Text>
        <SelectionBox size={[2.1, 0.8, 1.6]} visible={selected} />
        <CuboidCollider args={[0.9, 0.3, 0.7]} />
              </mesh>
              {/* Tire tread */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.22, 0.22, 0.13, 16, 1, true]} />
                <meshStandardMaterial color="#333" roughness={0.9} />
              </mesh>
              {/* Hub */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 0.14, 8]} />
                <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          );
        })}
        {/* DC Motors */}
        {[[-0.5, -0.55], [-0.5, 0.55]].map(([x, z], i) => (
          <group key={`motor-${i}`} position={[x, -0.05, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.3, 10]} />
              <meshStandardMaterial color="#222" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Motor shaft */}
            <mesh position={[0, 0, z > 0 ? -0.22 : 0.22]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.1, 6]} />
              <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Terminals */}
            <mesh position={[0.08, 0.08, 0]}>
              <boxGeometry args={[0.04, 0.06, 0.04]} />
              <meshStandardMaterial color="#cc2222" roughness={0.4} />
            </mesh>
            <mesh position={[-0.08, 0.08, 0]}>
              <boxGeometry args={[0.04, 0.06, 0.04]} />
              <meshStandardMaterial color="#222" roughness={0.4} />
            </mesh>
          </group>
        ))}
        {/* L298N driver board */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.55, 0.06, 0.55]} />
          <meshStandardMaterial color="#cc2222" roughness={0.6} />
        </mesh>
        {/* Arduino on top deck */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.9, 0.06, 0.6]} />
          <meshStandardMaterial color="#006d5b" roughness={0.6} />
        </mesh>
        {/* Battery pack */}
        <mesh position={[0.3, -0.08, 0]} castShadow>
          <boxGeometry args={[0.6, 0.15, 0.45]} />
          <meshStandardMaterial color="#222" roughness={0.4} />
        </mesh>
        {/* Ultrasonic sensor on front */}
        <group position={[-0.92, 0.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.12, 0.5]} />
            <meshStandardMaterial color="#0066cc" roughness={0.6} />
          </mesh>
          {[-0.12, 0.12].map((z, i) => (
            <mesh key={i} position={[0.06, 0.02, z]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.06, 12]} />
              <meshStandardMaterial color={SILVER} metalness={0.8} roughness={0.1} />
            </mesh>
          ))}
        </group>
        <Text position={[0, 0.65, 0]} fontSize={0.1} color="#aaffaa" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          2WD Robot Car
        </Text>
        <SelectionBox size={[2.1, 0.8, 1.4]} visible={selected} />
        <CuboidCollider args={[0.9, 0.3, 0.6]} />
      </group>
    </RigidBody>
  );
}

// ─── 4WD / Tank Robot ─────────────────────────────────────────

export function RobotTank({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const trackRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (simState === "running" && trackRef.current) {
      trackRef.current.rotation.x += delta * 2;
    }
  });

  return (
    <RigidBody type="dynamic" position={component.position} mass={1.5}>
      <group onClick={select}>
        {/* Main chassis */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.3, 1.4]} />
          <meshStandardMaterial color="#3a3a2a" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Turret */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.8, 0.2, 0.7]} />
          <meshStandardMaterial color="#4a4a3a" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Track assemblies */}
        {[-0.75, 0.75].map((z, i) => (
          <group key={`track-${i}`} position={[0, -0.15, z]}>
            {/* Track belt */}
            <mesh ref={i === 0 ? trackRef : undefined} castShadow>
              <boxGeometry args={[2.0, 0.15, 0.2]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            {/* Front sprocket */}
            <mesh position={[-0.85, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.22, 8]} />
              <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Rear sprocket */}
            <mesh position={[0.85, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.22, 8]} />
              <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Road wheels */}
            {[-0.5, 0, 0.5].map((x, j) => (
              <mesh key={j} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.2, 10]} />
                <meshStandardMaterial color="#444" metalness={0.6} />
              </mesh>
            ))}
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

// ─── 4-DOF Robot Arm ─────────────────────────────────────────

export function RobotArm4DOF({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const j1 = useRef<THREE.Group>(null);
  const j2 = useRef<THREE.Group>(null);
  const j3 = useRef<THREE.Group>(null);
  const j4 = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (simState === "running") {
      t.current += delta * 0.5;
      if (j1.current) j1.current.rotation.y = Math.sin(t.current) * 0.8;
      if (j2.current) j2.current.rotation.z = -0.4 + Math.sin(t.current * 0.7) * 0.3;
      if (j3.current) j3.current.rotation.z = 0.5 + Math.sin(t.current * 0.9) * 0.2;
      if (j4.current) j4.current.rotation.z = Math.sin(t.current * 1.2) * 0.4;
    }
  });

  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>
        {/* Base */}
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.2, 12]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* J1 - Waist rotation */}
        <group ref={j1}>
          {/* Lower arm */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.15, 0.8, 0.15]} />
            <meshStandardMaterial color="#cc2222" roughness={0.3} metalness={0.4} />
          </mesh>
          {/* J2 servo */}
          <group ref={j2} position={[0, 0.95, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.2, 0.12, 0.18]} />
              <meshStandardMaterial color="#222" roughness={0.3} />
            </mesh>
            {/* Upper arm */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.12, 0.7, 0.12]} />
              <meshStandardMaterial color="#cc2222" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* J3 servo */}
            <group ref={j3} position={[0, 0.85, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.18, 0.1, 0.16]} />
                <meshStandardMaterial color="#222" roughness={0.3} />
              </mesh>
              {/* Forearm */}
              <mesh position={[0, 0.35, 0]} castShadow>
                <boxGeometry args={[0.1, 0.55, 0.1]} />
                <meshStandardMaterial color="#cc2222" roughness={0.3} metalness={0.4} />
              </mesh>
              {/* J4 wrist */}
              <group ref={j4} position={[0, 0.65, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.14, 0.08, 0.12]} />
                  <meshStandardMaterial color="#222" roughness={0.3} />
                </mesh>
                {/* Gripper */}
                <group position={[0, 0.12, 0]}>
                  {[-0.06, 0.06].map((x, i) => (
                    <mesh key={i} position={[x, 0.08, 0]} castShadow>
                      <boxGeometry args={[0.04, 0.15, 0.04]} />
                      <meshStandardMaterial color="#888" metalness={0.5} roughness={0.3} />
                    </mesh>
                  ))}
                </group>
              </group>
            </group>
          </group>
        </group>
        <Text position={[0, 2.2, 0]} fontSize={0.08} color="#ffaaaa" anchorX="center">
          4-DOF Arm
        </Text>
        <SelectionBox size={[1.2, 2.4, 1.2]} visible={selected} />
        <CuboidCollider args={[0.5, 0.1, 0.5]} />
      </group>
    </RigidBody>
  );
}

// ─── Quadcopter Drone F450 (Realistic) ────────────────────────

export function RobotQuadcopter({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const propRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const throttle = (component.properties.throttle as number) || 0;
  const armed = component.properties.armed as boolean;
  const altitude = (component.properties.altitude as number) || 0;

  useFrame((_, delta) => {
    if (armed) {
      const speed = 15 + throttle * 0.3;
      propRefs.forEach((ref, i) => {
        if (ref.current) ref.current.rotation.y += delta * speed * (i % 2 === 0 ? 1 : -1);
      });
    }
  });

  // F450 frame: 450mm diagonal → 4 arms at 45°
  const armPositions: [number, number, number][] = [
    [0.7, 0, 0.7],   // Front-Right
    [-0.7, 0, 0.7],  // Front-Left
    [-0.7, 0, -0.7], // Rear-Left
    [0.7, 0, -0.7],  // Rear-Right
  ];
  const motorColors = ["#cc2222", "#cc2222", "#333", "#333"]; // Red = front

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.8}>
      <group onClick={select}>
        {/* ── Center body (Flight Controller stack) ── */}
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.1, 0.35]} />
          <meshStandardMaterial color="#222" roughness={0.3} metalness={0.3} />
        </mesh>
        {/* FC board */}
        <mesh position={[0, 0.07, 0]} castShadow>
          <boxGeometry args={[0.28, 0.02, 0.28]} />
          <meshStandardMaterial color="#0a5c2e" roughness={0.5} />
        </mesh>
        {/* FC chip */}
        <mesh position={[0, 0.09, 0]} castShadow>
          <boxGeometry args={[0.1, 0.02, 0.1]} />
          <meshStandardMaterial color={CHIP_BLACK} roughness={0.2} />
        </mesh>
        {/* Battery (LiPo 3S 11.1V) */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.28, 0.1, 0.12]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.4} />
        </mesh>
        <Text position={[0, -0.1, 0.07]} fontSize={0.04} color="#4488ff" rotation={[0, 0, 0]} anchorX="center">
          3S LiPo
        </Text>

        {/* ── Arms ── */}
        {armPositions.map((pos, i) => {
          const angle = Math.atan2(pos[2], pos[0]);
          const len = Math.sqrt(pos[0] ** 2 + pos[2] ** 2);
          return (
            <group key={`arm-${i}`}>
              {/* Arm tube */}
              <mesh
                position={[pos[0] * 0.5, 0, pos[2] * 0.5]}
                rotation={[0, -angle, 0]}
                castShadow
              >
                <boxGeometry args={[len, 0.04, 0.06]} />
                <meshStandardMaterial color={i < 2 ? "#cc2222" : "#222"} roughness={0.3} metalness={0.3} />
              </mesh>

              {/* Motor housing */}
              <group position={pos}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.08, 0.08, 0.08, 12]} />
                  <meshStandardMaterial color={motorColors[i]} metalness={0.7} roughness={0.2} />
                </mesh>
                {/* Motor bell */}
                <mesh position={[0, 0.05, 0]} castShadow>
                  <cylinderGeometry args={[0.07, 0.08, 0.04, 12]} />
                  <meshStandardMaterial color="#888" metalness={0.8} roughness={0.1} />
                </mesh>
                {/* ESC */}
                <mesh position={[0, -0.1, 0]} castShadow>
                  <boxGeometry args={[0.1, 0.04, 0.06]} />
                  <meshStandardMaterial color="#333" roughness={0.4} />
                </mesh>
                {/* Propeller */}
                <group ref={propRefs[i]} position={[0, 0.09, 0]}>
                  {/* Blade 1 */}
                  <mesh castShadow>
                    <boxGeometry args={[0.55, 0.008, 0.055]} />
                    <meshStandardMaterial
                      color={armed ? "#cccccc" : "#888"}
                      transparent
                      opacity={armed ? 0.35 : 0.9}
                      roughness={0.2}
                    />
                  </mesh>
                  {/* Blade 2 (perpendicular) */}
                  <mesh castShadow rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[0.55, 0.008, 0.055]} />
                    <meshStandardMaterial
                      color={armed ? "#cccccc" : "#888"}
                      transparent
                      opacity={armed ? 0.35 : 0.9}
                      roughness={0.2}
                    />
                  </mesh>
                  {/* Prop hub */}
                  <mesh castShadow>
                    <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
                    <meshStandardMaterial color="#555" metalness={0.7} roughness={0.2} />
                  </mesh>
                </group>
              </group>
            </group>
          );
        })}

        {/* ── Landing gear ── */}
        {[[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]].map(([x, z], i) => (
          <group key={`gear-${i}`} position={[x, -0.12, z]}>
            {/* Leg */}
            <mesh castShadow>
              <boxGeometry args={[0.02, 0.15, 0.02]} />
              <meshStandardMaterial color="#444" roughness={0.5} />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.1, 0]} castShadow>
              <boxGeometry args={[0.12, 0.02, 0.02]} />
              <meshStandardMaterial color="#444" roughness={0.5} />
            </mesh>
          </group>
        ))}

        {/* ── LED indicators ── */}
        <mesh position={[0.7, 0, 0.7]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={armed ? 3 : 0.5} />
        </mesh>
        <mesh position={[-0.7, 0, 0.7]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={armed ? 3 : 0.5} />
        </mesh>
        <mesh position={[0.7, 0, -0.7]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={armed ? 3 : 0.5} />
        </mesh>
        <mesh position={[-0.7, 0, -0.7]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={armed ? 3 : 0.5} />
        </mesh>

        {armed && throttle > 0 && (
          <pointLight position={[0, 0.5, 0]} color="#ffffff" intensity={0.5} distance={3} />
        )}

        <Text position={[0, 0.35, 0]} fontSize={0.07} color="#aaccff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          F450 Quadcopter
        </Text>
        <SelectionBox size={[1.8, 0.5, 1.8]} visible={selected} />
        <CuboidCollider args={[0.8, 0.15, 0.8]} />
      </group>
    </RigidBody>
  );
}

// ─── Hexapod Robot ────────────────────────────────────────────

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
    [-0.4, -0.48], [0, -0.52], [0.4, -0.48],
    [-0.4, 0.48], [0, 0.52], [0.4, 0.48],
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
        {/* Control board */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.3, 0.02, 0.3]} />
          <meshStandardMaterial color="#0a5c2e" roughness={0.5} />
        </mesh>
        {/* Legs */}
        {legPositions.map(([x, z], i) => (
          <group key={`leg-${i}`} position={[x, -0.05, z]}>
            {/* Coxa servo */}
            <mesh castShadow>
              <boxGeometry args={[0.12, 0.06, 0.06]} />
              <meshStandardMaterial color="#111122" roughness={0.3} />
            </mesh>
            {/* Femur */}
            <mesh position={[z > 0 ? 0.14 : -0.14, -0.1, 0]} castShadow>
              <boxGeometry args={[0.04, 0.22, 0.04]} />
              <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Tibia */}
            <mesh position={[z > 0 ? 0.17 : -0.17, -0.28, 0]} castShadow>
              <boxGeometry args={[0.03, 0.18, 0.03]} />
              <meshStandardMaterial color="#888" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Foot */}
            <mesh position={[z > 0 ? 0.17 : -0.17, -0.38, 0]}>
              <sphereGeometry args={[0.025, 6, 6]} />
              <meshStandardMaterial color="#333" roughness={0.8} />
            </mesh>
          </group>
        ))}
        <Text position={[0, 0.2, 0]} fontSize={0.07} color="#ccaaff" rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
          Hexapod
        </Text>
        <SelectionBox size={[1.4, 0.6, 1.4]} visible={selected} />
        <CuboidCollider args={[0.6, 0.2, 0.6]} />
      </group>
    </RigidBody>
  );
}

// ─── Humanoid Robot 17-DOF (Realistic) ────────────────────────

export function RobotHumanoid({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const t = useRef(0);

  // Joint refs
  const lShoulderRef = useRef<THREE.Group>(null);
  const rShoulderRef = useRef<THREE.Group>(null);
  const lElbowRef = useRef<THREE.Group>(null);
  const rElbowRef = useRef<THREE.Group>(null);
  const lHipRef = useRef<THREE.Group>(null);
  const rHipRef = useRef<THREE.Group>(null);
  const lKneeRef = useRef<THREE.Group>(null);
  const rKneeRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const waistRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (simState !== "running") return;
    t.current += delta * 1.2;
    const walk = Math.sin(t.current);
    const walkAlt = Math.sin(t.current + Math.PI);

    // Walking gait
    if (lHipRef.current) lHipRef.current.rotation.x = walk * 0.35;
    if (rHipRef.current) rHipRef.current.rotation.x = walkAlt * 0.35;
    if (lKneeRef.current) lKneeRef.current.rotation.x = Math.max(0, -walk) * 0.5;
    if (rKneeRef.current) rKneeRef.current.rotation.x = Math.max(0, -walkAlt) * 0.5;
    // Arm swing (opposite to legs)
    if (lShoulderRef.current) lShoulderRef.current.rotation.x = walkAlt * 0.25;
    if (rShoulderRef.current) rShoulderRef.current.rotation.x = walk * 0.25;
    // Head slight bob
    if (headRef.current) headRef.current.rotation.y = Math.sin(t.current * 0.5) * 0.1;
  });

  // Servo joint visual
  const ServoJoint = ({ pos, size = [0.1, 0.06, 0.1] as [number, number, number] }) => (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#111122" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Servo horn */}
      <mesh position={[0, size[1] / 2 + 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
        <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );

  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={select}>

        {/* ── Head ── */}
        <group ref={headRef} position={[0, 1.72, 0]}>
          {/* Skull */}
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.22, 0.22]} />
            <meshStandardMaterial color="#ddd" roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Face plate */}
          <mesh position={[0, 0, 0.115]}>
            <boxGeometry args={[0.2, 0.18, 0.01]} />
            <meshStandardMaterial color="#ccc" roughness={0.2} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.055, 0.03, 0.118]}>
            <boxGeometry args={[0.045, 0.03, 0.01]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.055, 0.03, 0.118]}>
            <boxGeometry args={[0.045, 0.03, 0.01]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2} />
          </mesh>
          {/* Mouth LED strip */}
          <mesh position={[0, -0.05, 0.118]}>
            <boxGeometry args={[0.1, 0.01, 0.01]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1.5} />
          </mesh>
          {/* Head pan servo */}
          <ServoJoint pos={[0, -0.14, 0]} size={[0.14, 0.06, 0.12]} />
        </group>

        {/* ── Neck ── */}
        <mesh position={[0, 1.58, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.1, 8]} />
          <meshStandardMaterial color="#888" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* ── Torso ── */}
        <group ref={waistRef}>
          {/* Upper torso */}
          <mesh position={[0, 1.25, 0]} castShadow>
            <boxGeometry args={[0.38, 0.42, 0.22]} />
            <meshStandardMaterial color="#2d2d3d" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Chest panel */}
          <mesh position={[0, 1.28, 0.115]}>
            <boxGeometry args={[0.3, 0.32, 0.01]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.3} />
          </mesh>
          {/* Chest LEDs */}
          {[-0.08, 0, 0.08].map((x, i) => (
            <mesh key={i} position={[x, 1.35, 0.122]}>
              <boxGeometry args={[0.025, 0.025, 0.005]} />
              <meshStandardMaterial color="#00ffaa" emissive="#00ffaa" emissiveIntensity={1.5} />
            </mesh>
          ))}
          {/* Waist servo */}
          <ServoJoint pos={[0, 0.98, 0]} size={[0.2, 0.08, 0.16]} />
          {/* Lower torso / pelvis */}
          <mesh position={[0, 0.88, 0]} castShadow>
            <boxGeometry args={[0.32, 0.14, 0.18]} />
            <meshStandardMaterial color="#2d2d3d" roughness={0.4} metalness={0.3} />
          </mesh>

          {/* ── Left Arm ── */}
          <group ref={lShoulderRef} position={[-0.26, 1.38, 0]}>
            {/* Shoulder servo */}
            <ServoJoint pos={[0, 0, 0]} size={[0.1, 0.1, 0.1]} />
            {/* Upper arm */}
            <mesh position={[0, -0.18, 0]} castShadow>
              <boxGeometry args={[0.09, 0.28, 0.09]} />
              <meshStandardMaterial color="#555" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Elbow servo */}
            <group ref={lElbowRef} position={[0, -0.34, 0]}>
              <ServoJoint pos={[0, 0, 0]} size={[0.09, 0.07, 0.09]} />
              {/* Forearm */}
              <mesh position={[0, -0.18, 0]} castShadow>
                <boxGeometry args={[0.08, 0.28, 0.08]} />
                <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.3} />
              </mesh>
              {/* Hand */}
              <mesh position={[0, -0.36, 0]} castShadow>
                <boxGeometry args={[0.07, 0.1, 0.05]} />
                <meshStandardMaterial color="#888" roughness={0.4} />
              </mesh>
            </group>
          </group>

          {/* ── Right Arm ── */}
          <group ref={rShoulderRef} position={[0.26, 1.38, 0]}>
            <ServoJoint pos={[0, 0, 0]} size={[0.1, 0.1, 0.1]} />
            <mesh position={[0, -0.18, 0]} castShadow>
              <boxGeometry args={[0.09, 0.28, 0.09]} />
              <meshStandardMaterial color="#555" metalness={0.5} roughness={0.3} />
            </mesh>
            <group ref={rElbowRef} position={[0, -0.34, 0]}>
              <ServoJoint pos={[0, 0, 0]} size={[0.09, 0.07, 0.09]} />
              <mesh position={[0, -0.18, 0]} castShadow>
                <boxGeometry args={[0.08, 0.28, 0.08]} />
                <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.36, 0]} castShadow>
                <boxGeometry args={[0.07, 0.1, 0.05]} />
                <meshStandardMaterial color="#888" roughness={0.4} />
              </mesh>
            </group>
          </group>

          {/* ── Left Leg ── */}
          <group ref={lHipRef} position={[-0.1, 0.82, 0]}>
            <ServoJoint pos={[0, 0, 0]} size={[0.1, 0.08, 0.1]} />
            {/* Thigh */}
            <mesh position={[0, -0.22, 0]} castShadow>
              <boxGeometry args={[0.1, 0.36, 0.1]} />
              <meshStandardMaterial color="#555" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Knee servo */}
            <group ref={lKneeRef} position={[0, -0.42, 0]}>
              <ServoJoint pos={[0, 0, 0]} size={[0.1, 0.08, 0.1]} />
              {/* Shin */}
              <mesh position={[0, -0.2, 0]} castShadow>
                <boxGeometry args={[0.09, 0.32, 0.09]} />
                <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.3} />
              </mesh>
              {/* Foot */}
              <mesh position={[0.02, -0.4, 0.04]} castShadow>
                <boxGeometry args={[0.1, 0.06, 0.18]} />
                <meshStandardMaterial color="#333" roughness={0.6} />
              </mesh>
            </group>
          </group>

          {/* ── Right Leg ── */}
          <group ref={rHipRef} position={[0.1, 0.82, 0]}>
            <ServoJoint pos={[0, 0, 0]} size={[0.1, 0.08, 0.1]} />
            <mesh position={[0, -0.22, 0]} castShadow>
              <boxGeometry args={[0.1, 0.36, 0.1]} />
              <meshStandardMaterial color="#555" metalness={0.5} roughness={0.3} />
            </mesh>
            <group ref={rKneeRef} position={[0, -0.42, 0]}>
              <ServoJoint pos={[0, 0, 0]} size={[0.1, 0.08, 0.1]} />
              <mesh position={[0, -0.2, 0]} castShadow>
                <boxGeometry args={[0.09, 0.32, 0.09]} />
                <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.3} />
              </mesh>
              <mesh position={[0.02, -0.4, 0.04]} castShadow>
                <boxGeometry args={[0.1, 0.06, 0.18]} />
                <meshStandardMaterial color="#333" roughness={0.6} />
              </mesh>
            </group>
          </group>
        </group>

        <Text position={[0, 2.05, 0]} fontSize={0.07} color="#aaddff" anchorX="center">
          Humanoid 17-DOF
        </Text>
        <SelectionBox size={[0.7, 2.1, 0.45]} visible={selected} />
        <CuboidCollider args={[0.3, 1.0, 0.2]} position={[0, 1.0, 0]} />
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
