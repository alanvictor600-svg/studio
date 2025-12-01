
// src/lib/firebase-client.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "@/firebase/config";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This check ensures that Firebase is only initialized on the client side.
if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

// Export the initialized services. They will be undefined on the server,
// but that's fine because they are only used in client components.
export { app, auth, db };
