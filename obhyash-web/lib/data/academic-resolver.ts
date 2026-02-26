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
    // 1. Resolve Subject
    // We fetch all subjects and find the closest match (normalize capitalization and spacing)
    const subjects = await getSubjects();
    const targetSubject = subjects.find(
      (s) =>
        s.name.trim().toLowerCase() === subjectName.trim().toLowerCase() ||
        s.id.trim().toLowerCase() === subjectName.trim().toLowerCase() ||
        s.label?.trim().toLowerCase() === subjectName.trim().toLowerCase(),
    );

    if (targetSubject) {
      resolution.subjectId = targetSubject.id;

      // 2. Resolve Chapter
      if (chapterName) {
        const chapters = await getChapters(targetSubject.id);
        const targetChapter = chapters.find(
          (c) =>
            c.name.trim().toLowerCase() === chapterName.trim().toLowerCase() ||
            c.id.trim().toLowerCase() === chapterName.trim().toLowerCase(),
        );

        if (targetChapter) {
          resolution.chapterId = targetChapter.id;

          // 3. Resolve Topic
          if (topicName) {
            const topics = await getTopics(targetChapter.id);
            const targetTopic = topics.find(
              (t) =>
                t.name.trim().toLowerCase() ===
                  topicName.trim().toLowerCase() ||
                t.id.trim().toLowerCase() === topicName.trim().toLowerCase(),
            );

            if (targetTopic) {
              resolution.topicId = targetTopic.id;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[resolveAcademicIds] Error:', error);
  }

  return resolution;
}
