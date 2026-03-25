/**
 * RealisticModels.tsx
 * High-fidelity 3D models for SimForge components.
 * Every model is built to scale, with proper materials,
 * real geometry (not just boxes), and physical accuracy.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Cylinder, Box, Sphere, Torus, Cone } from "@react-three/drei";
import { RigidBody, CuboidCollider, BallCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";

// ─── Shared materials ───────────────────────────────────────

const MAT = {
  pcbGreen:   new THREE.MeshStandardMaterial({ color: "#0a5c2e", roughness: 0.55, metalness: 0.05 }),
  pcbBlue:    new THREE.MeshStandardMaterial({ color: "#0a1a3a", roughness: 0.5,  metalness: 0.08 }),
  pcbRed:     new THREE.MeshStandardMaterial({ color: "#cc2222", roughness: 0.5,  metalness: 0.05 }),
  chipBlack:  new THREE.MeshStandardMaterial({ color: "#111111", roughness: 0.2,  metalness: 0.1  }),
  metalShield:new THREE.MeshStandardMaterial({ color: "#b8b8b8", roughness: 0.08, metalness: 0.95 }),
  gold:       new THREE.MeshStandardMaterial({ color: "#d4a017", roughness: 0.1,  metalness: 0.95 }),
  silver:     new THREE.MeshStandardMaterial({ color: "#c8c8c8", roughness: 0.1,  metalness: 0.9  }),
  usbGrey:    new THREE.MeshStandardMaterial({ color: "#aaaaaa", roughness: 0.2,  metalness: 0.85 }),
  copper:     new THREE.MeshStandardMaterial({ color: "#b87333", roughness: 0.4,  metalness: 0.7  }),
  black:      new THREE.MeshStandardMaterial({ color: "#111",    roughness: 0.4,  metalness: 0.1  }),
  white:      new THREE.MeshStandardMaterial({ color: "#eeeeee", roughness: 0.7,  metalness: 0.0  }),
  rubber:     new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.9,  metalness: 0.0  }),
};

// ─── Helpers ────────────────────────────────────────────────

function useSelect(id: string) {
  const select   = useSimulationStore((s) => s.selectComponent);
  const selected = useSimulationStore((s) => s.selectedComponent === id);
  return { onClick: (e: any) => { e.stopPropagation(); select(id); }, selected };
}

function GlowRing({ color, radius = 0.12, visible = false }: { color: string; radius?: number; visible: boolean }) {
  if (!visible) return null;
  return (
    <mesh>
      <torusGeometry args={[radius, 0.008, 6, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
}

function SelectBox({ size }: { size: [number, number, number] }) {
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.2} />
    </mesh>
  );
}

// Gold pin header row
function PinHeader({ count, spacing = 0.1, horizontal = true }: { count: number; spacing?: number; horizontal?: boolean }) {
  const total = (count - 1) * spacing;
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={horizontal ? [total + 0.06, 0.07, 0.1] : [0.1, 0.07, total + 0.06]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={horizontal
          ? [-total / 2 + i * spacing, 0.07, 0]
          : [0, 0.07, -total / 2 + i * spacing]
        } castShadow>
          <boxGeometry args={[0.028, 0.12, 0.028]} />
          <meshStandardMaterial color="#d4a017" roughness={0.1} metalness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// SMD capacitor (the tiny tan rectangles on PCBs)
function SMDCap({ pos, color = "#998866", size = 0.038 }: { pos: [number, number, number]; color?: string; size?: number }) {
  return (
    <mesh position={pos} castShadow>
      <boxGeometry args={[size, size * 0.55, size * 0.45]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.3} />
    </mesh>
  );
}

// ─── 🟢 ARDUINO UNO R3 ─────────────────────────────────────
// Accurate dimensions, real component layout

export function ArduinoUno({ component }: { component: any }) {
  const { onClick, selected } = useSelect(component.id);
  const ledOn = component.pins?.["D13"]?.value > 0;
  const W = 2.2, H = 0.1, D = 1.5;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={onClick}>

        {/* ── PCB substrate ── */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={selected ? "#0d7a50" : "#0a5c2e"} roughness={0.55} metalness={0.05} />
        </mesh>

        {/* PCB top copper layer tint */}
        <mesh position={[0, H / 2 + 0.001, 0]}>
          <boxGeometry args={[W - 0.04, 0.001, D - 0.04]} />
          <meshStandardMaterial color="#0e6635" roughness={0.4} transparent opacity={0.6} />
        </mesh>

        {/* ── ATmega328P DIP chip ── */}
        <group position={[0.28, H / 2 + 0.032, 0.08]}>
          <mesh castShadow>
            <boxGeometry args={[0.52, 0.064, 0.52]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.05} />
          </mesh>
          {/* Pin legs along both sides */}
          {Array.from({ length: 14 }).map((_, i) => (
            <group key={i}>
              <mesh position={[-0.22 + i * 0.034, -0.04, -0.28]} castShadow>
                <boxGeometry args={[0.018, 0.06, 0.025]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[-0.22 + i * 0.034, -0.04, 0.28]} castShadow>
                <boxGeometry args={[0.018, 0.06, 0.025]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          ))}
          <Text position={[0, 0.036, 0.1]} fontSize={0.055} color="#888888"
            anchorX="center" rotation={[-Math.PI / 2, 0, 0]}>
            ATmega328P
          </Text>
        </group>

        {/* ── 16MHz Crystal (metal can) ── */}
        <group position={[0.28, H / 2 + 0.045, -0.35]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.095, 10]} />
            <meshStandardMaterial color="#c8c8c8" metalness={0.92} roughness={0.06} />
          </mesh>
          {/* Crystal legs */}
          {[-0.025, 0.025].map((x, i) => (
            <mesh key={i} position={[x, -0.02, 0]} castShadow>
              <boxGeometry args={[0.012, 0.06, 0.012]} />
              <meshStandardMaterial color="#c8c8c8" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── USB-B connector (square, chunky) ── */}
        <group position={[-0.99, H / 2 + 0.075, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.15, 0.42]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.88} roughness={0.08} />
          </mesh>
          {/* Port opening */}
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.07, 0.1, 0.28]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {/* 4 mounting tabs */}
          {[[-0.12, -0.19], [-0.12, 0.19]].map(([z1, z2], i) => (
            <mesh key={i} position={[0.06, -0.09, i === 0 ? z1 : z2]} castShadow>
              <boxGeometry args={[0.1, 0.03, 0.04]} />
              <meshStandardMaterial color="#aaa" metalness={0.85} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── DC power jack (barrel) ── */}
        <group position={[-0.85, H / 2 + 0.07, -0.62]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.22, 12]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
        </group>

        {/* ── Voltage regulator (D2PAK) ── */}
        <group position={[-0.52, H / 2 + 0.04, -0.62]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.08, 0.1]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
          <mesh position={[0.04, -0.05, 0]}>
            <boxGeometry args={[0.1, 0.04, 0.08]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* ── Electrolytic capacitors ── */}
        {[{ x: -0.3, col: "#334488" }, { x: -0.18, col: "#223366" }].map((c, i) => (
          <group key={i} position={[c.x, H / 2 + 0.07, -0.6]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.042, 0.042, 0.14, 12]} />
              <meshStandardMaterial color={c.col} roughness={0.45} />
            </mesh>
            {/* Top dome */}
            <mesh position={[0, 0.075, 0]}>
              <sphereGeometry args={[0.042, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={c.col} roughness={0.4} />
            </mesh>
            {/* White polarity stripe */}
            <mesh position={[-0.022, 0, 0]}>
              <boxGeometry args={[0.005, 0.14, 0.06]} />
              <meshStandardMaterial color="#fff" roughness={0.8} transparent opacity={0.5} />
            </mesh>
          </group>
        ))}

        {/* ── ATmega16U2 (USB controller) ── */}
        <group position={[-0.58, H / 2 + 0.018, 0.12]}>
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.036, 0.2]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.05} />
          </mesh>
          <Text position={[0, 0.024, 0]} fontSize={0.04} color="#888" anchorX="center" rotation={[-Math.PI / 2, 0, 0]}>16U2</Text>
        </group>

        {/* ── SMD passives scattered on PCB ── */}
        {([
          [0.55, 0, 0.48], [-0.05, 0, -0.35], [0.7, 0, -0.05],
          [-0.1, 0, 0.4], [0.15, 0, -0.5], [0.45, 0, -0.42],
        ] as [number, number, number][]).map((p, i) => (
          <SMDCap key={i} pos={[p[0], H / 2 + 0.008, p[2]]}
            color={i % 3 === 0 ? "#998866" : i % 3 === 1 ? "#5566aa" : "#663344"} />
        ))}

        {/* ── Digital pin header (D0–D13, 14 pins) ── */}
        <group position={[-0.68, H / 2 + 0.05, -0.67]}>
          <PinHeader count={14} spacing={0.105} />
        </group>

        {/* ── Analog pin header (A0–A5 + power, 8 pins) ── */}
        <group position={[0.4, H / 2 + 0.05, 0.68]}>
          <PinHeader count={8} spacing={0.1} />
        </group>

        {/* ── Power header (6 pins) ── */}
        <group position={[-0.44, H / 2 + 0.05, 0.68]}>
          <PinHeader count={6} spacing={0.1} />
        </group>

        {/* ── Reset button ── */}
        <group position={[0.72, H / 2, 0.6]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.04, 0.1]} />
            <meshStandardMaterial color="#222" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.035, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.028, 0.028, 10]} />
            <meshStandardMaterial color="#cc3333" roughness={0.3} />
          </mesh>
        </group>

        {/* ── Status LEDs ── */}
        {/* PWR (green) */}
        <group position={[0.48, H / 2 + 0.015, 0.56]}>
          <mesh castShadow>
            <boxGeometry args={[0.042, 0.028, 0.042]} />
            <meshStandardMaterial color="#002200" emissive="#00ff44" emissiveIntensity={2.5} transparent opacity={0.9} />
          </mesh>
          <pointLight color="#00ff44" intensity={0.2} distance={0.7} />
        </group>

        {/* L LED — pin 13 (yellow/orange) */}
        <group position={[0.6, H / 2 + 0.015, 0.56]}>
          <mesh castShadow>
            <boxGeometry args={[0.042, 0.028, 0.042]} />
            <meshStandardMaterial
              color={ledOn ? "#332200" : "#1a1000"}
              emissive={ledOn ? "#ffbb00" : "#000"}
              emissiveIntensity={ledOn ? 4 : 0}
              transparent opacity={0.9}
            />
          </mesh>
          {ledOn && <pointLight color="#ffaa00" intensity={0.4} distance={1.2} />}
        </group>

        {/* TX LED (blue) */}
        <group position={[0.72, H / 2 + 0.015, 0.56]}>
          <mesh castShadow>
            <boxGeometry args={[0.038, 0.028, 0.038]} />
            <meshStandardMaterial color="#000011" emissive="#3366ff" emissiveIntensity={0.4} transparent opacity={0.9} />
          </mesh>
        </group>

        {/* RX LED (red) */}
        <group position={[0.82, H / 2 + 0.015, 0.56]}>
          <mesh castShadow>
            <boxGeometry args={[0.038, 0.028, 0.038]} />
            <meshStandardMaterial color="#110000" emissive="#ff3300" emissiveIntensity={0.4} transparent opacity={0.9} />
          </mesh>
        </group>

        {/* ── PCB copper traces ── */}
        {([
          [[-0.5, H / 2 + 0.001, 0.1], [0.05, H / 2 + 0.001, 0.1], 0.01],
          [[0.25, H / 2 + 0.001, -0.15], [0.25, H / 2 + 0.001, -0.28], 0.008],
          [[0.6, H / 2 + 0.001, 0.3], [0.6, H / 2 + 0.001, -0.1], 0.008],
        ] as [[number,number,number],[number,number,number],number][]).map(([from, to, w], i) => {
          const mid: [number,number,number] = [(from[0]+to[0])/2,(from[1]+to[1])/2,(from[2]+to[2])/2];
          const len = Math.sqrt((to[0]-from[0])**2+(to[2]-from[2])**2);
          const ang = Math.atan2(to[2]-from[2],to[0]-from[0]);
          return (
            <mesh key={i} position={mid} rotation={[0,-ang,0]}>
              <boxGeometry args={[len, 0.001, w]} />
              <meshStandardMaterial color="#b87333" roughness={0.4} metalness={0.7} />
            </mesh>
          );
        })}

        {/* ── Silkscreen text ── */}
        {/* @ts-ignore - drei Text prop types */}
        <Text position={[-0.05, H/2+0.002, 0.28]} fontSize={0.09} color="#ddffee"
          anchorX="center" rotation={[-Math.PI/2,0,0]} transparent={true} opacity={0.65}>
          Arduino
        </Text>
        {/* @ts-ignore - drei Text prop types */}
        <Text position={[-0.05, H/2+0.002, 0.4]} fontSize={0.072} color="#aaccbb"
          anchorX="center" rotation={[-Math.PI/2,0,0]} transparent={true} opacity={0.5}>
          UNO R3
        </Text>

        {/* ── Mounting holes (PCB corners) ── */}
        {([[-1.02,-0.66],[-1.02,0.66],[0.98,0.66]] as [number,number][]).map(([x,z],i) => (
          <mesh key={i} position={[x, 0, z]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, H+0.01, 12]} />
            <meshStandardMaterial color="#083a1e" roughness={0.8} />
          </mesh>
        ))}

        {selected && <SelectBox size={[W+0.12, H+0.28, D+0.12]} />}
        <CuboidCollider args={[W/2, H/2+0.08, D/2]} />
      </group>
    </RigidBody>
  );
}

