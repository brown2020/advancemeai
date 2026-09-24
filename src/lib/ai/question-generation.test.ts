import {
  generateQuestions,
  labelAndShuffle,
  preprocessQuestion,
  type Question,
} from "./question-generation";

const unlabeled: Question = {
  id: "q1",
  text: "2 + 2 = ?",
  options: ["3", "4", "5", "6"],
  correctAnswer: "4",
  explanation: "2 + 2 = 4",
  difficulty: 1,
};

describe("preprocessQuestion", () => {
  it("adds A)–D) labels and relabels the correct answer", () => {
    const result = preprocessQuestion(unlabeled);
    expect(result.options).toEqual(["A) 3", "B) 4", "C) 5", "D) 6"]);
    expect(result.correctAnswer).toBe("B) 4");
  });

  it("leaves already-labeled questions unchanged", () => {
    const labeled = preprocessQuestion(unlabeled);
    expect(preprocessQuestion(labeled)).toEqual(labeled);
  });
});

describe("labelAndShuffle", () => {
  it("keeps the correct answer pointing at the same content", () => {
    for (let i = 0; i < 25; i++) {
      const result = labelAndShuffle(unlabeled);
      expect(result.options).toHaveLength(4);
      expect(result.options).toContain(result.correctAnswer);
      expect(result.correctAnswer).toMatch(/^[A-D]\) 4$/);
      expect(result.options.map((o) => o.slice(3)).sort()).toEqual(["3", "4", "5", "6"]);
    }
  });
});

describe("generateQuestions", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  it("returns no questions when OpenAI is not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(generateQuestions("math", 3)).resolves.toEqual([]);
  });
});
