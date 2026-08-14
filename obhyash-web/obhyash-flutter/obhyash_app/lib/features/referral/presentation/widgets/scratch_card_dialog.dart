import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:scratcher/scratcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ScratchCardDialog extends StatefulWidget {
  final String cardId;
  final VoidCallback onScratched;

  const ScratchCardDialog({
    super.key,
    required this.cardId,
    required this.onScratched,
  });

  @override
  State<ScratchCardDialog> createState() => _ScratchCardDialogState();
}

class _ScratchCardDialogState extends State<ScratchCardDialog> {
  bool _isScratched = false;
  bool _isProcessing = false;
  String? _rewardType;
  String? _errorMessage;

  final scratchKey = GlobalKey<ScratcherState>();

  Future<void> _revealReward() async {
    if (_isProcessing) return;
    setState(() {
      _isProcessing = true;
    });

    try {
      final res = await Supabase.instance.client
          .rpc('reveal_scratch_card_tx', params: {'p_card_id': widget.cardId});

      setState(() {
        _rewardType = res as String;
        _isScratched = true;
        _isProcessing = false;
      });
      widget.onScratched();
    } catch (e) {
      setState(() {
        _errorMessage = 'পুরস্কার খুলতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
        _isProcessing = false;
      });
      // Reset the scratcher if it failed
      scratchKey.currentState?.reset(duration: const Duration(milliseconds: 300));
    }
  }

  String _getRewardTitle(String? type) {
    switch (type) {
      case '1_month_free':
        return '১ মাসের ফ্রি প্রিমিয়াম!';
      case '2_months_free':
        return '২ মাসের ফ্রি প্রিমিয়াম!';
      case '3_months_free':
        return '৩ মাসের ফ্রি প্রিমিয়াম!';
      case '50_percent_off':
        return 'যেকোনো প্ল্যানে ৫০% ছাড়!';
      default:
        return 'পুরস্কার';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 400),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'আপনার উপহার!',
                  style: TextStyle(
                    fontFamily: 'Anek Bangla',
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'পুরস্কার দেখতে কার্ডটি ঘষুন',
                  style: TextStyle(
                    fontFamily: 'Anek Bangla',
                    fontSize: 16,
                    color: Colors.black54,
                  ),
                ),
                const SizedBox(height: 24),

                // Scratcher Widget
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red, fontFamily: 'Anek Bangla'),
                      textAlign: TextAlign.center,
                    ),
                  ),

                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Scratcher(
                    key: scratchKey,
                    brushSize: 40,
                    threshold: 50,
                    color: const Color(0xFFE5E7EB),
                    image: Image.network(
                      'https://www.transparenttextures.com/patterns/cubes.png',
                      fit: BoxFit.cover,
                    ),
                    onThreshold: () {
                      _revealReward();
                    },
                    child: Container(
                      height: 200,
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Center(
                        child: _isProcessing
                            ? const CircularProgressIndicator(color: Color(0xFFD97706))
                            : _rewardType != null
                                ? Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(LucideIcons.partyPopper,
                                          size: 48, color: Color(0xFFD97706)),
                                      const SizedBox(height: 12),
                                      Text(
                                        _getRewardTitle(_rewardType),
                                        style: const TextStyle(
                                          fontFamily: 'Anek Bangla',
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF92400E),
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  )
                                : const Text(
                                    'Loading...',
                                    style: TextStyle(
                                        fontFamily: 'Anek Bangla',
                                        color: Colors.transparent),
                                  ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFB91C1C),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'বন্ধ করুন',
                      style: TextStyle(
                        fontFamily: 'Anek Bangla',
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
