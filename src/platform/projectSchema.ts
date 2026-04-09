import { DomainId } from "@/modules/types";

export type ProjectComponentNode = {
  id: string;
  type: string;
  domain: DomainId;
  name: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  configuration: Record<string, string | number | boolean>;
  interfaces: Record<string, { mode: string; value: number; label: string }>;
};

export type ProjectConnectionEdge = {
  id: string;
  source: { nodeId: string; interfaceId: string };
  target: { nodeId: string; interfaceId: string };
  semantics: "electrical" | "mechanical" | "network";
  color: string;
};

export type ProjectCodeArtifact = {
  id: string;
  target: string;
  language: string;
  entryFile: string;
  files: Array<{ name: string; content: string }>;
};

export type SimulationScenario = {
  id: string;
  name: string;
  environment: string;
  activeDomains: DomainId[];
  fidelityProfile: "interactive" | "engineering" | "validation";
};

export type CollaborationPresence = {
  id: string;
  name: string;
  role: "student" | "researcher" | "engineer" | "reviewer";
  color: string;
};

export type SimulationProjectDocument = {
  schemaVersion: "simforge.project/v1";
  project: {
    id: string;
    name: string;
    description: string;
    activeDomains: DomainId[];
    createdAt: string;
    updatedAt: string;
  };
  scene: {
    environment: string;
    components: ProjectComponentNode[];
    connections: ProjectConnectionEdge[];
  };
  software: {
    artifacts: ProjectCodeArtifact[];
  };
  scenarios: SimulationScenario[];
  collaboration: {
    presence: CollaborationPresence[];
  };
};

export function inferDomainFromComponentType(type: string): DomainId {
  if (type.startsWith("robot-") || type.startsWith("env-")) return "robotics";
  if (type.includes("wifi") || type.includes("zigbee") || type.includes("can-bus") || type.includes("soil") || type.includes("water")) return "iot";
  return "embedded";
}

export function buildProjectDocument(params: {
  projectId: string;
  name: string;
  description: string;
  environment: string;
  components: Array<{
    id: string;
    type: string;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    properties: Record<string, string | number | boolean>;
    pins: Record<string, { mode: string; value: number; label: string }>;
  }>;
  wires: Array<{
    id: string;
    from: { componentId: string; pinId: string };
    to: { componentId: string; pinId: string };
    color: string;
  }>;
  firmwareFiles: Array<{ name: string; content: string; target: string; language: string }>;
  activeDomains: DomainId[];
}): SimulationProjectDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: "simforge.project/v1",
    project: {
      id: params.projectId,
      name: params.name,
      description: params.description,
      activeDomains: params.activeDomains,
      createdAt: now,
      updatedAt: now,
    },
    scene: {
      environment: params.environment,
      components: params.components.map((component) => ({
        id: component.id,
        type: component.type,
        domain: inferDomainFromComponentType(component.type),
        name: component.name,
        transform: {
          position: component.position,
          rotation: component.rotation,
          scale: component.scale,
        },
        configuration: component.properties,
        interfaces: component.pins,
      })),
      connections: params.wires.map((wire) => ({
        id: wire.id,
        source: { nodeId: wire.from.componentId, interfaceId: wire.from.pinId },
        target: { nodeId: wire.to.componentId, interfaceId: wire.to.pinId },
        semantics: "electrical",
        color: wire.color,
      })),
    },
    software: {
      artifacts: params.firmwareFiles.map((file, index) => ({
        id: `${file.target}-${index}`,
        target: file.target,
        language: file.language,
        entryFile: file.name,
        files: [{ name: file.name, content: file.content }],
      })),
    },
    scenarios: [
      {
        id: "scenario-main",
        name: "Primary Validation Scenario",
        environment: params.environment,
        activeDomains: params.activeDomains,
        fidelityProfile: "interactive",
      },
    ],
    collaboration: {
      presence: [
        { id: "user-local", name: "Local Engineer", role: "engineer", color: "#34d399" },
        { id: "review-sim", name: "Simulation Reviewer", role: "reviewer", color: "#38bdf8" },
      ],
    },
  };
}
