import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../spaced_repetition/domain/spaced_repetition_model.dart';
import '../../../spaced_repetition/services/spaced_repetition_service.dart';

class LeitnerMemoryBoxCard extends StatefulWidget {
  final String? userId;
  const LeitnerMemoryBoxCard({super.key, this.userId});

  @override
  State<LeitnerMemoryBoxCard> createState() => _LeitnerMemoryBoxCardState();
}

class _LeitnerMemoryBoxCardState extends State<LeitnerMemoryBoxCard> {
  SpacedRepetitionStats? _stats;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  void _loadStats() async {
    final s = await SpacedRepetitionService.getStats(widget.userId);
    if (mounted) {
      setState(() {
        _stats = s;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _stats?.totalTracked ?? 0;
    final mastered = _stats?.masteredCount ?? 0;
    final masteryPct = total > 0 ? ((mastered / total) * 100).round() : 0;
    const emeraldColor = Color(0xFF10B981);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.purple.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.brain, color: Colors.purpleAccent, size: 18),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Leitner 5-Box মেমোরি আয়ত্ত',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        'SM-2 বৈজ্ঞানিক মেমোরি স্তর',
                        style: TextStyle(color: Colors.white54, fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('MASTERY', style: TextStyle(color: Colors.white38, fontSize: 9, fontWeight: FontWeight.bold)),
                  Text(
                    '$masteryPct%',
                    style: const TextStyle(color: emeraldColor, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Total Overview text
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('মোট প্রশ্ন: $totalটি', style: const TextStyle(color: Colors.white60, fontSize: 11)),
              Text('$masteredটি Mastered 🏆', style: const TextStyle(color: emeraldColor, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: SizedBox(
              height: 6,
              child: Row(
                children: [
                  _buildBarSegment(_stats?.box1Count ?? 0, total, Colors.redAccent),
                  _buildBarSegment(_stats?.box2Count ?? 0, total, Colors.amber),
                  _buildBarSegment(_stats?.box3Count ?? 0, total, Colors.cyanAccent),
                  _buildBarSegment(_stats?.box4Count ?? 0, total, Colors.purpleAccent),
                  _buildBarSegment(_stats?.box5Count ?? 0, total, emeraldColor),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // 5 Box Pills
          Row(
            children: [
              Expanded(child: _buildBoxItem('Box 1', '১ দিন', _stats?.box1Count ?? 0, Colors.redAccent)),
              const SizedBox(width: 4),
              Expanded(child: _buildBoxItem('Box 2', '৩ দিন', _stats?.box2Count ?? 0, Colors.amber)),
              const SizedBox(width: 4),
              Expanded(child: _buildBoxItem('Box 3', '৭ দিন', _stats?.box3Count ?? 0, Colors.cyanAccent)),
              const SizedBox(width: 4),
              Expanded(child: _buildBoxItem('Box 4', '১৪ দিন', _stats?.box4Count ?? 0, Colors.purpleAccent)),
              const SizedBox(width: 4),
              Expanded(child: _buildBoxItem('Mastered', '৩০ দিন', _stats?.box5Count ?? 0, emeraldColor, isGold: true)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBarSegment(int count, int total, Color color) {
    if (total == 0 || count == 0) return const SizedBox.shrink();
    return Expanded(
      flex: count,
      child: Container(color: color),
    );
  }

  Widget _buildBoxItem(String title, String interval, int count, Color color, {bool isGold = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: isGold ? Colors.amber.withOpacity(0.12) : const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isGold ? Colors.amber.withOpacity(0.4) : Colors.white.withOpacity(0.06),
        ),
      ),
      child: Column(
        children: [
          Text(interval, style: const TextStyle(color: Colors.white38, fontSize: 8)),
          const SizedBox(height: 2),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: isGold ? Colors.amber : color,
              fontWeight: FontWeight.bold,
              fontSize: 9,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '$count',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
