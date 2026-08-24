import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/formula_models.dart';
import '../../utils/formula_practice_generator.dart';
import '../../../../core/presentation/widgets/formula_math_view.dart';
import '../../../../core/presentation/widgets/latex_text.dart';

class FormulaPracticeSheet extends StatefulWidget {
  final FormulaEntry formula;
  final String? chapterName;
  final String? serialNumber;

  const FormulaPracticeSheet({
    super.key,
    required this.formula,
    this.chapterName,
    this.serialNumber,
  });

  static void show(
    BuildContext context, {
    required FormulaEntry formula,
    String? chapterName,
    String? serialNumber,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FormulaPracticeSheet(
        formula: formula,
        chapterName: chapterName,
        serialNumber: serialNumber,
      ),
    );
  }

  @override
  State<FormulaPracticeSheet> createState() => _FormulaPracticeSheetState();
}

class _FormulaPracticeSheetState extends State<FormulaPracticeSheet> {
  bool _showAnswer = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final questions = FormulaPracticeGenerator.resolvePracticeQuestions(widget.formula);
    final practice = questions.isNotEmpty ? questions.first : const FormulaPracticeQuestion(question: '', answer: '');

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF101216) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // 1. Drag Handle
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 44,
              height: 4.5,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // 2. Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    LucideIcons.fileText,
                    size: 18,
                    color: Color(0xFF059669),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (widget.serialNumber != null)
                            Text(
                              'সূত্র ${widget.serialNumber} • ',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: Color(0xFF059669),
                              ),
                            ),
                          const Text(
                            'বুয়েট ও লিখিত প্র্যাকটিস',
                            style: TextStyle(
                              fontSize: 13,
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
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(
                    LucideIcons.x,
                    size: 20,
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 20),

          // 3. Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Formula Reference Banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF181B22) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? const Color(0xFF2E3545) : const Color(0xFFCBD5E1),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              LucideIcons.bookmark,
                              size: 13,
                              color: isDark ? Colors.white70 : const Color(0xFF475569),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'প্রযুক্ত সূত্র (Formula Reference):',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? Colors.white70 : const Color(0xFF475569),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Center(
                          child: FormulaMathView(
                            latex: widget.formula.latex,
                            isDark: isDark,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),



                  // Question Statement (BUET CQ Type)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF14171E) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? const Color(0xFF242A38) : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'সমস্যা (Problem Statement):',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white60 : Colors.black54,
                          ),
                        ),
                        const SizedBox(height: 8),
                        LatexText(
                          text: practice.question,
                          style: TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            height: 1.55,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Show Answer Button / Card
                  if (!_showAnswer)
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          setState(() {
                            _showAnswer = true;
                          });
                        },
                        icon: const Icon(LucideIcons.eye, size: 16, color: Color(0xFF059669)),
                        label: const Text(
                          'উত্তর দেখুন (Show Answer)',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: Color(0xFF059669),
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: Color(0xFF059669), width: 1.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    )
                  else ...[
                    // Revealed Answer Card (Final Answer only, no verbose solution)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669).withValues(alpha: isDark ? 0.15 : 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFF059669).withValues(alpha: 0.4),
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                LucideIcons.checkCircle2,
                                size: 18,
                                color: Color(0xFF059669),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'চূড়ান্ত উত্তর (Final Answer):',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: Color(0xFF059669),
                                ),
                              ),
                              const Spacer(),
                              InkWell(
                                onTap: () {
                                  setState(() {
                                    _showAnswer = false;
                                  });
                                },
                                child: Text(
                                  'লুকান',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? Colors.white60 : Colors.black54,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          LatexText(
                            text: practice.answer,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  // Close Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'সম্পন্ন (Close)',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
