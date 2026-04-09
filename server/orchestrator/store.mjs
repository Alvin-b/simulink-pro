const state = {
  projects: new Map(),
  runs: new Map(),
  telemetry: new Map(),
  presence: new Map(),
};

const seedProject = {
  id: "project-simforge-lab",
  name: "Universal Engineering Lab",
  description: "Shared orchestration state for robotics, embedded, and IoT simulation.",
  activeDomains: ["robotics", "embedded", "iot"],
  updatedAt: new Date().toISOString(),
};

state.projects.set(seedProject.id, seedProject);
state.presence.set(seedProject.id, [
  { id: "u1", name: "Local Engineer", role: "engineer", status: "editing" },
  { id: "u2", name: "Systems Reviewer", role: "reviewer", status: "observing" },
]);

export function listProjects() {
  return [...state.projects.values()];
}

export function upsertProject(project) {
  const normalized = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  state.projects.set(normalized.id, normalized);
  if (!state.presence.has(normalized.id)) {
    state.presence.set(normalized.id, []);
  }
  return normalized;
}

export function getProject(projectId) {
  return state.projects.get(projectId) ?? null;
}

export function createRun(run) {
  const created = {
    id: run.id ?? `run-${Date.now()}`,
    projectId: run.projectId,
    scenario: run.scenario ?? "interactive",
    status: run.status ?? "queued",
    startedAt: new Date().toISOString(),
  };
  state.runs.set(created.id, created);
  if (!state.telemetry.has(created.id)) {
    state.telemetry.set(created.id, []);
  }
  return created;
}

export function listRuns(projectId) {
  return [...state.runs.values()].filter((run) => !projectId || run.projectId === projectId);
}

export function appendTelemetry(runId, sample) {
  const stream = state.telemetry.get(runId) ?? [];
  const record = {
    ...sample,
    time: sample.time ?? new Date().toISOString(),
  };
  stream.push(record);
  state.telemetry.set(runId, stream);
  return record;
}

export function getTelemetry(runId) {
  return state.telemetry.get(runId) ?? [];
}

export function getPresence(projectId) {
  return state.presence.get(projectId) ?? [];
}

export function updatePresence(projectId, payload) {
  const stream = state.presence.get(projectId) ?? [];
  const next = stream.filter((entry) => entry.id !== payload.id).concat({
    ...payload,
    updatedAt: new Date().toISOString(),
  });
  state.presence.set(projectId, next);
  return next;
}
