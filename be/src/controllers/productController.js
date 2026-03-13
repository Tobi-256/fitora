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
        description: "Áo dài đỏ rực rỡ, biểu tượng của sự may mắn và hạnh phúc trong văn hóa Việt Nam. Thiết kế truyền thống kết hợp với chất liệu cao cấp, tạo nên vẻ đẹp duyên dáng và sang trọng cho người mặc.",
        image: "https://i.postimg.cc/JzXxY9Xy/ao-dai-do.jpg",

        // 1. TÍCH HỢP MODEL 3D THEO SIZE
        // Đường dẫn trỏ tới thư mục fe/public/quan_ao/ của bạn
        threeDModels: {
          "L":  "/ao/aodai.glb"
          },
        

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