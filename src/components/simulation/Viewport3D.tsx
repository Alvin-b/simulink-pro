import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera, Line, Text } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Suspense, useRef, useMemo, useCallback, useState } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";
import {
  RaspberryPi4B, ESP32Model, Robot2WDCar, RobotArm4DOF,
  RobotTank, RobotQuadcopter, RobotHexapod, RobotHumanoid,
  EnvWall, EnvRamp, EnvObstacle, EnvLineTrack, EnvTable, EnvConveyor,
} from "./RobotModels";
import { EnvironmentScene, ENVIRONMENT_CONFIGS, EnvironmentTheme } from "./Environments";

// ─── Generic fallback ──────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  microcontroller: "#006d5b", microcomputer: "#1a4a7a",
  sensor: "#1a3a6a", actuator: "#3a1a1a", passive: "#3a3020",
  output: "#3a2a10", input: "#1a2a3a", display: "#2a1a4a",
  communication: "#1a3a2a", power: "#3a2a00", robot: "#2a1a3a", environment: "#2a3a1a",
};
const CATEGORY_ACCENT: Record<string, string> = {
  microcontroller: "#00d4aa", microcomputer: "#4488ff",
  sensor: "#44aaff", actuator: "#ff6644", passive: "#ffcc44",
  output: "#ff9922", input: "#44ccff", display: "#aa44ff",
  communication: "#44ffaa", power: "#ffdd00", robot: "#cc44ff", environment: "#88cc44",
};

function GenericComponentModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);
  const bg     = CATEGORY_COLORS[component.category] ?? "#1a2030";
  const accent = CATEGORY_ACCENT[component.category]  ?? "#00d4ff";
  const size: [number,number,number] =
    component.category === "sensor"          ? [0.55, 0.14, 0.35] :
    component.category === "display"         ? [0.7,  0.08, 0.5]  :
    component.category === "communication"   ? [0.5,  0.12, 0.35] :
    component.category === "power"           ? [0.6,  0.18, 0.4]  :
    component.category === "microcontroller" ? [0.9,  0.1,  0.6]  :
    component.category === "microcomputer"   ? [1.2,  0.1,  0.8]  :
    component.category === "actuator"        ? [0.55, 0.35, 0.35] :
    component.category === "input"           ? [0.35, 0.15, 0.35] : [0.5, 0.12, 0.4];
  const pinCount = Math.min(Object.keys(component.pins ?? {}).length, 16);
  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={(component.mass ?? 10)/1000}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color={selected ? `${accent}55` : bg} roughness={0.5} metalness={0.15}
            emissive={selected ? accent : "#000"} emissiveIntensity={selected ? 0.15 : 0} />
        </mesh>
        <mesh position={[0, size[1]/2+0.005, 0]}>
          <boxGeometry args={[size[0]*0.6, 0.004, size[2]*0.6]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, size[1]/2+0.012, 0]} castShadow>
          <boxGeometry args={[size[0]*0.35, 0.02, size[2]*0.35]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>
        {Array.from({length: pinCount}).map((_, i) => {
          const sp = size[0]/(pinCount+1);
          return (
            <mesh key={i} position={[-size[0]/2+sp*(i+1), -size[1]/2-0.06, size[2]/2]}>
              <boxGeometry args={[0.025, 0.1, 0.025]} />
              <meshStandardMaterial color="#d4a017" metalness={0.9} roughness={0.1} />
            </mesh>
          );
        })}
        <Text position={[0, size[1]/2+0.04, 0]} fontSize={Math.min(0.09, size[0]*0.12)}
          color={accent} anchorX="center" anchorY="middle" rotation={[-Math.PI/2,0,0]} maxWidth={size[0]*0.9}>
          {component.name}
        </Text>
        {selected && (
          <mesh><boxGeometry args={[size[0]+0.1, size[1]+0.2, size[2]+0.1]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
          </mesh>
        )}
        <CuboidCollider args={[size[0]/2, size[1]/2+0.05, size[2]/2]} />
      </group>
    </RigidBody>
  );
}

// ─── Arduino ───────────────────────────────────────────────

function ArduinoModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);
  const ledOn    = component.pins["D13"]?.value > 0;
  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.12, 1.5]} />
          <meshStandardMaterial color={selected ? "#00997a" : "#006d5b"} roughness={0.6} metalness={0.1}
            emissive={selected ? "#003d30" : "#000"} />
        </mesh>
        <mesh position={[0.2, 0.12, 0]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.5]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[-1.0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.35, 0.18, 0.45]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
        </mesh>
        {Array.from({length: 14}).map((_, i) => (
          <mesh key={`pt-${i}`} position={[-0.8+i*0.12, 0.12, -0.6]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#d4a017" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        {Array.from({length: 14}).map((_, i) => (
          <mesh key={`pb-${i}`} position={[-0.8+i*0.12, 0.12, 0.6]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#d4a017" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
        <mesh position={[0.7, 0.12, -0.3]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={ledOn ? "#00ff00" : "#004400"} emissive={ledOn ? "#00ff00" : "#000"} emissiveIntensity={ledOn ? 3 : 0} />
        </mesh>
        {ledOn && <pointLight position={[0.7,0.25,-0.3]} color="#00ff00" intensity={0.5} distance={1.5} />}
        <mesh position={[0.7, 0.12, -0.15]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
        </mesh>
        <Text position={[0, 0.13, 0.25]} fontSize={0.12} color="#aaffdd" anchorX="center" anchorY="middle" rotation={[-Math.PI/2,0,0]}>
          ARDUINO UNO
        </Text>
        {selected && <mesh><boxGeometry args={[2.4,0.4,1.7]} /><meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} /></mesh>}
        <CuboidCollider args={[1.1, 0.15, 0.75]} />
      </group>
    </RigidBody>
  );
}

// ─── LED ───────────────────────────────────────────────────

function LedModel({ component }: { component: any }) {
  const selected   = useSimulationStore((s) => s.selectedComponent === component.id);
  const select     = useSimulationStore((s) => s.selectComponent);
  const brightness = (component.properties.brightness as number) || 0;
  const isOn       = brightness > 0;
  const ledColor   = component.properties.color === "green" ? "#00ff44" : component.properties.color === "blue" ? "#2244ff" : "#ff3322";
  return (
    <RigidBody type="dynamic" position={component.position} mass={0.001}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
          <meshStandardMaterial color={isOn ? ledColor : "#220808"} emissive={isOn ? ledColor : "#000"} emissiveIntensity={isOn ? 3 : 0} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.08, 12, 12, 0, Math.PI*2, 0, Math.PI/2]} />
          <meshStandardMaterial color={isOn ? ledColor : "#220808"} emissive={isOn ? ledColor : "#000"} emissiveIntensity={isOn ? 4 : 0} transparent opacity={0.85} />
        </mesh>
        {isOn && <pointLight position={[0,0.15,0]} color={ledColor} intensity={0.8} distance={2} />}
        {selected && <mesh><sphereGeometry args={[0.2,12,12]} /><meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} /></mesh>}
        <CuboidCollider args={[0.08, 0.2, 0.08]} />
      </group>
    </RigidBody>
  );
}

// ─── Resistor ──────────────────────────────────────────────

function ResistorModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);
  return (
    <RigidBody type="dynamic" position={component.position} mass={0.001}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[0.05,0.05,0.3,8]} />
          <meshStandardMaterial color="#d4a574" roughness={0.8} />
        </mesh>
        {selected && <mesh><boxGeometry args={[0.15,0.5,0.15]} /><meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} /></mesh>}
        <CuboidCollider args={[0.05,0.2,0.05]} />
      </group>
    </RigidBody>
  );
}

// ─── Servo ─────────────────────────────────────────────────

function ServoModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);
  const hornRef  = useRef<THREE.Group>(null);
  const angle    = (component.properties.angle as number) || 90;
  useFrame(() => {
    if (hornRef.current) {
      const t = ((angle-90)*Math.PI)/180;
      hornRef.current.rotation.y += (t - hornRef.current.rotation.y) * 0.1;
    }
  });
  return (
    <RigidBody type={component.isStatic?"fixed":"dynamic"} position={component.position} mass={0.009}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow><boxGeometry args={[0.5,0.35,0.25]} /><meshStandardMaterial color="#1a1a2e" roughness={0.4} /></mesh>
        <group ref={hornRef as any} position={[0,0.2,0]}>
          <mesh><cylinderGeometry args={[0.06,0.06,0.05,12]} /><meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.6} /></mesh>
          <mesh position={[0.12,0.03,0]}><boxGeometry args={[0.2,0.02,0.04]} /><meshStandardMaterial color="#fff" /></mesh>
        </group>
        {selected && <mesh><boxGeometry args={[0.6,0.5,0.35]} /><meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} /></mesh>}
        <CuboidCollider args={[0.25,0.2,0.125]} />
      </group>
    </RigidBody>
  );
}

// ─── Wire renderer ─────────────────────────────────────────

