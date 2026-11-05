/**
 * Shared AI question generation utilities
 * Extracted from API routes to maintain DRY principles
 */

import { logger } from "@/utils/logger";
import { shuffle } from "@/utils/random";
import type { Question as BaseQuestion } from "@/types/question";
import { getOpenAIClient, hasOpenAIKey, QUESTION_MODEL } from "./openai";

/**
 * SAT-specific question templates by difficulty level
 */
const WRITING_TEMPLATES: Record<number, string[]> = {
  1: [
    "Basic Grammar: Subject-Verb Agreement",
    "Basic Punctuation: Commas and Periods",
    "Simple Sentence Structure",
    "Common Word Usage",
  ],
  2: [
    "Intermediate Grammar: Pronouns and Antecedents",
    "Punctuation: Semicolons and Colons",
    "Parallel Structure",
    "Modifier Placement",
  ],
  3: [
    "Advanced Grammar: Complex Tenses",
    "Sentence Combining",
    "Logical Flow and Transitions",
    "Formal vs. Informal Language",
  ],
  4: [
    "Sophisticated Sentence Structure",
    "Rhetorical Effectiveness",
    "Style and Tone",
    "Evidence-Based Revision",
  ],
  5: [
    "Complex Rhetorical Strategies",
    "Advanced Style Analysis",
    "Organizational Coherence",
    "Synthesis and Integration",
  ],
};

export type Difficulty = 1 | 2 | 3 | 4 | 5;

// Extended Question type with optional section field
export interface Question extends BaseQuestion {
  section?: string;
}

/**
 * Get human-readable section name for prompts
 */
function getSectionPrompt(section: string): string {
  switch (section.toLowerCase()) {
    case "math-calc":
      return "SAT Math (with calculator)";
    case "math-no-calc":
      return "SAT Math (no calculator)";
    case "reading":
      return "SAT Reading Comprehension";
    case "writing":
      return "SAT Writing and Language";
    default:
      return section;
  }
}

/**
 * Map section IDs to the format expected by AI generation
 */
export function mapSectionId(sectionId: string): string {
  const sectionMap: Record<string, string> = {
    reading: "reading",
    writing: "writing",
    "math-no-calc": "math",
    "math-calc": "math-calc",
  };
  return sectionMap[sectionId] || sectionId;
}

const CHOICE_LETTERS = ["A", "B", "C", "D"] as const;

const PASSAGE_STOP_WORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "almost",
  "along",
  "already",
  "although",
  "always",
  "among",
  "another",
  "answer",
  "around",
  "author",
  "because",
  "before",
  "being",
  "below",
  "between",
  "choice",
  "correct",
  "during",
  "either",
  "enough",
  "every",
  "following",
  "however",
  "itself",
  "option",
  "other",
  "others",
  "passage",
  "people",
  "question",
  "should",
  "since",
  "something",
  "their",
  "there",
  "these",
  "those",
  "through",
  "toward",
  "under",
  "until",
  "using",
  "which",
  "while",
  "within",
  "without",
  "would",
]);

/** First response plus two regenerations when a question fails validation. */
const GENERATION_RETRIES = 2;
export const GENERATION_ATTEMPTS = GENERATION_RETRIES + 1;

/** SAT items are four-choice. */
const EXPECTED_OPTION_COUNT = 4;

export function correctChoiceLetter(correctAnswer: string): string | null {
  const match = correctAnswer.trim().match(/^([A-D])\)/);
  return match?.[1] ?? null;
}

const CORRECTNESS = String.raw`(?:correct|right|best)`;

type LetterClaim = { pattern: RegExp; upperOnly: boolean };

/**
 * Phrasings that endorse a choice letter. Bare letters must be uppercase so
 * "makes a correct sentence" is not treated as choice A.
 */
const LETTER_CLAIMS: readonly LetterClaim[] = [
  {
    pattern: new RegExp(
      String.raw`\b(?:choice|option|answer)\s+([A-D])\s+is\s+(?:also\s+|still\s+)?(?:the\s+)?${CORRECTNESS}\b`,
      "gi"
    ),
    upperOnly: false,
  },
  {
    pattern: /\b(?:choice|option)\s+([A-D])\s+correctly\b/gi,
    upperOnly: false,
  },
  {
    pattern: new RegExp(
      String.raw`\b([A-D])\s+is\s+(?:also\s+|still\s+)?(?:the\s+)?${CORRECTNESS}\b`,
      "g"
    ),
    upperOnly: true,
  },
  {
    pattern: new RegExp(
      String.raw`\bmakes\s+(?:(?:this|that|it|the)\s+)?(?:(?:choice|option|answer)\s+)?([A-D])\b(?!\s+is\s+not\b)(?=[^.!?]{0,48}\b${CORRECTNESS}\b)`,
      "gi"
    ),
    upperOnly: true,
  },
  {
    pattern: new RegExp(
      String.raw`\b${CORRECTNESS}\s+(?:answer|choice|option)\s+is\s+(?:(?:choice|option)\s+)?([A-D])\b`,
      "gi"
    ),
    upperOnly: false,
  },
  {
    pattern: /\banswer\s+is\s+(?:(?:choice|option)\s+)?([A-D])\b/gi,
    upperOnly: false,
  },
  {
    pattern: new RegExp(
      String.raw`\b([A-D])\)\s+is\s+(?:also\s+|still\s+)?(?:the\s+)?${CORRECTNESS}\b`,
      "g"
    ),
    upperOnly: true,
  },
  {
    pattern: /\b(?:choose|select|pick)\s+(?:(?:choice|option|answer)\s+)?([A-D])\b/gi,
    upperOnly: true,
  },
];

