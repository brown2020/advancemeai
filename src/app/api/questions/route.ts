import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  explanation: string;
}

// Separate fallback questions by section
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
    // Add more math-calc questions...
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

// Add SAT-specific question templates
const WRITING_TEMPLATES = {
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

// At the top of the file, add this type
type Difficulty = 1 | 2 | 3 | 4 | 5;

export async function POST(request: Request) {
  try {
    const { section, difficulty, previousQuestions } = await request.json();

    try {
      const sectionPrompt = getSectionPrompt(section);
      const templates =
        section.toLowerCase() === "writing"
          ? WRITING_TEMPLATES[difficulty as Difficulty]
          : [];

      const prompt = `Generate a single, authentic SAT ${sectionPrompt} question.

      Requirements:
      1. Follow EXACT SAT format and style
      2. Difficulty level: ${difficulty}/5
      3. Focus on ${templates.join(" or ")}
      4. Must include 4 answer choices labeled A, B, C, D
      5. Include a clear, educational explanation that MATCHES the correct answer
      6. Double-check that your explanation supports your chosen correct answer

      Format response as JSON with:
      {
        "text": "question text",
        "options": [
          "A) answer1",
          "B) answer2", 
          "C) answer3",
          "D) answer4"
        ],
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

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert SAT test writer with years of experience creating official SAT questions. 
            Respond with raw JSON only. Make questions exactly match official SAT style and difficulty.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "gpt-4o",
        temperature: 0.7, // Slightly lower temperature for more consistent output
      });

      console.log("OpenAI response:", completion);

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("No content received from OpenAI");

      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();

      try {
        const question = JSON.parse(cleanContent);
        const validatedQuestion = validateQuestion(question, section);
        console.log("Successfully generated AI question:", validatedQuestion);
        return NextResponse.json(validatedQuestion);
      } catch (error) {
        console.error("Failed to parse or validate AI response:", error);
        throw new Error("Invalid or inconsistent response from AI");
      }
    } catch (aiError) {
      console.error("AI generation failed:", aiError);

      // Get section-specific questions
      const sectionQuestions = fallbackQuestions[section.toLowerCase()] || [];

      if (sectionQuestions.length === 0) {
        throw new Error(`No questions available for section: ${section}`);
      }

      // Improved fallback question selection
      let availableQuestions = sectionQuestions.filter((q) => {
        return (
          !previousQuestions.includes(q.id) &&
          Math.abs(q.difficulty - difficulty) <= 1
        );
      });

      // If no questions available with ideal difficulty, expand the difficulty range
      if (availableQuestions.length === 0) {
        availableQuestions = sectionQuestions.filter(
          (q) => !previousQuestions.includes(q.id)
        );
      }

      // If all questions have been used, reset and use all questions
      if (availableQuestions.length === 0) {
        availableQuestions = sectionQuestions;
        console.warn("All questions have been used, resetting question pool");
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
    console.error("Error in questions API:", error);
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
      throw new Error(`Invalid section: ${section}`);
  }
}

// Add validation before returning the response
const validateQuestion = (question: Question, section: string) => {
  // Add debug logging
  console.log("Validating question:", {
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    options: question.options,
  });

  // Basic format validation
  if (!question.options.includes(question.correctAnswer)) {
    throw new Error("Correct answer must match one of the options exactly");
  }

  // Extract the letter and content of the correct answer
  const correctLetter = question.correctAnswer.charAt(0);
  const correctContent = question.correctAnswer
    .split(") ")[1]
    .trim()
    .toLowerCase();
  const explanationLower = question.explanation.toLowerCase();

  // Special handling for grammar/writing questions
  const isGrammarQuestion =
    section.toLowerCase() === "writing" &&
    correctContent.length < 6 &&
    question.options.every(
      (opt: string) => opt.split(") ")[1].trim().length < 6
    );

  const hasAnswerReference = isGrammarQuestion
    ? // Grammar question validation
      explanationLower.includes(`'${correctContent}'`) || // Single quotes
      explanationLower.includes(`"${correctContent}"`) || // Double quotes
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
    console.log("Answer validation failed:", {
      correctLetter,
      correctContent,
      explanation: explanationLower,
      isGrammarQuestion,
    });
    throw new Error("Explanation must reference the correct answer");
  }

  return question;
};
