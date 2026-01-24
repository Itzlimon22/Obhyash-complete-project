import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { question } = await req.json();

  const prompt = `
    Review this question for accuracy:
    Question: ${question.question}
    Options: ${question.options.join(', ')}
    Current Answer: ${question.answer}

    Task:
    1. Verify if the correct answer is indeed ${question.answer}.
    2. Format the explanation to use proper LaTeX for chemical or math symbols.
    3. Ensure the Bangla grammar is professional.
    
    Return ONLY JSON: { "isCorrect": boolean, "suggestedAnswer": string, "formattedExplanation": string }
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
    method: 'POST',
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
})