function rememberLetter(
  letter: string | undefined,
  claimed: Set<string>,
  upperOnly: boolean
) {
  if (!letter) return;
  if (upperOnly && letter !== letter.toUpperCase()) return;
  claimed.add(letter.toUpperCase());
}

/**
 * Choice letters the explanation states are correct.
 * "makes A correct", "A is correct", "answer is A", and "choose A" count.
 * "choice A is incorrect" does not.
 */
export function lettersClaimedCorrect(explanation: string): string[] {
  const claimed = new Set<string>();
  for (const claim of LETTER_CLAIMS) {
    const pattern = new RegExp(claim.pattern.source, claim.pattern.flags);
    for (const match of explanation.matchAll(pattern)) {
      rememberLetter(match[1], claimed, claim.upperOnly);
    }
  }
  return [...claimed];
}

function namesOtherOptionCorrect(
  explanation: string,
  options: readonly string[],
  correctAnswer: string
): boolean {
  const correct = optionContent(correctAnswer).trim().toLowerCase();
  for (const option of options) {
    const other = optionContent(option).trim();
    if (other.length < 4 || other.toLowerCase() === correct) continue;
    const escaped = escapeRegExp(other);
    const pattern = new RegExp(
      String.raw`\bmakes\s+(?:(?:this|that|it|the)\s+)?(?:(?:choice|option|answer)\s+)?${escaped}(?=\s+(?:the\s+)?${CORRECTNESS}\b)|${escaped}\s+is\s+(?:also\s+|still\s+)?(?:the\s+)?${CORRECTNESS}\b|\b(?:answer|choice|option)\s+is\s+["']?${escaped}|\b(?:choose|select|pick)\s+["']?${escaped}\b`,
      "i"
    );
    if (pattern.test(explanation)) return true;
  }
  return false;
}

/**
 * True when every endorsed letter and option is the scored correctAnswer.
 * An explanation that endorses nothing is allowed.
 */
export function explanationMatchesCorrectAnswer(
  question: Pick<Question, "correctAnswer" | "explanation"> & {
    options?: readonly string[];
  }
): boolean {
  const explanation = question.explanation ?? "";
  const claimed = lettersClaimedCorrect(explanation);
  const letter = correctChoiceLetter(question.correctAnswer);
  for (const item of claimed) {
    if (!letter || item !== letter) return false;
  }
  if (
    question.options &&
    namesOtherOptionCorrect(explanation, question.options, question.correctAnswer)
  ) {
    return false;
  }
  return true;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isChoiceLine(line: string): boolean {
  return /^[ \t]*(?:[([][A-D][)\]]|[A-D][.)])\s+\S/.test(line);
}

function choiceLineLetter(line: string): string | null {
  const match = line.match(/^[ \t]*(?:[([]([A-D])[)\]]|([A-D])[.)])/);
  return match?.[1] ?? match?.[2] ?? null;
}

type ChoiceToken = { letter: string; start: number; contentStart: number };

