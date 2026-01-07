'use server';

// Load environment variables from .env file for the server-side admin SDK
require('dotenv').config({ path: '.env' });

import { adminFirestore } from '@/firebase/admin';

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

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    const userDocRef = adminFirestore.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // If the user document doesn't exist, return empty stats.
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

    // Return empty stats if performance data is not available
    if (!stats) {
        return {
            totalAnswered: 0,
            overallAccuracy: 0,
            simulatedExamsFinished: 0,
            flashcardsTotal: 0,
            subjectPerformance: [],
        };
    }

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
