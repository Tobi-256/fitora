import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  // Check if email config is available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email configuration is missing. OTP will be logged to console only.');
    console.warn('Please add EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS to .env file');
    return null;
  }

  // Email configuration từ .env
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify().catch((err) => {
    console.error('Email transporter verification failed:', err);
    console.error('Please check your EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env');
  });

  transporter.defaultMailOptions = {
    from: `"Fitora" <${process.env.EMAIL_USER}>`,
  };

  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.warn('⚠️ Email transporter not available. Email will not be sent.');
    throw new Error('Email configuration is missing. Please check .env file.');
  }

  try {
    const mailOptions = {
      ...transporter.defaultMailOptions,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Send mail error:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
    });
    throw error;
  }
};

