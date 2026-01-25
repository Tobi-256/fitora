// src/services/userService.js
import { db } from '../config/firebase.js';

const usersCol = db.collection('users');

// --- 1. CÁC HÀM TÌM KIẾM (FIND) ---

export async function findUserByFirebaseUid(firebaseUid) {
  if (!firebaseUid) return null;
  const snap = await usersCol.doc(firebaseUid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const q = await usersCol.where('email', '==', email).limit(1).get();
  if (q.empty) return null;
  const d = q.docs[0];
  return { id: d.id, ...d.data() };
}

export async function findUserByPhone(phone, excludeFirebaseUid = null) {
  if (!phone) return null;
  const q = await usersCol.where('phone', '==', phone).limit(1).get();
  if (q.empty) return null;
  const d = q.docs[0];
  if (excludeFirebaseUid && d.id === excludeFirebaseUid) return null;
  return { id: d.id, ...d.data() };
}

// --- 2. HÀM THỐNG KÊ DASHBOARD ---
export async function getUserStats() {
  try {
    // 1. Đếm tổng user
    const totalSnapshot = await usersCol.count().get();
    const totalUsers = totalSnapshot.data().count;

    // 2. Đếm user Premium
    const premiumSnapshot = await usersCol.where('isPremium', '==', true).count().get();
    const premiumUsers = premiumSnapshot.data().count;

    // 3. Đếm Admin
    const adminSnapshot = await usersCol.where('role', '==', 'admin').count().get();
    const totalAdmins = adminSnapshot.data().count;

    // 4. Đếm user mới (30 ngày qua)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let newUsers = 0;
    try {
        const newUsersSnapshot = await usersCol.where('createdAt', '>=', thirtyDaysAgo).count().get();
        newUsers = newUsersSnapshot.data().count;
    } catch (e) {
        // console.warn("Lỗi đếm newUsers (có thể do thiếu index Firestore):", e.message);
    }

    // 5. Tính tỷ lệ Premium
    const premiumRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0;

    return {
      totalUsers,
      premiumUsers,
      totalAdmins,
      newUsers,
      premiumRate
    };
  } catch (error) {
    console.error("Lỗi trong getUserStats:", error);
    return { totalUsers: 0, premiumUsers: 0, totalAdmins: 0, newUsers: 0, premiumRate: 0 };
  }
}

// --- 3. HÀM LIST USER (HỖ TRỢ PHÂN TRANG & TÌM KIẾM) ---
export async function listUsers(limit = 10, lastId = null, search = '') {
  let query = usersCol;

  // Xử lý tìm kiếm (Search theo Email)
  if (search) {
     query = query.where('email', '>=', search).where('email', '<=', search + '\uf8ff');
  } else {
     query = query.orderBy('createdAt', 'desc');
  }

  // Xử lý phân trang
  if (lastId) {
    const lastDoc = await usersCol.doc(lastId).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }

  const snapshot = await query.limit(Number(limit)).get();
  
  const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt && data.updatedAt.toDate ? data.updatedAt.toDate() : data.updatedAt,
      };
  });

  return {
    users,
    lastId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
  };
}

// --- 4. CÁC HÀM CẬP NHẬT / XÓA ---

export async function createOrUpdateUser(user) {
  if (!user || !user.firebaseUid) throw new Error('firebaseUid required');
  const ref = usersCol.doc(user.firebaseUid);
  
  // Lấy dữ liệu cũ trong DB ra trước
  const oldSnap = await ref.get();
  const oldData = oldSnap.exists ? oldSnap.data() : {};
  
  // Logic xử lý tên
  let finalName = oldData.name;
  const isDefaultName = (name, email, displayName) => {
    if (!name || name === '') return true;
    if (email && name === email.split('@')[0]) return true;
    if (displayName && name === displayName) return true;
    return false;
  };
  if (isDefaultName(finalName, user.email, user.displayName)) {
    finalName = user.name || '';
  }

  // Logic xử lý Avatar
  let finalAvatarUrl = oldData.avatarUrl;
  const isProviderAvatar = (url) => {
    if (!url) return true;
    return (
      url.includes('googleusercontent') ||
      url.includes('facebook.com') ||
      url.includes('graph.facebook.com')
    );
  };
  if (!finalAvatarUrl || finalAvatarUrl === '' || isProviderAvatar(finalAvatarUrl)) {
    finalAvatarUrl = user.avatarUrl !== undefined && user.avatarUrl !== null && user.avatarUrl !== ''
      ? user.avatarUrl
      : (oldData.avatarUrl || '');
  }

  // --- QUAN TRỌNG: LOGIC GIỮ NGUYÊN ROLE ADMIN ---
  // Nếu trong DB đã có role (ví dụ: 'admin') thì dùng lại role cũ.
  // Nếu chưa có thì mới dùng role từ input hoặc mặc định là 'user'.
  const finalRole = oldData.role ? oldData.role : (user.role || 'user');

  await ref.set({
    firebaseUid: user.firebaseUid,
    email: user.email || '',
    name: finalName,
    avatarUrl: finalAvatarUrl,
    phone: user.phone || '',
    address: user.address || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || null,
    height: user.height || null,
    weight: user.weight || null,
    shoulder: user.shoulder || null,
    chest: user.chest || null,
    waist: user.waist || null,
    hip: user.hip || null,
    
    role: finalRole, // <--- Đã sửa để không bị ghi đè thành 'user'
    
    isPremium: oldData.isPremium || !!user.isPremium,
    createdAt: oldData.createdAt || user.createdAt || new Date(),
    updatedAt: new Date(),
  }, { merge: true });

  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function updateUserByFirebaseUid(firebaseUid, updates) {
  if (!firebaseUid) throw new Error('firebaseUid required');
  const ref = usersCol.doc(firebaseUid);
  updates.updatedAt = new Date();
  await ref.set(updates, { merge: true });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function deleteUserByFirebaseUid(firebaseUid) {
  if (!firebaseUid) throw new Error('firebaseUid required');
  await usersCol.doc(firebaseUid).delete();
}