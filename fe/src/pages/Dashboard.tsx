import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout, Menu, Card, Row, Col, Statistic, Table,
  Avatar, Tag, Button, Typography, Spin, message
} from 'antd';
import {
  UserOutlined, DashboardOutlined, LogoutOutlined,
  TeamOutlined, DollarOutlined, RiseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import './Dashboard.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// URL Backend
const API_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  newUsers: number;
  totalAdmins: number;
  premiumRate: number | string;
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
    premiumUsers: 0,
    newUsers: 0,
    totalAdmins: 0,
    premiumRate: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // --- 3. HÀM LẤY DỮ LIỆU ---
  const fetchDashboardData = async () => {
    try {
      // FIX LỖI: Thêm dấu ?
      const user = auth?.currentUser;

      if (!user) return;

      const token = await user.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const statsRes = await axios.get(`${API_URL}/api/users/stats`, config);
      const usersRes = await axios.get(`${API_URL}/api/users?limit=10`, config);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
      message.error("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // FIX LỖI: Thêm dấu ?
      if (auth?.currentUser) {
        fetchDashboardData();
      } else {
        navigate('/login');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  // --- 4. HÀM ĐĂNG XUẤT ---
  const handleLogout = async () => {
    try {
      // FIX LỖI: Kiểm tra auth tồn tại trước khi sign out
      if (auth) {
        await signOut(auth);
        message.success("Đã đăng xuất!");
        navigate('/login');
      }
    } catch (error) {
      message.error("Lỗi đăng xuất");
    }
  };

  // --- 5. CẤU HÌNH CỘT ---
  const columns: ColumnsType<UserData> = [
    {
      title: 'Avatar',
      dataIndex: 'avatarUrl',
      key: 'avatar',
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
      title: 'Quyền (Role)',
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
        <Tag color={isPre ? 'gold' : 'default'}>
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
      <div className="dashboard-loading">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <Layout className="dashboard-layout">
      {/* SIDEBAR */}
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark" width={250}>
        <div className="dashboard-logo">FITTORA ADMIN</div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Tổng quan' },
            { key: '2', icon: <TeamOutlined />, label: 'Quản lý User' },
            { key: '3', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout, danger: true },
          ]}
        />
      </Sider>

      {/* CONTENT */}
      <Layout>
        <Header className="dashboard-header">
          <Title level={4} style={{ margin: 0 }}>Dashboard Overview</Title>
          <div className="admin-info">
            {/* FIX LỖI: Thêm dấu ? */}
            Xin chào, {auth?.currentUser?.email}
          </div>
        </Header>

        <Content className="dashboard-content">
          {/* STATS CARDS */}
          <Row gutter={[16, 16]} className="stats-row">
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="stat-card">
                <Statistic
                  title="Tổng người dùng"
                  value={stats.totalUsers}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="stat-card">
                <Statistic
                  title="Thành viên Premium"
                  value={stats.premiumUsers}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                  suffix={<span style={{ fontSize: 12, color: '#999' }}>({stats.premiumRate}%)</span>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="stat-card">
                <Statistic
                  title="Người dùng mới (30 ngày)"
                  value={stats.newUsers}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="stat-card">
                <Statistic
                  title="Quản trị viên"
                  value={stats.totalAdmins}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* USER TABLE */}
          <div className="table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Title level={5}>Người dùng đăng ký gần đây</Title>
              <Button type="primary">Xem tất cả</Button>
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