import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import type { User as FirebaseUserType } from 'firebase/auth';
import { auth } from '../config/firebase';
import { syncUser, getProfile } from '../services/userService';
import type { User } from '../services/userService';
import { AuthContext, type AuthContextType } from './authContextTypes';

interface AuthProviderProps {
  children: ReactNode;
}

interface FirebaseError {
  code?: string;
  message?: string;
}

interface UserCancelledError extends Error {
  isUserCancelled: boolean;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUserType | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user to MongoDB when Firebase user changes
  const syncUserToBackend = async (firebaseUser: FirebaseUserType) => {
    try {
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('firebaseToken', token);

      // Sync user to backend
      try {
        // Get user info from Firebase (includes social provider data)
        const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
        const avatarUrl = firebaseUser.photoURL || '';
        
        await syncUser({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: name,
          avatarUrl: avatarUrl,
        });

        // Get user profile from backend
        const profile = await getProfile();
        setUserProfile(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      } catch (apiError: unknown) {
        // Backend might not be running, that's okay for now
        const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
        console.warn('Backend sync failed (backend might not be running):', errorMessage);
        // Set basic profile from Firebase
        setUserProfile({
          id: firebaseUser.uid,
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          avatarUrl: firebaseUser.photoURL || '',
          phone: '',
          address: '',
          gender: '',
          dateOfBirth: null,
          role: 'user',
          isPremium: false,
        });
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  // Register new user
  const register = async (email: string, password: string, name: string) => {
    if (!auth) {
      console.error('❌ Auth is null, cannot register');
      throw new Error('Firebase auth is not initialized. Please check Firebase configuration and ensure Authentication is enabled in Firebase Console.');
    }
    
    console.log('📝 Attempting registration for:', email);
    console.log('Auth instance:', auth);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Registration successful');
      
      // Update display name and send email verification
      if (userCredential.user) {
        await updateFirebaseProfile(userCredential.user, { displayName: name });
        
        // Send email verification
        try {
          await sendEmailVerification(userCredential.user);
          console.log('✅ Email verification sent');
        } catch (verificationError) {
          console.warn('⚠️ Failed to send email verification:', verificationError);
        }
        
        await syncUserToBackend(userCredential.user);
      }
    } catch (error: unknown) {
      console.error('❌ Registration error:', error);
      
      // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
      if (error instanceof Error) {
        console.error('Error code:', error.message);
        
        // Check for configuration-not-found error
        if (error.message.includes('configuration-not-found') || error.message.includes('auth/configuration-not-found')) {
          throw new Error('Firebase Authentication is not configured. Please enable Email/Password in Firebase Console → Authentication → Sign-in method.');
        }
        
        // Handle email-already-in-use: User exists in Firebase but might not be synced to MongoDB
        if (error.message.includes('email-already-in-use')) {
          console.log('⚠️ Email already exists in Firebase. Attempting to login and sync...');
          
          try {
            // Try to login with the provided credentials
            const loginCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Login successful, syncing user to MongoDB...');
            
            // Update display name if needed
            if (loginCredential.user && name) {
              await updateFirebaseProfile(loginCredential.user, { displayName: name });
            }
            
            // Sync user to backend (this will create user in MongoDB if not exists)
            await syncUserToBackend(loginCredential.user);
            
            console.log('✅ User synced successfully. Registration completed via login.');
            // Don't throw error, registration is effectively complete
            return;
          } catch (loginError: unknown) {
            // If login fails, email exists but password is wrong
            console.error('❌ Login failed:', loginError);
            if (loginError instanceof Error && loginError.message.includes('wrong-password')) {
              throw new Error('This email is already in use with a different password. Please login or use a different email.');
            } else if (loginError instanceof Error && loginError.message.includes('user-not-found')) {
              // This shouldn't happen if email-already-in-use, but handle it anyway
              throw new Error('This email is already in use. Please login or use a different email.');
            } else {
              throw new Error('This email is already in use. Please login or use a different email.');
            }
          }
        } else if (error.message.includes('weak-password')) {
          throw new Error('Password is too weak. Please use a stronger password.');
        } else if (error.message.includes('invalid-email')) {
          throw new Error('Invalid email. Please check again.');
        }
      }
      throw error;
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    if (!auth) {
      console.error('❌ Auth is null, cannot login');
      throw new Error('Firebase auth is not initialized. Please check Firebase configuration and ensure Authentication is enabled in Firebase Console.');
    }
    
    console.log('🔐 Attempting login for:', email);
    console.log('Auth instance:', auth);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful');
      await syncUserToBackend(userCredential.user);
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      
      // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
      if (error instanceof Error) {
        console.error('Error code:', error.message);
        
        // Check for configuration-not-found error
        if (error.message.includes('configuration-not-found') || error.message.includes('auth/configuration-not-found')) {
          throw new Error('Firebase Authentication is not configured. Please enable Email/Password in Firebase Console → Authentication → Sign-in method.');
        }
        
        // Re-throw with more user-friendly message
        if (error.message.includes('invalid-credential') || error.message.includes('auth/invalid-credential')) {
          throw new Error('Email or password is incorrect. Please check again or register a new account.');
        } else if (error.message.includes('user-not-found')) {
          throw new Error('Email does not exist. Please register a new account.');
        } else if (error.message.includes('wrong-password')) {
          throw new Error('Password is incorrect. Please try again.');
        } else if (error.message.includes('invalid-email')) {
          throw new Error('Invalid email. Please check again.');
        } else if (error.message.includes('too-many-requests')) {
          throw new Error('Too many login attempts. Please try again later.');
        }
      }
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('user');
    setUserProfile(null);
  };

  // Reset password (with OTP verification)
  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase auth not initialized');
    
    try {
      // First send OTP via backend with password-reset type
      const { sendOTP } = await import('../services/userService');
      const otpResponse = await sendOTP(email, 'password-reset');
      
      if (!otpResponse.success) {
        return { success: false, message: otpResponse.message || 'Unable to send OTP. Please try again.' };
      }
      
      // Return OTP info so frontend can verify it first
      // Frontend will call verifyOTPAndResetPassword
      return { success: true, message: otpResponse.message, otp: otpResponse.otp };
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error sending OTP for password reset.';
      return { success: false, message: errorMessage };
    }
  };
  
  // Verify OTP and send password reset email
  const verifyOTPAndResetPassword = async (email: string, otp: string) => {
    if (!auth) throw new Error('Firebase auth not initialized');
    
    try {
      // Verify OTP first
      const { verifyOTP } = await import('../services/userService');
      const verifyResponse = await verifyOTP(email, otp);
      
      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || 'Invalid OTP.');
      }
      
      // OTP verified, now send password reset email
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error: unknown) {
      console.error('Verify OTP and reset password error:', error);
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          throw new Error('Email does not exist in the system.');
        } else if (error.message.includes('invalid-email')) {
          throw new Error('Invalid email.');
        }
        throw error;
      }
      throw new Error('Error resetting password.');
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized. Please check Firebase configuration.');
    }

