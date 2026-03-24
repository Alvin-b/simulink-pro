import {
  Play, Pause, RotateCcw, MousePointer2, Move, RotateCw, Maximize,
  Link, Code, Save, FolderOpen, Settings, Layers, Unlink, Upload, Cpu
} from "lucide-react";
import { useRef } from "react";
import { useSimulationStore } from "@/stores/simulationStore";

export function TopToolbar() {
  const simState         = useSimulationStore((s) => s.simState);
  const setSimState      = useSimulationStore((s) => s.setSimState);
  const activeTool       = useSimulationStore((s) => s.activeTool);
  const setActiveTool    = useSimulationStore((s) => s.setActiveTool);
  const showCodeEditor   = useSimulationStore((s) => s.showCodeEditor);
  const setShowCodeEditor = useSimulationStore((s) => s.setShowCodeEditor);
  const wiringMode       = useSimulationStore((s) => s.wiringMode);
  const setWiringMode    = useSimulationStore((s) => s.setWiringMode);
  const resetSim         = useSimulationStore((s) => s.resetSimulation);
  const physicsEnabled   = useSimulationStore((s) => s.physicsEnabled);
  const setPhysicsEnabled = useSimulationStore((s) => s.setPhysicsEnabled);
  const setFirmwareCode  = useSimulationStore((s) => s.setFirmwareCode);
  const log              = useSimulationStore((s) => s.log);
  const firmwareCode     = useSimulationStore((s) => s.firmwareCode);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools = [
    { id: "select", icon: <MousePointer2 className="w-4 h-4" />, label: "Select (V)" },
    { id: "move",   icon: <Move          className="w-4 h-4" />, label: "Move (G)" },
    { id: "rotate", icon: <RotateCw      className="w-4 h-4" />, label: "Rotate (R)" },
    { id: "scale",  icon: <Maximize      className="w-4 h-4" />, label: "Scale (S)" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setFirmwareCode(content);
      setShowCodeEditor(true);
      log("success", `Loaded: ${file.name} (${Math.round(content.length / 1024 * 10) / 10} KB)`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSave = () => {
    const blob = new Blob([firmwareCode], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "sketch.ino";
    a.click();
    URL.revokeObjectURL(url);
    log("success", "Sketch saved: sketch.ino");
  };

  return (
    <div className="flex items-center justify-between h-10 px-3 toolbar-bg border-b border-border">
      {/* ── Left: Branding + File ops ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Layers className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">SimForge</span>
          <span className="text-[10px] text-muted-foreground font-mono">v0.3</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          {/* Open .ino file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
            title="Open .ino file"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ino,.cpp,.c,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          {/* Save sketch */}
          <button
            onClick={handleSave}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
            title="Save sketch"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Center: Tools + Simulation ── */}
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
          title={wiringMode.active ? "Exit Wire Mode" : "Wire Tool — connect component pins"}
          className={`flex items-center gap-1 px-2 py-1.5 rounded border transition-colors text-[11px] ${
            wiringMode.active
              ? "bg-primary/20 text-primary border-primary/30 glow-primary-sm"
              : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          {wiringMode.active ? <Unlink className="w-4 h-4" /> : <Link className="w-4 h-4" />}
          <span className="hidden md:inline">{wiringMode.active ? "Exit Wire" : "Wire"}</span>
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
            title="Reset simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Right: IDE + Settings ── */}
      <div className="flex items-center gap-1">
        {/* Upload sketch shortcut */}
        <button
          onClick={() => { setShowCodeEditor(true); }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Open Code Editor & Upload"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Upload</span>
        </button>

        {/* IDE toggle */}
        <button
          onClick={() => setShowCodeEditor(!showCodeEditor)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
            showCodeEditor
              ? "bg-primary/20 text-primary border-primary/30"
              : "text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
          }`}
          title="Toggle Code Editor"
        >
          <Code className="w-3.5 h-3.5" />
          IDE
        </button>

        <button
          className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
