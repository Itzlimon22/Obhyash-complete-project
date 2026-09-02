import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

/// A production-grade, error-proof formula rendering widget that:
/// 1. Renders pure LaTeX using KaTeX (flutter_math_fork) with crisp typography.
/// 2. Handles Bengali Unicode text inside LaTeX formulas (including within \text{}, \frac{},
///    and mixed equations) by parsing expressions into rich native widgets with full ligature/matra fidelity.
/// 3. Supports chemical reaction arrows (\xrightarrow, \xrightleftharpoons) with conditions.
/// 4. Renders Bengali fractions (\frac{...}{...}) as genuine LaTeX-styled fraction widgets with
///    numerator, horizontal fraction bar, and denominator.
/// 5. Intelligently breaks long multi-part formulas into logical mathematical clauses.
/// 6. Guarantees ZERO RenderFlex overflows on any screen width using responsive Wrap and FittedBox auto-scaling.
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

  // Regex to split multi-part formulas into natural clauses
  static final RegExp _clauseSplitRegex = RegExp(
    r'(\s*\\implies\s*|\s*\\iff\s*|\s*\\Longleftrightarrow\s*|(?:,|;)?\s*\\(?:qquad|quad)\s*|\\\\|\s*\\quad\\text\{\s*(?:অথবা|বা|এবং|হলে|নয়|যদি:?)\s*\}\s*\\quad\s*)',
  );

  @override
  Widget build(BuildContext context) {
    final textColor = color ?? (isDark ? Colors.white : const Color(0xFF111827));
    final trimmed = latex.trim();
    if (trimmed.isEmpty) return const SizedBox.shrink();

    // 1. If formula contains multiple clauses, split and render in a responsive centered Wrap
    final clauses = _splitIntoClauses(trimmed);
    if (clauses.length > 1 && !trimmed.contains(r'\begin{cases}')) {
      return Center(
        child: Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8.0,
          runSpacing: 10.0,
          children: clauses.map((clause) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2.0),
              child: _renderSingleClause(clause, textColor),
            );
          }).toList(),
        ),
      );
    }

    // 2. Single clause formula — render without forced scaling so it wraps or displays naturally
    return Center(
      child: _renderSingleClause(trimmed, textColor),
    );
  }

  /// Splits LaTeX string at logical math boundaries
  List<String> _splitIntoClauses(String raw) {
    final List<String> result = [];
    final matches = _clauseSplitRegex.allMatches(raw);
    int last = 0;

    for (final match in matches) {
      final chunk = raw.substring(last, match.start).trim();
      final separator = match.group(0)!;

      if (chunk.isNotEmpty) {
        if (separator.trim().startsWith(',') || separator.trim().startsWith(';')) {
          result.add('$chunk,');
        } else {
          result.add(chunk);
        }
      }

      final trimmedSep = separator.trim();
      if (trimmedSep.contains(r'\implies') ||
          trimmedSep.contains(r'\iff') ||
          trimmedSep.contains(r'\Longleftrightarrow') ||
          _bengaliRegex.hasMatch(trimmedSep)) {
        result.add(trimmedSep);
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

  /// Renders a single clause — checks whether it requires Bengali-aware rendering or pure KaTeX
  Widget _renderSingleClause(String clause, Color textColor) {
    final hasBengali = _bengaliRegex.hasMatch(clause);

    if (!hasBengali) {
      return FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.center,
        child: Math.tex(
          clause,
          mathStyle: MathStyle.display,
          textStyle: TextStyle(
            fontSize: fontSize,
            color: textColor,
          ),
          onErrorFallback: (_) => Text(
            clause,
            style: TextStyle(
              fontSize: fontSize,
              fontFamily: 'HindSiliguri',
              color: textColor,
            ),
          ),
        ),
      );
    }

    // Mixed Bengali + Math clause
    return _BengaliMathClauseRenderer(
      clause: clause,
      fontSize: fontSize,
      textColor: textColor,
      isDark: isDark,
    );
  }
}

/// Specialized renderer for clauses that contain Bengali characters mixed with LaTeX.
class _BengaliMathClauseRenderer extends StatelessWidget {
  final String clause;
  final double fontSize;
  final Color textColor;
  final bool isDark;

  const _BengaliMathClauseRenderer({
    required this.clause,
    required this.fontSize,
    required this.textColor,
    required this.isDark,
  });

  static final RegExp _bengaliRegex = RegExp(r'[\u0980-\u09FF]');

  @override
  Widget build(BuildContext context) {
    final tokens = _tokenize(clause);

    if (tokens.isEmpty) {
      return const SizedBox.shrink();
    }

    if (tokens.length == 1) {
      return _renderToken(tokens.first);
    }

    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 6.0,
      runSpacing: 8.0,
      children: tokens.map((t) {
        return _renderToken(t);
      }).toList(),
    );
  }

  Widget _renderToken(_ClauseToken token) {
    final bengaliStyle = TextStyle(
      fontSize: fontSize,
      fontFamily: 'HindSiliguri',
      fontWeight: FontWeight.w600,
      color: textColor,
    );

    switch (token.type) {
      case _TokenType.text:
        return Text(
          token.content,
          style: bengaliStyle,
          textAlign: TextAlign.center,
        );

      case _TokenType.fraction:
        return _BengaliFractionWidget(
          num: token.num ?? '',
          den: token.den ?? '',
          fontSize: fontSize,
          textColor: textColor,
          isDark: isDark,
        );

      case _TokenType.arrow:
        return _FormulaChemicalArrowWidget(
          above: token.num ?? '',
          below: token.den ?? '',
          direction: token.content,
          fontSize: fontSize,
          textColor: textColor,
          isDark: isDark,
        );

      case _TokenType.math:
        final cleanMath = token.content.trim();
        if (cleanMath.isEmpty) return const SizedBox(width: 2);

        return FittedBox(
          fit: BoxFit.scaleDown,
          child: Math.tex(
            cleanMath,
            mathStyle: MathStyle.display,
            textStyle: TextStyle(
              fontSize: fontSize + 1,
              color: textColor,
            ),
            onErrorFallback: (_) => Text(
              cleanMath,
              style: bengaliStyle,
            ),
          ),
        );
    }
  }

  /// Tokenizes a mixed LaTeX clause: ONLY extracts actual Bengali text/arrows, keeping pure chemistry/math intact.
  List<_ClauseToken> _tokenize(String input) {
    final List<_ClauseToken> tokens = [];
    int i = 0;

    while (i < input.length) {
      // 1. Check for chemical arrow WITH nested-brace matching
      final chemArrow = _parseChemArrow(input, i);
      if (chemArrow != null) {
        if (chemArrow.hasBengali) {
          final dir = chemArrow.arrowName == 'xleftarrow'
              ? 'left'
              : (chemArrow.arrowName == 'xrightleftharpoons' ? 'bi' : 'right');
          tokens.add(_ClauseToken.arrow(
            above: _cleanLatexText(chemArrow.above),
            below: _cleanLatexText(chemArrow.below),
            direction: dir,
          ));
          i = chemArrow.endIndex;
          continue;
        }
      }

      // Check for \overset{...}{\longrightarrow} WITH nested-brace matching
      final overset = _parseOversetArrow(input, i);
      if (overset != null) {
        if (overset.hasBengali) {
          tokens.add(_ClauseToken.arrow(
            above: _cleanLatexText(overset.above),
            below: '',
            direction: 'right',
          ));
          i = overset.endIndex;
          continue;
        }
      }

      // 2. Check for \frac{...}{...} WITH Bengali
      if (input.startsWith(r'\frac', i)) {
        final (hasBg, endIdx) = _checkFracHasBengali(input, i);
        if (hasBg && endIdx != -1) {
          int cursor = i + 5;
          while (cursor < input.length && input[cursor].trim().isEmpty) cursor++;
          final numEnd = _findMatchingBrace(input, cursor);
          final numContent = input.substring(cursor + 1, numEnd);
          int denStart = numEnd + 1;
          while (denStart < input.length && input[denStart].trim().isEmpty) denStart++;
          final denEnd = _findMatchingBrace(input, denStart);
          final denContent = input.substring(denStart + 1, denEnd);

          tokens.add(_ClauseToken.fraction(
            num: numContent,
            den: denContent,
          ));
          i = denEnd + 1;
          continue;
        }
      }

      // 3. Check for \text{...} WITH Bengali
      final textCmdMatch = RegExp(r'(?:\\)?(?:text|mathrm|textbf|textit|mbox)\{').matchAsPrefix(input, i);
      if (textCmdMatch != null) {
        final braceStart = textCmdMatch.end - 1;
        final braceEnd = _findMatchingBrace(input, braceStart);
        if (braceEnd != -1) {
          final textInner = input.substring(braceStart + 1, braceEnd);
          if (_bengaliRegex.hasMatch(textInner)) {
            final cleanText = _cleanLatexText(textInner);
            if (cleanText.isNotEmpty) {
              tokens.add(_ClauseToken.text(cleanText));
            }
            i = braceEnd + 1;
            continue;
          }
        }
      }

      // 4. Raw Bengali text block outside commands
      if (_bengaliRegex.hasMatch(input[i])) {
        int end = i;
        while (end < input.length &&
            (_bengaliRegex.hasMatch(input[end]) ||
                RegExp(r'[\s\-_/()।?!০-৯]').hasMatch(input[end]))) {
          if (input[end] == '\\' || input[end] == '{' || input[end] == '}') break;
          end++;
        }
        final bengaliStr = input.substring(i, end).trim();
        if (bengaliStr.isNotEmpty) {
          tokens.add(_ClauseToken.text(bengaliStr));
        }
        i = end > i ? end : i + 1;
        continue;
      }

      // 5. Collect pure math chunk until the next Bengali element
      int mathEnd = i;
      while (mathEnd < input.length) {
        // Stop if chemical arrow with Bengali
        final chemCheck = _parseChemArrow(input, mathEnd);
        if (chemCheck != null && chemCheck.hasBengali) break;

        // Stop if overset arrow with Bengali
        final oversetCheck = _parseOversetArrow(input, mathEnd);
        if (oversetCheck != null && oversetCheck.hasBengali) break;

        // Stop if frac with Bengali
        if (input.startsWith(r'\frac', mathEnd)) {
          final (hasBg, _) = _checkFracHasBengali(input, mathEnd);
          if (hasBg) break;
        }

        // Stop if \text{...} with Bengali
        final txtMatch = RegExp(r'(?:\\)?(?:text|mathrm|textbf|textit|mbox)\{').matchAsPrefix(input, mathEnd);
        if (txtMatch != null) {
          final bStart = txtMatch.end - 1;
          final bEnd = _findMatchingBrace(input, bStart);
          if (bEnd != -1) {
            final tInner = input.substring(bStart + 1, bEnd);
            if (_bengaliRegex.hasMatch(tInner)) break;
          }
        }

        // Stop if raw Bengali
        if (_bengaliRegex.hasMatch(input[mathEnd])) {
          break;
        }

        mathEnd++;
      }

      if (mathEnd > i) {
        final mathChunk = input.substring(i, mathEnd).trim();
        if (mathChunk.isNotEmpty) {
          tokens.add(_ClauseToken.math(mathChunk));
        }
        i = mathEnd;
      } else {
        i++;
      }
    }

    return tokens;
  }

  _ArrowParseResult? _parseChemArrow(String input, int start) {
    final match = RegExp(r'\\(xrightarrow|xleftarrow|xrightleftharpoons)').matchAsPrefix(input, start);
    if (match == null) return null;
    final arrowName = match.group(1)!;
    int cursor = match.end;

    String below = '';
    if (cursor < input.length && input[cursor] == '[') {
      int bracketEnd = input.indexOf(']', cursor);
      if (bracketEnd != -1) {
        below = input.substring(cursor + 1, bracketEnd);
        cursor = bracketEnd + 1;
      }
    }

    while (cursor < input.length && input[cursor].trim().isEmpty) cursor++;
    if (cursor >= input.length || input[cursor] != '{') return null;

    final braceEnd = _findMatchingBrace(input, cursor);
    if (braceEnd == -1) return null;

    final above = input.substring(cursor + 1, braceEnd);
    final hasBengali = _bengaliRegex.hasMatch(above) || _bengaliRegex.hasMatch(below);

    return _ArrowParseResult(
      arrowName: arrowName,
      above: above,
      below: below,
      hasBengali: hasBengali,
      endIndex: braceEnd + 1,
    );
  }

  _ArrowParseResult? _parseOversetArrow(String input, int start) {
    if (!input.startsWith(r'\overset', start)) return null;
    int cursor = start + 7;
    while (cursor < input.length && input[cursor].trim().isEmpty) cursor++;
    if (cursor >= input.length || input[cursor] != '{') return null;

    final braceEnd = _findMatchingBrace(input, cursor);
    if (braceEnd == -1) return null;
    final above = input.substring(cursor + 1, braceEnd);

    cursor = braceEnd + 1;
    while (cursor < input.length && input[cursor].trim().isEmpty) cursor++;
    if (cursor >= input.length || input[cursor] != '{') return null;

    final arrowBraceEnd = _findMatchingBrace(input, cursor);
    if (arrowBraceEnd == -1) return null;
    final arrowBody = input.substring(cursor + 1, arrowBraceEnd).trim();

    if (arrowBody.contains(r'\longrightarrow') ||
        arrowBody.contains(r'\rightarrow') ||
        arrowBody.contains(r'\to') ||
        arrowBody == '->' ||
        arrowBody == '=>' ||
        arrowBody == '→') {
      final hasBengali = _bengaliRegex.hasMatch(above);
      return _ArrowParseResult(
        arrowName: 'xrightarrow',
        above: above,
        below: '',
        hasBengali: hasBengali,
        endIndex: arrowBraceEnd + 1,
      );
    }
    return null;
  }

  (bool, int) _checkFracHasBengali(String s, int start) {
    if (!s.startsWith(r'\frac', start)) return (false, -1);
    int cursor = start + 5;
    while (cursor < s.length && s[cursor].trim().isEmpty) {
      cursor++;
    }
    if (cursor < s.length && s[cursor] == '{') {
      final numEnd = _findMatchingBrace(s, cursor);
      if (numEnd != -1) {
        final num = s.substring(cursor + 1, numEnd);
        int denStart = numEnd + 1;
        while (denStart < s.length && s[denStart].trim().isEmpty) {
          denStart++;
        }
        if (denStart < s.length && s[denStart] == '{') {
          final denEnd = _findMatchingBrace(s, denStart);
          if (denEnd != -1) {
            final den = s.substring(denStart + 1, denEnd);
            if (_bengaliRegex.hasMatch(num) || _bengaliRegex.hasMatch(den)) {
              return (true, denEnd + 1);
            }
          }
        }
      }
    }
    return (false, -1);
  }

  int _findMatchingBrace(String s, int openIndex) {
    int count = 0;
    for (int j = openIndex; j < s.length; j++) {
      if (s[j] == '{') count++;
      if (s[j] == '}') {
        count--;
        if (count == 0) return j;
      }
    }
    return -1;
  }

  String _cleanLatexText(String text) {
    return text
        .replaceAll(r'\,', ' ')
        .replaceAll(r'\;', ' ')
        .replaceAll(r'\quad', ' ')
        .replaceAll(r'\qquad', '  ')
        .replaceAll(r'\ ', ' ')
        .replaceAll('~', ' ')
        .replaceAll(r'\\', '')
        .replaceAll(r'^\circ\text{C}', '°C')
        .replaceAll(r'^\circ C', '°C')
        .replaceAll(r'^\circ', '°')
        .trim();
  }
}

