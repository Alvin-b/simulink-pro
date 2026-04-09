import { create } from "zustand";
import { buildProjectDocument } from "@/platform/projectSchema";
import { DomainId } from "@/modules/types";

// ─── Types ──────────────────────────────────────────────────
export type PinMode = "INPUT" | "OUTPUT" | "INPUT_PULLUP" | "PWM" | "ANALOG";

export type PinState = {
  mode: PinMode;
  value: number;
  label: string;
};

export type ComponentType =
  // Microcontrollers
  | "arduino-uno" | "arduino-mega" | "arduino-nano"
  | "esp32-wroom" | "esp8266-nodemcu"
  | "stm32f103" | "attiny85"
  // Microcomputers
  | "raspberry-pi-4b" | "raspberry-pi-pico" | "raspberry-pi-zero"
  | "jetson-nano" | "beaglebone-black"
  // Sensors
  | "hc-sr04" | "dht22" | "dht11" | "bmp280" | "mpu6050"
  | "ir-sensor" | "pir-sensor" | "ldr-module" | "hx711"
  | "gps-neo6m" | "soil-moisture" | "mq2-gas" | "water-level"
  | "line-follower-ir" | "color-sensor-tcs3200" | "lidar-lite"
  // Actuators
  | "servo-sg90" | "servo-mg996r" | "nema17-stepper"
  | "dc-motor" | "dc-motor-encoder" | "l298n-driver" | "a4988-driver"
  | "solenoid-valve" | "linear-actuator"
  // Passive & Output
  | "led" | "led-rgb" | "resistor" | "capacitor" | "diode" | "transistor-2n2222"
  | "buzzer" | "relay-module" | "mosfet-irf540"
  // Input
  | "button" | "potentiometer" | "rotary-encoder" | "joystick"
  | "keypad-4x4" | "touch-sensor"
  // Display
  | "oled-ssd1306" | "lcd-16x2" | "lcd-20x4" | "tft-ili9341"
  | "led-matrix-8x8" | "seven-segment"
  // Communication / IoT
  | "nrf24l01" | "hc05-bluetooth" | "hc06-bluetooth"
  | "sim800l-gsm" | "lora-sx1276" | "rfid-rc522"
  | "wifi-module" | "zigbee-module" | "can-bus-mcp2515"
  // Power
  | "lm7805" | "lipo-battery" | "buck-converter" | "solar-panel"
  | "ina219-current" | "tp4056-charger"
  // Breadboard & PCB
  | "breadboard" | "breadboard-mini" | "perfboard"
  // Robots
  | "robot-2wd-car" | "robot-sumo" | "robot-4wd-car" | "robot-arm-4dof"
  | "robot-arm-6dof" | "robot-hexapod" | "robot-quadcopter"
  | "robot-tank-tracks" | "robot-humanoid"
  // Environment
  | "env-wall" | "env-ramp" | "env-obstacle" | "env-line-track"
  | "env-table" | "env-conveyor";

export interface SimComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  pins: Record<string, PinState>;
  properties: Record<string, number | string | boolean>;
  isStatic: boolean;
  mass: number;
  category: string;
}

export interface Wire {
  id: string;
  from: { componentId: string; pinId: string };
  to: { componentId: string; pinId: string };
  color: string;
}

export type SimulationState = "idle" | "running" | "paused";

export interface ConsoleMessage {
  type: "info" | "success" | "warning" | "error" | "serial";
  time: string;
  msg: string;
}

export interface WiringMode {
  active: boolean;
  from: { componentId: string; pinId: string } | null;
}

export type EnvironmentPreset = "empty" | "robotics-lab" | "line-follow-track" | "obstacle-course" | "warehouse";

// ─── Factory functions ─────────────────────────────────────
function makePins(defs: [string, PinMode, string][]): Record<string, PinState> {
  const pins: Record<string, PinState> = {};
  for (const [id, mode, label] of defs) {
    pins[id] = { mode, value: id === "5V" || id === "3V3" ? 1 : 0, label };
  }
  return pins;
}

