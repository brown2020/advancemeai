import { gradeSectionAnswers } from "./grade-section";

const readingQuestion = {
  id: "r1",
  options: [
    "A) The author's childhood experiences",
    "B) The importance of education",
    "C) The development of a new theory",
    "D) The impact of technology on society",
  ],
  correctAnswer: "D) The impact of technology on society",
};

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

  it("scores a correct D as 1 of 1, using the option index not a 1-based letter", () => {
    expect(gradeSectionAnswers([readingQuestion], { r1: readingQuestion.correctAnswer })).toEqual({
      score: 1,
      totalQuestions: 1,
    });
    expect(gradeSectionAnswers([readingQuestion], { r1: "D" })).toEqual({
      score: 1,
      totalQuestions: 1,
    });
    expect(gradeSectionAnswers([readingQuestion], { r1: "C" })).toEqual({
      score: 0,
      totalQuestions: 1,
    });
    expect(gradeSectionAnswers([readingQuestion], { r1: "4" })).toEqual({
      score: 0,
      totalQuestions: 1,
    });
  });
});
