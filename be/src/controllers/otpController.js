import { generateOTP, storeOTP, verifyOTP, getOTP } from '../services/otpService.js';
import { sendMail } from '../utils/email.js';
import { getRegistrationOTPTemplate, getPasswordResetOTPTemplate } from '../utils/emailTemplates.js';

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const { type = 'registration' } = req.query; // 'registration' or 'password-reset'

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required!',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format!',
      });
    }

    const otp = generateOTP();
    storeOTP(email, otp);

    let emailTemplate;
    if (type === 'password-reset') {
      emailTemplate = getPasswordResetOTPTemplate(otp);
    } else {
      emailTemplate = getRegistrationOTPTemplate(otp);
    }

    try {
      await sendMail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });


      res.json({
        success: true,
        message: 'OTP code has been sent to your email!',
        // In development, always return OTP for testing
        otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    } catch (emailError) {
      // If email config is missing or network/SMTP error occurs, in development return success with OTP
      const isDev = process.env.NODE_ENV !== 'production';
      const isConfigMissing = emailError.message?.includes('Email configuration is missing');
      const isNetworkError = emailError.code === 'ESOCKET' || emailError.code === 'ECONNRESET' || emailError.code === 'ENOTFOUND';

      if (isConfigMissing || (isDev && isNetworkError)) {
        return res.json({
          success: true,
          message: isConfigMissing
            ? 'OTP code has been generated (Email not configured, check console to see OTP).'
            : 'OTP code generated (email send failed in development).',
          otp: otp,
        });
      }

      return res.status(500).json({
        success: false,
        message: emailError.message || 'Unable to send email. Please check email configuration or try again later.',
        ...(isDev && { otp }),
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while sending OTP!',
    });
  }
};

export const verifyOTPCode = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required!',
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits!',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format!',
      });
    }

    const isPasswordReset = req.query.type === 'password-reset' || req.body.type === 'password-reset';
    const removeAfterVerify = !isPasswordReset;
    const result = verifyOTP(email, otp, removeAfterVerify);

    if (result.valid) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      // Return 400 with clear error message
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while verifying OTP!',
    });
  }
};
