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

    const parts = qStr.split('/');
    if (parts.length < 5) { // Subject, difficulty, text, at least one option, answer
      console.warn('Skipping invalid question format:', qStr);
      continue;
    }

    const [subject, difficulty, questionText, ...optionsAndAnswer] = parts;
    const answer = optionsAndAnswer.pop();
    const options = optionsAndAnswer;

    if (!answer || options.length === 0) {
      console.warn('Skipping question with no answer or options:', qStr);
      continue;
    }

    const newQuestion = {
      subject: subject.trim(),
      difficulty: difficulty.trim(),
      text: questionText.trim(),
      options: options.map((o) => o.trim()),
      correctAnswer: answer.trim(), // Field name should match the schema
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
