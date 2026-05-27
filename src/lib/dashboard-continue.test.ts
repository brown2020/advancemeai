import { pickContinueStudying } from "./dashboard-continue";

describe("pickContinueStudying", () => {
  it("returns null when no activity", () => {
    expect(pickContinueStudying(null, null)).toBeNull();
  });

  it("prefers newer practice activity", () => {
    const result = pickContinueStudying(
      { sectionId: "reading", at: 2000 },
      { setId: "set-1", title: "Biology", at: 1000 }
    );
    expect(result?.type).toBe("practice");
    expect(result?.href).toBe("/practice/reading");
  });

  it("prefers newer flashcard activity", () => {
    const result = pickContinueStudying(
      { sectionId: "math-calc", at: 1000 },
      { setId: "set-2", title: "SAT Vocab", at: 3000 }
    );
    expect(result?.type).toBe("flashcards");
    expect(result?.href).toBe("/flashcards/set-2");
    expect(result?.title).toBe("SAT Vocab");
  });
});
