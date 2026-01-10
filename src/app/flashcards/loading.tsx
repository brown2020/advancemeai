import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="Flashcards" />
      <LoadingState message="Loading flashcards..." />
    </PageContainer>
  );
}

