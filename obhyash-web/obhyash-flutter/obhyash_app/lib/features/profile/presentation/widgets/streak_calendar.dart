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

class StreakCalendar extends StatelessWidget {
  final List<MonthCalendarDay> calendarData;
  final int streakCount;

  const StreakCalendar({
    super.key,
    required this.calendarData,
    required this.streakCount,
  });

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
    if (!isCurrentMonth)
      return isDark
          ? const Color(0x4D262626)
          : const Color(0xFFF5F5F5); // neutral-800/30 : neutral-100
    if (examCount == 0)
      return isDark
          ? const Color(0xFF404040)
          : const Color(0xFFE5E5E5); // neutral-700 : neutral-200
    if (examCount == 1)
      return isDark
          ? const Color(0xFF047857)
          : const Color(0xFF6EE7B7); // emerald-700 : emerald-300
    if (examCount == 2)
      return const Color(0xFF059669); // emerald-600 : emerald-400
    return const Color(0xFF10B981); // emerald-500 : emerald-500
  }

  String _getMonthName() {
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
    return months[DateTime.now().month - 1];
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Default dummy data if empty to render the exact grid
    List<MonthCalendarDay> dataToRender = calendarData;
    if (dataToRender.isEmpty) {
      final now = DateTime.now();
      final daysInMonth = DateUtils.getDaysInMonth(now.year, now.month);
      dataToRender = List.generate(
        daysInMonth,
        (i) => MonthCalendarDay(
          date: DateTime(now.year, now.month, i + 1),
          dayOfMonth: i + 1,
          examCount: 0,
          isCurrentMonth: true,
        ),
      );
    }

    // Chunk into weeks (7 days)
    List<List<MonthCalendarDay>> weeks = [];
    for (int i = 0; i < dataToRender.length; i += 7) {
      weeks.add(
        dataToRender.sublist(
          i,
          i + 7 > dataToRender.length ? dataToRender.length : i + 7,
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20), // sm:p-8
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(24), // sm:rounded-3xl
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
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
              Text(
                '${_getMonthName()} কার্যক্রম',
                style: TextStyle(
                  fontSize: 20, // sm:text-2xl
                  fontWeight: FontWeight.bold,
                  color: isDark
                      ? Colors.white
                      : const Color(0xFF171717), // neutral-900
                  fontFamily: 'HindSiliguri',
                ),
              ),

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
                      color: Color(0xFFF97316),
                      size: 18,
                    ), // orange-500
                    const SizedBox(width: 8), // sm:gap-2.5
                    Text(
                      '$streakCount দিন স্ট্রিক',
                      style: const TextStyle(
                        fontSize: 14, // sm:text-base
                        fontWeight: FontWeight.w900, // font-black
                        color: Color(0xFFEA580C), // orange-600 : orange-400
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
                          fontSize: 12, // sm:text-sm
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(
                                  0xFF737373,
                                ), // neutral-400 : neutral-500
                          fontFamily: 'HindSiliguri',
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
                          child: Tooltip(
                            // Native tooltip handles the hover state elegantly
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
                                      fontSize: 14, // text-sm
                                      fontWeight: FontWeight.w900, // font-black
                                      color: week[i].isCurrentMonth
                                          ? (isDark
                                                ? const Color(0xFFF5F5F5)
                                                : const Color(
                                                    0xFF171717,
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
            fontSize: 12,
            color: isDark
                ? const Color(0xFFA3A3A3)
                : const Color(0xFF737373), // neutral-400 : neutral-500
          ),
        ),
      ],
    );
  }
}
