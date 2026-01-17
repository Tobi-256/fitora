import { db } from "../config/firebase.js"; 

// --- ADD TO WISHLIST ---
export const addToWishlist = async (req, res) => {
  try {
    const { userId, productId, selectedSize, selectedColor } = req.body;

    if (!userId || !productId || !selectedSize || !selectedColor) {
      return res.status(400).json({ message: 'Thiếu thông tin (Size hoặc Màu)' });
    }

    // 1. Check trùng (cùng size, cùng màu) trong Firestore
    const existingSnapshot = await db.collection('wishlists')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .where('selectedSize', '==', selectedSize)
      .where('selectedColor', '==', selectedColor)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(409).json({ message: 'Sản phẩm này đã có trong Wishlist' });
    }

    // 2. Tạo mới
    const newItem = {
      userId,
      productId,
      selectedSize,
      selectedColor,
      createdAt: new Date().toISOString()
    };
    
    await db.collection('wishlists').add(newItem);
    
    res.status(201).json({ message: 'Đã thêm vào danh sách yêu thích' });

  } catch (error) {
    console.error("Add Wishlist Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- GET WISHLIST (Logic lọc ảnh theo màu) ---
export const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Lấy danh sách wishlist từ Firestore
    const wishlistSnapshot = await db.collection('wishlists')
        .where('userId', '==', userId)
        .get();

    if (wishlistSnapshot.empty) {
        return res.status(200).json([]);
    }

    // 2. Map để lấy thông tin sản phẩm chi tiết
    const fullWishlist = await Promise.all(wishlistSnapshot.docs.map(async (doc) => {
      const item = doc.data(); // Dữ liệu: productId, size, color...
      const wishlistId = doc.id;

      // Lấy thông tin Product từ bảng 'products'
      let product = null;
      try {
          const productDoc = await db.collection('products').doc(item.productId).get();
          if (productDoc.exists) {
              product = productDoc.data();
          }
      } catch (e) { console.error(e); }
      
      let finalImage = null;
      let productName = 'Sản phẩm không còn tồn tại';
      let productPrice = 0;

      if (product) {
        productName = product.name;
        productPrice = product.price;

        // --- LOGIC TÌM ẢNH THEO MÀU (Của bạn) ---
        if (product.variants && Array.isArray(product.variants)) {
          // Tìm trong mảng variants xem cái nào có màu khớp với item.selectedColor
          const matchingVariant = product.variants.find(v => v.color === item.selectedColor);
          
          if (matchingVariant) {
            finalImage = matchingVariant.image; 
          } else {
            // Fallback: Lấy ảnh chính nếu không khớp màu
            finalImage = product.image; 
          }
        } else {
            finalImage = product.image; // Fallback nếu không có variants
        }
      }

      // Nếu sản phẩm đã bị xóa khỏi hệ thống, ta trả về null để lọc sau
      if (!product) return null;

      return {
        wishlistId: wishlistId,
        productId: item.productId,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor, 
        addedAt: item.createdAt,
        productDetails: {
          name: productName,
          price: productPrice,
          image: finalImage 
        }
      };
    }));

    // Lọc bỏ những sản phẩm null (đã bị xóa khỏi DB)
    const validItems = fullWishlist.filter(item => item !== null);

    res.status(200).json(validItems);
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- REMOVE ---
export const removeFromWishlist = async (req, res) => {
    try {
        const { wishlistId } = req.params;
        await db.collection('wishlists').doc(wishlistId).delete();
        res.status(200).json({ message: 'Đã xóa' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}