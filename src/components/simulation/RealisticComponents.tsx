import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useSimulationStore, SimComponent } from "@/stores/simulationStore";

// ─── Shared helpers ────────────────────────────────────────────

function useSelect(id: string) {
  const select   = useSimulationStore((s) => s.selectComponent);
  const selected = useSimulationStore((s) => s.selectedComponent === id);
  return { select: (e: any) => { e.stopPropagation(); select(id); }, selected };
}

function SelectionOutline({ size }: { size: [number,number,number] }) {
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.25} />
    </mesh>
  );
}

// PCB material constants
const PCB_GREEN  = "#0a5c2e";
const COPPER     = "#b87333";
const GOLD       = "#d4a017";
const SILVER     = "#c8c8c8";
const CHIP_BLACK = "#111111";
const SMD_GREY   = "#2a2a2a";

// ─── Pin Dot (clickable pin endpoint for wire mode) ────────────

function PinDot({
  pos, pinId, componentId, label, color = GOLD
}: {
  pos: [number, number, number];
  pinId: string;
  componentId: string;
  label: string;
  color?: string;
}) {
  const wiringMode    = useSimulationStore((s) => s.wiringMode);
  const setWiringMode = useSimulationStore((s) => s.setWiringMode);
  const addWire       = useSimulationStore((s) => s.addWire);
  const log           = useSimulationStore((s) => s.log);

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

// ─── SMD Capacitor ─────────────────────────────────────────────
function SMDCap({ pos, size = 0.04, color = "#4488aa" }: { pos: [number,number,number]; size?: number; color?: string }) {
  return (
    <mesh position={pos} castShadow>
      <boxGeometry args={[size, size*0.6, size*0.5]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
    </mesh>
  );
}

// ─── IC Chip ───────────────────────────────────────────────────
function ICChip({ pos, size, color = CHIP_BLACK, label = "" }: { pos: [number,number,number]; size: [number,number,number]; color?: string; label?: string }) {
  const legs = Math.floor(size[0] / 0.08);
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
      </mesh>
      {Array.from({length: legs}).map((_, i) => (
        <group key={i}>
          <mesh position={[-size[0]/2 + (i+0.5)*(size[0]/legs), -size[1]/2, -size[2]/2 - 0.015]}>
            <boxGeometry args={[0.02, 0.008, 0.03]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[-size[0]/2 + (i+0.5)*(size[0]/legs), -size[1]/2, size[2]/2 + 0.015]}>
            <boxGeometry args={[0.02, 0.008, 0.03]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
      {label && (
        <Text position={[0, size[1]/2+0.002, 0]} fontSize={size[0]*0.12} color="#aaaaaa"
          anchorX="center" rotation={[-Math.PI/2,0,0]}>
          {label}
        </Text>
      )}
    </group>
  );
}

// ─── PCB Trace ─────────────────────────────────────────────────
function PCBTrace({ from, to, width = 0.008 }: { from: [number,number,number]; to: [number,number,number]; width?: number }) {
  const mid: [number,number,number] = [(from[0]+to[0])/2, (from[1]+to[1])/2, (from[2]+to[2])/2];
  const len = Math.sqrt((to[0]-from[0])**2 + (to[2]-from[2])**2);
  const angle = Math.atan2(to[2]-from[2], to[0]-from[0]);
  return (
    <mesh position={mid} rotation={[0, -angle, 0]}>
      <boxGeometry args={[len, 0.001, width]} />
      <meshStandardMaterial color={COPPER} roughness={0.4} metalness={0.7} />
    </mesh>
  );
}

// ─── Realistic Arduino Uno R3 ──────────────────────────────────

export function RealisticArduinoUno({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const wiringMode = useSimulationStore((s) => s.wiringMode);
  const pin13 = component.pins["D13"];
  const ledOn = pin13?.value > 0;

  const W = 2.2, H = 0.12, D = 1.5;

  // Pin definitions for clickable wire mode
  const digitalPins = Array.from({length: 14}, (_, i) => ({
    id: `D${i}`, label: `D${i}`,
    pos: [-0.72 + i * 0.115, H/2 + 0.12, -0.62] as [number,number,number]
  }));
  const analogPins = Array.from({length: 6}, (_, i) => ({
    id: `A${i}`, label: `A${i}`,
    pos: [0.35 + (-0.36 + i * 0.105), H/2 + 0.12, 0.69] as [number,number,number]
  }));
  const powerPins = [
    { id: "5V", label: "5V", pos: [-0.5 + (-0.25), H/2 + 0.12, 0.69] as [number,number,number], color: "#ff4444" },
    { id: "3V3", label: "3.3V", pos: [-0.5 + (-0.15), H/2 + 0.12, 0.69] as [number,number,number], color: "#ff8800" },
    { id: "GND", label: "GND", pos: [-0.5 + (-0.05), H/2 + 0.12, 0.69] as [number,number,number], color: "#333333" },
    { id: "VIN", label: "VIN", pos: [-0.5 + 0.05, H/2 + 0.12, 0.69] as [number,number,number], color: "#ff6600" },
  ];

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={select}>

        {/* ── PCB base ── */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={selected ? "#0d7a50" : PCB_GREEN} roughness={0.6} metalness={0.05} />
        </mesh>

        {/* PCB silkscreen */}
        <mesh position={[0, H/2+0.001, 0]}>
          <boxGeometry args={[W-0.05, 0.001, D-0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.06} />
        </mesh>

        {/* ── ATmega328P main chip ── */}
        <ICChip pos={[0.25, H/2+0.025, 0.1]} size={[0.52, 0.05, 0.52]} label="ATmega328P" />

        {/* ── 16MHz Crystal ── */}
        <group position={[0.25, H/2+0.015, -0.32]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* ── USB-B connector ── */}
        <group position={[-1.0, H/2+0.06, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.32, 0.12, 0.42]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.85} roughness={0.1} />
          </mesh>
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.3]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
        </group>

        {/* ── DC Power Jack ── */}
        <group position={[-0.85, H/2+0.065, -0.6]}>
          <mesh castShadow rotation={[0,0,Math.PI/2] as any}>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 12]} />
            <meshStandardMaterial color="#333" roughness={0.5} />
          </mesh>
          <mesh position={[-0.08, 0, 0]} rotation={[0,0,Math.PI/2] as any}>
            <cylinderGeometry args={[0.05, 0.05, 0.06, 8]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
        </group>

        {/* ── Voltage regulator ── */}
        <group position={[-0.6, H/2+0.03, -0.62]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.06, 0.1]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.1]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* ── Electrolytic caps ── */}
        {[[-0.35, -0.6], [-0.22, -0.6]].map(([x, z], i) => (
          <group key={i} position={[x, H/2+0.06, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.12, 10]} />
              <meshStandardMaterial color={i===0 ? "#334488" : "#333344"} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.065, 0]}>
              <cylinderGeometry args={[0.044, 0.044, 0.01, 10]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.1} />
            </mesh>
          </group>
        ))}

        {/* ── SMD capacitors ── */}
        {[[0.6, 0.5], [0.0, -0.4], [0.8, -0.1], [-0.1, 0.4]].map(([x, z], i) => (
          <SMDCap key={i} pos={[x, H/2+0.01, z]} color={i%2===0 ? "#4488aa" : "#8844aa"} />
        ))}

        {/* ── ATmega16U2 (USB chip) ── */}
        <ICChip pos={[-0.55, H/2+0.015, 0.1]} size={[0.22, 0.03, 0.22]} label="16U2" />

        {/* ── Digital pin header (D0-D13) ── */}
        <group position={[-0.72, H/2+0.05, -0.62]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.08, 0.12]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 14}).map((_, i) => (
            <mesh key={i} position={[-0.72 + i*0.115, 0.06, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── Analog pin header (A0-A5) ── */}
        <group position={[0.35, H/2+0.05, 0.69]}>
          <mesh castShadow>
            <boxGeometry args={[0.65, 0.08, 0.12]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 6}).map((_, i) => (
            <mesh key={i} position={[-0.28 + i*0.105, 0.06, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── Power header ── */}
        <group position={[-0.5, H/2+0.05, 0.69]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.08, 0.12]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {[["#ff4444","5V"],["#ff8800","3V3"],["#333","GND"],["#333","GND"],["#ff6600","VIN"],["#888","RST"]].map(([col, lbl], i) => (
            <mesh key={i} position={[-0.25 + i*0.1, 0.06, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={col} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── Reset button ── */}
        <group position={[0.7, H/2+0.02, 0.62]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.04, 0.1]} />
            <meshStandardMaterial color="#222" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
            <meshStandardMaterial color="#cc2222" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.08, 0]} fontSize={0.04} color="#aaaaaa" rotation={[-Math.PI/2,0,0]} anchorX="center">RST</Text>
        </group>

        {/* ── LEDs ── */}
        {/* PWR LED */}
        <mesh position={[0.7, H/2+0.025, 0.45]} castShadow>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>
        {/* L LED (D13) */}
        <mesh position={[0.7, H/2+0.025, 0.3]} castShadow>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshStandardMaterial
            color={ledOn ? "#ffaa00" : "#443300"}
            emissive={ledOn ? "#ffaa00" : "#000"}
            emissiveIntensity={ledOn ? 3 : 0}
          />
        </mesh>
        {ledOn && <pointLight position={[0.7, 0.3, 0.3]} color="#ffaa00" intensity={0.4} distance={1.5} />}

        {/* ── "ARDUINO UNO" silkscreen ── */}
        {/* @ts-ignore - drei Text prop types */}
        <Text position={[-0.2, H/2+0.005, 0.3]} fontSize={0.1} color="#ffffff" anchorX="center"
          rotation={[-Math.PI/2,0,0]} transparent={true} opacity={0.4}>
          ARDUINO UNO
        </Text>

        {/* ── Clickable pins in wire mode ── */}
        {wiringMode.active && digitalPins.map((p) => (
          <PinDot key={p.id} pos={p.pos} pinId={p.id} componentId={component.id} label={p.label} />
        ))}
        {wiringMode.active && analogPins.map((p) => (
          <PinDot key={p.id} pos={p.pos} pinId={p.id} componentId={component.id} label={p.label} />
        ))}
        {wiringMode.active && powerPins.map((p) => (
          <PinDot key={p.id} pos={p.pos} pinId={p.id} componentId={component.id} label={p.label} color={p.color} />
        ))}

        {selected && <SelectionOutline size={[W+0.1, 0.5, D+0.1]} />}
        <CuboidCollider args={[W/2, H/2+0.05, D/2]} />
      </group>
    </RigidBody>
  );
}

// ─── HC-SR04 Ultrasonic Sensor ─────────────────────────────────

export function RealisticHCSR04({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const simState  = useSimulationStore((s) => s.simState);
  const distance  = (component.properties.distance as number) || 150;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.008}>
      <group onClick={select}>
        {/* PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.95, 0.12, 0.5]} />
          <meshStandardMaterial color="#0066cc" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Transducers */}
        {[-0.2, 0.2].map((z, i) => (
          <group key={i} position={[0.3, 0.08, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
              <meshStandardMaterial color={SILVER} metalness={0.95} roughness={0.05} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
              <meshStandardMaterial color="#333" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* 4-pin header */}
        <group position={[0.3, 0.1, -0.17]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.07, 0.1]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {["VCC","TRIG","ECHO","GND"].map((label, i) => (
            <mesh key={i} position={[-0.16 + i*0.11, 0.06, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={label==="VCC"?"#ff4444":label==="GND"?"#333":GOLD} metalness={0.95} roughness={0.05} />
            </mesh>
          ))}
        </group>
        <ICChip pos={[0.1, 0.06, -0.05]} size={[0.22, 0.03, 0.22]} label="HC-SR04" />
        <SMDCap pos={[-0.15, 0.06, -0.1]} />
        {/* Ultrasonic beam visualization */}
        {simState === "running" && distance > 2 && (
          <group position={[0.3, 0.08, 0]}>
            <mesh rotation={[0, 0, Math.PI/2] as any}>
              <coneGeometry args={[distance*0.01, distance*0.015, 12]} />
              <meshBasicMaterial color="#44aaff" transparent opacity={0.05} />
            </mesh>
          </group>
        )}
        <Text position={[0, 0.07, -0.16]} fontSize={0.055} color="#aaccff" anchorX="center" rotation={[-Math.PI/2,0,0]}>
          HC-SR04
        </Text>
        {selected && <SelectionOutline size={[1.05, 0.35, 0.6]} />}
        <CuboidCollider args={[0.475, 0.1, 0.25]} />
      </group>
    </RigidBody>
  );
}

// ─── DHT22 Sensor ──────────────────────────────────────────────

export function RealisticDHT22({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.004}>
      <group onClick={select}>
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.3, 0.18]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.7} />
        </mesh>
        {Array.from({length: 3}).map((_,row) =>
          Array.from({length: 5}).map((_,col) => (
            <mesh key={`${row}-${col}`} position={[0.14 - col*0.05, 0.08 - row*0.08, 0.092]}>
              <boxGeometry args={[0.025, 0.025, 0.01]} />
              <meshStandardMaterial color="#aaaaaa" roughness={0.8} />
            </mesh>
          ))
        )}
        <Text position={[-0.05, 0.05, 0.095]} fontSize={0.055} color="#333" anchorX="center">DHT22</Text>
        {[-0.08, 0, 0.08].map((x,i) => (
          <mesh key={i} position={[x, -0.22, 0]} castShadow>
            <boxGeometry args={[0.025, 0.15, 0.025]} />
            <meshStandardMaterial color={SILVER} metalness={0.85} roughness={0.1} />
          </mesh>
        ))}
        {selected && <SelectionOutline size={[0.45, 0.55, 0.28]} />}
        <CuboidCollider args={[0.175, 0.15, 0.09]} />
      </group>
    </RigidBody>
  );
}

// ─── MPU-6050 IMU ──────────────────────────────────────────────

export function RealisticMPU6050({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.003}>
      <group onClick={select}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.08, 0.38]} />
          <meshStandardMaterial color="#1a1a44" roughness={0.5} metalness={0.06} />
        </mesh>
        <ICChip pos={[0, 0.06, 0]} size={[0.2, 0.04, 0.2]} label="MPU6050" />
        <SMDCap pos={[0.13, 0.045, 0.1]} />
        <SMDCap pos={[-0.13, 0.045, -0.1]} color="#663344" />
        <group position={[0.17, 0.06, 0]}>
          <mesh><boxGeometry args={[0.1, 0.07, 0.38]} /><meshStandardMaterial color="#111" roughness={0.5} /></mesh>
          {Array.from({length: 8}).map((_,i) => (
            <mesh key={i} position={[0, 0.07, -0.17+i*0.05]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.05} />
            </mesh>
          ))}
        </group>
        <mesh position={[-0.15, 0.05, 0.14]} castShadow>
          <boxGeometry args={[0.035, 0.035, 0.035]} />
          <meshStandardMaterial color="#003300" emissive="#00aa44" emissiveIntensity={0.8} />
        </mesh>
        {selected && <SelectionOutline size={[0.52, 0.3, 0.48]} />}
        <CuboidCollider args={[0.21, 0.09, 0.19]} />
      </group>
    </RigidBody>
  );
}

// ─── SG90 Servo Motor (Realistic) ─────────────────────────────
// Real SG90: 23mm x 12.2mm x 29mm, 180° rotation, 3-wire (brown/red/orange)
// PWM: 1ms = 0°, 1.5ms = 90°, 2ms = 180° at 50Hz

export function RealisticSG90({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const hornRef = useRef<THREE.Group>(null);
  const simState = useSimulationStore((s) => s.simState);

  // Real servo logic: SIGNAL pin value maps to angle
  // In simulation: value 0-255 from analogWrite → 0-180°
  // Or direct angle property set by VM
  const signalVal = component.pins["SIGNAL"]?.value ?? 0;
  const angle = (component.properties.angle as number) ?? 90;

  // Convert PWM value to angle: 0-255 → 0-180°
  const targetAngle = signalVal > 0
    ? Math.round((signalVal / 255) * 180)
    : angle;

  useFrame(() => {
    if (hornRef.current) {
      const targetRad = ((targetAngle - 90) * Math.PI) / 180;
      hornRef.current.rotation.y += (targetRad - hornRef.current.rotation.y) * 0.12;
    }
  });

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.009}>
      <group onClick={select}>
        {/* ── Main body (dark blue-grey plastic) ── */}
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.38, 0.28]} />
          <meshStandardMaterial color="#111122" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Top face */}
        <mesh position={[0, 0.19, 0]}>
          <boxGeometry args={[0.52, 0.01, 0.28]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.2} />
        </mesh>
        {/* Bottom face */}
        <mesh position={[0, -0.19, 0]}>
          <boxGeometry args={[0.52, 0.01, 0.28]} />
          <meshStandardMaterial color="#0a0a1a" roughness={0.3} />
        </mesh>
        {/* Side vents */}
        {[-0.12, 0, 0.12].map((z, i) => (
          <mesh key={i} position={[0.265, 0, z]}>
            <boxGeometry args={[0.01, 0.06, 0.04]} />
            <meshStandardMaterial color="#0a0a1a" roughness={0.5} />
          </mesh>
        ))}
        {/* ── Mounting ears ── */}
        {[-0.35, 0.35].map((x, i) => (
          <group key={i} position={[x, 0, 0.06]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.06, 0.16]} />
              <meshStandardMaterial color="#111122" roughness={0.3} />
            </mesh>
            {/* Mounting hole */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.07, 8]} />
              <meshStandardMaterial color="#080810" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* ── Output shaft housing ── */}
        <mesh position={[0, 0.22, 0.04]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.06, 12]} />
          <meshStandardMaterial color="#222233" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Splined output shaft */}
        <mesh position={[0, 0.26, 0.04]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 12]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* ── Servo horn (rotates) ── */}
        <group ref={hornRef as any} position={[0, 0.3, 0.04]}>
          {/* Hub */}
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.025, 12]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Arm */}
          <mesh position={[0.13, 0, 0]} castShadow>
            <boxGeometry args={[0.24, 0.02, 0.04]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
          </mesh>
          {/* Horn holes */}
          {[0.05, 0.15, 0.22].map((x, i) => (
            <mesh key={i} position={[x, 0.015, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.025, 6]} />
              <meshStandardMaterial color="#cccccc" roughness={0.5} />
            </mesh>
          ))}
        </group>
        {/* ── 3-wire connector (brown=GND, red=VCC, orange=SIGNAL) ── */}
        <group position={[-0.22, -0.22, 0]}>
          {/* Connector housing */}
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.06, 0.1]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
          </mesh>
          {/* Wire cables */}
          {[["#6b4226", "GND"], ["#cc0000", "VCC"], ["#ff8800", "SIG"]].map(([col, lbl], i) => (
            <group key={i} position={[-0.03 + i * 0.03, -0.08, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.2, 5]} />
                <meshStandardMaterial color={col} roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
        {/* Label */}
        <Text position={[0, 0, 0.145]} fontSize={0.06} color="#4488ff" anchorX="center">SG90</Text>
        {/* Angle indicator */}
        <Text position={[0, -0.1, 0.145]} fontSize={0.05} color="#aaaaaa" anchorX="center">
          {`${Math.round(targetAngle)}°`}
        </Text>
        {selected && <SelectionOutline size={[0.85, 0.65, 0.45]} />}
        <CuboidCollider args={[0.26, 0.2, 0.14]} />
      </group>
    </RigidBody>
  );
}

// ─── MG996R Servo Motor (Realistic, larger) ────────────────────

export function RealisticMG996R({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const hornRef = useRef<THREE.Group>(null);

  const signalVal = component.pins["SIGNAL"]?.value ?? 0;
  const angle = (component.properties.angle as number) ?? 90;
  const targetAngle = signalVal > 0 ? Math.round((signalVal / 255) * 180) : angle;

  useFrame(() => {
    if (hornRef.current) {
      const targetRad = ((targetAngle - 90) * Math.PI) / 180;
      hornRef.current.rotation.y += (targetRad - hornRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.055}>
      <group onClick={select}>
        {/* Main body - larger than SG90 */}
        <mesh castShadow>
          <boxGeometry args={[0.72, 0.52, 0.38]} />
          <meshStandardMaterial color="#111122" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Mounting ears */}
        {[-0.48, 0.48].map((x, i) => (
          <group key={i} position={[x, 0, 0.08]}>
            <mesh castShadow>
              <boxGeometry args={[0.24, 0.08, 0.2]} />
              <meshStandardMaterial color="#111122" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
              <meshStandardMaterial color="#080810" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* Output shaft */}
        <mesh position={[0, 0.3, 0.06]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 12]} />
          <meshStandardMaterial color="#222233" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.36, 0.06]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Horn */}
        <group ref={hornRef as any} position={[0, 0.41, 0.06]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 12]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.3} />
          </mesh>
          <mesh position={[0.18, 0, 0]} castShadow>
            <boxGeometry args={[0.32, 0.025, 0.055]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
          </mesh>
        </group>
        {/* 3-wire connector */}
        {[["#6b4226"], ["#cc0000"], ["#ff8800"]].map(([col], i) => (
          <mesh key={i} position={[-0.32 + i * 0.04, -0.32, -0.12]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.3, 5]} />
            <meshStandardMaterial color={col} roughness={0.7} />
          </mesh>
        ))}
        <Text position={[0, 0, 0.2]} fontSize={0.07} color="#4488ff" anchorX="center">MG996R</Text>
        <Text position={[0, -0.15, 0.2]} fontSize={0.055} color="#aaaaaa" anchorX="center">
          {`${Math.round(targetAngle)}°`}
        </Text>
        {selected && <SelectionOutline size={[1.0, 0.8, 0.6]} />}
        <CuboidCollider args={[0.36, 0.26, 0.19]} />
      </group>
    </RigidBody>
  );
}

// ─── DC Motor (Realistic) ──────────────────────────────────────
// Real DC motor: cylindrical body, shaft, mounting holes, 2 terminals

export function RealisticDCMotor({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const shaftRef = useRef<THREE.Mesh>(null);
  const simState = useSimulationStore((s) => s.simState);

  // Motor speed from IN1/IN2 pins (H-bridge logic)
  const in1 = component.pins["IN1"]?.value ?? 0;
  const in2 = component.pins["IN2"]?.value ?? 0;
  const speed = (component.properties.speed as number) ?? 0;

  // Real DC motor logic: IN1=HIGH, IN2=LOW → forward; IN1=LOW, IN2=HIGH → reverse
  const direction = in1 > in2 ? 1 : in1 < in2 ? -1 : 0;
  const motorSpeed = direction !== 0 ? Math.max(speed, 1) : speed;

  useFrame((_, delta) => {
    if (simState === "running" && shaftRef.current && motorSpeed > 0) {
      shaftRef.current.rotation.x += direction * motorSpeed * delta * 8;
    }
  });

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.08}>
      <group onClick={select}>
        {/* ── Motor body (cylindrical) ── */}
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.6, 16]} />
          <meshStandardMaterial color="#222" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* End caps */}
        {[-0.32, 0.32].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
              <meshStandardMaterial color="#444" metalness={0.6} roughness={0.2} />
            </mesh>
            {/* Ventilation holes */}
            {Array.from({length: 6}).map((_, j) => (
              <mesh key={j} position={[0, 0.15 * Math.cos(j * Math.PI / 3), 0.15 * Math.sin(j * Math.PI / 3)]}
                rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 0.05, 6]} />
                <meshStandardMaterial color="#111" roughness={0.5} />
              </mesh>
            ))}
          </group>
        ))}
        {/* ── Output shaft ── */}
        <group position={[0.38, 0, 0]}>
          <mesh ref={shaftRef} castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* D-shaft flat */}
          <mesh position={[0.1, 0.035, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.02, 0.04, 0.28]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
        {/* ── Mounting bracket ── */}
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.5, 0.06, 0.35]} />
          <meshStandardMaterial color="#333" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Mounting holes */}
        {[[-0.18, -0.12], [-0.18, 0.12], [0.18, -0.12], [0.18, 0.12]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.22, z]}>
            <cylinderGeometry args={[0.02, 0.02, 0.08, 6]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
        ))}
        {/* ── Terminals ── */}
        <group position={[-0.3, 0.18, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.08, 0.12]} />
            <meshStandardMaterial color="#333" roughness={0.4} />
          </mesh>
          {/* + terminal */}
          <mesh position={[-0.02, 0.06, -0.03]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.06, 6]} />
            <meshStandardMaterial color="#cc2222" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* - terminal */}
          <mesh position={[-0.02, 0.06, 0.03]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.06, 6]} />
            <meshStandardMaterial color="#222" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
        {/* Speed indicator */}
        {simState === "running" && motorSpeed > 0 && (
          <pointLight position={[0, 0.3, 0]} color="#4488ff" intensity={0.3} distance={1.5} />
        )}
        <Text position={[0, 0.3, 0]} fontSize={0.07} color="#aaaaaa" anchorX="center" rotation={[-Math.PI/2,0,0]}>
          DC Motor
        </Text>
        {selected && <SelectionOutline size={[0.85, 0.55, 0.55]} />}
        <CuboidCollider args={[0.35, 0.22, 0.22]} />
      </group>
    </RigidBody>
  );
}

