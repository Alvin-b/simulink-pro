# Native Unreal Workspace

This folder is the planned home for the high-fidelity desktop simulator.

## Target responsibilities

- Photorealistic robotics cells and industrial workspaces
- Real manipulators, AMRs, drones, and equipment with USD/GLTF/CAD ingest
- Native visualization, input, cinematic review, and immersive XR
- Hardware-in-the-loop visualization attached to the Rust orchestration core

## Recommended structure

- `SimForgeNative.uproject`
- `Plugins/SimForgeBridge` for gRPC or IPC communication with the simulation core
- `Content/IndustrialAssets` for validated robot cells, fixtures, and environment kits
- `Source/SimForgeNative` for the desktop client shell and runtime bindings

The web app in this repo should remain the control plane. The Unreal workspace should become the operator-grade native simulator.
