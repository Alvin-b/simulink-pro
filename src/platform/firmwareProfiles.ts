export type FirmwareProfile = {
  id: string;
  board: string;
  componentTypes: string[];
  language: "cpp" | "python" | "rust" | "ts";
  runtime: string;
  toolchain: string;
  debugger: string;
  interfaces: string[];
  engineeringUseCases: string[];
  sampleFiles: Array<{ name: string; content: string }>;
};

const arduinoUnoTemplate = `#include <Arduino.h>

namespace {
constexpr uint8_t kStatusLedPin = 13;
constexpr uint8_t kHeartbeatIntervalMs = 250;
constexpr uint8_t kAnalogInputs[] = {A0, A1, A2};
constexpr uint8_t kDigitalInputs[] = {2, 3, 4};
constexpr uint8_t kPwmOutputs[] = {5, 6, 9, 10};

struct PlantState {
  float analogVoltage[3];
  bool digitalState[3];
  uint32_t loopCount;
  uint32_t lastHeartbeatMs;
} g_state {};

float readAnalogVoltage(uint8_t pin) {
  const int raw = analogRead(pin);
  return (static_cast<float>(raw) / 1023.0f) * 5.0f;
}

void sampleInputs() {
  for (size_t index = 0; index < 3; ++index) {
    g_state.analogVoltage[index] = readAnalogVoltage(kAnalogInputs[index]);
  }
  for (size_t index = 0; index < 3; ++index) {
    g_state.digitalState[index] = digitalRead(kDigitalInputs[index]) == HIGH;
  }
}

void driveOutputs() {
  const int pwm0 = static_cast<int>(g_state.analogVoltage[0] / 5.0f * 255.0f);
  const int pwm1 = static_cast<int>(g_state.analogVoltage[1] / 5.0f * 255.0f);
  const int pwm2 = static_cast<int>(g_state.analogVoltage[2] / 5.0f * 255.0f);
  analogWrite(kPwmOutputs[0], constrain(pwm0, 0, 255));
  analogWrite(kPwmOutputs[1], constrain(pwm1, 0, 255));
  analogWrite(kPwmOutputs[2], constrain(pwm2, 0, 255));
  analogWrite(kPwmOutputs[3], (g_state.digitalState[0] || g_state.digitalState[1]) ? 255 : 32);
}

void emitTrace() {
  Serial.print("loop=");
  Serial.print(g_state.loopCount);
  Serial.print(",analog=");
  for (size_t index = 0; index < 3; ++index) {
    Serial.print(g_state.analogVoltage[index], 3);
    if (index < 2) Serial.print("|");
  }
  Serial.print(",digital=");
  for (size_t index = 0; index < 3; ++index) {
    Serial.print(g_state.digitalState[index] ? 1 : 0);
    if (index < 2) Serial.print("|");
  }
  Serial.println();
}
}

void setup() {
  Serial.begin(115200);
  pinMode(kStatusLedPin, OUTPUT);
  for (uint8_t pin : kDigitalInputs) pinMode(pin, INPUT_PULLUP);
  for (uint8_t pin : kPwmOutputs) pinMode(pin, OUTPUT);
  Serial.println("simforge:avr:uno:boot");
}

void loop() {
  const uint32_t now = millis();
  sampleInputs();
  driveOutputs();
  if (now - g_state.lastHeartbeatMs >= kHeartbeatIntervalMs) {
    g_state.lastHeartbeatMs = now;
    digitalWrite(kStatusLedPin, !digitalRead(kStatusLedPin));
    emitTrace();
  }
  ++g_state.loopCount;
  delay(10);
}
`;

