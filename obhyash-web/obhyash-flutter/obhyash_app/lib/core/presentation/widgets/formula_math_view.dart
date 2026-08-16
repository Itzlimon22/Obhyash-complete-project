import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

/// A responsive formula rendering widget that:
/// 1. Prevents Bengali text from breaking into disconnected matras/dotted circles.
/// 2. Allows multi-part and long formulas to naturally wrap onto multiple lines
///    using a centered [Wrap] layout, so the user can view the entire equation
///    at a glance without forced horizontal scrolling.
/// 3. Safely scales down extra-wide single terms using [FittedBox] so nothing overflows.
class FormulaMathView extends StatelessWidget {
  final String latex;
  final bool isDark;
  final double fontSize;
  final Color? color;

  const FormulaMathView({
    super.key,
    required this.latex,
    required this.isDark,
    this.fontSize = 18.5,
    this.color,
  });

  static final RegExp _bengaliRegex = RegExp(r'[\u0980-\u09FF]');

  // Regex to match \text{...}, \mathrm{...}, \textbf{...}, \textit{...}
  static final RegExp _textCmdRegex = RegExp(
    r'^\\(?:text|mathrm|textbf|textit)\{([\s\S]*)\}$',
  );

  // Regex to split on \text{...} or raw Bengali text blocks
  static final RegExp _splitRegex = RegExp(
    r'(\\(?:text|mathrm|textbf|textit)\{[^}]*\}|[\u0980-\u09FF][\u0980-\u09FF\s\-_/()।?!০-৯]*[\u0980-\u09FF০-৯]|[\u0980-\u09FF])',
  );

  // Clause separator regex for multi-part pure LaTeX formulas (e.g. "A, \quad B" or "A \quad B")
  static final RegExp _clauseSplitRegex = RegExp(
    r'((?:,|;)?\s*\\(?:qquad|quad)\s*|\\\\)',
  );

