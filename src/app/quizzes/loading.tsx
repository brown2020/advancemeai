import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="Quiz Library" />
      <LoadingState message="Loading quizzes..." />
    </PageContainer>
  );
}

