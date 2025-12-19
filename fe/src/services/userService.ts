import api from './api';

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  avatarUrl: string;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other' | '';
  dateOfBirth?: string | null;
  role: 'user' | 'admin';
  isPremium: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncUserData {
  firebaseUid: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface OTPSendResponse {
  success: boolean;
  message: string;
  otp?: string; // Only in development
}

export interface OTPVerifyResponse {
  success: boolean;
  message: string;
}

export interface CheckEmailResponse {
  success: boolean;
  exists: boolean;
  message: string;
}

export interface CheckPhoneResponse {
  success: boolean;
  exists: boolean;
  message: string;
}

export interface CleanupFirebaseResponse {
  success: boolean;
  message: string;
  cleanup?: boolean;
}

// Check if email is already in use
export const checkEmail = async (email: string): Promise<CheckEmailResponse> => {
  const response = await api.post('/users/check-email', { email });
  return response.data;
};

// Check if phone number is already in use
export const checkPhone = async (phone: string, excludeUserId?: string): Promise<CheckPhoneResponse> => {
  const response = await api.post('/users/check-phone', { phone, excludeUserId });
  return response.data;
};

// Cleanup user in Firebase if not exists in MongoDB
export const cleanupFirebaseUser = async (email: string): Promise<CleanupFirebaseResponse> => {
  const response = await api.post('/users/cleanup-firebase', { email });
  return response.data;
};

// Send OTP to email
// type: 'registration' (default) | 'password-reset'
export const sendOTP = async (email: string, type: 'registration' | 'password-reset' = 'registration'): Promise<OTPSendResponse> => {
  const response = await api.post(`/otp/send?type=${type}`, { email });
  return response.data;
};

// Verify OTP code
// type: 'registration' (default) | 'password-reset'
export const verifyOTP = async (email: string, otp: string, type: 'registration' | 'password-reset' = 'registration'): Promise<OTPVerifyResponse> => {
  try {
    const response = await api.post(`/otp/verify?type=${type}`, { email, otp, type });
    return response.data;
  } catch (error: any) {
    // Handle error response from backend
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || 'Invalid OTP. Please try again.',
      };
    }
    // Handle network or other errors
    throw new Error(error.message || 'Unable to verify OTP. Please try again.');
  }
};

// Sync user from Firebase to MongoDB
export const syncUser = async (data: SyncUserData) => {
  const response = await api.post('/users/sync', data);
  return response.data;
};

// Get current user profile
export const getProfile = async (): Promise<User> => {
  const response = await api.get('/users/me');
  return response.data;
};

// Upload avatar image
export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string; user: User }> => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await api.post('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Update user profile
export const updateProfile = async (data: { 
  name?: string; 
  avatarUrl?: string;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other' | '';
  dateOfBirth?: string | null;
}): Promise<User> => {
  const response = await api.put('/users/me', data);
  return response.data;
};

// Logout
export const logout = async () => {
  const response = await api.post('/users/logout');
  return response.data;
};

// Reset password after OTP verification
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export const resetPasswordAfterOTP = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<ResetPasswordResponse> => {
  const response = await api.post('/users/reset-password', {
    email,
    otp,
    newPassword,
  });
  return response.data;
};

