import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Cookie setting in Server Components is limited
            }
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question, answer, subject } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 },
      );
    }

    // Use Gemini AI to explain the answer
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 },
      );
    }

    const prompt = `আপনি একজন বাংলাদেশী শিক্ষার্থীদের জন্য একজন বিশেষজ্ঞ শিক্ষক। নিচের প্রশ্ন ও উত্তর ব্যাখ্যা করুন।

বিষয়: ${subject || 'সাধারণ'}
প্রশ্ন: ${question}
সঠিক উত্তর: ${answer}

দয়া করে বাংলায় একটি সহজ, স্পষ্ট ব্যাখ্যা দিন যা শিক্ষার্থীদের বুঝতে সাহায্য করবে। ব্যাখ্যাটি ৩-৫ বাক্যের মধ্যে রাখুন।`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const geminiData = await geminiResponse.json();
    const explanation =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'ব্যাখ্যা পাওয়া যায়নি।';

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Explain API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
