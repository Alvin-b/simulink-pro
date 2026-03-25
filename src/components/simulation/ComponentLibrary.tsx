import { useState } from "react";
import {
  Cpu, Zap, Gauge, Radio, Eye, Move, Battery, Box, Bot, Map,
  ChevronDown, ChevronRight, Search, Grip, Plus, Monitor, Wifi
} from "lucide-react";
import { useSimulationStore, ComponentType, EnvironmentPreset } from "@/stores/simulationStore";
import { CustomModelUpload } from "./CustomModelUpload";

interface LibItem { name: string; description: string; type: ComponentType }
interface LibCategory { name: string; icon: React.ReactNode; items: LibItem[] }

const categories: LibCategory[] = [
  {
    name: "Microcontrollers",
    icon: <Cpu className="w-4 h-4" />,
    items: [
      { name: "Arduino Uno R3", description: "ATmega328P 16MHz", type: "arduino-uno" },
      { name: "Arduino Mega 2560", description: "ATmega2560, 54 I/O", type: "arduino-mega" },
      { name: "Arduino Nano V3", description: "ATmega328P compact", type: "arduino-nano" },
      { name: "ESP32-WROOM-32", description: "Dual-core WiFi+BT", type: "esp32-wroom" },
      { name: "NodeMCU ESP8266", description: "WiFi, 80MHz", type: "esp8266-nodemcu" },
      { name: "STM32 Blue Pill", description: "ARM Cortex-M3 72MHz", type: "stm32f103" },
      { name: "ATtiny85", description: "8-bit AVR DIP-8", type: "attiny85" },
    ],
  },
  {
    name: "Microcomputers",
    icon: <Monitor className="w-4 h-4" />,
    items: [
      { name: "Raspberry Pi 4B", description: "BCM2711 4GB WiFi/BT", type: "raspberry-pi-4b" },
      { name: "Raspberry Pi Pico", description: "RP2040 dual-core", type: "raspberry-pi-pico" },
      { name: "Raspberry Pi Zero 2W", description: "Quad-core WiFi", type: "raspberry-pi-zero" },
      { name: "NVIDIA Jetson Nano", description: "128 CUDA cores", type: "jetson-nano" },
      { name: "BeagleBone Black", description: "AM3358 1GHz", type: "beaglebone-black" },
    ],
  },
  {
    name: "Sensors",
    icon: <Eye className="w-4 h-4" />,
    items: [
      { name: "HC-SR04 Ultrasonic", description: "2-400cm range", type: "hc-sr04" },
      { name: "DHT22", description: "Temp & humidity ±0.5°C", type: "dht22" },
      { name: "DHT11", description: "Temp & humidity basic", type: "dht11" },
      { name: "BMP280 Barometric", description: "Pressure + altitude", type: "bmp280" },
      { name: "MPU-6050 IMU", description: "6-axis accel+gyro", type: "mpu6050" },
      { name: "IR Proximity TCRT5000", description: "Infrared obstacle", type: "ir-sensor" },
      { name: "PIR HC-SR501", description: "Passive IR motion", type: "pir-sensor" },
      { name: "LDR Light Sensor", description: "Photoresistor module", type: "ldr-module" },
      { name: "NEO-6M GPS", description: "NMEA GPS receiver", type: "gps-neo6m" },
      { name: "5-Ch Line Follower", description: "IR line tracking", type: "line-follower-ir" },
      { name: "LIDAR-Lite v3", description: "Laser range 0-40m", type: "lidar-lite" },
      { name: "Soil Moisture", description: "Capacitive soil sensor", type: "soil-moisture" },
      { name: "MQ-2 Gas Sensor", description: "Smoke/LPG/CO detector", type: "mq2-gas" },
      { name: "TCS3200 Color", description: "RGB color detector", type: "color-sensor-tcs3200" },
      { name: "HX711 Load Cell", description: "Weight sensor amp", type: "hx711" },
    ],
  },
  {
    name: "Actuators",
    icon: <Move className="w-4 h-4" />,
    items: [
      { name: "SG90 Micro Servo", description: "180° 1.8kg·cm", type: "servo-sg90" },
      { name: "MG996R Servo", description: "180° 11kg·cm metal", type: "servo-mg996r" },
      { name: "NEMA 17 Stepper", description: "1.8° 200 steps/rev", type: "nema17-stepper" },
      { name: "DC Motor TT Gear", description: "6V 200RPM", type: "dc-motor" },
      { name: "DC Motor + Encoder", description: "12V with quadrature", type: "dc-motor-encoder" },
      { name: "L298N H-Bridge", description: "Dual motor driver 2A", type: "l298n-driver" },
      { name: "A4988 Stepper Driver", description: "1/16 microstepping", type: "a4988-driver" },
      { name: "Solenoid Valve", description: "12V electromagnetic", type: "solenoid-valve" },
      { name: "Linear Actuator", description: "100mm stroke 150N", type: "linear-actuator" },
    ],
  },
  {
    name: "Input Devices",
    icon: <Gauge className="w-4 h-4" />,
    items: [
      { name: "Push Button", description: "Tactile momentary", type: "button" },
      { name: "Potentiometer 10kΩ", description: "Rotary variable", type: "potentiometer" },
      { name: "Rotary Encoder KY-040", description: "Incremental + button", type: "rotary-encoder" },
      { name: "Analog Joystick", description: "2-axis + button", type: "joystick" },
      { name: "4x4 Keypad", description: "16-key matrix", type: "keypad-4x4" },
    ],
  },
  {
    name: "Passive & Output",
    icon: <Zap className="w-4 h-4" />,
    items: [
      { name: "LED 5mm", description: "Various colors", type: "led" },
      { name: "RGB LED", description: "Common cathode", type: "led-rgb" },
      { name: "Resistor 220Ω", description: "1/4W 5% tolerance", type: "resistor" },
      { name: "Capacitor 100µF", description: "Electrolytic 16V", type: "capacitor" },
      { name: "Piezo Buzzer", description: "Active 5V", type: "buzzer" },
      { name: "Relay Module 5V", description: "SPDT 10A 250VAC", type: "relay-module" },
      { name: "Breadboard 830pt", description: "Full-size", type: "breadboard" },
      { name: "Mini Breadboard", description: "170-point", type: "breadboard-mini" },
    ],
  },
  {
    name: "Displays",
    icon: <Monitor className="w-4 h-4" />,
    items: [
      { name: "OLED 0.96\" SSD1306", description: "128×64 I2C", type: "oled-ssd1306" },
      { name: "LCD 16x2 I2C", description: "HD44780 character", type: "lcd-16x2" },
      { name: "2.8\" TFT ILI9341", description: "320×240 SPI color", type: "tft-ili9341" },
      { name: "7-Segment Display", description: "Common cathode", type: "seven-segment" },
    ],
  },
  {
    name: "IoT & Communication",
    icon: <Wifi className="w-4 h-4" />,
    items: [
      { name: "nRF24L01+ 2.4GHz", description: "100m RF transceiver", type: "nrf24l01" },
      { name: "HC-05 Bluetooth", description: "Serial SPP", type: "hc05-bluetooth" },
      { name: "SIM800L GSM", description: "2G cellular", type: "sim800l-gsm" },
      { name: "LoRa SX1276", description: "433MHz 5km range", type: "lora-sx1276" },
      { name: "RFID-RC522", description: "13.56MHz NFC/RFID", type: "rfid-rc522" },
      { name: "ESP-01 WiFi", description: "802.11 b/g/n", type: "wifi-module" },
    ],
  },
  {
    name: "Power",
    icon: <Battery className="w-4 h-4" />,
    items: [
      { name: "LM7805 Regulator", description: "5V 1.5A linear", type: "lm7805" },
      { name: "LiPo 3.7V 2200mAh", description: "Rechargeable cell", type: "lipo-battery" },
      { name: "LM2596 Buck Conv.", description: "DC-DC adjustable", type: "buck-converter" },
      { name: "Solar Panel 6V 1W", description: "Photovoltaic", type: "solar-panel" },
    ],
  },
  {
    name: "Complete Robots",
    icon: <Bot className="w-4 h-4" />,
    items: [
      { name: "2WD Smart Car", description: "Arduino + ultrasonic + line follower", type: "robot-2wd-car" },
      { name: "4WD Mecanum Robot", description: "Omnidirectional mecanum wheels", type: "robot-4wd-car" },
      { name: "4-DOF Robotic Arm", description: "4 servo desktop arm", type: "robot-arm-4dof" },
      { name: "6-DOF Robotic Arm", description: "6 servo industrial arm", type: "robot-arm-6dof" },
      { name: "Hexapod Walker", description: "6-legged 18-servo spider", type: "robot-hexapod" },
      { name: "Quadcopter F450", description: "4-motor drone frame", type: "robot-quadcopter" },
      { name: "Tank Tracked Robot", description: "Metal tracks all-terrain", type: "robot-tank-tracks" },
      { name: "Humanoid 17-DOF", description: "Bipedal walking robot", type: "robot-humanoid" },
    ],
  },
  {
    name: "Environment",
    icon: <Map className="w-4 h-4" />,
    items: [
      { name: "Wall Segment", description: "3m boundary wall", type: "env-wall" },
      { name: "Ramp 30°", description: "Inclined surface", type: "env-ramp" },
      { name: "Obstacle Block", description: "50cm cube", type: "env-obstacle" },
      { name: "Line-Follow Track", description: "Black line on white", type: "env-line-track" },
      { name: "Work Table", description: "2m×1m surface", type: "env-table" },
      { name: "Conveyor Belt", description: "3m motorized belt", type: "env-conveyor" },
    ],
  },
];

