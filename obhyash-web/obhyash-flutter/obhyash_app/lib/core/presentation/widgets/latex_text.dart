import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

class LatexText extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const LatexText({super.key, required this.text, this.style});

  @override
  Widget build(BuildContext context) {
    // A simple regex to split the string into plain text and math parts.
    // Assuming math is wrapped in single \$ ... \$ or double \$\$ ... \$\$
    final RegExp regex = RegExp(r'(\$\$.*?\$\$|\$.*?\$)', dotAll: true);
    final Iterable<RegExpMatch> matches = regex.allMatches(text);

    if (matches.isEmpty) {
      return Text(text, style: style);
    }

    List<InlineSpan> spans = [];
    int cursor = 0;

    for (final match in matches) {
      // Add text before the math
      if (match.start > cursor) {
        final plainText = text.substring(cursor, match.start);
        spans.add(TextSpan(text: plainText, style: style));
      }

      // Add math
      String mathText = match.group(0)!;
      bool isDisplay = false;

      if (mathText.startsWith('\$\$') && mathText.endsWith('\$\$')) {
        isDisplay = true;
        mathText = mathText.substring(2, mathText.length - 2);
      } else if (mathText.startsWith('\$') && mathText.endsWith('\$')) {
        mathText = mathText.substring(1, mathText.length - 1);
      }

      spans.add(
        WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: DefaultTextStyle(
            style: style ?? const TextStyle(),
            child: Math.tex(
              mathText,
              mathStyle: isDisplay ? MathStyle.display : MathStyle.text,
              textStyle: style,
            ),
          ),
        ),
      );

      cursor = match.end;
    }

    // Add any remaining text
    if (cursor < text.length) {
      spans.add(TextSpan(text: text.substring(cursor), style: style));
    }

    return RichText(text: TextSpan(children: spans));
  }
}
