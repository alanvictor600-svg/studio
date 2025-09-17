// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Ensure the private key is properly formatted by replacing all instances of \\n with \n
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  // Validate that all required environment variables are present before initializing.
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase admin credentials not found. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your environment variables.'
    );
  }
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
