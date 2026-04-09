import http from "node:http";
import { URL } from "node:url";
import {
  appendTelemetry,
  createRun,
  getPresence,
  getProject,
  getTelemetry,
  listProjects,
  listRuns,
  updatePresence,
  upsertProject,
} from "./store.mjs";

const PORT = Number(process.env.SIMFORGE_ORCHESTRATOR_PORT ?? 4010);

function json(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload, null, 2));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = http.createServer(async (request, response) => {
  if (!request.url) return json(response, 400, { error: "Missing URL" });
  if (request.method === "OPTIONS") return json(response, 200, { ok: true });

  const url = new URL(request.url, `http://localhost:${PORT}`);

  if (request.method === "GET" && url.pathname === "/health") {
    return json(response, 200, {
      status: "ok",
      service: "simforge-orchestrator",
      date: new Date().toISOString(),
    });
  }

  if (request.method === "GET" && url.pathname === "/api/projects") {
    return json(response, 200, { projects: listProjects() });
  }

  if (request.method === "POST" && url.pathname === "/api/projects") {
    const body = await readBody(request);
    return json(response, 201, { project: upsertProject(body) });
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/projects/")) {
    const projectId = url.pathname.split("/").pop();
    const project = getProject(projectId);
    if (!project) return json(response, 404, { error: "Project not found" });
    return json(response, 200, { project });
  }

  if (request.method === "GET" && url.pathname === "/api/runs") {
    return json(response, 200, { runs: listRuns(url.searchParams.get("projectId")) });
  }

  if (request.method === "POST" && url.pathname === "/api/runs") {
    const body = await readBody(request);
    return json(response, 201, { run: createRun(body) });
  }

  if (request.method === "POST" && url.pathname === "/api/telemetry") {
    const body = await readBody(request);
    if (!body.runId) return json(response, 400, { error: "runId is required" });
    return json(response, 201, { sample: appendTelemetry(body.runId, body) });
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/telemetry/")) {
    const runId = url.pathname.split("/").pop();
    return json(response, 200, { runId, telemetry: getTelemetry(runId) });
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/collaboration/")) {
    const projectId = url.pathname.split("/").pop();
    return json(response, 200, { projectId, presence: getPresence(projectId) });
  }

  if (request.method === "POST" && url.pathname.startsWith("/api/presence/")) {
    const projectId = url.pathname.split("/").pop();
    const body = await readBody(request);
    return json(response, 201, { projectId, presence: updatePresence(projectId, body) });
  }

  return json(response, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`SimForge orchestrator listening on http://localhost:${PORT}`);
});
