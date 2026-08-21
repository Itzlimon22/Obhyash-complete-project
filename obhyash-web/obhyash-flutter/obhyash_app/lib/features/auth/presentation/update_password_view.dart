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
    bool obscureText = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Anek Bangla',
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFFA1A1AA),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              color: Color(0xFF71717A),
            ),
            prefixIcon: Icon(
              icon,
              color: const Color(0xFFA1A1AA),
            ),
            filled: true,
            fillColor: const Color(0xFF141417),
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
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    const bgColor = Color(0xFF09090B);

    return Theme(
      data: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: bgColor,
        colorScheme: const ColorScheme.dark(
          surface: Color(0xFF141417),
          primary: Color(0xFF059669),
        ),
      ),
      child: Scaffold(
        backgroundColor: bgColor,
        appBar: AppBar(
          title: const Text(
            'নতুন পাসওয়ার্ড দাও',
            style: TextStyle(
              fontFamily: 'Anek Bangla',
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          backgroundColor: bgColor,
          elevation: 0,
          centerTitle: true,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildInputField(
                  controller: _passwordController,
                  label: 'নতুন পাসওয়ার্ড',
                  icon: LucideIcons.lock,
                  hint: '••••••••',
                  obscureText: true,
                ),
                const SizedBox(height: 16),
                _buildInputField(
                  controller: _confirmController,
                  label: 'পাসওয়ার্ড কনফার্ম করো',
                  icon: LucideIcons.lock,
                  hint: '••••••••',
                  obscureText: true,
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleUpdate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
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
                            strokeWidth: 3,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'পাসওয়ার্ড সংরক্ষণ করো',
                          style: TextStyle(
                            fontSize: 18,
                            fontFamily: 'Anek Bangla',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
