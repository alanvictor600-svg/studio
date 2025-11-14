
'use client';

import React, { ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';

// This component's only job is to run the initializeFirebase function once.
// It doesn't need to provide a context. The initialized instances are available globally.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // The useMemo is not strictly necessary here since the function handles the singleton pattern,
  // but it's a good practice to ensure it's not called unnecessarily on re-renders.
  React.useMemo(() => {
    initializeFirebase();
  }, []);

  return <>{children}</>;
}
