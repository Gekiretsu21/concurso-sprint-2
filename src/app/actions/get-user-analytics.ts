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
  totalStudyTime: string;
  dailyStreak: number;
  level: number;
  bestSubject?: { name: string; accuracy: number };
  worstSubject?: { name: string; accuracy: number };
  subjectPerformance: SubjectPerformance[];
}

function formatStudyTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0h 0m';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function calculateLevel(questions: number, flashcards: number, exams: number): number {
  const totalPoints = questions * 1 + flashcards * 2 + exams * 10;
  return Math.floor(totalPoints / 100) + 1;
}

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    const userDocRef = adminFirestore.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    const emptyAnalytics: UserAnalytics = {
      totalAnswered: 0,
      overallAccuracy: 0,
      simulatedExamsFinished: 0,
      flashcardsTotal: 0,
      totalStudyTime: '0h 0m',
      dailyStreak: 0,
      level: 1,
      subjectPerformance: [],
    };

    if (!userDoc.exists) {
      return emptyAnalytics;
    }

    const userData = userDoc.data();
    if (!userData) {
      return emptyAnalytics;
    }
    
    // Use optional chaining and nullish coalescing for cleaner, safer access
    const stats = userData.stats ?? {};
    const questionsStats = stats.performance?.questions ?? {};
    const flashcardsStats = stats.performance?.flashcards ?? {};
    const simulatedExamsStats = stats.performance?.simulatedExams ?? [];

    const totalAnswered = questionsStats.totalAnswered ?? 0;
    const totalCorrect = questionsStats.totalCorrect ?? 0;
    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    
    const flashcardsTotal = flashcardsStats.totalReviewed ?? 0;
    const simulatedExamsFinished = Array.isArray(simulatedExamsStats) ? simulatedExamsStats.length : 0;

    const level = calculateLevel(totalAnswered, flashcardsTotal, simulatedExamsFinished);

    const subjectPerformance: SubjectPerformance[] = [];
    let bestSubject: { name: string; accuracy: number } | undefined;
    let worstSubject: { name: string; accuracy: number } | undefined;

    const bySubject = questionsStats.bySubject ?? {};

    for (const subject in bySubject) {
      // Check if the property is directly on the object to avoid iterating over inherited properties
      if (Object.prototype.hasOwnProperty.call(bySubject, subject)) {
        const data = bySubject[subject];
        // Safely access properties and provide fallbacks
        if (data && typeof data === 'object') {
            const answered = data.answered ?? 0;
            const correct = data.correct ?? 0;
            
            if (answered > 0) {
                const accuracy = (correct / answered) * 100;
                subjectPerformance.push({ subject, accuracy });
            }
        } else {
           // Log malformed data for debugging purposes
           console.warn(`Invalid performance data for subject "${subject}":`, data);
        }
      }
    }
    
    if (subjectPerformance.length > 0) {
        subjectPerformance.sort((a, b) => b.accuracy - a.accuracy);
        bestSubject = subjectPerformance[0];
        worstSubject = subjectPerformance[subjectPerformance.length - 1];
    }

    return {
      totalAnswered,
      overallAccuracy,
      simulatedExamsFinished,
      flashcardsTotal,
      totalStudyTime: formatStudyTime(stats.totalStudyTime ?? 0),
      dailyStreak: stats.dailyStreak ?? 0,
      level,
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
