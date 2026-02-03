/**
 * Study Guide type definitions
 * AI-generated study materials from uploaded content
 */

import type { Timestamp, UserId } from "./common";

export type StudyGuideId = string;

/**
 * Section of a study guide
 */
export interface StudyGuideSection {
  id: string;
  title: string;
  content: string;
  /** Key points/bullet items */
  keyPoints?: string[];
  /** Generated questions for this section */
  questions?: StudyGuideQuestion[];
}

/**
 * Generated question from study guide content
 */
export interface StudyGuideQuestion {
  id: string;
  question: string;
  answer: string;
  type: "short_answer" | "multiple_choice" | "true_false";
  options?: string[];
  correctOptionIndex?: number;
}

/**
 * Status of study guide generation
 */
export type StudyGuideStatus = "processing" | "completed" | "failed";

/**
 * Flashcard generated from study content
 */
export interface GeneratedFlashcard {
  term: string;
  definition: string;
}

/**
 * Complete study guide
 */
export interface StudyGuide {
  id?: StudyGuideId;
  userId?: UserId;
  title: string;
  /** Original source material description */
  sourceDescription?: string;
  /** Summary of the content */
  summary: string;
  /** Organized sections/topics */
  sections: StudyGuideSection[];
  /** Generated flashcards */
  flashcards?: GeneratedFlashcard[];
  /** Generated practice questions */
  questions?: StudyGuideQuestion[];
  /** Generated flashcard set ID (if created) */
  flashcardSetId?: string;
  /** Status of generation */
  status: StudyGuideStatus;
  /** Error message if failed */
  errorMessage?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Input for creating a study guide
 */
export interface CreateStudyGuideInput {
  /** Text content to analyze */
  content: string;
  /** Optional title (will be generated if not provided) */
  title?: string;
  /** Type of content */
  contentType: "text" | "notes" | "transcript" | "article";
  /** Subject area for better context */
  subject?: string;
  /** Desired number of sections */
  sectionCount?: number;
  /** Generate flashcards from content */
  generateFlashcards?: boolean;
  /** Generate practice questions */
  generateQuestions?: boolean;
}

/**
 * Options for study guide generation
 */
export interface StudyGuideOptions {
  /** Target audience level */
  level: "beginner" | "intermediate" | "advanced";
  /** Emphasis on key concepts */
  emphasizeConcepts: boolean;
  /** Include examples */
  includeExamples: boolean;
  /** Maximum length of summary */
  maxSummaryLength: number;
  /** Number of key points per section */
  keyPointsPerSection: number;
}

/**
 * Default study guide options
 */
export const DEFAULT_STUDY_GUIDE_OPTIONS: StudyGuideOptions = {
  level: "intermediate",
  emphasizeConcepts: true,
  includeExamples: true,
  maxSummaryLength: 500,
  keyPointsPerSection: 5,
};