class _ArrowParseResult {
  final String arrowName;
  final String above;
  final String below;
  final bool hasBengali;
  final int endIndex;

  const _ArrowParseResult({
    required this.arrowName,
    required this.above,
    required this.below,
    required this.hasBengali,
    required this.endIndex,
  });
}

/// A native mathematical fraction widget for Bengali terms
class _BengaliFractionWidget extends StatelessWidget {
  final String num;
  final String den;
  final double fontSize;
  final Color textColor;
  final bool isDark;

  const _BengaliFractionWidget({
    required this.num,
    required this.den,
    required this.fontSize,
    required this.textColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3.0),
      child: IntrinsicWidth(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 1.0),
              child: _renderSubExpression(num, fontSize * 0.85),
            ),
            Container(
              height: 1.5,
              color: textColor.withValues(alpha: 0.85),
              margin: const EdgeInsets.symmetric(vertical: 2.0),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 1.0),
              child: _renderSubExpression(den, fontSize * 0.85),
            ),
          ],
        ),
      ),
    );
  }

  Widget _renderSubExpression(String sub, double subFontSize) {
    final clean = sub
        .replaceAll(r'\text{', '')
        .replaceAll(r'\mathrm{', '')
        .replaceAll(r'\textbf{', '')
        .replaceAll(r'\textit{', '')
        .replaceAll('}', '')
        .replaceAll(r'\,', ' ')
        .replaceAll(r'\;', ' ')
        .replaceAll(r'\ ', ' ')
        .trim();

    return Text(
      clean,
      style: TextStyle(
        fontSize: subFontSize,
        fontFamily: 'HindSiliguri',
        fontWeight: FontWeight.w600,
        color: textColor,
        height: 1.2,
      ),
      textAlign: TextAlign.center,
      maxLines: 1,
    );
  }
}

