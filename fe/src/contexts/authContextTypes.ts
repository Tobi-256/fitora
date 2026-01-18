import { createContext } from 'react';
import type { User as FirebaseUserType } from 'firebase/auth';
import type { User } from '../services/userService';

export interface AuthContextType {
  currentUser: FirebaseUserType | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyOTPAndResetPassword: (email: string, otp: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

