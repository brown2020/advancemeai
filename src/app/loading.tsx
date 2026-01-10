import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="Loading" />
      <LoadingState message="Loading..." />
    </PageContainer>
  );
}

