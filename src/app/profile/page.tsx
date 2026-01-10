import { Suspense } from "react";
import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";
import { getServerSession } from "@/lib/server-session";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import ProfileClient from "./ProfileClient";

function ProfileFallback() {
  return (
    <PageContainer>
      <PageHeader title="Profile" />
      <LoadingState message="Loading profile..." />
    </PageContainer>
  );
}

export default async function ProfilePage() {
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    return (
      <PageContainer>
        <PageHeader title="Profile" />
        <SignInGate
          title="Sign in to view your Profile"
          description="Access your account settings, track your progress, and manage your preferences."
          icon={SignInGateIcons.profile}
          buttonStyle="profile"
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