// ─── 💡 LED 5mm — realistic epoxy dome ─────────────────────

export function LED5mm({ component }: { component: any }) {
  const { onClick, selected } = useSelect(component.id);
  const brightness = (component.properties?.brightness as number) ?? 0;
  const isOn       = brightness > 0;
  const colorMap: Record<string, { on: string; off: string; glow: string }> = {
    red:    { on: "#ff2200", off: "#330800", glow: "#ff4400" },
    green:  { on: "#00ff44", off: "#003310", glow: "#00ff66" },
    blue:   { on: "#2244ff", off: "#000833", glow: "#4466ff" },
    yellow: { on: "#ffdd00", off: "#332200", glow: "#ffee33" },
    white:  { on: "#ffffff", off: "#222233", glow: "#ffffff" },
  };
  const col = colorMap[component.properties?.color as string] ?? colorMap.red;

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.0005}>
      <group onClick={onClick}>

        {/* Epoxy body — slightly tapered cylinder */}
        <mesh castShadow>
          <cylinderGeometry args={[0.075, 0.085, 0.12, 18]} />
          <meshStandardMaterial
            color={isOn ? col.on : col.off}
            emissive={isOn ? col.on : "#000"}
            emissiveIntensity={isOn ? 1.5 : 0}
            transparent opacity={0.88} roughness={0.05}
          />
        </mesh>

        {/* Epoxy dome on top */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.075, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={isOn ? col.on : col.off}
            emissive={isOn ? col.on : "#000"}
            emissiveIntensity={isOn ? 2.5 : 0}
            transparent opacity={0.85} roughness={0.02}
          />
        </mesh>

        {/* Die/emitter inside the dome (visible through epoxy) */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.032, 0.012, 0.032]} />
          <meshStandardMaterial
            color={isOn ? "#ffffff" : "#333"}
            emissive={isOn ? "#ffffff" : "#000"}
            emissiveIntensity={isOn ? 6 : 0}
          />
        </mesh>

        {/* Bond wire (tiny silver arc) — visible detail */}
        <mesh position={[0, 0.025, 0]}>
          <torusGeometry args={[0.022, 0.003, 4, 8, Math.PI]} />
          <meshStandardMaterial color="#c8c8c8" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Flat side indicator (cathode mark) */}
        <mesh position={[-0.072, -0.02, 0]}>
          <boxGeometry args={[0.006, 0.12, 0.04]} />
          <meshStandardMaterial color="#cccccc" transparent opacity={0.3} />
        </mesh>

        {/* Anode leg (longer, +) */}
        <mesh position={[0.02, -0.24, 0]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.27, 5]} />
          <meshStandardMaterial color="#c8c8c8" metalness={0.92} roughness={0.08} />
        </mesh>

        {/* Cathode leg (shorter, −) */}
        <mesh position={[-0.02, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.23, 5]} />
          <meshStandardMaterial color="#c8c8c8" metalness={0.92} roughness={0.08} />
        </mesh>

        {/* Glow halo when on */}
        {isOn && (
          <>
            <pointLight color={col.glow} intensity={brightness * 1.2} distance={2.5} decay={2} />
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color={col.glow} transparent opacity={0.06} />
            </mesh>
          </>
        )}

        {selected && <SelectBox size={[0.22, 0.5, 0.22]} />}
        <CuboidCollider args={[0.09, 0.22, 0.09]} />
      </group>
    </RigidBody>
  );
}

