import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/providers/exam_provider.dart';
import '../services/question_bank_service.dart';
import 'institute_question_bank_detail_view.dart';
import '../../../core/utils/bangla_name_helper.dart';

import '../../dashboard/providers/dashboard_providers.dart';

class SubjectDistribution {
  final String subject;
  final String questions;
  final String marks;
  final IconData icon;
  final Color color;
  final int questionCount;
  final int totalMarks;
  final int durationMinutes;

  const SubjectDistribution({
    required this.subject,
    required this.questions,
    required this.marks,
    required this.icon,
    required this.color,
    this.questionCount = 25,
    this.totalMarks = 25,
    this.durationMinutes = 25,
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
  final Set<String> _selectedSubjects = {};
  bool _initializedSubjects = false;

  static List<SubjectDistribution> getMarkDistribution(
    String instituteId,
    InstituteExamSet set, [
    String division = '',
  ]) {
    final id = instituteId.toLowerCase();
    final isWritten = set.type == 'written';

    // ── SSC Board / School Exams ──
    if (id.startsWith('board_') || id.startsWith('school_')) {
      final div = division.toLowerCase();
      final isBusiness = div.contains('business') || div.contains('commerce') || div.contains('ব্যবসায়');
      final isHumanities = div.contains('humanities') || div.contains('arts') || div.contains('মানবিক');

      if (isBusiness) {
        if (isWritten) {
          return const [
            SubjectDistribution(
              subject: 'হিসাববিজ্ঞান',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.bookOpen,
              color: Color(0xFF1E3A8A),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'ব্যবসায় উদ্যোগ',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.briefcase,
              color: Color(0xFF7A3602),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'ফিন্যান্স ও ব্যাংকিং',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.banknote,
              color: Color(0xFF065F46),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'সাধারণ গণিত',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.calculator,
              color: Color(0xFFEA580C),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'বাংলা',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.bookMarked,
              color: Color(0xFF831843),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'ইংরেজি',
              questions: 'রিটেন প্রশ্ন',
              marks: '১০০ নম্বর',
              icon: LucideIcons.languages,
              color: Color(0xFF0F766E),
              questionCount: 10,
              totalMarks: 100,
              durationMinutes: 180,
            ),
          ];
        } else {
          return const [
            SubjectDistribution(
              subject: 'হিসাববিজ্ঞান',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.bookOpen,
              color: Color(0xFF1E3A8A),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'ব্যবসায় উদ্যোগ',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.briefcase,
              color: Color(0xFF7A3602),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'ফিন্যান্স ও ব্যাংকিং',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.banknote,
              color: Color(0xFF065F46),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'সাধারণ গণিত',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.calculator,
              color: Color(0xFFEA580C),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'বাংলা',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.bookMarked,
              color: Color(0xFF831843),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'ইংরেজি',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.languages,
              color: Color(0xFF0F766E),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'তথ্য ও যোগাযোগ প্রযুক্তি',
              questions: '২৫টি প্রশ্ন',
              marks: '২৫ নম্বর',
              icon: LucideIcons.laptop,
              color: Color(0xFF0284C7),
              questionCount: 25,
              totalMarks: 25,
              durationMinutes: 25,
            ),
          ];
        }
      }

      if (isHumanities) {
        if (isWritten) {
          return const [
            SubjectDistribution(
              subject: 'ইতিহাস ও বিশ্ব সভ্যতা',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.landmark,
              color: Color(0xFF701A75),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'ভূগোল ও পরিবেশ',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.compass,
              color: Color(0xFF0F766E),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'পৌরনীতি ও নাগরিকতা',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.scale,
              color: Color(0xFF164E63),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'অর্থনীতি',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.trendingUp,
              color: Color(0xFF831843),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'সাধারণ গণিত',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.calculator,
              color: Color(0xFFEA580C),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
            SubjectDistribution(
              subject: 'বাংলা',
              questions: '১১টি সৃজনশীল প্রশ্ন',
              marks: '৭০ নম্বর',
              icon: LucideIcons.bookMarked,
              color: Color(0xFF831843),
              questionCount: 11,
              totalMarks: 70,
              durationMinutes: 150,
            ),
          ];
        } else {
          return const [
            SubjectDistribution(
              subject: 'ইতিহাস ও বিশ্ব সভ্যতা',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.landmark,
              color: Color(0xFF701A75),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'ভূগোল ও পরিবেশ',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.compass,
              color: Color(0xFF0F766E),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'পৌরনীতি ও নাগরিকতা',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.scale,
              color: Color(0xFF164E63),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'অর্থনীতি',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.trendingUp,
              color: Color(0xFF831843),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'সাধারণ গণিত',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.calculator,
              color: Color(0xFFEA580C),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'বাংলা',
              questions: '৩০টি প্রশ্ন',
              marks: '৩০ নম্বর',
              icon: LucideIcons.bookMarked,
              color: Color(0xFF831843),
              questionCount: 30,
              totalMarks: 30,
              durationMinutes: 30,
            ),
            SubjectDistribution(
              subject: 'তথ্য ও যোগাযোগ প্রযুক্তি',
              questions: '২৫টি প্রশ্ন',
              marks: '২৫ নম্বর',
              icon: LucideIcons.laptop,
              color: Color(0xFF0284C7),
              questionCount: 25,
              totalMarks: 25,
              durationMinutes: 25,
            ),
          ];
        }
      }

      // Default: Science
      if (isWritten) {
        return const [
          SubjectDistribution(
            subject: 'পদার্থবিজ্ঞান',
            questions: '১১টি সৃজনশীল প্রশ্ন',
            marks: '৫০ নম্বর',
            icon: LucideIcons.atom,
            color: Color(0xFF2563EB),
            questionCount: 11,
            totalMarks: 50,
            durationMinutes: 150,
          ),
          SubjectDistribution(
            subject: 'রসায়ন',
            questions: '১১টি সৃজনশীল প্রশ্ন',
            marks: '৫০ নম্বর',
            icon: LucideIcons.flaskConical,
            color: Color(0xFF8B5CF6),
            questionCount: 11,
            totalMarks: 50,
            durationMinutes: 150,
          ),
          SubjectDistribution(
            subject: 'উচ্চতর গণিত',
            questions: '১১টি সৃজনশীল প্রশ্ন',
            marks: '৫০ নম্বর',
            icon: LucideIcons.calculator,
            color: Color(0xFFEA580C),
            questionCount: 11,
            totalMarks: 50,
            durationMinutes: 150,
          ),
          SubjectDistribution(
            subject: 'জীববিজ্ঞান',
            questions: '১১টি সৃজনশীল প্রশ্ন',
            marks: '৫০ নম্বর',
            icon: LucideIcons.dna,
            color: Color(0xFF059669),
            questionCount: 11,
            totalMarks: 50,
            durationMinutes: 150,
          ),
          SubjectDistribution(
            subject: 'সাধারণ গণিত',
            questions: '১১টি সৃজনশীল প্রশ্ন',
            marks: '৭০ নম্বর',
            icon: LucideIcons.binary,
            color: Color(0xFF0D9488),
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          ),
          SubjectDistribution(
            subject: 'বাংলা',
            questions: '১১টি সৃজনশীল প্রশ্ন',
            marks: '৭০ নম্বর',
            icon: LucideIcons.bookMarked,
            color: Color(0xFF831843),
            questionCount: 11,
            totalMarks: 70,
            durationMinutes: 150,
          ),
        ];
      } else {
        return const [
          SubjectDistribution(
            subject: 'পদার্থবিজ্ঞান',
            questions: '২৫টি প্রশ্ন',
            marks: '২৫ নম্বর',
            icon: LucideIcons.atom,
            color: Color(0xFF2563EB),
            questionCount: 25,
            totalMarks: 25,
            durationMinutes: 25,
          ),
          SubjectDistribution(
            subject: 'রসায়ন',
            questions: '২৫টি প্রশ্ন',
            marks: '২৫ নম্বর',
            icon: LucideIcons.flaskConical,
            color: Color(0xFF8B5CF6),
            questionCount: 25,
            totalMarks: 25,
            durationMinutes: 25,
          ),
          SubjectDistribution(
            subject: 'উচ্চতর গণিত',
            questions: '২৫টি প্রশ্ন',
            marks: '২৫ নম্বর',
            icon: LucideIcons.calculator,
            color: Color(0xFFEA580C),
            questionCount: 25,
            totalMarks: 25,
            durationMinutes: 25,
          ),
          SubjectDistribution(
            subject: 'জীববিজ্ঞান',
            questions: '২৫টি প্রশ্ন',
            marks: '২৫ নম্বর',
            icon: LucideIcons.dna,
            color: Color(0xFF059669),
            questionCount: 25,
            totalMarks: 25,
            durationMinutes: 25,
          ),
          SubjectDistribution(
            subject: 'সাধারণ গণিত',
            questions: '৩০টি প্রশ্ন',
            marks: '৩০ নম্বর',
            icon: LucideIcons.binary,
            color: Color(0xFF0D9488),
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          ),
          SubjectDistribution(
            subject: 'বাংলা',
            questions: '৩০টি প্রশ্ন',
            marks: '৩০ নম্বর',
            icon: LucideIcons.bookMarked,
            color: Color(0xFF831843),
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          ),
          SubjectDistribution(
            subject: 'ইংরেজি',
            questions: '৩০টি প্রশ্ন',
            marks: '৩০ নম্বর',
            icon: LucideIcons.languages,
            color: Color(0xFF1E3A8A),
            questionCount: 30,
            totalMarks: 30,
            durationMinutes: 30,
          ),
          SubjectDistribution(
            subject: 'তথ্য ও যোগাযোগ প্রযুক্তি',
            questions: '২৫টি প্রশ্ন',
            marks: '২৫ নম্বর',
            icon: LucideIcons.laptop,
            color: Color(0xFF0284C7),
            questionCount: 25,
            totalMarks: 25,
            durationMinutes: 25,
          ),
        ];
      }
    }

    if (id == 'buet') {
      if (isWritten) {
        return const [
          SubjectDistribution(
            subject: 'পদার্থবিজ্ঞান',
            questions: '১৩-১৪টি প্রশ্ন',
            marks: '১৩৫ নম্বর',
            icon: LucideIcons.atom,
            color: Color(0xFF2563EB),
            questionCount: 14,
            totalMarks: 135,
            durationMinutes: 60,
          ),
          SubjectDistribution(
            subject: 'রসায়ন',
            questions: '১৩-১৪টি প্রশ্ন',
            marks: '১৩৫ নম্বর',
            icon: LucideIcons.flaskConical,
            color: Color(0xFF8B5CF6),
            questionCount: 13,
            totalMarks: 135,
            durationMinutes: 60,
          ),
          SubjectDistribution(
            subject: 'উচ্চতর গণিত',
            questions: '১৩-১৪টি প্রশ্ন',
            marks: '১৩০ নম্বর',
            icon: LucideIcons.calculator,
            color: Color(0xFFEA580C),
            questionCount: 13,
            totalMarks: 130,
            durationMinutes: 60,
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
            questionCount: 34,
            totalMarks: 34,
            durationMinutes: 34,
          ),
          SubjectDistribution(
            subject: 'রসায়ন',
            questions: '৩৩টি প্রশ্ন',
            marks: '৩৩ নম্বর',
            icon: LucideIcons.flaskConical,
            color: Color(0xFF8B5CF6),
            questionCount: 33,
            totalMarks: 33,
            durationMinutes: 33,
          ),
          SubjectDistribution(
            subject: 'উচ্চতর গণিত',
            questions: '৩৩টি প্রশ্ন',
            marks: '৩৩ নম্বর',
            icon: LucideIcons.calculator,
            color: Color(0xFFEA580C),
            questionCount: 33,
            totalMarks: 33,
            durationMinutes: 33,
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
          questionCount: 25,
          totalMarks: 125,
          durationMinutes: 45,
        ),
        SubjectDistribution(
          subject: 'রসায়ন',
          questions: '২৫টি প্রশ্ন',
          marks: '১২৫ নম্বর',
          icon: LucideIcons.flaskConical,
          color: Color(0xFF8B5CF6),
          questionCount: 25,
          totalMarks: 125,
          durationMinutes: 45,
        ),
        SubjectDistribution(
          subject: 'উচ্চতর গণিত',
          questions: '২৫টি প্রশ্ন',
          marks: '১২৫ নম্বর',
          icon: LucideIcons.calculator,
          color: Color(0xFFEA580C),
          questionCount: 25,
          totalMarks: 125,
          durationMinutes: 45,
        ),
        SubjectDistribution(
          subject: 'ইংরেজি',
          questions: '২৫টি প্রশ্ন',
          marks: '১২৫ নম্বর',
          icon: LucideIcons.bookOpen,
          color: Color(0xFF0D9488),
          questionCount: 25,
          totalMarks: 125,
          durationMinutes: 45,
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
          questionCount: 30,
          totalMarks: 30,
          durationMinutes: 18,
        ),
        SubjectDistribution(
          subject: 'রসায়ন',
          questions: '২৫টি প্রশ্ন',
          marks: '২৫ নম্বর',
          icon: LucideIcons.flaskConical,
          color: Color(0xFF8B5CF6),
          questionCount: 25,
          totalMarks: 25,
          durationMinutes: 15,
        ),
        SubjectDistribution(
          subject: 'পদার্থবিজ্ঞান',
          questions: '২০টি প্রশ্ন',
          marks: '২০ নম্বর',
          icon: LucideIcons.atom,
          color: Color(0xFF2563EB),
          questionCount: 20,
          totalMarks: 20,
          durationMinutes: 12,
        ),
        SubjectDistribution(
          subject: 'ইংরেজি',
          questions: '১৫টি প্রশ্ন',
          marks: '১৫ নম্বর',
          icon: LucideIcons.languages,
          color: Color(0xFFD97706),
          questionCount: 15,
          totalMarks: 15,
          durationMinutes: 9,
        ),
        SubjectDistribution(
          subject: 'সাধারণ জ্ঞান',
          questions: '১০টি প্রশ্ন',
          marks: '১০ নম্বর',
          icon: LucideIcons.globe,
          color: Color(0xFFE11D48),
          questionCount: 10,
          totalMarks: 10,
          durationMinutes: 6,
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
          questionCount: 15,
          totalMarks: 25,
          durationMinutes: 22,
        ),
        SubjectDistribution(
          subject: 'রসায়ন',
          questions: '১৫টি MCQ + লিখিত',
          marks: '২৫ নম্বর',
          icon: LucideIcons.flaskConical,
          color: Color(0xFF8B5CF6),
          questionCount: 15,
          totalMarks: 25,
          durationMinutes: 22,
        ),
        SubjectDistribution(
          subject: 'উচ্চতর গণিত',
          questions: '১৫টি MCQ + লিখিত',
          marks: '২৫ নম্বর',
          icon: LucideIcons.calculator,
          color: Color(0xFFEA580C),
          questionCount: 15,
          totalMarks: 25,
          durationMinutes: 22,
        ),
        SubjectDistribution(
          subject: 'জীববিজ্ঞান / আইসিটি',
          questions: '১৫টি MCQ + লিখিত',
          marks: '২৫ নম্বর',
          icon: LucideIcons.dna,
          color: Color(0xFF059669),
          questionCount: 15,
          totalMarks: 25,
          durationMinutes: 22,
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
        questionCount: 25,
        totalMarks: 25,
        durationMinutes: 25,
      ),
      SubjectDistribution(
        subject: 'রসায়ন',
        questions: '২৫টি প্রশ্ন',
        marks: '২৫ নম্বর',
        icon: LucideIcons.flaskConical,
        color: Color(0xFF8B5CF6),
        questionCount: 25,
        totalMarks: 25,
        durationMinutes: 25,
      ),
      SubjectDistribution(
        subject: 'উচ্চতর গণিত',
        questions: '২৫টি প্রশ্ন',
        marks: '২৫ নম্বর',
        icon: LucideIcons.calculator,
        color: Color(0xFFEA580C),
        questionCount: 25,
        totalMarks: 25,
        durationMinutes: 25,
      ),
      SubjectDistribution(
        subject: 'জীববিজ্ঞান / অন্যান্য',
        questions: '২৫টি প্রশ্ন',
        marks: '২৫ নম্বর',
        icon: LucideIcons.dna,
        color: Color(0xFF0D9488),
        questionCount: 25,
        totalMarks: 25,
        durationMinutes: 25,
      ),
    ];
  }

  void _toggleSubject(SubjectDistribution item, bool isWritten) {
    HapticFeedback.selectionClick();
    setState(() {
      if (isWritten) {
        // CQ: Only single subject can be selected
        _selectedSubjects.clear();
        _selectedSubjects.add(item.subject);
        _loadedQuestions = [];
      } else {
        // MCQ: Can select multiple subjects, but must keep at least 1 selected
        if (_selectedSubjects.contains(item.subject)) {
          if (_selectedSubjects.length > 1) {
            _selectedSubjects.remove(item.subject);
            _loadedQuestions = [];
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'কমপক্ষে একটি বিষয় নির্বাচন করতে হবে',
                  style: TextStyle(fontFamily: 'HindSiliguri'),
                ),
                duration: Duration(seconds: 2),
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        } else {
          _selectedSubjects.add(item.subject);
          _loadedQuestions = [];
        }
      }
    });
  }

  Future<List<Question>> _getQuestions() async {
    if (_loadedQuestions.isNotEmpty) return _loadedQuestions;
    setState(() => _isLoading = true);
    try {
      final instId = (widget.institute['id'] ?? '').toString();
      var qs = await QuestionBankService.fetchExamSetQuestions(
        instituteId: instId,
        examSet: widget.examSet,
        selectedSubjects: _selectedSubjects.toList(),
      );
      final isWritten = widget.examSet.type == 'written' ||
          widget.examSet.id.toLowerCase().contains('written') ||
          widget.examSet.title.toLowerCase().contains('written') ||
          widget.examSet.title.contains('লিখিত');
      if (isWritten) {
        qs = QuestionBankService.sortSeriallySubjectwise(qs);
      }
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

  Future<void> _handleStartExam({
    required int calculatedDuration,
    required int calculatedMarks,
  }) async {
    HapticFeedback.mediumImpact();
    final qs = await _getQuestions();
    if (!mounted || qs.isEmpty) return;

    final instName = (widget.institute['name'] ?? 'ইনস্টিটিউট').toString();
    final isWritten = widget.examSet.type == 'written' ||
        widget.examSet.id.toLowerCase().contains('written') ||
        widget.examSet.title.toLowerCase().contains('written') ||
        widget.examSet.title.contains('লিখিত');

    final rawTitle = widget.examSet.title.trim();
    final cleanSubjectLabel = BanglaNameHelper.deduplicateExamTitle(
      rawTitle.isEmpty ? instName : rawTitle,
      instName,
    );

    final String finalSubjectLabel;
    if (_selectedSubjects.isNotEmpty) {
      if (_selectedSubjects.length == 1) {
        finalSubjectLabel = '$cleanSubjectLabel (${_selectedSubjects.first})';
      } else {
        finalSubjectLabel = '$cleanSubjectLabel (${_selectedSubjects.length}টি বিষয়)';
      }
    } else {
      finalSubjectLabel = cleanSubjectLabel;
    }

    final details = ExamDetails(
      subject: instName,
      subjectLabel: finalSubjectLabel,
      examType: isWritten ? 'Written' : 'Admission',
      chapters: 'সকল অধ্যায়',
      topics: _selectedSubjects.isNotEmpty
          ? _selectedSubjects.join(', ')
          : 'সকল বিষয়',
      totalQuestions: qs.length,
      durationMinutes: calculatedDuration,
      totalMarks: calculatedMarks,
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

    final userDivision = ref.watch(userProfileProvider).value?.division ?? '';
    final distributions = getMarkDistribution(instId, widget.examSet, userDivision);
    final isWritten = widget.examSet.type == 'written' ||
        widget.examSet.id.toLowerCase().contains('written') ||
        widget.examSet.title.toLowerCase().contains('written') ||
        widget.examSet.title.contains('লিখিত');

    // Initialize default selection once
    if (!_initializedSubjects && distributions.isNotEmpty) {
      if (isWritten) {
        // For CQ, default select only the first subject
        _selectedSubjects.add(distributions.first.subject);
      } else {
        // For MCQ, default select all or first 4 core subjects
        final defaultTake = distributions.length > 4 ? 4 : distributions.length;
        for (var i = 0; i < defaultTake; i++) {
          _selectedSubjects.add(distributions[i].subject);
        }
      }
      _initializedSubjects = true;
    }

    // Dynamic stats based on selected subjects
    final selectedDistributions = distributions.where(
      (d) => _selectedSubjects.contains(d.subject),
    ).toList();

    final int calculatedQuestions = selectedDistributions.isNotEmpty
        ? selectedDistributions.fold<int>(0, (sum, d) => sum + d.questionCount)
        : widget.examSet.questionCount;

    final int calculatedDuration = selectedDistributions.isNotEmpty
        ? selectedDistributions.fold<int>(0, (sum, d) => sum + d.durationMinutes)
        : widget.examSet.durationMinutes;

    final int calculatedMarks = selectedDistributions.isNotEmpty
        ? selectedDistributions.fold<int>(0, (sum, d) => sum + d.totalMarks)
        : (widget.examSet.marks ?? (isWritten ? 70 : 100));

    final isBuet = instId.toLowerCase() == 'buet';
    final formatText = isWritten
        ? 'লিখিত (CQ)'
        : (widget.examSet.type == 'combined'
            ? 'MCQ + লিখিত'
            : (isBuet ? 'প্রিলি (MCQ)' : 'MCQ'));

    final hasNegativeMarking = !isWritten;
    final negativeMarkText = hasNegativeMarking ? '০.২৫ নম্বর / ভুল' : 'নেই';
    final calculatorAllowed = instId == 'medical' ? 'অনুমোদিত নয়' : 'অনুমোদিত (Non-prog)';

    // Subtitle formatting
    final isBoardOrSchool = instId.toLowerCase().startsWith('board_') ||
        instId.toLowerCase().startsWith('school_');
    final subtitleText = isBoardOrSchool
        ? '$instName • পরীক্ষা সাল: ${widget.examSet.year}'
        : '$instName ভর্তি পরীক্ষা • সেশন: ${widget.examSet.year}';

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
                            color: isDark ? const Color(0xFF18181B) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
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
                                      subtitleText,
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

                        // Section: পরীক্ষার তথ্যাবলি (Dynamically updated based on selection)
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
                            color: isDark ? const Color(0xFF18181B) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
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
                                        title: 'মোট প্রশ্ন',
                                        value: '${BanglaNameHelper.toBanglaNumeral(calculatedQuestions)}টি প্রশ্ন',
                                        isDark: isDark,
                                      ),
                                    ),
                                    VerticalDivider(
                                      width: 24,
                                      thickness: 1,
                                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                                    ),
                                    Expanded(
                                      child: _buildInfoItem(
                                        title: 'নির্ধারিত সময়',
                                        value: formatDurationMinutes(calculatedDuration),
                                        isDark: isDark,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Divider(
                                height: 20,
                                thickness: 1,
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                              ),
                              // Row 2: পূর্ণমান | নেগেটিভ মার্ক
                              IntrinsicHeight(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Expanded(
                                      child: _buildInfoItem(
                                        title: 'পূর্ণমান',
                                        value: '${BanglaNameHelper.toBanglaNumeral(calculatedMarks)} নম্বর',
                                        isDark: isDark,
                                      ),
                                    ),
                                    VerticalDivider(
                                      width: 24,
                                      thickness: 1,
                                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                                    ),
                                    Expanded(
                                      child: _buildInfoItem(
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
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                              ),
                              // Row 3: পদ্ধতি | ক্যালকুলেটর
                              IntrinsicHeight(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Expanded(
                                      child: _buildInfoItem(
                                        title: 'পদ্ধতি',
                                        value: formatText,
                                        isDark: isDark,
                                      ),
                                    ),
                                    VerticalDivider(
                                      width: 24,
                                      thickness: 1,
                                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                                    ),
                                    Expanded(
                                      child: _buildInfoItem(
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

                        // Section: বিষয় নির্বাচন ও নম্বর বণ্টন
                        Row(
                          children: [
                            Text(
                              isWritten ? 'বিষয় নির্বাচন (একটি প্রযোজ্য)' : 'বিষয় নির্বাচন (একাধিক সম্ভব)',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isWritten
                                    ? const Color(0xFF8B5CF6).withValues(alpha: 0.12)
                                    : const Color(0xFF059669).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isWritten
                                      ? const Color(0xFF8B5CF6).withValues(alpha: 0.3)
                                      : const Color(0xFF059669).withValues(alpha: 0.3),
                                ),
                              ),
                              child: Text(
                                isWritten ? '১টি বিষয়' : '${BanglaNameHelper.toBanglaNumeral(_selectedSubjects.length)}টি নির্বাচিত',
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: isWritten ? const Color(0xFF8B5CF6) : const Color(0xFF059669),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // Interactive Subject Selection List
                        Column(
                          children: distributions.map((dist) {
                            final isSelected = _selectedSubjects.contains(dist.subject);
                            return _buildInteractiveSubjectCard(
                              dist: dist,
                              isSelected: isSelected,
                              isWritten: isWritten,
                              isDark: isDark,
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ),

                // Fixed Bottom Action Bar with 2 Buttons: 'প্রশ্ন দেখো' & 'পরীক্ষা দাও'
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF18181B) : Colors.white,
                    border: Border(
                      top: BorderSide(
                        color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
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
                          child: OutlinedButton(
                            onPressed: _isLoading ? null : _handleViewQuestions,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                              side: BorderSide(
                                color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'প্রশ্ন দেখো',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
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
                          child: ElevatedButton(
                            onPressed: _isLoading
                                ? null
                                : () => _handleStartExam(
                                      calculatedDuration: calculatedDuration,
                                      calculatedMarks: calculatedMarks,
                                    ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF004633),
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'পরীক্ষা দাও',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
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
                      color: isDark ? const Color(0xFF18181B) : Colors.white,
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
                          'প্রশ্নাবলি সাজানো হচ্ছে...',
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
    required String title,
    required String value,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          title,
          textAlign: TextAlign.center,
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
          textAlign: TextAlign.center,
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
    );
  }

  Widget _buildInteractiveSubjectCard({
    required SubjectDistribution dist,
    required bool isSelected,
    required bool isWritten,
    required bool isDark,
  }) {
    final activeColor = dist.color;
    final primaryThemeGreen = const Color(0xFF004633);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _toggleSubject(dist, isWritten),
          borderRadius: BorderRadius.circular(14),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected
                  ? (isDark ? activeColor.withValues(alpha: 0.12) : activeColor.withValues(alpha: 0.06))
                  : (isDark ? const Color(0xFF18181B) : Colors.white),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected
                    ? activeColor.withValues(alpha: 0.6)
                    : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                width: isSelected ? 1.5 : 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isSelected ? 0.04 : 0.01),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                // Subject Icon inside colored circle
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: dist.color.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    dist.icon,
                    size: 18,
                    color: dist.color,
                  ),
                ),
                const SizedBox(width: 12),

                // Subject Name & details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        dist.subject,
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${dist.questions} • ${dist.marks}',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),

                // Selection Indicator: Radio for CQ, Checkbox for MCQ
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: isWritten ? BoxShape.circle : BoxShape.rectangle,
                    borderRadius: isWritten ? null : BorderRadius.circular(6),
                    color: isSelected ? primaryThemeGreen : Colors.transparent,
                    border: Border.all(
                      color: isSelected
                          ? primaryThemeGreen
                          : (isDark ? const Color(0xFF52525B) : const Color(0xFFCBD5E1)),
                      width: 1.8,
                    ),
                  ),
                  child: isSelected
                      ? (isWritten
                          ? Center(
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white,
                                ),
                              ),
                            )
                          : const Icon(
                              LucideIcons.check,
                              size: 14,
                              color: Colors.white,
                            ))
                      : null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
