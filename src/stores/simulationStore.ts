import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────

export type PinMode = "INPUT" | "OUTPUT" | "INPUT_PULLUP" | "PWM" | "ANALOG";
export type PinState = {
  mode: PinMode;
  value: number; // 0-1 for digital, 0-1023 for analog, 0-255 for PWM
  label: string;
};

export type ComponentType =
  | "arduino-uno"
  | "esp32"
  | "breadboard"
  | "led"
  | "resistor"
  | "servo"
  | "hc-sr04"
  | "dht22"
  | "dc-motor"
  | "buzzer"
  | "button"
  | "potentiometer"
  | "lcd-16x2"
  | "relay";

export interface SimComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  pins: Record<string, PinState>;
  properties: Record<string, number | string | boolean>;
  isStatic: boolean;
  mass: number; // grams
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

// ─── Default components ────────────────────────────────────

function createArduinoUno(id: string, pos: [number, number, number]): SimComponent {
  const pins: Record<string, PinState> = {};
  for (let i = 0; i <= 13; i++) {
    pins[`D${i}`] = { mode: "INPUT", value: 0, label: `D${i}` };
  }
  for (let i = 0; i <= 5; i++) {
    pins[`A${i}`] = { mode: "ANALOG", value: 0, label: `A${i}` };
  }
  pins["5V"] = { mode: "OUTPUT", value: 1, label: "5V" };
  pins["3V3"] = { mode: "OUTPUT", value: 1, label: "3.3V" };
  pins["GND"] = { mode: "OUTPUT", value: 0, label: "GND" };
  pins["VIN"] = { mode: "INPUT", value: 0, label: "VIN" };

  return {
    id,
    type: "arduino-uno",
    name: "Arduino Uno R3",
    position: pos,
    rotation: [0, 0, 0],
    pins,
    properties: { clockSpeed: 16000000, voltage: 5, flashUsed: 0, sramUsed: 0 },
    isStatic: true,
    mass: 25,
  };
}

function createLed(id: string, pos: [number, number, number], color = "red"): SimComponent {
  return {
    id,
    type: "led",
    name: `LED (${color})`,
    position: pos,
    rotation: [0, 0, 0],
    pins: {
      ANODE: { mode: "INPUT", value: 0, label: "Anode (+)" },
      CATHODE: { mode: "INPUT", value: 0, label: "Cathode (-)" },
    },
    properties: { color, brightness: 0, forwardVoltage: 2.0, maxCurrent: 20 },
    isStatic: false,
    mass: 1,
  };
}

function createResistor(id: string, pos: [number, number, number], ohms = 220): SimComponent {
  return {
    id,
    type: "resistor",
    name: `Resistor ${ohms}Ω`,
    position: pos,
    rotation: [0, 0, 0],
    pins: {
      PIN1: { mode: "INPUT", value: 0, label: "Pin 1" },
      PIN2: { mode: "OUTPUT", value: 0, label: "Pin 2" },
    },
    properties: { resistance: ohms, power: 0.25, tolerance: 5 },
    isStatic: false,
    mass: 1,
  };
}

function createServo(id: string, pos: [number, number, number]): SimComponent {
  return {
    id,
    type: "servo",
    name: "SG90 Servo",
    position: pos,
    rotation: [0, 0, 0],
    pins: {
      SIGNAL: { mode: "INPUT", value: 0, label: "Signal (PWM)" },
      VCC: { mode: "INPUT", value: 0, label: "VCC" },
      GND: { mode: "INPUT", value: 0, label: "GND" },
    },
    properties: { angle: 90, minAngle: 0, maxAngle: 180, speed: 0.12 },
    isStatic: false,
    mass: 9,
  };
}

function createUltrasonic(id: string, pos: [number, number, number]): SimComponent {
  return {
    id,
    type: "hc-sr04",
    name: "HC-SR04 Ultrasonic",
    position: pos,
    rotation: [0, 0, 0],
    pins: {
      VCC: { mode: "INPUT", value: 0, label: "VCC" },
      TRIG: { mode: "INPUT", value: 0, label: "Trigger" },
      ECHO: { mode: "OUTPUT", value: 0, label: "Echo" },
      GND: { mode: "INPUT", value: 0, label: "GND" },
    },
    properties: { distance: 150, minRange: 2, maxRange: 400 },
    isStatic: false,
    mass: 8,
  };
}

function createButton(id: string, pos: [number, number, number]): SimComponent {
  return {
    id,
    type: "button",
    name: "Push Button",
    position: pos,
    rotation: [0, 0, 0],
    pins: {
      PIN1: { mode: "OUTPUT", value: 0, label: "Pin 1" },
      PIN2: { mode: "OUTPUT", value: 0, label: "Pin 2" },
    },
    properties: { pressed: false },
    isStatic: false,
    mass: 2,
  };
}

