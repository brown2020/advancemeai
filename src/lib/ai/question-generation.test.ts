import { MOCK_QUESTIONS } from "@/constants/mockQuestions";
import { QUESTION_MODEL } from "./openai";
import {
  DEFAULT_READING_PASSAGE,
  correctChoiceLetter,
  assertGeneratedQuestion,
  computedAnswer,
  deliverQuestion,
  explanationMatchesCorrectAnswer,
  explanationSignalsMismatch,
  generateQuestion,
  generateQuestions,
  labelAndShuffle,
  lettersClaimedCorrect,
  preprocessQuestion,
  questionBelongsToPassage,
  shuffleOptions,
  type Question,
} from "./question-generation";

const create = jest.fn();

jest.mock("./openai", () => {
  const actual = jest.requireActual<typeof import("./openai")>("./openai");
  return {
    ...actual,
    getOpenAIClient: () => ({
      chat: { completions: { create } },
    }),
  };
});

function completion(payload: unknown) {
  return { choices: [{ message: { content: JSON.stringify(payload) } }] };
}

const consistentMath = {
  text: "If 2x + 3 = 11, what is the value of x?",
  options: ["A) 4", "B) 5", "C) 6", "D) 7"],
  correctAnswer: "A) 4",
  explanation:
    "Subtract 3 from both sides: 2x = 8. Divide by 2: x = 4. Choice A is correct.",
  id: "generated",
  section: "math",
};

const letterMismatch = {
  ...consistentMath,
  correctAnswer: "C) 6",
  explanation: "Choice A is correct because x = 4.",
};

const offPassage = {
  text: "What role do mitochondria play in producing cellular energy?",
  options: [
    "A) They store oxygen",
    "B) They produce ATP",
    "C) They digest proteins",
    "D) They copy DNA",
  ],
  correctAnswer: "B) They produce ATP",
  explanation:
    "Mitochondria produce ATP during cellular respiration inside the cell.",
  id: "mito",
  section: "reading",
  difficulty: 2,
};

const onPassage = {
  text: "According to the passage, why does digital literacy matter?",
  options: [
    "A) It replaces reading",
    "B) It is essential for participation in modern society",
    "C) It is only a technical hobby",
    "D) It removes the need for schools",
  ],
  correctAnswer: "B) It is essential for participation in modern society",
  explanation:
    "The passage says digital literacy is essential for civic, economic, and social participation.",
  id: "digital",
  section: "reading",
  difficulty: 2,
};

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

describe("shuffleOptions", () => {
  const cited: Question = {
    id: "cited",
    text: "Which value matches?",
    options: ["A) alpha", "B) beta", "C) gamma", "D) delta"],
    correctAnswer: "A) alpha",
    explanation:
      "Choice A is correct because alpha matches. Option C is only a distractor.",
    difficulty: 1,
  };

  it("rewrites the explanation letter so it equals the shuffled correctAnswer", () => {
    const random = jest.spyOn(Math, "random");
    // Fisher-Yates from the end: no-op, no-op, then swap index 0 with 1.
    random.mockReturnValueOnce(0.9).mockReturnValueOnce(0.9).mockReturnValueOnce(0);

    const result = shuffleOptions(cited);
    random.mockRestore();

    expect(result.correctAnswer).toBe("B) alpha");
    expect(result.options[0]).toBe("A) beta");
    expect(result.explanation).toBe(
      "Choice B is correct because alpha matches. Option C is only a distractor."
    );
    expect(lettersClaimedCorrect(result.explanation ?? "")).toEqual(["B"]);
    expect(correctChoiceLetter(result.correctAnswer)).toBe("B");
    expect(explanationMatchesCorrectAnswer(result)).toBe(true);
  });

  it("rewrites mixed letters so the correct one still equals correctAnswer", () => {
    const random = jest.spyOn(Math, "random");
    random.mockReturnValueOnce(0.9).mockReturnValueOnce(0.9).mockReturnValueOnce(0);

    const result = shuffleOptions({
      ...cited,
      correctAnswer: "B) beta",
      explanation:
        "A is wrong. Choice B is correct because beta matches, and C is not.",
    });
    random.mockRestore();

    expect(result.correctAnswer).toBe("A) beta");
    expect(result.explanation).toBe(
      "B is wrong. Choice A is correct because beta matches, and C is not."
    );
    expect(lettersClaimedCorrect(result.explanation ?? "")).toEqual(["A"]);
    expect(explanationMatchesCorrectAnswer(result)).toBe(true);
  });

  it("keeps the explanation letter equal to correctAnswer across shuffles", () => {
    for (let i = 0; i < 30; i += 1) {
      const result = shuffleOptions(cited);
      const letter = correctChoiceLetter(result.correctAnswer);
      expect(lettersClaimedCorrect(result.explanation ?? "")).toEqual([letter]);
      expect(explanationMatchesCorrectAnswer(result)).toBe(true);
      expect(result.correctAnswer.endsWith("alpha")).toBe(true);
    }
  });
});

