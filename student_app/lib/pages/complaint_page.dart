import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';

class ComplaintType {
  final String id;
  final String label;
  final IconData icon;
  final Color activeColor;
  final String description;

  ComplaintType({
    required this.id,
    required this.label,
    required this.icon,
    required this.activeColor,
    required this.description,
  });
}

class ComplaintPage extends StatefulWidget {
  const ComplaintPage({super.key});

  @override
  State<ComplaintPage> createState() => _ComplaintPageState();
}

class _ComplaintPageState extends State<ComplaintPage> {
  final _supabase = Supabase.instance.client;
  final _descriptionController = TextEditingController();
  
  String? _selectedType;
  bool _isLoading = false;
  bool _isSuccess = false;

  final List<ComplaintType> _types = [
    ComplaintType(
      id: 'Technical',
      label: 'Technical Issue',
      icon: Icons.electrical_services,
      activeColor: AppTheme.success,
      description: 'Bugs, crashes, or loading problems',
    ),
    ComplaintType(
      id: 'UX',
      label: 'User Experience',
      icon: Icons.sentiment_satisfied_alt,
      activeColor: AppTheme.success,
      description: 'Interface suggestions or frustrations',
    ),
    ComplaintType(
      id: 'Bug',
      label: 'Hidden Bug',
      icon: Icons.bug_report,
      activeColor: AppTheme.error,
      description: "Something isn't working correctly",
    ),
    ComplaintType(
      id: 'Feature Request',
      label: 'New Idea',
      icon: Icons.lightbulb_outline,
      activeColor: AppTheme.error,
      description: "A feature you'd love to see",
    ),
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitComplaint() async {
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a complaint category')),
      );
      return;
    }
    
    if (_descriptionController.text.trim().length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide a bit more detail (min 10 characters)')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('Not logged in');

      await _supabase.from('complaints').insert({
        'user_id': user.id,
        'type': _selectedType,
        'description': _descriptionController.text.trim(),
        'status': 'pending', // usually defaults in DB, but safe to pass
      });

      setState(() => _isSuccess = true);

      // Auto pop after 3 seconds
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) Navigator.of(context).pop();
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) {
      return _buildSuccessView();
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      RichText(
                        text: TextSpan(
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : AppTheme.textMain,
                            height: 1.2,
                          ),
                          children: [
                            const TextSpan(text: "Something "),
                            TextSpan(
                              text: "Bugging",
                              style: TextStyle(color: AppTheme.error),
                            ),
                            const TextSpan(text: " You? 🐛"),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        "Tell us what's wrong or how we can make Obhyash better for you!",
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppTheme.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 56,
                  height: 56,
                  margin: const EdgeInsets.only(left: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withOpacity(isDark ? 0.2 : 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(Icons.chat_bubble_outline, color: AppTheme.error, size: 28),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Category Selection
            Text(
              "SELECT CATEGORY",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: AppTheme.textLight.withOpacity(0.5),
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.2,
              ),
              itemCount: _types.length,
              itemBuilder: (context, index) {
                final type = _types[index];
                final isSelected = _selectedType == type.id;

                return GestureDetector(
                  onTap: () => setState(() => _selectedType = type.id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? type.activeColor.withOpacity(0.1)
                          : (isDark ? AppTheme.surface : Colors.white),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected
                            ? type.activeColor
                            : (isDark ? Colors.white10 : Colors.grey.shade200),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: type.activeColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(type.icon, color: type.activeColor, size: 24),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          type.label,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : AppTheme.textMain,
                            fontSize: 13,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          type.description,
                          style: TextStyle(
                            fontSize: 9,
                            color: AppTheme.textLight,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),

            // Textarea
            Text(
              "TELL US MORE",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: AppTheme.textLight.withOpacity(0.5),
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: isDark ? AppTheme.surface : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.grey.shade200,
                ),
              ),
              child: TextField(
                controller: _descriptionController,
                maxLines: 6,
                style: TextStyle(color: isDark ? Colors.white : AppTheme.textMain),
                decoration: InputDecoration(
                  hintText: "Be as detailed as possible... (e.g., 'The OMR scan button didn't react on my phone')",
                  hintStyle: TextStyle(color: AppTheme.textLight.withOpacity(0.5)),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(20),
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitComplaint,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.error,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  elevation: 8,
                  shadowColor: AppTheme.error.withOpacity(0.5),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Send it to Admin!",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          SizedBox(width: 12),
                          Icon(Icons.send_rounded),
                        ],
                      ),
              ),
            ),
            
            const SizedBox(height: 32),
            Center(
              child: Text(
                "Your feedback helps us make Obhyash better for thousands of students. ❤️",
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textLight,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: AppTheme.success.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    Icons.check_circle_rounded,
                    color: AppTheme.success,
                    size: 48,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                "Message Received!",
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textMain,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                "Our team has been alerted! We'll look into it and notify you as soon as it's resolved. Redirecting you back to the dashboard...",
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppTheme.textLight,
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  "Click here if not redirected",
                  style: TextStyle(
                    color: AppTheme.success,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
