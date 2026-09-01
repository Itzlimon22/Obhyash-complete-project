class FormulaPracticeQuestion {
  final String question;
  final String answer;

  const FormulaPracticeQuestion({
    required this.question,
    required this.answer,
  });

  factory FormulaPracticeQuestion.fromJson(Map<String, dynamic> json) =>
      FormulaPracticeQuestion(
        question: json['question'] as String? ?? '',
        answer: json['answer'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'question': question,
        'answer': answer,
      };
}

class FormulaEntry {
  final String title;
  final String latex;
  final String description;
  final List<FormulaPracticeQuestion> practiceQuestions;

  const FormulaEntry({
    required this.title,
    required this.latex,
    required this.description,
    this.practiceQuestions = const [],
  });

  factory FormulaEntry.fromJson(Map<String, dynamic> json) {
    List<FormulaPracticeQuestion> list = [];
    if (json['practiceQuestions'] != null && json['practiceQuestions'] is List) {
      list = (json['practiceQuestions'] as List)
          .map((e) => FormulaPracticeQuestion.fromJson(e as Map<String, dynamic>))
          .toList();
    } else if (json['practice'] != null) {
      list = [FormulaPracticeQuestion.fromJson(json['practice'] as Map<String, dynamic>)];
    }

    return FormulaEntry(
      title: json['title'] as String,
      latex: json['latex'] as String,
      description: json['description'] as String,
      practiceQuestions: list,
    );
  }
}

class FormulaChapter {
  final String chapterId;
  final String chapterName;
  final int chapterNumber;
  final List<FormulaEntry> formulas;

  const FormulaChapter({
    required this.chapterId,
    required this.chapterName,
    required this.chapterNumber,
    required this.formulas,
  });

  factory FormulaChapter.fromJson(Map<String, dynamic> json) => FormulaChapter(
        chapterId: json['chapterId'] as String,
        chapterName: json['chapterName'] as String,
        chapterNumber: json['chapterNumber'] as int,
        formulas: json['formulas'] != null
            ? (json['formulas'] as List)
                .map((e) => FormulaEntry.fromJson(e as Map<String, dynamic>))
                .toList()
            : const [],
      );
}

class FormulaSubject {
  final String subjectId;
  final String subjectName;
  final List<FormulaChapter> chapters;

  const FormulaSubject({
    required this.subjectId,
    required this.subjectName,
    required this.chapters,
  });

  factory FormulaSubject.fromJson(Map<String, dynamic> json) => FormulaSubject(
        subjectId: json['subjectId'] as String,
        subjectName: json['subjectName'] as String,
        chapters: (json['chapters'] as List)
            .map((e) => FormulaChapter.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

// Metadata for the subject grid (no JSON loading needed)
class SubjectMeta {
  final String subjectId;
  final String subjectName;
  final String assetPath;
  final String emoji;
  final String? svgIcon;
  final List<int> gradientColors;

  const SubjectMeta({
    required this.subjectId,
    required this.subjectName,
    required this.assetPath,
    required this.emoji,
    this.svgIcon,
    required this.gradientColors,
  });
}

const kHscFormulaSubjects = [
  SubjectMeta(
    subjectId: 'hsc_physics_1',
    subjectName: 'পদার্থবিজ্ঞান ১ম পত্র',
    assetPath: 'assets/formulas/hsc_physics_1/index.json',
    emoji: '⚡',
    svgIcon: 'assets/dashboard-icons/subject_physics.svg',
    gradientColors: [0xFF0F172A, 0xFF1E3A5F],
  ),
  SubjectMeta(
    subjectId: 'hsc_physics_2',
    subjectName: 'পদার্থবিজ্ঞান ২য় পত্র',
    assetPath: 'assets/formulas/hsc_physics_2/index.json',
    emoji: '🔋',
    svgIcon: 'assets/dashboard-icons/subject_physics.svg',
    gradientColors: [0xFF0F1A2E, 0xFF1E4080],
  ),
  SubjectMeta(
    subjectId: 'hsc_chemistry_1',
    subjectName: 'রসায়ন ১ম পত্র',
    assetPath: 'assets/formulas/hsc_chemistry_1/index.json',
    emoji: '🧪',
    svgIcon: 'assets/dashboard-icons/subject_chemistry.svg',
    gradientColors: [0xFF0D2818, 0xFF1B4332],
  ),
  SubjectMeta(
    subjectId: 'hsc_chemistry_2',
    subjectName: 'রসায়ন ২য় পত্র',
    assetPath: 'assets/formulas/hsc_chemistry_2/index.json',
    emoji: '⚗️',
    svgIcon: 'assets/dashboard-icons/subject_chemistry.svg',
    gradientColors: [0xFF1A1A2E, 0xFF16213E],
  ),
  SubjectMeta(
    subjectId: 'hsc_math_1',
    subjectName: 'উচ্চতর গণিত ১ম পত্র',
    assetPath: 'assets/formulas/hsc_math_1/index.json',
    emoji: '📐',
    svgIcon: 'assets/dashboard-icons/subject_math.svg',
    gradientColors: [0xFF2D1B69, 0xFF1B1B4B],
  ),
  SubjectMeta(
    subjectId: 'hsc_math_2',
    subjectName: 'উচ্চতর গণিত ২য় পত্র',
    assetPath: 'assets/formulas/hsc_math_2/index.json',
    emoji: '🔢',
    svgIcon: 'assets/dashboard-icons/subject_math.svg',
    gradientColors: [0xFF1E1035, 0xFF2D1550],
  ),
];

const kSscFormulaSubjects = [
  SubjectMeta(
    subjectId: 'ssc_physics',
    subjectName: 'পদার্থবিজ্ঞান',
    assetPath: 'assets/formulas/ssc_physics/index.json',
    emoji: '⚡',
    svgIcon: 'assets/dashboard-icons/subject_physics.svg',
    gradientColors: [0xFF0F172A, 0xFF1E3A5F],
  ),
  SubjectMeta(
    subjectId: 'ssc_chemistry',
    subjectName: 'রসায়ন',
    assetPath: 'assets/formulas/ssc_chemistry/index.json',
    emoji: '🧪',
    svgIcon: 'assets/dashboard-icons/subject_chemistry.svg',
    gradientColors: [0xFF0D2818, 0xFF1B4332],
  ),
  SubjectMeta(
    subjectId: 'ssc_math',
    subjectName: 'সাধারণ গণিত',
    assetPath: 'assets/formulas/ssc_math/index.json',
    emoji: '📐',
    svgIcon: 'assets/dashboard-icons/subject_math.svg',
    gradientColors: [0xFF2D1B69, 0xFF1B1B4B],
  ),
  SubjectMeta(
    subjectId: 'ssc_higher_math',
    subjectName: 'উচ্চতর গণিত',
    assetPath: 'assets/formulas/ssc_higher_math/index.json',
    emoji: '🔢',
    svgIcon: 'assets/dashboard-icons/subject_math.svg',
    gradientColors: [0xFF1E1035, 0xFF2D1550],
  ),
];

List<SubjectMeta> getAllFormulaSubjects() => [
      ...kHscFormulaSubjects,
      ...kSscFormulaSubjects,
    ];

List<SubjectMeta> getFormulaSubjectsForLevel(String level) {
  final l = level.toUpperCase();
  if (l.contains('SSC') || l.contains('Class 10') || l.contains('Class 9')) {
    return kSscFormulaSubjects;
  }
  return kHscFormulaSubjects;
}
