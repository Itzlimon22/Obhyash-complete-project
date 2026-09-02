import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Brand Strict Palette (Custom Defined)
  static const Color deepMidnightTeal = Color(0xFF092328); // #092328 - Deep Hero & Surface
  static const Color viridianForest = Color(0xFF12544F);   // #12544F - Primary Action & Brand Teal
  static const Color royalMulberry = Color(0xFF601D49);    // #601D49 - Gamification, Special & Mulberry
  static const Color refinedCharcoal = Color(0xFF2C2C2C);  // #2C2C2C - Solid Dark Neutral, Card & Borders
  static const Color deepCrimson = Color(0xFF740A03);      // #740A03 - Danger, Urgent & Red Accent

  // Alias bindings for consistent app components
  static const Color brandGreen = Color(0xFF12544F); // #12544F
  static const Color brandGreenLight = Color(0xFF12544F);
  static const Color brandGreenDark = Color(0xFF092328);
  static const Color brandRed = Color(0xFF740A03); // #740A03
  static const Color warningGold = Color(0xFF601D49); // #601D49

  // Backgrounds
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color softMint = Color(0xFFE6F0EC);
  
  // OLED Pure Black Dark Mode
  static const Color deepSlate = Color(0xFF000000); // Pure OLED Black #000000
  static const Color darkSlate = Color(0xFF092328); // Deep solid #092328
  static const Color higherSurface = Color(0xFF2C2C2C); // Solid #2C2C2C

  // Borders & Dividers
  static const Color coolGreyLight = Color(0xFFE5E7EB);
  static const Color coolGreyDark = Color(0xFF2C2C2C); // Solid #2C2C2C

  // Text
  static const Color textPrimaryLight = Color(0xFF111827);
  static const Color textSecondaryLight = Color(0xFF6B7280);

  // Softened Dark Mode Text
  static const Color textPrimaryDark = Color(0xFFF4F4F5);
  static const Color textSecondaryDark = Color(0xFFA1A1AA);

  // Semantic
  static const Color error = Color(0xFF740A03); // #740A03
  static const Color success = Color(0xFF12544F); // #12544F
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: AppColors.viridianForest,
      scaffoldBackgroundColor: const Color(0xFFFAFAF9),
      textTheme: GoogleFonts.anekBanglaTextTheme(ThemeData.light().textTheme),
      colorScheme: const ColorScheme.light(
        primary: AppColors.viridianForest,
        secondary: AppColors.royalMulberry,
        surface: Colors.white,
        error: AppColors.deepCrimson,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
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
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: AppColors.viridianForest,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.coolGreyLight, width: 1),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    final baseTextTheme = GoogleFonts.anekBanglaTextTheme(ThemeData.dark().textTheme);
    
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: AppColors.viridianForest,
      scaffoldBackgroundColor: const Color(0xFF000000), // OLED Pure Black
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
        primary: AppColors.viridianForest,
        secondary: AppColors.royalMulberry,
        surface: AppColors.refinedCharcoal,
        error: AppColors.deepCrimson,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimaryDark,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF000000), // OLED Black
        foregroundColor: AppColors.textPrimaryDark,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: AppColors.refinedCharcoal,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.refinedCharcoal, width: 0.5),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF000000), // OLED Black
        selectedItemColor: AppColors.viridianForest,
        unselectedItemColor: AppColors.textSecondaryDark,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: AppColors.viridianForest,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.refinedCharcoal,
        hintStyle: const TextStyle(color: AppColors.textSecondaryDark),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.refinedCharcoal),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.refinedCharcoal),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.viridianForest, width: 2),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.refinedCharcoal,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.refinedCharcoal, width: 1),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.refinedCharcoal,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
    );
  }
}
