import { Suspense, Component, useEffect, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, useProgress } from '@react-three/drei';
import { OBJLoader, GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';

// --- 1. CẤU HÌNH VỊ TRÍ ĐỒ THEO GIỚI TÍNH ---
// Bạn chỉnh các thông số này để khớp với model của mình
const GENDER_OFFSETS = {
  male: {
    shirt: 0.15, // Vị trí áo Nam hiện tại của bạn
    pants: 0.15  // Vị trí quần Nam hiện tại của bạn
  },
  female: {
    shirt: 0.003, // VÍ DỤ: Hạ thấp xuống để khớp vai nữ (Chỉnh số này)
    pants: 0.15  // VÍ DỤ: Hạ thấp xuống để khớp hông nữ (Chỉnh số này)
  }
};

interface HumanModelProps {
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  gender: 'male' | 'female';
  shirtUrl?: string;
  pantsUrl?: string;
}

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function Loader() {
  const { progress } = useProgress();
  return <Html center><div style={{ background: 'white', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{progress.toFixed(0)}% Loading...</div></Html>;
}

const applyBodyDeformation = (mesh: THREE.Mesh, originalArray: Float32Array, props: HumanModelProps) => {
  const { height, weight, shoulder, chest, waist, hip } = props;
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const currentMinY = box.min.y;
  const currentMaxY = box.max.y;
  const currentRangeY = currentMaxY - currentMinY;

  for (let i = 0; i < positions.count; i++) {
    const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
    const x = originalArray[ix], y = originalArray[iy], z = originalArray[iz];

    const normY = (y - currentMinY) / (currentRangeY || 1);
    const distFromSpine = Math.sqrt(x * x + z * z);
    
    let scaleX = weight;
    let scaleZ = weight;
    const torsoMask = Math.max(0, 1 - Math.pow(distFromSpine / 0.45, 2));

    if (torsoMask > 0) {
      if (normY > 0.75 && normY < 0.92) scaleX += (shoulder - 1) * 0.3 * ((1 - Math.abs(normY - 0.85) / 0.1) * torsoMask);
      if (normY > 0.62 && normY < 0.82) {
        const influence = (1 - Math.abs(normY - 0.72) / 0.15) * torsoMask;
        scaleX += (chest - 1) * 0.6 * influence;
        scaleZ += (chest - 1) * 0.8 * influence;
      }
      if (normY > 0.45 && normY < 0.65) {
        const influence = (1 - Math.abs(normY - 0.55) / 0.12) * torsoMask;
        scaleX += (waist - 1) * 0.9 * influence;
        scaleZ += (waist - 1) * 0.9 * influence;
      }
      if (normY > 0.25 && normY < 0.52) {
        const influence = (1 - Math.abs(normY - 0.4) / 0.15) * torsoMask;
        scaleX += (hip - 1) * 1.0 * influence;
        scaleZ += (hip - 1) * 1.0 * influence;
      }
    }

    positions.setX(i, x * scaleX);
    positions.setY(i, y * height);
    positions.setZ(i, z * scaleZ);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
};

function ManagedModel({ url, props, type, yOffset = 0 }: { url: string, props: HumanModelProps, type: 'body' | 'shirt' | 'pants', yOffset?: number }) {
  const isOBJ = url.toLowerCase().endsWith('.obj');
  const loadedModel = useLoader(isOBJ ? OBJLoader : GLTFLoader, url);
  const rawScene = (loadedModel as any).scene || loadedModel;
  
  const clonedObj = useMemo(() => rawScene.clone(), [rawScene, url]);
  const originalPositionsRef = useRef<Map<string, Float32Array>>(new Map());

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedObj);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    clonedObj.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry.translate(-center.x, 0, -center.z);
        child.geometry = child.geometry.clone();
        originalPositionsRef.current.set(child.uuid, child.geometry.attributes.position.array.slice());
      }
    });

    clonedObj.position.set(0, yOffset, 0); 
  }, [clonedObj, yOffset]);

  useEffect(() => {
    if (type === 'body') {
      clonedObj.traverse((child: any) => {
        if (child.isMesh && originalPositionsRef.current.has(child.uuid)) {
          applyBodyDeformation(child, originalPositionsRef.current.get(child.uuid)!, props);
        }
      });
    }
  }, [clonedObj, props, type]);

  return <primitive object={clonedObj} />;
}

export default function Avatar3D(props: HumanModelProps) {
  const { gender, shirtUrl, pantsUrl } = props;
  const bodyUrl = gender === 'male' ? '/models/model.OBJ' : '/models/female.obj';

  // 2. LẤY OFFSET TƯƠNG ỨNG GIỚI TÍNH
  const offsets = GENDER_OFFSETS[gender];

  return (
    <div style={{ width: '100%', height: '100%', background: '#f0f4f8', borderRadius: 16 }}>
      <Canvas camera={{ position: [0, 1.2, 4], fov: 35 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        
        <Suspense fallback={<Loader />}>
          <group position={[0, -0.9, 0]}>
            <ModelErrorBoundary fallback={<mesh><boxGeometry args={[0.5, 1.5, 0.5]} /><meshStandardMaterial color="red" wireframe /></mesh>}>
              
              <ManagedModel url={bodyUrl} props={props} type="body" yOffset={0} />
              
              {/* Áo: Dùng offset của Nam hoặc Nữ tùy theo props.gender */}
              {shirtUrl && (
                <ManagedModel 
                  url={shirtUrl} 
                  props={props} 
                  type="shirt" 
                  yOffset={offsets.shirt} 
                />
              )}
              
              {/* Quần: Dùng offset của Nam hoặc Nữ tùy theo props.gender */}
              {pantsUrl && (
                <ManagedModel 
                  url={pantsUrl} 
                  props={props} 
                  type="pants" 
                  yOffset={offsets.pants} 
                />
              )}
              
            </ModelErrorBoundary>
          </group>
        </Suspense>

        <OrbitControls target={[0, 0.5, 0]} minDistance={1.5} maxDistance={6} enablePan={false} />
      </Canvas>
    </div>
  );
}