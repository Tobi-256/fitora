import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, Menu, Typography, Card, Row, Col, 
  Statistic, Spin, Tag, message 
} from 'antd';
import {
  UserOutlined, DashboardOutlined, LogoutOutlined,
   ShoppingOutlined, DollarOutlined, 
  ArrowUpOutlined, RiseOutlined,FallOutlined
} from '@ant-design/icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// Dữ liệu thống kê
const data = [
  { month: 'Tháng 1', revenue: 159000, orders: 1 },
  { month: 'Tháng 2', revenue: 6826000, orders: 3 },
  { month: 'Tháng 3', revenue: 3560000, orders: 1 },
];

const RevenueStats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = setTimeout(() => {
      if (auth?.currentUser) {
        setLoading(false);
      } else {
        navigate('/login');
      }
    }, 500);
    return () => clearTimeout(checkAuth);
  }, [navigate]);

  const handleLogout = async () => {
  try {
    if (auth) { // Thêm dòng này để đảm bảo auth không null
      await signOut(auth);
      message.success("Đã đăng xuất thành công!");
      navigate('/login');
    }
  } catch (error) {
    message.error("Lỗi khi đăng xuất");
  }
};

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
        <Spin size="large" tip="Đang tính toán dữ liệu tài chính Fittora..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDEBAR - Giữ nguyên style từ AdminOrders */}
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
          defaultSelectedKeys={['revenue']}
          style={{ marginTop: '16px' }}
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Tổng quan', onClick: () => navigate('/admin/dashboard') },
            { key: 'revenue', icon: <RiseOutlined />, label: 'Thống kê doanh thu' },
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
            { type: 'divider' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout, danger: true },
          ]}
        />
      </Sider>

      <Layout>
        {/* HEADER - Giữ nguyên style từ AdminOrders */}
        <Header style={{ 
          background: '#fff', padding: '0 24px', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1 
        }}>
          <Title level={4} style={{ margin: 0 }}>Thống kê tài chính</Title>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>
            <UserOutlined /> {auth?.currentUser?.email}
          </Tag>
        </Header>

        {/* CONTENT */}
        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <Row gutter={[16, 16]}>
            {/* Card Statistic */}
            <Col xs={24} lg={8}>
              <Card bordered={false} hoverable style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Statistic
                  title="Doanh thu quý hiện tại"
                  value={10545000}
                  precision={0}
                  valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
                  prefix={<DollarOutlined />}
                  suffix="₫"
                />
                <Text type="secondary">
                  <ArrowUpOutlined /> +15.5% so với tháng trước
                </Text>
              </Card>
            </Col>

            {/* Area Chart */}
            <Col xs={24} lg={16}>
              <Card 
                title={<Text strong>Xu hướng doanh thu (VNĐ)</Text>} 
                bordered={false}
                style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} 
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatVND(Number(value)), "Doanh thu"]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#1890ff" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            {/* Bar Chart */}
            <Col xs={24}>
              <Card 
                title={<Text strong>Phân tích số lượng đơn hàng thành công</Text>} 
                bordered={false}
                style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: '#f5f5f5'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar 
                        dataKey="orders" 
                        fill="#52c41a" 
                        radius={[4, 4, 0, 0]} 
                        name="Đơn hàng"
                        barSize={50} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default RevenueStats;