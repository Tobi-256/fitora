import React, { useState, Suspense, Component, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center, Html, useProgress } from '@react-three/drei';
import { OBJLoader, GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';

// Custom Error Boundary for 3D Components
interface ErrorBoundaryProps {
  fallback: ReactNode;
  onError?: (error: unknown) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("3D Model Error:", error);
    if (this.props.onError) this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress.toFixed(1)} % loaded</Html>;
}

interface HumanModelProps {
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  gender: 'male' | 'female';
}

function HumanModel({ height, weight, shoulder, chest, waist, hip, gender }: HumanModelProps) {
  // Load either OBJ (male) or GLB (female)
  const isOBJ = gender === 'male';
  const modelUrl = isOBJ ? '/models/model.OBJ' : '/models/model.glb';

  const loadedModel = useLoader(isOBJ ? OBJLoader : GLTFLoader, modelUrl);

  // Extract scene for GLB or group for OBJ
  const scene = (loadedModel as any).scene || loadedModel;

  // Clone the object to avoid mutating the cached original directly
  const clonedObj = React.useMemo(() => scene.clone(), [scene]);
  const originalPositionsRef = useRef<Map<string, Float32Array>>(new Map());

  // Capture original positions once
  useEffect(() => {
    if (!clonedObj) return;

    clonedObj.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry = child.geometry.clone();
        const geometry = child.geometry;
        if (!geometry.attributes.position) return;

        if (!originalPositionsRef.current.has(child.uuid)) {
          originalPositionsRef.current.set(child.uuid, geometry.attributes.position.array.slice());
        }
      }
    });
  }, [clonedObj]);

  // Apply deformations
  useEffect(() => {
    if (!clonedObj) return;

    clonedObj.traverse((child: any) => {
      if (child.isMesh && originalPositionsRef.current.has(child.uuid)) {
        const geometry = child.geometry;
        const positions = geometry.attributes.position;
        const originalArray = originalPositionsRef.current.get(child.uuid)!;

        geometry.computeBoundingBox();
        const minY = geometry.boundingBox?.min.y || 0;
        const maxY = geometry.boundingBox?.max.y || 1.8;
        const rangeY = maxY - minY;
        const centerX = (geometry.boundingBox?.min.x + (geometry.boundingBox?.max.x || 0)) / 2;

        for (let i = 0; i < positions.count; i++) {
          const ix = i * 3;
          const iy = i * 3 + 1;
          const iz = i * 3 + 2;

          const x = originalArray[ix];
          const y = originalArray[iy];
          const z = originalArray[iz];

          const normY = (y - minY) / rangeY;
          const distFromSpine = Math.abs(x - centerX);

          let scaleX = 1;
          let scaleZ = 1;

          scaleX *= weight;
          scaleZ *= weight;

          // Regional Deformations (Approximate thresholds)
          const torsoThreshold = isOBJ ? 0.35 : 0.25; // GLB models often have different scales
          const torsoMask = Math.max(0, 1 - Math.pow(distFromSpine / torsoThreshold, 2));

          if (torsoMask > 0.1) {
            // Adjust normY ranges slightly if female model has different proportions
            // Shoulder (High Y)
            if (normY > 0.7 && normY < 0.95) {
              const targetY = isOBJ ? 0.85 : 0.82;
              const influence = (1 - Math.abs(normY - targetY) / 0.15) * torsoMask;
              if (influence > 0) scaleX += (shoulder - 1) * influence;
            }

            // Chest
            if (normY > 0.55 && normY < 0.8) {
              const targetY = isOBJ ? 0.7 : 0.68;
              const influence = (1 - Math.abs(normY - targetY) / 0.15) * torsoMask;
              if (influence > 0) {
                scaleX += (chest - 1) * 0.8 * influence;
                scaleZ += (chest - 1) * influence;
              }
            }

            // Waist
            if (normY > 0.4 && normY < 0.65) {
              const targetY = isOBJ ? 0.55 : 0.52;
              const influence = (1 - Math.abs(normY - targetY) / 0.15) * torsoMask;
              if (influence > 0) {
                scaleX += (waist - 1) * influence;
                scaleZ += (waist - 1) * influence;
              }
            }

            // Hip
            if (normY > 0.25 && normY < 0.55) {
              const targetY = isOBJ ? 0.42 : 0.38;
              const influence = (1 - Math.abs(normY - targetY) / 0.15) * torsoMask;
              if (influence > 0) {
                scaleX += (hip - 1) * influence;
                scaleZ += (hip - 1) * influence;
              }
            }
          }

          positions.setX(i, x * scaleX);
          positions.setY(i, y * height); // Apply height directly to Y
          positions.setZ(i, z * scaleZ);
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingBox(); // Important for Center component
      }
    });

  }, [clonedObj, height, weight, shoulder, chest, waist, hip, gender, isOBJ]);

  // Height is now handled in the vertex loop for better consistency across formats
  return <primitive object={clonedObj} />;
}

function FallbackModel({ height, shoulder }: any) {
  return (
    <mesh>
      <capsuleGeometry args={[0.3 * shoulder, 1 * height, 4, 8]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  );
}

export default function Avatar3D({ height, weight, shoulder, chest, waist, hip, gender }: HumanModelProps) {
  const [modelError, setModelError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, background: 'linear-gradient(to bottom, #f0f2f5, #e1e4e8)', borderRadius: 16, overflow: 'hidden' }}>

      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 4, color: '#fff', fontSize: 12 }}>
        <label>
          <input type="checkbox" checked={debugMode} onChange={e => setDebugMode(e.target.checked)} /> Debug View
        </label>
      </div>

      {modelError && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'red', textAlign: 'center', zIndex: 20 }}>
          <p>Model Error: {modelError}</p>
          <p>Showing Fallback...</p>
        </div>
      )}

      <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={1.2} />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {debugMode && (
          <>
            <gridHelper args={[10, 10]} />
            <axesHelper args={[2]} />
          </>
        )}

        <Suspense fallback={<Loader />}>
          <Center top>
            <ModelErrorBoundary
              fallback={<FallbackModel height={height} shoulder={shoulder} />}
              onError={(e) => setModelError(e.message || "Failed to load model")}
            >
              <HumanModel
                height={height}
                weight={weight}
                shoulder={shoulder}
                chest={chest}
                waist={waist}
                hip={hip}
                gender={gender}
              />
            </ModelErrorBoundary>
          </Center>
        </Suspense>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} target={[0, 1, 0]} />
      </Canvas>
    </div>
  );
}
