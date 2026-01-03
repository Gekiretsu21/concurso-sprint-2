'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length === 0) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // This will fail in local development, so we fall back to a hardcoded config.
      // In a real app, you would use environment variables here.
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Automatic initialization failed. This is expected in local development. Falling back to a hardcoded config. In a real app, you would use environment variables.'
        );
        firebaseApp = initializeApp({
          projectId: 'studio-6116545318-c4cd8',
          appId: '1:80306279068:web:2d75edabf8423a69c69359',
          apiKey: 'AIzaSyDNdXvivPkEZDNWcAOAwHPY_szbtfX_OlE',
          authDomain: 'studio-6116545318-c4cd8.firebaseapp.com',
        });
      } else {
        console.error('Automatic Firebase initialization failed in production.', e);
        // In production, we might want to re-throw or handle this more gracefully.
        throw e;
      }
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
