import { aggregateClassProgress } from "./class-progress-aggregate";

describe("aggregateClassProgress", () => {
  const sharedSets = [
    { id: "set-a", title: "SAT Vocab", totalCards: 10 },
    { id: "set-b", title: "Math", totalCards: 5 },
  ];

  it("returns empty stats when there are no students", () => {
    const result = aggregateClassProgress(sharedSets, [], {}, {});
    expect(result.totalStudents).toBe(0);
    expect(result.studentSummaries).toHaveLength(0);
    expect(result.setStatistics[0]?.studentsStarted).toBe(0);
  });

  it("counts started and completed students per set", () => {
    const studentIds = ["student-1", "student-2"];
    const progressByStudent = {
      "student-1": {
        "set-a": {
          masteryByCardId: {
            c1: 3,
            c2: 3,
            c3: 3,
            c4: 3,
            c5: 3,
            c6: 3,
            c7: 3,
            c8: 3,
            c9: 0,
            c10: 0,
          },
          updatedAt: Date.now(),
        },
      },
      "student-2": {
        "set-a": {
          masteryByCardId: { c1: 1 },
          updatedAt: Date.now() - 1000,
        },
      },
    };

    const result = aggregateClassProgress(
      sharedSets,
      studentIds,
      progressByStudent,
      {
        "student-1": { displayName: "Alex" },
        "student-2": { displayName: "Sam" },
      }
    );

    expect(result.setStatistics[0]?.studentsStarted).toBe(2);
    expect(result.setStatistics[0]?.studentsCompleted).toBe(1);
    expect(result.studentSummaries[0]?.displayName).toBe("Alex");
    expect(result.studentSummaries[0]?.overallMastery).toBeGreaterThan(0);
  });
});
