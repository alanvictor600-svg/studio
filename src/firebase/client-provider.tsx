"use client";
import { createContext, useContext, ReactNode } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

// A single instance of the Firebase app is created and memoized.
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

export const FirebaseClientProvider = ({ children }: { children: ReactNode }) => {
  // The value is stable because firebaseApp is created only once.
  const value = { firebaseApp };
  
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseClientProvider");
  }
  return context;
};
