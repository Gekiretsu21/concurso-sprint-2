'use server';

import {
  generatePersonalizedStudyPlan,
  type GeneratePersonalizedStudyPlanInput,
  type GeneratePersonalizedStudyPlanOutput,
} from '@/ai/flows/generate-personalized-study-plan';

export async function handleGenerateStudyPlan(
  input: GeneratePersonalizedStudyPlanInput
): Promise<GeneratePersonalizedStudyPlanOutput> {
  try {
    // Validação consistente com o esquema do Genkit
    if (!input.goals || !input.hoursPerDay || !input.daysOfWeek || !input.examDate) {
      throw new Error('Todos os campos são obrigatórios.');
    }
    
    const output = await generatePersonalizedStudyPlan(input);
    return output;
  } catch (error) {
    console.error('Error generating study plan:', error);
    throw new Error('Falha ao gerar o plano de estudo. Por favor, tente novamente mais tarde.');
  }
}
