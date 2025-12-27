import db from '../services/firestore.js';

const col = db.collection('aiRecommendations');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async getByUser(userId) {
    const q = col.where('userId', '==', userId).limit(1);
    const snap = await q.get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  },
  async setForUser(userId, recommendedProductIds, reason = '') {
    const q = col.where('userId', '==', userId).limit(1);
    const snap = await q.get();
    if (!snap.empty) {
      const id = snap.docs[0].id;
      await col.doc(id).set({ recommendedProductIds, reason, updatedAt: new Date() }, { merge: true });
      return { id, userId, recommendedProductIds, reason };
    }
    const ref = col.doc();
    await ref.set({ userId, recommendedProductIds, reason, createdAt: new Date() });
    return { id: ref.id, userId, recommendedProductIds, reason };
  }
};
