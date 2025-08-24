import { NextResponse } from "next/server";
import { QuestionSchema, QuestionsResponseSchema } from "@/types/question";
import OpenAI from "openai";
import { verifySessionFromRequest } from "@/lib/server-auth";

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

// Function to shuffle options while tracking the correct answer
function shuffleOptions(question: any): any {
  // Create a copy of the question to avoid modifying the original
  const questionCopy = { ...question };

  // Extract the actual answer content without the labels (A), B), etc.)
  const answerContents = questionCopy.options.map((option: string) => {
    // Extract everything after the label (e.g., "A) ")
    const match = option.match(/^[A-D]\)\s(.+)$/);
    return match ? match[1] : option;
  });

  // Get the correct answer content (without the label)
  const correctAnswerMatch =
    questionCopy.correctAnswer.match(/^[A-D]\)\s(.+)$/);
  const correctAnswerContent = correctAnswerMatch
    ? correctAnswerMatch[1]
    : questionCopy.correctAnswer;

  // Create an array of answer contents with a flag for the correct one
  const contentsWithCorrectFlag = answerContents.map((content: string) => ({
    content,
    isCorrect: content === correctAnswerContent,
  }));

  // Shuffle the answer contents
  for (let i = contentsWithCorrectFlag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [contentsWithCorrectFlag[i], contentsWithCorrectFlag[j]] = [
      contentsWithCorrectFlag[j],
      contentsWithCorrectFlag[i],
    ];
  }

  // Apply the A), B), C), D) labels to the shuffled contents
  const labels = ["A", "B", "C", "D"];
  questionCopy.options = contentsWithCorrectFlag.map(
    (item: { content: string; isCorrect: boolean }, index: number) =>
      `${labels[index]}) ${item.content}`
  );

  // Find which label now has the correct answer and update correctAnswer
  const correctIndex = contentsWithCorrectFlag.findIndex(
    (item: { content: string; isCorrect: boolean }) => item.isCorrect
  );
  questionCopy.correctAnswer = `${labels[correctIndex]}) ${contentsWithCorrectFlag[correctIndex].content}`;

  return questionCopy;
}

// Function to preprocess questions to add A), B), C), D) labels
function preprocessQuestion(question: any): any {
  const labels = ["A", "B", "C", "D"];

  // Create a copy of the question
  const questionCopy = { ...question };

  // Check if options already have labels
  const firstOption = questionCopy.options[0];
  const hasLabels = firstOption && /^[A-D]\)/.test(firstOption);

  // If options already have labels, return as is
  if (hasLabels) {
    return questionCopy;
  }

  // Add labels to options
  questionCopy.options = questionCopy.options.map(
    (option: string, index: number) => `${labels[index]}) ${option}`
  );

  // Find the index of the correct answer
  const correctIndex = questionCopy.options.findIndex((option: string) =>
    option.includes(questionCopy.correctAnswer)
  );

  // Update the correct answer with its label
  if (correctIndex >= 0) {
    questionCopy.correctAnswer = questionCopy.options[correctIndex];
  } else {
    // If we can't find the exact match, add the label to the correct answer
    const correctAnswerIndex = questionCopy.options.findIndex(
      (option: string) => option.includes(`) ${questionCopy.correctAnswer}`)
    );
    if (correctAnswerIndex >= 0) {
      questionCopy.correctAnswer = questionCopy.options[correctAnswerIndex];
    }
  }

  return questionCopy;
}

// Function to clean AI-generated options by removing A), B), C), D) labels if present
function cleanAIGeneratedQuestion(question: any): any {
  const questionCopy = { ...question };

  // Check if options have labels like "A) " at the beginning
  const hasLabels = questionCopy.options.every((option: string) =>
    /^[A-D]\)\s/.test(option)
  );

  if (hasLabels) {
    // Remove labels from options
    questionCopy.options = questionCopy.options.map((option: string) => {
      const match = option.match(/^[A-D]\)\s(.+)$/);
      return match ? match[1] : option;
    });

    // Remove label from correct answer
    const correctAnswerMatch =
      questionCopy.correctAnswer.match(/^[A-D]\)\s(.+)$/);
    if (correctAnswerMatch) {
      questionCopy.correctAnswer = correctAnswerMatch[1];
    }
  }

  return questionCopy;
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

        // Clean the AI-generated question to remove any labels
        const cleanedQuestion = cleanAIGeneratedQuestion({
          ...validatedQuestion,
          id: `ai-${sectionId}-${i}-${Date.now()}`, // Ensure unique ID
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
        // Continue to the next question if one fails
      }
    }

    return questions;
  } catch (error) {
    console.error("Error generating AI questions:", error);
    return [];
  }
}

