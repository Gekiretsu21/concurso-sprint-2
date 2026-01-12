import { initializeApp, getApps, App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

// Checa se já existem apps inicializados
if (!getApps().length) {
  // Se a variável de ambiente do emulador estiver definida, conecte-se ao emulador.
  // Isso é ideal para o desenvolvimento local.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    adminApp = initializeApp({
      projectId: 'demo-project', // Use um ID de projeto de demonstração para o emulador
    });
  } else {
    // Em produção (ex: App Hosting), o SDK detectará as credenciais automaticamente.
    adminApp = initializeApp();
  }
} else {
  // Se já houver um app, use-o.
  adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminFirestore = getFirestore(adminApp);

// Se estiver usando o emulador, aponte o Firestore para ele.
if (process.env.FIRESTORE_EMULATOR_HOST) {
  adminFirestore.settings({
    host: process.env.FIRESTORE_EMULATOR_HOST,
    ssl: false,
  });
}


export { adminApp, adminAuth, adminFirestore };
