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
      4. Must include 4 answer choices (A, B, C, D)
      5. Include a clear, educational explanation
      
      Format response as JSON with:
      {
        "text": "question text",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "correctAnswer": "exact correct option",
        "explanation": "detailed explanation why the answer is correct and others are wrong",
        "id": "unique_id_${Date.now()}"
      }

      Example of good question style:
      "In the sentence 'The flock of geese (was/were) flying south for the winter,' which option correctly completes the sentence?
      A) was
      B) were"

      Make question similar to official SAT style but completely unique.`;

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
        console.log("Successfully generated AI question:", question);
        return NextResponse.json(question);
      } catch {
        console.error("Failed to parse AI response:", content);
        throw new Error("Invalid JSON response from AI");
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
