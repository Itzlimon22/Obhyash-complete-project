with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'r') as f:
    content = f.read()

# 1. Add _UPStreakVSBanner and the premium _UPCompareCell at the end of the file
premium_components = """

// ─── Streak VS Banner ───────────────────────────────────────────────────────────
class _UPStreakVSBanner extends StatelessWidget {
  final int myStreak, opStreak;
  final String opName;
  final bool isDark;

  const _UPStreakVSBanner({
    required this.myStreak,
    required this.opStreak,
    required this.opName,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final bool iWon = myStreak >= opStreak;
    final bool opWon = opStreak > myStreak;
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark 
              ? [const Color(0xFF450A0A).withOpacity(0.3), const Color(0xFF064E3B).withOpacity(0.3)] 
              : [const Color(0xFFFEF2F2), const Color(0xFFF0FDF4)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)),
      ),
      child: Column(
        children: [
          Text(
            'স্ট্রিক ফাইট 🔥',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252),
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // You
              Expanded(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: iWon ? const Color(0xFF047857) : (isDark ? const Color(0xFF262626) : Colors.white),
                        shape: BoxShape.circle,
                        boxShadow: iWon ? [BoxShadow(color: const Color(0xFF047857).withOpacity(0.4), blurRadius: 12)] : null,
                      ),
                      child: Icon(
                        LucideIcons.flame, 
                        color: iWon ? Colors.white : const Color(0xFFA3A3A3),
                        size: iWon ? 32 : 24,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$myStreak',
                      style: TextStyle(
                        fontSize: 24, 
                        fontWeight: FontWeight.w900, 
                        color: iWon ? const Color(0xFF047857) : (isDark ? Colors.white : const Color(0xFF09090B)),
                      ),
                    ),
                    const Text('তুমি', style: TextStyle(fontSize: 12, color: Color(0xFF737373))),
                  ],
                ),
              ),
              
              // VS
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF09090B) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? const Color(0xFF404040) : const Color(0xFFD4D4D4)),
                ),
                child: const Text(
                  'VS',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFFA3A3A3)),
                ),
              ),
              
              // Opponent
              Expanded(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: opWon ? const Color(0xFF047857) : (isDark ? const Color(0xFF262626) : Colors.white),
                        shape: BoxShape.circle,
                        boxShadow: opWon ? [BoxShadow(color: const Color(0xFF047857).withOpacity(0.4), blurRadius: 12)] : null,
                      ),
                      child: Icon(
                        LucideIcons.flame, 
                        color: opWon ? Colors.white : const Color(0xFFA3A3A3),
                        size: opWon ? 32 : 24,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$opStreak',
                      style: TextStyle(
                        fontSize: 24, 
                        fontWeight: FontWeight.w900, 
                        color: opWon ? const Color(0xFF047857) : (isDark ? Colors.white : const Color(0xFF09090B)),
                      ),
                    ),
                    Text(opName.split(' ')[0], style: const TextStyle(fontSize: 12, color: Color(0xFF737373)), overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Premium Compare Cell ──────────────────────────────────────────────────────────
class _UPCompareCell extends StatelessWidget {
  final String label, myValStr, opponentValStr, opponentName;
  final double myVal, opponentVal;
  final bool isDark;

  const _UPCompareCell({
    required this.label,
    required this.myValStr,
    required this.opponentValStr,
    required this.myVal,
    required this.opponentVal,
    required this.opponentName,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final double maxVal = myVal > opponentVal ? myVal : opponentVal;
    final double myPct = maxVal > 0 ? (myVal / maxVal) : 0.0;
    final double opPct = maxVal > 0 ? (opponentVal / maxVal) : 0.0;
    
    final bool iWon = myVal >= opponentVal;
    
    final Color myColor = iWon ? const Color(0xFF047857) : const Color(0xFFB91C1C);
    final Color opColor = !iWon ? const Color(0xFF047857) : const Color(0xFFB91C1C);
    
    final Color trackColor = isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5);
    final Color textColor = isDark ? Colors.white : const Color(0xFF09090B);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFFA3A3A3),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('তুমি', style: TextStyle(fontSize: 12, color: Color(0xFF737373))),
              Text(myValStr, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor)),
            ],
          ),
          const SizedBox(height: 6),
          Stack(
            children: [
              Container(height: 6, decoration: BoxDecoration(color: trackColor, borderRadius: BorderRadius.circular(3))),
              FractionallySizedBox(
                widthFactor: myPct,
                child: Container(height: 6, decoration: BoxDecoration(color: myColor, borderRadius: BorderRadius.circular(3))),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  opponentName.split(' ')[0],
                  style: const TextStyle(fontSize: 12, color: Color(0xFF737373)),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(opponentValStr, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor)),
            ],
          ),
          const SizedBox(height: 6),
          Stack(
            children: [
              Container(height: 6, decoration: BoxDecoration(color: trackColor, borderRadius: BorderRadius.circular(3))),
              FractionallySizedBox(
                widthFactor: opPct,
                child: Container(height: 6, decoration: BoxDecoration(color: opColor, borderRadius: BorderRadius.circular(3))),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
"""

old_compare_cell = """class _UPCompareCell extends StatelessWidget {
  final String label, myVal, opponentVal, opponentName;
  final bool isDark;

  const _UPCompareCell({
    required this.label,
    required this.myVal,
    required this.opponentVal,
    required this.opponentName,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    decoration: BoxDecoration(
      color: isDark
          ? const Color(0xFF262626).withOpacity(0.5)
          : const Color(0xFFF5F5F5),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: Color(0xFFA3A3A3),
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              myVal,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark
                    ? const Color(0xFFD4D4D4)
                    : const Color(0xFF404040),
              ),
            ),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 6),
              width: 1,
              height: 16,
              color: isDark ? const Color(0xFF404040) : const Color(0xFFD4D4D4),
            ),
            Text(
              opponentVal,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF047857),
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'তুমি',
              style: TextStyle(fontSize: 12, color: Color(0xFFA3A3A3)),
            ),
            const SizedBox(width: 16),
            Flexible(
              child: Text(
                opponentName,
                style: const TextStyle(fontSize: 12, color: Color(0xFF047857)),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ],
    ),
  );
}"""

content = content.replace(old_compare_cell, "")

grid_view_old = """                        GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                          childAspectRatio: 2.4,
                          children: [
                            _UPCompareCell(
                              label: 'পরীক্ষা',
                              myVal: _myA.totalExams.toString(),
                              opponentVal: user.examsTaken.toString(),
                              opponentName: user.name.split(' ').first,
                              isDark: isDark,
                            ),
                            _UPCompareCell(
                              label: 'স্ট্রিক',
                              myVal: myProfile.streakCount.toString(),
                              opponentVal: user.streakCount.toString(),
                              opponentName: user.name.split(' ').first,
                              isDark: isDark,
                            ),
                            _UPCompareCell(
                              label: 'গড় স্কোর',
                              myVal: '${_myA.avgScore}%',
                              opponentVal: '${analytics.avgScore}%',
                              opponentName: user.name.split(' ').first,
                              isDark: isDark,
                            ),
                            _UPCompareCell(
                              label: 'সঠিক উত্তর',
                              myVal: _upFmt.format(_myA.totalCorrect),
                              opponentVal: _upFmt.format(
                                analytics.totalCorrect,
                              ),
                              opponentName: user.name.split(' ').first,
                              isDark: isDark,
                            ),
                          ],
                        ),"""

grid_view_new = """                        _UPStreakVSBanner(
                          myStreak: myProfile.streakCount,
                          opStreak: user.streakCount,
                          opName: user.name ?? 'Opponent',
                          isDark: isDark,
                        ),
                        const SizedBox(height: 16),
                        Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: _UPCompareCell(
                                    label: 'মোট পরীক্ষা',
                                    myValStr: _upFmt.format(_myA.totalExams),
                                    opponentValStr: _upFmt.format(analytics.totalExams),
                                    myVal: _myA.totalExams.toDouble(),
                                    opponentVal: analytics.totalExams.toDouble(),
                                    opponentName: user.name ?? 'Opponent',
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _UPCompareCell(
                                    label: 'গড় স্কোর',
                                    myValStr: '${_myA.avgScore}%',
                                    opponentValStr: '${analytics.avgScore}%',
                                    myVal: _myA.avgScore.toDouble(),
                                    opponentVal: analytics.avgScore.toDouble(),
                                    opponentName: user.name ?? 'Opponent',
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _UPCompareCell(
                                    label: 'সঠিক উত্তর',
                                    myValStr: _upFmt.format(_myA.totalCorrect),
                                    opponentValStr: _upFmt.format(analytics.totalCorrect),
                                    myVal: _myA.totalCorrect.toDouble(),
                                    opponentVal: analytics.totalCorrect.toDouble(),
                                    opponentName: user.name ?? 'Opponent',
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _UPCompareCell(
                                    label: 'মোট XP',
                                    myValStr: _upFmt.format(myProfile.xp),
                                    opponentValStr: _upFmt.format(user.xp),
                                    myVal: myProfile.xp.toDouble(),
                                    opponentVal: user.xp.toDouble(),
                                    opponentName: user.name ?? 'Opponent',
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),"""

content = content.replace(grid_view_old, grid_view_new)
content = content + premium_components

with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'w') as f:
    f.write(content)

