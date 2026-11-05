export type GradedQuestion = {
  id: string;
  correctAnswer: string;
  options?: readonly string[];
};

/** A, B, C... as a zero-based option index. D is 3, not 4. */
export function choiceLetterIndex(letter: string): number | null {
  if (!/^[A-F]$/i.test(letter)) return null;
  return letter.toUpperCase().charCodeAt(0) - 65;
}

/**
 * A selection matches when it is the stored correct option.
 * A bare choice letter (the A–D control) maps to that option's index.
 */
export function answerMatchesQuestion(
  question: Pick<GradedQuestion, "correctAnswer" | "options">,
  selected: string
): boolean {
  if (selected === question.correctAnswer) return true;
  if (selected.length !== 1 || !question.options) return false;
  const index = choiceLetterIndex(selected);
  if (index === null) return false;
  return question.options[index] === question.correctAnswer;
}

export function gradeSectionAnswers(
  questions: GradedQuestion[],
  answers: Record<string, string>
): { score: number; totalQuestions: number } {
  let score = 0;
  for (const question of questions) {
    const answer = answers[question.id];
    if (typeof answer === "string" && answerMatchesQuestion(question, answer)) {
      score += 1;
    }
  }
  return { score, totalQuestions: questions.length };
}
