import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../domain/models.dart';

class BillingHistoryCard extends StatelessWidget {
  final List<Invoice> invoices;
  final Function(Invoice) onDownload;

  const BillingHistoryCard({
    super.key,
    required this.invoices,
    required this.onDownload,
  });

  Widget _getStatusBadge(String status, bool isDark) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case 'paid':
      case 'valid':
        bgColor = isDark
            ? const Color(0x4D064E3B)
            : const Color(0xFFD1FAE5); // emerald-900/30 : emerald-100
        textColor = isDark
            ? const Color(0xFF34D399)
            : const Color(0xFF047857); // emerald-400 : emerald-700
        label = status == 'paid' ? 'পরিশোধিত' : 'Valid';
        break;
      case 'pending':
      case 'checking':
        bgColor = isDark
            ? const Color(0x4D78350F)
            : const Color(0xFFFEF3C7); // amber-900/30 : amber-100
        textColor = isDark
            ? const Color(0xFFFBBF24)
            : const Color(0xFFB45309); // amber-400 : amber-700
        label = status == 'pending' ? 'অপেক্ষমাণ' : 'Checking';
        break;
      case 'failed':
      case 'rejected':
        bgColor = isDark
            ? const Color(0x4D7F1D1D)
            : const Color(0xFFFEE2E2); // red-900/30 : red-100
        textColor = isDark
            ? const Color(0xFFF87171)
            : const Color(0xFFB91C1C); // red-400 : red-700
        label = status == 'failed' ? 'ব্যর্থ' : 'Rejected';
        break;
      default:
        bgColor = isDark
            ? const Color(0x4D262626)
            : const Color(0xFFF5F5F5); // neutral-900/30 : neutral-100
        textColor = isDark
            ? const Color(0xFFA3A3A3)
            : const Color(0xFF525252); // neutral-400 : neutral-600
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 2,
      ), // px-2 py-0.5
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16), // rounded-full
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
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
              children: [
                Icon(
                  LucideIcons.receipt,
                  size: 20, // w-5 h-5
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFFA3A3A3), // neutral-400
                ),
                const SizedBox(width: 8), // gap-2
                Text(
                  'বিলিং ইতিহাস',
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
          ),

          // Content
          if (invoices.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 48,
                horizontal: 24,
              ), // py-12 px-6
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFFAFAFA), // neutral-800 : neutral-50
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Icon(
                        LucideIcons.fileText,
                        size: 32,
                        color: isDark
                            ? const Color(0xFF525252)
                            : const Color(
                                0xFFD4D4D4,
                              ), // neutral-600 : neutral-300
                      ),
                    ),
                  ),
                  Text(
                    'কোনো বিল নেই',
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
                    'আপনার পেমেন্ট ইতিহাস এখানে দেখা যাবে।',
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
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: invoices.length,
              separatorBuilder: (context, index) => Divider(
                height: 1,
                thickness: 1,
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFF5F5F5), // neutral-800 : neutral-100
              ),
              itemBuilder: (context, index) {
                final inv = invoices[index];
                return Padding(
                  padding: const EdgeInsets.all(16), // p-4
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Left
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    inv.planName,
                                    style: TextStyle(
                                      fontSize: 14, // text-sm
                                      fontWeight: FontWeight.bold,
                                      color: isDark
                                          ? Colors.white
                                          : const Color(
                                              0xFF171717,
                                            ), // white : neutral-900
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 8), // gap-2
                                _getStatusBadge(inv.status, isDark),
                              ],
                            ),
                            const SizedBox(height: 2), // mb-0.5
                            Text(
                              inv.date,
                              style: TextStyle(
                                fontSize: 12, // text-xs
                                color: isDark
                                    ? const Color(0xFFA3A3A3)
                                    : const Color(
                                        0xFF737373,
                                      ), // neutral-400 : neutral-500
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Right
                      Row(
                        children: [
                          Text(
                            '${inv.currency}${inv.amount}',
                            style: TextStyle(
                              fontSize: 14, // text-sm
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? Colors.white
                                  : const Color(
                                      0xFF171717,
                                    ), // white : neutral-900
                            ),
                          ),
                          const SizedBox(width: 16), // gap-4
                          if (inv.status == 'paid' || inv.status == 'valid')
                            IconButton(
                              onPressed: () => onDownload(inv),
                              icon: const Icon(
                                LucideIcons.download,
                                size: 16,
                              ), // w-4 h-4
                              color: const Color(0xFFA3A3A3), // neutral-400
                              tooltip: 'ডাউনলোড',
                              style:
                                  IconButton.styleFrom(
                                    padding: const EdgeInsets.all(8), // p-2
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ).copyWith(
                                    foregroundColor:
                                        WidgetStateProperty.resolveWith((
                                          states,
                                        ) {
                                          if (states.contains(
                                            WidgetState.hovered,
                                          )) {
                                            return isDark
                                                ? const Color(0xFF34D399)
                                                : const Color(
                                                    0xFF059669,
                                                  ); // emerald-400 : emerald-600
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
                                                ? const Color(0x33064E3B)
                                                : const Color(0xFFECFDF5);
                                          }
                                          return null;
                                        }),
                                  ),
                            ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
