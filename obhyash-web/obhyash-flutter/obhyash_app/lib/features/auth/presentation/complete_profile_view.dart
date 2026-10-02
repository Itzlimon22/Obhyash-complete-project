import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/college_list.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/app_popups.dart';

class CompleteProfileView extends ConsumerStatefulWidget {
  const CompleteProfileView({super.key});

  @override
  ConsumerState<CompleteProfileView> createState() =>
      _CompleteProfileViewState();
}

class _CompleteProfileViewState extends ConsumerState<CompleteProfileView> {
  final _phoneController = TextEditingController();
  final _instituteController = TextEditingController();
  final _passwordController = TextEditingController();

  int _step = 1; // 1: Mandatory Information, 2: Optional Information
  String _stream = 'HSC';
  String _group = 'Science';
  String _batch = 'HSC 2026';
  String _examTarget = 'Engineering';
  bool _showPassword = false;
  bool _isSubmitting = false;

  List<String> _collegeSuggestions = [];
  bool _showSuggestions = false;

  @override
  void initState() {
    super.initState();
    _instituteController.addListener(_onInstituteChanged);
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _instituteController.removeListener(_onInstituteChanged);
    _instituteController.dispose();
    _passwordController.dispose();
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
      return 'মোবাইল নম্বর উল্লেখ করা আবশ্যক!';
    }

    if (!RegExp(r'^01[3-9]\d{8}$').hasMatch(phone)) {
      return 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
    }

    final institute = _instituteController.text.trim();
    if (institute.isEmpty) {
      return 'তোমার কলেজ বা প্রতিষ্ঠানের নাম লেখো!';
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

  Future<void> _handleSubmit() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      AppPopups.show(
        context,
        message: 'সেশন পাওয়া যায়নি। দয়া করে আবার লগইন করুন।',
        isError: true,
      );
      context.go('/login');
      return;
    }

    final step1Error = _validateStep1();
    if (step1Error != null) {
      setState(() => _step = 1);
      AppPopups.show(context, message: step1Error, isError: true);
      return;
    }

