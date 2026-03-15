import ProductModel from '../models/product.js';
import AffiliateModel from '../models/affiliateClick.js';

export const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const redirectPartner = async (req, res) => {
  try {
    const { productId, userId } = req.body; // userId có thể null nếu là khách vãng lai

    // 1. Lấy link gốc từ Product
    const product = await ProductModel.findById(productId);
    if (!product) return res.status(404).json({ message: 'Sản phẩm không tìm thấy' });

    // 2. Ghi log tracking vào AffiliateClick
    // Giả sử trong product có trường 'affiliateUrl' hoặc 'brandUrl'
    const targetUrl = product.affiliateUrl || product.brandUrl || '#';

    await AffiliateModel.create({
      userId: userId || 'guest',
      productId: productId,
      targetUrl: targetUrl,
      clickedAt: new Date()
    });

    // 3. Trả về URL để Frontend mở tab mới
    res.status(200).json({ url: targetUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    // Lấy tham số từ URL: ví dụ GET /products?category=abc&limit=20
    const { category, limit } = req.query;

    const filters = {};
    if (category) {
      filters.category = category; // Map vào bộ lọc của Model
    }

    // Gọi hàm list có sẵn trong Model
    const products = await ProductModel.list(filters, limit ? parseInt(limit) : 50);

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//khúc này để chạy code up du lieu len database
export const seedProducts = async (req, res) => {
  try {
    const fullProductList = [
      {
        name: "Đầm cổ lọ, bèo đổ 1 bên, 2l ",
        price: 1990000,
        category: "Pants",
        brand: "deThuong Fashion",
        description: "Đầm suông dự tiệc lụa hồng ruốc – Dịu dàng nổi bật \n Thiết kế đầm suông thanh lịch, dài ngang gối, tôn dáng mà vẫn tạo sự thoải mái cho người mặc. Điểm nhấn độc đáo nằm ở đường bèo dún mềm mại chạy dọc từ cổ xuống một bên sườn, mang đến cảm giác uyển chuyển, duyên dáng trong từng bước đi.\n Chất liệu lụa cao cấp, mịn màng, nhẹ nhàng nâng niu làn da, kết cấu 2 lớp giúp đầm đứng phom vừa phải, không lộ, tạo độ rũ nhẹ nhàng đầy nữ tính.\n Gam màu hồng trang nhã, sang trọng, dễ phối phụ kiện, phù hợp cho các buổi tiệc nhẹ, gặp gỡ đối tác hay sự kiện trang trọng.",
        image: "https://bizweb.dktcdn.net/100/326/014/products/d15afc83-3b12-4c11-a211-1a45edc91d01.jpg?v=1754490296597",

        // 1. TÍCH HỢP MODEL 3D THEO SIZE
        // Đường dẫn trỏ tới thư mục fe/public/quan_ao/ của bạn
       
        

        sizes: ["L", "M", "XL"],

        variants: [
          { color: "#f9c9e1", image: "https://bizweb.dktcdn.net/100/326/014/products/b6c93a3a-ec98-45ac-9191-f10509e7c379.jpg?v=1754490296597" },

        ]
      },


    ];

    let count = 0;
    for (const item of fullProductList) {
      await ProductModel.create(item);
      count++;
    }

    res.status(200).json({
      message: `SUCCESS! Đã thêm ${count} sản phẩm có tích hợp Model 3D vào kho!`
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi nạp dữ liệu: " + error.message });
  }
};