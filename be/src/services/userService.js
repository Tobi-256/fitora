// No comments to remove, file is clean.
import db from './firestore.js';

const usersCol = db.collection('users');

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

export async function createOrUpdateUser(user) {
  if (!user || !user.firebaseUid) throw new Error('firebaseUid required');
  const ref = usersCol.doc(user.firebaseUid);
  // Lấy user cũ nếu có
  const oldSnap = await ref.get();
  const oldData = oldSnap.exists ? oldSnap.data() : {};
  // Chỉ cập nhật name nếu name cũ là rỗng, null, giống email trước @, hoặc giống displayName từ provider
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
  // Avatar giữ logic cũ
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
  await ref.set({
    firebaseUid: user.firebaseUid,
    email: user.email || '',
    name: finalName,
    avatarUrl: finalAvatarUrl,
    phone: user.phone || '',
    address: user.address || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || null,
    role: user.role || 'user',
    isPremium: !!user.isPremium,
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

export async function listUsers(limit = 100) {
  const q = await usersCol.orderBy('createdAt', 'desc').limit(limit).get();
  return q.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteUserByFirebaseUid(firebaseUid) {
  if (!firebaseUid) throw new Error('firebaseUid required');
  await usersCol.doc(firebaseUid).delete();
}
