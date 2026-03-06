import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, Menu, Table, Select, message, Typography, 
  Card, Tag, Spin, Avatar 
} from 'antd';
import {
  UserOutlined, DashboardOutlined, LogoutOutlined,
  TeamOutlined, ShoppingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
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
      // Kiểm tra chắc chắn auth tồn tại trước khi gọi signOut
      if (auth) {
        await signOut(auth);
        message.success("Đã đăng xuất thành công!");
        navigate('/login');
      } else {
        // Trường hợp hy hữu auth không tồn tại vẫn chuyển về login
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
      width: 150,
      render: (id: string) => <Tag color="blue">{id.substring(0, 8).toUpperCase()}</Tag>
    },
    { 
      title: 'Khách hàng', 
      dataIndex: ['shippingInfo', 'fullName'], 
      key: 'customer',
      render: (name: string) => <b>{name || "Khách lẻ"}</b>
    },
    { 
      title: 'Tổng tiền', 
      dataIndex: 'totalAmount', 
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
      render: (status: string, record: any) => (
        <Select
          value={status}
          style={{ width: 150 }}
          onChange={(value) => handleUpdateStatus(record.id, value)}
        >
          <Select.Option value="pending"> Chờ xử lý</Select.Option>
          <Select.Option value="shipping"> Đang giao</Select.Option>
          <Select.Option value="completed"> Thành Công</Select.Option>
          <Select.Option value="cancelled"> Đã hủy</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      render: (date: any) => {
        // Xử lý cả Timestamp của Firebase hoặc ISO String
        const d = date?._seconds ? new Date(date._seconds * 1000) : new Date(date);
        return d.toLocaleString('vi-VN');
      }
    }
  ];

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Đang tải danh sách đơn hàng..." />
      </div>
    );
  }

  return (
    <Layout className="dashboard-layout" style={{ minHeight: '100vh' }}>
      {/* SIDEBAR DÙNG CHUNG VỚI DASHBOARD */}
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark" width={250}>
        <div className="dashboard-logo" style={{ color: 'white', padding: '20px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #333' }}>
          FITTORA ADMIN
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['3']} // Active mục Duyệt đơn hàng
          style={{ marginTop: '16px' }}
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Tổng quan', onClick: () => navigate('/admin/dashboard') },
            { key: '2', icon: <TeamOutlined />, label: 'Quản lý User' },
            { key: '3', icon: <ShoppingOutlined />, label: 'Duyệt đơn hàng' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout, danger: true },
          ]}
        />
      </Sider>

      {/* CONTENT AREA */}
      <Layout>
        <Header className="dashboard-header" style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Title level={4} style={{ margin: 0 }}>Duyệt đơn hàng hệ thống</Title>
          <div className="admin-info">
            <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
              <UserOutlined /> {auth?.currentUser?.email}
            </Tag>
          </div>
        </Header>

        <Content style={{ margin: '24px' }}>
          <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '8px' }}>
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>Danh sách đơn hàng cần xử lý</Title>
            </div>
            
            <Table 
              dataSource={orders} 
              columns={columns} 
              rowKey="id" 
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900 }} 
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminOrders;