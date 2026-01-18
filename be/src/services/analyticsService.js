import db from './firestore.js';

const analyticsCol = db.collection('analyticsEvents');

export async function createEvent(event) {
  const id = event.id || (event.firebaseUid ? `${event.firebaseUid}_${Date.now()}` : undefined);
  const ref = id ? analyticsCol.doc(id) : analyticsCol.doc();
  const payload = {
    userId: event.userId || null,
    productId: event.productId || null,
    type: event.type || 'unknown',
    meta: event.meta || {},
    createdAt: event.createdAt || new Date(),
  };
  await ref.set(payload, { merge: true });
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() };
}

export async function listEvents(limit = 100, filters = {}) {
  let q = analyticsCol.orderBy('createdAt', 'desc').limit(limit);
  if (filters.userId) q = q.where('userId', '==', filters.userId);
  if (filters.productId) q = q.where('productId', '==', filters.productId);
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteEvent(id) {
  if (!id) throw new Error('Event id required');
  await analyticsCol.doc(id).delete();
}