const arduinoMegaTemplate = `#include <Arduino.h>

struct Axis {
  uint8_t enablePin;
  uint8_t directionPin;
  uint8_t pwmPin;
  uint8_t feedbackPin;
  int16_t command;
  int16_t feedback;
};

Axis axes[] = {
  {22, 23, 5, A0, 0, 0},
  {24, 25, 6, A1, 0, 0},
  {26, 27, 7, A2, 0, 0},
  {28, 29, 8, A3, 0, 0},
};

void configureAxis(Axis& axis) {
  pinMode(axis.enablePin, OUTPUT);
  pinMode(axis.directionPin, OUTPUT);
  pinMode(axis.pwmPin, OUTPUT);
  digitalWrite(axis.enablePin, HIGH);
}

void readAxisFeedback(Axis& axis) {
  axis.feedback = analogRead(axis.feedbackPin);
}

void applyAxisCommand(Axis& axis) {
  const bool reverse = axis.command < 0;
  digitalWrite(axis.directionPin, reverse ? LOW : HIGH);
  analogWrite(axis.pwmPin, constrain(abs(axis.command), 0, 255));
}

void emitAxisState(const Axis& axis, size_t index) {
  Serial.print("axis=");
  Serial.print(index);
  Serial.print(",cmd=");
  Serial.print(axis.command);
  Serial.print(",feedback=");
  Serial.println(axis.feedback);
}

void setup() {
  Serial.begin(115200);
  for (Axis& axis : axes) configureAxis(axis);
  Serial.println("simforge:avr:mega:automation-boot");
}

void loop() {
  for (size_t index = 0; index < (sizeof(axes) / sizeof(axes[0])); ++index) {
    Axis& axis = axes[index];
    axis.command = map(analogRead(axis.feedbackPin), 0, 1023, -255, 255);
    readAxisFeedback(axis);
    applyAxisCommand(axis);
    emitAxisState(axis, index);
  }
  delay(20);
}
`;

const arduinoNanoTemplate = `#include <Arduino.h>

constexpr uint8_t kLedPin = 13;
constexpr uint8_t kSensorPin = A0;
constexpr uint8_t kControlPin = 3;

float lowPassFilter(float previous, float current) {
  return (previous * 0.85f) + (current * 0.15f);
}

void setup() {
  Serial.begin(115200);
  pinMode(kLedPin, OUTPUT);
  pinMode(kControlPin, OUTPUT);
}

void loop() {
  static float filtered = 0.0f;
  const float volts = analogRead(kSensorPin) * (5.0f / 1023.0f);
  filtered = lowPassFilter(filtered, volts);
  const int output = static_cast<int>((filtered / 5.0f) * 255.0f);
  analogWrite(kControlPin, constrain(output, 0, 255));
  digitalWrite(kLedPin, output > 128 ? HIGH : LOW);
  Serial.print("nano,filtered=");
  Serial.print(filtered, 3);
  Serial.print(",output=");
  Serial.println(output);
  delay(15);
}
`;

const esp32Template = `#include <Arduino.h>
#include <WiFi.h>

namespace {
constexpr char kSsid[] = "simforge-lab";
constexpr char kPassword[] = "simforge-edge";
constexpr uint8_t kLedPin = 2;
constexpr uint8_t kSensorPins[] = {34, 35, 32, 33};

struct TelemetryFrame {
  float sensors[4];
  uint32_t sequence;
  uint32_t uptimeMs;
} g_frame {};

void sampleSensors() {
  for (size_t index = 0; index < 4; ++index) {
    g_frame.sensors[index] = static_cast<float>(analogRead(kSensorPins[index])) / 4095.0f;
  }
}

void emitJson() {
  Serial.print("{\\"target\\":\\"esp32\\",\\"seq\\":");
  Serial.print(g_frame.sequence);
  Serial.print(",\\"uptimeMs\\":");
  Serial.print(g_frame.uptimeMs);
  Serial.print(",\\"wifi\\":");
  Serial.print(WiFi.status() == WL_CONNECTED ? 1 : 0);
  Serial.print(",\\"sensors\\":[");
  for (size_t index = 0; index < 4; ++index) {
    Serial.print(g_frame.sensors[index], 4);
    if (index < 3) Serial.print(",");
  }
  Serial.println("]}");
}

void edgeTask(void* parameter) {
  (void)parameter;
  while (true) {
    sampleSensors();
    g_frame.sequence++;
    g_frame.uptimeMs = millis();
    digitalWrite(kLedPin, !digitalRead(kLedPin));
    emitJson();
    vTaskDelay(pdMS_TO_TICKS(250));
  }
}
}

void setup() {
  Serial.begin(115200);
  pinMode(kLedPin, OUTPUT);
  WiFi.mode(WIFI_STA);
  WiFi.begin(kSsid, kPassword);
  xTaskCreatePinnedToCore(edgeTask, "edgeTask", 4096, nullptr, 1, nullptr, 1);
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(1000));
}
`;

