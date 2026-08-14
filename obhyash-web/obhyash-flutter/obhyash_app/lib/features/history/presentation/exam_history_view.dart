import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/app_popups.dart';

import '../../../core/presentation/widgets/app_dropdown.dart';

import 'package:intl/intl.dart';
import '../../../core/providers/auth_provider.dart';

// ─── Models ────────────────────────────────────────────────────────────────────
class _ExamRecord {
  final String id;
  final String subject;
  final String subjectLabel;
  final int correctCount;
  final int wrongCount;
  final int totalQuestions;
  final int? timeTaken;
  final double score; // 0-100
  final DateTime createdAt;
  final String examType;

  const _ExamRecord({
    required this.id,
    required this.subject,
    required this.subjectLabel,
    required this.correctCount,
    required this.wrongCount,
    required this.totalQuestions,
    this.timeTaken,
    required this.score,
    required this.createdAt,
    required this.examType,
  });

  factory _ExamRecord.fromJson(Map<String, dynamic> j) {
    int toInt(dynamic v) {
      if (v == null) return 0;
      if (v is num) return v.toInt();
      if (v is String) return int.tryParse(v) ?? 0;
      return 0;
    }

    final total = toInt(j['total_questions']);
    final correct = toInt(j['correct_count']);
    final wrong = toInt(j['wrong_count']);
    final score = total > 0 ? (correct / total * 100) : 0.0;

    // date and created_at can be null, try parsing
    final dateStr = j['date']?.toString() ?? j['created_at']?.toString() ?? '';
    final createdAt = DateTime.tryParse(dateStr) ?? DateTime.now();

    return _ExamRecord(
      id: j['id']?.toString() ?? '',
      subject: j['subject']?.toString() ?? 'general',
      subjectLabel:
          j['subject_label']?.toString() ??
          j['subject']?.toString() ??
          'পরীক্ষা',
      correctCount: correct,
      wrongCount: wrong,
      totalQuestions: total,
      timeTaken: j['time_taken'] != null ? toInt(j['time_taken']) : null,
      score: score,
      createdAt: createdAt,
      examType: j['exam_type']?.toString() ?? 'mock',
    );
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
String _subjectDisplay(String key) {
  const map = {
    'physics': 'পদার্থবিজ্ঞান',
    'chemistry': 'রসায়ন',
    'biology': 'জীববিজ্ঞান',
    'math': 'গণিত',
    'bangla': 'বাংলা',
    'english': 'ইংরেজি',
    'ict': 'আইসিটি',
    'general_knowledge': 'সাধারণ জ্ঞান',
    'general': 'সাধারণ',
  };
  return map[key.toLowerCase()] ?? key;
}

String _formatDur(int secs) {
  final m = secs ~/ 60;
  final s = secs % 60;
  return '$mমি $sসে';
}

Color _scoreColor(double s) {
  if (s >= 70) return const Color(0xFF059669);
  if (s >= 40) return const Color(0xFF1E3A8A);
  return const Color(0xFFEF4444);
}

String _examTypeLabel(String type) {
  return switch (type.toLowerCase()) {
    'chapter' => 'অধ্যায়',
    'subject' => 'বিষয়',
    'custom' => 'কাস্টম',
    _ => type,
  };
}

enum _SortMode { date, scoreDesc, scoreAsc }

// ─── Main View ─────────────────────────────────────────────────────────────────
class ExamHistoryView extends ConsumerStatefulWidget {
  const ExamHistoryView({super.key});

  @override
  ConsumerState<ExamHistoryView> createState() => _ExamHistoryViewState();
}

class _ExamHistoryViewState extends ConsumerState<ExamHistoryView>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  List<_ExamRecord> _history = [];
  bool _isLoading = true;
  bool _isClearing = false;
  bool _hasError = false;
  _SortMode _sortBy = _SortMode.date;

  String _filterSubject = '';
  DateTime? _filterDate;
  String _searchText = '';

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _fetch();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _fetch() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });
    try {
      final sb = Supabase.instance.client;
      final authResponse = await sb.auth.getSession();
      final uid = sb.auth.currentUser?.id ?? authResponse?.user.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      final data = await sb
          .from('exam_results')
          .select(
            'id, subject, subject_label, correct_count, wrong_count, total_questions, time_taken, created_at, date, exam_type',
          )
          .eq('user_id', uid)
          .order('date', ascending: false)
          .limit(200);

      if (mounted) {
        setState(() {
          _history = (data as List)
              .map((r) => _ExamRecord.fromJson(r as Map<String, dynamic>))
              .toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[ExamHistoryView] _fetch error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  List<_ExamRecord> get _filtered {
    return _history.where((h) {
      if (_filterSubject.isNotEmpty && h.subject != _filterSubject) {
        return false;
      }
      if (_filterDate != null) {
        final d = h.createdAt;
        if (d.year != _filterDate!.year ||
            d.month != _filterDate!.month ||
            d.day != _filterDate!.day) {
          return false;
        }
      }
      if (_searchText.isNotEmpty) {
        final q = _searchText.toLowerCase();
        if (!h.subjectLabel.toLowerCase().contains(q) &&
            !_subjectDisplay(h.subject).toLowerCase().contains(q) &&
            !_examTypeLabel(h.examType).toLowerCase().contains(q)) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  List<_ExamRecord> get _sortedFiltered {
    final list = List<_ExamRecord>.from(_filtered);
    switch (_sortBy) {
      case _SortMode.scoreDesc:
        list.sort((a, b) => b.score.compareTo(a.score));
      case _SortMode.scoreAsc:
        list.sort((a, b) => a.score.compareTo(b.score));
      case _SortMode.date:
        break;
    }
    return list;
  }

  List<MapEntry<String, String>> get _uniqueSubjects {
    final seen = <String, String>{};
    for (final h in _history) {
      if (!seen.containsKey(h.subject)) {
        seen[h.subject] = h.subjectLabel.isNotEmpty
            ? h.subjectLabel
            : _subjectDisplay(h.subject);
      }
    }
    final list = seen.entries.toList()
      ..sort((a, b) => a.value.compareTo(b.value));
    return list;
  }

  Future<void> _clearHistory() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('ইতিহাস মুছবেন?'),
        content: const Text('এই অ্যাকশনটি ফিরিয়ে আনা যাবে না।'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('বাতিল'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('মুছুন', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _isClearing = true);
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid != null) {
        await sb.from('exam_results').delete().eq('user_id', uid);
        setState(() {
          _history = [];
        });
        if (mounted) {
          AppPopups.show(
            context,
            message: 'ইতিহাস মুছে ফেলা হয়েছে',
            isError: false,
          );
        }
      }
    } catch (e) {
      if (mounted) {
        AppPopups.show(
          context,
          message: 'ইতিহাস মুছতে সমস্যা হয়েছে',
          isError: true,
        );
      }
      debugPrint('[ExamHistoryView] _clearHistory error: $e');
    } finally {
      if (mounted) setState(() => _isClearing = false);
    }
  }

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
            border: Border.all(
              color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE5E7EB),
            ),
          ),
          child: TabBar(
            controller: _tab,
            indicator: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF059669), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            labelColor: Colors.white,
            unselectedLabelColor: isDark
                ? const Color(0xFFA3A3A3)
                : const Color(0xFF6B7280),
            labelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
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
                    color: isDark
                        ? const Color(0xFF2E2E2E)
                        : const Color(0xFFE5E7EB),
                  ),
                ),
                child: TextField(
                  onChanged: (v) => setState(() => _searchText = v),
                  style: TextStyle(
                    fontSize: 16,
                    color: isDark ? Colors.white : const Color(0xFF111827),
                    fontFamily: 'HindSiliguri',
                  ),
                  decoration: InputDecoration(
                    hintText: 'খুঁজুন...',
                    hintStyle: TextStyle(
                      fontSize: 16,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF9CA3AF),
                      fontFamily: 'HindSiliguri',
                    ),
                    prefixIcon: Icon(
                      LucideIcons.search,
                      size: 18,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF9CA3AF),
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 11,
                      ),
                      options: [
                        const AppDropdownOption(value: '', label: 'সকল বিষয়'),
                        ..._uniqueSubjects.map(
                          (s) =>
                              AppDropdownOption(value: s.key, label: s.value),
                        ),
                      ],
                      onChanged: (v) =>
                          setState(() => _filterSubject = v ?? ''),
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
                            ? (isDark
                                  ? const Color(0xFF064E3B)
                                  : const Color(0xFFECFDF5))
                            : (isDark ? const Color(0xFF1E1E1E) : Colors.white),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _filterDate != null
                              ? const Color(0xFF10B981) // emerald-500
                              : (isDark
                                    ? const Color(0xFF2E2E2E)
                                    : const Color(0xFFE5E7EB)),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            LucideIcons.calendar,
                            size: 18,
                            color: _filterDate != null
                                ? (isDark
                                      ? const Color(0xFF34D399)
                                      : const Color(0xFF059669))
                                : (isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF9CA3AF)),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _filterDate != null
                                ? DateFormat('d/M').format(_filterDate!)
                                : 'তারিখ',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: _filterDate != null
                                  ? (isDark
                                        ? const Color(0xFF34D399)
                                        : const Color(0xFF059669))
                                  : (isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(0xFF9CA3AF)),
                            ),
                          ),
                          if (_filterDate != null) ...[
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () => setState(() => _filterDate = null),
                              child: Icon(
                                LucideIcons.x,
                                size: 16,
                                color: isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF059669),
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
              ? const Center(
                  child: CircularProgressIndicator(color: Color(0xFF10B981)),
                )
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

    for (final r in records) {
      totalQuestions += r.totalQuestions;
      totalCorrect += r.correctCount;
      totalWrong += r.wrongCount;
    }

    final avgScore = records.isEmpty
        ? 0.0
        : records.map((r) => r.score).reduce((a, b) => a + b) / records.length;

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
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                options: const [
                  AppDropdownOption(
                    value: _SortMode.date,
                    label: 'তারিখ অনুযায়ী',
                  ),
                  AppDropdownOption(
                    value: _SortMode.scoreDesc,
                    label: 'স্কোর: বেশি আগে',
                  ),
                  AppDropdownOption(
                    value: _SortMode.scoreAsc,
                    label: 'স্কোর: কম আগে',
                  ),
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
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFFEF4444),
                          ),
                        )
                      : const Icon(
                          LucideIcons.trash2,
                          size: 14,
                          color: Color(0xFFEF4444),
                        ),
                  label: const Text(
                    'মুছুন',
                    style: TextStyle(
                      color: Color(0xFFEF4444),
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                  style: TextButton.styleFrom(
                    backgroundColor: const Color(
                      0xFFEF4444,
                    ).withValues(alpha: 0.1),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
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
                gradient: const [Color(0xFF059669), Color(0xFF10B981)],
                textColor: Colors.white,
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'সঠিক',
                value: '$totalCorrect',
                icon: LucideIcons.checkCircle2,
                gradient: isDark
                    ? const [Color(0xFF064E3B), Color(0xFF065F46)]
                    : const [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                textColor: isDark
                    ? const Color(0xFF34D399)
                    : const Color(0xFF059669),
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'ভুল',
                value: '$totalWrong',
                icon: LucideIcons.xCircle,
                gradient: isDark
                    ? const [Color(0xFF450A0A), Color(0xFF7F1D1D)]
                    : const [Color(0xFFFEF2F2), Color(0xFFFEE2E2)],
                textColor: isDark
                    ? const Color(0xFFF87171)
                    : const Color(0xFFDC2626),
                isDark: isDark,
              ),
              _buildStatCard(
                title: 'গড় নম্বর',
                value: '${avgScore.round()}%',
                icon: LucideIcons.target,
                gradient: isDark
                    ? const [Color(0xFF1C1C1E), Color(0xFF333333)]
                    : const [Color(0xFFF3F4F6), Color(0xFFE5E7EB)],
                textColor: isDark ? Colors.white : const Color(0xFF111827),
                isDark: isDark,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'সাম্প্রতিক পরীক্ষাসমূহ',
            style: TextStyle(
              fontSize: 18,
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
              color: gradient.last.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
        ],
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.05)
              : Colors.transparent,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: textColor.withValues(alpha: 0.8)),
              const SizedBox(width: 6),
              Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: textColor.withValues(alpha: 0.9),
                  fontFamily: 'HindSiliguri',
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
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
    final timeStr = record.timeTaken != null
        ? _formatDur(record.timeTaken!)
        : '--';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: isDark
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ]
            : [
                BoxShadow(
                  color: const Color(0xFF000000).withValues(alpha: 0.04),
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
                      fontSize: 15,
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
                    fontSize: 18,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white : const Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      LucideIcons.calendar,
                      size: 12,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF6B7280),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      dateStr,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'HindSiliguri',
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF2E2E2E)
                            : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${record.correctCount} সঠিক, ${record.wrongCount} ভুল',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'HindSiliguri',
                          color: isDark
                              ? const Color(0xFFD4D4D4)
                              : const Color(0xFF4B5563),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF2E2E2E)
                            : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.timer,
                            size: 11,
                            color: isDark
                                ? const Color(0xFFD4D4D4)
                                : const Color(0xFF4B5563),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            timeStr,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFD4D4D4)
                                  : const Color(0xFF4B5563),
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
// ─── Mistakes Tab ──────────────────────────────────────────────────────────────

