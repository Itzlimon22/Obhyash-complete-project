import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/presentation/widgets/app_button_3d.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_popups.dart';
import '../providers/auth_controller.dart';

class ForgotPasswordSheet extends ConsumerStatefulWidget {
  const ForgotPasswordSheet({super.key});

  @override
  ConsumerState<ForgotPasswordSheet> createState() => _ForgotPasswordSheetState();
}

class _ForgotPasswordSheetState extends ConsumerState<ForgotPasswordSheet> {
  final _emailController = TextEditingController();
  bool _isLoading = false;

  // Constant Light Mode Palette (matching LoginView light theme)
  static const Color sheetBg = Colors.white;
  static const Color textPrimary = Color(0xFF0F1F1A);
  static const Color textMuted = Color(0xFF6B7A74);
  static const Color fieldBg = Color(0xFFF6F9F8);
  static const Color fieldBorder = Color(0xFFE4EBE8);
  static const Color brandGreen = Color(0xFF0A8A66);

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      AppPopups.show(context, message: 'তোমার ইমেইল এড্রেস দাও', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authControllerProvider.notifier).resetPassword(email);
      if (mounted) {
        Navigator.pop(context);
        AppPopups.show(
          context,
          message: 'পাসওয়ার্ড রিসেট লিংক তোমার ইমেইলে পাঠানো হয়েছে',
          isError: false,
        );
      }
    } catch (e) {
      if (mounted) {
        AppPopups.show(context, message: e.toString().replaceAll('Exception: ', ''), isError: true);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData.light().copyWith(
        textTheme: ThemeData.light().textTheme.apply(
          fontFamily: 'HindSiliguri',
        ),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          decoration: const BoxDecoration(
            color: sheetBg,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(28),
              topRight: Radius.circular(28),
            ),
            boxShadow: [
              BoxShadow(
                color: Color(0x1A000000),
                blurRadius: 24,
                offset: Offset(0, -6),
              ),
            ],
          ),
          padding: const EdgeInsets.only(
            left: 24,
            top: 14,
            right: 24,
            bottom: 28,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top drag indicator
              Center(
                child: Container(
                  width: 44,
                  height: 4.5,
                  decoration: BoxDecoration(
                    color: fieldBorder,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Icon & Title Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF7F3),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFDEE9E3)),
                    ),
                    child: const Icon(
                      LucideIcons.keyRound,
                      color: brandGreen,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'পাসওয়ার্ড ভুলে গেছো?',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                            letterSpacing: -0.2,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'চিন্তা নেই, নতুন পাসওয়ার্ড সেট করে নাও',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                            color: textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              const Text(
                'তোমার অ্যাকাউন্টের ইমেইল ঠিকানা দাও। আমরা একটি ভেরিফিকেশন পাসওয়ার্ড রিসেট লিংক পাঠাবো।',
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 13.5,
                  height: 1.45,
                  color: textMuted,
                ),
              ),
              const SizedBox(height: 20),

              // Email Input Field
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: textPrimary,
                ),
                decoration: InputDecoration(
                  hintText: 'তোমার ইমেইল এড্রেস',
                  hintStyle: const TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 14,
                    color: Color(0xFF9CA3AF),
                  ),
                  prefixIcon: const Icon(
                    LucideIcons.mail,
                    size: 19,
                    color: textMuted,
                  ),
                  filled: true,
                  fillColor: fieldBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: fieldBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: fieldBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: brandGreen, width: 1.8),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button (3D Deepest Green)
              AppButton3D(
                text: 'রিসেট লিংক পাঠাও',
                suffixIcon: const Icon(LucideIcons.arrowRight, size: 18, color: Colors.white),
                onPressed: _isLoading ? null : _handleResetPassword,
                isLoading: _isLoading,
                baseColor: AppColors.viridianForest,
                shadowColor: AppColors.brandGreenDark,
                height: 52,
                borderRadius: 16,
                depth: 4.5,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
