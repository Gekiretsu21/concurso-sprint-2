import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth;
let adminFirestore;

if (getApps().length === 0) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    adminApp = initializeApp({
      projectId: 'demo-project',
    });
    adminFirestore = getFirestore(adminApp);
    adminFirestore.settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false,
    });
  } else {
    // In production (App Hosting), the SDK detects credentials automatically.
    // For local development without the emulator explicitly set, this prevents auth errors.
    adminApp = initializeApp({
      projectId: 'demo-project'
    });
    adminFirestore = getFirestore(adminApp);
  }
  adminAuth = getAuth(adminApp);
} else {
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
  adminFirestore = getFirestore(adminApp);
}

export { adminApp, adminAuth, adminFirestore };
