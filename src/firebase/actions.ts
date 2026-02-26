'use client';

import {
  addDoc,
  collection,
  Firestore,
  writeBatch,
  query,
  where,
  getDocs,
  limit,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
  deleteDoc,
  WriteBatch,
  documentId,
  and,
  getDoc,
  increment,
  arrayUnion,
  FieldValue,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { FeedPost } from '@/types';

/**
 * Registra uma resposta e atualiza as estatísticas de desempenho e gamificação.
 */
export async function registerQuestionAnswer(
  firestore: Firestore,
  userId: string,
  subject: string,
  isCorrect: boolean
) {
  const userRef = doc(firestore, 'users', userId);
  const correctIncrement = isCorrect ? 1 : 0;

  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Payload básico de incremento
  const updatePayload: Record<string, any> = {
    'stats.performance.questions.totalAnswered': increment(1),
    'stats.performance.questions.totalCorrect': increment(correctIncrement),
    // Gamificação simplificada no mesmo objeto
    'stats.performance.questions.weeklyQuestionsDone': increment(1),
    'stats.performance.questions.weeklyCorrectAnswers': increment(correctIncrement),
    'stats.performance.questions.monthlyQuestionsDone': increment(1),
    'stats.performance.questions.monthlyCorrectAnswers': increment(correctIncrement),
    [`stats.performance.questions.bySubject.${subject}.answered`]: increment(1),
    [`stats.performance.questions.bySubject.${subject}.correct`]: increment(correctIncrement),
    'stats.lastActivityAt': serverTimestamp(),
  };

  try {
    const userDoc = await getDoc(userRef);
    const data = userDoc.data();
    
    // Lógica de Reset (Semana/Mês)
    if (data?.stats?.lastResetCheck) {
      const lastReset = (data.stats.lastResetCheck as Timestamp).toDate();
      
      // Se mudou o mês
      if (lastReset.getMonth() !== now.getMonth()) {
        updatePayload['stats.performance.questions.monthlyQuestionsDone'] = 1;
        updatePayload['stats.performance.questions.monthlyCorrectAnswers'] = correctIncrement;
      }
      
      // Se mudou a semana (Domingo como início)
      const lastWeek = Math.floor(lastReset.getTime() / (7 * 24 * 60 * 60 * 1000));
      const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      if (lastWeek !== currentWeek) {
        updatePayload['stats.performance.questions.weeklyQuestionsDone'] = 1;
        updatePayload['stats.performance.questions.weeklyCorrectAnswers'] = correctIncrement;
      }
    }
    
    updatePayload['stats.lastResetCheck'] = serverTimestamp();

    await updateDoc(userRef, updatePayload);
  } catch (error: any) {
    if (error.code === 'not-found' || error.code === 'invalid-argument') {
      const initialStats = {
        stats: {
          performance: {
            questions: {
              totalAnswered: 1,
              totalCorrect: correctIncrement,
              weeklyQuestionsDone: 1,
              weeklyCorrectAnswers: correctIncrement,
              monthlyQuestionsDone: 1,
              monthlyCorrectAnswers: correctIncrement,
              bySubject: { [subject]: { answered: 1, correct: correctIncrement } },
            },
          },
          lastResetCheck: serverTimestamp(),
        },
      };
      await setDoc(userRef, initialStats, { merge: true });
    } else {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updatePayload,
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }
}

/**
 * Atualiza estatísticas em massa (Inserção Manual)
 */
export async function batchUpdateQuestions(
  firestore: Firestore,
  userId: string,
  totalDone: number,
  totalCorrect: number
) {
  const userRef = doc(firestore, 'users', userId);
  
  const updatePayload = {
    'stats.performance.questions.totalAnswered': increment(totalDone),
    'stats.performance.questions.totalCorrect': increment(totalCorrect),
    'stats.performance.questions.weeklyQuestionsDone': increment(totalDone),
    'stats.performance.questions.weeklyCorrectAnswers': increment(totalCorrect),
    'stats.performance.questions.monthlyQuestionsDone': increment(totalDone),
    'stats.performance.questions.monthlyCorrectAnswers': increment(totalCorrect),
    'stats.lastActivityAt': serverTimestamp(),
    'stats.lastResetCheck': serverTimestamp(),
  };

  await updateDoc(userRef, updatePayload).catch(async (e) => {
    // Se falhar por não existir, cria o básico
    await setDoc(userRef, {
      stats: {
        performance: {
          questions: {
            totalAnswered: totalDone,
            totalCorrect: totalCorrect,
            weeklyQuestionsDone: totalDone,
            weeklyCorrectAnswers: totalCorrect,
            monthlyQuestionsDone: totalDone,
            monthlyCorrectAnswers: totalCorrect,
          }
        }
      }
    }, { merge: true });
  });
}

// --- Funções Auxiliares Existentes (Mantidas para compatibilidade) ---

export async function deleteFeedPost(firestore: Firestore, postId: string): Promise<void> {
    if (!postId) throw new Error('Post ID is required.');
    const postRef = doc(firestore, 'feed_posts', postId);
    deleteDoc(postRef).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: postRef.path, operation: 'delete' }));
    });
}

