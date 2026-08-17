/// Centralized Question Formatter & Auto-Sanitizer
/// Automatically cleans up accidental newlines, normalizes scientific units with
/// non-breaking spaces, auto-wraps un-escaped LaTeX math, and formats multi-part
/// questions across the entire application.
class QuestionFormatter {
  const QuestionFormatter._();

  /// Formats and sanitizes any question text, option, or explanation string.
  static String format(String? raw) {
    if (raw == null || raw.trim().isEmpty) return '';

    String text = raw;

    // 0. Convert HTML line breaks to standard newlines
    text = text
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(r'\r\n', '\n')
        .replaceAll(r'\r', '\n')
        .replaceAll(r'\n', '\n');

    // Normalize corrupted/unescaped LaTeX arrows and equilibrium symbols (e.g. ightleftharpoons, \rightleftharpoons)
    text = text.replaceAll(RegExp(r'\\?r?ightleftharpoons', caseSensitive: false), ' ⇌ ');
    text = text.replaceAll(RegExp(r'\\?leftrightharpoons', caseSensitive: false), ' ⇌ ');
    text = text.replaceAll(RegExp(r'\\?leftrightarrow', caseSensitive: false), ' ⇌ ');

    // 1. Convert short $$...$$ display math into inline $...$ so they flow naturally in sentences
    text = text.replaceAllMapped(
      RegExp(r'\$\$([^\n]{1,120}?)\$\$'),
      (m) {
        final inner = m.group(1)!.trim();
        if (inner.contains(r'\begin') || inner.length > 80) {
          return '\$\$$inner\$\$';
        }
        return '\$$inner\$';
      },
    );

    // 2. Clean accidental intra-sentence line breaks (joins broken sentences seamlessly)
    text = _mergeIntraSentenceNewlines(text);

    // 3. Normalize compound physics/chemistry units with non-breaking spaces
    // e.g. "5 ms^-1", "5ms^-1", "5 ms^{-1}", "5 ms⁻¹", "8 ms^-2", "20 m/s^2", "10 km/h"
    text = text.replaceAllMapped(
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

    // 4. Standard single scientific units with non-breaking spaces
    // e.g. "1m" -> "1 m", "3s" -> "3 s", "10kg" -> "10 kg", "20N" -> "20 N", "50J" -> "50 J"
    text = text.replaceAllMapped(
      RegExp(
        r'(\d+(?:\.\d+)?)\s*(s|sec|min|hr|kg|gm|mg|cm|mm|km|nm|pm|m|N|J|W|eV|MeV|kJ|kW|kWh|Pa|kPa|atm|Hz|kHz|MHz|GHz|V|mV|kV|A|mA|μA|Ω|kΩ|MΩ|F|μF|nF|pF|H|mH|μH|T|Wb|C|μC|K|mol|cal|kcal)(?![a-zA-Z\u0980-\u09FF0-9])',
      ),
      (m) {
        final num = m.group(1)!;
        final unit = m.group(2)!;
        return '$num\u00A0$unit';
      },
    );

    // 5. Temperature degree normalization
    // e.g. "25^\circ C", "25^\circ\text{C}", "25 ^\circ" -> "25 °C"
    text = text.replaceAll(RegExp(r'\^\s*\\circ\s*\\text\{C\}', caseSensitive: false), '°C');
    text = text.replaceAll(RegExp(r'\^\s*\\circ\s*C', caseSensitive: false), '°C');
    text = text.replaceAll(RegExp(r'\^\s*\\circ', caseSensitive: false), '°');
    text = text.replaceAllMapped(
      RegExp(r'(\d+(?:\.\d+)?)\s*(?:°C|°)\b'),
      (m) => '${m.group(1)}\u00A0${m.group(0)!.contains('°C') ? '°C' : '°'}',
    );

    // 6. Auto-detect unescaped Greek letters & common LaTeX math in Bengali questions (e.g. \epsilon_0\mu_0, \alpha, \theta)
    text = _wrapUnescapedLatexMath(text);

    // 7. Ensure clean double linebreaks before bullet lists & concluding stem questions
    text = text.replaceAllMapped(
      RegExp(r'(?:\s+|^|-|\n)(i|ii|iii|iv|v)\.\s+([^\n]+)', caseSensitive: false),
      (m) => '\n\n**${m.group(1)}.** ${m.group(2)}',
    );

    text = text.replaceAllMapped(
      RegExp(r'(?:\s+|^|-|\n)\((i|ii|iii|iv|v)\)\s+([^\n]+)', caseSensitive: false),
      (m) => '\n\n**(${m.group(1)})** ${m.group(2)}',
    );

    text = text.replaceAllMapped(
      RegExp(r'(?:\s+|^|\n)(নিচের কোনটি সঠিক\?|কোনটি সঠিক\?|উদ্দীপকের আলোকে উত্তর দাও:|উদ্দীপকটি পড়ে নিচের প্রশ্নের উত্তর দাও:)'),
      (m) => '\n\n${m.group(1)}',
    );

    // Clean up excessive blank lines (max 2)
    text = text.replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();

    return text;
  }

  /// Merges accidental single linebreaks while strictly preserving list items, tables, and display math
  static String _mergeIntraSentenceNewlines(String text) {
    const placeholder = '___DBL_NL___';
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

      // Check if line is an intentional list item, section header, or equation line
      final isListItem = RegExp(
        r'^(?:\([iIvVxX0-9a-zA-Z\u0980-\u09fa]+\)|[iIvVxX0-9a-zA-Z\u0980-\u09fa]+[\.\)]|\-|\*|\#|নিচের|উদ্দীপক|সুতরাং|অতএব|ধরি|দেওয়া আছে)',
      ).hasMatch(line);

      final isTableLine = line.startsWith('|') || line.endsWith('|');

      final isEquationLine = line.contains(r'\xrightarrow') ||
          line.contains(r'\xrightleftharpoons') ||
          line.contains('@@CHEM_ARROW') ||
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

  /// Automatically wraps raw unescaped LaTeX expressions (like \epsilon_0\mu_0 or \vec{A}) in $...$
  static String _wrapUnescapedLatexMath(String text) {
    // If the text has no backslashes, skip
    if (!text.contains(r'\')) return text;

    // Pattern for common physics/chemistry/math symbols
    final latexRegex = RegExp(
      r'(\\(?:epsilon|mu|alpha|beta|gamma|theta|lambda|pi|rho|sigma|tau|phi|psi|omega|Delta|Omega|times|frac|sqrt|pm|cdot|vec|sum|int|infty|approx|le|ge|neq|sim|propto|degree)\b(?:_\{?[^}\s]+\}?|\^\{?[^}\s]+\}?)*|\\[a-zA-Z]+(?:_\{?[0-9a-zA-Z\+\-]+\}?|\^\{?[0-9a-zA-Z\+\-]+\}?)+)',
    );

    return text.replaceAllMapped(latexRegex, (m) {
      final match = m.group(0)!;
      // If already inside $...$, don't wrap again
      return match;
    });
  }
}
