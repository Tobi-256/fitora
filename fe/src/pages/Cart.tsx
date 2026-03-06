import  { useState, useMemo } from 'react';
import { useCart } from '../contexts/useCart';
import { cartService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ChevronLeft, ShoppingBag,  } from 'lucide-react';
import './Cart.css';
import { message, Modal, Checkbox } from 'antd';

const Cart = () => {
  const { cartItems, refreshCart, loading } = useCart();
  const navigate = useNavigate();

  // 1. STATE LƯU TRỮ CÁC SẢN PHẨM ĐƯỢC CHỌN (Dùng key kết hợp productId + size)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // 2. TÍNH TOÁN TỔNG TIỀN CHỈ CHO CÁC MÓN ĐÃ CHỌN
  const checkoutData = useMemo(() => {
    const selectedItems = cartItems.filter(item => 
      selectedKeys.includes(`${item.productId}-${item.size}`)
    );
    const total = selectedItems.reduce((sum, item) => 
      sum + (Number(item.price) * Number(item.quantity)), 0
    );
    return { selectedItems, total };
  }, [cartItems, selectedKeys]);

  // Xử lý chọn/bỏ chọn từng item
  const handleSelectItem = (productId: string, size: string) => {
    const key = `${productId}-${size}`;
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Xử lý chọn tất cả
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKeys(cartItems.map(item => `${item.productId}-${item.size}`));
    } else {
      setSelectedKeys([]);
    }
  };

  // Hàm xóa sản phẩm
  const handleRemoveItem = async (productId: string, size: string) => {
    Modal.confirm({
      title: 'Xóa sản phẩm',
      content: 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          await cartService.removeFromCart({ productId, size });
          message.success("Đã xóa sản phẩm");
          await refreshCart(); 
          // Xóa key khỏi danh sách chọn nếu sản phẩm bị xóa khỏi giỏ
          setSelectedKeys(prev => prev.filter(k => k !== `${productId}-${size}`));
        } catch (error) {
          message.error("Lỗi khi xóa sản phẩm!");
        }
      }
    });
  };

  // Hàm cập nhật số lượng
  const handleUpdateQuantity = async (productId: string, size: string, currentQty: number, adjustment: number) => {
    const newQty = currentQty + adjustment;
    if (newQty < 1) {
      handleRemoveItem(productId, size);
      return;
    }
    try {
      await cartService.updateCartItem({ productId, size, quantity: newQty });
      await refreshCart();
    } catch (error) {
      message.error("Không thể cập nhật số lượng!");
    }
  };

  // 3. XỬ LÝ CHUYỂN SANG THANH TOÁN
  const handleProceedToCheckout = () => {
    if (checkoutData.selectedItems.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }
    // Truyền dữ liệu sang trang Checkout qua state
    navigate('/checkout', { 
      state: { checkoutItems: checkoutData.selectedItems } 
    });
  };

  if (loading) return <div className="cart-loading">Đang tải giỏ hàng...</div>;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <ShoppingBag size={64} strokeWidth={1} />
        <h2>Giỏ hàng của bạn đang trống</h2>
        <Link to="/" className="back-home">
          <ChevronLeft size={20} /> Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Giỏ Hàng ({cartItems.length})</h1>

      <div className="cart-layout">
        <div className="cart-items-list">
          {/* Nút chọn tất cả */}
          <div className="select-all-bar">
            <Checkbox 
              onChange={(e) => handleSelectAll(e.target.checked)}
              checked={selectedKeys.length === cartItems.length && cartItems.length > 0}
            >
              Chọn tất cả ({cartItems.length} sản phẩm)
            </Checkbox>
          </div>

          {cartItems.map((item: any) => (
            <div key={`${item.productId}-${item.size}`} className="cart-item-card">
              {/* Checkbox chọn sản phẩm */}
              <div className="item-checkbox">
                <Checkbox 
                  checked={selectedKeys.includes(`${item.productId}-${item.size}`)}
                  onChange={() => handleSelectItem(item.productId, item.size)}
                />
              </div>

              <img src={item.image} alt={item.name} className="item-image" />
              
              <div className="item-info">
                <h3 className="item-name">{item.name}</h3>
                <p className="item-variant">Size: <span>{item.size}</span></p>
                <p className="item-price">
                  {(Number(item.price) || 0).toLocaleString()}đ
                </p>
              </div>

              <div className="quantity-control">
                <button onClick={() => handleUpdateQuantity(item.productId, item.size, item.quantity, -1)}>
                  <Minus size={14} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => handleUpdateQuantity(item.productId, item.size, item.quantity, 1)}>
                  <Plus size={14} />
                </button>
              </div>

              <button onClick={() => handleRemoveItem(item.productId, item.size)} className="btn-remove">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-card">
            <h2>Tóm tắt đơn hàng</h2>
            <div className="summary-row">
              <span>Đã chọn</span>
              <span>{checkoutData.selectedItems.length} sản phẩm</span>
            </div>
            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{checkoutData.total.toLocaleString()}đ</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span className="free-shipping">Miễn phí</span>
            </div>
            <div className="summary-total">
              <span>Tổng cộng</span>
              <span className="total-amount">
                {checkoutData.total.toLocaleString()}đ
              </span>
            </div>

            <button 
              onClick={handleProceedToCheckout} 
              className={`btn-checkout ${checkoutData.selectedItems.length === 0 ? 'disabled' : ''}`}
            >
              Thanh Toán Ngay ({checkoutData.selectedItems.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;