import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera, Line, Text } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";
import {
  RaspberryPi4B,
  ESP32Model,
  Robot2WDCar,
  RobotArm4DOF,
  RobotTank,
  RobotQuadcopter,
  RobotHexapod,
  RobotHumanoid,
  EnvWall,
  EnvRamp,
  EnvObstacle,
  EnvLineTrack,
  EnvTable,
  EnvConveyor,
} from "./RobotModels";

// ─── Generic Fallback Model ────────────────────────────────
// Renders any component that doesn't have a dedicated 3D model
// as a colored chip/box with its name and category color.

const CATEGORY_COLORS: Record<string, string> = {
  microcontroller: "#006d5b",
  microcomputer:   "#1a4a7a",
  sensor:          "#1a3a6a",
  actuator:        "#3a1a1a",
  passive:         "#3a3020",
  output:          "#3a2a10",
  input:           "#1a2a3a",
  display:         "#2a1a4a",
  communication:   "#1a3a2a",
  power:           "#3a2a00",
  robot:           "#2a1a3a",
  environment:     "#2a3a1a",
};

const CATEGORY_ACCENT: Record<string, string> = {
  microcontroller: "#00d4aa",
  microcomputer:   "#4488ff",
  sensor:          "#44aaff",
  actuator:        "#ff6644",
  passive:         "#ffcc44",
  output:          "#ff9922",
  input:           "#44ccff",
  display:         "#aa44ff",
  communication:   "#44ffaa",
  power:           "#ffdd00",
  robot:           "#cc44ff",
  environment:     "#88cc44",
};

function GenericComponentModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);

  const bgColor  = CATEGORY_COLORS[component.category] ?? "#1a2030";
  const accent   = CATEGORY_ACCENT[component.category]  ?? "#00d4ff";

  // Size based on category
  const size: [number, number, number] =
    component.category === "passive"        ? [0.3, 0.12, 0.2]  :
    component.category === "sensor"         ? [0.55, 0.14, 0.35] :
    component.category === "display"        ? [0.7,  0.08, 0.5]  :
    component.category === "communication"  ? [0.5,  0.12, 0.35] :
    component.category === "power"          ? [0.6,  0.18, 0.4]  :
    component.category === "microcontroller"? [0.9,  0.1,  0.6]  :
    component.category === "microcomputer"  ? [1.2,  0.1,  0.8]  :
    component.category === "actuator"       ? [0.55, 0.35, 0.35] :
    component.category === "input"          ? [0.35, 0.15, 0.35] :
                                              [0.5,  0.12, 0.4];

  const bodyH  = size[1];
  const pinCount = Math.min(Object.keys(component.pins ?? {}).length, 16);

  return (
    <RigidBody
      type={component.isStatic ? "fixed" : "dynamic"}
      position={component.position}
      mass={(component.mass ?? 10) / 1000}
    >
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>

        {/* PCB body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial
            color={selected ? `${accent}55` : bgColor}
            roughness={0.5}
            metalness={0.15}
            emissive={selected ? accent : "#000000"}
            emissiveIntensity={selected ? 0.15 : 0}
          />
        </mesh>

        {/* Top accent stripe */}
        <mesh position={[0, bodyH / 2 + 0.005, 0]}>
          <boxGeometry args={[size[0] * 0.6, 0.004, size[2] * 0.6]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
        </mesh>

        {/* Chip on top */}
        <mesh position={[0, bodyH / 2 + 0.012, 0]} castShadow>
          <boxGeometry args={[size[0] * 0.35, 0.02, size[2] * 0.35]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>

        {/* Pin headers along bottom edge */}
        {Array.from({ length: pinCount }).map((_, i) => {
          const spacing = size[0] / (pinCount + 1);
          return (
            <mesh key={`pin-${i}`} position={[-size[0] / 2 + spacing * (i + 1), -bodyH / 2 - 0.06, size[2] / 2]}>
              <boxGeometry args={[0.025, 0.1, 0.025]} />
              <meshStandardMaterial color="#d4a017" metalness={0.9} roughness={0.1} />
            </mesh>
          );
        })}

        {/* Component label */}
        <Text
          position={[0, bodyH / 2 + 0.04, 0]}
          fontSize={Math.min(0.09, size[0] * 0.12)}
          color={accent}
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
          maxWidth={size[0] * 0.9}
        >
          {component.name}
        </Text>

        {/* Selection wireframe */}
        {selected && (
          <mesh>
            <boxGeometry args={[size[0] + 0.1, size[1] + 0.2, size[2] + 0.1]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}

        <CuboidCollider args={[size[0] / 2, size[1] / 2 + 0.05, size[2] / 2]} />
      </group>
    </RigidBody>
  );
}

// ─── Arduino 3D Model ──────────────────────────────────────

function ArduinoModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);
  const pin13    = component.pins["D13"];
  const ledOn    = pin13 && pin13.value > 0;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        {/* PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.12, 1.5]} />
          <meshStandardMaterial
            color={selected ? "#00997a" : "#006d5b"}
            roughness={0.6} metalness={0.1}
            emissive={selected ? "#003d30" : "#000000"}
          />
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
        {/* Pin headers — digital */}
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={`pt-${i}`} position={[-0.8 + i * 0.12, 0.12, -0.6]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#d4a017" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        {/* Pin headers — analog */}
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={`pb-${i}`} position={[-0.8 + i * 0.12, 0.12, 0.6]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#d4a017" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        {/* Built-in LED (pin 13) */}
        <mesh position={[0.7, 0.12, -0.3]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color={ledOn ? "#00ff00" : "#004400"}
            emissive={ledOn ? "#00ff00" : "#000000"}
            emissiveIntensity={ledOn ? 3 : 0}
          />
        </mesh>
        {ledOn && (
          <pointLight position={[0.7, 0.25, -0.3]} color="#00ff00" intensity={0.5} distance={1.5} />
        )}
        {/* Power LED — always on */}
        <mesh position={[0.7, 0.12, -0.15]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
        </mesh>
        <Text
          position={[0, 0.13, 0.25]} fontSize={0.12} color="#aaffdd"
          anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}
        >
          ARDUINO UNO
        </Text>
        {selected && (
          <mesh>
            <boxGeometry args={[2.4, 0.4, 1.7]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[1.1, 0.15, 0.75]} />
      </group>
    </RigidBody>
  );
}

// ─── LED 3D Model ───────────────────────────────────────────

function LedModel({ component }: { component: any }) {
  const selected   = useSimulationStore((s) => s.selectedComponent === component.id);
  const select     = useSimulationStore((s) => s.selectComponent);
  const brightness = (component.properties.brightness as number) || 0;
  const isOn       = brightness > 0;
  const ledColor   = component.properties.color === "green" ? "#00ff44"
                   : component.properties.color === "blue"  ? "#2244ff"
                   : component.properties.color === "yellow"? "#ffdd00"
                   : "#ff3322";
  const offColor   = isOn ? ledColor : "#220808";

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={(component.mass ?? 1) / 1000}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
          <meshStandardMaterial color={isOn ? ledColor : offColor} emissive={isOn ? ledColor : "#000"} emissiveIntensity={isOn ? 3 : 0} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.08, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={isOn ? ledColor : offColor} emissive={isOn ? ledColor : "#000"} emissiveIntensity={isOn ? 4 : 0} transparent opacity={0.85} />
        </mesh>
        <mesh position={[-0.03, -0.15, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.2, 4]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
        </mesh>
        <mesh position={[0.03, -0.18, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 4]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
        </mesh>
        {isOn && <pointLight position={[0, 0.15, 0]} color={ledColor} intensity={0.8} distance={2} />}
        {selected && (
          <mesh>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[0.08, 0.2, 0.08]} />
      </group>
    </RigidBody>
  );
}

// ─── Resistor 3D Model ─────────────────────────────────────

function ResistorModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.001}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        {[[-0.08, "#ff0000"], [-0.03, "#ff0000"], [0.02, "#8B4513"], [0.09, "#d4a017"]].map(([pos, col], i) => (
          <mesh key={i} position={[0, pos as number, 0]}>
            <cylinderGeometry args={[0.052, 0.052, 0.025, 8]} />
            <meshStandardMaterial color={col as string} />
          </mesh>
        ))}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 4]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 4]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
        </mesh>
        {selected && (
          <mesh>
            <boxGeometry args={[0.15, 0.5, 0.15]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[0.05, 0.2, 0.05]} />
      </group>
    </RigidBody>
  );
}

// ─── Servo 3D Model ─────────────────────────────────────────

function ServoModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);
  const hornRef  = useRef<THREE.Group>(null);
  const angle    = (component.properties.angle as number) || 90;

  useFrame(() => {
    if (hornRef.current) {
      const targetRad = ((angle - 90) * Math.PI) / 180;
      hornRef.current.rotation.y += (targetRad - hornRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={(component.mass ?? 9) / 1000}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.35, 0.25]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.15, 0.18]} castShadow>
          <boxGeometry args={[0.65, 0.04, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <group ref={hornRef as any} position={[0, 0.2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0.12, 0.03, 0]}>
            <boxGeometry args={[0.2, 0.02, 0.04]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
        <mesh position={[-0.2, -0.2, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {selected && (
          <mesh>
            <boxGeometry args={[0.6, 0.5, 0.35]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[0.25, 0.2, 0.125]} />
      </group>
    </RigidBody>
  );
}

// ─── Ultrasonic Sensor ──────────────────────────────────────

function UltrasonicModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);
  const simState = useSimulationStore((s) => s.simState);
  const distance = (component.properties.distance as number) || 0;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={(component.mass ?? 8) / 1000}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.12, 0.4]} />
          <meshStandardMaterial color="#0066cc" roughness={0.6} />
        </mesh>
        {/* Transducers */}
        {[-0.18, 0.18].map((x, i) => (
          <mesh key={i} position={[x, 0.06, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
        {/* Beam visualization when running */}
        {simState === "running" && (
          <mesh position={[0, 0.06, 0.2 + distance * 0.005]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[distance * 0.008, distance * 0.01, 8]} />
            <meshBasicMaterial color="#00aaff" transparent opacity={0.08} />
          </mesh>
        )}
        <Text position={[0, 0.08, -0.12]} fontSize={0.06} color="#aaccff" anchorX="center" rotation={[-Math.PI / 2, 0, 0]}>
          HC-SR04
        </Text>
        {selected && (
          <mesh>
            <boxGeometry args={[0.9, 0.3, 0.5]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[0.4, 0.12, 0.2]} />
      </group>
    </RigidBody>
  );
}

// ─── Button ─────────────────────────────────────────────────

function ButtonModel({ component }: { component: any }) {
  const selected    = useSimulationStore((s) => s.selectedComponent === component.id);
  const select      = useSimulationStore((s) => s.selectComponent);
  const updateProp  = useSimulationStore((s) => s.updateComponentProperty);
  const updatePin   = useSimulationStore((s) => s.updatePinValue);
  const propagate   = useSimulationStore((s) => s.propagateSignals);
  const pressed     = component.properties.pressed as boolean;

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    select(component.id);
    const next = !pressed;
    updateProp(component.id, "pressed", next);
    updatePin(component.id, "PIN1", next ? 1 : 0);
    updatePin(component.id, "PIN2", next ? 1 : 0);
    propagate();
  }, [component.id, pressed, select, updateProp, updatePin, propagate]);

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.002}>
      <group onClick={handleClick}>
        <mesh castShadow>
          <boxGeometry args={[0.25, 0.1, 0.25]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, pressed ? 0.05 : 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, pressed ? 0.04 : 0.08, 12]} />
          <meshStandardMaterial color={pressed ? "#ff4444" : "#cc3333"} />
        </mesh>
        {[[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.1, z]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1, 4]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
          </mesh>
        ))}
        {selected && (
          <mesh>
            <boxGeometry args={[0.35, 0.25, 0.35]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[0.125, 0.1, 0.125]} />
      </group>
    </RigidBody>
  );
}

// ─── Buzzer ─────────────────────────────────────────────────

function BuzzerModel({ component }: { component: any }) {
  const selected  = useSimulationStore((s) => s.selectedComponent === component.id);
  const select    = useSimulationStore((s) => s.selectComponent);
  const active    = component.properties.active as boolean;
  const pulseRef  = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (pulseRef.current && active) {
      const s = 1 + Math.sin(Date.now() * 0.02) * 0.12;
      pulseRef.current.scale.set(s, 1, s);
    }
  });

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.003}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.12, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.02, 16]} />
          <meshStandardMaterial color={active ? "#ffaa00" : "#333"} emissive={active ? "#ff8800" : "#000"} emissiveIntensity={active ? 1 : 0} />
        </mesh>
        {active && (
          <mesh ref={pulseRef} position={[0, 0.1, 0]}>
            <ringGeometry args={[0.15, 0.22, 16]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        )}
        {selected && (
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.2, 12]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[0.15, 0.08, 0.15]} />
      </group>
    </RigidBody>
  );
}

// ─── Potentiometer ──────────────────────────────────────────

function PotentiometerModel({ component }: { component: any }) {
  const selected   = useSimulationStore((s) => s.selectedComponent === component.id);
  const select     = useSimulationStore((s) => s.selectComponent);
  const updateProp = useSimulationStore((s) => s.updateComponentProperty);
  const propagate  = useSimulationStore((s) => s.propagateSignals);
  const potValue   = component.properties.value as number;
  const knobRef    = useRef<THREE.Group>(null);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    select(component.id);
    const newVal = ((potValue * 10 + 1) % 11) / 10;
    updateProp(component.id, "value", newVal);
    propagate();
  }, [component.id, potValue, select, updateProp, propagate]);

  useFrame(() => {
    if (knobRef.current) {
      knobRef.current.rotation.y = potValue * Math.PI * 1.5 - Math.PI * 0.75;
    }
  });

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.005}>
      <group onClick={handleClick}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
          <meshStandardMaterial color="#336699" roughness={0.6} />
        </mesh>
        <group ref={knobRef as any} position={[0, 0.06, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
            <meshStandardMaterial color="#ddd" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.03, 0.025, 0]}>
            <boxGeometry args={[0.02, 0.01, 0.008]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
        {selected && (
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, 0.15, 12]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[0.12, 0.06, 0.12]} />
      </group>
    </RigidBody>
  );
}

