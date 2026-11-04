import type { Question } from "@/types/question";
import type { FullTestSession } from "@/types/practice-test";
import { fetchFullTestSection } from "@/services/practiceTestService";
import { fetchPracticeQuestions } from "./fullTestHelpers";

type SectionBundle = {
  questions: Question[];
  readingPassage: string | null;
};

export async function fetchSectionBundle(
  session: FullTestSession,
  section: FullTestSession["sections"][number]
): Promise<SectionBundle> {
  if (session.id.startsWith("local-")) return fetchLocalSection(section);
  const sectionData = await fetchFullTestSection(session.id, section.id);
  return {
    questions: sectionData.questions ?? [],
    readingPassage: sectionData.readingPassage ?? null,
  };
}

async function fetchLocalSection(
  section: FullTestSession["sections"][number]
): Promise<SectionBundle> {
  if (section.id !== "reading-writing") {
    const mathData = await fetchPracticeQuestions("math-calc", section.questionCount);
    return { questions: mathData.questions ?? [], readingPassage: null };
  }

  const readingCount = Math.ceil(section.questionCount / 2);
  const writingCount = Math.max(section.questionCount - readingCount, 0);
  const [readingData, writingData] = await Promise.all([
    fetchPracticeQuestions("reading", readingCount),
    fetchPracticeQuestions("writing", writingCount),
  ]);
  return {
    questions: [...(readingData.questions ?? []), ...(writingData.questions ?? [])],
    readingPassage: readingData.readingPassage ?? null,
  };
}