function WireRenderer() {
  const wires      = useSimulationStore((s) => s.wires);
  const components = useSimulationStore((s) => s.components);
  const simState   = useSimulationStore((s) => s.simState);
  const wireGeometries = useMemo(() => {
    return wires.map((wire) => {
      const fc = components.find((c) => c.id === wire.from.componentId);
      const tc = components.find((c) => c.id === wire.to.componentId);
      if (!fc || !tc) return null;
      const start = new THREE.Vector3(...fc.position); start.y += 0.3;
      const end   = new THREE.Vector3(...tc.position); end.y   += 0.3;
      const mid   = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.y += 0.5 + start.distanceTo(end) * 0.15;
      return { wire, points: new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(24) };
    }).filter(Boolean);
  }, [wires, components]);
  return (
    <group>
      {wireGeometries.map((wg) => wg && (
        <Line key={wg.wire.id} points={wg.points} color={wg.wire.color} lineWidth={2.5} opacity={simState === "running" ? 1 : 0.7} transparent />
      ))}
    </group>
  );
}

// ─── Component factory ─────────────────────────────────────

function SimComponentRenderer({ component }: { component: any }) {
  switch (component.type) {
    case "arduino-uno": case "arduino-mega": case "arduino-nano": return <ArduinoModel component={component} />;
    case "esp32-wroom": case "esp8266-nodemcu": return <ESP32Model component={component} />;
    case "raspberry-pi-4b": case "raspberry-pi-zero": return <RaspberryPi4B component={component} />;
    case "led": case "led-rgb": return <LedModel component={component} />;
    case "resistor": return <ResistorModel component={component} />;
    case "servo-sg90": case "servo-mg996r": return <ServoModel component={component} />;
    case "hc-sr04": return <UltrasonicModel component={component} />;
    case "robot-2wd-car": return <Robot2WDCar component={component} />;
    case "robot-4wd-car": case "robot-tank-tracks": return <RobotTank component={component} />;
    case "robot-arm-4dof": case "robot-arm-6dof": return <RobotArm4DOF component={component} />;
    case "robot-quadcopter": return <RobotQuadcopter component={component} />;
    case "robot-hexapod": return <RobotHexapod component={component} />;
    case "robot-humanoid": return <RobotHumanoid component={component} />;
    case "env-wall": return <EnvWall component={component} />;
    case "env-ramp": return <EnvRamp component={component} />;
    case "env-obstacle": return <EnvObstacle component={component} />;
    case "env-line-track": return <EnvLineTrack component={component} />;
    case "env-table": return <EnvTable component={component} />;
    case "env-conveyor": return <EnvConveyor component={component} />;
    default: return <GenericComponentModel component={component} />;
  }
}

