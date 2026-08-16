import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:markdown/markdown.dart' as md;

// ─────────────────────────────────────────────────────────────────────────────
// PREPROCESSING  (mirrors the web app's MathRenderer preprocessing pipeline)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// PREPROCESSING  (mirrors the web app's MathRenderer preprocessing pipeline)
// ─────────────────────────────────────────────────────────────────────────────

String _unwrapBengaliMathContent(String inner) {
  String clean = inner;

  // 1. Un-escape \text{...}, \mathrm{...}, \textbf{...}, \textit{...}
  clean = clean.replaceAllMapped(
    RegExp(r'\\(?:text|mathrm|textbf|textit)\{([^}]*)\}'),
    (m) => m.group(1)!,
  );

  // 2. Un-escape LaTeX spacing commands
  clean = clean
      .replaceAll(r'\,', ' ')
      .replaceAll(r'\;', ' ')
      .replaceAll(r'\quad', ' ')
      .replaceAll(r'\qquad', ' ')
      .replaceAll(r'\ ', ' ')
      .replaceAll('~', ' ');

  // 3. Re-wrap math constructs within this mixed text
  final tokenRegex = RegExp(
    r'(\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\[\]]*\])*|[a-zA-Z0-9]+(?:\^|\_)\{?[a-zA-Z0-9\-\+]+\}?)',
  );

  clean = clean.replaceAllMapped(tokenRegex, (m) {
    final token = m.group(0)!;
    return '\$$token\$';
  });

  return clean;
}

String _cleanIntraSentenceNewlines(String text) {
  const placeholder = '___DBL_NL___';
  text = text.replaceAll(RegExp(r'\r\n|\r'), '\n');
  // Preserve intentional double newlines (paragraphs)
  text = text.replaceAll(RegExp(r'\n\s*\n+'), placeholder);

  final lines = text.split('\n');
  if (lines.length <= 1) {
    return text.replaceAll(placeholder, '\n\n');
  }

  final buffer = StringBuffer();
  for (int i = 0; i < lines.length; i++) {
    final line = lines[i].trim();
    if (line.isEmpty) continue;

    if (buffer.isEmpty) {
      buffer.write(line);
      continue;
    }

    // Check if the line is an intentional list item or section header
    final isListItem = RegExp(
      r'^(?:\([iIvVxX0-9a-zA-Z\u0980-\u09fa]+\)|[iIvVxX0-9a-zA-Z\u0980-\u09fa]+[\.\)]|\-|\*|\#|নিচের|উদ্দীপক)',
    ).hasMatch(line);

    // Check if line starts with punctuation that should attach to previous word
    final isPunctuation = RegExp(r'^[।,\.\?\!:\;]').hasMatch(line);

    if (isListItem) {
      buffer.write('\n');
      buffer.write(line);
    } else if (isPunctuation) {
      buffer.write(line);
    } else {
      buffer.write(' ');
      buffer.write(line);
    }
  }

  return buffer.toString().replaceAll(placeholder, '\n\n');
}

final Map<String, String> _preprocessCache = {};
const int _kMaxPreprocessCache = 600;

