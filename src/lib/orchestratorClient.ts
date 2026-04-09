export type OrchestratorHealth = {
  status: string;
  service: string;
  date: string;
};

export type OrchestratorProject = {
  id: string;
  name: string;
  description?: string;
  activeDomains?: string[];
  updatedAt?: string;
  componentCount?: number;
  connectionCount?: number;
  scenarioCount?: number;
};

export type OrchestratorRun = {
  id: string;
  projectId: string;
  scenario: string;
  status: string;
  startedAt: string;
};

export type OrchestratorPresence = {
  id: string;
  name: string;
  role: string;
  status?: string;
  updatedAt?: string;
};

export type OrchestratorTelemetrySample = {
  runId: string;
  type?: string;
  time?: string;
  payload?: Record<string, unknown>;
};

const DEFAULT_ORCHESTRATOR_URL = "http://localhost:4010";

export function getOrchestratorBaseUrl() {
  return (import.meta.env.VITE_ORCHESTRATOR_URL ?? DEFAULT_ORCHESTRATOR_URL).replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getOrchestratorBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getHealth() {
  return request<OrchestratorHealth>("/health");
}

export async function listProjects() {
  const response = await request<{ projects: OrchestratorProject[] }>("/api/projects");
  return response.projects;
}

export async function upsertProject(project: OrchestratorProject) {
  const response = await request<{ project: OrchestratorProject }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
  return response.project;
}

export async function listRuns(projectId: string) {
  const response = await request<{ runs: OrchestratorRun[] }>(`/api/runs?projectId=${encodeURIComponent(projectId)}`);
  return response.runs;
}

export async function createRun(run: Pick<OrchestratorRun, "projectId" | "scenario" | "status">) {
  const response = await request<{ run: OrchestratorRun }>("/api/runs", {
    method: "POST",
    body: JSON.stringify(run),
  });
  return response.run;
}

export async function listPresence(projectId: string) {
  const response = await request<{ projectId: string; presence: OrchestratorPresence[] }>(
    `/api/collaboration/${encodeURIComponent(projectId)}`,
  );
  return response.presence;
}

export async function updatePresence(projectId: string, presence: OrchestratorPresence) {
  const response = await request<{ projectId: string; presence: OrchestratorPresence[] }>(
    `/api/presence/${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: JSON.stringify(presence),
    },
  );
  return response.presence;
}

export async function appendTelemetry(sample: OrchestratorTelemetrySample) {
  const response = await request<{ sample: OrchestratorTelemetrySample }>("/api/telemetry", {
    method: "POST",
    body: JSON.stringify(sample),
  });
  return response.sample;
}
