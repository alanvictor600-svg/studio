
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const auth = getAuth(app);
const firestore = getFirestore(app);

// This is the initializeFirebase function for the client-side.
// It ensures that Firebase is only initialized once.
export function initializeFirebase() {
    // This function is now effectively a no-op on the client because
    // the initialization happens above at the module level.
    // We keep it for consistency in imports if needed.
    return { app, auth, firestore };
}

// Export the initialized services for direct import.
export { app, auth, firestore };
