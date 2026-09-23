import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/common/UIComponents";

export default function Loading() {
  return (
    <PageContainer width="narrow">
      <PageHeader title="Profile" description="Manage your account and preferences." />
      <div className="space-y-6" aria-busy="true">
        <span className="sr-only">Loading profile…</span>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </PageContainer>
  );
}
