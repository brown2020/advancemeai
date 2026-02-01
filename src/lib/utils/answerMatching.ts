/**
 * Fuzzy answer matching utilities for Write mode
 */

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  // Create matrix with proper initialization
  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const prevRow = matrix[i - 1];
      const currRow = matrix[i];
      if (prevRow && currRow) {
        currRow[j] = Math.min(
          (prevRow[j] ?? 0) + 1, // deletion
          (currRow[j - 1] ?? 0) + 1, // insertion
          (prevRow[j - 1] ?? 0) + cost // substitution
        );
      }
    }
  }

  return matrix[a.length]?.[b.length] ?? Math.max(a.length, b.length);
}

/**
 * Calculate similarity ratio (0-1) between two strings
 */
export function similarityRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Normalize text for comparison
 * - Lowercase
 * - Trim whitespace
 * - Remove extra whitespace
 * - Remove common punctuation
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // collapse multiple spaces
    .replace(/[.,!?;:'"()[\]{}]/g, "") // remove punctuation
    .trim();
}

/**
 * Check if user answer matches the correct answer
 * Uses fuzzy matching with configurable strictness
 */
export function isAnswerCorrect(
  userInput: string,
  correctAnswer: string,
  options: {
    /** Max Levenshtein distance to accept (default: 2) */
    maxDistance?: number;
    /** Min similarity ratio to accept (default: 0.85) */
    minSimilarity?: number;
    /** Strict mode - exact match only (default: false) */
    strictMode?: boolean;
  } = {}
): { isCorrect: boolean; similarity: number; feedback: string } {
  const {
    maxDistance = 2,
    minSimilarity = 0.85,
    strictMode = false,
  } = options;

  const normalizedInput = normalizeText(userInput);
  const normalizedAnswer = normalizeText(correctAnswer);

  // Empty input
  if (!normalizedInput) {
    return {
      isCorrect: false,
      similarity: 0,
      feedback: "Please enter an answer",
    };
  }

  // Exact match (normalized)
  if (normalizedInput === normalizedAnswer) {
    return {
      isCorrect: true,
      similarity: 1,
      feedback: "Perfect!",
    };
  }

  // Strict mode - exact match only
  if (strictMode) {
    const similarity = similarityRatio(normalizedInput, normalizedAnswer);
    return {
      isCorrect: false,
      similarity,
      feedback: `Incorrect. The correct answer was: ${correctAnswer}`,
    };
  }

  // Calculate distance and similarity
  const distance = levenshteinDistance(normalizedInput, normalizedAnswer);
  const similarity = similarityRatio(normalizedInput, normalizedAnswer);

  // Check against thresholds
  // Scale maxDistance based on answer length for longer answers
  const scaledMaxDistance = Math.max(
    maxDistance,
    Math.floor(normalizedAnswer.length * 0.15)
  );

  const isCorrect = distance <= scaledMaxDistance || similarity >= minSimilarity;

  if (isCorrect) {
    if (similarity >= 0.95) {
      return {
        isCorrect: true,
        similarity,
        feedback: "Correct! (minor typo)",
      };
    }
    return {
      isCorrect: true,
      similarity,
      feedback: "Correct! (close enough)",
    };
  }

  // Provide helpful feedback based on similarity
  if (similarity >= 0.7) {
    return {
      isCorrect: false,
      similarity,
      feedback: `Almost! The correct answer was: ${correctAnswer}`,
    };
  }

  return {
    isCorrect: false,
    similarity,
    feedback: `Incorrect. The correct answer was: ${correctAnswer}`,
  };
}

/**
 * Check if answer contains the key words from correct answer
 */
export function containsKeyWords(
  userInput: string,
  correctAnswer: string,
  minWordMatch = 0.7
): boolean {
  const inputWords = new Set(normalizeText(userInput).split(" "));
  const answerWords = normalizeText(correctAnswer).split(" ");

  // Filter out common short words
  const significantWords = answerWords.filter((w) => w.length > 2);
  if (significantWords.length === 0) return false;

  let matchCount = 0;
  for (const word of significantWords) {
    if (inputWords.has(word)) {
      matchCount++;
    }
  }

  return matchCount / significantWords.length >= minWordMatch;
}
