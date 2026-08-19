import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/utils/app_popups.dart';
import '../providers/auth_controller.dart';
import 'forgot_password_sheet.dart';

class LoginView extends ConsumerStatefulWidget {
  const LoginView({super.key});

  @override
  ConsumerState<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends ConsumerState<LoginView>
    with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _scaleAnimation = Tween<double>(begin: 0.95, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeIn));
    _animController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    await ref
        .read(authControllerProvider.notifier)
        .login(_emailController.text.trim(), _passwordController.text);
    if (!mounted) return;
    final authState = ref.read(authControllerProvider);
    if (authState.hasError) {
      AppPopups.show(
        context,
        message: authState.error.toString(),
        isError: true,
      );
    } else if (!authState.isLoading) {
      context.go('/');
    }
  }

  void _handleGoogleLogin() async {
    await ref.read(authControllerProvider.notifier).loginWithGoogle();
    if (!mounted) return;
    final authState = ref.read(authControllerProvider);
    if (authState.hasError) {
      AppPopups.show(
        context,
        message: authState.error.toString(),
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;

    const bgColor = Color(0xFF09090B); // Luxury OLED Dark
    const textColor = Colors.white;

    return Theme(
      data: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: bgColor,
        colorScheme: const ColorScheme.dark(
          surface: Color(0xFF141417),
          primary: Color(0xFF059669),
        ),
      ),
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light.copyWith(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: bgColor,
        ),
        child: Scaffold(
          backgroundColor: bgColor,
          body: SafeArea(
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: AnimatedBuilder(
                animation: _animController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Opacity(opacity: _fadeAnimation.value, child: child),
                  );
                },
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    // Logo Section
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF141417),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFF27272A)),
                        ),
                        child: const Icon(
                          LucideIcons.graduationCap,
                          size: 38,
                          color: Color(0xFF059669),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Login Title & Subtitle
                    const Text(
                      'লগইন করো',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Anek Bangla',
                        letterSpacing: -0.5,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'তোমার অ্যাকাউন্টে প্রবেশ করতে তথ্য দাও',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'Anek Bangla',
                        color: Color(0xFFA1A1AA),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Form
                    _buildInputField(
                      label: 'মোবাইল নম্বর অথবা ইমেইল',
                      icon: LucideIcons.user,
                      controller: _emailController,
                      hint: '017XXXXXXXX অথবা example@gmail.com',
                      keyboardType: TextInputType.text,
                    ),
                    const SizedBox(height: 14),
                    _buildInputField(
                      label: 'পাসওয়ার্ড',
                      icon: LucideIcons.lock,
                      controller: _passwordController,
                      hint: '••••••••',
                      obscureText: true,
                    ),

                    // Forgot password
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        style: TextButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                          padding: const EdgeInsets.symmetric(vertical: 4),
                        ),
                        onPressed: () {
                          showModalBottomSheet(
                            context: context,
                            useRootNavigator: true,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (context) => const ForgotPasswordSheet(),
                          );
                        },
                        child: const Text(
                          'পাসওয়ার্ড ভুলে গেছেন?',
                          style: TextStyle(
                            fontFamily: 'Anek Bangla',
                            color: Color(0xFFEF4444),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Submit Button
                    ElevatedButton(
                      onPressed: isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: isLoading
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'লগইন করো',
                              style: TextStyle(
                                fontSize: 18,
                                fontFamily: 'Anek Bangla',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),

                    const SizedBox(height: 18),

                    // Divider "অথবা"
                    const Row(
                      children: [
                        Expanded(
                          child: Divider(
                            color: Color(0xFF27272A),
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'অথবা',
                            style: TextStyle(
                              color: Color(0xFF71717A),
                              fontSize: 13,
                              fontFamily: 'Anek Bangla',
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(
                            color: Color(0xFF27272A),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Google Login Button (Account Linking)
                    OutlinedButton(
                      onPressed: isLoading ? null : _handleGoogleLogin,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(
                          color: Color(0xFF27272A),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        backgroundColor: const Color(0xFF141417),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.network(
                            'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                            width: 18,
                            height: 18,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(
                              LucideIcons.globe,
                              size: 18,
                              color: Color(0xFF4285F4),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'Google দিয়ে লগইন করো',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Anek Bangla',
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Footer
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'অ্যাকাউন্ট নেই? ',
                          style: TextStyle(
                            fontFamily: 'Anek Bangla',
                            fontSize: 15,
                            color: Color(0xFFA1A1AA),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => context.push('/signup'),
                          child: const Text(
                            'নতুন অ্যাকাউন্ট খুলুন',
                            style: TextStyle(
                              fontFamily: 'Anek Bangla',
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF059669),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required String hint,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    const bgColor = Color(0xFF141417);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontFamily: 'Anek Bangla',
            fontWeight: FontWeight.w700,
            color: Color(0xFFA1A1AA),
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          style: const TextStyle(
            fontFamily: 'Anek Bangla',
            fontWeight: FontWeight.w500,
            color: Colors.white,
          ),
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
            fillColor: bgColor,
            contentPadding: const EdgeInsets.symmetric(
              vertical: 14,
              horizontal: 16,
            ),
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
}
