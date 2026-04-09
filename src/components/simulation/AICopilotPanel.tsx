import { Bot, Cpu, SearchCode, Sparkles, Wrench } from "lucide-react";
import { useMemo } from "react";
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
        <p className="mt-2 text-xs leading-6 text-slate-200">{suggestion}</p>
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
    </section>
  );
}