// ─── Wire Renderer ──────────────────────────────────────────

function WireRenderer() {
  const wires      = useSimulationStore((s) => s.wires);
  const components = useSimulationStore((s) => s.components);
  const simState   = useSimulationStore((s) => s.simState);

  const wireGeometries = useMemo(() => {
    return wires.map((wire) => {
      const fromComp = components.find((c) => c.id === wire.from.componentId);
      const toComp   = components.find((c) => c.id === wire.to.componentId);
      if (!fromComp || !toComp) return null;

      const start = new THREE.Vector3(...fromComp.position);
      const end   = new THREE.Vector3(...toComp.position);
      start.y += 0.3;
      end.y   += 0.3;

      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.y += 0.5 + start.distanceTo(end) * 0.15;

      const curve  = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(24);
      return { wire, points };
    }).filter(Boolean);
  }, [wires, components]);

  return (
    <group>
      {wireGeometries.map((wg) => {
        if (!wg) return null;
        return (
          <Line
            key={wg.wire.id}
            points={wg.points}
            color={wg.wire.color}
            lineWidth={2.5}
            opacity={simState === "running" ? 1 : 0.7}
            transparent
          />
        );
      })}
    </group>
  );
}

// ─── Component Factory ──────────────────────────────────────
// Maps every component type to its 3D model.
// Falls back to GenericComponentModel for anything not yet modeled.

