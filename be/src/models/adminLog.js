import db from '../services/firestore.js';

const col = db.collection('adminLogs');

function docToObj(doc) {
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export default {
  async findOne(filter) {
    let q = col.limit(1);
    for (const k of Object.keys(filter || {})) q = q.where(k, '==', filter[k]);
    const snap = await q.get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  },
  async findById(id) {
    const snap = await col.doc(id).get();
    return docToObj(snap);
  },
  async find(filter = {}, limit = 100) {
    let q = col.orderBy('createdAt', 'desc').limit(limit);
    for (const k of Object.keys(filter)) q = q.where(k, '==', filter[k]);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async create(data) {
    const ref = col.doc();
    await ref.set({ ...data, createdAt: data.createdAt || new Date() });
    const snap = await ref.get();
    return docToObj(snap);
  },
  async update(id, updates) {
    const ref = col.doc(id);
    await ref.set({ ...updates, updatedAt: new Date() }, { merge: true });
    const snap = await ref.get();
    return docToObj(snap);
  },
  async findByIdAndDelete(id) {
    await col.doc(id).delete();
    return true;
  }
};
