import {
  RealisticArduinoUno,
  RealisticDCMotor,
  RealisticDHT22,
  RealisticHCSR04,
  RealisticLED,
  RealisticL298N,
  RealisticMG996R,
  RealisticMPU6050,
  RealisticNEMA17,
  RealisticSG90,
} from "./RealisticComponents";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Line, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { Suspense, useMemo } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import {
  EnvConveyor,
  EnvLineTrack,
  EnvObstacle,
  EnvRamp,
  EnvTable,
  EnvWall,
  ESP32Model,
  RaspberryPi4B,
  Robot2WDCar,
  RobotArm4DOF,
  RobotHexapod,
  RobotHumanoid,
  RobotQuadcopter,
  RobotTank,
} from "./RobotModels";
import { EnvironmentScene, EnvironmentTheme } from "./Environments";
import { RobotRenderer } from "./RobotRenderer";

const CATEGORY_COLORS: Record<string, string> = {
  microcontroller: "#006d5b",
  microcomputer: "#1a4a7a",
  sensor: "#1a3a6a",
  actuator: "#63372c",
  passive: "#5b5141",
  output: "#58451d",
  input: "#1e3344",
  display: "#3b2556",
  communication: "#235445",
  power: "#604618",
  robot: "#284a73",
  environment: "#375035",
};

function GenericComponentModel({ component }: { component: any }) {
  const select = useSimulationStore((state) => state.selectComponent);
  const selected = useSimulationStore((state) => state.selectedComponent === component.id);
  const materialColor = CATEGORY_COLORS[component.category] ?? "#1a2030";

  return (
    <RigidBody
      type={component.isStatic ? "fixed" : "dynamic"}
      position={component.position}
      mass={(component.mass ?? 10) / 1000}
      colliders="cuboid"
    >
      <group onClick={(event) => { event.stopPropagation(); select(component.id); }}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.14, 0.42]} />
          <meshStandardMaterial color={materialColor} metalness={0.15} roughness={0.45} emissive={selected ? "#104060" : "#000000"} emissiveIntensity={selected ? 0.35 : 0} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function SimComponentRenderer({ component }: { component: any }) {
  switch (component.type) {
    case "arduino-uno":
      return <RealisticArduinoUno component={component} />;
    case "raspberry-pi-4b":
      return <RaspberryPi4B component={component} />;
    case "esp32-wroom":
    case "esp32-devkit-v1":
      return <ESP32Model component={component} />;
    case "hc-sr04":
    case "ultrasonic-hcsr04":
      return <RealisticHCSR04 component={component} />;
    case "dht22":
      return <RealisticDHT22 component={component} />;
    case "mpu6050":
      return <RealisticMPU6050 component={component} />;
    case "servo-sg90":
      return <RealisticSG90 component={component} />;
    case "servo-mg996r":
      return <RealisticMG996R component={component} />;
    case "dc-motor":
    case "dc-motor-encoder":
      return <RealisticDCMotor component={component} />;
    case "nema17-stepper":
      return <RealisticNEMA17 component={component} />;
    case "l298n-driver":
      return <RealisticL298N component={component} />;
    case "led":
    case "led-rgb":
      return <RealisticLED component={component} />;
    case "robot-2wd-car":
      return <Robot2WDCar component={component} />;
    case "robot-sumo":
      return <RobotRenderer component={component} modelUrl="/models/sumo_robot.glb" />;
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
    default:
      return <GenericComponentModel component={component} />;
  }
}

function ComponentLabels() {
  const components = useSimulationStore((state) => state.components);
  const selectedId = useSimulationStore((state) => state.selectedComponent);

  return (
    <>
      {components.map((component) => (
        <Text
          key={`${component.id}-label`}
          position={[component.position[0], component.position[1] + 0.6, component.position[2]]}
          fontSize={0.16}
          color={selectedId === component.id ? "#7dd3fc" : "#dbeafe"}
          anchorX="center"
          anchorY="middle"
        >
          {component.name}
        </Text>
      ))}
    </>
  );
}

