import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * ─── Hyper-Realistic Component Models ────────────────────────
 * 
 * Market-accurate 3D models based on manufacturer datasheets.
 * Each component is rendered with precise dimensions, colors, and details.
 */

// ─── ESP32-WROOM-32 ─────────────────────────────────────────

export function HyperRealisticESP32({ component }: { component: any }) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={component.position} rotation={component.rotation} scale={component.scale}>
      {/* PCB (18mm x 25.5mm x 3.1mm) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.018, 0.0255, 0.0031]} />
        <meshStandardMaterial color="#1a472a" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* RF Shield (metal, top-left) */}
      <mesh position={[-0.004, 0.008, 0.003]}>
        <boxGeometry args={[0.008, 0.012, 0.002]} />
        <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Antenna cutout (visual) */}
      <mesh position={[0.006, 0.010, 0.002]}>
        <boxGeometry args={[0.003, 0.004, 0.001]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* USB Micro Port (bottom) */}
      <mesh position={[0, -0.013, 0.001]}>
        <boxGeometry args={[0.006, 0.002, 0.0015]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* EN Button */}
      <mesh position={[-0.007, -0.008, 0.003]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.001, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* BOOT Button */}
      <mesh position={[0.007, -0.008, 0.003]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.001, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* 38 Pins (1.27mm pitch, 19 on each side) */}
      {/* Left side pins (GND, IO35, IO34, IO39, IO36, IO23, IO22, IO1, IO3, IO16, IO17, IO9, IO10, IO11, IO6, IO7, IO8, IO19, IO20) */}
      {Array.from({ length: 19 }).map((_, i) => (
        <group key={`left-${i}`}>
          {/* Pin body */}
          <mesh position={[-0.0095, -0.0127 + i * 0.00268, -0.002]}>
            <boxGeometry args={[0.0005, 0.0005, 0.004]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
          </mesh>
          {/* Pin label (text would go here) */}
        </group>
      ))}

      {/* Right side pins (3V3, EN, IO32, IO33, IO25, IO26, IO27, IO14, IO12, IO13, IO15, IO2, IO4, IO5, IO18, IO21, IO0, GND, GND) */}
      {Array.from({ length: 19 }).map((_, i) => (
        <mesh key={`right-${i}`} position={[0.0095, -0.0127 + i * 0.00268, -0.002]}>
          <boxGeometry args={[0.0005, 0.0005, 0.004]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} />
        </mesh>
      ))}

      {/* Espressif Logo (text) */}
      <mesh position={[0, 0.002, 0.0016]}>
        <planeGeometry args={[0.008, 0.003]} />
        <meshStandardMaterial color="#ffffff" emissive="#cccccc" />
      </mesh>
    </group>
  );
}

// ─── Arduino Uno R3 ─────────────────────────────────────────

export function HyperRealisticArduinoUno({ component }: { component: any }) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={component.position} rotation={component.rotation} scale={component.scale}>
      {/* PCB (68.6mm x 53.4mm) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.0686, 0.0534, 0.002]} />
        <meshStandardMaterial color="#0066cc" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* ATmega328P DIP-28 Chip (center) */}
      <mesh position={[0, 0, 0.003]}>
        <boxGeometry args={[0.015, 0.009, 0.003]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* USB-B Port (left side, bottom) */}
      <mesh position={[-0.025, -0.020, 0.003]}>
        <boxGeometry args={[0.012, 0.008, 0.006]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Power Jack (left side, middle) */}
      <mesh position={[-0.025, -0.005, 0.003]}>
        <cylinderGeometry args={[0.005, 0.005, 0.008, 32]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Reset Button (top-right) */}
      <mesh position={[0.020, 0.020, 0.004]}>
        <cylinderGeometry args={[0.003, 0.003, 0.002, 16]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>

      {/* Crystal Oscillator (16 MHz) */}
      <mesh position={[0.010, 0.005, 0.003]}>
        <boxGeometry args={[0.008, 0.005, 0.003]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>

      {/* Digital Pins (D0-D13) - Right side */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`digital-${i}`} position={[0.030, 0.015 - i * 0.0035, 0.001]}>
          <boxGeometry args={[0.002, 0.0015, 0.003]} />
          <meshStandardMaterial color="#ffcc00" metalness={0.8} />
        </mesh>
      ))}

      {/* Analog Pins (A0-A5) - Right side, below digital */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`analog-${i}`} position={[0.030, -0.035 - i * 0.0035, 0.001]}>
          <boxGeometry args={[0.002, 0.0015, 0.003]} />
          <meshStandardMaterial color="#ffcc00" metalness={0.8} />
        </mesh>
      ))}

      {/* Power Pins (5V, 3V3, GND) - Left side */}
      {["5V", "GND", "3V3"].map((label, i) => (
        <mesh key={label} position={[-0.030, 0.015 - i * 0.0035, 0.001]}>
          <boxGeometry args={[0.002, 0.0015, 0.003]} />
          <meshStandardMaterial color={label === "5V" ? "#ff0000" : label === "GND" ? "#000000" : "#ff6600"} metalness={0.8} />
        </mesh>
      ))}

      {/* ICSP Header (6-pin, top-right) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`icsp-${i}`} position={[0.020, 0.025 + (i % 2) * 0.003, 0.001]}>
          <boxGeometry args={[0.0015, 0.0015, 0.003]} />
          <meshStandardMaterial color="#ffcc00" metalness={0.8} />
        </mesh>
      ))}

      {/* Arduino Logo */}
      <mesh position={[0, 0.010, 0.0025]}>
        <planeGeometry args={[0.020, 0.010]} />
        <meshStandardMaterial color="#ffffff" emissive="#0066cc" />
      </mesh>
    </group>
  );
}

