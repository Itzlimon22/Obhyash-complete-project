import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Brand Strict Palette
  static const Color brandGreen = Color(0xFF059669); // Deep Emerald Green
  static const Color brandRed = Color(0xFFB91C1C); // Deep Crimson Red
  static const Color warningGold = Color(0xFF1E3A8A); // Warm Gold Accent

  // Backgrounds
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color softMint = Color(0xFFECFDF5);
  
  // Premium Dark Mode Colors (Chorcha / Apple style)
  static const Color deepSlate = Color(0xFF000000); // True OLED Black
  static const Color darkSlate = Color(0xFF1C1C1E); // Elevated Surface (Very Dark Gray)
  static const Color higherSurface = Color(0xFF1C1C1E); // Apple style elevated card

  // Borders & Dividers
  static const Color coolGreyLight = Color(0xFFE2E8F0);
  static const Color coolGreyDark = Color(0xFF27272A); // Zinc 800 (for borders)

  // Text
  static const Color textPrimaryLight = Color(0xFF000000); // deep slate
  static const Color textSecondaryLight = Color(0xFF64748B); // slate 500

  // Softened Dark Mode Text (Easier on eyes, premium feel)
  static const Color textPrimaryDark = Color(0xFFE5E5E5); // Off-white for primary text
  static const Color textSecondaryDark = Color(0xFFA1A1AA); // Zinc 400 for secondary text

  // Semantic
  static const Color error = Color(0xFFEF4444); // Brighter red for dark mode
  static const Color success = Color(0xFF10B981); // Brighter green for dark mode
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: AppColors.brandGreen,
      scaffoldBackgroundColor: AppColors.pureWhite,
      textTheme: GoogleFonts.anekBanglaTextTheme(ThemeData.light().textTheme),
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
    final baseTextTheme = GoogleFonts.anekBanglaTextTheme(ThemeData.dark().textTheme);
    
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: AppColors.brandGreen,
      scaffoldBackgroundColor: AppColors.deepSlate,
      textTheme: baseTextTheme.copyWith(
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(color: AppColors.textPrimaryDark),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(color: AppColors.textPrimaryDark),
        bodySmall: baseTextTheme.bodySmall?.copyWith(color: AppColors.textSecondaryDark),
        titleLarge: baseTextTheme.titleLarge?.copyWith(color: AppColors.textPrimaryDark),
        titleMedium: baseTextTheme.titleMedium?.copyWith(color: AppColors.textPrimaryDark),
        titleSmall: baseTextTheme.titleSmall?.copyWith(color: AppColors.textSecondaryDark),
        headlineLarge: baseTextTheme.headlineLarge?.copyWith(color: AppColors.textPrimaryDark),
        headlineMedium: baseTextTheme.headlineMedium?.copyWith(color: AppColors.textPrimaryDark),
        headlineSmall: baseTextTheme.headlineSmall?.copyWith(color: AppColors.textPrimaryDark),
      ),
      colorScheme: const ColorScheme.dark(
        primary: AppColors.brandGreen,
        secondary: AppColors.warningGold,
        surface: AppColors.darkSlate,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimaryDark,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.deepSlate,
        foregroundColor: AppColors.textPrimaryDark,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: AppColors.higherSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.coolGreyDark, width: 0.5),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkSlate,
        selectedItemColor: AppColors.brandGreen,
        unselectedItemColor: AppColors.textSecondaryDark,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: AppColors.brandGreen,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSlate,
        hintStyle: const TextStyle(color: AppColors.textSecondaryDark),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.coolGreyDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.coolGreyDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.brandGreen, width: 2),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.higherSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.coolGreyDark, width: 0.5),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.higherSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
    );
  }
}

