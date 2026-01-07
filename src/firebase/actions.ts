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
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface ExamDetails {
  isPreviousExam: boolean;
  examName: string;
}

export async function importQuestions(
  firestore: Firestore,
  text: string,
  userId: string,
  examDetails?: ExamDetails
): Promise<void> {
  if (!text) {
    throw new Error('O texto não pode estar vazio.');
  }
  if (examDetails?.isPreviousExam && !examDetails.examName) {
    throw new Error(
      'O nome da prova é obrigatório ao marcar "Prova Anterior".'
    );
  }

  const questionsStr = text.trim().split(';');
  const questionsCollection = collection(firestore, 'questoes');
  const batch = writeBatch(firestore);
  const newQuestionIds: string[] = [];

  for (const qStr of questionsStr) {
    if (qStr.trim() === '') continue;

    const parts = qStr.split('/');
    if (parts.length < 11) {
      console.warn(
        'Skipping invalid question format (less than 11 parts):',
        qStr
      );
      continue;
    }

    const [
      Materia,
      Ano,
      Assunto,
      Cargo,
      Enunciado,
      a,
      b,
      c,
      d,
      e,
      correctAnswer,
    ] = parts;

    const newQuestionDocRef = doc(questionsCollection);
    const newQuestion: any = {
      Materia: Materia.trim(),
      Ano: Ano.trim(),
      Assunto: Assunto.trim(),
      Cargo: Cargo.trim(),
      Enunciado: Enunciado.trim(),
      a: a.trim(),
      b: b.trim(),
      c: c.trim(),
      d: d.trim(),
      e: e.trim(),
      correctAnswer: correctAnswer.trim(),
      status: 'active',
    };

    if (examDetails?.isPreviousExam) {
      newQuestion.Prova = examDetails.examName.trim();
    }
    
    batch.set(newQuestionDocRef, newQuestion);
    newQuestionIds.push(newQuestionDocRef.id);
  }
  
  if (examDetails?.isPreviousExam && newQuestionIds.length > 0) {
      const examData = {
        name: examDetails.examName,
        importerId: userId,
        createdAt: serverTimestamp(),
        questionIds: newQuestionIds,
        questionCount: newQuestionIds.length,
      };
      const publicExamRef = doc(collection(firestore, 'previousExams'));
      batch.set(publicExamRef, examData);
  }


  batch.commit().catch(serverError => {
    console.error('Firestore batch write error:', serverError);
    const permissionError = new FirestorePermissionError({
      path: questionsCollection.path,
      operation: 'write',
      requestResourceData: 'Batch operation for question import',
    });
    errorEmitter.emit('permission-error', permissionError);
    // Propagate the error so the calling function's catch block can handle it
    throw permissionError;
  });
}

// Interface for the new, more detailed flashcard structure
interface Flashcard {
  id: string;
  subject: string;
  topic: string;
  targetRole: string;
  front: string;
  back: string;
  searchKeywords: string[];
  createdAt: any; // serverTimestamp
}


