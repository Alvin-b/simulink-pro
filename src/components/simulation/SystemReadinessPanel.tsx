import { Activity, Cpu, GitBranch, Network, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { getCodeTargetsForComponentTypes } from "@/modules";
import { useSimulationStore } from "@/stores/simulationStore";

function scoreProject(components: number, wires: number, targets: number, activeDomains: number) {
  return Math.min(98, 28 + components * 4 + wires * 3 + targets * 8 + activeDomains * 6);
}

export function SystemReadinessPanel() {
  const components = useSimulationStore((state) => state.components);
  const wires = useSimulationStore((state) => state.wires);
  const activeDomains = useSimulationStore((state) => state.activeDomains);
  const codeArtifactsByTarget = useSimulationStore((state) => state.codeArtifactsByTarget);

  const metrics = useMemo(() => {
    const codeTargets = getCodeTargetsForComponentTypes(components.map((component) => component.type));
    const score = scoreProject(components.length, wires.length, codeTargets.length, activeDomains.length);
    const missingConnectivity = components.filter((component) => Object.keys(component.pins).length > 0)
      .filter((component) => !wires.some((wire) => wire.from.componentId === component.id || wire.to.componentId === component.id))
      .slice(0, 3);
    const activeArtifacts = Object.entries(codeArtifactsByTarget).filter(([, files]) => files.length > 0);

    return {
      codeTargets,
      score,
      activeArtifacts,
      missingConnectivity,
    };
  }, [activeDomains.length, codeArtifactsByTarget, components, wires]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-2">
          <ShieldCheck className="h-4 w-4 text-emerald-200" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Systems Readiness</p>
          <p className="text-sm font-semibold text-white">Coupled project health and execution coverage</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <article className="rounded-xl border border-white/5 bg-slate-900/70 p-3">
          <div className="flex items-center gap-2 text-emerald-200">
            <Activity className="h-4 w-4" />
            <p className="text-xs font-semibold text-white">Readiness Score</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-white">{metrics.score}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">Weighted from graph density, domains, and execution target coverage.</p>
        </article>

        <article className="rounded-xl border border-white/5 bg-slate-900/70 p-3">
          <div className="flex items-center gap-2 text-cyan-200">
            <Cpu className="h-4 w-4" />
            <p className="text-xs font-semibold text-white">Execution Targets</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-white">{metrics.codeTargets.length}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">Runtime surfaces inferred from the current component graph.</p>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/70 p-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-cyan-200" />
          <p className="text-xs font-semibold text-white">Active Runtime Workspaces</p>
        </div>
        <div className="mt-3 space-y-2">
          {metrics.activeArtifacts.map(([target, files]) => (
            <div key={target} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/80 px-3 py-2 text-[11px]">
              <span className="font-medium text-white">{target}</span>
              <span className="text-slate-400">{files.length} file{files.length === 1 ? "" : "s"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/70 p-4">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-amber-200" />
          <p className="text-xs font-semibold text-white">Connection Gaps</p>
        </div>
        <div className="mt-3 space-y-2">
          {metrics.missingConnectivity.length === 0 && (
            <p className="text-[11px] leading-5 text-slate-400">No immediate wiring gaps detected in the active graph.</p>
          )}
          {metrics.missingConnectivity.map((component) => (
            <div key={component.id} className="rounded-lg border border-white/5 bg-slate-950/80 px-3 py-2 text-[11px]">
              <p className="font-medium text-white">{component.name}</p>
              <p className="mt-1 text-slate-400">Interfaces exist but this asset is not yet connected into the execution graph.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
