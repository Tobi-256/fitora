import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDOUK4eZrdKxEnfl5T2HB2VePJmKSLoHto",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fitora-e1beb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fitora-e1beb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fitora-e1beb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "192910413296",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:192910413296:web:83d7f0fc269952a25c2135",
};

// Validate Firebase config (log lỗi nếu thiếu config)
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  if (import.meta.env.MODE === 'development') {
    // Chỉ log lỗi khi dev
    console.error('❌ Firebase configuration is missing!');
    console.error('Please create a .env file in the fe/ directory with Firebase config.');
    console.error('See README.md for instructions.');
  }
}

let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // ...
} catch (error) {
  if (import.meta.env.MODE === 'development') {
    console.error('❌ Firebase initialization error:', error);
  }
  // Try to initialize with fallback
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (fallbackError) {
    if (import.meta.env.MODE === 'development') {
      console.error('❌ Fallback initialization also failed:', fallbackError);
    }
  }
}

export { auth };
export default app;

