import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="Authentication" />
      <LoadingState message="Loading..." />
    </PageContainer>
  );
}

