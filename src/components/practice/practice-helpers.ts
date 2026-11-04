const MICRO_LESSONS: Record<string, string[]> = {
  writing: [
    "Remember: independent clauses joined by a comma need a conjunction or semicolon.",
    "Parallel structure matters—ensure each list item uses the same grammatical form.",
    "Modifiers go next to what they modify; misplaced phrases cause ambiguity.",
  ],
  reading: [
    "Scan for line references before reading answer choices to ground your evidence.",
    "Tone words in questions hint at whether the correct answer is positive or critical.",
  ],
  "math-no-calc": [
    "Look for opportunities to factor or use substitution before expanding expressions.",
    "Translate word problems into equations step by step; define variables clearly.",
  ],
  "math-calc": [
    "Graphing in your head? Plot intercepts and vertex to understand the curve quickly.",
    "Units matter—convert before applying formulas to avoid scaling mistakes.",
  ],
};

export function getRandomMicroLessonTip(sectionId: string): string | null {
  const tips = MICRO_LESSONS[sectionId];
  if (!tips || tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)] ?? null;
}

export function formatTimer(remainingSeconds: number | null): string | null {
  if (remainingSeconds === null) return null;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
