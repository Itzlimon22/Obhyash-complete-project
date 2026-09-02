import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:markdown/markdown.dart' as md;
import 'package:obhyash_app/core/utils/question_formatter.dart';

// ─────────────────────────────────────────────────────────────────────────────
// PREPROCESSING (Chemical arrows, Equilibrium, Bengali un-wrapping, TeX sanitization)
// ─────────────────────────────────────────────────────────────────────────────

const String _kChemArrowPrefix = '@@CHEM_ARROW:';
const String _kChemArrowSuffix = '@@';
const String _kChemArrow = 'chem-arrow';
const String _kInlineMath = 'inline-math';
const String _kDisplayMath = 'display-math';

String _cleanConditionText(String raw) {
  return raw
      .replaceAll(r'\text{', '')
      .replaceAll(r'\mathrm{', '')
      .replaceAll(r'\textbf{', '')
      .replaceAll(r'\textit{', '')
      .replaceAll('}', '')
      .replaceAll(r'\,', ' ')
      .replaceAll(r'\;', ' ')
      .replaceAll(r'\quad', ' ')
      .replaceAll(r'\qquad', ' ')
      .replaceAll(r'\ ', ' ')
      .replaceAll(r'^\circ\text{C}', '°C')
      .replaceAll(r'^\circ C', '°C')
      .replaceAll(r'^\circ\mathrm{C}', '°C')
      .replaceAll(r'^\circ', '°')
      .replaceAll('^\\circ', '°')
      .replaceAll(r'^{\circ}', '°')
      .replaceAll(r'\Delta', 'Δ')
      .trim();
}

String _unwrapBengaliMathContent(String inner) {
  String clean = inner;

  // 0. Normalize any @@CHEM_ARROW tokens inside math first
  clean = clean.replaceAllMapped(
    RegExp(r'@@CHEM_ARROW\s*:\s*([^@]*)@@'),
    (m) {
      final raw = m.group(1) ?? '';
      String above = '';
      String below = '';
      String dir = 'right';

      if (raw.contains('||')) {
        final parts = raw.split('||');
        above = parts[0].trim();
        dir = parts.length > 1 ? parts[1].trim() : 'right';
      } else if (raw.contains('|')) {
        final parts = raw.split('|');
        if (parts.length >= 3) {
          above = parts[0].trim();
          below = parts[1].trim();
          dir = parts[2].trim();
        } else if (parts.length == 2) {
          above = parts[0].trim();
          final second = parts[1].trim();
          if (second == 'right' || second == 'left' || second == 'bi') {
            dir = second;
          } else {
            below = second;
          }
        } else {
          above = parts[0].trim();
        }
      } else {
        above = raw.trim();
      }

      if (dir.isEmpty) dir = 'right';
      return ' $_kChemArrowPrefix$above|$below|$dir$_kChemArrowSuffix ';
    },
  );

  // 1. Process chemical arrows and equilibrium arrows
  clean = clean.replaceAllMapped(
    RegExp(r'\\xrightleftharpoons(?:\[([^\]]*)\])?\{([^}]*)\}'),
    (m) {
      final below = m.group(1) ?? '';
      final above = m.group(2) ?? '';
      return ' $_kChemArrowPrefix$above|$below|bi$_kChemArrowSuffix ';
    },
  );

  clean = clean.replaceAllMapped(
    RegExp(r'\\xrightarrow(?:\[([^\]]*)\])?\{([^}]*)\}'),
    (m) {
      final below = m.group(1) ?? '';
      final above = m.group(2) ?? '';
      return ' $_kChemArrowPrefix$above|$below|right$_kChemArrowSuffix ';
    },
  );

  clean = clean.replaceAllMapped(
    RegExp(r'\\xleftarrow(?:\[([^\]]*)\])?\{([^}]*)\}'),
    (m) {
      final below = m.group(1) ?? '';
      final above = m.group(2) ?? '';
      return ' $_kChemArrowPrefix$above|$below|left$_kChemArrowSuffix ';
    },
  );

  clean = clean.replaceAllMapped(
    RegExp(r'\\overset\{([^}]*)\}\{(?:\\rightleftharpoons|\\leftrightharpoons|\<=\>|\<-\>|⇌|⇄)\}'),
    (m) {
      final above = m.group(1) ?? '';
      return ' $_kChemArrowPrefix$above||bi$_kChemArrowSuffix ';
    },
  );

  clean = clean.replaceAllMapped(
    RegExp(r'\\overset\{([^}]*)\}\{(?:\\longrightarrow|\\rightarrow|\\to|\-\>|\=\>|→)\}'),
    (m) {
      final above = m.group(1) ?? '';
      return ' $_kChemArrowPrefix$above||right$_kChemArrowSuffix ';
    },
  );

  // 2. Un-escape \text{...}, \mathrm{...}, \textbf{...}, \textit{...}
  clean = clean.replaceAllMapped(
    RegExp(r'\\(?:text|mathrm|textbf|textit)\{([^}]*)\}'),
    (m) => m.group(1)!,
  );

  // 3. Un-escape LaTeX spacing commands
  clean = clean
      .replaceAll(r'\,', ' ')
      .replaceAll(r'\;', ' ')
      .replaceAll(r'\quad', ' ')
      .replaceAll(r'\qquad', ' ')
      .replaceAll(r'\ ', ' ')
      .replaceAll('~', ' ');

  // 4. Fractions with Bengali text: \frac{ভর}{আয়তন} -> (ভর / আয়তন)
  clean = clean.replaceAllMapped(
    RegExp(r'\\frac\{([^}]*[\u0980-\u09FF][^}]*)\}\{([^}]*)\}'),
    (m) => '(${m.group(1)} / ${m.group(2)})',
  );
  clean = clean.replaceAllMapped(
    RegExp(r'\\frac\{([^}]*)\}\{([^}]*[\u0980-\u09FF][^}]*)\}'),
    (m) => '(${m.group(1)} / ${m.group(2)})',
  );

  // 5. Re-wrap pure math/formula constructs within this mixed text
  final tokenRegex = RegExp(
    r'(\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\[\]]*\])*|[a-zA-Z0-9]+(?:\^|\_)\{?[a-zA-Z0-9\-\+]+\}?)',
  );

  clean = clean.replaceAllMapped(tokenRegex, (m) {
    final token = m.group(0)!;
    if (token.contains('CHEM_ARROW') || token.contains('@')) return token;
    // Don't wrap if token contains Bengali
    if (RegExp(r'[\u0980-\u09FF]').hasMatch(token)) return token;
    return '\$$token\$';
  });

  return clean;
}

