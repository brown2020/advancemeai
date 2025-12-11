/**
 * Mock/fallback questions for practice tests
 * Used when AI generation fails or for unauthenticated users
 */

import type { Question } from "@/types/question";

/**
 * Mock questions organized by section
 */
export const MOCK_QUESTIONS: Record<string, Question[]> = {
  reading: [
    {
      id: "r1",
      text: "What is the main idea of the passage?",
      options: [
        "A) The author's childhood experiences",
        "B) The importance of education",
        "C) The development of a new theory",
        "D) The impact of technology on society",
      ],
      correctAnswer: "D) The impact of technology on society",
      difficulty: "medium",
      explanation:
        "The passage primarily discusses how technology has transformed various aspects of society, making this the main focus.",
    },
    {
      id: "r2",
      text: "According to the passage, what is the author's view on digital literacy?",
      options: [
        "A) It is unnecessary for most people",
        "B) It is essential in the modern world",
        "C) It should be taught only in universities",
        "D) It is less important than traditional literacy",
      ],
      correctAnswer: "B) It is essential in the modern world",
      difficulty: "easy",
      explanation:
        "The author emphasizes throughout the passage that digital literacy has become essential for participation in modern society.",
    },
    {
      id: "r3",
      text: "Which of the following best describes the tone of the passage?",
      options: [
        "A) Critical",
        "B) Enthusiastic",
        "C) Neutral",
        "D) Pessimistic",
      ],
      correctAnswer: "C) Neutral",
      difficulty: "hard",
      explanation:
        "The passage presents information objectively without strong emotional language or bias, indicating a neutral tone.",
    },
  ],
  writing: [
    {
      id: "w1",
      text: "Choose the sentence that contains a grammatical error.",
      options: [
        "A) She went to the store yesterday.",
        "B) They are going to the beach tomorrow.",
        "C) He don't like chocolate ice cream.",
        "D) We have been waiting for an hour.",
      ],
      correctAnswer: "C) He don't like chocolate ice cream.",
      difficulty: "easy",
      explanation:
        "The correct form should be 'He doesn't like' - 'don't' is incorrect with singular third-person subjects.",
    },
    {
      id: "w2",
      text: "Which sentence uses punctuation correctly?",
      options: [
        "A) The cat, jumped over the fence.",
        'B) She said, "I\'ll be there soon."',
        "C) They went to the store they bought milk.",
        "D) He asked, if she was coming to the party.",
      ],
      correctAnswer: 'B) She said, "I\'ll be there soon."',
      difficulty: "medium",
      explanation:
        "Option B correctly uses a comma after 'said' and properly punctuates the quoted speech.",
    },
    {
      id: "w3",
      text: "Select the most effective revision of the underlined portion: The experiment results were surprising, they contradicted previous findings.",
      options: [
        "A) surprising, they contradicted",
        "B) surprising; they contradicted",
        "C) surprising they contradicted",
        "D) surprising. Contradicting",
      ],
      correctAnswer: "B) surprising; they contradicted",
      difficulty: "medium",
      explanation:
        "A semicolon correctly joins two independent clauses, fixing the comma splice in the original.",
    },
  ],
  "math-no-calc": [
    {
      id: "mnc1",
      text: "Solve for x: 2x + 5 = 15",
      options: ["A) x = 5", "B) x = 10", "C) x = 7.5", "D) x = 5.5"],
      correctAnswer: "A) x = 5",
      difficulty: "easy",
      explanation: "Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5.",
    },
    {
      id: "mnc2",
      text: "If f(x) = x² - 3x + 2, what is f(4)?",
      options: ["A) 6", "B) 10", "C) 14", "D) 18"],
      correctAnswer: "A) 6",
      difficulty: "medium",
      explanation: "f(4) = 4² - 3(4) + 2 = 16 - 12 + 2 = 6",
    },
    {
      id: "mnc3",
      text: "What is the slope of the line 3x - 2y = 6?",
      options: ["A) 3/2", "B) 2/3", "C) -3/2", "D) 3"],
      correctAnswer: "A) 3/2",
      difficulty: "medium",
      explanation:
        "Rearrange to slope-intercept form: -2y = -3x + 6, so y = (3/2)x - 3. The slope is 3/2.",
    },
  ],
  "math-calc": [
    {
      id: "mc1",
      text: "A car travels at a speed of 60 miles per hour. How far will it travel in 2.5 hours?",
      options: ["A) 120 miles", "B) 150 miles", "C) 180 miles", "D) 200 miles"],
      correctAnswer: "B) 150 miles",
      difficulty: "easy",
      explanation: "Distance = Speed × Time = 60 × 2.5 = 150 miles",
    },
    {
      id: "mc2",
      text: "If the average of 5 numbers is 20, what is their sum?",
      options: ["A) 4", "B) 25", "C) 100", "D) 125"],
      correctAnswer: "C) 100",
      difficulty: "easy",
      explanation: "Sum = Average × Count = 20 × 5 = 100",
    },
    {
      id: "mc3",
      text: "A store offers a 20% discount on a $80 item. What is the sale price?",
      options: ["A) $16", "B) $60", "C) $64", "D) $96"],
      correctAnswer: "C) $64",
      difficulty: "medium",
      explanation: "Discount = 80 × 0.20 = $16. Sale price = $80 - $16 = $64",
    },
  ],
  // Legacy section names for backward compatibility
  math: [
    {
      id: "math1",
      text: "What is 2 + 2?",
      options: ["A) 3", "B) 4", "C) 5", "D) 6"],
      correctAnswer: "B) 4",
      difficulty: 1,
      explanation: "Basic addition: 2 + 2 = 4",
    },
    {
      id: "math2",
      text: "What is the square root of 16?",
      options: ["A) 2", "B) 3", "C) 4", "D) 5"],
      correctAnswer: "C) 4",
      difficulty: 2,
      explanation: "The square root of 16 is 4 because 4 × 4 = 16",
    },
    {
      id: "math3",
      text: "What is 15 × 12?",
      options: ["A) 160", "B) 170", "C) 180", "D) 190"],
      correctAnswer: "C) 180",
      difficulty: 3,
      explanation: "15 × 12 = (15 × 10) + (15 × 2) = 150 + 30 = 180",
    },
    {
      id: "math4",
      text: "If x² - 5x + 6 = 0, what are the values of x?",
      options: ["A) 2 and 3", "B) 1 and 4", "C) 3 and 4", "D) 2 and 4"],
      correctAnswer: "A) 2 and 3",
      difficulty: 4,
      explanation: "Using factoring: (x-2)(x-3)=0, so x=2 or x=3",
    },
  ],
};

/**
 * Alias for backward compatibility
 */
export const fallbackQuestions = MOCK_QUESTIONS;

/**
 * Get mock questions for a section
 */
export function getMockQuestions(sectionId: string): Question[] {
  return MOCK_QUESTIONS[sectionId] || [];
}

/**
 * Get a random subset of mock questions
 */
export function getRandomMockQuestions(
  sectionId: string,
  count: number
): Question[] {
  const questions = getMockQuestions(sectionId);
  if (questions.length === 0) return [];

  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