describe("explanationMatchesCorrectAnswer", () => {
  const base: Question = {
    id: "letter",
    text: "Which choice is right?",
    options: ["A) alpha", "B) beta", "C) gamma", "D) delta"],
    correctAnswer: "C) gamma",
    explanation: "Choice A is correct.",
    difficulty: 1,
  };

  it("rejects an explanation that names a different letter than correctAnswer", () => {
    expect(explanationMatchesCorrectAnswer(base)).toBe(false);
  });

  it("accepts an explanation that names the scored letter", () => {
    expect(
      explanationMatchesCorrectAnswer({
        ...base,
        correctAnswer: "A) alpha",
        explanation: "Choice A is correct because alpha matches.",
      })
    ).toBe(true);
  });

  it("accepts an explanation that does not name a letter", () => {
    expect(
      explanationMatchesCorrectAnswer({
        ...base,
        explanation: "Gamma is the matching value.",
      })
    ).toBe(true);
  });
});

describe("questionBelongsToPassage", () => {
  it("rejects a question about a different topic than its passage", () => {
    expect(questionBelongsToPassage(offPassage, DEFAULT_READING_PASSAGE)).toBe(
      false
    );
  });

  it("accepts a question that uses the passage's subject", () => {
    expect(questionBelongsToPassage(onPassage, DEFAULT_READING_PASSAGE)).toBe(
      true
    );
  });
});

describe("deliverQuestion", () => {
  const cited: Question = {
    id: "pin",
    text: "Which sentence uses punctuation correctly?",
    options: [
      "A) The cat, jumped over the fence.",
      'B) She said, "I\'ll be there soon."',
      "C) They went to the store they bought milk.",
      "D) He asked, if she was coming to the party.",
    ],
    correctAnswer: 'B) She said, "I\'ll be there soon."',
    explanation:
      "Option B correctly uses a comma after 'said' and properly punctuates the quoted speech.",
    difficulty: 2,
  };

  it("drops an item whose explanation letter disagrees with the scored answer", () => {
    expect(
      deliverQuestion({
        ...cited,
        correctAnswer: "C) They went to the store they bought milk.",
        explanation: "Choice A is correct.",
      })
    ).toBeNull();
  });

  it("drops an item with no explanation", () => {
    expect(deliverQuestion({ ...cited, explanation: "  " })).toBeNull();
  });

  it("rewrites a cited letter to the scored choice after shuffling", () => {
    for (let i = 0; i < 20; i += 1) {
      const delivered = deliverQuestion(cited);
      const letter = correctChoiceLetter(delivered?.correctAnswer ?? "");
      expect(letter).toBeTruthy();
      expect(delivered?.explanation).toContain(`Option ${letter} correctly`);
      expect(lettersClaimedCorrect(delivered?.explanation ?? "")).toEqual([
        letter,
      ]);
      expect(explanationMatchesCorrectAnswer(delivered!)).toBe(true);
      expect(delivered?.options).toContain(delivered?.correctAnswer);
    }
  });

  it("drops a reading item that does not belong to the passage", () => {
    expect(deliverQuestion(offPassage, DEFAULT_READING_PASSAGE)).toBeNull();
  });

  it("keeps the built-in reading questions with the default passage", () => {
    for (const question of MOCK_QUESTIONS.reading ?? []) {
      const delivered = deliverQuestion(question, DEFAULT_READING_PASSAGE);
      expect(delivered).not.toBeNull();
      expect(explanationMatchesCorrectAnswer(delivered!)).toBe(true);
    }
  });
});

const periodChoices = ["A) 1.5", "B) 2.5", "C) -1.5", "D) -2.5"];

