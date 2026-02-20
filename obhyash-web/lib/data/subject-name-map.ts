/**
 * Static map of subject IDs → Bengali display names.
 * Used by services to resolve human-readable labels without importing icon-heavy data files.
 */
export const SUBJECT_NAME_MAP: Record<string, string> = {
  // General
  hsc_bangla_1: 'বাংলা ১ম পত্র',
  hsc_bangla_2: 'বাংলা ২য় পত্র',
  hsc_english_1: 'ইংরেজি ১ম পত্র',
  hsc_english_2: 'ইংরেজি ২য় পত্র',
  hsc_ict: 'তথ্য ও যোগাযোগ প্রযুক্তি',

  // Science
  hsc_physics_1: 'পদার্থবিজ্ঞান ১ম পত্র',
  hsc_physics_2: 'পদার্থবিজ্ঞান ২য় পত্র',
  hsc_chemistry_1: 'রসায়ন ১ম পত্র',
  hsc_chemistry_2: 'রসায়ন ২য় পত্র',
  hsc_biology_1: 'জীববিজ্ঞান ১ম পত্র',
  hsc_biology_2: 'জীববিজ্ঞান ২য় পত্র',
  hsc_higher_math_1: 'উচ্চতর গণিত ১ম পত্র',
  hsc_higher_math_2: 'উচ্চতর গণিত ২য় পত্র',

  // Commerce
  hsc_accounting_1: 'হিসাববিজ্ঞান ১ম পত্র',
  hsc_accounting_2: 'হিসাববিজ্ঞান ২য় পত্র',
  hsc_business_org_1: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম পত্র',
  hsc_business_org_2: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য় পত্র',
  hsc_finance_1: 'ফিন্যান্স, ব্যাংকিং ও বিমা ১ম পত্র',
  hsc_finance_2: 'ফিন্যান্স, ব্যাংকিং ও বিমা ২য় পত্র',

  // Humanities
  hsc_economics_1: 'অর্থনীতি ১ম পত্র',
  hsc_economics_2: 'অর্থনীতি ২য় পত্র',
  hsc_civics_1: 'পৌরনীতি ও সুশাসন ১ম পত্র',
  hsc_civics_2: 'পৌরনীতি ও সুশাসন ২য় পত্র',
  hsc_history_1: 'ইতিহাস ১ম পত্র',
  hsc_history_2: 'ইতিহাস ২য় পত্র',
  hsc_sociology_1: 'সমাজবিজ্ঞান ১ম পত্র',
  hsc_sociology_2: 'সমাজবিজ্ঞান ২য় পত্র',
  hsc_social_work_1: 'সমাজকর্ম ১ম পত্র',
  hsc_social_work_2: 'সমাজকর্ম ২য় পত্র',
  hsc_logic_1: 'যুক্তিবিদ্যা ১ম পত্র',
  hsc_logic_2: 'যুক্তিবিদ্যা ২য় পত্র',
  hsc_psychology_1: 'মনোবিজ্ঞান ১ম পত্র',
  hsc_psychology_2: 'মনোবিজ্ঞান ২য় পত্র',
  hsc_islamic_studies_1: 'ইসলামের ইতিহাস ও সংস্কৃতি ১ম পত্র',
  hsc_islamic_studies_2: 'ইসলামের ইতিহাস ও সংস্কৃতি ২য় পত্র',
  hsc_geography_1: 'ভূগোল ১ম পত্র',
  hsc_geography_2: 'ভূগোল ২য় পত্র',
};

/**
 * Returns the Bengali display name for a subject ID, or falls back to the raw ID.
 */
export function getSubjectDisplayName(subjectId: string): string {
  return SUBJECT_NAME_MAP[subjectId] || subjectId;
}
