import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(); // Note: Service role might be needed here if your RLS is very strict, but standard insert works if RLS allows public inserts.

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'দয়া করে একটি সঠিক ইমেইল এড্রেস প্রদান করুন।' },
        { status: 400 },
      );
    }

    // Insert subscriber into database
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.trim().toLowerCase(),
      });

    // Check for unique constraint violation (code 23505 in Postgres means unique violation)
    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'এই ইমেইলটি দিয়ে আপনি আগেই সাবস্ক্রাইব করেছেন!' },
          { status: 409 },
        );
      }
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: 'অভিনন্দন! আপনি সফলভাবে নিউজলেটার সাবস্ক্রাইব করেছেন।',
    });
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: 'সাবস্ক্রাইব করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' },
      { status: 500 },
    );
  }
}
