import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../dashboard/providers/dashboard_providers.dart';

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
        correctAnswerIndices: j['correct_answer_indices'] != null
            ? List<int>.from(j['correct_answer_indices'])
            : null,
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
    userId: j['user_id'],
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
        _page = 0;
        _reports = [];
        _hasMore = true;
      });
    }
    try {
      final supabase = Supabase.instance.client;
      final user = ref.read(userProfileProvider).value;
      if (user == null) return;

      final data = await supabase
          .from('user_reports')
          .select('*, question:questions(*)')
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .range(_page * _pageSize, (_page + 1) * _pageSize - 1);

      final newReports = (data as List)
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      children: [
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Page header ───────────────────────────────────
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF3F0F17)
                                  : const Color(0xFFFFF1F2),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isDark
                                    ? const Color(0xFF7F1D2A)
                                    : const Color(0xFFFFE4E6),
                              ),
                            ),
                            child: const Icon(
                              LucideIcons.alertTriangle,
                              size: 18,
                              color: Color(0xFFE11D48),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'আমার রিপোর্টসমূহ',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                ),
                              ),
                              Text(
                                'আপনার দাখিলকৃত প্রশ্নের রিপোর্ট ও অ্যাডমিন ফিডব্যাক',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFFA3A3A3),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // ── Empty state ──────────────────────────────────
                      if (_reports.isEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            vertical: 48,
                            horizontal: 24,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF171717)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFE5E5E5),
                            ),
                          ),
                          child: Column(
                            children: [
                              Container(
                                width: 72,
                                height: 72,
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF262626)
                                      : const Color(0xFFF5F5F5),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  LucideIcons.alertTriangle,
                                  size: 32,
                                  color: Color(0xFFA3A3A3),
                                ),
                              ),
                              const SizedBox(height: 20),
                              Text(
                                'কোনো রিপোর্ট পাওয়া যায়নি',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'আপনি এখন পর্যন্ত কোনো প্রশ্ন রিপোর্ট করেননি।',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFFA3A3A3),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      else ...[
                        // ── Report list ──────────────────────────────────
                        ...List.generate(_reports.length, (i) {
                          final report = _reports[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _ReportCard(
                              report: report,
                              isDark: isDark,
                              isExpanded: _expandedId == report.id,
                              onToggle: () => setState(() {
                                _expandedId = _expandedId == report.id
                                    ? null
                                    : report.id;
                              }),
                            ),
                          );
                        }),

                        // ── Load more ─────────────────────────────────────
                        if (_hasMore)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: OutlinedButton(
                              onPressed: _isLoadingMore
                                  ? null
                                  : () => _fetchReports(loadMore: true),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 12,
                                ),
                                backgroundColor: isDark
                                    ? const Color(0xFF171717)
                                    : Colors.white,
                                foregroundColor: isDark
                                    ? const Color(0xFFA3A3A3)
                                    : const Color(0xFF525252),
                                side: BorderSide(
                                  color: isDark
                                      ? const Color(0xFF262626)
                                      : const Color(0xFFE5E5E5),
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
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                          ),
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                          'লোড হচ্ছে...',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    )
                                  : const Text(
                                      'আরো দেখুন',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

// ─── Report Card ─────────────────────────────────────────────────────────────────
class _ReportCard extends StatelessWidget {
  final AppReport report;
  final bool isDark, isExpanded;
  final VoidCallback onToggle;

  const _ReportCard({
    required this.report,
    required this.isDark,
    required this.isExpanded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('d MMMM yyyy').format(report.createdAt);
    final subjKey = report.question?.subject ?? '';

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
              ],
      ),
      clipBehavior: Clip.antiAlias,
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
                  // Red icon box
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF3F0F17)
                          : const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF7F1D2A)
                            : const Color(0xFFFFE4E6),
                      ),
                    ),
                    child: const Icon(
                      LucideIcons.alertTriangle,
                      size: 18,
                      color: Color(0xFFE11D48),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Subject + status badge
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                subjKey.isNotEmpty
                                    ? _subjectName(subjKey)
                                    : 'Unknown Subject',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w900,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            _StatusBadge(status: report.status, isDark: isDark),
                          ],
                        ),
                        const SizedBox(height: 6),

                        // Date chip
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFF5F5F5),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                LucideIcons.clock,
                                size: 10,
                                color: Color(0xFFA3A3A3),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                dateStr,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFA3A3A3),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Reason
                        RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: 'রিপোর্টের কারণ: ',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isDark
                                      ? const Color(0xFF737373)
                                      : const Color(0xFFA3A3A3),
                                ),
                              ),
                              TextSpan(
                                text: report.reason,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: isDark
                                      ? const Color(0xFFD4D4D4)
                                      : const Color(0xFF404040),
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
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF262626)
                            : const Color(0xFFF5F5F5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        LucideIcons.chevronDown,
                        size: 16,
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF737373),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Expanded Details ──────────────────────────────────────
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeInOut,
            child: isExpanded
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Divider(
                        height: 1,
                        color: isDark
                            ? const Color(0xFF262626)
                            : const Color(0xFFF0F0F0),
                      ),
                      Container(
                        color: isDark
                            ? const Color(0x26262626)
                            : const Color(0xFFFAFAFA),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // View question button
                            if (report.question != null)
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () =>
                                      _showQuestion(context, report, isDark),
                                  icon: const Icon(LucideIcons.eye, size: 15),
                                  label: const Text(
                                    'সম্পূর্ণ প্রশ্ন দেখো',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    backgroundColor: isDark
                                        ? const Color(0xFF262626)
                                        : Colors.white,
                                    foregroundColor: isDark
                                        ? const Color(0xFFD4D4D4)
                                        : const Color(0xFF404040),
                                    side: BorderSide(
                                      color: isDark
                                          ? const Color(0xFF404040)
                                          : const Color(0xFFE5E5E5),
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 10,
                                    ),
                                  ),
                                ),
                              ),
                            const SizedBox(height: 12),

                            // User comment
                            _AccentPanel(
                              label: 'আপনার মন্তব্য',
                              accentColor: const Color(0xFFE11D48),
                              bgColor: isDark
                                  ? const Color(0xFF1A0508)
                                  : const Color(0xFFFFF1F2),
                              borderColor: isDark
                                  ? const Color(0xFF3F0F17)
                                  : const Color(0xFFFFE4E6),
                              labelColor: const Color(0xFFE11D48),
                              isDark: isDark,
                              child: Text(
                                '"${report.description ?? 'কোনো বিবরণ নেই'}"',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontStyle: FontStyle.italic,
                                  color: isDark
                                      ? const Color(0xFFD4D4D4)
                                      : const Color(0xFF525252),
                                  height: 1.5,
                                ),
                              ),
                            ),

                            // Reference image
                            if (report.imageUrl != null) ...[
                              const SizedBox(height: 12),
                              const Text(
                                'রেফারেন্স ছবি',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFFA3A3A3),
                                  letterSpacing: 1.2,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Container(
                                height: 140,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark
                                        ? const Color(0xFF404040)
                                        : const Color(0xFFE5E5E5),
                                    width: 1.5,
                                    style: BorderStyle.none,
                                  ),
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: CachedNetworkImage(
                                  imageUrl: report.imageUrl!,
                                  fit: BoxFit.cover,
                                  placeholder: (_, _) => const Center(
                                    child: CircularProgressIndicator(),
                                  ),
                                  errorWidget: (_, _, _) =>
                                      const Center(child: Icon(Icons.error)),
                                ),
                              ),
                            ],

                            const SizedBox(height: 12),

                            // Admin feedback / pending
                            if (report.adminComment != null &&
                                report.adminComment!.isNotEmpty)
                              _AccentPanel(
                                label: 'অ্যাডমিন ফিডব্যাক',
                                accentColor: const Color(0xFF059669),
                                bgColor: isDark
                                    ? const Color(0xFF052E16)
                                    : const Color(0xFFECFDF5),
                                borderColor: isDark
                                    ? const Color(0xFF064E3B)
                                    : const Color(0xFFD1FAE5),
                                labelColor: const Color(0xFF059669),
                                labelIcon: LucideIcons.checkCircle2,
                                isDark: isDark,
                                child: Text(
                                  report.adminComment!,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark
                                        ? const Color(0xFF6EE7B7)
                                        : const Color(0xFF065F46),
                                    height: 1.5,
                                  ),
                                ),
                              )
                            else
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0x80262626)
                                      : const Color(0xFFF5F5F5),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark
                                        ? const Color(0xFF404040)
                                        : const Color(0xFFE5E5E5),
                                    style: BorderStyle.none,
                                  ),
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      LucideIcons.clock,
                                      size: 14,
                                      color: Color(0xFFA3A3A3),
                                    ),
                                    SizedBox(width: 8),
                                    Text(
                                      'অ্যাডমিন এখনো কোনো ফিডব্যাক দেয়নি',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF737373),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  void _showQuestion(BuildContext ctx, AppReport report, bool isDark) {
    if (report.question == null) return;
    final q = report.question!;
    showDialog(
      context: ctx,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: isDark ? const Color(0xFF171717) : Colors.white,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Dialog header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF3F0F17)
                            : const Color(0xFFFFF1F2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        LucideIcons.eye,
                        size: 18,
                        color: Color(0xFFE11D48),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'প্রশ্ন বিস্তারিত',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF171717),
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x),
                      onPressed: () => Navigator.pop(ctx),
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Question text
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF1A1A1A)
                        : const Color(0xFFFAFAFA),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF0F0F0),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        q.question,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          height: 1.5,
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF171717),
                        ),
                      ),
                      const SizedBox(height: 14),
                      ...List.generate(q.options.length, (idx) {
                        const alpha = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
                        final isCorrect =
                            q.correctAnswerIndices?.contains(idx) ?? false;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isCorrect
                                ? (isDark
                                      ? const Color(0xFF052E16)
                                      : const Color(0xFFECFDF5))
                                : (isDark
                                      ? const Color(0xFF171717)
                                      : Colors.white),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isCorrect
                                  ? (isDark
                                        ? const Color(0xFF064E3B)
                                        : const Color(0xFFA7F3D0))
                                  : (isDark
                                        ? const Color(0xFF262626)
                                        : const Color(0xFFF0F0F0)),
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${idx < alpha.length ? alpha[idx] : idx}. ',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: isCorrect
                                      ? (isDark
                                            ? const Color(0xFF34D399)
                                            : const Color(0xFF065F46))
                                      : (isDark
                                            ? const Color(0xFFA3A3A3)
                                            : const Color(0xFF525252)),
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  q.options[idx],
                                  style: TextStyle(
                                    color: isCorrect
                                        ? (isDark
                                              ? const Color(0xFF34D399)
                                              : const Color(0xFF065F46))
                                        : (isDark
                                              ? const Color(0xFFA3A3A3)
                                              : const Color(0xFF525252)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),

                // Explanation
                if (q.explanation != null && q.explanation!.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF052E16)
                          : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF064E3B)
                            : const Color(0xFFD1FAE5),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ব্যাখ্যা',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF059669),
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          q.explanation!,
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark
                                ? const Color(0xFF6EE7B7)
                                : const Color(0xFF065F46),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────────
class _StatusBadge extends StatelessWidget {
  final String status;
  final bool isDark;

  const _StatusBadge({required this.status, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final (
      IconData icon,
      Color color,
      Color bg,
      Color border,
      String label,
    ) = switch (status) {
      'Resolved' => (
        LucideIcons.checkCircle2,
        const Color(0xFF059669),
        const Color(0xFFECFDF5),
        const Color(0xFFD1FAE5),
        'গৃহীত',
      ),
      'Ignored' => (
        LucideIcons.xCircle,
        const Color(0xFFE11D48),
        const Color(0xFFFFF1F2),
        const Color(0xFFFFE4E6),
        'বাতিল',
      ),
      _ => (
        LucideIcons.clock,
        const Color(0xFFE11D48),
        const Color(0xFFFFF1F2),
        const Color(0xFFFFE4E6),
        'অপেক্ষমান',
      ),
    };

    final effectiveBg = isDark ? color.withValues(alpha: 0.1) : bg;
    final effectiveBorder = isDark ? color.withValues(alpha: 0.3) : border;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: effectiveBg,
        border: Border.all(color: effectiveBorder),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isDark ? color : color,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Accent Panel ─────────────────────────────────────────────────────────────────
class _AccentPanel extends StatelessWidget {
  final String label;
  final Color accentColor, bgColor, borderColor, labelColor;
  final IconData? labelIcon;
  final bool isDark;
  final Widget child;

  const _AccentPanel({
    required this.label,
    required this.accentColor,
    required this.bgColor,
    required this.borderColor,
    required this.labelColor,
    required this.isDark,
    required this.child,
    this.labelIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: accentColor),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (labelIcon != null) ...[
                          Icon(labelIcon, size: 10, color: labelColor),
                          const SizedBox(width: 5),
                        ],
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: labelColor,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    child,
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
