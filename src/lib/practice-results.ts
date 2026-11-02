export interface PracticeAnswerResults {
  score: number;
  totalAnswered: number;
  correctAnswers: string[];
  answeredQuestionIds: string[];
}

/**
 * Perfect-run copy is only earned when every question was answered correctly.
 * A 0/0 or 0/1 result is not a perfect run.
 */
export function isPerfectPracticeRun(score: number, totalQuestions: number): boolean {
  return totalQuestions > 0 && score === totalQuestions;
}

export function recordPracticeAnswerResult(
  results: PracticeAnswerResults,
  questionId: string,
  isCorrect: boolean
): PracticeAnswerResults {
  const hasAnswered = results.answeredQuestionIds.includes(questionId);
  const wasCorrect = results.correctAnswers.includes(questionId);

  if (!hasAnswered) {
    return {
      ...results,
      score: results.score + (isCorrect ? 1 : 0),
      totalAnswered: results.totalAnswered + 1,
      answeredQuestionIds: [...results.answeredQuestionIds, questionId],
      correctAnswers: isCorrect
        ? [...results.correctAnswers, questionId]
        : results.correctAnswers,
    };
  }

  if (wasCorrect === isCorrect) {
    return results;
  }

  if (isCorrect) {
    return {
      ...results,
      score: results.score + 1,
      correctAnswers: [...results.correctAnswers, questionId],
    };
  }

  return {
    ...results,
    score: Math.max(0, results.score - 1),
    correctAnswers: results.correctAnswers.filter((id) => id !== questionId),
  };
}