function createBuzzer(id: string, pos: [number, number, number]): SimComponent {
  return {
    id,
    type: "buzzer",
    name: "Piezo Buzzer",
    position: pos,
    rotation: [0, 0, 0],
    pins: {
      SIGNAL: { mode: "INPUT", value: 0, label: "Signal" },
      GND: { mode: "INPUT", value: 0, label: "GND" },
    },
    properties: { frequency: 0, active: false },
    isStatic: false,
    mass: 3,
  };
}

function createPotentiometer(id: string, pos: [number, number, number]): SimComponent {
  return {
    id,
    type: "potentiometer",
    name: "Potentiometer 10kΩ",
    position: pos,
    rotation: [0, 0, 0],
    pins: {
      VCC: { mode: "INPUT", value: 0, label: "VCC" },
      WIPER: { mode: "OUTPUT", value: 512, label: "Wiper" },
      GND: { mode: "INPUT", value: 0, label: "GND" },
    },
    properties: { value: 0.5, maxResistance: 10000 },
    isStatic: false,
    mass: 5,
  };
}

// ─── Store ──────────────────────────────────────────────────

interface SimulationStore {
  // State
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

  // Actions
  setSimState: (state: SimulationState) => void;
  addComponent: (type: ComponentType) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  updateComponentPosition: (id: string, pos: [number, number, number]) => void;
  updateComponentProperty: (id: string, key: string, value: number | string | boolean) => void;
  updatePinValue: (componentId: string, pinId: string, value: number) => void;
  updatePinMode: (componentId: string, pinId: string, mode: PinMode) => void;
  addWire: (from: Wire["from"], to: Wire["to"]) => void;
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
}

let compCounter = 0;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

const WIRE_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];

