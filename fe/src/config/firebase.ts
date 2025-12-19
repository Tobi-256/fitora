import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// Lấy từ Firebase Console → Project Settings → General → Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDOUK4eZrdKxEnfl5T2HB2VePJmKSLoHto",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fitora-e1beb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fitora-e1beb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fitora-e1beb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "192910413296",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:192910413296:web:83d7f0fc269952a25c2135",
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is missing!');
  console.error('Please create a .env file in the fe/ directory with Firebase config.');
  console.error('See README.md for instructions.');
} else {
  console.log('✅ Firebase config loaded:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey,
  });
}

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | null = null;

try {
  // Always initialize fresh instance
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');
  console.log('Config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 20)}...` : 'MISSING',
  });
  
  auth = getAuth(app);
  
  if (auth) {
    console.log('✅ Firebase Auth initialized successfully');
    console.log('Auth instance:', auth);
  } else {
    console.error('❌ Firebase Auth initialization failed - auth is null');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('Full config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    appId: firebaseConfig.appId || 'MISSING',
  });
  
  // Try to initialize with fallback
  try {
    console.log('🔄 Attempting fallback initialization...');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Fallback initialization successful');
  } catch (fallbackError) {
    console.error('❌ Fallback initialization also failed:', fallbackError);
  }
}

export { auth };
export default app;

