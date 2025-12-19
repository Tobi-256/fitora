import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo Firebase Admin SDK
// Cách 1: Sử dụng service account JSON (khuyến nghị cho production)
// Cách 2: Sử dụng environment variables (đơn giản hơn cho development)

let firebaseApp;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Nếu có service account JSON string trong env
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Nếu có các biến môi trường riêng lẻ
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    throw new Error('Firebase configuration is missing. Please check environment variables.');
  }

  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error.message);
  console.error('Please check your Firebase configuration in .env file');
}

export const auth = admin.auth();
export default admin;