const defaultFirmware = `// Arduino Sketch — SimForge VM
// Supported: pinMode, digitalWrite, digitalRead,
// analogRead, analogWrite, delay, Serial.println

void setup() {
  pinMode(13, OUTPUT);   // Built-in LED
  pinMode(9, OUTPUT);    // Servo / PWM
  Serial.begin(9600);
  Serial.println("SimForge Arduino VM started!");
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(1000);
  
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(1000);
}
`;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simState: "idle",
  components: [
    createArduinoUno("arduino-1", [0, 0.15, 0]),
    createLed("led-1", [2.5, 0.3, -0.5], "red"),
    createLed("led-2", [2.5, 0.3, 0.5], "green"),
    createResistor("res-1", [1.8, 0.2, -0.5]),
    createServo("servo-1", [-2, 0.2, -1.5]),
    createUltrasonic("ultra-1", [-2, 0.2, 1.5]),
    createButton("btn-1", [3.5, 0.15, 0]),
    createBuzzer("buzz-1", [1.5, 0.2, 1.5]),
    createPotentiometer("pot-1", [3.5, 0.15, 1.5]),
  ],
  wires: [
    {
      id: "wire-1",
      from: { componentId: "arduino-1", pinId: "D13" },
      to: { componentId: "res-1", pinId: "PIN1" },
      color: WIRE_COLORS[0],
    },
    {
      id: "wire-2",
      from: { componentId: "res-1", pinId: "PIN2" },
      to: { componentId: "led-1", pinId: "ANODE" },
      color: WIRE_COLORS[0],
    },
    {
      id: "wire-3",
      from: { componentId: "led-1", pinId: "CATHODE" },
      to: { componentId: "arduino-1", pinId: "GND" },
      color: WIRE_COLORS[1],
    },
    {
      id: "wire-4",
      from: { componentId: "arduino-1", pinId: "D9" },
      to: { componentId: "servo-1", pinId: "SIGNAL" },
      color: WIRE_COLORS[2],
    },
    {
      id: "wire-5",
      from: { componentId: "arduino-1", pinId: "5V" },
      to: { componentId: "servo-1", pinId: "VCC" },
      color: WIRE_COLORS[3],
    },
  ],
  selectedComponent: "arduino-1",
  wiringMode: { active: false, from: null },
  consoleMessages: [
    { type: "info", time: "00:00.00", msg: "SimForge v0.1 — Physics simulation engine" },
    { type: "info", time: "00:00.00", msg: "Rapier physics loaded — gravity: 9.81 m/s²" },
    { type: "success", time: "00:00.01", msg: "Arduino Uno R3 initialized — 14 digital + 6 analog pins" },
    { type: "success", time: "00:00.01", msg: "5 wires connected" },
    { type: "info", time: "00:00.02", msg: "Ready — press ▶ Run to start simulation" },
  ],
  activeTool: "select",
  firmwareCode: defaultFirmware,
  showCodeEditor: false,
  simTime: 0,
  physicsEnabled: true,
  gravity: 9.81,

  setSimState: (state) => {
    set({ simState: state });
    const time = formatTime(get().simTime);
    if (state === "running") get().log("success", "Simulation started — firmware executing");
    if (state === "paused") get().log("warning", "Simulation paused");
    if (state === "idle") get().log("info", "Simulation stopped");
  },

  addComponent: (type) => {
    const id = `${type}-${++compCounter}`;
    const pos: [number, number, number] = [Math.random() * 4 - 2, 1, Math.random() * 4 - 2];
    let comp: SimComponent;
    switch (type) {
      case "arduino-uno": comp = createArduinoUno(id, pos); break;
      case "led": comp = createLed(id, pos); break;
      case "resistor": comp = createResistor(id, pos); break;
      case "servo": comp = createServo(id, pos); break;
      case "hc-sr04": comp = createUltrasonic(id, pos); break;
      case "button": comp = createButton(id, pos); break;
      case "buzzer": comp = createBuzzer(id, pos); break;
      case "potentiometer": comp = createPotentiometer(id, pos); break;
      default:
        comp = createLed(id, pos);
    }
    set((s) => ({ components: [...s.components, comp] }));
    get().log("success", `Added ${comp.name} to scene`);
  },

  removeComponent: (id) => {
    set((s) => ({
      components: s.components.filter((c) => c.id !== id),
      wires: s.wires.filter((w) => w.from.componentId !== id && w.to.componentId !== id),
      selectedComponent: s.selectedComponent === id ? null : s.selectedComponent,
    }));
  },

  selectComponent: (id) => set({ selectedComponent: id }),

  updateComponentPosition: (id, pos) =>
    set((s) => ({
      components: s.components.map((c) => (c.id === id ? { ...c, position: pos } : c)),
    })),

  updateComponentProperty: (id, key, value) =>
    set((s) => ({
      components: s.components.map((c) =>
        c.id === id ? { ...c, properties: { ...c.properties, [key]: value } } : c
      ),
    })),

  updatePinValue: (componentId, pinId, value) =>
    set((s) => ({
      components: s.components.map((c) =>
        c.id === componentId
          ? { ...c, pins: { ...c.pins, [pinId]: { ...c.pins[pinId], value } } }
          : c
      ),
    })),

  updatePinMode: (componentId, pinId, mode) =>
    set((s) => ({
      components: s.components.map((c) =>
        c.id === componentId
          ? { ...c, pins: { ...c.pins, [pinId]: { ...c.pins[pinId], mode } } }
          : c
      ),
    })),

  addWire: (from, to) => {
    const id = `wire-${Date.now()}`;
    const color = WIRE_COLORS[get().wires.length % WIRE_COLORS.length];
    set((s) => ({ wires: [...s.wires, { id, from, to, color }] }));
    get().log("success", `Wire connected: ${from.componentId}.${from.pinId} → ${to.componentId}.${to.pinId}`);
  },

  removeWire: (id) => set((s) => ({ wires: s.wires.filter((w) => w.id !== id) })),

  setWiringMode: (mode) => set({ wiringMode: mode }),

  log: (type, msg) => {
    const time = formatTime(get().simTime);
    set((s) => ({
      consoleMessages: [...s.consoleMessages.slice(-200), { type, time, msg }],
    }));
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
    // Reset all pin values
    set((s) => ({
      components: s.components.map((c) => ({
        ...c,
        pins: Object.fromEntries(
          Object.entries(c.pins).map(([k, p]) => [
            k,
            { ...p, value: k === "5V" || k === "3V3" ? 1 : k === "WIPER" ? 512 : 0 },
          ])
        ),
        properties:
          c.type === "led"
            ? { ...c.properties, brightness: 0 }
            : c.type === "servo"
            ? { ...c.properties, angle: 90 }
            : c.properties,
      })),
    }));
    get().log("info", "Simulation reset — all pins cleared");
  },

  propagateSignals: () => {
    const state = get();
    const { wires, components } = state;

    // Propagate values along wires
    for (const wire of wires) {
      const fromComp = components.find((c) => c.id === wire.from.componentId);
      const toComp = components.find((c) => c.id === wire.to.componentId);
      if (!fromComp || !toComp) continue;

      const fromPin = fromComp.pins[wire.from.pinId];
      if (!fromPin) continue;

      // If source pin is OUTPUT, propagate to destination
      if (fromPin.mode === "OUTPUT" || fromPin.mode === "PWM") {
        state.updatePinValue(wire.to.componentId, wire.to.pinId, fromPin.value);
      }
    }

    // Update component behaviors based on pin inputs
    for (const comp of components) {
      if (comp.type === "led") {
        const anode = comp.pins["ANODE"];
        if (anode && anode.value > 0) {
          state.updateComponentProperty(comp.id, "brightness", anode.value);
        } else {
          state.updateComponentProperty(comp.id, "brightness", 0);
        }
      }
      if (comp.type === "servo") {
        const signal = comp.pins["SIGNAL"];
        if (signal && signal.mode === "INPUT") {
          // Map PWM 0-255 to 0-180 degrees
          const angle = (signal.value / 255) * 180;
          state.updateComponentProperty(comp.id, "angle", angle);
        }
      }
      if (comp.type === "buzzer") {
        const signal = comp.pins["SIGNAL"];
        state.updateComponentProperty(comp.id, "active", signal && signal.value > 0);
      }
      if (comp.type === "potentiometer") {
        const potValue = comp.properties.value as number;
        state.updatePinValue(comp.id, "WIPER", Math.floor(potValue * 1023));
      }
    }
  },
}));
