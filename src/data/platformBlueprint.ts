export type PlatformDomain = {
  name: string;
  focus: string;
  workloads: string[];
};

export type PlatformLayer = {
  title: string;
  description: string;
  capabilities: string[];
};

export type RoadmapPhase = {
  phase: string;
  timeline: string;
  outcome: string;
  deliverables: string[];
};

export const platformDomains: PlatformDomain[] = [
  {
    name: "Robotics",
    focus: "Robot cells, autonomy stacks, manipulators, humanoids, and swarm behavior.",
    workloads: ["Kinematics and dynamics", "Navigation and SLAM", "ROS/ROS 2 pipelines", "Fleet and swarm coordination"],
  },
  {
    name: "IoT",
    focus: "Connected devices, edge telemetry, digital twins, and fleet-scale orchestration.",
    workloads: ["Sensor networks", "Home and industrial automation", "Cloud-device synchronization", "Connected vehicle data loops"],
  },
  {
    name: "Aerospace & Drones",
    focus: "Air and space vehicle simulation from propulsion to mission planning.",
    workloads: ["UAV flight control", "Orbital mechanics", "Swarm mission rehearsal", "Aerodynamics and propulsion"],
  },
  {
    name: "Electronics & Embedded",
    focus: "Circuit design, firmware validation, and hardware-in-the-loop execution.",
    workloads: ["MCU firmware", "Signal processing", "Sensor and actuator models", "Power electronics verification"],
  },
  {
    name: "Power & Energy",
    focus: "Grid-aware energy systems, storage, EV subsystems, and conversion chains.",
    workloads: ["Battery management", "Renewables", "Smart grids", "Power conversion and thermal analysis"],
  },
  {
    name: "AI-Native Systems",
    focus: "Closed-loop intelligence embedded into every simulated system.",
    workloads: ["Perception models", "Autonomous control", "Predictive maintenance", "Design-space optimization"],
  },
];

export const platformLayers: PlatformLayer[] = [
  {
    title: "Experience Layer",
    description: "A unified desktop, web, and immersive client for modeling, simulation, debugging, and collaboration.",
    capabilities: ["3D scene editor", "Circuit and system canvas", "Firmware IDE", "VR/AR review spaces"],
  },
  {
    title: "Domain Studio Layer",
    description: "Composable studios expose tools tailored to robotics, aerospace, IoT, electronics, and energy workflows.",
    capabilities: ["Robot workcells", "Drone mission planner", "Embedded board designer", "Grid and battery digital twins"],
  },
  {
    title: "Simulation Orchestration Layer",
    description: "A scheduler coordinates multi-engine time stepping, distributed runs, scenario replay, and deterministic execution.",
    capabilities: ["Scenario manager", "Time synchronization", "Distributed job execution", "Replay and regression baselines"],
  },
  {
    title: "Physics and Runtime Layer",
    description: "Specialized solvers are coupled behind a common contract so each engineering domain can run the right fidelity level.",
    capabilities: ["Rigid-body physics", "Aerodynamics and CFD adapters", "Circuit and signal solvers", "Orbital and energy models"],
  },
  {
    title: "Device and Software Layer",
    description: "The platform runs firmware, autonomy stacks, data pipelines, and hardware adapters directly against the simulation state.",
    capabilities: ["Arduino/ESP32/STM32 runtimes", "ROS 2 bridge", "MQTT/OPC UA connectors", "Hardware-in-the-loop gateways"],
  },
  {
    title: "Data and Intelligence Layer",
    description: "Every run emits structured traces used for analytics, optimization, AI assistance, and enterprise governance.",
    capabilities: ["Telemetry lakehouse", "Design assistant", "Optimization engine", "Versioned asset catalog"],
  },
];

export const executionTracks = [
  {
    name: "Interactive Twin",
    description: "Single-user or small-team simulation with responsive visual feedback and controllable fidelity.",
    stack: ["React + Three.js client", "Local or edge runtime", "Fast physics profile", "Live firmware console"],
  },
  {
    name: "Collaborative Review",
    description: "Real-time presence, annotation, and co-editing for students, labs, and enterprise teams.",
    stack: ["CRDT project state", "Role-based sessions", "Voice/text annotations", "Review snapshots"],
  },
  {
    name: "Enterprise Compute",
    description: "Batch experiments, parameter sweeps, Monte Carlo runs, and optimization jobs across scalable infrastructure.",
    stack: ["Containerized simulation workers", "Kubernetes scheduler", "Experiment tracking", "Performance dashboards"],
  },
];

export const platformPrinciples = [
  "Use a modular multi-engine architecture instead of one monolithic solver.",
  "Separate the authoring model from execution runtimes so the same project can run in local, cloud, or hardware-in-the-loop modes.",
  "Treat every simulated asset as a versioned, reusable digital twin component with metadata, validation rules, and interfaces.",
  "Make time synchronization explicit across physics, firmware, AI inference, and network traffic to preserve determinism.",
  "Design collaboration and traceability as core primitives, not enterprise add-ons.",
];

export const roadmapPhases: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    timeline: "0-4 months",
    outcome: "Ship a credible robotics and embedded MVP.",
    deliverables: ["3D scene editor", "Rigid-body robot simulation", "Component library", "Arduino/ESP32 execution loop", "Project persistence"],
  },
  {
    phase: "Phase 2",
    timeline: "4-8 months",
    outcome: "Expand into IoT, collaboration, and cloud-backed scenario runs.",
    deliverables: ["MQTT and mobile app connectivity", "Shared project sessions", "Scenario timeline", "Metrics and replay", "Asset registry"],
  },
  {
    phase: "Phase 3",
    timeline: "8-14 months",
    outcome: "Add aerospace, energy, and high-fidelity domain adapters.",
    deliverables: ["Flight dynamics layer", "Orbital mission models", "Battery and grid simulation", "Optimization jobs", "Hardware-in-the-loop gateways"],
  },
  {
    phase: "Phase 4",
    timeline: "14-24 months",
    outcome: "Deliver an enterprise simulation platform with AI-native assistance and certification-grade workflows.",
    deliverables: ["Governance and approvals", "Validation suites", "AI design copilot", "Compliance reporting", "Marketplace ecosystem"],
  },
];

export const techStack = [
  { area: "Control Plane", choice: "React, TypeScript, Electron shell, WebXR-ready collaboration surfaces" },
  { area: "Native Visualization", choice: "Unreal Engine 5 desktop client for photoreal robotics cells, drone test ranges, and digital twins" },
  { area: "Collaboration", choice: "Yjs or Automerge CRDTs, presence service, comment and review graph" },
  { area: "Simulation Core", choice: "Rust or C++ orchestration services with engine adapters exposed over gRPC" },
  { area: "Physics", choice: "Native PhysX/Bullet/MuJoCo-class runtimes for robotics and high-fidelity domain adapters for scale" },
  { area: "Embedded Runtime", choice: "WASM sandboxes for firmware, board abstractions, serial and GPIO simulation" },
  { area: "AI Layer", choice: "Python copilots, model registry, inference gateways, debugging agents, and experiment evaluation harness" },
  { area: "Backend", choice: "Event-driven services, PostgreSQL, object storage, telemetry warehouse, Kubernetes" },
];