// ─── NEMA17 Stepper Motor ──────────────────────────────────────

export function RealisticNEMA17({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const shaftRef = useRef<THREE.Mesh>(null);
  const simState = useSimulationStore((s) => s.simState);
  const steps = (component.properties.steps as number) ?? 0;
  const stepRef = useRef(0);

  useFrame((_, delta) => {
    if (simState === "running" && shaftRef.current) {
      stepRef.current += delta * 200; // 200 steps/sec
      shaftRef.current.rotation.y = (stepRef.current * Math.PI * 2) / 200;
    }
  });

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.28}>
      <group onClick={select}>
        {/* Square body (42mm x 42mm x 40mm) */}
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.7, 0.65]} />
          <meshStandardMaterial color="#333" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Front face */}
        <mesh position={[0, 0, 0.33]} castShadow>
          <boxGeometry args={[0.7, 0.7, 0.02]} />
          <meshStandardMaterial color="#444" metalness={0.6} roughness={0.2} />
        </mesh>
        {/* Shaft boss */}
        <mesh position={[0, 0, 0.36]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.04, 12]} rotation={[Math.PI/2,0,0] as any} />
          <meshStandardMaterial color="#555" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Output shaft */}
        <mesh ref={shaftRef} position={[0, 0, 0.55]} castShadow rotation={[Math.PI/2,0,0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Mounting holes */}
        {[[-0.27, -0.27], [-0.27, 0.27], [0.27, -0.27], [0.27, 0.27]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.34]}>
            <cylinderGeometry args={[0.025, 0.025, 0.05, 6]} rotation={[Math.PI/2,0,0] as any} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
        ))}
        {/* Connector */}
        <mesh position={[0, -0.38, -0.2]} castShadow>
          <boxGeometry args={[0.2, 0.06, 0.1]} />
          <meshStandardMaterial color="#333" roughness={0.4} />
        </mesh>
        <Text position={[0, 0, -0.34]} fontSize={0.07} color="#aaaaaa" anchorX="center" rotation={[0,Math.PI,0]}>
          NEMA17
        </Text>
        {selected && <SelectionOutline size={[0.8, 0.8, 0.85]} />}
        <CuboidCollider args={[0.35, 0.35, 0.33]} />
      </group>
    </RigidBody>
  );
}

