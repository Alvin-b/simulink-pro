import { DomainModuleDefinition } from "../types";

export const aerospaceDomain: DomainModuleDefinition = {
  id: "aerospace",
  label: "Aerospace",
  summary: "UAVs, guidance, avionics, mission rehearsal, and flight-control simulation.",
  defaultEnvironment: "obstacle-course",
  environments: ["obstacle-course", "warehouse"],
  engines: ["flight-dynamics", "guidance-navigation-control"],
  librarySections: [
    {
      name: "Aircraft & Flight Systems",
      icon: "bot",
      items: [
        { name: "450-class Quadcopter", description: "Baseline UAV platform for mission and control testing", type: "robot-quadcopter", domain: "aerospace", appearance: "3d" },
        { name: "Pixhawk Flight Controller", description: "Autopilot control stack target", type: "flight-controller-pixhawk", domain: "aerospace", appearance: "board" },
        { name: "Navigation-Grade IMU", description: "Higher-fidelity inertial sensing source", type: "imu-nav-grade", domain: "aerospace", appearance: "board" },
      ],
    },
    {
      name: "Aerospace Sensors",
      icon: "activity",
      items: [
        { name: "BMP280 Barometer", description: "Altitude and pressure telemetry", type: "bmp280", domain: "aerospace", appearance: "board" },
        { name: "NEO-6M GPS", description: "Position and navigation fix input", type: "gps-neo6m", domain: "aerospace", appearance: "board" },
        { name: "MPU-6050 IMU", description: "Inertial source for drones and guidance", type: "mpu6050", domain: "aerospace", appearance: "board" },
      ],
    },
  ],
  codeTargets: [
    {
      id: "uav-autopilot",
      label: "UAV Autopilot",
      runtime: "PX4 / custom flight-control runtime",
      language: "C++",
      chipFamily: "STM32 / Pixhawk / ARM",
      componentTypes: ["robot-quadcopter", "flight-controller-pixhawk"],
      features: ["Motor mixing", "Attitude stabilization", "Navigation hooks", "Flight telemetry replay"],
      files: [],
    },
  ],
};
