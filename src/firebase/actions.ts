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
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function importQuestions(
  firestore: Firestore,
  text: string
): Promise<void> {
  if (!text) {
    throw new Error('O texto não pode estar vazio.');
  }

  const questionsStr = text.trim().split(';');
  const questionsCollection = collection(firestore, 'questoes');

  for (const qStr of questionsStr) {
    if (qStr.trim() === '') continue;

    // Format: Materia/Ano/Assunto/Cargo/Enunciado/a/b/c/d/e/correctAnswer
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

    const newQuestion = {
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
      status: 'active', // Default status
    };

    // Use non-blocking write with error handling
    addDoc(questionsCollection, newQuestion).catch(serverError => {
      console.error('Firestore addDoc error:', serverError);
      const permissionError = new FirestorePermissionError({
        path: questionsCollection.path,
        operation: 'create',
        requestResourceData: newQuestion,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  }
}

export async function importFlashcards(
  firestore: Firestore,
  userId: string,
  text: string
): Promise<void> {
  if (!text) {
    throw new Error('O texto não pode estar vazio.');
  }
  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }

  const flashcardsStr = text.trim().split(';');
  const flashcardsCollection = collection(
    firestore,
    `users/${userId}/flashcards`
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
    where('Materia', '==', subject),
    where('status', '==', 'active') // Only get active questions
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
