
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

// --- EXISTING ACTIONS ---

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

export async function createFeedPost(firestore: Firestore, postData: Omit<FeedPost, 'id' | 'createdAt'>): Promise<void> {
    const postCollectionRef = collection(firestore, 'feed_posts');
    const dataToSave = { ...postData, createdAt: serverTimestamp() };
    await addDoc(postCollectionRef, dataToSave);
}

export async function deleteFeedPost(firestore: Firestore, postId: string): Promise<void> {
    const postRef = doc(firestore, 'feed_posts', postId);
    await deleteDoc(postRef);
}

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

export async function createSimulatedExam(firestore: Firestore, userId: string, dto: any): Promise<string> {
  let allIds: string[] = [];
  const ref = doc(collection(firestore, 'communitySimulados'));
  await setDoc(ref, { id: ref.id, name: dto.name, userId, createdAt: serverTimestamp(), questionIds: [], questionCount: 0, accessTier: dto.accessTier });
  return ref.id;
}

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

export async function savePreviousExamResult(firestore: Firestore, p: any) {
  await setDoc(doc(firestore, `users/${p.userId}/previousExamResults/${p.examId}`), { ...p, completedAt: serverTimestamp() }, { merge: true });
}

export async function addQuestionComment(f: Firestore, u: User, qid: string, t: string) {
  await addDoc(collection(f, 'questoes', qid, 'comments'), { userId: u.uid, userName: u.displayName, text: t, createdAt: serverTimestamp() });
}

export async function updateQuestion(f: Firestore, id: string, d: any) { await updateDoc(doc(f, 'questoes', id), d); }
export async function updateFlashcard(f: Firestore, id: string, d: any) { await updateDoc(doc(f, 'flashcards', id), d); }