export async function createFeedPost(firestore: Firestore, postData: Omit<FeedPost, 'id' | 'createdAt'>): Promise<void> {
    const postCollectionRef = collection(firestore, 'feed_posts');
    const dataToSave = { ...postData, createdAt: serverTimestamp() };
    addDoc(postCollectionRef, dataToSave).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: postCollectionRef.path, operation: 'create', requestResourceData: dataToSave }));
    });
}

export async function updateUserPlan(firestore: Firestore, userId: string, newPlan: 'standard' | 'plus'): Promise<void> {
    if (!userId) throw new Error('User ID is required.');
    const userRef = doc(firestore, 'users', userId);
    const subscriptionData = { plan: newPlan, status: 'active', updatedAt: serverTimestamp() };
    updateDoc(userRef, { subscription: subscriptionData }).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: { subscription: subscriptionData } }));
    });
}

export async function saveQuestionAttempt(
  firestore: Firestore,
  userId: string,
  questionId: string,
  isCorrect: boolean,
  selectedOption: string,
  subject: string | string[]
) {
  if (!userId || !questionId) return;
  const subjectToSave = Array.isArray(subject) ? subject[0] : subject;
  if (!subjectToSave) return;

  const attemptRef = doc(firestore, `users/${userId}/question_attempts/${questionId}`);
  const attemptData = { questionId, isCorrect, selectedOption, subject: subjectToSave, timestamp: serverTimestamp() };

  setDoc(attemptRef, attemptData, { merge: true }).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: attemptRef.path, operation: 'write', requestResourceData: attemptData }));
  });

  await registerQuestionAnswer(firestore, userId, subjectToSave, isCorrect);
}

export async function importQuestions(
  firestore: Firestore,
  text: string,
  userId: string,
  accessTier: 'standard' | 'plus',
  examDetails?: any,
): Promise<void> {
  if (!text) throw new Error('O texto não pode estar vazio.');
  const questionsStr = text.trim().split('\n');
  const questionsCollection = collection(firestore, 'questoes');
  const batch = writeBatch(firestore);
  const newQuestionIds: string[] = [];

  for (const qStr of questionsStr) {
    if (qStr.trim() === '') continue;
    const parts = qStr.split('|');
    if (parts.length < 11) continue;
    const [Materia, Ano, Assunto, Cargo, Enunciado, a, b, c, d, e, correctAnswer] = parts;
    const newQuestionDocRef = doc(questionsCollection);
    const newQuestion: any = {
      Materia: Materia.trim(), Ano: Ano.trim(), Assunto: Assunto.trim(), Cargo: Cargo.trim(),
      Enunciado: Enunciado.trim(), a: a.trim(), b: b.trim(), c: c.trim(), d: d.trim(), e: e.trim(),
      correctAnswer: correctAnswer.trim(), status: 'active', accessTier: accessTier,
    };
    if (examDetails?.isPreviousExam) newQuestion.Prova = examDetails.examName.trim();
    batch.set(newQuestionDocRef, newQuestion);
    newQuestionIds.push(newQuestionDocRef.id);
  }
  if (examDetails?.isPreviousExam && newQuestionIds.length > 0) {
      batch.set(doc(collection(firestore, 'previousExams')), {
        name: examDetails.examName, importerId: userId, createdAt: serverTimestamp(),
        questionIds: newQuestionIds, questionCount: newQuestionIds.length, accessTier: accessTier,
      });
  }
  batch.commit().catch(e => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: questionsCollection.path, operation: 'write' })); });
}

