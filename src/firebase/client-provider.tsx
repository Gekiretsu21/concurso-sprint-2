'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && firebaseServices.auth) {
        // In development, dynamically add the current domain to the authorized list.
        // This helps with ephemeral development environments like Cloud Workstations.
        const currentDomains = firebaseServices.auth.config.authorizedDomains || [];
        if (!currentDomains.includes(window.location.hostname)) {
            firebaseServices.auth.settings.authorizedDomains = [...currentDomains, window.location.hostname];
        }
    }
  }, [firebaseServices.auth]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
