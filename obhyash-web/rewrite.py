import os

filepath = 'obhyash-flutter/obhyash_app/lib/features/history/presentation/exam_history_view.dart'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to keep lines 1 to 286 (Models, Helpers, Main View state up to build method start)
# And replace the rest.

# Find the start of build method
build_idx = -1
for i, line in enumerate(lines):
    if 'Widget build(BuildContext context)' in line:
        build_idx = i - 1
        break

header = "".join(lines[:build_idx])

ui_code = """
  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetch();
    });

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      children: [
        // ── Custom Premium Tab Bar ──────────────────────────────────────────
        Container(
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE5E7EB)),
          ),
          child: TabBar(
            controller: _tab,
            indicator: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF047857), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            labelColor: Colors.white,
            unselectedLabelColor: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF6B7280),
            labelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
              fontFamily: 'HindSiliguri',
            ),
            dividerColor: Colors.transparent,
            tabs: const [
              Tab(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.barChart2, size: 16),
                    SizedBox(width: 6),
                    Text('পরীক্ষা'),
                  ],
                ),
              ),
              Tab(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.alertTriangle, size: 16),
                    SizedBox(width: 6),
                    Text('ভুলসমূহ'),
                  ],
                ),
              ),
            ],
          ),
        ),

        // ── Filters ─────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(
            children: [
              // Search Bar
              Container(
                height: 44,
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE5E7EB),
                  ),
                ),
                child: TextField(
                  onChanged: (v) => setState(() => _searchText = v),
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? Colors.white : const Color(0xFF111827),
                    fontFamily: 'HindSiliguri',
                  ),
                  decoration: InputDecoration(
                    hintText: 'খুঁজুন...',
                    hintStyle: TextStyle(
                      fontSize: 14,
                      color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF9CA3AF),
                      fontFamily: 'HindSiliguri',
                    ),
                    prefixIcon: Icon(
                      LucideIcons.search,
                      size: 18,
                      color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF9CA3AF),
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              // Subject & Date Row
              Row(
                children: [
                  Expanded(
                    child: AppDropdown<String>(
                      value: _filterSubject.isEmpty ? '' : _filterSubject,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                      options: [
                        const AppDropdownOption(value: '', label: 'সকল বিষয়'),
                        ..._uniqueSubjects.map(
                          (s) => AppDropdownOption(value: s.key, label: s.value),
                        ),
                      ],
                      onChanged: (v) => setState(() => _filterSubject = v ?? ''),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Date filter chip
                  GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _filterDate ?? DateTime.now(),
                        firstDate: DateTime(2023),
                        lastDate: DateTime.now(),
                      );
                      setState(() => _filterDate = picked);
                    },
                    child: Container(
                      height: 44,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: _filterDate != null
                            ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                            : (isDark ? const Color(0xFF1E1E1E) : Colors.white),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _filterDate != null
                              ? const Color(0xFF10B981) // emerald-500
                              : (isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE5E7EB)),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.calendar,
                            size: 18,
                            color: _filterDate != null
                                ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                                : (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF9CA3AF)),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _filterDate != null
                                ? DateFormat('d/M').format(_filterDate!)
                                : 'তারিখ',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: _filterDate != null
                                  ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                                  : (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF9CA3AF)),
                            ),
                          ),
                          if (_filterDate != null) ...[
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () => setState(() => _filterDate = null),
                              child: Icon(
                                LucideIcons.x,
                                size: 16,
                                color: isDark ? const Color(0xFF34D399) : const Color(0xFF047857),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 8),

        // ── Content ─────────────────────────────────────────────────────────
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
              : _hasError
              ? _errorState(isDark, _fetch)
              : TabBarView(
                  controller: _tab,
                  children: [
                    _ExamsTab(
                      records: _sortedFiltered,
                      isDark: isDark,
                      onClear: _history.isEmpty ? null : _clearHistory,
                      isClearing: _isClearing,
                      sortBy: _sortBy,
                      onSortChange: (s) => setState(() => _sortBy = s),
                      onRefresh: _fetch,
                    ),
                    _MistakesTab(isDark: isDark),
                  ],
                ),
        ),
      ],
    );
  }
}

// ─── Exams Tab ─────────────────────────────────────────────────────────────────
class _ExamsTab extends StatelessWidget {
  final List<_ExamRecord> records;
  final bool isDark;
  final VoidCallback? onClear;
  final bool isClearing;
  final _SortMode sortBy;
  final void Function(_SortMode) onSortChange;
  final Future<void> Function() onRefresh;

  const _ExamsTab({
    required this.records,
    required this.isDark,
    this.onClear,
    required this.isClearing,
    required this.sortBy,
    required this.onSortChange,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        color: const Color(0xFF10B981),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.5,
              child: _emptyState(
                isDark,
                'কোনো পরীক্ষা দেওয়া হয়নি',
                'একটি পরীক্ষা দাও এবং তোমার অগ্রগতি এখানে দেখো।',
              ),
            ),
          ],
        ),
      );
    }

    int totalQuestions = 0;
    int totalCorrect = 0;
    int totalWrong = 0;
    int totalTime = 0;

    for (final r in records) {
      totalQuestions += r.totalQuestions;
      totalCorrect += r.correctCount;
      totalWrong += r.wrongCount;
      totalTime += r.timeTaken ?? 0;
    }

    final avgScore = records.isEmpty ? 0.0 : records.map((r) => r.score).reduce((a, b) => a + b) / records.length;
    final avgTime = records.isEmpty ? 0 : (totalTime / records.length).round();
    final totalTimeMins = totalTime > 0 ? (totalTime / 60).round() : 0;

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: const Color(0xFF10B981),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          // Sort & Clear Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              AppDropdown<_SortMode>(
                value: sortBy,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                options: const [
                  AppDropdownOption(value: _SortMode.date, label: 'তারিখ অনুযায়ী'),
                  AppDropdownOption(value: _SortMode.scoreDesc, label: 'স্কোর: বেশি আগে'),
                  AppDropdownOption(value: _SortMode.scoreAsc, label: 'স্কোর: কম আগে'),
                ],
                onChanged: (v) {
                  if (v != null) onSortChange(v);
                },
              ),
              if (onClear != null)
                TextButton.icon(
                  onPressed: isClearing ? null : onClear,
                  icon: isClearing
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFEF4444)),
                        )
                      : const Icon(LucideIcons.trash2, size: 14, color: Color(0xFFEF4444)),
                  label: const Text(
                    'মুছুন',
                    style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 13, fontFamily: 'HindSiliguri'),
                  ),
                  style: TextButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444).withOpacity(0.1),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // ── Stats Grid (Premium Glassmorphic) ──
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.65,
            children: [
              _buildStatCard(
                title: 'মোট প্রশ্ন',
                value: '$totalQuestions',
                icon: LucideIcons.layers,
                gradient: const [Color(0xFF047857), Color(0xFF10B981)],
                textColor: Colors.white,
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'সঠিক',
                value: '$totalCorrect',
                icon: LucideIcons.checkCircle2,
                gradient: isDark ? const [Color(0xFF064E3B), Color(0xFF065F46)] : const [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                textColor: isDark ? const Color(0xFF34D399) : const Color(0xFF059669),
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'ভুল',
                value: '$totalWrong',
                icon: LucideIcons.xCircle,
                gradient: isDark ? const [Color(0xFF450A0A), Color(0xFF7F1D1D)] : const [Color(0xFFFEF2F2), Color(0xFFFEE2E2)],
                textColor: isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626),
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'গড় নম্বর',
                value: '${avgScore.round()}%',
                icon: LucideIcons.target,
                gradient: isDark ? const [Color(0xFF262626), Color(0xFF333333)] : const [Color(0xFFF3F4F6), Color(0xFFE5E7EB)],
                textColor: isDark ? Colors.white : const Color(0xFF111827),
                isDark: isDark,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'সাম্প্রতিক পরীক্ষাসমূহ',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          // Exam cards
          ...records.map((r) => _ExamCard(record: r, isDark: isDark)),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required List<Color> gradient,
    required Color textColor,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: gradient.last.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
        ],
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.05) : Colors.transparent,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: textColor.withOpacity(0.8)),
              const SizedBox(width: 6),
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: textColor.withOpacity(0.9),
                  fontFamily: 'HindSiliguri',
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: textColor,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  final _ExamRecord record;
  final bool isDark;

  const _ExamCard({required this.record, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final color = _scoreColor(record.score);
    final dateStr = DateFormat('d MMM yyyy, h:mm a').format(record.createdAt);
    final label = record.subjectLabel.isNotEmpty
        ? record.subjectLabel
        : _subjectDisplay(record.subject);
    final timeStr = record.timeTaken != null ? _formatDur(record.timeTaken!) : '--';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: isDark
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]
            : [
                BoxShadow(
                  color: const Color(0xFF000000).withOpacity(0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
        border: Border.all(
          color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFF3F4F6),
        ),
      ),
      child: Row(
        children: [
          // Score Ring (Premium look)
          SizedBox(
            width: 52,
            height: 52,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: 1.0,
                  strokeWidth: 4.5,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isDark ? const Color(0xFF2E2E2E) : const Color(0xFFF3F4F6),
                  ),
                ),
                CircularProgressIndicator(
                  value: record.score / 100,
                  strokeWidth: 4.5,
                  strokeCap: StrokeCap.round,
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                ),
                Center(
                  child: Text(
                    '${record.score.round()}%',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF111827),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Middle details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white : const Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(LucideIcons.calendar, size: 12, color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF6B7280)),
                    const SizedBox(width: 4),
                    Text(
                      dateStr,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${record.correctCount} সঠিক, ${record.wrongCount} ভুল',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF4B5563),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(LucideIcons.timer, size: 11, color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF4B5563)),
                          const SizedBox(width: 4),
                          Text(
                            timeStr,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF4B5563),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
"""

with open('rewrite_temp_1.dart', 'w', encoding='utf-8') as f:
    f.write(header + ui_code)
