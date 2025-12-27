import db from '../services/firestore.js';

const col = db.collection('categories');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async list(limit = 100) {
    const snap = await col.orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async create(data) {
    const ref = col.doc();
    await ref.set({ ...data, createdAt: new Date() });
    return docToObj(await ref.get());
  }
};
