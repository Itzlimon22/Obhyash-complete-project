import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../domain/models.dart';

class PaymentMethodsCard extends StatelessWidget {
  final List<PaymentMethod> methods;
  final VoidCallback onAddMethod;
  final Function(String) onDelete;

  const PaymentMethodsCard({
    super.key,
    required this.methods,
    required this.onAddMethod,
    required this.onDelete,
  });

  Widget _getMethodIcon(String type, bool isDark) {
    if (type == 'bkash') {
      return Container(
        width: 32,
        height: 32, // w-8 h-8
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8), // rounded-lg
          gradient: const LinearGradient(
            colors: [
              Color(0xFFEC4899),
              Color(0xFFDB2777),
            ], // pink-500 to pink-600
          ),
          boxShadow: const [BoxShadow(color: Color(0x1a000000), blurRadius: 4)],
        ),
        child: const Center(
          child: Text(
            'bK',
            style: TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w900,
            ), // font-black
          ),
        ),
      );
    }
    if (type == 'nagad') {
      return Container(
        width: 32,
        height: 32, // w-8 h-8
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8), // rounded-lg
          gradient: const LinearGradient(
            colors: [
              Color(0xFFF97316),
              Color(0xFFEA580C),
            ], // orange-500 to orange-600
          ),
          boxShadow: const [BoxShadow(color: Color(0x1a000000), blurRadius: 4)],
        ),
        child: const Center(
          child: Text(
            'N',
            style: TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w900,
            ), // font-black
          ),
        ),
      );
    }
    return Container(
      width: 32,
      height: 32, // w-8 h-8
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF262626)
            : const Color(0xFFF5F5F5), // neutral-800 : neutral-100
        borderRadius: BorderRadius.circular(8), // rounded-lg
      ),
      child: const Center(
        child: Icon(
          LucideIcons.creditCard,
          size: 16,
          color: Color(0xFF737373),
        ), // w-4 h-4 text-neutral-500
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF171717)
            : Colors.white, // neutral-900 : white
        borderRadius: BorderRadius.circular(16), // rounded-2xl
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
        ), // neutral-800 : neutral-100
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20), // p-4 md:p-5
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFF5F5F5),
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      LucideIcons.wallet,
                      size: 20, // w-5 h-5
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFFA3A3A3), // neutral-400
                    ),
                    const SizedBox(width: 8), // gap-2
                    Text(
                      'পেমেন্ট মেথড',
                      style: TextStyle(
                        fontSize: 16, // text-base
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? Colors.white
                            : const Color(0xFF262626), // white : neutral-800
                      ),
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: onAddMethod,
                  icon: const Icon(
                    LucideIcons.plus,
                    size: 14,
                  ), // hover:text-emerald-600
                  label: const Text(
                    'যুক্ত করুন',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  style:
                      TextButton.styleFrom(
                        foregroundColor: isDark
                            ? const Color(0xFF34D399)
                            : const Color(
                                0xFF059669,
                              ), // text-emerald-400 : text-emerald-600
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ), // px-3 py-1.5
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ).copyWith(
                        overlayColor: WidgetStateProperty.resolveWith((states) {
                          if (states.contains(WidgetState.hovered)) {
                            return isDark
                                ? const Color(0x33064E3B)
                                : const Color(0xFFECFDF5);
                          }
                          return null;
                        }),
                      ),
                ),
              ],
            ),
          ),

          // Content
          if (methods.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 40,
                horizontal: 24,
              ), // py-10 px-6
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 56,
                    height: 56, // w-14 h-14
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFFAFAFA), // neutral-800 : neutral-50
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Icon(
                        LucideIcons.wallet,
                        size: 28, // w-7 h-7
                        color: isDark
                            ? const Color(0xFF525252)
                            : const Color(
                                0xFFD4D4D4,
                              ), // neutral-600 : neutral-300
                      ),
                    ),
                  ),
                  Text(
                    'কোনো মেথড নেই',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: isDark
                          ? const Color(0xFFD4D4D4)
                          : const Color(
                              0xFF404040,
                            ), // neutral-300 : neutral-700
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'bKash বা Nagad যুক্ত করুন সহজ পেমেন্টের জন্য।',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(
                              0xFF737373,
                            ), // neutral-400 : neutral-500
                    ),
                  ),
                ],
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.all(12), // p-3
              child: Column(
                children: methods
                    .map(
                      (method) => Padding(
                        padding: const EdgeInsets.only(
                          bottom: 8,
                        ), // space-y-2 -> padding bottom
                        child: Container(
                          padding: const EdgeInsets.all(12), // p-3
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0x4D262626)
                                : const Color(
                                    0x80FAFAFA,
                                  ), // bg-neutral-800/30 : bg-neutral-50/50
                            borderRadius: BorderRadius.circular(
                              12,
                            ), // rounded-xl
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFF5F5F5),
                            ), // border-neutral-800 : border-neutral-100
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // Left Profile
                              Row(
                                children: [
                                  _getMethodIcon(method.type, isDark),
                                  const SizedBox(width: 12), // gap-3
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        method.type == 'card'
                                            ? 'Visa •••• ${method.last4}'
                                            : (method.type == 'bkash'
                                                  ? 'bKash'
                                                  : 'Nagad'),
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: isDark
                                              ? Colors.white
                                              : const Color(
                                                  0xFF262626,
                                                ), // white : neutral-800
                                        ),
                                      ),
                                      if (method.number != null ||
                                          method.expiry != null)
                                        Text(
                                          method.number ??
                                              'Exp: ${method.expiry}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: isDark
                                                ? const Color(0xFFA3A3A3)
                                                : const Color(
                                                    0xFF737373,
                                                  ), // neutral-400 : neutral-500
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),

                              // Right actions
                              Row(
                                children: [
                                  if (method.isDefault) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ), // px-2 py-0.5
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? const Color(0x4D064E3B)
                                            : const Color(
                                                0xFFD1FAE5,
                                              ), // emerald-900/30 : emerald-100
                                        borderRadius: BorderRadius.circular(
                                          16,
                                        ), // rounded-full
                                      ),
                                      child: Text(
                                        'DEFAULT',
                                        style: TextStyle(
                                          fontSize: 9, // text-[9px]
                                          fontWeight: FontWeight.bold,
                                          color: isDark
                                              ? const Color(0xFF34D399)
                                              : const Color(
                                                  0xFF059669,
                                                ), // text-emerald-400 : text-emerald-600
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8), // gap-2
                                  ],
                                  IconButton(
                                    onPressed: () => onDelete(method.id),
                                    icon: const Icon(
                                      LucideIcons.trash2,
                                      size: 14,
                                    ), // w-3.5 h-3.5
                                    color: const Color(
                                      0xFFA3A3A3,
                                    ), // neutral-400
                                    tooltip: 'মুছে ফেলুন',
                                    style:
                                        IconButton.styleFrom(
                                          padding: const EdgeInsets.all(
                                            6,
                                          ), // p-1.5
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                        ).copyWith(
                                          foregroundColor:
                                              WidgetStateProperty.resolveWith((
                                                states,
                                              ) {
                                                if (states.contains(
                                                  WidgetState.hovered,
                                                )) {
                                                  return const Color(
                                                    0xFFEF4444,
                                                  ); // text-red-500
                                                }
                                                return null;
                                              }),
                                          overlayColor:
                                              WidgetStateProperty.resolveWith((
                                                states,
                                              ) {
                                                if (states.contains(
                                                  WidgetState.hovered,
                                                )) {
                                                  return isDark
                                                      ? const Color(0x337F1D1D)
                                                      : const Color(0xFFFEF2F2);
                                                }
                                                return null;
                                              }),
                                        ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }
}