// ─── L298N Motor Driver ────────────────────────────────────────

export function RealisticL298N({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.03}>
      <group onClick={select}>
        {/* PCB - red */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.08, 0.75]} />
          <meshStandardMaterial color="#cc2222" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* L298N IC */}
        <ICChip pos={[0, 0.07, 0]} size={[0.35, 0.06, 0.35]} label="L298N" />
        {/* Heat sink */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.3, 0.08, 0.3]} />
          <meshStandardMaterial color={SILVER} metalness={0.8} roughness={0.1} />
        </mesh>
        {Array.from({length: 5}).map((_, i) => (
          <mesh key={i} position={[-0.1 + i * 0.05, 0.15, 0]} castShadow>
            <boxGeometry args={[0.01, 0.06, 0.3]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.05} />
          </mesh>
        ))}
        {/* Motor output terminals */}
        <group position={[0.35, 0.06, 0]}>
          {[["#cc2222","OUT1"],[SILVER,"OUT2"],["#cc2222","OUT3"],[SILVER,"OUT4"]].map(([col, lbl], i) => (
            <mesh key={i} position={[0, 0.05, -0.15 + i * 0.1]} castShadow>
              <boxGeometry args={[0.08, 0.08, 0.06]} />
              <meshStandardMaterial color={col} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
        {/* Power terminals */}
        <group position={[-0.35, 0.06, 0]}>
          {[["#cc2222","12V"],[SILVER,"GND"],["#ff8800","5V"]].map(([col, lbl], i) => (
            <mesh key={i} position={[0, 0.05, -0.1 + i * 0.1]} castShadow>
              <boxGeometry args={[0.08, 0.08, 0.06]} />
              <meshStandardMaterial color={col} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
        {/* Control pin header */}
        <group position={[0, 0.08, -0.32]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.06, 0.1]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 7}).map((_, i) => (
            <mesh key={i} position={[-0.3 + i * 0.1, 0.06, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
        <Text position={[0, 0.07, 0.3]} fontSize={0.06} color="#ffaaaa" anchorX="center" rotation={[-Math.PI/2,0,0]}>
          L298N
        </Text>
        {selected && <SelectionOutline size={[0.95, 0.35, 0.85]} />}
        <CuboidCollider args={[0.425, 0.12, 0.375]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic LED 5mm ─────────────────────────────────────────

export function RealisticLED({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const brightness = (component.properties.brightness as number) || 0;
  const isOn       = brightness > 0;
  const colorMap: Record<string,string> = {
    red:"#ff2200", green:"#00ff44", blue:"#2244ff", yellow:"#ffdd00", white:"#ffffff", orange:"#ff8800"
  };
  const ledColor = colorMap[component.properties.color as string] || "#ff2200";
  const dimColor = ledColor + "22";

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.0005}>
      <group onClick={select}>
        {/* LED body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.075, 0.085, 0.11, 16]} />
          <meshStandardMaterial color={isOn ? ledColor : dimColor}
            emissive={isOn ? ledColor : "#000"} emissiveIntensity={isOn ? 2 : 0}
            transparent opacity={0.88} roughness={0.05} metalness={0.0} />
        </mesh>
        {/* Dome */}
        <mesh position={[0, 0.095, 0]} castShadow>
          <sphereGeometry args={[0.075, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} />
          <meshStandardMaterial color={isOn ? ledColor : dimColor}
            emissive={isOn ? ledColor : "#000"} emissiveIntensity={isOn ? 3 : 0}
            transparent opacity={0.85} roughness={0.02} />
        </mesh>
        {/* Die */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.03, 0.02, 0.03]} />
          <meshStandardMaterial color={isOn ? "#ffffff" : "#444"} emissive={isOn ? "#ffffff" : "#000"} emissiveIntensity={isOn ? 5 : 0} />
        </mesh>
        {/* Cathode flat indicator */}
        <mesh position={[-0.06, 0, 0]}>
          <boxGeometry args={[0.01, 0.12, 0.02]} />
          <meshStandardMaterial color="#cccccc" metalness={0.5} transparent opacity={0.5} />
        </mesh>
        {/* Legs */}
        <mesh position={[0.02, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 4]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.02, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.18, 4]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        {isOn && (
          <pointLight color={ledColor} intensity={0.6} distance={1.5} position={[0, 0.15, 0]} />
        )}
        {selected && <SelectionOutline size={[0.2, 0.5, 0.2]} />}
        <CuboidCollider args={[0.08, 0.2, 0.08]} />
      </group>
    </RigidBody>
  );
}
