import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../domain/models.dart';

class PricingCard extends StatelessWidget {
  final SubscriptionPlan plan;
  final bool isCurrent;
  final VoidCallback onSelect;

  const PricingCard({
    super.key,
    required this.plan,
    required this.isCurrent,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Assuming higher priced plan or specific ones are "Best Value"
    final isBestValue = plan.durationDays >= 90;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24), // rounded-3xl
        boxShadow: isBestValue
            ? [
                const BoxShadow(
                  color: Color(0x33F43F5E), // shadow-rose-500/20
                  blurRadius: 24,
                  offset: Offset(0, 4),
                ),
              ]
            : [],
        gradient: isBestValue
            ? const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFFF43F5E),
                  Color(0xFFEF4444),
                  Color(0xFFBE123C),
                ], // rose-500, red-500, rose-700
              )
            : null,
        color: !isBestValue
            ? (isDark
                  ? const Color(0xFF262626)
                  : const Color(0xFFE5E5E5)) // neutral-800 : neutral-200
            : null,
      ),
      padding: const EdgeInsets.all(4), // p-1 for border container effect
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Inner White/Dark Card
          Container(
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF171717)
                  : Colors.white, // neutral-900 : white
              borderRadius: BorderRadius.circular(20), // rounded-[22px]
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                children: [
                  // Background Blobs for Best Value
                  if (isBestValue) ...[
                    Positioned(
                      top: -40,
                      right: -40,
                      child: Container(
                        width: 160,
                        height: 160,
                        decoration: const BoxDecoration(
                          color: Color(0x0DF43F5E), // rose-500/5
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -40,
                      left: -40,
                      child: Container(
                        width: 160,
                        height: 160,
                        decoration: const BoxDecoration(
                          color: Color(0x0DF43F5E), // rose-500/5
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],

                  // Content
                  Padding(
                    padding: const EdgeInsets.all(20), // p-5 sm:p-8
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Icon
                        Container(
                          width: 56,
                          height: 56, // sm:w-14 sm:h-14
                          margin: const EdgeInsets.only(bottom: 16), // mb-4
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(
                              16,
                            ), // sm:rounded-2xl
                            gradient: isBestValue
                                ? const LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Color(0xFFF43F5E),
                                      Color(0xFFDC2626),
                                    ], // rose-500 to red-600
                                  )
                                : null,
                            color: !isBestValue
                                ? (isDark
                                      ? const Color(0xFF262626)
                                      : const Color(
                                          0xFFF5F5F5,
                                        )) // neutral-800 : neutral-100
                                : null,
                            boxShadow: isBestValue
                                ? [
                                    const BoxShadow(
                                      color: Color(0x33F43F5E),
                                      blurRadius: 8,
                                      offset: Offset(0, 2),
                                    ),
                                  ]
                                : [
                                    const BoxShadow(
                                      color: Color(0x0D000000),
                                      blurRadius: 2,
                                      offset: Offset(0, 1),
                                    ),
                                  ],
                          ),
                          child: Center(
                            child: Icon(
                              isBestValue ? LucideIcons.crown : LucideIcons.zap,
                              color: isBestValue
                                  ? Colors.white
                                  : (isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(
                                            0xFF525252,
                                          )), // text-white OR neutral-400 : neutral-600
                              size: 28, // sm:w-7 sm:h-7
                            ),
                          ),
                        ),

                        // Title
                        Text(
                          plan.name.toUpperCase(),
                          style: TextStyle(
                            fontSize: 18, // sm:text-lg
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(
                                    0xFF737373,
                                  ), // neutral-400 : neutral-500
                            letterSpacing: 1, // tracking-wider
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),

                        // Price
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              plan.currency,
                              style: const TextStyle(
                                fontSize: 30, // sm:text-3xl
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFA3A3A3), // neutral-400
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              plan.price.toString(),
                              style: TextStyle(
                                fontSize: 60, // sm:text-6xl
                                fontWeight: FontWeight.w900, // font-black
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF171717), // neutral-900
                                height: 1.0,
                                letterSpacing: -1, // tracking-tighter
                              ),
                            ),
                            if (plan.price > 0 && plan.billingCycle.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(
                                  bottom: 8,
                                  left: 4,
                                ),
                                child: Text(
                                  plan.billingCycle == 'Yearly'
                                      ? '/বছর'
                                      : plan.billingCycle == 'Monthly'
                                      ? '/মাস'
                                      : plan.billingCycle == 'Quarterly'
                                      ? '/৩ মাস'
                                      : '/${plan.billingCycle}',
                                  style: TextStyle(
                                    fontSize: 16, // sm:text-base
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(
                                            0xFF737373,
                                          ), // neutral-400 : neutral-500
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 32), // mb-8
                        // Features List
                        ...plan.features.map(
                          (feature) => Padding(
                            padding: const EdgeInsets.only(bottom: 12), // mb-3
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 20,
                                  height: 20, // sm:w-5 sm:h-5
                                  margin: const EdgeInsets.only(
                                    right: 12,
                                  ), // sm:gap-3
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isBestValue
                                        ? (isDark
                                              ? const Color(0x4D881337)
                                              : const Color(
                                                  0xFFFFE4E6,
                                                )) // rose-900/30 : rose-100
                                        : (isDark
                                              ? const Color(0xFF262626)
                                              : const Color(
                                                  0xFFF5F5F5,
                                                )), // neutral-800 : neutral-100
                                  ),
                                  child: Center(
                                    child: Icon(
                                      LucideIcons.check,
                                      size: 12,
                                      color: isBestValue
                                          ? (isDark
                                                ? const Color(0xFFFB7185)
                                                : const Color(
                                                    0xFFE11D48,
                                                  )) // rose-400 : rose-600
                                          : (isDark
                                                ? const Color(0xFFA3A3A3)
                                                : const Color(
                                                    0xFF525252,
                                                  )), // neutral-400 : neutral-600
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    feature,
                                    style: TextStyle(
                                      fontSize: 14, // sm:text-sm
                                      fontWeight: FontWeight.w500,
                                      color: isDark
                                          ? const Color(0xFFD4D4D4)
                                          : const Color(
                                              0xFF404040,
                                            ), // neutral-300 : neutral-700
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const Spacer(),
                        const SizedBox(height: 16),

                        // Action Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: isCurrent ? null : onSelect,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                vertical: 16,
                              ), // sm:py-4
                              backgroundColor: isCurrent
                                  ? (isDark
                                        ? const Color(0xFF262626)
                                        : const Color(
                                            0xFFF5F5F5,
                                          )) // neutral-800 : neutral-100
                                  : (isDark
                                        ? const Color(0xFF059669)
                                        : const Color(
                                            0xFF047857,
                                          )), // emerald-600 : emerald-700
                              foregroundColor: isCurrent
                                  ? const Color(0xFFA3A3A3) // neutral-400
                                  : Colors.white,
                              elevation: isCurrent ? 0 : 4,
                              shadowColor: isCurrent
                                  ? Colors.transparent
                                  : const Color(
                                      0x4010B981,
                                    ), // shadow-emerald-500/25
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                  12,
                                ), // rounded-xl
                              ),
                            ),
                            child: Text(
                              isCurrent ? 'বর্তমান প্ল্যান' : 'পেমেন্ট করুন',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5, // tracking-wide
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // "Best Offer" Badge Top
          if (isBestValue)
            Positioned(
              top: -12, // -top-3
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ), // px-4 py-1.5
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFFE11D48),
                        Color(0xFFDC2626),
                      ], // rose-600 to red-600
                    ),
                    borderRadius: BorderRadius.circular(24), // rounded-full
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x33000000),
                        blurRadius: 10,
                        offset: Offset(0, 5),
                      ),
                    ], // shadow-lg
                  ),
                  child: const Text(
                    'সেরা অফার 🔥',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12, // text-xs
                      fontWeight: FontWeight.w900, // font-black
                      letterSpacing: 2, // tracking-widest
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
