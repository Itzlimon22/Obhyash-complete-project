/// Centralized Question Formatter & Auto-Sanitizer
/// Automatically cleans up accidental newlines, normalizes scientific units with
/// non-breaking spaces, auto-wraps un-escaped LaTeX math, heals corrupted control
/// characters/escape sequences, and formats multi-part questions across the entire application.
class QuestionFormatter {
  const QuestionFormatter._();

  /// Formats and sanitizes any question text, option, or explanation string.
  static String format(String? raw) {
    if (raw == null || raw.trim().isEmpty) return '';

    String text = raw;

    // 0. Convert HTML line breaks to standard newlines
    text = text
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');

    // Extract and protect Markdown tables first so pipes and row newlines are completely preserved
    final (textWithoutTables, tables) = extractAndProtectTables(text);
    text = textWithoutTables;

    // 0a. Auto-heal unescaped Python/JS escape sequences and control characters
    text = text
        // \b (backspace \u0008) -> \begin, \bmatrix, \bullet, \binom, \beta, \bar, \boldsymbol
        .replaceAll(RegExp(r'[\u0008]egin\b'), r'\begin')
        .replaceAll(RegExp(r'[\u0008]matrix\b'), r'\bmatrix')
        .replaceAll(RegExp(r'[\u0008]ullet\b'), r'\bullet')
        .replaceAll(RegExp(r'[\u0008]inom\b'), r'\binom')
        .replaceAll(RegExp(r'[\u0008]eta\b'), r'\beta')
        .replaceAll(RegExp(r'[\u0008]ar\b'), r'\bar')
        .replaceAll(RegExp(r'[\u0008]oldsymbol\b'), r'\boldsymbol')
        .replaceAll(RegExp(r'[\u0008]'), '')
        // \v (vertical tab \u000b) -> \vec, \vmatrix, \vert
        .replaceAll(RegExp(r'[\u000b\v]ec\b'), r'\vec')
        .replaceAll(RegExp(r'[\u000b\v]ec\{'), r'\vec{')
        .replaceAll(RegExp(r'[\u000b\v]matrix\b'), r'\vmatrix')
        .replaceAll(RegExp(r'[\u000b\v]ert\b'), r'\vert')
        .replaceAll(RegExp(r'[\u000b\v]'), '')
        // \t (tab \u0009) -> \text, \times, \theta, \tan, \tau, \to, \tilde
        .replaceAll(RegExp(r'[\t\u0009]ext\{'), r'\text{')
        .replaceAll(RegExp(r'[\t\u0009]imes\b'), r'\times')
        .replaceAll(RegExp(r'[\t\u0009]heta\b'), r'\theta')
        .replaceAll(RegExp(r'[\t\u0009]an\b'), r'\tan')
        .replaceAll(RegExp(r'[\t\u0009]au\b'), r'\tau')
        .replaceAll(RegExp(r'[\t\u0009]o\b'), r'\to')
        .replaceAll(RegExp(r'[\t\u0009]ilde\{'), r'\tilde{')
        // \a (bell \u0007) -> \alpha, \approx
        .replaceAll(RegExp(r'[\u0007]lpha\b'), r'\alpha')
        .replaceAll(RegExp(r'[\u0007]pprox\b'), r'\approx')
        .replaceAll(RegExp(r'[\u0007]'), '')
        // \f (form feed \u000c) -> \frac, \forall
        .replaceAll(RegExp(r'[\u000c]rac\b'), r'\frac')
        .replaceAll(RegExp(r'[\u000c]orall\b'), r'\forall')
        .replaceAll(RegExp(r'[\u000c]'), '')
        // Non-printable control characters (except standard \n and \t)
        .replaceAll(RegExp(r'[\u0000-\u0006\u000e-\u001f]'), '');

    // Normalize LaTeX bracket syntax \[ ... \] and \( ... \)
    text = text.replaceAllMapped(RegExp(r'\\\[([\s\S]*?)\\\]'), (m) => '\$\$${m.group(1)}\$\$');
    text = text.replaceAllMapped(RegExp(r'\\\(([\s\S]*?)\\\)'), (m) => '\$${m.group(1)}\$');

    // Normalize empty nucleus notation (e.g. \{} -> {} before sub/superscripts in isotopes like {}^{35}_{17}Cl)
    text = text.replaceAll(r'\{}', '{}');

    // Matrix row break normalization (e.g. \begin{vmatrix} 1 & 2 \ 3 & 4 \end{vmatrix})
    text = text.replaceAllMapped(
      RegExp(r'(\\begin\{(?:v|p|b|B|V)?matrix\}[\s\S]*?\\end\{(?:v|p|b|B|V)?matrix\})'),
      (m) {
        final mat = m.group(1)!;
        return mat.replaceAllMapped(RegExp(r'(?<=[^\\&])\s*\\\s+(?=[0-9a-zA-Z\-\+\&])'), (rm) => r' \\ ');
      },
    );

    // 0b. Auto-heal corrupted LaTeX commands where the backslash was stripped
    text = text
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()ec\{'), r'\vec{')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()hat\{'), r'\hat{')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()bar\{'), r'\bar{')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()dot\{'), r'\dot{')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()ddot\{'), r'\ddot{')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()tilde\{'), r'\tilde{')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()sqrt\{'), r'\sqrt{')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()frac\{'), r'\frac{')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()imes(?=\s|[\$\d\w\\\{])'), r'\times')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()heta(?=\s|[\$\d\w\\\}\,\.\=])'), r'\theta')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()lpha(?=\s|[\$\d\w\\\}\,\.\=])'), r'\alpha')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()eta(?=\s|[\$\d\w\\\}\,\.\=])'), r'\beta')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()amma(?=\s|[\$\d\w\\\}\,\.\=])'), r'\gamma')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()ambda(?=\s|[\$\d\w\\\}\,\.\=])'), r'\lambda')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()mega(?=\s|[\$\d\w\\\}\,\.\=])'), r'\omega')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()circ(?=\s|[\$\d\w\\\}\,\.\=])'), r'\circ')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()infty(?=\s|[\$\d\w\\\}\,\.\=])'), r'\infty')
        .replaceAll(RegExp(r'(?<=\s|\$|\||^|\()approx(?=\s|[\$\d\w\\\}\,\.\=])'), r'\approx');

    // Auto-heal corrupted LaTeX commands where \r was previously stripped (e.g. \left( ... ight) -> \left( ... \right))
    text = text.replaceAllMapped(
      RegExp(r'(\\left\s*[(\[{|.]\s*[^\\)]*?)(?:\\?r?ight|\bight)\s*([)\]}|.])'),
      (m) => '${m.group(1)}\\right${m.group(2)}',
    );
    text = text.replaceAll(RegExp(r'(?<=\s|\(|\{|^)ight\b'), r'\right');
    text = text.replaceAll(RegExp(r'(?<!\\)\bight([)\]}|.])'), r'\right$1');
    text = text.replaceAll(RegExp(r'(?<!\\)\bightarrow\b'), r'\rightarrow');
    text = text.replaceAll(RegExp(r'(?<!\\)\bightleftharpoons\b'), r'\rightleftharpoons');

    // Normalize corrupted/unescaped LaTeX arrows and equilibrium symbols
    text = text.replaceAll(RegExp(r'\\?rightleftharpoons', caseSensitive: false), ' ⇌ ');
    text = text.replaceAll(RegExp(r'\\?leftrightharpoons', caseSensitive: false), ' ⇌ ');
    text = text.replaceAll(RegExp(r'\\?leftrightarrow', caseSensitive: false), ' ⇌ ');

    // 0c. Auto-wrap unwrapped vector equations and modulus with pipes: |...| = |...|
    text = text.replaceAllMapped(
      RegExp(
        r'(?<!\$)(?:\||\u007C)\s*(\\vec\{[^\}]+\}\s*[\+\-]\s*\\vec\{[^\}]+\})\s*(?:\||\u007C)\s*=\s*(?:\||\u007C)\s*(\\vec\{[^\}]+\}\s*[\+\-]\s*\\vec\{[^\}]+\})\s*(?:\||\u007C)(?!\$)',
      ),
      (m) => '\$|${m.group(1)}| = |${m.group(2)}|\$',
    );
    text = text.replaceAllMapped(
      RegExp(
        r'(?<!\$)(?:\||\u007C)\s*(\\vec\{[^\}]+\})\s*(?:\||\u007C)\s*([=><\+\-])\s*([0-9\.]+|\\vec\{[^\}]+\})(?!\$)',
      ),
      (m) => '\$|${m.group(1)}| ${m.group(2)} ${m.group(3)}\$',
    );
    text = text.replaceAllMapped(
      RegExp(
        r'(?<!\$)(?:\||\u007C)\s*(\\vec\{[^\}]+\}\s*\\times\s*\\vec\{[^\}]+\})\s*(?:\||\u007C)(?!\$)',
      ),
      (m) => '\$|${m.group(1)}|\$',
    );

    // 0d. Normalize accidental ASCII pipes '|' used as Bengali clause/sentence delimiters
    text = text.replaceAllMapped(
      RegExp(r'(?<=[a-zA-Z0-9\u0980-\u09FF\$\}])\s*\|(?=\s+[\u0980-\u09FF])'),
      (m) => ' ।',
    );

    // 0e. Visual separation between inline math and Bengali dāri (।) or question marks
    // Prevents italic math like "$R$।" from colliding and looking like "R|" or "RI"
    text = text.replaceAllMapped(
      RegExp(r'(\$[^\$\n]+\$)([\।\?!])'),
      (m) => '${m.group(1)}\u2009${m.group(2)}',
    );

    // 0f. Normalize ratio colons: "3 : 5" -> "$3:5$"
    text = text.replaceAllMapped(
      RegExp(r'(?<!\$)\b(\d+)\s*:\s*(\d+)\b(?!\$)'),
      (m) => '\$${m.group(1)}:${m.group(2)}\$',
    );

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
    text = text.replaceAll(RegExp(r'\^\s*\\circ\s*\\text\{C\}', caseSensitive: false), '°C');
    text = text.replaceAll(RegExp(r'\^\s*\\circ\s*C', caseSensitive: false), '°C');
    text = text.replaceAll(RegExp(r'\^\s*\\circ', caseSensitive: false), '°');
    text = text.replaceAllMapped(
      RegExp(r'(\d+(?:\.\d+)?)\s*(?:°C|°)\b'),
      (m) => '${m.group(1)}\u00A0${m.group(0)!.contains('°C') ? '°C' : '°'}',
    );

    // 6. Auto-detect unescaped Greek letters & common LaTeX math in Bengali questions
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

    // Only force "নিচের কোনটি সঠিক?" onto a separate line if there are Roman numerals or numbered statements
    final hasItems = RegExp(r'(?:\([iIvVxX0-9]+\)|[iIvVxX0-9]+\.)').hasMatch(text);
    if (hasItems) {
      text = text.replaceAllMapped(
        RegExp(r'(?:\s+|^|\n)(নিচের কোনটি সঠিক\?|উদ্দীপকের আলোকে উত্তর দাও:|উদ্দীপকটি পড়ে নিচের প্রশ্নের উত্তর দাও:)'),
        (m) => '\n\n${m.group(1)}',
      );
    } else {
      // Keep question flowing as a continuous single sentence
      text = text.replaceAll(RegExp(r'\s*\n+\s*(নিচের কোনটি সঠিক\?|কোনটি সঠিক\?)'), r' $1');
    }

    // Clean up excessive blank lines (max 2)
    text = text.replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();

    // Restore protected Markdown tables
    if (tables.isNotEmpty) {
      text = restoreTables(text, tables);
    }

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

      // Check if previous buffer ended with sentence-terminating punctuation
      final prevText = buffer.toString().trimRight();
      final prevEndsWithPunct = RegExp(r'[।\?\!\:\;]$').hasMatch(prevText);

      // Check if line is an intentional list item, section header, or equation line
      final isNumberedItem = RegExp(
        r'^(?:\([iIvVxX0-9a-zA-Z\u0980-\u09fa]+\)|[iIvVxX0-9a-zA-Z\u0980-\u09fa]+[\.\)]|\-|\*|\#)',
      ).hasMatch(line);

      // Real Markdown table rows require multiple pipes: | a | b |
      final isRealTableLine = RegExp(r'^\|.+?\|.+?\|$').hasMatch(line);

      final isEquationLine = line.contains(r'\xrightarrow') ||
          line.contains(r'\xrightleftharpoons') ||
          line.contains('@@CHEM_ARROW') ||
          line.startsWith(r'$$') ||
          line.contains('→') ||
          line.contains('⟶') ||
          line.contains('⇌') ||
          line.contains('⇄');

      final isPunctuationOnly = RegExp(r'^[।,\.\?\!:\;]').hasMatch(line);

      if (isNumberedItem || isEquationLine || isRealTableLine) {
        buffer.write('\n\n');
        buffer.write(line);
      } else if (prevEndsWithPunct &&
          (line.startsWith('উদ্দীপক') ||
              line.startsWith('ধরি') ||
              line.startsWith('দেওয়া আছে') ||
              line.startsWith('দেয়া আছে') ||
              line.startsWith('সুতরাং') ||
              line.startsWith('অতএব'))) {
        buffer.write('\n\n');
        buffer.write(line);
      } else if (isPunctuationOnly) {
        buffer.write(line);
      } else {
        // Smoothly merge intra-sentence linebreaks into continuous flowing text
        buffer.write(' ');
        buffer.write(line);
      }
    }

    return buffer.toString().replaceAll(placeholder, '\n\n');
  }

  /// Automatically wraps raw unescaped LaTeX expressions (like \frac{...}{...} or \epsilon_0\mu_0 or \vec{A}) in $...$
  static String _wrapUnescapedLatexMath(String text) {
    if (!text.contains(r'\') && !text.contains('^') && !text.contains('_')) return text;

    final trimmed = text.trim();
    // Never wrap if text contains natural language prose (3 or more spaced words)
    final hasMultipleSpacedWords =
        RegExp(r'[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}').hasMatch(trimmed);
    if (hasMultipleSpacedWords) return text;

    // If the whole string is a pure LaTeX formula without dollar signs
    if (!trimmed.contains(r'$') &&
        !RegExp(r'[\u0980-\u09FF]').hasMatch(trimmed) &&
        (trimmed.contains(r'\frac') ||
            trimmed.contains(r'\sqrt') ||
            trimmed.contains(r'\left') ||
            trimmed.contains(r'\right') ||
            trimmed.contains(r'\Delta') ||
            trimmed.contains(r'\vec') ||
            trimmed.contains(r'\pm') ||
            trimmed.contains(r'\times') ||
            trimmed.contains(r'\sum') ||
            trimmed.contains(r'\int') ||
            trimmed.contains(r'\alpha') ||
            trimmed.contains(r'\beta') ||
            trimmed.contains(r'\theta') ||
            trimmed.contains(r'\pi') ||
            trimmed.contains(r'\omega') ||
            trimmed.contains(r'\mu') ||
            trimmed.contains(r'\sigma') ||
            trimmed.contains('^') ||
            trimmed.contains('_'))) {
      return '\$$trimmed\$';
    }

    return text;
  }

  /// Extracts Markdown tables and replaces them with unique placeholders
  /// so that regex sanitization (pipes, punctuation, linebreaks) does not mutate table structures.
  static (String, List<String>) extractAndProtectTables(String text) {
    final lines = text.split('\n');
    final tables = <String>[];
    final outputLines = <String>[];
    var currentTableLines = <String>[];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      final trimmed = line.trim();
      final isTableLine =
          trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length > 2;

      if (isTableLine) {
        // Protect pipes inside math formulas in table cells: $|$ -> $\vert $
        final safeLine = line.replaceAllMapped(RegExp(r'\$([^$]+)\$'), (m) {
          final math = m.group(1) ?? '';
          return '\$${math.replaceAll('|', r'\vert ')}\$';
        });
        currentTableLines.add(safeLine);
      } else {
        if (currentTableLines.isNotEmpty) {
          final placeholder = '@@TABLEBLOCK${tables.length}@@';
          tables.add(currentTableLines.join('\n'));
          outputLines.add(placeholder);
          currentTableLines = [];
        }
        outputLines.add(line);
      }
    }

    if (currentTableLines.isNotEmpty) {
      final placeholder = '@@TABLEBLOCK${tables.length}@@';
      tables.add(currentTableLines.join('\n'));
      outputLines.add(placeholder);
    }

    return (outputLines.join('\n'), tables);
  }

  /// Restores protected Markdown tables from placeholders with clean boundary spacing
  static String restoreTables(String text, List<String> tables) {
    var result = text;
    for (int i = 0; i < tables.length; i++) {
      result = result.replaceAll('@@TABLEBLOCK$i@@', '\n\n${tables[i]}\n\n');
    }
    return result;
  }
}
