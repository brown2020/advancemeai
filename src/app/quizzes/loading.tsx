import { PageContainer, PageHeader } from "@/components/common/UIComponents";
import { QuizLibrarySkeleton } from "@/components/quizzes/QuizLibrary";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="Quizzes" description="Quick multiple-choice checks on what you know." />
      <QuizLibrarySkeleton />
    </PageContainer>
  );
}
