
'use server';
/**
 * @fileOverview A Genkit flow for generating admin content suggestions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdminContentSuggestionsInputSchema = z.object({
  userPrompt: z.string().describe('A brief prompt from the user describing the desired content.'),
  contentType: z.enum(['task', 'meeting']).describe('The type of content to generate.'),
});
export type AdminContentSuggestionsInput = z.infer<typeof AdminContentSuggestionsInputSchema>;

const AdminContentSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of generated content suggestions.'),
  type: z.enum(['task', 'meeting']).describe('The type of content generated.'),
});
export type AdminContentSuggestionsOutput = z.infer<typeof AdminContentSuggestionsOutputSchema>;

export async function generateAdminContentSuggestions(input: AdminContentSuggestionsInput): Promise<AdminContentSuggestionsOutput> {
  return generateAdminContentSuggestionsFlow(input);
}

const adminContentPrompt = ai.definePrompt({
  name: 'adminContentPrompt',
  input: { schema: AdminContentSuggestionsInputSchema },
  output: { schema: AdminContentSuggestionsOutputSchema },
  prompt: `You are a professional assistant for the Veil Confessions security team.
Based on the user's prompt: "{{{userPrompt}}}", generate a list of suggestions for a {{contentType}}.

If 'task', provide 4 actionable project task titles.
If 'meeting', provide 4 concise agenda points.

Return JSON matching the schema.`,
});

const generateAdminContentSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateAdminContentSuggestionsFlow',
    inputSchema: AdminContentSuggestionsInputSchema,
    outputSchema: AdminContentSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await adminContentPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate suggestions.');
    }
    return output;
  },
);
