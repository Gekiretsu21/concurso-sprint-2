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
  documentId,
  and,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { FeedPost } from '@/types';

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
) {
  const questionsStr = text.trim().split('\n');
  const batch = writeBatch(firestore);
  const newQuestionIds: string[] = [];

  for (const qStr of questionsStr) {
    const parts = qStr.split('|');
    if (parts.length < 11) continue;

    const Materia = parts[0]?.trim();
    const Ano = parts[1]?.trim();
    const Assunto = parts[2]?.trim();
    const Cargo = parts[3]?.trim();
    const Enunciado = parts[4]?.trim();
    const a = parts[5]?.trim();
    const b = parts[6]?.trim();
    const c = parts[7]?.trim();
    const d = parts[8]?.trim();
    const e = parts[9]?.trim();
    const correctAnswer = parts[10]?.trim();

    // Banca logic: 12th column for standard, 29th for Academy
    let Banca = '';
    if (parts.length === 12) {
      Banca = parts[11]?.trim() || '';
    } else if (parts.length >= 29) {
      Banca = parts[28]?.trim() || '';
    }

    const context_title = parts[11]?.trim() || null;
    const context_text = parts[12]?.trim() || null;
    const isGodMode = Boolean(context_text && context_text !== '');

    const newQuestionDocRef = doc(collection(firestore, 'questoes'));

    const dataToSave: any = {
      Materia, Ano, Assunto, Cargo, Banca, Enunciado, a, b, c, d, e, correctAnswer,
      status: 'active',
      accessTier: accessTier,
      is_god_mode: isGodMode
    };

    if (isGodMode) {
      dataToSave.god_mode_context_title = context_title;
      dataToSave.god_mode_context_text = context_text;
      dataToSave.god_mode_analysis_title = parts[13]?.trim() || null;
      dataToSave.god_mode_status_a = parts[14]?.trim() || null;
      dataToSave.god_mode_justification_a = parts[15]?.trim() || null;
      dataToSave.god_mode_status_b = parts[16]?.trim() || null;
      dataToSave.god_mode_justification_b = parts[17]?.trim() || null;
      dataToSave.god_mode_status_c = parts[18]?.trim() || null;
      dataToSave.god_mode_justification_c = parts[19]?.trim() || null;
      dataToSave.god_mode_status_d = parts[20]?.trim() || null;
      dataToSave.god_mode_justification_d = parts[21]?.trim() || null;
      dataToSave.god_mode_status_e = parts[22]?.trim() || null;
      dataToSave.god_mode_justification_e = parts[23]?.trim() || null;
      dataToSave.god_mode_concept_title = parts[24]?.trim() || null;
      dataToSave.god_mode_concept_text = parts[25]?.trim() || null;
      dataToSave.god_mode_summary_title = parts[26]?.trim() || null;
      dataToSave.god_mode_summary_text = parts[27]?.trim() || null;
    }

    batch.set(newQuestionDocRef, dataToSave);
    newQuestionIds.push(newQuestionDocRef.id);
  }
  if (examDetails?.isPreviousExam) {
    batch.set(doc(collection(firestore, 'previousExams')), {
      name: examDetails.examName, questionIds: newQuestionIds, questionCount: newQuestionIds.length, accessTier, createdAt: serverTimestamp()
    });
  }
  await batch.commit();
}

export async function importFlashcards(firestore: Firestore, text: string, accessTier: 'standard' | 'plus') {
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

export async function handleFlashcardResponse(firestore: Firestore, userId: string, flashcard: any, result: 'correct' | 'incorrect') {
  const progressRef = doc(firestore, `users/${userId}/flashcard_progress/${flashcard.id}`);
  const userRef = doc(firestore, 'users', userId);
  const isCorrect = result === 'correct';
  const subject = flashcard.subject || 'Geral';

  const batch = writeBatch(firestore);

  batch.set(progressRef, {
    userId,
    flashcardId: flashcard.id,
    lastResult: result,
    lastReviewedAt: serverTimestamp(),
    subject: subject
  }, { merge: true });

  batch.update(userRef, {
    'stats.performance.flashcards.totalReviewed': increment(1),
    'stats.performance.flashcards.totalCorrect': increment(isCorrect ? 1 : 0),
    [`stats.performance.flashcards.bySubject.${subject}.reviewed`]: increment(1),
    [`stats.performance.flashcards.bySubject.${subject}.correct`]: increment(isCorrect ? 1 : 0),
    'stats.lastActivityAt': serverTimestamp(),
  });

  return batch.commit();
}

// --- MAINTENANCE ACTIONS ---

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
  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const key = `${data.Enunciado}_${data.Materia}_${data.Ano}`;
    if (seen.has(key)) {
      batch.delete(docSnap.ref);
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
  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const key = `${data.front}_${data.subject}`;
    if (seen.has(key)) {
      batch.delete(docSnap.ref);
      count++;
    } else {
      seen.add(key);
    }
  });
  await batch.commit();
  return count;
}

