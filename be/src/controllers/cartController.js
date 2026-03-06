import { db } from '../config/firebase.js';

// 1. THÊM SẢN PHẨM VÀO GIỎ HÀNG
export const addToCart = async (req, res) => {
    try {
        // KIỂM TRA: Middleware auth.js đặt tên là firebaseUid, nên ta phải gọi đúng tên đó
        if (!req.user || !req.user.firebaseUid) {
            return res.status(401).json({ message: "Bạn cần đăng nhập để thực hiện thao tác này" });
        }

        const userId = String(req.user.firebaseUid); 
        const { productId, size, quantity, name, price, image } = req.body;

        if (!productId || !size) {
            return res.status(400).json({ message: "Thiếu productId hoặc size sản phẩm" });
        }

        const cartRef = db.collection('carts').doc(userId);
        const doc = await cartRef.get();

        let items = [];
        const newItemQuantity = Number(quantity) || 1;

        if (doc.exists) {
            items = doc.data().items || [];
            const itemIndex = items.findIndex(item => item.productId === productId && item.size === size);

            if (itemIndex > -1) {
                items[itemIndex].quantity = Number(items[itemIndex].quantity) + newItemQuantity;
            } else {
                items.push({ productId, size, quantity: newItemQuantity, name, price, image });
            }
        } else {
            items.push({ productId, size, quantity: newItemQuantity, name, price, image });
        }

        await cartRef.set({ items, updatedAt: new Date() }, { merge: true });
        
        res.status(200).json({ message: "Đã thêm vào giỏ hàng thành công", items });
    } catch (error) {
        console.error("Lỗi addToCart:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. LẤY DANH SÁCH GIỎ HÀNG
export const getCart = async (req, res) => {
    try {
        // Lấy đúng cái ID mà bạn thấy trong Database
        const userId = req.user.firebaseUid; 
        
        // Truy cập thẳng vào document của user đó
        const cartDoc = await db.collection('carts').doc(userId).get();

        if (cartDoc.exists) {
            // Trả về đúng mảng 'items' bên trong
            return res.status(200).json(cartDoc.data().items || []);
        } else {
            // Nếu chưa có giỏ hàng thì trả về mảng rỗng
            return res.status(200).json([]);
        }
    } catch (error) {
        console.error("Lỗi Get Cart:", error);
        res.status(500).json({ message: "Không lấy được giỏ hàng" });
    }
};

// 3. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM TRONG GIỎ
export const updateCartItem = async (req, res) => {
    try {
        if (!req.user || !req.user.firebaseUid) return res.status(401).json({ message: "Unauthorized" });

        const userId = String(req.user.firebaseUid);
        const { productId, size, quantity } = req.body;

        const cartRef = db.collection('carts').doc(userId);
        const doc = await cartRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
        }

        let items = doc.data().items || [];
        const itemIndex = items.findIndex(item => item.productId === productId && item.size === size);

        if (itemIndex > -1) {
            const newQty = Number(quantity);
            if (newQty <= 0) {
                items.splice(itemIndex, 1);
            } else {
                items[itemIndex].quantity = newQty;
            }
            
            await cartRef.update({ items, updatedAt: new Date() });
            res.status(200).json({ message: "Đã cập nhật số lượng", items });
        } else {
            res.status(404).json({ message: "Sản phẩm không có trong giỏ" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. XÓA SẢN PHẨM KHỎI GIỎ HÀNG
export const removeFromCart = async (req, res) => {
    try {
        if (!req.user || !req.user.firebaseUid) return res.status(401).json({ message: "Unauthorized" });

        const userId = String(req.user.firebaseUid);
        const { productId, size } = req.body;

        const cartRef = db.collection('carts').doc(userId);
        const doc = await cartRef.get();

        if (doc.exists) {
            const items = doc.data().items || [];
            const newItems = items.filter(item => !(item.productId === productId && item.size === size));
            
            await cartRef.update({ items: newItems, updatedAt: new Date() });
            res.status(200).json({ message: "Đã xóa sản phẩm", items: newItems });
        } else {
            res.status(404).json({ message: "Giỏ hàng trống" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};