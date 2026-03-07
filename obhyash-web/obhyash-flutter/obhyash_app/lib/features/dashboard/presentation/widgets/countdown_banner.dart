import 'package:flutter/material.dart';

// Exam target → date map (same as web app)
final Map<String, DateTime> examDates = {
  'hsc_2026': DateTime(2026, 4, 1),
  'hsc_2027': DateTime(2027, 4, 1),
  'mbbs_2026': DateTime(2026, 10, 5),
  'mbbs_2027': DateTime(2027, 10, 5),
  'buet_2026': DateTime(2026, 9, 15),
  'buet_2027': DateTime(2027, 9, 15),
  'ssc_2026': DateTime(2026, 2, 15),
  'ssc_2027': DateTime(2027, 2, 15),
};

// Human-readable labels
final Map<String, String> examLabels = {
  'hsc_2026': 'এইচএসসি ২০২৬',
  'hsc_2027': 'এইচএসসি ২০২৭',
  'mbbs_2026': 'মেডিকেল ভর্তি ২০২৬',
  'mbbs_2027': 'মেডিকেল ভর্তি ২০২৭',
  'buet_2026': 'বুয়েট ভর্তি ২০২৬',
  'buet_2027': 'বুয়েট ভর্তি ২০২৭',
  'ssc_2026': 'এসএসসি ২০২৬',
  'ssc_2027': 'এসএসসি ২০২৭',
  'other': 'লক্ষ্য পরীক্ষা',
};

enum _Urgency { normal, urgent, critical, past }

_Urgency _getUrgency(int days) {
  if (days < 0) return _Urgency.past;
  if (days <= 30) return _Urgency.critical;
  if (days <= 90) return _Urgency.urgent;
  return _Urgency.normal;
}

class CountdownBanner extends StatelessWidget {
  final String examTarget;
  final VoidCallback? onChangeTarget;

  const CountdownBanner({
    super.key,
    required this.examTarget,
    this.onChangeTarget,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final examDate = examDates[examTarget];
    final label = examLabels[examTarget] ?? 'লক্ষ্য পরীক্ষা';

    if (examDate == null) return const SizedBox.shrink();

    final now = DateTime.now();
    final days = examDate
        .difference(DateTime(now.year, now.month, now.day))
        .inDays;
    final urgency = _getUrgency(days);

    // Color scheme based on urgency (mirrors web app)
    late Color borderColor;
    late Color bgColor;
    late Color textColor;
    late Color labelColor;
    late String statusText;

    switch (urgency) {
      case _Urgency.critical:
        borderColor = const Color(0xFFFECACA); // red-200
        bgColor = isDark ? const Color(0xFF2A1515) : const Color(0xFFFFF5F5);
        textColor = const Color(0xFFDC2626); // red-600
        labelColor = const Color(0xFFEF4444); // red-500
        statusText = 'মাত্র $days দিন বাকি!';
        break;
      case _Urgency.urgent:
        borderColor = const Color(0xFFFDE68A); // amber-200
        bgColor = isDark ? const Color(0xFF221A00) : const Color(0xFFFFFBEB);
        textColor = const Color(0xFFD97706); // amber-600
        labelColor = const Color(0xFFF59E0B); // amber-500
        statusText = '$days দিন বাকি';
        break;
      case _Urgency.normal:
        borderColor = const Color(0xFFA7F3D0); // emerald-200
        bgColor = isDark ? const Color(0xFF0A1F17) : const Color(0xFFF0FDF4);
        textColor = const Color(0xFF047857); // emerald-700
        labelColor = const Color(0xFF10B981); // emerald-500
        statusText = '$days দিন বাকি';
        break;
      case _Urgency.past:
        borderColor = isDark
            ? const Color(0xFF404040)
            : const Color(0xFFE5E5E5);
        bgColor = isDark ? const Color(0xFF171717) : const Color(0xFFFAFAFA);
        textColor = const Color(0xFF737373); // neutral-500
        labelColor = const Color(0xFF737373);
        statusText = 'পরীক্ষা শেষ';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          // Pulsing dot for critical
          if (urgency == _Urgency.critical)
            Container(
              width: 10,
              height: 10,
              margin: const EdgeInsets.only(right: 10),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: textColor,
              ),
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: labelColor,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  statusText,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                ),
              ],
            ),
          ),
          if (onChangeTarget != null)
            GestureDetector(
              onTap: onChangeTarget,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: textColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: textColor.withOpacity(0.3)),
                ),
                child: Text(
                  'পরিবর্তন',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
