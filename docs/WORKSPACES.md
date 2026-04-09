# Workspace Layout

## Current repo role

This repository now carries the control-plane and platform-contract side of SimForge.

## Added workspace boundaries

- `src/`
  Browser control plane, project authoring UI, domain modules, and platform schemas
- `server/orchestrator/`
  Lightweight local orchestration API for projects, runs, telemetry, and collaboration state
- `contracts/`
  Shared transport contracts between orchestrator and simulation engines
- `services/simforge-core-rs/`
  Rust simulation-core scaffold for engine registration and deterministic orchestration
- `services/ai-copilot-py/`
  Python AI service scaffold for code assist and diagnostics
- `services/device-runtime-py/`
  Python device runtime bridge scaffold for firmware artifacts and hardware adapters
- `native/unreal/`
  Planned Unreal Engine workspace for high-fidelity native simulation

## Practical meaning

The current browser app is no longer the whole product. It is the operator and authoring surface for a broader platform that will eventually include native rendering and specialized engine services.
