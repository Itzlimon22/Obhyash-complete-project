
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/presentation/widgets/question_card.dart';
import '../../../core/presentation/widgets/skeleton_loading.dart';

// ─── Models ──────────────────────────────────────────────────────────────────────
class ReportQuestionData {
  final String subject;
  final String question;
  final List<String> options;
  final List<int>? correctAnswerIndices;
  final String? explanation;

  const ReportQuestionData({
    required this.subject,
    required this.question,
    required this.options,
    this.correctAnswerIndices,
    this.explanation,
  });

  factory ReportQuestionData.fromJson(Map<String, dynamic> j) =>
      ReportQuestionData(
        subject: j['subject'] as String? ?? '',
        question: j['question'] as String? ?? '',
        options: List<String>.from(j['options'] ?? []),
        correctAnswerIndices: j['correct_answer_index'] != null
            ? [(j['correct_answer_index'] as num).toInt()]
            : (j['correct_answer_indices'] != null
                  ? List<int>.from(j['correct_answer_indices'])
                  : null),
        explanation: j['explanation'] as String?,
      );
}

class AppReport {
  final String id, userId, status, reason;
  final String? description, imageUrl, adminComment;
  final DateTime createdAt;
  final ReportQuestionData? question;

  const AppReport({
    required this.id,
    required this.userId,
    required this.status,
    required this.reason,
    this.description,
    this.imageUrl,
    this.adminComment,
    required this.createdAt,
    this.question,
  });

  factory AppReport.fromJson(Map<String, dynamic> j) => AppReport(
    id: j['id'],
    userId: j['reporter_id'] as String? ?? j['user_id'] as String? ?? '',
    status: j['status'],
    reason: j['reason'],
    description: j['description'],
    imageUrl: j['image_url'],
    adminComment: j['admin_comment'],
    createdAt: DateTime.parse(j['created_at']),
    question: j['question'] != null
        ? ReportQuestionData.fromJson(j['question'] as Map<String, dynamic>)
        : null,
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────
String _subjectName(String key) {
  const m = {
    'physics': 'পদার্থবিজ্ঞান',
    'chemistry': 'রসায়ন',
    'biology': 'জীববিজ্ঞান',
    'math': 'গণিত',
    'bangla': 'বাংলা',
    'english': 'ইংরেজি',
    'ict': 'আইসিটি',
    'general_knowledge': 'সাধারণ জ্ঞান',
    'gk': 'সাধারণ জ্ঞান',
    'general': 'সাধারণ',
  };
  return m[key.toLowerCase()] ?? key;
}

// ─── View ────────────────────────────────────────────────────────────────────────
class StudentReportView extends ConsumerStatefulWidget {
  const StudentReportView({super.key});

  @override
  ConsumerState<StudentReportView> createState() => _StudentReportViewState();
}

class _StudentReportViewState extends ConsumerState<StudentReportView> {
  List<AppReport> _reports = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  int _page = 0;
  final int _pageSize = 10;
  String? _expandedId;
  bool _hasError = false;
  String _statusFilter = '';

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports({bool loadMore = false}) async {
    if (loadMore) {
      setState(() => _isLoadingMore = true);
    } else {
      setState(() {
        _isLoading = true;
        _hasError = false;
        _page = 0;
        _reports = [];
        _hasMore = true;
      });
    }
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) return;

      final data = await supabase
          .from('reports')
          .select('*')
          .eq('reporter_id', userId)
          .order('created_at', ascending: false)
          .range(_page * _pageSize, (_page + 1) * _pageSize - 1);

      final rawList = data as List;

      // Fetch associated question data (same approach as web getUserReports)
      final questionIds = rawList
          .map((e) => (e as Map<String, dynamic>)['question_id'])
          .where((id) => id != null)
          .toSet()
          .toList();

      Map<String, Map<String, dynamic>> questionMap = {};
      if (questionIds.isNotEmpty) {
        final qData = await supabase
            .from('questions')
            .select(
              'id, question, options, correct_answer_indices, explanation, subject',
            )
            .inFilter('id', questionIds);
        for (final q in qData as List) {
          questionMap[(q as Map<String, dynamic>)['id'].toString()] = q;
        }
      }

      // Enrich each report row with its question data before parsing
      final enrichedList = rawList.map((e) {
        final row = Map<String, dynamic>.from(e as Map<String, dynamic>);
        final qId = row['question_id']?.toString();
        if (qId != null && questionMap.containsKey(qId)) {
          row['question'] = questionMap[qId];
        }
        return row;
      }).toList();

      final newReports = enrichedList
          .map((e) => AppReport.fromJson(e))
          .toList();

      if (mounted) {
        setState(() {
          if (loadMore) {
            _reports.addAll(newReports);
          } else {
            _reports = newReports;
          }
          _hasMore = newReports.length == _pageSize;
          if (_hasMore) _page++;
        });
      }
    } catch (e) {
      debugPrint('[StudentReportView] fetch error: $e');
      if (mounted) setState(() => _hasError = true);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    }
  }

