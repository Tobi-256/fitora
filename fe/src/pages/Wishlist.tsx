import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spin, message, Modal } from 'antd'; // Dùng Ant Design cho đẹp (tuỳ chọn)
import { DeleteOutlined } from '@ant-design/icons';
import './Wishlist.css';

interface WishlistItem {
  wishlistId: string;
  productId: string;
  selectedSize: string;
  selectedColor: string;
  addedAt: string;
  productDetails: {
    name: string;
    price: number;
    image: string;
  };
}

const Wishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- LẤY USER ID THẬT ---
  const getUserId = () => {
    const storedUser = localStorage.getItem('user'); // Key 'user' như bạn đã confirm
    if (storedUser) {
      try {
        return JSON.parse(storedUser).id;
      } catch (e) { return null; }
    }
    return null;
  };

  // 1. Fetch dữ liệu
  const fetchWishlist = async () => {
    const userId = getUserId();

    if (!userId) {
      // Nếu chưa login, đá về login hoặc hiện trống
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/wishlist/${userId}`);
      setItems(res.data);
    } catch (error) {
      console.error("Lỗi lấy wishlist:", error);
      message.error("Không thể tải danh sách yêu thích");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // 2. Xóa item
  const handleRemove = async (wishlistId: string) => {
    // Dùng Modal confirm của AntD hoặc window.confirm
    Modal.confirm({
      title: 'Xóa sản phẩm',
      content: 'Bạn có chắc muốn xóa khỏi danh sách yêu thích?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/wishlist/${wishlistId}`);
          message.success("Đã xóa sản phẩm");
          // Cập nhật UI ngay lập tức
          setItems(prev => prev.filter(item => item.wishlistId !== wishlistId));
        } catch (error) {
          message.error("Lỗi khi xóa!");
        }
      }
    });
  };

  if (loading) return <div className="wishlist-loading"><Spin size="large" /></div>;

  return (
    <div className="wishlist-container">
      <h2 className="wishlist-title">Danh sách yêu thích ({items.length})</h2>

      {items.length === 0 ? (
        <div className="wishlist-empty">
          <p>Bạn chưa có sản phẩm nào trong danh sách yêu thích.</p>
          <button className="btn-shop-now" onClick={() => navigate('/product')}>
            Đi mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => (
            <div key={item.wishlistId} className="wishlist-card">
              {/* Hình ảnh (Backend đã trả về đúng ảnh theo màu) */}
              <div
                className="card-image"
                onClick={() => navigate(`/product/${item.productId}`)}
              >
                <img src={item.productDetails.image} alt={item.productDetails.name} />
              </div>

              <div className="card-info">
                <h3 className="card-name" onClick={() => navigate(`/product/${item.productId}`)}>
                  {item.productDetails.name}
                </h3>
                <p className="card-price">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.productDetails.price)}
                </p>

                {/* Hiển thị Size và Màu đã chọn */}
                <div className="card-variants">
                  <span className="variant-tag">Size: {item.selectedSize}</span>
                  <div
                    className="variant-color-circle"
                    style={{ backgroundColor: item.selectedColor }}
                    title="Màu đã chọn"
                  ></div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/product/${item.productId}`)}
                  >
                    Xem
                  </button>
                  <button
                    className="btn-remove"
                    onClick={() => handleRemove(item.wishlistId)}
                    title="Xóa"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;