import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth;
let adminFirestore;

// Checa se já existem apps inicializados para evitar re-inicialização.
if (getApps().length === 0) {
  // Se a variável de ambiente do emulador estiver definida, conecte-se ao emulador.
  // Isso é ideal para o desenvolvimento local.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    adminApp = initializeApp({
      projectId: 'demo-project', // Use um ID de projeto de demonstração para o emulador
    });
    adminFirestore = getFirestore(adminApp);
    adminFirestore.settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false,
    });
  } else {
    // Em produção (ex: App Hosting), o SDK detectará as credenciais automaticamente.
    adminApp = initializeApp();
    adminFirestore = getFirestore(adminApp);
  }
  adminAuth = getAuth(adminApp);
} else {
  // Se já houver um app, use-o.
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
  adminFirestore = getFirestore(adminApp);
}

export { adminApp, adminAuth, adminFirestore };
