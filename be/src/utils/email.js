import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

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
  });

  transporter.defaultMailOptions = {
    from: `"Fitora" <${process.env.EMAIL_USER}>`,
  };

  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  
  if (!transporter) {
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
    return info;
  } catch (error) {
    throw error;
  }
};

