import db from '../services/firestore.js';

const col = db.collection('subscriptions');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async getByUser(userId) {
    const q = col.where('userId', '==', userId).limit(1);
    const snap = await q.get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  },
  async create(data) {
    const ref = col.doc();
    await ref.set({ ...data, createdAt: new Date() });
    return docToObj(await ref.get());
  },
  async cancel(id) {
    await col.doc(id).set({ status: 'cancelled', updatedAt: new Date() }, { merge: true });
    return docToObj(await col.doc(id).get());
  }
};