// ─── 〰️ Resistor — colour-coded bands ──────────────────────

export function Resistor({ component }: { component: any }) {
  const { onClick, selected } = useSelect(component.id);
  const resistance = (component.properties?.resistance as number) ?? 220;
  const bands =
    resistance === 220   ? ["#ff0000","#ff0000","#8B4513","#d4a017"] :
    resistance === 1000  ? ["#8B4513","#000000","#ff0000","#d4a017"] :
    resistance === 10000 ? ["#8B4513","#000000","#ff9900","#d4a017"] :
    resistance === 4700  ? ["#ffff00","#6600aa","#ff0000","#d4a017"] :
                           ["#888888","#888888","#000000","#d4a017"];

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.0005}>
      <group onClick={onClick} rotation={[0, 0, Math.PI / 2]}>
        {/* Ceramic body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.3, 14]} />
          <meshStandardMaterial color="#d4a574" roughness={0.85} metalness={0.0} />
        </mesh>

        {/* 4 colour bands */}
        {bands.map((col, i) => (
          <mesh key={i} position={[0, -0.085 + i * 0.068, 0]}>
            <cylinderGeometry args={[0.048, 0.048, 0.028, 14]} />
            <meshStandardMaterial color={col} roughness={0.5} />
          </mesh>
        ))}

        {/* Lead wires — tinned copper */}
        {[-0.22, 0.22].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <cylinderGeometry args={[0.007, 0.007, 0.18, 5]} />
            <meshStandardMaterial color="#c8c8c8" metalness={0.92} roughness={0.08} />
          </mesh>
        ))}

        {selected && <SelectBox size={[0.16, 0.55, 0.16]} />}
        <CuboidCollider args={[0.05, 0.22, 0.05]} />
      </group>
    </RigidBody>
  );
}

