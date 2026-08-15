class FormulaEntry {
  final String title;
  final String latex;
  final String description;

  const FormulaEntry({
    required this.title,
    required this.latex,
    required this.description,
  });

  factory FormulaEntry.fromJson(Map<String, dynamic> json) => FormulaEntry(
        title: json['title'] as String,
        latex: json['latex'] as String,
        description: json['description'] as String,
      );
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
  final List<int> gradientColors;

  const SubjectMeta({
    required this.subjectId,
    required this.subjectName,
    required this.assetPath,
    required this.emoji,
    required this.gradientColors,
  });
}

const kHscFormulaSubjects = [
  SubjectMeta(
    subjectId: 'hsc_physics_1',
    subjectName: 'পদার্থবিজ্ঞান ১ম পত্র',
    assetPath: 'assets/formulas/hsc_physics_1/index.json',
    emoji: '⚡',
    gradientColors: [0xFF0F172A, 0xFF1E3A5F],
  ),
  SubjectMeta(
    subjectId: 'hsc_physics_2',
    subjectName: 'পদার্থবিজ্ঞান ২য় পত্র',
    assetPath: 'assets/formulas/hsc_physics_2/index.json',
    emoji: '🔋',
    gradientColors: [0xFF0F1A2E, 0xFF1E4080],
  ),
  SubjectMeta(
    subjectId: 'hsc_chemistry_1',
    subjectName: 'রসায়ন ১ম পত্র',
    assetPath: 'assets/formulas/hsc_chemistry_1/index.json',
    emoji: '🧪',
    gradientColors: [0xFF1A0F2E, 0xFF3D1A78],
  ),
  SubjectMeta(
    subjectId: 'hsc_chemistry_2',
    subjectName: 'রসায়ন ২য় পত্র',
    assetPath: 'assets/formulas/hsc_chemistry_2/index.json',
    emoji: '⚗️',
    gradientColors: [0xFF200A2E, 0xFF5B1A8C],
  ),
  SubjectMeta(
    subjectId: 'hsc_math_1',
    subjectName: 'উচ্চতর গণিত ১ম পত্র',
    assetPath: 'assets/formulas/hsc_math_1/index.json',
    emoji: '∑',
    gradientColors: [0xFF0F2818, 0xFF065F46],
  ),
  SubjectMeta(
    subjectId: 'hsc_math_2',
    subjectName: 'উচ্চতর গণিত ২য় পত্র',
    assetPath: 'assets/formulas/hsc_math_2/index.json',
    emoji: '∫',
    gradientColors: [0xFF0A2010, 0xFF047857],
  ),
  SubjectMeta(
    subjectId: 'hsc_biology_1',
    subjectName: 'জীববিজ্ঞান ১ম পত্র',
    assetPath: 'assets/formulas/hsc_biology_1/index.json',
    emoji: '🌿',
    gradientColors: [0xFF0F1A0A, 0xFF166534],
  ),
  SubjectMeta(
    subjectId: 'hsc_biology_2',
    subjectName: 'জীববিজ্ঞান ২য় পত্র',
    assetPath: 'assets/formulas/hsc_biology_2/index.json',
    emoji: '🧬',
    gradientColors: [0xFF1A0F10, 0xFF991B1B],
  ),
  SubjectMeta(
    subjectId: 'hsc_ict',
    subjectName: 'তথ্য ও যোগাযোগ প্রযুক্তি',
    assetPath: 'assets/formulas/hsc_ict/index.json',
    emoji: '💻',
    gradientColors: [0xFF0A1A1A, 0xFF0E7490],
  ),
];

const kSscFormulaSubjects = [
  SubjectMeta(
    subjectId: 'ssc_physics',
    subjectName: 'পদার্থবিজ্ঞান',
    assetPath: 'assets/formulas/ssc_physics/index.json',
    emoji: '⚡',
    gradientColors: [0xFF0F172A, 0xFF1E3A5F],
  ),
  SubjectMeta(
    subjectId: 'ssc_chemistry',
    subjectName: 'রসায়ন',
    assetPath: 'assets/formulas/ssc_chemistry/index.json',
    emoji: '🧪',
    gradientColors: [0xFF1A0F2E, 0xFF3D1A78],
  ),
  SubjectMeta(
    subjectId: 'ssc_math',
    subjectName: 'সাধারণ গণিত',
    assetPath: 'assets/formulas/ssc_math/index.json',
    emoji: '∑',
    gradientColors: [0xFF0F2818, 0xFF065F46],
  ),
  SubjectMeta(
    subjectId: 'ssc_higher_math',
    subjectName: 'উচ্চতর গণিত',
    assetPath: 'assets/formulas/ssc_higher_math/index.json',
    emoji: '∫',
    gradientColors: [0xFF0A2010, 0xFF047857],
  ),
  SubjectMeta(
    subjectId: 'ssc_biology',
    subjectName: 'জীববিজ্ঞান',
    assetPath: 'assets/formulas/ssc_biology/index.json',
    emoji: '🌿',
    gradientColors: [0xFF0F1A0A, 0xFF166534],
  ),
];

List<SubjectMeta> getFormulaSubjectsForLevel(String level) {
  if (level.toUpperCase() == 'SSC') {
    return kSscFormulaSubjects;
  }
  return kHscFormulaSubjects;
}

List<SubjectMeta> getAllFormulaSubjects() {
  return [...kSscFormulaSubjects, ...kHscFormulaSubjects];
}
