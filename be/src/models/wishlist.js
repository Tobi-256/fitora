import db from '../services/firestore.js';

const WishlistModel = {
  // Tìm xem đã có user + product + size + color này chưa
  findByUserAndProduct: async (userId, productId, selectedSize, selectedColor) => {
    try {
      const snapshot = await db.collection('wishlists')
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('selectedSize', '==', selectedSize)
        .where('selectedColor', '==', selectedColor) // Check thêm màu
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error('Lỗi tìm kiếm wishlist: ' + error.message);
    }
  },

  // Thêm mới với Size và Color
  add: async (userId, productId, selectedSize, selectedColor) => {
    try {
      const newWishlistItem = {
        userId,
        productId,
        selectedSize,
        selectedColor, // Lưu mã màu (VD: "#87CEEB")
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection('wishlists').add(newWishlistItem);
      return { id: docRef.id, ...newWishlistItem };
    } catch (error) {
      throw new Error('Lỗi thêm wishlist: ' + error.message);
    }
  },

  listByUser: async (userId) => {
    // Logic này giữ nguyên, chỉ lấy danh sách items về
    try {
      const snapshot = await db.collection('wishlists')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
       // Xử lý lỗi index như cũ...
       if (error.code === 5) {
          const snapshotNoSort = await db.collection('wishlists').where('userId', '==', userId).get();
          return snapshotNoSort.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       }
       throw new Error(error.message);
    }
  },
  
  remove: async (id) => {
    await db.collection('wishlists').doc(id).delete();
  }
};

export default WishlistModel;