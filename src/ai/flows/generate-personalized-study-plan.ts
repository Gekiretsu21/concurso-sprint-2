'use server';
/**
 * @fileOverview Generates a personalized study plan based on user performance, goals, resources, and time.
 *
 * - generatePersonalizedStudyPlan - A function that generates a personalized study plan.
 * - GeneratePersonalizedStudyPlanInput - The input type for the generatePersonalizedStudyPlan function.
 * - GeneratePersonalizedStudyPlanOutput - The return type for the generatePersonalizedStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GeneratePersonalizedStudyPlanInputSchema = z.object({
  performanceStatistics: z
    .string()
    .describe('The user performance statistics across subjects.'),
  goals: z.string().describe('The user study goals.'),
  availableResources: z
    .string()
    .describe('Available study resources for the user.'),
  availableTime: z.string().describe('The time the user has available to study.'),
});

export type GeneratePersonalizedStudyPlanInput = z.infer<
  typeof GeneratePersonalizedStudyPlanInputSchema
>;

const GeneratePersonalizedStudyPlanOutputSchema = z.object({
  studyPlan: z.string().describe('The generated personalized study plan.'),
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
  Based on the user's performance statistics, goals, available resources, and time,
  generate a personalized study plan to help them optimize their study schedule and focus on
  areas where they need the most improvement.

  Performance Statistics: {{{performanceStatistics}}}
  Goals: {{{goals}}}
  Available Resources: {{{availableResources}}}
  Available Time: {{{availableTime}}}

  Study Plan:
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
