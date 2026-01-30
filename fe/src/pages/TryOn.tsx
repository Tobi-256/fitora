import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Avatar3D from '../components/Avatar3D';
import { useAuth } from '../contexts/useAuth';
import { updateProfile } from '../services/userService';

// --- 1. DỮ LIỆU MẪU (Đã sửa category thành 'T-Shirt' và 'Pants' giống DB của cậu) ---
const SAMPLE_WARDROBE = [
    { id: 1, category: 'T-Shirt', name: 'Áo Thun Basic', img: 'https://via.placeholder.com/50', url: '/ao/ao_size_S.glb' },
    { id: 3, category: 'Pants', name: 'Quần Jeans Xanh', img: 'https://via.placeholder.com/50', url: '/quan/quan_dai_1.glb' },
];

const defaultBody = {
    height: 1, weight: 1, shoulder: 1, chest: 1, waist: 1, hip: 1,
};

// Interface Slider (Giữ nguyên)
interface SliderProps {
    label: string; min: number; max: number; step: number; value: number; onChange: (val: number) => void; unit: string; displayValue: string;
}
function SliderWithValue({ label, min, max, step, value, onChange, displayValue }: SliderProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ minWidth: 70 }}>{label}</span>
            <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ minWidth: 50, textAlign: 'right', fontWeight: 500 }}>{displayValue}</span>
        </div>
    );
}

