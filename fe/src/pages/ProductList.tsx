import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProductList.css'; // File CSS giữ nguyên

// 1. Định nghĩa kiểu dữ liệu cho Product (Interface)
interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  brand?: string;
  category?: string;
}

const ProductList: React.FC = () => {
  // 2. Chỉ cần giữ State products và loading
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();

  // Hàm gọi API lấy TOÀN BỘ sản phẩm
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      // Gọi API Backend (Không truyền tham số category nữa
      const res = await axios.get('http://localhost:5000/api/products'); 
      
      setProducts(res.data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect chỉ chạy 1 lần duy nhất khi vào trang
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Hàm format tiền tệ
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="container">
      {/* Tiêu đề */}
      <h2 className="section-title">Products</h2>

      {/* ĐÃ XÓA PHẦN TABS CATEGORY Ở ĐÂY */}

      {/* Grid Sản phẩm */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Đang tải sản phẩm...</p>
      ) : (
        <div className="product-grid">
          {products.map((item) => (
            <div key={item.id} className="product-card">
              
              {/* Ảnh sản phẩm */}
              <div className="img-wrapper">
                <img 
                  src={item.image || 'https://via.placeholder.com/300x400'} 
                  alt={item.name} 
                  className="product-img" 
                />
              </div>

              {/* Thông tin */}
              <div className="brand-name">{item.brand || 'NO BRAND'}</div>
              <div className="product-name" title={item.name}>{item.name}</div>
              
              {/* Giá & Nút See more */}
              <div className="card-footer">
                <span className="price">{formatPrice(item.price)}</span>
                <span 
                  className="see-more"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  See-more
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nút See All (Có thể giữ hoặc bỏ nếu đã load hết) */}
      {/* <div className="see-all-container">
        <button className="btn-see-all">See all</button>
      </div> */}
    </div>
  );
};

export default ProductList;