import 'package:flutter/material.dart';
import 'package:student_app/main.dart'; // For Supabase
import 'package:student_app/theme.dart'; // For Theme & Spacing
import 'package:student_app/pages/home_page.dart';
import 'package:student_app/widgets/primary_button.dart'; // Use our new widget
import 'package:supabase_flutter/supabase_flutter.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  // Clean state management
  bool _isLoading = false;
  bool _isLoginMode = true; // Toggle between Login and Sign Up

  // ---------------------------------------------------------------------------
  // LOGIC SECTION
  // ---------------------------------------------------------------------------

  Future<void> _handleAuth() async {
    // 1. Validation
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showError("Please fill in all fields.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (_isLoginMode) {
        // --- LOG IN ---
        await supabase.auth.signInWithPassword(
          email: email,
          password: password,
        );
      } else {
        // --- SIGN UP ---
        await supabase.auth.signUp(
          email: email,
          password: password,
          data: {'full_name': 'New Student'}, // Default name
        );
      }

      // Success! Navigate to Home
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomePage()),
        );
      }
    } on AuthException catch (e) {
      _showError(e.message);
    } catch (e) {
      _showError("An unexpected error occurred.");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // UI SECTION
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Logo / Illustration Area
                const Icon(
                  Icons.rocket_launch_rounded,
                  size: 64,
                  color: AppTheme.primary,
                ),
                const SizedBox(height: AppSpacing.lg),

                // 2. Headings
                Text(
                  _isLoginMode ? "Welcome Back!" : "Create Account",
                  style: textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  _isLoginMode
                      ? "Sign in to continue your learning journey."
                      : "Join us and start mastering new skills.",
                  style: textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textLight,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xl),

                // 3. Inputs
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: "Email Address",
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: "Password",
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  obscureText: true,
                ),

                const SizedBox(height: AppSpacing.xl),

                // 4. Smart Button (Using our reusable widget)
                PrimaryButton(
                  text: _isLoginMode ? "Sign In" : "Sign Up",
                  onPressed: _handleAuth, // Just pass the function name
                  isLoading: _isLoading, // Handle spinner automatically
                ),

                const SizedBox(height: AppSpacing.lg),

                // 5. Toggle Mode
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _isLoginMode ? "New here? " : "Already have an account? ",
                      style: const TextStyle(color: AppTheme.textLight),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _isLoginMode = !_isLoginMode),
                      child: Text(
                        _isLoginMode ? "Create Account" : "Log In",
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
