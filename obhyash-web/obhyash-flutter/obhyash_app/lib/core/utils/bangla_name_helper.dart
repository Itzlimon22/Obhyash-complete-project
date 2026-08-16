class BanglaNameHelper {
  /// Converts any subject identifier, slug, or label to standard Bengali.
  /// Never returns a raw English ID like "physics_1st" or "higher_math_2nd".
  static String formatSubject(String? subject, [String? subjectLabel]) {
    // 1. If subjectLabel has Bengali text, use it
    if (subjectLabel != null && _hasBengali(subjectLabel)) {
      return subjectLabel.trim();
    }

    final raw = (subjectLabel?.isNotEmpty == true ? subjectLabel! : (subject ?? '')).trim();
    if (raw.isEmpty) return 'পরীক্ষা';

    if (_hasBengali(raw)) {
      return raw;
    }

    final lower = raw.toLowerCase().replaceAll('-', '_');

    // 2. Specific multi-part mapping
    if (lower.contains('physics')) {
      if (lower.contains('1st') || lower.contains('_1') || lower.contains('first')) return 'পদার্থবিজ্ঞান ১ম পত্র';
      if (lower.contains('2nd') || lower.contains('_2') || lower.contains('second')) return 'পদার্থবিজ্ঞান ২য় পত্র';
      return 'পদার্থবিজ্ঞান';
    }

    if (lower.contains('chemistry')) {
      if (lower.contains('1st') || lower.contains('_1') || lower.contains('first')) return 'রসায়ন ১ম পত্র';
      if (lower.contains('2nd') || lower.contains('_2') || lower.contains('second')) return 'রসায়ন ২য় পত্র';
      return 'রসায়ন';
    }

    if (lower.contains('higher_math') || lower.contains('highermath') || lower.contains('h_math')) {
      if (lower.contains('1st') || lower.contains('_1') || lower.contains('first')) return 'উচ্চতর গণিত ১ম পত্র';
      if (lower.contains('2nd') || lower.contains('_2') || lower.contains('second')) return 'উচ্চতর গণিত ২য় পত্র';
      return 'উচ্চতর গণিত';
    }

    if (lower.contains('math') || lower.contains('mathematics')) {
      if (lower.contains('1st') || lower.contains('_1') || lower.contains('first')) return 'উচ্চতর গণিত ১ম পত্র';
      if (lower.contains('2nd') || lower.contains('_2') || lower.contains('second')) return 'উচ্চতর গণিত ২য় পত্র';
      if (lower.contains('general')) return 'সাধারণ গণিত';
      return 'উচ্চতর গণিত';
    }

    if (lower.contains('biology') || lower.contains('botany') || lower.contains('zoology')) {
      if (lower.contains('1st') || lower.contains('_1') || lower.contains('botany') || lower.contains('first')) {
        return 'জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)';
      }
      if (lower.contains('2nd') || lower.contains('_2') || lower.contains('zoology') || lower.contains('second')) {
        return 'জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)';
      }
      return 'জীববিজ্ঞান';
    }

    if (lower.contains('bangla') || lower.contains('bengali')) {
      if (lower.contains('1st') || lower.contains('_1') || lower.contains('first')) return 'বাংলা ১ম পত্র';
      if (lower.contains('2nd') || lower.contains('_2') || lower.contains('second')) return 'বাংলা ২য় পত্র';
      return 'বাংলা';
    }

    if (lower.contains('english')) {
      if (lower.contains('1st') || lower.contains('_1') || lower.contains('first')) return 'ইংরেজি ১ম পত্র';
      if (lower.contains('2nd') || lower.contains('_2') || lower.contains('second')) return 'ইংরেজি ২য় পত্র';
      return 'ইংরেজি';
    }

    if (lower.contains('ict') || lower.contains('information_and_communication')) {
      return 'তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)';
    }

    if (lower.contains('general_science') || lower.contains('science')) {
      return 'সাধারণ বিজ্ঞান';
    }

    if (lower.contains('bgs') || lower.contains('bangladesh_and_global')) {
      return 'বাংলাদেশ ও বিশ্বপরিচয়';
    }

    if (lower.contains('gk') || lower.contains('general_knowledge')) {
      return 'সাধারণ জ্ঞান';
    }

    if (lower.contains('accounting')) return 'হিসাববিজ্ঞান';
    if (lower.contains('finance')) return 'ফিন্যান্স ও ব্যাংকিং';
    if (lower.contains('management')) return 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা';
    if (lower.contains('marketing')) return 'উৎপাদন ব্যবস্থাপনা ও বিপণন';
    if (lower.contains('economics')) return 'অর্থনীতি';
    if (lower.contains('civics')) return 'পৌরনীতি ও সুশাসন';
    if (lower.contains('sociology')) return 'সমাজবিজ্ঞান';
    if (lower.contains('islamic_history')) return 'ইসলামের ইতিহাস ও সংস্কৃতি';
    if (lower.contains('history')) return 'ইতিহাস';
    if (lower.contains('islamic_studies') || lower.contains('islam')) return 'ইসলাম শিক্ষা';
    if (lower.contains('psychology')) return 'মনোবিজ্ঞান';
    if (lower.contains('geography')) return 'ভূগোল';
    if (lower.contains('statistics')) return 'পরিসংখ্যান';

    // Cleanup generic words
    return raw
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ');
  }

  /// Converts chapter strings into clean Bengali text.
  /// Translates common chapter formats like "Chapter 1", "Ch-1", and converts English digits to Bengali.
  static String formatChapter(String? chapter) {
    if (chapter == null || chapter.trim().isEmpty) return '';
    String text = chapter.trim();

    // Replace English chapter keywords
    text = text.replaceAllMapped(
      RegExp(r'^(?:Chapter|Ch|Chap|অধ্যায়)[\s\.\-_:]*(\d+)', caseSensitive: false),
      (m) => 'অধ্যায় ${toBanglaNumeral(m.group(1))}',
    );

    // Convert any remaining isolated English digits to Bengali digits
    text = text.replaceAllMapped(
      RegExp(r'\b(\d+)\b'),
      (m) => toBanglaNumeral(m.group(1)),
    );

    return text;
  }

  /// Returns the canonical textbook order index (1-indexed) of a chapter.
  static int getChapterSortIndex(String chapterName, [String? id]) {
    final raw = '$chapterName ${id ?? ''}'.toLowerCase().replaceAll('\u09df', '\u09af\u09bc'); // য় -> য+়

    // 1. Check if ID has explicit number (e.g. ch01, ch1, ch_1, chem1_ch02, phy1_ch03)
    final idMatch = RegExp(r'ch[_\-]?0*(\d+)', caseSensitive: false).firstMatch(id ?? chapterName);
    if (idMatch != null) {
      final numVal = int.tryParse(idMatch.group(1) ?? '');
      if (numVal != null && numVal > 0) return numVal;
    }

    // 2. Check if text starts with chapter number (e.g. ১ম অধ্যায়, অধ্যায় ১, ১.)
    final bengaliDigitMatch = RegExp(r'(?:অধ্যায়|chapter|ch)?[\s\.\-_:]*([১-৯১০-৯]+|[0-9]+)', caseSensitive: false).firstMatch(chapterName);
    if (bengaliDigitMatch != null) {
      final matchStr = bengaliDigitMatch.group(1)!;
      final parsed = _parseBengaliOrEnglishInt(matchStr);
      if (parsed != null && parsed > 0 && parsed <= 30) return parsed;
    }

    // 3. Chemistry 1st Paper canonical
    if (raw.contains('ল্যাবরেটরি') || raw.contains('ল্যাবরেটরী')) return 1;
    if (raw.contains('গুণগত')) return 2;
    if (raw.contains('পর্যায়বৃত্ত') || raw.contains('পর্যায়বৃত্ত') || raw.contains('রাসায়নিক বন্ধন') || raw.contains('রাসায়নিক বন্ধন')) return 3;
    if (raw.contains('রাসায়নিক পরিবর্তন') || raw.contains('রাসায়নিক পরিবর্তন')) return 4;
    if (raw.contains('কর্মমুখী')) return 5;

    // 4. Chemistry 2nd Paper canonical
    if (raw.contains('পরিবেশ রসায়ন') || raw.contains('পরিবেশ রসায়ন')) return 1;
    if (raw.contains('জৈব যৌগ') || raw.contains('জৈব রসায়ন')) return 2;
    if (raw.contains('পরিমাণগত') || raw.contains('পরিমানগত')) return 3;
    if (raw.contains('তড়িৎ রসায়ন') || raw.contains('তড়িৎ রসায়ন') || raw.contains('তড়িৎ রসায়ন')) return 4;
    if (raw.contains('অর্থনৈতিক')) return 5;

    // 5. Physics 1st Paper canonical
    if (raw.contains('ভৌতজগত') || raw.contains('ভৌত জগত')) return 1;
    if (raw.contains('ভেক্টর')) return 2;
    if (raw.contains('গতিবিদ্যা')) return 3;
    if (raw.contains('বলবিদ্যা') || raw.contains('নিউটনিয়ান') || raw.contains('নিউটনিয়')) return 4;
    if (raw.contains('কাজ, শক্তি') || raw.contains('কাজ শক্তি') || raw.contains('কাজ ও শক্তি')) return 5;
    if (raw.contains('মহাকর্ষ')) return 6;
    if (raw.contains('গাঠনিক ধর্ম')) return 7;
    if (raw.contains('পর্যায়বৃত্ত গতি') || raw.contains('পর্যায়বৃত্ত গতি')) return 8;
    if (raw.contains('তরঙ্গ')) return 9;
    if (raw.contains('আদর্শ গ্যাস') || raw.contains('গ্যাসের গতিতত্ত্ব')) return 10;

    // 6. Physics 2nd Paper canonical
    if (raw.contains('তাপগতিবিদ্যা')) return 1;
    if (raw.contains('স্থির তড়িৎ') || raw.contains('স্থির তড়িৎ')) return 2;
    if (raw.contains('চল তড়িৎ') || raw.contains('চল তড়িৎ')) return 3;
    if (raw.contains('চৌম্বক ক্রিয়া') || raw.contains('চুম্বকত্ব')) return 4;
    if (raw.contains('তাড়িতচৌম্বকীয়') || raw.contains('আবেশ ও পরিবর্তী')) return 5;
    if (raw.contains('জ্যামিতিক আলোক')) return 6;
    if (raw.contains('ভৌত আলোক')) return 7;
    if (raw.contains('আধুনিক পদার্থবিজ্ঞান')) return 8;
    if (raw.contains('পরমাণুর মডেল') || raw.contains('নিউক্লিয়ার')) return 9;
    if (raw.contains('সেমিকন্ডাক্টর')) return 10;
    if (raw.contains('জ্যোতির্বিজ্ঞান')) return 11;

    // 7. Higher Math 1st Paper canonical
    if (raw.contains('ম্যাট্রিক্স') || raw.contains('নির্ণায়ক') || raw.contains('নির্ণায়ক')) return 1;
    if (raw.contains('সরলরেখা')) return 3;
    if (raw.contains('বৃত্ত')) return 4;
    if (raw.contains('বিন্যাস ও সমাবেশ') || raw.contains('বিন্যাস')) return 5;
    if (raw.contains('ত্রিকোণমিতিক অনুপাত') && !raw.contains('সংযুক্ত')) return 6;
    if (raw.contains('সংযুক্ত কোণ')) return 7;
    if (raw.contains('ফাংশন ও ফাংশনের লেখচিত্র') || raw.contains('ফাংশনের লেখচিত্র')) return 8;
    if (raw.contains('অন্তরীকরণ')) return 9;
    if (raw.contains('যোগজীকরণ')) return 10;

    // 8. Higher Math 2nd Paper canonical
    if (raw.contains('বাস্তব সংখ্যা')) return 1;
    if (raw.contains('যোগাশ্রয়ী') || raw.contains('যোগাশ্রয়ী')) return 2;
    if (raw.contains('জটিল সংখ্যা')) return 3;
    if (raw.contains('বহুপদী')) return 4;
    if (raw.contains('দ্বিপদী')) return 5;
    if (raw.contains('কণিক') || raw.contains('কনিক')) return 6;
    if (raw.contains('বিপরীত ত্রিকোণমিতিক')) return 7;
    if (raw.contains('স্থিতিবিদ্যা')) return 8;
    if (raw.contains('সমতলে বস্তুকণার গতি') || raw.contains('বস্তুকণার গতি')) return 9;
    if (raw.contains('বিস্তার পরিমাপ') || raw.contains('সম্ভাবনা')) return 10;

    // 9. Biology 1st Paper (Botany) canonical
    if (raw.contains('কোষ ও এর গঠন') || raw.contains('কোষের গঠন')) return 1;
    if (raw.contains('কোষ বিভাজন')) return 2;
    if (raw.contains('কোষ রসায়ন') || raw.contains('কোষ রসায়ন')) return 3;
    if (raw.contains('অনুজীব') || raw.contains('অণুজীব')) return 4;
    if (raw.contains('শৈবাল ও ছত্রাক')) return 5;
    if (raw.contains('ব্রায়োফাইটা') || raw.contains('টেরিডোফাইটা')) return 6;
    if (raw.contains('নগ্নবীজী') || raw.contains('আবৃতবীজী')) return 7;
    if (raw.contains('টিস্যু ও টিস্যুতন্ত্র') || raw.contains('টিস্যুতন্ত্র')) return 8;
    if (raw.contains('উদ্ভিদ শারীরতত্ত্ব')) return 9;
    if (raw.contains('উদ্ভিদ প্রজনন')) return 10;
    if (raw.contains('জীবপ্রযুক্তি') || raw.contains('বায়োটেকনোলজি')) return 11;
    if (raw.contains('জীবের পরিবেশ') || raw.contains('বিস্তার ও সংরক্ষণ')) return 12;

    // 10. Biology 2nd Paper (Zoology) canonical
    if (raw.contains('প্রাণীর বিভিন্নতা') || raw.contains('শ্রেণিবিন্যাস')) return 1;
    if (raw.contains('প্রাণীর পরিচিতি') || raw.contains('হাইড্রা') || raw.contains('ঘাসফড়িং') || raw.contains('রুই মাছ')) return 2;
    if (raw.contains('পরিপাক ও শোষণ') || raw.contains('পরিপাক')) return 3;
    if (raw.contains('রক্ত ও সংবহন') || raw.contains('রক্ত সংবহন')) return 4;
    if (raw.contains('শ্বাসক্রিয়া') || raw.contains('শ্বসন')) return 5;
    if (raw.contains('বর্জ্য ও নিষ্কাশন') || raw.contains('বর্জ্য')) return 6;
    if (raw.contains('চলন ও অঙ্গচালনা') || raw.contains('অস্থি')) return 7;
    if (raw.contains('সমন্বয় ও নিয়ন্ত্রণ') || raw.contains('হরমোন')) return 8;
    if (raw.contains('মানব জীবনের ধারাবাহিকতা') || raw.contains('প্রজনন তন্ত্র')) return 9;
    if (raw.contains('মানবদেহের প্রতিরক্ষা') || raw.contains('ইমিউনিটি') || raw.contains('প্রতিরক্ষা')) return 10;
    if (raw.contains('জিনতত্ত্ব ও বিবর্তন') || raw.contains('জিনতত্ত্ব')) return 11;
    if (raw.contains('প্রাণীর আচরণ')) return 12;

    // 11. ICT canonical
    if (raw.contains('বিশ্ব ও বাংলাদেশ প্রেক্ষিত') || raw.contains('বিশ্ব প্রেক্ষিত')) return 1;
    if (raw.contains('কমিউনিকেশন সিস্টেমস') || raw.contains('নেটওয়ার্কিং') || raw.contains('নেটওয়ার্কিং')) return 2;
    if (raw.contains('সংখ্যা পদ্ধতি') || raw.contains('ডিজিটাল ডিভাইস')) return 3;
    if (raw.contains('ওয়েব ডিজাইন') || raw.contains('html')) return 4;
    if (raw.contains('প্রোগ্রামিং ভাষা') || raw.contains('সি প্রোগ্রামিং')) return 5;
    if (raw.contains('ডেটাবেজ') || raw.contains('ডাটাবেজ') || raw.contains('dbms')) return 6;

    return 999;
  }

  static int? _parseBengaliOrEnglishInt(String input) {
    const map = {
      '০': '0',
      '১': '1',
      '২': '2',
      '৩': '3',
      '৪': '4',
      '৫': '5',
      '৬': '6',
      '৭': '7',
      '৮': '8',
      '৯': '9',
    };
    final enStr = input.split('').map((c) => map[c] ?? c).join();
    return int.tryParse(enStr);
  }

  /// Converts any integer or number string to Bengali digits (e.g. 25 -> ২৫).
  static String toBanglaNumeral(dynamic input) {
    if (input == null) return '';
    final str = input.toString();
    const map = {
      '0': '০',
      '1': '১',
      '2': '২',
      '3': '৩',
      '4': '৪',
      '5': '৫',
      '6': '৬',
      '7': '৭',
      '8': '৮',
      '9': '৯',
    };
    return str.split('').map((c) => map[c] ?? c).join();
  }

  static bool _hasBengali(String text) {
    return RegExp(r'[\u0980-\u09FF]').hasMatch(text);
  }

  /// Determines the 3-tier academic category: Compulsory, Core, or Elective.
  static SubjectCategoryType getSubjectCategory(String id, [String? name]) {
    final lower = '$id ${name ?? ''}'.toLowerCase();

    // 1. Compulsory (আবশ্যিক)
    if (lower.contains('bangla') ||
        lower.contains('বাংলা') ||
        lower.contains('english') ||
        lower.contains('ইংরেজি') ||
        lower.contains('ict') ||
        lower.contains('তথ্য')) {
      return SubjectCategoryType.compulsory;
    }

    // 2. Elective / 4th Subject (ঐচ্ছিক)
    if (lower.contains('biology') ||
        lower.contains('জীববিজ্ঞান') ||
        lower.contains('botany') ||
        lower.contains('zoology') ||
        lower.contains('statistics') ||
        lower.contains('পরিসংখ্যান') ||
        lower.contains('psychology') ||
        lower.contains('মনোবিজ্ঞান') ||
        lower.contains('agriculture') ||
        lower.contains('কৃষি')) {
      return SubjectCategoryType.elective;
    }

    // 3. Core Departmental Subject (বিভাগীয় মূল বিষয়)
    return SubjectCategoryType.core;
  }

  /// Human-friendly Bangla & English title for the category headers
  static String getCategoryTitle(SubjectCategoryType type) {
    switch (type) {
      case SubjectCategoryType.compulsory:
        return 'আবশ্যিক বিষয়সমূহ (Compulsory)';
      case SubjectCategoryType.core:
        return 'বিভাগীয় মূল বিষয়সমূহ (Core Subjects)';
      case SubjectCategoryType.elective:
        return 'ঐচ্ছিক / ৪র্থ বিষয় (Elective)';
    }
  }

  /// Returns a themed emoji icon for each subject
  static String getSubjectEmoji(String id, [String? name]) {
    final lower = '$id ${name ?? ''}'.toLowerCase();

    if (lower.contains('physics') || lower.contains('পদার্থ')) return '⚛️';
    if (lower.contains('chemistry') || lower.contains('রসায়ন') || lower.contains('রসায়ন')) return '🧪';
    if (lower.contains('higher_math') || lower.contains('উচ্চতর গণিত') || lower.contains('math') || lower.contains('গণিত')) return '📐';
    if (lower.contains('biology') || lower.contains('জীববিজ্ঞান') || lower.contains('botany') || lower.contains('zoology')) return '🧬';
    if (lower.contains('bangla') || lower.contains('বাংলা')) return '📚';
    if (lower.contains('english') || lower.contains('ইংরেজি')) return '📝';
    if (lower.contains('ict') || lower.contains('তথ্য') || lower.contains('information')) return '💻';
    if (lower.contains('accounting') || lower.contains('হিসাব')) return '📊';
    if (lower.contains('finance') || lower.contains('ফিন্যান্স') || lower.contains('ব্যাংকিং')) return '💼';
    if (lower.contains('management') || lower.contains('ব্যবস্থাপনা') || lower.contains('ব্যবসায়')) return '🏢';
    if (lower.contains('marketing') || lower.contains('বিপণন') || lower.contains('উৎপাদন')) return '📈';
    if (lower.contains('economics') || lower.contains('অর্থনীতি')) return '📉';
    if (lower.contains('civics') || lower.contains('পৌরনীতি')) return '🏛️';
    if (lower.contains('history') || lower.contains('ইতিহাস')) return '📜';
    if (lower.contains('geography') || lower.contains('ভূগোল')) return '🌍';
    if (lower.contains('statistics') || lower.contains('পরিসংখ্যান')) return '📊';

    return '📘';
  }

  /// Formats educational institute / board / university and textbook author tags exactly like Chorcha:
  /// Examples:
  /// ["DAT", "মাজেদা ম্যাম"], ["2018-2019"] -> "DAT 18-19, মাজেদা ম্যাম"
  /// ["DU A", "AGRI GST"], ["2014-2015", "2020-2021"] -> "DU A 14-15, AGRI GST 20-21"
  /// ["DINAJPUR BOARD"], ["2017"] -> "DINAJPUR BOARD 17"
  /// ["BUET", "কেতাব স্যার"], ["2022-2023"] -> "BUET 22-23, কেতাব স্যার"
  static String formatQuestionSource({
    required List<dynamic> institutes,
    required List<dynamic> years,
  }) {
    if (institutes.isEmpty && years.isEmpty) return '';

    final rawInsts = institutes
        .map((e) => e.toString().trim())
        .where((s) => s.isNotEmpty)
        .toList();
    final yrs = years
        .map((e) => _formatYearShort(e.toString()))
        .where((s) => s.isNotEmpty)
        .toList();

    if (rawInsts.isEmpty && yrs.isEmpty) return '';

    final tags = <String>[];
    int yearIdx = 0;

    for (final raw in rawInsts) {
      final normalized = _normalizeInstituteOrAuthor(raw);
      final isAuthor = _isTextbookAuthor(normalized);

      // If item is already tagged with a year e.g. "DAT 18-19" or "DU A 14-15"
      if (RegExp(r'\b\d{2}(?:-\d{2})?\b').hasMatch(normalized)) {
        tags.add(normalized);
        continue;
      }

      // If it is a textbook author or book reference, don't attach year
      if (isAuthor) {
        tags.add(normalized);
        continue;
      }

      // If it is an exam / board / university, attach corresponding year if available
      if (yearIdx < yrs.length) {
        tags.add('$normalized ${yrs[yearIdx]}');
        yearIdx++;
      } else {
        tags.add(normalized);
      }
    }

    // If there are leftover unassigned years
    while (yearIdx < yrs.length) {
      if (tags.isEmpty) {
        tags.add(yrs[yearIdx]);
      } else {
        // If single tag without year, append to it
        tags[tags.length - 1] = '${tags.last} ${yrs[yearIdx]}';
      }
      yearIdx++;
    }

    return tags.join(', ');
  }

  /// Recognizes textbook writers and book references across HSC/SSC
  static bool _isTextbookAuthor(String name) {
    final lower = name.toLowerCase();
    return lower.contains('ম্যাম') ||
        lower.contains('স্যার') ||
        lower.contains('আজমল') ||
        lower.contains('হাসান') ||
        lower.contains('মাজেদা') ||
        lower.contains('হাজারী') ||
        lower.contains('নাগ') ||
        lower.contains('গুহ') ||
        lower.contains('লিংকন') ||
        lower.contains('কবির') ||
        lower.contains('ইসহাক') ||
        lower.contains('তপন') ||
        lower.contains('সেলু') ||
        lower.contains('তোফাজ্জল') ||
        lower.contains('কেতাব') ||
        lower.contains('আহাম্মদ') ||
        lower.contains('আহমেদ') ||
        lower.contains('সাহা') ||
        lower.contains('আফসারুজ্জামান') ||
        lower.contains('মুজিবুর') ||
        lower.contains('মাহবুবুর') ||
        lower.contains('সিস্টেক') ||
        lower.contains('অক্ষরপত্র') ||
        lower.contains('জয়কলি') ||
        lower.contains('রয়েল') ||
        lower.contains('অনুপম') ||
        lower.contains('আলিম') ||
        lower.contains('জাহেদ') ||
        lower.contains('নাসিম বানু') ||
        lower.contains('খালেক') ||
        lower.contains('প্রমথেশ') ||
        lower.contains('গিয়াসউদ্দিন') ||
        lower.contains('রফিকুল') ||
        lower.contains('হারুনুর') ||
        lower.contains('নজরুল');
  }

  static String _normalizeInstituteOrAuthor(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return '';
    final upper = trimmed.toUpperCase().replaceAll('-', ' ').replaceAll('_', ' ');

    // Boards standard representations
    if (upper == 'DB' || upper == 'DHAKA' || upper.contains('DHAKA BOARD')) return 'DHAKA BOARD';
    if (upper == 'DIN' || upper == 'DINAJ' || upper.contains('DINAJPUR')) return 'DINAJPUR BOARD';
    if (upper == 'RB' || upper == 'RAJ' || upper.contains('RAJSHAHI')) return 'RAJSHAHI BOARD';
    if (upper == 'CB' || upper == 'CTG' || upper.contains('CHITTAGONG') || upper.contains('CHATTOGRAM')) return 'CHATTOGRAM BOARD';
    if (upper == 'COMB' || upper == 'COM' || upper.contains('COMILLA') || upper.contains('CUMILLA')) return 'CUMILLA BOARD';
    if (upper == 'JB' || upper == 'JES' || upper.contains('JESSORE') || upper.contains('JASHORE')) return 'JASHORE BOARD';
    if (upper == 'BB' || upper == 'BAR' || upper.contains('BARISAL') || upper.contains('BARISHAL')) return 'BARISHAL BOARD';
    if (upper == 'SB' || upper == 'SYL' || upper.contains('SYLHET')) return 'SYLHET BOARD';
    if (upper == 'MB' || upper == 'MYM' || upper.contains('MYMENSINGH')) return 'MYMENSINGH BOARD';
    if (upper == 'MAD' || upper.contains('MADRASAH')) return 'MADRASAH BOARD';
    if (upper == 'TEC' || upper.contains('TECHNICAL')) return 'TECHNICAL BOARD';
    if (upper == 'ALL' || upper.contains('ALL BOARD')) return 'ALL BOARD';

    // Admission & University Units
    if (upper == 'DU A' || upper == 'DU KA' || upper == 'DU_A') return 'DU A';
    if (upper == 'DU D' || upper == 'DU GHA' || upper == 'DU_D') return 'DU D';
    if (upper == 'DU B' || upper == 'DU KHA' || upper == 'DU_B') return 'DU B';
    if (upper == 'DU C' || upper == 'DU GA' || upper == 'DU_C') return 'DU C';
    if (upper == 'DU IBA' || upper == 'IBA') return 'DU IBA';
    if (upper == 'DU' || upper == 'DHAKA UNIVERSITY') return 'DU';
    if (upper == 'BUET') return 'BUET';
    if (upper == 'CKRUET') return 'CKRUET';
    if (upper == 'RUET') return 'RUET';
    if (upper == 'KUET') return 'KUET';
    if (upper == 'CUET') return 'CUET';
    if (upper == 'BUTEX') return 'BUTEX';
    if (upper == 'SUST') return 'SUST';
    if (upper == 'JU A' || upper == 'JU_A') return 'JU A';
    if (upper == 'JU D' || upper == 'JU_D') return 'JU D';
    if (upper == 'JU') return 'JU';
    if (upper == 'RU A' || upper == 'RU_A') return 'RU A';
    if (upper == 'RU C' || upper == 'RU_C') return 'RU C';
    if (upper == 'RU') return 'RU';
    if (upper == 'CU A' || upper == 'CU_A') return 'CU A';
    if (upper == 'CU D' || upper == 'CU_D') return 'CU D';
    if (upper == 'CU') return 'CU';
    if (upper == 'IUT') return 'IUT';
    if (upper == 'MIST') return 'MIST';
    if (upper == 'BUP') return 'BUP';
    if (upper == 'GST A' || upper == 'GST_A') return 'GST A';
    if (upper == 'GST') return 'GST';
    if (upper == 'AGRI GST' || upper == 'AGRI' || upper == 'AGRICULTURE') return 'AGRI GST';
    if (upper == 'DMC' || upper == 'MEDICAL' || upper == 'MAT') return 'DMC';
    if (upper == 'DAT' || upper == 'DENTAL') return 'DAT';
    if (upper == 'AFMC') return 'AFMC';
    if (upper == 'AMC') return 'AMC';

    // Authors standard canonical mapping
    if (trimmed.contains('মাজেদা')) return 'মাজেদা ম্যাম';
    if (trimmed.contains('আজমল')) return 'গাজী আজমল';
    if (trimmed.contains('হাসান') && !trimmed.contains('হোসেন')) return 'আবুল হাসান';
    if (trimmed.contains('হাজারী') || trimmed.contains('হাজারি')) return 'হাজারী নাগ';
    if (trimmed.contains('ইসহাক') || trimmed.contains('ইস Scrap')) return 'ইসহাক স্যার';
    if (trimmed.contains('তপন')) return 'তপন স্যার';
    if (trimmed.contains('কেতাব')) return 'কেতাব স্যার';
    if (trimmed.contains('আহাম্মদ') || trimmed.contains('আহমেদ')) return 'এস ইউ আহাম্মদ';
    if (trimmed.contains('অসীম')) return 'অসীম সাহা';
    if (trimmed.contains('গুহ')) return 'গুহ স্যার';
    if (trimmed.contains('লিংকন')) return 'লিংকন স্যার';
    if (trimmed.contains('কবির')) return 'কবির স্যার';

    return trimmed;
  }

  static String _formatYearShort(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return '';

    // If session format like 2014-2015 or 2014-15 or 14-15
    final sessionMatch =
        RegExp(r'(\d{2,4})\s*[-–/]\s*(\d{2,4})').firstMatch(trimmed);
    if (sessionMatch != null) {
      final y1 = sessionMatch.group(1)!;
      final y2 = sessionMatch.group(2)!;
      final s1 = y1.length == 4 ? y1.substring(2) : y1;
      final s2 = y2.length == 4 ? y2.substring(2) : y2;
      return '$s1-$s2';
    }

    // 4-digit year like 2017 -> 17
    if (RegExp(r'^\d{4}$').hasMatch(trimmed)) {
      return trimmed.substring(2);
    }

    return trimmed;
  }
}

enum SubjectCategoryType {
  compulsory,
  core,
  elective,
}
