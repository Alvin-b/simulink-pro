export type ComponentCategory =
  | "microcontroller"
  | "microcomputer"
  | "sensor"
  | "actuator"
  | "power"
  | "passive"
  | "communication"
  | "robotics"
  | "aerospace"
  | "energy"
  | "industrial";

export type CatalogComponent = {
  sku: string;
  name: string;
  vendor: string;
  category: ComponentCategory;
  domain: string;
  protocols: string[];
  packageType: string;
  simulationLevel: "interactive" | "engineering" | "hil-ready";
  notes: string;
};

export const marketComponentCatalog: CatalogComponent[] = [
  { sku: "arduino-uno-r3", name: "Arduino Uno R3", vendor: "Arduino", category: "microcontroller", domain: "embedded", protocols: ["GPIO", "PWM", "UART", "I2C", "SPI"], packageType: "development-board", simulationLevel: "interactive", notes: "Entry board for student and rapid-control workflows." },
  { sku: "arduino-mega-2560", name: "Arduino Mega 2560", vendor: "Arduino", category: "microcontroller", domain: "embedded", protocols: ["GPIO", "PWM", "UART", "I2C", "SPI"], packageType: "development-board", simulationLevel: "interactive", notes: "Higher pin-count board for automation and lab fixtures." },
  { sku: "esp32-wroom-32", name: "ESP32-WROOM-32", vendor: "Espressif", category: "microcontroller", domain: "iot", protocols: ["GPIO", "PWM", "UART", "I2C", "SPI", "Wi-Fi", "Bluetooth"], packageType: "module", simulationLevel: "engineering", notes: "Dual-core wireless MCU used widely in edge and IoT systems." },
  { sku: "stm32f103c8t6", name: "STM32F103C8T6 Blue Pill", vendor: "STMicroelectronics", category: "microcontroller", domain: "embedded", protocols: ["GPIO", "PWM", "UART", "I2C", "SPI", "CAN"], packageType: "development-board", simulationLevel: "engineering", notes: "ARM Cortex-M board for motor control and real-time systems." },
  { sku: "rp2040-pico", name: "Raspberry Pi Pico", vendor: "Raspberry Pi", category: "microcontroller", domain: "embedded", protocols: ["GPIO", "PWM", "UART", "I2C", "SPI", "PIO"], packageType: "development-board", simulationLevel: "engineering", notes: "Microcontroller with programmable I/O for timing-sensitive designs." },
  { sku: "raspberry-pi-4b", name: "Raspberry Pi 4B", vendor: "Raspberry Pi", category: "microcomputer", domain: "embedded", protocols: ["GPIO", "UART", "I2C", "SPI", "Ethernet", "Wi-Fi"], packageType: "single-board-computer", simulationLevel: "engineering", notes: "Linux SBC for gateways, robotics brains, and edge compute." },
  { sku: "jetson-orin-nano", name: "Jetson Orin Nano", vendor: "NVIDIA", category: "microcomputer", domain: "robotics", protocols: ["GPIO", "UART", "I2C", "SPI", "Ethernet", "CSI"], packageType: "ai-compute-module", simulationLevel: "hil-ready", notes: "Edge AI compute for perception-heavy robotics workloads." },
  { sku: "hc-sr04", name: "HC-SR04 Ultrasonic Sensor", vendor: "Generic", category: "sensor", domain: "embedded", protocols: ["GPIO"], packageType: "sensor-module", simulationLevel: "interactive", notes: "Distance sensing for entry robotics and classroom labs." },
  { sku: "dht22-am2302", name: "DHT22 / AM2302", vendor: "Aosong", category: "sensor", domain: "iot", protocols: ["Single-wire"], packageType: "sensor-module", simulationLevel: "interactive", notes: "Basic environmental telemetry sensor." },
  { sku: "mpu6050", name: "MPU-6050 IMU", vendor: "TDK InvenSense", category: "sensor", domain: "robotics", protocols: ["I2C"], packageType: "sensor-module", simulationLevel: "engineering", notes: "6-axis inertial measurement for balancing and navigation." },
  { sku: "bme280", name: "BME280", vendor: "Bosch", category: "sensor", domain: "iot", protocols: ["I2C", "SPI"], packageType: "sensor-module", simulationLevel: "engineering", notes: "Pressure, humidity, and temperature sensor for environmental systems." },
  { sku: "ina219", name: "INA219 Current Sensor", vendor: "Texas Instruments", category: "sensor", domain: "energy", protocols: ["I2C"], packageType: "power-monitor", simulationLevel: "engineering", notes: "Current and bus voltage telemetry for energy systems." },
  { sku: "nema17", name: "NEMA 17 Stepper", vendor: "Generic", category: "actuator", domain: "industrial", protocols: ["STEP/DIR"], packageType: "motor", simulationLevel: "engineering", notes: "Motion-control motor for CNC, lab automation, and robotics." },
  { sku: "servo-sg90", name: "SG90 Micro Servo", vendor: "TowerPro", category: "actuator", domain: "robotics", protocols: ["PWM"], packageType: "servo", simulationLevel: "interactive", notes: "Low-cost positional actuator for classroom robotics." },
  { sku: "servo-mg996r", name: "MG996R Servo", vendor: "TowerPro", category: "actuator", domain: "robotics", protocols: ["PWM"], packageType: "servo", simulationLevel: "engineering", notes: "Higher torque servo for manipulators and heavier mechanisms." },
  { sku: "l298n-driver", name: "L298N Dual H-Bridge", vendor: "STMicroelectronics", category: "actuator", domain: "embedded", protocols: ["GPIO", "PWM"], packageType: "motor-driver", simulationLevel: "interactive", notes: "Legacy H-bridge module still common in student labs." },
  { sku: "a4988", name: "A4988 Stepper Driver", vendor: "Allegro", category: "actuator", domain: "industrial", protocols: ["STEP/DIR"], packageType: "driver-module", simulationLevel: "engineering", notes: "Compact driver for steppers and precise motion systems." },
  { sku: "lipo-3s", name: "3S LiPo Pack", vendor: "Generic", category: "power", domain: "energy", protocols: ["DC"], packageType: "battery-pack", simulationLevel: "engineering", notes: "Portable power source for drones, mobile robots, and test benches." },
  { sku: "buck-converter-lm2596", name: "LM2596 Buck Converter", vendor: "Texas Instruments", category: "power", domain: "energy", protocols: ["DC"], packageType: "power-module", simulationLevel: "engineering", notes: "DC conversion stage for embedded and robotics power rails." },
  { sku: "solar-panel-50w", name: "50W Solar Panel", vendor: "Generic", category: "energy", domain: "energy", protocols: ["DC"], packageType: "energy-source", simulationLevel: "engineering", notes: "Renewable source modeling for off-grid and IoT energy studies." },
  { sku: "mqtt-gateway", name: "MQTT Edge Gateway", vendor: "SimForge", category: "communication", domain: "iot", protocols: ["MQTT", "WebSocket", "REST"], packageType: "gateway", simulationLevel: "engineering", notes: "Bridges device telemetry into cloud and analytics pipelines." },
  { sku: "can-mcp2515", name: "MCP2515 CAN Module", vendor: "Microchip", category: "communication", domain: "industrial", protocols: ["CAN", "SPI"], packageType: "communication-module", simulationLevel: "engineering", notes: "Vehicle and industrial communication interface." },
  { sku: "ur5e", name: "UR5e Collaborative Arm", vendor: "Universal Robots", category: "robotics", domain: "robotics", protocols: ["Ethernet/IP", "ROS 2", "Fieldbus"], packageType: "industrial-robot", simulationLevel: "hil-ready", notes: "Representative industrial manipulator for photoreal cell simulation." },
  { sku: "quadcopter-450", name: "450-class Quadcopter", vendor: "Generic", category: "aerospace", domain: "aerospace", protocols: ["PWM", "MAVLink", "UART"], packageType: "uav-platform", simulationLevel: "engineering", notes: "UAV baseline for aerial robotics and autonomy studies." },
  { sku: "battery-bms-16s", name: "16S Battery Management System", vendor: "Generic", category: "energy", domain: "energy", protocols: ["CAN", "UART"], packageType: "bms-module", simulationLevel: "engineering", notes: "Battery pack supervision for EV and storage simulations." },
];

export function searchCatalog(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return marketComponentCatalog;
  return marketComponentCatalog.filter((component) =>
    [component.sku, component.name, component.vendor, component.domain, component.category, component.notes]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}
