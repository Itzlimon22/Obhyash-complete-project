import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/providers/exam_provider.dart';
import '../services/question_bank_service.dart';
import 'institute_question_bank_detail_view.dart';

class SubjectDistribution {
  final String subject;
  final String questions;
  final String marks;
  final IconData icon;
  final Color color;

  const SubjectDistribution({
    required this.subject,
    required this.questions,
    required this.marks,
    required this.icon,
    required this.color,
  });
}

class ExamSetDetailView extends ConsumerStatefulWidget {
  final Map<String, dynamic> institute;
  final InstituteExamSet examSet;

  const ExamSetDetailView({
    super.key,
    required this.institute,
    required this.examSet,
  });

  @override
  ConsumerState<ExamSetDetailView> createState() => _ExamSetDetailViewState();
}

class _ExamSetDetailViewState extends ConsumerState<ExamSetDetailView> {
  bool _isLoading = false;
  List<Question> _loadedQuestions = [];

  static List<SubjectDistribution> getMarkDistribution(
    String instituteId,
    InstituteExamSet set,
  ) {
    final id = instituteId.toLowerCase();
    final isWritten = set.type == 'written';

    if (id == 'buet') {
      if (isWritten) {
        return const [
          SubjectDistribution(
            subject: 'পদার্থবিজ্ঞান',
            questions: '১৩-১৪টি প্রশ্ন',
            marks: '১৩৫ নম্বর',
            icon: LucideIcons.atom,
            color: Color(0xFF2563EB),
          ),
          SubjectDistribution(
            subject: 'রসায়ন',
            questions: '১৩-১৪টি প্রশ্ন',
            marks: '১৩৫ নম্বর',
            icon: LucideIcons.flaskConical,
            color: Color(0xFF8B5CF6),
          ),
          SubjectDistribution(
            subject: 'উচ্চতর গণিত',
            questions: '১৩-১৪টি প্রশ্ন',
            marks: '১৩০ নম্বর',
            icon: LucideIcons.calculator,
            color: Color(0xFFEA580C),
          ),
        ];
      } else {
        return const [
          SubjectDistribution(
            subject: 'পদার্থবিজ্ঞান',
            questions: '৩৪টি প্রশ্ন',
            marks: '৩৪ নম্বর',
            icon: LucideIcons.atom,
            color: Color(0xFF2563EB),
          ),
          SubjectDistribution(
            subject: 'রসায়ন',
            questions: '৩৩টি প্রশ্ন',
            marks: '৩৩ নম্বর',
            icon: LucideIcons.flaskConical,
            color: Color(0xFF8B5CF6),
          ),
          SubjectDistribution(
            subject: 'উচ্চতর গণিত',
            questions: '৩৩টি প্রশ্ন',
            marks: '৩৩ নম্বর',
            icon: LucideIcons.calculator,
            color: Color(0xFFEA580C),
          ),
        ];
      }
    }

    if (id == 'ckruet' || id == 'ruet' || id == 'kuet' || id == 'cuet') {
      return const [
        SubjectDistribution(
          subject: 'পদার্থবিজ্ঞান',
          questions: '২৫টি প্রশ্ন',
          marks: '১২৫ নম্বর',
          icon: LucideIcons.atom,
          color: Color(0xFF2563EB),
        ),
        SubjectDistribution(
          subject: 'রসায়ন',
          questions: '২৫টি প্রশ্ন',
          marks: '১২৫ নম্বর',
          icon: LucideIcons.flaskConical,
          color: Color(0xFF8B5CF6),
        ),
        SubjectDistribution(
          subject: 'উচ্চতর গণিত',
          questions: '২৫টি প্রশ্ন',
          marks: '১২৫ নম্বর',
          icon: LucideIcons.calculator,
          color: Color(0xFFEA580C),
        ),
        SubjectDistribution(
          subject: 'ইংরেজি',
          questions: '২৫টি প্রশ্ন',
          marks: '১২৫ নম্বর',
          icon: LucideIcons.bookOpen,
          color: Color(0xFF0D9488),
        ),
      ];
    }

    if (id == 'medical') {
      return const [
        SubjectDistribution(
          subject: 'জীববিজ্ঞান',
          questions: '৩০টি প্রশ্ন',
          marks: '৩০ নম্বর',
          icon: LucideIcons.dna,
          color: Color(0xFF059669),
        ),
        SubjectDistribution(
          subject: 'রসায়ন',
          questions: '২৫টি প্রশ্ন',
          marks: '২৫ নম্বর',
          icon: LucideIcons.flaskConical,
          color: Color(0xFF8B5CF6),
        ),
        SubjectDistribution(
          subject: 'পদার্থবিজ্ঞান',
          questions: '২০টি প্রশ্ন',
          marks: '২০ নম্বর',
          icon: LucideIcons.atom,
          color: Color(0xFF2563EB),
        ),
        SubjectDistribution(
          subject: 'ইংরেজি',
          questions: '১৫টি প্রশ্ন',
          marks: '১৫ নম্বর',
          icon: LucideIcons.languages,
          color: Color(0xFFD97706),
        ),
        SubjectDistribution(
          subject: 'সাধারণ জ্ঞান',
          questions: '১০টি প্রশ্ন',
          marks: '১০ নম্বর',
          icon: LucideIcons.globe,
          color: Color(0xFFE11D48),
        ),
      ];
    }

    if (id.contains('du')) {
      return const [
        SubjectDistribution(
          subject: 'পদার্থবিজ্ঞান',
          questions: '১৫টি MCQ + লিখিত',
          marks: '২৫ নম্বর',
          icon: LucideIcons.atom,
          color: Color(0xFF2563EB),
        ),
        SubjectDistribution(
          subject: 'রসায়ন',
          questions: '১৫টি MCQ + লিখিত',
          marks: '২৫ নম্বর',
          icon: LucideIcons.flaskConical,
          color: Color(0xFF8B5CF6),
        ),
        SubjectDistribution(
          subject: 'উচ্চতর গণিত',
          questions: '১৫টি MCQ + লিখিত',
          marks: '২৫ নম্বর',
          icon: LucideIcons.calculator,
          color: Color(0xFFEA580C),
        ),
        SubjectDistribution(
          subject: 'জীববিজ্ঞান / আইসিটি',
          questions: '১৫টি MCQ + লিখিত',
          marks: '২৫ নম্বর',
          icon: LucideIcons.dna,
          color: Color(0xFF059669),
        ),
      ];
    }

    // Default 4-subject breakdown
    return const [
      SubjectDistribution(
        subject: 'পদার্থবিজ্ঞান',
        questions: '২৫টি প্রশ্ন',
        marks: '২৫ নম্বর',
        icon: LucideIcons.atom,
        color: Color(0xFF2563EB),
      ),
      SubjectDistribution(
        subject: 'রসায়ন',
        questions: '২৫টি প্রশ্ন',
        marks: '২৫ নম্বর',
        icon: LucideIcons.flaskConical,
        color: Color(0xFF8B5CF6),
      ),
      SubjectDistribution(
        subject: 'উচ্চতর গণিত',
        questions: '২৫টি প্রশ্ন',
        marks: '২৫ নম্বর',
        icon: LucideIcons.calculator,
        color: Color(0xFFEA580C),
      ),
      SubjectDistribution(
        subject: 'জীববিজ্ঞান / অন্যান্য',
        questions: '২৫টি প্রশ্ন',
        marks: '২৫ নম্বর',
        icon: LucideIcons.dna,
        color: Color(0xFF0D9488),
      ),
    ];
  }

