import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { ACTIVE_COUPONS } from '@/lib/utils/coupon-system';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, originalPrice = 149 } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { isValid: false, errorMessage: 'অনুগ্রহ করে একটি কুপন কোড লিখুন' },
        { status: 400 },
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();

    // 1. Check in database coupons table
    const { data: dbCoupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (dbCoupon && dbCoupon.is_active) {
      // Check expiration
      if (dbCoupon.expires_at && new Date(dbCoupon.expires_at) < now) {
        return NextResponse.json({
          isValid: false,
          errorMessage: 'এই কুপন কোডের মেয়াদ শেষ হয়ে গেছে!',
        });
      }

      // Check max uses
      if (dbCoupon.max_uses && dbCoupon.used_count >= dbCoupon.max_uses) {
        return NextResponse.json({
          isValid: false,
          errorMessage: 'এই কুপনের সর্বোচ্চ ব্যবহারের সীমা পূর্ণ হয়েছে!',
        });
      }

      const numPrice = Number(originalPrice) || 0;
      let finalPrice = numPrice;
      let discountAmount = 0;
      const fixedPrices = dbCoupon.fixed_prices || {};

      if (fixedPrices[numPrice] !== undefined) {
        finalPrice = Number(fixedPrices[numPrice]);
        discountAmount = numPrice - finalPrice;
      } else {
        const pct = Number(dbCoupon.discount_percentage) || 0;
        discountAmount = Math.round((numPrice * pct) / 100);
        finalPrice = Math.max(1, numPrice - discountAmount);
      }

      return NextResponse.json({
        isValid: true,
        coupon: {
          code: dbCoupon.code,
          name: dbCoupon.name,
          discountPercentage: dbCoupon.discount_percentage,
          description: `${dbCoupon.name} - বিশেষ ছাড়`,
          isActive: true,
          fixedPrices: dbCoupon.fixed_prices,
        },
        appliedCoupon: {
          code: dbCoupon.code,
          name: dbCoupon.name,
          discountPercentage: dbCoupon.discount_percentage,
          discountAmount,
          originalPrice: numPrice,
          finalPrice,
          description: `${dbCoupon.name} - বিশেষ ছাড়`,
        },
      });
    }

    // 2. Fallback to static ACTIVE_COUPONS
    const staticCoupon = ACTIVE_COUPONS[cleanCode];
    if (staticCoupon && staticCoupon.isActive) {
      const numPrice = Number(originalPrice) || 0;
      let finalPrice = numPrice;
      let discountAmount = 0;

      if (staticCoupon.fixedPrices && staticCoupon.fixedPrices[numPrice] !== undefined) {
        finalPrice = staticCoupon.fixedPrices[numPrice];
        discountAmount = numPrice - finalPrice;
      } else {
        discountAmount = Math.round((numPrice * staticCoupon.discountPercentage) / 100);
        finalPrice = Math.max(1, numPrice - discountAmount);
      }

      return NextResponse.json({
        isValid: true,
        coupon: staticCoupon,
        appliedCoupon: {
          code: staticCoupon.code,
          name: staticCoupon.name,
          discountPercentage: staticCoupon.discountPercentage,
          discountAmount,
          originalPrice: numPrice,
          finalPrice,
          description: staticCoupon.description,
        },
      });
    }

    return NextResponse.json({
      isValid: false,
      errorMessage: 'অকার্যকর বা মেয়াদোত্তীর্ণ কুপন কোড!',
    });
  } catch (err: any) {
    return NextResponse.json(
      { isValid: false, errorMessage: 'কুপন যাচাইকরণে ত্রুটি হয়েছে' },
      { status: 500 },
    );
  }
}