export async function importFlashcards(firestore: Firestore, text: string): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  if (!text) {
    throw new Error('O texto não pode estar vazio.');
  }

  const lines = text.trim().split('\n');
  const flashcardsCollection = collection(firestore, 'flashcards');
  const batches: WriteBatch[] = [];
  let currentBatch = writeBatch(firestore);
  let operationCount = 0;
  
  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const parts = line.split('|');
    if (parts.length !== 5) {
      results.errorCount++;
      results.errors.push(`Linha ${i + 1}: Formato inválido. Esperava 5 partes separadas por "|", mas encontrou ${parts.length}.`);
      continue;
    }

    const [subject, topic, targetRole, front, back] = parts.map(p => p.trim());
    
    // Create keywords for searching
    const keywords = [
      ...subject.toLowerCase().split(/\s+/),
      ...topic.toLowerCase().split(/\s+/),
      ...front.toLowerCase().split(/\s+/),
    ];
    const uniqueKeywords = [...new Set(keywords)];

    const newFlashcardDocRef = doc(flashcardsCollection);
    const newFlashcard: Omit<Flashcard, 'id'> = {
      subject,
      topic,
      targetRole,
      front,
      back,
      searchKeywords: uniqueKeywords,
      createdAt: serverTimestamp(),
    };

    currentBatch.set(newFlashcardDocRef, newFlashcard);
    operationCount++;
    results.successCount++;

    if (operationCount === 499) { // Firebase batch limit is 500 operations
      batches.push(currentBatch);
      currentBatch = writeBatch(firestore);
      operationCount = 0;
    }
  }

  // Add the last batch if it has operations
  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  // Commit all batches
  try {
    await Promise.all(batches.map(b => b.commit()));
  } catch (serverError) {
    console.error('Firestore batch write error for flashcards:', serverError);
    const permissionError = new FirestorePermissionError({
      path: flashcardsCollection.path,
      operation: 'create',
      requestResourceData: 'Batch operation for flashcard import',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError; // Re-throw to be caught by the caller
  }
  
  return results;
}


export async function handleFlashcardResponse(
  firestore: Firestore,
  userId: string,
  flashcard: Flashcard, // Use the full, detailed Flashcard object
  result: 'correct' | 'incorrect'
): Promise<void> {
  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }

  const { id: flashcardId, subject } = flashcard;
  
  const userRef = doc(firestore, `users/${userId}`);
  const progressRef = doc(firestore, `users/${userId}/flashcard_progress/${flashcardId}`);
  
  const batch = writeBatch(firestore);

  // 1. Log the individual progress
  const progressData = {
    userId,
    flashcardId,
    status: 'learned', // First response means it's now 'learned'
    lastResult: result,
    reviewCount: increment(1),
    lastReviewedAt: serverTimestamp(),
  };
  batch.set(progressRef, progressData, { merge: true });

  // 2. Atomically update the aggregated stats
  const totalCorrectIncrement = result === 'correct' ? 1 : 0;
  
  // Using dot notation for nested fields ensures atomicity
  const updatePayload: { [key: string]: any } = {
    'stats.performance.flashcards.totalReviewed': increment(1),
    'stats.performance.flashcards.totalCorrect': increment(totalCorrectIncrement),
    [`stats.performance.flashcards.bySubject.${subject}.reviewed`]: increment(1),
    [`stats.performance.flashcards.bySubject.${subject}.correct`]: increment(totalCorrectIncrement),
  };
  batch.update(userRef, updatePayload);

  batch.commit().catch(async (serverError) => {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      // If the user document doesn't exist, create it with initial stats.
      const initialStats = {
          stats: {
              performance: {
                  flashcards: {
                      totalReviewed: 0,
                      totalCorrect: 0,
                      bySubject: {
                          [subject]: { reviewed: 0, correct: 0 }
                      }
                  }
              }
          }
      };
      await setDoc(userRef, initialStats, { merge: true });
      await handleFlashcardResponse(firestore, userId, flashcard, result);
    } else {
       const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updatePayload,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    }
  });
}


export async function toggleQuestionStatus(
  firestore: Firestore,
  questionId: string,
  currentStatus: 'active' | 'hidden'
): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
  const questionRef = doc(firestore, 'questoes', questionId);

  updateDoc(questionRef, { status: newStatus }).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: questionRef.path,
      operation: 'update',
      requestResourceData: { status: newStatus },
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

async function getRandomQuestions(
  firestore: Firestore,
  subject: string,
  count: number
): Promise<string[]> {
  const questionsCollection = collection(firestore, 'questoes');
  const q = query(
    questionsCollection,
    where('Materia', '==', subject)
  );

  const snapshot = await getDocs(q);
  
  // Manually filter out hidden questions from the results.
  const activeQuestions = snapshot.docs.filter(doc => doc.data().status !== 'hidden');
  
  const allQuestionIds = activeQuestions.map(doc => doc.id);

  if (allQuestionIds.length < count) {
      throw new Error(`Não há questões suficientes para a matéria '${subject}'. Encontradas: ${allQuestionIds.length}, Solicitadas: ${count}.`);
  }

  const shuffled = allQuestionIds.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

interface CreateSimulatedExamDTO {
  name: string;
  subjects: { [subject: string]: number };
}

export async function createSimulatedExam(
  firestore: Firestore,
  userId: string,
  dto: CreateSimulatedExamDTO
): Promise<string> {
  let allQuestionIds: string[] = [];
  let totalQuestions = 0;

  for (const [subject, count] of Object.entries(dto.subjects)) {
    if (count > 0) {
      const questionIds = await getRandomQuestions(firestore, subject, count);
      allQuestionIds.push(...questionIds);
      totalQuestions += count;
    }
  }

  if (allQuestionIds.length === 0) {
    throw new Error('Nenhuma questão foi selecionada para o simulado.');
  }

  const communityExamCollection = collection(firestore, `communitySimulados`);
  // Generate a new document reference with an auto-generated ID
  const examDocRef = doc(communityExamCollection);

  const examData = {
    id: examDocRef.id,
    originalExamId: examDocRef.id, // Set it directly
    name: dto.name,
    userId,
    createdAt: serverTimestamp(),
    questionIds: allQuestionIds,
    questionCount: totalQuestions,
  };

  // Use setDoc with the new ref to create the document in one operation
  setDoc(examDocRef, examData).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: examDocRef.path,
      operation: 'create', // It's a create operation with a specific ID
      requestResourceData: examData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });

  return examDocRef.id;
}


