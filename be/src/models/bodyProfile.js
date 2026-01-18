import db from '../services/firestore.js';

const col = db.collection('bodyProfiles');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async getByUser(userId) {
    const q = col.where('userId', '==', userId).limit(1);
    const snap = await q.get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  },
  async upsert(userId, data) {
    const q = col.where('userId', '==', userId).limit(1);
    const snap = await q.get();
    if (!snap.empty) {
      const id = snap.docs[0].id;
      await col.doc(id).set({ ...data, updatedAt: new Date() }, { merge: true });
      return { id, userId, ...data };
    }
    const ref = col.doc();
    await ref.set({ userId, ...data, createdAt: new Date() });
    return { id: ref.id, userId, ...data };
  }
};
