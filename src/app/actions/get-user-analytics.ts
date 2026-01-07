'use server';

import { doc, getDoc, Firestore } from 'firebase/firestore';

// This interface now needs to be defined here or in a shared types file
// since we are removing the dependency on the admin SDK file that might have it.
interface SubjectPerformance {
  subject: string;
  accuracy: number;
}

interface UserAnalytics {
  totalAnswered: number;
  overallAccuracy: number;
  simulatedExamsFinished: number;
  flashcardsTotal: number;
  bestSubject?: { name: string; accuracy: number };
  worstSubject?: { name: string; accuracy: number };
  subjectPerformance: SubjectPerformance[];
}

// NOTE: This function is designed to be called from a context where `firestore` instance is available.
// However, since server actions cannot easily receive complex objects like a Firestore instance
// from the client, we will need to adjust how it's called or initialized.
// For now, let's assume we can get the admin instance here, but we'll correct the architecture
// by creating a new `admin.ts` that can be imported safely.
// For the purpose of fixing the immediate error, we'll imagine a `getAdminFirestore` function exists.

// Let's create a temporary solution to get the firestore instance on the server
// This avoids the 'use server' module graph issue.
import { adminFirestore } from '@/firebase/admin';

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    const userDocRef = doc(adminFirestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Return a default/empty state if the user has no data yet
      return {
        totalAnswered: 0,
        overallAccuracy: 0,
        simulatedExamsFinished: 0,
        flashcardsTotal: 0,
        subjectPerformance: [],
      };
    }

    const userData = userDoc.data();
    const stats = userData?.stats?.performance;
    const questionsStats = stats?.questions;

    const totalAnswered = questionsStats?.totalAnswered || 0;
    const totalCorrect = questionsStats?.totalCorrect || 0;
    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    
    const subjectPerformance: SubjectPerformance[] = [];
    let bestSubject: { name: string; accuracy: number } | undefined;
    let worstSubject: { name: string; accuracy: number } | undefined;

    if (questionsStats?.bySubject) {
      for (const [subject, data] of Object.entries(questionsStats.bySubject as any)) {
        if (data.answered > 0) {
          const accuracy = (data.correct / data.answered) * 100;
          subjectPerformance.push({ subject, accuracy });

          if (!bestSubject || accuracy > bestSubject.accuracy) {
            bestSubject = { name: subject, accuracy };
          }
           if (!worstSubject || accuracy < worstSubject.accuracy) {
            worstSubject = { name: subject, accuracy };
          }
        }
      }
      if (subjectPerformance.length === 1) {
          worstSubject = bestSubject;
      }
    }
    
    subjectPerformance.sort((a, b) => b.accuracy - a.accuracy);

    return {
      totalAnswered,
      overallAccuracy,
      simulatedExamsFinished: stats?.simulatedExams?.length || 0,
      flashcardsTotal: stats?.flashcards?.totalReviewed || 0,
      bestSubject,
      worstSubject,
      subjectPerformance,
    };

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    // In a real app, you might want to log this error to a monitoring service
    throw new Error('Failed to fetch user analytics from the server.');
  }
}
