import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/presentation/widgets/app_button_3d.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/data/college_list.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/presentation/widgets/app_dropdown.dart';

class CompleteProfileView extends ConsumerStatefulWidget {
  const CompleteProfileView({super.key});

  @override
  ConsumerState<CompleteProfileView> createState() =>
      _CompleteProfileViewState();
}

class _CompleteProfileViewState extends ConsumerState<CompleteProfileView>
    with SingleTickerProviderStateMixin {
  final _phoneController = TextEditingController();
  final _instituteController = TextEditingController();
  final _passwordController = TextEditingController();

  int _step = 1; // 1: Mandatory Academic Info, 2: Optional Info
  String _stream = 'HSC';
  String _group = 'Science';
  String _batch = 'HSC 2026';
  String _examTarget = 'Engineering';
  bool _showPassword = false;
  bool _isSubmitting = false;

  List<String> _collegeSuggestions = [];
  bool _showSuggestions = false;

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
    _phoneController.dispose();
    _instituteController.removeListener(_onInstituteChanged);
    _instituteController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _onInstituteChanged() {
    final text = _instituteController.text.trim();
    if (text.length >= 2) {
      final suggestions = searchColleges(text);
      setState(() {
        _collegeSuggestions = suggestions;
        _showSuggestions = suggestions.isNotEmpty;
      });
    } else {
      if (_showSuggestions) {
        setState(() => _showSuggestions = false);
      }
    }
  }

  void _handleStreamChange(String s) {
    setState(() {
      _stream = s;
      _batch = s == 'HSC' ? 'HSC 2026' : 'SSC 2026';
    });
  }

  String? _validateStep1() {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      return 'মোবাইল নম্বর উল্লেখ করা আবশ্যক';
    }

    if (!RegExp(r'^01[3-9]\d{8}$').hasMatch(phone)) {
      return 'সঠিক মোবাইল নম্বর দাও (যেমন: 017XXXXXXXX)';
    }

    final mainPart = phone.substring(3);
    if (mainPart.split('').toSet().length == 1 ||
        phone.contains('123456') ||
        phone.contains('987654')) {
      return 'অনুগ্রহ করে একটি সঠিক ও সচল মোবাইল নম্বর দাও';
    }

    final institute = _instituteController.text.trim();
    if (institute.isEmpty) {
      return 'তোমার শিক্ষা প্রতিষ্ঠানের নাম লেখো';
    }

    return null;
  }

  void _handleNext() {
    final error = _validateStep1();
    if (error != null) {
      AppPopups.show(context, message: error, isError: true);
      return;
    }
    HapticFeedback.lightImpact();
    setState(() => _step = 2);
  }

  void _handleBack() {
    HapticFeedback.lightImpact();
    setState(() => _step = 1);
  }

  Future<void> _handleSubmit({bool isSkipping = false}) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      AppPopups.show(
        context,
        message: 'সেশন পাওয়া যায়নি। অনুগ্রহ করে আবার লগইন করুন।',
        isError: true,
      );
      context.go('/login');
      return;
    }

    if (!isSkipping) {
      final step1Error = _validateStep1();
      if (step1Error != null) {
        setState(() => _step = 1);
        AppPopups.show(context, message: step1Error, isError: true);
        return;
      }
    }

    final password = _passwordController.text.trim();
    if (!isSkipping && password.isNotEmpty && password.length < 6) {
      AppPopups.show(
        context,
        message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
        isError: true,
      );
      return;
    }

    setState(() => _isSubmitting = true);
    HapticFeedback.lightImpact();

    try {
      final name = user.userMetadata?['full_name'] as String? ??
          user.userMetadata?['name'] as String? ??
          user.email?.split('@').first ??
          'Student';

      final phone = _phoneController.text.trim();
      final institute = _instituteController.text.trim();
      final avatarUrl =
          'https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}&scale=120&radius=0&backgroundColor=b6e3f4,c0aede,d1d4f9';

      // 1. Upsert profile into public.users
      await Supabase.instance.client.from('users').upsert({
        'id': user.id,
        'email': user.email,
        'name': name,
        'phone': phone.isNotEmpty ? phone : null,
        'institute': institute.isNotEmpty
            ? normalizeCollegeName(institute)
            : 'অনির্ধারিত',
        'stream': _stream,
        'division': _group,
        'batch': _batch,
        'exam_target': _examTarget.isNotEmpty ? _examTarget : null,
        'optional_subject': 'Biology',
        'role': 'Student',
        'status': 'Active',
        'avatar_url': avatarUrl,
        'xp': 0,
        'level': 'Beginner',
        'exams_taken': 0,
        'enrolled_exams': 0,
        'last_active': DateTime.now().toIso8601String(),
      });

      // 2. Set password if optional password provided
      if (!isSkipping && password.isNotEmpty) {
        try {
          await Supabase.instance.client.auth.updateUser(
            UserAttributes(password: password),
          );
        } catch (pwdErr) {
          debugPrint('[CompleteProfile] Set password error: $pwdErr');
        }
      }

      // 3. Refresh global Auth state
      ref.read(authProvider.notifier).refreshUser();

      if (!mounted) return;
      HapticFeedback.mediumImpact();
      AppPopups.success(
        context,
        message: 'স্বাগতম! তোমার অ্যাকাউন্ট প্রস্তুত হয়েছে 🎉',
      );
      context.go('/');
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      AppPopups.show(
        context,
        message: 'প্রোফাইল তৈরি করা যায়নি: ${e.toString()}',
        isError: true,
      );
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
          final user = Supabase.instance.client.auth.currentUser;

          final sheetBg = isDark ? const Color(0xFF111513) : Colors.white;
          final textPrimary = isDark ? Colors.white : const Color(0xFF0F1F1A);
          final textMuted =
              isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7A74);

          final displayName = user?.userMetadata?['full_name'] as String? ??
              user?.userMetadata?['name'] as String? ??
              user?.email?.split('@').first ??
              'Student';
          final email = user?.email ?? '';

          return PopScope(
            canPop: _step == 1,
            onPopInvokedWithResult: (didPop, result) {
              if (didPop) return;
              if (_step == 2) {
                setState(() => _step = 1);
              }
            },
            child: AnnotatedRegion<SystemUiOverlayStyle>(
              value: (isDark
                      ? SystemUiOverlayStyle.light
                      : SystemUiOverlayStyle.dark)
                  .copyWith(
                statusBarColor: Colors.transparent,
                systemNavigationBarColor: sheetBg,
              ),
              child: Scaffold(
                backgroundColor: sheetBg,
                body: Stack(
                  children: [
                    // 1. Ambient Background Gradient (Exact match with signup_view)
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: isDark
                              ? const LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Color(0xFF0A0F0D),
                                    Color(0xFF0D1412),
                                  ],
                                )
                              : const LinearGradient(
                                  begin: Alignment(-0.6, -1.0),
                                  end: Alignment(0.6, 1.0),
                                  colors: [
                                    Color(0xFFFBFEFD),
                                    Color(0xFFEEF7F3),
                                  ],
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
                                final bottomPad =
                                    MediaQuery.paddingOf(context).bottom;
                                return SingleChildScrollView(
                                  physics: const BouncingScrollPhysics(),
                                  child: ConstrainedBox(
                                    constraints: BoxConstraints(
                                      minHeight: constraints.maxHeight,
                                    ),
                                    child: IntrinsicHeight(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.stretch,
                                        children: [
                                          // Top Support Button (Top Right)
                                          Padding(
                                            padding: const EdgeInsets.fromLTRB(
                                                20, 14, 20, 0),
                                            child: Align(
                                              alignment: Alignment.topRight,
                                              child: _buildSupportButton(
                                                  context, isDark),
                                            ),
                                          ),

                                          // Hero: Logo + Slogan (Exact match with signup_view)
                                          Padding(
                                            padding: const EdgeInsets.fromLTRB(
                                                24, 16, 24, 30),
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

                                          // White Bottom Sheet Card (Matching signup_view)
                                          Expanded(
                                            child: Container(
                                              decoration: BoxDecoration(
                                                color: sheetBg,
                                                borderRadius:
                                                    const BorderRadius.vertical(
                                                  top: Radius.circular(32),
                                                ),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color:
                                                        const Color(0xFF066B4F)
                                                            .withValues(
                                                                alpha: 0.10),
                                                    blurRadius: 40,
                                                    offset:
                                                        const Offset(0, -10),
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
                                              padding: EdgeInsets.fromLTRB(
                                                  24, 24, 24, 32 + bottomPad),
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.stretch,
                                                children: [
                                                  // 2-Step Progress Stepper
                                                  _buildProgressBar(isDark),
                                                  const SizedBox(height: 20),

                                                  // Google User Greeting & Verified Badge
                                                  _buildGoogleVerifiedBanner(
                                                    displayName: displayName,
                                                    email: email,
                                                    isDark: isDark,
                                                    textPrimary: textPrimary,
                                                    textMuted: textMuted,
                                                  ),
                                                  const SizedBox(height: 20),

                                                  // Step Content
                                                  _step == 1
                                                      ? _buildStep1(isDark)
                                                      : _buildStep2(isDark),

                                                  const SizedBox(height: 24),

                                                  // Action Buttons Row (Matching signup_view)
                                                  _buildActionButtons(
                                                      isDark, textPrimary),
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
            ),
          );
        },
      ),
    );
  }

  // 2-Step Progress Stepper matching signup_view style
  Widget _buildProgressBar(bool isDark) {
    const primaryGreen = Color(0xFF0A8A66);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [1, 2].map((s) {
        final isActive = _step >= s;
        final isLineActive = _step > s;
        final stepName = s == 1 ? 'প্রয়োজনীয় তথ্য' : 'ঐচ্ছিক তথ্য';

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
                          : (isDark
                              ? const Color(0xFF27272A)
                              : const Color(0xFFE4E4E7)),
                      width: 1.5,
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
                            : (isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF71717A)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  stepName,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 11.5,
                    fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                    color: isActive
                        ? (isDark ? Colors.white : const Color(0xFF18181B))
                        : (isDark
                            ? const Color(0xFFA1A1AA)
                            : const Color(0xFF71717A)),
                  ),
                ),
              ],
            ),
            if (s < 2)
              Container(
                margin: const EdgeInsets.only(top: 15),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  width: 54,
                  height: 2.5,
                  margin: const EdgeInsets.symmetric(horizontal: 10),
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

  // Google Verified Info Card
  Widget _buildGoogleVerifiedBanner({
    required String displayName,
    required String email,
    required bool isDark,
    required Color textPrimary,
    required Color textMuted,
  }) {
    final cardBg = isDark ? const Color(0xFF1A211E) : const Color(0xFFF6FAF8);
    final cardBorder =
        isDark ? const Color(0xFF22332A) : const Color(0xFFD6EAE1);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: cardBorder, width: 1.2),
      ),
      child: Row(
        children: [
          // Google Multi-Color Icon in Rounded Box
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF111513) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF2E2E36)
                    : const Color(0xFFE4EBE8),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            padding: const EdgeInsets.all(9),
            child: SvgPicture.string(_googleSvgString),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'স্বাগতম, $displayName! 🎉',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  email.isNotEmpty ? email : 'Google Account',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFF0A8A66).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(
                color: const Color(0xFF0A8A66).withValues(alpha: 0.3),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  LucideIcons.checkCircle2,
                  size: 13,
                  color: Color(0xFF0A8A66),
                ),
                SizedBox(width: 4),
                Text(
                  'ভেরিফাইড',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0A8A66),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // STEP 1 CONTENT: Mandatory Academic Information
  Widget _buildStep1(bool isDark) {
    final textMuted =
        isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
    final fieldBorder =
        isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7);
    final textPrimary = isDark ? Colors.white : const Color(0xFF18181B);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Mobile Number
        _buildInputField(
          label: 'মোবাইল নম্বর *',
          icon: LucideIcons.phone,
          controller: _phoneController,
          hint: '01XXXXXXXXX',
          keyboardType: TextInputType.phone,
          isDark: isDark,
        ),
        const SizedBox(height: 14),

        // College / Institute
        _buildInputField(
          label: 'কলেজ / প্রতিষ্ঠান *',
          icon: LucideIcons.graduationCap,
          controller: _instituteController,
          hint: 'যেমন: নটর ডেম কলেজ, ঢাকা কলেজ...',
          isDark: isDark,
        ),

        // Auto-complete suggestions dropdown
        if (_showSuggestions && _collegeSuggestions.isNotEmpty) ...[
          const SizedBox(height: 4),
          Container(
            constraints: const BoxConstraints(maxHeight: 180),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1E24) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: fieldBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ListView.separated(
              shrinkWrap: true,
              padding: EdgeInsets.zero,
              itemCount: _collegeSuggestions.length,
              separatorBuilder: (context, index) => Divider(
                height: 1,
                color: fieldBorder.withValues(alpha: 0.6),
              ),
              itemBuilder: (context, idx) {
                final col = _collegeSuggestions[idx];
                return InkWell(
                  onTap: () {
                    _instituteController.text = col;
                    setState(() => _showSuggestions = false);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    child: Text(
                      col,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: textPrimary,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
        const SizedBox(height: 14),

        // Stream (Class) & Division (Group) Row
        Row(
          children: [
            // Stream (HSC / SSC)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('শ্রেণী', isDark),
                  const SizedBox(height: 7),
                  Row(
                    children: ['HSC', 'SSC'].map((s) {
                      final isSel = _stream == s;
                      return Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(right: s == 'HSC' ? 6 : 0),
                          child: InkWell(
                            onTap: () => _handleStreamChange(s),
                            borderRadius: BorderRadius.circular(16),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: isSel
                                    ? const Color(0xFF0A8A66)
                                    : (isDark
                                        ? const Color(0xFF141417)
                                        : const Color(0xFFF6F9F8)),
                                border: Border.all(
                                  color: isSel
                                      ? const Color(0xFF0A8A66)
                                      : fieldBorder,
                                  width: 1.2,
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                s,
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w700,
                                  color: isSel ? Colors.white : textMuted,
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Division / Group Dropdown
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('বিভাগ', isDark),
                  const SizedBox(height: 7),
                  AppDropdown<String>(
                    value: _group,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    options: const [
                      AppDropdownOption(value: 'Science', label: 'বিজ্ঞান'),
                      AppDropdownOption(value: 'Humanities', label: 'মানবিক'),
                      AppDropdownOption(
                          value: 'Commerce', label: 'ব্যবসায় শিক্ষা'),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _group = val);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Batch Chips
        _buildLabel(
          _stream == 'HSC' ? 'এইচএসসি ব্যাচ' : 'এসএসসি ব্যাচ',
          isDark,
        ),
        const SizedBox(height: 7),
        Row(
          children: (_stream == 'HSC'
                  ? ['HSC 2026', 'HSC 2025', 'HSC 2027']
                  : ['SSC 2026', 'SSC 2027', 'SSC 2028'])
              .map((b) {
            final isSel = _batch == b;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                    right: (b != 'HSC 2027' && b != 'SSC 2028') ? 6 : 0),
                child: InkWell(
                  onTap: () => setState(() => _batch = b),
                  borderRadius: BorderRadius.circular(14),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    decoration: BoxDecoration(
                      color: isSel
                          ? const Color(0xFF0A8A66).withValues(alpha: 0.14)
                          : (isDark
                              ? const Color(0xFF141417)
                              : const Color(0xFFF6F9F8)),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSel
                            ? const Color(0xFF0A8A66)
                            : fieldBorder,
                        width: isSel ? 1.5 : 1,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      b,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 12.5,
                        fontWeight:
                            isSel ? FontWeight.w700 : FontWeight.w500,
                        color: isSel
                            ? (isDark
                                ? const Color(0xFF34D399)
                                : const Color(0xFF0A8A66))
                            : textMuted,
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

  // STEP 2 CONTENT: Optional Exam Target & Password
  Widget _buildStep2(bool isDark) {
    final textMuted =
        isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
    final fieldBorder =
        isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7);
    final fieldBg =
        isDark ? const Color(0xFF141417) : const Color(0xFFFFFFFF);
    final textPrimary = isDark ? Colors.white : const Color(0xFF18181B);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Helper Note Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18201C) : const Color(0xFFF0F7F4),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark
                  ? const Color(0xFF22352B)
                  : const Color(0xFFD4EAE0),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                LucideIcons.info,
                size: 17,
                color: Color(0xFF0A8A66),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'এই তথ্যগুলো ঐচ্ছিক। তুমি চাইলে এগুলো এখনই নির্বাচন করতে পারো অথবা পরে প্রোফাইল থেকেও পরিবর্তন করতে পারবে।',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 12.5,
                    color: isDark
                        ? const Color(0xFFD1D5DB)
                        : const Color(0xFF374151),
                    height: 1.45,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Exam Target
        _buildLabel('ভর্তি পরীক্ষার লক্ষ্য (ঐচ্ছিক)', isDark),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildTargetCard(
              id: 'Engineering',
              emoji: '⚙️',
              title: 'ইঞ্জিনিয়ারিং',
              isDark: isDark,
              fieldBorder: fieldBorder,
            ),
            const SizedBox(width: 8),
            _buildTargetCard(
              id: 'Medical',
              emoji: '🩺',
              title: 'মেডিকেল',
              isDark: isDark,
              fieldBorder: fieldBorder,
            ),
            const SizedBox(width: 8),
            _buildTargetCard(
              id: 'University',
              emoji: '🏛️',
              title: 'ভার্সিটি',
              isDark: isDark,
              fieldBorder: fieldBorder,
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Optional Password
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildLabel('পাসওয়ার্ড (ঐচ্ছিক)', isDark),
            Text(
              'ঐচ্ছিক',
              style: TextStyle(
                fontFamily: 'HindSiliguri',
                fontSize: 11.5,
                color: textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 7),
        TextFormField(
          controller: _passwordController,
          obscureText: !_showPassword,
          style: TextStyle(
            fontSize: 14.5,
            fontWeight: FontWeight.w500,
            color: textPrimary,
          ),
          decoration: InputDecoration(
            hintText: 'ইমেইল দিয়ে লগইন করতে চাইলে (কমপক্ষে ৬ অক্ষর)',
            hintStyle: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 13.5,
              color: textMuted.withValues(alpha: 0.7),
            ),
            prefixIcon: Icon(
              LucideIcons.lock,
              size: 18,
              color: textMuted,
            ),
            suffixIcon: IconButton(
              icon: Icon(
                _showPassword ? LucideIcons.eyeOff : LucideIcons.eye,
                size: 18,
                color: textMuted,
              ),
              onPressed: () => setState(() => _showPassword = !_showPassword),
            ),
            filled: true,
            fillColor: fieldBg,
            contentPadding:
                const EdgeInsets.symmetric(vertical: 15, horizontal: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: fieldBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: fieldBorder),
            ),
            focusedBorder: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(16)),
              borderSide: BorderSide(color: Color(0xFF0A8A66), width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '💡 পাসওয়ার্ড না দিলেও তুমি সবসময় ১-ট্যাপে Google দিয়ে লগইন করতে পারবে।',
          style: TextStyle(
            fontFamily: 'HindSiliguri',
            fontSize: 11.5,
            color: textMuted,
          ),
        ),
      ],
    );
  }

  // Action Buttons Row: Next (Step 1) or Back + Finish (Step 2)
  Widget _buildActionButtons(bool isDark, Color textPrimary) {
    final fieldBorder =
        isDark ? const Color(0xFF27272A) : const Color(0xFFE4EBE8);

    if (_step == 1) {
      return Container(
        height: 54,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF0A8A66), Color(0xFF066B4F)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF066B4F).withValues(alpha: 0.35),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: _handleNext,
            borderRadius: BorderRadius.circular(16),
            child: const Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'পরবর্তী ধাপ',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 16.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(width: 6),
                  Icon(
                    LucideIcons.chevronRight,
                    size: 18,
                    color: Colors.white,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Column(
      children: [
        Row(
          children: [
            // Back Button
            InkWell(
              onTap: _handleBack,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF1E1E24)
                      : const Color(0xFFF6F9F8),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: fieldBorder,
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

            // Submit Button (3D Deepest Green)
            Expanded(
              child: AppButton3D(
                text: 'পড়াশোনা শুরু করো 🚀',
                onPressed: _isSubmitting ? null : () => _handleSubmit(),
                isLoading: _isSubmitting,
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
        const SizedBox(height: 14),

        // Skip to Dashboard Option
        Center(
          child: GestureDetector(
            onTap: _isSubmitting
                ? null
                : () => _handleSubmit(isSkipping: true),
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
              child: Text(
                'পরে সেট করব (সরাসরি ড্যাশবোর্ডে যাও)',
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF6B7A74),
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Label Builder
  Widget _buildLabel(String text, bool isDark) {
    final textMuted =
        isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: 'HindSiliguri',
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: textMuted,
        ),
      ),
    );
  }

  // Generic Input Field
  Widget _buildInputField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required String hint,
    required bool isDark,
    TextInputType keyboardType = TextInputType.text,
  }) {
    final textMuted =
        isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
    final fieldBg =
        isDark ? const Color(0xFF141417) : const Color(0xFFFFFFFF);
    final fieldBorder =
        isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7);
    final textPrimary = isDark ? Colors.white : const Color(0xFF18181B);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label, isDark),
        const SizedBox(height: 7),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: textPrimary,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 14,
              fontWeight: FontWeight.normal,
              color: textMuted.withValues(alpha: 0.7),
            ),
            prefixIcon: Icon(
              icon,
              size: 18,
              color: textMuted,
            ),
            filled: true,
            fillColor: fieldBg,
            contentPadding: const EdgeInsets.symmetric(
              vertical: 15,
              horizontal: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: fieldBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: fieldBorder),
            ),
            focusedBorder: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(16)),
              borderSide: BorderSide(color: Color(0xFF0A8A66), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  // Exam Target Selection Card
  Widget _buildTargetCard({
    required String id,
    required String emoji,
    required String title,
    required bool isDark,
    required Color fieldBorder,
  }) {
    final isSelected = _examTarget == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _examTarget = isSelected ? '' : id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF0A8A66).withValues(alpha: 0.12)
                : (isDark
                    ? const Color(0xFF141417)
                    : const Color(0xFFFFFFFF)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? const Color(0xFF0A8A66) : fieldBorder,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 22)),
              const SizedBox(height: 6),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 12.5,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  color: isSelected
                      ? (isDark
                          ? const Color(0xFF34D399)
                          : const Color(0xFF0A8A66))
                      : (isDark
                          ? Colors.white70
                          : const Color(0xFF374151)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Top Support Button (Matching signup_view)
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
          color: isDark
              ? const Color(0xFF1E1E24)
              : Colors.white.withValues(alpha: 0.8),
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: isDark
                ? const Color(0xFF2E2E36)
                : const Color(0xFFD5E8E0),
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
