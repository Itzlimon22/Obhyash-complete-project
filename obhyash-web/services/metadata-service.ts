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

// Helper to get subjects based on group (Science, Humanities, Business Studies) and stream (HSC, Admission)
export const getSubjects = async (
  group?: string,
  stream?: string,
  optionalSubject?: string,
): Promise<
  { id: string; name: string; label?: string; icon?: string; group?: string }[]
> => {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('subjects').select('*');

    // Filter by Group (Science, Humanities, Business Studies) OR General (Mapped to division column)
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
      // Use ilike to allow partial matches (e.g., "HSC" will match "HSC, Admission")
      query = query.or(`stream.ilike.%${stream}%,stream.is.null`);
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

      // Deduplicate subjects by name to prevent "Chemistry Ch 1" appearing twice
      // if multiple entries exist with the same name in the database.
      const uniqueSubjects = new Map<string, any>();
      filteredData.forEach((s) => {
        const name = s.name || s.name_en || '';
        if (name && !uniqueSubjects.has(name)) {
          uniqueSubjects.set(name, s);
        }
      });

      // Enrich with icons
      return Array.from(uniqueSubjects.values()).map((s) => ({
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
      .eq('subject_id', subjectId)
      .order('name'); // Optional: order alphabetically

    if (!error && data) return data;
    console.error('Error fetching chapters:', error);
  }

  // Fallback to mock only if DB fails or not configured
  await new Promise((r) => setTimeout(r, 200));
  const names = SUBJECT_METADATA[subjectId]?.chapters || [];
  return names.map((name, i) => ({ id: `${subjectId}-ch-${i}`, name }));
};

export const getTopics = async (
  chapterIds: string | string[],
): Promise<
  { id: string; name: string; chapter_id: string; serial?: number }[]
> => {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('topics').select('id, name, chapter_id, serial');

    if (Array.isArray(chapterIds)) {
      if (chapterIds.length === 0) return [];
      query = query.in('chapter_id', chapterIds);
    } else {
      query = query.eq('chapter_id', chapterIds);
    }

    const { data, error } = await query;

    if (!error && data) return data;
    console.error('Error fetching topics:', error);
  }

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
  // Prefer fetching fresh data from DB now
  if (isSupabaseConfigured() && supabase) {
    const chapters = await getChapters(subjectId);
    const metadata: SubjectMetadata = {
      chapters: chapters.map((c) => c.name), // Legacy format expects strings
      topics: {},
    };

    // Fetch topics for all chapters in parallel (or optimized query)
    // For legacy structure, we need a map of Chapter Name -> Topic Names array
    // This is expensive if we do it one by one.
    // Better approach: fetch all topics for these chapters.
    const chapterIds = chapters.map((c) => c.id);
    const allTopics = await getTopics(chapterIds);

    chapters.forEach((ch) => {
      const chTopics = allTopics.filter((t) => t.chapter_id === ch.id);
      metadata.topics[ch.name] = chTopics.map((t) => t.name);
    });

    return metadata;
  }

  await new Promise((r) => setTimeout(r, 200));
  return SUBJECT_METADATA[subjectId] || null;
};
