'use server';

import { adminFirestore } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

interface SystemAnalytics {
  totalUsers: {
    count: number;
    newToday: number;
  };
  engagement: {
    questionsAnswered24h: number;
  };
}

export async function getSystemAnalytics(): Promise<SystemAnalytics> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    // 1. Total de Usuários
    const usersSnapshot = await adminFirestore.collection('users').get();
    
    // Filtro básico para novos usuários (assume campo createdAt)
    const newUsersTodaySnapshot = await adminFirestore
      .collection('users')
      .where('createdAt', '>=', todayTimestamp)
      .get()
      .catch(() => ({ size: 0 })); // Fallback se o campo/índice não existir

    // 2. Engajamento (Questões respondidas)
    // Nota: collectionGroup exige a criação de índice no Firebase Console.
    // Usamos try/catch específico aqui para não quebrar a dashboard inteira.
    let questionsAnswered24h = 0;
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twentyFourHoursAgoTimestamp = Timestamp.fromDate(twentyFourHoursAgo);

      const allAttemptsSnapshots = await adminFirestore.collectionGroup('question_attempts')
          .where('timestamp', '>=', twentyFourHoursAgoTimestamp)
          .get();
      
      questionsAnswered24h = allAttemptsSnapshots.size;
    } catch (e) {
      console.warn("Aviso: Consulta de collectionGroup falhou (provável falta de índice).");
      questionsAnswered24h = 0;
    }

    return {
      totalUsers: {
        count: usersSnapshot.size,
        newToday: newUsersTodaySnapshot.size,
      },
      engagement: {
        questionsAnswered24h: questionsAnswered24h,
      },
    };
  } catch (error) {
    console.error("Erro crítico em getSystemAnalytics:", error);
    return {
      totalUsers: { count: 0, newToday: 0 },
      engagement: { questionsAnswered24h: 0 }
    };
  }
}
