'use server';

import { adminFirestore } from '@/firebase/admin';
import type { UserDashboardStats, SubjectHighlight, DashboardAnalyticsData } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

// Helper to calculate accuracy and handle division by zero
function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return (correct / total) * 100;
}

export async function getDashboardAnalytics(userId: string): Promise<DashboardAnalyticsData> {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  const docRef = adminFirestore.doc(`users/${userId}/stats/dashboard_data`);

  try {
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      // Return a default empty state for new users
      return {
        stats: {
          general: { totalQuestions: 0, totalCorrect: 0, currentStreak: 0, studyTimeMinutes: 0 },
          subjectsPerformance: {},
          evolutionHistory: [],
          flashcardsStats: {},
        },
        highlights: {
          weakestSubject: null,
          strongestSubject: null,
        },
      };
    }

    const stats = docSnap.data() as UserDashboardStats;

    // --- Processamento de "Pontos Fracos" e "Pontos Fortes" ---
    let weakestSubject: SubjectHighlight | null = null;
    let strongestSubject: SubjectHighlight | null = null;
    let minAccuracy = 101;
    let maxAccuracy = -1;

    for (const subjectName in stats.subjectsPerformance) {
      const subjectData = stats.subjectsPerformance[subjectName];
      // Regra de Negócio: Considerar apenas matérias com mais de 10 questões
      if (subjectData.total > 10) {
        const accuracy = calculateAccuracy(subjectData.correct, subjectData.total);

        if (accuracy < minAccuracy) {
          minAccuracy = accuracy;
          weakestSubject = { subject: subjectName, accuracy };
        }
        if (accuracy > maxAccuracy) {
          maxAccuracy = accuracy;
          strongestSubject = { subject: subjectName, accuracy };
        }
      }
    }

    // Convert Timestamps to ISO strings if needed, though for this structure it's not required for the client.
    // For simplicity, we return the stats as is, since recharts can handle it.
    // However, if we had client-side date logic, we'd convert Timestamps here.
    // For `evolutionHistory`, we assume `date` is already a "DD/MM" string.

    return {
      stats,
      highlights: {
        weakestSubject,
        strongestSubject,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch dashboard analytics for user ${userId}:`, error);
    throw new Error('Could not retrieve dashboard data from the server.');
  }
}
