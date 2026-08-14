import 'package:flutter/material.dart';

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
          ? const Color(0x4D262626)
          : const Color(0xFFF5F5F5); // neutral-800/30 : neutral-100
    }
    if (examCount == 0) {
      return isDark
          ? const Color(0xFF27272A)
          : const Color(0xFFE5E5E5); // neutral-700 : neutral-200
    }
    if (examCount == 1) {
      return isDark
          ? const Color(0xFF059669)
          : const Color(0xFF6EE7B7); // emerald-700 : emerald-300
    }
    if (examCount == 2) {
      return const Color(0xFF059669); // emerald-600 : emerald-400
    }
    return const Color(0xFF059669); // emerald-500 : emerald-500
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
    return '${months[date.month - 1]}';
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
    bool isCurrentOrFutureMonth = _displayedMonth.year > now.year ||
        (_displayedMonth.year == now.year && _displayedMonth.month >= now.month);

    final prevMonthDate = DateTime(now.year, now.month - 1, 1);
    bool isPreviousOrOlderMonth = _displayedMonth.year < prevMonthDate.year ||
        (_displayedMonth.year == prevMonthDate.year && _displayedMonth.month <= prevMonthDate.month);

    return Container(
      padding: const EdgeInsets.all(20), // sm:p-8
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(24), // sm:rounded-3xl
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
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    IconButton(
                      onPressed: isPreviousOrOlderMonth ? null : _goToPreviousMonth,
                      icon: const Icon(Icons.chevron_left_rounded),
                      splashRadius: 24,
                      color: isPreviousOrOlderMonth
                          ? (isDark ? Colors.white24 : Colors.black26)
                          : (isDark ? Colors.white70 : Colors.black87),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '${_getMonthName(_displayedMonth)} কার্যক্রম',
                        style: TextStyle(
                          fontSize: 20, // sm:text-2xl
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF000000), // neutral-900
                          fontFamily: 'Anek Bangla',
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      onPressed: isCurrentOrFutureMonth ? null : _goToNextMonth,
                      icon: const Icon(Icons.chevron_right_rounded),
                      splashRadius: 24,
                      color: isCurrentOrFutureMonth
                          ? (isDark ? Colors.white24 : Colors.black26)
                          : (isDark ? Colors.white70 : Colors.black87),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Streak Badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ), // sm:px-4 sm:py-2
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0x337c2d12)
                      : const Color(0xFFFFF7ED), // orange-900/20 : orange-50
                  borderRadius: BorderRadius.circular(40), // rounded-full
                  border: Border.all(
                    color: isDark
                        ? const Color(0x4D7c2d12)
                        : const Color(0xFFFFEDD5),
                  ), // orange-900/30 : orange-100
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0Df97316),
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ], // shadow-orange-500/5
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.local_fire_department_rounded,
                      color: Color(0xFF1E3A8A),
                      size: 18,
                    ), // orange-500
                    const SizedBox(width: 8), // sm:gap-2.5
                    Text(
                      '${widget.streakCount} দিন স্ট্রিক',
                      style: const TextStyle(
                        fontSize: 16, // sm:text-base
                        fontWeight: FontWeight.w900, // font-black
                        color: Color(0xFFEA580C), // orange-600 : orange-400
                        fontFamily: 'Anek Bangla',
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
                          fontSize: 15, // sm:text-sm
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(
                                  0xFF737373,
                                ), // neutral-400 : neutral-500
                          fontFamily: 'Anek Bangla',
                        ),
                      ),
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
                                      '${week[i].examCount > 0 ? '${week[i].examCount}টি পরীক্ষা' : 'কোনো পরীক্ষা নেই'}\n${'${week[i].date.day}/${week[i].date.month}'}',
                                  child: AspectRatio(
                                    aspectRatio: 1,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: _getColorClass(
                                          week[i].examCount,
                                          week[i].isCurrentMonth,
                                          isDark,
                                        ),
                                        borderRadius: BorderRadius.circular(
                                          10,
                                        ), // sm:rounded-xl
                                      ),
                                      child: Center(
                                        child: Text(
                                          week[i].dayOfMonth.toString(),
                                          style: TextStyle(
                                            fontSize: 16, // text-sm
                                            fontWeight: FontWeight.w900, // font-black
                                            color: week[i].isCurrentMonth
                                                ? (isDark
                                                      ? const Color(0xFFF5F5F5)
                                                      : const Color(
                                                          0xFF000000,
                                                        )) // neutral-100 : neutral-900
                                                : (isDark
                                                      ? const Color(0xFF525252)
                                                      : const Color(
                                                          0xFFA3A3A3,
                                                        )), // neutral-600 : neutral-400
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

          const SizedBox(height: 16), // mt-4
          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegendItem(
                context,
                '০',
                _getColorClass(0, true, isDark),
                isDark,
              ),
              const SizedBox(width: 16), // gap-4
              _buildLegendItem(
                context,
                '১',
                _getColorClass(1, true, isDark),
                isDark,
              ),
              const SizedBox(width: 16),
              _buildLegendItem(
                context,
                '২',
                _getColorClass(2, true, isDark),
                isDark,
              ),
              const SizedBox(width: 16),
              _buildLegendItem(
                context,
                '৩+',
                _getColorClass(3, true, isDark),
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
    bool isDark,
  ) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 15,
            color: isDark
                ? const Color(0xFFA3A3A3)
                : const Color(0xFF737373), // neutral-400 : neutral-500
          ),
        ),
      ],
    );
  }
}