  @override
  Widget build(BuildContext context) {
    final textColor = color ?? (isDark ? Colors.white : const Color(0xFF111827));
    final defaultBengaliStyle = TextStyle(
      fontSize: fontSize - 1,
      fontFamily: 'HindSiliguri',
      fontWeight: FontWeight.w600,
      color: textColor,
    );

    final containsBengali = _bengaliRegex.hasMatch(latex);

    // Case A: Mixed Bengali + Math formula
    if (containsBengali) {
      final segments = _parseMixedSegments(latex);

      return Center(
        child: Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 6.0,
          runSpacing: 10.0,
          children: segments.map((seg) {
            if (seg.isText) {
              return Text(
                seg.content,
                style: defaultBengaliStyle,
                textAlign: TextAlign.center,
              );
            } else {
              final cleanMath = seg.content.trim();
              if (cleanMath.isEmpty) {
                return const SizedBox(width: 4);
              }

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2.0),
                child: Math.tex(
                  cleanMath,
                  mathStyle: MathStyle.text,
                  textStyle: TextStyle(
                    fontSize: fontSize + 1,
                    color: textColor,
                  ),
                  onErrorFallback: (_) => Text(
                    cleanMath,
                    style: TextStyle(
                      fontSize: fontSize,
                      color: textColor,
                    ),
                  ),
                ),
              );
            }
          }).toList(),
        ),
      );
    }

    // Case B: Pure LaTeX containing multiple clauses (e.g. with \quad or , \quad or \\)
    if (_clauseSplitRegex.hasMatch(latex) && !latex.contains(r'\begin{cases}')) {
      final clauses = _splitPureLatexClauses(latex);
      if (clauses.length > 1) {
        return Center(
          child: Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12.0,
            runSpacing: 10.0,
            children: clauses.map((clause) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2.0),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Math.tex(
                    clause,
                    mathStyle: MathStyle.display,
                    textStyle: TextStyle(
                      fontSize: fontSize + 2,
                      color: textColor,
                    ),
                    onErrorFallback: (_) => Text(
                      clause,
                      style: TextStyle(fontSize: fontSize, color: textColor),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        );
      }
    }

    // Case C: Single pure LaTeX formula — scale down if needed so whole equation fits
    return Center(
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Math.tex(
          latex,
          mathStyle: MathStyle.display,
          textStyle: TextStyle(
            fontSize: fontSize + 2,
            color: textColor,
          ),
          onErrorFallback: (err) => SelectableText(
            latex,
            style: TextStyle(
              fontSize: 16,
              fontFamily: 'monospace',
              color: isDark ? Colors.white70 : Colors.black87,
            ),
          ),
        ),
      ),
    );
  }

  /// Splits mixed formula into text and math segments
  List<_FormulaSegment> _parseMixedSegments(String raw) {
    // 1. Normalize fractions containing Bengali text to prevent broken \frac{ syntax
    final normalized = raw.replaceAllMapped(
      RegExp(r'\\frac\{([^}]*)\}\{([^}]*)\}'),
      (m) {
        final num = m.group(1)!;
        final den = m.group(2)!;
        if (_bengaliRegex.hasMatch(num) || _bengaliRegex.hasMatch(den)) {
          final cleanNum = num.replaceAll(
            RegExp(r'\\(?:text|mathrm|textbf|textit)\{([^}]*)\}'),
            r'$1',
          );
          final cleanDen = den.replaceAll(
            RegExp(r'\\(?:text|mathrm|textbf|textit)\{([^}]*)\}'),
            r'$1',
          );
          return '$cleanNum / $cleanDen';
        }
        return m.group(0)!;
      },
    );

    final List<_FormulaSegment> segments = [];
    int last = 0;

    for (final match in _splitRegex.allMatches(normalized)) {
      if (match.start > last) {
        final mathChunk = normalized.substring(last, match.start);
        if (mathChunk.isNotEmpty) {
          _appendMathChunk(segments, mathChunk);
        }
      }

      final matched = match.group(0)!;
      final textCmdMatch = _textCmdRegex.firstMatch(matched);
      final textValue = textCmdMatch != null ? textCmdMatch.group(1)! : matched;

      segments.add(_FormulaSegment.text(textValue));
      last = match.end;
    }

    if (last < normalized.length) {
      final mathChunk = normalized.substring(last);
      if (mathChunk.isNotEmpty) {
        _appendMathChunk(segments, mathChunk);
      }
    }

    return segments;
  }

  void _appendMathChunk(List<_FormulaSegment> segments, String chunk) {
    // If math chunk contains multiple sub-clauses like `, \quad x`, break at commas
    final subParts = chunk.split(RegExp(r'(?<=\,)\s*\\(?:qquad|quad)\s*'));
    for (int i = 0; i < subParts.length; i++) {
      final part = subParts[i].replaceAll(r'\quad', ' ').replaceAll(r'\qquad', '  ');
      if (part.trim().isNotEmpty) {
        segments.add(_FormulaSegment.math(part));
      }
    }
  }

  /// Splits pure LaTeX string at `\quad` or `,\quad` into clean separate clauses
  List<String> _splitPureLatexClauses(String raw) {
    final List<String> result = [];
    final matches = _clauseSplitRegex.allMatches(raw);
    int last = 0;

    for (final match in matches) {
      final chunk = raw.substring(last, match.start).trim();
      if (chunk.isNotEmpty) {
        // If the separator has a comma/semicolon at start, attach to current chunk
        final sep = match.group(0)!;
        if (sep.startsWith(',') || sep.startsWith(';')) {
          result.add('$chunk${sep.substring(0, 1)}');
        } else {
          result.add(chunk);
        }
      }
      last = match.end;
    }

    if (last < raw.length) {
      final chunk = raw.substring(last).trim();
      if (chunk.isNotEmpty) {
        result.add(chunk);
      }
    }

    return result.isEmpty ? [raw] : result;
  }
}

class _FormulaSegment {
  final String content;
  final bool isText;

  _FormulaSegment.math(this.content) : isText = false;
  _FormulaSegment.text(this.content) : isText = true;
}
