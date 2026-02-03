/**
 * Utility functions for importing flashcards from various formats
 */

export interface ImportedCard {
  term: string;
  definition: string;
}

export interface ImportResult {
  cards: ImportedCard[];
  errors: string[];
  warnings: string[];
}

export interface ImportOptions {
  /** Delimiter between term and definition (default: tab) */
  termDefinitionDelimiter: string;
  /** Delimiter between cards/rows (default: newline) */
  cardDelimiter: string;
  /** Whether to skip empty rows */
  skipEmptyRows: boolean;
  /** Whether to trim whitespace */
  trimWhitespace: boolean;
}

const DEFAULT_OPTIONS: ImportOptions = {
  termDefinitionDelimiter: "\t",
  cardDelimiter: "\n",
  skipEmptyRows: true,
  trimWhitespace: true,
};

/**
 * Common delimiter presets for quick import
 */
export const IMPORT_PRESETS = {
  /** Tab between term/definition, newline between cards (Quizlet export format) */
  TAB_NEWLINE: {
    termDefinitionDelimiter: "\t",
    cardDelimiter: "\n",
    skipEmptyRows: true,
    trimWhitespace: true,
  },
  /** Comma between term/definition, newline between cards (simple CSV) */
  COMMA_NEWLINE: {
    termDefinitionDelimiter: ",",
    cardDelimiter: "\n",
    skipEmptyRows: true,
    trimWhitespace: true,
  },
  /** Dash between term/definition, semicolon between cards */
  DASH_SEMICOLON: {
    termDefinitionDelimiter: " - ",
    cardDelimiter: ";",
    skipEmptyRows: true,
    trimWhitespace: true,
  },
  /** Colon between term/definition, newline between cards */
  COLON_NEWLINE: {
    termDefinitionDelimiter: ":",
    cardDelimiter: "\n",
    skipEmptyRows: true,
    trimWhitespace: true,
  },
} as const;

/**
 * Auto-detect the most likely delimiter format from text
 */
export function detectDelimiters(text: string): ImportOptions {
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    return DEFAULT_OPTIONS;
  }

  // Sample first few lines to detect pattern
  const sampleLines = lines.slice(0, Math.min(5, lines.length));

  // Count occurrences of potential delimiters
  const delimiters = ["\t", " - ", ",", ":", "::"];
  const counts: Record<string, number> = {};

  for (const delimiter of delimiters) {
    counts[delimiter] = 0;
    for (const line of sampleLines) {
      const parts = line.split(delimiter);
      // A good delimiter should split each line into exactly 2 parts
      if (parts.length === 2 && parts[0]?.trim() && parts[1]?.trim()) {
        counts[delimiter]++;
      }
    }
  }

  // Find delimiter with highest success rate
  let bestDelimiter = "\t";
  let bestCount = 0;

  for (const [delimiter, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      bestDelimiter = delimiter;
    }
  }

  // Detect card delimiter (newline vs semicolon)
  const hasSemicolonCards = text.includes(";") && !text.includes("\n");

  return {
    termDefinitionDelimiter: bestDelimiter,
    cardDelimiter: hasSemicolonCards ? ";" : "\n",
    skipEmptyRows: true,
    trimWhitespace: true,
  };
}

/**
 * Parse text into flashcards using specified or auto-detected delimiters
 */
export function parseFlashcardText(
  text: string,
  options?: Partial<ImportOptions>
): ImportResult {
  const result: ImportResult = {
    cards: [],
    errors: [],
    warnings: [],
  };

  if (!text || !text.trim()) {
    result.errors.push("No text provided to import");
    return result;
  }

  // Auto-detect or use provided options
  const detectedOptions = detectDelimiters(text);
  const finalOptions: ImportOptions = {
    ...DEFAULT_OPTIONS,
    ...detectedOptions,
    ...options,
  };

  // Split text into rows
  const rows = text.split(finalOptions.cardDelimiter);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rowNum = i + 1;
    let processedRow = row;

    if (finalOptions.trimWhitespace) {
      processedRow = row.trim();
    }

    if (finalOptions.skipEmptyRows && !processedRow) {
      continue;
    }

    // Split row into term and definition
    const delimiterIndex = processedRow.indexOf(finalOptions.termDefinitionDelimiter);

    if (delimiterIndex === -1) {
      result.warnings.push(
        `Row ${rowNum}: No delimiter found, skipping "${processedRow.substring(0, 30)}..."`
      );
      continue;
    }

    const term = processedRow.substring(0, delimiterIndex);
    const definition = processedRow.substring(
      delimiterIndex + finalOptions.termDefinitionDelimiter.length
    );

    const finalTerm = finalOptions.trimWhitespace ? term.trim() : term;
    const finalDefinition = finalOptions.trimWhitespace ? definition.trim() : definition;

    if (!finalTerm) {
      result.warnings.push(`Row ${rowNum}: Empty term, skipping`);
      continue;
    }

    if (!finalDefinition) {
      result.warnings.push(`Row ${rowNum}: Empty definition, skipping`);
      continue;
    }

    result.cards.push({
      term: finalTerm,
      definition: finalDefinition,
    });
  }

  if (result.cards.length === 0) {
    result.errors.push(
      "No valid cards found. Make sure each line has a term and definition separated by the correct delimiter."
    );
  } else if (result.cards.length < 2) {
    result.warnings.push(
      "Only 1 card found. Flashcard sets should have at least 2 cards."
    );
  }

  return result;
}

/**
 * Preview how text will be parsed with given options
 */
export function previewImport(
  text: string,
  options?: Partial<ImportOptions>
): {
  preview: ImportedCard[];
  totalLines: number;
  parsedCount: number;
  skippedCount: number;
} {
  const result = parseFlashcardText(text, options);
  const lines = text.split(options?.cardDelimiter || "\n");

  return {
    preview: result.cards.slice(0, 5), // Show first 5 cards
    totalLines: lines.length,
    parsedCount: result.cards.length,
    skippedCount: lines.length - result.cards.length,
  };
}

/**
 * Export flashcards to text format
 */
export function exportFlashcardsToText(
  cards: ImportedCard[],
  options?: Partial<ImportOptions>
): string {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  return cards
    .map(
      (card) =>
        `${card.term}${finalOptions.termDefinitionDelimiter}${card.definition}`
    )
    .join(finalOptions.cardDelimiter);
}
