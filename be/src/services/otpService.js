import crypto from 'crypto';

const otpStore = new Map();

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const storeOTP = (email, otp) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(email, {
    otp,
    expiresAt,
    attempts: 0,
  });
  
  setTimeout(() => {
    otpStore.delete(email);
  }, 5 * 60 * 1000);
};

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
  
  stored.verified = true;
  
  if (removeAfterVerify) {
    otpStore.delete(email);
  }
  
  return { valid: true, message: 'OTP is valid.' };
};

export const removeOTP = (email) => {
  otpStore.delete(email);
};

export const getOTP = (email) => {
  return otpStore.get(email);
};
