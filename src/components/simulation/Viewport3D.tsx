import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, PerspectiveCamera, Line, Text } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";

// ─── Arduino 3D Model ──────────────────────────────────────

function ArduinoModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select = useSimulationStore((s) => s.selectComponent);
  const pin13 = component.pins["D13"];
  const ledOn = pin13 && pin13.value > 0;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        {/* PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.12, 1.5]} />
          <meshStandardMaterial
            color={selected ? "#00997a" : "#006d5b"}
            roughness={0.6}
            metalness={0.1}
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
        {/* Pin headers */}
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={`pt-${i}`} position={[-0.8 + i * 0.12, 0.12, -0.6]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#d4a017" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
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
        {/* Power LED */}
        <mesh position={[0.7, 0.12, -0.15]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
        </mesh>
        {/* Label */}
        <Text
          position={[0, 0.13, 0.25]}
          fontSize={0.12}
          color="#aaffdd"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          ARDUINO UNO
        </Text>
        <CuboidCollider args={[1.1, 0.15, 0.75]} />
      </group>
    </RigidBody>
  );
}

// ─── LED 3D Model ───────────────────────────────────────────

function LedModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select = useSimulationStore((s) => s.selectComponent);
  const brightness = (component.properties.brightness as number) || 0;
  const isOn = brightness > 0;
  const ledColor = component.properties.color === "green" ? "#00ff44" : "#ff3322";
  const offColor = component.properties.color === "green" ? "#003311" : "#330808";

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={component.mass / 1000}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        {/* LED body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
          <meshStandardMaterial
            color={isOn ? ledColor : offColor}
            emissive={isOn ? ledColor : "#000000"}
            emissiveIntensity={isOn ? 3 : 0}
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* LED dome */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.08, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={isOn ? ledColor : offColor}
            emissive={isOn ? ledColor : "#000000"}
            emissiveIntensity={isOn ? 4 : 0}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.03, -0.15, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.2, 4]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
        </mesh>
        <mesh position={[0.03, -0.18, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.15, 4]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
        </mesh>
        {isOn && (
          <pointLight position={[0, 0.15, 0]} color={ledColor} intensity={0.8} distance={2} />
        )}
        {selected && (
          <mesh>
            <sphereGeometry args={[0.15, 12, 12]} />
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
  const select = useSimulationStore((s) => s.selectComponent);

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.001}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        {/* Color bands */}
        {[[-0.08, "#ff0000"], [-0.03, "#ff0000"], [0.02, "#8B4513"], [0.09, "#d4a017"]].map(([pos, col], i) => (
          <mesh key={i} position={[0, pos as number, 0]}>
            <cylinderGeometry args={[0.052, 0.052, 0.025, 8]} />
            <meshStandardMaterial color={col as string} />
          </mesh>
        ))}
        {/* Legs */}
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
  const select = useSimulationStore((s) => s.selectComponent);
  const hornRef = useRef<THREE.Group>(null);
  const angle = (component.properties.angle as number) || 90;

  useFrame(() => {
    if (hornRef.current) {
      const targetRad = ((angle - 90) * Math.PI) / 180;
      hornRef.current.rotation.y += (targetRad - hornRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={component.mass / 1000}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.35, 0.25]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.4} />
        </mesh>
        {/* Mounting tabs */}
        <mesh position={[0, -0.15, 0.18]} castShadow>
          <boxGeometry args={[0.65, 0.04, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Horn assembly */}
        <group ref={hornRef} position={[0, 0.2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Horn arm */}
          <mesh position={[0.12, 0.03, 0]}>
            <boxGeometry args={[0.2, 0.02, 0.04]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
        {/* Wire */}
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
  const select = useSimulationStore((s) => s.selectComponent);

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={component.mass / 1000}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.12, 0.4]} />
          <meshStandardMaterial color="#0066cc" roughness={0.6} />
        </mesh>
        <mesh position={[-0.18, 0.06, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.18, 0.06, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
        </mesh>
        <Text
          position={[0, 0.08, -0.12]}
          fontSize={0.06}
          color="#aaccff"
          anchorX="center"
          rotation={[-Math.PI / 2, 0, 0]}
        >
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
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select = useSimulationStore((s) => s.selectComponent);
  const updateProp = useSimulationStore((s) => s.updateComponentProperty);
  const updatePin = useSimulationStore((s) => s.updatePinValue);
  const propagate = useSimulationStore((s) => s.propagateSignals);
  const pressed = component.properties.pressed as boolean;

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    select(component.id);
    const newState = !pressed;
    updateProp(component.id, "pressed", newState);
    updatePin(component.id, "PIN1", newState ? 1 : 0);
    updatePin(component.id, "PIN2", newState ? 1 : 0);
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
        {/* Legs */}
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
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select = useSimulationStore((s) => s.selectComponent);
  const active = component.properties.active as boolean;
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (pulseRef.current && active) {
      pulseRef.current.scale.x = 1 + Math.sin(Date.now() * 0.02) * 0.1;
      pulseRef.current.scale.z = 1 + Math.sin(Date.now() * 0.02) * 0.1;
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
          <meshStandardMaterial
            color={active ? "#ffaa00" : "#333"}
            emissive={active ? "#ff8800" : "#000"}
            emissiveIntensity={active ? 1 : 0}
          />
        </mesh>
        {active && (
          <mesh ref={pulseRef} position={[0, 0.1, 0]}>
            <ringGeometry args={[0.15, 0.2, 16]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} side={THREE.DoubleSide} />
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
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select = useSimulationStore((s) => s.selectComponent);
  const updateProp = useSimulationStore((s) => s.updateComponentProperty);
  const propagate = useSimulationStore((s) => s.propagateSignals);
  const potValue = component.properties.value as number;
  const knobRef = useRef<THREE.Mesh>(null);

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
        {/* Knob */}
        <group ref={knobRef} position={[0, 0.06, 0]}>
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
  const wires = useSimulationStore((s) => s.wires);
  const components = useSimulationStore((s) => s.components);
  const simState = useSimulationStore((s) => s.simState);

  const wireGeometries = useMemo(() => {
    return wires.map((wire) => {
      const fromComp = components.find((c) => c.id === wire.from.componentId);
      const toComp = components.find((c) => c.id === wire.to.componentId);
      if (!fromComp || !toComp) return null;

      const start = new THREE.Vector3(...fromComp.position);
      const end = new THREE.Vector3(...toComp.position);

      // Offset slightly upward
      start.y += 0.3;
      end.y += 0.3;

      // Create a nice catenary curve
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.y += 0.5 + start.distanceTo(end) * 0.15;

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(20);

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

function SimComponentRenderer({ component }: { component: any }) {
  switch (component.type) {
    case "arduino-uno": return <ArduinoModel component={component} />;
    case "led": return <LedModel component={component} />;
    case "resistor": return <ResistorModel component={component} />;
    case "servo": return <ServoModel component={component} />;
    case "hc-sr04": return <UltrasonicModel component={component} />;
    case "button": return <ButtonModel component={component} />;
    case "buzzer": return <BuzzerModel component={component} />;
    case "potentiometer": return <PotentiometerModel component={component} />;
    default: return null;
  }
}

// ─── Main Scene ─────────────────────────────────────────────

function SimulationScene() {
  const components = useSimulationStore((s) => s.components);
  const gravity = useSimulationStore((s) => s.gravity);
  const select = useSimulationStore((s) => s.selectComponent);

  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 5, 7]} fov={50} />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={50} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#00d4ff" />

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

      <Physics gravity={[0, -gravity, 0]}>
        {/* Ground plane */}
        <RigidBody type="fixed">
          <mesh position={[0, -0.05, 0]} receiveShadow onClick={() => select(null)}>
            <boxGeometry args={[100, 0.1, 100]} />
            <meshStandardMaterial transparent opacity={0} />
          </mesh>
          <CuboidCollider args={[50, 0.05, 50]} />
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
  const simState = useSimulationStore((s) => s.simState);
  const components = useSimulationStore((s) => s.components);
  const wires = useSimulationStore((s) => s.wires);
  const simTime = useSimulationStore((s) => s.simTime);
  const wiringMode = useSimulationStore((s) => s.wiringMode);

  const formatSimTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

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

      {/* Top-left overlay */}
      <div className="absolute top-3 left-3 flex gap-2">
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
      </div>

      {wiringMode.active && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 text-xs font-medium rounded-lg bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm glow-primary-sm">
          🔌 Wire Mode — Click pins to connect • {wiringMode.from ? `From: ${wiringMode.from.pinId}` : "Select source pin"}
        </div>
      )}

      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-muted-foreground/60">
        {components.length} objects • {wires.length} wires • Physics: {simState === "running" ? "active" : "idle"}
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