export async function importFlashcards(firestore: Firestore, text: string, accessTier: 'standard' | 'plus'): Promise<any> {
  if (!text) throw new Error('O texto não pode estar vazio.');
  const lines = text.trim().split('\n');
  const flashcardsCollection = collection(firestore, 'flashcards');
  const batch = writeBatch(firestore);
  lines.forEach(line => {
    const parts = line.split('|');
    if (parts.length === 5) {
      const [subject, topic, targetRole, front, back] = parts.map(p => p.trim());
      batch.set(doc(flashcardsCollection), {
        subject, topic, targetRole, front, back, accessTier,
        createdAt: serverTimestamp(),
        searchKeywords: [subject.toLowerCase(), topic.toLowerCase(), front.toLowerCase()],
      });
    }
  });
  return batch.commit();
}

export async function handleFlashcardResponse(
  firestore: Firestore,
  userId: string,
  flashcard: any,
  result: 'correct' | 'incorrect'
): Promise<void> {
  const { id: flashcardId, subject } = flashcard;
  const userRef = doc(firestore, `users/${userId}`);
  const progressRef = doc(firestore, `users/${userId}/flashcard_progress/${flashcardId}`);
  const batch = writeBatch(firestore);
  const correctInc = result === 'correct' ? 1 : 0;

  batch.set(progressRef, { userId, flashcardId, status: 'learned', lastResult: result, reviewCount: increment(1), lastReviewedAt: serverTimestamp(), subject }, { merge: true });
  
  const updatePayload = {
    'stats.performance.flashcards.totalReviewed': increment(1),
    'stats.performance.flashcards.totalCorrect': increment(correctInc),
    [`stats.performance.flashcards.bySubject.${subject}.reviewed`]: increment(1),
    [`stats.performance.flashcards.bySubject.${subject}.correct`]: increment(correctInc),
  };
  
  await updateDoc(userRef, updatePayload).catch(() => setDoc(userRef, { stats: { performance: { flashcards: { totalReviewed: 1, totalCorrect: correctInc, bySubject: { [subject]: { reviewed: 1, correct: correctInc } } } } } }, { merge: true }));
  await batch.commit();
}

export async function createSimulatedExam(firestore: Firestore, userId: string, dto: any): Promise<string> {
  let allIds: string[] = [];
  for (const [subject, selection] of Object.entries(dto.subjects as any)) {
    if (selection.count > 0) {
      const snap = await getDocs(query(collection(firestore, 'questoes'), where('Materia', '==', subject)));
      let pool = snap.docs.filter(d => d.data().status !== 'hidden');
      if (dto.cargos?.length) pool = pool.filter(d => dto.cargos.includes(d.data().Cargo));
      const shuffled = pool.map(d => d.id).sort(() => 0.5 - Math.random());
      allIds.push(...shuffled.slice(0, selection.count));
    }
  }
  const ref = doc(collection(firestore, 'communitySimulados'));
  const data = { id: ref.id, name: dto.name, userId, createdAt: serverTimestamp(), questionIds: allIds, questionCount: allIds.length, accessTier: dto.accessTier };
  await setDoc(ref, data);
  return ref.id;
}

export async function deleteDuplicateQuestions(firestore: Firestore) { return 0; }
export async function deleteDuplicateFlashcards(firestore: Firestore) { return 0; }
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
export async function deleteAllFlashcards(firestore: Firestore) { return; }
export async function deleteFlashcardsByFilter(firestore: Firestore, f: any) { return 0; }
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
export async function toggleQuestionStatus(f: Firestore, id: string, s: any) { 
  const ns = s === 'active' ? 'hidden' : 'active';
  await updateDoc(doc(f, 'questoes', id), { status: ns });
  return ns;
}