String _preprocess(String text) {
  final cached = _preprocessCache[text];
  if (cached != null) return cached;

  // 1. Normalise literal \n and carriage returns
  var processedText = text.replaceAll(r'\n', '\n').replaceAll(RegExp(r'\r\n|\r'), '\n');

  // 2. Convert inline $$...$$ (short, single-line) into inline $...$
  // In many question datasets, $23\text{ m}$ is authored as $$23\text{ m}$$ which forces a block break.
  processedText = processedText.replaceAllMapped(
    RegExp(r'\$\$([^\n]{1,80}?)\$\$'),
    (m) {
      final inner = m.group(1)!.trim();
      // If it contains newline or is a long complex equation, keep it as display math
      if (inner.contains('\n') || inner.length > 80) {
        return '\$\$$inner\$\$';
      }
      return '\$$inner\$';
    },
  );

  // 3. Clean intra-sentence accidental newlines across the entire text
  processedText = _cleanIntraSentenceNewlines(processedText);

  // 4. Split into math blocks ($$...$$ or $...$) and non-math segments
  final mathPattern = RegExp(r'(\$\$[\s\S]*?\$\$|\$(?!\$)[^\n]*?\$)');
  final parts = <String>[];
  int lastIndex = 0;

  for (final match in mathPattern.allMatches(processedText)) {
    if (match.start > lastIndex) {
      parts.add(processedText.substring(lastIndex, match.start));
    }
    parts.add(match.group(0)!);
    lastIndex = match.end;
  }
  if (lastIndex < processedText.length) {
    parts.add(processedText.substring(lastIndex));
  }

  // 5. Process each segment safely
  final processedParts = parts.map((part) {
    if (part.startsWith(r'$')) {
      final isDisplay = part.startsWith(r'$$');
      final inner = isDisplay
          ? part.substring(2, part.length - 2)
          : part.substring(1, part.length - 1);

      // Unescape double backslashes inside math
      String cleanInner = inner.replaceAllMapped(
        RegExp(r'\\\\([a-zA-Z{])'),
        (m) => '\\${m.group(1)}',
      );

      // If the math block does NOT contain Bengali characters, keep it as pure intact LaTeX
      if (!RegExp(r'[\u0980-\u09FF]').hasMatch(cleanInner)) {
        return isDisplay ? '\$\$$cleanInner\$\$' : '\$$cleanInner\$';
      }

      // If it contains Bengali text, unwrap the Bengali words
      return _unwrapBengaliMathContent(cleanInner);
    }

    // It's a Non-Math Text Segment
    String t = part;

    // Check if the segment is an un-delimited LaTeX formula or algebraic expression
    final trimmed = t.trim();
    final hasNoBengali = !RegExp(r'[\u0980-\u09FF]').hasMatch(trimmed);
    final hasLatexCmd = trimmed.contains(r'\') && RegExp(r'\\[a-zA-Z]+').hasMatch(trimmed);
    final hasMathExpr = RegExp(r'[a-zA-Z0-9]+(?:\^|\_)\{?[a-zA-Z0-9\-\+]+\}?').hasMatch(trimmed);

    if (hasNoBengali && trimmed.isNotEmpty && (hasLatexCmd || (hasMathExpr && trimmed.contains(RegExp(r'[=+\-*/<>()]'))))) {
      return '\$$trimmed\$';
    }

    // Normalize isolated superscripts like ms^-1 or ms^{-1}
    t = t.replaceAllMapped(
      RegExp(r'\b([a-zA-Z0-9]+)\^(-?[0-9]+)\b'),
      (m) => '\$${m.group(1)}^{${m.group(2)}}\$',
    );
    t = t.replaceAllMapped(
      RegExp(r'\b([a-zA-Z0-9]+)\^\{(-?[0-9a-zA-Z]+)\}\b'),
      (m) => '\$${m.group(1)}^{${m.group(2)}}\$',
    );

    // Roman-numeral list items "i. " → "\ni. "
    t = t.replaceAllMapped(
      RegExp(r'(?:\s+|^|-)(i|ii|iii|iv|v)\.\s+', caseSensitive: false),
      (m) => '\n${m.group(1)}. ',
    );

    // Parenthetical roman numerals "(i) " → "\n(i) "
    t = t.replaceAllMapped(
      RegExp(r'(?:\s+|^|-)\((i|ii|iii|iv|v)\)\s+', caseSensitive: false),
      (m) => '\n(${m.group(1)}) ',
    );

    // Common Bangla question tail
    t = t.replaceAll(
      RegExp(r'(?:\s+|^)নিচের কোনটি সঠিক\?'),
      '\n\nনিচের কোনটি সঠিক?',
    );

    return t;
  }).toList();

  final result = processedParts.join('');

  if (_preprocessCache.length >= _kMaxPreprocessCache) {
    _preprocessCache.clear();
  }
  _preprocessCache[text] = result;

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATH INLINE-SYNTAX EXTENSION
// Teaches the markdown parser to recognise $...$ and $$...$$ as math spans.
// ─────────────────────────────────────────────────────────────────────────────

const _kInlineMath = 'inline-math';
const _kDisplayMath = 'display-math';

class _MathElement extends md.Element {
  _MathElement.inline(String latex) : super(_kInlineMath, [md.Text(latex)]);
  _MathElement.display(String latex) : super(_kDisplayMath, [md.Text(latex)]);
}

class _InlineMathSyntax extends md.InlineSyntax {
  _InlineMathSyntax() : super(r'\$(?!\$)(.*?)\$', caseSensitive: true);

  @override
  bool onMatch(md.InlineParser parser, Match match) {
    final latex = match.group(1)!;
    parser.addNode(_MathElement.inline(latex));
    return true;
  }
}

class _DisplayMathSyntax extends md.InlineSyntax {
  _DisplayMathSyntax() : super(r'\$\$([\s\S]*?)\$\$', caseSensitive: true);

  @override
  bool onMatch(md.InlineParser parser, Match match) {
    final latex = match.group(1)!;
    parser.addNode(_MathElement.display(latex));
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FLUTTER ELEMENT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

class _InlineMathBuilder extends MarkdownElementBuilder {
  final TextStyle? textStyle;

  _InlineMathBuilder({this.textStyle});

  @override
  Widget? visitElementAfterWithContext(
    BuildContext context,
    md.Element element,
    TextStyle? preferredStyle,
    TextStyle? parentStyle,
  ) {
    final latex = element.textContent;
    final style = (textStyle ?? preferredStyle ?? parentStyle ?? const TextStyle()).copyWith(
      fontFamily: 'HindSiliguri',
    );

    // Render directly as an inline Math widget without SingleChildScrollView/ConstrainedBox.
    // SingleChildScrollView inside a WidgetSpan forces RenderParagraph to break lines.
    return Math.tex(
      latex,
      mathStyle: MathStyle.text,
      textStyle: style,
      onErrorFallback: (_) => Text(
        latex,
        style: style,
      ),
    );
  }
}

class _DisplayMathBuilder extends MarkdownElementBuilder {
  final TextStyle? textStyle;

  _DisplayMathBuilder({this.textStyle});

  @override
  Widget? visitElementAfterWithContext(
    BuildContext context,
    md.Element element,
    TextStyle? preferredStyle,
    TextStyle? parentStyle,
  ) {
    final latex = element.textContent;
    final style = (textStyle ?? preferredStyle ?? const TextStyle()).copyWith(
      fontFamily: 'HindSiliguri',
    );
    return Align(
      alignment: Alignment.center,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Math.tex(
            latex,
            mathStyle: MathStyle.display,
            textStyle: style,
            onErrorFallback: (_) => Text(
              '\$\$$latex\$\$',
              style: style.copyWith(color: Colors.redAccent),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC WIDGET
// ─────────────────────────────────────────────────────────────────────────────

class LatexText extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const LatexText({super.key, required this.text, this.style});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final effectiveStyle = (style ?? DefaultTextStyle.of(context).style)
        .copyWith(
          fontFamily: style?.fontFamily ?? 'HindSiliguri',
          fontSize: style?.fontSize,
          color:
              style?.color ??
              (isDark ? const Color(0xFFF5F5F5) : const Color(0xFF111827)),
          height: style?.height ?? 1.45,
        );

    final bool hasSpecialSyntax = text.contains(r'$') ||
        text.contains('*') ||
        text.contains('_') ||
        text.contains('#') ||
        text.contains('`') ||
        text.contains('\n') ||
        text.contains(r'\') ||
        text.contains('^');

    if (!hasSpecialSyntax) {
      return Text(
        text,
        style: effectiveStyle,
      );
    }

    final processed = _preprocess(text);

    return MarkdownBody(
      data: processed,
      inlineSyntaxes: [_DisplayMathSyntax(), _InlineMathSyntax()],
      builders: {
        _kInlineMath: _InlineMathBuilder(textStyle: effectiveStyle),
        _kDisplayMath: _DisplayMathBuilder(textStyle: effectiveStyle),
      },
      styleSheet: MarkdownStyleSheet(
          textAlign: WrapAlignment.start,
          p: effectiveStyle,
          pPadding: EdgeInsets.zero,
          blockSpacing: 6.0,
          strong: effectiveStyle.copyWith(fontWeight: FontWeight.bold),
          em: effectiveStyle.copyWith(fontStyle: FontStyle.italic),
          code: effectiveStyle.copyWith(
            fontFamily: 'monospace',
            backgroundColor: isDark
                ? const Color(0xFF1C1C1E)
                : const Color(0xFFF5F5F5),
          ),
          codeblockDecoration: BoxDecoration(
            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
            borderRadius: BorderRadius.circular(8),
          ),
          listBullet: effectiveStyle,
          blockquote: effectiveStyle.copyWith(
            color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
            fontStyle: FontStyle.italic,
          ),
          blockquoteDecoration: BoxDecoration(
            border: Border(
              left: BorderSide(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFD4D4D4),
                width: 3,
              ),
            ),
          ),
          h1: effectiveStyle.copyWith(
            fontSize: (effectiveStyle.fontSize ?? 14) * 1.5,
            fontWeight: FontWeight.bold,
          ),
          h2: effectiveStyle.copyWith(
            fontSize: (effectiveStyle.fontSize ?? 14) * 1.3,
            fontWeight: FontWeight.bold,
          ),
          h3: effectiveStyle.copyWith(
            fontSize: (effectiveStyle.fontSize ?? 14) * 1.1,
            fontWeight: FontWeight.bold,
          ),
        ),
        softLineBreak: true,
        selectable: false,
        shrinkWrap: true,
      );
  }
}

