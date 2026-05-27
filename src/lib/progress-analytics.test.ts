import {
  buildMasteryBreakdown,
  buildProgressAnalytics,
  buildStudyCalendar,
  buildTopicPerformance,
  buildWeeklyMinutes,
} from "./progress-analytics";
import type { FlashcardSet } from "@/types/flashcard";

describe("progress-analytics", () => {
  it("maps activity counts to heatmap intensity", () => {
    expect(buildStudyCalendar({ "2026-01-01": 1 })).toEqual({
      "2026-01-01": 1,
    });
    expect(buildStudyCalendar({ "2026-01-02": 8 })).toEqual({
      "2026-01-02": 4,
    });
  });

  it("aggregates weekly minutes for the last seven days", () => {
    const ref = new Date("2026-05-27T12:00:00Z");
    const weekly = buildWeeklyMinutes(
      {
        "2026-05-27": 30,
        "2026-05-26": 15,
      },
      ref
    );
    expect(weekly.reduce((sum, v) => sum + v, 0)).toBe(45);
  });

  it("builds mastery buckets from flashcard progress", () => {
    const sets: FlashcardSet[] = [
      {
        id: "set-1",
        title: "Test",
        description: "",
        cards: [
          { id: "c1", term: "a", definition: "b", createdAt: 0 },
          { id: "c2", term: "c", definition: "d", createdAt: 0 },
        ],
        userId: "u1",
        createdAt: 0,
        updatedAt: 0,
        isPublic: false,
      },
    ];

    const mastery = buildMasteryBreakdown(sets, [
      { setId: "set-1", masteryByCardId: { c1: 3, c2: 1 } },
    ]);

    expect(mastery.mastered).toBe(1);
    expect(mastery.learning).toBe(1);
    expect(mastery.notStarted).toBe(0);
  });

  it("builds topic performance from practice attempts", () => {
    const topics = buildTopicPerformance([
      {
        id: "a1",
        userId: "u1",
        sectionId: "reading",
        questionId: "q1",
        mode: "micro",
        isCorrect: true,
        timeSpentMs: 60_000,
        createdAt: Date.now(),
      },
      {
        id: "a2",
        userId: "u1",
        sectionId: "reading",
        questionId: "q2",
        mode: "micro",
        isCorrect: false,
        timeSpentMs: 45_000,
        createdAt: Date.now(),
      },
    ]);

    expect(topics[0]?.topic).toContain("Reading");
    expect(topics[0]?.total).toBe(2);
    expect(topics[0]?.correct).toBe(1);
  });

  it("reports hasActivity when inputs are empty", () => {
    const result = buildProgressAnalytics([], [], []);
    expect(result.hasActivity).toBe(false);
    expect(result.topicData).toHaveLength(0);
  });
});