function choiceTokens(text: string): ChoiceToken[] {
  const pattern = /[([]?([A-D])[.)]\s+/g;
  const tokens: ChoiceToken[] = [];
  for (const match of text.matchAll(pattern)) {
    const letter = match[1];
    if (!letter || match.index === undefined) continue;
    tokens.push({
      letter,
      start: match.index,
      contentStart: match.index + match[0].length,
    });
  }
  return tokens;
}

/** A, B, and C (and D when present) in order, close enough to be one list. */
function findChoiceRun(tokens: readonly ChoiceToken[]): ChoiceToken[] | null {
  const wanted = ["A", "B", "C", "D"];
  for (let start = 0; start < tokens.length; start += 1) {
    if (tokens[start]?.letter !== "A") continue;
    const first = tokens[start];
    if (!first) continue;
    const run: ChoiceToken[] = [first];
    let nextLetter = 1;
    for (let index = start + 1; index < tokens.length && nextLetter < wanted.length; index += 1) {
      const token = tokens[index];
      const previous = run[run.length - 1];
      if (!token || !previous || token.letter !== wanted[nextLetter]) break;
      if (token.start - previous.contentStart > 180) break;
      run.push(token);
      nextLetter += 1;
    }
    if (run.length >= 3) return run;
  }
  return null;
}

function endOfLastChoice(text: string, run: readonly ChoiceToken[]): number {
  const last = run[run.length - 1];
  if (!last) return text.length;
  const gaps = run.slice(1).map((token, index) => {
    const previous = run[index];
    return previous ? token.start - previous.contentStart : 0;
  });
  const typical = Math.max(...gaps, 1);
  const slice = text.slice(last.contentStart, Math.min(text.length, last.contentStart + typical + 24));
  const words = slice.match(/\S+/g) ?? [];
  let taken = "";
  for (const word of words) {
    const next = taken ? `${taken} ${word}` : word;
    if (taken && next.length > typical + word.length) break;
    taken = next;
    if (taken.length >= typical) break;
  }
  let end = last.contentStart + taken.length;
  const lineEnd = text.indexOf("\n", last.contentStart);
  const limit = lineEnd >= 0 ? lineEnd : text.length;
  end = Math.min(end, limit);
  if (text.slice(end, limit).trim() === "") end = limit;
  return end;
}

/** Remove one single-line A–D list. Returns the original text when none is present. */
function stripInlineChoiceRun(text: string): { text: string; removed: boolean } {
  const run = findChoiceRun(choiceTokens(text));
  const first = run?.[0];
  if (!run || !first) return { text, removed: false };

  const end = endOfLastChoice(text, run);
  const before = text.slice(0, first.start);
  const after = text.slice(end);
  const continues = after.length > 0 && !after.startsWith("\n");
  return {
    text: `${before}${continues ? "____" : ""}${after}`,
    removed: true,
  };
}

/**
 * Remove an A–D choice list embedded in question or explanation text.
 * The choices are shown separately, and their letters change when shuffled.
 */
export function stripInlineOptionList(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const kept: string[] = [];
  let removedBlock = false;
  let index = 0;

  while (index < lines.length) {
    if (!isChoiceLine(lines[index] ?? "")) {
      kept.push(lines[index] ?? "");
      index += 1;
      continue;
    }

    const block: string[] = [];
    let end = index;
    while (end < lines.length) {
      const line = lines[end] ?? "";
      if (isChoiceLine(line)) {
        block.push(line);
        end += 1;
        continue;
      }
      if (line.trim() === "" && isChoiceLine(lines[end + 1] ?? "")) {
        end += 1;
        continue;
      }
      break;
    }

    const letters = new Set(
      block
        .map((line) => choiceLineLetter(line))
        .filter((letter): letter is string => Boolean(letter))
    );
    if (letters.size >= 3) {
      removedBlock = true;
      if (kept.length > 0 && (kept[kept.length - 1] ?? "").trim() === "") {
        kept.pop();
      }
    } else {
      kept.push(...lines.slice(index, end));
    }
    index = end;
  }

  let withoutInline = kept.join("\n");
  let removedInline = false;
  for (let pass = 0; pass < 4; pass += 1) {
    const stripped = stripInlineChoiceRun(withoutInline);
    if (!stripped.removed) break;
    removedInline = true;
    withoutInline = stripped.text;
  }

  if (!removedBlock && !removedInline) return text;
  return withoutInline
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function rejectsDisplayedLetter(sentence: string, letter: string): boolean {
  const name = String.raw`(?:(?:choice|option|answer)\s+${letter}|${letter}\))`;
  const patterns = [
    new RegExp(
      String.raw`\b${name}\b[^.!?]{0,60}\bis\s+(?:also\s+|still\s+)?(?:incorrect|wrong)\b`,
      "i"
    ),
    new RegExp(
      String.raw`\b${name}\b[^.!?]{0,60}\bis\s+not\s+(?:the\s+)?(?:correct|right|best)\b`,
      "i"
    ),
    new RegExp(
      String.raw`\b${name}\b[^.!?]{0,40}\b(?:cannot|can't)\s+be\s+(?:the\s+)?(?:correct|right|best)\b`,
      "i"
    ),
  ];
  return patterns.some((pattern) => pattern.test(sentence));
}

function quotesDifferentAnswer(
  sentence: string,
  content: string,
  options: readonly string[]
): boolean {
  const expected = content.trim().toLowerCase();
  const quoted =
    /\b(?:correct|right|best)\s+(?:answer|choice|option|form|word|verb|phrase)\s+is\s+["']([^"']+)["']/gi;
  for (const match of sentence.matchAll(quoted)) {
    const value = match[1]?.trim().toLowerCase() ?? "";
    if (value && value !== expected) return true;
  }

  for (const option of options) {
    const other = optionContent(option).trim();
    if (other.length < 4 || other.toLowerCase() === expected) continue;
    const pattern = new RegExp(
      String.raw`\b(?:correct|right|best)\s+(?:answer|choice|option|form|word|verb|phrase)\s+is\s+["']?${escapeRegExp(other)}["']?`,
      "i"
    );
    if (pattern.test(sentence)) return true;
  }
  return false;
}

function citesDisplayedChoice(text: string, letter: string, content: string): boolean {
  for (const claimed of lettersClaimedCorrect(text)) {
    if (claimed === letter) return true;
  }
  const normalized = content.trim().toLowerCase();
  return normalized.length > 0 && text.toLowerCase().includes(normalized);
}

/**
 * After shuffling, an explanation may only endorse the displayed letter or
 * the correct option's text. Sentences that contradict that are removed.
 */
export function alignExplanation(
  explanation: string,
  correctAnswer: string,
  options: readonly string[] = []
): string {
  const letter = correctChoiceLetter(correctAnswer);
  const content = optionContent(correctAnswer);
  const stripped = stripInlineOptionList(explanation);
  if (!letter || !content) return stripped;

  const pieces = sentencesOf(stripped);
  const contentNeedle = content.toLowerCase();
  let citesCorrect = false;
  for (const sentence of pieces) {
    if (sentence.toLowerCase().includes(contentNeedle)) {
      citesCorrect = true;
      break;
    }
    for (const claimed of lettersClaimedCorrect(sentence)) {
      if (claimed === letter) {
        citesCorrect = true;
        break;
      }
    }
    if (citesCorrect) break;
  }
  // Drop self-contradictions. An explanation that only endorses a different
  // choice is left in place so delivery can reject it and the generator retries.
  const kept = pieces.filter((sentence) => {
    if (rejectsDisplayedLetter(sentence, letter)) return false;
    if (quotesDifferentAnswer(sentence, content, options)) return false;
    if (namesOtherOptionCorrect(sentence, options, correctAnswer)) return false;
    let claimsWrong = false;
    for (const claimed of lettersClaimedCorrect(sentence)) {
      if (claimed !== letter) {
        claimsWrong = true;
        break;
      }
    }
    return !(claimsWrong && citesCorrect);
  });
  const text = kept.length === pieces.length ? stripped : kept.join(" ");
  const aligned = explanationMatchesCorrectAnswer({
    correctAnswer,
    explanation: text,
  });
  if (!aligned) return text.trim();
  if (citesDisplayedChoice(text, letter, content)) return text.trim();

  const canonical = `The correct choice is ${letter}) ${content.replace(/[.?!]$/, "")}.`;
  return text.trim() ? `${text.trim()} ${canonical}` : canonical;
}

function contentWords(text: string): string[] {
  return (
    text
      .toLowerCase()
      .match(/[a-z]{6,}/g)
      ?.filter((word) => !PASSAGE_STOP_WORDS.has(word)) ?? []
  );
}

/**
 * A reading item belongs to its passage when the question and explanation
 * share distinctive words with that passage.
 */
export function questionBelongsToPassage(
  question: Pick<Question, "text" | "explanation" | "correctAnswer" | "options">,
  passage: string
): boolean {
  const passageWords = new Set(contentWords(passage));
  const words = contentWords(
    `${question.text} ${question.explanation ?? ""} ${question.correctAnswer} ${(question.options ?? []).join(" ")}`
  );
  const hits = new Set(words.filter((word) => passageWords.has(word)));
  if (words.length >= 4) return hits.size >= 2;
  return hits.size >= 1;
}

const MISMATCH_EXPLANATION =
  /not matching the answer choices|does(?:n'?t| not) match the (?:answer )?choices|none of the (?:answer )?choices|none of the options|not among the (?:answer )?choices|no option matches|let'?s re-?calculate|\bre-?calculate\b/i;

/** The model is telling us the choices and the work disagree. */
export function explanationSignalsMismatch(explanation: string): boolean {
  return MISMATCH_EXPLANATION.test(explanation);
}

function optionContent(option: string): string {
  return option.replace(/^[A-D]\)\s+/, "").trim();
}

function sameChoice(option: string, answer: string): boolean {
  if (option === answer) return true;
  const content = optionContent(option);
  return content === answer || content === optionContent(answer);
}

function parseNumeric(raw: string): number | null {
  const fraction = raw.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (fraction?.[1] && fraction[2]) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function lastCapturedNumber(
  text: string,
  pattern: RegExp
): { index: number; value: number } | null {
  let last: { index: number; value: number } | null = null;
  for (const match of text.matchAll(pattern)) {
    const raw = match[1];
    if (!raw || match.index === undefined) continue;
    const value = parseNumeric(raw);
    if (value === null) continue;
    if (!last || match.index >= last.index) last = { index: match.index, value };
  }
  return last;
}

/**
 * A number the explanation states as the result, when one can be read.
 * Intermediate equals (2x = 8, then x = 4) keep the later stated result.
 */
export function computedAnswer(explanation: string): number | null {
  const number = String.raw`(-?\d+(?:\.\d+)?(?:\s*/\s*-?\d+(?:\.\d+)?)?)`;
  const stated = new RegExp(
    String.raw`(?:(?:answer|value|result|period|solution|slope|sum)\s+is\s+\$?\s*|\bx\s*=\s*)${number}`,
    "gi"
  );
  const statedHit = lastCapturedNumber(explanation, stated);
  if (statedHit) return statedHit.value;
  const equals = new RegExp(String.raw`=\s*\$?\s*${number}`, "gi");
  return lastCapturedNumber(explanation, equals)?.value ?? null;
}

function optionNumbers(option: string): number[] {
  const content = optionContent(option).replace(/[$,]/g, "");
  const numbers: number[] = [];
  for (const match of content.matchAll(/-?\d+(?:\.\d+)?/g)) {
    const value = Number(match[0]);
    if (Number.isFinite(value)) numbers.push(value);
  }
  const fraction = content.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
  if (fraction?.[1] && fraction[2]) {
    const value = parseNumeric(`${fraction[1]}/${fraction[2]}`);
    if (value !== null) numbers.push(value);
  }
  return numbers;
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-6;
}

function computedAnswerInChoices(
  explanation: string,
  options: readonly string[],
  correctOption: string
): boolean {
  const value = computedAnswer(explanation);
  if (value === null) return true;
  const inOptions = options.some((option) =>
    optionNumbers(option).some((number) => nearlyEqual(number, value))
  );
  const marksCorrect = optionNumbers(correctOption).some((number) =>
    nearlyEqual(number, value)
  );
  return inOptions && marksCorrect;
}

function resolveCorrectIndex(
  options: readonly string[],
  index: number | undefined,
  correctAnswer: string | undefined
): number {
  if (options.length !== EXPECTED_OPTION_COUNT) {
    throw new Error(`Expected exactly ${EXPECTED_OPTION_COUNT} options`);
  }
  if (index !== undefined) {
    if (!Number.isInteger(index) || index < 0 || index >= options.length) {
      throw new Error("correctAnswer index is out of range");
    }
    const option = options[index];
    if (!option) throw new Error("correctAnswer index is out of range");
    if (correctAnswer !== undefined && !sameChoice(option, correctAnswer)) {
      throw new Error("correctAnswer index does not match the correct option");
    }
    return index;
  }
  if (!correctAnswer) throw new Error("correctAnswer index is required");
  const found = options.findIndex((option) => sameChoice(option, correctAnswer));
  if (found < 0) {
    throw new Error("Correct answer must match one of the options exactly");
  }
  return found;
}

/**
 * Turn a model payload into a question whose correct choice is one of the
 * options. Rejects a bad index, a mismatch apology, or a computed number
 * that is not the marked choice.
 */
export function assertGeneratedQuestion(raw: unknown): Question {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Generated question must be a JSON object");
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.text !== "string") {
    throw new Error("Generated question is missing text");
  }
  const text = stripInlineOptionList(record.text);
  if (!text.trim()) {
    throw new Error("Generated question is missing text");
  }
  if (
    !Array.isArray(record.options) ||
    record.options.length !== EXPECTED_OPTION_COUNT ||
    record.options.some((option) => typeof option !== "string" || !option.trim())
  ) {
    throw new Error(`Expected exactly ${EXPECTED_OPTION_COUNT} options`);
  }
  const options = record.options as string[];
  const index = typeof record.correctAnswerIndex === "number" ? record.correctAnswerIndex : undefined;
  const correctAnswer = typeof record.correctAnswer === "string" ? record.correctAnswer : undefined;
  const resolved = resolveCorrectIndex(options, index, correctAnswer);
  const explanation = record.explanation;
  if (typeof explanation !== "string" || !explanation.trim()) {
    throw new Error("Explanation must be generated with the answer");
  }
  if (explanationSignalsMismatch(explanation)) {
    throw new Error("Explanation signals the choices do not match");
  }
  const chosen = options[resolved];
  if (!chosen || !computedAnswerInChoices(explanation, options, chosen)) {
    throw new Error("Computed answer is not among the choices");
  }
  return {
    id: typeof record.id === "string" && record.id ? record.id : "generated",
    text,
    options,
    correctAnswer: chosen,
    explanation,
    difficulty: typeof record.difficulty === "number" ? record.difficulty : 1,
    section: typeof record.section === "string" ? record.section : undefined,
  };
}

/**
 * Validate AI-generated questions for consistency
 */
function validateQuestion(
  question: Question,
  section: string
): Question {
  // Basic format validation
  if (!question.options.includes(question.correctAnswer)) {
    throw new Error("Correct answer must match one of the options exactly");
  }

  if (!question.explanation?.trim()) {
    throw new Error("Explanation must be generated with the answer");
  }

  // Letter agreement is checked after shuffleOptions rewrites the explanation.
  // Extract the letter and content of the correct answer
  const correctLetter = question.correctAnswer.charAt(0);
  const correctContent =
    question.correctAnswer.split(") ")[1]?.trim().toLowerCase() || "";
  const explanationLower = (question.explanation || "").toLowerCase();

  // Special handling for grammar/writing questions
  const isGrammarQuestion =
    section.toLowerCase() === "writing" &&
    correctContent.length < 6 &&
    question.options.every(
      (opt: string) => (opt.split(") ")[1]?.trim().length || 0) < 6
    );

  const hasAnswerReference = isGrammarQuestion
    ? // Grammar question validation
      explanationLower.includes(`'${correctContent}'`) ||
      explanationLower.includes(`"${correctContent}"`) ||
      explanationLower.includes(`correct verb is '${correctContent}'`) ||
      explanationLower.includes(`correct verb is "${correctContent}"`) ||
      explanationLower.includes(`correct form is '${correctContent}'`) ||
      explanationLower.includes(`correct form is "${correctContent}"`) ||
      (explanationLower.includes(correctContent) &&
        (explanationLower.includes("singular verb") ||
          explanationLower.includes("plural verb") ||
          explanationLower.includes("correct verb") ||
          explanationLower.includes("verb form")))
    : // Regular question validation
      explanationLower.includes(`option ${correctLetter.toLowerCase()}`) ||
      explanationLower.includes(`answer ${correctLetter.toLowerCase()}`) ||
      explanationLower.includes(`${correctLetter.toLowerCase()})`) ||
      explanationLower.includes(correctContent) ||
      correctContent
        .split(" ")
        .some(
          (word: string) =>
            word.length > 4 &&
            !["with", "that", "than", "this", "then", "when", "what"].includes(
              word
            ) &&
            explanationLower.includes(word.toLowerCase())
        );

  if (!hasAnswerReference) {
    // Debug log for development
    logger.debug("Answer validation failed:", {
      correctLetter,
      correctContent,
      explanation: explanationLower,
      isGrammarQuestion,
    });
    throw new Error("Explanation must reference the correct answer");
  }

  return question;
}

/**
 * Build the prompt for question generation
 */
function buildQuestionPrompt(
  section: string,
  difficulty: Difficulty,
  passage?: string
): string {
  const sectionPrompt = getSectionPrompt(section);
  const templates =
    section.toLowerCase() === "writing" ? WRITING_TEMPLATES[difficulty] : [];
  
  const templateStr = templates && templates.length > 0 ? templates.join(" or ") : "core concepts";

  const passageBlock = passage
    ? `

The question must be about this passage and answerable only from it:

"""
${passage}
"""
`
    : "";

  return `Generate a single, authentic SAT ${sectionPrompt} question.${passageBlock}

Requirements:
1. Follow EXACT SAT format and style
2. Difficulty level: ${difficulty}/5
3. Focus on ${templateStr}
4. Must include exactly ${EXPECTED_OPTION_COUNT} answer choices labeled A, B, C, D
5. Write the explanation in this same response, together with correctAnswer
6. correctAnswerIndex is the 0-based index of that correct choice (0 is A, 3 is D)
7. If the explanation names a choice letter, that letter must be the letter of correctAnswer
8. The value the explanation computes must be one of the four choices. Do not return a question whose explanation says the choices do not match or that you need to re-calculate
9. "text" is the question stem only. Do not repeat the A–D choices inside the question text
10. Explain using the correct choice's wording. If you name a letter, name only correctAnswer's letter, and do not also say that letter is wrong

Format response as JSON with:
{
  "text": "question text",
  "options": [
    "A) answer1",
    "B) answer2", 
    "C) answer3",
    "D) answer4"
  ],
  "correctAnswerIndex": 0,
  "correctAnswer": "A) answer1",
  "explanation": "detailed explanation showing work that leads to the correct answer",
  "id": "unique_id_${Date.now()}",
  "section": "${section}"
}

Example format:
{
  "text": "If 2x + 3 = 11, what is the value of x?",
  "options": [
    "A) 4",
    "B) 5",
    "C) 6",
    "D) 7"
  ],
  "correctAnswer": "A) 4",
  "explanation": "To solve 2x + 3 = 11: Subtract 3 from both sides: 2x = 8. Divide both sides by 2: x = 4. We can verify: 2(4) + 3 = 8 + 3 = 11"
}

IMPORTANT: Verify that:
1. The explanation's solution matches the marked correct answer
2. The correct answer appears in the options list
3. The mathematical work in the explanation is accurate`;
}

/**
 * System prompt for SAT question generation
 */
const SYSTEM_PROMPT = `You are an expert SAT test writer with years of experience creating official SAT questions. 
Respond with raw JSON only. Make questions exactly match official SAT style and difficulty.`;

/** Placeholders that are not A–D, so a rewrite cannot match itself. */
const LETTER_MARK: Record<string, string> = {
  A: "\uE000",
  B: "\uE001",
  C: "\uE002",
  D: "\uE003",
};

/**
 * Move choice letters in an explanation from the pre-shuffle labels to the
 * labels those same options have after shuffling.
 */
export function rewriteChoiceLetters(
  explanation: string,
  oldToNew: ReadonlyMap<string, string>
): string {
  const swap = (letter: string) => {
    const next = oldToNew.get(letter.toUpperCase());
    return (next && LETTER_MARK[next]) || letter;
  };

  let text = explanation;
  text = text.replace(
    /\b(choice|option|answer(?:\s+choice)?)\s+([A-D])\b/gi,
    (_match, prefix: string, letter: string) => `${prefix} ${swap(letter)}`
  );
  text = text.replace(
    /\(([A-D])\)/g,
    (_match, letter: string) => `(${swap(letter)})`
  );
  text = text.replace(
    /\b([A-D])\)/g,
    (_match, letter: string) => `${swap(letter)})`
  );
  text = text.replace(
    /\b([A-D])\s+(and|or|nor)\s+([A-D])\b/gi,
    (_match, first: string, conj: string, second: string) =>
      `${swap(first)} ${conj} ${swap(second)}`
  );
  text = text.replace(
    /\b([A-D])(?=\s+is\s+(?:not\s+)?(?:the\s+)?(?:in)?(?:correct|right|best|wrong)\b)/gi,
    (_match, letter: string) => swap(letter)
  );
  text = text.replace(
    /\b((?:correct|right|best)\s+(?:answer|choice|option)\s+is\s+(?:choice\s+|option\s+)?)([A-D])\b/gi,
    (_match, prefix: string, letter: string) => `${prefix}${swap(letter)}`
  );
  text = text.replace(
    /\b(answer\s+is\s+(?:choice\s+|option\s+)?)([A-D])\b/gi,
    (_match, prefix: string, letter: string) => `${prefix}${swap(letter)}`
  );
  text = text.replace(
    /\bmakes(\s+(?:this|that|it|the))?(\s+(?:choice|option|answer))?\s+([A-D])\b/gi,
    (full: string, mid: string | undefined, prefix: string | undefined, letter: string) => {
      if (letter !== letter.toUpperCase()) return full;
      return `makes${mid ?? ""}${prefix ?? ""} ${swap(letter)}`;
    }
  );
  text = text.replace(
    /\b(choose|select|pick)(\s+(?:choice|option|answer))?\s+([A-D])\b/gi,
    (full: string, verb: string, prefix: string | undefined, letter: string) => {
      if (letter !== letter.toUpperCase()) return full;
      return `${verb}${prefix ?? ""} ${swap(letter)}`;
    }
  );

  return text.replace(/[\uE000-\uE003]/g, (mark) => {
    if (mark === "\uE000") return "A";
    if (mark === "\uE001") return "B";
    if (mark === "\uE002") return "C";
    return "D";
  });
}

/**
 * Shuffle options and rewrite explanation letters to the new order.
 */
export function shuffleOptions(question: Question): Question {
  const questionCopy = { ...question };

  const parsed = questionCopy.options.map((option: string, index: number) => {
    const match = option.match(/^([A-D])\)\s(.+)$/);
    return {
      letter: match?.[1] ?? CHOICE_LETTERS[index] ?? "",
      content: match?.[2] ?? option,
    };
  });

  const correctAnswerMatch =
    questionCopy.correctAnswer.match(/^[A-D]\)\s(.+)$/);
  const correctAnswerContent =
    correctAnswerMatch?.[1] ?? questionCopy.correctAnswer;

  const flagged = parsed.map((item) => ({
    ...item,
    isCorrect: item.content === correctAnswerContent,
  }));

  const shuffled = shuffle(flagged);
  const oldToNew = new Map<string, string>();
  questionCopy.options = shuffled.map((item, index) => {
    const newLetter = CHOICE_LETTERS[index] ?? "";
    if (item.letter && newLetter) oldToNew.set(item.letter, newLetter);
    return `${newLetter}) ${item.content}`;
  });

  const correctIndex = shuffled.findIndex((item) => item.isCorrect);
  const correctLabel = CHOICE_LETTERS[correctIndex];
  const labeledCorrect = shuffled[correctIndex];
  if (correctLabel && labeledCorrect) {
    questionCopy.correctAnswer = `${correctLabel}) ${labeledCorrect.content}`;
  }

  questionCopy.text = stripInlineOptionList(questionCopy.text);
  if (questionCopy.explanation) {
    questionCopy.explanation = alignExplanation(
      rewriteChoiceLetters(questionCopy.explanation, oldToNew),
      questionCopy.correctAnswer,
      questionCopy.options
    );
  }

  return questionCopy;
}

