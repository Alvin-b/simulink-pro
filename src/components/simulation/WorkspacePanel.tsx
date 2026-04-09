import { Activity, Cloud, CloudOff, RadioTower, RefreshCw, Users2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getCopilotHealth, getCoreHealth, getDeviceRuntimeHealth, getCoreBaseUrl, getCopilotBaseUrl, getDeviceRuntimeBaseUrl, type ServiceHealth } from "@/lib/serviceMeshClient";
import {
  appendTelemetry,
  createRun,
  getHealth,
  getOrchestratorBaseUrl,
  listPresence,
  listProjects,
  listRuns,
  updatePresence,
  upsertProject,
  type OrchestratorHealth,
  type OrchestratorPresence,
  type OrchestratorProject,
  type OrchestratorRun,
} from "@/lib/orchestratorClient";
import { useSimulationStore } from "@/stores/simulationStore";

type ConnectionState = "checking" | "online" | "offline";

function formatTimestamp(value?: string) {
  if (!value) return "No activity yet";
  return new Date(value).toLocaleString();
}

export function WorkspacePanel() {
  const projectId = useSimulationStore((state) => state.projectId);
  const projectName = useSimulationStore((state) => state.projectName);
  const projectDescription = useSimulationStore((state) => state.projectDescription);
  const activeDomains = useSimulationStore((state) => state.activeDomains);
  const simState = useSimulationStore((state) => state.simState);
  const simTime = useSimulationStore((state) => state.simTime);
  const components = useSimulationStore((state) => state.components);
  const wires = useSimulationStore((state) => state.wires);
  const log = useSimulationStore((state) => state.log);
  const exportProjectDocument = useSimulationStore((state) => state.exportProjectDocument);

  const [connectionState, setConnectionState] = useState<ConnectionState>("checking");
  const [health, setHealth] = useState<OrchestratorHealth | null>(null);
  const [coreHealth, setCoreHealth] = useState<ServiceHealth | null>(null);
  const [copilotHealth, setCopilotHealth] = useState<ServiceHealth | null>(null);
  const [runtimeHealth, setRuntimeHealth] = useState<ServiceHealth | null>(null);
  const [projects, setProjects] = useState<OrchestratorProject[]>([]);
  const [runs, setRuns] = useState<OrchestratorRun[]>([]);
  const [presence, setPresence] = useState<OrchestratorPresence[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [startingRun, setStartingRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWorkspace = async () => {
    try {
      const [healthResult, projectsResult, runsResult, presenceResult] = await Promise.all([
        getHealth(),
        listProjects(),
        listRuns(projectId),
        listPresence(projectId),
      ]);
      setHealth(healthResult);
      try {
        const [coreResult, copilotResult, runtimeResult] = await Promise.all([
          getCoreHealth(),
          getCopilotHealth(),
          getDeviceRuntimeHealth(),
        ]);
        setCoreHealth(coreResult);
        setCopilotHealth(copilotResult);
        setRuntimeHealth(runtimeResult);
      } catch {
        setCoreHealth(null);
        setCopilotHealth(null);
        setRuntimeHealth(null);
      }
      setProjects(projectsResult);
      setRuns(runsResult);
      setPresence(presenceResult);
      setConnectionState("online");
      setError(null);
    } catch (refreshError) {
      setConnectionState("offline");
      setHealth(null);
      setCoreHealth(null);
      setCopilotHealth(null);
      setRuntimeHealth(null);
      setError(refreshError instanceof Error ? refreshError.message : "Unable to reach orchestrator");
    }
  };

  useEffect(() => {
    void refreshWorkspace();
    const interval = window.setInterval(() => {
      void refreshWorkspace();
    }, 6000);

    return () => window.clearInterval(interval);
  }, [projectId]);

  const handleSyncProject = async () => {
    setSyncing(true);
    try {
      const document = exportProjectDocument();
      const savedProject = await upsertProject({
        id: projectId,
        name: projectName,
        description: projectDescription,
        activeDomains,
        componentCount: document.scene.components.length,
        connectionCount: document.scene.connections.length,
        scenarioCount: document.scenarios.length,
      });
      const nextPresence = await updatePresence(projectId, {
        id: "user-local",
        name: "Local Engineer",
        role: "engineer",
        status: simState === "running" ? "running" : "editing",
      });
      setPresence(nextPresence);
      setProjects((current) => {
        const withoutExisting = current.filter((project) => project.id !== savedProject.id);
        return [savedProject, ...withoutExisting];
      });
      setConnectionState("online");
      setError(null);
      log("success", "Synced project snapshot to orchestrator");
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Project sync failed";
      setConnectionState("offline");
      setError(message);
      log("error", `Orchestrator sync failed: ${message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateRun = async () => {
    setStartingRun(true);
    try {
      const document = exportProjectDocument();
      const run = await createRun({
        projectId,
        scenario: document.scenarios[0]?.name ?? "Primary Validation Scenario",
        status: simState === "running" ? "running" : "queued",
      });
      await appendTelemetry({
        runId: run.id,
        type: "studio.snapshot",
        payload: {
          simState,
          simTime,
          componentCount: components.length,
          connectionCount: wires.length,
          activeDomains,
        },
      });
      setRuns((current) => [run, ...current]);
      setConnectionState("online");
      setError(null);
      log("success", `Created orchestrated run: ${run.id}`);
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Run creation failed";
      setConnectionState("offline");
      setError(message);
      log("error", `Unable to create orchestrated run: ${message}`);
    } finally {
      setStartingRun(false);
    }
  };

  const statusLabel = connectionState === "online" ? "Connected" : connectionState === "offline" ? "Offline" : "Checking";
  const statusIcon = connectionState === "online" ? Cloud : connectionState === "offline" ? CloudOff : RefreshCw;
  const StatusIcon = statusIcon;
  const latestRun = runs[0];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Workspace Control Plane</p>
          <p className="mt-1 text-sm font-semibold text-white">Orchestrator-backed project and run state</p>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-200">
            <StatusIcon className={`h-3.5 w-3.5 ${connectionState === "checking" ? "animate-spin text-cyan-200" : connectionState === "online" ? "text-emerald-200" : "text-rose-200"}`} />
            {statusLabel}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-300">
        Studio endpoint: <span className="font-mono text-slate-100">{getOrchestratorBaseUrl()}</span>
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-slate-900/70 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Projects</p>
          <p className="mt-2 text-lg font-semibold text-white">{projects.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/70 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Runs</p>
          <p className="mt-2 text-lg font-semibold text-white">{runs.length}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/70 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Presence</p>
          <p className="mt-2 text-lg font-semibold text-white">{presence.length}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold text-white">Service Mesh</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { label: "Orchestrator", value: getOrchestratorBaseUrl(), health },
            { label: "Rust Core", value: getCoreBaseUrl(), health: coreHealth },
            { label: "AI + Runtime", value: `${getCopilotBaseUrl()} / ${getDeviceRuntimeBaseUrl()}`, health: copilotHealth && runtimeHealth ? { status: "ok", service: "service-mesh" } : null },
          ].map((service) => (
            <div key={service.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{service.label}</p>
              <p className="mt-2 break-all font-mono text-[11px] text-slate-100">{service.value}</p>
              <p className={`mt-2 text-[10px] uppercase tracking-[0.16em] ${service.health ? "text-emerald-200" : "text-rose-200"}`}>
                {service.health ? "online" : "offline"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => void handleSyncProject()}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Cloud className="h-3.5 w-3.5" />
          {syncing ? "Syncing..." : "Sync Project"}
        </button>
        <button
          onClick={() => void handleCreateRun()}
          disabled={startingRun}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Activity className="h-3.5 w-3.5" />
          {startingRun ? "Creating..." : "Create Run"}
        </button>
        <button
          onClick={() => void refreshWorkspace()}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-[11px] leading-5 text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="flex items-center gap-2">
          <RadioTower className="h-4 w-4 text-cyan-200" />
          <p className="text-xs font-semibold text-white">Latest run</p>
        </div>
        {latestRun ? (
          <div className="mt-3 space-y-1 text-[11px] text-slate-300">
            <p className="font-mono text-white">{latestRun.id}</p>
            <p>{latestRun.scenario}</p>
            <p className="uppercase tracking-[0.18em] text-slate-500">{latestRun.status}</p>
            <p>{formatTimestamp(latestRun.startedAt)}</p>
          </div>
        ) : (
          <p className="mt-3 text-[11px] leading-5 text-slate-400">No orchestrated runs yet. Sync the project, then create a run snapshot.</p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4 text-emerald-200" />
          <p className="text-xs font-semibold text-white">Presence</p>
        </div>
        <div className="mt-3 space-y-2">
          {presence.length > 0 ? (
            presence.slice(0, 4).map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-white">{member.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200">{member.status ?? "active"}</p>
                  <p className="text-[10px] text-slate-500">{formatTimestamp(member.updatedAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[11px] leading-5 text-slate-400">No collaboration entries loaded for this workspace.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-[11px] leading-5 text-slate-300">
        <p className="font-semibold text-white">{projectName}</p>
        <p className="mt-2">{projectDescription}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeDomains.map((domain) => (
            <span key={domain} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-100">
              {domain}
            </span>
          ))}
        </div>
        <p className="mt-3 text-slate-400">
          Health check: {health ? `${health.service} at ${formatTimestamp(health.date)}` : "orchestrator not reachable"}
        </p>
      </div>
    </section>
  );
}