// ─── SG90 Micro Servo ──────────────────────────────────────

export function HyperRealisticSG90({ component }: { component: any }) {
  const groupRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (shaftRef.current) {
      const angle = (component.properties.angle ?? 90) * (Math.PI / 180);
      shaftRef.current.rotation.z = angle;
    }
  });

  return (
    <group ref={groupRef} position={component.position} rotation={component.rotation} scale={component.scale}>
      {/* Main body (translucent blue plastic) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.0222, 0.0118, 0.0227]} />
        <meshStandardMaterial color="#4488ff" transparent opacity={0.8} roughness={0.5} />
      </mesh>

      {/* Gear housing (darker blue, top) */}
      <mesh position={[0, 0.010, 0]}>
        <boxGeometry args={[0.018, 0.008, 0.015]} />
        <meshStandardMaterial color="#2255cc" roughness={0.6} />
      </mesh>

      {/* Output shaft */}
      <mesh ref={shaftRef} position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.008, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.9} />
      </mesh>

      {/* Servo horn (plastic, attached to shaft) */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[0.012, 0.002, 0.004]} />
        <meshStandardMaterial color="#2255cc" />
      </mesh>

      {/* 3-wire cable connector (bottom) */}
      {/* Orange (Signal) */}
      <mesh position={[-0.005, -0.012, 0]}>
        <cylinderGeometry args={[0.0008, 0.0008, 0.003, 8]} />
        <meshStandardMaterial color="#ff8800" />
      </mesh>
      {/* Red (VCC) */}
      <mesh position={[0, -0.012, 0]}>
        <cylinderGeometry args={[0.0008, 0.0008, 0.003, 8]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      {/* Brown (GND) */}
      <mesh position={[0.005, -0.012, 0]}>
        <cylinderGeometry args={[0.0008, 0.0008, 0.003, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Mounting bracket (plastic) */}
      <mesh position={[0, -0.008, -0.010]}>
        <boxGeometry args={[0.020, 0.003, 0.004]} />
        <meshStandardMaterial color="#2255cc" />
      </mesh>
    </group>
  );
}

// ─── MG996R High-Torque Servo ──────────────────────────────

export function HyperRealisticMG996R({ component }: { component: any }) {
  const groupRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (shaftRef.current) {
      const angle = (component.properties.angle ?? 90) * (Math.PI / 180);
      shaftRef.current.rotation.z = angle;
    }
  });

  return (
    <group ref={groupRef} position={component.position} rotation={component.rotation} scale={component.scale}>
      {/* Main body (black plastic, larger) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.0407, 0.0197, 0.0429]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>

      {/* Metal gear housing (top, silver) */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[0.035, 0.012, 0.025]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Output shaft (metal) */}
      <mesh ref={shaftRef} position={[0, 0.018, 0]}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.010, 16]} />
        <meshStandardMaterial color="#555555" metalness={0.9} />
      </mesh>

      {/* Servo horn (metal, larger) */}
      <mesh position={[0, 0.022, 0]}>
        <boxGeometry args={[0.018, 0.003, 0.006]} />
        <meshStandardMaterial color="#555555" metalness={0.8} />
      </mesh>

      {/* 3-wire cable connector (bottom) */}
      {/* Orange (Signal) */}
      <mesh position={[-0.006, -0.015, 0]}>
        <cylinderGeometry args={[0.001, 0.001, 0.004, 8]} />
        <meshStandardMaterial color="#ff8800" />
      </mesh>
      {/* Red (VCC) */}
      <mesh position={[0, -0.015, 0]}>
        <cylinderGeometry args={[0.001, 0.001, 0.004, 8]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      {/* Brown (GND) */}
      <mesh position={[0.006, -0.015, 0]}>
        <cylinderGeometry args={[0.001, 0.001, 0.004, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Dual mounting flanges (metal, sides) */}
      <mesh position={[-0.018, 0.008, 0]}>
        <boxGeometry args={[0.004, 0.010, 0.020]} />
        <meshStandardMaterial color="#888888" metalness={0.8} />
      </mesh>
      <mesh position={[0.018, 0.008, 0]}>
        <boxGeometry args={[0.004, 0.010, 0.020]} />
        <meshStandardMaterial color="#888888" metalness={0.8} />
      </mesh>
    </group>
  );
}

