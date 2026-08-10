import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../theme.dart';

class ReferralPage extends StatefulWidget {
  const ReferralPage({super.key});

  @override
  State<ReferralPage> createState() => _ReferralPageState();
}

class _ReferralPageState extends State<ReferralPage> {
  final _supabase = Supabase.instance.client;
  final _customCodeController = TextEditingController();

  bool _isLoading = true;
  bool _isGenerating = false;
  Map<String, dynamic>? _referralData;
  List<Map<String, dynamic>> _history = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _customCodeController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('Not logged in');

      // Fetch referral code
      final referralResponse = await _supabase
          .from('referrals')
          .select()
          .eq('owner_id', user.id)
          .maybeSingle();

      _referralData = referralResponse;

      // Fetch history if code exists
      if (_referralData != null) {
        final historyResponse = await _supabase
            .from('referral_history')
            .select('id, redeemed_at, redeemed_by, admin_status')
            .eq('referral_id', _referralData!['id'])
            .order('redeemed_at', ascending: false);

        // Fetch user profiles for the history manually
        List<Map<String, dynamic>> enrichedHistory = [];
        for (var h in historyResponse) {
          final profile = await _supabase
              .from('users')
              .select('name, email')
              .eq('id', h['redeemed_by'])
              .maybeSingle();
          
          enrichedHistory.add({
            ...h,
            'user_name': profile?['name'] ?? 'Unknown',
            'user_email': profile?['email'] ?? h['redeemed_by'],
          });
        }
        _history = enrichedHistory;
      }
    } catch (e) {
      debugPrint("Error fetching referral data: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _generateRandomCode([int length = 8]) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random();
    return String.fromCharCodes(
      Iterable.generate(
        length,
        (_) => chars.codeUnitAt(random.nextInt(chars.length)),
      ),
    );
  }

  Future<void> _generateCode([String? customCode]) async {
    setState(() => _isGenerating = true);
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('Not logged in');

      String codeToUse = customCode != null && customCode.isNotEmpty
          ? customCode
          : _generateRandomCode();

      // Check for conflict if custom
      if (customCode != null && customCode.isNotEmpty) {
        final conflict = await _supabase
            .from('referrals')
            .select('id')
            .eq('code', codeToUse)
            .maybeSingle();
        if (conflict != null) {
          throw Exception('এই কাস্টম কোডটি ইতিমধ্যে ব্যবহৃত হচ্ছে।');
        }
      }

      // Insert logic with retry for random code conflict
      Map<String, dynamic>? newReferral;
      int attempts = 0;
      while (attempts < 5) {
        try {
          newReferral = await _supabase.from('referrals').insert({
            'owner_id': user.id,
            'code': codeToUse,
            'created_at': DateTime.now().toIso8601String(),
          }).select().single();
          break; // Success
        } catch (e) {
          if (e.toString().contains('23505') && (customCode == null || customCode.isEmpty)) {
            // Unique violation, try a new random code
            codeToUse = _generateRandomCode();
            attempts++;
          } else {
            rethrow;
          }
        }
      }

      if (newReferral != null) {
        setState(() {
          _referralData = newReferral;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('রেফারেল কোড সফলভাবে তৈরি হয়েছে!')),
        );
      } else {
        throw Exception('কোড তৈরি করা সম্ভব হয়নি।');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  void _copyCode() {
    if (_referralData?['code'] != null) {
      Clipboard.setData(ClipboardData(text: _referralData!['code']));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('কোড কপি হয়েছে!')),
      );
    }
  }

  void _shareCode() {
    if (_referralData?['code'] != null) {
      final text = 'আমার রেফারেল কোড ব্যবহার করো এবং ১ মাস বিনামূল্যে প্রিমিয়াম পাও! কোডটি হল: ${_referralData!['code']}\n\nhttps://obhyash.vercel.app/signup';
      Share.share(text);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(
            child: _isLoading
                ? const Padding(
                    padding: EdgeInsets.all(48.0),
                    child: Center(child: CircularProgressIndicator()),
                  )
                : Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 16),
                        _buildStatsRow(isDark),
                        const SizedBox(height: 16),
                        _buildCodeCard(isDark),
                        const SizedBox(height: 24),
                        _buildHowItWorks(isDark),
                        const SizedBox(height: 24),
                        _buildHistoryList(isDark),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 220.0,
      floating: false,
      pinned: true,
      backgroundColor: AppTheme.success,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            Container(color: AppTheme.success),
            Positioned(
              right: -50,
              top: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              left: -80,
              bottom: -50,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                  ),
                  child: const Icon(Icons.card_giftcard, color: Colors.white, size: 32),
                ),
                const SizedBox(height: 12),
                const Text(
                  "বন্ধুদের আমন্ত্রণ জানাও",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    "তোমার কোড শেয়ার করো। বন্ধু প্রিমিয়াম পেলে তুমিও পাবে ১ মাস ফ্রি!",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      iconTheme: const IconThemeData(color: Colors.white),
      title: const Text(
        "রেফারেল প্রোগ্রাম",
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildStatsRow(bool isDark) {
    int approved = _history.where((h) => h['admin_status'] == 'Approved').length;
    int pending = _history.where((h) => h['admin_status'] == 'Pending').length;

    return Row(
      children: [
        _buildStatCard(isDark, Icons.people, 'মোট রেফারেল', '${_history.length}'),
        const SizedBox(width: 12),
        _buildStatCard(isDark, Icons.emoji_events, 'অর্জিত মাস', '$approved'),
        const SizedBox(width: 12),
        _buildStatCard(isDark, Icons.trending_up, 'পেন্ডিং', '$pending'),
      ],
    );
  }

  Widget _buildStatCard(bool isDark, IconData icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.surface : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
          boxShadow: [
            if (!isDark)
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.success, size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: AppTheme.textLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCodeCard(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surface : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
        boxShadow: [
          if (!isDark)
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppTheme.error,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "তোমার রেফারেল কোড",
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.error,
                  letterSpacing: 1.0,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_referralData?.containsKey('code') == true) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? Colors.black : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.grey.shade300,
                  style: BorderStyle.solid,
                ),
              ),
              child: Text(
                _referralData!['code'],
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 4.0,
                  color: isDark ? Colors.white : AppTheme.textMain,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _copyCode,
                    icon: const Icon(Icons.copy, size: 18),
                    label: const Text("কোড কপি"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
                      foregroundColor: isDark ? Colors.white : AppTheme.textMain,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _shareCode,
                    icon: const Icon(Icons.share, size: 18),
                    label: const Text("শেয়ার"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.success,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ] else ...[
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _customCodeController,
                    textCapitalization: TextCapitalization.characters,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9]')),
                    ],
                    maxLength: 15,
                    decoration: InputDecoration(
                      hintText: "CODE (ঐচ্ছিক)",
                      counterText: "",
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade300),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 1,
                  child: ElevatedButton(
                    onPressed: _isGenerating
                        ? null
                        : () {
                            _generateCode(_customCodeController.text.trim());
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.success,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: _isGenerating
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text("সেভ করো", style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: _isGenerating ? null : () => _generateCode(),
                child: Text(
                  "অথবা অটো জেনারেট করো",
                  style: TextStyle(
                    color: AppTheme.textLight,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHowItWorks(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "কীভাবে কাজ করে?",
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: AppTheme.success,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 12),
        _buildStep(isDark, "১", "কোড তৈরি করো", "একটি ইউনিক রেফারেল কোড জেনারেট করো।"),
        const SizedBox(height: 8),
        _buildStep(isDark, "২", "বন্ধুকে শেয়ার করো", "লিংক বা কোড শেয়ার করো যেকোনো বন্ধুকে।"),
        const SizedBox(height: 8),
        _buildStep(isDark, "৩", "দুজনেই পুরস্কার পাও", "বন্ধু সাইন আপ করলে তুমি এবং বন্ধু — দুজনেই ১ মাস বিনামূল্যে প্রিমিয়াম পাবে!"),
      ],
    );
  }

  Widget _buildStep(bool isDark, String number, String title, String desc) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.success.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                number,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.success,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    color: isDark ? Colors.white : AppTheme.textMain,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textLight,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryList(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surface : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "হিস্ট্রি",
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textMain,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  "কারা তোমার কোড ব্যবহার করেছে",
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textLight,
                    letterSpacing: 1.0,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          if (_history.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Text(
                  "এখনো কেউ তোমার কোড ব্যবহার করেনি।",
                  style: TextStyle(color: AppTheme.textLight),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _history.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final item = _history[index];
                final isApproved = item['admin_status'] == 'Approved';
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  leading: CircleAvatar(
                    backgroundColor: AppTheme.success.withOpacity(0.2),
                    child: Text(
                      item['user_name'][0].toUpperCase(),
                      style: TextStyle(
                        color: AppTheme.success,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    item['user_name'],
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : AppTheme.textMain,
                    ),
                  ),
                  subtitle: Text(
                    item['user_email'],
                    style: TextStyle(fontSize: 12, color: AppTheme.textLight),
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isApproved 
                          ? AppTheme.success.withOpacity(0.1) 
                          : Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isApproved ? 'Approved' : 'Pending',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isApproved ? AppTheme.success : Colors.orange,
                      ),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
