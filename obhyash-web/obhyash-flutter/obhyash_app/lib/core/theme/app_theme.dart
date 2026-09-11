import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'button_3d_theme.dart';

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
  static TextTheme _bumpTextTheme(TextTheme theme) {
    TextStyle? bump(TextStyle? style) =>
        style?.copyWith(fontSize: (style.fontSize ?? 14) + 1.0);

    return theme.copyWith(
      displayLarge: bump(theme.displayLarge),
      displayMedium: bump(theme.displayMedium),
      displaySmall: bump(theme.displaySmall),
      headlineLarge: bump(theme.headlineLarge),
      headlineMedium: bump(theme.headlineMedium),
      headlineSmall: bump(theme.headlineSmall),
      titleLarge: bump(theme.titleLarge),
      titleMedium: bump(theme.titleMedium),
      titleSmall: bump(theme.titleSmall),
      bodyLarge: bump(theme.bodyLarge),
      bodyMedium: bump(theme.bodyMedium),
      bodySmall: bump(theme.bodySmall),
      labelLarge: bump(theme.labelLarge),
      labelMedium: bump(theme.labelMedium),
      labelSmall: bump(theme.labelSmall),
    );
  }

  static TextTheme _applyDualFontStack(TextTheme theme) {
    final interFont = GoogleFonts.inter().fontFamily;
    TextStyle apply(TextStyle? style) {
      final s = style ?? const TextStyle();
      return s.copyWith(
        fontFamily: interFont,
        fontFamilyFallback: const ['HindSiliguri', 'sans-serif'],
      );
    }

    return theme.copyWith(
      displayLarge: apply(theme.displayLarge),
      displayMedium: apply(theme.displayMedium),
      displaySmall: apply(theme.displaySmall),
      headlineLarge: apply(theme.headlineLarge),
      headlineMedium: apply(theme.headlineMedium),
      headlineSmall: apply(theme.headlineSmall),
      titleLarge: apply(theme.titleLarge),
      titleMedium: apply(theme.titleMedium),
      titleSmall: apply(theme.titleSmall),
      bodyLarge: apply(theme.bodyLarge),
      bodyMedium: apply(theme.bodyMedium),
      bodySmall: apply(theme.bodySmall),
      labelLarge: apply(theme.labelLarge),
      labelMedium: apply(theme.labelMedium),
      labelSmall: apply(theme.labelSmall),
    );
  }

  static ThemeData get lightTheme {
    final baseTextTheme = _applyDualFontStack(
      _bumpTextTheme(
        GoogleFonts.interTextTheme(ThemeData.light().textTheme),
      ),
    );

    return ThemeData(
      brightness: Brightness.light,
      fontFamily: GoogleFonts.inter().fontFamily,
      fontFamilyFallback: const ['HindSiliguri', 'sans-serif'],
      primaryColor: AppColors.viridianForest,
      scaffoldBackgroundColor: const Color(0xFFFAFAF9),
      textTheme: baseTextTheme,
      primaryTextTheme: baseTextTheme,
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
        titleTextStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryLight,
        ),
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
        style: ButtonStyle(
          elevation: const WidgetStatePropertyAll(0),
          backgroundColor: const WidgetStatePropertyAll(AppColors.viridianForest),
          foregroundColor: const WidgetStatePropertyAll(Colors.white),
          textStyle: const WidgetStatePropertyAll(
            TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          shape: WidgetStateProperty.resolveWith<OutlinedBorder>((states) {
            if (states.contains(WidgetState.pressed)) {
              return const Button3DShapeBorder(
                depth: 1.0,
                borderRadius: 14.0,
                shadowColor: AppColors.brandGreenDark,
              );
            }
            return const Button3DShapeBorder(
              depth: 4.5,
              borderRadius: 14.0,
              shadowColor: AppColors.brandGreenDark,
            );
          }),
          padding: WidgetStateProperty.resolveWith<EdgeInsetsGeometry>((states) {
            if (states.contains(WidgetState.pressed)) {
              return const EdgeInsets.only(top: 17, bottom: 11, left: 20, right: 20);
            }
            return const EdgeInsets.only(top: 14, bottom: 14, left: 20, right: 20);
          }),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.viridianForest,
          textStyle: const TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.viridianForest,
          textStyle: const TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      tabBarTheme: const TabBarThemeData(
        labelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 14,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedLabelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 12,
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        hintStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          color: AppColors.textSecondaryLight,
        ),
        labelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          color: AppColors.textSecondaryLight,
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        elevation: 0,
        titleTextStyle: const TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryLight,
        ),
        contentTextStyle: const TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 14,
          color: AppColors.textSecondaryLight,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.coolGreyLight, width: 1),
        ),
      ),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: Colors.white,
        headerBackgroundColor: AppColors.viridianForest,
        headerForegroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        dividerColor: AppColors.coolGreyLight,
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
    final baseTextTheme = _applyDualFontStack(
      _bumpTextTheme(
        GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      ),
    );
    
    return ThemeData(
      brightness: Brightness.dark,
      fontFamily: GoogleFonts.inter().fontFamily,
      fontFamilyFallback: const ['HindSiliguri', 'sans-serif'],
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
      primaryTextTheme: baseTextTheme,
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
        titleTextStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryDark,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.refinedCharcoal,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.refinedCharcoal, width: 0.5),
        ),
      ),
      tabBarTheme: const TabBarThemeData(
        labelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 14,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF000000), // OLED Black
        selectedItemColor: AppColors.viridianForest,
        unselectedItemColor: AppColors.textSecondaryDark,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 12,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ButtonStyle(
          elevation: const WidgetStatePropertyAll(0),
          backgroundColor: const WidgetStatePropertyAll(AppColors.viridianForest),
          foregroundColor: const WidgetStatePropertyAll(Colors.white),
          textStyle: const WidgetStatePropertyAll(
            TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          shape: WidgetStateProperty.resolveWith<OutlinedBorder>((states) {
            if (states.contains(WidgetState.pressed)) {
              return const Button3DShapeBorder(
                depth: 1.0,
                borderRadius: 14.0,
                shadowColor: AppColors.brandGreenDark,
              );
            }
            return const Button3DShapeBorder(
              depth: 4.5,
              borderRadius: 14.0,
              shadowColor: AppColors.brandGreenDark,
            );
          }),
          padding: WidgetStateProperty.resolveWith<EdgeInsetsGeometry>((states) {
            if (states.contains(WidgetState.pressed)) {
              return const EdgeInsets.only(top: 17, bottom: 11, left: 20, right: 20);
            }
            return const EdgeInsets.only(top: 14, bottom: 14, left: 20, right: 20);
          }),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.viridianForest,
          textStyle: const TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.viridianForest,
          textStyle: const TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.refinedCharcoal,
        hintStyle: const TextStyle(
          fontFamily: 'HindSiliguri',
          color: AppColors.textSecondaryDark,
        ),
        labelStyle: const TextStyle(
          fontFamily: 'HindSiliguri',
          color: AppColors.textSecondaryDark,
        ),
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
        backgroundColor: const Color(0xFF000000), // OLED Pure Black
        elevation: 0,
        titleTextStyle: const TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryDark,
        ),
        contentTextStyle: const TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 14,
          color: AppColors.textSecondaryDark,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: Color.fromARGB(255, 18, 18, 20), width: 1),
        ),
      ),
      datePickerTheme: const DatePickerThemeData(
        backgroundColor: Color(0xFF171717),
        headerBackgroundColor: Color(0xFF064E3B),
        headerForegroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        dividerColor: Color(0xFF27272A),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Color(0xFF000000), // OLED Pure Black
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
    );
  }
}
