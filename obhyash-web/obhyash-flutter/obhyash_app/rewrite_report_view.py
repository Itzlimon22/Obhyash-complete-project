import sys

file_path = 'obhyash_app/lib/features/reports/presentation/student_report_view.dart'

with open(file_path, 'r') as f:
    content = f.read()

start_marker = "  @override\n  Widget build(BuildContext context) {"
state_class_idx = content.find("class _StudentReportViewState")
if state_class_idx == -1:
    print("Could not find class _StudentReportViewState")
    sys.exit(1)

build_idx = content.find(start_marker, state_class_idx)
if build_idx == -1:
    print("Could not find build method")
    sys.exit(1)

new_code = """  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Retry fetch when auth becomes available after cold-start session restore
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchReports();
    });

    final pendingCount = _reports
        .where((r) => r.status != 'Resolved' && r.status != 'Ignored')
        .length;
    final resolvedCount = _reports.where((r) => r.status == 'Resolved').length;
    final ignoredCount = _reports.where((r) => r.status == 'Ignored').length;

    return Column(
      children: [
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _hasError
              ? _errorState(isDark)
              : RefreshIndicator(
                  onRefresh: () => _fetchReports(),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // ── Premium Header ─────────────────────────────
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: isDark
                                  ? [const Color(0xFF1A0508), const Color(0xFF3F0F17)]
                                  : [const Color(0xFFFFF1F2), const Color(0xFFFFE4E6)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isDark ? const Color(0xFF7F1D2A).withValues(alpha: 0.3) : const Color(0xFFFECDD3),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFFB91C1C).withValues(alpha: 0.2) : Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFFB91C1C).withValues(alpha: 0.1),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  LucideIcons.alertTriangle,
                                  size: 24,
                                  color: Color(0xFFE11D48),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'আমার রিপোর্টসমূহ',
                                      style: TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? Colors.white : const Color(0xFF09090B),
                                      ),
                                    ),
                                    Text(
                                      'রিপোর্ট ও অ্যাডমিন ফিডব্যাক',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFFF43F5E),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // ── Dashboard-style Stats ────────────────────────────
                        if (_reports.isNotEmpty) ...[
                          Row(
                            children: [
                              Expanded(
                                child: _StatBox(
                                  label: 'অপেক্ষমান',
                                  value: pendingCount.toString(),
                                  icon: LucideIcons.clock,
                                  color: const Color(0xFFF59E0B),
                                  isDark: isDark,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _StatBox(
                                  label: 'গৃহীত',
                                  value: resolvedCount.toString(),
                                  icon: LucideIcons.checkCircle2,
                                  color: const Color(0xFF10B981),
                                  isDark: isDark,
                                ),
                              ),
                              if (ignoredCount > 0) ...[
                                const SizedBox(width: 10),
                                Expanded(
                                  child: _StatBox(
                                    label: 'বাতিল',
                                    value: ignoredCount.toString(),
                                    icon: LucideIcons.xCircle,
                                    color: const Color(0xFF6B7280),
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 20),

                          // ── Status Filter Pills ──────────────────────
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF09090B) : const Color(0xFFF4F4F5),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
                              ),
                            ),
                            child: Row(
                              children: [
                                _FilterPill(
                                  label: 'সব',
                                  isSelected: _statusFilter.isEmpty,
                                  isDark: isDark,
                                  onTap: () => setState(() => _statusFilter = ''),
                                ),
                                _FilterPill(
                                  label: 'অপেক্ষমান',
                                  isSelected: _statusFilter == 'pending',
                                  isDark: isDark,
                                  onTap: () => setState(() => _statusFilter = 'pending'),
                                ),
                                _FilterPill(
                                  label: 'গৃহীত',
                                  isSelected: _statusFilter == 'Resolved',
                                  isDark: isDark,
                                  onTap: () => setState(() => _statusFilter = 'Resolved'),
                                ),
                                _FilterPill(
                                  label: 'বাতিল',
                                  isSelected: _statusFilter == 'Ignored',
                                  isDark: isDark,
                                  onTap: () => setState(() => _statusFilter = 'Ignored'),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],

                        // ── Empty state ──────────────────────────────
                        if (_filteredReports.isEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              vertical: 60,
                              horizontal: 24,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isDark
                                    ? [const Color(0xFF09090B), const Color(0xFF171717)]
                                    : [Colors.white, const Color(0xFFF9FAFB)],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: isDark ? Colors.black26 : const Color(0x0A000000),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                )
                              ],
                            ),
                            child: Column(
                              children: [
                                Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF262626) : const Color(0xFFF3F4F6),
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: isDark ? Colors.black45 : const Color(0x1A000000),
                                        blurRadius: 10,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    LucideIcons.inbox,
                                    size: 36,
                                    color: Color(0xFF9CA3AF),
                                  ),
                                ),
                                const SizedBox(height: 24),
                                Text(
                                  'কোনো রিপোর্ট পাওয়া যায়নি',
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? Colors.white : const Color(0xFF09090B),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _reports.isEmpty
                                      ? 'তুমি এখন পর্যন্ত কোনো প্রশ্ন রিপোর্ট করোনি।\nপ্রশ্নে কোনো ভুল পেলে রিপোর্ট করতে পারো।'
                                      : 'এই ফিল্টারে কোনো রিপোর্ট পাওয়া যায়নি।',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    color: Color(0xFFA3A3A3),
                                    height: 1.5,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          )
                        else ...[
                          // ── Report list ──────────────────────────────
                          ...List.generate(_filteredReports.length, (i) {
                            final report = _filteredReports[i];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: _ReportCard(
                                report: report,
                                isDark: isDark,
                                isExpanded: _expandedId == report.id,
                                onToggle: () => setState(() {
                                  _expandedId = _expandedId == report.id ? null : report.id;
                                }),
                                onShowQuestion: () => _showQuestion(context, report, isDark),
                              ),
                            );
                          }),

                          // ── Load more ────────────────────────────────
                          if (_hasMore && _statusFilter.isEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: OutlinedButton(
                                onPressed: _isLoadingMore ? null : () => _fetchReports(loadMore: true),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 16,
                                  ),
                                  backgroundColor: isDark ? const Color(0xFF09090B) : Colors.white,
                                  foregroundColor: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF525252),
                                  side: BorderSide(
                                    color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: _isLoadingMore
                                    ? const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          SizedBox(
                                            width: 16,
                                            height: 16,
                                            child: CircularProgressIndicator(strokeWidth: 2),
                                          ),
                                          SizedBox(width: 12),
                                          Text(
                                            'লোড হচ্ছে...',
                                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                          ),
                                        ],
                                      )
                                    : const Text(
                                        'আরো দেখো',
                                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                              ),
                            ),
                        ],
                      ],
                    ),
                  ),
                ),
        ),
      ],
    );
  }

  // Question view dialog helper
  void _showQuestion(BuildContext context, AppReport report, bool isDark) {
    if (report.question == null) return;
    final q = report.question!;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(ctx).size.height * 0.85,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF09090B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'সম্পূর্ণ প্রশ্ন',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF09090B),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              Divider(
                height: 1,
                color: isDark ? const Color(0xFF262626) : const Color(0xFFF0F0F0),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _subjectName(q.subject),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        q.question,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF09090B),
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),
                      ...List.generate(q.options.length, (idx) {
                        final isCorrect = q.correctAnswerIndices?.contains(idx) ?? false;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isCorrect
                                ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                                : (isDark ? const Color(0xFF171717) : Colors.white),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isCorrect
                                  ? (isDark ? const Color(0xFF059669) : const Color(0xFF10B981))
                                  : (isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: isCorrect
                                      ? (isDark ? const Color(0xFF10B981) : const Color(0xFF059669))
                                      : (isDark ? const Color(0xFF262626) : const Color(0xFFF3F4F6)),
                                  shape: BoxShape.circle,
                                ),
                                child: Text(
                                  String.fromCharCode(65 + idx),
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isCorrect
                                        ? Colors.white
                                        : (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF4B5563)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  q.options[idx],
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: isCorrect
                                        ? (isDark ? Colors.white : const Color(0xFF064E3B))
                                        : (isDark ? const Color(0xFFD4D4D4) : const Color(0xFF1F2937)),
                                    fontWeight: isCorrect ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                              ),
                              if (isCorrect)
                                const Icon(LucideIcons.checkCircle2, color: Color(0xFF10B981), size: 20),
                            ],
                          ),
                        );
                      }),
                      if (q.explanation != null && q.explanation!.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(LucideIcons.lightbulb, size: 16, color: isDark ? const Color(0xFFFCD34D) : const Color(0xFFD97706)),
                                  const SizedBox(width: 8),
                                  Text(
                                    'ব্যাখ্যা',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: isDark ? const Color(0xFFFCD34D) : const Color(0xFFD97706),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                q.explanation!,
                                style: TextStyle(
                                  fontSize: 15,
                                  color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─── Stat Box ────────────────────────────────────────────────────────────────────
class _StatBox extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _StatBox({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x05000000),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : const Color(0xFF09090B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFFA3A3A3),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────────
class _FilterPill extends StatelessWidget {
  final String label;
  final bool isSelected, isDark;
  final VoidCallback onTap;

  const _FilterPill({
    required this.label,
    required this.isSelected,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? const Color(0xFF262626) : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected && !isDark
                ? [
                    const BoxShadow(
                      color: Color(0x0A000000),
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ]
                : [],
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected
                  ? (isDark ? Colors.white : const Color(0xFF09090B))
                  : const Color(0xFFA3A3A3),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Report Card ─────────────────────────────────────────────────────────────────
class _ReportCard extends StatelessWidget {
  final AppReport report;
  final bool isDark, isExpanded;
  final VoidCallback onToggle;
  final VoidCallback onShowQuestion;

  const _ReportCard({
    required this.report,
    required this.isDark,
    required this.isExpanded,
    required this.onToggle,
    required this.onShowQuestion,
  });

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('d MMMM yyyy').format(report.createdAt);
    final subjKey = report.question?.subject ?? '';

    final (Color statusColor, String statusLabel, IconData statusIcon) = switch (report.status) {
      'Resolved' => (const Color(0xFF10B981), 'গৃহীত', LucideIcons.checkCircle2),
      'Ignored' => (const Color(0xFF6B7280), 'বাতিল', LucideIcons.xCircle),
      _ => (const Color(0xFFF59E0B), 'অপেক্ষমান', LucideIcons.clock),
    };

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x05000000),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
      ),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Indicator Bar
            Container(width: 4, color: statusColor),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Header ────────────────────────────────────────────────
                  InkWell(
                    onTap: onToggle,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Status Icon Box
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              statusIcon,
                              size: 20,
                              color: statusColor,
                            ),
                          ),
                          const SizedBox(width: 14),

                          // Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        subjKey.isNotEmpty ? _subjectName(subjKey) : 'Unknown Subject',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w900,
                                          color: isDark ? Colors.white : const Color(0xFF09090B),
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                                      ),
                                      child: Text(
                                        statusLabel,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: statusColor,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(LucideIcons.calendarDays, size: 12, color: Color(0xFFA3A3A3)),
                                    const SizedBox(width: 6),
                                    Text(
                                      dateStr,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFA3A3A3),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                RichText(
                                  text: TextSpan(
                                    children: [
                                      TextSpan(
                                        text: 'কারণ: ',
                                        style: TextStyle(
                                          fontSize: 15,
                                          color: isDark ? const Color(0xFF737373) : const Color(0xFFA3A3A3),
                                        ),
                                      ),
                                      TextSpan(
                                        text: report.reason,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
                                        ),
                                      ),
                                    ],
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(width: 8),
                          // Chevron
                          AnimatedRotation(
                            duration: const Duration(milliseconds: 200),
                            turns: isExpanded ? 0.5 : 0,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                LucideIcons.chevronDown,
                                size: 18,
                                color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Expanded Details ──────────────────────────────────────
                  AnimatedSize(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    child: isExpanded
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Divider(
                                height: 1,
                                color: isDark ? const Color(0xFF262626) : const Color(0xFFF0F0F0),
                              ),
                              Container(
                                color: isDark ? const Color(0x1A000000) : const Color(0xFFFAFAFA),
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    if (report.question != null)
                                      Container(
                                        margin: const EdgeInsets.only(bottom: 16),
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: isDark
                                                ? [const Color(0xFF262626), const Color(0xFF171717)]
                                                : [Colors.white, const Color(0xFFF9FAFB)],
                                          ),
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(
                                            color: isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5),
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: isDark ? Colors.black26 : const Color(0x05000000),
                                              blurRadius: 8,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: Material(
                                          color: Colors.transparent,
                                          child: InkWell(
                                            onTap: onShowQuestion,
                                            borderRadius: BorderRadius.circular(16),
                                            child: Padding(
                                              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                                              child: Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  Icon(LucideIcons.fileSearch, size: 18, color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040)),
                                                  const SizedBox(width: 10),
                                                  Text(
                                                    'সম্পূর্ণ প্রশ্ন ও অপশন দেখো',
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 15,
                                                      color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),

                                    // User Comment Bubble
                                    _ChatBubble(
                                      role: 'তুমি',
                                      message: report.description ?? 'কোনো বিবরণ নেই',
                                      isDark: isDark,
                                      isUser: true,
                                    ),

                                    // Reference image
                                    if (report.imageUrl != null) ...[
                                      const SizedBox(height: 16),
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: Container(
                                          width: 200,
                                          height: 140,
                                          decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(16),
                                            border: Border.all(
                                              color: isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5),
                                              width: 2,
                                            ),
                                            boxShadow: const [
                                              BoxShadow(
                                                color: Color(0x1A000000),
                                                blurRadius: 8,
                                                offset: Offset(0, 4),
                                              ),
                                            ],
                                          ),
                                          clipBehavior: Clip.antiAlias,
                                          child: Stack(
                                            fit: StackFit.expand,
                                            children: [
                                              Image.network(
                                                report.imageUrl!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) =>
                                                    const Center(child: Icon(LucideIcons.imageOff)),
                                              ),
                                              Positioned(
                                                bottom: 8,
                                                right: 8,
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                  decoration: BoxDecoration(
                                                    color: Colors.black87,
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: const Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(LucideIcons.image, size: 10, color: Colors.white),
                                                      SizedBox(width: 4),
                                                      Text('Reference', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],

                                    // Admin feedback
                                    if (report.adminComment != null && report.adminComment!.isNotEmpty) ...[
                                      const SizedBox(height: 16),
                                      _ChatBubble(
                                        role: 'অ্যাডমিন',
                                        message: report.adminComment!,
                                        isDark: isDark,
                                        isUser: false,
                                      ),
                                    ] else if (report.status != 'Resolved' && report.status != 'Ignored') ...[
                                      const SizedBox(height: 16),
                                      _ChatBubble(
                                        role: 'সিস্টেম',
                                        message: 'তোমার রিপোর্টটি টিমের কাছে পাঠানো হয়েছে। খুব শিগগিরই রিভিউ করা হবে।',
                                        isDark: isDark,
                                        isUser: false,
                                        isSystem: true,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          )
                        : const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────────
class _ChatBubble extends StatelessWidget {
  final String role;
  final String message;
  final bool isDark;
  final bool isUser;
  final bool isSystem;

  const _ChatBubble({
    required this.role,
    required this.message,
    required this.isDark,
    required this.isUser,
    this.isSystem = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (!isUser) ...[
                  Icon(isSystem ? LucideIcons.bot : LucideIcons.shieldCheck, size: 12, color: const Color(0xFFA3A3A3)),
                  const SizedBox(width: 4),
                ],
                Text(
                  role,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFA3A3A3),
                    letterSpacing: 0.5,
                  ),
                ),
                if (isUser) ...[
                  const SizedBox(width: 4),
                  const Icon(LucideIcons.user, size: 12, color: Color(0xFFA3A3A3)),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isUser
                  ? (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9))
                  : isSystem
                      ? (isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5))
                      : (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5)),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isUser ? 16 : 4),
                bottomRight: Radius.circular(isUser ? 4 : 16),
              ),
              border: Border.all(
                color: isUser
                    ? (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))
                    : isSystem
                        ? (isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5))
                        : (isDark ? const Color(0xFF065F46) : const Color(0xFFD1FAE5)),
              ),
            ),
            child: Text(
              message,
              style: TextStyle(
                fontSize: 15,
                color: isUser
                    ? (isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155))
                    : isSystem
                        ? (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373))
                        : (isDark ? const Color(0xFFD1FAE5) : const Color(0xFF065F46)),
                height: 1.5,
                fontStyle: isSystem ? FontStyle.italic : FontStyle.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
"""

with open(file_path, 'w') as f:
    f.write(content[:build_idx] + new_code)
print("File rewritten successfully")
