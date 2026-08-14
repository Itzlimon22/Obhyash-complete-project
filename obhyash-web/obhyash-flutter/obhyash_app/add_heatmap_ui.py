with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'r') as f:
    content = f.read()

# The target starts at: // ── Correct answers badge ──────────────────────────────────
# And ends at the SizedBox(height: 12) just before XP Comparison

start_idx = content.find("// ── Correct answers badge ──────────────────────────────────")
end_idx = content.find("// ── XP Comparison ──────────────────────────────────────────")

if start_idx != -1 and end_idx != -1:
    target = content[start_idx:end_idx]
    
    heatmap_ui = """// ── Premium Performance Gauge & Heatmap ─────────────────────
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'পারফরম্যান্স',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Circular Gauge
                          SizedBox(
                            width: 80,
                            height: 80,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                CircularProgressIndicator(
                                  value: 1.0,
                                  strokeWidth: 8,
                                  color: isDark ? const Color(0xFF262626) : const Color(0xFFF1F5F9),
                                ),
                                CircularProgressIndicator(
                                  value: analytics.totalExams > 0 ? (analytics.avgScore / 100.0) : 0,
                                  strokeWidth: 8,
                                  color: const Color(0xFF047857),
                                  strokeCap: StrokeCap.round,
                                ),
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      '${analytics.avgScore}%',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 24),
                          // Stats
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'মোট সঠিক উত্তর',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF737373),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _upFmt.format(analytics.totalCorrect),
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? const Color(0xFF047857) : const Color(0xFF047857),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'গত ৩০ দিনের অ্যাক্টিভিটি',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF737373),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Heatmap
                      SizedBox(
                        width: double.infinity,
                        child: Wrap(
                          spacing: 4,
                          runSpacing: 4,
                          children: List.generate(30, (index) {
                            final count = analytics.last30DaysActivity.isNotEmpty ? analytics.last30DaysActivity[index] : 0;
                            Color boxColor = isDark ? const Color(0xFF262626) : const Color(0xFFF1F5F9);
                            if (count > 0) {
                              double opacity = 0.3;
                              if (count > 1) opacity = 0.6;
                              if (count > 3) opacity = 0.8;
                              if (count > 5) opacity = 1.0;
                              boxColor = const Color(0xFF047857).withOpacity(opacity);
                            }
                            return Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                color: boxColor,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            );
                          }),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                """
    content = content.replace(target, heatmap_ui)

with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'w') as f:
    f.write(content)

