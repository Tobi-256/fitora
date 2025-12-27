/**
 * Migration script: MongoDB (users collection) -> Firestore (users collection)
 * Usage:
 *   NODE_ENV=development node scripts/migrate-mongo-to-firestore.js
 * Requires env: MONGODB_URI (point to existing Mongo), and Firebase Admin already configured via env vars
 */

import mongoose from 'mongoose';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// initialize firebase admin using existing backend config if not already initialized
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    console.error('Firebase credentials not found in env. Abort.');
    process.exit(1);
  }
}

const db = admin.firestore();

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Set MONGODB_URI in env to connect to your existing MongoDB');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Read users collection (adapt fields as needed)
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} users in MongoDB`);

  const batch = db.batch();
  let ops = 0;

  for (const u of users) {
    const uid = u.firebaseUid || u._id.toString();
    const ref = db.collection('users').doc(uid);
    const payload = {
      firebaseUid: uid,
      email: u.email || '',
      name: u.name || '',
      avatarUrl: u.avatarUrl || '',
      phone: u.phone || '',
      address: u.address || '',
      gender: u.gender || '',
      dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth) : null,
      role: u.role || 'user',
      isPremium: !!u.isPremium,
      createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
    };
    batch.set(ref, payload, { merge: true });
    ops++;

    if (ops === 450) {
      await batch.commit();
      console.log('Committed 450 writes');
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
    console.log('Committed final batch');
  }

  console.log('Migration complete');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
