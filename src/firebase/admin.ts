import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: Path to service account credentials
// You need to download this from your Firebase project settings.
// Ensure the file is not publicly accessible.
// const serviceAccount = require('./serviceAccountKey.json');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

let adminApp: App;

if (!getApps().length) {
    adminApp = initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    adminApp = getApps()[0];
}


const adminAuth = getAuth(adminApp);
const adminFirestore = getFirestore(adminApp);

export { adminApp, adminAuth, adminFirestore };