// ─── DC Motor (TT Gear Motor) ──────────────────────────────

export function HyperRealisticDCMotor({ component }: { component: any }) {
  const groupRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (shaftRef.current && (component.properties.rpm ?? 0) !== 0) {
      shaftRef.current.rotation.z += (component.properties.rpm ?? 0) * 0.001;
    }
  });

  return (
    <group ref={groupRef} position={component.position} rotation={component.rotation} scale={component.scale}>
      {/* Motor body (blue cylinder) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.030, 32]} />
        <meshStandardMaterial color="#0066cc" roughness={0.5} />
      </mesh>

      {/* Gearbox (silver, bottom) */}
      <mesh position={[0, -0.020, 0]}>
        <boxGeometry args={[0.020, 0.015, 0.020]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Output shaft (metal) */}
      <mesh ref={shaftRef} position={[0, -0.028, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.008, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.9} />
      </mesh>

      {/* Terminal wires (bottom) */}
      {/* Positive (red) */}
      <mesh position={[-0.008, -0.032, 0]}>
        <cylinderGeometry args={[0.001, 0.001, 0.004, 8]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      {/* Negative (black) */}
      <mesh position={[0.008, -0.032, 0]}>
        <cylinderGeometry args={[0.001, 0.001, 0.004, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Mounting holes (visual) */}
      {[[-0.010, -0.025], [0.010, -0.025]].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], 0]}>
          <cylinderGeometry args={[0.002, 0.002, 0.002, 16]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      ))}
    </group>
  );
}

// ─── L298N H-Bridge Driver ────────────────────────────────