  List<AppReport> get _filteredReports {
    if (_statusFilter.isEmpty) return _reports;
    if (_statusFilter == 'pending') {
      return _reports
          .where((r) => r.status != 'Resolved' && r.status != 'Ignored')
          .toList();
    }
    return _reports.where((r) => r.status == _statusFilter).toList();
  }

  Widget _errorState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF3F0F17)
                    : const Color(0xFFFFF1F2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.alertCircle,
                size: 36,
                color: Color(0xFFB91C1C),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'ডেটা লোড করতে সমস্যা হয়েছে',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF000000),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'ইন্টারনেট সংযোগ পরীক্ষা করো এবং আবার চেষ্টা করো।',
              style: TextStyle(fontSize: 16, color: Color(0xFFA3A3A3)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchReports,
              icon: const Icon(LucideIcons.refreshCw, size: 16),
              label: const Text(
                'আবার চেষ্টা করো',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB91C1C),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
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
              ? const ExamHistorySkeleton()
              : _hasError
              ? _errorState(isDark)
              : RefreshIndicator(
                  onRefresh: () => _fetchReports(),
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      // ── Top 3 Compact Centered Stat Boxes ───────────────────
                      if (_reports.isNotEmpty)
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                          sliver: SliverToBoxAdapter(
                            child: Row(
                              children: [
                                Expanded(
                                  child: _StatBox(
                                    label: 'অপেক্ষমান',
                                    value: pendingCount.toString(),
                                    icon: LucideIcons.clock,
                                    color: const Color(0xFF3B82F6),
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _StatBox(
                                    label: 'গৃহীত',
                                    value: resolvedCount.toString(),
                                    icon: LucideIcons.checkCircle2,
                                    color: const Color(0xFF10B981),
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _StatBox(
                                    label: 'বাতিল',
                                    value: ignoredCount.toString(),
                                    icon: LucideIcons.xCircle,
                                    color: const Color(0xFFEF4444),
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // ── Sticky Status Filter Pills ──────────────────────
                      if (_reports.isNotEmpty)
                        SliverPersistentHeader(
                          pinned: true,
                          delegate: _StickyFilterDelegate(
                            isDark: isDark,
                            height: 56.0,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF000000) : const Color(0xFFF4F4F5),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: isDark ? Colors.black54 : const Color(0x0A000000),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
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
                          ),
                        ),

                      // ── Report List Content ──────────────────────────────
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                        sliver: _filteredReports.isEmpty
                            ? SliverToBoxAdapter(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 60,
                                    horizontal: 24,
                                  ),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: isDark
                                          ? [const Color(0xFF000000), const Color(0xFF171717)]
                                          : [Colors.white, const Color(0xFFF9FAFB)],
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                    ),
                                    borderRadius: BorderRadius.circular(24),
                                    border: Border.all(
                                      color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
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
                                          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF3F4F6),
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
                                          color: isDark ? Colors.white : const Color(0xFF000000),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _reports.isEmpty
                                            ? 'তুমি এখন পর্যন্ত কোনো প্রশ্ন রিপোর্ট করোনি।\nপ্রশ্নে কোনো ভুল পেলে রিপোর্ট করতে পারো।'
                                            : 'এই ফিল্টারে কোনো রিপোর্ট পাওয়া যায়নি।',
                                        style: const TextStyle(
                                          fontSize: 16,
                                          color: Color(0xFFA3A3A3),
                                          height: 1.5,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  ),
                                ),
                              )
                            : SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, i) {
                                    if (i < _filteredReports.length) {
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
                                    }

                                    // Load more button at the end
                                    if (_hasMore && _statusFilter.isEmpty) {
                                      return Padding(
                                        padding: const EdgeInsets.only(top: 8),
                                        child: OutlinedButton(
                                          onPressed: _isLoadingMore ? null : () => _fetchReports(loadMore: true),
                                          style: OutlinedButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 24,
                                              vertical: 16,
                                            ),
                                            backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
                                            foregroundColor: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF525252),
                                            side: BorderSide(
                                              color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
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
                                      );
                                    }
                                    return null;
                                  },
                                  childCount: _filteredReports.length + ((_hasMore && _statusFilter.isEmpty) ? 1 : 0),
                                ),
                              ),
                      ),
                    ],
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

    final correctIndex = (q.correctAnswerIndices != null && q.correctAnswerIndices!.isNotEmpty)
        ? q.correctAnswerIndices!.first
        : 0;

    final questionObj = Question(
      id: report.id,
      subject: q.subject,
      chapter: '',
      question: q.question,
      options: q.options,
      correctAnswerIndex: correctIndex,
      explanation: q.explanation,
      points: 1,
    );

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.52,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF13151F) : const Color(0xFFF8FAFC),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 16,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top drag pill
                Container(
                  margin: const EdgeInsets.only(top: 8, bottom: 2),
                  width: 36,
                  height: 3.5,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.black12,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 2, 8, 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              LucideIcons.helpCircle,
                              size: 15,
                              color: isDark ? const Color(0xFF34D399) : const Color(0xFF059669),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'সম্পূর্ণ প্রশ্ন',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.x, size: 18),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                Divider(
                  height: 1,
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                ),
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
                    child: QuestionCard(
                      question: questionObj,
                      serialNumber: 1,
                      selectedOptionIndex: correctIndex,
                      showAnswer: true,
                      showFeedback: true,
                      initiallyExpanded: false,
                      readOnly: true,
                      isFlagged: false,
                      onSelectOption: (_) {},
                      onToggleFlag: () {},
                      onReport: () {},
                    ),
                  ),
                ),
              ],
            ),
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : const Color(0x06000000),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              fontFamily: 'Anek Bangla',
              color: isDark ? Colors.white : const Color(0xFF18181B),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              fontFamily: 'Anek Bangla',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
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
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? const Color(0xFF27272A) : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected && !isDark
                ? [
                    const BoxShadow(
                      color: Color(0x0F000000),
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    ),
                  ]
                : [],
          ),
          child: Center(
            child: Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'Anek Bangla',
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                color: isSelected
                    ? (isDark ? Colors.white : const Color(0xFF18181B))
                    : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Sticky Filter Delegate ───────────────────────────────────────────────────────
class _StickyFilterDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  final double height;
  final bool isDark;

  _StickyFilterDelegate({
    required this.child,
    this.height = 60.0,
    required this.isDark,
  });

  @override
  double get minExtent => height;
  @override
  double get maxExtent => height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAF9),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      alignment: Alignment.center,
      child: child,
    );
  }

  @override
  bool shouldRebuild(_StickyFilterDelegate oldDelegate) {
    return true;
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
      'Resolved' => (const Color(0xFF064E3B), 'গৃহীত', LucideIcons.checkCircle2),
      'Ignored' => (const Color(0xFF1C1C1E), 'বাতিল', LucideIcons.xCircle),
      _ => (const Color(0xFF1E3A8A), 'অপেক্ষমান', LucideIcons.clock),
    };

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
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
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4.0),
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
                                          color: isDark ? Colors.white : const Color(0xFF000000),
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
                                          fontSize: 16,
                                          color: isDark ? const Color(0xFF737373) : const Color(0xFFA3A3A3),
                                        ),
                                      ),
                                      TextSpan(
                                        text: report.reason,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
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
                                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
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
                                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF0F0F0),
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
                                          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF0F9FF),
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(
                                            color: isDark ? const Color(0xFF334155) : const Color(0xFFBAE6FD),
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: isDark ? Colors.black26 : const Color(0x0A000000),
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
                                                  Icon(LucideIcons.fileSearch, size: 20, color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7)),
                                                  const SizedBox(width: 10),
                                                  Text(
                                                    'সম্পূর্ণ প্রশ্ন ও অপশন দেখো',
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 16,
                                                      color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7),
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
                                      message: (report.description == null || report.description!.trim().isEmpty) 
                                          ? 'কোনো বিবরণ নেই' 
                                          : report.description!,
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
                                              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5),
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
                                    if (report.adminComment != null && report.adminComment!.trim().isNotEmpty) ...[
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
          // Status Indicator Bar
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Container(width: 4, color: statusColor),
          ),
        ],
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
                  ? (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9))
                  : isSystem
                      ? (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5))
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
                        ? (isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5))
                        : (isDark ? const Color(0xFF065F46) : const Color(0xFFD1FAE5)),
              ),
            ),
            child: Text(
              message,
              style: TextStyle(
                fontSize: 16,
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
