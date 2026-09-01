import 'package:flutter/material.dart';
import '../../../../core/utils/bangla_name_helper.dart';

// Since MonthCalendarDay isn't defined in dart models yet
class MonthCalendarDay {
  final DateTime date;
  final int dayOfMonth;
  final int examCount;
  final bool isCurrentMonth;

  MonthCalendarDay({
    required this.date,
    required this.dayOfMonth,
    required this.examCount,
    required this.isCurrentMonth,
  });
}

class StreakCalendar extends StatefulWidget {
  final List<MonthCalendarDay> calendarData;
  final int streakCount;

  const StreakCalendar({
    super.key,
    required this.calendarData,
    required this.streakCount,
  });

  @override
  State<StreakCalendar> createState() => _StreakCalendarState();
}

class _StreakCalendarState extends State<StreakCalendar> {
  late DateTime _displayedMonth;

  @override
  void initState() {
    super.initState();
    _displayedMonth = DateTime.now();
  }

  void _goToPreviousMonth() {
    setState(() {
      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month - 1, 1);
    });
  }

  void _goToNextMonth() {
    setState(() {
      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month + 1, 1);
    });
  }

  static const List<String> weekdays = [
    'রবি',
    'সোম',
    'মঙ্গল',
    'বুধ',
    'বৃহঃ',
    'শুক্র',
    'শনি',
  ];

  Color _getColorClass(int examCount, bool isCurrentMonth, bool isDark) {
    if (!isCurrentMonth) {
      return isDark
          ? const Color(0xFF141416)
          : const Color(0xFFF8FAFC);
    }
    if (examCount == 0) {
      return isDark
          ? const Color(0xFF222226)
          : const Color(0xFFF1F5F9);
    }
    if (examCount == 1) {
      return const Color(0xFF059669); // Clean Solid Emerald
    }
    // 2 or more exams
    return isDark
        ? const Color(0xFF10B981)
        : const Color(0xFF047857); // Deep Solid Emerald
  }

  Color _getTextColor(int examCount, bool isCurrentMonth, bool isDark) {
    if (!isCurrentMonth) {
      return isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1);
    }
    if (examCount == 0) {
      return isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569);
    }
    return Colors.white;
  }

  String _getMonthName(DateTime date) {
    const months = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ];
    return months[date.month - 1];
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Filter calendarData for the displayed month
    List<MonthCalendarDay> dataToRender = widget.calendarData.where((day) =>
        day.date.year == _displayedMonth.year &&
        day.date.month == _displayedMonth.month).toList();

    // Fill with dummy data if not enough records (like empty)
    if (dataToRender.isEmpty) {
      final daysInMonth = DateUtils.getDaysInMonth(_displayedMonth.year, _displayedMonth.month);
      dataToRender = List.generate(
        daysInMonth,
        (i) => MonthCalendarDay(
          date: DateTime(_displayedMonth.year, _displayedMonth.month, i + 1),
          dayOfMonth: i + 1,
          examCount: 0,
          isCurrentMonth: true,
        ),
      );
    }

    // Determine leading empty days to align to Sunday (0)
    int firstWeekday = DateTime(_displayedMonth.year, _displayedMonth.month, 1).weekday;
    if (firstWeekday == 7) firstWeekday = 0; // Dart says Sunday is 7, we want 0

    List<MonthCalendarDay> paddedData = [];
    for (int i = 0; i < firstWeekday; i++) {
      paddedData.add(MonthCalendarDay(
        date: DateTime(_displayedMonth.year, _displayedMonth.month, 0),
        dayOfMonth: 0,
        examCount: 0,
        isCurrentMonth: false,
      ));
    }
    paddedData.addAll(dataToRender);

    // Chunk into weeks (7 days)
    List<List<MonthCalendarDay>> weeks = [];
    for (int i = 0; i < paddedData.length; i += 7) {
      weeks.add(
        paddedData.sublist(
          i,
          i + 7 > paddedData.length ? paddedData.length : i + 7,
        ),
      );
    }

    final now = DateTime.now();
    final minMonthDate = DateTime(now.year, now.month - 1, 1);
    final bool canGoPrevious = _displayedMonth.year > minMonthDate.year ||
        (_displayedMonth.year == minMonthDate.year && _displayedMonth.month > minMonthDate.month);
    final bool canGoNext = _displayedMonth.year < now.year ||
        (_displayedMonth.year == now.year && _displayedMonth.month < now.month);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header (Responsive, Never Squeezed)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Row(
                  children: [
                    IconButton(
                      onPressed: canGoPrevious ? _goToPreviousMonth : null,
                      icon: const Icon(Icons.chevron_left_rounded),
                      splashRadius: 20,
                      iconSize: 22,
                      color: canGoPrevious
                          ? (isDark ? Colors.white70 : const Color(0xFF334155))
                          : (isDark ? Colors.white24 : const Color(0xFFCBD5E1)),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                    const SizedBox(width: 2),
                    Expanded(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.center,
                        child: Text(
                          _getMonthName(_displayedMonth),
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF0F172A),
                            fontFamily: 'HindSiliguri',
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 2),
                    IconButton(
                      onPressed: canGoNext ? _goToNextMonth : null,
                      icon: const Icon(Icons.chevron_right_rounded),
                      splashRadius: 20,
                      iconSize: 22,
                      color: canGoNext
                          ? (isDark ? Colors.white70 : const Color(0xFF334155))
                          : (isDark ? Colors.white24 : const Color(0xFFCBD5E1)),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Streak Badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4.5,
                ),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                      : const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(
                    color: isDark
                      ? const Color(0xFFEF4444).withValues(alpha: 0.3)
                      : const Color(0xFFFECACA),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.08),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.local_fire_department_rounded,
                      color: Color(0xFFEF4444),
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${BanglaNameHelper.toBanglaNumeral(widget.streakCount)} দিন স্ট্রিক',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626),
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24), // sm:mb-6
          // Weekdays header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: weekdays
                .map(
                  (day) => Expanded(
                    child: Center(
                      child: Text(
                        day,
                        style: TextStyle(
                          fontSize: 16, // sm:text-sm
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(
                                  0xFF737373,
                                ), // neutral-400 : neutral-500
                          fontFamily: 'Anek Bangla',
                        ),
                       maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 12), // sm:mb-3
          // Grid
          ...weeks.map(
            (week) => Padding(
              padding: const EdgeInsets.only(bottom: 6), // sm:gap-1.5
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  for (int i = 0; i < 7; i++)
                    if (i < week.length)
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 3,
                          ), // sm:gap-1.5
                          child: !week[i].isCurrentMonth
                              ? AspectRatio(
                                  aspectRatio: 1,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: _getColorClass(0, false, isDark),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                )
                              : Tooltip(
                                  message:
                                      '${week[i].examCount > 0 ? '${BanglaNameHelper.toBanglaNumeral(week[i].examCount)}টি পরীক্ষা সম্পন্ন' : 'কোনো পরীক্ষা নেই'}\n${'${BanglaNameHelper.toBanglaNumeral(week[i].date.day)} ${_getMonthName(week[i].date)}'}',
                                  child: AspectRatio(
                                    aspectRatio: 1,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: _getColorClass(
                                          week[i].examCount,
                                          week[i].isCurrentMonth,
                                          isDark,
                                        ),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: week[i].examCount > 0
                                              ? Colors.transparent
                                              : (isDark ? const Color(0xFF2C2C30) : const Color(0xFFE2E8F0)),
                                          width: 1,
                                        ),
                                        boxShadow: week[i].examCount > 0
                                            ? [
                                                BoxShadow(
                                                  color: const Color(0xFF059669).withValues(alpha: 0.3),
                                                  blurRadius: 4,
                                                  offset: const Offset(0, 1.5),
                                                ),
                                              ]
                                            : [],
                                      ),
                                      child: Center(
                                        child: Text(
                                          BanglaNameHelper.toBanglaNumeral(week[i].dayOfMonth),
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: week[i].examCount > 0 ? FontWeight.w900 : FontWeight.w700,
                                            color: _getTextColor(
                                              week[i].examCount,
                                              week[i].isCurrentMonth,
                                              isDark,
                                            ),
                                            fontFamily: 'HindSiliguri',
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                        ),
                      )
                    else
                      const Expanded(child: SizedBox()),
                ],
              ),
            ),
          ),

          const SizedBox(height: 18),
          // Clean Minimal Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegendItem(
                context,
                '০ পরীক্ষা',
                _getColorClass(0, true, isDark),
                isDark,
                hasBorder: true,
              ),
              const SizedBox(width: 16),
              _buildLegendItem(
                context,
                '১টি পরীক্ষা',
                _getColorClass(1, true, isDark),
                isDark,
              ),
              const SizedBox(width: 16),
              _buildLegendItem(
                context,
                '২+ পরীক্ষা',
                _getColorClass(2, true, isDark),
                isDark,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(
    BuildContext context,
    String label,
    Color color,
    bool isDark, {
    bool hasBorder = false,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 13,
          height: 13,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: hasBorder
                ? Border.all(
                    color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                    width: 1,
                  )
                : null,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: isDark
                ? const Color(0xFFA1A1AA)
                : const Color(0xFF64748B),
            fontFamily: 'HindSiliguri',
          ),
        ),
      ],
    );
  }
}
