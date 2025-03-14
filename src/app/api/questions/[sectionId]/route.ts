import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock questions for each section (fallback if AI generation fails)
const mockQuestions = {
  reading: [
    {
      id: "r1",
      text: "What is the main idea of the passage?",
      options: [
        "Option A: The author's childhood experiences",
        "Option B: The importance of education",
        "Option C: The development of a new theory",
        "Option D: The impact of technology on society",
      ],
      correctAnswer: "Option D: The impact of technology on society",
      difficulty: "medium",
      explanation:
        "The passage primarily discusses how technology has transformed various aspects of society, making this the main focus.",
    },
    {
      id: "r2",
      text: "According to the passage, what is the author's view on digital literacy?",
      options: [
        "Option A: It is unnecessary for most people",
        "Option B: It is essential in the modern world",
        "Option C: It should be taught only in universities",
        "Option D: It is less important than traditional literacy",
      ],
      correctAnswer: "Option B: It is essential in the modern world",
      difficulty: "easy",
    },
    {
      id: "r3",
      text: "Which of the following best describes the tone of the passage?",
      options: [
        "Option A: Critical",
        "Option B: Enthusiastic",
        "Option C: Neutral",
        "Option D: Pessimistic",
      ],
      correctAnswer: "Option C: Neutral",
      difficulty: "hard",
    },
  ],
  writing: [
    {
      id: "w1",
      text: "Choose the sentence that contains a grammatical error.",
      options: [
        "Option A: She went to the store yesterday.",
        "Option B: They are going to the beach tomorrow.",
        "Option C: He don't like chocolate ice cream.",
        "Option D: We have been waiting for an hour.",
      ],
      correctAnswer: "Option C: He don't like chocolate ice cream.",
      difficulty: "easy",
    },
    {
      id: "w2",
      text: "Which sentence uses punctuation correctly?",
      options: [
        "Option A: The cat, jumped over the fence.",
        'Option B: She said, "I\'ll be there soon."',
        "Option C: They went to the store they bought milk.",
        "Option D: He asked, if she was coming to the party.",
      ],
      correctAnswer: 'Option B: She said, "I\'ll be there soon."',
      difficulty: "medium",
    },
  ],
  "math-no-calc": [
    {
      id: "mnc1",
      text: "Solve for x: 2x + 5 = 15",
      options: [
        "Option A: x = 5",
        "Option B: x = 10",
        "Option C: x = 7.5",
        "Option D: x = 5.5",
      ],
      correctAnswer: "Option A: x = 5",
      difficulty: "easy",
    },
    {
      id: "mnc2",
      text: "If f(x) = x² - 3x + 2, what is f(4)?",
      options: ["Option A: 6", "Option B: 10", "Option C: 14", "Option D: 18"],
      correctAnswer: "Option B: 10",
      difficulty: "medium",
    },
  ],
  "math-calc": [
    {
      id: "mc1",
      text: "A car travels at a speed of 60 miles per hour. How far will it travel in 2.5 hours?",
      options: [
        "Option A: 120 miles",
        "Option B: 150 miles",
        "Option C: 180 miles",
        "Option D: 200 miles",
      ],
      correctAnswer: "Option B: 150 miles",
      difficulty: "easy",
    },
    {
      id: "mc2",
      text: "The graph of y = f(x) is shown above. What is the value of f(3)?",
      options: ["Option A: 2", "Option B: 3", "Option C: 4", "Option D: 5"],
      correctAnswer: "Option C: 4",
      difficulty: "medium",
    },
  ],
};

// Function to get section prompt for OpenAI
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

// SAT-specific question templates
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

type Difficulty = 1 | 2 | 3 | 4 | 5;

// Function to validate AI-generated questions
function validateQuestion(question: any, section: string) {
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
}

// Function to generate AI questions
async function generateAIQuestions(
  sectionId: string,
  count: number = 3
): Promise<any[]> {
  try {
    // Map section IDs to the format expected by the AI generation endpoint
    const sectionMap: Record<string, string> = {
      reading: "reading",
      writing: "writing",
      "math-no-calc": "math",
      "math-calc": "math-calc",
    };

    const section = sectionMap[sectionId] || sectionId;
    const questions = [];

    // Generate multiple questions with varying difficulty
    for (let i = 0; i < count; i++) {
      try {
        // Vary difficulty from 1-5
        const difficulty = Math.floor(Math.random() * 5) + 1;

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

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content received from OpenAI");

        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();

        const question = JSON.parse(cleanContent);
        const validatedQuestion = validateQuestion(question, section);

        questions.push({
          ...validatedQuestion,
          id: `ai-${sectionId}-${i}-${Date.now()}`, // Ensure unique ID
          difficulty: difficulty,
        });

        console.log(
          `Successfully generated AI question ${i + 1} for section ${sectionId}`
        );
      } catch (error) {
        console.error(
          `Error generating question ${i + 1} for section ${sectionId}:`,
          error
        );
        // Continue to the next question if one fails
      }
    }

    return questions;
  } catch (error) {
    console.error("Error generating AI questions:", error);
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const { sectionId } = await params;

  // Simulate a delay to mimic a real API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // Try to generate AI questions first
    const aiQuestions = await generateAIQuestions(sectionId);

    // If we successfully generated AI questions, return them
    if (aiQuestions && aiQuestions.length > 0) {
      return NextResponse.json(aiQuestions);
    }

    // Fallback to mock questions if AI generation fails
    if (!mockQuestions[sectionId as keyof typeof mockQuestions]) {
      return NextResponse.json(
        { error: `Section ${sectionId} not found` },
        { status: 404 }
      );
    }

    // Return the mock questions for the section
    return NextResponse.json(
      mockQuestions[sectionId as keyof typeof mockQuestions]
    );
  } catch (error) {
    console.error("Error in questions API:", error);

    // Fallback to mock questions in case of any error
    if (mockQuestions[sectionId as keyof typeof mockQuestions]) {
      return NextResponse.json(
        mockQuestions[sectionId as keyof typeof mockQuestions]
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve questions" },
      { status: 500 }
    );
  }
}