export async function resetUserProgress(firestore: Firestore, userId: string) {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    stats: {
      dailyStreak: 0,
      totalStudyTime: 0,
      level: 1,
      performance: {
        questions: { totalAnswered: 0, totalCorrect: 0, bySubject: {} },
        flashcards: { totalReviewed: 0, totalCorrect: 0, bySubject: {} }
      }
    }
  });
  const attemptsSnap = await getDocs(collection(firestore, `users/${userId}/question_attempts`));
  const flashSnap = await getDocs(collection(firestore, `users/${userId}/flashcard_progress`));
  const deleteBatch = writeBatch(firestore);
  attemptsSnap.docs.forEach(d => deleteBatch.delete(d.ref));
  flashSnap.docs.forEach(d => deleteBatch.delete(d.ref));
  if (attemptsSnap.size > 0 || flashSnap.size > 0) await deleteBatch.commit();
}

export async function resetAllUsersProgress(firestore: Firestore) {
  const usersSnap = await getDocs(collection(firestore, 'users'));
  for (const userDoc of usersSnap.docs) {
    await resetUserProgress(firestore, userDoc.id);
  }
}

// --- ADMIN / UTILS ---

export async function updateUserPlan(firestore: Firestore, userId: string, plan: string) {
  const userRef = doc(firestore, 'users', userId);
  return updateDoc(userRef, { 'subscription.plan': plan, 'subscription.status': 'active', 'subscription.updatedAt': serverTimestamp() });
}

export async function seedUsers(firestore: Firestore) {
  const batch = writeBatch(firestore);
  for (let i = 0; i < 50; i++) {
    const userRef = doc(collection(firestore, 'users'));
    batch.set(userRef, { id: userRef.id, name: `Aluno ${i}`, email: `aluno${i}@test.com`, isFake: true, stats: { dailyStreak: 5, performance: { questions: { totalAnswered: 100, totalCorrect: 80 } } } });
  }
  return batch.commit();
}

export async function deleteFakeUsers(firestore: Firestore) {
  const q = query(collection(firestore, 'users'), where('isFake', '==', true));
  const snap = await getDocs(q);
  const b = writeBatch(firestore);
  snap.docs.forEach(d => b.delete(d.ref));
  return b.commit();
}

export async function createSimulatedExam(firestore: Firestore, userId: string, dto: any): Promise<string> {
  const ref = doc(collection(firestore, 'communitySimulados'));
  await setDoc(ref, { id: ref.id, name: dto.name, userId, createdAt: serverTimestamp(), questionIds: [], questionCount: 0, accessTier: dto.accessTier });
  return ref.id;
}

export async function savePreviousExamResult(firestore: Firestore, p: any) {
  await setDoc(doc(firestore, `users/${p.userId}/previousExamResults/${p.examId}`), { ...p, completedAt: serverTimestamp() }, { merge: true });
}

export async function addQuestionComment(f: Firestore, u: User, qid: string, t: string) {
  await addDoc(collection(f, 'questoes', qid, 'comments'), { userId: u.uid, userName: u.displayName || 'Anônimo', text: t, createdAt: serverTimestamp() });
}

export async function updateQuestion(f: Firestore, id: string, d: any) { await updateDoc(doc(f, 'questoes', id), d); }
export async function updateFlashcard(f: Firestore, id: string, d: any) { await updateDoc(doc(f, 'flashcards', id), d); }
