import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async ({ to, subject, html, text }) => {
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY);
  console.log('RESEND_FROM:', process.env.RESEND_FROM);
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key is missing. Please set RESEND_API_KEY in your environment.');
  }
  try {
    const from = process.env.RESEND_FROM || 'binhhpce180102@gmail.com';
    console.log('Sending mail to:', to, 'subject:', subject);
    const info = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    console.log('Mail sent:', info.id || info);
    return info;
  } catch (error) {
    console.error('Send mail error:', error);
    throw error;
  }
};
