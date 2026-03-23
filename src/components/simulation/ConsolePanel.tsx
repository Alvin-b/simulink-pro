import { useState, useRef, useEffect } from "react";
import { Terminal, Bug, Wifi, Activity, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";

const tabs = [
  { id: "console", label: "Console", icon: <Terminal className="w-3 h-3" /> },
  { id: "serial", label: "Serial Monitor", icon: <Activity className="w-3 h-3" /> },
  { id: "signals", label: "Signals", icon: <Wifi className="w-3 h-3" /> },
  { id: "debug", label: "Debug", icon: <Bug className="w-3 h-3" /> },
];

export function ConsolePanel() {
  const [activeTab, setActiveTab] = useState("console");
  const [collapsed, setCollapsed] = useState(false);
  const messages = useSimulationStore((s) => s.consoleMessages);
  const clearConsole = useSimulationStore((s) => s.clearConsole);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const typeColors: Record<string, string> = {
    info: "text-muted-foreground",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
    serial: "text-primary",
  };

  const filtered = activeTab === "serial"
    ? messages.filter((m) => m.type === "serial")
    : messages;

  return (
    <div className={`flex flex-col border-t border-border toolbar-bg ${collapsed ? "h-8" : ""}`}>
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
              {tab.id === "serial" && (
                <span className="ml-1 text-[9px] px-1 rounded bg-primary/20 text-primary">
                  {messages.filter((m) => m.type === "serial").length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearConsole}
            className="p-1 text-muted-foreground hover:text-foreground"
            title="Clear"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5 min-h-[100px] max-h-[150px]">
          {(activeTab === "console" || activeTab === "serial") &&
            filtered.map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-muted-foreground/50 select-none">{line.time}</span>
                {line.type === "serial" && <span className="text-primary/50 select-none">[SER]</span>}
                <span className={typeColors[line.type]}>{line.msg}</span>
              </div>
            ))}
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
