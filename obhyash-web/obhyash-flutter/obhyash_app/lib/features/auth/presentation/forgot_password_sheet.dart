import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
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

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      AppPopups.show(context, message: 'দয়া করে তোমার ইমেইল দাও', isError: true);
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
    const bgColor = Color(0xFF141417);

    return Theme(
      data: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: bgColor,
        colorScheme: const ColorScheme.dark(
          surface: Color(0xFF141417),
          primary: Color(0xFF059669),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          decoration: const BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFF27272A),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'পাসওয়ার্ড ভুলে গেছেন?',
                style: TextStyle(
                  fontFamily: 'Anek Bangla',
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'তোমার ইমেইল ঠিকানা দাও। আমরা একটি পাসওয়ার্ড রিসেট লিংক পাঠাবো।',
                style: TextStyle(
                  fontFamily: 'Anek Bangla',
                  fontSize: 16,
                  color: Color(0xFFA1A1AA),
                ),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'ইমেইল',
                  hintStyle: const TextStyle(
                    color: Color(0xFF71717A),
                  ),
                  prefixIcon: const Icon(
                    LucideIcons.mail,
                    color: Color(0xFFA1A1AA),
                  ),
                  filled: true,
                  fillColor: const Color(0xFF1C1C1E),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFF27272A)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFF27272A)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFF059669), width: 2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleResetPassword,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669), // Deep Green
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'লিংক পাঠান',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
