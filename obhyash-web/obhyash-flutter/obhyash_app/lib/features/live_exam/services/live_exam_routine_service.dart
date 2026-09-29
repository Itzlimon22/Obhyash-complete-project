import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class GoogleSheetRoutineItem {
  final String id;
  final String date;
  final String dayName;
  final String time;
  final String examName;
  final String subject;
  final String paper;
  final String syllabus;
  final List<String> chapters;
  final int totalMarks;
  final int durationMinutes;

  const GoogleSheetRoutineItem({
    required this.id,
    required this.date,
    required this.dayName,
    required this.time,
    required this.examName,
    required this.subject,
    required this.paper,
    required this.syllabus,
    required this.chapters,
    required this.totalMarks,
    required this.durationMinutes,
  });
}

class LiveExamGoogleSheetService {
  static const String spreadsheetId =
      '1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug';

  // In-memory cache to prevent repeated fetches
  static final Map<String, List<GoogleSheetRoutineItem>> _cache = {};

  static String getSheetName(String category) {
    final cat = category.toLowerCase().trim();
    if (cat.contains('med') || cat.contains('মেডিকেল')) {
      return 'Medical';
    }
    if (cat.contains('eng') || cat.contains('ইঞ্জিনিয়ারিং') || cat.contains('buet')) {
      return 'Engineering';
    }
    if (cat.contains('varsity') ||
        cat.contains('ভার্সিটি') ||
        cat.contains('গুচ্ছ') ||
        cat.contains('ক ইউনিট') ||
        cat.contains('admission')) {
      return 'Varsity_A';
    }
    return 'Medical';
  }

  static Future<List<GoogleSheetRoutineItem>> fetchRoutine(
    String sheetName, {
    String? customSpreadsheetId,
  }) async {
    final sId = (customSpreadsheetId != null && customSpreadsheetId.trim().isNotEmpty)
        ? customSpreadsheetId.trim()
        : spreadsheetId;
    final cacheKey = '${sId}_$sheetName';

    if (_cache.containsKey(cacheKey) && _cache[cacheKey]!.isNotEmpty) {
      // Return cached and refresh in background
      _fetchFromNetwork(sheetName, sId).then((items) {
        if (items.isNotEmpty) _cache[cacheKey] = items;
      }).catchError((_) {});
      return _cache[cacheKey]!;
    }

    final items = await _fetchFromNetwork(sheetName, sId);
    if (items.isNotEmpty) {
      _cache[cacheKey] = items;
    }
    return items;
  }

  static Future<List<GoogleSheetRoutineItem>> _fetchFromNetwork(
    String sheetName,
    String targetSpreadsheetId,
  ) async {
    try {
      final url = Uri.parse(
        'https://docs.google.com/spreadsheets/d/$targetSpreadsheetId/gviz/tq?tqx=out:json&sheet=${Uri.encodeComponent(sheetName)}',
      );

      final response = await http.get(url).timeout(const Duration(seconds: 10));
      if (response.statusCode != 200) {
        return [];
      }

      final body = response.body;
      final start = body.indexOf('{');
      final end = body.lastIndexOf('}');
      if (start == -1 || end == -1) {
        return [];
      }

      final jsonStr = body.substring(start, end + 1);
      final dynamic decoded = jsonDecode(jsonStr);
      final rows = decoded['table']?['rows'] as List<dynamic>?;
      if (rows == null || rows.isEmpty) {
        return [];
      }

      final List<GoogleSheetRoutineItem> items = [];

      for (int i = 0; i < rows.length; i++) {
        final c = rows[i]?['c'] as List<dynamic>?;
        if (c == null || c.isEmpty) continue;

        final rawDate = (c[0]?['f'] ?? c[0]?['v'] ?? '').toString().trim();
        final rawDay = (c[1]?['v'] ?? '').toString().trim();
        final rawExamName = (c[2]?['v'] ?? '').toString().trim();
        final rawSubject = (c[3]?['v'] ?? '').toString().trim();
        final rawSyllabus = (c[4]?['v'] ?? '').toString().trim();
        final rawMarksTime = (c[5]?['v'] ?? '').toString().trim();

        if (rawDate.isEmpty && rawExamName.isEmpty) continue;

        int totalMarks = 50;
        int durationMinutes = 30;

        final marksMatch = RegExp(r'(\d+|[০-৯]+)\s*(?:মার্কস|নম্বর)')
            .firstMatch(rawMarksTime);
        if (marksMatch != null) {
          totalMarks = int.tryParse(_toEnglishDigits(marksMatch.group(1)!)) ?? 50;
        }

        final timeMatch = RegExp(r'(\d+|[০-৯]+)\s*(?:মিনিট|ঘণ্টা)')
            .firstMatch(rawMarksTime);
        if (timeMatch != null) {
          if (rawMarksTime.contains('ঘণ্টা')) {
            durationMinutes = 60;
          } else {
            durationMinutes =
                int.tryParse(_toEnglishDigits(timeMatch.group(1)!)) ?? 30;
          }
        }

        // Parse chapters from syllabus
        final List<String> chapters = [];
        if (rawSyllabus.isNotEmpty) {
          final parts = rawSyllabus.split(RegExp(r'[;\n]'));
          for (final p in parts) {
            final t = p.trim();
            if (t.isNotEmpty) chapters.push(t);
          }
        }
        if (chapters.isEmpty && rawSyllabus.isNotEmpty) {
          chapters.add(rawSyllabus);
        }

        items.add(
          GoogleSheetRoutineItem(
            id: '${sheetName.toLowerCase()}-${i + 1}',
            date: rawDate,
            dayName: rawDay,
            time: rawMarksTime.isNotEmpty ? rawMarksTime : 'রাত ৮:০০ - রাত ১১:০০',
            examName: rawExamName,
            subject: rawSubject,
            paper: rawExamName.contains('Mega') ? 'কম্বাইন্ড মেগা টেস্ট' : rawSubject,
            syllabus: rawSyllabus,
            chapters: chapters.isNotEmpty ? chapters : ['সম্পূর্ণ সিলেবাস'],
            totalMarks: totalMarks,
            durationMinutes: durationMinutes,
          ),
        );
      }

      return items;
    } catch (e) {
      debugPrint('Error fetching Google Sheet routine: $e');
      return [];
    }
  }

  static String _toEnglishDigits(String str) {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    var result = str;
    for (int i = 0; i < 10; i++) {
      result = result.replaceAll(bn[i], i.toString());
    }
    return result;
  }
}

extension ListPush<T> on List<T> {
  void push(T element) => add(element);
}
