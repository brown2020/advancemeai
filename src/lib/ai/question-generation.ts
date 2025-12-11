/**
 * Shared AI question generation utilities
 * Extracted from API routes to maintain DRY principles
 */

import OpenAI from "openai";

// Initialize OpenAI client (lazy initialization for server-side only)
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * SAT-specific question templates by difficulty level
 */
export const WRITING_TEMPLATES: Record<number, string[]> = {
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

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: number | string;
  explanation?: string;
  section?: string;
}

/**
 * Get human-readable section name for prompts
 */
export function getSectionPrompt(section: string): string {
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

/**
 * Validate AI-generated questions for consistency
 */
export function validateQuestion(
  question: Question,
  section: string
): Question {
  // Basic format validation
  if (!question.options.includes(question.correctAnswer)) {
    throw new Error("Correct answer must match one of the options exactly");
  }

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
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("Answer validation failed:", {
        correctLetter,
        correctContent,
        explanation: explanationLower,
        isGrammarQuestion,
      });
    }
    throw new Error("Explanation must reference the correct answer");
  }

  return question;
}

/**
 * Build the prompt for question generation
 */
export function buildQuestionPrompt(
  section: string,
  difficulty: Difficulty
): string {
  const sectionPrompt = getSectionPrompt(section);
  const templates =
    section.toLowerCase() === "writing" ? WRITING_TEMPLATES[difficulty] : [];

  return `Generate a single, authentic SAT ${sectionPrompt} question.

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
}

/**
 * System prompt for SAT question generation
 */
export const SYSTEM_PROMPT = `You are an expert SAT test writer with years of experience creating official SAT questions. 
Respond with raw JSON only. Make questions exactly match official SAT style and difficulty.`;

/**
 * Generate a single AI question
 */
export async function generateSingleQuestion(
  section: string,
  difficulty: Difficulty
): Promise<Question> {
  const openai = getOpenAIClient();
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

  return validateQuestion(question, section);
}

/**
 * Shuffle options while tracking the correct answer
 */
export function shuffleOptions(question: Question): Question {
  const questionCopy = { ...question };

  // Extract the actual answer content without the labels
  const answerContents = questionCopy.options.map((option: string) => {
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

  // Fisher-Yates shuffle
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
    const correctAnswerIndex = questionCopy.options.findIndex(
      (option: string) => option.includes(`) ${questionCopy.correctAnswer}`)
    );
    if (correctAnswerIndex >= 0) {
      questionCopy.correctAnswer = questionCopy.options[correctAnswerIndex];
    }
  }

  return questionCopy;
}

/**
 * Clean AI-generated options by removing labels if present
 */
export function cleanAIGeneratedQuestion(question: Question): Question {
  const questionCopy = { ...question };

  const hasLabels = questionCopy.options.every((option: string) =>
    /^[A-D]\)\s/.test(option)
  );

  if (hasLabels) {
    questionCopy.options = questionCopy.options.map((option: string) => {
      const match = option.match(/^[A-D]\)\s(.+)$/);
      return match ? match[1] : option;
    });

    const correctAnswerMatch =
      questionCopy.correctAnswer.match(/^[A-D]\)\s(.+)$/);
    if (correctAnswerMatch) {
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
      model: "gpt-4o",
      temperature: 0.8,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content received from OpenAI");

    return content.trim();
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Error generating reading passage:", error);
    }
    return DEFAULT_READING_PASSAGE;
  }
}

