import { useState, useEffect } from 'react';
import Avatar3D from '../components/Avatar3D';
// import Sidebar from '../components/Sidebar';
// import ItemList from '../components/ItemList';
import { useAuth } from '../contexts/useAuth';
import { updateProfile } from '../services/userService';

const defaultBody = {
	height: 1,
	weight: 1,
	shoulder: 1,
	chest: 1,
	waist: 1,
	hip: 1,
};

export default function TryOn() {
	const { userProfile, refreshUserProfile } = useAuth();
	const [body, setBody] = useState(defaultBody);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [resetKey, setResetKey] = useState(0);

	// Load initial body measurements from user profile
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

	const handleSlider = (key: keyof typeof body, value: number) => {
		setBody(prev => ({ ...prev, [key]: value }));
		setSaved(false);
	};
	const handleReset = () => {
		setBody(defaultBody);
		setSaved(false);
		setResetKey(prev => prev + 1);
	};
	const handleSave = async () => {
		setSaving(true);
		try {
			await updateProfile(body);
			await refreshUserProfile();
			setSaved(true);
		} catch (error) {
			console.error("Failed to save measurements:", error);
			alert("Failed to save measurements. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div style={{ display: 'flex', minHeight: '100vh', background: '#fafbfc' }}>
			{/* <Sidebar /> */}
			<div style={{ flex: 1, padding: '24px 60px', display: 'flex', flexDirection: 'column' }}>
				<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
					<h2 style={{ fontSize: 24, margin: 0 }}>Virtual Fitting Room</h2>
					<div style={{ color: '#666' }}>Customize your avatar to find the perfect fit</div>
				</header>

				<div style={{ display: 'flex', gap: 20, flex: 1, height: 'calc(100vh - 120px)' }}>
					{/* Main Stage: Model View */}
					<div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 20 }}>
						<div style={{ flex: 1, minHeight: 0 }}>
							<Avatar3D
								key={resetKey}
								height={body.height}
								weight={body.weight}
								shoulder={body.shoulder}
								chest={body.chest}
								waist={body.waist}
								hip={body.hip}
							/>
						</div>
						<div style={{ height: 120 }}>
							{/* <ItemList /> */}
						</div>
					</div>

					{/* Controls Sidebar */}
					<div style={{ flex: 1, minWidth: 280, maxWidth: 350, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: 24, overflowY: 'auto' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
							<div style={{ fontWeight: 700, fontSize: 18 }}>Body Measurements</div>
							<button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Reset All</button>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
							<SliderWithValue label="Height" min={0.8} max={1.2} step={0.01} value={body.height} onChange={v => handleSlider('height', v)} unit="m" displayValue={Math.round(body.height * 170) + ' cm'} />
							<SliderWithValue label="Weight" min={0.8} max={1.2} step={0.01} value={body.weight} onChange={v => handleSlider('weight', v)} unit="kg" displayValue={Math.round(body.weight * 50) + 60 + ' kg'} />

							<div style={{ height: 1, background: '#eee', margin: '8px 0' }} />

							<SliderWithValue label="Shoulder" min={0.8} max={1.2} step={0.01} value={body.shoulder} onChange={v => handleSlider('shoulder', v)} unit="cm" displayValue={Math.round(body.shoulder * 40) + 6 + ' cm'} />
							<SliderWithValue label="Chest" min={0.8} max={1.2} step={0.01} value={body.chest} onChange={v => handleSlider('chest', v)} unit="cm" displayValue={Math.round(body.chest * 80) + 16 + ' cm'} />
							<SliderWithValue label="Waist" min={0.8} max={1.2} step={0.01} value={body.waist} onChange={v => handleSlider('waist', v)} unit="cm" displayValue={Math.round(body.waist * 65) + 15 + ' cm'} />
							<SliderWithValue label="Hip" min={0.8} max={1.2} step={0.01} value={body.hip} onChange={v => handleSlider('hip', v)} unit="cm" displayValue={Math.round(body.hip * 80) + 14 + ' cm'} />
						</div>

						<div style={{ marginTop: 40 }}>
							<button
								onClick={handleSave}
								disabled={saving}
								style={{
									width: '100%',
									background: '#111',
									color: '#fff',
									border: 'none',
									borderRadius: 8,
									padding: '14px',
									fontWeight: 600,
									cursor: saving ? 'wait' : 'pointer',
									opacity: saving ? 0.7 : 1,
									transition: 'all 0.2s'
								}}
							>
								{saving ? 'Saving Profile...' : 'Save Measurements'}
							</button>
							{saved && <div style={{ color: '#2a6be0', marginTop: 12, textAlign: 'center', fontSize: 13, background: '#eef4ff', padding: 8, borderRadius: 6 }}>Profile updated successfully!</div>}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// function SliderWithValue({ label, min, max, step, value, onChange, unit, displayValue }: any) {
interface SliderProps {
	label: string;
	min: number;
	max: number;
	step: number;
	value: number;
	onChange: (val: number) => void;
	unit: string;
	displayValue: string;
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
