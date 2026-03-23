import { useState, useRef, useEffect } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import { X, Play, RotateCcw, Download, Upload } from "lucide-react";

export function CodeEditor() {
  const code = useSimulationStore((s) => s.firmwareCode);
  const setCode = useSimulationStore((s) => s.setFirmwareCode);
  const showEditor = useSimulationStore((s) => s.showCodeEditor);
  const setShowEditor = useSimulationStore((s) => s.setShowCodeEditor);
  const simState = useSimulationStore((s) => s.simState);
  const setSimState = useSimulationStore((s) => s.setSimState);
  const log = useSimulationStore((s) => s.log);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);

  const lines = code.split("\n");

  const handleFlash = () => {
    log("info", "Compiling sketch...");
    setTimeout(() => {
      log("success", `Sketch compiled — ${code.length} bytes`);
      log("info", "Flashing to Arduino Uno...");
      setTimeout(() => {
        log("success", "Flash complete — running firmware");
        setSimState("running");
      }, 300);
    }, 200);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  if (!showEditor) return null;

  return (
    <div className="absolute top-0 right-0 w-[480px] h-full z-20 flex flex-col bg-card border-l border-border shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border toolbar-bg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">sketch.ino</span>
          <span className="text-[10px] text-muted-foreground font-mono">Arduino C++</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFlash}
            disabled={simState === "running"}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-40 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Flash & Run
          </button>
          <button
            onClick={() => setShowEditor(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line numbers */}
        <div
          ref={lineCountRef}
          className="w-10 flex-shrink-0 overflow-hidden py-3 text-right pr-2 text-[11px] font-mono text-muted-foreground/40 leading-[1.6] select-none border-r border-border bg-background/50"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className="flex-1 resize-none p-3 text-[12px] font-mono leading-[1.6] bg-transparent text-foreground focus:outline-none overflow-auto"
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border text-[10px] font-mono text-muted-foreground toolbar-bg">
        <span>{lines.length} lines • {code.length} chars</span>
        <span>ATmega328P • 32KB Flash • 2KB SRAM</span>
      </div>
    </div>
  );
}
