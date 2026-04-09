# Native Workspace Split

## Objective

Separate the platform into:

- `web studio`: control plane and engineering authoring
- `desktop workspace`: native simulator for high-fidelity rendering, physics, and HIL execution

## Repos / Workspaces

1. `simulink-pro-web`
   React/TypeScript studio, orchestrator client, market catalog, run review
2. `simulink-pro-desktop`
   UE5 plugin, C++ runtime glue, Rust transport and telemetry services, Python AI/runtime services

## Immediate Native Stack

- UE5 plugin for control-plane session sync
- Rust bridge service for desktop session launch and orchestration handoff
- Rust telemetry hub for normalized replay-ready traces
- Python AI runtime for recommendations, optimization, and synthetic sensors

## Integration Direction

- Web exports normalized project graph
- Desktop loads the graph and native assets
- Native stack streams telemetry back to orchestrator
- Web remains the system of record for runs, snapshots, and collaboration state
