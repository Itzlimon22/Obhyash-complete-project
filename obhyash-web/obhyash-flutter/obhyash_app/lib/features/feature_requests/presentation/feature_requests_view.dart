import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/app_popups.dart';

// ─── Domain Models ────────────────────────────────────────────────────────────

class AppFeatureRequest {
  final String id;
  final String userId;
  final String title;
  final String category;
  final String description;
  final String status;
  final String? adminFeedback;
  final int upvotesCount;
  final DateTime createdAt;

  const AppFeatureRequest({
    required this.id,
    required this.userId,
    required this.title,
    required this.category,
    required this.description,
    required this.status,
    this.adminFeedback,
    this.upvotesCount = 0,
    required this.createdAt,
  });

  factory AppFeatureRequest.fromJson(Map<String, dynamic> json) {
    return AppFeatureRequest(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Other',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Under Review',
      adminFeedback: json['admin_feedback']?.toString(),
      upvotesCount: (json['upvotes_count'] as num?)?.toInt() ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

// ─── Configurations ───────────────────────────────────────────────────────────

final _featureCategories = [
  {
    'id': 'Exam & Practice',
    'label': 'এক্সাম ও প্র্যাকটিস',
    'subLabel': 'Exam & Practice',
    'icon': LucideIcons.zap,
    'color': const Color(0xFFECFDF5),
    'darkColor': const Color(0x33059669),
    'iconColor': const Color(0xFF059669),
    'darkIconColor': const Color(0xFF34D399),
    'description': 'নতুন এক্সাম মোড, ওএমআর বা প্র্যাকটিস অপশন',
  },
  {
    'id': 'Analytics & Tracking',
    'label': 'অ্যানালিটিক্স ও ট্র্যাকিং',
    'subLabel': 'Analytics & Insights',
    'icon': LucideIcons.barChart2,
    'color': const Color(0xFFEFF6FF),
    'darkColor': const Color(0x332563EB),
    'iconColor': const Color(0xFF2563EB),
    'darkIconColor': const Color(0xFF60A5FA),
    'description': 'স্কোর অ্যানালাইসিস, দুর্বলতা ট্র্যাকিং ও প্রগ্রেস',
  },
  {
    'id': 'Study Tools',
    'label': 'স্টাডি টুলস ও মোড',
    'subLabel': 'Smart Study Tools',
    'icon': LucideIcons.bookOpen,
    'color': const Color(0xFFFFFBEB),
    'darkColor': const Color(0x33D97706),
    'iconColor': const Color(0xFFD97706),
    'darkIconColor': const Color(0xFFFBBF24),
    'description': 'ফ্ল্যাশকার্ড, নোট ও ফর্মুলা রিভিশন সুবিধা',
  },
  {
    'id': 'UI & Theme',
    'label': 'ইন্টারফেস ও থিম',
    'subLabel': 'UI & Customization',
    'icon': LucideIcons.palette,
    'color': const Color(0xFFFAF5FF),
    'darkColor': const Color(0x339333EA),
    'iconColor': const Color(0xFF9333EA),
    'darkIconColor': const Color(0xFFC084FC),
    'description': 'ডিজাইন পরিবর্তন, ফন্ট সাইজ বা কাস্টম কালার থিম',
  },
  {
    'id': 'Other',
    'label': 'অন্যান্য আইডিয়া',
    'subLabel': 'Other Cool Ideas',
    'icon': LucideIcons.layers,
    'color': const Color(0xFFF4F4F5),
    'darkColor': const Color(0xFF27272A),
    'iconColor': const Color(0xFF71717A),
    'darkIconColor': const Color(0xFFA1A1AA),
    'description': 'তোমার মাথায় থাকা যেকোনো দারুণ নতুন আইডিয়া',
  },
];

final _statusConfig = {
  'Under Review': {
    'label': 'বিবেচনাধীন',
    'icon': LucideIcons.clock,
    'color': const Color(0xFFFEF3C7),
    'darkColor': const Color(0x3378350F),
    'iconColor': const Color(0xFFD97706),
  },
  'Planned': {
    'label': 'পরিকল্পিত',
    'icon': LucideIcons.compass,
    'color': const Color(0xFFDBEAFE),
    'darkColor': const Color(0x331E3A8A),
    'iconColor': const Color(0xFF2563EB),
  },
  'In Progress': {
    'label': 'কাজ চলছে',
    'icon': LucideIcons.refreshCcw,
    'color': const Color(0xFFEDE9FE),
    'darkColor': const Color(0x335B21B6),
    'iconColor': const Color(0xFF7C3AED),
  },
  'Completed': {
    'label': 'যুক্ত হয়েছে',
    'icon': LucideIcons.checkCheck,
    'color': const Color(0xFFECFDF5),
    'darkColor': const Color(0x33064E3B),
    'iconColor': const Color(0xFF059669),
  },
  'Declined': {
    'label': 'বাতিল',
    'icon': LucideIcons.xCircle,
    'color': const Color(0xFFF4F4F5),
    'darkColor': const Color(0xFF27272A),
    'iconColor': const Color(0xFF71717A),
  },
};

final _upcomingRoadmap = [
  {
    'title': 'AI স্মার্ট ব্যাখ্যা ও দুর্বলতা বিশ্লেষণ',
    'category': 'AI Powered',
    'status': 'কাজ চলছে',
    'statusColor': const Color(0xFF059669),
    'statusBg': const Color(0xFFECFDF5),
    'icon': LucideIcons.sparkles,
    'description': 'প্রতিটি ভুল উত্তরের জন্য এআই ভিত্তিক স্টেপ-বাই-স্টেপ সমাধান ও ব্যক্তিগত গাইডেন্স।',
  },
  {
    'title': 'লাইভ ১v১ কুইজ ব্যাটল ও মাল্টিপ্লেয়ার',
    'category': 'Gamification',
    'status': 'পরিকল্পিত',
    'statusColor': const Color(0xFF2563EB),
    'statusBg': const Color(0xFFEFF6FF),
    'icon': LucideIcons.flame,
    'description': 'বন্ধুদের সাথে সরাসরি রিয়েল-টাইমে লাইভ চ্যালেঞ্জ এবং দ্রুত উত্তর দেওয়ার প্রতিযোগিতা।',
  },
  {
    'title': 'অফলাইন রিভিশন মোড',
    'category': 'Offline Tool',
    'status': 'পরিকল্পিত',
    'statusColor': const Color(0xFF2563EB),
    'statusBg': const Color(0xFFEFF6FF),
    'icon': LucideIcons.smartphone,
    'description': 'ইন্টারনেট কানেকশন ছাড়াই সেভ করা প্র্যাকটিস সেট ও বুকমার্কড প্রশ্ন ঝালাইয়ের সুবিধা।',
  },
  {
    'title': 'অডিও ব্যাখ্যা ও পডকাস্ট লার্নিং',
    'category': 'Audio Prep',
    'status': 'বিবেচনাধীন',
    'statusColor': const Color(0xFFD97706),
    'statusBg': const Color(0xFFFFFBEB),
    'icon': LucideIcons.volume2,
    'description': 'চলাফেরার সময় বা বিশ্রামের সময় সহজে শোনার মাধ্যমে কঠিন টপিক রিভিশন।',
  },
];

// ─── Main View ────────────────────────────────────────────────────────────────

class FeatureRequestsView extends ConsumerStatefulWidget {
  const FeatureRequestsView({super.key});

  @override
  ConsumerState<FeatureRequestsView> createState() =>
      _FeatureRequestsViewState();
}

class _FeatureRequestsViewState extends ConsumerState<FeatureRequestsView> {
  String _activeTab = 'new';
  String? _selectedCategory;
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  bool _isLoading = false;
  bool _isSuccess = false;

  List<AppFeatureRequest> _myRequests = [];
  bool _isLoadingRequests = false;

  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _fetchMyRequests();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _fetchMyRequests() async {
    final user = supabase.auth.currentUser;
    if (user == null) return;

    setState(() => _isLoadingRequests = true);
    try {
      final response = await supabase
          .from('app_feature_requests')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _myRequests = (response as List)
              .map((e) => AppFeatureRequest.fromJson(e))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('[FeatureRequestsView] Error fetching requests: $e');
    } finally {
      if (mounted) setState(() => _isLoadingRequests = false);
    }
  }

  Future<void> _handleSubmit() async {
    if (_selectedCategory == null) {
      AppPopups.warning(
        context,
        message: 'অনুগ্রহ করে ফিচারের ক্যাটাগরি নির্বাচন করো',
      );
      return;
    }
    if (_titleController.text.trim().length < 4) {
      AppPopups.warning(
        context,
        message: 'ফিচারের একটি সংক্ষিপ্ত শিরোনাম লেখো (কমপক্ষে ৪ অক্ষর)',
      );
      return;
    }
    if (_descriptionController.text.trim().length < 10) {
      AppPopups.warning(
        context,
        message: 'অনুগ্রহ করে ফিচারের বিস্তারিত বিবরণ লেখো (কমপক্ষে ১০ অক্ষর)',
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception('No user logged in');

      await supabase.from('app_feature_requests').insert({
        'user_id': user.id,
        'category': _selectedCategory,
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'status': 'Under Review',
      });

      if (mounted) {
        HapticFeedback.mediumImpact();
        setState(() => _isSuccess = true);
        _fetchMyRequests();
        AppPopups.success(
          context,
          message: 'তোমার চমৎকার প্রস্তাবের জন্য ধন্যবাদ! 🚀',
        );
      }
    } catch (e) {
      if (mounted) {
        AppPopups.error(
          context,
          message: 'প্রস্তাব পাঠাতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করো।',
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _handleReset() {
    setState(() {
      _isSuccess = false;
      _selectedCategory = null;
      _titleController.clear();
      _descriptionController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchMyRequests();
    });

    if (_isSuccess) {
      return Scaffold(
        backgroundColor:
            isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        body: _buildSuccessState(isDark),
      );
    }

    return Scaffold(
      backgroundColor:
          isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      body: RefreshIndicator(
        onRefresh: _fetchMyRequests,
        color: const Color(0xFF059669),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Segmented Tab Switcher ──────────────────────────────────────
              Center(
                child: Container(
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
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildTabButton(
                        label: 'নতুন ফিচার প্রস্তাব',
                        icon: LucideIcons.sparkles,
                        isActive: _activeTab == 'new',
                        onTap: () => setState(() => _activeTab = 'new'),
                        isDark: isDark,
                      ),
                      _buildTabButton(
                        label: _myRequests.isEmpty
                            ? 'আমার প্রস্তাবসমূহ'
                            : 'আমার প্রস্তাবসমূহ (${_myRequests.length})',
                        icon: LucideIcons.clipboardList,
                        isActive: _activeTab == 'my',
                        onTap: () {
                          setState(() {
                            _activeTab = 'my';
                            _fetchMyRequests();
                          });
                        },
                        isDark: isDark,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              if (_activeTab == 'new')
                _buildNewRequestForm(isDark)
              else
                _buildMyRequestsList(isDark),

              const SizedBox(height: 32),

              // ── Bottom Roadmap Section ───────────────────────────────────
              _buildUpcomingRoadmapSection(isDark),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  // ─── New Request Form ───────────────────────────────────────────────────────

  Widget _buildNewRequestForm(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Hero Banner ───────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF059669),
                Color(0xFF047857),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF059669).withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.25),
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      LucideIcons.sparkles,
                      color: Colors.white,
                      size: 13,
                    ),
                    SizedBox(width: 6),
                    Text(
                      'ফিচার রিকোয়েস্ট ও আইডিয়া বক্স',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'কিছু নতুন দেখতে চাও?\nআমরা শুনছি।',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'HindSiliguri',
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'তোমার পড়াশোনাকে আরও আনন্দদায়ক ও কার্যকর করতে কী কী ফিচার যুক্ত করলে ভালো হয়? তোমার আইডিয়া শেয়ার করো!',
                style: TextStyle(
                  color: Color(0xFFD1FAE5),
                  fontSize: 14.5,
                  fontFamily: 'HindSiliguri',
                  height: 1.45,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // ── Step 1: Category Selection ────────────────────────────────────
        const Text(
          '১. ফিচারের ক্যাটাগরি নির্বাচন করো',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            fontFamily: 'HindSiliguri',
          ),
        ),
        const SizedBox(height: 12),
        Column(
          children: _featureCategories.map((cat) {
            final isSelected = _selectedCategory == cat['id'];
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedCategory = cat['id'] as String);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark
                        ? (isSelected
                            ? const Color(0xFF059669).withValues(alpha: 0.12)
                            : const Color(0xFF18181B))
                        : (isSelected
                            ? const Color(0xFFECFDF5)
                            : Colors.white),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF059669)
                          : (isDark
                              ? const Color(0xFF27272A)
                              : const Color(0xFFE2E8F0)),
                      width: isSelected ? 1.8 : 1.0,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(
                          alpha: isDark ? 0.2 : (isSelected ? 0.05 : 0.02),
                        ),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark
                              ? (cat['darkColor'] as Color)
                              : (cat['color'] as Color),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          cat['icon'] as IconData,
                          size: 20,
                          color: isDark
                              ? (cat['darkIconColor'] as Color)
                              : (cat['iconColor'] as Color),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  cat['label'] as String,
                                  style: TextStyle(
                                    fontSize: 15.5,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'HindSiliguri',
                                    color: isSelected
                                        ? const Color(0xFF059669)
                                        : (isDark
                                            ? Colors.white
                                            : const Color(0xFF0F172A)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  cat['subLabel'] as String,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFFA3A3A3),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              cat['description'] as String,
                              style: TextStyle(
                                fontSize: 13,
                                fontFamily: 'HindSiliguri',
                                color: isDark
                                    ? const Color(0xFFA3A3A3)
                                    : const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isSelected
                              ? const Color(0xFF059669)
                              : Colors.transparent,
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFF059669)
                                : (isDark
                                    ? const Color(0xFF52525B)
                                    : const Color(0xFFCBD5E1)),
                            width: 1.5,
                          ),
                        ),
                        child: isSelected
                            ? const Icon(
                                Icons.check,
                                size: 14,
                                color: Colors.white,
                              )
                            : null,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        // ── Step 2: Title Input ────────────────────────────────────────────
        const Text(
          '২. ফিচারের শিরোনাম',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            fontFamily: 'HindSiliguri',
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: _titleController,
            style: TextStyle(
              fontSize: 15,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              hintText: 'যেমন: ডার্ক মোডে কাস্টম ফন্ট সাইজ বা ওএমআর অপশন...',
              hintStyle: TextStyle(
                fontSize: 14.5,
                fontFamily: 'HindSiliguri',
                color:
                    isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: InputBorder.none,
            ),
          ),
        ),
        const SizedBox(height: 20),

        // ── Step 3: Description Textarea ───────────────────────────────────
        const Text(
          '৩. বিস্তারিত বিবরণ',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            fontFamily: 'HindSiliguri',
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: _descriptionController,
            maxLines: 5,
            style: TextStyle(
              fontSize: 15,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              hintText:
                  'ফিচারটি কীভাবে কাজ করবে এবং এটি কেন দরকার তা বিস্তারিত লেখো (কমপক্ষে ১০ অক্ষর)...',
              hintStyle: TextStyle(
                fontSize: 14.5,
                fontFamily: 'HindSiliguri',
                color:
                    isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
              ),
              contentPadding: const EdgeInsets.all(16),
              border: InputBorder.none,
            ),
          ),
        ),
        const SizedBox(height: 24),

        // ── Submit Button ─────────────────────────────────────────────────
        ElevatedButton(
          onPressed: _isLoading ? null : _handleSubmit,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF059669),
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.2,
                  ),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.send, size: 18, color: Colors.white),
                    SizedBox(width: 8),
                    Text(
                      'প্রস্তাব জমা দাও',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  // ─── My Requests List ───────────────────────────────────────────────────────

  Widget _buildMyRequestsList(bool isDark) {
    if (_isLoadingRequests) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(
          child: CircularProgressIndicator(color: Color(0xFF059669)),
        ),
      );
    }

    if (_myRequests.isEmpty) {
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
                LucideIcons.sparkles,
                size: 36,
                color: Color(0xFFA3A3A3),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'কোনো ফিচার প্রস্তাব জমা নেই',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'তোমার মাথায় কোনো নতুন আইডিয়া থাকলে এখনই সাবমিট করতে পারো।',
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
              icon:
                  const Icon(LucideIcons.send, size: 16, color: Colors.white),
              label: const Text(
                'নতুন প্রস্তাব পাঠাও',
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
      itemCount: _myRequests.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final req = _myRequests[index];
        final catInfo = _featureCategories.firstWhere(
          (t) => t['id'] == req.category,
          orElse: () => _featureCategories[0],
        );
        final statusInfo =
            _statusConfig[req.status] ?? _statusConfig['Under Review']!;

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
              // Top row: Category and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isDark
                              ? (catInfo['darkColor'] as Color)
                              : (catInfo['color'] as Color),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          catInfo['icon'] as IconData,
                          size: 16,
                          color: isDark
                              ? (catInfo['darkIconColor'] as Color)
                              : (catInfo['iconColor'] as Color),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            catInfo['label'] as String,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF64748B),
                            ),
                          ),
                          Text(
                            DateFormat('dd MMM yyyy, hh:mm a')
                                .format(req.createdAt),
                            style: const TextStyle(
                              fontSize: 11.5,
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
              const SizedBox(height: 10),

              // Title
              Text(
                req.title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),

              // Description
              Text(
                req.description,
                style: TextStyle(
                  fontSize: 14,
                  fontFamily: 'HindSiliguri',
                  color:
                      isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
                  height: 1.45,
                ),
              ),

              // Admin Feedback (if present)
              if (req.adminFeedback != null &&
                  req.adminFeedback!.trim().isNotEmpty) ...[
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
                        req.adminFeedback!,
                        style: TextStyle(
                          fontSize: 13.5,
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

  // ─── Upcoming Roadmap Section ───────────────────────────────────────────────

  Widget _buildUpcomingRoadmapSection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 32),
        const Row(
          children: [
            Icon(
              LucideIcons.compass,
              size: 16,
              color: Color(0xFF059669),
            ),
            SizedBox(width: 6),
            Text(
              'আমাদের ভবিষ্যৎ পরিকল্পনা',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                fontFamily: 'HindSiliguri',
                color: Color(0xFF059669),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'আসন্ন আকর্ষণীয় ফিচারসমূহ (Upcoming Features)',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            fontFamily: 'HindSiliguri',
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'তোমাদের প্রস্তুতির অভিজ্ঞতাকে অনন্য করতে যে ফিচারগুলোর উপর আমরা দ্রুত কাজ করছি:',
          style: TextStyle(
            fontSize: 13.5,
            fontFamily: 'HindSiliguri',
            color: Color(0xFFA3A3A3),
          ),
        ),
        const SizedBox(height: 14),
        Column(
          children: _upcomingRoadmap.map((item) {
            final icon = item['icon'] as IconData;
            final statusColor = item['statusColor'] as Color;
            final statusBg = isDark
                ? (item['statusColor'] as Color).withValues(alpha: 0.15)
                : (item['statusBg'] as Color);

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE2E8F0),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF059669).withValues(alpha: 0.15)
                          : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      icon,
                      size: 20,
                      color: const Color(0xFF059669),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                item['title'] as String,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF0F172A),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: statusBg,
                                borderRadius: BorderRadius.circular(100),
                              ),
                              child: Text(
                                item['status'] as String,
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: statusColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          item['description'] as String,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFF64748B),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
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
              'প্রস্তাব গৃহীত হয়েছে!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'আমাদের টিম তোমার প্রস্তাবটি বিবেচনা করছে। ‘অভ্যাস’ কে সেরা প্ল্যাটফর্ম বানাতে তোমার প্রতিটি আইডিয়া অনেক মূল্যবান।',
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
                        _fetchMyRequests();
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
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
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                fontFamily: 'HindSiliguri',
                color: isActive
                    ? (isDark ? Colors.white : const Color(0xFF059669))
                    : const Color(0xFFA3A3A3),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
