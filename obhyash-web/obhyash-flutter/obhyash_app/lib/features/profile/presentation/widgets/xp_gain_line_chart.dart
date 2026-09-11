import 'dart:math';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../../../core/utils/bangla_name_helper.dart';

/// Data point representing XP earned on a specific day
class DailyXpPoint {
  final DateTime date;
  final String dayLabel;
  final double xp;

  const DailyXpPoint({
    required this.date,
    required this.dayLabel,
    required this.xp,
  });

  static String getBengaliWeekday(int weekday) {
    switch (weekday) {
      case DateTime.saturday:
        return 'শনি';
      case DateTime.sunday:
        return 'রবি';
      case DateTime.monday:
        return 'সোম';
      case DateTime.tuesday:
        return 'মঙ্গল';
      case DateTime.wednesday:
        return 'বুধ';
      case DateTime.thursday:
        return 'বৃহঃ';
      case DateTime.friday:
        return 'শুক্র';
      default:
        return '';
    }
  }

  /// Generates rolling last 7 days points ending today
  static List<DailyXpPoint> generateLast7Days(Map<String, int> dateXpMap) {
    final now = DateTime.now();
    final List<DailyXpPoint> list = [];
    for (int i = 6; i >= 0; i--) {
      final d = DateTime(now.year, now.month, now.day).subtract(Duration(days: i));
      final key = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
      final xp = (dateXpMap[key] ?? 0).toDouble();
      list.add(DailyXpPoint(
        date: d,
        dayLabel: getBengaliWeekday(d.weekday),
        xp: xp,
      ));
    }
    return list;
  }
}

/// A line chart card for 7-day XP gain and dual-user comparison
class XpGainLineChartCard extends StatelessWidget {
  final List<DailyXpPoint> primarySeries;
  final String primaryLabel;
  final Color primaryColor;

  final List<DailyXpPoint>? secondarySeries;
  final String? secondaryLabel;
  final Color secondaryColor;

  final bool isDark;
  final String? subtitle;

  const XpGainLineChartCard({
    super.key,
    required this.primarySeries,
    this.primaryLabel = 'তুমি',
    this.primaryColor = const Color(0xFFD97706), // Warm Amber/Brown matching reference screenshot
    this.secondarySeries,
    this.secondaryLabel,
    this.secondaryColor = const Color(0xFF0D9488), // Teal contrast
    required this.isDark,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final isDual = secondarySeries != null && secondarySeries!.isNotEmpty;

    // Calculate totals
    final double primaryTotal = primarySeries.fold(0.0, (sum, p) => sum + p.xp);
    final double secondaryTotal = isDual
        ? secondarySeries!.fold(0.0, (sum, p) => sum + p.xp)
        : 0.0;

    // Calculate maximum Y value for scale
    double maxY = 20.0;
    for (final p in primarySeries) {
      if (p.xp > maxY) maxY = p.xp;
    }
    if (isDual) {
      for (final p in secondarySeries!) {
        if (p.xp > maxY) maxY = p.xp;
      }
    }
    // Add 15% headroom
    maxY = (maxY * 1.15).ceilToDouble();
    if (maxY < 20) maxY = 20.0;

    // Grid interval
    final double yInterval = (maxY / 4).clamp(5.0, 1000.0);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Legends / Indicators ──
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              _buildLegendPill(
                color: primaryColor,
                label: primaryLabel,
                totalXp: primaryTotal.round(),
                isDark: isDark,
              ),
              if (isDual)
                _buildLegendPill(
                  color: secondaryColor,
                  label: secondaryLabel ?? 'অন্য ব্যবহারকারী',
                  totalXp: secondaryTotal.round(),
                  isDark: isDark,
                ),
            ],
          ),
          const SizedBox(height: 18),

