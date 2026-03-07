import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const _examTargets = [
  {'value': 'hsc_2026', 'label': 'এইচএসসি ২০২৬', 'icon': '📚'},
  {'value': 'hsc_2027', 'label': 'এইচএসসি ২০২৭', 'icon': '📚'},
  {'value': 'mbbs_2026', 'label': 'মেডিকেল ভর্তি ২০২৬', 'icon': '🏥'},
  {'value': 'mbbs_2027', 'label': 'মেডিকেল ভর্তি ২০২৭', 'icon': '🏥'},
  {'value': 'buet_2026', 'label': 'বুয়েট ভর্তি ২০২৬', 'icon': '⚙️'},
  {'value': 'buet_2027', 'label': 'বুয়েট ভর্তি ২০২৭', 'icon': '⚙️'},
  {'value': 'ssc_2026', 'label': 'এসএসসি ২০২৬', 'icon': '🎓'},
  {'value': 'ssc_2027', 'label': 'এসএসসি ২০২৭', 'icon': '🎓'},
  {'value': 'other', 'label': 'অন্যান্য', 'icon': '🎯'},
];

/// Shows a bottom sheet to select exam target.
/// [onSaved] is called with the selected target string, or null if dismissed.
Future<String?> showExamTargetModal(BuildContext context) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => const _ExamTargetSheet(),
  );
}

class _ExamTargetSheet extends StatefulWidget {
  const _ExamTargetSheet();

  @override
  State<_ExamTargetSheet> createState() => _ExamTargetSheetState();
}

class _ExamTargetSheetState extends State<_ExamTargetSheet> {
  String? _selected;
  bool _saving = false;

  Future<void> _save() async {
    if (_selected == null) return;
    setState(() => _saving = true);
    try {
      final userId = Supabase.instance.client.auth.currentUser?.id;
      if (userId != null) {
        await Supabase.instance.client
            .from('users')
            .update({'exam_target': _selected})
            .eq('id', userId);
      }
      if (mounted) Navigator.of(context).pop(_selected);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('সংরক্ষণ করতে সমস্যা হয়েছে')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sheetBg = isDark ? const Color(0xFF171717) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF262626)
        : const Color(0xFFE5E5E5);

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.92,
      minChildSize: 0.5,
      builder: (_, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: sheetBg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: borderColor)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 4),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF404040)
                    : const Color(0xFFD4D4D4),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
              child: Column(
                children: [
                  Text(
                    'তোমার লক্ষ্য কী?',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF171717),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'সঠিক কাউন্টডাউন ও পরিকল্পনা পেতে তোমার পরীক্ষা বেছে নাও',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark
                          ? const Color(0xFF737373)
                          : const Color(0xFF525252),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Options grid
            Expanded(
              child: GridView.builder(
                controller: scrollCtrl,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 2.8,
                ),
                itemCount: _examTargets.length,
                itemBuilder: (_, i) {
                  final t = _examTargets[i];
                  final isSelected = _selected == t['value'];
                  return GestureDetector(
                    onTap: () => setState(() => _selected = t['value']),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF047857)
                            : (isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFF5F5F5)),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF047857)
                              : borderColor,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            t['icon']!,
                            style: const TextStyle(fontSize: 16),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              t['label']!,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: isSelected
                                    ? Colors.white
                                    : (isDark
                                          ? const Color(0xFFD4D4D4)
                                          : const Color(0xFF171717)),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            // Save button
            Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                8,
                16,
                16 + MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _selected == null || _saving ? null : _save,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF047857),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: isDark
                            ? const Color(0xFF262626)
                            : const Color(0xFFE5E5E5),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _saving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'সংরক্ষণ করো',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(null),
                    child: Text(
                      'পরে সেট করবো',
                      style: TextStyle(
                        color: isDark
                            ? const Color(0xFF737373)
                            : const Color(0xFF525252),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
