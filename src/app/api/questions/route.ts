import { NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import {
  getOpenAIClient,
  WRITING_TEMPLATES,
  getSectionPrompt,
  validateQuestion,
  buildQuestionPrompt,
  SYSTEM_PROMPT,
  type Difficulty,
  type Question,
} from "@/lib/ai/question-generation";

// Fallback questions by section
const fallbackQuestions: Record<string, Question[]> = {
  "math-calc": [
    {
      id: "mathcalc1",
      text: "What is the value of x in the equation 2x + 4 = 12?",
      options: ["A) 2", "B) 4", "C) 6", "D) 8"],
      correctAnswer: "B) 4",
      difficulty: 1,
      explanation:
        "To solve: 2x + 4 = 12, subtract 4 from both sides: 2x = 8, divide by 2: x = 4",
    },
  ],
  math: [
    {
      id: "math1",
      text: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4",
      difficulty: 1,
      explanation: "Basic addition: 2 + 2 = 4",
    },
    {
      id: "2",
      text: "What is the square root of 16?",
      options: ["2", "3", "4", "5"],
      correctAnswer: "4",
      difficulty: 2,
      explanation: "The square root of 16 is 4 because 4 × 4 = 16",
    },
    {
      id: "3",
      text: "What is 15 × 12?",
      options: ["160", "170", "180", "190"],
      correctAnswer: "180",
      difficulty: 3,
      explanation: "15 × 12 = (15 × 10) + (15 × 2) = 150 + 30 = 180",
    },
    {
      id: "4",
      text: "If x² - 5x + 6 = 0, what are the values of x?",
      options: ["2 and 3", "1 and 4", "3 and 4", "2 and 4"],
      correctAnswer: "2 and 3",
      difficulty: 4,
      explanation: "Using factoring: (x-2)(x-3)=0, so x=2 or x=3",
    },
    {
      id: "5",
      text: "What is the derivative of x³?",
      options: ["x²", "2x²", "3x²", "3x"],
      correctAnswer: "3x²",
      difficulty: 5,
      explanation:
        "The power rule states that the derivative of x^n is n×x^(n-1)",
    },
  ],
  writing: [
    {
      id: "writing1",
      text: "Choose the correct form of the verb: She ___ to the store yesterday.",
      options: ["go", "goes", "went", "gone"],
      correctAnswer: "went",
      difficulty: 1,
      explanation: "Past tense of 'go' is 'went'",
    },
    {
      id: "writing2",
      text: "Which sentence uses the correct punctuation?",
      options: [
        "Its time to eat.",
        "It's time to eat.",
        "Its' time to eat.",
        "Its time' to eat.",
      ],
      correctAnswer: "It's time to eat.",
      difficulty: 2,
      explanation: "It's is the contraction of 'it is'",
    },
  ],
  reading: [
    {
      id: "reading1",
      text: "What is the main purpose of a topic sentence?",
      options: [
        "To end a paragraph",
        "To introduce the main idea",
        "To provide evidence",
        "To create suspense",
      ],
      correctAnswer: "To introduce the main idea",
      difficulty: 1,
      explanation: "A topic sentence presents the main idea of a paragraph",
    },
    {
      id: "reading2",
      text: "Which type of text structure presents events in the order they occurred?",
      options: [
        "Compare and contrast",
        "Chronological",
        "Cause and effect",
        "Problem and solution",
      ],
      correctAnswer: "Chronological",
      difficulty: 2,
      explanation: "Chronological structure presents events in time order",
    },
  ],
};

export async function POST(request: Request) {
  try {
    const { section, difficulty, previousQuestions } = await request.json();

    try {
      const openai = getOpenAIClient();
      const sectionPrompt = getSectionPrompt(section);
      const templates =
        section.toLowerCase() === "writing"
          ? WRITING_TEMPLATES[difficulty as Difficulty]
          : [];

      const prompt = buildQuestionPrompt(section, difficulty as Difficulty);

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        model: "gpt-4o",
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("No content received from OpenAI");

      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();

      try {
        const question = JSON.parse(cleanContent);
        const validatedQuestion = validateQuestion(question, section);
        logger.debug("Successfully generated AI question:", validatedQuestion);
        return NextResponse.json(validatedQuestion);
      } catch (error) {
        logger.error("Failed to parse or validate AI response:", error);
        throw new Error("Invalid or inconsistent response from AI");
      }
    } catch (aiError) {
      logger.error("AI generation failed:", aiError);

      // Get section-specific questions
      const sectionQuestions = fallbackQuestions[section.toLowerCase()] || [];

      if (sectionQuestions.length === 0) {
        throw new Error(`No questions available for section: ${section}`);
      }

      // Improved fallback question selection
      let availableQuestions = sectionQuestions.filter((q) => {
        return (
          !previousQuestions.includes(q.id) &&
          Math.abs(Number(q.difficulty) - difficulty) <= 1
        );
      });

      // If no questions available with ideal difficulty, expand the range
      if (availableQuestions.length === 0) {
        availableQuestions = sectionQuestions.filter(
          (q) => !previousQuestions.includes(q.id)
        );
      }

      // If all questions have been used, reset and use all questions
      if (availableQuestions.length === 0) {
        availableQuestions = sectionQuestions;
        logger.warn("All questions have been used, resetting question pool");
      }

      const randomQuestion =
        availableQuestions[
          Math.floor(Math.random() * availableQuestions.length)
        ];

      if (!randomQuestion) {
        throw new Error("No questions available after filtering");
      }

      return NextResponse.json(randomQuestion);
    }
  } catch (error) {
    logger.error("Error in questions API:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
