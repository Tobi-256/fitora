import { generateOTP, storeOTP, verifyOTP, getOTP } from '../services/otpService.js';
import { sendMail } from '../utils/email.js';
import { getRegistrationOTPTemplate, getPasswordResetOTPTemplate } from '../utils/emailTemplates.js';

/**
 * POST /api/otp/send
 * Send OTP code via email
 * Query params: type=registration (default) | password-reset
 */
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format!',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    storeOTP(email, otp);

    // Select email template based on type
    let emailTemplate;
    if (type === 'password-reset') {
      emailTemplate = getPasswordResetOTPTemplate(otp);
    } else {
      emailTemplate = getRegistrationOTPTemplate(otp);
    }

    // Send email
    try {
      await sendMail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`✅ OTP sent to ${email}: ${otp}`); // Log for testing

      res.json({
        success: true,
        message: 'OTP code has been sent to your email!',
        // In development, always return OTP for testing
        otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    } catch (emailError) {
      console.error('❌ Send email error:', emailError);
      
      // If email config is missing, still return OTP for testing
      if (emailError.message?.includes('Email configuration is missing')) {
        console.log(`⚠️ Email not configured. OTP for ${email}: ${otp}`);
        return res.json({
          success: true,
          message: 'OTP code has been generated (Email not configured, check console to see OTP).',
          otp: otp, // Return OTP for testing
        });
      }
      
      return res.status(500).json({
        success: false,
        message: emailError.message || 'Unable to send email. Please check email configuration or try again later.',
        // In development, still return OTP for testing
        ...(process.env.NODE_ENV !== 'production' && { otp }),
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending OTP!',
    });
  }
};

/**
 * POST /api/otp/verify
 * Verify OTP code
 */
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

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits!',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format!',
      });
    }

    // For registration, remove OTP after verification
    // For password reset, keep OTP until password is reset
    // Check if this is password reset by checking if type is in query or body
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
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying OTP!',
    });
  }
};
