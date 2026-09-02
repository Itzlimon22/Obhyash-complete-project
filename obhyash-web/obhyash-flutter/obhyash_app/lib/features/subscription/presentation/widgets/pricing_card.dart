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
        borderRadius: BorderRadius.circular(24),
        color: isBestValue
            ? const Color(0xFF12544F)
            : (isDark
                ? const Color(0xFF2C2C2C)
                : const Color(0xFFE5E7EB)),
      ),
      padding: const EdgeInsets.all(3),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Inner White/Dark Card
          Container(
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF000000) // OLED Black
                  : Colors.white,
              borderRadius: BorderRadius.circular(21),
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
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Icon
                        Container(
                          width: 52,
                          height: 52,
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            color: isBestValue
                                ? const Color(0xFF12544F)
                                : (isDark
                                    ? const Color(0xFF2C2C2C)
                                    : const Color(0xFFF1F5F9)),
                          ),
                          child: Center(
                            child: Icon(
                              isBestValue ? LucideIcons.crown : LucideIcons.zap,
                              color: isBestValue
                                  ? Colors.white
                                  : (isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF525252)),
                              size: 24,
                            ),
                          ),
                        ),

                        // Title
                        Text(
                          plan.name.toUpperCase(),
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(
                                    0xFF737373,
                                  ),
                            letterSpacing: 0.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),

                        // Price
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              plan.currency,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFA3A3A3),
                              ),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              plan.price.toString(),
                              style: TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w600,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF000000),
                                height: 1.0,
                              ),
                            ),
                            if (plan.price > 0 && plan.billingCycle.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(
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
                                    fontSize: 12.5,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(
                                            0xFF737373,
                                          ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Features List
                        ...plan.features.map(
                          (feature) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 18,
                                  height: 18,
                                  margin: const EdgeInsets.only(
                                    right: 10,
                                    top: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isBestValue
                                        ? (isDark
                                              ? const Color(0x4D881337)
                                              : const Color(
                                                  0xFFFEF2F2,
                                                ))
                                        : (isDark
                                              ? const Color(0xFF1C1C1E)
                                              : const Color(
                                                  0xFFF5F5F5,
                                                )),
                                  ),
                                  child: Center(
                                    child: Icon(
                                      LucideIcons.check,
                                      size: 11,
                                      color: isBestValue
                                          ? (isDark
                                                ? const Color(0xFFB91C1C)
                                                : const Color(
                                                    0xFFB91C1C,
                                                  ))
                                          : (isDark
                                                ? const Color(0xFFA3A3A3)
                                                : const Color(
                                                    0xFF525252,
                                                  )),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    feature,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontFamily: 'HindSiliguri',
                                      color: isDark
                                          ? const Color(0xFFD4D4D4)
                                          : const Color(
                                              0xFF27272A,
                                            ),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const Spacer(),
                        const SizedBox(height: 16),

                        // CTA Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: onSelect,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              backgroundColor: const Color(0xFF12544F),
                                foregroundColor: Colors.white,
                                elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                              isCurrent ? 'রিনিউ করো' : 'পেমেন্ট করো',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'HindSiliguri',
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
              top: -12,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF601D49), // Solid Royal Mulberry #601D49
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'সেরা অফার',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      letterSpacing: 0.5,
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