function SimComponentRenderer({ component }: { component: any }) {
  switch (component.type) {
    // ── Dedicated models ──────────────────────────────────
    case "arduino-uno":
    case "arduino-mega":
    case "arduino-nano":
      return <ArduinoModel component={component} />;

    case "esp32-wroom":
    case "esp8266-nodemcu":
      return <ESP32Model component={component} />;

    case "raspberry-pi-4b":
    case "raspberry-pi-zero":
      return <RaspberryPi4B component={component} />;

    case "led":
    case "led-rgb":
      return <LedModel component={component} />;

    case "resistor":
      return <ResistorModel component={component} />;

    case "servo-sg90":
    case "servo-mg996r":
      return <ServoModel component={component} />;

    case "hc-sr04":
      return <UltrasonicModel component={component} />;

    case "button":
    case "touch-sensor":
      return <ButtonModel component={component} />;

    case "buzzer":
      return <BuzzerModel component={component} />;

    case "potentiometer":
      return <PotentiometerModel component={component} />;

    // ── Robot models ──────────────────────────────────────
    case "robot-2wd-car":
      return <Robot2WDCar component={component} />;

    case "robot-4wd-car":
    case "robot-tank-tracks":
      return <RobotTank component={component} />;

    case "robot-arm-4dof":
    case "robot-arm-6dof":
      return <RobotArm4DOF component={component} />;

    case "robot-quadcopter":
      return <RobotQuadcopter component={component} />;

    case "robot-hexapod":
      return <RobotHexapod component={component} />;

    case "robot-humanoid":
      return <RobotHumanoid component={component} />;

    // ── Environment ───────────────────────────────────────
    case "env-wall":
      return <EnvWall component={component} />;

    case "env-ramp":
      return <EnvRamp component={component} />;

    case "env-obstacle":
      return <EnvObstacle component={component} />;

    case "env-line-track":
      return <EnvLineTrack component={component} />;

    case "env-table":
      return <EnvTable component={component} />;

    case "env-conveyor":
      return <EnvConveyor component={component} />;

    // ── Generic fallback for all other components ─────────
    default:
      return <GenericComponentModel component={component} />;
  }
}

