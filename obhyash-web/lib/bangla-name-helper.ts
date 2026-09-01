export type SubjectCategoryType = 'compulsory' | 'core' | 'elective';

export interface UserProfileTarget {
  examTarget?: string;
  exam_target?: string;
  target?: string;
  level?: string;
  division?: string;
  optionalSubject?: string;
  optional_subject?: string;
  isPro?: boolean;
}

export class BanglaNameHelper {
  /**
   * Converts any subject identifier, slug, or label to standard Bengali.
   */
  static formatSubject(subject?: string, subjectLabel?: string): string {
    if (subjectLabel && this._hasBengali(subjectLabel)) {
      return subjectLabel.trim();
    }

    const raw = (subjectLabel?.trim() ? subjectLabel : (subject ?? '')).trim();
    if (!raw) return 'পরীক্ষা';

    if (this._hasBengali(raw)) {
      return raw;
    }

    const lower = raw.toLowerCase().replace(/-/g, '_');

    if (lower.includes('physics') || lower.includes('phy') || lower.startsWith('hsc_phy')) {
      if (lower.includes('1st') || lower.includes('_1') || lower.includes('first') || lower.endsWith('1')) return 'পদার্থবিজ্ঞান ১ম পত্র';
      if (lower.includes('2nd') || lower.includes('_2') || lower.includes('second') || lower.endsWith('2')) return 'পদার্থবিজ্ঞান ২য় পত্র';
      return 'পদার্থবিজ্ঞান';
    }

    if (lower.includes('chemistry') || lower.includes('chem') || lower.startsWith('hsc_chem')) {
      if (lower.includes('1st') || lower.includes('_1') || lower.includes('first') || lower.endsWith('1')) return 'রসায়ন ১ম পত্র';
      if (lower.includes('2nd') || lower.includes('_2') || lower.includes('second') || lower.endsWith('2')) return 'রসায়ন ২য় পত্র';
      return 'রসায়ন';
    }

    if (lower.includes('higher_math') || lower.includes('highermath') || lower.includes('h_math') || lower.includes('hmath') || lower.startsWith('hsc_hm')) {
      if (lower.includes('1st') || lower.includes('_1') || lower.includes('first') || lower.endsWith('1')) return 'উচ্চতর গণিত ১ম পত্র';
      if (lower.includes('2nd') || lower.includes('_2') || lower.includes('second') || lower.endsWith('2')) return 'উচ্চতর গণিত ২য় পত্র';
      return 'উচ্চতর গণিত';
    }

    if (lower.includes('math') || lower.includes('mathematics')) {
      if (lower.includes('1st') || lower.includes('_1') || lower.includes('first') || lower.endsWith('1')) return 'উচ্চতর গণিত ১ম পত্র';
      if (lower.includes('2nd') || lower.includes('_2') || lower.includes('second') || lower.endsWith('2')) return 'উচ্চতর গণিত ২য় পত্র';
      if (lower.includes('general')) return 'সাধারণ গণিত';
      return 'উচ্চতর গণিত';
    }

    if (lower.includes('biology') || lower.includes('botany') || lower.includes('zoology') || lower.includes('bio') || lower.startsWith('hsc_bio')) {
      if (lower.includes('1st') || lower.includes('_1') || lower.includes('botany') || lower.includes('first') || lower.endsWith('1')) {
        return 'জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)';
      }
      if (lower.includes('2nd') || lower.includes('_2') || lower.includes('zoology') || lower.includes('second') || lower.endsWith('2')) {
        return 'জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)';
      }
      return 'জীববিজ্ঞান';
    }

    if (lower.includes('bangla') || lower.includes('bengali')) {
      if (lower.includes('1st') || lower.includes('_1') || lower.includes('first')) return 'বাংলা ১ম পত্র';
      if (lower.includes('2nd') || lower.includes('_2') || lower.includes('second')) return 'বাংলা ২য় পত্র';
      return 'বাংলা';
    }

    if (lower.includes('english')) {
      if (lower.includes('1st') || lower.includes('_1') || lower.includes('first')) return 'ইংরেজি ১ম পত্র';
      if (lower.includes('2nd') || lower.includes('_2') || lower.includes('second')) return 'ইংরেজি ২য় পত্র';
      return 'ইংরেজি';
    }

    if (lower.includes('ict') || lower.includes('information_and_communication')) {
      return 'তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)';
    }

    if (lower.includes('general_science') || lower.includes('science')) {
      return 'সাধারণ বিজ্ঞান';
    }

    if (lower.includes('bgs') || lower.includes('bangladesh_and_global')) {
      return 'বাংলাদেশ ও বিশ্বপরিচয়';
    }

    if (lower.includes('gk') || lower.includes('general_knowledge')) {
      return 'সাধারণ জ্ঞান';
    }

    if (lower.includes('accounting')) return 'হিসাববিজ্ঞান';
    if (lower.includes('finance')) return 'ফিন্যান্স ও ব্যাংকিং';
    if (lower.includes('management')) return 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা';
    if (lower.includes('marketing')) return 'উৎপাদন ব্যবস্থাপনা ও বিপণন';
    if (lower.includes('economics')) return 'অর্থনীতি';
    if (lower.includes('civics')) return 'পৌরনীতি ও সুশাসন';
    if (lower.includes('sociology')) return 'সমাজবিজ্ঞান';
    if (lower.includes('islamic_history')) return 'ইসলামের ইতিহাস ও সংস্কৃতি';
    if (lower.includes('history')) return 'ইতিহাস';
    if (lower.includes('islamic_studies') || lower.includes('islam')) return 'ইসলাম শিক্ষা';
    if (lower.includes('psychology')) return 'মনোবিজ্ঞান';
    if (lower.includes('geography')) return 'ভূগোল';
    if (lower.includes('statistics')) return 'পরিসংখ্যান';

    return raw
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : ''))
      .join(' ');
  }

  /**
   * Converts chapter strings into clean Bengali text.
   */
  static formatChapter(chapter?: string): string {
    if (!chapter || !chapter.trim()) return '';
    let text = chapter.trim();

    text = text.replace(
      /^(?:Chapter|Ch|Chap|অধ্যায়)[\s.\-_:]*(\d+)/gi,
      (_, num) => `অধ্যায় ${this.toBanglaNumeral(num)}`
    );

    text = text.replace(/\b(\d+)\b/g, (_, num) => this.toBanglaNumeral(num));

    return text;
  }

  /**
   * Returns the canonical textbook order index (1-indexed) of a chapter.
   */
  static getChapterSortIndex(chapterName: string, id?: string): number {
    const raw = `${chapterName} ${id ?? ''}`.toLowerCase().replace(/\u09df/g, '\u09af\u09bc');

    const idMatch = /(?:ch|chap)[_\-]?0*(\d+)/i.exec(id ?? chapterName);
    if (idMatch && idMatch[1]) {
      const numVal = parseInt(idMatch[1], 10);
      if (!isNaN(numVal) && numVal > 0) return numVal;
    }

    const bengaliDigitMatch = /(?:অধ্যায়|chapter|ch)?[\s.\-_:]*([১-৯১০-৯]+|[0-9]+)/i.exec(chapterName);
    if (bengaliDigitMatch && bengaliDigitMatch[1]) {
      const parsed = this._parseBengaliOrEnglishInt(bengaliDigitMatch[1]);
      if (parsed && parsed > 0 && parsed <= 30) return parsed;
    }

    // Chemistry 1st
    if (raw.includes('ল্যাবরেটরি') || raw.includes('ল্যাবরেটরী')) return 1;
    if (raw.includes('গুণগত')) return 2;
    if (raw.includes('পর্যায়বৃত্ত') || raw.includes('পর্যায়বৃত্ত') || raw.includes('রাসায়নিক বন্ধন')) return 3;
    if (raw.includes('রাসায়নিক পরিবর্তন')) return 4;
    if (raw.includes('কর্মমুখী')) return 5;

    // Chemistry 2nd
    if (raw.includes('পরিবেশ রসায়ন') || raw.includes('পরিবেশ রসায়ন')) return 1;
    if (raw.includes('জৈব যৌগ') || raw.includes('জৈব রসায়ন')) return 2;
    if (raw.includes('পরিমাণগত') || raw.includes('পরিমানগত')) return 3;
    if (raw.includes('তড়িৎ রসায়ন') || raw.includes('তড়িৎ রসায়ন')) return 4;
    if (raw.includes('অর্থনৈতিক')) return 5;

    // Physics 1st
    if (raw.includes('ভৌতজগত') || raw.includes('ভৌত জগত') || raw.includes('ভৌতজগৎ')) return 1;
    if (raw.includes('ভেক্টর')) return 2;
    if (raw.includes('গতিবিদ্যা')) return 3;
    if (raw.includes('বলবিদ্যা') || raw.includes('নিউটনিয়ান') || raw.includes('নিউটনিয়')) return 4;
    if (raw.includes('কাজ, শক্তি') || raw.includes('কাজ শক্তি') || raw.includes('কাজ ও শক্তি')) return 5;
    if (raw.includes('মহাকর্ষ')) return 6;
    if (raw.includes('গাঠনিক ধর্ম')) return 7;
    if (raw.includes('পর্যায়বৃত্ত গতি') || raw.includes('পর্যায়বৃত্ত গতি')) return 8;
    if (raw.includes('তরঙ্গ')) return 9;
    if (raw.includes('আদর্শ গ্যাস') || raw.includes('গ্যাসের গতিতত্ত্ব')) return 10;

    // Physics 2nd
    if (raw.includes('তাপগতিবিদ্যা')) return 1;
    if (raw.includes('স্থির তড়িৎ') || raw.includes('স্থির তড়িৎ')) return 2;
    if (raw.includes('চল তড়িৎ') || raw.includes('চল তড়িৎ')) return 3;
    if (raw.includes('চৌম্বক ক্রিয়া') || raw.includes('চুম্বকত্ব')) return 4;
    if (raw.includes('তাড়িতচৌম্বকীয়') || raw.includes('আবেশ ও পরিবর্তী')) return 5;
    if (raw.includes('জ্যামিতিক আলোক')) return 6;
    if (raw.includes('ভৌত আলোক')) return 7;
    if (raw.includes('আধুনিক পদার্থবিজ্ঞান')) return 8;
    if (raw.includes('পরমাণুর মডেল') || raw.includes('নিউক্লিয়ার')) return 9;
    if (raw.includes('সেমিকন্ডাক্টর')) return 10;
    if (raw.includes('জ্যোতির্বিজ্ঞান')) return 11;

    // Higher Math 1st
    if (raw.includes('ম্যাট্রিক্স') || raw.includes('নির্ণায়ক') || raw.includes('নির্ণায়ক')) return 1;
    if (raw.includes('সরলরেখা')) return 3;
    if (raw.includes('বৃত্ত')) return 4;
    if (raw.includes('বিন্যাস ও সমাবেশ') || raw.includes('বিন্যাস')) return 5;
    if (raw.includes('ত্রিকোণমিতিক অনুপাত') && !raw.includes('সংযুক্ত')) return 6;
    if (raw.includes('সংযুক্ত কোণ')) return 7;
    if (raw.includes('ফাংশন ও ফাংশনের লেখচিত্র')) return 8;
    if (raw.includes('অন্তরীকরণ')) return 9;
    if (raw.includes('যোগজীকরণ')) return 10;

    // Higher Math 2nd
    if (raw.includes('বাস্তব সংখ্যা')) return 1;
    if (raw.includes('যোগাশ্রয়ী') || raw.includes('যোগাশ্রয়ী')) return 2;
    if (raw.includes('জটিল সংখ্যা')) return 3;
    if (raw.includes('বহুপদী')) return 4;
    if (raw.includes('দ্বিপদী')) return 5;
    if (raw.includes('কণিক') || raw.includes('কনিক')) return 6;
    if (raw.includes('বিপরীত ত্রিকোণমিতিক')) return 7;
    if (raw.includes('স্থিতিবিদ্যা')) return 8;
    if (raw.includes('সমতলে বস্তুকণার গতি') || raw.includes('বস্তুকণার গতি')) return 9;
    if (raw.includes('বিস্তার পরিমাপ') || raw.includes('সম্ভাবনা')) return 10;

    // Biology 1st (Botany)
    if (raw.includes('কোষ ও এর গঠন') || raw.includes('কোষের গঠন')) return 1;
    if (raw.includes('কোষ বিভাজন')) return 2;
    if (raw.includes('কোষ রসায়ন') || raw.includes('কোষ রসায়ন')) return 3;
    if (raw.includes('অনুজীব') || raw.includes('অণুজীব')) return 4;
    if (raw.includes('শৈবাল ও ছত্রাক')) return 5;
    if (raw.includes('ব্রায়োফাইটা') || raw.includes('টেরিডোফাইটা')) return 6;
    if (raw.includes('নগ্নবীজী') || raw.includes('আবৃতবীজী')) return 7;
    if (raw.includes('টিস্যু ও টিস্যুতন্ত্র') || raw.includes('টিস্যুতন্ত্র')) return 8;
    if (raw.includes('উদ্ভিদ শারীরতত্ত্ব')) return 9;
    if (raw.includes('উদ্ভিদ প্রজনন')) return 10;
    if (raw.includes('জীবপ্রযুক্তি') || raw.includes('বায়োটেকনোলজি')) return 11;
    if (raw.includes('জীবের পরিবেশ') || raw.includes('বিস্তার ও সংরক্ষণ')) return 12;

    // Biology 2nd (Zoology)
    if (raw.includes('প্রাণীর বিভিন্নতা') || raw.includes('শ্রেণিবিন্যাস')) return 1;
    if (raw.includes('প্রাণীর পরিচিতি') || raw.includes('হাইড্রা') || raw.includes('ঘাসফড়িং') || raw.includes('রুই মাছ')) return 2;
    if (raw.includes('পরিপাক ও শোষণ') || raw.includes('পরিপাক')) return 3;
    if (raw.includes('রক্ত ও সংবহন') || raw.includes('রক্ত সংবহন')) return 4;
    if (raw.includes('শ্বাসক্রিয়া') || raw.includes('শ্বসন')) return 5;
    if (raw.includes('বর্জ্য ও নিষ্কাশন') || raw.includes('বর্জ্য')) return 6;
    if (raw.includes('চলন ও অঙ্গচালনা') || raw.includes('অস্থি')) return 7;
    if (raw.includes('সমন্বয় ও নিয়ন্ত্রণ') || raw.includes('হরমোন')) return 8;
    if (raw.includes('মানব জীবনের ধারাবাহিকতা') || raw.includes('প্রজনন তন্ত্র')) return 9;
    if (raw.includes('মানবদেহের প্রতিরক্ষা') || raw.includes('ইমিউনিটি') || raw.includes('প্রতিরক্ষা')) return 10;
    if (raw.includes('জিনতত্ত্ব ও বিবর্তন') || raw.includes('জিনতত্ত্ব')) return 11;
    if (raw.includes('প্রাণীর আচরণ')) return 12;

    // ICT
    if (raw.includes('বিশ্ব ও বাংলাদেশ') || raw.includes('প্রেক্ষিত')) return 1;
    if (raw.includes('কমিউনিকেশন সিস্টেমস') || raw.includes('নেটওয়ার্কিং')) return 2;
    if (raw.includes('সংখ্যা পদ্ধতি') || raw.includes('ডিজিটাল ডিভাইস')) return 3;
    if (raw.includes('ওয়েব ডিজাইন') || raw.includes('html')) return 4;
    if (raw.includes('প্রোগ্রামিং ভাষা') || raw.includes('সি প্রোগ্রামিং')) return 5;
    if (raw.includes('ডেটাবেজ') || raw.includes('ডাটাবেজ')) return 6;

    return 999;
  }

  private static _parseBengaliOrEnglishInt(input: string): number | null {
    const map: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    const enStr = input.split('').map((c) => map[c] ?? c).join('');
    const val = parseInt(enStr, 10);
    return isNaN(val) ? null : val;
  }

  /**
   * Converts any integer or number string to Bengali digits (e.g. 25 -> ২৫).
   */
  static toBanglaNumeral(input: string | number | null | undefined): string {
    if (input === null || input === undefined) return '';
    const str = input.toString();
    const map: Record<string, string> = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
    };
    return str.split('').map((c) => map[c] ?? c).join('');
  }

  private static _hasBengali(text: string): boolean {
    return /[\u0980-\u09FF]/.test(text);
  }

  /**
   * Determines the 3-tier academic category: Compulsory, Core, or Elective.
   */
  static getSubjectCategory(id: string, name?: string): SubjectCategoryType {
    const lower = `${id} ${name ?? ''}`.toLowerCase();

    if (
      lower.includes('bangla') ||
      lower.includes('বাংলা') ||
      lower.includes('english') ||
      lower.includes('ইংরেজি') ||
      lower.includes('ict') ||
      lower.includes('তথ্য')
    ) {
      return 'compulsory';
    }

    if (
      lower.includes('biology') ||
      lower.includes('জীববিজ্ঞান') ||
      lower.includes('botany') ||
      lower.includes('zoology') ||
      lower.includes('statistics') ||
      lower.includes('পরিসংখ্যান') ||
      lower.includes('psychology') ||
      lower.includes('মনোবিজ্ঞান') ||
      lower.includes('agriculture') ||
      lower.includes('কৃষি')
    ) {
      return 'elective';
    }

    return 'core';
  }

  /**
   * Human-friendly Bangla & English title for the category headers.
   */
  static getCategoryTitle(type: SubjectCategoryType): string {
    switch (type) {
      case 'compulsory':
        return 'আবশ্যিক বিষয়সমূহ (Compulsory)';
      case 'core':
        return 'বিভাগীয় মূল বিষয়সমূহ (Core Subjects)';
      case 'elective':
        return 'ঐচ্ছিক / ৪র্থ বিষয় (Elective)';
    }
  }

  /**
   * Canonical sort priority for subjects.
   */
  static getSubjectSortPriority(name: string, id: string): number {
    const l = `${name} ${id}`.toLowerCase();
    let base = 50;

    if (l.includes('bangla') || l.includes('বাংলা')) {
      base = 10;
    } else if (l.includes('english') || l.includes('ইংরেজি')) {
      base = 20;
    } else if (l.includes('ict') || l.includes('তথ্য') || l.includes('information')) {
      base = 30;
    } else if (l.includes('physics') || l.includes('পদার্থ')) {
      base = 40;
    } else if (l.includes('chemistry') || l.includes('রসায়ন') || l.includes('রসায়ন')) {
      base = 50;
    } else if (l.includes('higher_math') || l.includes('উচ্চতর গণিত') || l.includes('math') || l.includes('গণিত')) {
      base = 60;
    } else if (
      l.includes('biology') ||
      l.includes('botany') ||
      l.includes('zoology') ||
      l.includes('জীববিজ্ঞান') ||
      l.includes('উদ্ভিদ') ||
      l.includes('প্রাণি')
    ) {
      base = 70;
    } else if (l.includes('statistics') || l.includes('পরিসংখ্যান')) {
      base = 75;
    } else if (l.includes('accounting') || l.includes('হিসাব')) {
      base = 80;
    } else if (l.includes('management') || l.includes('ব্যবস্থাপনা') || l.includes('ব্যবসায় সংগঠন')) {
      base = 82;
    } else if (l.includes('finance') || l.includes('ফিন্যান্স') || l.includes('ব্যাংকিং')) {
      base = 84;
    } else if (l.includes('marketing') || l.includes('বিপণন') || l.includes('উৎপাদন ব্যবস্থাপনা')) {
      base = 86;
    } else if (l.includes('economics') || l.includes('অর্থনীতি')) {
      base = 88;
    } else if (l.includes('civics') || l.includes('পৌরনীতি')) {
      base = 90;
    } else if (l.includes('history') || l.includes('ইতিহাস')) {
      base = 92;
    } else if (l.includes('islamic') || l.includes('ইসলামের ইতিহাস')) {
      base = 94;
    } else if (l.includes('logic') || l.includes('যুক্তিবিদ্যা')) {
      base = 96;
    } else if (l.includes('sociology') || l.includes('সমাজবিজ্ঞান')) {
      base = 98;
    } else if (l.includes('social_work') || l.includes('সমাজকর্ম')) {
      base = 100;
    } else if (l.includes('geography') || l.includes('ভূগোল')) {
      base = 102;
    } else if (l.includes('science') || l.includes('বিজ্ঞান')) {
      base = 110;
    } else if (l.includes('bgs') || l.includes('বিশ্বপরিচয়')) {
      base = 112;
    } else if (l.includes('agriculture') || l.includes('কৃষি')) {
      base = 114;
    }

    if (
      l.includes('2nd') ||
      l.includes('_2') ||
      l.includes('২য়') ||
      l.includes('২য়') ||
      l.includes('zoology') ||
      l.includes('প্রাণি') ||
      l.includes('২') ||
      l.includes('paper 2')
    ) {
      return base + 1;
    }
    return base;
  }

  /**
   * Filters allowed exam types based on the user's exam target/profile.
   */
  static getAllowedExamTypesForProfile(profile?: UserProfileTarget | null): string[] {
    const rawTarget = [
      profile?.target,
      profile?.exam_target,
      profile?.examTarget,
      (profile as any)?.dream_target,
      (profile as any)?.target_institution,
      (profile as any)?.stream,
      profile?.level,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .trim();

    if (
      rawTarget.includes('eng') ||
      rawTarget.includes('buet') ||
      rawTarget.includes('engineering') ||
      rawTarget.includes('ckruet') ||
      rawTarget.includes('kuet') ||
      rawTarget.includes('ruet') ||
      rawTarget.includes('cuet') ||
      rawTarget.includes('butex') ||
      rawTarget.includes('mist') ||
      rawTarget.includes('ইঞ্জিনিয়ারিং')
    ) {
      return ['Engineering', 'Varsity', 'Board', 'Academic'];
    } else if (
      rawTarget.includes('mbbs') ||
      rawTarget.includes('medical') ||
      rawTarget.includes('মেডিকেল') ||
      rawTarget.includes('mat') ||
      rawTarget.includes('dermatology')
    ) {
      return ['Medical', 'Varsity', 'Board', 'Academic'];
    } else if (
      rawTarget.includes('varsity') ||
      rawTarget.includes('university') ||
      rawTarget.includes('ভার্সিটি') ||
      rawTarget.includes('gst') ||
      rawTarget.includes('du') ||
      rawTarget.includes('ju') ||
      rawTarget.includes('ru') ||
      rawTarget.includes('cu') ||
      rawTarget.includes('bup')
    ) {
      return ['Varsity', 'Board', 'Academic'];
    } else {
      return ['Academic', 'Board'];
    }
  }

  /**
   * Formats question institute/year/history tags nicely.
   */
  /**
   * Formats question institute/year/history tags into standardized codes like CU-18, DB-24, etc.
   */
  static formatQuestionSource(data: {
    institutes?: string[];
    years?: (string | number)[];
    examHistory?: (string | { code?: string; institute?: string; year?: string | number })[];
  }): string {
    // 1. Structured examHistory priority
    if (data.examHistory && data.examHistory.length > 0) {
      const tags: string[] = [];
      for (const item of data.examHistory) {
        let code = '';
        let inst = '';
        let rawYear = '';

        if (typeof item === 'string') {
          tags.push(this._normalizeInstituteOrAuthor(item));
          continue;
        } else if (item && typeof item === 'object') {
          code = (item.code || '').trim();
          inst = (item.institute || '').trim();
          rawYear = (item.year || '').toString();
        }

        const yr = this._formatYearShort(rawYear);
        const label = code.length > 0 ? code : this._normalizeInstituteOrAuthor(inst);

        if (label && yr) {
          tags.push(`${label}-${yr}`);
        } else if (label) {
          tags.push(label);
        } else if (yr) {
          tags.push(yr);
        }
      }
      if (tags.length > 0) return tags.join(', ');
    }

    const rawInsts = (data.institutes || []).map((e) => e.toString().trim()).filter(Boolean);
    const yrs = (data.years || []).map((e) => this._formatYearShort(e.toString())).filter(Boolean);

    if (rawInsts.length === 0 && yrs.length === 0) return '';

    const tags: string[] = [];
    let yearIdx = 0;

    for (const raw of rawInsts) {
      const isAuthor = this._isTextbookAuthor(raw);
      if (isAuthor) {
        tags.push(this._normalizeInstituteOrAuthor(raw));
        continue;
      }

      // Check if raw already has embedded year digits (e.g. "CU-18", "DINAJPUR BOARD 22")
      const embeddedYearMatch = raw.match(/(\d{2,4}(?:\s*[-–/]\s*\d{2,4})?|\b\d{2}\b)/);
      let embeddedYear: string | null = null;
      let cleanRaw = raw;
      if (embeddedYearMatch) {
        embeddedYear = this._formatYearShort(embeddedYearMatch[0]);
        cleanRaw = raw.replace(embeddedYearMatch[0], '').trim();
      }

      const normalized = this._normalizeInstituteOrAuthor(cleanRaw.length > 0 ? cleanRaw : raw);

      let yearToUse: string | null = null;
      if (yearIdx < yrs.length) {
        yearToUse = yrs[yearIdx];
        yearIdx++;
      } else if (embeddedYear) {
        yearToUse = embeddedYear;
      }

      if (yearToUse && !normalized.includes(yearToUse)) {
        tags.push(`${normalized}-${yearToUse}`);
      } else {
        tags.push(normalized);
      }
    }

    while (yearIdx < yrs.length) {
      if (tags.length === 0) {
        tags.push(yrs[yearIdx]);
      } else {
        if (!tags[tags.length - 1].includes('-')) {
          tags[tags.length - 1] = `${tags[tags.length - 1]}-${yrs[yearIdx]}`;
        } else {
          tags.push(yrs[yearIdx]);
        }
      }
      yearIdx++;
    }

    return tags.join(', ');
  }

  private static _formatYearShort(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const clean = trimmed.replace(/['’]/g, '');
    const sessionMatch = clean.match(/^(\d{2,4})\s*[-–/]\s*(\d{2,4})$/);
    if (sessionMatch) {
      const y1 = sessionMatch[1].slice(-2);
      const y2 = sessionMatch[2].slice(-2);
      return `${y1}-${y2}`;
    }
    const singleMatch = clean.match(/\d{2,4}/);
    if (singleMatch) {
      return singleMatch[0].slice(-2);
    }
    return trimmed;
  }

  private static _isTextbookAuthor(name: string): boolean {
    const lower = name.toLowerCase();
    return (
      lower.includes('ম্যাম') ||
      lower.includes('স্যার') ||
      lower.includes('আজমল') ||
      lower.includes('হাসান') ||
      lower.includes('মাজেদা') ||
      lower.includes('হাজারী') ||
      lower.includes('ইসহাক') ||
      lower.includes('তপন') ||
      lower.includes('কেতাব')
    );
  }

  private static _normalizeInstituteOrAuthor(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    const upper = trimmed.toUpperCase().replace(/-/g, ' ').replace(/_/g, ' ');

    // Boards
    if (upper === 'DB' || upper.includes('DHAKA') || upper.includes('ঢাকা')) return 'DB';
    if (upper === 'DIN' || upper.includes('DINAJPUR') || upper.includes('দিনাজপুর')) return 'DIN';
    if (upper === 'RB' || upper.includes('RAJSHAHI') || upper.includes('রাজশাহী')) return 'RB';
    if (upper === 'CB' || upper.includes('CHITTAGONG') || upper.includes('CHATTOGRAM') || upper.includes('চট্টগ্রাম')) return 'CB';
    if (upper === 'COM' || upper.includes('COMILLA') || upper.includes('CUMILLA') || upper.includes('কুমিল্লা')) return 'COM';
    if (upper === 'JB' || upper.includes('JESSORE') || upper.includes('JASHORE') || upper.includes('যশোর')) return 'JB';
    if (upper === 'BB' || upper.includes('BARISAL') || upper.includes('BARISHAL') || upper.includes('বরিশাল')) return 'BB';
    if (upper === 'SB' || upper.includes('SYLHET') || upper.includes('সিলেট')) return 'SB';
    if (upper === 'MB' || upper.includes('MYMENSINGH') || upper.includes('ময়মনসিংহ')) return 'MB';
    if (upper === 'MAD' || upper.includes('MADRASAH') || upper.includes('মাদ্রাসা')) return 'MAD';
    if (upper === 'ALL' || upper.includes('ALL BOARD') || upper.includes('সকল বোর্ড')) return 'ALL';

    // Universities
    if (upper === 'DU A' || upper === 'DU KA') return 'DU-A';
    if (upper === 'DU D' || upper === 'DU GHA') return 'DU-D';
    if (upper === 'DU B' || upper === 'DU KHA') return 'DU-B';
    if (upper === 'DU' || upper.includes('DHAKA UNIVERSITY')) return 'DU';
    if (upper.includes('BUET')) return 'BUET';
    if (upper.includes('CKRUET')) return 'CKRUET';
    if (upper.includes('RUET')) return 'RUET';
    if (upper.includes('KUET')) return 'KUET';
    if (upper.includes('CUET')) return 'CUET';
    if (upper.includes('BUTEX')) return 'BUTEX';
    if (upper.includes('SUST')) return 'SUST';
    if (upper.includes('MIST')) return 'MIST';
    if (upper.includes('IUT')) return 'IUT';
    if (upper.includes('BUP')) return 'BUP';
    if (upper === 'JU A') return 'JU-A';
    if (upper === 'JU D') return 'JU-D';
    if (upper.includes('JU') || upper.includes('JAHANGIRNAGAR')) return 'JU';
    if (upper === 'RU A') return 'RU-A';
    if (upper === 'RU C') return 'RU-C';
    if (upper.includes('RU') || upper.includes('RAJSHAHI UNIVERSITY')) return 'RU';
    if (upper === 'CU A') return 'CU-A';
    if (upper === 'CU D') return 'CU-D';
    if (upper === 'CU' || upper.includes('CHITTAGONG UNIVERSITY') || upper.includes('চট্টগ্রাম বিশ্ববিদ্যালয়')) return 'CU';
    if (upper.includes('GST')) return 'GST';
    if (upper.includes('MEDICAL') || upper.includes('MAT') || upper.includes('মেডিকেল')) return 'MAT';

    return trimmed;
  }

  /**
   * Returns a relevant emoji for a subject.
   */
  static getSubjectEmoji(name: string, id: string): string {
    const l = `${name} ${id}`.toLowerCase();
    if (l.includes('physics') || l.includes('পদার্থ')) return '⚡';
    if (l.includes('chemistry') || l.includes('রসায়ন') || l.includes('রসায়ন')) return '🧪';
    if (l.includes('higher_math') || l.includes('উচ্চতর গণিত') || l.includes('math') || l.includes('গণিত')) return '📐';
    if (l.includes('biology') || l.includes('উদ্ভিদ') || l.includes('প্রাণি') || l.includes('জীববিজ্ঞান')) return '🧬';
    if (l.includes('ict') || l.includes('তথ্য')) return '💻';
    if (l.includes('english') || l.includes('ইংরেজি')) return '📖';
    if (l.includes('bangla') || l.includes('বাংলা')) return '🇧🇩';
    if (l.includes('accounting') || l.includes('হিসাব')) return '📊';
    if (l.includes('finance') || l.includes('অর্থায়ন') || l.includes('ব্যাংকিং')) return '💰';
    if (l.includes('management') || l.includes('ব্যবস্থাপনা')) return '🏢';
    if (l.includes('statistics') || l.includes('পরিসংখ্যান')) return '📈';
    if (l.includes('general_knowledge') || l.includes('সাধারণ জ্ঞান')) return '🌍';
    return '📚';
  }
}

