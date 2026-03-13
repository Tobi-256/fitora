import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Menu, Table, Select, message, Typography,
  Card, Tag, Spin, Avatar, Space, Badge
} from 'antd';
import {
  UserOutlined, DashboardOutlined, LogoutOutlined,
   ShoppingOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- HÀM LẤY DỮ LIỆU ---
  const fetchOrders = async () => {
    try {
      const user = auth?.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await axios.get(`${API_URL}/api/orders/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (error) {
      message.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // --- CẬP NHẬT TRẠNG THÁI ---
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = await auth?.currentUser?.getIdToken();
      await axios.put(`${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Cập nhật trạng thái thành công!");
      fetchOrders();
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái");
    }
  };

  // --- ĐĂNG XUẤT ---
  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        message.success("Đã đăng xuất thành công!");
        navigate('/login');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error("Logout error:", error);
      message.error("Lỗi khi đăng xuất");
    }
  };

  useEffect(() => {
    const checkAuth = setTimeout(() => {
      if (auth?.currentUser) {
        fetchOrders();
      } else {
        navigate('/login');
      }
    }, 500);
    return () => clearTimeout(checkAuth);
  }, [navigate]);

  // --- ĐỊNH NGHĨA CỘT BẢNG ---
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left' as const,
      render: (id: string) => <Tag color="blue">{id.substring(0, 8).toUpperCase()}</Tag>
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'items', // Hoặc 'products' tùy thuộc vào schema backend của bạn
      key: 'products',
      width: 300,
      render: (items: any[]) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {items?.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Badge count={item.quantity} size="small" offset={[-2, 32]} color="#108ee9">
                <Avatar
                  shape="square"
                  size={48}
                  src={item.image || item.productImage || 'https://via.placeholder.com/50'}
                  style={{ border: '1px solid #f0f0f0' }}
                />
              </Badge>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: '13px', display: 'block' }}>{item.name}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {item.color && `Màu: ${item.color}`} {item.size && `| Size: ${item.size}`}
                </Text>
              </div>
            </div>
          ))}
        </Space>
      )
    },
    {
      title: 'Khách hàng',
      dataIndex: ['shippingInfo', 'fullName'],
      key: 'customer',
      width: 180,
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name || "Khách lẻ"}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.shippingInfo?.phone}</div>
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      width: 130,
      render: (amount: number) => (
        <span style={{ color: '#cf1322', fontWeight: 'bold' }}>
          {amount?.toLocaleString('vi-VN')}₫
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string, record: any) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          onChange={(value) => handleUpdateStatus(record.id, value)}
        >
          <Select.Option value="pending">Chờ xử lý</Select.Option>
          <Select.Option value="shipping">Đang giao</Select.Option>
          <Select.Option value="completed">Thành Công</Select.Option>
          <Select.Option value="cancelled">Đã hủy</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: any) => {
        const d = date?._seconds ? new Date(date._seconds * 1000) : new Date(date);
        return <Text type="secondary">{d.toLocaleString('vi-VN')}</Text>;
      }
    }
  ];

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
        <Spin size="large" tip="Đang tải danh sách đơn hàng từ Fittora..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark" width={250}>
        <div style={{
          color: 'white', padding: '24px 20px', textAlign: 'center',
          fontSize: '22px', fontWeight: '800', letterSpacing: '1px',
          background: '#001529'
        }}>
          FITTORA <span style={{ color: '#1890ff' }}>ADMIN</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['3']}
          style={{ marginTop: '16px' }}
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Tổng quan', onClick: () => navigate('/admin/dashboard') },
            {
              key: 'revenue', // Key mới cho phần thống kê
              icon: <RiseOutlined />, // Icon biểu đồ tăng trưởng
              label: 'Thống kê doanh thu',
              onClick: () => navigate('/admin/revenue') // Đường dẫn đến trang biểu đồ tôi vừa viết
            },
            {
              key: 'returns', // Key mới cho phần tỷ lệ đổi trả
              icon: <FallOutlined />, // Icon thể hiện sự sụt giảm (tỷ lệ giảm là tốt)
              label: 'Tỷ lệ đổi trả',
              onClick: () => navigate('/admin/returns') // Đường dẫn tới file ReturnRateChart.tsx
            },
            // {
            //   key: '2',
            //   icon: <TeamOutlined />,
            //   label: 'Quản lý User',
            //   onClick: () => navigate('/admin/users') // Thêm dòng này để link đi
            // },
            { key: '3', icon: <ShoppingOutlined />, label: 'Duyệt đơn hàng' },
            { type: 'divider' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout, danger: true },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1
        }}>
          <Title level={4} style={{ margin: 0 }}>Quản lý Đơn hàng</Title>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>
            <UserOutlined /> {auth?.currentUser?.email}
          </Tag>
        </Header>

        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <Card
            bordered={false}
            title={<Title level={5} style={{ margin: 0 }}>Danh sách đơn hàng hệ thống</Title>}
            style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Table
              dataSource={orders}
              columns={columns}
              rowKey="id"
              pagination={{
                pageSize: 8,
                showTotal: (total) => `Tổng cộng ${total} đơn hàng`
              }}
              scroll={{ x: 1100 }}
              bordered
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminOrders;