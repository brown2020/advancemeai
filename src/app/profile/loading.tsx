import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="Profile" />
      <LoadingState message="Loading profile..." />
    </PageContainer>
  );
}

