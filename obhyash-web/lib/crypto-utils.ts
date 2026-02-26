/**
 * Simple hash function to generate a unique fingerprint for a question.
 * We use a combination of question text, options, subject, and chapter.
 * This ensures that even if spacing or capitalization differs slightly,
 * we can detect duplicates if we normalize the input first.
 */
export async function generateQuestionFingerprint(data: {
  question: string;
  options: string[];
  subject?: string;
  chapter?: string;
}): Promise<string> {
  const { question, options, subject = '', chapter = '' } = data;

  // Normalize: trim, lowercase, and join
  const normalizedQuestion = question.trim().toLowerCase();
  const normalizedOptions = options
    .map((o) => o.trim().toLowerCase())
    .sort() // Sort so order doesn't change the fingerprint
    .join('|');
  const normalizedSubject = subject.trim().toLowerCase();
  const normalizedChapter = chapter.trim().toLowerCase();

  const rawString = `${normalizedQuestion}:${normalizedOptions}:${normalizedSubject}:${normalizedChapter}`;

  // Use Web Crypto API for SHA-256
  const msgUint8 = new TextEncoder().encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Synchronous version for simple cases (not cryptographic, but good for local checks)
 */
export function generateQuestionFingerprintSync(data: {
  question: string;
  options: string[];
  subject?: string;
  chapter?: string;
}): string {
  const { question, options, subject = '', chapter = '' } = data;

  const normalizedQuestion = question.trim().toLowerCase();
  const normalizedOptions = options
    .map((o) => o.trim().toLowerCase())
    .sort()
    .join('|');

  const rawString = `${normalizedQuestion}:${normalizedOptions}:${subject.trim().toLowerCase()}:${chapter.trim().toLowerCase()}`;

  // Simple FNV-1a hash implementation
  let hash = 2166136261;
  for (let i = 0; i < rawString.length; i++) {
    hash ^= rawString.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}
