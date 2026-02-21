import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_controller.dart';

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
      duration: const Duration(milliseconds: 300),
    );
    _scaleAnimation = Tween<double>(
      begin: 0.95,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
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
    // Routing is usually handled globally in GoRouter redirect based on auth state,
    // but the web code uses router.push('/dashboard')
    final authState = ref.read(authControllerProvider);
    if (!authState.hasError && !authState.isLoading) {
      if (mounted)
        context.go('/'); // assuming '/' is dashboard based on our router setup
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;
    final error = authState.hasError ? authState.error.toString() : null;

    return Scaffold(
      backgroundColor: isDark
          ? Colors.black
          : const Color(0xFFF5F5F5), // neutral-100
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: AnimatedBuilder(
            animation: _animController,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: Opacity(opacity: _fadeAnimation.value, child: child),
              );
            },
            child: Container(
              width: double.infinity,
              constraints: const BoxConstraints(maxWidth: 448), // max-w-md
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF0A0A0A)
                    : Colors.white, // neutral-950
                borderRadius: BorderRadius.circular(32), // 2rem
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFE5E5E5), // neutral-800 : 200
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.25),
                    blurRadius: 25,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Header Decor banner
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 8,
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFFDC2626), // red-600
                            Color(0xFFEF4444), // red-500
                            Color(0xFFF43F5E), // rose-500
                          ],
                        ),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(32),
                          topRight: Radius.circular(32),
                        ),
                      ),
                    ),
                  ),

                  // Blurs
                  Positioned(
                    top: -80,
                    right: -80,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: const BoxDecoration(
                        color: Color(0x1AEF4444), // red-500/10
                        shape: BoxShape.circle,
                      ),
                      // normally requires ImageFilter.blur but standard decorations will suffice for now to save rendering bounds
                    ),
                  ),
                  Positioned(
                    bottom: -80,
                    left: -80,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: const BoxDecoration(
                        color: Color(0x1A10B981), // emerald-500/10
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'স্বাগতম!',
                          style: TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'HindSiliguri',
                            height: 1.2,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'আপনার অ্যাকাউন্টে লগইন করুন',
                          style: TextStyle(
                            fontSize: 14,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? const Color(0xFF94A3B8)
                                : const Color(
                                    0xFF64748B,
                                  ), // slate-400 : slate-500
                          ),
                        ),
                        const SizedBox(height: 24),

                        if (error != null)
                          Container(
                            margin: const EdgeInsets.only(bottom: 24),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0x337F1D1D)
                                  : const Color(
                                      0xFFFEF2F2,
                                    ), // red-900/20 : red-50
                              border: Border.all(
                                color: isDark
                                    ? const Color(0x4D7F1D1D)
                                    : const Color(
                                        0xFFFEE2E2,
                                      ), // red-900/30 : red-100
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const Text(
                                  '⚠️ ',
                                  style: TextStyle(fontSize: 18),
                                ),
                                Expanded(
                                  child: Text(
                                    error,
                                    style: TextStyle(
                                      fontFamily: 'HindSiliguri',
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: isDark
                                          ? const Color(0xFFF87171)
                                          : const Color(
                                              0xFFDC2626,
                                            ), // red-400 : red-600
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Form
                        _buildInputField(
                          label: 'ইমেইল এড্রেস',
                          icon: LucideIcons.mail,
                          controller: _emailController,
                          hint: 'example@mail.com',
                          isDark: isDark,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 16),
                        _buildInputField(
                          label: 'পাসওয়ার্ড',
                          icon: LucideIcons.lock,
                          controller: _passwordController,
                          hint: '••••••••',
                          isDark: isDark,
                          obscureText: true,
                        ),
                        const SizedBox(height: 24),

                        // Submit Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: isLoading ? null : _handleLogin,
                            style:
                                ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 16,
                                  ),
                                  backgroundColor:
                                      Colors.transparent, // done via ink
                                  shadowColor: const Color(
                                    0x4D10B981,
                                  ), // emerald-500/30
                                  elevation: 10,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ).copyWith(
                                  backgroundColor:
                                      WidgetStateProperty.resolveWith((states) {
                                        return null;
                                      }),
                                ),
                            child: Ink(
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    Color(0xFF059669), // emerald-600
                                    Color(0xFF16A34A), // green-600
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Container(
                                alignment: Alignment.center,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                child: isLoading
                                    ? const Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white,
                                            ),
                                          ),
                                          SizedBox(width: 8),
                                          Text(
                                            'প্রবেশ করা হচ্ছে...',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontFamily: 'HindSiliguri',
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      )
                                    : const Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            LucideIcons.logIn,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                          SizedBox(width: 8),
                                          Text(
                                            'লগইন',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontFamily: 'HindSiliguri',
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 32),

                        TextButton(
                          onPressed: () {
                            context.push('/signup');
                          },
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontSize: 14,
                                color: isDark
                                    ? const Color(0xFF94A3B8)
                                    : const Color(0xFF64748B),
                              ),
                              children: [
                                const TextSpan(text: 'অ্যাকাউন্ট নেই? '),
                                TextSpan(
                                  text: 'নতুন অ্যাকাউন্ট খুলুন',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? const Color(0xFFEF4444)
                                        : const Color(
                                            0xFFDC2626,
                                          ), // red-500 : red-600
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
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
    required bool isDark,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 6),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontFamily: 'HindSiliguri',
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
            ),
          ),
        ),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontWeight: FontWeight.w500,
            color: isDark ? const Color(0xFFE5E5E5) : const Color(0xFF262626),
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
            ),
            prefixIcon: Icon(icon, color: const Color(0xFF94A3B8), size: 20),
            filled: true,
            fillColor: isDark
                ? const Color(0xFF171717)
                : const Color(0xFFFAFAFA), // neutral-900 : neutral-50
            contentPadding: const EdgeInsets.symmetric(
              vertical: 16,
              horizontal: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFE5E5E5),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFE5E5E5),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark
                    ? const Color(0x33EF4444)
                    : const Color(0x33DC2626), // red-500/20
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
