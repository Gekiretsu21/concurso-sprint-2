'use server';

import { adminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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
        const userData = doc.data();

        // Get last login date from stats, or use a very old date if not present
        const lastLoginTimestamp = userData?.stats?.lastLoginDate;
        const lastLoginDate = lastLoginTimestamp ? lastLoginTimestamp.toDate() : new Date(0);

        let newStreak = userData?.stats?.dailyStreak || 0;

        if (!isSameDay(lastLoginDate, today)) {
            if (isYesterday(lastLoginDate, today)) {
                // Logged in yesterday, increment streak
                newStreak++;
            } else {
                // Missed a day, reset streak to 1
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
        // If an error occurs, try to set initial values
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
            return { dailyStreak: 0 }; // Return 0 on failure
        }
    }
}
