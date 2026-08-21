import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/shared_prefs_provider.dart';
import '../../../core/utils/app_popups.dart';

// ─── Domain Models ────────────────────────────────────────────────────────────

class AppComplaint {
  final String id;
  final String userId;
  final String type;
  final String description;
  final String status;
  final String? adminFeedback;
  final DateTime createdAt;

  const AppComplaint({
    required this.id,
    required this.userId,
    required this.type,
    required this.description,
    required this.status,
    this.adminFeedback,
    required this.createdAt,
  });

  factory AppComplaint.fromJson(Map<String, dynamic> json) {
    return AppComplaint(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'Technical',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Pending',
      adminFeedback: json['admin_feedback']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

// ─── Configurations ───────────────────────────────────────────────────────────

final _complaintTypes = [
  {
    'id': 'Technical',
    'label': 'কারিগরি সমস্যা',
    'subLabel': 'Technical Issue',
    'icon': LucideIcons.zap,
    'color': const Color(0xFFECFDF5),
    'darkColor': const Color(0x33059669),
    'iconColor': const Color(0xFF059669),
    'darkIconColor': const Color(0xFF34D399),
    'description': 'অ্যাপ ক্র্যাশ, লোডিং সমস্যা বা এরর',
  },
  {
    'id': 'UX',
    'label': 'ডিজাইন ও অভিজ্ঞতা',
    'subLabel': 'UX / Design',
    'icon': LucideIcons.smile,
    'color': const Color(0xFFEFF6FF),
    'darkColor': const Color(0x332563EB),
    'iconColor': const Color(0xFF2563EB),
    'darkIconColor': const Color(0xFF60A5FA),
    'description': 'ইন্টারফেস বা ব্যবহারের সুবিধা নিয়ে পরামর্শ',
  },
  {
    'id': 'Bug',
    'label': 'বাগ রিপোর্ট',
    'subLabel': 'Bug Report',
    'icon': LucideIcons.bug,
    'color': const Color(0xFFFEF2F2),
    'darkColor': const Color(0x33DC2626),
    'iconColor': const Color(0xFFDC2626),
    'darkIconColor': const Color(0xFFF87171),
    'description': 'কোনো ফিচার ঠিকমতো কাজ করছে না',
  },
  {
    'id': 'Feature Request',
    'label': 'নতুন ফিচার প্রস্তাব',
    'subLabel': 'Feature Request',
    'icon': LucideIcons.alertCircle,
    'color': const Color(0xFFFFFBEB),
    'darkColor': const Color(0x33D97706),
    'iconColor': const Color(0xFFD97706),
    'darkIconColor': const Color(0xFFFBBF24),
    'description': 'নতুন কোনো সুবিধা বা ফিচার যোগ করার আইডিয়া',
  },
];

final _statusConfig = {
  'Pending': {
    'label': 'অপেক্ষমাণ',
    'icon': LucideIcons.clock,
    'color': const Color(0xFFFEF3C7),
    'darkColor': const Color(0x3378350F),
    'iconColor': const Color(0xFFD97706),
  },
  'In Progress': {
    'label': 'প্রক্রিয়াধীন',
    'icon': LucideIcons.refreshCcw,
    'color': const Color(0xFFDBEAFE),
    'darkColor': const Color(0x331E3A8A),
    'iconColor': const Color(0xFF2563EB),
  },
  'Resolved': {
    'label': 'সমাধান হয়েছে',
    'icon': LucideIcons.checkCheck,
    'color': const Color(0xFFECFDF5),
    'darkColor': const Color(0x33064E3B),
    'iconColor': const Color(0xFF059669),
  },
  'Dismissed': {
    'label': 'বাতিল',
    'icon': LucideIcons.xCircle,
    'color': const Color(0xFFF4F4F5),
    'darkColor': const Color(0xFF27272A),
    'iconColor': const Color(0xFF71717A),
  },
};

// ─── Main View ────────────────────────────────────────────────────────────────

class ComplaintView extends ConsumerStatefulWidget {
  const ComplaintView({super.key});

  @override
  ConsumerState<ComplaintView> createState() => _ComplaintViewState();
}

class _ComplaintViewState extends ConsumerState<ComplaintView> {
  String _activeTab = 'new';
  String? _selectedType;
  final TextEditingController _descriptionController = TextEditingController();

  bool _isLoading = false;
  bool _isSuccess = false;

  List<AppComplaint> _myComplaints = [];
  bool _isLoadingComplaints = false;

  Timer? _cooldownTimer;
  int _cooldownSeconds = 0;

  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _descriptionController.addListener(_onDescriptionChanged);
    _fetchMyComplaints();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initCooldown());
  }

  void _onDescriptionChanged() {
    setState(() {});
  }

  void _initCooldown() {
    try {
      final prefs = ref.read(sharedPreferencesProvider);
      final lastSubmit = prefs.getInt('last_complaint_submit_time') ?? 0;
      final elapsedMs = DateTime.now().millisecondsSinceEpoch - lastSubmit;
      if (elapsedMs < 180000) {
        _startCooldownTimer((180000 - elapsedMs) ~/ 1000);
      }
    } catch (_) {}
  }

  void _startCooldownTimer(int seconds) {
    _cooldownTimer?.cancel();
    setState(() => _cooldownSeconds = seconds);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_cooldownSeconds <= 1) {
        timer.cancel();
        setState(() => _cooldownSeconds = 0);
      } else {
        setState(() => _cooldownSeconds--);
      }
    });
  }

  int get _pendingCount =>
      _myComplaints.where((c) => c.status == 'Pending' || c.status == 'In Progress').length;

  int get _dailyCount =>
      _myComplaints.where((c) => DateTime.now().difference(c.createdAt).inHours < 24).length;

  bool get _isPendingLimitReached => _pendingCount >= 3;
  bool get _isDailyLimitReached => _dailyCount >= 5;

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _descriptionController.removeListener(_onDescriptionChanged);
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _fetchMyComplaints() async {
    final user = supabase.auth.currentUser;
    if (user == null) return;

    setState(() => _isLoadingComplaints = true);
    try {
      final response = await supabase
          .from('app_complaints')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _myComplaints = (response as List)
              .map((e) => AppComplaint.fromJson(e))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('[ComplaintView] Error fetching complaints: $e');
    } finally {
      if (mounted) setState(() => _isLoadingComplaints = false);
    }
  }

  Future<void> _handleSubmit() async {
    // 1. Pending Limit Check
    if (_isPendingLimitReached) {
      AppPopups.warning(
        context,
        message: 'আপনার ৩টি আবেদন বর্তমানে প্রক্রিয়াধীন আছে। নতুন বার্তা পাঠানোর পূর্বে সেগুলোর সমাধান হওয়া পর্যন্ত অপেক্ষা করুন।',
      );
      return;
    }

    // 2. Daily Limit Check
    if (_isDailyLimitReached) {
      AppPopups.warning(
        context,
        message: 'আজকের জন্য আপনার আবেদনের দৈনিক সীমা (৫টি) পূর্ণ হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।',
      );
      return;
    }

    // 3. Cooldown Check
    if (_cooldownSeconds > 0) {
      final min = _cooldownSeconds ~/ 60;
      final sec = _cooldownSeconds % 60;
      AppPopups.warning(
        context,
        message: 'পরবর্তী বার্তা পাঠানোর জন্য আর $min মিনিট $sec সেকেন্ড অপেক্ষা করুন।',
      );
      return;
    }

    // 4. Type Selection Check
    if (_selectedType == null) {
      AppPopups.warning(
        context,
        message: 'অনুগ্রহ করে মতামতের ধরণ নির্বাচন করো',
      );
      return;
    }

    // 5. Min/Max Length Validation
    final desc = _descriptionController.text.trim();
    if (desc.length < 15) {
      AppPopups.warning(
        context,
        message: 'অনুগ্রহ করে বিস্তারিত মতামত লেখো (কমপক্ষে ১৫ অক্ষর আবশ্যক)',
      );
      return;
    }
    if (desc.length > 1000) {
      AppPopups.warning(
        context,
        message: 'মতামতের বিবরণ সর্বোচ্চ ১০০০ অক্ষরের মধ্যে লেখো',
      );
      return;
    }

    // 6. Duplicate Text Detection in last 7 days
    final isDuplicate = _myComplaints.any(
      (c) =>
          c.description.trim().toLowerCase() == desc.toLowerCase() &&
          DateTime.now().difference(c.createdAt).inDays < 7,
    );
    if (isDuplicate) {
      AppPopups.warning(
        context,
        message: 'আপনি ইতিপূর্বে হুবহু একই বিবরণ পাঠিয়েছেন! নতুন কোনো তথ্য থাকলে তা উল্লেখ করুন।',
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception('No user logged in');

      await supabase.from('app_complaints').insert({
        'user_id': user.id,
        'type': _selectedType,
        'description': desc,
        'status': 'Pending',
      });

      // Save cooldown timestamp in preferences
      try {
        final prefs = ref.read(sharedPreferencesProvider);
        await prefs.setInt('last_complaint_submit_time', DateTime.now().millisecondsSinceEpoch);
        _startCooldownTimer(180);
      } catch (_) {}

      if (mounted) {
        HapticFeedback.mediumImpact();
        setState(() => _isSuccess = true);
        _fetchMyComplaints();
        AppPopups.success(
          context,
          message: 'তোমার বার্তা আমরা পেয়েছি! দ্রুতই ব্যবস্থা নেওয়া হবে। 🚀',
        );
      }
    } catch (e) {
      if (mounted) {
        final errMsg = e.toString();
        // Check if database trigger exception message is returned
        if (errMsg.contains('অপেক্ষা') || errMsg.contains('সীমা') || errMsg.contains('প্রক্রিয়াধীন')) {
          AppPopups.warning(context, message: errMsg.replaceAll('Exception:', '').trim());
        } else {
          AppPopups.error(
            context,
            message: 'মতামত পাঠাতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করো।',
          );
        }
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleReset() {
    setState(() {
      _isSuccess = false;
      _selectedType = null;
      _descriptionController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchMyComplaints();
    });

    if (_isSuccess) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        body: _buildSuccessState(isDark),
      );
    }

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      body: RefreshIndicator(
        onRefresh: _fetchMyComplaints,
        color: const Color(0xFF059669),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Segmented Tab Switcher ──────────────────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF18181B)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildTabButton(
                        label: 'নতুন অভিযোগ',
                        icon: LucideIcons.send,
                        isActive: _activeTab == 'new',
                        onTap: () => setState(() => _activeTab = 'new'),
                        isDark: isDark,
                      ),
                    ),
                    Expanded(
                      child: _buildTabButton(
                        label: _myComplaints.isEmpty
                            ? 'আমার তালিকা'
                            : 'আমার তালিকা (${_toBengaliNumber(_myComplaints.length)})',
                        icon: LucideIcons.clipboardList,
                        isActive: _activeTab == 'my',
                        onTap: () {
                          setState(() {
                            _activeTab = 'my';
                            _fetchMyComplaints();
                          });
                        },
                        isDark: isDark,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              if (_activeTab == 'new')
                _buildNewComplaintForm(isDark)
              else
                _buildMyComplaintsList(isDark),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  String _toBengaliNumber(int number) {
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    String result = number.toString();
    for (int i = 0; i < 10; i++) {
      result = result.replaceAll(englishDigits[i], bengaliDigits[i]);
    }
    return result;
  }

  // ─── New Complaint Form ─────────────────────────────────────────────────────

  Widget _buildNewComplaintForm(bool isDark) {
    final charCount = _descriptionController.text.trim().length;
    final isBlocked = _isPendingLimitReached || _isDailyLimitReached || _cooldownSeconds > 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Anti-Spam / Rate Limit Status Alert
        if (_isPendingLimitReached) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF451A03).withValues(alpha: 0.4) : const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? const Color(0xFFD97706).withValues(alpha: 0.4) : const Color(0xFFFDE68A),
              ),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.alertTriangle, size: 18, color: Color(0xFFD97706)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'আপনার ৩টি আবেদন ইতিমধ্যে প্রক্রিয়াধীন আছে। নতুন আবেদন জমা দেওয়ার পূর্বে আগেরগুলোর সমাধানের অপেক্ষা করুন।',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ] else if (_isDailyLimitReached) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF451A03).withValues(alpha: 0.4) : const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? const Color(0xFFD97706).withValues(alpha: 0.4) : const Color(0xFFFDE68A),
              ),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.shieldAlert, size: 18, color: Color(0xFFD97706)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'আজকের জন্য আপনার আবেদনের সর্বোচ্চ সীমা (৫টি/দিন) পূর্ণ হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ] else if (_cooldownSeconds > 0) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1B4B).withValues(alpha: 0.4) : const Color(0xFFEEF2FF),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? const Color(0xFF6366F1).withValues(alpha: 0.4) : const Color(0xFFC7D2FE),
              ),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.clock, size: 18, color: Color(0xFF6366F1)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'স্প্যামিং প্রতিরোধে পরবর্তী বার্তা পাঠাতে আর ${_cooldownSeconds ~/ 60}:${(_cooldownSeconds % 60).toString().padLeft(2, '0')} মিনিট অপেক্ষা করুন।',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFC7D2FE) : const Color(0xFF3730A3),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 20),

        // Step 1 — Issue Type
        _buildStepLabel('১', 'সমস্যার ধরন বেছে নাও', isDark),
        const SizedBox(height: 10),

        // Category tiles
        ...List.generate(_complaintTypes.length, (index) {
          final cat = _complaintTypes[index];
          final isSelected = _selectedType == cat['id'] as String;

          return Padding(
            padding: EdgeInsets.only(bottom: index < _complaintTypes.length - 1 ? 8 : 0),
            child: GestureDetector(
              onTap: isBlocked
                  ? null
                  : () {
                      HapticFeedback.selectionClick();
                      setState(() => _selectedType = cat['id'] as String);
                    },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                decoration: BoxDecoration(
                  color: isSelected
                      ? (isDark
                          ? const Color(0xFF064E3B).withValues(alpha: 0.3)
                          : const Color(0xFFF0FDF4))
                      : (isDark ? const Color(0xFF18181B) : Colors.white),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF059669)
                        : (isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB)),
                    width: isSelected ? 1.5 : 1.0,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: const Color(0xFF059669).withValues(alpha: 0.12),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.12 : 0.04),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                ),
                child: IntrinsicHeight(
                  child: Row(
                    children: [
                      // Left accent bar
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 4,
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF059669) : Colors.transparent,
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(14),
                            bottomLeft: Radius.circular(14),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                          child: Row(
                            children: [
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF059669)
                                      : (isDark
                                          ? const Color(0xFF27272A)
                                          : const Color(0xFFF3F4F6)),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  cat['icon'] as IconData,
                                  size: 16,
                                  color: isSelected
                                      ? Colors.white
                                      : (isDark
                                          ? const Color(0xFF71717A)
                                          : const Color(0xFF6B7280)),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      cat['label'] as String,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                        fontFamily: 'HindSiliguri',
                                        color: isSelected
                                            ? (isDark ? Colors.white : const Color(0xFF065F46))
                                            : (isDark ? Colors.white : const Color(0xFF111827)),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      cat['description'] as String,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontFamily: 'HindSiliguri',
                                        color: isSelected
                                            ? (isDark
                                                ? const Color(0xFF6EE7B7)
                                                : const Color(0xFF047857))
                                            : (isDark
                                                ? const Color(0xFF71717A)
                                                : const Color(0xFF9CA3AF)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isSelected ? const Color(0xFF059669) : Colors.transparent,
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF059669)
                                        : (isDark
                                            ? const Color(0xFF3F3F46)
                                            : const Color(0xFFD1D5DB)),
                                    width: 1.5,
                                  ),
                                ),
                                child: isSelected
                                    ? const Icon(Icons.check_rounded, size: 13, color: Colors.white)
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),

        const SizedBox(height: 20),

        // Step 2 — Description
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildStepLabel('২', 'বিস্তারিত বিবরণ লেখো', isDark),
            Text(
              '$charCount / ১০০০ অক্ষর',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                fontFamily: 'HindSiliguri',
                color: charCount == 0
                    ? (isDark ? const Color(0xFF71717A) : const Color(0xFF9CA3AF))
                    : (charCount < 15
                        ? const Color(0xFFD97706)
                        : (charCount <= 1000
                            ? const Color(0xFF059669)
                            : const Color(0xFFEF4444))),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.12 : 0.04),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: TextField(
            controller: _descriptionController,
            maxLines: 5,
            maxLength: 1000,
            buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
            enabled: !isBlocked,
            style: TextStyle(
              fontSize: 14,
              fontFamily: 'HindSiliguri',
              height: 1.5,
              color: isDark ? Colors.white : Colors.black87,
            ),
            decoration: InputDecoration(
              hintText: 'সমস্যাটি কীভাবে ঘটেছে বা কোথায় দেখা দিয়েছে তা লেখো (কমপক্ষে ১৫ অক্ষর)…',
              hintStyle: TextStyle(
                fontSize: 13,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFF52525B) : const Color(0xFFBBBBBB),
              ),
              contentPadding: const EdgeInsets.all(16),
              filled: true,
              fillColor: Colors.transparent,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Submit Button
        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: (_isLoading || isBlocked) ? null : _handleSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: isBlocked
                  ? (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0))
                  : const Color(0xFF059669),
              foregroundColor: isBlocked
                  ? (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8))
                  : Colors.white,
              elevation: 0,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Colors.white,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isBlocked ? LucideIcons.lock : LucideIcons.send,
                        size: 16,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        _isPendingLimitReached
                            ? 'আগের ৩টি আবেদনের সমাধানের অপেক্ষা করো'
                            : (_isDailyLimitReached
                                ? 'আজকের সাবমিশন সীমা পূর্ণ (৫/৫)'
                                : (_cooldownSeconds > 0
                                    ? 'অপেক্ষা করুন (${_cooldownSeconds ~/ 60}:${(_cooldownSeconds % 60).toString().padLeft(2, '0')})'
                                    : 'সাপোর্ট টিকেট জমা দাও')),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildStepLabel(String step, String label, bool isDark) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: const Color(0xFF059669),
            borderRadius: BorderRadius.circular(7),
          ),
          child: Text(
            step,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            fontFamily: 'HindSiliguri',
            color: isDark ? Colors.white : const Color(0xFF111827),
          ),
        ),
      ],
    );
  }


  // ─── My Complaints List ─────────────────────────────────────────────────────

  Widget _buildMyComplaintsList(bool isDark) {
    if (_isLoadingComplaints) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(
          child: CircularProgressIndicator(color: Color(0xFF059669)),
        ),
      );
    }

    if (_myComplaints.isEmpty) {
      return Container(
        margin: const EdgeInsets.only(top: 20),
        padding: const EdgeInsets.all(36),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFF1F5F9),
              ),
              child: const Icon(
                LucideIcons.inbox,
                size: 36,
                color: Color(0xFFA3A3A3),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'কোনো অভিযোগ জমা নেই',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'তুমি এখনো কোনো অভিযোগ বা ফিডব্যাক জমা দাওনি।',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'HindSiliguri',
                color: Color(0xFFA3A3A3),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => setState(() => _activeTab = 'new'),
              icon: const Icon(LucideIcons.send, size: 16, color: Colors.white),
              label: const Text(
                'নতুন অভিযোগ করো',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _myComplaints.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final complaint = _myComplaints[index];
        final typeInfo = _complaintTypes.firstWhere(
          (t) => t['id'] == complaint.type,
          orElse: () => _complaintTypes[0],
        );
        final statusInfo =
            _statusConfig[complaint.status] ?? _statusConfig['Pending']!;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: Type and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isDark
                              ? (typeInfo['darkColor'] as Color)
                              : (typeInfo['color'] as Color),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          typeInfo['icon'] as IconData,
                          size: 16,
                          color: isDark
                              ? (typeInfo['darkIconColor'] as Color)
                              : (typeInfo['iconColor'] as Color),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            typeInfo['label'] as String,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            DateFormat('dd MMM yyyy, hh:mm a')
                                .format(complaint.createdAt),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFFA3A3A3),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark
                          ? (statusInfo['darkColor'] as Color)
                          : (statusInfo['color'] as Color),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          statusInfo['icon'] as IconData,
                          size: 13,
                          color: statusInfo['iconColor'] as Color,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          statusInfo['label'] as String,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: statusInfo['iconColor'] as Color,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Description
              Text(
                complaint.description,
                style: TextStyle(
                  fontSize: 14.5,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
                  height: 1.5,
                ),
              ),

              // Admin Feedback (if present)
              if (complaint.adminFeedback != null &&
                  complaint.adminFeedback!.trim().isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF064E3B).withValues(alpha: 0.3)
                        : const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF059669).withValues(alpha: 0.35)
                          : const Color(0xFFA7F3D0),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            LucideIcons.checkCircle2,
                            size: 15,
                            color: Color(0xFF059669),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'অ্যাডমিন উত্তর:',
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFF065F46),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        complaint.adminFeedback!,
                        style: TextStyle(
                          fontSize: 14,
                          fontFamily: 'HindSiliguri',
                          color: isDark
                              ? const Color(0xFFE2E8F0)
                              : const Color(0xFF0F172A),
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  // ─── Success State ──────────────────────────────────────────────────────────

  Widget _buildSuccessState(bool isDark) {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
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
                    ? const Color(0xFF059669).withValues(alpha: 0.2)
                    : const Color(0xFFECFDF5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.checkCircle2,
                size: 42,
                color: Color(0xFF059669),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'বার্তা গৃহীত হয়েছে!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'আমাদের টিম বিষয়টি গুরুত্ব সহকারে দেখছে। তোমার মতামতের জন্য ধন্যবাদ।',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14.5,
                fontFamily: 'HindSiliguri',
                color: Color(0xFFA3A3A3),
                height: 1.45,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _handleReset,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: BorderSide(
                        color: isDark
                            ? const Color(0xFF3F3F46)
                            : const Color(0xFFCBD5E1),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'আরেকটি পাঠাও',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      _handleReset();
                      setState(() {
                        _activeTab = 'my';
                        _fetchMyComplaints();
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'তালিকা দেখো',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── Tab Button Helper ──────────────────────────────────────────────────────

  Widget _buildTabButton({
    required String label,
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive
              ? (isDark ? const Color(0xFF27272A) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: isActive && !isDark
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 15,
              color: isActive
                  ? const Color(0xFF059669)
                  : const Color(0xFFA3A3A3),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: isActive
                      ? (isDark ? Colors.white : const Color(0xFF059669))
                      : const Color(0xFFA3A3A3),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
