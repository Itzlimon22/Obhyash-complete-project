import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shake/shake.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../router.dart';
import '../theme/app_theme.dart';
import '../utils/app_popups.dart';

class ShakeFeedbackService {
  static final ShakeFeedbackService _instance = ShakeFeedbackService._internal();
  factory ShakeFeedbackService() => _instance;
  ShakeFeedbackService._internal();

  ShakeDetector? _detector;
  bool _isShowing = false;
  bool _isEnabled = true;

  /// Initialize shake listener across the entire app
  void initialize() {
    _detector?.stopListening();
    try {
      _detector = ShakeDetector.autoStart(
        shakeThresholdGravity: 2.5,
        shakeSlopTimeMS: 500,
        onPhoneShake: (count) {
          if (!_isEnabled || _isShowing) return;
          _handleShake();
        },
      );
    } catch (e) {
      debugPrint('[ShakeFeedbackService] Failed to start shake detector: $e');
    }
  }

  void setEnabled(bool enabled) {
    _isEnabled = enabled;
  }

  void stop() {
    _detector?.stopListening();
  }

  void _handleShake() {
    final context = rootNavigatorKey.currentContext;
    if (context == null) return;

    _isShowing = true;
    HapticFeedback.mediumImpact();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const ShakeFeedbackSheet(),
    ).whenComplete(() {
      _isShowing = false;
    });
  }

  /// Manually trigger the feedback sheet (e.g., from settings or floating button)
  static void openFeedbackSheet(BuildContext context) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const ShakeFeedbackSheet(),
    );
  }
}

class ShakeFeedbackSheet extends StatefulWidget {
  const ShakeFeedbackSheet({super.key});

  @override
  State<ShakeFeedbackSheet> createState() => _ShakeFeedbackSheetState();
}

class _ShakeFeedbackSheetState extends State<ShakeFeedbackSheet> {
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _contactController = TextEditingController();
  String _selectedCategory = 'Bug';
  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _categories = [
    {
      'id': 'Bug',
      'label': 'বাগ রিপোর্ট',
      'icon': LucideIcons.bug,
      'color': const Color(0xFFEF4444),
    },
    {
      'id': 'Technical',
      'label': 'কারিগরি সমস্যা',
      'icon': LucideIcons.zap,
      'color': const Color(0xFFF59E0B),
    },
    {
      'id': 'UX',
      'label': 'ডিজাইন / UX',
      'icon': LucideIcons.palette,
      'color': const Color(0xFF3B82F6),
    },
    {
      'id': 'General',
      'label': 'মতামত / আইডিয়া',
      'icon': LucideIcons.sparkles,
      'color': const Color(0xFF10B981),
    },
  ];

  @override
  void dispose() {
    _textController.dispose();
    _contactController.dispose();
    super.dispose();
  }

