import { useState } from "react";
import {
  Cpu, Zap, Gauge, Radio, Thermometer, Eye, Move, Battery,
  ChevronDown, ChevronRight, Search, Grip
} from "lucide-react";

interface ComponentCategory {
  name: string;
  icon: React.ReactNode;
  items: { name: string; description: string; pins?: number }[];
}

const categories: ComponentCategory[] = [
  {
    name: "Microcontrollers",
    icon: <Cpu className="w-4 h-4" />,
    items: [
      { name: "Arduino Uno R3", description: "ATmega328P, 14 GPIO", pins: 14 },
      { name: "ESP32-WROOM", description: "Dual-core, WiFi+BT", pins: 38 },
      { name: "STM32F103", description: "ARM Cortex-M3, 72MHz", pins: 37 },
      { name: "Raspberry Pi Pico", description: "RP2040, Dual-core", pins: 26 },
      { name: "ATtiny85", description: "8-bit AVR, 8 pins", pins: 8 },
    ],
  },
  {
    name: "Microcomputers",
    icon: <Cpu className="w-4 h-4" />,
    items: [
      { name: "Raspberry Pi 4B", description: "BCM2711, 4GB RAM" },
      { name: "Jetson Nano", description: "NVIDIA, 128 CUDA cores" },
      { name: "BeagleBone Black", description: "AM335x, 512MB" },
    ],
  },
  {
    name: "Sensors",
    icon: <Eye className="w-4 h-4" />,
    items: [
      { name: "HC-SR04", description: "Ultrasonic distance" },
      { name: "DHT22", description: "Temp & humidity" },
      { name: "MPU6050", description: "6-axis IMU" },
      { name: "BMP280", description: "Barometric pressure" },
      { name: "IR Proximity", description: "Infrared obstacle" },
      { name: "LDR Module", description: "Light dependent resistor" },
      { name: "PIR Motion", description: "Passive infrared" },
      { name: "HX711 Load Cell", description: "Weight/force sensor" },
    ],
  },
  {
    name: "Actuators",
    icon: <Move className="w-4 h-4" />,
    items: [
      { name: "SG90 Servo", description: "180° micro servo" },
      { name: "MG996R Servo", description: "High torque servo" },
      { name: "NEMA 17 Stepper", description: "Bipolar stepper" },
      { name: "DC Motor", description: "6V brushed motor" },
      { name: "L298N Driver", description: "Dual H-bridge" },
      { name: "Solenoid Valve", description: "12V electromagnetic" },
    ],
  },
  {
    name: "Communication",
    icon: <Radio className="w-4 h-4" />,
    items: [
      { name: "nRF24L01", description: "2.4GHz RF module" },
      { name: "HC-05 Bluetooth", description: "Serial Bluetooth" },
      { name: "SIM800L GSM", description: "Cellular module" },
      { name: "LoRa SX1276", description: "Long range radio" },
    ],
  },
  {
    name: "Power",
    icon: <Battery className="w-4 h-4" />,
    items: [
      { name: "LM7805 Regulator", description: "5V linear reg" },
      { name: "LiPo 3.7V 1000mAh", description: "Battery cell" },
      { name: "Buck Converter", description: "DC-DC step down" },
      { name: "Solar Panel 6V", description: "Photovoltaic cell" },
    ],
  },
  {
    name: "Passive Components",
    icon: <Zap className="w-4 h-4" />,
    items: [
      { name: "Resistor", description: "1/4W through-hole" },
      { name: "Capacitor", description: "Ceramic/Electrolytic" },
      { name: "LED", description: "5mm, various colors" },
      { name: "Diode 1N4007", description: "Rectifier diode" },
      { name: "Transistor 2N2222", description: "NPN BJT" },
      { name: "Relay Module", description: "5V SPDT relay" },
    ],
  },
  {
    name: "Display & I/O",
    icon: <Gauge className="w-4 h-4" />,
    items: [
      { name: "OLED 0.96\" SSD1306", description: "128×64 I2C display" },
      { name: "LCD 16x2 I2C", description: "Character LCD" },
      { name: "4x4 Keypad", description: "Matrix keypad" },
      { name: "Rotary Encoder", description: "Incremental encoder" },
      { name: "Buzzer", description: "Piezo active buzzer" },
    ],
  },
];

export function ComponentLibrary() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Microcontrollers: true,
    Sensors: true,
  });

  const toggle = (name: string) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const filtered = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Components
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.map((cat) => (
          <div key={cat.name}>
            <button
              onClick={() => toggle(cat.name)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/50 transition-colors"
            >
              {expanded[cat.name] ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="text-primary">{cat.icon}</span>
              {cat.name}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {cat.items.length}
              </span>
            </button>

            {expanded[cat.name] && (
              <div className="pb-1">
                {cat.items.map((item) => (
                  <div
                    key={item.name}
                    draggable
                    className="flex items-center gap-2 mx-2 px-2 py-1.5 rounded-md text-xs cursor-grab hover:bg-secondary/80 transition-colors group"
                  >
                    <Grip className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
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
