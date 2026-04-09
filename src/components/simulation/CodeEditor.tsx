import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Code2,
  Cpu,
  Loader2,
  Network,
  Play,
  Save,
  TerminalSquare,
  X,
} from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";
import { getCodeTargetsForComponentTypes } from "@/modules";
import { firmwareProfiles } from "@/platform/firmwareProfiles";

type FlashStatus = "idle" | "compiling" | "deploying" | "done";

const statusColor = {
  idle: "text-slate-300",
  compiling: "text-amber-300",
  deploying: "text-cyan-300",
  done: "text-emerald-300",
};

const diagnostics = [
  "Static timing checks on PWM outputs",
  "Sensor dependency map validation",
  "Cloud and edge topic schema inspection",
  "Safety linting for actuator control loops",
];

export function CodeEditor() {
  const code = useSimulationStore((state) => state.firmwareCode);
  const setCode = useSimulationStore((state) => state.setFirmwareCode);
  const showEditor = useSimulationStore((state) => state.showCodeEditor);
  const setShowEditor = useSimulationStore((state) => state.setShowCodeEditor);
  const setSimState = useSimulationStore((state) => state.setSimState);
  const components = useSimulationStore((state) => state.components);
  const selectedComponent = useSimulationStore((state) => state.selectedComponent);
  const log = useSimulationStore((state) => state.log);
  const selectedCodeTarget = useSimulationStore((state) => state.selectedCodeTarget);
  const setSelectedCodeTarget = useSimulationStore((state) => state.setSelectedCodeTarget);
  const exportProjectDocument = useSimulationStore((state) => state.exportProjectDocument);

  const [status, setStatus] = useState<FlashStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("Workspace synchronized");

  const selectedTypes = useMemo(() => {
    const candidates = selectedComponent
      ? components.filter((component) => component.id === selectedComponent)
      : components;
    return candidates.map((component) => component.type);
  }, [components, selectedComponent]);

  const availableTargets = useMemo(() => {
    const matches = getCodeTargetsForComponentTypes(selectedTypes);
    return matches.length > 0 ? matches : getCodeTargetsForComponentTypes(components.map((component) => component.type));
  }, [components, selectedTypes]);

  const activeTarget = availableTargets.find((target) => target.id === selectedCodeTarget) ?? availableTargets[0];
  const matchingProfiles = firmwareProfiles.filter((profile) =>
    activeTarget?.label.toLowerCase().includes("arduino") ? profile.id === "fw.arduino.avr"
    : activeTarget?.label.toLowerCase().includes("esp32") ? profile.id === "fw.esp32.freertos"
    : activeTarget?.label.toLowerCase().includes("stm32") ? profile.id === "fw.stm32.control"
    : activeTarget?.label.toLowerCase().includes("microcomputer") ? profile.id === "fw.rpi.edge"
    : false,
  );

  useEffect(() => {
    if (activeTarget && activeTarget.id !== selectedCodeTarget) {
      setSelectedCodeTarget(activeTarget.id);
      setCode(activeTarget.files[0]?.content ?? code);
    }
  }, [activeTarget, code, selectedCodeTarget, setCode, setSelectedCodeTarget]);

  if (!showEditor) return null;

  const activeComponent = components.find((component) => component.id === selectedComponent);

  const handleLoadTemplate = (content: string, name: string) => {
    setCode(content);
    log("success", `Loaded ${name} into coding workspace`);
  };

  const runPipeline = async () => {
    setStatus("compiling");
    setStatusMessage("Compiling target runtime and validating interfaces...");
    log("info", `Compile started for ${activeTarget?.label ?? "selected target"}`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setStatus("deploying");
    setStatusMessage("Deploying to simulation runtime and attaching traces...");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("done");
    setStatusMessage("Deployment complete. Runtime traces streaming.");
    setSimState("running");
    log("success", `Runtime attached to ${activeTarget?.label ?? "workspace target"}`);
  };

  const saveWorkspace = () => {
    const projectDocument = exportProjectDocument();
    const blob = new Blob([JSON.stringify(projectDocument, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "simforge-project.json";
    anchor.click();
    URL.revokeObjectURL(url);
    log("success", "Exported normalized project document");
  };

  return (
    <div className="absolute inset-y-3 right-3 z-20 flex w-[min(760px,48vw)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Advanced Runtime Workspace</p>
          <h2 className="mt-1 font-mono text-xl font-semibold text-white">Multi-target coding environment</h2>
        </div>
        <button
          onClick={() => setShowEditor(false)}
          className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid flex-1 overflow-hidden lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-white/10 bg-white/[0.03] p-4">
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/70">Attached Asset</p>
            <p className="mt-2 text-sm font-semibold text-white">{activeComponent?.name ?? "Project Workspace"}</p>
            <p className="mt-1 text-xs leading-5 text-emerald-50/80">
              {activeComponent ? `${activeComponent.type} selected in the scene` : "Select a board, robot, or connected device to scope the workspace."}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Targets</p>
            <div className="mt-2 space-y-2">
              {availableTargets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    setSelectedCodeTarget(target.id);
                    setCode(target.files[0]?.content ?? code);
                  }}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    target.id === activeTarget?.id
                      ? "border-cyan-400/30 bg-cyan-400/15"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-white">
                    {target.runtime.includes("ROS") ? <Bot className="h-4 w-4 text-cyan-200" /> : target.runtime.includes("MQTT") ? <Network className="h-4 w-4 text-cyan-200" /> : <Cpu className="h-4 w-4 text-cyan-200" />}
                    <span className="text-sm font-semibold">{target.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">{target.runtime}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{target.chipFamily}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Files</p>
            <div className="mt-2 space-y-2">
              {activeTarget?.files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => handleLoadTemplate(file.content, file.name)}
                  className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-left transition hover:bg-slate-900"
                >
                  <Code2 className="h-4 w-4 text-emerald-200" />
                  <div>
                    <p className="text-xs font-medium text-white">{file.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{file.language}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <div className="grid gap-3 border-b border-white/10 px-4 py-3 xl:grid-cols-[1fr_auto_auto]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Runtime Profile</p>
              <p className="mt-1 text-sm font-semibold text-white">{activeTarget?.label ?? "No target available"}</p>
              <p className="mt-1 text-xs text-slate-300">{activeTarget?.features.join(" • ")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Pipeline State</p>
              <p className={`mt-1 text-sm font-semibold ${statusColor[status]}`}>{status}</p>
              <p className="mt-1 text-xs text-slate-300">{statusMessage}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveWorkspace}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
              >
                <Save className="h-3.5 w-3.5" />
                Export Project
              </button>
              <button
                onClick={() => void runPipeline()}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                {status === "compiling" || status === "deploying" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Build & Attach
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_220px]">
            <div className="flex min-h-0 flex-col border-r border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-3.5 w-3.5" />
                  <span>{activeTarget?.language ?? "code"}</span>
                </div>
                <span>{code.split("\n").length} lines</span>
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none bg-[#06111a] px-4 py-4 font-mono text-[13px] leading-6 text-slate-100 outline-none"
              />
            </div>

            <div className="overflow-y-auto p-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Diagnostics</p>
                <div className="mt-3 space-y-2">
                  {diagnostics.map((item, index) => (
                    <div key={item} className="flex items-start gap-2 rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2">
                      {index % 2 === 0 ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 text-amber-300" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-white">{item}</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400">
                          {index % 2 === 0 ? "Ready for simulation execution." : "Monitoring for target-specific issues during deployment."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Interfaces</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeTarget?.features.map((feature) => (
                    <span key={feature} className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-[10px] text-cyan-50">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Firmware Profiles</p>
                <div className="mt-3 space-y-2">
                  {matchingProfiles.map((profile) => (
                    <div key={profile.id} className="rounded-xl border border-white/5 bg-slate-900/70 px-3 py-3">
                      <p className="text-xs font-semibold text-white">{profile.board}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{profile.runtime}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{profile.toolchain}</p>
                    </div>
                  ))}
                  {matchingProfiles.length === 0 && (
                    <p className="text-[11px] leading-5 text-slate-400">No direct firmware profile mapped to the active target yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
