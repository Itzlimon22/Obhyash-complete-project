import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// A coupon definition.
class Coupon {
  final String code;
  final String name;
  final double discountPercentage;
  final String description;
  final bool isActive;
  final Map<int, int>? fixedPrices; // exact price overrides: {149: 99, 349: 249, 599: 399}
  final DateTime? expiresAt;
  final int? maxUses;
  final int usedCount;

  const Coupon({
    required this.code,
    required this.name,
    required this.discountPercentage,
    required this.description,
    required this.isActive,
    this.fixedPrices,
    this.expiresAt,
    this.maxUses,
    this.usedCount = 0,
  });

  factory Coupon.fromJson(Map<String, dynamic> json) {
    Map<int, int>? fixed;
    if (json['fixed_prices'] is Map) {
      final rawMap = json['fixed_prices'] as Map;
      final parsed = <int, int>{};
      rawMap.forEach((k, v) {
        final keyInt = int.tryParse(k.toString());
        final valInt = int.tryParse(v.toString());
        if (keyInt != null && valInt != null) {
          parsed[keyInt] = valInt;
        }
      });
      if (parsed.isNotEmpty) fixed = parsed;
    }

    DateTime? exp;
    if (json['expires_at'] != null) {
      exp = DateTime.tryParse(json['expires_at'].toString());
    }

    final double pct = (json['discount_percentage'] is num)
        ? (json['discount_percentage'] as num).toDouble()
        : double.tryParse(json['discount_percentage']?.toString() ?? '0') ?? 0.0;

    final codeUpper = (json['code']?.toString() ?? '').trim().toUpperCase();

    return Coupon(
      code: codeUpper,
      name: json['name']?.toString() ?? 'অফার কুপন ($codeUpper)',
      discountPercentage: pct,
      description: json['description']?.toString() ??
          (fixed != null
              ? 'বিশেষ ডিসকাউন্ট অফার!'
              : '$pct% মূল্য ছাড়!'),
      isActive: json['is_active'] == true,
      fixedPrices: fixed,
      expiresAt: exp,
      maxUses: json['max_uses'] != null ? int.tryParse(json['max_uses'].toString()) : null,
      usedCount: json['used_count'] != null ? int.tryParse(json['used_count'].toString()) ?? 0 : 0,
    );
  }
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
  final Map<int, int>? fixedPrices;