/**
 * Shuffle for delivery, then drop items whose explanation letter or passage
 * still disagrees with the scored answer.
 */
export function deliverQuestion(
  question: Question,
  passage?: string | null
): Question | null {
  const stripped: Question = {
    ...question,
    text: stripInlineOptionList(question.text),
  };
  if (!stripped.text.trim() || !stripped.explanation?.trim()) return null;
  if (passage && !questionBelongsToPassage(stripped, passage)) return null;

  const prepared = labelAndShuffle(stripped);
  if (!explanationMatchesCorrectAnswer(prepared)) return null;
  if (
    !computedAnswerInChoices(
      prepared.explanation ?? "",
      prepared.options,
      prepared.correctAnswer
    )
  ) {
    return null;
  }
  if (passage && !questionBelongsToPassage(prepared, passage)) return null;
  return prepared;
}

/**
 * Label options A)–D) if needed, then shuffle them
 */
export function labelAndShuffle(question: Question): Question {
  return shuffleOptions(preprocessQuestion(question));
}

/**
 * Preprocess questions to add A), B), C), D) labels if missing
 */
export function preprocessQuestion(question: Question): Question {
  const labels = ["A", "B", "C", "D"];
  const questionCopy = { ...question };

  // Check if options already have labels
  const firstOption = questionCopy.options[0];
  const hasLabels = firstOption && /^[A-D]\)/.test(firstOption);

  if (hasLabels) {
    return questionCopy;
  }

  // Add labels to options
  questionCopy.options = questionCopy.options.map(
    (option: string, index: number) => `${labels[index] ?? ""}) ${option}`
  );

  // Find the index of the correct answer
  const correctIndex = questionCopy.options.findIndex((option: string) =>
    option.includes(questionCopy.correctAnswer)
  );

  // Update the correct answer with its label
  if (correctIndex >= 0) {
    const correctOption = questionCopy.options[correctIndex];
    if (correctOption) {
      questionCopy.correctAnswer = correctOption;
    }
  } else {
    const correctAnswerIndex = questionCopy.options.findIndex(
      (option: string) => option.includes(`) ${questionCopy.correctAnswer}`)
    );
    if (correctAnswerIndex >= 0) {
      const correctOption = questionCopy.options[correctAnswerIndex];
      if (correctOption) {
        questionCopy.correctAnswer = correctOption;
      }
    }
  }

  return questionCopy;
}

