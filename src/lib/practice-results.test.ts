import {
  recordPracticeAnswerResult,
  type PracticeAnswerResults,
} from "./practice-results";

function emptyResults(): PracticeAnswerResults {
  return {
    score: 0,
    totalAnswered: 0,
    correctAnswers: [],
    answeredQuestionIds: [],
  };
}

describe("recordPracticeAnswerResult", () => {
  it("counts a first correct answer", () => {
    const results = recordPracticeAnswerResult(emptyResults(), "q1", true);

    expect(results).toEqual({
      score: 1,
      totalAnswered: 1,
      correctAnswers: ["q1"],
      answeredQuestionIds: ["q1"],
    });
  });

  it("counts a later first attempt even when other questions were answered", () => {
    const first = recordPracticeAnswerResult(emptyResults(), "q1", true);
    const second = recordPracticeAnswerResult(first, "q2", false);

    expect(second.score).toBe(1);
    expect(second.totalAnswered).toBe(2);
    expect(second.correctAnswers).toEqual(["q1"]);
    expect(second.answeredQuestionIds).toEqual(["q1", "q2"]);
  });

  it("updates score without recounting when an answered question changes to correct", () => {
    const first = recordPracticeAnswerResult(emptyResults(), "q1", false);
    const corrected = recordPracticeAnswerResult(first, "q1", true);

    expect(corrected.score).toBe(1);
    expect(corrected.totalAnswered).toBe(1);
    expect(corrected.correctAnswers).toEqual(["q1"]);
    expect(corrected.answeredQuestionIds).toEqual(["q1"]);
  });

  it("updates score without recounting when a correct answer changes to incorrect", () => {
    const first = recordPracticeAnswerResult(emptyResults(), "q1", true);
    const changed = recordPracticeAnswerResult(first, "q1", false);

    expect(changed.score).toBe(0);
    expect(changed.totalAnswered).toBe(1);
    expect(changed.correctAnswers).toEqual([]);
    expect(changed.answeredQuestionIds).toEqual(["q1"]);
  });
});
