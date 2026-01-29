import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { LockOutlined, UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase'; // Đảm bảo đường dẫn đúng đến file firebase config
<<<<<<< HEAD
import axios from 'axios';
=======

>>>>>>> origin/deploy
import './AdminLogin.css';

const { Title, Text } = Typography;
const { Content } = Layout;

<<<<<<< HEAD
// URL Backend (Nếu chạy port khác 5000 thì sửa ở đây)
const API_URL = 'http://localhost:5000';
=======
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
>>>>>>> origin/deploy

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);

    // Kiểm tra an toàn: Đảm bảo Firebase Auth đã sẵn sàng
    if (!auth) {
      message.error("Lỗi hệ thống: Firebase Auth chưa được khởi tạo.");
      setLoading(false);
      return;
    }

    try {
      // 1. Đăng nhập vào Firebase (Dùng auth!)
      const userCredential = await signInWithEmailAndPassword(auth!, values.email, values.password);
      const user = userCredential.user;

      // 2. Lấy Token xác thực để gửi xuống Backend
      const token = await user.getIdToken();

      // 3. Gọi API kiểm tra xem user này có phải là 'admin' trong Database không
<<<<<<< HEAD
      // Lưu ý: User phải có role="admin" trong Firestore (đã sửa ở bước trước)
      const res = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.role === 'admin') {
=======
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const resData = await response.json();

      if (resData && resData.role === 'admin') {
>>>>>>> origin/deploy
        message.success('Chào mừng quản trị viên quay lại!');
        navigate('/admin/dashboard');
      } else {
        // ⛔️ Nếu đăng nhập đúng mật khẩu nhưng Role là 'user' -> Đuổi ra ngay
        await signOut(auth!);
        message.error('Tài khoản này không có quyền truy cập trang Quản trị!');
      }

    } catch (error: any) {
      console.error("Lỗi đăng nhập Admin:", error);
<<<<<<< HEAD
      
=======

>>>>>>> origin/deploy
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message.error('Sai email hoặc mật khẩu!');
      } else if (error.code === 'auth/too-many-requests') {
        message.error('Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.');
      } else {
<<<<<<< HEAD
        // Hiển thị lỗi từ backend (nếu có) hoặc lỗi chung
        const serverMsg = error.response?.data?.message;
        message.error(serverMsg || error.message || 'Đăng nhập thất bại.');
=======
        // Hiển thị lỗi chung
        message.error(error.message || 'Đăng nhập thất bại.');
>>>>>>> origin/deploy
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#001529' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
<<<<<<< HEAD
        <Card 
          style={{ width: 400, borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
=======
        <Card style={{ width: 400, borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
>>>>>>> origin/deploy
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
<<<<<<< HEAD
          
=======

>>>>>>> origin/deploy
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <a href="/" style={{ color: '#888', fontSize: '14px' }}>← Quay về trang chủ bán hàng</a>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminLogin;