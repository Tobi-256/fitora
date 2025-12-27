import db from '../services/firestore.js';

const col = db.collection('favoriteProducts');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async add(userId, productId) {
    const ref = col.doc();
    await ref.set({ userId, productId, createdAt: new Date() });
    return docToObj(await ref.get());
  },
  async listByUser(userId) {
    const snap = await col.where('userId', '==', userId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async removeById(id) {
    await col.doc(id).delete();
    return true;
  }
};
