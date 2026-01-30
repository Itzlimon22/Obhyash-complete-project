import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/exam_types.dart';

class ExamService {
  final _supabase = Supabase.instance.client;

  // 🔴 REPLACE with your actual Next.js Admin URL (Use 10.0.2.2 for Android Emulator)
  // For Production, change this to: "https://your-vercel-app.app/api/upload-url"
  final String _nextJsApiUrl = "http://10.0.2.2:3000/api/upload-url";

  // ------------------------------------------------------------------
  // 1. FETCH QUESTIONS (Updated with Filters)
  // ------------------------------------------------------------------
  Future<List<Question>> fetchExamQuestions(ExamConfig config) async {
    try {
      // 1. Start Building the Query
      var query = _supabase
          .from('questions')
          .select(
            'id, question, options_data, correct_answer_index, points, explanation, subject, chapter, topic, difficulty',
          );

      // 2. Apply Subject Filter (Mandatory)
      query = query.eq('subject', config.subject);

      // 3. Apply Chapter Filter (If specific chapter selected)
      if (config.chapters != 'All' && config.chapters.isNotEmpty) {
        query = query.eq('chapter', config.chapters);
      }

      // 4. Apply Topic Filter (If specific topic selected)
      if (config.topics != 'All' &&
          config.topics != 'General' &&
          config.topics.isNotEmpty) {
        query = query.eq('topic', config.topics);
      }

      // 5. Apply Difficulty Filter (If not Mixed)
      if (config.difficulty != 'Mixed') {
        query = query.eq('difficulty', config.difficulty);
      }

      // 6. Execute Query
      final response = await query;
      final data = List<Map<String, dynamic>>.from(response);

      if (data.isEmpty) {
        print(
          "⚠️ No questions found for config: ${config.subject} / ${config.chapters}",
        );
        return [];
      }

      // ✅ Map Database -> Flutter Model
      final questions = data.map((json) {
        // --- PARSING YOUR SPECIFIC JSON OPTIONS ---
        List<String> options = [];

        if (json['options_data'] != null) {
          final rawOptions = List<dynamic>.from(json['options_data']);
          options = rawOptions.map((item) {
            if (item is Map) {
              // Use 'text' if available, otherwise fallback to 'id' (A, B, C...)
              final text = item['text'];
              final id = item['id'];
              return (text != null && text.toString().isNotEmpty)
                  ? text.toString()
                  : id.toString();
            }
            return item.toString();
          }).toList();
        }
        // ------------------------------------------

        return Question(
          id: json['id'].hashCode, // Convert UUID to Int ID
          text: json['question'] ?? 'No Question',
          options: options,
          correctAnswerIndex: json['correct_answer_index'] ?? 0,
          points: json['points'] ?? 1,
          explanation: json['explanation'] ?? '',
        );
      }).toList();

      questions.shuffle();
      // Ensure we don't try to take more questions than available
      return questions
          .take(min(config.questionCount, questions.length))
          .toList();
    } catch (e) {
      print("❌ Error fetching questions: $e");
      return [];
    }
  }

  // ------------------------------------------------------------------
  // 2. SUBMIT RESULT (Saving History)
  // ------------------------------------------------------------------
  Future<void> submitResult(ExamResult result) async {
    final user = _supabase.auth.currentUser;
    final userId = user?.id;

    try {
      await _supabase.from('results').insert({
        if (userId != null) 'user_id': userId,
        'subject': result.subject,
        'exam_title': result.subject, // Useful for History List
        'exam_type': result.examType,

        // Scores
        'score': result.score,
        'total_marks': result.totalMarks,
        'total_questions': result.totalQuestions,
        'correct_count': result.correctCount,
        'wrong_count': result.wrongCount,

        // ✅ CRITICAL: Save User Answers JSON for History Review
        'user_answers': result.userAnswers,

        // Meta
        'submission_type': result.submissionType,
        'script_r2_url': result.scriptImageData,
        'status': result.submissionType == 'script' ? 'pending' : 'evaluated',
        'submitted_at': DateTime.now().toIso8601String(),
      });
      print("✅ Result saved successfully!");
    } catch (e) {
      print("❌ Failed to submit result: $e");
      throw e;
    }
  }

  // ------------------------------------------------------------------
  // 3. FETCH HISTORY (Viewing Past Exams)
  // ------------------------------------------------------------------
  Future<List<Map<String, dynamic>>> fetchExamHistory() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return [];

    try {
      final response = await _supabase
          .from('results')
          .select()
          .eq('user_id', user.id)
          .order('submitted_at', ascending: false); // Newest first

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print("❌ Error fetching history: $e");
      return [];
    }
  }

  // ------------------------------------------------------------------
  // 4. OMR UPLOAD (Helper)
  // ------------------------------------------------------------------
  Future<String?> uploadOmrScriptToR2(File imageFile) async {
    try {
      final fileName = imageFile.path.split('/').last;

      // 1. Get Signed URL
      final signResponse = await http.post(
        Uri.parse(_nextJsApiUrl),
        body: jsonEncode({'fileName': fileName, 'fileType': 'image/jpeg'}),
        headers: {'Content-Type': 'application/json'},
      );

      if (signResponse.statusCode != 200) return null;
      final data = jsonDecode(signResponse.body);

      // 2. Upload to R2
      final uploadResponse = await http.put(
        Uri.parse(data['uploadUrl']),
        body: await imageFile.readAsBytes(),
        headers: {'Content-Type': 'image/jpeg'},
      );

      if (uploadResponse.statusCode == 200) return data['publicUrl'];
      return null;
    } catch (e) {
      print("Upload Error: $e");
      return null;
    }
  }
}
