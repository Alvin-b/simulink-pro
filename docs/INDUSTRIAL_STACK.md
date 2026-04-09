# Industrial Stack Direction

This repository is still a web-based control-plane and authoring prototype. For a real enterprise-grade simulation product, the target stack should be split into distinct layers:

## Native Simulation Layer

- Unreal Engine 5 for high-fidelity desktop visualization, robotics cells, and photorealistic digital twin environments
- Native C++ plugins for physics integration, CAD ingest, robotics assets, and hardware-in-the-loop connectors
- Optional NVIDIA Omniverse or USD interoperability for asset pipelines and enterprise scene exchange

## Simulation Core

- Rust or C++ orchestration services for deterministic time synchronization across engines
- Specialized adapters for robotics dynamics, firmware execution, IoT messaging, and energy-domain models
- gRPC interfaces between the orchestration layer and native engines

## AI and Automation Layer

- Python services for design copilots, code generation, anomaly detection, optimization loops, and experiment analysis
- Model gateway supporting proprietary and open-weight models depending deployment constraints
- Retrieval pipeline for project docs, runtime traces, component libraries, and debugging knowledge

## Control Plane

- React and TypeScript for the browser authoring surface, collaboration workflows, and project management
- Node or Rust APIs for project lifecycle, telemetry ingestion, review sessions, and access control
- PostgreSQL plus object storage for project state, assets, and replay traces

## CAD and Engineering Interop

- STEP, GLTF, USD, and URDF ingest pipelines
- Connectors for MCAD, ECAD, and industrial automation data sources
- Validation runners for design reviews, pre-project feasibility studies, and regression simulation

The current repo now better represents the control-plane side of this architecture. It is not yet the complete native simulation product, and it should not be marketed internally as if it already replaces mature engineering suites.
