'use client';

import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from './provider';

// The configuration object for your Firebase project.
// IMPORTANT: Replace this with your project's configuration.
// You can get this from the Firebase console.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "studio-6116545318-c4cd8.firebaseapp.com",
  projectId: "studio-6116545318-c4cd8",
  storageBucket: "studio-6116545318-c4cd8.appspot.com",
  messagingSenderId: "1071465224393",
  appId: "1:1071465224393:web:728d82599b5e510803f295",
};

/**
 * Initializes a Firebase app instance, returning a memoized object with the
 * app, auth, and firestore services.
 *
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
function useFirebaseClient() {
  const app = useMemo(() => initializeApp(firebaseConfig), []);
  const auth = useMemo(() => getAuth(app), [app]);
  const firestore = useMemo(() => getFirestore(app), [app]);

  // If you are running the Firebase Local Emulator Suite, you can connect
  // to the emulators here.
  // if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  //   connectAuthEmulator(auth, 'http://localhost:9099');
  //   connectFirestoreEmulator(firestore, 'localhost', 8080);
  // }

  return { app, auth, firestore };
}

/**
 * The client-side provider for Firebase services.
 *
 * This provider initializes the Firebase app on the client and makes the app,
 * auth, and firestore instances available to all child components through the
 * `FirebaseProvider`.
 *
 * @param children The child components to render.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { app, auth, firestore } = useFirebaseClient();

  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
