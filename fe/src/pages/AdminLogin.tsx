import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { LockOutlined, UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';
import './AdminLogin.css';

const { Title, Text } = Typography;
const { Content } = Layout;

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);

    if (!auth) {
      message.error("Lỗi hệ thống: Firebase Auth chưa được khởi tạo.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth!, values.email, values.password);
      const user = userCredential.user;
      const token = await user.getIdToken();

      // Lưu token vào localStorage để axios interceptor có thể sử dụng
      localStorage.setItem('firebaseToken', token);

      const res = await api.get('/users/me');

      if (res.data && res.data.role === 'admin') {
        message.success('Chào mừng quản trị viên quay lại!');
        navigate('/admin/dashboard');
      } else {
        await signOut(auth!);
        localStorage.removeItem('firebaseToken');
        message.error('Tài khoản này không có quyền truy cập trang Quản trị!');
      }
    } catch (error: any) {
      console.error("Lỗi đăng nhập Admin:", error);

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message.error('Sai email hoặc mật khẩu!');
      } else if (error.code === 'auth/too-many-requests') {
        message.error('Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.');
      } else {
        // Hiển thị lỗi từ backend (nếu có) hoặc lỗi chung
        const serverMsg = error.response?.data?.message;
        message.error(serverMsg || error.message || 'Đăng nhập thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#001529' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card
          style={{ width: 400, borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
          bordered={false}
          className="admin-login-card" // Class để CSS animation nếu cần
        >
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: 10, marginBottom: 5 }}>Fittora Admin</Title>
            <Text type="secondary">Cổng đăng nhập quản trị hệ thống</Text>
          </div>

          <Form
            name="admin_login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email quản trị viên" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 45, fontWeight: 'bold' }}>
                ĐĂNG NHẬP ADMIN
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <a href="/" style={{ color: '#888', fontSize: '14px' }}>← Quay về trang chủ bán hàng</a>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminLogin;