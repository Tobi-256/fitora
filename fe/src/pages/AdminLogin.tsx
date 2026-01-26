import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Layout, Space, Divider } from 'antd';
import { LockOutlined, UserOutlined, SafetyCertificateOutlined, GoogleOutlined, FacebookFilled } from '@ant-design/icons';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/useAuth';
import api from '../services/api';
import './AdminLogin.css';

const { Title, Text } = Typography;
const { Content } = Layout;

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const { loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();

  const handlePostLogin = async (user: any) => {
    try {
      const token = await user.getIdToken();
      localStorage.setItem('firebaseToken', token);

      // Đồng bộ user lên Backend
      const syncRes = await api.post('/users/sync', {
        firebaseUid: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0],
        avatarUrl: user.photoURL || '',
        providerId: user.providerData?.[0]?.providerId || 'password',
      });

      const userData = syncRes.data?.user;

      if (userData && userData.role === 'admin') {
        message.success('Chào mừng quản trị viên quay lại!');
        navigate('/admin/dashboard');
      } else {
        await signOut(auth!);
        localStorage.removeItem('firebaseToken');
        message.error('Tài khoản này không có quyền truy cập trang Quản trị!');
      }
    } catch (error: any) {
      console.error("Post-login error:", error);
      message.error('Lỗi khi kiểm tra quyền quản trị.');
      await signOut(auth!);
      localStorage.removeItem('firebaseToken');
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth!, values.email, values.password);
      await handlePostLogin(userCredential.user);
    } catch (error: any) {
      console.error("Lỗi đăng nhập Admin:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message.error('Sai email hoặc mật khẩu!');
      } else {
        message.error('Đăng nhập thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook', loginFn: Function) => {
    setSocialLoading(provider);
    try {
      const result: any = await loginFn();
      const user = result?.user || result;
      if (user) await handlePostLogin(user);
    } catch (error: any) {
      if (error.isUserCancelled) return;
      message.error(`Đăng nhập ${provider} thất bại!`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#001529' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <Card
          style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
          bordered={false}
          className="admin-login-card"
        >
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: 16, marginBottom: 0 }}>Fittora Admin</Title>
            <Text type="secondary">Quản trị hệ thống</Text>
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
              <Input prefix={<UserOutlined />} placeholder="Email quản trị" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 45, fontWeight: 'bold' }}>
                ĐĂNG NHẬP
              </Button>
            </Form.Item>
          </Form>

          <Divider plain style={{ fontSize: '12px', color: '#ccc' }}>Hoặc đăng nhập với</Divider>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              block
              icon={<GoogleOutlined style={{ color: '#DB4437' }} />}
              onClick={() => handleSocialLogin('google', loginWithGoogle)}
              loading={socialLoading === 'google'}
            >
              Google
            </Button>
            <Button
              block
              icon={<FacebookFilled style={{ color: '#1877F2' }} />}
              onClick={() => handleSocialLogin('facebook', loginWithFacebook)}
              loading={socialLoading === 'facebook'}
            >
              Facebook
            </Button>
          </Space>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href="/" style={{ color: '#888', fontSize: '14px' }}>← Quay về trang chủ</a>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminLogin;