const esp8266Template = `#include <Arduino.h>
#include <ESP8266WiFi.h>

constexpr uint8_t kStatusPin = LED_BUILTIN;
constexpr uint8_t kRelayPin = D1;
constexpr uint8_t kMotionPin = D2;
constexpr uint8_t kAnalogPin = A0;

void setup() {
  Serial.begin(115200);
  pinMode(kStatusPin, OUTPUT);
  pinMode(kRelayPin, OUTPUT);
  pinMode(kMotionPin, INPUT);
  WiFi.mode(WIFI_STA);
  WiFi.begin("simforge-iot", "smartspace");
}

void loop() {
  const bool occupied = digitalRead(kMotionPin) == HIGH;
  const int analogRaw = analogRead(kAnalogPin);
  digitalWrite(kRelayPin, occupied ? HIGH : LOW);
  digitalWrite(kStatusPin, occupied ? LOW : HIGH);
  Serial.print("esp8266,occupied=");
  Serial.print(occupied ? 1 : 0);
  Serial.print(",analog=");
  Serial.print(analogRaw);
  Serial.print(",wifi=");
  Serial.println(WiFi.status() == WL_CONNECTED ? "connected" : "searching");
  delay(100);
}
`;

const stm32Template = `#include <stdint.h>
#include <math.h>

static volatile uint32_t system_ticks = 0;

extern "C" void SysTick_Handler() {
  system_ticks++;
}

struct MotorState {
  float current;
  float velocity;
  float command;
  float integral;
};

static MotorState g_axes[3];

float clampf(float value, float low, float high) {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

float compute_pi(MotorState& axis, float target, float measured, float dt) {
  const float error = target - measured;
  axis.integral += error * dt;
  const float output = (0.6f * error) + (0.08f * axis.integral);
  return clampf(output, -1.0f, 1.0f);
}

void control_tick() {
  const float dt = 0.001f;
  for (int index = 0; index < 3; ++index) {
    MotorState& axis = g_axes[index];
    axis.command = sinf((system_ticks + index * 120) * 0.0025f);
    axis.velocity = axis.velocity * 0.95f + axis.command * 0.05f;
    axis.current = fabsf(axis.command) * 8.0f;
    const float gate = compute_pi(axis, axis.command, axis.velocity, dt);
    (void)gate;
  }
}

int main() {
  while (1) {
    control_tick();
  }
  return 0;
}
`;

const rp2040Template = `#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/pio.h"

static uint kPulsePin = 2;
static uint kSensePin = 26;

float read_voltage() {
  const uint16_t raw = adc_read();
  return (raw * 3.3f) / 4095.0f;
}

int main() {
  stdio_init_all();
  adc_init();
  adc_gpio_init(kSensePin);
  adc_select_input(0);
  gpio_init(kPulsePin);
  gpio_set_dir(kPulsePin, GPIO_OUT);

  while (true) {
    const float voltage = read_voltage();
    gpio_put(kPulsePin, voltage > 1.65f);
    printf("rp2040,voltage=%0.3f\\n", voltage);
    sleep_ms(10);
  }
}
`;

const attinyTemplate = `#include <avr/io.h>
#include <util/delay.h>

int main(void) {
  DDRB |= (1 << PB0);
  while (1) {
    PINB |= (1 << PB0);
    _delay_ms(100);
  }
}
`;

const rpiTemplate = `import asyncio
import json
import random
from dataclasses import dataclass, asdict


@dataclass
class DeviceSnapshot:
    cpu_temp_c: float
    bus_voltage_v: float
    current_a: float
    mqtt_connected: bool
    ros_nodes: int


async def collect_snapshot() -> DeviceSnapshot:
    return DeviceSnapshot(
        cpu_temp_c=52.0 + random.uniform(-1.5, 1.5),
        bus_voltage_v=12.1 + random.uniform(-0.3, 0.3),
        current_a=1.8 + random.uniform(-0.4, 0.4),
        mqtt_connected=True,
        ros_nodes=4,
    )


async def publish_loop() -> None:
    sequence = 0
    while True:
      snapshot = await collect_snapshot()
      payload = {"target": "rpi-gateway", "sequence": sequence, **asdict(snapshot)}
      print(json.dumps(payload))
      sequence += 1
      await asyncio.sleep(0.5)


if __name__ == "__main__":
    asyncio.run(publish_loop())
`;

const jetsonTemplate = `import json
import time
from dataclasses import dataclass, asdict


@dataclass
class PerceptionFrame:
    frame_id: int
    tracked_objects: int
    lane_confidence: float
    nav_score: float


def infer(frame_id: int) -> PerceptionFrame:
    return PerceptionFrame(
        frame_id=frame_id,
        tracked_objects=5 + frame_id % 3,
        lane_confidence=0.92,
        nav_score=0.87,
    )


def main() -> None:
    frame_id = 0
    while True:
        frame = infer(frame_id)
        print(json.dumps(asdict(frame)))
        frame_id += 1
        time.sleep(0.1)


if __name__ == "__main__":
    main()
`;

const beagleboneTemplate = `import time


def pru_exchange(step: int) -> dict[str, int]:
    return {
        "step": step,
        "capture_ns": step * 5000,
        "digital_edges": 12 + (step % 4),
        "motion_ticks": 400 + step,
    }


def main() -> None:
    step = 0
    while True:
        print(pru_exchange(step))
        step += 1
        time.sleep(0.02)


if __name__ == "__main__":
    main()
`;

const droneTemplate = `#include <cmath>
#include <cstdint>

struct Axis {
  float kp;
  float ki;
  float kd;
  float integral;
  float previous_error;
};

struct VehicleState {
  float roll;
  float pitch;
  float yaw_rate;
  float altitude;
};

static Axis roll_pid {4.2f, 0.3f, 0.08f, 0.0f, 0.0f};
static Axis pitch_pid {4.2f, 0.3f, 0.08f, 0.0f, 0.0f};
static Axis yaw_pid {2.2f, 0.1f, 0.02f, 0.0f, 0.0f};
static VehicleState vehicle {};

float step_pid(Axis& axis, float target, float measurement, float dt) {
  const float error = target - measurement;
  axis.integral += error * dt;
  const float derivative = (error - axis.previous_error) / dt;
  axis.previous_error = error;
  return axis.kp * error + axis.ki * axis.integral + axis.kd * derivative;
}

void control_step(float dt) {
  const float roll_cmd = step_pid(roll_pid, 0.0f, vehicle.roll, dt);
  const float pitch_cmd = step_pid(pitch_pid, 0.0f, vehicle.pitch, dt);
  const float yaw_cmd = step_pid(yaw_pid, 0.0f, vehicle.yaw_rate, dt);
  vehicle.roll = 0.97f * vehicle.roll + 0.03f * roll_cmd;
  vehicle.pitch = 0.97f * vehicle.pitch + 0.03f * pitch_cmd;
  vehicle.yaw_rate = 0.95f * vehicle.yaw_rate + 0.05f * yaw_cmd;
  vehicle.altitude += 0.01f * (1.0f - std::fabs(vehicle.roll) - std::fabs(vehicle.pitch));
}
`;

const pixhawkTemplate = `#include <array>
#include <cstdint>

struct SensorFrame {
  float accel_x;
  float accel_y;
  float accel_z;
  float gyro_x;
  float gyro_y;
  float gyro_z;
};

SensorFrame read_imu() {
  return {0.01f, 0.02f, 1.00f, 0.001f, 0.002f, 0.003f};
}

int main() {
  std::array<float, 4> motor_mix {0.0f, 0.0f, 0.0f, 0.0f};
  while (true) {
    const SensorFrame frame = read_imu();
    motor_mix[0] = frame.accel_z + frame.gyro_x - frame.gyro_y;
    motor_mix[1] = frame.accel_z - frame.gyro_x - frame.gyro_y;
    motor_mix[2] = frame.accel_z + frame.gyro_x + frame.gyro_y;
    motor_mix[3] = frame.accel_z - frame.gyro_x + frame.gyro_y;
  }
  return 0;
}
`;

