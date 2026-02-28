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
  return (
    str
      .toLowerCase()
      .replace(/hsc\s+/g, '') // remove hsc prefix
      .replace(/subject:?\s+/g, '') // remove subject prefix
      // Normalize Bengali characters
      .replace(/য়/g, 'য়')
      .replace(/ড়/g, 'ড়')
      .replace(/ঢ়/g, 'ঢ়')
      // and sometimes spaces are typed strangely
      .replace(/\s+/g, ' ') // collapse spaces
      .trim()
  );
}

// ─── Fuzzy Matching Algorithm ────────────────────────────────────────
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

function getSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

// Special check to avoid confusing 1st and 2nd papers/parts
function hasSafeNumberMatch(inputStr: string, matchStr: string): boolean {
  const isPaper1 = /(1|১|১ম|1st|first)/i.test(inputStr);
  const isPaper2 = /(2|২|২য়|2nd|second)/i.test(inputStr);

  const matchHas1 = /(1|১|১ম|1st|first)/i.test(matchStr);
  const matchHas2 = /(2|২|২য়|2nd|second)/i.test(matchStr);

  if (isPaper1 && !matchHas1) return false;
  if (isPaper2 && !matchHas2) return false;
  if (!isPaper1 && !isPaper2 && (matchHas1 || matchHas2)) return false;

  return true;
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

  const exactMatch = hscSubjects.find((s) => {
    const sNameLower = s.name.toLowerCase();
    return (
      sNameLower === targetLower ||
      sNameLower.includes(targetLower) ||
      targetLower.includes(sNameLower)
    );
  });

  if (exactMatch) return exactMatch;

  // Fallback to Fuzzy Search (80% similarity threshold)
  let bestMatch: any = undefined;
  let highestScore = 0;

  for (const s of hscSubjects) {
    const sNameLower = s.name.toLowerCase();
    const score = getSimilarity(targetLower, sNameLower);

    if (
      score > highestScore &&
      score >= 0.8 &&
      hasSafeNumberMatch(targetLower, sNameLower)
    ) {
      highestScore = score;
      bestMatch = s;
    }
  }

  return bestMatch;
}

// ─── Chapters ────────────────────────────────────────────────────────

/** Get chapters for a subject (matched by ID or name) */
export function getHscChapterList(
  subjectIdOrName: string,
): { id: string; name: string }[] {
  const subject = findHscSubject(subjectIdOrName);
  if (!subject) return [];
  return subject.chapters.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }));
}

export function findHscChapter(idOrName: string) {
  const norm = normalizeForMatch(idOrName);

  // Exact/Include Match
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

  // Fuzzy Match (80% similarity threshold)
  let bestMatch: any = undefined;
  let highestScore = 0;

  for (const subject of hscSubjects) {
    for (const c of subject.chapters) {
      if (c.id === idOrName) continue; // Already checked
      const cNameLower = c.name.toLowerCase();
      const score = getSimilarity(norm, cNameLower);

      if (
        score > highestScore &&
        score >= 0.8 &&
        hasSafeNumberMatch(norm, cNameLower)
      ) {
        highestScore = score;
        bestMatch = { chapter: c, subject };
      }
    }
  }

  return bestMatch;
}

// ─── Topics ──────────────────────────────────────────────────────────

/** Get topics for a chapter (matched by ID or name) */
export function getHscTopicList(
  chapterIdOrName: string,
): { id: string; name: string }[] {
  const chapterInfo = findHscChapter(chapterIdOrName);
  if (!chapterInfo) return [];
  return chapterInfo.chapter.topics.map((t: { id: any; name: any; }) => ({ id: t.id, name: t.name }));
}

export function findHscTopic(idOrName: string, chapterIdOrName?: string) {
  const norm = normalizeForMatch(idOrName);

  // If chapter is provided, search within it first
  if (chapterIdOrName) {
    const chapterInfo = findHscChapter(chapterIdOrName);
    if (chapterInfo) {
      // Exact/Include Match
      let topic = chapterInfo.chapter.topics.find(
        (t: { id: string; name: string; }) =>
          t.id === idOrName ||
          normalizeForMatch(t.name) === norm ||
          normalizeForMatch(t.name).includes(norm) ||
          (t as any).serial?.toString() === norm,
      );

      if (topic) {
        return {
          topic,
          chapter: chapterInfo.chapter,
          subject: chapterInfo.subject,
        };
      }

      // Fuzzy Match within chapter (80% similarity threshold)
      let bestMatch: any = undefined;
      let highestScore = 0;

      for (const t of chapterInfo.chapter.topics) {
        if (t.id === idOrName || (t as any).serial?.toString() === norm)
          continue;
        const tNameNorm = normalizeForMatch(t.name);
        const score = getSimilarity(norm, tNameNorm);

        if (
          score > highestScore &&
          score >= 0.8 &&
          hasSafeNumberMatch(norm, tNameNorm)
        ) {
          highestScore = score;
          bestMatch = t;
        }
      }

      if (bestMatch) {
        return {
          topic: bestMatch,
          chapter: chapterInfo.chapter,
          subject: chapterInfo.subject,
        };
      }
    }
  }

  // Global Exact/Include search
  for (const subject of hscSubjects) {
    for (const chapter of subject.chapters) {
      const topic = chapter.topics.find((t) => {
        const tNameNorm = normalizeForMatch(t.name);
        return (
          t.id === idOrName ||
          tNameNorm === norm ||
          tNameNorm.includes(norm) ||
          norm.includes(tNameNorm) ||
          (t as any).serial?.toString() === norm
        );
      });
      if (topic) return { topic, chapter, subject };
    }
  }

  // Global Fuzzy search (80% similarity threshold)
  let bestGlobalMatch: any = undefined;
  let highestGlobalScore = 0;

  for (const subject of hscSubjects) {
    for (const chapter of subject.chapters) {
      for (const t of chapter.topics) {
        if (t.id === idOrName || (t as any).serial?.toString() === norm)
          continue;
        const tNameNorm = normalizeForMatch(t.name);
        const score = getSimilarity(norm, tNameNorm);

        if (
          score > highestGlobalScore &&
          score >= 0.8 &&
          hasSafeNumberMatch(norm, tNameNorm)
        ) {
          highestGlobalScore = score;
          bestGlobalMatch = { topic: t, chapter, subject };
        }
      }
    }
  }

  return bestGlobalMatch;
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
    const chapter = subject.chapters.find((c: { name: string; id: string; }) => {
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
      const topic = chapterInfo.chapter.topics.find((t: { name: string; id: string; }) => {
        const tNameNorm = normalizeForMatch(t.name);
        return (
          t.id === topicInput ||
          tNameNorm === norm ||
          tNameNorm.includes(norm) ||
          norm.includes(tNameNorm) ||
          (t as any).serial?.toString() === norm
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
