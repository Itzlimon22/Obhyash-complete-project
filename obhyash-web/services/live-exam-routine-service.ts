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

export type TrackKey = "Medical" | "Engineering" | "Varsity_A";

const SPREADSHEET_ID = "1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug";

export class LiveExamRoutineService {
  private static CACHE_KEY_PREFIX = "obhyash_live_routine_";
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  static getSheetNameFromCategory(category: string): TrackKey {
    const cat = category.toLowerCase().trim();
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
      if (items.length > 0 && typeof window !== "undefined") {
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
    } catch (err) {
      console.warn("Failed to fetch routine from Google Sheet, checking cache fallback", err);
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
      return [];
    }
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
