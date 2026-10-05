import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class NotesR2Service {
  static const String customDomain = 'https://notes.obhyash.com';
  static const String fallbackDomain =
      'https://pub-49e78b9c501b4794a748d3b91ec15ef8.r2.dev';

  static const String _prefsKey = 'notes_r2_manifest_files';
  static Set<String> _availablePdfs = {};
  static DateTime? _lastFetchTime;
  static bool _isLoaded = false;

  /// Returns current available PDF relative paths
  static Set<String> get availablePdfs => _availablePdfs;

  /// Loads previously cached manifest from local SharedPreferences for instant UI
  static Future<void> loadFromLocalCache() async {
    if (_isLoaded && _availablePdfs.isNotEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getStringList(_prefsKey);
      if (cached != null && cached.isNotEmpty) {
        _availablePdfs = cached.map((e) => _cleanPath(e)).toSet();
        _isLoaded = true;
      }
    } catch (e) {
      debugPrint('Error loading cached notes manifest: $e');
    }
  }

  /// Fetches latest manifest.json from R2 custom domain (fallback to r2.dev)
  static Future<Set<String>> fetchAvailablePdfs({bool forceRefresh = false}) async {
    // If recently fetched and not forceRefresh, return current set
    if (!forceRefresh &&
        _lastFetchTime != null &&
        DateTime.now().difference(_lastFetchTime!).inMinutes < 2 &&
        _availablePdfs.isNotEmpty) {
      return _availablePdfs;
    }

    await loadFromLocalCache();

    final cacheBuster = DateTime.now().millisecondsSinceEpoch;
    final primaryUri = Uri.parse('$customDomain/manifest.json?t=$cacheBuster');
    final fallbackUri = Uri.parse('$fallbackDomain/manifest.json?t=$cacheBuster');

    http.Response? response;
    try {
      response = await http.get(primaryUri).timeout(const Duration(seconds: 5));
      if (response.statusCode != 200) {
        response = await http.get(fallbackUri).timeout(const Duration(seconds: 5));
      }
    } catch (_) {
      try {
        response = await http.get(fallbackUri).timeout(const Duration(seconds: 5));
      } catch (err) {
        debugPrint('Failed to fetch manifest from both domains: $err');
      }
    }

    if (response != null && response.statusCode == 200) {
      try {
        final data = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        final filesList = (data['files'] as List<dynamic>?)
                ?.map((e) => _cleanPath(e.toString()))
                .where((e) => e.endsWith('.pdf'))
                .toList() ??
            [];

        _availablePdfs = filesList.toSet();
        _lastFetchTime = DateTime.now();
        _isLoaded = true;

        // Persist to SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setStringList(_prefsKey, filesList);
      } catch (e) {
        debugPrint('Error parsing notes manifest: $e');
      }
    }

    return _availablePdfs;
  }

  /// Check if a specific PDF exists on R2
  static bool isPdfAvailable(String r2Path) {
    final clean = _cleanPath(r2Path);
    return _availablePdfs.contains(clean);
  }

  /// Check if a subject has at least one PDF in the specified category
  static bool hasPdfsForSubject(String categoryTitle, String subjectId) {
    final prefix = '${getCategorySlug(categoryTitle)}/$subjectId/';
    return _availablePdfs.any((path) => path.startsWith(prefix));
  }

  /// Get count of PDFs for a subject in a category
  static int getPdfCountForSubject(String categoryTitle, String subjectId) {
    final prefix = '${getCategorySlug(categoryTitle)}/$subjectId/';
    return _availablePdfs.where((path) => path.startsWith(prefix)).length;
  }

  /// Check if a category has any PDFs
  static bool hasPdfsForCategory(String categoryTitle) {
    final prefix = '${getCategorySlug(categoryTitle)}/';
    return _availablePdfs.any((path) => path.startsWith(prefix));
  }

  /// Get total count of PDFs in a category
  static int getPdfCountForCategory(String categoryTitle) {
    final prefix = '${getCategorySlug(categoryTitle)}/';
    return _availablePdfs.where((path) => path.startsWith(prefix)).length;
  }

  /// Maps Bengali Category Titles to directory slugs in R2
  static String getCategorySlug(String categoryTitle) {
    switch (categoryTitle.trim()) {
      case 'দ্রুত রিভিশন শিট':
        return 'revision';
      case 'অনুশীলনী সমাধান':
        return 'exercise';
      case 'হ্যান্ডরিটেন':
        return 'handwritten';
      case 'মাইন্ড ম্যাপস':
        return 'mindmaps';
      default:
        return 'notes';
    }
  }

  /// Builds standardized R2 object path
  /// e.g. "revision/hsc_physics_1/chapter_2.pdf"
  static String buildPdfPath({
    required String categoryTitle,
    required String subjectId,
    required String chapterId,
  }) {
    final slug = getCategorySlug(categoryTitle);
    return '$slug/$subjectId/$chapterId.pdf';
  }

  /// Returns full public URL on custom domain
  static String getPublicUrl(String relativePath) {
    final clean = _cleanPath(relativePath);
    return '$customDomain/$clean';
  }

  /// Returns fallback URL on r2.dev domain
  static String getFallbackUrl(String relativePath) {
    final clean = _cleanPath(relativePath);
    return '$fallbackDomain/$clean';
  }

  static String _cleanPath(String p) {
    var s = p.trim();
    if (s.startsWith('/')) s = s.substring(1);
    return s;
  }
}

