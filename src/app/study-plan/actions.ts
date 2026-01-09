
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
    // Basic validation can be done here before calling the AI flow
    if (!input.goals || !input.hoursPerDay || !input.daysOfWeek || !input.examDate) {
      throw new Error('All fields are required.');
    }
    
    const output = await generatePersonalizedStudyPlan(input);
    return output;
  } catch (error) {
    console.error('Error generating study plan:', error);
    // It's better to throw a generic error to the client
    throw new Error('Failed to generate study plan. Please try again later.');
  }
}
