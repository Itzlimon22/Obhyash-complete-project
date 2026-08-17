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
  final double? fontSize;
  final double? borderRadius;

  const AppDropdown({
    super.key,
    this.label = '',
    required this.value,
    required this.options,
    required this.onChanged,
    this.icon,
    this.hint,
    this.padding,
    this.fontSize,
    this.borderRadius,
  });

  void _showPicker(BuildContext context) {
    if (onChanged == null) return;
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF141416) : Colors.white;
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.5,
          ),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            border: Border(
              top: BorderSide(color: borderColor, width: 1),
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
                    color: isDark ? const Color(0xFF3F3F46) : Colors.black12,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 18),
                if (label.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      label,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: isDark ? const Color(0xFFFAFAFA) : Colors.black,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 12),
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
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
                          decoration: BoxDecoration(
                            color: isSelected 
                                ? (isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5))
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  option.label,
                                  style: TextStyle(
                                    fontFamily: 'HindSiliguri',
                                    fontSize: 15,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    color: isSelected 
                                        ? (isDark ? Colors.white : Colors.black)
                                        : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF52525B)),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (isSelected)
                                Icon(
                                  LucideIcons.check,
                                  color: isDark ? Colors.white : Colors.black,
                                  size: 18,
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
    final bgColor = isDark ? const Color(0xFF0A0A0A) : const Color(0xFFFAFAFA);
    final borderColor = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5);

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
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontFamily: 'HindSiliguri',
                fontWeight: FontWeight.w600,
                color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF4B5563),
              ),
            ),
          ),
        ],
        GestureDetector(
          onTap: () => _showPicker(context),
          child: Container(
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(borderRadius ?? 12),
              border: Border.all(
                color: borderColor,
              ),
            ),
            padding: padding ?? const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            child: Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, color: isDark ? const Color(0xFFA1A1AA) : Colors.black54, size: 18),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: Text(
                    displayLabel ?? hint ?? 'Select an option',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontFamily: 'HindSiliguri',
                      fontSize: fontSize ?? 14.5,
                      fontWeight: displayLabel != null ? FontWeight.w600 : FontWeight.normal,
                      color: displayLabel != null
                          ? (isDark ? Colors.white : const Color(0xFF0F172A))
                          : (isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3)),
                    ),
                  ),
                ),
                Icon(
                  LucideIcons.chevronDown,
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                  size: 18,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
