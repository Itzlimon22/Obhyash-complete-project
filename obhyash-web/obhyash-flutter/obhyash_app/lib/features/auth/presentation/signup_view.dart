import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/presentation/widgets/app_button_3d.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/presentation/widgets/app_dropdown.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/config/app_config.dart';
import 'widgets/otp_verification_dialog.dart';

import '../providers/auth_controller.dart';
import '../../../core/data/college_list.dart';

class SignupView extends ConsumerStatefulWidget {
  const SignupView({super.key});

  @override
  ConsumerState<SignupView> createState() => _SignupViewState();
}

class _SignupViewState extends ConsumerState<SignupView>
    with SingleTickerProviderStateMixin {
  int _step = 1;
  bool _success = false;

  static const _googleSvgString = '''
<svg viewBox="0 0 24 24" width="20" height="20">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
</svg>
''';

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

  // Form Fields
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  String _gender = '';

  // Phone OTP Verification State
  bool _isPhoneVerified = false;
  String _verifiedPhone = '';
  bool _isSendingOtp = false;

  final _instituteController = TextEditingController();
  String _stream = 'HSC';
  String _group = 'Science';
  String _batch = 'HSC 2026';

  List<String> _collegeSuggestions = [];
  bool _showCollegeSuggestions = false;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _showPassword = false;

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
    _instituteController.addListener(_onInstituteChanged);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _instituteController.removeListener(_onInstituteChanged);
    _instituteController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _onInstituteChanged() {
    final text = _instituteController.text.trim();
    final suggestions = searchColleges(text);
    setState(() {
      _collegeSuggestions = suggestions;
      _showCollegeSuggestions = text.isNotEmpty;
    });
  }

  String? _validateStep(int currentStep) {
    if (currentStep == 1) {
      if (_nameController.text.trim().isEmpty) {
        return 'তোমার নাম উল্লেখ করা আবশ্যক';
      }

      final phone = _phoneController.text.trim();
      if (phone.isEmpty) return 'মোবাইল নম্বর উল্লেখ করা আবশ্যক';

      if (!RegExp(r'^01[3-9]\d{8}$').hasMatch(phone)) {
        return 'সঠিক মোবাইল নম্বর দাও (যেমন: 017XXXXXXXX)';
      }

      // Restrict fake or sequential numbers intelligently
      final mainPart = phone.substring(3);
      if (mainPart.split('').toSet().length == 1 ||
          phone.contains('123456') ||
          phone.contains('987654')) {
        return 'অনুগ্রহ করে একটি সঠিক ও সচল মোবাইল নম্বর দাও';
      }
    } else if (currentStep == 2) {
      if (_instituteController.text.trim().isEmpty) {
        return 'তোমার শিক্ষা প্রতিষ্ঠানের নাম লেখো';
      }
      if (_gender.isEmpty) {
        return 'লিঙ্গ (Gender) নির্বাচন করা আবশ্যক';
      }
    } else if (currentStep == 3) {
      if (_emailController.text.trim().isEmpty ||
          _passwordController.text.isEmpty ||
          _confirmPasswordController.text.isEmpty) {
        return 'সব তথ্য পূরণ করতে হবে';
      }
      if (!RegExp(
        r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
      ).hasMatch(_emailController.text.trim())) {
        return 'সঠিক ইমেইল এড্রেস দাও (যেমন: example@gmail.com)';
      }
      if (_passwordController.text.length < 6) {
        return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
      }
      if (_passwordController.text != _confirmPasswordController.text) {
        return 'পাসওয়ার্ড দুটি মিলছে না';
      }
    }
    return null;
  }

  Future<void> _handleNext() async {
    final errorMsg = _validateStep(_step);
    if (errorMsg != null) {
      AppPopups.show(context, message: errorMsg, isError: true);
      return;
    }

    // Step 1: Enforce OTP Verification before proceeding
    if (_step == 1) {
      final currentPhone = _phoneController.text.trim();

      // Check if SMS verification is enabled or bypassed
      if (!AppConfig.enableSmsOtpVerification) {
        setState(() {
          _isPhoneVerified = true;
          _verifiedPhone = currentPhone;
          _step = 2;
        });
        return;
      }

      final isAlreadyVerified =
          _isPhoneVerified && _verifiedPhone == currentPhone;

      if (!isAlreadyVerified) {
        setState(() => _isSendingOtp = true);

        final authNotifier = ref.read(authControllerProvider.notifier);
        final res = await authNotifier.sendRegistrationOtp(currentPhone);

        if (!mounted) return;
        setState(() => _isSendingOtp = false);

        if (res['success'] == true) {
          final cooldownSec =
              (res['cooldown_seconds'] as num?)?.toInt() ?? 60;

          final verified = await OtpVerificationDialog.show(
            context,
            phone: currentPhone,
            initialCooldown: cooldownSec,
            onVerify: (otp) =>
                authNotifier.verifyRegistrationOtp(currentPhone, otp),
            onResend: () =>
                authNotifier.sendRegistrationOtp(currentPhone),
          );

          if (verified == true && mounted) {
            setState(() {
              _isPhoneVerified = true;
              _verifiedPhone = currentPhone;
              _step = 2;
            });
            AppPopups.success(
              context,
              message: 'মোবাইল নম্বর সফলভাবে যাচাই করা হয়েছে! 🎉',
            );
          }
        } else {
          AppPopups.show(
            context,
            message: res['error']?.toString() ?? 'ওটিপি পাঠানো যায়নি',
            isError: true,
          );
        }
        return;
      }
    }

    setState(() {
      _step++;
    });
  }

  void _handleBack() {
    setState(() {
      _step--;
    });
  }

  void _handleSignup() async {
    final errorMsg = _validateStep(3);
    if (errorMsg != null) {
      AppPopups.show(context, message: errorMsg, isError: true);
      return;
    }

    await ref
        .read(authControllerProvider.notifier)
        .signup(
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
          gender: _gender.isEmpty ? null : _gender,
          institute: normalizeCollegeName(_instituteController.text.trim()),
          stream: _stream,
          group: _group,
          batch: _batch,
          examTarget: null,
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

    if (!mounted) return;
    final authState = ref.read(authControllerProvider);
    if (authState.hasError) {
      AppPopups.show(context, message: authState.error.toString(), isError: true);
    } else if (!authState.isLoading) {
      setState(() => _success = true);
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
      child: Builder(
        builder: (context) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          final authState = ref.watch(authControllerProvider);
          final isLoading = authState.isLoading;

          final sheetBg = isDark ? const Color(0xFF111513) : Colors.white;
          final textPrimary = isDark ? Colors.white : const Color(0xFF0F1F1A);
          final textMuted = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7A74);
          final dividerColor = isDark ? const Color(0xFF222E28) : const Color(0xFFE4EBE8);

          if (_success) {
            return _buildSuccessScreen(isDark, textPrimary, sheetBg);
          }

          return AnnotatedRegion<SystemUiOverlayStyle>(
            value: (isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark).copyWith(
              statusBarColor: Colors.transparent,
              systemNavigationBarColor: sheetBg,
            ),
            child: Scaffold(
              backgroundColor: sheetBg,
              body: Stack(
                children: [
                  // 1. Ambient Background Gradient
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
                                        // Top support button (top left)
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
                                            padding: EdgeInsets.fromLTRB(24, 26, 24, 36 + bottomPad),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.stretch,
                                              children: [
                                                _buildProgressBar(isDark),
                                                const SizedBox(height: 24),

                                                // Render Step Content
                                                _step == 1
                                                    ? _buildStep1(isDark)
                                                    : _step == 2
                                                    ? _buildStep2(isDark)
                                                    : _buildStep3(isDark),

                                                const SizedBox(height: 24),

                                                // Action Buttons
                                                Row(
                                                  children: [
                                                    if (_step > 1) ...[
                                                      InkWell(
                                                        onTap: _handleBack,
                                                        borderRadius: BorderRadius.circular(16),
                                                        child: Container(
                                                          width: 54,
                                                          height: 54,
                                                          decoration: BoxDecoration(
                                                            color: isDark ? const Color(0xFF1E1E24) : const Color(0xFFF6F9F8),
                                                            borderRadius: BorderRadius.circular(16),
                                                            border: Border.all(
                                                              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4EBE8),
                                                              width: 1.5,
                                                            ),
                                                          ),
                                                          child: Icon(
                                                            LucideIcons.chevronLeft,
                                                            size: 22,
                                                            color: textPrimary,
                                                          ),
                                                        ),
                                                      ),
                                                      const SizedBox(width: 12),
                                                    ],
                                                    Expanded(
                                                      child: AppButton3D(
                                                        text: _step == 3
                                                            ? 'অ্যাকাউন্ট তৈরি করো'
                                                            : 'পরবর্তী ধাপ',
                                                        suffixIcon: _step == 3
                                                            ? null
                                                            : const Icon(
                                                                LucideIcons.chevronRight,
                                                                size: 18,
                                                                color: Colors.white,
                                                              ),
                                                        onPressed: (isLoading || _isSendingOtp)
                                                            ? null
                                                            : (_step == 3 ? _handleSignup : _handleNext),
                                                        isLoading: (isLoading || _isSendingOtp),
                                                        baseColor: AppColors.viridianForest,
                                                        shadowColor: AppColors.brandGreenDark,
                                                        height: 52,
                                                        borderRadius: 16,
                                                        depth: 4.5,
                                                        fontSize: 16.5,
                                                        fontWeight: FontWeight.w700,
                                                      ),
                                                    ),
                                                  ],
                                                ),

                                                if (_step == 1) ...[
                                                  const SizedBox(height: 24),
                                                  Row(
                                                    children: [
                                                      Expanded(
                                                        child: Container(
                                                          height: 1,
                                                          color: dividerColor,
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
                                                          color: dividerColor,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 18),
                                                  _buildGoogleButton(isDark, textPrimary, dividerColor),
                                                ],

                                                const SizedBox(height: 26),

                                                // Existing Account Login Prompt
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.center,
                                                  children: [
                                                    Text(
                                                      'ইতিমধ্যে অ্যাকাউন্ট আছে? ',
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
                                                        context.push('/login');
                                                      },
                                                      behavior: HitTestBehavior.opaque,
                                                      child: const Padding(
                                                        padding: EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                                                        child: Text(
                                                          'লগইন করুন',
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
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );

},
),
);
}

  Widget _buildProgressBar(bool isDark) {
    const primaryGreen = Color(0xFF006A4E);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [1, 2, 3].map((s) {
        final isActive = _step >= s;
        final isLineActive = _step > s;

        String stepName = '';
        if (s == 1) stepName = 'বেসিক তথ্য';
        if (s == 2) stepName = 'একাডেমিক';
        if (s == 3) stepName = 'অ্যাকাউন্ট';

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isActive
                        ? primaryGreen
                        : (isDark
                            ? const Color(0xFF141417)
                            : const Color(0xFFF4F4F5)),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isActive
                          ? primaryGreen
                          : (isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7)),
                      width: 1,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      s.toString(),
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isActive
                            ? Colors.white
                            : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  stepName,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                    color: isActive
                        ? (isDark ? Colors.white : const Color(0xFF18181B))
                        : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A)),
                  ),
                ),
              ],
            ),
            if (s < 3)
              Container(
                margin: const EdgeInsets.only(top: 14),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 500),
                  width: 28,
                  height: 2.5,
                  margin: const EdgeInsets.symmetric(horizontal: 6),
                  decoration: BoxDecoration(
                    color: isLineActive
                        ? primaryGreen
                        : (isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFE4E4E7)),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildLabel(String text, bool isDark, {String? tooltip}) {
    final textMuted = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
    final labelText = Text(
      text,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: textMuted,
      ),
    );

    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: tooltip != null
          ? Row(
              children: [
                labelText,
                const SizedBox(width: 8),
                Tooltip(
                  message: tooltip,
                  triggerMode: TooltipTriggerMode.tap,
                  showDuration: const Duration(seconds: 4),
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  padding: const EdgeInsets.all(12),
                  textStyle: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.normal,
                    color: Colors.white,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    LucideIcons.info,
                    size: 15,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                  ),
                ),
              ],
            )
          : labelText,
    );
  }

  Widget _buildStep1(bool isDark) {
    final isVerified = _isPhoneVerified &&
        _phoneController.text.trim().isNotEmpty &&
        _phoneController.text.trim() == _verifiedPhone;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInputField(
          label: 'তোমার নাম',
          icon: LucideIcons.user,
          controller: _nameController,
          hint: 'পূর্ণ নাম (Full Name)',
          isDark: isDark,
        ),
        const SizedBox(height: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildLabel('মোবাইল নম্বর', isDark),
                const SizedBox(width: 8),
                if (isVerified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF064E3B).withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          LucideIcons.checkCircle2,
                          size: 13,
                          color: Color(0xFF34D399),
                        ),
                        SizedBox(width: 4),
                        Text(
                          'যাচাইকৃত',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.normal,
                            color: Color(0xFF34D399),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 5),
            _buildInputField(
              label: '',
              icon: LucideIcons.phone,
              controller: _phoneController,
              hint: '017XXXXXXXX',
              isDark: isDark,
              keyboardType: TextInputType.phone,
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF141417) : const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
            ),
          ),
          child: Row(
            children: [
              const Icon(
                LucideIcons.shieldCheck,
                size: 15,
                color: Color(0xFF34D399),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'পরবর্তী ধাপে যাওয়ার সময় তোমার মোবাইলে ৬ ডিজিটের ওটিপি যাচাই কোড পাঠানো হবে।',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.normal,
                    color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF4B5563),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep2(bool isDark) {
    final batchYears = _stream == 'SSC'
        ? [2026, 2027, 2028]
        : [2025, 2026, 2027, 2028];
    final batchOptions = batchYears.map((y) => '$_stream $y').toList();

    // Ensure _batch is valid for current stream
    if (!batchOptions.contains(_batch)) {
      _batch = batchOptions.first;
    }

    final groupOptions = _stream == 'SSC'
        ? const [
            AppDropdownOption(value: 'Science', label: 'Science (বিজ্ঞান)'),
            AppDropdownOption(value: 'Business Studies', label: 'Business Studies (ব্যবসায় শিক্ষা)'),
            AppDropdownOption(value: 'Humanities', label: 'Humanities (মানবিক)'),
          ]
        : const [
            AppDropdownOption(value: 'Science', label: 'Science (বিজ্ঞান)'),
            AppDropdownOption(
              value: 'Business Studies',
              label: 'Business Studies (ব্যবসায় শিক্ষা)',
              isEnabled: false,
              disabledBadge: 'শীঘ্রই আসছে',
            ),
            AppDropdownOption(
              value: 'Humanities',
              label: 'Humanities (মানবিক)',
              isEnabled: false,
              disabledBadge: 'শীঘ্রই আসছে',
            ),
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInputField(
          label: _stream == 'SSC' ? 'স্কুল / শিক্ষা প্রতিষ্ঠান' : 'শিক্ষা প্রতিষ্ঠান',
          icon: LucideIcons.school,
          controller: _instituteController,
          hint: _stream == 'SSC' ? 'স্কুলের নাম লিখো' : 'কলেজ / স্কুলের নাম',
          isDark: isDark,
          tooltip: 'লিস্টে না থাকলে তোমার প্রতিষ্ঠানের পুরো নাম লিখে পরবর্তী ধাপে যাও।',
        ),
        if (_showCollegeSuggestions) ...[
          const SizedBox(height: 4),
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141417) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                ..._collegeSuggestions.map((name) {
                  return InkWell(
                    onTap: () {
                      _instituteController.text = name;
                      setState(() {
                        _showCollegeSuggestions = false;
                        _collegeSuggestions.clear();
                      });
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: isDark ? Colors.white10 : Colors.black12,
                            width: 1,
                          ),
                        ),
                      ),
                      child: Text(
                        name,
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.normal,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ),
                  );
                }),
                if (_instituteController.text.trim().isNotEmpty &&
                    !_collegeSuggestions.contains(_instituteController.text.trim()))
                  InkWell(
                    onTap: () {
                      setState(() {
                        _showCollegeSuggestions = false;
                        _collegeSuggestions.clear();
                      });
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF0F291E)
                            : const Color(0xFFECFDF5),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.add_circle_outline,
                            size: 15,
                            color: Color(0xFF059669),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'প্রতিষ্ঠান হিসেবে "${_instituteController.text.trim()}" ব্যবহার করো',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF059669),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ] else if (_instituteController.text.isNotEmpty) ...[
          const SizedBox(height: 6),
        ],
        const SizedBox(height: 12),

        _buildLabel('স্ট্রিম (Stream)', isDark, tooltip: 'তুমি যে ক্লাসে বা প্রোগ্রামে আছো'),
        const SizedBox(height: 5),
        _buildDropdown(
          icon: LucideIcons.bookOpen,
          value: _stream,
          options: const ['HSC', 'SSC'],
          isDark: isDark,
          onChanged: (val) {
            if (val != null) {
              setState(() {
                _stream = val;
                if (val == 'HSC') {
                  _batch = 'HSC 2026';
                  _group = 'Science';
                } else if (val == 'SSC') {
                  _batch = 'SSC 2026';
                }
              });
            }
          },
        ),
        const SizedBox(height: 12),

        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('বিভাগ (Division)', isDark, tooltip: 'তোমার পঠিত বিষয়সমূহ'),
                  const SizedBox(height: 5),
                  _buildDropdown(
                    icon: LucideIcons.graduationCap,
                    value: _group,
                    customOptions: groupOptions,
                    isDark: isDark,
                    onChanged: (val) {
                      if (val != null) setState(() => _group = val);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('ব্যাচ', isDark),
                  const SizedBox(height: 5),
                  _buildDropdown(
                    icon: LucideIcons.graduationCap,
                    value: _batch,
                    options: batchOptions,
                    isDark: isDark,
                    onChanged: (val) => setState(() => _batch = val!),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        _buildLabel('লিঙ্গ (Gender)', isDark),
        const SizedBox(height: 7),
        Row(
          children: ['Male', 'Female'].map((g) {
            final isSelected = _gender == g;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: g == 'Male' ? 10 : 0),
                child: InkWell(
                  onTap: () => setState(() => _gender = g),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 9.5),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF006A4E).withValues(alpha: 0.15)
                          : (isDark
                                ? const Color(0xFF141417)
                                : const Color(0xFFFFFFFF)),
                      border: isSelected
                          ? Border.all(
                              color: const Color(0xFF006A4E),
                              width: 1.5,
                            )
                          : null,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
                          blurRadius: 7,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      g == 'Male' ? 'ছেলে' : 'মেয়ে',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected
                            ? (isDark ? const Color(0xFF34D399) : const Color(0xFF006A4E))
                            : (isDark ? Colors.white70 : const Color(0xFF18181B)),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStep3(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInputField(
          label: 'ইমেইল এড্রেস',
          icon: LucideIcons.mail,
          controller: _emailController,
          hint: 'example@gmail.com',
          isDark: isDark,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        _buildInputField(
          label: 'পাসওয়ার্ড',
          icon: LucideIcons.lock,
          controller: _passwordController,
          hint: '••••••••',
          isDark: isDark,
          obscureText: !_showPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _showPassword ? LucideIcons.eyeOff : LucideIcons.eye,
              size: 18,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
            onPressed: () => setState(() => _showPassword = !_showPassword),
          ),
        ),
        const SizedBox(height: 12),
        _buildInputField(
          label: 'পাসওয়ার্ড কনফার্ম করো',
          icon: LucideIcons.lock,
          controller: _confirmPasswordController,
          hint: '••••••••',
          isDark: isDark,
          obscureText: !_showPassword,
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required IconData icon,
    required String? value,
    List<String> options = const [],
    List<AppDropdownOption<String>>? customOptions,
    required Function(String?) onChanged,
    required bool isDark,
  }) {
    return AppDropdown<String>(
      value: value,
      icon: icon,
      hasBorder: false,
      borderRadius: 12,
      backgroundColor: isDark ? const Color(0xFF141417) : Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9.5),
      fontSize: 14,
      options: customOptions ?? options.map((opt) => AppDropdownOption(value: opt, label: opt)).toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildInputField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required String hint,
    required bool isDark,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType keyboardType = TextInputType.text,
    String? tooltip,
  }) {
    final textMuted = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
    final fieldBg = isDark ? const Color(0xFF141417) : const Color(0xFFFFFFFF);
    final textPrimary = isDark ? Colors.white : const Color(0xFF18181B);
    const primaryGreen = Color(0xFF006A4E);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          _buildLabel(label, isDark, tooltip: tooltip),
          const SizedBox(height: 5),
        ],
        Container(
          decoration: BoxDecoration(
            color: fieldBg,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
                blurRadius: 7,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextFormField(
            controller: controller,
            obscureText: obscureText,
            keyboardType: keyboardType,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: textPrimary,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.normal,
                color: textMuted.withValues(alpha: 0.7),
              ),
              prefixIcon: Icon(
                icon,
                size: 17,
                color: textMuted,
              ),
              suffixIcon: suffixIcon,
              filled: true,
              fillColor: Colors.transparent,
              contentPadding: const EdgeInsets.symmetric(
                vertical: 9.5,
                horizontal: 12,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: const OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
                borderSide: BorderSide(color: primaryGreen, width: 1.5),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessScreen(bool isDark, Color textColor, Color bgColor) {
    const primaryGreen = Color(0xFF006A4E);
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: primaryGreen.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      LucideIcons.checkCircle2,
                      color: Color(0xFF34D399),
                      size: 40,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'রেজিস্ট্রেশন সফল!',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'তোমার অ্যাকাউন্টটি সফলভাবে তৈরি হয়েছে। এখনই তোমার প্রস্তুতি শুরু করো। 🚀',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.normal,
                    color: isDark ? Colors.white70 : const Color(0xFF4B5563),
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryGreen,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'ড্যাশবোর্ডে যাও',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
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

  Widget _buildGoogleButton(bool isDark, Color textPrimary, Color dividerColor) {
    final fieldBorder = isDark ? const Color(0xFF222E28) : const Color(0xFFE4EBE8);
    return Container(
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
          onTap: _handleGoogleLogin,
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
