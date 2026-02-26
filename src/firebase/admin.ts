import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// O ID real do seu projeto no Firebase
const projectId = 'studio-6116545318-c4cd8';

let adminApp: App;

if (getApps().length === 0) {
  // Se estivermos em ambiente de desenvolvimento com o emulador
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    adminApp = initializeApp({
      projectId: 'demo-project',
    });
    
    // Configura o emulador apenas na primeira inicialização e antes de qualquer outra operação
    getFirestore(adminApp).settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false,
    });
  } else {
    // Em produção ou desenvolvimento padrão, usamos o ID real.
    // As credenciais são detectadas automaticamente pelo ambiente (App Hosting).
    adminApp = initializeApp({
      projectId: projectId
    });
  }
} else {
  adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminFirestore = getFirestore(adminApp);

export { adminApp, adminAuth, adminFirestore };
