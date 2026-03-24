import React, { Suspense, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * ─── Model Loader System ────────────────────────────────────
 * 
 * Loads and caches high-quality 3D models from Sketchfab or local assets.
 * Supports GLTF/GLB formats with automatic optimization and memory management.
 */

// Model registry mapping component types to model URLs
const MODEL_REGISTRY: Record<string, string> = {
  "humanoid-robot": "/models/robots/sumo-robot.glb",
};

// Cache for loaded models with reference counting
const modelCache: Record<string, { gltf: any; refCount: number }> = {};

/**
 * Hook to load a GLTF/GLB model with caching and proper cleanup
 */
export function useModelAsset(componentType: string) {
  const modelUrl = MODEL_REGISTRY[componentType];

  if (!modelUrl) {
    return null;
  }

  // Return cached model if available
  if (modelCache[modelUrl]) {
    modelCache[modelUrl].refCount++;
    return modelCache[modelUrl].gltf;
  }

  try {
    const gltf = useGLTF(modelUrl);
    
    // Store in cache with reference counting
    modelCache[modelUrl] = { gltf, refCount: 1 };
    
    return gltf;
  } catch (err) {
    console.error(`Failed to load model: ${modelUrl}`, err);
    return null;
  }
}

/**
 * Component to render a loaded GLTF model without cloning
 */
export function GLTFModel({
  componentType,
  position,
  rotation,
  scale,
  onLoad,
}: {
  componentType: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number] | number;
  onLoad?: (scene: THREE.Group) => void;
}) {
  const gltf = useModelAsset(componentType);
  const clonedSceneRef = React.useRef<THREE.Group | null>(null);

  // Clone the scene only once and reuse it
  useMemo(() => {
    if (gltf && !clonedSceneRef.current) {
      clonedSceneRef.current = gltf.scene.clone();
    }
  }, [gltf]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clonedSceneRef.current) {
        clonedSceneRef.current.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, []);

  if (!gltf || !clonedSceneRef.current) {
    return null;
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedSceneRef.current} onUpdate={(self) => onLoad?.(self)} />
    </group>
  );
}

/**
 * Simple fallback component using basic geometry
 */
export function ModelFallback({
  componentType,
  position,
  rotation,
  scale,
}: {
  componentType: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number] | number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff0000" wireframe />
      </mesh>
    </group>
  );
}

/**
 * Main component renderer that uses models when available
 */
export function ComponentRenderer({
  component,
}: {
  component: any;
}) {
  const modelUrl = MODEL_REGISTRY[component.type];
  const hasModel = !!modelUrl;

  if (!hasModel) {
    // Fallback to procedural rendering for unsupported components
    return <ModelFallback {...component} />;
  }

  return (
    <Suspense fallback={<ModelFallback {...component} />}>
      <GLTFModel
        componentType={component.type}
        position={component.position}
        rotation={component.rotation}
        scale={component.scale}
      />
    </Suspense>
  );
}

/**
 * Preload models for better performance
 */
export function preloadModels(componentTypes: string[]) {
  componentTypes.forEach((type) => {
    const url = MODEL_REGISTRY[type];
    if (url) {
      useGLTF.preload(url);
    }
  });
}

/**
 * Get model URL for a component type
 */
export function getModelURL(componentType: string): string | null {
  return MODEL_REGISTRY[componentType] || null;
}

/**
 * Register a custom model
 */
export function registerModel(componentType: string, modelUrl: string) {
  MODEL_REGISTRY[componentType] = modelUrl;
}

/**
 * Clear model cache to free memory
 */
export function clearModelCache() {
  Object.values(modelCache).forEach(({ gltf }) => {
    if (gltf.scene) {
      gltf.scene.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  });
  Object.keys(modelCache).forEach((key) => delete modelCache[key]);
}