class _HistoryMistake {
  final String id;
  final String questionText;
  final List<String> options;
  final int correctAnswerIndex;
  final int userAnswerIndex;
  final String subjectLabel;
  final int frequency;

  const _HistoryMistake({
    required this.id,
    required this.questionText,
    required this.options,
    required this.correctAnswerIndex,
    required this.userAnswerIndex,
    required this.subjectLabel,
    required this.frequency,
  });
}

class _MistakesTab extends StatefulWidget {
  final bool isDark;
  const _MistakesTab({required this.isDark});

  @override
  State<_MistakesTab> createState() => _MistakesTabState();
}

class _MistakesTabState extends State<_MistakesTab> {
  List<_HistoryMistake> _mistakes = [];
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      final data = await sb
          .from('exam_results')
          .select('questions, user_answers')
          .eq('user_id', uid)
          .not('questions', 'is', null)
          .not('user_answers', 'is', null);

      final Map<String, Map<String, dynamic>> mistakeMap = {};
      final Map<String, int> freqMap = {};

      for (final row in (data as List)) {
        final questionsRaw = row['questions'];
        final answersRaw = row['user_answers'];
        if (questionsRaw is! List || answersRaw is! Map) continue;

        final answers = Map<String, dynamic>.from(answersRaw);
        final subjectLabel = (row['subject_label'] as String?) ?? '';

        for (final qData in questionsRaw) {
          if (qData is! Map<String, dynamic>) continue;
          final id = qData['id']?.toString() ?? '';
          if (id.isEmpty) continue;

          final correctIdx =
              (qData['correct_answer_index'] as num?)?.toInt() ?? 0;
          final raw = answers[id];
          if (raw == null) continue;
          final userAnswer = (raw as num).toInt();
          if (userAnswer == -1) continue; // skipped
          if (userAnswer != correctIdx) {
            freqMap[id] = (freqMap[id] ?? 0) + 1;
            if (!mistakeMap.containsKey(id)) {
              mistakeMap[id] = {
                ...qData,
                '_user_answer': userAnswer,
                '_subject_label': subjectLabel,
              };
            }
          }
        }
      }

