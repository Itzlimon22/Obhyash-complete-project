/**
 * Coupon and Discount System for Subscriptions
 */

export interface Coupon {
  code: string;
  name: string;
  discountPercentage: number; // e.g. 33.56 for ~33.56% discount
  description: string;
  isActive: boolean;
  fixedPrices?: Record<number, number>; // exact price overrides for standard tiers: 149 -> 99, 349 -> 232, 599 -> 399
}

export interface AppliedCoupon {
  code: string;
  name: string;
  discountPercentage: number;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  description: string;
}

// Built-in coupons list
export const ACTIVE_COUPONS: Record<string, Coupon> = {
  PIONEER: {
    code: 'PIONEER',
    name: 'পায়োনিয়ার অফার (Pioneer Discount)',
    discountPercentage: 33.56,
    description: '১৪৯ টাকার প্ল্যানে ৫০ টাকা, ৩৪৯ টাকায় ১০০ টাকা ও ৫৯৯ টাকায় ২০০ টাকা ছাড়!',
    isActive: true,
    fixedPrices: {
      149: 99,
      349: 249,
      599: 399,
    },
  },
  TEST10: {
    code: 'TEST10',
    name: 'টেস্ট পেমেন্ট অফার',
    discountPercentage: 95.0,
    description: 'যেকোনো প্যাকেজের দাম মাত্র ১০ টাকা (টেস্টিং উদ্দেশ্যে)',
    isActive: true,
    fixedPrices: {
      149: 10,
      249: 10,
      349: 10,
      599: 10,
      999: 10,
    },
  },
};

/**
 * Validates and calculates discount for a given coupon code and original price.
 */
export function calculateCouponDiscount(
  rawCode: string,
  originalPrice: number,
): {
  isValid: boolean;
  coupon?: Coupon;
  appliedCoupon?: AppliedCoupon;
  errorMessage?: string;
} {
  const code = (rawCode || '').trim().toUpperCase();

  if (!code) {
    return {
      isValid: false,
      errorMessage: 'অনুগ্রহ করে একটি কুপন কোড লিখুন',
    };
  }

  const coupon = ACTIVE_COUPONS[code];

  if (!coupon || !coupon.isActive) {
    return {
      isValid: false,
      errorMessage: 'অকার্যকর বা মেয়াদোত্তীর্ণ কুপন কোড!',
    };
  }

  if (originalPrice <= 0) {
    return {
      isValid: true,
      coupon,
      appliedCoupon: {
        code: coupon.code,
        name: coupon.name,
        discountPercentage: coupon.discountPercentage,
        discountAmount: 0,
        originalPrice: 0,
        finalPrice: 0,
        description: coupon.description,
      },
    };
  }

  // Check if there is an exact fixed price override for standard price points
  let finalPrice = originalPrice;
  let discountAmount = 0;

  if (coupon.fixedPrices && coupon.fixedPrices[originalPrice] !== undefined) {
    finalPrice = coupon.fixedPrices[originalPrice];
    discountAmount = originalPrice - finalPrice;
  } else {
    // Percentage calculation
    discountAmount = Math.round((originalPrice * coupon.discountPercentage) / 100);
    finalPrice = Math.max(1, originalPrice - discountAmount);
  }

  return {
    isValid: true,
    coupon,
    appliedCoupon: {
      code: coupon.code,
      name: coupon.name,
      discountPercentage: coupon.discountPercentage,
      discountAmount,
      originalPrice,
      finalPrice,
      description: coupon.description,
    },
  };
}