function WireOverlay() {
  const wires = useSimulationStore((state) => state.wires);
  const components = useSimulationStore((state) => state.components);

  const componentMap = useMemo(() => new Map(components.map((component) => [component.id, component])), [components]);

  return (
    <>
      {wires.map((wire) => {
        const from = componentMap.get(wire.from.componentId);
        const to = componentMap.get(wire.to.componentId);
        if (!from || !to) return null;
        const start: [number, number, number] = [from.position[0], from.position[1] + 0.14, from.position[2]];
        const end: [number, number, number] = [to.position[0], to.position[1] + 0.14, to.position[2]];
        const mid: [number, number, number] = [(start[0] + end[0]) / 2, Math.max(start[1], end[1]) + 0.55, (start[2] + end[2]) / 2];
        return <Line key={wire.id} points={[start, mid, end]} color={wire.color} lineWidth={1.5} />;
      })}
    </>
  );
}

function mapPresetToTheme(preset: string): EnvironmentTheme {
  if (preset === "warehouse") return "warehouse";
  if (preset === "obstacle-course") return "industrial";
  if (preset === "line-follow-track") return "robotics-lab";
  return "robotics-lab";
}

function SimulationScene() {
  const components = useSimulationStore((state) => state.components);
  const gravity = useSimulationStore((state) => state.gravity);
  const environmentPreset = useSimulationStore((state) => state.environmentPreset);
  const theme = mapPresetToTheme(environmentPreset);

  return (
    <>
      <PerspectiveCamera makeDefault position={[10, 8, 10]} fov={40} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.06} maxPolarAngle={Math.PI / 2 - 0.05} minDistance={4} maxDistance={28} />
      <fog attach="fog" args={["#071018", 18, 48]} />
      <ambientLight intensity={0.6} color="#c9dcff" />
      <directionalLight position={[8, 16, 6]} intensity={1.5} color="#fffef3" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight position={[-6, 10, -4]} intensity={2.5} angle={0.36} penumbra={0.6} distance={30} color="#8edbff" castShadow />

      <Grid
        args={[120, 120]}
        cellSize={0.5}
        cellThickness={0.3}
        cellColor="#16313d"
        sectionSize={4}
        sectionThickness={0.7}
        sectionColor="#2dd4bf"
        fadeDistance={60}
        fadeStrength={1}
        infiniteGrid
        position={[0, 0.001, 0]}
      />

      <Physics gravity={[0, -gravity, 0]}>
        <EnvironmentScene theme={theme} />
        {components.map((component) => (
          <SimComponentRenderer key={component.id} component={component} />
        ))}
      </Physics>

      <WireOverlay />
      <ComponentLabels />

      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={36} blur={2.5} far={8} />

      <Suspense fallback={null}>
        <Environment preset="warehouse" />
      </Suspense>
    </>
  );
}

export function Viewport3D() {
  const simState = useSimulationStore((state) => state.simState);
  const simTime = useSimulationStore((state) => state.simTime);
  const components = useSimulationStore((state) => state.components);
  const wires = useSimulationStore((state) => state.wires);
  const environmentPreset = useSimulationStore((state) => state.environmentPreset);

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    const centiseconds = Math.floor((value % 1) * 100);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#02070d]">
      <Canvas shadows gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} className="h-full w-full">
        <Suspense fallback={null}>
          <SimulationScene />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-[10px] font-mono backdrop-blur-sm ${
          simState === "running"
            ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
            : "border-white/10 bg-slate-950/70 text-slate-200"
        }`}>
          {simState === "running" ? "LIVE RUNTIME" : "READY"}
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-mono text-slate-200 backdrop-blur-sm">
          TIME {formatTime(simTime)}
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-mono text-slate-200 backdrop-blur-sm">
          NODES {components.length}
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-mono text-slate-200 backdrop-blur-sm">
          LINKS {wires.length}
        </span>
        <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-mono text-slate-200 backdrop-blur-sm">
          ENV {environmentPreset}
        </span>
      </div>
    </div>
  );
}
