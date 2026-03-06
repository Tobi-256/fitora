import { db } from '../config/firebase.js';

// 1. ĐẶT HÀNG
export const createOrder = async (req, res) => {
    try {
        // SỬA TẠI ĐÂY: Truy cập vào thuộc tính .firebaseUid thay vì .uid
        const userId = req.user?.firebaseUid; 
        
        if (!userId) {
            return res.status(401).json({ message: "Không tìm thấy mã định danh người dùng (FirebaseUid)" });
        }

        const { items, totalAmount, shippingInfo, paymentMethod } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống, không thể đặt hàng" });
        }

        const orderData = {
            userId, // Lưu vào DB với ID lấy từ req.user.firebaseUid
            items, 
            totalAmount: Number(totalAmount),
            shippingInfo,
            paymentMethod,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 1. Lưu đơn hàng mới vào Firestore
        const docRef = await db.collection('orders').add(orderData);

        // 2. Xóa giỏ hàng của user sau khi đặt thành công
        await db.collection('carts').doc(userId).delete();

        res.status(201).json({ 
            message: "Đặt hàng thành công!", 
            orderId: docRef.id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. XEM LỊCH SỬ ĐƠN HÀNG
export const getMyOrders = async (req, res) => {
    try {
        // 1. Lấy UID và ép kiểu chuỗi, xóa khoảng trắng
        const userId = req.user?.firebaseUid?.toString().trim(); 

        if (!userId) {
            return res.status(401).json({ message: "Không tìm thấy thông tin định danh!" });
        }

        // 2. Query - Thêm log để đối chiếu trực tiếp với Firebase Console
        console.log("--- TRUY VẤN FIRESTORE ---");
        console.log("Collection: orders");
        console.log("Field: userId");
        console.log("Value:", userId);

        const snapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .get();

        if (snapshot.empty) {
            // Nếu không thấy, hãy thử lấy 1 cái bất kỳ để xem UID thực tế trong DB là gì
            const anyOrder = await db.collection('orders').limit(1).get();
            const sampleUid = anyOrder.docs[0]?.data().userId;
            console.log("UID mẫu trong DB để bạn so sánh:", sampleUid);
            
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi lấy đơn hàng:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. XEM CHI TIẾT 1 ĐƠN HÀNG
export const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    // Giả sử bạn dùng Firestore hoặc MongoDB
    const order = await OrderModel.findById(id); 

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Trả về OBJECT trực tiếp (đừng trả về mảng)
    return res.status(200).json(order); 
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Ví dụ: { "status": "delivered" }

        const orderRef = db.collection('orders').doc(id);
        const doc = await orderRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        await orderRef.update({
            status: status,
            updatedAt: new Date() // Cập nhật thời gian thay đổi
        });

        res.status(200).json({ message: "Cập nhật trạng thái thành công", status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        // Lấy tất cả tài liệu trong collection 'orders'
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc') 
            .get();

        if (snapshot.empty) {
            return res.status(200).json([]); // Trả về mảng rỗng nếu chưa có đơn nào
        }

        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(orders);
    } catch (error) {
        console.error("Lỗi lấy toàn bộ đơn hàng:", error);
        res.status(500).json({ error: error.message });
    }
};