/**
 * Clean AI-generated options by removing labels if present
 */
function mentionsChoiceLetter(explanation: string): boolean {
  if (lettersClaimedCorrect(explanation).length > 0) return true;
  return /\b(?:choice|option|answer(?:\s+choice)?)\s+[A-D]\b|\([A-D]\)|\b[A-D]\)/i.test(
    explanation
  );
}

function cleanAIGeneratedQuestion(question: Question): Question {
  const questionCopy = { ...question };

  // Keep the model's letters so shuffle can map them onto the new order.
  if (mentionsChoiceLetter(questionCopy.explanation ?? "")) {
    return questionCopy;
  }

  const hasLabels = questionCopy.options.every((option: string) =>
    /^[A-D]\)\s/.test(option)
  );

  if (hasLabels) {
    questionCopy.options = questionCopy.options.map((option: string) => {
      const match = option.match(/^[A-D]\)\s(.+)$/);
      return match?.[1] ?? option;
    });

    const correctAnswerMatch =
      questionCopy.correctAnswer.match(/^[A-D]\)\s(.+)$/);
    if (correctAnswerMatch?.[1]) {
      questionCopy.correctAnswer = correctAnswerMatch[1];
    }
  }

  return questionCopy;
}

/**
 * Default reading passage for fallback
 */
