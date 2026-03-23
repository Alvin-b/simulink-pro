import { create } from "zustand";

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
  | "robot-2wd-car" | "robot-4wd-car" | "robot-arm-4dof"
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

function mcuPins(digitalCount: number, analogCount: number): Record<string, PinState> {
  const p: Record<string, PinState> = {};
  for (let i = 0; i < digitalCount; i++) p[`D${i}`] = { mode: "INPUT", value: 0, label: `D${i}` };
  for (let i = 0; i < analogCount; i++) p[`A${i}`] = { mode: "ANALOG", value: 0, label: `A${i}` };
  p["5V"] = { mode: "OUTPUT", value: 1, label: "5V" };
  p["3V3"] = { mode: "OUTPUT", value: 1, label: "3.3V" };
  p["GND"] = { mode: "OUTPUT", value: 0, label: "GND" };
  p["VIN"] = { mode: "INPUT", value: 0, label: "VIN" };
  return p;
}

function comp(
  id: string, type: ComponentType, name: string, pos: [number, number, number],
  pins: Record<string, PinState>, props: Record<string, any>,
  opts: { isStatic?: boolean; mass?: number; category?: string; scale?: [number, number, number] } = {}
): SimComponent {
  return {
    id, type, name, position: pos, rotation: [0, 0, 0],
    scale: opts.scale || [1, 1, 1], pins, properties: props,
    isStatic: opts.isStatic ?? false, mass: opts.mass ?? 10,
    category: opts.category || "component",
  };
}

// ─── Component Creators ────────────────────────────────────

