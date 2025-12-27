import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Tag, Avatar, Descriptions, App, Upload, Select, DatePicker, Modal } from 'antd';
import { UserOutlined, EditOutlined, CrownOutlined, UploadOutlined, PhoneOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/useAuth';
import { updateProfile, uploadAvatar, checkPhone } from '../services/userService';

const { Title } = Typography;

export const Profile = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { message } = App.useApp();

  // Check if user signed in with social provider (Google/Facebook)
  // Only disable upload if user ONLY has social login (no password provider)
  const isSocialLogin = () => {
    if (!currentUser || !currentUser.providerData || currentUser.providerData.length === 0) {
      return false;
    }
    const providers = currentUser.providerData.map(p => p.providerId);
    // ...existing code...
    
    // Check if user has password provider - if yes, allow upload
    // Firebase uses 'password' as providerId for email/password auth
    const hasPasswordProvider = providers.includes('password');
    if (hasPasswordProvider) {
      // intentionally left blank
      return false; // User can upload if they have password provider
    }
    
    // Only disable if user ONLY has social providers (Google/Facebook)
    const isSocialOnly = providers.includes('google.com') || providers.includes('facebook.com');
    if (isSocialOnly) {
      // ...existing code...
    }
    return isSocialOnly;
  };

  const onFinish = async (values: { 
    name: string; 
    avatarUrl: string;
    phone?: string;
    address?: string;
    gender?: 'male' | 'female' | 'other' | '';
    dateOfBirth?: dayjs.Dayjs | null;
  }) => {
    setLoading(true);
    try {
      // Format dateOfBirth to ISO string if exists
      await updateProfile({
        name: values.name,
        avatarUrl: values.avatarUrl,
        phone: values.phone || '',
        address: values.address || '',
        gender: values.gender || '',
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
      });
      await refreshUserProfile();
      message.success('Profile updated successfully!');
      setIsEditing(false);
      form.resetFields();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (userProfile) {
      form.setFieldsValue({
        name: userProfile.name || '',
        avatarUrl: userProfile.avatarUrl || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        gender: userProfile.gender || '',
        dateOfBirth: userProfile.dateOfBirth ? dayjs(userProfile.dateOfBirth) : null,
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleAvatarUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      // ...existing code...
        await uploadAvatar(file as File);
      // ...existing code...
      await refreshUserProfile();
      message.success('Avatar uploaded successfully!');
      if (onSuccess) {
        onSuccess('ok');
      }
    } catch (error: unknown) {
      // ...existing code...
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
      message.error(errorMessage);
      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }
    return true;
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <Card>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical" size="small">
              <Avatar 
                size={80} 
                src={userProfile.avatarUrl && userProfile.avatarUrl.startsWith('/uploads/') 
                  ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}${userProfile.avatarUrl}` 
                  : userProfile.avatarUrl || undefined} 
                icon={<UserOutlined />}
              />
              <Upload
                customRequest={handleAvatarUpload}
                beforeUpload={beforeUpload}
                showUploadList={false}
                accept="image/*"
                disabled={isSocialLogin()}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  loading={uploading}
                  size="small"
                  disabled={isSocialLogin()}
                  title={isSocialLogin() ? 'Avatar cannot be changed for social login accounts (Google/Facebook)' : 'Upload Avatar'}
                >
                  Upload Avatar
                </Button>
              </Upload>
              {isSocialLogin() && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', textAlign: 'center' }}>
                  Avatar managed by {currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Facebook'}
                </div>
              )}
            </Space>
            <Title level={2} style={{ marginTop: '16px', marginBottom: '8px' }}>
              {userProfile.name || 'User'}
            </Title>
            <Space>
              <Tag color={userProfile.role === 'admin' ? '#000' : '#666'}>
                {userProfile.role.toUpperCase()}
              </Tag>
              {userProfile.isPremium && (
                <Tag icon={<CrownOutlined />} color="gold">
                  PREMIUM
                </Tag>
              )}
            </Space>
          </div>

          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Account Information</span>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              </div>
            }
          >
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Name">{userProfile.name || 'Not set'}</Descriptions.Item>
              <Descriptions.Item label="Email">{userProfile.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{userProfile.phone || 'Not set'}</Descriptions.Item>
              <Descriptions.Item label="Address">{userProfile.address || 'Not set'}</Descriptions.Item>
              <Descriptions.Item label="Gender">
                {userProfile.gender ? (
                  <Tag color={userProfile.gender === 'male' ? 'blue' : userProfile.gender === 'female' ? 'pink' : 'default'}>
                    {userProfile.gender === 'male' ? 'Male' : userProfile.gender === 'female' ? 'Female' : 'Other'}
                  </Tag>
                ) : 'Not set'}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {userProfile.dateOfBirth ? dayjs(userProfile.dateOfBirth).format('DD/MM/YYYY') : 'Not set'}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={userProfile.role === 'admin' ? '#000' : '#666'}>
                  {userProfile.role === 'admin' ? 'Admin' : 'User'}
                </Tag>
              </Descriptions.Item>
              {userProfile.isPremium && (
                <Descriptions.Item label="Status">
                  <Tag icon={<CrownOutlined />} color="gold">Premium User</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Modal
            title="Edit Profile"
            open={isEditing}
            onCancel={handleCancel}
            footer={null}
            width={600}
          >
            <Form
              form={form}
              name="profile"
              onFinish={onFinish}
              layout="vertical"
              autoComplete="off"
            >
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter your name!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Enter your name" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  {
                    pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                    message: 'Please enter a valid phone number!',
                  },
                  {
                    validator: async (_, value) => {
                      if (!value || value.trim() === '') {
                        return Promise.resolve();
                      }
                      
                      // Check if phone is different from current phone
                      if (userProfile && value.trim() === userProfile.phone) {
                        return Promise.resolve();
                      }
                      
                      try {
                        const result = await checkPhone(value.trim(), userProfile?.id);
                        if (result.exists) {
                          return Promise.reject(new Error('This phone number is already in use!'));
                        }
                        return Promise.resolve();
                      } catch {
                        // If check fails, allow submission (backend will validate)
                        return Promise.resolve();
                      }
                    },
                  },
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="Enter phone number (e.g., +1234567890)" 
                  maxLength={20}
                />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
              >
                <Input.TextArea 
                  placeholder="Enter your address" 
                  rows={3}
                />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Gender"
              >
                <Select placeholder="Select gender" allowClear>
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Select date of birth"
                  format="DD/MM/YYYY"
                  disabledDate={(current) => {
                    // Disable future dates
                    return current && current > dayjs().endOf('day');
                  }}
                />
              </Form.Item>

              <Form.Item
                name="avatarUrl"
                label="Avatar URL"
              >
                <Input placeholder="Enter avatar image URL (or upload above)" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<EditOutlined />}
                  >
                    Save Changes
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </Space>
      </Card>
    </div>
  );
};
