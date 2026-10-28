import { applyGamificationAward } from "./gamification-award";

describe("applyGamificationAward", () => {
  it("caps a session and ignores extra correct answers", () => {
    const next = applyGamificationAward(
      null,
      {
        kind: "session",
        cardsStudied: 10_000,
        cardsMastered: 0,
        questionsAnswered: 0,
        questionsCorrect: 50,
        isPerfectScore: false,
        durationSeconds: 0,
        isFullTest: false,
        now: Date.parse("2026-01-02T15:00:00Z"),
      },
      "user-1"
    );

    expect(next.totalCardsStudied).toBe(200);
    expect(next.totalQuestionsAnswered).toBe(0);
    expect(next.xp).toBeGreaterThan(0);
    expect(next.userId).toBe("user-1");
  });

  it("does not unlock speed-demon from the achievement event alone", () => {
    const next = applyGamificationAward(
      null,
      {
        kind: "achievement",
        achievementId: "speed-demon",
        now: Date.parse("2026-01-02T15:00:00Z"),
      },
      "user-1"
    );
    expect(next.achievements).not.toContain("speed-demon");
  });
});