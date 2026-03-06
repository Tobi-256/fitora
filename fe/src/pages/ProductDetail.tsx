import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message, Modal } from 'antd';
import './ProductDetail.css';
import { useCart } from '../contexts/useCart';;
import { cartService } from '../services/api';

interface Variant {
  color: string;
  image: string;
}

// 1. CẬP NHẬT INTERFACE: Thêm threeDModels để nhận dữ liệu từ Firebase/DB
interface Product {
  id: string;
  _id?: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  variants?: Variant[];
  threeDModels?: { [key: string]: string }; // Chứa link: { "S": "/ao/sizeS.glb", ... }
  category?: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { refreshCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeImage, setActiveImage] = useState<string>('');
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/products/${id}`);
        const data = res.data;
        setProduct(data);
        setActiveImage(data.image);

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

  // --- HÀM XỬ LÝ THÊM VÀO GIỎ HÀNG ---
  const handleAddToCart = async () => {
    if (!product) return;

    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      Modal.confirm({
        title: 'Yêu cầu đăng nhập',
        content: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.',
        okText: 'Đăng nhập',
        cancelText: 'Hủy',
        onOk() { navigate('/login'); }
      });
      return;
    }

    // 2. Kiểm tra lựa chọn size/màu
    if (!selectedSize) {
      message.warning("Vui lòng chọn Size!");
      return;
    }

    setCartLoading(true);
    try {
      // 3. Gọi service để lưu vào DB
      await cartService.addToCart({
        productId: product._id || product.id,
        name: product.name,
        price: product.price,
        image: activeImage, // Lưu ảnh của variant đang chọn
        size: selectedSize,
        quantity: 1
      });

      // 4. Cập nhật số lượng trên Header ngay lập tức
      await refreshCart();

      message.success("Đã thêm vào giỏ hàng!");

      // Nếu muốn thêm xong nhảy sang trang giỏ hàng thì dùng: 
      // navigate('/cart');
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng!");
    } finally {
      setCartLoading(false);
    }
  };

  const handleVariantClick = (variant: Variant) => {
    setSelectedColor(variant.color);
    setActiveImage(variant.image);
  };

  // 2. HÀM XỬ LÝ VIRTUAL TRY ON
  const handleVirtualTryOn = () => {
    if (!product) return;

    // Kiểm tra xem sản phẩm có dữ liệu 3D không
    if (!product.threeDModels) {
      message.error("Sản phẩm này hiện chưa hỗ trợ thử đồ ảo!");
      return;
    }

    // Lấy link model dựa trên size đang chọn (Ví dụ: "M")
    const modelUrl = product.threeDModels[selectedSize];

    if (!modelUrl) {
      message.warning(`Size ${selectedSize} hiện chưa có sẵn mẫu 3D!`);
      return;
    }

    // Chuyển hướng sang trang Try-On kèm dữ liệu model
    navigate('/try-on', {
      state: {
        modelUrl: modelUrl,
        productName: product.name,
        category: product.category // Để Canvas biết là mặc áo hay quần
      }
    });
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      Modal.confirm({
        title: 'Bạn chưa đăng nhập',
        content: 'Bạn cần đăng nhập để thêm yêu thích.',
        okText: 'Đăng nhập ngay',
        cancelText: 'Để sau',
        onOk() { navigate('/login'); }
      });
      return;
    }

    if (!selectedSize || !selectedColor) {
      message.warning("Vui lòng chọn Size và Màu sắc!");
      return;
    }

    setWishlistLoading(true);
    try {
      const parsedUser = JSON.parse(storedUser);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/wishlist/add`, {
        userId: parsedUser.id,
        productId: product._id || product.id,
        selectedSize,
        selectedColor
      });
      message.success("Đã thêm vào danh sách yêu thích!");
    } catch (error: any) {
      message.error("Lỗi kết nối!");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!product) return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy sản phẩm</div>;

  return (
    <div className="product-detail-container">
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
            <img src={product.image} className="thumb-img" alt="thumb" />
          )}
        </div>
        <div className="main-image-wrapper">
          <img src={activeImage} alt={product.name} className="main-image" />
        </div>
      </div>

      <div className="info-section">
        <span className="brand-label">Brand: {product.brand || 'NO BRAND'}</span>
        <h1 className="product-title">{product.name}</h1>
        <div className="product-price">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
        </div>

        <div className="option-group">
          <span className="option-label">Màu sắc:</span>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            {product.variants?.map((v, index) => (
              <div key={index} onClick={() => handleVariantClick(v)}
                className="color-circle"
                style={{
                  backgroundColor: v.color,
                  border: selectedColor === v.color ? '2px solid #333' : '1px solid #ddd',
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="option-group">
          <span className="option-label">Size:</span>
          <div className="size-list">
            {product.sizes?.map((size) => (
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
          <p style={{ whiteSpace: 'pre-line', color: '#555' }}>{product.description}</p>
        </div>

        <div className="action-buttons">
          <button className="btn-wishlist" onClick={handleAddToWishlist} disabled={wishlistLoading}>
            {wishlistLoading ? 'Đang xử lý...' : '♡ THÊM VÀO YÊU THÍCH'}
          </button>

          {/* 3. TÍCH HỢP NÚT VIRTUAL TRY ON */}
          <button
            className="btn-try-on"
            onClick={handleVirtualTryOn}
          >
            Virtual Try On
          </button>

          {/* NÚT THÊM GIỎ HÀNG ĐÃ CẬP NHẬT LOGIC */}
          <button
            className="btn-shop"
            onClick={handleAddToCart}
            disabled={cartLoading}
          >
            {cartLoading ? 'ĐANG THÊM...' : 'THÊM VÀO GIỎ HÀNG'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;