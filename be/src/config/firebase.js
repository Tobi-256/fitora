import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();



let firebaseApp;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
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
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message);
  throw error;
}


if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.firestore().settings({
    host: process.env.FIRESTORE_EMULATOR_HOST,
    ssl: false,
  });
  console.log('[Firestore] Using emulator at', process.env.FIRESTORE_EMULATOR_HOST);
}
export const db = admin.firestore();
export const auth = firebaseApp ? admin.auth() : null;
export default admin;

