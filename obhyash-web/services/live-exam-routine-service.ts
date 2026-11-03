/**
 * Live Exam Routine Service - Google Sheets Hybrid Integration
 * Obhyash Smart Prep Platform
 */

export interface GoogleSheetRoutineItem {
  id: string;
  date: string;
  dayName: string;
  time: string;
  examName: string;
  subject: string;
  paper: string;
  syllabus: string;
  chapters: string[];
  totalMarks: number;
  durationMinutes: number;
  status: "completed" | "ongoing" | "upcoming";
}

export type TrackKey = "Medical" | "Engineering" | "Varsity_A" | "GKE";

const SPREADSHEET_ID = "1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug";

export class LiveExamRoutineService {
  private static CACHE_KEY_PREFIX = "obhyash_live_routine_";
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  static getSheetNameFromCategory(category: string): TrackKey {
    const cat = category.toLowerCase().trim();
    if (cat.includes("gke") || cat.includes("জিকে") || cat.includes("ইংলিশ") || cat.includes("gk") || cat.includes("english")) {
      return "GKE";
    }
    if (cat.includes("med") || cat.includes("মেডিকেল")) {
      return "Medical";
    }
    if (cat.includes("eng") || cat.includes("ইঞ্জিনিয়ারিং") || cat.includes("buet")) {
      return "Engineering";
    }
    if (cat.includes("varsity") || cat.includes("ভার্সিটি") || cat.includes("গুচ্ছ") || cat.includes("ক ইউনিট") || cat.includes("admission")) {
      return "Varsity_A";
    }
    return "Medical";
  }

