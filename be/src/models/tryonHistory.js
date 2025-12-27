import db from '../services/firestore.js';

const col = db.collection('tryOnHistories');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async add(entry) {
    const ref = col.doc();
    await ref.set({ ...entry, createdAt: new Date() });
    return docToObj(await ref.get());
  },
  async listByUser(userId, limit = 50) {
    const snap = await col.where('userId', '==', userId).orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};