String _cleanIntraSentenceNewlines(String text) {
  const placeholder = '___DBL_NL___';
  text = text.replaceAll(RegExp(r'\r\n|\r'), '\n');
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

    // Check if the line is an intentional list item, section header, or equation line
    final isListItem = RegExp(
      r'^(?:\([iIvVxX0-9a-zA-Z\u0980-\u09fa]+\)|[iIvVxX0-9a-zA-Z\u0980-\u09fa]+[\.\)]|\-|\*|\#|নিচের|উদ্দীপক|সুতরাং|অতএব|ধরি|দেওয়া আছে|প্রদত্ত মানসমূহ|মান বসিয়ে পাই|মান বসিয়ে পাই|লব ও হর কাটাকাটি করে|কাটাকাটি করে|সঠিক উত্তর)',
    ).hasMatch(line);

    final isTableLine = line.startsWith('|') || line.endsWith('|');

    final isEquationLine = line.contains(r'\xrightarrow') ||
        line.contains(r'\xrightleftharpoons') ||
        line.contains(_kChemArrowPrefix) ||
        line.startsWith(r'$$') ||
        line.contains('→') ||
        line.contains('⟶') ||
        line.contains('⇌') ||
        line.contains('⇄');

    final isPunctuation = RegExp(r'^[।,\.\?\!:\;]').hasMatch(line);

    if (isListItem || isEquationLine || isTableLine) {
      buffer.write('\n\n');
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

String _separateTransitionSteps(String text) {
  var t = text;

  t = t.replaceAllMapped(
    RegExp(
      r'([।\?\!\:\;])\s*(ধরি|মনে করি|প্রদত্ত মানসমূহ|প্রদত্ত তথ্য|দেওয়া আছে|দেয়া আছে|আমরা জানি|জানা আছে|প্রশ্নমতে|শর্তমতে|অর্থাৎ|সুতরাং|অতএব|মান বসিয়ে পাই|মান বসিয়ে পাই|লব ও হর কাটাকাটি করে|কাটাকাটি করে|হিসাব করে পাই|গণনা করে পাই|সঠিক উত্তর|উত্তর|নোট|টিপস)[\s:\-–—\.]*',
    ),
    (m) => '${m.group(1)}\n\n${m.group(2)}: ',
  );

  t = t.replaceAllMapped(
    RegExp(
      r'(\))\s*(মান বসিয়ে পাই|মান বসিয়ে পাই|লব ও হর কাটাকাটি করে|কাটাকাটি করে|হিসাব করে পাই|অতএব|সুতরাং|অর্থাৎ)[\s:\-–—\.]*',
    ),
    (m) => '${m.group(1)}\n\n${m.group(2)}: ',
  );

  t = t.replaceAll(RegExp(r':\s*:\s*'), ': ');
  return t;
}

String _preprocess(String text) {
  var processedText = QuestionFormatter.format(text);
  processedText = _separateTransitionSteps(processedText);

  // Single dollar balancing per line
  final rawLines = processedText.split('\n');
  final balancedLines = rawLines.map((line) {
    var l = line.trim();
    if (l.isEmpty) return '';

    final dollarCount = RegExp(r'\$').allMatches(l).length;
    if (dollarCount % 2 != 0) {
      if (l.endsWith(r'$')) {
        final withoutTrailing = l.substring(0, l.length - 1).trim();
        final colonIdx = withoutTrailing.lastIndexOf(':');
        if (colonIdx != -1 && colonIdx < withoutTrailing.length - 1) {
          final prefix = withoutTrailing.substring(0, colonIdx + 1);
          final math = withoutTrailing.substring(colonIdx + 1).trim();
          l = '$prefix \$$math\$';
        } else {
          final firstBackslash = withoutTrailing.indexOf(r'\');
          if (firstBackslash != -1) {
            final prefix = withoutTrailing.substring(0, firstBackslash);
            final math = withoutTrailing.substring(firstBackslash).trim();
            l = '$prefix\$$math\$';
          } else if (withoutTrailing.startsWith('=')) {
            l = '\$$withoutTrailing\$';
          } else {
            l = withoutTrailing;
          }
        }
      } else if (l.startsWith(r'$')) {
        l = '$l\$';
      }
    }

    // Auto-heal corrupted LaTeX commands (e.g. \left( ... ight) -> \left( ... \right))
    l = l.replaceAllMapped(
      RegExp(r'(\\left\s*[(\[{|.]\s*[^\\)]*?)(?:\\?r?ight|\bight)\s*([)\]}|.])'),
      (m) => '${m.group(1)}\\right${m.group(2)}',
    );
    l = l.replaceAll(RegExp(r'(?<=\s|\(|\{|^)ight\b'), r'\right');
    l = l.replaceAll(RegExp(r'(?<!\\)\bight([)\]}|.])'), r'\right$1');

    if (!l.contains(r'$') &&
        !RegExp(r'[\u0980-\u09FF]').hasMatch(l) &&
        (l.contains(r'\') || l.contains('='))) {
      l = '\$$l\$';
    }

    l = l.replaceAllMapped(
      RegExp(r'(:\s*)([A-Za-z0-9\(\)\_]+(?:\s*(?:\\cap|\\cup|\\times|=|\\pm)\s*[A-Za-z0-9\(\)\_\s\+\-\*\/\\\{\}\^]+)+)(?=$|[\n\।])'),
      (m) {
        final p1 = m.group(1) ?? '';
        final p2 = m.group(2) ?? '';
        if (p2.contains(r'$') || RegExp(r'[\u0980-\u09FF]').hasMatch(p2)) return m.group(0)!;
        return '$p1\$${p2.trim()}\$';
      },
    );

    return l;
  });

  processedText = balancedLines.join('\n\n');

  // 0. Normalize any raw or spaced @@CHEM_ARROW tokens from database
  processedText = processedText.replaceAllMapped(
    RegExp(r'@@CHEM_ARROW\s*:\s*([^@]*)@@'),
    (m) {
      final raw = m.group(1) ?? '';
      String above = '';
      String below = '';
      String dir = 'right';

      if (raw.contains('||')) {
        final parts = raw.split('||');
        above = parts[0].trim();
        dir = parts.length > 1 ? parts[1].trim() : 'right';
      } else if (raw.contains('|')) {
        final parts = raw.split('|');
        if (parts.length >= 3) {
          above = parts[0].trim();
          below = parts[1].trim();
          dir = parts[2].trim();
        } else if (parts.length == 2) {
          above = parts[0].trim();
          final second = parts[1].trim();
          if (second == 'right' || second == 'left' || second == 'bi') {
            dir = second;
          } else {
            below = second;
          }
        } else {
          above = parts[0].trim();
        }
      } else {
        above = raw.trim();
      }

      if (dir.isEmpty) dir = 'right';
      return ' $_kChemArrowPrefix$above|$below|$dir$_kChemArrowSuffix ';
    },
  );

  // 1. Convert chemical reaction and equilibrium arrows into custom tokens
  processedText = processedText.replaceAllMapped(
    RegExp(r'\\xrightleftharpoons(?:\[([^\]]*)\])?\{([^}]*)\}'),
    (m) {
      final below = m.group(1) ?? '';
      final above = m.group(2) ?? '';
      return ' $_kChemArrowPrefix$above|$below|bi$_kChemArrowSuffix ';
    },
  );

  processedText = processedText.replaceAllMapped(
    RegExp(r'\\xrightarrow(?:\[([^\]]*)\])?\{([^}]*)\}'),
    (m) {
      final below = m.group(1) ?? '';
      final above = m.group(2) ?? '';
      return ' $_kChemArrowPrefix$above|$below|right$_kChemArrowSuffix ';
    },
  );

  processedText = processedText.replaceAllMapped(
    RegExp(r'\\xleftarrow(?:\[([^\]]*)\])?\{([^}]*)\}'),
    (m) {
      final below = m.group(1) ?? '';
      final above = m.group(2) ?? '';
      return ' $_kChemArrowPrefix$above|$below|left$_kChemArrowSuffix ';
    },
  );

  processedText = processedText.replaceAllMapped(
    RegExp(
      r'\\overset\{([^}]*)\}\{(?:\\rightleftharpoons|\\leftrightharpoons|\<=\>|\<-\>|⇌|⇄)\}',
    ),
    (m) {
      final above = m.group(1) ?? '';
      return ' $_kChemArrowPrefix$above||bi$_kChemArrowSuffix ';
    },
  );

  processedText = processedText.replaceAllMapped(
    RegExp(
      r'\\overset\{([^}]*)\}\{(?:\\longrightarrow|\\rightarrow|\\to|\-\>|\=\>|→)\}',
    ),
    (m) {
      final above = m.group(1) ?? '';
      return ' $_kChemArrowPrefix$above||right$_kChemArrowSuffix ';
    },
  );

  // Standalone equilibrium symbol conversion
  processedText = processedText.replaceAll(RegExp(r'\\?r?ightleftharpoons', caseSensitive: false), ' ⇌ ');
  processedText = processedText.replaceAll(RegExp(r'\\?leftrightharpoons', caseSensitive: false), ' ⇌ ');
  processedText = processedText.replaceAll(RegExp(r'\\?leftrightarrow', caseSensitive: false), ' ⇌ ');

  // 2. Convert inline $$...$$ into inline $...$ if short and non-multiline
  processedText = processedText.replaceAllMapped(
    RegExp(r'\$\$([^\n]{1,80}?)\$\$'),
    (m) {
      final inner = m.group(1)!.trim();
      if (inner.contains('\n') || inner.length > 80 || inner.contains(r'\begin')) {
        return '\$\$$inner\$\$';
      }
      return '\$$inner\$';
    },
  );

  // 3. Clean intra-sentence accidental newlines
  processedText = _cleanIntraSentenceNewlines(processedText);

  // 3a. Scientific Compound Unit & Exponent Normalization (Physics / Chemistry)
  // Handles: 5ms^-1, 5 ms^{-1}, 5 ms⁻¹, 8ms^-2, 20m/s^2, etc. with non-breaking spaces
  processedText = processedText.replaceAllMapped(
    RegExp(
      r'(\d+(?:\.\d+)?)\s*(?:ms\^\{?\-?1\}?|ms\^?\-1|ms⁻¹|ms\^\{?\-?2\}?|ms\^?\-2|ms⁻²|m\/s\^?2|m\/s²|m\/s|km\/h|rad\/s|kg\s*m\/s|N\s*s)(?!\w)',
      caseSensitive: false,
    ),
    (m) {
      final num = m.group(1)!;
      final full = m.group(0)!;
      String unit = 'ms⁻¹';
      if (full.contains('2') || full.contains('²')) {
        unit = full.contains('m/s') ? 'm/s²' : 'ms⁻²';
      } else if (full.contains('km/h')) {
        unit = 'km/h';
      } else if (full.contains('rad/s')) {
        unit = 'rad/s';
      } else if (full.contains('m/s')) {
        unit = 'm/s';
      } else if (full.contains('kg')) {
        unit = 'kg m/s';
      } else if (full.contains('N')) {
        unit = 'N s';
      }
      return '$num\u00A0$unit';
    },
  );

  // 3b. Standard Single Scientific Units with Non-Breaking Space
  // Handles: 3s -> 3 s, 5 s -> 5 s, 10kg -> 10 kg, 20N -> 20 N, 50J -> 50 J, 5A -> 5 A, 10V -> 10 V
  processedText = processedText.replaceAllMapped(
    RegExp(
      r'(\d+(?:\.\d+)?)\s*(s|sec|min|hr|kg|gm|mg|cm|mm|km|nm|pm|m|N|J|W|eV|MeV|kJ|kW|kWh|Pa|kPa|atm|Hz|kHz|MHz|GHz|V|mV|kV|A|mA|μA|Ω|kΩ|MΩ|F|μF|nF|pF|H|mH|μH|T|Wb|C|μC|K|mol|cal|kcal)(?![a-zA-Z\u0980-\u09FF0-9])',
    ),
    (m) {
      final num = m.group(1)!;
      final unit = m.group(2)!;
      return '$num\u00A0$unit';
    },
  );

  // 4. Format Roman-numeral list items "i. ", "ii. " with clean bullet spacing
  processedText = processedText.replaceAllMapped(
    RegExp(r'(?:\s+|^|-|\n)(i|ii|iii|iv|v)\.\s+([^\n]+)', caseSensitive: false),
    (m) => '\n\n**${m.group(1)}.** ${m.group(2)}',
  );

  // Parenthetical roman numerals "(i) ", "(ii) "
  processedText = processedText.replaceAllMapped(
    RegExp(r'(?:\s+|^|-|\n)\((i|ii|iii|iv|v)\)\s+([^\n]+)', caseSensitive: false),
    (m) => '\n\n**(${m.group(1)})** ${m.group(2)}',
  );

  // Common Bangla question concluding sentences
  processedText = processedText.replaceAllMapped(
    RegExp(r'(?:\s+|^|\n)(নিচের কোনটি সঠিক\?|কোনটি সঠিক\?|উদ্দীপকের আলোকে উত্তর দাও:|উদ্দীপকটি পড়ে নিচের প্রশ্নের উত্তর দাও:)'),
    (m) => '\n\n${m.group(1)}',
  );

  // 4b. Auto-detect un-escaped LaTeX in options / formulas (e.g. "1.6 \times 10^{-19} \text{ Kg}")
  if (!processedText.contains(r'$')) {
    final hasLatexMath = RegExp(
      r'\\(?:times|frac|sqrt|pm|cdot|text|mathrm|textbf|textit|mu|alpha|beta|theta|pi|omega|lambda|sigma|rho|epsilon|eta|tau|phi|psi|gamma|Delta|degree|pu|ce|infty|approx|le|ge|neq|sim|propto|circ|rightarrow|leftarrow|rightleftharpoons|vec|sum|int|lim|sin|cos|tan|log|ln)\b|\^\{?[0-9\-\+a-zA-Z]+\}?|_\{?[0-9\-\+a-zA-Z]+\}?',
    ).hasMatch(processedText);

    if (hasLatexMath) {
      // Check if there is Bengali outside of \text{...}
      final stripped = processedText.replaceAll(
        RegExp(r'\\(?:text|mathrm|textbf|textit)\{[^}]*\}'),
        '',
      );
      final hasExternalBengali = RegExp(r'[\u0980-\u09FF]').hasMatch(stripped);

      if (!hasExternalBengali) {
        // Pure LaTeX formula option
        processedText = '\$${processedText.trim()}\$';
      } else {
        // Mixed text: auto-wrap LaTeX math chunks
        processedText = processedText.replaceAllMapped(
          RegExp(
            r'((?:[0-9a-zA-Z\.\+\-\=\/\(\)\<\>\,\s]|\\(?:times|frac|sqrt|pm|cdot|text|mathrm|textbf|textit|mu|alpha|beta|theta|pi|omega|lambda|sigma|rho|epsilon|eta|tau|phi|psi|gamma|Delta|degree|pu|ce|infty|approx|le|ge|neq|sim|propto|circ|rightarrow|leftarrow|rightleftharpoons|vec)\b(?:\{[^{}]*\}|\[[^\[\]]*\])*|\^\{?[0-9\-\+a-zA-Z]+\}?|_\{?[0-9\-\+a-zA-Z]+\}?)+)',
          ),
          (m) {
            final chunk = m.group(0)!;
            final trimmed = chunk.trim();
            final isMath = RegExp(
              r'\\[a-zA-Z]+|\^\{?[0-9\-\+a-zA-Z]+\}?|_\{?[0-9\-\+a-zA-Z]+\}?',
            ).hasMatch(trimmed);
            if (isMath && !trimmed.startsWith(r'$') && !trimmed.endsWith(r'$')) {
              final innerBengali = trimmed.replaceAll(
                RegExp(r'\\(?:text|mathrm|textbf|textit)\{[^}]*\}'),
                '',
              );
              if (!RegExp(r'[\u0980-\u09FF]').hasMatch(innerBengali)) {
                return ' \$$trimmed\$ ';
              }
            }
            return chunk;
          },
        );
      }
    }
  }

  // 5. Split into math blocks ($$...$$ or $...$) and non-math segments
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

  // 6. Process each segment safely
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

      // If math block does NOT contain Bengali, keep as pure LaTeX
      if (!RegExp(r'[\u0980-\u09FF]').hasMatch(cleanInner)) {
        return isDisplay ? '\$\$$cleanInner\$\$' : '\$$cleanInner\$';
      }

      // If it contains Bengali, unwrap Bengali content safely
      return _unwrapBengaliMathContent(cleanInner);
    }

    // Non-Math Text Segment
    String t = part;

    // Check for un-delimited chemical formula sequences like C_6H_12O_6, C_{12}H_{22}O_{11}, H_2O, CO_2, Fe^{3+}, SO_4^{2-}
    t = t.replaceAllMapped(
      RegExp(r'\b([A-Z][a-z]?(?:_\d+|_\{\d+\}|\^[-+0-9a-zA-Z]+|\^\{[-+0-9a-zA-Z]+\})(?:[A-Z][a-z]?(?:_\d+|_\{\d+\}|\^[-+0-9a-zA-Z]+|\^\{[-+0-9a-zA-Z]+\})|\d+)*)\b'),
      (m) {
        final formula = m.group(0)!.trim();
        if (formula.contains('CHEM_ARROW') || formula.contains('@')) return formula;
        if (RegExp(r'[\u0980-\u09FF]').hasMatch(formula)) return formula;
        return '\$$formula\$';
      },
    );

    // Normalize isolated superscripts like ms^-1, ms^-2, m^3
    t = t.replaceAllMapped(
      RegExp(r'\b([a-zA-Z0-9]+)\^(-?[0-9]+)\b'),
      (m) => '\$${m.group(1)}^{${m.group(2)}}\$',
    );
    t = t.replaceAllMapped(
      RegExp(r'\b([a-zA-Z0-9]+)\^\{(-?[0-9a-zA-Z]+)\}\b'),
      (m) => '\$${m.group(1)}^{${m.group(2)}}\$',
    );

    return t;
  }).toList();

  return processedParts.join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN EXTENSIONS & BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

class _MathElement extends md.Element {
  _MathElement.inline(String latex) : super(_kInlineMath, [md.Text(latex)]);
  _MathElement.display(String latex) : super(_kDisplayMath, [md.Text(latex)]);
}

class _ChemArrowElement extends md.Element {
  _ChemArrowElement(String above, String below, String dir)
      : super(_kChemArrow, [md.Text('$above|$below|$dir')]);
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

class _ChemArrowSyntax extends md.InlineSyntax {
  _ChemArrowSyntax()
      : super(r'@@CHEM_ARROW\s*:\s*([^@]*)@@',
            caseSensitive: true);

  @override
  bool onMatch(md.InlineParser parser, Match match) {
    final raw = match.group(1) ?? '';
    String above = '';
    String below = '';
    String dir = 'right';

    if (raw.contains('||')) {
      final parts = raw.split('||');
      above = parts[0].trim();
      dir = parts.length > 1 ? parts[1].trim() : 'right';
    } else if (raw.contains('|')) {
      final parts = raw.split('|');
      if (parts.length >= 3) {
        above = parts[0].trim();
        below = parts[1].trim();
        dir = parts[2].trim();
      } else if (parts.length == 2) {
        above = parts[0].trim();
        final second = parts[1].trim();
        if (second == 'right' || second == 'left' || second == 'bi') {
          dir = second;
        } else {
          below = second;
        }
      } else {
        above = parts[0].trim();
      }
    } else {
      above = raw.trim();
    }

    if (dir.isEmpty) dir = 'right';
    parser.addNode(_ChemArrowElement(above, below, dir));
    return true;
  }
}

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
    final style =
        (textStyle ?? preferredStyle ?? parentStyle ?? const TextStyle())
            .copyWith(
      fontFamily: 'HindSiliguri',
    );

    // If string accidentally has Bengali, render as native text fallback
    if (RegExp(r'[\u0980-\u09FF]').hasMatch(latex)) {
      return Text(
        _cleanConditionText(latex),
        style: style,
      );
    }

    // If it's a simple scientific unit or simple exponent, render as native text with perfect baseline alignment
    final trimmedLatex = latex.trim();
    if (RegExp(r'^(?:ms\^?\{?\-?[123]\}?|ms⁻¹|ms⁻²|m\/s\^?2|m\/s²|m\/s|cm\^?3|m\^?[23]|km\/h|rad\/s|kg|gm|mg|cm|mm|km|nm|s|sec|N|J|W|V|A|K|Pa|Hz)$', caseSensitive: false).hasMatch(trimmedLatex)) {
      String cleanUnit = trimmedLatex
          .replaceAll(r'ms^{-1}', 'ms⁻¹')
          .replaceAll('ms^-1', 'ms⁻¹')
          .replaceAll(r'ms^{-2}', 'ms⁻²')
          .replaceAll('ms^-2', 'ms⁻²')
          .replaceAll(r'm/s^2', 'm/s²')
          .replaceAll(r'm^2', 'm²')
          .replaceAll(r'm^3', 'm³')
          .replaceAll(r'cm^3', 'cm³');
      return Text(
        cleanUnit,
        style: style,
      );
    }

    final mathWidget = Math.tex(
      latex,
      mathStyle: MathStyle.text,
      textStyle: style,
      onErrorFallback: (_) => Text(
        latex,
        style: style,
      ),
    );

    // If inline equation contains reaction arrows or is long, wrap in SingleChildScrollView so it never overflows horizontally
    if (latex.length > 25 ||
        latex.contains(r'\to') ||
        latex.contains(r'\rightarrow') ||
        latex.contains(r'\xrightarrow') ||
        latex.contains(r'\longrightarrow') ||
        latex.contains('=')) {
      return SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: mathWidget,
        ),
      );
    }

    return mathWidget;
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
    final style =
        (textStyle ?? preferredStyle ?? const TextStyle()).copyWith(
      fontFamily: 'HindSiliguri',
    );

    if (RegExp(r'[\u0980-\u09FF]').hasMatch(latex)) {
      return Text(
        _cleanConditionText(latex),
        style: style,
      );
    }

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

class _ChemArrowBuilder extends MarkdownElementBuilder {
  final TextStyle? textStyle;

  _ChemArrowBuilder({this.textStyle});

  @override
  Widget? visitElementAfterWithContext(
    BuildContext context,
    md.Element element,
    TextStyle? preferredStyle,
    TextStyle? parentStyle,
  ) {
    final content = element.textContent;
    final parts = content.split('|');
    final above = parts.isNotEmpty ? parts[0] : '';
    final below = parts.length > 1 ? parts[1] : '';
    final dir = parts.length > 2 ? parts[2] : 'right';

    final style =
        (textStyle ?? preferredStyle ?? parentStyle ?? const TextStyle())
            .copyWith(fontFamily: 'HindSiliguri');

    return _ChemicalArrowWidget(
      above: _cleanConditionText(above),
      below: _cleanConditionText(below),
      direction: dir,
      style: style,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHEMICAL REACTION ARROW WIDGET (Supports Forward, Backward & Equilibrium)
// ─────────────────────────────────────────────────────────────────────────────

class _ChemicalArrowWidget extends StatelessWidget {
  final String above;
  final String below;
  final String direction; // 'right', 'left', 'bi'
  final TextStyle style;

  const _ChemicalArrowWidget({
    required this.above,
    required this.below,
    this.direction = 'right',
    required this.style,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = style.color ?? const Color(0xFF0F172A);
    final hasAbove = above.trim().isNotEmpty;
    final hasBelow = below.trim().isNotEmpty;

    // Approximate text width to dynamically scale the reaction arrow line
    final longestLen = [above.length, below.length].reduce((a, b) => a > b ? a : b);
    final arrowWidth = (longestLen * 7.5 + 34).clamp(44.0, 200.0);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (hasAbove)
            Padding(
              padding: const EdgeInsets.only(bottom: 1.5),
              child: Text(
                above,
                style: TextStyle(
                  fontSize: ((style.fontSize ?? 14) * 0.78).clamp(10.0, 13.0),
                  fontWeight: FontWeight.w600,
                  fontFamily: 'HindSiliguri',
                  color: textColor,
                  height: 1.1,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
              ),
            ),
          SizedBox(
            width: arrowWidth,
            height: direction == 'bi' ? 14 : 12,
            child: CustomPaint(
              painter: _ChemicalArrowPainter(
                color: textColor,
                direction: direction,
              ),
            ),
          ),
          if (hasBelow)
            Padding(
              padding: const EdgeInsets.only(top: 1.5),
              child: Text(
                below,
                style: TextStyle(
                  fontSize: ((style.fontSize ?? 14) * 0.72).clamp(9.5, 12.0),
                  fontWeight: FontWeight.w500,
                  fontFamily: 'HindSiliguri',
                  color: textColor.withValues(alpha: 0.85),
                  height: 1.1,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
              ),
            ),
        ],
      ),
    );
  }
}

class _ChemicalArrowPainter extends CustomPainter {
  final Color color;
  final String direction; // 'right', 'left', 'bi'

  _ChemicalArrowPainter({required this.color, this.direction = 'right'});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    const arrowHeadSize = 4.0;

    if (direction == 'bi') {
      // Equilibrium half-arrows (Top forward, Bottom backward)
      final yTop = size.height * 0.35;
      final yBottom = size.height * 0.65;

      // Top forward half-arrow
      canvas.drawLine(Offset(0, yTop), Offset(size.width - arrowHeadSize, yTop), paint);
      final pathTop = Path()
        ..moveTo(size.width - arrowHeadSize - 2.5, yTop - arrowHeadSize)
        ..lineTo(size.width, yTop);
      canvas.drawPath(pathTop, paint);

      // Bottom backward half-arrow
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
      // Right forward arrow
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
  bool shouldRepaint(covariant _ChemicalArrowPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.direction != direction;
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

    final effectiveStyle = (style ?? DefaultTextStyle.of(context).style).copyWith(
      fontFamily: style?.fontFamily ?? 'HindSiliguri',
      fontSize: style?.fontSize ?? 16,
      color: style?.color ??
          (isDark ? const Color(0xFFF5F5F5) : const Color(0xFF111827)),
      height: style?.height ?? 1.5,
    );

    final bool hasSpecialSyntax = text.contains(r'$') ||
        text.contains('*') ||
        text.contains('_') ||
        text.contains('#') ||
        text.contains('`') ||
        text.contains('@') ||
        text.contains('\n') ||
        text.contains(r'\') ||
        text.contains('|') ||
        text.contains('⇌') ||
        text.contains('⇄') ||
        text.contains('→') ||
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
      inlineSyntaxes: [
        _ChemArrowSyntax(),
        _DisplayMathSyntax(),
        _InlineMathSyntax(),
      ],
      builders: {
        _kChemArrow: _ChemArrowBuilder(textStyle: effectiveStyle),
        _kInlineMath: _InlineMathBuilder(textStyle: effectiveStyle),
        _kDisplayMath: _DisplayMathBuilder(textStyle: effectiveStyle),
      },
      styleSheet: MarkdownStyleSheet(
        textAlign: WrapAlignment.start,
        p: effectiveStyle,
        pPadding: EdgeInsets.zero,
        blockSpacing: 8.0,
        strong: effectiveStyle.copyWith(fontWeight: FontWeight.w700),
        em: effectiveStyle.copyWith(fontStyle: FontStyle.italic),
        code: effectiveStyle.copyWith(
          fontFamily: 'monospace',
          backgroundColor:
              isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
        ),
        codeblockDecoration: BoxDecoration(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
          borderRadius: BorderRadius.circular(8),
        ),
        listBullet: effectiveStyle,
        listBulletPadding: const EdgeInsets.only(right: 6),
        listIndent: 16.0,
        blockquote: effectiveStyle.copyWith(
          color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
          fontStyle: FontStyle.italic,
        ),
        blockquoteDecoration: BoxDecoration(
          border: Border(
            left: BorderSide(
              color: isDark
                  ? const Color(0xFF27272A)
                  : const Color(0xFFD4D4D4),
              width: 3,
            ),
          ),
        ),
        tableHead: effectiveStyle.copyWith(fontWeight: FontWeight.w700),
        tableBody: effectiveStyle,
        tableHeadAlign: TextAlign.center,
        tableBorder: TableBorder.all(
          color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0),
          width: 1,
          borderRadius: BorderRadius.circular(8),
        ),
        tableColumnWidth: const FlexColumnWidth(),
        tableCellsPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        tableCellsDecoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : const Color(0xFFF8FAFC),
        ),
        h1: effectiveStyle.copyWith(
          fontSize: (effectiveStyle.fontSize ?? 16) * 1.4,
          fontWeight: FontWeight.bold,
        ),
        h2: effectiveStyle.copyWith(
          fontSize: (effectiveStyle.fontSize ?? 16) * 1.25,
          fontWeight: FontWeight.bold,
        ),
        h3: effectiveStyle.copyWith(
          fontSize: (effectiveStyle.fontSize ?? 16) * 1.1,
          fontWeight: FontWeight.bold,
        ),
      ),
      softLineBreak: false,
      selectable: false,
      shrinkWrap: true,
    );
  }
}
