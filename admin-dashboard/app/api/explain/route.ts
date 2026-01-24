import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Initialize Gemini with your key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 2. Read the data sent from Flutter
    const { question, answer, wrongAnswer } = await req.json();

    // 3. Select the model (Gemini 1.5 Flash is fast and free)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 4. Create the prompt
    const prompt = `
      You are a friendly physics teacher. A student answered a question incorrectly.
      
      Question: "${question}"
      Correct Answer: "${answer}"
      Student's Wrong Answer: "${wrongAnswer}"
      
      Explain in 2 simple sentences why the correct answer is right. Do not be mean.
    `;

    // 5. Generate the explanation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    // 6. Send it back to Flutter
    return NextResponse.json({ explanation });
  } catch (error: any) {
    console.error('Gemini Error:', error);
    return NextResponse.json(
      { explanation },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // Allow ANY website to talk to this
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      },
    );
  }

  export async function OPTIONS() {
    return NextResponse.json(
      {},
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      },
    );
  }
}
