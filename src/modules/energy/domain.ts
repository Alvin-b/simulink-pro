import { DomainModuleDefinition } from "../types";

export const energyDomain: DomainModuleDefinition = {
  id: "energy",
  label: "Energy",
  summary: "Battery systems, power electronics, renewable sources, and supervisory control.",
  defaultEnvironment: "robotics-lab",
  environments: ["robotics-lab", "warehouse"],
  engines: ["battery-model", "power-electronics", "thermal-balance"],
  librarySections: [
    {
      name: "Power Sources",
      icon: "activity",
      items: [
        { name: "3S LiPo Pack", description: "Portable DC energy source", type: "lipo-battery", domain: "energy", appearance: "board" },
        { name: "50W Solar Panel", description: "Renewable generation source", type: "solar-panel", domain: "energy", appearance: "board" },
        { name: "LM2596 Buck Converter", description: "DC conversion stage", type: "buck-converter", domain: "energy", appearance: "board" },
      ],
    },
    {
      name: "Battery Supervision",
      icon: "radio",
      items: [
        { name: "INA219 Current Sensor", description: "Current and bus voltage telemetry", type: "ina219-current", domain: "energy", appearance: "board" },
        { name: "16S BMS", description: "Battery management controller", type: "battery-bms-16s", domain: "energy", appearance: "board" },
        { name: "TP4056 Charger", description: "Single-cell charging stage", type: "tp4056-charger", domain: "energy", appearance: "board" },
      ],
    },
  ],
  codeTargets: [
    {
      id: "battery-supervisor",
      label: "Battery Supervisor",
      runtime: "Python telemetry and fault supervision",
      language: "Python",
      chipFamily: "Linux / edge service",
      componentTypes: ["battery-bms-16s", "ina219-current", "tp4056-charger"],
      features: ["Cell balancing logic", "Fault inference", "Pack telemetry", "Run history export"],
      files: [],
    },
  ],
};
