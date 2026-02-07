interface Topic {
  serial: string | number;
  name: string;
}

interface ChapterData {
  topics?: Topic[];
}

/**
 * Normalizes topic inputs by handling Bengali digits and fuzzy matching.
 */
export const normalizeTopic = (
  chapterData: ChapterData | null | undefined,
  inputTopic: string,
): string => {
  if (!inputTopic || !chapterData?.topics) return inputTopic;

  const raw = String(inputTopic).trim();
  // Convert Bengali digits (০-৯) to English (0-9)
  const normalized = raw.replace(/[০-৯]/g, (d) =>
    '০১২৩৪৫৬৭৮৯'.indexOf(d).toString(),
  );
  const cleaned = normalized.replace(/[^\d]/g, ''); // Remove non-numeric chars like "."

  const topicNumber = parseInt(cleaned, 10);
  if (!isNaN(topicNumber)) {
    const topicBySerial = chapterData.topics.find(
      (t: Topic) => Number(t.serial) === topicNumber,
    );
    if (topicBySerial) return topicBySerial.name;
  }
  return raw;
};

/**
 * Maps various answer inputs (Bengali, English, Keys) to the actual option text.
 */
export const normalizeAnswer = (row: { answer?: string }, options: string[]): string => {
  const answerTrimmed = String(row.answer || '')
    .trim()
    .toLowerCase();
  if (!answerTrimmed) return '';

  const answerKeyMap: { [key: string]: number } = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
    ক: 0,
    খ: 1,
    গ: 2,
    ঘ: 3,
    option1: 0,
    option2: 1,
    option3: 2,
    option4: 3,
  };

  const optionIndex = answerKeyMap[answerTrimmed.replace(/\s+/g, '')];
  if (optionIndex !== undefined && options[optionIndex]) {
    return options[optionIndex];
  }

  return row.answer ?? ''; // Fallback to raw text if no key match
};
