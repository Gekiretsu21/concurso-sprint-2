
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
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface ExamDetails {
  isPreviousExam: boolean;
  examName: string;
}

export async function updateStudyTime(firestore: Firestore, userId: string, seconds: number): Promise<void> {
  if (!userId || seconds <= 0) return;

  const userRef = doc(firestore, 'users', userId);
  const updatePayload = {
    'stats.totalStudyTime': increment(seconds)
  };

  try {
    await updateDoc(userRef, updatePayload);
  } catch (error: any) {
    if (error.code === 'not-found' || error.code === 'invalid-argument') {
      // User document or stats object doesn't exist, create it.
      const initialData = { stats: { totalStudyTime: seconds } };
      setDoc(userRef, initialData, { merge: true }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: initialData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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


export async function registerQuestionAnswer(
  firestore: Firestore,
  userId: string,
  subject: string,
  isCorrect: boolean
) {
  const userRef = doc(firestore, 'users', userId);

  // Atomically update the aggregated stats
  const correctIncrement = isCorrect ? 1 : 0;

  const updatePayload = {
    'stats.performance.questions.totalAnswered': increment(1),
    'stats.performance.questions.totalCorrect': increment(correctIncrement),
    [`stats.performance.questions.bySubject.${subject}.answered`]: increment(1),
    [`stats.performance.questions.bySubject.${subject}.correct`]: increment(correctIncrement),
  };

  try {
    await updateDoc(userRef, updatePayload);
  } catch (error: any) {
     if (error.code === 'not-found' || error.code === 'invalid-argument') {
      // The user document or the nested stats object doesn't exist yet.
      // We should create it.
       const initialStats = {
        stats: {
          performance: {
            questions: {
              totalAnswered: 1,
              totalCorrect: correctIncrement,
              bySubject: {
                [subject]: {
                  answered: 1,
                  correct: correctIncrement,
                },
              },
            },
          },
        },
      };
      // Use setDoc with merge to safely create the document or path.
      setDoc(userRef, initialStats, { merge: true }).catch(serverError => {
         const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'write',
            requestResourceData: initialStats
         });
         errorEmitter.emit('permission-error', permissionError);
         throw permissionError;
      });
    } else {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updatePayload,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    }
  }
}

export async function saveQuestionAttempt(
  firestore: Firestore,
  userId: string,
  questionId: string,
  isCorrect: boolean,
  selectedOption: string,
  subject: string
) {
  if (!userId || !questionId) return;

  const attemptRef = doc(firestore, `users/${userId}/question_attempts/${questionId}`);
  const attemptData = {
    questionId,
    isCorrect,
    selectedOption,
    subject,
    timestamp: serverTimestamp(),
  };

  setDoc(attemptRef, attemptData, { merge: true }).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: attemptRef.path,
      operation: 'write',
      requestResourceData: attemptData
    });
    errorEmitter.emit('permission-error', permissionError);
    // Don't rethrow, just log and emit. The UI can proceed.
  });

  // Also update the aggregated stats
  await registerQuestionAnswer(firestore, userId, subject, isCorrect);
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

  const questionsStr = text.trim().split('\n'); // Each line is a question
  const questionsCollection = collection(firestore, 'questoes');
  const batch = writeBatch(firestore);
  const newQuestionIds: string[] = [];

  for (const qStr of questionsStr) {
    if (qStr.trim() === '') continue;

    const parts = qStr.split('|'); // Use '|' as the field separator
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
  
  try {
    await updateDoc(userRef, updatePayload);
  } catch (error: any) {
    if (error.code === 'not-found' || error.code === 'invalid-argument') {
      const initialStats = {
          stats: {
              performance: {
                  flashcards: {
                      totalReviewed: 1,
                      totalCorrect: totalCorrectIncrement,
                      bySubject: {
                          [subject]: { reviewed: 1, correct: totalCorrectIncrement }
                      }
                  }
              }
          }
      };
      await setDoc(userRef, initialStats, { merge: true });
    } else {
       const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updatePayload,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    }
  }

  await batch.commit().catch(serverError => {
    // This might be redundant if the updateDoc above handles the initial creation,
    // but it's a safe fallback for the progressRef itself.
    const permissionError = new FirestorePermissionError({
        path: progressRef.path,
        operation: 'write',
        requestResourceData: progressData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}

async function getRandomQuestions(
  firestore: Firestore,
  subject: string,
  count: number,
  topics?: string[],
  cargos?: string[]
): Promise<string[]> {
    const questionsCollection = collection(firestore, 'questoes');
    const q = query(questionsCollection, where('Materia', '==', subject));
    const snapshot = await getDocs(q);

    let filteredQuestions = snapshot.docs.filter(doc => doc.data().status !== 'hidden');

    // Filter by cargos client-side if provided
    if (cargos && cargos.length > 0) {
        filteredQuestions = filteredQuestions.filter(doc => {
            const cargo = doc.data().Cargo;
            return cargo && cargos.includes(cargo);
        });
    }

    // Filter by topics client-side if provided
    if (topics && topics.length > 0) {
        filteredQuestions = filteredQuestions.filter(doc => {
            const assunto = doc.data().Assunto;
            return assunto && topics.includes(assunto);
        });
    }

    const allQuestionIds = filteredQuestions.map(doc => doc.id);

    if (allQuestionIds.length < count) {
        let errorMsg = `Não há questões suficientes para a matéria '${subject}'`;
        if (cargos && cargos.length > 0) errorMsg += ` para o(s) cargo(s) [${cargos.join(', ')}]`;
        if (topics && topics.length > 0) errorMsg += ` nos tópicos [${topics.join(', ')}]`;
        errorMsg += `. Encontradas: ${allQuestionIds.length}, Solicitadas: ${count}.`;
        throw new Error(errorMsg);
    }

    const shuffled = allQuestionIds.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

interface CreateSimulatedExamDTO {
  name: string;
  cargos: string[];
  subjects: { 
    [subject: string]: {
      count: number;
      topics: string[];
    } 
  };
}

export async function createSimulatedExam(
  firestore: Firestore,
  userId: string,
  dto: CreateSimulatedExamDTO
): Promise<string> {
  let allQuestionIds: string[] = [];
  let totalQuestions = 0;

  for (const [subject, selection] of Object.entries(dto.subjects)) {
    if (selection.count > 0) {
      // Get all questions for the subject first, then filter client-side
      const subjectQuestionsSnapshot = await getDocs(query(collection(firestore, 'questoes'), where('Materia', '==', subject)));
      let potentialQuestions = subjectQuestionsSnapshot.docs.filter(doc => doc.data().status !== 'hidden');

      // Filter by cargos
      if (dto.cargos && dto.cargos.length > 0) {
        potentialQuestions = potentialQuestions.filter(doc => {
          const cargo = doc.data().Cargo;
          return cargo && dto.cargos.includes(cargo);
        });
      }

      // Filter by topics
      if (selection.topics && selection.topics.length > 0) {
         potentialQuestions = potentialQuestions.filter(doc => {
            const assunto = doc.data().Assunto;
            return assunto && selection.topics.includes(assunto);
        });
      }

      const availableIds = potentialQuestions.map(doc => doc.id);
      
      if (availableIds.length < selection.count) {
          let errorMsg = `Não há questões suficientes para a matéria '${subject}'`;
          if (dto.cargos && dto.cargos.length > 0) errorMsg += ` para o(s) cargo(s) [${dto.cargos.join(', ')}]`;
          if (selection.topics && selection.topics.length > 0) errorMsg += ` nos tópicos [${selection.topics.join(', ')}]`;
          errorMsg += `. Encontradas: ${availableIds.length}, Solicitadas: ${selection.count}.`;
          throw new Error(errorMsg);
      }
      
      const shuffled = availableIds.sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, selection.count);

      allQuestionIds.push(...selectedIds);
      totalQuestions += selection.count;
    }
  }

  if (allQuestionIds.length === 0) {
    throw new Error('Nenhuma questão foi selecionada para o simulado.');
  }

  const communityExamCollection = collection(firestore, `communitySimulados`);
  const examDocRef = doc(communityExamCollection);

  const examData = {
    id: examDocRef.id,
    originalExamId: examDocRef.id,
    name: dto.name,
    userId,
    createdAt: serverTimestamp(),
    questionIds: allQuestionIds,
    questionCount: totalQuestions,
  };

  setDoc(examDocRef, examData).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: examDocRef.path,
      operation: 'create',
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
        // Keep the first one, delete the rest
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

export async function deleteDuplicateFlashcards(firestore: Firestore): Promise<number> {
    const flashcardsRef = collection(firestore, 'flashcards');
    const snapshot = await getDocs(flashcardsRef);
  
    const flashcardsByFront = new Map<string, any[]>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const frontText = data.front;
      if (!frontText) return;

      if (!flashcardsByFront.has(frontText)) {
        flashcardsByFront.set(frontText, []);
      }
      flashcardsByFront.get(frontText)!.push({ id: doc.id, ...data });
    });

    const batch = writeBatch(firestore);
    let deletedCount = 0;

    for (const [frontText, duplicates] of flashcardsByFront.entries()) {
      if (duplicates.length > 1) {
        // Keep the first one, delete the rest
        const [first, ...rest] = duplicates;
        
        rest.forEach(dup => {
          const docRef = doc(firestore, 'flashcards', dup.id);
          batch.delete(docRef);
          deletedCount++;
        });
      }
    }

    if (deletedCount > 0) {
      await batch.commit().catch(serverError => {
         console.error('Firestore batch delete error for flashcards:', serverError);
          const permissionError = new FirestorePermissionError({
              path: 'flashcards',
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

export async function deleteQuestionsByIds(firestore: Firestore, questionIds: string[]): Promise<void> {
  if (!questionIds || questionIds.length === 0) {
    throw new Error("Nenhuma questão foi selecionada para exclusão.");
  }
  
  const batch = writeBatch(firestore);
  
  for (const questionId of questionIds) {
    const questionRef = doc(firestore, 'questoes', questionId);
    batch.delete(questionRef);
  }
  
  await batch.commit().catch(serverError => {
    console.error('Firestore batch delete error for specific questions:', serverError);
    const representativePath = `questoes/${questionIds[0]}`;
    const permissionError = new FirestorePermissionError({
      path: representativePath,
      operation: 'delete',
      requestResourceData: { questionIds }
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
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

export async function deleteAllFlashcards(firestore: Firestore): Promise<void> {
    const flashcardsRef = collection(firestore, 'flashcards');
    const snapshot = await getDocs(flashcardsRef);

    if (snapshot.empty) {
        return;
    }

    const batch = writeBatch(firestore);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit().catch(serverError => {
        console.error('Firestore batch delete error for all flashcards:', serverError);
        const permissionError = new FirestorePermissionError({
            path: 'flashcards',
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

interface DeleteFlashcardsFilters {
    subject?: string;
    topic?: string;
    cargo?: string;
}

export async function deleteFlashcardsByFilter(firestore: Firestore, filters: DeleteFlashcardsFilters): Promise<number> {
    const { subject, topic, cargo } = filters;
    const flashcardsRef = collection(firestore, 'flashcards');
    
    const constraints: QueryConstraint[] = [];
    if (subject) constraints.push(where('subject', '==', subject));
    if (topic) constraints.push(where('topic', '==', topic));
    if (cargo) constraints.push(where('targetRole', '==', cargo));

    if (constraints.length === 0) {
        throw new Error("Pelo menos um filtro deve ser fornecido para exclusão.");
    }

    const q = query(flashcardsRef, and(...constraints));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return 0;
    }

    const batch = writeBatch(firestore);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit().catch(serverError => {
        console.error('Firestore batch delete error for flashcards by filter:', serverError);
        const permissionError = new FirestorePermissionError({
            path: 'flashcards',
            operation: 'delete',
            requestResourceData: { filters }
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });

    return snapshot.size;
}

export async function deleteFlashcardsByIds(firestore: Firestore, flashcardIds: string[]): Promise<void> {
  if (!flashcardIds || flashcardIds.length === 0) {
    throw new Error("Nenhum flashcard foi selecionado para exclusão.");
  }
  
  const batch = writeBatch(firestore);
  
  for (const flashcardId of flashcardIds) {
    const flashcardRef = doc(firestore, 'flashcards', flashcardId);
    batch.delete(flashcardRef);
  }
  
  await batch.commit().catch(serverError => {
    console.error('Firestore batch delete error for specific flashcards:', serverError);
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

export async function addQuestionComment(
  firestore: Firestore,
  user: User,
  questionId: string,
  text: string
): Promise<void> {
  if (!user) {
    throw new Error('User must be logged in to comment.');
  }

  const commentCollectionRef = collection(firestore, 'questoes', questionId, 'comments');
  
  const commentData = {
    userId: user.uid,
    userName: user.displayName || 'Anônimo',
    userPhotoURL: user.photoURL || '',
    text: text,
    createdAt: serverTimestamp(),
  };

  addDoc(commentCollectionRef, commentData).catch(serverError => {
     const permissionError = new FirestorePermissionError({
        path: `${commentCollectionRef.path}/<new_comment>`,
        operation: 'create',
        requestResourceData: commentData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
  });
}