export const DEFAULT_READING_PASSAGE = `Digital literacy has become an essential skill in today's rapidly evolving technological landscape. As our society becomes increasingly dependent on digital tools and platforms, the ability to navigate, evaluate, and create digital content has transformed from a specialized skill to a fundamental requirement for full participation in civic, economic, and social life.

Research indicates that individuals with strong digital literacy skills have greater access to educational opportunities, higher earning potential, and more civic engagement. Despite this, significant disparities in digital literacy persist across demographic groups, creating what experts refer to as the "digital divide." This gap threatens to exacerbate existing social inequalities if not addressed through comprehensive educational initiatives.

Educational institutions at all levels are responding by integrating digital literacy into their curricula. These programs aim to develop not only technical proficiency but also critical thinking skills necessary to evaluate online information. The most effective approaches combine hands-on technical training with broader discussions about digital citizenship, privacy, and security.

While some critics argue that the emphasis on digital skills may come at the expense of traditional learning, proponents maintain that digital literacy complements rather than replaces foundational skills like reading, writing, and critical thinking. In fact, research suggests that well-designed digital literacy programs can enhance these traditional competencies.

As technology continues to evolve, so too must our understanding of what constitutes digital literacy. What began as basic computer skills has expanded to include media literacy, information literacy, and computational thinking. This dynamic nature of digital literacy presents both challenges and opportunities for educators and policymakers committed to preparing citizens for full participation in the digital age.`;

