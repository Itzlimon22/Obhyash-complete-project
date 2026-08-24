import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../spaced_repetition/domain/spaced_repetition_model.dart';
import '../../../spaced_repetition/services/spaced_repetition_service.dart';
import '../../../spaced_repetition/presentation/spaced_repetition_exam_view.dart';

class DailySpacedRepetitionCard extends StatefulWidget {
  const DailySpacedRepetitionCard({super.key});

  @override
  State<DailySpacedRepetitionCard> createState() => _DailySpacedRepetitionCardState();
}

class _DailySpacedRepetitionCardState extends State<DailySpacedRepetitionCard> {
  SpacedRepetitionStats? _stats;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  void _loadStats() async {
    final s = await SpacedRepetitionService.getStats();
    if (mounted) {
      setState(() {
        _stats = s;
      });
    }
  }

  void _openRevisionExam() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const SpacedRepetitionExamView(),
      ),
    );
    _loadStats(); // Reload stats after session finishes
  }

  @override
  Widget build(BuildContext context) {
    final dueCount = _stats != null && _stats!.dueTodayCount > 0 ? _stats!.dueTodayCount : 10;
    final masteredCount = _stats?.masteredCount ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.purple.shade900.withOpacity(0.4),
            const Color(0xFF1E293B),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: Colors.purpleAccent.withOpacity(0.35),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.purple.withOpacity(0.12),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Badges
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.purple.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.purpleAccent.withOpacity(0.4)),
                ),
                child: const Row(
                  children: [
                    Icon(LucideIcons.brain, color: Colors.purpleAccent, size: 13),
                    SizedBox(width: 5),
                    Text(
                      'Leitner SM-2 Memory Engine',
                      style: TextStyle(
                        color: Colors.purpleAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              if (masteredCount > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '🏆 $masteredCountটি আয়ত্তে',
                    style: const TextStyle(
                      color: Colors.amber,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Title & Due pill
          Row(
            children: [
              const Expanded(
                child: Text(
                  'আজকের মেমোরি রিভিশন',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.4)),
                ),
                child: Text(
                  '$dueCountটি প্রস্তুত',
                  style: const TextStyle(
                    color: Colors.redAccent,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),

          const Text(
            'ভুলে যাওয়ার আগেই ১০টি প্রশ্ন প্র্যাকটিস করে স্মৃতিকে দীর্ঘস্থায়ী বক্সে উন্নীত করুন।',
            style: TextStyle(color: Colors.white60, fontSize: 12, height: 1.4),
          ),
          const SizedBox(height: 14),

          // Action Button
          ElevatedButton(
            onPressed: _openRevisionExam,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purpleAccent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 4,
              shadowColor: Colors.purple.withOpacity(0.4),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'রিভিশন শুরু করুন (১০ মিনিট)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                SizedBox(width: 6),
                Icon(LucideIcons.arrowRight, size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
