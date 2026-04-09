export type ServiceHealth = {
  status: string;
  service: string;
  date?: string;
};

export type EngineDescriptor = {
  id: string;
  domain: string;
  fidelity: string;
  capabilities: string[];
  deterministic: boolean;
};

export type EngineRunPlan = {
  project_id: string;
  scenario: string;
  fidelity_profile: string;
  engine_sequence: Array<{ phase: string; engine: string; budget_ms: number }>;
  telemetry_channels: Array<{ id: string; semantic: string; sample_rate_hz: number }>;
  warnings: string[];
  graph_density: number;
  orchestration_tick_hz: number;
};

export type CopilotSuggestReply = {
  summary: string;
  actions: string[];
  risks: string[];
  suggested_artifacts: string[];
};

export type CopilotDiagnoseReply = {
  diagnosis: string;
  bottlenecks: string[];
  next_experiments: string[];
};

export type RuntimeValidationReply = {
  status: string;
  compatible: boolean;
  checks: string[];
  warnings: string[];
};

export type RuntimePrepareReply = {
  project_id: string;
  target: string;
  scenario: string;
  board: string;
  bindings: Array<{ interface: string; transport: string }>;
  status: string;
};

const DEFAULT_CORE_URL = "http://localhost:4041";
const DEFAULT_COPILOT_URL = "http://localhost:4042";
const DEFAULT_DEVICE_RUNTIME_URL = "http://localhost:4043";

function normalize(url: string) {
  return url.replace(/\/$/, "");
}

export function getCoreBaseUrl() {
  return normalize(import.meta.env.VITE_ENGINE_CORE_URL ?? DEFAULT_CORE_URL);
}

export function getCopilotBaseUrl() {
  return normalize(import.meta.env.VITE_COPILOT_URL ?? DEFAULT_COPILOT_URL);
}

export function getDeviceRuntimeBaseUrl() {
  return normalize(import.meta.env.VITE_DEVICE_RUNTIME_URL ?? DEFAULT_DEVICE_RUNTIME_URL);
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
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

export function getCoreHealth() {
  return request<ServiceHealth>(getCoreBaseUrl(), "/health");
}

export function listEngines() {
  return request<EngineDescriptor[]>(getCoreBaseUrl(), "/engines");
}

export function planRun(payload: {
  project_id: string;
  scenario?: string;
  active_domains: string[];
  components: Array<{ id: string; component_type: string }>;
  connections: Array<{ source: { node_id: string }; target: { node_id: string } }>;
}) {
  return request<EngineRunPlan>(getCoreBaseUrl(), "/plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCopilotHealth() {
  return request<ServiceHealth>(getCopilotBaseUrl(), "/health");
}

export function suggestWorkflow(payload: {
  project_name: string;
  component_type?: string | null;
  target_runtime: string;
  active_domains: string[];
  component_types: string[];
  telemetry_channels: string[];
}) {
  return request<CopilotSuggestReply>(getCopilotBaseUrl(), "/suggest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function diagnoseWorkflow(payload: {
  project_name: string;
  target_runtime: string;
  component_types: string[];
  active_domains: string[];
  telemetry_channels: string[];
  recent_console: string[];
}) {
  return request<CopilotDiagnoseReply>(getCopilotBaseUrl(), "/diagnose", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDeviceRuntimeHealth() {
  return request<ServiceHealth>(getDeviceRuntimeBaseUrl(), "/health");
}

export function validateArtifact(payload: {
  board: string;
  target: string;
  language: string;
  entry_file: string;
  interfaces: string[];
  resource_profile: string;
}) {
  return request<RuntimeValidationReply>(getDeviceRuntimeBaseUrl(), "/artifacts/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function prepareRuntimeRun(payload: {
  project_id: string;
  target: string;
  board: string;
  interfaces: string[];
  scenario?: string;
}) {
  return request<RuntimePrepareReply>(getDeviceRuntimeBaseUrl(), "/runs/prepare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
