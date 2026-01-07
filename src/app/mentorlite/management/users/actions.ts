'use server';

import { adminAuth, adminFirestore } from '@/firebase/admin';
import { UserRecord } from 'firebase-admin/auth';

export interface EnrichedUserData {
  id: string;
  name: string | undefined;
  email: string | undefined;
  createdAt: string;
  // Firestore data
  stats: {
    questions: {
      totalAnswered: number;
      totalCorrect: number;
    };
    flashcards: {
      totalReviewed: number;
      totalCorrect: number;
    };
    simulatedExams: {
        name: string;
        score: number;
        date: string;
    }[];
  } | null;
}

/**
 * Fetches all users from Firebase Authentication and enriches them with data from Firestore.
 * @returns A promise that resolves to an array of enriched user data.
 */
export async function fetchAllUsersData(): Promise<EnrichedUserData[]> {
  try {
    const userRecords: UserRecord[] = [];
    let nextPageToken;

    // List all users from Firebase Auth
    do {
      const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
      userRecords.push(...listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    // Get all user IDs
    const userIds = userRecords.map(user => user.uid);
    if (userIds.length === 0) {
      return [];
    }
    
    // Fetch corresponding Firestore documents in a single query
    const firestoreUsersSnap = await adminFirestore.collection('users').where('id', 'in', userIds).get();
    const firestoreUsersMap = new Map();
    firestoreUsersSnap.forEach(doc => {
      firestoreUsersMap.set(doc.id, doc.data());
    });

    // Combine Auth and Firestore data
    const enrichedUsers = userRecords.map(user => {
      const firestoreData = firestoreUsersMap.get(user.uid);
      
      // Safely extract and default stats
      const stats = firestoreData?.stats || {};
      const performance = stats.performance || {};
      const questions = performance.questions || {};
      const flashcards = performance.flashcards || {};

      return {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        createdAt: new Date(user.metadata.creationTime).toLocaleDateString('pt-BR'),
        stats: firestoreData ? {
          questions: {
            totalAnswered: questions.totalAnswered || 0,
            totalCorrect: questions.totalCorrect || 0,
          },
          flashcards: {
            totalReviewed: flashcards.totalReviewed || 0,
            totalCorrect: flashcards.totalCorrect || 0,
          },
          simulatedExams: (performance.simulatedExams || []).map((exam: any) => ({
             name: exam.name || 'Simulado sem nome',
             score: exam.score || 0,
             date: exam.date ? new Date(exam.date).toLocaleDateString('pt-BR') : 'N/A'
          })),
        } : null
      };
    });
    
    return enrichedUsers;

  } catch (error: any) {
    console.error('Error fetching all users data:', error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/app-deleted' || error.message.includes('Credential implementation provided to initializeApp() via the "credential" property failed to fetch a valid Google OAuth2 access token')) {
       throw new Error('ADMIN_CREDENTIALS_ERROR');
    }
    throw new Error('Failed to retrieve comprehensive user list.');
  }
}