          // ── The Line Chart ──
          SizedBox(
            height: 210,
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: max(0, (primarySeries.length - 1).toDouble()),
                minY: 0,
                maxY: maxY,
                clipData: const FlClipData.all(),

                // Dashed Grid Lines (matching user's reference screenshot)
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: true,
                  drawHorizontalLine: true,
                  horizontalInterval: yInterval,
                  verticalInterval: 1,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: isDark ? const Color(0x3371717A) : const Color(0x33A1A1AA),
                    strokeWidth: 0.9,
                    dashArray: [4, 4],
                  ),
                  getDrawingVerticalLine: (value) => FlLine(
                    color: isDark ? const Color(0x3371717A) : const Color(0x33A1A1AA),
                    strokeWidth: 0.9,
                    dashArray: [4, 4],
                  ),
                ),

                // Border Data (off, keeping it minimalist and grid-based)
                borderData: FlBorderData(show: false),

                // Interactive Touch Tooltip
                lineTouchData: LineTouchData(
                  enabled: true,
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (touchedSpot) =>
                        isDark ? const Color(0xFF27272A) : const Color(0xFF0F172A),
                    tooltipPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) {
                        final isPrimary = spot.barIndex == 0;
                        final label = isPrimary
                            ? primaryLabel
                            : (secondaryLabel ?? 'অন্য ব্যবহারকারী');
                        final color = isPrimary ? primaryColor : secondaryColor;
                        return LineTooltipItem(
                          '$label: ${BanglaNameHelper.toBanglaNumeral(spot.y.round())} XP',
                          TextStyle(
                            color: color,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            ),
                        );
                      }).toList();
                    },
                  ),
                ),

                // Axes Titles
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  // Left Numeric Y-Axis Titles
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 38,
                      interval: yInterval,
                      getTitlesWidget: (val, meta) {
                        if (val < 0 || val > maxY) return const SizedBox.shrink();
                        final intVal = val.round();
                        return Text(
                          BanglaNameHelper.toBanglaNumeral(intVal),
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? const Color(0xFF71717A)
                                : const Color(0xFF94A3B8),
                            ),
                          textAlign: TextAlign.right,
                        );
                      },
                    ),
                  ),
                  // Bottom Bengali Weekday X-Axis Titles
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      interval: 1,
                      getTitlesWidget: (val, meta) {
                        final idx = val.toInt();
                        if (idx < 0 || idx >= primarySeries.length) {
                          return const SizedBox.shrink();
                        }
                        final dayText = primarySeries[idx].dayLabel;
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            dayText,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF64748B),
                              ),
                          ),
                        );
                      },
                    ),
                  ),
                ),

                // Line Bars
                lineBarsData: [
                  // 1. Primary Line (Current User)
                  _createLineChartBar(
                    series: primarySeries,
                    color: primaryColor,
                  ),
                  // 2. Secondary Line (Other User, if available)
                  if (isDual)
                    _createLineChartBar(
                      series: secondarySeries!,
                      color: secondaryColor,
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Builds a line bar with circular dots matching the screenshot
  LineChartBarData _createLineChartBar({
    required List<DailyXpPoint> series,
    required Color color,
  }) {
    final spots = <FlSpot>[];
    for (int i = 0; i < series.length; i++) {
      spots.add(FlSpot(i.toDouble(), series[i].xp));
    }

    return LineChartBarData(
      spots: spots,
      isCurved: false, // Straight line segments matching reference image
      color: color,
      barWidth: 2.2,
      isStrokeCapRound: true,
      belowBarData: BarAreaData(
        show: true,
        gradient: LinearGradient(
          colors: [
            color.withValues(alpha: 0.18),
            color.withValues(alpha: 0.0),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      dotData: FlDotData(
        show: true,
        getDotPainter: (spot, percent, barData, index) {
          return FlDotCirclePainter(
            radius: 4.8,
            color: color,
            strokeWidth: 2.2,
            strokeColor: Colors.white,
          );
        },
      ),
    );
  }

  Widget _buildLegendPill({
    required Color color,
    required String label,
    required int totalXp,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withValues(alpha: 0.4),
          width: 0.9,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 1),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$label (${BanglaNameHelper.toBanglaNumeral(totalXp)} XP)',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF1E293B),
              ),
          ),
        ],
      ),
    );
  }
}
