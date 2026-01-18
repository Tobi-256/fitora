/**
 * Email Templates for Fitora
 * Centralized email templates for easy management and editing
 */

/**
 * OTP template for account registration
 */
export const getRegistrationOTPTemplate = (otp) => {
  return {
    subject: 'Registration OTP Verification Code - Fitora',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #000; margin-top: 0;">Account Registration Verification</h2>
          <p style="color: #333; font-size: 16px;">Hello,</p>
          <p style="color: #666; font-size: 14px;">Thank you for registering an account with Fitora. Your OTP code is:</p>
          <div style="background-color: #FFE5E5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #000; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in <strong style="color: #000;">5 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; margin: 0;">Best regards,<br><strong>The Fitora Team</strong></p>
        </div>
      </div>
    `,
    text: `Your registration OTP verification code is: ${otp}. This code will expire in 5 minutes.`,
  };
};

/**
 * OTP template for password reset
 */
export const getPasswordResetOTPTemplate = (otp) => {
  return {
    subject: 'Password Reset OTP Code - Fitora',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #000; margin-top: 0;">Password Reset</h2>
          <p style="color: #333; font-size: 16px;">Hello,</p>
          <p style="color: #666; font-size: 14px;">We received a request to reset the password for your account. Your OTP code is:</p>
          <div style="background-color: #FFE5E5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #000; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in <strong style="color: #000;">5 minutes</strong>.</p>
          <p style="color: #ff0000; font-size: 12px; margin-top: 20px;">⚠️ If you did not request a password reset, please ignore this email and ensure your account is secure.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; margin: 0;">Best regards,<br><strong>The Fitora Team</strong></p>
        </div>
      </div>
    `,
    text: `Your password reset OTP code is: ${otp}. This code will expire in 5 minutes. If you did not request a password reset, please ignore this email.`,
  };
};

/**
 * Email verification template (if needed in the future)
 */
export const getEmailVerificationTemplate = (verificationLink) => {
  return {
    subject: 'Email Verification - Fitora',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #000; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #333; font-size: 16px;">Hello,</p>
          <p style="color: #666; font-size: 14px;">Please click the link below to verify your email:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you did not request this email verification, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; margin: 0;">Best regards,<br><strong>The Fitora Team</strong></p>
        </div>
      </div>
    `,
    text: `Please click the following link to verify your email: ${verificationLink}`,
  };
};
