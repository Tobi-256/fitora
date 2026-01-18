import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider, App } from 'antd';
import {  LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/useAuth';
import './Login.css';

const { Title } = Typography;

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Login successful!');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      message.error(errorMessage);
    } finally {
      setLoading(false);
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
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Email" 
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  className="login-input"
                />
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
                icon={<span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1877F2' }}>f</span>}
                loading={socialLoading === 'facebook'}
                onClick={async () => {
                  setSocialLoading('facebook');
                  try {
                    await loginWithFacebook();
                    message.success('Login successful!');
                    navigate('/');
                  } catch (error: unknown) {
                    // Ignore user cancellation
                    if (error instanceof Error && 'isUserCancelled' in error && (error as { isUserCancelled: boolean }).isUserCancelled) {
                      // User cancelled, do nothing
                      return;
                    }
                    const errorMessage = error instanceof Error ? error.message : 'Failed to login with Facebook';
                    message.error(errorMessage);
                  } finally {
                    setSocialLoading(null);
                  }
                }}
              >
                Login with Facebook
              </Button>
              <Button 
                block 
                className="login-social-btn google-btn"
                icon={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>G</span>}
                loading={socialLoading === 'google'}
                onClick={async () => {
                  setSocialLoading('google');
                  try {
                    await loginWithGoogle();
                    message.success('Login successful!');
                    navigate('/');
                  } catch (error: unknown) {
                    // Ignore user cancellation
                    if (error instanceof Error && 'isUserCancelled' in error && (error as { isUserCancelled: boolean }).isUserCancelled) {
                      // User cancelled, do nothing
                      return;
                    }
                    const errorMessage = error instanceof Error ? error.message : 'Failed to login with Google';
                    message.error(errorMessage);
                  } finally {
                    setSocialLoading(null);
                  }
                }}
              >
                Login with Google
              </Button>
            </Space>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Typography.Text type="secondary" style={{ color: '#000', fontSize: '13px' }}>
                Don't have an account? <Link to="/register" style={{ color: '#000', textDecoration: 'underline' }}>Register</Link>
              </Typography.Text>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};
