import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FirebaseClientProvider } from './client-provider';
import { FirebaseProvider, useFirebase } from './provider';

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
};
