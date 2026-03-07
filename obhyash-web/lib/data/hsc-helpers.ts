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

  // 1. Exact name match (highest priority — avoids substring false positives)
  const exactByName = hscSubjects.find(
    (s) => s.name.toLowerCase() === targetLower,
  );
  if (exactByName) return exactByName;

  // 2. Stored name contains search term (e.g. "পদার্থবিজ্ঞান" matching "পদার্থবিজ্ঞান ১ম পত্র")
  const storedContains = hscSubjects.find((s) =>
    s.name.toLowerCase().includes(targetLower),
  );
  if (storedContains) return storedContains;

  // 3. Search term contains stored name — pick the LONGEST stored name
  //    (prevents short names like "ইতিহাস" from stealing "ইসলামের ইতিহাস ও সংস্কৃতি")
  const termContainsCandidates = hscSubjects.filter((s) =>
    targetLower.includes(s.name.toLowerCase()),
  );
  if (termContainsCandidates.length > 0) {
    return termContainsCandidates.reduce((best, s) =>
      s.name.length > best.name.length ? s : best,
    );
  }

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
  return subject.chapters.map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));
}

export function findHscChapter(idOrName: string) {
  const norm = normalizeForMatch(idOrName);

  // 1. Exact/ID match across all subjects
  for (const subject of hscSubjects) {
    const chapter = subject.chapters.find(
      (c) => c.id === idOrName || c.name.toLowerCase() === norm,
    );
    if (chapter) return { chapter, subject };
  }

  // 2. Stored chapter name contains search term
  for (const subject of hscSubjects) {
    const chapter = subject.chapters.find((c) =>
      c.name.toLowerCase().includes(norm),
    );
    if (chapter) return { chapter, subject };
  }

  // 3. Search term contains stored chapter name — pick LONGEST stored name
  let bestChapterCandidate: { chapter: any; subject: any } | undefined;
  for (const subject of hscSubjects) {
    for (const c of subject.chapters) {
      if (norm.includes(c.name.toLowerCase())) {
        if (
          !bestChapterCandidate ||
          c.name.length > bestChapterCandidate.chapter.name.length
        ) {
          bestChapterCandidate = { chapter: c, subject };
        }
      }
    }
  }
  if (bestChapterCandidate) return bestChapterCandidate;

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
  return chapterInfo.chapter.topics.map((t: { id: any; name: any }) => ({
    id: t.id,
    name: t.name,
  }));
}

export function findHscTopic(idOrName: string, chapterIdOrName?: string) {
  const norm = normalizeForMatch(idOrName);

  // If chapter is provided, search within it first
  if (chapterIdOrName) {
    const chapterInfo = findHscChapter(chapterIdOrName);
    if (chapterInfo) {
      // Exact/Include Match
      let topic = chapterInfo.chapter.topics.find(
        (t: { id: string; name: string }) =>
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

  // Global exact/ID/serial match
  for (const subject of hscSubjects) {
    for (const chapter of subject.chapters) {
      const topic = chapter.topics.find((t) => {
        const tNameNorm = normalizeForMatch(t.name);
        return (
          t.id === idOrName ||
          tNameNorm === norm ||
          (t as any).serial?.toString() === norm
        );
      });
      if (topic) return { topic, chapter, subject };
    }
  }

  // Global stored-name-contains-search-term match
  for (const subject of hscSubjects) {
    for (const chapter of subject.chapters) {
      const topic = chapter.topics.find((t) =>
        normalizeForMatch(t.name).includes(norm),
      );
      if (topic) return { topic, chapter, subject };
    }
  }

  // Global search-term-contains-stored-name match — pick LONGEST
  let bestTermContains: { topic: any; chapter: any; subject: any } | undefined;
  for (const subject of hscSubjects) {
    for (const chapter of subject.chapters) {
      for (const t of chapter.topics) {
        if (norm.includes(normalizeForMatch(t.name))) {
          if (
            !bestTermContains ||
            t.name.length > bestTermContains.topic.name.length
          ) {
            bestTermContains = { topic: t, chapter, subject };
          }
        }
      }
    }
  }
  if (bestTermContains) return bestTermContains;

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

    // 1. Exact/ID match
    let chapter = subject.chapters.find((c: { name: string; id: string }) => {
      return c.id === chapterInput || normalizeForMatch(c.name) === norm;
    });
    if (chapter) return chapter.name;

    // 2. Stored name contains search term
    chapter = subject.chapters.find((c: { name: string; id: string }) =>
      normalizeForMatch(c.name).includes(norm),
    );
    if (chapter) return chapter.name;

    // 3. Search term contains stored name — pick LONGEST
    const candidates = subject.chapters.filter(
      (c: { name: string; id: string }) =>
        norm.includes(normalizeForMatch(c.name)),
    );
    if (candidates.length > 0) {
      const best = candidates.reduce(
        (a: { name: string }, b: { name: string }) =>
          b.name.length > a.name.length ? b : a,
      );
      return best.name;
    }

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

      // 1. Exact/ID/serial match
      let topic = chapterInfo.chapter.topics.find(
        (t: { name: string; id: string }) => {
          const tNameNorm = normalizeForMatch(t.name);
          return (
            t.id === topicInput ||
            tNameNorm === norm ||
            (t as any).serial?.toString() === norm
          );
        },
      );
      if (topic) return topic.name;

      // 2. Stored name contains search term
      topic = chapterInfo.chapter.topics.find(
        (t: { name: string; id: string }) =>
          normalizeForMatch(t.name).includes(norm),
      );
      if (topic) return topic.name;

      // 3. Search term contains stored name — pick LONGEST
      const candidates = chapterInfo.chapter.topics.filter(
        (t: { name: string; id: string }) =>
          norm.includes(normalizeForMatch(t.name)),
      );
      if (candidates.length > 0) {
        const best = candidates.reduce(
          (a: { name: string }, b: { name: string }) =>
            b.name.length > a.name.length ? b : a,
        );
        return best.name;
      }
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
