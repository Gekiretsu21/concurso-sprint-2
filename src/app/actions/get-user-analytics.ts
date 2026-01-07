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
    // Each question answered is 1 point.
    // Each flashcard reviewed is 2 points.
    // Each simulated exam finished is 10 points.
    const totalPoints = (questions * 1) + (flashcards * 2) + (exams * 10);
    // Level up every 100 points.
    const level = Math.floor(totalPoints / 100) + 1;
    return level;
}


export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    const userDocRef = adminFirestore.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    const emptyAnalytics = {
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
    if (!userData || !userData.stats) {
        return emptyAnalytics;
    }

    const stats = userData.stats;
    const performance = stats.performance;

    const questionsStats = performance?.questions;
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

    const flashcardsTotal = performance?.flashcards?.totalReviewed || 0;
    const simulatedExamsFinished = performance?.simulatedExams?.length || 0;
    const level = calculateLevel(totalAnswered, flashcardsTotal, simulatedExamsFinished);


    return {
      totalAnswered,
      overallAccuracy,
      simulatedExamsFinished,
      flashcardsTotal,
      totalStudyTime: formatStudyTime(stats.totalStudyTime || 0),
      dailyStreak: stats.dailyStreak || 0,
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
    