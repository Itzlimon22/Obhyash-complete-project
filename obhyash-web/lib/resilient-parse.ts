/**
 * Attempts to extract valid JSON objects from a string, even if the overall
 * structure (like an outer array) is broken.
 */
export function extractJsonObjects(text: string): {
  data: unknown[];
  errors: string[];
} {
  const data: unknown[] = [];
  const errors: string[] = [];

  const trimmedText = text.trim();
  if (!trimmedText) return { data: [], errors: [] };

  // 1. Try standard parse first (Best case)
  try {
    const parsed = JSON.parse(trimmedText);
    return { data: Array.isArray(parsed) ? parsed : [parsed], errors: [] };
  } catch (e) {
    // Continue to resilient methods
  }

  // 2. Try JSON Lines (one object per line)
  const lines = trimmedText.split('\n');
  let lineSuccessCount = 0;
  const lineResults: unknown[] = [];

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    try {
      lineResults.push(JSON.parse(trimmedLine));
      lineSuccessCount++;
    } catch {
      // Not a valid JSON line, ignore
    }
  });

  // If a significant portion of lines parsed as JSON, assume it's JSONL
  if (
    lineSuccessCount > 0 &&
    lineSuccessCount >= lines.filter((l) => l.trim()).length * 0.5
  ) {
    return { data: lineResults, errors: [] };
  }

  // 3. Last resort: Match anything that looks like an object {...}
  // We use a simple but effective approach of scanning for balanced braces
  let braceCount = 0;
  let startIndex = -1;
  let foundObjects = 0;

  for (let i = 0; i < trimmedText.length; i++) {
    const char = trimmedText[i];
    if (char === '{') {
      if (braceCount === 0) startIndex = i;
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        const potentialObject = trimmedText.substring(startIndex, i + 1);
        try {
          data.push(JSON.parse(potentialObject));
          foundObjects++;
        } catch {
          // Invalid object, skip
        }
        startIndex = -1;
      }
    }
  }

  if (foundObjects === 0 && lineSuccessCount === 0) {
    errors.push('ফাইলটি পার্স করা সম্ভব নয়। JSON ফরম্যাট চেক করুন।');
  } else if (foundObjects > 0 || lineSuccessCount > 0) {
    // If we recovered some, check if we missed binary-like junk or major errors
    const recoveredData =
      foundObjects > lineResults.length ? data : lineResults;
    return { data: recoveredData, errors: [] };
  }

  return { data: [], errors };
}