  const AppliedCoupon({
    required this.code,
    required this.name,
    required this.discountPercentage,
    required this.discountAmount,
    required this.originalPrice,
    required this.finalPrice,
    required this.description,
    this.fixedPrices,
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

/// Built-in fallback registry in case device is completely offline.
const Map<String, Coupon> _fallbackCoupons = {
  'AHAMZA': Coupon(
    code: 'AHAMZA',
    name: 'আমির (HSC 27) অ্যাম্বাসেডর অফার',
    discountPercentage: 33.56,
    description: '১৪৯ টাকার প্ল্যানে ৫০ টাকা, ৩৪৯ টাকায় ১০০ টাকা ও ৫৯৯ টাকায় ২০০ টাকা ছাড়!',
    isActive: true,
    fixedPrices: {
      149: 99,
      349: 249,
      599: 399,
    },
  ),
  'AMIR33': Coupon(
    code: 'AMIR33',
    name: 'অ্যাম্বাসেডর অফার (AMIR33)',
    discountPercentage: 33.56,
    description: '১৪৯ টাকার প্ল্যানে ৫০ টাকা, ৩৪৯ টাকায় ১০০ টাকা ও ৫৯৯ টাকায় ২০০ টাকা ছাড়!',
    isActive: false,
    fixedPrices: {
      149: 99,
      349: 249,
      599: 399,
    },
  ),
  'PIONEER': Coupon(
    code: 'PIONEER',
    name: 'পায়োনিয়ার অফার',
    discountPercentage: 33.56,
    description: '১৪৯ টাকার প্ল্যানে ৫০ টাকা, ৩৪৯ টাকায় ১০০ টাকা ও ৫৯৯ টাকায় ২০০ টাকা ছাড়!',
    isActive: false,
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

/// Service class for dynamic coupon validation and price calculation.
/// Fetches coupons dynamically from Supabase `coupons` table in real time,
/// ensuring zero app updates are needed when coupons change.
class CouponService {
  /// In-memory cache of validated coupons to avoid repeated network roundtrips.
  static final Map<String, Coupon> _cachedRemoteCoupons = {};

  /// Asynchronously validates [rawCode] against [originalPrice].
  /// Queries Supabase remote database in real-time with offline fallback.
  static Future<CouponResult> validate(String rawCode, int originalPrice) async {
    final code = rawCode.trim().toUpperCase();

    if (code.isEmpty) {
      return const CouponResult.invalid('অনুগ্রহ করে একটি কুপন কোড লিখুন');
    }

    // 1. Try fetching from Supabase `coupons` table
    try {
      final supabase = Supabase.instance.client;
      final res = await supabase
          .from('coupons')
          .select()
          .eq('code', code)
          .maybeSingle();

      if (res != null) {
        final coupon = Coupon.fromJson(res);
        _cachedRemoteCoupons[code] = coupon;
        return _evaluateCoupon(coupon, originalPrice);
      }
    } catch (e) {
      debugPrint('[CouponService] Remote validation error: $e');
      // If network failed and we have it in memory cache, evaluate cache
      if (_cachedRemoteCoupons.containsKey(code)) {
        return _evaluateCoupon(_cachedRemoteCoupons[code]!, originalPrice);
      }
    }

    // 2. Check offline fallback registry
    if (_fallbackCoupons.containsKey(code)) {
      return _evaluateCoupon(_fallbackCoupons[code]!, originalPrice);
    }

    return const CouponResult.invalid('অকার্যকর বা ভুল কুপন কোড!');
  }

  /// Synchronous fallback evaluation (used for initial state or cached coupons).
  static CouponResult validateSync(String rawCode, int originalPrice) {
    final code = rawCode.trim().toUpperCase();

    if (code.isEmpty) {
      return const CouponResult.invalid('অনুগ্রহ করে একটি কুপন কোড লিখুন');
    }

    if (_cachedRemoteCoupons.containsKey(code)) {
      return _evaluateCoupon(_cachedRemoteCoupons[code]!, originalPrice);
    }

    if (_fallbackCoupons.containsKey(code)) {
      return _evaluateCoupon(_fallbackCoupons[code]!, originalPrice);
    }

    return const CouponResult.invalid('অকার্যকর কুপন কোড!');
  }

  /// Evaluates business rules for a given [Coupon].
  static CouponResult _evaluateCoupon(Coupon coupon, int originalPrice) {
    if (!coupon.isActive) {
      return const CouponResult.invalid('এই কুপনটি বর্তমানে স্থগিত বা অকার্যকর!');
    }

    if (coupon.expiresAt != null && coupon.expiresAt!.isBefore(DateTime.now())) {
      return const CouponResult.invalid('এই কুপন কোডের মেয়াদ শেষ হয়ে গেছে!');
    }

    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses!) {
      return const CouponResult.invalid('এই কুপনের সর্বোচ্চ ব্যবহারের সীমা পূর্ণ হয়েছে!');
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
          fixedPrices: coupon.fixedPrices,
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
        fixedPrices: coupon.fixedPrices,
      ),
    );
  }

  /// Returns the effective price of [originalPrice] given [appliedCoupon].
  /// If no coupon is applied or price is 0, returns [originalPrice].
  static int effectivePrice(int originalPrice, AppliedCoupon? appliedCoupon) {
    if (appliedCoupon == null || originalPrice <= 0) return originalPrice;

    // Check fixed price override in appliedCoupon
    if (appliedCoupon.fixedPrices != null &&
        appliedCoupon.fixedPrices!.containsKey(originalPrice)) {
      return appliedCoupon.fixedPrices![originalPrice]!;
    }

    // Check cached coupon if available
    final cached = _cachedRemoteCoupons[appliedCoupon.code];
    if (cached?.fixedPrices != null && cached!.fixedPrices!.containsKey(originalPrice)) {
      return cached.fixedPrices![originalPrice]!;
    }

    // Fallback registry fixed price
    final fallback = _fallbackCoupons[appliedCoupon.code];
    if (fallback?.fixedPrices != null && fallback!.fixedPrices!.containsKey(originalPrice)) {
      return fallback.fixedPrices![originalPrice]!;
    }

    // Percentage discount
    if (appliedCoupon.discountPercentage > 0) {
      final discount = (originalPrice * appliedCoupon.discountPercentage / 100).round();
      return (originalPrice - discount).clamp(1, originalPrice);
    }

    // Direct discount amount fallback
    if (appliedCoupon.originalPrice > 0 && appliedCoupon.discountAmount > 0) {
      return (originalPrice - appliedCoupon.discountAmount).clamp(1, originalPrice);
    }

    return originalPrice;
  }
}
