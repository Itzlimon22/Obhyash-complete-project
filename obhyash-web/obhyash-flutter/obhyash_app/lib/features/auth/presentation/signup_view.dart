import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/presentation/widgets/app_dropdown.dart';
import '../../../core/utils/app_popups.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

  // Form Fields
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  String _gender = '';

  final _instituteController = TextEditingController();
  String _stream = 'HSC';
  String _group = 'Science';
  String _batch = 'HSC 2026';
  String _examTarget = '';

  List<String> _collegeSuggestions = [];
  bool _showCollegeSuggestions = false;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _referralController = TextEditingController();

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
    _loadReferralCode();
  }

  Future<void> _loadReferralCode() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString('referralCode');
    if (code != null && code.isNotEmpty) {
      if (mounted) {
        setState(() {
          _referralController.text = code;
        });
      }
    }
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
    _referralController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _onInstituteChanged() {
    final suggestions = searchColleges(_instituteController.text);
    setState(() {
      _collegeSuggestions = suggestions;
      _showCollegeSuggestions =
          _instituteController.text.isNotEmpty && suggestions.isNotEmpty;
    });
  }

  String? _validateStep(int currentStep) {
    if (currentStep == 1) {
      if (_nameController.text.trim().isEmpty)
        return 'তোমার নাম উল্লেখ করা আবশ্যক';
      if (_phoneController.text.trim().isEmpty)
        return 'মোবাইল নম্বর উল্লেখ করা আবশ্যক';
      if (!RegExp(r'^01\d{9}$').hasMatch(_phoneController.text.trim())) {
        return 'সঠিক মোবাইল নম্বর দাও (যেমন: 01712345678)';
      }
      if (_gender.isEmpty) return 'লিঙ্গ নির্বাচন করা আবশ্যক';
    } else if (currentStep == 2) {
      if (_instituteController.text.trim().isEmpty)
        return 'তোমার শিক্ষা প্রতিষ্ঠানের নাম লেখো';
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
      if (_passwordController.text.length < 6)
        return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
      if (_passwordController.text != _confirmPasswordController.text)
        return 'পাসওয়ার্ড দুটি মিলছে না';
    }
    return null;
  }

  void _handleNext() {
    final errorMsg = _validateStep(_step);
    if (errorMsg != null) {
      AppPopups.show(context, message: errorMsg, isError: true);
      return;
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
          gender: _gender,
          institute: _instituteController.text.trim(),
          stream: _stream,
          group: _group,
          batch: _batch,
          examTarget: _examTarget.isEmpty ? null : _examTarget,
          email: _emailController.text.trim(),
          password: _passwordController.text,
          referralCode: _referralController.text.trim(),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;

    final bgColor = isDark ? Colors.black : Colors.white;
    final textColor = isDark ? Colors.white : Colors.black;

    if (_success) {
      return _buildSuccessScreen(isDark, textColor, bgColor);
    }

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
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
                // Header
                Text(
                  'রেজিস্ট্রেশন',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Anek Bangla',
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'মাত্র ৩টি ধাপে সম্পন্ন করো তোমার রেজিস্ট্রেশন',
                  style: TextStyle(
                    fontSize: 17,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                ),
                const SizedBox(height: 32),

                _buildProgressBar(isDark),
                const SizedBox(height: 32),

                // Render Step Content
                _step == 1
                    ? _buildStep1(isDark)
                    : _step == 2
                    ? _buildStep2(isDark)
                    : _buildStep3(isDark),

                const SizedBox(height: 32),

                // Action Buttons
                Row(
                  children: [
                    if (_step > 1) ...[
                      InkWell(
                        onTap: _handleBack,
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1C1C1E)
                                : const Color(0xFFF5F5F5),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            LucideIcons.chevronLeft,
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],

                    Expanded(
                      child: ElevatedButton(
                        onPressed: isLoading
                            ? null
                            : (_step == 3 ? _handleSignup : _handleNext),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF047857),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: isLoading
                            ? const SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 3,
                                  color: Colors.white,
                                ),
                              )
                            : _step == 3
                            ? const Text(
                                'অ্যাকাউন্ট তৈরি করো',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: FontWeight.bold,
                                ),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'পরবর্তী ধাপ',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontFamily: 'Anek Bangla',
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Icon(
                                    LucideIcons.chevronRight,
                                    size: 20,
                                    color: Colors.white,
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 48),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'আগেই অ্যাকাউন্ট আছে? ',
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 17,
                        color: isDark ? Colors.white70 : Colors.black87,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.push('/login'),
                      child: const Text(
                        'লগইন করো',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFB91C1C),
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
    );
  }

  Widget _buildProgressBar(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [1, 2, 3].map((s) {
        final isActive = _step >= s;
        final isLineActive = _step > s;
        return Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isActive
                    ? const Color(0xFF047857)
                    : (isDark
                          ? const Color(0xFF1C1C1E)
                          : const Color(0xFFF5F5F5)),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  s.toString(),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isActive
                        ? Colors.white
                        : (isDark ? Colors.white54 : Colors.black54),
                  ),
                ),
              ),
            ),
            if (s < 3)
              AnimatedContainer(
                duration: const Duration(milliseconds: 500),
                width: 48,
                height: 4,
                margin: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: isLineActive
                      ? const Color(0xFF047857)
                      : (isDark
                            ? const Color(0xFF1C1C1E)
                            : const Color(0xFFF5F5F5)),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildLabel(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 16,
          fontFamily: 'Anek Bangla',
          fontWeight: FontWeight.w700,
          color: isDark ? Colors.white70 : Colors.black87,
        ),
      ),
    );
  }

  Widget _buildStep1(bool isDark) {
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
        const SizedBox(height: 20),
        _buildInputField(
          label: 'ফোন নাম্বার',
          icon: LucideIcons.phone,
          controller: _phoneController,
          hint: '017xxxxxxxx',
          isDark: isDark,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 20),
        _buildLabel('লিঙ্গ (Gender)', isDark),
        const SizedBox(height: 8),
        Row(
          children: ['Male', 'Female'].map((g) {
            final isSelected = _gender == g;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: g == 'Male' ? 12 : 0),
                child: InkWell(
                  onTap: () => setState(() => _gender = g),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF047857).withValues(alpha: 0.1)
                          : (isDark
                                ? const Color(0xFF1C1C1E)
                                : const Color(0xFFF5F5F5)),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF047857)
                            : Colors.transparent,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      g == 'Male' ? 'পুরুষ' : 'মহিলা',
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? const Color(0xFF047857)
                            : (isDark ? Colors.white70 : Colors.black87),
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

  Widget _buildStep2(bool isDark) {
    final nextYears = [2024, 2025, 2026, 2027];
    final batchOptions = nextYears.map((y) => '$_stream $y').toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInputField(
          label: 'শিক্ষা প্রতিষ্ঠান',
          icon: LucideIcons.school,
          controller: _instituteController,
          hint: 'কলেজ / স্কুলের নাম',
          isDark: isDark,
        ),
        if (_showCollegeSuggestions) ...[
          const SizedBox(height: 4),
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: _collegeSuggestions.map((name) {
                return InkWell(
                  onTap: () {
                    _instituteController.text = name;
                    setState(() {
                      _showCollegeSuggestions = false;
                      _collegeSuggestions.clear();
                    });
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: isDark ? Colors.white10 : Colors.black12,
                          width: name == _collegeSuggestions.last ? 0 : 1,
                        ),
                      ),
                    ),
                    child: Text(
                      name,
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
        const SizedBox(height: 20),

        _buildLabel('স্ট্রিম (Stream)', isDark),
        const SizedBox(height: 8),
        _buildDropdown(
          icon: LucideIcons.bookOpen,
          value: _stream,
          options: const ['HSC', 'SSC', 'Admission'],
          isDark: isDark,
          onChanged: (val) {
            if (val != null) {
              setState(() {
                _stream = val;
                _batch = '$val 2026';
              });
            }
          },
        ),
        const SizedBox(height: 20),

        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('বিভাগ (Division)', isDark),
                  const SizedBox(height: 8),
                  _buildDropdown(
                    icon: LucideIcons.graduationCap,
                    value: _group,
                    options: const [
                      'Science',
                      'Business Studies',
                      'Humanities',
                    ],
                    isDark: isDark,
                    onChanged: (val) => setState(() => _group = val!),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('ব্যাচ', isDark),
                  const SizedBox(height: 8),
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
      ],
    );
  }

  Widget _examTargetOption(String id, String emoji, String label, bool isDark) {
    final isSelected = _examTarget == id;
    return GestureDetector(
      onTap: () => setState(() => _examTarget = id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF047857).withValues(alpha: 0.1)
              : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5)),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF047857) : Colors.transparent,
            width: isSelected ? 2 : 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        alignment: Alignment.center,
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            fontFamily: 'Anek Bangla',
            color: isSelected
                ? const Color(0xFF047857)
                : (isDark ? Colors.white70 : Colors.black87),
          ),
        ),
      ),
    );
  }

  Widget _examTargetOptionWide(
    String id,
    String emoji,
    String label,
    bool isDark,
  ) {
    final isSelected = _examTarget == id;
    return GestureDetector(
      onTap: () => setState(() => _examTarget = id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF047857).withValues(alpha: 0.1)
              : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5)),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF047857) : Colors.transparent,
            width: isSelected ? 2 : 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                fontFamily: 'Anek Bangla',
                color: isSelected
                    ? const Color(0xFF047857)
                    : (isDark ? Colors.white70 : Colors.black87),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep3(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_stream == 'Admission') ...[
          _buildLabel('ভর্তি পরীক্ষার টার্গেট', isDark),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 2.2,
            children: [
              _examTargetOption('engineering', '🛠️', 'ইঞ্জিনিয়ারিং', isDark),
              _examTargetOption('medical', '⚕️', 'মেডিকেল', isDark),
              _examTargetOption('university', '🏛️', 'ভার্সিটি-ক', isDark),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _examTargetOptionWide(
                  'agricultural',
                  '🌾',
                  'কৃষি গুচ্ছ',
                  isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _examTargetOptionWide('gst', '🎯', 'GST গুচ্ছ', isDark),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],

        _buildInputField(
          label: 'ইমেইল এড্রেস',
          icon: LucideIcons.mail,
          controller: _emailController,
          hint: 'example@gmail.com',
          isDark: isDark,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 20),
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
              color: isDark ? Colors.white54 : Colors.black54,
            ),
            onPressed: () => setState(() => _showPassword = !_showPassword),
          ),
        ),
        const SizedBox(height: 20),
        _buildInputField(
          label: 'পাসওয়ার্ড কনফার্ম করো',
          icon: LucideIcons.lock,
          controller: _confirmPasswordController,
          hint: '••••••••',
          isDark: isDark,
          obscureText: !_showPassword,
        ),
        const SizedBox(height: 20),
        _buildInputField(
          label: 'রেফারেল কোড (ঐচ্ছিক)',
          icon: LucideIcons.gift,
          controller: _referralController,
          hint: 'কোড থাকলে এখানে লেখো',
          isDark: isDark,
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required IconData icon,
    required String value,
    required List<String> options,
    required bool isDark,
    required void Function(String?) onChanged,
  }) {
    return AppDropdown<String>(
      value: value,
      icon: icon,
      options: options.map((opt) => AppDropdownOption(value: opt, label: opt)).toList(),
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
  }) {
    final bgColor = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label, isDark),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          style: TextStyle(
            fontFamily: 'Anek Bangla',
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.white : Colors.black,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark ? Colors.white38 : Colors.black38,
            ),
            prefixIcon: Icon(
              icon,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: bgColor,
            contentPadding: const EdgeInsets.symmetric(
              vertical: 18,
              horizontal: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFF047857), width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessScreen(bool isDark, Color textColor, Color bgColor) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: const Color(0xFF047857).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      LucideIcons.checkCircle2,
                      color: Color(0xFF047857),
                      size: 48,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'রেজিস্ট্রেশন সফল!',
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Anek Bangla',
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'তোমার অ্যাকাউন্টটি সফলভাবে তৈরি হয়েছে। লগইন করে তোমার প্রস্তুতি শুরু করো।',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                ),
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF047857),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'ড্যাশবোর্ডে যান',
                      style: TextStyle(
                        fontSize: 20,
                        fontFamily: 'Anek Bangla',
                        fontWeight: FontWeight.bold,
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
}
