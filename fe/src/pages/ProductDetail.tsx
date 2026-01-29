import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message, Modal } from 'antd'; // Import Ant Design
import './ProductDetail.css';

interface Variant {
  color: string;
  image: string;
}

interface Product {
  id: string;
  _id?: string; // Fallback cho MongoDB
  name: string;
  price: number;
  image: string;
  brand: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  variants?: Variant[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // State lựa chọn
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeImage, setActiveImage] = useState<string>('');

  // State cho Wishlist (Chỉ dùng để loading, không dùng để đổi màu nút)
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/products/${id}`);
        const data = res.data;
        setProduct(data);
        setActiveImage(data.image);

        // Tự động chọn biến thể đầu tiên
        if (data.variants && data.variants.length > 0) {
          const firstVar = data.variants[0];
          setSelectedColor(firstVar.color);
          setActiveImage(firstVar.image);
        } else if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }

        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);

      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductDetail();
  }, [id]);

  const handleVariantClick = (variant: Variant) => {
    setSelectedColor(variant.color);
    setActiveImage(variant.image);
  };

  // --- HÀM ADD TO WISHLIST (ĐÃ NÂNG CẤP UI) ---
  const handleAddToWishlist = async () => {
    if (!product) return;

    // 1. Kiểm tra User đã đăng nhập chưa?
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      // Thay window.confirm bằng Modal đẹp
      Modal.confirm({
        title: 'Bạn chưa đăng nhập',
        content: 'Bạn cần đăng nhập để thêm sản phẩm vào danh sách yêu thích. Bạn có muốn đi đăng nhập ngay không?',
        okText: 'Đăng nhập ngay',
        cancelText: 'Để sau',
        centered: true,
        onOk() {
          navigate('/login');
        }
      });
      return;
    }

    // 2. Validate Size/Màu
    if (!selectedSize || !selectedColor) {
      message.warning(" Vui lòng chọn Size và Màu sắc trước nhé!");
      return;
    }

    // 3. Lấy User ID thật từ LocalStorage
    let userId = null;
    try {
      const parsedUser = JSON.parse(storedUser);
      userId = parsedUser.id;
    } catch (error) {
      console.error("Lỗi đọc dữ liệu user:", error);
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    // 4. Gọi API
    setWishlistLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/wishlist/add`, {
        userId: userId,
        productId: product._id || product.id,
        selectedSize,
        selectedColor
      });

      // Thông báo thành công đẹp (Toast)
      message.success(" Đã thêm vào danh sách yêu thích!");

    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        // Thông báo đã tồn tại
        message.info(" Sản phẩm này (Size/Màu này) đã có trong Wishlist rồi!");
      } else {
        console.error("Lỗi API Wishlist:", error);
        message.error("Lỗi kết nối! Vui lòng thử lại sau.");
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!product) return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy sản phẩm</div>;

  return (
    <div className="product-detail-container">
      {/* CỘT TRÁI: ẢNH */}
      <div className="gallery-section">
        <div className="thumbnail-list">
          {product.variants && product.variants.length > 0 ? (
            product.variants.map((v, idx) => (
              <img
                key={idx} src={v.image} alt="thumb"
                className={`thumb-img ${activeImage === v.image ? 'active' : ''}`}
                onClick={() => handleVariantClick(v)}
              />
            ))
          ) : (
            [1, 2, 3].map((_, i) => <img key={i} src={product.image} className="thumb-img" alt="thumb" />)
          )}
        </div>
        <div className="main-image-wrapper">
          <img src={activeImage} alt={product.name} className="main-image" />
        </div>
      </div>

      {/* CỘT PHẢI: THÔNG TIN */}
      <div className="info-section">

        <div className="product-header-row">
          <span className="brand-label">Brand: {product.brand || 'NO BRAND'}</span>
        </div>

        <h1 className="product-title">{product.name}</h1>

        <div className="product-price">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
        </div>

        {/* Option Màu */}
        <div className="option-group">
          <span className="option-label">Màu sắc:</span>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            {product.variants && product.variants.length > 0 ? (
              product.variants.map((v, index) => (
                <div key={index} onClick={() => handleVariantClick(v)}
                  className="color-circle"
                  style={{
                    backgroundColor: v.color,
                    border: selectedColor === v.color ? '2px solid #333' : '1px solid #ddd',
                    transform: selectedColor === v.color ? 'scale(1.1)' : 'scale(1)',
                  }}
                  title={v.color}
                ></div>
              ))
            ) : (
              <span>No Variants</span>
            )}
          </div>
        </div>

        {/* Option Size */}
        <div className="option-group">
          <span className="option-label">Size:</span>
          <div className="size-list">
            {product.sizes && product.sizes.map((size) => (
              <button key={size}
                className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="description-section">
          <h3 className="desc-title">Mô tả</h3>
          <p style={{ whiteSpace: 'pre-line', color: '#555' }}>{product.description || "Chưa có mô tả."}</p>
        </div>

        {/* NÚT HÀNH ĐỘNG */}
        <div className="action-buttons">

          {/* --- NÚT WISHLIST TĨNH (KHÔNG ĐỔI MÀU) --- */}
          <button
            className="btn-wishlist"
            onClick={handleAddToWishlist}
            disabled={wishlistLoading}
          >
            {wishlistLoading ? 'Đang xử lý...' : '♡ THÊM VÀO YÊU THÍCH'}
          </button>

          <button className="btn-try-on">Virtual Try On</button>

          <button className="btn-shop" onClick={() => navigate('/product')}>Back To Shop</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;