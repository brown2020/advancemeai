import { gradeSectionAnswers } from "./grade-section";

describe("gradeSectionAnswers", () => {
  it("counts only exact matches against stored questions", () => {
    const result = gradeSectionAnswers(
      [
        { id: "a", correctAnswer: "B" },
        { id: "b", correctAnswer: "C" },
      ],
      { a: "B", b: "A", extra: "C" }
    );
    expect(result).toEqual({ score: 1, totalQuestions: 2 });
  });
});