function UltrasonicModel({ component }: { component: any }) {
  const selected = useSimulationStore((s) => s.selectedComponent === component.id);
  const select   = useSimulationStore((s) => s.selectComponent);
  return (
    <RigidBody type={component.isStatic?"fixed":"dynamic"} position={component.position} mass={0.008}>
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <mesh castShadow><boxGeometry args={[0.8,0.12,0.4]} /><meshStandardMaterial color="#0066cc" roughness={0.6} /></mesh>
        {[-0.18,0.18].map((x,i) => (
          <mesh key={i} position={[x,0.06,0.15]} rotation={[Math.PI/2,0,0]} castShadow>
            <cylinderGeometry args={[0.12,0.12,0.08,16]} />
            <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
        {selected && <mesh><boxGeometry args={[0.9,0.3,0.5]} /><meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} /></mesh>}
        <CuboidCollider args={[0.4,0.12,0.2]} />
      </group>
    </RigidBody>
  );
}

// ─── Environment picker ────────────────────────────────────

function EnvironmentPicker({ current, onChange }: { current: EnvironmentTheme; onChange: (t: EnvironmentTheme) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-3 right-3 z-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono rounded-lg border border-border bg-card/90 text-foreground backdrop-blur-sm hover:border-primary/50 transition-colors shadow-lg"
      >
        <span>{ENVIRONMENT_CONFIGS[current].icon}</span>
        <span>{ENVIRONMENT_CONFIGS[current].label}</span>
        <span className="text-muted-foreground ml-1">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-60 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-20">
          <div className="px-3 py-2 border-b border-border text-[9px] font-mono text-muted-foreground tracking-widest uppercase">
            Choose Environment
          </div>
          {Object.values(ENVIRONMENT_CONFIGS).map((env) => (
            <button
              key={env.id}
              onClick={() => { onChange(env.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-[11px] transition-colors hover:bg-secondary/80 ${
                current === env.id ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              <span className="text-lg w-6">{env.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{env.label}</div>
                <div className="text-[9px] text-muted-foreground truncate">{env.description}</div>
              </div>
              {current === env.id && <span className="text-primary text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main scene ────────────────────────────────────────────

function SimulationScene({ theme }: { theme: EnvironmentTheme }) {
  const components = useSimulationStore((s) => s.components);
  const gravity    = useSimulationStore((s) => s.gravity);
  const isIndoor   = theme === "robotics-lab" || theme === "smart-home" || theme === "warehouse" || theme === "empty";

  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 5, 7]} fov={50} />
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={1}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 - 0.04}
        minPolarAngle={0.05}
        enablePan
        panSpeed={0.8}
        rotateSpeed={0.6}
      />

      <EnvironmentScene theme={theme} />

      {isIndoor && (
        <Grid
          args={[100, 100]}
          cellSize={1} cellThickness={0.4} cellColor="#1a2332"
          sectionSize={5} sectionThickness={0.8} sectionColor="#0ea5e9"
          fadeDistance={40} fadeStrength={1} infiniteGrid position={[0, 0.002, 0]}
        />
      )}

      <Physics gravity={[0, -gravity, 0]}>
        {components.map((comp) => (
          <SimComponentRenderer key={comp.id} component={comp} />
        ))}
      </Physics>

      <WireRenderer />
    </>
  );
}

// ─── Viewport ──────────────────────────────────────────────

export function Viewport3D() {
  const simState   = useSimulationStore((s) => s.simState);
  const components = useSimulationStore((s) => s.components);
  const wires      = useSimulationStore((s) => s.wires);
  const simTime    = useSimulationStore((s) => s.simTime);
  const wiringMode = useSimulationStore((s) => s.wiringMode);
  const gravity    = useSimulationStore((s) => s.gravity);
  const physics    = useSimulationStore((s) => s.physicsEnabled);
  const [theme, setTheme] = useState<EnvironmentTheme>("robotics-lab");

  const fmt = (t: number) => {
    const m  = Math.floor(t/60);
    const s  = Math.floor(t%60);
    const ms = Math.floor((t%1)*100);
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(ms).padStart(2,"0")}`;
  };

  return (
    <div className="w-full h-full relative" style={{ background: "#0a0d12" }}>
      <Canvas
        shadows
        className="w-full h-full"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SimulationScene theme={theme} />
        </Suspense>
      </Canvas>

      {/* Top left badges */}
      <div className="absolute top-3 left-3 flex gap-2 flex-wrap pointer-events-none">
        <span className="px-2 py-1 text-[10px] font-mono rounded bg-card/80 text-muted-foreground border border-border backdrop-blur-sm">
          Perspective
        </span>
        <span className={`px-2 py-1 text-[10px] font-mono rounded backdrop-blur-sm border ${
          simState === "running" ? "bg-green-500/10 text-green-400 border-green-500/30"
          : simState === "paused" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
          : "bg-card/80 text-primary border-primary/20"
        }`}>
          ● {simState === "running" ? "Running" : simState === "paused" ? "Paused" : "Ready"}
        </span>
        {simState !== "idle" && (
          <span className="px-2 py-1 text-[10px] font-mono rounded bg-card/80 text-foreground border border-border backdrop-blur-sm">
            ⏱ {fmt(simTime)}
          </span>
        )}
        {physics && (
          <span className="px-2 py-1 text-[10px] font-mono rounded bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
            ⚡ {gravity} m/s²
          </span>
        )}
      </div>

      {/* Environment picker — top right */}
      <EnvironmentPicker current={theme} onChange={setTheme} />

      {/* Wire mode */}
      {wiringMode.active && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 text-xs font-medium rounded-lg bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm pointer-events-none">
          🔌 Wire Mode — {wiringMode.from ? `From: ${wiringMode.from.pinId} — Click target pin` : "Click source pin"}
        </div>
      )}

      {/* Bottom left stats */}
      <div className="absolute bottom-3 left-3 space-y-1 pointer-events-none">
        <div className="text-[10px] font-mono text-muted-foreground/70 bg-card/60 backdrop-blur-sm px-2 py-1 rounded border border-border/40">
          {components.length} objects • {wires.length} wires
          {components.filter(c=>c.category==="robot").length > 0 && ` • ${components.filter(c=>c.category==="robot").length} robots`}
          {components.filter(c=>c.category==="sensor").length > 0 && ` • ${components.filter(c=>c.category==="sensor").length} sensors`}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/40">
          Physics: {simState==="running" ? "active" : "idle"} • Rapier v0.12
        </div>
      </div>

      {/* Bottom right view buttons */}
      <div className="absolute bottom-3 right-3 flex gap-1">
        {["XY","XZ","YZ","3D"].map((v) => (
          <button key={v} className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
            v==="3D" ? "bg-primary/20 text-primary border-primary/30"
            : "bg-card/80 text-muted-foreground border-border hover:border-primary/30 backdrop-blur-sm"
          }`}>{v}</button>
        ))}
      </div>
    </div>
  );
}
