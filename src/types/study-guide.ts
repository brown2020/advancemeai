/**
 * Study Guide type definitions
 * AI-generated study materials from uploaded content
 */

import type { Timestamp, UserId } from "./common";

type StudyGuideId = string;

/**
 * Section of a study guide
 */
interface StudyGuideSection {
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
interface StudyGuideQuestion {
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
type StudyGuideStatus = "processing" | "completed" | "failed";

/**
 * Flashcard generated from study content
 */
interface GeneratedFlashcard {
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
