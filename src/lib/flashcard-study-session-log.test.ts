import {
  appendRecentSession,
  parseRecentSessions,
} from "./flashcard-study-session-log";

describe("flashcard-study-session-log", () => {
  it("filters invalid stored session rows", () => {
    expect(
      parseRecentSessions([
        { completedAt: 1000, durationSeconds: 30 },
        { completedAt: 2000, durationSeconds: 0 },
        { completedAt: 0, durationSeconds: 10 },
        { completedAt: 3000, durationSeconds: 7.8 },
        null,
      ])
    ).toEqual([
      { completedAt: 1000, durationSeconds: 30 },
      { completedAt: 3000, durationSeconds: 7 },
    ]);
  });

  it("appends a normalized session and keeps only the newest logs", () => {
    const existing = [
      { completedAt: 1000, durationSeconds: 10 },
      { completedAt: 2000, durationSeconds: 20 },
    ];

    expect(
      appendRecentSession(
        existing,
        { completedAt: 3000.9, durationSeconds: 30.7 },
        2
      )
    ).toEqual([
      { completedAt: 2000, durationSeconds: 20 },
      { completedAt: 3000, durationSeconds: 30 },
    ]);
  });
});
