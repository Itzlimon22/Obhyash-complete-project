import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/utils/app_popups.dart';
import '../providers/auth_controller.dart';

class UpdatePasswordView extends ConsumerStatefulWidget {
  const UpdatePasswordView({super.key});

  @override
  ConsumerState<UpdatePasswordView> createState() => _UpdatePasswordViewState();
}

class _UpdatePasswordViewState extends ConsumerState<UpdatePasswordView> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleUpdate() async {
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (password.length < 6) {
      AppPopups.show(context, message: 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে', isError: true);
      return;
    }
    if (password != confirm) {
      AppPopups.show(context, message: 'পাসওয়ার্ড মিলেনি', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authControllerProvider.notifier).updatePassword(password);
      if (mounted) {
        AppPopups.show(context, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে', isError: false);
        context.go('/');
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

  Widget _buildInputField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required String hint,
    required bool isDark,
    bool obscureText = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontFamily: 'Anek Bangla',
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white70 : Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          style: TextStyle(color: isDark ? Colors.white : Colors.black),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark ? Colors.white38 : Colors.black38,
            ),
            prefixIcon: Icon(
              icon,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
            filled: true,
            fillColor: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0A0A) : Colors.white,
      appBar: AppBar(
        title: const Text(
          'নতুন পাসওয়ার্ড দাও',
          style: TextStyle(
            fontFamily: 'Anek Bangla',
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: isDark ? const Color(0xFF0A0A0A) : Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildInputField(
                controller: _passwordController,
                label: 'নতুন পাসওয়ার্ড',
                icon: LucideIcons.lock,
                hint: '••••••••',
                isDark: isDark,
                obscureText: true,
              ),
              const SizedBox(height: 16),
              _buildInputField(
                controller: _confirmController,
                label: 'পাসওয়ার্ড কনফার্ম করো',
                icon: LucideIcons.lock,
                hint: '••••••••',
                isDark: isDark,
                obscureText: true,
              ),
              const SizedBox(height: 32),
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleUpdate,
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
                          'পাসওয়ার্ড সেট করো',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
