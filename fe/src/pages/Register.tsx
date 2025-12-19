import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/useAuth';
import { sendOTP, verifyOTP, checkEmail, cleanupFirebaseUser } from '../services/userService';
import { passwordValidationRules } from '../utils/passwordValidation';
import './Register.css';

const { Title, Paragraph } = Typography;

export const Register = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [formData, setFormData] = useState<{ name: string; email: string; password: string } | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [form] = Form.useForm();
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();


  // Step 1: Submit registration info and send OTP
  const onFinish = async (values: { name: string; email: string; password: string; confirmPassword: string }) => {
    setLoading(true);
    try {
      // First check if email is already in use
      const emailCheck = await checkEmail(values.email);
      
      if (emailCheck.exists) {
        // Try to cleanup Firebase user if not exists in MongoDB
        try {
          const cleanupResult = await cleanupFirebaseUser(values.email);
          if (cleanupResult.cleanup) {
            message.success('Email cleaned up. Please try again!');
            // Retry check email
            const retryCheck = await checkEmail(values.email);
            if (retryCheck.exists) {
              message.error('This email is still in use. Please login or use a different email.');
              setLoading(false);
              return;
            }
            // Continue to send OTP if cleanup successful
          } else {
            message.error('This email is already in use. Please login or use a different email.');
            setLoading(false);
            return;
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
          message.error('This email is already in use. Please login or use a different email.');
          setLoading(false);
          return;
        }
      }

      // Send OTP to email
      const otpResponse = await sendOTP(values.email);
      if (otpResponse.success) {
        setFormData({ name: values.name, email: values.email, password: values.password });
        setStep('otp');
        setOtpSent(true);
        message.success(otpResponse.message);
        
        // Log OTP for testing (only in development)
        if (otpResponse.otp) {
          console.log('🔐 OTP Code (for testing):', otpResponse.otp);
        }
      } else {
        message.error(otpResponse.message || 'Không thể gửi OTP. Vui lòng thử lại.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const onOTPFinish = async (values: { otp: string }) => {
    if (!formData) {
      message.error('Invalid registration information. Please try again.');
      return;
    }

    setOtpLoading(true);
    try {
      // Verify OTP
      const verifyResponse = await verifyOTP(formData.email, values.otp);
      
      if (verifyResponse.success) {
        // OTP verified, now create Firebase account
        try {
          await register(formData.email, formData.password, formData.name);
          message.success('Registration successful!');
          navigate('/');
        } catch (registerError: unknown) {
          const registerErrorMessage = registerError instanceof Error ? registerError.message : 'Unable to register. Please try again.';
          message.error(registerErrorMessage);
        }
      } else {
        // OTP verification failed - show clear error message
        const errorMsg = verifyResponse.message || 'Invalid OTP. Please check your OTP code again.';
        message.error(errorMsg);
        console.error('OTP verification failed:', errorMsg);
      }
    } catch (error: unknown) {
      // Handle network errors or other unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unable to verify OTP. Please try again.';
      message.error(errorMessage);
      console.error('OTP verification error:', error);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!formData) return;
    
    setOtpLoading(true);
    try {
      const otpResponse = await sendOTP(formData.email);
      if (otpResponse.success) {
        message.success(otpResponse.message);
        if (otpResponse.otp) {
          console.log('🔐 New OTP Code (for testing):', otpResponse.otp);
        }
      } else {
        message.error(otpResponse.message || 'Unable to send OTP. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      message.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <Card className="register-card">
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={2} className="register-title">Welcome</Title>
            
            {step === 'info' ? (
              <>
                <Form
                  form={form}
                  name="register"
                  onFinish={onFinish}
                  layout="vertical"
                  size="middle"
                  autoComplete="off"
                >
              <Form.Item
                label="Username"
                name="name"
                rules={[{ required: true, message: 'Please input your username!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Username" 
                  className="register-input"
                />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                  {
                    validator: async (_, value) => {
                      if (!value) return Promise.resolve();
                      
                      try {
                        const emailCheck = await checkEmail(value);
                        if (emailCheck.exists) {
                          return Promise.reject(new Error('This email is already in use. Please login or use a different email.'));
                        }
                        return Promise.resolve();
                      } catch (error) {
                        // If check fails, don't block user (might be network issue)
                        return Promise.resolve();
                      }
                    },
                  },
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Email" 
                  className="register-input"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={passwordValidationRules}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Min 8 chars, uppercase, special char, number"
                  className="register-input"
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm Password"
                  className="register-input"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  loading={loading}
                  className="register-primary-btn"
                >
                  Send OTP
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Or register with</Divider>

            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <Button 
                block 
                className="register-social-btn facebook-btn"
                icon={<span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1877F2' }}>f</span>}
                loading={socialLoading === 'facebook'}
                onClick={async () => {
                  setSocialLoading('facebook');
                  try {
                    await loginWithFacebook();
                    message.success('Registration successful!');
                    navigate('/');
                  } catch (error: unknown) {
                    // Ignore user cancellation
                    if (error instanceof Error && 'isUserCancelled' in error && (error as { isUserCancelled: boolean }).isUserCancelled) {
                      // User cancelled, do nothing
                      return;
                    }
                    const errorMessage = error instanceof Error ? error.message : 'Failed to register with Facebook';
                    message.error(errorMessage);
                  } finally {
                    setSocialLoading(null);
                  }
                }}
              >
                Register with Facebook
              </Button>
              <Button 
                block 
                className="register-social-btn google-btn"
                icon={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>G</span>}
                loading={socialLoading === 'google'}
                onClick={async () => {
                  setSocialLoading('google');
                  try {
                    await loginWithGoogle();
                    message.success('Registration successful!');
                    navigate('/');
                  } catch (error: unknown) {
                    // Ignore user cancellation
                    if (error instanceof Error && 'isUserCancelled' in error && (error as { isUserCancelled: boolean }).isUserCancelled) {
                      // User cancelled, do nothing
                      return;
                    }
                    const errorMessage = error instanceof Error ? error.message : 'Failed to register with Google';
                    message.error(errorMessage);
                  } finally {
                    setSocialLoading(null);
                  }
                }}
              >
                Register with Google
              </Button>
            </Space>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Typography.Text type="secondary" style={{color: '#000', fontSize: '13px' }}>
                Already have an account? <Link to="/login" style={{ color: '#000', textDecoration: 'underline' }}>Login</Link>
              </Typography.Text>
            </div>
              </>
            ) : (
              <>
                <Paragraph style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                  We have sent an OTP code to <strong>{formData?.email}</strong>.
                  Please check your email and enter the OTP code to complete registration.
                </Paragraph>

                <Form
                  name="verifyOTP"
                  onFinish={onOTPFinish}
                  layout="vertical"
                  size="middle"
                  autoComplete="off"
                >
                  <Form.Item
                    label="OTP Code"
                    name="otp"
                    rules={[
                      { required: true, message: 'Please input OTP code!' },
                      { len: 6, message: 'OTP must be 6 digits!' },
                      { pattern: /^\d+$/, message: 'OTP must contain only numbers!' }
                    ]}
                  >
                    <Input 
                      prefix={<SafetyOutlined />} 
                      placeholder="Enter 6-digit OTP"
                      className="register-input"
                      maxLength={6}
                      style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      loading={otpLoading}
                      className="register-primary-btn"
                    >
                      Verify & Register
                    </Button>
                  </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <Button 
                    type="link" 
                    onClick={handleResendOTP}
                    loading={otpLoading}
                    style={{ color: '#000', fontSize: '13px' }}
                  >
                    Resend OTP
                  </Button>
                  <span style={{ color: '#666', margin: '0 8px' }}>|</span>
                  <Button 
                    type="link" 
                    onClick={() => {
                      setStep('info');
                      setFormData(null);
                      setOtpSent(false);
                    }}
                    style={{ color: '#000', fontSize: '13px' }}
                  >
                    Change Email
                  </Button>
                </div>
              </>
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
};
