'use client';

import { addDoc, collection, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export async function importQuestions(
  firestore: Firestore,
  userId: string,
  text: string
): Promise<void> {
  if (!text) {
    throw new Error('O texto não pode estar vazio.');
  }

  const questionsStr = text.trim().split(';');
  const questionsCollection = collection(firestore, 'questoes');

  for (const qStr of questionsStr) {
    if (qStr.trim() === '') continue;

    // Format: Ano/Assunto/Cargo/Enunciado/Materia/a/b/c/d/e/correctAnswer
    const parts = qStr.split('/');
    if (parts.length < 11) {
      console.warn('Skipping invalid question format (less than 11 parts):', qStr);
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
        correctAnswer
    ] = parts;


    const newQuestion = {
        Ano: Ano.trim(),
        Assunto: Assunto.trim(),
        Cargo: Cargo.trim(),
        Enunciado: Enunciado.trim(),
        Materia: Materia.trim(),
        a: a.trim(),
        b: b.trim(),
        c: c.trim(),
        d: d.trim(),
        e: e.trim(),
        correctAnswer: correctAnswer.trim(),
        userId: userId,
    };

    // Use non-blocking write with error handling
    addDoc(questionsCollection, newQuestion).catch(serverError => {
      console.error("Firestore addDoc error:", serverError);
      const permissionError = new FirestorePermissionError({
        path: questionsCollection.path,
        operation: 'create',
        requestResourceData: newQuestion,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  }
}
