/**
 * Live Exam Controls Service (Database-driven configuration)
 * Obhyash Smart Prep Platform
 */

import { supabase } from "./core";

export interface LiveExamTrackConfig {
  key: string;
  label: string;
  badge: string;
  color: string;
  has_routine: boolean;
}

export interface LiveExamControlsConfig {
  id: string;
  is_enabled: boolean;
  maintenance_message: string;
  routine_spreadsheet_id: string;
  routine_sheet_mapping: Record<string, string>;
  available_tracks: LiveExamTrackConfig[];
  anti_cheat_enabled: boolean;
  max_tab_switches: number;
  default_negative_marking: number;
  allow_practice_mode: boolean;
  show_routine_button: boolean;
  active_announcement_enabled: boolean;
  active_announcement_text: string;
}

export const DEFAULT_LIVE_EXAM_CONTROLS: LiveExamControlsConfig = {
  id: "global_live_exam_controls",
  is_enabled: true,
  maintenance_message: "লাইভ এক্সাম সিস্টেম সাময়িকভাবে রক্ষণাবেক্ষণে রয়েছে। শীঘ্রই পরীক্ষা পুনরায় চালু হবে।",
  routine_spreadsheet_id: "1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug",
  routine_sheet_mapping: {
    medical: "Medical",
    engineering: "Engineering",
    varsity: "Varsity_A",
    hsc: "HSC",
    ssc: "SSC",
  },
  available_tracks: [
    { key: "Medical", label: "মেডিকেল ভর্তি", badge: "MBBS ২০২৬-২৭", color: "from-emerald-500 to-teal-600", has_routine: true },
    { key: "Engineering", label: "ইঞ্জিনিয়ারিং", badge: "BUET/CKRUET", color: "from-blue-500 to-indigo-600", has_routine: true },
    { key: "Varsity_A", label: "ঢাবি 'ক' ইউনিট", badge: "DU Science", color: "from-amber-500 to-orange-600", has_routine: true },
    { key: "HSC", label: "এইচএসসি স্পেশাল", badge: "HSC Board Prep", color: "from-purple-500 to-indigo-600", has_routine: false },
    { key: "SSC", label: "এসএসসি স্পেশাল", badge: "SSC Board Prep", color: "from-rose-500 to-red-600", has_routine: false },
  ],
  anti_cheat_enabled: true,
  max_tab_switches: 2,
  default_negative_marking: 0.25,
  allow_practice_mode: true,
  show_routine_button: true,
  active_announcement_enabled: false,
  active_announcement_text: "",
};

let cachedControls: LiveExamControlsConfig = { ...DEFAULT_LIVE_EXAM_CONTROLS };
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export class LiveExamControlsService {
  static async getControls(): Promise<LiveExamControlsConfig> {
    if (Date.now() - lastFetchTime < CACHE_TTL_MS && lastFetchTime > 0) {
      return cachedControls;
    }

    try {
      const { data, error } = await supabase
        .from("live_exam_controls")
        .select("*")
        .eq("id", "global_live_exam_controls")
        .maybeSingle();

      if (!error && data) {
        cachedControls = {
          ...DEFAULT_LIVE_EXAM_CONTROLS,
          ...data,
          routine_sheet_mapping: data.routine_sheet_mapping || DEFAULT_LIVE_EXAM_CONTROLS.routine_sheet_mapping,
          available_tracks: data.available_tracks || DEFAULT_LIVE_EXAM_CONTROLS.available_tracks,
        };
        lastFetchTime = Date.now();
      }
    } catch {
      // Graceful fallback to default controls
    }

    return cachedControls;
  }

  static getSheetName(category: string, config?: LiveExamControlsConfig): string {
    const controls = config || cachedControls;
    const cat = category.toLowerCase().trim();
    const mapping = controls.routine_sheet_mapping || DEFAULT_LIVE_EXAM_CONTROLS.routine_sheet_mapping;

    for (const [key, value] of Object.entries(mapping)) {
      if (cat.includes(key)) {
        return value;
      }
    }
    return "Medical";
  }

  static hasRoutine(category: string, config?: LiveExamControlsConfig): boolean {
    const controls = config || cachedControls;
    const cat = category.toLowerCase().trim();
    const tracks = controls.available_tracks || DEFAULT_LIVE_EXAM_CONTROLS.available_tracks;

    for (const t of tracks) {
      if (cat.includes(t.key.toLowerCase())) {
        return t.has_routine;
      }
    }

    // Check mapping
    const mapping = controls.routine_sheet_mapping || DEFAULT_LIVE_EXAM_CONTROLS.routine_sheet_mapping;
    for (const [key, sheetName] of Object.entries(mapping)) {
      if (cat.includes(key)) {
        const match = tracks.find((t) => t.key.toLowerCase() === sheetName.toLowerCase());
        if (match) return match.has_routine;
      }
    }

    return false;
  }
}
