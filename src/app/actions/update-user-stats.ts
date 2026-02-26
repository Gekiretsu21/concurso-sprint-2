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
        console.warn("updateDailyStreak chamado sem userId");
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
        
        // Proteção contra erro de conversão de data
        let lastLoginDate = new Date(0);
        try {
            if (lastLoginTimestamp && typeof lastLoginTimestamp.toDate === 'function') {
                lastLoginDate = lastLoginTimestamp.toDate();
            } else if (lastLoginTimestamp) {
                lastLoginDate = new Date(lastLoginTimestamp as any);
            }
        } catch (e) {
            console.error("Erro ao converter lastLoginDate:", e);
        }

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
        console.error(`Falha ao atualizar daily streak para o usuário ${userId}:`, error);
        return { dailyStreak: 0 };
    }
}

export async function updateUserStudyTime(userId: string, seconds: number): Promise<void> {
  if (!userId || seconds <= 0) return;

  try {
    const userRef = adminFirestore.collection('users').doc(userId);
    await userRef.set({
        stats: {
            totalStudyTime: FieldValue.increment(seconds)
        }
    }, { merge: true });
  } catch (error) {
    console.error(`Falha ao atualizar tempo de estudo para o usuário ${userId}:`, error);
  }
}

/**
 * Busca a posição do usuário no ranking global (Server Side)
 */
export async function getUserGlobalRank(totalAnswered: number): Promise<{ position: number; totalStudents: number }> {
    try {
        const usersRef = adminFirestore.collection('users');
        
        // Conta usuários com mais questões resolvidas
        const moreQuestionsCount = await usersRef
            .where('stats.performance.questions.totalAnswered', '>', totalAnswered)
            .count()
            .get();
            
        // Conta o total de alunos na base
        const totalCount = await usersRef.count().get();

        return {
            position: moreQuestionsCount.data().count + 1,
            totalStudents: totalCount.data().count
        };
    } catch (error) {
        console.error("Erro ao buscar ranking global:", error);
        // Retorna valores padrão em vez de lançar erro para a UI
        return { position: 1, totalStudents: 1 };
    }
}
