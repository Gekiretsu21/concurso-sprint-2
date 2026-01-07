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
    const permissionError = new FirestorePermissionError({
      path: 'communitySimulados',
      operation: 'delete',
      requestResourceData: { simuladoIds }
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}
