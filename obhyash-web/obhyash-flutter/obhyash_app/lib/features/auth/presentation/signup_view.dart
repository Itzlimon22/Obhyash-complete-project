import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
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
  String? _localError;

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

  bool _showPassword = false;

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
        return 'আপনার নাম উল্লেখ করা আবশ্যক';
      if (_phoneController.text.trim().isEmpty)
        return 'মোবাইল নম্বর উল্লেখ করা আবশ্যক';
      if (!RegExp(r'^01\d{9}$').hasMatch(_phoneController.text.trim()))
        return 'সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)';
      if (_gender.isEmpty) return 'লিঙ্গ নির্বাচন করা আবশ্যক';
    } else if (currentStep == 2) {
      if (_instituteController.text.trim().isEmpty)
        return 'আপনার শিক্ষা প্রতিষ্ঠানের নাম লিখুন';
    } else if (currentStep == 3) {
      if (_emailController.text.trim().isEmpty ||
          _passwordController.text.isEmpty ||
          _confirmPasswordController.text.isEmpty) {
        return 'সব তথ্য পূরণ করতে হবে';
      }
      if (!RegExp(
        r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
      ).hasMatch(_emailController.text.trim())) {
        return 'সঠিক ইমেইল এড্রেস দিন (যেমন: example@gmail.com)';
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
      setState(() => _localError = errorMsg);
      return;
    }
    setState(() {
      _localError = null;
      _step++;
    });
  }

  void _handleBack() {
    setState(() {
      _localError = null;
      _step--;
    });
  }

  void _handleSignup() async {
    final errorMsg = _validateStep(3);
    if (errorMsg != null) {
      setState(() => _localError = errorMsg);
      return;
    }
    setState(() => _localError = null);

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
        );

    final authState = ref.read(authControllerProvider);
    if (!authState.hasError && !authState.isLoading) {
      setState(() => _success = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;
    final displayError =
        _localError ?? (authState.hasError ? authState.error.toString() : null);

    if (_success) {
      return _buildSuccessScreen(isDark);
    }

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFF5F5F5),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
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
              constraints: const BoxConstraints(maxWidth: 512), // max-w-lg
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0A0A0A) : Colors.white,
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFE5E5E5),
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
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 8,
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFFDC2626),
                            Color(0xFFEF4444),
                            Color(0xFFF43F5E),
                          ],
                        ),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(32),
                          topRight: Radius.circular(32),
                        ),
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 36, 20, 24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'মাত্র ৩টি ধাপে সম্পন্ন করুন আপনার রেজিস্ট্রেশন',
                          style: TextStyle(
                            fontSize: 14,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? const Color(0xFF94A3B8)
                                : const Color(0xFF64748B),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),

                        _buildProgressBar(isDark),
                        const SizedBox(height: 24),

                        if (displayError != null)
                          Container(
                            margin: const EdgeInsets.only(bottom: 24),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0x337F1D1D)
                                  : const Color(0xFFFEF2F2),
                              border: Border.all(
                                color: isDark
                                    ? const Color(0x4D7F1D1D)
                                    : const Color(0xFFFEE2E2),
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
                                    displayError,
                                    style: TextStyle(
                                      fontFamily: 'HindSiliguri',
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: isDark
                                          ? const Color(0xFFF87171)
                                          : const Color(0xFFDC2626),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Render Step Content
                        _step == 1
                            ? _buildStep1(isDark)
                            : _step == 2
                            ? _buildStep2(isDark)
                            : _buildStep3(isDark),

                        const SizedBox(height: 16),

                        // Action Buttons
                        Row(
                          children: [
                            if (_step > 1) ...[
                              InkWell(
                                onTap: _handleBack,
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  width: 56,
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF1E293B)
                                        : const Color(
                                            0xFFF1F5F9,
                                          ), // slate-800 : slate-100
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    LucideIcons.chevronLeft,
                                    color: isDark
                                        ? const Color(0xFFCBD5E1)
                                        : const Color(
                                            0xFF475569,
                                          ), // slate-300 : slate-600
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                            ],

                            Expanded(
                              child: ElevatedButton(
                                onPressed: isLoading
                                    ? null
                                    : (_step == 3
                                          ? _handleSignup
                                          : _handleNext),
                                style:
                                    ElevatedButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      backgroundColor: Colors.transparent,
                                      shadowColor: const Color(0x4D10B981),
                                      elevation: 10,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ).copyWith(
                                      backgroundColor:
                                          WidgetStateProperty.resolveWith(
                                            (states) => null,
                                          ),
                                    ),
                                child: Ink(
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        Color(0xFF059669),
                                        Color(0xFF16A34A),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Container(
                                    alignment: Alignment.center,
                                    height: 52,
                                    child: isLoading
                                        ? const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              SizedBox(
                                                width: 20,
                                                height: 20,
                                                child:
                                                    CircularProgressIndicator(
                                                      strokeWidth: 2,
                                                      color: Colors.white,
                                                    ),
                                              ),
                                              SizedBox(width: 8),
                                              Text(
                                                'অপেক্ষা করুন...',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontFamily: 'HindSiliguri',
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          )
                                        : _step == 3
                                        ? const Text(
                                            'অ্যাকাউন্ট তৈরি করুন',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontFamily: 'HindSiliguri',
                                              fontWeight: FontWeight.bold,
                                            ),
                                          )
                                        : const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                'পরবর্তী ধাপ',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 16,
                                                  fontFamily: 'HindSiliguri',
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              SizedBox(width: 8),
                                              Icon(
                                                LucideIcons.chevronRight,
                                                color: Colors.white,
                                                size: 20,
                                              ),
                                            ],
                                          ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),
                        TextButton(
                          onPressed: () {
                            context.push('/login');
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
                                const TextSpan(text: 'আগেই অ্যাকাউন্ট আছে? '),
                                TextSpan(
                                  text: 'লগইন করুন',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? const Color(0xFFEF4444)
                                        : const Color(0xFFDC2626),
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
                    ? const Color(0xFFDC2626)
                    : (isDark
                          ? const Color(0xFF1E293B)
                          : const Color(0xFFF1F5F9)),
                shape: BoxShape.circle,
                boxShadow: isActive
                    ? [
                        const BoxShadow(
                          color: Color(0x4DDC2626),
                          blurRadius: 10,
                          offset: Offset(0, 4),
                        ),
                      ]
                    : [],
              ),
              child: Center(
                child: Text(
                  s.toString(),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isActive ? Colors.white : const Color(0xFF94A3B8),
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
                      ? const Color(0xFFDC2626)
                      : (isDark
                            ? const Color(0xFF1E293B)
                            : const Color(0xFFF1F5F9)),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildStep1(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInputField(
          label: 'আপনার নাম',
          icon: LucideIcons.user,
          controller: _nameController,
          hint: 'পূর্ণ নাম (Full Name)',
          isDark: isDark,
        ),
        const SizedBox(height: 16),
        _buildInputField(
          label: 'ফোন নাম্বার',
          icon: LucideIcons.phone,
          controller: _phoneController,
          hint: '017xxxxxxxx',
          isDark: isDark,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 16),
        _buildLabel('লিঙ্গ (Gender)', isDark),
        const SizedBox(height: 6),
        Row(
          children: ['Male', 'Female'].map((g) {
            final isSelected = _gender == g;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: g == 'Male' ? 12 : 0),
                child: InkWell(
                  onTap: () => setState(() => _gender = g),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? (isDark
                                ? const Color(0x337F1D1D)
                                : const Color(0xFFFEF2F2))
                          : (isDark
                                ? const Color(0xFF0A0A0A)
                                : const Color(0xFFF8FAFC)),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFFEF4444)
                            : (isDark
                                  ? const Color(0xFF1E293B)
                                  : const Color(0xFFE2E8F0)),
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      g == 'Male' ? 'পুরুষ' : 'মহিলা',
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? (isDark
                                  ? const Color(0xFFF87171)
                                  : const Color(0xFFDC2626))
                            : const Color(0xFF64748B),
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
    // Generate batches for dropdowns based on stream
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
              color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark
                    ? const Color(0xFF303030)
                    : const Color(0xFFE5E5E5),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
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
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: isDark
                              ? const Color(0xFF262626)
                              : const Color(0xFFF0F0F0),
                          width: name == _collegeSuggestions.last ? 0 : 1,
                        ),
                      ),
                    ),
                    child: Text(
                      name,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? const Color(0xFFD4D4D4)
                            : const Color(0xFF262626),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
        const SizedBox(height: 16),

        _buildLabel('স্ট্রিম (Stream)', isDark),
        const SizedBox(height: 6),
        _buildDropdown(
          icon: LucideIcons.bookOpen,
          value: _stream,
          options: const ['HSC', 'SSC', 'Admission'],
          isDark: isDark,
          onChanged: (val) {
            if (val != null) {
              setState(() {
                _stream = val;
                _batch = '$val 2026'; // auto reset
              });
            }
          },
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('বিভাগ (Division)', isDark),
                  const SizedBox(height: 6),
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
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('ব্যাচ', isDark),
                  const SizedBox(height: 6),
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
              ? (isDark ? const Color(0xFF0A1F17) : const Color(0xFFF0FDF4))
              : (isDark ? const Color(0xFF171717) : const Color(0xFFFAFAFA)),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF059669)
                : (isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)),
            width: isSelected ? 2 : 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        alignment: Alignment.center,
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            fontFamily: 'HindSiliguri',
            color: isSelected
                ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                : (isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040)),
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
              ? (isDark ? const Color(0xFF0A1F17) : const Color(0xFFF0FDF4))
              : (isDark ? const Color(0xFF171717) : const Color(0xFFFAFAFA)),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF059669)
                : (isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)),
            width: isSelected ? 2 : 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        alignment: Alignment.center,
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            fontFamily: 'HindSiliguri',
            color: isSelected
                ? (isDark ? const Color(0xFF34D399) : const Color(0xFF047857))
                : (isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040)),
          ),
        ),
      ),
    );
  }

  Widget _buildStep3(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Exam Target
        _buildLabel('তোমার লক্ষ্য কী?', isDark),
        const SizedBox(height: 4),
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            'তোমার পরীক্ষার লক্ষ্য নির্বাচন করো — আমরা সেই অনুযায়ী তোমাকে সাহায্য করব',
            style: TextStyle(
              fontSize: 12,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
            ),
          ),
        ),
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 3.2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _examTargetOption('hsc_2026', '📚', 'এইচএসসি ২০২৬', isDark),
            _examTargetOption('hsc_2027', '📚', 'এইচএসসি ২০২৭', isDark),
            _examTargetOption('mbbs_2026', '🏥', 'মেডিকেল ২০২৬', isDark),
            _examTargetOption('mbbs_2027', '🏥', 'মেডিকেল ২০২৭', isDark),
            _examTargetOption('ssc_2026', '✏️', 'এসএসসি ২০২৬', isDark),
            _examTargetOption('ssc_2027', '✏️', 'এসএসসি ২০২৭', isDark),
          ],
        ),
        const SizedBox(height: 8),
        _examTargetOptionWide('other', '🎯', 'অন্যান্য', isDark),
        if (_examTarget.isEmpty) ...[
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              'পরেও ড্যাশবোর্ড থেকে সেট করতে পারবে',
              style: TextStyle(
                fontSize: 11,
                color: isDark
                    ? const Color(0xFF525252)
                    : const Color(0xFFA3A3A3),
              ),
            ),
          ),
        ],
        const SizedBox(height: 20),
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
          hint: 'কমপক্ষে ৬ অক্ষর',
          isDark: isDark,
          obscureText: !_showPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _showPassword ? LucideIcons.eyeOff : LucideIcons.eye,
              color: const Color(0xFF94A3B8),
              size: 20,
            ),
            onPressed: () => setState(() => _showPassword = !_showPassword),
          ),
        ),
        const SizedBox(height: 16),
        _buildInputField(
          label: 'পাসওয়ার্ড নিশ্চিত করুন',
          icon: LucideIcons.lock,
          controller: _confirmPasswordController,
          hint: 'পাসওয়ার্ডটি আবার লিখুন',
          isDark: isDark,
          obscureText: !_showPassword,
        ),
      ],
    );
  }

  Widget _buildLabel(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 14,
          fontFamily: 'HindSiliguri',
          fontWeight: FontWeight.w600,
          color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required IconData icon,
    required String value,
    required List<String> options,
    required bool isDark,
    required Function(String?) onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 12),
            child: Icon(icon, color: const Color(0xFF94A3B8), size: 20),
          ),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: value,
                isExpanded: true,
                dropdownColor: isDark ? const Color(0xFF171717) : Colors.white,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontWeight: FontWeight.w500,
                  fontSize: 15,
                  color: isDark
                      ? const Color(0xFFE5E5E5)
                      : const Color(0xFF262626),
                ),
                icon: const Padding(
                  padding: EdgeInsets.only(right: 16),
                  child: Icon(
                    LucideIcons.chevronDown,
                    color: Color(0xFF94A3B8),
                    size: 20,
                  ),
                ),
                items: options
                    .map(
                      (opt) => DropdownMenuItem(value: opt, child: Text(opt)),
                    )
                    .toList(),
                onChanged: onChanged,
              ),
            ),
          ),
        ],
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
    Widget? suffixIcon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label, isDark),
        const SizedBox(height: 6),
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
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: isDark
                ? const Color(0xFF171717)
                : const Color(0xFFFAFAFA),
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
                    : const Color(0x33DC2626),
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessScreen(bool isDark) {
    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFF5F5F5),
      body: Center(
        child: Container(
          width: double.infinity,
          constraints: const BoxConstraints(maxWidth: 448),
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0A0A0A) : Colors.white,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(
              color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 25,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0x4D064E3B)
                      : const Color(0xFFD1FAE5), // emerald-900/30 : emerald-100
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    LucideIcons.checkCircle2,
                    size: 40,
                    color: isDark
                        ? const Color(0xFF34D399)
                        : const Color(0xFF059669),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'অ্যাকাউন্ট তৈরি সফল!',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন লগইন করুন।',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  fontFamily: 'HindSiliguri',
                  color: isDark
                      ? const Color(0xFF94A3B8)
                      : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.go('/login'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: const Color(0xFF059669), // emerald-600
                    shadowColor: const Color(0x3310B981),
                    elevation: 10,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'লগইন পেজে যান',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontFamily: 'HindSiliguri',
                      fontWeight: FontWeight.bold,
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
