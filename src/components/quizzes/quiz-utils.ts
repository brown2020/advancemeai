/** "A", "B", "C", ... for answer option indexes. */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** Encouragement line shown on quiz results. */
export function scoreMessage(correct: number, total: number): string {
  if (total > 0 && correct === total) return "Perfect score! Excellent work!";
  if (correct >= total * 0.7) return "Great job!";
  return "Keep practicing!";
}

export type TakeableQuestion = {
  text: string;
  options: string[];
  correctAnswer: string;
};

export type TakeableQuiz = {
  id: string;
  title: string;
  questions: TakeableQuestion[];
};

/** Answers keyed by question index. */
export type QuizAnswers = Record<number, string>;

export function countCorrect(quiz: TakeableQuiz, answers: QuizAnswers): number {
  return quiz.questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.correctAnswer ? 1 : 0),
    0
  );
}