// ─── ⚙️ SG90 Servo — proper housing + rotating horn ────────

export function ServoSG90({ component }: { component: any }) {
  const { onClick, selected } = useSelect(component.id);
  const hornRef = useRef<THREE.Group>(null);
  const angle   = (component.properties?.angle as number) ?? 90;

  useFrame(() => {
    if (hornRef.current) {
      const target = ((angle - 90) * Math.PI) / 180;
      hornRef.current.rotation.y += (target - hornRef.current.rotation.y) * 0.15;
    }
  });

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.009}>
      <group onClick={onClick}>

        {/* Main body — dark blue-black ABS housing */}
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.36, 0.27]} />
          <meshStandardMaterial color="#111122" roughness={0.35} metalness={0.05} />
        </mesh>

        {/* Top plate (slightly lighter) */}
        <mesh position={[0, 0.185, 0]} castShadow>
          <boxGeometry args={[0.52, 0.01, 0.27]} />
          <meshStandardMaterial color="#1a1a30" roughness={0.3} />
        </mesh>

        {/* Mounting ears (left & right flanges) */}
        {[-0.35, 0.35].map((x, i) => (
          <group key={i} position={[x, 0, 0.06]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.06, 0.18]} />
              <meshStandardMaterial color="#111122" roughness={0.35} />
            </mesh>
            {/* Mounting hole */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.065, 10]} />
              <meshStandardMaterial color="#080810" roughness={0.5} />
            </mesh>
          </group>
        ))}

        {/* Output shaft housing (raised dome on top) */}
        <mesh position={[0.05, 0.225, 0.03]} castShadow>
          <cylinderGeometry args={[0.068, 0.068, 0.05, 14]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.2} metalness={0.2} />
        </mesh>

        {/* Splined shaft */}
        <mesh position={[0.05, 0.26, 0.03]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.06, 12]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.08} />
        </mesh>

        {/* Rotating horn assembly */}
        <group ref={hornRef as any} position={[0.05, 0.3, 0.03]}>
          {/* Horn disc */}
          <mesh castShadow>
            <cylinderGeometry args={[0.032, 0.032, 0.02, 12]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.05} />
          </mesh>
          {/* Horn arm */}
          <mesh position={[0.11, 0, 0]} castShadow>
            <boxGeometry args={[0.2, 0.016, 0.038]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
          </mesh>
          {/* Horn holes */}
          {[0.04, 0.14, 0.2].map((x, i) => (
            <mesh key={i} position={[x, 0.01, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.02, 8]} />
              <meshStandardMaterial color="#cccccc" />
            </mesh>
          ))}
        </group>

        {/* Servo label sticker */}
        <mesh position={[0, 0, 0.138]}>
          <boxGeometry args={[0.38, 0.22, 0.002]} />
          <meshStandardMaterial color="#2233aa" roughness={0.6} />
        </mesh>
        <Text position={[0, 0.04, 0.14]} fontSize={0.065} color="#ffffff" anchorX="center" rotation={[0,0,0]}>SG90</Text>
        <Text position={[0, -0.05, 0.14]} fontSize={0.042} color="#aabbff" anchorX="center" rotation={[0,0,0]}>MICRO SERVO</Text>

        {/* 3-wire cable (orange=signal, red=VCC, brown=GND) */}
        {[{ x: -0.24, col: "#cc5500" }, { x: -0.21, col: "#cc0000" }, { x: -0.18, col: "#442200" }].map((w, i) => (
          <mesh key={i} position={[w.x - 0.06, -0.22, -0.06]} castShadow>
            <cylinderGeometry args={[0.009, 0.009, 0.28, 5]} />
            <meshStandardMaterial color={w.col} roughness={0.75} />
          </mesh>
        ))}

        {selected && <SelectBox size={[0.82, 0.6, 0.42]} />}
        <CuboidCollider args={[0.28, 0.2, 0.14]} />
      </group>
    </RigidBody>
  );
}

