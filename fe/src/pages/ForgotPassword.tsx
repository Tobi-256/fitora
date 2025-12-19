import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, App } from 'antd';
import { MailOutlined, ArrowLeftOutlined, SafetyOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/useAuth';
import { resetPasswordAfterOTP } from '../services/userService';
import { passwordValidationRules } from '../utils/passwordValidation';
import './Login.css';

const { Title, Paragraph } = Typography;

export const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();

  // Step 1: Send OTP
  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const result = await resetPassword(values.email);
      if (result.success) {
        setEmail(values.email);
        setStep('otp');
        message.success(result.message);
        
        // Log OTP for testing (only in development)
        if (result.otp) {
          console.log('🔐 Reset Password OTP Code (for testing):', result.otp);
        }
      } else {
        message.error(result.message || 'Unable to send OTP. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const onOTPFinish = async (values: { otp: string }) => {
    setOtpLoading(true);
    try {
      const { verifyOTP: verifyOTPService } = await import('../services/userService');
      const verifyResponse = await verifyOTPService(email, values.otp, 'password-reset');
      
      if (verifyResponse.success) {
        setOtp(values.otp);
        setStep('newPassword');
        message.success('OTP verified successfully! Please enter your new password.');
      } else {
        message.error(verifyResponse.message || 'Invalid OTP. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      message.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Set new password
  const onNewPasswordFinish = async (values: { password: string; confirmPassword: string }) => {
    setPasswordLoading(true);
    try {
      const result = await resetPasswordAfterOTP(email, otp, values.password);
      
      if (result.success) {
        message.success('Password has been reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        message.error(result.message || 'Failed to reset password. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      message.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        message.success(result.message);
        if (result.otp) {
          console.log('🔐 New Reset Password OTP Code (for testing):', result.otp);
        }
      } else {
        message.error(result.message || 'Unable to send OTP. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      message.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card">
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={2} className="login-title">Forgot Password</Title>
            
            {step === 'email' ? (
              <>
                <Paragraph style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                  Enter your email to receive OTP code for password reset
                </Paragraph>
                
                <Form
                  name="forgotPassword"
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

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      loading={loading}
                      className="login-primary-btn"
                    >
                      Send OTP
                    </Button>
                  </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <Link to="/login" style={{ color: '#000', textDecoration: 'underline', fontSize: '13px' }}>
                    <ArrowLeftOutlined /> Back to Login
                  </Link>
                </div>
              </>
            ) : step === 'otp' ? (
              <>
                <Paragraph style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                  We have sent an OTP code to <strong>{email}</strong>.
                  Please check your email and enter the OTP code to continue resetting your password.
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
                      className="login-input"
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
                      className="login-primary-btn"
                    >
                      Verify OTP
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
                      setStep('email');
                      setEmail('');
                      setOtp('');
                    }}
                    style={{ color: '#000', fontSize: '13px' }}
                  >
                    Change Email
                  </Button>
                  <span style={{ color: '#666', margin: '0 8px' }}>|</span>
                  <Link to="/login" style={{ color: '#000', textDecoration: 'underline', fontSize: '13px' }}>
                    <ArrowLeftOutlined /> Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Paragraph style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                  OTP verified successfully! Please enter your new password.
                </Paragraph>

                <Form
                  name="newPassword"
                  onFinish={onNewPasswordFinish}
                  layout="vertical"
                  size="middle"
                  autoComplete="off"
                >
                  <Form.Item
                    label="New Password"
                    name="password"
                    rules={passwordValidationRules}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder="Min 8 chars, uppercase, special char, number"
                      className="login-input"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Confirm New Password"
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Please confirm your new password!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('The two passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder="Confirm new password"
                      className="login-input"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      loading={passwordLoading}
                      className="login-primary-btn"
                    >
                      Reset Password
                    </Button>
                  </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <Button 
                    type="link" 
                    onClick={() => {
                      setStep('otp');
                      setOtp('');
                    }}
                    style={{ color: '#000', fontSize: '13px' }}
                  >
                    Back to OTP
                  </Button>
                  <span style={{ color: '#666', margin: '0 8px' }}>|</span>
                  <Link to="/login" style={{ color: '#000', textDecoration: 'underline', fontSize: '13px' }}>
                    <ArrowLeftOutlined /> Back to Login
                  </Link>
                </div>
              </>
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
};

