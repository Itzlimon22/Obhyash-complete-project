import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../dashboard/domain/models.dart';

class RecentActivitySection extends StatelessWidget {
  final List<ExamResult> history;

  const RecentActivitySection({super.key, required this.history});

  String _formatDate(DateTime? dt) {
    if (dt == null) return '';
    return DateFormat('d MMM, yyyy').format(dt);
  }

  String _formatSubjectName(String name) {
    if (name.isEmpty) return name;
    final l = name.toLowerCase();

    String subjectPart = name;
    if (l.contains('physics')) subjectPart = 'পদার্থবিজ্ঞান';
    else if (l.contains('chemistry')) subjectPart = 'রসায়ন';
    else if (l.contains('biology') || l.contains('botany') || l.contains('zoology')) subjectPart = 'জীববিজ্ঞান';
    else if (l.contains('math') || l.contains('higher_math')) subjectPart = 'উচ্চতর গণিত';
    else if (l.contains('bangla')) subjectPart = 'বাংলা';
    else if (l.contains('english')) subjectPart = 'ইংরেজি';
    else if (l.contains('ict')) subjectPart = 'আইসিটি';
    else if (l.contains('accounting')) subjectPart = 'হিসাববিজ্ঞান';
    else if (l.contains('finance')) subjectPart = 'ফাইনান্স';
    else if (l.contains('management')) subjectPart = 'ব্যবসায় সংগঠন';
    else if (l.contains('general_science')) subjectPart = 'সাধারণ বিজ্ঞান';
    else if (l.contains('bgs') || l.contains('bangladesh_and_global_studies')) subjectPart = 'বাংলাদেশ ও বিশ্বপরিচয়';
    else if (l.contains('general_knowledge') || l.contains('gk')) subjectPart = 'সাধারণ জ্ঞান';
    else if (l.contains('general')) subjectPart = 'সাধারণ';
    else {
      if (!name.contains('_')) return name;
      return name.split('_').map((word) {
        if (word.isEmpty) return word;
        if (word.toLowerCase() == 'hsc' || word.toLowerCase() == 'ssc') return word.toUpperCase();
        return word[0].toUpperCase() + word.substring(1).toLowerCase();
      }).join(' ');
    }

    String suffix = '';
    if (l.endsWith('_1')) suffix = ' ১ম পত্র';
    else if (l.endsWith('_2')) suffix = ' ২য় পত্র';

    return '$subjectPart$suffix';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final recent = history.take(5).toList();

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
        ),
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
          // Header row
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 16, 16),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0x33E11D48)
                        : const Color(0xFFFFF1F2),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text('⚡', style: TextStyle(fontSize: 18)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'সর্বশেষ কার্যক্রম',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF1C1C1E),
                      fontFamily: 'Anek Bangla',
                    ),
                  ),
                ),
              ],
            ),
          ),

          if (recent.isEmpty)
            Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF1C1C1E)
                          : const Color(0xFFF5F5F5),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.add,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'এখনও কোনো পরীক্ষা দেওয়া হয়নি।',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w500,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                      fontFamily: 'Anek Bangla',
                    ),
                  ),
                ],
              ),
            )
          else
            Container(
              margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0x40262626)
                    : const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(16),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: recent.length,
                separatorBuilder: (context, index) => Divider(
                  height: 1,
                  indent: 12,
                  endIndent: 12,
                  color: isDark
                      ? const Color(0xFF1C1C1E)
                      : const Color(0xFFE5E5E5),
                ),
                itemBuilder: (context, index) {
                  final exam = recent[index];
                  final double pct = exam.totalQuestions > 0
                      ? exam.correctCount / exam.totalQuestions
                      : 0.0;
                  final Color progressColor = pct >= 0.8
                      ? const Color(0xFF059669)
                      : pct >= 0.5
                      ? const Color(0xFF1E3A8A)
                      : const Color(0xFFB91C1C);

                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                    child: Row(
                      children: [
                        // Circular progress
                        SizedBox(
                          width: 52,
                          height: 52,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              CircularProgressIndicator(
                                value: pct,
                                strokeWidth: 3.5,
                                backgroundColor: isDark
                                    ? const Color(0xFF27272A)
                                    : const Color(0xFFE5E5E5),
                                valueColor: AlwaysStoppedAnimation(
                                  progressColor,
                                ),
                                strokeCap: StrokeCap.round,
                              ),
                              Center(
                                child: Text(
                                  '${(pct * 100).round()}%',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    color: progressColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _formatSubjectName(exam.subjectLabel ?? exam.subject),
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF000000),
                                  fontFamily: 'Anek Bangla',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 3),
                              Wrap(
                                spacing: 8,
                                children: [
                                  if (exam.createdAt != null)
                                    Text(
                                      _formatDate(exam.createdAt),
                                      style: TextStyle(
                                        fontSize: 15,
                                        color: isDark
                                            ? const Color(0xFFA3A3A3)
                                            : const Color(0xFF737373),
                                      ),
                                    ),
                                  Text(
                                    '${exam.totalQuestions} প্রশ্ন',
                                    style: TextStyle(
                                      fontSize: 15,
                                      color: isDark
                                          ? const Color(0xFFA3A3A3)
                                          : const Color(0xFF737373),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1C1C1E)
                                : const Color(0xFFF5F5F5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Practice',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF737373),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
