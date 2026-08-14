import re

with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'r') as f:
    content = f.read()

# Add import
if "import 'package:fl_chart/fl_chart.dart';" not in content:
    content = content.replace("import 'package:flutter_svg/flutter_svg.dart';", "import 'package:flutter_svg/flutter_svg.dart';\nimport 'package:fl_chart/fl_chart.dart';")

# Replace invocation
invocation_old = """                        _UPStreakVSBanner(
                          myStreak: myProfile.streakCount,
                          opStreak: user.streakCount,
                          opName: user.name ?? 'Opponent',
                          isDark: isDark,
                        ),"""
invocation_new = """                        _UPActivityComparisonChart(
                          myActivity: _myA.last30DaysActivity,
                          opActivity: analytics.last30DaysActivity,
                          opName: user.name ?? 'Opponent',
                          isDark: isDark,
                        ),"""
content = content.replace(invocation_old, invocation_new)

# Replace class
class_old = r"// ─── Streak VS Banner ───────────────────────────────────────────────────────────.*?class _UPStreakVSBanner extends StatelessWidget \{.*?\}\n\}\n"
class_new = """// ─── Activity Comparison Chart ─────────────────────────────────────────────────
class _UPActivityComparisonChart extends StatelessWidget {
  final List<int> myActivity;
  final List<int> opActivity;
  final String opName;
  final bool isDark;

  const _UPActivityComparisonChart({
    required this.myActivity,
    required this.opActivity,
    required this.opName,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    // We only want the last 7 days
    final my7 = myActivity.length >= 7 ? myActivity.sublist(myActivity.length - 7) : List.filled(7, 0);
    final op7 = opActivity.length >= 7 ? opActivity.sublist(opActivity.length - 7) : List.filled(7, 0);

    final maxVal = [...my7, ...op7].fold<int>(1, (a, b) => a > b ? a : b).toDouble();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'অ্যাক্টিভিটি গ্রাফ (গত ৭ দিন)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true, 
                  drawVerticalLine: false, 
                  getDrawingHorizontalLine: (val) => FlLine(color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5), strokeWidth: 1),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      getTitlesWidget: (value, meta) {
                        const days = ['-6', '-5', '-4', '-3', '-2', '-1', 'আজ'];
                        final int idx = value.toInt();
                        if (idx < 0 || idx > 6) return const SizedBox();
                        return Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(days[idx], style: const TextStyle(fontSize: 10, color: Color(0xFF737373))),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: 6,
                minY: 0,
                maxY: maxVal == 0 ? 5 : maxVal + (maxVal * 0.2), // Avoid zero max
                lineBarsData: [
                  // Opponent line
                  LineChartBarData(
                    spots: List.generate(7, (i) => FlSpot(i.toDouble(), op7[i].toDouble())),
                    isCurved: true,
                    color: const Color(0xFFF59E0B),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                    ),
                  ),
                  // My line
                  LineChartBarData(
                    spots: List.generate(7, (i) => FlSpot(i.toDouble(), my7[i].toDouble())),
                    isCurved: true,
                    color: const Color(0xFF047857),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: Colors.white,
                          strokeWidth: 2,
                          strokeColor: const Color(0xFF047857),
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFF047857).withValues(alpha: 0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(width: 12, height: 12, decoration: const BoxDecoration(color: Color(0xFF047857), shape: BoxShape.circle)),
              const SizedBox(width: 8),
              const Text('তুমি', style: TextStyle(fontSize: 12, color: Color(0xFF737373))),
              const SizedBox(width: 24),
              Container(width: 12, height: 12, decoration: const BoxDecoration(color: Color(0xFFF59E0B), shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text(opName.split(' ')[0], style: const TextStyle(fontSize: 12, color: Color(0xFF737373))),
            ],
          ),
        ],
      ),
    );
  }
}
"""

content = re.sub(class_old, class_new, content, flags=re.DOTALL)

with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'w') as f:
    f.write(content)

