import { NextResponse } from "next/server";
import { QuestionsResponseSchema } from "@/types/question";
import { verifySessionFromRequest } from "@/lib/server-auth";
import {
  getOpenAIClient,
  mapSectionId,
  validateQuestion,
  cleanAIGeneratedQuestion,
  shuffleOptions,
  preprocessQuestion,
  generateReadingPassage,
  DEFAULT_READING_PASSAGE,
  buildQuestionPrompt,
  SYSTEM_PROMPT,
  type Difficulty,
  type Question,
} from "@/lib/ai/question-generation";

// Mock questions for each section (fallback if AI generation fails)
const mockQuestions: Record<string, Question[]> = {
  reading: [
    {
      id: "r1",
      text: "What is the main idea of the passage?",
      options: [
        "The author's childhood experiences",
        "The importance of education",
        "The development of a new theory",
        "The impact of technology on society",
      ],
      correctAnswer: "The impact of technology on society",
      difficulty: "medium",
      explanation:
        "The passage primarily discusses how technology has transformed various aspects of society, making this the main focus.",
    },
    {
      id: "r2",
      text: "According to the passage, what is the author's view on digital literacy?",
      options: [
        "It is unnecessary for most people",
        "It is essential in the modern world",
        "It should be taught only in universities",
        "It is less important than traditional literacy",
      ],
      correctAnswer: "It is essential in the modern world",
      difficulty: "easy",
    },
    {
      id: "r3",
      text: "Which of the following best describes the tone of the passage?",
      options: ["Critical", "Enthusiastic", "Neutral", "Pessimistic"],
      correctAnswer: "Neutral",
      difficulty: "hard",
    },
  ],
  writing: [
    {
      id: "w1",
      text: "Choose the sentence that contains a grammatical error.",
      options: [
        "She went to the store yesterday.",
        "They are going to the beach tomorrow.",
        "He don't like chocolate ice cream.",
        "We have been waiting for an hour.",
      ],
      correctAnswer: "He don't like chocolate ice cream.",
      difficulty: "easy",
    },
    {
      id: "w2",
      text: "Which sentence uses punctuation correctly?",
      options: [
        "The cat, jumped over the fence.",
        'She said, "I\'ll be there soon."',
        "They went to the store they bought milk.",
        "He asked, if she was coming to the party.",
      ],
      correctAnswer: 'She said, "I\'ll be there soon."',
      difficulty: "medium",
    },
  ],
  "math-no-calc": [
    {
      id: "mnc1",
      text: "Solve for x: 2x + 5 = 15",
      options: ["x = 5", "x = 10", "x = 7.5", "x = 5.5"],
      correctAnswer: "x = 5",
      difficulty: "easy",
    },
    {
      id: "mnc2",
      text: "If f(x) = x² - 3x + 2, what is f(4)?",
      options: ["6", "10", "14", "18"],
      correctAnswer: "10",
      difficulty: "medium",
    },
  ],
  "math-calc": [
    {
      id: "mc1",
      text: "A car travels at a speed of 60 miles per hour. How far will it travel in 2.5 hours?",
      options: ["120 miles", "150 miles", "180 miles", "200 miles"],
      correctAnswer: "150 miles",
      difficulty: "easy",
    },
    {
      id: "mc2",
      text: "The graph of y = f(x) is shown above. What is the value of f(3)?",
      options: ["2", "3", "4", "5"],
      correctAnswer: "4",
      difficulty: "medium",
    },
  ],
};

/**
 * Generate multiple AI questions for a section
 */
async function generateAIQuestions(
  sectionId: string,
  count: number = 3
): Promise<Question[]> {
  try {
    const section = mapSectionId(sectionId);
    const questions: Question[] = [];
    const openai = getOpenAIClient();

    for (let i = 0; i < count; i++) {
      try {
        const difficulty = (Math.floor(Math.random() * 5) + 1) as Difficulty;
        const prompt = buildQuestionPrompt(section, difficulty);

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
        const question = JSON.parse(cleanContent);
        const validatedQuestion = validateQuestion(question, section);

        const cleanedQuestion = cleanAIGeneratedQuestion({
          ...validatedQuestion,
          id: `ai-${sectionId}-${i}-${Date.now()}`,
          difficulty: difficulty,
        });

        questions.push(cleanedQuestion);
        console.log(
          `Successfully generated AI question ${i + 1} for section ${sectionId}`
        );
      } catch (error) {
        console.error(
          `Error generating question ${i + 1} for section ${sectionId}:`,
          error
        );
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

  // Get count from URL query parameters
  const url = new URL(request.url);
  const countParam = url.searchParams.get("count");
  const count = countParam ? parseInt(countParam, 10) : 3;

  // Limit count to a maximum of 20 questions
  const questionCount = Math.min(Math.max(1, count), 20);

  console.log(`Generating ${questionCount} questions for section ${sectionId}`);

  try {
    const session = await verifySessionFromRequest(request);
    const isAuthed = Boolean(session);

    // Generate a reading passage if this is the reading section
    let readingPassage: string | null = null;
    if (sectionId === "reading") {
      console.log("Generating reading passage");
      readingPassage = await generateReadingPassage();
      console.log("Reading passage generated successfully");
    }

    // Try to generate AI questions first for authenticated users
    const aiQuestions = isAuthed
      ? await generateAIQuestions(sectionId, questionCount)
      : [];

    // If we successfully generated AI questions, shuffle their options and return them
    if (aiQuestions && aiQuestions.length > 0) {
      const preprocessedQuestions = aiQuestions.map((question) =>
        preprocessQuestion(question)
      );
      const shuffledQuestions = preprocessedQuestions.map((question) =>
        shuffleOptions(question)
      );

      const payload = { questions: shuffledQuestions, readingPassage };
      const parsed = QuestionsResponseSchema.safeParse(payload);
      if (!parsed.success) {
        console.error("Invalid questions response:", parsed.error);
        return NextResponse.json(
          { error: "Invalid response format" },
          { status: 500 }
        );
      }
      return NextResponse.json(parsed.data);
    }

    // Fallback to mock questions if AI generation fails
    if (!mockQuestions[sectionId as keyof typeof mockQuestions]) {
      return NextResponse.json(
        { error: `Section ${sectionId} not found` },
        { status: 404 }
      );
    }

    // Preprocess mock questions to add labels, then shuffle them
    const preprocessedMockQuestions = mockQuestions[
      sectionId as keyof typeof mockQuestions
    ].map((question) => preprocessQuestion(question));

    const shuffledMockQuestions = preprocessedMockQuestions.map((question) =>
      shuffleOptions(question)
    );

    const payload = { questions: shuffledMockQuestions, readingPassage };
    const parsed = QuestionsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      console.error("Invalid mock questions response:", parsed.error);
      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 500 }
      );
    }
    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error("Error in questions API:", error);

    // Fallback to mock questions in case of any error
    if (mockQuestions[sectionId as keyof typeof mockQuestions]) {
      const preprocessedMockQuestions = mockQuestions[
        sectionId as keyof typeof mockQuestions
      ].map((question) => preprocessQuestion(question));

      const shuffledMockQuestions = preprocessedMockQuestions.map((question) =>
        shuffleOptions(question)
      );

      return NextResponse.json({
        questions: shuffledMockQuestions,
        readingPassage:
          sectionId === "reading" ? DEFAULT_READING_PASSAGE : null,
      });
    }

    return NextResponse.json(
      { error: "Failed to retrieve questions" },
      { status: 500 }
    );
  }
}
