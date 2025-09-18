// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Verifica se o app já foi inicializado para evitar reinicializações
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  if (!projectId || !clientEmail || !privateKeyBase64) {
    throw new Error(
      'As credenciais do Firebase Admin não foram encontradas. Verifique se FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, e FIREBASE_PRIVATE_KEY_BASE64 estão definidas no seu ambiente.'
    );
  }

  // Decodifica a chave privada do formato Base64, garantindo que as quebras de linha sejam preservadas.
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

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
