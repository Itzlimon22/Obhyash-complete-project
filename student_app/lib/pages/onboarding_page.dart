// File: lib/pages/onboarding_page.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'home_page.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  bool _isLoading = false;

  Future<void> _updateProfile(String selectedStream) async {
    setState(() => _isLoading = true);
    final user = Supabase.instance.client.auth.currentUser;

    if (user != null) {
      try {
        await Supabase.instance.client
            .from('profiles')
            .update({'stream': selectedStream}) // e.g., 'HSC', 'Admission'
            .eq('id', user.id);

        if (mounted) {
          // Success! Go to Home Page permanently
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const HomePage()),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text("Select Your Goal"), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              "What are you preparing for?",
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 30),

            // OPTION 1: HSC
            _buildOptionCard(
              title: "HSC Academic",
              subtitle: "Board Exams & Foundation",
              icon: Icons.school,
              color: Colors.blueAccent,
              onTap: () => _updateProfile('HSC'),
            ),

            const SizedBox(height: 16),

            // OPTION 2: Engineering (Admission)
            _buildOptionCard(
              title: "Engineering Admission",
              subtitle: "BUET, CKRUET, SUST",
              icon: Icons.engineering,
              color: Colors.orangeAccent,
              onTap: () => _updateProfile('Engineering'),
            ),

            const SizedBox(height: 16),

            // OPTION 3: Medical (Admission)
            _buildOptionCard(
              title: "Medical Admission",
              subtitle: "DMC & Govt. Medicals",
              icon: Icons.local_hospital,
              color: Colors.redAccent,
              onTap: () => _updateProfile('Medical'),
            ),

            const SizedBox(height: 16),

            // OPTION 4: Varsity (Admission)
            _buildOptionCard(
              title: "Varsity Admission",
              subtitle: "Public & Private Universities",
              icon: Icons.school,
              color: Colors.greenAccent,
              onTap: () => _updateProfile('Varsity'),
            ),

            if (_isLoading)
              const Padding(
                padding: EdgeInsets.only(top: 20),
                child: Center(child: CircularProgressIndicator()),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: _isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: color.withOpacity(0.2),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ],
            ),
            const Spacer(),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