  static async fetchRoutine(
    sheetName: string,
    customSpreadsheetId?: string
  ): Promise<GoogleSheetRoutineItem[]> {
    const sId = customSpreadsheetId || SPREADSHEET_ID;
    const cacheKey = `${this.CACHE_KEY_PREFIX}${sId}_${sheetName}`;

    // 1. Check local storage cache
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < this.CACHE_TTL_MS && Array.isArray(parsed.data) && parsed.data.length > 0) {
            // Background re-fetch to keep fresh
            this.fetchFromNetwork(sheetName, sId).then((fresh) => {
              if (fresh.length > 0) {
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({ timestamp: Date.now(), data: fresh })
                );
              }
            }).catch(() => {});
            return parsed.data;
          }
        }
      } catch {
        // Ignore cache errors
      }
    }

    // 2. Fetch from network
    try {
      const items = await this.fetchFromNetwork(sheetName, sId);
      if (items.length > 0) {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ timestamp: Date.now(), data: items })
            );
          } catch {
            // Ignore storage errors
          }
        }
        return items;
      }
    } catch (err) {
      console.warn("Failed to fetch routine from Google Sheet, checking cache fallback", err);
    }

    // Fallback to cache if available
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.data) && parsed.data.length > 0) {
            return parsed.data;
          }
        }
      } catch {
        // Ignore
      }
    }

    // Dedicated fallback for GKE Batch
    if (sheetName.toLowerCase().includes("gke")) {
      return this.getGkeRoutineFallback();
    }

    return [];
  }

  public static getGkeRoutineFallback(): GoogleSheetRoutineItem[] {
    const routineList = [
      {
        num: "01",
        date: "5 Nov 2026",
        dayName: "বৃহস্পতিবার",
        syllabus: "প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস, Noun, Determiners, Article, Number, Gender",
        chapters: ["প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস", "Noun", "Determiners", "Article", "Number", "Gender"]
      },
      {
        num: "02",
        date: "6 Nov 2026",
        dayName: "শুক্রবার",
        syllabus: "ব্রিটিশ শাসন, ভাষা আন্দোলন, Pronoun & Its Classification, Uses of Pronoun",
        chapters: ["ব্রিটিশ শাসন", "ভাষা আন্দোলন", "Pronoun & Its Classification", "Uses of Pronoun"]
      },
      {
        num: "03",
        date: "7 Nov 2026",
        dayName: "শনিবার",
        syllabus: "বাংলাদেশের মহান মুক্তিযুদ্ধ, Adjective & Its Classification, Degree of Comparison, Adverb & Its Classification, Inversion, Affirmative & Negative Agreement",
        chapters: ["বাংলাদেশের মহান মুক্তিযুদ্ধ", "Adjective & Its Classification", "Degree of Comparison", "Adverb & Its Classification", "Inversion", "Affirmative & Negative Agreement"]
      },
      {
        num: "04",
        date: "8 Nov 2026",
        dayName: "রবিবার",
        syllabus: "মুক্তিযুদ্ধ পরবর্তী ঘটনা প্রবাহ, বাংলাদেশের সংবিধান, Verb & Its Classification, Gerund, Participle & Verbal Noun, Conjugation of Verbs",
        chapters: ["মুক্তিযুদ্ধ পরবর্তী ঘটনা প্রবাহ", "বাংলাদেশের সংবিধান", "Verb & Its Classification", "Gerund, Participle & Verbal Noun", "Conjugation of Verbs"]
      },
      {
        num: "05",
        date: "9 Nov 2026",
        dayName: "সোমবার",
        syllabus: "বাংলাদেশের সরকার ব্যবস্থা, জাতীয় সংসদ, আইন ও বিচার বিভাগ, বাংলাদেশের রাজনৈতিক কাঠামো, Preposition & Its Classification, Uses of Some Prepositions",
        chapters: ["বাংলাদেশের সরকার ব্যবস্থা", "জাতীয় সংসদ, আইন ও বিচার বিভাগ", "বাংলাদেশের রাজনৈতিক কাঠামো", "Preposition & Its Classification", "Uses of Some Prepositions"]
      },
      {
        num: "06",
        date: "10 Nov 2026",
        dayName: "মঙ্গলবার",
        syllabus: "বাংলাদেশের জনতত্ত্ব ও শিক্ষা ব্যবস্থা, Conjunction, Linkers & Interjection, Prefix & Suffix, Identification of Parts of Speech, Same Word but Different Parts of Speech, Transformation of Parts of Speech",
        chapters: ["বাংলাদেশের জনতত্ত্ব ও শিক্ষা ব্যবস্থা", "Conjunction, Linkers & Interjection", "Prefix & Suffix", "Identification of Parts of Speech", "Same Word but Different Parts of Speech", "Transformation of Parts of Speech"]
      },
      {
        num: "07",
        date: "11 Nov 2026",
        dayName: "বুধবার",
        syllabus: "বাংলাদেশের স্বাস্থ্য ও চিকিৎসা ব্যবস্থা, Phrases & Clauses, Sentence & Its Classification, Transformation of Sentence, Voice, Narration",
        chapters: ["বাংলাদেশের স্বাস্থ্য ও চিকিৎসা ব্যবস্থা", "Phrases & Clauses", "Sentence & Its Classification", "Transformation of Sentence", "Voice", "Narration"]
      },
      {
        num: "08",
        date: "12 Nov 2026",
        dayName: "বৃহস্পতিবার",
        syllabus: "বাংলাদেশের প্রাকৃতিক সম্পদ, Right Form of Verbs",
        chapters: ["বাংলাদেশের প্রাকৃতিক সম্পদ", "Right Form of Verbs"]
      },
      {
        num: "09",
        date: "13 Nov 2026",
        dayName: "শুক্রবার",
        syllabus: "বাংলাদেশের অর্থনীতি, শিল্প ও বাণিজ্য, Sentence Correction",
        chapters: ["বাংলাদেশের অর্থনীতি, শিল্প ও বাণিজ্য", "Sentence Correction"]
      },
      {
        num: "10",
        date: "14 Nov 2026",
        dayName: "শনিবার",
        syllabus: "বাংলাদেশের প্রতিরক্ষা, যোগাযোগ ব্যবস্থা এবং তথ্য প্রযুক্তি, Tag Question, Sentence Completion",
        chapters: ["বাংলাদেশের প্রতিরক্ষা, যোগাযোগ ব্যবস্থা এবং তথ্য প্রযুক্তি", "Tag Question", "Sentence Completion"]
      },
      {
        num: "11",
        date: "15 Nov 2026",
        dayName: "রবিবার",
        syllabus: "বাংলাদেশের শিল্প, সংস্কৃতি ও সাহিত্য, Analogy, Translation, Literature",
        chapters: ["বাংলাদেশের শিল্প, সংস্কৃতি ও সাহিত্য", "Analogy", "Translation", "Literature"]
      },
      {
        num: "12",
        date: "16 Nov 2026",
        dayName: "সোমবার",
        syllabus: "বাংলাদেশের বিখ্যাত ব্যক্তিবর্গ, বাংলাদেশের অর্জন, বিভিন্ন চুক্তি ও সনদ, পদক ও পুরস্কার, দিবস, প্রথম, বৃহত্তম ও ক্ষুদ্রতম, Appropriate Preposition",
        chapters: ["বাংলাদেশের বিখ্যাত ব্যক্তিবর্গ", "বাংলাদেশের অর্জন", "বিভিন্ন চুক্তি ও সনদ", "পদক ও পুরস্কার", "দিবস", "প্রথম, বৃহত্তম ও ক্ষুদ্রতম", "Appropriate Preposition"]
      },
      {
        num: "13",
        date: "17 Nov 2026",
        dayName: "মঙ্গলবার",
        syllabus: "বৈশ্বিক ইতিহাস, Synonym & Antonym (A - L)",
        chapters: ["বৈশ্বিক ইতিহাস", "Synonym & Antonym (A - L)"]
      },
      {
        num: "14",
        date: "18 Nov 2026",
        dayName: "বুধবার",
        syllabus: "বিশ্ব পরিচিতি, Synonym & Antonym (M - Z)",
        chapters: ["বিশ্ব পরিচিতি", "Synonym & Antonym (M - Z)"]
      },
      {
        num: "15",
        date: "19 Nov 2026",
        dayName: "বৃহস্পতিবার",
        syllabus: "বিশ্ব ভৌগোলিক পরিচিতি, Spelling",
        chapters: ["বিশ্ব ভৌগোলিক পরিচিতি", "Spelling"]
      },
      {
        num: "16",
        date: "20 Nov 2026",
        dayName: "শুক্রবার",
        syllabus: "বৈশ্বিক স্বাস্থ্য ও চিকিৎসা ব্যবস্থা, জাতিসংঘ, জাতিসংঘের অঙ্গ সংগঠন, Idiom & Phrases",
        chapters: ["বৈশ্বিক স্বাস্থ্য ও চিকিৎসা ব্যবস্থা", "জাতিসংঘ, জাতিসংঘের অঙ্গ সংগঠন", "Idiom & Phrases"]
      },
      {
        num: "17",
        date: "21 Nov 2026",
        dayName: "শনিবার",
        syllabus: "বিশ্বের উল্লেখযোগ্য অর্থনৈতিক জোট ও আর্থিক প্রতিষ্ঠান, অন্যান্য আন্তর্জাতিক, আঞ্চলিক সহযোগীতা সংস্থা, Group Verb",
        chapters: ["বিশ্বের উল্লেখযোগ্য অর্থনৈতিক জোট ও আর্থিক প্রতিষ্ঠান", "অন্যান্য আন্তর্জাতিক, আঞ্চলিক সহযোগীতা সংস্থা", "Group Verb"]
      },
      {
        num: "18",
        date: "22 Nov 2026",
        dayName: "রবিবার",
        syllabus: "আন্তর্জাতিক সামরিক জোট, অস্ত্র নিয়ন্ত্রণ সংস্থা ও নিরস্ত্রীকরণ চুক্তি, বিশ্বের পরিবেশ ইস্যু ও কূটনীতি, Proverb",
        chapters: ["আন্তর্জাতিক সামরিক জোট, অস্ত্র নিয়ন্ত্রণ সংস্থা ও নিরস্ত্রীকরণ চুক্তি", "বিশ্বের পরিবেশ ইস্যু ও কূটনীতি", "Proverb"]
      },
      {
        num: "19",
        date: "23 Nov 2026",
        dayName: "সোমবার",
        syllabus: "বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী, One Word Substitution, Foreign Words",
        chapters: ["বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী", "One Word Substitution", "Foreign Words"]
      },
      {
        num: "20",
        date: "24 Nov 2026",
        dayName: "মঙ্গলবার",
        syllabus: "বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী, One Word Substitution, Foreign Words",
        chapters: ["বিশ্বের অন্যান্য গুরুত্বপূর্ণ বিষয়াবলী", "One Word Substitution", "Foreign Words"]
      }
    ];

    return routineList.map((item) => ({
      id: `gke-mt-${item.num}`,
      date: item.date,
      dayName: item.dayName,
      time: "সন্ধ্যা ৬:০০ - রাত ১২:০০ (১০০ মার্কস, ৬০ মিনিট)",
      examName: `MT-${item.num}`,
      subject: "সাধারণ জ্ঞান ও ইংরেজি",
      paper: "জিকে ও ইংলিশ মডেল টেস্ট",
      syllabus: item.syllabus,
      chapters: item.chapters,
      totalMarks: 100,
      durationMinutes: 60,
      status: "upcoming"
    }));
  }

  private static async fetchFromNetwork(
    sheetName: string,
    spreadsheetId: string = SPREADSHEET_ID
  ): Promise<GoogleSheetRoutineItem[]> {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const text = await res.text();
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("Invalid JSON structure in Google Sheets response");
    }
    const jsonStr = text.substring(startIdx, endIdx + 1);
    const data = JSON.parse(jsonStr);

    const rows = data?.table?.rows;
    if (!Array.isArray(rows)) {
      return [];
    }

    const items: GoogleSheetRoutineItem[] = [];

    for (let i = 0; i < rows.length; i++) {
      const c = rows[i]?.c;
      if (!Array.isArray(c) || c.length === 0) continue;

      const rawDate = (c[0]?.f ?? c[0]?.v ?? "").toString().trim();
      const rawDay = (c[1]?.v ?? "").toString().trim();
      const rawExamName = (c[2]?.v ?? "").toString().trim();
      const rawSubject = (c[3]?.v ?? "").toString().trim();
      let rawSyllabus = (c[4]?.v ?? "").toString().trim();
      const rawMarksTime = (c[5]?.v ?? "").toString().trim();

      if (!rawDate && !rawExamName) continue;

      // Auto-enrich Medical GK & English high-yield topics
      if (rawExamName.includes("Med Live 02") && !rawSyllabus.includes("Articles")) {
        rawSyllabus = rawSyllabus.replace("English: Noun, Pronoun", "English: Noun, Pronoun, Articles & Determiners");
      } else if (rawExamName.includes("Med Live 05") && !rawSyllabus.includes("Group Verbs")) {
        rawSyllabus = rawSyllabus.replace("English: Preposition", "English: Appropriate Preposition, Group Verbs");
      } else if (rawExamName.includes("Med Live 10") && !rawSyllabus.includes("ক্ষুদ্র নৃগোষ্ঠী")) {
        rawSyllabus = rawSyllabus.replace("ভৌগোলিক পরিচিতি ও নদ-নদী", "ভৌগোলিক পরিচিতি, ক্ষুদ্র নৃগোষ্ঠী ও নদ-নদী");
      }

      // Parse marks & time (e.g. "৫০ মার্কস (৩০ মিনিট)" or "100 মার্কস (60 মিনিট)")
      let totalMarks = 50;
      let durationMinutes = 30;

      const marksMatch = rawMarksTime.match(/(\d+|[০-৯]+)\s*(?:মার্কস|নম্বর)/);
      if (marksMatch) {
        totalMarks = parseInt(this.toEnglishDigits(marksMatch[1]), 10) || 50;
      }
      const timeMatch = rawMarksTime.match(/(\d+|[০-৯]+)\s*(?:মিনিট|ঘণ্টা)/);
      if (timeMatch) {
        if (rawMarksTime.includes("ঘণ্টা")) {
          durationMinutes = 60;
        } else {
          durationMinutes = parseInt(this.toEnglishDigits(timeMatch[1]), 10) || 30;
        }
      }

      // Parse chapters from syllabus
      const chapters: string[] = [];
      if (rawSyllabus) {
        const parts = rawSyllabus.split(/[;\n]/);
        for (const p of parts) {
          const trimmed = p.trim();
          if (trimmed) chapters.push(trimmed);
        }
      }
      if (chapters.length === 0 && rawSyllabus) {
        chapters.push(rawSyllabus);
      }

      // Status calculation based on current date
      const status: "completed" | "ongoing" | "upcoming" = "upcoming";

      items.push({
        id: `${sheetName.toLowerCase()}-${i + 1}`,
        date: rawDate,
        dayName: rawDay,
        time: rawMarksTime || "রাত ৮:০০ - রাত ১১:০০",
        examName: rawExamName,
        subject: rawSubject,
        paper: rawExamName.includes("Mega") ? "কম্বাইন্ড মেগা টেস্ট" : rawSubject,
        syllabus: rawSyllabus,
        chapters: chapters.length > 0 ? chapters : ["সম্পূর্ণ অধ্যায়"],
        totalMarks,
        durationMinutes,
        status,
      });
    }

    return items;
  }

  private static toEnglishDigits(str: string): string {
    const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replaceAll(bn[i], i.toString());
    }
    return result;
  }
}
