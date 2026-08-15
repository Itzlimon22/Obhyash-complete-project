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
}
