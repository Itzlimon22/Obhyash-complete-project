import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/auth_provider.dart';

// --- Domain Models ---
enum ComplaintType { technical, ux, bug, featureRequest }

class AppComplaint {
  final String id;
  final String userId;
  final String type;
  final String description;
  final String status;
  final String? adminFeedback;
  final DateTime createdAt;

  AppComplaint({
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
      id: json['id'],
      userId: json['user_id'],
      type: json['type'],
      description: json['description'],
      status: json['status'],
      adminFeedback: json['admin_feedback'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

// --- Configuration Data ---
final complaintTypes = [
  {
    'id': 'Technical',
    'label': 'কারিগরি সমস্যা',
    'subLabel': 'Technical Issue',
    'icon': LucideIcons.zap,
    'color': const Color(0xFFEFF6FF), // blue-50
    'darkColor': const Color(0x4D1E3A8A), // blue-900/30
    'iconColor': const Color(0xFF2563EB), // blue-600
    'darkIconColor': const Color(0xFF60A5FA), // blue-400
    'borderColor': const Color(0xFF3B82F6), // blue-500
    'description': 'অ্যাপ ক্র্যাশ, লোডিং সমস্যা বা এরর',
  },
  {
    'id': 'UX',
    'label': 'ডিজাইন ও অভিজ্ঞতা',
    'subLabel': 'UX / Design',
    'icon': LucideIcons.smile,
    'color': const Color(0xFFFAF5FF), // purple-50
    'darkColor': const Color(0x4D581C87), // purple-900/30
    'iconColor': const Color(0xFF9333EA), // purple-600
    'darkIconColor': const Color(0xFFC084FC), // purple-400
    'borderColor': const Color(0xFFA855F7), // purple-500
    'description': 'ইন্টারফেস বা ব্যবহারের সুবিধা নিয়ে পরামর্শ',
  },
  {
    'id': 'Bug',
    'label': 'বাগ রিপোর্ট',
    'subLabel': 'Bug Report',
    'icon': LucideIcons.bug,
    'color': const Color(0xFFFFF1F2), // rose-50
    'darkColor': const Color(0x4D881337), // rose-900/30
    'iconColor': const Color(0xFFE11D48), // rose-600
    'darkIconColor': const Color(0xFFFB7185), // rose-400
    'borderColor': const Color(0xFFF43F5E), // rose-500
    'description': 'কোনো ফিচার ঠিকমতো কাজ করছে না',
  },
  {
    'id': 'Feature Request',
    'label': 'নতুন ফিচার আইডিয়া',
    'subLabel': 'Feature Request',
    'icon': LucideIcons.alertCircle,
    'color': const Color(0xFFFFFBEB), // amber-50
    'darkColor': const Color(0x4D78350F), // amber-900/30
    'iconColor': const Color(0xFFD97706), // amber-600
    'darkIconColor': const Color(0xFFFBBF24), // amber-400
    'borderColor': const Color(0xFFF59E0B), // amber-500
    'description': 'নতুন কোনো সুবিধা বা ফিচার চান?',
  },
];

final statusConfig = {
  'Pending': {
    'label': 'অপেক্ষমাণ',
    'icon': LucideIcons.clock,
    'color': const Color(0xFFFEF3C7), // amber-100
    'darkColor': const Color(0x3378350F), // amber-900/20
    'iconColor': const Color(0xFFF59E0B), // amber-500
  },
  'In Progress': {
    'label': 'প্রক্রিয়াধীন',
    'icon': LucideIcons.refreshCcw,
    'color': const Color(0xFFDBEAFE), // blue-100
    'darkColor': const Color(0x331E3A8A), // blue-900/20
    'iconColor': const Color(0xFF3B82F6), // blue-500
  },
  'Resolved': {
    'label': 'সমাধান হয়েছে',
    'icon': LucideIcons.checkCheck,
    'color': const Color(0xFFD1FAE5), // emerald-100
    'darkColor': const Color(0x33064E3B), // emerald-900/20
    'iconColor': const Color(0xFF10B981), // emerald-500
  },
  'Dismissed': {
    'label': 'বাতিল',
    'icon': LucideIcons.xCircle,
    'color': const Color(0xFFF5F5F5), // neutral-100
    'darkColor': const Color(0xFF262626), // neutral-800
    'iconColor': const Color(0xFF737373), // neutral-500
  },
};

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

  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  void _fetchMyComplaints() async {
    setState(() => _isLoadingComplaints = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) return;

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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingComplaints = false);
    }
  }

  Future<void> _handleSubmit() async {
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('অনুগ্রহ করে অভিযোগের ধরণ নির্বাচন করুন'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    if (_descriptionController.text.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('অনুগ্রহ করে বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)'),
          backgroundColor: Colors.red,
        ),
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
        'description': _descriptionController.text.trim(),
        'status': 'Pending',
      });

      if (mounted) {
        setState(() => _isSuccess = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('আপনার বার্তা আমরা পেয়েছি! ধন্যবাদ। 🚀'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
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

  Widget _buildSuccessState(bool isDark) {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(32),
        margin: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF171717) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 10,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0x33064E3B)
                    : const Color(0xFFD1FAE5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.checkCircle2,
                size: 48,
                color: Color(0xFF10B981),
              ), // emerald-500
            ),
            const SizedBox(height: 24),
            Text(
              'বার্তা গৃহীত হয়েছে!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF171717),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'আমাদের টিম বিষয়টি দেখছে। আপনার মতামতের জন্য ধন্যবাদ।',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF737373),
              ),
            ),
            const SizedBox(height: 32),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ElevatedButton(
                  onPressed: _handleReset,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFF5F5F5),
                    foregroundColor: isDark
                        ? Colors.white
                        : const Color(0xFF171717),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'আরেকটি অভিযোগ করুন',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () {
                    _handleReset();
                    setState(() {
                      _activeTab = 'my';
                      _fetchMyComplaints();
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: const Color(0xFFE11D48), // rose-600
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'আমার অভিযোগ দেখুন',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Retry when auth becomes available after cold-start session restore
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchMyComplaints();
    });

    if (_isSuccess) {
      return Scaffold(
        backgroundColor: isDark ? Colors.black : const Color(0xFFFAFAFA),
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: _buildSuccessState(isDark),
      );
    }

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: const Text(
          'অভিযোগ ও পরামর্শ',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Tabs
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildTabButton(
                    label: 'নতুন অভিযোগ',
                    icon: LucideIcons.send,
                    isActive: _activeTab == 'new',
                    onTap: () => setState(() => _activeTab = 'new'),
                    isDark: isDark,
                  ),
                  _buildTabButton(
                    label: 'আমার অভিযোগ',
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
                ],
              ),
            ),
            const SizedBox(height: 24),

            if (_activeTab == 'new') ...[
              // Header Gradient Box
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF059669),
                      Color(0xFF047857),
                    ], // emerald-600 to emerald-700
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x33059669),
                      blurRadius: 20,
                      offset: Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.2),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(
                            LucideIcons.settings,
                            color: Colors.white,
                            size: 12,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'ফিডব্যাক সেন্টার',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'কিছু বলতে চান?\nআমরা শুনছি।',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      '\'অভ্যাস\' প্ল্যাটফর্মকে আরও উন্নত করতে আপনার মতামত বা অভিযোগ আমাদের জানান।',
                      style: TextStyle(
                        color: Color(0xFFE0E7FF),
                        fontSize: 16,
                      ), // indigo-100
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Form
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '১. অভিযোগের ধরণ নির্বাচন করুন',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF171717),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: MediaQuery.of(context).size.width > 600 ? 2 : 1,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 2.5,
                children: complaintTypes.map((type) {
                  final isSelected = _selectedType == type['id'];
                  return GestureDetector(
                    onTap: () =>
                        setState(() => _selectedType = type['id'] as String),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? (isDark ? const Color(0xFF262626) : Colors.white)
                            : (isDark ? const Color(0xFF171717) : Colors.white),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFFF43F5E)
                              : Colors.transparent, // rose-500
                          width: 2,
                        ),
                        boxShadow: [
                          if (isSelected)
                            const BoxShadow(
                              color: Color(0x1AF43F5E),
                              blurRadius: 10,
                            ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? (type['darkColor'] as Color)
                                      : (type['color'] as Color),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  type['icon'] as IconData,
                                  color: isDark
                                      ? (type['darkIconColor'] as Color)
                                      : (type['iconColor'] as Color),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      type['label'] as String,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected
                                            ? const Color(
                                                0xFFE11D48,
                                              ) // rose-600
                                            : (isDark
                                                  ? Colors.white
                                                  : const Color(0xFF171717)),
                                      ),
                                    ),
                                    Text(
                                      type['subLabel'] as String,
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFA3A3A3),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      type['description'] as String,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark
                                            ? const Color(0xFFA3A3A3)
                                            : const Color(0xFF737373),
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (isSelected)
                            const Positioned(
                              top: 0,
                              right: 0,
                              child: Icon(
                                LucideIcons.checkCircle2,
                                color: Color(0xFFF43F5E),
                                size: 20,
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 32),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '২. বিস্তারিত লিখুন',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF171717),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                maxLines: 8,
                style: TextStyle(
                  color: isDark ? Colors.white : const Color(0xFF171717),
                ),
                decoration: InputDecoration(
                  hintText:
                      'আপনার সমস্যা বা পরামর্শ সম্পর্কে বিস্তারিত লিখুন...',
                  hintStyle: const TextStyle(color: Color(0xFFA3A3A3)),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF171717) : Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                      width: 2,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(
                      color: Color(0xFFF43F5E),
                      width: 2,
                    ), // rose-500
                  ),
                ),
              ),

              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    vertical: 16,
                    horizontal: 32,
                  ),
                  backgroundColor: isDark
                      ? const Color(0xFFE11D48)
                      : const Color(0xFF171717),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  minimumSize: const Size(double.infinity, 56),
                ),
                child: _isLoading
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          ),
                          SizedBox(width: 12),
                          Text(
                            'পাঠানো হচ্ছে...',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'জমা দিন',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(width: 12),
                          Icon(LucideIcons.send, size: 18),
                        ],
                      ),
              ),
              const SizedBox(height: 16),
              const Text(
                'আপনার ফিডব্যাক আমাদের জন্য অত্যন্ত গুরুত্বপূর্ণ ❤️',
                style: TextStyle(color: Color(0xFFA3A3A3), fontSize: 14),
              ),
            ] else ...[
              // My Complaints List
              if (_isLoadingComplaints)
                const Padding(
                  padding: EdgeInsets.all(40.0),
                  child: Center(
                    child: CircularProgressIndicator(color: Color(0xFFF43F5E)),
                  ),
                )
              else if (_myComplaints.isEmpty)
                Container(
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF171717)
                        : const Color(0xFFFAFAFA),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                    ),
                  ),
                  child: Column(
                    children: [
                      const Icon(
                        LucideIcons.clipboardList,
                        size: 64,
                        color: Color(0xFFA3A3A3),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'কোনো অভিযোগ নেই',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? const Color(0xFFD4D4D4)
                              : const Color(0xFF404040),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'আপনি এখনো কোনো অভিযোগ বা পরামর্শ জমা দেননি।',
                        style: TextStyle(color: Color(0xFFA3A3A3)),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => setState(() => _activeTab = 'new'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE11D48), // rose-600
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'নতুন অভিযোগ করুন',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _myComplaints.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final complaint = _myComplaints[index];
                    final typeInfo = complaintTypes.firstWhere(
                      (t) => t['id'] == complaint.type,
                      orElse: () => complaintTypes[0],
                    );
                    final statusInfo =
                        statusConfig[complaint.status] ??
                        statusConfig['Pending']!;

                    return Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF171717) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF262626)
                              : const Color(0xFFF5F5F5),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
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
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Icon(
                                      typeInfo['icon'] as IconData,
                                      size: 18,
                                      color: isDark
                                          ? (typeInfo['darkIconColor'] as Color)
                                          : (typeInfo['iconColor'] as Color),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        typeInfo['label'] as String,
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: isDark
                                              ? Colors.white
                                              : const Color(0xFF171717),
                                        ),
                                      ),
                                      Text(
                                        DateFormat(
                                          'dd MMMM yyyy',
                                        ).format(complaint.createdAt),
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
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? (statusInfo['darkColor'] as Color)
                                      : (statusInfo['color'] as Color),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      statusInfo['icon'] as IconData,
                                      size: 14,
                                      color: statusInfo['iconColor'] as Color,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      statusInfo['label'] as String,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: statusInfo['iconColor'] as Color,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            complaint.description,
                            style: TextStyle(
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF525252),
                              height: 1.5,
                            ),
                          ),
                          if (complaint.adminFeedback != null &&
                              complaint.adminFeedback!.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0x1A064E3B)
                                    : const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0x33059669)
                                      : const Color(0xFFD1FAE5),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(
                                        LucideIcons.checkCheck,
                                        size: 14,
                                        color: Color(0xFF10B981),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'অ্যাডমিন এর মন্তব্য',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: isDark
                                              ? const Color(0xFF34D399)
                                              : const Color(0xFF047857),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    complaint.adminFeedback!,
                                    style: TextStyle(
                                      color: isDark
                                          ? const Color(0xFF6EE7B7)
                                          : const Color(0xFF059669),
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
                ),
            ],
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton({
    required String label,
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: isActive
              ? (isDark ? const Color(0xFF171717) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isActive
              ? const [BoxShadow(color: Color(0x0A000000), blurRadius: 4)]
              : [],
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive
                  ? const Color(0xFFE11D48)
                  : const Color(0xFF737373),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isActive
                    ? const Color(0xFFE11D48) // rose-600
                    : const Color(0xFF737373),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