/**
 * Generate a reading passage using AI
 */
export async function generateReadingPassage(): Promise<string> {
  try {
    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert SAT test writer with years of experience creating official SAT reading passages. 
          Create a high-quality, engaging passage suitable for SAT reading comprehension questions.`,
        },
        {
          role: "user",
          content: `Generate a SAT-style reading passage on a random topic.

          Requirements:
          1. 300-500 words in length
          2. College-level vocabulary and complexity
          3. Clear paragraphs with logical structure
          4. Suitable for generating 3-5 reading comprehension questions
          5. Topics can include: science, history, social studies, literature, or current affairs
          6. Avoid controversial political topics
          7. Include sufficient detail and nuance to support analytical questions

          Return ONLY the passage text with paragraph breaks. No introduction, no title, no questions.`,
        },
      ],
      model: QUESTION_MODEL,
      temperature: 0.8,
    });

    const firstChoice = completion.choices[0];
    if (!firstChoice?.message?.content) {
      throw new Error("No content received from OpenAI");
    }
    const content = firstChoice.message.content;

    return content.trim();
  } catch (error) {
    logger.error("Error generating reading passage:", error);
    return DEFAULT_READING_PASSAGE;
  }
}

/**
 * Generate and validate one question. Throws when the model response is
 * missing, unparseable, or inconsistent with its own explanation.
 */
export async function generateQuestion(
  section: string,
  difficulty: Difficulty,
  passage?: string
): Promise<Question> {
  let lastError: unknown;

  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const completion = await getOpenAIClient().chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: buildQuestionPrompt(section, difficulty, passage),
          },
        ],
        model: QUESTION_MODEL,
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      const question = validateQuestion(
        assertGeneratedQuestion(JSON.parse(cleanContent)),
        section
      );
      if (passage && !questionBelongsToPassage(question, passage)) {
        throw new Error("Question does not belong to the passage");
      }
      return question;
    } catch (error) {
      lastError = error;
      logger.warn(`Discarding inconsistent ${section} question`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to generate a consistent question");
}

async function generateOne(
  section: string,
  idPrefix: string,
  passage: string | undefined,
  wave: number,
  index: number
): Promise<Question | null> {
  const difficulty = (Math.floor(Math.random() * 5) + 1) as Difficulty;
  try {
    const validated = await generateQuestion(section, difficulty, passage);
    const cleaned = cleanAIGeneratedQuestion({
      ...validated,
      id: `ai-${idPrefix}-${Date.now()}-${wave}-${index}`,
      difficulty,
      section,
    });
    if (passage && !questionBelongsToPassage(cleaned, passage)) return null;
    return cleaned;
  } catch (error) {
    logger.error(`Error generating question ${index + 1} for ${section}:`, error);
    return null;
  }
}

/**
 * Generate `count` questions at random difficulty.
 * A failed item is replaced until the count is met or the attempt budget runs out.
 * Returns an empty array when OpenAI is not configured.
 */
export async function generateQuestions(
  section: string,
  count: number,
  idPrefix: string = section,
  passage?: string
): Promise<Question[]> {
  if (!hasOpenAIKey() || count <= 0) return [];

  const accepted: Question[] = [];
  for (let wave = 0; wave < GENERATION_ATTEMPTS && accepted.length < count; wave += 1) {
    const needed = count - accepted.length;
    const batch = await Promise.all(
      Array.from({ length: needed }, (_, index) =>
        generateOne(section, idPrefix, passage, wave, index)
      )
    );
    for (const question of batch) {
      if (question && accepted.length < count) accepted.push(question);
    }
  }
  return accepted;
}

/**
 * Questions ready to show: the requested count, with choices shuffled and
 * explanations aligned. Stops when a wave produces nothing deliverable.
 */
export async function generateDeliveredQuestions(
  section: string,
  count: number,
  idPrefix: string = section,
  passage?: string | null
): Promise<Question[]> {
  if (!hasOpenAIKey() || count <= 0) return [];

  const delivered: Question[] = [];
  for (let round = 0; round < GENERATION_ATTEMPTS && delivered.length < count; round += 1) {
    const before = delivered.length;
    const batch = await generateQuestions(
      section,
      count - delivered.length,
      idPrefix,
      passage ?? undefined
    );
    if (batch.length === 0) break;
    for (const question of batch) {
      if (delivered.length >= count) break;
      const item = deliverQuestion(question, passage);
      if (item) delivered.push(item);
    }
    if (delivered.length === before) break;
  }
  return delivered;
}
