/**
 * Calculates the Levenshtein distance between two strings.
 * Used for fuzzy matching subjects and chapters.
 */
export const levenshteinDistance = (a: string, b: string): number => {
  if (!a || !b) return 100;
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  const matrix = [];
  for (let i = 0; i <= bLower.length; i++) matrix[i] = [i];
  for (let j = 0; j <= aLower.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }
  return matrix[bLower.length][aLower.length];
};

/**
 * Finds the closest string match from an array of options.
 */
export const findClosestMatch = (
  input: string,
  options: string[],
): string | null => {
  if (!input || options.length === 0) return null;

  const inputLower = input.toLowerCase().trim();
  const exactMatch = options.find((opt) => opt.toLowerCase() === inputLower);
  if (exactMatch) return exactMatch;

  let bestMatch = null;
  let minDistance = 3; // Threshold for "closeness"

  for (const option of options) {
    const distance = levenshteinDistance(inputLower, option.toLowerCase());
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = option;
    }
  }
  return bestMatch;
};
