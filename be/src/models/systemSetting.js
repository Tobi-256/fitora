import db from '../services/firestore.js';

const col = db.collection('systemSettings');

function docToObj(doc) { return doc.exists ? { id: doc.id, ...doc.data() } : null; }

export default {
  async get(key) {
    const q = col.where('key', '==', key).limit(1);
    const snap = await q.get();
    return snap.empty ? null : snap.docs[0].data().value;
  },
  async set(key, value) {
    const q = col.where('key', '==', key).limit(1);
    const snap = await q.get();
    if (!snap.empty) {
      const id = snap.docs[0].id;
      await col.doc(id).set({ value, updatedAt: new Date() }, { merge: true });
      return true;
    }
    const ref = col.doc();
    await ref.set({ key, value, createdAt: new Date() });
    return true;
  }
};

