const Order = {
  userId: String,
  items: [
    {
      productId: String,
      name: String,  // Lưu tên để sau này xem lại đơn hàng ko cần query bảng product
      price: Number, // Giá tại thời điểm mua
      quantity: Number,
      size: String,
      image: String
    }
  ],
  totalAmount: Number,
  shippingInfo: {
    address: String,
    phone: String,
    recipientName: String
  },
  paymentMethod: String, // "COD" hoặc "Online"
  status: String,        // "pending", "processing", "shipped", "delivered", "cancelled"
  createdAt: Date
};