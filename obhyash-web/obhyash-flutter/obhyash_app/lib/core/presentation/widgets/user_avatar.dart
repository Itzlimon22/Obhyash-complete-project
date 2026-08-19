import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Helper to generate DiceBear avatar URL matching web app's `lib/avatar-utils.ts`.
String getRandomAvatar({String? gender, required String seed}) {
  final cleanGender = (gender ?? 'Other').toLowerCase();
  String style = 'fun-emoji';
  if (cleanGender == 'male') {
    style = 'adventurer';
  } else if (cleanGender == 'female') {
    style = 'lorelei';
  }

  return 'https://api.dicebear.com/7.x/$style/svg?seed=${Uri.encodeComponent(seed.isNotEmpty ? seed : "default")}&scale=120&radius=0&backgroundColor=b6e3f4,c0aede,d1d4f9';
}

/// Resolves raw avatar path or URL into a full public URL.
String? resolveAvatarUrl(String? raw) {
  if (raw == null || raw.isEmpty || raw == 'null') return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  try {
    return Supabase.instance.client.storage.from('avatars').getPublicUrl(raw);
  } catch (_) {
    return raw;
  }
}

/// Consistent avatar colors matching the web app.
Color getAvatarBgColor(String name) {
  const colors = <Color>[
    Color(0xFFB91C1C), // Red
    Color(0xFF059669), // Emerald
    Color(0xFF1E3A8A), // Blue
    Color(0xFFD97706), // Amber
    Color(0xFF7C3AED), // Purple
    Color(0xFF06B6D4), // Cyan
    Color(0xFFEC4899), // Pink
  ];
  if (name.isEmpty) return colors[0];
  int code = 0;
  for (final c in name.runes) {
    code += c;
  }
  return colors[code % colors.length];
}

/// Reusable UserAvatar widget matching the web app's `UserAvatar.tsx`.
/// Displays:
/// 1. Custom uploaded avatar (Supabase Storage or external URL)
/// 2. If no custom avatar, auto-generates a DiceBear cartoon character SVG
/// 3. If image fails to load or offline, displays first letter initial
class UserAvatar extends StatelessWidget {
  final String? avatarUrl;
  final String name;
  final String? gender;
  final String? id;
  final double size;
  final bool showBorder;
  final Color? borderColor;
  final double borderWidth;
  final bool useDiceBearFallback;
  final bool isPro;

  const UserAvatar({
    super.key,
    this.avatarUrl,
    required this.name,
    this.gender,
    this.id,
    this.size = 40,
    this.showBorder = false,
    this.borderColor,
    this.borderWidth = 2,
    this.useDiceBearFallback = true,
    this.isPro = false,
  });

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final resolvedCustom = resolveAvatarUrl(avatarUrl);
    final hasCustom = resolvedCustom != null && resolvedCustom.isNotEmpty;
    
    // Choose image URL: custom or DiceBear
    final imageUrl = hasCustom
        ? resolvedCustom
        : (useDiceBearFallback
            ? getRandomAvatar(gender: gender, seed: (id != null && id!.isNotEmpty) ? id! : (name.isNotEmpty ? name : 'default'))
            : null);

    final isSvg = imageUrl != null && (imageUrl.toLowerCase().contains('.svg') || imageUrl.contains('dicebear.com'));
    final bgColor = getAvatarBgColor(name);

    Widget fallbackInitials() => Container(
      width: size,
      height: size,
      color: bgColor,
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            color: Colors.white,
            fontSize: size * 0.42,
            fontWeight: FontWeight.bold,
            fontFamily: 'Anek Bangla',
          ),
        ),
      ),
    );

    Widget avatarContent;
    if (imageUrl == null) {
      avatarContent = fallbackInitials();
    } else if (isSvg) {
      avatarContent = SvgPicture.network(
        imageUrl,
        fit: BoxFit.cover,
        width: size,
        height: size,
        placeholderBuilder: (_) => fallbackInitials(),
      );
    } else {
      avatarContent = CachedNetworkImage(
        imageUrl: imageUrl,
        fit: BoxFit.cover,
        width: size,
        height: size,
        placeholder: (_, __) => fallbackInitials(),
        errorWidget: (_, __, ___) => fallbackInitials(),
      );
    }

    final baseAvatar = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: bgColor,
        border: showBorder && !isPro
            ? Border.all(
                color: borderColor ?? Colors.white,
                width: borderWidth,
              )
            : null,
        boxShadow: showBorder
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: ClipOval(
        child: avatarContent,
      ),
    );

    if (!isPro) return baseAvatar;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ringPad = size >= 60 ? 3.0 : 2.2;

    return Container(
      width: size + ringPad * 2 + 3,
      height: size + ringPad * 2 + 3,
      padding: EdgeInsets.all(ringPad),
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: SweepGradient(
          colors: [
            Color(0xFF4285F4), // Google Blue
            Color(0xFF9B72CB), // Gemini Purple
            Color(0xFFD96570), // Google Coral / Pink
            Color(0xFFF4B400), // Google Amber
            Color(0xFF34A853), // Google Green
            Color(0xFF4285F4), // Loop
          ],
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isDark ? const Color(0xFF141414) : Colors.white,
        ),
        padding: const EdgeInsets.all(1.5),
        child: baseAvatar,
      ),
    );
  }
}
