import { hscSubjects } from '@/lib/data/hsc';

/**
 * Dynamically generated map of subject IDs → Bengali display names from hsc.ts
 * Used by services to resolve human-readable labels.
 */
export const SUBJECT_NAME_MAP: Record<string, string> = hscSubjects.reduce(
  (acc, subject) => {
    acc[subject.id] = subject.name;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Returns the Bengali display name for a subject ID, or falls back to the raw ID.
 */
export function getSubjectDisplayName(subjectId: string): string {
  return SUBJECT_NAME_MAP[subjectId] || subjectId;
}
