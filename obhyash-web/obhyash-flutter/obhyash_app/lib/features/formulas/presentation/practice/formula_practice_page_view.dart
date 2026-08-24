import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/formula_models.dart';
import '../../utils/formula_practice_generator.dart';
import '../../../../core/presentation/widgets/formula_math_view.dart';
import '../../../../core/presentation/widgets/latex_text.dart';

class FormulaPracticePageView extends StatefulWidget {
  final FormulaEntry formula;
  final String? chapterName;
  final String? serialNumber;

  const FormulaPracticePageView({
    super.key,
    required this.formula,
    this.chapterName,
    this.serialNumber,
  });

  @override
  State<FormulaPracticePageView> createState() => _FormulaPracticePageViewState();
}

class _FormulaPracticePageViewState extends State<FormulaPracticePageView> {
  // Track revealed answers per question index
  final Set<int> _revealedIndices = {};

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final questions = FormulaPracticeGenerator.resolvePracticeQuestions(widget.formula);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF090A0C) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF101216) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (widget.serialNumber != null)
                  Text(
                    'সূত্র ${widget.serialNumber} • ',
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'HindSiliguri',
                      color: Color(0xFF059669),
                    ),
                  ),
                const Text(
                  'অনুশীলন প্রশ্নমালা',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'HindSiliguri',
                    color: Color(0xFF059669),
                  ),
                ),
              ],
            ),
            Text(
              widget.formula.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 36),
        children: [
          // 1. Top Formula Reference Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF13161C) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isDark ? const Color(0xFF262C3A) : const Color(0xFFE2E8F0),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        LucideIcons.bookmark,
                        size: 14,
                        color: Color(0xFF059669),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'প্রযুক্ত মূল সূত্র:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white70 : const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Center(
                  child: FormulaMathView(
                    latex: widget.formula.latex,
                    isDark: isDark,
                    fontSize: 17,
                  ),
                ),
                if (widget.formula.description.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  LatexText(
                    text: widget.formula.description,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white60 : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 2. Section Title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Row(
              children: [
                Container(
                  width: 4,
                  height: 18,
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'ধারাবাহিক প্রশ্নসমূহ (${questions.length}টি)',
                  style: TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 3. Serial Question Cards
          ...List.generate(questions.length, (index) {
            final q = questions[index];
            final isRevealed = _revealedIndices.contains(index);

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF13161C) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? const Color(0xFF242A38) : const Color(0xFFE2E8F0),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Question Serial Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E2430) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isDark ? const Color(0xFF333D50) : const Color(0xFFCBD5E1),
                      ),
                    ),
                    child: Text(
                      'প্রশ্ন ${index + 1}',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Problem Statement (Latex + Bengali)
                  LatexText(
                    text: q.question,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      height: 1.55,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Show / Hide Answer Action
                  if (!isRevealed)
                    InkWell(
                      onTap: () {
                        setState(() {
                          _revealedIndices.add(index);
                        });
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669).withValues(alpha: isDark ? 0.12 : 0.08),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0xFF059669).withValues(alpha: 0.3),
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.eye, size: 14, color: Color(0xFF059669)),
                            SizedBox(width: 6),
                            Text(
                              'উত্তর দেখুন (Show Answer)',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: Color(0xFF059669),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else ...[
                    // Revealed Answer Card (Final Answer only)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669).withValues(alpha: isDark ? 0.15 : 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFF059669).withValues(alpha: 0.4),
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            LucideIcons.checkCircle2,
                            size: 16,
                            color: Color(0xFF059669),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: LatexText(
                              text: q.answer,
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          InkWell(
                            onTap: () {
                              setState(() {
                                _revealedIndices.remove(index);
                              });
                            },
                            child: Text(
                              'লুকান',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? Colors.white60 : Colors.black45,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
