import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Avatar3D from '../components/Avatar3D';
import { useAuth } from '../contexts/useAuth';
import { updateProfile } from '../services/userService';

// --- 1. Dữ liệu mốc chuẩn cho từng giới tính ---
const MEASUREMENTS = {
    male: { height: 175, weight: 70, shoulder: 42, chest: 90, waist: 75, hip: 92 },
    female: { height: 160, weight: 50, shoulder: 36, chest: 82, waist: 64, hip: 88 }
};

// --- 2. Dữ liệu tủ đồ mẫu (Bạn hãy thay đổi URL file .glb thực tế của bạn tại đây) ---
const MOCK_CLOTHES = [
    { id: 1, name: 'Áo thun Nam', gender: 'male', category: 'shirt', url: '/ao/ao_size_S.glb' },
    { id: 2, name: 'Quần Jean Nam', gender: 'male', category: 'pants', url: '/quan/quan_dai_3.glb' },
    { id: 3, name: 'áo vest + quần sọt ', gender: 'female', category: 'shirt', url: '/ao/vest_pink.glb' },
    { id: 4, name: 'Áo Dài Đỏ ', gender: 'female', category: 'shirt', url: '/ao/aodai.glb' },

];

export default function TryOn() {
    const { userProfile, refreshUserProfile } = useAuth();
    const location = useLocation();
    const incomingProduct = location.state as any;

    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // State lưu tỷ lệ (Scale)
    const [bodyScale, setBodyScale] = useState({
        height: 1, weight: 1, shoulder: 1, chest: 1, waist: 1, hip: 1,
    });

    // State quản lý đồ đang mặc
    const [shirtUrl, setShirtUrl] = useState<string | undefined>(undefined);
    const [pantsUrl, setPantsUrl] = useState<string | undefined>(undefined);

    // --- Logic chuyển đổi ---
    const getBase = () => MEASUREMENTS[gender];
    const convertScaleToUnit = (key: keyof typeof MEASUREMENTS.male, scale: number) => {
        return Math.round(getBase()[key] * scale);
    };
    const convertUnitToScale = (key: keyof typeof MEASUREMENTS.male, unit: number, targetGender: 'male' | 'female') => {
        return unit / MEASUREMENTS[targetGender][key];
    };

    // --- Xử lý sự kiện ---
    const handleGenderChange = (newGender: 'male' | 'female') => {
        if (newGender === gender) return;
        setGender(newGender);
        setBodyScale({ height: 1, weight: 1, shoulder: 1, chest: 1, waist: 1, hip: 1 });
        setShirtUrl(undefined); // Cởi đồ cũ khi đổi giới tính
        setPantsUrl(undefined);
        setSaved(false);
    };

    const handleSliderChange = (key: string, value: number) => {
        setBodyScale(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSelectItem = (item: any) => {
        if (item.category === 'shirt') setShirtUrl(item.url);
        else setPantsUrl(item.url);
    };

    // Load đồ từ Product Detail
    useEffect(() => {
        if (incomingProduct?.modelUrl) {
            const cat = incomingProduct.category?.toLowerCase() || '';
            if (cat.includes('pant') || cat.includes('quần')) setPantsUrl(incomingProduct.modelUrl);
            else setShirtUrl(incomingProduct.modelUrl);
        }
    }, [incomingProduct]);

    // Load Profile người dùng
    useEffect(() => {
        if (userProfile) {
            const userGender = (userProfile.gender as 'male' | 'female') || 'male';
            setGender(userGender);
            setBodyScale({
                height: userProfile.height ? convertUnitToScale('height', userProfile.height, userGender) : 1,
                weight: userProfile.weight ? convertUnitToScale('weight', userProfile.weight, userGender) : 1,
                shoulder: userProfile.shoulder ? convertUnitToScale('shoulder', userProfile.shoulder, userGender) : 1,
                chest: userProfile.chest ? convertUnitToScale('chest', userProfile.chest, userGender) : 1,
                waist: userProfile.waist ? convertUnitToScale('waist', userProfile.waist, userGender) : 1,
                hip: userProfile.hip ? convertUnitToScale('hip', userProfile.hip, userGender) : 1,
            });
        }
    }, [userProfile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const dataToSave = {
                height: convertScaleToUnit('height', bodyScale.height),
                weight: convertScaleToUnit('weight', bodyScale.weight),
                shoulder: convertScaleToUnit('shoulder', bodyScale.shoulder),
                chest: convertScaleToUnit('chest', bodyScale.chest),
                waist: convertScaleToUnit('waist', bodyScale.waist),
                hip: convertScaleToUnit('hip', bodyScale.hip),
                gender
            };
            await updateProfile(dataToSave);
            await refreshUserProfile();
            setSaved(true);
        } catch (error) { console.error(error); } finally { setSaving(false); }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '18px' }}>FITTORA STUDIO</h3>
                </header>

                <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
                    {/* KHU VỰC HIỂN THỊ 3D */}
                    <div style={{ flex: 1, background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                        <Avatar3D {...bodyScale} gender={gender} shirtUrl={shirtUrl} pantsUrl={pantsUrl} />
                        <button
                            onClick={() => { setShirtUrl(undefined); setPantsUrl(undefined); }}
                            style={{ position: 'absolute', bottom: 16, right: 16, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                        >
                            Làm mới đồ
                        </button>
                    </div>

                    {/* SIDEBAR TỔNG HỢP */}
                    <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* PHẦN 1: TÙY CHỈNH CƠ THỂ */}
                        <div style={{ background: '#fff', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                                    {saving ? 'Đang lưu...' : 'Lưu thông số'}
                                </button>
                                <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
                                    * Số đo và kích thước quần áo có thể sai lệch so với thực tế
                                </div>
                                {saved && <div style={{ color: '#10b981', fontSize: '11px', textAlign: 'center', marginTop: '6px', fontWeight: 600 }}>✓ Đã cập nhật hồ sơ</div>}
                            </div>

                            <div style={{ padding: '16px', overflowY: 'auto', maxHeight: '350px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>GIỚI TÍNH</div>
                                    <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                                        <button onClick={() => handleGenderChange('male')} style={genderBtnStyle(gender === 'male')}>Nam</button>
                                        <button onClick={() => handleGenderChange('female')} style={genderBtnStyle(gender === 'female')}>Nữ</button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <SliderWithValue label="Chiều cao" min={0.8} max={1.2} step={0.001} value={bodyScale.height} onChange={(v: number) => handleSliderChange('height', v)} displayValue={`${convertScaleToUnit('height', bodyScale.height)} cm`} />
                                    <SliderWithValue label="Cân nặng" min={0.7} max={1.3} step={0.001} value={bodyScale.weight} onChange={(v: number) => handleSliderChange('weight', v)} displayValue={`${convertScaleToUnit('weight', bodyScale.weight)} kg`} />
                                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                                    <SliderWithValue label="Vòng ngực" min={0.8} max={1.2} step={0.005} value={bodyScale.chest} onChange={(v: number) => handleSliderChange('chest', v)} displayValue={`${convertScaleToUnit('chest', bodyScale.chest)} cm`} />
                                    <SliderWithValue label="Vòng eo" min={0.8} max={1.2} step={0.005} value={bodyScale.waist} onChange={(v: number) => handleSliderChange('waist', v)} displayValue={`${convertScaleToUnit('waist', bodyScale.waist)} cm`} />
                                    <SliderWithValue label="Vòng hông" min={0.8} max={1.2} step={0.005} value={bodyScale.hip} onChange={(v: number) => handleSliderChange('hip', v)} displayValue={`${convertScaleToUnit('hip', bodyScale.hip)} cm`} />
                                </div>
                            </div>
                        </div>

                        {/* PHẦN 2: TỦ ĐỒ MIX & MATCH */}
                        <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Tủ đồ {gender === 'male' ? 'Nam' : 'Nữ'}</div>
                            <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {MOCK_CLOTHES.filter(i => i.gender === gender).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelectItem(item)}
                                        style={{
                                            padding: '8px', borderRadius: '12px', border: '1px solid', cursor: 'pointer', textAlign: 'center', transition: '0.2s',
                                            borderColor: (shirtUrl === item.url || pantsUrl === item.url) ? '#000' : '#f1f5f9',
                                            background: (shirtUrl === item.url || pantsUrl === item.url) ? '#f8fafc' : '#fff',
                                        }}
                                    >
                                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.category === 'shirt' ? '👕' : '👖'}</div>
                                        <div style={{ fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; outline: none; }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: #000; border-radius: 50%; cursor: pointer; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}

const genderBtnStyle = (isActive: boolean) => ({
    flex: 1, padding: '7px 0', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.2s',
    background: isActive ? '#fff' : 'transparent', color: isActive ? '#000' : '#94a3b8',
    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
});

function SliderWithValue({ label, min, max, step, value, onChange, displayValue }: any) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{displayValue}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        </div>
    );
}