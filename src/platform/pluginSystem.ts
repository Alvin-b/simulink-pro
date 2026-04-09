import { DomainId } from "@/modules/types";

export type ProjectPluginManifest = {
  id: string;
  name: string;
  version: string;
  domains: DomainId[];
  provides: string[];
  description: string;
};

export type SimulationEngineAdapter = {
  id: string;
  domain: DomainId;
  displayName: string;
  fidelity: "interactive" | "hybrid" | "high";
  inputs: string[];
  outputs: string[];
  capabilities: string[];
};

export type RuntimeAdapter = {
  id: string;
  target: string;
  languages: string[];
  interfaces: string[];
  boardFamilies?: string[];
  firmwareProfiles?: string[];
};

export const projectPlugins: ProjectPluginManifest[] = [
  {
    id: "plugin.robotics.core",
    name: "Robotics Core",
    version: "0.1.0",
    domains: ["robotics"],
    provides: ["robot assets", "kinematics", "scene authoring", "navigation hooks"],
    description: "Provides mobile robot, manipulator, and drone workflows for the studio.",
  },
  {
    id: "plugin.embedded.runtime",
    name: "Embedded Runtime",
    version: "0.1.0",
    domains: ["embedded"],
    provides: ["firmware execution", "board definitions", "serial tracing", "pin inspector"],
    description: "Provides firmware runtimes and board-aware coding targets for MCUs and microcomputers.",
  },
  {
    id: "plugin.iot.mesh",
    name: "IoT Mesh",
    version: "0.1.0",
    domains: ["iot"],
    provides: ["topic simulation", "edge/cloud sync", "device twins", "telemetry feeds"],
    description: "Provides messaging, digital twin, and fleet connectivity simulation.",
  },
];

export const engineAdapters: SimulationEngineAdapter[] = [
  {
    id: "robotics-dynamics",
    domain: "robotics",
    displayName: "Robotics Dynamics Adapter",
    fidelity: "hybrid",
    inputs: ["rigid bodies", "joint states", "terrain map", "command velocity"],
    outputs: ["odometry", "contact forces", "collision events", "trajectory traces"],
    capabilities: ["Differential drive", "Manipulator playback", "Drone state hooks", "Replay"],
  },
  {
    id: "firmware-runtime",
    domain: "embedded",
    displayName: "Firmware Runtime Adapter",
    fidelity: "interactive",
    inputs: ["sketch source", "pin map", "sensor readings", "serial input"],
    outputs: ["pin state timeline", "serial output", "task schedule", "fault events"],
    capabilities: ["AVR", "ESP32", "Linux SBC profiles", "Debugger-ready traces"],
  },
  {
    id: "iot-messaging",
    domain: "iot",
    displayName: "IoT Messaging Adapter",
    fidelity: "interactive",
    inputs: ["device topics", "rules", "network topology", "cloud policies"],
    outputs: ["telemetry stream", "delivery metrics", "state sync", "alerts"],
    capabilities: ["MQTT", "Zigbee mesh", "CAN bus bridge", "Device twin sync"],
  },
];

export const runtimeAdapters: RuntimeAdapter[] = [
  {
    id: "runtime.arduino",
    target: "Arduino Firmware",
    languages: ["C++"],
    interfaces: ["GPIO", "PWM", "UART"],
    boardFamilies: ["Arduino Uno", "Arduino Mega", "Arduino Nano"],
    firmwareProfiles: ["fw.arduino.avr"],
  },
  {
    id: "runtime.esp32",
    target: "ESP32 Edge App",
    languages: ["C++"],
    interfaces: ["Wi-Fi", "MQTT", "FreeRTOS"],
    boardFamilies: ["ESP32", "ESP8266"],
    firmwareProfiles: ["fw.esp32.freertos"],
  },
  {
    id: "runtime.stm32",
    target: "STM32 Control Firmware",
    languages: ["C++"],
    interfaces: ["GPIO", "PWM", "CAN", "UART", "I2C", "SPI"],
    boardFamilies: ["STM32F103", "STM32 control boards"],
    firmwareProfiles: ["fw.stm32.control"],
  },
  {
    id: "runtime.edge",
    target: "Microcomputer Service",
    languages: ["Python", "Rust", "TypeScript"],
    interfaces: ["Linux IPC", "ROS 2", "REST", "MQTT"],
    boardFamilies: ["Raspberry Pi", "Jetson", "BeagleBone"],
    firmwareProfiles: ["fw.rpi.edge"],
  },
];
