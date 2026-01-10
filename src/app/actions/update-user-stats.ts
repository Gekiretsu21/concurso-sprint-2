'use server';

import { adminFirestore } from '@/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isYesterday(lastDate: Date, today: Date): boolean {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return isSameDay(lastDate, yesterday);
}


export async function updateDailyStreak(userId: string): Promise<{ dailyStreak: number }> {
    if (!userId) {
        console.warn("updateDailyStreak called without userId");
        return { dailyStreak: 0 };
    }

    const userRef = adminFirestore.collection('users').doc(userId);
    const today = new Date();
    
    try {
        const doc = await userRef.get();
        if (!doc.exists) {
             await userRef.set({
                stats: {
                    dailyStreak: 1,
                    lastLoginDate: today
                }
            }, { merge: true });
            return { dailyStreak: 1 };
        }

        const userData = doc.data();
        const lastLoginTimestamp = userData?.stats?.lastLoginDate as Timestamp | undefined;
        const lastLoginDate = lastLoginTimestamp ? lastLoginTimestamp.toDate() : new Date(0);

        let newStreak = userData?.stats?.dailyStreak || 0;

        if (!isSameDay(lastLoginDate, today)) {
            if (isYesterday(lastLoginDate, today)) {
                newStreak++;
            } else {
                newStreak = 1;
            }
            
            await userRef.set({
                stats: {
                    dailyStreak: newStreak,
                    lastLoginDate: today
                }
            }, { merge: true });
        }
        
        return { dailyStreak: newStreak };

    } catch (error) {
        console.error(`Failed to update daily streak for user ${userId}:`, error);
        try {
            await userRef.set({
                stats: {
                    dailyStreak: 1,
                    lastLoginDate: today
                }
            }, { merge: true });
            return { dailyStreak: 1 };
        } catch (initError) {
            console.error(`Failed to initialize stats for user ${userId}:`, initError);
            return { dailyStreak: 0 };
        }
    }
}

export async function updateUserStudyTime(userId: string, seconds: number): Promise<void> {
  if (!userId || seconds <= 0) {
    console.warn(`updateUserStudyTime called with invalid arguments: userId=${userId}, seconds=${seconds}`);
    return;
  }

  const userRef = adminFirestore.collection('users').doc(userId);
  const updatePayload = {
    'stats.totalStudyTime': FieldValue.increment(seconds)
  };

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        // If the user document doesn't exist, create it with the initial study time.
        await userRef.set({
            stats: {
                totalStudyTime: seconds
            }
        }, { merge: true });
    } else {
        // Otherwise, update the existing document.
        await userRef.update(updatePayload);
    }
  } catch (error) {
    console.error(`Failed to update study time for user ${userId}:`, error);
    // You might want to add more specific error handling or re-throwing logic here.
  }
}
