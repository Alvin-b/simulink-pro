import {
  Play, Pause, RotateCcw, MousePointer2, Move, RotateCw, Maximize,
  Link, Code, Save, FolderOpen, Settings, Layers
} from "lucide-react";
import { useState } from "react";

export function TopToolbar() {
  const [simState, setSimState] = useState<"idle" | "running" | "paused">("idle");
  const [activeTool, setActiveTool] = useState("select");

  const tools = [
    { id: "select", icon: <MousePointer2 className="w-4 h-4" />, label: "Select" },
    { id: "move", icon: <Move className="w-4 h-4" />, label: "Move" },
    { id: "rotate", icon: <RotateCw className="w-4 h-4" />, label: "Rotate" },
    { id: "scale", icon: <Maximize className="w-4 h-4" />, label: "Scale" },
    { id: "wire", icon: <Link className="w-4 h-4" />, label: "Wire" },
  ];

  return (
    <div className="flex items-center justify-between h-10 px-3 toolbar-bg border-b border-border">
      {/* Left — project */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Layers className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">SimForge</span>
          <span className="text-[10px] text-muted-foreground font-mono">v0.1</span>
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

      {/* Center — tools & simulation */}
      <div className="flex items-center gap-2">
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

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setSimState((s) => (s === "running" ? "paused" : "running"))
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              simState === "running"
                ? "bg-green-500/20 text-green-400 border border-green-500/30 glow-primary-sm"
                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            }`}
          >
            {simState === "running" ? (
              <>
                <Pause className="w-3 h-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                {simState === "paused" ? "Resume" : "Run"}
              </>
            )}
          </button>
          <button
            onClick={() => setSimState("idle")}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors">
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
