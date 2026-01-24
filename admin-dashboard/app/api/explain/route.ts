import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- POST FUNCTION ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, answer, wrongAnswer } = body;

    if (!question || !answer || !wrongAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `
You are a friendly physics teacher.
A student answered a question incorrectly.

Question: "${question}"
Correct Answer: "${answer}"
Student's Wrong Answer: "${wrongAnswer}"

Explain in 2 simple sentences why the correct answer is right.
`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text();

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
  } catch (error) {
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
}

// --- OPTIONS FUNCTION (CORS PREFLIGHT) ---
export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
