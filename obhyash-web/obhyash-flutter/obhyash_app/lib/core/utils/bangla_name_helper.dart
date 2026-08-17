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
      final isAuthor = _isTextbookAuthor(raw);
      if (isAuthor) {
        tags.add(_normalizeInstituteOrAuthor(raw));
        continue;
      }

      // Check if raw already has embedded year digits (e.g. "DINAJPUR BOARD 22", "DB-24", "BUET 21-22")
      final embeddedYearMatch =
          RegExp(r'(\d{2,4}(?:\s*[-–/]\s*\d{2,4})?|\b\d{2}\b)').firstMatch(raw);
      String? embeddedYear;
      String cleanRaw = raw;
      if (embeddedYearMatch != null) {
        embeddedYear = _formatYearShort(embeddedYearMatch.group(0)!);
        cleanRaw = raw.replaceAll(embeddedYearMatch.group(0)!, '').trim();
      }

      final normalized =
          _normalizeInstituteOrAuthor(cleanRaw.isNotEmpty ? cleanRaw : raw);

      // Determine year to attach
      String? yearToUse;
      if (yearIdx < yrs.length) {
        yearToUse = yrs[yearIdx];
        yearIdx++;
      } else if (embeddedYear != null && embeddedYear.isNotEmpty) {
        yearToUse = embeddedYear;
      }

      if (yearToUse != null &&
          yearToUse.isNotEmpty &&
          !normalized.contains(yearToUse)) {
        tags.add('$normalized-$yearToUse');
      } else {
        tags.add(normalized);
      }
    }

    // If there are leftover unassigned years
    while (yearIdx < yrs.length) {
      if (tags.isEmpty) {
        tags.add(yrs[yearIdx]);
      } else {
        // If single tag without year, append with hyphen
        if (!tags.last.contains('-')) {
          tags[tags.length - 1] = '${tags.last}-${yrs[yearIdx]}';
        } else {
          tags.add(yrs[yearIdx]);
        }
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

    // Boards standard short codes (e.g. DB-24, DIN-22, RB-23)
    if (upper == 'DB' || upper == 'DHAKA' || upper.contains('DHAKA') || upper.contains('ঢাকা')) return 'DB';
    if (upper == 'DIN' || upper == 'DINAJ' || upper.contains('DINAJPUR') || upper.contains('দিনাজপুর')) return 'DIN';
    if (upper == 'RB' || upper == 'RAJ' || upper.contains('RAJSHAHI') || upper.contains('রাজশাহী')) return 'RB';
    if (upper == 'CB' || upper == 'CTG' || upper.contains('CHITTAGONG') || upper.contains('CHATTOGRAM') || upper.contains('চট্টগ্রাম')) return 'CB';
    if (upper == 'COMB' || upper == 'COM' || upper.contains('COMILLA') || upper.contains('CUMILLA') || upper.contains('কুমিল্লা')) return 'COM';
    if (upper == 'JB' || upper == 'JES' || upper.contains('JESSORE') || upper.contains('JASHORE') || upper.contains('যশোর')) return 'JB';
    if (upper == 'BB' || upper == 'BAR' || upper.contains('BARISAL') || upper.contains('BARISHAL') || upper.contains('বরিশাল')) return 'BB';
    if (upper == 'SB' || upper == 'SYL' || upper.contains('SYLHET') || upper.contains('সিলেট')) return 'SB';
    if (upper == 'MB' || upper == 'MYM' || upper.contains('MYMENSINGH') || upper.contains('ময়মনসিংহ')) return 'MB';
    if (upper == 'MAD' || upper.contains('MADRASAH') || upper.contains('মাদ্রাসা')) return 'MAD';
    if (upper == 'TEC' || upper.contains('TECHNICAL') || upper.contains('কারিগরি')) return 'TEC';
    if (upper == 'ALL' || upper.contains('ALL BOARD') || upper.contains('সকল বোর্ড')) return 'ALL';

    // Admission & University Units
    if (upper == 'DU A' || upper == 'DU KA' || upper == 'DU_A') return 'DU-A';
    if (upper == 'DU D' || upper == 'DU GHA' || upper == 'DU_D') return 'DU-D';
    if (upper == 'DU B' || upper == 'DU KHA' || upper == 'DU_B') return 'DU-B';
    if (upper == 'DU C' || upper == 'DU GA' || upper == 'DU_C') return 'DU-C';
    if (upper == 'DU IBA' || upper == 'IBA') return 'IBA';
    if (upper == 'DU' || upper == 'DHAKA UNIVERSITY') return 'DU';
    if (upper == 'BUET') return 'BUET';
    if (upper == 'CKRUET') return 'CKRUET';
    if (upper == 'RUET') return 'RUET';
    if (upper == 'KUET') return 'KUET';
    if (upper == 'CUET') return 'CUET';
    if (upper == 'BUTEX') return 'BUTEX';
    if (upper == 'SUST') return 'SUST';
    if (upper == 'JU A' || upper == 'JU_A') return 'JU-A';
    if (upper == 'JU D' || upper == 'JU_D') return 'JU-D';
    if (upper == 'JU') return 'JU';
    if (upper == 'RU A' || upper == 'RU_A') return 'RU-A';
    if (upper == 'RU C' || upper == 'RU_C') return 'RU-C';
    if (upper == 'RU') return 'RU';
    if (upper == 'CU A' || upper == 'CU_A') return 'CU-A';
    if (upper == 'CU D' || upper == 'CU_D') return 'CU-D';
    if (upper == 'CU') return 'CU';
    if (upper == 'IUT') return 'IUT';
    if (upper == 'MIST') return 'MIST';
    if (upper == 'BUP') return 'BUP';
    if (upper == 'GST A' || upper == 'GST_A') return 'GST-A';
    if (upper == 'GST') return 'GST';
    if (upper == 'AGRI GST' || upper == 'AGRI' || upper == 'AGRICULTURE') return 'AGRI';
    if (upper == 'DMC' || upper == 'MEDICAL' || upper == 'MAT') return 'MAT';
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

    // 4-digit year like 2024 -> 24
    if (RegExp(r'^\d{4}$').hasMatch(trimmed)) {
      return trimmed.substring(2);
    }

    // 2-digit year like 24 -> 24
    if (RegExp(r'^\d{2}$').hasMatch(trimmed)) {
      return trimmed;
    }

    // Bengali digits 4-digit (২০২৪ -> 24) or 2-digit (২৪ -> 24)
    final engDigits = trimmed
        .replaceAll('০', '0')
        .replaceAll('১', '1')
        .replaceAll('২', '2')
        .replaceAll('৩', '3')
        .replaceAll('৪', '4')
        .replaceAll('৫', '5')
        .replaceAll('৬', '6')
        .replaceAll('৭', '7')
        .replaceAll('৮', '8')
        .replaceAll('৯', '9');

    if (RegExp(r'^\d{4}$').hasMatch(engDigits)) {
      return engDigits.substring(2);
    }
    if (RegExp(r'^\d{2}$').hasMatch(engDigits)) {
      return engDigits;
    }

    return trimmed;
  }

  /// Returns all possible query variants (slugs, IDs, English names, Bengali names with Unicode variations)
  /// for a given subject to ensure database queries find all matching questions.
  static List<String> getSubjectSearchVariants(String subjectKey, String banglaName) {
    final variants = <String>{};
    if (subjectKey.trim().isNotEmpty) variants.add(subjectKey.trim());
    if (banglaName.trim().isNotEmpty) variants.add(banglaName.trim());

    // Stripped prefix (e.g. hsc_chemistry_1 -> chemistry_1)
    final rawKey = subjectKey
        .replaceAll('hsc_', '')
        .replaceAll('ssc_', '')
        .trim();
    if (rawKey.isNotEmpty) variants.add(rawKey);

    final lowerKey = subjectKey.toLowerCase();
    final lowerBangla = banglaName.toLowerCase();

    // Determine paper number
    final isPaper1 = lowerKey.contains('1') ||
        lowerKey.contains('first') ||
        lowerBangla.contains('১ম') ||
        lowerBangla.contains('১');
    final isPaper2 = lowerKey.contains('2') ||
        lowerKey.contains('second') ||
        lowerBangla.contains('২য়') ||
        lowerBangla.contains('২য়') ||
        lowerBangla.contains('২');

    // Science Subjects
    if (lowerKey.contains('physics') || lowerBangla.contains('পদার্থ')) {
      if (isPaper1) {
        variants.addAll([
          'hsc_physics_1', 'physics_1', 'physics1', 'physics 1',
          'Physics 1st Paper', 'পদার্থবিজ্ঞান ১ম পত্র', 'পদার্থবিজ্ঞান ১', 'পদার্থবিজ্ঞান ১ম',
        ]);
      } else if (isPaper2) {
        variants.addAll([
          'hsc_physics_2', 'physics_2', 'physics2', 'physics 2',
          'Physics 2nd Paper', 'পদার্থবিজ্ঞান ২য় পত্র', 'পদার্থবিজ্ঞান ২য় পত্র', 'পদার্থবিজ্ঞান ২',
        ]);
      } else {
        variants.addAll(['ssc_physics', 'physics', 'পদার্থবিজ্ঞান']);
      }
    } else if (lowerKey.contains('chem') || lowerBangla.contains('রসায়ন') || lowerBangla.contains('রসায়ন')) {
      if (isPaper1) {
        variants.addAll([
          'hsc_chemistry_1', 'chemistry_1', 'chemistry1', 'chemistry 1',
          'Chemistry 1st Paper', 'রসায়ন ১ম পত্র', 'রসায়ন ১ম পত্র', 'রসায়ন ১', 'রসায়ন ১',
        ]);
      } else if (isPaper2) {
        variants.addAll([
          'hsc_chemistry_2', 'chemistry_2', 'chemistry2', 'chemistry 2',
          'Chemistry 2nd Paper', 'রসায়ন ২য় পত্র', 'রসায়ন ২য় পত্র', 'রসায়ন ২', 'রসায়ন ২',
        ]);
      } else {
        variants.addAll(['ssc_chemistry', 'chemistry', 'রসায়ন', 'রসায়ন']);
      }
    } else if (lowerKey.contains('higher_math') || lowerBangla.contains('উচ্চতর গণিত')) {
      if (isPaper1) {
        variants.addAll([
          'hsc_higher_math_1', 'higher_math_1', 'higher_math1', 'higher_math 1',
          'math_1', 'math1', 'Higher Math 1st Paper', 'উচ্চতর গণিত ১ম পত্র', 'উচ্চতর গণিত ১',
        ]);
      } else if (isPaper2) {
        variants.addAll([
          'hsc_higher_math_2', 'higher_math_2', 'higher_math2', 'higher_math 2',
          'math_2', 'math2', 'Higher Math 2nd Paper', 'উচ্চতর গণিত ২য় পত্র', 'উচ্চতর গণিত ২য় পত্র', 'উচ্চতর গণিত ২',
        ]);
      } else {
        variants.addAll(['ssc_higher_math', 'higher_math', 'উচ্চতর গণিত']);
      }
    } else if (lowerKey.contains('math') || lowerBangla.contains('গণিত')) {
      if (isPaper1) {
        variants.addAll([
          'hsc_higher_math_1', 'higher_math_1', 'math_1', 'math1', 'math 1',
          'Higher Math 1st Paper', 'উচ্চতর গণিত ১ম পত্র', 'গণিত ১ম পত্র', 'গণিত ১',
        ]);
      } else if (isPaper2) {
        variants.addAll([
          'hsc_higher_math_2', 'higher_math_2', 'math_2', 'math2', 'math 2',
          'Higher Math 2nd Paper', 'উচ্চতর গণিত ২য় পত্র', 'উচ্চতর গণিত ২য় পত্র', 'গণিত ২য় পত্র', 'গণিত ২',
        ]);
      } else {
        variants.addAll(['ssc_general_math', 'math', 'general_math', 'গণিত', 'সাধারণ গণিত']);
      }
    } else if (lowerKey.contains('bio') || lowerKey.contains('botany') || lowerKey.contains('zoology') || lowerBangla.contains('জীববিজ্ঞান') || lowerBangla.contains('উদ্ভিদ') || lowerBangla.contains('প্রাণি')) {
      if (isPaper1 || lowerKey.contains('botany') || lowerBangla.contains('উদ্ভিদ')) {
        variants.addAll([
          'hsc_biology_1', 'biology_1', 'biology1', 'botany', 'hsc_botany',
          'Biology 1st Paper', 'জীববিজ্ঞান ১ম পত্র', 'জীববিজ্ঞান ১', 'উদ্ভিদবিজ্ঞান', 'উদ্ভিদ বিজ্ঞান',
        ]);
      } else if (isPaper2 || lowerKey.contains('zoology') || lowerBangla.contains('প্রাণি')) {
        variants.addAll([
          'hsc_biology_2', 'biology_2', 'biology2', 'zoology', 'hsc_zoology',
          'Biology 2nd Paper', 'জীববিজ্ঞান ২য় পত্র', 'জীববিজ্ঞান ২য় পত্র', 'জীববিজ্ঞান ২', 'প্রাণিবিজ্ঞান', 'প্রাণীবিজ্ঞান',
        ]);
      } else {
        variants.addAll(['ssc_biology', 'biology', 'জীববিজ্ঞান']);
      }
    } else if (lowerKey.contains('ict') || lowerBangla.contains('তথ্য') || lowerBangla.contains('আইসিটি')) {
      variants.addAll(['hsc_ict', 'ssc_ict', 'ict', 'তথ্য ও যোগাযোগ প্রযুক্তি', 'আইসিটি']);
    } else if (lowerKey.contains('bangla') || lowerBangla.contains('বাংলা')) {
      if (isPaper1) {
        variants.addAll([
          'hsc_bangla_1', 'bangla_1', 'bangla1', 'bangla 1',
          'Bangla 1st Paper', 'বাংলা ১ম পত্র', 'বাংলা ১',
        ]);
      } else if (isPaper2) {
        variants.addAll([
          'hsc_bangla_2', 'bangla_2', 'bangla2', 'bangla 2',
          'Bangla 2nd Paper', 'বাংলা ২য় পত্র', 'বাংলা ২য় পত্র', 'বাংলা ২',
        ]);
      } else {
        variants.addAll(['ssc_bangla', 'bangla', 'বাংলা']);
      }
    } else if (lowerKey.contains('english') || lowerBangla.contains('ইংরেজি')) {
      if (isPaper1) {
        variants.addAll([
          'hsc_english_1', 'english_1', 'english1', 'english 1',
          'English 1st Paper', 'ইংরেজি ১ম পত্র', 'ইংরেজি ১',
        ]);
      } else if (isPaper2) {
        variants.addAll([
          'hsc_english_2', 'english_2', 'english2', 'english 2',
          'English 2nd Paper', 'ইংরেজি ২য় পত্র', 'ইংরেজি ২য় পত্র', 'ইংরেজি ২',
        ]);
      } else {
        variants.addAll(['ssc_english', 'english', 'ইংরেজি']);
      }
    }

    // Unicode variants for য় vs য+় and ২য় vs ২য়
    final extra = <String>[];
    for (final v in variants) {
      extra.add(v.replaceAll('\u09df', '\u09af\u09bc'));
      extra.add(v.replaceAll('\u09af\u09bc', '\u09df'));
      extra.add(v.replaceAll('২য়', '২য়'));
      extra.add(v.replaceAll('২য়', '২য়'));
      extra.add(v.replaceAll('১ম', '১ম'));
    }
    variants.addAll(extra);

    return variants.where((s) => s.trim().isNotEmpty).toList();
  }

  /// Returns canonical academic sorting priority (10..200) for standard subject hierarchy.
  static int getSubjectSortPriority(String name, [String? id]) {
    final l = '$name ${id ?? ''}'.toLowerCase();
    int base = 200;

    if (l.contains('bangla') || l.contains('বাংলা')) {
      base = 10;
    } else if (l.contains('english') || l.contains('ইংরেজি')) {
      base = 20;
    } else if (l.contains('ict') ||
        l.contains('তথ্য') ||
        l.contains('information')) {
      base = 30;
    } else if (l.contains('physics') || l.contains('পদার্থ')) {
      base = 40;
    } else if (l.contains('chemistry') ||
        l.contains('chem') ||
        l.contains('রসায়ন') ||
        l.contains('রসায়ন')) {
      base = 50;
    } else if (l.contains('higher_math') || l.contains('উচ্চতর গণিত')) {
      base = 60;
    } else if (l.contains('math') || l.contains('গণিত')) {
      base = 65;
    } else if (l.contains('biology') ||
        l.contains('botany') ||
        l.contains('zoology') ||
        l.contains('জীববিজ্ঞান') ||
        l.contains('উদ্ভিদ') ||
        l.contains('প্রাণি')) {
      base = 70;
    } else if (l.contains('statistics') || l.contains('পরিসংখ্যান')) {
      base = 75;
    } else if (l.contains('accounting') || l.contains('হিসাব')) {
      base = 80;
    } else if (l.contains('management') ||
        l.contains('ব্যবস্থাপনা') ||
        l.contains('ব্যবসায় সংগঠন')) {
      base = 82;
    } else if (l.contains('finance') ||
        l.contains('ফিন্যান্স') ||
        l.contains('ব্যাংকিং')) {
      base = 84;
    } else if (l.contains('marketing') ||
        l.contains('বিপণন') ||
        l.contains('উৎপাদন ব্যবস্থাপনা')) {
      base = 86;
    } else if (l.contains('economics') || l.contains('অর্থনীতি')) {
      base = 88;
    } else if (l.contains('civics') || l.contains('পৌরনীতি')) {
      base = 90;
    } else if (l.contains('history') || l.contains('ইতিহাস')) {
      base = 92;
    } else if (l.contains('islamic') || l.contains('ইসলামের ইতিহাস')) {
      base = 94;
    } else if (l.contains('logic') || l.contains('যুক্তিবিদ্যা')) {
      base = 96;
    } else if (l.contains('sociology') || l.contains('সমাজবিজ্ঞান')) {
      base = 98;
    } else if (l.contains('social_work') || l.contains('সমাজকর্ম')) {
      base = 100;
    } else if (l.contains('geography') || l.contains('ভূগোল')) {
      base = 102;
    } else if (l.contains('science') || l.contains('বিজ্ঞান')) {
      base = 110;
    } else if (l.contains('bgs') || l.contains('বিশ্বপরিচয়')) {
      base = 112;
    } else if (l.contains('agriculture') || l.contains('কৃষি')) {
      base = 114;
    }

    // 1st paper comes before 2nd paper
    if (l.contains('2nd') ||
        l.contains('_2') ||
        l.contains('২য়') ||
        l.contains('২য়') ||
        l.contains('zoology') ||
        l.contains('প্রাণি') ||
        l.contains('২') ||
        l.contains('paper 2')) {
      return base + 1;
    }
    return base;
  }

  /// Returns all search variants for a chapter name (handling punctuation, conjunctions, prefixes, and Unicode)
  static List<String> getChapterSearchVariants(String chapterName) {
    final variants = <String>{};
    final trimmed = chapterName.trim();
    if (trimmed.isEmpty) return [];

    variants.add(trimmed);

    // Stripped prefixes like "১ম অধ্যায়: ", "Chapter 1: ", "1. "
    final strippedPrefix = trimmed
        .replaceAll(RegExp(r'^(?:[০-৯0-9]+[ম্থর্থশষ্ঠতম]*\s*অধ্যায়\s*[:\-–—\.]\s*|অধ্যায়\s*[০-৯0-9]+\s*[:\-–—\.]\s*|Chapter\s*[0-9]+\s*[:\-–—\.]\s*|[0-9০-৯]+[\.\:\-–—]\s*)', caseSensitive: false), '')
        .trim();
    if (strippedPrefix.isNotEmpty) {
      variants.add(strippedPrefix);
    }

    // Punctuation variants: with/without commas, dashes, colons, conjunctions
    for (final v in variants.toList()) {
      variants.add(v.replaceAll(',', ''));
      variants.add(v.replaceAll(',', ' '));
      variants.add(v.replaceAll('  ', ' ').trim());
      variants.add(v.replaceAll(' ও ', ' এবং '));
      variants.add(v.replaceAll(' এবং ', ' ও '));
      variants.add(v.replaceAll(' ও ', ' '));
      variants.add(v.replaceAll(' এবং ', ' '));
    }

    // Canonical keywords mapping for all HSC/SSC subjects & chapters:
    final raw = trimmed.toLowerCase();

    // Physics 1st Paper
    if (raw.contains('ভৌত') && (raw.contains('জগত') || raw.contains('জগৎ') || raw.contains('পরিমাপ'))) {
      variants.addAll([
        'ভৌতজগত ও পরিমাপ', 'ভৌত জগৎ ও পরিমাপ', 'ভৌতজগত', 'ভৌত জগৎ',
        'ভৌতজগৎ ও পরিমাপ', 'ভৌতজগৎ',
      ]);
    } else if (raw.contains('ভেক্টর')) {
      variants.addAll(['ভেক্টর', 'Vector']);
    } else if (raw.contains('গতিবিদ্যা')) {
      variants.addAll(['গতিবিদ্যা', 'Dynamics', 'Motion']);
    } else if (raw.contains('নিউটন') || (raw.contains('বলবিদ্যা') && !raw.contains('স্থিতিবিদ্যা'))) {
      variants.addAll([
        'নিউটনিয়ান বলবিদ্যা', 'নিউটনিয়ান বলবিদ্যা', 'বলবিদ্যা',
        'নিউটনীয় বলবিদ্যা', 'নিউটনীয় বলবিদ্যা',
      ]);
    } else if (raw.contains('কাজ') && (raw.contains('শক্তি') || raw.contains('ক্ষমতা'))) {
      variants.addAll([
        'কাজ, শক্তি ও ক্ষমতা', 'কাজ, শক্তি এবং ক্ষমতা', 'কাজ শক্তি ও ক্ষমতা',
        'কাজ শক্তি এবং ক্ষমতা', 'কাজ, শক্তি', 'কাজ ও শক্তি', 'কাজ শক্তি',
        'কাজ,শক্তি ও ক্ষমতা', 'কাজ,শক্তি এবং ক্ষমতা',
      ]);
    } else if (raw.contains('মহাকর্ষ')) {
      variants.addAll(['মহাকর্ষ ও অভিকর্ষ', 'মহাকর্ষ', 'মহাকর্ষ এবং অভিকর্ষ']);
    } else if (raw.contains('গাঠনিক ধর্ম')) {
      variants.addAll(['পদার্থের গাঠনিক ধর্ম', 'গাঠনিক ধর্ম']);
    } else if (raw.contains('পর্যায়বৃত্ত') || raw.contains('পর্যায়বৃত্ত')) {
      variants.addAll(['পর্যায়বৃত্ত গতি', 'পর্যায়বৃত্ত গতি']);
    } else if (raw.contains('তরঙ্গ')) {
      variants.addAll(['তরঙ্গ', 'শব্দ ও তরঙ্গ']);
    } else if (raw.contains('আদর্শ গ্যাস') || raw.contains('গতিতত্ত্ব')) {
      variants.addAll(['আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব', 'আদর্শ গ্যাস', 'গ্যাসের গতিতত্ত্ব']);
    }

    // Physics 2nd Paper
    else if (raw.contains('তাপগতিবিদ্যা')) {
      variants.addAll(['তাপগতিবিদ্যা', 'Thermodynamics']);
    } else if (raw.contains('স্থির') && (raw.contains('তড়িৎ') || raw.contains('তড়িৎ'))) {
      variants.addAll(['স্থির তড়িৎ', 'স্থির তড়িৎ', 'স্থির বিদ্যুৎ']);
    } else if (raw.contains('চল') && (raw.contains('তড়িৎ') || raw.contains('তড়িৎ'))) {
      variants.addAll(['চল তড়িৎ', 'চল তড়িৎ', 'চল বিদ্যুৎ']);
    } else if (raw.contains('চৌম্বক ক্রিয়া') || raw.contains('চৌম্বক ক্রিয়া') || raw.contains('চুম্বকত্ব')) {
      variants.addAll([
        'তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব', 'তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব',
        'চৌম্বক ক্রিয়া ও চুম্বকত্ব', 'চৌম্বক ক্রিয়া ও চুম্বকত্ব', 'চুম্বকত্ব',
      ]);
    } else if (raw.contains('তাড়িতচৌম্বক') || raw.contains('তাড়িতচৌম্বক') || raw.contains('আবেশ')) {
      variants.addAll([
        'তাড়িতচৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ', 'তাড়িতচৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ',
        'তাড়িতচৌম্বক আবেশ', 'তাড়িতচৌম্বক আবেশ',
      ]);
    } else if (raw.contains('জ্যামিতিক আলোক')) {
      variants.addAll(['জ্যামিতিক আলোকবিজ্ঞান', 'জ্যামিতিক আলোক']);
    } else if (raw.contains('ভৌত আলোক')) {
      variants.addAll(['ভৌত আলোকবিজ্ঞান', 'ভৌত আলোক']);
    } else if (raw.contains('আধুনিক পদার্থবিজ্ঞান')) {
      variants.addAll(['আধুনিক পদার্থবিজ্ঞানের সূচনা', 'আধুনিক পদার্থবিজ্ঞান']);
    } else if (raw.contains('পরমাণুর মডেল') || raw.contains('নিউক্লিয়ার') || raw.contains('নিউক্লিয়ার')) {
      variants.addAll([
        'পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান', 'পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান',
        'পরমাণুর মডেল', 'নিউক্লিয়ার পদার্থবিজ্ঞান',
      ]);
    } else if (raw.contains('সেমিকন্ডাক্টর') || raw.contains('ইলেকট্রনিক্স')) {
      variants.addAll([
        'সেমিকন্ডাক্টর ও ইলেকট্রনিক্স', 'সেমিকন্ডাক্টর এবং ইলেকট্রনিক্স', 'সেমিকন্ডাক্টর', 'ইলেকট্রনিক্স',
      ]);
    } else if (raw.contains('জ্যোতির্বিজ্ঞান') || raw.contains('জ্যোতির্বিদ্যা')) {
      variants.addAll(['জ্যোতির্বিজ্ঞান', 'জ্যোতির্বিদ্যা']);
    }

    // Chemistry 1st Paper
    else if (raw.contains('ল্যাবরেটরি') || raw.contains('নিরাপদ ব্যবহার')) {
      variants.addAll(['ল্যাবরেটরির নিরাপদ ব্যবহার', 'ল্যাবরেটরি']);
    } else if (raw.contains('গুণগত') || raw.contains('গুনগত')) {
      variants.addAll(['গুণগত রসায়ন', 'গুনগত রসায়ন', 'গুণগত রসায়ন', 'গুনগত রসায়ন']);
    } else if (raw.contains('মৌলের পর্যায়বৃত্ত') || raw.contains('পর্যায়বৃত্ত ধর্ম') || raw.contains('রাসায়নিক বন্ধন')) {
      variants.addAll([
        'মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন', 'মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন',
        'পর্যায়বৃত্ত ধর্ম', 'রাসায়নিক বন্ধন',
      ]);
    } else if (raw.contains('রাসায়নিক পরিবর্তন') || raw.contains('রাসায়নিক পরিবর্তন')) {
      variants.addAll(['রাসায়নিক পরিবর্তন', 'রাসায়নিক পরিবর্তন']);
    } else if (raw.contains('কর্মমুখী')) {
      variants.addAll(['কর্মমুখী রসায়ন', 'কর্মমুখী রসায়ন']);
    }

    // Chemistry 2nd Paper
    else if (raw.contains('পরিবেশ রসায়ন') || raw.contains('পরিবেশ রসায়ন')) {
      variants.addAll(['পরিবেশ রসায়ন', 'পরিবেশ রসায়ন']);
    } else if (raw.contains('জৈব')) {
      variants.addAll(['জৈব যৌগ', 'জৈব রসায়ন', 'জৈব রসায়ন']);
    } else if (raw.contains('পরিমাণগত') || raw.contains('পরিমানগত')) {
      variants.addAll(['পরিমাণগত রসায়ন', 'পরিমানগত রসায়ন', 'পরিমাণগত রসায়ন', 'পরিমানগত রসায়ন']);
    } else if (raw.contains('তড়িৎ রসায়ন') || raw.contains('তড়িৎ রসায়ন') || raw.contains('তড়িৎ রসায়ন') || raw.contains('তড়িৎ রসায়ন')) {
      variants.addAll(['তড়িৎ রসায়ন', 'তড়িৎ রসায়ন', 'তড়িৎ রসায়ন', 'তড়িৎ রসায়ন']);
    } else if (raw.contains('অর্থনৈতিক রসায়ন') || raw.contains('অর্থনৈতিক রসায়ন')) {
      variants.addAll(['অর্থনৈতিক রসায়ন', 'অর্থনৈতিক রসায়ন']);
    }

    // Higher Math 1st Paper
    else if (raw.contains('ম্যাট্রিক্স') || raw.contains('নির্ণায়ক') || raw.contains('নির্ণায়ক')) {
      variants.addAll(['ম্যাট্রিক্স ও নির্ণায়ক', 'ম্যাট্রিক্স ও নির্ণায়ক', 'ম্যাট্রিক্স', 'নির্ণায়ক', 'নির্ণায়ক']);
    } else if (raw.contains('সরলরেখা')) {
      variants.addAll(['সরলরেখা', 'Straight Line']);
    } else if (raw.contains('বৃত্ত')) {
      variants.addAll(['বৃত্ত', 'Circle']);
    } else if (raw.contains('বিন্যাস') || raw.contains('সমাবেশ')) {
      variants.addAll(['বিন্যাস ও সমাবেশ', 'বিন্যাস এবং সমাবেশ', 'বিন্যাস', 'সমাবেশ']);
    } else if (raw.contains('ত্রিকোণমিতি') || raw.contains('সংযুক্ত কোণ')) {
      variants.addAll([
        'সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত', 'ত্রিকোণমিতিক অনুপাত', 'ত্রিকোণমিতি',
        'ত্রিকোণমিতিক অনুপাতসমূহ',
      ]);
    } else if (raw.contains('ফাংশন ও ফাংশনের লেখচিত্র') || raw.contains('ফাংশনের লেখচিত্র')) {
      variants.addAll(['ফাংশন ও ফাংশনের লেখচিত্র', 'ফাংশন', 'লেখচিত্র']);
    } else if (raw.contains('অন্তরীকরণ') || raw.contains('ব্যবকলন')) {
      variants.addAll(['অন্তরীকরণ', 'ব্যবকলন', 'Differentiation']);
    } else if (raw.contains('যোগজীকরণ') || raw.contains('সমাকলন')) {
      variants.addAll(['যোগজীকরণ', 'সমাকলন', 'Integration']);
    }

    // Higher Math 2nd Paper
    else if (raw.contains('বাস্তব সংখ্যা') || raw.contains('অসমতা')) {
      variants.addAll(['বাস্তব সংখ্যা ও অসমতা', 'বাস্তব সংখ্যা', 'অসমতা']);
    } else if (raw.contains('যোগাশ্রয়ী') || raw.contains('যোগাশ্রয়ী')) {
      variants.addAll(['যোগাশ্রয়ী প্রোগ্রামিং', 'যোগাশ্রয়ী প্রোগ্রামিং', 'যোগাশ্রয়ী প্রোগ্রাম']);
    } else if (raw.contains('জটিল সংখ্যা')) {
      variants.addAll(['জটিল সংখ্যা', 'Complex Numbers']);
    } else if (raw.contains('বহুপদী')) {
      variants.addAll(['বহুপদী ও বহুপদী সমীকরণ', 'বহুপদী']);
    } else if (raw.contains('দ্বিপদী')) {
      variants.addAll(['দ্বিপদী বিস্তৃতি', 'দ্বিপদী']);
    } else if (raw.contains('কণিক') || raw.contains('কনিক')) {
      variants.addAll(['কণিক', 'কনিক', 'Conics']);
    } else if (raw.contains('বিপরীত ত্রিকোণমিতিক') || raw.contains('ত্রিকোণমিতিক সমীকরণ')) {
      variants.addAll([
        'বিপরীত ত্রিকোণমিতিক ফাংশন ও ত্রিকোণমিতিক সমীকরণ',
        'বিপরীত ত্রিকোণমিতিক ফাংশন', 'বিপরীত ত্রিকোণমিতি',
      ]);
    } else if (raw.contains('স্থিতিবিদ্যা')) {
      variants.addAll(['স্থিতিবিদ্যা', 'Statics']);
    } else if (raw.contains('বস্তুকণার গতি') || raw.contains('সমতলে বস্তুকণার গতি')) {
      variants.addAll(['সমতলে বস্তুকণার গতি', 'বস্তুকণার গতি', 'দ্বিমাত্রিক গতি']);
    } else if (raw.contains('বিস্তার পরিমাপ') || raw.contains('সম্ভাবনা')) {
      variants.addAll(['বিস্তার পরিমাপ ও সম্ভাবনা', 'সম্ভাবনা', 'বিস্তার পরিমাপ']);
    }

    // Biology 1st Paper (Botany)
    else if (raw.contains('কোষ ও এর গঠন') || raw.contains('কোষের গঠন')) {
      variants.addAll(['কোষ ও এর গঠন', 'কোষের গঠন', 'কোষ ও তার গঠন']);
    } else if (raw.contains('কোষ বিভাজন')) {
      variants.addAll(['কোষ বিভাজন', 'Cell Division']);
    } else if (raw.contains('কোষ রসায়ন') || raw.contains('কোষ রসায়ন')) {
      variants.addAll(['কোষ রসায়ন', 'কোষ রসায়ন']);
    } else if (raw.contains('অণুজীব') || raw.contains('অনুজীব')) {
      variants.addAll(['অণুজীব', 'অনুজীব', 'Microbiology']);
    } else if (raw.contains('শৈবাল') || raw.contains('ছত্রাক')) {
      variants.addAll(['শৈবাল ও ছত্রাক', 'শৈবাল এবং ছত্রাক', 'শৈবাল', 'ছত্রাক']);
    } else if (raw.contains('ব্রায়োফাইটা') || raw.contains('টেরিডোফাইটা') || raw.contains('ব্রায়োফাইটা')) {
      variants.addAll(['ব্রায়োফাইটা ও টেরিডোফাইটা', 'ব্রায়োফাইটা ও টেরিডোফাইটা', 'ব্রায়োফাইটা', 'টেরিডোফাইটা']);
    } else if (raw.contains('নগ্নবীজী') || raw.contains('আবৃতবীজী')) {
      variants.addAll(['নগ্নবীজী ও আবৃতবীজী উদ্ভিদ', 'নগ্নবীজী ও আবৃতবীজী', 'নগ্নবীজী', 'আবৃতবীজী']);
    } else if (raw.contains('টিস্যু') || raw.contains('টিস্যুতন্ত্র')) {
      variants.addAll(['টিস্যু ও টিস্যুতন্ত্র', 'টিস্যুতন্ত্র', 'টিস্যু']);
    } else if (raw.contains('উদ্ভিদ শারীরতত্ত্ব')) {
      variants.addAll(['উদ্ভিদ শারীরতত্ত্ব', 'উদ্ভিদের শারীরতত্ত্ব']);
    } else if (raw.contains('উদ্ভিদ প্রজনন')) {
      variants.addAll(['উদ্ভিদ প্রজনন', 'প্রজনন']);
    } else if (raw.contains('জীবপ্রযুক্তি') || raw.contains('বায়োটেকনোলজি')) {
      variants.addAll(['জীবপ্রযুক্তি', 'বায়োটেকনোলজি', 'বায়োপ্রযুক্তি']);
    } else if (raw.contains('জীবের পরিবেশ') || raw.contains('বিস্তার ও সংরক্ষণ')) {
      variants.addAll(['জীবের পরিবেশ, বিস্তার ও সংরক্ষণ', 'জীবের পরিবেশ', 'বিস্তার ও সংরক্ষণ']);
    }

    // Biology 2nd Paper (Zoology)
    else if (raw.contains('প্রাণীর বিভিন্নতা') || raw.contains('শ্রেণিবিন্যাস') || raw.contains('শ্রেণি বিন্যাস')) {
      variants.addAll([
        'প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস', 'প্রাণীর বিভিন্নতা ও শ্রেণীবিন্যাস',
        'প্রাণীর বিভিন্নতা', 'শ্রেণিবিন্যাস', 'শ্রেণীবিন্যাস',
      ]);
    } else if (raw.contains('প্রাণীর পরিচিতি') || raw.contains('হাইড্রা') || raw.contains('ঘাসফড়িং') || raw.contains('রুই মাছ')) {
      variants.addAll(['প্রাণীর পরিচিতি', 'হাইড্রা', 'ঘাসফড়িং', 'রুই মাছ']);
    } else if (raw.contains('পরিপাক') || raw.contains('শোষণ')) {
      variants.addAll(['মানব শারীরতত্ত্ব: পরিপাক ও শোষণ', 'পরিপাক ও শোষণ', 'পরিপাক']);
    } else if (raw.contains('রক্ত') || raw.contains('সংবহন')) {
      variants.addAll(['মানব শারীরতত্ত্ব: রক্ত ও সংবহন', 'রক্ত ও সংবহন', 'রক্ত সংবহন']);
    } else if (raw.contains('শ্বাসক্রিয়া') || raw.contains('শ্বাসক্রিয়া') || raw.contains('শ্বসন')) {
      variants.addAll([
        'মানব শারীরতত্ত্ব: শ্বাসক্রিয়া ও শ্বসন', 'মানব শারীরতত্ত্ব: শ্বাসক্রিয়া ও শ্বসন',
        'শ্বাসক্রিয়া ও শ্বসন', 'শ্বাসক্রিয়া ও শ্বসন', 'শ্বসন',
      ]);
    } else if (raw.contains('বর্জ্য') || raw.contains('নিষ্কাশন')) {
      variants.addAll(['মানব শারীরতত্ত্ব: বর্জ্য ও নিষ্কাশন', 'বর্জ্য ও নিষ্কাশন', 'বর্জ্য নিষ্কাশন', 'রেচন']);
    } else if (raw.contains('চলন') || raw.contains('অঙ্গচালনা') || raw.contains('অস্থি')) {
      variants.addAll(['মানব শারীরতত্ত্ব: চলন ও অঙ্গচালনা', 'চলন ও অঙ্গচালনা', 'অস্থি ও চলন']);
    } else if (raw.contains('সমন্বয়') || raw.contains('সমন্বয়') || raw.contains('নিয়ন্ত্রণ') || raw.contains('নিয়ন্ত্রণ')) {
      variants.addAll([
        'মানব শারীরতত্ত্ব: সমন্বয় ও নিয়ন্ত্রণ', 'মানব শারীরতত্ত্ব: সমন্বয় ও নিয়ন্ত্রণ',
        'সমন্বয় ও নিয়ন্ত্রণ', 'সমন্বয় ও নিয়ন্ত্রণ', 'হরমোন',
      ]);
    } else if (raw.contains('মানব জীবনের ধারাবাহিকতা') || raw.contains('প্রজনন তন্ত্র')) {
      variants.addAll(['মানব জীবনের ধারাবাহিকতা', 'মানব জীবনের ধারাবাহিকতা ও প্রজনন']);
    } else if (raw.contains('মানবদেহের প্রতিরক্ষা') || raw.contains('ইমিউনিটি') || raw.contains('প্রতিরক্ষা')) {
      variants.addAll(['মানবদেহের প্রতিরক্ষা', 'ইমিউনিটি', 'প্রতিরক্ষা']);
    } else if (raw.contains('জিনতত্ত্ব') || raw.contains('বিবর্তন')) {
      variants.addAll(['জিনতত্ত্ব ও বিবর্তন', 'জিনতত্ত্ব এবং বিবর্তন', 'জিনতত্ত্ব', 'বিবর্তন']);
    } else if (raw.contains('প্রাণীর আচরণ') || raw.contains('আচরণ')) {
      variants.addAll(['প্রাণীর আচরণ', 'আচরণ']);
    }

    // ICT
    else if (raw.contains('বিশ্ব ও বাংলাদেশ') || raw.contains('প্রেক্ষিত') || raw.contains('প্রেক্ষাপট')) {
      variants.addAll([
        'তথ্য ও যোগাযোগ প্রযুক্তি: বিশ্ব ও বাংলাদেশ প্রেক্ষিত',
        'বিশ্ব ও বাংলাদেশ প্রেক্ষিত', 'বিশ্ব ও বাংলাদেশ প্রেক্ষাপট',
      ]);
    } else if (raw.contains('কমিউনিকেশন') || raw.contains('নেটওয়ার্কিং') || raw.contains('নেটওয়ার্কিং')) {
      variants.addAll([
        'কমিউনিকেশন সিস্টেমস ও নেটওয়ার্কিং', 'কমিউনিকেশন সিস্টেমস ও নেটওয়ার্কিং',
        'কমিউনিকেশন সিস্টেম ও নেটওয়ার্কিং', 'কমিউনিকেশন সিস্টেম', 'নেটওয়ার্কিং', 'নেটওয়ার্কিং',
      ]);
    } else if (raw.contains('সংখ্যা পদ্ধতি') || raw.contains('ডিজিটাল ডিভাইস')) {
      variants.addAll([
        'সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস', 'সংখ্যা পদ্ধতি এবং ডিজিটাল ডিভাইস',
        'সংখ্যা পদ্ধতি', 'ডিজিটাল ডিভাইস',
      ]);
    } else if (raw.contains('ওয়েব ডিজাইন') || raw.contains('html') || raw.contains('এইচটিএমএল')) {
      variants.addAll([
        'ওয়েব ডিজাইন পরিচিতি এবং HTML', 'ওয়েব ডিজাইন পরিচিতি ও HTML',
        'ওয়েব ডিজাইন ও HTML', 'ওয়েব ডিজাইন', 'HTML', 'এইচটিএমএল',
      ]);
    } else if (raw.contains('প্রোগ্রামিং ভাষা') || raw.contains('সি প্রোগ্রামিং') || raw.contains('c প্রোগ্রামিং')) {
      variants.addAll([
        'প্রোগ্রামিং ভাষা', 'প্রোগ্রামিং ল্যাঙ্গুয়েজ', 'সি প্রোগ্রামিং', 'C প্রোগ্রামিং', 'প্রোগ্রামিং',
      ]);
    } else if (raw.contains('ডেটাবেজ') || raw.contains('ডাটাবেজ') || raw.contains('dbms')) {
      variants.addAll([
        'ডেটাবেজ ম্যানেজমেন্ট সিস্টেম', 'ডাটাবেজ ম্যানেজমেন্ট সিস্টেম',
        'ডেটাবেজ', 'ডাটাবেজ', 'DBMS',
      ]);
    }

    // Unicode variants for য় vs য+়
    final extra = <String>[];
    for (final v in variants) {
      extra.add(v.replaceAll('\u09df', '\u09af\u09bc'));
      extra.add(v.replaceAll('\u09af\u09bc', '\u09df'));
    }
    variants.addAll(extra);

    return variants.where((s) => s.trim().isNotEmpty).toList();
  }
}

enum SubjectCategoryType {
  compulsory,
  core,
  elective,
}
