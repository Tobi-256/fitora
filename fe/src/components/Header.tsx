import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Button, Avatar, Space, Badge, Dropdown, Modal, Form, Input, App } from 'antd';
import { UserOutlined, LogoutOutlined, CrownOutlined, ProfileOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/useAuth';
import { passwordValidationRules } from '../utils/passwordValidation';
import './Header.css';

const { Header: AntHeader } = Layout;

export const Header = () => {
  const { currentUser, userProfile, logout, changePassword, loading } = useAuth();
  const navigate = useNavigate();
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChangePassword = () => {
    setChangePasswordVisible(true);
    form.resetFields();
  };

  const handleChangePasswordCancel = () => {
    setChangePasswordVisible(false);
    form.resetFields();
  };

  const onChangePasswordFinish = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    setChangePasswordLoading(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      message.success('Password changed successfully!');
      setChangePasswordVisible(false);
      form.resetFields();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      message.error(errorMessage);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <AntHeader className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>FITORA</h1>
        </Link>

        <Space size="large" className="nav-menu">
          {currentUser ? (
            <>
              <Link to="/">
                <Button type="text" className="nav-link-btn">HOME</Button>
              </Link>
              <Link to="/try-on">
                <Button type="text" className="nav-link-btn">TRY-ON</Button>
              </Link>
              {userProfile?.isPremium && (
                <Badge.Ribbon text="Premium" color="gold">
                  <CrownOutlined style={{ fontSize: '20px', color: '#ffd700' }} />
                </Badge.Ribbon>
              )}
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'profile',
                      label: (
                        <Link to="/profile" style={{ color: '#000', textDecoration: 'none' }}>
                          <Space>
                            <ProfileOutlined />
                            <span>Profile</span>
                          </Space>
                        </Link>
                      ),
                    },
                    {
                      key: 'changePassword',
                      label: (
                        <Space>
                          <LockOutlined />
                          <span>Change Password</span>
                        </Space>
                      ),
                      onClick: handleChangePassword,
                    },
                    {
                      type: 'divider',
                    },
                    {
                      key: 'logout',
                      label: (
                        <Space>
                          <LogoutOutlined />
                          <span>Logout</span>
                        </Space>
                      ),
                      onClick: handleLogout,
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={['click']}
              >
              <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
                <Avatar
                  src={userProfile?.avatarUrl && userProfile.avatarUrl.startsWith('/uploads/') 
                    ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}${userProfile.avatarUrl}` 
                    : userProfile?.avatarUrl || undefined}
                  icon={<UserOutlined />}
                  size="default"
                />
                  <span className="user-name">
                    {userProfile?.name || userProfile?.email}
                  </span>
                </Space>
              </Dropdown>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button type="text" className="nav-link-btn">LOGIN</Button>
              </Link>
              <Link to="/">
                <Button type="text" className="nav-link-btn">HOME</Button>
              </Link>
              <Link to="/try-on">
                <Button type="text" className="nav-link-btn">TRY-ON</Button>
              </Link>
            </>
          )}
        </Space>
      </div>

      <Modal
        title="Change Password"
        open={changePasswordVisible}
        onCancel={handleChangePasswordCancel}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          name="changePassword"
          onFinish={onChangePasswordFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: 'Please input your current password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Enter current password"
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={passwordValidationRules}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Min 8 chars, uppercase, special char, number"
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
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
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleChangePasswordCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={changePasswordLoading}
              >
                Change Password
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AntHeader>
  );
};