// ─── Main Scene ─────────────────────────────────────────────

function SimulationScene() {
  const components = useSimulationStore((s) => s.components);
  const gravity    = useSimulationStore((s) => s.gravity);
  const select     = useSimulationStore((s) => s.selectComponent);

  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 5, 7]} fov={50} />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={1} maxDistance={80} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#00d4ff" />
      <pointLight position={[5, 3, 5]}   intensity={0.15} color="#ff6600" />

      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a2332"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#0ea5e9"
        fadeDistance={40}
        fadeStrength={1}
        infiniteGrid
        position={[0, 0, 0]}
      />

      <Physics gravity={[0, -gravity, 0]}>
        {/* Invisible ground collider */}
        <RigidBody type="fixed">
          <mesh position={[0, -0.05, 0]} receiveShadow onClick={() => select(null)}>
            <boxGeometry args={[200, 0.1, 200]} />
            <meshStandardMaterial transparent opacity={0} />
          </mesh>
          <CuboidCollider args={[100, 0.05, 100]} />
        </RigidBody>

        {components.map((comp) => (
          <SimComponentRenderer key={comp.id} component={comp} />
        ))}
      </Physics>

      <WireRenderer />
      <Environment preset="city" />
    </>
  );
}

// ─── Viewport ───────────────────────────────────────────────

export function Viewport3D() {
  const simState   = useSimulationStore((s) => s.simState);
  const components = useSimulationStore((s) => s.components);
  const wires      = useSimulationStore((s) => s.wires);
  const simTime    = useSimulationStore((s) => s.simTime);
  const wiringMode = useSimulationStore((s) => s.wiringMode);
  const gravity    = useSimulationStore((s) => s.gravity);
  const physics    = useSimulationStore((s) => s.physicsEnabled);

  const formatSimTime = (t: number) => {
    const m  = Math.floor(t / 60);
    const s  = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  const robotCount  = components.filter((c) => c.category === "robot").length;
  const sensorCount = components.filter((c) => c.category === "sensor").length;

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        className="w-full h-full"
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0d1117" }}
      >
        <Suspense fallback={null}>
          <SimulationScene />
        </Suspense>
      </Canvas>

      {/* ── Top-left status badges ── */}
      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
        <span className="px-2 py-1 text-[10px] font-mono rounded bg-card/80 text-muted-foreground border border-border backdrop-blur-sm">
          Perspective
        </span>

        <span className={`px-2 py-1 text-[10px] font-mono rounded backdrop-blur-sm border ${
          simState === "running"
            ? "bg-green-500/10 text-green-400 border-green-500/30"
            : simState === "paused"
            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
            : "bg-card/80 text-primary border-primary/20"
        }`}>
          ● {simState === "running" ? "Running" : simState === "paused" ? "Paused" : "Ready"}
        </span>

        {simState !== "idle" && (
          <span className="px-2 py-1 text-[10px] font-mono rounded bg-card/80 text-foreground border border-border backdrop-blur-sm">
            ⏱ {formatSimTime(simTime)}
          </span>
        )}

        {physics && (
          <span className="px-2 py-1 text-[10px] font-mono rounded bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
            ⚡ {gravity} m/s²
          </span>
        )}
      </div>

      {/* ── Wire mode banner ── */}
      {wiringMode.active && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 text-xs font-medium rounded-lg bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
          🔌 Wire Mode — Click pins to connect
          {wiringMode.from ? ` • From: ${wiringMode.from.pinId}` : " • Select source pin"}
        </div>
      )}

      {/* ── Bottom left scene stats ── */}
      <div className="absolute bottom-3 left-3 space-y-1">
        <div className="text-[10px] font-mono text-muted-foreground/60 bg-card/60 backdrop-blur-sm px-2 py-1 rounded border border-border/40">
          {components.length} objects • {wires.length} wires
          {robotCount > 0 && ` • ${robotCount} robot${robotCount > 1 ? "s" : ""}`}
          {sensorCount > 0 && ` • ${sensorCount} sensor${sensorCount > 1 ? "s" : ""}`}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/40">
          Physics: {simState === "running" ? "active" : "idle"} • Rapier v0.12
        </div>
      </div>

      {/* ── Bottom right view controls ── */}
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
