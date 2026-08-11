import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class AppDropdownOption<T> {
  final T value;
  final String label;

  const AppDropdownOption({required this.value, required this.label});
}

class AppDropdown<T> extends StatelessWidget {
  final String label;
  final T? value;
  final List<AppDropdownOption<T>> options;
  final ValueChanged<T?>? onChanged;
  final IconData? icon;
  final String? hint;
  final EdgeInsetsGeometry? padding;

  const AppDropdown({
    super.key,
    this.label = '',
    required this.value,
    required this.options,
    required this.onChanged,
    this.icon,
    this.hint,
    this.padding,
  });

  void _showPicker(BuildContext context) {
    if (onChanged == null) return;
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF0F172A) : Colors.white;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.7,
          ),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.only(top: 12, bottom: 24),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag handle
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.black12,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 24),
                if (label.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      label,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: options.length,
                    itemBuilder: (context, index) {
                      final option = options[index];
                      final isSelected = option.value == value;
                      return InkWell(
                        onTap: () {
                          Navigator.pop(ctx);
                          onChanged!(option.value);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          decoration: BoxDecoration(
                            color: isSelected 
                                ? const Color(0xFF047857).withValues(alpha: 0.1) 
                                : Colors.transparent,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  option.label,
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 16,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                    color: isSelected 
                                        ? const Color(0xFF047857) 
                                        : (isDark ? Colors.white : Colors.black87),
                                  ),
                                ),
                              ),
                              if (isSelected)
                                const Icon(
                                  LucideIcons.checkCircle2,
                                  color: Color(0xFF047857),
                                  size: 20,
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF5F5F5);

    String? displayLabel;
    if (value != null) {
      try {
        displayLabel = options.firstWhere((opt) => opt.value == value).label;
      } catch (e) {
        displayLabel = null;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'HindSiliguri',
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : Colors.black87,
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
        GestureDetector(
          onTap: () => _showPicker(context),
          child: Container(
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.transparent : Colors.black.withValues(alpha: 0.05),
              ),
            ),
            padding: padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, color: isDark ? Colors.white54 : Colors.black54, size: 20),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Text(
                    displayLabel ?? hint ?? 'Select an option',
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: 15,
                      fontWeight: displayLabel != null ? FontWeight.w600 : FontWeight.normal,
                      color: displayLabel != null
                          ? (isDark ? Colors.white : Colors.black)
                          : (isDark ? Colors.white38 : Colors.black38),
                    ),
                  ),
                ),
                Icon(
                  LucideIcons.chevronDown,
                  color: isDark ? Colors.white54 : Colors.black54,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