    try {
      const provider = new GoogleAuthProvider();
      
      // Suppress Cross-Origin-Opener-Policy warning and 400 errors when user cancels
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.warn = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        if (message.includes('Cross-Origin-Opener-Policy') || message.includes('window.closed')) {
          // Suppress this specific warning
          return;
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        // Suppress 400 Bad Request errors from Firebase when user cancels
        if (
          message.includes('signInWithIdp') ||
          message.includes('400') ||
          message.includes('Bad Request')
        ) {
          // Check if this is likely a user cancellation (will be caught below)
          return;
        }
        originalError.apply(console, args);
      };

      try {
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Google login successful');
        await syncUserToBackend(result.user);
      } catch (popupError: unknown) {
        // Restore console methods before checking error
        console.warn = originalWarn;
        console.error = originalError;
        throw popupError;
      } finally {
        // Always restore console methods
        console.warn = originalWarn;
        console.error = originalError;
      }
    } catch (error: unknown) {
      // Check if user cancelled (don't log as error)
      const firebaseError = error as FirebaseError;
      const errorCode = firebaseError?.code || '';
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // User cancelled actions - don't log as error
      // Also check for timeout/network errors that might occur when popup is closed
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/user-cancelled' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('user-cancelled') ||
        errorMessage.includes('IdP denied access') ||
        errorMessage.includes('cancelled-popup-request') ||
        errorMessage.includes('Popup closed')
      ) {
        // User cancelled, throw special error that can be caught and ignored
        console.log('ℹ️ Google login cancelled by user');
        const cancelError = new Error('USER_CANCELLED') as UserCancelledError;
        cancelError.isUserCancelled = true;
        throw cancelError;
      }

      // Real errors - log and handle
      console.error('❌ Google login error:', {
        code: errorCode,
        message: errorMessage,
        error: error,
      });

