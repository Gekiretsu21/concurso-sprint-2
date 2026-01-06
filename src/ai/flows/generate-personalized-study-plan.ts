'use server';
/**
 * @fileOverview Generates a personalized study plan based on user goals, availability, and exam date.
 *
 * - generatePersonalizedStudyPlan - A function that generates a personalized study plan.
 * - GeneratePersonalizedStudyPlanInput - The input type for the generatePersonalizedStudyPlan function.
 * - GeneratePersonalizedStudyPlanOutput - The return type for the generatePersonalizedStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GeneratePersonalizedStudyPlanInputSchema = z.object({
  hoursPerDay: z.string().describe('The number of hours the user can study per day.'),
  daysOfWeek: z.string().describe('The days of the week the user is available to study.'),
  goals: z.string().describe('The user\'s study goals and objectives.'),
  examDate: z.string().describe('The likely date of the exam.'),
});

export type GeneratePersonalizedStudyPlanInput = z.infer<
  typeof GeneratePersonalizedStudyPlanInputSchema
>;

const GeneratePersonalizedStudyPlanOutputSchema = z.object({
  studyPlan: z.string().describe('The generated personalized weekly study plan in a calendar format.'),
});

export type GeneratePersonalizedStudyPlanOutput = z.infer<
  typeof GeneratePersonalizedStudyPlanOutputSchema
>;

export async function generatePersonalizedStudyPlan(
  input: GeneratePersonalizedStudyPlanInput
): Promise<GeneratePersonalizedStudyPlanOutput> {
  return generatePersonalizedStudyPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedStudyPlanPrompt',
  input: {schema: GeneratePersonalizedStudyPlanInputSchema},
  output: {schema: GeneratePersonalizedStudyPlanOutputSchema},
  model: googleAI('gemini-1.5-flash-latest'),
  prompt: `You are an expert study plan generator for competitive exams.
  Based on the user's availability, goals, and exam date, generate a personalized weekly study plan.
  The output should be formatted like a weekly calendar, showing the study schedule for the upcoming week.
  Prioritize subjects based on general importance for public exams, but build a balanced schedule.

  User Information:
  - Daily Study Hours: {{{hoursPerDay}}}
  - Available Days: {{{daysOfWeek}}}
  - Goals: {{{goals}}}
  - Exam Date: {{{examDate}}}

  Generate the study plan below in a clear, week-long calendar format (e.g., Monday, Tuesday, etc.).
  The plan should be detailed, specifying subjects and activities for each study block.
  `,
});

const generatePersonalizedStudyPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedStudyPlanFlow',
    inputSchema: GeneratePersonalizedStudyPlanInputSchema,
    outputSchema: GeneratePersonalizedStudyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
