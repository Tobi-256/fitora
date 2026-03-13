import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, Menu, Typography, Card, Tag, 
  Spin, message, Row, Col, Space 
} from 'antd';
import {
  UserOutlined, DashboardOutlined, LogoutOutlined,
  ShoppingOutlined, FallOutlined, 
  RiseOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// Dữ liệu xu hướng giảm từ T2/2026 về trước
const data = [
  { month: 'T10/2025', rate: 12.5 },
  { month: 'T11/2025', rate: 13.8 },
  { month: 'T12/2025', rate: 14.2 },
  { month: 'T01/2026', rate: 9.5 },  
  { month: 'T02/2026', rate: 5.8 },  
  { month: 'T03/2026', rate: 2.4 },  
];

const ReturnRateChart: React.FC = () => {
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
      if (auth) {
        await signOut(auth);
        message.success("Đã đăng xuất thành công!");
        navigate('/login');
      }
    } catch (error) {
      message.error("Lỗi khi đăng xuất");
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
        <Spin size="large" tip="Đang phân tích chỉ số chất lượng Fittora..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDEBAR - Đồng bộ 100% */}
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
          defaultSelectedKeys={['returns']}
          style={{ marginTop: '16px' }}
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Tổng quan', onClick: () => navigate('/admin/dashboard') },
            { key: 'revenue', icon: <RiseOutlined />, label: 'Thống kê doanh thu', onClick: () => navigate('/admin/revenue') },
            { key: 'returns', icon: <FallOutlined />, label: 'Tỷ lệ đổi trả' },
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
        {/* HEADER - Đồng bộ 100% */}
        <Header style={{ 
          background: '#fff', padding: '0 24px', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1 
        }}>
          <Title level={4} style={{ margin: 0 }}>Phân tích Tỷ lệ Đổi trả</Title>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>
            <UserOutlined /> {auth?.currentUser?.email}
          </Tag>
        </Header>

        {/* CONTENT */}
        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <FallOutlined style={{ color: '#ff4d4f' }} />
                    <span>Biểu đồ tỷ lệ đổi trả hàng theo tháng</span>
                  </Space>
                }
                bordered={false} 
                style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis 
                        tickFormatter={(val) => `${val}%`} 
                        domain={[0, 16]} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, "Tỷ lệ đổi trả"]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                      />
                      <Legend verticalAlign="top" height={36} align="right" />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#ff4d4f" 
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#ff4d4f', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        name="Tỷ lệ đổi trả (%)"
                        animationDuration={2000}
                      />
                    </LineChart>
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

export default ReturnRateChart;