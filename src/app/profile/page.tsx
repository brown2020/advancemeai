import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/common/UIComponents";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerSession } from "@/lib/server-session";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import ProfileClient from "./ProfileClient";


export const metadata: Metadata = {
  title: "Profile | AdvanceMe AI",
  description: "Manage your Advance.me account, preferences, and appearance.",
};

function ProfileFallback() {
  return (
    <PageContainer width="narrow">
      <PageHeader title="Profile" />
      <div className="space-y-6" aria-busy="true">
        <span className="sr-only">Loading profile…</span>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </PageContainer>
  );
}

export default async function ProfilePage() {
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    return (
      <PageContainer width="narrow">
        <PageHeader title="Profile" />
        <SignInGate
          title="Sign in to view your Profile"
          description="Access your account settings, track your progress, and manage your preferences."
          icon={SignInGateIcons.profile}
        />
      </PageContainer>
    );
  }

  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileClient authIsGuaranteed={authIsGuaranteed} />
    </Suspense>
  );
}
