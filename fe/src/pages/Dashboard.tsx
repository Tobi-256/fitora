import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

import {
  Layout, Menu, Card, Row, Col, Statistic, Table,
  Avatar, Tag, Button, Typography, Spin, message
} from 'antd';
import {
  UserOutlined, DashboardOutlined, LogoutOutlined,
  TeamOutlined, DollarOutlined, RiseOutlined,
  ShoppingOutlined,
  FallOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import './Dashboard.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// ==========================================
// CHỖ ĐỂ ÔNG ĐỔI SỐ CỨNG Ở ĐÂY NÈ
const HARDCODED_REVENUE = 10545000; // Ví dụ: 50 triệu VNĐ
// ==========================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  newUsers: number;
  totalAdmins: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isPremium: boolean;
  avatarUrl: string;
  createdAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: HARDCODED_REVENUE, // Gán số cứng ngay từ đầu
    newUsers: 0,
    totalAdmins: 0,
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const fetchDashboardData = async () => {
    try {
      const user = auth?.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/stats`, config),
        axios.get(`${API_URL}/api/users?limit=10`, config)
      ]);

      if (statsRes.data.success) {
        setStats({
          totalUsers: statsRes.data.data.totalUsers,
          totalRevenue: HARDCODED_REVENUE, // Tiếp tục ép dùng số cứng sau khi load xong các stats khác
          newUsers: statsRes.data.data.newUsers,
          totalAdmins: statsRes.data.data.totalAdmins,
        });
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
      message.error("Không thể tải dữ liệu hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (auth?.currentUser) {
        fetchDashboardData();
      } else {
        navigate('/login');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        message.success("Đã đăng xuất thành công!");
        navigate('/login');
      }
    } catch (error) {
      message.error("Lỗi khi đăng xuất");
    }
  };

  const columns: ColumnsType<UserData> = [
    {
      title: 'Avatar',
      dataIndex: 'avatarUrl',
      key: 'avatar',
      width: 80,
      render: (url: string) => <Avatar src={url} icon={<UserOutlined />} />,
    },
    {
      title: 'Tên hiển thị',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text || "Chưa đặt tên"}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Quyền hạn',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role ? role.toUpperCase() : 'USER'}
        </Tag>
      ),
    },
    {
      title: 'Gói cước',
      dataIndex: 'isPremium',
      key: 'isPremium',
      render: (isPre: boolean) => (
        <Tag color={isPre ? 'gold' : 'default'} style={{ fontWeight: 'bold' }}>
          {isPre ? 'PREMIUM' : 'FREE'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Đang kết nối hệ thống Fittora..." />
      </div>
    );
  }

  return (
    <Layout className="dashboard-layout" style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark" width={250}>
        <div className="dashboard-logo" style={{ color: 'white', padding: '20px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #333' }}>
          FITTORA ADMIN
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          style={{ marginTop: '16px' }}
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Tổng quan' },
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
            { key: '3', icon: <ShoppingOutlined />, label: 'Duyệt đơn hàng', onClick: () => navigate('/admin/orders') },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout, danger: true },
          ]}
        />
      </Sider>

      <Layout>
        <Header className="dashboard-header" style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Title level={4} style={{ margin: 0 }}>Bảng điều khiển hệ thống</Title>
          <div className="admin-info">
            <span style={{ marginRight: 12 }}>Xin chào,</span>
            <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>{auth?.currentUser?.email}</Tag>
          </div>
        </Header>

        <Content className="dashboard-content" style={{ margin: '24px' }}>
          <Row gutter={[16, 16]} className="stats-row">
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable>
                <Statistic
                  title="Tổng người dùng"
                  value={stats.totalUsers}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>

            {/* MỤC DOANH THU - ĐANG DÙNG SỐ CỨNG */}
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable>
                <Statistic
                  title="Tổng doanh thu"
                  value={stats.totalRevenue}
                  formatter={(val) => formatVND(Number(val))}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable>
                <Statistic
                  title="Người dùng mới (30 ngày)"
                  value={stats.newUsers}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable>
                <Statistic
                  title="Quản trị viên"
                  value={stats.totalAdmins}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <div className="table-container" style={{ marginTop: '24px', background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>Người dùng đăng ký gần đây</Title>
              <Button type="primary" ghost>Xem tất cả người dùng</Button>
            </div>

            <Table
              columns={columns}
              dataSource={users}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;