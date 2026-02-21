import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../dashboard/providers/dashboard_providers.dart';

// --- Domain Models ---
class ReportQuestionData {
  final String subject;
  final String question;
  final List<String> options;
  final List<int>? correctAnswerIndices;
  final String? explanation;

  ReportQuestionData({
    required this.subject,
    required this.question,
    required this.options,
    this.correctAnswerIndices,
    this.explanation,
  });

  factory ReportQuestionData.fromJson(Map<String, dynamic> json) {
    return ReportQuestionData(
      subject: json['subject'] as String? ?? 'Unknown Subject',
      question: json['question'] as String? ?? 'No question text',
      options: List<String>.from(json['options'] ?? []),
      correctAnswerIndices: json['correct_answer_indices'] != null
          ? List<int>.from(json['correct_answer_indices'])
          : null,
      explanation: json['explanation'] as String?,
    );
  }
}

class AppReport {
  final String id;
  final String userId;
  final String status;
  final String reason;
  final String? description;
  final String? imageUrl;
  final String? adminComment;
  final DateTime createdAt;
  final ReportQuestionData? question;

  AppReport({
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

  factory AppReport.fromJson(Map<String, dynamic> json) {
    return AppReport(
      id: json['id'],
      userId: json['user_id'],
      status: json['status'],
      reason: json['reason'],
      description: json['description'],
      imageUrl: json['image_url'],
      adminComment: json['admin_comment'],
      createdAt: DateTime.parse(json['created_at']),
      question: json['question'] != null
          ? ReportQuestionData.fromJson(
              json['question'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}

// --- View ---
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
  String? _expandedReportId;

  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports({bool loadMore = false}) async {
    if (loadMore) {
      setState(() => _isLoadingMore = true);
    } else {
      setState(() => _isLoading = true);
      _page = 0;
      _reports.clear();
      _hasMore = true;
    }

    try {
      final user = ref.read(userProfileProvider).value;
      if (user == null) return;

      final response = await supabase
          .from('user_reports')
          .select('*, question:questions(*)')
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .range(_page * _pageSize, ((_page + 1) * _pageSize) - 1);

      final newReports = (response as List)
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
      debugPrint('Failed to fetch reports: $e');
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

  Widget _buildStatusBadge(String status, bool isDark) {
    if (status == 'Pending') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0x1A78350F)
              : const Color(0xFFFFFBEB), // amber-50
          border: Border.all(
            color: isDark ? const Color(0x4D78350F) : const Color(0xFFFEF3C7),
          ), // amber-100
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              LucideIcons.clock,
              size: 12,
              color: Color(0xFFD97706),
            ), // amber-600
            const SizedBox(width: 6),
            const Text(
              'অপেক্ষমান',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFFD97706),
              ),
            ),
          ],
        ),
      );
    } else if (status == 'Resolved') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0x1A064E3B)
              : const Color(0xFFECFDF5), // emerald-50
          border: Border.all(
            color: isDark ? const Color(0x4D064E3B) : const Color(0xFFD1FAE5),
          ), // emerald-100
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              LucideIcons.checkCircle2,
              size: 12,
              color: Color(0xFF059669),
            ), // emerald-600
            const SizedBox(width: 6),
            const Text(
              'গৃহীত',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF059669),
              ),
            ),
          ],
        ),
      );
    } else if (status == 'Ignored') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0x1A881337)
              : const Color(0xFFFFF1F2), // rose-50
          border: Border.all(
            color: isDark ? const Color(0x4D881337) : const Color(0xFFFFE4E6),
          ), // rose-100
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              LucideIcons.xCircle,
              size: 12,
              color: Color(0xFFE11D48),
            ), // rose-600
            const SizedBox(width: 6),
            const Text(
              'বাতিল',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFFE11D48),
              ),
            ),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }

  void _showQuestionDetails(AppReport report, bool isDark) {
    if (report.question == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('প্রশ্ন পাওয়া যায়নি')));
      return;
    }

    showDialog(
      context: context,
      builder: (context) {
        final q = report.question!;
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          backgroundColor: isDark ? const Color(0xFF171717) : Colors.white,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 800),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      const Icon(
                        LucideIcons.eye,
                        color: Color(0xFFF43F5E),
                      ), // rose-500
                      const SizedBox(width: 8),
                      Text(
                        'প্রশ্ন বিস্তারিত',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF171717),
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(LucideIcons.x),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0x80262626)
                          : const Color(0xFFFAFAFA),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF262626)
                            : const Color(0xFFF5F5F5),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          q.question,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF171717),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ...List.generate(q.options.length, (idx) {
                          final alphabet = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
                          final isCorrect =
                              q.correctAnswerIndices?.contains(idx) ?? false;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isCorrect
                                  ? (isDark
                                        ? const Color(0x33064E3B)
                                        : const Color(0xFFECFDF5))
                                  : (isDark
                                        ? const Color(0xFF171717)
                                        : Colors.white),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isCorrect
                                    ? (isDark
                                          ? const Color(0xFF064E3B)
                                          : const Color(
                                              0xFFA7F3D0,
                                            )) // emerald-900 : emerald-200
                                    : (isDark
                                          ? const Color(0xFF262626)
                                          : const Color(0xFFF5F5F5)),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${alphabet[idx]}. ',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isCorrect
                                        ? (isDark
                                              ? const Color(0xFF34D399)
                                              : const Color(
                                                  0xFF065F46,
                                                )) // emerald-400 : emerald-800
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

                  if (q.explanation != null && q.explanation!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0x1A1E3A8A)
                            : const Color(0xFFEFF6FF), // blue-900/10 : blue-50
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? const Color(0x4D1E3A8A)
                              : const Color(0xFFDBEAFE),
                        ), // blue-900/30 : blue-100
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ব্যাখ্যা',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF2563EB), // blue-600
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            q.explanation!,
                            style: TextStyle(
                              fontSize: 14,
                              color: isDark
                                  ? const Color(0xFFBFDBFE)
                                  : const Color(
                                      0xFF1E40AF,
                                    ), // blue-200 : blue-800
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
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: const Text(
          'আমার রিপোর্টসমূহ',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFF43F5E)),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_reports.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(48),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF171717) : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF262626)
                              : const Color(0xFFF5F5F5),
                        ),
                      ),
                      child: Column(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFF5F5F5),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              LucideIcons.alertTriangle,
                              size: 36,
                              color: Color(0xFFA3A3A3),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'কোনো রিপোর্ট পাওয়া যায়নি',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF171717),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'আপনি এখন পর্যন্ত কোনো প্রশ্ন রিপোর্ট করেননি।',
                            style: TextStyle(color: Color(0xFFA3A3A3)),
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _reports.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final report = _reports[index];
                        final isExpanded = _expandedReportId == report.id;

                        return Container(
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF171717)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFF5F5F5),
                            ),
                            boxShadow: [
                              if (!isDark)
                                const BoxShadow(
                                  color: Color(0x33000000),
                                  blurRadius: 4,
                                  offset: Offset(0, 1),
                                ),
                            ],
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Column(
                            children: [
                              // Header segment
                              InkWell(
                                onTap: () {
                                  setState(() {
                                    _expandedReportId = isExpanded
                                        ? null
                                        : report.id;
                                  });
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? const Color(0xFF262626)
                                              : const Color(0xFFFAFAFA),
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: isDark
                                                ? const Color(0xFF404040)
                                                : const Color(0xFFF5F5F5),
                                          ),
                                        ),
                                        child: const Icon(
                                          LucideIcons.alertTriangle,
                                          color: Color(0xFF737373),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    report.question?.subject ??
                                                        'Unknown Subject',
                                                    style: TextStyle(
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: isDark
                                                          ? Colors.white
                                                          : const Color(
                                                              0xFF171717,
                                                            ),
                                                    ),
                                                  ),
                                                ),
                                                _buildStatusBadge(
                                                  report.status,
                                                  isDark,
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                Container(
                                                  width: 4,
                                                  height: 4,
                                                  decoration:
                                                      const BoxDecoration(
                                                        color: Color(
                                                          0xFFD4D4D4,
                                                        ),
                                                        shape: BoxShape.circle,
                                                      ),
                                                ),
                                                const SizedBox(width: 6),
                                                Text(
                                                  DateFormat(
                                                    'dd MMMM yyyy',
                                                  ).format(report.createdAt),
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFFA3A3A3),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              'রিপোর্টের কারণ: ${report.reason}',
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                color: isDark
                                                    ? const Color(0xFFD4D4D4)
                                                    : const Color(0xFF525252),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Column(
                                        children: [
                                          OutlinedButton.icon(
                                            onPressed: () =>
                                                _showQuestionDetails(
                                                  report,
                                                  isDark,
                                                ),
                                            icon: const Icon(
                                              LucideIcons.eye,
                                              size: 14,
                                            ),
                                            label: const Text(
                                              'প্রশ্ন দেখুন',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            style: OutlinedButton.styleFrom(
                                              backgroundColor: isDark
                                                  ? const Color(0xFF262626)
                                                  : const Color(0xFFFAFAFA),
                                              foregroundColor: isDark
                                                  ? const Color(0xFFD4D4D4)
                                                  : const Color(0xFF525252),
                                              side: BorderSide(
                                                color: isDark
                                                    ? const Color(0xFF404040)
                                                    : const Color(0xFFE5E5E5),
                                              ),
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                              ),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 16,
                                                  ),
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Container(
                                            padding: const EdgeInsets.all(8),
                                            decoration: BoxDecoration(
                                              color: isDark
                                                  ? const Color(0xFF262626)
                                                  : const Color(0xFFFAFAFA),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            child: Icon(
                                              isExpanded
                                                  ? LucideIcons.chevronUp
                                                  : LucideIcons.chevronDown,
                                              size: 20,
                                              color: const Color(0xFFA3A3A3),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              // Expanded Details
                              if (isExpanded)
                                Container(
                                  color: isDark
                                      ? const Color(0x33262626)
                                      : const Color(0x33FAFAFA),
                                  padding: const EdgeInsets.fromLTRB(
                                    20,
                                    8,
                                    20,
                                    20,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      const Divider(),
                                      const SizedBox(height: 16),

                                      // User Comment
                                      Container(
                                        padding: const EdgeInsets.all(16),
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? const Color(0xFF171717)
                                              : Colors.white,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: isDark
                                                ? const Color(0xFF262626)
                                                : const Color(0xFFF5F5F5),
                                          ),
                                        ),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'আপনার মন্তব্য',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w900,
                                                color: Color(0xFFF43F5E),
                                                letterSpacing: 1.5,
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            Text(
                                              '"${report.description ?? 'কোনো বিবরণ নেই'}"',
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontStyle: FontStyle.italic,
                                                color: isDark
                                                    ? const Color(0xFFD4D4D4)
                                                    : const Color(0xFF525252),
                                                height: 1.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      const SizedBox(height: 16),

                                      // Image (if any)
                                      if (report.imageUrl != null) ...[
                                        const Text(
                                          'রেফারেন্স ছবি',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFFA3A3A3),
                                            letterSpacing: 1.5,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Container(
                                          height: 150,
                                          decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                            border: Border.all(
                                              color: isDark
                                                  ? const Color(0xFF404040)
                                                  : const Color(0xFFE5E5E5),
                                              width: 2,
                                            ),
                                          ),
                                          clipBehavior: Clip.antiAlias,
                                          child: CachedNetworkImage(
                                            imageUrl: report.imageUrl!,
                                            fit: BoxFit.cover,
                                            placeholder: (context, url) =>
                                                const Center(
                                                  child:
                                                      CircularProgressIndicator(),
                                                ),
                                            errorWidget:
                                                (context, url, error) =>
                                                    const Center(
                                                      child: Icon(Icons.error),
                                                    ),
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                      ],

                                      // Admin Feedback
                                      if (report.adminComment != null &&
                                          report.adminComment!.isNotEmpty)
                                        Container(
                                          padding: const EdgeInsets.all(20),
                                          decoration: BoxDecoration(
                                            color: isDark
                                                ? const Color(0x1A064E3B)
                                                : const Color(0xFFECFDF5),
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                            border: Border.all(
                                              color: isDark
                                                  ? const Color(0xFF064E3B)
                                                  : const Color(0xFFD1FAE5),
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: const [
                                                  Icon(
                                                    LucideIcons.checkCircle2,
                                                    size: 14,
                                                    color: Color(0xFF059669),
                                                  ), // emerald-600
                                                  SizedBox(width: 8),
                                                  Text(
                                                    'অ্যাডমিন ফিডব্যাক',
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: Color(0xFF059669),
                                                      letterSpacing: 1.5,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 12),
                                              Text(
                                                report.adminComment!,
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  color: Color(0xFF065F46),
                                                  height: 1.5,
                                                ),
                                              ), // emerald-800
                                            ],
                                          ),
                                        )
                                      else
                                        Container(
                                          padding: const EdgeInsets.all(20),
                                          decoration: BoxDecoration(
                                            color: isDark
                                                ? const Color(0x80262626)
                                                : const Color(0x80F5F5F5),
                                            borderRadius: BorderRadius.circular(
                                              16,
                                            ),
                                            border: Border.all(
                                              color: isDark
                                                  ? const Color(0xFF404040)
                                                  : const Color(0xFFE5E5E5),
                                            ),
                                          ),
                                          child: Column(
                                            children: const [
                                              Icon(
                                                LucideIcons.clock,
                                                size: 20,
                                                color: Color(0xFFA3A3A3),
                                              ),
                                              SizedBox(height: 8),
                                              Text(
                                                'অ্যাডমিন এখনো কোনো ফিডব্যাক দেয়নি',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold,
                                                  color: Color(0xFF737373),
                                                  letterSpacing: 1,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),

                  if (_hasMore && _reports.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 24),
                      child: Center(
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
                                      width: 16,
                                      height: 16,
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
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
