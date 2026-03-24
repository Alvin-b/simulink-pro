import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useSimulationStore, SimComponent } from "@/stores/simulationStore";

// ─── Shared helpers ────────────────────────────────────────

function useSelect(id: string) {
  const select   = useSimulationStore((s) => s.selectComponent);
  const selected = useSimulationStore((s) => s.selectedComponent === id);
  return { select: (e: any) => { e.stopPropagation(); select(id); }, selected };
}

function SelectionOutline({ size }: { size: [number,number,number] }) {
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.25} />
    </mesh>
  );
}

// PCB material
const PCB_GREEN  = "#0a5c2e";
const PCB_DARK   = "#073d1e";
const COPPER     = "#b87333";
const GOLD       = "#d4a017";
const SILVER     = "#c8c8c8";
const CHIP_BLACK = "#111111";
const SMD_GREY   = "#2a2a2a";

// ─── Capacitor (SMD) ───────────────────────────────────────
function SMDCap({ pos, size = 0.04, color = "#4488aa" }: { pos: [number,number,number]; size?: number; color?: string }) {
  return (
    <mesh position={pos} castShadow>
      <boxGeometry args={[size, size*0.6, size*0.5]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
    </mesh>
  );
}

// IC chip with pin legs
function ICChip({ pos, size, color = CHIP_BLACK, label = "" }: { pos: [number,number,number]; size: [number,number,number]; color?: string; label?: string }) {
  const legs = Math.floor(size[0] / 0.08);
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Pin legs along both sides */}
      {Array.from({length: legs}).map((_, i) => (
        <group key={i}>
          <mesh position={[-size[0]/2 + (i+0.5)*(size[0]/legs), -size[1]/2, -size[2]/2 - 0.015]}>
            <boxGeometry args={[0.02, 0.008, 0.03]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[-size[0]/2 + (i+0.5)*(size[0]/legs), -size[1]/2, size[2]/2 + 0.015]}>
            <boxGeometry args={[0.02, 0.008, 0.03]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
      {label && (
        <Text position={[0, size[1]/2+0.002, 0]} fontSize={size[0]*0.12} color="#aaaaaa"
          anchorX="center" rotation={[-Math.PI/2,0,0]}>
          {label}
        </Text>
      )}
    </group>
  );
}

// Copper trace line on PCB
function PCBTrace({ from, to, width = 0.008 }: { from: [number,number,number]; to: [number,number,number]; width?: number }) {
  const mid: [number,number,number] = [(from[0]+to[0])/2, (from[1]+to[1])/2, (from[2]+to[2])/2];
  const len = Math.sqrt((to[0]-from[0])**2 + (to[2]-from[2])**2);
  const angle = Math.atan2(to[2]-from[2], to[0]-from[0]);
  return (
    <mesh position={mid} rotation={[0, -angle, 0]}>
      <boxGeometry args={[len, 0.001, width]} />
      <meshStandardMaterial color={COPPER} roughness={0.4} metalness={0.7} />
    </mesh>
  );
}

// ─── Realistic Arduino Uno R3 ──────────────────────────────

export function RealisticArduinoUno({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const pin13 = component.pins["D13"];
  const ledOn = pin13?.value > 0;
  const pwrOn = true;

  // PCB dimensions (to scale ~68.6mm x 53.4mm → 2.2 x 1.5 units)
  const W = 2.2, H = 0.12, D = 1.5;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={select}>

        {/* ── PCB base ── */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={selected ? "#0d7a50" : PCB_GREEN} roughness={0.6} metalness={0.05} />
        </mesh>

        {/* PCB silkscreen outline */}
        <mesh position={[0, H/2+0.001, 0]}>
          <boxGeometry args={[W-0.05, 0.001, D-0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.06} />
        </mesh>

        {/* ── ATmega328P main chip ── */}
        <ICChip pos={[0.25, H/2+0.025, 0.1]} size={[0.52, 0.05, 0.52]} label="ATmega328P" />

        {/* ── 16MHz Crystal ── */}
        <group position={[0.25, H/2+0.015, -0.32]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.14]} />
            <meshStandardMaterial color={COPPER} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* ── USB-B connector ── */}
        <group position={[-1.0, H/2+0.06, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.32, 0.12, 0.42]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.85} roughness={0.1} />
          </mesh>
          {/* USB port opening */}
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.3]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
        </group>

        {/* ── DC Power Jack ── */}
        <group position={[-0.85, H/2+0.065, -0.6]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 12]} rotation={[0,0,Math.PI/2] as any} />
            <meshStandardMaterial color="#333" roughness={0.5} />
          </mesh>
          <mesh position={[-0.08, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.06, 8]} rotation={[0,0,Math.PI/2] as any} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
        </group>

        {/* ── Voltage regulator (NCP1117) ── */}
        <group position={[-0.6, H/2+0.03, -0.62]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.06, 0.1]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.1]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* ── Electrolytic caps ── */}
        {[[-0.35, 0, -0.6], [-0.22, 0, -0.6]].map(([x,y,z], i) => (
          <group key={i} position={[x, H/2+0.06, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.12, 10]} />
              <meshStandardMaterial color={i===0 ? "#334488" : "#333344"} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.065, 0]}>
              <cylinderGeometry args={[0.044, 0.044, 0.01, 10]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.1} />
            </mesh>
            {/* Polarity stripe */}
            <mesh position={[-0.02, 0, 0]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.005, 0.12, 0.04]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} transparent opacity={0.4} />
            </mesh>
          </group>
        ))}

        {/* ── SMD capacitors (scattered) ── */}
        {[
          [0.6, 0, 0.5] as [number,number,number],
          [0.0, 0, -0.4] as [number,number,number],
          [0.8, 0, -0.1] as [number,number,number],
          [-0.1, 0, 0.4] as [number,number,number],
        ].map((pos, i) => (
          <SMDCap key={i} pos={[pos[0], H/2+0.01, pos[2]]} color={i%2===0 ? "#4488aa" : "#8844aa"} />
        ))}

        {/* ── ATmega16U2 (USB chip) ── */}
        <ICChip pos={[-0.55, H/2+0.015, 0.1]} size={[0.22, 0.03, 0.22]} label="16U2" />

        {/* ── Digital pin header (D0-D13) ── */}
        <group position={[-0.72, H/2+0.05, -0.62]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.08, 0.12]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 14}).map((_, i) => (
            <mesh key={i} position={[-0.72 + i*0.115, 0.06, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── Analog pin header (A0-A5) + power ── */}
        <group position={[0.35, H/2+0.05, 0.69]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.08, 0.12]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 8}).map((_, i) => (
            <mesh key={i} position={[-0.36 + i*0.105, 0.06, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── Power header ── */}
        <group position={[-0.5, H/2+0.05, 0.69]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.08, 0.12]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 6}).map((_, i) => (
            <mesh key={i} position={[-0.25 + i*0.1, 0.06, 0]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── ICSP header ── */}
        <group position={[0.85, H/2+0.05, 0.5]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.08, 0.22]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {[[0,0,-0.08],[0,0,0],[0,0,0.08]].map(([px,py,pz],i) => (
            <mesh key={i} position={[px, 0.06, pz]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── Reset button ── */}
        <group position={[0.7, H/2+0.02, 0.62]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.04, 0.1]} />
            <meshStandardMaterial color="#222" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.035, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.03, 8]} />
            <meshStandardMaterial color="#cc3333" roughness={0.3} />
          </mesh>
        </group>

        {/* ── PCB copper traces ── */}
        <PCBTrace from={[-0.5, H/2+0.001, 0.1]} to={[0.05, H/2+0.001, 0.1]} width={0.01} />
        <PCBTrace from={[0.25, H/2+0.001, -0.15]} to={[0.25, H/2+0.001, -0.28]} width={0.008} />
        <PCBTrace from={[-0.3, H/2+0.001, -0.3]} to={[0.05, H/2+0.001, -0.3]} width={0.008} />
        <PCBTrace from={[0.6, H/2+0.001, 0.3]} to={[0.6, H/2+0.001, -0.1]} width={0.008} />
        <PCBTrace from={[-0.2, H/2+0.001, 0.4]} to={[0.2, H/2+0.001, 0.4]} width={0.008} />

        {/* ── LEDs ── */}
        {/* Power LED (green - always on) */}
        <group position={[0.45, H/2+0.02, 0.55]}>
          <mesh castShadow>
            <boxGeometry args={[0.05, 0.04, 0.05]} />
            <meshStandardMaterial color="#004400" emissive="#00ff44" emissiveIntensity={pwrOn ? 3 : 0} transparent opacity={0.9} />
          </mesh>
          {pwrOn && <pointLight color="#00ff44" intensity={0.3} distance={0.8} />}
        </group>

        {/* L LED (pin 13 - yellow) */}
        <group position={[0.55, H/2+0.02, 0.55]}>
          <mesh castShadow>
            <boxGeometry args={[0.05, 0.04, 0.05]} />
            <meshStandardMaterial
              color={ledOn ? "#ffdd00" : "#332200"}
              emissive={ledOn ? "#ffbb00" : "#000"}
              emissiveIntensity={ledOn ? 4 : 0}
            />
          </mesh>
          {ledOn && <pointLight color="#ffbb00" intensity={0.5} distance={1} />}
        </group>

        {/* TX/RX LEDs */}
        <mesh position={[0.65, H/2+0.02, 0.55]} castShadow>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshStandardMaterial color="#000033" emissive="#0044ff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.72, H/2+0.02, 0.55]} castShadow>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshStandardMaterial color="#330000" emissive="#ff2200" emissiveIntensity={0.3} />
        </mesh>

        {/* ── Arduino logo silkscreen ── */}
        <Text position={[-0.1, H/2+0.002, 0.25]} fontSize={0.09} color="#aaffdd"
          anchorX="center" rotation={[-Math.PI/2,0,0]} transparent opacity={0.7}>
          Arduino
        </Text>
        <Text position={[-0.1, H/2+0.002, 0.38]} fontSize={0.07} color="#88ccbb"
          anchorX="center" rotation={[-Math.PI/2,0,0]} transparent opacity={0.5}>
          UNO R3
        </Text>

        {/* ── Board edge chamfers (mounting holes) ── */}
        {[[-1.02, 0, -0.66], [-1.02, 0, 0.66], [0.98, 0, 0.66]].map(([x,y,z], i) => (
          <mesh key={i} position={[x, H/2+0.001, z]}>
            <cylinderGeometry args={[0.055, 0.055, H+0.01, 12]} />
            <meshStandardMaterial color="#0a3a1e" roughness={0.8} />
          </mesh>
        ))}

        {selected && <SelectionOutline size={[W+0.1, H+0.25, D+0.1]} />}
        <CuboidCollider args={[W/2, H/2+0.06, D/2]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic ESP32 WROOM ─────────────────────────────────

export function RealisticESP32({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const W = 1.8, H = 0.08, D = 0.8;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position}>
      <group onClick={select}>

        {/* ── PCB (navy blue) ── */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={selected ? "#1a3a6a" : "#0a1a3a"} roughness={0.5} metalness={0.08} />
        </mesh>

        {/* ── ESP32-WROOM module (metal shielded can) ── */}
        <group position={[0.25, H/2+0.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.65, 0.1, 0.58]} />
            <meshStandardMaterial color="#b0b0b0" metalness={0.92} roughness={0.08} />
          </mesh>
          {/* Shield seam */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.67, 0.002, 0.6]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Espressif logo area */}
          <mesh position={[0, 0.052, 0.1]}>
            <boxGeometry args={[0.4, 0.002, 0.12]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.2} />
          </mesh>
          <Text position={[0, 0.054, 0.08]} fontSize={0.055} color="#333" anchorX="center" rotation={[-Math.PI/2,0,0]}>
            ESP32-WROOM-32
          </Text>
          <Text position={[0, 0.054, -0.08]} fontSize={0.04} color="#555" anchorX="center" rotation={[-Math.PI/2,0,0]}>
            Espressif
          </Text>
          {/* PCB antenna cutout area */}
          <mesh position={[0.27, 0.052, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[0.1, 0.58]} />
            <meshStandardMaterial color="#0a1a3a" roughness={0.5} />
          </mesh>
        </group>

        {/* ── USB-C connector ── */}
        <group position={[-0.85, H/2+0.04, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.07, 0.22]} />
            <meshStandardMaterial color={SILVER} metalness={0.95} roughness={0.05} />
          </mesh>
          <mesh position={[-0.07, 0, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.14]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
        </group>

        {/* ── EN / BOOT buttons ── */}
        {[[-0.5, 0, -0.33], [-0.3, 0, -0.33]].map(([x,y,z], i) => (
          <group key={i} position={[x, H/2+0.025, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.05, 0.1]} />
              <meshStandardMaterial color="#222" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.025, 8]} />
              <meshStandardMaterial color={i===0 ? "#cc3333" : "#333388"} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* ── SMD components ── */}
        <SMDCap pos={[-0.3, H/2+0.008, 0.15]} />
        <SMDCap pos={[-0.15, H/2+0.008, 0.15]} color="#885544" />
        <SMDCap pos={[0.7, H/2+0.008, 0.2]} />
        <SMDCap pos={[0.7, H/2+0.008, -0.2]} color="#886644" />

        {/* ── AMS1117 voltage regulator ── */}
        <group position={[-0.6, H/2+0.022, 0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.04, 0.1]} />
            <meshStandardMaterial color="#333" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.1, 0.04, 0.08]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* ── Pin headers (left side) ── */}
        <group position={[-0.88, H/2+0.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.08, D-0.02]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 15}).map((_,i) => (
            <mesh key={i} position={[0, 0.08, -D/2+0.03 + i*0.052]} castShadow>
              <boxGeometry args={[0.03, 0.12, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.05} />
            </mesh>
          ))}
        </group>

        {/* ── Pin headers (right side) ── */}
        <group position={[0.88, H/2+0.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.08, D-0.02]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 15}).map((_,i) => (
            <mesh key={i} position={[0, 0.08, -D/2+0.03 + i*0.052]} castShadow>
              <boxGeometry args={[0.03, 0.12, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.05} />
            </mesh>
          ))}
        </group>

        {/* ── Status LED ── */}
        <mesh position={[-0.55, H/2+0.02, -0.3]} castShadow>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshStandardMaterial color="#003300" emissive="#00ff44" emissiveIntensity={1.5} />
        </mesh>
        <pointLight position={[-0.55, H/2+0.05, -0.3]} color="#00ff44" intensity={0.2} distance={0.6} />

        {/* Copper traces */}
        <PCBTrace from={[-0.6, H/2+0.001, 0]} to={[0, H/2+0.001, 0]} width={0.012} />
        <PCBTrace from={[0, H/2+0.001, -0.2]} to={[0.3, H/2+0.001, -0.2]} width={0.008} />

        {selected && <SelectionOutline size={[W+0.1, H+0.25, D+0.1]} />}
        <CuboidCollider args={[W/2, H/2+0.08, D/2]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic HC-SR04 Ultrasonic ──────────────────────────

export function RealisticHCSR04({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const simState = useSimulationStore((s) => s.simState);
  const distance = (component.properties.distance as number) || 0;

  return (
    <RigidBody type={component.isStatic ? "fixed" : "dynamic"} position={component.position} mass={0.008}>
      <group onClick={select}>

        {/* PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.1, 0.45]} />
          <meshStandardMaterial color="#0055bb" roughness={0.5} metalness={0.06} />
        </mesh>

        {/* Transducers — the large silver cylinders */}
        {[-0.22, 0.22].map((x, i) => (
          <group key={i} position={[x, 0.08, 0.1]}>
            {/* Outer ring */}
            <mesh castShadow>
              <cylinderGeometry args={[0.14, 0.14, 0.09, 20]} rotation={[Math.PI/2,0,0] as any} />
              <meshStandardMaterial color="#ddddcc" metalness={0.3} roughness={0.6} />
            </mesh>
            {/* Inner mesh */}
            <mesh position={[0, 0, 0.055]}>
              <cylinderGeometry args={[0.11, 0.11, 0.02, 20]} rotation={[Math.PI/2,0,0] as any} />
              <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
            {/* Metal rim */}
            <mesh>
              <torusGeometry args={[0.13, 0.012, 6, 20]} rotation={[Math.PI/2,0,0] as any} />
              <meshStandardMaterial color={SILVER} metalness={0.95} roughness={0.05} />
            </mesh>
          </group>
        ))}

        {/* 4-pin header */}
        <group position={[0.3, 0.1, -0.17]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.07, 0.1]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {["VCC","TRIG","ECHO","GND"].map((label, i) => (
            <group key={i} position={[-0.16 + i*0.11, 0.06, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.03, 0.1, 0.03]} />
                <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.05} />
              </mesh>
            </group>
          ))}
        </group>

        {/* IC chip */}
        <ICChip pos={[0.1, 0.06, -0.05]} size={[0.22, 0.03, 0.22]} label="HC-SR04" />

        {/* SMD components */}
        <SMDCap pos={[-0.15, 0.06, -0.1]} />
        <SMDCap pos={[-0.25, 0.06, -0.1]} color="#aa4444" />

        {/* Ultrasonic beam visualization */}
        {simState === "running" && distance > 2 && (
          <group position={[0, 0.08, 0.15]}>
            <mesh>
              <coneGeometry args={[distance*0.012, distance*0.015, 12]} rotation={[Math.PI/2,0,0] as any} />
              <meshBasicMaterial color="#44aaff" transparent opacity={0.06} />
            </mesh>
          </group>
        )}

        {/* Label */}
        <Text position={[0, 0.056, -0.16]} fontSize={0.055} color="#aaccff"
          anchorX="center" rotation={[-Math.PI/2,0,0]}>
          HC-SR04
        </Text>

        {selected && <SelectionOutline size={[0.95, 0.35, 0.55]} />}
        <CuboidCollider args={[0.425, 0.1, 0.225]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic DHT22 sensor ────────────────────────────────

export function RealisticDHT22({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const temp = (component.properties.temperature as number) || 25;
  const hum  = (component.properties.humidity  as number) || 60;

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.004}>
      <group onClick={select}>
        {/* White housing */}
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.3, 0.18]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.7} />
        </mesh>
        {/* Vent holes on face */}
        {Array.from({length: 3}).map((_,row) =>
          Array.from({length: 5}).map((_,col) => (
            <mesh key={`${row}-${col}`} position={[0.14 - col*0.05, 0.08 - row*0.08, 0.092]}>
              <boxGeometry args={[0.025, 0.025, 0.01]} />
              <meshStandardMaterial color="#aaaaaa" roughness={0.8} />
            </mesh>
          ))
        )}
        {/* Sensor label */}
        <Text position={[-0.05, 0.05, 0.095]} fontSize={0.055} color="#333" anchorX="center" rotation={[0,0,0]}>
          DHT22
        </Text>
        {/* 3 pin legs */}
        {[-0.08, 0, 0.08].map((x,i) => (
          <mesh key={i} position={[x, -0.22, 0]} castShadow>
            <boxGeometry args={[0.025, 0.15, 0.025]} />
            <meshStandardMaterial color={SILVER} metalness={0.85} roughness={0.1} />
          </mesh>
        ))}
        {selected && <SelectionOutline size={[0.45, 0.55, 0.28]} />}
        <CuboidCollider args={[0.175, 0.15, 0.09]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic MPU-6050 IMU ────────────────────────────────

export function RealisticMPU6050({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.003}>
      <group onClick={select}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.08, 0.38]} />
          <meshStandardMaterial color="#1a1a44" roughness={0.5} metalness={0.06} />
        </mesh>
        {/* Main IC */}
        <ICChip pos={[0, 0.06, 0]} size={[0.2, 0.04, 0.2]} label="MPU6050" />
        {/* SMD passives */}
        <SMDCap pos={[0.13, 0.045, 0.1]} />
        <SMDCap pos={[-0.13, 0.045, -0.1]} color="#663344" />
        {/* 8-pin header */}
        <group position={[0.17, 0.06, 0]}>
          <mesh><boxGeometry args={[0.1, 0.07, 0.38]} /><meshStandardMaterial color="#111" roughness={0.5} /></mesh>
          {Array.from({length: 8}).map((_,i) => (
            <mesh key={i} position={[0, 0.07, -0.17+i*0.05]} castShadow>
              <boxGeometry args={[0.03, 0.1, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.05} />
            </mesh>
          ))}
        </group>
        {/* AD0 LED */}
        <mesh position={[-0.15, 0.05, 0.14]} castShadow>
          <boxGeometry args={[0.035, 0.035, 0.035]} />
          <meshStandardMaterial color="#003300" emissive="#00aa44" emissiveIntensity={0.8} />
        </mesh>
        {selected && <SelectionOutline size={[0.52, 0.3, 0.48]} />}
        <CuboidCollider args={[0.21, 0.09, 0.19]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic SG90 Servo ──────────────────────────────────

export function RealisticSG90({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const hornRef = useRef<THREE.Group>(null);
  const angle   = (component.properties.angle as number) || 90;

  useFrame(() => {
    if (hornRef.current) {
      const t = ((angle - 90) * Math.PI) / 180;
      hornRef.current.rotation.y += (t - hornRef.current.rotation.y) * 0.12;
    }
  });

  return (
    <RigidBody type={component.isStatic?"fixed":"dynamic"} position={component.position} mass={0.009}>
      <group onClick={select}>
        {/* Main body */}
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.38, 0.28]} />
          <meshStandardMaterial color="#111122" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Top face */}
        <mesh position={[0, 0.19, 0]} castShadow>
          <boxGeometry args={[0.52, 0.01, 0.28]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.2} />
        </mesh>
        {/* Mounting ears */}
        {[-0.35, 0.35].map((x, i) => (
          <group key={i} position={[x, 0, 0.06]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.06, 0.16]} />
              <meshStandardMaterial color="#111122" roughness={0.3} />
            </mesh>
            {/* Mounting hole */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.07, 8]} />
              <meshStandardMaterial color="#080810" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* Output shaft housing */}
        <mesh position={[0, 0.22, 0.04]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.06, 12]} />
          <meshStandardMaterial color="#222233" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Splined output shaft */}
        <mesh position={[0, 0.26, 0.04]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 12]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Horn */}
        <group ref={hornRef as any} position={[0, 0.3, 0.04]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.025, 12]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0.13, 0, 0]} castShadow>
            <boxGeometry args={[0.24, 0.02, 0.04]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
          </mesh>
          {/* Horn holes */}
          {[0.05, 0.15, 0.22].map((x,i) => (
            <mesh key={i} position={[x, 0.015, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.025, 6]} />
              <meshStandardMaterial color="#cccccc" roughness={0.5} />
            </mesh>
          ))}
        </group>
        {/* 3-wire cable */}
        {["#ff4444","#cc0000","#ff9900"].map((col, i) => (
          <mesh key={i} position={[-0.26+i*0.025, -0.22, -0.08]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.25, 5]} />
            <meshStandardMaterial color={col} roughness={0.7} />
          </mesh>
        ))}
        {/* Label */}
        <Text position={[0, 0, 0.145]} fontSize={0.06} color="#4488ff" anchorX="center" rotation={[0,0,0]}>
          SG90
        </Text>
        {selected && <SelectionOutline size={[0.8, 0.65, 0.45]} />}
        <CuboidCollider args={[0.26, 0.2, 0.14]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic LED 5mm ─────────────────────────────────────

export function RealisticLED({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const brightness = (component.properties.brightness as number) || 0;
  const isOn       = brightness > 0;
  const colorMap: Record<string,string> = { red:"#ff2200", green:"#00ff44", blue:"#2244ff", yellow:"#ffdd00", white:"#ffffff" };
  const ledColor   = colorMap[component.properties.color as string] || "#ff2200";
  const dimColor   = ledColor + "22";

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.0005}>
      <group onClick={select}>
        {/* LED body — epoxy dome */}
        <mesh castShadow>
          <cylinderGeometry args={[0.075, 0.085, 0.11, 16]} />
          <meshStandardMaterial color={isOn ? ledColor : dimColor}
            emissive={isOn ? ledColor : "#000"} emissiveIntensity={isOn ? 2 : 0}
            transparent opacity={0.88} roughness={0.05} metalness={0.0} />
        </mesh>
        {/* Dome */}
        <mesh position={[0, 0.095, 0]} castShadow>
          <sphereGeometry args={[0.075, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} />
          <meshStandardMaterial color={isOn ? ledColor : dimColor}
            emissive={isOn ? ledColor : "#000"} emissiveIntensity={isOn ? 3 : 0}
            transparent opacity={0.85} roughness={0.02} />
        </mesh>
        {/* Die inside */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.03, 0.02, 0.03]} />
          <meshStandardMaterial color={isOn ? "#ffffff" : "#444"} emissive={isOn ? "#ffffff" : "#000"} emissiveIntensity={isOn ? 5 : 0} />
        </mesh>
        {/* Cathode (flat side) indicator */}
        <mesh position={[-0.06, 0, 0]}>
          <boxGeometry args={[0.01, 0.12, 0.02]} />
          <meshStandardMaterial color="#cccccc" metalness={0.5} transparent opacity={0.5} />
        </mesh>
        {/* Legs — anode longer */}
        <mesh position={[0.02, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 4]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[-0.02, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.18, 4]} />
          <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
        </mesh>
        {isOn && (
          <>
            <pointLight color={ledColor} intensity={brightness * 0.8} distance={2.5} />
            <mesh position={[0, 0.14, 0]}>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshBasicMaterial color={ledColor} transparent opacity={0.08} />
            </mesh>
          </>
        )}
        {selected && <SelectionOutline size={[0.22, 0.45, 0.22]} />}
        <CuboidCollider args={[0.09, 0.2, 0.09]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic Resistor ────────────────────────────────────

export function RealisticResistor({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);
  const resistance = (component.properties.resistance as number) || 220;

  // Decode resistance color bands
  const bandColors = resistance === 220   ? ["#ff0000","#ff0000","#8B4513","#d4a017"]
                   : resistance === 1000  ? ["#8B4513","#000000","#ff0000","#d4a017"]
                   : resistance === 10000 ? ["#8B4513","#000000","#ff9900","#d4a017"]
                   :                       ["#888888","#888888","#000000","#d4a017"];

  return (
    <RigidBody type="dynamic" position={component.position} mass={0.0005}>
      <group onClick={select} rotation={[0, 0, Math.PI/2]}>
        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.32, 12]} />
          <meshStandardMaterial color="#d4a574" roughness={0.85} />
        </mesh>
        {/* Color bands */}
        {bandColors.map((col, i) => (
          <mesh key={i} position={[0, -0.1 + i*0.072, 0]}>
            <cylinderGeometry args={[0.047, 0.047, 0.028, 12]} />
            <meshStandardMaterial color={col} roughness={0.5} />
          </mesh>
        ))}
        {/* Lead wires */}
        {[-1, 1].map((side, i) => (
          <mesh key={i} position={[0, side * 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.007, 0.007, 0.2, 4]} />
            <meshStandardMaterial color={SILVER} metalness={0.92} roughness={0.08} />
          </mesh>
        ))}
        {selected && <SelectionOutline size={[0.15, 0.55, 0.15]} />}
        <CuboidCollider args={[0.05, 0.22, 0.05]} />
      </group>
    </RigidBody>
  );
}

// ─── Realistic L298N Motor Driver ──────────────────────────

export function RealisticL298N({ component }: { component: SimComponent }) {
  const { select, selected } = useSelect(component.id);

  return (
    <RigidBody type="fixed" position={component.position} >
      <group onClick={select}>
        {/* Red PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.1, 0.75]} />
          <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.05} />
        </mesh>
        {/* L298N chip (large black package) */}
        <group position={[0, 0.1, 0.05]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.15, 0.38]} />
            <meshStandardMaterial color="#111" roughness={0.25} metalness={0.1} />
          </mesh>
          {/* Heatsink tabs */}
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.48, 0.06, 0.38]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
          <Text position={[0, 0.08, 0.2]} fontSize={0.055} color="#aaaaaa" anchorX="center" rotation={[0,0,0]}>
            L298N
          </Text>
        </group>
        {/* 5V regulator */}
        <group position={[-0.28, 0.08, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.06, 0.08]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.08, 0.06, 0.06]} />
            <meshStandardMaterial color={SILVER} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
        {/* Electrolytic cap */}
        <group position={[0.28, 0.13, -0.22]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.15, 10]} />
            <meshStandardMaterial color="#223366" roughness={0.4} />
          </mesh>
        </group>
        {/* Screw terminals — motor output */}
        {[[-0.32, 0, 0.32],[0.32, 0, 0.32]].map(([x,y,z],i) => (
          <group key={i} position={[x, 0.09, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.12, 0.12]} />
              <meshStandardMaterial color="#228833" roughness={0.5} />
            </mesh>
            {/* Screw heads */}
            {[-0.045, 0.045].map((dx,j) => (
              <mesh key={j} position={[dx, 0.07, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
                <meshStandardMaterial color={SILVER} metalness={0.8} roughness={0.2} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Power screw terminal */}
        <group position={[0, 0.09, 0.32]}>
          <mesh castShadow>
            <boxGeometry args={[0.28, 0.12, 0.12]} />
            <meshStandardMaterial color="#228833" roughness={0.5} />
          </mesh>
        </group>
        {/* Logic pin header */}
        <group position={[0.35, 0.09, -0.12]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.08, 0.5]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          {Array.from({length: 10}).map((_,i) => (
            <mesh key={i} position={[0, 0.08, -0.23+i*0.052]} castShadow>
              <boxGeometry args={[0.03, 0.12, 0.03]} />
              <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.05} />
            </mesh>
          ))}
        </group>
        {selected && <SelectionOutline size={[0.95, 0.45, 0.85]} />}
        <CuboidCollider args={[0.425, 0.15, 0.375]} />
      </group>
    </RigidBody>
  );
}
