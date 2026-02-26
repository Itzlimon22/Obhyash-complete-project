import {
  getSubjects,
  getChapters,
  getTopics,
} from '@/services/metadata-service';

export interface AcademicResolution {
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
}

/**
 * Resolves a subject name, chapter name, and topic name into their corresponding database IDs.
 * Used during bulk upload to normalize "Relational Taxonomy".
 */
export async function resolveAcademicIds(
  subjectName: string,
  chapterName?: string,
  topicName?: string,
): Promise<AcademicResolution> {
  const resolution: AcademicResolution = {};

  if (!subjectName) return resolution;

  try {
    const subjects = await getSubjects();

    // 1. Try Bottom-Up: Topic -> Chapter -> Subject
    if (topicName) {
      for (const s of subjects) {
        const chapters = await getChapters(s.id);
        const topics = await getTopics(chapters.map((c) => c.id));
        const targetTopic = topics.find(
          (t) =>
            t.name.trim().toLowerCase() === topicName.trim().toLowerCase() ||
            t.id.trim().toLowerCase() === topicName.trim().toLowerCase(),
        );
        if (targetTopic) {
          return {
            subjectId: s.id,
            chapterId: targetTopic.chapter_id,
            topicId: targetTopic.id,
          };
        }
      }
    }

    // 2. Try Mid-Level Bottom-Up: Chapter -> Subject
    if (chapterName) {
      for (const s of subjects) {
        const chapters = await getChapters(s.id);
        const targetChapter = chapters.find(
          (c) =>
            c.name.trim().toLowerCase() === chapterName.trim().toLowerCase() ||
            c.id.trim().toLowerCase() === chapterName.trim().toLowerCase(),
        );

        if (targetChapter) {
          resolution.subjectId = s.id;
          resolution.chapterId = targetChapter.id;

          if (topicName) {
            const topics = await getTopics(targetChapter.id);
            const targetTopic = topics.find(
              (t) =>
                t.name.trim().toLowerCase() ===
                  topicName.trim().toLowerCase() ||
                t.id.trim().toLowerCase() === topicName.trim().toLowerCase(),
            );
            if (targetTopic) resolution.topicId = targetTopic.id;
          }
          return resolution;
        }
      }
    }

    // 3. Fallback: Subject-first resolution (Top-Down)
    const targetSubject = subjects.find(
      (s) =>
        s.name.trim().toLowerCase() === subjectName.trim().toLowerCase() ||
        s.id.trim().toLowerCase() === subjectName.trim().toLowerCase() ||
        s.label?.trim().toLowerCase() === subjectName.trim().toLowerCase(),
    );

    if (targetSubject) {
      resolution.subjectId = targetSubject.id;
      if (chapterName) {
        const chapters = await getChapters(targetSubject.id);
        const targetChapter = chapters.find(
          (c) =>
            c.name.trim().toLowerCase() === chapterName.trim().toLowerCase() ||
            c.id.trim().toLowerCase() === chapterName.trim().toLowerCase(),
        );
        if (targetChapter) {
          resolution.chapterId = targetChapter.id;
          if (topicName) {
            const topics = await getTopics(targetChapter.id);
            const targetTopic = topics.find(
              (t) =>
                t.name.trim().toLowerCase() ===
                  topicName.trim().toLowerCase() ||
                t.id.trim().toLowerCase() === topicName.trim().toLowerCase(),
            );
            if (targetTopic) resolution.topicId = targetTopic.id;
          }
        }
      }
    }
  } catch (error) {
    console.error('[resolveAcademicIds] Error:', error);
  }

  return resolution;
}
