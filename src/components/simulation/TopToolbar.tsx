import { FolderOpen, Layers, Pause, Play, RotateCcw, Save, Settings2, Wrench } from "lucide-react";
import { useRef } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import { engineAdapters, projectPlugins } from "@/platform/pluginSystem";

export function TopToolbar() {
  const simState = useSimulationStore((state) => state.simState);
  const setSimState = useSimulationStore((state) => state.setSimState);
  const showCodeEditor = useSimulationStore((state) => state.showCodeEditor);
  const setShowCodeEditor = useSimulationStore((state) => state.setShowCodeEditor);
  const resetSim = useSimulationStore((state) => state.resetSimulation);
  const setFirmwareCode = useSimulationStore((state) => state.setFirmwareCode);
  const log = useSimulationStore((state) => state.log);
  const firmwareCode = useSimulationStore((state) => state.firmwareCode);
  const activeDomains = useSimulationStore((state) => state.activeDomains);
  const projectName = useSimulationStore((state) => state.projectName);
  const exportProjectDocument = useSimulationStore((state) => state.exportProjectDocument);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeEngines = engineAdapters.filter((adapter) => activeDomains.includes(adapter.domain));
  const loadedPlugins = projectPlugins.filter((plugin) => plugin.domains.some((domain) => activeDomains.includes(domain)));

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = loadEvent.target?.result as string;
      setFirmwareCode(content);
      setShowCodeEditor(true);
      log("success", `Loaded runtime source: ${file.name}`);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleSaveCode = () => {
    const blob = new Blob([firmwareCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "simforge-runtime.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    log("success", "Saved active runtime source");
  };

  const handleExportProject = () => {
    const document = exportProjectDocument();
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}.simforge.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    log("success", "Exported normalized project snapshot");
  };

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-white/10 bg-slate-950/85 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <Layers className="h-4 w-4 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{projectName}</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Universal Simulation Studio</p>
          </div>
        </div>

        <div className="hidden h-6 w-px bg-white/10 lg:block" />

        <div className="hidden items-center gap-2 lg:flex">
          {loadedPlugins.map((plugin) => (
            <span key={plugin.id} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] text-slate-200">
              {plugin.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 xl:flex">
          <Wrench className="h-3.5 w-3.5 text-cyan-200" />
          <span className="text-[11px] text-slate-300">
            {activeEngines.map((engine) => engine.displayName).join(" • ")}
          </span>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          title="Open runtime file"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ino,.cpp,.c,.ts,.py,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={handleSaveCode}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          title="Save source"
        >
          <Save className="h-4 w-4" />
        </button>

        <button
          onClick={handleExportProject}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Export
        </button>

        <button
          onClick={() => setShowCodeEditor(!showCodeEditor)}
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
            showCodeEditor
              ? "bg-cyan-400 text-slate-950"
              : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          }`}
        >
          Runtime IDE
        </button>

        <button
          onClick={() => {
            if (simState === "running") setSimState("paused");
            else setSimState("running");
          }}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
            simState === "running"
              ? "border border-emerald-400/25 bg-emerald-400/15 text-emerald-100"
              : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          }`}
        >
          {simState === "running" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {simState === "running" ? "Pause" : "Run"}
        </button>

        <button
          onClick={resetSim}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          title="Reset simulation"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          title="Settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
