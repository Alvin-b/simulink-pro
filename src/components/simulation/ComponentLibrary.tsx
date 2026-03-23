import { useState } from "react";
import {
  Cpu, Zap, Gauge, Radio, Eye, Move, Battery,
  ChevronDown, ChevronRight, Search, Grip, Plus
} from "lucide-react";
import { useSimulationStore, ComponentType } from "@/stores/simulationStore";

interface ComponentCategory {
  name: string;
  icon: React.ReactNode;
  items: { name: string; description: string; type: ComponentType }[];
}

const categories: ComponentCategory[] = [
  {
    name: "Microcontrollers",
    icon: <Cpu className="w-4 h-4" />,
    items: [
      { name: "Arduino Uno R3", description: "ATmega328P, 14 GPIO", type: "arduino-uno" },
    ],
  },
  {
    name: "Sensors",
    icon: <Eye className="w-4 h-4" />,
    items: [
      { name: "HC-SR04", description: "Ultrasonic distance", type: "hc-sr04" },
      { name: "DHT22", description: "Temp & humidity", type: "dht22" },
    ],
  },
  {
    name: "Actuators",
    icon: <Move className="w-4 h-4" />,
    items: [
      { name: "SG90 Servo", description: "180° micro servo", type: "servo" },
      { name: "DC Motor", description: "6V brushed motor", type: "dc-motor" },
      { name: "Piezo Buzzer", description: "Active buzzer", type: "buzzer" },
    ],
  },
  {
    name: "Input",
    icon: <Gauge className="w-4 h-4" />,
    items: [
      { name: "Push Button", description: "Momentary switch", type: "button" },
      { name: "Potentiometer", description: "10kΩ variable", type: "potentiometer" },
    ],
  },
  {
    name: "Passive",
    icon: <Zap className="w-4 h-4" />,
    items: [
      { name: "LED", description: "5mm, various colors", type: "led" },
      { name: "Resistor", description: "1/4W 220Ω", type: "resistor" },
      { name: "Relay Module", description: "5V SPDT relay", type: "relay" },
    ],
  },
  {
    name: "Display & I/O",
    icon: <Gauge className="w-4 h-4" />,
    items: [
      { name: "LCD 16x2 I2C", description: "Character LCD", type: "lcd-16x2" },
    ],
  },
];

export function ComponentLibrary() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Microcontrollers: true,
    Sensors: true,
    Actuators: true,
    Input: true,
    Passive: true,
  });
  const addComponent = useSimulationStore((s) => s.addComponent);
  const log = useSimulationStore((s) => s.log);

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

      <div className="flex-1 overflow-y-auto">
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
                    className="flex items-center gap-2 mx-2 px-2 py-1.5 rounded-md text-xs cursor-pointer hover:bg-secondary/80 transition-colors group"
                    onClick={() => addComponent(item.type)}
                  >
                    <Grip className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.description}
                      </p>
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