const envPresets: { id: EnvironmentPreset; label: string }[] = [
  { id: "empty", label: "Empty" },
  { id: "robotics-lab", label: "Robotics Lab" },
  { id: "line-follow-track", label: "Line Track" },
  { id: "obstacle-course", label: "Obstacle Course" },
  { id: "warehouse", label: "Warehouse" },
];

export function ComponentLibrary() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Complete Robots": true,
    Microcontrollers: true,
  });
  const addComponent = useSimulationStore((s) => s.addComponent);
  const loadEnv = useSimulationStore((s) => s.loadEnvironment);
  const currentEnv = useSimulationStore((s) => s.environmentPreset);

  const toggle = (name: string) => setExpanded((p) => ({ ...p, [name]: !p[name] }));

  const filtered = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Components</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text" placeholder="Search 80+ components..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Environment presets */}
      <div className="p-2 border-b border-border">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5 px-1">Test Environment</p>
        <div className="flex flex-wrap gap-1">
          {envPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => loadEnv(p.id)}
              className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                currentEnv === p.id
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((cat) => (
          <div key={cat.name}>
            <button
              onClick={() => toggle(cat.name)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/50 transition-colors"
            >
              {expanded[cat.name] ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <span className="text-primary">{cat.icon}</span>
              {cat.name}
              <span className="ml-auto text-[10px] text-muted-foreground">{cat.items.length}</span>
            </button>
            {expanded[cat.name] && (
              <div className="pb-1">
                {cat.items.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center gap-2 mx-2 px-2 py-1.5 rounded-md text-xs cursor-pointer hover:bg-secondary/80 transition-colors group"
                    onClick={() => addComponent(item.type)}
                  >
                    <Grip className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <Plus className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
