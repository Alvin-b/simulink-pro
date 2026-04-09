import { CloudCog, Database, RadioTower, Users2 } from "lucide-react";
import { AICopilotPanel } from "@/components/simulation/AICopilotPanel";
import { ComponentLibrary } from "@/components/simulation/ComponentLibrary";
import { ConsolePanel } from "@/components/simulation/ConsolePanel";
import { CodeEditor } from "@/components/simulation/CodeEditor";
import { ElectronicsWorkbench } from "@/components/simulation/ElectronicsWorkbench";
import { PropertiesPanel } from "@/components/simulation/PropertiesPanel";
import { TopToolbar } from "@/components/simulation/TopToolbar";
import { Viewport3D } from "@/components/simulation/Viewport3D";
import { WorkspacePanel } from "@/components/simulation/WorkspacePanel";
import { useArduinoVM } from "@/hooks/useArduinoVM";
import { useROS } from "@/hooks/useROS";
import { engineAdapters, runtimeAdapters } from "@/platform/pluginSystem";
import { marketComponentCatalog } from "@/platform/componentCatalog";
import { useSimulationStore } from "@/stores/simulationStore";

const orchestrationCards = [
  {
    title: "Projects",
    subtitle: "Normalized schema",
    icon: Database,
    text: "Every scene, component, wire, environment, and code artifact is exported as a versioned project document.",
  },
  {
    title: "Runs",
    subtitle: "Deterministic orchestration",
    icon: CloudCog,
    text: "Adapters coordinate robotics dynamics, firmware execution, and IoT messaging against one simulation timeline.",
  },
  {
    title: "Telemetry",
    subtitle: "Streaming traces",
    icon: RadioTower,
    text: "Serial logs, pin states, motion traces, and device topics are treated as first-class runtime outputs.",
  },
  {
    title: "Collaboration",
    subtitle: "Shared engineering sessions",
    icon: Users2,
    text: "Presence, review snapshots, and synchronized workspaces are modeled as platform services, not UI-only features.",
  },
];

const Index = () => {
  useArduinoVM();
  useROS();

  const projectDescription = useSimulationStore((state) => state.projectDescription);
  const activeDomains = useSimulationStore((state) => state.activeDomains);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[linear-gradient(180deg,_#04101a_0%,_#030811_100%)] text-white">
      <TopToolbar />

      <div className="grid flex-1 gap-3 overflow-hidden p-3 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/65 backdrop-blur">
          <ComponentLibrary />
        </aside>

        <section className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_160px]">
          <div className="relative min-h-0 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
            <Viewport3D />
            <CodeEditor />
          </div>
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/65 backdrop-blur">
            <ConsolePanel />
          </div>
        </section>

        <aside className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_auto]">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/65 backdrop-blur">
            <PropertiesPanel />
          </div>

          <div className="overflow-y-auto rounded-[28px] border border-white/10 bg-slate-950/65 p-4 backdrop-blur">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Platform Runtime</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{projectDescription}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {activeDomains.map((domain) => (
                <span key={domain} className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-50">
                  {domain}
                </span>
              ))}
            </div>

            <div className="mt-4 grid gap-2">
              {orchestrationCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-cyan-200" />
                      <div>
                        <p className="text-xs font-semibold text-white">{card.title}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{card.subtitle}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-slate-300">{card.text}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Active Engine Adapters</p>
              <div className="mt-3 space-y-2">
                {engineAdapters
                  .filter((adapter) => activeDomains.includes(adapter.domain))
                  .map((adapter) => (
                    <div key={adapter.id} className="rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2">
                      <p className="text-xs font-semibold text-white">{adapter.displayName}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{adapter.capabilities.join(" • ")}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Runtime Targets</p>
              <div className="mt-3 space-y-2">
                {runtimeAdapters.map((runtime) => (
                  <div key={runtime.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{runtime.target}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{runtime.languages.join(" / ")}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">{runtime.interfaces[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Market Catalog Foundation</p>
              <p className="mt-2 text-xs leading-6 text-slate-300">
                The platform now has a scalable catalog model for real-world boards, sensors, actuators, power modules, robotics assets, and industrial equipment.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[10px] text-white">
                  {marketComponentCatalog.length} seeded components
                </span>
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[10px] text-white">
                  multi-domain catalog
                </span>
                <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[10px] text-white">
                  vendor-aware metadata
                </span>
              </div>
            </div>

            <div className="mt-4">
              <WorkspacePanel />
            </div>

            <div className="mt-4">
              <ElectronicsWorkbench />
            </div>

            <div className="mt-4">
              <AICopilotPanel />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Index;