describe("assertGeneratedQuestion", () => {
  const period = {
    text: "If f(x + 2) = f(x) for every x, which of the following could be a period of f?",
    options: periodChoices,
    correctAnswerIndex: 1,
    correctAnswer: "B) 2.5",
    explanation:
      "f(x + 2) = f(x) means the period is 2, not matching the answer choices, let's re-calculate.",
    id: "period",
  };

  it("rejects an explanation that admits the choices do not match", () => {
    expect(explanationSignalsMismatch(period.explanation)).toBe(true);
    expect(computedAnswer(period.explanation)).toBe(2);
    expect(() => assertGeneratedQuestion(period)).toThrow(/choices do not match/i);
  });

  it("rejects a computed number that is not one of the choices", () => {
    expect(() =>
      assertGeneratedQuestion({
        ...period,
        explanation: "The equation f(x + 2) = f(x) means the period is 2.",
      })
    ).toThrow(/not among the choices/i);
  });

  it("accepts a computed number that is the marked choice", () => {
    const question = assertGeneratedQuestion({
      ...period,
      explanation: "The equation f(x + 2) = f(x) means the period is 2.5.",
    });
    expect(question.correctAnswer).toBe("B) 2.5");
    expect(question.options).toHaveLength(4);
  });

  it("requires exactly four options and a correctAnswer index among them", () => {
    expect(() =>
      assertGeneratedQuestion({ ...period, options: periodChoices.slice(0, 3) })
    ).toThrow(/exactly 4 options/i);
    expect(() =>
      assertGeneratedQuestion({ ...period, correctAnswerIndex: 4, explanation: "The period is 2.5." })
    ).toThrow(/out of range/i);
    expect(() =>
      assertGeneratedQuestion({
        ...period,
        correctAnswerIndex: 0,
        explanation: "The period is 2.5.",
      })
    ).toThrow(/does not match/i);
  });
});

describe("generateQuestions", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    create.mockReset();
  });

  it("returns no questions when OpenAI is not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(generateQuestions("math", 3)).resolves.toEqual([]);
  });

  it("regenerates a math item whose choices miss the computed period", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    create
      .mockResolvedValueOnce(
        completion({
          text: "If f(x + 2) = f(x) for every x, which could be a period of f?",
          options: periodChoices,
          correctAnswerIndex: 1,
          correctAnswer: "B) 2.5",
          explanation:
            "The period is 2, not matching the answer choices, let's re-calculate.",
        })
      )
      .mockResolvedValueOnce(completion(consistentMath));

    const question = await generateQuestion("math", 2);
    expect(question.correctAnswer).toBe("A) 4");
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ model: QUESTION_MODEL, temperature: 0.7 })
    );
  });

  it("stops after two retries when every response is inconsistent", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    create.mockResolvedValue(
      completion({
        text: "If f(x + 2) = f(x), which could be a period?",
        options: periodChoices,
        correctAnswerIndex: 1,
        correctAnswer: "B) 2.5",
        explanation: "The period is 2.",
      })
    );

    await expect(generateQuestion("math", 2)).rejects.toThrow(/not among the choices/i);
    expect(create).toHaveBeenCalledTimes(3);
  });

  it("regenerates until the explanation letter matches the answer in the same response", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    create
      .mockResolvedValueOnce(completion(letterMismatch))
      .mockResolvedValueOnce(completion({ ...consistentMath, explanation: "" }))
      .mockResolvedValueOnce(completion(consistentMath));

    const question = await generateQuestion("math", 2);
    expect(question.correctAnswer).toBe("A) 4");
    expect(question.explanation).toContain("Choice A is correct");
    expect(create).toHaveBeenCalledTimes(3);
    expect(create.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ model: QUESTION_MODEL })
    );
    expect(JSON.stringify(create.mock.calls[0]?.[0])).toContain(
      "together with correctAnswer"
    );
  });

  it("drops questions that never match their passage", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    create.mockResolvedValue(completion(offPassage));

    await expect(
      generateQuestion("reading", 3, DEFAULT_READING_PASSAGE)
    ).rejects.toThrow(/passage/i);
    expect(create).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(create.mock.calls[0]?.[0])).toContain(
      "Digital literacy"
    );

    await expect(
      generateQuestions("reading", 1, "reading", DEFAULT_READING_PASSAGE)
    ).resolves.toEqual([]);
  });

  it("keeps a regenerated question that belongs to the passage", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    create
      .mockResolvedValueOnce(completion(offPassage))
      .mockResolvedValueOnce(completion(onPassage));

    const questions = await generateQuestions(
      "reading",
      1,
      "reading",
      DEFAULT_READING_PASSAGE
    );
    expect(questions).toHaveLength(1);
    expect(questions[0]?.explanation).toContain("digital literacy");
    expect(
      questionBelongsToPassage(questions[0]!, DEFAULT_READING_PASSAGE)
    ).toBe(true);
  });
});
