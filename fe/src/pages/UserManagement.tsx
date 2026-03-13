import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, Menu, Table, Tag, message, Typography, 
  Card, Avatar, Space, Input
} from 'antd';
import {
  UserOutlined, DashboardOutlined, LogoutOutlined,
  TeamOutlined, ShoppingOutlined, RiseOutlined,
  SearchOutlined, FallOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { ColumnsType } from 'antd/es/table';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isPremium: boolean;
  avatarUrl: string;
  createdAt: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchUsers = useCallback(async (currentUser: User) => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.get(`${API_URL}/api/users`, config);

      if (res.data.success) {
        setUsers(res.data.data);
      } else {
        const fallbackData = Array.isArray(res.data) ? res.data : (res.data.users || []);
        setUsers(fallbackData);
      }
    } catch (error: any) {
      console.error("Lỗi fetch users:", error);
      message.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUsers(user);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, fetchUsers]);

  const columns: ColumnsType<UserData> = [
    {
      title: 'Người dùng',
      key: 'user_info',
      fixed: 'left', // Giữ cột này khi cuộn ngang
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatarUrl} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name || 'Chưa đặt tên'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Quyền hạn',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {(role || 'USER').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Gói cước',
      dataIndex: 'isPremium',
      key: 'isPremium',
      width: 150,
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
      width: 200,
      render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A',
    }
  ];

  const filteredUsers = users.filter(u => {
    const search = searchText.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(search) ||
      (u.name || '').toLowerCase().includes(search)
    );
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark" width={250}>
        <div style={{ color: 'white', padding: '24px 20px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
          FITTORA ADMIN
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['2']}
          items={[
            { key: '1', icon: <DashboardOutlined />, label: 'Tổng quan', onClick: () => navigate('/admin/dashboard') },
            { key: 'revenue', icon: <RiseOutlined />, label: 'Thống kê doanh thu', onClick: () => navigate('/admin/revenue') },
            { key: 'returns', icon: <FallOutlined />, label: 'Tỷ lệ đổi trả', onClick: () => navigate('/admin/returns') },
            { key: '2', icon: <TeamOutlined />, label: 'Quản lý User' },
            { key: '3', icon: <ShoppingOutlined />, label: 'Duyệt đơn hàng', onClick: () => navigate('/admin/orders') },
            { type: 'divider' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: () => auth && signOut(auth) },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Danh sách người dùng</Title>
          <Input 
            placeholder="Tìm kiếm..." 
            prefix={<SearchOutlined />} 
            style={{ width: 300 }}
            allowClear
            onChange={e => setSearchText(e.target.value)}
          />
        </Header>

        <Content style={{ margin: '24px' }}>
          <Card bordered={false}>
            <Table 
              loading={loading}
              columns={columns} 
              dataSource={filteredUsers} 
              rowKey="id"
              // CẤU HÌNH THANH CUỘN Ở ĐÂY
              scroll={{ x: 1000, y: 'calc(100vh - 300px)' }} 
              pagination={{ 
                pageSize: 20, 
                showSizeChanger: true,
                showTotal: (total) => `Tổng cộng ${total} người dùng` 
              }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserManagement;