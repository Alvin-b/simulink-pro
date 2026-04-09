import { DomainModuleDefinition } from "../types";

export const roboticsDomain: DomainModuleDefinition = {
  id: "robotics",
  label: "Robotics",
  summary: "Industrial robots, mobile robots, drones, and autonomy workflows.",
  defaultEnvironment: "robotics-lab",
  environments: ["robotics-lab", "warehouse", "obstacle-course"],
  engines: ["robotics-dynamics", "navigation-stack"],
  librarySections: [
    {
      name: "Robots",
      icon: "bot",
      items: [
        { name: "2WD Smart Car", description: "Differential drive mobile robot", type: "robot-2wd-car", domain: "robotics", appearance: "3d" },
        { name: "Sumo Robot", description: "High-traction competition robot", type: "robot-sumo", domain: "robotics", appearance: "3d" },
        { name: "4-DOF Robotic Arm", description: "Bench manipulator cell", type: "robot-arm-4dof", domain: "robotics", appearance: "3d" },
        { name: "Quadcopter Drone", description: "Aerial platform with motor mixer", type: "robot-quadcopter", domain: "robotics", appearance: "3d" },
        { name: "Humanoid Robot", description: "Multi-limb balance and gait testbed", type: "robot-humanoid", domain: "robotics", appearance: "3d" },
      ],
    },
    {
      name: "Field Assets",
      icon: "boxes",
      items: [
        { name: "Wall Segment", description: "Collision and path planning barrier", type: "env-wall", domain: "robotics", appearance: "3d" },
        { name: "Ramp", description: "Traction and climbing challenge", type: "env-ramp", domain: "robotics", appearance: "3d" },
        { name: "Obstacle Block", description: "Static obstacle for testing", type: "env-obstacle", domain: "robotics", appearance: "3d" },
        { name: "Conveyor Belt", description: "Industrial cell material flow", type: "env-conveyor", domain: "robotics", appearance: "3d" },
      ],
    },
  ],
  codeTargets: [
    {
      id: "ros2-control",
      label: "ROS 2 Control Node",
      runtime: "ROS 2",
      language: "C++ / Python",
      chipFamily: "Linux / Jetson / x86",
      componentTypes: ["robot-2wd-car", "robot-arm-4dof", "robot-sumo", "robot-humanoid", "robot-quadcopter"],
      features: ["Publish/subscribe graph", "Sensor fusion hooks", "Autonomy pipeline", "Deterministic replay"],
      files: [
        {
          name: "controller.cpp",
          language: "cpp",
          content: `#include <rclcpp/rclcpp.hpp>\n\nint main(int argc, char** argv) {\n  rclcpp::init(argc, argv);\n  auto node = rclcpp::Node::make_shared("simforge_controller");\n  RCLCPP_INFO(node->get_logger(), "Controller online");\n  rclcpp::spin(node);\n  rclcpp::shutdown();\n  return 0;\n}\n`,
        },
      ],
    },
  ],
};
