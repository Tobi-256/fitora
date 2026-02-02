import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Center, Html, useProgress, ContactShadows, Environment } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

// --- 1. COMPONENT HIỂN THỊ QUẦN ÁO (ĐÃ SỬA: SIZE CỐ ĐỊNH & LÀM MỊN) ---
interface ClothingModelProps {
    url: string;
    bodyScale: { height: number; weight: number; shoulder: number; chest: number; waist: number; hip: number; };
    category: 'top' | 'bottom';
}

function ClothingModel({ url, category }: ClothingModelProps) {
    const gltf = useLoader(GLTFLoader, url);
    const { gl } = useThree(); // Lấy thông số render để chỉnh độ nét

    // --- LOGIC SIZE CỐ ĐỊNH (FIXED SIZE) ---
    // Thay vì nhân với bodyScale, ta set cứng một con số (Ví dụ 1.08 là Size L chuẩn form)
    // Khi người to ra (> 1.08), thịt sẽ xuyên qua áo.
    // Khi người cao lên, áo sẽ thành áo ngắn (croptop).
    const FIXED_SCALE = 1.08;

    // Scale quần thường nhỏ hơn áo 1 xíu để áo phủ ngoài quần
    const scaleValue = category === 'top' ? FIXED_SCALE : (FIXED_SCALE - 0.01);

    const yPosition = category === 'top' ? 0.15 : 0;

    const clonedScene = React.useMemo(() => {
        const clone = gltf.scene.clone();

        const box = new THREE.Box3().setFromObject(clone);
        const center = box.getCenter(new THREE.Vector3());

        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.position.x -= center.x;
                child.position.z -= center.z;

                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.renderOrder = category === 'top' ? 3 : 2;

                // --- XỬ LÝ TEXTURE (LÀM MỊN / KHỬ RĂNG CƯA) ---
                if (mesh.material instanceof THREE.MeshStandardMaterial) {
                    const mat = mesh.material;

                    // 1. Tăng chất lượng ảnh (Fix lỗi "bể" hình)
                    if (mat.map) {
                        // Bật lọc bất đẳng hướng (Anisotropy) mức cao nhất -> Nhìn nghiêng vẫn nét
                        mat.map.anisotropy = gl.capabilities.getMaxAnisotropy();

                        // Bộ lọc tuyến tính giúp ảnh mượt hơn
                        mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                        mat.map.magFilter = THREE.LinearFilter;

                        mat.map.needsUpdate = true;
                    }

                    // 2. Tinh chỉnh chất liệu vải
                    mat.roughness = 0.8; // Vải thì không nên bóng quá (0.8 là vừa)
                    mat.metalness = 0.0;
                    mat.depthTest = true;
                    mat.transparent = false;
                }
            }
        });
        return clone;
    }, [gltf, url, category, gl]);

    return (
        <primitive
            object={clonedScene}
            position={[0, yPosition, 0]}
            // Áp dụng scale cố định -> Áo không dãn theo người
            scale={[scaleValue, scaleValue, scaleValue]}
        />
    );
}

