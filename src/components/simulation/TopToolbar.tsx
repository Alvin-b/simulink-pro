import {
  Play, Pause, RotateCcw, MousePointer2, Move, RotateCw, Maximize,
  Link, Code, Save, FolderOpen, Settings, Layers, Unlink
} from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";

export function TopToolbar() {
  const simState = useSimulationStore((s) => s.simState);
  const setSimState = useSimulationStore((s) => s.setSimState);
  const activeTool = useSimulationStore((s) => s.activeTool);
  const setActiveTool = useSimulationStore((s) => s.setActiveTool);
  const showCodeEditor = useSimulationStore((s) => s.showCodeEditor);
  const setShowCodeEditor = useSimulationStore((s) => s.setShowCodeEditor);
  const wiringMode = useSimulationStore((s) => s.wiringMode);
  const setWiringMode = useSimulationStore((s) => s.setWiringMode);
  const resetSim = useSimulationStore((s) => s.resetSimulation);
  const physicsEnabled = useSimulationStore((s) => s.physicsEnabled);
  const setPhysicsEnabled = useSimulationStore((s) => s.setPhysicsEnabled);

  const tools = [
    { id: "select", icon: <MousePointer2 className="w-4 h-4" />, label: "Select" },
    { id: "move", icon: <Move className="w-4 h-4" />, label: "Move" },
    { id: "rotate", icon: <RotateCw className="w-4 h-4" />, label: "Rotate" },
    { id: "scale", icon: <Maximize className="w-4 h-4" />, label: "Scale" },
  ];

  return (
    <div className="flex items-center justify-between h-10 px-3 toolbar-bg border-b border-border">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Layers className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">SimForge</span>
          <span className="text-[10px] text-muted-foreground font-mono">v0.2</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors">
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors">
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-2">
        {/* Transform tools */}
        <div className="flex items-center bg-secondary/50 rounded-md border border-border p-0.5">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className={`p-1.5 rounded transition-colors ${
                activeTool === tool.id
                  ? "bg-primary/20 text-primary glow-primary-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Wire tool */}
        <button
          onClick={() => setWiringMode({ active: !wiringMode.active, from: null })}
          title="Wire Tool"
          className={`p-1.5 rounded border transition-colors ${
            wiringMode.active
              ? "bg-primary/20 text-primary border-primary/30 glow-primary-sm"
              : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          {wiringMode.active ? <Unlink className="w-4 h-4" /> : <Link className="w-4 h-4" />}
        </button>

        <div className="h-4 w-px bg-border" />

        {/* Physics toggle */}
        <button
          onClick={() => setPhysicsEnabled(!physicsEnabled)}
          title="Toggle Physics"
          className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
            physicsEnabled
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-secondary/50 text-muted-foreground border-border"
          }`}
        >
          ⚡ Physics
        </button>

        <div className="h-4 w-px bg-border" />

        {/* Simulation controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (simState === "running") setSimState("paused");
              else setSimState("running");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              simState === "running"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            }`}
          >
            {simState === "running" ? (
              <><Pause className="w-3 h-3" /> Pause</>
            ) : (
              <><Play className="w-3 h-3" /> {simState === "paused" ? "Resume" : "Run"}</>
            )}
          </button>
          <button
            onClick={resetSim}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowCodeEditor(!showCodeEditor)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
            showCodeEditor
              ? "bg-primary/20 text-primary border-primary/30"
              : "text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          IDE
        </button>
        <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors">
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
