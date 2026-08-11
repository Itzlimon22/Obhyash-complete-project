import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:markdown/markdown.dart' as md;

// ─────────────────────────────────────────────────────────────────────────────
// PREPROCESSING  (mirrors the web app's MathRenderer preprocessing pipeline)
// ─────────────────────────────────────────────────────────────────────────────

String _preprocess(String text) {
  // 1. Normalise literal \n (two-char escape) → real newlines
  text = text.replaceAll(r'\n', '\n');

  // 2. Inside math blocks: un-escape \\command → \command
  //    (tiptap-markdown double-escapes backslashes inside math)
  text = text.replaceAllMapped(
    RegExp(r'(\$\$[\s\S]*?\$\$|\$(?!\$)[^\n]*?\$)'),
    (m) => m
        .group(0)!
        .replaceAllMapped(
          RegExp(r'\\\\([a-zA-Z{])'),
          (inner) => '\\${inner.group(1)}',
        ),
  );

  // 3. Roman-numeral list items  "i. " → "\ni. "
  text = text.replaceAllMapped(
    RegExp(r'(?:\s+|^|-)(i|ii|iii|iv|v)\.\s+', caseSensitive: false),
    (m) => '\n${m.group(1)}. ',
  );

  // 4. Parenthetical roman numerals "(i) " → "\n(i) "
  text = text.replaceAllMapped(
    RegExp(r'(?:\s+|^|-)\((i|ii|iii|iv|v)\)\s+', caseSensitive: false),
    (m) => '\n(${m.group(1)}) ',
  );

  // 5. Common Bangla question tail
  text = text.replaceAll(
    RegExp(r'(?:\s+|^)নিচের কোনটি সঠিক\?'),
    '\n\nনিচের কোনটি সঠিক?',
  );

  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATH INLINE-SYNTAX EXTENSION
// Teaches the markdown parser to recognise $...$ and $$...$$ as math spans.
// ─────────────────────────────────────────────────────────────────────────────

// Tag names used by our custom elements
const _kInlineMath = 'inline-math';
const _kDisplayMath = 'display-math';

/// Markdown syntax node that wraps a LaTeX expression.
class _MathElement extends md.Element {
  _MathElement.inline(String latex) : super(_kInlineMath, [md.Text(latex)]);

  _MathElement.display(String latex) : super(_kDisplayMath, [md.Text(latex)]);
}

/// Inline syntax: $...$  (but not $$)
class _InlineMathSyntax extends md.InlineSyntax {
  _InlineMathSyntax() : super(r'\$(?!\$)(.*?)\$', caseSensitive: true);

  @override
  bool onMatch(md.InlineParser parser, Match match) {
    final latex = match.group(1)!;
    parser.addNode(_MathElement.inline(latex));
    return true;
  }
}

/// Inline syntax: $$...$$  (display mode, treated inline but rendered display)
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
    final style = textStyle ?? preferredStyle ?? const TextStyle();
    return Math.tex(
      latex,
      mathStyle: MathStyle.text,
      textStyle: style,
      onErrorFallback: (_) =>
          Text('\$$latex\$', style: style.copyWith(color: Colors.red)),
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
    final style = textStyle ?? preferredStyle ?? const TextStyle();
    return Center(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Math.tex(
            latex,
            mathStyle: MathStyle.display,
            textStyle: style,
            onErrorFallback: (_) => Text(
              '\$\$$latex\$\$',
              style: style.copyWith(color: Colors.red),
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

/// Drop-in replacement for [Text] that supports:
///   • Markdown (bold, italic, lists, line-breaks, GFM tables)
///   • Inline LaTeX:  $E = mc^2$
///   • Display LaTeX: $$\int_0^1 x\,dx$$
///
/// Matches the web app's MathRenderer + preprocessing pipeline exactly.
class LatexText extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const LatexText({super.key, required this.text, this.style});

  @override
  Widget build(BuildContext context) {
    final processed = _preprocess(text);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Effective text color (for markdown body text)
    final effectiveStyle = (style ?? DefaultTextStyle.of(context).style)
        .copyWith(
          fontFamily: style?.fontFamily,
          fontSize: style?.fontSize,
          color:
              style?.color ??
              (isDark ? const Color(0xFFF5F5F5) : const Color(0xFF0F172A)),
          height: style?.height ?? 1.6,
        );

    return MarkdownBody(
      data: processed,
      // plug in $$...$$ BEFORE $...$ so the longer pattern matches first
      inlineSyntaxes: [_DisplayMathSyntax(), _InlineMathSyntax()],
      builders: {
        _kInlineMath: _InlineMathBuilder(textStyle: effectiveStyle),
        _kDisplayMath: _DisplayMathBuilder(textStyle: effectiveStyle),
      },
      styleSheet: MarkdownStyleSheet(
        p: effectiveStyle,
        strong: effectiveStyle.copyWith(fontWeight: FontWeight.bold),
        em: effectiveStyle.copyWith(fontStyle: FontStyle.italic),
        code: effectiveStyle.copyWith(
          fontFamily: 'monospace',
          backgroundColor: isDark
              ? const Color(0xFF262626)
              : const Color(0xFFF5F5F5),
        ),
        codeblockDecoration: BoxDecoration(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
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
              color: isDark ? const Color(0xFF404040) : const Color(0xFFD4D4D4),
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