// ─── 🤖 2WD Smart Car — detailed chassis ───────────────────

export function Robot2WDCar({ component }: { component: any }) {
  const { onClick, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const speed    = (component.properties?.speed as number) ?? 0;
  const flRef = useRef<THREE.Group>(null);
  const frRef = useRef<THREE.Group>(null);
  const blRef = useRef<THREE.Group>(null);
  const brRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (simState === "running" && speed !== 0) {
      const rot = speed * delta * 8;
      [flRef, frRef, blRef, brRef].forEach(r => {
        if (r.current) r.current.rotation.x += rot;
      });
    }
  });

  const Wheel = ({ ref: wRef, pos }: { ref: React.RefObject<THREE.Group>; pos: [number,number,number] }) => (
    <group ref={wRef} position={pos}>
      {/* Rubber tyre */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.2, 0.065, 10, 20]} />
        <meshStandardMaterial color="#111111" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Plastic rim */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.055, 16]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Hub */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.07, 8]} />
        <meshStandardMaterial color="#c8c8c8" metalness={0.85} roughness={0.1} />
      </mesh>
      {/* Spokes */}
      {[0, 60, 120].map((deg, i) => (
        <mesh key={i} position={[0, 0, 0]} rotation={[0, 0, (deg * Math.PI) / 180]}>
          <boxGeometry args={[0.22, 0.018, 0.015]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.32}>
      <group onClick={onClick}>

        {/* ── Lower chassis (acrylic plate) ── */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.06, 1.1]} />
          <meshStandardMaterial color="#111133" roughness={0.25} transparent opacity={0.9} metalness={0.05} />
        </mesh>

        {/* ── Upper chassis plate ── */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[1.5, 0.05, 0.95]} />
          <meshStandardMaterial color="#111133" roughness={0.25} transparent opacity={0.85} />
        </mesh>

        {/* ── Brass standoffs (4 corners) ── */}
        {([[-0.58, -0.38],[0.58, -0.38],[-0.58, 0.38],[0.58, 0.38]] as [number,number][]).map(([x,z],i) => (
          <mesh key={i} position={[x, 0.21, z]} castShadow>
            <cylinderGeometry args={[0.028, 0.028, 0.38, 8]} />
            <meshStandardMaterial color="#d4a017" metalness={0.85} roughness={0.15} />
          </mesh>
        ))}

        {/* ── Arduino Uno on upper deck ── */}
        <group position={[-0.1, 0.46, 0]} scale={[0.7, 0.7, 0.7]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 0.1, 1.5]} />
            <meshStandardMaterial color="#0a5c2e" roughness={0.55} />
          </mesh>
          {/* Chips */}
          <mesh position={[0.28, 0.09, 0.08]} castShadow>
            <boxGeometry args={[0.52, 0.06, 0.52]} />
            <meshStandardMaterial color="#111" roughness={0.2} />
          </mesh>
          <mesh position={[-0.9, 0.06, 0]} castShadow>
            <boxGeometry args={[0.3, 0.12, 0.42]} />
            <meshStandardMaterial color="#aaa" metalness={0.85} roughness={0.1} />
          </mesh>
          {/* PWR LED */}
          <mesh position={[0.5, 0.07, 0.56]}>
            <boxGeometry args={[0.04, 0.025, 0.04]} />
            <meshStandardMaterial color="#001100" emissive="#00ff44" emissiveIntensity={2} />
          </mesh>
        </group>

        {/* ── L298N motor driver ── */}
        <group position={[0.3, 0.45, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.06, 0.5]} />
            <meshStandardMaterial color="#cc2222" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.32, 0.12, 0.32]} />
            <meshStandardMaterial color="#111" roughness={0.2} />
          </mesh>
          {/* Heatsink */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.36, 0.05, 0.32]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* ── HC-SR04 at front ── */}
        <group position={[-0.82, 0.18, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.1, 0.5]} />
            <meshStandardMaterial color="#0055bb" roughness={0.4} />
          </mesh>
          {[-0.14, 0.14].map((z, i) => (
            <group key={i} position={[0, 0, z]}>
              <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
                <meshStandardMaterial color="#ddddcc" roughness={0.5} metalness={0.2} />
              </mesh>
              <mesh position={[-0.04, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} rotation={[0, 0, Math.PI / 2] as any} />
                <meshStandardMaterial color="#111" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>

        {/* ── DC Motors (2 x TT gear motors) ── */}
        {([-0.55, 0.55] as number[]).map((z, i) => (
          <group key={i} position={[-0.28, -0.04, z]}>
            {/* Motor body */}
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
              <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Gearbox */}
            <mesh position={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.2, 0.15, 0.15]} />
              <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Shaft */}
            <mesh position={[0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.018, 0.018, 0.06, 8]} />
              <meshStandardMaterial color="#c8c8c8" metalness={0.9} roughness={0.08} />
            </mesh>
          </group>
        ))}

        {/* ── Wheels ── */}
        <Wheel ref={flRef} pos={[-0.52, -0.05, -0.7]} />
        <Wheel ref={frRef} pos={[-0.52, -0.05,  0.7]} />
        <Wheel ref={blRef} pos={[ 0.52, -0.05, -0.7]} />
        <Wheel ref={brRef} pos={[ 0.52, -0.05,  0.7]} />

        {/* ── Battery pack ── */}
        <group position={[0.25, 0.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.65, 0.16, 0.42]} />
            <meshStandardMaterial color="#111" roughness={0.45} />
          </mesh>
          <Text position={[0, 0.095, 0]} fontSize={0.05} color="#555" anchorX="center" rotation={[-Math.PI/2,0,0]}>
            9V / 2xAA
          </Text>
        </group>

        {/* ── IR line sensors at front-bottom ── */}
        {[-0.2, 0, 0.2].map((z, i) => (
          <group key={i} position={[-0.76, -0.06, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, 0.04, 0.06]} />
              <meshStandardMaterial color="#111" roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* ── Status LEDs on front ── */}
        {[{ z: -0.35, col: "#ff0000" }, { z: 0.35, col: "#00ff44" }].map((l, i) => (
          <mesh key={i} position={[-0.81, 0.1, l.z]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={l.col} emissive={l.col} emissiveIntensity={simState==="running" ? 2 : 0.3} />
          </mesh>
        ))}

        <Text position={[0, 0.55, 0]} fontSize={0.09} color="#88aaff"
          anchorX="center" rotation={[-Math.PI/2,0,0]}>
          2WD Smart Car
        </Text>

        {selected && <SelectBox size={[1.85, 0.65, 1.55]} />}
        <CuboidCollider args={[0.82, 0.22, 0.72]} />
      </group>
    </RigidBody>
  );
}

// ─── 🦾 4-DOF Robotic Arm ───────────────────────────────────

export function RobotArm4DOF({ component }: { component: any }) {
  const { onClick, selected } = useSelect(component.id);
  const baseRef     = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef    = useRef<THREE.Group>(null);
  const gripRef     = useRef<THREE.Group>(null);

  const baseAngle     = (component.properties?.baseAngle     as number) ?? 90;
  const shoulderAngle = (component.properties?.shoulderAngle as number) ?? 90;
  const elbowAngle    = (component.properties?.elbowAngle    as number) ?? 90;
  const gripperAngle  = (component.properties?.gripperAngle  as number) ?? 90;

  useFrame(() => {
    const lerp = (ref: React.RefObject<THREE.Group>, angle: number, axis: "x"|"y"|"z") => {
      if (!ref.current) return;
      const t = ((angle - 90) * Math.PI) / 180;
      (ref.current.rotation as any)[axis] += (t - (ref.current.rotation as any)[axis]) * 0.12;
    };
    lerp(baseRef, baseAngle, "y");
    lerp(shoulderRef, shoulderAngle, "z");
    lerp(elbowRef, elbowAngle, "z");
  });

  const JointSphere = ({ r = 0.06 }: { r?: number }) => (
    <mesh castShadow>
      <sphereGeometry args={[r, 12, 12]} />
      <meshStandardMaterial color="#888" metalness={0.8} roughness={0.15} />
    </mesh>
  );

  const Link = ({ length, color = "#d4a017" }: { length: number; color?: string }) => (
    <group>
      <mesh position={[0, length / 2, 0]} castShadow>
        <boxGeometry args={[0.07, length, 0.055]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.55} />
      </mesh>
      {/* Reinforcement ribs */}
      {[0.15, 0.35].map((t, i) => (
        <mesh key={i} position={[0, length * t, 0]} castShadow>
          <boxGeometry args={[0.09, 0.02, 0.07]} />
          <meshStandardMaterial color="#c8a000" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );

  return (
    <RigidBody type="fixed" position={component.position}>
      <group onClick={onClick}>

        {/* ── Heavy base ── */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.45, 0.52, 0.2, 16]} />
          <meshStandardMaterial color="#333" roughness={0.3} metalness={0.55} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 0.12, 12]} />
          <meshStandardMaterial color="#555" metalness={0.65} roughness={0.25} />
        </mesh>

        {/* ── Turntable + base rotation ── */}
        <group ref={baseRef as any} position={[0, 0.28, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.19, 0.22, 0.09, 12]} />
            <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
          </mesh>

          {/* Shoulder servo housing */}
          <group position={[0, 0.12, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.22, 0.18]} />
              <meshStandardMaterial color="#222233" roughness={0.35} />
            </mesh>

            {/* Upper arm */}
            <group ref={shoulderRef as any} position={[0, 0.14, 0]}>
              <JointSphere r={0.07} />
              <Link length={0.85} color="#d4a017" />

              {/* Elbow */}
              <group ref={elbowRef as any} position={[0, 0.88, 0]}>
                <JointSphere r={0.058} />

                {/* Forearm */}
                <Link length={0.65} color="#c8980e" />

                {/* Wrist + gripper */}
                <group position={[0, 0.68, 0]}>
                  <JointSphere r={0.048} />

                  {/* Left finger */}
                  <mesh position={[-0.055, 0.1, 0]} castShadow>
                    <boxGeometry args={[0.04, 0.18, 0.05]} />
                    <meshStandardMaterial color="#555" metalness={0.65} roughness={0.25} />
                  </mesh>
                  {/* Right finger */}
                  <mesh position={[0.055, 0.1, 0]} castShadow>
                    <boxGeometry args={[0.04, 0.18, 0.05]} />
                    <meshStandardMaterial color="#555" metalness={0.65} roughness={0.25} />
                  </mesh>

                  {/* Finger tips — rubber pads */}
                  {[-0.055, 0.055].map((x, i) => (
                    <mesh key={i} position={[x, 0.19, 0]} castShadow>
                      <boxGeometry args={[0.04, 0.03, 0.05]} />
                      <meshStandardMaterial color="#222" roughness={0.9} />
                    </mesh>
                  ))}
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* Servo cables */}
        <mesh position={[0.18, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.6, 5]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>

        <Text position={[0.5, 0.1, 0]} fontSize={0.08} color="#ffcc00" anchorX="center" rotation={[-Math.PI/2,0,0]}>
          4-DOF Arm
        </Text>

        {selected && <SelectBox size={[1.2, 2.2, 1.2]} />}
        <CuboidCollider args={[0.5, 0.15, 0.5]} position={[0, 0.1, 0]} />
      </group>
    </RigidBody>
  );
}

// ─── 🚁 Quadcopter F450 ─────────────────────────────────────

export function Quadcopter({ component }: { component: any }) {
  const { onClick, selected } = useSelect(component.id);
  const propRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const armed    = component.properties?.armed as boolean;
  const throttle = (component.properties?.throttle as number) ?? 0;

  useFrame((_, delta) => {
    if (armed) {
      const spd = delta * 25 * (0.5 + throttle / 200);
      propRefs.forEach((r, i) => { if (r.current) r.current.rotation.y += i % 2 === 0 ? spd : -spd; });
    }
  });

  const armPositions: [number, number, number][] = [
    [0.65, 0, 0.65], [-0.65, 0, 0.65], [-0.65, 0, -0.65], [0.65, 0, -0.65],
  ];
  const armColors = ["#cc2222", "#cc2222", "#111", "#111"]; // front arms red

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.8}>
      <group onClick={onClick}>

        {/* ── Center body (electronics stack) ── */}
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.1, 0.28]} />
          <meshStandardMaterial color="#111" roughness={0.35} metalness={0.2} />
        </mesh>

        {/* Flight controller PCB */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.2, 0.012, 0.2]} />
          <meshStandardMaterial color="#0a5c2e" roughness={0.5} />
        </mesh>

        {/* ESC stack */}
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.22, 0.06, 0.22]} />
          <meshStandardMaterial color="#222" roughness={0.4} />
        </mesh>

        {/* ── Arms + motors + props ── */}
        {armPositions.map((apos, i) => {
          const angle = Math.atan2(apos[2], apos[0]);
          const len   = 0.92;
          return (
            <group key={i}>
              {/* Arm tube */}
              <mesh position={[apos[0]/2, 0, apos[2]/2]} rotation={[0, -angle, 0]} castShadow>
                <boxGeometry args={[len, 0.045, 0.045]} />
                <meshStandardMaterial color={armColors[i]} roughness={0.4} metalness={0.1} />
              </mesh>

              {/* Motor can */}
              <group position={apos}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.07, 0.07, 0.06, 14]} />
                  <meshStandardMaterial color="#333" metalness={0.8} roughness={0.15} />
                </mesh>
                <mesh position={[0, 0.035, 0]} castShadow>
                  <cylinderGeometry args={[0.062, 0.062, 0.025, 14]} />
                  <meshStandardMaterial color="#555" metalness={0.85} roughness={0.1} />
                </mesh>

                {/* Propeller */}
                <mesh ref={propRefs[i]} position={[0, 0.055, 0]}>
                  <boxGeometry args={[0.55, 0.01, 0.04]} />
                  <meshStandardMaterial
                    color={i < 2 ? "#222" : "#444"}
                    transparent opacity={armed ? 0.35 : 0.85}
                    roughness={0.5}
                  />
                </mesh>
              </group>
            </group>
          );
        })}

        {/* ── LiPo battery ── */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.18, 0.065, 0.12]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.45} />
        </mesh>

        {/* ── Landing legs ── */}
        {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x,z],i) => (
          <group key={i} position={[x, -0.1, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.016, 0.12, 0.016]} />
              <meshStandardMaterial color="#333" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.07, 0]}>
              <boxGeometry args={[0.08, 0.014, 0.016]} />
              <meshStandardMaterial color="#444" roughness={0.5} />
            </mesh>
          </group>
        ))}

        {/* FC status LED */}
        <mesh position={[0, 0.068, 0.06]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color={armed ? "#00ff44" : "#ff3300"} emissive={armed ? "#00ff44" : "#ff0000"} emissiveIntensity={2} />
        </mesh>

        {/* Prop wash effect when armed */}
        {armed && armPositions.map((pos, i) => (
          <pointLight key={i} position={[pos[0], pos[1]+0.1, pos[2]]} color="#aaccff" intensity={0.15} distance={0.8} />
        ))}

        <Text position={[0, 0.16, 0]} fontSize={0.07} color="#aaccff" anchorX="center" rotation={[-Math.PI/2,0,0]}>
          F450 Drone
        </Text>

        {selected && <SelectBox size={[1.55, 0.35, 1.55]} />}
        <CuboidCollider args={[0.7, 0.12, 0.7]} />
      </group>
    </RigidBody>
  );
}