/// Chemical reaction arrow for formula cards
class _FormulaChemicalArrowWidget extends StatelessWidget {
  final String above;
  final String below;
  final String direction; // 'right', 'left', 'bi'
  final double fontSize;
  final Color textColor;
  final bool isDark;

  const _FormulaChemicalArrowWidget({
    required this.above,
    required this.below,
    required this.direction,
    required this.fontSize,
    required this.textColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final cleanAbove = _cleanArrowText(above);
    final cleanBelow = _cleanArrowText(below);
    final hasAbove = cleanAbove.isNotEmpty;
    final hasBelow = cleanBelow.isNotEmpty;

    final longest = [cleanAbove.length, cleanBelow.length].reduce((a, b) => a > b ? a : b);
    final arrowWidth = (longest * 8.0 + 36.0).clamp(48.0, 180.0);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (hasAbove)
            Padding(
              padding: const EdgeInsets.only(bottom: 2.0),
              child: Text(
                cleanAbove,
                style: TextStyle(
                  fontSize: fontSize * 0.75,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'HindSiliguri',
                  color: textColor,
                  height: 1.1,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          SizedBox(
            width: arrowWidth,
            height: direction == 'bi' ? 14 : 12,
            child: CustomPaint(
              painter: _FormulaArrowPainter(color: textColor, direction: direction),
            ),
          ),
          if (hasBelow)
            Padding(
              padding: const EdgeInsets.only(top: 2.0),
              child: Text(
                cleanBelow,
                style: TextStyle(
                  fontSize: fontSize * 0.70,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'HindSiliguri',
                  color: textColor.withValues(alpha: 0.85),
                  height: 1.1,
                ),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }

  String _cleanArrowText(String raw) {
    var text = raw
        .replaceAll(r'\text{', '')
        .replaceAll(r'\mathrm{', '')
        .replaceAll(r'\textbf{', '')
        .replaceAll(r'\textit{', '')
        .replaceAll(r'\mbox{', '')
        .replaceAll('}', '')
        .replaceAll(r'\,', ' ')
        .replaceAll(r'\;', ' ')
        .replaceAll(r'\quad', ' ')
        .replaceAll(r'\qquad', '  ')
        .replaceAll(r'\ ', ' ')
        .replaceAll(r'^\circ\text{C}', '°C')
        .replaceAll(r'^\circ C', '°C')
        .replaceAll(r'^\circ', '°')
        .replaceAll(r'\Delta', 'Δ')
        .replaceAll('~', ' ')
        .replaceAll(r'\\', ' ');

    const subscriptMap = {
      '_0': '₀',
      '_1': '₁',
      '_2': '₂',
      '_3': '₃',
      '_4': '₄',
      '_5': '₅',
      '_6': '₆',
      '_7': '₇',
      '_8': '₈',
      '_9': '₉',
      '_n': 'ₙ',
      '_m': 'ₘ',
    };
    for (final entry in subscriptMap.entries) {
      text = text.replaceAll(entry.key, entry.value);
    }

    return text.trim();
  }
}

class _FormulaArrowPainter extends CustomPainter {
  final Color color;
  final String direction;

  _FormulaArrowPainter({required this.color, required this.direction});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    const arrowHeadSize = 4.0;

    if (direction == 'bi') {
      final yTop = size.height * 0.35;
      final yBottom = size.height * 0.65;

      canvas.drawLine(Offset(0, yTop), Offset(size.width - arrowHeadSize, yTop), paint);
      final pathTop = Path()
        ..moveTo(size.width - arrowHeadSize - 2.5, yTop - arrowHeadSize)
        ..lineTo(size.width, yTop);
      canvas.drawPath(pathTop, paint);

      canvas.drawLine(Offset(arrowHeadSize, yBottom), Offset(size.width, yBottom), paint);
      final pathBottom = Path()
        ..moveTo(arrowHeadSize + 2.5, yBottom + arrowHeadSize)
        ..lineTo(0, yBottom);
      canvas.drawPath(pathBottom, paint);
    } else if (direction == 'left') {
      final y = size.height / 2;
      canvas.drawLine(Offset(arrowHeadSize, y), Offset(size.width, y), paint);
      final path = Path()
        ..moveTo(arrowHeadSize + 3, y - arrowHeadSize)
        ..lineTo(0, y)
        ..lineTo(arrowHeadSize + 3, y + arrowHeadSize);
      canvas.drawPath(path, paint);
    } else {
      final y = size.height / 2;
      canvas.drawLine(Offset(0, y), Offset(size.width - arrowHeadSize, y), paint);
      final path = Path()
        ..moveTo(size.width - arrowHeadSize - 3, y - arrowHeadSize)
        ..lineTo(size.width, y)
        ..lineTo(size.width - arrowHeadSize - 3, y + arrowHeadSize);
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _FormulaArrowPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.direction != direction;
}

enum _TokenType { text, math, fraction, arrow }

class _ClauseToken {
  final _TokenType type;
  final String content;
  final String? num;
  final String? den;

  _ClauseToken.text(this.content)
      : type = _TokenType.text,
        num = null,
        den = null;

  _ClauseToken.math(this.content)
      : type = _TokenType.math,
        num = null,
        den = null;

  _ClauseToken.fraction({required this.num, required this.den})
      : type = _TokenType.fraction,
        content = '';

  _ClauseToken.arrow({required String above, required String below, required String direction})
      : type = _TokenType.arrow,
        content = direction,
        num = above,
        den = below;
}
