import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader eyebrow="SAT Prep" title="Practice that adapts to you" />
      <LoadingState message="Loading SAT Prep..." />
    </PageContainer>
  );
}

