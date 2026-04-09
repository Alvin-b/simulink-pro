import { DomainModuleDefinition } from "../types";

export const industrialDomain: DomainModuleDefinition = {
  id: "industrial",
  label: "Industrial",
  summary: "Automation cells, motion systems, field devices, and process-control integrations.",
  defaultEnvironment: "warehouse",
  environments: ["warehouse", "robotics-lab"],
  engines: ["plc-logic", "fieldbus", "motion-control"],
  librarySections: [
    {
      name: "Industrial Motion",
      icon: "boxes",
      items: [
        { name: "NEMA 17 Stepper", description: "Precision motion axis", type: "nema17-stepper", domain: "industrial", appearance: "3d" },
        { name: "A4988 Driver", description: "Stepper driver stage", type: "a4988-driver", domain: "industrial", appearance: "board" },
        { name: "100 mm Linear Actuator", description: "Linear motion for clamps and feeders", type: "linear-actuator", domain: "industrial", appearance: "3d" },
      ],
    },
    {
      name: "Field Devices",
      icon: "globe",
      items: [
        { name: "MCP2515 CAN Module", description: "Industrial and vehicle bus interface", type: "can-bus-mcp2515", domain: "industrial", appearance: "network" },
        { name: "Solenoid Valve", description: "Fluid control output stage", type: "solenoid-valve", domain: "industrial", appearance: "3d" },
        { name: "Water Level Sensor", description: "Tank process telemetry", type: "water-level", domain: "industrial", appearance: "board" },
      ],
    },
  ],
  codeTargets: [
    {
      id: "industrial-gateway",
      label: "Industrial Gateway",
      runtime: "CAN and process telemetry bridge",
      language: "TypeScript",
      chipFamily: "ARM / x86 edge",
      componentTypes: ["can-bus-mcp2515", "water-level", "solenoid-valve", "linear-actuator"],
      features: ["Protocol normalization", "Alarm rules", "Telemetry bridge", "Process snapshots"],
      files: [],
    },
  ],
};
