import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/presentation/widgets/app_refresh_indicator.dart';
import '../../../core/presentation/widgets/user_avatar.dart';
import '../../../core/utils/app_popups.dart';
import '../../dashboard/providers/dashboard_providers.dart';

class AccountLinkingView extends ConsumerStatefulWidget {
  const AccountLinkingView({super.key});

  @override
  ConsumerState<AccountLinkingView> createState() => _AccountLinkingViewState();
}

class _AccountLinkingViewState extends ConsumerState<AccountLinkingView> {
  bool _isLinking = false;

  Future<void> _linkGoogleAccount() async {
    setState(() => _isLinking = true);
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.linkIdentity(
        OAuthProvider.google,
        redirectTo: 'io.supabase.obhyash://login-callback/',
      );
    } catch (e) {
      if (mounted) {
        AppPopups.error(
          context,
          message: 'গুগল অ্যাকাউন্ট লিঙ্ক করতে সমস্যা হয়েছে: $e',
        );
      }
    } finally {
      if (mounted) setState(() => _isLinking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA);
    final cardBg = isDark ? const Color(0xFF18181B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB);

    final user = ref.watch(userProfileProvider).value;
    final supabase = Supabase.instance.client;
    final currentUser = supabase.auth.currentUser;
    final identities = currentUser?.identities ?? [];
    final isGoogleLinked = identities.any((id) => id.provider == 'google');
    final email = currentUser?.email ?? user?.email ?? '';
    final phone = currentUser?.phone ?? user?.phone ?? '';

    return Scaffold(
      backgroundColor: bg,
      body: AppRefreshIndicator(
        onRefresh: () async {
          ref.invalidate(userProfileProvider);
          try {
            await ref.read(userProfileProvider.future);
          } catch (_) {}
          if (mounted) setState(() {});
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          children: [
            // ── Top Summary Card ──────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: borderColor),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x05000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  UserAvatar(
                    id: user?.id ?? '',
                    name: user?.name ?? 'শিক্ষার্থী',
                    avatarUrl: user?.avatarUrl,
                    gender: user?.gender,
                    size: 56,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'শিক্ষার্থী',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white : const Color(0xFF111827),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          email.isNotEmpty ? email : (phone.isNotEmpty ? phone : 'ইউজার অ্যাকাউন্ট'),
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withValues(alpha: isDark ? 0.2 : 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'সক্রিয়',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                        color: Color(0xFF059669),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Section Title ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 10),
              child: Text(
                'সংযুক্ত লগইন মাধ্যমসমূহ',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                ),
              ),
            ),

            // ── Google Account Linking Card ───────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: borderColor),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x05000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      // Google Logo Container
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Image.network(
                            'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                            width: 22,
                            height: 22,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              LucideIcons.globe,
                              color: Color(0xFFEA4335),
                              size: 22,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Google অ্যাকাউন্ট',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? Colors.white : const Color(0xFF111827),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isGoogleLinked
                                  ? 'গুগল অ্যাকাউন্ট সংযুক্ত আছে'
                                  : '১-ক্লিকে দ্রুত ও নিরাপদ লগইন',
                              style: TextStyle(
                                fontSize: 13,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isGoogleLinked)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withValues(alpha: isDark ? 0.2 : 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF059669).withValues(alpha: 0.4),
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                LucideIcons.checkCheck,
                                size: 14,
                                color: Color(0xFF059669),
                              ),
                              SizedBox(width: 4),
                              Text(
                                'সংযুক্ত',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: Color(0xFF059669),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),

                  if (!isGoogleLinked) ...[
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _isLinking ? null : _linkGoogleAccount,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: _isLinking
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.link, size: 16),
                                SizedBox(width: 8),
                                Text(
                                  'Google অ্যাকাউন্ট লিঙ্ক করুন',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'HindSiliguri',
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ── Primary Email Card ────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: borderColor),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x05000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      LucideIcons.mail,
                      color: Color(0xFF3B82F6),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ইমেইল অ্যাড্রেস',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white : const Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          email.isNotEmpty ? email : 'কোনো ইমেইল যুক্ত নেই',
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (email.isNotEmpty)
                    const Icon(
                      LucideIcons.checkCircle2,
                      color: Color(0xFF10B981),
                      size: 20,
                    ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ── Phone Card ────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: borderColor),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x05000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      LucideIcons.phone,
                      color: Color(0xFF10B981),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'মোবাইল নম্বর',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white : const Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          phone.isNotEmpty ? phone : 'কোনো ফোন নম্বর যুক্ত নেই',
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (phone.isNotEmpty)
                    const Icon(
                      LucideIcons.checkCircle2,
                      color: Color(0xFF10B981),
                      size: 20,
                    ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Info Note ─────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B).withValues(alpha: 0.5) : const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF334155) : const Color(0xFFDCFCE7),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    LucideIcons.shieldCheck,
                    size: 20,
                    color: Color(0xFF059669),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Google বা ফোন নম্বর লিঙ্ক থাকলে যেকোনো ডিভাইসে পাসওয়ার্ড ছাড়াই ১-ক্লিকে তাৎক্ষণিক লগইন করতে পারবে এবং অ্যাকাউন্ট চিরকাল নিরাপদ থাকবে।',
                      style: TextStyle(
                        fontSize: 12.5,
                        height: 1.45,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF166534),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
