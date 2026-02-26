/**
 * hsc-helpers.ts
 * Synchronous helper functions that derive dropdown data directly from hsc.ts.
 * This is the SINGLE SOURCE OF TRUTH for all subject/chapter/topic lookups
 * across admin, teacher, and bulk upload forms.
 */
import { hscSubjects } from './hsc';

// ─── Subject Aliases (English to Bengali) ────────────────────────────
const SUBJECT_ALIASES: Record<string, string> = {
  // Science
  physics: 'পদার্থবিজ্ঞান',
  chemistry: 'রসায়ন',
  biology: 'জীববিজ্ঞান',
  'higher math': 'উচ্চতর গণিত',
  math: 'উচ্চতর গণিত',
  ict: 'তথ্য ও যোগাযোগ প্রযুক্তি',
  // Humanities/Social
  history: 'ইতিহাস',
  civics: 'পৌরনীতি ও সুশাসন',
  economics: 'অর্থনীতি',
  geography: 'ভূগোল',
  sociology: 'সমাজবিজ্ঞান',
  logic: 'যুক্তিবিদ্যা',
  psychology: 'মনোবিজ্ঞান',
  // Commerce
  accounting: 'হিসাববিজ্ঞান',
  finance: 'ফিন্যান্স',
  management: 'ব্যবস্থাপনা',
  marketing: 'মার্কেটিং',
  // General
  bangla: 'বাংলা',
  english: 'English',
};

function normalizeForMatch(str: string): string {
  return str
    .toLowerCase()
    .replace(/hsc\s+/g, '') // remove hsc prefix
    .replace(/subject:?\s+/g, '') // remove subject prefix
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}

/** Get all HSC subjects as dropdown items */
export function getHscSubjectList(): {
  id: string;
  name: string;
  group: string;
}[] {
  return hscSubjects.map((s) => ({
    id: s.id,
    name: s.name,
    group: s.group,
  }));
}

export function findHscSubject(idOrName: string) {
  const norm = normalizeForMatch(idOrName);

  // Try direct ID match first
  const byId = hscSubjects.find((s) => s.id === idOrName);
  if (byId) return byId;

  // Try Alias match (e.g. "physics" -> "পদার্থবিজ্ঞান")
  let targetName = norm;
  for (const [eng, ben] of Object.entries(SUBJECT_ALIASES)) {
    if (norm.includes(eng)) {
      // If user said "physics 1", we want to search for "পদার্থবিজ্ঞান 1"
      targetName = norm.replace(eng, ben);
      break;
    }
  }

  const targetLower = targetName.toLowerCase();

  return hscSubjects.find((s) => {
    const sNameLower = s.name.toLowerCase();
    return (
      sNameLower === targetLower ||
      sNameLower.includes(targetLower) ||
      targetLower.includes(sNameLower)
    );
  });
}

// ─── Chapters ────────────────────────────────────────────────────────

/** Get chapters for a subject (matched by ID or name) */
export function getHscChapterList(
  subjectIdOrName: string,
): { id: string; name: string }[] {
  const subject = findHscSubject(subjectIdOrName);
  if (!subject) return [];
  return subject.chapters.map((c) => ({ id: c.id, name: c.name }));
}

export function findHscChapter(idOrName: string) {
  const norm = normalizeForMatch(idOrName);
  for (const subject of hscSubjects) {
    const chapter = subject.chapters.find((c) => {
      const cNameLower = c.name.toLowerCase();
      return (
        c.id === idOrName ||
        cNameLower === norm ||
        cNameLower.includes(norm) ||
        norm.includes(cNameLower)
      );
    });
    if (chapter) return { chapter, subject };
  }
  return undefined;
}

// ─── Topics ──────────────────────────────────────────────────────────

/** Get topics for a chapter (matched by ID or name) */
export function getHscTopicList(
  chapterIdOrName: string,
): { id: string; name: string }[] {
  for (const subject of hscSubjects) {
    for (const chapter of subject.chapters) {
      if (
        chapter.id === chapterIdOrName ||
        chapter.name.toLowerCase() === chapterIdOrName.toLowerCase()
      ) {
        return chapter.topics.map((t) => ({ id: t.id, name: t.name }));
      }
    }
  }
  return [];
}

// ─── Resolve helpers (for bulk upload name matching) ─────────────────

/** Resolve a subject name to the canonical hsc.ts name */
export function resolveSubjectName(input: string): string | undefined {
  return findHscSubject(input)?.name;
}

/** Resolve a chapter name to the canonical hsc.ts name (within a subject) */
export function resolveChapterName(
  subjectIdOrName: string,
  chapterInput: string,
): string | undefined {
  const subject = findHscSubject(subjectIdOrName);
  if (!subject) return undefined;
  const lower = chapterInput.toLowerCase();
  const chapter = subject.chapters.find(
    (c) =>
      c.id === chapterInput ||
      c.name.toLowerCase() === lower ||
      c.name.toLowerCase().includes(lower) ||
      lower.includes(c.name.toLowerCase()),
  );
  return chapter?.name;
}

/** Resolve a topic name to the canonical hsc.ts name (within a chapter) */
export function resolveTopicName(
  chapterIdOrName: string,
  topicInput: string,
): string | undefined {
  for (const subject of hscSubjects) {
    for (const chapter of subject.chapters) {
      if (
        chapter.id === chapterIdOrName ||
        chapter.name.toLowerCase() === chapterIdOrName.toLowerCase()
      ) {
        const lower = topicInput.toLowerCase();
        const isSerial = /^\d+$/.test(topicInput.trim());
        const topic = chapter.topics.find((t) => {
          if (isSerial) return t.serial?.toString() === topicInput.trim();
          return (
            t.id === topicInput ||
            t.name.toLowerCase() === lower ||
            t.name.toLowerCase().includes(lower) ||
            lower.includes(t.name.toLowerCase())
          );
        });
        return topic?.name;
      }
    }
  }
  return undefined;
}