function mcuPins(digital: number, analog: number): Record<string, PinState> {
  const pins: Record<string, PinState> = {};
  for (let i = 0; i < digital; i++) pins[`D${i}`] = { mode: "INPUT", value: 0, label: `Digital ${i}` };
  for (let i = 0; i < analog; i++) pins[`A${i}`] = { mode: "ANALOG", value: 0, label: `Analog ${i}` };
  pins["5V"] = { mode: "INPUT", value: 1, label: "5V" };
  pins["3V3"] = { mode: "INPUT", value: 1, label: "3.3V" };
  pins["GND"] = { mode: "INPUT", value: 0, label: "GND" };
  return pins;
}

function comp(
  id: string, type: ComponentType, name: string, pos: [number, number, number],
  pins: Record<string, PinState>, props: any = {},
  meta: Partial<SimComponent> = {}
): SimComponent {
  return {
    id, type, name, position: pos, rotation: [0, 0, 0], scale: [1, 1, 1],
    pins, properties: props, isStatic: false, mass: 10, category: "passive",
    ...meta
  };
}

const componentCreators: Record<string, (id: string, pos: [number, number, number]) => SimComponent> = {
  // --- Microcontrollers ---
  "arduino-uno": (id, pos) => comp(id, "arduino-uno", "Arduino Uno R3", pos, mcuPins(14, 6),
    { clockSpeed: 16e6, voltage: 5, flash: 32768, sram: 2048, chip: "ATmega328P" },
    { isStatic: true, mass: 25, category: "microcontroller" }),
  "arduino-mega": (id, pos) => comp(id, "arduino-mega", "Arduino Mega 2560", pos, mcuPins(54, 16),
    { clockSpeed: 16e6, voltage: 5, flash: 262144, sram: 8192, chip: "ATmega2560" },
    { isStatic: true, mass: 37, category: "microcontroller" }),
  "stm32f103": (id, pos) => comp(id, "stm32f103", "STM32F103 Blue Pill", pos, mcuPins(37, 10),
    { clockSpeed: 72e6, voltage: 3.3, flash: 65536, sram: 20480, chip: "ARM Cortex-M3" },
    { isStatic: true, mass: 12, category: "microcontroller" }),
  "esp32-wroom": (id, pos) => comp(id, "esp32-wroom", "ESP32-WROOM-32", pos, mcuPins(25, 12),
    { clockSpeed: 240e6, voltage: 3.3, flash: 4194304, sram: 524288, wifi: true, bluetooth: true },
    { isStatic: true, mass: 10, category: "microcontroller" }),
  "raspberry-pi-4b": (id, pos) => comp(id, "raspberry-pi-4b", "Raspberry Pi 4B", pos, mcuPins(28, 0),
    { cpu: "ARM Cortex-A72", ramGb: 4, voltage: 5, ethernet: true, wifi: true },
    { isStatic: true, mass: 46, category: "microcomputer" }),
  "breadboard": (id, pos) => comp(id, "breadboard", "Breadboard", pos,
    makePins([["VCC", "INPUT", "Power Rail +"], ["GND", "INPUT", "Power Rail -"]]),
    { rows: 30, columns: 10 }, { isStatic: true, mass: 35, category: "passive", scale: [1.6, 1, 1.2] }),
  "resistor": (id, pos) => comp(id, "resistor", "Resistor", pos,
    makePins([["A", "INPUT", "Lead A"], ["B", "INPUT", "Lead B"]]),
    { resistanceOhms: 220 }, { mass: 1, category: "passive", scale: [0.5, 0.5, 0.5] }),
  "capacitor": (id, pos) => comp(id, "capacitor", "Capacitor", pos,
    makePins([["A", "INPUT", "Lead A"], ["B", "INPUT", "Lead B"]]),
    { capacitanceUf: 10 }, { mass: 1, category: "passive", scale: [0.4, 0.7, 0.4] }),
  "button": (id, pos) => comp(id, "button", "Push Button", pos,
    makePins([["IN", "INPUT", "Input"], ["OUT", "OUTPUT", "Output"]]),
    { pressed: false }, { mass: 2, category: "input", scale: [0.5, 0.3, 0.5] }),
  "potentiometer": (id, pos) => comp(id, "potentiometer", "Potentiometer", pos,
    makePins([["VCC", "INPUT", "VCC"], ["WIPER", "ANALOG", "Wiper"], ["GND", "INPUT", "GND"]]),
    { value: 512 }, { mass: 3, category: "input", scale: [0.5, 0.5, 0.5] }),
  "buzzer": (id, pos) => comp(id, "buzzer", "Piezo Buzzer", pos,
    makePins([["SIGNAL", "PWM", "Signal"], ["GND", "INPUT", "Ground"]]),
    { active: false }, { mass: 2, category: "output", scale: [0.5, 0.3, 0.5] }),
  "lipo-battery": (id, pos) => comp(id, "lipo-battery", "LiPo Battery", pos,
    makePins([["POS", "OUTPUT", "Positive"], ["NEG", "INPUT", "Negative"]]),
    { voltage: 11.1, capacityMah: 2200 }, { mass: 180, category: "power", scale: [0.8, 0.3, 1.2] }),
  "led": (id, pos) => comp(id, "led", "LED", pos,
    makePins([["ANODE", "INPUT", "Anode"], ["CATHODE", "INPUT", "Cathode"]]),
    { brightness: 0, color: "red" }, { mass: 1, category: "output", scale: [0.25, 0.5, 0.25] }),
  "servo-sg90": (id, pos) => comp(id, "servo-sg90", "Servo SG90", pos,
    makePins([["SIGNAL", "PWM", "Signal"], ["5V", "INPUT", "5V"], ["GND", "INPUT", "GND"]]),
    { angle: 90, torqueKgCm: 1.8 }, { mass: 9, category: "actuator" }),
  "servo-mg996r": (id, pos) => comp(id, "servo-mg996r", "Servo MG996R", pos,
    makePins([["SIGNAL", "PWM", "Signal"], ["5V", "INPUT", "5V"], ["GND", "INPUT", "GND"]]),
    { angle: 90, torqueKgCm: 11 }, { mass: 55, category: "actuator" }),
  "dc-motor": (id, pos) => comp(id, "dc-motor", "DC Motor", pos,
    makePins([["POS", "INPUT", "Positive"], ["NEG", "INPUT", "Negative"]]),
    { rpm: 0, nominalVoltage: 6 }, { mass: 40, category: "actuator" }),
  "l298n-driver": (id, pos) => comp(id, "l298n-driver", "L298N Driver", pos,
    makePins([["IN1", "INPUT", "IN1"], ["IN2", "INPUT", "IN2"], ["ENA", "PWM", "ENA"], ["OUT1", "OUTPUT", "OUT1"], ["OUT2", "OUTPUT", "OUT2"]]),
    { channels: 2, supplyVoltage: 12 }, { isStatic: true, mass: 20, category: "actuator" }),
  "hc-sr04": (id, pos) => comp(id, "hc-sr04", "HC-SR04 Ultrasonic", pos,
    makePins([["TRIG", "OUTPUT", "Trigger"], ["ECHO", "INPUT", "Echo"], ["5V", "INPUT", "5V"], ["GND", "INPUT", "Ground"]]),
    { distanceCm: 120 }, { isStatic: true, mass: 8, category: "sensor" }),
  "dht22": (id, pos) => comp(id, "dht22", "DHT22 Sensor", pos,
    makePins([["DATA", "OUTPUT", "Data"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]),
    { temperatureC: 22, humidity: 45 }, { isStatic: true, mass: 4, category: "sensor" }),
  "mpu6050": (id, pos) => comp(id, "mpu6050", "MPU-6050 IMU", pos,
    makePins([["SDA", "OUTPUT", "I2C SDA"], ["SCL", "OUTPUT", "I2C SCL"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]),
    { roll: 0, pitch: 0, yaw: 0 }, { isStatic: true, mass: 3, category: "sensor" }),
  "robot-2wd-car": (id, pos) => comp(id, "robot-2wd-car", "2WD Smart Robot Car", pos,
    (() => {
      const p = mcuPins(14, 6);
      p["MOTOR_L1"] = { mode: "OUTPUT", value: 0, label: "Left Motor +" };
      p["MOTOR_L2"] = { mode: "OUTPUT", value: 0, label: "Left Motor -" };
      p["MOTOR_R1"] = { mode: "OUTPUT", value: 0, label: "Right Motor +" };
      p["MOTOR_R2"] = { mode: "OUTPUT", value: 0, label: "Right Motor -" };
      p["ENA"] = { mode: "PWM", value: 0, label: "Left Speed (PWM)" };
      p["ENB"] = { mode: "PWM", value: 0, label: "Right Speed (PWM)" };
      return p;
    })(),
    { linear_vel: 0, angular_vel: 0 },
    { mass: 500, category: "robot" }),
  "robot-sumo": (id, pos) => comp(id, "robot-sumo", "Sumo Robot", pos,
    (() => {
      const p = mcuPins(14, 6);
      p["MOTOR_L1"] = { mode: "OUTPUT", value: 0, label: "Left Motor +" };
      p["MOTOR_L2"] = { mode: "OUTPUT", value: 0, label: "Left Motor -" };
      p["MOTOR_R1"] = { mode: "OUTPUT", value: 0, label: "Right Motor +" };
      p["MOTOR_R2"] = { mode: "OUTPUT", value: 0, label: "Right Motor -" };
      return p;
    })(),
    { linear_vel: 0, angular_vel: 0 },
    { mass: 1500, category: "robot" }),
  "robot-4wd-car": (id, pos) => comp(id, "robot-4wd-car", "4WD Robot Chassis", pos, mcuPins(14, 6),
    { speed: 0 }, { mass: 800, category: "robot" }),
  "robot-arm-4dof": (id, pos) => comp(id, "robot-arm-4dof", "4-DOF Robotic Arm", pos,
    makePins([["BASE", "PWM", "Base Servo"], ["SHOULDER", "PWM", "Shoulder Servo"], ["ELBOW", "PWM", "Elbow Servo"], ["GRIPPER", "PWM", "Gripper Servo"]]),
    { base: 90, shoulder: 90, elbow: 90, gripper: 90 },
    { isStatic: true, mass: 450, category: "robot" }),
  "env-wall": (id, pos) => comp(id, "env-wall", "Wall", pos, {}, {}, { isStatic: true, category: "environment", scale: [3, 2, 0.2] }),
  "env-ramp": (id, pos) => comp(id, "env-ramp", "Ramp", pos, {}, { angle: 30 }, { isStatic: true, category: "environment" }),
  "env-obstacle": (id, pos) => comp(id, "env-obstacle", "Obstacle", pos, {}, {}, { isStatic: true, category: "environment", scale: [0.5, 0.5, 0.5] }),
  "env-line-track": (id, pos) => comp(id, "env-line-track", "Line Track", pos, {}, { size: 8 }, { isStatic: true, category: "environment" }),
  "env-table": (id, pos) => comp(id, "env-table", "Work Table", pos, {}, { width: 2, depth: 1, height: 0.8 }, { isStatic: true, category: "environment" }),
  "env-conveyor": (id, pos) => comp(id, "env-conveyor", "Conveyor Belt", pos, {}, { length: 3 }, { isStatic: true, category: "environment" }),
};

// ─── Initial State ──────────────────────────────────────────
const WIRE_COLORS = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff", "#ffffff", "#ff8800"];

const defaultFirmware = `// SimForge Virtual Lab — Firmware Editor
// Control your robots and circuits here.

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("System initialized...");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
  Serial.println("Heartbeat...");
}`;

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const ms = Math.floor((t % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

function buildEnvironment(preset: EnvironmentPreset): SimComponent[] {
  const comps: SimComponent[] = [];
  if (preset === "robotics-lab") {
    comps.push(componentCreators["env-table"]("table-1", [0, 0, 0]));
    comps.push(componentCreators["env-wall"]("wall-1", [0, 1, -5]));
    comps.push(componentCreators["breadboard"]("breadboard-1", [-2.4, 0.86, -0.4]));
    comps.push(componentCreators["led"]("led-1", [-1.9, 0.95, -0.1]));
    comps.push(componentCreators["resistor"]("resistor-1", [-2.2, 0.95, 0.1]));
    comps.push(componentCreators["button"]("button-1", [-2.0, 0.95, 0.45]));
  }
  return comps;
}

let compCounter = 10;

interface SimulationStore {
  projectId: string;
  projectName: string;
  projectDescription: string;
  activeDomains: DomainId[];
  selectedCodeTarget: string;
  simState: SimulationState;
  components: SimComponent[];
  wires: Wire[];
  selectedComponent: string | null;
  wiringMode: WiringMode;
  consoleMessages: ConsoleMessage[];
  activeTool: string;
  firmwareCode: string;
  showCodeEditor: boolean;
  simTime: number;
  physicsEnabled: boolean;
  gravity: number;
  environmentPreset: EnvironmentPreset;
  setProjectName: (name: string) => void;
  setProjectDescription: (description: string) => void;
  setActiveDomains: (domains: DomainId[]) => void;
  setSelectedCodeTarget: (target: string) => void;
  setSimState: (state: SimulationState) => void;
  addComponent: (type: string) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  updateComponentPosition: (id: string, pos: [number, number, number]) => void;
  updateComponentProperty: (id: string, key: string, value: any) => void;
  updatePinValue: (componentId: string, pinId: string, value: number) => void;
  updatePinMode: (componentId: string, pinId: string, mode: PinMode) => void;
  addWire: (from: { componentId: string; pinId: string }, to: { componentId: string; pinId: string }) => void;
  removeWire: (id: string) => void;
  setWiringMode: (mode: WiringMode) => void;
  log: (type: ConsoleMessage["type"], msg: string) => void;
  clearConsole: () => void;
  setActiveTool: (tool: string) => void;
  setFirmwareCode: (code: string) => void;
  setShowCodeEditor: (show: boolean) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  setGravity: (g: number) => void;
  incrementSimTime: (dt: number) => void;
  resetSimulation: () => void;
  propagateSignals: () => void;
  loadEnvironment: (preset: EnvironmentPreset) => void;
  exportProjectDocument: () => ReturnType<typeof buildProjectDocument>;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  projectId: "project-simforge-lab",
  projectName: "Universal Engineering Lab",
  projectDescription: "Multi-domain simulation workspace for robotics, embedded, and IoT validation.",
  activeDomains: ["robotics", "embedded", "iot"],
  selectedCodeTarget: "arduino-runtime",
  simState: "idle",
  components: [
    componentCreators["arduino-uno"]("arduino-1", [0, 0.85, 0]),
    componentCreators["robot-2wd-car"]("robot-1", [0, 0.22, 4.5]),
    componentCreators["breadboard"]("breadboard-main", [-1.8, 0.85, 0.1]),
    componentCreators["led"]("status-led", [-1.5, 0.95, 0.15]),
  ],
  wires: [],
  selectedComponent: null,
  wiringMode: { active: false, from: null },
  consoleMessages: [
    { type: "info", time: "00:00.00", msg: "SimForge v0.3 — Full Physics & Robotics Engine" },
    { type: "info", time: "00:00.00", msg: "Rapier physics — gravity: 9.81 m/s²" },
    { type: "success", time: "00:00.01", msg: "Robotics Lab environment loaded" },
  ],
  activeTool: "select",
  firmwareCode: defaultFirmware,
  showCodeEditor: false,
  simTime: 0,
  physicsEnabled: true,
  gravity: 9.81,
  environmentPreset: "robotics-lab",
  setProjectName: (projectName) => set({ projectName }),
  setProjectDescription: (projectDescription) => set({ projectDescription }),
  setActiveDomains: (activeDomains) => set({ activeDomains }),
  setSelectedCodeTarget: (selectedCodeTarget) => set({ selectedCodeTarget }),
  setSimState: (state) => {
    set({ simState: state });
    if (state === "running") get().log("success", "Simulation started — firmware executing");
    if (state === "paused") get().log("warning", "Simulation paused");
    if (state === "idle") get().log("info", "Simulation stopped");
  },
  addComponent: (type) => {
    const creator = componentCreators[type];
    if (!creator) { get().log("error", `Unknown component: ${type}`); return; }
    const id = `${type}-${++compCounter}`;
    const pos: [number, number, number] = [Math.random() * 6 - 3, 1.5, Math.random() * 6 - 3];
    const c = creator(id, pos);
    set((s) => ({ components: [...s.components, c] }));
    get().log("success", `Added ${c.name} to scene`);
  },
  removeComponent: (id) => set((s) => ({
    components: s.components.filter((c) => c.id !== id),
    wires: s.wires.filter((w) => w.from.componentId !== id && w.to.componentId !== id),
    selectedComponent: s.selectedComponent === id ? null : s.selectedComponent,
  })),
  selectComponent: (id) => set({ selectedComponent: id }),
  updateComponentPosition: (id, pos) => set((s) => ({
    components: s.components.map((c) => (c.id === id ? { ...c, position: pos } : c)),
  })),
  updateComponentProperty: (id, key, value) => set((s) => ({
    components: s.components.map((c) =>
      c.id === id ? { ...c, properties: { ...c.properties, [key]: value } } : c
    ),
  })),
  updatePinValue: (componentId, pinId, value) => set((s) => ({
    components: s.components.map((c) =>
      c.id === componentId && c.pins[pinId]
        ? { ...c, pins: { ...c.pins, [pinId]: { ...c.pins[pinId], value } } }
        : c
    ),
  })),
  updatePinMode: (componentId, pinId, mode) => set((s) => ({
    components: s.components.map((c) =>
      c.id === componentId && c.pins[pinId]
        ? { ...c, pins: { ...c.pins, [pinId]: { ...c.pins[pinId], mode } } }
        : c
    ),
  })),
  addWire: (from, to) => {
    const id = `wire-${Date.now()}`;
    const color = WIRE_COLORS[get().wires.length % WIRE_COLORS.length];
    set((s) => ({ wires: [...s.wires, { id, from, to, color }] }));
    get().log("success", `Wire: ${from.componentId}.${from.pinId} → ${to.componentId}.${to.pinId}`);
  },
  removeWire: (id) => set((s) => ({ wires: s.wires.filter((w) => w.id !== id) })),
  setWiringMode: (mode) => set({ wiringMode: mode }),
  log: (type, msg) => {
    const time = formatTime(get().simTime);
    set((s) => ({ consoleMessages: [...s.consoleMessages.slice(-200), { type, time, msg }] }));
  },
  clearConsole: () => set({ consoleMessages: [] }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setFirmwareCode: (code) => set({ firmwareCode: code }),
  setShowCodeEditor: (show) => set({ showCodeEditor: show }),
  setPhysicsEnabled: (enabled) => set({ physicsEnabled: enabled }),
  setGravity: (g) => set({ gravity: g }),
  incrementSimTime: (dt) => set((s) => ({ simTime: s.simTime + dt })),
  resetSimulation: () => {
    set({ simState: "idle", simTime: 0 });
    set((s) => ({
      components: s.components.map((c) => ({
        ...c,
        pins: Object.fromEntries(
          Object.entries(c.pins).map(([k, p]) => [k, { ...p, value: k === "5V" || k === "3V3" ? 1 : k === "WIPER" ? 512 : 0 }])
        ),
        properties: c.type === "led" ? { ...c.properties, brightness: 0 }
          : c.type.startsWith("servo") ? { ...c.properties, angle: 90 }
          : c.type === "robot-2wd-car" || c.type === "robot-sumo" ? { ...c.properties, linear_vel: 0, angular_vel: 0 }
          : c.properties,
      })),
    }));
    get().log("info", "Simulation reset");
  },
  propagateSignals: () => {
    const state = get();
    for (const wire of state.wires) {
      const fromComp = state.components.find((c) => c.id === wire.from.componentId);
      const toComp = state.components.find((c) => c.id === wire.to.componentId);
      if (!fromComp || !toComp) continue;
      const fromPin = fromComp.pins[wire.from.pinId];
      if (fromPin && (fromPin.mode === "OUTPUT" || fromPin.mode === "PWM")) {
        state.updatePinValue(wire.to.componentId, wire.to.pinId, fromPin.value);
      }
    }
    for (const comp of state.components) {
      if (comp.type === "led") {
        const anode = comp.pins["ANODE"];
        state.updateComponentProperty(comp.id, "brightness", anode?.value > 0 ? anode.value : 0);
      }
      if (comp.type.startsWith("servo")) {
        const signal = comp.pins["SIGNAL"];
        if (signal) state.updateComponentProperty(comp.id, "angle", (signal.value / 255) * 180);
      }
      if (comp.type === "buzzer") {
        const signal = comp.pins["SIGNAL"];
        state.updateComponentProperty(comp.id, "active", signal && signal.value > 0);
      }
    }
  },
  loadEnvironment: (preset) => {
    const envComps = buildEnvironment(preset);
    set((s) => ({
      environmentPreset: preset,
      components: [...s.components.filter((c) => c.category !== "environment"), ...envComps],
    }));
    get().log("success", `Environment loaded: ${preset}`);
  },
  exportProjectDocument: () =>
    buildProjectDocument({
      projectId: get().projectId,
      name: get().projectName,
      description: get().projectDescription,
      environment: get().environmentPreset,
      components: get().components,
      wires: get().wires,
      firmwareFiles: [{ name: "main.ino", content: get().firmwareCode, target: get().selectedCodeTarget, language: "cpp" }],
      activeDomains: get().activeDomains,
    }),
}));