// Function to generate a reading passage
async function generateReadingPassage(): Promise<string> {
  try {
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
      model: "gpt-4o",
      temperature: 0.8,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content received from OpenAI");

    return content.trim();
  } catch (error) {
    console.error("Error generating reading passage:", error);
    // Return a default passage if generation fails
    return `Digital literacy has become an essential skill in today's rapidly evolving technological landscape. As our society becomes increasingly dependent on digital tools and platforms, the ability to navigate, evaluate, and create digital content has transformed from a specialized skill to a fundamental requirement for full participation in civic, economic, and social life.

Research indicates that individuals with strong digital literacy skills have greater access to educational opportunities, higher earning potential, and more civic engagement. Despite this, significant disparities in digital literacy persist across demographic groups, creating what experts refer to as the "digital divide." This gap threatens to exacerbate existing social inequalities if not addressed through comprehensive educational initiatives.

Educational institutions at all levels are responding by integrating digital literacy into their curricula. These programs aim to develop not only technical proficiency but also critical thinking skills necessary to evaluate online information. The most effective approaches combine hands-on technical training with broader discussions about digital citizenship, privacy, and security.

While some critics argue that the emphasis on digital skills may come at the expense of traditional learning, proponents maintain that digital literacy complements rather than replaces foundational skills like reading, writing, and critical thinking. In fact, research suggests that well-designed digital literacy programs can enhance these traditional competencies.

As technology continues to evolve, so too must our understanding of what constitutes digital literacy. What began as basic computer skills has expanded to include media literacy, information literacy, and computational thinking. This dynamic nature of digital literacy presents both challenges and opportunities for educators and policymakers committed to preparing citizens for full participation in the digital age.`;
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
    let readingPassage = null;
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
      // Preprocess questions to ensure they have labels, then shuffle
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
      // Preprocess mock questions to add labels, then shuffle them
      const preprocessedMockQuestions = mockQuestions[
        sectionId as keyof typeof mockQuestions
      ].map((question) => preprocessQuestion(question));

      const shuffledMockQuestions = preprocessedMockQuestions.map((question) =>
        shuffleOptions(question)
      );

      return NextResponse.json({
        questions: shuffledMockQuestions,
        readingPassage:
          sectionId === "reading"
            ? `Digital literacy has become an essential skill in today's rapidly evolving technological landscape. As our society becomes increasingly dependent on digital tools and platforms, the ability to navigate, evaluate, and create digital content has transformed from a specialized skill to a fundamental requirement for full participation in civic, economic, and social life.

Research indicates that individuals with strong digital literacy skills have greater access to educational opportunities, higher earning potential, and more civic engagement. Despite this, significant disparities in digital literacy persist across demographic groups, creating what experts refer to as the "digital divide." This gap threatens to exacerbate existing social inequalities if not addressed through comprehensive educational initiatives.

Educational institutions at all levels are responding by integrating digital literacy into their curricula. These programs aim to develop not only technical proficiency but also critical thinking skills necessary to evaluate online information. The most effective approaches combine hands-on technical training with broader discussions about digital citizenship, privacy, and security.

While some critics argue that the emphasis on digital skills may come at the expense of traditional learning, proponents maintain that digital literacy complements rather than replaces foundational skills like reading, writing, and critical thinking. In fact, research suggests that well-designed digital literacy programs can enhance these traditional competencies.

As technology continues to evolve, so too must our understanding of what constitutes digital literacy. What began as basic computer skills has expanded to include media literacy, information literacy, and computational thinking. This dynamic nature of digital literacy presents both challenges and opportunities for educators and policymakers committed to preparing citizens for full participation in the digital age.`
            : null,
      });
    }

    return NextResponse.json(
      { error: "Failed to retrieve questions" },
      { status: 500 }
    );
  }
}
