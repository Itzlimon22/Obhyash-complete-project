import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/utils/app_popups.dart';

class QuestionReportDialog extends StatefulWidget {
  final String questionId;

  const QuestionReportDialog({super.key, required this.questionId});

  static Future<void> show(BuildContext context, String questionId) async {
    await showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => QuestionReportDialog(questionId: questionId),
    );
  }

  @override
  State<QuestionReportDialog> createState() => _QuestionReportDialogState();
}

class _QuestionReportDialogState extends State<QuestionReportDialog> {
  final _commentController = TextEditingController();
  String _selectedReason = 'ভুল উত্তর';
  bool _isSubmitting = false;

  final List<String> _reasons = [
    'ভুল উত্তর',
    'প্রশ্ন অসম্পূর্ণ',
    'অপশনে ত্রুটি',
    'ব্যাখ্যা ভুল',
    'বানান ভুল',
    'অন্যান্য সমস্যা',
  ];

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;

      await sb.from('question_reports').insert({
        'question_id': widget.questionId,
        'user_id': uid,
        'reason': _selectedReason,
        'comment': _commentController.text.trim(),
        'created_at': DateTime.now().toUtc().toIso8601String(),
      });
    } catch (e) {
      debugPrint('[QuestionReportDialog] Submit error (non-fatal): $e');
    }

    if (mounted) {
      Navigator.of(context).pop();
      AppPopups.show(
        context,
        message: 'রিপোর্ট সফলভাবে জমা নেওয়া হয়েছে। ধন্যবাদ!',
        isError: false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
          width: 1,
        ),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      LucideIcons.alertTriangle,
                      size: 18,
                      color: Color(0xFFEF4444),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'প্রশ্ন রিপোর্ট করুন',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF111827),
                          ),
                        ),
                        Text(
                          'কী ধরনের সমস্যা রয়েছে?',
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(
                      LucideIcons.x,
                      size: 18,
                      color: isDark
                          ? const Color(0xFF71717A)
                          : const Color(0xFF9CA3AF),
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Reason Radio Options
              Column(
                children: _reasons.map((reason) {
                  final isSelected = _selectedReason == reason;
                  return InkWell(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _selectedReason = reason);
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? (isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFF4F4F5))
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected
                              ? (isDark
                                    ? const Color(0xFF52525B)
                                    : const Color(0xFFD4D4D8))
                              : Colors.transparent,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 16,
                            height: 16,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF004633)
                                    : (isDark
                                          ? const Color(0xFF71717A)
                                          : const Color(0xFFA1A1AA)),
                                width: isSelected ? 4.5 : 1.5,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              reason,
                              style: TextStyle(
                                fontSize: 13,
                                fontFamily: 'HindSiliguri',
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.w500,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF18181B),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 10),

              // Optional Comment Field
              TextField(
                controller: _commentController,
                maxLines: 2,
                maxLength: 200,
                style: TextStyle(
                  fontSize: 13,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF18181B),
                ),
                decoration: InputDecoration(
                  hintText: 'মন্তব্য বা বিস্তারিত (ঐচ্ছিক)...',
                  hintStyle: TextStyle(
                    fontSize: 12.5,
                    fontFamily: 'HindSiliguri',
                    color: isDark
                        ? const Color(0xFF71717A)
                        : const Color(0xFFA1A1AA),
                  ),
                  filled: true,
                  fillColor: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFF4F4F5),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  counterText: '',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Actions Row
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        side: BorderSide(
                          color: isDark
                              ? const Color(0xFF3F3F46)
                              : const Color(0xFFE4E4E7),
                        ),
                      ),
                      child: Text(
                        'বাতিল',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontFamily: 'HindSiliguri',
                          color: isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF71717A),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitReport,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF004633),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'রিপোর্ট পাঠান',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
