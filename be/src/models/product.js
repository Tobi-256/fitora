import db from '../services/firestore.js';

const col = db.collection('products');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async findById(id) {
    const snap = await col.doc(id).get();
    return docToObj(snap);
  },
  async list(filters = {}, limit = 50) {
    let q = col.orderBy('createdAt', 'desc').limit(limit);
    for (const k of Object.keys(filters)) q = q.where(k, '==', filters[k]);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async create(data) {
    const ref = col.doc();
    await ref.set({ ...data, createdAt: new Date() });
    return docToObj(await ref.get());
  },
  async update(id, updates) {
    await col.doc(id).set({ ...updates, updatedAt: new Date() }, { merge: true });
    return docToObj(await col.doc(id).get());
  }
};
