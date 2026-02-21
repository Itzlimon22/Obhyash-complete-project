import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';

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
    final total = (j['total_questions'] as num?)?.toInt() ?? 0;
    final correct = (j['correct_count'] as num?)?.toInt() ?? 0;
    final wrong = (j['wrong_count'] as num?)?.toInt() ?? 0;
    final score = total > 0 ? (correct / total * 100) : 0.0;
    return _ExamRecord(
      id: j['id'] ?? '',
      subject: j['subject'] ?? 'general',
      subjectLabel: j['subject_label'] ?? j['subject'] ?? 'পরীক্ষা',
      correctCount: correct,
      wrongCount: wrong,
      totalQuestions: total,
      timeTaken: (j['time_taken'] as num?)?.toInt(),
      score: score,
      createdAt: DateTime.tryParse(j['created_at'] ?? '') ?? DateTime.now(),
      examType: j['exam_type'] ?? 'mock',
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
  return '${m}মি ${s}সে';
}

Color _scoreColor(double s) {
  if (s >= 70) return const Color(0xFF059669);
  if (s >= 40) return const Color(0xFFF59E0B);
  return const Color(0xFFEF4444);
}

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

  String _filterSubject = '';
  DateTime? _filterDate;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this);
    _fetch();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      final data = await sb
          .from('exam_results')
          .select(
            'id, subject, subject_label, correct_count, wrong_count, total_questions, time_taken, created_at, exam_type',
          )
          .eq('user_id', uid)
          .order('created_at', ascending: false)
          .limit(200);

      if (mounted) {
        setState(() {
          _history = (data as List)
              .map((r) => _ExamRecord.fromJson(r as Map<String, dynamic>))
              .toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<_ExamRecord> get _filtered {
    return _history.where((h) {
      if (_filterSubject.isNotEmpty && h.subject != _filterSubject)
        return false;
      if (_filterDate != null) {
        final d = h.createdAt;
        if (d.year != _filterDate!.year ||
            d.month != _filterDate!.month ||
            d.day != _filterDate!.day)
          return false;
      }
      return true;
    }).toList();
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
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('ইতিহাস মুছে ফেলা হয়েছে'),
              backgroundColor: Color(0xFF059669),
            ),
          );
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isClearing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      children: [
        // ── Tab Bar ─────────────────────────────────────────────────────────
        Container(
          margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5),
            ),
          ),
          child: TabBar(
            controller: _tab,
            indicator: BoxDecoration(
              color: isDark ? const Color(0xFF171717) : Colors.white,
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                if (!isDark)
                  const BoxShadow(
                    color: Color(0x15000000),
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
              ],
            ),
            labelColor: const Color(0xFF6366F1), // indigo-500
            unselectedLabelColor: const Color(0xFFA3A3A3),
            labelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
            dividerColor: Colors.transparent,
            tabs: const [
              Tab(
                icon: Icon(LucideIcons.clipboardList, size: 14),
                text: 'পরীক্ষা',
              ),
              Tab(
                icon: Icon(LucideIcons.alertCircle, size: 14),
                text: 'ভুলসমূহ',
              ),
              Tab(icon: Icon(LucideIcons.bookmark, size: 14), text: 'বুকমার্ক'),
            ],
          ),
        ),

        // ── Filters ─────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              // Subject filter
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  height: 40,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF171717) : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFE5E5E5),
                    ),
                  ),
                  child: DropdownButton<String>(
                    value: _filterSubject.isEmpty ? '' : _filterSubject,
                    isExpanded: true,
                    isDense: true,
                    underline: const SizedBox.shrink(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF171717),
                    ),
                    dropdownColor: isDark
                        ? const Color(0xFF262626)
                        : Colors.white,
                    items: [
                      const DropdownMenuItem(
                        value: '',
                        child: Text('সকল বিষয়'),
                      ),
                      ..._uniqueSubjects.map(
                        (s) => DropdownMenuItem(
                          value: s.key,
                          child: Text(s.value),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() => _filterSubject = v ?? ''),
                  ),
                ),
              ),
              const SizedBox(width: 8),
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
                  height: 40,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: _filterDate != null
                        ? const Color(0xFF6366F1).withOpacity(0.1)
                        : (isDark ? const Color(0xFF171717) : Colors.white),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _filterDate != null
                          ? const Color(0xFF6366F1)
                          : (isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFE5E5E5)),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        LucideIcons.calendar,
                        size: 14,
                        color: _filterDate != null
                            ? const Color(0xFF6366F1)
                            : const Color(0xFFA3A3A3),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _filterDate != null
                            ? DateFormat('d/M').format(_filterDate!)
                            : 'তারিখ',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _filterDate != null
                              ? const Color(0xFF6366F1)
                              : const Color(0xFFA3A3A3),
                        ),
                      ),
                      if (_filterDate != null) ...[
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () => setState(() => _filterDate = null),
                          child: const Icon(
                            LucideIcons.x,
                            size: 12,
                            color: Color(0xFF6366F1),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── Content ─────────────────────────────────────────────────────────
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : TabBarView(
                  controller: _tab,
                  children: [
                    _ExamsTab(
                      records: _filtered,
                      isDark: isDark,
                      onClear: _history.isEmpty ? null : _clearHistory,
                      isClearing: _isClearing,
                    ),
                    _MistakesTab(isDark: isDark),
                    _BookmarksTab(isDark: isDark),
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

  const _ExamsTab({
    required this.records,
    required this.isDark,
    this.onClear,
    required this.isClearing,
  });

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return _emptyState(
        isDark,
        'কোনো পরীক্ষার ইতিহাস নেই',
        'একটি মক পরীক্ষা দিন এবং ফলাফল এখানে দেখুন।',
      );
    }

    final avgScore =
        records.map((r) => r.score).reduce((a, b) => a + b) / records.length;
    final highestScore = records
        .map((r) => r.score)
        .reduce((a, b) => a > b ? a : b);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Stats Row
        Row(
          children: [
            // Total exams — indigo
            _StatCard(
              label: 'মোট পরীক্ষা',
              value: '${records.length}',
              isDark: isDark,
              gradient: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
              white: true,
            ),
            const SizedBox(width: 8),
            _StatCard(
              label: 'গড় স্কোর',
              value: '${avgScore.round()}%',
              isDark: isDark,
            ),
            const SizedBox(width: 8),
            _StatCard(
              label: 'সর্বোচ্চ',
              value: '${highestScore.round()}%',
              isDark: isDark,
              valueColor: const Color(0xFF059669),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Clear history
        if (onClear != null)
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: isClearing ? null : onClear,
              icon: isClearing
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(LucideIcons.trash2, size: 14, color: Colors.red),
              label: const Text(
                'ইতিহাস মুছুন',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ),

        const SizedBox(height: 8),

        // Exam cards
        ...records.map((r) => _ExamCard(record: r, isDark: isDark)),
      ],
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
    final dateStr = DateFormat('d MMM yyyy').format(record.createdAt);
    final label = record.subjectLabel.isNotEmpty
        ? record.subjectLabel
        : _subjectDisplay(record.subject);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [const BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: Row(
        children: [
          // Score circle
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: color, width: 2),
            ),
            child: Center(
              child: Text(
                '${record.score.round()}%',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: color,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: isDark ? Colors.white : const Color(0xFF171717),
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    _Chip(label: dateStr, isDark: isDark),
                    _Chip(
                      label:
                          '${record.correctCount}/${record.totalQuestions} সঠিক',
                      isDark: isDark,
                      color: color,
                    ),
                    if (record.wrongCount > 0)
                      _Chip(
                        label: '${record.wrongCount} ভুল',
                        isDark: isDark,
                        color: const Color(0xFFEF4444),
                      ),
                    if (record.timeTaken != null)
                      _Chip(
                        label: _formatDur(record.timeTaken!),
                        isDark: isDark,
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
class _MistakesTab extends StatefulWidget {
  final bool isDark;
  const _MistakesTab({required this.isDark});

  @override
  State<_MistakesTab> createState() => _MistakesTabState();
}

class _MistakesTabState extends State<_MistakesTab> {
  List<Map<String, dynamic>> _mistakes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMistakes();
  }

  Future<void> _fetchMistakes() async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      // Fetch wrong answers from user_answers table if it exists
      final data = await sb
          .from('user_answers')
          .select(
            'question_id, user_answer, correct_answer, question_text, subject, created_at',
          )
          .eq('user_id', uid)
          .not('user_answer', 'is', null)
          .limit(100);

      setState(() {
        _mistakes = (data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_mistakes.isEmpty) {
      return _emptyState(
        widget.isDark,
        'কোনো ভুল নেই! 🎉',
        'পরীক্ষা দিন এবং ভুল উত্তরগুলো এখানে দেখুন।',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _mistakes.length,
      itemBuilder: (ctx, i) {
        final m = _mistakes[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: widget.isDark ? const Color(0xFF171717) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: widget.isDark
                  ? const Color(0xFF262626)
                  : const Color(0xFFE5E5E5),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                m['question_text'] ?? 'প্রশ্ন',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: widget.isDark ? Colors.white : const Color(0xFF171717),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _Chip(
                    label: 'আপনার উত্তর: ${m['user_answer'] ?? '-'}',
                    isDark: widget.isDark,
                    color: const Color(0xFFEF4444),
                  ),
                  const SizedBox(width: 6),
                  _Chip(
                    label: 'সঠিক: ${m['correct_answer'] ?? '-'}',
                    isDark: widget.isDark,
                    color: const Color(0xFF059669),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─── Bookmarks Tab ─────────────────────────────────────────────────────────────
class _BookmarksTab extends StatefulWidget {
  final bool isDark;
  const _BookmarksTab({required this.isDark});

  @override
  State<_BookmarksTab> createState() => _BookmarksTabState();
}

class _BookmarksTabState extends State<_BookmarksTab> {
  List<Map<String, dynamic>> _bookmarks = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBookmarks();
  }

  Future<void> _fetchBookmarks() async {
    try {
      final sb = Supabase.instance.client;
      final uid = sb.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _isLoading = false);
        return;
      }

      final data = await sb
          .from('bookmarks')
          .select(
            'question_id, questions(id, question, options, correct_answer_index, subject)',
          )
          .eq('user_id', uid)
          .order('created_at', ascending: false)
          .limit(100);

      setState(() {
        _bookmarks = (data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_bookmarks.isEmpty) {
      return _emptyState(
        widget.isDark,
        'কোনো বুকমার্ক নেই',
        'পরীক্ষার সময় প্রশ্নে বুকমার্ক করুন এবং পরে এখানে দেখুন।',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _bookmarks.length,
      itemBuilder: (ctx, i) {
        final b = _bookmarks[i];
        final q = b['questions'] as Map<String, dynamic>? ?? {};
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: widget.isDark ? const Color(0xFF171717) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: widget.isDark
                  ? const Color(0xFF262626)
                  : const Color(0xFFE5E5E5),
            ),
          ),
          child: Row(
            children: [
              Icon(
                LucideIcons.bookmark,
                color: const Color(0xFF6366F1),
                size: 18,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  q['question'] ?? 'প্রশ্ন',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: widget.isDark
                        ? Colors.white
                        : const Color(0xFF171717),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─── Shared Widgets ────────────────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label, value;
  final bool isDark;
  final Color? valueColor;
  final List<Color>? gradient;
  final bool white;

  const _StatCard({
    required this.label,
    required this.value,
    required this.isDark,
    this.valueColor,
    this.gradient,
    this.white = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: gradient != null ? LinearGradient(colors: gradient!) : null,
          color: gradient == null
              ? (isDark ? const Color(0xFF171717) : Colors.white)
              : null,
          borderRadius: BorderRadius.circular(14),
          border: gradient == null
              ? Border.all(
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFE5E5E5),
                )
              : null,
          boxShadow: gradient != null
              ? [
                  BoxShadow(
                    color: gradient!.first.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: white
                    ? Colors.white.withOpacity(0.8)
                    : const Color(0xFFA3A3A3),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: white
                    ? Colors.white
                    : (valueColor ??
                          (isDark ? Colors.white : const Color(0xFF171717))),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool isDark;
  final Color? color;

  const _Chip({required this.label, required this.isDark, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color != null
            ? color!.withOpacity(0.1)
            : (isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5)),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color:
              color ??
              (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373)),
        ),
      ),
    );
  }
}

Widget _emptyState(bool isDark, String title, String subtitle) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              LucideIcons.clipboardList,
              size: 36,
              color: Color(0xFFA3A3A3),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF171717),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Color(0xFFA3A3A3)),
          ),
        ],
      ),
    ),
  );
}
