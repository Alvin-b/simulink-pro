import { create } from "zustand";
import { buildProjectDocument } from "@/platform/projectSchema";
import { DomainId } from "@/modules/types";
import { getCatalogComponentBySku } from "@/platform/componentCatalog";

export type PinMode = "INPUT" | "OUTPUT" | "INPUT_PULLUP" | "PWM" | "ANALOG";

export type PinState = {
  mode: PinMode;
  value: number;
  label: string;
};

export type ComponentType = string;

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
  sourceSku?: string;
  vendor?: string;
  domain?: DomainId;
  simulationLevel?: string;
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

export type CodeWorkspaceFile = {
  name: string;
  language: string;
  content: string;
};

function makePins(defs: [string, PinMode, string][]): Record<string, PinState> {
  const pins: Record<string, PinState> = {};
  for (const [id, mode, label] of defs) {
    pins[id] = { mode, value: id === "5V" || id === "3V3" || id === "VCC" ? 1 : 0, label };
  }
  return pins;
}

function generatedPins(prefix: string, count: number, mode: PinMode, labelPrefix: string) {
  return Array.from({ length: count }, (_, index) => [`${prefix}${index + 1}`, mode, `${labelPrefix} ${index + 1}`] as [string, PinMode, string]);
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
  id: string,
  type: ComponentType,
  name: string,
  pos: [number, number, number],
  pins: Record<string, PinState>,
  props: Record<string, number | string | boolean> = {},
  meta: Partial<SimComponent> = {},
): SimComponent {
  return {
    id,
    type,
    name,
    position: pos,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    pins,
    properties: props,
    isStatic: false,
    mass: 10,
    category: "passive",
    ...meta,
  };
}

function pinsFromProtocols(protocols: string[]) {
  const normalized = protocols.map((protocol) => protocol.toUpperCase());
  const defs: [string, PinMode, string][] = [["VCC", "INPUT", "Supply"], ["GND", "INPUT", "Ground"]];
  if (normalized.some((protocol) => protocol.includes("GPIO"))) defs.push(["SIG", "INPUT", "General Signal"]);
  if (normalized.some((protocol) => protocol.includes("PWM"))) defs.push(["PWM", "PWM", "PWM"]);
  if (normalized.some((protocol) => protocol.includes("ADC") || protocol.includes("ANALOG"))) defs.push(["AOUT", "ANALOG", "Analog Signal"]);
  if (normalized.some((protocol) => protocol.includes("UART"))) defs.push(["TX", "OUTPUT", "UART TX"], ["RX", "INPUT", "UART RX"]);
  if (normalized.some((protocol) => protocol.includes("I2C"))) defs.push(["SDA", "OUTPUT", "I2C SDA"], ["SCL", "OUTPUT", "I2C SCL"]);
  if (normalized.some((protocol) => protocol.includes("SPI"))) defs.push(["MOSI", "OUTPUT", "SPI MOSI"], ["MISO", "INPUT", "SPI MISO"], ["SCK", "OUTPUT", "SPI Clock"], ["CS", "OUTPUT", "Chip Select"]);
  if (normalized.some((protocol) => protocol.includes("CAN"))) defs.push(["CANH", "OUTPUT", "CAN High"], ["CANL", "OUTPUT", "CAN Low"]);
  if (normalized.some((protocol) => protocol.includes("STEP/DIR"))) defs.push(["STEP", "OUTPUT", "Step"], ["DIR", "OUTPUT", "Direction"], ["EN", "OUTPUT", "Enable"]);
  return makePins(defs);
}

function buildCatalogTwin(id: string, sku: string, pos: [number, number, number]): SimComponent | null {
  const catalogComponent = getCatalogComponentBySku(sku);
  if (!catalogComponent) return null;

  return comp(
    id,
    catalogComponent.componentType,
    catalogComponent.name,
    pos,
    pinsFromProtocols(catalogComponent.protocols),
    {
      packageType: catalogComponent.packageType,
      protocols: catalogComponent.protocols.join(", "),
      engineeringNotes: catalogComponent.notes,
    },
    {
      category: catalogComponent.category,
      isStatic: catalogComponent.category !== "robotics" && catalogComponent.category !== "aerospace",
      mass: catalogComponent.category === "robotics" || catalogComponent.category === "aerospace" ? 300 : 14,
      sourceSku: catalogComponent.sku,
      vendor: catalogComponent.vendor,
      domain: catalogComponent.domain,
      simulationLevel: catalogComponent.simulationLevel,
      scale: catalogComponent.category === "robotics" || catalogComponent.category === "aerospace" ? [1, 1, 1] : [0.72, 0.2, 0.48],
    },
  );
}

const boardDefaults = { isStatic: true, mass: 12, category: "microcontroller" } as const;
const sensorDefaults = { isStatic: true, mass: 5, category: "sensor" } as const;
const networkDefaults = { isStatic: true, mass: 7, category: "communication" } as const;

