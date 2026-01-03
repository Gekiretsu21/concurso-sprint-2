'use server';

import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase Admin SDK
const { firestore } = initializeFirebase();

interface Question {
  id: string;
  subject: string;
  difficulty: string;
  text: string;
  options: string[];
  answer: string;
}

export async function importQuestions(text: string): Promise<{ success: boolean; message: string }> {
    if (!text) {
        return { success: false, message: 'O texto não pode estar vazio.' };
    }

    try {
        const questionsStr = text.trim().split(';');
        const questionsCollection = collection(firestore, 'questoes');

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
                options: options.map(o => o.trim()),
                answer: answer.trim(),
            };

            await addDoc(questionsCollection, newQuestion);
        }

        return { success: true, message: 'Questões importadas com sucesso!' };
    } catch (error) {
        console.error('Erro ao importar questões:', error);
        return { success: false, message: 'Ocorreu um erro ao importar as questões. Verifique o console para mais detalhes.' };
    }
}
