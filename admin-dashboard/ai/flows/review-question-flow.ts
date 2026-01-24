import { QuestionFormData } from '@/lib/types';

/**
 * Sends a question to your Supabase Edge Function which 
 * interacts with Gemini 1.5 Flash to verify accuracy.
 */
export async function reviewQuestionWithAI({ question }: { question: QuestionFormData }) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/review-question-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ question })
    });

    if (!response.ok) throw new Error('AI Review failed');
    
    return await response.json();
  } catch (error) {
    console.error("AI Review Error:", error);
    throw error;
  }
}