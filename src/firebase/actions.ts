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
  userId: string, // userId is required to create a simulated exam
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
  if (examDetails?.isPreviousExam && !userId) {
    throw new Error(
      'É necessário estar logado para criar uma prova anterior.'
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

    const newQuestionDocRef = doc(questionsCollection); // Create a new doc reference
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
  
  // If it's a previous exam, create a simulated exam document
  if (examDetails?.isPreviousExam && newQuestionIds.length > 0) {
      const examData = {
        name: examDetails.examName,
        userId,
        createdAt: serverTimestamp(),
        questionIds: newQuestionIds,
        questionCount: newQuestionIds.length,
      };

      // Write to the user's private collection
      const userExamRef = doc(
        collection(firestore, `users/${userId}/simulatedExams`)
      );
      batch.set(userExamRef, examData);

      // Write to the public community collection
      const communityExamRef = doc(collection(firestore, 'communitySimulados'));
      batch.set(communityExamRef, { ...examData, originalExamId: userExamRef.id });
  }


  // Commit the batch
  await batch.commit().catch(serverError => {
    console.error('Firestore batch write error:', serverError);
    const permissionError = new FirestorePermissionError({
      path: questionsCollection.path,
      operation: 'write',
      requestResourceData: 'Batch operation for question import',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError; // Re-throw to be caught by the calling function
  });
}

export async function importFlashcards(
  firestore: Firestore,
  text: string
): Promise<void> {
  if (!text) {
    throw new Error('O texto não pode estar vazio.');
  }
  
  const flashcardsStr = text.trim().split(';');
  const flashcardsCollection = collection(
    firestore,
    'flashcards'
  );

  for (const fStr of flashcardsStr) {
    if (fStr.trim() === '') continue;

    // Format: Materia/Pergunta/Resposta
    const parts = fStr.split('/');
    if (parts.length < 3) {
      console.warn('Skipping invalid flashcard format:', fStr);
      continue;
    }

    const [subject, front, back] = parts;

    const newFlashcard = {
      subject: subject.trim(),
      front: front.trim(),
      back: back.trim(),
      createdAt: serverTimestamp(),
    };

    addDoc(flashcardsCollection, newFlashcard).catch(serverError => {
      console.error('Firestore addDoc error for flashcard:', serverError);
      const permissionError = new FirestorePermissionError({
        path: flashcardsCollection.path,
        operation: 'create',
        requestResourceData: newFlashcard,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  }
}

export async function handleFlashcardResponse(
  firestore: Firestore,
  userId: string,
  flashcardId: string,
  status: 'correct' | 'incorrect'
): Promise<void> {
  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }
  const responseRef = doc(firestore, `users/${userId}/flashcardResponses/${flashcardId}`);
  const responseData = {
    userId,
    flashcardId,
    status,
    lastReviewed: serverTimestamp(),
  };

  setDoc(responseRef, responseData, { merge: true }).catch(serverError => {
    console.error('Firestore setDoc error for flashcard response:', serverError);
    const permissionError = new FirestorePermissionError({
      path: responseRef.path,
      operation: 'write',
      requestResourceData: responseData,
    });
    errorEmitter.emit('permission-error', permissionError);
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

// Function to fetch random questions for a given subject
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
  const allQuestionIds = snapshot.docs.map(doc => doc.id);

  // Shuffle and pick
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
): Promise<void> {
  const allQuestionIds: string[] = [];
  let totalQuestions = 0;

  for (const [subject, count] of Object.entries(dto.subjects)) {
    if (count > 0) {
      const questionIds = await getRandomQuestions(firestore, subject, count);
      if (questionIds.length < count) {
        throw new Error(
          `Não há questões suficientes para a matéria '${subject}'. Encontradas: ${questionIds.length}, Solicitadas: ${count}.`
        );
      }
      allQuestionIds.push(...questionIds);
      totalQuestions += count;
    }
  }

  if (allQuestionIds.length === 0) {
    throw new Error('Nenhuma questão foi selecionada para o simulado.');
  }

  const examData = {
    name: dto.name,
    userId,
    createdAt: serverTimestamp(),
    questionIds: allQuestionIds,
    questionCount: totalQuestions,
  };

  const batch = writeBatch(firestore);

  // 1. Write to the user's private collection
  const userExamRef = doc(
    collection(firestore, `users/${userId}/simulatedExams`)
  );
  batch.set(userExamRef, examData);

  // 2. Write to the public community collection
  const communityExamRef = doc(collection(firestore, 'communitySimulados'));
  batch.set(communityExamRef, { ...examData, originalExamId: userExamRef.id });

  // Use non-blocking write with error handling for the batch
  batch.commit().catch(serverError => {
    console.error('Firestore batch write error for exam:', serverError);
    const permissionError = new FirestorePermissionError({
      path: `users/${userId}/simulatedExams and communitySimulados`,
      operation: 'create',
      requestResourceData: examData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export async function deleteDuplicateQuestions(firestore: Firestore): Promise<number> {
  const questionsRef = collection(firestore, 'questoes');
  const snapshot = await getDocs(questionsRef);
  
  const questionsByEnunciado = new Map<string, any[]>();

  // Group questions by their statement (Enunciado)
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
      console.log(`Found ${duplicates.length} duplicates for: "${enunciado}". Keeping one, deleting ${rest.length}.`);
      
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
        // Re-throw the error to be caught by the calling function
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
