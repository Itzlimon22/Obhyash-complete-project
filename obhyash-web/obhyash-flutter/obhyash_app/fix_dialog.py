import sys

file_path = 'obhyash_app/lib/features/reports/presentation/student_report_view.dart'

with open(file_path, 'r') as f:
    content = f.read()

start_marker = "  // Question view dialog helper"
end_marker = "}\n\n// ─── Stat Box ────────────────────────────────────────────────────────────────────"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

new_code = """  // Question view dialog helper
  void _showQuestion(BuildContext context, AppReport report, bool isDark) {
    if (report.question == null) return;
    final q = report.question!;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(ctx).size.height * 0.85,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF09090B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'সম্পূর্ণ প্রশ্ন',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF09090B),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              Divider(
                height: 1,
                color: isDark ? const Color(0xFF262626) : const Color(0xFFF0F0F0),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0D3326) : const Color(0xFFE8F4F0),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _subjectName(q.subject).toUpperCase(),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1A7A5A),
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        q.question,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'Anek Bangla',
                          color: isDark ? Colors.white : const Color(0xFF111827),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ...List.generate(q.options.length, (idx) {
                        final isCorrect = q.correctAnswerIndices?.contains(idx) ?? false;
                        
                        Color boxBg = isDark ? const Color(0xFF1F1F1F) : const Color(0xFFF8F9FA);
                        Color boxBorder = isDark ? const Color(0xFF333333) : const Color(0xFFE5E7EB);
                        Color bulletBg = Colors.transparent;
                        Color bulletBorder = isDark ? const Color(0xFF525252) : const Color(0xFFD1D5DB);
                        Color bulletText = isDark ? const Color(0xFFD4D4D4) : const Color(0xFF6B7280);
                        Color optionTextColor = isDark ? const Color(0xFFE5E5E5) : const Color(0xFF1F2937);
                        bool boldText = false;

                        if (isCorrect) {
                          boxBg = isDark ? const Color(0xFF047857).withValues(alpha: 0.15) : const Color(0xFFECFDF5).withValues(alpha: 0.4);
                          boxBorder = isDark ? const Color(0xFF047857) : const Color(0xFFBBF7D0);
                          bulletBg = const Color(0xFF047857);
                          bulletBorder = const Color(0xFF047857);
                          bulletText = Colors.white;
                          optionTextColor = isDark ? const Color(0xFF047857) : const Color(0xFF047857);
                          boldText = true;
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: boxBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: boxBorder),
                            boxShadow: isDark || isCorrect
                                ? []
                                : [
                                    const BoxShadow(
                                      color: Color(0x0A000000),
                                      blurRadius: 6,
                                      offset: Offset(0, 2),
                                    ),
                                  ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: bulletBg,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: bulletBorder),
                                ),
                                child: Text(
                                  String.fromCharCode(65 + idx),
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: bulletText,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  q.options[idx],
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: optionTextColor,
                                    fontWeight: boldText ? FontWeight.bold : FontWeight.w500,
                                    fontFamily: 'Anek Bangla',
                                    height: 1.4,
                                  ),
                                ),
                              ),
                              if (isCorrect)
                                const Icon(Icons.check_circle_rounded, color: Color(0xFF047857), size: 22),
                            ],
                          ),
                        );
                      }),
                      if (q.explanation != null && q.explanation!.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B).withValues(alpha: 0.5) : const Color(0xFFF0F9FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFBAE6FD)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.lightbulb_outline_rounded, size: 20, color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7)),
                                  const SizedBox(width: 8),
                                  Text(
                                    'ব্যাখ্যা',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                q.explanation!,
                                style: TextStyle(
                                  fontSize: 15,
                                  color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155),
                                  fontFamily: 'Anek Bangla',
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
"""

with open(file_path, 'w') as f:
    f.write(content[:start_idx] + new_code + content[end_idx:])
print("File rewritten successfully")
