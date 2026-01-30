import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

class LatexText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign textAlign;

  const LatexText({
    super.key,
    required this.text,
    this.style,
    this.textAlign = TextAlign.start,
  });

  @override
  Widget build(BuildContext context) {
    // 1. Check if the text actually contains LaTeX delimiters
    // Common delimiters: \( ... \) or $ ... $ or $$ ... $$
    final bool hasLatex =
        text.contains(r'\(') || text.contains(r'$$') || text.contains(r'$');

    if (!hasLatex) {
      return Text(text, style: style, textAlign: textAlign);
    }

    // 2. If it has LaTeX, parse it (Simple splitting for mixed text/math)
    // Note: For complex nested LaTeX, a robust parser is needed.
    // This simple splitter handles "Text \( math \) Text" format.
    List<Widget> spans = [];
    final regex = RegExp(r'(\\\(.*?\\\)|\\\[.*?\\\]|\$.*?\$|[^$]+)');

    text.splitMapJoin(
      regex,
      onMatch: (Match m) {
        String match = m.group(0)!;
        match = match.trim();

        if (match.startsWith(r'\(') || match.startsWith(r'\[')) {
          // Inline Math: \( ... \)
          String cleanMath = match
              .replaceAll(r'\(', '')
              .replaceAll(r'\)', '')
              .replaceAll(r'\[', '')
              .replaceAll(r'\]', '');
          spans.add(
            Math.tex(cleanMath, textStyle: style, mathStyle: MathStyle.text),
          );
        } else if (match.startsWith(r'$') && match.endsWith(r'$')) {
          // Inline Math: $ ... $
          String cleanMath = match.replaceAll(r'$', '');
          spans.add(
            Math.tex(cleanMath, textStyle: style, mathStyle: MathStyle.text),
          );
        } else {
          // Regular Text
          spans.add(Text(match, style: style));
        }
        return '';
      },
      onNonMatch: (String s) {
        if (s.isNotEmpty) spans.add(Text(s, style: style));
        return '';
      },
    );

    return Wrap(
      alignment: textAlign == TextAlign.center
          ? WrapAlignment.center
          : WrapAlignment.start,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: spans,
    );
  }
}
