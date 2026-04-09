import { BatteryCharging, CircleDot, CircuitBoard, Plus, ToggleLeft, Waves } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";

const starterProjects = [
  {
    name: "LED Sequencer",
    summary: "Breadboard LED exercise inspired by browser-first electronics labs.",
    parts: ["breadboard", "arduino-uno", "led", "resistor", "button"],
  },
  {
    name: "Sensor Monitor",
    summary: "Simple data acquisition build for classroom prototyping.",
    parts: ["breadboard", "esp32-wroom", "dht22", "potentiometer", "buzzer"],
  },
  {
    name: "Motor Driver Lab",
    summary: "MCU plus H-bridge and power rail validation for actuators.",
    parts: ["arduino-uno", "l298n-driver", "dc-motor", "lipo-battery", "button"],
  },
];

const iconMap = {
  breadboard: CircuitBoard,
  led: CircleDot,
  resistor: Waves,
  button: ToggleLeft,
  "lipo-battery": BatteryCharging,
};

export function ElectronicsWorkbench() {
  const addComponent = useSimulationStore((state) => state.addComponent);
  const log = useSimulationStore((state) => state.log);

  const loadStarter = (parts: string[], name: string) => {
    parts.forEach((part) => addComponent(part));
    log("success", `Loaded student electronics starter: ${name}`);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Student Electronics Lab</p>
      <p className="mt-2 text-xs leading-6 text-slate-300">
        Browser-first prototyping flow for students: breadboard builds, simple components, quick experiments, and fast firmware iteration.
      </p>

      <div className="mt-4 space-y-2">
        {starterProjects.map((project) => (
          <button
            key={project.name}
            onClick={() => loadStarter(project.parts, project.name)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-left transition hover:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-white">{project.name}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">{project.summary}</p>
              </div>
              <Plus className="h-4 w-4 text-emerald-200" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.parts.map((part) => {
                const Icon = iconMap[part as keyof typeof iconMap] ?? CircuitBoard;
                return (
                  <span key={`${project.name}-${part}`} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-200">
                    <Icon className="h-3 w-3 text-cyan-200" />
                    {part}
                  </span>
                );
              })}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
