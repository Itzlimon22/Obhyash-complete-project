import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      age,
      education,
      payoutNumber,
      paymentMethod = 'bKash',
      password,
      promotionPlan,
      promotionChannels,
      socialLinks,
      hasExperience,
      motivation,
      agreedTerms,
    } = body || {};

    // Validate required fields
    if (!fullName?.trim()) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।' },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে আপনার সক্রিয় হোয়াটসঅ্যাপ মোবাইল নম্বর দিন।' },
        { status: 400 }
      );
    }

    if (!payoutNumber?.trim()) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে পেমেন্ট গ্রহণের জন্য বিকাশ নম্বর দিন।' },
        { status: 400 }
      );
    }

    if (agreedTerms === false) {
      return NextResponse.json(
        { error: 'অ্যাফিলিয়েট প্রোগ্রামে আবেদনের জন্য নীতিমালা ও শর্তাবলীতে সম্মত হতে হবে।' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const passwordHash = password ? hashPassword(password) : null;

    const payload = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      age: age ? String(age).trim() : null,
      education: education?.trim() || null,
      payout_number: payoutNumber.trim(),
      payment_method: paymentMethod || 'bKash',
      password_hash: passwordHash,
      promotion_plan: promotionPlan?.trim() || null,
      promotion_channels: promotionChannels?.trim() || null,
      social_links: socialLinks?.trim() || null,
      has_experience: Boolean(hasExperience),
      motivation: motivation?.trim() || null,
      agreed_terms: agreedTerms !== false,
      status: 'Pending',
      metadata: {
        submitted_at: new Date().toISOString(),
        raw_age: age || null,
        raw_education: education || null,
        has_password: Boolean(password),
      },
    };

    const { data, error } = await supabase
      .from('affiliate_applications')
      .insert(payload)
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Supabase affiliate_applications insert error:', error);
      return NextResponse.json(
        { error: `আবেদন জমা দিতে সমস্যা হয়েছে: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'আপনার অ্যাফিলিয়েট আবেদন সফলভাবে জমা হয়েছে! আমাদের টিম রিভিউ করে শীঘ্রই আপনার সাথে হোয়াটসঅ্যাপে যোগাযোগ করবে।',
      id: data?.id,
    });
  } catch (err: any) {
    console.error('Affiliate register API fatal error:', err);
    return NextResponse.json(
      { error: err?.message || 'সার্ভারে অভ্যন্তরীণ ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
};
