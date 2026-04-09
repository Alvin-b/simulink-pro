# SimForge Desktop Workspace

This workspace is the next-stage native stack for high-fidelity simulation.

## Purpose

- `web studio`: engineering control plane, project graph editor, catalog browser, run launcher
- `unreal plugin`: native viewport, photoreal digital twins, HIL-ready scene execution
- `rust services`: orchestration bridge, telemetry mux, deterministic replay, transport contracts
- `python services`: AI runtime, sensor synthesis, optimization, test automation

## Layout

- `unreal/Plugins/SimForgeControlPlane`
- `rust/`
- `python/`
- `schemas/`

## Control Plane Contract

The web app owns:

- project graph authoring
- component market catalog
- code target selection
- run creation and telemetry review

The desktop stack owns:

- high-fidelity scene execution
- native asset loading
- deterministic playback
- heavy physics and graphics loops
- HIL adapters

The bridge boundary is a project/run/telemetry contract over HTTP or gRPC.
