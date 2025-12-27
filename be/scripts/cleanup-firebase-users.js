/**
 * Script để cleanup users trong Firebase Authentication
 * Nếu user không tồn tại trong MongoDB nhưng vẫn còn trong Firebase
 * 
 * Usage:
 * node scripts/cleanup-firebase-users.js <email>
 * hoặc
 * node scripts/cleanup-firebase-users.js --all (cleanup tất cả users không có trong MongoDB)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';
import mongoose from 'mongoose';
import User from '../src/models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Firebase Admin
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    throw new Error('Firebase configuration is missing.');
  }
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error.message);
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Cleanup single email
const cleanupEmail = async (email) => {
  try {
    const auth = admin.auth();
    
    // Get user from Firebase
    const userRecord = await auth.getUserByEmail(email);
    const firebaseUid = userRecord.uid;
    
    // Check if exists in MongoDB
    const mongoUser = await User.findOne({ firebaseUid });
    
    if (mongoUser) {
      console.log(`⚠️  User ${email} exists in MongoDB. Skipping cleanup.`);
      return { cleaned: false, reason: 'exists_in_mongodb' };
    }
    
    // Delete from Firebase
    await auth.deleteUser(firebaseUid);
    console.log(`✅ Cleaned up Firebase user: ${email} (${firebaseUid})`);
    return { cleaned: true };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`ℹ️  User ${email} not found in Firebase.`);
      return { cleaned: false, reason: 'not_found_in_firebase' };
    }
    throw error;
  }
};

// Cleanup all orphaned users
const cleanupAll = async () => {
  try {
    const auth = admin.auth();
    let nextPageToken;
    let totalCleaned = 0;
    let totalSkipped = 0;
    
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      
      for (const userRecord of listUsersResult.users) {
        const firebaseUid = userRecord.uid;
        const email = userRecord.email;
        
        if (!email) continue;
        
        // Check if exists in MongoDB
        const mongoUser = await User.findOne({ firebaseUid });
        
        if (!mongoUser) {
          // User doesn't exist in MongoDB, delete from Firebase
          await auth.deleteUser(firebaseUid);
          console.log(`✅ Cleaned up: ${email} (${firebaseUid})`);
          totalCleaned++;
        } else {
          console.log(`⏭️  Skipped: ${email} (exists in MongoDB)`);
          totalSkipped++;
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Cleaned: ${totalCleaned}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Total: ${totalCleaned + totalSkipped}`);
  } catch (error) {
    console.error('❌ Cleanup all error:', error);
    throw error;
  }
};

// Main
const main = async () => {
  await connectDB();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/cleanup-firebase-users.js <email>');
    console.log('  node scripts/cleanup-firebase-users.js --all');
    process.exit(1);
  }
  
  if (args[0] === '--all') {
    console.log('🧹 Cleaning up all orphaned Firebase users...\n');
    await cleanupAll();
  } else {
    const email = args[0];
    console.log(`🧹 Cleaning up Firebase user: ${email}\n`);
    await cleanupEmail(email);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Done!');
  process.exit(0);
};

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

