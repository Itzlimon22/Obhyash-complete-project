import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../domain/coupon_service.dart';

/// Reusable modal bottom sheet for entering and applying subscription coupon codes.
class CouponBottomSheet extends StatefulWidget {
  final AppliedCoupon? appliedCoupon;
  final void Function(String code) onApply;
  final VoidCallback onRemove;
  final int? planPrice;

  const CouponBottomSheet({
    super.key,
    required this.appliedCoupon,
    required this.onApply,
    required this.onRemove,
    this.planPrice,
  });

  /// Helper static method to show this bottom sheet easily anywhere.
  static Future<void> show({
    required BuildContext context,
    required AppliedCoupon? appliedCoupon,
    required void Function(String code) onApply,
    required VoidCallback onRemove,
    int? planPrice,
  }) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (_) => CouponBottomSheet(
        appliedCoupon: appliedCoupon,
        onApply: onApply,
        onRemove: onRemove,
        planPrice: planPrice,
      ),
    );
  }

  @override
  State<CouponBottomSheet> createState() => _CouponBottomSheetState();
}

class _CouponBottomSheetState extends State<CouponBottomSheet> {
  late final TextEditingController _controller;
  String _errorText = '';

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _tryApply(String code) {
    final trimmed = code.trim().toUpperCase();
    if (trimmed.isEmpty) {
      setState(() => _errorText = 'কুপন কোড লিখুন');
      return;
    }
    setState(() => _errorText = '');
    widget.onApply(trimmed);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final border = isDark ? const Color(0xFF2C2C2E) : const Color(0xFFE2E8F0);
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final subColor = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: BoxDecoration(
            color: bg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF3A3A3C) : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Biggest Heading Text
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF052E1B) : const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark ? const Color(0xFF16A34A) : const Color(0xFFBBF7D0),
                    ),
                  ),
                  child: const Icon(LucideIcons.tag, size: 18, color: Color(0xFF16A34A)),
                ),
                const SizedBox(width: 12),
                Text(
                  'কুপন কোড প্রয়োগ করো',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'HindSiliguri',
                    color: textColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            if (widget.appliedCoupon != null) ...[
              // Active coupon display
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF052E1B) : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? const Color(0xFF16A34A) : const Color(0xFFBBF7D0),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.checkCircle2, size: 18, color: Color(0xFF16A34A)),
                        const SizedBox(width: 8),
                        Text(
                          widget.appliedCoupon!.code,
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                            color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633),
                            letterSpacing: 1.2,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF16A34A),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'সক্রিয়',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'HindSiliguri',
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.appliedCoupon!.description,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? const Color(0xFF86EFAC) : const Color(0xFF16A34A),
                      ),
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        icon: const Icon(LucideIcons.x, size: 16, color: Color(0xFF991B1B)),
                        label: const Text(
                          'কুপন বাতিল / রিমুভ করো',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF991B1B),
                          ),
                        ),
                        onPressed: widget.onRemove,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: Color(0xFFFCA5A5)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Text Box (pre-filled with PIONEER)
              TextField(
                controller: _controller,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  hintText: 'যেমন: PIONEER',
                  hintStyle: TextStyle(
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white30 : Colors.black26,
                  ),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF27272A) : const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: border),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderRadius: BorderRadius.all(Radius.circular(14)),
                    borderSide: BorderSide(color: Color(0xFF004633), width: 2),
                  ),
                  errorText: _errorText.isNotEmpty ? _errorText : null,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  prefixIcon: const Icon(LucideIcons.tag, size: 18, color: Color(0xFF16A34A)),
                  suffixIcon: _controller.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, size: 16),
                          onPressed: () {
                            setState(() {
                              _controller.clear();
                              _errorText = '';
                            });
                          },
                        )
                      : null,
                ),
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  letterSpacing: 1.5,
                  color: textColor,
                ),
                onChanged: (_) {
                  if (_errorText.isNotEmpty) {
                    setState(() => _errorText = '');
                  }
                },
                onSubmitted: _tryApply,
              ),
              const SizedBox(height: 10),

              // Current coupon name below text box
              Padding(
                padding: const EdgeInsets.only(left: 4),
                child: Row(
                  children: [
                    const Icon(LucideIcons.sparkles, size: 14, color: Color(0xFFD97706)),
                    const SizedBox(width: 6),
                    Text(
                      'চলতি অফার কুপন: ',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: subColor,
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _controller.text = 'PIONEER';
                          _errorText = '';
                        });
                      },
                      child: Text(
                        'PIONEER',
                        style: TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                          color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF004633),
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // The Apply Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _tryApply(_controller.text),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF004633),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 2,
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'কুপন যোগ করো',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(LucideIcons.arrowRight, size: 18),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    ));
  }
}
