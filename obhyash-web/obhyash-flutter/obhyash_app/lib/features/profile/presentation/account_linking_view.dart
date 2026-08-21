import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/presentation/widgets/app_refresh_indicator.dart';
import '../../../core/presentation/widgets/user_avatar.dart';
import '../../../core/utils/app_popups.dart';
import '../../auth/presentation/widgets/otp_verification_dialog.dart';
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

  Future<void> _changeGoogleAccount(UserIdentity googleIdentity) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'গুগল অ্যাকাউন্ট পরিবর্তন',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          content: Text(
            'আপনি কি বর্তমান গুগল অ্যাকাউন্ট পরিবর্তন করে অন্য একটি গুগল অ্যাকাউন্ট যুক্ত করতে চান?',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 14,
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF4B5563),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('বাতিল', style: TextStyle(fontFamily: 'HindSiliguri')),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text(
                'হ্যাঁ, পরিবর্তন করুন',
                style: TextStyle(fontFamily: 'HindSiliguri', fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    setState(() => _isLinking = true);
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.unlinkIdentity(googleIdentity);
      await supabase.auth.linkIdentity(
        OAuthProvider.google,
        redirectTo: 'io.supabase.obhyash://login-callback/',
      );
    } catch (e) {
      if (mounted) {
        AppPopups.error(
          context,
          message: 'গুগল অ্যাকাউন্ট পরিবর্তন করতে সমস্যা হয়েছে: $e',
        );
      }
    } finally {
      if (mounted) setState(() => _isLinking = false);
    }
  }

  Future<void> _unlinkGoogleAccount(UserIdentity googleIdentity) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'গুগল অ্যাকাউন্ট আনলিঙ্ক',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
          content: Text(
            'আপনি কি নিশ্চিত যে গুগল অ্যাকাউন্টটি এই আইডি থেকে বিচ্ছিন্ন (আনলিঙ্ক) করতে চান?',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 14,
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF4B5563),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('বাতিল', style: TextStyle(fontFamily: 'HindSiliguri')),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text(
                'আনলিঙ্ক করুন',
                style: TextStyle(fontFamily: 'HindSiliguri', fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    setState(() => _isLinking = true);
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.unlinkIdentity(googleIdentity);
      if (mounted) {
        AppPopups.success(
          context,
          message: 'গুগল অ্যাকাউন্ট সফলভাবে আনলিঙ্ক করা হয়েছে।',
        );
        ref.invalidate(userProfileProvider);
      }
    } catch (e) {
      if (mounted) {
        AppPopups.error(
          context,
          message: 'আনলিঙ্ক করতে সমস্যা হয়েছে: $e',
        );
      }
    } finally {
      if (mounted) setState(() => _isLinking = false);
    }
  }

  void _showAddOrEditPhoneBottomSheet({String initialPhone = ''}) {
    final phoneController = TextEditingController(text: initialPhone);
    final formKey = GlobalKey<FormState>();
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isDark = Theme.of(ctx).brightness == Brightness.dark;
            final sheetBg = isDark ? const Color(0xFF18181B) : Colors.white;
            final textPrimary = isDark ? Colors.white : const Color(0xFF111827);
            final textSecondary = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280);
            final inputBg = isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6);
            final border = isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB);

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              child: Container(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
                decoration: BoxDecoration(
                  color: sheetBg,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                  border: Border.all(color: border),
                ),
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFD1D5DB),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(
                              LucideIcons.phoneCall,
                              color: Color(0xFF10B981),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  initialPhone.isNotEmpty ? 'মোবাইল নম্বর পরিবর্তন' : 'মোবাইল নম্বর যুক্ত করুন',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'HindSiliguri',
                                    color: textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'তোমার সক্রিয় মোবাইল নম্বর প্রদান করো',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontFamily: 'HindSiliguri',
                                    color: textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 22),

                      // Input Field
                      TextFormField(
                        controller: phoneController,
                        keyboardType: TextInputType.phone,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'HindSiliguri',
                          color: textPrimary,
                        ),
                        decoration: InputDecoration(
                          hintText: '017XXXXXXXX',
                          hintStyle: TextStyle(
                            color: textSecondary.withValues(alpha: 0.7),
                            fontFamily: 'HindSiliguri',
                          ),
                          prefixIcon: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  '🇧🇩 +88',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  height: 22,
                                  width: 1,
                                  color: border,
                                ),
                              ],
                            ),
                          ),
                          filled: true,
                          fillColor: inputBg,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: border),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFF059669), width: 1.8),
                          ),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'অনুগ্রহ করে মোবাইল নম্বর লিখুন';
                          }
                          final clean = val.replaceAll(RegExp(r'\D'), '');
                          final formatted = (clean.length == 13 && clean.startsWith('8801')) ? clean.substring(2) : clean;
                          if (formatted.length != 11 || !formatted.startsWith('01')) {
                            return 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 22),

                      // Submit Button
                      ElevatedButton(
                        onPressed: isSaving
                            ? null
                            : () async {
                                if (!formKey.currentState!.validate()) return;
                                setModalState(() => isSaving = true);
                                try {
                                  final uid = Supabase.instance.client.auth.currentUser?.id;
                                  if (uid == null) throw Exception('লগইন সেশন পাওয়া যায়নি');

                                  final rawPhone = phoneController.text.trim();
                                  final res = await Supabase.instance.client.rpc('link_user_phone', params: {
                                    'p_user_id': uid,
                                    'p_phone': rawPhone,
                                  });

                                  if (res is Map<String, dynamic> && res['success'] == true) {
                                    if (ctx.mounted) Navigator.pop(ctx);
                                    ref.invalidate(userProfileProvider);
                                    await ref.read(userProfileProvider.future);
                                    if (mounted) {
                                      AppPopups.success(
                                        context,
                                        message: res['message']?.toString() ?? 'মোবাইল নম্বর সফলভাবে যুক্ত করা হয়েছে!',
                                      );
                                    }
                                  } else {
                                    final errMsg = (res is Map<String, dynamic>)
                                        ? res['error']?.toString()
                                        : 'মোবাইল নম্বর সংরক্ষণে সমস্যা হয়েছে';
                                    if (mounted) {
                                      AppPopups.warning(context, message: errMsg ?? 'মোবাইল নম্বর সংরক্ষণ ব্যর্থ হয়েছে');
                                    }
                                  }
                                } catch (e) {
                                  if (mounted) {
                                    AppPopups.error(context, message: 'সমস্যা: $e');
                                  }
                                } finally {
                                  if (ctx.mounted) setModalState(() => isSaving = false);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: isSaving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'সংরক্ষণ ও ভেরিফাই করো',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showAddOrEditEmailBottomSheet({String? initialEmail}) {
    final emailController = TextEditingController(text: initialEmail ?? '');
    final formKey = GlobalKey<FormState>();
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        final sheetBg = isDark ? const Color(0xFF18181B) : Colors.white;

        return StatefulBuilder(
          builder: (sheetContext, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(sheetContext).viewInsets.bottom,
              ),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                decoration: BoxDecoration(
                  color: sheetBg,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x1F000000),
                      blurRadius: 20,
                      offset: Offset(0, -4),
                    ),
                  ],
                ),
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF3B82F6).withValues(alpha: isDark ? 0.2 : 0.1),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(
                              LucideIcons.mail,
                              color: Color(0xFF3B82F6),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  initialEmail != null && initialEmail.isNotEmpty
                                      ? 'ইমেইল পরিবর্তন করুন'
                                      : 'ইমেইল অ্যাড্রেস যুক্ত করুন',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? Colors.white : const Color(0xFF111827),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'ভেরিফাই করার পূর্বে আপনার সঠিক ইমেইল লিখুন',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: emailController,
                        keyboardType: TextInputType.emailAddress,
                        autofocus: true,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF111827),
                        ),
                        decoration: InputDecoration(
                          hintText: 'student@gmail.com',
                          hintStyle: TextStyle(
                            color: isDark ? const Color(0xFF71717A) : const Color(0xFF9CA3AF),
                          ),
                          filled: true,
                          fillColor: isDark ? const Color(0xFF27272A) : const Color(0xFFF9FAFB),
                          prefixIcon: const Icon(LucideIcons.mail, size: 18, color: Color(0xFF3B82F6)),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(
                              color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 1.8),
                          ),
                        ),
                        validator: (val) {
                          final str = val?.trim() ?? '';
                          if (!str.contains('@') || !str.contains('.')) {
                            return 'সঠিক ইমেইল অ্যাড্রেস লিখুন';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: isSaving
                            ? null
                            : () async {
                                if (!formKey.currentState!.validate()) return;
                                setModalState(() => isSaving = true);
                                try {
                                  final uid = Supabase.instance.client.auth.currentUser?.id;
                                  if (uid == null) throw Exception('লগইন সেশন পাওয়া যায়নি');

                                  final rawEmail = emailController.text.trim().toLowerCase();
                                  final res = await Supabase.instance.client.rpc('update_unverified_email', params: {
                                    'p_user_id': uid,
                                    'p_new_email': rawEmail,
                                  });

                                  if (res is Map<String, dynamic> && res['success'] == true) {
                                    if (ctx.mounted) Navigator.pop(ctx);
                                    ref.invalidate(userProfileProvider);
                                    await ref.read(userProfileProvider.future);
                                    if (mounted) {
                                      AppPopups.success(
                                        context,
                                        message: res['message']?.toString() ?? 'ইমেইল সফলভাবে আপডেট করা হয়েছে!',
                                      );
                                    }
                                  } else {
                                    final errMsg = (res is Map<String, dynamic>)
                                        ? res['error']?.toString()
                                        : 'ইমেইল আপডেটে সমস্যা হয়েছে';
                                    if (mounted) {
                                      AppPopups.warning(context, message: errMsg ?? 'ইমেইল আপডেট ব্যর্থ হয়েছে');
                                    }
                                  }
                                } catch (e) {
                                  if (mounted) {
                                    AppPopups.error(context, message: 'সমস্যা: $e');
                                  }
                                } finally {
                                  if (ctx.mounted) setModalState(() => isSaving = false);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3B82F6),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: isSaving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'সংরক্ষণ করুন',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _showEmailOtpVerificationDialog(String targetEmail) async {
    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid == null) {
      AppPopups.error(context, message: 'লগইন সেশন পাওয়া যায়নি');
      return;
    }

    try {
      final res = await Supabase.instance.client.rpc('send_email_verification_otp', params: {
        'p_user_id': uid,
        'p_email': targetEmail,
        'p_is_dev_mock': false,
      });

      if (res is Map<String, dynamic> && res['success'] != true) {
        if (mounted) {
          AppPopups.warning(context, message: res['error']?.toString() ?? 'ওটিপি পাঠাতে সমস্যা হয়েছে');
        }
        return;
      }
    } catch (e) {
      if (mounted) {
        AppPopups.error(context, message: 'ওটিপি পাঠাতে সমস্যা হয়েছে: $e');
      }
      return;
    }

    if (!mounted) return;

    await OtpVerificationDialog.show(
      context,
      phone: targetEmail,
      onResend: () async {
        final res = await Supabase.instance.client.rpc('send_email_verification_otp', params: {
          'p_user_id': uid,
          'p_email': targetEmail,
          'p_is_dev_mock': false,
        });
        return (res is Map<String, dynamic>) ? res : {'success': false, 'error': 'ওটিপি পাঠাতে ব্যর্থ হয়েছে'};
      },
      onVerify: (otp) async {
        final res = await Supabase.instance.client.rpc('verify_email_otp', params: {
          'p_user_id': uid,
          'p_email': targetEmail,
          'p_otp': otp,
        });

        if (res is Map<String, dynamic> && res['success'] == true) {
          ref.invalidate(userProfileProvider);
          await ref.read(userProfileProvider.future);
          if (mounted) {
            AppPopups.success(
              context,
              message: 'ইমেইল সফলভাবে ভেরিফাই ও সুরক্ষিত করা হয়েছে! 🔒🎉',
            );
          }
        }
        return (res is Map<String, dynamic>) ? res : {'success': false, 'error': 'ভেরিফিকেশন ব্যর্থ হয়েছে'};
      },
    );
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
    
    UserIdentity? googleIdentity;
    try {
      googleIdentity = identities.firstWhere((id) => id.provider == 'google');
    } catch (_) {
      googleIdentity = null;
    }
    final isGoogleLinked = googleIdentity != null;
    final googleEmail = googleIdentity?.identityData?['email']?.toString() ??
        currentUser?.userMetadata?['email']?.toString() ??
        '';

    final email = currentUser?.email ?? user?.email ?? '';
    final phone = (user?.phone?.trim().isNotEmpty == true)
        ? user!.phone!.trim()
        : (currentUser?.phone?.trim().isNotEmpty == true ? currentUser!.phone!.trim() : '');

    final isPhoneVerificationRequired = user?.requiresPhoneVerification ?? false;
    final isPhoneVerifiedAndLocked = phone.isNotEmpty && !isPhoneVerificationRequired;

    final isEmailVerificationRequired = user?.requiresEmailVerification ?? false;
    final isEmailVerifiedAndLocked = (email.isNotEmpty && (user?.isEmailVerified ?? false)) && !isEmailVerificationRequired;

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
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
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
                            if (isGoogleLinked && googleEmail.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                googleEmail,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
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

                  const SizedBox(height: 16),

                  if (isGoogleLinked) ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _isLinking ? null : () => _changeGoogleAccount(googleIdentity!),
                            icon: const Icon(LucideIcons.refreshCw, size: 15),
                            label: const Text(
                              'পরিবর্তন করুন',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF059669),
                              side: BorderSide(
                                color: const Color(0xFF059669).withValues(alpha: 0.4),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 11),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton(
                          onPressed: _isLinking ? null : () => _unlinkGoogleAccount(googleIdentity!),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFEF4444),
                            side: BorderSide(
                              color: const Color(0xFFEF4444).withValues(alpha: 0.4),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'আনলিঙ্ক',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'HindSiliguri',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
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

            // ── Primary Email Card (With OTP Verify / Edit System) ─────────
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
                                fontWeight: email.isNotEmpty ? FontWeight.w600 : FontWeight.normal,
                                fontFamily: 'HindSiliguri',
                                color: email.isNotEmpty
                                    ? (isDark ? Colors.white : const Color(0xFF111827))
                                    : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280)),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (isEmailVerifiedAndLocked)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
                                LucideIcons.lock,
                                size: 13,
                                color: Color(0xFF059669),
                              ),
                              SizedBox(width: 4),
                              Text(
                                'লকড (ভেরিফাইড)',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: Color(0xFF059669),
                                ),
                              ),
                            ],
                          ),
                        )
                      else if (isEmailVerificationRequired)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.2 : 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                            ),
                          ),
                          child: const Text(
                            'রি-ভেরিফাই প্রয়োজন',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: Color(0xFFF59E0B),
                            ),
                          ),
                        )
                      else if (email.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.2 : 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                            ),
                          ),
                          child: const Text(
                            'ভেরিফাই করা হয়নি',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: Color(0xFFF59E0B),
                            ),
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.2 : 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                            ),
                          ),
                          child: const Text(
                            'যুক্ত নেই',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: Color(0xFFF59E0B),
                            ),
                          ),
                        ),
                    ],
                  ),

                  if (!isEmailVerifiedAndLocked) ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _showAddOrEditEmailBottomSheet(initialEmail: email),
                            icon: const Icon(LucideIcons.edit3, size: 15),
                            label: const Text(
                              'ইমেইল পরিবর্তন',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF3B82F6),
                              side: BorderSide(
                                color: const Color(0xFF3B82F6).withValues(alpha: 0.4),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 11),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                        if (email.isNotEmpty) ...[
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => _showEmailOtpVerificationDialog(email),
                              icon: const Icon(LucideIcons.keyRound, size: 15),
                              label: const Text(
                                'ইমেইল ভেরিফাই করো',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF3B82F6),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(vertical: 11),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ── Phone Card (With Add / Verify / Change System) ────────────
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
                                fontWeight: phone.isNotEmpty ? FontWeight.w600 : FontWeight.normal,
                                fontFamily: 'HindSiliguri',
                                color: phone.isNotEmpty
                                    ? (isDark ? Colors.white : const Color(0xFF111827))
                                    : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280)),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isPhoneVerifiedAndLocked)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
                                LucideIcons.lock,
                                size: 13,
                                color: Color(0xFF059669),
                              ),
                              SizedBox(width: 4),
                              Text(
                                'লকড (ভেরিফাইড)',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: Color(0xFF059669),
                                ),
                              ),
                            ],
                          ),
                        )
                      else if (isPhoneVerificationRequired)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.2 : 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                            ),
                          ),
                          child: const Text(
                            'রি-ভেরিফাই প্রয়োজন',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: Color(0xFFF59E0B),
                            ),
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.2 : 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                            ),
                          ),
                          child: const Text(
                            'যুক্ত নেই',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: Color(0xFFF59E0B),
                            ),
                          ),
                        ),
                    ],
                  ),

                  if (isPhoneVerificationRequired) ...[
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => _showAddOrEditPhoneBottomSheet(initialPhone: phone),
                      icon: const Icon(LucideIcons.shieldAlert, size: 16),
                      label: const Text(
                        'ফোন নম্বর রি-ভেরিফাই / আপডেট করুন',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD97706),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ] else if (!isPhoneVerifiedAndLocked) ...[
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => _showAddOrEditPhoneBottomSheet(),
                      icon: const Icon(LucideIcons.plusCircle, size: 16),
                      label: const Text(
                        'ফোন নম্বর যুক্ত ও ভেরিফাই করো',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
