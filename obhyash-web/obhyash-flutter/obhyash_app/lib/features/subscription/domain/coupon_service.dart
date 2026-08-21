// Coupon system for Obhyash subscription discounts.
// Keep this in sync with the web app's lib/utils/coupon-system.ts

/// A coupon definition.
class Coupon {
  final String code;
  final String name;
  final double discountPercentage;
  final String description;
  final bool isActive;
  final Map<int, int>? fixedPrices; // exact price overrides: {149: 99, 349: 232, 599: 399}

  const Coupon({
    required this.code,
    required this.name,
    required this.discountPercentage,
    required this.description,
    required this.isActive,
    this.fixedPrices,
  });
}

/// Result of applying a coupon.
class AppliedCoupon {
  final String code;
  final String name;
  final double discountPercentage;
  final int discountAmount;
  final int originalPrice;
  final int finalPrice;
  final String description;

  const AppliedCoupon({
    required this.code,
    required this.name,
    required this.discountPercentage,
    required this.discountAmount,
    required this.originalPrice,
    required this.finalPrice,
    required this.description,
  });
}

/// Result object returned by [CouponService.validate].
class CouponResult {
  final bool isValid;
  final AppliedCoupon? appliedCoupon;
  final String? errorMessage;

  const CouponResult.valid(this.appliedCoupon)
      : isValid = true,
        errorMessage = null;

  const CouponResult.invalid(this.errorMessage)
      : isValid = false,
        appliedCoupon = null;
}

/// Built-in coupon registry. Add more coupons here as needed.
const Map<String, Coupon> _activeCoupons = {
  'PIONEER': Coupon(
    code: 'PIONEER',
    name: 'পায়োনিয়ার অফার',
    discountPercentage: 33.56,
    description: '১৪৯ টাকার প্ল্যানে ৫০ টাকা, ৩৪৯ টাকায় ১০০ টাকা ও ৫৯৯ টাকায় ২০০ টাকা ছাড়!',
    isActive: true,
    fixedPrices: {
      149: 99,
      349: 249,
      599: 399,
    },
  ),
  'TEST10': Coupon(
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
  ),
};

/// Service class for coupon validation and price calculation.
class CouponService {
  /// Validates [rawCode] against [originalPrice].
  /// Returns a [CouponResult] with either an [AppliedCoupon] or an error.
  static CouponResult validate(String rawCode, int originalPrice) {
    final code = rawCode.trim().toUpperCase();

    if (code.isEmpty) {
      return const CouponResult.invalid('অনুগ্রহ করে একটি কুপন কোড লিখুন');
    }

    final coupon = _activeCoupons[code];
    if (coupon == null || !coupon.isActive) {
      return const CouponResult.invalid('অকার্যকর বা মেয়াদোত্তীর্ণ কুপন কোড!');
    }

    if (originalPrice <= 0) {
      return CouponResult.valid(
        AppliedCoupon(
          code: coupon.code,
          name: coupon.name,
          discountPercentage: coupon.discountPercentage,
          discountAmount: 0,
          originalPrice: 0,
          finalPrice: 0,
          description: coupon.description,
        ),
      );
    }

    int finalPrice;
    int discountAmount;

    if (coupon.fixedPrices != null && coupon.fixedPrices!.containsKey(originalPrice)) {
      finalPrice = coupon.fixedPrices![originalPrice]!;
      discountAmount = originalPrice - finalPrice;
    } else {
      // Percentage-based discount
      discountAmount = (originalPrice * coupon.discountPercentage / 100).round();
      finalPrice = (originalPrice - discountAmount).clamp(1, originalPrice);
    }

    return CouponResult.valid(
      AppliedCoupon(
        code: coupon.code,
        name: coupon.name,
        discountPercentage: coupon.discountPercentage,
        discountAmount: discountAmount,
        originalPrice: originalPrice,
        finalPrice: finalPrice,
        description: coupon.description,
      ),
    );
  }

  /// Returns the effective price of [originalPrice] given [appliedCoupon].
  /// If no coupon is applied or it's free, returns [originalPrice].
  static int effectivePrice(int originalPrice, AppliedCoupon? appliedCoupon) {
    if (appliedCoupon == null || originalPrice <= 0) return originalPrice;
    final result = validate(appliedCoupon.code, originalPrice);
    return result.appliedCoupon?.finalPrice ?? originalPrice;
  }
}
