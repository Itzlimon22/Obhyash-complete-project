import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/exam_models.dart';
import '../providers/exam_provider.dart';
import '../../dashboard/domain/models.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';
import '../../../core/presentation/widgets/latex_text.dart';
import '../../../core/presentation/widgets/obhyash_tooltip.dart';
import '../../../core/presentation/widgets/pro_upgrade_modal.dart';
import '../../../core/utils/bangla_name_helper.dart';

// --- Domain Models ---
class SubjectItem {
  final String id;
  final String name;
  final String label;
  final String? category;
  final int? sortOrder;

  const SubjectItem({
    required this.id,
    required this.name,
    required this.label,
    this.category,
    this.sortOrder,
  });
}

class ChapterItem {
  final String id;
  final String name;

  const ChapterItem({required this.id, required this.name});
}

class TopicItem {
  final String id;
  final String name;
  final String chapterId;

  const TopicItem({
    required this.id,
    required this.name,
    required this.chapterId,
  });
}


// --- View ---
class ExamSetupView extends ConsumerStatefulWidget {
  const ExamSetupView({super.key});

  @override
  ConsumerState<ExamSetupView> createState() => _ExamSetupViewState();
}

class _ExamSetupViewState extends ConsumerState<ExamSetupView> {
  // Data
  List<SubjectItem> _subjects = [];
  List<ChapterItem> _chapters = [];
  List<TopicItem> _topics = [];
  bool _isLoadingData = true;

  // Form State
  String? _selectedSubject;
  final Set<String> _selectedChapters = {};
  final Set<String> _selectedTopics = {};
  final Set<String> _examTypes = {'Academic', 'Board'};
  final Set<String> _difficulties = {'Medium'};
  int _questionCount = 25;
  int _durationMinutes = 25;
  double _negativeMarking = 0.25;

