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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  // 1. Total de Usuários
  const usersSnapshot = await adminFirestore.collection('users').get();
  const newUsersTodaySnapshot = await adminFirestore
    .collection('users')
    // Assuming a 'createdAt' field is added on user creation
    .where('createdAt', '>=', todayTimestamp)
    .get();

  // 2. Engajamento (Questões respondidas)
  // This is a more complex query. For this example, we'll query all attempts in the last 24h.
  // In a real-world scenario, this would be an aggregated value updated by a Cloud Function.
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const twentyFourHoursAgoTimestamp = Timestamp.fromDate(twentyFourHoursAgo);

  const allAttemptsSnapshots = await adminFirestore.collectionGroup('question_attempts')
      .where('timestamp', '>=', twentyFourHoursAgoTimestamp)
      .get();
  
  const questionsAnswered24h = allAttemptsSnapshots.size;


  return {
    totalUsers: {
      count: usersSnapshot.size,
      newToday: newUsersTodaySnapshot.size,
    },
    engagement: {
      questionsAnswered24h: questionsAnswered24h,
    },
  };
}

// To properly count new users, you would need to add a 'createdAt' timestamp
// to the user creation logic in `src/firebase/auth/use-user.tsx`.
// For example:
/*
if (user && firestore) {
  const userRef = doc(firestore, 'users', user.uid);
  const userData = {
    id: user.uid,
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
  
  // Check if doc exists to add createdAt only once
  getDoc(userRef).then(docSnap => {
    if (!docSnap.exists()) {
      setDoc(userRef, { ...userData, createdAt: serverTimestamp() }, { merge: true });
    } else {
      setDoc(userRef, userData, { merge: true });
    }
  });
}
*/
