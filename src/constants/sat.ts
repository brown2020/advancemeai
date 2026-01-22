export const DIGITAL_SAT_SECTIONS = [
  {
    id: "reading-writing",
    title: "Reading & Writing",
    description:
      "Two adaptive modules focused on comprehension, grammar, and rhetoric.",
    questionCount: 5,
    timeLimitMinutes: 64,
  },
  {
    id: "math",
    title: "Math",
    description:
      "Two adaptive modules covering algebra, problem solving, and advanced math.",
    questionCount: 5,
    timeLimitMinutes: 70,
  },
] as const;

export type DigitalSatSection = (typeof DIGITAL_SAT_SECTIONS)[number];
