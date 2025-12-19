import crypto from 'crypto';

// In-memory storage for OTPs (in production should use Redis or database)
const otpStore = new Map();

/**
 * Generate 6-digit OTP code
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Store OTP with expiration (5 minutes)
 */
export const storeOTP = (email, otp) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(email, {
    otp,
    expiresAt,
    attempts: 0,
  });
  
  // Clean up expired OTPs
  setTimeout(() => {
    otpStore.delete(email);
  }, 5 * 60 * 1000);
};

/**
 * Verify OTP
 * @param {boolean} removeAfterVerify - Whether to remove OTP after verification (default: false for password reset flow)
 */
export const verifyOTP = (email, inputOTP, removeAfterVerify = false) => {
  const stored = otpStore.get(email);
  
  if (!stored) {
    return { valid: false, message: 'OTP does not exist or has expired. Please request a new code.' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired. Please request a new code.' };
  }
  
  if (stored.attempts >= 5) {
    otpStore.delete(email);
    return { valid: false, message: 'Too many failed attempts. Please request a new code.' };
  }
  
  if (inputOTP !== stored.otp) {
    stored.attempts += 1;
    return { valid: false, message: `Invalid OTP. ${5 - stored.attempts} attempts remaining.` };
  }
  
  // OTP is valid
  // Mark as verified but don't remove yet (for password reset flow)
  stored.verified = true;
  
  // Only remove if explicitly requested (for registration flow)
  if (removeAfterVerify) {
    otpStore.delete(email);
  }
  
  return { valid: true, message: 'OTP is valid.' };
};

/**
 * Remove OTP from store (after password reset success)
 */
export const removeOTP = (email) => {
  otpStore.delete(email);
};

/**
 * Get stored OTP (for testing/debugging)
 */
export const getOTP = (email) => {
  return otpStore.get(email);
};