    final password = _passwordController.text.trim();
    if (password.isNotEmpty && password.length < 6) {
      AppPopups.show(
        context,
        message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!',
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

      // 1. Upsert into public.users
      await Supabase.instance.client.from('users').upsert({
        'id': user.id,
        'email': user.email,
        'name': name,
        'phone': phone,
        'institute': institute,
        'stream': _stream,
        'division': _group,
        'batch': _batch,
        'exam_target': _examTarget,
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

      // 2. Set password if provided
      if (password.isNotEmpty) {
        try {
          await Supabase.instance.client.auth.updateUser(
            UserAttributes(password: password),
          );
        } catch (pwdErr) {
          debugPrint('[CompleteProfile] Set password error: $pwdErr');
        }
      }

      // 3. Refresh global AuthNotifier state
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
          final user = Supabase.instance.client.auth.currentUser;
          final isDark = Theme.of(context).brightness == Brightness.dark;

          final bgColor = isDark ? const Color(0xFF09090B) : const Color(0xFFF9FAFB);
          final cardColor = isDark ? const Color(0xFF141417) : Colors.white;
          final textPrimary = isDark ? Colors.white : const Color(0xFF18181B);
          final textMuted = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
          final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7);
          const primaryGreen = Color(0xFF006A4E);

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
            child: Scaffold(
              backgroundColor: bgColor,
              body: SafeArea(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Top Bar
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: primaryGreen,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Center(
                                    child: Text(
                                      'অ',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'অভ্যাশ',
                                  style: TextStyle(
                                    color: textPrimary,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                            GestureDetector(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                context.push('/login-support');
                              },
                              behavior: HitTestBehavior.opaque,
                              child: Text(
                                'সাপোর্ট লাগবে?',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: textMuted,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Main Container Card
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: cardColor,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: borderColor),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Title
                              Text(
                                'স্বাগতম, $displayName! 🎉',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: textPrimary,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'তোমার অ্যাকাডেমিক তথ্য দিয়ে প্রোফাইলটি সম্পন্ন করো।',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: textMuted,
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Google Verified Box
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1B1B20) : const Color(0xFFF4F4F5),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: borderColor),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF27272A) : Colors.white,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: borderColor),
                                      ),
                                      child: const Center(
                                        child: Icon(
                                          LucideIcons.chrome,
                                          size: 20,
                                          color: Color(0xFF4285F4),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            displayName,
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                              color: textPrimary,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Text(
                                            email,
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: textMuted,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: primaryGreen.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            LucideIcons.checkCircle2,
                                            size: 12,
                                            color: primaryGreen,
                                          ),
                                          SizedBox(width: 3),
                                          Text(
                                            'ভেরিফাইড',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: primaryGreen,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),

                              // 2-Step Progress Stepper
                              _buildProgressBar(isDark),
                              const SizedBox(height: 20),

                              // Step 1: Mandatory Fields
                              if (_step == 1) ...[
                                _buildStep1(isDark, textPrimary, textMuted, borderColor, primaryGreen),
                              ] else ...[
                                // Step 2: Optional Fields
                                _buildStep2(isDark, textPrimary, textMuted, borderColor, primaryGreen),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            ),
          );
        },
      ),
    );
  }

  // 2-Step Progress Stepper Widget
  Widget _buildProgressBar(bool isDark) {
    const primaryGreen = Color(0xFF006A4E);
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
                            : (isDark ? Colors.white38 : Colors.black38),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  stepName,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                    color: isActive
                        ? (isDark ? Colors.white : Colors.black87)
                        : (isDark ? Colors.white38 : Colors.black38),
                  ),
                ),
              ],
            ),
            if (s < 2)
              Padding(
                padding: const EdgeInsets.only(top: 15, left: 10, right: 10),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 60,
                  height: 2,
                  decoration: BoxDecoration(
                    color: isLineActive
                        ? primaryGreen
                        : (isDark
                            ? const Color(0xFF27272A)
                            : const Color(0xFFE4E4E7)),
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ),
          ],
        );
      }).toList(),
    );
  }

  // STEP 1 CONTENT: Mandatory Information
  Widget _buildStep1(
    bool isDark,
    Color textPrimary,
    Color textMuted,
    Color borderColor,
    Color primaryGreen,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Mobile Number
        _buildFieldLabel('মোবাইল নম্বর *', LucideIcons.phone, textPrimary),
        const SizedBox(height: 6),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: textPrimary,
          ),
          decoration: _inputDecoration(
            hint: '01XXXXXXXXX',
            isDark: isDark,
            borderColor: borderColor,
          ),
        ),
        const SizedBox(height: 16),

        // College / Institute
        _buildFieldLabel('কলেজ / প্রতিষ্ঠান *', LucideIcons.school, textPrimary),
        const SizedBox(height: 6),
        TextField(
          controller: _instituteController,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: textPrimary,
          ),
          decoration: _inputDecoration(
            hint: 'যেমন: নটর ডেম কলেজ, ঢাকা কলেজ...',
            isDark: isDark,
            borderColor: borderColor,
          ),
        ),

        // College Suggestions Overlay
        if (_showSuggestions && _collegeSuggestions.isNotEmpty) ...[
          const SizedBox(height: 4),
          Container(
            constraints: const BoxConstraints(maxHeight: 180),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1E24) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 8,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: _collegeSuggestions.length,
              separatorBuilder: (context, index) => Divider(
                height: 1,
                color: borderColor.withValues(alpha: 0.5),
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
                      horizontal: 14,
                      vertical: 10,
                    ),
                    child: Text(
                      col,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: textPrimary,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
        const SizedBox(height: 16),

        // Stream & Group Row
        Row(
          children: [
            // Stream
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildFieldLabel('শ্রেণী', LucideIcons.graduationCap, textPrimary),
                  const SizedBox(height: 6),
                  Row(
                    children: ['HSC', 'SSC'].map((s) {
                      final isSel = _stream == s;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => _handleStreamChange(s),
                          child: Container(
                            margin: EdgeInsets.only(right: s == 'HSC' ? 4 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: isSel
                                  ? primaryGreen
                                  : (isDark ? const Color(0xFF1E1E24) : const Color(0xFFF4F4F5)),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text(
                                s,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
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
            const SizedBox(width: 10),
            // Group
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildFieldLabel('বিভাগ', LucideIcons.bookOpen, textPrimary),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF18181B) : const Color(0xFFF4F4F5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: borderColor),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _group,
                        isExpanded: true,
                        icon: Icon(LucideIcons.chevronDown, size: 14, color: textMuted),
                        dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: textPrimary,
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'Science',
                            child: Text('বিজ্ঞান'),
                          ),
                          DropdownMenuItem(
                            value: 'Humanities',
                            child: Text('মানবিক'),
                          ),
                          DropdownMenuItem(
                            value: 'Commerce',
                            child: Text('ব্যবসায় শিক্ষা'),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _group = val);
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Batch Chips
        _buildFieldLabel(
          _stream == 'HSC' ? 'এইচএসসি ব্যাচ' : 'এসএসসি ব্যাচ',
          LucideIcons.calendar,
          textPrimary,
        ),
        const SizedBox(height: 6),
        Row(
          children: (_stream == 'HSC'
                  ? ['HSC 2026', 'HSC 2025', 'HSC 2027']
                  : ['SSC 2026', 'SSC 2027', 'SSC 2028'])
              .map((b) {
            final isSel = _batch == b;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _batch = b),
                child: Container(
                  margin: EdgeInsets.only(
                    right: (b != 'HSC 2027' && b != 'SSC 2028') ? 6 : 0,
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isSel
                        ? primaryGreen.withValues(alpha: 0.15)
                        : (isDark ? const Color(0xFF18181B) : const Color(0xFFF4F4F5)),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSel ? primaryGreen : borderColor,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      b,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isSel ? primaryGreen : textMuted,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // Next Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _handleNext,
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'পরবর্তী ধাপ',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.2,
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
      ],
    );
  }

  // STEP 2 CONTENT: Optional Information
  Widget _buildStep2(
    bool isDark,
    Color textPrimary,
    Color textMuted,
    Color borderColor,
    Color primaryGreen,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Helper Note
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : const Color(0xFFF4F4F5),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                LucideIcons.info,
                size: 16,
                color: primaryGreen,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'এই তথ্যগুলো ঐচ্ছিক। তুমি চাইলে এগুলো এখনই নির্বাচন করতে পারো অথবা পরে প্রোফাইল থেকেও পরিবর্তন করতে পারবে।',
                  style: TextStyle(
                    fontSize: 11,
                    color: textMuted,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Exam Target
        _buildFieldLabel('ভর্তি পরীক্ষার লক্ষ্য (ঐচ্ছিক)', LucideIcons.target, textPrimary),
        const SizedBox(height: 6),
        Row(
          children: [
            _buildTargetCard('Engineering', '⚙️', 'ইঞ্জিনিয়ারিং', isDark, borderColor, primaryGreen),
            const SizedBox(width: 8),
            _buildTargetCard('Medical', '🩺', 'মেডিকেল', isDark, borderColor, primaryGreen),
            const SizedBox(width: 8),
            _buildTargetCard('University', '🏛️', 'ভার্সিটি', isDark, borderColor, primaryGreen),
          ],
        ),
        const SizedBox(height: 16),

        // Optional Password
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildFieldLabel('পাসওয়ার্ড (ঐচ্ছিক)', LucideIcons.lock, textPrimary),
            const Text(
              'ঐচ্ছিক',
              style: TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _passwordController,
          obscureText: !_showPassword,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: textPrimary,
          ),
          decoration: InputDecoration(
            hintText: 'ইমেইল দিয়ে লগইন করতে চাইলে (কমপক্ষে ৬ অক্ষর)',
            hintStyle: TextStyle(
              fontSize: 11,
              color: textMuted.withValues(alpha: 0.7),
            ),
            filled: true,
            fillColor: isDark ? const Color(0xFF18181B) : const Color(0xFFF4F4F5),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: const BorderRadius.all(Radius.circular(12)),
              borderSide: BorderSide(color: primaryGreen, width: 1.5),
            ),
            suffixIcon: IconButton(
              icon: Icon(
                _showPassword ? LucideIcons.eyeOff : LucideIcons.eye,
                size: 16,
                color: textMuted,
              ),
              onPressed: () => setState(() => _showPassword = !_showPassword),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '💡 পাসওয়ার্ড না দিলেও তুমি সবসময় ১-ট্যাপে Google দিয়ে লগইন করতে পারবে।',
          style: TextStyle(fontSize: 10, color: textMuted),
        ),
        const SizedBox(height: 24),

        // Action Buttons: Back + Submit
        Row(
          children: [
            InkWell(
              onTap: _handleBack,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF141417) : const Color(0xFFF4F4F5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
                  ),
                ),
                child: Icon(
                  LucideIcons.chevronLeft,
                  size: 20,
                  color: textPrimary,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: Colors.white,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'পড়াশোনা শুরু করো',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.2,
                              ),
                            ),
                            SizedBox(width: 6),
                            Text('🚀', style: TextStyle(fontSize: 16)),
                          ],
                        ),
                ),
              ),
            ),
          ],
        ),

        // Skip to Dashboard Option
        const SizedBox(height: 12),
        Center(
          child: GestureDetector(
            onTap: _isSubmitting ? null : _handleSubmit,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
              child: Text(
                'পরে সেট করব (সরাসরি ড্যাশবোর্ডে যাও)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: textMuted,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFieldLabel(String label, IconData icon, Color textPrimary) {
    return Row(
      children: [
        Icon(icon, size: 13, color: const Color(0xFF006A4E)),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildTargetCard(
    String id,
    String emoji,
    String title,
    bool isDark,
    Color borderColor,
    Color primaryGreen,
  ) {
    final isSel = _examTarget == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _examTarget = id),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSel
                ? primaryGreen.withValues(alpha: 0.15)
                : (isDark ? const Color(0xFF18181B) : const Color(0xFFF4F4F5)),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSel ? primaryGreen : borderColor,
              width: isSel ? 1.5 : 1,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 20)),
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSel ? primaryGreen : (isDark ? Colors.white : Colors.black87),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required bool isDark,
    required Color borderColor,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        fontSize: 12,
        color: isDark ? const Color(0xFF71717A) : const Color(0xFFA1A1AA),
      ),
      filled: true,
      fillColor: isDark ? const Color(0xFF18181B) : const Color(0xFFF4F4F5),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
        borderSide: BorderSide(color: Color(0xFF006A4E), width: 1.5),
      ),
    );
  }
}
