'use client';

import {
  addDoc,
  collection,
  Firestore,
  writeBatch,
  query,
  where,
  getDocs,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
  deleteDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { FeedPost } from '@/types';
import { calculateLevel } from '@/lib/gamification';

// --- STUDY PLAN ACTIONS ---

export async function addStudyTask(
  firestore: Firestore,
  userId: string,
  task: { title: string; subject: string; date: Date }
) {
  const tasksRef = collection(firestore, `users/${userId}/study_tasks`);
  return addDoc(tasksRef, {
    ...task,
    isCompleted: false,
    createdAt: serverTimestamp(),
  });
}

export async function toggleStudyTask(
  firestore: Firestore,
  userId: string,
  taskId: string,
  isCompleted: boolean
) {
  const taskRef = doc(firestore, `users/${userId}/study_tasks`, taskId);
  return updateDoc(taskRef, { isCompleted });
}

export async function deleteStudyTask(
  firestore: Firestore,
  userId: string,
  taskId: string
) {
  const taskRef = doc(firestore, `users/${userId}/study_tasks`, taskId);
  return deleteDoc(taskRef);
}

// --- PERFORMANCE ACTIONS ---

export async function saveQuestionAttempt(
  firestore: Firestore,
  userId: string,
  questionId: string,
  isCorrect: boolean,
  selectedOption: string,
  subject: string
) {
  const attemptRef = doc(firestore, `users/${userId}/question_attempts/${questionId}`);
  const userRef = doc(firestore, 'users', userId);
  const correctIncrement = isCorrect ? 1 : 0;

  const batch = writeBatch(firestore);
  batch.set(attemptRef, {
    questionId,
    isCorrect,
    selectedOption,
    subject,
    timestamp: serverTimestamp(),
  });

  batch.update(userRef, {
    'stats.performance.questions.totalAnswered': increment(1),
    'stats.performance.questions.totalCorrect': increment(correctIncrement),
    [`stats.performance.questions.bySubject.${subject}.answered`]: increment(1),
    [`stats.performance.questions.bySubject.${subject}.correct`]: increment(correctIncrement),
    'stats.lastActivityAt': serverTimestamp(),
  });

  return batch.commit();
}

export async function registerQuestionAnswer(
  firestore: Firestore,
  userId: string,
  subject: string,
  isCorrect: boolean
) {
  const userRef = doc(firestore, 'users', userId);
  const correctIncrement = isCorrect ? 1 : 0;
  await updateDoc(userRef, {
    'stats.performance.questions.totalAnswered': increment(1),
    'stats.performance.questions.totalCorrect': increment(correctIncrement),
    [`stats.performance.questions.bySubject.${subject}.answered`]: increment(1),
    [`stats.performance.questions.bySubject.${subject}.correct`]: increment(correctIncrement),
    'stats.lastActivityAt': serverTimestamp(),
  });
}

export async function batchUpdateQuestions(
  firestore: Firestore,
  userId: string,
  totalDone: number,
  totalCorrect: number,
  subject: string
) {
  if (totalDone > 200) {
    const banUntil = new Date(Date.now() + 10 * 60 * 1000);
    await updateDoc(doc(firestore, 'users', userId), {
      'stats.bannedFromAddingUntil': Timestamp.fromDate(banUntil)
    });
    throw new Error('Volume incomum detectado. Ban temporário aplicado.');
  }

  const userRef = doc(firestore, 'users', userId);
  const batch = writeBatch(firestore);

  batch.update(userRef, {
    'stats.performance.questions.totalAnswered': increment(totalDone),
    'stats.performance.questions.totalCorrect': increment(totalCorrect),
    [`stats.performance.questions.bySubject.${subject}.answered`]: increment(totalDone),
    [`stats.performance.questions.bySubject.${subject}.correct`]: increment(totalCorrect),
    'stats.lastActivityAt': serverTimestamp(),
  });

  const batchId = `manual_entry_${Date.now()}`;
  const attemptRef = doc(firestore, `users/${userId}/question_attempts/${batchId}`);
  batch.set(attemptRef, {
    questionId: batchId,
    isCorrect: totalCorrect >= (totalDone / 2),
    selectedOption: 'manual_entry',
    subject: subject,
    timestamp: serverTimestamp(),
    isBatch: true,
    batchTotal: totalDone,
    batchCorrect: totalCorrect
  });

  await batch.commit();
}

// --- FEED ACTIONS ---

export async function createFeedPost(firestore: Firestore, postData: Omit<FeedPost, 'id' | 'createdAt'>): Promise<void> {
    const postCollectionRef = collection(firestore, 'feed_posts');
    const dataToSave = { ...postData, createdAt: serverTimestamp() };
    await addDoc(postCollectionRef, dataToSave);
}

export async function deleteFeedPost(firestore: Firestore, postId: string): Promise<void> {
    const postRef = doc(firestore, 'feed_posts', postId);
    await deleteDoc(postRef);
}

// --- IMPORT ACTIONS ---

export async function importQuestions(
  firestore: Firestore,
  text: string,
  userId: string,
  accessTier: 'standard' | 'plus',
  examDetails?: any,
): Promise<void> {
  const questionsStr = text.trim().split('\n');
  const batch = writeBatch(firestore);
  const newQuestionIds: string[] = [];

  for (const qStr of questionsStr) {
    const parts = qStr.split('|');
    if (parts.length < 11) continue;
    const [Materia, Ano, Assunto, Cargo, Enunciado, a, b, c, d, e, correctAnswer] = parts;
    const newQuestionDocRef = doc(collection(firestore, 'questoes'));
    batch.set(newQuestionDocRef, {
      Materia: Materia.trim(), Ano: Ano.trim(), Assunto: Assunto.trim(), Cargo: Cargo.trim(),
      Enunciado: Enunciado.trim(), a: a.trim(), b: b.trim(), c: c.trim(), d: d.trim(), e: e.trim(),
      correctAnswer: correctAnswer.trim(), status: 'active', accessTier: accessTier,
    });
    newQuestionIds.push(newQuestionDocRef.id);
  }
  if (examDetails?.isPreviousExam) {
      batch.set(doc(collection(firestore, 'previousExams')), {
        name: examDetails.examName, questionIds: newQuestionIds, questionCount: newQuestionIds.length, accessTier
      });
  }
  await batch.commit();
}

export async function importFlashcards(firestore: Firestore, text: string, accessTier: 'standard' | 'plus'): Promise<any> {
  const lines = text.trim().split('\n');
  const batch = writeBatch(firestore);
  lines.forEach(line => {
    const parts = line.split('|');
    if (parts.length === 5) {
      const [subject, topic, targetRole, front, back] = parts.map(p => p.trim());
      batch.set(doc(collection(firestore, 'flashcards')), {
        subject, topic, targetRole, front, back, accessTier, createdAt: serverTimestamp()
      });
    }
  });
  return batch.commit();
}

export async function handleFlashcardResponse(firestore: Firestore, userId: string, flashcard: any, result: 'correct' | 'incorrect'): Promise<void> {
  const progressRef = doc(firestore, `users/${userId}/flashcard_progress/${flashcard.id}`);
  await setDoc(progressRef, { userId, flashcardId: flashcard.id, lastResult: result, lastReviewedAt: serverTimestamp(), subject: flashcard.subject }, { merge: true });
}

// --- SIMULADO ACTIONS ---

export async function createSimulatedExam(firestore: Firestore, userId: string, dto: any): Promise<string> {
  const ref = doc(collection(firestore, 'communitySimulados'));
  await setDoc(ref, { id: ref.id, name: dto.name, userId, createdAt: serverTimestamp(), questionIds: [], questionCount: 0, accessTier: dto.accessTier });
  return ref.id;
}

// --- DELETE / MAINTENANCE ACTIONS ---

export async function deleteQuestionsByIds(firestore: Firestore, ids: string[]) {
  const b = writeBatch(firestore);
  ids.forEach(id => b.delete(doc(firestore, 'questoes', id)));
  return b.commit();
}

export async function deletePreviousExams(firestore: Firestore, uid: string, ids: string[]) {
  const b = writeBatch(firestore);
  ids.forEach(id => b.delete(doc(firestore, 'previousExams', id)));
  return b.commit();
}

export async function deleteCommunitySimulados(firestore: Firestore, ids: string[]) {
  const b = writeBatch(firestore);
  ids.forEach(id => b.delete(doc(firestore, 'communitySimulados', id)));
  return b.commit();
}

export async function deleteFlashcardsByIds(firestore: Firestore, ids: string[]) {
  const b = writeBatch(firestore);
  ids.forEach(id => b.delete(doc(firestore, 'flashcards', id)));
  return b.commit();
}

export async function deleteAllFlashcards(firestore: Firestore) {
  const q = query(collection(firestore, 'flashcards'));
  const snap = await getDocs(q);
  const batch = writeBatch(firestore);
  snap.docs.forEach(d => batch.delete(d.ref));
  return batch.commit();
}

export async function deleteDuplicateQuestions(firestore: Firestore) {
  const q = query(collection(firestore, 'questoes'));
  const snap = await getDocs(q);
  const seen = new Set();
  const batch = writeBatch(firestore);
  let count = 0;
  snap.docs.forEach(doc => {
    const data = doc.data();
    const key = `${data.Enunciado}_${data.Materia}_${data.Ano}`;
    if (seen.has(key)) {
      batch.delete(doc.ref);
      count++;
    } else {
      seen.add(key);
    }
  });
  await batch.commit();
  return count;
}

export async function deleteDuplicateFlashcards(firestore: Firestore) {
  const q = query(collection(firestore, 'flashcards'));
  const snap = await getDocs(q);
  const seen = new Set();
  const batch = writeBatch(firestore);
  let count = 0;
  snap.docs.forEach(doc => {
    const data = doc.data();
    const key = `${data.front}_${data.subject}`;
    if (seen.has(key)) {
      batch.delete(doc.ref);
      count++;
    } else {
      seen.add(key);
    }
  });
  await batch.commit();
  return count;
}

// --- USER / ADMIN ACTIONS ---

export async function updateUserPlan(firestore: Firestore, userId: string, plan: 'standard' | 'plus') {
  const userRef = doc(firestore, 'users', userId);
  return updateDoc(userRef, {
    'subscription.plan': plan,
    'subscription.status': 'active',
    'subscription.updatedAt': serverTimestamp()
  });
}

export async function seedUsers(firestore: Firestore) {
  const names = ["João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa", "Lucas Pereira", "Beatriz Lima", "Guilherme Souza", "Camila Rocha", "Rafael Ferreira", "Juliana Meireles"];
  const batchSize = 50;
  
  for (let i = 0; i < 101; i += batchSize) {
    const batch = writeBatch(firestore);
    const limit = Math.min(i + batchSize, 101);
    for (let j = i; j < limit; j++) {
      const userRef = doc(collection(firestore, 'users'));
      const totalAnswered = Math.floor(Math.random() * 500) + 50;
      const totalCorrect = Math.floor(totalAnswered * (0.5 + Math.random() * 0.4));
      batch.set(userRef, {
        id: userRef.id,
        name: names[j % names.length] + " " + (j + 1),
        email: `aluno${j}@mentoria.com`,
        subscription: { plan: j % 5 === 0 ? 'plus' : 'standard', status: 'active' },
        stats: {
          performance: {
            questions: {
              totalAnswered,
              totalCorrect,
              bySubject: {
                "Português": { answered: Math.floor(totalAnswered/2), correct: Math.floor(totalCorrect/2) }
              }
            }
          },
          dailyStreak: Math.floor(Math.random() * 20),
          totalStudyTime: Math.floor(Math.random() * 50000)
        },
        createdAt: serverTimestamp(),
        isFake: true
      });
    }
    await batch.commit();
  }
}

export async function deleteFakeUsers(firestore: Firestore) {
  const q = query(collection(firestore, 'users'), where('isFake', '==', true));
  const snap = await getDocs(q);
  const batch = writeBatch(firestore);
  snap.docs.forEach(d => batch.delete(d.ref));
  return batch.commit();
}

export async function resetUserProgress(firestore: Firestore, userId: string) {
  const userRef = doc(firestore, 'users', userId);
  
  await updateDoc(userRef, {
    stats: {
      dailyStreak: 0,
      totalStudyTime: 0,
      level: 1,
      performance: {
        questions: {
          totalAnswered: 0,
          totalCorrect: 0,
          bySubject: {}
        },
        flashcards: {
          totalReviewed: 0,
          totalCorrect: 0,
          bySubject: {}
        }
      }
    }
  });

  const attemptsSnap = await getDocs(collection(firestore, `users/${userId}/question_attempts`));
  const flashSnap = await getDocs(collection(firestore, `users/${userId}/flashcard_progress`));

  const deleteBatch = writeBatch(firestore);
  attemptsSnap.docs.forEach(d => deleteBatch.delete(d.ref));
  flashSnap.docs.forEach(d => deleteBatch.delete(d.ref));
  
  if (attemptsSnap.size > 0 || flashSnap.size > 0) {
      await deleteBatch.commit();
  }
}

export async function resetAllUsersProgress(firestore: Firestore) {
  const usersSnap = await getDocs(collection(firestore, 'users'));
  for (const userDoc of usersSnap.docs) {
    await resetUserProgress(firestore, userDoc.id);
  }
}

export async function savePreviousExamResult(firestore: Firestore, p: any) {
  await setDoc(doc(firestore, `users/${p.userId}/previousExamResults/${p.examId}`), { ...p, completedAt: serverTimestamp() }, { merge: true });
}

export async function addQuestionComment(f: Firestore, u: User, qid: string, t: string) {
  await addDoc(collection(f, 'questoes', qid, 'comments'), { userId: u.uid, userName: u.displayName || 'Anônimo', text: t, createdAt: serverTimestamp() });
}

export async function updateQuestion(f: Firestore, id: string, d: any) { await updateDoc(doc(f, 'questoes', id), d); }
export async function updateFlashcard(f: Firestore, id: string, d: any) { await updateDoc(doc(f, 'flashcards', id), d); }
