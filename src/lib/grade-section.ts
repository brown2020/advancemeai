export type GradedQuestion = {
  id: string;
  correctAnswer: string;
};

export function gradeSectionAnswers(
  questions: GradedQuestion[],
  answers: Record<string, string>
): { score: number; totalQuestions: number } {
  let score = 0;
  for (const question of questions) {
    const answer = answers[question.id];
    if (typeof answer === "string" && answer === question.correctAnswer) {
      score += 1;
    }
  }
  return { score, totalQuestions: questions.length };
}
