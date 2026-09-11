import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// AppTypography embodies the Chorcha & Duolingo benchmark dual-font architecture:
/// 1. Inter Regular / SemiBold / Bold (Variable): For UI, Buttons, English, Numbers & Units
/// 2. Hind Siliguri: For Bengali Unicode characters via font fallback
/// 3. MathJax & KaTeX: For math expressions, variables (W, S, M, V), and AMS symbols
class AppTypography {
  AppTypography._();

  static String get _inter => GoogleFonts.inter().fontFamily ?? 'Inter';
  static const List<String> fallback = ['HindSiliguri', 'sans-serif'];

  // --- 1. Exam & Practice Core (Chorcha Benchmark) ---

  /// Question Stem: 16.5px, SemiBold (w600), comfortable 1.5 line-height
  static TextStyle questionStem({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 16.5,
        fontWeight: FontWeight.w600,
        height: 1.5,
        color: color,
      );

  /// MCQ Option Text: 16.0px, Medium (w500)
  static TextStyle optionText({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 16.0,
        fontWeight: FontWeight.w500,
        height: 1.45,
        color: color,
      );

  /// MCQ Option Serial Badge (ক, খ, গ, ঘ): 13.0px, SemiBold (w600)
  static TextStyle optionBadge({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 13.0,
        fontWeight: FontWeight.w600,
        color: color,
      );

  /// Explanation Title ("💡 ব্যাখ্যা"): 16.5px, Bold (w700)
  static TextStyle explanationTitle({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 16.5,
        fontWeight: FontWeight.w700,
        height: 1.35,
        color: color,
      );

  /// Explanation Body: 14.5px, Regular (w400), relaxed 1.6 line-height
  static TextStyle explanationBody({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 14.5,
        fontWeight: FontWeight.w400,
        height: 1.6,
        color: color,
      );

  /// Explanation Metadata ("দৈনিক ব্যাখ্যা বাকি - ৪"): 12.0px, Regular (w400)
  static TextStyle explanationMeta({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 12.0,
        fontWeight: FontWeight.w400,
        color: color,
      );

  /// Exam Timer: 15.0px, Bold (w700) with Tabular Numerals
  static TextStyle timer({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 15.0,
        fontWeight: FontWeight.w700,
        fontFeatures: const [FontFeature.tabularFigures()],
        color: color,
      );

  // --- 2. Headings & Hero ---

  /// Hero Score (Result Screen): 34px, Extra Bold (w800)
  static TextStyle heroScore({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 34.0,
        fontWeight: FontWeight.w800,
        height: 1.2,
        color: color,
      );

  /// Page Main Title / Greeting: 22.0px, Bold (w700)
  static TextStyle heroTitle({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 22.0,
        fontWeight: FontWeight.w700,
        height: 1.3,
        color: color,
      );

  /// Section Header: 17.5px, Bold (w700)
  static TextStyle sectionHeader({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 17.5,
        fontWeight: FontWeight.w700,
        height: 1.35,
        color: color,
      );

  /// Card Title: 16.0px, SemiBold (w600)
  static TextStyle cardTitle({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 16.0,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: color,
      );

  // --- 3. Buttons & CTAs ---

  /// Primary 3D Button: 16.0px, Bold (w700), crisp letter-spacing
  static TextStyle buttonPrimary({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 16.0,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
        color: color,
      );

  /// Secondary Button: 15.0px, SemiBold (w600)
  static TextStyle buttonSecondary({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 15.0,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.1,
        color: color,
      );

  // --- 4. Badges, Tags & Metas ---

  /// Category / Board Tag ("ঢাকা বোর্ড ২৩"): 11.5px, SemiBold (w600)
  static TextStyle tag({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 11.5,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
        color: color,
      );

  /// Subtitle / Secondary Muted: 13.0px, Regular (w400)
  static TextStyle subtitleMuted({Color? color}) => TextStyle(
        fontFamily: _inter,
        fontFamilyFallback: fallback,
        fontSize: 13.0,
        fontWeight: FontWeight.w400,
        height: 1.4,
        color: color,
      );
}