  Future<List<Question>> _getQuestions() async {
    if (_loadedQuestions.isNotEmpty) return _loadedQuestions;
    setState(() => _isLoading = true);
    try {
      final instId = (widget.institute['id'] ?? '').toString();
      final qs = await QuestionBankService.fetchExamSetQuestions(
        instituteId: instId,
        examSet: widget.examSet,
      );
      if (mounted) {
        setState(() {
          _loadedQuestions = qs;
          _isLoading = false;
        });
      }
      return qs;
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      return [];
    }
  }

  Future<void> _handleViewQuestions() async {
    HapticFeedback.lightImpact();
    final qs = await _getQuestions();
    if (!mounted || qs.isEmpty) return;
    context.push(
      '/question-bank/questions-view',
      extra: {
        'institute': widget.institute,
        'examSet': widget.examSet,
        'questions': qs,
      },
    );
  }

  Future<void> _handleStartExam() async {
    HapticFeedback.mediumImpact();
    final qs = await _getQuestions();
    if (!mounted || qs.isEmpty) return;

    final instId = (widget.institute['id'] ?? '').toString().toLowerCase();
    final instName = (widget.institute['name'] ?? 'ইনস্টিটিউট').toString();
    final isWritten = widget.examSet.type == 'written';

    final totalMarks = widget.examSet.marks ??
        (isWritten
            ? 400
            : (instId == 'ckruet' ? 500 : (instId == 'mist' ? 200 : 100)));

    final details = ExamDetails(
      subject: instName,
      subjectLabel: '$instName ${widget.examSet.title}',
      examType: isWritten ? 'Written' : 'Admission',
      chapters: 'সকল অধ্যায়',
      topics: 'সকল বিষয়',
      totalQuestions: qs.length,
      durationMinutes: widget.examSet.durationMinutes,
      totalMarks: totalMarks,
      negativeMarking: isWritten ? 0.0 : 0.25,
    );

    ref.read(examEngineProvider.notifier).startDirectExam(
          questions: qs,
          details: details,
        );

    context.push('/exam');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final instId = (widget.institute['id'] ?? '').toString();
    final instName = (widget.institute['name'] ?? 'ইনস্টিটিউট').toString();
    final instLogo = (widget.institute['logo'] ?? '').toString();

    final distributions = getMarkDistribution(instId, widget.examSet);
    final isWritten = widget.examSet.type == 'written';
    final isBuet = instId.toLowerCase() == 'buet';
    final formatText = isWritten
        ? 'লিখিত'
        : (widget.examSet.type == 'combined'
            ? 'MCQ + লিখিত'
            : (isBuet ? 'প্রিলি (MCQ)' : 'MCQ'));

    final totalMarks = widget.examSet.marks ??
        (isWritten
            ? 400
            : (instId == 'ckruet' ? 500 : (instId == 'mist' ? 200 : 100)));

    final hasNegativeMarking = !isWritten;
    final negativeMarkText = hasNegativeMarking ? '০.২৫ নম্বর / ভুল' : 'নেই';
    final calculatorAllowed = instId == 'medical' ? 'অনুমোদিত নয়' : 'অনুমোদিত (Non-prog)';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: Text(
          widget.examSet.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                // Scrollable Content
                Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Badge Card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 4,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                            padding: const EdgeInsets.all(5),
                            child: ClipOval(
                              child: Image.asset(
                                instLogo,
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(LucideIcons.graduationCap, size: 22, color: Color(0xFF2563EB)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.examSet.title,
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '$instName ভর্তি পরীক্ষা • সেশন: ${widget.examSet.year}',
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Section: পরীক্ষার তথ্যাবলি (Single Box with 2 Columns)
                    Text(
                      'পরীক্ষার তথ্যাবলি',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Row 1: মোট প্রশ্ন | নির্ধারিত সময়
                          IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: _buildInfoItem(
                                    icon: LucideIcons.fileQuestion,
                                    iconColor: const Color(0xFF10B981),
                                    title: 'মোট প্রশ্ন',
                                    value: widget.examSet.questionLabel,
                                    isDark: isDark,
                                  ),
                                ),
                                VerticalDivider(
                                  width: 24,
                                  thickness: 1,
                                  color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                                ),
                                Expanded(
                                  child: _buildInfoItem(
                                    icon: LucideIcons.timer,
                                    iconColor: const Color(0xFFF43F5E),
                                    title: 'নির্ধারিত সময়',
                                    value: formatDurationMinutes(widget.examSet.durationMinutes),
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Divider(
                            height: 20,
                            thickness: 1,
                            color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                          ),
                          // Row 2: পূর্ণমান | নেগেটিভ মার্ক
                          IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: _buildInfoItem(
                                    icon: LucideIcons.award,
                                    iconColor: const Color(0xFFF59E0B),
                                    title: 'পূর্ণমান',
                                    value: '$totalMarks নম্বর',
                                    isDark: isDark,
                                  ),
                                ),
                                VerticalDivider(
                                  width: 24,
                                  thickness: 1,
                                  color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                                ),
                                Expanded(
                                  child: _buildInfoItem(
                                    icon: LucideIcons.alertCircle,
                                    iconColor: const Color(0xFFEF4444),
                                    title: 'নেগেটিভ মার্ক',
                                    value: negativeMarkText,
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Divider(
                            height: 20,
                            thickness: 1,
                            color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                          ),
                          // Row 3: পদ্ধতি | ক্যালকুলেটর
                          IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: _buildInfoItem(
                                    icon: LucideIcons.layers,
                                    iconColor: const Color(0xFF8B5CF6),
                                    title: 'পদ্ধতি',
                                    value: formatText,
                                    isDark: isDark,
                                  ),
                                ),
                                VerticalDivider(
                                  width: 24,
                                  thickness: 1,
                                  color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                                ),
                                Expanded(
                                  child: _buildInfoItem(
                                    icon: LucideIcons.calculator,
                                    iconColor: const Color(0xFF0EA5E9),
                                    title: 'ক্যালকুলেটর',
                                    value: calculatorAllowed,
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),

                    // Section: বিষয়ভিত্তিক নম্বর বণ্টন (Single Box with 2 Columns)
                    Text(
                      'বিষয়ভিত্তিক নম্বর বণ্টন',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          for (int i = 0; i < distributions.length; i += 2) ...[
                            if (i > 0)
                              Divider(
                                height: 20,
                                thickness: 1,
                                color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                              ),
                            IntrinsicHeight(
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: _buildSubjectItem(distributions[i], isDark),
                                  ),
                                  if (i + 1 < distributions.length) ...[
                                    VerticalDivider(
                                      width: 24,
                                      thickness: 1,
                                      color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                                    ),
                                    Expanded(
                                      child: _buildSubjectItem(distributions[i + 1], isDark),
                                    ),
                                  ] else
                                    const Expanded(child: SizedBox.shrink()),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Fixed Bottom Action Bar with 2 Buttons: 'প্রশ্ন দেখো' & 'পরীক্ষা দাও'
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Button 1: প্রশ্ন দেখো (View Questions)
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: OutlinedButton.icon(
                        onPressed: _isLoading ? null : _handleViewQuestions,
                        icon: const Icon(LucideIcons.eye, size: 18),
                        label: const Text(
                          'প্রশ্ন দেখো',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                          side: BorderSide(
                            color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Button 2: পরীক্ষা দাও (Take Exam)
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _handleStartExam,
                        icon: const Icon(LucideIcons.play, size: 18, color: Colors.white),
                        label: const Text(
                          'পরীক্ষা দাও',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (_isLoading)
          Container(
            color: (isDark ? Colors.black : Colors.white).withValues(alpha: 0.7),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 32,
                      height: 32,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'প্রশ্নাবলি লোড করা হচ্ছে...',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    ),
  ),
);
  }

  Widget _buildInfoItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String value,
    required bool isDark,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(icon, size: 18, color: iconColor),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectItem(SubjectDistribution dist, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: dist.color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(dist.icon, size: 15, color: dist.color),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                dist.subject,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${dist.questions} • ${dist.marks}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
