import  { useEffect, useState } from 'react';
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

  const syncUserToBackend = async (firebaseUser: FirebaseUserType) => {
    try {
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('firebaseToken', token);

      try {
        const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
        const avatarUrl = firebaseUser.photoURL || '';
        
        await syncUser({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: name,
          avatarUrl: avatarUrl,
        });

        const profile = await getProfile();
        setUserProfile(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      } catch (apiError: unknown) {
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
    }
  };

  const register = async (email: string, password: string, name: string) => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized. Please check Firebase configuration and ensure Authentication is enabled in Firebase Console.');
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateFirebaseProfile(userCredential.user, { displayName: name });
        
        try {
          await sendEmailVerification(userCredential.user);
        } catch (verificationError) {
        }
        
        await syncUserToBackend(userCredential.user);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('configuration-not-found') || error.message.includes('auth/configuration-not-found')) {
          throw new Error('Firebase Authentication is not configured. Please enable Email/Password in Firebase Console → Authentication → Sign-in method.');
        }
        if (error.message.includes('email-already-in-use')) {
          
          try {
            const loginCredential = await signInWithEmailAndPassword(auth, email, password);
            
            if (loginCredential.user && name) {
              await updateFirebaseProfile(loginCredential.user, { displayName: name });
            }
            
            await syncUserToBackend(loginCredential.user);
            
            return;
          } catch (loginError: unknown) {
            if (loginError instanceof Error && loginError.message.includes('wrong-password')) {
              throw new Error('This email is already in use with a different password. Please login or use a different email.');
            } else if (loginError instanceof Error && loginError.message.includes('user-not-found')) {
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

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized. Please check Firebase configuration and ensure Authentication is enabled in Firebase Console.');
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserToBackend(userCredential.user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('configuration-not-found') || error.message.includes('auth/configuration-not-found')) {
          throw new Error('Firebase Authentication is not configured. Please enable Email/Password in Firebase Console → Authentication → Sign-in method.');
        }
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

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('user');
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase auth not initialized');
    
    try {
      const { sendOTP } = await import('../services/userService');
      const otpResponse = await sendOTP(email, 'password-reset');
      
      if (!otpResponse.success) {
        return { success: false, message: otpResponse.message || 'Unable to send OTP. Please try again.' };
      }
      
      return { success: true, message: otpResponse.message, otp: otpResponse.otp };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error sending OTP for password reset.';
      return { success: false, message: errorMessage };
    }
  };
  
  const verifyOTPAndResetPassword = async (email: string, otp: string) => {
    if (!auth) throw new Error('Firebase auth not initialized');
    
    try {
      const { verifyOTP } = await import('../services/userService');
      const verifyResponse = await verifyOTP(email, otp);
      
      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || 'Invalid OTP.');
      }
      
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
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

  const loginWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized. Please check Firebase configuration.');
    }

    try {
      const provider = new GoogleAuthProvider();
      
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.warn = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        if (message.includes('Cross-Origin-Opener-Policy') || message.includes('window.closed')) {
          return;
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        if (
          message.includes('signInWithIdp') ||
          message.includes('400') ||
          message.includes('Bad Request')
        ) {
          return;
        }
        originalError.apply(console, args);
      };

      try {
        const result = await signInWithPopup(auth, provider);
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
      const firebaseError = error as FirebaseError;
      const errorCode = firebaseError?.code || '';
      const errorMessage = error instanceof Error ? error.message : String(error);
      
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
        const cancelError = new Error('USER_CANCELLED') as UserCancelledError;
        cancelError.isUserCancelled = true;
        throw cancelError;
      }


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

  const loginWithFacebook = async () => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized. Please check Firebase configuration.');
    }

    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.warn = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        if (message.includes('Cross-Origin-Opener-Policy') || message.includes('window.closed')) {
          return;
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';
        if (
          message.includes('signInWithIdp') ||
          message.includes('400') ||
          message.includes('Bad Request')
        ) {
          return;
        }
        originalError.apply(console, args);
      };

      try {
        const result = await signInWithPopup(auth, provider);
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
      const firebaseError = error as FirebaseError;
      const errorCode = firebaseError?.code || '';
      const errorMessage = error instanceof Error ? error.message : String(error);
      
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
        const cancelError = new Error('USER_CANCELLED') as UserCancelledError;
        cancelError.isUserCancelled = true;
        throw cancelError;
      }


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

  const sendEmailVerificationEmail = async () => {
    if (!auth || !currentUser) {
      throw new Error('You need to login to send verification email.');
    }
    try {
      await sendEmailVerification(currentUser);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('too-many-requests')) {
          throw new Error('You have sent too many emails. Please wait a moment and try again.');
        }
      }
      throw error;
    }
  };

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
    } catch (error: unknown) {
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

  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      } catch (error) {
      }
    }
  };

  useEffect(() => {
    if (!auth) {
      setTimeout(() => setLoading(false), 0);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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

