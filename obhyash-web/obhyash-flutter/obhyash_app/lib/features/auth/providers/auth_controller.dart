import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authControllerProvider = AsyncNotifierProvider<AuthController, void>(() {
  return AuthController();
});

class AuthController extends AsyncNotifier<void> {
  final SupabaseClient _supabase = Supabase.instance.client;

  @override
  FutureOr<void> build() {}

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        await _supabase.auth.signInWithPassword(
          email: email,
          password: password,
        );
      } catch (e) {
        String errorMessage = 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন।';
        if (e is AuthException) {
          if (e.message.contains('Email not confirmed')) {
            errorMessage =
                'দয়া করে আপনার ইমেইল চেক করুন এবং ভেরিফাই লিংক এ ক্লিক করুন।';
          }
        }
        throw Exception(errorMessage);
      }
    });
  }

  Future<void> signup({
    required String name,
    required String phone,
    required String gender,
    required String institute,
    required String stream,
    required String group,
    required String batch,
    required String email,
    required String password,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        final response = await _supabase.auth.signUp(
          email: email,
          password: password,
          data: {'full_name': name, 'name': name, 'role': 'Student'},
        );

        if (response.user != null) {
          await _supabase.from('users').upsert({
            'id': response.user?.id,
            'email': email,
            'name': name,
            'phone': phone,
            'gender': gender.isEmpty ? null : gender,
            'institute': institute,
            'stream': stream,
            'division': group,
            'batch': batch,
            'role': 'Student',
            'status': 'Active',
            'xp': 0,
            'level': 'Beginner',
            'exams_taken': 0,
            'enrolled_exams': 0,
            'last_active': DateTime.now().toIso8601String(),
          });
        }
      } catch (e) {
        throw Exception(
          e is AuthException ? e.message : 'Something went wrong',
        );
      }
    });
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await _supabase.auth.signOut();
    });
  }
}
