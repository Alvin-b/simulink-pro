import { DomainModuleDefinition } from "../types";

export const iotDomain: DomainModuleDefinition = {
  id: "iot",
  label: "IoT",
  summary: "Connected devices, telemetry pipelines, smart spaces, and industrial data flows.",
  defaultEnvironment: "smart-home",
  environments: ["smart-home", "smart-garden", "industrial"],
  engines: ["iot-messaging", "digital-twin-sync"],
  librarySections: [
    {
      name: "IoT Connectivity",
      icon: "radio",
      items: [
        { name: "Wi-Fi Module", description: "Network connectivity adapter", type: "wifi-module", domain: "iot", appearance: "network" },
        { name: "Zigbee Module", description: "Low power mesh communication", type: "zigbee-module", domain: "iot", appearance: "network" },
        { name: "CAN Bus MCP2515", description: "Vehicle and industrial bus interface", type: "can-bus-mcp2515", domain: "iot", appearance: "network" },
      ],
    },
    {
      name: "Smart Devices",
      icon: "globe",
      items: [
        { name: "Soil Moisture", description: "Agriculture sensing node", type: "soil-moisture", domain: "iot", appearance: "network" },
        { name: "PIR Motion", description: "Occupancy and intrusion trigger", type: "pir-sensor", domain: "iot", appearance: "network" },
        { name: "Water Level", description: "Tank and infrastructure telemetry", type: "water-level", domain: "iot", appearance: "network" },
      ],
    },
  ],
  codeTargets: [
    {
      id: "mqtt-flow",
      label: "MQTT Device Flow",
      runtime: "MQTT / WebSocket",
      language: "TypeScript",
      chipFamily: "Cloud + Edge",
      componentTypes: ["esp32-wroom", "wifi-module", "zigbee-module", "can-bus-mcp2515"],
      features: ["Topic simulation", "Cloud digital twin sync", "Rule engine hooks", "Fleet telemetry dashboards"],
      files: [
        {
          name: "telemetry.ts",
          language: "ts",
          content: `type Reading = { temperature: number; humidity: number };\n\nexport function publish(reading: Reading) {\n  console.log("publishing", reading);\n}\n`,
        },
      ],
    },
  ],
};
