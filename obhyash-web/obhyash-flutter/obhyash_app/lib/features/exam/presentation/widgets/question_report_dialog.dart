import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/utils/app_popups.dart';

class QuestionReportDialog extends StatefulWidget {
  final String questionId;

  const QuestionReportDialog({super.key, required this.questionId});

  static Future<void> show(BuildContext context, String questionId) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
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

  // 6 options structured as 2 rows × 3 columns
  final List<List<String>> _reasonRows = [
    ['ভুল উত্তর', 'প্রশ্ন অসম্পূর্ণ', 'অপশনে ত্রুটি'],
    ['ব্যাখ্যা ভুল', 'বানান ভুল', 'অন্যান্য সমস্যা'],
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
      final user = sb.auth.currentUser;
      final uid = user?.id;

      String reporterName = 'Student';
      if (user?.userMetadata != null && user!.userMetadata!['name'] != null) {
        reporterName = user.userMetadata!['name'].toString();
      }

      dynamic qId = int.tryParse(widget.questionId) ?? widget.questionId;

      await sb.from('reports').insert({
        'question_id': qId,
        'reporter_id': uid,
        'reporter_name': reporterName,
        'reason': _selectedReason,
        'description': _commentController.text.trim(),
        'status': 'Pending',
        'created_at': DateTime.now().toUtc().toIso8601String(),
      });

      if (mounted) {
        AppPopups.show(
          context,
          message: 'রিপোর্ট সফলভাবে জমা নেওয়া হয়েছে। ধন্যবাদ!',
          isError: false,
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      debugPrint('[QuestionReportDialog] Submit error: $e');
      if (mounted) {
        AppPopups.show(
          context,
          message: 'রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
          isError: true,
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

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121214) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.15),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + bottomInset),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'প্রশ্ন রিপোর্ট করো',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(
                      LucideIcons.x,
                      size: 20,
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // 6 options as 2 rows × 3 columns
              Column(
                children: _reasonRows.map((row) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      children: row.map((reason) {
                        final isSelected = _selectedReason == reason;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4.0),
                            child: InkWell(
                              onTap: () {
                                HapticFeedback.selectionClick();
                                setState(() => _selectedReason = reason);
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? (isDark
                                          ? const Color(0xFF059669).withValues(alpha: 0.22)
                                          : const Color(0xFF004633).withValues(alpha: 0.1))
                                      : (isDark
                                          ? const Color(0xFF1E1E22)
                                          : const Color(0xFFF8FAFC)),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF059669)
                                        : (isDark
                                            ? const Color(0xFF2E2E34)
                                            : const Color(0xFFE2E8F0)),
                                    width: isSelected ? 1.5 : 1,
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      reason,
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontFamily: 'HindSiliguri',
                                        fontWeight: isSelected
                                            ? FontWeight.w700
                                            : FontWeight.w600,
                                        color: isSelected
                                            ? (isDark
                                                ? const Color(0xFF34D399)
                                                : const Color(0xFF004633))
                                            : (isDark
                                                ? const Color(0xFFD4D4D8)
                                                : const Color(0xFF334155)),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
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
                  hintText: 'মন্তব্য বা বিস্তারিত লেখো (ঐচ্ছিক)...',
                  hintStyle: TextStyle(
                    fontSize: 12,
                    fontFamily: 'HindSiliguri',
                    color: isDark
                        ? const Color(0xFF71717A)
                        : const Color(0xFFA1A1AA),
                  ),
                  filled: true,
                  fillColor: isDark
                      ? const Color(0xFF1E1E22)
                      : const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  counterText: '',
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: isDark
                          ? const Color(0xFF2E2E34)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(
                      color: Color(0xFF059669),
                      width: 1.5,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Actions Row
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 46,
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          side: BorderSide(
                            color: isDark
                                ? const Color(0xFF3F3F46)
                                : const Color(0xFFCBD5E1),
                          ),
                        ),
                        child: Text(
                          'বাতিল',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 46,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitReport,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF004633),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'রিপোর্ট পাঠাও',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: Colors.white,
                                ),
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