// ─── 📦 HC-SR04 Ultrasonic ──────────────────────────────────

export function HCSr04({ component }: { component: any }) {
  const { onClick, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const distance = (component.properties?.distance as number) ?? 100;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.008}>
      <group onClick={onClick}>
        {/* PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.1, 0.45]} />
          <meshStandardMaterial color="#0055bb" roughness={0.5} metalness={0.06} />
        </mesh>

        {/* Two transducer cylinders */}
        {[-0.22, 0.22].map((x, i) => (
          <group key={i} position={[x, 0.08, 0.1]}>
            {/* Outer housing */}
            <mesh castShadow rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.1, 20]} />
              <meshStandardMaterial color="#d8d8c0" roughness={0.55} metalness={0.2} />
            </mesh>
            {/* Piezo membrane (silver inner disc) */}
            <mesh position={[0, 0, 0.055]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 20]} />
              <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.15} />
            </mesh>
            {/* Metal ring */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.12, 0.01, 6, 20]} />
              <meshStandardMaterial color="#c8c8c8" metalness={0.92} roughness={0.05} />
            </mesh>
          </group>
        ))}

        {/* 4-pin header */}
        <group position={[0.28, 0.1, -0.16]}>
          <PinHeader count={4} spacing={0.105} />
        </group>

        {/* IC + SMD */}
        <mesh position={[0.06, 0.07, -0.03]} castShadow>
          <boxGeometry args={[0.22, 0.03, 0.22]} />
          <meshStandardMaterial color="#111" roughness={0.2} />
        </mesh>
        <SMDCap pos={[-0.2, 0.07, -0.08]} />
        <SMDCap pos={[-0.28, 0.07, 0.05]} color="#5566aa" />

        {/* Beam visualization */}
        {simState === "running" && distance > 5 && (
          <mesh position={[0, 0.08, 0.22]}>
            <coneGeometry args={[distance * 0.018, distance * 0.02, 10]} rotation={[-Math.PI/2,0,0] as any} />
            <meshBasicMaterial color="#44aaff" transparent opacity={0.05} />
          </mesh>
        )}

        <Text position={[0, 0.065, -0.17]} fontSize={0.05} color="#aaccff" anchorX="center" rotation={[-Math.PI/2,0,0]}>
          HC-SR04
        </Text>
        {selected && <SelectBox size={[0.95, 0.35, 0.55]} />}
        <CuboidCollider args={[0.425, 0.1, 0.225]} />
      </group>
    </RigidBody>
  );
}
