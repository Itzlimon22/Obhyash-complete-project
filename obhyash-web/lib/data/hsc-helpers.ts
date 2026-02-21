/**
 * hsc-helpers.ts
 * Synchronous helper functions that derive dropdown data directly from hsc.ts.
 * This is the SINGLE SOURCE OF TRUTH for all subject/chapter/topic lookups
 * across admin, teacher, and bulk upload forms.
 */
import { hscSubjects } from './hsc';

// ─── Subjects ────────────────────────────────────────────────────────

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

/** Find a subject by ID or by name (case-insensitive, partial match) */
export function findHscSubject(idOrName: string) {
  const lower = idOrName.toLowerCase();
  return hscSubjects.find(
    (s) =>
      s.id === idOrName ||
      s.name.toLowerCase() === lower ||
      s.name.toLowerCase().includes(lower) ||
      lower.includes(s.name.toLowerCase()),
  );
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

/** Find a chapter by ID or by name across all subjects */
export function findHscChapter(idOrName: string) {
  const lower = idOrName.toLowerCase();
  for (const subject of hscSubjects) {
    const chapter = subject.chapters.find(
      (c) =>
        c.id === idOrName ||
        c.name.toLowerCase() === lower ||
        c.name.toLowerCase().includes(lower) ||
        lower.includes(c.name.toLowerCase()),
    );
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