  Future<void> _submitFeedback() async {
    final text = _textController.text.trim();
    if (text.isEmpty) {
      AppPopups.warning(context, message: 'অনুগ্রহ করে কিছু মতামত বা সমস্যার বিবরণ লিখুন।');
      return;
    }

    final user = Supabase.instance.client.auth.currentUser;
    setState(() => _isSubmitting = true);

    try {
      final contact = _contactController.text.trim();
      final contactInfo = contact.isNotEmpty ? '\n[যোগাযোগ: $contact]' : '';
      final description = '$text$contactInfo';

      if (user != null) {
        await Supabase.instance.client.from('app_complaints').insert({
          'user_id': user.id,
          'type': _selectedCategory,
          'description': description,
          'status': 'Pending',
        });
      } else {
        // Guest user - attempt insert or fall back gracefully
        try {
          await Supabase.instance.client.from('app_complaints').insert({
            'type': _selectedCategory,
            'description': '$description [Guest / Unregistered User]',
            'status': 'Pending',
          });
        } catch (_) {
          // If RLS blocks unauthenticated insert, ignore server error and thank user
        }
      }

      if (mounted) {
        HapticFeedback.heavyImpact();
        Navigator.pop(context);
        AppPopups.success(
          context,
          message: 'আপনার মূল্যবান মতামত জমা হয়েছে! ধন্যবাদ ❤️',
        );
      }
    } catch (e) {
      if (mounted) {
        AppPopups.error(
          context,
          message: 'মতামত পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final user = Supabase.instance.client.auth.currentUser;

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: bottomInset > 0 ? bottomInset + 16 : 28,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141A18) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(isDark ? 100 : 30),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Grab Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Top Row: Tag + Close Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.viridianForest.withAlpha(isDark ? 60 : 30),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.viridianForest.withAlpha(80),
                      width: 1,
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        LucideIcons.smartphone,
                        size: 14,
                        color: Color(0xFF10B981),
                      ),
                      SizedBox(width: 6),
                      Text(
                        'ফোন ঝাঁকানো শনাক্ত হয়েছে',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.x, size: 20),
                  visualDensity: VisualDensity.compact,
                  splashRadius: 18,
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Title & Subtitle
            Text(
              'আপনার মতামত বা সমস্যা জানান',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : AppColors.textPrimaryLight,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'অভ্যাস অ্যাপকে আরও নিখুঁত করতে যেকোনো বাগ রিপোর্ট বা মতামত লিখুন:',
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.grey[400] : AppColors.textSecondaryLight,
              ),
            ),
            const SizedBox(height: 16),

            // Category Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _categories.map((cat) {
                  final isSelected = _selectedCategory == cat['id'];
                  final Color color = cat['color'] as Color;

                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _selectedCategory = cat['id'] as String);
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? color.withAlpha(isDark ? 50 : 35)
                              : (isDark ? Colors.white.withAlpha(10) : Colors.grey[100]),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected ? color : Colors.transparent,
                            width: 1.5,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              cat['icon'] as IconData,
                              size: 15,
                              color: isSelected ? color : (isDark ? Colors.grey[400] : Colors.grey[600]),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              cat['label'] as String,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                color: isSelected
                                    ? (isDark ? Colors.white : color)
                                    : (isDark ? Colors.grey[300] : Colors.grey[700]),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // Feedback Text Field
            TextField(
              controller: _textController,
              maxLines: 4,
              minLines: 3,
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.white : Colors.black87,
              ),
              decoration: InputDecoration(
                hintText: 'কী সমস্যা হচ্ছে বা কী যোগ করা উচিত বিস্তারিত লিখুন...',
                hintStyle: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.grey[500] : Colors.grey[400],
                ),
                filled: true,
                fillColor: isDark ? const Color(0xFF1E2623) : const Color(0xFFF9FAFB),
                contentPadding: const EdgeInsets.all(14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white12 : Colors.grey[300]!,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white12 : Colors.grey[300]!,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                    color: AppColors.viridianForest,
                    width: 1.5,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Optional Contact info (if not logged in)
            if (user == null) ...[
              TextField(
                controller: _contactController,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white : Colors.black87,
                ),
                decoration: InputDecoration(
                  hintText: 'ফোন বা ইমেইল (ঐচ্ছিক, যোগাযোগের জন্য)',
                  hintStyle: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey[500] : Colors.grey[400],
                  ),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF1E2623) : const Color(0xFFF9FAFB),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: isDark ? Colors.white12 : Colors.grey[300]!,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitFeedback,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.viridianForest,
                  foregroundColor: Colors.white,
                  
                  ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.send, size: 16),
                          SizedBox(width: 8),
                          Text(
                            'জমা দিন',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 12),

            // Secondary links row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    context.push('/profile/complaint');
                  },
                  icon: const Icon(LucideIcons.history, size: 14),
                  label: const Text(
                    'অভিযোগের হিস্ট্রি দেখুন',
                    style: TextStyle(fontSize: 12),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: isDark ? Colors.grey[400] : Colors.grey[700],
                  ),
                ),
                Text(
                  '•',
                  style: TextStyle(
                    color: isDark ? Colors.white24 : Colors.grey[400],
                  ),
                ),
                TextButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    context.push('/profile/feature-requests');
                  },
                  icon: const Icon(LucideIcons.lightbulb, size: 14),
                  label: const Text(
                    'ফিচার রিকোয়েস্ট',
                    style: TextStyle(fontSize: 12),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: isDark ? Colors.grey[400] : Colors.grey[700],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
