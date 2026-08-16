import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/exam_models.dart';

class LocalExamCacheService {
  static const String _kSavedExamIdsKey = 'obhyash_cached_exam_ids_v1';
  static const String _kExamPrefix = 'obhyash_cached_exam_';
  static const String _kHistoryCacheKey = 'obhyash_cached_history_list_v1';
  static const int _kMaxCachedExams = 60; // Max 60 exams (~600 KB - 1.2 MB total)

  /// Automatically cache an evaluated exam result to local storage
  static Future<void> saveExamResult(ExamResult result) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_kExamPrefix${result.id}';
      final jsonStr = jsonEncode(result.toJson());

      await prefs.setString(key, jsonStr);

      // Update index list (keep most recent _kMaxCachedExams)
      List<String> ids = prefs.getStringList(_kSavedExamIdsKey) ?? [];
      ids.remove(result.id);
      ids.insert(0, result.id);

      // Evict older exams if exceeding limit
      if (ids.length > _kMaxCachedExams) {
        final toRemove = ids.sublist(_kMaxCachedExams);
        for (final oldId in toRemove) {
          await prefs.remove('$_kExamPrefix$oldId');
        }
        ids = ids.sublist(0, _kMaxCachedExams);
      }

      await prefs.setStringList(_kSavedExamIdsKey, ids);
      debugPrint('[LocalExamCacheService] Saved exam ${result.id} locally.');
    } catch (e) {
      debugPrint('[LocalExamCacheService] saveExamResult error: $e');
    }
  }

  /// Retrieve a cached exam result by ID
  static Future<ExamResult?> getExamResult(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_kExamPrefix$id';
      final jsonStr = prefs.getString(key);
      if (jsonStr == null || jsonStr.isEmpty) return null;

      final map = jsonDecode(jsonStr) as Map<String, dynamic>;
      return ExamResult.fromJson(map);
    } catch (e) {
      debugPrint('[LocalExamCacheService] getExamResult error: $e');
      return null;
    }
  }

  /// Check if an exam result is stored in local storage
  static Future<bool> isExamCached(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey('$_kExamPrefix$id');
    } catch (_) {
      return false;
    }
  }

  /// Cache the exam history list for instant offline display
  static Future<void> cacheHistoryList(List<Map<String, dynamic>> rawList) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = jsonEncode(rawList);
      await prefs.setString(_kHistoryCacheKey, jsonStr);
    } catch (e) {
      debugPrint('[LocalExamCacheService] cacheHistoryList error: $e');
    }
  }

  /// Load cached history list when offline
  static Future<List<Map<String, dynamic>>?> getCachedHistoryList() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString(_kHistoryCacheKey);
      if (jsonStr == null || jsonStr.isEmpty) return null;

      final list = jsonDecode(jsonStr) as List<dynamic>;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      debugPrint('[LocalExamCacheService] getCachedHistoryList error: $e');
      return null;
    }
  }

  /// Delete a single cached exam
  static Future<void> removeExam(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_kExamPrefix$id');
      List<String> ids = prefs.getStringList(_kSavedExamIdsKey) ?? [];
      ids.remove(id);
      await prefs.setStringList(_kSavedExamIdsKey, ids);
    } catch (e) {
      debugPrint('[LocalExamCacheService] removeExam error: $e');
    }
  }

  static const String _kActiveDraftKey = 'obhyash_active_exam_draft_v1';

  /// Save live active exam draft on the fly for crash / power-off recovery
  static Future<void> saveActiveExamDraft(Map<String, dynamic> draft) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kActiveDraftKey, jsonEncode(draft));
    } catch (e) {
      debugPrint('[LocalExamCacheService] saveActiveExamDraft error: $e');
    }
  }

  /// Retrieve the active exam draft if app crashed or was killed
  static Future<Map<String, dynamic>?> getActiveExamDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString(_kActiveDraftKey);
      if (jsonStr == null || jsonStr.isEmpty) return null;
      return jsonDecode(jsonStr) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('[LocalExamCacheService] getActiveExamDraft error: $e');
      return null;
    }
  }

  /// Clear the active draft once exam is evaluated or discarded
  static Future<void> clearActiveExamDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kActiveDraftKey);
    } catch (e) {
      debugPrint('[LocalExamCacheService] clearActiveExamDraft error: $e');
    }
  }

  /// Clear all cached exams
  static Future<void> clearAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final ids = prefs.getStringList(_kSavedExamIdsKey) ?? [];
      for (final id in ids) {
        await prefs.remove('$_kExamPrefix$id');
      }
      await prefs.remove(_kSavedExamIdsKey);
      await prefs.remove(_kHistoryCacheKey);
      await prefs.remove(_kActiveDraftKey);
    } catch (e) {
      debugPrint('[LocalExamCacheService] clearAll error: $e');
    }
  }
}