const manipulatorTemplate = `#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/joint_state.hpp>
#include <trajectory_msgs/msg/joint_trajectory.hpp>

class SimForgeManipulatorNode : public rclcpp::Node {
public:
  SimForgeManipulatorNode() : Node("simforge_manipulator") {
    state_pub_ = create_publisher<sensor_msgs::msg::JointState>("joint_states", 10);
    traj_sub_ = create_subscription<trajectory_msgs::msg::JointTrajectory>(
      "command_trajectory",
      10,
      [this](trajectory_msgs::msg::JointTrajectory::SharedPtr msg) {
        last_command_size_ = msg->points.size();
      }
    );
    timer_ = create_wall_timer(std::chrono::milliseconds(40), [this]() { publish_state(); });
  }

private:
  void publish_state() {
    sensor_msgs::msg::JointState state;
    state.name = {"joint_1", "joint_2", "joint_3", "joint_4", "joint_5", "joint_6"};
    state.position = {0.1, 0.2, 0.3, 0.1, 0.0, 0.0};
    state.velocity = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0};
    state.effort = {0.1, 0.2, 0.15, 0.05, 0.02, 0.02};
    state_pub_->publish(state);
  }

  size_t last_command_size_ {0};
  rclcpp::Publisher<sensor_msgs::msg::JointState>::SharedPtr state_pub_;
  rclcpp::Subscription<trajectory_msgs::msg::JointTrajectory>::SharedPtr traj_sub_;
  rclcpp::TimerBase::SharedPtr timer_;
};

int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<SimForgeManipulatorNode>());
  rclcpp::shutdown();
  return 0;
}
`;

const canGatewayTemplate = `export type CanFrame = {
  id: number;
  bus: string;
  data: number[];
  timestampMs: number;
};

export function normalizeFrame(frame: CanFrame) {
  return {
    ...frame,
    hex: frame.data.map((value) => value.toString(16).padStart(2, "0")).join(" "),
    dlc: frame.data.length,
  };
}

export function buildHeartbeat(nodeId: number, timestampMs: number): CanFrame {
  return {
    id: 0x700 + nodeId,
    bus: "can0",
    data: [0x05, 0x00, 0x00, 0x00],
    timestampMs,
  };
}
`;

const bmsTemplate = `import asyncio
import json
from dataclasses import dataclass, asdict


@dataclass
class CellState:
    voltage: float
    temperature_c: float
    balancing: bool


async def main() -> None:
    sequence = 0
    while True:
        cells = [
            CellState(4.05, 28.0, False),
            CellState(4.04, 28.2, False),
            CellState(4.06, 27.8, True),
            CellState(4.05, 28.1, False),
        ]
        payload = {
            "target": "bms-supervisor",
            "sequence": sequence,
            "pack_voltage": round(sum(cell.voltage for cell in cells), 3),
            "cells": [asdict(cell) for cell in cells],
            "faults": [],
        }
        print(json.dumps(payload))
        sequence += 1
        await asyncio.sleep(0.5)


if __name__ == "__main__":
    asyncio.run(main())
`;

