import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim()  // Trim remove extras
  : undefined;

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID!,  // ! evita undefined
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey,
};

// Debug temporário (remova em prod)
console.log('Private key preview:', privateKey?.substring(0, 100) + '...');

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminFirestore = getFirestore(adminApp);

export { adminApp, adminAuth, adminFirestore };

