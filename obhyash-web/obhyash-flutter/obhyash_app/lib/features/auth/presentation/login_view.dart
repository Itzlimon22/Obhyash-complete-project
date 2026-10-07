import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/presentation/widgets/app_button_3d.dart';
import '../../../core/theme/app_theme.dart';
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
  bool _obscurePassword = true;
  bool _isEmailMode = false;

  void _onIdentifierChanged(String value) {
    final hasLetterOrAt = RegExp(r'[a-zA-Z@]').hasMatch(value);
    if (hasLetterOrAt && !_isEmailMode) {
      setState(() {
        _isEmailMode = true;
      });
    } else if (!hasLetterOrAt && value.isNotEmpty && _isEmailMode && RegExp(r'^[0-9+০-৯\s-]+$').hasMatch(value)) {
      setState(() {
        _isEmailMode = false;
      });
    }
  }

  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  static const _googleSvgString = '''
<svg viewBox="0 0 24 24" width="20" height="20">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
</svg>
''';

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _scaleAnimation = Tween<double>(begin: 0.96, end: 1.0).animate(
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
    HapticFeedback.lightImpact();
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
    HapticFeedback.lightImpact();
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
  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData.light().copyWith(
        textTheme: ThemeData.light().textTheme.apply(
          fontFamily: 'HindSiliguri',
        ),
      ),
      child: Builder(
        builder: (context) {
          final authState = ref.watch(authControllerProvider);
          final isLoading = authState.isLoading;

          final isDark = Theme.of(context).brightness == Brightness.dark;
          final sheetBg = isDark ? const Color(0xFF141417) : Colors.white;
          final textPrimary = isDark ? Colors.white : const Color(0xFF0F1F1A);
          final textMuted = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7A74);
          final fieldBg = isDark ? const Color(0xFF1E1E24) : const Color(0xFFF6F9F8);
          final fieldBorder = isDark ? const Color(0xFF2E2E36) : const Color(0xFFE4EBE8);

          return AnnotatedRegion<SystemUiOverlayStyle>(
            value: (isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark)
                .copyWith(
              statusBarColor: Colors.transparent,
              systemNavigationBarColor: sheetBg,
            ),
            child: Scaffold(
              backgroundColor: isDark ? const Color(0xFF0A0F0D) : const Color(0xFFEEF7F3),
              body: Stack(
                children: [
                  // 1. Background Gradient (linear-gradient(160deg, #fbfefd, #eef7f3 70%))
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: isDark
                            ? const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(0xFF0A0F0D), Color(0xFF0D1412)],
                              )
                            : const LinearGradient(
                                begin: Alignment(-0.6, -1.0),
                                end: Alignment(0.6, 1.0),
                                colors: [Color(0xFFFBFEFD), Color(0xFFEEF7F3)],
                                stops: [0.0, 0.7],
                              ),
                      ),
                    ),
                  ),

                  // 2. Top-Right Gold Glow Orb
                  Positioned(
                    top: -110,
                    right: -120,
                    child: IgnorePointer(
                      child: Container(
                        width: 320,
                        height: 320,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              const Color(0xFFE9C46A)
                                  .withValues(alpha: isDark ? 0.15 : 0.30),
                              Colors.transparent,
                            ],
                            stops: const [0.0, 0.65],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // 3. Left Emerald Glow Orb
                  Positioned(
                    top: 90,
                    left: -130,
                    child: IgnorePointer(
                      child: Container(
                        width: 260,
                        height: 260,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              const Color(0xFF0A8A66)
                                  .withValues(alpha: isDark ? 0.12 : 0.16),
                              Colors.transparent,
                            ],
                            stops: const [0.0, 0.70],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // 4. Foreground Content
                  SafeArea(
                    bottom: false,
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 430),
                        child: AnimatedBuilder(
                          animation: _animController,
                          builder: (context, child) {
                            return Transform.scale(
                              scale: _scaleAnimation.value,
                              child: Opacity(
                                opacity: _fadeAnimation.value,
                                child: child,
                              ),
                            );
                          },
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final bottomPad = MediaQuery.paddingOf(context).bottom;
                              return SingleChildScrollView(
                                physics: const BouncingScrollPhysics(),
                                child: ConstrainedBox(
                                  constraints: BoxConstraints(
                                    minHeight: constraints.maxHeight,
                                  ),
                                  child: IntrinsicHeight(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.stretch,
                                      children: [
                                // Top support button
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                                  child: Align(
                                    alignment: Alignment.topRight,
                                    child: _buildSupportButton(context, isDark),
                                  ),
                                ),

                                // Hero: Logo + Slogan
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 38),
                                  child: Column(
                                    children: [
                                      Image.asset(
                                        'assets/images/obhyash_full_logo.png',
                                        height: 44,
                                        fit: BoxFit.contain,
                                      ),
                                      const SizedBox(height: 10),
                                      const Text(
                                        'অভ্যাসে শুরু সাফল্যে শেষ',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontFamily: 'HindSiliguri',
                                          fontSize: 15,
                                          fontWeight: FontWeight.w500,
                                          color: Color(0xFF6B7A74),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // White Bottom Sheet Card
                                Expanded(
                                  child: Container(
                                  decoration: BoxDecoration(
                                    color: sheetBg,
                                    borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(32),
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF066B4F)
                                            .withValues(alpha: 0.10),
                                        blurRadius: 40,
                                        offset: const Offset(0, -10),
                                      ),
                                    ],
                                    border: Border(
                                      top: BorderSide(
                                        color: isDark
                                            ? const Color(0xFF27272A)
                                            : Colors.white,
                                        width: 1,
                                      ),
                                    ),
                                  ),
                                  padding: EdgeInsets.fromLTRB(24, 30, 24, 36 + bottomPad),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      // Field 1: Mobile / Email Selector & Input
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            _isEmailMode ? 'ইমেইল এড্রেস' : 'মোবাইল নম্বর',
                                            style: TextStyle(
                                              fontFamily: 'HindSiliguri',
                                              fontSize: 13.5,
                                              fontWeight: FontWeight.w500,
                                              color: textMuted,
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.all(2),
                                            decoration: BoxDecoration(
                                              color: isDark ? const Color(0xFF1F2421) : const Color(0xFFEFF5F2),
                                              borderRadius: BorderRadius.circular(10),
                                              border: Border.all(
                                                color: isDark ? const Color(0xFF2B332E) : const Color(0xFFDEE9E3),
                                              ),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                GestureDetector(
                                                  onTap: () {
                                                    if (_isEmailMode) {
                                                      HapticFeedback.selectionClick();
                                                      setState(() => _isEmailMode = false);
                                                    }
                                                  },
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                    decoration: BoxDecoration(
                                                      color: !_isEmailMode
                                                          ? (isDark ? const Color(0xFF28342D) : Colors.white)
                                                          : Colors.transparent,
                                                      borderRadius: BorderRadius.circular(8),
                                                      boxShadow: !_isEmailMode
                                                          ? [
                                                              BoxShadow(
                                                                color: Colors.black.withValues(alpha: 0.05),
                                                                blurRadius: 4,
                                                                offset: const Offset(0, 1),
                                                              )
                                                            ]
                                                          : null,
                                                    ),
                                                    child: Row(
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Icon(
                                                          LucideIcons.phone,
                                                          size: 11,
                                                          color: !_isEmailMode
                                                              ? (isDark ? const Color(0xFF34D399) : const Color(0xFF004633))
                                                              : textMuted,
                                                        ),
                                                        const SizedBox(width: 4),
                                                        Text(
                                                          'মোবাইল',
                                                          style: TextStyle(
                                                            fontFamily: 'HindSiliguri',
                                                            fontSize: 11.5,
                                                            fontWeight: !_isEmailMode ? FontWeight.bold : FontWeight.w500,
                                                            color: !_isEmailMode
                                                                ? (isDark ? const Color(0xFF34D399) : const Color(0xFF004633))
                                                                : textMuted,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                                GestureDetector(
                                                  onTap: () {
                                                    if (!_isEmailMode) {
                                                      HapticFeedback.selectionClick();
                                                      setState(() => _isEmailMode = true);
                                                    }
                                                  },
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                    decoration: BoxDecoration(
                                                      color: _isEmailMode
                                                          ? (isDark ? const Color(0xFF28342D) : Colors.white)
                                                          : Colors.transparent,
                                                      borderRadius: BorderRadius.circular(8),
                                                      boxShadow: _isEmailMode
                                                          ? [
                                                              BoxShadow(
                                                                color: Colors.black.withValues(alpha: 0.05),
                                                                blurRadius: 4,
                                                                offset: const Offset(0, 1),
                                                              )
                                                            ]
                                                          : null,
                                                    ),
                                                    child: Row(
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Icon(
                                                          LucideIcons.mail,
                                                          size: 11,
                                                          color: _isEmailMode
                                                              ? (isDark ? const Color(0xFF34D399) : const Color(0xFF004633))
                                                              : textMuted,
                                                        ),
                                                        const SizedBox(width: 4),
                                                        Text(
                                                          'ইমেইল',
                                                          style: TextStyle(
                                                            fontFamily: 'HindSiliguri',
                                                            fontSize: 11.5,
                                                            fontWeight: _isEmailMode ? FontWeight.bold : FontWeight.w500,
                                                            color: _isEmailMode
                                                                ? (isDark ? const Color(0xFF34D399) : const Color(0xFF004633))
                                                                : textMuted,
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
                                      const SizedBox(height: 7),
                                      Container(
                                        height: 56,
                                        padding: const EdgeInsets.symmetric(horizontal: 14),
                                        decoration: BoxDecoration(
                                          color: fieldBg,
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(
                                            color: fieldBorder,
                                            width: 1.5,
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            AnimatedSwitcher(
                                              duration: const Duration(milliseconds: 180),
                                              child: _isEmailMode
                                                  ? Row(
                                                      key: const ValueKey('email_prefix'),
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Icon(
                                                          LucideIcons.mail,
                                                          size: 20,
                                                          color: textMuted,
                                                        ),
                                                        Container(
                                                          height: 24,
                                                          width: 1.5,
                                                          margin: const EdgeInsets.symmetric(horizontal: 10),
                                                          color: fieldBorder,
                                                        ),
                                                      ],
                                                    )
                                                  : Row(
                                                      key: const ValueKey('phone_prefix'),
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Icon(
                                                          LucideIcons.phone,
                                                          size: 20,
                                                          color: textMuted,
                                                        ),
                                                        const SizedBox(width: 10),
                                                        Text(
                                                          '+88',
                                                          style: TextStyle(
                                                            fontFamily: 'HindSiliguri',
                                                            fontSize: 15,
                                                            fontWeight: FontWeight.w600,
                                                            color: textPrimary,
                                                          ),
                                                        ),
                                                        Container(
                                                          height: 24,
                                                          width: 1.5,
                                                          margin: const EdgeInsets.symmetric(horizontal: 10),
                                                          color: fieldBorder,
                                                        ),
                                                      ],
                                                    ),
                                            ),
                                            Expanded(
                                              child: TextFormField(
                                                controller: _emailController,
                                                keyboardType: _isEmailMode
                                                    ? TextInputType.emailAddress
                                                    : TextInputType.text,
                                                onChanged: _onIdentifierChanged,
                                                style: TextStyle(
                                                  fontFamily: 'HindSiliguri',
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w500,
                                                  color: textPrimary,
                                                ),
                                                decoration: InputDecoration(
                                                  hintText: _isEmailMode
                                                      ? 'example@gmail.com'
                                                      : '01XXXXXXXXX',
                                                  hintStyle: const TextStyle(
                                                    fontFamily: 'HindSiliguri',
                                                    color: Color(0xFF9AA9A2),
                                                    fontWeight: FontWeight.w400,
                                                    fontSize: 15,
                                                  ),
                                                  border: InputBorder.none,
                                                  enabledBorder: InputBorder.none,
                                                  focusedBorder: InputBorder.none,
                                                  isDense: true,
                                                  contentPadding: EdgeInsets.zero,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 16),

                                      // Field 2: Password
                                      Text(
                                        'পাসওয়ার্ড',
                                        style: TextStyle(
                                          fontFamily: 'HindSiliguri',
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w500,
                                          color: textMuted,
                                        ),
                                      ),
                                      const SizedBox(height: 7),
                                      Container(
                                        height: 56,
                                        padding: const EdgeInsets.symmetric(horizontal: 14),
                                        decoration: BoxDecoration(
                                          color: fieldBg,
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(
                                            color: fieldBorder,
                                            width: 1.5,
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              LucideIcons.lock,
                                              size: 20,
                                              color: textMuted,
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: TextFormField(
                                                controller: _passwordController,
                                                obscureText: _obscurePassword,
                                                style: TextStyle(
                                                  fontFamily: 'HindSiliguri',
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w500,
                                                  color: textPrimary,
                                                ),
                                                decoration: const InputDecoration(
                                                  hintText: 'তোমার পাসওয়ার্ড',
                                                  hintStyle: TextStyle(
                                                    fontFamily: 'HindSiliguri',
                                                    color: Color(0xFF9AA9A2),
                                                    fontWeight: FontWeight.w400,
                                                    fontSize: 15,
                                                  ),
                                                  border: InputBorder.none,
                                                  enabledBorder: InputBorder.none,
                                                  focusedBorder: InputBorder.none,
                                                  isDense: true,
                                                  contentPadding: EdgeInsets.zero,
                                                ),
                                              ),
                                            ),
                                            GestureDetector(
                                              onTap: () {
                                                setState(() {
                                                  _obscurePassword = !_obscurePassword;
                                                });
                                              },
                                              behavior: HitTestBehavior.opaque,
                                              child: Padding(
                                                padding: const EdgeInsets.all(4),
                                                child: Icon(
                                                  _obscurePassword
                                                      ? LucideIcons.eye
                                                      : LucideIcons.eyeOff,
                                                  size: 20,
                                                  color: textMuted,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Forgot Password Link
                                      const SizedBox(height: 8),
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: GestureDetector(
                                          onTap: () {
                                            showModalBottomSheet(
                                              context: context,
                                              useRootNavigator: true,
                                              isScrollControlled: true,
                                              backgroundColor: Colors.transparent,
                                              builder: (context) =>
                                                  const ForgotPasswordSheet(),
                                            );
                                          },
                                          behavior: HitTestBehavior.opaque,
                                          child: const Padding(
                                            padding: EdgeInsets.symmetric(
                                              vertical: 4,
                                              horizontal: 2,
                                            ),
                                            child: Text(
                                              'পাসওয়ার্ড ভুলে গেছো?',
                                              style: TextStyle(
                                                fontFamily: 'HindSiliguri',
                                                fontSize: 13.5,
                                                fontWeight: FontWeight.w600,
                                                color: Color(0xFFE5484D),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),

                                      const SizedBox(height: 20),

                                      // Primary Button ("এগিয়ে যাও" - 3D Deepest Green)
                                      AppButton3D(
                                        text: 'এগিয়ে যাও',
                                        onPressed: isLoading ? null : _handleLogin,
                                        isLoading: isLoading,
                                        baseColor: AppColors.viridianForest,
                                        shadowColor: AppColors.brandGreenDark,
                                        height: 52,
                                        borderRadius: 16,
                                        depth: 4.5,
                                        fontSize: 17,
                                        fontWeight: FontWeight.w700,
                                      ),

                                      const SizedBox(height: 24),

                                      // Divider ("অথবা চালিয়ে যান")
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Container(
                                              height: 1,
                                              color: isDark
                                                  ? const Color(0xFF27272A)
                                                  : const Color(0xFFE4EBE8),
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 12),
                                            child: Text(
                                              'অথবা চালিয়ে যান',
                                              style: TextStyle(
                                                fontFamily: 'HindSiliguri',
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500,
                                                color: textMuted,
                                              ),
                                            ),
                                          ),
                                          Expanded(
                                            child: Container(
                                              height: 1,
                                              color: isDark
                                                  ? const Color(0xFF27272A)
                                                  : const Color(0xFFE4EBE8),
                                            ),
                                          ),
                                        ],
                                      ),

                                      const SizedBox(height: 18),

                                      // Google Social Login Button
                                      Container(
                                        height: 54,
                                        decoration: BoxDecoration(
                                          color: isDark ? const Color(0xFF1E1E24) : Colors.white,
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(
                                            color: fieldBorder,
                                            width: 1.5,
                                          ),
                                        ),
                                        child: Material(
                                          color: Colors.transparent,
                                          child: InkWell(
                                            onTap: isLoading ? null : _handleGoogleLogin,
                                            borderRadius: BorderRadius.circular(16),
                                            child: Row(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              children: [
                                                SvgPicture.string(
                                                  _googleSvgString,
                                                  width: 20,
                                                  height: 20,
                                                ),
                                                const SizedBox(width: 10),
                                                Text(
                                                  'Google দিয়ে চালিয়ে যান',
                                                  style: TextStyle(
                                                    fontFamily: 'HindSiliguri',
                                                    fontSize: 15.5,
                                                    fontWeight: FontWeight.w600,
                                                    color: textPrimary,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),

                                      const SizedBox(height: 26),

                                      // Footer: Registration link
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            'অ্যাকাউন্ট নেই? ',
                                            style: TextStyle(
                                              fontFamily: 'HindSiliguri',
                                              fontSize: 14.5,
                                              fontWeight: FontWeight.w500,
                                              color: textMuted,
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () {
                                              HapticFeedback.selectionClick();
                                              context.push('/signup');
                                            },
                                            behavior: HitTestBehavior.opaque,
                                            child: const Padding(
                                              padding: EdgeInsets.symmetric(
                                                vertical: 4,
                                                horizontal: 2,
                                              ),
                                              child: Text(
                                                'নতুন অ্যাকাউন্ট খুলুন',
                                                style: TextStyle(
                                                  fontFamily: 'HindSiliguri',
                                                  fontSize: 14.5,
                                                  fontWeight: FontWeight.w700,
                                                  color: Color(0xFF0A8A66),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ), // Container
                              ), // Expanded
                            ],
                          ), // Column
                        ), // IntrinsicHeight
                      ), // ConstrainedBox
                    ); // SingleChildScrollView
                  },
                ), // LayoutBuilder
              ), // AnimatedBuilder
            ), // ConstrainedBox maxWidth
          ), // Center
        ), // SafeArea
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSupportButton(BuildContext context, bool isDark) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.push('/login-support');
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1E24) : Colors.white.withValues(alpha: 0.8),
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: isDark ? const Color(0xFF2E2E36) : const Color(0xFFD5E8E0),
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF066B4F).withValues(alpha: 0.05),
              blurRadius: 4,
            ),
          ],
        ),
        child: const Text(
          'সাপোর্ট লাগবে?',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF066B4F),
          ),
        ),
      ),
    );
  }
}
