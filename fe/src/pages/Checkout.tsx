import  { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/useCart';
import { orderService } from '../services/api';
import { message, Form, Input, Radio, Button, Card, Row, Col, Divider, Space, Empty } from 'antd';
import {  CreditCardOutlined, UserOutlined, PhoneOutlined, HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, refreshCart } = useCart();
  const [loading, setLoading] = useState(false);

  // 1. LẤY DANH SÁCH MÓN ĐÃ CHỌN TỪ STATE (Hoặc dùng toàn bộ giỏ nếu không có state)
  const checkoutItems = useMemo(() => {
    return location.state?.checkoutItems || cartItems;
  }, [location.state, cartItems]);

  // 2. TÍNH TỔNG TIỀN CHO NHỮNG MÓN ĐANG THANH TOÁN
  const totalAmount = useMemo(() => {
    return checkoutItems.reduce((sum: number, item: any) => 
      sum + (Number(item.price) * Number(item.quantity)), 0);
  }, [checkoutItems]);

  const onFinish = async (values: any) => {
    if (checkoutItems.length === 0) {
      message.error("Không có sản phẩm nào để thanh toán!");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: checkoutItems, // Chỉ gửi các món khách đã tick chọn
        totalAmount: totalAmount,
        shippingInfo: {
          fullName: values.fullName,
          phone: values.phone,
          address: values.address,
        },
        paymentMethod: values.paymentMethod,
      };

      // Gọi API đặt hàng (Backend sẽ tự xử lý việc chỉ xóa các món này khỏi giỏ)
      await orderService.createOrder(orderData);
      
      message.success("Đặt hàng thành công!");
      
      // Cập nhật lại Context để số lượng trên Header chính xác
      await refreshCart();

      // Đặt xong cho về lại trang giỏ hàng như bạn yêu cầu
      navigate('/cart'); 
    } catch (error: any) {
      message.error(error.response?.data?.message || "Đặt hàng thất bại!");
    } finally {
      setLoading(false);
    }
  };

  if (checkoutItems.length === 0 && !loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <Empty description="Bạn chưa chọn sản phẩm nào để thanh toán" />
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cart')} style={{ marginTop: 20 }}>
          Quay lại giỏ hàng
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/cart')} style={{ marginBottom: 20, padding: 0 }}>
        Quay lại giỏ hàng
      </Button>
      
      <h2 style={{ marginBottom: '30px', fontWeight: 'bold' }}>
        <CreditCardOutlined /> XÁC NHẬN THANH TOÁN
      </h2>

      <Row gutter={[32, 32]}>
        {/* BÊN TRÁI: FORM NHẬP THÔNG TIN */}
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px' }}><UserOutlined /> Thông tin giao hàng</h3>
            <Form layout="vertical" onFinish={onFinish} size="large">
              <Form.Item 
                label="Họ và tên người nhận" 
                name="fullName" 
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nguyễn Văn A" />
              </Form.Item>

              <Form.Item 
                label="Số điện thoại" 
                name="phone" 
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
                ]}
              >
                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="0901234567" />
              </Form.Item>

              <Form.Item 
                label={<span><HomeOutlined /> Địa chỉ giao hàng</span>} 
                name="address" 
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
              >
                <Input.TextArea placeholder="Số nhà, tên đường, phường/xã..." rows={3} />
              </Form.Item>

              <Divider />

              <h3 style={{ marginBottom: '20px' }}><CreditCardOutlined /> Phương thức thanh toán</h3>
              <Form.Item name="paymentMethod" initialValue="COD">
                <Radio.Group style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Card size="small" hoverable style={{ border: '1px solid #f0f0f0' }}>
                      <Radio value="COD">Thanh toán khi nhận hàng (COD)</Radio>
                    </Card>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block 
                loading={loading}
                style={{ height: '54px', background: '#000', borderRadius: '8px', marginTop: '20px' }}
              >
                XÁC NHẬN ĐẶT HÀNG ({(checkoutItems.length)} MÓN)
              </Button>
            </Form>
          </Card>
        </Col>

        {/* BÊN PHẢI: TÓM TẮT ĐƠN HÀNG */}
        <Col xs={24} lg={10}>
          <Card 
            title={<span style={{ fontWeight: 'bold' }}>Sản phẩm thanh toán</span>}
            bordered={false} 
            style={{ backgroundColor: '#fafafa', borderRadius: '12px', position: 'sticky', top: '20px' }}
          >
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {checkoutItems.map((item: any, index: number) => (
                <div key={index} style={{ display: 'flex', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                  <img 
                    src={item.image}
                    alt={item.name} 
                    style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                  />
                  <div style={{ marginLeft: '12px', flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Size: {item.size} | SL: {item.quantity}</div>
                    <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
                      {(item.price * item.quantity).toLocaleString()}đ
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Tạm tính ({checkoutItems.length} món):</span>
                <span>{totalAmount.toLocaleString()}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Phí vận chuyển:</span>
                <span style={{ color: '#52c41a' }}>Miễn phí</span>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>TỔNG CỘNG:</span>
                <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '20px' }}>
                  {totalAmount.toLocaleString()}đ
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Checkout;