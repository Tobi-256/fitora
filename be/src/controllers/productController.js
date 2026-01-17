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
// khúc này để chạy code up du lieu len database
// export const seedProducts = async (req, res) => {
//   try {
//     const fullProductList = [
//       {
//         name: "Áo Thun FlexFit™In Puff 3D Nổi" + "Universe" + "The No Style 210 Be",
//         price: 297000,
//         category: "T-Shirt",
//         brand: "Yame",
//         description: "Áo sơ mi cổ ve HIỆU ỨNG IN PUFF 3D NỔI: Hình in nổi lạ mắt mực in đàn hồi tốt khắc phục triệt để nhược điểm dính hình khi gấp áolật, tay ngắn có gấu lật. Đáp một túi vuông trước ngực. Nhún li sau lưng. Cài khuy ẩn dưới vạt che phía trước."
//         + "FlexFit™ 225GSM DÀY NHƯNG THỞ: Định lượng dày dặn giúp áo đứng dáng chống mất phom nhưng vẫn thoáng da nhờ sợi Compact"
//         + "PHOM BOXY GIẤU DÁNG: Nới rộng ngang và hạ vai giúp che khuyết điểm cơ thể vận động vùng nách cực kỳ thoải mái"
//         + "HÌNH IN KỴ NHIỆT TRỰC TIẾP: Cấu trúc mực in Puff 3D xốp nhẹ rất nhạy cảm với nhiệt độ cao dễ bị bẹp hoặc biến dạng vĩnh viễn nếu bàn ủi trượt trực tiếp lên mặt phải",
        
//         // Ảnh mặc định ban đầu
//         image: "https://yame.vn/cdn/shop/files/TheNoStyle210Den1_edef4858-874a-4f6b-9523-940443c90ffa.jpg?v=1767179067&width=1100", 
        
//         // Size vẫn giữ đơn giản
//         sizes: [ "S", "M", "L", "XL", "XXL"],

//         // --- QUAN TRỌNG: CẤU TRÚC MÀU KÈM ẢNH ---
//         variants: [
//           { 
//             color: "#000000", 
//             image: "https://yame.vn/cdn/shop/files/TheNoStyle210Den1_edef4858-874a-4f6b-9523-940443c90ffa.jpg?v=1767179067&width=1100" 
//           },
//           { 
//             color: "#28244a", 
//             image: "https://yame.vn/cdn/shop/files/TheNoStyle210XanhD_ngD_m1_25e76f3e-ac94-4bac-a388-1dfbe827ef43.jpg?v=1767179293&width=1100" 
//           },
//           { 
//             color: "#f0edef",
//             image: "https://yame.vn/cdn/shop/files/The_No_Style_210_Xam_Nh_t_1.jpg?v=1767179379&width=1100" 
//           },

//           { 
//             color: "#ede4da",
//             image: "https://yame.vn/cdn/shop/files/TheNoStyle210Be1_59335df4-1c68-46b1-88ef-460a993bfd68.jpg?v=1767179130&width=1100" 
//           },

//           { 
//             color: "#615d69",
//             image: "https://yame.vn/cdn/shop/files/TheNoStyle210XamD_m1_09157be3-813a-4880-a935-afd108b3413a.jpg?v=1767179255&width=1100" 
//           },

//         ]
//       },
      
//     ];

//     let count = 0;
//     for (const item of fullProductList) {
//       // Create document in Firestore/MongoDB
//       await ProductModel.create(item);
//       count++;
//     }

//     res.status(200).json({ message: `SUCCESS! Đã thêm ${count} sản phẩm FULL tính năng vào kho!` });
//   } catch (error) {
//     res.status(500).json({ message: "Lỗi nạp dữ liệu: " + error.message });
//   }
// };