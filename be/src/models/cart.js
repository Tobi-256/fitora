const CartItem = {
  productId: String,  // Để biết là sản phẩm nào
  name: String,       // Hiển thị tên ở trang giỏ hàng
  price: Number,      // Để tính totalPrice trong CartContext
  image: String,      // Để hiện hình nhỏ (thumbnail)
  size: String,       // ĐẶC BIỆT QUAN TRỌNG để phân biệt phân loại
  quantity: Number    // Để tính totalItems
}