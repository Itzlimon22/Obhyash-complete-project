import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppSpacing {
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
}

class AppTheme {
  // ---------------------------------------------------------------------------
  // 1. STATIC CONSTANTS (Access these directly: AppTheme.success)
  // ---------------------------------------------------------------------------

  static const Color primary = Color(0xFF3B82F6); // Blue
  static const Color secondary = Color(0xFFF59E0B); // Amber
  static const Color error = Color(0xFFEF4444); // Red

  // ✅ ADDED THIS MISSING LINE:
  static const Color success = Color(0xFF10B981); // Emerald Green

  // Text Colors
  static const Color textMain = Colors.white;
  static const Color textLight = Color(0xFF9CA3AF); // Grey

  // Backgrounds
  static const Color background = Color(0xFF0B0D10);
  static const Color surface = Color(0xFF151921);

  // Dashboard Accents
  static const Color cardArchive = Color(0xFFD97706);
  static const Color cardPractice = Color(0xFF6366F1);
  static const Color cardLive = Color(0xFFEC4899);
  static const Color cardMock = Color(0xFF0EA5E9);
  static const Color cardAI = Color(0xFF8B5CF6);
  static const Color cardLeaderboard = Color(0xFFF59E0B);

  // ---------------------------------------------------------------------------
  // 2. LIGHT MODE CONFIG
  // ---------------------------------------------------------------------------
  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: const Color(0xFFF3F4F6),

    colorScheme: const ColorScheme.light(
      primary: primary,
      surface: Colors.white,
      onSurface: Color(0xFF1F2937),
      error: error,
    ),

    textTheme: GoogleFonts.poppinsTextTheme(ThemeData.light().textTheme),

    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFFF3F4F6),
      elevation: 0,
      iconTheme: IconThemeData(color: Color(0xFF1F2937)),
      titleTextStyle: TextStyle(
        color: Color(0xFF1F2937),
        fontSize: 20,
        fontWeight: FontWeight.bold,
        fontFamily: 'Poppins',
      ),
    ),

    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.05),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.all(AppSpacing.md),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
    ),
  );

  // ---------------------------------------------------------------------------
  // 3. DARK MODE CONFIG (The Obyash Look)
  // ---------------------------------------------------------------------------
  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: background,

    colorScheme: const ColorScheme.dark(
      primary: primary,
      surface: surface,
      onSurface: Colors.white,
      error: error,
    ),

    textTheme: GoogleFonts.poppinsTextTheme(
      ThemeData.dark().textTheme,
    ).apply(bodyColor: Colors.white, displayColor: Colors.white),

    appBarTheme: const AppBarTheme(
      backgroundColor: background,
      elevation: 0,
      iconTheme: IconThemeData(color: Colors.white),
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.bold,
        fontFamily: 'Poppins',
      ),
    ),

    cardTheme: CardThemeData(
      color: surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface,
      contentPadding: const EdgeInsets.all(AppSpacing.md),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      hintStyle: const TextStyle(color: textLight),
    ),
  );
}
