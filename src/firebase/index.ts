'use client';

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  "projectId": "studio-6116545318-c4cd8",
  "appId": "1:80306279068:web:2d75edabf8423a69c69359",
  "apiKey": "AIzaSyDNdXvivPkEZDNWcAOAwHPY_szbtfX_OlE",
  "authDomain": "studio-6116545318-c4cd8.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "80306279068"
};

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length === 0) {
    let firebaseApp: FirebaseApp;
    // In a production environment, App Hosting automatically provides the configuration.
    // In a local development environment, we will use the config object.
    if (process.env.NODE_ENV === 'production') {
       try {
        // Attempt to initialize via Firebase App Hosting environment variables
        firebaseApp = initializeApp();
      } catch (e) {
        console.error('Automatic Firebase initialization failed. This might be expected in local development if environment variables are not set. Ensure your environment is configured correctly.', e);
        // In a real app, you might want to have a fallback for local dev, but for App Hosting, 
        // the automatic initialization is key. We re-throw to make the configuration issue visible.
        throw e;
      }
    } else {
      // For local development, use the hardcoded firebaseConfig.
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
