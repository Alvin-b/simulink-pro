import { Bot, Cpu, SearchCode, Sparkles, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { diagnoseWorkflow, getCopilotBaseUrl, suggestWorkflow, type CopilotDiagnoseReply, type CopilotSuggestReply } from "@/lib/serviceMeshClient";
import { useSimulationStore } from "@/stores/simulationStore";

const capabilityCards = [
  {
    title: "Code Assist",
    icon: SearchCode,
    text: "Generate board-aware sketches, ROS nodes, and edge services from selected components and interfaces.",
  },
  {
    title: "Debug Assist",
    icon: Wrench,
    text: "Explain runtime faults, mismatched pin maps, and actuator safety issues before deployment.",
  },
  {
    title: "Design Assist",
    icon: Sparkles,
    text: "Suggest missing parts, power paths, telemetry topics, and validation scenarios for the active project.",
  },
];

export function AICopilotPanel() {
  const components = useSimulationStore((state) => state.components);
  const selected = useSimulationStore((state) => state.selectedComponent);
  const projectName = useSimulationStore((state) => state.projectName);
  const activeDomains = useSimulationStore((state) => state.activeDomains);
  const selectedCodeTarget = useSimulationStore((state) => state.selectedCodeTarget);
  const consoleMessages = useSimulationStore((state) => state.consoleMessages);
  const [suggestionReply, setSuggestionReply] = useState<CopilotSuggestReply | null>(null);
  const [diagnosisReply, setDiagnosisReply] = useState<CopilotDiagnoseReply | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestion = useMemo(() => {
    const selectedComponent = components.find((component) => component.id === selected);
    if (!selectedComponent) return "Select a component to receive AI-generated implementation and debugging guidance.";
    if (selectedComponent.type.includes("arduino") || selectedComponent.type.includes("esp32") || selectedComponent.type.includes("stm32")) {
      return `Suggested next step: generate firmware scaffolding for ${selectedComponent.name}, validate pin assignments, and attach a telemetry trace.`;
    }
    if (selectedComponent.type.startsWith("robot-")) {
      return `Suggested next step: synthesize a control loop for ${selectedComponent.name}, add a sensor package, and validate the scenario in the robotics environment.`;
    }
    return `Suggested next step: connect ${selectedComponent.name} to a controller target and add observability channels for simulation replay.`;
  }, [components, selected]);

  useEffect(() => {
    const selectedComponent = components.find((component) => component.id === selected);

    const load = async () => {
      try {
        const [suggested, diagnosed] = await Promise.all([
          suggestWorkflow({
            project_name: projectName,
            component_type: selectedComponent?.type ?? null,
            target_runtime: selectedCodeTarget,
            active_domains: activeDomains,
            component_types: components.map((component) => component.type),
            telemetry_channels: ["run.timeline", "embedded.pin-trace"],
          }),
          diagnoseWorkflow({
            project_name: projectName,
            target_runtime: selectedCodeTarget,
            component_types: components.map((component) => component.type),
            active_domains: activeDomains,
            telemetry_channels: ["run.timeline", "embedded.pin-trace"],
            recent_console: consoleMessages.slice(-8).map((message) => message.msg),
          }),
        ]);
        setSuggestionReply(suggested);
        setDiagnosisReply(diagnosed);
        setError(null);
      } catch (serviceError) {
        setError(serviceError instanceof Error ? serviceError.message : "Copilot backend unavailable");
      }
    };

    void load();
  }, [activeDomains, components, consoleMessages, projectName, selected, selectedCodeTarget]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-2">
          <Bot className="h-4 w-4 text-cyan-200" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">AI Copilot</p>
          <p className="text-sm font-semibold text-white">Model-backed coding and debug workspace</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-cyan-100" />
          <p className="text-xs font-semibold text-white">Live recommendation</p>
        </div>
        <p className="mt-2 text-xs leading-6 text-slate-200">{suggestionReply?.summary ?? suggestion}</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-cyan-100/70">Service endpoint: {getCopilotBaseUrl()}</p>
      </div>

      <div className="mt-4 grid gap-2">
        {capabilityCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-xl border border-white/5 bg-slate-900/70 px-3 py-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-200" />
                <p className="text-xs font-semibold text-white">{card.title}</p>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">{card.text}</p>
            </article>
          );
        })}
      </div>

      {suggestionReply ? (
        <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Suggested Artifacts</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestionReply.suggested_artifacts.map((artifact) => (
              <span key={artifact} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-slate-100">
                {artifact}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {diagnosisReply ? (
        <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Diagnosis</p>
          <p className="mt-2 text-[11px] leading-6 text-slate-300">{diagnosisReply.diagnosis}</p>
          <div className="mt-3 space-y-2">
            {diagnosisReply.bottlenecks.slice(0, 3).map((item) => (
              <div key={item} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-[11px] leading-5 text-rose-100">
          {error}
        </div>
      ) : null}
    </section>
  );
}
