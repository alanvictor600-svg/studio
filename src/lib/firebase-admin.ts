// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Import the service account key directly
const serviceAccount = require('./firebase-service-account.json');

// Verifica se o app já foi inicializado para evitar reinicializações
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
