import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- POST FUNCTION ---
export async function POST(req: Request) {
  try {
    const { question, answer, wrongAnswer } = await req.json();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are a friendly physics teacher. A student answered a question incorrectly.
      Question: "${question}"
      Correct Answer: "${answer}"
      Student's Wrong Answer: "${wrongAnswer}"
      Explain in 2 simple sentences why the correct answer is right.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    return NextResponse.json(
      { explanation },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error: any) {
    console.error('Gemini Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
} // <--- THIS BRACE IS CRITICAL. IT SEPARATES POST FROM OPTIONS.

// --- OPTIONS FUNCTION ---
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}