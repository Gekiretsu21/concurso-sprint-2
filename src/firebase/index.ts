import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FirebaseClientProvider } from './client-provider';
import { FirebaseProvider, useFirebase } from './provider';
import { useUser } from './auth/use-user';

// IMPORTANT: Replace this with your project's configuration.
// You can get this from the Firebase console.
const firebaseConfig = {
  projectId: 'studio-6116545318-c4cd8',
  appId: '1:80306279068:web:2d75edabf8423a69c69359',
  apiKey: 'AIzaSyDNdXvivPkEZDNWcAOAwHPY_szbtfX_OlE',
  authDomain: 'studio-6116545318-c4cd8.firebaseapp.com',
  messagingSenderId: '80306279068',
};


function initializeFirebase() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useUser,
};