export async function deleteDuplicateQuestions(firestore: Firestore): Promise<number> {
    const questionsRef = collection(firestore, 'questoes');
    const snapshot = await getDocs(questionsRef);
  
    const questionsByEnunciado = new Map<string, any[]>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const enunciado = data.Enunciado;
      if (!enunciado) return;

      if (!questionsByEnunciado.has(enunciado)) {
        questionsByEnunciado.set(enunciado, []);
      }
      questionsByEnunciado.get(enunciado)!.push({ id: doc.id, ...data });
    });

    const batch = writeBatch(firestore);
    let deletedCount = 0;

    for (const [enunciado, duplicates] of questionsByEnunciado.entries()) {
      if (duplicates.length > 1) {
        const [first, ...rest] = duplicates;
        
        rest.forEach(dup => {
          const docRef = doc(firestore, 'questoes', dup.id);
          batch.delete(docRef);
          deletedCount++;
        });
      }
    }

    if (deletedCount > 0) {
      await batch.commit().catch(serverError => {
         console.error('Firestore batch delete error:', serverError);
          const permissionError = new FirestorePermissionError({
              path: 'questoes',
              operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
      });
    }

    return deletedCount;
}

export async function deleteQuestionsBySubject(firestore: Firestore, subject: string): Promise<number> {
    const questionsRef = collection(firestore, 'questoes');
    const q = query(questionsRef, where('Materia', '==', subject));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return 0;
    }

    const batch = writeBatch(firestore);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit().catch(serverError => {
        console.error('Firestore batch delete error for subject:', serverError);
        const permissionError = new FirestorePermissionError({
            path: `questoes (subject: ${subject})`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });

    return snapshot.size;
}

export async function deletePreviousExams(firestore: Firestore, userId: string, examIds: string[]): Promise<void> {
  if (!examIds || examIds.length === 0) {
    throw new Error("Nenhuma prova foi selecionada para exclusão.");
  }
  
  const batch = writeBatch(firestore);
  
  for (const examId of examIds) {
    const examRef = doc(firestore, `previousExams`, examId);
    
    try {
        const examSnap = await getDoc(examRef);
        if (examSnap.exists()) {
            const examData = examSnap.data();
            const questionIds = examData.questionIds || [];

            for (const qId of questionIds) {
                const questionRef = doc(firestore, 'questoes', qId);
                batch.delete(questionRef);
            }
        }
        batch.delete(examRef);
    } catch(e) {
        console.error(`Error processing exam ${examId}:`, e);
    }
  }
  
  await batch.commit().catch(serverError => {
    console.error('Firestore batch delete error for previous exams:', serverError);
    const permissionError = new FirestorePermissionError({
      path: `previousExams`,
      operation: 'delete',
      requestResourceData: { examIds }
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}

export async function deleteCommunitySimulados(firestore: Firestore, simuladoIds: string[]): Promise<void> {
  if (!simuladoIds || simuladoIds.length === 0) {
    throw new Error("Nenhum simulado foi selecionado para exclusão.");
  }
  
  const batch = writeBatch(firestore);
  
  for (const simuladoId of simuladoIds) {
    const simuladoRef = doc(firestore, 'communitySimulados', simuladoId);
    batch.delete(simuladoRef);
  }
  
  await batch.commit().catch(serverError => {
    console.error('Firestore batch delete error for community simulados:', serverError);
    // Correctly report the path for one of the documents in the batch for better context
    const representativePath = `communitySimulados/${simuladoIds[0]}`;
    const permissionError = new FirestorePermissionError({
      path: representativePath,
      operation: 'delete',
      requestResourceData: { simuladoIds } // Still useful to show all attempted deletions
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}


export async function deleteFlashcards(firestore: Firestore, flashcardIds: string[]): Promise<void> {
  if (!flashcardIds || flashcardIds.length === 0) {
    throw new Error("Nenhum flashcard foi selecionado para exclusão.");
  }
  
  const batch = writeBatch(firestore);
  
  for (const flashcardId of flashcardIds) {
    const flashcardRef = doc(firestore, 'flashcards', flashcardId);
    batch.delete(flashcardRef);
  }
  
  await batch.commit().catch(serverError => {
    console.error('Firestore batch delete error for flashcards:', serverError);
    const representativePath = `flashcards/${flashcardIds[0]}`;
    const permissionError = new FirestorePermissionError({
      path: representativePath,
      operation: 'delete',
      requestResourceData: { flashcardIds }
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}


interface ExamResultPayload {
    examId: string;
    userId: string;
    score: number;
    userAnswers: { [key: string]: string };
    performanceSummary: { [key: string]: any };
}


export async function savePreviousExamResult(firestore: Firestore, payload: ExamResultPayload): Promise<void> {
    const { userId, examId, score, userAnswers, performanceSummary } = payload;
    
    if (!userId || !examId) {
        throw new Error("User ID and Exam ID are required.");
    }

    const resultRef = doc(firestore, `users/${userId}/previousExamResults/${examId}`);

    const resultData = {
        userId,
        examId,
        score,
        userAnswers,
        performanceSummary,
        completedAt: serverTimestamp(),
    };

    setDoc(resultRef, resultData, { merge: true }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: resultRef.path,
            operation: 'write',
            requestResourceData: resultData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}
