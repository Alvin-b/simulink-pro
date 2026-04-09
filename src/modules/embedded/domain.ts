import { DomainModuleDefinition } from "../types";

export const embeddedDomain: DomainModuleDefinition = {
  id: "embedded",
  label: "Embedded",
  summary: "MCUs, microcomputers, firmware, sensors, and board-level simulation.",
  defaultEnvironment: "robotics-lab",
  environments: ["robotics-lab", "smart-home", "industrial"],
  engines: ["firmware-runtime", "circuit-signal"],
  librarySections: [
    {
      name: "MCUs & SBCs",
      icon: "cpu",
      items: [
        { name: "Arduino Uno R3", description: "ATmega328P development board", type: "arduino-uno", domain: "embedded", appearance: "board" },
        { name: "Arduino Mega 2560", description: "Large I/O automation board", type: "arduino-mega", domain: "embedded", appearance: "board" },
        { name: "ESP32-WROOM", description: "Wi-Fi and Bluetooth MCU", type: "esp32-wroom", domain: "embedded", appearance: "board" },
        { name: "Raspberry Pi 4B", description: "Linux microcomputer for edge AI", type: "raspberry-pi-4b", domain: "embedded", appearance: "board" },
        { name: "STM32F103", description: "ARM Cortex-M3 control board", type: "stm32f103", domain: "embedded", appearance: "board" },
      ],
    },
    {
      name: "Sensors & Drives",
      icon: "activity",
      items: [
        { name: "HC-SR04 Ultrasonic", description: "Distance measurement sensor", type: "hc-sr04", domain: "embedded", appearance: "board" },
        { name: "DHT22 Sensor", description: "Digital temperature and humidity", type: "dht22", domain: "embedded", appearance: "board" },
        { name: "MPU-6050 IMU", description: "6-axis motion sensing", type: "mpu6050", domain: "embedded", appearance: "board" },
        { name: "Servo SG90", description: "Compact hobby servo", type: "servo-sg90", domain: "embedded", appearance: "3d" },
        { name: "L298N Driver", description: "Dual H-bridge motor driver", type: "l298n-driver", domain: "embedded", appearance: "board" },
      ],
    },
    {
      name: "Student Electronics",
      icon: "activity",
      items: [
        { name: "Breadboard", description: "Starter prototyping board", type: "breadboard", domain: "embedded", appearance: "board" },
        { name: "LED", description: "Basic visual output component", type: "led", domain: "embedded", appearance: "board" },
        { name: "Resistor", description: "Current limiting passive element", type: "resistor", domain: "embedded", appearance: "board" },
        { name: "Capacitor", description: "Energy storage and filtering element", type: "capacitor", domain: "embedded", appearance: "board" },
        { name: "Push Button", description: "Interactive digital input", type: "button", domain: "embedded", appearance: "board" },
        { name: "Potentiometer", description: "Variable analog input", type: "potentiometer", domain: "embedded", appearance: "board" },
        { name: "Buzzer", description: "Basic audio output device", type: "buzzer", domain: "embedded", appearance: "board" },
        { name: "LiPo Battery", description: "Portable DC supply source", type: "lipo-battery", domain: "embedded", appearance: "board" },
      ],
    },
  ],
  codeTargets: [
    {
      id: "arduino-runtime",
      label: "Arduino Firmware",
      runtime: "SimForge AVR Runtime",
      language: "C++",
      chipFamily: "ATmega / AVR",
      componentTypes: ["arduino-uno", "arduino-mega", "arduino-nano"],
      features: ["GPIO and PWM simulation", "Serial console", "Sketch templates", "Pin-level tracing"],
      files: [
        {
          name: "main.ino",
          language: "cpp",
          content: `void setup() {\n  pinMode(13, OUTPUT);\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(250);\n  digitalWrite(13, LOW);\n  delay(250);\n}\n`,
        },
      ],
    },
    {
      id: "esp32-runtime",
      label: "ESP32 Edge App",
      runtime: "SimForge Xtensa Runtime",
      language: "C++",
      chipFamily: "ESP32",
      componentTypes: ["esp32-wroom", "esp8266-nodemcu"],
      features: ["Wi-Fi simulation", "MQTT client hooks", "FreeRTOS task view", "OTA lifecycle checks"],
      files: [
        {
          name: "app_main.cpp",
          language: "cpp",
          content: `#include <Arduino.h>\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(2, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(2, !digitalRead(2));\n  delay(500);\n}\n`,
        },
      ],
    },
    {
      id: "linux-edge",
      label: "Microcomputer Service",
      runtime: "Linux Edge Runtime",
      language: "Python",
      chipFamily: "ARM64 / x86",
      componentTypes: ["raspberry-pi-4b", "raspberry-pi-zero", "jetson-nano"],
      features: ["Multi-process services", "AI inference pipeline", "Containerized deployment", "Device bridge adapters"],
      files: [
        {
          name: "main.py",
          language: "python",
          content: `import time\n\nprint("SimForge edge service online")\nwhile True:\n    print("streaming telemetry")\n    time.sleep(1)\n`,
        },
      ],
    },
  ],
};
