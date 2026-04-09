import React, { Suspense, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";

/**
 * A generic renderer for robots that can load GLB models.
 * If no model is provided, it falls back to a procedural representation.
 */
export function RobotRenderer({ component, modelUrl }: { component: any; modelUrl?: string }) {
  const select = useSimulationStore((s) => s.selectComponent);
  const simState = useSimulationStore((s) => s.simState);
  const rbRef = useRef<any>(null);
  
  const linearVel = (component.properties.linear_vel as number) || 0;
  const angularVel = (component.properties.angular_vel as number) || 0;

  useFrame(() => {
    if (simState === "running" && rbRef.current) {
      // Apply ROS velocities to the physics body
      const rotation = rbRef.current.rotation();
      const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
      
      // Linear velocity in local X direction (forward)
      const forward = new THREE.Vector3(linearVel * 5, 0, 0).applyQuaternion(quat);
      rbRef.current.setLinvel({ x: forward.x, y: rbRef.current.linvel().y, z: forward.z }, true);
      
      // Angular velocity around local Y axis (up)
      rbRef.current.setAngvel({ x: 0, y: -angularVel * 2, z: 0 }, true);
    }
  });
  
  return (
    <RigidBody 
      ref={rbRef}
      type="dynamic" 
      position={component.position} 
      mass={component.mass || 1.5}
      colliders={false}
    >
      <group onClick={(e) => { e.stopPropagation(); select(component.id); }}>
        <Suspense fallback={<mesh><boxGeometry args={[1, 0.5, 1]} /><meshStandardMaterial color="orange" wireframe /></mesh>}>
          {modelUrl ? (
            <GLBModel url={modelUrl} scale={component.scale || [1, 1, 1]} />
          ) : (
            <ProceduralRobot component={component} />
          )}
        </Suspense>
      </group>
      <CuboidCollider args={[0.6, 0.2, 0.4]} />
    </RigidBody>
  );
}

function GLBModel({ url, scale }: { url: string; scale: [number, number, number] }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} scale={scale} />;
}

function ProceduralRobot({ component }: { component: any }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1.2, 0.4, 0.8]} />
      <meshStandardMaterial color="#2a3a5a" roughness={0.4} metalness={0.6} />
    </mesh>
  );
}
