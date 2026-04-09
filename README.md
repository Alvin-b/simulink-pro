# SimForge Platform Blueprint

This repository now has two distinct concerns:

- `/` presents the platform blueprint for a universal engineering simulation system.
- `/studio` preserves the current interactive simulator prototype already in the project.
- `server/orchestrator/server.mjs` provides a lightweight orchestration backend for projects, runs, telemetry, and collaboration state.

## Product Direction

The target system is a universal engineering simulation platform that can cover:

- Robotics and autonomy
- IoT and connected systems
- Aerospace and drone simulation
- Electronics and embedded development
- Power, batteries, and smart energy systems
- AI-assisted design, control, and optimization

The correct architecture is not a single giant simulator. It should be a modular platform with:

- A shared authoring model
- Multiple domain-specific simulation engines
- Deterministic orchestration across time-stepped runtimes
- Embedded software execution inside the simulation loop
- Real-time collaboration and review workflows
- Enterprise telemetry, analytics, and governance

## Recommended System Architecture

1. Experience layer
   Desktop, web, and XR clients for 3D editing, circuit design, firmware authoring, analytics, and collaboration.
2. Domain studio layer
   Dedicated workflows for robotics, drones, IoT, electronics, and energy that all write to a common project model.
3. Orchestration layer
   Scenario scheduling, time synchronization, replay, distributed jobs, and regression testing.
4. Physics/runtime layer
   Independent engines for rigid body physics, circuit solving, flight dynamics, orbital mechanics, and energy models.
5. Device/software layer
   Firmware runtimes, ROS/ROS 2, MQTT, OPC UA, mobile connectors, and hardware-in-the-loop interfaces.
6. Data/intelligence layer
   Telemetry storage, optimization, AI design assistance, experiment tracking, and asset versioning.

## Delivery Strategy

1. Start with a robotics plus embedded MVP.
2. Add collaboration, IoT integration, and cloud scenario execution.
3. Expand to aerospace and energy-specific simulation adapters.
4. Add enterprise governance, validation suites, and AI-native tooling.

## Current Frontend Status

The current codebase already contains simulation-oriented UI pieces such as:

- 3D viewport components
- Component libraries
- Firmware editing
- ROS and Arduino-related hooks

Those pieces are still prototype-grade, but the repo now also includes:

- A normalized project schema in [src/platform/projectSchema.ts](src/platform/projectSchema.ts)
- A seeded market component catalog in [src/platform/componentCatalog.ts](src/platform/componentCatalog.ts)
- Firmware/runtime profile definitions in [src/platform/firmwareProfiles.ts](src/platform/firmwareProfiles.ts)
- Plugin and engine contracts in [src/platform/pluginSystem.ts](src/platform/pluginSystem.ts)
- Domain modules for robotics, embedded, and IoT in [src/modules](src/modules)
- A student-oriented electronics workbench and AI copilot panel in the studio UI
- A local orchestration service runnable via `npm run orchestrator`
- Rust and Python service scaffolds under [services](services)
- Shared engine transport contracts under [contracts](contracts)
- A native Unreal workspace plan under [native/unreal](native/unreal)

For the industrial target architecture, see [docs/INDUSTRIAL_STACK.md](docs/INDUSTRIAL_STACK.md).

## Polyglot Runtime Direction

This project should not stay as a browser-only TypeScript simulator. The stronger architecture is intentionally polyglot:

- TypeScript/React for the studio, authoring tools, and interactive visualization.
- Rust in [services/simforge-core-rs](services/simforge-core-rs) for deterministic run planning, engine cataloging, and orchestration-critical logic.
- Python in [services/ai-copilot-py](services/ai-copilot-py) for diagnostics, design assistance, and graph-aware recommendations.
- Python in [services/device-runtime-py](services/device-runtime-py) for runtime artifact validation, compatibility checks, and device binding preparation.
- Protobuf contracts in [contracts/engine-api.proto](contracts/engine-api.proto) to keep orchestration and engine boundaries explicit.

### Current Service Roles

1. `simforge-core-rs`
   Runs as an HTTP service on port `4041`, exposes `/engines`, `/plan`, and `/health`, and owns deterministic execution planning.
2. `simforge-ai-copilot`
   Runs as an HTTP service on port `4042` and provides `/suggest`, `/diagnose`, and `/health`.
3. `simforge-device-runtime`
   Runs as an HTTP service on port `4043` and provides `/artifacts/register`, `/artifacts/validate`, `/runs/prepare`, and `/health`.

## Service-Wired Studio

The React studio is now wired to the backend services:

- The code workspace uses the Rust core and Python device runtime to validate artifacts, synthesize execution plans, and prepare runtime bindings.
- The AI copilot panel uses the Python copilot service for graph-aware recommendations and diagnosis.
- The workspace control panel shows health for the orchestrator, Rust core, and Python services.

## Multi-Service Stack

Run the full system with Docker Compose:

```bash
npm run stack:up
```

Service endpoints:

- Studio: `http://localhost:8080`
- Orchestrator: `http://localhost:4010`
- Rust core: `http://localhost:4041`
- AI copilot: `http://localhost:4042`
- Device runtime: `http://localhost:4043`

Stop the stack with:

```bash
npm run stack:down
```

### Why This Matters

Engineering software benefits from using different languages for different constraints:

- Deterministic orchestration and strongly modeled execution paths belong in Rust.
- Analysis, diagnostics, and workflow intelligence are efficient to express in Python.
- Highly interactive studio UX still belongs in TypeScript.

That is the direction this repository is now taking. The frontend is the operator surface, not the entire system.
