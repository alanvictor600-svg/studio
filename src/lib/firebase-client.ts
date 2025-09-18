// src/lib/firebase-client.ts

import { app } from './firebase'; // Import the initialized app
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";

// Initialize Firestore with offline persistence for the client-side.
// This ensures it's only ever bundled for the client.
const db = initializeFirestore(app, {
    localCache: persistentLocalCache(/* No parameters needed here */)
});

export { db };
