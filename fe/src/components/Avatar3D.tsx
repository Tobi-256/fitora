import React, { useState, Suspense, Component, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center, Html, useProgress } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
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

interface HumanOBJModelProps {
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
}

function HumanOBJModel({ height, weight, shoulder, chest, waist, hip }: HumanOBJModelProps) {
  const obj = useLoader(OBJLoader, '/models/model.OBJ');

  // Clone the object to avoid mutating the cached original directly
  const clonedObj = React.useMemo(() => obj.clone(), [obj]);
  // Store original positions to avoid accumulation errors
  const originalPositionsRef = useRef<Map<string, Float32Array>>(new Map());

  // Capture original positions once
  useEffect(() => {
    if (!clonedObj) return;

    clonedObj.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry = child.geometry.clone();
        const geometry = child.geometry;
        if (!geometry.attributes.position) return;

        // Save original positions if not already saved
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

        // Heuristic constants for model height (assuming model is roughly 1.7m - 1.8m tall in local units)
        // Adjust these thresholds based on where body parts actually are on your specific OBJ
        // Normalized Y usually: Head ~1.7, Neck ~1.5, Shoulder ~1.4, Chest ~1.3, Waist ~1.0, Hip ~0.8, Knees ~0.5

        // Find bounding box to normalize Y
        geometry.computeBoundingBox();
        const minY = geometry.boundingBox?.min.y || 0;
        const maxY = geometry.boundingBox?.max.y || 1.8;
        const rangeY = maxY - minY;

        // Calculate approximate center X of the model to distinguish left/right
        const centerX = (geometry.boundingBox?.min.x + geometry.boundingBox?.max.x) / 2;

        for (let i = 0; i < positions.count; i++) {
          const ix = i * 3;
          const iy = i * 3 + 1;
          const iz = i * 3 + 2;

          const x = originalArray[ix];
          const y = originalArray[iy];
          const z = originalArray[iz];

          // Normalize Y (0.0 at feet, 1.0 at head)
          const normY = (y - minY) / rangeY;

          // Distance from center line (spine)
          const distFromSpine = Math.abs(x - centerX);

          let scaleX = 1;
          let scaleZ = 1;

          // Global Weight (fat) - affects everything but less on extremities
          // Hands/Arms usually have larger distFromSpine. 
          // We want to affect core body more.
          scaleX *= weight;
          scaleZ *= weight;

          // --- Regional Deformations ---
          // Only apply if vertex is close enough to spine (Torso check)
          // Assuming model units, if dist > 0.35 it might be arms (adjust based on your model)
          // We use a "Mask" to fade out effect on arms
          const torsoMask = Math.max(0, 1 - Math.pow(distFromSpine / 0.35, 2)); // Fade out as we go away from center

          if (torsoMask > 0.1) {
            // Shoulder (High Y: ~0.75 - 0.9)
            if (normY > 0.75 && normY < 0.95) {
              const influence = (1 - Math.abs(normY - 0.85) / 0.15) * torsoMask;
              if (influence > 0) {
                scaleX += (shoulder - 1) * influence;
              }
            }

            // Chest (Upper Mid Y: ~0.6 - 0.8)
            if (normY > 0.6 && normY < 0.8) {
              const influence = (1 - Math.abs(normY - 0.7) / 0.15) * torsoMask;
              if (influence > 0) {
                scaleX += (chest - 1) * 0.8 * influence;
                scaleZ += (chest - 1) * influence;
              }
            }

            // Waist (Mid Y: ~0.45 - 0.6)
            if (normY > 0.45 && normY < 0.65) {
              const influence = (1 - Math.abs(normY - 0.55) / 0.15) * torsoMask;
              if (influence > 0) {
                scaleX += (waist - 1) * influence;
                scaleZ += (waist - 1) * influence;
              }
            }

            // Hip (Low Mid Y: ~0.3 - 0.5)
            if (normY > 0.3 && normY < 0.55) {
              const influence = (1 - Math.abs(normY - 0.42) / 0.15) * torsoMask;
              if (influence > 0) {
                scaleX += (hip - 1) * influence;
                scaleZ += (hip - 1) * influence;
              }
            }
          }

          // Apply transforms
          // We transform from the center X/Z (assuming model is centered at 0,0)
          positions.setX(i, x * scaleX);
          positions.setZ(i, z * scaleZ);
          // Height is handled by root scale, but we could modify Y here too if needed.
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals(); // Recompute lighting
      }
    });

  }, [clonedObj, height, weight, shoulder, chest, waist, hip]);

  // Height is handled globally as it linearly stretches positions
  return <primitive object={clonedObj} scale={[1, height, 1]} />;
}

function FallbackModel({ height, shoulder }: any) {
  return (
    <mesh>
      <capsuleGeometry args={[0.3 * shoulder, 1 * height, 4, 8]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  );
}

export default function Avatar3D({ height, weight, shoulder, chest, waist, hip }: HumanOBJModelProps) {
  const [modelError, setModelError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false); // Default off now

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, background: 'linear-gradient(to bottom, #f0f2f5, #e1e4e8)', borderRadius: 16, overflow: 'hidden' }}>

      {/* Debug Controls */}
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
              onError={(e: any) => setModelError(e.message || "Failed to load model")}
            >
              <HumanOBJModel
                height={height}
                weight={weight}
                shoulder={shoulder}
                chest={chest}
                waist={waist}
                hip={hip}
              />
            </ModelErrorBoundary>
          </Center>
        </Suspense>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} target={[0, 1, 0]} />
      </Canvas>
    </div>
  );
}
