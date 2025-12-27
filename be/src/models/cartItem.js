import db from '../services/firestore.js';

const col = db.collection('cartItems');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async add(userId, productId, selectedSize) {
    const ref = col.doc();
    const payload = { userId, productId, selectedSize, createdAt: new Date() };
    await ref.set(payload);
    return docToObj(await ref.get());
  },
  async listByUser(userId) {
    const snap = await col.where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async delete(id) {
    await col.doc(id).delete();
    return true;
  }
};
