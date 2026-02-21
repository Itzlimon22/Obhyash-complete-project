import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../dashboard/domain/models.dart';
import '../../dashboard/providers/dashboard_providers.dart';

class SettingsView extends ConsumerStatefulWidget {
  final UserProfile user;

  const SettingsView({super.key, required this.user});

  @override
  ConsumerState<SettingsView> createState() => _SettingsViewState();
}

class _SettingsViewState extends ConsumerState<SettingsView> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _dobController;
  late TextEditingController _addressController;
  late TextEditingController _instituteController;
  late TextEditingController _sscRollController;
  late TextEditingController _sscRegController;
  late TextEditingController _emailController;
  late TextEditingController _newPasswordController;
  late TextEditingController _confirmPasswordController;

  String _gender = '';
  String _stream = 'HSC';
  String _group = 'Science';
  String _batch = 'HSC 2025';
  String _target = '';
  String _sscBoard = 'Dhaka';
  String _sscYear = '2023';
  String _optionalSubject = '';

  bool _isLoading = false;
  bool _showPassword = false;

  @override
  void initState() {
    super.initState();
    final user = widget.user;

    _nameController = TextEditingController(text: user.name);
    _phoneController = TextEditingController(text: user.phone ?? '');
    _dobController = TextEditingController(text: user.dob ?? '');
    _addressController = TextEditingController(text: user.address ?? '');
    _instituteController = TextEditingController(text: user.institute ?? '');
    _sscRollController = TextEditingController(text: user.sscRoll ?? '');
    _sscRegController = TextEditingController(text: user.sscReg ?? '');
    _emailController = TextEditingController(text: user.email ?? '');

    _newPasswordController = TextEditingController();
    _confirmPasswordController = TextEditingController();

    _gender = user.gender ?? '';
    _stream = user.stream ?? 'HSC';
    _group = user.division ?? 'Science';
    _batch = user.batch ?? 'HSC 2025';
    _target = user.target ?? '';
    _sscBoard = user.sscBoard ?? 'Dhaka';
    _sscYear = user.sscYear ?? '2023';
    _optionalSubject = user.optionalSubject ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _addressController.dispose();
    _instituteController.dispose();
    _sscRollController.dispose();
    _sscRegController.dispose();
    _emailController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1990),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _dobController.text =
            "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    if (_newPasswordController.text.isNotEmpty &&
        _newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('পাসওয়ার্ড দুটি মিলছে না!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final supabase = Supabase.instance.client;

      final updates = {
        'name': _nameController.text.trim(),
        'dob': _dobController.text.isEmpty ? null : _dobController.text,
        'gender': _gender.isEmpty ? null : _gender,
        'address': _addressController.text.isEmpty
            ? null
            : _addressController.text,
        'institute': _instituteController.text,
        'stream': _stream,
        'division': _group,
        'batch': _batch,
        'target': _target,
        'ssc_roll': _sscRollController.text,
        'ssc_reg': _sscRegController.text,
        'ssc_board': _sscBoard,
        'ssc_passing_year': _sscYear,
        'optional_subject': _optionalSubject,
      };

      if (_newPasswordController.text.isNotEmpty) {
        await supabase.auth.updateUser(
          UserAttributes(password: _newPasswordController.text),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }

      await supabase.from('users').update(updates).eq('id', widget.user.id);

      // Invalidate the provider to refetch user data
      ref.invalidate(userProfileProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('সেটিংস সফলভাবে সেভ করা হয়েছে!'),
            backgroundColor: Colors.green,
          ),
        );
        _newPasswordController.clear();
        _confirmPasswordController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
          ),
        ),
      ),
      child: Row(
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF262626),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String label, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF525252),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required Function(String?) onChanged,
    required bool isDark,
  }) {
    // Ensure the value exists in the list to prevent errors
    final safeValue = items.contains(value) ? value : items.first;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label, isDark),
        DropdownButtonFormField<String>(
          value: safeValue,
          icon: const Icon(LucideIcons.chevronDown, size: 16),
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            filled: true,
            fillColor: isDark
                ? const Color(0xFF0A0A0A)
                : const Color(0xFFFAFAFA),
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
              borderSide: const BorderSide(
                color: Color(0xFF10B981),
              ), // emerald-500
            ),
          ),
          dropdownColor: isDark ? const Color(0xFF171717) : Colors.white,
          items: items.map((e) {
            return DropdownMenuItem(value: e, child: Text(e));
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required bool isDark,
    String? placeholder,
    bool readOnly = false,
    bool isPassword = false,
    Widget? suffixIcon,
    VoidCallback? onTap,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label, isDark),
        TextFormField(
          controller: controller,
          readOnly: readOnly,
          obscureText: isPassword && !_showPassword,
          onTap: onTap,
          validator: validator,
          style: TextStyle(
            color: readOnly
                ? (isDark ? const Color(0xFF737373) : const Color(0xFFA3A3A3))
                : (isDark ? Colors.white : Colors.black),
          ),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(
              color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            filled: true,
            fillColor: readOnly
                ? (isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5))
                : (isDark ? const Color(0xFF0A0A0A) : const Color(0xFFFAFAFA)),
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
                color: readOnly
                    ? (isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFE5E5E5))
                    : const Color(0xFF10B981),
              ),
            ),
            suffixIcon: suffixIcon,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final cardDecoration = BoxDecoration(
      color: isDark ? const Color(0xFF171717) : Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
      ),
      boxShadow: const [
        BoxShadow(
          color: Color(0x05000000),
          blurRadius: 2,
          offset: Offset(0, 1),
        ),
      ],
    );

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: const Text(
          'সেটিংস',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                // 1. Personal Info Card
                Container(
                  decoration: cardDecoration,
                  margin: const EdgeInsets.only(bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildSectionHeader('ব্যক্তিগত তথ্য', isDark),
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            _buildTextField(
                              label: 'নাম',
                              controller: _nameController,
                              isDark: isDark,
                              placeholder: 'তোমার পুরো নাম লেখো',
                              validator: (val) =>
                                  val == null || val.trim().isEmpty
                                  ? 'নাম লেখা আবশ্যক!'
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              label: 'ফোন নম্বর',
                              controller: _phoneController,
                              isDark: isDark,
                              readOnly:
                                  widget.user.phone != null &&
                                  widget.user.phone!.isNotEmpty,
                              placeholder: '০১৭XXXXXXXX',
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              label: 'জন্ম তারিখ',
                              controller: _dobController,
                              isDark: isDark,
                              readOnly: true,
                              onTap: () => _selectDate(context),
                              suffixIcon: const Icon(
                                LucideIcons.calendar,
                                size: 16,
                              ),
                            ),
                            const SizedBox(height: 16),
                            _buildDropdown(
                              label: 'ছাত্র/ছাত্রী (Gender)',
                              value: _gender.isEmpty ? '' : _gender,
                              items: const ['', 'Male', 'Female'],
                              onChanged: (val) =>
                                  setState(() => _gender = val ?? ''),
                              isDark: isDark,
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              label: 'ঠিকানা',
                              controller: _addressController,
                              isDark: isDark,
                              placeholder: 'বর্তমান ঠিকানা...',
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Academic Info Card
                Container(
                  decoration: cardDecoration,
                  margin: const EdgeInsets.only(bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildSectionHeader('একাডেমিক তথ্য', isDark),
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            _buildTextField(
                              label: 'শিক্ষা প্রতিষ্ঠানের নাম',
                              controller: _instituteController,
                              isDark: isDark,
                              placeholder:
                                  'তোমার শিক্ষা প্রতিষ্ঠানের নাম লিখো...',
                            ),
                            const SizedBox(height: 16),
                            _buildDropdown(
                              label: 'কী নিয়ে চর্চা করতে চাও?',
                              value: _stream,
                              items: const ['HSC', 'SSC', 'Admission'],
                              onChanged: (val) =>
                                  setState(() => _stream = val ?? 'HSC'),
                              isDark: isDark,
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildDropdown(
                                    label: 'বিভাগ',
                                    value: _group,
                                    items: const [
                                      'Science',
                                      'Business Studies',
                                      'Humanities',
                                    ],
                                    onChanged: (val) => setState(
                                      () => _group = val ?? 'Science',
                                    ),
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildDropdown(
                                    label: 'ব্যাচ',
                                    value: _batch,
                                    items: const [
                                      'HSC 2024',
                                      'HSC 2025',
                                      'HSC 2026',
                                      'HSC 2027',
                                    ],
                                    onChanged: (val) => setState(
                                      () => _batch = val ?? 'HSC 2025',
                                    ),
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildDropdown(
                              label: 'টার্গেট',
                              value: _target.isEmpty ? 'Medical' : _target,
                              items: const [
                                'Medical',
                                'Engineering',
                                'University',
                              ],
                              onChanged: (val) =>
                                  setState(() => _target = val ?? 'Medical'),
                              isDark: isDark,
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              label: 'এসএসসি রোল নম্বর',
                              controller: _sscRollController,
                              isDark: isDark,
                              placeholder: 'রোল নম্বর লেখো',
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              label: 'এসএসসি রেজিস্ট্রেশন নম্বর',
                              controller: _sscRegController,
                              isDark: isDark,
                              placeholder: 'রেজিস্ট্রেশন নম্বর লেখো',
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildDropdown(
                                    label: 'এসএসসি বোর্ড',
                                    value: _sscBoard,
                                    items: const [
                                      'Dhaka',
                                      'Rajshahi',
                                      'Chittagong',
                                      'Jessore',
                                      'Comilla',
                                      'Barisal',
                                      'Sylhet',
                                      'Dinajpur',
                                      'Mymensingh',
                                      'Madrasah',
                                    ],
                                    onChanged: (val) => setState(
                                      () => _sscBoard = val ?? 'Dhaka',
                                    ),
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildDropdown(
                                    label: 'এসএসসি পাসিং ইয়ার',
                                    value: _sscYear,
                                    items: const [
                                      '2026',
                                      '2025',
                                      '2024',
                                      '2023',
                                      '2022',
                                    ],
                                    onChanged: (val) => setState(
                                      () => _sscYear = val ?? '2023',
                                    ),
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildDropdown(
                              label: 'Optional Subject',
                              value: _optionalSubject.isEmpty
                                  ? ''
                                  : _optionalSubject,
                              items: const ['', 'Biology', 'Statistics'],
                              onChanged: (val) =>
                                  setState(() => _optionalSubject = val ?? ''),
                              isDark: isDark,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // 3. Account Linking (Read-only for now)
                Container(
                  decoration: cardDecoration,
                  margin: const EdgeInsets.only(bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildSectionHeader('অ্যাকাউন্ট লিংকিং', isDark),
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            _buildTextField(
                              label: 'Email',
                              controller: _emailController,
                              isDark: isDark,
                              readOnly: true,
                              suffixIcon: const Icon(
                                LucideIcons.checkCircle2,
                                color: Color(0xFF10B981),
                                size: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // 4. Password Change
                Container(
                  decoration: cardDecoration,
                  margin: const EdgeInsets.only(bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildSectionHeader('পাসওয়ার্ড পরিবর্তন', isDark),
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'পরিবর্তন করতে না চাইলে খালি রাখো',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? const Color(0xFFA3A3A3)
                                    : const Color(0xFF737373),
                              ),
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              label: 'নতুন পাসওয়ার্ড',
                              controller: _newPasswordController,
                              isDark: isDark,
                              isPassword: true,
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _showPassword
                                      ? LucideIcons.eyeOff
                                      : LucideIcons.eye,
                                  size: 18,
                                ),
                                onPressed: () => setState(
                                  () => _showPassword = !_showPassword,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              label: 'পাসওয়ার্ড নিশ্চিত করো',
                              controller: _confirmPasswordController,
                              isDark: isDark,
                              isPassword: true,
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _showPassword
                                      ? LucideIcons.eyeOff
                                      : LucideIcons.eye,
                                  size: 18,
                                ),
                                onPressed: () => setState(
                                  () => _showPassword = !_showPassword,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Save Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF047857), // emerald-700
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 4,
                      shadowColor: const Color(0x3310B981), // emerald-500/20
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'সব সেভ করো',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
