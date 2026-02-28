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
  const chapterInfo = findHscChapter(chapterIdOrName);
  if (!chapterInfo) return [];
  return chapterInfo.chapter.topics.map((t) => ({ id: t.id, name: t.name }));
}

export function findHscTopic(idOrName: string, chapterIdOrName?: string) {
  const norm = normalizeForMatch(idOrName);

  // If chapter is provided, search within it first
  if (chapterIdOrName) {
    const chapterInfo = findHscChapter(chapterIdOrName);
    if (chapterInfo) {
      const topic = chapterInfo.chapter.topics.find(
        (t) =>
          t.id === idOrName ||
          normalizeForMatch(t.name) === norm ||
          normalizeForMatch(t.name).includes(norm),
      );
      if (topic)
        return {
          topic,
          chapter: chapterInfo.chapter,
          subject: chapterInfo.subject,
        };
    }
  }

  // Global search
  for (const subject of hscSubjects) {
    for (const chapter of subject.chapters) {
      const topic = chapter.topics.find((t) => {
        const tNameNorm = normalizeForMatch(t.name);
        return (
          t.id === idOrName ||
          tNameNorm === norm ||
          tNameNorm.includes(norm) ||
          norm.includes(tNameNorm)
        );
      });
      if (topic) return { topic, chapter, subject };
    }
  }
  return undefined;
}

// ─── Resolve helpers (for bulk upload name matching) ─────────────────

/** Resolve a subject name to the canonical hsc.ts name */
export function resolveSubjectName(input: string): string | undefined {
  return findHscSubject(input)?.name;
}

/** Resolve a chapter name to the canonical hsc.ts name (robust resolution) */
export function resolveChapterName(
  subjectInput: string,
  chapterInput: string,
): string | undefined {
  if (!chapterInput) return undefined;

  // Try finding chapter within the suggested subject first
  const subject = findHscSubject(subjectInput);
  if (subject) {
    const norm = normalizeForMatch(chapterInput);
    const chapter = subject.chapters.find((c) => {
      const cNameNorm = normalizeForMatch(c.name);
      return (
        c.id === chapterInput ||
        cNameNorm === norm ||
        cNameNorm.includes(norm) ||
        norm.includes(cNameNorm)
      );
    });
    if (chapter) return chapter.name;
    // Do not fall back to global search if subject was explicitly provided
    return undefined;
  }

  // If subject not provided or found, search GLOBALLY
  return findHscChapter(chapterInput)?.chapter.name;
}

/** Resolve a topic name to the canonical hsc.ts name (robust resolution) */
export function resolveTopicName(
  chapterInput: string,
  topicInput: string,
): string | undefined {
  if (!topicInput) return undefined;

  if (chapterInput) {
    const chapterInfo = findHscChapter(chapterInput);
    if (chapterInfo) {
      const norm = normalizeForMatch(topicInput);
      const topic = chapterInfo.chapter.topics.find((t) => {
        const tNameNorm = normalizeForMatch(t.name);
        return (
          t.id === topicInput ||
          tNameNorm === norm ||
          tNameNorm.includes(norm) ||
          norm.includes(tNameNorm)
        );
      });
      if (topic) return topic.name;
    }
    // Do not fall back to global search if chapter was explicitly provided
    return undefined;
  }

  return findHscTopic(topicInput)?.topic.name;
}

/**
 * Perform a full hierarchy resolution (Subject -> Chapter -> Topic).
 * This is the ultimate "fix-all" for taxonomy mapping.
 */
export function resolveTaxonomyHierarchy(
  subjInp: string,
  chapInp: string,
  topInp: string,
): { subject: string; chapter: string; topic: string } {
  // Normalize inputs
  const subjectInput = subjInp?.trim() || '';
  const chapterInput = chapInp?.trim() || '';
  const topicInput = topInp?.trim() || '';

  let finalSubject = subjectInput;
  let finalChapter = chapterInput;
  let finalTopic = topicInput;

  // 1. Try to establish Subject
  const resolvedSubj = resolveSubjectName(subjectInput);
  if (resolvedSubj) {
    finalSubject = resolvedSubj;
  }

  // 2. Try to establish Chapter based on Subject
  if (finalSubject && chapterInput) {
    const resolvedChap = resolveChapterName(finalSubject, chapterInput);
    if (resolvedChap) {
      finalChapter = resolvedChap;
    }
  } else if (!finalSubject && chapterInput) {
    // Glob search chapter
    const chapRes = findHscChapter(chapterInput);
    if (chapRes) {
      finalSubject = chapRes.subject.name;
      finalChapter = chapRes.chapter.name;
    }
  }

  // 3. Try to establish Topic based on Chapter
  if (finalChapter && topicInput) {
    const resolvedTop = resolveTopicName(finalChapter, topicInput);
    if (resolvedTop) {
      finalTopic = resolvedTop;
    }
  } else if (!finalChapter && topicInput) {
    // Glob search topic
    const topRes = findHscTopic(topicInput);
    if (topRes) {
      finalSubject = topRes.subject.name;
      finalChapter = topRes.chapter.name;
      finalTopic = topRes.topic.name;
    }
  }

  return { subject: finalSubject, chapter: finalChapter, topic: finalTopic };
}
