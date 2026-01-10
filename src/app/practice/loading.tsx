import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="SAT Practice Tests" />
      <LoadingState message="Loading practice tests..." />
    </PageContainer>
  );
}