// --- 2. COMPONENT MANNEQUIN (Giữ nguyên logic morphing của cậu) ---
function HumanOBJModel({ height, weight, shoulder, chest, waist, hip }: any) {
    const obj = useLoader(OBJLoader, '/models/model.OBJ');
    const clonedObj = React.useMemo(() => obj.clone(), [obj]);
    const originalPositionsRef = useRef<Map<string, Float32Array>>(new Map());

    useEffect(() => {
        clonedObj.traverse((child: any) => {
            if (child.isMesh) {
                child.geometry = child.geometry.clone();
                if (!originalPositionsRef.current.has(child.uuid)) {
                    originalPositionsRef.current.set(child.uuid, child.geometry.attributes.position.array.slice());
                }
                child.renderOrder = 1;
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                    child.material.color = new THREE.Color('#f0f0f0'); // Da sáng hơn chút
                    child.material.roughness = 0.6;
                }
            }
        });
    }, [clonedObj]);

    useEffect(() => {
        clonedObj.traverse((child: any) => {
            if (child.isMesh && originalPositionsRef.current.has(child.uuid)) {
                const geometry = child.geometry;
                const positions = geometry.attributes.position;
                const originalArray = originalPositionsRef.current.get(child.uuid)!;
                geometry.computeBoundingBox();
                const minY = geometry.boundingBox?.min.y || 0;
                const maxY = geometry.boundingBox?.max.y || 1.8;
                const rangeY = maxY - minY;

                for (let i = 0; i < positions.count; i++) {
                    const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
                    const x = originalArray[ix], y = originalArray[iy], z = originalArray[iz];
                    const normY = (y - minY) / rangeY;
                    let scaleX = weight, scaleZ = weight;

                    if (normY > 0.75 && normY < 0.95) scaleX += (shoulder - 1) * 0.5;
                    if (normY > 0.6 && normY < 0.8) { scaleX += (chest - 1) * 0.5; scaleZ += (chest - 1) * 0.5; }
                    if (normY > 0.45 && normY < 0.65) { scaleX += (waist - 1) * 0.5; scaleZ += (waist - 1) * 0.5; }
                    if (normY > 0.3 && normY < 0.55) { scaleX += (hip - 1) * 0.5; scaleZ += (hip - 1) * 0.5; }

                    positions.setX(i, x * scaleX);
                    positions.setZ(i, z * scaleZ);
                }
                positions.needsUpdate = true;
                geometry.computeVertexNormals();
            }
        });
    }, [clonedObj, height, weight, shoulder, chest, waist, hip]);

    return <primitive object={clonedObj} scale={[1, height, 1]} />;
}

// --- 3. UTILS & EXPORT ---
function Loader() {
    const { progress } = useProgress();
    return <Html center><div style={{ background: '#fff', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'sans-serif', fontWeight: 'bold' }}>{progress.toFixed(0)}% Loading...</div></Html>;
}

interface Avatar3DProps {
    height: number; weight: number; shoulder: number; chest: number; waist: number; hip: number;
    shirtUrl?: string | null;
    pantsUrl?: string | null;
}

export default function Avatar3D({ height, weight, shoulder, chest, waist, hip, shirtUrl, pantsUrl }: Avatar3DProps) {
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#f5f7fa' }}>
            <Canvas
                camera={{ position: [0, 1.4, 3.5], fov: 40 }}
                shadows
                dpr={[1, 2]} // 1. Tăng mật độ điểm ảnh (Sharpness) cho màn hình nét
                gl={{
                    antialias: true, // 2. Khử răng cưa
                    toneMapping: THREE.ReinhardToneMapping,
                    toneMappingExposure: 1.2
                }}
            >
                {/* Môi trường ánh sáng tự nhiên */}
                <Environment preset="city" />

                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
                <spotLight position={[0, 5, 2]} intensity={0.5} angle={0.5} penumbra={1} />

                <Suspense fallback={<Loader />}>
                    <Center disableY>
                        <group>
                            <HumanOBJModel height={height} weight={weight} shoulder={shoulder} chest={chest} waist={waist} hip={hip} />

                            {shirtUrl && (
                                <ClothingModel
                                    key={shirtUrl}
                                    url={shirtUrl}
                                    category="top"
                                    bodyScale={{ height, weight, shoulder, chest, waist, hip }}
                                />
                            )}

                            {pantsUrl && (
                                <ClothingModel
                                    key={pantsUrl}
                                    url={pantsUrl}
                                    category="bottom"
                                    bodyScale={{ height, weight, shoulder, chest, waist, hip }}
                                />
                            )}
                        </group>
                    </Center>

                    <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2.5} far={1} />
                </Suspense>

                <OrbitControls
                    target={[0, 0.9, 0]}
                    enablePan={false}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2 - 0.1}
                    enableDamping={true}
                    dampingFactor={0.05}
                />
            </Canvas>
        </div>
    );
}