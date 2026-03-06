import { useEffect, useState } from 'react';
import { orderService } from '../services/api';
import { Table, Tag, Card, Button, Typography, message, Spin } from 'antd';
import { ShoppingBag, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const OrderHistory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await orderService.getMyOrders();
      setOrders(res.data);
    } catch (error) {
      message.error("Không thể tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text copyable>{id.substring(0, 8)}...</Text>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: any) => {
        const d = new Date(date?._seconds * 1000 || date);
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => (
        <div style={{ maxWidth: 200 }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ fontSize: '12px' }}>
              • {item.name} (x{item.quantity})
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <Text strong style={{ color: '#ff4d4f' }}>{amount.toLocaleString()}đ</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'gold';
        let text = 'Đang xử lý';
        if (status === 'shipping') { color = 'blue'; text = 'Đang giao'; }
        if (status === 'completed') { color = 'green'; text = 'Hoàn thành'; }
        if (status === 'cancelled') { color = 'red'; text = 'Đã hủy'; }
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          icon={<Eye size={16} />} 
          onClick={() => navigate(`/order-detail/${record.id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 30 }}>
        <ShoppingBag style={{ marginRight: 10 }} /> Lịch sử đơn hàng
      </Title>

      {orders.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '50px 0' }}>
          <ShoppingBag size={48} color="#ccc" style={{ marginBottom: 20 }} />
          <p>Bạn chưa có đơn hàng nào.</p>
          <Button type="primary" onClick={() => navigate('/')}>Mua sắm ngay</Button>
        </Card>
      ) : (
        <Table 
          columns={columns} 
          dataSource={orders} 
          rowKey="id" 
          pagination={{ pageSize: 5 }}
          scroll={{ x: 800 }} // Hỗ trợ mobile
        />
      )}
    </div>
  );
};

export default OrderHistory;