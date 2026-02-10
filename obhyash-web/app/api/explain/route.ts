import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---------------- POST ----------------
export const POST = async (req: Request) => {
  // 1. Check Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 },
    );
  }

  try {
    const { question, answer, wrongAnswer } = await req.json();

    if (!question || !answer || !wrongAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `
You are a friendly physics teacher.

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
      },
    );
  } catch (err) {
    console.error('Gemini Error:', err);

    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 },
    );
  }
};

// ---------------- OPTIONS (CORS) ----------------
const OPTIONS = () => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

// ✅ EXPORTS (THIS IS THE MAGIC FIX)
export { POST, OPTIONS };
