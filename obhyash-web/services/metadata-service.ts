import { supabase, isSupabaseConfigured } from './core';
import { SUBJECT_METADATA, SubjectMetadata } from '@/lib/mock-data';
export { SUBJECT_METADATA };
export type { SubjectMetadata };

const SUBJECT_ICONS: Record<string, string> = {
  Physics: '⚛️',
  Chemistry: '🧪',
  Math: '📐',
  Biology: '🧬',
  Bangla: '📚',
  English: '📝',
  GK: '🌍',
  ICT: '💻',
};

// Helper to get subjects based on group (Science, Arts, Commerce) and stream (HSC, Admission)
export const getSubjects = async (
  group?: string,
  stream?: string,
  optionalSubject?: string,
): Promise<
  { id: string; name: string; label?: string; icon?: string; group?: string }[]
> => {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('subjects').select('*');

    // Filter by Group (Science, Arts, Commerce) OR General (Mapped to division column)
    if (group && group !== 'General') {
      console.log(
        `[getSubjects] Filtering by Division (Group): ${group} OR General`,
      );
      query = query.or(`division.eq.${group},division.eq.General`);
    }

    // Filter by Stream (HSC, Admission) - if provided
    // Show subjects that match the stream OR contain NULL (applicable to all streams)
    if (stream) {
      console.log(`[getSubjects] Filtering by Stream: ${stream} OR NULL`);
      query = query.or(`stream.eq.${stream},stream.is.null`);
    }

    // FUTURE: If subjects table supports 'section' column, we can filter here.
    // currently schema doesn't have 'section' in subjects, so we skip DB filtering for section.
    // if (section) { query = query.eq('section', section); }

    const { data, error } = await query;
    console.log(
      `[getSubjects] Result count: ${data?.length || 0}`,
      error ? `Error: ${error.message}` : '',
    );
    if (!error && data) {
      // Optional Subject Filtering Logic
      const filteredData = data.filter((subject) => {
        const subName = (subject.name_en || subject.name || '').toLowerCase();
        const subId = (subject.id || '').toLowerCase();

        const isBiology =
          subName.includes('biology') || subId.includes('biology');
        const isStatistics =
          subName.includes('statistics') || subId.includes('statistics');

        if (optionalSubject === 'Statistics') {
          // User wants Statistics: Hide Biology
          if (isBiology) return false;
        } else {
          // User wants Biology (or default): Hide Statistics
          if (isStatistics) return false;
        }
        return true;
      });

      // Enrich with icons
      return filteredData.map((s) => ({
        ...s,
        icon: s.icon || SUBJECT_ICONS[s.name] || SUBJECT_ICONS[s.id] || '📘',
      }));
    }
  }

  // Fallback Mock Logic
  await new Promise((r) => setTimeout(r, 200));

  // Transform MOCK metadata to array
  const subjects = Object.keys(SUBJECT_METADATA).map((key) => ({
    id: key,
    name:
      key === 'Physics'
        ? 'পদার্থবিজ্ঞান'
        : key === 'Chemistry'
          ? 'রসায়ন'
          : key === 'Math'
            ? 'গণিত'
            : key,
    label:
      key === 'Physics'
        ? 'পদার্থবিজ্ঞান (Physics)'
        : key === 'Chemistry'
          ? 'রসায়ন (Chemistry)'
          : key === 'Math'
            ? 'গণিত (Math)'
            : key,
    icon: SUBJECT_ICONS[key] || '📘',
    group: ['Physics', 'Chemistry', 'Math', 'Biology'].includes(key)
      ? 'Science'
      : 'General',
  }));

  if (group && group !== 'General') {
    return subjects.filter((s) => s.group === group || s.group === 'General');
  }
  return subjects;
};

export const getChapters = async (
  subjectId: string,
): Promise<{ id: string; name: string }[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', subjectId);

    if (!error && data) return data;
  }

  await new Promise((r) => setTimeout(r, 200));
  // Mock fallback: generate fake IDs for strings
  const names = SUBJECT_METADATA[subjectId]?.chapters || [];
  return names.map((name, i) => ({ id: `${subjectId}-ch-${i}`, name }));
};

export const getTopics = async (
  chapterId: string,
): Promise<{ id: string; name: string }[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('topics')
      .select('id, name')
      .eq('chapter_id', chapterId);

    if (!error && data) return data;
  }
  await new Promise((r) => setTimeout(r, 200));
  // Mock fallback: return empty or try to reverse map ID to name if possible,
  // but for mock we can just return empty or generic topics if strictly using IDs.
  // Since we don't assume mock structure uses IDs, we might return empty here or some dummy data.
  // Let's try to parse the mock ID if it matches our pattern, otherwise empty.
  // Actually, for the "database connectivity" task, we assume DB is primary.
  return [];
};

export const getExamTypes = async (): Promise<
  { id: string; name: string }[]
> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('question_exam_types')
      .select('id, name');

    if (!error && data) return data;
  }
  // Mock fallback
  return [
    { id: 'Academic', name: 'Academic' },
    { id: 'Medical', name: 'Medical' },
    { id: 'Engineering', name: 'Engineering' },
    { id: 'University', name: 'University' },
  ];
};

export const getSubjectMetadata = async (
  subjectId: string,
): Promise<SubjectMetadata | null> => {
  // Legacy support or detailed fetch
  if (isSupabaseConfigured() && supabase) {
    // ...
  }
  await new Promise((r) => setTimeout(r, 200));
  return SUBJECT_METADATA[subjectId] || null;
};