  bool _isStarting = false;
  String? _lastExamTarget;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(userProfileProvider).value;
    _lastExamTarget = profile?.examTarget ?? profile?.target;
    _initTargetExamTypes(profile);
    _fetchSubjects();
  }

  List<String> _getAllowedExamTypesForProfile(UserProfile? profile) {
    final rawTarget = [
      profile?.target,
      profile?.examTarget,
      profile?.level,
    ].where((s) => s != null && s.isNotEmpty).join(' ').toLowerCase().trim();

    if (rawTarget.contains('eng') ||
        rawTarget.contains('buet') ||
        rawTarget.contains('engineering') ||
        rawTarget.contains('ckruet') ||
        rawTarget.contains('kuet') ||
        rawTarget.contains('ruet') ||
        rawTarget.contains('cuet') ||
        rawTarget.contains('butex') ||
        rawTarget.contains('mist') ||
        rawTarget.contains('ইঞ্জিনিয়ারিং')) {
      return const ['Engineering', 'Varsity', 'Board', 'Academic'];
    } else if (rawTarget.contains('mbbs') ||
        rawTarget.contains('medical') ||
        rawTarget.contains('মেডিকেল') ||
        rawTarget.contains('mat')) {
      return const ['Medical', 'Varsity', 'Board', 'Academic'];
    } else if (rawTarget.contains('varsity') ||
        rawTarget.contains('university') ||
        rawTarget.contains('ভার্সিটি') ||
        rawTarget.contains('gst') ||
        rawTarget.contains('du') ||
        rawTarget.contains('ju') ||
        rawTarget.contains('ru') ||
        rawTarget.contains('cu') ||
        rawTarget.contains('bup')) {
      return const ['Varsity', 'Board', 'Academic'];
    } else {
      return const ['Academic', 'Board'];
    }
  }

  void _initTargetExamTypes(UserProfile? profile) {
    final allowed = _getAllowedExamTypesForProfile(profile);
    _examTypes.clear();
    _examTypes.addAll(allowed);
  }

  Future<void> _fetchSubjects() async {
    setState(() => _isLoadingData = true);
    try {
      final profile = ref.read(userProfileProvider).value;
      _initTargetExamTypes(profile);
      final level = profile?.level?.trim();
      final division = profile?.division?.trim();
      final optionalSubject = profile?.optionalSubject?.trim();

      final supabase = Supabase.instance.client;

      // Fetch subjects from Supabase with fallback to all rows if filtered query fails or returns empty
      dynamic data;
      try {
        var query = supabase.from('subjects').select('*');
        if (division != null && division.isNotEmpty && division != 'General') {
          query = query.or(
            'division.eq.$division,division.eq.General,division.is.null',
          );
        }
        data = await query.limit(150);
      } catch (queryErr) {
        debugPrint(
          '[ExamSetupView] Filtered subjects query failed, falling back to all: $queryErr',
        );
        data = await supabase.from('subjects').select('*').limit(150);
      }

      // If filtered query returned 0 rows, fallback to select('*')
      if (data == null || data.isEmpty) {
        data = await supabase.from('subjects').select('*').limit(150);
      }

      final List rawList = data is List ? data : [];
      var filteredData = rawList.where((e) {
        final subName = (e['name'] ?? e['name_en'] ?? '')
            .toString()
            .toLowerCase();
        final subId = e['id'].toString().toLowerCase();
        final subLevel = (e['level'] ?? '').toString().toUpperCase();

        // Level safety check
        if (level != null && level.toUpperCase() == 'SSC') {
          if (subId.startsWith('hsc_') ||
              subName.contains('hsc') ||
              subLevel == 'HSC') {
            return false;
          }
        } else if (level != null && level.toUpperCase() == 'HSC') {
          if (subId.startsWith('ssc_') ||
              subName.contains('ssc') ||
              subLevel == 'SSC' ||
              subId == 'math' ||
              subId == 'general_math' ||
              subId == 'ssc_general_math' ||
              subId == 'ssc_math' ||
              subName == 'গণিত' ||
              subName == 'সাধারণ গণিত') {
            return false;
          }
        }

        // Optional Subject filtering
        final isBiology =
            subName.contains('biology') ||
            subId.contains('biology') ||
            subName.contains('জীববিজ্ঞান');
        final isStatistics =
            subName.contains('statistics') ||
            subId.contains('statistics') ||
            subName.contains('পরিসংখ্যান');

        if (optionalSubject != null && optionalSubject.isNotEmpty) {
          if (optionalSubject.toLowerCase().contains('stat')) {
            if (isBiology) return false;
          } else if (optionalSubject.toLowerCase().contains('bio')) {
            if (isStatistics) return false;
          }
        }
        return true;
      }).toList();

      // If over-filtered to empty, fall back to raw list so subjects are always visible
      if (filteredData.isEmpty) {
        filteredData = rawList;
      }

      final seen = <String>{};
      final list = <SubjectItem>[];
      for (final e in filteredData) {
        final rawName = (e['name'] ?? e['name_en'] ?? '').toString();
        final rawNameEn = (e['name_en'] ?? '').toString();
        final formattedName = BanglaNameHelper.formatSubject(
          rawNameEn.isNotEmpty ? rawNameEn : rawName,
          rawName,
        );

        if (formattedName.isEmpty || seen.contains(formattedName)) continue;
        seen.add(formattedName);

        list.add(
          SubjectItem(
            id: e['id'].toString(),
            name: formattedName,
            label: formattedName,
            category: e['category']?.toString(),
            sortOrder: e['sort_order'] is int ? e['sort_order'] as int : null,
          ),
        );
      }

      // Sort with custom serial: sort_order if present, otherwise custom canonical priority
      list.sort((a, b) {
        if (a.sortOrder != null &&
            b.sortOrder != null &&
            a.sortOrder != b.sortOrder) {
          return a.sortOrder!.compareTo(b.sortOrder!);
        }
        final priorityA = BanglaNameHelper.getSubjectSortPriority(a.name, a.id);
        final priorityB = BanglaNameHelper.getSubjectSortPriority(b.name, b.id);
        if (priorityA != priorityB) {
          return priorityA.compareTo(priorityB);
        }
        return a.name.compareTo(b.name);
      });

      if (mounted) {
        setState(() {
          _subjects = list;
          _isLoadingData = false;
        });
      }
    } catch (e, st) {
      debugPrint('Failed to fetch subjects: $e\n$st');
      if (mounted) {
        setState(() => _isLoadingData = false);
      }
    }
  }

  Future<void> _fetchChapters(String subjectId) async {
    setState(() {
      _chapters = [];
      _topics = [];
      _selectedChapters.clear();
      _selectedTopics.clear();
    });
    try {
      final supabase = Supabase.instance.client;
      dynamic data = await supabase
          .from('chapters')
          .select('id, name')
          .eq('subject_id', subjectId)
          .limit(200);

      if (data == null || (data as List).isEmpty) {
        final cleanId = subjectId.replaceAll('hsc_', '').replaceAll('ssc_', '');
        data = await supabase
            .from('chapters')
            .select('id, name')
            .or('subject_id.ilike.%$cleanId%,subject_id.ilike.%$subjectId%')
            .limit(200);
      }

      if (mounted) {
        final rawList = ((data as List?) ?? [])
            .map(
              (e) =>
                  ChapterItem(id: e['id'].toString(), name: e['name'] ?? ''),
            )
            .toList();

        // Canonical textbook chapter sorting
        rawList.sort((a, b) {
          final idxA = BanglaNameHelper.getChapterSortIndex(a.name, a.id);
          final idxB = BanglaNameHelper.getChapterSortIndex(b.name, b.id);
          return idxA.compareTo(idxB);
        });

        setState(() {
          _chapters = rawList;
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch chapters: $e');
    }
  }

  Future<void> _fetchTopics() async {
    if (_selectedChapters.isEmpty) {
      if (mounted) {
        setState(() {
          _topics = [];
          _selectedTopics.clear();
        });
      }
      return;
    }
    try {
      final supabase = Supabase.instance.client;
      final data = await supabase
          .from('topics')
          .select('id, name, chapter_id')
          .inFilter('chapter_id', _selectedChapters.toList())
          .limit(500);
      if (mounted) {
        setState(() {
          _topics = (data as List)
              .map(
                (e) => TopicItem(
                  id: e['id'].toString(),
                  name: e['name'] ?? '',
                  chapterId: e['chapter_id'].toString(),
                ),
              )
              .toList();
          // Keep only selected topics that are still in the new list
          _selectedTopics.removeWhere((id) => !_topics.any((t) => t.id == id));
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch topics: $e');
    }
  }

  void _onSubjectChanged(String? id) {
    setState(() => _selectedSubject = id);
    if (id != null) _fetchChapters(id);
  }

  void _showChapterDropdown() {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _MultiSelectDropdownModal(
        title: 'অধ্যায় নির্বাচন করো',
        searchHint: 'অধ্যায় খুঁজুন...',
        items: _chapters,
        selectedIds: _selectedChapters,
        onSave: (newSelection) {
          setState(() {
            _selectedChapters.clear();
            _selectedChapters.addAll(newSelection);
          });
          _fetchTopics();
        },
        getId: (item) => (item as ChapterItem).id,
        getName: (item) => (item as ChapterItem).name,
      ),
    );
  }

  void _showTopicDropdown() {
    final activeChapters = _selectedChapters.isEmpty
        ? _chapters
        : _chapters.where((c) => _selectedChapters.contains(c.id)).toList();

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _TopicCollapsibleSelectionModal(
        chapters: activeChapters,
        topics: _topics,
        selectedTopicIds: _selectedTopics,
        onSave: (newSelection) {
          setState(() {
            _selectedTopics.clear();
            _selectedTopics.addAll(newSelection);
          });
        },
      ),
    );
  }

  void _startExam() async {
    if (_selectedSubject == null) {
      AppPopups.warning(
        context,
        message: 'অনুগ্রহ করে প্রথমে একটি বিষয় নির্বাচন করো',
      );
      return;
    }

    final profile = ref.read(userProfileProvider).value;
    final isPro = profile?.isPro ?? false;

    // Gatekeeper 1: 50+ Questions limit for free users
    if (_questionCount > 50 && !isPro) {
      ProUpgradeModal.show(
        context,
        title: '৫০+ প্রশ্ন আনলক করো ⚡',
        message: 'ফ্রি অ্যাকাউন্টে সর্বোচ্চ ৫০টি প্রশ্ন দিয়ে পরীক্ষা তৈরি করা যায়। ৭৫ বা ১০০ প্রশ্নের পূর্ণাঙ্গ মডেল টেস্ট দিতে প্রো সাবস্ক্রিপশন নাও।',
        featurePill: 'প্রো ফিচার',
      );
      return;
    }

    // Gatekeeper 2: Daily 2 free exams quota
    if (!isPro) {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        final now = DateTime.now().toUtc();
        final startOfDay = DateTime.utc(now.year, now.month, now.day).toIso8601String();
        try {
          final List res = await Supabase.instance.client
              .from('exam_results')
              .select('id')
              .eq('user_id', user.id)
              .gte('created_at', startOfDay);
          if (res.length >= 2) {
            if (mounted) {
              ProUpgradeModal.show(
                context,
                title: 'আজকের ফ্রি কোটা শেষ 🎯',
                message: 'তুমি আজকের ২টি ফ্রি পরীক্ষা সম্পন্ন করে ফেলেছ! প্রতিদিন আনলিমিটেড পরীক্ষা দিতে প্রো সাবস্ক্রিপশন নাও।',
                featurePill: 'দৈনিক ফ্রি কোটা: ২/২',
                icon: LucideIcons.calendarCheck,
              );
            }
            return;
          }
        } catch (e) {
          debugPrint('[ExamSetupView] Quota check error: $e');
        }
      }
    }

    setState(() => _isStarting = true);

    final selectedSub = _subjects.firstWhere((s) => s.id == _selectedSubject);

    final config = ExamConfig(
      subject: selectedSub.name,
      subjectLabel: selectedSub.id,
      examType: _examTypes.join('+'),
      chapters: _chapters
          .where((c) => _selectedChapters.contains(c.id))
          .map((c) => c.name)
          .join(','),
      topics: _topics
          .where((t) => _selectedTopics.contains(t.id))
          .map((t) => t.name)
          .join(','),
      difficulty: _difficulties.isNotEmpty ? _difficulties.join('+') : 'Medium',
      questionCount: _questionCount,
      durationMinutes: _durationMinutes,
      negativeMarking: _negativeMarking,
    );

    final success = await ref
        .read(examEngineProvider.notifier)
        .startExam(config);

    if (mounted) {
      setState(() => _isStarting = false);
      if (success) {
        context.push('/exam');
      } else {
        final err = ref.read(examEngineProvider).errorDetails;
        AppPopups.error(
          context,
          message: err.isNotEmpty
              ? err
              : 'এই বিষয় বা অধ্যায়ে বর্তমানে পর্যাপ্ত প্রশ্ন নেই। অন্য অধ্যায় যুক্ত করো।',
        );
      }
    }
  }


  static const List<_PresetExamBadge> _allPresetBadges = [
    // Engineering (engi)
    _PresetExamBadge(
      id: 'buet',
      label: 'BUET',
      fullName: 'বুয়েট মডেল টেস্ট',
      category: 'engineering',
      defaultExamType: 'Engineering',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('উচ্চতর গণিত', 34),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 33),
        PresetSubjectDistribution('রসায়ন', 33),
      ],
    ),
    _PresetExamBadge(
      id: 'iut',
      label: 'IUT',
      fullName: 'আইইউটি (IUT) মডেল টেস্ট',
      category: 'engineering',
      defaultExamType: 'Engineering',
      durationMinutes: 90,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('উচ্চতর গণিত', 35),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 35),
        PresetSubjectDistribution('রসায়ন', 15),
        PresetSubjectDistribution('English', 15),
      ],
    ),
    _PresetExamBadge(
      id: 'ckruet',
      label: 'CKRUET',
      fullName: 'চুয়েট-কুয়েট-রুয়েট গুচ্ছ',
      category: 'engineering',
      defaultExamType: 'Engineering',
      durationMinutes: 90,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('উচ্চতর গণিত', 25),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 25),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('English', 25),
      ],
    ),
    _PresetExamBadge(
      id: 'mist',
      label: 'MIST',
      fullName: 'এমআইএসটি (MIST) মডেল টেস্ট',
      category: 'engineering',
      defaultExamType: 'Engineering',
      durationMinutes: 90,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('উচ্চতর গণিত', 30),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 30),
        PresetSubjectDistribution('রসায়ন', 30),
        PresetSubjectDistribution('English', 10),
      ],
    ),
    _PresetExamBadge(
      id: 'butex',
      label: 'BUTEX',
      fullName: 'বুটেক্স মডেল টেস্ট',
      category: 'engineering',
      defaultExamType: 'Engineering',
      durationMinutes: 80,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 30),
        PresetSubjectDistribution('রসায়ন', 30),
        PresetSubjectDistribution('উচ্চতর গণিত', 30),
        PresetSubjectDistribution('English', 10),
      ],
    ),

    // Medical (medi)
    _PresetExamBadge(
      id: 'medical_dental',
      label: 'মেডিকেল+ডেন্টাল',
      fullName: 'মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা',
      category: 'medical',
      defaultExamType: 'Medical',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 15),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('জীববিজ্ঞান', 30),
        PresetSubjectDistribution('সাধারণ জ্ঞান', 10),
        PresetSubjectDistribution('English', 15),
        PresetSubjectDistribution('মানবিক গুণাবলি medi admission special', 5),
      ],
    ),
    _PresetExamBadge(
      id: 'mbbs',
      label: 'মেডিকেল (MBBS)',
      fullName: 'সরকারি মেডিকেল কলেজ (MBBS)',
      category: 'medical',
      defaultExamType: 'Medical',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('জীববিজ্ঞান', 30),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 20),
        PresetSubjectDistribution('English', 15),
        PresetSubjectDistribution('সাধারণ জ্ঞান', 10),
      ],
    ),
    _PresetExamBadge(
      id: 'bds',
      label: 'ডেন্টাল (BDS)',
      fullName: 'সরকারি ডেন্টাল কলেজ (BDS)',
      category: 'medical',
      defaultExamType: 'Medical',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('জীববিজ্ঞান', 30),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 20),
        PresetSubjectDistribution('English', 15),
        PresetSubjectDistribution('সাধারণ জ্ঞান', 10),
      ],
    ),
    _PresetExamBadge(
      id: 'afmc',
      label: 'AFMC / AMC',
      fullName: 'আর্মড ফোর্সেস মেডিকেল কলেজ',
      category: 'medical',
      defaultExamType: 'Medical',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('জীববিজ্ঞান', 30),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 20),
        PresetSubjectDistribution('English', 15),
        PresetSubjectDistribution('সাধারণ জ্ঞান', 10),
      ],
    ),

    // Varsity (varsity)
    _PresetExamBadge(
      id: 'du_ka',
      label: "ঢাবি 'ক'",
      fullName: "ঢাকা বিশ্ববিদ্যালয় 'ক' ইউনিট (বিজ্ঞান)",
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 45,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 15),
        PresetSubjectDistribution('রসায়ন', 15),
        PresetSubjectDistribution('উচ্চতর গণিত', 15),
      ],
      optionalChoices: ['জীববিজ্ঞান', 'বাংলা', 'English'],
      optionalQuestionsCount: 15,
    ),
    _PresetExamBadge(
      id: 'cou_a',
      label: "CoU 'A'",
      fullName: "কুমিল্লা বিশ্ববিদ্যালয় 'এ' ইউনিট",
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 25),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('উচ্চতর গণিত', 25),
      ],
      optionalChoices: ['জীববিজ্ঞান', 'English'],
      optionalQuestionsCount: 25,
    ),
    _PresetExamBadge(
      id: 'sust_a',
      label: 'SUST A',
      fullName: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি (এ ইউনিট)',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 90,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 20),
        PresetSubjectDistribution('রসায়ন', 20),
        PresetSubjectDistribution('উচ্চতর গণিত', 20),
      ],
      optionalChoices: ['জীববিজ্ঞান', 'English'],
      optionalQuestionsCount: 20,
    ),
    _PresetExamBadge(
      id: 'ju_a',
      label: 'জাবি এ',
      fullName:
          "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় 'এ' ইউনিট (গাণিতিক ও পদার্থবিজ্ঞান)",
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 55,
      negativeMarking: 0.20,
      compulsorySubjects: [
        PresetSubjectDistribution('উচ্চতর গণিত', 22),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 22),
        PresetSubjectDistribution('রসায়ন', 22),
        PresetSubjectDistribution('আইসিটি', 8),
        PresetSubjectDistribution('বাংলা ও ইংরেজি', 6),
      ],
    ),
    _PresetExamBadge(
      id: 'bup_fsss',
      label: 'BUP FSSS/FASS',
      fullName: 'বিইউপি এফএসএসএস / এফএএসএস',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('English', 35),
        PresetSubjectDistribution('সাধারণ জ্ঞান', 30),
        PresetSubjectDistribution('বাংলা', 15),
      ],
    ),
    _PresetExamBadge(
      id: 'ru_a',
      label: 'RU A',
      fullName: "রাজশাহী বিশ্ববিদ্যালয় 'এ' ইউনিট",
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('বাংলা', 30),
        PresetSubjectDistribution('English', 30),
        PresetSubjectDistribution('সাধারণ জ্ঞান', 20),
      ],
    ),
    _PresetExamBadge(
      id: 'agri_cluster',
      label: 'কৃষি গুচ্ছ',
      fullName: 'সমন্বিত কৃষি গুচ্ছ (৯ বিশ্ববিদ্যালয়)',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('জীববিজ্ঞান', 30),
        PresetSubjectDistribution('রসায়ন', 20),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 20),
        PresetSubjectDistribution('উচ্চতর গণিত', 20),
        PresetSubjectDistribution('English', 10),
      ],
    ),
    _PresetExamBadge(
      id: 'iba',
      label: 'IBA',
      fullName: 'আইবিএ (IBA) ভর্তি পরীক্ষা',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 90,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('English', 30),
        PresetSubjectDistribution('Mathematics', 30),
        PresetSubjectDistribution('Analytical Ability', 15),
      ],
    ),
    _PresetExamBadge(
      id: 'bup_fbs',
      label: 'BUP FBS',
      fullName: 'বিইউপি ব্যবসায় শিক্ষা অনুষদ (বিজ্ঞান শাখা)',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('English', 30),
        PresetSubjectDistribution('সাধারণ গণিত', 35),
        PresetSubjectDistribution('সাধারণ জ্ঞান', 15),
      ],
    ),
    _PresetExamBadge(
      id: 'cu_science',
      label: 'চবি বিজ্ঞান',
      fullName: "চট্টগ্রাম বিশ্ববিদ্যালয় 'এ' ইউনিট (বিজ্ঞান)",
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 25),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('উচ্চতর গণিত', 25),
      ],
      optionalChoices: ['জীববিজ্ঞান', 'বাংলা', 'English'],
      optionalQuestionsCount: 25,
    ),
    _PresetExamBadge(
      id: 'ru_ga',
      label: 'রাবি গ (বিজ্ঞান)',
      fullName: "রাজশাহী বিশ্ববিদ্যালয় 'গ' ইউনিট (বিজ্ঞান)",
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.20,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 25),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('আইসিটি', 5),
      ],
      optionalChoices: ['উচ্চতর গণিত', 'জীববিজ্ঞান'],
      optionalQuestionsCount: 25,
    ),
    _PresetExamBadge(
      id: 'bup_fst',
      label: 'BUP FST',
      fullName: 'বিইউপি বিজ্ঞান ও প্রযুক্তি অনুষদ',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('উচ্চতর গণিত', 25),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 25),
        PresetSubjectDistribution('রসায়ন', 20),
        PresetSubjectDistribution('English', 10),
      ],
    ),
    _PresetExamBadge(
      id: 'gst_ka',
      label: 'গুচ্ছ ক (বিজ্ঞান)',
      fullName: 'জিএসটি সমন্বিত সাধারণ ও বিজ্ঞান প্রযুক্তি (ক ইউনিট)',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 25),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('উচ্চতর গণিত', 25),
      ],
      optionalChoices: ['জীববিজ্ঞান', 'বাংলা', 'English', 'আইসিটি'],
      optionalQuestionsCount: 25,
    ),
    _PresetExamBadge(
      id: 'ju_d',
      label: 'জাবি ডি',
      fullName: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় 'ডি' ইউনিট (জীববিজ্ঞান)",
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 55,
      negativeMarking: 0.20,
      compulsorySubjects: [
        PresetSubjectDistribution('উদ্ভিদবিজ্ঞান', 22),
        PresetSubjectDistribution('প্রাণিবিজ্ঞান', 22),
        PresetSubjectDistribution('রসায়ন', 24),
        PresetSubjectDistribution('বাংলা ও ইংরেজি', 8),
        PresetSubjectDistribution('সাধারণ জ্ঞান ও বুদ্ধিমত্তা', 4),
      ],
    ),
    _PresetExamBadge(
      id: 'hstu_a',
      label: 'HSTU A',
      fullName: 'হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি (এ ইউনিট)',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 25),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('উচ্চতর গণিত', 25),
      ],
      optionalChoices: ['জীববিজ্ঞান', 'English'],
      optionalQuestionsCount: 25,
    ),
    _PresetExamBadge(
      id: 'hstu_b',
      label: 'HSTU B',
      fullName: 'হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি (বি ইউনিট)',
      category: 'varsity',
      defaultExamType: 'Varsity',
      durationMinutes: 60,
      negativeMarking: 0.25,
      compulsorySubjects: [
        PresetSubjectDistribution('জীববিজ্ঞান', 35),
        PresetSubjectDistribution('রসায়ন', 25),
        PresetSubjectDistribution('পদার্থবিজ্ঞান', 25),
        PresetSubjectDistribution('English', 15),
      ],
    ),
  ];

  List<_PresetExamBadge> _getFilteredPresetBadges(UserProfile? profile) {
    final rawTarget = [
      profile?.target,
      profile?.examTarget,
      profile?.level,
      profile?.stream,
      profile?.division,
    ]
        .whereType<String>()
        .where((s) => s.trim().isNotEmpty)
        .join(' ')
        .toLowerCase()
        .trim();

    final bool isMedical = rawTarget.contains('mbbs') ||
        rawTarget.contains('medical') ||
        rawTarget.contains('মেডিকেল') ||
        rawTarget.contains('mat') ||
        rawTarget.contains('dental');

    final bool isEngineering = rawTarget.contains('eng') ||
        rawTarget.contains('buet') ||
        rawTarget.contains('engineering') ||
        rawTarget.contains('ckruet') ||
        rawTarget.contains('kuet') ||
        rawTarget.contains('ruet') ||
        rawTarget.contains('cuet') ||
        rawTarget.contains('butex') ||
        rawTarget.contains('mist') ||
        rawTarget.contains('iut') ||
        rawTarget.contains('ইঞ্জিনিয়ারিং');

    final bool isVarsityOnly = !isMedical &&
        !isEngineering &&
        (rawTarget.contains('varsity') ||
            rawTarget.contains('university') ||
            rawTarget.contains('ভার্সিটি') ||
            rawTarget.contains('gst') ||
            rawTarget.contains('du') ||
            rawTarget.contains('ju') ||
            rawTarget.contains('ru') ||
            rawTarget.contains('cu'));

    List<_PresetExamBadge> list;
    if (isMedical) {
      // Medical + Varsity
      list = _allPresetBadges
          .where((p) => p.category == 'medical' || p.category == 'varsity')
          .toList();
    } else if (isEngineering) {
      // Engineering + Varsity
      list = _allPresetBadges
          .where((p) => p.category == 'engineering' || p.category == 'varsity')
          .toList();
    } else if (isVarsityOnly) {
      // Varsity only
      list = _allPresetBadges.where((p) => p.category == 'varsity').toList();
    } else {
      // Default: All Science Presets
      list = List.of(_allPresetBadges);
    }

    return list;
  }

  void _startPresetExamWithBadge(
    _PresetExamBadge badge,
    List<PresetSubjectDistribution> activeDistribution,
  ) async {
    final profile = ref.read(userProfileProvider).value;
    final isPro = profile?.isPro ?? false;
    final totalQuestions =
        activeDistribution.fold(0, (sum, item) => sum + item.count);

    if (totalQuestions > 50 && !isPro) {
      ProUpgradeModal.show(
        context,
        title: '৫০+ প্রশ্ন আনলক করো ⚡',
        message:
            'ফ্রি অ্যাকাউন্টে সর্বোচ্চ ৫০টি প্রশ্ন দিয়ে পরীক্ষা তৈরি করা যায়। ৭৫ বা ১০০ প্রশ্নের পূর্ণাঙ্গ মডেল টেস্ট দিতে প্রো সাবস্ক্রিপশন নাও।',
        featurePill: 'প্রো ফিচার',
      );
      return;
    }

    if (!isPro) {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        final now = DateTime.now().toUtc();
        final startOfDay =
            DateTime.utc(now.year, now.month, now.day).toIso8601String();
        try {
          final List res = await Supabase.instance.client
              .from('exam_results')
              .select('id')
              .eq('user_id', user.id)
              .gte('created_at', startOfDay);
          if (res.length >= 2) {
            if (mounted) {
              ProUpgradeModal.show(
                context,
                title: 'আজকের ফ্রি কোটা শেষ 🎯',
                message:
                    'তুমি আজকের ২টি ফ্রি পরীক্ষা সম্পন্ন করে ফেলেছ! প্রতিদিন আনলিমিটেড পরীক্ষা দিতে প্রো সাবস্ক্রিপশন নাও।',
                featurePill: 'দৈনিক ফ্রি কোটা: ২/২',
                icon: LucideIcons.calendarCheck,
              );
            }
            return;
          }
        } catch (e) {
          debugPrint('[ExamSetupView] Quota check error: $e');
        }
      }
    }

    setState(() => _isStarting = true);

    final success = await ref
        .read(examEngineProvider.notifier)
        .startMultiSubjectPresetExam(
          examTitle: badge.fullName,
          examLabel: badge.label,
          examType: badge.defaultExamType,
          durationMinutes: badge.durationMinutes,
          negativeMarking: badge.negativeMarking,
          subjectDistribution: activeDistribution,
        );

    if (mounted) {
      setState(() => _isStarting = false);
      if (success) {
        context.push('/exam');
      } else {
        final err = ref.read(examEngineProvider).errorDetails;
        AppPopups.error(
          context,
          message: err.isNotEmpty
              ? err
              : 'এই প্রিসেট পরীক্ষার প্রশ্ন লোড করা সম্ভব হয়নি। পুনরায় চেষ্টা করো।',
        );
      }
    }
  }

  void _showPresetDetailsModal(_PresetExamBadge badge) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PresetExamSelectionModal(
        badge: badge,
        onStart: (dist) => _startPresetExamWithBadge(badge, dist),
      ),
    );
  }

  Widget _buildPresetExamsTab(bool isDark, UserProfile? profile) {
    final filteredBadges = _getFilteredPresetBadges(profile);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 28, 16, 40),
      physics: const BouncingScrollPhysics(),
      child: Center(
        child: Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 12,
          runSpacing: 14,
          children: filteredBadges.map((badge) {
            return _PresetBadgePill(
              badge: badge,
              isDark: isDark,
              onTap: () {
                HapticFeedback.lightImpact();
                _showPresetDetailsModal(badge);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showSubjectDropdown() {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _SubjectDropdownModal(
        subjects: _subjects,
        selectedId: _selectedSubject,
        onSelect: (id) {
          Navigator.pop(context);
          _onSubjectChanged(id);
        },
      ),
    );
  }

  Widget _buildDropdownSelector({
    required String label,
    required String hint,
    required String value,
    required bool isDark,
    required VoidCallback onTap,
    bool disabled = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            fontFamily: 'HindSiliguri',
            color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: disabled ? null : onTap,
          borderRadius: BorderRadius.circular(12),
          child: Opacity(
            opacity: disabled ? 0.5 : 1.0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isDark
                    ? (value.isNotEmpty
                        ? const Color(0xFF2E1A0D).withValues(alpha: 0.35)
                        : const Color(0xFF161619))
                    : (value.isNotEmpty
                        ? const Color(0xFFFFFBEB)
                        : const Color(0xFFF8FAFC)),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? (value.isNotEmpty
                          ? const Color(0xFFD97706).withValues(alpha: 0.5)
                          : const Color(0xFF27272A))
                      : (value.isNotEmpty
                          ? const Color(0xFFF59E0B).withValues(alpha: 0.6)
                          : const Color(0xFFE2E8F0)),
                  width: value.isNotEmpty ? 1.2 : 1.0,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      value.isEmpty ? hint : value,
                      style: TextStyle(
                        fontSize: 16,
                        fontFamily: 'HindSiliguri',
                        fontWeight: value.isEmpty
                            ? FontWeight.normal
                            : FontWeight.bold,
                        color: value.isEmpty
                            ? (isDark
                                ? const Color(0xFF71717A)
                                : const Color(0xFF94A3B8))
                            : (isDark ? Colors.white : const Color(0xFF0F172A)),
                      ),
                    ),
                  ),
                  Icon(
                    LucideIcons.chevronDown,
                    size: 18,
                    color: isDark
                        ? const Color(0xFFA1A1AA)
                        : const Color(0xFF64748B),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Maps English internal value → display Bangla label
  static String _examTypeLabel(String type) {
    switch (type) {
      case 'Engineering': return 'ইঞ্জিনিয়ারিং';
      case 'Varsity': return 'ভার্সিটি';
      case 'Board': return 'বোর্ড';
      case 'Academic': return 'একাডেমিক';
      case 'Easy': return 'সহজ';
      case 'Medium': return 'মধ্যম';
      case 'Hard': return 'কঠিন';
      default: return type;
    }
  }

  Widget _buildSegmentedGroup({
    required List<String> items,
    required Iterable<String> selectedItems,
    required bool isDark,
    required void Function(String) onToggle,
  }) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: items.map((item) {
          final isSelected = selectedItems.contains(item);
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: GestureDetector(
                onTap: () => onToggle(item),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  curve: Curves.easeInOut,
                  padding: const EdgeInsets.symmetric(vertical: 9),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF12544F)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF12544F)
                          : Colors.transparent,
                      width: 1.0,
                    ),
                  ),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text(
                        _examTypeLabel(item),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.normal,
                          fontFamily: 'HindSiliguri',
                          color: isSelected
                              ? Colors.white
                              : (isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF64748B)),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStepperControl({
    required int value,
    required String unit,
    required int min,
    required int max,
    required int step,
    required bool isDark,
    required void Function(int) onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161619) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            onPressed: value > min ? () => onChanged(value - step) : null,
            icon: const Icon(LucideIcons.minus, size: 16),
            color: isDark ? Colors.white : const Color(0xFF12544F),
            disabledColor: isDark
                ? const Color(0xFF3F3F46)
                : const Color(0xFFCBD5E1),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            padding: EdgeInsets.zero,
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              '$value $unit',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                fontFamily: 'HindSiliguri',
                color: isDark
                    ? Colors.white
                    : const Color(0xFF12544F),
              ),
            ),
          ),
          IconButton(
            onPressed: value < max ? () => onChanged(value + step) : null,
            icon: const Icon(LucideIcons.plus, size: 16),
            color: isDark ? Colors.white : const Color(0xFF12544F),
            disabledColor: isDark
                ? const Color(0xFF3F3F46)
                : const Color(0xFFCBD5E1),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }

  Widget _buildPresetPill({
    required String label,
    required bool isSelected,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF12544F) // Solid Viridian Forest
              : (isDark ? const Color(0xFF161619) : const Color(0xFFF8FAFC)),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF12544F)
                : (isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0)),
            width: isSelected ? 1.2 : 1.0,
          ),
        ),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                fontFamily: 'HindSiliguri',
                color: isSelected
                    ? Colors.white
                    : (isDark
                          ? const Color(0xFFA1A1AA)
                          : const Color(0xFF64748B)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLiveConfigBlueprint(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF092328) : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? const Color(0xFF2C2C2C)
              : const Color(0xFF12544F).withValues(alpha: 0.25),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildBlueprintItem(
            icon: LucideIcons.helpCircle,
            iconColor: const Color(0xFF38BDF8),
            label: '$_questionCountটি প্রশ্ন',
            isDark: isDark,
          ),
          _buildBlueprintDivider(isDark),
          _buildBlueprintItem(
            icon: LucideIcons.clock,
            iconColor: const Color(0xFFFBBF24),
            label: '$_durationMinutes মিনিট',
            isDark: isDark,
          ),
          _buildBlueprintDivider(isDark),
          _buildBlueprintItem(
            icon: LucideIcons.minusCircle,
            iconColor: const Color(0xFFF87171),
            label: _negativeMarking == 0 ? '০ মার্ক' : '-$_negativeMarking',
            isDark: isDark,
          ),
          _buildBlueprintDivider(isDark),
          _buildBlueprintItem(
            icon: LucideIcons.zap,
            iconColor: const Color(0xFFA78BFA),
            label: '+${_questionCount * 2} XP',
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildBlueprintItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required bool isDark,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: iconColor),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            fontFamily: 'HindSiliguri',
            color: isDark ? const Color(0xFFFEF3C7) : const Color(0xFF78350F),
          ),
        ),
      ],
    );
  }

  Widget _buildBlueprintDivider(bool isDark) {
    return Container(
      width: 1,
      height: 14,
      color: isDark
          ? const Color(0xFFD97706).withValues(alpha: 0.25)
          : const Color(0xFFFDE68A),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final profile = ref.watch(userProfileProvider).value;
    final currentTarget = profile?.examTarget ?? profile?.target;
    if (_lastExamTarget != currentTarget && profile != null) {
      _lastExamTarget = currentTarget;
      final allowed = _getAllowedExamTypesForProfile(profile);
      _examTypes.clear();
      _examTypes.addAll(allowed);
    }

    ref.listen(userProfileProvider, (previous, next) {
      if (next.value != null && previous?.value != next.value) {
        _initTargetExamTypes(next.value);
        _fetchSubjects();
      }
    });

    final currentSetupTab = ref.watch(examSetupTabProvider);

    return Container(
      color: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      child: currentSetupTab == 'preset'
          ? _buildPresetExamsTab(isDark, profile)
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 32),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
            const SizedBox(height: 8),

            // 1. Subject Selector
            _CardContainer(
              isDark: isDark,
              title: 'বিষয় নির্বাচন',
              icon: LucideIcons.bookOpen,
              child: _isLoadingData
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  : GestureDetector(
                      onTap: _showSubjectDropdown,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? (_selectedSubject != null
                                    ? const Color(
                                        0xFF2E1A0D,
                                      ).withValues(alpha: 0.35)
                                    : const Color(0xFF161619))
                              : (_selectedSubject != null
                                    ? const Color(0xFFFFFBEB)
                                    : const Color(0xFFF8FAFC)),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _selectedSubject != null
                                ? (isDark
                                      ? const Color(
                                          0xFFD97706,
                                        ).withValues(alpha: 0.5)
                                      : const Color(
                                          0xFFF59E0B,
                                        ).withValues(alpha: 0.6))
                                : (isDark
                                      ? const Color(0xFF27272A)
                                      : const Color(0xFFE2E8F0)),
                            width: _selectedSubject != null ? 1.2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                _selectedSubject != null
                                    ? _subjects
                                          .firstWhere(
                                            (s) => s.id == _selectedSubject,
                                          )
                                          .label
                                    : 'বিষয় নির্বাচন করো...',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontFamily: 'HindSiliguri',
                                  fontWeight: FontWeight.bold,
                                  color: _selectedSubject != null
                                      ? (isDark
                                            ? Colors.white
                                            : const Color(0xFF0F172A))
                                      : (isDark
                                            ? const Color(0xFF71717A)
                                            : const Color(0xFF94A3B8)),
                                ),
                              ),
                            ),
                            Icon(
                              LucideIcons.chevronDown,
                              size: 18,
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF64748B),
                            ),
                          ],
                        ),
                      ),
                    ),
            ),
            const SizedBox(height: 12),

            // 2. Chapters & Topics
            Opacity(
              opacity: _selectedSubject == null ? 0.5 : 1.0,
              child: IgnorePointer(
                ignoring: _selectedSubject == null,
                child: _CardContainer(
                  isDark: isDark,
                  title: 'অধ্যায় ও টপিক',
                  icon: LucideIcons.list,
                  tooltip:
                      'যে বিষয় ও অধ্যায়গুলোর ওপর পরীক্ষা দিতে চাও সেগুলো বেছে নাও',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDropdownSelector(
                        label: 'অধ্যায়',
                        hint: 'সব অধ্যায়',
                        value: _selectedChapters.isEmpty
                            ? ''
                            : _selectedChapters.length == _chapters.length
                            ? 'সব অধ্যায়'
                            : '${_selectedChapters.length}টি অধ্যায় নির্বাচিত',
                        isDark: isDark,
                        onTap: _showChapterDropdown,
                        disabled: _chapters.isEmpty && _selectedSubject != null,
                      ),
                      const SizedBox(height: 12),
                      _buildDropdownSelector(
                        label: 'টপিক',
                        hint: 'সব টপিক',
                        value: _selectedTopics.isEmpty
                            ? ''
                            : _selectedTopics.length == _topics.length
                            ? 'সব টপিক'
                            : '${_selectedTopics.length}টি টপিক নির্বাচিত',
                        isDark: isDark,
                        onTap: _showTopicDropdown,
                        disabled: _selectedChapters.isEmpty || _topics.isEmpty,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // 3. Exam Tools (Type, Difficulty, Mark, etc) - iOS Segmented Control
            _CardContainer(
              isDark: isDark,
              title: 'পরীক্ষার ধরন',
              icon: LucideIcons.settings,
              tooltip:
                  'তোমার প্রোফাইলের লক্ষ্য অনুযায়ী পরীক্ষার ধরন ফিল্টার করা হয়েছে। এটি প্রোফাইল থেকে যেকোনো সময় পরিবর্তন করা যাবে।',
              child: _buildSegmentedGroup(
                items: _getAllowedExamTypesForProfile(ref.watch(userProfileProvider).value),
                selectedItems: _examTypes,
                isDark: isDark,
                onToggle: (t) {
                  HapticFeedback.selectionClick();
                  setState(() {
                    if (_examTypes.contains(t) && _examTypes.length > 1) {
                      _examTypes.remove(t);
                    } else if (!_examTypes.contains(t)) {
                      _examTypes.add(t);
                    }
                  });
                },
              ),
            ),
            const SizedBox(height: 12),

            _CardContainer(
              isDark: isDark,
              title: 'কঠিনতা',
              icon: LucideIcons.activity,
              tooltip:
                  'Easy: বেসিক ধারণা\nMedium: স্ট্যান্ডার্ড মান\nHard: চ্যালেঞ্জিং ও উচ্চতর দক্ষতা',
              child: _buildSegmentedGroup(
                items: const ['Easy', 'Medium', 'Hard'],
                selectedItems: _difficulties,
                isDark: isDark,
                onToggle: (d) {
                  HapticFeedback.selectionClick();
                  setState(() {
                    if (_difficulties.contains(d) && _difficulties.length > 1) {
                      _difficulties.remove(d);
                    } else if (!_difficulties.contains(d)) {
                      _difficulties.add(d);
                    }
                  });
                },
              ),
            ),
            const SizedBox(height: 12),

            // 4. Questions: Quick Presets + Stepper Counter
            _CardContainer(
              isDark: isDark,
              title: 'প্রশ্নের সংখ্যা',
              icon: LucideIcons.helpCircle,
              tooltip: 'পরীক্ষায় মোট কতটি প্রশ্ন থাকবে তা নির্ধারণ করো',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stepper row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'মোট প্রশ্ন:',
                        style: TextStyle(
                          fontSize: 16,
                          fontFamily: 'HindSiliguri',
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF64748B),
                        ),
                      ),
                      _buildStepperControl(
                        value: _questionCount,
                        unit: 'টি',
                        min: 5,
                        max: 100,
                        step: 5,
                        isDark: isDark,
                        onChanged: (val) {
                          final profile = ref.read(userProfileProvider).value;
                          final isPro = profile?.isPro ?? false;
                          if (val > 50 && !isPro) {
                            ProUpgradeModal.show(
                              context,
                              title: '৫০+ প্রশ্ন আনলক করো ⚡',
                              message: 'ফ্রি অ্যাকাউন্টে সর্বোচ্চ ৫০টি প্রশ্ন দিয়ে পরীক্ষা তৈরি করা যায়। ৭৫ বা ১০০ প্রশ্নের পূর্ণাঙ্গ মডেল টেস্ট দিতে প্রো সাবস্ক্রিপশন নাও।',
                              featurePill: 'প্রো ফিচার',
                            );
                            return;
                          }
                          HapticFeedback.lightImpact();
                          setState(() {
                            _questionCount = val;
                            _durationMinutes = val;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Quick Preset Pills (Single Row)
                  Row(
                    children: [10, 20, 25, 50, 100].map((count) {
                      final isSelected = _questionCount == count;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 3),
                          child: _buildPresetPill(
                            label: '$countটি',
                            isSelected: isSelected,
                            isDark: isDark,
                            onTap: () {
                              final profile = ref.read(userProfileProvider).value;
                              final isPro = profile?.isPro ?? false;
                              if (count > 50 && !isPro) {
                                ProUpgradeModal.show(
                                  context,
                                  title: '৫০+ প্রশ্ন আনলক করো ⚡',
                                  message: 'ফ্রি অ্যাকাউন্টে সর্বোচ্চ ৫০টি প্রশ্ন দিয়ে পরীক্ষা তৈরি করা যায়। ১০০ প্রশ্নের পূর্ণাঙ্গ মডেল টেস্ট দিতে প্রো সাবস্ক্রিপশন নাও।',
                                  featurePill: 'প্রো ফিচার',
                                );
                                return;
                              }
                              HapticFeedback.selectionClick();
                              setState(() {
                                _questionCount = count;
                                _durationMinutes = count;
                              });
                            },
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // 5. Time: Quick Presets + Stepper Counter
            _CardContainer(
              isDark: isDark,
              title: 'পরীক্ষার সময়',
              icon: LucideIcons.clock,
              tooltip: 'পরীক্ষার মোট সময় (মিনিট)',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stepper row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'মোট সময়:',
                        style: TextStyle(
                          fontSize: 16,
                          fontFamily: 'HindSiliguri',
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF64748B),
                        ),
                      ),
                      _buildStepperControl(
                        value: _durationMinutes,
                        unit: 'মি.',
                        min: 5,
                        max: 180,
                        step: 5,
                        isDark: isDark,
                        onChanged: (val) {
                          HapticFeedback.lightImpact();
                          setState(() => _durationMinutes = val);
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Quick Preset Pills (10, 20, 30, 60, 90 in single row)
                  Row(
                    children: [10, 20, 30, 60, 90].map((mins) {
                      final isSelected = _durationMinutes == mins;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 3),
                          child: _buildPresetPill(
                            label: '$mins মি.',
                            isSelected: isSelected,
                            isDark: isDark,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _durationMinutes = mins);
                            },
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // 6. Negative Marking - Segmented Bar matching Exam Type & Difficulty
            _CardContainer(
              isDark: isDark,
              title: 'নেগেটিভ মার্কিং',
              icon: LucideIcons.minusCircle,
              tooltip:
                  '-০.২৫: প্রতি ৪টি ভুল উত্তরের জন্য ১ নম্বর কাটা\n-০.৫০: প্রতি ২টি ভুল উত্তরের জন্য ১ নম্বর কাটা',
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF18181B)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children:
                      [
                        (0.0, '০ (নেই)'),
                        (0.25, '-০.২৫ মার্ক'),
                        (0.5, '-০.৫ মার্ক'),
                      ].map((entry) {
                        final v = entry.$1;
                        final label = entry.$2;
                        final isSelected = _negativeMarking == v;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: GestureDetector(
                              onTap: () {
                                HapticFeedback.selectionClick();
                                setState(() => _negativeMarking = v);
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                curve: Curves.easeInOut,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 9,
                                ),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF12544F)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF12544F)
                                        : Colors.transparent,
                                    width: 1.0,
                                  ),
                                ),
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                    ),
                                    child: Text(
                                      label,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: isSelected
                                            ? FontWeight.w600
                                            : FontWeight.normal,
                                        fontFamily: 'HindSiliguri',
                                        color: isSelected
                                            ? Colors.white
                                            : (isDark
                                                  ? const Color(0xFFA1A1AA)
                                                  : const Color(0xFF64748B)),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Live Blueprint Capsule Summary
            _buildLiveConfigBlueprint(isDark),
            const SizedBox(height: 16),

            // Start Button - Viridian Forest
            ElevatedButton(
              onPressed: _isStarting
                  ? null
                  : () {
                      HapticFeedback.mediumImpact();
                      _startExam();
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF12544F),
                disabledBackgroundColor: const Color(
                  0xFF12544F,
                ).withValues(alpha: 0.6),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: _isStarting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'শুরু করো',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15.5,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _CardContainer extends StatelessWidget {
  final bool isDark;
  final String title;
  final IconData? icon;
  final Widget child;
  final String? tooltip;

  const _CardContainer({
    required this.isDark,
    required this.title,
    this.icon,
    required this.child,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131316) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF222226) : const Color(0xFFE2E8F0),
        ),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x04000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              if (tooltip != null) ...[
                const SizedBox(width: 6),
                ObhyashTooltipIcon(
                  message: tooltip!,
                  size: 15,
                  preferredPosition: TooltipPosition.bottom,
                  color: isDark
                      ? const Color(0xFF71717A)
                      : const Color(0xFF94A3B8),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _SubjectDropdownModal extends StatelessWidget {
  final List<SubjectItem> subjects;
  final String? selectedId;
  final void Function(String id) onSelect;

  const _SubjectDropdownModal({
    required this.subjects,
    this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final maxHeight = MediaQuery.of(context).size.height * 0.78;

    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: BoxConstraints(maxHeight: maxHeight),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF000000) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF27272A)
                        : const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 12, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'বিষয় নির্বাচন করো',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(LucideIcons.x, size: 20),
                      color: isDark
                          ? const Color(0xFFA1A1AA)
                          : const Color(0xFF64748B),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1, thickness: 0.8),

              // List of Subjects with 3-Tier Categorization
              Expanded(
                child: subjects.isEmpty
                    ? Center(
                        child: Text(
                          'কোনো বিষয় পাওয়া যায়নি',
                          style: TextStyle(
                            color: isDark
                                ? const Color(0xFFA1A1AA)
                                : const Color(0xFF64748B),
                            fontSize: 14,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                      )
                    : Builder(
                        builder: (context) {
                          // Group subjects into Compulsory, Core, and Elective
                          final compulsory = <SubjectItem>[];
                          final core = <SubjectItem>[];
                          final elective = <SubjectItem>[];

                          for (final s in subjects) {
                            final catStr = s.category?.toLowerCase();
                            final cat = (catStr == 'compulsory')
                                ? SubjectCategoryType.compulsory
                                : (catStr == 'elective')
                                ? SubjectCategoryType.elective
                                : (catStr == 'core'
                                      ? SubjectCategoryType.core
                                      : BanglaNameHelper.getSubjectCategory(
                                          s.id,
                                          s.name,
                                        ));
                            switch (cat) {
                              case SubjectCategoryType.compulsory:
                                compulsory.add(s);
                                break;
                              case SubjectCategoryType.core:
                                core.add(s);
                                break;
                              case SubjectCategoryType.elective:
                                elective.add(s);
                                break;
                            }
                          }

                          final sections =
                              <
                                ({
                                  SubjectCategoryType type,
                                  List<SubjectItem> items,
                                })
                              >[
                                if (compulsory.isNotEmpty)
                                  (
                                    type: SubjectCategoryType.compulsory,
                                    items: compulsory,
                                  ),
                                if (core.isNotEmpty)
                                  (type: SubjectCategoryType.core, items: core),
                                if (elective.isNotEmpty)
                                  (
                                    type: SubjectCategoryType.elective,
                                    items: elective,
                                  ),
                              ];

                          return ListView.builder(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                            itemCount: sections.length,
                            itemBuilder: (context, sectionIndex) {
                              final section = sections[sectionIndex];
                              final title = BanglaNameHelper.getCategoryTitle(
                                section.type,
                              );

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: EdgeInsets.only(
                                      top: sectionIndex == 0 ? 4 : 16,
                                      bottom: 8,
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 4,
                                          height: 14,
                                          decoration: BoxDecoration(
                                            color:
                                                section.type ==
                                                    SubjectCategoryType
                                                        .compulsory
                                                ? const Color(0xFF3B82F6)
                                                : (section.type ==
                                                          SubjectCategoryType
                                                              .core
                                                      ? const Color(0xFF10B981)
                                                      : const Color(
                                                          0xFF8B5CF6,
                                                        )),
                                            borderRadius: BorderRadius.circular(
                                              2,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          title,
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w600,
                                            fontFamily: 'HindSiliguri',
                                            color: isDark
                                                ? const Color(0xFFA1A1AA)
                                                : const Color(0xFF64748B),
                                            letterSpacing: 0.2,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ...section.items.map((subject) {
                                    final isSelected = subject.id == selectedId;

                                    final bg = isSelected
                                        ? const Color(0xFF12544F)
                                        : (isDark
                                              ? const Color(0xFF092328)
                                              : const Color(0xFFFAFAFA));

                                    final border = isSelected
                                        ? const Color(0xFF12544F)
                                        : (isDark
                                              ? const Color(0xFF2C2C2C)
                                              : const Color(0xFFE2E8F0));

                                    final textColor = isSelected
                                        ? Colors.white
                                        : (isDark
                                              ? const Color(0xFFD4D4D8)
                                              : const Color(0xFF334155));

                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: InkWell(
                                        onTap: () => onSelect(subject.id),
                                        borderRadius: BorderRadius.circular(14),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                            vertical: 12,
                                          ),
                                          decoration: BoxDecoration(
                                            color: bg,
                                            borderRadius: BorderRadius.circular(
                                              14,
                                            ),
                                            border: Border.all(
                                              color: border,
                                              width: isSelected ? 1.4 : 1.0,
                                            ),
                                          ),
                                          child: Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  subject.label,
                                                  style: TextStyle(
                                                    fontSize: 14.5,
                                                    fontWeight: isSelected
                                                        ? FontWeight.w600
                                                        : FontWeight.normal,
                                                    fontFamily: 'HindSiliguri',
                                                    color: textColor,
                                                  ),
                                                ),
                                              ),
                                              if (isSelected)
                                                Icon(
                                                  Icons.check_circle_rounded,
                                                  color: isDark
                                                      ? const Color(0xFFFBBF24)
                                                      : Colors.white,
                                                  size: 18,
                                                ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    );
                                  }),
                                ],
                              );
                            },
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MultiSelectDropdownModal extends StatefulWidget {
  final String title;
  final String searchHint;
  final List<dynamic> items; // ChapterItem or TopicItem
  final Set<String> selectedIds;
  final void Function(Set<String>) onSave;
  final String Function(dynamic) getId;
  final String Function(dynamic) getName;

  const _MultiSelectDropdownModal({
    required this.title,
    this.searchHint = '',
    required this.items,
    required this.selectedIds,
    required this.onSave,
    required this.getId,
    required this.getName,
  });

  @override
  State<_MultiSelectDropdownModal> createState() =>
      _MultiSelectDropdownModalState();
}

class _MultiSelectDropdownModalState extends State<_MultiSelectDropdownModal> {
  late Set<String> _currentSelected;

  @override
  void initState() {
    super.initState();
    _currentSelected = Set.from(widget.selectedIds);
  }

  void _toggleSelection(String id) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_currentSelected.contains(id)) {
        _currentSelected.remove(id);
      } else {
        _currentSelected.add(id);
      }
    });
  }

  void _toggleSelectAll() {
    HapticFeedback.selectionClick();
    final allIds = widget.items.map((e) => widget.getId(e)).toSet();
    final allSelected = allIds.every((id) => _currentSelected.contains(id));

    setState(() {
      if (allSelected) {
        _currentSelected.removeAll(allIds);
      } else {
        _currentSelected.addAll(allIds);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final allIds = widget.items.map((e) => widget.getId(e)).toSet();
    final isAllSelected =
        allIds.isNotEmpty && allIds.every((id) => _currentSelected.contains(id));

    final maxHeight = MediaQuery.of(context).size.height * 0.78;

    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: BoxConstraints(maxHeight: maxHeight),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF141417) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Compact Drag Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Compact Header with Title, Select All Pill & Close Button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 10, 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Select All Compact Button
                  InkWell(
                    onTap: _toggleSelectAll,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isAllSelected
                            ? (isDark
                                ? const Color(0xFF064E3B)
                                : const Color(0xFFECFDF5))
                            : (isDark
                                ? const Color(0xFF1F1F24)
                                : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isAllSelected
                              ? (isDark
                                  ? const Color(0xFF059669)
                                  : const Color(0xFFA7F3D0))
                              : (isDark
                                  ? const Color(0xFF2E2E33)
                                  : const Color(0xFFE2E8F0)),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isAllSelected
                                ? LucideIcons.checkCheck
                                : LucideIcons.check,
                            size: 13,
                            color: isAllSelected
                                ? (isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF047857))
                                : (isDark
                                    ? const Color(0xFFA1A1AA)
                                    : const Color(0xFF64748B)),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isAllSelected ? 'সব বাছাইকৃত' : 'সবগুলো',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              fontFamily: 'HindSiliguri',
                              color: isAllSelected
                                  ? (isDark
                                      ? const Color(0xFF34D399)
                                      : const Color(0xFF047857))
                                  : (isDark
                                      ? const Color(0xFFE4E4E7)
                                      : const Color(0xFF334155)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(width: 4),

                  // Close Button
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(LucideIcons.x, size: 18),
                    visualDensity: VisualDensity.compact,
                    color: isDark
                        ? const Color(0xFFA1A1AA)
                        : const Color(0xFF64748B),
                  ),
                ],
              ),
            ),

            Divider(
              height: 1,
              thickness: 1,
              color: isDark
                  ? const Color(0xFF27272A)
                  : const Color(0xFFF1F5F9),
            ),

            // Content List (Expanded with Maximum Space)
            Expanded(
              child: widget.items.isEmpty
                  ? Center(
                      child: Text(
                        'কোনো অধ্যায় পাওয়া যায়নি',
                        style: TextStyle(
                          color: isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF64748B),
                          fontSize: 14,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    )
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                      itemCount: widget.items.length,
                      itemBuilder: (context, index) {
                        final item = widget.items[index];
                        final id = widget.getId(item);
                        final name = widget.getName(item);
                        final isSelected = _currentSelected.contains(id);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: InkWell(
                            onTap: () => _toggleSelection(id),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? (isDark
                                        ? const Color(0xFF003D2C)
                                        : const Color(0xFF004633))
                                    : (isDark
                                        ? const Color(0xFF18181B)
                                        : Colors.transparent),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected
                                      ? (isDark
                                          ? const Color(0xFF059669)
                                          : const Color(0xFF004633))
                                      : (isDark
                                          ? const Color(0xFF27272A)
                                          : const Color(0xFFE2E8F0)),
                                  width: isSelected ? 1.4 : 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 20,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? (isDark
                                              ? const Color(0xFF10B981)
                                              : Colors.white)
                                          : Colors.transparent,
                                      border: Border.all(
                                        color: isSelected
                                            ? (isDark
                                                ? const Color(0xFF10B981)
                                                : Colors.white)
                                            : (isDark
                                                ? const Color(0xFF52525B)
                                                : const Color(0xFFCBD5E1)),
                                        width: 1.6,
                                      ),
                                      borderRadius: BorderRadius.circular(5),
                                    ),
                                    child: isSelected
                                        ? Icon(
                                            LucideIcons.check,
                                            size: 12,
                                            color: isDark
                                                ? Colors.black
                                                : const Color(0xFF004633),
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: LatexText(
                                      text: name,
                                      style: TextStyle(
                                        fontSize: 14.5,
                                        fontFamily: 'HindSiliguri',
                                        fontWeight: isSelected
                                            ? FontWeight.w600
                                            : FontWeight.normal,
                                        color: isSelected
                                            ? (isDark
                                                ? const Color(0xFFE6FFFA)
                                                : Colors.white)
                                            : (isDark
                                                ? const Color(0xFFD4D4D8)
                                                : const Color(0xFF334155)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),

            // Footer Save Button
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 14),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      widget.onSave(_currentSelected);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF12544F),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'সংরক্ষণ করো (${_currentSelected.length})',
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopicCollapsibleSelectionModal extends StatefulWidget {
  final List<ChapterItem> chapters;
  final List<TopicItem> topics;
  final Set<String> selectedTopicIds;
  final void Function(Set<String>) onSave;

  const _TopicCollapsibleSelectionModal({
    required this.chapters,
    required this.topics,
    required this.selectedTopicIds,
    required this.onSave,
  });

  @override
  State<_TopicCollapsibleSelectionModal> createState() =>
      _TopicCollapsibleSelectionModalState();
}

class _TopicCollapsibleSelectionModalState
    extends State<_TopicCollapsibleSelectionModal> {
  late Set<String> _currentSelected;
  final Set<String> _expandedChapterIds = {};

  @override
  void initState() {
    super.initState();
    _currentSelected = Set.from(widget.selectedTopicIds);
    for (final c in widget.chapters) {
      _expandedChapterIds.add(c.id);
    }
  }

  void _toggleTopic(String topicId) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_currentSelected.contains(topicId)) {
        _currentSelected.remove(topicId);
      } else {
        _currentSelected.add(topicId);
      }
    });
  }

  void _toggleChapterAll(String chapterId, List<TopicItem> chapterTopics) {
    HapticFeedback.selectionClick();
    final topicIds = chapterTopics.map((t) => t.id).toSet();
    final isAllSelected = topicIds.every((id) => _currentSelected.contains(id));

    setState(() {
      if (isAllSelected) {
        _currentSelected.removeAll(topicIds);
      } else {
        _currentSelected.addAll(topicIds);
      }
    });
  }

  void _toggleSelectAll(List<TopicItem> allTopics) {
    HapticFeedback.selectionClick();
    final allIds = allTopics.map((t) => t.id).toSet();
    final allSelected = allIds.every((id) => _currentSelected.contains(id));

    setState(() {
      if (allSelected) {
        _currentSelected.removeAll(allIds);
      } else {
        _currentSelected.addAll(allIds);
      }
    });
  }

  void _toggleExpand(String chapterId) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_expandedChapterIds.contains(chapterId)) {
        _expandedChapterIds.remove(chapterId);
      } else {
        _expandedChapterIds.add(chapterId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final Map<String, List<TopicItem>> topicsByChapter = {};
    for (final t in widget.topics) {
      topicsByChapter.putIfAbsent(t.chapterId, () => []).add(t);
    }

    final visibleChapters = widget.chapters.where((c) {
      return topicsByChapter.containsKey(c.id) &&
          topicsByChapter[c.id]!.isNotEmpty;
    }).toList();

    final allTopicIds = widget.topics.map((t) => t.id).toSet();
    final isAllSelected = allTopicIds.isNotEmpty &&
        allTopicIds.every((id) => _currentSelected.contains(id));

    final maxHeight = MediaQuery.of(context).size.height * 0.78;

    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: BoxConstraints(maxHeight: maxHeight),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF141417) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Compact Drag Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Compact Header with Title, Select All Pill & Close Button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 10, 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'টপিক নির্বাচন করো',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Select All Compact Button
                  InkWell(
                    onTap: () => _toggleSelectAll(widget.topics),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isAllSelected
                            ? (isDark
                                ? const Color(0xFF064E3B)
                                : const Color(0xFFECFDF5))
                            : (isDark
                                ? const Color(0xFF1F1F24)
                                : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isAllSelected
                              ? (isDark
                                  ? const Color(0xFF059669)
                                  : const Color(0xFFA7F3D0))
                              : (isDark
                                  ? const Color(0xFF2E2E33)
                                  : const Color(0xFFE2E8F0)),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isAllSelected
                                ? LucideIcons.checkCheck
                                : LucideIcons.check,
                            size: 13,
                            color: isAllSelected
                                ? (isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF047857))
                                : (isDark
                                    ? const Color(0xFFA1A1AA)
                                    : const Color(0xFF64748B)),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isAllSelected ? 'সব বাছাইকৃত' : 'সবগুলো',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              fontFamily: 'HindSiliguri',
                              color: isAllSelected
                                  ? (isDark
                                      ? const Color(0xFF34D399)
                                      : const Color(0xFF047857))
                                  : (isDark
                                      ? const Color(0xFFE4E4E7)
                                      : const Color(0xFF334155)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(width: 4),

                  // Close Button
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(LucideIcons.x, size: 18),
                    visualDensity: VisualDensity.compact,
                    color: isDark
                        ? const Color(0xFFA1A1AA)
                        : const Color(0xFF64748B),
                  ),
                ],
              ),
            ),

            Divider(
              height: 1,
              thickness: 1,
              color: isDark
                  ? const Color(0xFF27272A)
                  : const Color(0xFFF1F5F9),
            ),

            // Collapsible Chapter & Topics List
            Expanded(
              child: visibleChapters.isEmpty
                  ? Center(
                      child: Text(
                        'কোনো টপিক পাওয়া যায়নি',
                        style: TextStyle(
                          color: isDark
                              ? const Color(0xFFA1A1AA)
                              : const Color(0xFF64748B),
                          fontSize: 14,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                    )
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                      itemCount: visibleChapters.length,
                      itemBuilder: (context, chapterIdx) {
                        final chapter = visibleChapters[chapterIdx];
                        final chapterTopics = topicsByChapter[chapter.id] ?? [];
                        final isExpanded = _expandedChapterIds.contains(chapter.id);
                        final selectedInChapterCount = chapterTopics
                            .where((t) => _currentSelected.contains(t.id))
                            .length;
                        final isAllInChapterSelected =
                            chapterTopics.isNotEmpty &&
                            selectedInChapterCount == chapterTopics.length;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF141416)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: selectedInChapterCount > 0
                                  ? (isDark
                                        ? const Color(0xFF3F3F46)
                                        : const Color(0xFFCBD5E1))
                                  : (isDark
                                        ? const Color(0xFF27272A)
                                        : const Color(0xFFE2E8F0)),
                              width: 1.0,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Chapter Header
                              InkWell(
                                onTap: () => _toggleExpand(chapter.id),
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 12,
                                  ),
                                  child: Row(
                                    children: [
                                      // Chapter Checkbox for quick batch selection
                                      GestureDetector(
                                        onTap: () => _toggleChapterAll(
                                          chapter.id,
                                          chapterTopics,
                                        ),
                                        child: Container(
                                          width: 20,
                                          height: 20,
                                          decoration: BoxDecoration(
                                            color: isAllInChapterSelected
                                                ? (isDark
                                                      ? Colors.white
                                                      : const Color(0xFF0F172A))
                                                : (selectedInChapterCount > 0
                                                      ? (isDark
                                                            ? const Color(
                                                                0xFF3F3F46,
                                                              )
                                                            : const Color(
                                                                0xFFE2E8F0,
                                                              ))
                                                      : Colors.transparent),
                                            border: Border.all(
                                              color: selectedInChapterCount > 0
                                                  ? (isDark
                                                        ? Colors.white
                                                        : const Color(
                                                            0xFF0F172A,
                                                          ))
                                                  : (isDark
                                                        ? const Color(
                                                            0xFF52525B,
                                                          )
                                                        : const Color(
                                                            0xFFCBD5E1,
                                                          )),
                                              width: 1.6,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              5,
                                            ),
                                          ),
                                          child: isAllInChapterSelected
                                              ? Icon(
                                                  LucideIcons.check,
                                                  size: 12,
                                                  color: isDark
                                                      ? const Color(0xFF000000)
                                                      : Colors.white,
                                                )
                                              : (selectedInChapterCount > 0
                                                    ? Center(
                                                        child: Container(
                                                          width: 8,
                                                          height: 2,
                                                          color: isDark
                                                              ? Colors.white
                                                              : const Color(
                                                                  0xFF0F172A,
                                                                ),
                                                        ),
                                                      )
                                                    : null),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            LatexText(
                                              text: chapter.name,
                                              style: TextStyle(
                                                fontSize: 14.5,
                                                fontWeight: FontWeight.w600,
                                                fontFamily: 'HindSiliguri',
                                                color: isDark
                                                    ? Colors.white
                                                    : const Color(0xFF0F172A),
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '$selectedInChapterCount/${chapterTopics.length}টি টপিক নির্বাচিত',
                                              style: TextStyle(
                                                fontSize: 11.5,
                                                fontFamily: 'HindSiliguri',
                                                fontWeight: FontWeight.normal,
                                                color:
                                                    selectedInChapterCount > 0
                                                    ? (isDark
                                                          ? const Color(
                                                              0xFF34D399,
                                                            )
                                                          : const Color(
                                                              0xFF059669,
                                                            ))
                                                    : (isDark
                                                          ? const Color(
                                                              0xFF71717A,
                                                            )
                                                          : const Color(
                                                              0xFF94A3B8,
                                                            )),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Icon(
                                        isExpanded
                                            ? LucideIcons.chevronUp
                                            : LucideIcons.chevronDown,
                                        size: 16,
                                        color: isDark
                                            ? const Color(0xFFA1A1AA)
                                            : const Color(0xFF64748B),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              // Expanded Topic Items
                              if (isExpanded) ...[
                                Divider(
                                  height: 1,
                                  thickness: 0.8,
                                  color: isDark
                                      ? const Color(0xFF27272A)
                                      : const Color(0xFFE2E8F0),
                                ),
                                ListView.separated(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  padding: const EdgeInsets.fromLTRB(
                                    12,
                                    8,
                                    12,
                                    10,
                                  ),
                                  itemCount: chapterTopics.length,
                                  separatorBuilder: (context, index) =>
                                      const SizedBox(height: 6),
                                  itemBuilder: (context, topicIdx) {
                                    final topic = chapterTopics[topicIdx];
                                    final isSelected = _currentSelected
                                        .contains(topic.id);

                                    return InkWell(
                                      onTap: () => _toggleTopic(topic.id),
                                      borderRadius: BorderRadius.circular(10),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 9,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? (isDark
                                                    ? const Color(0xFF003D2C)
                                                    : const Color(0xFF004633))
                                              : (isDark
                                                    ? const Color(0xFF18181B)
                                                    : const Color(0xFFFAFAFA)),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                          border: Border.all(
                                            color: isSelected
                                                ? (isDark
                                                      ? const Color(
                                                          0xFF059669,
                                                        ).withValues(alpha: 0.5)
                                                      : const Color(0xFF004633))
                                                : (isDark
                                                      ? const Color(0xFF27272A)
                                                      : const Color(
                                                          0xFFE2E8F0,
                                                        )),
                                            width: isSelected ? 1.2 : 1.0,
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            Container(
                                              width: 18,
                                              height: 18,
                                              decoration: BoxDecoration(
                                                color: isSelected
                                                    ? (isDark
                                                          ? const Color(
                                                              0xFF10B981,
                                                            )
                                                          : Colors.white)
                                                    : Colors.transparent,
                                                border: Border.all(
                                                  color: isSelected
                                                      ? (isDark
                                                            ? const Color(
                                                                0xFF10B981,
                                                              )
                                                            : Colors.white)
                                                      : (isDark
                                                            ? const Color(
                                                                0xFF52525B,
                                                              )
                                                            : const Color(
                                                                0xFFCBD5E1,
                                                              )),
                                                  width: 1.5,
                                                ),
                                                borderRadius:
                                                    BorderRadius.circular(4),
                                              ),
                                              child: isSelected
                                                  ? Icon(
                                                      LucideIcons.check,
                                                      size: 11,
                                                      color: isDark
                                                          ? Colors.black
                                                          : const Color(
                                                              0xFF004633,
                                                            ),
                                                    )
                                                  : null,
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: LatexText(
                                                text: topic.name,
                                                style: TextStyle(
                                                  fontSize: 13.5,
                                                  fontFamily: 'HindSiliguri',
                                                  fontWeight: isSelected
                                                      ? FontWeight.w500
                                                      : FontWeight.normal,
                                                  color: isSelected
                                                      ? (isDark
                                                            ? const Color(
                                                                0xFFE6FFFA,
                                                              )
                                                            : Colors.white)
                                                      : (isDark
                                                            ? const Color(
                                                                0xFFD4D4D8,
                                                              )
                                                            : const Color(
                                                                0xFF334155,
                                                              )),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),

            // Footer Save Button
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      HapticFeedback.selectionClick();
                      widget.onSave(_currentSelected);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF12544F),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'সংরক্ষণ করো (${_currentSelected.length}টি টপিক)',
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PresetExamBadge {
  final String id;
  final String label;
  final String fullName;
  final String category; // 'engineering', 'medical', 'varsity'
  final String defaultExamType;
  final int durationMinutes;
  final double negativeMarking;
  final List<PresetSubjectDistribution> compulsorySubjects;
  final List<String> optionalChoices;
  final int optionalQuestionsCount;

  const _PresetExamBadge({
    required this.id,
    required this.label,
    required this.fullName,
    required this.category,
    required this.defaultExamType,
    required this.durationMinutes,
    this.negativeMarking = 0.25,
    required this.compulsorySubjects,
    this.optionalChoices = const [],
    this.optionalQuestionsCount = 0,
  });

  int get totalQuestions =>
      compulsorySubjects.fold(0, (sum, item) => sum + item.count) +
      (optionalChoices.isNotEmpty ? optionalQuestionsCount : 0);
}

class _PresetBadgePill extends StatelessWidget {
  final _PresetExamBadge badge;
  final bool isDark;
  final VoidCallback onTap;

  const _PresetBadgePill({
    required this.badge,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        splashColor: (isDark ? Colors.white12 : Colors.black12),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color:
                  isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
              width: 1.2,
            ),
            boxShadow: isDark
                ? []
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          child: Text(
            badge.label,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w500,
              fontFamily: 'Anek Bangla',
              letterSpacing: -0.2,
              color: isDark ? Colors.white : const Color(0xFF111827),
            ),
          ),
        ),
      ),
    );
  }
}

class _PresetExamSelectionModal extends StatefulWidget {
  final _PresetExamBadge badge;
  final void Function(List<PresetSubjectDistribution> distribution) onStart;

  const _PresetExamSelectionModal({
    required this.badge,
    required this.onStart,
  });

  @override
  State<_PresetExamSelectionModal> createState() =>
      _PresetExamSelectionModalState();
}

class _PresetExamSelectionModalState extends State<_PresetExamSelectionModal> {
  late String? _selectedOptional;

  @override
  void initState() {
    super.initState();
    if (widget.badge.optionalChoices.isNotEmpty) {
      _selectedOptional = widget.badge.optionalChoices.first;
    } else {
      _selectedOptional = null;
    }
  }

  List<PresetSubjectDistribution> get _currentDistribution {
    final list = List<PresetSubjectDistribution>.from(
      widget.badge.compulsorySubjects,
    );
    if (widget.badge.optionalChoices.isNotEmpty && _selectedOptional != null) {
      list.add(PresetSubjectDistribution(
        _selectedOptional!,
        widget.badge.optionalQuestionsCount,
      ));
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E1E22) : Colors.white;
    final cardBorder =
        isDark ? const Color(0xFF2E2E34) : const Color(0xFFE2E8F0);
    final textDark = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    final distribution = _currentDistribution;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121214) : const Color(0xFFF8FAFC),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        MediaQuery.of(context).padding.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color:
                    isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Header with Title & Close Icon
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${widget.badge.label} প্রিসেট',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'HindSiliguri',
                  color: textDark,
                ),
              ),
              GestureDetector(
                onTap: () => Navigator.pop(context),
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(
                    LucideIcons.x,
                    size: 18,
                    color: textSub,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Card 1: Question Distribution (প্রশ্ন বণ্টন)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'প্রশ্ন বণ্টন',
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'HindSiliguri',
                    color: textDark,
                  ),
                ),
                const SizedBox(height: 10),
                // Compulsory subjects list
                ...widget.badge.compulsorySubjects.map((item) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      '${item.subject} - ${BanglaNameHelper.toBanglaNumeral(item.count)}টি',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.normal,
                        fontFamily: 'HindSiliguri',
                        color: textDark,
                      ),
                    ),
                  );
                }),

                // Optional Subject Checkbox row (if available)
                if (widget.badge.optionalChoices.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    'ঐচ্ছিক ( যেকোনো ১টি )',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: textDark,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 20,
                    runSpacing: 8,
                    children: widget.badge.optionalChoices.map((choice) {
                      final isSelected = _selectedOptional == choice;
                      return InkWell(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _selectedOptional = choice);
                        },
                        borderRadius: BorderRadius.circular(6),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            vertical: 3,
                            horizontal: 2,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF006644)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(5),
                                  border: Border.all(
                                    color: const Color(0xFF006644),
                                    width: 1.6,
                                  ),
                                ),
                                child: isSelected
                                    ? const Icon(
                                        Icons.check,
                                        size: 14,
                                        color: Colors.white,
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                choice,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.normal,
                                  fontFamily: 'HindSiliguri',
                                  color: textDark,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Card 2: Duration (সময়)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'সময়',
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'HindSiliguri',
                    color: textDark,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${BanglaNameHelper.toBanglaNumeral(widget.badge.durationMinutes)} মিনিট',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.normal,
                    fontFamily: 'HindSiliguri',
                    color: textDark,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Action Button: পরীক্ষা শুরু করো
          ElevatedButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              Navigator.pop(context);
              widget.onStart(distribution);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF12544F),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: const Text(
              'পরীক্ষা শুরু করো',
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                fontFamily: 'HindSiliguri',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