export default function TryOn() {
    const { userProfile, refreshUserProfile } = useAuth();
    const location = useLocation();
    
    const [body, setBody] = useState(defaultBody);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    // --- QUẢN LÝ TRẠNG THÁI MẶC ĐỒ ---
    const [wearing, setWearing] = useState<{ shirt: string | null; pants: string | null }>({
        shirt: null,
        pants: null
    });

    // 1. Load số đo body
    useEffect(() => {
        if (userProfile) {
            setBody({
                height: userProfile.height || defaultBody.height,
                weight: userProfile.weight || defaultBody.weight,
                shoulder: userProfile.shoulder || defaultBody.shoulder,
                chest: userProfile.chest || defaultBody.chest,
                waist: userProfile.waist || defaultBody.waist,
                hip: userProfile.hip || defaultBody.hip,
            });
        }
    }, [userProfile]);

    // 2. Nhận dữ liệu từ trang Product gửi sang
    useEffect(() => {
        if (location.state && location.state.modelUrl) {
            // Lấy đúng category từ DB gửi sang
            const { modelUrl, category } = location.state;
            handleWearItem(category, modelUrl);
        }
    }, [location.state]);

    // --- HÀM XỬ LÝ MẶC ĐỒ (LOGIC CHÍNH ĐÃ SỬA) ---
    const handleWearItem = (category: string, url: string) => {
        console.log("Đang thử đồ category:", category); // Debug xem đúng chuỗi không

        // Chuẩn hóa chuỗi (đề phòng có khoảng trắng thừa)
        const cleanCat = category ? category.trim() : "";

        // Logic so sánh chính xác với DB
        if (cleanCat === 'T-Shirt') {
            setWearing(prev => ({ ...prev, shirt: url })); // Gán vào slot áo
        } else if (cleanCat === 'Pants') {
            setWearing(prev => ({ ...prev, pants: url })); // Gán vào slot quần
        } else {
            // Fallback (Dự phòng cho các loại khác nếu có sau này)
            const catLower = cleanCat.toLowerCase();
            if (catLower.includes('shirt') || catLower.includes('top')) {
                setWearing(prev => ({ ...prev, shirt: url }));
            } else if (catLower.includes('pant') || catLower.includes('jean')) {
                setWearing(prev => ({ ...prev, pants: url }));
            }
        }
    };

    const handleSlider = (key: keyof typeof body, value: number) => {
        setBody(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleReset = () => {
        setBody(defaultBody);
        setSaved(false);
        setResetKey(prev => prev + 1);
        setWearing({ shirt: null, pants: null });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile(body);
            await refreshUserProfile();
            setSaved(true);
        } catch (error) {
            console.error("Lỗi lưu:", error);
            alert("Không thể lưu số đo.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#fafbfc' }}>
            <div style={{ flex: 1, padding: '24px 60px', display: 'flex', flexDirection: 'column' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 24, margin: 0 }}>Phòng Thử Đồ Ảo</h2>
                    <div style={{ color: '#666' }}>Tùy chỉnh avatar để tìm size chuẩn nhất</div>
                </header>

                <div style={{ display: 'flex', gap: 20, flex: 1, height: 'calc(100vh - 120px)' }}>
                    
                    {/* --- CỘT TRÁI: KHU VỰC HIỂN THỊ 3D --- */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ flex: 1, minHeight: 0, position: 'relative', background: 'white', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Avatar3D
                                key={resetKey}
                                height={body.height}
                                weight={body.weight}
                                shoulder={body.shoulder}
                                chest={body.chest}
                                waist={body.waist}
                                hip={body.hip}
                                shirtUrl={wearing.shirt}
                                pantsUrl={wearing.pants}
                            />
                            
                            {/* Badge thông báo */}
                            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {wearing.shirt && <span style={{fontSize:12, background:'rgba(255,255,255,0.9)', padding:'4px 8px', borderRadius:4, color: '#333'}}>👕 Áo: T-Shirt</span>}
                                {wearing.pants && <span style={{fontSize:12, background:'rgba(255,255,255,0.9)', padding:'4px 8px', borderRadius:4, color: '#333'}}>👖 Quần: Pants</span>}
                            </div>
                        </div>

                        {/* --- MENU CHỌN ĐỒ (Đã khớp category DB) --- */}
                        <div style={{ height: 140, background: '#fff', borderRadius: 12, padding: 16, overflowX: 'auto', border: '1px solid #eee' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#444' }}>Tủ đồ mẫu (Test):</h4>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {SAMPLE_WARDROBE.map(item => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleWearItem(item.category, item.url)}
                                        style={{ 
                                            minWidth: 90, cursor: 'pointer', textAlign: 'center', 
                                            padding: 8, borderRadius: 8, border: '1px solid #eee',
                                            background: (wearing.shirt === item.url || wearing.pants === item.url) ? '#eef4ff' : 'transparent',
                                            borderColor: (wearing.shirt === item.url || wearing.pants === item.url) ? '#2a6be0' : '#eee',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: '50%', margin: '0 auto 5px', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 20 }}>
                                            {item.category === 'T-Shirt' ? '👕' : '👖'}
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{item.name}</div>
                                        <div style={{ fontSize: 10, color: '#888' }}>{item.category}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- CỘT PHẢI: BẢNG ĐIỀU KHIỂN (Giữ nguyên) --- */}
                    <div style={{ flex: 1, minWidth: 280, maxWidth: 350, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: 24, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <div style={{ fontWeight: 700, fontSize: 18 }}>Số đo cơ thể</div>
                            <button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Mặc định</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <SliderWithValue label="Chiều cao" min={0.8} max={1.2} step={0.01} value={body.height} onChange={v => handleSlider('height', v)} unit="m" displayValue={Math.round(body.height * 170) + ' cm'} />
                            <SliderWithValue label="Cân nặng" min={0.8} max={1.2} step={0.01} value={body.weight} onChange={v => handleSlider('weight', v)} unit="kg" displayValue={Math.round(body.weight * 50) + 60 + ' kg'} />
                            <div style={{ height: 1, background: '#eee', margin: '8px 0' }} />
                            <SliderWithValue label="Vai" min={0.8} max={1.2} step={0.01} value={body.shoulder} onChange={v => handleSlider('shoulder', v)} unit="cm" displayValue={Math.round(body.shoulder * 40) + 6 + ' cm'} />
                            <SliderWithValue label="Ngực" min={0.8} max={1.2} step={0.01} value={body.chest} onChange={v => handleSlider('chest', v)} unit="cm" displayValue={Math.round(body.chest * 80) + 16 + ' cm'} />
                            <SliderWithValue label="Eo" min={0.8} max={1.2} step={0.01} value={body.waist} onChange={v => handleSlider('waist', v)} unit="cm" displayValue={Math.round(body.waist * 65) + 15 + ' cm'} />
                            <SliderWithValue label="Mông" min={0.8} max={1.2} step={0.01} value={body.hip} onChange={v => handleSlider('hip', v)} unit="cm" displayValue={Math.round(body.hip * 80) + 14 + ' cm'} />
                        </div>

                        <div style={{ marginTop: 40 }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
                            >
                                {saving ? 'Đang lưu...' : 'Lưu Số Đo'}
                            </button>
                            {saved && <div style={{ color: '#2a6be0', marginTop: 12, textAlign: 'center', fontSize: 13, background: '#eef4ff', padding: 8, borderRadius: 6 }}>Đã cập nhật hồ sơ thành công!</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}