export const firmwareProfiles: FirmwareProfile[] = [
  {
    id: "fw.arduino.uno",
    board: "Arduino Uno R3",
    componentTypes: ["arduino-uno"],
    language: "cpp",
    runtime: "AVR sketch runtime",
    toolchain: "avr-gcc / avrdude compatible",
    debugger: "Serial trace + pin timeline",
    interfaces: ["GPIO", "PWM", "UART", "I2C", "SPI", "ADC"],
    engineeringUseCases: ["Mechatronics labs", "Instrumentation", "Basic control loops"],
    sampleFiles: [{ name: "main.ino", content: arduinoUnoTemplate }],
  },
  {
    id: "fw.arduino.mega",
    board: "Arduino Mega 2560",
    componentTypes: ["arduino-mega"],
    language: "cpp",
    runtime: "AVR automation runtime",
    toolchain: "avr-gcc / avrdude compatible",
    debugger: "Multi-axis trace stream",
    interfaces: ["GPIO", "PWM", "UART", "I2C", "SPI", "ADC"],
    engineeringUseCases: ["Automation fixtures", "Multi-axis control", "Lab rigs"],
    sampleFiles: [{ name: "main.ino", content: arduinoMegaTemplate }],
  },
  {
    id: "fw.arduino.nano",
    board: "Arduino Nano",
    componentTypes: ["arduino-nano"],
    language: "cpp",
    runtime: "Compact AVR sketch runtime",
    toolchain: "avr-gcc / avrdude compatible",
    debugger: "Serial trace",
    interfaces: ["GPIO", "PWM", "UART", "I2C", "SPI", "ADC"],
    engineeringUseCases: ["Embedded prototyping", "Compact controllers", "Portable instrumentation"],
    sampleFiles: [{ name: "main.ino", content: arduinoNanoTemplate }],
  },
  {
    id: "fw.esp32.edge",
    board: "ESP32-WROOM-32",
    componentTypes: ["esp32-wroom"],
    language: "cpp",
    runtime: "Arduino on ESP32 / FreeRTOS",
    toolchain: "xtensa-esp32-elf / PlatformIO compatible",
    debugger: "UART trace + simulated Wi-Fi topic stream",
    interfaces: ["GPIO", "PWM", "UART", "I2C", "SPI", "Wi-Fi", "Bluetooth"],
    engineeringUseCases: ["IoT telemetry", "Edge device control", "Connected robotics"],
    sampleFiles: [{ name: "app_main.cpp", content: esp32Template }],
  },
  {
    id: "fw.esp8266.edge",
    board: "ESP8266 NodeMCU",
    componentTypes: ["esp8266-nodemcu"],
    language: "cpp",
    runtime: "Arduino on ESP8266",
    toolchain: "xtensa-lx106-elf / PlatformIO compatible",
    debugger: "UART trace + connectivity logs",
    interfaces: ["GPIO", "PWM", "UART", "ADC", "Wi-Fi"],
    engineeringUseCases: ["Smart home nodes", "Wireless telemetry", "Edge switching"],
    sampleFiles: [{ name: "main.cpp", content: esp8266Template }],
  },
  {
    id: "fw.stm32.motion",
    board: "STM32F103 Blue Pill",
    componentTypes: ["stm32f103"],
    language: "cpp",
    runtime: "Bare-metal / HAL motion control loop",
    toolchain: "arm-none-eabi-gcc",
    debugger: "SWD trace model + virtual register watch",
    interfaces: ["GPIO", "PWM", "UART", "CAN", "I2C", "SPI"],
    engineeringUseCases: ["Motor control", "Embedded control systems", "Industrial IO"],
    sampleFiles: [{ name: "main.cpp", content: stm32Template }],
  },
  {
    id: "fw.rp2040.pio",
    board: "Raspberry Pi Pico",
    componentTypes: ["raspberry-pi-pico"],
    language: "cpp",
    runtime: "Pico SDK runtime",
    toolchain: "arm-none-eabi-gcc + pico-sdk",
    debugger: "USB serial trace + PIO state view",
    interfaces: ["GPIO", "PWM", "UART", "I2C", "SPI", "PIO"],
    engineeringUseCases: ["Timing-sensitive interfaces", "Signal generation", "Instrumentation"],
    sampleFiles: [{ name: "main.cpp", content: rp2040Template }],
  },
  {
    id: "fw.attiny.lowpower",
    board: "ATtiny85",
    componentTypes: ["attiny85"],
    language: "cpp",
    runtime: "Minimal AVR runtime",
    toolchain: "avr-gcc",
    debugger: "Pin-level toggle inspection",
    interfaces: ["GPIO", "PWM", "ADC"],
    engineeringUseCases: ["Low-power embedded controls", "Tiny sensor nodes"],
    sampleFiles: [{ name: "main.cpp", content: attinyTemplate }],
  },
  {
    id: "fw.rpi.gateway",
    board: "Raspberry Pi 4B",
    componentTypes: ["raspberry-pi-4b", "raspberry-pi-zero"],
    language: "python",
    runtime: "Linux edge service",
    toolchain: "Python 3.11+",
    debugger: "Structured logs + process metrics",
    interfaces: ["GPIO", "UART", "I2C", "SPI", "Ethernet", "Wi-Fi", "ROS 2", "MQTT"],
    engineeringUseCases: ["Gateways", "Control-plane edge nodes", "Robotics integration"],
    sampleFiles: [{ name: "main.py", content: rpiTemplate }],
  },
  {
    id: "fw.jetson.autonomy",
    board: "Jetson Orin Nano",
    componentTypes: ["jetson-nano"],
    language: "python",
    runtime: "Linux AI autonomy service",
    toolchain: "Python 3.11+, CUDA-enabled stack",
    debugger: "Structured inference trace",
    interfaces: ["CSI", "Ethernet", "ROS 2", "gRPC"],
    engineeringUseCases: ["Perception", "Edge AI", "Autonomy validation"],
    sampleFiles: [{ name: "main.py", content: jetsonTemplate }],
  },
  {
    id: "fw.beaglebone.pru",
    board: "BeagleBone Black",
    componentTypes: ["beaglebone-black"],
    language: "python",
    runtime: "Linux + PRU bridge service",
    toolchain: "Python 3.11+, PRU toolchain",
    debugger: "PRU state and timing metrics",
    interfaces: ["GPIO", "PRU", "Ethernet", "UART", "I2C", "SPI"],
    engineeringUseCases: ["Industrial IO", "Real-time interfacing", "Machine controls"],
    sampleFiles: [{ name: "main.py", content: beagleboneTemplate }],
  },
  {
    id: "fw.drone.autopilot",
    board: "450-class Quadcopter Autopilot",
    componentTypes: ["robot-quadcopter"],
    language: "cpp",
    runtime: "Embedded UAV control loop",
    toolchain: "arm-none-eabi-gcc / PX4-style runtime",
    debugger: "Flight state replay + motor mixer trace",
    interfaces: ["PWM", "UART", "MAVLink", "I2C", "SPI"],
    engineeringUseCases: ["Flight dynamics", "UAV autonomy", "Mission rehearsal"],
    sampleFiles: [{ name: "autopilot.cpp", content: droneTemplate }],
  },
  {
    id: "fw.pixhawk.flightstack",
    board: "Pixhawk Flight Controller",
    componentTypes: ["flight-controller-pixhawk"],
    language: "cpp",
    runtime: "PX4-class flight stack",
    toolchain: "arm-none-eabi-gcc",
    debugger: "HIL telemetry + estimator trace",
    interfaces: ["MAVLink", "CAN", "PWM", "UART", "I2C", "SPI"],
    engineeringUseCases: ["Aircraft HIL", "Autopilot validation", "Navigation testing"],
    sampleFiles: [{ name: "flight_stack.cpp", content: pixhawkTemplate }],
  },
  {
    id: "fw.ros2.manipulator",
    board: "ROS 2 Manipulator Controller",
    componentTypes: ["robot-arm-4dof", "robot-arm-6dof", "ur5e"],
    language: "cpp",
    runtime: "ROS 2 manipulator runtime",
    toolchain: "colcon / ament_cmake",
    debugger: "ROS graph trace + joint-state replay",
    interfaces: ["ROS 2", "Ethernet/IP", "Fieldbus"],
    engineeringUseCases: ["Manipulator cells", "Joint playback", "Industrial robotics"],
    sampleFiles: [{ name: "controller.cpp", content: manipulatorTemplate }],
  },
  {
    id: "fw.can.gateway",
    board: "CAN Gateway Service",
    componentTypes: ["can-bus-mcp2515"],
    language: "ts",
    runtime: "TypeScript CAN normalization pipeline",
    toolchain: "Node.js 20+",
    debugger: "Message bus trace",
    interfaces: ["CAN", "SPI", "WebSocket", "REST"],
    engineeringUseCases: ["Automotive telemetry", "Industrial messaging", "Protocol bridging"],
    sampleFiles: [{ name: "gateway.ts", content: canGatewayTemplate }],
  },
  {
    id: "fw.bms.supervisor",
    board: "Battery Management Supervisor",
    componentTypes: ["battery-bms-16s"],
    language: "python",
    runtime: "Battery supervision service",
    toolchain: "Python 3.11+",
    debugger: "Cell telemetry and fault stream",
    interfaces: ["CAN", "UART", "REST"],
    engineeringUseCases: ["Battery systems", "Energy storage", "EV subsystems"],
    sampleFiles: [{ name: "main.py", content: bmsTemplate }],
  },
];

export function getFirmwareProfileForBoard(board: string) {
  return firmwareProfiles.find((profile) => profile.board === board) ?? null;
}

export function getFirmwareProfileForComponentType(componentType: string) {
  return firmwareProfiles.find((profile) => profile.componentTypes.includes(componentType)) ?? null;
}
