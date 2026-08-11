import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Brand Strict Palette
  static const Color brandGreen = Color(0xFF047857); // Deep Emerald Green
  static const Color brandRed = Color(0xFFB91C1C); // Deep Crimson Red
  static const Color warningGold = Color(0xFFF59E0B); // Warm Gold Accent

  // Backgrounds
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color softMint = Color(0xFFECFDF5);
  static const Color deepSlate = Color(0xFF0F172A); // Softer than pure black
  static const Color darkSlate = Color(0xFF1E293B);

  // Borders & Dividers
  static const Color coolGreyLight = Color(0xFFE2E8F0);
  static const Color coolGreyDark = Color(0xFF334155);

  // Text
  static const Color textPrimaryLight = Color(0xFF0F172A); // deep slate
  static const Color textSecondaryLight = Color(0xFF64748B); // slate 500

  static const Color textPrimaryDark = Color(0xFFF1F5F9); // slate 100
  static const Color textSecondaryDark = Color(0xFF94A3B8); // cool grey

  // Semantic
  static const Color error = Color(0xFFB91C1C);
  static const Color success = Color(0xFF047857);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: AppColors.brandGreen,
      scaffoldBackgroundColor: AppColors.pureWhite,
      textTheme: GoogleFonts.hindSiliguriTextTheme(ThemeData.light().textTheme),
      colorScheme: const ColorScheme.light(
        primary: AppColors.brandGreen,
        secondary: AppColors.warningGold,
        surface: Colors.white,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.black,
        onSurface: AppColors.textPrimaryLight,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimaryLight,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.coolGreyLight),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: AppColors.brandGreen,
      scaffoldBackgroundColor: AppColors.deepSlate,
      textTheme: GoogleFonts.hindSiliguriTextTheme(ThemeData.dark().textTheme),
      colorScheme: const ColorScheme.dark(
        primary: AppColors.brandGreen,
        secondary: AppColors.warningGold,
        surface: AppColors.darkSlate,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.black,
        onSurface: AppColors.textPrimaryDark,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.deepSlate,
        foregroundColor: AppColors.textPrimaryDark,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkSlate,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.coolGreyDark),
        ),
      ),
    );
  }
}
