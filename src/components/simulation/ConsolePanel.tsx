import { useState } from "react";
import { Terminal, Bug, Wifi, Activity, ChevronUp, ChevronDown } from "lucide-react";

const tabs = [
  { id: "console", label: "Console", icon: <Terminal className="w-3 h-3" /> },
  { id: "serial", label: "Serial Monitor", icon: <Activity className="w-3 h-3" /> },
  { id: "signals", label: "Signals", icon: <Wifi className="w-3 h-3" /> },
  { id: "debug", label: "Debug", icon: <Bug className="w-3 h-3" /> },
];

const consoleLines = [
  { type: "info", time: "00:00:01", msg: "Simulation engine initialized" },
  { type: "info", time: "00:00:01", msg: "Physics world created — gravity: 9.81 m/s²" },
  { type: "success", time: "00:00:02", msg: "Arduino Uno R3 loaded — firmware: empty sketch" },
  { type: "info", time: "00:00:02", msg: "GPIO pins initialized (D0-D13, A0-A5)" },
  { type: "success", time: "00:00:03", msg: "HC-SR04 mounted — trigger: D9, echo: D10" },
  { type: "warning", time: "00:00:03", msg: "SG90 Servo — no signal connected to PWM pin" },
  { type: "info", time: "00:00:04", msg: "Scene ready — 3 components, 0 wires" },
];

export function ConsolePanel() {
  const [activeTab, setActiveTab] = useState("console");
  const [collapsed, setCollapsed] = useState(false);

  const typeColors: Record<string, string> = {
    info: "text-muted-foreground",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
  };

  return (
    <div className={`flex flex-col border-t border-border toolbar-bg ${collapsed ? "h-8" : ""}`}>
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border px-1">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCollapsed(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] border-b-2 transition-colors ${
                activeTab === tab.id && !collapsed
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 text-muted-foreground hover:text-foreground">
          {collapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5 min-h-[100px]">
          {activeTab === "console" &&
            consoleLines.map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-muted-foreground/50 select-none">{line.time}</span>
                <span className={typeColors[line.type]}>{line.msg}</span>
              </div>
            ))}
          {activeTab === "serial" && (
            <div className="text-muted-foreground italic">
              Serial monitor — connect to a running sketch to see output
            </div>
          )}
          {activeTab === "signals" && (
            <div className="text-muted-foreground italic">
              Signal analyzer — run simulation to capture I2C/SPI/UART traffic
            </div>
          )}
          {activeTab === "debug" && (
            <div className="text-muted-foreground italic">
              Debugger — set breakpoints in your firmware code
            </div>
          )}
        </div>
      )}
    </div>
  );
}
