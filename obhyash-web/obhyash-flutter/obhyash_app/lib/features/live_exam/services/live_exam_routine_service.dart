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
    if (cat.contains('gke') || cat.contains('জিকে') || cat.contains('ইংলিশ') || cat.contains('gk')) {
      return 'GKE';
    }
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
      return items;
    }

    if (sheetName.toLowerCase().contains('gke')) {
      final fallback = getGkeRoutineFallback();
      _cache[cacheKey] = fallback;
      return fallback;
    }

    return items;
  }

  static List<GoogleSheetRoutineItem> getGkeRoutineFallback() {
    final List<Map<String, dynamic>> routineList = [
      {
        'num': '01',
        'date': '5 Nov 2026',
        'day': 'বৃহস্পতিবার',
        'syllabus': 'প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস, Noun, Determiners, Article, Number, Gender',
        'chapters': ['প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস', 'Noun', 'Determiners', 'Article', 'Number', 'Gender']
      },
      {
        'num': '02',
        'date': '6 Nov 2026',
        'day': 'শুক্রবার',
        'syllabus': 'ব্রিটিশ শাসন, ভাষা আন্দোলন, Pronoun & Its Classification, Uses of Pronoun',
        'chapters': ['ব্রিটিশ শাসন', 'ভাষা আন্দোলন', 'Pronoun & Its Classification', 'Uses of Pronoun']
      },
      {
        'num': '03',
        'date': '7 Nov 2026',
        'day': 'শনিবার',
        'syllabus': 'বাংলাদেশের মহান মুক্তিযুদ্ধ, Adjective & Its Classification, Degree of Comparison, Adverb & Its Classification, Inversion, Affirmative & Negative Agreement',
        'chapters': ['বাংলাদেশের মহান মুক্তিযুদ্ধ', 'Adjective & Its Classification', 'Degree of Comparison', 'Adverb & Its Classification', 'Inversion', 'Affirmative & Negative Agreement']
      },
      {
        'num': '04',
        'date': '8 Nov 2026',
        'day': 'রবিবার',
        'syllabus': 'মুক্তিযুদ্ধ পরবর্তী ঘটনা প্রবাহ, বাংলাদেশের সংবিধান, Verb & Its Classification, Gerund, Participle & Verbal Noun, Conjugation of Verbs',
        'chapters': ['মুক্তিযুদ্ধ পরবর্তী ঘটনা প্রবাহ', 'বাংলাদেশের সংবিধান', 'Verb & Its Classification', 'Gerund, Participle & Verbal Noun', 'Conjugation of Verbs']
      },
      {
        'num': '05',
        'date': '9 Nov 2026',
        'day': 'সোমবার',
        'syllabus': 'বাংলাদেশের সরকার ব্যবস্থা, জাতীয় সংসদ, আইন ও বিচার বিভাগ, বাংলাদেশের রাজনৈতিক কাঠামো, Preposition & Its Classification, Uses of Some Prepositions',
        'chapters': ['বাংলাদেশের সরকার ব্যবস্থা', 'জাতীয় সংসদ, আইন ও বিচার বিভাগ', 'বাংলাদেশের রাজনৈতিক কাঠামো', 'Preposition & Its Classification', 'Uses of Some Prepositions']
      },
      {
        'num': '06',
        'date': '10 Nov 2026',
        'day': 'মঙ্গলবার',
        'syllabus': 'বাংলাদেশের জনতত্ত্ব ও শিক্ষা ব্যবস্থা, Conjunction, Linkers & Interjection, Prefix & Suffix, Identification of Parts of Speech, Same Word but Different Parts of Speech, Transformation of Parts of Speech',
        'chapters': ['বাংলাদেশের জনতত্ত্ব ও শিক্ষা ব্যবস্থা', 'Conjunction, Linkers & Interjection', 'Prefix & Suffix', 'Identification of Parts of Speech', 'Same Word but Different Parts of Speech', 'Transformation of Parts of Speech']
      },
      {
        'num': '07',
        'date': '11 Nov 2026',
        'day': 'বুধবার',
        'syllabus': 'বাংলাদেশের স্বাস্থ্য ও চিকিৎসা ব্যবস্থা, Phrases & Clauses, Sentence & Its Classification, Transformation of Sentence, Voice, Narration',
        'chapters': ['বাংলাদেশের স্বাস্থ্য ও চিকিৎসা ব্যবস্থা', 'Phrases & Clauses', 'Sentence & Its Classification', 'Transformation of Sentence', 'Voice', 'Narration']
      },
      {
        'num': '08',
        'date': '12 Nov 2026',
        'day': 'বৃহস্পতিবার',
        'syllabus': 'বাংলাদেশের প্রাকৃতিক সম্পদ, Right Form of Verbs',
        'chapters': ['বাংলাদেশের প্রাকৃতিক সম্পদ', 'Right Form of Verbs']
      },
      {
        'num': '09',
        'date': '13 Nov 2026',
        'day': 'শুক্রবার',
        'syllabus': 'বাংলাদেশের অর্থনীতি, শিল্প ও বাণিজ্য, Sentence Correction',
        'chapters': ['বাংলাদেশের অর্থনীতি, শিল্প ও বাণিজ্য', 'Sentence Correction']
      },
      {
        'num': '10',
        'date': '14 Nov 2026',
        'day': 'শনিবার',
        'syllabus': 'বাংলাদেশের প্রতিরক্ষা, যোগাযোগ ব্যবস্থা এবং তথ্য প্রযুক্তি, Tag Question, Sentence Completion',
        'chapters': ['বাংলাদেশের প্রতিরক্ষা, যোগাযোগ ব্যবস্থা এবং তথ্য প্রযুক্তি', 'Tag Question', 'Sentence Completion']
      },
      {
        'num': '11',
        'date': '15 Nov 2026',
        'day': 'রবিবার',
        'syllabus': 'বাংলাদেশের শিল্প, সংস্কৃতি ও সাহিত্য, Analogy, Translation, Literature',
        'chapters': ['বাংলাদেশের শিল্প, সংস্কৃতি ও সাহিত্য', 'Analogy', 'Translation', 'Literature']
      },
      {
        'num': '12',
        'date': '16 Nov 2026',
        'day': 'সোমবার',
        'syllabus': 'বাংলাদেশের বিখ্যাত ব্যক্তিবর্গ, বাংলাদেশের অর্জন, বিভিন্ন চুক্তি ও সনদ, পদক ও পুরস্কার, দিবস, প্রথম, বৃহত্তম ও ক্ষুদ্রতম, Appropriate Preposition',
        'chapters': ['বাংলাদেশের বিখ্যাত ব্যক্তিবর্গ', 'বাংলাদেশের অর্জন', 'বিভিন্ন চুক্তি ও সনদ', 'পদক ও পুরস্কার', 'দিবস', 'প্রথম, বৃহত্তম ও ক্ষুদ্রতম', 'Appropriate Preposition']
      },
      {
        'num': '13',
        'date': '17 Nov 2026',
        'day': 'মঙ্গলবার',
        'syllabus': 'বৈশ্বিক ইতিহাস, Synonym & Antonym (A - L)',
        'chapters': ['বৈশ্বিক ইতিহাস', 'Synonym & Antonym (A - L)']
      },
      {
        'num': '14',
        'date': '18 Nov 2026',
        'day': 'বুধবার',
        'syllabus': 'বিশ্ব পরিচিতি, Synonym & Antonym (M - Z)',
        'chapters': ['বিশ্ব পরিচিতি', 'Synonym & Antonym (M - Z)']
      },
      {
        'num': '15',
        'date': '19 Nov 2026',
        'day': 'বৃহস্পতিবার',
        'syllabus': 'বিশ্ব ভৌগোলিক পরিচিতি, Spelling',
        'chapters': ['বিশ্ব ভৌগোলিক পরিচিতি', 'Spelling']
      },
      {
        'num': '16',
        'date': '20 Nov 2026',
        'day': 'শুক্রবার',
        'syllabus': 'বৈশ্বিক স্বাস্থ্য ও চিকিৎসা ব্যবস্থা, জাতিসংঘ, জাতিসংঘের অঙ্গ সংগঠন, Idiom & Phrases',
        'chapters': ['বৈশ্বিক স্বাস্থ্য ও চিকিৎসা ব্যবস্থা', 'জাতিসংঘ, জাতিসংঘের অঙ্গ সংগঠন', 'Idiom & Phrases']
      },
      {
        'num': '17',
        'date': '21 Nov 2026',
        'day': 'শনিবার',
        'syllabus': 'বিশ্বের উল্লেখযোগ্য অর্থনৈতিক জোট ও আর্থিক প্রতিষ্ঠান, অন্যান্য আন্তর্জাতিক, আঞ্চলিক সহযোগীতা সংস্থা, Group Verb',
        'chapters': ['বিশ্বের উল্লেখযোগ্য অর্থনৈতিক জোট ও আর্থিক প্রতিষ্ঠান', 'অন্যান্য আন্তর্জাতিক, আঞ্চলিক সহযোগীতা সংস্থা', 'Group Verb']
      },
      {
        'num': '18',
        'date': '22 Nov 2026',
        'day': 'রবিবার',
        'syllabus': 'আন্তর্জাতিক সামরিক জোট, অস্ত্র নিয়ন্ত্রণ সংস্থা ও নিরস্ত্রীকরণ চুক্তি, বিশ্বের পরিবেশ ইস্যু ও কূটনীতি, Proverb',
        'chapters': ['আন্তর্জাতিক সামরিক জোট, অস্ত্র নিয়ন্ত্রণ সংস্থা ও নিরস্ত্রীকরণ চুক্তি', 'বিশ্বের পরিবেশ ইস্যু ও কূটনীতি', 'Proverb']
      },
      {
        'num': '19',
        'date': '23 Nov 2026',
        'day': 'সোমবার',
        'syllabus': 'বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী, One Word Substitution, Foreign Words',
        'chapters': ['বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী', 'One Word Substitution', 'Foreign Words']
      },
      {
        'num': '20',
        'date': '24 Nov 2026',
        'day': 'মঙ্গলবার',
        'syllabus': 'বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী, One Word Substitution, Foreign Words',
        'chapters': ['বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী', 'One Word Substitution', 'Foreign Words']
      },
    ];

    return routineList.map((item) {
      return GoogleSheetRoutineItem(
        id: 'gke-mt-${item['num']}',
        date: item['date'] as String,
        dayName: item['day'] as String,
        time: 'সন্ধ্যা ৬:০০ - রাত ১২:০০',
        examName: 'MT-${item['num']}',
        subject: 'সাধারণ জ্ঞান ও ইংরেজি',
        paper: 'জিকে ও ইংলিশ মডেল টেস্ট',
        syllabus: item['syllabus'] as String,
        chapters: (item['chapters'] as List<dynamic>).cast<String>(),
        totalMarks: 100,
        durationMinutes: 60,
      );
    }).toList();
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
        String rawSyllabus = (c[4]?['v'] ?? '').toString().trim();
        final rawMarksTime = (c[5]?['v'] ?? '').toString().trim();

        if (rawDate.isEmpty && rawExamName.isEmpty) continue;

        // Auto-enrich Medical GK & English high-yield topics
        if (rawExamName.contains('Med Live 02') && !rawSyllabus.contains('Articles')) {
          rawSyllabus = rawSyllabus.replaceAll('English: Noun, Pronoun', 'English: Noun, Pronoun, Articles & Determiners');
        } else if (rawExamName.contains('Med Live 05') && !rawSyllabus.contains('Group Verbs')) {
          rawSyllabus = rawSyllabus.replaceAll('English: Preposition', 'English: Appropriate Preposition, Group Verbs');
        } else if (rawExamName.contains('Med Live 10') && !rawSyllabus.contains('ক্ষুদ্র নৃগোষ্ঠী')) {
          rawSyllabus = rawSyllabus.replaceAll('ভৌগোলিক পরিচিতি ও নদ-নদী', 'ভৌগোলিক পরিচিতি, ক্ষুদ্র নৃগোষ্ঠী ও নদ-নদী');
        }

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
