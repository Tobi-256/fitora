import db from '../services/firestore.js';

const col = db.collection('affiliateClicks');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async create(data) {
    const ref = col.doc();
    await ref.set({ ...data, createdAt: data.createdAt || new Date() });
    return docToObj(await ref.get());
  },
  async find(filter = {}, limit = 100) {
    let q = col.orderBy('createdAt', 'desc').limit(limit);
    for (const k of Object.keys(filter)) q = q.where(k, '==', filter[k]);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};