export const componentCreators: Record<string, (id: string, pos: [number, number, number]) => SimComponent> = {
  // --- Microcontrollers ---
  "arduino-uno": (id, pos) => comp(id, "arduino-uno", "Arduino Uno R3", pos, mcuPins(14, 6),
    { clockSpeed: 16e6, voltage: 5, flash: 32768, sram: 2048, chip: "ATmega328P" },
    { isStatic: true, mass: 25, category: "microcontroller" }),

  "arduino-mega": (id, pos) => comp(id, "arduino-mega", "Arduino Mega 2560", pos, mcuPins(54, 16),
    { clockSpeed: 16e6, voltage: 5, flash: 262144, sram: 8192, chip: "ATmega2560" },
    { isStatic: true, mass: 37, category: "microcontroller" }),

  "arduino-nano": (id, pos) => comp(id, "arduino-nano", "Arduino Nano V3", pos, mcuPins(14, 8),
    { clockSpeed: 16e6, voltage: 5, flash: 32768, sram: 2048, chip: "ATmega328P" },
    { isStatic: true, mass: 7, category: "microcontroller" }),

  "esp32-wroom": (id, pos) => comp(id, "esp32-wroom", "ESP32-WROOM-32", pos, mcuPins(34, 18),
    { clockSpeed: 240e6, voltage: 3.3, flash: 4194304, sram: 520000, chip: "ESP32", wifi: true, bluetooth: true, cores: 2 },
    { isStatic: true, mass: 10, category: "microcontroller" }),

  "esp8266-nodemcu": (id, pos) => comp(id, "esp8266-nodemcu", "NodeMCU ESP8266", pos, mcuPins(11, 1),
    { clockSpeed: 80e6, voltage: 3.3, flash: 4194304, chip: "ESP8266", wifi: true },
    { isStatic: true, mass: 8, category: "microcontroller" }),

  "stm32f103": (id, pos) => comp(id, "stm32f103", "STM32F103C8T6 Blue Pill", pos, mcuPins(37, 10),
    { clockSpeed: 72e6, voltage: 3.3, flash: 65536, sram: 20480, chip: "ARM Cortex-M3" },
    { isStatic: true, mass: 8, category: "microcontroller" }),

  "attiny85": (id, pos) => comp(id, "attiny85", "ATtiny85 DIP-8", pos, mcuPins(6, 4),
    { clockSpeed: 8e6, voltage: 5, flash: 8192, sram: 512, chip: "ATtiny85" },
    { isStatic: true, mass: 1, category: "microcontroller" }),

  // --- Microcomputers ---
  "raspberry-pi-4b": (id, pos) => comp(id, "raspberry-pi-4b", "Raspberry Pi 4 Model B", pos,
    (() => { const p = mcuPins(28, 0); p["USB1"] = { mode: "INPUT", value: 0, label: "USB 3.0 #1" }; p["USB2"] = { mode: "INPUT", value: 0, label: "USB 3.0 #2" }; p["HDMI1"] = { mode: "OUTPUT", value: 0, label: "Micro HDMI #1" }; p["ETH"] = { mode: "INPUT", value: 0, label: "Ethernet" }; return p; })(),
    { cpu: "BCM2711", cores: 4, clockSpeed: 1.5e9, ram: 4096, wifi: true, bluetooth: true, ethernet: true, usb3: 2, hdmi: 2, gpio: 40, os: "Raspberry Pi OS" },
    { isStatic: true, mass: 46, category: "microcomputer" }),

  "raspberry-pi-pico": (id, pos) => comp(id, "raspberry-pi-pico", "Raspberry Pi Pico", pos, mcuPins(26, 3),
    { chip: "RP2040", cores: 2, clockSpeed: 133e6, flash: 2097152, sram: 264000 },
    { isStatic: true, mass: 3, category: "microcontroller" }),

  "raspberry-pi-zero": (id, pos) => comp(id, "raspberry-pi-zero", "Raspberry Pi Zero 2 W", pos, mcuPins(28, 0),
    { cpu: "BCM2710A1", cores: 4, clockSpeed: 1e9, ram: 512, wifi: true, bluetooth: true, gpio: 40 },
    { isStatic: true, mass: 10, category: "microcomputer" }),

  "jetson-nano": (id, pos) => comp(id, "jetson-nano", "NVIDIA Jetson Nano", pos, mcuPins(40, 0),
    { cpu: "ARM Cortex-A57", cores: 4, gpu: "128-core Maxwell", ram: 4096, cuda: 128 },
    { isStatic: true, mass: 140, category: "microcomputer" }),

  "beaglebone-black": (id, pos) => comp(id, "beaglebone-black", "BeagleBone Black", pos, mcuPins(46, 7),
    { cpu: "AM3358", clockSpeed: 1e9, ram: 512, flash: 4096, ethernet: true },
    { isStatic: true, mass: 40, category: "microcomputer" }),

  // --- Sensors ---
  "hc-sr04": (id, pos) => comp(id, "hc-sr04", "HC-SR04 Ultrasonic", pos,
    makePins([["VCC", "INPUT", "VCC"], ["TRIG", "INPUT", "Trigger"], ["ECHO", "OUTPUT", "Echo"], ["GND", "INPUT", "GND"]]),
    { distance: 150, minRange: 2, maxRange: 400, unit: "cm" },
    { mass: 8, category: "sensor" }),

  "dht22": (id, pos) => comp(id, "dht22", "DHT22 Temp/Humidity", pos,
    makePins([["VCC", "INPUT", "VCC"], ["DATA", "OUTPUT", "Data"], ["GND", "INPUT", "GND"]]),
    { temperature: 25, humidity: 60, accuracy: 0.5 },
    { mass: 4, category: "sensor" }),

  "dht11": (id, pos) => comp(id, "dht11", "DHT11 Temp/Humidity", pos,
    makePins([["VCC", "INPUT", "VCC"], ["DATA", "OUTPUT", "Data"], ["GND", "INPUT", "GND"]]),
    { temperature: 25, humidity: 55, accuracy: 2 },
    { mass: 3, category: "sensor" }),

  "bmp280": (id, pos) => comp(id, "bmp280", "BMP280 Barometric", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["SCL", "INPUT", "SCL"], ["SDA", "INPUT", "SDA"]]),
    { pressure: 1013.25, temperature: 25, altitude: 0 },
    { mass: 2, category: "sensor" }),

  "mpu6050": (id, pos) => comp(id, "mpu6050", "MPU-6050 6-Axis IMU", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["SCL", "INPUT", "SCL"], ["SDA", "INPUT", "SDA"], ["INT", "OUTPUT", "INT"]]),
    { accelX: 0, accelY: 0, accelZ: 9.81, gyroX: 0, gyroY: 0, gyroZ: 0 },
    { mass: 2, category: "sensor" }),

  "ir-sensor": (id, pos) => comp(id, "ir-sensor", "IR Proximity TCRT5000", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["OUT", "OUTPUT", "Digital Out"], ["AO", "ANALOG", "Analog Out"]]),
    { detected: false, distance: 10 },
    { mass: 3, category: "sensor" }),

  "pir-sensor": (id, pos) => comp(id, "pir-sensor", "HC-SR501 PIR Motion", pos,
    makePins([["VCC", "INPUT", "VCC"], ["OUT", "OUTPUT", "Signal"], ["GND", "INPUT", "GND"]]),
    { motion: false, sensitivity: 7, delayTime: 5 },
    { mass: 8, category: "sensor" }),

  "ldr-module": (id, pos) => comp(id, "ldr-module", "LDR Light Sensor", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["DO", "OUTPUT", "Digital"], ["AO", "ANALOG", "Analog"]]),
    { lightLevel: 512 },
    { mass: 3, category: "sensor" }),

  "gps-neo6m": (id, pos) => comp(id, "gps-neo6m", "NEO-6M GPS Module", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"]]),
    { latitude: 0, longitude: 0, satellites: 0, fix: false },
    { mass: 18, category: "sensor" }),

  "line-follower-ir": (id, pos) => comp(id, "line-follower-ir", "5-Channel Line Follower", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["S1", "OUTPUT", "Sensor 1"], ["S2", "OUTPUT", "Sensor 2"], ["S3", "OUTPUT", "Sensor 3"], ["S4", "OUTPUT", "Sensor 4"], ["S5", "OUTPUT", "Sensor 5"]]),
    { s1: false, s2: false, s3: true, s4: false, s5: false },
    { mass: 5, category: "sensor" }),

  "lidar-lite": (id, pos) => comp(id, "lidar-lite", "LIDAR-Lite v3", pos,
    makePins([["VCC", "INPUT", "VCC(5V)"], ["GND", "INPUT", "GND"], ["SDA", "INPUT", "SDA"], ["SCL", "INPUT", "SCL"]]),
    { distance: 500, maxRange: 4000, accuracy: 2.5 },
    { mass: 22, category: "sensor" }),

  "soil-moisture": (id, pos) => comp(id, "soil-moisture", "Soil Moisture Sensor", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["AO", "ANALOG", "Analog"]]),
    { moisture: 450 },
    { mass: 5, category: "sensor" }),

  "mq2-gas": (id, pos) => comp(id, "mq2-gas", "MQ-2 Gas Sensor", pos,
    makePins([["VCC", "INPUT", "VCC(5V)"], ["GND", "INPUT", "GND"], ["DO", "OUTPUT", "Digital"], ["AO", "ANALOG", "Analog"]]),
    { gasLevel: 100, heaterOn: true },
    { mass: 12, category: "sensor" }),

  "water-level": (id, pos) => comp(id, "water-level", "Water Level Sensor", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["SIG", "ANALOG", "Signal"]]),
    { level: 0 },
    { mass: 4, category: "sensor" }),

  "color-sensor-tcs3200": (id, pos) => comp(id, "color-sensor-tcs3200", "TCS3200 Color Sensor", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["OUT", "OUTPUT", "Frequency Out"], ["S0", "INPUT", "S0"], ["S1", "INPUT", "S1"], ["S2", "INPUT", "S2"], ["S3", "INPUT", "S3"]]),
    { red: 128, green: 128, blue: 128 },
    { mass: 4, category: "sensor" }),

  "hx711": (id, pos) => comp(id, "hx711", "HX711 Load Cell Amp", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["DT", "OUTPUT", "Data"], ["SCK", "INPUT", "Clock"]]),
    { weight: 0, maxWeight: 5000, unit: "g" },
    { mass: 3, category: "sensor" }),

  // --- Actuators ---
  "servo-sg90": (id, pos) => comp(id, "servo-sg90", "SG90 Micro Servo", pos,
    makePins([["SIGNAL", "INPUT", "Signal (PWM)"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"]]),
    { angle: 90, minAngle: 0, maxAngle: 180, torque: 1.8, speed: 0.12 },
    { mass: 9, category: "actuator" }),

  "servo-mg996r": (id, pos) => comp(id, "servo-mg996r", "MG996R High-Torque Servo", pos,
    makePins([["SIGNAL", "INPUT", "Signal (PWM)"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"]]),
    { angle: 90, minAngle: 0, maxAngle: 180, torque: 11, speed: 0.17 },
    { mass: 55, category: "actuator" }),

  "nema17-stepper": (id, pos) => comp(id, "nema17-stepper", "NEMA 17 Stepper Motor", pos,
    makePins([["A1", "INPUT", "Coil A+"], ["A2", "INPUT", "Coil A-"], ["B1", "INPUT", "Coil B+"], ["B2", "INPUT", "Coil B-"]]),
    { steps: 200, stepAngle: 1.8, holdingTorque: 40, currentPerPhase: 1.7 },
    { mass: 280, category: "actuator" }),

  "dc-motor": (id, pos) => comp(id, "dc-motor", "DC Motor 6V TT Gear", pos,
    makePins([["M1", "INPUT", "Motor +"], ["M2", "INPUT", "Motor -"]]),
    { rpm: 0, maxRpm: 200, voltage: 6, stall: false },
    { mass: 30, category: "actuator" }),

  "dc-motor-encoder": (id, pos) => comp(id, "dc-motor-encoder", "DC Motor w/ Encoder", pos,
    makePins([["M1", "INPUT", "Motor +"], ["M2", "INPUT", "Motor -"], ["VCC", "INPUT", "Encoder VCC"], ["GND", "INPUT", "Encoder GND"], ["ENC_A", "OUTPUT", "Encoder A"], ["ENC_B", "OUTPUT", "Encoder B"]]),
    { rpm: 0, maxRpm: 300, ppr: 11, voltage: 12, encoderCount: 0 },
    { mass: 85, category: "actuator" }),

  "l298n-driver": (id, pos) => comp(id, "l298n-driver", "L298N Dual H-Bridge", pos,
    makePins([["IN1", "INPUT", "Input 1"], ["IN2", "INPUT", "Input 2"], ["IN3", "INPUT", "Input 3"], ["IN4", "INPUT", "Input 4"], ["ENA", "INPUT", "Enable A (PWM)"], ["ENB", "INPUT", "Enable B (PWM)"], ["12V", "INPUT", "12V Input"], ["GND", "INPUT", "GND"], ["5V", "OUTPUT", "5V Regulated"], ["OUT1", "OUTPUT", "Motor A+"], ["OUT2", "OUTPUT", "Motor A-"], ["OUT3", "OUTPUT", "Motor B+"], ["OUT4", "OUTPUT", "Motor B-"]]),
    { motorA_speed: 0, motorB_speed: 0, maxCurrent: 2 },
    { isStatic: true, mass: 30, category: "actuator" }),

  "a4988-driver": (id, pos) => comp(id, "a4988-driver", "A4988 Stepper Driver", pos,
    makePins([["STEP", "INPUT", "Step"], ["DIR", "INPUT", "Direction"], ["EN", "INPUT", "Enable"], ["MS1", "INPUT", "MS1"], ["MS2", "INPUT", "MS2"], ["MS3", "INPUT", "MS3"], ["VDD", "INPUT", "Logic VDD"], ["GND", "INPUT", "GND"], ["VMOT", "INPUT", "Motor V"], ["1A", "OUTPUT", "Coil 1A"], ["1B", "OUTPUT", "Coil 1B"], ["2A", "OUTPUT", "Coil 2A"], ["2B", "OUTPUT", "Coil 2B"]]),
    { microstepping: 16, currentLimit: 1 },
    { mass: 5, category: "actuator" }),

  "solenoid-valve": (id, pos) => comp(id, "solenoid-valve", "12V Solenoid Valve", pos,
    makePins([["VCC", "INPUT", "12V"], ["GND", "INPUT", "GND"]]),
    { open: false },
    { mass: 60, category: "actuator" }),

  "linear-actuator": (id, pos) => comp(id, "linear-actuator", "Linear Actuator 100mm", pos,
    makePins([["M1", "INPUT", "Motor +"], ["M2", "INPUT", "Motor -"]]),
    { position: 0, maxStroke: 100, speed: 10, force: 150 },
    { mass: 200, category: "actuator" }),

  // --- Passive & Output ---
  "led": (id, pos) => comp(id, "led", "LED 5mm", pos,
    makePins([["ANODE", "INPUT", "Anode (+)"], ["CATHODE", "INPUT", "Cathode (-)"]]),
    { color: "red", brightness: 0, forwardVoltage: 2.0, maxCurrent: 20 },
    { mass: 1, category: "passive" }),

  "led-rgb": (id, pos) => comp(id, "led-rgb", "RGB LED Common Cathode", pos,
    makePins([["RED", "INPUT", "Red"], ["GREEN", "INPUT", "Green"], ["BLUE", "INPUT", "Blue"], ["CATHODE", "INPUT", "Cathode"]]),
    { red: 0, green: 0, blue: 0 },
    { mass: 1, category: "passive" }),

  "resistor": (id, pos) => comp(id, "resistor", "Resistor 220Ω", pos,
    makePins([["PIN1", "INPUT", "Pin 1"], ["PIN2", "OUTPUT", "Pin 2"]]),
    { resistance: 220, power: 0.25, tolerance: 5 },
    { mass: 1, category: "passive" }),

  "capacitor": (id, pos) => comp(id, "capacitor", "Capacitor 100µF", pos,
    makePins([["POS", "INPUT", "Positive"], ["NEG", "INPUT", "Negative"]]),
    { capacitance: 100, voltage: 16, type: "electrolytic" },
    { mass: 2, category: "passive" }),

  "buzzer": (id, pos) => comp(id, "buzzer", "Piezo Buzzer", pos,
    makePins([["SIGNAL", "INPUT", "Signal"], ["GND", "INPUT", "GND"]]),
    { frequency: 0, active: false },
    { mass: 3, category: "output" }),

  "relay-module": (id, pos) => comp(id, "relay-module", "5V Relay Module", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["IN", "INPUT", "Signal"], ["COM", "OUTPUT", "Common"], ["NO", "OUTPUT", "Normally Open"], ["NC", "OUTPUT", "Normally Closed"]]),
    { engaged: false, maxLoad: 10, loadVoltage: 250 },
    { mass: 20, category: "output" }),

  // --- Input ---
  "button": (id, pos) => comp(id, "button", "Tactile Push Button", pos,
    makePins([["PIN1", "OUTPUT", "Pin 1"], ["PIN2", "OUTPUT", "Pin 2"]]),
    { pressed: false },
    { mass: 2, category: "input" }),

  "potentiometer": (id, pos) => comp(id, "potentiometer", "Potentiometer 10kΩ", pos,
    makePins([["VCC", "INPUT", "VCC"], ["WIPER", "OUTPUT", "Wiper"], ["GND", "INPUT", "GND"]]),
    { value: 0.5, maxResistance: 10000 },
    { mass: 5, category: "input" }),

  "rotary-encoder": (id, pos) => comp(id, "rotary-encoder", "KY-040 Rotary Encoder", pos,
    makePins([["CLK", "OUTPUT", "Clock"], ["DT", "OUTPUT", "Data"], ["SW", "OUTPUT", "Switch"], ["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"]]),
    { position: 0, pressed: false },
    { mass: 5, category: "input" }),

  "joystick": (id, pos) => comp(id, "joystick", "Analog Joystick Module", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["VRx", "ANALOG", "X Axis"], ["VRy", "ANALOG", "Y Axis"], ["SW", "OUTPUT", "Button"]]),
    { x: 512, y: 512, pressed: false },
    { mass: 10, category: "input" }),

  "keypad-4x4": (id, pos) => comp(id, "keypad-4x4", "4x4 Matrix Keypad", pos,
    makePins([["R1", "INPUT", "Row 1"], ["R2", "INPUT", "Row 2"], ["R3", "INPUT", "Row 3"], ["R4", "INPUT", "Row 4"], ["C1", "OUTPUT", "Col 1"], ["C2", "OUTPUT", "Col 2"], ["C3", "OUTPUT", "Col 3"], ["C4", "OUTPUT", "Col 4"]]),
    { lastKey: "" },
    { mass: 8, category: "input" }),

  // --- Display ---
  "oled-ssd1306": (id, pos) => comp(id, "oled-ssd1306", "OLED 0.96\" SSD1306", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["SCL", "INPUT", "SCL"], ["SDA", "INPUT", "SDA"]]),
    { width: 128, height: 64, interface: "I2C", displayText: "" },
    { mass: 4, category: "display" }),

  "lcd-16x2": (id, pos) => comp(id, "lcd-16x2", "LCD 16x2 I2C", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["SDA", "INPUT", "SDA"], ["SCL", "INPUT", "SCL"]]),
    { cols: 16, rows: 2, text: "", backlight: true },
    { mass: 18, category: "display" }),

  "tft-ili9341": (id, pos) => comp(id, "tft-ili9341", "2.8\" TFT ILI9341", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["CS", "INPUT", "CS"], ["RESET", "INPUT", "Reset"], ["DC", "INPUT", "DC"], ["MOSI", "INPUT", "MOSI"], ["SCK", "INPUT", "SCK"], ["LED", "INPUT", "Backlight"], ["MISO", "OUTPUT", "MISO"]]),
    { width: 320, height: 240, interface: "SPI" },
    { mass: 25, category: "display" }),

  "seven-segment": (id, pos) => comp(id, "seven-segment", "7-Segment Display", pos,
    makePins([["A", "INPUT", "A"], ["B", "INPUT", "B"], ["C", "INPUT", "C"], ["D", "INPUT", "D"], ["E", "INPUT", "E"], ["F", "INPUT", "F"], ["G", "INPUT", "G"], ["DP", "INPUT", "DP"], ["COM", "INPUT", "Common"]]),
    { digit: 0, type: "common-cathode" },
    { mass: 3, category: "display" }),

  // --- IoT / Communication ---
  "nrf24l01": (id, pos) => comp(id, "nrf24l01", "nRF24L01+ 2.4GHz", pos,
    makePins([["VCC", "INPUT", "3.3V"], ["GND", "INPUT", "GND"], ["CE", "INPUT", "CE"], ["CSN", "INPUT", "CSN"], ["SCK", "INPUT", "SCK"], ["MOSI", "INPUT", "MOSI"], ["MISO", "OUTPUT", "MISO"], ["IRQ", "OUTPUT", "IRQ"]]),
    { channel: 76, dataRate: "2Mbps", power: "-12dBm", range: 100 },
    { mass: 4, category: "communication" }),

  "hc05-bluetooth": (id, pos) => comp(id, "hc05-bluetooth", "HC-05 Bluetooth", pos,
    makePins([["VCC", "INPUT", "VCC"], ["GND", "INPUT", "GND"], ["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["EN", "INPUT", "Enable"]]),
    { paired: false, baudRate: 9600, name: "HC-05" },
    { mass: 5, category: "communication" }),

  "sim800l-gsm": (id, pos) => comp(id, "sim800l-gsm", "SIM800L GSM/GPRS", pos,
    makePins([["VCC", "INPUT", "3.7-4.2V"], ["GND", "INPUT", "GND"], ["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["RST", "INPUT", "Reset"]]),
    { signal: 0, registered: false, operator: "" },
    { mass: 15, category: "communication" }),

  "lora-sx1276": (id, pos) => comp(id, "lora-sx1276", "LoRa SX1276 433MHz", pos,
    makePins([["VCC", "INPUT", "3.3V"], ["GND", "INPUT", "GND"], ["SCK", "INPUT", "SCK"], ["MOSI", "INPUT", "MOSI"], ["MISO", "OUTPUT", "MISO"], ["NSS", "INPUT", "NSS"], ["DIO0", "OUTPUT", "DIO0"]]),
    { frequency: 433, spreadingFactor: 7, bandwidth: 125, range: 5000 },
    { mass: 6, category: "communication" }),

  "rfid-rc522": (id, pos) => comp(id, "rfid-rc522", "RFID-RC522 13.56MHz", pos,
    makePins([["VCC", "INPUT", "3.3V"], ["GND", "INPUT", "GND"], ["SDA", "INPUT", "SDA"], ["SCK", "INPUT", "SCK"], ["MOSI", "INPUT", "MOSI"], ["MISO", "OUTPUT", "MISO"], ["RST", "INPUT", "RST"]]),
    { cardPresent: false, cardUID: "" },
    { mass: 8, category: "communication" }),

  "wifi-module": (id, pos) => comp(id, "wifi-module", "ESP-01 WiFi Module", pos,
    makePins([["VCC", "INPUT", "3.3V"], ["GND", "INPUT", "GND"], ["TX", "OUTPUT", "TX"], ["RX", "INPUT", "RX"], ["CH_PD", "INPUT", "Chip Enable"]]),
    { ssid: "", connected: false, ip: "" },
    { mass: 3, category: "communication" }),

  // --- Power ---
  "lm7805": (id, pos) => comp(id, "lm7805", "LM7805 5V Regulator", pos,
    makePins([["VIN", "INPUT", "Input (7-35V)"], ["GND", "INPUT", "GND"], ["VOUT", "OUTPUT", "Output (5V)"]]),
    { inputVoltage: 12, outputVoltage: 5, maxCurrent: 1.5 },
    { mass: 3, category: "power" }),

  "lipo-battery": (id, pos) => comp(id, "lipo-battery", "LiPo 3.7V 2200mAh", pos,
    makePins([["POS", "OUTPUT", "Positive (+)"], ["NEG", "OUTPUT", "Negative (-)"]]),
    { voltage: 3.7, capacity: 2200, charge: 100, dischargeRate: 25 },
    { mass: 45, category: "power" }),

  "buck-converter": (id, pos) => comp(id, "buck-converter", "LM2596 Buck Converter", pos,
    makePins([["VIN_P", "INPUT", "Input +"], ["VIN_N", "INPUT", "Input -"], ["VOUT_P", "OUTPUT", "Output +"], ["VOUT_N", "OUTPUT", "Output -"]]),
    { inputVoltage: 12, outputVoltage: 5, efficiency: 92 },
    { mass: 8, category: "power" }),

  "solar-panel": (id, pos) => comp(id, "solar-panel", "Solar Panel 6V 1W", pos,
    makePins([["POS", "OUTPUT", "Positive"], ["NEG", "OUTPUT", "Negative"]]),
    { voltage: 6, wattage: 1, irradiance: 1000 },
    { mass: 50, category: "power", scale: [1, 1, 1] }),

  // --- Breadboard ---
  "breadboard": (id, pos) => comp(id, "breadboard", "830-Point Breadboard", pos,
    {}, { points: 830, powerRails: 4 },
    { isStatic: true, mass: 35, category: "passive" }),

  "breadboard-mini": (id, pos) => comp(id, "breadboard-mini", "170-Point Mini Breadboard", pos,
    {}, { points: 170 },
    { isStatic: true, mass: 12, category: "passive" }),

  // ─── ROBOTS ──────────────────────────────────────────────

  "robot-2wd-car": (id, pos) => comp(id, "robot-2wd-car", "2WD Smart Robot Car", pos,
    (() => {
      const p = mcuPins(14, 6);
      p["MOTOR_L1"] = { mode: "OUTPUT", value: 0, label: "Left Motor +" };
      p["MOTOR_L2"] = { mode: "OUTPUT", value: 0, label: "Left Motor -" };
      p["MOTOR_R1"] = { mode: "OUTPUT", value: 0, label: "Right Motor +" };
      p["MOTOR_R2"] = { mode: "OUTPUT", value: 0, label: "Right Motor -" };
      p["ENA"] = { mode: "PWM", value: 0, label: "Left Speed (PWM)" };
      p["ENB"] = { mode: "PWM", value: 0, label: "Right Speed (PWM)" };
      p["TRIG"] = { mode: "OUTPUT", value: 0, label: "Ultrasonic Trig" };
      p["ECHO"] = { mode: "INPUT", value: 0, label: "Ultrasonic Echo" };
      p["IR_L"] = { mode: "INPUT", value: 0, label: "IR Left" };
      p["IR_R"] = { mode: "INPUT", value: 0, label: "IR Right" };
      return p;
    })(),
    { speed: 0, direction: 0, leftMotor: 0, rightMotor: 0, batteryLevel: 100, chassisType: "2WD Acrylic", wheelDiameter: 65, wheelBase: 150, hasUltrasonic: true, hasLineFollower: true, hasBluetoothControl: true },
    { mass: 320, category: "robot", scale: [1, 1, 1] }),

  "robot-4wd-car": (id, pos) => comp(id, "robot-4wd-car", "4WD Mecanum Robot", pos,
    (() => {
      const p = mcuPins(14, 6);
      p["FL_1"] = { mode: "OUTPUT", value: 0, label: "Front-Left +" };
      p["FL_2"] = { mode: "OUTPUT", value: 0, label: "Front-Left -" };
      p["FR_1"] = { mode: "OUTPUT", value: 0, label: "Front-Right +" };
      p["FR_2"] = { mode: "OUTPUT", value: 0, label: "Front-Right -" };
      p["BL_1"] = { mode: "OUTPUT", value: 0, label: "Back-Left +" };
      p["BL_2"] = { mode: "OUTPUT", value: 0, label: "Back-Left -" };
      p["BR_1"] = { mode: "OUTPUT", value: 0, label: "Back-Right +" };
      p["BR_2"] = { mode: "OUTPUT", value: 0, label: "Back-Right -" };
      return p;
    })(),
    { speed: 0, direction: 0, strafing: false, batteryLevel: 100, chassisType: "4WD Mecanum Aluminum", wheelType: "mecanum" },
    { mass: 850, category: "robot", scale: [1.2, 1, 1.2] }),

  "robot-arm-4dof": (id, pos) => comp(id, "robot-arm-4dof", "4-DOF Robotic Arm", pos,
    makePins([["BASE", "INPUT", "Base Servo"], ["SHOULDER", "INPUT", "Shoulder Servo"], ["ELBOW", "INPUT", "Elbow Servo"], ["GRIPPER", "INPUT", "Gripper Servo"], ["VCC", "INPUT", "VCC (6V)"], ["GND", "INPUT", "GND"]]),
    { baseAngle: 90, shoulderAngle: 90, elbowAngle: 90, gripperAngle: 90, gripForce: 0, payload: 0, maxPayload: 200 },
    { isStatic: true, mass: 350, category: "robot" }),

  "robot-arm-6dof": (id, pos) => comp(id, "robot-arm-6dof", "6-DOF Robotic Arm", pos,
    makePins([["J1", "INPUT", "Joint 1 Base"], ["J2", "INPUT", "Joint 2 Shoulder"], ["J3", "INPUT", "Joint 3 Elbow"], ["J4", "INPUT", "Joint 4 Wrist Pitch"], ["J5", "INPUT", "Joint 5 Wrist Roll"], ["J6", "INPUT", "Joint 6 Gripper"], ["VCC", "INPUT", "VCC (7.4V)"], ["GND", "INPUT", "GND"]]),
    { j1: 90, j2: 90, j3: 90, j4: 90, j5: 90, j6: 90, maxPayload: 500, reach: 380 },
    { isStatic: true, mass: 600, category: "robot" }),

  "robot-hexapod": (id, pos) => comp(id, "robot-hexapod", "6-Legged Hexapod Robot", pos,
    (() => {
      const p: Record<string, PinState> = {};
      for (let leg = 1; leg <= 6; leg++) {
        p[`L${leg}_COXA`] = { mode: "INPUT", value: 0, label: `Leg ${leg} Coxa` };
        p[`L${leg}_FEMUR`] = { mode: "INPUT", value: 0, label: `Leg ${leg} Femur` };
        p[`L${leg}_TIBIA`] = { mode: "INPUT", value: 0, label: `Leg ${leg} Tibia` };
      }
      p["VCC"] = { mode: "INPUT", value: 0, label: "VCC (7.4V)" };
      p["GND"] = { mode: "INPUT", value: 0, label: "GND" };
      return p;
    })(),
    { gait: "tripod", speed: 0, height: 80, direction: 0, stable: true },
    { mass: 1200, category: "robot" }),

  "robot-quadcopter": (id, pos) => comp(id, "robot-quadcopter", "Quadcopter Drone F450", pos,
    makePins([["M1", "PWM", "Motor 1 (FR)"], ["M2", "PWM", "Motor 2 (BL)"], ["M3", "PWM", "Motor 3 (FL)"], ["M4", "PWM", "Motor 4 (BR)"], ["VCC", "INPUT", "Battery (11.1V)"], ["GND", "INPUT", "GND"]]),
    { altitude: 0, roll: 0, pitch: 0, yaw: 0, throttle: 0, armed: false, batteryLevel: 100, frameSize: 450 },
    { mass: 800, category: "robot" }),

  "robot-tank-tracks": (id, pos) => comp(id, "robot-tank-tracks", "Tracked Tank Robot", pos,
    (() => {
      const p = mcuPins(14, 6);
      p["TRACK_L1"] = { mode: "OUTPUT", value: 0, label: "Left Track +" };
      p["TRACK_L2"] = { mode: "OUTPUT", value: 0, label: "Left Track -" };
      p["TRACK_R1"] = { mode: "OUTPUT", value: 0, label: "Right Track +" };
      p["TRACK_R2"] = { mode: "OUTPUT", value: 0, label: "Right Track -" };
      return p;
    })(),
    { speed: 0, direction: 0, leftTrack: 0, rightTrack: 0, batteryLevel: 100, climbAngle: 30, chassisType: "Metal Track" },
    { mass: 1500, category: "robot", scale: [1.3, 1, 1.5] }),

  "robot-humanoid": (id, pos) => comp(id, "robot-humanoid", "Humanoid Robot 17-DOF", pos,
    (() => {
      const p: Record<string, PinState> = {};
      const joints = ["head_pan", "head_tilt", "l_shoulder", "l_elbow", "l_wrist", "r_shoulder", "r_elbow", "r_wrist", "l_hip_yaw", "l_hip_pitch", "l_knee", "l_ankle", "r_hip_yaw", "r_hip_pitch", "r_knee", "r_ankle", "waist"];
      joints.forEach((j) => { p[j.toUpperCase()] = { mode: "INPUT", value: 0, label: j.replace(/_/g, " ") }; });
      p["VCC"] = { mode: "INPUT", value: 0, label: "VCC (7.4V)" };
      p["GND"] = { mode: "INPUT", value: 0, label: "GND" };
      return p;
    })(),
    { stance: "standing", walking: false, speed: 0, balance: 100, height: 380 },
    { isStatic: true, mass: 1800, category: "robot" }),

  // ─── Environment ───────────────────────────────────────────

  "env-wall": (id, pos) => comp(id, "env-wall", "Wall Segment", pos, {},
    { width: 3, height: 1.5, depth: 0.15, color: "#666" },
    { isStatic: true, mass: 0, category: "environment", scale: [3, 1.5, 0.15] }),

  "env-ramp": (id, pos) => comp(id, "env-ramp", "Ramp 30°", pos, {},
    { angle: 30, length: 3, width: 1.5 },
    { isStatic: true, mass: 0, category: "environment" }),

  "env-obstacle": (id, pos) => comp(id, "env-obstacle", "Obstacle Block", pos, {},
    { width: 0.5, height: 0.5, depth: 0.5, color: "#885533" },
    { isStatic: true, mass: 0, category: "environment", scale: [0.5, 0.5, 0.5] }),

  "env-line-track": (id, pos) => comp(id, "env-line-track", "Line-Follow Track", pos, {},
    { trackWidth: 0.02, shape: "oval", size: 8 },
    { isStatic: true, mass: 0, category: "environment" }),

  "env-table": (id, pos) => comp(id, "env-table", "Work Table", pos, {},
    { width: 2, depth: 1, height: 0.8 },
    { isStatic: true, mass: 0, category: "environment" }),

  "env-conveyor": (id, pos) => comp(id, "env-conveyor", "Conveyor Belt", pos, {},
    { length: 3, speed: 0, running: false },
    { isStatic: true, mass: 0, category: "environment" }),
};

// ─── Store ──────────────────────────────────────────────────

interface SimulationStore {
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
  loadEnvironment: (preset: EnvironmentPreset) => void;
}

let compCounter = 100;

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

function buildEnvironment(preset: EnvironmentPreset): SimComponent[] {
  const c = componentCreators;
  switch (preset) {
    case "robotics-lab":
      return [
        c["env-table"]("env-table-1", [0, 0, 0]),
        c["env-wall"]("env-wall-1", [0, 0.75, -5]),
        c["env-wall"]("env-wall-2", [5, 0.75, 0]),
        c["env-wall"]("env-wall-3", [-5, 0.75, 0]),
        c["env-obstacle"]("env-obs-1", [2, 0.25, 3]),
        c["env-obstacle"]("env-obs-2", [-2, 0.25, 4]),
        c["env-ramp"]("env-ramp-1", [4, 0, 3]),
      ];
    case "line-follow-track":
      return [
        c["env-line-track"]("line-track-1", [0, 0.01, 0]),
        c["env-obstacle"]("env-obs-1", [4, 0.25, 4]),
        c["env-obstacle"]("env-obs-2", [-4, 0.25, -4]),
      ];
    case "obstacle-course":
      return [
        c["env-wall"]("env-wall-1", [0, 0.75, -6]),
        c["env-wall"]("env-wall-2", [0, 0.75, 6]),
        c["env-wall"]("env-wall-3", [6, 0.75, 0]),
        c["env-wall"]("env-wall-4", [-6, 0.75, 0]),
        c["env-obstacle"]("obs-1", [1, 0.25, 1]),
        c["env-obstacle"]("obs-2", [-1, 0.25, 2]),
        c["env-obstacle"]("obs-3", [2, 0.25, -1]),
        c["env-obstacle"]("obs-4", [-2, 0.25, -2]),
        c["env-obstacle"]("obs-5", [0, 0.25, -3]),
        c["env-obstacle"]("obs-6", [3, 0.25, 3]),
        c["env-ramp"]("ramp-1", [4, 0, 0]),
        c["env-ramp"]("ramp-2", [-4, 0, 0]),
      ];
    case "warehouse":
      return [
        c["env-wall"]("w1", [0, 0.75, -8]),
        c["env-wall"]("w2", [0, 0.75, 8]),
        c["env-wall"]("w3", [8, 0.75, 0]),
        c["env-wall"]("w4", [-8, 0.75, 0]),
        c["env-table"]("shelf-1", [-3, 0, -3]),
        c["env-table"]("shelf-2", [3, 0, -3]),
        c["env-table"]("shelf-3", [-3, 0, 3]),
        c["env-table"]("shelf-4", [3, 0, 3]),
        c["env-conveyor"]("conv-1", [0, 0, 0]),
      ];
    default:
      return [];
  }
}

// Initial scene
const initialComponents: SimComponent[] = [
  componentCreators["arduino-uno"]("arduino-1", [0, 0.85, 0]),
  componentCreators["led"]("led-1", [2.5, 0.85, -0.5]),
  componentCreators["resistor"]("res-1", [1.8, 0.85, -0.5]),
  componentCreators["servo-sg90"]("servo-1", [-2, 0.85, -1.5]),
  componentCreators["hc-sr04"]("ultra-1", [-2, 0.85, 1.5]),
  componentCreators["robot-2wd-car"]("robot-1", [0, 0.2, 5]),
  componentCreators["robot-arm-4dof"]("arm-1", [-5, 0.85, 0]),
  // Environment - robotics lab
  componentCreators["env-table"]("table-1", [0, 0, 0]),
  componentCreators["env-wall"]("wall-back", [0, 0.75, -6]),
  componentCreators["env-obstacle"]("obs-1", [3, 0.25, 4]),
  componentCreators["env-obstacle"]("obs-2", [-3, 0.25, 5]),
  componentCreators["env-ramp"]("ramp-1", [5, 0, 4]),
  componentCreators["env-line-track"]("track-1", [0, 0.01, 5]),
];

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simState: "idle",
  components: initialComponents,
  wires: [
    { id: "wire-1", from: { componentId: "arduino-1", pinId: "D13" }, to: { componentId: "res-1", pinId: "PIN1" }, color: WIRE_COLORS[0] },
    { id: "wire-2", from: { componentId: "res-1", pinId: "PIN2" }, to: { componentId: "led-1", pinId: "ANODE" }, color: WIRE_COLORS[0] },
    { id: "wire-3", from: { componentId: "led-1", pinId: "CATHODE" }, to: { componentId: "arduino-1", pinId: "GND" }, color: WIRE_COLORS[1] },
    { id: "wire-4", from: { componentId: "arduino-1", pinId: "D9" }, to: { componentId: "servo-1", pinId: "SIGNAL" }, color: WIRE_COLORS[2] },
  ],
  selectedComponent: null,
  wiringMode: { active: false, from: null },
  consoleMessages: [
    { type: "info", time: "00:00.00", msg: "SimForge v0.3 — Full Physics & Robotics Engine" },
    { type: "info", time: "00:00.00", msg: "Rapier physics — gravity: 9.81 m/s²" },
    { type: "success", time: "00:00.01", msg: "Robotics Lab environment loaded" },
    { type: "success", time: "00:00.01", msg: "2WD Smart Car + 4-DOF Arm ready" },
    { type: "info", time: "00:00.02", msg: "Click components in library to add • Press ▶ to simulate" },
  ],
  activeTool: "select",
  firmwareCode: defaultFirmware,
  showCodeEditor: false,
  simTime: 0,
  physicsEnabled: true,
  gravity: 9.81,
  environmentPreset: "robotics-lab",

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
          : c.type === "robot-2wd-car" ? { ...c.properties, speed: 0, leftMotor: 0, rightMotor: 0 }
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
}));
