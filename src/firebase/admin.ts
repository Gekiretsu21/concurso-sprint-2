import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// O ID real do seu projeto no Firebase
const projectId = 'studio-6116545318-c4cd8';

const adminApp = getApps().length === 0 
  ? initializeApp({ projectId }) 
  : getApp();

const adminAuth = getAuth(adminApp);
const adminFirestore = getFirestore(adminApp);

// Configuração do emulador se detectado no ambiente
if (process.env.FIRESTORE_EMULATOR_HOST) {
  try {
    adminFirestore.settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false,
    });
  } catch (e) {
    // Ignora se já estiver configurado ou em uso
  }
}

export { adminApp, adminAuth, adminFirestore };