export function HyperRealisticL298N({ component }: { component: any }) {
  return (
    <group position={component.position} rotation={component.rotation} scale={component.scale}>
      {/* Red PCB */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.040, 0.025, 0.002]} />
        <meshStandardMaterial color="#cc0000" roughness={0.4} />
      </mesh>

      {/* Large black IC chip (L298N) */}
      <mesh position={[0.005, 0.003, 0.003]}>
        <boxGeometry args={[0.018, 0.015, 0.004]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Heat sink fins (metal) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0.008 + i * 0.002, 0.003, 0.004]}>
          <boxGeometry args={[0.001, 0.015, 0.003]} />
          <meshStandardMaterial color="#888888" metalness={0.9} />
        </mesh>
      ))}

      {/* Screw terminals (motor outputs) */}
      {["OUT1", "OUT2", "OUT3", "OUT4"].map((label, i) => (
        <mesh key={label} position={[-0.015, 0.010 - i * 0.008, 0.001]}>
          <boxGeometry args={[0.004, 0.003, 0.002]} />
          <meshStandardMaterial color="#ffcc00" metalness={0.8} />
        </mesh>
      ))}

      {/* Power input terminals */}
      {["12V", "GND", "5V"].map((label, i) => (
        <mesh key={label} position={[0.015, 0.010 - i * 0.005, 0.001]}>
          <boxGeometry args={[0.003, 0.002, 0.002]} />
          <meshStandardMaterial color={label === "12V" ? "#ff0000" : "#000000"} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Humanoid Robot (17-DOF) ──────────────────────────────

export function HyperRealisticHumanoid({ component }: { component: any }) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={component.position} rotation={component.rotation} scale={component.scale}>
      {/* Head (1 DOF: pan) */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="#ffdbac" roughness={0.6} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.10, 0]}>
        <boxGeometry args={[0.040, 0.060, 0.030]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* Left Arm (3 DOF: shoulder, elbow, wrist) */}
      {/* Shoulder */}
      <mesh position={[-0.030, 0.12, 0]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      {/* Upper arm */}
      <mesh position={[-0.045, 0.10, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.035, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Elbow */}
      <mesh position={[-0.055, 0.08, 0]}>
        <sphereGeometry args={[0.007, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      {/* Forearm */}
      <mesh position={[-0.065, 0.06, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.030, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Wrist */}
      <mesh position={[-0.070, 0.045, 0]}>
        <sphereGeometry args={[0.006, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      {/* Hand */}
      <mesh position={[-0.070, 0.030, 0]}>
        <boxGeometry args={[0.010, 0.015, 0.008]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Right Arm (mirror of left) */}
      <mesh position={[0.030, 0.12, 0]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[0.045, 0.10, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.035, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.055, 0.08, 0]}>
        <sphereGeometry args={[0.007, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[0.065, 0.06, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.030, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.070, 0.045, 0]}>
        <sphereGeometry args={[0.006, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[0.070, 0.030, 0]}>
        <boxGeometry args={[0.010, 0.015, 0.008]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Left Leg (5 DOF: hip yaw, hip pitch, knee, ankle pitch, ankle roll) */}
      <mesh position={[-0.015, 0.065, 0]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[-0.015, 0.040, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.045, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[-0.015, 0.018, 0]}>
        <sphereGeometry args={[0.007, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[-0.015, -0.010, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.050, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[-0.015, -0.040, 0]}>
        <sphereGeometry args={[0.006, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[-0.015, -0.055, 0]}>
        <boxGeometry args={[0.015, 0.010, 0.020]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Right Leg (mirror of left) */}
      <mesh position={[0.015, 0.065, 0]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[0.015, 0.040, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.045, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.015, 0.018, 0]}>
        <sphereGeometry args={[0.007, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[0.015, -0.010, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.050, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.015, -0.040, 0]}>
        <sphereGeometry args={[0.006, 12, 12]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
      <mesh position={[0.015, -0.055, 0]}>
        <boxGeometry args={[0.015, 0.010, 0.020]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

// ─── F450 Quadcopter ──────────────────────────────────────

export function HyperRealisticF450({ component }: { component: any }) {
  const groupRef = useRef<THREE.Group>(null);
  const propellerRefs = useRef<THREE.Mesh[]>([]);

  useFrame(() => {
    // Spin propellers based on throttle
    const throttle = component.properties.throttle ?? 0;
    propellerRefs.current.forEach((prop) => {
      if (prop) prop.rotation.z += throttle * 0.5;
    });
  });

  return (
    <group ref={groupRef} position={component.position} rotation={component.rotation} scale={component.scale}>
      {/* X-Frame (aluminum arms) */}
      {/* Front-right arm */}
      <mesh position={[0.225, 0, 0]}>
        <boxGeometry args={[0.450, 0.010, 0.008]} />
        <meshStandardMaterial color="#ff0000" roughness={0.4} />
      </mesh>
      {/* Front-left arm */}
      <mesh position={[0, 0.225, 0]}>
        <boxGeometry args={[0.010, 0.450, 0.008]} />
        <meshStandardMaterial color="#ff0000" roughness={0.4} />
      </mesh>
      {/* Back-right arm */}
      <mesh position={[-0.225, 0, 0]}>
        <boxGeometry args={[0.450, 0.010, 0.008]} />
        <meshStandardMaterial color="#ff0000" roughness={0.4} />
      </mesh>
      {/* Back-left arm */}
      <mesh position={[0, -0.225, 0]}>
        <boxGeometry args={[0.010, 0.450, 0.008]} />
        <meshStandardMaterial color="#ff0000" roughness={0.4} />
      </mesh>

      {/* Central Flight Controller */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.050, 0.050, 0.015]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* 4 Brushless Motors + Propellers */}
      {[
        { pos: [0.225, 0.225, 0], name: "FR" },
        { pos: [-0.225, 0.225, 0], name: "FL" },
        { pos: [-0.225, -0.225, 0], name: "BL" },
        { pos: [0.225, -0.225, 0], name: "BR" },
      ].map((motor, i) => (
        <group key={motor.name} position={[motor.pos[0], motor.pos[1], motor.pos[2]]}>
          {/* Motor body */}
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.025, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          {/* Propeller (10-inch) */}
          <mesh
            ref={(el) => {
              if (el) propellerRefs.current[i] = el;
            }}
            position={[0, 0.015, 0]}
          >
            <boxGeometry args={[0.250, 0.005, 0.010]} />
            <meshStandardMaterial color="#cccccc" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Landing Legs */}
      {[
        [-0.100, 0.100, -0.050],
        [0.100, 0.100, -0.050],
        [-0.100, -0.100, -0.050],
        [0.100, -0.100, -0.050],
      ].map((leg, i) => (
        <mesh key={i} position={leg}>
          <cylinderGeometry args={[0.004, 0.004, 0.080, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      ))}
    </group>
  );
}
