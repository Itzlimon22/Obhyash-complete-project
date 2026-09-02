import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:obhyash_app/core/presentation/widgets/formula_math_view.dart';

void main() {
  testWidgets('Renders chemical formula with nested Bengali condition arrow properly', (tester) async {
    const latex = r"\text{C}_2\text{H}_5\text{OH} \xrightarrow{\text{গাঢ় } \text{H}_2\text{SO}_4, 165-170^\circ\text{C}} \text{CH}_2=\text{CH}_2 + \text{H}_2\text{O}, \quad 2\text{C}_2\text{H}_5\text{OH} \xrightarrow{\text{গাঢ় } \text{H}_2\text{SO}_4, 140^\circ\text{C}} \text{C}_2\text{H}_5-\text{O}-\text{C}_2\text{H}_5";

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: FormulaMathView(
            latex: latex,
            isDark: true,
          ),
        ),
      ),
    );

    expect(find.textContaining('গাঢ়'), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Renders Anti-Markovnikov equation properly without raw LaTeX braces', (tester) async {
    const latex = r"\text{CH}_3-\text{CH}=\text{CH}_2 + \text{HBr} \xrightarrow{\text{R}_2\text{O}_2 (\text{জৈব পারঅক্সাইড})} \text{CH}_3-\text{CH}_2-\text{CH}_2\text{Br} \; (\text{১-ব্রোমোপ্রোপেন } 99\%)";

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: FormulaMathView(
            latex: latex,
            isDark: true,
          ),
        ),
      ),
    );

    // Ensure raw LaTeX text commands are NOT leaked as visible text
    expect(find.textContaining(r'\text{'), findsNothing);
    expect(find.textContaining(r'\xrightarrow'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}