      if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      } else if (
        errorCode === 'auth/account-exists-with-different-credential' ||
        errorMessage.includes('account-exists-with-different-credential')
      ) {
        throw new Error('An account already exists with the same email address but different sign-in credentials.');
      } else if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        throw new Error('Unauthorized domain. Please contact support.');
      }

      // Unknown error
      throw new Error('Failed to login with Google. Please try again.');
    }
  };

  // Login with Facebook
  const loginWithFacebook = async () => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized. Please check Firebase configuration.');
    }

    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      
      // Suppress Cross-Origin-Opener-Policy warning and 400 errors when user cancels
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.warn = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        if (message.includes('Cross-Origin-Opener-Policy') || message.includes('window.closed')) {
          // Suppress this specific warning
          return;
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        // Suppress 400 Bad Request errors from Firebase when user cancels
        if (
          message.includes('signInWithIdp') ||
          message.includes('400') ||
          message.includes('Bad Request')
        ) {
          // Check if this is likely a user cancellation (will be caught below)
          return;
        }
        originalError.apply(console, args);
      };

      try {
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Facebook login successful');
        await syncUserToBackend(result.user);
      } catch (popupError: unknown) {
        // Restore console methods before checking error
        console.warn = originalWarn;
        console.error = originalError;
        throw popupError;
      } finally {
        // Always restore console methods
        console.warn = originalWarn;
        console.error = originalError;
      }
    } catch (error: unknown) {
      // Check if user cancelled (don't log as error)
      const firebaseError = error as FirebaseError;
      const errorCode = firebaseError?.code || '';
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // User cancelled actions - don't log as error
      // Also check for timeout/network errors that might occur when popup is closed
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/user-cancelled' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('user-cancelled') ||
        errorMessage.includes('IdP denied access') ||
        errorMessage.includes('cancelled-popup-request') ||
        errorMessage.includes('Popup closed')
      ) {
        // User cancelled, throw special error that can be caught and ignored
        console.log('ℹ️ Facebook login cancelled by user');
        const cancelError = new Error('USER_CANCELLED') as UserCancelledError;
        cancelError.isUserCancelled = true;
        throw cancelError;
      }

      // Real errors - log and handle
      console.error('❌ Facebook login error:', {
        code: errorCode,
        message: errorMessage,
        error: error,
      });

      if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      } else if (
        errorCode === 'auth/account-exists-with-different-credential' ||
        errorMessage.includes('account-exists-with-different-credential')
      ) {
        throw new Error('An account already exists with the same email address but different sign-in credentials.');
      } else if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        throw new Error('Unauthorized domain. Please contact support.');
      } else if (errorCode === 'auth/auth-domain-config-required') {
        throw new Error('Facebook authentication is not properly configured. Please contact support.');
      }

      // Unknown error
      throw new Error('Failed to login with Facebook. Please try again.');
    }
  };

  // Send email verification
  const sendEmailVerificationEmail = async () => {
    if (!auth || !currentUser) {
      throw new Error('You need to login to send verification email.');
    }
    try {
      await sendEmailVerification(currentUser);
      console.log('✅ Email verification sent');
    } catch (error: unknown) {
      console.error('❌ Email verification error:', error);
      if (error instanceof Error) {
        if (error.message.includes('too-many-requests')) {
          throw new Error('You have sent too many emails. Please wait a moment and try again.');
        }
      }
      throw error;
    }
  };

  // Change password (requires current password for re-authentication)
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth || !currentUser) {
      throw new Error('You need to login to change password.');
    }

    if (!currentUser.email) {
      throw new Error('User email not found. Cannot change password.');
    }

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
      console.log('✅ Password changed successfully');
    } catch (error: unknown) {
      console.error('❌ Change password error:', error);
      if (error instanceof Error) {
        if (error.message.includes('wrong-password') || error.message.includes('invalid-credential')) {
          throw new Error('Current password is incorrect. Please try again.');
        } else if (error.message.includes('weak-password')) {
          throw new Error('New password is too weak. Please use a stronger password.');
        } else if (error.message.includes('requires-recent-login')) {
          throw new Error('Please login again to change your password.');
        }
      }
      throw error;
    }
  };

  // Refresh user profile from backend
  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  useEffect(() => {
    if (!auth) {
      console.error('❌ Firebase auth not initialized!');
      console.error('');
      console.error('═══════════════════════════════════════════════════════');
      console.error('⚠️  CẦN BẬT FIREBASE AUTHENTICATION');
      console.error('═══════════════════════════════════════════════════════');
      console.error('');
      console.error('📋 Các bước cần làm:');
      console.error('');
      console.error('1. Vào Firebase Console: https://console.firebase.google.com/');
      console.error('2. Chọn project: fitora-e1beb');
      console.error('3. Click "Authentication" ở menu bên trái');
      console.error('4. Nếu chưa có, click "Get started"');
      console.error('5. Vào tab "Sign-in method"');
      console.error('6. Click vào "Email/Password"');
      console.error('7. Bật "Enable" (toggle ON)');
      console.error('8. Click "Save"');
      console.error('');
      console.error('Sau đó refresh browser và thử lại!');
      console.error('═══════════════════════════════════════════════════════');
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setLoading(false), 0);
      return;
    }

    console.log('🔐 Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('👤 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        await syncUserToBackend(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithFacebook,
    resetPassword,
    verifyOTPAndResetPassword,
    sendEmailVerification: sendEmailVerificationEmail,
    changePassword,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