      final sorted = mistakeMap.entries.toList()
        ..sort((a, b) => (freqMap[b.key] ?? 0).compareTo(freqMap[a.key] ?? 0));

      if (mounted) {
        setState(() {
          _mistakes = sorted.map((e) {
            final d = e.value;
            final opts = <String>[];
            if (d['options'] is List) {
              opts.addAll((d['options'] as List).map((o) => o.toString()));
            }
            return _HistoryMistake(
              id: e.key,
              questionText: d['question']?.toString() ?? '',
              options: opts,
              correctAnswerIndex:
                  (d['correct_answer_index'] as num?)?.toInt() ?? 0,
              userAnswerIndex: d['_user_answer'] as int,
              subjectLabel: d['_subject_label']?.toString() ?? '',
              frequency: freqMap[e.key] ?? 1,
            );
          }).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[MistakesTab] _fetch error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading)
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF10B981)),
      );
    if (_hasError) return _errorState(widget.isDark, _fetch);
    if (_mistakes.isEmpty) {
      return _emptyState(
        widget.isDark,
        'কোনো ভুল নেই! 🎉',
        'দারুণ! তোমার পরীক্ষায় কোনো ভুল উত্তর পাওয়া যায়নি।',
      );
    }
    return RefreshIndicator(
      onRefresh: () async => _fetch(),
      color: const Color(0xFF10B981),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _mistakes.length,
        itemBuilder: (ctx, i) =>
            _MistakeCard(m: _mistakes[i], isDark: widget.isDark),
      ),
    );
  }
}