const componentCreators: Record<string, (id: string, pos: [number, number, number]) => SimComponent> = {
  "arduino-uno": (id, pos) => comp(id, "arduino-uno", "Arduino Uno R3", pos, mcuPins(14, 6), { clockSpeed: 16e6, voltage: 5, flash: 32768, sram: 2048, chip: "ATmega328P" }, { ...boardDefaults, mass: 25 }),
  "arduino-mega": (id, pos) => comp(id, "arduino-mega", "Arduino Mega 2560", pos, mcuPins(54, 16), { clockSpeed: 16e6, voltage: 5, flash: 262144, sram: 8192, chip: "ATmega2560" }, { ...boardDefaults, mass: 37 }),
  "arduino-nano": (id, pos) => comp(id, "arduino-nano", "Arduino Nano", pos, mcuPins(14, 8), { clockSpeed: 16e6, voltage: 5, flash: 32768, sram: 2048, chip: "ATmega328P" }, boardDefaults),
  "esp32-wroom": (id, pos) => comp(id, "esp32-wroom", "ESP32-WROOM-32", pos, mcuPins(25, 12), { clockSpeed: 240e6, voltage: 3.3, flash: 4194304, sram: 524288, wifi: true, bluetooth: true }, boardDefaults),
  "esp8266-nodemcu": (id, pos) => comp(id, "esp8266-nodemcu", "NodeMCU ESP8266", pos, mcuPins(11, 1), { clockSpeed: 80e6, voltage: 3.3, wifi: true }, boardDefaults),
  "stm32f103": (id, pos) => comp(id, "stm32f103", "STM32F103 Blue Pill", pos, mcuPins(37, 10), { clockSpeed: 72e6, voltage: 3.3, flash: 65536, sram: 20480, chip: "ARM Cortex-M3" }, boardDefaults),
  "attiny85": (id, pos) => comp(id, "attiny85", "ATtiny85", pos, mcuPins(6, 4), { clockSpeed: 8e6, voltage: 5, flash: 8192 }, boardDefaults),
  "raspberry-pi-4b": (id, pos) => comp(id, "raspberry-pi-4b", "Raspberry Pi 4B", pos, mcuPins(28, 0), { cpu: "ARM Cortex-A72", ramGb: 4, voltage: 5, ethernet: true, wifi: true }, { isStatic: true, mass: 46, category: "microcomputer" }),
  "raspberry-pi-pico": (id, pos) => comp(id, "raspberry-pi-pico", "Raspberry Pi Pico", pos, mcuPins(26, 3), { chip: "RP2040", voltage: 3.3 }, { isStatic: true, mass: 8, category: "microcontroller" }),
  "raspberry-pi-zero": (id, pos) => comp(id, "raspberry-pi-zero", "Raspberry Pi Zero", pos, mcuPins(26, 0), { cpu: "ARM1176JZF-S", wifi: true }, { isStatic: true, mass: 9, category: "microcomputer" }),
  "jetson-nano": (id, pos) => comp(id, "jetson-nano", "Jetson Nano", pos, mcuPins(40, 0), { gpu: "128-core Maxwell", ai: true }, { isStatic: true, mass: 45, category: "microcomputer" }),
  "beaglebone-black": (id, pos) => comp(id, "beaglebone-black", "BeagleBone Black", pos, mcuPins(65, 7), { cpu: "AM335x", realtime: true }, { isStatic: true, mass: 39, category: "microcomputer" }),
  "breadboard": (id, pos) => comp(id, "breadboard", "Breadboard", pos, makePins([["VCC", "INPUT", "Power Rail +"], ["GND", "INPUT", "Power Rail -"]]), { rows: 30, columns: 10 }, { isStatic: true, mass: 35, category: "passive", scale: [1.6, 1, 1.2] }),
  "breadboard-mini": (id, pos) => comp(id, "breadboard-mini", "Mini Breadboard", pos, makePins([["VCC", "INPUT", "Power Rail +"], ["GND", "INPUT", "Power Rail -"]]), { rows: 17, columns: 10 }, { isStatic: true, mass: 18, category: "passive", scale: [1, 0.8, 0.9] }),
  "perfboard": (id, pos) => comp(id, "perfboard", "Perfboard", pos, makePins([["VCC", "INPUT", "Bus +"], ["GND", "INPUT", "Bus -"]]), { rows: 20, columns: 14 }, { isStatic: true, mass: 22, category: "passive" }),
  "resistor": (id, pos) => comp(id, "resistor", "Resistor", pos, makePins([["A", "INPUT", "Lead A"], ["B", "INPUT", "Lead B"]]), { resistanceOhms: 220 }, { mass: 1, category: "passive", scale: [0.5, 0.5, 0.5] }),
  "capacitor": (id, pos) => comp(id, "capacitor", "Capacitor", pos, makePins([["A", "INPUT", "Lead A"], ["B", "INPUT", "Lead B"]]), { capacitanceUf: 10 }, { mass: 1, category: "passive", scale: [0.4, 0.7, 0.4] }),
  "diode": (id, pos) => comp(id, "diode", "Diode", pos, makePins([["ANODE", "INPUT", "Anode"], ["CATHODE", "INPUT", "Cathode"]]), { forwardVoltage: 0.7 }, { mass: 1, category: "passive" }),
  "transistor-2n2222": (id, pos) => comp(id, "transistor-2n2222", "2N2222 Transistor", pos, makePins([["B", "INPUT", "Base"], ["C", "OUTPUT", "Collector"], ["E", "INPUT", "Emitter"]]), { gain: 100 }, { mass: 1, category: "passive" }),
  "button": (id, pos) => comp(id, "button", "Push Button", pos, makePins([["IN", "INPUT", "Input"], ["OUT", "OUTPUT", "Output"]]), { pressed: false }, { mass: 2, category: "input", scale: [0.5, 0.3, 0.5] }),
  "potentiometer": (id, pos) => comp(id, "potentiometer", "Potentiometer", pos, makePins([["VCC", "INPUT", "VCC"], ["WIPER", "ANALOG", "Wiper"], ["GND", "INPUT", "GND"]]), { value: 512 }, { mass: 3, category: "input", scale: [0.5, 0.5, 0.5] }),
  "rotary-encoder": (id, pos) => comp(id, "rotary-encoder", "Rotary Encoder", pos, makePins([["CLK", "OUTPUT", "Clock"], ["DT", "OUTPUT", "Data"], ["SW", "OUTPUT", "Switch"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { steps: 0 }, { mass: 4, category: "input" }),
  "joystick": (id, pos) => comp(id, "joystick", "Joystick Module", pos, makePins([["VRX", "ANALOG", "X Axis"], ["VRY", "ANALOG", "Y Axis"], ["SW", "OUTPUT", "Switch"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { x: 512, y: 512, pressed: false }, { mass: 5, category: "input" }),
  "touch-sensor": (id, pos) => comp(id, "touch-sensor", "Touch Sensor", pos, makePins([["OUT", "OUTPUT", "Touch Out"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { touched: false }, { ...sensorDefaults, category: "input" }),
  "buzzer": (id, pos) => comp(id, "buzzer", "Piezo Buzzer", pos, makePins([["SIGNAL", "PWM", "Signal"], ["GND", "INPUT", "Ground"]]), { active: false }, { mass: 2, category: "output", scale: [0.5, 0.3, 0.5] }),
  "led": (id, pos) => comp(id, "led", "LED", pos, makePins([["ANODE", "INPUT", "Anode"], ["CATHODE", "INPUT", "Cathode"]]), { brightness: 0, color: "red" }, { mass: 1, category: "output", scale: [0.25, 0.5, 0.25] }),
  "led-rgb": (id, pos) => comp(id, "led-rgb", "RGB LED", pos, makePins([["R", "PWM", "Red"], ["G", "PWM", "Green"], ["B", "PWM", "Blue"], ["COM", "INPUT", "Common"]]), { red: 0, green: 0, blue: 0 }, { mass: 1, category: "output" }),
  "relay-module": (id, pos) => comp(id, "relay-module", "Relay Module", pos, makePins([["IN", "INPUT", "Signal"], ["COM", "OUTPUT", "Common"], ["NO", "OUTPUT", "Normally Open"], ["NC", "OUTPUT", "Normally Closed"]]), { active: false }, { isStatic: true, mass: 10, category: "output" }),
  "mosfet-irf540": (id, pos) => comp(id, "mosfet-irf540", "IRF540 MOSFET", pos, makePins([["G", "INPUT", "Gate"], ["D", "OUTPUT", "Drain"], ["S", "INPUT", "Source"]]), { onResistance: 0.077 }, { mass: 2, category: "output" }),
  "servo-sg90": (id, pos) => comp(id, "servo-sg90", "Servo SG90", pos, makePins([["SIGNAL", "PWM", "Signal"], ["5V", "INPUT", "5V"], ["GND", "INPUT", "GND"]]), { angle: 90, torqueKgCm: 1.8 }, { mass: 9, category: "actuator" }),
  "servo-mg996r": (id, pos) => comp(id, "servo-mg996r", "Servo MG996R", pos, makePins([["SIGNAL", "PWM", "Signal"], ["5V", "INPUT", "5V"], ["GND", "INPUT", "GND"]]), { angle: 90, torqueKgCm: 11 }, { mass: 55, category: "actuator" }),
  "nema17-stepper": (id, pos) => comp(id, "nema17-stepper", "NEMA17 Stepper", pos, makePins([["A+", "INPUT", "Coil A+"], ["A-", "INPUT", "Coil A-"], ["B+", "INPUT", "Coil B+"], ["B-", "INPUT", "Coil B-"]]), { stepsPerRev: 200, rpm: 0 }, { mass: 220, category: "actuator" }),
  "dc-motor": (id, pos) => comp(id, "dc-motor", "DC Motor", pos, makePins([["POS", "INPUT", "Positive"], ["NEG", "INPUT", "Negative"]]), { rpm: 0, nominalVoltage: 6 }, { mass: 40, category: "actuator" }),
  "dc-motor-encoder": (id, pos) => comp(id, "dc-motor-encoder", "DC Motor w/ Encoder", pos, makePins([["POS", "INPUT", "Positive"], ["NEG", "INPUT", "Negative"], ["ENC_A", "OUTPUT", "Encoder A"], ["ENC_B", "OUTPUT", "Encoder B"]]), { rpm: 0, ticks: 0 }, { mass: 55, category: "actuator" }),
  "l298n-driver": (id, pos) => comp(id, "l298n-driver", "L298N Driver", pos, makePins([["12V", "INPUT", "Motor Supply"], ["GND", "INPUT", "Ground"], ["5V", "INPUT", "Logic Supply"], ["IN1", "INPUT", "IN1"], ["IN2", "INPUT", "IN2"], ["ENA", "PWM", "ENA"], ["OUT1", "OUTPUT", "OUT1"], ["OUT2", "OUTPUT", "OUT2"]]), { channels: 2, supplyVoltage: 12, enabled: false, fault: false, faultReason: "" }, { isStatic: true, mass: 20, category: "actuator" }),
  "a4988-driver": (id, pos) => comp(id, "a4988-driver", "A4988 Driver", pos, makePins([["STEP", "INPUT", "Step"], ["DIR", "INPUT", "Direction"], ["EN", "INPUT", "Enable"], ["VMOT", "INPUT", "Motor V"], ["GND", "INPUT", "Ground"]]), { microsteps: 16 }, { isStatic: true, mass: 6, category: "actuator" }),
  "solenoid-valve": (id, pos) => comp(id, "solenoid-valve", "Solenoid Valve", pos, makePins([["V+", "INPUT", "Power"], ["GND", "INPUT", "Ground"], ["CTRL", "INPUT", "Control"]]), { open: false }, { mass: 60, category: "actuator" }),
  "linear-actuator": (id, pos) => comp(id, "linear-actuator", "Linear Actuator", pos, makePins([["EXTEND", "INPUT", "Extend"], ["RETRACT", "INPUT", "Retract"], ["V+", "INPUT", "Power"], ["GND", "INPUT", "Ground"]]), { extension: 0 }, { mass: 140, category: "actuator" }),
  "hc-sr04": (id, pos) => comp(id, "hc-sr04", "HC-SR04 Ultrasonic", pos, makePins([["TRIG", "OUTPUT", "Trigger"], ["ECHO", "INPUT", "Echo"], ["5V", "INPUT", "5V"], ["GND", "INPUT", "Ground"]]), { distanceCm: 120 }, sensorDefaults),
  "dht22": (id, pos) => comp(id, "dht22", "DHT22 Sensor", pos, makePins([["DATA", "OUTPUT", "Data"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { temperatureC: 22, humidity: 45 }, sensorDefaults),
  "dht11": (id, pos) => comp(id, "dht11", "DHT11 Sensor", pos, makePins([["DATA", "OUTPUT", "Data"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { temperatureC: 23, humidity: 40 }, sensorDefaults),
  "bmp280": (id, pos) => comp(id, "bmp280", "BMP280", pos, makePins([["SDA", "OUTPUT", "I2C SDA"], ["SCL", "OUTPUT", "I2C SCL"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { pressurePa: 101325, temperatureC: 21 }, sensorDefaults),
  "mpu6050": (id, pos) => comp(id, "mpu6050", "MPU-6050 IMU", pos, makePins([["SDA", "OUTPUT", "I2C SDA"], ["SCL", "OUTPUT", "I2C SCL"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { roll: 0, pitch: 0, yaw: 0 }, sensorDefaults),
  "ir-sensor": (id, pos) => comp(id, "ir-sensor", "IR Sensor", pos, makePins([["OUT", "OUTPUT", "Signal"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { detected: false }, sensorDefaults),
  "pir-sensor": (id, pos) => comp(id, "pir-sensor", "PIR Motion Sensor", pos, makePins([["OUT", "OUTPUT", "Motion"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { motion: false }, sensorDefaults),
  "ldr-module": (id, pos) => comp(id, "ldr-module", "LDR Module", pos, makePins([["AO", "ANALOG", "Analog Out"], ["DO", "OUTPUT", "Digital Out"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { lux: 320 }, sensorDefaults),
  "hx711": (id, pos) => comp(id, "hx711", "HX711 Load Cell Amp", pos, makePins([["DT", "OUTPUT", "Data"], ["SCK", "INPUT", "Clock"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { weightGrams: 0 }, sensorDefaults),
  "gps-neo6m": (id, pos) => comp(id, "gps-neo6m", "GPS NEO-6M", pos, makePins([["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { latitude: 37.7749, longitude: -122.4194 }, sensorDefaults),
  "soil-moisture": (id, pos) => comp(id, "soil-moisture", "Soil Moisture Sensor", pos, makePins([["AO", "ANALOG", "Analog Out"], ["DO", "OUTPUT", "Threshold Out"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { moisture: 48 }, sensorDefaults),
  "mq2-gas": (id, pos) => comp(id, "mq2-gas", "MQ-2 Gas Sensor", pos, makePins([["AO", "ANALOG", "Analog Out"], ["DO", "OUTPUT", "Digital Out"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { ppm: 0 }, sensorDefaults),
  "water-level": (id, pos) => comp(id, "water-level", "Water Level Sensor", pos, makePins([["SIG", "ANALOG", "Signal"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { level: 12 }, sensorDefaults),
  "line-follower-ir": (id, pos) => comp(id, "line-follower-ir", "Line Follower Array", pos, makePins([["L", "OUTPUT", "Left"], ["C", "OUTPUT", "Center"], ["R", "OUTPUT", "Right"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { lineVisible: true }, sensorDefaults),
  "color-sensor-tcs3200": (id, pos) => comp(id, "color-sensor-tcs3200", "TCS3200 Color Sensor", pos, makePins([["S0", "INPUT", "S0"], ["S1", "INPUT", "S1"], ["S2", "INPUT", "S2"], ["S3", "INPUT", "S3"], ["OUT", "OUTPUT", "Out"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { color: "red" }, sensorDefaults),
  "lidar-lite": (id, pos) => comp(id, "lidar-lite", "LIDAR Lite", pos, makePins([["SDA", "OUTPUT", "I2C SDA"], ["SCL", "OUTPUT", "I2C SCL"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { distanceM: 4.2 }, sensorDefaults),
  "oled-ssd1306": (id, pos) => comp(id, "oled-ssd1306", "OLED SSD1306", pos, makePins([["SDA", "INPUT", "I2C SDA"], ["SCL", "INPUT", "I2C SCL"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { text: "READY" }, { isStatic: true, mass: 5, category: "display" }),
  "lcd-16x2": (id, pos) => comp(id, "lcd-16x2", "LCD 16x2", pos, makePins([["RS", "INPUT", "RS"], ["EN", "INPUT", "EN"], ...generatedPins("D", 4, "INPUT", "Data"), ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { text: "SimForge" }, { isStatic: true, mass: 14, category: "display" }),
  "lcd-20x4": (id, pos) => comp(id, "lcd-20x4", "LCD 20x4", pos, makePins([["RS", "INPUT", "RS"], ["EN", "INPUT", "EN"], ...generatedPins("D", 4, "INPUT", "Data"), ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { text: "System Online" }, { isStatic: true, mass: 18, category: "display" }),
  "tft-ili9341": (id, pos) => comp(id, "tft-ili9341", "TFT ILI9341", pos, makePins([["MOSI", "INPUT", "MOSI"], ["MISO", "OUTPUT", "MISO"], ["SCK", "INPUT", "Clock"], ["CS", "INPUT", "Chip Select"], ["DC", "INPUT", "Data/Command"], ["RST", "INPUT", "Reset"]]), { frameRate: 60 }, { isStatic: true, mass: 20, category: "display" }),
  "led-matrix-8x8": (id, pos) => comp(id, "led-matrix-8x8", "LED Matrix 8x8", pos, makePins([["DIN", "INPUT", "Data In"], ["CS", "INPUT", "Chip Select"], ["CLK", "INPUT", "Clock"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { litPixels: 0 }, { isStatic: true, mass: 6, category: "display" }),
  "seven-segment": (id, pos) => comp(id, "seven-segment", "Seven Segment Display", pos, makePins([...generatedPins("SEG", 7, "INPUT", "Segment"), ["COM", "INPUT", "Common"]]), { digit: 0 }, { isStatic: true, mass: 4, category: "display" }),
  "nrf24l01": (id, pos) => comp(id, "nrf24l01", "nRF24L01", pos, makePins([["CE", "INPUT", "Chip Enable"], ["CSN", "INPUT", "Chip Select"], ["SCK", "INPUT", "Clock"], ["MOSI", "INPUT", "MOSI"], ["MISO", "OUTPUT", "MISO"], ["IRQ", "OUTPUT", "IRQ"]]), { channel: 76 }, networkDefaults),
  "hc05-bluetooth": (id, pos) => comp(id, "hc05-bluetooth", "HC-05 Bluetooth", pos, makePins([["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["STATE", "OUTPUT", "State"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { paired: false }, networkDefaults),
  "hc06-bluetooth": (id, pos) => comp(id, "hc06-bluetooth", "HC-06 Bluetooth", pos, makePins([["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { paired: false }, networkDefaults),
  "sim800l-gsm": (id, pos) => comp(id, "sim800l-gsm", "SIM800L GSM", pos, makePins([["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["RST", "INPUT", "Reset"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { signalDbm: -70 }, networkDefaults),
  "lora-sx1276": (id, pos) => comp(id, "lora-sx1276", "LoRa SX1276", pos, makePins([["MOSI", "INPUT", "MOSI"], ["MISO", "OUTPUT", "MISO"], ["SCK", "INPUT", "Clock"], ["NSS", "INPUT", "Select"], ["DIO0", "OUTPUT", "IRQ"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { spreadingFactor: 7 }, networkDefaults),
  "rfid-rc522": (id, pos) => comp(id, "rfid-rc522", "RC522 RFID", pos, makePins([["SDA", "INPUT", "SDA"], ["SCK", "INPUT", "Clock"], ["MOSI", "INPUT", "MOSI"], ["MISO", "OUTPUT", "MISO"], ["RST", "INPUT", "Reset"]]), { tagPresent: false }, networkDefaults),
  "wifi-module": (id, pos) => comp(id, "wifi-module", "Wi-Fi Module", pos, makePins([["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["3V3", "INPUT", "3.3V"], ["GND", "INPUT", "Ground"]]), { connected: true, rssi: -48 }, networkDefaults),
  "zigbee-module": (id, pos) => comp(id, "zigbee-module", "Zigbee Module", pos, makePins([["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["3V3", "INPUT", "3.3V"], ["GND", "INPUT", "Ground"]]), { connected: false, meshDepth: 2 }, networkDefaults),
  "can-bus-mcp2515": (id, pos) => comp(id, "can-bus-mcp2515", "CAN Bus MCP2515", pos, makePins([["CANH", "OUTPUT", "CAN High"], ["CANL", "OUTPUT", "CAN Low"], ["CS", "INPUT", "Chip Select"], ["INT", "OUTPUT", "Interrupt"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { bitrate: 500000 }, networkDefaults),
  "lm7805": (id, pos) => comp(id, "lm7805", "LM7805 Regulator", pos, makePins([["VIN", "INPUT", "Input"], ["GND", "INPUT", "Ground"], ["VOUT", "OUTPUT", "5V Out"]]), { outputVoltage: 5 }, { mass: 3, category: "power" }),
  "lipo-battery": (id, pos) => comp(id, "lipo-battery", "LiPo Battery", pos, makePins([["POS", "OUTPUT", "Positive"], ["NEG", "INPUT", "Negative"]]), { voltage: 11.1, capacityMah: 2200 }, { mass: 180, category: "power", scale: [0.8, 0.3, 1.2] }),
  "buck-converter": (id, pos) => comp(id, "buck-converter", "Buck Converter", pos, makePins([["VIN+", "INPUT", "VIN+"], ["VIN-", "INPUT", "VIN-"], ["VOUT+", "OUTPUT", "VOUT+"], ["VOUT-", "OUTPUT", "VOUT-"]]), { outputVoltage: 5 }, { mass: 20, category: "power" }),
  "solar-panel": (id, pos) => comp(id, "solar-panel", "Solar Panel", pos, makePins([["POS", "OUTPUT", "Positive"], ["NEG", "INPUT", "Negative"]]), { watts: 20, irradiance: 750 }, { mass: 240, category: "power", scale: [1.4, 0.08, 1] }),
  "ina219-current": (id, pos) => comp(id, "ina219-current", "INA219 Current Monitor", pos, makePins([["SDA", "OUTPUT", "I2C SDA"], ["SCL", "OUTPUT", "I2C SCL"], ["VIN+", "INPUT", "VIN+"], ["VIN-", "INPUT", "VIN-"]]), { currentMa: 0 }, { isStatic: true, mass: 4, category: "power" }),
  "tp4056-charger": (id, pos) => comp(id, "tp4056-charger", "TP4056 Charger", pos, makePins([["IN+", "INPUT", "USB+"], ["IN-", "INPUT", "USB-"], ["BAT+", "OUTPUT", "Battery+"], ["BAT-", "OUTPUT", "Battery-"]]), { charging: false }, { isStatic: true, mass: 5, category: "power" }),
  "robot-2wd-car": (id, pos) => comp(id, "robot-2wd-car", "2WD Smart Robot Car", pos, { ...mcuPins(14, 6), MOTOR_L1: { mode: "OUTPUT", value: 0, label: "Left Motor +" }, MOTOR_L2: { mode: "OUTPUT", value: 0, label: "Left Motor -" }, MOTOR_R1: { mode: "OUTPUT", value: 0, label: "Right Motor +" }, MOTOR_R2: { mode: "OUTPUT", value: 0, label: "Right Motor -" }, ENA: { mode: "PWM", value: 0, label: "Left Speed" }, ENB: { mode: "PWM", value: 0, label: "Right Speed" } }, { linear_vel: 0, angular_vel: 0 }, { mass: 500, category: "robot" }),
  "robot-sumo": (id, pos) => comp(id, "robot-sumo", "Sumo Robot", pos, { ...mcuPins(14, 6), MOTOR_L1: { mode: "OUTPUT", value: 0, label: "Left Motor +" }, MOTOR_L2: { mode: "OUTPUT", value: 0, label: "Left Motor -" }, MOTOR_R1: { mode: "OUTPUT", value: 0, label: "Right Motor +" }, MOTOR_R2: { mode: "OUTPUT", value: 0, label: "Right Motor -" } }, { linear_vel: 0, angular_vel: 0, traction: "high" }, { mass: 1500, category: "robot" }),
  "robot-4wd-car": (id, pos) => comp(id, "robot-4wd-car", "4WD Robot Chassis", pos, { ...mcuPins(14, 6), ...Object.fromEntries(generatedPins("M", 4, "PWM", "Motor")) }, { speed: 0, steering: 0 }, { mass: 800, category: "robot" }),
  "robot-arm-4dof": (id, pos) => comp(id, "robot-arm-4dof", "4-DOF Robotic Arm", pos, makePins([["BASE", "PWM", "Base Servo"], ["SHOULDER", "PWM", "Shoulder Servo"], ["ELBOW", "PWM", "Elbow Servo"], ["GRIPPER", "PWM", "Gripper Servo"]]), { base: 90, shoulder: 90, elbow: 90, gripper: 90 }, { isStatic: true, mass: 450, category: "robot" }),
  "robot-arm-6dof": (id, pos) => comp(id, "robot-arm-6dof", "6-DOF Robotic Arm", pos, makePins([...generatedPins("J", 6, "PWM", "Joint"), ["GRIP", "PWM", "Gripper"]]), { reachMm: 650, payloadGrams: 500 }, { isStatic: true, mass: 780, category: "robot" }),
  "robot-hexapod": (id, pos) => comp(id, "robot-hexapod", "Hexapod Robot", pos, makePins([...generatedPins("LEG", 18, "PWM", "Leg Joint"), ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { gait: "tripod", stability: 100 }, { mass: 1200, category: "robot" }),
  "robot-quadcopter": (id, pos) => comp(id, "robot-quadcopter", "Quadcopter Drone", pos, makePins([["M1", "PWM", "Motor 1"], ["M2", "PWM", "Motor 2"], ["M3", "PWM", "Motor 3"], ["M4", "PWM", "Motor 4"], ["BAT", "INPUT", "Battery"], ["GND", "INPUT", "Ground"]]), { altitude: 0, roll: 0, pitch: 0, yaw: 0, armed: false }, { mass: 850, category: "robot" }),
  "robot-tank-tracks": (id, pos) => comp(id, "robot-tank-tracks", "Tracked Robot", pos, makePins([["LEFT", "PWM", "Left Track"], ["RIGHT", "PWM", "Right Track"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { speed: 0, heading: 0 }, { mass: 1300, category: "robot" }),
  "robot-humanoid": (id, pos) => comp(id, "robot-humanoid", "Humanoid Robot", pos, makePins([...generatedPins("AXIS", 12, "PWM", "Axis"), ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "Ground"]]), { balance: 100, walking: false }, { mass: 1800, category: "robot" }),
  "env-wall": (id, pos) => comp(id, "env-wall", "Wall", pos, {}, {}, { isStatic: true, category: "environment", scale: [3, 2, 0.2] }),
  "env-ramp": (id, pos) => comp(id, "env-ramp", "Ramp", pos, {}, { angle: 30 }, { isStatic: true, category: "environment" }),
  "env-obstacle": (id, pos) => comp(id, "env-obstacle", "Obstacle", pos, {}, {}, { isStatic: true, category: "environment", scale: [0.5, 0.5, 0.5] }),
  "env-line-track": (id, pos) => comp(id, "env-line-track", "Line Track", pos, {}, { size: 8 }, { isStatic: true, category: "environment", scale: [4, 1, 4] }),
  "env-table": (id, pos) => comp(id, "env-table", "Work Table", pos, {}, { width: 2, depth: 1, height: 0.8 }, { isStatic: true, category: "environment" }),
  "env-conveyor": (id, pos) => comp(id, "env-conveyor", "Conveyor Belt", pos, {}, { length: 3, speed: 0 }, { isStatic: true, category: "environment" }),
};

const WIRE_COLORS = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff", "#ffffff", "#ff8800"];

const defaultCodeArtifacts: Record<string, CodeWorkspaceFile[]> = {
  "arduino-runtime": [
    {
      name: "main.ino",
      language: "cpp",
      content: `void setup() {\n  pinMode(13, OUTPUT);\n  Serial.begin(115200);\n  Serial.println("SimForge controller online");\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(250);\n  digitalWrite(13, LOW);\n  delay(250);\n}\n`,
    },
  ],
  "ros2-control": [
    {
      name: "controller.cpp",
      language: "cpp",
      content: `#include <rclcpp/rclcpp.hpp>\n\nint main(int argc, char** argv) {\n  rclcpp::init(argc, argv);\n  auto node = rclcpp::Node::make_shared("simforge_controller");\n  RCLCPP_INFO(node->get_logger(), "Deterministic replay enabled");\n  rclcpp::spin(node);\n  rclcpp::shutdown();\n  return 0;\n}\n`,
    },
  ],
  "mqtt-flow": [
    {
      name: "telemetry.ts",
      language: "ts",
      content: `type Reading = { moisture: number; waterLevel: number };\n\nexport function publish(reading: Reading) {\n  console.log("mqtt.publish", {\n    topic: "simforge/telemetry",\n    payload: reading,\n  });\n}\n`,
    },
  ],
  "esp32-runtime": [
    {
      name: "app_main.cpp",
      language: "cpp",
      content: `#include <Arduino.h>\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(2, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(2, !digitalRead(2));\n  delay(500);\n}\n`,
    },
  ],
  "linux-edge": [
    {
      name: "main.py",
      language: "python",
      content: `import time\n\nprint("SimForge edge runtime online")\nwhile True:\n    print("streaming telemetry")\n    time.sleep(1)\n`,
    },
  ],
};

const defaultFirmware = defaultCodeArtifacts["arduino-runtime"][0].content;

function cloneFiles(files: CodeWorkspaceFile[]) {
  return files.map((file) => ({ ...file }));
}

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  const centiseconds = Math.floor((value % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function buildEnvironment(preset: EnvironmentPreset): SimComponent[] {
  switch (preset) {
    case "empty":
      return [];
    case "line-follow-track":
      return [
        componentCreators["env-line-track"]("track-main", [0, 0.01, 0]),
        componentCreators["env-wall"]("track-wall-n", [0, 1, -6]),
        componentCreators["env-wall"]("track-wall-s", [0, 1, 6]),
        componentCreators["env-obstacle"]("track-obstacle-1", [2.8, 0.25, 2.5]),
      ];
    case "obstacle-course":
      return [
        componentCreators["env-wall"]("course-wall-n", [0, 1, -6]),
        componentCreators["env-wall"]("course-wall-s", [0, 1, 6]),
        componentCreators["env-wall"]("course-wall-e", [6, 1, 0]),
        componentCreators["env-wall"]("course-wall-w", [-6, 1, 0]),
        componentCreators["env-obstacle"]("course-obstacle-1", [1.5, 0.25, 1.2]),
        componentCreators["env-obstacle"]("course-obstacle-2", [-2, 0.25, -0.5]),
        componentCreators["env-obstacle"]("course-obstacle-3", [0.5, 0.25, -3.1]),
        componentCreators["env-ramp"]("course-ramp", [3.7, 0, 2.1]),
      ];
    case "warehouse":
      return [
        componentCreators["env-wall"]("warehouse-wall-n", [0, 1, -8]),
        componentCreators["env-wall"]("warehouse-wall-s", [0, 1, 8]),
        componentCreators["env-wall"]("warehouse-wall-e", [8, 1, 0]),
        componentCreators["env-wall"]("warehouse-wall-w", [-8, 1, 0]),
        componentCreators["env-table"]("warehouse-bench-a", [-3, 0, -2.5]),
        componentCreators["env-table"]("warehouse-bench-b", [3, 0, -2.5]),
        componentCreators["env-conveyor"]("warehouse-conveyor", [0, 0, 1.5]),
      ];
    case "robotics-lab":
    default:
      return [
        componentCreators["env-table"]("table-1", [0, 0, 0]),
        componentCreators["env-wall"]("wall-1", [0, 1, -5]),
        componentCreators["env-wall"]("wall-2", [5, 1, 0]),
        componentCreators["env-wall"]("wall-3", [-5, 1, 0]),
        componentCreators["env-ramp"]("ramp-1", [4, 0, 3]),
        componentCreators["env-obstacle"]("obstacle-1", [2.2, 0.25, 2.6]),
      ];
  }
}

function isControllerType(type: string) {
  return type.startsWith("arduino") || type.startsWith("esp32") || type.startsWith("stm32") || type.includes("raspberry-pi");
}

function isPowerSourceType(type: string) {
  return type === "lipo-battery" || type === "solar-panel" || type === "buck-converter" || type === "lm7805";
}

function isMotorType(type: string) {
  return type === "dc-motor" || type === "dc-motor-encoder";
}

const initialEnvironment = buildEnvironment("robotics-lab");
const initialComponents: SimComponent[] = [
  ...initialEnvironment,
  componentCreators["arduino-uno"]("arduino-1", [0, 0.85, 0]),
  componentCreators["breadboard"]("breadboard-main", [-1.8, 0.85, 0.1]),
  componentCreators["led"]("status-led", [-1.45, 0.95, 0.12]),
  componentCreators["resistor"]("status-resistor", [-1.7, 0.95, 0.1]),
  componentCreators["wifi-module"]("wifi-bridge", [1.6, 0.95, -0.1]),
  componentCreators["robot-2wd-car"]("robot-1", [0, 0.22, 4.5]),
  componentCreators["soil-moisture"]("soil-1", [2.1, 0.85, 0.3]),
];

const initialCodeArtifacts = {
  "arduino-runtime": cloneFiles(defaultCodeArtifacts["arduino-runtime"]),
  "ros2-control": cloneFiles(defaultCodeArtifacts["ros2-control"]),
  "mqtt-flow": cloneFiles(defaultCodeArtifacts["mqtt-flow"]),
};

let compCounter = 100;

interface SimulationStore {
  projectId: string;
  projectName: string;
  projectDescription: string;
  activeDomains: DomainId[];
  selectedCodeTarget: string;
  codeArtifactsByTarget: Record<string, CodeWorkspaceFile[]>;
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
  activateCodeTarget: (target: string, files?: CodeWorkspaceFile[]) => void;
  setSimState: (state: SimulationState) => void;
  addComponent: (type: string) => void;
  addCatalogComponent: (sku: string) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  updateComponentPosition: (id: string, pos: [number, number, number]) => void;
  updateComponentProperty: (id: string, key: string, value: string | number | boolean) => void;
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
  projectDescription: "Coupled robotics, embedded, and IoT simulation workspace with reusable runtime targets and exportable project graphs.",
  activeDomains: ["robotics", "embedded", "iot"],
  selectedCodeTarget: "arduino-runtime",
  codeArtifactsByTarget: initialCodeArtifacts,
  simState: "idle",
  components: initialComponents,
  wires: [
    { id: "wire-1", from: { componentId: "arduino-1", pinId: "D13" }, to: { componentId: "status-led", pinId: "ANODE" }, color: WIRE_COLORS[0] },
    { id: "wire-2", from: { componentId: "status-led", pinId: "CATHODE" }, to: { componentId: "arduino-1", pinId: "GND" }, color: WIRE_COLORS[1] },
  ],
  selectedComponent: null,
  wiringMode: { active: false, from: null },
  consoleMessages: [
    { type: "info", time: "00:00.00", msg: "SimForge v0.4 — Multi-domain orchestration core online" },
    { type: "info", time: "00:00.00", msg: "Graph runtime prepared for robotics, firmware, and telemetry flows" },
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
  setActiveDomains: (activeDomains) => set({ activeDomains: activeDomains.length > 0 ? activeDomains : ["embedded"] }),
  setSelectedCodeTarget: (selectedCodeTarget) => {
    const targetFiles = get().codeArtifactsByTarget[selectedCodeTarget] ?? cloneFiles(defaultCodeArtifacts[selectedCodeTarget] ?? defaultCodeArtifacts["arduino-runtime"]);
    set((state) => ({
      selectedCodeTarget,
      firmwareCode: targetFiles[0]?.content ?? state.firmwareCode,
      codeArtifactsByTarget: state.codeArtifactsByTarget[selectedCodeTarget]
        ? state.codeArtifactsByTarget
        : { ...state.codeArtifactsByTarget, [selectedCodeTarget]: targetFiles },
    }));
  },
  activateCodeTarget: (selectedCodeTarget, files) => {
    const nextFiles = cloneFiles(files && files.length > 0 ? files : defaultCodeArtifacts[selectedCodeTarget] ?? defaultCodeArtifacts["arduino-runtime"]);
    set((state) => {
      const targetFiles = state.codeArtifactsByTarget[selectedCodeTarget] ?? nextFiles;
      return {
        selectedCodeTarget,
        firmwareCode: targetFiles[0]?.content ?? state.firmwareCode,
        codeArtifactsByTarget: {
          ...state.codeArtifactsByTarget,
          [selectedCodeTarget]: targetFiles,
        },
      };
    });
    get().log("info", `Activated runtime workspace: ${selectedCodeTarget}`);
  },
  setSimState: (state) => {
    set({ simState: state });
    if (state === "running") get().log("success", "Simulation started — firmware executing");
    if (state === "paused") get().log("warning", "Simulation paused");
    if (state === "idle") get().log("info", "Simulation stopped");
  },
  addComponent: (type) => {
    const creator = componentCreators[type];
    if (!creator) {
      get().log("error", `Unknown component: ${type}`);
      return;
    }
    const id = `${type}-${++compCounter}`;
    const pos: [number, number, number] = [Math.random() * 6 - 3, 1.2, Math.random() * 6 - 3];
    const component = creator(id, pos);
    set((state) => ({ components: [...state.components, component], selectedComponent: component.id }));
    get().log("success", `Added ${component.name} to scene`);
  },
  addCatalogComponent: (sku) => {
    const catalogComponent = getCatalogComponentBySku(sku);
    if (!catalogComponent) {
      get().log("error", `Unknown catalog SKU: ${sku}`);
      return;
    }

    const id = `${catalogComponent.componentType}-${++compCounter}`;
    const pos: [number, number, number] = [Math.random() * 6 - 3, 1.4, Math.random() * 6 - 3];
    const creator = componentCreators[catalogComponent.componentType];
    const component = creator ? creator(id, pos) : buildCatalogTwin(id, sku, pos);

    if (!component) {
      get().log("error", `No simulator twin is available for ${catalogComponent.name}`);
      return;
    }

    set((state) => ({
      components: [
        ...state.components,
        {
          ...component,
          sourceSku: catalogComponent.sku,
          vendor: catalogComponent.vendor,
          domain: catalogComponent.domain,
          simulationLevel: catalogComponent.simulationLevel,
          properties: {
            ...component.properties,
            marketSku: catalogComponent.sku,
            vendor: catalogComponent.vendor,
            simulationLevel: catalogComponent.simulationLevel,
          },
        },
      ],
      selectedComponent: component.id,
    }));
    get().log("success", `Imported ${catalogComponent.name} from the market catalog`);
  },
  removeComponent: (id) => set((state) => ({
    components: state.components.filter((component) => component.id !== id),
    wires: state.wires.filter((wire) => wire.from.componentId !== id && wire.to.componentId !== id),
    selectedComponent: state.selectedComponent === id ? null : state.selectedComponent,
  })),
  selectComponent: (selectedComponent) => set({ selectedComponent }),
  updateComponentPosition: (id, pos) => set((state) => ({
    components: state.components.map((component) => (component.id === id ? { ...component, position: pos } : component)),
  })),
  updateComponentProperty: (id, key, value) => set((state) => ({
    components: state.components.map((component) =>
      component.id === id ? { ...component, properties: { ...component.properties, [key]: value } } : component,
    ),
  })),
  updatePinValue: (componentId, pinId, value) => set((state) => ({
    components: state.components.map((component) =>
      component.id === componentId && component.pins[pinId]
        ? { ...component, pins: { ...component.pins, [pinId]: { ...component.pins[pinId], value } } }
        : component,
    ),
  })),
  updatePinMode: (componentId, pinId, mode) => set((state) => ({
    components: state.components.map((component) =>
      component.id === componentId && component.pins[pinId]
        ? { ...component, pins: { ...component.pins, [pinId]: { ...component.pins[pinId], mode } } }
        : component,
    ),
  })),
  addWire: (from, to) => {
    const id = `wire-${Date.now()}`;
    const color = WIRE_COLORS[get().wires.length % WIRE_COLORS.length];
    set((state) => ({ wires: [...state.wires, { id, from, to, color }] }));
    get().log("success", `Wire: ${from.componentId}.${from.pinId} → ${to.componentId}.${to.pinId}`);
    get().propagateSignals();
    for (const component of get().components) {
      if (component.properties.fault) {
        get().log("error", `${component.name}: ${String(component.properties.faultReason)}`);
      }
    }
  },
  removeWire: (id) => set((state) => ({ wires: state.wires.filter((wire) => wire.id !== id) })),
  setWiringMode: (wiringMode) => set({ wiringMode }),
  log: (type, msg) => {
    const time = formatTime(get().simTime);
    set((state) => ({ consoleMessages: [...state.consoleMessages.slice(-220), { type, time, msg }] }));
  },
  clearConsole: () => set({ consoleMessages: [] }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setFirmwareCode: (firmwareCode) =>
    set((state) => {
      const selectedTarget = state.selectedCodeTarget;
      const currentFiles = state.codeArtifactsByTarget[selectedTarget] ?? cloneFiles(defaultCodeArtifacts[selectedTarget] ?? defaultCodeArtifacts["arduino-runtime"]);
      const [primaryFile, ...rest] = currentFiles;
      const nextPrimary = primaryFile ? { ...primaryFile, content: firmwareCode } : { name: "main.ino", language: "cpp", content: firmwareCode };
      return {
        firmwareCode,
        codeArtifactsByTarget: {
          ...state.codeArtifactsByTarget,
          [selectedTarget]: [nextPrimary, ...rest],
        },
      };
    }),
  setShowCodeEditor: (showCodeEditor) => set({ showCodeEditor }),
  setPhysicsEnabled: (physicsEnabled) => set({ physicsEnabled }),
  setGravity: (gravity) => set({ gravity }),
  incrementSimTime: (dt) => set((state) => ({ simTime: state.simTime + dt })),
  resetSimulation: () => {
    set({ simState: "idle", simTime: 0 });
    set((state) => ({
      components: state.components.map((component) => ({
        ...component,
        pins: Object.fromEntries(
          Object.entries(component.pins).map(([pinId, pin]) => [
            pinId,
            { ...pin, value: pinId === "5V" || pinId === "3V3" || pinId === "VCC" ? 1 : pinId === "WIPER" ? 512 : 0 },
          ]),
        ),
        properties:
          component.type === "led"
            ? { ...component.properties, brightness: 0 }
            : component.type.startsWith("servo")
              ? { ...component.properties, angle: 90 }
              : component.type === "robot-2wd-car" || component.type === "robot-sumo"
                ? { ...component.properties, linear_vel: 0, angular_vel: 0 }
                : component.properties,
      })),
    }));
    get().log("info", "Simulation reset");
  },
  propagateSignals: () => {
    const state = get();
    const componentMap = new Map(
      state.components.map((component) => [
        component.id,
        {
          ...component,
          pins: Object.fromEntries(Object.entries(component.pins).map(([pinId, pin]) => [pinId, { ...pin }])),
          properties: {
            ...component.properties,
            fault: false,
            faultReason: "",
            wiringStatus: "ok",
          },
        },
      ]),
    );

    const connections = new Map<string, Array<{ componentId: string; pinId: string }>>();
    const pushConnection = (componentId: string, pinId: string, peer: { componentId: string; pinId: string }) => {
      const key = `${componentId}:${pinId}`;
      const next = connections.get(key) ?? [];
      next.push(peer);
      connections.set(key, next);
    };

    for (const wire of state.wires) {
      pushConnection(wire.from.componentId, wire.from.pinId, { componentId: wire.to.componentId, pinId: wire.to.pinId });
      pushConnection(wire.to.componentId, wire.to.pinId, { componentId: wire.from.componentId, pinId: wire.from.pinId });
    }

    const peersFor = (componentId: string, pinId: string) =>
      (connections.get(`${componentId}:${pinId}`) ?? [])
        .map((peer) => {
          const component = componentMap.get(peer.componentId);
          return component ? { component, pinId: peer.pinId } : null;
        })
        .filter((entry): entry is { component: SimComponent; pinId: string } => Boolean(entry));

    const setFault = (componentId: string, reason: string) => {
      const component = componentMap.get(componentId);
      if (!component) return;
      component.properties.fault = true;
      component.properties.faultReason = reason;
      component.properties.wiringStatus = "fault";
    };

    for (const wire of state.wires) {
      const fromComp = componentMap.get(wire.from.componentId);
      const toComp = componentMap.get(wire.to.componentId);
      if (!fromComp || !toComp) continue;
      const fromPin = fromComp.pins[wire.from.pinId];
      const toPin = toComp.pins[wire.to.pinId];
      if (!fromPin || !toPin) continue;

      if ((fromPin.mode === "OUTPUT" || fromPin.mode === "PWM") && (toPin.mode === "OUTPUT" || toPin.mode === "PWM")) {
        setFault(fromComp.id, `Conflicting driven outputs on ${wire.from.pinId}`);
        setFault(toComp.id, `Conflicting driven outputs on ${wire.to.pinId}`);
        continue;
      }

      if (fromPin.mode === "OUTPUT" || fromPin.mode === "PWM") {
        toComp.pins[wire.to.pinId] = { ...toPin, value: fromPin.value };
      } else if (toPin.mode === "OUTPUT" || toPin.mode === "PWM") {
        fromComp.pins[wire.from.pinId] = { ...fromPin, value: toPin.value };
      }
    }

    for (const component of componentMap.values()) {
      if (component.type === "led") {
        component.properties.brightness = component.pins.ANODE?.value ?? 0;
      }

      if (component.type === "led-rgb") {
        component.properties.red = component.pins.R?.value ?? 0;
        component.properties.green = component.pins.G?.value ?? 0;
        component.properties.blue = component.pins.B?.value ?? 0;
      }

      if (component.type.startsWith("servo")) {
        const signal = component.pins.SIGNAL;
        const powerConnected = peersFor(component.id, "5V").some(({ component: peer }) => isPowerSourceType(peer.type) || peer.type === "l298n-driver" || isControllerType(peer.type));
        const groundConnected = peersFor(component.id, "GND").length > 0;
        if (signal) component.properties.angle = (signal.value / 255) * 180;
        if (!powerConnected || !groundConnected) {
          setFault(component.id, "Servo requires both 5V and GND connections.");
        }
      }

      if (component.type === "buzzer") {
        const signal = component.pins.SIGNAL;
        component.properties.active = !!signal && signal.value > 0;
      }

      if (component.type === "soil-moisture") {
        const moisture = component.pins.AO?.value ?? component.properties.moisture;
        component.properties.moisture = typeof moisture === "number" ? moisture : 0;
      }

      if (component.type === "l298n-driver") {
        const hasMotorSupply = peersFor(component.id, "12V").some(({ component: peer, pinId }) => isPowerSourceType(peer.type) && (pinId === "POS" || pinId === "VOUT+" || pinId === "VOUT"));
        const hasGround = peersFor(component.id, "GND").length > 0;
        const ena = component.pins.ENA?.value ?? 0;
        const in1 = component.pins.IN1?.value ?? 0;
        const in2 = component.pins.IN2?.value ?? 0;
        const enabled = hasMotorSupply && hasGround && ena > 0;
        component.properties.enabled = enabled;

        if ((in1 > 0 || in2 > 0 || ena > 0) && !hasMotorSupply) {
          setFault(component.id, "Motor driver is being commanded without motor supply on 12V.");
        }

        component.pins.OUT1.value = enabled && in1 > in2 ? ena : 0;
        component.pins.OUT2.value = enabled && in2 > in1 ? ena : 0;
      }

      if (isMotorType(component.type)) {
        const positivePeers = peersFor(component.id, "POS");
        const negativePeers = peersFor(component.id, "NEG");
        let rpm = 0;
        let direction = 0;

        const directControllerConnection = [...positivePeers, ...negativePeers].find(({ component: peer }) => isControllerType(peer.type));
        if (directControllerConnection) {
          setFault(component.id, "DC motor cannot be driven directly from a microcontroller pin. Use a motor driver and external supply.");
          setFault(directControllerConnection.component.id, "Unsafe actuator load detected on logic-level controller pin.");
        } else {
          const driverPositive = positivePeers.find(({ component: peer, pinId }) => peer.type === "l298n-driver" && pinId === "OUT1");
          const driverNegative = negativePeers.find(({ component: peer, pinId }) => peer.type === "l298n-driver" && pinId === "OUT2");
          const batteryPositive = positivePeers.find(({ component: peer, pinId }) => isPowerSourceType(peer.type) && pinId === "POS");
          const batteryNegative = negativePeers.find(({ component: peer, pinId }) => peer.type === "lipo-battery" && pinId === "NEG");

          if (driverPositive && driverNegative) {
            const driver = driverPositive.component;
            const out1 = driver.pins.OUT1?.value ?? 0;
            const out2 = driver.pins.OUT2?.value ?? 0;
            if ((driver.properties.fault as boolean) === true) {
              setFault(component.id, String(driver.properties.faultReason || "Motor driver fault"));
            } else if (out1 > 0 || out2 > 0) {
              direction = out1 > out2 ? 1 : -1;
              rpm = Math.round(((Math.max(out1, out2) / 255) * 3200) * direction);
            }
          } else if (batteryPositive && batteryNegative) {
            rpm = 2400;
            direction = 1;
            component.properties.wiringStatus = "uncontrolled";
          } else if (positivePeers.length > 0 || negativePeers.length > 0) {
            setFault(component.id, "Motor circuit is incomplete. Connect both motor terminals to a valid driver or supply.");
          }
        }

        component.properties.rpm = rpm;
        if (component.type === "dc-motor-encoder") {
          component.properties.ticks = Math.round(Math.abs(rpm) * 0.5);
        }
      }

      if (isControllerType(component.type)) {
        for (const [pinId] of Object.entries(component.pins)) {
          const actuatorPeer = peersFor(component.id, pinId).find(({ component: peer, pinId: peerPin }) =>
            (isMotorType(peer.type) && (peerPin === "POS" || peerPin === "NEG")) || (peer.type === "lipo-battery" && pinId.startsWith("D")),
          );
          if (actuatorPeer) {
            setFault(component.id, "Unsafe high-current or battery connection detected on a controller logic pin.");
          }
        }
      }
    }

    set({ components: Array.from(componentMap.values()) });
  },
  loadEnvironment: (environmentPreset) => {
    const envComps = buildEnvironment(environmentPreset);
    set((state) => ({
      environmentPreset,
      components: [...state.components.filter((component) => component.category !== "environment"), ...envComps],
    }));
    get().log("success", `Environment loaded: ${environmentPreset}`);
  },
  exportProjectDocument: () =>
    buildProjectDocument({
      projectId: get().projectId,
      name: get().projectName,
      description: get().projectDescription,
      environment: get().environmentPreset,
      components: get().components,
      wires: get().wires,
      firmwareFiles: Object.entries(get().codeArtifactsByTarget).map(([target, files]) => ({
        target,
        language: files[0]?.language ?? "txt",
        entryFile: files[0]?.name ?? "main.txt",
        files: cloneFiles(files),
      })),
      activeDomains: get().activeDomains,
    }),
}));
