'use client';

import { addDoc, collection, Firestore } from 'firebase/firestore';

export async function importQuestions(
  firestore: Firestore,
  text: string
): Promise<void> {
  if (!text) {
    throw new Error('O texto não pode estar vazio.');
  }

  const questionsStr = text.trim().split(';');
  const questionsCollection = collection(firestore, 'questoes');

  const promises = [];

  for (const qStr of questionsStr) {
    if (qStr.trim() === '') continue;

    const parts = qStr.split('/');
    if (parts.length < 6) {
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
      answer: answer.trim(),
    };

    promises.push(addDoc(questionsCollection, newQuestion));
  }

  await Promise.all(promises);
}
