with open("lib/core/theme/app_theme.dart", "r") as f:
    content = f.read()

# Replace the AppColors completely
old_colors = """class AppColors {
  // Brand
  static const Color emerald600 = Color(0xFF059669);
  static const Color emerald700 = Color(0xFF047857);
  static const Color amber400 = Color(0xFFFBBF24);

  // Backgrounds
  static const Color neutral50 = Color(0xFFFAFAFA);
  static const Color neutral100 = Color(0xFFF5F5F5);
  static const Color neutral900 = Color(0xFF171717);
  static const Color neutral950 = Color(0xFF0A0A0A);

  // Borders & Dividers
  static const Color neutral200 = Color(0xFFE5E5E5);
  static const Color neutral300 = Color(0xFFD4D4D4);
  static const Color neutral700 = Color(0xFF404040);
  static const Color neutral800 = Color(0xFF262626);

  // Text
  static const Color textPrimaryLight = Color(0xFF171717); // neutral-900
  static const Color textSecondaryLight = Color(0xFF737373); // neutral-500

  static const Color textPrimaryDark = Color(0xFFF5F5F5); // neutral-100
  static const Color textSecondaryDark = Color(0xFFA3A3A3); // neutral-400

  // Semantic
  static const Color error = Color(0xFFDC2626); // red-600
  static const Color success = Color(0xFF10B981); // emerald-500
}"""

new_colors = """class AppColors {
  // Brand Strict Palette
  static const Color brandGreen = Color(0xFF047857); // Deep Emerald Green
  static const Color brandRed = Color(0xFFB91C1C);   // Deep Crimson Red
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
}"""

content = content.replace(old_colors, new_colors)

# Fix ThemeData usages
content = content.replace("AppColors.emerald700", "AppColors.brandGreen")
content = content.replace("AppColors.emerald600", "AppColors.brandGreen")
content = content.replace("AppColors.amber400", "AppColors.warningGold")

content = content.replace("AppColors.neutral50", "AppColors.pureWhite")
content = content.replace("AppColors.neutral100", "AppColors.softMint")

content = content.replace("AppColors.neutral950", "AppColors.deepSlate")
content = content.replace("AppColors.neutral900", "AppColors.darkSlate")

content = content.replace("AppColors.neutral200", "AppColors.coolGreyLight")
content = content.replace("AppColors.neutral800", "AppColors.coolGreyDark")

with open("lib/core/theme/app_theme.dart", "w") as f:
    f.write(content)
