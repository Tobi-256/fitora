import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider, App } from 'antd';
import { LockOutlined, MailOutlined, FacebookFilled, GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/useAuth';
import api from '../services/api';
import './Login.css';

const { Title } = Typography;

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  // 👇 1. Lấy thêm hàm logout từ useAuth
  const { login, loginWithGoogle, loginWithFacebook, logout } = useAuth();

  const navigate = useNavigate();
  const { message } = App.useApp();

  // --- 1. HÀM XỬ LÝ LOGIC SAU KHI CÓ USER TỪ FIREBASE ---
  const handlePostLogin = async (user: any) => {
    try {
      if (!user) throw new Error("Không tìm thấy thông tin người dùng");

      // Gọi API Sync qua service api (đã có baseURL chuẩn)
      const res = await api.post(
        '/users/sync',
        {
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
          avatarUrl: user.photoURL || '',
          providerId: user.providerData?.[0]?.providerId || 'password',
        }
      );

      // Lấy data user từ phản hồi của Backend
      const userData = res.data?.user;

      if (userData) {

        // ⛔️⛔️ LOGIC CHẶN ADMIN ⛔️⛔️
        if (userData.role === 'admin') {
          message.warning('Tài khoản Admin vui lòng đăng nhập ở cổng Quản trị riêng!');

          // 👇 2. Dùng hàm logout của Context thay vì signOut(auth) trực tiếp
          // Hàm này sẽ lo việc gọi firebase signOut và xóa localStorage
          await logout();

          // Chuyển hướng sang trang Admin Login
          navigate('/admin/login');
          return;
        }

        // Nếu là User thường -> Cho vào trang chủ
        message.success('Đăng nhập thành công!');
        navigate('/');

      } else {
        throw new Error('Server không trả về dữ liệu người dùng.');
      }

    } catch (error: any) {
      console.error("Post-login error:", error);
      const serverMsg = error.response?.data?.message;
      message.warning(serverMsg || 'Đăng nhập thành công, nhưng đồng bộ dữ liệu gặp lỗi.');

      // Nếu lỗi server nhưng Firebase đã login, vẫn cho vào trang chủ
      navigate('/');
    }
  };

  // --- 2. XỬ LÝ ĐĂNG NHẬP EMAIL/PASS ---
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const result: any = await login(values.email, values.password);
      const userToSync = result.user || result;
      await handlePostLogin(userToSync);
    } catch (error: any) {
      let msg = 'Đăng nhập thất bại';
      if (error.code === 'auth/invalid-credential') msg = 'Sai email hoặc mật khẩu!';
      else if (error.code === 'auth/user-not-found') msg = 'Tài khoản không tồn tại!';
      else if (error.code === 'auth/wrong-password') msg = 'Sai mật khẩu!';

      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. XỬ LÝ SOCIAL LOGIN CHUNG ---
  const handleSocialLogin = async (provider: 'google' | 'facebook', loginFn: Function) => {
    setSocialLoading(provider);
    try {
      const result: any = await loginFn();
      const userToSync = result?.user || result;

      if (userToSync) {
        await handlePostLogin(userToSync);
      } else {
        throw new Error(`Không nhận được dữ liệu từ ${provider}`);
      }
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('closed by user')) {
        return;
      }
      console.error(`${provider} login error:`, error);
      message.error(`Đăng nhập ${provider} thất bại!`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card">
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={2} className="login-title">Welcome</Title>

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="middle"
              autoComplete="off"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" className="login-input" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" className="login-input" />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <Link to="/forgot-password" style={{ color: '#000', textDecoration: 'underline', fontSize: '13px' }}>
                    Forgot Password?
                  </Link>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="login-primary-btn"
                >
                  Login
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Or login with</Divider>

            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>

              <Button
                block
                className="login-social-btn facebook-btn"
                icon={<FacebookFilled style={{ fontSize: '18px', color: '#1877F2' }} />}
                loading={socialLoading === 'facebook'}
                onClick={() => handleSocialLogin('facebook', loginWithFacebook)}
              >
                Login with Facebook
              </Button>

              <Button
                block
                className="login-social-btn google-btn"
                icon={<GoogleOutlined style={{ fontSize: '18px', color: '#DB4437' }} />}
                loading={socialLoading === 'google'}
                onClick={() => handleSocialLogin('google', loginWithGoogle)}
              >
                Login with Google
              </Button>

            </Space>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Typography.Text type="secondary" style={{ color: '#000', fontSize: '13px' }}>
                Don't have an account? <Link to="/register" style={{ color: '#000', textDecoration: 'underline' }}>Register</Link>
              </Typography.Text>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <Link to="/admin/login" style={{ fontSize: '12px', color: '#999' }}>
                Login to Admin Portal
              </Link>
            </div>

          </Space>
        </Card>
      </div>
    </div>
  );
};