class _MistakeCard extends StatelessWidget {
  final _HistoryMistake m;
  final bool isDark;

  const _MistakeCard({required this.m, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE5E7EB),
        ),
        boxShadow: isDark
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ]
            : [
                BoxShadow(
                  color: const Color(0xFF000000).withValues(alpha: 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Subject badge + frequency
          Row(
            children: [
              if (m.subjectLabel.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF2E2E2E)
                        : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    m.subjectLabel.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'HindSiliguri',
                      color: Color(0xFFA3A3A3),
                    ),
                  ),
                ),
              if (m.frequency > 1) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF450A0A).withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(
                      color: const Color(0xFF7F1D1D).withValues(alpha: 0.5),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        LucideIcons.alertCircle,
                        size: 10,
                        color: Color(0xFFF87171),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${m.frequency}× ভুল',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                          color: Color(0xFFF87171),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          // Question text
          Text(
            m.questionText,
            style: TextStyle(
              fontSize: 18,
              height: 1.4,
              fontWeight: FontWeight.bold,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          if (m.options.isNotEmpty) ...[
            const SizedBox(height: 16),
            // Options
            ...m.options.asMap().entries.map((e) {
              final idx = e.key;
              final opt = e.value;
              final isCorrect = idx == m.correctAnswerIndex;
              final isUserWrong =
                  idx == m.userAnswerIndex && idx != m.correctAnswerIndex;

              Color? bg;
              Color? border;
              Color textColor = isDark
                  ? const Color(0xFFD4D4D4)
                  : const Color(0xFF4B5563);

              if (isCorrect) {
                bg = isDark
                    ? const Color(0xFF064E3B).withValues(alpha: 0.4)
                    : const Color(0xFFECFDF5);
                border = const Color(0xFF10B981).withValues(alpha: 0.5);
                textColor = isDark
                    ? const Color(0xFF34D399)
                    : const Color(0xFF059669);
              } else if (isUserWrong) {
                bg = isDark
                    ? const Color(0xFF7F1D1D).withValues(alpha: 0.4)
                    : const Color(0xFFFEF2F2);
                border = const Color(0xFFEF4444).withValues(alpha: 0.5);
                textColor = isDark
                    ? const Color(0xFFF87171)
                    : const Color(0xFFDC2626);
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color:
                      bg ??
                      (isDark
                          ? const Color(0xFF2E2E2E).withValues(alpha: 0.5)
                          : const Color(0xFFF9FAFB)),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color:
                        border ??
                        (isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFE5E7EB)),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: (isCorrect || isUserWrong)
                            ? (isDark ? bg : bg)
                            : (isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFE5E7EB)),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color:
                              border ??
                              (isDark
                                  ? const Color(0xFF525252)
                                  : const Color(0xFFD1D5DB)),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        ['ক', 'খ', 'গ', 'ঘ'][idx < 4 ? idx : 0],
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        opt,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: isCorrect || isUserWrong
                              ? FontWeight.bold
                              : FontWeight.normal,
                          fontFamily: 'HindSiliguri',
                          color: textColor,
                        ),
                      ),
                    ),
                    if (isCorrect)
                      Icon(
                        LucideIcons.checkCircle2,
                        size: 18,
                        color: isDark
                            ? const Color(0xFF34D399)
                            : const Color(0xFF059669),
                      ),
                    if (isUserWrong)
                      Icon(
                        LucideIcons.xCircle,
                        size: 18,
                        color: isDark
                            ? const Color(0xFFF87171)
                            : const Color(0xFFDC2626),
                      ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}
// ─── Shared Widgets ────────────────────────────────────────────────────────────

Widget _emptyState(bool isDark, String title, String subtitle) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF34D399), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withValues(alpha: 0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              LucideIcons.flaskConical,
              size: 40,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 16,
              fontFamily: 'HindSiliguri',
              color: Color(0xFFA3A3A3),
            ),
          ),
        ],
      ),
    ),
  );
}

Widget _errorState(bool isDark, VoidCallback onRetry) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFF87171), Color(0xFFEF4444)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              LucideIcons.wifiOff,
              size: 40,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'ডেটা লোড হয়নি',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'ইন্টারনেট সংযোগ পরীক্ষা করো এবং আবার চেষ্টা করো।',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontFamily: 'HindSiliguri',
              color: Color(0xFFA3A3A3),
            ),
          ),
          const SizedBox(height: 32),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF059669), Color(0xFF10B981)],
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Text(
                'আবার চেষ্টা করো',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
